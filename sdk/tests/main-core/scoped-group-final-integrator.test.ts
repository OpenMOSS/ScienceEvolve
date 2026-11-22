import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CollaborationStateDatabase } from "../../src/core/collaboration-state/store.js";
import { ScopedGroupFinalIntegrator } from "../../src/core/scoped-group-final-integrator.js";
import type { ScopedGroupFinalGit } from "../../src/core/scoped-group-final-integrator.js";
import type { GitHubPullRequestFact, GitHubRepositoryFact, RemoteMergeSyncFact } from "../../src/core/collaboration-git/contracts.js";
import type { CreateGroupFinalPullRequestRequest, MergeGroupFinalPullRequestRequest } from "../../src/core/collaboration-git/facade.js";
import { finalizeOperation, mergedPullSynchronizationOperationId, prepareOperation } from "../../src/core/collaboration-git/operation.js";

const SOURCE = "a".repeat(40);
const BASE = "b".repeat(40);
const GROUP_HEAD = "d".repeat(40);
const MERGED = "e".repeat(40);
const NOW = "2026-09-30T00:00:00.000Z";
const repository: GitHubRepositoryFact = {
  provider: "github", providerId: 1, owner: "example", name: "openfars",
  htmlUrl: "https://github.com/example/openfars", cloneUrl: "https://github.com/example/openfars.git",
  private: true, defaultBranch: "main", observedAt: NOW
};
const roots: string[] = [];
const databases: CollaborationStateDatabase[] = [];

afterEach(async () => {
  databases.splice(0).forEach((database) => database.close());
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

async function fixture(nested = false, weak = false) {
  const root = await mkdtemp(join(tmpdir(), "openfars-scoped-final-pipeline-"));
  roots.push(root);
  const options = {
    databasePath: join(root, "collaboration.sqlite"), serviceId: "final-pipeline-test", hostId: "test-host",
    topology: "single-host" as const, instanceId: "instance-a", now: () => 1_000_000
  };
  const database = CollaborationStateDatabase.open(options);
  databases.push(database);
  database.createProject({
    projectId: "project-1", workflowRevision: 1, workerCapacity: 2,
    git: { enabled: true, status: "ready", repository: {
      owner: repository.owner, name: repository.name, htmlUrl: repository.htmlUrl,
      private: repository.private, defaultBranch: "main", localPath: join(root, "workspace")
    } },
    workflowSnapshot: {
      schemaVersion: 3, agents: [{ name: "main" }, { name: "worker" }, { name: "next" }],
      collaborations: [{ id: "G" }, ...(nested ? [{ id: "H" }] : [])],
      scopedWorkflow: {
        schemaVersion: 1, rootAgentIds: ["main"],
        groups: [{
          id: "G", leaderAgentId: "main", allowLeaderReconfiguration: false,
          workflow: {
            nodes: nested ? [
              { kind: "collaboration", nodeId: "G_H", groupId: "H" },
              { kind: "agent", nodeId: "G_next", agentId: "next" }
            ] : [{ kind: "agent", nodeId: "G_worker", agentId: "worker" }],
            input: { source: "input", edges: [{ kind: "parallel", target: nested ? "G_H" : "G_worker" }] },
            routes: nested ? {
              G_H: weak ? [{ kind: "weak", target: "G_next" }, { kind: "weak", target: "finish" }]
                : [{ kind: "strong", target: "G_next" }],
              G_next: [{ kind: "strong", target: "finish" }]
            } : { G_worker: [{ kind: "strong", target: "finish" }] }
          }
        }, ...(nested ? [{
          id: "H", parentGroupId: "G", leaderAgentId: "main", allowLeaderReconfiguration: false,
          workflow: {
            nodes: [{ kind: "agent", nodeId: "H_worker", agentId: "worker" }],
            input: { source: "input", edges: [{ kind: "parallel", target: "H_worker" }] },
            routes: { H_worker: [{ kind: "strong", target: "finish" }] }
          }
        }] : [])]
      }
    }
  });
  const rootGroup = database.activateScopedGroup({
    projectId: "project-1", groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G",
    workflowRevision: 1, baseCommit: BASE,
    outer: { nodeRunId: "node-G", inputSnapshotRef: "project:input", activatedByAgentId: "main" }
  });
  const group = nested ? database.activateScopedGroup({
    projectId: "project-1", groupRunId: "run-H", groupId: "H", activationRequestId: rootGroup.arrivals[0]!.requestId,
    workflowRevision: 1, baseCommit: BASE,
    parentGroupRunId: "run-G", parentArrivalRequestId: rootGroup.arrivals[0]!.requestId
  }) : rootGroup;
  const arrival = group.arrivals[0]!;
  database.claimScopedAgentArrival({
    projectId: "project-1", arrivalRequestId: arrival.requestId, agentId: "worker", executionId: "exec-worker",
    worktreePath: join(root, "git-worktrees", "agents", "worker")
  });
  const finishWorker = () => database.completeScopedAgentArrivalAfterMerge({
    projectId: "project-1", arrivalRequestId: arrival.requestId, executionId: "exec-worker", ownershipEpoch: 1,
    pullRequest: {
      id: "pull-worker", providerNumber: 1, htmlUrl: `${repository.htmlUrl}/pull/1`,
      head: "executions/exec-worker", base: group.groupRun.groupBranch, ownerExecutionId: "exec-worker",
      status: "merged", headSha: SOURCE, mergeCommitSha: GROUP_HEAD, observedAt: NOW
    },
    synchronization: {
      projectId: "project-1",
      operationId: mergedPullSynchronizationOperationId("exec-worker", 1, SOURCE, group.groupRun.groupBranch, GROUP_HEAD),
      targetBranch: group.groupRun.groupBranch as `groups/${string}`,
      temporaryRef: "refs/openfars/reconcile/worker", expectedSourceHead: SOURCE, mergeCommitSha: GROUP_HEAD,
      remoteHead: GROUP_HEAD, localHeadBefore: BASE, localHeadAfter: GROUP_HEAD, status: "synchronized", observedAt: NOW
    }
  });
  const git = new StateBackedGit(database);
  const integrator = new ScopedGroupFinalIntegrator(database, git);
  const input = { projectId: "project-1", groupRunId: group.groupRun.id, repository };
  return { database, git, integrator, input, finishWorker, options };
}

/** Simulates remote/local facts, but uses the actual SQLite owner and Git
 * operation journal. No Gateway, HTTP server or external repository is used. */
class StateBackedGit implements ScopedGroupFinalGit {
  readonly remoteMutations = { creates: 0, merges: 0 };
  readonly refs = new Map<string, string>([["main", BASE], ["groups/run-G", GROUP_HEAD], ["groups/run-H", GROUP_HEAD]]);
  crashAfter?: "create" | "merge" | "sync";
  conflicted = false;

  constructor(private readonly database: CollaborationStateDatabase) {}

  observeRemoteRef = vi.fn(async (_repository: GitHubRepositoryFact, ref: string) => ({
    owner: repository.owner, repository: repository.name, ref, sha: this.refs.get(ref),
    status: this.refs.has(ref) ? "present" as const : "missing" as const, observedAt: NOW
  }));

  createGroupFinalPullRequest = vi.fn(async (request: CreateGroupFinalPullRequestRequest) => {
    const store = this.database.operationsForProject("project-1", true);
    const operation = await prepareOperation(store, {
      id: request.operationId, kind: "pull.create", ownerExecutionId: request.execution.id,
      ownershipEpoch: request.ownershipEpoch, expectedHead: request.expectedHead, expectedBase: request.base
    }, { owner: request.execution.id, head: request.expectedHead, base: request.base });
    if (operation.status === "finalized") return operation.remoteFact as unknown as GitHubPullRequestFact;
    this.remoteMutations.creates++;
    const pull: GitHubPullRequestFact = {
      id: `pull-${request.execution.id}`, providerNumber: 20, owner: repository.owner, repository: repository.name,
      htmlUrl: `${repository.htmlUrl}/pull/20`, head: request.execution.executionBranch,
      headSha: request.expectedHead, base: request.base, ownerExecutionId: request.execution.id,
      status: "open", checks: [], observedAt: NOW
    };
    await finalizeOperation(store, operation, { ...pull });
    this.crash("create");
    return pull;
  });

  mergeGroupFinalPullRequest = vi.fn(async (request: MergeGroupFinalPullRequestRequest) => {
    const store = this.database.operationsForProject("project-1", true);
    const operation = await prepareOperation(store, {
      id: request.operationId, kind: "pull.merge", ownerExecutionId: request.execution.id,
      ownershipEpoch: request.ownershipEpoch, expectedHead: request.expectedHead, expectedBase: request.expectedBase
    }, { owner: request.execution.id, number: request.providerNumber, head: request.expectedHead, base: request.expectedBase });
    if (operation.status === "finalized") return operation.remoteFact as unknown as GitHubPullRequestFact;
    this.remoteMutations.merges++;
    const pull: GitHubPullRequestFact = {
      id: `pull-${request.execution.id}`, providerNumber: request.providerNumber,
      owner: repository.owner, repository: repository.name, htmlUrl: `${repository.htmlUrl}/pull/20`,
      head: request.execution.executionBranch, headSha: request.expectedHead, base: request.expectedBase,
      ownerExecutionId: request.execution.id, status: this.conflicted ? "conflicted" : "merged",
      ...(this.conflicted ? {} : { mergeCommitSha: MERGED }), checks: [], observedAt: NOW
    };
    if (!this.conflicted) this.refs.set(request.expectedBase, MERGED);
    await finalizeOperation(store, operation, { ...pull });
    this.crash("merge");
    return pull;
  });

  reconcileGroupFinalPullRequest = vi.fn(async (request: MergeGroupFinalPullRequestRequest) => {
    const store = this.database.operationsForProject("project-1", true);
    await store.assertExecutionOwnership({
      projectId: "project-1", executionId: request.execution.id, ownershipEpoch: request.ownershipEpoch,
      expectedBranch: request.execution.executionBranch, operation: "provider.reconcile_merged",
      providerNumber: request.providerNumber, expectedHeadSha: request.expectedHead,
      expectedBase: request.expectedBase, expectedMergeCommitSha: request.expectedMergeCommitSha
    });
    this.crash("sync");
    const synchronization: RemoteMergeSyncFact = {
      projectId: "project-1", operationId: request.operationId,
      targetBranch: request.expectedBase as "main" | `groups/${string}`,
      temporaryRef: `refs/openfars/reconcile/${request.operationId}`,
      expectedSourceHead: request.expectedHead, mergeCommitSha: request.expectedMergeCommitSha!,
      remoteHead: MERGED, localHeadBefore: BASE, localHeadAfter: MERGED, status: "synchronized", observedAt: NOW
    };
    await store.recordMergedSynchronization({
      projectId: "project-1", executionId: request.execution.id, ownershipEpoch: request.ownershipEpoch,
      providerNumber: request.providerNumber, expectedHead: request.expectedHead, expectedBase: request.expectedBase,
      expectedMergeCommitSha: request.expectedMergeCommitSha!, synchronization
    });
    const merge = this.database.projectState("project-1").operations.find((item) => item.id === `${request.execution.id}-merge`)!;
    return { ...(merge.remoteFact as unknown as GitHubPullRequestFact), localSynchronization: synchronization };
  });

  private crash(boundary: "create" | "merge" | "sync") {
    if (this.crashAfter === boundary) {
      this.crashAfter = undefined;
      throw new Error(`simulated crash after ${boundary}`);
    }
  }
}

describe("scoped canonical group final integration", () => {
  it("gates publishing on Finish, merges into main, and leaves outer routing explicitly pending", async () => {
    const { database, git, integrator, input, finishWorker } = await fixture();
    await expect(integrator.integrate(input)).rejects.toThrow(/unfinished or failed/);
    expect(git.observeRemoteRef).not.toHaveBeenCalled();
    finishWorker();
    const result = await integrator.integrate(input);
    expect(result).toMatchObject({ status: "completed", completion: { groupRun: { status: "completed" } } });
    expect(git.createGroupFinalPullRequest).toHaveBeenCalledWith(expect.objectContaining({
      base: "main", execution: {
        id: "group-final-run-G", groupRunId: "run-G", ownershipEpoch: 1,
        executionBranch: "groups/run-G", purpose: "group-final-integration"
      }
    }));
    expect(database.projectState("project-1").activeNodeRunId).toBe("node-G");
    expect(database.projectState("project-1").scopedExecutions).toHaveLength(1);
    expect(database.projectState("project-1").scopedFinalIntegrations).toEqual([
      expect.objectContaining({ id: "group-final-run-G", status: "completed", integrationTarget: "main" })
    ]);
    expect(database.laneAvailability("project-1").every((lane) => lane.occupied === 0)).toBe(true);
    expect(await integrator.integrate(input)).toMatchObject({ status: "completed", completion: { replay: true } });
    expect(git.remoteMutations).toEqual({ creates: 1, merges: 1 });
  });

  async function leaderCompletionFixture({ nested = false, returnWithoutMerge = false, restartBeforeDecision = false } = {}) {
    const setup = await fixture(nested);
    const { git, integrator, input, finishWorker, options } = setup;
    let database = setup.database;
    const { groupRunId } = input;
    finishWorker();
    const first = database.claimScopedLeaderTurn({ projectId: "project-1", groupRunId, agentId: "main",
      invocationId: "leader-integrate", runtimePath: join(options.databasePath, "runtime", "leader-integrate") })!;
    database.markScopedLeaderOpened({ projectId: "project-1", groupRunId, agentId: "main", invocationId: "leader-integrate",
      coordinatorEpoch: first.coordinatorEpoch });
    const finish = (callId: string, invocationId: string, epoch: number) => ({ projectId: "project-1", agent: "main", invocationId,
      callId, stateVersion: epoch, capabilityHash: "a".repeat(64), receivedAt: NOW,
      action: { tool: "finish_task" as const, summary: "Leader finished its management task" } });
    database.recordScopedLeaderTaskCompletion({ projectId: "project-1", groupRunId, agentId: "main", invocationId: "leader-integrate",
      coordinatorEpoch: first.coordinatorEpoch, envelope: finish("finish-integrate", "leader-integrate", first.coordinatorEpoch) });
    // Even the current Leader's own finish is not a returned final integration.
    expect(() => database.revalidateScopedLeaderAction({ projectId: "project-1", groupRunId, agentId: "main", invocationId: "leader-integrate",
      coordinatorEpoch: first.coordinatorEpoch, envelope: { ...finish("premature-complete", "leader-integrate", first.coordinatorEpoch),
        action: { tool: "complete_group", groupRunId, coordinatorEpoch: first.coordinatorEpoch, output: "Not yet integrated" } } })).toThrow(/returned final integration/);
    database.acceptScopedLeaderAction({ projectId: "project-1", groupRunId, agentId: "main", invocationId: "leader-integrate",
      coordinatorEpoch: first.coordinatorEpoch, residentStopConfirmed: true, envelope: { projectId: "project-1", agent: "main", invocationId: "leader-integrate",
        callId: "request-final", stateVersion: first.coordinatorEpoch, capabilityHash: "a".repeat(64), receivedAt: NOW,
        action: { tool: "request_group_integration", groupRunId, coordinatorEpoch: first.coordinatorEpoch, integrationOwnerAgentId: "worker" } } });
    database.releaseScopedLeaderTurn({ projectId: "project-1", groupRunId, agentId: "main", invocationId: "leader-integrate",
      coordinatorEpoch: first.coordinatorEpoch, residentStopConfirmed: true });
    const finalIntegrator = returnWithoutMerge ? new ScopedGroupFinalIntegrator(database, git, {
      invokeAgent: async (integration) => {
        database.appendEvent({ projectId: input.projectId, agentId: "worker", invocationId: "final-delivery",
          type: "execution.supervision.finished", payload: { executionId: integration.id, groupRunId,
            ownershipEpoch: integration.ownershipEpoch, outcome: "exhausted", missing: ["merged pull request"] } });
        return undefined;
      }
    }) : integrator;
    const pending = await finalIntegrator.integrate({ ...input, deferCompletion: true, integrationOwnerAgentId: "worker" });
    expect(pending.status).toBe("awaiting_completion");
    expect(database.scopedGroupRun("project-1", groupRunId)?.status).toBe("integrating");
    expect(database.scopedFinalIntegration("project-1", groupRunId)?.status).toBe("integrating");
    expect(database.projectState("project-1").activeNodeRunId).toBe("node-G");
    if (restartBeforeDecision) {
      database.close();
      database = CollaborationStateDatabase.open(options);
      databases.push(database);
    }
    const second = database.claimScopedLeaderTurn({ projectId: "project-1", groupRunId, agentId: "main",
      invocationId: "leader-complete", runtimePath: join(options.databasePath, "runtime", "leader-complete") })!;
    database.markScopedLeaderOpened({ projectId: "project-1", groupRunId, agentId: "main", invocationId: "leader-complete",
      coordinatorEpoch: second.coordinatorEpoch });
    const currentAuthority = { projectId: "project-1", groupRunId, agentId: "main", invocationId: "leader-complete",
      coordinatorEpoch: second.coordinatorEpoch };
    const currentComplete = { projectId: "project-1", agent: "main", invocationId: "leader-complete", callId: "complete-final",
      stateVersion: second.coordinatorEpoch, capabilityHash: "b".repeat(64), receivedAt: NOW,
      action: { tool: "complete_group" as const, groupRunId, coordinatorEpoch: second.coordinatorEpoch, output: returnWithoutMerge ? "Reviewed the returned work" : "Final merge verified" } };
    return { database, git, options, currentAuthority, currentComplete,
      integrationEpoch: first.coordinatorEpoch, finishEnvelope: finish("finish-complete", "leader-complete", second.coordinatorEpoch) };
  }

  it("keeps the Leader's completion decision separate from its own task receipt", async () => {
    const { database, currentAuthority, currentComplete, integrationEpoch } = await leaderCompletionFixture();
    // The integration round's finish cannot substitute for this completion
    // round even though both management calls use the same Agent and group.
    const { projectId, groupRunId, agentId, invocationId, coordinatorEpoch } = currentAuthority;
    expect(database.scopedLeaderTaskCompleted(projectId, groupRunId, agentId, "leader-integrate", integrationEpoch)).toBe(true);
    expect(() => database.revalidateScopedLeaderAction({ ...currentAuthority, invocationId: "leader-integrate", envelope: currentComplete })).toThrow();
    database.revalidateScopedLeaderAction({ ...currentAuthority, envelope: currentComplete });
    expect(database.scopedLeaderTaskCompleted(projectId, groupRunId, agentId, invocationId, coordinatorEpoch)).toBe(false);
    expect(database.scopedGroupRun(projectId, groupRunId)?.status).toBe("integrating");
    expect(() => database.completeScopedGroupAfterLeaderDecision({ ...currentAuthority, output: currentComplete.action.output }))
      .toThrow(/accepted complete_group decision/);
  });

  it("commits both completion records once for the Leader's accepted decision", async () => {
    const { database, git, options, currentAuthority, currentComplete, finishEnvelope, integrationEpoch } = await leaderCompletionFixture();
    database.recordScopedLeaderTaskCompletion({ ...currentAuthority, envelope: finishEnvelope });
    expect(() => database.completeScopedGroupAfterLeaderDecision({ ...currentAuthority, output: "Final merge verified" }))
      .toThrow(/accepted complete_group/);
    database.acceptScopedLeaderAction({ ...currentAuthority, residentStopConfirmed: true, envelope: currentComplete });
    const command = { ...currentAuthority, output: currentComplete.action.output, requestId: "scoped-group-complete:run-G:complete-final" };
    expect(() => database.completeScopedGroupAfterLeaderDecision(command)).toThrow(/confirmed resident stop/);
    const previous = database.writerLease(); database.close();
    const next = CollaborationStateDatabase.open({ ...options, instanceId: "instance-b" }); databases.push(next);
    expect(next.writerLease().epoch).toBe(previous.epoch + 1);
    expect(() => next.completeScopedGroupAfterLeaderDecision(command)).toThrow(/confirmed resident stop/);
    expect(() => next.releaseScopedLeaderTurn({ ...currentAuthority, coordinatorEpoch: integrationEpoch, residentStopConfirmed: true })).toThrow(/identity changed/);
    expect(next.scopedGroupRun("project-1", "run-G")?.status).toBe("integrating");
    next.releaseScopedLeaderTurn({ ...currentAuthority, residentStopConfirmed: true });
    const completed = next.completeScopedGroupAfterLeaderDecision(command);
    expect(completed.groupRun.status).toBe("completed");
    expect(next.projectState("project-1").activeNodeRunId).toBe("node-G");
    expect(next.scopedFinalIntegration("project-1", "run-G")?.status).toBe("completed");
    expect(next.completeScopedGroupAfterLeaderDecision(command)).toMatchObject({ replay: true, revision: completed.revision });
    expect(git.remoteMutations).toEqual({ creates: 1, merges: 1 });
  });

  it.each(["merged", "returned"] as const)("replays the same parent successor after a %s child delivery and a restart", async (delivery) => {
    const { database, options, currentAuthority, currentComplete, finishEnvelope } =
      await leaderCompletionFixture({ nested: true, returnWithoutMerge: delivery === "returned", restartBeforeDecision: true });
    const { projectId, groupRunId } = currentAuthority;
    const parentArrivals = database.scopedArrivals("run-G");
    expect(parentArrivals.map(arrival => [arrival.targetNodeId, arrival.status])).toEqual([["G_H", "running"]]);
    expect(Boolean(database.scopedGroupFinalMergeFact(projectId, groupRunId))).toBe(delivery === "merged");

    database.recordScopedLeaderTaskCompletion({ ...currentAuthority, envelope: finishEnvelope });
    database.acceptScopedLeaderAction({ ...currentAuthority, residentStopConfirmed: true, envelope: currentComplete });
    const command = { ...currentAuthority, output: currentComplete.action.output, requestId: `scoped-group-complete:${groupRunId}:${currentComplete.callId}` };
    database.releaseScopedLeaderTurn({ ...currentAuthority, residentStopConfirmed: true });
    const first = database.completeScopedGroupAfterLeaderDecision(command);
    expect(first.parentRoute).toMatchObject({ kind: "activate", activation: { targetNodeId: "G_next", sourceRunId: parentArrivals[0]!.requestId } });
    expect(first).toMatchObject({ replay: false, groupRun: { status: "completed" },
      parentArrival: { status: "completed" }, parentReadyForFinalIntegration: false });
    const event = database.eventByRequestId(projectId, command.requestId)!;
    expect(event.payload.parentRoute).toEqual(first.parentRoute);

    database.close();
    const reopened = CollaborationStateDatabase.open(options);
    databases.push(reopened);
    expect(reopened.completeScopedGroupAfterLeaderDecision(command)).toEqual({ ...first, replay: true });
    expect(reopened.eventByRequestId(projectId, command.requestId)).toEqual(event);
    const successors = reopened.scopedArrivals("run-G").filter(arrival => arrival.sourceRunId === parentArrivals[0]!.requestId);
    expect(successors).toHaveLength(1);
    expect(first.parentRoute).toMatchObject({ activation: { requestId: successors[0]!.requestId } });
    expect(parentArrivals[0]!.pathContext?.pathId).toBeTruthy();
    expect(successors[0]).toMatchObject({ targetNodeId: "G_next", status: "queued", pathContext: parentArrivals[0]!.pathContext });
  });

  it("rejects a different event with the completion request ID even when its output matches", async () => {
    const { database, currentAuthority, currentComplete, finishEnvelope } = await leaderCompletionFixture({ nested: true });
    const { projectId, groupRunId } = currentAuthority;
    database.recordScopedLeaderTaskCompletion({ ...currentAuthority, envelope: finishEnvelope });
    database.acceptScopedLeaderAction({ ...currentAuthority, residentStopConfirmed: true, envelope: currentComplete });
    const output = currentComplete.action.output;
    const requestId = "already-recorded";
    const { event } = database.appendEvent({ projectId, requestId, type: "scoped.management.round.completed", payload: { groupRunId, output } });
    expect(() => database.completeScopedGroupAfterLeaderDecision({ ...currentAuthority, output, requestId }))
      .toThrow(/changed on replay/);
    expect(database.eventByRequestId(projectId, requestId)).toEqual(event);
    expect(database.scopedGroupRun(projectId, groupRunId)?.status).toBe("integrating");
    expect(database.scopedArrivals("run-G").map(arrival => [arrival.targetNodeId, arrival.status])).toEqual([["G_H", "running"]]);
  });

  it("merges a child only into its direct parent before emitting the parent's serial successor", async () => {
    const { database, git, integrator, input, finishWorker } = await fixture(true);
    finishWorker();
    const result = await integrator.integrate(input);
    expect(result).toMatchObject({ status: "completed", completion: {
      groupRun: { id: "run-H", status: "completed", integrationTarget: "groups/run-G" },
      parentArrival: { targetNodeId: "G_H", status: "completed" },
      parentRoute: { kind: "activate", activation: { targetNodeId: "G_next" } }
    } });
    expect(git.createGroupFinalPullRequest.mock.calls[0]![0].base).toBe("groups/run-G");
    expect(git.reconcileGroupFinalPullRequest.mock.calls[0]![0].expectedBase).toBe("groups/run-G");
    expect(database.scopedArrivals("run-G").find((item) => item.targetNodeId === "G_next")?.status).toBe("queued");
    expect(database.scopedGroupRun("project-1", "run-G")?.status).toBe("running");
    expect(git.refs.get("main")).toBe(BASE);
  });

  it("requires a child's valid weak decision before any remote observation or publication", async () => {
    const { database, git, integrator, input, finishWorker } = await fixture(true, true);
    finishWorker();
    await expect(integrator.integrate(input)).rejects.toThrow(/valid route decision/);
    await expect(integrator.integrate({ ...input, selectedWeakTarget: "outside" })).rejects.toThrow();
    expect(git.observeRemoteRef).not.toHaveBeenCalled();
    expect(database.scopedFinalIntegration("project-1", "run-H")).toBeUndefined();
    const claim = database.claimScopedLeaderTurn({ projectId: "project-1", groupRunId: "run-G", agentId: "main",
      invocationId: "parent-route", runtimePath: "/srv/openfars/runtime/invocations/parent-route" })!;
    const authority = { projectId: "project-1", groupRunId: "run-G", agentId: "main", invocationId: "parent-route",
      coordinatorEpoch: claim.coordinatorEpoch };
    database.markScopedLeaderOpened(authority);
    database.recordScopedLeaderTaskCompletion({ ...authority, envelope: { projectId: "project-1", agent: "main", invocationId: "parent-route",
      callId: "own-finish", stateVersion: claim.coordinatorEpoch, capabilityHash: "a".repeat(64), receivedAt: NOW,
      action: { tool: "finish_task", summary: "Parent explicitly finished this routing round" } } });
    database.acceptScopedLeaderAction({ ...authority, sourceArrivalRequestId: database.scopedArrivals("run-G")[0]!.requestId,
      residentStopConfirmed: true, envelope: { projectId: "project-1", agent: "main", invocationId: "parent-route",
        callId: "route", stateVersion: 1, capabilityHash: "a".repeat(64), receivedAt: NOW,
        action: { tool: "route_to_agent", target: "finish", rationale: "Parent scope accepts its child output" } } });
    database.releaseScopedLeaderTurn({ ...authority, residentStopConfirmed: true });
    expect(await integrator.integrate({ ...input, selectedWeakTarget: "finish" }))
      .toMatchObject({ status: "completed", completion: { parentReadyForFinalIntegration: true } });
    expect(database.scopedArrivals("run-G")).toHaveLength(1);
  });

  it("keeps a conflicted final PR integrating and does not complete its parent arrival", async () => {
    const { database, git, integrator, input, finishWorker } = await fixture(true);
    finishWorker();
    git.conflicted = true;
    expect(await integrator.integrate(input)).toMatchObject({ status: "waiting_for_pull", pullRequest: { status: "conflicted" } });
    expect(database.scopedGroupRun("project-1", "run-H")?.status).toBe("integrating");
    expect(database.scopedArrivals("run-G")[0]?.status).toBe("running");
    expect(git.reconcileGroupFinalPullRequest).not.toHaveBeenCalled();
    expect(database.projectState("project-1").scopedPullRequests).toContainEqual(expect.objectContaining({
      ownerExecutionId: "group-final-run-H", head: "groups/run-H", base: "groups/run-G", status: "conflicted"
    }));
    expect(database.projectState("project-1").scopedGroupFinalMerges).toEqual([]);
  });

  it.each(["create", "merge", "sync"] as const)("recovers the %s boundary under a reconciled writer without a second remote mutation", async (boundary) => {
    const { database, git, integrator, input, finishWorker, options } = await fixture();
    finishWorker();
    git.crashAfter = boundary;
    await expect(integrator.integrate(input)).rejects.toThrow(/simulated crash/);
    expect(database.scopedGroupRun("project-1", "run-G")?.status).toBe("integrating");
    expect(database.projectState("project-1").scopedFinalIntegrations).toEqual([
      expect.objectContaining({ id: "group-final-run-G", expectedHeadSha: GROUP_HEAD, status: "integrating" })
    ]);
    expect(database.projectState("project-1").scopedPullRequests).toContainEqual(expect.objectContaining({
      ownerExecutionId: "group-final-run-G", status: boundary === "create" ? "open" : "merged",
      head: "groups/run-G", base: "main"
    }));
    expect(database.projectState("project-1").scopedGroupFinalMerges).toEqual([]);
    const lease = database.writerLease();
    database.close();
    const reopened = CollaborationStateDatabase.open(options);
    databases.push(reopened);
    const resumedGit = new StateBackedGit(reopened);
    expect(reopened.writerLease().epoch).toBeGreaterThan(lease.epoch);
    const resumed = new ScopedGroupFinalIntegrator(reopened, resumedGit);
    await expect(resumed.integrate(input)).rejects.toThrow(/no longer owns Git writes/);
    reopened.recoverScopedFinalIntegration(input.projectId, input.groupRunId);
    expect(await resumed.integrate(input)).toMatchObject({ status: "completed" });
    expect(git.remoteMutations.creates + resumedGit.remoteMutations.creates).toBe(1);
    expect(git.remoteMutations.merges + resumedGit.remoteMutations.merges).toBe(1);
  });

  it("does not mistake a missing local sync or a changed PR target for completion", async () => {
    const { database, git, integrator, input, finishWorker } = await fixture();
    finishWorker();
    git.reconcileGroupFinalPullRequest.mockImplementationOnce(async (request) => ({
      id: "pull-group-final-run-G", providerNumber: 20, owner: repository.owner, repository: repository.name,
      htmlUrl: `${repository.htmlUrl}/pull/20`, head: request.execution.executionBranch,
      headSha: request.expectedHead, base: request.expectedBase, ownerExecutionId: request.execution.id,
      status: "merged", mergeCommitSha: MERGED, checks: [], observedAt: NOW
    }));
    await expect(integrator.integrate(input)).rejects.toThrow(/confirmed local synchronization/);
    expect(database.scopedGroupRun("project-1", "run-G")?.status).toBe("integrating");
    git.createGroupFinalPullRequest.mockImplementationOnce(async (request) => ({
      id: "wrong-parent", providerNumber: 20, owner: repository.owner, repository: repository.name,
      htmlUrl: `${repository.htmlUrl}/pull/20`, head: request.execution.executionBranch,
      headSha: request.expectedHead, base: "groups/other", ownerExecutionId: request.execution.id,
      status: "open", checks: [], observedAt: NOW
    }));
    await expect(integrator.integrate(input)).rejects.toThrow(/direct parent target/);
    expect(database.projectState("project-1").scopedGroupFinalMerges).toEqual([]);
    expect(await integrator.integrate(input)).toMatchObject({ status: "completed" });
  });

  it("rejects another repository, aborted requests, and concurrent publishers before mutation", async () => {
    const { git, integrator, input, finishWorker } = await fixture();
    finishWorker();
    await expect(integrator.integrate({ ...input, repository: { ...repository, name: "other" } }))
      .rejects.toThrow(/pinned repository/);
    await expect(integrator.integrate({ ...input, signal: AbortSignal.abort(new Error("cancelled")) })).rejects.toThrow(/cancelled/);
    expect(git.observeRemoteRef).not.toHaveBeenCalled();
    let release!: () => void;
    const observed = new Promise<void>((resolve) => { release = resolve; });
    const implementation = git.observeRemoteRef.getMockImplementation()!;
    git.observeRemoteRef.mockImplementationOnce(async (repo, ref) => { await observed; return implementation(repo, ref); });
    const first = integrator.integrate(input);
    await expect(integrator.integrate(input)).rejects.toThrow(/already in progress/);
    release();
    expect(await first).toMatchObject({ status: "completed" });
    expect(git.remoteMutations).toEqual({ creates: 1, merges: 1 });
  });

  it("grants merged-only reconciliation for one exact finalized provider receipt", async () => {
    const { database, git, input, finishWorker } = await fixture();
    finishWorker();
    const { integration } = database.beginScopedFinalIntegration({
      projectId: input.projectId, groupRunId: input.groupRunId, expectedHeadSha: GROUP_HEAD
    });
    const store = database.operationsForProject("project-1", true);
    const assertion = {
      projectId: "project-1", executionId: integration.id, ownershipEpoch: 1,
      expectedBranch: integration.executionBranch, operation: "provider.reconcile_merged" as const,
      providerNumber: 20, expectedHeadSha: GROUP_HEAD, expectedBase: "main", expectedMergeCommitSha: MERGED
    };
    await expect(store.assertExecutionOwnership(assertion)).rejects.toThrow();
    const execution = {
      id: integration.id, groupRunId: input.groupRunId, ownershipEpoch: 1,
      executionBranch: integration.executionBranch, purpose: "group-final-integration" as const
    };
    await git.createGroupFinalPullRequest({
      repository, execution, ownershipEpoch: 1, operationId: "exact-final-create",
      expectedHead: GROUP_HEAD, base: "main", title: "Final integration", body: "Final result"
    });
    await expect(store.assertExecutionOwnership(assertion)).rejects.toThrow();
    await git.mergeGroupFinalPullRequest({
      repository, execution, ownershipEpoch: 1, operationId: "exact-final-merge",
      providerNumber: 20, expectedHead: GROUP_HEAD, expectedBase: "main"
    });
    await expect(store.assertExecutionOwnership(assertion)).resolves.toBeUndefined();
    for (const changed of [
      { providerNumber: 21 }, { expectedHeadSha: SOURCE },
      { expectedBase: "groups/wrong" }, { expectedMergeCommitSha: BASE }
    ]) await expect(store.assertExecutionOwnership({ ...assertion, ...changed })).rejects.toThrow();
    expect(database.scopedGroupRun("project-1", "run-G")?.status).toBe("integrating");
  });

  it.each([
    ["unfinalized", {}],
    ["wrong-owner", { ownerExecutionId: "worker" }],
    ["wrong-head", { head: "groups/other" }],
    ["wrong-base", { base: "groups/other" }],
    ["wrong-sha", { headSha: SOURCE }],
    ["invalid-url", { htmlUrl: "http://example.test/pull/20" }],
    ["invalid-number", { providerNumber: 0 }],
    ["invalid-status", { status: "done" }],
    ["invalid-merge-sha", { mergeCommitSha: "not-a-sha" }]
  ])("withholds a %s final PR journal observation from the read model", async (invalid, changed) => {
    const { database, input, finishWorker } = await fixture();
    finishWorker();
    const { integration } = database.beginScopedFinalIntegration({ ...input, expectedHeadSha: GROUP_HEAD });
    const store = database.operationsForProject("project-1", true);
    const operation = await prepareOperation(store, {
      id: "projection-final-create", kind: "pull.create", ownerExecutionId: integration.id,
      ownershipEpoch: 1, expectedHead: GROUP_HEAD, expectedBase: "main"
    }, { groupRunId: input.groupRunId });
    const remoteFact = {
      id: "pull-final", providerNumber: 20, htmlUrl: `${repository.htmlUrl}/pull/20`,
      ownerExecutionId: integration.id, head: integration.executionBranch, base: "main",
      headSha: GROUP_HEAD, status: "open", observedAt: NOW, ...changed
    };
    if (invalid === "unfinalized") await store.transition({
      id: operation.id, payloadHash: operation.payloadHash, status: "observed", remoteFact
    });
    else await finalizeOperation(store, operation, remoteFact);
    const projection = database.projectState("project-1");
    expect(projection.scopedFinalIntegrations).toEqual([integration]);
    expect(projection.scopedPullRequests).toEqual([]);
    expect(projection.scopedGroupFinalMerges).toEqual([]);
    expect(projection.scopedExecutions).toHaveLength(1);
    expect(projection.operations).toContainEqual(expect.objectContaining({ id: operation.id }));
  });
});
