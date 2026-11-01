import { createHash } from "node:crypto";
import { queryAgentGitOperation } from "./agent-git-operation-query.js";
import type { AgentGitDeliveryStatus } from "./agent-git-delivery.js";
import { CollaborationGitError, GitOperationResultAvailableError } from "./collaboration-git/errors.js";
import { mergedPullSynchronizationOperationId } from "./collaboration-git/operation.js";
import type { AgentGitOperationRequest, RecordedAgentGitOperationRequest } from "./agent-git-operation-journal.js";
import type { ControlActionEnvelope, OperationRecord } from "./types.js";
import { pushSupersessionProof } from "./collaboration-git/operation.js";
import type { CollaborationGitFacade, SynchronizedPullRequestFact } from "./collaboration-git/facade.js";
import type { GitExecutionAuthority, GitGroupFinalAuthority, GitHubPullRequestFact, GitHubRepositoryFact,
  GitHubRefFact, LocalCheckpointFact, RemoteMergeSyncFact } from "./collaboration-git/contracts.js";

export function isAgentGitAction(tool: string): boolean {
  return ["git_push", "git_get_operation", "git_reconcile_push", "github_create_pr", "github_get_pr", "github_merge_pr", "github_close_pr", "git_prepare_conflict", "git_log", "git_show", "git_diff", "git_revert"].includes(tool);
}

export interface AgentGitFacts {
  pushedHeadSha?: string;
  pullRequest?: GitHubPullRequestFact;
  merged?: SynchronizedPullRequestFact;
  pushResult?: {
    status: "pushed" | "already_published" | "not_committed" | "push_unconfirmed";
    checkpoint: LocalCheckpointFact;
    remote?: GitHubRefFact;
  };
}

/** Implements requests made by an Agent. Never run this as an exit hook:
 * decisions, conflict repair and provider retries belong to the Agent. */
export interface AgentGitToolInput {
  git: Pick<CollaborationGitFacade, "checkpointAndPush" | "createPullRequest" | "mergePullRequest"> &
    Partial<Pick<CollaborationGitFacade, "revertExecution" | "observeHistoricalPullSource" | "inspectExecution" | "reconcilePushOperation" | "prepareConflictResolution" | "closePullRequest" | "observePullRequest" | "observePullRequestForExecution" | "createGroupFinalPullRequest" | "mergeGroupFinalPullRequest" | "refreshRecoveryBase" | "reconcileGroupFinalPullRequest" | "reconcileMergedPullRequest">>;
  repository: GitHubRepositoryFact;
  execution: GitExecutionAuthority | GitGroupFinalAuthority;
  base: string;
  facts: AgentGitFacts;
  envelope: ControlActionEnvelope;
  signal?: AbortSignal;
  /** Look up only the operation named by the Agent's own call ID. Replaying
   * that request must settle its journal even when GitHub already merged;
   * never select another operation or retry on the Agent's behalf. */
  recordedOperation?(operationId: string): OperationRecord | undefined;
  recordRequest?(request: AgentGitOperationRequest): RecordedAgentGitOperationRequest;
  recordedRequest?(operationId: string): RecordedAgentGitOperationRequest | undefined;
  /** Read the same authoritative gate used to wake and accept this Agent. */
  deliveryStatus?(): AgentGitDeliveryStatus | Promise<AgentGitDeliveryStatus>;
  /** Read exact durable synchronization facts for the original merge/query.
   * A replay must not rewrite its original proof or repeat Git. */
  recordedSynchronization?(query: {
    projectId: string; executionId: string; ownershipEpoch: number; providerNumber: number;
    expectedHead: string; expectedBase: string; expectedMergeCommitSha: string
  }): RemoteMergeSyncFact | undefined;
}

/** Keep existing request identities immutable. Only new oversized IDs
 * need a bounded provider marker; the journal retains their full authority. */
export function agentGitOperationId(input: Pick<AgentGitToolInput, "execution" | "recordedOperation" | "recordedRequest"> & {
  envelope: Pick<ControlActionEnvelope, "projectId" | "invocationId" | "callId">;
}, suffix: "push" | "create" | "merge" | "close"): string {
  const { execution, envelope } = input;
  const closing = "restrictedClosing" in execution ? execution.restrictedClosing : undefined;
  const legacy = closing
    ? `agent-closing-git-${closing.invocationId}-${execution.id}-epoch-${execution.ownershipEpoch}-${envelope.callId}-${suffix}`
    : `agent-git-${execution.id}-epoch-${execution.ownershipEpoch}-${envelope.callId}-${suffix}`;
  if (legacy.length <= 160 || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(legacy) ||
    input.recordedRequest?.(legacy) || input.recordedOperation?.(legacy)) return legacy;
  const identity = JSON.stringify(closing
    ? [envelope.projectId, closing.invocationId, execution.id, execution.ownershipEpoch, envelope.callId, suffix]
    : [envelope.projectId, execution.id, execution.ownershipEpoch, envelope.callId, suffix]);
  return `${closing ? "agent-closing-git" : "agent-git"}-${createHash("sha256").update(identity).digest("hex")}-${suffix}`;
}

export async function executeAgentGitTool(input: AgentGitToolInput): Promise<unknown> {
  let dispatched: { id: string; kind: OperationRecord["kind"] } | undefined;
  try {
    const result = await executeAgentGitToolRequest(input, (id, kind) => { dispatched = { id, kind }; });
    return input.deliveryStatus && result && typeof result === "object"
      ? { ...result, ...(dispatched ? { operationId: dispatched.id }
        : "operationId" in input.envelope.action ? { operationId: input.envelope.action.operationId } : {}),
        gitDelivery: await input.deliveryStatus() } : result;
  } catch (error) {
    // A failed local callback cannot erase an exact known remote result.
    // Read the same journal only; retry/recovery remains the Agent's choice.
    if (!dispatched || !input.recordedOperation || error instanceof CollaborationGitError &&
      ["OPERATION_PAYLOAD_MISMATCH", "GIT_OWNERSHIP_STALE"].includes(error.code)) throw error;
    let observed: { operation: OperationRecord; status: string; localStage: string };
    try {
      observed = queryAgentGitOperation({ ...input, projectId: input.envelope.projectId, operationId: dispatched.id });
    } catch { throw error; }
    if (observed.operation.kind !== dispatched.kind || observed.operation.ownershipEpoch !== input.execution.ownershipEpoch ||
      !["completed", "remote_success_local_pending"].includes(observed.status)) throw error;
    if (observed.operation.kind === "pull.merge" && observed.operation.remoteFact?.status === "merged") {
      // queryAgentGitOperation has checked this exact owner/epoch/head/base
      // and numbered PR. Preserve remote success even when local fetch fails.
      // No synchronized delivery or task completion is inferred from it.
      input.facts.pullRequest = structuredClone(observed.operation.remoteFact) as unknown as GitHubPullRequestFact;
    }
    throw new GitOperationResultAvailableError(dispatched.id,
      observed.status as "completed" | "remote_success_local_pending", observed.localStage, { cause: error });
  }
}

async function executeAgentGitToolRequest(input: AgentGitToolInput,
  onOperationDispatched?: (id: string, kind: OperationRecord["kind"]) => void): Promise<unknown> {
  const { git, repository, execution, base, facts, envelope, signal } = input;
  const action = envelope.action;
  const final = execution.purpose === "group-final-integration";
  const closing = "restrictedClosing" in execution ? execution.restrictedClosing : undefined;
  if (action.tool === "git_revert") {
    if (final || closing || !git.revertExecution) throw new Error("Revert requires a current authorized business task");
    const attemptId = `git-revert-${createHash("sha256").update(JSON.stringify([envelope.projectId, execution.id, execution.ownershipEpoch, envelope.callId])).digest("hex")}`;
    if (action.mode !== "preview" && action.mode !== "status") {
      if (!input.recordRequest) throw new Error("Revert requires the original Agent request journal");
      input.recordRequest({ operationId: attemptId, projectId: envelope.projectId, executionId: execution.id,
        ownershipEpoch: execution.ownershipEpoch, executionBranch: execution.executionBranch, integrationTarget: base,
        repository: { owner: repository.owner, name: repository.name }, agentId: envelope.agent, invocationId: envelope.invocationId,
        callId: envelope.callId, requestedAt: envelope.receivedAt, action, expectedHead: action.expectedHead });
    }
    const result = await git.revertExecution({ repository, execution: execution as GitExecutionAuthority, directBase: base, action, attemptId, signal });
    if (result.status === "committed" && result.currentHead !== facts.pushedHeadSha) {
      facts.pushedHeadSha = undefined; facts.merged = undefined; facts.pushResult = undefined;
      if (facts.pullRequest?.headSha !== result.currentHead) facts.pullRequest = undefined;
    }
    return result;
  }
  if (action.tool === "github_get_pr" && action.sourceOperationId !== undefined) {
    if (final || closing || !git.observeHistoricalPullSource) throw new Error("Historical source lookup requires a current business task");
    return git.observeHistoricalPullSource({ repository, execution: execution as GitExecutionAuthority, directBase: base,
      sourceOperationId: action.sourceOperationId, providerNumber: action.providerNumber, signal });
  }
  if (action.tool === "git_log" || action.tool === "git_show" || action.tool === "git_diff") {
    if (final || closing || !git.inspectExecution) throw new Error("Git inspection requires a current business task");
    return git.inspectExecution(execution as GitExecutionAuthority, execution.ownershipEpoch, base, action, signal);
  }
  if (closing && (final || closing.invocationId !== envelope.invocationId || closing.capabilityHash !== envelope.capabilityHash ||
    !/^[A-Za-z0-9][A-Za-z0-9._-]{0,159}$/.test(closing.invocationId))) {
    throw new Error("Closing Git operation lost its exact native invocation capability");
  }
  // Closing retains the original execution/epoch. Its callId may legitimately
  // match an old business call; keep every original operation/request immutable.
  const operationId = (suffix: "push" | "create" | "merge" | "close") => agentGitOperationId(input, suffix);
  if (action.tool === "git_get_operation") {
    return queryAgentGitOperation({ ...input, projectId: envelope.projectId, operationId: action.operationId });
  }
  const recordRequest = (id: string, action: AgentGitOperationRequest["action"], expectedHead?: string) => {
    input.recordRequest?.({ operationId: id, projectId: envelope.projectId, executionId: execution.id,
      ownershipEpoch: execution.ownershipEpoch, executionBranch: execution.executionBranch, integrationTarget: base,
      repository: { owner: repository.owner, name: repository.name }, agentId: envelope.agent,
      invocationId: envelope.invocationId, callId: envelope.callId, requestedAt: envelope.receivedAt, action,
      ...(expectedHead ? { expectedHead } : {}) });
    onOperationDispatched?.(id, ({ git_push: "git.push", github_create_pr: "pull.create",
      github_merge_pr: "pull.merge", github_close_pr: "pull.close", git_revert: "git.revert" } as const)[action.tool]);
  };
  const assertPullIdentity = (pull: GitHubPullRequestFact) => {
    if (pull.ownerExecutionId !== execution.id || pull.head !== execution.executionBranch || pull.base !== base ||
      pull.owner !== repository.owner || pull.repository !== repository.name ||
      !Number.isSafeInteger(pull.providerNumber) || pull.providerNumber < 1 ||
      !/^[0-9a-f]{40}$/i.test(pull.headSha ?? "")) {
      throw new Error("Agent PR does not match its execution and direct integration target");
    }
  };
  const assertPull = (pull: GitHubPullRequestFact) => {
    assertPullIdentity(pull);
    if (facts.pushedHeadSha && pull.headSha !== facts.pushedHeadSha) {
      throw new Error("Agent PR does not match its confirmed current head");
    }
  };
  if (action.tool === "git_reconcile_push") {
    if (final) throw new Error("Canonical group delivery has no member push journal to reconcile");
    if (!git.reconcilePushOperation) throw new Error("Retained push reconciliation tool is unavailable");
    const result = await git.reconcilePushOperation({ repository, execution: execution as GitExecutionAuthority,
      ownershipEpoch: execution.ownershipEpoch, operationId: action.operationId, retry: action.retry,
      invocationId: envelope.invocationId,
      ...(action.historical === undefined ? {} : { historical: action.historical }), signal });
    if (action.historical === true) {
      const owner = result.historicalOwner;
      const original = input.recordedOperation?.(action.operationId);
      if (!owner || !("agentId" in execution) || owner.agentId !== execution.agentId ||
        !Number.isSafeInteger(owner.ownershipEpoch) || owner.ownershipEpoch < 1 ||
        result.operation.id !== action.operationId || result.operation.kind !== "git.push" ||
        result.operation.ownerExecutionId !== owner.executionId || result.operation.ownershipEpoch !== owner.ownershipEpoch ||
        result.operation.expectedBase !== owner.executionBranch || !/^[0-9a-f]{40}$/i.test(result.operation.expectedHead ?? "") ||
        !original || original.kind !== "git.push" || original.payloadHash !== result.operation.payloadHash || original.expectedHead !== result.operation.expectedHead ||
        original.expectedBase !== result.operation.expectedBase || original.ownerExecutionId !== owner.executionId ||
        original.ownershipEpoch !== owner.ownershipEpoch ||
        owner.observationInvocationId !== undefined && owner.observationInvocationId !== envelope.invocationId ||
        owner.executionId === execution.id && owner.ownershipEpoch === execution.ownershipEpoch &&
          owner.observationInvocationId !== envelope.invocationId ||
        action.retry === true || result.pushOutcome !== undefined) {
        throw new Error("Historical push tool returned another Agent's request or a write result");
      }
      if (result.status === "confirmed" && (result.operation.status !== "finalized" || result.remote?.status !== "present" ||
        result.remote.owner !== repository.owner || result.remote.repository !== repository.name ||
        result.remote.ref !== owner.executionBranch || result.remote.sha !== result.operation.expectedHead)) {
        throw new Error("Historical push tool did not confirm its exact remote ref and journal");
      }
      if (result.status === "superseded") pushSupersessionProof(result.operation, repository);
      // This receipt belongs to the original task. Preserve all current-task
      // Git facts; never let an old head authorize a new PR or replace a merge.
      return result;
    }
    if (result.historicalOwner) throw new Error("Historical push receipt was not explicitly requested by the Agent");
    if (result.operation.id !== action.operationId || result.operation.kind !== "git.push" ||
      result.operation.ownerExecutionId !== execution.id || result.operation.ownershipEpoch !== execution.ownershipEpoch ||
      result.operation.expectedBase !== execution.executionBranch || !/^[0-9a-f]{40}$/i.test(result.operation.expectedHead ?? "")) {
      throw new Error("Retained push tool returned another operation or ownership epoch");
    }
    if (result.status === "confirmed") {
      if (result.operation.status !== "finalized" || result.remote?.status !== "present" ||
        result.remote.owner !== repository.owner || result.remote.repository !== repository.name ||
        result.remote.ref !== execution.executionBranch || result.remote.sha !== result.operation.expectedHead) {
        throw new Error("Retained push tool did not confirm its exact remote ref and journal");
      }
      facts.pushedHeadSha = result.remote.sha;
      if (facts.merged?.headSha !== result.remote.sha) facts.merged = undefined;
    } else if (result.status === "superseded") {
      pushSupersessionProof(result.operation, repository);
      // Inclusion supplies no new delivery head; preserve other current-task
      // receipts rather than erasing a later real publication/merge.
    } else if (result.status === "unconfirmed") {
      facts.pushedHeadSha = undefined;
      facts.merged = undefined;
    }
    return result;
  }
  if (action.tool === "git_push") {
    if (final) throw new Error("Canonical group delivery reuses its verified published head; business pushes belong to member tasks");
    recordRequest(operationId("push"), action);
    const pushed = await git.checkpointAndPush({ repository, execution: execution as GitExecutionAuthority,
      ownershipEpoch: execution.ownershipEpoch, operationId: operationId("push"), checkpointKind: "checkpoint", reason: action.reason, signal });
    const canonicalPublishedHead = execution.purpose === "final-integration" && execution.groupRunId &&
      execution.executionBranch === `groups/${execution.groupRunId}` && !pushed.checkpoint.changed;
    const confirmed = (pushed.checkpoint.changed || canonicalPublishedHead) && pushed.remote?.status === "present" &&
      pushed.remote.ref === execution.executionBranch && pushed.remote.sha === pushed.checkpoint.commitSha &&
      pushed.remote.owner === repository.owner && pushed.remote.repository === repository.name &&
      /^[0-9a-f]{40}$/i.test(pushed.checkpoint.commitSha) &&
      pushed.checkpoint.executionId === execution.id && pushed.checkpoint.ownershipEpoch === execution.ownershipEpoch &&
      pushed.checkpoint.branch === execution.executionBranch;
    const result = { ...pushed, status: canonicalPublishedHead && confirmed ? "already_published" as const
      : !pushed.checkpoint.changed && !canonicalPublishedHead ? "not_committed" as const
      : confirmed ? "pushed" as const : "push_unconfirmed" as const };
    facts.pushResult = result;
    if (!confirmed || facts.merged?.headSha !== pushed.checkpoint.commitSha) facts.merged = undefined;
    if (!confirmed) {
      // The actual tool result belongs to the Agent, including an unchanged
      // checkpoint or unconfirmed provider head. Do not fabricate success or
      // choose a retry/commit on its behalf.
      facts.pushedHeadSha = undefined;
      return result;
    }
    facts.pushedHeadSha = pushed.checkpoint.commitSha;
    return result;
  }
  if (action.tool === "github_create_pr") {
    if (action.base !== base) throw new Error(`Agent must use its direct PR target ${JSON.stringify(base)}; requested base ${JSON.stringify(action.base)} is not this task's direct target.`);
    if (!facts.pushedHeadSha) throw new Error("Agent must use its confirmed pushed head before creating a PR. Inspect the original push with git_get_operation and reconcile its exact receipt with git_reconcile_push, or use git_push for the current task's pending publication. A local git_status head alone does not confirm a remote push; do not create unrelated changes just to retry publication.");
    const common = { repository, ownershipEpoch: execution.ownershipEpoch, operationId: operationId("create"),
      expectedHead: facts.pushedHeadSha, base, title: action.title, body: action.body, signal };
    if (final && !git.createGroupFinalPullRequest) throw new Error("Canonical PR tool is unavailable");
    recordRequest(common.operationId, action, common.expectedHead);
    const pull = final
      ? await git.createGroupFinalPullRequest!({ ...common, execution: execution as GitGroupFinalAuthority })
      : await git.createPullRequest({ ...common, execution: execution as GitExecutionAuthority });
    assertPull(pull); facts.pullRequest = pull; return pull;
  }
  if (action.tool === "github_get_pr" || action.tool === "github_merge_pr" || action.tool === "github_close_pr") {
    if (!git.observePullRequest || !git.observePullRequestForExecution) throw new Error("PR observation tool is unavailable");
    const pull = action.providerNumber !== undefined
      ? await git.observePullRequest({ repository, providerNumber: action.providerNumber, ownerExecutionId: execution.id, signal })
      : await git.observePullRequestForExecution({ repository, execution, expectedBase: base, signal });
    if (!pull) {
      if (action.tool === "github_merge_pr") throw new Error("Agent PR is missing; inspect its real provider result");
      return { status: "missing" };
    }
    if (action.tool === "github_get_pr") assertPullIdentity(pull);
    else assertPull(pull);
    if (action.tool === "github_close_pr" && pull.providerNumber !== action.providerNumber) {
      throw new Error("Observed PR number differs from the Agent's close request");
    }
    if (action.tool === "github_get_pr") {
      const current = facts.pullRequest;
      // An inspection of another historical PR must not replace the current
      // delivery's accepted identity or local synchronization evidence.
      if (!current || current.id === pull.id ||
        (current.headSha !== facts.pushedHeadSha && pull.headSha === facts.pushedHeadSha)) {
        facts.pullRequest = pull;
      }
      return pull;
    }
    facts.pullRequest = pull;
    // An exact provider PR head is published evidence for its original
    // owner. A read-only history query must not turn that old head into the
    // current task's publishable head; explicit merge/close actions may bind
    // the observed PR they intentionally act on.
    facts.pushedHeadSha ??= pull.headSha!;
    if (action.tool === "github_close_pr") {
      // Only the owning Agent chooses closure. Do not run this on failure,
      // return, cancellation or recovery; preserve the actual provider result.
      if (!git.closePullRequest) throw new Error("Agent PR close tool is unavailable");
      recordRequest(operationId("close"), action, pull.headSha!);
      const closed = pull.status === "merged" || pull.status === "closed" ? pull
        : await git.closePullRequest({ repository, execution,
            ownershipEpoch: execution.ownershipEpoch, operationId: operationId("close"),
            providerNumber: action.providerNumber, expectedHead: pull.headSha!, expectedBase: base, signal });
      assertPull(closed);
      if (closed.providerNumber !== action.providerNumber) throw new Error("PR close result differs from the Agent's requested PR number");
      facts.pullRequest = closed;
      if (closed.status !== "merged") facts.merged = undefined;
      return closed;
    }
    const common = { repository, ownershipEpoch: execution.ownershipEpoch, operationId: operationId("merge"),
      providerNumber: pull.providerNumber, expectedHead: pull.headSha!, expectedBase: base, reason: action.reason, signal };
    const retainedOperation = input.recordedOperation?.(common.operationId);
    if (retainedOperation && (retainedOperation.id !== common.operationId || retainedOperation.kind !== "pull.merge" ||
      retainedOperation.ownerExecutionId !== execution.id || retainedOperation.ownershipEpoch !== execution.ownershipEpoch ||
      retainedOperation.expectedHead !== pull.headSha || retainedOperation.expectedBase !== base)) {
      throw new Error("Recorded Agent merge operation differs from its exact request and ownership epoch");
    }
    const unfinishedMerge = retainedOperation && ["prepared", "observed", "uncertain"].includes(retainedOperation.status);
    if (final && !git.mergeGroupFinalPullRequest) throw new Error("Canonical merge tool is unavailable");
    recordRequest(common.operationId, action, common.expectedHead);
    // The provider's explicit replay observes an already merged PR without a
    // second remote mutation and finalizes this exact original operation.
    // Skipping that entry would leave its uncertain journal blocking delivery.
    let merged: SynchronizedPullRequestFact = pull.status === "merged" && !unfinishedMerge ? pull : final
      ? await git.mergeGroupFinalPullRequest!({ ...common, execution: execution as GitGroupFinalAuthority })
      : await git.mergePullRequest({ ...common, execution: execution as GitExecutionAuthority });
    // Root/v2 Facade receipts already carry their accepted local sync. Only
    // scoped owners with durable proof lookup (or canonical final owners)
    // require the stable scoped key. Never add Git after a valid legacy
    // receipt has already completed/released that owner's write authority.
    if (merged.status === "merged" && merged.mergeCommitSha &&
      (final || input.recordedSynchronization || !merged.localSynchronization)) {
      const operationId = mergedPullSynchronizationOperationId(execution.id, execution.ownershipEpoch,
        pull.headSha!, base, merged.mergeCommitSha);
      const prior = facts.merged;
      const retained = prior?.providerNumber === merged.providerNumber && prior.headSha === pull.headSha &&
        prior.base === base && prior.ownerExecutionId === execution.id && prior.mergeCommitSha === merged.mergeCommitSha
        ? prior.localSynchronization : undefined;
      const synchronization = merged.localSynchronization?.operationId === operationId ? merged.localSynchronization
        : retained?.operationId === operationId ? retained
        : input.recordedSynchronization?.({ projectId: envelope.projectId, executionId: execution.id,
            ownershipEpoch: execution.ownershipEpoch, providerNumber: merged.providerNumber,
            expectedHead: pull.headSha!, expectedBase: base, expectedMergeCommitSha: merged.mergeCommitSha });
      if (synchronization) {
        if (synchronization.projectId !== envelope.projectId || synchronization.operationId !== operationId ||
          synchronization.targetBranch !== base || synchronization.expectedSourceHead !== pull.headSha ||
          synchronization.mergeCommitSha !== merged.mergeCommitSha || synchronization.localHeadAfter !== synchronization.remoteHead ||
          !/^[0-9a-f]{40}$/i.test(synchronization.remoteHead) || !["synchronized", "already_synchronized"].includes(synchronization.status)) {
          throw new Error("Recorded Agent merge synchronization differs from its exact PR and ownership epoch");
        }
        merged = { ...merged, localSynchronization: synchronization };
      } else if (final) {
        if (!git.reconcileGroupFinalPullRequest) throw new Error("Canonical merge synchronization is unavailable");
        merged = await git.reconcileGroupFinalPullRequest({ ...common, execution: execution as GitGroupFinalAuthority,
          operationId, expectedMergeCommitSha: merged.mergeCommitSha });
      } else {
        if (!git.reconcileMergedPullRequest) throw new Error("Agent merge synchronization is unavailable");
        merged = await git.reconcileMergedPullRequest({ ...common, execution: execution as GitExecutionAuthority,
          operationId, expectedMergeCommitSha: merged.mergeCommitSha });
      }
    }
    assertPull(merged); facts.pullRequest = merged; facts.merged = merged; return merged;
  }
  if (action.tool === "git_prepare_conflict") {
    if (final) throw new Error("Report canonical PR conflicts to the Leader; repair belongs to a retained member business task");
    const owner = execution as GitExecutionAuthority;
    if (!git.refreshRecoveryBase || !git.prepareConflictResolution) throw new Error("Conflict base refresh or preparation is unavailable");
    const ref = await git.refreshRecoveryBase(repository, owner, owner.ownershipEpoch, base, signal);
    if (ref.status !== "present" || !/^[0-9a-f]{40}$/i.test(ref.sha ?? "")) throw new Error("Recovery base is unavailable");
    return git.prepareConflictResolution(owner, owner.ownershipEpoch,
      base === "main" ? { kind: "main", expectedHead: ref.sha! }
        : { kind: "group", groupRunId: base.slice("groups/".length), expectedHead: ref.sha! }, signal);
  }
  throw new Error("Unsupported Agent Git tool");
}
