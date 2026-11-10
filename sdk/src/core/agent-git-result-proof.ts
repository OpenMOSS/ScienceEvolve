import { isDeepStrictEqual } from "node:util";
import type { readAgentGitOperation } from "./agent-git-operation-query.js";

type Query = Awaited<ReturnType<typeof readAgentGitOperation>>;
const object = (value: unknown): Record<string, unknown> | undefined =>
  value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;

/** Does an actual saved return contain the currently known exact result?
 * Caller/Session and native reception are separate mandatory checks. A
 * staging acknowledgement or an earlier partial result cannot cover a later
 * finalized journal or its completed local synchronization. */
export function agentGitResultCoversOperation(value: unknown, query: Query): boolean {
  const result = object(value), operation = query.operation, remote = operation.remoteFact;
  if (!result) return false;
  if (object(result.operation)) {
    return result.status === query.status && result.localStage === query.localStage &&
      isDeepStrictEqual(result.operation, operation) &&
      isDeepStrictEqual(result.localSynchronization, query.localSynchronization);
  }
  if (query.status !== "completed" || operation.status !== "finalized" || !remote) return false;
  if (operation.kind === "git.push") {
    const checkpoint = object(result.checkpoint), ref = object(result.remote);
    if (!checkpoint || !ref) return false;
    return ["pushed", "already_published"].includes(String(result.status)) &&
      checkpoint?.executionId === operation.ownerExecutionId && checkpoint.ownershipEpoch === operation.ownershipEpoch &&
      checkpoint.branch === operation.expectedBase && checkpoint.commitSha === operation.expectedHead &&
      ref?.status === "present" && ref.owner === remote.owner && ref.repository === remote.repository &&
      ref.ref === operation.expectedBase && ref.sha === operation.expectedHead;
  }
  const sameStatus = result.status === remote.status || operation.kind === "pull.create" &&
    query.remoteStage === "pull_mergeability_pending" && remote.status === "unknown" && result.status === "open";
  if (result.id !== remote.id || result.providerNumber !== remote.providerNumber ||
    result.ownerExecutionId !== operation.ownerExecutionId || result.head !== remote.head ||
    result.headSha !== operation.expectedHead || result.base !== operation.expectedBase || !sameStatus) return false;
  if (operation.kind !== "pull.merge") return true;
  const sync = object(result.localSynchronization), expected = query.localSynchronization;
  return result.status === "merged" && result.mergeCommitSha === remote.mergeCommitSha && Boolean(expected && sync &&
    ["projectId", "operationId", "targetBranch", "expectedSourceHead", "mergeCommitSha", "remoteHead", "localHeadAfter", "status"]
      .every(key => sync[key] === (expected as unknown as Record<string, unknown>)[key]));
}
