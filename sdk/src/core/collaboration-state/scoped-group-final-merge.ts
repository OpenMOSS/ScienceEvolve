import type { RemoteMergeSyncFact } from "../collaboration-git/contracts.js";
import { mergedPullSynchronizationOperationId } from "../collaboration-git/operation.js";
import type { CompleteScopedGroupInput, ScopedFinalPullEvidence } from "./contracts.js";
import { CollaborationStateError } from "./errors.js";

type MergedGroupPull = ScopedFinalPullEvidence & { status: "merged"; headSha: string; mergeCommitSha: string };

export function assertScopedFinalPullUrl(htmlUrl: string): void {
  let url: URL;
  try {
    url = new URL(htmlUrl);
  } catch {
    throw new CollaborationStateError("INVALID_STATE_TRANSITION", "Scoped final PR requires a valid HTTPS URL");
  }
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new CollaborationStateError("INVALID_STATE_TRANSITION", "Scoped final PR requires a credential-free HTTPS URL");
  }
}

export function assertScopedFinalPullTarget(
  pull: ScopedFinalPullEvidence, groupBranch: string, integrationTarget: string
): asserts pull is MergedGroupPull {
  if (pull.status !== "merged" || pull.head !== groupBranch || pull.base !== integrationTarget ||
    !pull.headSha || !pull.mergeCommitSha ||
    !/^[0-9a-f]{40}$/i.test(pull.headSha) || !/^[0-9a-f]{40}$/i.test(pull.mergeCommitSha)) {
    throw new CollaborationStateError("INVALID_STATE_TRANSITION", "Scoped final PR must merge the canonical group branch into its direct parent target");
  }
}

export function assertScopedFinalSynchronization(
  owner: Pick<CompleteScopedGroupInput, "projectId" | "executionId" | "ownershipEpoch">,
  pull: MergedGroupPull,
  sync: RemoteMergeSyncFact
): void {
  const operationId = mergedPullSynchronizationOperationId(
    owner.executionId, owner.ownershipEpoch, pull.headSha, pull.base, pull.mergeCommitSha
  );
  if (sync.projectId !== owner.projectId || sync.operationId !== operationId ||
    sync.targetBranch !== pull.base || sync.expectedSourceHead !== pull.headSha ||
    sync.mergeCommitSha !== pull.mergeCommitSha || sync.remoteHead !== sync.localHeadAfter ||
    !/^[0-9a-f]{40}$/i.test(sync.remoteHead) ||
    !["synchronized", "already_synchronized"].includes(sync.status)) {
    throw new CollaborationStateError("INVALID_STATE_TRANSITION", "Scoped final PR requires exact local synchronization of its parent target");
  }
}
