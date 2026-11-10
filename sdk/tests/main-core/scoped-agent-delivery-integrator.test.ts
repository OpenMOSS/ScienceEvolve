import { DatabaseSync } from "node:sqlite";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CollaborationStateDatabase } from "../../src/core/collaboration-state/store.js";
import { ScopedAgentDeliveryIntegrator, type ScopedAgentDeliveryGit } from "../../src/core/scoped-agent-delivery-integrator.js";
import type { GitHubPullRequestFact, GitHubRepositoryFact, RemoteMergeSyncFact } from "../../src/core/collaboration-git/contracts.js";
import type { CreatePullRequestRequest, MergePullRequestRequest } from "../../src/core/collaboration-git/facade.js";
import { finalizeOperation, prepareOperation } from "../../src/core/collaboration-git/operation.js";
import { COLLABORATION_STATE_SCHEMA_VERSION } from "../../src/core/collaboration-state/contracts.js";

const SOURCE = "a".repeat(40);
const BASE = "b".repeat(40);
const MERGED = "c".repeat(40);
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

async function fixture(options: { nested?: boolean; weak?: boolean; unreported?: boolean } = {}) {
  const root = await mkdtemp(join(tmpdir(), "openfars-scoped-delivery-"));
  roots.push(root);
  const dbOptions = {
    databasePath: join(root, "collaboration.sqlite"), serviceId: "delivery-test", hostId: "test-host",
    topology: "single-host" as const, instanceId: "instance-a", now: () => 1_000_000
  };
  const database = CollaborationStateDatabase.open(dbOptions);
  databases.push(database);
  database.createProject({
    projectId: "project-1", workflowRevision: 1, workerCapacity: 3,
    git: { enabled: true, status: "ready", repository: {
      owner: repository.owner, name: repository.name, htmlUrl: repository.htmlUrl,
      private: true, defaultBranch: "main", localPath: join(root, "workspace")
    } },
    workflowSnapshot: {
      schemaVersion: 3, agents: ["main", "worker", "other", "next"].map((name) => ({ name })),
      collaborations: [{ id: "G" }, ...(options.nested ? [{ id: "H" }] : [])],
      scopedWorkflow: { schemaVersion: 1, rootAgentIds: ["main"], groups: [{
        id: "G", leaderAgentId: "main", allowLeaderReconfiguration: false,
        workflow: {
          nodes: [{ kind: "agent", nodeId: "G_worker", agentId: "worker" },
            { kind: "agent", nodeId: "G_other", agentId: "other" },
            ...(options.nested ? [{ kind: "collaboration", nodeId: "G_H", groupId: "H" }]
              : [{ kind: "agent", nodeId: "G_next", agentId: "next" }])],
          input: { source: "input", edges: [
            { kind: "parallel", target: options.nested ? "G_H" : "G_worker" },
            { kind: "parallel", target: "G_other" }
          ] },
          routes: {
            G_worker: options.weak ? [{ kind: "weak", target: "G_next" }, { kind: "weak", target: "finish" }]
              : [{ kind: "strong", target: options.nested ? "finish" : "G_next" }],
            G_other: [{ kind: "strong", target: "G_worker" }],
            ...(options.nested ? { G_H: [{ kind: "strong", target: "finish" }] }
              : { G_next: [{ kind: "strong", target: "finish" }] })
          }
        }
      }, ...(options.nested ? [{
        id: "H", parentGroupId: "G", leaderAgentId: "main", allowLeaderReconfiguration: false,
        workflow: {
          nodes: [{ kind: "agent", nodeId: "H_worker", agentId: "worker" }],
          input: { source: "input", edges: [{ kind: "parallel", target: "H_worker" }] },
          routes: { H_worker: [{ kind: "strong", target: "finish" }] }
        }
      }] : [])] }
    }
  });
  const parent = database.activateScopedGroup({
    projectId: "project-1", groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G",
    workflowRevision: 1, baseCommit: BASE,
    outer: { nodeRunId: "node-G", inputSnapshotRef: "input:project", activatedByAgentId: "main" }
  });
  const group = options.nested ? database.activateScopedGroup({
    projectId: "project-1", groupRunId: "run-H", groupId: "H", activationRequestId: parent.arrivals[0]!.requestId,
    workflowRevision: 1, baseCommit: BASE, parentGroupRunId: "run-G", parentArrivalRequestId: parent.arrivals[0]!.requestId
  }) : parent;
  const arrival = group.arrivals[0]!;
  const worker = database.claimScopedAgentArrival({
    projectId: "project-1", arrivalRequestId: arrival.requestId, agentId: "worker", executionId: "exec-worker",
    worktreePath: join(root, "git-worktrees", "agents", "worker")
  })!.execution;
  if (!options.unreported) database.recordScopedAgentReport({
    projectId: "project-1", executionId: worker.id, ownershipEpoch: 1,
    invocationId: "worker-turn-1", output: "Worker model result", residentTurnCompleted: true,
    selectedWeakTarget: options.weak ? "finish" : undefined
  });
  const git = new StateBackedDeliveryGit(database);
  const integrator = new ScopedAgentDeliveryIntegrator(database, git);
  const input = { projectId: "project-1", executionId: worker.id, ownershipEpoch: 1, expectedHeadSha: SOURCE, repository };
  return { root, database, git, integrator, input, arrival, worker, dbOptions };
}

/** Simulates provider/ref/local-sync facts but exercises real SQLite owners,
 * epochs, queues and journals. No model or external repository is called. */
class StateBackedDeliveryGit implements ScopedAgentDeliveryGit {
  readonly mutations = { creates: 0, merges: 0 };
  crashAfter?: "create" | "merge" | "sync";
  conflicted = false;
  constructor(private readonly database: CollaborationStateDatabase) {}
  observeRemoteRef = vi.fn(async (_repo: GitHubRepositoryFact, ref: string) => ({
    owner: repository.owner, repository: repository.name, ref, sha: SOURCE, status: "present" as const, observedAt: NOW
  }));
  createPullRequest = vi.fn(async (request: CreatePullRequestRequest) => {
    const store = this.database.operationsForProject("project-1", true);
    const operation = await prepareOperation(store, {
      id: request.operationId, kind: "pull.create", ownerExecutionId: request.execution.id,
      ownershipEpoch: request.ownershipEpoch, expectedHead: request.expectedHead, expectedBase: request.base
    }, { head: request.expectedHead, base: request.base, epoch: request.ownershipEpoch });
    if (operation.status === "finalized") return operation.remoteFact as unknown as GitHubPullRequestFact;
    const pull: GitHubPullRequestFact = {
      id: `pull-${request.execution.id}`, providerNumber: 20 + ++this.mutations.creates,
      owner: repository.owner, repository: repository.name, htmlUrl: `${repository.htmlUrl}/pull/21`,
      head: request.execution.executionBranch, headSha: request.expectedHead, base: request.base,
      ownerExecutionId: request.execution.id, status: "open", checks: [], observedAt: NOW
    };
    await finalizeOperation(store, operation, { ...pull });
    this.crash("create");
    return pull;
  });
  mergePullRequest = vi.fn(async (request: MergePullRequestRequest) => {
    const store = this.database.operationsForProject("project-1", true);
    const operation = await prepareOperation(store, {
      id: request.operationId, kind: "pull.merge", ownerExecutionId: request.execution.id,
      ownershipEpoch: request.ownershipEpoch, expectedHead: request.expectedHead, expectedBase: request.expectedBase
    }, { head: request.expectedHead, base: request.expectedBase, number: request.providerNumber });
    if (operation.status === "finalized") return operation.remoteFact as unknown as GitHubPullRequestFact;
    this.mutations.merges++;
    const pull: GitHubPullRequestFact = {
      id: `pull-${request.execution.id}`, providerNumber: request.providerNumber,
      owner: repository.owner, repository: repository.name, htmlUrl: `${repository.htmlUrl}/pull/21`,
      head: request.execution.executionBranch, headSha: request.expectedHead, base: request.expectedBase,
      ownerExecutionId: request.execution.id, status: this.conflicted ? "conflicted" : "merged",
      ...(this.conflicted ? {} : { mergeCommitSha: MERGED }), checks: [], observedAt: NOW
    };
    await finalizeOperation(store, operation, { ...pull });
    this.crash("merge");
    return pull;
  });
  reconcileMergedPullRequest = vi.fn(async (request: MergePullRequestRequest) => {
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
      targetBranch: request.expectedBase as `groups/${string}`, temporaryRef: `refs/openfars/reconcile/${request.operationId}`,
      expectedSourceHead: request.expectedHead, mergeCommitSha: request.expectedMergeCommitSha!,
      remoteHead: MERGED, localHeadBefore: BASE, localHeadAfter: MERGED, status: "synchronized", observedAt: NOW
    };
    await store.recordMergedSynchronization({
      projectId: "project-1", executionId: request.execution.id, ownershipEpoch: request.ownershipEpoch,
      providerNumber: request.providerNumber, expectedHead: request.expectedHead, expectedBase: request.expectedBase,
      expectedMergeCommitSha: request.expectedMergeCommitSha!, synchronization
    });
    const merge = this.database.projectState("project-1").operations.find((op) =>
      op.kind === "pull.merge" && op.ownerExecutionId === request.execution.id && op.ownershipEpoch === request.ownershipEpoch)!;
    return { ...(merge.remoteFact as unknown as GitHubPullRequestFact), localSynchronization: synchronization };
  });
  private crash(boundary: "create" | "merge" | "sync") {
    if (this.crashAfter === boundary) { this.crashAfter = undefined; throw new Error(`crash after ${boundary}`); }
  }
}

describe("scoped Agent PR delivery integration", () => {
  it("requires a durable native-turn report before any delivery observation or PR", async () => {
    const { database, git, integrator, input } = await fixture({ unreported: true });
    await expect(integrator.integrate(input)).rejects.toThrow(/persisted model report/);
    expect(git.observeRemoteRef).not.toHaveBeenCalled();
    expect(database.scopedExecution(input.projectId, input.executionId)?.status).toBe("running");
    expect(() => database.bindScopedAgentReportHead({
      projectId: input.projectId, executionId: input.executionId, ownershipEpoch: 1, headSha: SOURCE
    })).toThrow(/persisted model report/);
  });

  it("does not create or merge a PR when Agent-owned Git delivery has no Agent PR fact", async () => {
    const { database, git, input, worker } = await fixture();
    const report = database.scopedAgentReport(input.projectId, input.executionId, input.ownershipEpoch)!;
    database.bindScopedAgentReportHead({ ...input, headSha: SOURCE });
    const integrator = new ScopedAgentDeliveryIntegrator(database, git, { agentOwnsGit: true });
    expect(await integrator.integrate(input)).toMatchObject({ status: "completed", completion: {
      execution: { status: "completed" }, route: { kind: "activate", activation: { targetNodeId: "G_next" } }
    } });
    expect(database.projectState(input.projectId).scopedAgentMerges).toEqual([]);
    expect(git.createPullRequest).not.toHaveBeenCalled();
    expect(git.mergePullRequest).not.toHaveBeenCalled();
    expect(database.scopedExecution(input.projectId, worker.id)?.status).toBe("completed");
    expect(report.headSha).toBeUndefined();
  });

  it("records one immutable native result, keeps the Agent slot, and binds its pushed head only once", async () => {
    const { database, input, worker } = await fixture({ unreported: true });
    const request = {
      projectId: input.projectId, executionId: input.executionId, ownershipEpoch: 1,
      invocationId: "native-report", output: "The model completed its work", residentTurnCompleted: true as const
    };
    expect(() => database.recordScopedAgentReport({ ...request, residentTurnCompleted: false as true }))
      .toThrow(/native turn-end proof/);
    expect(database.scopedAgentReport(input.projectId, input.executionId, 1)).toBeUndefined();
    const recorded = database.recordScopedAgentReport(request);
    expect(database.scopedExecution(input.projectId, input.executionId)?.status).toBe("integrating");
    expect(database.scopedArrivals(worker.groupRunId)[0]?.status).toBe("integrating");
    expect(database.recordScopedAgentReport(request)).toMatchObject({ replay: true, revision: recorded.revision });
    for (const changed of [{ output: "Different work" }, { invocationId: "different-turn" }, { selectedWeakTarget: "finish" }]) {
      expect(() => database.recordScopedAgentReport({ ...request, ...changed })).toThrow(/changed on replay/);
    }
    const bound = database.bindScopedAgentReportHead({ ...input, headSha: SOURCE });
    expect(bound.report).toMatchObject({ headSha: SOURCE, output: request.output });
    expect(database.bindScopedAgentReportHead({ ...input, headSha: SOURCE })).toMatchObject({ replay: true, revision: bound.revision });
    expect(() => database.bindScopedAgentReportHead({ ...input, headSha: BASE })).toThrow(/head changed/);
    const store = database.operationsForProject(input.projectId, true);
    for (const operation of ["checkpoint", "worktree.create", "merge.prepare", "merge.integrate"] as const) {
      await expect(store.assertExecutionOwnership({
        projectId: input.projectId, executionId: worker.id, ownershipEpoch: 1,
        expectedBranch: worker.executionBranch, operation
      })).rejects.toThrow();
    }
    await expect(store.assertExecutionOwnership({
      projectId: input.projectId, executionId: worker.id, ownershipEpoch: 1,
      expectedBranch: worker.executionBranch, operation: "provider.mutate"
    })).resolves.toBeUndefined();
    for (const kind of ["pull.create", "git.push"] as const) await expect(store.prepare({
      id: `changed-report-${kind}`, kind, payloadHash: "hash", status: "prepared", ownerExecutionId: worker.id,
      ownershipEpoch: 1, expectedHead: BASE, expectedBase: kind === "git.push" ? worker.executionBranch : "groups/run-G"
    })).rejects.toThrow(/report/);
    expect(database.projectState(input.projectId).scopedAgentReports).toEqual([bound.report]);
    expect(database.projectState(input.projectId).scopedAgentMerges).toEqual([]);
  });

  it("rejects a second Agent using an already attributed report invocation without changing its state", async () => {
    const { root, database, input } = await fixture();
    const other = database.scopedArrivals("run-G").find((item) => item.agentId === "other")!;
    database.claimScopedAgentArrival({
      projectId: input.projectId, arrivalRequestId: other.requestId, agentId: "other", executionId: "exec-other",
      worktreePath: join(root, "git-worktrees", "agents", "other")
    });
    expect(() => database.recordScopedAgentReport({
      projectId: input.projectId, executionId: "exec-other", ownershipEpoch: 1, invocationId: "worker-turn-1",
      output: "Another Agent's result", residentTurnCompleted: true
    })).toThrow(/invocation already belongs/);
    expect(database.scopedExecution(input.projectId, "exec-other")?.status).toBe("running");
    expect(database.scopedAgentReport(input.projectId, "exec-other", 1)).toBeUndefined();
  });

  it("retains a prior-writer report as evidence without granting the replacement writer Git authority", async () => {
    const { database, input, worker, dbOptions } = await fixture();
    const report = database.bindScopedAgentReportHead({ ...input, headSha: SOURCE }).report;
    database.relinquishWriterLease();
    database.close();
    const reopened = CollaborationStateDatabase.open({ ...dbOptions, instanceId: "instance-b" });
    databases.push(reopened);
    expect(reopened.scopedAgentReport(input.projectId, input.executionId, 1)).toEqual(report);
    const git = new StateBackedDeliveryGit(reopened);
    await expect(new ScopedAgentDeliveryIntegrator(reopened, git).integrate(input)).rejects.toThrow();
    expect(git.observeRemoteRef).not.toHaveBeenCalled();
    await expect(reopened.operationsForProject(input.projectId, true).assertExecutionOwnership({
      projectId: input.projectId, executionId: worker.id, ownershipEpoch: 1,
      expectedBranch: worker.executionBranch, operation: "provider.mutate"
    })).rejects.toThrow();
    expect(reopened.scopedExecution(input.projectId, input.executionId)?.status).toBe("integrating");
  });

  it("migrates v10 report storage only under the exact live writer lease, without fabricating historical reports", async () => {
    const { database, input, dbOptions } = await fixture({ unreported: true });
    const lease = database.writerLease();
    database.close();
    const old = new DatabaseSync(dbOptions.databasePath);
    old.exec("DROP TABLE scoped_agent_reports; UPDATE collaboration_state_meta SET schema_version = 10 WHERE singleton = 1");
    old.close();
    expect(() => CollaborationStateDatabase.open({ ...dbOptions, instanceId: "other-instance" })).toThrow();
    const unchanged = new DatabaseSync(dbOptions.databasePath, { readOnly: true });
    expect(unchanged.prepare("SELECT schema_version FROM collaboration_state_meta").get()).toMatchObject({ schema_version: 10 });
    expect(unchanged.prepare("SELECT name FROM sqlite_schema WHERE name = 'scoped_agent_reports'").get()).toBeUndefined();
    unchanged.close();
    const migrated = CollaborationStateDatabase.open({ ...dbOptions, writerLease: lease });
    databases.push(migrated);
    expect(migrated.verifyHealth().schemaVersion).toBe(COLLABORATION_STATE_SCHEMA_VERSION);
    expect(migrated.scopedAgentReport(input.projectId, input.executionId, 1)).toBeUndefined();
    expect(migrated.scopedExecution(input.projectId, input.executionId)?.status).toBe("running");
    const inspection = new DatabaseSync(dbOptions.databasePath, { readOnly: true });
    expect(inspection.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
    inspection.close();
  });

  it("synchronizes into the direct group before releasing the serial successor, and replays without mutation", async () => {
    const { database, git, integrator, input } = await fixture();
    const result = await integrator.integrate(input);
    expect(result).toMatchObject({ status: "completed", completion: {
      execution: { status: "completed" }, route: { kind: "activate", activation: { targetNodeId: "G_next" } }
    } });
    expect(git.createPullRequest).toHaveBeenCalledWith(expect.objectContaining({ base: "groups/run-G" }));
    expect(git.reconcileMergedPullRequest).toHaveBeenCalledWith(expect.objectContaining({ expectedBase: "groups/run-G" }));
    expect(database.scopedArrivals("run-G").find((item) => item.targetNodeId === "G_next")?.status).toBe("queued");
    expect(await integrator.integrate(input)).toMatchObject({ status: "completed", completion: { replay: true } });
    expect(git.mutations).toEqual({ creates: 1, merges: 1 });
    await expect(integrator.integrate({ ...input, expectedHeadSha: BASE })).rejects.toThrow(/matching head/);
    expect(database.projectState("project-1").activeNodeRunId).toBe("node-G");
  });

  it("delivers a nested Worker only into its child group, leaving its parent arrival unfinished", async () => {
    const { database, git, integrator, input } = await fixture({ nested: true });
    expect(await integrator.integrate(input)).toMatchObject({ status: "completed", completion: { readyForFinalIntegration: true } });
    expect(git.createPullRequest.mock.calls[0]![0].base).toBe("groups/run-H");
    expect(database.scopedArrivals("run-G")[0]?.status).toBe("running");
    expect(database.projectState("project-1").scopedGroupFinalMerges).toEqual([]);
  });

  it("validates weak decisions before any provider observation and preserves the selected Finish on replay", async () => {
    const { git, integrator, input } = await fixture({ weak: true });
    await expect(integrator.integrate(input)).rejects.toThrow(/valid route decision/);
    await expect(integrator.integrate({ ...input, selectedWeakTarget: "outside" })).rejects.toThrow();
    expect(git.observeRemoteRef).not.toHaveBeenCalled();
    expect(await integrator.integrate({ ...input, selectedWeakTarget: "finish" })).toMatchObject({ status: "completed" });
    expect(await integrator.integrate({ ...input, selectedWeakTarget: "finish" })).toMatchObject({ completion: { replay: true } });
    await expect(integrator.integrate({ ...input, selectedWeakTarget: "G_next" })).rejects.toThrow(/persisted report head or route/);
  });

  it("holds the busy Agent's FIFO slot while a different parallel Agent completes", async () => {
    const { root, database, git, integrator, input, worker } = await fixture();
    const other = database.scopedArrivals("run-G").find((item) => item.agentId === "other")!;
    database.claimScopedAgentArrival({
      projectId: input.projectId, arrivalRequestId: other.requestId, agentId: "other", executionId: "exec-other",
      worktreePath: join(root, "git-worktrees", "agents", "other")
    });
    database.recordScopedAgentReport({
      projectId: input.projectId, executionId: "exec-other", ownershipEpoch: 1, invocationId: "other-turn-1",
      output: "Other result", residentTurnCompleted: true
    });
    await integrator.integrate({ ...input, executionId: "exec-other" });
    const queued = database.scopedArrivals("run-G").find((item) => item.agentId === "worker" && item.status === "queued")!;
    const nextClaim = { projectId: input.projectId, arrivalRequestId: queued.requestId, agentId: "worker",
      executionId: "exec-worker-next", worktreePath: worker.worktreePath };
    expect(database.claimScopedAgentArrival(nextClaim)).toBeUndefined();
    git.conflicted = true;
    expect(await integrator.integrate(input)).toMatchObject({ status: "waiting_for_pull", pullRequest: { status: "conflicted" } });
    expect(database.claimScopedAgentArrival(nextClaim)).toBeUndefined();
    expect(database.projectState("project-1").scopedAgentMerges).toHaveLength(1);
    expect(database.laneAvailability("project-1").find((lane) => lane.lane === "worker")?.occupied).toBe(1);
  });

  it.each(["create", "merge", "sync"] as const)("replays the %s crash boundary without a duplicate provider mutation", async (boundary) => {
    const { database, git, integrator, input, dbOptions } = await fixture();
    git.crashAfter = boundary;
    await expect(integrator.integrate(input)).rejects.toThrow(/crash after/);
    expect(database.scopedArrivals("run-G").find((item) => item.targetNodeId === "G_next")).toBeUndefined();
    expect(database.scopedAgentReport(input.projectId, input.executionId, 1)).toMatchObject({
      output: "Worker model result", headSha: SOURCE, invocationId: "worker-turn-1"
    });
    const lease = database.writerLease();
    database.close();
    const reopened = CollaborationStateDatabase.open({ ...dbOptions, writerLease: lease });
    databases.push(reopened);
    const resumedGit = new StateBackedDeliveryGit(reopened);
    expect(await new ScopedAgentDeliveryIntegrator(reopened, resumedGit).integrate(input)).toMatchObject({ status: "completed" });
    expect(git.mutations.creates + resumedGit.mutations.creates).toBe(1);
    expect(git.mutations.merges + resumedGit.mutations.merges).toBe(1);
  });

  it("does not release the queue on missing sync or a changed PR identity", async () => {
    const { database, git, integrator, input } = await fixture();
    git.reconcileMergedPullRequest.mockImplementationOnce(async (request) => ({
      id: `pull-${request.execution.id}`, providerNumber: request.providerNumber, owner: repository.owner,
      repository: repository.name, htmlUrl: `${repository.htmlUrl}/pull/21`, head: request.execution.executionBranch,
      headSha: SOURCE, base: request.expectedBase, ownerExecutionId: request.execution.id,
      status: "merged", mergeCommitSha: MERGED, checks: [], observedAt: NOW
    }));
    await expect(integrator.integrate(input)).rejects.toThrow(/confirmed local synchronization/);
    expect(database.scopedExecution(input.projectId, input.executionId)?.status).toBe("integrating");
    const reconcile = git.reconcileMergedPullRequest.getMockImplementation()!;
    git.reconcileMergedPullRequest.mockImplementationOnce(async (request) => ({ ...await reconcile(request), providerNumber: 99 }));
    await expect(integrator.integrate(input)).rejects.toThrow(/same PR/);
    expect(database.projectState("project-1").scopedAgentMerges).toEqual([]);
    expect(await integrator.integrate(input)).toMatchObject({ status: "completed" });
  });

  it("requires a matching finalized member merge receipt for narrow reconciliation and rejects cross-scope PR journals", async () => {
    const { database, git, input, worker } = await fixture();
    const store = database.operationsForProject(input.projectId, true);
    const assertion = {
      projectId: input.projectId, executionId: worker.id, ownershipEpoch: 1,
      expectedBranch: worker.executionBranch, operation: "provider.reconcile_merged" as const,
      providerNumber: 21, expectedHeadSha: SOURCE, expectedBase: "groups/run-G", expectedMergeCommitSha: MERGED
    };
    await expect(store.assertExecutionOwnership(assertion)).rejects.toThrow();
    for (const base of ["main", "groups/run-H"]) await expect(store.prepare({
      id: `wrong-base-${base}`, kind: "pull.create", status: "prepared", payloadHash: "hash",
      ownerExecutionId: worker.id, ownershipEpoch: 1, expectedHead: SOURCE, expectedBase: base
    })).rejects.toThrow(/direct group/);
    const authority = { ...worker, purpose: "delivery" as const };
    const pull = await git.createPullRequest({
      repository, execution: authority, ownershipEpoch: 1, operationId: "receipt-create",
      expectedHead: SOURCE, base: "groups/run-G", title: "Delivery", body: "Result"
    });
    await expect(store.assertExecutionOwnership(assertion)).rejects.toThrow();
    await git.mergePullRequest({
      repository, execution: authority, ownershipEpoch: 1, operationId: "receipt-merge",
      providerNumber: pull.providerNumber, expectedHead: SOURCE, expectedBase: "groups/run-G"
    });
    await expect(store.assertExecutionOwnership(assertion)).resolves.toBeUndefined();
    for (const changed of [{ providerNumber: 22 }, { expectedBase: "main" }, { expectedHeadSha: BASE },
      { expectedMergeCommitSha: BASE }, { ownershipEpoch: 2 }]) {
      await expect(store.assertExecutionOwnership({ ...assertion, ...changed })).rejects.toThrow();
    }
    database.failScopedAgentArrival({
      projectId: input.projectId, arrivalRequestId: worker.arrivalRequestId, executionId: worker.id,
      ownershipEpoch: 1, reason: "Worker stopped", residentStopConfirmed: true
    });
    await expect(store.assertExecutionOwnership(assertion)).rejects.toThrow();
    expect(() => database.retryScopedAgentArrival({
      projectId: input.projectId, arrivalRequestId: worker.arrivalRequestId, executionId: worker.id, failedOwnershipEpoch: 1
    })).toThrow(/reconcile an already merged delivery/);
    expect(database.scopedExecution(input.projectId, input.executionId)).toMatchObject({ status: "failed", ownershipEpoch: 1 });
  });

  it("keeps a failed epoch fenced and retries the same execution, Agent and directory at a fresh epoch", async () => {
    const { database, git, integrator, input, worker } = await fixture();
    database.failScopedAgentArrival({
      projectId: input.projectId, arrivalRequestId: worker.arrivalRequestId, executionId: worker.id,
      ownershipEpoch: 1, reason: "Worker failed", residentStopConfirmed: true
    });
    await expect(integrator.integrate(input)).rejects.toThrow();
    expect(git.observeRemoteRef).not.toHaveBeenCalled();
    const retry = database.retryScopedAgentArrival({
      projectId: input.projectId, arrivalRequestId: worker.arrivalRequestId, executionId: worker.id, failedOwnershipEpoch: 1
    })!;
    expect(retry.execution).toMatchObject({ id: worker.id, agentId: worker.agentId, worktreePath: worker.worktreePath, ownershipEpoch: 2 });
    database.recordScopedAgentReport({
      projectId: input.projectId, executionId: worker.id, ownershipEpoch: 2, invocationId: "worker-turn-2",
      output: "Retried result", residentTurnCompleted: true
    });
    await expect(integrator.integrate(input)).rejects.toThrow(/stale/);
    expect(await integrator.integrate({ ...input, ownershipEpoch: 2 })).toMatchObject({ status: "completed" });
    expect(git.createPullRequest.mock.calls[0]![0].operationId).toContain("epoch-2");
    expect(database.projectState("project-1").scopedExecutions).toHaveLength(1);
    expect(database.projectState("project-1").scopedAgentReports).toEqual([
      expect.objectContaining({ ownershipEpoch: 1, output: "Worker model result" }),
      expect.objectContaining({ ownershipEpoch: 2, output: "Retried result", headSha: SOURCE })
    ]);
  });

  it("rejects wrong repository/head, aborted and concurrent calls before publication", async () => {
    const { git, integrator, input } = await fixture();
    await expect(integrator.integrate({ ...input, repository: { ...repository, name: "other" } })).rejects.toThrow(/pinned repository/);
    await expect(integrator.integrate({ ...input, expectedHeadSha: "not-a-sha" })).rejects.toThrow(/exact reported head/);
    await expect(integrator.integrate({ ...input, signal: AbortSignal.abort(new Error("cancelled")) })).rejects.toThrow(/cancelled/);
    expect(git.observeRemoteRef).not.toHaveBeenCalled();
    await expect(integrator.integrate({ ...input, expectedHeadSha: BASE })).rejects.toThrow(/exact pushed/);
    expect(git.createPullRequest).not.toHaveBeenCalled();
    let release!: () => void;
    const barrier = new Promise<void>((resolve) => { release = resolve; });
    const observe = git.observeRemoteRef.getMockImplementation()!;
    git.observeRemoteRef.mockImplementationOnce(async (repo, ref) => { await barrier; return observe(repo, ref); });
    const first = integrator.integrate(input);
    await expect(integrator.integrate(input)).rejects.toThrow(/already in progress/);
    release();
    expect(await first).toMatchObject({ status: "completed" });
  });
});
