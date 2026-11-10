import type { CollaborationGitFacade, SynchronizedPullRequestFact } from "./collaboration-git/facade.js";
import type { GitGroupFinalAuthority, GitHubPullRequestFact, GitHubRepositoryFact } from "./collaboration-git/contracts.js";
import { GitInputError, OperationStoreViolationError } from "./collaboration-git/errors.js";
import { mergedPullSynchronizationOperationId } from "./collaboration-git/operation.js";
import type { CollaborationStateStore as CollaborationStateDatabase } from "./collaboration-state/database-worker.js";
import type { CompletedScopedGroup, ScopedFinalIntegrationRecord } from "./collaboration-state/contracts.js";
import { CollaborationStateError } from "./collaboration-state/errors.js";

export type ScopedGroupFinalGit = Pick<CollaborationGitFacade,
  "observeRemoteRef" | "createGroupFinalPullRequest" | "mergeGroupFinalPullRequest" | "reconcileGroupFinalPullRequest"> &
  Partial<Pick<CollaborationGitFacade, "checkpointGroupCompletion">>;

export interface IntegrateScopedGroupInput {
  projectId: string;
  groupRunId: string;
  repository: GitHubRepositoryFact;
  /** A child group's weak successor must be selected before publishing. */
  selectedWeakTarget?: string;
  integrationOwnerAgentId?: string;
  deferCompletion?: boolean;
  signal?: AbortSignal;
}

export type ScopedGroupIntegrationResult =
  | { status: "completed"; completion: CompletedScopedGroup }
  | { status: "awaiting_completion"; integration: ScopedFinalIntegrationRecord; pullRequest?: GitHubPullRequestFact }
  | { status: "waiting_for_pull"; integration: ScopedFinalIntegrationRecord; pullRequest: GitHubPullRequestFact };

/** Gates canonical final delivery on real provider and synchronization facts.
 * Production invokes the assigned Agent; legacy callers retain their pipeline. */
export class ScopedGroupFinalIntegrator {
  private readonly inFlight = new Map<string, Promise<ScopedGroupIntegrationResult>>();

  constructor(private readonly database: CollaborationStateDatabase, private readonly git: ScopedGroupFinalGit,
    private readonly options: { invokeAgent?: (integration: ScopedFinalIntegrationRecord, input: IntegrateScopedGroupInput) => Promise<SynchronizedPullRequestFact | undefined> } = {}) {}

  integrate(input: IntegrateScopedGroupInput): Promise<ScopedGroupIntegrationResult> {
    // A concurrent retry must not turn one group owner into two publishers.
    // The database/provider journals remain the crash/restart authority.
    const key = JSON.stringify([input.projectId, input.groupRunId]);
    if (this.inFlight.has(key)) {
      return Promise.reject(new CollaborationStateError("INVALID_STATE_TRANSITION", "Scoped final integration is already in progress"));
    }
    const pending = this.performIntegration(input).finally(() => { this.inFlight.delete(key); });
    this.inFlight.set(key, pending);
    return pending;
  }

  private async performIntegration(input: IntegrateScopedGroupInput): Promise<ScopedGroupIntegrationResult> {
    input.signal?.throwIfAborted();
    const group = await this.database.scopedGroupRun(input.projectId, input.groupRunId);
    if (!group) throw new CollaborationStateError("RECORD_NOT_FOUND", "Scoped GroupRun does not exist");
    const projection = await this.database.projectState(input.projectId);
    const binding = projection.git.repository;
    if (!projection.git.enabled || projection.git.status !== "ready" || !binding ||
      binding.owner !== input.repository.owner || binding.name !== input.repository.name ||
      binding.private !== input.repository.private || binding.defaultBranch !== input.repository.defaultBranch) {
      throw new GitInputError("Scoped group integration must use its project's ready, pinned repository");
    }
    if (group.status === "completed") {
      const proof = projection.scopedGroupFinalMerges?.find((fact) => fact.groupRunId === group.id);
      if (!proof) throw new OperationStoreViolationError("Completed scoped group has no final merge proof");
      const owner = await this.database.scopedFinalIntegration(input.projectId, group.id);
      return { status: "completed", completion: await this.database.completeScopedGroupAfterFinalMerge({
        projectId: input.projectId, groupRunId: group.id,
        executionId: owner?.id ?? `group-final-${group.id}`, ownershipEpoch: owner?.ownershipEpoch ?? 1,
        pullRequest: { ...proof.pullRequest, ownerExecutionId: owner?.id ?? `group-final-${group.id}` },
      synchronization: proof.synchronization, selectedWeakTarget: input.selectedWeakTarget
      }) };
    }
    if (!(await this.database.scopedGroupReadyForFinalIntegration(input.projectId, group.id))) {
      throw new CollaborationStateError("INVALID_STATE_TRANSITION", "Scoped group has unfinished or failed necessary paths");
    }
    const requested = await this.database.scopedGroupIntegrationRequest(input.projectId, group.id);
    if (input.integrationOwnerAgentId !== undefined && requested?.integrationOwnerAgentId !== input.integrationOwnerAgentId) {
      throw new CollaborationStateError("INVALID_STATE_TRANSITION", "Final integration owner differs from the Leader's durable request");
    }
    if (!requested && input.deferCompletion) {
      throw new CollaborationStateError("INVALID_STATE_TRANSITION", "Final integration requires an explicit Leader request");
    }
    // Resolve the child's parent route before any remote mutation. Do not
    // merge its final PR and only then discover a missing/invalid decision.
    if (group.parentGroupRunId && group.parentArrivalRequestId) {
      const parent = await this.database.scopedGroupRun(input.projectId, group.parentGroupRunId);
      const arrival = (await this.database.scopedArrivals(group.parentGroupRunId))
        .find((item) => item.requestId === group.parentArrivalRequestId);
      if (!parent || !arrival) throw new OperationStoreViolationError("Child integration lost its parent arrival");
      await this.database.previewScopedArrivalRoute(input.projectId, arrival.requestId, input.selectedWeakTarget);
    } else if (input.selectedWeakTarget !== undefined) {
      throw new GitInputError("A root group has no in-group successor decision");
    }
    const retainedOwner = await this.database.scopedFinalIntegration(input.projectId, group.id);
    if (retainedOwner && group.status === "integrating") await this.database.beginScopedFinalIntegration({
      projectId: input.projectId, groupRunId: group.id, expectedHeadSha: retainedOwner.expectedHeadSha
    });
    let ref = await this.git.observeRemoteRef(input.repository, group.groupBranch, input.signal);
    input.signal?.throwIfAborted();
    if (ref.ref !== group.groupBranch || ref.status !== "present" || !ref.sha || !/^[0-9a-f]{40}$/i.test(ref.sha) ||
      (retainedOwner && group.status === "integrating" && ref.sha !== retainedOwner.expectedHeadSha)) {
      throw new GitInputError("Scoped final integration requires its exact provider-confirmed canonical group head");
    }
    const { integration } = await this.database.beginScopedFinalIntegration({
      projectId: input.projectId, groupRunId: group.id, expectedHeadSha: ref.sha!
    });
    const execution: GitGroupFinalAuthority = {
      id: integration.id, groupRunId: group.id, ownershipEpoch: integration.ownershipEpoch,
      executionBranch: integration.executionBranch, purpose: "group-final-integration"
    };
    const common = {
      repository: input.repository, execution, ownershipEpoch: execution.ownershipEpoch,
      expectedHead: integration.expectedHeadSha, signal: input.signal
    };
    const recovered = await this.database.scopedFinalRecoveryPull(input.projectId, execution.id, execution.ownershipEpoch);
    const operationPrefix = execution.ownershipEpoch === 1 ? execution.id : `${execution.id}-epoch-${execution.ownershipEpoch}`;
    const agentResult = this.options.invokeAgent ? await this.options.invokeAgent(integration, input) : undefined;
    if (this.options.invokeAgent && (!agentResult || (await this.database.executionSupervisionResult(input.projectId, integration.id))?.outcome !== "resolved")) {
      if (!(await this.database.executionSupervisionResult(input.projectId, integration.id))) {
        throw new OperationStoreViolationError("Final Agent returned without a delivery result or supervision record");
      }
      return { status: "awaiting_completion", integration, ...(agentResult ? { pullRequest: agentResult } : {}) };
    }
    const pull = agentResult ?? (recovered?.status === "merged" ? recovered : await this.git.createGroupFinalPullRequest({
      ...common, operationId: `${operationPrefix}-create`, base: integration.integrationTarget,
      title: `Integrate group ${group.groupId} into ${integration.integrationTarget}`,
      body: `OpenFARS canonical group integration\nGroup run: ${group.id}\nWorkflow revision: ${group.workflowRevision}`
    }));
    input.signal?.throwIfAborted();
    this.assertPull(execution, integration, pull, input.repository);
    if (!["open", "merged"].includes(pull.status)) return { status: "waiting_for_pull", integration, pullRequest: pull };
    // Even if create replays an already-merged PR, use the journaled merge
    // observation to establish the narrower reconciliation capability.
    const merged = agentResult ?? (recovered?.status === "merged" ? recovered : await this.git.mergeGroupFinalPullRequest({
      ...common, operationId: `${operationPrefix}-merge`, providerNumber: pull.providerNumber,
      expectedBase: integration.integrationTarget
    }));
    input.signal?.throwIfAborted();
    this.assertPull(execution, integration, merged, input.repository);
    if (merged.id !== pull.id || merged.providerNumber !== pull.providerNumber) {
      throw new OperationStoreViolationError("Scoped final merge changed the canonical PR identity");
    }
    if (merged.status !== "merged") return { status: "waiting_for_pull", integration, pullRequest: merged };
    if (!merged.mergeCommitSha || !/^[0-9a-f]{40}$/i.test(merged.mergeCommitSha)) {
      throw new OperationStoreViolationError("Scoped final PR merge has no exact merge commit");
    }
    const retainedSync = await this.database.scopedMergedSynchronization({
      projectId: input.projectId, executionId: execution.id, ownershipEpoch: execution.ownershipEpoch,
      providerNumber: merged.providerNumber, expectedHead: integration.expectedHeadSha,
      expectedBase: integration.integrationTarget, expectedMergeCommitSha: merged.mergeCommitSha
    });
    if (agentResult && !agentResult.localSynchronization && !retainedSync) throw new OperationStoreViolationError("Agent final merge has no exact local synchronization proof");
    const synchronized: SynchronizedPullRequestFact = agentResult?.localSynchronization ? agentResult : retainedSync ? { ...merged, localSynchronization: retainedSync } : await this.git.reconcileGroupFinalPullRequest({
      ...common,
      operationId: mergedPullSynchronizationOperationId(execution.id, execution.ownershipEpoch,
        integration.expectedHeadSha, integration.integrationTarget, merged.mergeCommitSha),
      providerNumber: merged.providerNumber, expectedBase: integration.integrationTarget,
      expectedMergeCommitSha: merged.mergeCommitSha
    });
    input.signal?.throwIfAborted();
    this.assertPull(execution, integration, synchronized, input.repository);
    if (synchronized.id !== merged.id || synchronized.providerNumber !== merged.providerNumber) {
      throw new OperationStoreViolationError("Scoped final synchronization changed the canonical PR identity");
    }
    if (synchronized.status !== "merged" || synchronized.mergeCommitSha !== merged.mergeCommitSha ||
      !synchronized.localSynchronization) {
      throw new OperationStoreViolationError("Scoped final PR requires confirmed local synchronization before completion");
    }
    const completionInput = {
      projectId: input.projectId, groupRunId: group.id,
      executionId: execution.id, ownershipEpoch: execution.ownershipEpoch,
      pullRequest: synchronized, synchronization: synchronized.localSynchronization,
      selectedWeakTarget: input.selectedWeakTarget
    };
    if (input.deferCompletion) {
      await this.database.completeScopedGroupAfterFinalMerge({ ...completionInput, deferCompletion: true });
      return { status: "awaiting_completion", integration, pullRequest: synchronized };
    }
    return { status: "completed", completion: await this.database.completeScopedGroupAfterFinalMerge(completionInput) };
  }

  private assertPull(
    execution: GitGroupFinalAuthority, integration: ScopedFinalIntegrationRecord,
    pull: GitHubPullRequestFact, repository: GitHubRepositoryFact
  ): void {
    if (pull.ownerExecutionId !== execution.id || pull.head !== execution.executionBranch ||
      pull.headSha !== integration.expectedHeadSha || pull.base !== integration.integrationTarget ||
      pull.owner !== repository.owner || pull.repository !== repository.name || !pull.id ||
      !Number.isSafeInteger(pull.providerNumber) || pull.providerNumber <= 0) {
      throw new OperationStoreViolationError("Scoped final PR observation does not match its owner, head and direct parent target");
    }
  }
}
