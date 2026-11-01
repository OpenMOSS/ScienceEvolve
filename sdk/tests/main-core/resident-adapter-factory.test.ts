import { execFile, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import { createServer, type Server } from "node:http";
import { createConnection } from "node:net";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";
import { promisify } from "node:util";
import { zstdCompressSync, zstdDecompressSync } from "node:zlib";
import { afterEach, describe, expect, it, vi } from "vitest";
import { parse as parseToml } from "smol-toml";
import { AgentContextSources, publishAgentContextIndex } from "../../src/core/agent-context-index.js";
import type { AgentPermission, AgentRunRequest, AuthoritativeWorkflowFiles } from "../../src/core/types.js";
import { cloneAgentOrchestrationTemplate } from "../../src/core/agent-orchestration.js";
import { CollaborationStateDatabase } from "../../src/core/collaboration-state/store.js";
import { workflowAdjustmentNotifications } from "../../src/core/workflow-adjustment-notifications.js";
import { shareWorkflowNotificationText } from "../../src/core/workflow-adjustment-notification-text.js";
import { mergeAgentConfigs } from "../../src/core/validation.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { SiiExperimentService, assertSiiControlAction } from "../../src/core/sii-experiments.js";
import { CodexAdapter } from "../../src/core/harness-runtime/adapters/codex-adapter.js";
import { ClaudeCodeAdapter } from "../../src/core/harness-runtime/adapters/claude-code-adapter.js";
import { PiAdapter } from "../../src/core/harness-runtime/adapters/pi-adapter.js";
import { DshAdapter, dshSessionArtifactPath } from "../../src/core/harness-runtime/adapters/dsh-adapter.js";
import type {
  HarnessAdapter,
  HarnessAdapterRequest,
  InvocationSpec,
  SessionRef
} from "../../src/core/harness-runtime/contracts.js";
import {
  prepareFilesystemAuthorityMcp,
  filesystemAuthorityPrompt,
  type FilesystemAuthority
} from "../../src/core/harness-runtime/filesystem-authority.js";
import { InvocationRecoveryController } from "../../src/core/harness-runtime/invocation-recovery.js";
import * as runtimeSupport from "../../src/core/harness-runtime/runtime-support.js";
import * as controlLifetime from "../../src/core/control-request-lifetime.js";
import {
  openBuiltinResidentAdapter
} from "../../src/core/harness-runtime/adapters/resident-adapter-factory.js";
import { CommonProcessHost, buildInvocationEnvironment } from "../../src/core/harness-runtime/process-host.js";
import type {
  PrepareResidentScopeRequest,
  ResidentTurn
} from "../../src/core/harness-runtime/resident-lease.js";
import { HarnessRuntimeFacade } from "../../src/core/harness-runtime/runtime.js";
import { createProductionCollaborationResidentLauncher } from "../../src/core/collaboration-resident-launcher.js";
import { ResidentScopedAgentTurnInvoker } from "../../src/core/scoped-agent-resident.js";
import type { ScopedAgentTurnInput } from "../../src/core/scoped-agent-execution.js";
import {
  HarnessRuntimeResidentAdapter
} from "../../src/core/harness-runtime/resident-runtime-adapter.js";
import {
  ControlActionService,
  publishAuthoritativeWorkflowFiles
} from "../../src/core/orchestration-control-bridge.js";
import type { InvocationGatewayRoute } from "../../src/core/harness-runtime/gateway-route.js";

const roots: string[] = [];
const execFileAsync = promisify(execFile);

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => fs.rm(root, {
    recursive: true,
    force: true
  })));
});

describe.runIf(process.platform === "linux")("openBuiltinResidentAdapter", () => {
  it.each(["codex", "claude-code", "pi", "dsh"])("delivers long current instructions directly to %s without requiring a context-detail read", async harnessId => {
    const native = harnessId === "codex" ? new CodexAdapter() : harnessId === "claude-code" ? new ClaudeCodeAdapter()
      : harnessId === "pi" ? new PiAdapter() : new DshAdapter();
    const fixture = await createFixture(harnessId, native);
    await fs.writeFile(fixture.launch.executable, fakeSource(harnessId, true), { mode: 0o700 });
    const configured = configuredAdapter(harnessId, fixture.launch.executable);
    const facade = new HarnessRuntimeFacade({ adapters: harnessId === "codex" ? [configured] : [new CodexAdapter(), configured] });
    const prepared = await highLevelInput(fixture, async () => undefined);
    prepared.request.project.orchestration = { ...cloneAgentOrchestrationTemplate(), allowUserIntervention: false };
    const observed: string[] = [];
    prepared.request.onNativeUserInput = async event => { observed.push(JSON.stringify(event)); };
    const adapter = new HarnessRuntimeResidentAdapter({ runtime: facade,
      routeFactory: () => openTestInvocationRoute(configured.descriptor.nativeProtocol, `required-instructions-${harnessId}`) });
    const handle = await adapter.open({ ...prepared, turnRequestFactory: async ({ baseRequest }) => ({ request: baseRequest, onTrace: async () => undefined }) });
    try {
      await handle.submit({ inputId: "required-instructions", invocationId: prepared.request.invocationId,
        prompt: `Preserve the completed work. ${"Relevant current constraint. ".repeat(120)}\nCURRENT_REQUIRED_ACTION: call finish_task and the assigned routing tool.` });
      const received = observed.join("\n");
      expect(received).toContain("CURRENT_REQUIRED_ACTION: call finish_task and the assigned routing tool.");
      expect(received).not.toContain("user intervention is disabled for every Main, Leader and Worker");
      expect(received).toContain("项目入口：");
    } finally { await handle.close(); }
  }, 30_000);
  it.each(["codex", "claude-code", "pi", "dsh"])("automatically continues the same %s task after a terminal gateway failure", async harnessId => {
    const native = harnessId === "codex" ? new CodexAdapter() : harnessId === "claude-code" ? new ClaudeCodeAdapter()
      : harnessId === "pi" ? new PiAdapter() : new DshAdapter();
    const fixture = await createFixture(harnessId, native);
    const source = fakeSource(harnessId)
      .replace("status:'completed',items:", "status:n===1?'failed':'completed',error:{message:'temporary gateway failure'},items:")
      .replace("is_error:false", "is_error:n===1")
      .replace("type:'agent_end',sessionId:sid", "type:'agent_end',sessionId:sid,messages:[{role:'assistant',stopReason:n===1?'error':'stop',errorMessage:'temporary gateway failure',content:[]}]")
      .replace("reason:{kind:'completed'}", "reason:{kind:n===1?'error':'completed'}");
    await fs.writeFile(fixture.launch.executable, source, { mode: 0o700 });
    const configured = configuredAdapter(harnessId, fixture.launch.executable);
    const facade = new HarnessRuntimeFacade({ adapters: harnessId === "codex" ? [configured] : [new CodexAdapter(), configured] });
    const prepared = await highLevelInput(fixture, async () => undefined);
    const recovery: Array<{ phase: string; attempt: number }> = [], waits: boolean[] = [], inputs: string[] = [];
    const boundaries: Array<[string, boolean]> = [];
    prepared.request.onResidentTurnActivity = activity => { boundaries.push([activity.inputId, activity.active]); };
    prepared.request.onHarnessRecovery = async event => { recovery.push(event); };
    prepared.request.onHarnessRecoveryWait = async waiting => { waits.push(waiting); };
    const routes: TestInvocationRoute[] = [];
    const adapter = new HarnessRuntimeResidentAdapter({ runtime: facade, recoveryDelayMs: () => 0,
      routeFactory: async () => {
        const route = await openTestInvocationRoute(configured.descriptor.nativeProtocol, `recovery-route-${routes.length}`);
        if (!routes.length) route.getFailure = () => ({ code: "PROTOCOL_TOOL_ARGUMENTS_INVALID",
          message: "Gateway returned malformed JSON", sourceProtocol: configured.descriptor.nativeProtocol,
          targetProtocol: "chat-completions", model: "neutral-test-model" });
        routes.push(route);
        return route;
      } });
    const handle = await adapter.open({ ...prepared, turnRequestFactory: async ({ baseRequest, turn }) => {
      inputs.push(turn.inputId);
      return { request: { ...baseRequest, invocationId: turn.invocationId }, onTrace: async () => undefined };
    } });
    const identity = facade.residentLeases.snapshot("exec-fixture", harnessId)!;
    try {
      const result = await handle.submit({ inputId: "original-input", invocationId: prepared.request.invocationId, prompt: "Finish the original task" });
      expect(result.handoff).toContain("-2");
      expect(inputs).toEqual(["original-input", "original-input:gateway-recovery:1"]);
      expect(recovery.map(event => [event.phase, event.attempt])).toEqual([["waiting", 1], ["recovered", 1]]);
      expect(waits).toEqual([true, false]);
      expect(boundaries).toEqual([["original-input", true], ["original-input", false],
        ["original-input:gateway-recovery:1", true], ["original-input:gateway-recovery:1", false]]);
      expect(routes).toHaveLength(2);
      expect(routes.every(route => route.closed)).toBe(true);
      expect(facade.residentLeases.snapshot("exec-fixture", harnessId)).toMatchObject({
        pid: identity.pid, session: identity.session, ownershipEpoch: 7, state: "waiting" });
    } finally { await handle.close(); }
  }, 30_000);

  it.each(["codex", "claude-code", "pi", "dsh"])("sends the current correction and an expandable index instead of a large late-bound %s background body", async harnessId => {
    const adapter = harnessId === "codex" ? new CodexAdapter() : harnessId === "claude-code" ? new ClaudeCodeAdapter()
      : harnessId === "pi" ? new PiAdapter() : new DshAdapter();
    const fixture = await createFixture(harnessId, adapter);
    await fs.writeFile(fixture.launch.executable, fakeSource(harnessId, true), { mode: 0o700 });
    const configured = configuredAdapter(harnessId, fixture.launch.executable);
    const facade = new HarnessRuntimeFacade({ adapters: harnessId === "codex" ? [configured] : [new CodexAdapter(), configured] });
    const prepared = await highLevelInput(fixture, async () => undefined);
    const original = "LARGE_HISTORICAL_PROPOSAL_BODY".repeat(6000), received: string[] = [];
    const resident = new HarnessRuntimeResidentAdapter({ runtime: facade,
      routeFactory: async request => openTestInvocationRoute(configured.descriptor.nativeProtocol, `indexed-${request.invocationId}`) });
    const handle = await resident.open({ ...prepared, turnRequestFactory: async ({ baseRequest, turn }) => ({
      request: { ...baseRequest, invocationId: turn.invocationId,
        onPendingWorkflowAdjustments: async (_inputId, _session, publishContext) => {
          const sources = new AgentContextSources(); sources.record("late-proposal-history", "Saved old proposal", { id: "old-proposal", status: "completed", output: original });
          return `CURRENT CORRECTION: preserve the current task and apply only the requested change.\n${await publishContext!(sources.sources)}`;
        }, onNativeUserInput: event => { received.push(String(event.message)); } }, onTrace: async () => undefined }) });
    try {
      await expect(handle.submit({ inputId: "indexed-notice", invocationId: "indexed-invocation", prompt: "Original task stays complete" })).resolves.toMatchObject({ handoff: expect.stringContaining("-1") });
      expect(received).toHaveLength(1); expect(received[0]).toContain("CURRENT CORRECTION: preserve the current task");
      expect(received[0]).not.toContain("LARGE_HISTORICAL_PROPOSAL_BODY");
      expect(Buffer.byteLength(received[0])).toBeLessThan(131072);
      const index = JSON.parse(await fs.readFile(received[0].match(/Context index: (.+)/)![1], "utf8"));
      const source = index.entries.find((entry: any) => entry.key === "late-proposal-history");
      const list = JSON.parse(await fs.readFile(path.join(index.baseDirectory, source.list.path), "utf8"));
      expect(JSON.parse(await fs.readFile(path.join(index.baseDirectory, list.entries[0].detail.path), "utf8")).output).toBe(original);
    } finally { await handle.close(); }
  }, 30_000);

  it.each(["pause", "stop"])("honors explicit %s while an original Agent waits for automatic recovery", async action => {
    const fixture = await createFixture("pi", new PiAdapter());
    await fs.writeFile(fixture.launch.executable, fakeSource("pi").replace("type:'agent_end',sessionId:sid",
      "type:'agent_end',sessionId:sid,messages:[{role:'assistant',stopReason:n===1?'error':'stop',errorMessage:'temporary gateway failure',content:[]}]"), { mode: 0o700 });
    const configured = configuredAdapter("pi", fixture.launch.executable);
    const facade = new HarnessRuntimeFacade({ adapters: [new CodexAdapter(), configured] });
    const prepared = await highLevelInput(fixture, async () => undefined);
    const controller = new AbortController();
    let waiting!: () => void, release!: () => void;
    const atWait = new Promise<void>(resolve => { waiting = resolve; });
    const gate = new Promise<void>(resolve => { release = resolve; });
    prepared.request.onHarnessRecoveryWait = async isWaiting => { if (isWaiting) { waiting(); await gate; } };
    const routes: TestInvocationRoute[] = [];
    const adapter = new HarnessRuntimeResidentAdapter({ runtime: facade, recoveryDelayMs: () => 0,
      routeFactory: async () => {
        const route = await openTestInvocationRoute("chat-completions", `pause-recovery-${routes.length}`);
        if (!routes.length) route.getFailure = () => ({ code: "MODEL_PROVIDER_FAILED", message: "temporary 503",
          sourceProtocol: "chat-completions", targetProtocol: "chat-completions", model: "neutral-model" });
        routes.push(route); return route;
      } });
    const launcher = createProductionCollaborationResidentLauncher(facade, adapter);
    const handle = await launcher.open({ ...prepared, signal: controller.signal,
      turnRequestFactory: async ({ baseRequest }) => ({ request: baseRequest, onTrace: async () => undefined }) });
    const submitted = handle.submit({ inputId: "original", invocationId: prepared.request.invocationId, prompt: "Original task" })
      .then(result => ({ result }), error => ({ error }));
    try {
      await atWait;
      if (action === "pause") {
        await handle.pause();
        expect(facade.residentLeases.snapshot("exec-fixture", "pi")?.state).toBe("paused");
        release();
        await new Promise(resolve => setTimeout(resolve, 30));
        expect(routes).toHaveLength(1);
        await handle.resume();
        expect(await submitted).toMatchObject({ result: { handoff: "pi-2" } });
      } else {
        controller.abort(new Error("Explicit user Stop")); release();
        expect(await submitted).toHaveProperty("error");
        expect(routes).toHaveLength(1);
      }
    } finally { release(); controller.abort(); await submitted; await handle.close(); }
  }, 30_000);

  it.each(["codex", "claude-code", "pi", "dsh"])("binds the built-in state service and role guidance to the actual %s resident turn", async harnessId => {
    const native = harnessId === "codex" ? new CodexAdapter() : harnessId === "claude-code" ? new ClaudeCodeAdapter()
      : harnessId === "pi" ? new PiAdapter() : new DshAdapter();
    const fixture = await createFixture(harnessId, native);
    const configured = configuredAdapter(harnessId, fixture.launch.executable);
    const facade = new HarnessRuntimeFacade({ adapters: harnessId === "codex" ? [configured] : [new CodexAdapter(), configured] });
    const calls: unknown[] = [], services: ControlActionService[] = [], capabilities: string[] = [];
    const turns = vi.spyOn(facade, "submitResidentTurn");
    const prepared = await highLevelInput(fixture, async () => undefined);
    prepared.request.onProjectStateRequest = request => { calls.push(request); return { role: "worker", projectId: "prj_fixture", version: "a".repeat(64) }; };
    const adapter = new HarnessRuntimeResidentAdapter({ runtime: facade,
      routeFactory: async () => openTestInvocationRoute(configured.descriptor.nativeProtocol, `state-${harnessId}`),
      controlServiceFactory: options => { const service = new ControlActionService(options); services.push(service); return service; } });
    const handle = await adapter.open({ ...prepared,
      controlScope: { role: "execution-artifact", projectId: "prj_fixture", nodeRunId: "nr_fixture", executionId: "exec-fixture",
        agentId: "writer", ownershipEpoch: 7 },
      controlAuthorityFactory: async ({ turn }) => {
        const capability = `state-${harnessId}-${turn.invocationId}`; capabilities.push(capability);
        return { control: { stagingPath: path.join(fixture.executionRuntime, `${turn.invocationId}-actions.json`), capability,
          capabilityHash: createHash("sha256").update(capability).digest("hex"), stateVersion: 7, candidates: [], decisionBy: "agent",
          allowAgentGitActions: true, allowUserIntervention: false, canComplete: false, requireBridge: true }, revalidate: async () => {} };
      }, turnRequestFactory: async ({ baseRequest, turn }) => ({ request: { ...baseRequest, invocationId: turn.invocationId },
        onTrace: async (_kind, message) => {
          if (message !== "Resident turn authority activated") return;
          await expect(services.at(-1)!.requestProjectState(capabilities.at(-1)!, { operation: "get", object: { kind: "agent", id: "writer" } }))
            .resolves.toMatchObject({ role: "worker", projectId: "prj_fixture" });
          await services.at(-1)!.stage(capabilities.at(-1)!, "own-finish", { tool: "finish_task", summary: "My authorized fixture task" });
        } }) });
    try {
      const result = await handle.submit({ inputId: "state-input", invocationId: "state-turn", prompt: "Inspect the current formal state" });
      expect(result.controlActions).toHaveLength(1);
      expect(calls).toEqual([{ operation: "get", object: { kind: "agent", id: "writer" } }]);
      expect(result.controlActions?.[0].action.tool).toBe("finish_task");
      expect(turns.mock.calls[0][1].prompt).toContain("Inspect the current formal state");
      expect(turns.mock.calls[0][1].prompt).not.toContain("all nested descendant groups");
      await expect(services.at(-1)!.requestProjectState(capabilities.at(-1)!, { operation: "list" })).rejects.toThrow(/revoked/);
    } finally { await handle.close(); }
  }, 30_000);

  it("closes a native turn rejected by result validation even when its lease is waiting", async () => {
    const fixture = await createFixture("pi", new PiAdapter());
    const configured = configuredAdapter("pi", fixture.launch.executable);
    const facade = new HarnessRuntimeFacade({ adapters: [new CodexAdapter(), configured] });
    const prepared = await highLevelInput(fixture, async () => undefined);
    const adapter = new HarnessRuntimeResidentAdapter({ runtime: facade,
      routeFactory: async () => openTestInvocationRoute("chat-completions", "invalid-result") });
    const launcher = createProductionCollaborationResidentLauncher(facade, adapter);
    const failure = new Error("Native result violated its turn contract");
    vi.spyOn(facade, "validateResidentTurnResult").mockImplementationOnce(() => {
      expect(facade.residentLeases.snapshot("exec-fixture", "pi")?.state).toBe("waiting");
      throw failure;
    });
    let releaseClose!: () => void;
    const closeGate = new Promise<void>(resolve => { releaseClose = resolve; });
    const close = facade.closeResident.bind(facade);
    const nativeClose = vi.spyOn(facade, "closeResident").mockImplementation(async authority => {
      await closeGate;
      return close(authority);
    });
    const nativePause = vi.spyOn(facade, "pauseResident");
    const handle = await launcher.open(prepared);
    const pid = facade.residentLeases.snapshot("exec-fixture", "pi")!.pid;
    let returned = false;
    const submitted = handle.submit({ inputId: "invalid-result", invocationId: prepared.request.invocationId, prompt: "original assignment" })
      .catch(error => { returned = true; return error; });
    const paused = handle.pause();
    try {
      await vi.waitFor(() => expect(nativeClose).toHaveBeenCalledOnce());
      expect(returned).toBe(false);
      expect(processAlive(pid)).toBe(true);
      releaseClose();
      expect(await submitted).toBe(failure);
      await paused;
      expect(nativePause).not.toHaveBeenCalled();
      expect(nativeClose).toHaveBeenCalledOnce();
      await expect.poll(() => processAlive(pid)).toBe(false);
    } finally { releaseClose(); await submitted; await paused; await handle.close(); }
  });

  it.each(["codex", "claude-code", "pi", "dsh"])("rejects an oversized late-bound %s injection before sending and retains the Session for valid input", async harnessId => {
    const adapter = harnessId === "codex" ? new CodexAdapter() : harnessId === "claude-code" ? new ClaudeCodeAdapter()
      : harnessId === "pi" ? new PiAdapter() : new DshAdapter();
    const fixture = await createFixture(harnessId, adapter);
    await fs.writeFile(fixture.launch.executable, fakeSource(harnessId, true), { mode: 0o700 });
    const configured = configuredAdapter(harnessId, fixture.launch.executable);
    const facade = new HarnessRuntimeFacade({ adapters: harnessId === "codex" ? [configured] : [new CodexAdapter(), configured] });
    const prepared = await highLevelInput(fixture, async () => undefined);
    const original = "原样文本\"\\\\\n".repeat(600_000) + "full-notification-tail";
    const notice = shareWorkflowNotificationText("Complete exact proposal facts\n" + JSON.stringify({ records: [
      { proposal: { instructions: original }, changes: [{ before: original, after: original }] }
    ] }));
    const observations: Array<{ message: unknown; session?: SessionRef }> = [];
    const resident = new HarnessRuntimeResidentAdapter({ runtime: facade,
      routeFactory: async request => openTestInvocationRoute(configured.descriptor.nativeProtocol, `large-${request.invocationId}`) });
    const handle = await resident.open({ ...prepared, turnRequestFactory: async ({ baseRequest, turn }) => ({
      request: { ...baseRequest, invocationId: turn.invocationId,
        onPendingWorkflowAdjustments: () => turn.inputId === "large-input" ? notice : "",
        onNativeUserInput: (event, session) => { observations.push({ message: event.message, session }); } }, onTrace: async () => undefined }) });
    try {
      await expect(handle.submit({ inputId: "large-input", invocationId: "large-invocation", prompt: "Continue only the original task" })).rejects.toMatchObject({ cause: { code: "CONTEXT_INJECTION_LIMIT_EXCEEDED" } });
      expect(observations).toHaveLength(0);
      await expect(handle.submit({ inputId: "ordinary-follow-up", invocationId: "ordinary-invocation", prompt: "Keep the existing task and permissions" })).resolves.toMatchObject({ handoff: expect.stringContaining("-1") });
      expect(observations).toHaveLength(1); expect(observations[0].session).toEqual(handle.initialLease.session);
      expect((await handle.probe()).pid).toBe(handle.initialLease.pid);
    } finally { await handle.close(); }
  }, 30_000);

  it.each(["codex", "claude-code", "pi", "dsh"].flatMap(harnessId => [true, false].map(received => ({ harnessId, received }))))(
    "delivers a withdrawal accepted after early preparation on the actual retained $harnessId Main weak-route input (native evidence: $received)", async ({ harnessId, received }) => {
      const adapter = harnessId === "codex" ? new CodexAdapter() : harnessId === "claude-code" ? new ClaudeCodeAdapter()
        : harnessId === "pi" ? new PiAdapter() : new DshAdapter();
      const fixture = await createFixture(harnessId, adapter, "leader");
      await fs.writeFile(fixture.launch.executable, fakeSource(harnessId, received), { mode: 0o700 });
      const configured = configuredAdapter(harnessId, fixture.launch.executable), processHost = new CommonProcessHost();
      const facade = new HarnessRuntimeFacade({ adapters: harnessId === "codex" ? [configured] : [new CodexAdapter(), configured], processHost });
      const prepared = await highLevelInput(fixture, async () => undefined), projectId = prepared.request.project.id;
      const original = prepared.request.project.agents.writer!;
      prepared.request.agent = "main"; prepared.request.kind = "main";
      prepared.request.project.agents = { main: { ...original, sessionPersistence: true } };
      prepared.request.executionContext = { role: "leader", nodeRunId: "original-main-node", routeScopeId: "original-weak-route", coordinatorEpoch: 7 };
      prepared.inputs = fixture.launch.spec.inputs;
      prepared.inputs.inboxPath = path.join(fixture.workspace, "turn-one-Inbox.md");
      await fs.writeFile(prepared.inputs.inboxPath, "Original Main weak-route task input");
      await fs.writeFile(prepared.inputs.memoryPath, "Main's retained management memory");
      prepared.request.inboxPath = prepared.inputs.inboxPath; prepared.request.runtimePath = prepared.inputs.runtimePath;
      prepared.controlScope = { role: "main-route", projectId, nodeRunId: "original-main-node", routeScopeId: "original-weak-route",
        leaderAgentId: "main", coordinatorEpoch: 7, candidates: ["idea", "finish"], tasklessRouteTargets: [],
        allowUserIntervention: true, allowWorkflowReconfiguration: false, canComplete: false, allowFinishRoute: false };
      const graph = cloneAgentOrchestrationTemplate(); graph.allowMainReconfiguration = false;
      const database = CollaborationStateDatabase.open({ databasePath: path.join(fixture.root, "notification-state.sqlite"), serviceId: "native-notification",
        hostId: "fixture", topology: "single-host", leaseDurationMs: 30_000 });
      database.createProject({ projectId, workflowRevision: 1, workflowSnapshot: graph, git: { enabled: true, status: "ready" }, workerCapacity: 2 });
      database.initializeScopedConfiguration(projectId, { agents: mergeAgentConfigs(undefined, graph), skillDefinitions: {}, mcpDefinitions: {} });
      database.activateNode({ projectId, nodeRunId: "original-main-node", node: { kind: "agent", nodeId: "main", agentId: "main" },
        activationRequestId: "original-main-activation", inputSnapshotRef: "original-input", activatedByAgentId: "main", workflowRevision: 1 });
      let activated!: () => void, proceed!: () => void;
      const activation = new Promise<void>(resolve => { activated = resolve; }), gate = new Promise<void>(resolve => { proceed = resolve; });
      const observed: Array<{ message: unknown; session?: SessionRef }> = [], bound: string[] = [];
      const resident = new HarnessRuntimeResidentAdapter({ runtime: facade,
        routeFactory: async request => openTestInvocationRoute(configured.descriptor.nativeProtocol, `notice-${request.invocationId}`) });
      const handle = await resident.open({ ...prepared,
        controlAuthorityFactory: async ({ turn }) => {
          const capability = `native-notice-${turn.invocationId}-${randomSuffix()}`;
          return { control: { stagingPath: path.join(fixture.executionRuntime, `${turn.inputId}-actions.json`), capability,
            capabilityHash: createHash("sha256").update(capability).digest("hex"), stateVersion: 7, candidates: ["idea", "finish"],
            tasklessRouteTargets: [], decisionBy: "main", allowUserIntervention: true, allowWorkflowReconfiguration: false,
            canComplete: false, allowFinishRoute: false, requireBridge: true }, revalidate: async () => {
              throw new Error("This native transport fixture requests no control action");
            } };
        }, turnRequestFactory: async ({ baseRequest, turn }) => {
        return { request: { ...baseRequest, invocationId: turn.invocationId,
          onPendingWorkflowAdjustments: async (inputId, session, publishContext) => {
            const notices = workflowAdjustmentNotifications(database, { projectId, agentId: "main", invocationId: turn.invocationId,
              session, executionContext: prepared.request.executionContext });
            const text = notices.prepare(inputId); bound.push(text);
            const details = await publishContext?.(notices.details(inputId));
            return `${text}${details ? `\n\n${details}` : ""}`;
          }, onNativeUserInput: (event, session) => {
            observed.push({ message: event.message, session });
            if (session) workflowAdjustmentNotifications(database, { projectId, agentId: "main", invocationId: turn.invocationId,
              session, executionContext: prepared.request.executionContext }).observe(event);
          } }, onTrace: async (_kind, message) => {
            if (turn.inputId === "original-weak-input" && message === "Resident turn authority activated") { activated(); await gate; }
          } }; } });
      const identity = structuredClone(handle.initialLease);
      try {
        const running = handle.submit({ inputId: "original-weak-input", invocationId: "main-weak-one", prompt: "Make only the originally permitted weak-route decision" });
        await Promise.race([activation, running.then(() => { throw new Error("Native turn ended before authority activation"); })]);
        expect(bound).toEqual([]);
        const current = database.workflowAdjustmentCurrent(projectId), proposal = structuredClone(current.snapshot);
        proposal.agents.idea.instructions = "Exact user proposal that Main may not resubmit automatically. ".repeat(250) + "native-proposal-tail-sentinel";
        database.submitUserWorkflowAdjustment({ projectId, requestId: "withdrawn-at-native-boundary", base: current.version, proposal });
        database.withdrawWorkflowAdjustment({ projectId, requestId: "withdrawn-at-native-boundary", operationId: "explicit-native-boundary-withdraw", note: "Keep the user's exact next constraint" });
        expect(database.eventsAfter(projectId, 0, 1000).some(event => event.type === "workflow.adjustment.notification.received")).toBe(false);
        proceed(); await expect(running).resolves.toMatchObject({ handoff: expect.stringContaining("-1") });
        expect(bound[0].length).toBeLessThan(4000);
        expect(observed).toHaveLength(received ? 1 : 0);
        if (received) {
          expect(observed[0].message).toContain("withdrawn-at-native-boundary");
          expect(observed[0].message).toContain('"status":"withdrawn"'); expect(observed[0].message).not.toContain("Keep the user's exact next constraint");
          expect(observed[0].message).not.toContain("native-proposal-tail-sentinel");
          expect(observed[0].message).toContain("Workflow configuration update results");
          const savedDetails = JSON.stringify(database.workflowAdjustments(projectId));
          expect(savedDetails).toContain("native-proposal-tail-sentinel"); expect(savedDetails).toContain("Keep the user's exact next constraint");
          expect(observed[0].session).toEqual(identity.session);
        }
        const receipts = database.eventsAfter(projectId, 0, 1000).filter(event => event.type === "workflow.adjustment.notification.received");
        if (received) expect(receipts).toMatchObject([{ payload: { inputId: "original-weak-input", context: { agentId: "main", invocationId: "main-weak-one", session: identity.session } } }]);
        else expect(receipts).toEqual([]);
        await expect(handle.submit({ inputId: "next-legitimate-input", invocationId: "main-weak-two", prompt: "Continue the original lawful task" })).resolves.toMatchObject({ handoff: expect.stringContaining("-2") });
        expect(bound).toHaveLength(2); expect(observed).toHaveLength(received ? 2 : 0);
        if (received) { expect(bound[1]).toBe(""); expect(observed[1].message).not.toContain("withdrawn-at-native-boundary"); }
        else expect(bound[1]).toContain("withdrawn-at-native-boundary");
        expect((await handle.probe()).pid).toBe(identity.pid);
        expect(database.workflowAdjustments(projectId)[0].status).toBe("withdrawn");
        expect(database.projectState(projectId).workflowRevision).toBe(1);
        expect(prepared.request.project.agents.main.permission).toBe(original.permission);
      } finally { proceed(); await handle.close(); database.close(); }
    }, 30_000);

  it.each(["delivery", "leader", "fixed-leader"] as const)("reads live canonical workflow through the prepared %s MCP without following workspace symlinks", async (mode) => {
    const role = mode === "delivery" ? "delivery" : "leader";
    const fixture = await createFixture("pi", new PiAdapter(), role, "workspace", mode === "fixed-leader");
    const input = await highLevelInput(fixture, async () => undefined);
    if (role === "leader") {
      const inputs = fixture.launch.spec.inputs;
      if (mode === "leader") inputs.inboxPath = path.join(fixture.workspace, "turn-one-Inbox.md");
      await fs.writeFile(inputs.inboxPath, "read the current authoritative workflow");
      await fs.writeFile(inputs.memoryPath, "management memory");
      input.request = { ...input.request, inboxPath: inputs.inboxPath, runtimePath: inputs.runtimePath };
      input.inputs = inputs;
    }
    const home = path.join(fixture.root, "separate-home");
    await fs.mkdir(home);
    input.filesystemAuthorityInput.serviceUserRoot = home;
    const publication = (revision: number): AuthoritativeWorkflowFiles => ({
      definition: { schemaVersion: 1, projectId: "prj_fixture", workflowRevision: revision,
        workflow: cloneAgentOrchestrationTemplate() },
      currentState: { schemaVersion: 1, projectId: "prj_fixture", workflowRevision: revision,
        stateRevision: revision, runState: "running", frozen: false, members: [] }
    });
    await publishAuthoritativeWorkflowFiles(fixture.projectPath, publication(1));
    const workflowDirectory = path.join(fixture.projectPath, "workflow");
    await fs.symlink(workflowDirectory, path.join(fixture.workspace, "workflow"));
    await fs.writeFile(path.join(fixture.projectPath, "private-state.txt"), "private");
    const facade = new HarnessRuntimeFacade({ adapters: [new CodexAdapter(),
      new PiAdapter({ harnessExecutables: { pi: fixture.launch.executable } })] });
    const prepared = await facade.prepareResidentScope(input);
    expect(prepared.spec.inputs.workflowReadDirectory).toBe(workflowDirectory);
    const authority = prepared.filesystemAuthority;
    expect(authority.readRoots).toContain(fixture.projectPath);
    expect(authority.writeRoots).not.toContain(fixture.projectPath);
    const workflowRoot = authority.rootBindings.find(root => root.path === workflowDirectory)!;
    const workspaceRoot = authority.rootBindings.find(root => root.path === fixture.workspace)!;
    expect(workflowRoot).toMatchObject({ write: false });
    const prompt = filesystemAuthorityPrompt(authority, prepared.spec.inputs);
    for (const filename of ["definition.json", "current-state.json"]) {
      expect(prompt).toContain(`rootId="${workflowRoot.id}", path="${filename}"; read-only`);
    }
    const mcp = prepared.filesystemMcp!;
    const rpc = await openStdioRpc(mcp.row.command, mcp.row.args);
    const call = (name: string, args: Record<string, unknown>) => rpc.request("tools/call", { name, arguments: args });
    try {
      await rpc.request("initialize");
      for (const revision of [1, 2]) {
        if (revision === 2) await publishAuthoritativeWorkflowFiles(fixture.projectPath, publication(2));
        for (const filename of ["definition.json", "current-state.json"]) {
          const response = await call("read_file", { rootId: workflowRoot.id, path: filename });
          const result = response.result as { isError?: boolean; content: Array<{ text: string }> };
          expect(result.isError).not.toBe(true);
          const read = JSON.parse(result.content[0]!.text) as { content: string };
          expect(JSON.parse(read.content)).toMatchObject({ projectId: "prj_fixture", workflowRevision: revision });
          await expect(call("write_file", { rootId: workflowRoot.id, path: filename, content: "denied" }))
            .resolves.toMatchObject({ result: { isError: true } });
        }
      }
      await expect(call("read_file", { rootId: workspaceRoot.id, path: "workflow/definition.json" }))
        .resolves.toMatchObject({ result: { isError: true } });
      await expect(call("read_file", { rootId: workflowRoot.id, path: "../private-state.txt" }))
        .resolves.toMatchObject({ result: { isError: true } });
      expect(JSON.parse(await fs.readFile(path.join(workflowDirectory, "definition.json"), "utf8"))).toMatchObject({ workflowRevision: 2 });
    } finally { await rpc.close(); }
    // A replaced publication directory must not become a read grant for another project.
    const foreign = path.join(fixture.root, "foreign-workflow");
    await fs.rename(workflowDirectory, foreign);
    await fs.symlink(foreign, workflowDirectory);
    await expect(facade.prepareResidentScope(input)).rejects.toMatchObject({ code: "INVOCATION_INPUT_STAGING_FAILED" });
  });
  it("refreshes group capability previews and readable snapshots in the same native session on every management turn", async () => {
    const fixture = await createFixture("pi", new PiAdapter(), "leader", "workspace", true);
    const request = fixture.launch.request as unknown as AgentRunRequest;
    const leaderConfig = { ...request.project.agents.writer, skills: [], autoSkills: [],
      instructions: "Coordinate the experiment group.", permission: "workspace" as const,
      sessionPersistence: false, decisionBy: "main" as const };
    const workflow = cloneAgentOrchestrationTemplate();
    workflow.schemaVersion = 3;
    workflow.agents = ["main", "writer", "scientist", "unrelated"].map(name => ({ name }));
    workflow.routes = { main: [{ kind: "weak", target: "G" }], G: [{ kind: "strong", target: "finish" }] };
    workflow.scopedWorkflow = { schemaVersion: 1, rootAgentIds: ["main"], groups: [
      { id: "G", leaderAgentId: "writer", allowLeaderReconfiguration: false, workflow: {
        nodes: [{ kind: "agent", nodeId: "experiment_node", agentId: "scientist" }],
        input: { source: "input", edges: [{ kind: "parallel", target: "experiment_node" }] },
        routes: { experiment_node: [{ kind: "strong", target: "finish" }] } } },
      { id: "Other", leaderAgentId: "main", allowLeaderReconfiguration: false, workflow: {
        nodes: [{ kind: "agent", nodeId: "private_other_node", agentId: "unrelated" }],
        input: { source: "input", edges: [{ kind: "parallel", target: "private_other_node" }] },
        routes: { private_other_node: [{ kind: "strong", target: "finish" }] } } }
    ] };
    request.project = { ...request.project, orchestration: workflow, workflowRevision: 1, eventSeq: 1,
      agents: { writer: leaderConfig, main: { ...leaderConfig },
        scientist: { ...leaderConfig, instructions: "FULL_SCIENTIST_INSTRUCTIONS", skills: ["project:experiment-v1"],
          mcpServers: [{ name: "experiment-service", url: "https://example.invalid/mcp" }] },
        unrelated: { ...leaderConfig, instructions: "PRIVATE_OTHER_INSTRUCTIONS" } },
      skillDefinitions: { "experiment-v1": { files: { "SKILL.md": "FULL_EXPERIMENT_SKILL_V1" } } } };
    request.workflowContext = { scope: "group", groupId: "G", groupRunId: "grp_fixture", purpose: "route", candidates: ["finish"] };
    request.onDurableSessionStarted = async (session, legacy) => {
      request.project.agentSessions = { writer: session }; request.project.agentSessionIds = { writer: legacy };
    };
    const configured = configuredAdapter("pi", fixture.launch.executable);
    const facade = new HarnessRuntimeFacade({ adapters: [new CodexAdapter(), configured] });
    const opens = vi.spyOn(facade, "prepareResidentScope");
    const turns = vi.spyOn(facade, "submitResidentTurn");
    const contexts = vi.spyOn(facade, "prepareAgentContext");
    let routeSequence = 0;
    const adapter = new HarnessRuntimeResidentAdapter({ runtime: facade,
      routeFactory: async () => openTestInvocationRoute("chat-completions", `workflow-context-route-${++routeSequence}`) });
    const handle = await adapter.open({ request, inputs: fixture.launch.spec.inputs,
      executionRuntimePath: fixture.executionRuntime,
      filesystemAuthorityInput: { serviceUserRoot: fixture.root, protectedRoots: [fixture.executionRuntime] },
      signal: fixture.launch.signal, onTrace: async () => undefined,
      controlScope: { role: "scoped-leader", projectId: request.project.id, nodeRunId: "nr_fixture",
        groupRunId: "grp_fixture", leaderAgentId: "writer", coordinatorEpoch: 11,
        memberNodeIds: ["experiment_node"], routeCandidates: ["finish"], failedArrivalRequestIds: [], allowReconfiguration: false },
      controlAuthorityFactory: async ({ turn }) => {
        const capability = `workflow-context-${turn.inputId}`;
        return { control: { capability, capabilityHash: createHash("sha256").update(capability).digest("hex"),
          stagingPath: path.join(fixture.executionRuntime, `${turn.inputId}.json`), stateVersion: 11,
          candidates: [], decisionBy: "main", canComplete: false, allowUserIntervention: false, requireBridge: true,
          collaboration: { role: "scoped-leader", nodeRunId: "nr_fixture", groupRunId: "grp_fixture", coordinatorEpoch: 11,
            memberNodeIds: ["experiment_node"], routeCandidates: ["finish"], failedArrivalRequestIds: [], allowReconfiguration: false } },
          revalidate: async () => undefined };
      },
      turnRequestFactory: async ({ baseRequest }) => ({ request: { ...baseRequest, project: structuredClone(request.project) }, onTrace: async () => undefined }) });
    try {
      await expect(handle.submit({ inputId: "workflow-context-one", invocationId: request.invocationId, prompt: "Choose the next experiment step" }))
        .resolves.toMatchObject({ handoff: "pi-1" });
      const original = await handle.probe();
      const firstContext = await contexts.mock.results.at(-1)!.value;
      const firstDetails = JSON.parse(await fs.readFile(firstContext.workflowContext!.agentsPath, "utf8"));
      expect(firstDetails.agents.scientist.skills).toEqual(["project:experiment-v1"]);
      request.project.workflowRevision = 2; request.project.eventSeq = 2;
      request.project.agents.scientist.skills = ["project:experiment-v2"];
      request.project.skillDefinitions = { "experiment-v2": { files: { "SKILL.md": "FULL_EXPERIMENT_SKILL_V2" } } };
      await expect(handle.submit({ inputId: "workflow-context-two", invocationId: request.invocationId, prompt: "Use the updated experiment capability" }))
        .resolves.toMatchObject({ handoff: "pi-2" });
      expect(opens).toHaveBeenCalledTimes(1);
      const first = turns.mock.calls[0][1].prompt; const second = turns.mock.calls[1][1].prompt;
      expect(first).toContain("Choose the next experiment step");
      expect(second).toContain("Use the updated experiment capability");
      for (const prompt of [first, second]) {
        expect(prompt).not.toContain("Configuration revision:");
        expect(prompt).not.toContain("Current group Workflow overview");
        expect(prompt).not.toContain("project:experiment-v");
        expect(prompt).not.toContain("private_other_node");
        expect(prompt).not.toContain("FULL_SCIENTIST_INSTRUCTIONS");
      }
      const detailsPath = (await contexts.mock.results.at(-1)!.value).workflowContext!.agentsPath;
      const details = JSON.parse(await fs.readFile(detailsPath, "utf8"));
      expect(Object.keys(details.agents).sort()).toEqual(["scientist", "writer"]);
      expect(details.agents.scientist.instructions).toBe("FULL_SCIENTIST_INSTRUCTIONS");
      expect(details.skillDefinitions["experiment-v2"].files["SKILL.md"]).toBe("FULL_EXPERIMENT_SKILL_V2");
      const current = await handle.probe();
      expect(current.pid).toBe(original.pid);
      expect(current.session).toEqual(original.session);
    } finally { await handle.close(); }
  }, 30_000);

  it.each([
    { id: "codex", adapter: () => new CodexAdapter() },
    { id: "claude-code", adapter: () => new ClaudeCodeAdapter() },
    { id: "pi", adapter: () => new PiAdapter() },
    { id: "dsh", adapter: () => new DshAdapter() }
  ])("submits a coordinated report and its bounded supplement with distinct $id native inputs", async (row) => {
    const fixture = await createFixture(row.id, row.adapter());
    const repeatedTool = row.id === "codex"
      ? "s({method:'item/started',params:{threadId:'codex-session',turnId:id,item:{type:'mcpToolCall',id:'reused-native-call',server:'fixture',tool:'inspect_result',status:'started',arguments:{round:n}}}});s({method:'item/completed',params:{threadId:'codex-session',turnId:id,item:{type:'mcpToolCall',id:'reused-native-call',server:'fixture',tool:'inspect_result',status:'completed',result:{content:[{type:'text',text:'result-'+n}]}}}});"
      : row.id === "claude-code"
        ? "s({type:'assistant',session_id:q.session_id,message:{role:'assistant',content:[{type:'tool_use',id:'reused-native-call',name:'inspect_result',input:{round:n}}]}});s({type:'user',session_id:q.session_id,message:{role:'user',content:[{type:'tool_result',tool_use_id:'reused-native-call',content:'result-'+n}]}});"
        : row.id === "pi"
          ? "s({type:'tool_execution_start',toolCallId:'reused-native-call',toolName:'inspect_result',args:{round:n}});s({type:'tool_execution_end',toolCallId:'reused-native-call',toolName:'inspect_result',result:{content:[{type:'text',text:'result-'+n}]},isError:false});"
          : "s({jsonrpc:'2.0',method:'session.event',params:{sessionId:id,event:{type:'tool/call',seq:seq++,data:{callId:'reused-native-call',name:'inspect_result',arguments:{round:n}}}}});s({jsonrpc:'2.0',method:'session.event',params:{sessionId:id,event:{type:'tool/result',seq:seq++,data:{message:{source:{callId:'reused-native-call'},content:[{type:'tool-result',content:[{type:'text',text:'result-'+n}]}]}}}}});";
    const toolAnchor = row.id === "codex" ? "s({method:'thread/tokenUsage/updated'"
      : row.id === "claude-code" ? "s({type:'assistant'"
        : row.id === "pi" ? "return s({type:'agent_end'" : "s({jsonrpc:'2.0',method:'session.status',params:{sessionId:id,status:'running'";
    await fs.writeFile(fixture.launch.executable, fakeSource(row.id, true).replace(toolAnchor, repeatedTool + toolAnchor), { mode: 0o700 });
    const configured = configuredAdapter(row.id, fixture.launch.executable);
    const facade = new HarnessRuntimeFacade({
      adapters: row.id === "codex" ? [configured] : [new CodexAdapter(), configured]
    });
    const submitted = vi.spyOn(facade, "submitResidentTurn");
    const routes: TestInvocationRoute[] = [];
    const resident = new HarnessRuntimeResidentAdapter({ runtime: facade, routeFactory: async () => {
      const route = await openTestInvocationRoute(configured.descriptor.nativeProtocol, `report-${routes.length + 1}`);
      routes.push(route); return route;
    } });
    const published: SessionRef[] = [];
    const prepared = await highLevelInput(fixture, async session => { published.push(session); });
    const official: Array<{ event: Record<string, unknown>; session?: SessionRef }> = [];
    prepared.request.onOfficialHarnessEvent = (event, session) => { official.push({ event: structuredClone(event), session }); };
    const invocationId = "inv-original-report-repair";
    const runtimePath = path.join(fixture.projectPath, "runtime", invocationId);
    await fs.mkdir(runtimePath);
    const inboxPath = path.join(fixture.projectPath, "messages", `0001_${invocationId}_to_writer.md`);
    await fs.writeFile(inboxPath, "Retained original business assignment and delivery facts");
    prepared.executionRuntimePath = runtimePath;
    prepared.request = { ...prepared.request, invocationId, runtimePath, inboxPath,
      sessionContinuity: "strict", project: { ...prepared.request.project, orchestration: { schemaVersion: 3 } as never },
      executionContext: { ...prepared.request.executionContext!, groupRunId: "run-original" } as never };
    const scope = { role: "scoped-agent" as const, projectId: "prj_fixture", nodeRunId: "nr_fixture",
      executionId: "exec-fixture", agentId: "writer", groupRunId: "run-original", ownershipEpoch: 7,
      candidates: [], decisionBy: "main" as const };
    const turn = { execution: { id: scope.executionId, projectId: scope.projectId, agentId: scope.agentId,
      ownershipEpoch: scope.ownershipEpoch, worktreePath: fixture.workspace, arrivalRequestId: "arrival-original" },
      arrival: { requestId: "arrival-original", targetNodeId: "worker-node" }, groupRun: { id: scope.groupRunId },
      workflow: { routes: {} }, invocationId, runtimePath, baseCommit: "a".repeat(40),
      reportRepair: { report: { invocationId: "inv-stopped-original", output: "Retained original business work" },
        attempt: 1, missing: ["github_get_pr or github_create_pr"] }, onOpened: vi.fn() } as unknown as ScopedAgentTurnInput;
    const launcher = createProductionCollaborationResidentLauncher(facade, resident);
    let completedInputs = 0;
    const retained: string[] = [];
    const reserveRepair = vi.fn(() => 1);
    const invoker = new ResidentScopedAgentTurnInvoker(launcher, {
      prepare: async () => ({ ...prepared, initialTask: "来源：Leader\n内容：Continue the original task in its retained session and inspect the missing delivery actions.", controlScope: scope,
        controlAuthorityFactory: async ({ turn: current }) => {
          const capability = createHash("sha256").update(current.inputId).digest("hex");
          return { control: { stagingPath: path.join(runtimePath, `${capability}.json`),
            capability, capabilityHash: createHash("sha256").update(capability).digest("hex"),
            stateVersion: 7, candidates: [], decisionBy: "main", allowAgentGitActions: true,
            scopedAgentRouting: true, allowFinishRoute: true, allowUserIntervention: false, canComplete: false,
            requireBridge: true }, revalidate: async () => undefined };
        } }),
      retainTurnResult: async (_input, _result, inputId) => { completedInputs += 1; retained.push(inputId); },
      missingActions: () => completedInputs === 1 ? ["github_get_pr or github_create_pr"] : [],
      reserveRepair,
      acceptResult: async (_input, result) => ({ output: result.handoff! })
    });
    try {
      await expect(invoker.invoke(turn)).resolves.toMatchObject({ output: `${row.id === "claude-code" ? "claude" : row.id}-2`,
        residentStopConfirmed: true });
      expect(turn.onOpened).toHaveBeenCalledOnce();
      expect(reserveRepair).toHaveBeenCalledExactlyOnceWith(turn, ["github_get_pr or github_create_pr"]);
      expect(retained).toHaveLength(2);
      expect(new Set(retained).size).toBe(2);
      expect(submitted.mock.calls.map(([, current]) => current.inputId)).toEqual(retained);
      expect(submitted.mock.calls.every(([, current]) => current.invocationId === invocationId)).toBe(true);
      expect(published).toHaveLength(1);
      expect(published[0]).toMatchObject({ harnessId: row.id, durable: true });
      const events = official.map(({ event }) => event);
      expect(new Set(events.map(event => event.eventId)).size).toBe(events.length);
      expect(events.every(event => event.invocationId === invocationId)).toBe(true);
      expect(official.every(({ session }) => JSON.stringify(session) === JSON.stringify(published[0]))).toBe(true);
      const inputs = events.filter(event => event.kind === "user.message");
      expect(inputs).toHaveLength(2);
      expect(inputs[0]?.message).not.toBe(inputs[1]?.message);
      const starts = events.filter(event => event.kind === "tool.started").map(event => event.tool as { callId: string });
      const results = events.filter(event => event.kind === "tool.completed").map(event => event.tool as { callId: string; outputPreview?: string });
      expect(starts).toHaveLength(2);
      expect(results).toHaveLength(2);
      expect(new Set(starts.map(tool => tool.callId)).size).toBe(2);
      expect(results.map(tool => tool.callId)).toEqual(starts.map(tool => tool.callId));
      expect(results[0]?.outputPreview).toContain("result-1");
      expect(results[1]?.outputPreview).toContain("result-2");
      expect(routes).toHaveLength(2);
      expect(routes.every(route => route.closed)).toBe(true);
    } finally {
      for (const route of routes) await route.close();
    }
  }, 30_000);

  it.each([
    { id: "codex", permission: "workspace" as const, adapter: () => new CodexAdapter() },
    { id: "claude-code", permission: "yolo" as const, adapter: () => new ClaudeCodeAdapter() },
    { id: "pi", permission: "compute" as const, adapter: () => new PiAdapter() },
    { id: "dsh", permission: "workspace" as const, adapter: () => new DshAdapter() }
  ].flatMap(row => [true, false].map(nativeReceipt => ({ ...row, nativeReceipt })))
    .flatMap(row => row.nativeReceipt ? [{ ...row, throughLauncher: false }, { ...row, throughLauncher: true }] : [{ ...row, throughLauncher: false }]))("retains the unfinished $id resident task and gates completion on its actual experiment notification (receipt: $nativeReceipt; launcher: $throughLauncher)", async row => {
    const fixture = await createFixture(row.id, row.adapter(), "delivery", row.permission, false, "prj_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    await fs.writeFile(fixture.launch.executable, fakeSource(row.id, row.nativeReceipt), { mode: 0o700 });
    let status = "job_running";
    const service = new SiiExperimentService({ projectsRoot: fixture.root, inspireBin: "unused", workspaceRoot: fixture.root,
      knowledgeRoot: fixture.root, refreshMs: 3_600_000, accountReader: async () => "fixture-account",
      runJson: async args => ({ success: true, data: args.includes("create") ? { sub_code: 0 } : { job: { status } } }) });
    await service.start(); await service.refreshNow();
    const configured = configuredAdapter(row.id, fixture.launch.executable);
    const facade = new HarnessRuntimeFacade({ adapters: row.id === "codex" ? [configured] : [new CodexAdapter(), configured], siiExperiments: service });
    const nativeTurns = vi.spyOn(facade, "submitResidentTurn");
    const siiBindings = vi.spyOn(facade, "openSiiBinding");
    let routeSequence = 0;
    const resident = new HarnessRuntimeResidentAdapter({ runtime: facade, routeFactory: async () => openTestInvocationRoute(configured.descriptor.nativeProtocol, `sii-route-${++routeSequence}`) });
    const prepared = await highLevelInput(fixture, async () => undefined);
    prepared.request.permission = row.permission;
    prepared.request.project.agents.writer!.permission = row.permission;
    prepared.request.project.agents.writer!.experimentMcp = true;
    prepared.request.project.orchestration = { schemaVersion: 2 } as AgentRunRequest["project"]["orchestration"];
    const receivedInputs: Array<{ message: unknown; eventId: unknown; session?: SessionRef }> = [];
    prepared.request.onPendingControlResults = () => `Existing unrelated result context\n${"x".repeat(45000)}`;
    prepared.request.onNativeUserInput = (event, session) => { receivedInputs.push({ message: event.message, eventId: event.eventId, session }); };
    let physicalTurns = 0;
    const officialEventIds: string[] = [];
    let physicalHandle!: Awaited<ReturnType<HarnessRuntimeResidentAdapter["open"]>>;
    const actualOpen = resident.open.bind(resident);
    vi.spyOn(resident, "open").mockImplementation(async input => {
      physicalHandle = await actualOpen(input);
      return physicalHandle;
    });
    const openInput: PrepareResidentScopeRequest = { ...prepared,
      turnRequestFactory: async ({ baseRequest, turn: current }) => ({ request: { ...baseRequest, invocationId: current.invocationId, onOfficialHarnessEvent: event => { officialEventIds.push(String(event.eventId)); } },
        onTrace: async (_kind, message) => {
          if (message !== "Resident turn authority activated" || ++physicalTurns !== 1) return;
          const client = new Client({ name: "resident-agent", version: "1" });
          await client.connect(new StreamableHTTPClientTransport(new URL((await siiBindings.mock.results.at(-1)!.value)!.url)));
          try {
            const submission = await client.callTool({ name: "sii_submit_experiment", arguments: { request_id: "resident-run", args: ["job", "create", "--name", "resident-run", "--workspace", "space", "--project", "具有能动性的科学大模型"] } });
            expect(submission.isError).not.toBe(true);
            const id = (submission.structuredContent as { experiment: { id: string } }).experiment.id;
            const deferred = await client.callTool({ name: "sii_defer_task", arguments: { experiment_ids: [id], context: "Validate the resident experiment's metrics." } });
            expect(deferred.isError).not.toBe(true);
          } finally { await client.close(); }
        } }) };
    const handle = row.throughLauncher
      ? await createProductionCollaborationResidentLauncher(facade, resident).open(openInput)
      : await resident.open(openInput);
    const identity = structuredClone(physicalHandle.initialLease);
    let settled = false;
    const logicalTask = handle.submit({ inputId: "experiment-input", invocationId: "inv_resident_sii", prompt: "Run and validate experiment." }).then(result => { settled = true; return result; }, error => { settled = true; return error as Error; });
    let pausing: Promise<void> | undefined;
    try {
      await expect.poll(async () => (await service.document(fixture.projectPath)).waits[0]?.handoff).toBeTruthy();
      expect(settled).toBe(false); expect(nativeTurns).toHaveBeenCalledTimes(1);
      pausing = handle.pause();
      // Exercise the actual production launcher, physical adapter and SII
      // broker while the scientific result is still pending.
      await expect.poll(async () => (await physicalHandle.probe()).state, { timeout: 750 }).toBe("paused");
      await pausing;
      status = "job_succeeded"; await service.refreshNow();
      await expect.poll(async () => (await service.document(fixture.projectPath)).waits[0]?.status).toBe("ready");
      expect(nativeTurns).toHaveBeenCalledTimes(1);
      expect((await service.document(fixture.projectPath)).experiments[0]!.acknowledged).not.toBe(true);
      await handle.resume();
      const result = await logicalTask;
      if (row.nativeReceipt) {
        if (result instanceof Error) throw result;
        expect(result).toMatchObject({ handoff: expect.stringContaining("-2") });
      } else expect(result).toMatchObject({ message: expect.stringContaining("still needs experiment results") });
      expect(nativeTurns).toHaveBeenCalledTimes(2);
      expect(nativeTurns.mock.calls[1]![1].prompt).not.toContain("Validate the resident experiment's metrics.");
      expect(nativeTurns.mock.calls[1]![1].prompt).toContain("sii_get_task_context");
      expect(nativeTurns.mock.calls[1]![1].prompt).toContain('"status":"succeeded"');
      expect(await physicalHandle.probe()).toMatchObject({ pid: identity.pid, startTicks: identity.startTicks, state: "waiting" });
      const document = await service.document(fixture.projectPath);
      expect(document.experiments[0]!.session).toMatchObject(identity.session);
      if (row.nativeReceipt) {
        expect(document.experiments[0]!.acknowledged).toBe(true);
        expect(document.waits).toEqual([]);
        expect(receivedInputs).toHaveLength(2);
        // The unrelated 45k current tool return must still be delivered whole.
        expect(String(receivedInputs[1]!.message).length).toBeGreaterThan(40000);
        expect(receivedInputs[1]).toMatchObject({ message: expect.stringContaining('"status":"succeeded"'), session: identity.session });
        expect(document.experiments[0]!.notificationReceipt).toMatchObject({ invocationId: "inv_resident_sii",
          nativeEventId: receivedInputs[1]!.eventId, session: identity.session });
      } else {
        expect(document.experiments[0]!.acknowledged).not.toBe(true);
        expect(document.waits[0]).toMatchObject({ status: "ready" });
        expect(document.waits[0]!.nativeReceipt).toBeUndefined();
        expect(document.experiments[0]!.notificationReceipt).toBeUndefined();
        expect(receivedInputs).toEqual([]);
      }
      expect(officialEventIds.length).toBeGreaterThan(0);
      expect(new Set(officialEventIds).size).toBe(officialEventIds.length);
    } finally { await handle.close(); await logicalTask; await pausing?.catch(() => undefined); await service.stop(); }
  }, 30_000);

  it.each(["codex", "claude-code"] as const)("confirms a synchronous SII result only through the current %s resident native turn", async harness => {
    const fixture = await createFixture(harness, harness === "codex" ? new CodexAdapter() : new ClaudeCodeAdapter(),
      "delivery", "workspace", false, "prj_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    const resultPath = path.join(fixture.workspace, "resident-query-result.json");
    const load = `const v=JSON.parse(require('node:fs').readFileSync(${JSON.stringify(resultPath)},'utf8'));`;
    const nativeResult = harness === "codex"
      ? `${load}s({method:'item/started',params:{threadId:'codex-session',turnId:id,item:{type:'mcpToolCall',id:'resident-query-call',server:'scienceevolve-sii',tool:'sii_get_experiment',status:'started',arguments:{}}}});s({method:'item/completed',params:{threadId:'codex-session',turnId:id,item:{type:'mcpToolCall',id:'resident-query-call',server:'scienceevolve-sii',tool:'sii_get_experiment',status:'completed',result:v}}});`
      : `${load}s({type:'assistant',session_id:q.session_id,message:{role:'assistant',content:[{type:'tool_use',id:'resident-query-call',name:'mcp__scienceevolve-sii__sii_get_experiment',input:{}}]}});s({type:'user',session_id:q.session_id,message:{role:'user',content:[{type:'tool_result',tool_use_id:'resident-query-call',content:JSON.stringify(v)}]}});`;
    const anchor = harness === "codex" ? "s({method:'thread/tokenUsage/updated'" : "s({type:'assistant'";
    await fs.writeFile(fixture.launch.executable, fakeSource(harness).replace(anchor, nativeResult + anchor), { mode: 0o700 });
    let terminal = false;
    const runJson = vi.fn(async (args: string[]) => ({ success: true,
      data: args.includes("create") ? { name: "resident-sync" } : { job: { status: terminal ? "job_succeeded" : "job_running" } } }));
    const service = new SiiExperimentService({ projectsRoot: fixture.root, inspireBin: "unused", workspaceRoot: fixture.root,
      knowledgeRoot: fixture.root, refreshMs: 3_600_000, accountReader: async () => "fixture-account", runJson });
    await service.start(); await service.refreshNow();
    const configured = configuredAdapter(harness, fixture.launch.executable);
    const facade = new HarnessRuntimeFacade({ adapters: harness === "codex" ? [configured] : [new CodexAdapter(), configured], siiExperiments: service });
    let routeSequence = 0;
    const resident = new HarnessRuntimeResidentAdapter({ runtime: facade,
      routeFactory: async () => openTestInvocationRoute(configured.descriptor.nativeProtocol, `resident-sync-route-${++routeSequence}`) });
    const prepared = await highLevelInput(fixture, async () => undefined);
    prepared.request.project.agents.writer!.experimentMcp = true;
    prepared.request.project.orchestration = { schemaVersion: 2 } as AgentRunRequest["project"]["orchestration"];
    const nativeTools: Array<Record<string, unknown>> = [];
    const handle = await resident.open({ ...prepared, turnRequestFactory: async ({ baseRequest, turn }) => ({
      request: { ...baseRequest, invocationId: turn.invocationId, onOfficialHarnessEvent: event => {
        if (event.tool) nativeTools.push({ kind: event.kind, name: event.tool.name, server: event.tool.server,
          callId: event.tool.callId, marker: event.tool.outputPreview?.includes("[OpenFARS SII result ") });
      } }, onTrace: async (_kind, message) => {
        if (message !== "Resident turn authority activated") return;
        const client = new Client({ name: "resident-sync-query", version: "1" });
        await client.connect(new StreamableHTTPClientTransport(new URL(baseRequest.siiMcp!.url)));
        try {
          const submission = await client.callTool({ name: "sii_submit_experiment", arguments: { request_id: "resident-sync",
            args: ["job", "create", "--name", "resident-sync", "--workspace", "space", "--project", "具有能动性的科学大模型"] } });
          expect(submission.isError).not.toBe(true);
          const id = (submission.structuredContent as { experiment: { id: string } }).experiment.id;
          terminal = true; await service.mutate(fixture.projectPath, doc => { doc.experiments[0]!.nextCheckAt = 0; });
          await service.refreshNow();
          const result = await client.callTool({ name: "sii_get_experiment", arguments: { experiment_id: id } });
          expect(result.isError).not.toBe(true);
          await expect(assertSiiControlAction(baseRequest.project.id, "writer", turn.invocationId, { tool: "finish_task" }))
            .rejects.toThrow("still needs experiment results");
          await fs.writeFile(resultPath, JSON.stringify(result));
        } finally { await client.close(); }
      } }) });
    try {
      await expect(handle.submit({ inputId: "resident-sync-input", invocationId: "inv_resident_sync", prompt: "Inspect the terminal result." }))
        .resolves.toMatchObject({ handoff: harness === "codex" ? "codex-1" : "claude-1" });
      const doc = await service.document(fixture.projectPath);
      expect(doc.experiments[0]!.acknowledged).toBe(true);
      expect(doc.experiments[0]!.notificationReceipt).toMatchObject({ source: "native_tool_result",
        nativeCallId: "resident-sync-input:resident-query-call", invocationId: "inv_resident_sync", session: handle.initialLease.session });
      expect(doc.waits).toEqual([]);
      expect(nativeTools).toContainEqual(expect.objectContaining({ kind: "tool.completed",
        callId: "resident-sync-input:resident-query-call", marker: true }));
      expect(runJson.mock.calls.filter(([args]) => args.includes("create"))).toHaveLength(1);
    } finally { await handle.close(); await service.stop(); }
  }, 30_000);

  it.each(["workspace", "compute", "yolo"] as const)("coordination keeps the original Pi management session and narrow MCP scope despite %s configuration", async (permission) => {
    const fixture = await createFixture("pi", new PiAdapter(), "leader", "workspace", true);
    const originalSession = fixture.launch.session;
    await fs.mkdir(path.dirname(originalSession.nativeId), { recursive: true });
    await fs.writeFile(originalSession.nativeId, JSON.stringify({ type: "session", id: "pi-official-session", cwd: fixture.workspace }) + "\n");
    const history = await fs.readFile(originalSession.nativeId);
    const memory = await fs.readFile(fixture.launch.spec.inputs.memoryPath);
    const scope = { incidentId: "my-receipt-incident", level: 0, role: "leader" as const, coordinatorEpoch: 11, canRequestUser: false };
    const request = { ...fixture.launch.request, kind: "worker", permission,
      project: { ...fixture.launch.request.project, status: "running", agentSessions: { writer: originalSession },
        agents: { writer: { ...fixture.launch.request.project.agents.writer, permission, sessionPersistence: false,
          instructions: "Implement the business product", webSearch: true,
          mcpServers: [{ name: "business", project: "missing-business-definition" }] } } },
      skillPaths: ["/missing/business/SKILL.md"], autoSkillPaths: ["/missing/auto/SKILL.md"],
      sessionContinuity: "strict", terminalPushCoordination: scope } as unknown as AgentRunRequest;
    const configuration = structuredClone(request.project.agents.writer);
    const processHost = new CommonProcessHost();
    let launchEnvironment: NodeJS.ProcessEnv | undefined;
    const start = processHost.startResident.bind(processHost);
    vi.spyOn(processHost, "startResident").mockImplementation((binding, plan, callbacks) => {
      launchEnvironment = { ...plan.env }; return start(binding, plan, callbacks);
    });
    const facade = new HarnessRuntimeFacade({ processHost, adapters: [new CodexAdapter(), new PiAdapter({ harnessExecutables: { pi: fixture.launch.executable } })] });
    const prepare = vi.spyOn(facade, "prepareResidentScope");
    const services: ControlActionService[] = [];
    const adapter = new HarnessRuntimeResidentAdapter({ runtime: facade,
      controlServiceFactory: options => { const service = new ControlActionService(options); services.push(service); return service; },
      routeFactory: async () => openTestInvocationRoute("chat-completions", "coordination-route") });
    const launcher = createProductionCollaborationResidentLauncher(facade, adapter);
    const capability = "native-coordination-capability";
    const accepted: string[] = [];
    let rpc: Awaited<ReturnType<typeof openStdioRpc>> | undefined;
    const handle = await launcher.open({ request, inputs: fixture.launch.spec.inputs,
      executionRuntimePath: fixture.executionRuntime, filesystemAuthorityInput: { serviceUserRoot: fixture.root, protectedRoots: [fixture.executionRuntime] },
      signal: fixture.launch.signal, onTrace: async () => undefined,
      controlScope: { role: "receipt-coordinator", projectId: "prj_fixture", nodeRunId: "nr_fixture", groupRunId: "grp_fixture",
        leaderAgentId: "writer", coordinatorEpoch: 11, terminalPushCoordination: scope },
      controlAuthorityFactory: async () => ({ control: { stagingPath: path.join(fixture.executionRuntime, "coordination-actions.json"),
        capability, capabilityHash: createHash("sha256").update(capability).digest("hex"), stateVersion: 11, candidates: [],
        decisionBy: "agent", allowUserIntervention: false, canComplete: false, requireBridge: true, terminalPushCoordination: scope },
        revalidate: async envelope => { accepted.push(envelope.action.tool); } }),
      turnRequestFactory: async ({ baseRequest, turn }) => ({ request: { ...baseRequest, invocationId: turn.invocationId },
        onTrace: async (_kind, message) => {
          if (message !== "Resident turn authority activated") return;
          await expect(services.at(-1)!.stage(capability, "illegal-business-route", { tool: "route_to_agent", target: "worker" })).rejects.toThrow(/exact coordination scope/);
          await expect(rpc!.request("tools/call", { name: "coordinate_agent_receipt", arguments: {
            callId: "manager-choice", incidentId: scope.incidentId, operation: "escalate", rationale: "I need my parent to review these facts" } }))
            .resolves.toMatchObject({ result: { content: expect.any(Array) } });
          await expect(rpc!.request("tools/call", { name: "finish_task", arguments: {
            callId: "manager-finish", summary: "My coordination is finished", memory: "I retained the facts and asked my parent" } }))
            .resolves.toMatchObject({ result: { content: expect.any(Array) } });
        } }) });
    try {
      const prepared = await prepare.mock.results.at(-1)!.value;
      expect(prepared.spec.session).toMatchObject({ nativeId: originalSession.nativeId, generation: originalSession.generation, durable: true });
      expect(prepared.spec.policy).toMatchObject({ permission: "workspace", mcpServers: [], skillPaths: [], autoSkillPaths: [], webSearch: false });
      expect(prepared.filesystemAuthority).toMatchObject({ writeRoots: [], gitCapability: "none", rawTools: "forbidden" });
      const rows = JSON.parse(launchEnvironment!.SCIENCEEVOLVE_PI_MCP_CONFIG!) as Array<{ namespace: string; command: string; args: string[] }>;
      expect(rows.map(item => item.namespace).sort()).toEqual(["openfars-filesystem-authority", "openfars-resident-control", "scienceevolve-sleep"]);
      const row = rows.find(item => item.namespace === "openfars-resident-control")!;
      rpc = await openStdioRpc(row.command, row.args);
      expect((await rpc.request("tools/list")).result).toMatchObject({ tools: [{ name: "finish_task" }, { name: "coordinate_agent_receipt" }] });
      const result = await handle.submit({ inputId: "my-coordination", invocationId: request.invocationId, prompt: "Read my retained memory and decide" });
      expect(result).toMatchObject({ threadId: originalSession.nativeId, handoff: "pi-1", controlActions: expect.arrayContaining([
        expect.objectContaining({ action: expect.objectContaining({ tool: "finish_task" }) }),
        expect.objectContaining({ action: expect.objectContaining({ tool: "coordinate_agent_receipt", operation: "escalate" }) })]) });
      expect(accepted).toEqual(["coordinate_agent_receipt", "finish_task"]);
      await expect(handle.submit({ inputId: "foreign-turn", invocationId: "unreserved-turn", prompt: "continue" })).rejects.toThrow(/stable process authority/);
      await expect(services.at(-1)!.stage(capability, "stale-finish", { tool: "finish_task" })).rejects.toThrow(/revoked/);
      expect(await fs.readFile(originalSession.nativeId)).toEqual(history);
      expect(await fs.readFile(fixture.launch.spec.inputs.memoryPath)).toEqual(memory);
      expect(request.project.agents.writer).toEqual(configuration);
    } finally { await rpc?.close(); await handle.close(); }
  }, 30_000);

  it.each(["missing-session", "ephemeral", "missing-scope", "wrong-incident", "wrong-epoch", "mixed-observation", "completed", "proposal", "reopen"] as const)("rejects coordination before launching when %s", async mode => {
    const fixture = await createFixture("pi", new PiAdapter(), "leader", "workspace", true);
    const scope = { incidentId: "exact-incident", level: 0, role: "leader" as const, coordinatorEpoch: 11, canRequestUser: false };
    const request = { ...fixture.launch.request, project: { ...fixture.launch.request.project,
      status: mode === "completed" ? "completed" : "running", agentSessions: mode === "missing-session" ? {} : { writer: fixture.launch.session } },
      sessionContinuity: mode === "ephemeral" ? "replaceable" : "strict", terminalPushCoordination: scope,
      ...(mode === "mixed-observation" ? { terminalPushObservation: { operationId: "push" } } : {}) } as unknown as AgentRunRequest;
    const facade = new HarnessRuntimeFacade({ adapters: [new CodexAdapter(), new PiAdapter()] });
    const prepare = vi.spyOn(facade, "prepareResidentScope");
    const adapter = new HarnessRuntimeResidentAdapter({ runtime: facade, routeFactory: async () => openTestInvocationRoute("chat-completions", "rejected") });
    await expect(adapter.open({ request, inputs: { ...fixture.launch.spec.inputs,
      ...(mode === "proposal" ? { workflowAuthoringPath: "/tmp/workflow.json" } : {}) },
      executionRuntimePath: fixture.executionRuntime, filesystemAuthorityInput: { serviceUserRoot: fixture.root, protectedRoots: [] },
      signal: fixture.launch.signal, onTrace: async () => undefined,
      ...(mode === "reopen" ? { sameEpochReopen: { previousRuntimePath: "/tmp/original", revalidate: () => undefined } } : {}),
      ...(mode === "missing-scope" ? {} : { controlScope: { role: "receipt-coordinator" as const, projectId: "prj_fixture",
        nodeRunId: "nr_fixture", groupRunId: "grp_fixture", leaderAgentId: "writer", coordinatorEpoch: mode === "wrong-epoch" ? 12 : 11,
        terminalPushCoordination: mode === "wrong-incident" ? { ...scope, incidentId: "foreign" } : scope } }) }))
      .rejects.toThrow(/exact original durable management session/);
    expect(prepare).not.toHaveBeenCalled();
  });

  it.each([
    { id: "codex", adapter: () => new CodexAdapter(), permission: "yolo" as const },
    { id: "claude-code", adapter: () => new ClaudeCodeAdapter(), permission: "compute" as const },
    { id: "pi", adapter: () => new PiAdapter(), permission: "workspace" as const },
    { id: "dsh", adapter: () => new DshAdapter(), permission: "yolo" as const }
  ])("resumes the original $id session for exact-file closing without inheriting $permission authority", async row => {
    const fixture = await createFixture(row.id, row.adapter(), "delivery", "workspace", true);
    let originalSession: SessionRef | undefined;
    const first = await highLevelInput(fixture, async session => { originalSession = structuredClone(session); });
    first.request.project.orchestration = { schemaVersion: 3 } as never;
    first.request.executionContext = { ...first.request.executionContext!, groupRunId: "run-original" } as never;
    const configured = configuredAdapter(row.id, fixture.launch.executable);
    const facade = new HarnessRuntimeFacade({ adapters: row.id === "codex" ? [configured] : [new CodexAdapter(), configured] });
    const prepare = vi.spyOn(facade, "prepareResidentScope"), services: ControlActionService[] = [];
    const adapter = new HarnessRuntimeResidentAdapter({ runtime: facade,
      controlServiceFactory: options => { const service = new ControlActionService(options); services.push(service); return service; },
      routeFactory: async () => openTestInvocationRoute(configured.descriptor.nativeProtocol, "closing-route") });
    const launcher = createProductionCollaborationResidentLauncher(facade, adapter);
    const base = { request: first.request, executionRuntimePath: first.executionRuntimePath,
      filesystemAuthorityInput: first.filesystemAuthorityInput, signal: first.signal, onTrace: first.onTrace,
      turnRequestFactory: async ({ baseRequest, turn: current }: { baseRequest: AgentRunRequest; turn: { invocationId: string } }) =>
        ({ request: { ...baseRequest, invocationId: current.invocationId }, onTrace: async () => undefined }) };
    const old = await launcher.open(base);
    let closing: Awaited<ReturnType<typeof launcher.open>> | undefined;
    try {
      await old.submit({ inputId: "original", invocationId: "original-business", prompt: "Keep the original work" });
      // The controlled DSH CLI does not persist its history. Supply its
      // native artifact at the real fixed-Agent home, never a replacement Session.
      const dshArtifact = row.id === "dsh" ? dshSessionArtifactPath(
        path.join(fixture.projectPath, "runtime", "harness-agents", "writer", "dsh-home"), fixture.workspace, originalSession!.nativeId) : undefined;
      const history = zstdCompressSync(Buffer.from(JSON.stringify({ type: "session", version: 1, createdAt: 1,
        id: originalSession!.nativeId, cwd: fixture.workspace }) + "\n"));
      if (dshArtifact) { await fs.mkdir(path.dirname(dshArtifact), { recursive: true }); await fs.writeFile(dshArtifact, history); }
      await old.close();
      expect(originalSession).toBeDefined();
      await facade.reconcileResidentStartup({ executionId: "exec-fixture", harnessId: row.id,
        runtimePath: first.executionRuntimePath, nextOwnershipEpoch: 8 });
      const invocationId = "inv_closing", runtimePath = path.join(fixture.projectPath, "runtime", invocationId);
      const nativeRuntime = path.join(path.dirname(first.executionRuntimePath), "closing-native");
      const inboxPath = path.join(fixture.projectPath, "messages", `0002_${invocationId}_to_writer.md`);
      await fs.mkdir(runtimePath); await fs.writeFile(inboxPath, "Original Leader authorizes leftover.txt only");
      const memoryPath = path.join(fixture.workspace, "agent-memory", "writer", "Memory.md");
      await fs.writeFile(memoryPath, "Immutable original business Memory");
      await fs.writeFile(path.join(fixture.workspace, "leftover.txt"), "Original leftover");
      const worktreeClosing = { kind: "completed-leftovers" as const, reportHeadSha: "a".repeat(40), paths: ["leftover.txt"],
        executionId: "exec-fixture", ownershipEpoch: 7, grantInvocationId: "original-leader", grantCallId: "explicit-close" };
      const project = structuredClone(first.request.project);
      project.agentSessions = { writer: originalSession! };
      project.agents.writer = { ...project.agents.writer, permission: row.permission, webSearch: true, experimentMcp: true,
        instructions: "Do my entire business mandate", mcpServers: [{ name: "unavailable-business", project: "unavailable-business" }] };
      const configBefore = structuredClone(project.agents.writer), capability = "closing-capability";
      let drift = false;
      const request = { ...first.request, project, permission: row.permission, invocationId, runtimePath, inboxPath,
        sessionContinuity: "strict" as const, worktreeClosing, skillPaths: ["/missing/SKILL.md"], autoSkillPaths: ["/missing/auto/SKILL.md"] };
      closing = await launcher.open({ ...base, request, executionRuntimePath: nativeRuntime,
        sameEpochReopen: { previousRuntimePath: first.executionRuntimePath, revalidate: () => undefined },
        controlScope: { role: "execution-artifact", projectId: project.id, nodeRunId: "nr_fixture", executionId: "exec-fixture",
          agentId: "writer", ownershipEpoch: 7, worktreeClosing },
        controlAuthorityFactory: async () => ({ control: { stagingPath: path.join(nativeRuntime, "closing-actions.json"), capability,
          capabilityHash: createHash("sha256").update(capability).digest("hex"), stateVersion: 7, candidates: [], decisionBy: "agent",
          allowUserIntervention: false, canComplete: false, requireBridge: true, allowAgentGitActions: true, worktreeClosing },
          revalidate: async () => undefined, execute: async () => ({ headSha: "b".repeat(40), status: "confirmed" }) }),
        turnRequestFactory: async ({ baseRequest, turn: current }) => ({ request: { ...baseRequest, invocationId: current.invocationId,
          ...(drift ? { worktreeClosing: { ...baseRequest.worktreeClosing!, paths: ["new-business.txt"] } } : {}) },
          onTrace: async (_kind, message) => {
            if (message !== "Resident turn authority activated") return;
            await expect(services.at(-1)!.stage(capability, "escape-live", { tool: "git_prepare_conflict" })).rejects.toThrow(/exact closing scope/);
            await expect(services.at(-1)!.stage(capability, "no-reason", { tool: "git_push" })).rejects.toThrow(/exact closing scope/);
            await services.at(-1)!.stage(capability, "my-closing-finish", { tool: "finish_task", summary: "My separate result" });
          } }) });
      const prepared = await prepare.mock.results.at(-1)!.value;
      expect(prepared.spec.session).toMatchObject({ nativeId: originalSession!.nativeId, generation: originalSession!.generation, durable: true });
      expect(prepared.spec.policy).toMatchObject({ permission: "workspace", mcpServers: [], skillPaths: [], autoSkillPaths: [], webSearch: false });
      expect(prepared.filesystemAuthority).toMatchObject({ rawTools: "forbidden", gitCapability: "none" });
      expect(prepared.filesystemAuthority.rootBindings.filter(root => root.write)).toEqual([
        expect.objectContaining({ path: fixture.workspace, writeFiles: ["leftover.txt"] })
      ]);
      expect(prepared.spec.prompt).toContain('Authorized exact files: ["leftover.txt"]');
      expect(prepared.spec.prompt).not.toContain("Do my entire business mandate");
      const fileRpc = await openStdioRpc(prepared.filesystemMcp.row.command, prepared.filesystemMcp.row.args);
      try {
        const config = JSON.parse(await fs.readFile(prepared.filesystemMcp.configPath, "utf8"));
        const root = config.roots.find((item: { path: string }) => item.path === fixture.workspace);
        expect((await fileRpc.request("tools/list")).result).toMatchObject({ tools: expect.arrayContaining([
          expect.objectContaining({ name: "write_file" }), expect.objectContaining({ name: "remove_file" }) ]) });
        expect((await fileRpc.request("tools/call", { name: "write_file", arguments: { rootId: root.id, path: "leftover.txt", content: "Agent correction" } })).result).not.toMatchObject({ isError: true });
        for (const denied of ["new-business.txt", "agent-memory/writer/Memory.md"])
          expect((await fileRpc.request("tools/call", { name: "write_file", arguments: { rootId: root.id, path: denied, content: "forbidden" } })).result).toMatchObject({ isError: true });
        expect((await fileRpc.request("tools/call", { name: "git_stage", arguments: { paths: ["leftover.txt"] } })).result).toMatchObject({ isError: true });
      } finally { await fileRpc.close(); }
      const result = await closing.submit({ inputId: "my-closing", invocationId, prompt: "Perform only the exact original Leader grant" });
      expect(result.controlActions).toContainEqual(expect.objectContaining({ action: { tool: "finish_task", summary: "My separate result" } }));
      await expect(services.at(-1)!.stage(capability, "escape", { tool: "git_prepare_conflict" })).rejects.toThrow(/exact closing scope|revoked/);
      await expect(closing.submit({ inputId: "another", invocationId: "unreserved", prompt: "Escape this grant" })).rejects.toThrow(/stable process authority/);
      drift = true;
      await expect(closing.submit({ inputId: "scope-drift", invocationId, prompt: "Change the retained manifest" })).rejects.toThrow(/stable process authority/);
      expect(await fs.readFile(memoryPath, "utf8")).toBe("Immutable original business Memory");
      expect(project.agents.writer).toEqual(configBefore);
      if (dshArtifact) expect(await fs.readFile(dshArtifact)).toEqual(history);
    } finally { await closing?.close().catch(() => undefined); await old.close().catch(() => undefined); }
  });

  it.each(["missing-grant", "missing-strict-session", "wrong-execution", "wrong-epoch", "outside-path", "another-memory", "extra-scope-field",
    "missing-request", "missing-scope", "missing-original-session", "non-durable-session", "non-git", "legacy", "missing-group", "completed",
    "mixed-observation", "mixed-coordination", "sii", "staged-inputs", "final-integration"] as const)("closing rejects %s before preparing or opening a native process", async invalid => {
    const fixture = await createFixture("pi", new PiAdapter(), "delivery", "workspace", true);
    const first = await highLevelInput(fixture, async () => undefined);
    const scope = { kind: "completed-leftovers" as const, reportHeadSha: "a".repeat(40), paths: ["leftover.txt"],
      executionId: "exec-fixture", ownershipEpoch: 7, grantInvocationId: "leader", grantCallId: "close" };
    const request: AgentRunRequest = { ...first.request, sessionContinuity: "strict", worktreeClosing: scope,
      executionContext: { ...first.request.executionContext!, groupRunId: "original-group" } as never };
    request.project.agentSessions = { writer: { ...fixture.launch.session, durable: true } };
    if (invalid === "missing-strict-session") request.sessionContinuity = undefined;
    if (invalid === "wrong-execution") request.worktreeClosing = { ...scope, executionId: "new-execution" };
    if (invalid === "wrong-epoch") request.worktreeClosing = { ...scope, ownershipEpoch: 8 };
    if (invalid === "outside-path") request.worktreeClosing = { ...scope, paths: ["../outside"] };
    if (invalid === "another-memory") request.worktreeClosing = { ...scope, paths: ["agent-memory/reviewer/Memory.md"] };
    if (invalid === "extra-scope-field") request.worktreeClosing = { ...scope, extra: "forged" } as never;
    if (invalid === "missing-request") request.worktreeClosing = undefined;
    if (invalid === "missing-original-session") request.project.agentSessions = {};
    if (invalid === "non-durable-session") request.project.agentSessions.writer!.durable = false;
    if (invalid === "non-git") request.project.git = undefined;
    if (invalid === "legacy") request.project.orchestration = { schemaVersion: 2 } as never;
    if (invalid === "missing-group") request.executionContext = { ...request.executionContext!, groupRunId: undefined } as never;
    if (invalid === "completed") request.project.status = "completed";
    if (invalid === "mixed-observation") request.terminalPushObservation = { operationId: "old-push" };
    if (invalid === "mixed-coordination") request.terminalPushCoordination = { incidentId: "issue", coordinatorEpoch: 1, level: 0, role: "leader", canRequestUser: false };
    if (invalid === "sii") request.siiMcp = { url: "http://127.0.0.1:12345/forged" };
    if (invalid === "final-integration") request.executionContext = { ...request.executionContext!, role: "final-integration" } as never;
    const facade = new HarnessRuntimeFacade({ adapters: [new CodexAdapter(), new PiAdapter()] });
    const prepare = vi.spyOn(facade, "prepareResidentScope");
    const adapter = new HarnessRuntimeResidentAdapter({ runtime: facade,
      routeFactory: async () => { throw new Error("No native route should be allocated"); } });
    await expect(adapter.open({ request, executionRuntimePath: first.executionRuntimePath,
      filesystemAuthorityInput: first.filesystemAuthorityInput, signal: first.signal, onTrace: first.onTrace,
      ...(invalid === "missing-grant" ? {} : { sameEpochReopen: { previousRuntimePath: "/tmp/old-runtime", revalidate: () => undefined } }),
      ...(invalid === "missing-scope" ? {} : { controlScope: { role: "execution-artifact", projectId: "prj_fixture", nodeRunId: "nr_fixture",
        executionId: "exec-fixture", agentId: "writer", ownershipEpoch: 7, worktreeClosing: scope } }),
      ...(invalid === "staged-inputs" ? { inputs: fixture.launch.spec.inputs } : {}) })).rejects.toThrow(/closing requires/i);
    expect(prepare).not.toHaveBeenCalled();
  });

  it.each(["workspace", "compute", "yolo"] as const)("terminal push receipt resumes the original native Pi session with only receipt/read tools despite %s business configuration", async (permission) => {
    const fixture = await createFixture("pi", new PiAdapter());
    let originalSession: SessionRef | undefined;
    const first = await highLevelInput(fixture, async (session) => { originalSession = structuredClone(session); });
    first.request.project.orchestration = { schemaVersion: 3 } as never;
    const processHost = new CommonProcessHost();
    let launchEnvironment: NodeJS.ProcessEnv | undefined;
    const originalStart = processHost.startResident.bind(processHost);
    vi.spyOn(processHost, "startResident").mockImplementation((binding, plan, callbacks) => {
      launchEnvironment = { ...plan.env }; return originalStart(binding, plan, callbacks);
    });
    const facade = new HarnessRuntimeFacade({ processHost, adapters: [new CodexAdapter(),
      new PiAdapter({ harnessExecutables: { pi: fixture.launch.executable } })] });
    const prepare = vi.spyOn(facade, "prepareResidentScope");
    const services: ControlActionService[] = [];
    const adapter = new HarnessRuntimeResidentAdapter({ runtime: facade,
      controlServiceFactory: (options) => { const service = new ControlActionService(options); services.push(service); return service; },
      routeFactory: async () => openTestInvocationRoute("chat-completions", "receipt-route") });
    const turnRequestFactory = async ({ baseRequest, turn: current }: {
      baseRequest: AgentRunRequest; turn: { invocationId: string }
    }) => ({ request: { ...baseRequest, invocationId: current.invocationId }, onTrace: async () => undefined });
    const launcher = createProductionCollaborationResidentLauncher(facade, adapter);
    const openInput = { request: first.request, executionRuntimePath: first.executionRuntimePath,
      filesystemAuthorityInput: { ...first.filesystemAuthorityInput, projectWorktreeRoot: path.dirname(fixture.workspace) },
      signal: first.signal, onTrace: first.onTrace, turnRequestFactory };
    const old = await launcher.open(openInput);
    let receipt: Awaited<ReturnType<typeof launcher.open>> | undefined;
    let rpc: Awaited<ReturnType<typeof openStdioRpc>> | undefined;
    try {
      await expect(old.submit({ inputId: "original-business", invocationId: "original-business-inv", prompt: "retain my completed result" }))
        .resolves.toMatchObject({ handoff: "pi-1" });
      await old.close();
      expect(originalSession).toBeDefined();
      const history = await fs.readFile(originalSession!.nativeId);
      const memoryPath = path.join(fixture.workspace, "agent-memory", "writer", "Memory.md");
      await fs.writeFile(memoryPath, "Original Agent memory, keep it unchanged during receipt preparation");
      const memoryBefore = await fs.readFile(memoryPath);
      await facade.reconcileResidentStartup({ executionId: "exec-fixture", harnessId: "pi",
        runtimePath: first.executionRuntimePath, nextOwnershipEpoch: 8 });
      const runtimePath = path.join(path.dirname(first.executionRuntimePath), "terminal-receipt-native");
      const invocationRuntimePath = path.join(fixture.projectPath, "runtime", "terminal-receipt-inv");
      await Promise.all([fs.mkdir(runtimePath, { recursive: true }), fs.mkdir(invocationRuntimePath, { recursive: true })]);
      const inboxPath = path.join(fixture.projectPath, "messages", "0002_terminal-receipt-inv_to_writer.md");
      await fs.writeFile(inboxPath, "Read your retained task memory and observe your exact original push; report the actual result.\n");
      const observation = { operationId: "original-completed-push" };
      const project = structuredClone(first.request.project);
      project.agentSessions = { writer: originalSession! };
      project.agents.writer = { ...project.agents.writer, permission, webSearch: true,
        instructions: "Implement the whole business product and publish it", sessionPersistence: false,
        mcpServers: [{ name: "business-project-mcp", project: "business-project-mcp" },
          { name: "citation-check", url: "https://118.196.152.186/mcp/citation-check" }] };
      // A selected project MCP has no definition and selected Skills do not
      // exist: receipt preparation must never start/stage those capabilities.
      const configBefore = structuredClone(project.agents.writer);
      const request: AgentRunRequest = { ...first.request, project, permission,
        invocationId: "terminal-receipt-inv", inboxPath, runtimePath: invocationRuntimePath,
        sessionContinuity: "strict", terminalPushObservation: observation,
        skillPaths: ["/missing/business/SKILL.md"], autoSkillPaths: ["/missing/auto/SKILL.md"] };
      let revalidations = 0;
      let capability = "";
      const providerCalls: string[] = [];
      const actualResult = { status: "unconfirmed", remote: { status: "missing" }, operation: { id: observation.operationId, status: "uncertain" } };
      receipt = await launcher.open({ ...openInput, request, executionRuntimePath: runtimePath,
        sameEpochReopen: { previousRuntimePath: first.executionRuntimePath, revalidate: () => { revalidations += 1; } },
        controlScope: { role: "execution-artifact", projectId: "prj_fixture", nodeRunId: "nr_fixture", executionId: "exec-fixture",
          agentId: "writer", ownershipEpoch: 7, terminalPushObservation: observation },
        controlAuthorityFactory: async ({ request: currentRequest }) => {
          expect(currentRequest.permission).toBe("workspace");
          capability = "original-native-receipt-capability";
          return { control: { stagingPath: path.join(runtimePath, "receipt-actions.json"), capability,
            capabilityHash: createHash("sha256").update(capability).digest("hex"), stateVersion: 7, candidates: [],
            decisionBy: "agent", allowUserIntervention: false, canComplete: false, requireBridge: true,
            allowAgentGitActions: true, terminalPushObservation: observation },
            revalidate: async (envelope) => { if (envelope.action.tool === "finish_task") providerCalls.push(envelope.action.tool); },
            execute: async (envelope) => { providerCalls.push(envelope.action.tool); return actualResult; } };
        },
        turnRequestFactory: async ({ baseRequest, turn: current }) => ({ request: { ...baseRequest, invocationId: current.invocationId },
          onTrace: async (_kind, message) => {
            if (message !== "Resident turn authority activated") return;
            await expect(services.at(-1)!.stage(capability, "raw-forbidden", { tool: "git_push" })).rejects.toThrow(/exact receipt scope/);
            const observed = await rpc!.request("tools/call", { name: "git_reconcile_push", arguments: {
              callId: "my-history", operationId: observation.operationId, historical: true } });
            expect(observed.result).not.toMatchObject({ isError: true });
            expect(JSON.stringify(observed.result)).toContain('missing');
            await expect(rpc!.request("tools/call", { name: "finish_task", arguments: { callId: "my-receipt",
              summary: "Remote still missing", memory: "I observed my original push and it is still missing" } }))
              .resolves.toMatchObject({ result: { content: expect.any(Array) } });
          } }) });
      const prepared = await prepare.mock.results.at(-1)!.value;
      expect(prepared.spec.policy).toMatchObject({ permission: "workspace", mcpServers: [], skillPaths: [], autoSkillPaths: [], webSearch: false });
      expect(prepared.spec.session).toMatchObject({ nativeId: originalSession!.nativeId, generation: originalSession!.generation, durable: true });
      expect(prepared.filesystemAuthority).toMatchObject({ writeRoots: [], gitCapability: "none", rawTools: "forbidden" });
      expect(prepared.spec.prompt).toContain('operationId="original-completed-push", historical=true');
      expect(prepared.spec.prompt).not.toContain("call git_push");
      expect(prepared.spec.prompt).not.toContain("Implement the whole business product");
      const rows = JSON.parse(launchEnvironment!.SCIENCEEVOLVE_PI_MCP_CONFIG!) as Array<{ namespace: string; command: string; args: string[] }>;
      expect(rows.map((row) => row.namespace).sort()).toEqual(["openfars-filesystem-authority", "openfars-resident-control", "scienceevolve-sleep"]);
      expect(launchEnvironment!.SCIENCEEVOLVE_AGENT_PERMISSION).toBe("workspace");
      expect(launchEnvironment!.SCIENCEEVOLVE_FIXED_MCP_TOKEN).toBeUndefined();
      const fileRpc = await openStdioRpc(prepared.filesystemMcp.row.command, prepared.filesystemMcp.row.args);
      try {
        const listed = await fileRpc.request("tools/list");
        expect((listed.result as { tools: Array<{ name: string }> }).tools.map((tool) => tool.name))
          .toEqual(["read_file", "list_directory", "authority_matrix"]);
        const config = JSON.parse(await fs.readFile(prepared.filesystemMcp.configPath, "utf8"));
        const root = config.roots.find((item: { path: string }) => item.path === fixture.workspace);
        const read = await fileRpc.request("tools/call", { name: "read_file", arguments: { rootId: root.id, path: "agent-memory/writer/Memory.md" } });
        expect(JSON.stringify(read.result)).toContain("Original Agent memory");
        await expect(fileRpc.request("tools/call", { name: "write_file", arguments: { rootId: root.id, path: "business-denied.txt", content: "deny" } }))
          .resolves.toMatchObject({ result: { isError: true } });
        await expect(fileRpc.request("tools/call", { name: "git_stage", arguments: { paths: ["Memory.md"] } }))
          .resolves.toMatchObject({ result: { isError: true } });
      } finally { await fileRpc.close(); }
      const controlRow = rows.find((row) => row.namespace === "openfars-resident-control")!;
      rpc = await openStdioRpc(controlRow.command, controlRow.args);
      const tools = await rpc.request("tools/list");
      expect((tools.result as { tools: Array<{ name: string }> }).tools.map((tool) => tool.name)).toEqual(["finish_task", "git_reconcile_push"]);
      const output = await receipt.submit({ inputId: "original-history-receipt", invocationId: "terminal-receipt-inv", prompt: "observe my retained push" });
      expect(output).toMatchObject({ threadId: originalSession!.nativeId, handoff: "pi-1",
        controlActions: expect.arrayContaining([expect.objectContaining({ action: { tool: "git_reconcile_push", operationId: observation.operationId, historical: true } }),
          expect.objectContaining({ action: { tool: "finish_task", summary: "Remote still missing", memory: "I observed my original push and it is still missing" } })]) });
      expect(providerCalls).toEqual(["git_reconcile_push", "finish_task"]);
      await expect(services.at(-1)!.stage(capability, "stale-receipt", { tool: "finish_task" })).rejects.toThrow(/revoked/);
      await expect(receipt.submit({ inputId: "extra-receipt", invocationId: "unreserved-receipt-inv", prompt: "give another invocation" }))
        .rejects.toThrow(/stable process authority/);
      expect(project.agents.writer).toEqual(configBefore);
      expect(await fs.readFile(originalSession!.nativeId)).toEqual(history);
      expect(await fs.readFile(memoryPath)).toEqual(memoryBefore);
      expect(revalidations).toBeGreaterThanOrEqual(6);
      await expect(fs.access(path.join(fixture.workspace, "business-denied.txt"))).rejects.toThrow();
      await receipt.pause(); await receipt.resume(); await receipt.close(); receipt = undefined;
    } finally { await rpc?.close(); await receipt?.close().catch(() => undefined); await old.close().catch(() => undefined); }
  }, 30_000);

  it.each(["missing-grant", "missing-strict-session", "wrong-operation", "missing-scope", "ordinary-request", "missing-original-session", "non-durable-session"] as const)("terminal push receipt rejects %s before opening any native process", async (invalid) => {
    const fixture = await createFixture("pi", new PiAdapter());
    const first = await highLevelInput(fixture, async () => undefined);
    first.request.project.orchestration = { schemaVersion: 3 } as never;
    first.request.project.agentSessions = invalid === "missing-original-session" ? {} :
      { writer: { ...fixture.launch.session, durable: invalid !== "non-durable-session" } };
    const facade = new HarnessRuntimeFacade({ adapters: [new CodexAdapter(), new PiAdapter()] });
    const prepare = vi.spyOn(facade, "prepareResidentScope");
    const adapter = new HarnessRuntimeResidentAdapter({ runtime: facade,
      routeFactory: async () => openTestInvocationRoute("chat-completions", "should-never-open") });
    const observation = { operationId: "original-push" };
    await expect(adapter.open({ request: { ...first.request, sessionContinuity: invalid === "missing-strict-session" ? undefined : "strict",
      ...(invalid === "ordinary-request" ? {} : { terminalPushObservation: observation }) },
      executionRuntimePath: first.executionRuntimePath, filesystemAuthorityInput: first.filesystemAuthorityInput,
      signal: first.signal, onTrace: first.onTrace,
      ...(invalid === "missing-grant" ? {} : { sameEpochReopen: { previousRuntimePath: "/tmp/prior-native", revalidate: () => {} } }),
      ...(invalid === "missing-scope" ? {} : { controlScope: { role: "execution-artifact", projectId: "prj_fixture", nodeRunId: "nr_fixture",
        executionId: "exec-fixture", agentId: "writer", ownershipEpoch: 7,
        terminalPushObservation: invalid === "wrong-operation" ? { operationId: "different" } : observation } }) }))
      .rejects.toThrow(/exact retained-session delivery grant and control scope/);
    expect(prepare).not.toHaveBeenCalled();
  });

  it("supplement preserves the original Pi session at the same epoch through the production native launcher", async () => {
    const fixture = await createFixture("pi", new PiAdapter());
    let originalSession: SessionRef | undefined;
    const first = await highLevelInput(fixture, async (session) => { originalSession = structuredClone(session); });
    first.request.project.orchestration = { schemaVersion: 3 } as never;
    const facade = new HarnessRuntimeFacade({ adapters: [new CodexAdapter(),
      new PiAdapter({ harnessExecutables: { pi: fixture.launch.executable } })] });
    const adapter = new HarnessRuntimeResidentAdapter({ runtime: facade,
      routeFactory: async () => openTestInvocationRoute("chat-completions", "supplement-route") });
    const turnRequestFactory = async ({ baseRequest, turn: current }: {
      baseRequest: AgentRunRequest; turn: { invocationId: string }
    }) => ({ request: { ...baseRequest, invocationId: current.invocationId }, onTrace: async () => undefined });
    const launcher = createProductionCollaborationResidentLauncher(facade, adapter);
    const openInput = { request: first.request, executionRuntimePath: first.executionRuntimePath,
      filesystemAuthorityInput: { ...first.filesystemAuthorityInput, projectWorktreeRoot: path.dirname(fixture.workspace) },
      signal: first.signal, onTrace: first.onTrace, turnRequestFactory };
    const old = await launcher.open(openInput);
    let current: Awaited<ReturnType<typeof launcher.open>> | undefined;
    try {
      await expect(old.submit({ inputId: "original-task", invocationId: "original-task-inv", prompt: "retain my business result" }))
        .resolves.toMatchObject({ handoff: "pi-1" });
      await old.close();
      expect(originalSession).toBeDefined();
      const historyPath = originalSession!.nativeId;
      const history = await fs.readFile(historyPath);
      await facade.reconcileResidentStartup({ executionId: "exec-fixture", harnessId: "pi",
        runtimePath: first.executionRuntimePath, nextOwnershipEpoch: 8 });
      let revalidations = 0;
      const runtimePath = path.join(path.dirname(first.executionRuntimePath), "supplement-native");
      const invocationRuntimePath = path.join(fixture.projectPath, "runtime", "supplement-inv");
      await Promise.all([fs.mkdir(runtimePath, { recursive: true }), fs.mkdir(invocationRuntimePath, { recursive: true })]);
      const inboxPath = path.join(fixture.projectPath, "messages", "0002_supplement-inv_to_writer.md");
      await fs.writeFile(inboxPath, "Continue the original stopped task and supply its missing tools.\n");
      const supplement = { ...openInput, executionRuntimePath: runtimePath,
        request: { ...first.request, invocationId: "supplement-inv", inboxPath, runtimePath: invocationRuntimePath, sessionContinuity: "strict" as const,
          project: { ...first.request.project, agentSessions: { writer: originalSession! } } },
        sameEpochReopen: { previousRuntimePath: first.executionRuntimePath, revalidate: () => { revalidations += 1; } } };
      current = await launcher.open(supplement);
      await expect(current.submit({ inputId: "supplement-input", invocationId: "supplement-inv", prompt: "complete my retained tools" }))
        .resolves.toMatchObject({ handoff: "pi-1", threadId: originalSession!.nativeId });
      const lease = JSON.parse(await fs.readFile(path.join(runtimePath, "resident-process.json"), "utf8"));
      expect(lease).toMatchObject({ executionId: "exec-fixture", ownershipEpoch: 7,
        session: { nativeId: originalSession!.nativeId, generation: originalSession!.generation }, physicalLeaseId: expect.any(String) });
      expect(revalidations).toBeGreaterThanOrEqual(6);
      await expect(facade.pauseResident({ executionId: "exec-fixture", harnessId: "pi", ownershipEpoch: 7, controlSeq: 100 }))
        .rejects.toThrow(/physical lease identity/);
      expect(await fs.readFile(historyPath)).toEqual(history);
      expect(first.request.project.agents.writer.sessionPersistence).toBe(false);
      await current.pause(); await current.resume();
      await current.close(); current = undefined;
      expect(JSON.parse(await fs.readFile(path.join(runtimePath, "resident-process.json"), "utf8")))
        .toMatchObject({ state: "stopped", physicalLeaseId: lease.physicalLeaseId });
    } finally {
      await current?.close().catch(() => undefined);
      await old.close().catch(() => undefined);
    }
  }, 30_000);

  it("applies the gateway model catalog compatibility to native Codex resident launches", async () => {
    const fixture = await createFixture("codex", new CodexAdapter());
    fixture.launch.spec.model = "gpt-5.6-sol";
    fixture.launch.request.project.agents.writer.model = "gpt-5.6-sol";
    const catalog = { models: [{ slug: "gpt-5.6-sol", use_responses_lite: true,
      tool_mode: "code_mode_only", shell_type: "unified_exec" }] };
    await fs.writeFile(fixture.launch.executable,
      `#!/usr/bin/env node\nif(process.argv.includes('--bundled')){process.stdout.write(${JSON.stringify(JSON.stringify(catalog))});process.exit(0);}\n` +
      fakeSource("codex").replace(/^#![^\n]*\n/, ""), { mode: 0o700 });
    let stderr = "";
    fixture.launch.onTrace = async (kind, message) => { if (kind === "stderr") stderr += message; };
    const opened = await openBuiltinResidentAdapter(fixture.launch).catch((error) => {
      throw new Error(`Native catalog fixture failed: ${stderr}`, { cause: error });
    });
    try {
      const catalogPath = path.join(fixture.executionRuntime, "codex-gateway-model-catalog.json");
      expect(opened.evidence.args).toContain(`model_catalog_json=${JSON.stringify(catalogPath)}`);
      const prepared = JSON.parse(await fs.readFile(catalogPath, "utf8"));
      expect(prepared.models).toEqual([{ ...catalog.models[0], use_responses_lite: false, tool_mode: null }]);
      expect(opened.evidence.args).toContain("gpt-5.6-sol");
    } finally { await opened.driver.close(); }
  });

  it("prepares the Pi durable session parent before spawning the native CLI", async () => {
    const fixture = await createFixture("pi", new PiAdapter());
    const original = fixture.launch.processHost.startResident.bind(fixture.launch.processHost);
    const spawn = vi.spyOn(fixture.launch.processHost, "startResident").mockImplementation(async (...args) => {
      expect((await fs.stat(path.dirname(fixture.launch.session.nativeId))).isDirectory()).toBe(true);
      expect(args[1].env.PI_CODING_AGENT_SESSION_DIR).toBe(path.dirname(fixture.launch.session.nativeId));
      return original(...args);
    });
    const opened = await openBuiltinResidentAdapter(fixture.launch);
    await opened.driver.close();
    expect(spawn).toHaveBeenCalledOnce();
  });

  it.each(["missing", "workspace"] as const)("rejects a %s Pi session before native resume can replace its history", async (invalid) => {
    const fixture = await createFixture("pi", new PiAdapter());
    fixture.launch.session.resumedAt = "2026-09-22T00:01:00.000Z";
    if (invalid === "workspace") {
      await fs.mkdir(path.dirname(fixture.launch.session.nativeId), { recursive: true });
      await fs.writeFile(fixture.launch.session.nativeId, JSON.stringify({
        type: "session", id: "pi-official-session", cwd: path.join(fixture.root, "other")
      }) + "\n");
    }
    const spawn = vi.spyOn(fixture.launch.processHost, "startResident");
    await expect(openBuiltinResidentAdapter(fixture.launch)).rejects.toMatchObject({ code: "SESSION_RESUME_FAILED" });
    expect(spawn).not.toHaveBeenCalled();
  });

  it("opens the same missing Pi reservation only with the exact stopped never-input grant", async () => {
    const fixture = await createFixture("pi", new PiAdapter());
    const original = structuredClone(fixture.launch.session);
    fixture.launch.session.resumedAt = "2026-09-22T00:01:00.000Z";
    const revalidate = vi.fn(async () => undefined);
    fixture.launch.unstartedSession = { projectId: fixture.launch.request.project.id, scopeId: "exec-fixture",
      role: "delivery", stoppedEpoch: 6, workspacePath: fixture.workspace, session: original, revalidate };
    const opened = await openBuiltinResidentAdapter(fixture.launch);
    try {
      expect(opened.driver.session).toMatchObject(original);
      expect(opened.evidence.args).toContain(original.nativeId);
      expect(revalidate).toHaveBeenCalledOnce();
    } finally { await opened.driver.close(); }
  });

  it.each(["project", "scope", "role", "epoch", "workspace", "session", "generation", "createdAt"] as const)(
    "rejects an unstarted Pi grant with a different %s before spawning", async field => {
      const fixture = await createFixture("pi", new PiAdapter());
      const original = structuredClone(fixture.launch.session);
      fixture.launch.session.resumedAt = "2026-09-22T00:01:00.000Z";
      const grant = { projectId: fixture.launch.request.project.id, scopeId: "exec-fixture", role: "delivery" as const,
        stoppedEpoch: 6, workspacePath: fixture.workspace, session: original, revalidate: vi.fn(async () => undefined) };
      if (field === "project") grant.projectId = "another-project";
      if (field === "scope") grant.scopeId = "another-execution";
      if (field === "role") Object.assign(grant, { role: "leader" });
      if (field === "epoch") grant.stoppedEpoch = 5;
      if (field === "workspace") grant.workspacePath = path.join(fixture.root, "another-workspace");
      if (field === "session") grant.session.nativeId += ".other";
      if (field === "generation") grant.session.generation += 1;
      if (field === "createdAt") grant.session.createdAt = "2026-09-23T00:00:00.000Z";
      fixture.launch.unstartedSession = grant;
      const spawn = vi.spyOn(fixture.launch.processHost, "startResident");
      await expect(openBuiltinResidentAdapter(fixture.launch)).rejects.toMatchObject({ code: "SESSION_RESUME_FAILED" });
      expect(spawn).not.toHaveBeenCalled();
      expect(grant.revalidate).not.toHaveBeenCalled();
    }
  );

  it.each(["revoked", "appeared-invalid-history"] as const)("rechecks the unstarted Pi proof: %s", async mode => {
    const fixture = await createFixture("pi", new PiAdapter());
    const original = structuredClone(fixture.launch.session);
    fixture.launch.session.resumedAt = "2026-09-22T00:01:00.000Z";
    fixture.launch.unstartedSession = { projectId: fixture.launch.request.project.id, scopeId: "exec-fixture",
      role: "delivery", stoppedEpoch: 6, workspacePath: fixture.workspace, session: original, revalidate: async () => {
        if (mode === "revoked") throw new Error("Original stop proof revoked");
        await fs.mkdir(path.dirname(original.nativeId), { recursive: true });
        await fs.writeFile(original.nativeId, JSON.stringify({ type: "session", id: "other", cwd: "/another-workspace" }) + "\n");
      } };
    const spawn = vi.spyOn(fixture.launch.processHost, "startResident");
    await expect(openBuiltinResidentAdapter(fixture.launch)).rejects.toThrow(mode === "revoked" ? /stop proof revoked/ : /resume the pi session/);
    expect(spawn).not.toHaveBeenCalled();
  });

  it.each(["used", "legacy", "changed-marker", "failed-probe"] as const)(
    "production I refuses missing Pi history without current never-input stop proof: %s", async mode => {
      const fixture = await createFixture("pi", new PiAdapter(), "delivery", "workspace", true);
      let published: SessionRef | undefined;
      const prepared = await highLevelInput(fixture, async session => { published = session; });
      const runtime = new HarnessRuntimeFacade({ adapters: [new CodexAdapter(), configuredAdapter("pi", fixture.launch.executable)] });
      let routes = 0;
      const adapter = new HarnessRuntimeResidentAdapter({ runtime,
        routeFactory: async () => openTestInvocationRoute("chat-completions", `proof-${++routes}`) });
      const launcher = createProductionCollaborationResidentLauncher(runtime, adapter);
      const input = { request: prepared.request, executionRuntimePath: prepared.executionRuntimePath,
        filesystemAuthorityInput: prepared.filesystemAuthorityInput, signal: prepared.signal, onTrace: prepared.onTrace };
      const first = await launcher.open(input);
      try {
        if (mode === "used") await first.submit({ inputId: "used-input", invocationId: prepared.request.invocationId, prompt: "Original task input." });
        const failedProbe = mode === "failed-probe"
          ? vi.spyOn(runtime, "probeResident").mockRejectedValueOnce(new Error("Process observation unavailable")) : undefined;
        await first.close(); failedProbe?.mockRestore();
        const original = structuredClone(published!);
        await fs.rm(original.nativeId);
        const markerPath = path.join(fixture.executionRuntime, "resident-process.json");
        const marker = JSON.parse(await fs.readFile(markerPath, "utf8"));
        if (mode === "legacy") delete marker.inputStarted;
        if (mode === "changed-marker") marker.inputStarted = true;
        if (mode === "legacy" || mode === "changed-marker") await fs.writeFile(markerPath, JSON.stringify(marker));
        const nextRuntime = path.join(fixture.projectPath, "runtime", "refused-unstarted");
        const nextInbox = path.join(fixture.projectPath, "messages", "0002_refused-unstarted_to_writer.md");
        await fs.mkdir(nextRuntime, { recursive: true }); await fs.writeFile(nextInbox, "Preserve the original task.\n");
        const context = prepared.request.executionContext!;
        if (context.role !== "delivery") throw new Error("fixture role mismatch");
        const spawn = vi.spyOn(runtime.processHost, "startResident");
        await expect(launcher.open({ ...input, executionRuntimePath: nextRuntime, request: { ...prepared.request,
          project: { ...prepared.request.project, agentSessions: { writer: original }, agentSessionIds: { writer: original.nativeId } },
          sessionContinuity: "strict", invocationId: "refused-unstarted", inboxPath: nextInbox, runtimePath: nextRuntime,
          executionContext: { ...context, ownershipEpoch: 8 } } })).rejects.toThrow(/resume the pi session|never-input marker/);
        expect(spawn).not.toHaveBeenCalled();
        await expect(fs.stat(original.nativeId)).rejects.toMatchObject({ code: "ENOENT" });
      } finally { await first.close(); }
    }
  );

  it.runIf(process.env.OPENFARS_NATIVE_PI_TESTS === "1").each(
    [false, true].flatMap(restart => [false, true].map(cancelBeforeClose => ({ restart, cancelBeforeClose })))
  )(
    "recovers an actual never-input Pi reservation through production I/H (restart=$restart, cancellation=$cancelBeforeClose)", async ({ restart, cancelBeforeClose }) => {
      const fixture = await createFixture("pi", new PiAdapter(), "delivery", "workspace", true);
      const executable = path.resolve("../harness/pi/node_modules/@mariozechner/pi-coding-agent/dist/cli.js");
      let published: SessionRef | undefined;
      const prepared = await highLevelInput(fixture, async session => { published = session; });
      const makeRuntime = () => {
        const runtime = new HarnessRuntimeFacade({ adapters: [new CodexAdapter(), configuredAdapter("pi", executable)] });
        const adapter = new HarnessRuntimeResidentAdapter({ runtime,
          routeFactory: async (_request, _trace, _signal) => openTestInvocationRoute("chat-completions", `local-${Math.random()}`, "unstarted-reservation-result") });
        return { runtime, launcher: createProductionCollaborationResidentLauncher(runtime, adapter) };
      };
      let composed = makeRuntime();
      const cancellation = new AbortController();
      const openInput = { request: prepared.request, executionRuntimePath: prepared.executionRuntimePath,
        filesystemAuthorityInput: prepared.filesystemAuthorityInput, signal: cancellation.signal, onTrace: prepared.onTrace,
        turnRequestFactory: async ({ baseRequest, turn: current }) => ({ request: { ...baseRequest, invocationId: current.invocationId }, onTrace: prepared.onTrace }) };
      const first = await composed.launcher.open(openInput);
      let second: Awaited<ReturnType<typeof composed.launcher.open>> | undefined;
      try {
        expect(published).toBeDefined();
        const original = structuredClone(published!);
        await expect(fs.stat(original.nativeId)).rejects.toMatchObject({ code: "ENOENT" });
        const initial = composed.runtime.residentLeases.snapshot("exec-fixture", "pi")!;
        expect(initial).toMatchObject({ inputStarted: false, workspacePath: fixture.workspace });
        await first.pause();
        if (cancelBeforeClose) cancellation.abort();
        else await first.resume();
        await first.close();
        const stopped = JSON.parse(await fs.readFile(path.join(fixture.executionRuntime, "resident-process.json"), "utf8"));
        expect(stopped).toMatchObject({ state: "stopped", inputStarted: false });
        await expect(fs.stat(original.nativeId)).rejects.toMatchObject({ code: "ENOENT" });
        const state = { ...prepared.request.project, agentSessions: { writer: original }, agentSessionIds: { writer: original.nativeId } };
        if (restart) {
          composed = makeRuntime();
          await expect(composed.launcher.stopScopedForRecovery!({ state, scopeId: "exec-fixture", agentId: "writer",
            role: "delivery", ownershipEpoch: 7, executionRuntimePath: fixture.executionRuntime })).resolves.toMatchObject({ stopped: true });
        }
        const context = prepared.request.executionContext!;
        if (context.role !== "delivery") throw new Error("fixture role mismatch");
        const nextRuntime = path.join(fixture.projectPath, "runtime", "actual-pi-first-input");
        await fs.mkdir(nextRuntime, { recursive: true });
        const nextInbox = path.join(fixture.projectPath, "messages", "0002_actual-pi-first-input_to_writer.md");
        await fs.writeFile(nextInbox, "Return the local fixture result.\n");
        second = await composed.launcher.open({ ...openInput, signal: prepared.signal, executionRuntimePath: nextRuntime,
          request: { ...prepared.request, project: state, sessionContinuity: "strict", invocationId: "actual-pi-first-input",
            inboxPath: nextInbox, runtimePath: nextRuntime, executionContext: { ...context, ownershipEpoch: 8 } } });
        expect(published).toMatchObject(original);
        expect(composed.runtime.residentLeases.snapshot("exec-fixture", "pi")).toMatchObject({
          inputStarted: false, ownershipEpoch: 8, session: original });
        await expect(fs.stat(original.nativeId)).rejects.toMatchObject({ code: "ENOENT" });
        await expect(second.submit({ inputId: "actual-first-input", invocationId: "actual-pi-first-input",
          prompt: "Return the local fixture result." })).resolves.toMatchObject({ handoff: "unstarted-reservation-result", threadId: original.nativeId });
        const history = (await fs.readFile(original.nativeId, "utf8")).trim().split("\n").map(line => JSON.parse(line));
        expect(history[0]).toMatchObject({ type: "session", cwd: fixture.workspace });
        expect(history.some(row => row.type === "message" && row.message?.role === "user")).toBe(true);
        expect(history.some(row => row.type === "message" && row.message?.role === "assistant")).toBe(true);
        expect(composed.runtime.residentLeases.snapshot("exec-fixture", "pi")).toMatchObject({ inputStarted: true });
        await second.close();
        if (process.env.OPENFARS_PI_EVIDENCE_DIR) {
          const directory = path.resolve(process.env.OPENFARS_PI_EVIDENCE_DIR); await fs.mkdir(directory, { recursive: true });
          await fs.writeFile(path.join(directory, `unstarted-${restart ? "restart" : "in-process"}${cancelBeforeClose ? "-cancelled" : ""}.json`), JSON.stringify({
            at: new Date().toISOString(), restart, cancelBeforeClose, original, resumed: published, initial, stopped,
            final: composed.runtime.residentLeases.snapshot("exec-fixture", "pi"),
            actualSessionHeader: history[0], actualMessageRoles: history.filter(row => row.type === "message").map(row => row.message?.role),
            historySha256: createHash("sha256").update(await fs.readFile(original.nativeId)).digest("hex"),
            cliSha256: createHash("sha256").update(await fs.readFile(executable)).digest("hex"),
            proofScope: "Same reserved SessionRef path/generation/createdAt before any input; native creates its real history only after the first model response. No fabricated header or migrated used history."
          }, null, 2), { flag: "wx" });
        }
      } finally { await second?.close().catch(() => undefined); await first.close().catch(() => undefined); }
    }, 30_000
  );

  it("rejects a Pi RPC identity that differs from the persisted session header", async () => {
    const fixture = await createFixture("pi", new PiAdapter());
    fixture.launch.session.resumedAt = "2026-09-22T00:01:00.000Z";
    await fs.mkdir(path.dirname(fixture.launch.session.nativeId), { recursive: true });
    await fs.writeFile(fixture.launch.session.nativeId, JSON.stringify({
      type: "session", id: "retained-pi-identity", cwd: fixture.workspace
    }) + "\n");
    await expect(openBuiltinResidentAdapter(fixture.launch)).rejects.toThrow("different native session identity");
  });

  it.each([
    { id: "codex", adapter: () => new CodexAdapter(), expected: ["app-server", "read-only"] },
    { id: "claude-code", adapter: () => new ClaudeCodeAdapter(), expected: ["--input-format", "stream-json", "--restricted"] },
    { id: "pi", adapter: () => new PiAdapter(), expected: ["--mode", "rpc", "--no-builtin-tools"] },
    { id: "dsh", adapter: () => new DshAdapter(), expected: ["--profile", "sdk", "--patch"] }
  ])("launches the real $id resident argv through CommonProcessHost", async (row) => {
    const fixture = await createFixture(row.id, row.adapter());
    let launchEnvironment: NodeJS.ProcessEnv | undefined;
    let launchStderr = "";
    const originalStart = fixture.launch.processHost.startResident
      .bind(fixture.launch.processHost);
    vi.spyOn(fixture.launch.processHost, "startResident")
      .mockImplementation((binding, plan, callbacks) => {
        launchEnvironment = { ...plan.env };
        return originalStart(binding, plan, { ...callbacks, onStderr: async (chunk) => {
          launchStderr += chunk;
          await callbacks?.onStderr?.(chunk);
        } });
      });
    const assertControlReady = vi.fn(async () => undefined);
    const opened = await openBuiltinResidentAdapter({
      ...fixture.launch,
      inactivityPolicy: { modelTimeoutMs: 345_000, toolTimeoutMs: 6_789_000 },
      request: { ...fixture.launch.request, control: {} as never },
      controlMcp: {
        row: {
          name: "openfars-resident-control",
          namespace: "openfars-resident-control",
          transport: "stdio",
          command: "/bin/true",
          args: []
        },
        turnAuthority: fixture.launch.turnAuthority,
        assertReady: assertControlReady
      }
    });
    expect(assertControlReady).toHaveBeenCalledOnce();
    await exerciseFilesystemMcp(fixture.launch.filesystemMcp!, row.id);
    expect(opened.evidence.protocol).toBe(fixture.launch.adapter.resident?.protocol);
    expect(opened.driver.inactivityPolicy()).toEqual({
      modelTimeoutMs: 345_000,
      toolTimeoutMs: 6_789_000
    });
    expect(opened.evidence.cwd).toBe(fixture.workspace);
    for (const argument of row.expected) expect(opened.evidence.args).toContain(argument);
    expect(opened.evidence.args).not.toContain("--effort");
    expect(opened.evidence.args).not.toContain("--thinking");
    expect(opened.evidence.args.join(" ")).not.toContain("model_reasoning_effort");
    if (row.id === "claude-code") {
      expect(opened.evidence.args).toContain("--replay-user-messages");
      expect(opened.evidence.args).not.toContain("--max-turns");
      expect(launchEnvironment).not.toHaveProperty("CLAUDE_STREAM_FIRST_BYTE_TIMEOUT_MS");
      expect(launchEnvironment).not.toHaveProperty("CLAUDE_STREAM_IDLE_TIMEOUT_MS");
      expect(launchEnvironment).not.toHaveProperty("CLAUDE_BYTE_STREAM_IDLE_TIMEOUT_MS");
      expect(launchEnvironment).not.toHaveProperty("API_TIMEOUT_MS");
    }
    if (row.id === "dsh") {
      const patch = await fs.readFile(path.join(fixture.executionRuntime, "dsh-resident.patch.yml"), "utf8");
      expect(patch).toMatch(/tool-bash\n  disabled: true/);
      expect(patch).toContain("- id: tool-goal\n  disabled: true");
      expect(patch).toContain("- id: goal-round-driver\n  disabled: true");
      const settings = await fs.readFile(path.join(fixture.executionRuntime, "dsh-home", "settings.yaml"), "utf8");
      expect(settings).toContain("supportsReasoningEffort: false");
      expect(settings).not.toContain("reasoningEffort:");
    }

    const pid = opened.driver.identity.pid;
    const ticks = opened.driver.identity.startTicks;
    let first;
    try { first = await opened.driver.submit(turn(1)); }
    catch (error) { throw new Error(`Native fixture failed: ${launchStderr}`, { cause: error }); }
    expect(first.handoff).toContain("-1");
    expect((await opened.driver.probe())).toMatchObject({
      alive: true,
      identity: { pid, startTicks: ticks }
    });
    await opened.driver.pause();
    expect((await opened.driver.probe()).stopped).toBe(true);
    await opened.driver.resume();
    const second = await opened.driver.submit(turn(2));
    expect(second.handoff).toContain("-2");
    expect(opened.driver.identity).toMatchObject({ pid, startTicks: ticks });
    await opened.driver.close();
  }, 30_000);

  it.each([
    { id: "codex", adapter: () => new CodexAdapter() },
    { id: "pi", adapter: () => new PiAdapter() }
  ])("routes a fixed-directory MCP credential only for yolo resident $id", async (row) => {
    const fixture = await createFixture(row.id, row.adapter(), "delivery", "yolo");
    const fixedToken = "fixed-resident-mcp-secret";
    let adapterConfig = "";
    const original = fixture.launch.processHost.startResident.bind(fixture.launch.processHost);
    vi.spyOn(fixture.launch.processHost, "startResident").mockImplementation(
      (binding, plan, callbacks) => {
        adapterConfig = row.id === "codex"
          ? plan.args.find((argument) => argument.startsWith("mcp_servers=")) ?? ""
          : plan.env.SCIENCEEVOLVE_PI_MCP_CONFIG ?? "";
        return original(binding, plan, callbacks);
      }
    );
    const commonEnvironment = {
      ...fixture.launch.processBinding.commonEnvironment,
      SCIENCEEVOLVE_FIXED_MCP_TOKEN: fixedToken
    };
    const opened = await openBuiltinResidentAdapter({
      ...fixture.launch,
      fixedMcpToken: fixedToken,
      mcpRows: [{
        name: "ai4fusion-mcp",
        namespace: "ai4fusion-mcp",
        transport: "streamable-http",
        url: "https://118.196.152.186/mcp/ai4fusion-mcp",
        headers: { Authorization: `Bearer ${fixedToken}` }
      }],
      processBinding: {
        ...fixture.launch.processBinding,
        commonEnvironment,
        authorityEnvironment: commonEnvironment
      }
    });
    expect(adapterConfig).not.toContain(fixedToken);
    expect(adapterConfig).toContain("scienceevolve-sleep");
    if (row.id === "codex") {
      expect(adapterConfig).toContain("tool_timeout_sec = 43260");
      expect(adapterConfig).toContain('bearer_token_env_var = "SCIENCEEVOLVE_FIXED_MCP_TOKEN"');
    } else {
      expect(adapterConfig).toContain('"fixedAuthorization":true');
      expect(adapterConfig).not.toContain('"headers"');
    }
    await opened.driver.close();
  }, 30_000);

  it.each(
    (["workspace", "compute"] as const).flatMap((permission) => [
      { id: "codex", adapter: () => new CodexAdapter() },
      { id: "claude-code", adapter: () => new ClaudeCodeAdapter() },
      { id: "pi", adapter: () => new PiAdapter() },
      { id: "dsh", adapter: () => new DshAdapter() }
    ].map((adapter) => ({ ...adapter, permission })))
  )("rejects an unconfigured stdio MCP for $permission $id before resident spawn", async (row) => {
    const fixture = await createFixture(row.id, row.adapter());
    const input = await highLevelInput(fixture, async () => undefined);
    const sentinel = path.join(fixture.root, `external-mcp-${row.permission}-${row.id}`);
    const maliciousScript = path.join(fixture.root, "malicious-mcp.cjs");
    await fs.writeFile(
      maliciousScript,
      "require('node:fs').writeFileSync(process.argv[2], 'escaped');\n",
      { mode: 0o700 }
    );
    const config = input.request.project.agents.writer!;
    input.request = {
      ...input.request,
      permission: row.permission,
      project: {
        ...input.request.project,
        agents: {
          ...input.request.project.agents,
          writer: {
            ...config,
            permission: row.permission,
            mcpServers: []
          }
        }
      }
    };
    input.mcpRows = [{
      name: "unconfigured-stdio",
      namespace: "unconfigured-stdio",
      transport: "stdio",
      command: process.execPath,
      args: [maliciousScript, sentinel]
    }];
    const processHost = new CommonProcessHost();
    const startResident = vi.spyOn(processHost, "startResident")
      .mockRejectedValue(new Error("resident process must not start"));
    const configured = configuredAdapter(row.id, fixture.launch.executable);
    const facade = new HarnessRuntimeFacade({
      adapters: row.id === "codex" ? [configured] : [new CodexAdapter(), configured],
      processHost
    });
    await expect(facade.prepareAndOpenResidentScope(input)).rejects.toMatchObject({
      code: "HARNESS_CONFIGURATION_INVALID",
      message: expect.stringMatching(/explicitly selected in the Agent configuration/)
    });
    expect(startResident).not.toHaveBeenCalled();
    await expect(fs.access(sentinel)).rejects.toThrow();
  });

  it("rejects an untyped fixed-directory MCP row for a non-yolo resident", async () => {
    const fixture = await createFixture("codex", new CodexAdapter());
    const startResident = vi.spyOn(fixture.launch.processHost, "startResident")
      .mockRejectedValue(new Error("resident process must not start"));
    await expect(openBuiltinResidentAdapter({
      ...fixture.launch,
      fixedMcpToken: "fixed-resident-mcp-secret",
      mcpRows: [{
        name: "ai4fusion-mcp",
        namespace: "ai4fusion-mcp",
        transport: "streamable-http",
        url: "https://118.196.152.186/mcp/ai4fusion-mcp",
        headers: { Authorization: "Bearer fixed-resident-mcp-secret" }
      }]
    })).rejects.toThrow(/must match explicit Agent configuration/);
    expect(startResident).not.toHaveBeenCalled();
  });

  it.each([
    { id: "codex", adapter: () => new CodexAdapter() },
    { id: "claude-code", adapter: () => new ClaudeCodeAdapter() },
    { id: "pi", adapter: () => new PiAdapter() },
    { id: "dsh", adapter: () => new DshAdapter() }
  ])("keeps explicit external MCP configuration reachable for yolo $id", async (row) => {
    const fixture = await createFixture(row.id, row.adapter());
    const input = await highLevelInput(fixture, async () => undefined);
    const config = input.request.project.agents.writer!;
    input.request = {
      ...input.request,
      permission: "yolo",
      project: {
        ...input.request.project,
        agents: {
          ...input.request.project.agents,
          writer: {
            ...config,
            permission: "yolo",
            mcpServers: [{
              name: "external-http",
              url: "http://127.0.0.1:45991/external-mcp"
            }]
          }
        }
      }
    };
    input.mcpRows = [{
      name: "external-stdio",
      namespace: "external-stdio",
      transport: "stdio",
      command: "/bin/true",
      args: []
    }];
    const processHost = new CommonProcessHost();
    let launchPlan: { args: string[]; env: NodeJS.ProcessEnv } | undefined;
    const originalStart = processHost.startResident.bind(processHost);
    const startResident = vi.spyOn(processHost, "startResident")
      .mockImplementation((binding, plan, callbacks) => {
        launchPlan = { args: [...plan.args], env: { ...plan.env } };
        return originalStart(binding, plan, callbacks);
      });
    const configured = configuredAdapter(row.id, fixture.launch.executable);
    const facade = new HarnessRuntimeFacade({
      adapters: row.id === "codex" ? [configured] : [new CodexAdapter(), configured],
      processHost
    });
    const opened = await facade.prepareAndOpenResidentScope(input);
    const rendered = await residentMcpLaunchConfiguration(
      row.id,
      fixture.executionRuntime,
      launchPlan!
    );
    expect(startResident).toHaveBeenCalledOnce();
    expect(opened.evidence.rawTools).toBe("trusted-yolo");
    expect(rendered).toContain("external-http");
    expect(rendered).toContain("http://127.0.0.1:45991/external-mcp");
    expect(rendered).toContain("external-stdio");
    expect(rendered).toContain("/bin/true");
    if (row.id === "codex") {
      const servers = parseToml(rendered).mcp_servers as Record<string, object>;
      expect(servers["external-stdio"]).toMatchObject({ default_tools_approval_mode: "approve" });
    }
    await facade.closeResident({
      executionId: "exec-fixture",
      harnessId: row.id,
      ownershipEpoch: 7,
      controlSeq: 1
    });
  }, 30_000);

  it.runIf(process.env.OPENFARS_NATIVE_CODEX_TESTS === "1")("opens a context list and one selected detail through the actual Codex filesystem MCP", async () => {
    const fixture = await createFixture("codex", new CodexAdapter());
    const sources = new AgentContextSources();
    sources.list("selected-evidence", "Available evidence records", [
      { id: "unneeded", status: "historical", output: "UNNEEDED_HISTORY_BODY".repeat(10_000) },
      ...Array.from({ length: 64 }, (_, index) => ({ id: `unused-${index}`, status: "historical", output: `UNREQUESTED_DETAIL_${index}` })),
      { id: "chosen", status: "ready", output: "ON_DEMAND_SELECTED_CONTENT" }
    ]);
    const index = (await publishAgentContextIndex(fixture.launch.spec.inputs.inboxPath, sources.sources))!;
    const rootId = "read-fixture0000000";
    const indexRelative = path.relative(fixture.root, index.indexPath).split(path.sep).join("/");
    const directory = path.relative(fixture.root, path.dirname(fixture.launch.spec.inputs.inboxPath)).split(path.sep).join("/");
    const requests: Array<Record<string, any>> = [];
    let providerError: unknown;
    const findList = (value: unknown): any => {
      if (typeof value === "string") {
        const output = value.includes("\nOutput:\n") ? value.slice(value.indexOf("\nOutput:\n") + "\nOutput:\n".length) : value;
        try { return findList(JSON.parse(output)); } catch { return undefined; }
      }
      if (!value || typeof value !== "object") return undefined;
      if (Array.isArray((value as any).entries)) return value;
      for (const child of Object.values(value)) { const found = findList(child); if (found) return found; }
      return undefined;
    };
    const provider = createServer(async (request, response) => {
      try {
        const chunks = []; for await (const chunk of request) chunks.push(chunk);
        const raw = Buffer.concat(chunks);
        const body = JSON.parse((request.headers["content-encoding"] === "zstd" ? zstdDecompressSync(raw) : raw).toString());
        requests.push(body);
        const n = requests.length;
        if (n === 1) {
          const input = JSON.stringify(body.input);
          if (!input.includes("Context index:")) throw new Error("Initial input omitted the complete context directory");
          if (input.includes("UNNEEDED_HISTORY_BODY") || input.includes("UNREQUESTED_DETAIL_")) throw new Error("Initial input included historical detail bodies");
          if (Array.from({ length: 64 }, (_, index) => `unused-${index}`).every(id => input.includes(id))) throw new Error("Initial input repeated the entire historical index");
          if (!input.includes('chosen')) throw new Error("Initial native index hid the chosen entry");
        }
        const namespace = body.tools.find((tool: any) => tool.type === "namespace" && tool.name === "mcp__openfars_filesystem_authority");
        const name = namespace?.tools.find((tool: any) => tool.name === "read_file")?.name
          ?? body.tools.find((tool: any) => tool.name?.endsWith("read_file"))?.name;
        if (!name) throw new Error("Native filesystem read_file tool missing");
        let selectedPath = indexRelative;
        if (n === 2 || n === 3) {
          const returned = [...body.input].reverse().find((item: any) => item.type === "function_call_output");
          const list = findList(returned);
          if (!list) throw new Error("Native file output did not contain the requested list");
          if (n === 3 && (list.entries.length !== 66 || list.entries.at(-1)?.id !== "chosen" ||
            Array.from({ length: 64 }, (_, index) => `unused-${index}`).some(id => !list.entries.some((entry: any) => entry.id === id))))
            throw new Error("The first source index read hid later entries");
          selectedPath = path.posix.join(directory, n === 2
            ? list.entries.find((entry: any) => entry.key === "selected-evidence").list.path
            : list.entries.find((entry: any) => entry.id === "chosen").detail.path);
        }
        const final = n === 4;
        if (n > 4) throw new Error("Native read unexpectedly repeated");
        if (final && !JSON.stringify(body.input).includes("ON_DEMAND_SELECTED_CONTENT")) throw new Error("Selected detail never reached the native model input");
        response.writeHead(200, { "content-type": "text/event-stream" });
        const send = (event: Record<string, unknown>) => response.write(`data: ${JSON.stringify(event)}\n\n`);
        const id = `resp_context_${n}`;
        const args = JSON.stringify({ rootId, path: selectedPath, maxBytes: 65536 });
        const item = final
          ? { id: "msg_context", type: "message", role: "assistant", status: "completed", content: [{ type: "output_text", text: "selected evidence received", annotations: [] }] }
          : { id: `fc_context_${n}`, type: "function_call", call_id: `call_context_${n}`, name,
              ...(namespace ? { namespace: namespace.name } : {}), arguments: args, status: "completed" };
        send({ type: "response.created", response: { id, object: "response", status: "in_progress", output: [] } });
        send({ type: "response.output_item.added", output_index: 0, item: final ? { ...item, content: [] } : { ...item, arguments: "" } });
        if (final) send({ type: "response.output_text.delta", output_index: 0, content_index: 0, item_id: item.id, delta: "selected evidence received" });
        else send({ type: "response.function_call_arguments.delta", output_index: 0, item_id: item.id, delta: args });
        send({ type: "response.output_item.done", output_index: 0, item });
        send({ type: "response.completed", response: { id, object: "response", status: "completed", output: [item], usage: { input_tokens: 100, output_tokens: 10, total_tokens: 110 } } });
        response.end();
      } catch (error) { providerError ??= error; response.writeHead(400).end(String(error)); }
    });
    await new Promise<void>(resolve => provider.listen(0, "127.0.0.1", resolve));
    const route = { baseUrl: `http://127.0.0.1:${(provider.address() as { port: number }).port}/v1`, token: "local-context-fixture" };
    const environment = { ...fixture.launch.processBinding.commonEnvironment,
      OPENAI_BASE_URL: route.baseUrl, OPENAI_API_KEY: route.token, SCIENCEEVOLVE_GATEWAY_API_KEY: route.token };
    let opened: Awaited<ReturnType<typeof openBuiltinResidentAdapter>> | undefined;
    try {
      opened = await openBuiltinResidentAdapter({ ...fixture.launch,
        executable: path.resolve("../harness/codex/node_modules/.bin/codex"), launchRoute: route,
        processBinding: { ...fixture.launch.processBinding, route, commonEnvironment: environment, authorityEnvironment: environment } });
      const prompt = `${index.preview}\n${filesystemAuthorityPrompt(fixture.launch.filesystemAuthority, { ...fixture.launch.spec.inputs, contextIndex: index })}\nRead the selected-evidence list and chosen detail, then return its result.`;
      const result = await opened.driver.submit({ inputId: "indexed-evidence", invocationId: "indexed-evidence-inv", prompt, route, controlCapability: "fixture-control" });
      expect(providerError).toBeUndefined(); expect(result.handoff).toBe("selected evidence received"); expect(requests).toHaveLength(4);
      expect(JSON.stringify(requests[0].input)).not.toContain("ON_DEMAND_SELECTED_CONTENT");
      expect(JSON.stringify(requests)).not.toContain("UNNEEDED_HISTORY_BODY");
    } catch (error) {
      throw new Error(`Native context fixture: ${JSON.stringify({ providerError: String(providerError ?? ""), requests: requests.length,
        returned: requests.slice(1, 4).map(body => [...(body.input ?? [])].reverse().find((item: any) => item.type === "function_call_output")?.output),
        tools: requests[0]?.tools?.map((tool: any) => ({ name: tool.name, type: tool.type, tools: tool.tools?.map((child: any) => child.name) })) })}`, { cause: error });
    } finally { await opened?.driver.forceClose(); await closeTestServer(provider); }
  }, 60_000);

  it.runIf(process.env.OPENFARS_NATIVE_CODEX_TESTS === "1").each(["selected-write", "internal-finish", "unannotated-finish"] as const)(
    "runs the authorized %s MCP tool without human approval through real installed Codex", async mode => {
    const fixture = await createFixture("codex", new CodexAdapter());
    const internal = mode !== "selected-write";
    const serverName = internal ? "openfars-resident-control" : "selected-fixture";
    const namespaceName = `mcp__${serverName.replaceAll("-", "_")}`;
    const toolName = internal ? "finish_task" : "write_marker";
    const marker = path.join(fixture.workspace, "native-mcp-marker.txt");
    let calls = 0;
    const mcp = createServer(async (request, response) => {
      if (request.method !== "POST") { response.writeHead(405).end(); return; }
      const chunks = []; for await (const chunk of request) chunks.push(chunk);
      const rpc = JSON.parse(Buffer.concat(chunks).toString());
      if (rpc.id === undefined) { response.writeHead(202).end(); return; }
      let result;
      if (rpc.method === "initialize") result = { protocolVersion: "2024-11-05", capabilities: { tools: {} }, serverInfo: { name: "selected-fixture", version: "1" } };
      else if (rpc.method === "tools/list") result = { tools: [{ name: toolName, description: "Record the authorized fixture completion",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
        ...(mode === "unannotated-finish" ? {} : { annotations: { readOnlyHint: false,
          destructiveHint: !internal, openWorldHint: false } }) }] };
      else if (rpc.method === "tools/call") {
        calls += 1; await fs.writeFile(marker, "actual native MCP invocation");
        result = { content: [{ type: "text", text: "selected-marker-written" }] };
      } else result = {};
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ jsonrpc: "2.0", id: rpc.id, result }));
    });
    const requests: Array<Record<string, unknown>> = [];
    let providerError: unknown;
    const provider = createServer(async (request, response) => {
      try {
        const chunks = []; for await (const chunk of request) chunks.push(chunk);
        const raw = Buffer.concat(chunks);
        const body = JSON.parse((request.headers["content-encoding"] === "zstd" ? zstdDecompressSync(raw) : raw).toString());
        requests.push(body);
        const namespace = body.tools.find((tool: { type: string; name?: string }) => tool.type === "namespace" && tool.name === namespaceName);
        const name = namespace?.tools.find((tool: { name: string }) => tool.name === toolName)?.name
          ?? body.tools.find((tool: { name?: string }) => tool.name?.endsWith(toolName))?.name;
        if (!name) throw new Error("Selected MCP write tool missing from native request");
        response.writeHead(200, { "content-type": "text/event-stream" });
        const send = (event: Record<string, unknown>) => response.write(`data: ${JSON.stringify(event)}\n\n`);
        const id = `resp_fixture_${requests.length}`;
        send({ type: "response.created", response: { id, object: "response", status: "in_progress", output: [] } });
        const first = requests.length === 1;
        const item = first ? { id: "fc_fixture", type: "function_call", call_id: "call_selected", name,
          ...(namespace ? { namespace: namespace.name } : {}), arguments: "{}", status: "completed" }
          : { id: "msg_fixture", type: "message", role: "assistant", status: "completed", content: [{ type: "output_text", text: "native-selected-mcp-complete", annotations: [] }] };
        send({ type: "response.output_item.added", output_index: 0, item: first ? { ...item, arguments: "" } : { ...item, content: [] } });
        if (first) send({ type: "response.function_call_arguments.delta", output_index: 0, item_id: item.id, delta: "{}" });
        else send({ type: "response.output_text.delta", output_index: 0, content_index: 0, item_id: item.id, delta: "native-selected-mcp-complete" });
        send({ type: "response.output_item.done", output_index: 0, item });
        send({ type: "response.completed", response: { id, object: "response", status: "completed", output: [item], usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 } } });
        response.end();
      } catch (error) { providerError = error; response.writeHead(500).end(String(error)); }
    });
    await Promise.all([mcp, provider].map(server => new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve))));
    const mcpUrl = `http://127.0.0.1:${(mcp.address() as { port: number }).port}/mcp`;
    const route = { baseUrl: `http://127.0.0.1:${(provider.address() as { port: number }).port}/v1`, token: "local-fixture-only" };
    const environment = { ...fixture.launch.processBinding.commonEnvironment,
      OPENAI_BASE_URL: route.baseUrl, OPENAI_API_KEY: route.token, SCIENCEEVOLVE_GATEWAY_API_KEY: route.token };
    fixture.launch.spec.policy.mcpServers = internal ? [] : [{ name: serverName, url: mcpUrl }];
    const proxy = `import readline from 'node:readline';
      readline.createInterface({input:process.stdin}).on('line',async line=>{
        const rpc=JSON.parse(line),res=await fetch(${JSON.stringify(mcpUrl)},{method:'POST',headers:{'content-type':'application/json'},body:line});
        if(rpc.id!==undefined)process.stdout.write(await res.text()+'\\n');
      });`;
    const frames: unknown[] = [];
    let opened: Awaited<ReturnType<typeof openBuiltinResidentAdapter>> | undefined;
    try {
      opened = await openBuiltinResidentAdapter({ ...fixture.launch,
        request: { ...fixture.launch.request, ...(internal ? { control: {} as never } : {}) },
        executable: path.resolve("../harness/codex/node_modules/.bin/codex"), launchRoute: route,
        processBinding: { ...fixture.launch.processBinding, route, commonEnvironment: environment, authorityEnvironment: environment },
        mcpRows: internal ? [] : [{ name: serverName, namespace: serverName, transport: "streamable-http", url: mcpUrl }],
        ...(internal ? { controlMcp: { row: { name: serverName, namespace: serverName, transport: "stdio" as const,
          command: process.execPath, args: ["--input-type=module", "-e", proxy] },
          turnAuthority: fixture.launch.turnAuthority, assertReady: async () => {} } } : {}),
        onFrame: async frame => { frames.push(frame); }, inactivityPolicy: { modelTimeoutMs: 20_000, toolTimeoutMs: 20_000 } });
      const result = await opened.driver.submit({ inputId: "selected-mcp-turn", invocationId: "selected-mcp-inv",
        prompt: "Call the selected fixture tool once, then return its result.", route, controlCapability: "fixture-control" });
      expect(providerError).toBeUndefined();
      expect(calls, JSON.stringify({ frames, inputs: requests.map(request => request.input) })).toBe(1);
      expect(await fs.readFile(marker, "utf8")).toBe("actual native MCP invocation");
      expect(JSON.stringify(requests.at(-1)?.input)).toContain("selected-marker-written");
      expect(result.handoff).toBe("native-selected-mcp-complete");
    } catch (error) {
      throw new Error(`Native fixture: ${JSON.stringify({ providerError: String(providerError ?? ""), requests: requests.length, frames: frames.slice(-10) })}`, { cause: error });
    } finally {
      if (opened) {
        await opened.driver.close().catch(() => opened!.driver.forceClose());
        expect((await opened.driver.probe()).alive).toBe(false);
      }
      await Promise.all([closeTestServer(mcp), closeTestServer(provider)]);
    }
  }, 60_000);

  it("approves the trusted Codex filesystem broker and explicitly selected MCP capabilities", async () => {
    const fixture = await createFixture("codex", new CodexAdapter());
    const selected = { name: "selected-fixture", url: "http://127.0.0.1:45991/mcp" };
    fixture.launch.spec.policy.mcpServers = [selected];
    let adapterConfig = "";
    const original = fixture.launch.processHost.startResident.bind(fixture.launch.processHost);
    vi.spyOn(fixture.launch.processHost, "startResident").mockImplementation(
      (binding, plan, callbacks) => {
        adapterConfig = plan.args.find((argument) => argument.startsWith("mcp_servers=")) ?? "";
        return original(binding, plan, callbacks);
      }
    );
    const controlMcp = {
      row: {
        name: "openfars-resident-control",
        namespace: "openfars-resident-control",
        transport: "stdio" as const,
        command: "/bin/true",
        args: []
      },
      turnAuthority: fixture.launch.turnAuthority,
      assertReady: vi.fn(async () => undefined)
    };
    const opened = await openBuiltinResidentAdapter({
      ...fixture.launch,
      request: { ...fixture.launch.request, control: {} as never },
      mcpRows: [{ ...selected, namespace: selected.name, transport: "streamable-http" }],
      controlMcp
    });

    expect(controlMcp.assertReady).toHaveBeenCalledOnce();
    expect(adapterConfig).toContain('"openfars-filesystem-authority" = {');
    expect(adapterConfig).toContain('"openfars-resident-control" = {');
    expect(adapterConfig.match(/default_tools_approval_mode = "approve"/g)).toHaveLength(4);
    expect(adapterConfig).toContain('"selected-fixture" = { url = "http://127.0.0.1:45991/mcp", default_tools_approval_mode = "approve" }');
    const filesystemEntry = adapterConfig.slice(
      adapterConfig.indexOf('"openfars-filesystem-authority"'),
      adapterConfig.indexOf('"openfars-resident-control"')
    );
    const controlEntry = adapterConfig.slice(adapterConfig.indexOf('"openfars-resident-control"'));
    expect(filesystemEntry).toContain('default_tools_approval_mode = "approve"');
    expect(controlEntry).toContain('default_tools_approval_mode = "approve"');
    await opened.driver.close();
  }, 30_000);

  it("preauthorizes injected Codex web tools with their own invocation credential", async () => {
    const fixture = await createFixture("codex", new CodexAdapter());
    fixture.launch.spec.policy.webSearch = true;
    const adapter = Object.create(fixture.launch.adapter) as HarnessAdapter;
    Object.defineProperty(adapter, "descriptor", { value: { ...fixture.launch.adapter.descriptor,
      route: { ...fixture.launch.adapter.descriptor.route, webSearchMcp: true } } });
    const launch = vi.spyOn(fixture.launch.processHost, "startResident");
    const opened = await openBuiltinResidentAdapter({ ...fixture.launch, adapter, fixedMcpToken: "different-fixed-mcp-token" });
    try {
      const config = launch.mock.calls[0][1].args.find(arg => arg.startsWith("mcp_servers="))!;
      expect(config).toContain(`"openfars-web" = { url = "${fixture.launch.launchRoute.baseUrl}/web-mcp", bearer_token_env_var = "SCIENCEEVOLVE_GATEWAY_API_KEY", default_tools_approval_mode = "approve" }`);
      expect(config).not.toContain(fixture.launch.launchRoute.token);
      expect(config).not.toContain("different-fixed-mcp-token");
    } finally { await opened.driver.close(); }
  }, 30_000);

  it.each([true, false])("approves the resident SII server only for the trusted invocation URL (trusted=%s)", async trusted => {
    const fixture = await createFixture("codex", new CodexAdapter());
    let config = "";
    const original = fixture.launch.processHost.startResident.bind(fixture.launch.processHost);
    vi.spyOn(fixture.launch.processHost, "startResident").mockImplementation((binding, plan, callbacks) => {
      config = plan.args.find(argument => argument.startsWith("mcp_servers=")) ?? "";
      return original(binding, plan, callbacks);
    });
    const url = "http://127.0.0.1:49111/sii/trusted-test";
    fixture.launch.spec.policy.mcpServers = [{ name: "scienceevolve-sii", url }];
    const opened = await openBuiltinResidentAdapter({ ...fixture.launch,
      request: { ...fixture.launch.request, siiMcp: { url: trusted ? url : "http://127.0.0.1:49111/sii/other-binding" } },
      mcpRows: [{ name: "scienceevolve-sii", namespace: "scienceevolve-sii", transport: "streamable-http", url }] });
    try {
      expect(config.match(/default_tools_approval_mode = "approve"/g)).toHaveLength(trusted ? 3 : 2);
    } finally { await opened.driver.close(); }
  }, 30_000);

  it("fails closed when a non-yolo launch omits the descriptor broker", async () => {
    const fixture = await createFixture("pi", new PiAdapter());
    await expect(openBuiltinResidentAdapter({
      ...fixture.launch,
      filesystemMcp: undefined
    })).rejects.toThrow(/descriptor filesystem broker/);
  });

  it.each([false, true])("launches fixed v3 management with proposal authority %s", async (editable) => {
    const fixture = await createFixture("pi", new PiAdapter(), "leader", "workspace", true);
    if (editable) {
      const proposalRoot = path.join(path.dirname(fixture.launch.spec.inputs.inboxPath), "proposal");
      await fs.mkdir(proposalRoot);
      const workflowAuthoringPath = path.join(proposalRoot, "workflow.json");
      await fs.writeFile(workflowAuthoringPath, "{}\n");
      fixture.launch.spec.inputs.workflowAuthoringPath = workflowAuthoringPath;
      fixture.launch.filesystemAuthority.writeRoots = [proposalRoot];
      fixture.launch.filesystemAuthority.rootBindings = [
        ...fixture.launch.filesystemAuthority.rootBindings,
        { id: "write-proposal0000000", path: proposalRoot, write: true }
      ];
      fixture.launch.filesystemMcp = await prepareFilesystemAuthorityMcp({
        authority: fixture.launch.filesystemAuthority, executionRuntimePath: fixture.executionRuntime
      });
    }
    const opened = await openBuiltinResidentAdapter(fixture.launch);
    expect(opened.evidence.cwd).toBe(fixture.workspace);
    await opened.driver.close();
  });

  it("validates shared authority before invoking an adapter-owned resident launch", async () => {
    const fixture = await createFixture("pi", new PiAdapter());
    const buildLaunch = vi.fn(async () => { throw new Error("extension launch reached"); });
    const adapter: HarnessAdapter = {
      ...fixture.launch.adapter,
      descriptor: { ...fixture.launch.adapter.descriptor, id: "fixture-extension" },
      resident: { ...fixture.launch.adapter.resident!, buildLaunch }
    };
    await expect(openBuiltinResidentAdapter({ ...fixture.launch, adapter,
      spec: { ...fixture.launch.spec, inputs: { ...fixture.launch.spec.inputs, workspacePath: fixture.root } }
    })).rejects.toThrow(/workspace does not match execution ownership/);
    expect(buildLaunch).not.toHaveBeenCalled();
    await expect(openBuiltinResidentAdapter({ ...fixture.launch, adapter })).rejects.toThrow("extension launch reached");
    expect(buildLaunch).toHaveBeenCalledOnce();
  });

  it("rejects fixed management with delivery writes or another invocation snapshot", async () => {
    const fixture = await createFixture("pi", new PiAdapter(), "leader", "workspace", true);
    await expect(openBuiltinResidentAdapter({ ...fixture.launch,
      filesystemAuthority: { ...fixture.launch.filesystemAuthority, writeRoots: [fixture.workspace] }
    })).rejects.toThrow(/delivery write or Git authority/);
    await expect(openBuiltinResidentAdapter({ ...fixture.launch,
      spec: { ...fixture.launch.spec, invocationId: "another-turn" }
    })).rejects.toThrow(/validate staged purpose inputs/);
  });

  it.each(["codex", "claude-code", "pi", "dsh"])("opens the %s management Harness with its exact retained proposal through the public facade", async (harnessId) => {
    const configured = configuredAdapter(harnessId, "unused");
    const fixture = await createFixture(harnessId, configured, "leader", "workspace", true);
    const proposalRoot = path.join(fixture.workspace, ".scienceevolve", "management", "original-turn", "proposal");
    const workflowAuthoringPath = path.join(proposalRoot, "workflow.json");
    await fs.mkdir(proposalRoot, { recursive: true });
    await fs.writeFile(workflowAuthoringPath, '{"unfinishedAgentEdit":true}\n');
    const inputs = { ...fixture.launch.spec.inputs, workflowAuthoringPath, workflowAuthoringInvocationId: "original-turn" };
    const input = await highLevelInput(fixture, async () => undefined);
    input.request = { ...input.request, inboxPath: inputs.inboxPath, runtimePath: inputs.runtimePath };
    input.inputs = inputs;
    const adapter = configuredAdapter(harnessId, fixture.launch.executable);
    const facade = new HarnessRuntimeFacade({ adapters: harnessId === "codex" ? [adapter] : [new CodexAdapter(), adapter] });
    const prepared = await facade.prepareResidentScope(input);
    expect(prepared.spec.inputs).toMatchObject({ workflowAuthoringPath, workflowAuthoringInvocationId: "original-turn",
      inboxPath: inputs.inboxPath, memoryPath: inputs.memoryPath });
    expect(prepared.filesystemAuthority).toMatchObject({ writeRoots: [proposalRoot], gitCapability: "none", rawTools: "forbidden" });
    const opened = await facade.openResidentScope(prepared);
    try {
      expect(opened.evidence.cwd).toBe(fixture.workspace);
      expect(await fs.readFile(workflowAuthoringPath, "utf8")).toBe('{"unfinishedAgentEdit":true}\n');
    } finally { await facade.closeResident({ executionId: opened.lease.executionId, harnessId,
      ownershipEpoch: opened.lease.ownershipEpoch, controlSeq: 1 }); }
  }, 30_000);

  it("does not treat a control namespace string as a live rotating broker", async () => {
    const fixture = await createFixture("pi", new PiAdapter());
    await expect(openBuiltinResidentAdapter({
      ...fixture.launch,
      request: { ...fixture.launch.request, control: {} as never },
      mcpRows: [{
        name: "fake-control",
        namespace: "openfars-resident-control",
        transport: "stdio",
        command: "/bin/true",
        args: []
      }]
    })).rejects.toThrow(/Reserved resident MCP namespaces/);
    await expect(openBuiltinResidentAdapter({
      ...fixture.launch,
      request: { ...fixture.launch.request, control: {} as never }
    })).rejects.toThrow(/trusted turn-rotating stable control broker/);
  });

  it("binds the stable control row to the exact live turn-authority broker", async () => {
    const fixture = await createFixture("pi", new PiAdapter());
    const assertReady = vi.fn(async () => undefined);
    const controlMcp = {
      row: {
        name: "openfars-resident-control",
        namespace: "openfars-resident-control",
        transport: "stdio" as const,
        command: "/bin/true",
        args: []
      },
      turnAuthority: fixture.launch.turnAuthority,
      assertReady
    };
    const opened = await openBuiltinResidentAdapter({
      ...fixture.launch,
      request: { ...fixture.launch.request, control: {} as never },
      controlMcp
    });
    expect(assertReady).toHaveBeenCalledOnce();
    await opened.driver.close();
    await expect(openBuiltinResidentAdapter({
      ...fixture.launch,
      request: { ...fixture.launch.request, control: {} as never },
      controlMcp: {
        ...controlMcp,
        turnAuthority: { activate: fixture.launch.turnAuthority.activate }
      }
    })).rejects.toThrow(/trusted turn-rotating stable control broker/);
  });

  it.each([
    { id: "codex", adapter: () => new CodexAdapter() },
    { id: "claude-code", adapter: () => new ClaudeCodeAdapter() },
    { id: "pi", adapter: () => new PiAdapter() },
    { id: "dsh", adapter: () => new DshAdapter() }
  ])("launches a read-only $id leader with configured Skill, Web, and MCP", async (row) => {
    const fixture = await createFixture(row.id, row.adapter(), "leader");
    const skillPath = "/configured/readonly-evidence/SKILL.md";
    const configuredMcp = {
      name: "readonly-evidence",
      url: "https://evidence.example.invalid/mcp"
    };
    const sourceConfig = fixture.launch.request.project.agents.writer!;
    const request = {
      ...fixture.launch.request,
      project: {
        ...fixture.launch.request.project,
        agents: { writer: {
          ...sourceConfig,
          skills: [skillPath],
          autoSkills: [],
          mcpServers: [configuredMcp],
          webSearch: true
        } }
      }
    };
    const spec = {
      ...fixture.launch.spec,
      prompt: `Read and follow ${skillPath}`,
      policy: {
        ...fixture.launch.spec.policy,
        skillPaths: [skillPath],
        mcpServers: [configuredMcp],
        webSearch: true
      }
    };
    let launchPlan: { args: string[]; env: NodeJS.ProcessEnv } | undefined;
    const originalStart = fixture.launch.processHost.startResident
      .bind(fixture.launch.processHost);
    vi.spyOn(fixture.launch.processHost, "startResident")
      .mockImplementation((binding, plan, callbacks) => {
        launchPlan = { args: [...plan.args], env: { ...plan.env } };
        return originalStart(binding, plan, callbacks);
      });
    const opened = await openBuiltinResidentAdapter({
      ...fixture.launch,
      request,
      spec,
      mcpRows: [{
        name: configuredMcp.name,
        namespace: configuredMcp.name,
        transport: "streamable-http",
        url: configuredMcp.url
      }]
    });
    const identity = structuredClone(opened.driver.identity);
    await expect(opened.driver.submit(turn(1))).resolves.toMatchObject({
      handoff: expect.stringContaining("-1")
    });
    expect((await opened.driver.probe())).toMatchObject({ alive: true, identity });
    const rendered = await residentMcpLaunchConfiguration(
      row.id,
      fixture.executionRuntime,
      launchPlan!
    );
    expect(rendered).toContain("readonly-evidence");
    expect(rendered).toContain("openfars-filesystem-authority");
    if (row.id === "codex") {
      expect(launchPlan?.args).toContain("--search");
      expect(launchPlan?.args.join(" ")).toContain(skillPath);
    } else if (row.id === "claude-code") {
      const toolsIndex = launchPlan!.args.indexOf("--tools");
      expect(launchPlan!.args[toolsIndex + 1]).toContain("WebSearch");
      expect(launchPlan!.args[toolsIndex + 1]).toContain("WebFetch");
    } else {
      expect(rendered).toContain("openfars-web");
      if (row.id === "pi") expect(launchPlan?.args).toContain(skillPath);
    }
    expect(fixture.launch.filesystemAuthority).toMatchObject({
      writeRoots: [], gitCapability: "none", rawTools: "forbidden"
    });
    expect(fixture.launch.processBinding.authorityEnvironment).toMatchObject({
      SCIENCEEVOLVE_RESIDENT_ROLE: "leader",
      SCIENCEEVOLVE_COORDINATOR_EPOCH: "11"
    });
    expect(fixture.launch.processBinding.authorityEnvironment.SCIENCEEVOLVE_EXECUTION_ID).toBeUndefined();
    expect(fixture.launch.processBinding.commonEnvironment.SCIENCEEVOLVE_INVOCATION_ID).toBeUndefined();
    await opened.driver.close();
  }, 30_000);

  it("prepares configured leader capabilities without granting delivery authority", async () => {
    const fixture = await createFixture("pi", new PiAdapter(), "leader");
    const inboxPath = path.join(fixture.workspace, "turn-one-Inbox.md");
    const memoryPath = path.join(fixture.workspace, "Memory.md");
    const fixedSkill = path.join(fixture.root, "skills", "fixed", "SKILL.md");
    const automaticSkill = path.join(fixture.root, "skills", "automatic", "SKILL.md");
    await Promise.all([
      fs.mkdir(path.dirname(fixedSkill), { recursive: true }),
      fs.mkdir(path.dirname(automaticSkill), { recursive: true }),
      fs.writeFile(inboxPath, "leader management snapshot\n", { mode: 0o600 }),
      fs.writeFile(memoryPath, "leader memory snapshot\n", { mode: 0o600 })
    ]);
    await Promise.all([
      fs.writeFile(fixedSkill, "# Fixed read-only evidence skill\n", { mode: 0o600 }),
      fs.writeFile(automaticSkill, "# Automatic read-only evidence skill\n", { mode: 0o600 })
    ]);
    const source = fixture.launch.request;
    const sourceConfig = source.project.agents.writer!;
    const request = {
      ...source,
      project: {
        ...source.project,
        agents: { writer: {
          ...sourceConfig,
          skills: [fixedSkill],
          autoSkills: [automaticSkill],
          instructions: "Coordinate only.",
          permission: "workspace",
          sessionPersistence: false,
          decisionBy: "main",
          webSearch: true,
          mcpServers: [{ name: "readonly-evidence", url: "http://127.0.0.1:49997/mcp" }]
        } }
      },
      inboxPath,
      runtimePath: fixture.executionRuntime,
      skillPaths: [fixedSkill],
      autoSkillPaths: [automaticSkill],
      availableSkillPaths: [fixedSkill, automaticSkill]
    } as unknown as AgentRunRequest;
    const facade = new HarnessRuntimeFacade({
      adapters: [
        new CodexAdapter(),
        new PiAdapter({ harnessExecutables: { pi: fixture.launch.executable } })
      ]
    });
    const traces: Array<{ message: string; data?: Record<string, unknown> }> = [];
    const base: PrepareResidentScopeRequest = {
      request,
      inputs: {
        projectPath: fixture.projectPath,
        workspacePath: fixture.workspace,
        inboxPath,
        memoryPath,
        runtimePath: fixture.executionRuntime,
        inboxSha256: "ignored"
      },
      launchRoute: fixture.launch.launchRoute,
      filesystemAuthorityInput: {
        serviceUserRoot: fixture.root,
        protectedRoots: [fixture.executionRuntime]
      },
      executionRuntimePath: fixture.executionRuntime,
      turnAuthority: fixture.launch.turnAuthority,
      signal: fixture.launch.signal,
      onTrace: async (_kind, message, data) => { traces.push({ message, data }); }
    };
    const prepared = await facade.prepareResidentScope(base);
    expect(prepared.spec.policy.skillPaths).toHaveLength(1);
    expect(prepared.spec.policy.autoSkillPaths).toHaveLength(1);
    expect(prepared.spec.policy).toMatchObject({
      mcpServers: [{ name: "readonly-evidence", url: "http://127.0.0.1:49997/mcp" }],
      webSearch: true
    });
    expect(prepared.spec.policy.skillPaths[0]).toContain(fixture.workspace);
    expect(prepared.spec.policy.autoSkillPaths[0]).toContain(fixture.workspace);
    expect(prepared.mcpRows).toEqual([expect.objectContaining({
      name: "readonly-evidence",
      transport: "streamable-http"
    })]);
    expect(prepared.filesystemMcp).toBeDefined();
    expect(prepared.filesystemAuthority).toMatchObject({
      writeRoots: [], gitCapability: "none", rawTools: "forbidden"
    });
    expect(prepared.spec.prompt).toContain("leader management snapshot");
    expect(await fs.readFile(prepared.spec.inputs.inboxPath, "utf8")).toContain("leader management snapshot");
    expect(await fs.readFile(prepared.spec.policy.skillPaths[0], "utf8")).toContain("Fixed read-only evidence skill");
    expect(prepared.spec.prompt).not.toContain("Web Search is enabled");
    expect(traces).toContainEqual(expect.objectContaining({
      message: "Compiled invocation capability policy",
      data: expect.objectContaining({
        eventType: "invocation.capabilities",
        effectiveCapabilities: expect.objectContaining({
          mcpServers: ["readonly-evidence"],
          webSearch: true,
          filesystem: "management-read-only",
          gitMutation: false
        }),
        deniedCapabilities: expect.arrayContaining([
          { capability: "delivery-worktree-write", reason: "management-role-read-only" },
          { capability: "git-mutation", reason: "management-role-read-only" }
        ])
      })
    }));
    await expect(facade.prepareResidentScope({
      ...base,
      mcpRows: [{
        name: "delivery-extra",
        namespace: "delivery-extra",
        transport: "streamable-http",
        url: "http://127.0.0.1:49996/mcp"
      }]
    })).rejects.toThrow(/Leader resident cannot receive delivery MCP rows/);
  });

  it("wires the resident lifecycle through HarnessRuntimeFacade while one-shot fails closed", async () => {
    const fixture = await createFixture("pi", new PiAdapter());
    const executable = fixture.launch.executable;
    const adapter = new PiAdapter({ harnessExecutables: { pi: executable } });
    const facade = new HarnessRuntimeFacade({ adapters: [new CodexAdapter(), adapter] });
    const published: Array<{ session: SessionRef; legacyId: string }> = [];
    const input = await highLevelInput(fixture, async (session, legacyId) => {
      published.push({ session, legacyId });
    });
    const memoryPath = path.join(fixture.workspace, "agent-memory", "writer", "Memory.md");
    await expect(fs.access(memoryPath)).rejects.toThrow();
    const opened = await facade.prepareAndOpenResidentScope(input);
    expect(published).toHaveLength(1);
    expect(published[0]).toMatchObject({
      session: { nativeId: opened.lease.session.nativeId, durable: true },
      legacyId: `pi:${opened.lease.session.nativeId}`
    });
    await expect(fs.access(memoryPath)).resolves.toBeUndefined();
    const authority = (controlSeq: number) => ({
      executionId: "exec-fixture", harnessId: "pi",
      ownershipEpoch: 7, controlSeq
    });
    const first = await facade.submitResidentTurn(
      authority(1),
      turn(1),
      { ...input.request, invocationId: "inv-1" }
    );
    expect(first.lease).toMatchObject({ state: "waiting", pid: opened.lease.pid });
    await expect(facade.waitResident(authority(2))).resolves.toMatchObject({ state: "waiting" });
    await expect(facade.pauseResident(authority(3))).resolves.toMatchObject({ state: "paused" });
    await expect(facade.resumeResident(authority(4))).resolves.toMatchObject({ state: "waiting" });
    const second = await facade.submitResidentTurn(
      authority(5),
      turn(2),
      { ...input.request, invocationId: "inv-2" }
    );
    expect(second.lease.pid).toBe(opened.lease.pid);
    await expect(facade.closeResident(authority(6))).resolves.toMatchObject({ state: "stopped" });
    await expect(facade.run(
      input.request,
      async () => undefined,
      fixture.launch.signal
    )).rejects.toThrow(/resident Harness lifecycle/);
  }, 30_000);

  it("publishes Codex's initialized thread identity instead of its pending allocation", async () => {
    const fixture = await createFixture("codex", new CodexAdapter());
    const published: Array<{ session: SessionRef; legacyId: string }> = [];
    const input = await highLevelInput(fixture, async (session, legacyId) => {
      published.push({ session, legacyId });
    });
    const facade = new HarnessRuntimeFacade({
      adapters: [new CodexAdapter({
        harnessExecutables: { codex: fixture.launch.executable }
      })]
    });
    const opened = await facade.prepareAndOpenResidentScope(input);
    expect(opened.lease.session.nativeId).toBe("codex-session");
    expect(opened.lease.session.nativeId).not.toMatch(/^pending:/);
    expect(published).toEqual([{
      session: opened.lease.session,
      legacyId: "codex-session"
    }]);
    await facade.closeResident({
      executionId: "exec-fixture",
      harnessId: "codex",
      ownershipEpoch: 7,
      controlSeq: 1
    });
  }, 30_000);

  it.each((["leader", "delivery"] as const).flatMap((role) => [true, false].map((rootBinding) => ({ role, rootBinding }))))(
    "preserves the exact legacy $role role SessionRef with root binding $rootBinding", async ({ role, rootBinding }) => {
    const fixture = await createFixture("dsh", new DshAdapter(), role);
    const input = await highLevelInput(fixture, async () => undefined);
    input.request.sessionContinuity = "strict";
    input.request.project.orchestration = { schemaVersion: 2 } as never;
    const source: SessionRef = { schemaVersion: 1, harnessId: "dsh", adapterVersion: new DshAdapter().descriptor.adapterVersion,
      nativeId: "original-role-session", generation: 3, durable: true, createdAt: "2026-09-22T00:00:00.000Z" };
    const root: SessionRef = { ...source, nativeId: "different-root-session", generation: 7, createdAt: "2026-09-21T00:00:00.000Z" };
    const key = role === "leader" ? "writer::collaboration:leader:grp_fixture" : "writer::collaboration:delivery:exec-fixture";
    input.request.project.agentSessions = { ...(rootBinding ? { writer: root } : {}), [key]: source };
    input.request.project.agentSessionIds = { ...(rootBinding ? { writer: `dsh:${root.nativeId}` } : {}), [key]: `dsh:${source.nativeId}` };
    input.request.project.agentSessionMeta = { ...(rootBinding ? { writer: { generation: 7, resumeFailureCount: 0, updatedAt: root.createdAt } } : {}),
      [key]: { generation: 3, resumeFailureCount: 0, updatedAt: source.createdAt } };
    input.request.resumeThreadId = `dsh:${source.nativeId}`;
    if (role === "leader") {
      input.request.runtimePath = fixture.executionRuntime;
      input.request.inboxPath = path.join(fixture.workspace, "turn-one-Inbox.md");
      await fs.writeFile(input.request.inboxPath, "Original role assignment", { mode: 0o600 });
      await fs.writeFile(path.join(fixture.workspace, "Memory.md"), "Original role memory", { mode: 0o600 });
      input.inputs = { ...fixture.launch.spec.inputs, inboxPath: input.request.inboxPath, runtimePath: input.request.runtimePath };
    }
    const before = structuredClone(input.request.project);
    const facade = new HarnessRuntimeFacade({ adapters: [new CodexAdapter(), new DshAdapter()] });
    const prepared = await facade.prepareResidentScope(input);
    expect(prepared.session).toMatchObject({ ...source, resumedAt: expect.any(String) });
    expect(prepared.recoverySourceSessionId).toBeUndefined();
    expect(prepared.request.project.agentSessions).toEqual({ writer: source });
    expect(prepared.request.project.agentSessionIds).toEqual({ writer: `dsh:${source.nativeId}` });
    expect(prepared.request.project.agentSessionMeta?.writer.generation).toBe(3);
    expect(input.request.project).toEqual(before);
  });

  it("preserves an existing legacy DSH session without allocating a rehydrate replacement", async () => {
    const fixture = await createFixture("dsh", new DshAdapter());
    const input = await highLevelInput(fixture, async () => undefined);
    const source: SessionRef = {
      schemaVersion: 1,
      harnessId: "dsh",
      adapterVersion: new DshAdapter().descriptor.adapterVersion,
      generation: 0,
      nativeId: "committed-dsh-source",
      durable: true,
      createdAt: "2026-09-22T00:00:00.000Z"
    };
    input.request = {
      ...input.request,
      project: {
        ...input.request.project,
        agentSessions: { writer: source },
        agentSessionIds: { writer: `dsh:${source.nativeId}` }
      }
    };
    const facade = new HarnessRuntimeFacade({
      adapters: [
        new CodexAdapter(),
        new DshAdapter({ harnessExecutables: { dsh: fixture.launch.executable } })
      ]
    });
    const prepared = await facade.prepareResidentScope(input);
    expect(prepared.recoverySourceSessionId).toBeUndefined();
    expect(prepared.session).toMatchObject({
      harnessId: "dsh",
      generation: 0,
      durable: true,
      resumedAt: expect.any(String)
    });
    expect(prepared.session.nativeId).toBe(source.nativeId);
  });

  it.each([2, 3])("retains the strict v%s DSH session instead of allocating a rehydrate replacement", async (schemaVersion) => {
    const fixture = await createFixture("dsh", new DshAdapter());
    const input = await highLevelInput(fixture, async () => undefined);
    const source: SessionRef = { schemaVersion: 1, harnessId: "dsh", adapterVersion: new DshAdapter().descriptor.adapterVersion,
      generation: 0, nativeId: "fixed-v3-dsh-session", durable: true, createdAt: "2026-09-22T00:00:00.000Z" };
    input.request.sessionContinuity = "strict";
    input.request.project.orchestration = { schemaVersion } as never;
    const key = schemaVersion === 2 ? "writer::collaboration:delivery:exec-fixture" : "writer";
    input.request.project.agentSessions = { [key]: source };
    const facade = new HarnessRuntimeFacade({ adapters: [new CodexAdapter(), new DshAdapter()] });
    const prepared = await facade.prepareResidentScope(input);
    expect(prepared.session.nativeId).toBe(source.nativeId);
    expect(prepared.session.generation).toBe(0);
    expect(prepared.recoverySourceSessionId).toBeUndefined();
    expect(facade.residentRecoveryStrategy("dsh", 3)).toBe("native-session-resume");
    expect(facade.residentRecoveryStrategy("dsh", 2)).toBe("native-session-resume");
  });

  it("resumes the exact legacy DSH session from its original runtime home", async () => {
    const fixture = await createFixture("dsh", new DshAdapter());
    const session = fixture.launch.session;
    session.resumedAt = "2026-09-22T00:01:00.000Z";
    const artifact = dshSessionArtifactPath(path.join(fixture.executionRuntime, "dsh-home"), fixture.workspace, session.nativeId);
    const bytes = zstdCompressSync(Buffer.from(JSON.stringify({ type: "session", version: 1, createdAt: 1,
      id: session.nativeId, cwd: fixture.workspace }) + "\n"));
    await fs.mkdir(path.dirname(artifact), { recursive: true });
    await fs.writeFile(artifact, bytes);
    const frames: Record<string, unknown>[] = [];
    const opened = await openBuiltinResidentAdapter({ ...fixture.launch, onFrame: (frame) => { frames.push(frame); } });
    try {
      expect(opened.evidence.recoveryStrategy).toBe("native-session-resume");
      expect(opened.evidence.cwd).toBe(fixture.workspace);
      expect(opened.driver.session).toEqual(session);
      expect(opened.evidence.args).toContain(path.join(fixture.executionRuntime, "dsh-resident.patch.yml"));
      const patch = await fs.readFile(path.join(fixture.executionRuntime, "dsh-resident.patch.yml"), "utf8");
      expect(patch).toContain("dsh-sdk-resume-plugin.mjs");
      await expect(opened.driver.submit(turn(1))).resolves.toMatchObject({ handoff: "dsh-1", threadId: session.nativeId });
      const events = frames.filter((frame) => frame.method === "session.event")
        .map((frame) => (frame.params as { sessionId: string; event: { seq: number } }));
      expect(events.length).toBeGreaterThan(0);
      expect(events.every((event) => event.sessionId === session.nativeId && event.event.seq > 17)).toBe(true);
      expect(await fs.readFile(artifact)).toEqual(bytes);
    } finally { await opened.driver.close(); }
  }, 30_000);

  it.each(["missing", "workspace", "identity"] as const)("rejects a %s legacy DSH history before spawning a replacement", async (invalid) => {
    const fixture = await createFixture("dsh", new DshAdapter());
    const session = fixture.launch.session;
    session.resumedAt = "2026-09-22T00:01:00.000Z";
    const artifact = dshSessionArtifactPath(path.join(fixture.executionRuntime, "dsh-home"), fixture.workspace, session.nativeId);
    if (invalid !== "missing") {
      await fs.mkdir(path.dirname(artifact), { recursive: true });
      await fs.writeFile(artifact, zstdCompressSync(Buffer.from(JSON.stringify({ type: "session", version: 1, createdAt: 1,
        id: invalid === "identity" ? "other-session" : session.nativeId,
        cwd: invalid === "workspace" ? path.join(fixture.root, "other") : fixture.workspace }) + "\n")));
    }
    const spawn = vi.spyOn(fixture.launch.processHost, "startResident");
    await expect(openBuiltinResidentAdapter(fixture.launch)).rejects.toThrow(/DSH durable session/);
    expect(spawn).not.toHaveBeenCalled();
    if (invalid !== "missing") expect((await fs.stat(artifact)).size).toBeGreaterThan(0);
  });

  it("closes the initialized native process when durable Session publication fails", async () => {
    const fixture = await createFixture("pi", new PiAdapter());
    const executable = fixture.launch.executable;
    const processHost = new CommonProcessHost();
    let child: Awaited<ReturnType<CommonProcessHost["startResident"]>>["child"] | undefined;
    const original = processHost.startResident.bind(processHost);
    vi.spyOn(processHost, "startResident").mockImplementation(async (...args) => {
      const managed = await original(...args);
      child = managed.child;
      return managed;
    });
    const facade = new HarnessRuntimeFacade({
      adapters: [new CodexAdapter(), new PiAdapter({ harnessExecutables: { pi: executable } })],
      processHost
    });
    const input = await highLevelInput(fixture, async () => {
      throw new Error("fixture persistence failed");
    });
    await expect(facade.prepareAndOpenResidentScope(input))
      .rejects.toThrow(/fixture persistence failed/);
    expect(child).toBeDefined();
    expect(child!.exitCode !== null || child!.signalCode !== null).toBe(true);
  }, 30_000);

  it.each([
    { id: "codex", adapter: () => new CodexAdapter() },
    { id: "claude-code", adapter: () => new ClaudeCodeAdapter() },
    { id: "pi", adapter: () => new PiAdapter() },
    { id: "dsh", adapter: () => new DshAdapter() }
  ].flatMap((row) => row.id === "pi"
    ? ["workspace", "yolo"].map((permission) => ({ ...row, permission: permission as AgentPermission }))
    : [{ ...row, permission: "workspace" as AgentPermission }]))("runs the production stable-frontdoor entry for two attributed $id/$permission turns", async (row) => {
    const fixture = await createFixture(row.id, row.adapter());
    await fs.writeFile(fixture.launch.executable, fakeSource(row.id, true), { mode: 0o700 });
    if (row.id === "pi") {
      const context = fixture.launch.request.executionContext!;
      if (context.role !== "delivery") throw new Error("fixture role mismatch");
      fixture.launch.request.executionContext = {
        ...context,
        groupRunId: "grp_preclaimed",
        coordinatorEpoch: 11
      };
    }
    const processHost = new CommonProcessHost();
    let launchEnvironment: NodeJS.ProcessEnv | undefined;
    const originalStart = processHost.startResident.bind(processHost);
    vi.spyOn(processHost, "startResident").mockImplementation((binding, plan, callbacks) => {
      launchEnvironment = { ...plan.env };
      return originalStart(binding, plan, callbacks);
    });
    const configured = configuredAdapter(row.id, fixture.launch.executable);
    const facade = new HarnessRuntimeFacade({
      adapters: row.id === "codex" ? [configured] : [new CodexAdapter(), configured],
      processHost
    });
    const submittedTurns = vi.spyOn(facade, "submitResidentTurn");
    const routes: TestInvocationRoute[] = [];
    const official: Array<{ expected: string; actual: unknown; session: unknown; eventId: unknown; kind: unknown; messageLength: number }> = [];
    const nativeInputs: Array<{ message: unknown; session: unknown; eventId: unknown; invocationId: unknown }> = [];
    const longNotification = "Original result body ".repeat(2_500) + "original-result-tail-sentinel";
    const notificationInputs: Array<{ invocationId: string; inputId: string; session: SessionRef }> = [];
    let reportActivated!: () => void;
    let continueActivation!: () => void;
    const activated = new Promise<void>((resolve) => { reportActivated = resolve; });
    const activationGate = new Promise<void>((resolve) => { continueActivation = resolve; });
    const resident = new HarnessRuntimeResidentAdapter({
      runtime: facade,
      routeFactory: async (request) => {
        const route = await openTestInvocationRoute(
          configured.descriptor.nativeProtocol,
          `inner-${routes.length + 1}`
        );
        routes.push(route);
        expect(request.invocationId).toBe(`resident-inv-${routes.length}`);
        return route;
      }
    });
    const prepared = await highLevelInput(fixture, async () => undefined);
    prepared.request.project.agents.writer!.instructions = "Standing resident mandate sentinel";
    prepared.request.permission = row.permission;
    prepared.request.project.agents.writer!.permission = row.permission;
    const handle = await resident.open({
      request: prepared.request,
      executionRuntimePath: prepared.executionRuntimePath,
      filesystemAuthorityInput: prepared.filesystemAuthorityInput,
      signal: prepared.signal,
      onTrace: async () => undefined,
      turnRequestFactory: async ({ baseRequest, turn: current }) => ({
        request: {
          ...baseRequest,
          invocationId: current.invocationId,
          onPendingControlResults: (inputId, session) => {
            notificationInputs.push({ invocationId: current.invocationId, inputId, session });
            return `Original result notification for ${current.invocationId}\n${longNotification}`;
          },
          onNativeUserInput: (event: Record<string, unknown>, nativeSession?: SessionRef) => {
            nativeInputs.push({ message: event.message, session: nativeSession, eventId: event.eventId, invocationId: event.invocationId });
          },
          onOfficialHarnessEvent: (event, nativeSession) => {
            official.push({ expected: current.invocationId, actual: event.invocationId, session: nativeSession,
              eventId: event.eventId, kind: event.kind, messageLength: typeof event.message === "string" ? event.message.length : 0 });
          }
        },
        onTrace: async (_kind, message) => {
          if (current.invocationId === "resident-inv-1" &&
            message === "Resident turn authority activated") {
            reportActivated();
            await activationGate;
          }
        }
      })
    });
    expect(routes).toHaveLength(0);
    expect(launchEnvironment).toBeDefined();
    if (row.id === "pi") {
      expect(launchEnvironment!.SCIENCEEVOLVE_PI_MCP_CONFIG)
        .not.toContain("openfars-resident-control");
    }
    const stable = stableGatewayFromEnvironment(
      configured.descriptor.nativeProtocol,
      launchEnvironment!
    );
    await expect(fetch(`${stable.baseUrl}/health`)).resolves.toMatchObject({ status: 401 });
    const health = await fetch(`${stable.baseUrl}/health`, { headers: stable.headers });
    expect(health.status).toBe(200);
    expect(await health.json()).toEqual({ ok: true });
    if (row.id === "codex") {
      const models = await fetch(`${stable.baseUrl}/models`, {
        headers: { authorization: `Bearer ${stable.token}` }
      });
      expect(models.status).toBe(200);
      expect(await models.json()).toMatchObject({
        models: [expect.objectContaining({ slug: "fixture-model" })]
      });
      expect(routes).toHaveLength(0);
    }
    const idle = await fetch(stable.endpoint, {
      method: "POST",
      headers: stable.headers,
      body: "{}"
    });
    expect(idle.status).toBe(503);
    expect(routes).toHaveLength(0);

    const identity = structuredClone(handle.initialLease);
    const firstTurn = handle.submit({
      inputId: "resident-input-1",
      invocationId: "resident-inv-1",
      prompt: "first resident turn"
    });
    await activated;
    if (row.id === "codex") {
      const oversized = await fetch(stable.endpoint, {
        method: "POST",
        headers: stable.headers,
        body: Buffer.alloc(8 * 1024 * 1024 + 1)
      });
      expect(oversized.status).toBe(413);
      expect(routes[0]?.hits).toBe(0);
    }
    const active = await fetch(stable.endpoint, {
      method: "POST",
      headers: stable.headers,
      body: "{}"
    });
    expect(active.status).toBe(200);
    expect(routes[0]?.hits).toBe(1);
    continueActivation();
    await expect(firstTurn).resolves.toMatchObject({ handoff: expect.stringContaining("-1") });
    expect(routes[0]?.closed).toBe(true);
    await expect(fetch(`${routes[0]!.baseUrl}/${
      configured.descriptor.nativeProtocol === "responses"
        ? "responses"
        : configured.descriptor.nativeProtocol === "chat-completions"
          ? "chat/completions"
          : "messages"
    }`, { method: "POST", body: "{}" })).rejects.toThrow();
    await handle.resume();
    expect((await handle.probe()).state).toBe("waiting");
    await handle.pause();
    expect((await handle.probe()).state).toBe("paused");
    await handle.resume();
    await expect(handle.submit({
      inputId: "resident-input-2",
      invocationId: "resident-inv-2",
      prompt: "second resident turn"
    })).resolves.toMatchObject({ handoff: expect.stringContaining("-2") });
    expect(routes).toHaveLength(2);
    expect(submittedTurns.mock.calls[0]?.[1].prompt).toContain("first resident turn");
    expect(submittedTurns.mock.calls[1]?.[1].prompt).toContain("second resident turn");
    expect(notificationInputs).toEqual([1, 2].map(number => ({ invocationId: `resident-inv-${number}`,
      inputId: `resident-input-${number}`, session: identity.session })));
    for (const [, current] of submittedTurns.mock.calls) {
      expect(current.prompt.startsWith(`Original result notification for ${current.invocationId}`)).toBe(true);
    }
    for (const [, turn] of submittedTurns.mock.calls) {
      expect(turn.prompt).toContain("Standing resident mandate sentinel");
      expect(turn.prompt).not.toContain("resident fixture inbox");
      expect(turn.prompt).toContain("项目入口：");
      expect(turn.prompt).not.toContain("Current task Inbox:");
      expect(turn.prompt).not.toContain("Descriptor filesystem tool references");
      expect(turn.prompt).not.toContain("The openfars-filesystem-authority MCP exposes callable tools");
    }
    expect(routes.every((route) => route.closed)).toBe(true);
    expect((await handle.probe())).toMatchObject({
      pid: identity.pid,
      startTicks: identity.startTicks,
      state: "waiting"
    });
    expect(official.length).toBeGreaterThan(0);
    expect(official.every((event) => event.expected === event.actual)).toBe(true);
    for (const event of official) expect(event.session).toEqual(identity.session);
    expect(nativeInputs).toHaveLength(2);
    for (const [index, input] of nativeInputs.entries()) {
      expect(input.invocationId).toBe(`resident-inv-${index + 1}`);
      expect(input.session).toEqual(identity.session);
      expect(input.message).toContain(longNotification);
      expect(official.find(event => event.eventId === input.eventId)).toMatchObject({
        actual: input.invocationId, kind: "user.message", messageLength: 40_000 });
    }
    // A safe-point Pause can already be queued when a failed turn closes
    // its native handle. Successful close is stronger than native pause.
    await expect(Promise.all([handle.close(), handle.pause()])).resolves.toEqual([undefined, undefined]);
    await expect.poll(() => processAlive(identity.pid)).toBe(false);
    await expect(handle.resume()).rejects.toThrow(/closing or closed/);
  }, 30_000);

  it.each([false, true])("identifies a control MCP initialization timeout without losing or exposing its stderr (stderr: %s)", async (hasStderr) => {
    const fixture = await createFixture("pi", new PiAdapter());
    const prepared = await highLevelInput(fixture, async () => undefined);
    const facade = new HarnessRuntimeFacade({ adapters: [new CodexAdapter(),
      new PiAdapter({ harnessExecutables: { pi: fixture.launch.executable } })] });
    const resident = new HarnessRuntimeResidentAdapter({ runtime: facade,
      routeFactory: async () => openTestInvocationRoute("chat-completions", "control-timeout-diagnostic") });
    const capability = createHash("sha256").update(fixture.root).digest("hex");
    const command = vi.spyOn(runtimeSupport, "resolveOrchestrationControlMcpCommand").mockResolvedValue({
      command: process.execPath,
      args: ["-e", `process.stdin.on('data', () => {
        ${hasStderr ? "process.stderr.write('x'.repeat(5000) + '\\nstartup-loader-stalled; token=fixture-api-secret; raw=' + process.env.SCIENCEEVOLVE_CONTROL_CAPABILITY + '\\n');" : ""}
      });`]
    });
    expect(controlLifetime.controlRequestTimeoutMs("initialize")).toBe(10_000);
    expect(controlLifetime.controlRequestTimeoutMs("tools/call")).toBe(315_000);
    const timeout = vi.spyOn(controlLifetime, "controlRequestTimeoutMs").mockReturnValue(1_000);
    let handle: Awaited<ReturnType<HarnessRuntimeResidentAdapter["open"]>> | undefined;
    try {
      handle = await resident.open({ ...prepared,
      controlScope: { role: "execution-artifact", projectId: "prj_fixture", nodeRunId: "nr_fixture",
        executionId: "exec-fixture", agentId: "writer", ownershipEpoch: 7 },
      controlAuthorityFactory: async () => ({ control: { stagingPath: path.join(fixture.executionRuntime, "timeout-control.json"),
        capability, capabilityHash: createHash("sha256").update(capability).digest("hex"), stateVersion: 7,
        candidates: [], decisionBy: "agent", allowAgentGitActions: true, allowUserIntervention: false,
        canComplete: false, requireBridge: true }, revalidate: async () => undefined })
      });
      const error = await handle.submit({ inputId: "timeout-diagnostic-input", invocationId: "turn-one", prompt: "Inspect initialization" })
        .then(() => undefined, error => error as Error);
      expect(error).toBeInstanceOf(Error);
      expect(error!.message).toContain("resident orchestration-control MCP did not respond; diagnostics=");
      const details = JSON.parse(error!.message.split("; diagnostics=")[1]!);
      expect(details).toMatchObject({ method: "initialize", timeoutMs: 1_000, childExitCode: null,
        childSignal: null, stdoutBytes: 0, unmatchedResponses: 0 });
      expect(details.childPid).toBeGreaterThan(0);
      expect(details.elapsedMs).toBeGreaterThanOrEqual(900);
      if (hasStderr) {
        expect(details.stderrBytes).toBeGreaterThan(5_000);
        expect(details.stderr).toContain("startup-loader-stalled");
        expect(details.stderr).toContain("[REDACTED]");
        expect(details.stderr.length).toBeLessThanOrEqual(4_096);
      } else {
        expect(details.stderrBytes).toBe(0);
        expect(details.stderr).toBe("");
      }
      expect(error!.message).not.toContain("fixture-api-secret");
      expect(error!.message).not.toContain(capability);
      expect(error!.message).not.toContain("SCIENCEEVOLVE_CONTROL_CONTEXT");
      await expect.poll(() => processAlive(details.childPid)).toBe(false);
    } finally {
      try { await handle?.close(); }
      finally {
        timeout.mockRestore();
        command.mockRestore();
      }
    }
  }, 15_000);

  it.each([false, true])("serves idle worker route control without exposing its token and revokes every turn (scoped: %s)", async (scoped) => {
    const fixture = await createFixture("pi", new PiAdapter());
    const processHost = new CommonProcessHost();
    let launchEnvironment: NodeJS.ProcessEnv | undefined;
    const originalStart = processHost.startResident.bind(processHost);
    vi.spyOn(processHost, "startResident").mockImplementation((binding, plan, callbacks) => {
      launchEnvironment = { ...plan.env };
      return originalStart(binding, plan, callbacks);
    });
    const facade = new HarnessRuntimeFacade({
      adapters: [
        new CodexAdapter(),
        new PiAdapter({ harnessExecutables: { pi: fixture.launch.executable } })
      ],
      processHost
    });
    const services: ControlActionService[] = [];
    const capabilities: string[] = [];
    let routeSequence = 0;
    let allowWrongTask = false;
    let activeControl: Awaited<ReturnType<typeof openStdioRpc>> | undefined;
    let slowResult: Promise<Record<string, unknown>> | undefined;
    let operationStarted!: () => void;
    const slowStarted = new Promise<void>(resolve => { operationStarted = resolve; });
    const executeSlow = vi.fn(async (_envelope, signal: AbortSignal) => {
      operationStarted();
      await new Promise(resolve => setTimeout(resolve, 10_300));
      signal.throwIfAborted();
      return { providerNumber: 71, status: "merged", localSynchronization: "confirmed" };
    });
    const resident = new HarnessRuntimeResidentAdapter({
      runtime: facade,
      routeFactory: async () => openTestInvocationRoute(
        "chat-completions",
        `control-${++routeSequence}`
      ),
      controlServiceFactory: (options) => {
        const service = new ControlActionService(options);
        services.push(service);
        return service;
      }
    });
    const prepared = await highLevelInput(fixture, async () => undefined);
    if (scoped) {
      prepared.request.project = structuredClone(prepared.request.project);
      prepared.request.project.orchestration = { schemaVersion: 3 } as never;
      prepared.request.executionContext = { ...prepared.request.executionContext!, groupRunId: "run-G" } as never;
    }
    const handle = await resident.open({
      request: prepared.request,
      executionRuntimePath: prepared.executionRuntimePath,
      filesystemAuthorityInput: prepared.filesystemAuthorityInput,
      signal: prepared.signal,
      onTrace: async () => undefined,
      controlScope: {
        role: scoped ? "scoped-agent" : "standalone-route",
        ...(scoped ? { groupRunId: "run-G" } : {}),
        projectId: "prj_fixture",
        nodeRunId: "nr_fixture",
        executionId: "exec-fixture",
        agentId: "writer",
        ownershipEpoch: 7,
        candidates: ["next-node", "alternate-node"],
        decisionBy: "agent"
      },
      turnRequestFactory: async ({ baseRequest, turn: current }) => {
        const turnNumber = Number(current.invocationId.split("-").at(-1));
        return {
          request: { ...baseRequest, invocationId: current.invocationId },
          onTrace: async (_kind, message) => {
            if (message !== "Resident turn authority activated") return;
            await services.at(-1)!.stage(
              capabilities.at(-1)!,
              `route-${turnNumber}`,
              {
                tool: "route_to_agent",
                target: allowWrongTask ? "wrong-node" : "next-node"
              }
            );
            if (!scoped && turnNumber === 1) {
              slowResult = activeControl!.request("tools/call", {
                name: "github_get_pr", arguments: { callId: "slow-original-call", providerNumber: 71 }
              });
              await slowStarted;
              // Let the native turn exit while its accepted Git callback is
              // still pending. Release must drain the callback and both MCP
              // layers must return its actual result beyond the old 10s cap.
            }
          }
        };
      },
      controlAuthorityFactory: async ({ request, turn: current }) => {
        const capability = `resident-control-${current.invocationId}-${randomSuffix()}`;
        capabilities.push(capability);
        return {
          control: {
            stagingPath: path.join(
              fixture.executionRuntime,
              `control-${current.invocationId}.json`
            ),
            capability,
            capabilityHash: createHash("sha256").update(capability).digest("hex"),
            stateVersion: 7,
            candidates: ["next-node", "alternate-node"],
            decisionBy: "agent",
            allowAgentGitActions: true,
            ...(scoped ? { scopedAgentRouting: true, allowFinishRoute: true } : {}),
            allowUserIntervention: false,
            canComplete: false,
            requireBridge: true
          },
          revalidate: async (envelope) => {
            expect(envelope.invocationId).toBe(request.invocationId);
          },
          execute: executeSlow
        };
      }
    });
    const rows = JSON.parse(launchEnvironment!.SCIENCEEVOLVE_PI_MCP_CONFIG!) as Array<{
      namespace: string;
      command: string;
      args: string[];
      environmentKeys?: string[];
    }>;
    const controlRow = rows.find((row) => row.namespace === "openfars-resident-control")!;
    expect(controlRow).toBeDefined();
    expect(controlRow.environmentKeys).toBeUndefined();
    const privateConfig = JSON.parse(
      await fs.readFile(controlRow.args.at(-1)!, "utf8")
    ) as { host: string; port: number; token: string };
    expect(JSON.stringify(controlRow)).not.toContain(privateConfig.token);
    expect(Object.values(launchEnvironment!).join("\n")).not.toContain(privateConfig.token);
    const idleControl = await openStdioRpc(controlRow.command, controlRow.args);
    await expect(idleControl.request("initialize")).resolves.toMatchObject({
      result: { serverInfo: { name: "scienceevolve-resident-control" } }
    });
    // Exercise actual TCP failures while another MCP client and the retained
    // native resident are alive. Neither failure may terminate the service.
    for (const failure of ["reset", "oversized"] as const) {
      const socket = createConnection({ host: privateConfig.host, port: privateConfig.port });
      socket.on("error", () => undefined);
      const closed = new Promise<void>((resolve) => socket.once("close", () => resolve()));
      await new Promise<void>((resolve, reject) => {
        socket.once("connect", resolve);
        socket.once("error", reject);
      });
      if (failure === "reset") socket.resetAndDestroy();
      else socket.end(Buffer.alloc(1024 * 1024 + 1, "x"));
      await closed;
    }
    await expect(idleControl.request("tools/list")).resolves.toMatchObject({
      result: { tools: expect.arrayContaining([
        expect.objectContaining({ name: "route_to_agent" })
      ]) }
    });
    await expect(idleControl.request("tools/call", {
      name: "route_to_agent",
      arguments: { callId: "idle", target: "next-node" }
    })).resolves.toMatchObject({ error: { code: -32001 } });
    await idleControl.close();

    if (!scoped) activeControl = await openStdioRpc(controlRow.command, controlRow.args);

    const first = await handle.submit({
      inputId: "control-input-1",
      invocationId: "control-inv-1",
      prompt: "claim current task"
    });
    expect(first.controlActions).toMatchObject([{
      invocationId: "control-inv-1",
      action: { tool: "route_to_agent", target: "next-node" }
    }, ...(!scoped ? [{ invocationId: "control-inv-1", action: { tool: "github_get_pr", providerNumber: 71 } }] : [])]);
    if (!scoped) {
      const result = await slowResult!;
      expect((result.result as { content: Array<{ text: string }> }).content[0]!.text)
        .toContain('"localSynchronization":"confirmed"');
      expect(JSON.stringify(result)).not.toContain("did not respond");
      expect(executeSlow).toHaveBeenCalledOnce();
      await activeControl!.close();
    }
    await expect(services[0]!.stage(capabilities[0]!, "stale-call", {
      tool: "route_to_agent", target: "next-node"
    })).rejects.toThrow(/revoked/);

    allowWrongTask = true;
    await expect(handle.submit({
      inputId: "control-input-2",
      invocationId: "control-inv-2",
      prompt: "invalid claim must fail facade validation"
    })).rejects.toThrow(/invalid orchestration control envelope/);
    await expect(services[1]!.stage(capabilities[1]!, "stale-call-2", {
      tool: "route_to_agent", target: "next-node"
    })).rejects.toThrow(/revoked/);
    await handle.close();
  }, 30_000);

  it.each([["leader", true], ["scoped-leader", true], ["scoped-main", true], ["scoped-main", false]] as const)("opens a production %s with management-only inputs and fresh control authority (user intervention: %s)", async (role, allowUserIntervention) => {
    const fixture = await createFixture("pi", new PiAdapter(), "leader");
    const inboxPath = path.join(fixture.workspace, "turn-one-Inbox.md");
    const memoryPath = path.join(fixture.workspace, "Memory.md");
    await Promise.all([
      fs.writeFile(inboxPath, "leader management snapshot\n", { mode: 0o600 }),
      fs.writeFile(memoryPath, "leader memory snapshot\n", { mode: 0o600 })
    ]);
    const source = fixture.launch.request;
    const sourceConfig = source.project.agents.writer!;
    const request = {
      ...source,
      // The project's normal Main/Agent config may be yolo. The coordinator
      // compiles a separate restricted permission for management residents.
      permission: "workspace",
      inboxPath,
      project: {
        ...source.project,
        orchestration: { ...source.project.orchestration, allowUserIntervention },
        agents: { writer: {
          ...sourceConfig,
          skills: [],
          autoSkills: [],
          instructions: "Coordinate only.",
          permission: "yolo",
          sessionPersistence: false,
          decisionBy: "main",
          webSearch: false,
          mcpServers: []
        } }
      }
    } as unknown as AgentRunRequest;
    expect(request.project.agents.writer?.permission).toBe("yolo");
    expect(request.permission).toBe("workspace");
    const scoped = role !== "leader";
    if (role === "scoped-main") {
      request.project.agents.main = request.project.agents.writer!;
      request.agent = "main"; request.kind = "main";
    }
    const facade = new HarnessRuntimeFacade({
      adapters: [
        new CodexAdapter(),
        new PiAdapter({ harnessExecutables: { pi: fixture.launch.executable } })
      ]
    });
    const prepare = vi.spyOn(facade, "prepareResidentScope");
    let routeSequence = 0;
    const resident = new HarnessRuntimeResidentAdapter({
      runtime: facade,
      routeFactory: async () => openTestInvocationRoute(
        "chat-completions",
        `leader-${++routeSequence}`
      )
    });
    const handle = await resident.open({
      request,
      inputs: {
        projectPath: fixture.projectPath,
        workspacePath: fixture.workspace,
        inboxPath,
        memoryPath,
        runtimePath: fixture.executionRuntime,
        inboxSha256: "ignored"
      },
      executionRuntimePath: fixture.executionRuntime,
      filesystemAuthorityInput: {
        serviceUserRoot: fixture.root,
        protectedRoots: [fixture.executionRuntime]
      },
      signal: fixture.launch.signal,
      onTrace: async () => undefined,
      controlScope: {
        role,
        projectId: "prj_fixture",
        nodeRunId: "nr_fixture",
        groupRunId: "grp_fixture",
        leaderAgentId: request.agent,
        coordinatorEpoch: 11,
        ...(scoped ? { memberNodeIds: ["G_node"], routeCandidates: [], failedArrivalRequestIds: ["failed-arrival"],
          ...(role === "scoped-leader" ? { closingArrivalRequestIds: ["failed-arrival"] } : {}), allowReconfiguration: true } : {})
      },
      turnRequestFactory: async ({ baseRequest, turn: current }) => ({
        request: { ...baseRequest, invocationId: current.invocationId },
        onTrace: async () => undefined
      }),
      controlAuthorityFactory: async ({ turn: current }) => {
        const capability = `leader-${current.invocationId}-${randomSuffix()}`;
        return {
          control: {
            stagingPath: path.join(
              fixture.executionRuntime,
              `leader-control-${current.invocationId}.json`
            ),
            capability,
            capabilityHash: createHash("sha256").update(capability).digest("hex"),
            stateVersion: 11,
            candidates: [],
            decisionBy: "main",
            allowUserIntervention: role === "scoped-main" && allowUserIntervention,
            ...(scoped ? { allowWorkflowReconfiguration: true } : {}),
            canComplete: false,
            collaboration: {
              nodeRunId: "nr_fixture",
              groupRunId: "grp_fixture",
              role,
              coordinatorEpoch: 11,
              ...(scoped ? { memberNodeIds: ["G_node"], routeCandidates: [], failedArrivalRequestIds: ["failed-arrival"],
                ...(role === "scoped-leader" ? { closingArrivalRequestIds: ["failed-arrival"] } : {}), allowReconfiguration: true } : {})
            },
            requireBridge: true
          },
          revalidate: async () => undefined
        };
      }
    });
    const prepared = await prepare.mock.results[0]!.value;
    expect(prepared.request.control?.allowUserIntervention).toBe(role === "scoped-main" && allowUserIntervention);
    await expect(handle.submit({
      inputId: "leader-input",
      invocationId: "leader-invocation",
      prompt: "coordinate the current group"
    })).resolves.toMatchObject({ handoff: "pi-1" });
    expect((await handle.probe()).pid).toBe(handle.initialLease.pid);
    await handle.close();
  }, 30_000);

  it("compiles a system Main route as ordinary Main control, not group-leader control", async () => {
    const fixture = await createFixture("pi", new PiAdapter(), "leader");
    const inboxPath = path.join(fixture.workspace, "turn-one-Inbox.md");
    const memoryPath = path.join(fixture.workspace, "Memory.md");
    await Promise.all([
      fs.writeFile(inboxPath, "choose a workflow route\n", { mode: 0o600 }),
      fs.writeFile(memoryPath, "bounded management memory\n", { mode: 0o600 })
    ]);
    const source = fixture.launch.request;
    const config = source.project.agents.writer!;
    const request = {
      ...source,
      agent: "main",
      kind: "main",
      permission: "workspace",
      inboxPath,
      project: {
        ...source.project,
        agents: { main: {
          ...config,
          skills: [],
          autoSkills: [],
          instructions: "Choose only the fenced workflow route.",
          permission: "yolo",
          sessionPersistence: false,
          decisionBy: "main",
          webSearch: false,
          mcpServers: []
        } }
      },
      executionContext: {
        nodeRunId: "nr_fixture",
        routeScopeId: "main-route-nr_fixture",
        role: "leader",
        coordinatorEpoch: 1
      }
    } as unknown as AgentRunRequest;
    const facade = new HarnessRuntimeFacade({
      adapters: [
        new CodexAdapter(),
        new PiAdapter({ harnessExecutables: { pi: fixture.launch.executable } })
      ]
    });
    let service: ControlActionService | undefined;
    let capability = "";
    const resident = new HarnessRuntimeResidentAdapter({
      runtime: facade,
      routeFactory: async () => openTestInvocationRoute("chat-completions", "main-route"),
      controlServiceFactory: (options) => (service = new ControlActionService(options))
    });
    const handle = await resident.open({
      request,
      inputs: {
        projectPath: fixture.projectPath,
        workspacePath: fixture.workspace,
        inboxPath,
        memoryPath,
        runtimePath: fixture.executionRuntime,
        inboxSha256: "ignored"
      },
      executionRuntimePath: fixture.executionRuntime,
      filesystemAuthorityInput: {
        serviceUserRoot: fixture.root,
        protectedRoots: [fixture.executionRuntime]
      },
      signal: fixture.launch.signal,
      onTrace: async () => undefined,
      controlScope: {
        role: "main-route",
        projectId: "prj_fixture",
        nodeRunId: "nr_fixture",
        routeScopeId: "main-route-nr_fixture",
        leaderAgentId: "main",
        coordinatorEpoch: 1,
        candidates: ["next-node", "finish"],
        tasklessRouteTargets: [],
        allowUserIntervention: true,
        allowWorkflowReconfiguration: false,
        canComplete: true,
        allowFinishRoute: false
      },
      turnRequestFactory: async ({ baseRequest, turn: current }) => ({
        request: { ...baseRequest, invocationId: current.invocationId },
        onTrace: async (_kind, message) => {
          if (message === "Resident turn authority activated") {
            await service!.stage(capability, "ask-user", {
              tool: "request_user",
              message: "Which audience?",
              rationale: "Audience is ambiguous"
            });
          }
        }
      }),
      controlAuthorityFactory: async ({ turn: current }) => {
        capability = `main-route-${current.invocationId}-${randomSuffix()}`;
        return {
          control: {
            stagingPath: path.join(fixture.executionRuntime, "main-route-control.json"),
            capability,
            capabilityHash: createHash("sha256").update(capability).digest("hex"),
            stateVersion: 1,
            candidates: ["next-node", "finish"],
            tasklessRouteTargets: [],
            decisionBy: "main",
            allowUserIntervention: true,
            allowWorkflowReconfiguration: false,
            canComplete: true,
            allowFinishRoute: false,
            requireBridge: true
          },
          revalidate: async () => undefined
        };
      }
    });
    await expect(handle.submit({
      inputId: "main-route-input",
      invocationId: "main-route-invocation",
      prompt: "choose"
    })).resolves.toMatchObject({
      controlActions: [{ action: { tool: "request_user", message: "Which audience?" } }]
    });
    await handle.close();
  }, 30_000);

  it("keeps full system Main control non-terminal until apply or completion", async () => {
    const fixture = await createFixture("pi", new PiAdapter(), "leader");
    const inboxPath = path.join(fixture.workspace, "turn-one-Inbox.md");
    const memoryPath = path.join(fixture.workspace, "Memory.md");
    await Promise.all([
      fs.writeFile(inboxPath, "manage the outer Main node\n", { mode: 0o600 }),
      fs.writeFile(memoryPath, "bounded Main memory\n", { mode: 0o600 })
    ]);
    const source = fixture.launch.request;
    const config = source.project.agents.writer!;
    const request = {
      ...source,
      agent: "main",
      kind: "main",
      permission: "workspace",
      inboxPath,
      project: {
        ...source.project,
        agents: { main: {
          ...config,
          skills: [],
          autoSkills: [],
          instructions: "Manage only the outer workflow node.",
          permission: "workspace",
          sessionPersistence: false,
          decisionBy: "main",
          webSearch: false,
          mcpServers: []
        } }
      },
      executionContext: {
        nodeRunId: "nr_fixture",
        routeScopeId: "main-route-nr_fixture",
        role: "leader",
        coordinatorEpoch: 4
      }
    } as unknown as AgentRunRequest;
    const facade = new HarnessRuntimeFacade({
      adapters: [
        new CodexAdapter(),
        new PiAdapter({ harnessExecutables: { pi: fixture.launch.executable } })
      ]
    });
    let service: ControlActionService | undefined;
    let capability = "";
    let routeSequence = 0;
    const resident = new HarnessRuntimeResidentAdapter({
      runtime: facade,
      routeFactory: async () => openTestInvocationRoute(
        "chat-completions",
        `main-node-${++routeSequence}`
      ),
      controlServiceFactory: (options) => (service = new ControlActionService(options))
    });
    const handle = await resident.open({
      request,
      inputs: {
        projectPath: fixture.projectPath,
        workspacePath: fixture.workspace,
        inboxPath,
        memoryPath,
        runtimePath: fixture.executionRuntime,
        inboxSha256: "ignored"
      },
      executionRuntimePath: fixture.executionRuntime,
      filesystemAuthorityInput: {
        serviceUserRoot: fixture.root,
        protectedRoots: [fixture.executionRuntime]
      },
      signal: fixture.launch.signal,
      onTrace: async () => undefined,
      controlScope: {
        role: "main-node",
        projectId: "prj_fixture",
        nodeRunId: "nr_fixture",
        routeScopeId: "main-route-nr_fixture",
        leaderAgentId: "main",
        coordinatorEpoch: 4,
        candidates: ["next-node", "finish"],
        tasklessRouteTargets: [],
        allowUserIntervention: true,
        allowWorkflowReconfiguration: true,
        canComplete: true,
        allowFinishRoute: false
      },
      turnRequestFactory: async ({ baseRequest, turn: current }) => ({
        request: { ...baseRequest, invocationId: current.invocationId },
        onTrace: async (_kind, message) => {
          if (message !== "Resident turn authority activated") return;
          if (current.invocationId === "main-node-apply") {
            await service!.stage(capability, "select-display", {
              tool: "select_display",
              primary: { agent: "writer", path: "report.md", title: "Report" },
              items: []
            });
            await service!.stage(capability, "apply-workflow", {
              tool: "apply_workflow",
              path: "workflow.json",
              rationale: "Commit the validated macro workflow"
            });
          } else {
            await service!.stage(capability, "complete-project", {
              tool: "complete_project",
              rationale: "The accepted result is ready"
            });
          }
        }
      }),
      controlAuthorityFactory: async ({ turn: current }) => {
        capability = `main-node-${current.invocationId}-${randomSuffix()}`;
        return {
          control: {
            stagingPath: path.join(
              fixture.executionRuntime,
              `main-node-control-${current.invocationId}.json`
            ),
            capability,
            capabilityHash: createHash("sha256").update(capability).digest("hex"),
            stateVersion: 4,
            candidates: ["next-node", "finish"],
            tasklessRouteTargets: [],
            decisionBy: "main",
            allowUserIntervention: true,
            allowWorkflowReconfiguration: true,
            canComplete: true,
            allowFinishRoute: false,
            requireBridge: true
          },
          revalidate: async () => undefined
        };
      }
    });
    await expect(handle.submit({
      inputId: "main-node-apply-input",
      invocationId: "main-node-apply",
      prompt: "select the display and apply the workflow"
    })).resolves.toMatchObject({
      controlActions: [
        { action: { tool: "select_display" } },
        { action: { tool: "apply_workflow", path: "workflow.json" } }
      ]
    });
    await expect(handle.submit({
      inputId: "main-node-complete-input",
      invocationId: "main-node-complete",
      prompt: "complete"
    })).resolves.toMatchObject({
      controlActions: [{ action: { tool: "complete_project" } }]
    });
    await handle.close();
  }, 30_000);

  it("does not write a native model frame when atomic authority activation fails", async () => {
    const fixture = await createFixture("pi", new PiAdapter());
    const facade = new HarnessRuntimeFacade({
      adapters: [
        new CodexAdapter(),
        new PiAdapter({ harnessExecutables: { pi: fixture.launch.executable } })
      ]
    });
    const route = await openTestInvocationRoute("chat-completions", "activation-failure");
    const official: unknown[] = [];
    const resident = new HarnessRuntimeResidentAdapter({
      runtime: facade,
      routeFactory: async () => route
    });
    const prepared = await highLevelInput(fixture, async () => undefined);
    const handle = await resident.open({
      request: prepared.request,
      executionRuntimePath: prepared.executionRuntimePath,
      filesystemAuthorityInput: prepared.filesystemAuthorityInput,
      signal: prepared.signal,
      onTrace: async () => undefined,
      turnRequestFactory: async ({ baseRequest, turn: current }) => ({
        request: {
          ...baseRequest,
          invocationId: current.invocationId,
          onOfficialHarnessEvent: (event) => { official.push(event); }
        },
        onTrace: async (_kind, message) => {
          if (message === "Resident turn authority activated") {
            throw new Error("fixture activation ACK persistence failed");
          }
        }
      })
    });
    await expect(handle.submit({
      inputId: "activation-input",
      invocationId: "activation-inv",
      prompt: "must never reach native stdin"
    })).rejects.toThrow(/activation ACK persistence failed/);
    expect(official).toEqual([]);
    expect(route.closed).toBe(true);
    await handle.close().catch(() => undefined);
  }, 30_000);

  it("rejects delivery request.control instead of bypassing the canonical control scope", async () => {
    const fixture = await createFixture("pi", new PiAdapter());
    const facade = new HarnessRuntimeFacade({
      adapters: [
        new CodexAdapter(),
        new PiAdapter({ harnessExecutables: { pi: fixture.launch.executable } })
      ]
    });
    const resident = new HarnessRuntimeResidentAdapter({
      runtime: facade,
      routeFactory: async () => openTestInvocationRoute("chat-completions", "unused")
    });
    const prepared = await highLevelInput(fixture, async () => undefined);
    await expect(resident.open({
      request: {
        ...prepared.request,
        control: {
          stagingPath: path.join(fixture.executionRuntime, "caller-control.json"),
          capability: "caller-capability",
          stateVersion: 7,
          candidates: ["next-node"],
          decisionBy: "agent",
          allowUserIntervention: false,
          canComplete: false
        }
      },
      executionRuntimePath: prepared.executionRuntimePath,
      filesystemAuthorityInput: prepared.filesystemAuthorityInput,
      signal: prepared.signal,
      onTrace: async () => undefined
    })).rejects.toThrow(/canonical server scope/);
  });

  it("allows a failed handle close to be retried without reopening business authority", async () => {
    const fixture = await createFixture("pi", new PiAdapter());
    const facade = new HarnessRuntimeFacade({
      adapters: [
        new CodexAdapter(),
        new PiAdapter({ harnessExecutables: { pi: fixture.launch.executable } })
      ]
    });
    const closeResident = facade.closeResident.bind(facade);
    let closeAttempts = 0;
    vi.spyOn(facade, "closeResident").mockImplementation(async (authority) => {
      closeAttempts += 1;
      if (closeAttempts === 1) throw new Error("fixture close persistence failed");
      return closeResident(authority);
    });
    const resident = new HarnessRuntimeResidentAdapter({
      runtime: facade,
      routeFactory: async () => openTestInvocationRoute("chat-completions", "close-retry")
    });
    const prepared = await highLevelInput(fixture, async () => undefined);
    const handle = await resident.open({
      request: prepared.request,
      executionRuntimePath: prepared.executionRuntimePath,
      filesystemAuthorityInput: prepared.filesystemAuthorityInput,
      signal: prepared.signal,
      onTrace: async () => undefined
    });
    const pid = handle.initialLease.pid;
    await expect(handle.close()).rejects.toThrow(/fixture close persistence failed/);
    await expect(handle.pause()).rejects.toThrow(/closing or closed/);
    await expect(handle.submit({
      inputId: "after-close-request",
      invocationId: "after-close-request",
      prompt: "must stay closed"
    })).rejects.toThrow(/closing or closed/);
    await expect(handle.close()).resolves.toBeUndefined();
    await expect(handle.pause()).resolves.toBeUndefined();
    expect(closeAttempts).toBe(2);
    await expect.poll(() => processAlive(pid)).toBe(false);
  }, 30_000);

  it.each([
    { id: "codex", adapter: () => new CodexAdapter() },
    { id: "claude-code", adapter: () => new ClaudeCodeAdapter() },
    { id: "pi", adapter: () => new PiAdapter() },
    { id: "dsh", adapter: () => new DshAdapter() }
  ])("stop-confirms and reopens a fresh epoch for recovered $id", async (row) => {
    const fixture = await createFixture(row.id, row.adapter());
    const configured = configuredAdapter(row.id, fixture.launch.executable);
    let published: { session: SessionRef; legacyId: string } | undefined;
    let firstRoute = 0;
    const firstFacade = new HarnessRuntimeFacade({
      adapters: row.id === "codex" ? [configured] : [new CodexAdapter(), configured]
    });
    const firstAdapter = new HarnessRuntimeResidentAdapter({
      runtime: firstFacade,
      routeFactory: async () => openTestInvocationRoute(
        configured.descriptor.nativeProtocol,
        `recovery-old-${++firstRoute}`
      )
    });
    const firstPrepared = await highLevelInput(fixture, async (session, legacyId) => {
      published = { session: structuredClone(session), legacyId };
    });
    const firstHandle = await firstAdapter.open({
      request: firstPrepared.request,
      executionRuntimePath: firstPrepared.executionRuntimePath,
      filesystemAuthorityInput: firstPrepared.filesystemAuthorityInput,
      signal: firstPrepared.signal,
      onTrace: async () => undefined,
      turnRequestFactory: async ({ baseRequest, turn: current }) => ({
        request: { ...baseRequest, invocationId: current.invocationId },
        onTrace: async () => undefined
      })
    });
    const firstResult = await firstHandle.submit({
      inputId: "before-crash",
      invocationId: "before-crash-inv",
      prompt: "commit one durable business turn"
    });
    expect(published).toBeDefined();
    // This controlled CLI does not implement native persistence. Supply its
    // committed first-turn artifact so recovery exercises the real history
    // validation rather than the obsolete system-transcript replacement.
    const dshArtifact = row.id === "dsh" ? dshSessionArtifactPath(
      path.join(fixture.executionRuntime, "dsh-home"), fixture.workspace, published!.session.nativeId
    ) : undefined;
    let history: Buffer | undefined;
    if (dshArtifact) {
      history = Buffer.concat([
        zstdCompressSync(Buffer.from(JSON.stringify({ type: "session", version: 1, createdAt: 1,
          id: published!.session.nativeId, cwd: fixture.workspace }) + "\n")),
        zstdCompressSync(Buffer.from(JSON.stringify({ type: "assistant/message", seq: 17,
          data: { message: { role: "assistant", content: [{ type: "text", text: firstResult.handoff }] } } }) + "\n"))
      ]);
      await fs.mkdir(path.dirname(dshArtifact), { recursive: true });
      await fs.writeFile(dshArtifact, history);
    }
    const oldPid = firstHandle.initialLease.pid;
    if (row.id === "pi") {
      const oldGroup = firstHandle.initialLease.processGroupId ?? oldPid;
      try { process.kill(-oldGroup, "SIGKILL"); } catch { process.kill(oldPid, "SIGKILL"); }
      await expect.poll(() => processAlive(oldPid)).toBe(false);
      await expect(firstHandle.probe()).resolves.toMatchObject({ state: "crashed" });
    }

    const nextPrepared = await highLevelInput(fixture, async () => undefined);
    const nextContext = nextPrepared.request.executionContext!;
    if (nextContext.role !== "delivery") throw new Error("fixture role mismatch");
    nextPrepared.request = {
      ...nextPrepared.request,
      sessionContinuity: "strict",
      project: {
        ...nextPrepared.request.project,
        agentSessions: { writer: published!.session },
        agentSessionIds: { writer: published!.legacyId }
      },
      executionContext: { ...nextContext, ownershipEpoch: 8 }
    };
    const reopened = await firstAdapter.reconcile({
      nextOwnershipEpoch: 8,
      open: {
        request: nextPrepared.request,
        executionRuntimePath: nextPrepared.executionRuntimePath,
        filesystemAuthorityInput: nextPrepared.filesystemAuthorityInput,
        signal: nextPrepared.signal,
        onTrace: async () => undefined,
        turnRequestFactory: async ({ baseRequest, turn: current }) => ({
          request: { ...baseRequest, invocationId: current.invocationId },
          onTrace: async () => undefined
        })
      }
    });
    expect(reopened.reconciliation.outcome).toBe(row.id === "pi" ? "dead" : "terminated");
    expect(reopened.handle.initialLease.pid).not.toBe(oldPid);
    expect(reopened.handle.initialLease.session.nativeId).toBe(published!.session.nativeId);
    expect(reopened.handle.initialLease.session.generation).toBe(published!.session.generation);
    await expect.poll(() => processAlive(oldPid)).toBe(false);
    await expect(reopened.handle.submit({
      inputId: "after-recovery",
      invocationId: "after-recovery-inv",
      prompt: "continue at the advanced epoch"
    })).resolves.toMatchObject({ handoff: expect.stringContaining("-1") });
    if (dshArtifact) expect(await fs.readFile(dshArtifact)).toEqual(history);
    await reopened.handle.close();
    await firstHandle.close().catch(() => undefined);
  }, 30_000);
});

async function createFixture(
  harnessId: string,
  adapter: HarnessAdapter,
  role: "leader" | "delivery" = "delivery",
  permission: AgentPermission = "workspace",
  fixedManagement = false,
  projectId = "prj_fixture"
) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-resident-launch-"));
  roots.push(root);
  const projectPath = path.join(root, projectId);
  const executionRuntime = path.join(projectPath, "runtime", "resident", "exec-fixture");
  const workspace = fixedManagement ? path.join(projectPath, "git-worktrees", "agents", "writer")
    : role === "leader" ? path.join(executionRuntime, "management-workspace") : path.join(projectPath, "worktrees", "execution");
  await Promise.all([
    fs.mkdir(workspace, { recursive: true }),
    fs.mkdir(executionRuntime, { recursive: true })
  ]);
  const executable = path.join(root, `fake-${harnessId}.cjs`);
  await fs.writeFile(executable, fakeSource(harnessId), { mode: 0o700 });
  const nativeId = harnessId === "codex"
    ? "pending:fixture"
    : harnessId === "pi"
      ? path.join(projectPath, "runtime", "harness-sessions", "writer", "pi", "sessions", "pi-session.jsonl")
      : `${harnessId}-session`;
  const session: SessionRef = {
    schemaVersion: 1,
    harnessId,
    adapterVersion: adapter.descriptor.adapterVersion,
    generation: 0,
    nativeId,
    durable: true,
    createdAt: "2026-09-22T00:00:00.000Z"
  };
  const gateway = {
    id: `gwy_${"a".repeat(32)}`,
    name: "fixture",
    url: "http://127.0.0.1:49999/v1",
    apiKey: "provider-secret-never-forwarded",
    models: ["fixture-model"],
    defaultModel: "fixture-model",
    protocol: adapter.descriptor.nativeProtocol,
    nativeProtocol: adapter.descriptor.nativeProtocol,
    routeMode: "direct"
  } as const;
  const request = {
    project: {
      id: projectId,
      ...(fixedManagement ? { orchestration: { schemaVersion: 3 } } : {}),
      agents: {
        writer: {
          harness: harnessId,
          model: "fixture-model",
          reasoningEffort: "high",
          gatewaySnapshot: gateway,
          mcpServers: [],
          webSearch: false
        }
      }
    },
    agent: "writer",
    kind: "worker",
    permission,
    invocationId: "turn-one",
    projectPath,
    workspacePath: workspace,
    inboxPath: path.join(workspace, "Inbox.md"),
    runtimePath: executionRuntime,
    schemaPath: "",
    skillPaths: [],
    autoSkillPaths: [],
    availableSkillPaths: [],
    executionContext: role === "leader"
      ? {
          nodeRunId: "nr_fixture",
          groupRunId: "grp_fixture",
          role: "leader",
          coordinatorEpoch: 11
        }
      : {
          nodeRunId: "nr_fixture",
          taskId: "tsk_fixture",
          executionId: "exec-fixture",
          role: "delivery",
          ownershipEpoch: 7,
          executionWorktree: workspace
        }
  } as unknown as HarnessAdapterRequest;
  const snapshotRoot = fixedManagement
    ? path.join(workspace, ".scienceevolve", "management", request.invocationId) : workspace;
  if (fixedManagement) {
    await fs.mkdir(snapshotRoot, { recursive: true });
    request.inboxPath = path.join(snapshotRoot, `${request.invocationId}-Inbox.md`);
    await fs.writeFile(request.inboxPath, "fixture inbox\n");
    await fs.writeFile(path.join(snapshotRoot, "Memory.md"), "fixture memory\n");
  }
  const spec: InvocationSpec = {
    invocationId: request.invocationId,
    harnessId,
    purpose: "workflow",
    model: "fixture-model",
    prompt: "fixture",
    inputs: {
      projectPath,
      workspacePath: workspace,
      inboxPath: request.inboxPath,
      memoryPath: path.join(snapshotRoot, "Memory.md"),
      runtimePath: executionRuntime,
      inboxSha256: "a".repeat(64)
    },
    policy: {
      permission,
      constraintPrompt: "fixture",
      skillPaths: [],
      autoSkillPaths: [],
      mcpServers: [],
      webSearch: false
    },
    session,
    durableSession: true
  };
  const launchRoute = {
    baseUrl: "http://127.0.0.1:48888/v1",
    token: "execution-scoped-route-token"
  };
  const commonEnvironment = buildInvocationEnvironment({
    common: {
      SCIENCEEVOLVE_PROJECT_ID: "prj_fixture",
      SCIENCEEVOLVE_RESIDENT_SCOPE_ID: role === "leader"
        ? "management:nr_fixture:grp_fixture"
        : "exec-fixture",
      SCIENCEEVOLVE_RESIDENT_ROLE: role,
      ...(role === "leader"
        ? { SCIENCEEVOLVE_COORDINATOR_EPOCH: "11" }
        : {
            SCIENCEEVOLVE_EXECUTION_ID: "exec-fixture",
            SCIENCEEVOLVE_OWNERSHIP_EPOCH: "7"
          }),
      SCIENCEEVOLVE_AGENT_NAME: "writer",
      SCIENCEEVOLVE_AGENT_KIND: "worker",
      SCIENCEEVOLVE_AGENT_PERMISSION: permission,
      SCIENCEEVOLVE_AGENT_HARNESS: harnessId,
      SCIENCEEVOLVE_AGENT_PROTOCOL: adapter.descriptor.nativeProtocol,
      SCIENCEEVOLVE_PROJECT_ROOT: projectPath,
      SCIENCEEVOLVE_ROLE_WORKSPACE: workspace,
      SCIENCEEVOLVE_GATEWAY_API_KEY: launchRoute.token,
      ...(adapter.descriptor.nativeProtocol === "anthropic-messages"
        ? {
            ANTHROPIC_BASE_URL: launchRoute.baseUrl.replace(/\/v1\/?$/, ""),
            ANTHROPIC_AUTH_TOKEN: launchRoute.token
          }
        : {
            OPENAI_BASE_URL: launchRoute.baseUrl,
            OPENAI_API_KEY: launchRoute.token
          })
    }
  });
  const controller = new AbortController();
  const authority: FilesystemAuthority = {
    serviceUserRoot: root,
    executionWorktree: workspace,
    ownedMemoryPath: path.join(workspace, "Memory.md"),
    readRoots: [root],
    writeRoots: role === "leader" ? [] : permission === "yolo" ? [root] : [workspace],
    projectWorktreeRoot: path.dirname(workspace),
    protectedRoots: [path.join(projectPath, "runtime")],
    gitCapability: role === "leader"
      ? "none"
      : permission === "workspace"
        ? "execution"
        : "project-service",
    rootBindings: role === "leader"
      ? [{ id: "read-fixture0000000", path: root, write: false }]
      : permission === "yolo"
        ? [{ id: "write-fixture000000", path: root, write: true }]
      : [
          { id: "read-fixture0000000", path: root, write: false },
          { id: "write-fixture000000", path: workspace, write: true }
        ],
    rawTools: permission === "yolo" ? "trusted-yolo" : "forbidden"
  };
  const processHost = new CommonProcessHost();
  const filesystemMcp = permission === "yolo"
    ? undefined
    : await prepareFilesystemAuthorityMcp({
        authority,
        executionRuntimePath: executionRuntime
      });
  const processBinding = {
    scopeId: role === "leader" ? "management:nr_fixture:grp_fixture" : "exec-fixture",
    role,
    harnessId,
    runtimePath: executionRuntime,
    workspacePath: workspace,
    signal: controller.signal,
    recoveryBudget: new InvocationRecoveryController(2),
    session: () => session,
    route: launchRoute,
    commonEnvironment,
    authorityEnvironment: commonEnvironment,
    hostHome: root
  };
  const activated = new Set<string>();
  const launch = {
    adapter,
    executable,
    request,
    spec,
    session,
    launchRoute,
    filesystemAuthority: authority,
    mcpRows: [],
    filesystemMcp,
    executionRuntimePath: executionRuntime,
    processHost,
    processBinding,
    turnAuthority: {
      activate: async (value: ResidentTurn) => {
        if (activated.has(value.route.token)) throw new Error("stale turn token");
        activated.add(value.route.token);
        return {
          inputId: value.inputId,
          invocationId: value.invocationId,
          ownershipEpoch: role === "leader" ? 11 : 7,
          release: () => undefined
        };
      }
    },
    signal: controller.signal,
    onTrace: async () => undefined
  };
  return { root, projectPath, workspace, executionRuntime, launch };
}

async function highLevelInput(
  fixture: Awaited<ReturnType<typeof createFixture>>,
  publish: NonNullable<AgentRunRequest["onDurableSessionStarted"]>
): Promise<PrepareResidentScopeRequest> {
  const invocationRuntime = path.join(fixture.projectPath, "runtime", "turn-one");
  const messages = path.join(fixture.projectPath, "messages");
  const inboxPath = path.join(messages, "0001_turn-one_to_writer.md");
  await Promise.all([
    fs.mkdir(invocationRuntime, { recursive: true }),
    fs.mkdir(messages, { recursive: true })
  ]);
  await fs.writeFile(inboxPath, "resident fixture inbox\n", { mode: 0o600 });
  const source = fixture.launch.request;
  const sourceConfig = source.project.agents.writer!;
  const request = {
    ...source,
    project: {
      ...source.project,
      git: { enabled: true },
      agents: {
        writer: {
          ...sourceConfig,
          skills: [],
          autoSkills: [],
          instructions: "",
          permission: "workspace",
          sessionPersistence: false,
          decisionBy: "main"
        }
      }
    },
    inboxPath,
    runtimePath: invocationRuntime,
    onDurableSessionStarted: publish
  } as unknown as AgentRunRequest;
  return {
    request,
    launchRoute: fixture.launch.launchRoute,
    filesystemAuthorityInput: {
      serviceUserRoot: fixture.root,
      projectWorktreeRoot: path.dirname(fixture.workspace),
      projectWorktrees: [fixture.workspace],
      protectedRoots: [fixture.executionRuntime]
    },
    mcpRows: [],
    executionRuntimePath: fixture.executionRuntime,
    turnAuthority: fixture.launch.turnAuthority,
    signal: fixture.launch.signal,
    onTrace: async () => undefined,
    recoveryMaxAttempts: 2
  };
}

async function exerciseFilesystemMcp(
  prepared: NonNullable<Awaited<ReturnType<typeof createFixture>>["launch"]["filesystemMcp"]>,
  label: string
): Promise<void> {
  const config = JSON.parse(await fs.readFile(prepared.configPath, "utf8")) as {
    roots: Array<{ id: string; path: string; write: boolean }>;
    executionWorktree: string;
  };
  await execFileAsync("/usr/bin/git", ["init", "--initial-branch=main"], {
    cwd: config.executionWorktree
  });
  await execFileAsync("/usr/bin/git", ["config", "user.name", "Harness Fixture"], {
    cwd: config.executionWorktree
  });
  await execFileAsync("/usr/bin/git", ["config", "user.email", "harness@localhost"], {
    cwd: config.executionWorktree
  });
  const child = spawn(prepared.row.command, prepared.row.args, {
    stdio: ["pipe", "pipe", "pipe"]
  });
  const lines = readline.createInterface({ input: child.stdout });
  const pending: Array<(value: Record<string, unknown>) => void> = [];
  lines.on("line", (line) => pending.shift()?.(JSON.parse(line) as Record<string, unknown>));
  let id = 0;
  const request = async (method: string, params: Record<string, unknown> = {}) => {
    const response = new Promise<Record<string, unknown>>((resolve) => pending.push(resolve));
    child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id: ++id, method, params })}\n`);
    return response;
  };
  await expect(request("initialize")).resolves.toMatchObject({
    result: { serverInfo: { name: "openfars-descriptor-filesystem" } }
  });
  await expect(request("tools/list")).resolves.toMatchObject({
    result: { tools: expect.arrayContaining([
      expect.objectContaining({ name: "write_file" }),
      expect.objectContaining({ name: "list_directory" }),
      expect.objectContaining({ name: "make_directory" }),
      expect.objectContaining({ name: "git_status" }),
      expect.objectContaining({ name: "git_stage" }),
      expect.objectContaining({ name: "git_unstage" }),
      expect.objectContaining({ name: "git_commit" })
    ]) }
  });
  const writable = config.roots.find((root) => root.write);
  expect(writable).toBeTruthy();
  const rootId = writable!.id;
  const directory = `mcp-${label}`;
  await expect(request("tools/call", {
    name: "make_directory",
    arguments: { rootId, path: `${directory}/nested` }
  })).resolves.toMatchObject({ result: { content: expect.any(Array) } });
  const listed = await request("tools/call", {
    name: "list_directory",
    arguments: { rootId, path: directory }
  });
  expect(JSON.stringify(listed)).toContain("nested");
  const target = `${directory}/nested/result.txt`;
  const rootPage = await request("tools/call", { name: "list_directory", arguments: { rootId, path: "." } });
  expect((rootPage.result as { isError?: boolean }).isError).not.toBe(true);
  const rootListing = JSON.parse((rootPage.result as { content: Array<{ text: string }> }).content[0]!.text) as { entries: Array<{ name: string }> };
  expect(rootListing.entries.map(entry => entry.name)).toContain(directory);
  expect(rootListing.entries.map(entry => entry.name)).not.toContain(".git");
  const traversal = await request("tools/call", { name: "list_directory", arguments: { rootId, path: `${directory}/..` } });
  expect((traversal.result as { isError?: boolean }).isError).toBe(true);
  const pagedTarget = `${directory}/nested/large-state.txt`;
  const pagedText = "实验α".repeat(20);
  await request("tools/call", { name: "write_file", arguments: { rootId, path: pagedTarget, content: pagedText } });
  const tooSmall = await request("tools/call", { name: "read_file", arguments: { rootId, path: pagedTarget, maxBytes: 11 } });
  expect(JSON.stringify(tooSmall)).toContain("offset=0");
  // Actual retained Leader calls used "" and "0". The tool must reject
  // those values and let the Agent perform the indicated first-page read.
  for (const expectedVersion of ["", null]) {
    const unpinned = await request("tools/call", { name: "read_file", arguments: {
      rootId, path: pagedTarget, offset: 0, maxBytes: 11, expectedVersion
    } });
    expect((unpinned.result as { isError?: boolean }).isError).not.toBe(true);
  }
  for (const expectedVersion of ["0", " ", false]) {
    const invalidVersion = await request("tools/call", { name: "read_file", arguments: {
      rootId, path: pagedTarget, offset: 0, maxBytes: 11, expectedVersion
    } });
    expect((invalidVersion.result as { isError?: boolean }).isError).toBe(true);
    expect(JSON.stringify(invalidVersion)).toContain("64-character version");
  }
  let nextOffset = 0;
  let pageVersion: string | undefined;
  let combined = "";
  do {
    const response = await request("tools/call", { name: "read_file", arguments: { rootId, path: pagedTarget,
      offset: nextOffset, maxBytes: 11, ...(pageVersion ? { expectedVersion: pageVersion } : {}) } });
    const result = response.result as { isError?: boolean; content: Array<{ text: string }> };
    expect(result.isError).not.toBe(true);
    const page = JSON.parse(result.content[0]!.text) as { content: string; bytes: number; nextOffset: number; eof: boolean; version: string; totalBytes: number };
    expect(Buffer.byteLength(page.content)).toBe(page.bytes);
    expect(page.content).not.toContain("�");
    expect(page.nextOffset).toBeGreaterThan(nextOffset);
    combined += page.content;
    nextOffset = page.nextOffset;
    pageVersion = page.version;
    if (page.eof) break;
  } while (nextOffset < Buffer.byteLength(pagedText));
  expect(combined).toBe(pagedText);
  const binary = await request("tools/call", { name: "read_file", arguments: { rootId, path: pagedTarget, offset: 1, maxBytes: 3, encoding: "base64" } });
  const binaryResult = JSON.parse((binary.result as { content: Array<{ text: string }> }).content[0]!.text) as { content: string; encoding: string };
  expect(binaryResult.encoding).toBe("base64");
  expect(Buffer.from(binaryResult.content, "base64")).toEqual(Buffer.from(pagedText).subarray(1, 4));
  await request("tools/call", { name: "write_file", arguments: { rootId, path: pagedTarget, content: `${pagedText}\nchanged` } });
  const staleVersion = await request("tools/call", { name: "read_file", arguments: {
    rootId, path: pagedTarget, offset: 0, maxBytes: 11, expectedVersion: pageVersion
  } });
  expect((staleVersion.result as { isError?: boolean }).isError).toBe(true);
  expect(JSON.stringify(staleVersion)).toContain("version changed");
  await expect(request("tools/call", {
    name: "write_file",
    arguments: { rootId, path: target, content: `bridge-${label}` }
  })).resolves.toMatchObject({ result: { content: expect.any(Array) } });
  const read = await request("tools/call", {
    name: "read_file", arguments: { rootId, path: target }
  });
  expect(JSON.stringify(read)).toContain(`bridge-${label}`);
  const status = await request("tools/call", {
    name: "git_status", arguments: {}
  });
  expect((status.result as { isError?: boolean }).isError).not.toBe(true);
  const statusFact = JSON.parse((status.result as { content: Array<{ text: string }> }).content[0]!.text);
  expect(statusFact).toMatchObject({ branch: "main", head: null, unborn: true,
    entries: expect.arrayContaining([expect.objectContaining({ path: target, untracked: true })]), currentOperation: null });
  expect(JSON.stringify(status)).toContain(target);
  await expect(request("tools/call", {
    name: "git_stage", arguments: { paths: [target] }
  })).resolves.toMatchObject({ result: { content: expect.any(Array) } });
  const committed = await request("tools/call", {
    name: "git_commit", arguments: { message: `Harness ${label} delivery` }
  });
  expect(JSON.stringify(committed)).toMatch(/[0-9a-f]{40}/);
  const current = await request("tools/call", { name: "git_status", arguments: {} });
  expect((current.result as { isError?: boolean }).isError).not.toBe(true);
  const currentFact = JSON.parse((current.result as { content: Array<{ text: string }> }).content[0]!.text);
  expect(currentFact).toMatchObject({ branch: "main", head: expect.stringMatching(/^[a-f0-9]{40}$/), unborn: false,
    staged: [], conflicts: [], currentOperation: null });
  await expect(request("tools/call", {
    name: "git_stage", arguments: { paths: ["agent-memory/writer/Memory.md"] }
  })).resolves.toMatchObject({ result: { isError: true } });
  await expect(request("tools/call", {
    name: "write_file",
    arguments: { rootId, path: "../escape", content: "denied" }
  })).resolves.toMatchObject({ result: { isError: true } });
  const outside = path.join(path.dirname(writable!.path), `mcp-outside-${label}`);
  await fs.mkdir(outside, { recursive: true });
  const symlink = path.join(writable!.path, `mcp-link-${label}`);
  await fs.symlink(outside, symlink);
  await expect(request("tools/call", {
    name: "list_directory",
    arguments: { rootId, path: path.basename(symlink) }
  })).resolves.toMatchObject({ result: { isError: true } });
  child.stdin.end();
  await new Promise<void>((resolve, reject) => {
    child.once("error", reject);
    child.once("close", (code) => code === 0 ? resolve() : reject(new Error(`MCP exited ${code}`)));
  });
}

function turn(index: number): ResidentTurn {
  return {
    inputId: `input-${index}`,
    invocationId: `inv-${index}`,
    prompt: `turn ${index}`,
    route: { baseUrl: `http://127.0.0.1:${47000 + index}/v1`, token: `token-${index}` },
    controlCapability: `control-${index}`
  };
}

function fakeSource(harnessId: string, replayUserInput = false): string {
  const prelude = "#!/usr/bin/env node\nconst r=require('node:readline').createInterface({input:process.stdin});let n=0;const s=v=>process.stdout.write(JSON.stringify(v)+'\\n');";
  if (harnessId === "codex") return `${prelude}if(process.argv[2]==='debug'&&process.argv[3]==='models'&&process.argv.includes('--bundled')){s({models:[{slug:'fixture-model',use_responses_lite:false,tool_mode:null}]});process.exit(0);}r.on('line',l=>{const q=JSON.parse(l);if(q.method==='initialize')return s({id:q.id,result:{}});if(q.method==='initialized')return;if(q.method==='thread/start'||q.method==='thread/resume'){s({method:'configWarning',params:{summary:'fixture',details:null}});s({method:'mcpServer/startupStatus/updated',params:{threadId:'codex-session',name:'fixture',status:'ready',error:null,failureReason:null}});s({method:'thread/started',params:{thread:{id:'codex-session'}}});s({method:'thread/goal/cleared',params:{threadId:'codex-session'}});s({method:'warning',params:{threadId:'codex-session',message:'fixture warning'}});s({method:'account/rateLimits/updated',params:{rateLimits:{primary:{usedPercent:1}}}});s({method:'deprecationNotice',params:{summary:'fixture',details:'fixture details'}});s({id:q.id,result:{thread:{id:'codex-session'}}});return setTimeout(()=>s({method:'remoteControl/status/changed',params:{status:'disabled',serverName:'fixture',installationId:'fixture',environmentId:null}}),5)}if(q.method==='turn/start'){n++;const id='t'+n,u={totalTokens:2,inputTokens:1,cachedInputTokens:0,outputTokens:1,reasoningOutputTokens:0};s({id:q.id,result:{turn:{id}}});${replayUserInput ? "s({method:'item/completed',params:{threadId:'codex-session',turnId:id,item:{type:'userMessage',id:'user-'+n,content:q.params.input}}});" : ""}s({method:'thread/tokenUsage/updated',params:{threadId:'codex-session',turnId:id,tokenUsage:{total:u,last:u,modelContextWindow:null}}});return s({method:'turn/completed',params:{threadId:'codex-session',turn:{id,status:'completed',items:[{type:'agentMessage',text:'codex-'+n}]}}})}if(q.method==='thread/unsubscribe')s({id:q.id,result:{}})});`;
  if (harnessId === "claude-code") return `${prelude}r.on('line',l=>{const q=JSON.parse(l);n++;${replayUserInput ? "s({type:'user',session_id:q.session_id,message:q.message});" : ""}s({type:'assistant',session_id:q.session_id,message:{role:'assistant',content:[{type:'text',text:'claude-'+n}]}});s({type:'result',session_id:q.session_id,is_error:false,result:'claude-'+n})});`;
  if (harnessId === "pi") return `${prelude}const fs=require('node:fs'),path=require('node:path'),i=process.argv.indexOf('--session'),file=i>=0?process.argv[i+1]:undefined,sid='pi-official-session';if(file){fs.mkdirSync(path.dirname(file),{recursive:true});if(!fs.existsSync(file))fs.writeFileSync(file,JSON.stringify({type:'session',id:sid,cwd:process.cwd()})+'\\n')}r.on('line',l=>{const q=JSON.parse(l);if(q.type==='get_state')return s({id:q.id,type:'response',command:'get_state',success:true,data:{isStreaming:false,sessionId:sid,sessionFile:file}});if(q.type==='prompt'){n++;s({id:q.id,type:'response',command:'prompt',success:true});${replayUserInput ? "s({type:'message_end',message:{role:'user',content:q.message}});" : ""}return s({type:'agent_end',sessionId:sid})}if(q.type==='get_last_assistant_text')s({id:q.id,type:'response',command:'get_last_assistant_text',success:true,data:{text:'pi-'+n,sessionId:sid}})});`;
  return `${prelude}let seq=0;r.on('line',l=>{const q=JSON.parse(l);if(q.method==='initialize'){if(q.params&&q.params.reasoningEffort!==undefined)return s({jsonrpc:'2.0',id:q.id,error:{code:-32602,message:'provider does not support reasoning effort'}});return s({jsonrpc:'2.0',id:q.id,result:{serverInfo:{name:'deepseek-harness-sdk-runtime',version:'x'}}})}if(q.method==='session/resume'){seq=18;return s({jsonrpc:'2.0',id:q.id,result:{sessionId:q.params.sessionId,lastSequence:17}})}if(q.method==='session/prompt'){n++;const id=q.params.sessionId;s({jsonrpc:'2.0',id:q.id,result:{messageId:'m'+n}});${replayUserInput ? "s({jsonrpc:'2.0',method:'session.event',params:{sessionId:id,event:{type:'user/message',seq:seq++,surfaceOp:'append',data:{id:'user-'+n,role:'user',source:{kind:'user'},content:q.params.contentBlocks}}}});" : ""}s({jsonrpc:'2.0',method:'session.status',params:{sessionId:id,status:'running'}});s({jsonrpc:'2.0',method:'session.event',params:{sessionId:id,event:{type:'turn/start',seq:seq++,data:{turn:n}}}});s({jsonrpc:'2.0',method:'session.event',params:{sessionId:id,event:{type:'assistant/message',seq:seq++,data:{turn:n,message:{role:'assistant',content:[{type:'text',text:'dsh-'+n}]}}}}});s({jsonrpc:'2.0',method:'session.event',params:{sessionId:id,event:{type:'turn/end',seq:seq++,data:{turn:n,reason:{kind:'completed'}}}}});return s({jsonrpc:'2.0',method:'session.status',params:{sessionId:id,status:'idle'}})}if(q.method==='shutdown')s({jsonrpc:'2.0',id:q.id,result:{}})});`;
}

function configuredAdapter(harnessId: string, executable: string): HarnessAdapter {
  if (harnessId === "codex") {
    return new CodexAdapter({ harnessExecutables: { codex: executable } });
  }
  if (harnessId === "claude-code") {
    return new ClaudeCodeAdapter({ harnessExecutables: { "claude-code": executable } });
  }
  if (harnessId === "pi") {
    return new PiAdapter({ harnessExecutables: { pi: executable } });
  }
  return new DshAdapter({ harnessExecutables: { dsh: executable } });
}

async function residentMcpLaunchConfiguration(
  harnessId: string,
  executionRuntime: string,
  plan: { args: readonly string[]; env: NodeJS.ProcessEnv }
): Promise<string> {
  if (harnessId === "codex") {
    return plan.args.find((argument) => argument.startsWith("mcp_servers=")) ?? "";
  }
  if (harnessId === "claude-code") {
    return fs.readFile(path.join(executionRuntime, "claude-resident-mcp.json"), "utf8");
  }
  if (harnessId === "pi") return plan.env.SCIENCEEVOLVE_PI_MCP_CONFIG ?? "";
  return fs.readFile(path.join(executionRuntime, "dsh-resident.patch.yml"), "utf8");
}

async function openSentinelMcpServer(sentinel: string): Promise<{
  url: string;
  hits(): number;
  close(): Promise<void>;
}> {
  let hits = 0;
  const server = createServer((request, response) => {
    hits += 1;
    request.resume();
    void fs.writeFile(sentinel, "escaped");
    response.writeHead(200, { "content-type": "application/json" });
    response.end("{}");
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    await closeTestServer(server);
    throw new Error("malicious MCP fixture did not listen");
  }
  return {
    url: `http://127.0.0.1:${address.port}/mcp`,
    hits: () => hits,
    close: () => closeTestServer(server)
  };
}

interface TestInvocationRoute extends InvocationGatewayRoute {
  closed: boolean;
  hits: number;
}

async function openTestInvocationRoute(
  protocol: HarnessAdapter["descriptor"]["nativeProtocol"],
  token: string,
  nativeReply?: string
): Promise<TestInvocationRoute> {
  let route!: TestInvocationRoute;
  const server = createServer((request, response) => {
    route.hits += 1;
    request.resume();
    if (nativeReply) {
      response.writeHead(200, { "content-type": "text/event-stream" });
      response.write(`data: ${JSON.stringify({ id: "local-fixture", object: "chat.completion.chunk", created: 1, model: "fixture-model",
        choices: [{ index: 0, delta: { role: "assistant", content: nativeReply }, finish_reason: null }] })}\n\n`);
      response.write(`data: ${JSON.stringify({ id: "local-fixture", object: "chat.completion.chunk", created: 1, model: "fixture-model",
        choices: [{ index: 0, delta: {}, finish_reason: "stop" }] })}\n\n`);
      response.end("data: [DONE]\n\n"); return;
    }
    response.writeHead(200, { "content-type": "application/json" });
    response.end("{}");
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("fixture route did not listen");
  const baseUrl = `http://127.0.0.1:${address.port}/v1`;
  const close = async () => {
    if (route.closed) return;
    route.closed = true;
    await closeTestServer(server);
  };
  route = {
    baseUrl,
    token,
    sourceProtocol: protocol,
    targetProtocol: protocol,
    proxy: {
      baseUrl,
      token,
      close,
      getFailure: () => undefined,
      resetFailure: () => undefined
    },
    getFailure: () => undefined,
    resetFailure: () => undefined,
    close,
    closed: false,
    hits: 0
  } as TestInvocationRoute;
  return route;
}

function stableGatewayFromEnvironment(
  protocol: HarnessAdapter["descriptor"]["nativeProtocol"],
  environment: NodeJS.ProcessEnv
): {
  baseUrl: string;
  endpoint: string;
  token: string;
  headers: Record<string, string>;
} {
  if (protocol === "anthropic-messages") {
    const baseUrl = environment.ANTHROPIC_BASE_URL!;
    const token = environment.ANTHROPIC_AUTH_TOKEN!;
    return {
      baseUrl: `${baseUrl}/v1`,
      endpoint: `${baseUrl}/v1/messages`,
      token,
      headers: { "x-api-key": token, "content-type": "application/json" }
    };
  }
  const baseUrl = environment.OPENAI_BASE_URL!;
  const token = environment.OPENAI_API_KEY!;
  const suffix = protocol === "responses" ? "responses" : "chat/completions";
  return {
    baseUrl,
    endpoint: `${baseUrl}/${suffix}`,
    token,
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }
  };
}

async function closeTestServer(server: Server): Promise<void> {
  if (!server.listening) return;
  await new Promise<void>((resolve) => server.close(() => resolve()));
}

function processAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function randomSuffix(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function openStdioRpc(command: string, args: string[]): Promise<{
  request(method: string, params?: Record<string, unknown>): Promise<Record<string, unknown>>;
  close(): Promise<void>;
}> {
  const child = spawn(command, args, { stdio: ["pipe", "pipe", "pipe"] });
  const lines = readline.createInterface({ input: child.stdout });
  const pending: Array<(value: Record<string, unknown>) => void> = [];
  lines.on("line", (line) => pending.shift()?.(JSON.parse(line) as Record<string, unknown>));
  let nextId = 0;
  return {
    request: async (method, params = {}) => {
      const response = new Promise<Record<string, unknown>>((resolve) => pending.push(resolve));
      child.stdin.write(`${JSON.stringify({
        jsonrpc: "2.0",
        id: ++nextId,
        method,
        params
      })}\n`);
      return response;
    },
    close: async () => {
      child.stdin.end();
      await new Promise<void>((resolve, reject) => {
        child.once("error", reject);
        child.once("close", (code) => code === 0
          ? resolve()
          : reject(new Error(`resident control proxy exited ${code}`)));
      });
    }
  };
}
