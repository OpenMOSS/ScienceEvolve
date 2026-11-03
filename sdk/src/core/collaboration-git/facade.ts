import type {
  AgentId,
  ExecutionId,
  GroupRunId,
  OperationId,
  OperationRecord
} from "../types.js";
import type {
  CollaborationGitOperationStore,
  ExecutionOwnershipAssertion,
  GitExecutionAuthority,
  GitGroupFinalAuthority,
  GitHubPullRequestFact,
  GitHubRefFact,
  GitHubRepositoryFact,
  LocalCheckpointFact,
  LocalMergeFact,
  LocalWorktreeFact,
  RestrictedWorktreeClosingScope,
  ManagementMemorySnapshot,
  OwnerResolutionFact,
  ReadonlyGitProjection,
  RemoteMergeSyncFact,
  RetainedPushOwner
} from "./contracts.js";
import {
  GitCommandError,
  GitHubAuthorizationError,
  GitHubUncertainResultError,
  GitInputError,
  OperationStoreViolationError
} from "./errors.js";
import { GitHubUserProvider } from "./github-provider.js";
import type { GitInspectionRequest } from "./inspection.js";
import type { GitRevertRequest, HistoricalPullSource } from "./revert.js";
import {
  CollaborationGitInitializer,
  type GitInitializationRequest,
  type GitInitializationResult
} from "./initialization.js";
import {
  LocalCollaborationGitService,
  type CheckedOutMergeTargetAuthority,
  type DeliveryBase
} from "./local-git.js";
import {
  finalizeOperation,
  prepareOperation,
  pushSupersessionProof,
  transitionOperation
} from "./operation.js";
import {
  readonlyGitProjection,
  type ReadonlyProjectionInput
} from "./projection.js";

export interface CollaborationGitFacadeOptions {
  localGit: LocalCollaborationGitService;
  provider: GitHubUserProvider;
  operationStore: CollaborationGitOperationStore;
}

export interface CheckpointAndPushRequest {
  repository: GitHubRepositoryFact;
  execution: GitExecutionAuthority;
  ownershipEpoch: number;
  operationId: OperationId;
  checkpointKind: "checkpoint" | "report" | "conflict-resolution";
  taskId?: string;
  taskTitle?: string;
  reason?: string;
  signal?: AbortSignal;
}

export interface BeginGroupRequest {
  repository: GitHubRepositoryFact;
  groupRunId: GroupRunId;
  baseCommit: string;
  /** Root groups target main; child groups target their direct parent's branch. */
  integrationTarget?: string;
  operationId: OperationId;
  signal?: AbortSignal;
}

export interface MergePullRequestRequest {
  repository: GitHubRepositoryFact;
  execution: GitExecutionAuthority;
  ownershipEpoch: number;
  operationId: OperationId;
  providerNumber: number;
  expectedHead: string;
  expectedBase: string;
  taskId?: string;
  reason?: string;
  expectedMergeCommitSha?: string;
  /** Required only to fast-forward an explicitly unfrozen checked-out group target. */
  checkedOutTarget?: CheckedOutMergeTargetAuthority;
  signal?: AbortSignal;
}

export type MergeGroupFinalPullRequestRequest = Omit<MergePullRequestRequest,
  "execution" | "taskId" | "checkedOutTarget"> & { execution: GitGroupFinalAuthority };

type PullRequestAuthority = GitExecutionAuthority | GitGroupFinalAuthority;
type AuthorizedMergeRequest = MergePullRequestRequest | MergeGroupFinalPullRequestRequest;

export interface CreatePullRequestRequest {
  repository: GitHubRepositoryFact;
  execution: GitExecutionAuthority;
  ownershipEpoch: number;
  operationId: OperationId;
  expectedHead: string;
  base: string;
  title: string;
  body: string;
  signal?: AbortSignal;
}

export type CreateGroupFinalPullRequestRequest = Omit<CreatePullRequestRequest, "execution"> & {
  execution: GitGroupFinalAuthority;
};

export interface SynchronizedPullRequestFact extends GitHubPullRequestFact {
  localSynchronization?: RemoteMergeSyncFact;
}

export interface PushOperationReconciliation {
  status: "confirmed" | "unconfirmed" | "failed" | "superseded";
  operation: OperationRecord;
  /** Current provider observation, separate from the immutable journal receipt. */
  remote?: GitHubRefFact;
  pushOutcome?: "sent" | "uncertain";
  /** Observation receipt only; must not authorize a current-task PR or push. */
  historicalOwner?: RetainedPushOwner;
}

function finalizedRef(operation: OperationRecord): GitHubRefFact | undefined {
  if (operation.status === "superseded") throw new OperationStoreViolationError("Superseded push cannot be republished; inspect its inclusion receipt");
  if (operation.status !== "finalized") return undefined;
  const fact = operation.remoteFact;
  if (
    !fact ||
    typeof fact.owner !== "string" ||
    typeof fact.repository !== "string" ||
    typeof fact.ref !== "string" ||
    fact.status !== "present" ||
    typeof fact.sha !== "string" ||
    typeof fact.observedAt !== "string"
  ) {
    throw new OperationStoreViolationError("Finalized push fact is malformed");
  }
  return {
    owner: fact.owner,
    repository: fact.repository,
    ref: fact.ref,
    status: "present",
    sha: fact.sha,
    observedAt: fact.observedAt
  };
}

/**
 * S-facing orchestration boundary. Callers do not assemble Git/provider
 * transactions themselves; every mutation below is epoch-fenced and uses the
 * injected S-owned OperationStore.
 */
export class CollaborationGitFacade {
  private readonly initializer: CollaborationGitInitializer;

  constructor(private readonly options: CollaborationGitFacadeOptions) {
    this.initializer = new CollaborationGitInitializer(
      options.provider,
      options.localGit,
      options.operationStore
    );
  }

  initialize(request: GitInitializationRequest): Promise<GitInitializationResult> {
    return this.initializer.initialize(request);
  }

  observeRemoteRef(
    repository: GitHubRepositoryFact,
    ref: string,
    signal?: AbortSignal
  ): Promise<GitHubRefFact> {
    return this.options.provider.observeRef(
      repository.owner,
      repository.name,
      ref,
      signal
    );
  }

  /** The owning Agent selects its retained push record, including legacy IDs.
   * Default to observation. Only explicit retry=true re-sends the exact old
   * commit; never checkpoint, select retries, or run this from an exit hook. */
  async reconcilePushOperation(request: {
    repository: GitHubRepositoryFact;
    execution: GitExecutionAuthority;
    ownershipEpoch: number;
    operationId: OperationId;
    retry?: boolean;
    historical?: boolean;
    invocationId?: string;
    signal?: AbortSignal;
  }): Promise<PushOperationReconciliation> {
    const read = this.options.operationStore.recordedOperation;
    if (!read) throw new OperationStoreViolationError("Retained push journal lookup is unavailable");
    if (!request.operationId.trim() || request.operationId.length > 1_024) {
      throw new GitInputError("Retained push operation id is invalid");
    }
    const original = await read.call(this.options.operationStore, request.operationId);
    if (request.historical === true) {
      if (request.retry === true) throw new GitInputError("Historical push observation cannot retry an expired task or ownership epoch");
      const store = this.options.operationStore;
      if (!original || !store.assertRetainedPushObservation || !store.recordRetainedPushObservation) {
        throw new OperationStoreViolationError("Historical push observation authority is unavailable");
      }
      if (request.execution.ownershipEpoch !== request.ownershipEpoch) throw new GitInputError("Historical push caller epoch is stale");
      const observation = { projectId: this.options.localGit.projectId, executionId: request.execution.id,
        ownershipEpoch: request.ownershipEpoch, expectedBranch: request.execution.executionBranch,
        operationId: request.operationId, payloadHash: original.payloadHash,
        ...(request.invocationId ? { invocationId: request.invocationId } : {}) };
      const historicalOwner = await store.assertRetainedPushObservation(observation);
      if (historicalOwner.agentId !== request.execution.agentId) throw new GitInputError("Historical push belongs to another Agent");
      if (original.status === "failed") return { status: "failed", operation: original, historicalOwner };
      if (original.status === "superseded") {
        pushSupersessionProof(original, request.repository);
        return { status: "superseded", operation: original, historicalOwner };
      }
      const remote = await this.observeRemoteRef(request.repository, historicalOwner.executionBranch, request.signal);
      if (remote.owner !== request.repository.owner || remote.repository !== request.repository.name ||
        remote.ref !== historicalOwner.executionBranch) throw new GitInputError("Historical push observation differs from its bound repository and ref");
      const currentOwner = await store.assertRetainedPushObservation(observation);
      if (currentOwner.executionId !== historicalOwner.executionId || currentOwner.ownershipEpoch !== historicalOwner.ownershipEpoch ||
        currentOwner.agentId !== historicalOwner.agentId || currentOwner.executionBranch !== historicalOwner.executionBranch ||
        currentOwner.observationInvocationId !== historicalOwner.observationInvocationId) {
        throw new OperationStoreViolationError("Historical push owner changed during observation");
      }
      const current = await read.call(store, request.operationId);
      if (!current || current.payloadHash !== original.payloadHash || current.expectedHead !== original.expectedHead ||
        current.expectedBase !== original.expectedBase || current.kind !== original.kind ||
        current.ownerExecutionId !== original.ownerExecutionId || current.ownershipEpoch !== original.ownershipEpoch) {
        throw new OperationStoreViolationError("Historical push journal changed its immutable request during observation");
      }
      if (current.status === "failed") return { status: "failed", operation: current, remote, historicalOwner };
      if (current.status === "superseded") {
        pushSupersessionProof(current, request.repository);
        return { status: "superseded", operation: current, remote, historicalOwner };
      }
      if (remote.status !== "present" || remote.sha !== current.expectedHead) {
        return { status: "unconfirmed", operation: current, remote, historicalOwner };
      }
      // Only this explicit Agent call records an exact provider observation.
      // No old write capability, checkpoint, retry or task transition exists.
      const operation = await store.recordRetainedPushObservation({ ...observation, remote });
      return { status: "confirmed", operation, remote, historicalOwner };
    }
    const valid = (operation: OperationRecord | undefined): operation is OperationRecord => Boolean(operation &&
      operation.id === request.operationId && operation.kind === "git.push" &&
      operation.ownerExecutionId === request.execution.id && operation.ownershipEpoch === request.ownershipEpoch &&
      operation.expectedBase === request.execution.executionBranch && /^[0-9a-f]{40}$/i.test(operation.expectedHead ?? ""));
    if (!valid(original)) throw new GitInputError("Retained push record differs from this Agent's exact execution and branch");
    const readCurrent = async () => {
      const current = await read.call(this.options.operationStore, request.operationId);
      if (!valid(current) || current.payloadHash !== original.payloadHash || current.expectedHead !== original.expectedHead) {
        throw new OperationStoreViolationError("Retained push journal changed its immutable request during observation");
      }
      return current;
    };
    await this.assertRemoteAuthority(request.execution, request.ownershipEpoch, request.execution.executionBranch);
    if (original.status === "failed") return { status: "failed", operation: original };
    if (original.status === "superseded") {
      pushSupersessionProof(original, request.repository);
      return { status: "superseded", operation: original };
    }
    let remote = await this.observeRemoteRef(request.repository, request.execution.executionBranch, request.signal);
    if (remote.owner !== request.repository.owner || remote.repository !== request.repository.name ||
      remote.ref !== request.execution.executionBranch) throw new GitInputError("Observed push ref differs from its bound repository and branch");
    let current = await readCurrent();
    if (current.status === "failed") return { status: "failed", operation: current, remote };
    if (current.status === "superseded") {
      pushSupersessionProof(current, request.repository);
      return { status: "superseded", operation: current, remote };
    }
    const store = this.options.operationStore;
    // The Agent selected this exact old operation. A later confirmed push of
    // the same task/ref may settle only inclusion; no push or PR is selected.
    if (["prepared", "observed", "uncertain"].includes(current.status) && remote.status === "present" &&
      remote.sha !== current.expectedHead && store.confirmedPushPublication && store.recordPushSupersession && request.invocationId) {
      const input = { projectId: this.options.localGit.projectId, executionId: request.execution.id,
        ownershipEpoch: request.ownershipEpoch, expectedBranch: request.execution.executionBranch,
        operationId: current.id, payloadHash: current.payloadHash, invocationId: request.invocationId, remote };
      const publication = await store.confirmedPushPublication(input);
      if (publication && await this.options.localGit.canFastForward(current.expectedHead!, remote.sha!, request.signal)) {
        const fresh = await this.observeRemoteRef(request.repository, request.execution.executionBranch, request.signal);
        if (fresh.owner !== remote.owner || fresh.repository !== remote.repository || fresh.ref !== remote.ref ||
          fresh.status !== "present" || fresh.sha !== remote.sha) {
          throw new OperationStoreViolationError("Remote changed during push inclusion observation");
        }
        request.signal?.throwIfAborted();
        await this.assertRemoteAuthority(request.execution, request.ownershipEpoch, request.execution.executionBranch);
        await readCurrent();
        const operation = await store.recordPushSupersession({ ...input, remote: fresh,
          publicationOperationId: publication.id, publicationPayloadHash: publication.payloadHash });
        pushSupersessionProof(operation, request.repository);
        return { status: "superseded", operation, remote: fresh };
      }
    }
    let pushOutcome: PushOperationReconciliation["pushOutcome"];
    if (request.retry === true && current.status !== "finalized" &&
      (remote.status === "missing" || remote.status === "present" && remote.sha !== original.expectedHead)) {
      // This branch is entered only by the Agent's explicit tool argument.
      // No new journal, commit or system-selected work is introduced.
      await this.assertRemoteAuthority(request.execution, request.ownershipEpoch, request.execution.executionBranch);
      if (remote.status === "present" &&
        !await this.options.localGit.canFastForward(remote.sha!, original.expectedHead!, request.signal)) {
        throw new GitInputError("Retained push cannot overwrite a moved remote branch");
      }
      try {
        await this.options.localGit.pushRetainedExecution(request.execution, request.ownershipEpoch,
          original.id, original.expectedHead!, request.signal);
        pushOutcome = "sent";
      } catch (error) {
        const status = gitPushAuthorizationStatus(error);
        if (status) throw new GitHubAuthorizationError(status, "GitHub rejected the Agent's retained push request");
        if (!(error instanceof GitCommandError)) throw error;
        await this.assertRemoteAuthority(request.execution, request.ownershipEpoch, request.execution.executionBranch);
        await transitionOperation(this.options.operationStore, original, { status: "uncertain", remoteFact: {
          provider: "github", ref: request.execution.executionBranch, expectedHead: original.expectedHead,
          reconcileRequired: true
        } });
        pushOutcome = "uncertain";
      }
      remote = await this.observeRemoteRef(request.repository, request.execution.executionBranch, request.signal);
      if (remote.owner !== request.repository.owner || remote.repository !== request.repository.name ||
        remote.ref !== request.execution.executionBranch) throw new GitInputError("Retried push observation differs from its bound repository and branch");
    }
    // User Stop or a new ownership epoch can arrive during provider I/O. The
    // observation does not confer authority to finalize an old journal.
    await this.assertRemoteAuthority(request.execution, request.ownershipEpoch, request.execution.executionBranch);
    current = await readCurrent();
    if (current.status === "failed") return { status: "failed", operation: current, remote, ...(pushOutcome ? { pushOutcome } : {}) };
    if (current.status === "superseded") {
      pushSupersessionProof(current, request.repository);
      return { status: "superseded", operation: current, remote };
    }
    if (remote.status !== "present" || remote.sha !== current.expectedHead) return { status: "unconfirmed", operation: current, remote, ...(pushOutcome ? { pushOutcome } : {}) };
    // Retain finalized receipt timestamps. For a pending original record,
    // transition that exact S entry with its original payload hash only.
    const operation = current.status === "finalized" ? current
      : await finalizeOperation(this.options.operationStore, current, remote as unknown as Record<string, unknown>);
    return { status: "confirmed", operation, remote, ...(pushOutcome ? { pushOutcome } : {}) };
  }

  observePullRequestForExecution(request: {
    repository: GitHubRepositoryFact;
    execution: PullRequestAuthority;
    expectedBase: string;
    expectedHead?: string;
    signal?: AbortSignal;
  }): Promise<GitHubPullRequestFact | undefined> {
    return this.options.provider.observePullRequestForExecution(
      request.repository.owner,
      request.repository.name,
      request.execution.executionBranch,
      request.expectedBase,
      request.execution.id,
      request.signal,
      request.expectedHead
    );
  }

  /** Runtime Finish receipts make even an explicitly all-skipped group deliverable
   * through a real final PR, without misrepresenting any business task as success. */
  async checkpointGroupCompletion(request: { repository: GitHubRepositoryFact; groupRunId: GroupRunId;
    operationId: OperationId; expectedHead: string; signal?: AbortSignal }): Promise<GitHubRefFact> {
    const read = this.options.operationStore.scopedGroupCompletionReport;
    if (!read) throw new OperationStoreViolationError("Scoped Finish receipt authority is unavailable");
    const authority = await read.call(this.options.operationStore, this.options.localGit.projectId, request.groupRunId);
    const head = await this.options.localGit.commitGroupCompletion(request.groupRunId, request.operationId, request.expectedHead, authority.content, request.signal);
    const operation = await prepareOperation(this.options.operationStore, { id: `${request.operationId}-push`, kind: "git.push",
      expectedHead: head, expectedBase: authority.branch }, { repository: request.repository.name, owner: request.repository.owner,
      groupRunId: request.groupRunId, head, content: authority.content });
    const current = await read.call(this.options.operationStore, this.options.localGit.projectId, request.groupRunId);
    if (current.branch !== authority.branch || current.content !== authority.content) throw new GitInputError("Finish receipt changed before push");
    let observed = await this.observeRemoteRef(request.repository, authority.branch, request.signal);
    if (observed.status !== "present" || !observed.sha) throw new GitInputError("Canonical group ref is absent");
    if (observed.sha !== head) {
      if (!await this.options.localGit.canFastForward(observed.sha, head, request.signal)) throw new GitInputError("Finish receipt would overwrite the remote group branch");
      try { await this.options.localGit.pushGroup(request.groupRunId, request.signal); }
      catch (error) {
        const status = gitPushAuthorizationStatus(error);
        if (status) throw new GitHubAuthorizationError(status, "Finish receipt Git push authorization was rejected");
        await transitionOperation(this.options.operationStore, operation, { status: "uncertain", remoteFact: { ref: authority.branch, expectedHead: head } });
      }
      observed = await this.observeRemoteRef(request.repository, authority.branch, request.signal);
    }
    if (observed.status !== "present" || observed.sha !== head) throw new GitHubUncertainResultError(request.operationId, "Finish receipt push requires exact remote confirmation");
    await read.call(this.options.operationStore, this.options.localGit.projectId, request.groupRunId);
    return finalizedRef(operation) ?? this.finalizePush(operation, observed);
  }

  async beginGroup(request: BeginGroupRequest): Promise<{
    group: Awaited<ReturnType<LocalCollaborationGitService["createGroupBranch"]>>;
    remote: GitHubRefFact;
  }> {
    const group = await this.options.localGit.createGroupBranch(
      request.groupRunId,
      request.baseCommit,
      request.signal,
      request.integrationTarget
    );
    const prepared = await prepareOperation(
      this.options.operationStore,
      {
        id: request.operationId,
        kind: "git.push",
        expectedHead: request.baseCommit,
        expectedBase: group.branch
      },
      {
        provider: "github",
        owner: request.repository.owner,
        repository: request.repository.name,
        ref: group.branch,
        groupRunId: request.groupRunId,
        expectedHead: request.baseCommit
      }
    );
    const replay = finalizedRef(prepared);
    if (replay) return { group, remote: replay };
    const before = await this.options.provider.observeRef(
      request.repository.owner,
      request.repository.name,
      group.branch,
      request.signal
    );
    if (before.status === "present") {
      if (before.sha !== request.baseCommit) {
        throw new GitInputError("Remote group branch exists at another commit; force push is forbidden");
      }
      return { group, remote: await this.finalizePush(prepared, before) };
    }
    if (request.integrationTarget) {
      const target = await this.options.provider.observeRef(
        request.repository.owner,
        request.repository.name,
        request.integrationTarget,
        request.signal
      );
      if (target.status !== "present" || target.sha !== request.baseCommit) {
        throw new GitInputError("Group activation base is not the current remote integration target head");
      }
    }
    try {
      const pushed = await this.options.localGit.pushGroup(request.groupRunId, request.signal);
      if (pushed !== request.baseCommit) {
        throw new OperationStoreViolationError("Local group push returned another head");
      }
    } catch (error) {
      const authorizationStatus = gitPushAuthorizationStatus(error);
      if (authorizationStatus) {
        // A credential challenge/rejection occurs before GitHub accepts the
        // ref mutation. Keep the prepared operation replayable and surface a
        // classified authorization wait instead of manufacturing uncertainty.
        throw new GitHubAuthorizationError(
          authorizationStatus,
          "GitHub authorization was rejected during Git push"
        );
      }
      await transitionOperation(this.options.operationStore, prepared, {
        status: "uncertain",
        remoteFact: {
          provider: "github",
          ref: group.branch,
          expectedHead: request.baseCommit,
          reconcileRequired: true
        }
      });
      const reconciled = await this.options.provider.observeRef(
        request.repository.owner,
        request.repository.name,
        group.branch,
        request.signal
      );
      if (reconciled.status === "present" && reconciled.sha === request.baseCommit) {
        return { group, remote: await this.finalizePush(prepared, reconciled) };
      }
      throw new GitHubUncertainResultError(
        request.operationId,
        "Git group-branch push is uncertain and the remote ref did not confirm the expected head",
        { cause: error }
      );
    }
    const observed = await this.options.provider.observeRef(
      request.repository.owner,
      request.repository.name,
      group.branch,
      request.signal
    );
    if (observed.status !== "present" || observed.sha !== request.baseCommit) {
      await transitionOperation(this.options.operationStore, prepared, {
        status: "uncertain",
        remoteFact: {
          provider: "github",
          ref: group.branch,
          expectedHead: request.baseCommit,
          reconcileRequired: true
        }
      });
      throw new GitHubUncertainResultError(request.operationId);
    }
    return { group, remote: await this.finalizePush(prepared, observed) };
  }

  sessionBegin(
    execution: GitExecutionAuthority,
    ownershipEpoch: number,
    input:
      | { kind: "delivery"; base: DeliveryBase }
      | { kind: "final-integration"; groupRunId: GroupRunId },
    signal?: AbortSignal
  ): Promise<LocalWorktreeFact> {
    if (input.kind === "delivery") {
      return this.options.localGit.createDeliveryWorktree(
        execution,
        ownershipEpoch,
        input.base,
        signal
      );
    }
    return this.options.localGit.createFinalIntegrationWorktree(
      execution,
      ownershipEpoch,
      input.groupRunId,
      signal
    );
  }

  executionPaths(
    execution: GitExecutionAuthority,
    ownershipEpoch: number
  ) {
    return this.options.localGit.pathsForExecution(execution, ownershipEpoch);
  }

  observeDeliveryPreparation(execution: GitExecutionAuthority, ownershipEpoch: number, signal?: AbortSignal) {
    return this.options.localGit.observeDeliveryPreparation(execution, ownershipEpoch, signal);
  }

  observeRetainedExecution(
    execution: GitExecutionAuthority,
    ownershipEpoch: number,
    signal?: AbortSignal
  ) {
    return this.options.localGit.observeRetainedExecution(
      execution,
      ownershipEpoch,
      signal
    );
  }

  restoreRetainedExecutionBase(
    execution: GitExecutionAuthority,
    ownershipEpoch: number,
    baseCandidates: readonly string[],
    signal?: AbortSignal
  ) {
    return this.options.localGit.restoreRetainedExecutionBase(
      execution,
      ownershipEpoch,
      baseCandidates,
      signal
    );
  }

  observeExecutionCommit(
    execution: GitExecutionAuthority,
    ownershipEpoch: number,
    signal?: AbortSignal
  ): Promise<LocalCheckpointFact> {
    return this.options.localGit.checkpointExecution(
      execution,
      ownershipEpoch,
      { kind: "checkpoint", signal }
    );
  }

  inspectExecution(execution: GitExecutionAuthority, ownershipEpoch: number, directBase: string,
    request: GitInspectionRequest, signal?: AbortSignal) {
    return this.options.localGit.inspectExecution(execution, ownershipEpoch, directBase, request, signal);
  }

  async observeHistoricalPullSource(request: { repository: GitHubRepositoryFact; execution: GitExecutionAuthority;
    directBase: string; sourceOperationId: string; providerNumber?: number; signal?: AbortSignal }) {
    const { execution, repository, signal } = request;
    if (execution.purpose !== "delivery" || execution.restrictedClosing) throw new GitInputError("Historical sources require a new current business task");
    await this.assertRemoteAuthority(execution, execution.ownershipEpoch, execution.executionBranch);
    const operation = await this.options.operationStore.recordedOperation?.(request.sourceOperationId);
    const recorded = operation?.remoteFact;
    if (!operation || operation.kind !== "pull.merge" || !["observed", "finalized", "uncertain"].includes(operation.status) ||
      !operation.ownerExecutionId || operation.ownerExecutionId === execution.id || recorded?.status !== "merged" ||
      recorded.owner !== repository.owner || recorded.repository !== repository.name || recorded.ownerExecutionId !== operation.ownerExecutionId ||
      recorded.headSha !== operation.expectedHead || recorded.base !== operation.expectedBase ||
      !Number.isSafeInteger(recorded.providerNumber) || Number(recorded.providerNumber) < 1 ||
      !/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(String(recorded.mergeCommitSha ?? "")) ||
      request.providerNumber !== undefined && request.providerNumber !== recorded.providerNumber) throw new GitInputError("Historical PR source is not bound to an actual merged operation in this project");
    const pull = await this.options.provider.observePullRequest(repository.owner, repository.name, Number(recorded.providerNumber), operation.ownerExecutionId, signal);
    if (!pull || pull.status !== "merged" || pull.headSha !== operation.expectedHead || pull.base !== operation.expectedBase ||
      pull.head !== recorded.head || pull.mergeCommitSha !== recorded.mergeCommitSha) throw new GitInputError("Historical provider facts changed or remain unconfirmed");
    const history = await this.options.localGit.inspectExecution(execution, execution.ownershipEpoch, request.directBase,
      { tool: "git_log", revision: pull.mergeCommitSha, limit: 1 }, signal);
    if (!("commits" in history) || history.commits[0]?.sha !== pull.mergeCommitSha) throw new GitInputError("Merged source is outside the current repair branch history");
    await this.assertRemoteAuthority(execution, execution.ownershipEpoch, execution.executionBranch);
    const source: HistoricalPullSource = { sourceOperationId: operation.id, providerNumber: pull.providerNumber,
      ownerExecutionId: operation.ownerExecutionId, headSha: pull.headSha!, base: pull.base, mergeCommitSha: pull.mergeCommitSha! };
    return { status: "historical_source", source, pullRequest: pull, parents: history.commits[0].parents,
      sourceJournalStatus: operation.status, readOnly: true };
  }

  async revertExecution(request: { repository: GitHubRepositoryFact; execution: GitExecutionAuthority; directBase: string;
    action: GitRevertRequest; attemptId: string; signal?: AbortSignal }) {
    const action = request.action;
    const prior = action.mode === "apply" ? await this.options.operationStore.recordedOperation?.(request.attemptId) : undefined;
    const source = !prior && "sourceOperationId" in action && action.sourceOperationId
      ? (await this.observeHistoricalPullSource({ ...request, sourceOperationId: action.sourceOperationId })).source : undefined;
    return this.options.localGit.revertExecution(request.execution, request.execution.ownershipEpoch, action, request.attemptId, source, request.signal, request.directBase);
  }

  observeExecutionWorktree(execution: GitExecutionAuthority, ownershipEpoch: number, signal?: AbortSignal) {
    return this.options.localGit.observeExecutionWorktree(execution, ownershipEpoch, signal);
  }

  observeRestrictedWorktreeClosing(execution: GitExecutionAuthority, ownershipEpoch: number,
    scope: RestrictedWorktreeClosingScope, signal?: AbortSignal) {
    return this.options.localGit.observeRestrictedWorktreeClosing(execution, ownershipEpoch, scope, signal);
  }

  async observeRestrictedWorktreeClosingTarget(repository: GitHubRepositoryFact, execution: GitExecutionAuthority,
    ownershipEpoch: number, targetBranch: string, requiredHeads: readonly string[], signal?: AbortSignal) {
    const observe = async () => {
      const ref = await this.observeRemoteRef(repository, targetBranch, signal);
      if (ref.owner !== repository.owner || ref.repository !== repository.name || ref.ref !== targetBranch ||
        ref.status !== "present" || !/^[a-f0-9]{40}$/i.test(ref.sha ?? "")) throw new GitInputError("Exact closing group target is not observable");
      return ref.sha!;
    };
    const remoteHead = await observe();
    await this.options.localGit.observeRestrictedWorktreeClosingTarget(execution, ownershipEpoch, targetBranch, remoteHead, requiredHeads, signal);
    if (await observe() !== remoteHead) throw new GitInputError("Closing remote group target changed during observation");
    const fact = await this.options.localGit.observeRestrictedWorktreeClosingTarget(execution, ownershipEpoch, targetBranch, remoteHead, requiredHeads, signal);
    return { ...fact, owner: repository.owner, repository: repository.name };
  }

  identifyRestrictedWorktreeClosing(execution: GitExecutionAuthority, ownershipEpoch: number,
    original: Pick<RestrictedWorktreeClosingScope, "kind" | "reportHeadSha">, signal?: AbortSignal) {
    return this.options.localGit.identifyRestrictedWorktreeClosing(execution, ownershipEpoch, original, signal);
  }

  releaseFinalIntegrationWorktree(
    execution: GitExecutionAuthority,
    ownershipEpoch: number,
    signal?: AbortSignal
  ): Promise<string> {
    return this.options.localGit.releaseFinalIntegrationWorktree(
      execution,
      ownershipEpoch,
      signal
    );
  }

  releaseFailedFinalIntegrationWorktree(
    execution: GitExecutionAuthority,
    ownershipEpoch: number,
    signal?: AbortSignal
  ): Promise<string> {
    return this.options.localGit.releaseFailedFinalIntegrationWorktree(
      execution,
      ownershipEpoch,
      signal
    );
  }

  async checkpointAndPush(
    request: CheckpointAndPushRequest
  ): Promise<{ checkpoint: LocalCheckpointFact; remote?: GitHubRefFact }> {
    const retained = await this.options.operationStore.recordedOperation?.(request.operationId);
    if (retained?.status === "superseded") throw new OperationStoreViolationError("Superseded push cannot checkpoint or republish the original operation");
    const checkpoint = await this.options.localGit.checkpointExecution(
      request.execution,
      request.ownershipEpoch,
      {
        kind: request.checkpointKind,
        operationMarker: request.operationId,
        ...(request.taskId ? { taskId: request.taskId } : {}),
        ...(request.taskTitle ? { taskTitle: request.taskTitle } : {}),
        ...(request.reason ? { reason: request.reason } : {}),
        signal: request.signal
      }
    );
    if (!checkpoint.changed) {
      if (request.execution.purpose === "final-integration" && request.execution.groupRunId &&
        request.execution.executionBranch === `groups/${request.execution.groupRunId}`) {
        // The owning Agent explicitly requested this tool. Canonical delivery
        // publishes the members' existing group head; observe its remote fact
        // without manufacturing a business commit or another push operation.
        const remote = await this.options.provider.observeRef(
          request.repository.owner, request.repository.name,
          request.execution.executionBranch, request.signal
        );
        return { checkpoint, remote };
      }
      return { checkpoint };
    }
    const branch = request.execution.executionBranch;
    await this.assertRemoteAuthority(
      request.execution,
      request.ownershipEpoch,
      branch,
      "checkpoint"
    );
    const prepared = await prepareOperation(
      this.options.operationStore,
      {
        id: request.operationId,
        kind: "git.push",
        ownerExecutionId: request.execution.id,
        ownershipEpoch: request.ownershipEpoch,
        expectedHead: checkpoint.commitSha,
        expectedBase: branch
      },
      {
        provider: "github",
        owner: request.repository.owner,
        repository: request.repository.name,
        ref: branch,
        executionId: request.execution.id,
        ownershipEpoch: request.ownershipEpoch,
        expectedHead: checkpoint.commitSha
      }
    );
    const replay = finalizedRef(prepared);
    if (replay) return { checkpoint, remote: replay };
    const before = await this.options.provider.observeRef(
      request.repository.owner,
      request.repository.name,
      branch,
      request.signal
    );
    if (before.status === "present" && before.sha === checkpoint.commitSha) {
      return {
        checkpoint,
        remote: await this.finalizePush(prepared, before)
      };
    }
    if (
      before.status === "present" &&
      before.sha !== checkpoint.commitSha &&
      !(await this.options.localGit.canFastForward(
        before.sha!,
        checkpoint.commitSha,
        request.signal
      ))
    ) {
      throw new GitInputError("Remote execution branch moved; force push is forbidden");
    }
    try {
      const pushed = request.execution.purpose === "final-integration" &&
        request.execution.executionBranch.startsWith("groups/")
        ? await this.options.localGit.pushGroup(
            request.execution.groupRunId ?? (() => {
              throw new GitInputError("Final integration execution requires groupRunId");
            })(),
            request.signal
          )
        : await this.options.localGit.pushExecution(
            request.execution,
            request.ownershipEpoch,
            request.signal,
            checkpoint.commitSha
          );
      if (pushed !== checkpoint.commitSha) {
        throw new OperationStoreViolationError("Local Git pushed another head");
      }
    } catch (error) {
      const authorizationStatus = gitPushAuthorizationStatus(error);
      if (authorizationStatus) {
        // Git rejected the credential before it could confirm the ref update.
        // Leave the durable operation prepared so authorization recovery can
        // replay the already-checkpointed execution without a model rerun.
        throw new GitHubAuthorizationError(
          authorizationStatus,
          "GitHub authorization was rejected during Git push"
        );
      }
      await transitionOperation(this.options.operationStore, prepared, {
        status: "uncertain",
        remoteFact: {
          provider: "github",
          ref: branch,
          expectedHead: checkpoint.commitSha,
          reconcileRequired: true
        }
      });
      const reconciled = await this.options.provider.observeRef(
        request.repository.owner,
        request.repository.name,
        branch,
        request.signal
      );
      if (reconciled.status === "present" && reconciled.sha === checkpoint.commitSha) {
        return {
          checkpoint,
          remote: await this.finalizePush(prepared, reconciled)
        };
      }
      throw new GitHubUncertainResultError(request.operationId, undefined, {
        cause: error
      });
    }
    const observed = await this.options.provider.observeRef(
      request.repository.owner,
      request.repository.name,
      branch,
      request.signal
    );
    if (observed.status !== "present" || observed.sha !== checkpoint.commitSha) {
      await transitionOperation(this.options.operationStore, prepared, {
        status: "uncertain",
        remoteFact: {
          provider: "github",
          ref: branch,
          expectedHead: checkpoint.commitSha,
          reconcileRequired: true
        }
      });
      throw new GitHubUncertainResultError(request.operationId);
    }
    return {
      checkpoint,
      remote: await this.finalizePush(prepared, observed)
    };
  }

  createPullRequest(request: CreatePullRequestRequest): Promise<GitHubPullRequestFact> {
    return this.createAuthorizedPullRequest(request);
  }

  async createGroupFinalPullRequest(request: CreateGroupFinalPullRequestRequest): Promise<GitHubPullRequestFact> {
    this.assertCanonicalFinalAuthority(request.execution);
    return this.createAuthorizedPullRequest(request);
  }

  private async createAuthorizedPullRequest(
    request: CreatePullRequestRequest | CreateGroupFinalPullRequestRequest
  ): Promise<GitHubPullRequestFact> {
    await this.assertClosingPublication(request.execution, request.ownershipEpoch, request.expectedHead, request.signal);
    await this.assertRemoteAuthority(
      request.execution,
      request.ownershipEpoch,
      request.execution.executionBranch
    );
    return this.options.provider.openPullRequest({
      owner: request.repository.owner,
      repository: request.repository.name,
      head: request.execution.executionBranch,
      base: request.base,
      title: request.title,
      body: request.body,
      ownerExecutionId: request.execution.id,
      operation: {
        operationId: request.operationId,
        ownerExecutionId: request.execution.id,
        ownershipEpoch: request.ownershipEpoch,
        expectedHead: request.expectedHead,
        expectedBase: request.base
      },
      signal: request.signal
    });
  }

  observePullRequest(request: {
    repository: GitHubRepositoryFact;
    providerNumber: number;
    ownerExecutionId: ExecutionId;
    signal?: AbortSignal;
  }) {
    return this.options.provider.observePullRequest(
      request.repository.owner,
      request.repository.name,
      request.providerNumber,
      request.ownerExecutionId,
      request.signal
    );
  }

  async mergePullRequest(request: MergePullRequestRequest): Promise<SynchronizedPullRequestFact> {
    await this.assertRemoteAuthority(
      request.execution,
      request.ownershipEpoch,
      request.execution.executionBranch
    );
    return this.mergePullRequestAuthorized(request);
  }

  async mergeGroupFinalPullRequest(request: MergeGroupFinalPullRequestRequest): Promise<SynchronizedPullRequestFact> {
    this.assertCanonicalFinalAuthority(request.execution);
    await this.assertRemoteAuthority(request.execution, request.ownershipEpoch, request.execution.executionBranch);
    return this.mergePullRequestAuthorized(request);
  }

  async reconcileGroupFinalPullRequest(request: MergeGroupFinalPullRequestRequest): Promise<SynchronizedPullRequestFact> {
    this.assertCanonicalFinalAuthority(request.execution);
    return this.reconcileAuthorizedMergedPullRequest(request);
  }

  /**
   * Replays an already-observed provider merge only to synchronize its exact
   * local target. S grants this narrower authority to a stop-confirmed legacy
   * owner or a live scoped owner with an exact finalized merge receipt;
   * it cannot push, create a PR, or merge an unobserved pull request.
   */
  reconcileMergedPullRequest(
    request: MergePullRequestRequest
  ): Promise<SynchronizedPullRequestFact> {
    return this.reconcileAuthorizedMergedPullRequest(request);
  }

  private async reconcileAuthorizedMergedPullRequest(
    request: AuthorizedMergeRequest
  ): Promise<SynchronizedPullRequestFact> {
    await this.assertClosingPublication(request.execution, request.ownershipEpoch, request.expectedHead, request.signal);
    if (!request.expectedMergeCommitSha) {
      throw new GitInputError("Merged pull reconciliation requires the exact merge commit");
    }
    await this.assertRemoteAuthority(
      request.execution,
      request.ownershipEpoch,
      request.execution.executionBranch,
      "provider.reconcile_merged",
      {
        providerNumber: request.providerNumber,
        expectedHeadSha: request.expectedHead,
        expectedBase: request.expectedBase,
        expectedMergeCommitSha: request.expectedMergeCommitSha
      }
    );
    this.options.localGit.reconciliationRef(request.operationId);
    await this.options.localGit.assertRemoteMergeTargetAvailable(
      request.expectedBase,
      "checkedOutTarget" in request ? request.checkedOutTarget : undefined,
      request.signal
    );
    const pullRequest = await this.options.provider.observePullRequest(
      request.repository.owner,
      request.repository.name,
      request.providerNumber,
      request.execution.id,
      request.signal
    );
    if (!pullRequest || pullRequest.status !== "merged" ||
      pullRequest.head !== request.execution.executionBranch ||
      pullRequest.headSha !== request.expectedHead ||
      pullRequest.base !== request.expectedBase ||
      pullRequest.mergeCommitSha !== request.expectedMergeCommitSha) {
      throw new GitHubUncertainResultError(
        request.operationId,
        "The authoritative merged pull request could not be re-observed exactly"
      );
    }
    const target = await this.options.provider.observeRef(
      request.repository.owner,
      request.repository.name,
      request.expectedBase,
      request.signal
    );
    if (target.status !== "present" || !target.sha) {
      throw new GitHubUncertainResultError(
        request.operationId,
        "Merged pull request target ref could not be observed for local synchronization"
      );
    }
    const localSynchronization = await this.options.localGit.synchronizeMergedPullRequest({
      operationId: request.operationId,
      targetBranch: request.expectedBase,
      expectedSourceHead: request.expectedHead,
      expectedMergeCommit: pullRequest.mergeCommitSha,
      expectedRemoteHead: target.sha,
      ...("checkedOutTarget" in request && request.checkedOutTarget ? { checkedOutTarget: request.checkedOutTarget } : {}),
      signal: request.signal
    });
    await this.options.operationStore.recordMergedSynchronization({
      projectId: this.options.localGit.projectId,
      executionId: request.execution.id,
      ownershipEpoch: request.ownershipEpoch,
      providerNumber: request.providerNumber,
      expectedHead: request.expectedHead,
      expectedBase: request.expectedBase,
      expectedMergeCommitSha: request.expectedMergeCommitSha,
      synchronization: localSynchronization
    });
    return { ...pullRequest, localSynchronization };
  }

  private async mergePullRequestAuthorized(
    request: AuthorizedMergeRequest
  ): Promise<SynchronizedPullRequestFact> {
    await this.assertClosingPublication(request.execution, request.ownershipEpoch, request.expectedHead, request.signal);
    this.options.localGit.reconciliationRef(request.operationId);
    await this.options.localGit.assertRemoteMergeTargetAvailable(
      request.expectedBase,
      "checkedOutTarget" in request ? request.checkedOutTarget : undefined,
      request.signal
    );
    const pullRequest = await this.options.provider.mergePullRequest({
      owner: request.repository.owner,
      repository: request.repository.name,
      providerNumber: request.providerNumber,
      ownerExecutionId: request.execution.id,
      operation: {
        operationId: request.operationId,
        ownerExecutionId: request.execution.id,
        ownershipEpoch: request.ownershipEpoch,
        expectedHead: request.expectedHead,
        expectedBase: request.expectedBase
      },
      commitTitle: `[OpenFARS][${"agentId" in request.execution ? request.execution.agentId : "runtime"}] Merge PR #${request.providerNumber} into ${request.expectedBase}`,
      commitMessage: [
        ...("agentId" in request.execution ? [
          `OpenFARS-Agent: ${request.execution.agentId}`,
          `OpenFARS-Agent-Role: ${request.execution.purpose}`
        ] : ["OpenFARS-Runtime: scoped-group-final"]),
        `OpenFARS-Execution: ${request.execution.id}`,
        ...("taskId" in request && request.taskId ? [`OpenFARS-Task: ${request.taskId}`] : []),
        ...(request.execution.groupRunId ? [`OpenFARS-Group: ${request.execution.groupRunId}`] : []),
        `OpenFARS-Operation: ${request.operationId}`,
        ...(request.reason ? [`OpenFARS-Reason: ${request.reason.replace(/\s+/g, " ").trim().slice(0, 500)}`] : [])
      ].join("\n"),
      signal: request.signal
    });
    if (pullRequest.status !== "merged") return pullRequest;
    if (!pullRequest.mergeCommitSha) {
      throw new OperationStoreViolationError(
        "GitHub reported a merged pull request without its merge commit"
      );
    }
    const target = await this.options.provider.observeRef(
      request.repository.owner,
      request.repository.name,
      request.expectedBase,
      request.signal
    );
    if (target.status !== "present" || !target.sha) {
      throw new GitHubUncertainResultError(
        request.operationId,
        "Merged pull request target ref could not be observed for local synchronization"
      );
    }
    const localSynchronization = await this.options.localGit.synchronizeMergedPullRequest({
      operationId: request.operationId,
      targetBranch: request.expectedBase,
      expectedSourceHead: request.expectedHead,
      expectedMergeCommit: pullRequest.mergeCommitSha,
      expectedRemoteHead: target.sha,
      ...("checkedOutTarget" in request && request.checkedOutTarget ? { checkedOutTarget: request.checkedOutTarget } : {}),
      signal: request.signal
    });
    return { ...pullRequest, localSynchronization };
  }

  async updatePullRequest(request: {
    repository: GitHubRepositoryFact;
    execution: PullRequestAuthority;
    ownershipEpoch: number;
    operationId: OperationId;
    providerNumber: number;
    expectedHead: string;
    expectedBase: string;
    title: string;
    body: string;
    signal?: AbortSignal;
  }): Promise<GitHubPullRequestFact> {
    if (request.execution.ownershipEpoch !== request.ownershipEpoch) {
      throw new GitInputError("Remote mutation ownership epoch is stale");
    }
    await this.assertClosingPublication(request.execution, request.ownershipEpoch, request.expectedHead, request.signal);
    await this.assertRemoteAuthority(request.execution, request.ownershipEpoch, request.execution.executionBranch, "provider.mutate");
    return this.options.provider.updatePullRequest({
      owner: request.repository.owner,
      repository: request.repository.name,
      providerNumber: request.providerNumber,
      ownerExecutionId: request.execution.id,
      operation: {
        operationId: request.operationId,
        ownerExecutionId: request.execution.id,
        ownershipEpoch: request.ownershipEpoch,
        expectedHead: request.expectedHead,
        expectedBase: request.expectedBase
      },
      title: request.title, body: request.body,
      signal: request.signal
    });
  }

  async closePullRequest(request: {
    repository: GitHubRepositoryFact;
    execution: PullRequestAuthority;
    ownershipEpoch: number;
    operationId: OperationId;
    providerNumber: number;
    expectedHead: string;
    expectedBase: string;
    signal?: AbortSignal;
  }): Promise<GitHubPullRequestFact> {
    if (request.execution.ownershipEpoch !== request.ownershipEpoch) {
      throw new GitInputError("Remote mutation ownership epoch is stale");
    }
    await this.assertClosingPublication(request.execution, request.ownershipEpoch, request.expectedHead, request.signal);
    await this.assertRemoteAuthority(request.execution, request.ownershipEpoch, request.execution.executionBranch, "provider.close_terminal");
    return this.options.provider.closePullRequest({
      owner: request.repository.owner,
      repository: request.repository.name,
      providerNumber: request.providerNumber,
      ownerExecutionId: request.execution.id,
      operation: {
        operationId: request.operationId,
        ownerExecutionId: request.execution.id,
        ownershipEpoch: request.ownershipEpoch,
        expectedHead: request.expectedHead,
        expectedBase: request.expectedBase
      },
      signal: request.signal
    });
  }

  prepareConflictResolution(
    execution: GitExecutionAuthority,
    ownershipEpoch: number,
    source:
      | { kind: "main"; expectedHead: string }
      | { kind: "group"; groupRunId: GroupRunId; expectedHead: string },
    signal?: AbortSignal
  ): Promise<OwnerResolutionFact> {
    return this.options.localGit.prepareOwnerResolution(
      execution,
      ownershipEpoch,
      source,
      signal
    );
  }

  /** Base refresh is not a PR merge receipt. Reuse the local guarded,
   * non-resetting fetch/CAS fast-forward without publishing a fake merge. */
  async refreshRecoveryBase(repository: GitHubRepositoryFact, execution: GitExecutionAuthority,
    epoch: number, branch: string, signal?: AbortSignal): Promise<GitHubRefFact> {
    await this.assertRemoteAuthority(execution, epoch, execution.executionBranch, "merge.prepare");
    const ref = await this.options.provider.observeRef(repository.owner, repository.name, branch, signal);
    if (ref.status !== "present" || !ref.sha) throw new GitInputError("Recovery integration base is absent");
    await this.options.localGit.synchronizeMergedPullRequest({ operationId: `recovery-base-${execution.id}-${epoch}-${ref.sha}`,
      targetBranch: branch, expectedSourceHead: ref.sha, expectedMergeCommit: ref.sha, expectedRemoteHead: ref.sha, signal });
    await this.assertRemoteAuthority(execution, epoch, execution.executionBranch, "merge.prepare");
    return ref;
  }

  previewExecutionIntoGroup(
    execution: GitExecutionAuthority,
    ownershipEpoch: number,
    groupRunId: GroupRunId,
    expectedSourceHead: string,
    expectedTargetHead: string,
    signal?: AbortSignal
  ): Promise<LocalMergeFact> {
    return this.options.localGit.integrateExecutionIntoGroup(
      execution,
      ownershipEpoch,
      groupRunId,
      expectedSourceHead,
      expectedTargetHead,
      signal
    );
  }

  previewExecutionIntoMain(
    execution: GitExecutionAuthority,
    ownershipEpoch: number,
    expectedSourceHead: string,
    expectedMainHead: string,
    signal?: AbortSignal
  ): Promise<LocalMergeFact> {
    return this.options.localGit.integrateExecutionIntoMain(
      execution,
      ownershipEpoch,
      expectedSourceHead,
      expectedMainHead,
      signal
    );
  }

  previewFinalIntegration(
    execution: GitExecutionAuthority,
    ownershipEpoch: number,
    groupRunId: GroupRunId,
    expectedGroupHead: string,
    expectedMainHead: string,
    signal?: AbortSignal
  ): Promise<LocalMergeFact> {
    return this.options.localGit.integrateGroupIntoMain(
      execution,
      ownershipEpoch,
      groupRunId,
      expectedGroupHead,
      expectedMainHead,
      signal
    );
  }

  commitManagementMemory(
    agentId: AgentId,
    operationId: OperationId,
    content: string,
    expectedHead?: string,
    signal?: AbortSignal
  ): Promise<ManagementMemorySnapshot> {
    return this.options.localGit.commitManagementMemory(
      agentId,
      operationId,
      content,
      { expectedHead, signal }
    );
  }

  managementMemorySnapshot(signal?: AbortSignal): Promise<ManagementMemorySnapshot> {
    return this.options.localGit.readManagementSnapshot(signal);
  }

  prepareAgentManagementWorkspace(agentId: AgentId, signal?: AbortSignal): Promise<string> {
    return this.options.localGit.prepareAgentManagementWorkspace(agentId, signal);
  }

  readonlyProjection(input: ReadonlyProjectionInput): ReadonlyGitProjection {
    return readonlyGitProjection(input);
  }

  private async assertClosingPublication(execution: PullRequestAuthority, epoch: number, head: string, signal?: AbortSignal): Promise<void> {
    if (!("restrictedClosing" in execution) || !execution.restrictedClosing) return;
    const fact = await this.options.localGit.observeRestrictedWorktreeClosing(execution as GitExecutionAuthority, epoch,
      execution.restrictedClosing.scope, signal);
    if (fact.head !== head || fact.pendingPaths.length || !fact.deliveryRequired) {
      throw new GitInputError("Closing PR must use its own exact clean B, separate from report A");
    }
  }

  private async assertRemoteAuthority(
    execution: PullRequestAuthority,
    ownershipEpoch: number,
    branch: string,
    operation: ExecutionOwnershipAssertion["operation"] = "provider.mutate",
    retainedPull?: Pick<ExecutionOwnershipAssertion,
      "providerNumber" | "expectedHeadSha" | "expectedBase" | "expectedMergeCommitSha">
  ): Promise<void> {
    if (execution.ownershipEpoch !== ownershipEpoch) {
      throw new GitInputError("Remote mutation ownership epoch is stale");
    }
    if ("restrictedClosing" in execution && execution.restrictedClosing &&
      !["checkpoint", "provider.mutate", "provider.close_terminal", "provider.reconcile_merged"].includes(operation)) {
      throw new GitInputError("Restricted closing does not grant general business Git authority");
    }
    await this.options.operationStore.assertExecutionOwnership({
      projectId: this.options.localGit.projectId,
      executionId: execution.id,
      ownershipEpoch,
      expectedBranch: branch,
      operation,
      ...("restrictedClosing" in execution && execution.restrictedClosing ? { restrictedClosing: execution.restrictedClosing } : {}),
      ...retainedPull
    });
  }

  private assertCanonicalFinalAuthority(execution: GitGroupFinalAuthority): void {
    if (execution.purpose !== "group-final-integration" ||
      execution.id !== `group-final-${execution.groupRunId}` ||
      execution.executionBranch !== `groups/${execution.groupRunId}`) {
      throw new GitInputError("Final group PR authority must own its canonical group branch");
    }
  }

  private async finalizePush(
    prepared: OperationRecord,
    fact: GitHubRefFact
  ): Promise<GitHubRefFact> {
    const remoteFact = fact as unknown as Record<string, unknown>;
    await finalizeOperation(this.options.operationStore, prepared, remoteFact);
    return fact;
  }
}

function gitPushAuthorizationStatus(error: unknown): 401 | 403 | undefined {
  // Resolution can fail before Git even starts. Retain the exact prepared
  // operation for the Agent instead of inventing an uncertain remote write.
  if (error instanceof GitHubAuthorizationError) return error.publicData.status === 403 ? 403 : 401;
  if (!(error instanceof GitCommandError) || error.publicData.command !== "push") return undefined;
  const diagnostic = typeof error.publicData.stderr === "string"
    ? error.publicData.stderr.toLowerCase()
    : "";
  if (
    diagnostic.includes("requested url returned error: 403") ||
    diagnostic.includes("the requested url returned error: 403") ||
    diagnostic.includes("permission to ") && diagnostic.includes(" denied to ") ||
    diagnostic.includes("write access to repository not granted")
  ) return 403;
  if (
    diagnostic.includes("requested url returned error: 401") ||
    diagnostic.includes("the requested url returned error: 401") ||
    diagnostic.includes("authentication failed") ||
    diagnostic.includes("could not read username") ||
    diagnostic.includes("could not read password") ||
    diagnostic.includes("terminal prompts disabled") ||
    diagnostic.includes("http basic: access denied") ||
    diagnostic.includes("invalid username or password")
  ) return 401;
  return undefined;
}
