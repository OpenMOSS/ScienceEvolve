import type { AgentGitToolInput } from "./agent-git-tools.js";
import type { RemoteMergeSyncFact } from "./collaboration-git/contracts.js";
import { pushSupersessionProof } from "./collaboration-git/operation.js";
import { GitInputError } from "./collaboration-git/errors.js";

type QueryContext = Pick<AgentGitToolInput, "execution" | "base"> & {
  repository: Pick<AgentGitToolInput["repository"], "owner" | "name">;
  projectId: string;
  operationId: string;
  facts?: AgentGitToolInput["facts"];
};
type Readers = Pick<AgentGitToolInput, "recordedOperation" | "recordedRequest" | "recordedSynchronization">;
export type AgentGitOperationQueryInput = QueryContext & {
  [K in keyof Readers]: Readers[K] extends ((...args: infer A) => infer R) | undefined ? (...args: A) => Awaited<R> : never;
};

/** Gather immutable journal observations asynchronously, then validate them
 * with the same pure projection used inside database transactions. */
export async function readAgentGitOperation(input: QueryContext & Readers) {
  const operation = await input.recordedOperation?.(input.operationId);
  const request = await input.recordedRequest?.(input.operationId);
  const publicationId = operation?.status === "superseded" ? pushSupersessionProof(operation, input.repository).publicationOperationId : undefined;
  const publication = publicationId ? await input.recordedOperation?.(publicationId) : undefined;
  let synchronizationQuery: Parameters<NonNullable<Readers["recordedSynchronization"]>>[0] | undefined;
  const context = { ...input, recordedOperation: (id: string) => id === input.operationId ? operation : id === publicationId ? publication : undefined,
    recordedRequest: () => request, recordedSynchronization: (query: NonNullable<typeof synchronizationQuery>) => { synchronizationQuery = query; return undefined; } };
  const result = queryAgentGitOperation(context);
  if (!synchronizationQuery) return result;
  const synchronization = await input.recordedSynchronization?.(synchronizationQuery);
  return queryAgentGitOperation({ ...context, recordedSynchronization: () => synchronization });
}

/** Reads exact original journal facts without invoking Git/provider callbacks,
 * changing authority, or claiming delivery to the native Session. */
export function queryAgentGitOperation(input: AgentGitOperationQueryInput) {
  const { repository, execution, base } = input;
  const operation = input.recordedOperation?.(input.operationId);
  if (!operation) throw new GitInputError("The requested original Git operation is not recorded for this task");
  if (operation.id !== input.operationId || operation.ownerExecutionId !== execution.id ||
    !Number.isSafeInteger(operation.ownershipEpoch) || (operation.ownershipEpoch ?? 0) < 1 ||
    operation.ownershipEpoch! > execution.ownershipEpoch ||
    !["git.push", "git.revert", "pull.create", "pull.merge", "pull.close", "pull.update"].includes(operation.kind) ||
    !/^[0-9a-f]{40}$/i.test(operation.expectedHead ?? "") ||
    operation.expectedBase !== (["git.push", "git.revert"].includes(operation.kind) ? execution.executionBranch : base)) {
    throw new GitInputError("The requested Git operation differs from this original task's ownership, branch or direct target");
  }
  const remote = operation.remoteFact;
  if (operation.kind === "git.revert") {
    const request = input.recordedRequest?.(operation.id);
    if (request && (request.action.tool !== "git_revert" || request.action.mode !== "apply" ||
      request.operationId !== operation.id || request.projectId !== input.projectId || request.executionId !== execution.id ||
      request.ownershipEpoch !== operation.ownershipEpoch || request.executionBranch !== execution.executionBranch ||
      request.integrationTarget !== base || request.repository.owner !== repository.owner || request.repository.name !== repository.name ||
      request.expectedHead !== operation.expectedHead)) throw new Error("Recorded revert request differs from its original task and before-head");
    if (operation.status === "finalized" && (remote?.status !== "committed" || remote.operationId !== operation.id ||
      remote.beforeHead !== operation.expectedHead || !/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(String(remote.afterHead ?? "")))) {
      throw new Error("Recorded revert has no exact committed result");
    }
    return { operation, status: operation.status === "finalized" ? "completed" : operation.status === "failed" ? "failed" : "outcome_unknown",
      localStage: operation.status === "finalized" ? "revert_committed" : operation.status === "failed" ? String(remote?.status ?? "failed") : "revert_pending",
      ...(request ? { request } : {}) };
  }
  if (operation.status === "superseded") {
    const proof = pushSupersessionProof(operation, repository);
    const publication = input.recordedOperation?.(proof.publicationOperationId);
    const fact = publication?.remoteFact;
    if (!publication || publication.kind !== "git.push" || publication.status !== "finalized" ||
      publication.payloadHash !== proof.publicationPayloadHash || publication.ownerExecutionId !== operation.ownerExecutionId ||
      publication.ownershipEpoch !== operation.ownershipEpoch || publication.expectedBase !== operation.expectedBase ||
      publication.expectedHead !== proof.remote.sha || fact?.owner !== repository.owner || fact.repository !== repository.name ||
      fact.ref !== operation.expectedBase || fact.status !== "present" || fact.sha !== proof.remote.sha) {
      throw new Error("Superseded push has no matching later confirmed publication");
    }
  }
  const known = ["observed", "finalized"].includes(operation.status);
  // GitHub durably records creation before its asynchronous mergeability
  // check finishes. "unknown" here describes that PR's mergeability, not
  // whether the exact numbered PR was created. Keep the observed state;
  // never infer a successful merge or close from it.
  const pendingMergeability = ["pull.create", "pull.update"].includes(operation.kind) && remote?.status === "unknown";
  if (known && (!remote || remote.owner !== repository.owner || remote.repository !== repository.name ||
    (operation.kind === "git.push"
      ? remote.status !== "present" || remote.ref !== execution.executionBranch || remote.sha !== operation.expectedHead
      : remote.ownerExecutionId !== execution.id || remote.head !== execution.executionBranch ||
        remote.headSha !== operation.expectedHead || remote.base !== base ||
        !Number.isSafeInteger(remote.providerNumber) || Number(remote.providerNumber) < 1 ||
        !["open", "conflicted", "closed", "merged"].includes(String(remote.status)) && !pendingMergeability))) {
    throw new Error("Recorded Git operation has no matching authoritative remote result");
  }
  let synchronization: RemoteMergeSyncFact | undefined;
  const merged = known && operation.kind === "pull.merge" && remote?.status === "merged";
  if (merged) {
    if (!/^[0-9a-f]{40}$/i.test(String(remote.mergeCommitSha ?? "")))
      throw new Error("Recorded merged operation has no exact merge commit");
    synchronization = input.recordedSynchronization?.({ projectId: input.projectId, executionId: execution.id,
      ownershipEpoch: operation.ownershipEpoch!, providerNumber: Number(remote.providerNumber),
      expectedHead: operation.expectedHead!, expectedBase: base, expectedMergeCommitSha: String(remote.mergeCommitSha) });
    const prior = input.facts?.merged;
    if (!synchronization && prior?.ownerExecutionId === execution.id && prior.providerNumber === remote.providerNumber &&
      prior.headSha === operation.expectedHead && prior.base === base && prior.mergeCommitSha === remote.mergeCommitSha) {
      synchronization = prior.localSynchronization;
    }
    if (synchronization && (synchronization.projectId !== input.projectId ||
      synchronization.targetBranch !== base || synchronization.expectedSourceHead !== operation.expectedHead ||
      synchronization.mergeCommitSha !== remote.mergeCommitSha || synchronization.localHeadAfter !== synchronization.remoteHead ||
      !/^[0-9a-f]{40}$/i.test(synchronization.remoteHead) ||
      !["synchronized", "already_synchronized"].includes(synchronization.status))) {
      throw new Error("Recorded local synchronization differs from the original operation's exact merge facts");
    }
  }
  const localStage = merged && !synchronization ? "synchronization_pending"
    : known && operation.status !== "finalized" ? "journal_finalization_pending"
    : merged ? "synchronized" : "not_required";
  const status = operation.status === "superseded" ? "superseded" : operation.status === "failed" ? "failed" : !known ? "outcome_unknown"
    : localStage.endsWith("_pending") ? "remote_success_local_pending" : "completed";
  // A journal query transports original facts only. It never changes the
  // current published head, finalizes a journal, retries Git or releases a
  // task. The Agent decides whether to observe the provider or recover.
  const request = input.recordedRequest?.(operation.id);
  if (request && (request.operationId !== operation.id || request.projectId !== input.projectId ||
    request.executionId !== execution.id || request.ownershipEpoch !== operation.ownershipEpoch ||
    request.executionBranch !== execution.executionBranch || request.integrationTarget !== base ||
    request.repository.owner !== repository.owner || request.repository.name !== repository.name ||
    request.expectedHead !== undefined && request.expectedHead !== operation.expectedHead)) {
    throw new Error("Recorded original request differs from the queried Git operation");
  }
  return { operation, status, localStage, ...(request ? { request } : {}),
    ...(known && pendingMergeability ? { remoteStage: "pull_mergeability_pending" as const } : {}),
    ...(synchronization ? { localSynchronization: synchronization } : {}) };
}
