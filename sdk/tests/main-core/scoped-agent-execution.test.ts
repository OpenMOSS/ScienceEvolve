import { DatabaseSync } from "node:sqlite";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CollaborationStateDatabase } from "../../src/core/collaboration-state/store.js";
import { COLLABORATION_STATE_SCHEMA_VERSION } from "../../src/core/collaboration-state/contracts.js";
import { initializeCollaborationStateSchema } from "../../src/core/collaboration-state/schema.js";
import { ScopedAgentExecutionRunner, ScopedAgentTurnFailure, type ScopedAgentExecutionGit,
  type ScopedAgentTurnInput, type ScopedAgentTurnInvoker } from "../../src/core/scoped-agent-execution.js";
import { ResidentScopedAgentTurnInvoker } from "../../src/core/scoped-agent-resident.js";
import { finalizeOperation, mergedPullSynchronizationOperationId, prepareOperation } from "../../src/core/collaboration-git/operation.js";
import { ScopedAgentDeliveryIntegrator, type ScopedAgentDeliveryGit } from "../../src/core/scoped-agent-delivery-integrator.js";
import { deriveProjectRuntimeProjection } from "../../src/core/collaboration-runtime.js";
import type { CollaborationResidentOpenInput } from "../../src/core/collaboration-runtime.js";
import type { GitHubPullRequestFact, GitHubRepositoryFact, RemoteMergeSyncFact } from "../../src/core/collaboration-git/contracts.js";

const BASE = "b".repeat(40);
const HEAD = "a".repeat(40);
const NOW = "2026-09-30T00:00:00.000Z";
const repository: GitHubRepositoryFact = {
  provider: "github", providerId: 1, owner: "example", name: "openfars", private: true,
  defaultBranch: "main", htmlUrl: "https://github.com/example/openfars",
  cloneUrl: "https://github.com/example/openfars.git", observedAt: NOW
};
const roots: string[] = [];
const databases: CollaborationStateDatabase[] = [];
afterEach(async () => {
  databases.splice(0).forEach((database) => database.close());
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

async function fixture(weak = false, fixtureOptions: { complete?: boolean } = {}) {
  const root = await mkdtemp(join(tmpdir(), "openfars-scoped-native-"));
  roots.push(root);
  const options = { databasePath: join(root, "collaboration.sqlite"), serviceId: "native-test",
    hostId: "test-host", topology: "single-host" as const, instanceId: "instance-a", now: () => 1_000_000 };
  const database = CollaborationStateDatabase.open(options);
  databases.push(database);
  database.createProject({ projectId: "p", workflowRevision: 1, workerCapacity: 2,
    git: { enabled: true, status: "ready", repository: { owner: "example", name: "openfars",
      htmlUrl: repository.htmlUrl, private: true, defaultBranch: "main", localPath: join(root, "workspace") } },
    workflowSnapshot: { schemaVersion: 3, agents: [{ name: "main" }, { name: "one" }, { name: "two" }],
      collaborations: [{ id: "G" }], scopedWorkflow: { schemaVersion: 1, rootAgentIds: ["main"], groups: [{
        id: "G", leaderAgentId: "main", allowLeaderReconfiguration: false,
        workflow: { nodes: [{ kind: "agent", nodeId: "G_one", agentId: "one" },
          { kind: "agent", nodeId: "G_two", agentId: "two" }],
          input: { source: "input", edges: [{ kind: "parallel", target: "G_one" }, { kind: "parallel", target: "G_two" }] },
          routes: { G_one: [{ kind: weak ? "weak" : "strong", target: "finish" }],
            G_two: [{ kind: "strong", target: "G_one" }] } }
      }] } } });
  const group = database.activateScopedGroup({ projectId: "p", groupRunId: "run-G", groupId: "G",
    activationRequestId: "activate-G", workflowRevision: 1, baseCommit: BASE,
    outer: { nodeRunId: "node-G", inputSnapshotRef: "input:p", activatedByAgentId: "main" } });
  const execution = database.claimScopedAgentArrival({ projectId: "p", arrivalRequestId: group.arrivals[0]!.requestId,
    agentId: "one", executionId: "exec-one", worktreePath: join(root, "git-worktrees", "agents", "one") })!.execution;
  const store = database.operationsForProject("p", true);
  const git: ScopedAgentExecutionGit = {
    observeRemoteRef: vi.fn(async (_repository, ref) => ({ owner: "example", repository: "openfars", ref,
      status: "present", sha: BASE, observedAt: NOW })),
    sessionBegin: vi.fn(async (authority, epoch, input) => {
      await store.assertExecutionOwnership({ projectId: "p", executionId: authority.id, ownershipEpoch: epoch,
        expectedBranch: authority.executionBranch, operation: "worktree.create" });
      return { projectId: "p", executionId: authority.id, ownershipEpoch: epoch, branch: authority.executionBranch,
        worktreePath: authority.worktreePath, head: input.kind === "delivery" ? input.base.commitSha! : BASE,
        retained: true, observedAt: NOW };
    }),
    observeRetainedExecution: vi.fn(async (authority, epoch) => ({ projectId: "p", executionId: authority.id,
      ownershipEpoch: epoch, branch: authority.executionBranch, worktreePath: authority.worktreePath,
      head: BASE, retained: true, observedAt: NOW })),
    checkpointAndPush: vi.fn(async (request) => {
      await store.assertExecutionOwnership({ projectId: "p", executionId: request.execution.id,
        ownershipEpoch: request.ownershipEpoch, expectedBranch: request.execution.executionBranch, operation: "checkpoint" });
      const operation = await prepareOperation(store, { id: request.operationId, kind: "git.push", status: "prepared",
        ownerExecutionId: request.execution.id, ownershipEpoch: request.ownershipEpoch,
        expectedHead: HEAD, expectedBase: request.execution.executionBranch }, { head: HEAD });
      const remote = { owner: "example", repository: "openfars", ref: request.execution.executionBranch,
        status: "present" as const, sha: HEAD, observedAt: NOW };
      if (operation.status !== "finalized") await finalizeOperation(store, operation, { ...remote });
      return { checkpoint: { projectId: "p", executionId: request.execution.id, ownershipEpoch: request.ownershipEpoch,
        branch: request.execution.executionBranch, worktreePath: request.execution.worktreePath,
        head: HEAD, commitSha: HEAD, changed: true, retained: true, observedAt: NOW }, remote };
    })
  };
  const invoker: ScopedAgentTurnInvoker = { invoke: vi.fn(async (input) => {
    input.onOpened();
    if (fixtureOptions.complete !== false && !database.scopedAgentTaskCompleted("p", input.execution.id, input.execution.ownershipEpoch)) database.recordScopedAgentTaskCompletion({ projectId: "p", executionId: input.execution.id,
      ownershipEpoch: input.execution.ownershipEpoch, agentId: input.execution.agentId, invocationId: input.invocationId,
      callId: `finish-${input.invocationId}`, summary: "Finished", requestedAt: NOW });
    return { output: "Committed work and report", selectedWeakTarget: weak ? "finish" : undefined, residentStopConfirmed: true };
  }) };
  const runner = new ScopedAgentExecutionRunner(database, git, invoker, () => root);
  const input = { projectId: "p", executionId: execution.id, ownershipEpoch: 1, repository };
  return { root, database, options, group, execution, git, invoker, runner, input };
}

describe("scoped native execution and report checkpoint", () => {
  it("archives ordered native text idempotently without accepting completion or delivery, and survives writer reopen", async () => {
    const f = await fixture(false, { complete: false });
    const identity = { ...f.input, invocationId: "inv_" + "8".repeat(32) };
    f.database.beginScopedAgentTurn({ ...identity, runtimePath: join(f.root, "runtime", identity.invocationId), baseCommit: BASE });
    f.database.markScopedAgentTurnOpened({ ...identity, nativeProcessOpened: true });
    const before = f.database.projectState("p");
    const input = { ...identity, agentId: "one", inputId: "original-input", output: "Actual business result\n" + "result-".repeat(7000) };
    expect(f.database.recordScopedAgentNativeOutput(input).replay).toBe(false);
    const after = f.database.projectState("p");
    expect(f.database.recordScopedAgentNativeOutput(input)).toEqual({ revision: after.stateRevision, replay: true });
    expect(f.database.projectState("p")).toEqual(after);
    expect(() => f.database.recordScopedAgentNativeOutput({ ...input, output: "Changed same input result" })).toThrow(/changed on replay/);
    f.database.recordScopedAgentNativeOutput({ ...input, inputId: "mechanism-supplement", output: "Actual later tool observation" });
    const outputs = f.database.scopedAgentNativeOutputs("p", f.execution.id, 1, identity.invocationId);
    expect(outputs.map(entry => [entry.inputId, entry.output])).toEqual([[input.inputId, input.output], ["mechanism-supplement", "Actual later tool observation"]]);
    expect(f.database.scopedAgentNativeOutputs("foreign", f.execution.id, 1, identity.invocationId)).toEqual([]);
    expect(f.database.scopedAgentNativeOutputs("p", f.execution.id, 2, identity.invocationId)).toEqual([]);
    expect(f.database.scopedAgentNativeOutputs("p", "another-execution", 1, identity.invocationId)).toEqual([]);
    expect(f.database.scopedAgentNativeOutputs("p", f.execution.id, 1, "another-invocation")).toEqual([]);
    expect(f.database.scopedAgentReport("p", f.execution.id, 1)).toBeUndefined();
    expect(f.database.scopedAgentTaskCompletion("p", f.execution.id, 1)).toBeUndefined();
    expect(f.database.projectState("p").scopedExecutions).toEqual(before.scopedExecutions);
    expect(f.database.projectState("p").operations).toEqual(before.operations);
    const writerLease = f.database.writerLease(); f.database.close();
    const reopened = CollaborationStateDatabase.open({ ...f.options, writerLease }); databases.push(reopened);
    expect(reopened.scopedAgentNativeOutputs("p", f.execution.id, 1, identity.invocationId)).toEqual(outputs);
    expect(reopened.scopedAgentReport("p", f.execution.id, 1)).toBeUndefined();
  });

  it.each(["reserved", "stopped", "execution", "epoch", "invocation", "agent", "writer"] as const)(
    "rejects scoped native text outside its exact opened owner (%s)", async mode => {
      const f = await fixture(false, { complete: false });
      const identity = { ...f.input, invocationId: "inv_" + "9".repeat(32) };
      f.database.beginScopedAgentTurn({ ...identity, runtimePath: join(f.root, "runtime", identity.invocationId), baseCommit: BASE });
      if (mode !== "reserved") f.database.markScopedAgentTurnOpened({ ...identity, nativeProcessOpened: true });
      if (mode === "stopped") f.database.stopScopedAgentTurn({ ...identity, residentStopConfirmed: true });
      const input = { ...identity, agentId: "one", inputId: "original-input", output: "Unaccepted text" };
      if (mode === "execution") input.executionId = "foreign-execution";
      if (mode === "epoch") input.ownershipEpoch = 2;
      if (mode === "invocation") input.invocationId = "inv_" + "0".repeat(32);
      if (mode === "agent") input.agentId = "two";
      let database = f.database;
      if (mode === "writer") {
        database.close();
        database = CollaborationStateDatabase.open({ ...f.options, instanceId: "another-writer", now: () => 2_000_000 });
        databases.push(database);
      }
      const before = database.projectState("p");
      expect(() => database.recordScopedAgentNativeOutput(input)).toThrow(/exact opened scoped owner/);
      expect(database.projectState("p")).toEqual(before);
      expect(database.scopedAgentNativeOutputs("p", f.execution.id, 1, identity.invocationId)).toEqual([]);
    });

  it("retains exact failure reasons and attempt history after retry and writer reopen without importing other arrivals", async () => {
    const f = await fixture(false, { complete: false });
    const fail = (ownershipEpoch: number, reason: string) => {
      const identity = { ...f.input, ownershipEpoch, invocationId: `original-failure-${ownershipEpoch}` };
      f.database.beginScopedAgentTurn({ ...identity, runtimePath: join(f.root, "runtime", identity.invocationId), baseCommit: BASE });
      f.database.stopScopedAgentTurn({ ...identity, residentStopConfirmed: true });
      f.database.failScopedAgentArrival({ ...identity, arrivalRequestId: f.execution.arrivalRequestId, reason, residentStopConfirmed: true });
    };
    fail(1, "Original preparation error");
    f.database.retryScopedAgentArrival({ ...f.input, arrivalRequestId: f.execution.arrivalRequestId, failedOwnershipEpoch: 1 });
    expect(f.database.scopedRecoveryCandidates("p", "run-G")).toEqual([]);
    fail(2, "Agent worktree is dirty; branch switch would risk unfinished work");
    for (const payload of [
      { executionId: "another-execution", arrivalRequestId: f.execution.arrivalRequestId, ownershipEpoch: 2, reason: "foreign execution" },
      { executionId: f.execution.id, arrivalRequestId: "another-arrival", ownershipEpoch: 2, reason: "foreign arrival" },
      { executionId: f.execution.id, arrivalRequestId: f.execution.arrivalRequestId, ownershipEpoch: 99, reason: "future epoch" }
    ]) f.database.appendEvent({ projectId: "p", type: "scoped.agent.failed", payload });
    const candidate = f.database.scopedRecoveryCandidates("p", "run-G")[0]!;
    expect(candidate).toMatchObject({ executionId: f.execution.id, ownershipEpoch: 2,
      reason: "Agent worktree is dirty; branch switch would risk unfinished work", failureHistory: [
        expect.objectContaining({ ownershipEpoch: 1, reason: "Original preparation error" }),
        expect.objectContaining({ ownershipEpoch: 2, reason: "Agent worktree is dirty; branch switch would risk unfinished work" })
      ] });
    const writerLease = f.database.writerLease(); f.database.close();
    const reopened = CollaborationStateDatabase.open({ ...f.options, writerLease }); databases.push(reopened);
    const before = reopened.projectState("p");
    expect(reopened.scopedRecoveryCandidates("p", "run-G")).toEqual([candidate]);
    expect(reopened.projectState("p")).toEqual(before);
  });

  async function missingReportFixture(spentRepairBudget = false) {
    const f = await fixture(false, { complete: false });
    const oldIdentity = { ...f.input, invocationId: "inv_" + "4".repeat(32) };
    f.database.beginScopedAgentTurn({ ...oldIdentity, runtimePath: join(f.root, "runtime", oldIdentity.invocationId), baseCommit: BASE });
    f.database.markScopedAgentTurnOpened({ ...oldIdentity, nativeProcessOpened: true });
    f.database.recordScopedAgentReport({ ...oldIdentity, output: "Immutable earlier epoch report", residentTurnCompleted: true, residentStopConfirmed: true });
    const oldReport = f.database.scopedAgentReport("p", f.execution.id, 1);
    f.database.failScopedAgentArrival({ ...oldIdentity, arrivalRequestId: f.execution.arrivalRequestId, reason: "Earlier epoch failed", residentStopConfirmed: true });
    const execution = f.database.retryScopedAgentArrival({ projectId: "p", executionId: f.execution.id,
      arrivalRequestId: f.execution.arrivalRequestId, failedOwnershipEpoch: 1 })!.execution;
    const identity = { projectId: "p", executionId: execution.id, ownershipEpoch: 2, invocationId: "inv_" + "5".repeat(32) };
    const originalRuntime = join(f.root, "runtime", identity.invocationId);
    f.database.beginScopedAgentTurn({ ...identity, runtimePath: originalRuntime, baseCommit: BASE });
    f.database.markScopedAgentTurnOpened({ ...identity, nativeProcessOpened: true });
    f.database.recordScopedAgentTaskCompletion({ ...identity, agentId: "one", callId: "original-finish", requestedAt: NOW, memory: "Original retained memory" });
    const completion = f.database.scopedAgentTaskCompletion("p", execution.id, 2);
    if (spentRepairBudget) for (let attempt = 0; attempt < 2; attempt++) {
      f.database.reserveScopedAgentMechanismRepair({ ...identity, missing: ["git_push"] });
    }
    f.database.stopScopedAgentTurn({ ...identity, residentStopConfirmed: true });
    f.database.failScopedAgentArrival({ ...identity, arrivalRequestId: execution.arrivalRequestId, reason: "Native result omitted report after merged PR", residentStopConfirmed: true });
    const pull: GitHubPullRequestFact = { id: "pull-original", providerNumber: 71, owner: repository.owner, repository: repository.name,
      ownerExecutionId: execution.id, head: execution.executionBranch, headSha: HEAD, base: "groups/run-G",
      status: "merged", mergeCommitSha: "c".repeat(40), htmlUrl: repository.htmlUrl + "/pull/71", observedAt: NOW };
    f.database.recordScopedRecoveryPull({ ...identity, pull });
    const managerInput = { projectId: "p", groupRunId: "run-G", agentId: "main", invocationId: "inv_" + "6".repeat(32),
      runtimePath: join(f.root, "runtime", "inv_" + "6".repeat(32)) };
    const managerClaim = f.database.claimScopedLeaderTurn(managerInput)!;
    const manager = { ...managerInput, coordinatorEpoch: managerClaim.coordinatorEpoch };
    f.database.markScopedLeaderOpened(manager);
    const envelope = (action: import("../../src/core/types.js").ControlAction, callId: string) => ({ projectId: "p", agent: "main",
      invocationId: manager.invocationId, callId, stateVersion: manager.coordinatorEpoch, capabilityHash: "a".repeat(64), receivedAt: NOW, action });
    f.database.recordScopedLeaderTaskCompletion({ ...manager, envelope: envelope({ tool: "finish_task" }, "manager-finish") });
    const coordination = envelope({ tool: "coordinate_group_task", groupRunId: "run-G", coordinatorEpoch: manager.coordinatorEpoch,
      arrivalRequestId: execution.arrivalRequestId, operation: "retry", rationale: "Original Agent must supply its missing report" }, "missing-report-retry");
    f.database.acceptScopedLeaderAction({ ...manager, envelope: coordination, residentStopConfirmed: true });
    f.database.releaseScopedLeaderTurn({ ...manager, residentStopConfirmed: true });
    const repair = { projectId: "p", executionId: execution.id, ownershipEpoch: 2, invocationId: "inv_" + "7".repeat(32),
      runtimePath: join(f.root, "runtime", "inv_" + "7".repeat(32)), coordination };
    return { ...f, execution, identity, originalRuntime, oldReport, completion, manager, coordination, pull, repair };
  }

  it.each(["valid", "epoch", "call", "decision", "manager", "runtime", "reuse", "cancelled", "writer", "execution"] as const)(
    "reserves a merged missing-report supplement only under the exact released retry (%s)", async mode => {
      const f = await missingReportFixture();
      const before = f.database.projectState("p");
      const repair = structuredClone(f.repair);
      if (mode === "epoch") repair.ownershipEpoch = 1;
      if (mode === "call") repair.coordination.callId = "another-call";
      if (mode === "decision") (repair.coordination.action as any).operation = "skip";
      if (mode === "manager") repair.coordination.invocationId = f.identity.invocationId;
      if (mode === "runtime") repair.runtimePath = join(f.root, "other", repair.invocationId);
      if (mode === "reuse") { repair.invocationId = f.identity.invocationId; repair.runtimePath = f.originalRuntime; }
      if (mode === "cancelled") f.database.appendEvent({ projectId: "p", requestId: "stop-before-repair", type: "project.cancellation.requested", payload: { actor: "user", resumable: true } });
      if (mode === "writer") {
        f.database.close();
        const next = CollaborationStateDatabase.open({ ...f.options, instanceId: "next-writer", now: () => 2_000_000 });
        databases.push(next);
        expect(() => next.beginScopedAgentMissingReportRepair(repair)).toThrow(/exact stopped/); return;
      }
      if (mode === "execution") { repair.executionId = "exec-two"; }
      if (mode !== "valid") { expect(() => f.database.beginScopedAgentMissingReportRepair(repair)).toThrow(); return; }
      expect(f.database.beginScopedAgentMissingReportRepair(repair)).toMatchObject({ attempt: 1, turn: { status: "reserved", ownershipEpoch: 2, invocationId: repair.invocationId } });
      expect(f.database.beginScopedAgentMissingReportRepair(repair)).toBeUndefined();
      expect(f.database.scopedAgentReport("p", f.execution.id, 2)).toBeUndefined();
      expect(f.database.scopedAgentReport("p", f.execution.id, 1)).toEqual(f.oldReport);
      expect(f.database.scopedAgentTaskCompletion("p", f.execution.id, 2)).toEqual(f.completion);
      expect(f.database.scopedAgentMechanismRepairCount("p", f.execution.id)).toBe(0);
      expect(f.database.scopedExecution("p", f.execution.id)).toMatchObject({ id: f.execution.id, ownershipEpoch: 2, executionBranch: f.execution.executionBranch, worktreePath: f.execution.worktreePath });
      expect(f.database.assertScopedAgentMissingReportRepairLaunch({ ...repair, agentId: "one" })).toEqual({ previousRuntimePath: f.originalRuntime });
      expect(f.database.scopedAgentTaskCompleted("p", f.execution.id, 2, repair.invocationId)).toBe(true);
      expect(f.database.scopedAgentTaskCompleted("p", f.execution.id, 2, "foreign-report")).toBe(false);
      expect(before.scopedExecutions?.find(x => x.id === f.execution.id)?.status).toBe("failed");
      for (const operation of ["checkpoint", "worktree.create", "merge.prepare", "merge.integrate"] as const) {
        expect(() => f.database.assertScopedGitExecutionOwnership({ projectId: "p", executionId: f.execution.id,
          ownershipEpoch: 2, expectedBranch: f.execution.executionBranch, operation })).toThrow();
      }
    });

  it("lets the original Agent author the absent epoch report without replacing its completion, earlier report or checkout", async () => {
    const f = await missingReportFixture();
    f.database.beginScopedAgentMissingReportRepair(f.repair);
    const restore = vi.fn(async () => BASE);
    f.git.restoreRetainedExecutionBase = restore;
    const invoke = vi.fn(async (input: ScopedAgentTurnInput) => {
      expect(restore).toHaveBeenCalledOnce();
      expect(input.missingReportRepair).toMatchObject({ originalInvocationId: f.identity.invocationId, coordination: f.coordination });
      expect(input.invocationId).toBe(f.repair.invocationId); expect(input.baseCommit).toBe(BASE);
      expect(f.database.scopedAgentReport("p", f.execution.id, 2)).toBeUndefined();
      input.onOpened();
      return { output: "Original Agent's actual missing report after inspecting its existing PR", reportHeadSha: HEAD, residentStopConfirmed: true as const };
    });
    const runner = new ScopedAgentExecutionRunner(f.database, f.git, { invoke }, () => f.root, { automaticCheckpoint: false });
    const input = { ...f.input, ownershipEpoch: 2 };
    expect(await runner.prepareDelivery(input)).toMatchObject({ ownershipEpoch: 2, expectedHeadSha: HEAD, output: "Original Agent's actual missing report after inspecting its existing PR" });
    expect(await runner.prepareDelivery(input)).toMatchObject({ ownershipEpoch: 2, expectedHeadSha: HEAD });
    expect(invoke).toHaveBeenCalledOnce();
    expect(f.git.sessionBegin).not.toHaveBeenCalled(); expect(f.git.observeRetainedExecution).toHaveBeenCalledTimes(2);
    expect(restore).toHaveBeenCalledTimes(2);
    expect(f.git.checkpointAndPush).not.toHaveBeenCalled(); expect(f.git.observeRemoteRef).not.toHaveBeenCalled();
    expect(f.database.scopedAgentTaskCompletion("p", f.execution.id, 2)).toEqual(f.completion);
    expect(f.database.scopedAgentReport("p", f.execution.id, 1)).toEqual(f.oldReport);
    expect(f.database.scopedAgentTurn("p", f.execution.id, 2)).toMatchObject({ status: "stopped", invocationId: f.repair.invocationId });
  });

  it.each(["agent-memory/one/Memory.md", "compute/probe.js"])("reports the actual pending path instead of a false missing push during report recovery (%s)", async pendingPath => {
    const f = await missingReportFixture(true);
    f.database.beginScopedAgentMissingReportRepair(f.repair);
    f.git.observeExecutionWorktree = vi.fn(async (execution, epoch) => ({ projectId: "p", executionId: execution.id,
      ownershipEpoch: epoch, branch: execution.executionBranch, worktreePath: execution.worktreePath,
      head: HEAD, retained: true, observedAt: NOW, pendingPaths: [pendingPath] }));
    const invoke = vi.fn(async (input: ScopedAgentTurnInput) => {
      input.onOpened();
      return { output: "Observed original merged PR; the checkout still has a pending file", reportHeadSha: HEAD,
        residentStopConfirmed: true as const };
    });
    const runner = new ScopedAgentExecutionRunner(f.database, f.git, { invoke }, () => f.root,
      { automaticCheckpoint: false, requireAgentGitDeliveryFacts: true });
    await expect(runner.prepareDelivery({ ...f.input, ownershipEpoch: 2 })).rejects.toThrow(`pending worktree path(s): ["${pendingPath}"]`);
    const report = f.database.scopedAgentReport("p", f.execution.id, 2)!;
    expect(report.headSha).toBeUndefined();
    expect(report.output).toContain("Observed original merged PR");
    const failure = f.database.scopedRecoveryCandidates("p", "run-G")[0]!;
    // Exhaustion retains the original owner and its mechanism incident;
    // the thrown preparation error carries the current checkout diagnostic.
    expect(failure.reason).toContain("automatic mechanism repairs exhausted");
    expect(failure.reason).not.toContain("must explicitly call git_push");
    expect(f.database.scopedAgentTaskCompletion("p", f.execution.id, 2)).toEqual(f.completion);
    expect(f.database.scopedRecoveryPull("p", f.execution.id, 2)).toEqual(f.pull);
    expect(f.database.scopedAgentMechanismRepairCount("p", f.execution.id)).toBe(2);
    expect(f.database.scopedExecution("p", f.execution.id)).toMatchObject({ status: "integrating", ownershipEpoch: 2 });
    expect(f.git.checkpointAndPush).not.toHaveBeenCalled();
    expect(invoke).toHaveBeenCalledOnce();
  });

  it("preserves the original failure and completion when the finite missing-report native turn itself fails", async () => {
    const f = await missingReportFixture();
    const originalFailure = f.database.eventByRequestId("p", `scoped-failure:${f.execution.id}:2`);
    f.database.beginScopedAgentMissingReportRepair(f.repair);
    const invoke = vi.fn(async (input: ScopedAgentTurnInput) => {
      input.onOpened(); throw new ScopedAgentTurnFailure("Original Agent could not supply a report", true);
    });
    const runner = new ScopedAgentExecutionRunner(f.database, f.git, { invoke }, () => f.root, { automaticCheckpoint: false });
    await expect(runner.prepareDelivery({ ...f.input, ownershipEpoch: 2 })).rejects.toThrow("could not supply a report");
    expect(f.database.eventByRequestId("p", `scoped-failure:${f.execution.id}:2`)).toEqual(originalFailure);
    expect(f.database.eventByRequestId("p", `scoped-missing-report-failure:${f.execution.id}:2:${f.repair.invocationId}`)).toBeDefined();
    expect(f.database.scopedExecution("p", f.execution.id)).toMatchObject({ status: "failed", ownershipEpoch: 2 });
    expect(f.database.scopedAgentTaskCompletion("p", f.execution.id, 2)).toEqual(f.completion);
    expect(f.database.scopedAgentReport("p", f.execution.id, 1)).toEqual(f.oldReport);
    expect(f.database.scopedAgentReport("p", f.execution.id, 2)).toBeUndefined();
    expect(f.database.beginScopedAgentMissingReportRepair(f.repair)).toBeUndefined();
    await expect(runner.prepareDelivery({ ...f.input, ownershipEpoch: 2 })).rejects.toThrow();
    expect(invoke).toHaveBeenCalledOnce();
    expect(f.database.scopedAgentMechanismRepairCount("p", f.execution.id)).toBe(0);
  });

  it.each(["reserved", "opened", "stopped", "recorded_failure"] as const)(
    "retains a missing-report supplement's failure identity across writers (%s)", async mode => {
      const f = await missingReportFixture(true);
      const originalFailure = f.database.eventByRequestId("p", `scoped-failure:${f.execution.id}:2`);
      f.database.beginScopedAgentMissingReportRepair(f.repair);
      if (mode !== "reserved") f.database.markScopedAgentTurnOpened({ ...f.repair, nativeProcessOpened: true });
      if (mode === "stopped" || mode === "recorded_failure")
        f.database.stopScopedAgentTurn({ ...f.repair, residentStopConfirmed: true });
      const failure = { ...f.repair, arrivalRequestId: f.execution.arrivalRequestId,
        residentStopConfirmed: true as const,
        reason: "Interrupted native invocation stopped; its group Leader must coordinate retained-branch recovery" };
      const failureKey = `scoped-missing-report-failure:${f.execution.id}:2:${f.repair.invocationId}`;
      if (mode === "recorded_failure") f.database.failScopedAgentArrival(failure);
      const recorded = f.database.eventByRequestId("p", failureKey);
      f.database.close();
      const next = CollaborationStateDatabase.open({ ...f.options, instanceId: "next-writer", now: () => 2_000_000 });
      databases.push(next);
      const before = next.projectState("p");
      // Historical identity is not permission to launch under the new writer.
      expect(next.scopedAgentMissingReportRepair("p", f.execution.id, 2)).toBeUndefined();
      expect(() => next.assertScopedAgentMissingReportRepairLaunch({ ...f.repair, agentId: "one" })).toThrow(/exact unused reserved lineage/);
      if (mode !== "recorded_failure") expect(() => next.failScopedAgentArrival(failure)).toThrow(/native stop proof/);
      const proof = (invocationId: string, runtimePath: string) => ({ ...f.repair, invocationId,
        residentStopConfirmed: true as const, evidence: { protocol: "scoped-supervisor-stop-v1", projectId: "p",
          scopeId: f.execution.id, agentId: "one", role: "delivery", ownershipEpoch: 2,
          runtimePath, nativeProcessScanCleared: true } });
      expect(() => next.reconcileScopedAgentTurn(proof(f.identity.invocationId, f.originalRuntime))).toThrow(/exact native owner/);
      expect(next.projectState("p")).toEqual(before);
      next.reconcileScopedAgentTurn(proof(f.repair.invocationId, f.repair.runtimePath));
      if (mode === "reserved") {
        // No native turn opened: retain the authorized retry and its original
        // ancestry under a fresh physical reservation, without another failure.
        const retained = next.scopedAgentMissingReportRepair("p", f.execution.id, 2)!;
        expect(retained).toMatchObject({ originalInvocationId: f.identity.invocationId });
        const physical = next.scopedAgentTurn("p", f.execution.id, 2)!;
        expect(physical.invocationId).not.toBe(f.repair.invocationId);
        expect(physical.runtimePath).not.toBe(f.repair.runtimePath);
        expect(physical).toMatchObject({ status: "reserved", ownershipEpoch: 2 });
        expect(physical.openedAt).toBeUndefined();
        expect(next.eventByRequestId("p", failureKey)).toBeUndefined();
        expect(next.eventByRequestId("p", `scoped-failure:${f.execution.id}:2`)).toEqual(originalFailure);
        expect(next.scopedAgentTaskCompletion("p", f.execution.id, 2)).toEqual(f.completion);
        expect(next.scopedAgentReport("p", f.execution.id, 1)).toEqual(f.oldReport);
        expect(next.scopedExecution("p", f.execution.id)).toMatchObject({ status: "running", ownershipEpoch: 2,
          executionBranch: f.execution.executionBranch, worktreePath: f.execution.worktreePath });
        expect(f.invoker.invoke).not.toHaveBeenCalled();
        expect(f.git.checkpointAndPush).not.toHaveBeenCalled();
        return;
      }
      expect(next.failScopedAgentArrival(failure).replay).toBe(mode === "recorded_failure");
      expect(next.eventByRequestId("p", failureKey)?.payload.reason).toBe(failure.reason);
      if (mode === "recorded_failure") expect(next.eventByRequestId("p", failureKey)).toEqual(recorded);
      expect(next.failScopedAgentArrival(failure).replay).toBe(true);
      expect(() => next.failScopedAgentArrival({ ...failure, reason: "Changed reason" })).toThrow(/changed on replay/);
      expect(next.eventByRequestId("p", `scoped-failure:${f.execution.id}:2`)).toEqual(originalFailure);
      expect(next.scopedAgentTaskCompletion("p", f.execution.id, 2)).toEqual(f.completion);
      expect(next.scopedAgentReport("p", f.execution.id, 1)).toEqual(f.oldReport);
      expect(next.scopedAgentReport("p", f.execution.id, 2)).toBeUndefined();
      expect(next.scopedRecoveryPull("p", f.execution.id, 2)).toEqual(f.pull);
      expect(next.scopedExecution("p", f.execution.id)).toMatchObject({ status: "failed", ownershipEpoch: 2,
        executionBranch: f.execution.executionBranch, worktreePath: f.execution.worktreePath });
      expect(next.scopedRecoveryCandidates("p", "run-G")[0]).toMatchObject({ executionId: f.execution.id,
        failedArrivalRequestId: f.execution.arrivalRequestId, ownershipEpoch: 2, reason: failure.reason });
      expect(next.scopedAgentMechanismRepairCount("p", f.execution.id)).toBe(2);
      expect(next.beginScopedAgentMissingReportRepair(f.repair)).toBeUndefined();
      expect(() => next.beginScopedAgentMissingReportRepair({ ...f.repair, invocationId: "inv_" + "9".repeat(32),
        runtimePath: join(f.root, "runtime", "inv_" + "9".repeat(32)) })).toThrow(/changed on replay/);
      expect(next.scopedAgentMissingReportRepair("p", f.execution.id, 2)).toBeUndefined();
      expect(f.invoker.invoke).not.toHaveBeenCalled();
      expect(f.git.sessionBegin).not.toHaveBeenCalled();
      expect(f.git.checkpointAndPush).not.toHaveBeenCalled();
    });

  it.each(["before_open", "after_open", "missing_head"] as const)(
    "records a stopped report supplement's own failure without replacing its original failure (%s)", async mode => {
      const f = await fixture(false, { complete: false });
      const original = { ...f.input, invocationId: "inv_" + "5".repeat(32) };
      f.database.beginScopedAgentTurn({ ...original, runtimePath: join(f.root, "runtime", original.invocationId), baseCommit: BASE });
      f.database.markScopedAgentTurnOpened({ ...original, nativeProcessOpened: true });
      f.database.recordScopedAgentTaskCompletion({ ...original, agentId: "one", callId: "original-finish", requestedAt: NOW,
        memory: "Original completion must stay immutable" });
      f.database.recordScopedAgentReport({ ...original, output: "Original business report", residentTurnCompleted: true, residentStopConfirmed: true });
      const report = f.database.scopedAgentReport("p", f.execution.id, 1);
      const completion = f.database.scopedAgentTaskCompletion("p", f.execution.id, 1);
      f.database.failScopedAgentArrival({ ...original, arrivalRequestId: f.execution.arrivalRequestId,
        reason: "Original partial report needs reconciliation", residentStopConfirmed: true });
      const originalFailure = f.database.eventByRequestId("p", `scoped-failure:${f.execution.id}:1`);
      f.database.recordScopedRecoveryPull({ ...original, pull: { id: "retained-merged-pr", providerNumber: 7,
        owner: repository.owner, repository: repository.name, ownerExecutionId: f.execution.id,
        head: f.execution.executionBranch, headSha: HEAD, base: "groups/run-G", status: "merged",
        mergeCommitSha: "c".repeat(40), htmlUrl: `${repository.htmlUrl}/pull/7`, observedAt: NOW } });
      const managerInput = { projectId: "p", groupRunId: "run-G", agentId: "main", invocationId: "inv_" + "6".repeat(32),
        runtimePath: join(f.root, "runtime", "inv_" + "6".repeat(32)) };
      const manager = { ...managerInput, coordinatorEpoch: f.database.claimScopedLeaderTurn(managerInput)!.coordinatorEpoch };
      f.database.markScopedLeaderOpened(manager);
      const envelope = (action: import("../../src/core/types.js").ControlAction, callId: string) => ({ projectId: "p", agent: "main",
        invocationId: manager.invocationId, callId, stateVersion: manager.coordinatorEpoch, capabilityHash: "a".repeat(64), receivedAt: NOW, action });
      f.database.recordScopedLeaderTaskCompletion({ ...manager, envelope: envelope({ tool: "finish_task" }, "manager-finish") });
      const coordination = envelope({ tool: "coordinate_group_task", groupRunId: "run-G", coordinatorEpoch: manager.coordinatorEpoch,
        arrivalRequestId: f.execution.arrivalRequestId, operation: "retry", rationale: "Original Agent must reconcile its report" }, "report-retry");
      f.database.acceptScopedLeaderAction({ ...manager, envelope: coordination, residentStopConfirmed: true });
      f.database.releaseScopedLeaderTurn({ ...manager, residentStopConfirmed: true });
      expect(f.database.resumeScopedMergedDelivery("p", f.execution.id, 1, coordination)).toBe(true);
      const invoke = vi.fn(async (input: ScopedAgentTurnInput) => {
        expect(input.reportRepair?.report).toEqual(report);
        if (mode !== "before_open") input.onOpened();
        if (mode !== "missing_head") throw new ScopedAgentTurnFailure("Supplement could not reconcile its retained PR", true);
        return { output: "Supplement still lacks its delivery head", residentStopConfirmed: true as const };
      });
      const runner = new ScopedAgentExecutionRunner(f.database, f.git, { invoke }, () => f.root, { automaticCheckpoint: false });
      const reason = mode === "missing_head" ? "Original Agent report head remains unbound; its current checkout needs matching observed PR delivery facts for the retained merged task"
        : "Supplement could not reconcile its retained PR";
      await expect(runner.prepareDelivery(f.input)).rejects.toThrow(reason);
      const turn = f.database.scopedAgentTurn("p", f.execution.id, 1)!;
      if (mode === "before_open") {
        expect(turn.status).toBe("reserved");
        expect(() => f.database.failScopedAgentArrival({ ...f.input, arrivalRequestId: f.execution.arrivalRequestId,
          reason, residentStopConfirmed: true })).toThrow(/native stop proof/);
        f.database.stopScopedAgentTurn({ ...f.input, invocationId: turn.invocationId, residentStopConfirmed: true });
        f.database.failScopedAgentArrival({ ...f.input, arrivalRequestId: f.execution.arrivalRequestId, reason, residentStopConfirmed: true });
      }
      const failure = f.database.eventByRequestId("p", `scoped-report-repair-failure:${f.execution.id}:1:${turn.invocationId}`);
      expect(failure?.payload).toMatchObject({ executionId: f.execution.id, ownershipEpoch: 1, reason });
      expect(f.database.eventByRequestId("p", `scoped-failure:${f.execution.id}:1`)).toEqual(originalFailure);
      expect(f.database.scopedAgentReport("p", f.execution.id, 1)).toEqual(report);
      expect(f.database.scopedAgentTaskCompletion("p", f.execution.id, 1)).toEqual(completion);
      expect(f.database.scopedExecution("p", f.execution.id)).toMatchObject({ status: "failed", ownershipEpoch: 1,
        executionBranch: f.execution.executionBranch, worktreePath: f.execution.worktreePath });
      const failureInput = { ...f.input, arrivalRequestId: f.execution.arrivalRequestId, reason, residentStopConfirmed: true as const };
      const projection = f.database.projectState("p");
      expect(f.database.failScopedAgentArrival(failureInput).replay).toBe(true);
      expect(f.database.projectState("p")).toEqual(projection);
      expect(() => f.database.failScopedAgentArrival({ ...failureInput, reason: "Changed reason" })).toThrow(/changed on replay/);
      expect(() => f.database.failScopedAgentArrival({ ...failureInput, arrivalRequestId: "foreign-arrival" })).toThrow();
      expect(() => f.database.failScopedAgentArrival({ ...failureInput, ownershipEpoch: 2 })).toThrow();
      expect(f.database.scopedRecoveryCandidates("p", "run-G")[0]).toMatchObject({ executionId: f.execution.id,
        failedArrivalRequestId: f.execution.arrivalRequestId, ownershipEpoch: 1, reason,
        failureHistory: expect.arrayContaining([expect.objectContaining({ ownershipEpoch: 1, reason })]) });
      expect(f.database.scopedRecoveryCandidates("p", "run-G")[0]?.pendingOperation).toBeUndefined();
      expect(invoke).toHaveBeenCalledOnce();
      expect(f.git.checkpointAndPush).not.toHaveBeenCalled();
    });

  it.each(["crash_gap", "recorded_failure"] as const)(
    "retains a report supplement's failure identity across writer restarts (%s)", async mode => {
      const f = await fixture(false, { complete: false });
      const original = { ...f.input, invocationId: "inv_" + "5".repeat(32) };
      const originalRuntime = join(f.root, "runtime", original.invocationId);
      f.database.beginScopedAgentTurn({ ...original, runtimePath: originalRuntime, baseCommit: BASE });
      f.database.markScopedAgentTurnOpened({ ...original, nativeProcessOpened: true });
      f.database.recordScopedAgentTaskCompletion({ ...original, agentId: "one", callId: "original-finish", requestedAt: NOW,
        memory: "Original completion must stay immutable" });
      for (let attempt = 1; attempt <= 2; attempt++) f.database.reserveScopedAgentMechanismRepair({ ...original, missing: ["git_push"] });
      f.database.recordScopedAgentReport({ ...original, output: "Original business report", residentTurnCompleted: true, residentStopConfirmed: true });
      const completion = f.database.scopedAgentTaskCompletion("p", f.execution.id, 1);
      f.database.failScopedAgentArrival({ ...original, arrivalRequestId: f.execution.arrivalRequestId,
        reason: "Original partial report needs reconciliation", residentStopConfirmed: true });
      const originalFailure = f.database.eventByRequestId("p", `scoped-failure:${f.execution.id}:1`);
      f.database.close();
      const next = CollaborationStateDatabase.open({ ...f.options, instanceId: "next-writer", now: () => 2_000_000 });
      databases.push(next);
      const proof = (invocationId: string, runtimePath: string) => ({ ...f.input, invocationId, residentStopConfirmed: true as const,
        evidence: { protocol: "scoped-supervisor-stop-v1", projectId: "p", scopeId: f.execution.id, agentId: "one",
          role: "delivery", ownershipEpoch: 1, runtimePath, nativeProcessScanCleared: true } });
      next.reconcileScopedAgentTurn(proof(original.invocationId, originalRuntime));
      const pull: GitHubPullRequestFact = { id: "retained-merged-pr", providerNumber: 7, owner: repository.owner,
        repository: repository.name, ownerExecutionId: f.execution.id, head: f.execution.executionBranch, headSha: HEAD,
        base: "groups/run-G", status: "merged", mergeCommitSha: "c".repeat(40), htmlUrl: `${repository.htmlUrl}/pull/7`, observedAt: NOW };
      next.recordScopedRecoveryPull({ ...original, pull });
      const managerInput = { projectId: "p", groupRunId: "run-G", agentId: "main", invocationId: "inv_" + "6".repeat(32),
        runtimePath: join(f.root, "runtime", "inv_" + "6".repeat(32)) };
      const manager = { ...managerInput, coordinatorEpoch: next.claimScopedLeaderTurn(managerInput)!.coordinatorEpoch };
      next.markScopedLeaderOpened(manager);
      const envelope = (action: import("../../src/core/types.js").ControlAction, callId: string) => ({ projectId: "p", agent: "main",
        invocationId: manager.invocationId, callId, stateVersion: manager.coordinatorEpoch, capabilityHash: "a".repeat(64), receivedAt: NOW, action });
      next.recordScopedLeaderTaskCompletion({ ...manager, envelope: envelope({ tool: "finish_task" }, "manager-finish") });
      const coordination = envelope({ tool: "coordinate_group_task", groupRunId: "run-G", coordinatorEpoch: manager.coordinatorEpoch,
        arrivalRequestId: f.execution.arrivalRequestId, operation: "retry", rationale: "Original Agent must reconcile its report" }, "report-retry");
      next.acceptScopedLeaderAction({ ...manager, envelope: coordination, residentStopConfirmed: true });
      next.releaseScopedLeaderTurn({ ...manager, residentStopConfirmed: true });
      next.resumeScopedMergedDelivery("p", f.execution.id, 1, coordination);
      const repair = { ...f.input, invocationId: "inv_" + "7".repeat(32), runtimePath: join(f.root, "runtime", "inv_" + "7".repeat(32)) };
      next.beginScopedAgentReportRepair({ ...repair, originalReportInvocationId: original.invocationId,
        missing: ["git_push"], coordination: { envelope: coordination } });
      next.markScopedAgentTurnOpened({ ...repair, nativeProcessOpened: true });
      const laterHead = "d".repeat(40);
      const store = next.operationsForProject("p", true);
      const push = await prepareOperation(store, { id: "supplement-push", kind: "git.push", ownerExecutionId: f.execution.id,
        ownershipEpoch: 1, expectedHead: laterHead, expectedBase: f.execution.executionBranch }, { head: laterHead });
      await finalizeOperation(store, push, { owner: repository.owner, repository: repository.name,
        ref: f.execution.executionBranch, status: "present", sha: laterHead, observedAt: NOW });
      next.stopScopedAgentTurn({ ...repair, residentStopConfirmed: true });
      next.recordScopedAgentReportRepairResult({ ...repair, originalReportInvocationId: original.invocationId,
        output: "Original Agent pushed B but only observed merged A", residentStopConfirmed: true });
      next.bindScopedAgentReportHead({ ...f.input, headSha: laterHead });
      const report = next.scopedAgentReport("p", f.execution.id, 1);
      const failureInput = { ...f.input, arrivalRequestId: f.execution.arrivalRequestId, residentStopConfirmed: true as const,
        reason: "Original Agent still lacks explicit Git delivery facts: github_get_pr or github_create_pr, github_merge_pr" };
      if (mode === "recorded_failure") next.failScopedAgentArrival(failureInput);
      const failureKey = `scoped-report-repair-failure:${f.execution.id}:1:${repair.invocationId}`;
      const recorded = next.eventByRequestId("p", failureKey);
      next.close();
      const restarted = CollaborationStateDatabase.open({ ...f.options, instanceId: "third-writer", now: () => 3_000_000 });
      databases.push(restarted);
      if (mode === "crash_gap") {
        expect(restarted.scopedExecution("p", f.execution.id)?.status).toBe("integrating");
        expect(() => restarted.failScopedAgentArrival(failureInput)).toThrow(/native stop proof/);
      }
      expect(() => restarted.reconcileScopedAgentTurn(proof(original.invocationId, originalRuntime))).toThrow(/exact native owner/);
      restarted.reconcileScopedAgentTurn(proof(repair.invocationId, repair.runtimePath));
      const invoke = vi.fn(async () => { throw new Error("A consumed retry cannot reopen its Agent"); });
      if (mode === "crash_gap") {
        f.git.observeExecutionWorktree = vi.fn(async (owner, epoch) => ({ projectId: "p", executionId: owner.id,
          ownershipEpoch: epoch, branch: owner.executionBranch, worktreePath: owner.worktreePath,
          head: laterHead, retained: true, pendingPaths: [], observedAt: NOW }));
        const runner = new ScopedAgentExecutionRunner(restarted, f.git, { invoke }, () => f.root,
          { automaticCheckpoint: false, requireAgentGitDeliveryFacts: true });
        await expect(runner.prepareDelivery(f.input)).rejects.toThrow(/still lacks explicit Git delivery facts/);
      }
      expect(restarted.eventByRequestId("p", failureKey)?.payload.reason).toBe(failureInput.reason);
      if (mode === "recorded_failure") expect(restarted.eventByRequestId("p", failureKey)).toEqual(recorded);
      expect(restarted.failScopedAgentArrival(failureInput).replay).toBe(true);
      expect(() => restarted.failScopedAgentArrival({ ...failureInput, reason: "Changed reason" })).toThrow(/changed on replay/);
      expect(restarted.eventByRequestId("p", `scoped-failure:${f.execution.id}:1`)).toEqual(originalFailure);
      expect(restarted.scopedAgentReport("p", f.execution.id, 1)).toEqual(report);
      expect(restarted.scopedAgentTaskCompletion("p", f.execution.id, 1)).toEqual(completion);
      expect(restarted.scopedRecoveryPull("p", f.execution.id, 1)).toEqual(pull);
      expect(restarted.recordedGitOperation("p", push.id)?.status).toBe("finalized");
      expect(restarted.scopedExecution("p", f.execution.id)).toMatchObject({ status: "failed", ownershipEpoch: 1,
        executionBranch: f.execution.executionBranch, worktreePath: f.execution.worktreePath });
      expect(restarted.scopedRecoveryCandidates("p", "run-G")[0]).toMatchObject({ executionId: f.execution.id,
        failedArrivalRequestId: f.execution.arrivalRequestId, ownershipEpoch: 1 });
      expect(restarted.scopedRecoveryCandidates("p", "run-G")[0]?.pendingOperation).toBeUndefined();
      expect(restarted.scopedAgentReportContinuation("p", f.execution.id, 1)).toBeUndefined();
      expect(restarted.resumeScopedMergedDelivery("p", f.execution.id, 1, coordination)).toBe(false);
      expect(restarted.scopedAgentMechanismRepairCount("p", f.execution.id)).toBe(2);
      expect(invoke).not.toHaveBeenCalled();
      expect(f.git.sessionBegin).not.toHaveBeenCalled();
      expect(f.git.checkpointAndPush).not.toHaveBeenCalled();
    });

  it.each(["deferred", "explicit", "unconfirmed", "foreign_repository"] as const)(
    "retains an older merged PR alongside a later report head only with deferred confirmed push evidence (%s)", async mode => {
      const f = await fixture(false, { complete: false });
      const identity = { ...f.input, invocationId: "inv_" + "5".repeat(32) };
      f.database.beginScopedAgentTurn({ ...identity, runtimePath: join(f.root, "runtime", identity.invocationId), baseCommit: BASE });
      f.database.markScopedAgentTurnOpened({ ...identity, nativeProcessOpened: true });
      const store = f.database.operationsForProject("p", true);
      const push = await prepareOperation(store, { id: "observed-supplement-push", kind: "git.push",
        ownerExecutionId: f.execution.id, ownershipEpoch: 1, expectedHead: HEAD, expectedBase: f.execution.executionBranch }, { head: HEAD });
      await finalizeOperation(store, push, { owner: repository.owner,
        repository: mode === "foreign_repository" ? "foreign" : repository.name,
        ref: f.execution.executionBranch, sha: HEAD, status: mode === "unconfirmed" ? "missing" : "present", observedAt: NOW });
      f.database.recordScopedAgentReport({ ...identity, output: "Immutable reported business facts",
        ...(mode === "explicit" ? { reportHeadSha: HEAD } : {}), residentTurnCompleted: true, residentStopConfirmed: true });
      if (mode !== "explicit") f.database.bindScopedAgentReportHead({ ...identity, headSha: HEAD });
      const report = f.database.scopedAgentReport("p", f.execution.id, 1);
      f.database.failScopedAgentArrival({ ...identity, arrivalRequestId: f.execution.arrivalRequestId,
        reason: "The later pushed record still needs its own PR", residentStopConfirmed: true });
      const pull: GitHubPullRequestFact = { id: "original-merged-pr", providerNumber: 7, owner: repository.owner,
        repository: repository.name, ownerExecutionId: f.execution.id, head: f.execution.executionBranch,
        headSha: "c".repeat(40), base: "groups/run-G", status: "merged", mergeCommitSha: "d".repeat(40),
        htmlUrl: `${repository.htmlUrl}/pull/7`, observedAt: NOW };
      const projection = f.database.projectState("p");
      if (mode !== "deferred") {
        expect(() => f.database.recordScopedRecoveryPull({ ...identity, pull })).toThrow(/exact stopped failed owner/);
        expect(f.database.projectState("p")).toEqual(projection);
        return;
      }
      f.database.recordScopedRecoveryPull({ ...identity, pull });
      expect(() => f.database.resumeScopedMergedDelivery("p", f.execution.id, 1)).toThrow(/same stopped epoch/);
      const managerInput = { projectId: "p", groupRunId: "run-G", agentId: "main", invocationId: "inv_" + "6".repeat(32),
        runtimePath: join(f.root, "runtime", "inv_" + "6".repeat(32)) };
      const manager = { ...managerInput, coordinatorEpoch: f.database.claimScopedLeaderTurn(managerInput)!.coordinatorEpoch };
      f.database.markScopedLeaderOpened(manager);
      const envelope = (action: import("../../src/core/types.js").ControlAction, callId: string) => ({ projectId: "p", agent: "main",
        invocationId: manager.invocationId, callId, stateVersion: manager.coordinatorEpoch, capabilityHash: "a".repeat(64), receivedAt: NOW, action });
      f.database.recordScopedLeaderTaskCompletion({ ...manager, envelope: envelope({ tool: "finish_task" }, "manager-finish") });
      const retry = envelope({ tool: "coordinate_group_task", groupRunId: "run-G", coordinatorEpoch: manager.coordinatorEpoch,
        arrivalRequestId: f.execution.arrivalRequestId, operation: "retry", rationale: "Original Agent must deliver the retained supplement" }, "retained-retry");
      f.database.acceptScopedLeaderAction({ ...manager, envelope: retry, residentStopConfirmed: true });
      expect(() => f.database.resumeScopedMergedDelivery("p", f.execution.id, 1, retry)).toThrow(/exact released manager retry/);
      f.database.releaseScopedLeaderTurn({ ...manager, residentStopConfirmed: true });
      expect(() => f.database.resumeScopedMergedDelivery("p", f.execution.id, 1, { ...retry, callId: "forged-retry" }))
        .toThrow(/exact released manager retry/);
      expect(f.database.resumeScopedMergedDelivery("p", f.execution.id, 1, retry)).toBe(true);
      expect(f.database.scopedAgentReport("p", f.execution.id, 1)).toEqual(report);
      expect(f.database.scopedRecoveryPull("p", f.execution.id, 1)).toEqual(pull);
      expect(f.database.scopedExecution("p", f.execution.id)).toMatchObject({ status: "integrating", ownershipEpoch: 1 });
    });

  it.each(["agent", "invocation", "runtime", "opened", "cancelled"] as const)(
    "revalidates missing-report native launch without another reservation (%s)", async mode => {
      const f = await missingReportFixture();
      f.database.beginScopedAgentMissingReportRepair(f.repair);
      const proof = { ...f.repair, agentId: "one" };
      expect(f.database.assertScopedAgentMissingReportRepairLaunch(proof)).toEqual({ previousRuntimePath: f.originalRuntime });
      if (mode === "agent") proof.agentId = "two";
      if (mode === "invocation") proof.invocationId = f.identity.invocationId;
      if (mode === "runtime") proof.runtimePath = f.originalRuntime;
      if (mode === "opened") f.database.markScopedAgentTurnOpened({ ...f.repair, nativeProcessOpened: true });
      if (mode === "cancelled") f.database.appendEvent({ projectId: "p", requestId: "cancel-reserved-repair",
        type: "project.cancellation.requested", payload: { actor: "user", resumable: true } });
      expect(() => f.database.assertScopedAgentMissingReportRepairLaunch(proof)).toThrow();
      expect(f.database.eventsAfter("p", 0).filter(event => event.type === "scoped.agent.missing_report_repair.requested")).toHaveLength(1);
    });

  it("requires exact supervisor reconciliation before reserving the original missing report under a new writer", async () => {
    const f = await missingReportFixture(); f.database.close();
    const next = CollaborationStateDatabase.open({ ...f.options, instanceId: "next-writer", now: () => 2_000_000 }); databases.push(next);
    expect(() => next.beginScopedAgentMissingReportRepair(f.repair)).toThrow(/exact stopped/);
    next.reconcileScopedAgentTurn({ ...f.identity, residentStopConfirmed: true, evidence: { protocol: "scoped-supervisor-stop-v1",
      projectId: "p", scopeId: f.execution.id, agentId: "one", role: "delivery", ownershipEpoch: 2,
      runtimePath: f.originalRuntime, nativeProcessScanCleared: true } });
    expect(next.beginScopedAgentMissingReportRepair(f.repair)).toMatchObject({ attempt: 1 });
    expect(next.assertScopedAgentMissingReportRepairLaunch({ ...f.repair, agentId: "one" })).toEqual({ previousRuntimePath: f.originalRuntime });
    expect(next.scopedAgentReport("p", f.execution.id, 1)).toEqual(f.oldReport);
    expect(next.scopedAgentTaskCompletion("p", f.execution.id, 2)).toEqual(f.completion);
  });

  it.each(["valid", "agent", "invocation", "report", "runtime", "opened", "stopped", "cancelled", "writer"] as const)(
    "supplement launch proof checks the exact durable reservation (%s)", async (mode) => {
      const f = await fixture(false, { complete: false });
      const original = "inv_" + "9".repeat(32);
      const originalRuntime = join(f.root, "runtime", original);
      f.database.beginScopedAgentTurn({ ...f.input, invocationId: original, runtimePath: originalRuntime, baseCommit: BASE });
      f.database.markScopedAgentTurnOpened({ ...f.input, invocationId: original, nativeProcessOpened: true });
      f.database.recordScopedAgentReport({ ...f.input, invocationId: original, output: "Retained Agent work",
        residentTurnCompleted: true, residentStopConfirmed: true });
      const invocationId = "inv_" + "8".repeat(32);
      const proof = { ...f.input, invocationId, agentId: "one", originalReportInvocationId: original,
        runtimePath: join(f.root, "runtime", invocationId) };
      f.database.beginScopedAgentReportRepair({ ...proof, missing: ["finish_task"] });
      const before = f.database.projectState("p");
      const budget = f.database.scopedAgentMechanismRepairCount("p", f.execution.id);
      expect(f.database.assertScopedAgentReportRepairLaunch(proof)).toEqual({ previousRuntimePath: originalRuntime });
      expect(f.database.assertScopedAgentReportRepairLaunch(proof)).toEqual({ previousRuntimePath: originalRuntime });
      expect(f.database.projectState("p")).toEqual(before);
      expect(f.database.scopedAgentMechanismRepairCount("p", f.execution.id)).toBe(budget);
      if (mode === "valid") return;
      if (mode === "agent") proof.agentId = "two";
      if (mode === "invocation") proof.invocationId = original;
      if (mode === "report") proof.originalReportInvocationId = invocationId;
      if (mode === "runtime") proof.runtimePath = originalRuntime;
      if (mode === "opened") f.database.markScopedAgentTurnOpened({ ...proof, nativeProcessOpened: true });
      if (mode === "stopped") f.database.stopScopedAgentTurn({ ...proof, residentStopConfirmed: true });
      if (mode === "cancelled") f.database.appendEvent({ projectId: "p", requestId: "cancel-before-supplement",
        type: "project.cancellation.requested", payload: { actor: "user", resumable: true } });
      if (mode === "writer") databases.push(CollaborationStateDatabase.open({ ...f.options, instanceId: "new-writer", now: () => 2_000_000 }));
      expect(() => f.database.assertScopedAgentReportRepairLaunch(proof)).toThrow();
    });

  it("restores a retained execution base from an opened prior turn before delivery continues", async () => {
    const f = await fixture();
    const original = { ...f.input, invocationId: "inv_" + "6".repeat(32) };
    f.database.beginScopedAgentTurn({ ...original, runtimePath: join(f.root, "runtime", original.invocationId), baseCommit: BASE });
    f.database.markScopedAgentTurnOpened({ ...original, nativeProcessOpened: true });
    f.database.stopScopedAgentTurn({ ...original, residentStopConfirmed: true });
    f.database.failScopedAgentArrival({ ...original, arrivalRequestId: f.execution.arrivalRequestId,
      reason: "Retained delivery requires recovery", residentStopConfirmed: true });
    const retried = f.database.retryScopedAgentArrival({ projectId: "p", executionId: f.execution.id,
      arrivalRequestId: f.execution.arrivalRequestId, failedOwnershipEpoch: 1 })!.execution;
    const restore = vi.fn(async (_authority, _epoch, candidates) => {
      expect(candidates).toEqual([BASE]);
      return BASE;
    });
    (f.git as ScopedAgentExecutionGit & { restoreRetainedExecutionBase: typeof restore }).restoreRetainedExecutionBase = restore;

    await expect(f.runner.prepareDelivery({ ...f.input, ownershipEpoch: retried.ownershipEpoch }))
      .resolves.toMatchObject({ executionId: f.execution.id, ownershipEpoch: 2, expectedHeadSha: HEAD });
    expect(restore).toHaveBeenCalledOnce();
    expect(f.git.observeRetainedExecution).toHaveBeenCalledOnce();
  });

  it.each(["stopped", "active", "invalid_base", "foreign_checkout"] as const)(
    "prepares a report supplement from its trusted stopped turn before the original Agent runs (%s)", async mode => {
      const f = await fixture(false, { complete: false });
      const identity = { ...f.input, invocationId: "inv_" + "8".repeat(32) };
      f.database.beginScopedAgentTurn({ ...identity, runtimePath: join(f.root, "runtime", identity.invocationId), baseCommit: BASE });
      f.database.markScopedAgentTurnOpened({ ...identity, nativeProcessOpened: true });
      f.database.recordScopedAgentReport({ ...identity, output: "Original immutable business report",
        residentTurnCompleted: true, residentStopConfirmed: true });
      const report = f.database.scopedAgentReport("p", f.execution.id, 1)!;
      const restore = vi.fn(async () => {
        if (mode === "invalid_base") throw new Error("Retained execution has no authoritative activation base");
        return BASE;
      });
      f.git.restoreRetainedExecutionBase = restore;
      if (mode === "active") f.database.beginScopedAgentReportRepair({ ...f.input,
        invocationId: "inv_" + "9".repeat(32), runtimePath: join(f.root, "runtime", "inv_" + "9".repeat(32)),
        originalReportInvocationId: identity.invocationId, missing: ["finish_task", "git_push"] });
      if (mode === "foreign_checkout") {
        const observe = f.git.observeRetainedExecution;
        f.git.observeRetainedExecution = vi.fn(async (...args) => ({ ...await observe(...args), executionId: "foreign" }));
      }
      const invoke = vi.fn(async (input: ScopedAgentTurnInput) => {
        expect(restore).toHaveBeenCalledWith(expect.objectContaining({ id: f.execution.id,
          executionBranch: f.execution.executionBranch }), 1, [BASE], undefined);
        expect(f.database.scopedAgentReport("p", f.execution.id, 1)).toEqual(report);
        input.onOpened();
        f.database.recordScopedAgentTaskCompletion({ ...f.input, invocationId: input.invocationId,
          agentId: "one", callId: "repair-finish", requestedAt: NOW });
        return { output: "Only missing delivery supplied", reportHeadSha: HEAD, residentStopConfirmed: true as const };
      });
      const runner = new ScopedAgentExecutionRunner(f.database, f.git, { invoke }, () => f.root, { automaticCheckpoint: false });
      if (mode === "stopped") {
        await expect(runner.prepareDelivery(f.input)).resolves.toMatchObject({ expectedHeadSha: HEAD, output: report.output });
        expect(invoke).toHaveBeenCalledOnce();
      } else {
        await expect(runner.prepareDelivery(f.input)).rejects.toThrow();
        expect(invoke).not.toHaveBeenCalled();
        expect(f.database.scopedAgentReport("p", f.execution.id, 1)).toEqual(report);
        if (mode !== "invalid_base") expect(restore).not.toHaveBeenCalled();
      }
      expect(f.git.sessionBegin).not.toHaveBeenCalled();
      expect(f.git.checkpointAndPush).not.toHaveBeenCalled();
    });

  it.each(["agent-memory/one/Memory.md", "compute/probe.js", "observation_failure", "clean"])(
    "keeps a repaired report head unbound until its returned worktree is closed (%s)", async pendingPath => {
      const f = await fixture(false, { complete: false });
      const identity = { ...f.input, invocationId: "inv_" + "8".repeat(32) };
      f.database.beginScopedAgentTurn({ ...identity, runtimePath: join(f.root, "runtime", identity.invocationId), baseCommit: BASE });
      f.database.markScopedAgentTurnOpened({ ...identity, nativeProcessOpened: true });
      f.database.recordScopedAgentTaskCompletion({ ...identity, agentId: "one", callId: "original-finish", requestedAt: NOW,
        memory: "Original accepted memory" });
      f.database.recordScopedAgentReport({ ...identity, output: "Original immutable business report",
        residentTurnCompleted: true, residentStopConfirmed: true });
      const report = f.database.scopedAgentReport("p", f.execution.id, 1)!;
      const completion = f.database.scopedAgentTaskCompletion("p", f.execution.id, 1);
      let returned = false;
      f.git.observeExecutionWorktree = vi.fn(async (execution, epoch) => {
        if (returned && pendingPath === "observation_failure") throw new Error("Worktree observation unavailable");
        return { projectId: "p", executionId: execution.id, ownershipEpoch: epoch,
          branch: execution.executionBranch, worktreePath: execution.worktreePath,
          head: HEAD, retained: true, observedAt: NOW, pendingPaths: returned && pendingPath !== "clean" ? [pendingPath] : [] };
      });
      const invoke = vi.fn(async (input: ScopedAgentTurnInput) => {
        input.onOpened();
        f.database.assertScopedGitExecutionOwnership({ ...f.input, expectedBranch: f.execution.executionBranch,
          operation: "checkpoint" });
        const store = f.database.operationsForProject("p", true);
        const pull: GitHubPullRequestFact = { id: "actual-supplement-pr", providerNumber: 7,
          owner: repository.owner, repository: repository.name, ownerExecutionId: f.execution.id,
          head: f.execution.executionBranch, headSha: HEAD, base: "groups/run-G", status: "merged",
          mergeCommitSha: "c".repeat(40), htmlUrl: `${repository.htmlUrl}/pull/7`, observedAt: NOW };
        for (const kind of ["git.push", "pull.create", "pull.merge"] as const) {
          const operation = await prepareOperation(store, { id: `actual-supplement-${kind}`, kind,
            ownerExecutionId: f.execution.id, ownershipEpoch: 1, expectedHead: HEAD,
            expectedBase: kind === "git.push" ? f.execution.executionBranch : pull.base }, { head: HEAD });
          await finalizeOperation(store, operation, kind === "git.push"
            ? { owner: repository.owner, repository: repository.name, ref: f.execution.executionBranch,
              status: "present", sha: HEAD, observedAt: NOW }
            : { ...pull, ...(kind === "pull.create" ? { status: "open", mergeCommitSha: undefined } : {}) });
        }
        const synchronization: RemoteMergeSyncFact = { projectId: "p",
          operationId: mergedPullSynchronizationOperationId(f.execution.id, 1, HEAD, pull.base, pull.mergeCommitSha!),
          targetBranch: pull.base, temporaryRef: "refs/openfars/reconcile/actual-supplement-pr",
          expectedSourceHead: HEAD, mergeCommitSha: pull.mergeCommitSha!, remoteHead: pull.mergeCommitSha!,
          localHeadBefore: BASE, localHeadAfter: pull.mergeCommitSha!, status: "synchronized", observedAt: NOW };
        await store.recordMergedSynchronization({ ...f.input, providerNumber: pull.providerNumber,
          expectedHead: HEAD, expectedBase: pull.base, expectedMergeCommitSha: pull.mergeCommitSha!, synchronization });
        returned = true;
        return { output: "Actual supplemental result with unfinished checkout closing", reportHeadSha: HEAD,
          residentStopConfirmed: true as const };
      });
      const runner = new ScopedAgentExecutionRunner(f.database, f.git, { invoke }, () => f.root,
        { automaticCheckpoint: false, requireAgentGitDeliveryFacts: true });
      if (pendingPath === "clean") {
        await expect(runner.prepareDelivery(f.input)).resolves.toMatchObject({ expectedHeadSha: HEAD, output: report.output });
        expect(f.database.scopedAgentReport("p", f.execution.id, 1)).toMatchObject({ ...report, headSha: HEAD });
        expect(() => f.database.assertScopedGitExecutionOwnership({ ...f.input,
          expectedBranch: f.execution.executionBranch, operation: "checkpoint" })).toThrow();
      } else {
        await expect(runner.prepareDelivery(f.input)).rejects.toThrow(pendingPath === "observation_failure"
          ? "Worktree observation unavailable" : `pending worktree path(s): ["${pendingPath}"]`);
        expect(f.database.scopedAgentReport("p", f.execution.id, 1)).toEqual(report);
      }
      expect(f.database.scopedAgentTaskCompletion("p", f.execution.id, 1)).toEqual(completion);
      expect(f.database.scopedAgentTurn("p", f.execution.id, 1)?.status).toBe("stopped");
      expect(f.database.scopedAgentMechanismRepairCount("p", f.execution.id)).toBe(1);
      expect(f.database.eventsAfter("p", 0).filter(event => event.type === "scoped.agent.mechanism_repair.returned"))
        .toMatchObject([{ payload: { output: "Actual supplemental result with unfinished checkout closing" } }]);
      expect(invoke).toHaveBeenCalledOnce();
      expect(f.git.checkpointAndPush).not.toHaveBeenCalled();
    });

  it("reclaims an already merged report only after its exact cross-writer native stop proof and released management scope", async () => {
    const f = await fixture();
    await f.runner.prepareDelivery(f.input);
    const native = f.database.scopedAgentTurn("p", f.execution.id, 1)!;
    const pull = { id: "merged-original-pr", providerNumber: 7, owner: "example", repository: "openfars",
      ownerExecutionId: f.execution.id, head: f.execution.executionBranch, headSha: HEAD,
      base: "groups/run-G", status: "merged" as const, mergeCommitSha: "c".repeat(40),
      htmlUrl: `${repository.htmlUrl}/pull/7`, observedAt: NOW, checks: [] };
    const store = f.database.operationsForProject("p", true);
    const operation = await prepareOperation(store, { id: "original-agent-merged", kind: "pull.merge",
      ownerExecutionId: f.execution.id, ownershipEpoch: 1, expectedHead: HEAD, expectedBase: pull.base }, { head: HEAD, base: pull.base });
    await finalizeOperation(store, operation, pull);
    f.database.failScopedAgentArrival({ ...f.input, arrivalRequestId: f.execution.arrivalRequestId,
      reason: "Original merge needs Agent local sync", residentStopConfirmed: true });
    f.database.recordScopedRecoveryPull({ ...f.input, pull });
    f.database.close();
    const restarted = CollaborationStateDatabase.open({ ...f.options, instanceId: "instance-b", now: () => 2_000_000 });
    databases.push(restarted);
    const revision = restarted.projectState("p").stateRevision;
    expect(() => restarted.resumeScopedMergedDelivery("p", f.execution.id, 1)).toThrow(/same stopped epoch/);
    expect(restarted.projectState("p").stateRevision).toBe(revision);
    restarted.reconcileScopedAgentTurn({ ...f.input, invocationId: native.invocationId, residentStopConfirmed: true,
      evidence: { protocol: "scoped-supervisor-stop-v1", projectId: "p", scopeId: f.execution.id, agentId: "one",
        role: "delivery", ownershipEpoch: 1, runtimePath: native.runtimePath, nativeProcessScanCleared: true } });
    const manager = { projectId: "p", groupRunId: "run-G", agentId: "main", invocationId: "merge-recovery-manager",
      runtimePath: join(f.root, "runtime", "merge-recovery-manager") };
    expect(restarted.claimScopedLeaderTurn(manager)).toBeDefined();
    expect(restarted.resumeScopedMergedDelivery("p", f.execution.id, 1)).toBe(false);
    expect(restarted.scopedExecution("p", f.execution.id)?.status).toBe("failed");
    restarted.releaseScopedLeaderTurn({ ...manager, residentStopConfirmed: true });
    expect(restarted.resumeScopedMergedDelivery("p", f.execution.id, 1)).toBe(true);
    expect(restarted.scopedExecution("p", f.execution.id)).toMatchObject({ status: "integrating", ownershipEpoch: 1,
      worktreePath: f.execution.worktreePath, executionBranch: f.execution.executionBranch });
    expect(restarted.scopedAgentTurn("p", f.execution.id, 1)).toMatchObject({ invocationId: native.invocationId, status: "stopped" });
    expect(restarted.scopedAgentDeliveryMissingActions("p", f.execution.id, 1, HEAD)).toEqual(["github_merge_pr"]);
    expect(f.invoker.invoke).toHaveBeenCalledOnce();
    expect(() => restarted.resumeScopedMergedDelivery("p", f.execution.id, 2)).toThrow(/same stopped epoch/);
  });

  it("repairs an old stopped report in its original execution and epoch, retaining its unsettled operation across a writer restart", async () => {
    const f = await fixture(true, { complete: false });
    const invocationId = "inv_" + "7".repeat(32);
    const originalRuntime = join(f.root, "runtime", invocationId);
    const identity = { ...f.input, invocationId };
    f.database.beginScopedAgentTurn({ ...identity, runtimePath: originalRuntime, baseCommit: BASE });
    f.database.markScopedAgentTurnOpened({ ...identity, nativeProcessOpened: true });
    const pending = await prepareOperation(f.database.operationsForProject("p", true), {
      id: "original-unsettled-push", kind: "git.push", ownerExecutionId: f.execution.id,
      ownershipEpoch: 1, expectedHead: HEAD, expectedBase: f.execution.executionBranch
    }, { head: HEAD });
    f.database.recordScopedAgentReport({ ...identity, output: "Original business report preserved after crash",
      selectedWeakTarget: "finish", residentTurnCompleted: true, residentStopConfirmed: true });
    const originalReport = f.database.scopedAgentReport("p", f.execution.id, 1)!;
    f.database.close();
    const next = CollaborationStateDatabase.open({ ...f.options, instanceId: "instance-b", now: () => 2_000_000 });
    databases.push(next);
    const invoke = vi.fn(async (input: ScopedAgentTurnInput) => {
      expect(input.execution).toMatchObject({ id: f.execution.id, agentId: "one", ownershipEpoch: 1,
        worktreePath: f.execution.worktreePath, executionBranch: f.execution.executionBranch });
      expect(input.reportRepair).toMatchObject({ report: originalReport, attempt: 1 });
      expect(input.invocationId).not.toBe(invocationId);
      expect(input.runtimePath).not.toBe(originalRuntime);
      expect(next.scopedExecutionHasUnsettledGitOperation("p", f.execution.id, 1)).toBe(true);
      expect(next.scopedAgentReport("p", f.execution.id, 1)).toEqual(originalReport);
      input.onOpened();
      // The simulated original Agent explicitly observes and finalizes its
      // own operation, then supplies its finish receipt. Runner never does it.
      await finalizeOperation(next.operationsForProject("p", true), pending, {
        owner: "example", repository: "openfars", ref: f.execution.executionBranch,
        status: "present", sha: HEAD, observedAt: NOW
      });
      next.recordScopedAgentTaskCompletion({ ...f.input, invocationId: input.invocationId,
        agentId: "one", callId: "original-agent-supplement-finish", summary: "Verified my retained push and finished", requestedAt: NOW });
      return { output: "Original Agent's actual supplemental handoff", selectedWeakTarget: "finish", reportHeadSha: HEAD,
        residentStopConfirmed: true as const };
    });
    const runner = new ScopedAgentExecutionRunner(next, f.git, { invoke }, () => f.root, { automaticCheckpoint: false });
    await expect(runner.prepareDelivery(f.input)).rejects.toThrow(/owns Git/);
    expect(invoke).not.toHaveBeenCalled();
    next.reconcileScopedAgentTurn({ ...identity, residentStopConfirmed: true, evidence: {
      protocol: "scoped-supervisor-stop-v1", projectId: "p", scopeId: f.execution.id, agentId: "one", role: "delivery",
      ownershipEpoch: 1, runtimePath: originalRuntime, nativeProcessScanCleared: true
    } });
    expect(await runner.prepareDelivery(f.input)).toMatchObject({ executionId: f.execution.id, ownershipEpoch: 1,
      expectedHeadSha: HEAD, selectedWeakTarget: "finish", output: originalReport.output });
    expect(invoke).toHaveBeenCalledOnce();
    expect(next.scopedAgentReport("p", f.execution.id, 1)).toMatchObject({ ...originalReport, headSha: HEAD });
    expect(next.scopedAgentTaskCompleted("p", f.execution.id, 1, originalReport.invocationId)).toBe(true);
    expect(next.scopedAgentTaskCompleted("p", f.execution.id, 1, "unrelated-report")).toBe(false);
    expect(next.scopedExecution("p", f.execution.id)).toMatchObject({ status: "integrating", ownershipEpoch: 1 });
    expect(next.scopedAgentTurn("p", f.execution.id, 1)).toMatchObject({ status: "stopped" });
    expect(next.scopedExecutionHasUnsettledGitOperation("p", f.execution.id, 1)).toBe(false);
    const reservation = next.eventsAfter("p", 0).find((event) => event.type === "scoped.agent.mechanism_repair.requested")!;
    expect(reservation.payload).toMatchObject({ originalReportInvocationId: invocationId, nativeReopened: true,
      previousTurn: { invocationId, runtimePath: originalRuntime, status: "stopped" } });
    expect(next.eventsAfter("p", 0).filter((event) => event.type === "scoped.agent.mechanism_repair.returned"))
      .toHaveLength(1);
    expect(f.git.sessionBegin).not.toHaveBeenCalled();
    expect(f.git.observeRetainedExecution).toHaveBeenCalledOnce();
    expect(f.git.checkpointAndPush).not.toHaveBeenCalled();
    expect(await runner.prepareDelivery(f.input)).toMatchObject({ output: originalReport.output });
    expect(invoke).toHaveBeenCalledOnce();
  });

  it.each([
    { phase: "before_open", coordinated: false }, { phase: "after_open", coordinated: false },
    { phase: "before_open", coordinated: true }, { phase: "after_open", coordinated: true }
  ] as const)("continues the original stopped report through two writer restarts after $phase failure (coordinated=$coordinated)", async ({ phase, coordinated }) => {
    const f = await fixture(true, { complete: false });
    const originalInvocation = `inv_${"4".repeat(32)}`;
    const original = { ...f.input, invocationId: originalInvocation };
    const originalRuntime = join(f.root, "runtime", originalInvocation);
    f.database.beginScopedAgentTurn({ ...original, runtimePath: originalRuntime, baseCommit: BASE });
    f.database.markScopedAgentTurnOpened({ ...original, nativeProcessOpened: true });
    const pending = await prepareOperation(f.database.operationsForProject("p", true), { id: "two-restart-original-push",
      kind: "git.push", ownerExecutionId: f.execution.id, ownershipEpoch: 1,
      expectedHead: HEAD, expectedBase: f.execution.executionBranch }, { head: HEAD });
    f.database.recordScopedAgentReport({ ...original, output: "Original business and weak route stay immutable",
      selectedWeakTarget: "finish", residentTurnCompleted: true, residentStopConfirmed: true });
    const originalReport = f.database.scopedAgentReport("p", f.execution.id, 1)!;
    const proof = (invocationId: string, runtimePath: string) => ({ ...f.input, invocationId,
      residentStopConfirmed: true as const, evidence: { protocol: "scoped-supervisor-stop-v1", projectId: "p",
        scopeId: f.execution.id, agentId: "one", role: "delivery", ownershipEpoch: 1,
        runtimePath, nativeProcessScanCleared: true } });
    f.database.close();
    const second = CollaborationStateDatabase.open({ ...f.options, instanceId: "instance-b", now: () => 2_000_000 });
    databases.push(second); second.reconcileScopedAgentTurn(proof(originalInvocation, originalRuntime));
    const failed = vi.fn(async (input: ScopedAgentTurnInput) => {
      if (phase === "after_open") input.onOpened();
      throw new ScopedAgentTurnFailure("First supplement requires its own physical reconciliation", false);
    });
    await expect(new ScopedAgentExecutionRunner(second, f.git, { invoke: failed }, () => f.root,
      { automaticCheckpoint: false }).prepareDelivery(f.input)).rejects.toMatchObject({ residentStopConfirmed: false });
    const firstRepair = second.scopedAgentTurn("p", f.execution.id, 1)!;
    expect(firstRepair.status).toBe(phase === "after_open" ? "opened" : "reserved");
    expect(second.scopedAgentMechanismRepairCount("p", f.execution.id)).toBe(1);
    second.close();
    let third = CollaborationStateDatabase.open({ ...f.options, instanceId: "instance-c", now: () => 3_000_000 });
    databases.push(third);
    let lastClearedRuntime = firstRepair.runtimePath;
    if (coordinated) {
      const failedAgain = new ScopedAgentExecutionRunner(third, f.git, { invoke: failed }, () => f.root, { automaticCheckpoint: false });
      await expect(failedAgain.prepareDelivery(f.input)).rejects.toThrow(/owns Git/);
      expect(failed).toHaveBeenCalledOnce();
      third.reconcileScopedAgentTurn(proof(firstRepair.invocationId, firstRepair.runtimePath));
      await expect(failedAgain.prepareDelivery(f.input)).rejects.toMatchObject({ residentStopConfirmed: false });
      const secondRepair = third.scopedAgentTurn("p", f.execution.id, 1)!;
      lastClearedRuntime = secondRepair.runtimePath;
      expect(secondRepair.status).toBe(phase === "after_open" ? "opened" : "reserved");
      expect(third.scopedAgentMechanismRepairCount("p", f.execution.id)).toBe(2);
      third.close();
      third = CollaborationStateDatabase.open({ ...f.options, instanceId: "instance-d", now: () => 4_000_000 });
      databases.push(third);
      const exhausted = new ScopedAgentExecutionRunner(third, f.git, { invoke: failed }, () => f.root, { automaticCheckpoint: false });
      await expect(exhausted.prepareDelivery(f.input)).rejects.toThrow(/owns Git/);
      third.reconcileScopedAgentTurn(proof(secondRepair.invocationId, secondRepair.runtimePath));
      await expect(exhausted.prepareDelivery(f.input)).rejects.toThrow(/finish_task/);
      expect(failed).toHaveBeenCalledTimes(2);
      const incident = third.scopedGroupIssues("p").find((issue) => issue.executionId === f.execution.id)!;
      expect(incident).toMatchObject({ kind: "mechanism", ownershipEpoch: 1 });
      const manager = { projectId: "p", groupRunId: "run-G", agentId: "main", invocationId: "lineage-manager",
        runtimePath: join(f.root, "runtime", "lineage-manager"), allowStoppedRepairFaults: true };
      const claim = third.claimScopedLeaderTurn(manager)!;
      expect(claim).toBeDefined();
      const identity = { ...manager, coordinatorEpoch: claim.coordinatorEpoch };
      third.markScopedLeaderOpened(identity);
      const envelope = (action: import("../../src/core/types.js").ControlAction, callId: string) => ({ projectId: "p", agent: "main",
        invocationId: manager.invocationId, callId, stateVersion: claim.coordinatorEpoch,
        capabilityHash: "a".repeat(64), receivedAt: NOW, action });
      third.recordScopedLeaderTaskCompletion({ ...identity, envelope: envelope({ tool: "finish_task" }, "lineage-manager-finish") });
      third.acceptScopedLeaderAction({ ...identity, residentStopConfirmed: true, envelope: envelope({ tool: "coordinate_group_task",
        groupRunId: "run-G", coordinatorEpoch: claim.coordinatorEpoch, arrivalRequestId: f.execution.arrivalRequestId,
        operation: "retry", rationale: "Original Agent may settle the same stopped report" }, "lineage-manager-retry") });
      expect(third.scopedAgentReportContinuation("p", f.execution.id, 1)).toBeUndefined();
      third.releaseScopedLeaderTurn({ ...identity, residentStopConfirmed: true });
      expect(third.scopedAgentReportContinuation("p", f.execution.id, 1)?.incidentId).toBe(incident.id);
    }
    const pull: GitHubPullRequestFact = { id: "two-restart-original-pr", providerNumber: 7,
      owner: repository.owner, repository: repository.name, ownerExecutionId: f.execution.id,
      head: f.execution.executionBranch, headSha: HEAD, base: "groups/run-G", status: "merged",
      mergeCommitSha: "c".repeat(40), htmlUrl: `${repository.htmlUrl}/pull/7`, checks: [], observedAt: NOW };
    const synchronization: RemoteMergeSyncFact = { projectId: "p",
      operationId: mergedPullSynchronizationOperationId(f.execution.id, 1, HEAD, pull.base, pull.mergeCommitSha!),
      targetBranch: "groups/run-G", temporaryRef: "refs/openfars/reconcile/two-restart-original-pr",
      expectedSourceHead: HEAD, mergeCommitSha: pull.mergeCommitSha!, remoteHead: pull.mergeCommitSha!,
      localHeadBefore: BASE, localHeadAfter: pull.mergeCommitSha!, status: "synchronized", observedAt: NOW };
    const agent = vi.fn(async (input: ScopedAgentTurnInput) => {
      expect(input.reportRepair).toMatchObject({ attempt: coordinated ? 3 : 2, report: originalReport });
      if (coordinated) expect(input.reportRepair?.coordination?.envelope.action).toMatchObject({ operation: "retry",
        rationale: "Original Agent may settle the same stopped report" });
      expect(input.execution).toMatchObject({ id: f.execution.id, ownershipEpoch: 1,
        worktreePath: f.execution.worktreePath, executionBranch: f.execution.executionBranch });
      expect(input.invocationId).not.toBe(firstRepair.invocationId);
      expect(third.scopedAgentRecoveredForCurrentWriter("p", f.execution.id, 1, input.invocationId)).toBe(false);
      const completion = { ...f.input, invocationId: input.invocationId, agentId: "one",
        callId: "two-restart-agent-finish", requestedAt: NOW };
      expect(() => third.recordScopedAgentTaskCompletion(completion)).toThrow(/exact opened native turn/);
      expect(third.scopedAgentTaskCompleted("p", f.execution.id, 1)).toBe(false);
      const launchProof = { ...f.input, invocationId: input.invocationId, runtimePath: input.runtimePath,
        agentId: "one", originalReportInvocationId: originalReport.invocationId };
      expect(third.assertScopedAgentReportRepairLaunch(launchProof).previousRuntimePath)
        .toBe(lastClearedRuntime);
      input.onOpened();
      // The current Agent supplies the observed result for its old operation.
      // Neither the restart nor reserving a supplement performs this action.
      const store = third.operationsForProject("p", true);
      await finalizeOperation(store, pending,
        { owner: "example", repository: "openfars", ref: f.execution.executionBranch, status: "present", sha: HEAD, observedAt: NOW });
      for (const kind of ["pull.create", "pull.merge"] as const) {
        const operation = await prepareOperation(store, { id: `two-restart-agent-${kind}`, kind,
          ownerExecutionId: f.execution.id, ownershipEpoch: 1, expectedHead: HEAD, expectedBase: pull.base },
          { head: HEAD, base: pull.base });
        await finalizeOperation(store, operation, { ...pull, ...(kind === "pull.create" ? { status: "open", mergeCommitSha: undefined } : {}) });
      }
      await store.recordMergedSynchronization({ projectId: "p", executionId: f.execution.id, ownershipEpoch: 1,
        providerNumber: pull.providerNumber, expectedHead: HEAD, expectedBase: pull.base,
        expectedMergeCommitSha: pull.mergeCommitSha!, synchronization });
      third.recordScopedAgentTaskCompletion(completion);
      return { output: "Original Agent supplied missing formal facts", selectedWeakTarget: "finish",
        reportHeadSha: HEAD, residentStopConfirmed: true as const };
    });
    const runner = new ScopedAgentExecutionRunner(third, f.git, { invoke: agent }, () => f.root, { automaticCheckpoint: false });
    if (!coordinated) {
      await expect(runner.prepareDelivery(f.input)).rejects.toThrow(/owns Git/);
      expect(agent).not.toHaveBeenCalled();
      expect(() => third.reconcileScopedAgentTurn(proof(originalInvocation, originalRuntime))).toThrow(/exact native owner/);
      third.reconcileScopedAgentTurn(proof(firstRepair.invocationId, firstRepair.runtimePath));
    }
    expect(third.scopedAgentRecoveredForCurrentWriter("p", f.execution.id, 1, originalInvocation)).toBe(false);
    expect(await runner.prepareDelivery(f.input)).toMatchObject({ executionId: f.execution.id, ownershipEpoch: 1,
      output: originalReport.output, selectedWeakTarget: "finish", expectedHeadSha: HEAD });
    expect(agent).toHaveBeenCalledOnce();
    expect(third.scopedAgentMechanismRepairCount("p", f.execution.id)).toBe(2);
    expect(third.eventsAfter("p", 0).filter((event) => event.type === "scoped.agent.coordinated_repair.requested")).toHaveLength(coordinated ? 1 : 0);
    expect(third.scopedAgentReportContinuation("p", f.execution.id, 1)).toBeUndefined();
    expect(third.scopedAgentReport("p", f.execution.id, 1)).toMatchObject({ ...originalReport, headSha: HEAD });
    expect(third.scopedAgentTaskCompleted("p", f.execution.id, 1, originalInvocation)).toBe(true);
    expect(third.recordedGitOperation("p", pending.id)?.status).toBe("finalized");
    const deliveryGit: ScopedAgentDeliveryGit = { observeRemoteRef: vi.fn(async (_repository, ref) => ({
      owner: repository.owner, repository: repository.name, ref, status: "present", sha: HEAD, observedAt: NOW })),
      createPullRequest: vi.fn(), mergePullRequest: vi.fn(), reconcileMergedPullRequest: vi.fn() };
    const integrator = new ScopedAgentDeliveryIntegrator(third, deliveryGit, { agentOwnsGit: true });
    expect(third.laneAvailability("p").find((lane) => lane.lane === "worker")?.occupied).toBe(1);
    const delivered = await integrator.integrate({ ...f.input, expectedHeadSha: HEAD, selectedWeakTarget: "finish" });
    expect(delivered).toMatchObject({ status: "completed", completion: { execution: { status: "completed", ownershipEpoch: 1 } } });
    expect(third.projectState("p").scopedAgentMerges).toMatchObject([{ executionId: f.execution.id,
      pullRequest: pull, synchronization }]);
    expect(third.laneAvailability("p").find((lane) => lane.lane === "worker")?.occupied).toBe(0);
    expect(await integrator.integrate({ ...f.input, expectedHeadSha: HEAD, selectedWeakTarget: "finish" })).toMatchObject({
      status: "completed", completion: { replay: true } });
    expect(deliveryGit.createPullRequest).not.toHaveBeenCalled();
    expect(deliveryGit.mergePullRequest).not.toHaveBeenCalled();
    expect(deliveryGit.reconcileMergedPullRequest).not.toHaveBeenCalled();
    expect(f.git.sessionBegin).not.toHaveBeenCalled();
    expect(f.git.checkpointAndPush).not.toHaveBeenCalled();
  });

  it("retains the new repair authority when native stop is unknown; the old report cannot release it", async () => {
    const f = await fixture(false, { complete: false });
    const invocationId = "inv_" + "6".repeat(32);
    const identity = { ...f.input, invocationId };
    f.database.beginScopedAgentTurn({ ...identity, runtimePath: join(f.root, "runtime", invocationId), baseCommit: BASE });
    f.database.markScopedAgentTurnOpened({ ...identity, nativeProcessOpened: true });
    f.database.recordScopedAgentReport({ ...identity, output: "Preserved original report", residentTurnCompleted: true, residentStopConfirmed: true });
    const invoke = vi.fn(async (input: ScopedAgentTurnInput) => {
      input.onOpened();
      f.database.recordScopedAgentTaskCompletion({ ...f.input, invocationId: input.invocationId,
        agentId: "one", callId: "finish-repair-before-unknown-stop", requestedAt: NOW });
      f.database.bindScopedAgentReportHead({ ...f.input, headSha: HEAD });
      throw new ScopedAgentTurnFailure("Native repair process still alive", false);
    });
    const runner = new ScopedAgentExecutionRunner(f.database, f.git, { invoke }, () => f.root, { automaticCheckpoint: false });
    await expect(runner.prepareDelivery(f.input)).rejects.toMatchObject({ residentStopConfirmed: false });
    await expect(runner.prepareDelivery(f.input)).rejects.toThrow(/already reserved/);
    expect(invoke).toHaveBeenCalledOnce();
    expect(f.database.scopedAgentTurn("p", f.execution.id, 1)?.status).toBe("opened");
    expect(f.database.scopedExecution("p", f.execution.id)).toMatchObject({ status: "running", ownershipEpoch: 1 });
    expect(f.database.scopedAgentReport("p", f.execution.id, 1)).toMatchObject({ invocationId, output: "Preserved original report" });
    expect(f.git.checkpointAndPush).not.toHaveBeenCalled();
  });

  it("reconciles each physical report repair independently even under the same recovered writer and ownership epoch", async () => {
    const f = await fixture(false, { complete: false });
    const invocationId = "inv_" + "d".repeat(32);
    const identity = { ...f.input, invocationId };
    const runtimePath = join(f.root, "runtime", invocationId);
    f.database.beginScopedAgentTurn({ ...identity, runtimePath, baseCommit: BASE });
    f.database.markScopedAgentTurnOpened({ ...identity, nativeProcessOpened: true });
    f.database.recordScopedAgentReport({ ...identity, output: "Original report", residentTurnCompleted: true, residentStopConfirmed: true });
    f.database.close();
    const next = CollaborationStateDatabase.open({ ...f.options, instanceId: "instance-b", now: () => 2_000_000 });
    databases.push(next);
    const proof = (invocation: string, runtime: string) => ({ ...f.input, invocationId: invocation,
      residentStopConfirmed: true as const, evidence: { protocol: "scoped-supervisor-stop-v1", projectId: "p",
        scopeId: f.execution.id, agentId: "one", role: "delivery", ownershipEpoch: 1, runtimePath: runtime,
        nativeProcessScanCleared: true } });
    next.reconcileScopedAgentTurn(proof(invocationId, runtimePath));
    const invoke = vi.fn(async (input: ScopedAgentTurnInput) => {
      input.onOpened();
      throw new ScopedAgentTurnFailure("Unknown supplemental process stop", false);
    });
    const runner = new ScopedAgentExecutionRunner(next, f.git, { invoke }, () => f.root, { automaticCheckpoint: false });
    await expect(runner.prepareDelivery(f.input)).rejects.toMatchObject({ residentStopConfirmed: false });
    const current = next.scopedAgentTurn("p", f.execution.id, 1)!;
    expect(current.status).toBe("opened");
    expect(next.scopedAgentRecoveredForCurrentWriter("p", f.execution.id, 1, invocationId)).toBe(true);
    expect(next.scopedAgentRecoveredForCurrentWriter("p", f.execution.id, 1, current.invocationId)).toBe(false);
    next.reconcileScopedAgentTurn(proof(current.invocationId, current.runtimePath));
    expect(next.scopedAgentTurn("p", f.execution.id, 1)?.status).toBe("stopped");
    expect(next.scopedAgentRecoveredForCurrentWriter("p", f.execution.id, 1, current.invocationId)).toBe(true);
    next.reconcileScopedAgentTurn(proof(current.invocationId, current.runtimePath));
    expect(next.eventsAfter("p", 0).filter((event) => event.type === "scoped.agent.reconciled")).toHaveLength(2);
    expect(next.scopedAgentMechanismRepairCount("p", f.execution.id)).toBe(1);
    expect(next.scopedAgentReport("p", f.execution.id, 1)).toMatchObject({ invocationId, output: "Original report" });
  });

  it.each(["retain", "retry_settles", "retry_uncertain"] as const)("retains an exhausted original owner and handles %s coordination without resetting its budget", async (mode) => {
    const f = await fixture(false, { complete: false });
    const invocationId = "inv_" + "a".repeat(32);
    const identity = { ...f.input, invocationId };
    f.database.beginScopedAgentTurn({ ...identity, runtimePath: join(f.root, "runtime", invocationId), baseCommit: BASE });
    f.database.markScopedAgentTurnOpened({ ...identity, nativeProcessOpened: true });
    const operation = await prepareOperation(f.database.operationsForProject("p", true), { id: "unsettled-original-operation",
      kind: "git.push", ownerExecutionId: f.execution.id, ownershipEpoch: 1,
      expectedHead: HEAD, expectedBase: f.execution.executionBranch }, { head: HEAD });
    f.database.recordScopedAgentReport({ ...identity, output: "Retained work", reportHeadSha: HEAD,
      residentTurnCompleted: true, residentStopConfirmed: true });
    const invocations: string[] = [];
    const invoke = vi.fn(async (input: ScopedAgentTurnInput) => {
      invocations.push(input.invocationId);
      input.onOpened();
      if (input.reportRepair?.coordination && mode === "retry_settles") {
        expect(input.reportRepair.coordination.envelope.action).toMatchObject({ operation: "retry", rationale: "Inspect my retained provider operation" });
        await finalizeOperation(f.database.operationsForProject("p", true), operation, { owner: "example", repository: "openfars",
          ref: f.execution.executionBranch, sha: HEAD, status: "present", observedAt: NOW });
      }
      if (!f.database.scopedAgentTaskCompleted("p", f.execution.id, 1)) {
        f.database.recordScopedAgentTaskCompletion({ ...f.input, invocationId: input.invocationId, agentId: "one",
          callId: "agent-finished-but-provider-uncertain", requestedAt: NOW });
      }
      return { output: "Cannot settle my actual provider operation", reportHeadSha: HEAD, residentStopConfirmed: true as const };
    });
    const runner = new ScopedAgentExecutionRunner(f.database, f.git, { invoke }, () => f.root, { automaticCheckpoint: false });
    for (let turn = 0; turn < 3; turn += 1) await expect(runner.prepareDelivery(f.input)).rejects.toThrow(/unsettled Git operations/);
    expect(invoke).toHaveBeenCalledTimes(2);
    expect(new Set(invocations).size).toBe(2);
    expect(f.database.scopedAgentMechanismRepairCount("p", f.execution.id)).toBe(2);
    expect(f.database.scopedExecution("p", f.execution.id)).toMatchObject({ status: "integrating", ownershipEpoch: 1 });
    expect(f.database.scopedAgentReport("p", f.execution.id, 1)).toMatchObject({ invocationId, output: "Retained work" });
    expect(f.database.projectState("p").operations.find((operation) => operation.id === "unsettled-original-operation")?.status).toBe("prepared");
    expect(f.database.eventsAfter("p", 0).some((event) => event.type === "scoped.agent.failed")).toBe(false);
    expect(f.git.checkpointAndPush).not.toHaveBeenCalled();
    const issue = f.database.scopedGroupIssues("p").find((entry) => entry.kind === "mechanism")!;
    expect(issue).toMatchObject({ executionId: f.execution.id, ownershipEpoch: 1 });
    expect(f.database.scopedRecoveryCandidates("p", "run-G")).toMatchObject([{ executionId: f.execution.id,
      incidentId: issue.id, kind: "mechanism", ownershipEpoch: 1 }]);
    if (mode === "retain") {
      f.database.close();
      const restarted = CollaborationStateDatabase.open({ ...f.options, instanceId: "instance-b", now: () => 2_000_000 });
      databases.push(restarted);
      const manager = { projectId: "p", groupRunId: "run-G", agentId: "main", invocationId: "restarted-manager",
        runtimePath: join(f.root, "runtime", "restarted-manager"), allowStoppedRepairFaults: true };
      expect(restarted.scopedGroupIssues("p")).toEqual([issue]);
      expect(restarted.claimScopedLeaderTurn(manager)).toBeUndefined();
      const native = restarted.scopedAgentTurn("p", f.execution.id, 1)!;
      restarted.reconcileScopedAgentTurn({ ...f.input, invocationId: native.invocationId, residentStopConfirmed: true,
        evidence: { protocol: "scoped-supervisor-stop-v1", projectId: "p", scopeId: f.execution.id, agentId: "one",
          role: "delivery", ownershipEpoch: 1, runtimePath: native.runtimePath, nativeProcessScanCleared: true } });
      expect(restarted.claimScopedLeaderTurn(manager)).toBeDefined();
      expect(restarted.scopedAgentMechanismRepairCount("p", f.execution.id)).toBe(2);
      expect(restarted.scopedExecution("p", f.execution.id)).toMatchObject({ status: "integrating", ownershipEpoch: 1 });
      expect(restarted.projectState("p").operations.find((entry) => entry.id === operation.id)?.status).toBe("prepared");
      return;
    }

    const manager = { projectId: "p", groupRunId: "run-G", agentId: "main", invocationId: "manager-repair",
      runtimePath: join(f.root, "runtime", "manager-repair") };
    expect(f.database.claimScopedLeaderTurn(manager)).toBeUndefined();
    // A fault exception never bypasses another related native owner, including
    // a reservation that has not opened. It also keeps the original FIFO held.
    const other = f.database.claimScopedAgentArrival({ projectId: "p", arrivalRequestId: f.group.arrivals[1]!.requestId,
      agentId: "two", executionId: "other-live-execution", worktreePath: join(f.root, "git-worktrees", "agents", "two") })!.execution;
    const otherTurn = { projectId: "p", executionId: other.id, ownershipEpoch: 1, invocationId: "other-native" };
    f.database.beginScopedAgentTurn({ ...otherTurn, runtimePath: join(f.root, "runtime", "other-native"), baseCommit: BASE });
    expect(f.database.claimScopedLeaderTurn({ ...manager, allowStoppedRepairFaults: true })).toBeUndefined();
    f.database.markScopedAgentTurnOpened({ ...otherTurn, nativeProcessOpened: true });
    expect(f.database.claimScopedLeaderTurn({ ...manager, allowStoppedRepairFaults: true })).toBeUndefined();
    f.database.stopScopedAgentTurn({ ...otherTurn, residentStopConfirmed: true });
    f.database.failScopedAgentArrival({ ...otherTurn, arrivalRequestId: other.arrivalRequestId,
      reason: "Other actual native process stopped", residentStopConfirmed: true });

    const claim = f.database.claimScopedLeaderTurn({ ...manager, allowStoppedRepairFaults: true })!;
    expect(claim).toBeDefined();
    const managerIdentity = { ...manager, coordinatorEpoch: claim.coordinatorEpoch };
    f.database.markScopedLeaderOpened(managerIdentity);
    const envelope = (action: import("../../src/core/types.js").ControlAction, callId: string) => ({ projectId: "p", agent: "main",
      invocationId: manager.invocationId, callId, stateVersion: claim.coordinatorEpoch, capabilityHash: "a".repeat(64), receivedAt: NOW, action });
    f.database.recordScopedLeaderTaskCompletion({ ...managerIdentity, envelope: envelope({ tool: "finish_task" }, "manager-own-finish") });
    const retry = envelope({ tool: "coordinate_group_task", groupRunId: "run-G", coordinatorEpoch: claim.coordinatorEpoch,
      arrivalRequestId: f.execution.arrivalRequestId, operation: "retry", rationale: "Inspect my retained provider operation" }, "manager-native-retry");
    f.database.acceptScopedLeaderAction({ ...managerIdentity, envelope: retry, residentStopConfirmed: true });
    expect(f.database.scopedAgentReportContinuation("p", f.execution.id, 1)).toBeUndefined();
    await expect(runner.prepareDelivery(f.input)).rejects.toThrow(/management|Leader/);
    expect(invoke).toHaveBeenCalledTimes(2);
    f.database.releaseScopedLeaderTurn({ ...managerIdentity, residentStopConfirmed: true });
    expect(f.database.scopedAgentReportContinuation("p", f.execution.id, 1)).toEqual({ incidentId: issue.id, envelope: retry });
    if (mode === "retry_settles") {
      expect(await runner.prepareDelivery(f.input)).toMatchObject({ output: "Retained work", ownershipEpoch: 1, expectedHeadSha: HEAD });
      expect(f.database.scopedGroupIssues("p").some((entry) => entry.executionId === f.execution.id)).toBe(false);
    } else {
      await expect(runner.prepareDelivery(f.input)).rejects.toThrow(/unsettled Git operations/);
      const nextIssue = f.database.scopedGroupIssues("p").find((entry) => entry.executionId === f.execution.id)!;
      expect(nextIssue.id).not.toBe(issue.id);
      expect(f.database.scopedRecoveryCandidates("p", "run-G").find((entry) => entry.incidentId === nextIssue.id)?.pendingOperation).toBeUndefined();
      await expect(runner.prepareDelivery(f.input)).rejects.toThrow(/unsettled Git operations/);
    }
    expect(invoke).toHaveBeenCalledTimes(3);
    expect(new Set(invocations).size).toBe(3);
    expect(f.database.scopedAgentMechanismRepairCount("p", f.execution.id)).toBe(2);
    expect(f.database.scopedExecution("p", f.execution.id)).toMatchObject({ status: "integrating", ownershipEpoch: 1 });
    expect(f.database.scopedAgentReportContinuation("p", f.execution.id, 1)).toBeUndefined();
    expect(f.database.eventsAfter("p", 0).filter((event) => event.type === "scoped.agent.coordinated_repair.requested")).toHaveLength(1);
    expect(f.git.checkpointAndPush).not.toHaveBeenCalled();
  });

  it("cannot reserve a report repair or accept its result without distinct invocation and actual open/stop proof", async () => {
    const f = await fixture(false, { complete: false });
    const original = "inv_" + "5".repeat(32);
    const identity = { ...f.input, invocationId: original };
    f.database.beginScopedAgentTurn({ ...identity, runtimePath: join(f.root, "runtime", original), baseCommit: BASE });
    f.database.markScopedAgentTurnOpened({ ...identity, nativeProcessOpened: true });
    f.database.recordScopedAgentReport({ ...identity, output: "Original report", residentTurnCompleted: true, residentStopConfirmed: true });
    expect(() => f.database.beginScopedAgentReportRepair({ ...identity, originalReportInvocationId: original,
      runtimePath: join(f.root, "runtime", original), missing: ["finish_task"] })).toThrow(/new physical invocation/);
    const invocationId = "inv_" + "4".repeat(32);
    const repair = { ...f.input, invocationId, originalReportInvocationId: original,
      runtimePath: join(f.root, "runtime", invocationId), missing: ["finish_task"] };
    expect(f.database.beginScopedAgentReportRepair(repair)?.attempt).toBe(1);
    expect(() => f.database.beginScopedAgentReportRepair({ ...repair,
      invocationId: "inv_" + "3".repeat(32), runtimePath: join(f.root, "runtime", "inv_" + "3".repeat(32)) })).toThrow(/persisted native stop/);
    f.database.stopScopedAgentTurn({ ...repair, residentStopConfirmed: true });
    expect(() => f.database.recordScopedAgentReportRepairResult({ ...repair, output: "Bare unopened result", residentStopConfirmed: true }))
      .toThrow(/opened, stopped native lineage/);
    expect(f.database.scopedAgentReport("p", f.execution.id, 1)?.output).toBe("Original report");
    expect(f.database.scopedAgentTaskCompleted("p", f.execution.id, 1, original)).toBe(false);
  });

  it("can resume an unopened repair only after the supervisor clears that exact reservation, without inventing an opened process", async () => {
    const f = await fixture(false, { complete: false });
    const invocationId = "inv_" + "c".repeat(32);
    const identity = { ...f.input, invocationId };
    f.database.beginScopedAgentTurn({ ...identity, runtimePath: join(f.root, "runtime", invocationId), baseCommit: BASE });
    f.database.markScopedAgentTurnOpened({ ...identity, nativeProcessOpened: true });
    f.database.recordScopedAgentReport({ ...identity, output: "Original report before preparation failure",
      residentTurnCompleted: true, residentStopConfirmed: true });
    const repairInvocation = "inv_" + "e".repeat(32);
    const repairRuntime = join(f.root, "runtime", repairInvocation);
    const repair = { ...f.input, invocationId: repairInvocation, originalReportInvocationId: invocationId,
      runtimePath: repairRuntime, missing: ["finish_task"] };
    expect(f.database.beginScopedAgentReportRepair(repair)?.attempt).toBe(1);
    const nextInvocation = "inv_" + "f".repeat(32);
    const another = { ...repair, invocationId: nextInvocation, runtimePath: join(f.root, "runtime", nextInvocation) };
    expect(() => f.database.beginScopedAgentReportRepair(another)).toThrow(/persisted native stop/);
    f.database.reconcileScopedAgentTurn({ ...f.input, invocationId: repairInvocation, residentStopConfirmed: true, evidence: {
      protocol: "scoped-supervisor-stop-v1", projectId: "p", scopeId: f.execution.id, agentId: "one", role: "delivery",
      ownershipEpoch: 1, runtimePath: repairRuntime, nativeProcessScanCleared: true
    } });
    expect(f.database.scopedAgentTurn("p", f.execution.id, 1)).toMatchObject({ status: "stopped" });
    expect(f.database.scopedAgentTurn("p", f.execution.id, 1)?.openedAt).toBeUndefined();
    const invoke = vi.fn(async (input: ScopedAgentTurnInput) => {
      expect(input.reportRepair?.attempt).toBe(2);
      expect(input.invocationId).not.toBe(repairInvocation);
      input.onOpened();
      f.database.recordScopedAgentTaskCompletion({ ...f.input, invocationId: input.invocationId,
        agentId: "one", callId: "original-agent-finished-after-cleared-launch", requestedAt: NOW });
      return { output: "Actual Agent resumed after its cleared preparation failure", reportHeadSha: HEAD,
        residentStopConfirmed: true as const };
    });
    const runner = new ScopedAgentExecutionRunner(f.database, f.git, { invoke }, () => f.root, { automaticCheckpoint: false });
    expect(await runner.prepareDelivery(f.input)).toMatchObject({ expectedHeadSha: HEAD,
      output: "Original report before preparation failure" });
    expect(invoke).toHaveBeenCalledOnce();
    expect(f.database.scopedAgentMechanismRepairCount("p", f.execution.id)).toBe(2);
    expect(f.database.scopedAgentTaskCompleted("p", f.execution.id, 1, invocationId)).toBe(true);
    expect(f.database.scopedAgentReport("p", f.execution.id, 1)).toMatchObject({ invocationId,
      output: "Original report before preparation failure" });
  });

  it("retains the original task's mechanism repair budget after a failed native turn, restart and ownership retry", async () => {
    const f = await fixture(false, { complete: false });
    f.invoker.invoke = vi.fn(async (input) => {
      input.onOpened();
      expect(f.database.reserveScopedAgentMechanismRepair({ ...f.input, invocationId: input.invocationId,
        missing: ["finish_task"] })).toBe(1);
      throw new ScopedAgentTurnFailure("native repair interrupted", true);
    });
    await expect(f.runner.prepareDelivery(f.input)).rejects.toThrow("native repair interrupted");
    expect(f.database.scopedAgentMechanismRepairCount("p", f.execution.id)).toBe(1);
    expect(f.database.scopedAgentTurn("p", f.execution.id, 1)?.status).toBe("stopped");
    f.database.close();
    const next = CollaborationStateDatabase.open({ ...f.options, instanceId: "instance-b", now: () => 2_000_000 });
    databases.push(next);
    expect(next.scopedAgentMechanismRepairCount("p", f.execution.id)).toBe(1);
    const retry = next.retryScopedAgentArrival({ projectId: "p", executionId: f.execution.id,
      arrivalRequestId: f.execution.arrivalRequestId, failedOwnershipEpoch: 1 })!.execution;
    expect(retry).toMatchObject({ id: f.execution.id, agentId: "one", ownershipEpoch: 2,
      executionBranch: f.execution.executionBranch, worktreePath: f.execution.worktreePath });
    const invocationId = "inv_" + "9".repeat(32);
    const identity = { projectId: "p", executionId: retry.id, ownershipEpoch: 2, invocationId };
    next.beginScopedAgentTurn({ ...identity, runtimePath: join(f.root, "runtime", invocationId), baseCommit: BASE });
    next.markScopedAgentTurnOpened({ ...identity, nativeProcessOpened: true });
    expect(next.reserveScopedAgentMechanismRepair({ ...identity, missing: ["git_push", "finish_task"] })).toBe(2);
    const revision = next.projectState("p").stateRevision;
    expect(typeof revision).toBe("number");
    expect(next.reserveScopedAgentMechanismRepair({ ...identity, missing: ["finish_task"] })).toBeUndefined();
    expect(next.projectState("p").stateRevision).toBe(revision);
    expect(next.scopedAgentMechanismRepairCount("p", retry.id)).toBe(2);
    const repairs = next.eventsAfter("p", 0).filter((event) => event.type === "scoped.agent.mechanism_repair.requested");
    expect(repairs.map((event) => [event.payload.ownershipEpoch, event.payload.attempt, event.payload.missing]))
      .toEqual([[1, 1, ["finish_task"]], [2, 2, ["git_push", "finish_task"]]]);
    expect(next.scopedAgentReport("p", retry.id, 2)).toBeUndefined();
    expect(next.scopedAgentTaskCompletion("p", retry.id, 2)).toBeUndefined();
    expect(next.scopedExecution("p", retry.id)?.status).toBe("running");
    expect(f.git.checkpointAndPush).not.toHaveBeenCalled();
  });

  it("reserves missing-tool repairs only for the exact opened native owner", async () => {
    const f = await fixture();
    const invocationId = "inv_" + "8".repeat(32);
    const identity = { ...f.input, invocationId };
    f.database.beginScopedAgentTurn({ ...identity, runtimePath: join(f.root, "runtime", invocationId), baseCommit: BASE });
    expect(() => f.database.reserveScopedAgentMechanismRepair({ ...identity, missing: ["finish_task"] }))
      .toThrow(/exact live native owner/);
    f.database.markScopedAgentTurnOpened({ ...identity, nativeProcessOpened: true });
    for (const mutation of [{ invocationId: "foreign" }, { ownershipEpoch: 2 }, { executionId: "foreign" }]) {
      expect(() => f.database.reserveScopedAgentMechanismRepair({ ...identity, ...mutation, missing: ["finish_task"] }))
        .toThrow(/exact live native owner/);
    }
    expect(() => f.database.reserveScopedAgentMechanismRepair({ ...identity, missing: [] })).toThrow(/bounded/);
    expect(f.database.scopedAgentMechanismRepairCount("p", f.execution.id)).toBe(0);
    expect(f.database.reserveScopedAgentMechanismRepair({ ...identity, missing: ["finish_task"] })).toBe(1);
    f.database.stopScopedAgentTurn({ ...identity, residentStopConfirmed: true });
    expect(() => f.database.reserveScopedAgentMechanismRepair({ ...identity, missing: ["finish_task"] }))
      .toThrow(/exact live native owner/);
    expect(f.database.scopedAgentMechanismRepairCount("p", f.execution.id)).toBe(1);
  });

  it("reserves before checkout, persists native stop/report, and pushes before releasing any successor", async () => {
    const { database, execution, git, invoker, runner, input } = await fixture();
    const sessionBegin = git.sessionBegin;
    git.sessionBegin = vi.fn(async (...args) => {
      expect(database.scopedAgentTurn("p", execution.id, 1)?.status).toBe("reserved");
      return sessionBegin(...args);
    });
    const checkpoint = git.checkpointAndPush;
    git.checkpointAndPush = vi.fn(async (...args) => {
      expect(database.scopedAgentTurn("p", execution.id, 1)?.status).toBe("stopped");
      expect(database.scopedAgentReport("p", execution.id, 1)?.output).toContain("Committed");
      return checkpoint(...args);
    });
    expect(await runner.prepareDelivery(input)).toMatchObject({ expectedHeadSha: HEAD, output: "Committed work and report" });
    expect(invoker.invoke).toHaveBeenCalledOnce();
    expect(database.scopedExecution("p", execution.id)?.status).toBe("integrating");
    expect(database.scopedArrivals("run-G")).toHaveLength(2);
    expect(database.scopedGroupReadyForFinalIntegration("p", "run-G")).toBe(false);
    expect(database.projectState("p").scopedAgentMerges).toEqual([]);
    await runner.prepareDelivery(input);
    expect(git.sessionBegin).toHaveBeenCalledOnce();
    expect(git.checkpointAndPush).toHaveBeenCalledOnce();
    expect(invoker.invoke).toHaveBeenCalledOnce();
  });

  it("shows the real scoped invocation, fixed owner and current epoch during native work, with no fake legacy task", async () => {
    const f = await fixture();
    f.invoker.invoke = vi.fn(async (input) => {
      input.onOpened();
      f.database.recordScopedAgentTaskCompletion({ projectId: "p", executionId: input.execution.id,
        ownershipEpoch: input.execution.ownershipEpoch, agentId: input.execution.agentId, invocationId: input.invocationId,
        callId: `finish-${input.invocationId}`, requestedAt: NOW });
      const projection = f.database.projectState("p");
      expect(projection.runtimeActivities).toMatchObject([{ scopeKind: "scoped-agent", agentId: "one", nodeRunId: "node-G",
        groupRunId: "run-G", executionId: f.execution.id, ownershipEpoch: 1, invocationId: input.invocationId, leaseState: "current" }]);
      const runtime = deriveProjectRuntimeProjection(projection);
      expect(runtime).toMatchObject({ currentAgent: "one", executionId: f.execution.id, executionCount: 1, activeInvocationId: input.invocationId });
      expect(projection.tasks).toEqual([]); expect(projection.executions).toEqual([]);
      return { output: "Actual result", residentStopConfirmed: true };
    });
    await f.runner.prepareDelivery(f.input);
    expect(f.database.projectState("p").runtimeActivities).toEqual([]);
    expect(f.database.authoritativeWorkflowFiles("p").currentState.scopedRuntime?.executions).toHaveLength(1);
  });

  it("replays Git-only delivery after a push response interruption, without a second native turn", async () => {
    const { database, execution, git, invoker, runner, input } = await fixture(true);
    const checkpoint = git.checkpointAndPush;
    let interrupted = false;
    git.checkpointAndPush = vi.fn(async (request) => {
      const pushed = await checkpoint(request);
      if (!interrupted) { interrupted = true; throw new Error("interrupted after push"); }
      return pushed;
    });
    await expect(runner.prepareDelivery(input)).rejects.toThrow("interrupted after push");
    expect(database.scopedAgentReport("p", execution.id, 1)).toMatchObject({ selectedWeakTarget: "finish" });
    expect(database.scopedAgentReport("p", execution.id, 1)?.headSha).toBeUndefined();
    expect(await runner.prepareDelivery(input)).toMatchObject({ expectedHeadSha: HEAD, selectedWeakTarget: "finish" });
    expect(invoker.invoke).toHaveBeenCalledOnce();
    expect(database.projectState("p").operations.filter((op) => op.kind === "git.push")).toHaveLength(1);
  });

  it("does not reopen or recreate a reserved invocation, even through another runner instance", async () => {
    const { root, database, git, invoker, runner, input } = await fixture();
    invoker.invoke = vi.fn(async (turn) => { turn.onOpened(); throw new Error("native outcome unknown"); });
    await expect(runner.prepareDelivery(input)).rejects.toThrow("native outcome unknown");
    const another = new ScopedAgentExecutionRunner(database, git, invoker, () => root);
    await expect(another.prepareDelivery(input)).rejects.toThrow(/already reserved/);
    expect(invoker.invoke).toHaveBeenCalledOnce();
    expect(git.sessionBegin).toHaveBeenCalledOnce();
    expect(database.scopedAgentTurn("p", input.executionId, 1)?.status).toBe("opened");
    expect(database.scopedExecution("p", input.executionId)?.status).toBe("running");
  });

  it("requires actual native-open and stop proofs; a bare model result is insufficient", async () => {
    const { database, invoker, runner, input } = await fixture();
    invoker.invoke = vi.fn(async () => ({ output: "unopened result", residentStopConfirmed: true }));
    await expect(runner.prepareDelivery(input)).rejects.toThrow(/opened invocation/);
    expect(database.scopedAgentReport("p", input.executionId, 1)).toBeUndefined();
    expect(database.scopedAgentTurn("p", input.executionId, 1)?.status).toBe("reserved");
  });

  it("holds unknown-stop work but marks confirmed stopped native failures without blocking independent Agents", async () => {
    const { database, group, root, invoker, runner, input } = await fixture();
    invoker.invoke = vi.fn(async (turn) => { turn.onOpened(); throw new ScopedAgentTurnFailure("worker failed", true); });
    await expect(runner.prepareDelivery(input)).rejects.toThrow("worker failed");
    expect(database.scopedExecution("p", input.executionId)?.status).toBe("failed");
    expect(database.scopedAgentTurn("p", input.executionId, 1)?.status).toBe("stopped");
    expect(database.claimScopedAgentArrival({ projectId: "p", arrivalRequestId: group.arrivals[1]!.requestId,
      agentId: "two", executionId: "exec-two", worktreePath: join(root, "git-worktrees", "agents", "two") })).toBeDefined();
    await expect(runner.prepareDelivery(input)).rejects.toThrow();
    expect(invoker.invoke).toHaveBeenCalledOnce();
  });

  it("retries an unopened preparation with no created branch from the fresh canonical group base", async () => {
    const f = await fixture();
    const sessionBegin = f.git.sessionBegin;
    const failedSessionBegin = vi.fn(async () => { throw new Error("preparation failed"); });
    f.git.sessionBegin = failedSessionBegin;
    await expect(f.runner.prepareDelivery(f.input)).rejects.toThrow("preparation failed");
    expect(f.database.scopedAgentTurn("p", f.execution.id, 1)).toMatchObject({ status: "stopped", baseCommit: BASE });
    expect(f.database.scopedAgentTurn("p", f.execution.id, 1)?.openedAt).toBeUndefined();
    expect(f.database.scopedExecution("p", f.execution.id)?.status).toBe("failed");

    const retry = f.database.retryScopedAgentArrival({ projectId: "p", executionId: f.execution.id,
      arrivalRequestId: f.execution.arrivalRequestId, failedOwnershipEpoch: 1 })!.execution;
    f.git.sessionBegin = sessionBegin;
    f.git.observeRemoteRef = vi.fn(async (_repository, ref) => ({ owner: repository.owner, repository: repository.name, ref,
      status: "present", sha: HEAD, observedAt: NOW }));
    const retryInput = { ...f.input, ownershipEpoch: retry.ownershipEpoch };
    await expect(f.runner.prepareDelivery(retryInput)).resolves.toMatchObject({ expectedHeadSha: HEAD });
    expect(f.git.observeRetainedExecution).not.toHaveBeenCalled();
    expect(failedSessionBegin).toHaveBeenCalledOnce();
    expect(sessionBegin).toHaveBeenCalledOnce();
    expect(sessionBegin.mock.calls[0]?.[2]).toEqual({ kind: "delivery", base: { kind: "commit", commitSha: HEAD } });
    expect(f.database.scopedAgentTurn("p", f.execution.id, 1)).toMatchObject({ status: "stopped", baseCommit: BASE });
    expect(f.database.scopedAgentTurn("p", f.execution.id, 2)).toMatchObject({ status: "stopped", baseCommit: HEAD });
  });

  it("persists the model output and fails the arrival when finish_task is omitted", async () => {
    const { database, runner, input, execution, invoker } = await fixture(false, { complete: false });
    await expect(runner.prepareDelivery(input)).rejects.toThrow(/finish_task/);
    expect(invoker.invoke).toHaveBeenCalledOnce();
    expect(database.scopedAgentReport("p", execution.id, 1)).toMatchObject({ output: "Committed work and report" });
    expect(database.scopedAgentTaskCompleted("p", execution.id, 1)).toBe(false);
    expect(database.scopedExecution("p", execution.id)?.status).toBe("failed");
    expect(database.scopedArrivals("run-G")[0]?.status).toBe("failed");
    expect(database.eventsAfter("p", 0).some((event) => event.type === "scoped.agent.failed" &&
      String(event.payload.reason).includes("finish_task"))).toBe(true);
  });

  it("records a mechanism issue after finite no-progress repairs without a Git operation", async () => {
    const f = await fixture(false, { complete: false });
    const runner = new ScopedAgentExecutionRunner(f.database, f.git, f.invoker, () => f.root, { automaticCheckpoint: false });

    await expect(runner.prepareDelivery(f.input)).rejects.toThrow(/finish_task/);
    expect(f.database.scopedAgentMechanismRepairCount("p", f.execution.id)).toBe(1);
    const retry = f.database.retryScopedAgentArrival({ projectId: "p", executionId: f.execution.id,
      arrivalRequestId: f.execution.arrivalRequestId, failedOwnershipEpoch: 1 })!.execution;

    await expect(runner.prepareDelivery({ ...f.input, ownershipEpoch: retry.ownershipEpoch })).rejects.toThrow(/finish_task/);
    expect(f.database.scopedAgentMechanismRepairCount("p", f.execution.id)).toBe(2);
    expect(f.database.scopedExecutionHasUnsettledGitOperation("p", f.execution.id, retry.ownershipEpoch)).toBe(false);
    expect(f.database.scopedGroupIssues("p")).toMatchObject([{ kind: "mechanism", executionId: f.execution.id,
      ownershipEpoch: retry.ownershipEpoch }]);
    expect(f.database.scopedExecution("p", f.execution.id)).toMatchObject({ status: "integrating", ownershipEpoch: retry.ownershipEpoch });
    expect(f.database.eventsAfter("p", 0).filter((event) => event.type === "scoped.agent.failed")).toHaveLength(1);
    expect(() => f.database.retryScopedAgentArrival({ projectId: "p", executionId: f.execution.id,
      arrivalRequestId: f.execution.arrivalRequestId, failedOwnershipEpoch: retry.ownershipEpoch })).toThrow(/failed work/);
  });

  it("fails an Agent-owned delivery when the turn finishes without an explicit git_push", async () => {
    const { database, root, invoker, input, execution, git } = await fixture();
    const runner = new ScopedAgentExecutionRunner(database, git, invoker, () => root, { automaticCheckpoint: false });
    await expect(runner.prepareDelivery(input)).rejects.toThrow(/git_push/);
    expect(database.scopedAgentTaskCompleted("p", execution.id, 1)).toBe(true);
    expect(database.scopedAgentReport("p", execution.id, 1)).toMatchObject({ output: "Committed work and report" });
    expect(database.scopedExecution("p", execution.id)?.status).toBe("failed");
    expect(git.checkpointAndPush).not.toHaveBeenCalled();
  });

  it("does not bypass finish_task when a report survived a crash before the completion check", async () => {
    const f = await fixture(false, { complete: false });
    const invocationId = "inv_" + "7".repeat(32);
    f.database.beginScopedAgentTurn({ ...f.input, invocationId, runtimePath: join(f.root, "runtime", invocationId), baseCommit: BASE });
    f.database.markScopedAgentTurnOpened({ ...f.input, invocationId, nativeProcessOpened: true });
    f.database.recordScopedAgentReport({ ...f.input, invocationId, output: "Preserved native report",
      residentTurnCompleted: true, residentStopConfirmed: true });
    await expect(f.runner.prepareDelivery(f.input)).rejects.toThrow(/finish_task/);
    expect(f.git.checkpointAndPush).not.toHaveBeenCalled();
    expect(f.invoker.invoke).not.toHaveBeenCalled();
    expect(f.database.scopedAgentReport("p", f.execution.id, 1)?.output).toBe("Preserved native report");
  });

  it("rejects foreign repository or moved fixed directory before native launch", async () => {
    const { root, database, git, invoker, runner, input } = await fixture();
    await expect(runner.prepareDelivery({ ...input, repository: { ...repository, owner: "foreign" } })).rejects.toThrow(/pinned repository/);
    const moved = new ScopedAgentExecutionRunner(database, git, invoker, () => join(root, "different-project"));
    await expect(moved.prepareDelivery(input)).rejects.toThrow(/fixed directory/);
    expect(git.sessionBegin).not.toHaveBeenCalled();
    expect(invoker.invoke).not.toHaveBeenCalled();
  });

  it("keeps a no-commit result durable and retries only Git, not the model", async () => {
    const { database, git, invoker, runner, input } = await fixture();
    const checkpoint = git.checkpointAndPush;
    git.checkpointAndPush = vi.fn(async (request) => ({ ...(await checkpoint(request)), remote: undefined,
      checkpoint: { ...(await checkpoint(request)).checkpoint, changed: false } }));
    await expect(runner.prepareDelivery(input)).rejects.toThrow(/business\/report commit/);
    await expect(runner.prepareDelivery(input)).rejects.toThrow(/business\/report commit/);
    expect(database.scopedAgentReport("p", input.executionId, 1)?.output).toContain("Committed");
    expect(invoker.invoke).toHaveBeenCalledOnce();
  });

  it("fences an old writer's launch even if it had not yet published a report", async () => {
    const { database, options, root, git, invoker, runner, input } = await fixture();
    invoker.invoke = vi.fn(async () => { throw new Error("launch interrupted"); });
    await expect(runner.prepareDelivery(input)).rejects.toThrow("launch interrupted");
    database.close();
    const next = CollaborationStateDatabase.open({ ...options, instanceId: "instance-b", now: () => 2_000_000 });
    databases.push(next);
    const restarted = new ScopedAgentExecutionRunner(next, git, invoker, () => root);
    await expect(restarted.prepareDelivery(input)).rejects.toThrow(/owns Git|reserved/);
    expect(git.sessionBegin).toHaveBeenCalledOnce();
    expect(invoker.invoke).toHaveBeenCalledOnce();
  });

  it("migrates v11 under the exact writer lease without altering reports or executions", async () => {
    const { database, options, input } = await fixture();
    const lease = database.writerLease();
    database.close();
    const sql = new DatabaseSync(options.databasePath);
    sql.exec("DROP TABLE scoped_agent_turns");
    sql.exec("UPDATE collaboration_state_meta SET schema_version = 11");
    expect(() => initializeCollaborationStateSchema(sql)).toThrow(/lease/);
    sql.close();
    const migrated = CollaborationStateDatabase.open({ ...options, writerLease: lease });
    databases.push(migrated);
    expect(migrated.verifyHealth().schemaVersion).toBe(COLLABORATION_STATE_SCHEMA_VERSION);
    expect(migrated.scopedExecution("p", input.executionId)?.status).toBe("running");
    expect(migrated.scopedAgentReport("p", input.executionId, 1)).toBeUndefined();
  });

  it("does not release an opened native owner's lane based only on a failure assertion", async () => {
    const { database, invoker, runner, input, execution } = await fixture();
    invoker.invoke = vi.fn(async (turn) => { turn.onOpened(); throw new Error("unknown process"); });
    await expect(runner.prepareDelivery(input)).rejects.toThrow("unknown process");
    expect(() => database.failScopedAgentArrival({ ...input, arrivalRequestId: execution.arrivalRequestId,
      reason: "asserted failure", residentStopConfirmed: true })).toThrow(/persisted native stop/);
    expect(database.scopedExecution("p", execution.id)?.status).toBe("running");
    const turn = database.scopedAgentTurn("p", execution.id, 1)!;
    database.stopScopedAgentTurn({ ...input, invocationId: turn.invocationId, residentStopConfirmed: true });
    database.failScopedAgentArrival({ ...input, arrivalRequestId: execution.arrivalRequestId,
      reason: "actually stopped", residentStopConfirmed: true });
    expect(database.scopedExecution("p", execution.id)?.status).toBe("failed");
  });
});

function nativeInput(): ScopedAgentTurnInput {
  return { execution: { id: "exec-one", projectId: "p", groupRunId: "run-G", arrivalRequestId: "arrival-one",
    agentId: "one", ownershipEpoch: 1, executionBranch: "executions/exec-one", worktreePath: "/srv/p/git-worktrees/agents/one", status: "running" },
    groupRun: { id: "run-G", projectId: "p", groupId: "G", activationRequestId: "activate", workflowRevision: 1,
      leaderAgentId: "main", groupBranch: "groups/run-G", integrationTarget: "main", baseCommit: BASE, status: "running" },
    arrival: { sequence: 1, requestId: "arrival-one", groupRunId: "run-G", sourceRunId: "input:run-G", targetNodeId: "G_one",
      targetKind: "agent", agentId: "one", status: "running" },
    workflow: { nodes: [{ kind: "agent", nodeId: "G_one", agentId: "one" }],
      input: { source: "input", edges: [{ kind: "parallel", target: "G_one" }] }, routes: { G_one: [{ kind: "strong", target: "finish" }] } },
    invocationId: "turn-one", runtimePath: "/srv/p/runtime/turn-one", baseCommit: BASE, onOpened: vi.fn() };
}

function openInput(input: ScopedAgentTurnInput): CollaborationResidentOpenInput {
  return { initialTask: "来源：Leader\n内容：Continue the original scoped assignment in the retained session and supply finish_task.", request: { project: { id: "p", orchestration: { schemaVersion: 3 }, agentSessionIds: { one: "same-session" } } as never,
    agent: "one", invocationId: input.invocationId, kind: "worker", permission: "workspace", inboxPath: "/srv/p/inbox.md",
    projectPath: "/srv/p", workspacePath: input.execution.worktreePath, runtimePath: input.runtimePath,
    schemaPath: "/srv/worker.schema.json", skillPaths: [], availableSkillPaths: [], sessionContinuity: "strict",
    resumeThreadId: "same-session", onDurableSessionStarted: vi.fn(), executionContext: {
      nodeRunId: "arrival-one", groupRunId: "run-G", taskId: "arrival-one", executionId: "exec-one",
      role: "delivery", ownershipEpoch: 1, executionWorktree: input.execution.worktreePath } },
    executionRuntimePath: input.runtimePath, signal: new AbortController().signal, onTrace: vi.fn(),
    filesystemAuthorityInput: { serviceUserRoot: "/srv", projectWorktreeRoot: "/srv/p/git-worktrees", protectedRoots: [] },
    turnRequestFactory: vi.fn(), controlAuthorityFactory: vi.fn(), controlScope: { projectId: "p", nodeRunId: "arrival-one",
      groupRunId: "run-G", executionId: "exec-one", agentId: "one", ownershipEpoch: 1, role: "scoped-agent", candidates: [], decisionBy: "agent" } };
}

describe("scoped native resident composition", () => {
  it("resumes a stopped report supplement with its saved session and a new repair input instead of repeating the original native input", async () => {
    const input = nativeInput();
    input.invocationId = "turn-repair";
    input.runtimePath = "/srv/p/runtime/turn-repair";
    input.reportRepair = { report: { projectId: "p", executionId: "exec-one", ownershipEpoch: 1,
      invocationId: "turn-original", output: "Original business result", recordedAt: NOW }, attempt: 1, missing: ["finish_task"] };
    const submit = vi.fn(async (turn) => {
      expect(turn.inputId).toBe("scoped:arrival-one:epoch:1:report-repair:1");
      expect(turn.prompt).toContain("retained session");
      expect(turn.prompt).toContain("finish_task");
      return { handoff: "Original Agent finished its missing mechanism" };
    });
    const open = vi.fn(async (request: CollaborationResidentOpenInput) => {
      expect(request.request.resumeThreadId).toBe("same-session");
      expect(request.request.sessionContinuity).toBe("strict");
      expect(request.request.workspacePath).toBe(input.execution.worktreePath);
      await request.onOpened?.();
      return { submit, close: vi.fn(async () => undefined), pause: vi.fn(), resume: vi.fn() };
    });
    const invoker = new ResidentScopedAgentTurnInvoker({ open }, { prepare: async () => openInput(input),
      acceptResult: async () => ({ output: "Actual supplemental output" }) });
    await invoker.invoke(input);
    expect(open).toHaveBeenCalledOnce();
    expect(submit).toHaveBeenCalledOnce();
  });

  it("reserves the durable attempt before native submission and keeps the same handle with a distinct repair input", async () => {
    const input = nativeInput();
    const submissions: { inputId: string; invocationId: string; prompt: string }[] = [];
    let reserved = false;
    const reserveRepair = vi.fn(() => {
      expect(submissions).toHaveLength(reserved ? 2 : 1);
      if (reserved) return undefined;
      reserved = true;
      return 2;
    });
    const submit = vi.fn(async (turn) => {
      if (submissions.length) expect(reserved).toBe(true);
      submissions.push(turn);
      return { handoff: "Original task still lacks its explicit completion" };
    });
    const close = vi.fn(async () => undefined);
    const open = vi.fn(async (request: CollaborationResidentOpenInput) => {
      await request.onOpened?.();
      return { submit, close, pause: vi.fn(), resume: vi.fn() };
    });
    const invoker = new ResidentScopedAgentTurnInvoker({ open }, { prepare: async () => openInput(input),
      missingActions: () => ["finish_task"], reserveRepair,
      acceptResult: async () => ({ output: "Preserved original output" }) });
    await invoker.invoke(input);
    expect(open).toHaveBeenCalledOnce();
    expect(close).toHaveBeenCalledOnce();
    expect(reserveRepair).toHaveBeenCalledTimes(2);
    expect(submissions).toHaveLength(2);
    expect(submissions.map((turn) => turn.invocationId)).toEqual([input.invocationId, input.invocationId]);
    expect(submissions.map((turn) => turn.inputId)).toEqual([
      "scoped:arrival-one:epoch:1", "scoped:arrival-one:epoch:1:mechanism-repair:2"
    ]);
    expect(submissions[1].prompt).toContain("retained session and directory");
    expect(submissions[1].prompt).toContain("finish_task");
  });

  it("reuses the native launcher and confirms close before formal result acceptance", async () => {
    const input = nativeInput();
    const close = vi.fn(async () => undefined);
    const acceptResult = vi.fn(async () => {
      expect(close).toHaveBeenCalledOnce();
      return { output: "accepted report" };
    });
    const open = vi.fn(async (request: CollaborationResidentOpenInput) => {
      await request.onOpened?.();
      return { submit: vi.fn(async () => ({ handoff: "native handoff" })), close, pause: vi.fn(), resume: vi.fn() };
    });
    const invoker = new ResidentScopedAgentTurnInvoker({ open }, { prepare: async () => openInput(input), acceptResult });
    expect(await invoker.invoke(input)).toEqual({ output: "accepted report", residentStopConfirmed: true });
    expect(input.onOpened).toHaveBeenCalledOnce();
    expect(acceptResult).toHaveBeenCalledOnce();
  });

  it.each(["directory", "session", "candidates", "scope"])("rejects changed %s before native launch", async (change) => {
    const input = nativeInput();
    const prepared = openInput(input);
    if (change === "directory") prepared.request.workspacePath = "/srv/different";
    if (change === "session") prepared.request.resumeThreadId = "replacement";
    if (change === "candidates") (prepared.controlScope as { candidates: string[] }).candidates = ["outside"];
    if (change === "scope") (prepared.controlScope as { groupRunId: string }).groupRunId = "run-H";
    const open = vi.fn();
    const invoker = new ResidentScopedAgentTurnInvoker({ open }, { prepare: async () => prepared,
      acceptResult: vi.fn() });
    await expect(invoker.invoke(input)).rejects.toMatchObject({ residentStopConfirmed: true });
    expect(open).not.toHaveBeenCalled();
  });

  it("does not assert a stop proof or accept a result when native close fails", async () => {
    const input = nativeInput();
    const acceptResult = vi.fn();
    const open = vi.fn(async (request: CollaborationResidentOpenInput) => {
      await request.onOpened?.();
      return { submit: vi.fn(async () => ({ handoff: "finished model turn" })),
        close: vi.fn(async () => { throw new Error("process still alive"); }), pause: vi.fn(), resume: vi.fn() };
    });
    const invoker = new ResidentScopedAgentTurnInvoker({ open }, { prepare: async () => openInput(input), acceptResult });
    await expect(invoker.invoke(input)).rejects.toMatchObject({ residentStopConfirmed: false });
    expect(acceptResult).not.toHaveBeenCalled();
  });

  it("keeps a bounded redacted failure reason only after native stop is confirmed", async () => {
    const input = nativeInput();
    const close = vi.fn(async () => undefined);
    const acceptResult = vi.fn();
    const open = vi.fn(async (request: CollaborationResidentOpenInput) => {
      await request.onOpened?.();
      return { submit: vi.fn(async () => { throw new Error(`provider overloaded: api_key=secret-fixture-value ${"x".repeat(2_000)}`); }),
        close, pause: vi.fn(), resume: vi.fn() };
    });
    const invoker = new ResidentScopedAgentTurnInvoker({ open }, { prepare: async () => openInput(input), acceptResult });
    const failure = await invoker.invoke(input).catch(error => error as ScopedAgentTurnFailure);
    expect(failure.residentStopConfirmed).toBe(true);
    expect(failure.message).toContain("provider overloaded");
    expect(failure.message).not.toContain("secret-fixture-value");
    expect(failure.message.length).toBeLessThan(800);
    expect(close).toHaveBeenCalledOnce();
    expect(acceptResult).not.toHaveBeenCalled();
  });
});
