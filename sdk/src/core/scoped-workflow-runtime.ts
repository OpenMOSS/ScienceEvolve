import { createHash } from "node:crypto";
import path from "node:path";
import { transientHarnessFailure, type HarnessRuntimeError } from "./harness-runtime/errors.js";
import type { CollaborationGitFacade } from "./collaboration-git/facade.js";
import type { GitHubRepositoryFact } from "./collaboration-git/contracts.js";
import { OperationStoreViolationError } from "./collaboration-git/errors.js";
import type { CollaborationStateStore as CollaborationStateDatabase } from "./collaboration-state/database-worker.js";
import { CollaborationStateError } from "./collaboration-state/errors.js";
import type { ActivatedScopedGroup, ActivateScopedGroupInput, ScopedGroupRunRecord } from "./collaboration-state/contracts.js";
import { validateScopedWorkflowContract } from "./scoped-workflow-contract.js";
import { ScopedAgentDeliveryIntegrator, type ScopedAgentDeliveryGit } from "./scoped-agent-delivery-integrator.js";
import { ScopedGroupFinalIntegrator, type ScopedGroupFinalGit } from "./scoped-group-final-integrator.js";
import type { ScopedAgentExecutionRunner } from "./scoped-agent-execution.js";
import type { AgentOrchestrationTemplate } from "./types.js";
import { scopedGroupOutput } from "./scoped-group-output.js";
import { redactTrace } from "./utils.js";

export type ScopedWorkflowGit = ScopedAgentDeliveryGit & ScopedGroupFinalGit & Pick<CollaborationGitFacade, "beginGroup">;
export type ActivateRuntimeScopedGroupInput = Omit<ActivateScopedGroupInput, "baseCommit"> & {
  repository: GitHubRepositoryFact; signal?: AbortSignal
};
export interface AdvanceScopedWorkflowInput {
  projectId: string;
  rootGroupRunId: string;
  repository: GitHubRepositoryFact;
  signal?: AbortSignal;
}
export interface ScopedRuntimeIssue {
  kind: "failure" | "waiting_for_pull" | "waiting_for_route" | "waiting_for_management" | "waiting_for_workflow_adjustment";
  /** Persisted group incidents are technical failures awaiting recovery;
   * temporary queue/management occupancy remains an ordinary wait. */
  severity?: "failure" | "waiting";
  groupRunId: string;
  executionId?: string;
  arrivalRequestId?: string;
  message: string;
  /** Internal scheduler evidence; never inferred from a displayed message. */
  transientFailure?: HarnessRuntimeError;
}
export interface ScopedRuntimeAdvanceResult {
  status: "completed" | "waiting";
  groupRun: ScopedGroupRunRecord;
  issues: ScopedRuntimeIssue[];
}

export interface ScopedWorkflowManagement {
  planGroup(group: ScopedGroupRunRecord): Promise<void>;
  resolveChildRoute(parent: ScopedGroupRunRecord, child: ScopedGroupRunRecord, arrivalRequestId: string): Promise<void>;
  resolveRootRoute?(group: ScopedGroupRunRecord, nodeRunId: string, candidates: readonly string[], output: string): Promise<void>;
  completeGroup?(group: ScopedGroupRunRecord): Promise<void>;
  recoverGroup?(group: ScopedGroupRunRecord, arrivalRequestIds: string[]): Promise<void>;
  recoverGlobal?(root: ScopedGroupRunRecord): Promise<void>;
  continueSkipped?(group: ScopedGroupRunRecord, arrivalRequestId: string): Promise<void>;
}

export class ScopedManagementDeferredError extends Error {
  constructor() { super("Management is queued behind this Agent's current invocation or management capacity"); this.name = "ScopedManagementDeferredError"; }
}

function isScopedManagementOccupancy(error: unknown): error is CollaborationStateError {
  return error instanceof CollaborationStateError && error.code === "ACTIVE_NODE_CONFLICT" &&
    error.details.reason === "management-occupancy";
}

function stableIdentity(prefix: string, parts: string[]): string {
  return `${prefix}-${createHash("sha256").update(JSON.stringify(parts)).digest("hex")}`;
}

/** Recursive graph pump composed from the existing SQLite FIFO, native/report
 * executor and trusted Git integrators. It does not replace any model, session,
 * provider or management-control implementation. Root routing remains Main's
 * separate atomic responsibility even after the root's final PR is synced. */
export class ScopedWorkflowRuntime {
  private readonly activeProjects = new Set<string>();
  private readonly targets = new Map<string, Promise<unknown>>();
  private readonly members: ScopedAgentDeliveryIntegrator;
  private readonly finals: ScopedGroupFinalIntegrator;

  constructor(private readonly database: CollaborationStateDatabase, private readonly git: ScopedWorkflowGit,
    private readonly agents: Pick<ScopedAgentExecutionRunner, "prepareDelivery">,
    private readonly projectPath: (projectId: string) => string,
    private readonly onProgress?: (projectId: string) => Promise<void>,
    private readonly management?: ScopedWorkflowManagement,
    private readonly options: { agentOwnsGit?: boolean; beforeAdmission?: () => Promise<void>;
      invokeFinalAgent?: ConstructorParameters<typeof ScopedGroupFinalIntegrator>[2] } = {}) {
    this.members = new ScopedAgentDeliveryIntegrator(database, git, { agentOwnsGit: options.agentOwnsGit });
    this.finals = new ScopedGroupFinalIntegrator(database, git, options.invokeFinalAgent);
  }

  activateGroup(input: ActivateRuntimeScopedGroupInput): Promise<ActivatedScopedGroup> {
    return this.withProject(input.projectId, async () => this.performActivation(input));
  }

  advance(input: AdvanceScopedWorkflowInput): Promise<ScopedRuntimeAdvanceResult> {
    return this.withProject(input.projectId, async () => this.performAdvance(input));
  }

  private async withProject<T>(projectId: string, action: () => Promise<T>): Promise<T> {
    if (this.activeProjects.has(projectId)) {
      throw new CollaborationStateError("INVALID_STATE_TRANSITION", "Scoped project graph pump is already in progress");
    }
    this.activeProjects.add(projectId);
    try { return await action(); }
    finally { this.activeProjects.delete(projectId); }
  }

  private async assertRepository(projectId: string, repository: GitHubRepositoryFact): Promise<void> {
    await this.database.assertScopedRuntimeAuthority(projectId);
    const projection = await this.database.projectState(projectId);
    const binding = projection.git.repository;
    if (!projection.git.enabled || projection.git.status !== "ready" || !binding ||
      binding.owner !== repository.owner || binding.name !== repository.name ||
      binding.private !== repository.private || binding.defaultBranch !== repository.defaultBranch) {
      throw new OperationStoreViolationError("Scoped graph runtime requires its ready, pinned repository");
    }
    if (projection.frozen) throw new CollaborationStateError("PROJECT_FROZEN", "Scoped project authority is frozen");
  }

  /** Serialize only mutations of the same canonical integration target.
   * Native turns and work on other targets remain genuinely concurrent. */
  private async atTarget<T>(projectId: string, branch: string, action: () => Promise<T>): Promise<T> {
    const key = JSON.stringify([projectId, branch]);
    const previous = this.targets.get(key) ?? Promise.resolve();
    const pending = previous.catch(() => undefined).then(action);
    this.targets.set(key, pending);
    try { return await pending; }
    finally { if (this.targets.get(key) === pending) this.targets.delete(key); }
  }

  private async performActivation(input: ActivateRuntimeScopedGroupInput): Promise<ActivatedScopedGroup> {
    input.signal?.throwIfAborted();
    await this.assertRepository(input.projectId, input.repository);
    const retained = await this.database.scopedGroupRun(input.projectId, input.groupRunId);
    if (retained) {
      const replay = await this.database.activateScopedGroup({ ...input, baseCommit: retained.baseCommit });
      await this.onProgress?.(input.projectId);
      return replay;
    }
    await this.options.beforeAdmission?.();
    // S admits and reserves atomically, including a proven original legacy
    // birth. An async precheck cannot grant or replace this ownership.
    const prepared = await this.database.prepareScopedGroupActivation(input, input.expectedRevision);
    input = { ...input, ...prepared.input, workflowRevision: prepared.workflowRevision, expectedRevision: undefined };
    const target = prepared.integrationTarget;
    const revalidate = async () => {
      const current = await this.database.prepareScopedGroupActivation(input);
      input = { ...input, workflowRevision: current.workflowRevision, expectedRevision: undefined };
      if (current.integrationTarget !== target || (await this.preflightActivation(input)) !== target)
        throw new OperationStoreViolationError("Original scoped activation changed its direct integration target");
    };
    return this.atTarget(input.projectId, target, async () => {
      input.signal?.throwIfAborted();
      await revalidate();
      const branch = `groups/${input.groupRunId}`;
      const operationId = `scoped-group-begin-${input.groupRunId}`;
      const operation = (await this.database.projectState(input.projectId)).operations.find((item) => item.id === operationId);
      let baseCommit: string;
      if (operation) {
        if (operation.kind !== "git.push" || operation.ownerExecutionId || operation.expectedBase !== branch ||
          !/^[0-9a-f]{40}$/i.test(operation.expectedHead ?? "")) {
          throw new OperationStoreViolationError("Scoped branch birth journal has another authority");
        }
        baseCommit = operation.expectedHead!;
      } else {
        const retainedBranch = await this.git.observeRemoteRef(input.repository, branch, input.signal);
        if (retainedBranch.status !== "missing" || retainedBranch.ref !== branch ||
          retainedBranch.owner !== input.repository.owner || retainedBranch.repository !== input.repository.name) {
          throw new OperationStoreViolationError("Scoped branch already exists without its trusted birth journal");
        }
        const base = await this.git.observeRemoteRef(input.repository, target, input.signal);
        if (base.status !== "present" || base.ref !== target || !/^[0-9a-f]{40}$/i.test(base.sha ?? "") ||
          base.owner !== input.repository.owner || base.repository !== input.repository.name) {
          throw new OperationStoreViolationError("Scoped branch birth requires the current direct integration target head");
        }
        baseCommit = base.sha!;
      }
      // Remote observations may outlive a lease, freeze or parent activation.
      // Revalidate before even creating the local canonical branch.
      await revalidate();
      input.signal?.throwIfAborted();
      let begun: Awaited<ReturnType<CollaborationGitFacade["beginGroup"]>>;
      try {
        begun = await this.git.beginGroup({ repository: input.repository, groupRunId: input.groupRunId,
          baseCommit, integrationTarget: target, operationId, signal: input.signal });
      } catch (error) {
        if (!input.signal?.aborted) {
          const reason = redactTrace(error instanceof Error ? error.message : "Scoped group branch initialization failed").trim().slice(0, 1_000);
          if (input.parentGroupRunId && input.parentArrivalRequestId) {
            await this.database.recordScopedGroupIssue({ projectId: input.projectId, groupRunId: input.parentGroupRunId,
              kind: "initialization", arrivalRequestId: input.parentArrivalRequestId, operationId, reason });
          } else {
            await this.database.recordScopedInitializationFailure({ projectId: input.projectId, groupRunId: input.groupRunId,
              operationId, reason });
          }
          await this.onProgress?.(input.projectId);
        }
        throw error;
      }
      input.signal?.throwIfAborted();
      if (begun.group.branch !== branch || begun.group.baseCommit !== baseCommit ||
        begun.remote.status !== "present" || begun.remote.ref !== branch || begun.remote.sha !== baseCommit ||
        begun.remote.owner !== input.repository.owner || begun.remote.repository !== input.repository.name) {
        throw new OperationStoreViolationError("Scoped branch birth changed its canonical branch or exact base");
      }
      // Input is not persisted/dispatchable until canonical branch creation and
      // the provider push are confirmed. A crash reuses the birth operation.
      await revalidate();
      const activated = await this.database.activateScopedGroup({ ...input, baseCommit,
        expectedRevision: (await this.database.projectState(input.projectId)).stateRevision });
      if (input.parentGroupRunId && input.parentArrivalRequestId) {
        await this.database.resolveScopedGroupIssueIfPresent(input.projectId, input.parentGroupRunId, "initialization",
          "Scoped group branch initialization succeeded; the existing operation and branch were reused", input.parentArrivalRequestId);
      } else {
        await this.database.resolveScopedInitializationFailure(input.projectId, operationId);
      }
      await this.onProgress?.(input.projectId);
      return activated;
    });
  }

  private async preflightActivation(input: ActivateRuntimeScopedGroupInput): Promise<string> {
    await this.assertRepository(input.projectId, input.repository);
    const projection = await this.database.projectState(input.projectId);
    if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(input.groupRunId) ||
      (input.expectedRevision !== undefined && input.expectedRevision !== projection.stateRevision)) {
      throw new CollaborationStateError("INVALID_STATE_TRANSITION", "Scoped activation identity or state revision is stale");
    }
    const snapshot = await this.database.workflowSnapshot(input.projectId, input.workflowRevision) as {
      schemaVersion?: number; agents?: Array<{ name: string }>; scopedWorkflow?: unknown
    };
    if (snapshot.schemaVersion !== 3 || !Array.isArray(snapshot.agents)) {
      throw new CollaborationStateError("INVALID_STATE_TRANSITION", "Scoped activation requires a v3 snapshot");
    }
    const contract = validateScopedWorkflowContract(snapshot.scopedWorkflow, new Set(snapshot.agents.map((agent) => agent.name)));
    const definition = contract.groups.find((entry) => entry.id === input.groupId);
    const parent = input.parentGroupRunId ? (await this.database.scopedGroupRun(input.projectId, input.parentGroupRunId)) : undefined;
    if (!definition || definition.parentGroupId !== parent?.groupId || (input.parentGroupRunId && !parent)) {
      throw new CollaborationStateError("INVALID_STATE_TRANSITION", "Scoped activation must belong to its direct parent snapshot");
    }
    if (parent) {
      await this.database.assertScopedGroupActive(input.projectId, parent.id);
      const arrival = (await this.database.scopedArrivals(parent.id)).find((item) => item.requestId === input.parentArrivalRequestId);
      if (input.outer || input.activationRequestId !== input.parentArrivalRequestId || parent.status !== "running" ||
        parent.workflowRevision !== input.workflowRevision || arrival?.status !== "queued" ||
        arrival.targetKind !== "collaboration" || arrival.childGroupId !== input.groupId) {
        throw new CollaborationStateError("INVALID_STATE_TRANSITION", "Scoped child activation requires its queued direct parent arrival");
      }
      return parent.groupBranch;
    }
    if (input.parentArrivalRequestId || !input.outer || projection.activeNodeRunId ||
      projection.workflowRevision !== input.workflowRevision ||
      !snapshot.agents.some((agent) => agent.name === input.outer!.activatedByAgentId) ||
      (projection.scopedGroupRuns ?? []).some((group) => !group.parentGroupRunId &&
        !["completed", "cancelled", "failed"].includes(group.status))) {
      throw new CollaborationStateError("ACTIVE_NODE_CONFLICT", "Scoped root activation requires its current empty outer slot");
    }
    return "main";
  }

  private async performAdvance(input: AdvanceScopedWorkflowInput): Promise<ScopedRuntimeAdvanceResult> {
    await this.assertRepository(input.projectId, input.repository);
    const root = await this.database.scopedGroupRun(input.projectId, input.rootGroupRunId);
    if (!root || root.parentGroupRunId) throw new CollaborationStateError("INVALID_STATE_TRANSITION", "Scoped pump requires a project root GroupRun");
    const attempted = new Set<string>();
    const deferred = new Map<string, number>();
    const pending = new Map<string, Promise<void>>();
    const issues: ScopedRuntimeIssue[] = [];
    const recoveryKey = async (groupRunId: string, candidate: Awaited<ReturnType<CollaborationStateDatabase["scopedRecoveryCandidates"]>>[number], globalMain = false) => {
      const attempts = (await this.database.scopedManagementFailures(input.projectId, true)).filter(failure =>
        failure.groupRunId === groupRunId && failure.globalMain === globalMain && failure.purpose === "recover" &&
        failure.failedArrivalRequestId === candidate.failedArrivalRequestId && failure.ownershipEpoch === candidate.ownershipEpoch &&
        (candidate.incidentId ? failure.incidentId === candidate.incidentId : failure.executionId === candidate.executionId));
      // A stopped manager's existing finite failure budget must reach its
      // declared next attempt/escalation in this pump. An unchanged candidate
      // alone used to suppress that step when no parallel arrival deferred it.
      // Only durable failure attempts change this key; a new revision, native
      // invocation or service writer cannot replenish either repair budget.
      const attempt = Math.max(0, ...attempts.map(failure => failure.attempt));
      return `${candidate.executionId ?? "issue"}:${candidate.incidentId ?? "none"}:${candidate.ownershipEpoch}${candidate.coordinationRevision ? `:coordination:${candidate.coordinationRevision}` : ""}:management:${attempt}`;
    };
    const schedule = async (key: string, groupRunId: string, action: () => Promise<void>, executionId?: string, arrivalRequestId?: string) => {
      if (attempted.has(key) && !(deferred.has(key) && (await this.database.projectState(input.projectId)).stateRevision > deferred.get(key)!)) return;
      attempted.add(key);
      const job = Promise.resolve().then(action).catch(async (error) => {
        if (error instanceof ScopedManagementDeferredError || isScopedManagementOccupancy(error) ||
          error instanceof CollaborationStateError && error.code === "WORKFLOW_ADJUSTMENT_PENDING") {
          deferred.set(key, (await this.database.projectState(input.projectId)).stateRevision);
          if (error instanceof CollaborationStateError && error.code === "WORKFLOW_ADJUSTMENT_PENDING") {
            if (!issues.some(issue => issue.kind === "waiting_for_workflow_adjustment" && issue.groupRunId === groupRunId && issue.arrivalRequestId === arrivalRequestId))
              issues.push({ kind: "waiting_for_workflow_adjustment", groupRunId, arrivalRequestId, message: error.message });
            return;
          }
          if (arrivalRequestId && !issues.some((issue) => issue.arrivalRequestId === arrivalRequestId && issue.kind === "waiting_for_management")) {
            issues.push({ kind: "waiting_for_management", groupRunId, arrivalRequestId,
              message: "Scoped arrival is queued behind an overlapping management turn; it will resume after the turn releases" });
          }
          return;
        }
        issues.push({ kind: "failure", severity: "failure", groupRunId, executionId, arrivalRequestId,
          ...(transientHarnessFailure(error) ? { transientFailure: transientHarnessFailure(error) } : {}),
          message: error instanceof Error ? redactTrace(error.message).trim().slice(0, 1_000) : "Scoped runtime phase failed" });
      }).finally(() => { pending.delete(key); });
      pending.set(key, job);
    };
    try {
      while (true) {
        input.signal?.throwIfAborted();
        await this.assertRepository(input.projectId, input.repository);
        await this.options.beforeAdmission?.();
        const projection = await this.database.projectState(input.projectId);
        const groups: ScopedGroupRunRecord[] = [];
        for (const group of projection.scopedGroupRuns ?? []) {
          if (await this.isDescendant(input.projectId, group, root.id)) groups.push(group);
        }
        const groupById = new Map(groups.map((group) => [group.id, group]));
        const unplanned = new Set<string>();
        if (this.management) for (const group of groups) {
          if (group.status !== "running" || (await this.database.scopedGroupPlan(input.projectId, group.id))) continue;
          unplanned.add(group.id);
          const planIssue = (await this.database.scopedGroupIssues(input.projectId)).find((issue) => issue.groupRunId === group.id && issue.kind === "plan");
          if (planIssue) {
            const candidate = (await this.database.scopedRecoveryCandidates(input.projectId, group.id)).find((item) => item.incidentId === planIssue.id);
            if (!candidate || (await this.database.scopedManagementRecoveryBlocked(input.projectId, group.id, candidate))) continue;
          }
          if ((await this.database.scopedManagementSupervisionEnded(input.projectId, group.id, "plan"))) continue;
          await schedule(`plan:${group.id}:${group.workflowRevision}:${planIssue?.id ?? "initial"}:${(await this.database.scopedGroupIssueGeneration(input.projectId, group.id))}`, group.id, async () => this.management!.planGroup(group));
        }
        const arrivals = (projection.scopedArrivals ?? []).filter((arrival) => groupById.has(arrival.groupRunId))
          .sort((a, b) => a.sequence - b.sequence);
        for (const arrival of arrivals) {
          const group = groupById.get(arrival.groupRunId)!;
          if (group.status !== "running" || arrival.status !== "queued" || unplanned.has(group.id)) continue;
          const managementBlocked = await this.database.scopedManagementBlocksBusiness(input.projectId, group.id);
          if (managementBlocked && !issues.some((issue) => issue.arrivalRequestId === arrival.requestId && issue.kind === "waiting_for_management")) {
            issues.push({ kind: "waiting_for_management", groupRunId: group.id, arrivalRequestId: arrival.requestId,
              message: "Scoped arrival is queued behind an overlapping management turn; it will resume after the turn releases" });
          }
          if ((await this.database.scopedGroupIssues(input.projectId)).some((issue) => issue.groupRunId === group.id &&
            issue.kind === "initialization" && issue.arrivalRequestId === arrival.requestId)) continue;
          if (!arrival.pathContext && (await this.database.scopedGroupWorkflow(input.projectId, group.id)).loops?.length) {
            if (!attempted.has(`path:${arrival.requestId}`)) {
              attempted.add(`path:${arrival.requestId}`);
              issues.push({ kind: "failure", severity: "failure", groupRunId: group.id, arrivalRequestId: arrival.requestId,
                message: "Legacy Loop arrival has no proven path counters; management reconciliation is required" });
            }
            continue;
          }
          if (arrival.targetKind === "collaboration") {
            await schedule(`child:${arrival.requestId}`, group.id, async () => {
              if ((await this.database.scopedManagementBlocksBusiness(input.projectId, group.id))) {
                throw new ScopedManagementDeferredError();
              }
              await this.performActivation({ projectId: input.projectId,
                groupRunId: stableIdentity("scoped-group", [input.projectId, arrival.requestId]), groupId: arrival.childGroupId!,
                activationRequestId: arrival.requestId, workflowRevision: group.workflowRevision,
                parentGroupRunId: group.id, parentArrivalRequestId: arrival.requestId,
                repository: input.repository, signal: input.signal });
            }, undefined, arrival.requestId);
          } else {
            await this.database.claimScopedAgentArrival({ projectId: input.projectId, arrivalRequestId: arrival.requestId,
              agentId: arrival.agentId!, executionId: stableIdentity("scoped-exec", [input.projectId, arrival.requestId]),
              worktreePath: path.join(path.resolve(this.projectPath(input.projectId)), "git-worktrees", "agents", arrival.agentId!) });
            const waiting = await this.database.workflowAdjustmentAdmission(input.projectId, { agentId: arrival.agentId, groupRunId: group.id,
              scopedNode: { groupId: group.groupId, nodeId: arrival.targetNodeId, activeLoopIds: Object.keys(arrival.pathContext?.loops ?? {}) } });
            if (waiting && !issues.some(issue => issue.arrivalRequestId === arrival.requestId && issue.kind === "waiting_for_workflow_adjustment"))
              issues.push({ kind: "waiting_for_workflow_adjustment", groupRunId: group.id, arrivalRequestId: arrival.requestId,
                message: `等待用户修改在受影响后续任务派发前重新评估：${waiting.requestId}` });
          }
        }
        const claimed = (await this.database.projectState(input.projectId)).scopedExecutions ?? [];
        const interruptedOwners = new Set((await this.database.scopedGroupIssues(input.projectId))
          .filter(issue => issue.kind === "mechanism" && issue.interruptedOperationIds?.length)
          .map(issue => `${issue.executionId}:${issue.ownershipEpoch}`));
        for (const execution of claimed) {
          const group = groupById.get(execution.groupRunId);
          if (!group || group.status !== "running" || unplanned.has(group.id) || !["running", "integrating"].includes(execution.status)) continue;
          // The stopped unreported owner still holds its Git/FIFO lease.
          // Only its manager's exact released retry may reserve the original
          // session; repeatedly dispatching it here would fail recovery again.
          if (interruptedOwners.has(`${execution.id}:${execution.ownershipEpoch}`)) continue;
          const continuation = await this.database.scopedAgentReportContinuation(input.projectId, execution.id, execution.ownershipEpoch);
          await schedule(`worker:${execution.id}:${execution.ownershipEpoch}${continuation
            ? `:coordinated:${continuation.envelope.invocationId}:${continuation.envelope.callId}` : ""}`, group.id, async () => {
            if ((await this.database.scopedManagementBlocksBusiness(input.projectId, group.id))) {
              throw new ScopedManagementDeferredError();
            }
            const prepared = await this.agents.prepareDelivery({ projectId: input.projectId, executionId: execution.id,
              ownershipEpoch: execution.ownershipEpoch, repository: input.repository, signal: input.signal,
              withGroupBase: (branch, action) => this.atTarget(input.projectId, branch, action) });
            const result = await this.atTarget(input.projectId, group.groupBranch, async () => this.members.integrate({
              projectId: input.projectId, repository: input.repository, signal: input.signal, ...prepared }));
            if (result.status === "waiting_for_pull") issues.push({ kind: "waiting_for_pull", groupRunId: group.id,
              executionId: execution.id, arrivalRequestId: execution.arrivalRequestId,
              message: `Member PR ${result.pullRequest.providerNumber} remains ${result.pullRequest.status}` });
            if (result.status === "waiting_for_pull" && result.pullRequest.status === "conflicted" && this.management) {
              await this.database.failScopedAgentArrival({ projectId: input.projectId, executionId: execution.id, ownershipEpoch: execution.ownershipEpoch,
                arrivalRequestId: execution.arrivalRequestId, residentStopConfirmed: true, reason: "Owned PR conflict requires scoped Leader coordination and retained-branch repair" });
            }
            await this.onProgress?.(input.projectId);
          }, execution.id, execution.arrivalRequestId);
        }
        for (const group of groups.reverse()) {
          if (!["running", "integrating"].includes(group.status) ||
            !(await this.database.scopedGroupReadyForFinalIntegration(input.projectId, group.id))) continue;
          if (group.parentGroupRunId && group.parentArrivalRequestId) {
            const parentWorkflow = await this.database.scopedGroupWorkflow(input.projectId, group.parentGroupRunId);
            const parentArrival = (await this.database.scopedArrivals(group.parentGroupRunId)).find((arrival) => arrival.requestId === group.parentArrivalRequestId)!;
            if ((parentWorkflow.routes[parentArrival.targetNodeId] ?? []).some((edge) => edge.kind === "weak")) {
              if (!(await this.database.scopedArrivalRouteDecision(input.projectId, parentArrival.requestId))) {
                if (this.management) {
                  const parent = groupById.get(group.parentGroupRunId!)!;
                  if (!(await this.database.scopedGroupIssues(input.projectId)).some((issue) => issue.groupRunId === parent.id && issue.arrivalRequestId === parentArrival.requestId))
                    await schedule(`route:${group.id}:${(await this.database.scopedGroupIssueGeneration(input.projectId, parent.id))}`, parent.id, async () => {
                      try { await this.management!.resolveChildRoute(parent, group, parentArrival.requestId); }
                      catch (error) { if (!(error instanceof ScopedManagementDeferredError)) await this.database.recordScopedGroupIssue({ projectId: input.projectId, groupRunId: parent.id,
                        kind: "route", arrivalRequestId: parentArrival.requestId, reason: error instanceof Error ? redactTrace(error.message) : "Child route management failed" }); throw error; }
                    });
                } else if (!attempted.has(`route:${group.id}`)) {
                attempted.add(`route:${group.id}`);
                issues.push({ kind: "waiting_for_route", groupRunId: group.id,
                  arrivalRequestId: parentArrival.requestId, message: "Child group requires its formally persisted local management route decision" });
                }
                continue;
              }
            }
          }
          const integrationRequest = await this.database.scopedGroupIntegrationRequest(input.projectId, group.id);
          const finalProof = await this.database.scopedGroupFinalMergeFact(input.projectId, group.id);
          const finalReturned = await this.database.scopedFinalTaskReturned(input.projectId, group.id);
          if (this.management?.resolveRootRoute && !group.parentGroupRunId && (finalProof || finalReturned)) {
            const snapshot = await this.database.workflowSnapshot(input.projectId, group.workflowRevision) as AgentOrchestrationTemplate;
            const definition = snapshot.scopedWorkflow?.groups.find((entry) => entry.id === group.groupId);
            const edges = snapshot.routes?.[group.groupId] ?? [];
            const weakTargets = edges.filter((edge) => edge.kind === "weak").map((edge) => edge.target);
            const outerNode = (await this.database.projectState(input.projectId)).nodeRuns.find((node) => node.activationRequestId === group.activationRequestId);
            if (definition?.decisionBy === "agent" && weakTargets.length && outerNode &&
              !(await this.database.scopedRootRouteDecision(input.projectId, outerNode.id))) {
              await schedule(`root-route:${group.id}:${(await this.database.scopedGroupIssueGeneration(input.projectId, group.id))}`, group.id,
                async () => this.management!.resolveRootRoute!(group, outerNode.id, weakTargets, scopedGroupOutput((await this.database.projectState(input.projectId)), group.id)));
              continue;
            }
          }
          if (this.management && !integrationRequest && !finalProof && !finalReturned) {
            if ((await this.database.scopedManagementSupervisionEnded(input.projectId, group.id, "complete"))) continue;
            if (!this.management.completeGroup) {
              issues.push({ kind: "waiting_for_management", groupRunId: group.id,
                message: "Scoped group reached Finish and requires an explicit Leader integration decision" });
              continue;
            }
            await schedule(`complete-decision:${group.id}:${(await this.database.scopedGroupIssueGeneration(input.projectId, group.id))}`, group.id,
              () => this.management!.completeGroup!(group));
            continue;
          }
          if (this.management && (finalProof || finalReturned) && group.status !== "completed") {
            if ((await this.database.scopedManagementSupervisionEnded(input.projectId, group.id, "complete"))) continue;
            if (!this.management.completeGroup) {
              issues.push({ kind: "waiting_for_management", groupRunId: group.id,
                message: "Scoped group final merge is recorded and requires the Leader's complete_group decision" });
              continue;
            }
            await schedule(`complete-decision:${group.id}:${(await this.database.scopedGroupIssueGeneration(input.projectId, group.id))}:${finalProof?.recordedAt ?? "returned"}`, group.id,
              () => this.management!.completeGroup!(group));
            continue;
          }
          if ((await this.database.scopedGroupIssues(input.projectId)).some((issue) => issue.groupRunId === group.id && issue.kind === "final")) continue;
          await schedule(`final:${group.id}:${(await this.database.scopedGroupIssueGeneration(input.projectId, group.id))}:${integrationRequest?.integrationOwnerAgentId ?? "legacy"}`, group.id, async () => {
            if ((await this.database.scopedManagementBlocksBusiness(input.projectId, group.id))) {
              throw new ScopedManagementDeferredError();
            }
            const result = await this.atTarget(input.projectId, group.integrationTarget, async () => this.finals.integrate({
              projectId: input.projectId, groupRunId: group.id, repository: input.repository, signal: input.signal,
              deferCompletion: Boolean(this.management),
              integrationOwnerAgentId: integrationRequest?.integrationOwnerAgentId,
              selectedWeakTarget: group.parentArrivalRequestId
                ? (await this.database.scopedArrivalRouteDecision(input.projectId, group.parentArrivalRequestId))?.targetNodeId : undefined })).catch(async (error) => {
                  if (this.management && !input.signal?.aborted && !(error instanceof ScopedManagementDeferredError)) await this.database.recordScopedGroupIssue({ projectId: input.projectId, groupRunId: group.id, kind: "final",
                    reason: error instanceof Error ? redactTrace(error.message) : "Canonical final Git delivery failed" });
                  throw error;
                });
            if (result.status === "waiting_for_pull") issues.push({ kind: "waiting_for_pull", groupRunId: group.id,
              message: `Group final PR ${result.pullRequest.providerNumber} remains ${result.pullRequest.status}` });
            if (result.status === "waiting_for_pull" && this.management && ["conflicted", "closed"].includes(result.pullRequest.status))
              await this.database.recordScopedGroupIssue({ projectId: input.projectId, groupRunId: group.id, kind: "final", reason: `Canonical final PR ${result.pullRequest.providerNumber} is ${result.pullRequest.status}` });
            await this.onProgress?.(input.projectId);
          });
        }
        if (this.management?.recoverGroup) for (const group of groups) {
          const candidates = (await this.database.scopedRecoveryCandidates(input.projectId, group.id))
            .filter((candidate) => candidate.kind !== "plan" && (group.status !== "completed" || candidate.kind === "worktree-closing"));
          const failed: typeof candidates = [], blocked: typeof candidates = [], recoveryKeys: string[] = [];
          for (const candidate of candidates) {
            if (await this.database.scopedManagementRecoveryBlocked(input.projectId, group.id, candidate)) blocked.push(candidate);
            else if (!candidate.pendingOperation) {
              failed.push(candidate); recoveryKeys.push(await recoveryKey(group.id, candidate));
            }
          }
          if ((["running", "integrating"].includes(group.status) || (await this.database.scopedCompletedGroupClosingActive(input.projectId, group.id))) && failed.length) await schedule(`recovery:${group.id}:${recoveryKeys.join(":")}`,
            group.id, () => this.management!.recoverGroup!(group, failed.map((candidate) => candidate.arrivalRequestId)));
          for (const candidate of blocked) {
            if (!attempted.has(`recovery-blocked:${group.id}:${candidate.failedArrivalRequestId}`)) {
              attempted.add(`recovery-blocked:${group.id}:${candidate.failedArrivalRequestId}`);
              issues.push({ kind: "waiting_for_management", groupRunId: group.id,
                arrivalRequestId: candidate.arrivalRequestId,
                message: "Scoped management recovery budget exhausted; retained technical failure awaits an explicit decision" });
            }
          }
        }
        const globalCandidates: Awaited<ReturnType<CollaborationStateDatabase["scopedRecoveryCandidates"]>> = (await this.database.scopedRecoveryCandidates(input.projectId, root.id, true))
          .filter((candidate) => candidate.kind !== "plan");
        const globalRecoveries: typeof globalCandidates = [], globalBlocked: typeof globalCandidates = [], globalRecoveryKeys: string[] = [];
        for (const candidate of globalCandidates) {
          if (await this.database.scopedManagementRecoveryBlocked(input.projectId, root.id, candidate, true)) globalBlocked.push(candidate);
          else if (!candidate.pendingOperation) {
            globalRecoveries.push(candidate); globalRecoveryKeys.push(await recoveryKey(root.id, candidate, true));
          }
        }
        if (this.management?.recoverGlobal && globalRecoveries.length)
          await schedule(`global-recovery:${root.id}:${globalRecoveryKeys.join(":")}`,
            root.id, async () => this.management!.recoverGlobal!((await this.database.scopedGroupRun(input.projectId, root.id))!));
        for (const candidate of globalBlocked) {
          if (!attempted.has(`global-recovery-blocked:${root.id}:${candidate.failedArrivalRequestId}`)) {
            attempted.add(`global-recovery-blocked:${root.id}:${candidate.failedArrivalRequestId}`);
            issues.push({ kind: "waiting_for_management", groupRunId: root.id,
              arrivalRequestId: candidate.arrivalRequestId,
              message: "Global Main technical recovery budget exhausted; no automatic business decision was made" });
          }
        }
        // Admit eligible recovery before ordinary skipped-path routing. Both
        // use the management queue, and recovery may be what releases the
        // original stopped Worker that currently fences ordinary admission.
        if (this.management?.continueSkipped) for (const group of groups) {
          if (!["running", "integrating"].includes(group.status)) continue;
          for (const arrival of arrivals.filter(item => item.groupRunId === group.id && item.status === "skipped")) {
            if ((await this.database.eventByRequestId(input.projectId, `scoped-skip-continuation:${arrival.requestId}`))) continue;
            await schedule(`skip-continuation:${arrival.requestId}`, group.id, () => this.management!.continueSkipped!(group, arrival.requestId));
          }
        }
        if (!pending.size) break;
        // A fast path can release its next node while an independent native
        // turn is still running. Waiting for an entire wave would lose that.
        await Promise.race(pending.values());
      }
    } finally {
      // Never return/lose authority while any launched phase is still live,
      // including abort/error paths; the native driver must confirm its close.
      await Promise.all(pending.values());
    }
    const groupRun = (await this.database.scopedGroupRun(input.projectId, root.id))!;
    for (const issue of (await this.database.scopedGroupIssues(input.projectId))) {
      const owner = await this.database.scopedGroupRun(input.projectId, issue.groupRunId);
      if (owner && (await this.isDescendant(input.projectId, owner, root.id))) issues.push({ kind: "waiting_for_management", severity: "failure", groupRunId: owner.id,
        arrivalRequestId: issue.arrivalRequestId, message: `${issue.kind} recovery: ${issue.reason}` });
    }
    for (const arrival of (await this.database.projectState(input.projectId)).scopedArrivals ?? []) {
      const group = await this.database.scopedGroupRun(input.projectId, arrival.groupRunId);
      if (arrival.status === "failed" && group && (await this.isDescendant(input.projectId, group, root.id)) &&
        !issues.some((issue) => issue.arrivalRequestId === arrival.requestId)) {
        issues.push({ kind: "failure", severity: "failure", groupRunId: group.id, arrivalRequestId: arrival.requestId,
          message: "Failed necessary arrival awaits its scoped Leader recovery; the Agent FIFO remains held" });
      }
    }
    const finalArrivals = (await this.database.projectState(input.projectId)).scopedArrivals ?? [];
    const finalIssues: ScopedRuntimeIssue[] = [];
    for (const issue of issues) {
      if (issue.kind === "waiting_for_workflow_adjustment") {
        if ((await this.database.workflowAdjustments(input.projectId)).some(record => record.source.kind === "user" && record.status === "pending")) finalIssues.push(issue);
        continue;
      }
      if (issue.kind !== "waiting_for_management" || issue.severity === "failure") { finalIssues.push(issue); continue; }
      const group = await this.database.scopedGroupRun(input.projectId, issue.groupRunId);
      if (!group || !(await this.isDescendant(input.projectId, group, root.id))) continue;
      if (!issue.arrivalRequestId) {
        if (["running", "integrating"].includes(group.status)) finalIssues.push(issue);
        continue;
      }
      const arrival = finalArrivals.find((item) => item.requestId === issue.arrivalRequestId);
      if (arrival?.status === "queued" && ["running", "integrating"].includes(group.status) &&
        (await this.database.scopedManagementBlocksBusiness(input.projectId, group.id))) finalIssues.push(issue);
    }
    return { status: groupRun.status === "completed" ? "completed" : "waiting", groupRun, issues: finalIssues };
  }

  private async isDescendant(projectId: string, group: ScopedGroupRunRecord, rootId: string): Promise<boolean> {
    const seen = new Set<string>();
    let cursor: ScopedGroupRunRecord | undefined = group;
    while (cursor && !seen.has(cursor.id)) {
      if (cursor.id === rootId) return true;
      seen.add(cursor.id);
      cursor = cursor.parentGroupRunId ? (await this.database.scopedGroupRun(projectId, cursor.parentGroupRunId)) : undefined;
    }
    return false;
  }
}
