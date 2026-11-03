import { isDeepStrictEqual } from "node:util";
import type { AgentNativeSessionBinding, ScopedAgentReportRecord, ScopedAgentTaskCompletionRecord, ScopedAgentTurnRecord,
  ScopedRecoveryCandidate, ScopedWorktreeClosingCandidate, ScopedWorktreeClosingTurn } from "./collaboration-state/contracts.js";
import type { PullRequestRecord } from "./types.js";
import type { RestrictedWorktreeClosingFact, RemoteMergeSyncFact } from "./collaboration-git/contracts.js";
import type { CollaborationStateDatabase } from "./collaboration-state/store.js";
import { agentGitOperationJournal } from "./agent-git-operation-journal.js";
import { queryAgentGitOperation } from "./agent-git-operation-query.js";
import { agentGitResultCoversOperation } from "./agent-git-result-proof.js";
import { sameDurableSession } from "./control-result-receipts.js";

type Attempt = NonNullable<ScopedRecoveryCandidate["closingAttempts"]>[number];
export interface ScopedWorktreeClosingDeliveryProof {
  business: { report: ScopedAgentReportRecord; finish: ScopedAgentTaskCompletionRecord;
    pullRequest: PullRequestRecord; synchronization: RemoteMergeSyncFact };
  supplement?: { headSha: string; pushOperationId: string; createOperationId: string; mergeOperationId: string;
    receiptIds: string[]; pullRequest: PullRequestRecord; synchronization: RemoteMergeSyncFact };
}

/** Reads existing immutable facts only. No provider observation, Git action,
 * repair, native wake, task completion or FIFO release happens here. */
export function inspectScopedWorktreeClosingDelivery(input: {
  database: Pick<CollaborationStateDatabase, "eventByRequestId" | "appendEvent" | "recordedGitOperation" | "scopedMergedSynchronization">;
  candidate: ScopedWorktreeClosingCandidate; turn: ScopedWorktreeClosingTurn; attempts: Attempt[];
  report?: ScopedAgentReportRecord; finish?: ScopedAgentTaskCompletionRecord; originalTurn?: ScopedAgentTurnRecord;
  originalFinishMatches: boolean;
  businessPull?: PullRequestRecord; businessSynchronization?: RemoteMergeSyncFact;
  observation: RestrictedWorktreeClosingFact; repository: { owner: string; name: string }; base: string;
  unsettledOperations: boolean;
}): { missing: string[]; proof?: ScopedWorktreeClosingDeliveryProof } {
  const { candidate: c, turn, report, finish, originalTurn, businessPull: a, businessSynchronization: sync,
    observation: directory, database, repository, base } = input;
  const missing: string[] = [];
  if (input.unsettledOperations) missing.push("all original owner Git operation outcomes settled");
  if (!report || report.projectId !== c.projectId || report.executionId !== c.executionId ||
    report.ownershipEpoch !== c.ownershipEpoch || report.invocationId !== c.reportInvocationId ||
    report.headSha !== turn.reportHeadSha || !report.output.trim()) missing.push("immutable business report A");
  if (!finish || finish.projectId !== c.projectId || finish.executionId !== c.executionId ||
    finish.ownershipEpoch !== c.ownershipEpoch || finish.agentId !== c.agentId ||
    !input.originalFinishMatches) missing.push("original business finish_task");
  const businessSource = originalTurn && database.eventByRequestId(c.projectId, `agent-native-binding:${originalTurn.invocationId}`);
  const businessBinding = businessSource?.payload.binding as unknown as AgentNativeSessionBinding | undefined;
  if (!originalTurn || originalTurn.status !== "stopped" || !originalTurn.stoppedAt ||
    originalTurn.projectId !== c.projectId || originalTurn.executionId !== c.executionId ||
    originalTurn.ownershipEpoch !== c.ownershipEpoch || businessSource?.type !== "agent.native_binding.opened" ||
    !businessBinding || businessBinding.projectId !== c.projectId || businessBinding.invocationId !== originalTurn.invocationId || businessBinding.agentId !== c.agentId ||
    businessBinding.runtimePath !== originalTurn.runtimePath || businessBinding.worktreePath !== turn.worktreePath ||
    businessBinding.executionContext.role !== "delivery" || businessBinding.executionContext.executionId !== c.executionId ||
    businessBinding.executionContext.ownershipEpoch !== c.ownershipEpoch || businessBinding.executionContext.groupRunId !== turn.groupRunId ||
    businessBinding.executionContext.nodeRunId !== turn.nodeRunId || !sameDurableSession(businessBinding.session, c.originalSession))
    missing.push("original business physical Stop");
  if (!a || a.status !== "merged" || a.ownerExecutionId !== c.executionId || a.head !== turn.executionBranch ||
    a.base !== base || a.headSha !== turn.reportHeadSha || !/^[a-f0-9]{40}$/i.test(a.mergeCommitSha ?? "")) missing.push("exact business A merged PR");
  if (!a || !sync || sync.projectId !== c.projectId || sync.targetBranch !== base ||
    sync.expectedSourceHead !== turn.reportHeadSha || sync.mergeCommitSha !== a.mergeCommitSha ||
    sync.remoteHead !== sync.localHeadAfter || !/^[a-f0-9]{40}$/i.test(sync.localHeadAfter) ||
    !["synchronized", "already_synchronized"].includes(sync.status)) missing.push("exact business A local synchronization");
  if (turn.status !== "stopped" || !turn.openedAt || !turn.stoppedAt) missing.push("supplemental physical Stop");
  if (!turn.completion) missing.push("original Agent supplemental finish_task");
  if (!turn.result?.output.trim()) missing.push("actual original Agent supplemental output");
  if (directory.pendingPaths.length) missing.push("clean final authorized directory");

  let supplement: ScopedWorktreeClosingDeliveryProof["supplement"];
  if (directory.deliveryRequired) {
    const journal = agentGitOperationJournal(database, c.projectId);
    const operations: Array<{ query: ReturnType<typeof queryAgentGitOperation>; receipts: string[] }> = [];
    for (const attempt of input.attempts) {
      const t = attempt.turn;
      // A subsequent formal decision can receive or finish the same B. An
      // already settled B is historical delivery evidence, never a restored
      // capability. The caller selects only this incident or a settled exact B.
      if (t.status !== "stopped" || !t.openedAt || !t.stoppedAt || !attempt.stopEvidence ||
        t.projectId !== c.projectId || t.executionId !== c.executionId || t.ownershipEpoch !== c.ownershipEpoch ||
        t.agentId !== c.agentId || t.reportHeadSha !== turn.reportHeadSha || t.executionBranch !== turn.executionBranch ||
        t.worktreePath !== turn.worktreePath || t.groupRunId !== turn.groupRunId || t.nodeRunId !== turn.nodeRunId ||
        !sameDurableSession(t.originalSession, turn.originalSession) ||
        attempt.checkpoint?.committedPaths.some(file => !directory.authorizedPaths.includes(file))) continue;
      for (const operation of attempt.operations) {
        if (operation.expectedHead !== directory.head || operation.ownershipEpoch !== c.ownershipEpoch ||
          operation.status !== "finalized" || !["git.push", "pull.create", "pull.merge"].includes(operation.kind)) continue;
        const request = journal.recordedRequest(operation.id), binding = request?.nativeBinding;
        const source = request && database.eventByRequestId(c.projectId, `agent-native-binding:${request.invocationId}`);
        const bound = database.eventByRequestId(c.projectId, `scoped-worktree-closing-operation:${operation.id}`);
        if (!request || request.action.tool === "git_revert" || !binding || source?.type !== "agent.native_binding.opened" || !isDeepStrictEqual(source.payload.binding, binding) ||
          bound?.type !== "scoped.worktree_closing.operation.bound" || bound.invocationId !== t.invocationId ||
          bound.payload.operationId !== operation.id || bound.payload.operationPayloadHash !== operation.payloadHash ||
          bound.payload.executionId !== c.executionId || bound.payload.ownershipEpoch !== c.ownershipEpoch ||
          bound.payload.reportHeadSha !== turn.reportHeadSha || bound.payload.headSha !== directory.head || bound.payload.kind !== operation.kind ||
          request.invocationId !== t.invocationId || request.agentId !== c.agentId || request.executionId !== c.executionId ||
          binding.invocationId !== t.invocationId || binding.agentId !== c.agentId || binding.projectId !== c.projectId ||
          binding.runtimePath !== t.runtimePath || binding.worktreePath !== t.worktreePath ||
          binding.executionContext.role !== "delivery" || binding.executionContext.executionId !== c.executionId ||
          binding.executionContext.ownershipEpoch !== c.ownershipEpoch || binding.executionContext.groupRunId !== t.groupRunId ||
          binding.executionContext.nodeRunId !== t.nodeRunId || !sameDurableSession(binding.session, turn.originalSession) ||
          ({ git_push: "git.push", github_create_pr: "pull.create", github_merge_pr: "pull.merge", github_close_pr: "pull.close", github_update_pr: "pull.update" } as const)[request.action.tool] !== operation.kind ||
          "providerNumber" in request.action && request.action.providerNumber !== operation.remoteFact?.providerNumber ||
          request.action.tool === "github_create_pr" && request.action.base !== base) continue;
        const query = queryAgentGitOperation({ projectId: c.projectId, operationId: operation.id, repository,
          execution: { id: c.executionId, agentId: c.agentId, purpose: "delivery", ownershipEpoch: c.ownershipEpoch,
            executionBranch: t.executionBranch, worktreePath: t.worktreePath }, base,
          recordedOperation: id => database.recordedGitOperation(c.projectId, id), recordedRequest: journal.recordedRequest,
          recordedSynchronization: identity => database.scopedMergedSynchronization(identity, t.invocationId) });
        if (query.status !== "completed") continue;
        const receipts = attempt.results.filter(({ receipt, received }) => received && receipt.projectId === c.projectId &&
          receipt.agentId === c.agentId && receipt.invocationId === request.invocationId && receipt.callId === request.callId &&
          receipt.tool === request.action.tool && sameDurableSession(receipt.session, turn.originalSession) &&
          isDeepStrictEqual(receipt.executionContext, binding.executionContext) &&
          (!receipt.origin || receipt.origin.kind === "journal-observation" && receipt.origin.operationId === operation.id &&
            receipt.origin.status === query.status && receipt.origin.localStage === query.localStage) &&
          agentGitResultCoversOperation(receipt.result, query)).map(entry => entry.receipt.id);
        operations.push({ query, receipts });
      }
    }
    const push = operations.find(entry => entry.query.operation.kind === "git.push" && entry.receipts.length);
    const merges = operations.filter(entry => entry.query.operation.kind === "pull.merge" && entry.receipts.length && entry.query.localSynchronization);
    const ownCreate = (merge: typeof merges[number]) => operations.find(entry => entry.query.operation.kind === "pull.create" && entry.receipts.length &&
      entry.query.operation.remoteFact?.providerNumber === merge.query.operation.remoteFact?.providerNumber &&
      entry.query.operation.remoteFact?.id === merge.query.operation.remoteFact?.id);
    const merge = merges.find(entry => ownCreate(entry)) ?? merges[0];
    const create = merge && ownCreate(merge);
    if (!push) missing.push("exact independent B push and original-Session reception");
    if (!create) missing.push("exact independent B PR creation and original-Session reception");
    if (!merge) missing.push("exact independent B merge, local synchronization and original-Session reception");
    if (push && create && merge) {
      const remote = merge.query.operation.remoteFact!;
      supplement = { headSha: directory.head, pushOperationId: push.query.operation.id, createOperationId: create.query.operation.id,
        mergeOperationId: merge.query.operation.id, receiptIds: [...new Set([...push.receipts, ...create.receipts, ...merge.receipts])],
        pullRequest: { id: String(remote.id), providerNumber: Number(remote.providerNumber), htmlUrl: String(remote.htmlUrl),
          ownerExecutionId: c.executionId, head: turn.executionBranch, headSha: directory.head, base,
          status: "merged", mergeCommitSha: String(remote.mergeCommitSha), observedAt: String(remote.observedAt) },
        synchronization: merge.query.localSynchronization! };
    }
  }
  return missing.length ? { missing } : { missing, proof: { business: { report: report!, finish: finish!, pullRequest: a!, synchronization: sync! },
    ...(supplement ? { supplement } : {}) } };
}
