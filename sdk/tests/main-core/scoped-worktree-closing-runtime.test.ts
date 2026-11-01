import { promises as fs } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { CollaborationStateDatabase } from "../../src/core/collaboration-state/store.js";
import { DatabaseSync } from "node:sqlite";
import { afterEach, describe, expect, it, vi } from "vitest";
// These cases create real Git repositories and persist SQLite recovery facts.
// Use the same bounded integration budget as the SDK host, rather than the
// five-second unit default (observed Git cases take 6-11s during full runs).
vi.setConfig({ testTimeout: process.platform === "win32" ? 60_000 : 30_000 });

import { CollaborationRuntimeCoordinator, ProductionCollaborationExecutionInputBuilder } from "../../src/core/collaboration-runtime.js";
import { ScopedWorktreeClosingRuntime } from "../../src/core/scoped-worktree-closing-runtime.js";
import { ScopedProjectRuntime } from "../../src/core/scoped-project-runtime.js";
import { ScopedAgentExecutionRunner, ScopedAgentTurnFailure } from "../../src/core/scoped-agent-execution.js";
import { ScopedWorkflowRuntime, type ScopedWorkflowGit } from "../../src/core/scoped-workflow-runtime.js";
import { ControlActionService, readStagedControlActions } from "../../src/core/orchestration-control-bridge.js";
import { HarnessRuntimeFacade } from "../../src/core/harness-runtime/runtime.js";
import { controlResultReceipts, controlResultMarker } from "../../src/core/control-result-receipts.js";
import { GitInputError } from "../../src/core/collaboration-git/errors.js";
import type { AgentRunRequest, ControlAction } from "../../src/core/types.js";
import type { CollaborationResidentHandle, CollaborationResidentOpenInput } from "../../src/core/collaboration-runtime.js";
import { P, authorizedClosingFixture, openedClosingFixture, cleanupClosingFixtures } from "./helpers/scoped-worktree-closing-fixture.js";

afterEach(cleanupClosingFixtures);

async function fixture(options: {
  original?: Awaited<ReturnType<typeof authorizedClosingFixture>>;
  opened?: (input: CollaborationResidentOpenInput) => Promise<void>;
  actions?: ControlAction[];
  output?: string;
  beforeReturn?: () => Promise<void>;
  beforeActions?: () => Promise<void>;
  afterReturn?: () => Promise<void>;
  close?: () => Promise<void>;
  receiveResults?: boolean;
  stop?: (runtimePath: string) => { stopped: boolean; evidence: Record<string, unknown> };
} = {}) {
  const f = options.original ?? await authorizedClosingFixture(), residents = new Map<string, CollaborationResidentHandle>();
  const receipts = new Map<string, ReturnType<typeof controlResultReceipts>>();
  let authority: Awaited<ReturnType<NonNullable<CollaborationResidentOpenInput["controlAuthorityFactory"]>>> | undefined;
  let request: AgentRunRequest | undefined;
  const handle = { submit: vi.fn(async turn => {
    const input = launcher.open.mock.calls.at(-1)![0];
    authority = await input.controlAuthorityFactory!({ request: input.request, turn });
    const service = new ControlActionService({ projectId: P, agent: "worker", invocationId: turn.invocationId,
      capability: authority.control.capability, capabilityHash: authority.control.capabilityHash,
      stateVersion: authority.control.stateVersion, stagingPath: authority.control.stagingPath,
      revalidate: authority.revalidate, execute: authority.execute,
      onResult: async result => {
        const id = await input.request.onControlResult!(result, f.session);
        if (options.receiveResults) {
          const native = { invocationId: input.request.invocationId, harnessId: f.session.harnessId, eventId: `actual-${result.requestedCallId}`,
            tool: { callId: `native-${result.requestedCallId}`, name: result.envelope.action.tool, server: "openfars-resident-control",
              toolType: "mcp", input: { callId: result.requestedCallId } } };
          await input.request.onOfficialHarnessEvent!({ ...native, kind: "tool.started" }, f.session);
          await input.request.onOfficialHarnessEvent!({ ...native, kind: "tool.completed", eventId: `received-${result.requestedCallId}`,
            tool: { ...native.tool, outputPreview: controlResultMarker(id) } }, f.session);
        }
        return id;
      } });
    await options.beforeActions?.();
    for (const [index, action] of (options.actions ?? [
      { tool: "git_push", reason: "My necessary original Memory" },
      { tool: "github_create_pr", base: f.db.scopedGroupRun(P, "run-G")!.groupBranch, title: "My separate B", body: "Original Memory" },
      { tool: "finish_task", summary: "My actual independent closing", memory: "Supplemental Memory receipt" }
    ]).entries()) await service.stageWithResult(authority.control.capability, `call-${index}`, action);
    await options.beforeReturn?.();
    return { handoff: options.output ?? "My original Memory was published as separate B; its merge is still unresolved." };
  }), close: vi.fn(async () => { await options.close?.(); }), pause: vi.fn(async () => {}), resume: vi.fn(async () => {}) };
  const launcher = { stopScopedForRecovery: vi.fn(async input => options.stop?.(input.executionRuntimePath) ??
    { stopped: true, evidence: { exactNativeRuntimeCleared: input.executionRuntimePath } }),
    open: vi.fn(async (input: CollaborationResidentOpenInput) => {
      await input.sameEpochReopen!.revalidate();
      await options.opened?.(input);
      await input.onOpened!();
      await input.request.onResidentNativeOpened!({ runtimePath: input.executionRuntimePath, session: f.session });
      return handle;
    }) };
  const boundGit: ReturnType<typeof f.makeGit>[] = [], controller = new AbortController();
  const runtimeOptions: ConstructorParameters<typeof ScopedWorktreeClosingRuntime>[0] = {
    state: f.state, database: f.db, storage: f.storage, launcher, signal: controller.signal, repository: f.repository,
    observeGit: f.ordinaryGit, gitForClosing: turn => {
      const bound = f.makeGit({ invocationId: turn.invocationId, capabilityHash: turn.capabilityHash,
        scope: { kind: turn.kind, reportHeadSha: turn.reportHeadSha, paths: turn.paths } });
      boundGit.push(bound); return bound.git;
    }, assertCurrent: f.assertCurrent, wait: vi.fn(async () => {}), publish: vi.fn(async () => {}),
    filesystem: async () => ({ serviceUserRoot: f.root, projectWorktreeRoot: f.worktree, protectedRoots: [f.projectPath] }),
    decorate: req => {
      request = req;
      req.onResidentNativeOpened = ({ runtimePath, session }) => {
        f.db.recordAgentNativeSessionBinding({ ...f.binding, invocationId: req.invocationId, runtimePath, session });
        receipts.set(req.invocationId, controlResultReceipts(f.db, { projectId: P, agentId: "worker", invocationId: req.invocationId,
          session, executionContext: req.executionContext }));
      };
      req.onControlResult = result => receipts.get(req.invocationId)!.record(result);
      req.onOfficialHarnessEvent = event => { receipts.get(req.invocationId)!.observeNative(event); };
    }, trace: () => () => {}, turnRequestFactory: () => async () => { throw Error("No second native input authorized by this fixture"); },
    hasResident: key => residents.has(key), register: (key, resident) => { residents.set(key, resident); }, unregister: key => { residents.delete(key); },
    submit: async (resident, turn, retain) => {
      const result = await resident.submit(turn); await retain(result); await options.afterReturn?.(); return result;
    }
  };
  return { ...f, runtime: new ScopedWorktreeClosingRuntime(runtimeOptions), runtimeOptions, launcher, handle, boundGit, residents, controller,
    request: () => request!, authority: () => authority!, receipts };
}

function freeze(databasePath: string) {
  const raw = new DatabaseSync(databasePath);
  try { raw.prepare("UPDATE project_heads SET frozen = 1 WHERE project_id = ?").run(P); } finally { raw.close(); }
}

function authorizeNextClosing(f: Awaited<ReturnType<typeof fixture>>) {
  const invocationId = "inv_next_formal_manager", claim = f.db.claimScopedLeaderTurn({ projectId: P, groupRunId: "run-G", agentId: "main", invocationId,
    runtimePath: path.join(f.projectPath, "runtime", invocationId), allowStoppedRepairFaults: true })!;
  const identity = { projectId: P, groupRunId: "run-G", agentId: "main", invocationId, coordinatorEpoch: claim.coordinatorEpoch };
  f.db.markScopedLeaderOpened(identity);
  const envelope = (action: ControlAction, callId: string) => ({ projectId: P, agent: "main", invocationId, callId,
    stateVersion: claim.coordinatorEpoch, capabilityHash: "d".repeat(64), receivedAt: f.time(), action });
  f.db.recordScopedLeaderTaskCompletion({ ...identity, envelope: envelope({ tool: "finish_task", summary: "My follow-up coordination" }, "finish") });
  const input = { ...identity, residentStopConfirmed: true as const, envelope: envelope({ tool: "coordinate_group_task", groupRunId: "run-G",
    coordinatorEpoch: claim.coordinatorEpoch, arrivalRequestId: f.execution.arrivalRequestId, operation: "close_worktree",
    rationale: "Inspect the returned original facts and finish only the authorized Memory delivery once", closing: { executionId: f.execution.id, ownershipEpoch: 1, paths: f.files } }, "close") };
  return { identity, input, accept: () => { f.db.acceptScopedLeaderAction(input); f.db.releaseScopedLeaderTurn({ ...identity, residentStopConfirmed: true }); } };
}

function closingHierarchyDecision(f: Awaited<ReturnType<typeof fixture>>, globalMain = false) {
  const invocationId = globalMain ? "inv_final_global" : "inv_final_leader";
  const claim = f.db.claimScopedLeaderTurn({ projectId: P, groupRunId: "run-G", agentId: "main", invocationId,
    runtimePath: path.join(f.projectPath, "runtime", invocationId), globalMain, allowStoppedRepairFaults: true })!;
  const identity = { projectId: P, groupRunId: "run-G", agentId: "main", invocationId, coordinatorEpoch: claim.coordinatorEpoch, globalMain };
  f.db.markScopedLeaderOpened(identity);
  const envelope = (action: ControlAction, callId: string) => ({ projectId: P, agent: "main", invocationId, callId,
    stateVersion: claim.coordinatorEpoch, capabilityHash: "d".repeat(64), receivedAt: f.time(), action });
  f.db.recordScopedLeaderTaskCompletion({ ...identity, envelope: envelope({ tool: "finish_task", summary: "My factual original closing escalation" }, "finish") });
  const action: ControlAction = globalMain ? { tool: "request_user", message: "Original closing remains unresolved", rationale: "Preserve the original files and actual A/B facts" }
    : { tool: "coordinate_group_task", groupRunId: "run-G", coordinatorEpoch: claim.coordinatorEpoch, arrivalRequestId: f.execution.arrivalRequestId,
      operation: "escalate", rationale: "My original Agent's actual return remains unresolved; preserve all facts" };
  f.db.acceptScopedLeaderAction({ ...identity, residentStopConfirmed: true, envelope: envelope(action, "decision") });
  f.db.releaseScopedLeaderTurn({ ...identity, residentStopConfirmed: true });
}

describe("original-session production closing dispatcher", () => {
  const deliveredActions: ControlAction[] = [{ tool: "git_push", reason: "My necessary original Memory" },
    { tool: "github_create_pr", base: "groups/run-G", title: "My independent B", body: "My necessary original Memory" },
    { tool: "github_merge_pr", providerNumber: 11 }, { tool: "finish_task", summary: "I observed my B merge and synchronization" }];

  it.each(["filesystem", "native-preparation"] as const)("refreshes exact Git facts after delayed %s before the original closing input", async boundary => {
    const original = await authorizedClosingFixture({ originalStatus: "completed", businessDelivery: true, nextArrival: true });
    const f = await fixture({ original, actions: [{ tool: "finish_task", summary: "I inspected the original Memory; delivery is still pending" }],
      receiveResults: true, output: "My original Memory remains preserved; its delivery is unresolved.",
      opened: async input => {
        if (boundary === "native-preparation") {
          f.advance(65_000);
          await input.sameEpochReopen!.revalidate();
        }
      } });
    if (boundary === "filesystem") {
      const filesystem = f.runtimeOptions.filesystem;
      f.runtimeOptions.filesystem = async () => { f.advance(65_000); return filesystem(); };
    }
    const before = f.snapshot();
    await f.runtime.advance();
    expect(f.handle.submit).toHaveBeenCalledTimes(1);
    const [turn] = f.db.scopedWorktreeClosingTurns(P);
    expect(turn).toMatchObject({ status: "stopped", result: { output: "My original Memory remains preserved; its delivery is unresolved." } });
    expect(turn!.completion).toBeDefined();
    expect(f.db.scopedWorktreeClosingSettlements(P)).toEqual([]);
    expect(f.db.scopedWorktreeClosingOperations(P, turn!.invocationId)).toEqual([]);
    expect(f.db.eventsAfter(P).filter(event => event.type === "control.result.received")).toHaveLength(1);
    expect(f.launcher.open.mock.calls[0]![0].request).toMatchObject({ sessionContinuity: "strict", resumeThreadId: f.session.nativeId });
    expect(f.snapshot()).toEqual(before);
    expect(f.db.projectState(P).scopedArrivals!.find(arrival => arrival.targetNodeId === "G_worker_next")!.status).toBe("queued");
  });

  it.each(["late-file", "revoked-authority"] as const)("refuses a changed closing boundary after delayed preparation (%s)", async fault => {
    const original = await authorizedClosingFixture({ originalStatus: "completed", businessDelivery: true, nextArrival: true });
    const f = await fixture({ original, actions: deliveredActions, receiveResults: true,
      opened: async input => {
        f.advance(65_000);
        if (fault === "late-file") await fs.writeFile(path.join(f.worktree, "unrelated.txt"), "Uncertain late source\n");
        else {
          const read = f.ordinaryGit.observeRestrictedWorktreeClosing.bind(f.ordinaryGit);
          vi.spyOn(f.ordinaryGit, "observeRestrictedWorktreeClosing").mockImplementation(async (...args) => {
            const observation = await read(...args);
            f.revoke();
            return observation;
          });
        }
        await input.sameEpochReopen!.revalidate();
      } });
    const before = f.snapshot();
    if (fault === "revoked-authority") await expect(f.runtime.advance()).rejects.toThrow("Revoked original native control");
    else await f.runtime.advance();
    expect(f.handle.submit).not.toHaveBeenCalled();
    const [turn] = f.db.scopedWorktreeClosingTurns(P);
    expect(turn).toMatchObject({ status: "stopped" });
    expect(turn!.openedAt).toBeUndefined();
    expect(f.db.scopedWorktreeClosingOperations(P, turn!.invocationId)).toEqual([]);
    expect(f.db.eventsAfter(P).some(event => event.type === "agent.worktree_closing.failed")).toBe(true);
    expect(f.snapshot()).toEqual(before);
    expect(f.db.projectState(P).scopedArrivals!.find(arrival => arrival.targetNodeId === "G_worker_next")!.status).toBe("queued");
    if (fault === "late-file") expect(await fs.readFile(path.join(f.worktree, "unrelated.txt"), "utf8")).toBe("Uncertain late source\n");
  });

  it.each(["completed", "failed"] as const)("uses production Coordinator Git factories and official native receipt callbacks to settle %s", async status => {
    let f!: Awaited<ReturnType<typeof fixture>>, coordinator!: CollaborationRuntimeCoordinator;
    const factories: unknown[] = [], targetReads: unknown[] = [];
    const original = await authorizedClosingFixture({ originalStatus: status, businessDelivery: true, openDatabase: async input => {
      const builder = new ProductionCollaborationExecutionInputBuilder(input.storage, { list: vi.fn(async () => []), resolveConfigured: vi.fn(async () => []) } as never);
      coordinator = new CollaborationRuntimeCoordinator({ ...input, serviceId: "test", hostId: "test", leaseDurationMs: 600_000, serviceUserRoot: input.storage.projectsDir(),
        executionInputBuilder: builder, residentLauncher: { open: async request => f.launcher.open(request),
          stopScopedForRecovery: async request => f.launcher.stopScopedForRecovery(request) },
        gitFactory: options => {
          factories.push(options); const git = f.makeGit(undefined, options.operationStore).git, observe = git.observeRestrictedWorktreeClosingTarget.bind(git);
          git.observeRestrictedWorktreeClosingTarget = (...args) => { targetReads.push(args); return observe(...args); }; return git;
        } });
      await coordinator.initialize(); return (coordinator as any).database();
    } });
    f = await fixture({ original, actions: deliveredActions, receiveResults: true, output: "I delivered B and received its actual merge and synchronization in my original Session." });
    f.state.operations = [{ id: "fixture-repository", kind: "repository.create", status: "finalized", remoteFact: { ...f.repository,
      provider: "github", providerId: 1, cloneUrl: "https://github.com/example/project.git" } }] as never;
    const before = f.snapshot();
    try {
      const runtime: ScopedWorktreeClosingRuntime = (coordinator as any).worktreeClosingRuntime(f.state, f.controller.signal);
      await runtime.advance();
      expect(f.db.scopedWorktreeClosingSettlements(P)).toHaveLength(1); expect(f.db.scopedWorktreeClosingCandidates(P)).toEqual([]);
      expect(f.db.eventsAfter(P).filter(event => event.type === "control.result.received")).toHaveLength(4);
      expect(factories).toHaveLength(2); expect(targetReads).toHaveLength(1); expect(f.handle.close).toHaveBeenCalledTimes(1); expect(f.launcher.open).toHaveBeenCalledTimes(1);
      expect(f.launcher.open.mock.calls[0]![0].request).toMatchObject({ sessionContinuity: "strict", resumeThreadId: f.session.nativeId });
      if (status === "completed") expect(f.snapshot()).toEqual(before); else expect(f.snapshot().slice(1)).toEqual(before.slice(1));
      expect(f.db.scopedExecution(P, f.execution.id)?.status).toBe("completed");
      await runtime.advance(); expect(f.launcher.open).toHaveBeenCalledTimes(1);
    } finally { f.controller.abort(); await coordinator.shutdown(); }
  }, process.platform === "win32" ? 120_000 : 30_000);

  it("retains an unopened successor reservation through exact supervisor Stop and starts its retry from the actually settled B target", async () => {
    const original = await authorizedClosingFixture({ originalStatus: "completed", businessDelivery: true, nextArrival: true, identify: false });
    const f = await fixture({ original, actions: deliveredActions, receiveResults: true });
    const arrival = f.db.projectState(P).scopedArrivals!.find(entry => entry.targetNodeId === "G_worker_next")!;
    const next = f.db.claimScopedAgentArrival({ projectId: P, arrivalRequestId: arrival.requestId, agentId: "worker",
      executionId: "next", worktreePath: f.worktree })!.execution;
    const invocationId = "inv_reserved_next", runtimePath = path.join(f.projectPath, "runtime", invocationId);
    const baseCommit = f.rawGit(["rev-parse", "refs/heads/groups/run-G"]);
    f.db.beginScopedAgentTurn({ projectId: P, executionId: next.id, ownershipEpoch: 1, invocationId, runtimePath, baseCommit });
    const reservation = f.db.scopedAgentTurn(P, next.id, 1)!, originalReport = f.db.scopedAgentReport(P, f.execution.id, 1);
    expect(reservation).toMatchObject({ status: "reserved", baseCommit }); expect(reservation.openedAt).toBeUndefined();
    expect(f.rawGit(["for-each-ref", "--format=%(objectname)", "refs/heads/executions/next"])).toBe("");
    await f.runtime.discover(); expect(f.db.scopedWorktreeClosingCandidates(P)).toEqual([]);
    let stopped = false;
    f.launcher.stopScopedForRecovery.mockImplementation(async input => ({ stopped, evidence: {
      protocol: "scoped-supervisor-stop-v1", projectId: P, scopeId: input.scopeId, agentId: input.agentId,
      role: input.role, ownershipEpoch: input.ownershipEpoch, runtimePath: input.executionRuntimePath, nativeProcessScanCleared: stopped
    } }));
    const project = new ScopedProjectRuntime({ database: f.db, state: f.state, storage: f.storage, git: f.ordinaryGit,
      repository: { ...f.repository, provider: "github", providerId: 1, cloneUrl: "https://github.com/example/project.git" },
      launcher: f.launcher, signal: f.controller.signal, filesystem: f.runtimeOptions.filesystem, decorate: f.runtimeOptions.decorate,
      trace: f.runtimeOptions.trace, publish: f.runtimeOptions.publish, submit: f.runtimeOptions.submit,
      register: f.runtimeOptions.register, unregister: f.runtimeOptions.unregister,
      managementInputs: async () => { throw Error("No management native call authorized by this preparation test"); } });
    const before = f.db.projectState(P);
    await expect(project.reconcileResidents()).rejects.toThrow("stop remains unconfirmed");
    expect(f.db.projectState(P)).toEqual(before); expect(f.launcher.open).not.toHaveBeenCalled();
    stopped = true; await project.reconcileResidents();
    const retained = f.db.scopedAgentTurn(P, next.id, 1)!;
    expect(retained).toMatchObject({ ...reservation, status: "stopped" }); expect(retained.openedAt).toBeUndefined();
    expect(retained.stoppedAt).toBeTruthy(); expect(f.db.scopedExecution(P, next.id)?.status).toBe("failed");
    expect(f.db.scopedAgentRecoveredForCurrentWriter(P, next.id, 1, invocationId)).toBe(true);
    expect(f.launcher.stopScopedForRecovery.mock.calls.some(([input]) => input.scopeId === next.id &&
      input.ownershipEpoch === 1 && input.executionRuntimePath === runtimePath)).toBe(true);
    const recoveredEvents = f.db.eventsAfter(P), stopCalls = f.launcher.stopScopedForRecovery.mock.calls.length;
    await project.reconcileResidents(); expect(f.db.eventsAfter(P)).toEqual(recoveredEvents);
    expect(f.launcher.stopScopedForRecovery).toHaveBeenCalledTimes(stopCalls); expect(f.launcher.open).not.toHaveBeenCalled();
    await f.runtime.discover(); expect(f.db.scopedWorktreeClosingCandidates(P)).toHaveLength(1);
    const retryInput = { projectId: P, executionId: next.id, arrivalRequestId: arrival.requestId, failedOwnershipEpoch: 1 };
    const blocked = f.db.projectState(P);
    expect(f.db.retryScopedAgentArrival(retryInput)).toBeUndefined();
    expect(f.db.retryScopedAgentArrival(retryInput)).toBeUndefined();
    expect(f.db.projectState(P)).toEqual(blocked);
    authorizeNextClosing(f).accept(); await f.runtime.advance();
    const [settled] = f.db.scopedWorktreeClosingSettlements(P); expect(settled).toBeTruthy();
    expect(settled!.target.localHead).not.toBe(baseCommit); expect(settled!.delivery.supplement).toBeTruthy();
    expect(f.db.scopedAgentTurn(P, next.id, 1)).toEqual(retained);
    expect(f.db.scopedAgentReport(P, f.execution.id, 1)).toEqual(originalReport);
    expect(f.db.scopedAgentReport(P, next.id, 1)).toBeUndefined(); expect(f.db.scopedAgentMechanismRepairCount(P, next.id)).toBe(0);
    expect(f.db.scopedExecution(P, next.id)).toMatchObject({ status: "failed", ownershipEpoch: 1, arrivalRequestId: arrival.requestId });
    const admitted = f.db.retryScopedAgentArrival(retryInput)!;
    expect(admitted.replay).toBe(false);
    const retry = admitted.execution;
    expect(retry.ownershipEpoch).toBe(2);
    expect(f.db.retryScopedAgentArrival(retryInput)).toMatchObject({ replay: true, execution: retry });
    expect(f.db.eventsAfter(P).filter(event => event.type === "scoped.agent.retrying")).toHaveLength(1);
    const deliveredMemory = await fs.readFile(f.memory, "utf8");
    const opened = vi.fn(async (input: import("../../src/core/scoped-agent-execution.js").ScopedAgentTurnInput) => {
      expect(input.baseCommit).toBe(settled!.target.localHead);
      expect(f.rawGit(["rev-parse", "HEAD"], f.worktree)).toBe(settled!.target.localHead);
      expect(f.rawGit(["symbolic-ref", "--short", "HEAD"], f.worktree)).toBe(next.executionBranch);
      expect(await fs.readFile(path.join(f.worktree, f.files[0]!), "utf8")).toBe(deliveredMemory);
      input.onOpened(); throw new ScopedAgentTurnFailure("Stopped at the verified next business boundary", true);
    });
    const runner = new ScopedAgentExecutionRunner(f.db, f.ordinaryGit, { invoke: opened }, () => f.projectPath, { automaticCheckpoint: false });
    await expect(runner.prepareDelivery({ projectId: P, executionId: next.id, ownershipEpoch: retry.ownershipEpoch,
      repository: { ...f.repository, provider: "github", providerId: 1, cloneUrl: "https://github.com/example/project.git" } }))
      .rejects.toThrow("Stopped at the verified next business boundary");
    expect(opened).toHaveBeenCalledTimes(1); expect(f.db.scopedAgentTurn(P, next.id, 1)).toEqual(retained);
    expect(f.db.scopedAgentTurn(P, next.id, 2)).toMatchObject({ baseCommit: settled!.target.localHead, status: "stopped" });
    expect(f.db.scopedAgentReport(P, f.execution.id, 1)).toEqual(originalReport);
    expect(f.rawGit(["rev-parse", "refs/heads/executions/original"])).toBe(settled!.delivery.supplement!.headSha);
    expect(f.db.projectState(P).scopedArrivals!.filter(entry => entry.targetNodeId === "G_worker_next")).toHaveLength(1);
  }, process.platform === "win32" ? 120_000 : 30_000);

  it.each(["completed", "failed"] as const)("settles actual %s A/B receipts only after native return, close and final readonly verification", async status => {
    const original = await authorizedClosingFixture({ originalStatus: status, businessDelivery: true });
    const f = await fixture({ original, actions: deliveredActions, receiveResults: true, output: "I merged my independent Memory B in PR 11 and received its exact local synchronization." });
    const before = f.snapshot();
    await f.runtime.advance();
    const [settled] = f.db.scopedWorktreeClosingSettlements(P);
    expect(settled).toMatchObject({ originalStatus: status, reportHeadSha: f.A,
      delivery: { business: { pullRequest: { providerNumber: 1, headSha: f.A } }, supplement: { pullRequest: { providerNumber: 11, status: "merged" } } } });
    expect(f.launcher.open).toHaveBeenCalledTimes(1); expect(f.handle.close).toHaveBeenCalledTimes(1); expect(f.residents.size).toBe(0);
    expect(f.db.scopedWorktreeClosingReturn(P, settled!.invocationId)).toBeUndefined();
    expect(f.db.scopedWorktreeClosingCandidates(P)).toEqual([]);
    if (status === "completed") expect(f.snapshot()).toEqual(before); else expect(f.snapshot().slice(1)).toEqual(before.slice(1));
    expect(f.db.scopedExecution(P, f.execution.id)?.status).toBe("completed");
    expect(f.request().resumeThreadId).toBe(f.session.nativeId);
    const events = f.db.eventsAfter(P), closed = events.find(event => event.type === "scoped.worktree_closing.native.stopped")!;
    expect(events.find(event => event.type === "scoped.worktree_closing.settled")!.seq).toBeGreaterThan(closed.seq);
    const counts = [events.length, f.launcher.open.mock.calls.length, f.launcher.stopScopedForRecovery.mock.calls.length];
    await f.runtime.advance();
    expect([f.db.eventsAfter(P).length, f.launcher.open.mock.calls.length, f.launcher.stopScopedForRecovery.mock.calls.length]).toEqual(counts);
  }, process.platform === "win32" ? 120_000 : 30_000);

  it.each(["completed", "failed"] as const)("does not rediscover settled %s B, but requires a fresh grant for an actual later leftover", async status => {
    let f!: Awaited<ReturnType<typeof fixture>>, deliveredMemory = "";
    const actions = structuredClone(deliveredActions);
    f = await fixture({ original: await authorizedClosingFixture({ originalStatus: status, businessDelivery: true }), actions, receiveResults: true,
      output: "I preserved my delivered B and inspected the current authorized files.",
      beforeReturn: async () => { if (f.db.scopedWorktreeClosingTurns(P).length === 2) await fs.writeFile(f.memory, deliveredMemory); } });
    await f.runtime.advance(); expect(f.db.scopedWorktreeClosingSettlements(P)).toHaveLength(1);
    deliveredMemory = await fs.readFile(f.memory, "utf8"); const original = f.db.scopedAgentReport(P, f.execution.id, 1);
    await f.runtime.discover(); await f.runtime.advance(); expect(f.db.scopedWorktreeClosingCandidates(P)).toEqual([]);
    expect(f.launcher.open).toHaveBeenCalledTimes(1);
    await fs.appendFile(f.memory, "New actual late temporary line\n");
    await f.runtime.discover(); const [candidate] = f.db.scopedWorktreeClosingCandidates(P);
    expect(candidate).toMatchObject({ originalStatus: "completed", reportInvocationId: "inv_original", originalSession: f.session });
    expect(candidate!.incidentId).not.toBe(f.db.scopedWorktreeClosingSettlements(P)[0]!.incidentId);
    await f.runtime.advance(); expect(f.launcher.open).toHaveBeenCalledTimes(1);
    actions.splice(0, actions.length, { tool: "finish_task", summary: "I inspected and removed only my late temporary line; B remains delivered" });
    authorizeNextClosing(f).accept(); await f.runtime.advance();
    expect(f.launcher.open).toHaveBeenCalledTimes(2); expect(f.db.scopedWorktreeClosingSettlements(P)).toHaveLength(2);
    expect(f.db.scopedWorktreeClosingCandidates(P)).toEqual([]); expect(f.db.scopedAgentReport(P, f.execution.id, 1)).toEqual(original);
    expect(f.boundGit.reduce((count, bound) => count + bound.provider.mergePullRequest.mock.calls.length, 0)).toBe(1);
    expect(await fs.readFile(f.memory, "utf8")).toBe(deliveredMemory);
    await f.runtime.discover(); await f.runtime.advance(); expect(f.launcher.open).toHaveBeenCalledTimes(2);
  }, process.platform === "win32" ? 120_000 : 30_000);

  it("holds FIFO when the final fresh Supervisor scan cannot prove Stop despite complete A/B receipts", async () => {
    const original = await authorizedClosingFixture({ businessDelivery: true });
    const f = await fixture({ original, actions: deliveredActions, receiveResults: true, stop: runtime => runtime === original.originalStop.runtimePath
      ? { stopped: true, evidence: { originalStopped: true } } : { stopped: false, evidence: { currentNativeUncertain: true } } });
    await expect(f.runtime.advance()).rejects.toThrow("Stop remains unproven");
    expect(f.handle.close).toHaveBeenCalledTimes(1); expect(f.db.scopedWorktreeClosingSettlements(P)).toEqual([]);
    expect(f.db.scopedWorktreeClosingCandidates(P)).toHaveLength(1); expect(f.db.scopedExecution(P, f.execution.id)?.status).toBe("failed");
  }, process.platform === "win32" ? 120_000 : 30_000);

  it("settles B across two fresh formal calls only after the second original native input receives the first call's exact results", async () => {
    let f!: Awaited<ReturnType<typeof fixture>>;
    const options = { original: await authorizedClosingFixture({ businessDelivery: true }), actions: structuredClone(deliveredActions), receiveResults: false,
      output: "My original B results and the actual latest merge are preserved.", beforeActions: async () => {
        const turns = f.db.scopedWorktreeClosingTurns(P); if (turns.length !== 2) return;
        const second = turns[1]!, receipts = f.receipts.get(second.invocationId)!;
        const notification = receipts.prepareNotification(f.handle.submit.mock.calls.at(-1)![0].inputId);
        expect(notification).toContain(turns[0]!.invocationId);
        receipts.observeNative({ invocationId: second.invocationId, harnessId: f.session.harnessId, kind: "user.message",
          eventId: "actual-second-original-native-input", message: notification, sourceType: "native.input" });
      } };
    options.actions.splice(2, 1); f = await fixture(options); const before = f.snapshot();
    await f.runtime.advance(); const first = f.db.scopedWorktreeClosingTurns(P)[0]!;
    expect(f.db.scopedWorktreeClosingSettlements(P)).toEqual([]); expect(f.db.scopedWorktreeClosingReturn(P, first.invocationId)).toBeDefined();
    expect(f.db.scopedRecoveryCandidates(P, "run-G")[0]!.closingAttempts![0]!.results.every(result => !result.received)).toBe(true);
    authorizeNextClosing(f).accept(); options.receiveResults = true;
    options.actions.splice(0, options.actions.length, { tool: "git_push", reason: "Confirm my same exact original B" },
      { tool: "github_merge_pr", providerNumber: 11 }, { tool: "finish_task", summary: "I received the original results and my exact B merge/sync" });
    await f.runtime.advance();
    expect(f.launcher.open).toHaveBeenCalledTimes(2); expect(f.db.scopedWorktreeClosingSettlements(P)).toHaveLength(1);
    const settled = f.db.scopedWorktreeClosingSettlements(P)[0]!;
    expect(settled.invocationId).not.toBe(first.invocationId); expect(settled.delivery.supplement!.createOperationId).toContain(first.invocationId);
    expect(settled.delivery.supplement!.mergeOperationId).toContain(settled.invocationId);
    expect(f.db.scopedWorktreeClosingCandidates(P)).toEqual([]); expect(f.snapshot().slice(1)).toEqual(before.slice(1));
    expect(f.db.scopedAgentMechanismRepairCount(P, f.execution.id)).toBe(0);
  }, process.platform === "win32" ? 120_000 : 30_000);

  it.each(["authorized-late-write", "extra-late-write", "target-read-failure"])("returns actual %s after Stop to the original Leader while keeping FIFO blocked", async fault => {
    const original = await authorizedClosingFixture({ businessDelivery: true });
    const f = await fixture({ original, actions: deliveredActions, receiveResults: true, output: "My B was delivered; inspect the actual final verification result." });
    const observe = f.ordinaryGit.observeRestrictedWorktreeClosingTarget.bind(f.ordinaryGit);
    vi.spyOn(f.ordinaryGit, "observeRestrictedWorktreeClosingTarget").mockImplementation(async (...args) => {
      expect(f.handle.close).toHaveBeenCalledTimes(1);
      if (fault === "target-read-failure") throw new GitInputError("Actual group-target read failed after Stop");
      const result = await observe(...args);
      await fs.appendFile(fault === "authorized-late-write" ? f.memory : path.join(f.worktree, "late-extra.txt"), "Actual late write after Stop\n");
      return result;
    });
    await f.runtime.advance();
    expect(f.db.scopedWorktreeClosingSettlements(P)).toEqual([]); expect(f.db.scopedExecution(P, f.execution.id)?.status).toBe("failed");
    expect(f.db.scopedWorktreeClosingCandidates(P)).toHaveLength(1); expect(f.launcher.open).toHaveBeenCalledTimes(1);
    const turn = f.db.scopedWorktreeClosingTurns(P)[0]!, returned = f.db.scopedWorktreeClosingReturn(P, turn.invocationId)!;
    expect(returned).toBeDefined(); expect(turn.result?.output).toContain("My B was delivered"); expect(turn.completion).toBeDefined();
    if (fault === "authorized-late-write") expect(returned.observation?.pendingPaths).toEqual(f.files);
    if (fault === "extra-late-write") expect(returned.observationFailure?.reason).toContain("outside");
    if (fault === "target-read-failure") expect(returned.targetObservationFailure?.reason).toContain("Actual group-target read failed");
    const attempts = f.db.scopedRecoveryCandidates(P, "run-G")[0]!.closingAttempts!;
    expect(attempts[0]!.returned).toEqual(returned); expect(attempts[0]!.results.filter(result => result.received)).toHaveLength(4);
    await f.runtime.advance(); expect(f.launcher.open).toHaveBeenCalledTimes(1);
  }, process.platform === "win32" ? 120_000 : 30_000);

  it.each(["stopped", "unused"] as const)("wakes the original Leader for each actual %s return in one graph pump, then honors its escalation and GLOBAL Main's user decision", async kind => {
    const f = await fixture({ ...(kind === "unused" ? { original: await authorizedClosingFixture({ identify: false }) } : {}) });
    if (kind === "unused") await f.runtime.discover(); else await f.runtime.advance();
    const before = f.snapshot(), beforeBudget = f.db.scopedAgentMechanismRepairCount(P, f.execution.id);
    const revisions: Array<number | undefined> = [];
    const management = { planGroup: vi.fn(async () => {}), resolveChildRoute: vi.fn(async () => {}),
      recoverGroup: vi.fn(async () => {
        revisions.push(f.db.scopedRecoveryCandidates(P, "run-G")[0]!.coordinationRevision);
        if (revisions.length === 1) {
          authorizeNextClosing(f).accept();
          if (kind === "unused") await fs.writeFile(path.join(f.worktree, "late-refused.txt"), "Preserve unknown source");
          await f.runtime.advance();
        } else closingHierarchyDecision(f);
      }), recoverGlobal: vi.fn(async () => { closingHierarchyDecision(f, true); }) };
    const agents = { prepareDelivery: vi.fn(async () => { throw Error("Original FIFO must remain held"); }) };
    const pump = new ScopedWorkflowRuntime(f.db, f.ordinaryGit as unknown as ScopedWorkflowGit, agents, () => f.projectPath, undefined, management);
    const result = await pump.advance({ projectId: P, rootGroupRunId: "run-G", repository: f.repository });
    expect(result.status).toBe("waiting"); expect(management.recoverGroup).toHaveBeenCalledTimes(2); expect(management.recoverGlobal).toHaveBeenCalledTimes(1);
    expect(revisions[1]).toBeGreaterThan(revisions[0] ?? 0);
    expect(f.launcher.open).toHaveBeenCalledTimes(kind === "unused" ? 0 : 2); expect(agents.prepareDelivery).not.toHaveBeenCalled();
    expect(f.snapshot()).toEqual(before); expect(f.db.scopedGroupIssues(P)).toHaveLength(1);
    expect(f.db.scopedAgentMechanismRepairCount(P, f.execution.id)).toBe(beforeBudget);
    expect(f.db.scopedManagementFailures(P)).toEqual([]);
    expect(f.db.scopedAcceptedLeaderActions(P, "run-G").at(-1)).toMatchObject({ globalMain: true, envelope: { action: { tool: "request_user" } } });
  }, process.platform === "win32" ? 60_000 : 15_000);

  it("does not re-wake management for unrelated publications or automatically reopen the same stopped grant", async () => {
    const f = await fixture({ actions: [] }); await f.runtime.advance();
    const management = { planGroup: vi.fn(async () => {}), resolveChildRoute: vi.fn(async () => {}), recoverGroup: vi.fn(async () => {
      for (let i = 0; i < 3; i++) f.db.appendEvent({ projectId: P, requestId: `fixture-publication-${i}`, type: "fixture.publication", payload: { i } });
    }) };
    const pump = new ScopedWorkflowRuntime(f.db, f.ordinaryGit as unknown as ScopedWorkflowGit,
      { prepareDelivery: vi.fn(async () => { throw Error("No business restart"); }) }, () => f.projectPath, undefined, management);
    await pump.advance({ projectId: P, rootGroupRunId: "run-G", repository: f.repository });
    expect(management.recoverGroup).toHaveBeenCalledTimes(1); expect(f.launcher.open).toHaveBeenCalledTimes(1);
    expect(f.db.scopedWorktreeClosingTurns(P)).toHaveLength(1);
  });

  it("keeps the original manager's exhausted budget while the returned closing travels to GLOBAL Main", async () => {
    const f = await fixture({ actions: [] }); await f.runtime.advance();
    for (let index = 0; index < 2; index++) {
      const invocationId = `inv_failed_manager_${index}`, claim = f.db.claimScopedLeaderTurn({ projectId: P, groupRunId: "run-G", agentId: "main", invocationId,
        runtimePath: path.join(f.projectPath, "runtime", invocationId), allowStoppedRepairFaults: true })!;
      const identity = { projectId: P, groupRunId: "run-G", agentId: "main", invocationId, coordinatorEpoch: claim.coordinatorEpoch };
      f.db.markScopedLeaderOpened(identity); f.db.releaseScopedLeaderTurn({ ...identity, residentStopConfirmed: true });
      f.db.recordScopedManagementFailure({ ...identity, purpose: "recover", reason: "This isolated manager turn returned without its required formal decision" });
    }
    const failures = f.db.scopedManagementFailures(P);
    expect(failures).toHaveLength(2); expect(failures[1]!.exhausted).toBe(true);
    const management = { planGroup: vi.fn(async () => {}), resolveChildRoute: vi.fn(async () => {}), recoverGroup: vi.fn(async () => {}),
      recoverGlobal: vi.fn(async () => { closingHierarchyDecision(f, true); }) };
    const pump = new ScopedWorkflowRuntime(f.db, f.ordinaryGit as unknown as ScopedWorkflowGit,
      { prepareDelivery: vi.fn(async () => { throw Error("No business restart"); }) }, () => f.projectPath, undefined, management);
    await pump.advance({ projectId: P, rootGroupRunId: "run-G", repository: f.repository });
    expect(management.recoverGroup).not.toHaveBeenCalled(); expect(management.recoverGlobal).toHaveBeenCalledTimes(1);
    expect(f.db.scopedManagementFailures(P)).toEqual(failures); expect(f.launcher.open).toHaveBeenCalledTimes(1);
  });

  it("returns actual output, separate B facts and unreceived returns to the same Leader without automatically invoking again", async () => {
    const f = await fixture(), before = f.snapshot(); await f.runtime.advance();
    const [candidate] = f.db.scopedRecoveryCandidates(P, "run-G"), [attempt] = candidate!.closingAttempts!;
    expect(candidate!.pendingOperation).toBeUndefined();
    expect(attempt).toMatchObject({ turn: { status: "stopped", result: { output: expect.stringContaining("merge is still unresolved") },
      completion: { memory: "Supplemental Memory receipt" } }, returned: { observation: { head: f.rawGit(["rev-parse", "HEAD"]), pendingPaths: [] } } });
    expect(attempt!.operations).toHaveLength(2); expect(attempt!.results).toHaveLength(3);
    expect(attempt!.results.every(result => result.received === false)).toBe(true);
    await f.runtime.advance(); await f.runtime.reconcile(); expect(f.launcher.open).toHaveBeenCalledTimes(1);
    expect(f.snapshot()).toEqual(before); expect(f.db.scopedAgentHasUnreleasedActivity(P, "worker")).toBe(true);
    expect(f.db.eventsAfter(P).filter(event => event.type === "scoped.group.issue.returned")).toHaveLength(1);
  }, process.platform === "win32" ? 60_000 : 15_000); // Real Git and durable reconciliation use a bounded integration budget.

  it("dispatches exactly one new formal grant in the same Session with a new capability and previous stopped runtime", async () => {
    const f = await fixture(), before = f.snapshot(); await f.runtime.advance();
    const old = f.db.scopedWorktreeClosingTurns(P)[0]!, oldOperations = f.db.scopedWorktreeClosingOperations(P, old.invocationId);
    const next = authorizeNextClosing(f); next.accept(); await f.runtime.advance();
    const turns = f.db.scopedWorktreeClosingTurns(P), second = turns[1]!;
    expect(turns).toHaveLength(2); expect(second).toMatchObject({ status: "stopped", previousInvocationId: old.invocationId,
      previousRuntimePath: old.runtimePath, originalSession: f.session, reportHeadSha: f.A, paths: old.paths, grantInvocationId: next.identity.invocationId });
    expect(second.capabilityHash).not.toBe(old.capabilityHash);
    expect(f.launcher.open.mock.calls[1]![0].request).toMatchObject({ sessionContinuity: "strict", resumeThreadId: f.session.nativeId });
    const nextPrompt = f.handle.submit.mock.calls[1]![0].prompt;
    expect(nextPrompt).toContain('source="worktree-closing-history"');
    expect(nextPrompt).not.toContain(old.result!.output);
    const history = f.launcher.open.mock.calls[1]![0].request.contextSources!.find(source => source.key === "worktree-closing-history")!;
    expect(history.records).toHaveLength(2);
    expect(history.records).toEqual(expect.arrayContaining([expect.objectContaining({
      turn: expect.objectContaining({ invocationId: old.invocationId, result: old.result })
    })]));
    expect(f.db.scopedWorktreeClosingOperations(P, old.invocationId)).toEqual(oldOperations);
    expect(f.db.scopedWorktreeClosingOperations(P, second.invocationId)).toHaveLength(2);
    expect(second.result).toBeDefined(); expect(second.completion).toBeDefined();
    expect(() => f.db.assertScopedWorktreeClosingControl({ ...old, capabilityHash: old.capabilityHash })).toThrow();
    await f.runtime.advance(); expect(f.launcher.open).toHaveBeenCalledTimes(2); expect(f.snapshot()).toEqual(before);
  }, process.platform === "win32" ? 60_000 : 15_000);

  it("transports actual native reception separately when a later authorized call receives prior saved returns", async () => {
    let f!: Awaited<ReturnType<typeof fixture>>;
    f = await fixture({ beforeReturn: async () => {
      const turns = f.db.scopedWorktreeClosingTurns(P); if (turns.length !== 2) return;
      const second = turns[1]!, receipts = f.receipts.get(second.invocationId)!;
      expect(second.status).toBe("opened");
      const text = receipts.prepareNotification("actual-next-native-input"); expect(text).toContain(turns[0]!.invocationId);
      expect(f.db.scopedRecoveryCandidates(P, "run-G")[0]!.closingAttempts![0]!.results.every(result => !result.received)).toBe(true);
      receipts.observeNative({ invocationId: second.invocationId, harnessId: f.session.harnessId, kind: "user.message", eventId: "actual-native-message",
        message: text, sourceType: "native" });
    } }); await f.runtime.advance();
    const old = f.db.scopedWorktreeClosingTurns(P)[0]!;
    const next = authorizeNextClosing(f); next.accept(); await f.runtime.advance();
    expect(f.db.scopedRecoveryCandidates(P, "run-G")[0]!.closingAttempts![0]!.results.every(result => result.received)).toBe(true);
    expect(f.db.scopedWorktreeClosingReturn(P, old.invocationId)!.missing).toContain("exact independent B merge, local synchronization and original-Session reception");
    expect(f.db.scopedGroupIssues(P)).toHaveLength(1); // Reception still does not settle A/B/directory.
  }, process.platform === "win32" ? 60_000 : 15_000);

  it("preserves an actual late path after Stop, transports the read rejection and provides no new closing scope", async () => {
    const f = await fixture({ actions: [], close: async () => { await fs.writeFile(path.join(f.worktree, "late-uncertain.txt"), "Retain my uncertain source"); } });
    await f.runtime.advance();
    const [candidate] = f.db.scopedRecoveryCandidates(P, "run-G"), returned = candidate!.closingAttempts![0]!.returned!;
    expect(returned.observation).toBeUndefined(); expect(returned.observationFailure).toMatchObject({ errorCode: "GIT_PATH_VIOLATION" });
    const next = authorizeNextClosing(f); expect(() => f.db.revalidateScopedLeaderAction(next.input))
      .toThrowError(expect.objectContaining({ code: "INVALID_STATE_TRANSITION", message: expect.stringContaining("current trusted original-owner file manifest") }));
    expect(await fs.readFile(path.join(f.worktree, "late-uncertain.txt"), "utf8")).toBe("Retain my uncertain source");
    expect(f.db.scopedWorktreeClosingAuthorizations(P)).toHaveLength(1); expect(f.launcher.open).toHaveBeenCalledTimes(1);
  });

  it("rechecks actual paths after a fresh formal grant before reserving its one continuation", async () => {
    const f = await fixture(); await f.runtime.advance(); authorizeNextClosing(f).accept();
    await fs.writeFile(path.join(f.worktree, "late-after-grant.txt"), "Preserved");
    await f.runtime.advance();
    expect(f.db.scopedRecoveryCandidates(P, "run-G")[0]!.closingGrantFailure).toMatchObject({
      grantInvocationId: "inv_next_formal_manager", errorCode: "GIT_PATH_VIOLATION", originalStop: { invocationId: f.db.scopedWorktreeClosingTurns(P)[0]!.invocationId } });
    expect(f.db.scopedWorktreeClosingAuthorizations(P)).toHaveLength(2); expect(f.db.scopedWorktreeClosingTurns(P)).toHaveLength(1);
    expect(f.launcher.open).toHaveBeenCalledTimes(1);
    await f.runtime.advance(); expect(f.launcher.open).toHaveBeenCalledTimes(1);
  });

  it("consumes one accepted grant, binds real B operations and retains actual output before confirmed close", async () => {
    let f: Awaited<ReturnType<typeof fixture>>;
    f = await fixture({ close: async () => {
      const saved = f.db.scopedWorktreeClosingTurns(P)[0]!;
      expect(saved.status).toBe("opened"); expect(saved.result?.output).toContain("merge is still unresolved");
      expect(saved.completion?.memory).toBe("Supplemental Memory receipt"); expect(f.residents.size).toBe(1);
    } });
    const before = f.snapshot(), memory = await fs.readFile(f.memory, "utf8");
    await f.runtime.advance();
    const [turn] = f.db.scopedWorktreeClosingTurns(P), request = f.request();
    expect(turn).toMatchObject({ status: "stopped", previousInvocationId: "inv_original", originalSession: f.session, reportHeadSha: f.A });
    expect(turn!.invocationId).not.toBe("inv_original"); expect(turn!.runtimePath).toBe(path.join(path.dirname(f.originalStop.runtimePath), turn!.invocationId));
    expect(request).toMatchObject({ agent: "worker", kind: "worker", sessionContinuity: "strict", resumeThreadId: f.session.nativeId,
      workspacePath: f.worktree, executionContext: f.executionContext, worktreeClosing: { paths: f.files, grantInvocationId: "inv_manager", grantCallId: "close" } });
    expect(f.launcher.open.mock.calls[0]![0].controlScope).toMatchObject({ role: "execution-artifact", worktreeClosing: request.worktreeClosing });
    expect(f.snapshot()).toEqual(before); expect(await fs.readFile(f.memory, "utf8")).toBe(memory);
    const B = f.rawGit(["rev-parse", "HEAD"]); expect(B).not.toBe(f.A);
    expect(f.rawGit(["rev-parse", `refs/heads/${f.execution.executionBranch}`], f.remote)).toBe(B);
    const operations = f.db.scopedWorktreeClosingOperations(P, turn!.invocationId);
    expect(operations).toHaveLength(2); expect(operations.every(operation => operation.id.startsWith(`agent-closing-git-${turn!.invocationId}-`))).toBe(true);
    expect(f.db.latestAgentNativeSessionBinding(P, "worker")).toMatchObject({ session: f.session, invocationId: turn!.invocationId, runtimePath: turn!.runtimePath });
    expect(turn!.result).toMatchObject({ inputId: `worktree-closing:${turn!.invocationId}`, originalSession: f.session });
    expect(f.db.scopedWorktreeClosingCandidates(P)).toHaveLength(1); // No merge/receipt/settlement was invented.
    expect(f.residents.size).toBe(0); expect(f.handle.close).toHaveBeenCalledTimes(1);
    await f.runtime.advance(); await new ScopedWorktreeClosingRuntime(f.runtimeOptions).advance();
    expect(f.launcher.open).toHaveBeenCalledTimes(1); expect(f.handle.submit).toHaveBeenCalledTimes(1);
    expect(f.db.scopedWorktreeClosingTurns(P)).toHaveLength(1);
  });



  it("discovers only trusted current original-owner files and waits for an explicit released direct-Leader grant", async () => {
    const f = await fixture({ original: await authorizedClosingFixture({ identify: false }) }), before = f.snapshot();
    expect(f.db.scopedWorktreeClosingDiscoveryOwners(P)).toHaveLength(1);
    await f.runtime.discover();
    const [candidate] = f.db.scopedWorktreeClosingCandidates(P);
    expect(candidate).toMatchObject({ executionId: f.execution.id, originalStatus: "failed", originalSession: f.session,
      observation: { reportHeadSha: f.A, authorizedPaths: f.files, pendingPaths: f.files } });
    expect(f.db.scopedWorktreeClosingAuthorizations(P)).toEqual([]); expect(f.db.scopedWorktreeClosingTurns(P)).toEqual([]);
    expect(f.db.scopedWorktreeClosingDiscoveryOwners(P)).toEqual([]);
    await f.runtime.discover(); await f.runtime.advance(); expect(f.launcher.open).not.toHaveBeenCalled();
    expect(f.db.eventsAfter(P).filter(event => event.type === "scoped.worktree_closing.identified")).toHaveLength(1);
    expect(f.db.scopedRecoveryCandidates(P, "run-G")[0]).toMatchObject({ kind: "worktree-closing", closing: candidate });
    const invocationId = "inv_discovered_leader", claimed = f.db.claimScopedLeaderTurn({ projectId: P, groupRunId: "run-G", agentId: "main", invocationId,
      runtimePath: path.join(f.projectPath, "runtime", invocationId), allowStoppedRepairFaults: true })!;
    const manager = { projectId: P, groupRunId: "run-G", agentId: "main", invocationId, coordinatorEpoch: claimed.coordinatorEpoch };
    f.db.markScopedLeaderOpened(manager);
    const envelope = (action: ControlAction, callId: string) => ({ projectId: P, agent: "main", invocationId, callId,
      stateVersion: claimed.coordinatorEpoch, capabilityHash: "c".repeat(64), receivedAt: f.time(), action });
    f.db.recordScopedLeaderTaskCompletion({ ...manager, envelope: envelope({ tool: "finish_task", summary: "My explicit closing coordination" }, "finish") });
    f.db.acceptScopedLeaderAction({ ...manager, residentStopConfirmed: true, envelope: envelope({ tool: "coordinate_group_task", groupRunId: "run-G",
      coordinatorEpoch: claimed.coordinatorEpoch, arrivalRequestId: candidate!.arrivalRequestId, operation: "close_worktree", rationale: "Deliver only your original Memory",
      closing: { executionId: candidate!.executionId, ownershipEpoch: 1, paths: f.files } }, "close") });
    f.db.releaseScopedLeaderTurn({ ...manager, residentStopConfirmed: true });
    await f.runtime.advance(); expect(f.launcher.open).toHaveBeenCalledTimes(1);
    expect(f.db.scopedWorktreeClosingTurns(P)[0]!.grantInvocationId).toBe(invocationId); expect(f.snapshot()).toEqual(before);
  }, process.platform === "win32" ? 60_000 : 15_000);


  it.each([false, true])("preserves a completed original owner while discovering or dispatching explicit closing (authorized=%s)", async authorized => {
    const f = await fixture({ original: await authorizedClosingFixture({ identify: authorized, originalStatus: "completed" }) }), before = f.snapshot();
    await f.runtime.discover(); await f.runtime.advance();
    expect(f.db.scopedWorktreeClosingCandidates(P)[0]).toMatchObject({ originalStatus: "completed", observation: { kind: "completed-leftovers" } });
    expect(f.launcher.open).toHaveBeenCalledTimes(authorized ? 1 : 0); expect(f.snapshot()).toEqual(before);
    expect(f.db.scopedExecution(P, f.execution.id)!.status).toBe("completed");
  });

  it.each([1, 2])("closes the exact completed child through %s retained ancestors without reopening its business", async completedAncestors => {
    const f = await fixture({ original: await authorizedClosingFixture({ identify: false, originalStatus: "completed", businessDelivery: true, completedAncestors }),
      actions: deliveredActions, receiveResults: true });
    const before = f.snapshot(), prefix = f.db.eventsAfter(P), projection = f.db.projectState(P);
    expect(() => f.db.assertScopedGroupActive(P, "run-G")).toThrow();
    expect(f.db.scopedWorktreeClosingDiscoveryOwners(P)).toHaveLength(1);
    await f.runtime.discover();
    expect(f.db.scopedWorktreeClosingCandidates(P)[0]).toMatchObject({ executionId: f.execution.id, groupRunId: "run-G", originalStatus: "completed" });
    const recover = vi.fn(async (group: { id: string }) => {
      expect(group.id).toBe("run-G");
      const manager = authorizeNextClosing(f);
      const rejected: ControlAction[] = [
        { tool: "assign_group_tasks", groupRunId: "run-G", coordinatorEpoch: manager.identity.coordinatorEpoch, tasks: [{ taskId: "G_worker", assignment: "Repeat completed work" }] },
        { tool: "apply_workflow", path: "workflow.json", rationale: "Change the completed graph" },
        { tool: "request_group_integration", groupRunId: "run-G", coordinatorEpoch: manager.identity.coordinatorEpoch, integrationOwnerAgentId: "worker" },
        { tool: "complete_group", groupRunId: "run-G", coordinatorEpoch: manager.identity.coordinatorEpoch, output: "Complete again" },
        { tool: "route_to_agent", target: "finish", rationale: "Repeat the route" },
        { tool: "coordinate_group_task", groupRunId: "run-G", coordinatorEpoch: manager.identity.coordinatorEpoch,
          arrivalRequestId: f.execution.arrivalRequestId, operation: "retry", rationale: "Cannot repeat completed business" }
      ];
      for (const action of rejected) expect(() => f.db.revalidateScopedLeaderAction({ ...manager.input,
        envelope: { ...manager.input.envelope, action } })).toThrow();
      manager.accept(); await f.runtime.advance();
    });
    const runner = { run: vi.fn(async () => { throw Error("Completed business must never run again"); }) };
    const pump = new ScopedWorkflowRuntime(f.db, f.ordinaryGit as unknown as ScopedWorkflowGit, runner as unknown as ScopedAgentExecutionRunner,
      () => f.projectPath, undefined, { planGroup: async () => {}, recoverGroup: recover });
    await pump.advance({ projectId: P, rootGroupRunId: `run-G_parent_${completedAncestors - 1}`,
      repository: { ...f.repository, provider: "github", providerId: 1, cloneUrl: "https://github.com/example/project.git" }, signal: f.controller.signal });
    expect(recover).toHaveBeenCalledTimes(1); expect(runner.run).not.toHaveBeenCalled();
    expect(f.db.scopedWorktreeClosingSettlements(P)).toHaveLength(1);
    expect(f.db.scopedWorktreeClosingCandidates(P)).toEqual([]); expect(f.launcher.open).toHaveBeenCalledTimes(1);
    expect(f.snapshot()).toEqual(before);
    expect(f.db.projectState(P).scopedGroupRuns).toEqual(projection.scopedGroupRuns);
    expect(f.db.projectState(P).scopedArrivals).toEqual(projection.scopedArrivals);
    expect(f.db.eventsAfter(P).slice(0, prefix.length)).toEqual(prefix);
    expect(f.request()).toMatchObject({ sessionContinuity: "strict", resumeThreadId: f.session.nativeId, workspacePath: f.worktree });
    expect(() => f.db.assertScopedGroupActive(P, "run-G")).toThrow();
  }, process.platform === "win32" ? 120_000 : 30_000);

  it.each(["completed-root", "cancelled-parent", "routed-root", "wrong-parent-arrival"] as const)("revokes completed-child discovery and accepted closing after %s", async fault => {
    const f = await fixture({ original: await authorizedClosingFixture({ originalStatus: "completed", completedAncestors: 1 }) });
    expect(f.db.scopedWorktreeClosingCandidates(P)).toHaveLength(1);
    const raw = new DatabaseSync(f.databasePath);
    try {
      if (fault === "routed-root") raw.prepare("UPDATE project_heads SET active_node_run_id=NULL WHERE project_id=?").run(P);
      else if (fault === "wrong-parent-arrival") raw.prepare("UPDATE scoped_arrivals SET child_group_id='another-child' WHERE group_run_id='run-G_parent_0'").run();
      else raw.prepare("UPDATE scoped_group_runs SET status=? WHERE group_run_id='run-G_parent_0'").run(fault === "completed-root" ? "completed" : "cancelled");
    } finally { raw.close(); }
    const before = f.snapshot(), events = f.db.eventsAfter(P), memory = await fs.readFile(f.memory, "utf8");
    expect(f.db.scopedWorktreeClosingDiscoveryOwners(P)).toEqual([]);
    await f.runtime.discover(); await f.runtime.advance();
    expect(f.launcher.open).not.toHaveBeenCalled(); expect(f.launcher.stopScopedForRecovery).not.toHaveBeenCalled();
    expect(f.db.eventsAfter(P)).toEqual(events); expect(f.snapshot()).toEqual(before);
    expect(await fs.readFile(f.memory, "utf8")).toBe(memory);
    expect(() => authorizeNextClosing(f)).toThrow();
  });

  it("holds the live ancestor's Finish barrier until the completed child's separate closing actually settles", async () => {
    const f = await fixture({ original: await authorizedClosingFixture({ identify: false, originalStatus: "completed", businessDelivery: true, completedAncestors: 1 }),
      actions: deliveredActions, receiveResults: true });
    const raw = new DatabaseSync(f.databasePath);
    try { raw.prepare("INSERT INTO scoped_finish_tokens(request_id,group_run_id,source_arrival_request_id,created_at) VALUES (?,?,?,?)")
      .run("retained-parent-finish", "run-G_parent_0", f.db.scopedGroupRun(P, "run-G")!.parentArrivalRequestId!, f.time()); } finally { raw.close(); }
    expect(f.db.scopedGroupReadyForFinalIntegration(P, "run-G_parent_0")).toBe(true);
    await f.runtime.discover();
    expect(f.db.scopedGroupReadyForFinalIntegration(P, "run-G_parent_0")).toBe(false);
    expect(() => f.db.beginScopedFinalIntegration({ projectId: P, groupRunId: "run-G_parent_0", expectedHeadSha: f.A })).toThrow("unfinished");
    authorizeNextClosing(f).accept();
    expect(f.db.scopedGroupReadyForFinalIntegration(P, "run-G_parent_0")).toBe(false);
    await f.runtime.advance();
    expect(f.db.scopedWorktreeClosingSettlements(P)).toHaveLength(1);
    expect(f.db.scopedGroupReadyForFinalIntegration(P, "run-G_parent_0")).toBe(true);
    expect(f.db.scopedGroupRun(P, "run-G")!.status).toBe("completed");
  }, process.platform === "win32" ? 60_000 : 30_000);

  it("revalidates a completed child's live ancestor after the awaited trusted directory read", async () => {
    const f = await fixture({ original: await authorizedClosingFixture({ identify: false, originalStatus: "completed", completedAncestors: 1 }) });
    const observe = f.ordinaryGit.identifyRestrictedWorktreeClosing.bind(f.ordinaryGit);
    vi.spyOn(f.ordinaryGit, "identifyRestrictedWorktreeClosing").mockImplementation(async (...args) => {
      const result = await observe(...args), raw = new DatabaseSync(f.databasePath);
      try { raw.prepare("UPDATE scoped_group_runs SET status='completed' WHERE group_run_id='run-G_parent_0'").run(); } finally { raw.close(); }
      return result;
    });
    const before = f.snapshot();
    await expect(f.runtime.discover()).rejects.toThrow("active unfinished project");
    expect(f.db.scopedWorktreeClosingCandidates(P)).toEqual([]); expect(f.snapshot()).toEqual(before);
    expect(f.launcher.open).not.toHaveBeenCalled();
  });

  it("carries a completed child's untrusted manifest through its completed direct parent without granting writes", async context => {
    const f = await fixture({ original: await authorizedClosingFixture({ identify: false, originalStatus: "completed", completedAncestors: 2 }) });
    await fs.writeFile(path.join(f.root, "uncertain-original.txt"), "Retain unknown ownership");
    try { await fs.symlink(path.join(f.root, "uncertain-original.txt"), path.join(f.worktree, "uncertain.txt")); } catch (error) {
      if (process.platform === "win32" && (error as NodeJS.ErrnoException).code === "EPERM") { context.skip(); return; }
      throw error;
    }
    const before = f.snapshot(); await f.runtime.discover();
    expect(f.db.scopedRecoveryCandidates(P, "run-G")[0]).toMatchObject({ kind: "worktree-closing", closing: undefined });
    closingHierarchyDecision(f);
    const candidate = f.db.scopedRecoveryCandidates(P, "run-G_parent_0")[0]!;
    expect(candidate).toMatchObject({ originGroupRunId: "run-G", kind: "worktree-closing", closing: undefined });
    const invocationId = "inv_completed_parent", claim = f.db.claimScopedLeaderTurn({ projectId: P, groupRunId: "run-G_parent_0", agentId: "main", invocationId,
      runtimePath: path.join(f.projectPath, "runtime", invocationId), allowStoppedRepairFaults: true })!;
    const identity = { projectId: P, groupRunId: "run-G_parent_0", agentId: "main", invocationId, coordinatorEpoch: claim.coordinatorEpoch };
    f.db.markScopedLeaderOpened(identity);
    const envelope = (action: ControlAction, callId: string) => ({ projectId: P, agent: "main", invocationId, callId,
      stateVersion: claim.coordinatorEpoch, capabilityHash: "c".repeat(64), receivedAt: f.time(), action });
    f.db.recordScopedLeaderTaskCompletion({ ...identity, envelope: envelope({ tool: "finish_task", summary: "Escalate the retained read failure" }, "finish") });
    f.db.acceptScopedLeaderAction({ ...identity, residentStopConfirmed: true, envelope: envelope({ tool: "coordinate_group_task", groupRunId: identity.groupRunId,
      coordinatorEpoch: claim.coordinatorEpoch, arrivalRequestId: candidate.arrivalRequestId, operation: "escalate", rationale: "Exact original manifest remains untrusted" }, "escalate") });
    f.db.releaseScopedLeaderTurn({ ...identity, residentStopConfirmed: true });
    expect(f.db.scopedRecoveryCandidates(P, "run-G_parent_1")[0]).toMatchObject({ originGroupRunId: "run-G", kind: "worktree-closing", closing: undefined });
    expect(f.db.scopedWorktreeClosingAuthorizations(P)).toEqual([]); expect(f.launcher.open).not.toHaveBeenCalled();
    expect(f.snapshot()).toEqual(before); expect(await fs.readFile(path.join(f.worktree, "uncertain.txt"), "utf8")).toBe("Retain unknown ownership");
  });

  it.for([true, false])("binds the completed child's actual manager request to closing-only control (trusted=%s)", async (trusted, context) => {
    const f = await fixture({ original: await authorizedClosingFixture({ identify: false, originalStatus: "completed", completedAncestors: 1 }) });
    if (!trusted) {
      await fs.writeFile(path.join(f.root, "uncertain-original.txt"), "Preserved unknown file");
      try { await fs.symlink(path.join(f.root, "uncertain-original.txt"), path.join(f.worktree, "uncertain.txt")); } catch (error) {
        if (process.platform === "win32" && (error as NodeJS.ErrnoException).code === "EPERM") { context.skip(); return; }
        throw error;
      }
    }
    await f.runtime.discover(); const before = f.snapshot();
    expect(Boolean(f.db.scopedRecoveryCandidates(P, "run-G")[0]!.closing)).toBe(trusted);
    f.state.agents.main.harness = "pi";
    f.state.agentSessionIds!.main = "original-main-session";
    let managerClosed = false;
    const continuing = vi.fn(async () => { expect(managerClosed).toBe(true); });
    const launcher = { open: vi.fn(async (input: CollaborationResidentOpenInput) => {
      expect(input.controlScope).toMatchObject({ role: "scoped-leader", groupRunId: "run-G", worktreeClosingOnly: true,
        memberNodeIds: [], routeCandidates: [], allowReconfiguration: false });
      expect(input.request).toMatchObject({ sessionContinuity: "strict", resumeThreadId: "original-main-session" });
      await input.onOpened!();
      return { pause: async () => {}, resume: async () => {}, close: async () => { managerClosed = true; }, submit: async turn => {
        expect(turn.prompt).toContain("Retained child closing");
        expect(input.controlScope).toMatchObject({ worktreeClosingOnly: true });
        const authority = await input.controlAuthorityFactory!({ request: input.request, turn });
        expect(authority.control.collaboration).toMatchObject({ worktreeClosingOnly: true, memberNodeIds: [], routeCandidates: [], allowReconfiguration: false });
        const service = new ControlActionService({ projectId: P, agent: "main", invocationId: input.request.invocationId,
          capability: authority.control.capability, capabilityHash: authority.control.capabilityHash, stateVersion: authority.control.stateVersion,
          stagingPath: authority.control.stagingPath, revalidate: authority.revalidate });
        const coordination = { groupRunId: "run-G", coordinatorEpoch: authority.control.stateVersion,
          arrivalRequestId: f.execution.arrivalRequestId, rationale: "Only the actual retained original file scope" };
        await expect(service.stage(authority.control.capability, "forbidden-retry", { tool: "coordinate_group_task", ...coordination, operation: "retry" })).rejects.toThrow("Completed group");
        await service.stage(authority.control.capability, "finish", { tool: "finish_task", summary: "My original closing coordination" });
        await service.stage(authority.control.capability, "decision", trusted
          ? { tool: "coordinate_group_task", ...coordination, operation: "close_worktree", closing: { executionId: f.execution.id, ownershipEpoch: 1, paths: f.files } }
          : { tool: "coordinate_group_task", ...coordination, operation: "escalate" });
        const result = { handoff: "Actual direct Leader decision", controlActions: await readStagedControlActions(authority.control.stagingPath) };
        return new HarnessRuntimeFacade().validateResidentTurnResult(result, { ...input.request, control: authority.control });
      } };
    }) };
    const project = new ScopedProjectRuntime({ database: f.db, state: f.state, storage: f.storage, git: f.ordinaryGit,
      repository: { ...f.repository, provider: "github", providerId: 1, cloneUrl: "https://github.com/example/project.git" }, launcher,
      signal: f.controller.signal, filesystem: f.runtimeOptions.filesystem, decorate: () => {}, trace: f.runtimeOptions.trace,
      publish: f.runtimeOptions.publish, continueWorktreeClosings: continuing, register: f.runtimeOptions.register, unregister: f.runtimeOptions.unregister,
      submit: (handle, turn) => handle.submit(turn), managementInputs: async (_group, _invocation, inboxPath, runtimePath, allowEdit) => {
        expect(allowEdit).toBe(false); return { projectPath: f.projectPath, workspacePath: f.projectPath, inboxPath, runtimePath,
          memoryPath: f.memory, inboxSha256: createHash("sha256").update(await fs.readFile(inboxPath)).digest("hex") };
      } });
    await (project as any).performManagement(f.db.scopedGroupRun(P, "run-G"), "recover", undefined, "Retained child closing", false);
    expect(launcher.open).toHaveBeenCalledTimes(1); expect(continuing).toHaveBeenCalledTimes(trusted ? 1 : 0);
    expect(f.db.scopedWorktreeClosingAuthorizations(P)).toHaveLength(trusted ? 1 : 0);
    expect(f.snapshot()).toEqual(before); expect(f.db.scopedGroupRun(P, "run-G")!.status).toBe("completed");
  });

  it("does not inspect, stop or steal an unproved newer reserved task from the same original Agent", async () => {
    const f = await fixture({ original: await authorizedClosingFixture({ identify: false, originalStatus: "completed" }) });
    const raw = new DatabaseSync(f.databasePath);
    try {
      const copy = (table: string, overrides: Record<string, string | number | null>, omit?: string) => {
        const row = { ...raw.prepare(`SELECT * FROM ${table} LIMIT 1`).get(), ...overrides } as Record<string, string | number | null>;
        if (omit) delete row[omit]; const fields = Object.keys(row);
        raw.prepare(`INSERT INTO ${table} (${fields.join(",")}) VALUES (${fields.map(() => "?").join(",")})`).run(...Object.values(row));
      };
      copy("scoped_arrivals", { request_id: "next-arrival", source_run_id: "after-original", node_run_id: null, status: "running" }, "arrival_seq");
      copy("scoped_executions", { execution_id: "next", arrival_request_id: "next-arrival", execution_branch: "executions/next", status: "running", completed_at: null });
      copy("scoped_agent_turns", { execution_id: "next", invocation_id: "inv_reserved_next", runtime_path: path.join(f.projectPath, "runtime/inv_reserved_next"), status: "reserved", opened_at: null, stopped_at: null });
    } finally { raw.close(); }
    const before = f.snapshot(); expect(f.db.scopedWorktreeClosingDiscoveryOwners(P)).toEqual([]);
    await f.runtime.discover(); expect(f.snapshot()).toEqual(before); expect(f.launcher.stopScopedForRecovery).not.toHaveBeenCalled();
    expect(f.db.scopedWorktreeClosingCandidates(P)).toEqual([]); expect(f.db.scopedAgentTurn(P, "next", 1)?.status).toBe("reserved");
  });

  it("does not identify clean A or mutate it while probing its exact stopped owner", async () => {
    const f = await fixture({ original: await authorizedClosingFixture({ identify: false }) });
    await fs.writeFile(f.memory, "Immutable original Memory at A\n"); const before = f.snapshot();
    await f.runtime.discover(); expect(f.db.scopedWorktreeClosingCandidates(P)).toEqual([]); expect(f.snapshot()).toEqual(before);
    expect(f.launcher.open).not.toHaveBeenCalled(); expect(f.launcher.stopScopedForRecovery.mock.calls[0]![0].executionRuntimePath).toBe(f.originalStop.runtimePath);
  });

  it.each(["completed", "cancelled", "archived", "frozen", "foreign-binding"] as const)("does not inspect or grant original-owner files when %s", async fault => {
    const f = await fixture({ original: await authorizedClosingFixture({ identify: false }) });
    if (fault === "completed" || fault === "cancelled") f.state.status = fault;
    if (fault === "archived") f.state.archivedAt = f.time();
    if (fault === "frozen") freeze(f.databasePath);
    if (fault === "foreign-binding") f.db.recordAgentNativeSessionBinding({ ...f.binding, invocationId: "inv_other_owner", runtimePath: path.join(f.projectPath, "runtime/inv_other_owner"),
      executionContext: { ...f.executionContext, executionId: "another-task" } });
    await f.runtime.discover(); expect(f.launcher.stopScopedForRecovery).not.toHaveBeenCalled();
    expect(f.db.scopedWorktreeClosingCandidates(P)).toEqual([]); expect(f.db.scopedWorktreeClosingAuthorizations(P)).toEqual([]);
  });

  it.each(["native-live", "session", "cancel-after-observation"] as const)("retains original files and no candidate on discovery %s", async fault => {
    const f = await fixture({ original: await authorizedClosingFixture({ identify: false }),
      ...(fault === "native-live" ? { stop: () => ({ stopped: false, evidence: { nativeStillLive: true } }) } : {}) });
    if (fault === "session") f.state.agentSessions!.worker = { ...f.session, nativeId: "replacement-session" };
    if (fault === "cancel-after-observation") {
      const read = f.ordinaryGit.identifyRestrictedWorktreeClosing.bind(f.ordinaryGit);
      vi.spyOn(f.ordinaryGit, "identifyRestrictedWorktreeClosing").mockImplementation(async (...args) => { const result = await read(...args); f.controller.abort(); return result; });
    }
    await expect(f.runtime.discover()).rejects.toThrow(); expect(f.db.scopedWorktreeClosingCandidates(P)).toEqual([]);
    expect(f.db.scopedWorktreeClosingAuthorizations(P)).toEqual([]); expect(f.db.scopedWorktreeClosingTurns(P)).toEqual([]);
    expect(f.rawGit(["rev-parse", "HEAD"])).toBe(f.A); expect(await fs.readFile(f.memory, "utf8")).toContain("necessary Memory after A");
  });

  it("transports an actual rejected Git manifest as a separate hierarchy issue without granting paths or starting the original Agent", async () => {
    const f = await fixture({ original: await authorizedClosingFixture({ identify: false }) }), before = f.snapshot();
    const foreign = path.join(f.worktree, "foreign.txt"); await fs.writeFile(foreign, "Uncertain source");
    await f.runtime.discover();
    const [issue] = f.db.scopedGroupIssues(P);
    expect(issue).toMatchObject({ kind: "worktree-closing", executionId: f.execution.id, ownershipEpoch: 1, reason: expect.stringContaining("no trusted closing manifest") });
    expect(f.db.scopedRecoveryCandidates(P, "run-G")[0]).toMatchObject({ incidentId: issue!.id, kind: "worktree-closing" });
    expect(f.db.scopedRecoveryCandidates(P, "run-G")[0]!.closing).toBeUndefined();
    expect(f.db.scopedWorktreeClosingCandidates(P)).toEqual([]); expect(f.db.scopedWorktreeClosingAuthorizations(P)).toEqual([]);
    expect(f.db.eventsAfter(P).filter(event => event.type === "scoped.worktree_closing.discovery.failed")[0]).toMatchObject({
      payload: { executionId: f.execution.id, originalSession: f.session, trustedReadFailed: true, errorCode: "GIT_PATH_VIOLATION",
        originalStop: { invocationId: "inv_original", residentStopConfirmed: true } } });
    expect(f.db.scopedWorktreeClosingDiscoveryOwners(P)).toEqual([]);
    await f.runtime.discover(); await f.runtime.advance(); expect(f.launcher.open).not.toHaveBeenCalled();
    expect(f.db.eventsAfter(P).filter(event => event.type === "scoped.worktree_closing.discovery.failed")).toHaveLength(1);
    expect(f.snapshot()).toEqual(before); expect(await fs.readFile(foreign, "utf8")).toBe("Uncertain source");
  });

  it("uses the Coordinator's bound Git factory, native callbacks and safe-point Pause for the actual supplemental turn", async () => {
    let f!: Awaited<ReturnType<typeof fixture>>, coordinator!: CollaborationRuntimeCoordinator;
    let release!: () => void, entered!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; }), active = new Promise<void>(resolve => { entered = resolve; });
    const factories: unknown[] = [];
    const original = await authorizedClosingFixture({ openDatabase: async input => {
      const builder = new ProductionCollaborationExecutionInputBuilder(input.storage, {
        list: vi.fn(async () => []), resolveConfigured: vi.fn(async () => [])
      } as never);
      coordinator = new CollaborationRuntimeCoordinator({ ...input, serviceId: "test", hostId: "test", leaseDurationMs: 600_000, serviceUserRoot: input.storage.projectsDir(),
        executionInputBuilder: builder, residentLauncher: {
          open: async request => f.launcher.open(request), stopScopedForRecovery: async request => f.launcher.stopScopedForRecovery(request)
        }, gitFactory: options => { factories.push(options); return f.makeGit(undefined, options.operationStore).git; } });
      await coordinator.initialize(); return (coordinator as any).database();
    } });
    f = await fixture({ original, beforeReturn: async () => { entered(); await gate; } });
    f.state.operations = [{ id: "fixture-repository", kind: "repository.create", status: "finalized", remoteFact: { ...f.repository,
      provider: "github", providerId: 1, cloneUrl: "https://github.com/example/project.git" } }] as never;
    const runtime: ScopedWorktreeClosingRuntime = (coordinator as any).worktreeClosingRuntime(f.state, f.controller.signal);
    const advancing = runtime.advance();
    try {
      await Promise.race([active, advancing.then(() => { throw Error("Native turn never became active"); })]);
      expect(factories).toHaveLength(2); // Ordinary retained observation and an independent closing store.
      const request = f.launcher.open.mock.calls[0]![0].request;
      expect(request.worktreeClosing?.paths).toEqual(f.files); expect(request.sessionContinuity).toBe("strict");
      expect(request.project.agentSessions!.worker).toEqual(f.session);
      expect(f.db.scopedWorktreeClosingOperations(P, request.invocationId)).toHaveLength(2);
      expect(f.db.eventsAfter(P).filter(event => event.type === "control.result.recorded").length).toBeGreaterThan(0);
      const pausing = coordinator.pauseProject(f.state);
      await new Promise(resolve => setTimeout(resolve, 30));
      expect(f.handle.pause).not.toHaveBeenCalled(); expect(f.handle.close).not.toHaveBeenCalled();
      release(); await pausing;
      expect(f.db.scopedWorktreeClosingTurns(P)[0]!.result?.output).toContain("merge is still unresolved");
      expect(f.handle.pause).toHaveBeenCalledTimes(1); expect(f.handle.close).not.toHaveBeenCalled();
      expect(f.state.status).toBe("paused");
      f.controller.abort(new Error("Stop the isolated paused fixture")); await advancing;
      expect(f.db.scopedWorktreeClosingTurns(P)[0]!.status).toBe("stopped");
      expect(f.db.scopedWorktreeClosingCandidates(P)).toHaveLength(1);
    } finally {
      release(); f.controller.abort(); await advancing.catch(() => {}); await coordinator.shutdown();
    }
  }, process.platform === "win32" ? 60_000 : 15_000);

  it.each(["nativeId", "adapterVersion", "generation"] as const)("refuses a substituted original Session %s before reserving", async field => {
    const f = await fixture(); f.state.agentSessions!.worker = { ...f.session, [field]: field === "generation" ? 1 : "substitute" };
    await expect(f.runtime.advance()).rejects.toThrow("durable Session");
    expect(f.db.scopedWorktreeClosingTurns(P)).toEqual([]); expect(f.launcher.open).not.toHaveBeenCalled();
  });

  it.each([false, true])("requires trusted original physical Stop proof (empty=%s)", async empty => {
    const f = await fixture({ stop: () => ({ stopped: empty, evidence: empty ? {} : { stillLive: true } }) });
    await expect(f.runtime.advance()).rejects.toThrow("Stop remains unproven");
    expect(f.db.scopedWorktreeClosingTurns(P)).toEqual([]); expect(f.launcher.open).not.toHaveBeenCalled();
  });

  it("keeps the exact grant pending while a new manager owns the original group", async () => {
    const f = await fixture(), manager = f.db.claimScopedLeaderTurn({ projectId: P, groupRunId: "run-G", agentId: "main", invocationId: "inv_another_manager",
      runtimePath: path.join(f.projectPath, "runtime", "inv_another_manager"), allowStoppedRepairFaults: true })!;
    expect(manager).toBeDefined(); await f.runtime.advance();
    expect(f.launcher.open).not.toHaveBeenCalled(); expect(f.db.scopedWorktreeClosingTurns(P)).toEqual([]);
    expect(f.db.scopedWorktreeClosingAuthorizations(P)).toHaveLength(1);
  });

  it("returns the accurate late-file refusal of an unused grant before reserving, without repeatedly stopping or probing", async () => {
    const f = await fixture(); await fs.writeFile(path.join(f.worktree, "unrelated.txt"), "Uncertain source");
    const before = f.snapshot(); await f.runtime.advance();
    expect(f.launcher.open).not.toHaveBeenCalled(); expect(f.db.scopedWorktreeClosingTurns(P)).toEqual([]);
    expect(await fs.readFile(path.join(f.worktree, "unrelated.txt"), "utf8")).toBe("Uncertain source");
    expect(f.db.scopedRecoveryCandidates(P, "run-G")[0]).toMatchObject({ closingGrantFailure: { errorCode: "GIT_PATH_VIOLATION", grantInvocationId: "inv_manager" } });
    expect(f.db.scopedRecoveryCandidates(P, "run-G")[0]!.pendingOperation).toBeUndefined();
    await f.runtime.advance(); expect(f.launcher.stopScopedForRecovery).toHaveBeenCalledTimes(1); expect(f.snapshot()).toEqual(before);
  });

  it.each(["unknown-error", "cancel-after-read-failure"] as const)("does not turn %s into an unused-grant refusal", async fault => {
    const f = await fixture(), read = f.ordinaryGit.observeRestrictedWorktreeClosing.bind(f.ordinaryGit);
    vi.spyOn(f.ordinaryGit, "observeRestrictedWorktreeClosing").mockImplementation(async (...args) => {
      if (fault === "unknown-error") throw Error("Actual unexpected reader failure");
      try { return await read(...args); } catch (error) { f.controller.abort(); throw error; }
    });
    if (fault === "cancel-after-read-failure") await fs.writeFile(path.join(f.worktree, "unrelated.txt"), "Uncertain source");
    await expect(f.runtime.advance()).rejects.toThrow();
    expect(f.db.scopedWorktreeClosingGrantFailure(P, "inv_manager", "close")).toBeUndefined();
    expect(f.db.scopedWorktreeClosingTurns(P)).toEqual([]); expect(f.launcher.open).not.toHaveBeenCalled();
  });

  it.each(["builder", "open", "scope", "stale-observation"] as const)("retains a consumed reservation and physical Stop on %s failure without a return", async fault => {
    const f = await fixture({ opened: async input => {
      if (fault === "open") throw Error("Native process failed to open");
      if (fault === "scope") input.request.worktreeClosing!.paths.push("unrelated.txt");
      if (fault === "stale-observation") {
        const expiredAt = f.time(), read = f.ordinaryGit.observeRestrictedWorktreeClosing.bind(f.ordinaryGit);
        f.advance(61_000);
        vi.spyOn(f.ordinaryGit, "observeRestrictedWorktreeClosing").mockImplementationOnce(async (...args) => ({
          ...await read(...args), observedAt: expiredAt
        }));
        await input.sameEpochReopen!.revalidate();
      }
    } });
    if (fault === "builder") f.runtimeOptions.builder = { build: async () => { throw Error("Actual input preparation failed"); } };
    await f.runtime.advance();
    const [turn] = f.db.scopedWorktreeClosingTurns(P);
    expect(turn).toMatchObject({ status: "stopped" }); expect(turn!.result).toBeUndefined(); expect(turn!.completion).toBeUndefined();
    expect(f.db.eventsAfter(P).some(event => event.type === "agent.worktree_closing.failed")).toBe(true);
    await f.runtime.advance(); expect(f.db.scopedWorktreeClosingTurns(P)).toHaveLength(1);
    expect(f.launcher.open).toHaveBeenCalledTimes(fault === "builder" ? 0 : 1);
    if (fault === "open" || fault === "builder" || fault === "stale-observation") {
      expect(f.launcher.stopScopedForRecovery.mock.calls.at(-1)![0].executionRuntimePath).toBe(turn!.runtimePath);
      expect(turn!.openedAt).toBeUndefined();
    }
  });

  it("records the real output even when the Agent omitted its separate finish", async () => {
    const f = await fixture({ actions: [], output: "I cannot determine the source; preserve these files for my Leader." });
    await f.runtime.advance(); const [turn] = f.db.scopedWorktreeClosingTurns(P);
    expect(turn!.result?.output).toContain("cannot determine"); expect(turn!.completion).toBeUndefined();
    expect(f.db.scopedWorktreeClosingOperations(P, turn!.invocationId)).toEqual([]);
    expect(f.rawGit(["rev-parse", "HEAD"])).toBe(f.A); expect(f.db.scopedWorktreeClosingCandidates(P)).toHaveLength(1);
  });

  it("does not fabricate an output from accepted finish_task", async () => {
    const f = await fixture({ actions: [{ tool: "finish_task", summary: "My closing finish" }], output: "   " });
    await f.runtime.advance(); const [turn] = f.db.scopedWorktreeClosingTurns(P);
    expect(turn!.completion?.summary).toBe("My closing finish"); expect(turn!.result).toBeUndefined(); expect(turn!.status).toBe("stopped");
  });

  it("retains the actual return during Pause before waiting for resume or closing", async () => {
    let release!: () => void, retained!: () => void;
    const pause = new Promise<void>(resolve => { release = resolve; }), observed = new Promise<void>(resolve => { retained = resolve; });
    const f = await fixture({ actions: [], beforeReturn: async () => { freeze(f.databasePath); },
      afterReturn: async () => { retained(); await pause; } });
    const advancing = f.runtime.advance(); await observed;
    const [turn] = f.db.scopedWorktreeClosingTurns(P);
    expect(turn!.result?.output).toContain("merge is still unresolved"); expect(turn!.status).toBe("opened");
    expect(f.handle.close).not.toHaveBeenCalled(); expect(f.residents.size).toBe(1);
    release(); await advancing; expect(f.db.scopedWorktreeClosingTurns(P)[0]!.status).toBe("stopped");
  });

  it("does not mark Stop or unregister when physical close fails", async () => {
    const f = await fixture({ actions: [], close: async () => { throw Error("Physical native Stop uncertain"); } });
    await expect(f.runtime.advance()).rejects.toThrow("Stop uncertain");
    expect(f.db.scopedWorktreeClosingTurns(P)[0]).toMatchObject({ status: "opened", result: { output: expect.any(String) } });
    expect(f.residents.size).toBe(1); await f.runtime.reconcile(); expect(f.db.scopedWorktreeClosingTurns(P)[0]!.status).toBe("opened");
    f.residents.clear(); await f.runtime.reconcile(); expect(f.db.scopedWorktreeClosingTurns(P)[0]!.status).toBe("stopped");
    expect(f.launcher.open).toHaveBeenCalledTimes(1);
  });

  it.each(["abort", "revoked", "pause"] as const)("does not reserve a new native call after %s", async fault => {
    const f = await fixture();
    if (fault === "abort") f.controller.abort(new Error("Cancelled"));
    if (fault === "revoked") f.revoke();
    if (fault === "pause") freeze(f.databasePath);
    await expect(f.runtime.advance()).rejects.toThrow();
    expect(f.db.scopedWorktreeClosingTurns(P)).toEqual([]); expect(f.launcher.open).not.toHaveBeenCalled();
  });

  it("reconciles a prior opened supplement by exact physical Stop without restoring its capability or launching", async () => {
    const original = await openedClosingFixture(), f = await fixture({ original, actions: [] });
    await f.runtime.reconcile(); await f.runtime.advance();
    expect(f.launcher.stopScopedForRecovery).toHaveBeenCalledTimes(1);
    expect(f.launcher.stopScopedForRecovery.mock.calls[0]![0]).toMatchObject({ executionRuntimePath: original.closing.runtimePath,
      agentId: "worker", scopeId: original.execution.id, ownershipEpoch: 1 });
    expect(f.db.scopedWorktreeClosingTurns(P)[0]).toMatchObject({ status: "stopped" }); expect(f.launcher.open).not.toHaveBeenCalled();
    await expect(fs.readFile(path.join(original.closing.runtimePath, "worktree-closing/finish.json"))).rejects.toThrow();
  });


  it.each([false, true])("stops a retained supplement of an earlier writer without granting a second native call (opened=%s)", async opened => {
    const original = opened ? await openedClosingFixture() : await authorizedClosingFixture();
    if (!opened) original.db.beginScopedWorktreeClosingTurn({ projectId: P, executionId: original.execution.id, agentId: "worker", ownershipEpoch: 1,
      invocationId: "inv_reserved_closing", runtimePath: path.join(original.projectPath, "runtime/inv_reserved_closing"),
      capabilityHash: createHash("sha256").update("lost-process-private-capability").digest("hex"),
      grantInvocationId: "inv_manager", grantCallId: "close", originalStop: original.originalStop, observation: original.observation });
    const priorEpoch = original.db.writerLease().epoch, old = original.db.scopedWorktreeClosingTurns(P)[0]!;
    original.db.close();
    original.advance(600_001); // Closing a connection does not surrender its writer lease.
    const db = CollaborationStateDatabase.open({ databasePath: original.databasePath, serviceId: "test", instanceId: "replacement", hostId: "test", topology: "single-host", now: () => Date.parse(original.time()) });
    try {
      const f = await fixture({ original: { ...original, db } }); await f.runtime.reconcile(); await f.runtime.advance();
      expect(db.writerLease().epoch).toBeGreaterThan(priorEpoch);
      expect(db.scopedWorktreeClosingTurns(P)[0]).toMatchObject({ status: "stopped", invocationId: old.invocationId, writerLeaseEpoch: priorEpoch });
      expect(f.launcher.stopScopedForRecovery.mock.calls[0]![0].executionRuntimePath).toBe(old.runtimePath);
      expect(f.launcher.open).not.toHaveBeenCalled(); expect(db.scopedWorktreeClosingAuthorizations(P)).toHaveLength(1);
      expect(db.scopedWorktreeClosingCandidates(P)).toHaveLength(1);
    } finally { db.close(); }
  });

  it("keeps an orphan's native Stop uncertain and blocks further dispatch instead of restoring its capability", async () => {
    const original = await openedClosingFixture(), f = await fixture({ original, stop: () => ({ stopped: false, evidence: { pidUncertain: true } }) });
    await expect(f.runtime.reconcile()).rejects.toThrow("Stop remains unproven");
    await expect(f.runtime.advance()).rejects.toThrow("Stop remains unproven");
    expect(f.db.scopedWorktreeClosingTurns(P)[0]!.status).toBe("opened"); expect(f.launcher.open).not.toHaveBeenCalled();
    expect(f.db.scopedWorktreeClosingTurns(P)).toHaveLength(1);
  });

  it("materializes an already accepted completion while reconciling without inventing an actual output", async () => {
    const original = await openedClosingFixture();
    const envelope = original.envelope({ tool: "finish_task", memory: "Already accepted original closing Memory" }, "finish");
    original.db.completeScopedWorktreeClosing({ ...original.closing, envelope });
    const f = await fixture({ original }); await f.runtime.reconcile();
    const saved = JSON.parse(await fs.readFile(path.join(original.closing.runtimePath, "worktree-closing/finish.json"), "utf8"));
    expect(saved.memory).toBe("Already accepted original closing Memory"); expect(f.db.scopedWorktreeClosingTurns(P)[0]!.result).toBeUndefined();
  });

  it("never opens or reconciles historical native processes of a completed project", async () => {
    const f = await fixture({ original: await openedClosingFixture() }); f.state.status = "completed";
    await f.runtime.advance(); await f.runtime.reconcile(); expect(f.launcher.open).not.toHaveBeenCalled(); expect(f.launcher.stopScopedForRecovery).not.toHaveBeenCalled();
  });
});
