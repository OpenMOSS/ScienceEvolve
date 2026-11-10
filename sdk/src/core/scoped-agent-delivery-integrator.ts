import type { CollaborationGitFacade } from "./collaboration-git/facade.js";
import type { GitExecutionAuthority, GitHubPullRequestFact, GitHubRepositoryFact } from "./collaboration-git/contracts.js";
import { GitInputError, OperationStoreViolationError } from "./collaboration-git/errors.js";
import { mergedPullSynchronizationOperationId } from "./collaboration-git/operation.js";
import type { CollaborationStateStore as CollaborationStateDatabase } from "./collaboration-state/database-worker.js";
import { CollaborationStateError } from "./collaboration-state/errors.js";
import type { CompletedScopedAgentArrival, ScopedExecutionRecord } from "./collaboration-state/contracts.js";

export type ScopedAgentDeliveryGit = Pick<CollaborationGitFacade,
  "observeRemoteRef" | "createPullRequest" | "mergePullRequest" | "reconcileMergedPullRequest">;

export interface IntegrateScopedAgentDeliveryInput {
  projectId: string;
  executionId: string;
  ownershipEpoch: number;
  repository: GitHubRepositoryFact;
  /** Report/checkpoint already pushed by the trusted worker execution path. */
  expectedHeadSha?: string;
  selectedWeakTarget?: string;
  signal?: AbortSignal;
}

export type ScopedAgentDeliveryResult =
  | { status: "completed"; completion: CompletedScopedAgentArrival }
  | { status: "waiting_for_pull"; execution: ScopedExecutionRecord; pullRequest: GitHubPullRequestFact };

/** A trusted Git-only delivery phase after the worker's turn/report. It reuses
 * the existing facade, never invokes a model or creates/replaces its session,
 * and releases the Agent queue only after the direct group is synchronized. */
export class ScopedAgentDeliveryIntegrator {
  private readonly inFlight = new Set<string>();

  constructor(private readonly database: CollaborationStateDatabase, private readonly git: ScopedAgentDeliveryGit,
    private readonly options: { agentOwnsGit?: boolean } = {}) {}

  async integrate(input: IntegrateScopedAgentDeliveryInput): Promise<ScopedAgentDeliveryResult> {
    const key = JSON.stringify([input.projectId, input.executionId]);
    if (this.inFlight.has(key)) {
      throw new CollaborationStateError("INVALID_STATE_TRANSITION", "Scoped Agent delivery is already in progress");
    }
    this.inFlight.add(key);
    try { return await this.performIntegration(input); }
    finally { this.inFlight.delete(key); }
  }

  private async performIntegration(input: IntegrateScopedAgentDeliveryInput): Promise<ScopedAgentDeliveryResult> {
    input.signal?.throwIfAborted();
    const execution = await this.database.scopedExecution(input.projectId, input.executionId);
    if (!execution || execution.ownershipEpoch !== input.ownershipEpoch) {
      throw new CollaborationStateError("INVALID_STATE_TRANSITION", "Scoped Agent execution ownership is stale or missing");
    }
    const projection = await this.database.projectState(input.projectId);
    const binding = projection.git.repository;
    if (!projection.git.enabled || projection.git.status !== "ready" || !binding ||
      binding.owner !== input.repository.owner || binding.name !== input.repository.name ||
      binding.private !== input.repository.private || binding.defaultBranch !== input.repository.defaultBranch) {
      throw new GitInputError("Scoped Agent delivery must use its project's ready, pinned repository");
    }
    if (this.options.agentOwnsGit) {
      const owner = execution;
      const delivery = await this.database.scopedAgentGitDeliveryStatus(input.projectId, owner.id, owner.ownershipEpoch, input.expectedHeadSha, true);
      const supervision = await this.database.executionSupervisionResult(input.projectId, owner.id);
      if (delivery.missingActions.length || supervision && supervision.outcome !== "resolved") {
        return { status: "completed", completion: await this.database.completeScopedAgentArrival({
          projectId: input.projectId, arrivalRequestId: owner.arrivalRequestId, executionId: owner.id,
          ownershipEpoch: owner.ownershipEpoch, selectedWeakTarget: input.selectedWeakTarget }) };
      }
    }
    if (!input.expectedHeadSha || !/^[0-9a-f]{40}$/i.test(input.expectedHeadSha)) throw new GitInputError("Scoped Agent delivery requires an exact reported head SHA");
    const group = await this.database.scopedGroupRun(input.projectId, execution.groupRunId);
    if (!group) throw new OperationStoreViolationError("Scoped Agent delivery has no direct group");
    if (execution.status === "completed") {
      const proof = projection.scopedAgentMerges?.find((fact) => fact.executionId === execution.id);
      if (!proof || proof.pullRequest.headSha !== input.expectedHeadSha) {
        throw new OperationStoreViolationError("Completed scoped delivery has no matching head and merge proof");
      }
      return { status: "completed", completion: await this.database.completeScopedAgentArrivalAfterMerge({
        projectId: input.projectId, arrivalRequestId: execution.arrivalRequestId,
        executionId: execution.id, ownershipEpoch: execution.ownershipEpoch,
        pullRequest: proof.pullRequest, synchronization: proof.synchronization,
        selectedWeakTarget: input.selectedWeakTarget
      }) };
    }
    const arrival = (await this.database.scopedArrivals(group.id)).find((item) => item.requestId === execution.arrivalRequestId);
    if (!arrival) throw new OperationStoreViolationError("Scoped Agent delivery lost its arrival");
    // Validate weak/strong routing before any remote observation or PR.
    // The later SQLite completion commits the same decision atomically.
    await this.database.previewScopedArrivalRoute(input.projectId, arrival.requestId, input.selectedWeakTarget);
    const report = await this.database.scopedAgentReport(input.projectId, execution.id, execution.ownershipEpoch);
    if (!report || report.selectedWeakTarget !== input.selectedWeakTarget) {
      throw new OperationStoreViolationError("Scoped Agent delivery requires its persisted model report and exact route decision");
    }
    if (report.headSha) await this.database.bindScopedAgentReportHead({
      projectId: input.projectId, executionId: execution.id, ownershipEpoch: execution.ownershipEpoch,
      headSha: input.expectedHeadSha
    });
    const authority: GitExecutionAuthority = { ...execution, purpose: "delivery" };
    const store = this.database.operationsForProject(input.projectId, true);
    await store.assertExecutionOwnership({
      projectId: input.projectId, executionId: execution.id, ownershipEpoch: execution.ownershipEpoch,
      expectedBranch: execution.executionBranch, operation: "provider.mutate"
    });
    const ref = await this.git.observeRemoteRef(input.repository, execution.executionBranch, input.signal);
    const retainedPull = await this.database.scopedRecoveryPull(input.projectId, execution.id, execution.ownershipEpoch);
    const recoveredPull = retainedPull?.headSha === input.expectedHeadSha ? retainedPull : undefined;
    input.signal?.throwIfAborted();
    if (ref.ref !== execution.executionBranch || (ref.status !== "present" && !(ref.status === "missing" && recoveredPull?.status === "merged")) ||
      ref.status === "present" && ref.sha !== input.expectedHeadSha ||
      ref.owner !== input.repository.owner || ref.repository !== input.repository.name) {
      throw new GitInputError("Scoped Agent delivery requires the exact pushed execution branch head");
    }
    await this.database.bindScopedAgentReportHead({
      projectId: input.projectId, executionId: execution.id, ownershipEpoch: execution.ownershipEpoch,
      headSha: input.expectedHeadSha
    });
    const operationStem = `scoped-delivery-${execution.id}-epoch-${execution.ownershipEpoch}-${input.expectedHeadSha}`;
    const common = {
      repository: input.repository, execution: authority, ownershipEpoch: execution.ownershipEpoch,
      expectedHead: input.expectedHeadSha, signal: input.signal
    };
    const discoveredPullRecord = await this.database.scopedAgentRecordedDeliveryPull(input.projectId,
      execution.id, execution.ownershipEpoch, input.expectedHeadSha);
    const discoveredPull: GitHubPullRequestFact | undefined = discoveredPullRecord?.headSha ? {
      ...discoveredPullRecord,
      owner: input.repository.owner,
      repository: input.repository.name,
      headSha: discoveredPullRecord.headSha,
      checks: (discoveredPullRecord.checks ?? []).map((check) => ({ ...check }))
    } : undefined;
    if (this.options.agentOwnsGit && !recoveredPull && !discoveredPull) {
      throw new GitInputError("Agent must explicitly call github_create_pr before delivery can continue");
    }
    const pull = recoveredPull?.status === "merged" ? recoveredPull : discoveredPull ?? await this.git.createPullRequest({
      ...common, operationId: `${operationStem}-create`, base: group.groupBranch,
      title: `Agent ${execution.agentId} delivery to ${group.groupId}`,
      body: `OpenFARS scoped Agent delivery\nGroup run: ${group.id}\nArrival: ${arrival.requestId}`
    });
    input.signal?.throwIfAborted();
    this.assertPull(input, execution, group.groupBranch, pull);
    if (!["open", "merged"].includes(pull.status)) return { status: "waiting_for_pull", execution, pullRequest: pull };
    if (this.options.agentOwnsGit) {
      const synchronized = await this.database.scopedMergedSynchronization({
        projectId: input.projectId, executionId: execution.id, ownershipEpoch: execution.ownershipEpoch,
        providerNumber: pull.providerNumber, expectedHead: input.expectedHeadSha,
        expectedBase: group.groupBranch, expectedMergeCommitSha: pull.mergeCommitSha ?? ""
      });
      if (!synchronized) throw new OperationStoreViolationError("Agent-owned merged PR has no exact local synchronization fact");
      return { status: "completed", completion: await this.database.completeScopedAgentArrivalAfterMerge({
        projectId: input.projectId, arrivalRequestId: execution.arrivalRequestId,
        executionId: execution.id, ownershipEpoch: execution.ownershipEpoch,
        pullRequest: pull, synchronization: synchronized,
        selectedWeakTarget: input.selectedWeakTarget
      }) };
    }
    const merged = recoveredPull?.status === "merged" ? recoveredPull : await this.git.mergePullRequest({
      ...common, operationId: `${operationStem}-merge`, providerNumber: pull.providerNumber,
      expectedBase: group.groupBranch
    });
    input.signal?.throwIfAborted();
    this.assertPull(input, execution, group.groupBranch, merged);
    if (merged.id !== pull.id || merged.providerNumber !== pull.providerNumber) {
      throw new OperationStoreViolationError("Scoped Agent merge changed the canonical PR identity");
    }
    if (merged.status !== "merged") return { status: "waiting_for_pull", execution, pullRequest: merged };
    if (!/^[0-9a-f]{40}$/i.test(merged.mergeCommitSha ?? "")) {
      throw new OperationStoreViolationError("Scoped Agent merge has no exact merge commit");
    }
    const retainedSync = await this.database.scopedMergedSynchronization({
      projectId: input.projectId, executionId: execution.id, ownershipEpoch: execution.ownershipEpoch,
      providerNumber: merged.providerNumber, expectedHead: input.expectedHeadSha,
      expectedBase: group.groupBranch, expectedMergeCommitSha: merged.mergeCommitSha!
    });
    const synchronized = retainedSync ? { ...merged, localSynchronization: retainedSync } : await this.git.reconcileMergedPullRequest({
      ...common,
      operationId: mergedPullSynchronizationOperationId(execution.id, execution.ownershipEpoch,
        input.expectedHeadSha, group.groupBranch, merged.mergeCommitSha!),
      providerNumber: merged.providerNumber, expectedBase: group.groupBranch,
      expectedMergeCommitSha: merged.mergeCommitSha
    });
    input.signal?.throwIfAborted();
    this.assertPull(input, execution, group.groupBranch, synchronized);
    if (synchronized.id !== merged.id || synchronized.providerNumber !== merged.providerNumber ||
      synchronized.status !== "merged" || synchronized.mergeCommitSha !== merged.mergeCommitSha ||
      !synchronized.localSynchronization) {
      throw new OperationStoreViolationError("Scoped Agent delivery requires confirmed local synchronization of the same PR");
    }
    return { status: "completed", completion: await this.database.completeScopedAgentArrivalAfterMerge({
      projectId: input.projectId, arrivalRequestId: execution.arrivalRequestId,
      executionId: execution.id, ownershipEpoch: execution.ownershipEpoch,
      pullRequest: synchronized, synchronization: synchronized.localSynchronization,
      selectedWeakTarget: input.selectedWeakTarget
    }) };
  }

  private assertPull(input: IntegrateScopedAgentDeliveryInput, execution: ScopedExecutionRecord,
    base: string, pull: GitHubPullRequestFact): void {
    if (pull.ownerExecutionId !== execution.id || pull.head !== execution.executionBranch ||
      pull.headSha !== input.expectedHeadSha || pull.base !== base ||
      pull.owner !== input.repository.owner || pull.repository !== input.repository.name || !pull.id ||
      !Number.isSafeInteger(pull.providerNumber) || pull.providerNumber <= 0) {
      throw new OperationStoreViolationError("Scoped Agent PR must match its execution, reported head and direct group target");
    }
  }
}
