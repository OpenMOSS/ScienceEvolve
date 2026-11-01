import { afterEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";
import { CollaborationStateDatabase } from "../../src/core/collaboration-state/index.js";
import { EventHub } from "../../src/core/event-hub.js";
import { AgentInterruptedError } from "../../src/core/codex-runner.js";
import {
  affectedCollaborationGroupIds,
  Orchestrator,
  ProjectConfigurationLockedError,
  WORKER_INVOCATION_FAILURE_LIMIT
} from "../../src/core/orchestrator.js";
import { SkillCatalog } from "../../src/core/skill-catalog.js";
import { ProjectStorage } from "../../src/core/storage.js";
import { MAIN_AGENT_ORCHESTRATION_CURRENT_FILE } from "../../src/core/main-workflow-files.js";
import { ControlActionService, startControlActionBridge } from "../../src/core/orchestration-control-bridge.js";
import { defaultDecisionPlan } from "../../src/core/agent-orchestration.js";
import { updateAgentConfigsSchema } from "../../src/core/validation.js";
import {
  GatewayStore,
  nativeProtocolForHarness,
  type AdapterSmokeProbeRunner
} from "../../src/core/agent-runtime.js";
import { PROTOCOL_ROUTER_COMPATIBILITY_VERSION } from "../../src/core/protocol-router.js";
import type {
  AgentName,
  AgentOrchestrationTemplate,
  AgentRunRequest,
  AgentRunResult,
  AgentRunner,
  MainDecision,
  ProjectState,
  ProjectView,
  TraceSink,
  WorkerResult
} from "../../src/core/types.js";
import type {
  HarnessPurpose,
  PublicHarnessDescriptor,
  SessionRef
} from "../../src/core/harness-runtime/contracts.js";
import type { CollaborationRuntimeLifecycle } from "../../src/core/collaboration-runtime.js";
import {
  HarnessRuntimeError,
  ProtocolRecoveryExhaustedError
} from "../../src/core/harness-runtime/errors.js";
import {
  harnessCatalogRegistry,
  toPublicHarnessDescriptor
} from "../../src/core/harness-runtime/registry.js";
import type { MainAgentOrchestrationDocument } from "../../src/core/agent-orchestration-reconfiguration.js";

const temporaryRoots: string[] = [];
const liveOrchestrators: Orchestrator[] = [];
const builtinSkillRoot = fileURLToPath(
  new URL("../../../.agents/skills", import.meta.url)
);

afterEach(async () => {
  await Promise.allSettled(liveOrchestrators.splice(0).map(orchestrator => orchestrator.shutdown()));
  await Promise.all(
    temporaryRoots.splice(0).map((root) =>
      fs.rm(root, { recursive: true, force: true })
    )
  );
});

type RunnerHandler = (
  request: AgentRunRequest,
  index: number,
  signal: AbortSignal,
  onTrace: TraceSink
) => Promise<AgentRunResult>;

class ScriptedRunner implements AgentRunner {
  readonly calls: AgentRunRequest[] = [];

  constructor(private readonly handler: RunnerHandler) {}

  async harnessCatalog(): Promise<PublicHarnessDescriptor[]> {
    return harnessCatalogRegistry.list().map((descriptor) =>
      toPublicHarnessDescriptor(descriptor, { available: true })
    );
  }

  async run(
    request: AgentRunRequest,
    onTrace: TraceSink,
    signal: AbortSignal
  ): Promise<AgentRunResult> {
    const snapshot = {
      ...request,
      project: structuredClone(request.project)
    };
    this.calls.push(snapshot);
    return this.handler(request, this.calls.length - 1, signal, onTrace);
  }
}

class CatalogScriptedRunner extends ScriptedRunner {
  constructor(
    handler: RunnerHandler,
    private readonly catalog: PublicHarnessDescriptor[]
  ) {
    super(handler);
  }

  async harnessCatalog(): Promise<PublicHarnessDescriptor[]> {
    return structuredClone(this.catalog);
  }
}

function successfulAdapterSmokeProbe(): AdapterSmokeProbeRunner {
  const identity = (harness: string) => ({
    cacheKey: `fixture-cache-${harness}`,
    adapterVersion: "fixture-adapter-1",
    executableFingerprint: `fixture-executable-${harness}`,
    routerCompatibilityVersion: PROTOCOL_ROUTER_COMPATIBILITY_VERSION
  });
  return {
    harnessIds: () => ["codex"],
    nativeProtocol: nativeProtocolForHarness,
    cacheKey: async ({ harness }) => identity(harness),
    runSmoke: async ({ harness }) => identity(harness)
  };
}

function purposeOnlyHarness(
  id: string,
  purpose: Exclude<HarnessPurpose, "workflow">
): PublicHarnessDescriptor {
  return {
    schemaVersion: 1,
    id,
    label: `${purpose} fixture`,
    adapterVersion: "fixture-adapter-1",
    nativeProtocol: "responses",
    purposes: [purpose],
    notes: "Purpose-only Orchestrator preflight fixture.",
    available: true,
    executableFingerprint: `fixture-executable-${id}`,
    capabilities: {
      structuredEvents: true,
      toolResults: true,
      durableSession: true,
      permissionPrompts: ["yolo", "workspace", "compute"],
      workspaceInputs: true,
      autoSkills: true,
      officialEvents: true,
      toolEvents: true,
      usageEvents: true,
      readOnlyExplainer: purpose === "explainer",
      webSearch: true,
      skills: true,
      mcp: true
    }
  };
}

describe("public Main orchestration state machine", () => {
  it.each([false, true])("workflow continuity: restores the exact later Worker after failed commit rollback and retains a concurrent user Pause (%s)", async userPause => {
    let workerInvocation = "", commitFailed = false, rollbackFailed = false;
    const { orchestrator, runner } = await harness(async request => {
      if (request.agent === "worker") {
        workerInvocation = request.invocationId;
        await publishDurableSession(request, "original-worker-history");
        return { threadId: "original-worker-history", handoff: workerResult("worker").markdown };
      }
      return mainResult(request, request.control?.canComplete
        ? decision("finish", "Original Worker result verified") : decision("worker", "Continue the original Worker task"));
    });
    const storage = (orchestrator as unknown as { storage: ProjectStorage }).storage;
    const commit = storage.commitInvocationCommit.bind(storage), rollback = storage.rollbackInvocationCommit.bind(storage);
    vi.spyOn(storage, "commitInvocationCommit").mockImplementation(async (...args) => {
      if (!commitFailed && args[1] === workerInvocation) { commitFailed = true; throw new Error("Temporary Worker commit failure"); }
      return commit(...args);
    });
    vi.spyOn(storage, "rollbackInvocationCommit").mockImplementation(async (...args) => {
      if (!rollbackFailed && args[1] === workerInvocation) { rollbackFailed = true; throw new Error("Temporary Worker rollback failure"); }
      return rollback(...args);
    });
    const restore = storage.retryFailedInvocationRecovery.bind(storage);
    let pauseIssued = false;
    vi.spyOn(storage, "retryFailedInvocationRecovery").mockImplementation(async state => {
      const recovered = await restore(state);
      if (recovered && userPause && !pauseIssued) {
        pauseIssued = true;
        await orchestrator.pause(state.id);
      }
      return recovered;
    });
    const project = await orchestrator.createProject(projectInput(twoAgentOrchestration({
      input: "main", termination: "worker", workerRoutes: [{ target: "finish", kind: "strong" }]
    })));
    await orchestrator.waitForIdle(project.id);
    if (userPause) {
      expect(await orchestrator.getProject(project.id)).toMatchObject({ status: "paused", queuedAgent: "worker",
        pauseRequest: { settledAt: expect.any(String) } });
      expect(runner.calls.map(call => call.agent)).toEqual(["main", "worker"]);
      await orchestrator.resume(project.id);
      await orchestrator.waitForIdle(project.id);
    }
    expect(commitFailed).toBe(true); expect(rollbackFailed).toBe(true);
    expect(runner.calls.map(call => call.agent)).toEqual(["main", "worker", "worker", "main"]);
    const workers = runner.calls.filter(call => call.agent === "worker");
    expect(workers[1].project.activeAgentExecution!.id).toBe(workers[0].project.activeAgentExecution!.id);
    expect(workers[1].resumeThreadId).toBe("original-worker-history");
    expect(await orchestrator.getProject(project.id)).toMatchObject({ status: "completed", executionCounts: { worker: 1, main: 2 } });
  }, 10_000);

  it("keeps the existing writer lease alive during concurrent expensive committed project listings", async () => {
    const { orchestrator, root } = await harness(async request => mainResult(request, decision("finish", "Task complete.")));
    const project = await orchestrator.createProject(projectInput(mainOnlyOrchestration()));
    await orchestrator.waitForIdle(project.id);
    const runtimes = (orchestrator as unknown as { runtimes: Map<string, { state: ProjectState }> }).runtimes;
    const originalRuntime = runtimes.get(project.id)!;
    const cloneIds = Array.from({ length: 24 }, (_, i) => "prj_" + i.toString(16).padStart(32, "0"));
    for (const id of cloneIds) runtimes.set(id, { ...originalRuntime, state: { ...structuredClone(originalRuntime.state), id } });
    const views = orchestrator as unknown as { projectView(state: ProjectState): ProjectView };
    const originalView = views.projectView.bind(orchestrator);
    const slowView = vi.spyOn(views, "projectView").mockImplementation(state => {
      const until = performance.now() + 25;
      while (performance.now() < until) { /* A large synchronous read model. */ }
      return originalView(state);
    });
    const database = CollaborationStateDatabase.open({ databasePath: path.join(root, "listing-heartbeat.sqlite"),
      serviceId: "listing-heartbeat", hostId: "single-test-host", topology: "single-host", leaseDurationMs: 1000 });
    const originalLease = database.writerLease();
    let renewalError: unknown, renewals = 0;
    const timer = setInterval(() => {
      try { database.renewWriterLease(); renewals++; } catch (error) { renewalError = error; }
    }, 100);
    try {
      const lists = await Promise.all([orchestrator.listProjects(), orchestrator.listProjects()]);
      await new Promise<void>(resolve => setTimeout(resolve, 1));
      expect(renewalError).toBeUndefined();
      expect(renewals).toBeGreaterThan(0);
      expect(() => database.assertWriterLeaseHeld()).not.toThrow();
      expect(database.writerLease()).toMatchObject({ epoch: originalLease.epoch, instanceId: originalLease.instanceId });
      expect(database.writerLease().expiresAtMs).toBeGreaterThan(originalLease.expiresAtMs);
      expect(lists.every(rows => rows.length === 25 && new Set(rows.map(row => row.id)).size === 25)).toBe(true);
      expect(lists).toEqual([expect.arrayContaining([expect.objectContaining({ id: project.id, status: "completed" })]),
        expect.arrayContaining([expect.objectContaining({ id: project.id, status: "completed" })])]);
    } finally {
      clearInterval(timer); database.close(); slowView.mockRestore();
      for (const id of cloneIds) runtimes.delete(id);
      await orchestrator.shutdown();
    }
  });

  it("lists each committed project without requiring independent writers to become idle together", async () => {
    const { orchestrator } = await harness(async request => mainResult(request, decision("finish", "Task complete.")));
    const first = await orchestrator.createProject({ ...projectInput(mainOnlyOrchestration()), title: "First committed project" });
    const second = await orchestrator.createProject({ ...projectInput(mainOnlyOrchestration()), title: "Second committed project" });
    await Promise.all([orchestrator.waitForIdle(first.id), orchestrator.waitForIdle(second.id)]);
    const storage = (orchestrator as unknown as { storage: ProjectStorage }).storage;
    const waitForBarrier = storage.waitForProjectReadBarrier.bind(storage);
    let secondReady!: () => void;
    const secondRead = new Promise<void>(resolve => { secondReady = resolve; });
    vi.spyOn(storage, "waitForProjectReadBarrier").mockImplementation(async (projectId, signal) => {
      await waitForBarrier(projectId, signal);
      if (projectId === second.id) secondReady();
    });
    const releaseFirst = storage.reserveProjectMutation(first.id);
    let releaseSecond: () => void = () => undefined;
    let settled = false;
    const listing = orchestrator.listProjects().then(value => { settled = true; return value; });
    try {
      await secondRead;
      await new Promise<void>(resolve => setImmediate(resolve));
      expect(settled).toBe(false);
      releaseSecond = storage.reserveProjectMutation(second.id);
      releaseFirst();
      await vi.waitFor(() => expect(settled).toBe(true), { interval: 5, timeout: 250 });
      expect(storage.hasActiveProjectMutation(second.id)).toBe(true);
      expect(await listing).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: first.id, title: "First committed project", status: "completed" }),
        expect.objectContaining({ id: second.id, title: "Second committed project", status: "completed" })
      ]));
    } finally {
      releaseFirst(); releaseSecond(); await listing; await orchestrator.shutdown();
    }
  });

  it("reads a completed project's obsolete Agent proxy without migrating its files or reopening its task", async () => {
    const { orchestrator, root } = await harness(async request => mainResult(request, decision("finish", "Original task complete.")));
    const created = await orchestrator.createProject(projectInput(mainOnlyOrchestration()));
    await orchestrator.waitForIdle(created.id); expect((await orchestrator.getProject(created.id))?.status).toBe("completed");
    await orchestrator.shutdown();
    const projectPath = path.join(root, "projects", created.id), statePath = path.join(projectPath, "state.json");
    const original = JSON.parse(await fs.readFile(statePath, "utf8"));
    original.agents.main.proxy = { mode: "direct" };
    await fs.writeFile(statePath, JSON.stringify(original, null, 2) + "\n");
    const stateBytes = await fs.readFile(statePath), eventBytes = await fs.readFile(path.join(projectPath, "events.jsonl"));
    const runner = new ScriptedRunner(async () => { throw Error("A historical completed project must never reopen"); });
    const recovered = new Orchestrator(new ProjectStorage(root, new EventHub()), new SkillCatalog([builtinSkillRoot]), runner,
      { retryBaseMs: 1, retryMaxMs: 1, agentConcurrency: 2 });
    try {
      liveOrchestrators.push(recovered);
      await recovered.initialize();
      const view = await recovered.getProject(created.id);
      expect(view?.status).toBe("completed"); expect(view?.agents.main).not.toHaveProperty("proxy"); expect(runner.calls).toEqual([]);
      expect(await fs.readFile(statePath)).toEqual(stateBytes);
      expect(await fs.readFile(path.join(projectPath, "events.jsonl"))).toEqual(eventBytes);
    } finally { await recovered.shutdown(); }
    expect(await fs.readFile(statePath)).toEqual(stateBytes);
  });

  it("fails closed before a v3 scoped graph can run on the legacy flat scheduler", async () => {
    const { orchestrator, runner } = await harness(async () => {
      throw new Error("v3 must not start an Agent invocation on the flat scheduler");
    });
    const orchestration = mainOnlyOrchestration();
    orchestration.schemaVersion = 3;
    orchestration.collaborations = [];
    orchestration.scopedWorkflow = { schemaVersion: 1, rootAgentIds: ["main"], groups: [] };
    await expect(orchestrator.createProject({
      title: "Scoped workflow scheduler gate",
      requirement: "Do not run v3 through the flat scheduler.",
      orchestration,
      agents: { main: { skills: [], autoSkills: [] } }
    })).rejects.toThrow(/要求启用 Git collaboration/);
    expect(runner.calls).toHaveLength(0);
    await orchestrator.shutdown();
  });

  it("keeps a Git-off legacy workflow on the serial runner without entering collaboration Git", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-git-off-legacy-"));
    temporaryRoots.push(root);
    const runner = new ScriptedRunner(async (request) =>
      request.agent === "main"
        ? mainResult(request, decision("finish", "Legacy serial delivery is complete."))
        : { handoff: workerResult(request.agent).markdown }
    );
    const collaborationRuntime: CollaborationRuntimeLifecycle = {
      initialize: vi.fn(async () => undefined),
      recoverProject: vi.fn(async () => false),
      createProject: vi.fn(async () => {
        throw new Error("Git-off project entered collaboration createProject");
      }),
      retryInitialization: vi.fn(async () => undefined),
      pauseProject: vi.fn(async () => undefined),
      resumeProject: vi.fn(async () => undefined),
      cancelProject: vi.fn(async () => undefined),
      shutdown: vi.fn(async () => undefined)
    };
    const orchestrator = new Orchestrator(
      new ProjectStorage(root, new EventHub()),
      new SkillCatalog([builtinSkillRoot]),
      runner,
      { retryBaseMs: 1, retryMaxMs: 1, agentConcurrency: 2 },
      undefined,
      collaborationRuntime
    );
    liveOrchestrators.push(orchestrator);
    await orchestrator.initialize();
    const orchestration = twoAgentOrchestration({
      input: "worker",
      termination: "worker",
      workerRoutes: [
        { target: "main", kind: "weak" },
        { target: "finish", kind: "weak" }
      ]
    });

    const created = await orchestrator.createProject(projectInput(orchestration));
    await orchestrator.waitForIdle(created.id);
    const completed = await orchestrator.getProject(created.id);

    expect(completed).toMatchObject({
      status: "completed",
      git: { enabled: false, status: "disabled" }
    });
    expect(runner.calls.map((request) => request.agent)).toEqual(["worker", "main", "main"]);
    expect(collaborationRuntime.createProject).not.toHaveBeenCalled();
    expect(completed?.pullRequests ?? []).toEqual([]);
    expect(completed?.groupRuns ?? []).toEqual([]);
    await expect(fs.access(path.join(root, "projects", created.id, "repository")))
      .rejects.toMatchObject({ code: "ENOENT" });
    await orchestrator.shutdown();
  });

  it("gates Main workflow reconfiguration before ending Main and identifies only affected groups", async () => {
    const previous = collaborationOrchestration("Original group");
    const proposed = collaborationOrchestration("Renamed group");
    const state = {
      id: "project-main-gate",
      git: { enabled: true },
      orchestration: structuredClone(previous)
    };
    const gate = vi.fn(() => {
      throw new Error("Group research_group is locked through final pull-request resolution");
    });
    const endActiveAgentExecution = vi.fn();
    const roleWorkspace = vi.fn();
    const subject = {
      collaborationRuntime: {
        assertWorkflowRevisionEditable: gate,
        saveWorkflowRevision: vi.fn()
      },
      storage: { roleWorkspace },
      endActiveAgentExecution
    };
    const commit = (
      Orchestrator.prototype as unknown as {
        commitAgentOrchestrationReconfiguration(
          runtime: unknown,
          invocationId: string,
          handoff: string | undefined,
          terminal: unknown,
          proposal: unknown
        ): Promise<void>;
      }
    ).commitAgentOrchestrationReconfiguration;

    expect(affectedCollaborationGroupIds(previous, proposed)).toEqual([
      "research_group"
    ]);
    await expect(commit.call(
      subject,
      { state },
      "inv-main-gate",
      undefined,
      { action: { tool: "apply_workflow", rationale: "Rename the group" } },
      { orchestration: proposed, agents: {} }
    )).rejects.toThrow("locked through final pull-request resolution");
    expect(gate).toHaveBeenCalledWith(
      state,
      ["research_group"]
    );
    expect(endActiveAgentExecution).not.toHaveBeenCalled();
    expect(roleWorkspace).not.toHaveBeenCalled();
    expect(state.orchestration).toEqual(previous);
  });

  it("indexes partial files on cancellation without publishing them", async () => {
    let started!: () => void;
    const ready = new Promise<void>((resolve) => { started = resolve; });
    const { orchestrator, runner } = await harness(async (request, _index, signal) => {
      await fs.writeFile(path.join(request.workspacePath, "partial.py"), "answer = 42\n");
      await new Promise<void>((resolve) => {
        if (signal.aborted) resolve();
        else signal.addEventListener("abort", () => resolve(), { once: true });
        started();
      });
      throw new AgentInterruptedError("deadline cancellation");
    });
    const project = await orchestrator.createProject({ title: "Partial output", requirement: "Preserve partial output.", orchestration: mainOnlyOrchestration() });
    await ready;
    const finished = await orchestrator.cancel(project.id, { actor: "deadline-monitor", reason: "arm_timeout", waitForSettlement: true });
    expect(runner.calls).toHaveLength(1);
    expect(finished).toMatchObject({ status: "cancelled", cancelReason: "arm_timeout", artifacts: [], workspaceCheckpoints: [{ fileCount: 1, status: "unverified_partial_output" }] });
    const manifest = await (orchestrator as unknown as { storage: ProjectStorage }).storage.readWorkspaceCheckpoint(project.id, finished.workspaceCheckpoints![0].id);
    expect(manifest.files[0]).toMatchObject({ path: "partial.py", sha256: expect.any(String) });
    await orchestrator.shutdown();
  });

  it.each(["not-needed", "succeeds", "omits-route", "throws"] as const)("continues automatically after Worker routing (%s)", async (repairOutcome) => {
    const mainFallback = repairOutcome === "omits-route" || repairOutcome === "throws";
    const originalHandoff = "Implementation notes. ".repeat(60) + "The implementation is saved in submission.py and ready for verification.";
    const { orchestrator, runner } = await harness(async (request) => {
      if (request.agent === "branch") {
        if (!request.terminalControlRepair) {
          await fs.writeFile(path.join(request.workspacePath, "submission.py"), "answer = 42\n");
          if (repairOutcome === "not-needed") {
            return { ...await mainResult(request, decision("finish_worker", "Verify the existing implementation."), "worker-session", false, false), handoff: originalHandoff };
          }
          return { handoff: originalHandoff, threadId: "worker-session" };
        }
        expect(request).toMatchObject({
          resumeThreadId: "worker-session", skillPaths: [], autoSkillPaths: [],
          control: { candidates: ["alternative", "finish_worker"] }, terminalControlRepair: { originalHandoff }
        });
        expect(request.availableSkillPaths).toEqual([]);
        expect(await fs.readFile(path.join(request.workspacePath, "submission.py"), "utf8")).toBe("answer = 42\n");
        if (repairOutcome === "omits-route") return { handoff: "Still missing the route." };
        if (repairOutcome === "throws") throw new Error("Worker repair failed before choosing a route.");
        return mainResult(request, decision("finish_worker", "Verify the existing implementation."), "worker-session", false, false);
      }
      if (request.agent === "finish_worker") {
        if (!mainFallback) expect(request.project.latestHandoff?.markdown).toContain(originalHandoff);
        expect(await fs.readFile(path.join(request.projectPath, "workspaces", "submission.py"), "utf8")).toBe("answer = 42\n");
        return { handoff: "Verification finished." };
      }
      if (request.project.pendingMainDecision?.reason === "route-missing") {
        expect(request.control).toMatchObject({
          candidates: ["alternative", "finish_worker"],
          mainCapabilities: {
            controlMode: "weak-branch",
            routeCandidates: ["alternative", "finish_worker"],
            canReconfigure: false,
            canComplete: false,
            canRequestUser: false
          }
        });
        expect(request.terminalControlRepair).toBeUndefined();
        expect(request.project.latestHandoff?.markdown).toContain(originalHandoff);
        return mainResult(request, decision("finish_worker", "Verify the saved implementation."));
      }
      return mainResult(request, decision("finish", "Verified."));
    });
    const orchestration = branchOrchestration();
    orchestration.agents.push({ name: "alternative", template: "general" });
    orchestration.routes.alternative = [{ target: "finish_worker", kind: "strong" }];
    orchestration.decisionPlans.alternative = "Continue to verification.";
    orchestration.routes.branch = [{ target: "alternative", kind: "weak" }, { target: "finish_worker", kind: "weak" }];
    const project = await orchestrator.createProject({
      ...projectInput(orchestration), agents: { branch: { decisionBy: "agent", skills: [], autoSkills: [] } }
    });
    await orchestrator.waitForIdle(project.id);
    expect(runner.calls.map((call) => call.agent)).toEqual(repairOutcome === "not-needed"
      ? ["branch", "finish_worker", "main"]
      : mainFallback
        ? ["branch", "branch", "main", "finish_worker", "main"]
        : ["branch", "branch", "finish_worker", "main"]);
    if (repairOutcome !== "not-needed") expect(runner.calls[1].invocationId).toBe(runner.calls[0].invocationId);
    expect(await orchestrator.getProject(project.id)).toMatchObject({ status: "completed", runCounts: { branch: 1 }, executionCounts: { branch: 1 } });
    const events = await (orchestrator as unknown as { storage: ProjectStorage }).storage.readEvents(project.id);
    expect(events.some((event) => event.type === "invocation.failed" || event.message.includes("failure limit"))).toBe(false);
    await orchestrator.shutdown();
  });

  it("preserves the first cancellation cause and waits for runner cleanup before reporting settlement", async () => {
    let started!: () => void;
    let cleanup!: () => void;
    const ready = new Promise<void>((resolve) => { started = resolve; });
    const cleanupGate = new Promise<void>((resolve) => { cleanup = resolve; });
    const { orchestrator } = await harness(async (_request, _index, signal) => {
      started();
      await new Promise<void>((resolve) => signal.addEventListener("abort", () => resolve(), { once: true }));
      await cleanupGate;
      throw new AgentInterruptedError("cancelled");
    });
    const project = await orchestrator.createProject({ title: "Deadline cancellation", requirement: "Wait for cleanup", orchestration: mainOnlyOrchestration() });
    await ready;
    const requested = await orchestrator.cancel(project.id, { actor: "deadline-monitor", reason: "arm_timeout" });
    expect(requested).toMatchObject({ status: "cancelling", cancelledBy: "deadline-monitor", cancelReason: "arm_timeout" });
    expect(requested.cancellationSettledAt).toBeUndefined();
    let settled = false;
    const waiting = orchestrator.cancel(project.id, { waitForSettlement: true }).then((value) => { settled = true; return value; });
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(settled).toBe(false);
    cleanup();
    const cancelled = await waiting;
    expect(cancelled).toMatchObject({ status: "cancelled", cancelReason: "arm_timeout", cancelledBy: "deadline-monitor", overallProgress: { label: "运行超时，任务已取消" } });
    expect(cancelled.cancellationSettledAt).toBeTruthy();
    const events = await (orchestrator as unknown as { storage: ProjectStorage }).storage.readEvents(project.id);
    expect(events.at(-1)?.type).toBe("project.cancellation.settled");
    expect(events.some((event) => event.message.includes("cancelled by user"))).toBe(false);
    await orchestrator.shutdown();
  });

  it("binds the control capability to the invocation lifecycle without a fixed wall-clock lease", async () => {
    const { orchestrator, runner } = await harness(async (request) => {
      expect(request.control).toBeDefined();
      expect(request.control?.expiresAt).toBeUndefined();
      return mainResult(request, decision("finish", "The long-running task is complete."));
    });

    const project = await orchestrator.createProject({
      title: "Invocation-scoped control capability",
      requirement: "Keep control actions available for the complete invocation.",
      orchestration: mainOnlyOrchestration(),
      agents: { main: { skills: [], autoSkills: [] } }
    });
    await orchestrator.waitForIdle(project.id);

    expect(runner.calls).toHaveLength(1);
    expect(await orchestrator.getProject(project.id)).toMatchObject({
      status: "completed",
      phase: "accepted"
    });
    await orchestrator.shutdown();
  });

  it("resolves project Skills and MCP services in the common invocation layer", async () => {
    const { orchestrator, runner } = await harness(async (request) => {
      expect(request.skillPaths).toHaveLength(1);
      expect(request.skillPaths[0]).toContain("/skills/");
      expect(await fs.readFile(request.skillPaths[0], "utf8"))
        .toContain("Task-owned verification instructions");
      expect(request.availableSkillPaths).toContain(request.skillPaths[0]);
      expect(request.project.agents.main.mcpServers).toEqual([{
        name: "task-tools",
        url: expect.stringMatching(/^http:\/\/127\.0\.0\.1:\d+\/mcp\/[a-f0-9]{64}$/)
      }]);
      return mainResult(request, decision("finish", "Project-owned capabilities were resolved."));
    });
    const project = await orchestrator.createProject({
      title: "Project-owned invocation capabilities",
      requirement: "Resolve task-owned capabilities before the Harness starts.",
      orchestration: mainOnlyOrchestration(),
      skillDefinitions: {
        verifier: {
          files: { "SKILL.md": "# Task-owned verification instructions\n" }
        }
      },
      mcpDefinitions: {
        tools: {
          entrypoint: "server.cjs",
          files: {
            "server.cjs": [
              "const { Server } = require('@modelcontextprotocol/sdk/server/index.js');",
              "const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');",
              "const server = new Server({ name: 'task-tools', version: '1' }, { capabilities: {} });",
              "server.connect(new StdioServerTransport());",
              "process.stdin.on('end', () => server.close().finally(() => process.exit()));"
            ].join("\n")
          }
        }
      },
      agents: {
        main: {
          skills: ["project:verifier"],
          autoSkills: [],
          mcpServers: [{ name: "task-tools", project: "tools" }]
        }
      }
    });
    await orchestrator.waitForIdle(project.id);

    expect(runner.calls).toHaveLength(1);
    const persisted = await orchestrator.getProject(project.id);
    expect(persisted).toMatchObject({
      status: "completed",
      skillDefinitions: { verifier: { files: { "SKILL.md": expect.any(String) } } },
      mcpDefinitions: { tools: { entrypoint: "server.cjs" } },
      agents: {
        main: {
          skills: ["project:verifier"],
          mcpServers: [{ name: "task-tools", project: "tools" }]
        }
      }
    });
    await orchestrator.shutdown();
  }, 15_000);

  it("commits an optionally leased action that the server received before expiry", async () => {
    const receivedAt = "2020-01-01T00:00:00.000Z";
    const expiresAt = "2020-01-01T00:01:00.000Z";
    const { orchestrator } = await harness(async (request) => {
      const control = request.control;
      if (!control) throw new Error("scripted Main requires control context");
      // Standalone integrations may still opt into a lease. The authoritative
      // commit decision uses the server receipt time, not today's wall clock.
      control.expiresAt = expiresAt;
      return {
        handoff: "The terminal action was staged while its optional lease was valid.",
        controlActions: [{
          projectId: request.project.id,
          agent: request.agent,
          invocationId: request.invocationId,
          callId: `${request.invocationId}-terminal`,
          stateVersion: control.stateVersion,
          ...(control.capabilityHash ? { capabilityHash: control.capabilityHash } : {}),
          expiresAt,
          receivedAt,
          action: {
            tool: "complete_project" as const,
            rationale: "The accepted action remains valid through atomic commit."
          }
        }]
      };
    });

    const project = await orchestrator.createProject({
      title: "Receipt-time lease validation",
      requirement: "Commit a control action accepted before its optional lease ended.",
      orchestration: mainOnlyOrchestration(),
      agents: { main: { skills: [], autoSkills: [] } }
    });
    await orchestrator.waitForIdle(project.id);

    expect(await orchestrator.getProject(project.id)).toMatchObject({
      status: "completed",
      phase: "accepted"
    });
    await orchestrator.shutdown();
  });

  it("counts a business execution as soon as it starts, before a successful commit", async () => {
    let markStarted!: () => void;
    let releaseRun!: () => void;
    const started = new Promise<void>((resolve) => { markStarted = resolve; });
    const released = new Promise<void>((resolve) => { releaseRun = resolve; });
    const { orchestrator } = await harness(async (request) => {
      markStarted();
      await released;
      return mainResult(request, decision("finish", "The active task is complete."));
    });

    const project = await orchestrator.createProject({
      title: "Active business execution count",
      requirement: "Expose the active task before its invocation commits.",
      orchestration: mainOnlyOrchestration(),
      agents: { main: { skills: [], autoSkills: [] } }
    });
    await started;

    expect(await orchestrator.getProject(project.id)).toMatchObject({
      status: "running",
      runCounts: { main: 0 },
      executionCounts: { main: 1 },
      agentProgress: { main: { runs: 0, executions: 1 } }
    });

    releaseRun();
    await orchestrator.waitForIdle(project.id);
    await orchestrator.shutdown();
  });

  it("lets an authorized Main add and configure an Agent, then continues under the committed workflow", async () => {
    const { orchestrator, runner, root } = await harness(async (request, index) => {
      if (index === 0) {
        expect(request.agent).toBe("main");
        expect(request.control?.allowAgentOrchestrationReconfiguration).toBe(true);
        const workflowPath = path.join(request.workspacePath, "workflow.json");
        const document = JSON.parse(
          await fs.readFile(workflowPath, "utf8")
        ) as MainAgentOrchestrationDocument;
        document.orchestration.agents.push({
          name: "analyst",
          template: "general",
          description: "Added by the running Main"
        });
        document.orchestration.input.target = "analyst";
        document.orchestration.routes.analyst = [
          { target: "main", kind: "strong" }
        ];
        document.orchestration.decisionPlans.analyst =
          "Return the verified evidence to Main.";
        document.orchestration.allowUserIntervention = false;
        document.orchestration.termination = {
          agent: "main",
          condition: "Main accepts the dynamically produced evidence.",
          decisionBy: "main",
          automatic: true
        };
        document.orchestration.resultFormat = {
          presets: ["markdown"],
          custom: "Include a dynamic-workflow verification section."
        };
        await fs.writeFile(
          workflowPath,
          `${JSON.stringify(document, null, 2)}\n`,
          "utf8"
        );
        const control = request.control!;
        return {
          threadId: "thread_before_reconfiguration",
          handoff: "I added a bounded analyst role and updated the delivery policy.",
          controlActions: [{
            projectId: request.project.id,
            agent: request.agent,
            invocationId: request.invocationId,
            callId: `${request.invocationId}-apply-workflow`,
            stateVersion: control.stateVersion,
            ...(control.capabilityHash
              ? { capabilityHash: control.capabilityHash }
              : {}),
            receivedAt: new Date().toISOString(),
            action: {
              tool: "apply_workflow",
              path: "workflow.json",
              rationale: "The task now benefits from a dedicated analyst."
            }
          }]
        };
      }
      if (index === 1) {
        expect(request.agent).toBe("main");
        expect(request.resumeThreadId).toBe("thread_before_reconfiguration");
        expect(request.project.orchestration).toMatchObject({
          input: { target: "analyst" },
          allowUserIntervention: false,
          allowMainReconfiguration: true,
          termination: {
            agent: "main",
            automatic: true,
            condition: "Main accepts the dynamically produced evidence."
          }
        });
        expect(request.project.agents.analyst).toMatchObject({
          permission: "workspace",
          sessionPersistence: false
        });
        return mainResult(
          request,
          decision("analyst", "Produce the bounded verification evidence."),
          "thread_before_reconfiguration"
        );
      }
      if (index === 2) {
        expect(request.agent).toBe("analyst");
        return {
          handoff: "The dynamically assigned verification evidence is complete."
        };
      }
      if (index === 3) {
        expect(request.agent).toBe("main");
        expect(request.resumeThreadId).toBe("thread_before_reconfiguration");
        return mainResult(
          request,
          decision("finish", "The dynamic-workflow verification is complete."),
          "thread_before_reconfiguration"
        );
      }
      throw new Error(`Unexpected invocation ${index}`);
    });

    const initial = mainOnlyOrchestration();
    initial.allowMainReconfiguration = true;
    initial.allowUserIntervention = false;
    const project = await orchestrator.createProject({
      title: "Dynamic workflow integration",
      requirement: "Add a bounded analyst at runtime and use its evidence.",
      orchestration: initial,
      agents: {
        main: {
          model: "test-model",
          skills: [],
          autoSkills: []
        }
      }
    });
    await orchestrator.waitForIdle(project.id);

    const completed = await orchestrator.getProject(project.id);
    expect(completed).toMatchObject({
      status: "completed",
      runCounts: { main: 3, analyst: 1 },
      orchestration: {
        input: { target: "analyst" },
        allowUserIntervention: false,
        allowMainReconfiguration: true,
        resultFormat: {
          presets: ["markdown"],
          custom: "Include a dynamic-workflow verification section."
        }
      }
    });
    expect(Object.keys(completed?.agents ?? {})).toEqual(["main", "analyst"]);
    expect(runner.calls.map(({ agent }) => agent)).toEqual([
      "main",
      "main",
      "analyst",
      "main"
    ]);
    const expectedWorkspace = path.join(root, "projects", project.id, "workspaces");
    expect(new Set(runner.calls.map(({ workspacePath }) => workspacePath))).toEqual(
      new Set([expectedWorkspace])
    );
    await expect(
      fs.access(path.join(expectedWorkspace, "analyst", "shared"))
    ).rejects.toMatchObject({ code: "ENOENT" });
    const events = (await fs.readFile(
      path.join(root, "projects", project.id, "events.jsonl"),
      "utf8"
    ))
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as { type: string });
    expect(events.some(({ type }) => type === "workflow.reconfigured")).toBe(
      true
    );
    await orchestrator.shutdown();

    const restarted = new Orchestrator(
      new ProjectStorage(root, new EventHub()),
      new SkillCatalog([builtinSkillRoot]),
      new ScriptedRunner(async () => {
        throw new Error("a completed persisted project must not rerun");
      }),
      { retryBaseMs: 1, retryMaxMs: 1, agentConcurrency: 2 }
    );
    liveOrchestrators.push(restarted);
    await restarted.initialize();
    expect(await restarted.getProject(project.id)).toMatchObject({
      status: "completed",
      orchestration: {
        agents: expect.arrayContaining([
          expect.objectContaining({ name: "analyst" })
        ]),
        allowMainReconfiguration: true
      },
      agents: {
        analyst: expect.objectContaining({ permission: "workspace" })
      }
    });
    await restarted.shutdown();
  });

  it("allows Main to commit multiple workflow reconfigurations in successive termination turns", async () => {
    const { orchestrator, runner, root } = await harness(async (request, index) => {
      expect(request.agent).toBe("main");
      expect(request.control?.allowAgentOrchestrationReconfiguration).toBe(true);
      const workflowPath = path.join(request.workspacePath, "workflow.json");
      let document = JSON.parse(
        await fs.readFile(workflowPath, "utf8")
      ) as MainAgentOrchestrationDocument;

      if (index < 2) {
        if (index === 1) {
          // Main explicitly starts its next proposal from the accepted view;
          // the server has retained the original authoring file and old base.
          const current = JSON.parse(await fs.readFile(path.join(request.workspacePath, MAIN_AGENT_ORCHESTRATION_CURRENT_FILE), "utf8")) as MainAgentOrchestrationDocument;
          expect(document.baseHash).not.toBe(current.baseHash);
          document = current;
          expect(request.project.pendingMainDecision?.reason).toBe(
            "workflow-reconfigured"
          );
          expect(request.project.orchestration.resultFormat.custom).toBe(
            "first reconfiguration"
          );
          const inbox = await fs.readFile(request.inboxPath, "utf8");
          expect(inbox).not.toContain("Historical accepted Main action (already applied");
          expect(request.project.pendingMainDecision?.reason).toBe("workflow-reconfigured");
        }
        document.orchestration.resultFormat.custom = index === 0
          ? "first reconfiguration"
          : "second reconfiguration";
        await fs.writeFile(
          workflowPath,
          `${JSON.stringify(document, null, 2)}\n`,
          "utf8"
        );
        const control = request.control!;
        if (index === 1) expect(request.resumeThreadId).toBe("thread_before_reconfiguration_1");
        return {
          threadId: "thread_before_reconfiguration_1",
          handoff: `Main committed workflow reconfiguration ${index + 1}.`,
          controlActions: [{
            projectId: request.project.id,
            agent: request.agent,
            invocationId: request.invocationId,
            callId: `${request.invocationId}-apply-workflow-${index + 1}`,
            stateVersion: control.stateVersion,
            ...(control.capabilityHash
              ? { capabilityHash: control.capabilityHash }
              : {}),
            receivedAt: new Date().toISOString(),
            action: {
              tool: "apply_workflow" as const,
              path: "workflow.json",
              rationale: `Apply reconfiguration ${index + 1}.`
            }
          }]
        };
      }

      expect(index).toBe(2);
      expect(request.resumeThreadId).toBe("thread_before_reconfiguration_1");
      expect(request.project.pendingMainDecision?.reason).toBe(
        "workflow-reconfigured"
      );
      expect(document.orchestration.resultFormat.custom).toBe(
        "second reconfiguration"
      );
      return mainResult(
        request,
        decision("finish", "The second workflow reconfiguration is complete."),
        "thread_before_reconfiguration_1"
      );
    });

    const orchestration = mainOnlyOrchestration();
    orchestration.allowMainReconfiguration = true;
    const project = await orchestrator.createProject({
      title: "Repeated workflow reconfiguration",
      requirement: "Allow Main to refine the workflow across successive termination decisions.",
      orchestration,
      agents: { main: { model: "test-model", skills: [], autoSkills: [] } }
    });
    await orchestrator.waitForIdle(project.id);

    expect(await orchestrator.getProject(project.id)).toMatchObject({
      status: "completed",
      runCounts: { main: 3 },
      orchestration: {
        allowMainReconfiguration: true,
        resultFormat: { custom: "second reconfiguration" }
      }
    });
    expect(runner.calls.map(({ agent }) => agent)).toEqual(["main", "main", "main"]);
    const events = (await fs.readFile(
      path.join(root, "projects", project.id, "events.jsonl"),
      "utf8"
    ))
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as { type: string });
    expect(events.filter(({ type }) => type === "workflow.reconfigured")).toHaveLength(2);
    await orchestrator.shutdown();
  });

  it("applies standing-instruction changes on the next turn without replacing the Agent session", async () => {
    const { orchestrator, runner } = await harness(async (request, index) => {
      expect(request.agent).toBe("main");
      if (index === 0) {
        const workflowPath = path.join(request.workspacePath, "workflow.json");
        const document = JSON.parse(await fs.readFile(workflowPath, "utf8")) as MainAgentOrchestrationDocument;
        document.agents.main!.instructions += "\nA new instruction for the next invocation in this native session.";
        await fs.writeFile(workflowPath, `${JSON.stringify(document, null, 2)}\n`, "utf8");
        await publishDurableSession(request, "stable-main-session");
        const control = request.control!;
        return {
          threadId: "stable-main-session",
          handoff: "Try to change my instructions without deleting my identity.",
          controlActions: [{
            projectId: request.project.id,
            agent: request.agent,
            invocationId: request.invocationId,
            callId: `${request.invocationId}-apply-workflow`,
            stateVersion: control.stateVersion,
            ...(control.capabilityHash ? { capabilityHash: control.capabilityHash } : {}),
            receivedAt: new Date().toISOString(),
            action: { tool: "apply_workflow" as const, path: "workflow.json", rationale: "Change instructions." }
          }]
        };
      }
      expect(request.project.pendingMainDecision?.reason).toBe("workflow-reconfigured");
      expect(request.project.agents.main.instructions).toContain("A new instruction for the next invocation");
      expect(request.resumeThreadId).toBe("stable-main-session");
      return mainResult(request, decision("finish", "The unsupported change was rejected."), "stable-main-session");
    });
    const orchestration = mainOnlyOrchestration();
    orchestration.allowMainReconfiguration = true;
    const project = await orchestrator.createProject({
      title: "Preserve session on supported configuration change",
      requirement: "Do not silently replace or stale the same Agent session.",
      orchestration,
      agents: { main: { model: "test-model", skills: [], autoSkills: [] } }
    });
    await orchestrator.waitForIdle(project.id);
    expect(await orchestrator.getProject(project.id)).toMatchObject({
      status: "completed",
      agentSessionIds: { main: "stable-main-session" },
      agentSessionMeta: { main: { generation: 0 } }
    });
    expect(runner.calls).toHaveLength(2);
    await orchestrator.shutdown();
  });

  it("requeues Main with a diagnostic when an orchestration proposal fails validation", async () => {
    const { orchestrator, runner, root } = await harness(async (request, index) => {
      expect(request.agent).toBe("main");
      const control = request.control!;
      const workflowPath = path.join(request.workspacePath, "workflow.json");
      const document = JSON.parse(
        await fs.readFile(workflowPath, "utf8")
      ) as MainAgentOrchestrationDocument;
      if (index === 0) {
        document.lockedRuntime.main.currentModel = "forged-expensive-model";
        await fs.writeFile(
          workflowPath,
          `${JSON.stringify(document, null, 2)}\n`,
          "utf8"
        );
        return {
          handoff: "The first orchestration proposal intentionally contains a locked-runtime change.",
          threadId: "thread_before_rejected_workflow",
          controlActions: [{
            projectId: request.project.id,
            agent: request.agent,
            invocationId: request.invocationId,
            callId: `${request.invocationId}-apply-invalid-workflow`,
            stateVersion: control.stateVersion,
            ...(control.capabilityHash
              ? { capabilityHash: control.capabilityHash }
              : {}),
            receivedAt: new Date().toISOString(),
            action: {
              tool: "apply_workflow" as const,
              path: "workflow.json",
              rationale: "Try the change so the server can return its validation diagnostic."
            }
          }]
        };
      }
      expect(index).toBe(1);
      expect(request.project.pendingMainDecision?.reason).toBe(
        "workflow-reconfiguration-rejected"
      );
      expect(request.project.pendingMainDecision?.diagnostic).toContain(
        "lockedRuntime is server-owned"
      );
      document.lockedRuntime.main.currentModel = "test-model";
      await fs.writeFile(
        workflowPath,
        `${JSON.stringify(document, null, 2)}\n`,
        "utf8"
      );
      return mainResult(
        request,
        decision("finish", "The rejected proposal was corrected and the task is complete."),
        "thread_after_rejected_workflow"
      );
    });

    const orchestration = mainOnlyOrchestration();
    orchestration.allowMainReconfiguration = true;
    const project = await orchestrator.createProject({
      title: "Rejected workflow recovery",
      requirement: "Recover after a rejected Main orchestration proposal.",
      orchestration,
      agents: { main: { model: "test-model", skills: [], autoSkills: [] } }
    });
    await orchestrator.waitForIdle(project.id);

    expect(runner.calls).toHaveLength(2);
    expect(await orchestrator.getProject(project.id)).toMatchObject({
      status: "completed",
      agents: { main: { model: "test-model" } }
    });
    const events = (await fs.readFile(
      path.join(root, "projects", project.id, "events.jsonl"),
      "utf8"
    ))
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as { type: string; data?: Record<string, unknown> });
    expect(events.filter(({ type }) => type === "workflow.reconfiguration.rejected")).toHaveLength(1);
    expect(events.filter(({ type }) => type === "control.action.rejected")).toHaveLength(1);
    expect(events.some(({ type }) => type === "workflow.reconfigured")).toBe(false);
    await orchestrator.shutdown();
  });

  it("removes an Agent from live state without deleting its historical workspace", async () => {
    const { orchestrator, root } = await harness(async (request, index) => {
      if (index === 0) {
        expect(request.agent).toBe("main");
        expect(request.control?.allowAgentOrchestrationReconfiguration).toBe(true);
        expect(request.control?.canComplete).toBe(false);
        expect(request.control?.mainCapabilities).toMatchObject({
          controlMode: "autonomous",
          canReconfigure: true,
          canComplete: false
        });
        expect(await fs.readFile(request.inboxPath, "utf8")).not.toContain("## Dynamic Workflow reconfiguration");
        expect(await fs.readFile(path.join(request.workspacePath, "workflow.json"), "utf8")).toContain("editingInstructions");
        return mainResult(
          request,
          decision("obsolete", "Run the existing role before deciding whether it can be removed."),
          "thread_remove_agent"
        );
      }
      if (index === 1) {
        expect(request.agent).toBe("obsolete");
        const legacyWorkspace = path.join(
          request.workspacePath,
          "obsolete",
          "shared"
        );
        await fs.mkdir(legacyWorkspace, { recursive: true });
        await fs.writeFile(
          path.join(legacyWorkspace, "historical.txt"),
          "preserve historical workspace\n"
        );
        return { handoff: "The obsolete role has completed its final handoff." };
      }
      if (index === 2) {
        const workflowPath = path.join(request.workspacePath, "workflow.json");
        const document = JSON.parse(
          await fs.readFile(workflowPath, "utf8")
        ) as MainAgentOrchestrationDocument;
        document.orchestration.agents = [
          { name: "main", template: "main" }
        ];
        document.orchestration.input.target = "main";
        document.orchestration.routes = { main: [] };
        document.orchestration.decisionPlans = {
          main: defaultDecisionPlan("main")
        };
        delete document.agents.obsolete;
        await fs.writeFile(
          workflowPath,
          `${JSON.stringify(document, null, 2)}\n`,
          "utf8"
        );
        const control = request.control!;
        return {
          threadId: "thread_remove_agent",
          handoff: "The obsolete role is no longer needed.",
          controlActions: [{
            projectId: request.project.id,
            agent: request.agent,
            invocationId: request.invocationId,
            callId: `${request.invocationId}-remove-agent`,
            stateVersion: control.stateVersion,
            ...(control.capabilityHash
              ? { capabilityHash: control.capabilityHash }
              : {}),
            receivedAt: new Date().toISOString(),
            action: {
              tool: "apply_workflow",
              path: "workflow.json",
              rationale: "Remove the obsolete role from future scheduling."
            }
          }]
        };
      }
      if (index === 3) {
        expect(request.project.orchestration.agents).toEqual([
          { name: "main", template: "main" }
        ]);
        expect(request.project.agents.obsolete).toBeUndefined();
        return mainResult(
          request,
          decision("finish", "The reduced workflow is complete."),
          "thread_remove_agent"
        );
      }
      throw new Error(`Unexpected invocation ${index}`);
    });

    const live = twoAgentOrchestration({
      input: "worker",
      termination: "main",
      workerRoutes: [{ target: "main", kind: "strong" }]
    });
    live.input.target = "main";
    live.allowMainReconfiguration = true;
    live.agents[1] = { name: "obsolete", template: "general" };
    live.routes = {
      main: [{ target: "obsolete", kind: "weak" }],
      obsolete: [{ target: "main", kind: "strong" }]
    };
    live.decisionPlans = {
      main: defaultDecisionPlan("main"),
      obsolete: "Return to Main."
    };
    const project = await orchestrator.createProject({
      ...projectInput(live),
      title: "Dynamic Agent removal"
    });
    await orchestrator.waitForIdle(project.id);

    const completed = await orchestrator.getProject(project.id);
    expect(completed).toMatchObject({
      status: "completed",
      runCounts: { main: 3 },
      executionCounts: { main: 3 }
    });
    expect(Object.keys(completed?.runCounts ?? {})).toEqual(["main"]);
    expect(completed?.agentSessionMeta?.obsolete).toBeUndefined();
    await expect(
      fs.readFile(
        path.join(
          root,
          "projects",
          project.id,
          "workspaces",
          "obsolete",
          "shared",
          "historical.txt"
        ),
        "utf8"
      )
    ).resolves.toBe("preserve historical workspace\n");
    await orchestrator.shutdown();
  });

  it("requires even Codex Agents to select a global gateway in production wiring", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-gateway-preflight-"));
    temporaryRoots.push(root);
    const orchestrator = new Orchestrator(
      new ProjectStorage(root, new EventHub()),
      new SkillCatalog([builtinSkillRoot]),
      new ScriptedRunner(async () => mainResult({} as AgentRunRequest, decision("finish", "unused"))),
      { retryBaseMs: 1, retryMaxMs: 1, agentConcurrency: 1 },
      new GatewayStore(root)
    );
    liveOrchestrators.push(orchestrator);
    await orchestrator.initialize();

    const orchestration = twoAgentOrchestration({
      input: "worker",
      termination: "worker",
      workerRoutes: [
        { target: "main", kind: "weak" },
        { target: "finish", kind: "weak" }
      ]
    });
    const error = await orchestrator.createProject({
      title: "Gateway preflight",
      requirement: "Every production Agent must explicitly select a global gateway.",
      orchestration,
      agents: {
        main: { skills: [], autoSkills: [], harness: "codex" },
        worker: { skills: [], autoSkills: [], harness: "codex" }
      }
    }).catch((reason: unknown) => reason);
    expect(error).toBeInstanceOf(ZodError);
    expect((error as ZodError).issues.map((issue) => issue.message)).toEqual([
      "main Agent 必须选择全局网关",
      "worker Agent 必须选择全局网关"
    ]);
    expect(await orchestrator.listProjects()).toEqual([]);
    await orchestrator.shutdown();
  });

  it("creates and runs a project when the selected gateway connection test failed", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-failed-gateway-start-"));
    temporaryRoots.push(root);
    const gatewayStore = new GatewayStore(root, {
      resolveHostname: async () => ["93.184.216.34"],
      fetch: async () => new Response("upstream unavailable", { status: 503 })
    });
    const gateway = await gatewayStore.create({
      name: "Temporarily failing gateway",
      url: "https://gateway.example.com/v1",
      apiKey: "server-only-secret",
      models: ["test-model"],
      defaultModel: "test-model",
      protocol: "responses"
    });
    expect(await gatewayStore.test(gateway.id)).toMatchObject({ status: "failed" });

    const runner = new ScriptedRunner(async (request) => request.agent === "worker"
      ? { handoff: workerResult("worker").markdown }
      : mainResult(request, decision("finish", "The scripted run completed.")));
    const orchestrator = new Orchestrator(
      new ProjectStorage(root, new EventHub()),
      new SkillCatalog([builtinSkillRoot]),
      runner,
      { retryBaseMs: 1, retryMaxMs: 1, agentConcurrency: 1 },
      gatewayStore
    );
    liveOrchestrators.push(orchestrator);
    await orchestrator.initialize();
    const orchestration = twoAgentOrchestration({
      input: "worker",
      termination: "worker",
      workerRoutes: [
        { target: "main", kind: "weak" },
        { target: "finish", kind: "weak" }
      ]
    });
    const project = await orchestrator.createProject({
      title: "Failed probe can start",
      requirement: "Attempt the configured route despite a failed connection probe.",
      orchestration,
      agents: {
        main: { model: "test-model", gatewayId: gateway.id, harness: "codex", skills: [], autoSkills: [] },
        worker: { model: "test-model", gatewayId: gateway.id, harness: "codex", skills: [], autoSkills: [] }
      }
    });
    await orchestrator.waitForIdle(project.id);

    expect(runner.calls.map((request) => request.agent)).toEqual(["worker", "main", "main"]);
    expect(runner.calls[0]?.project.agents.worker.gatewaySnapshot).toMatchObject({
      id: gateway.id,
      modelContextWindows: {},
      deliveryMode: "native-stream"
    });
    expect((await orchestrator.getProject(project.id))?.status).toBe("completed");
    await orchestrator.shutdown();
  });

  it.each(["explainer", "probe"] as const)(
    "rejects an available %s-only harness before creating a Workflow project",
    async (purpose) => {
      const root = await fs.mkdtemp(path.join(os.tmpdir(), `scienceevolve-${purpose}-preflight-`));
      temporaryRoots.push(root);
      const harnessId = `fixture-${purpose}`;
      const runner = new CatalogScriptedRunner(
        async () => { throw new Error("purpose-only harness must not be invoked"); },
        [purposeOnlyHarness(harnessId, purpose)]
      );
      const orchestrator = new Orchestrator(
        new ProjectStorage(root, new EventHub()),
        new SkillCatalog([builtinSkillRoot]),
        runner,
        { retryBaseMs: 1, retryMaxMs: 1, agentConcurrency: 1 }
      );
      liveOrchestrators.push(orchestrator);
      await orchestrator.initialize();

      const error = await orchestrator.createProject({
        title: `${purpose} purpose rejection`,
        requirement: "Only Workflow-capable Harnesses may execute an Agent.",
        orchestration: mainOnlyOrchestration(),
        agents: {
          main: {
            model: "fixture-model",
            harness: harnessId,
            skills: [],
            autoSkills: []
          }
        }
      }).catch((reason: unknown) => reason);

      expect(error).toBeInstanceOf(ZodError);
      expect((error as ZodError).issues.map((issue) => issue.message)).toEqual([
        `main Agent 选择的 ${harnessId} harness 不支持 Workflow purpose`
      ]);
      expect(await orchestrator.listProjects()).toEqual([]);
      expect(runner.calls).toEqual([]);
      await orchestrator.shutdown();
    }
  );

  it("exposes only the running Agent's gateway credential in its invocation snapshot", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-gateway-isolation-"));
    temporaryRoots.push(root);
    const gatewayStore = new GatewayStore(root, {
      resolveHostname: async () => ["93.184.216.34"],
      adapterSmokeProbe: successfulAdapterSmokeProbe(),
      fetch: async (_input, init) => {
        const body = JSON.parse(String(init?.body ?? "{}")) as { stream?: boolean; tool_choice?: unknown };
        const toolProbe = body.tool_choice !== undefined;
        if (body.stream) {
          return new Response((toolProbe ? [
            'data: {"type":"response.output_item.added","output_index":0,"item":{"id":"probe-item","type":"function_call","call_id":"probe-call","name":"openfars_probe","arguments":""}}',
            'data: {"type":"response.completed","response":{"status":"completed"}}',
            ""
          ] : [
            'data: {"type":"response.output_text.delta","delta":"ok"}',
            'data: {"type":"response.completed","response":{"status":"completed"}}',
            ""
          ]).join("\n\n"), {
            status: 200,
            headers: { "content-type": "text/event-stream" }
          });
        }
        return new Response(JSON.stringify(toolProbe
          ? { output: [{ type: "function_call", call_id: "probe-call", name: "openfars_probe", arguments: '{"value":"ok"}' }] }
          : { output_text: "ok", output: [{ type: "message", content: [{ type: "output_text", text: "ok" }] }] }), {
          status: 200,
          headers: { "content-type": "application/json" }
        });
      }
    });
    const mainGateway = await gatewayStore.create({
      name: "Main gateway",
      url: "https://main-gateway.example.com/v1",
      apiKey: "main-server-secret",
      models: ["main-model"],
      defaultModel: "main-model",
      protocol: "responses"
    });
    const workerGateway = await gatewayStore.create({
      name: "Worker gateway",
      url: "https://worker-gateway.example.com/v1",
      apiKey: "worker-server-secret",
      models: ["worker-model"],
      defaultModel: "worker-model",
      protocol: "responses"
    });
    await expect(gatewayStore.testHarness(
      mainGateway.id,
      "codex",
      "main-model"
    )).resolves.toMatchObject({ status: "passed", probeKind: "adapter-smoke" });
    await expect(gatewayStore.testHarness(
      workerGateway.id,
      "codex",
      "worker-model"
    )).resolves.toMatchObject({ status: "passed", probeKind: "adapter-smoke" });

    const runner = new ScriptedRunner(async (request) => {
      if (request.agent === "worker") {
        expect(request.project.agents.worker.gatewaySnapshot?.apiKey).toBe("worker-server-secret");
        expect(request.project.agents.main.gatewaySnapshot).not.toHaveProperty("apiKey");
        return { handoff: workerResult("worker").markdown };
      }
      expect(request.project.agents.main.gatewaySnapshot?.apiKey).toBe("main-server-secret");
      expect(request.project.agents.worker.gatewaySnapshot).not.toHaveProperty("apiKey");
      return mainResult(request, decision("finish", "Both isolated invocations completed."));
    });
    const orchestrator = new Orchestrator(
      new ProjectStorage(root, new EventHub()),
      new SkillCatalog([builtinSkillRoot]),
      runner,
      { retryBaseMs: 1, retryMaxMs: 1, agentConcurrency: 1 },
      gatewayStore
    );
    liveOrchestrators.push(orchestrator);
    await orchestrator.initialize();
    const orchestration = twoAgentOrchestration({
      input: "worker",
      termination: "worker",
      workerRoutes: [
        { target: "main", kind: "weak" },
        { target: "finish", kind: "weak" }
      ]
    });

    const project = await orchestrator.createProject({
      title: "Credential isolation",
      requirement: "Expose each gateway credential only to its selected Agent.",
      orchestration,
      agents: {
        main: {
          model: "main-model",
          gatewayId: mainGateway.id,
          harness: "codex",
          skills: [],
          autoSkills: []
        },
        worker: {
          model: "worker-model",
          gatewayId: workerGateway.id,
          harness: "codex",
          skills: [],
          autoSkills: []
        }
      }
    });
    await orchestrator.waitForIdle(project.id);

    expect(runner.calls.map((request) => request.agent)).toEqual(["worker", "main", "main"]);
    expect((await orchestrator.getProject(project.id))?.status).toBe("completed");
    await orchestrator.shutdown();
  });

  it("runs and finishes a Main-only project with Main's editable YOLO default", async () => {
    const { orchestrator, runner } = await harness(async (request) =>
      mainResult(request, decision("finish", "The requested result is complete."))
    );

    const project = await orchestrator.createProject({
      title: "Main-only project",
      requirement: "Complete a bounded task without child Agents.",
      orchestration: mainOnlyOrchestration(),
      agents: { main: { skills: [], autoSkills: [] } }
    });
    await orchestrator.waitForIdle(project.id);

    const completed = await orchestrator.getProject(project.id);
    expect(completed).toMatchObject({
      status: "completed",
      phase: "accepted",
      configurationLocked: true,
      agentSessionIds: { main: "thread_main" }
    });
    expect(completed?.orchestration.agents).toEqual([
      { name: "main", template: "main" }
    ]);
    expect(completed?.orchestration.routes.main).toEqual([]);
    expect(completed?.agents.main.permission).toBe("yolo");
    expect(runner.calls.map(callSummary)).toEqual([
      { agent: "main", kind: "main", permission: "yolo", resumeThreadId: undefined }
    ]);
    await expect(
      orchestrator.updateAgentConfigs(project.id, {
        main: { permission: "workspace" }
      })
    ).rejects.toBeInstanceOf(ProjectConfigurationLockedError);
    await orchestrator.shutdown();
  });

  it("keeps project Skill and MCP references valid through runtime config updates", async () => {
    const { orchestrator, runner } = await harness(async (request) =>
      mainResult(request, decision("finish", "The project-owned configuration is valid."))
    );
    const project = await orchestrator.createProject({
      title: "Project-owned configuration",
      requirement: "Preserve project Skill and MCP references while editing an Agent.",
      orchestration: mainOnlyOrchestration(),
      agents: {
        main: {
          skills: ["project:analysis"],
          autoSkills: [],
          mcpServers: []
        }
      },
      skillDefinitions: {
        analysis: { files: { "SKILL.md": "Analyze the evidence." } }
      },
      mcpDefinitions: {
        "task-tools": {
          entrypoint: "server.cjs",
          files: { "server.cjs": "console.log('mcp');" }
        },
        "other-tools": {
          entrypoint: "server.cjs",
          files: { "server.cjs": "console.log('other-mcp');" }
        }
      }
    });
    await orchestrator.waitForIdle(project.id);

    const internals = orchestrator as unknown as {
      runtimes: Map<string, { state: { configurationLocked?: boolean } }>;
    };
    internals.runtimes.get(project.id)!.state.configurationLocked = false;
    await expect(orchestrator.updateAgentConfigs(project.id, {
      main: {
        instructions: "Updated while retaining project-owned references.",
        skills: ["project:analysis"],
        mcpServers: [{ name: "task-tools", project: "task-tools" }]
      }
    })).resolves.toMatchObject({
      agents: {
        main: {
          skills: ["project:analysis"],
          mcpServers: [{ name: "task-tools", project: "task-tools" }]
        }
      }
    });
    await expect(orchestrator.updateAgentConfigs(project.id, {
      main: {
        mcpServers: [{ name: "task-tools", project: "other-tools" }]
      }
    })).resolves.toMatchObject({
      agents: {
        main: {
          mcpServers: [{ name: "task-tools", project: "other-tools" }]
        }
      }
    });
    await expect(orchestrator.updateAgentConfigs(project.id, {
      main: { mcpServers: [{ name: "missing", project: "missing" }] }
    })).rejects.toThrow("undefined project MCP");
    expect(runner.calls).toHaveLength(1);
    await orchestrator.shutdown();
  });

  it.each([true, false])("persists an explicit runtime experiment selection %s without changing other Agent settings", async selected => {
    const { orchestrator, runner, root } = await harness(async request => request.agent === "worker"
      ? { handoff: workerResult("worker").markdown }
      : mainResult(request, decision("finish", "The configuration fixture is complete.")));
    const input = projectInput(twoAgentOrchestration({ input: "worker", termination: "worker",
      workerRoutes: [{ target: "main", kind: "weak" }, { target: "finish", kind: "weak" }] }));
    const project = await orchestrator.createProject({ ...input,
      agents: { ...input.agents, worker: { ...input.agents.worker, experimentMcp: !selected } } });
    await orchestrator.waitForIdle(project.id);
    const before = structuredClone((await orchestrator.getProject(project.id))!);
    const originalTurnCount = runner.calls.length;
    // Only this synthetic fixture permits config editing. Production startup
    // locks and all existing historical projects keep their current contract.
    const internals = orchestrator as unknown as {
      runtimes: Map<string, { state: { configurationLocked?: boolean } }>;
      storage: ProjectStorage;
    };
    internals.runtimes.get(project.id)!.state.configurationLocked = false;
    const changes = updateAgentConfigsSchema.parse({ agents: { worker: { experimentMcp: selected } } });
    try {
      const updated = await orchestrator.updateAgentConfigs(project.id, changes.agents);
      expect(updated.agents.worker).toEqual({ ...before.agents.worker, experimentMcp: selected });
      expect(updated.agents.main).toEqual(before.agents.main);
      const persisted = await new ProjectStorage(root, new EventHub()).loadState(project.id);
      expect(persisted.agents.worker.experimentMcp).toBe(selected);
      const events = (await internals.storage.readEvents(project.id)).filter(event => event.type === "project.config.updated");
      expect(events).toHaveLength(1);
      expect(events[0].data?.changes).toEqual([expect.objectContaining({
        agent: "worker", previousExperimentMcp: !selected, experimentMcp: selected
      })]);
      await orchestrator.updateAgentConfigs(project.id, changes.agents);
      expect((await internals.storage.readEvents(project.id)).filter(event => event.type === "project.config.updated")).toHaveLength(1);
      await orchestrator.updateAgentConfigs(project.id, { worker: { instructions: "Retain the experiment choice." } });
      expect((await orchestrator.getProject(project.id))!.agents.worker.experimentMcp).toBe(selected);
      await orchestrator.shutdown();
      const restarted = new Orchestrator(new ProjectStorage(root, new EventHub()), new SkillCatalog([builtinSkillRoot]),
        new ScriptedRunner(async () => { throw new Error("The completed fixture must not rerun"); }),
        { retryBaseMs: 1, retryMaxMs: 1, agentConcurrency: 1 });
      try {
        liveOrchestrators.push(restarted);
        await restarted.initialize();
        const restored = (await restarted.getProject(project.id))!;
        expect(restored.agents.worker.experimentMcp).toBe(selected);
        expect(restored.agents.main).toEqual(before.agents.main);
        expect(restored.agentSessions).toEqual(before.agentSessions);
        expect(restored.configurationLocked).toBe(true);
        await expect(restarted.updateAgentConfigs(project.id, changes.agents)).rejects.toBeInstanceOf(ProjectConfigurationLockedError);
      } finally { await restarted.shutdown(); }
      expect(runner.calls).toHaveLength(originalTurnCount);
    } finally { await orchestrator.shutdown(); }
  });

  it("repairs pre-lock persisted projects as locked during recovery", async () => {
    const { orchestrator, root } = await harness(async (request) =>
      mainResult(request, decision("finish", "The legacy fixture is complete."))
    );
    const project = await orchestrator.createProject({
      title: "Legacy lock migration",
      requirement: "A persisted started project must never regain editable Harness configuration.",
      orchestration: mainOnlyOrchestration(),
      agents: { main: { skills: [], autoSkills: [] } }
    });
    await orchestrator.waitForIdle(project.id);
    await orchestrator.shutdown();

    const statePath = path.join(root, "projects", project.id, "state.json");
    const legacyState = JSON.parse(await fs.readFile(statePath, "utf8")) as Record<string, unknown>;
    delete legacyState.configurationLocked;
    delete legacyState.lockedAt;
    await fs.writeFile(statePath, `${JSON.stringify(legacyState, null, 2)}\n`, "utf8");

    const storage = new ProjectStorage(root, new EventHub());
    const restarted = new Orchestrator(
      storage,
      new SkillCatalog([builtinSkillRoot]),
      new ScriptedRunner(async () => { throw new Error("completed project must not rerun"); }),
      { retryBaseMs: 1, retryMaxMs: 1, agentConcurrency: 1 }
    );
    liveOrchestrators.push(restarted);
    await restarted.initialize();
    expect(await restarted.getProject(project.id)).toMatchObject({
      configurationLocked: true,
      lockedAt: project.createdAt
    });
    await expect(restarted.updateAgentConfigs(project.id, {
      main: { model: "must-not-apply" }
    })).rejects.toBeInstanceOf(ProjectConfigurationLockedError);
    await restarted.shutdown();
  });

  it("rolls back every Harness-facing configuration field when persistence fails", async () => {
    const { orchestrator } = await harness(async (request) => {
      if (request.agent === "worker") {
        return { handoff: workerResult("worker").markdown };
      }
      return mainResult(request, decision("finish", "The rollback fixture is complete."));
    });
    const orchestration = twoAgentOrchestration({
      input: "worker",
      termination: "worker",
      workerRoutes: [
        { target: "main", kind: "weak" },
        { target: "finish", kind: "weak" }
      ]
    });
    const project = await orchestrator.createProject(projectInput(orchestration));
    await orchestrator.waitForIdle(project.id);

    const internals = orchestrator as unknown as {
      runtimes: Map<string, { state: { configurationLocked?: boolean } }>;
      storage: ProjectStorage;
    };
    internals.runtimes.get(project.id)!.state.configurationLocked = false;
    const before = structuredClone((await orchestrator.getProject(project.id))!.agents.worker);
    const appendEvent = vi.spyOn(internals.storage, "appendEvent")
      .mockRejectedValueOnce(new Error("simulated config event persistence failure"));

    await expect(orchestrator.updateAgentConfigs(project.id, {
      worker: {
        model: "replacement-model",
        harness: "fixture-harness",
        gatewayId: `gwy_${"a".repeat(32)}`,
        gatewayReasoningOption: "rollback-option",
        reasoningEffort: before.reasoningEffort === "low" ? "high" : "low",
        instructions: `${before.instructions}\nRollback sentinel.`,
        skills: ["inspire"],
        autoSkills: ["nature-writing"],
        mcpServers: [{
          name: "rollback-fixture",
          url: "https://rollback.example.test/mcp"
        }],
        permission: before.permission === "compute" ? "workspace" : "compute",
        webSearch: !before.webSearch,
        experimentMcp: true,
        sessionPersistence: !before.sessionPersistence,
        decisionBy: before.decisionBy === "main" ? "agent" : "main"
      }
    })).rejects.toThrow("simulated config event persistence failure");
    appendEvent.mockRestore();

    expect((await orchestrator.getProject(project.id))!.agents.worker).toEqual(before);
    expect(Object.hasOwn((await orchestrator.getProject(project.id))!.agents.worker, "experimentMcp"))
      .toBe(Object.hasOwn(before, "experimentMcp"));
    await orchestrator.shutdown();
  });

  it("accounts every gateway request once and ignores CLI-local usage summaries", async () => {
    const { orchestrator } = await harness(async (request, _index, _signal, onTrace) => {
      const first = {
        usageId: "usage-request-1",
        protocol: "chat-completions" as const,
        model: "test-model",
        inputTokens: 10,
        cachedInputTokens: 4,
        outputTokens: 3,
        totalTokens: 13
      };
      await request.onTokenUsage?.(first);
      // A replayed callback must be idempotent by usageId.
      await request.onTokenUsage?.(first);
      await request.onTokenUsage?.({
        usageId: "usage-request-2",
        protocol: "chat-completions",
        model: "test-model",
        inputTokens: 20,
        cachedInputTokens: 0,
        outputTokens: 5,
        totalTokens: 25
      });
      // A Harness may also emit a local cumulative summary. The Orchestrator
      // accepts only request-scoped proxy accounting for live invocations.
      await onTrace("status", "CLI turn completed", {
        input_tokens: 999,
        cached_input_tokens: 100,
        output_tokens: 99,
        total_tokens: 1_098,
        usageScope: "thread",
        threadId: "thread_main"
      });
      return mainResult(
        request,
        decision("finish", "Gateway usage accounting was verified.")
      );
    });

    const project = await orchestrator.createProject({
      title: "Gateway token accounting",
      requirement: "Count all provider calls exactly once.",
      orchestration: mainOnlyOrchestration(),
      agents: { main: { skills: [], autoSkills: [] } }
    });
    await orchestrator.waitForIdle(project.id);

    expect((await orchestrator.getProject(project.id))?.tokenUsage).toMatchObject({
      accountingVersion: 4,
      inputTokens: 30,
      cachedInputTokens: 4,
      outputTokens: 8,
      totalTokens: 38,
      invocations: 2,
      byAgent: {
        main: {
          inputTokens: 30,
          cachedInputTokens: 4,
          outputTokens: 8,
          totalTokens: 38,
          invocations: 2
        }
      }
    });
    await orchestrator.shutdown();
  });

  it("reconciles unknown Gateway usage to known without double counting", async () => {
    const { orchestrator } = await harness(async (request) => {
      const unknown = {
        usageId: "usage-late-1",
        protocol: "responses" as const,
        model: "test-model",
        status: "unknown" as const,
        reason: "stream-interrupted" as const,
        processingState: "indeterminate" as const
      };
      await request.onTokenUsage?.(unknown);
      await request.onTokenUsage?.(unknown);
      await request.onTokenUsage?.({
        usageId: "usage-late-1",
        protocol: "responses",
        model: "test-model",
        inputTokens: 7,
        cachedInputTokens: 2,
        outputTokens: 3,
        totalTokens: 10
      });
      await request.onTokenUsage?.({
        usageId: "usage-missing-2",
        protocol: "responses",
        model: "test-model",
        status: "unknown",
        reason: "provider-response-missing-usage",
        processingState: "processed"
      });
      return mainResult(
        request,
        decision("finish", "Known and unknown usage were reconciled.")
      );
    });
    const project = await orchestrator.createProject({
      title: "Unknown Gateway usage",
      requirement: "Keep exact known totals and expose incomplete accounting.",
      orchestration: mainOnlyOrchestration(),
      agents: { main: { skills: [], autoSkills: [] } }
    });
    await orchestrator.waitForIdle(project.id);

    expect((await orchestrator.getProject(project.id))?.tokenUsage).toMatchObject({
      accountingVersion: 4,
      inputTokens: 7,
      cachedInputTokens: 2,
      outputTokens: 3,
      totalTokens: 10,
      invocations: 1,
      unknownRequests: 1,
      complete: false,
      byAgent: {
        main: {
          inputTokens: 7,
          totalTokens: 10,
          invocations: 1,
          unknownRequests: 1,
          complete: false
        }
      },
      requestLedger: {
        "usage-late-1": { status: "known" },
        "usage-missing-2": {
          status: "unknown",
          reason: "provider-response-missing-usage"
        }
      }
    });
    await orchestrator.shutdown();
  });

  it("does not expose Main completion before a configured Worker commits evidence", async () => {
    const { orchestrator, runner } = await harness(async (request) => {
      if (request.agent === "worker") {
        return { handoff: workerResult("worker").markdown };
      }
      if (runner.calls.length === 1) {
        expect(request.control?.allowAgentOrchestrationReconfiguration).toBe(true);
        await expect(
          fs.access(path.join(request.workspacePath, "workflow.json"))
        ).resolves.toBeUndefined();
      } else {
        expect(request.control?.allowAgentOrchestrationReconfiguration).toBe(true);
      }
      return mainResult(
        request,
        request.control?.canComplete
          ? decision("finish", "The Worker evidence is now available.")
          : decision("worker", "Produce the required evidence first.")
      );
    });
    const orchestration = twoAgentOrchestration({
      input: "main",
      termination: "main",
      workerRoutes: [{ target: "main", kind: "strong" }]
    });
    orchestration.allowMainReconfiguration = true;

    const project = await orchestrator.createProject(projectInput(orchestration));
    await orchestrator.waitForIdle(project.id);

    expect(runner.calls.map((request) => request.agent)).toEqual([
      "main",
      "worker",
      "main"
    ]);
    expect(runner.calls[0]?.control?.canComplete).toBe(false);
    expect(runner.calls[2]?.control?.canComplete).toBe(true);
    expect(await orchestrator.getProject(project.id)).toMatchObject({
      status: "completed",
      phase: "accepted",
      runCounts: { main: 2, worker: 1 }
    });
    await orchestrator.shutdown();
  });

  it("lets only an automatic termination Worker complete without routing through Main", async () => {
    const completionCapabilities: boolean[] = [];
    const { orchestrator, runner, root } = await harness(async (request) => {
      if (request.agent === "review") {
        completionCapabilities.push(request.control?.canComplete === true);
        if (!request.project.orchestration.termination.automatic) {
          return { handoff: "Review evidence is ready for Main's termination decision." };
        }
        const control = request.control!;
        return {
          handoff: "The configured termination condition is satisfied.",
          controlActions: [{
            projectId: request.project.id,
            agent: request.agent,
            invocationId: request.invocationId,
            callId: `${request.invocationId}-complete`,
            stateVersion: control.stateVersion,
            ...(control.capabilityHash ? { capabilityHash: control.capabilityHash } : {}),
            receivedAt: new Date().toISOString(),
            action: {
              tool: "complete_project" as const,
              rationale: "The review verified every configured acceptance condition."
            }
          }]
        };
      }
      return mainResult(
        request,
        decision("finish", "Main accepts the termination evidence.")
      );
    });
    const workflow = (automatic: boolean) => {
      const orchestration = twoAgentOrchestration({
        input: "review",
        termination: "review",
        workerRoutes: [{ target: "finish", kind: "weak" }]
      });
      orchestration.termination.automatic = automatic;
      return orchestration;
    };

    const automatic = await orchestrator.createProject(projectInput(workflow(true)));
    await orchestrator.waitForIdle(automatic.id);
    expect(runner.calls.map(({ agent }) => agent)).toEqual(["review"]);
    expect(completionCapabilities).toEqual([true]);
    expect(await orchestrator.getProject(automatic.id)).toMatchObject({
      status: "completed",
      phase: "accepted",
      runCounts: { main: 0, review: 1 }
    });
    const automaticEvents = await (orchestrator as unknown as { storage: ProjectStorage })
      .storage.readEvents(automatic.id);
    expect(automaticEvents.find(({ type }) => type === "project.completed"))
      .toMatchObject({
        agent: "review",
        data: { sourceAgent: "review", completionMode: "automatic" }
      });

    runner.calls.length = 0;
    completionCapabilities.length = 0;
    const manual = await orchestrator.createProject(projectInput(workflow(false)));
    await orchestrator.waitForIdle(manual.id);
    expect(runner.calls.map(({ agent }) => agent)).toEqual(["review", "main"]);
    expect(completionCapabilities).toEqual([false]);
    expect(await orchestrator.getProject(manual.id)).toMatchObject({
      status: "completed",
      runCounts: { main: 1, review: 1 }
    });
    const manualEvents = (await fs.readFile(
      path.join(root, "projects", manual.id, "events.jsonl"),
      "utf8"
    )).trim().split("\n").map((line) => JSON.parse(line) as {
      type: string;
      data?: Record<string, unknown>;
    });
    expect(manualEvents.find(({ type }) => type === "project.completed"))
      .toMatchObject({ data: { completionMode: "main" } });
    await orchestrator.shutdown();
  });

  it("returns an unfinished automatic judge directly to its sole repair Agent", async () => {
    let reviewTurns = 0;
    const { orchestrator, runner } = await harness(async (request) => {
      if (request.agent === "review") {
        reviewTurns += 1;
        expect(request.control?.canComplete).toBe(true);
        if (reviewTurns === 1) {
          return { handoff: "One acceptance check failed; repair the reported issue." };
        }
        const control = request.control!;
        return {
          handoff: "The repaired result now satisfies the termination condition.",
          controlActions: [{
            projectId: request.project.id,
            agent: request.agent,
            invocationId: request.invocationId,
            callId: `${request.invocationId}-complete`,
            stateVersion: control.stateVersion,
            ...(control.capabilityHash ? { capabilityHash: control.capabilityHash } : {}),
            receivedAt: new Date().toISOString(),
            action: {
              tool: "complete_project" as const,
              rationale: "The repaired result passes the configured checks."
            }
          }]
        };
      }
      if (request.agent === "repair") {
        expect(request.control?.canComplete).toBe(false);
        return { handoff: "The failed acceptance check has been repaired." };
      }
      throw new Error("Main must not run for the deterministic automatic repair cycle.");
    });
    const orchestration: AgentOrchestrationTemplate = {
      agents: [
        { name: "main", template: "main" },
        { name: "repair", template: "general" },
        { name: "review", template: "review" }
      ],
      input: { source: "input", target: "review" },
      routes: {
        main: [
          { target: "repair", kind: "weak" },
          { target: "review", kind: "weak" }
        ],
        repair: [{ target: "review", kind: "strong" }],
        review: [
          { target: "repair", kind: "weak" },
          { target: "finish", kind: "weak" }
        ]
      },
      decisionPlans: {
        main: defaultDecisionPlan("main"),
        repair: "Repair the failed acceptance evidence.",
        review: "Complete only when the configured condition is satisfied."
      },
      allowUserIntervention: true,
      termination: {
        agent: "review",
        condition: "Every acceptance check passes.",
        decisionBy: "main",
        automatic: true
      },
      resultFormat: { presets: [], custom: "" }
    };
    const project = await orchestrator.createProject(projectInput(orchestration));
    await orchestrator.waitForIdle(project.id);

    expect(runner.calls.map(({ agent }) => agent)).toEqual([
      "review",
      "repair",
      "review"
    ]);
    expect(await orchestrator.getProject(project.id)).toMatchObject({
      status: "completed",
      runCounts: { main: 0, repair: 1, review: 2 }
    });
    await orchestrator.shutdown();
  });

  it("rejects completion with published artifacts until Main commits a published display", async () => {
    let mainTurn = 0;
    const { orchestrator, runner } = await harness(async (request) => {
      if (request.agent === "worker") {
        await fs.writeFile(
          path.join(request.workspacePath, "worker-report.md"),
          "# Worker report\n\nVerified evidence.\n",
          "utf8"
        );
        const control = request.control!;
        return {
          handoff: workerResult("worker").markdown,
          controlActions: [{
            projectId: request.project.id,
            agent: request.agent,
            invocationId: request.invocationId,
            callId: `${request.invocationId}-publish`,
            stateVersion: control.stateVersion,
            ...(control.capabilityHash ? { capabilityHash: control.capabilityHash } : {}),
            receivedAt: new Date().toISOString(),
            action: {
              tool: "publish_artifact",
              path: "worker-report.md",
              title: "Worker report",
              kind: "document",
              description: "Verified Worker evidence"
            }
          }]
        };
      }

      mainTurn += 1;
      const result = decision("finish", "The published evidence is complete.");
      if (mainTurn === 2) {
        result.display = {
          primary: {
            agent: "worker",
            path: "worker-report.md",
            title: "Worker report"
          },
          items: []
        };
      }
      return mainResult(request, result, "thread_main", false);
    });
    const orchestration = twoAgentOrchestration({
      input: "worker",
      termination: "main",
      workerRoutes: [{ target: "main", kind: "strong" }]
    });

    const project = await orchestrator.createProject(projectInput(orchestration));
    await orchestrator.waitForIdle(project.id);

    const completed = await orchestrator.getProject(project.id);
    expect(completed).toMatchObject({
      status: "completed",
      phase: "accepted",
      display: {
        primary: {
          agent: "worker",
          path: "worker-report.md",
          title: "Worker report"
        },
        items: []
      }
    });
    expect(runner.calls.map((request) => request.agent)).toEqual([
      "worker",
      "main",
      "main"
    ]);
    const storage = (orchestrator as unknown as { storage: ProjectStorage }).storage;
    const events = await storage.readEvents(project.id);
    expect(events.some((event) =>
      event.type === "invocation.failed" &&
      event.message === "main invocation failed" &&
      String(event.data?.error).includes("before staging select_display")
    )).toBe(true);
    await orchestrator.shutdown();
  });

  it("rejects changed published bytes until the current content is republished", async () => {
    let mainTurn = 0;
    const { orchestrator, runner } = await harness(async (request) => {
      if (request.agent === "worker") {
        await fs.writeFile(
          path.join(request.workspacePath, "integrity-report.md"),
          "# Integrity report\n\nOriginal evidence.\n",
          "utf8"
        );
        const control = request.control!;
        return {
          handoff: workerResult("worker").markdown,
          controlActions: [{
            projectId: request.project.id,
            agent: request.agent,
            invocationId: request.invocationId,
            callId: `${request.invocationId}-publish`,
            stateVersion: control.stateVersion,
            ...(control.capabilityHash ? { capabilityHash: control.capabilityHash } : {}),
            receivedAt: new Date().toISOString(),
            action: {
              tool: "publish_artifact",
              path: "integrity-report.md",
              title: "Integrity report",
              kind: "document",
              description: "Hash-bound Worker evidence"
            }
          }]
        };
      }

      mainTurn += 1;
      if (mainTurn === 1) {
        await fs.writeFile(
          path.join(request.workspacePath, "integrity-report.md"),
          "# Integrity report\n\nChanged after publication.\n",
          "utf8"
        );
        const result = decision("finish", "Accept the existing publication.");
        result.display = {
          primary: {
            agent: "worker",
            path: "integrity-report.md",
            title: "Integrity report"
          },
          items: []
        };
        return mainResult(request, result, "thread_main", false);
      }

      const result = decision("finish", "Republish and accept the changed bytes.");
      result.display = {
        primary: {
          agent: "main",
          path: "integrity-report.md",
          title: "Integrity report"
        },
        items: []
      };
      return mainResult(request, result, "thread_main", true);
    });
    const orchestration = twoAgentOrchestration({
      input: "worker",
      termination: "main",
      workerRoutes: [{ target: "main", kind: "strong" }]
    });

    const project = await orchestrator.createProject(projectInput(orchestration));
    await orchestrator.waitForIdle(project.id);

    const completed = await orchestrator.getProject(project.id);
    expect(completed).toMatchObject({
      status: "completed",
      display: {
        primary: { agent: "main", path: "integrity-report.md" }
      },
      artifacts: [{
        agent: "main",
        path: "integrity-report.md",
        sha256: expect.stringMatching(/^[a-f0-9]{64}$/)
      }]
    });
    expect(runner.calls.map((request) => request.agent)).toEqual([
      "worker",
      "main",
      "main"
    ]);
    const storage = (orchestrator as unknown as { storage: ProjectStorage }).storage;
    const events = await storage.readEvents(project.id);
    expect(events.some((event) =>
      event.type === "invocation.failed" &&
      String(event.data?.error).includes("select_display referenced an unreadable workspace file")
    )).toBe(true);
    await orchestrator.shutdown();
  });

  it("provides a complete publication index and lets a downstream Worker explicitly read the selected artifact", async () => {
    let workerTurn = 0;
    let mainTurn = 0;
    const { orchestrator, runner } = await harness(async (request) => {
      if (request.agent === "worker") {
        workerTurn += 1;
        if (workerTurn === 1) {
          await fs.writeFile(
            path.join(request.workspacePath, "cross-check-source.md"),
            "# Cross-check source\n\nExact peer evidence: 54 + 108 = 162.\n",
            "utf8"
          );
          const control = request.control!;
          return {
            handoff: workerResult("worker").markdown,
            controlActions: [{
              projectId: request.project.id,
              agent: request.agent,
              invocationId: request.invocationId,
              callId: `${request.invocationId}-publish`,
              stateVersion: control.stateVersion,
              ...(control.capabilityHash ? { capabilityHash: control.capabilityHash } : {}),
              receivedAt: new Date().toISOString(),
              action: {
                tool: "publish_artifact",
                path: "cross-check-source.md",
                title: "Cross-check source",
                kind: "document",
                description: "Peer evidence for the next Worker turn"
              }
            }]
          };
        }
        const inbox = await fs.readFile(request.inboxPath, "utf8");
        expect(inbox).not.toContain("project.published-artifacts");
        expect(inbox).not.toContain("scienceevolve_read_published_artifact");
        expect(inbox).toContain("cross-check-source.md");
        expect(inbox).not.toContain("Exact peer evidence: 54 + 108 = 162.");
        expect(await fs.readFile(path.join(request.workspacePath, "cross-check-source.md"), "utf8")).toContain("Exact peer evidence: 54 + 108 = 162.");
        return { handoff: workerResult("worker").markdown };
      }

      mainTurn += 1;
      const next = mainTurn === 1
        ? decision("worker", "Cross-check the published peer evidence in cross-check-source.md.")
        : decision("finish", "The downstream cross-check is complete.");
      if (mainTurn === 2) {
        next.display = {
          primary: {
            agent: "worker",
            path: "cross-check-source.md",
            title: "Cross-check source"
          },
          items: []
        };
      }
      return mainResult(request, next, "thread_main", false);
    });
    const orchestration = twoAgentOrchestration({
      input: "worker",
      termination: "main",
      workerRoutes: [{ target: "main", kind: "strong" }]
    });

    const project = await orchestrator.createProject(projectInput(orchestration));
    await orchestrator.waitForIdle(project.id);

    expect(runner.calls.map((request) => request.agent)).toEqual([
      "worker",
      "main",
      "worker",
      "main"
    ]);
    expect((await orchestrator.getProject(project.id))?.status).toBe("completed");
    await orchestrator.shutdown();
  });

  it("records external harness stdout as information while preserving stderr warnings", async () => {
    const { orchestrator } = await harness(async (request, _index, _signal, onTrace) => {
      await onTrace("output", "normal external harness handoff");
      await onTrace("stderr", "external harness diagnostic");
      await onTrace("status", "structured diagnostic", {
        kind: "provider.status",
        diagnosticKind: "fixture.provider.status"
      });
      return mainResult(request, decision("finish", "The traced run is complete."));
    });
    const project = await orchestrator.createProject({
      title: "External trace levels",
      requirement: "Classify normal output separately from diagnostics.",
      orchestration: mainOnlyOrchestration(),
      agents: { main: { skills: [], autoSkills: [] } }
    });
    await orchestrator.waitForIdle(project.id);

    const storage = (orchestrator as unknown as { storage: ProjectStorage }).storage;
    const events = await storage.readEvents(project.id);
    expect(events.find((event) => event.message === "normal external harness handoff")?.level).toBe("info");
    expect(events.find((event) => event.message === "external harness diagnostic")?.level).toBe("warning");
    expect(events.find((event) => event.message === "structured diagnostic")?.data).toMatchObject({
      kind: "provider.status",
      diagnosticKind: "fixture.provider.status",
      traceKind: "status"
    });
    await orchestrator.shutdown();
  });

  it("allows a long-running active tool without charging its time to the model deadline", async () => {
    const { orchestrator, runner } = await harness(async (request) => {
      request.onModelActivity?.({
        kind: "tool",
        phase: "started",
        source: "harness",
        callId: "tool-long",
        name: "long-computation"
      });
      await new Promise((resolve) => setTimeout(resolve, 120));
      request.onModelActivity?.({
        kind: "tool",
        phase: "completed",
        source: "harness",
        callId: "tool-long",
        name: "long-computation"
      });
      request.onModelActivity?.({
        kind: "model",
        phase: "completed",
        source: "harness"
      });
      return mainResult(request, decision("finish", "The long tool completed successfully."));
    }, {
      agentActivityIdleWindowMs: 40,
      agentToolActivityIdleWindowMs: 500
    });
    const project = await orchestrator.createProject({
      title: "Independent tool deadline",
      requirement: "Do not time out a healthy long-running tool on the model deadline.",
      orchestration: mainOnlyOrchestration(),
      agents: { main: { skills: [], autoSkills: [] } }
    });
    await orchestrator.waitForIdle(project.id);

    expect(runner.calls).toHaveLength(1);
    expect((await orchestrator.getProject(project.id))?.status).toBe("completed");
    const storage = (orchestrator as unknown as { storage: ProjectStorage }).storage;
    const events = await storage.readEvents(project.id);
    expect(events.some((event) =>
      event.data?.diagnosticKind === "agent.activity.timeout" ||
      event.data?.diagnosticKind === "agent.tool.timeout"
    )).toBe(false);
    await orchestrator.shutdown();
  });

  it("times out the oldest stuck tool independently and preserves structured diagnostics", async () => {
    const { orchestrator, runner } = await harness(async (request, index, signal) => {
      if (index === 0) {
        request.onModelActivity?.({
          kind: "tool",
          phase: "started",
          source: "harness",
          callId: "tool-completed",
          name: "quick-tool"
        });
        request.onModelActivity?.({
          kind: "tool",
          phase: "started",
          source: "harness",
          callId: "tool-stuck",
          name: "stuck-tool"
        });
        request.onModelActivity?.({
          kind: "tool",
          phase: "completed",
          source: "harness",
          callId: "tool-completed",
          name: "quick-tool"
        });
        await new Promise<never>((_resolve, reject) => {
          const interrupted = () => reject(new AgentInterruptedError("watchdog interrupted fixture"));
          if (signal.aborted) interrupted();
          else signal.addEventListener("abort", interrupted, { once: true });
        });
      }
      request.onModelActivity?.({
        kind: "model",
        phase: "completed",
        source: "harness"
      });
      return mainResult(request, decision("finish", "The retry recovered after the stuck tool."));
    }, {
      agentActivityIdleWindowMs: 200,
      agentToolActivityIdleWindowMs: 45
    });
    const project = await orchestrator.createProject({
      title: "Stuck tool deadline",
      requirement: "Classify a stuck tool separately from model inactivity.",
      orchestration: mainOnlyOrchestration(),
      agents: { main: { skills: [], autoSkills: [] } }
    });
    await orchestrator.waitForIdle(project.id);

    expect(runner.calls).toHaveLength(2);
    expect((await orchestrator.getProject(project.id))?.status).toBe("completed");
    const storage = (orchestrator as unknown as { storage: ProjectStorage }).storage;
    const events = await storage.readEvents(project.id);
    const timeoutTrace = events.find((event) =>
      event.type === "agent.trace" && event.data?.diagnosticKind === "agent.tool.timeout"
    );
    expect(timeoutTrace?.data).toMatchObject({
      traceKind: "status",
      failureCode: "TOOL_EXECUTION_TIMED_OUT",
      phase: "tool-running",
      deadlineType: "tool-activity-idle",
      timeoutMs: 45,
      toolCallId: "tool-stuck",
      toolName: "stuck-tool",
      activeToolCount: 1
    });
    expect(events.find((event) => event.type === "invocation.failed")?.data).toMatchObject({
      errorCode: "TOOL_EXECUTION_TIMED_OUT",
      errorSource: "process"
    });
    expect(events.some((event) => event.data?.diagnosticKind === "agent.activity.timeout")).toBe(false);
    await orchestrator.shutdown();
  });

  it("waits for the original accepted control callback after the runner returns and commits its durable action without a replacement Main turn", async () => {
    let service!: ControlActionService, release!: () => void, entered!: () => void, returned!: () => void;
    const blocked = new Promise<void>(done => { release = done; });
    const staging = new Promise<void>(done => { entered = done; });
    const nativeReturned = new Promise<void>(done => { returned = done; });
    let pending: Promise<unknown> | undefined;
    const { orchestrator, runner, root } = await harness(async (request, index) => {
      if (index !== 0) throw new Error("Original control callback is still pending; do not start a replacement Main turn");
      const result = await mainResult(request, decision("finish", "Original accepted decision"), "original-delayed-control-session");
      pending = service.stageWithResult(request.control!.capability, "original-delayed-control", result.controlActions![0].action).catch(error => error);
      await staging; returned();
      return { ...result, controlActions: [] };
    }, { controlBridgeFactory: async (authority, runtimePath) => {
      service = authority; const stage = authority.stage.bind(authority);
      vi.spyOn(authority, "stage").mockImplementation(async (...args) => { entered(); await blocked; return stage(...args); });
      return startControlActionBridge(authority, runtimePath);
    } });
    const project = await orchestrator.createProject(projectInput(mainOnlyOrchestration()));
    await nativeReturned; await new Promise<void>(done => setImmediate(done));
    const before = await orchestrator.getProject(project.id), callsBefore = runner.calls.length;
    release(); const receipt = await pending; await orchestrator.waitForIdle(project.id);
    expect(before?.status).toBe("running"); expect(callsBefore).toBe(1);
    expect(receipt).toMatchObject({ envelope: { callId: "original-delayed-control" } });
    const completed = await orchestrator.getProject(project.id);
    expect(completed?.status).toBe("completed"); expect(runner.calls).toHaveLength(1);
    expect(completed?.agentSessionIds?.main).toBe("original-delayed-control-session");
    const events = await new ProjectStorage(root, new EventHub()).readEvents(project.id, 0, Number.MAX_SAFE_INTEGER);
    expect(events.filter(event => event.type === "invocation.completed")).toHaveLength(1);
    expect(events.some(event => event.type === "control.action.staged" && event.data?.callId === "original-delayed-control")).toBe(true);
  });

  it("does not start an Agent when any control-bridge startup error occurs", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-control-preflight-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    const runner = new ScriptedRunner(async (request) =>
      mainResult(request, decision("finish", "must not run"))
    );
    const orchestrator = new Orchestrator(
      storage,
      new SkillCatalog([builtinSkillRoot]),
      runner,
      {
        retryBaseMs: 1,
        retryMaxMs: 1,
        agentConcurrency: 1,
        controlBridgeFactory: async () => {
          const error = new Error("simulated EACCES while opening control socket") as NodeJS.ErrnoException;
          error.code = "EACCES";
          throw error;
        }
      }
    );
    liveOrchestrators.push(orchestrator);
    await orchestrator.initialize();

    const project = await orchestrator.createProject({
      title: "Control bridge preflight",
      requirement: "Do not launch Main without its authoritative control channel.",
      orchestration: mainOnlyOrchestration(),
      agents: { main: { skills: [], autoSkills: [] } }
    });
    await waitForRuntimePhase(orchestrator, project.id, "main-recovery-required");

    expect(runner.calls).toHaveLength(0);
    expect(await orchestrator.getProject(project.id)).toMatchObject({
      status: "retrying",
      phase: "main-recovery-required",
      queuedAgent: "main"
    });
    const failures = (await storage.readEvents(project.id)).filter(
      (event) => event.type === "control.channel.unavailable"
    );
    expect(failures).toHaveLength(2);
    expect(failures[0]).toMatchObject({
      data: {
        controlBridgeUnavailable: true,
        recoverable: true,
        reason: "simulated EACCES while opening control socket"
      }
    });
    await orchestrator.shutdown();
  }, 10_000);

  it("normalizes an absolute Main display path before persisting it", async () => {
    const { orchestrator, runner } = await harness(async (request) => {
      const result = decision("finish", "The Main workspace evidence is complete.");
      result.display = {
        primary: {
          agent: "main",
          path: path.join(
            request.projectPath,
            "workspaces",
            "Memory.md"
          ),
          title: "Main memory"
        },
        items: []
      };
      return mainResult(request, result);
    });

    const project = await orchestrator.createProject({
      title: "Absolute display path",
      requirement: "Verify safe display path normalization.",
      orchestration: mainOnlyOrchestration(),
      agents: { main: { skills: [], autoSkills: [] } }
    });
    await orchestrator.waitForIdle(project.id);

    const completed = await orchestrator.getProject(project.id);
    expect(completed?.display).toEqual({
      primary: { agent: "main", path: "Memory.md", title: "Main memory" },
      items: []
    });
    expect(completed?.latestAssignment?.display?.primary.path).toBe("Memory.md");
    expect(runner.calls).toHaveLength(1);
    await orchestrator.shutdown();
  });

  it("routes a completed termination Worker through Main before finish", async () => {
    const orchestration = twoAgentOrchestration({
      input: "review",
      termination: "review",
      workerRoutes: [
        { target: "main", kind: "weak" },
        { target: "finish", kind: "weak" }
      ]
    });
    const { orchestrator, runner } = await harness(async (request) => {
      if (request.agent === "review") return { handoff: workerResult("review").markdown };
      expect(request.project.pendingMainDecision).toMatchObject(
        request.control?.mainCapabilities?.controlMode === "weak-branch"
          ? {
              sourceAgent: "review",
              reason: "weak-branch",
              candidateAgents: ["main", "finish"],
              allowAnyAgent: false,
              capabilities: { canComplete: false, canRequestUser: false }
            }
          : {
              sourceAgent: "review",
              reason: "termination",
              candidateAgents: ["finish"],
              allowAnyAgent: true,
              capabilities: { canComplete: true, canRequestUser: true }
            }
      );
      return mainResult(request, decision("finish", "The review evidence satisfies the condition."));
    });

    const project = await orchestrator.createProject(projectInput(orchestration));
    await orchestrator.waitForIdle(project.id);

    expect(runner.calls.map((request) => request.agent)).toEqual([
      "review",
      "main",
      "main"
    ]);
    expect((await orchestrator.getProject(project.id))?.status).toBe("completed");
    await orchestrator.shutdown();
  });

  it("lets repeated termination reviews send rework to different configured Agents", async () => {
    const orchestration: AgentOrchestrationTemplate = {
      agents: [
        { name: "main", template: "main" },
        { name: "execution", template: "execution" },
        { name: "writing", template: "writing" },
        { name: "review", template: "review" }
      ],
      input: { source: "input", target: "review" },
      routes: {
        main: [
          { target: "execution", kind: "weak" },
          { target: "writing", kind: "weak" },
          { target: "review", kind: "weak" }
        ],
        execution: [{ target: "review", kind: "strong" }],
        writing: [{ target: "review", kind: "strong" }],
        review: [{ target: "finish", kind: "strong" }]
      },
      decisionPlans: {
        main: defaultDecisionPlan("main"),
        execution: "Repair the implementation evidence.",
        writing: "Repair the written deliverable.",
        review: "Check the current result against every requirement."
      },
      allowUserIntervention: true,
      termination: {
        agent: "review",
        condition: "Main accepts the reviewed result.",
        decisionBy: "main",
        automatic: false
      },
      resultFormat: { presets: [], custom: "" }
    };
    let mainTurn = 0;
    const { orchestrator, runner } = await harness(async (request) => {
      if (request.agent !== "main") {
        return { handoff: workerResult(request.agent).markdown };
      }
      mainTurn += 1;
      expect(request.project.pendingMainDecision).toMatchObject({
        sourceAgent: "review",
        reason: "termination",
        candidateAgents: ["finish"],
        allowAnyAgent: true,
        capabilities: {
          controlMode: "autonomous",
          routeCandidates: ["execution", "writing", "review"]
        }
      });
      return mainResult(
        request,
        mainTurn === 1
          ? decision("execution", "Repair the implementation evidence first.")
          : mainTurn === 2
            ? decision("writing", "Now repair the written deliverable.")
            : decision("finish", "Both independent rework rounds now satisfy the requirement.")
      );
    });

    const project = await orchestrator.createProject(projectInput(orchestration));
    await orchestrator.waitForIdle(project.id);

    expect(runner.calls.map((request) => request.agent)).toEqual([
      "review",
      "main",
      "execution",
      "review",
      "main",
      "writing",
      "review",
      "main"
    ]);
    expect(await orchestrator.getProject(project.id)).toMatchObject({
      status: "completed",
      phase: "accepted",
      runCounts: { execution: 1, writing: 1, review: 3, main: 3 }
    });
    await orchestrator.shutdown();
  });

  it("keeps one Main session while a weak Main choice starts an autonomous reassessment", async () => {
    const orchestration = branchOrchestration();
    let mainTurn = 0;
    const { orchestrator, runner } = await harness(async (request) => {
      if (request.agent === "branch") return { handoff: workerResult("branch").markdown };
      if (request.agent === "finish_worker") {
        return { handoff: workerResult("finish_worker").markdown };
      }
      mainTurn += 1;
      if (mainTurn === 1) {
        expect(request.project.pendingMainDecision?.candidateAgents).toEqual([
          "main",
          "finish_worker"
        ]);
        return mainResult(
          request,
          decision("main", "Reassess once with the complete Main context.")
        );
      }
      if (mainTurn === 2) {
        expect(request.project.pendingMainDecision).toMatchObject({
          sourceAgent: "branch",
          reason: "deterministic-route",
          candidateAgents: [],
          allowAnyAgent: true,
          capabilities: {
            controlMode: "autonomous",
            routeCandidates: ["branch", "finish_worker"]
          }
        });
        return mainResult(
          request,
          decision("finish_worker", "Produce the final bounded evidence.")
        );
      }
      return mainResult(
        request,
        decision("finish", "The termination Worker completed the result.")
      );
    });

    const project = await orchestrator.createProject(projectInput(orchestration));
    await orchestrator.waitForIdle(project.id);

    expect(runner.calls.map((request) => request.agent)).toEqual([
      "branch",
      "main",
      "main",
      "finish_worker",
      "main"
    ]);
    const mainCalls = runner.calls.filter((request) => request.agent === "main");
    expect(mainCalls.map((request) => request.resumeThreadId)).toEqual([
      undefined,
      "thread_main",
      "thread_main"
    ]);
    const finished = await orchestrator.getProject(project.id);
    expect(finished?.agentSessionIds?.main).toBe("thread_main");
    expect(finished?.executionCounts).toMatchObject({
      branch: 1,
      main: 3,
      finish_worker: 1
    });
    const events = await (
      orchestrator as unknown as { storage: ProjectStorage }
    ).storage.readEvents(project.id);
    const mainInvocationExecutionIds = events
      .filter(
        (event) =>
          event.type === "invocation.started" && event.agent === "main"
      )
      .map((event) => event.data?.executionId);
    expect(mainInvocationExecutionIds[0]).not.toBe(mainInvocationExecutionIds[1]);
    expect(mainInvocationExecutionIds[2]).not.toBe(mainInvocationExecutionIds[1]);
    expect(
      events.filter(
        (event) =>
          event.type === "agent.execution.started" && event.agent === "main"
      )
    ).toHaveLength(3);
    await orchestrator.shutdown();
  });

  it("hands an invalid Worker control action to Main without rerunning the Worker", async () => {
    let mainTurns = 0;
    const { orchestrator, runner } = await harness(async (request) => {
      if (request.agent === "branch") {
        const control = request.control!;
        await fs.writeFile(control.stagingPath, `${JSON.stringify([{
          projectId: request.project.id,
          agent: request.agent,
          invocationId: request.invocationId,
          callId: "invalid-route",
          stateVersion: control.stateVersion,
          capabilityHash: control.capabilityHash,
          receivedAt: new Date().toISOString(),
          action: { tool: "route_to_agent", target: "not-a-candidate", rationale: "forged" }
        }])}\n`, "utf8");
        return { handoff: "The Worker produced a durable recovery handoff." };
      }
      if (request.agent === "finish_worker") return { handoff: workerResult("finish_worker").markdown };
      mainTurns += 1;
      return mainResult(
        request,
        mainTurns === 1
          ? decision("finish_worker", "Recover through the configured finishing Worker.")
          : decision("finish", "The finishing Worker supplied the requested evidence.")
      );
    });
    const orchestration = branchOrchestration();
    const project = await orchestrator.createProject({
      title: "Invalid Worker control action",
      requirement: "Recover a Worker handoff after a rejected route action.",
      orchestration,
      agents: { branch: { decisionBy: "agent" } }
    });
    await orchestrator.waitForIdle(project.id);
    expect(runner.calls.map((request) => request.agent)).toEqual([
      "branch",
      "main",
      "finish_worker",
      "main"
    ]);
    expect((await orchestrator.getProject(project.id))?.status).toBe("completed");
    await orchestrator.shutdown();
  });

  it("lets only Main request the user and resumes the same thread after reply", async () => {
    let mainTurn = 0;
    const { orchestrator, runner } = await harness(async (request) => {
      mainTurn += 1;
      return mainResult(
        request,
        mainTurn === 1
          ? decision("user", "Please provide the missing approval.")
          : decision("finish", "The user response resolves the blocker.")
      );
    });

    const project = await orchestrator.createProject({
      title: "Main user intervention",
      requirement: "Ask for approval and then finish.",
      orchestration: mainOnlyOrchestration(),
      agents: { main: { skills: [], autoSkills: [] } }
    });
    await waitForRuntimePhase(orchestrator, project.id, "user-intervention-required");
    const paused = await orchestrator.getProject(project.id);
    expect(paused).toMatchObject({
      status: "retrying",
      phase: "user-intervention-required",
      agentSessionIds: { main: "thread_main" },
      userIntervention: {
        status: "pending",
        requestedBy: "main",
        requestKind: "main",
        message: "Please provide the missing approval."
      }
    });

    await orchestrator.respondToUserIntervention(
      project.id,
      "Approval granted."
    );
    await orchestrator.waitForIdle(project.id);
    expect((await orchestrator.getProject(project.id))?.status).toBe("completed");
    expect(runner.calls.map((request) => request.resumeThreadId)).toEqual([
      undefined,
      "thread_main"
    ]);
    expect(runner.calls[1].project.userIntervention).toMatchObject({
      status: "answered",
      response: "Approval granted."
    });
    expect((await orchestrator.getProject(project.id))?.executionCounts?.main).toBe(2);
    await orchestrator.shutdown();
  });

  it("persists a same-Harness replacement generation and emits its canonical event", async () => {
    let mainTurn = 0;
    const { orchestrator, runner } = await harness(async (request) => {
      mainTurn += 1;
      const session: SessionRef = {
        schemaVersion: 1,
        harnessId: "codex",
        adapterVersion: "1",
        generation: mainTurn - 1,
        nativeId: mainTurn === 1 ? "native-stale" : "native-replacement",
        durable: true,
        createdAt: new Date().toISOString()
      };
      await request.onDurableSessionStarted?.(session, session.nativeId);
      if (mainTurn === 2) {
        expect(request.project.agentSessions?.main).toMatchObject({
          harnessId: "codex",
          nativeId: "native-stale",
          generation: 0
        });
        const inbox = await fs.readFile(request.inboxPath, "utf8");
        expect(inbox).not.toContain("Main context mode: incremental (after event #");
        expect(await fs.readFile(path.join(request.projectPath, "request.md"), "utf8")).toContain("Persist and expose a same-Harness replacement without provider-specific parsing.");
        expect(inbox).toContain("Continue with replacement.");
        expect(inbox).not.toContain("project.history.handoffs");
      }
      return mainResult(
        request,
        mainTurn === 1
          ? decision("user", "Resume once so the runtime can replace the missing native session.")
          : decision("finish", "The replacement session completed the project."),
        session.nativeId,
        true,
        false
      );
    });

    const project = await orchestrator.createProject({
      title: "Structured session replacement",
      requirement: "Persist and expose a same-Harness replacement without provider-specific parsing.",
      orchestration: mainOnlyOrchestration(),
      agents: { main: { skills: [], autoSkills: [] } }
    });
    await waitForRuntimePhase(orchestrator, project.id, "user-intervention-required");
    await orchestrator.respondToUserIntervention(project.id, "Continue with replacement.");
    await orchestrator.waitForIdle(project.id);

    expect(runner.calls.map((request) => request.resumeThreadId)).toEqual([
      undefined,
      "native-stale"
    ]);
    expect(await orchestrator.getProject(project.id)).toMatchObject({
      status: "completed",
      agentSessionIds: { main: "native-replacement" },
      agentSessions: {
        main: {
          harnessId: "codex",
          nativeId: "native-replacement",
          generation: 1,
          durable: true
        }
      },
      agentSessionMeta: {
        main: {
          generation: 1,
          resumeFailureCount: 0
        }
      }
    });
    expect((await orchestrator.getProject(project.id))?.agentSessionMeta?.main)
      .not.toHaveProperty("replacementPending");
    const storage = (orchestrator as unknown as { storage: ProjectStorage }).storage;
    const replacementEvents = (await storage.readEvents(project.id)).filter(
      (event) => event.type === "session.replaced"
    );
    expect(replacementEvents).toHaveLength(1);
    expect(replacementEvents[0]).toMatchObject({
      agent: "main",
      data: {
        errorCode: "SESSION_RESUME_FAILED",
        harnessId: "codex",
        previousHarnessId: "codex",
        previousGeneration: 0,
        replacementGeneration: 1,
        contextReset: true
      }
    });
    await orchestrator.shutdown();
  });

  it("persists both durable session identities in one state save without a half-state", async () => {
    let captureSessionWrite = false;
    const observedSessionWrites: Array<{
      structured?: SessionRef;
      legacy?: string;
    }> = [];
    const { orchestrator } = await harness(async (request) => {
      expect(request.onDurableSessionStarted).toBeTypeOf("function");
      expect(request.onSessionStarted).toBeUndefined();
      expect(request.onThreadStarted).toBeUndefined();
      const session: SessionRef = {
        schemaVersion: 1,
        harnessId: "codex",
        adapterVersion: "atomic-session-fixture-1",
        generation: 0,
        nativeId: "native-atomic",
        durable: true,
        createdAt: new Date().toISOString()
      };
      captureSessionWrite = true;
      try {
        await request.onDurableSessionStarted?.(session, session.nativeId);
      } finally {
        captureSessionWrite = false;
      }
      return mainResult(
        request,
        decision("finish", "The atomic durable identity was persisted."),
        session.nativeId,
        true,
        false
      );
    });
    const storage = (orchestrator as unknown as { storage: ProjectStorage }).storage;
    const saveState = storage.saveState.bind(storage);
    vi.spyOn(storage, "saveState").mockImplementation(async (state) => {
      if (captureSessionWrite) {
        observedSessionWrites.push({
          structured: structuredClone(state.agentSessions?.main),
          legacy: state.agentSessionIds?.main
        });
      }
      await saveState(state);
    });

    const project = await orchestrator.createProject({
      title: "Atomic durable session identity",
      requirement: "Never persist only one representation of a durable Harness session.",
      orchestration: mainOnlyOrchestration(),
      agents: { main: { skills: [], autoSkills: [] } }
    });
    await orchestrator.waitForIdle(project.id);

    expect(observedSessionWrites).toEqual([{
      structured: expect.objectContaining({
        harnessId: "codex",
        nativeId: "native-atomic",
        generation: 0,
        durable: true
      }),
      legacy: "native-atomic"
    }]);
    expect(await orchestrator.getProject(project.id)).toMatchObject({
      agentSessionIds: { main: "native-atomic" },
      agentSessions: {
        main: {
          harnessId: "codex",
          nativeId: "native-atomic",
          generation: 0,
          durable: true
        }
      }
    });
    const events = await storage.readEvents(project.id);
    expect(events.filter((event) => event.type === "session.started")).toHaveLength(1);
    expect(events.filter((event) => event.type === "session.replaced")).toHaveLength(0);
    await orchestrator.shutdown();
  });

  it("routes later user input to the same Main thread after completion", async () => {
    let mainTurn = 0;
    const { orchestrator, runner } = await harness(async (request) => {
      mainTurn += 1;
      if (mainTurn === 2) {
        expect(request.project.userInputs).toEqual([
          expect.objectContaining({
            status: "pending",
            message: "Add one final robustness check."
          })
        ]);
      }
      return mainResult(
        request,
        decision("finish", `Main completed turn ${mainTurn}.`)
      );
    });

    const project = await orchestrator.createProject({
      title: "Persistent Main continuation",
      requirement: "Complete the initial request and accept later input.",
      orchestration: mainOnlyOrchestration(),
      agents: { main: { skills: [], autoSkills: [] } }
    });
    await orchestrator.waitForIdle(project.id);
    expect((await orchestrator.getProject(project.id))?.status).toBe("completed");

    await orchestrator.addProjectUserInput(
      project.id,
      "Add one final robustness check."
    );
    await orchestrator.waitForIdle(project.id);

    expect((await orchestrator.getProject(project.id))?.status).toBe("completed");
    expect(runner.calls.map((request) => request.agent)).toEqual(["main", "main"]);
    expect(runner.calls.map((request) => request.resumeThreadId)).toEqual([
      undefined,
      "thread_main"
    ]);
    await orchestrator.shutdown();
  });

  it("propagates a Main-delivered project requirement update to downstream Workers", async () => {
    let mainTurn = 0;
    let workerTurn = 0;
    const update = "Replace baseline.md with revised.md and do not create baseline.md.";
    const { orchestrator, runner } = await harness(async (request) => {
      if (request.agent === "worker") {
        workerTurn += 1;
        if (workerTurn === 2) {
          const inbox = await fs.readFile(request.inboxPath, "utf8");
          expect(inbox).not.toContain("## Current user requirement updates");
          expect(inbox).toContain(update);
          expect(inbox).toContain("来源：main");
          expect(request.project.userInputs).toEqual([]);
        }
        return { handoff: workerResult("worker").markdown };
      }

      mainTurn += 1;
      return mainResult(
        request,
        mainTurn === 1 || mainTurn === 3
          ? decision("worker", `Worker assignment ${mainTurn}.${mainTurn === 3 ? " " + update : ""}`)
          : decision("finish", `Main completed turn ${mainTurn}.`)
      );
    });
    const orchestration = twoAgentOrchestration({
      input: "main",
      termination: "main",
      workerRoutes: [{ target: "main", kind: "strong" }]
    });

    const project = await orchestrator.createProject(projectInput(orchestration));
    await orchestrator.waitForIdle(project.id);
    expect((await orchestrator.getProject(project.id))?.status).toBe("completed");

    await orchestrator.addProjectUserInput(project.id, update, "wait");
    await orchestrator.waitForIdle(project.id);

    expect(runner.calls.map((request) => request.agent)).toEqual([
      "main",
      "worker",
      "main",
      "main",
      "worker",
      "main"
    ]);
    expect(workerTurn).toBe(2);
    expect((await orchestrator.getProject(project.id))?.status).toBe("completed");
    await orchestrator.shutdown();
  });

  it.each([
    ["HARNESS_CONTRACT_VIOLATION", "adapter"],
    ["HARNESS_CONFIGURATION_INVALID", "adapter"],
    ["SESSION_RESUME_FAILED", "adapter"],
    ["PROTOCOL_RECOVERY_EXHAUSTED", "gateway"],
    ["MODEL_CONTEXT_LIMIT_EXCEEDED", "gateway"]
  ] as const)("stops automatic recovery after a non-retryable %s invocation and persists safe classification", async (code, source) => {
    const leakedApiKey = "sk-nonretryable-secret123456";
    let attempts = 0;
    const { orchestrator, runner, root } = await harness(async () => {
      attempts += 1;
      throw new HarnessRuntimeError(
        code,
        `Official event contract failed with api_key=${leakedApiKey}`,
        { harnessId: "fixture-harness" },
        { source, retryable: false }
      );
    });

    const project = await orchestrator.createProject({
      title: "Non-retryable Harness failure",
      requirement: "Pause rather than retry a deterministic Harness contract failure.",
      orchestration: mainOnlyOrchestration(),
      agents: { main: { skills: [], autoSkills: [] } }
    });
    await waitForRuntimePhase(orchestrator, project.id, "harness-recovery-required");

    const paused = await orchestrator.getProject(project.id);
    expect(attempts).toBe(1);
    expect(paused).toMatchObject({
      status: "interrupted",
      phase: "harness-recovery-required",
      queuedAgent: "main",
      workerFailureCounts: { main: 1 },
      agentFailureHistory: {
        main: [{
          errorType: "HarnessRuntimeError",
          errorCode: code,
          errorSource: source,
          retryable: false
        }]
      }
    });
    const events = await (
      orchestrator as unknown as { storage: ProjectStorage }
    ).storage.readEvents(project.id);
    const invocationFailure = events.find((event) => event.type === "invocation.failed");
    const agentFailure = events.find((event) => event.type === "agent.failed");
    expect(invocationFailure?.data).toMatchObject({
      errorCode: code,
      errorSource: source,
      retryable: false
    });
    expect(agentFailure?.data).toMatchObject({
      errorCode: code,
      errorSource: source,
      retryable: false,
      automaticRetry: false,
      userActionRequired: true,
      harnessRecoveryRequired: true
    });
    expect(JSON.stringify({ paused, events })).not.toContain(leakedApiKey);
    await orchestrator.shutdown();
    const restarted = new Orchestrator(new ProjectStorage(root, new EventHub()), new SkillCatalog([builtinSkillRoot]), runner,
      { retryBaseMs: 1, retryMaxMs: 1, agentConcurrency: 2 });
    liveOrchestrators.push(restarted);
    await restarted.initialize(); await restarted.waitForIdle(project.id);
    expect((await restarted.getProject(project.id))).toMatchObject({ status: "interrupted", phase: "harness-recovery-required" });
    expect(attempts).toBe(1);
    await restarted.resume(project.id); await restarted.waitForIdle(project.id);
    expect(attempts).toBe(2);
    expect((await restarted.getProject(project.id))).toMatchObject({ status: "interrupted", phase: "harness-recovery-required" });
    await restarted.shutdown();
  });

  it.each(["codex", "claude-code", "pi", "dsh"])("preserves the %s task after exhausted correction and resumes it only on explicit request", async harnessId => {
    let attempts = 0;
    const { orchestrator, runner } = await harness(async request => {
      attempts += 1;
      if (attempts === 1) throw new ProtocolRecoveryExhaustedError(harnessId, { toolName: "state_patch", recoveryLimit: 1 });
      return mainResult(request, decision("finish", "Recovered original task."));
    });
    try {
      const project = await orchestrator.createProject({ title: "Transient Gateway failure",
        requirement: "Continue the original task after automatic protocol recovery.", orchestration: mainOnlyOrchestration(),
        agents: { main: { harness: harnessId, skills: [], autoSkills: [] } } });
      await waitForRuntimePhase(orchestrator, project.id, "harness-recovery-required");
      expect(attempts).toBe(1);
      expect(await orchestrator.getProject(project.id)).toMatchObject({ status: "interrupted", phase: "harness-recovery-required" });
      await orchestrator.resume(project.id);
      await orchestrator.waitForIdle(project.id);
      expect(attempts).toBe(2);
      expect(await orchestrator.getProject(project.id)).toMatchObject({ status: "completed",
        executionCounts: { main: 1 }, workerFailureCounts: { main: 0 } });
      expect(runner.calls[0]!.taskSessionId).toBe(runner.calls[1]!.taskSessionId);
      const events = await (orchestrator as unknown as { storage: ProjectStorage }).storage.readEvents(project.id);
      expect(events.find(event => event.type === "agent.failed")?.data).toMatchObject({
        errorCode: "PROTOCOL_RECOVERY_EXHAUSTED", automaticRetry: false, userActionRequired: true });
      expect(events.some(event => event.type === "project.status" && event.data?.status === "paused")).toBe(false);
    } finally { await orchestrator.shutdown(); }
  });

  it("keeps retrying Harness process failures after its fast retry allowance", async () => {
    let attempts = 0;
    const { orchestrator } = await harness(async () => {
      attempts += 1;
      throw new HarnessRuntimeError(
        "HARNESS_PROCESS_EXITED",
        `Harness process attempt ${attempts} exited`,
        { exitCode: 1, harnessId: "fixture-harness" },
        { source: "process" }
      );
    });

    const project = await orchestrator.createProject({
      title: "Retryable Harness process failure",
      requirement: "Use the bounded whole-invocation retry policy.",
      orchestration: mainOnlyOrchestration(),
      agents: { main: { skills: [], autoSkills: [] } }
    });
    await waitForRuntimePhase(orchestrator, project.id, "main-recovery-required");

    expect(attempts).toBe(2);
    expect(await orchestrator.getProject(project.id)).toMatchObject({
      status: "retrying",
      phase: "main-recovery-required",
      queuedAgent: "main",
      executionCounts: { main: 1 },
      workerFailureCounts: { main: 2 },
      agentFailureHistory: {
        main: [
          {
            errorCode: "HARNESS_PROCESS_EXITED",
            errorSource: "process",
            retryable: true
          },
          {
            errorCode: "HARNESS_PROCESS_EXITED",
            errorSource: "process",
            retryable: true
          }
        ]
      }
    });
    const events = await (
      orchestrator as unknown as { storage: ProjectStorage }
    ).storage.readEvents(project.id);
    const failures = events.filter((event) => event.type === "agent.failed");
    expect(failures).toHaveLength(2);
    expect(failures[0]?.data).toMatchObject({
      errorCode: "HARNESS_PROCESS_EXITED",
      errorSource: "process",
      retryable: true,
      failureCount: 1
    });
    expect(failures[0]?.data?.retryAt).toEqual(expect.any(String));
    expect(failures[1]?.data).toMatchObject({
      errorCode: "HARNESS_PROCESS_EXITED",
      errorSource: "process",
      retryable: true,
      failureCount: 2,
      resumeMain: true
    });
    expect(
      events.filter((event) => event.type === "agent.execution.started")
    ).toHaveLength(1);
    await orchestrator.shutdown();
  });

  it("hands a Worker to Main after exactly five failed whole invocations", async () => {
    const orchestration = twoAgentOrchestration({
      input: "worker",
      termination: "main",
      workerRoutes: [{ target: "main", kind: "strong" }]
    });
    let workerFailures = 0;
    const { orchestrator, runner } = await harness(async (request) => {
      if (request.agent === "worker") {
        workerFailures += 1;
        throw new Error(`whole invocation ${workerFailures} failed`);
      }
      const pending = request.project.pendingMainDecision;
      expect(pending).toMatchObject({
        sourceAgent: "worker",
        reason: "exception",
        allowAnyAgent: true,
        candidateAgents: ["worker"]
      });
      const diagnostic = JSON.parse(pending?.diagnostic ?? "{}") as {
        failedAgent?: string;
        failures?: unknown[];
      };
      expect(diagnostic.failedAgent).toBe("worker");
      expect(diagnostic.failures).toHaveLength(WORKER_INVOCATION_FAILURE_LIMIT);
      return mainResult(
        request,
        decision("user", "All automatic Worker retries failed; choose a recovery action.")
      );
    });

    const project = await orchestrator.createProject(projectInput(orchestration));
    await waitForRuntimePhase(orchestrator, project.id, "user-intervention-required");

    expect(workerFailures).toBe(WORKER_INVOCATION_FAILURE_LIMIT);
    expect(runner.calls.map((request) => request.agent)).toEqual([
      "worker",
      "worker",
      "worker",
      "worker",
      "worker",
      "main"
    ]);
    expect(await orchestrator.getProject(project.id)).toMatchObject({
      status: "retrying",
      phase: "user-intervention-required",
      userIntervention: { requestedBy: "main" },
      executionCounts: { worker: 1, main: 1 }
    });
    await orchestrator.shutdown();
  }, 10_000);

  it("automatically recovers Main beyond its fast retry allowance in the same task and thread", async () => {
    let attempt = 0;
    const { orchestrator, runner } = await harness(async (request) => {
      attempt += 1;
      await publishDurableSession(request, "thread_recovery");
      if (attempt <= 2) throw new Error(`Main whole invocation ${attempt} failed`);
      return mainResult(
        request,
        decision("finish", "Main recovered and completed the project."),
        "thread_recovery"
      );
    });

    const project = await orchestrator.createProject({
      title: "Main recovery",
      requirement: "Recover the persistent Main thread.",
      orchestration: mainOnlyOrchestration(),
      agents: { main: { skills: [], autoSkills: [] } }
    });
    await orchestrator.waitForIdle(project.id);
    expect(await orchestrator.getProject(project.id)).toMatchObject({
      status: "completed",
      agentSessionIds: { main: "thread_recovery" }
    });
    expect(runner.calls.map((request) => request.resumeThreadId)).toEqual([
      undefined,
      "thread_recovery",
      "thread_recovery"
    ]);
    await expect(
      orchestrator.updateAgentConfigs(project.id, {
        main: { model: "different-model" }
      })
    ).rejects.toBeInstanceOf(ProjectConfigurationLockedError);

    expect(await orchestrator.getProject(project.id)).toMatchObject({
      status: "completed",
      executionCounts: { main: 1 }
    });
    expect(runner.calls[2].resumeThreadId).toBe("thread_recovery");
    await orchestrator.shutdown();
  }, 10_000);

  it("does not parse provider resume text outside the Harness runtime", async () => {
    let attempt = 0;
    const { orchestrator, runner } = await harness(async (request) => {
      attempt += 1;
      if (attempt === 1) {
        await publishDurableSession(request, "stale-main-thread");
        throw new Error("Harness process was interrupted");
      }
      expect(request.resumeThreadId).toBe("stale-main-thread");
      throw new Error(
        "No conversation found with session ID: stale-main-thread"
      );
    });

    const project = await orchestrator.createProject({
      title: "Missing Main session recovery",
      requirement: "Replace a provider session that cannot be resumed.",
      orchestration: mainOnlyOrchestration(),
      agents: { main: { skills: [], autoSkills: [] } }
    });
    await waitForRuntimePhase(orchestrator, project.id, "main-recovery-required");

    const recovered = await orchestrator.getProject(project.id);
    expect({
      calls: runner.calls.map((request) => request.resumeThreadId),
      status: recovered?.status,
      phase: recovered?.phase,
      failures: recovered?.workerFailureCounts?.main,
      sessionId: recovered?.agentSessionIds?.main
    }).toEqual({
      calls: [undefined, "stale-main-thread"],
      status: "retrying",
      phase: "main-recovery-required",
      failures: 2,
      sessionId: "stale-main-thread"
    });
    expect(recovered).toMatchObject({
      status: "retrying",
      phase: "main-recovery-required",
      agentSessionIds: { main: "stale-main-thread" },
      agentSessionMeta: {
        main: { generation: 0, resumeFailureCount: 0 }
      }
    });
    const storage = (orchestrator as unknown as { storage: ProjectStorage }).storage;
    const events = await storage.readEvents(project.id);
    expect(events.filter((event) => event.type === "session.resume_failed")).toHaveLength(0);
    await orchestrator.shutdown();
  }, 10_000);

  it("repairs a missing Main terminal action in the same invocation", async () => {
    const originalHandoff = "Main completed the requested analysis but has not recorded a decision yet.";
    let invocationId: string | undefined;
    const { orchestrator, runner } = await harness(async (request, index) => {
      if (index === 0) {
        invocationId = request.invocationId;
        await publishDurableSession(request, "thread_missing_terminal");
        return {
          handoff: originalHandoff,
          threadId: "thread_missing_terminal"
        };
      }
      expect(request).toMatchObject({
        invocationId,
        resumeThreadId: "thread_missing_terminal",
        skillPaths: [],
        autoSkillPaths: [],
        terminalControlRepair: { originalHandoff },
        control: {
          mainCapabilities: {
            controlMode: "autonomous",
            canComplete: true
          }
        }
      });
      expect(request.availableSkillPaths).toEqual([]);
      return mainResult(
        request,
        decision("finish", "The original Main work is complete."),
        "thread_missing_terminal"
      );
    });

    const project = await orchestrator.createProject({
      title: "Main ordinary decision continuation",
      requirement: "Let Main continue normally when a turn has no decision.",
      orchestration: mainOnlyOrchestration(),
      agents: { main: { skills: [], autoSkills: [] } }
    });
    await orchestrator.waitForIdle(project.id);

    expect(runner.calls).toHaveLength(2);
    expect(runner.calls.map((request) => request.invocationId)).toEqual([invocationId, invocationId]);
    expect(await orchestrator.getProject(project.id)).toMatchObject({
      status: "completed",
      phase: "accepted",
      mainInvocationSeq: 1,
      runCounts: { main: 1 },
      executionCounts: { main: 1 },
      agentSessionIds: { main: "thread_missing_terminal" }
    });
    await orchestrator.shutdown();
  }, 10_000);

  it("retains the original task for automatic recovery when the evidence-aware repair also omits a terminal action", async () => {
    const originalHandoff = "Main completed the business work but forgot to commit its decision.";
    const { orchestrator, runner } = await harness(async (request, index) => {
      await publishDurableSession(request, "thread_missing_terminal_twice");
      return {
        handoff: index === 0
          ? originalHandoff
          : "The repair turn also returned prose without a terminal action.",
        threadId: "thread_missing_terminal_twice"
      };
    });

    const project = await orchestrator.createProject({
      title: "Main repeated ordinary continuation",
      requirement: "Continue Main normally until it is ready to decide.",
      orchestration: mainOnlyOrchestration(),
      agents: { main: { skills: [], autoSkills: [] } }
    });
    await waitForRuntimePhase(orchestrator, project.id, "missing-terminal-action");

    expect(runner.calls).toHaveLength(2);
    expect(runner.calls[1]).toMatchObject({
      invocationId: runner.calls[0]?.invocationId,
      resumeThreadId: "thread_missing_terminal_twice",
      terminalControlRepair: { originalHandoff },
      control: {
        mainCapabilities: {
          controlMode: "autonomous",
          canComplete: true
        }
      }
    });
    expect(await orchestrator.getProject(project.id)).toMatchObject({
      status: "retrying",
      phase: "missing-terminal-action",
      queuedAgent: "main",
      mainInvocationSeq: 1,
      runCounts: { main: 0 },
      executionCounts: { main: 1 },
      agentSessionIds: { main: "thread_missing_terminal_twice" },
      latestHandoff: { excerpt: originalHandoff },
      activeAgentExecution: { agent: "main" }
    });
    await orchestrator.shutdown();
  }, 10_000);

  it("redacts gateway credentials from persisted invocation failures and public events", async () => {
    const leakedApiKey = "sk-testcredential123456789";
    const leakedBearer = "bearer-token-that-must-not-persist";
    const leakedClassicGitHub = "ghp_1234567890abcdefghij";
    const leakedFineGrainedGitHub = "github_pat_1234567890abcdefghij";
    const leakedBasic = "YWxhZGRpbjpvcGVuIHNlc2FtZQ==";
    const leakedUrlUserInfo = "alice:swordfish";
    const leakedPrivateKey = "PRIVATE-KEY-MATERIAL";
    const { orchestrator } = await harness(async () => {
      throw new Error(
        [
          `provider rejected API-Key=${leakedApiKey}`,
          `Authorization: Bearer ${leakedBearer}`,
          `Proxy_Authorization: Basic ${leakedBasic}`,
          leakedClassicGitHub,
          leakedFineGrainedGitHub,
          `https://${leakedUrlUserInfo}@example.test/private.git`,
          `-----BEGIN PRIVATE KEY-----\n${leakedPrivateKey}\n-----END PRIVATE KEY-----`,
          "x".repeat(10_000)
        ].join(" ")
      );
    });

    const project = await orchestrator.createProject({
      title: "Credential redaction",
      requirement: "Verify failure diagnostics never persist gateway credentials.",
      orchestration: mainOnlyOrchestration(),
      agents: { main: { skills: [], autoSkills: [] } }
    });
    await waitForRuntimePhase(orchestrator, project.id, "main-recovery-required");

    const persisted = await orchestrator.getProject(project.id);
    const serialized = JSON.stringify(persisted);
    for (const leaked of [
      leakedApiKey,
      leakedBearer,
      leakedClassicGitHub,
      leakedFineGrainedGitHub,
      leakedBasic,
      leakedUrlUserInfo,
      leakedPrivateKey
    ]) {
      expect(serialized).not.toContain(leaked);
    }
    expect(serialized).toContain("[REDACTED]");
    expect(persisted.lastError?.length).toBeLessThanOrEqual(4_000);
    expect(persisted.agentFailureHistory?.main?.every((failure) =>
      failure.error.length <= 4_000
    )).toBe(true);
    await orchestrator.shutdown();
  }, 10_000);

  it("persists wait-mode input and wakes Main only after the active invocation finishes", async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    let calls = 0;
    const { orchestrator, runner } = await harness(async (request) => {
      calls += 1;
      if (calls === 1) await gate;
      return mainResult(request, decision("finish", `turn-${calls}`));
    });
    const project = await orchestrator.createProject({
      title: "Wait mode input",
      requirement: "Keep the current invocation alive while queuing a user requirement.",
      orchestration: mainOnlyOrchestration(),
      agents: { main: { skills: [], autoSkills: [] } }
    });
    for (let attempt = 0; attempt < 100 && runner.calls.length < 1; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
    expect(runner.calls).toHaveLength(1);
    const queued = await orchestrator.addProjectUserInput(
      project.id,
      "Keep the current evidence and add a robustness check.",
      "wait",
      "wait-mode-test"
    );
    expect(queued.userInputs).toEqual([
      expect.objectContaining({ mode: "wait", requestId: "wait-mode-test", status: "pending" })
    ]);
    expect(queued.status).toBe("running");
    release();
    await orchestrator.waitForIdle(project.id);
    const finished = await orchestrator.getProject(project.id);
    expect(finished?.status).toBe("completed");
    expect(finished?.userInputs?.[0]).toMatchObject({
      status: "delivered",
      mode: "wait",
      requestId: "wait-mode-test"
    });
    expect(runner.calls).toHaveLength(2);
    const events = await (orchestrator as unknown as { storage: ProjectStorage }).storage.readEvents(project.id);
    expect(events.filter((event) => event.type === "main.assignment.queued")).toHaveLength(1);
    await orchestrator.shutdown();
  }, 10_000);

  it("resumes a paused Worker checkpoint at Main when a wait-mode requirement is pending", async () => {
    let releaseFirst!: () => void;
    const firstGate = new Promise<void>((resolve) => { releaseFirst = resolve; });
    let mainTurns = 0;
    const { orchestrator, runner } = await harness(async (request) => {
      if (request.agent === "first") {
        await firstGate;
        return { handoff: workerResult("first").markdown };
      }
      if (request.agent === "second") {
        return { handoff: workerResult("second").markdown };
      }
      mainTurns += 1;
      if (mainTurns === 1) {
        expect(request.project.userInputs).toEqual([
          expect.objectContaining({
            message: "Correct the paused assignment before second runs.",
            status: "pending"
          })
        ]);
      }
      return mainResult(
        request,
        mainTurns === 1
          ? decision("second", "Apply the corrected requirement in second.")
          : decision("finish", "The corrected second-stage evidence is complete.")
      );
    });
    const orchestration: AgentOrchestrationTemplate = {
      agents: [
        { name: "main", template: "main" },
        { name: "first", template: "general" },
        { name: "second", template: "review" }
      ],
      input: { source: "input", target: "first" },
      routes: {
        main: [{ target: "second", kind: "weak" }],
        first: [{ target: "second", kind: "weak" }],
        second: [
          { target: "main", kind: "weak" },
          { target: "finish", kind: "weak" }
        ]
      },
      decisionPlans: {
        main: defaultDecisionPlan("main"),
        first: "Prepare the first-stage evidence.",
        second: "Verify the evidence after Main applies any correction."
      },
      allowUserIntervention: true,
      termination: {
        agent: "second",
        condition: "The corrected second-stage evidence is complete.",
        decisionBy: "main",
        automatic: false
      },
      resultFormat: { presets: [], custom: "" }
    };
    const project = await orchestrator.createProject(projectInput(orchestration));
    for (let attempt = 0; attempt < 100 && runner.calls.length < 1; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
    expect(runner.calls.map((request) => request.agent)).toEqual(["first"]);
    await orchestrator.pause(project.id);
    releaseFirst();
    await orchestrator.waitForIdle(project.id);
    expect(await orchestrator.getProject(project.id)).toMatchObject({
      status: "paused",
      queuedAgent: "second"
    });

    await orchestrator.addProjectUserInput(
      project.id,
      "Correct the paused assignment before second runs.",
      "wait",
      "paused-requirement-test"
    );
    await orchestrator.resume(project.id);
    await orchestrator.waitForIdle(project.id);

    expect(runner.calls.map((request) => request.agent)).toEqual([
      "first",
      "main",
      "second",
      "main",
      "main"
    ]);
    expect(await orchestrator.getProject(project.id)).toMatchObject({
      status: "completed",
      userInputs: [expect.objectContaining({ status: "delivered" })]
    });
    await orchestrator.shutdown();
  }, 10_000);

  it("interrupts a running invocation after persisting a checkpoint and wakes Main exactly once", async () => {
    let calls = 0;
    const { orchestrator, runner } = await harness(async (request, _index, signal) => {
      calls += 1;
      if (calls === 1) {
        await new Promise<never>((_resolve, reject) => {
          void request.onModelActivity?.({
            kind: "model",
            phase: "delta",
            source: "harness",
            deltaKind: "visible-text"
          });
          signal.addEventListener("abort", () => reject(new AgentInterruptedError("test interrupt")), { once: true });
        });
      }
      return mainResult(request, decision("finish", "Main accepted the interrupted checkpoint."));
    });
    const project = await orchestrator.createProject({
      title: "Interrupt mode input",
      requirement: "Interrupt the active call and let Main reassess the saved partial work.",
      orchestration: mainOnlyOrchestration(),
      agents: { main: { skills: [], autoSkills: [] } }
    });
    for (let attempt = 0; attempt < 100 && runner.calls.length < 1; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
    const requested = await orchestrator.addProjectUserInput(
      project.id,
      "Stop this line and prioritize the missing evidence.",
      "interrupt",
      "interrupt-mode-test"
    );
    expect(requested.status).toBe("interrupting");
    await orchestrator.waitForIdle(project.id);
    const finished = await orchestrator.getProject(project.id);
    expect(finished?.status).toBe("completed");
    expect(finished?.interruptionSnapshot).toMatchObject({
      inputId: expect.any(String),
      requestId: "interrupt-mode-test",
      agent: "main",
      invocationId: expect.any(String),
      status: "interrupted",
      recoverable: true
    });
    expect(finished?.userInputs?.[0]).toMatchObject({ status: "delivered", mode: "interrupt" });
    expect(runner.calls).toHaveLength(2);
    const storage = (orchestrator as unknown as { storage: ProjectStorage }).storage;
    const events = await storage.readEvents(project.id);
    expect(events.filter((event) => event.type === "agent.interrupted")).toHaveLength(1);
    expect(events.filter((event) => event.type === "user.input.interrupt.completed")).toHaveLength(1);
    expect(events.some((event) => event.type === "control.action.committed" && event.data?.invocationId === runner.calls[0]?.invocationId)).toBe(false);
    const duplicate = await orchestrator.addProjectUserInput(
      project.id,
      "Stop this line and prioritize the missing evidence.",
      "interrupt",
      "interrupt-mode-test"
    );
    expect(duplicate.userInputs?.filter((input) => input.requestId === "interrupt-mode-test")).toHaveLength(1);
    await orchestrator.shutdown();
  }, 10_000);

  it("force-terminates a non-cooperative runner at the interrupt deadline", async () => {
    let cleanupCalls = 0;
    const { orchestrator, runner } = await harness(async (request) => {
      if (runner.calls.length === 1) {
        await new Promise<never>(() => undefined);
      }
      return mainResult(request, decision("finish", "Recovered after force termination."));
    }, { interruptForceTimeoutMs: 20 });
    // Inject the optional cleanup hook on the scripted runner without
    // changing its normal call recording behavior.
    runner.cleanupInterrupted = async () => { cleanupCalls += 1; };
    const project = await orchestrator.createProject({
      title: "Force interrupt",
      requirement: "Bound the interrupt even when a runner ignores AbortSignal.",
      orchestration: mainOnlyOrchestration(),
      agents: { main: { skills: [], autoSkills: [] } }
    });
    for (let attempt = 0; attempt < 100 && runner.calls.length < 1; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 5));
    }
    await orchestrator.addProjectUserInput(project.id, "Take over now.", "interrupt", "force-mode-test");
    await orchestrator.waitForIdle(project.id);
    const finished = await orchestrator.getProject(project.id);
    expect(finished?.status).toBe("completed");
    expect(finished?.interruptionSnapshot).toMatchObject({
      status: "force-terminated",
      forceTerminated: true,
      recoverable: true
    });
    expect(cleanupCalls).toBeGreaterThanOrEqual(1);
    await orchestrator.shutdown();
  }, 10_000);
});

async function waitForRuntimePhase(orchestrator: Orchestrator, projectId: string, phase: string): Promise<void> {
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    const project = await orchestrator.getProject(projectId);
    if (project.phase === phase && (project.status === "retrying" || phase === "harness-recovery-required" && project.status === "interrupted")) return;
    await new Promise(resolve => setTimeout(resolve, 5));
  }
  const project = await orchestrator.getProject(projectId);
  throw new Error(`Expected an automatic recovery checkpoint for ${phase}: ${JSON.stringify({ status: project.status, phase: project.phase, failures: project.workerFailureCounts, error: project.lastError })}`);
}

async function harness(
  handler: RunnerHandler,
  options: {
    controlBridgeFactory?: typeof startControlActionBridge;
    interruptForceTimeoutMs?: number;
    agentActivityIdleWindowMs?: number;
    agentToolActivityIdleWindowMs?: number;
  } = {}
): Promise<{
  orchestrator: Orchestrator;
  runner: ScriptedRunner;
  root: string;
}> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-main-state-"));
  temporaryRoots.push(root);
  const runner = new ScriptedRunner(handler);
  const orchestrator = new Orchestrator(
    new ProjectStorage(root, new EventHub()),
    new SkillCatalog([builtinSkillRoot]),
    runner,
    { retryBaseMs: 1, retryMaxMs: 1, agentConcurrency: 2, ...options }
  );
  liveOrchestrators.push(orchestrator);
  await orchestrator.initialize();
  return { orchestrator, runner, root };
}

function projectInput(orchestration: AgentOrchestrationTemplate) {
  return {
    title: "Main state-machine project",
    requirement: "Verify the public Main orchestration state machine.",
    orchestration,
    agents: Object.fromEntries(
      orchestration.agents.map((definition) => [
        definition.name,
        { model: "test-model", skills: [], autoSkills: [] }
      ])
    )
  };
}

function mainOnlyOrchestration(): AgentOrchestrationTemplate {
  return {
    agents: [{ name: "main", template: "main" }],
    input: { source: "input", target: "main" },
    routes: { main: [] },
    decisionPlans: { main: defaultDecisionPlan("main") },
    allowUserIntervention: true,
    termination: {
      agent: "main",
      condition: "Main has produced the requested bounded result.",
      decisionBy: "main",
      automatic: false
    },
    resultFormat: { presets: [], custom: "" }
  };
}

function collaborationOrchestration(displayName: string): AgentOrchestrationTemplate {
  return {
    schemaVersion: 2,
    agents: [
      { name: "main", template: "main" },
      { name: "alice", template: "general" },
      { name: "bob", template: "general" }
    ],
    collaborations: [{
      id: "research_group",
      displayName,
      memberAgentIds: ["alice", "bob"],
      renamePolicy: "editable"
    }],
    input: { source: "input", target: "research_group" },
    routes: {
      main: [{ target: "research_group", kind: "weak" }],
      research_group: [{ target: "finish", kind: "weak" }]
    },
    decisionPlans: {
      main: defaultDecisionPlan("main"),
      research_group: "Complete the collaboration."
    },
    allowUserIntervention: true,
    allowMainReconfiguration: true,
    termination: {
      agent: "research_group",
      condition: "The group result is complete.",
      decisionBy: "main",
      automatic: false
    },
    resultFormat: { presets: [], custom: "" }
  };
}

function twoAgentOrchestration(options: {
  input: string;
  termination: string;
  workerRoutes: AgentOrchestrationTemplate["routes"][string];
}): AgentOrchestrationTemplate {
  const worker = options.input === "review" ? "review" : "worker";
  return {
    agents: [
      { name: "main", template: "main" },
      { name: worker, template: worker === "review" ? "review" : "general" }
    ],
    input: { source: "input", target: options.input },
    routes: {
      main: [{ target: worker, kind: "weak" }],
      [worker]: options.workerRoutes
    },
    decisionPlans: {
      main: defaultDecisionPlan("main"),
      [worker]: `Choose the next route after ${worker}.`
    },
    allowUserIntervention: true,
    termination: {
      agent: options.termination,
      condition: "The requested evidence is complete.",
      decisionBy: "main",
      automatic: false
    },
    resultFormat: { presets: [], custom: "" }
  };
}

function branchOrchestration(): AgentOrchestrationTemplate {
  return {
    agents: [
      { name: "main", template: "main" },
      { name: "branch", template: "general" },
      { name: "finish_worker", template: "general" }
    ],
    input: { source: "input", target: "branch" },
    routes: {
      main: [
        { target: "branch", kind: "weak" },
        { target: "finish_worker", kind: "weak" }
      ],
      branch: [
        { target: "main", kind: "weak" },
        { target: "finish_worker", kind: "weak" }
      ],
      finish_worker: [{ target: "finish", kind: "weak" }]
    },
    decisionPlans: {
      main: defaultDecisionPlan("main"),
      branch: "Choose Main for reassessment or the finishing Worker.",
      finish_worker: "Finish only after the evidence is complete."
    },
    allowUserIntervention: true,
    termination: {
      agent: "finish_worker",
      condition: "The finishing Worker produced sufficient evidence.",
      decisionBy: "main",
      automatic: false
    },
    resultFormat: { presets: [], custom: "" }
  };
}

function decision(
  nextAgent: AgentName | "finish" | "user",
  message: string
): MainDecision {
  return {
    assessment: "The global project state was inspected.",
    nextAgent,
    message,
    rationale: "This is the configured and evidence-supported next action.",
    successCriteria: ["The selected next action is completed with durable evidence."],
    display: null
  };
}

async function mainResult(
  request: AgentRunRequest,
  value: MainDecision,
  threadId = "thread_main",
  publishDisplay = true,
  publishSession = true
): Promise<AgentRunResult> {
  if (publishSession) {
    await publishDurableSession(request, threadId);
  }
  const control = request.control;
  if (!control) throw new Error("scripted Main requires control context");
  const actions = [] as NonNullable<AgentRunResult["controlActions"]>;
  if (value.display && publishDisplay) {
    actions.push({
      projectId: request.project.id,
      agent: request.agent,
      invocationId: request.invocationId,
      callId: `${request.invocationId}-publish-display`,
      stateVersion: control.stateVersion,
      ...(control.capabilityHash ? { capabilityHash: control.capabilityHash } : {}),
      receivedAt: new Date().toISOString(),
      action: {
        tool: "publish_artifact",
        path: value.display.primary.path,
        title: value.display.primary.title,
        kind: "document",
        description: "Scripted display artifact"
      }
    });
  }
  if (value.display) {
    actions.push({
      projectId: request.project.id,
      agent: request.agent,
      invocationId: request.invocationId,
      callId: `${request.invocationId}-display`,
      stateVersion: control.stateVersion,
      ...(control.capabilityHash ? { capabilityHash: control.capabilityHash } : {}),
      receivedAt: new Date().toISOString(),
      action: { tool: "select_display", primary: value.display.primary, items: value.display.items }
    });
  }
  const action = value.nextAgent === "user"
    ? { tool: "request_user" as const, message: value.message, rationale: value.rationale }
    : value.nextAgent === "finish"
      ? control.mainCapabilities?.controlMode === "weak-branch"
        ? {
            tool: "route_to_agent" as const,
            target: "finish" as const,
            assignment: "Schedule a separate autonomous termination review.",
            rationale: value.rationale,
            successCriteria: value.successCriteria
          }
        : { tool: "complete_project" as const, rationale: value.rationale }
      : { tool: "route_to_agent" as const, target: value.nextAgent, assignment: value.message, rationale: value.rationale, successCriteria: value.successCriteria };
  actions.push({
    projectId: request.project.id,
    agent: request.agent,
    invocationId: request.invocationId,
    callId: `${request.invocationId}-terminal`,
    stateVersion: control.stateVersion,
    ...(control.capabilityHash ? { capabilityHash: control.capabilityHash } : {}),
    receivedAt: new Date().toISOString(),
    action
  });
  return { handoff: value.assessment, threadId, controlActions: actions };
}

async function publishDurableSession(
  request: AgentRunRequest,
  legacyId: string
): Promise<void> {
  const previous = request.project.agentSessions?.[request.agent];
  const session: SessionRef = previous?.nativeId === legacyId
    ? previous
    : {
        schemaVersion: 1,
        harnessId: request.project.agents[request.agent]?.harness ?? "codex",
        adapterVersion: previous?.adapterVersion ?? "scripted-runner-1",
        generation: previous ? previous.generation + 1 : 0,
        nativeId: legacyId,
        durable: true,
        createdAt: new Date().toISOString()
      };
  if (request.onDurableSessionStarted) {
    await request.onDurableSessionStarted(session, legacyId);
    return;
  }
  // Keep the scripted fixture usable with an older AgentRunRequest producer.
  await request.onSessionStarted?.(session);
  await request.onThreadStarted?.(legacyId);
}

function workerResult(agent: string): WorkerResult {
  return {
    summary: `${agent} completed the bounded task.`,
    markdown: `## Result\n${agent} completed.\n\n## Evidence\nThe scripted Runner recorded completion.\n\n## Risks and Unresolved Issues\nMain must decide the next route.`,
    recommendation: "Main should inspect the evidence and choose the next route."
  };
}

function callSummary(request: AgentRunRequest) {
  return {
    agent: request.agent,
    kind: request.kind,
    permission: request.permission,
    resumeThreadId: request.resumeThreadId
  };
}
