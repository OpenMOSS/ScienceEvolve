import assert from "node:assert/strict";
import type { ControlActionEnvelope, OperationRecord } from "./types.js";
import type { SynchronizedPullRequestFact } from "./collaboration-git/facade.js";
import { agentGitOperationId } from "./agent-git-tools.js";
import { consumeAcceptanceFault, readBoundAcceptanceArm, type AcceptanceBoundary } from "./acceptance-controller.js";

/** Optional acceptance seam at the return of an Agent-requested merge. The
 * ordinary provider/journal/synchronization path has already succeeded. Agents
 * decide whether to inspect or replay; this controller never retries business,
 * changes its result, edits a project database or releases runtime authority. */
export async function withholdR12MergeResponse(input: AcceptanceBoundary & {
  envelope: ControlActionEnvelope; result: unknown; operation?: OperationRecord; directory?: string;
}): Promise<void> {
  const { envelope, execution } = input;
  if (envelope.action.tool !== "github_merge_pr" || envelope.projectId !== execution.projectId ||
    envelope.agent !== execution.agentId || envelope.stateVersion !== execution.ownershipEpoch) return;
  const bound = await readBoundAcceptanceArm({ ...input, case: "R12", variant: "merge-response-lost",
    invocationId: envelope.invocationId, boundaryAt: envelope.receivedAt,
    directory: input.directory ?? process.env.OPENFARS_R12_FAULT_DIRECTORY });
  if (!bound) return;
  const { arm } = bound, target = arm.target;
  const operationId = await agentGitOperationId({ execution, envelope,
    recordedOperation: id => input.operation?.id === id ? input.operation : undefined }, "merge");
  const op = input.operation;
  if (!op || op.id !== operationId || op.kind !== "pull.merge" || op.status !== "finalized" ||
    op.ownerExecutionId !== execution.id || op.ownershipEpoch !== execution.ownershipEpoch) return;
  const merged = input.result as SynchronizedPullRequestFact | undefined;
  // Conflicts, uncertain provider outcomes and missing synchronization are real
  // results, never a successful injection. Bind only the exact validated PR.
  if (!merged || merged.status !== "merged" || !merged.localSynchronization) return;
  const sync = merged.localSynchronization;
  assert.ok(merged.ownerExecutionId === execution.id && merged.head === target.branch && merged.base === target.base &&
    merged.owner === target.repository.owner && merged.repository === target.repository.name &&
    op.expectedHead === merged.headSha && op.expectedBase === merged.base &&
    Number.isSafeInteger(merged.providerNumber) && merged.providerNumber > 0 &&
    (envelope.action.providerNumber === undefined || envelope.action.providerNumber === merged.providerNumber) &&
    /^[a-f0-9]{40}$/.test(merged.headSha ?? "") && /^[a-f0-9]{40}$/.test(merged.mergeCommitSha ?? "") &&
    sync.projectId === arm.projectId && sync.targetBranch === target.base && sync.expectedSourceHead === merged.headSha &&
    sync.mergeCommitSha === merged.mergeCommitSha && sync.localHeadAfter === sync.remoteHead &&
    ["synchronized", "already_synchronized"].includes(sync.status), "R12 merge receipt does not match its bound delivery");
  const error = new Error(`ETIMEDOUT: github_merge_pr response unavailable (operation ${operationId}); inspect the PR or replay your original request.`);
  error.name = "TimeoutError";
  if (await consumeAcceptanceFault(bound, { status: "response-withheld", callId: envelope.callId, operationId,
    providerNumber: merged.providerNumber, operation: op, result: merged, returnedError: { name: error.name, message: error.message },
    observationLimit: "The tool trace must separately prove that the Agent received this error and chose its follow-up." })) throw error;
}
