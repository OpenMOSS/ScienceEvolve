import { isDeepStrictEqual } from "node:util";
import type { CollaborationStateStore as CollaborationStateDatabase } from "./collaboration-state/database-worker.js";
import type { AgentNativeSessionBinding } from "./collaboration-state/contracts.js";
import { agentGitOperationJournal } from "./agent-git-operation-journal.js";
import { readAgentGitOperation } from "./agent-git-operation-query.js";
import { controlResultReceipts, sameDurableSession } from "./control-result-receipts.js";
import { validateSessionRef } from "./harness-runtime/session-ref.js";
import { OperationStoreViolationError } from "./collaboration-git/errors.js";
import type { AgentGitFacts } from "./agent-git-tools.js";

/** Capture already-known results at existing scheduling/input boundaries.
 * This reads original request/journal facts only: no provider, Git, retry,
 * business completion, new ownership, or native receipt is performed here. */
export async function captureKnownAgentGitResults(database: CollaborationStateDatabase, projectId: string): Promise<void> {
  const projection = await database.projectState(projectId);
  const repository = projection.git.repository;
  if (!repository) return;
  const journal = agentGitOperationJournal(database, projectId);
  const closingTurns = await database.scopedWorktreeClosingTurns(projectId);
  for (const operation of projection.operations) {
    if (!operation.ownerExecutionId || !["git.push", "git.revert", "pull.create", "pull.merge", "pull.close", "pull.update"].includes(operation.kind) ||
      !["observed", "finalized", "superseded"].includes(operation.status)) continue;
    const request = await journal.recordedRequest(operation.id);
    const binding = request?.nativeBinding;
    // Old records without captured provenance cannot acquire an invented
    // original caller/session. Canonical final publishers have their own
    // native ownership facts and are not ordinary delivery executions.
    const scoped = projection.scopedExecutions?.find(owner => owner.id === operation.ownerExecutionId);
    const legacy = projection.executions.find(owner => owner.id === operation.ownerExecutionId);
    const owner = scoped ? { ...scoped, purpose: "delivery" as const } : legacy;
    if (!request || !binding || !owner) continue;
    const source = await database.eventByRequestId(projectId, `agent-native-binding:${request.invocationId}`);
    const original = source?.payload.binding as unknown as AgentNativeSessionBinding | undefined;
    if (source?.type !== "agent.native_binding.opened" || !isDeepStrictEqual(original, binding) ||
      binding.projectId !== projectId || binding.agentId !== request.agentId || binding.agentId !== owner.agentId ||
      binding.invocationId !== request.invocationId || binding.worktreePath !== owner.worktreePath ||
      binding.executionContext.role === "leader" || binding.executionContext.role !== owner.purpose ||
      binding.executionContext.executionId !== owner.id || binding.executionContext.ownershipEpoch !== request.ownershipEpoch ||
      !Number.isSafeInteger(request.ownershipEpoch) || request.ownershipEpoch < 1 || request.ownershipEpoch > owner.ownershipEpoch ||
      !validateSessionRef(binding.session).valid || !binding.session.durable) continue;
    // A/B retain the same execution/epoch and native lineage. Select the
    // independent B synchronization only through its immutable operation
    // binding; neither an invocation name nor an old business receipt suffices.
    const closingBinding = await database.eventByRequestId(projectId, `scoped-worktree-closing-operation:${operation.id}`);
    const closing = closingTurns.find(turn => turn.invocationId === request.invocationId);
    if (closingBinding || closing) {
      if (!scoped || !closing || closingBinding?.type !== "scoped.worktree_closing.operation.bound" ||
        closingBinding.invocationId !== closing.invocationId || closingBinding.payload.operationId !== operation.id ||
        closingBinding.payload.operationPayloadHash !== operation.payloadHash ||
        closingBinding.payload.executionId !== owner.id || closingBinding.payload.ownershipEpoch !== request.ownershipEpoch ||
        closingBinding.payload.reportHeadSha !== closing.reportHeadSha || closingBinding.payload.headSha !== operation.expectedHead ||
        closingBinding.payload.kind !== operation.kind ||
        closing.executionId !== owner.id || closing.ownershipEpoch !== request.ownershipEpoch || closing.agentId !== request.agentId ||
        closing.runtimePath !== binding.runtimePath || closing.worktreePath !== binding.worktreePath ||
        closing.nodeRunId !== binding.executionContext.nodeRunId || closing.groupRunId !== binding.executionContext.groupRunId ||
        closing.executionBranch !== request.executionBranch || !sameDurableSession(closing.originalSession, binding.session)) {
        throw new OperationStoreViolationError("Late closing result differs from its separate original invocation binding");
      }
    }
    const base = await database.executionPullBase(projectId, owner.id);
    const savedFacts = legacy ? (await database.eventByRequestId(projectId,
      `agent-git-fact:${owner.id}:${request.ownershipEpoch}:${request.callId}`)) : undefined;
    const facts = savedFacts?.type === "execution.agent_git.fact" && savedFacts.executionId === owner.id &&
      savedFacts.ownershipEpoch === request.ownershipEpoch && savedFacts.agentId === request.agentId
      ? savedFacts.payload.facts as AgentGitFacts : undefined;
    const result = await readAgentGitOperation({ projectId, operationId: operation.id, repository, execution: owner, base,
      ...(facts ? { facts } : {}),
      recordedOperation: async id => await database.recordedGitOperation(projectId, id), recordedRequest: journal.recordedRequest,
      ...(scoped ? { recordedSynchronization: async query => await database.scopedMergedSynchronization(query, closing?.invocationId) } : {}) });
    if (({ git_push: "git.push", github_create_pr: "pull.create", github_merge_pr: "pull.merge",
      github_close_pr: "pull.close", github_update_pr: "pull.update", git_revert: "git.revert" } as const)[request.action.tool] !== operation.kind ||
      "providerNumber" in request.action && request.action.providerNumber !== operation.remoteFact?.providerNumber ||
      request.action.tool === "github_create_pr" && request.action.base !== undefined && request.action.base !== base) {
      throw new OperationStoreViolationError("Late journal result differs from its original Agent Git action");
    }
    await controlResultReceipts(database, { projectId, agentId: binding.agentId, invocationId: binding.invocationId,
      session: binding.session, executionContext: binding.executionContext }).recordJournalResult(request, result);
  }
}
