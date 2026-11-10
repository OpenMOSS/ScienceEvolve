import { createHash } from "node:crypto";
import { expect, vi } from "vitest";
import type { CollaborationStateStore } from "../../../src/core/collaboration-state/database-worker.js";
import type { ScopedWorkflowGit } from "../../../src/core/scoped-workflow-runtime.js";
import type { GitHubPullRequestFact, GitHubRepositoryFact, RemoteMergeSyncFact } from "../../../src/core/collaboration-git/contracts.js";
import { CollaborationGitFacade, type CreatePullRequestRequest, type CreateGroupFinalPullRequestRequest, type MergePullRequestRequest, type MergeGroupFinalPullRequestRequest } from "../../../src/core/collaboration-git/facade.js";
import { finalizeOperation, prepareOperation } from "../../../src/core/collaboration-git/operation.js";
const BASE = "b".repeat(40);
const NOW = "2026-09-30T00:00:00.000Z";
const repository: GitHubRepositoryFact = { provider: "github", providerId: 1, owner: "example", name: "openfars", private: true, defaultBranch: "main", htmlUrl: "https://github.com/example/openfars", cloneUrl: "https://github.com/example/openfars.git", observedAt: NOW };

export class ScopedRuntimeGit implements ScopedWorkflowGit {
  readonly refs = new Map<string, string>([["main", BASE]]);
  readonly localRefs = new Map<string, string>([["main", BASE]]);
  readonly pulls = new Map<string, GitHubPullRequestFact>();
  readonly log: Array<{ kind: string; head: string; base?: string; sha?: string }> = [];
  conflictedAgent?: string;
  conflictedFinalGroup?: string;
  failSyncOnceAgent?: string;
  failMergeJournalOnceAgent?: string;
  failPushJournalOnceAgent?: string;
  failFinalSyncOnceGroup?: string;
  failBirthBeforeJournalOnce?: string;
  crashBirthOnce = false;
  beforeSync?: (request: MergePullRequestRequest | MergeGroupFinalPullRequestRequest) => Promise<void>;
  private counter = 0;

  restoreProviderState(previous: ScopedRuntimeGit): void {
    for (const [ref, sha] of previous.refs) this.refs.set(ref, sha);
    for (const [ref, sha] of previous.localRefs) this.localRefs.set(ref, sha);
    for (const [executionId, pull] of previous.pulls) this.pulls.set(executionId, pull);
    this.counter = previous.counter;
    this.log.push(...previous.log);
  }
  private readonly completionHeads = new Map<string, string>();
  readonly checkpointHeads = new Map<string, string>();
  constructor(private readonly database: CollaborationStateStore, private readonly projectId = "p") {}

  observeRemoteRef = vi.fn(async (_repo: GitHubRepositoryFact, ref: string) => ({ owner: "example", repository: "openfars",
    ref, status: this.refs.has(ref) ? "present" as const : "missing" as const, sha: this.refs.get(ref), observedAt: NOW }));

  // Use the actual production reconciliation and S fences. Only the remote
  // observation is controlled here; no test-side journal repair is supplied.
  reconcilePushOperation: CollaborationGitFacade["reconcilePushOperation"] = vi.fn(async (request) => {
    const facade = new CollaborationGitFacade({
      localGit: { projectId: this.projectId } as never,
      provider: { observeRef: (owner: string, name: string, ref: string) =>
        this.observeRemoteRef({ ...repository, owner, name }, ref) } as never,
      operationStore: this.database.operationsForProject(this.projectId, true)
    });
    return facade.reconcilePushOperation(request);
  });

  checkpointGroupCompletion: CollaborationGitFacade["checkpointGroupCompletion"] = vi.fn(async (request) => {
    const receipt = await this.database.scopedGroupCompletionReport(this.projectId, request.groupRunId);
    const head = this.completionHeads.get(request.operationId) ?? createHash("sha1").update(request.expectedHead + receipt.content).digest("hex");
    this.completionHeads.set(request.operationId, head);
    const store = this.database.operationsForProject(this.projectId, true);
    const operation = await prepareOperation(store, { id: `${request.operationId}-push`, kind: "git.push", expectedHead: head, expectedBase: receipt.branch }, { head, content: receipt.content });
    this.refs.set(receipt.branch, head); this.localRefs.set(receipt.branch, head);
    const fact = await this.observeRemoteRef(request.repository, receipt.branch);
    if (operation.status !== "finalized") await finalizeOperation(store, operation, { ...fact });
    return fact;
  });

  beginGroup: ScopedWorkflowGit["beginGroup"] = vi.fn(async (request) => {
    const branch = `groups/${request.groupRunId}`;
    if (this.failBirthBeforeJournalOnce === request.groupRunId || this.failBirthBeforeJournalOnce === "*") {
      this.failBirthBeforeJournalOnce = undefined;
      throw new Error("local group branch creation failed");
    }
    const store = this.database.operationsForProject(this.projectId, true);
    const operation = await prepareOperation(store, { id: request.operationId, kind: "git.push",
      expectedHead: request.baseCommit, expectedBase: branch }, { branch, base: request.baseCommit });
    if (operation.status !== "finalized") {
      expect(this.refs.get(request.integrationTarget!)).toBe(request.baseCommit);
      expect(this.localRefs.get(request.integrationTarget!)).toBe(request.baseCommit);
      this.refs.set(branch, request.baseCommit);
      this.localRefs.set(branch, request.baseCommit);
      this.log.push({ kind: "birth", head: branch, base: request.integrationTarget, sha: request.baseCommit });
      await finalizeOperation(store, operation, { ...(await this.observeRemoteRef(repository, branch)) });
      if (this.crashBirthOnce) { this.crashBirthOnce = false; throw new Error("crash after group branch push"); }
    }
    return { group: { groupRunId: request.groupRunId, branch, baseCommit: request.baseCommit },
      remote: await this.observeRemoteRef(repository, branch) };
  });

  sessionBegin = vi.fn(async (execution, epoch, input) => {
    await this.database.operationsForProject(this.projectId, true).assertExecutionOwnership({ projectId: this.projectId, executionId: execution.id,
      ownershipEpoch: epoch, expectedBranch: execution.executionBranch, operation: "worktree.create" });
    expect(input.kind).toBe("delivery");
    const head = input.base.commitSha!;
    this.localRefs.set(execution.executionBranch, head);
    this.log.push({ kind: "checkout", head: execution.executionBranch, sha: head });
    return { projectId: this.projectId, executionId: execution.id, ownershipEpoch: epoch, branch: execution.executionBranch,
      worktreePath: execution.worktreePath, head, retained: true as const, observedAt: NOW };
  });

  observeRetainedExecution = vi.fn(async (execution, epoch) => {
    await this.database.operationsForProject(this.projectId, true).assertExecutionOwnership({ projectId: this.projectId, executionId: execution.id,
      ownershipEpoch: epoch, expectedBranch: execution.executionBranch, operation: "retained.observe" });
    return { projectId: this.projectId, executionId: execution.id, ownershipEpoch: epoch, branch: execution.executionBranch,
      worktreePath: execution.worktreePath, head: this.localRefs.get(execution.executionBranch)!, retained: true as const, observedAt: NOW };
  });

  observeExecutionWorktree = vi.fn(async (execution, epoch) => ({
    projectId: this.projectId, executionId: execution.id, ownershipEpoch: epoch,
    branch: execution.executionBranch, worktreePath: execution.worktreePath,
    head: this.localRefs.get(execution.executionBranch)!, retained: true as const, observedAt: NOW, pendingPaths: [] as string[]
  }));

  checkpointAndPush = vi.fn(async (request) => {
    const head = this.checkpointHeads.get(request.execution.id) ?? createHash("sha1").update(request.execution.id + request.ownershipEpoch).digest("hex");
    const store = this.database.operationsForProject(this.projectId, true);
    const operation = await prepareOperation(store, { id: request.operationId, kind: "git.push", ownerExecutionId: request.execution.id,
      ownershipEpoch: request.ownershipEpoch, expectedHead: head, expectedBase: request.execution.executionBranch }, { head });
    this.refs.set(request.execution.executionBranch, head);
    this.localRefs.set(request.execution.executionBranch, head);
    if (operation.status !== "finalized") {
      this.log.push({ kind: "push", head: request.execution.executionBranch, sha: head });
      if (request.execution.agentId === this.failPushJournalOnceAgent) {
        this.failPushJournalOnceAgent = undefined;
        await store.transition({ id: operation.id, payloadHash: operation.payloadHash, status: "uncertain",
          remoteFact: { provider: "github", stage: "git.push", reconcileRequired: true } });
        throw new Error("Native stopped after push before its result");
      }
      await finalizeOperation(store, operation, { ...(await this.observeRemoteRef(repository, request.execution.executionBranch)) });
    }
    return { checkpoint: { projectId: this.projectId, executionId: request.execution.id, ownershipEpoch: request.ownershipEpoch,
      branch: request.execution.executionBranch, worktreePath: request.execution.worktreePath, head, commitSha: head,
      changed: true, retained: true as const, observedAt: NOW }, remote: await this.observeRemoteRef(repository, request.execution.executionBranch) };
  });

  prepareConflictResolution: CollaborationGitFacade["prepareConflictResolution"] = vi.fn(async (execution, epoch, source) => {
    await this.database.operationsForProject(this.projectId, true).assertExecutionOwnership({ projectId: this.projectId, executionId: execution.id,
      ownershipEpoch: epoch, expectedBranch: execution.executionBranch, operation: "merge.prepare" });
    const sourceBranch = source.kind === "main" ? "main" : `groups/${source.groupRunId}`;
    expect(this.localRefs.get(sourceBranch)).toBe(source.expectedHead);
    this.log.push({ kind: "repair", head: execution.executionBranch, base: sourceBranch });
    this.conflictedAgent = undefined;
    this.conflictedFinalGroup = undefined;
    return { projectId: this.projectId, executionId: execution.id, executionBranch: execution.executionBranch,
      sourceBranch, sourceHead: source.expectedHead, status: "ready_to_commit", conflictPaths: [], observedAt: NOW };
  });

  createPullRequest = vi.fn((request: CreatePullRequestRequest) => this.create(request));
  createGroupFinalPullRequest = vi.fn((request: CreateGroupFinalPullRequestRequest) => this.create(request));
  private async create(request: CreatePullRequestRequest | CreateGroupFinalPullRequestRequest) {
    const store = this.database.operationsForProject(this.projectId, true);
    const operation = await prepareOperation(store, { id: request.operationId, kind: "pull.create", ownerExecutionId: request.execution.id,
      ownershipEpoch: request.ownershipEpoch, expectedHead: request.expectedHead, expectedBase: request.base }, { head: request.expectedHead, base: request.base });
    if (operation.status === "finalized") return operation.remoteFact as unknown as GitHubPullRequestFact;
    // Match GitHub's canonical head/base discovery: a new Agent call/epoch
    // updates the retained open PR rather than fabricating another PR.
    const existing = this.pulls.get(request.execution.id);
    const retained = existing && !["closed", "merged"].includes(existing.status) && existing.head === request.execution.executionBranch && existing.base === request.base;
    const number = retained ? existing.providerNumber : ++this.counter;
    const pull: GitHubPullRequestFact = { id: `pull-${number}`, providerNumber: number, owner: "example", repository: "openfars",
      htmlUrl: `${repository.htmlUrl}/pull/${number}`, head: request.execution.executionBranch, headSha: request.expectedHead,
      base: request.base, ownerExecutionId: request.execution.id, status: "open", checks: [], observedAt: NOW };
    this.pulls.set(request.execution.id, pull);
    this.log.push({ kind: "create", head: pull.head, base: pull.base });
    await finalizeOperation(store, operation, { ...pull });
    return pull;
  }

  observePullRequest: CollaborationGitFacade["observePullRequest"] = vi.fn(async (request) => {
    const pull = [...this.pulls.values()].find((candidate) => candidate.providerNumber === request.providerNumber &&
      candidate.ownerExecutionId === request.ownerExecutionId);
    return pull;
  });

  mergePullRequest = vi.fn((request: MergePullRequestRequest) => this.merge(request));
  mergeGroupFinalPullRequest = vi.fn((request: MergeGroupFinalPullRequestRequest) => this.merge(request));
  observePullRequestForExecution: CollaborationGitFacade["observePullRequestForExecution"] = vi.fn(async (request) => {
    const pull = this.pulls.get(request.execution.id);
    if (pull && (pull.ownerExecutionId !== request.execution.id || pull.head !== request.execution.executionBranch || pull.base !== request.expectedBase)) throw new Error("Foreign PR discovery");
    return pull;
  });
  closePullRequest: CollaborationGitFacade["closePullRequest"] = vi.fn(async (request) => {
    const store = this.database.operationsForProject(this.projectId, true);
    const operation = await prepareOperation(store, { id: request.operationId, kind: "pull.close", ownerExecutionId: request.execution.id,
      ownershipEpoch: request.ownershipEpoch, expectedHead: request.expectedHead, expectedBase: request.expectedBase }, { providerNumber: request.providerNumber });
    const before = this.pulls.get(request.execution.id)!;
    expect(before.providerNumber).toBe(request.providerNumber); expect(before.headSha).toBe(request.expectedHead); expect(before.base).toBe(request.expectedBase);
    const pull = { ...before, status: before.status === "merged" ? "merged" as const : "closed" as const };
    this.pulls.set(request.execution.id, pull);
    if (operation.status !== "finalized") await finalizeOperation(store, operation, { ...pull });
    this.log.push({ kind: "close", head: pull.head, base: pull.base });
    return pull;
  });
  private async merge(request: MergePullRequestRequest | MergeGroupFinalPullRequestRequest) {
    const store = this.database.operationsForProject(this.projectId, true);
    const operation = await prepareOperation(store, { id: request.operationId, kind: "pull.merge", ownerExecutionId: request.execution.id,
      ownershipEpoch: request.ownershipEpoch, expectedHead: request.expectedHead, expectedBase: request.expectedBase }, { head: request.expectedHead, base: request.expectedBase });
    if (operation.status === "finalized") return operation.remoteFact as unknown as GitHubPullRequestFact;
    const previous = this.pulls.get(request.execution.id)!;
    if (previous.status === "merged") {
      await finalizeOperation(store, operation, { ...previous });
      return previous;
    }
    const conflicted = "agentId" in request.execution ? request.execution.agentId === this.conflictedAgent
      : (await this.database.scopedGroupRun(this.projectId, request.execution.groupRunId))?.groupId === this.conflictedFinalGroup;
    const mergeSha = createHash("sha1").update(request.operationId).digest("hex");
    const pull: GitHubPullRequestFact = { ...previous, status: conflicted ? "conflicted" : "merged",
      ...(conflicted ? {} : { mergeCommitSha: mergeSha }) };
    if (!conflicted) this.refs.set(request.expectedBase, mergeSha);
    this.pulls.set(request.execution.id, pull);
    this.log.push({ kind: "merge", head: pull.head, base: pull.base, sha: pull.mergeCommitSha });
    if ("agentId" in request.execution && request.execution.agentId === this.failMergeJournalOnceAgent) {
      this.failMergeJournalOnceAgent = undefined;
      await store.transition({ id: operation.id, payloadHash: operation.payloadHash, status: "uncertain",
        remoteFact: { provider: "github", stage: "pull.merge", reconcileRequired: true } });
      throw new Error("Native stopped after provider merge before its result");
    }
    await finalizeOperation(store, operation, { ...pull });
    return pull;
  }

  reconcileMergedPullRequest = vi.fn((request: MergePullRequestRequest) => this.sync(request));
  reconcileGroupFinalPullRequest = vi.fn((request: MergeGroupFinalPullRequestRequest) => this.sync(request));
  private async sync(request: MergePullRequestRequest | MergeGroupFinalPullRequestRequest) {
    const store = this.database.operationsForProject(this.projectId, true);
    await store.assertExecutionOwnership({ projectId: this.projectId, executionId: request.execution.id, ownershipEpoch: request.ownershipEpoch,
      expectedBranch: request.execution.executionBranch, operation: "provider.reconcile_merged", providerNumber: request.providerNumber,
      expectedHeadSha: request.expectedHead, expectedBase: request.expectedBase, expectedMergeCommitSha: request.expectedMergeCommitSha });
    await this.beforeSync?.(request);
    const synchronization: RemoteMergeSyncFact = { projectId: this.projectId, operationId: request.operationId,
      targetBranch: request.expectedBase as "main" | `groups/${string}`, temporaryRef: `refs/openfars/reconcile/${request.operationId}`,
      expectedSourceHead: request.expectedHead, mergeCommitSha: request.expectedMergeCommitSha!,
      remoteHead: this.refs.get(request.expectedBase)!, localHeadBefore: this.localRefs.get(request.expectedBase)!,
      localHeadAfter: this.refs.get(request.expectedBase)!, status: "synchronized", observedAt: NOW };
    this.localRefs.set(request.expectedBase, synchronization.localHeadAfter);
    await store.recordMergedSynchronization({ projectId: this.projectId, executionId: request.execution.id, ownershipEpoch: request.ownershipEpoch,
      providerNumber: request.providerNumber, expectedHead: request.expectedHead, expectedBase: request.expectedBase,
      expectedMergeCommitSha: request.expectedMergeCommitSha!, synchronization });
    this.log.push({ kind: "sync", head: request.execution.executionBranch, base: request.expectedBase, sha: synchronization.localHeadAfter });
    if ("agentId" in request.execution && request.execution.agentId === this.failSyncOnceAgent) {
      this.failSyncOnceAgent = undefined;
      throw new Error("crash after exact local synchronization");
    }
    if (!("agentId" in request.execution) &&
      (await this.database.scopedGroupRun(this.projectId, request.execution.groupRunId!))?.groupId === this.failFinalSyncOnceGroup) {
      this.failFinalSyncOnceGroup = undefined;
      throw new Error("crash after child final synchronization");
    }
    return { ...this.pulls.get(request.execution.id)!, localSynchronization: synchronization };
  }
}
