import { MAX_TASK_REPAIR_WAKEUPS, superviseTask, supervisionHandoff } from "./task-supervision.js";
import path from "node:path";
import { createHash } from "node:crypto";
import type { CollaborationGitFacade } from "./collaboration-git/facade.js";
import type { GitExecutionAuthority, GitHubRepositoryFact, LocalWorktreeFact, OwnerResolutionFact } from "./collaboration-git/contracts.js";
import { OperationStoreViolationError } from "./collaboration-git/errors.js";
import type { CollaborationStateStore as CollaborationStateDatabase } from "./collaboration-state/database-worker.js";
import { CollaborationStateError } from "./collaboration-state/errors.js";
import type { ScopedAgentReportRecord, ScopedAgentTurnRecord, ScopedArrivalRecord, ScopedExecutionRecord, ScopedGroupRunRecord } from "./collaboration-state/contracts.js";
import type { ScopedWorkflow } from "./scoped-workflow-contract.js";
import { redactTrace } from "./utils.js";
import type { ControlActionEnvelope } from "./types.js";
import { executionWorktreeClosingActions } from "./execution-worktree-closing.js";

export type ScopedAgentExecutionGit = Pick<CollaborationGitFacade,
  "sessionBegin" | "checkpointAndPush" | "observeRemoteRef" | "observeRetainedExecution"> &
  Partial<Pick<CollaborationGitFacade, "prepareConflictResolution" | "refreshRecoveryBase" | "restoreRetainedExecutionBase" | "observeExecutionWorktree" | "observeDeliveryPreparation">>;

export interface ScopedAgentTurnInput {
  execution: ScopedExecutionRecord;
  arrival: ScopedArrivalRecord;
  groupRun: ScopedGroupRunRecord;
  workflow: ScopedWorkflow;
  invocationId: string;
  runtimePath: string;
  baseCommit: string;
  recoveryPreparation?: OwnerResolutionFact;
  /** Same logical execution/report, separate physical native repair turn. */
  reportRepair?: { report: ScopedAgentReportRecord; attempt: number; missing: string[];
    coordination?: { incidentId?: string; envelope: ControlActionEnvelope } };
  /** A released manager's one-shot supplement; no report is fabricated. */
  missingReportRepair?: { originalInvocationId: string; attempt: number; coordination: ControlActionEnvelope;
    interruptedOperationIds?: string[] };
  signal?: AbortSignal;
  /** Native launcher calls this only after its process opens successfully. */
  onOpened(): void | Promise<void>;
}

export interface ScopedAgentTurnResult {
  output: string;
  selectedWeakTarget?: string;
  /** Head confirmed by an explicit Agent git_push action in this turn. */
  reportHeadSha?: string;
  /** Trusted process close, not an Agent assertion or just a model turn end. */
  residentStopConfirmed: boolean;
}

export interface ScopedAgentTurnInvoker {
  invoke(input: ScopedAgentTurnInput): Promise<ScopedAgentTurnResult>;
}

export interface ScopedInitialPreparation {
  execution: ScopedExecutionRecord; arrival: ScopedArrivalRecord; groupRun: ScopedGroupRunRecord;
  turn: ScopedAgentTurnRecord; repository: GitHubRepositoryFact;
}

export class ScopedAgentTurnFailure extends Error {
  readonly details: Readonly<Record<string, unknown>>;

  constructor(
    message: string,
    readonly residentStopConfirmed: boolean,
    options?: ErrorOptions,
    details: Record<string, unknown> = {}
  ) {
    super(message, options);
    this.name = "ScopedAgentTurnFailure";
    this.details = Object.freeze({ residentStopConfirmed, ...details });
  }
}

export class ScopedAgentTurnRecoveryRequired extends CollaborationStateError {
  constructor(executionId: string) {
    super("INVALID_STATE_TRANSITION", "Scoped native turn already reserved; reconcile its process and result before retry",
      { executionId });
    this.name = "ScopedAgentTurnRecoveryRequired";
  }
}

export interface PrepareScopedAgentDeliveryInput {
  projectId: string;
  executionId: string;
  ownershipEpoch: number;
  repository: GitHubRepositoryFact;
  signal?: AbortSignal;
  /** Trusted scheduler serializes short base/checkout setup with this group's
   * PR synchronization; native business turns are outside this critical section. */
  withGroupBase?<T>(branch: string, action: () => Promise<T>): Promise<T>;
}

export interface PreparedScopedAgentDelivery {
  executionId: string;
  ownershipEpoch: number;
  expectedHeadSha?: string;
  selectedWeakTarget?: string;
  output: string;
}

/** Retain the exact native/report authority through delivery and recovery.
 * In Agent-owned mode, missing tool facts wake that original Agent under a
 * durable budget; the system never supplies its business or provider result.
 * Legacy automatic-checkpoint fixtures retain their separate old contract. */
export class ScopedAgentExecutionRunner {
  private readonly inFlight = new Set<string>();

  constructor(private readonly database: CollaborationStateDatabase,
    private readonly git: ScopedAgentExecutionGit, private readonly invoker: ScopedAgentTurnInvoker,
    private readonly projectPath: (projectId: string) => string,
    private readonly options: { automaticCheckpoint?: boolean;
      /** Production Agent-owned delivery must verify PR and sync facts too;
       * a low-level checkpoint-only caller may defer those to its integrator. */
      requireAgentGitDeliveryFacts?: boolean;
      /** Optional isolated acceptance boundary, after reservation and before
       * first checkout. Throwing follows the ordinary unopened-failure path. */
      beforeInitialWorktreePreparation?(input: ScopedInitialPreparation): Promise<void> } = {}) {}

  async prepareDelivery(input: PrepareScopedAgentDeliveryInput): Promise<PreparedScopedAgentDelivery> {
    const key = JSON.stringify([input.projectId, input.executionId]);
    if (this.inFlight.has(key)) throw new CollaborationStateError("INVALID_STATE_TRANSITION", "Scoped Agent invocation is already in progress");
    this.inFlight.add(key);
    try { return await this.perform(input); }
    finally { this.inFlight.delete(key); }
  }

  private async perform(input: PrepareScopedAgentDeliveryInput): Promise<PreparedScopedAgentDelivery> {
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
      throw new OperationStoreViolationError("Scoped Agent invocation requires the project's ready, pinned repository");
    }
    const projectPath = path.resolve(this.projectPath(input.projectId));
    if (execution.worktreePath !== path.join(projectPath, "git-worktrees", "agents", execution.agentId)) {
      throw new OperationStoreViolationError("Scoped Agent invocation must retain its project-owned fixed directory");
    }
    let report = await this.database.scopedAgentReport(input.projectId, execution.id, input.ownershipEpoch);
    if (execution.status === "completed") {
      if (!report) throw new OperationStoreViolationError("Completed scoped invocation has no durable task report");
      return { executionId: execution.id, ownershipEpoch: execution.ownershipEpoch,
        expectedHeadSha: report.headSha, selectedWeakTarget: report.selectedWeakTarget, output: report.output };
    }
    const returned = this.options.automaticCheckpoint === false && report
      ? (await this.database.executionSupervisionResult(input.projectId, execution.id)) : undefined;
    if (returned && report) return { executionId: execution.id, ownershipEpoch: execution.ownershipEpoch,
      expectedHeadSha: report.headSha, selectedWeakTarget: report.selectedWeakTarget,
      output: supervisionHandoff(report.output, { remaining: returned.missing,
        outcome: returned.outcome === "resolved" ? "resolved" : returned.outcome === "exhausted" ? "exhausted" : "unconfirmed" }) };
    if ((await this.database.scopedManagementBlocksBusiness(input.projectId, execution.groupRunId))) {
      throw new CollaborationStateError("ACTIVE_NODE_CONFLICT", "Original Agent preparation must wait for its scoped management turn to stop");
    }
    const authority: GitExecutionAuthority = { ...execution, purpose: "delivery" };
    await this.database.operationsForProject(input.projectId, true).assertExecutionOwnership({
      projectId: input.projectId, executionId: execution.id, ownershipEpoch: execution.ownershipEpoch,
      expectedBranch: execution.executionBranch, operation: "provider.mutate"
    });
    const priorTurns = (await Promise.all(Array.from({ length: execution.ownershipEpoch - 1 }, (_, index) =>
      this.database.scopedAgentTurn(input.projectId, execution.id, index + 1)))).filter((turn): turn is NonNullable<typeof turn> => Boolean(turn));
    const prepareRetained = async (currentBase?: string): Promise<LocalWorktreeFact> => {
      if (priorTurns.some((turn) => turn.status !== "stopped")) throw new ScopedAgentTurnRecoveryRequired(execution.id);
      const bases = priorTurns.filter((turn) => turn.openedAt).map((turn) => turn.baseCommit);
      if (currentBase) bases.push(currentBase);
      if (!bases.length) throw new OperationStoreViolationError("Retained scoped delivery has no trusted opened turn base");
      // Infrastructure only: restore missing metadata from the original
      // stopped task. The Agent keeps its checkout and performs all delivery.
      const retained = await this.git.observeRetainedExecution(authority, execution.ownershipEpoch, input.signal);
      if (retained.projectId !== input.projectId || retained.executionId !== execution.id ||
        retained.ownershipEpoch !== execution.ownershipEpoch || retained.branch !== execution.executionBranch ||
        retained.worktreePath !== execution.worktreePath) {
        throw new OperationStoreViolationError("Retained preparation changed the original execution authority");
      }
      await this.git.restoreRetainedExecutionBase?.(authority, execution.ownershipEpoch, bases, input.signal);
      return retained;
    };
    if (!report) {
      // Check before touching the checkout: recreating an old worktree may
      // destroy evidence, and a reserved launch may still have live children.
      const retainedTurn = await this.database.scopedAgentTurn(input.projectId, execution.id, execution.ownershipEpoch);
      const missingReportRepair = await this.database.scopedAgentMissingReportRepair(input.projectId, execution.id, execution.ownershipEpoch);
      if (retainedTurn && !missingReportRepair && (retainedTurn.status !== "stopped" || retainedTurn.openedAt)) {
        throw new ScopedAgentTurnRecoveryRequired(execution.id);
      }
      if (execution.status !== "running") throw new CollaborationStateError("INVALID_STATE_TRANSITION", "Scoped model invocation requires a running execution");
      const group = (await this.database.scopedGroupRun(input.projectId, execution.groupRunId))!;
      const arrival = (await this.database.scopedArrivals(group.id)).find((item) => item.requestId === execution.arrivalRequestId);
      if (!arrival) throw new OperationStoreViolationError("Scoped Agent invocation lost its arrival");
      if (!arrival.pathContext && (await this.database.scopedGroupWorkflow(input.projectId, group.id)).loops?.length) {
        throw new OperationStoreViolationError("Scoped Loop invocation requires proven path counters before native launch");
      }
      const invocationId = missingReportRepair ? retainedTurn!.invocationId
        : `inv_${createHash("sha256").update(JSON.stringify([execution.id, execution.ownershipEpoch])).digest("hex").slice(0, 32)}`;
      const runtimePath = path.join(projectPath, "runtime", invocationId);
      let recoveryPreparation: OwnerResolutionFact | undefined;
      const finalRepair = await this.database.scopedFinalRepairForArrival(input.projectId, arrival.requestId);
      let baseCommit: string;
      if (missingReportRepair) {
        // A report omission is not permission to reset its retained business
        // checkout. The native front door verifies the old process
        // and resumes its exact persistent session before this turn opens.
        await this.database.assertScopedAgentMissingReportRepairLaunch({ ...input, agentId: execution.agentId, invocationId, runtimePath });
        baseCommit = retainedTurn!.baseCommit;
        await prepareRetained(baseCommit);
      } else {
        const prepare = async () => {
          let retained: LocalWorktreeFact | undefined;
          let baseCommit: string;
          const currentGroupBase = async () => {
            const base = await this.git.observeRemoteRef(input.repository, group.groupBranch, input.signal);
            if (base.status !== "present" || base.ref !== group.groupBranch || !/^[0-9a-f]{40}$/i.test(base.sha ?? "") ||
              base.owner !== input.repository.owner || base.repository !== input.repository.name) {
              throw new OperationStoreViolationError("Scoped invocation requires the current canonical group head");
            }
            return base.sha!;
          };
          if (execution.ownershipEpoch > 1) {
            if (priorTurns.some((turn) => turn.status !== "stopped")) throw new ScopedAgentTurnRecoveryRequired(execution.id);
            const openedBases = priorTurns.filter((turn) => turn.openedAt).map((turn) => turn.baseCommit);
            if (openedBases.length) {
              // A retry after a real native turn retains its original
              // branch/history/evidence. Only a new execution branches from
              // the latest direct group's canonical head.
              retained = await prepareRetained();
              baseCommit = retained.head;
            } else {
              if (!priorTurns.at(-1)?.baseCommit) throw new OperationStoreViolationError("Scoped retry lost its unopened preparation base");
              const preparation = await this.git.observeDeliveryPreparation?.(authority, execution.ownershipEpoch, input.signal);
              if (preparation && (preparation.projectId !== input.projectId || preparation.executionId !== execution.id ||
                preparation.ownershipEpoch !== execution.ownershipEpoch || preparation.branch !== execution.executionBranch ||
                preparation.worktreePath !== execution.worktreePath || !preparation.head && preparation.activationBase ||
                preparation.head && (!priorTurns.some(turn => turn.baseCommit === preparation.head) ||
                  preparation.activationBase && preparation.activationBase !== preparation.head))) {
                throw new OperationStoreViolationError("Unopened delivery preparation differs from its original reserved bases");
              }
              // A reservation whose checkout was never created is not an
              // activation base: closing may since have advanced this group.
              // An actually prepared branch retains its proven history.
              baseCommit = preparation?.head ?? await currentGroupBase();
            }
          } else {
            baseCommit = await currentGroupBase();
          }
          input.signal?.throwIfAborted();
          const reserved = await this.database.beginScopedAgentTurn({ projectId: input.projectId,
            executionId: execution.id, ownershipEpoch: execution.ownershipEpoch, invocationId, runtimePath, baseCommit });
          if (reserved.replay) throw new ScopedAgentTurnRecoveryRequired(execution.id);
          try {
            // Reservation precedes checkout work as well as native launch, so
            // another runner cannot switch this folder under the live owner.
            if (execution.ownershipEpoch === 1) await this.options.beforeInitialWorktreePreparation?.({ execution, arrival,
              groupRun: group, turn: (await this.database.scopedAgentTurn(input.projectId, execution.id, 1))!, repository: input.repository });
            const worktree = retained ?? await this.git.sessionBegin(authority, execution.ownershipEpoch,
              { kind: "delivery", base: { kind: "commit", commitSha: baseCommit } }, input.signal);
            input.signal?.throwIfAborted();
            if (worktree.projectId !== input.projectId || worktree.executionId !== execution.id ||
              worktree.ownershipEpoch !== execution.ownershipEpoch || worktree.branch !== execution.executionBranch ||
              worktree.worktreePath !== execution.worktreePath || worktree.head !== baseCommit) {
              throw new OperationStoreViolationError("Scoped sessionBegin changed the Agent's checkout, base or execution authority");
            }
            // Legacy automatic delivery retains its old preparation path.
            // Agent-owned delivery must call git_prepare_conflict itself: a
            // scheduler retry does not authorize a merge into business files.
            if (this.options.automaticCheckpoint !== false && (finalRepair || execution.ownershipEpoch > 1 && (await this.database.scopedAgentReport(input.projectId, execution.id, execution.ownershipEpoch - 1))?.headSha)) {
              if (!this.git.prepareConflictResolution) throw new OperationStoreViolationError("Retained PR repair requires trusted Git conflict preparation");
              const sourceBranch = finalRepair?.sourceBranch ?? group.groupBranch;
              const target = this.git.refreshRecoveryBase
                ? await this.git.refreshRecoveryBase(input.repository, authority, execution.ownershipEpoch, sourceBranch, input.signal)
                : await this.git.observeRemoteRef(input.repository, sourceBranch, input.signal);
              if (target.status !== "present" || !/^[0-9a-f]{40}$/i.test(target.sha ?? "") ||
                target.ref !== sourceBranch || target.owner !== input.repository.owner || target.repository !== input.repository.name)
                throw new OperationStoreViolationError("Retained PR repair lost its current direct group base");
              recoveryPreparation = await this.git.prepareConflictResolution(authority, execution.ownershipEpoch,
                sourceBranch === "main" ? { kind: "main", expectedHead: target.sha! }
                  : { kind: "group", groupRunId: sourceBranch.slice("groups/".length), expectedHead: target.sha! }, input.signal);
              if (recoveryPreparation.projectId !== input.projectId || recoveryPreparation.executionId !== execution.id ||
                recoveryPreparation.executionBranch !== execution.executionBranch || recoveryPreparation.sourceBranch !== sourceBranch || recoveryPreparation.sourceHead !== target.sha)
                throw new OperationStoreViolationError("Conflict preparation changed the retained owner or direct group source");
            }
          } catch (error) {
            await this.failStoppedTurn(input, execution, invocationId, error, true);
            throw error;
          }
          return baseCommit;
        };
        baseCommit = input.withGroupBase ? await input.withGroupBase(group.groupBranch, prepare) : await prepare();
      }
      let result: ScopedAgentTurnResult;
      try {
        const workflow = await this.database.scopedGroupWorkflow(input.projectId, group.id);
        result = await this.invoker.invoke({ execution, arrival, groupRun: group,
          workflow: finalRepair ? { ...workflow, loops: [], routes: { ...workflow.routes, [arrival.targetNodeId]: [{ kind: "strong", target: "finish" }] } } : workflow,
          invocationId, runtimePath, baseCommit, recoveryPreparation, signal: input.signal,
          ...(missingReportRepair ? { missingReportRepair } : {}),
          onOpened: async () => await this.database.markScopedAgentTurnOpened({ projectId: input.projectId,
            executionId: execution.id, ownershipEpoch: execution.ownershipEpoch, invocationId, nativeProcessOpened: true }) });
      } catch (error) {
        if (error instanceof ScopedAgentTurnFailure && error.residentStopConfirmed) await this.failStoppedTurn(input, execution, invocationId, error);
        throw error;
      }
      // A trusted completed+stopped native result is durable before Git work.
      // If persistence fails, the reserved turn remains recovery evidence.
      try {
        report = (await this.database.recordScopedAgentReport({ projectId: input.projectId, executionId: execution.id,
          ownershipEpoch: execution.ownershipEpoch, invocationId, output: result.output,
          selectedWeakTarget: result.selectedWeakTarget, residentTurnCompleted: true,
          residentStopConfirmed: result.residentStopConfirmed,
          ...(result.reportHeadSha ? { reportHeadSha: result.reportHeadSha } : {}) })).report;
      } catch (error) {
        await this.failStoppedTurn(input, execution, invocationId, error);
        throw error;
      }
    }
    if (this.options.automaticCheckpoint === false) {
      const ended = await this.database.executionSupervisionResult(input.projectId, execution.id);
      if (ended) return { executionId: execution.id, ownershipEpoch: execution.ownershipEpoch,
        expectedHeadSha: report.headSha, selectedWeakTarget: report.selectedWeakTarget, output: report.output };
      const coordination = await this.database.scopedAgentReportContinuation(input.projectId, execution.id, execution.ownershipEpoch);
      let repair: Awaited<ReturnType<CollaborationStateDatabase["beginScopedAgentReportRepair"]>>;
      let invocationId: string, runtimePath: string;
      const supervised = await superviseTask({ key: `${input.projectId}:${execution.id}:report`, value: report,
        signal: input.signal,
        inspect: async () => {
          const recoveredPull = await this.database.scopedRecoveryPull(input.projectId, execution.id, execution.ownershipEpoch);
          const delivery = await this.database.scopedAgentGitDeliveryStatus(input.projectId, execution.id, execution.ownershipEpoch,
            report!.headSha, Boolean(this.options.requireAgentGitDeliveryFacts));
          return [!(await this.database.scopedAgentTaskCompleted(input.projectId, execution.id, execution.ownershipEpoch,
            report!.invocationId)) && "finish_task", !report!.headSha && (recoveredPull?.status === "merged"
              ? "github_get_pr for the retained merged PR head" : "git_push"),
            ...delivery.missingActions.filter(action => action !== "git_push"),
            ...(this.options.requireAgentGitDeliveryFacts ? await executionWorktreeClosingActions(this.git, authority, input.signal) : [])
          ].filter((item): item is string => Boolean(item));
        },
        reserve: async missing => {
          const count = await this.database.executionSupervisionRepairCount(input.projectId, execution.id);
          if (!count && !coordination && !(await this.database.eventByRequestId(input.projectId, `execution-supervision-start:${execution.id}`)))
            throw new Error("Retained task has no reliable remaining automatic supervision allowance");
          if (count >= MAX_TASK_REPAIR_WAKEUPS) return undefined;
          const prior = await this.database.scopedAgentTurn(input.projectId, execution.id, execution.ownershipEpoch);
          if (!prior || prior.status !== "stopped") throw new ScopedAgentTurnRecoveryRequired(execution.id);
          await prepareRetained(prior.baseCommit);
          invocationId = `inv_${createHash("sha256").update(JSON.stringify(coordination
            ? [report!.invocationId, "coordinated-repair", coordination.envelope.invocationId, coordination.envelope.callId]
            : [report!.invocationId, "mechanism-repair", count + 1])).digest("hex").slice(0, 32)}`;
          runtimePath = path.join(projectPath, "runtime", invocationId);
          repair = (await this.database.beginScopedAgentReportRepair({ projectId: input.projectId, executionId: execution.id,
            ownershipEpoch: execution.ownershipEpoch, invocationId, runtimePath,
            originalReportInvocationId: report!.invocationId, missing, ...(coordination ? { coordination } : {}) }));
          return repair?.attempt;
        },
        invoke: async (_attempt, missing) => {
          const group = (await this.database.scopedGroupRun(input.projectId, execution.groupRunId))!;
          const arrival = (await this.database.scopedArrivals(group.id)).find(item => item.requestId === execution.arrivalRequestId)!;
          const workflow = await this.database.scopedGroupWorkflow(input.projectId, group.id);
          const finalRepair = await this.database.scopedFinalRepairForArrival(input.projectId, arrival.requestId);
          let result: ScopedAgentTurnResult;
          try {
            result = await this.invoker.invoke({ execution: (await this.database.scopedExecution(input.projectId, execution.id))!,
              arrival, groupRun: group, workflow: finalRepair ? { ...workflow, loops: [],
                routes: { ...workflow.routes, [arrival.targetNodeId]: [{ kind: "strong", target: "finish" }] } } : workflow,
              invocationId, runtimePath, baseCommit: repair!.turn.baseCommit, signal: input.signal,
              reportRepair: { report: repair!.report, attempt: repair!.attempt, missing, ...(coordination ? { coordination } : {}) },
              onOpened: async () => await this.database.markScopedAgentTurnOpened({ projectId: input.projectId, executionId: execution.id,
                ownershipEpoch: execution.ownershipEpoch, invocationId, nativeProcessOpened: true }) });
          } catch (error) {
            if (error instanceof ScopedAgentTurnFailure && error.residentStopConfirmed) await this.failStoppedTurn(input, execution, invocationId, error);
            throw error;
          }
          if (result.residentStopConfirmed) await this.database.stopScopedAgentTurn({ projectId: input.projectId, executionId: execution.id,
            ownershipEpoch: execution.ownershipEpoch, invocationId, residentStopConfirmed: true });
          if (result.selectedWeakTarget !== report!.selectedWeakTarget)
            throw new OperationStoreViolationError("Mechanism repair cannot replace its immutable report's route");
          if (result.residentStopConfirmed) await this.database.recordScopedAgentReportRepairResult({ projectId: input.projectId, executionId: execution.id,
            ownershipEpoch: execution.ownershipEpoch, invocationId, originalReportInvocationId: report!.invocationId,
            output: redactTrace(result.output).slice(0, 100_000), residentStopConfirmed: true });
          if (result.reportHeadSha) report = (await this.database.bindScopedAgentReportHead({ projectId: input.projectId,
            executionId: execution.id, ownershipEpoch: execution.ownershipEpoch, headSha: result.reportHeadSha })).report;
          return report!;
        },
        record: async (outcome, missing, reason) => {
          await this.database.appendEvent({ projectId: input.projectId, agentId: execution.agentId,
            type: "execution.supervision.finished", payload: { executionId: execution.id, ownershipEpoch: execution.ownershipEpoch,
              outcome, missing, ...(reason ? { reason } : {}) } });
        }
      });
      return { executionId: execution.id, ownershipEpoch: execution.ownershipEpoch,
        expectedHeadSha: report!.headSha, selectedWeakTarget: report!.selectedWeakTarget,
        output: supervisionHandoff(report!.output, supervised) };
    }

    input.signal?.throwIfAborted();
    if (!report.headSha) {
      const pushed = await this.git.checkpointAndPush({ repository: input.repository, execution: authority,
        ownershipEpoch: execution.ownershipEpoch,
        operationId: `scoped-checkpoint-${execution.id}-epoch-${execution.ownershipEpoch}`,
        checkpointKind: "report", reason: report.output, signal: input.signal });
      input.signal?.throwIfAborted();
      if (!pushed.checkpoint.changed || !pushed.remote || pushed.remote.status !== "present" ||
        pushed.remote.ref !== execution.executionBranch || pushed.remote.sha !== pushed.checkpoint.commitSha ||
        pushed.remote.owner !== input.repository.owner || pushed.remote.repository !== input.repository.name) {
        throw new OperationStoreViolationError("Scoped report requires a business/report commit and its exact confirmed push");
      }
      report = (await this.database.bindScopedAgentReportHead({ projectId: input.projectId, executionId: execution.id,
        ownershipEpoch: execution.ownershipEpoch, headSha: pushed.checkpoint.commitSha })).report;
    } else {
      await this.database.bindScopedAgentReportHead({ projectId: input.projectId, executionId: execution.id,
        ownershipEpoch: execution.ownershipEpoch, headSha: report.headSha });
    }
    if (this.options.requireAgentGitDeliveryFacts) {
      const missing = [...(await this.database.scopedAgentDeliveryMissingActions(input.projectId, execution.id, execution.ownershipEpoch, report.headSha!)),
        ...await executionWorktreeClosingActions(this.git, authority, input.signal)];
      if (missing.length) {
        const error = new OperationStoreViolationError(`Original Agent still lacks explicit Git delivery facts: ${missing.join(", ")}`);
        await this.failStoppedTurn(input, execution, (await this.database.scopedAgentTurn(input.projectId, execution.id,
          execution.ownershipEpoch))!.invocationId, error);
        throw error;
      }
    }
    return { executionId: execution.id, ownershipEpoch: execution.ownershipEpoch,
      expectedHeadSha: report.headSha!, selectedWeakTarget: report.selectedWeakTarget, output: report.output };
  }

  private async failStoppedTurn(input: PrepareScopedAgentDeliveryInput, execution: ScopedExecutionRecord, invocationId: string, error: unknown,
    preparationStoppedBeforeNativeOpen = false): Promise<void> {
    let turn = await this.database.scopedAgentTurn(input.projectId, execution.id, execution.ownershipEpoch);
    // A recovered writer may be reporting a missing delivery fact after the
    // original writer already persisted the native stop. Do not require the
    // new writer to mutate an old turn just to fence the same failure again.
    if (turn?.status === "opened" || preparationStoppedBeforeNativeOpen && turn?.status === "reserved") {
      await this.database.stopScopedAgentTurn({ projectId: input.projectId, executionId: execution.id,
        ownershipEpoch: execution.ownershipEpoch, invocationId, residentStopConfirmed: true });
      turn = (await this.database.scopedAgentTurn(input.projectId, execution.id, execution.ownershipEpoch));
    }
    if (turn?.status === "reserved") return;
    if ((await this.database.projectCancellationIntent(input.projectId))) return;
    if (!(await this.database.scopedAgentReport(input.projectId, execution.id, execution.ownershipEpoch)) &&
      (await this.database.scopedExecutionHasUnsettledGitOperation(input.projectId, execution.id, execution.ownershipEpoch))) {
      await this.database.recordScopedAgentInterruptedOperation({ projectId: input.projectId, executionId: execution.id,
        ownershipEpoch: execution.ownershipEpoch, invocationId });
      return;
    }
    await this.database.failScopedAgentArrival({ projectId: input.projectId,
      arrivalRequestId: execution.arrivalRequestId, executionId: execution.id,
      ownershipEpoch: execution.ownershipEpoch,
      reason: error instanceof Error ? redactTrace(error.message).trim().slice(0, 1_000) : "Scoped preparation or native turn failed",
      residentStopConfirmed: true });
  }
}
