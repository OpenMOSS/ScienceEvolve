import { workflowMessagesText, type WorkflowDirectMessage } from "./workflow-input.js";
import { createHash, randomUUID } from "node:crypto";
import { AgentContextSources } from "./agent-context-index.js";
import { promises as fs } from "node:fs";
import path from "node:path";
import { transientHarnessFailure } from "./harness-runtime/errors.js";
import { isDeepStrictEqual } from "node:util";
import type { AgentRunRequest, AgentRunResult, ControlActionEnvelope, ControlMcpRequest, ProjectState, TraceSink } from "./types.js";
import type { InvocationInputs } from "./harness-runtime/contracts.js";
import type { CollaborationResidentHandle, CollaborationResidentLauncher, CollaborationResidentOpenInput,
  CollaborationControlAuthorityFactory, CollaborationExecutionInputBuilder } from "./collaboration-runtime.js";
import { CollaborationStateDatabase } from "./collaboration-state/store.js";
import { CollaborationStateError } from "./collaboration-state/errors.js";
import type { ScopedExecutionRecord, ScopedGroupRunRecord, ScopedLeaderActionInput } from "./collaboration-state/contracts.js";
import type { GitExecutionAuthority, GitHubPullRequestFact, GitHubRepositoryFact } from "./collaboration-git/contracts.js";
import type { SynchronizedPullRequestFact } from "./collaboration-git/facade.js";
import { ProjectStorage } from "./storage.js";
import { agentGitOperationId, executeAgentGitTool, isAgentGitAction, type AgentGitFacts } from "./agent-git-tools.js";
import { agentGitDeliveryStatus, type AgentGitDeliveryStatus } from "./agent-git-delivery.js";
import { agentGitOperationJournal } from "./agent-git-operation-journal.js";
import type { ScopedFinalIntegrationRecord } from "./collaboration-state/contracts.js";
import { ScopedWorkflowRuntime, ScopedManagementDeferredError, type ScopedWorkflowGit, type ActivateRuntimeScopedGroupInput } from "./scoped-workflow-runtime.js";
import type { CollaborationGitFacade } from "./collaboration-git/facade.js";
import { ScopedAgentExecutionRunner, type ScopedAgentTurnInput, type ScopedAgentExecutionGit } from "./scoped-agent-execution.js";
import { ResidentScopedAgentTurnInvoker } from "./scoped-agent-resident.js";
import { parseScopedWorkflowProposal } from "./scoped-workflow-reconfiguration.js";
import { mainWorkflowDocument, workflowBaseHash } from "./workflow-reconfiguration.js";
import { sameWorkflowConfigurationVersion } from "./workflow-adjustments.js";
import { credentialFreeAgentConfiguration, restoreAgentConfiguration } from "./scoped-agent-configuration.js";
import { mainAgentOrchestrationDocument, parseAgentOrchestrationProposal, type AgentOrchestrationProposal } from "./agent-orchestration-reconfiguration.js";
import { prepareWorkflowContext } from "./workflow-context.js";
import { redactTrace } from "./utils.js";
import { scopedGroupOutput, scopedPredecessorOutput, scopedPredecessorMessages } from "./scoped-group-output.js";
import { withholdR12MergeResponse } from "./acceptance-r12.js";
import { withholdR14ReportHead } from "./acceptance-r14.js";
import { rejectR03InitialFinish } from "./acceptance-r03.js";
import { failR04InitialPreparation } from "./acceptance-r04-preparation.js";
import { executionWorktreeClosingActions } from "./execution-worktree-closing.js";
import { observeR04PendingFile, requestR04PendingFile } from "./acceptance-r04-pending.js";
import { createR11GatewayFetch } from "./acceptance-r11.js";
import type { WorkflowAdjustmentPublication } from "./workflow-adjustments.js";
import { sameDurableSession } from "./control-result-receipts.js";

export interface ScopedProjectRuntimeDependencies {
  database: CollaborationStateDatabase;
  state: ProjectState;
  storage: ProjectStorage;
  git: ScopedWorkflowGit & ScopedAgentExecutionGit & Partial<Pick<CollaborationGitFacade, "observePullRequest" | "observePullRequestForExecution" | "closePullRequest" | "prepareConflictResolution">>;
  repository: GitHubRepositoryFact;
  launcher: CollaborationResidentLauncher;
  inputBuilder?: CollaborationExecutionInputBuilder;
  signal: AbortSignal;
  filesystem(): Promise<CollaborationResidentOpenInput["filesystemAuthorityInput"]>;
  decorate(request: AgentRunRequest): void;
  trace(agentId: string, invocationId: string): TraceSink;
  publish(): Promise<void>;
  /** Consume only a released manager's explicit read-only receipt retry. */
  continueTerminalPushObservations?(): Promise<void>;
  reconcileWorktreeClosings?(): Promise<void>;
  discoverWorktreeClosings?(): Promise<void>;
  continueWorktreeClosings?(): Promise<void>;
  managementInputs(group: ScopedGroupRunRecord, invocationId: string, inbox: string, runtime: string, allowEdit: boolean): Promise<InvocationInputs>;
  /** A pending user Pause or durable cancellation defers new management
   * rounds before they claim/open a resident. */
  assertManagementActive?(): void;
  /** Wait out Pause before opening any scoped resident, then keep open and
   * registration inside the native safe-point boundary. */
  withNativeLaunchFence?<T>(action: () => Promise<T>): Promise<T>;
  /** The existing lifecycle owns pause-safe turns and all live handles. */
  submit(handle: CollaborationResidentHandle, turn: { inputId: string; invocationId: string; prompt: string },
    retainNativeReturn?: (result: AgentRunResult) => void | Promise<void>): Promise<AgentRunResult>;
  register(key: string, handle: CollaborationResidentHandle): void;
  unregister(key: string): void;
  validateConfiguration?(proposal: AgentOrchestrationProposal): Promise<void>;
  applyWaitingWorkflowAdjustments?(): Promise<void>;
}

/** Production composition. Uses the same native request builder, Harness,
 * session callbacks, control broker, usage ledger and Git facade as the root. */
export class ScopedProjectRuntime {
  readonly runtime: ScopedWorkflowRuntime;
  private readonly capabilities = new Map<string, { hash: string; accepted: ControlActionEnvelope[];
    retained?: ControlActionEnvelope[] }>();
  private readonly requests = new Map<string, AgentRunRequest>();
  private readonly nativeAgents = new Set<string>();
  private readonly agentGitFacts = new Map<string, AgentGitFacts>();
  private readonly agentObservedPulls = new Map<string, Map<number, GitHubPullRequestFact>>();
  private managementTail: Promise<unknown> = Promise.resolve();
  private recoveryTail: Promise<unknown> = Promise.resolve();
  private closingDiscoveryTail: Promise<void> = Promise.resolve();
  private readonly d: ScopedProjectRuntimeDependencies;

  constructor(dependencies: ScopedProjectRuntimeDependencies) {
    this.d = dependencies;
    dependencies.database.initializeScopedConfiguration(dependencies.state.id, { agents: dependencies.state.agents,
      skillDefinitions: dependencies.state.skillDefinitions ?? {}, mcpDefinitions: dependencies.state.mcpDefinitions ?? {} });
    const invoker = new ResidentScopedAgentTurnInvoker({ open: input => this.openAgentResident(input) }, {
      prepare: (input) => this.prepareAgent(input),
      missingActions: async (input) => {
        const delivery = await this.agentGitDelivery(input);
        const weakCandidates = (input.workflow.routes[input.arrival.targetNodeId] ?? [])
          .filter((edge) => edge.kind === "weak").map((edge) => edge.target);
        const retainedRoute = this.capabilities.get(input.invocationId)?.retained?.some((entry) => entry.action.tool === "route_to_agent")
          || Boolean(input.reportRepair?.report.selectedWeakTarget);
        const routeMissing = this.d.state.agents[input.execution.agentId]?.decisionBy === "agent" && weakCandidates.length > 0 && !retainedRoute;
        return [!this.d.database.scopedAgentTaskCompleted(this.d.state.id, input.execution.id,
          input.execution.ownershipEpoch, input.reportRepair?.report.invocationId ?? input.invocationId) && "finish_task",
          ...delivery.missingActions.map(action => action === "git_push" && input.missingReportRepair
            ? "github_get_pr for the retained merged PR head; report any current checkout mismatch" : action),
          routeMissing && `route_to_agent (${weakCandidates.join(", ")})`
        ].filter(Boolean) as string[];
      },
      reserveRepair: (input, missing) => this.d.database.reserveScopedAgentMechanismRepair({
        projectId: this.d.state.id, executionId: input.execution.id,
        ownershipEpoch: input.execution.ownershipEpoch, invocationId: input.invocationId, missing
      }),
      retainTurnResult: async (input, result, inputId) => {
        this.retainAgentTurnResult(input, result);
        await observeR04PendingFile({ projectTitle: this.d.state.title, projectRoot: this.d.storage.projectDir(this.d.state.id),
          execution: { ...input.execution, purpose: "delivery" }, arrivalRequestId: input.arrival.requestId,
          groupRunId: input.groupRun.id, base: input.groupRun.groupBranch, repository: this.d.repository,
          invocationId: input.invocationId, inputId, git: this.d.git });
      },
      acceptResult: (input, result) => this.acceptAgent(input, result),
      onHandle: async () => { await this.d.publish(); },
      onClosed: async (input) => {
        this.d.database.stopScopedAgentTurn({ projectId: input.execution.projectId, executionId: input.execution.id,
          ownershipEpoch: input.execution.ownershipEpoch, invocationId: input.invocationId, residentStopConfirmed: true });
        this.d.unregister(`scoped:${input.invocationId}`);
        this.nativeAgents.delete(input.execution.agentId);
        await this.d.publish();
      },
      submit: (input, handle, turn) => this.d.submit(handle, turn, result => {
        // Validate the live broker's receipts, then archive only actual text.
        // Report acceptance and all successor effects stay beyond Pause.
        this.retainAgentTurnResult(input, result);
        if (typeof result.handoff === "string") this.d.database.recordScopedAgentNativeOutput({
          projectId: this.d.state.id, executionId: input.execution.id, ownershipEpoch: input.execution.ownershipEpoch,
          invocationId: input.invocationId, agentId: input.execution.agentId, inputId: turn.inputId, output: redactTrace(result.handoff) });
      })
    });
    this.runtime = new ScopedWorkflowRuntime(dependencies.database, dependencies.git,
      new ScopedAgentExecutionRunner(dependencies.database, dependencies.git, invoker, (id) => dependencies.storage.projectDir(id),
        { automaticCheckpoint: false, requireAgentGitDeliveryFacts: true,
          beforeInitialWorktreePreparation: (input) => failR04InitialPreparation({ ...input,
            projectTitle: dependencies.state.title, projectRoot: dependencies.storage.projectDir(dependencies.state.id) }) }),
      (id) => dependencies.storage.projectDir(id), async () => { await this.discoverWorktreeClosings(); await this.applyAcceptedRecoveries(); await this.publishArtifacts(); await dependencies.publish(); }, {
        planGroup: async (group) => {
          await this.manage(group, "plan");
          // A formal apply_workflow is an alternative management decision.
          // Paths remain unplanned until the Agent supplies its actual plan.
        },
        resolveChildRoute: async (parent, child, arrival) => {
          const childDefinition = this.d.state.orchestration.scopedWorkflow?.groups.find((entry) => entry.id === child.groupId);
          const manager = childDefinition?.decisionBy === "agent" ? child : parent;
          await this.manage(manager, "route", arrival,
            `Child group ${child.id} reached its Finish barrier. Verified local results:\n${scopedGroupOutput(this.d.database.projectState(this.d.state.id), child.id)}`,
            false, { sourceArrivalGroupRunId: parent.id });
        },
        resolveRootRoute: async (group, nodeRunId, candidates, output) => {
          await this.manage(group, "root-route", undefined,
            `Root group ${group.groupId} reached its Finish barrier. Verified local results:\n${output}`,
            false, { sourceOuterNodeRunId: nodeRunId, routeCandidates: [...candidates] });
        },
        completeGroup: async (group) => {
          await this.manage(group, "complete", undefined,
            `All required arrivals reached Finish. Decide whether to request explicit final integration from an eligible Agent, or complete the group after an existing final merge proof.\n\n${scopedGroupOutput(this.d.database.projectState(this.d.state.id), group.id)}`);
        },
        recoverGroup: async (group, arrivals) => { await this.manage(group, "recover", undefined, `Failed direct/delegated arrivals: ${arrivals.join(", ")}`); },
        recoverGlobal: async (root) => {
          if (this.d.state.userIntervention?.status === "pending") return;
          const directState = this.d.database.scopedRecoveryCandidates(this.d.state.id, root.id, true).some(candidate => candidate.mainStateRequest);
          await this.manage(root, "recover", undefined, directState
            ? "Retained key-state issues were explicitly assigned to GLOBAL Main through the formal direct entry. Inspect the exact source, original operation and actual observations; coordinate using current authority. Ordinary escalated failures may also be present."
            : `Every group level has escalated these retained failures. Only this GLOBAL Main turn can approve an authorized skip. ${this.d.state.orchestration.allowUserIntervention === false
              ? "User intervention is disabled: resolve missing research details through explicit assumptions and complete the work using existing authority; do not ask or wait for the user."
              : "A genuinely necessary user decision may be requested only through the assigned Main tools."}`, true);
        },
        continueSkipped: async (group, arrival) => {
          if (!this.d.database.scopedArrivalRouteDecision(this.d.state.id, arrival)) await this.manage(group, "route", arrival,
            "Global Main approved skipping this failed task. Explicitly plan its local continuation; no business policy is forced by the server. The skipped task is not a successful execution.");
          this.d.database.continueScopedSkippedArrival(this.d.state.id, group.id, arrival);
          await dependencies.publish();
        }
      }, { agentOwnsGit: true, beforeAdmission: () => dependencies.applyWaitingWorkflowAdjustments?.() ?? Promise.resolve(),
        invokeFinalAgent: { invokeAgent: (integration) => this.integrateFinalAsAgent(integration) } });
  }

  activate(input: Omit<ActivateRuntimeScopedGroupInput, "repository" | "signal">) {
    return this.runtime.activateGroup({ ...input, repository: this.d.repository, signal: this.d.signal });
  }

  async advance(rootGroupRunId: string) {
    await this.reconcileResidents();
    await this.discoverWorktreeClosings();
    await this.d.applyWaitingWorkflowAdjustments?.();
    await this.publishRetainedWorkflowAdjustments();
    await this.applyAcceptedRecoveries();
    return this.runtime.advance({ projectId: this.d.state.id, rootGroupRunId, repository: this.d.repository, signal: this.d.signal });
  }

  private async publishRetainedWorkflowAdjustments(): Promise<void> {
    const d = this.d;
    const records = d.database.workflowAdjustments(d.state.id).filter(record => record.source.kind === "scoped_leader" ||
      record.source.kind === "main" && record.source.scope?.kind === "scoped");
    for (const record of records) {
      if (record.status !== "pending" && record.status !== "needs_resubmission" && !(record.status === "applied" &&
        record.source.kind !== "user" && !d.database.eventByRequestId(d.state.id, `scoped-leader-action:${record.source.invocationId}:${record.source.callId}`))) continue;
      d.database.publishStoppedScopedWorkflowAdjustment(d.state.id, record.requestId, d.state);
    }
    if (records.length) await d.publish();
  }

  private async discoverWorktreeClosings(): Promise<void> {
    const pending = this.closingDiscoveryTail.catch(() => undefined).then(() => this.d.discoverWorktreeClosings?.());
    this.closingDiscoveryTail = pending;
    await pending;
  }

  async reconcileResidents(): Promise<void> {
    const d = this.d;
    await d.reconcileWorktreeClosings?.();
    for (const turn of d.database.scopedLeaderTurns(d.state.id).filter((entry) => entry.status === "active")) {
      if (!turn.runtimePath || !d.launcher.stopScopedForRecovery) throw new Error("Retained scoped Leader requires supervisor stop reconciliation");
      const group = d.database.scopedGroupRun(d.state.id, turn.groupRunId)!;
      const nodeRunId = this.rootNode(group);
      const proof = await d.launcher.stopScopedForRecovery({ state: d.state, nodeRunId,
        scopeId: `management:${nodeRunId}:${group.id}`, agentId: turn.agentId, role: "leader",
        ownershipEpoch: turn.coordinatorEpoch, executionRuntimePath: turn.runtimePath });
      if (!proof.stopped) throw new Error("Scoped Leader still has an unconfirmed native process");
      d.database.releaseScopedLeaderTurn({ projectId: d.state.id, groupRunId: group.id,
        agentId: turn.agentId, invocationId: turn.invocationId, residentStopConfirmed: true });
    }
    for (const turn of d.database.scopedFinalNativeTurns(d.state.id).filter((entry) => entry.status !== "stopped")) {
      if (!d.launcher.stopScopedForRecovery) throw new Error("Retained final Agent requires supervisor stop reconciliation");
      const group = d.database.scopedGroupRun(d.state.id, turn.groupRunId)!;
      const proof = await d.launcher.stopScopedForRecovery({ state: d.state, nodeRunId: this.rootNode(group),
        scopeId: turn.executionId, agentId: turn.agentId, role: "delivery", ownershipEpoch: turn.ownershipEpoch,
        executionRuntimePath: turn.runtimePath });
      if (!proof.stopped) throw new Error("Final Agent still has an unconfirmed native process");
      d.database.stopScopedFinalNativeTurn(turn, true);
    }
    const projection = d.database.projectState(d.state.id);
    for (const execution of projection.scopedExecutions ?? []) {
      if (!["running", "integrating", "merged", "failed"].includes(execution.status)) continue;
      const turn = d.database.scopedAgentTurn(d.state.id, execution.id, execution.ownershipEpoch);
      if (!turn) continue;
      const alreadyStopped = turn.status === "stopped" && (turn.writerLeaseEpoch === d.database.writerLease().epoch ||
        d.database.scopedAgentRecoveredForCurrentWriter(d.state.id, execution.id, execution.ownershipEpoch, turn.invocationId));
      if (!alreadyStopped) {
        if (!d.launcher.stopScopedForRecovery) throw new Error("Retained scoped business invocation requires supervisor reconciliation");
        const proof = await d.launcher.stopScopedForRecovery({ state: d.state, nodeRunId: this.rootNode(d.database.scopedGroupRun(d.state.id, execution.groupRunId)!),
          scopeId: execution.id, agentId: execution.agentId, role: "delivery", ownershipEpoch: execution.ownershipEpoch, executionRuntimePath: turn.runtimePath });
        if (!proof.stopped) throw new Error("Scoped business process stop remains unconfirmed");
        d.database.reconcileScopedAgentTurn({ projectId: d.state.id, executionId: execution.id, ownershipEpoch: execution.ownershipEpoch,
          invocationId: turn.invocationId, residentStopConfirmed: true, evidence: proof.evidence });
      }
      const recovered = d.database.scopedAgentTurn(d.state.id, execution.id, execution.ownershipEpoch);
      if (recovered?.status === "reserved" && recovered.writerLeaseEpoch === d.database.writerLease().epoch &&
        d.database.scopedAgentMissingReportRepair(d.state.id, execution.id, execution.ownershipEpoch)) continue;
      if (!d.database.projectCancellationIntent(d.state.id) && !d.database.scopedAgentReport(d.state.id, execution.id, execution.ownershipEpoch) && execution.status !== "failed") {
        if (d.database.scopedExecutionHasUnsettledGitOperation(d.state.id, execution.id, execution.ownershipEpoch)) {
          d.database.recordScopedAgentInterruptedOperation({ projectId: d.state.id, executionId: execution.id,
            ownershipEpoch: execution.ownershipEpoch, invocationId: turn.invocationId });
        } else if (!alreadyStopped) d.database.failScopedAgentArrival({ projectId: d.state.id, arrivalRequestId: execution.arrivalRequestId, executionId: execution.id,
          ownershipEpoch: execution.ownershipEpoch, residentStopConfirmed: true, reason: "Interrupted native invocation stopped; its group Leader must coordinate retained-branch recovery" });
      }
    }
    if (!d.database.projectCancellationIntent(d.state.id)) for (const group of projection.scopedGroupRuns ?? []) d.database.recoverScopedFinalIntegration(d.state.id, group.id);
    await d.publish();
  }

  private rootNode(group: ScopedGroupRunRecord): string {
    let root = group;
    const seen = new Set<string>();
    while (root.parentGroupRunId) {
      if (seen.has(root.id)) throw new Error("Scoped ancestry cycle");
      seen.add(root.id);
      root = this.d.database.scopedGroupRun(this.d.state.id, root.parentGroupRunId)!;
    }
    const node = this.d.database.projectState(this.d.state.id).nodeRuns.find((entry) => entry.activationRequestId === root.activationRequestId);
    if (!node || node.node.kind !== "collaboration" || node.node.groupId !== root.groupId) throw new Error("Scoped group lost its outer node authority");
    return node.id;
  }

  private async request(agentId: string, invocationId: string, workspace: string, runtime: string,
    inbox: string, assignment: string, context: NonNullable<AgentRunRequest["executionContext"]>): Promise<AgentRunRequest> {
    const state = this.d.state;
    const request: AgentRunRequest = this.d.inputBuilder ? await this.d.inputBuilder.build({ state, agentId, executionContext: context,
      assignment, invocationId, inboxPath: inbox, projectPath: this.d.storage.projectDir(state.id), worktreePath: workspace, runtimePath: runtime }) : {
      project: structuredClone(state), purpose: "workflow", agent: agentId, kind: agentId === "main" ? "main" : "worker",
      permission: context.role === "leader" ? "workspace" : state.agents[agentId].permission,
      invocationId, inboxPath: inbox, projectPath: this.d.storage.projectDir(state.id), workspacePath: workspace, runtimePath: runtime,
      schemaPath: "", skillPaths: [], autoSkillPaths: [], availableSkillPaths: [], executionContext: context
    };
    request.sessionContinuity = "strict";
    request.resumeThreadId = state.agentSessionIds?.[agentId];
    this.d.decorate(request);
    this.requests.set(invocationId, request);
    return request;
  }

  private async openAgentResident(input: CollaborationResidentOpenInput, onLaunch?: () => void): Promise<CollaborationResidentHandle> {
    const openAndRegister = async () => {
      onLaunch?.();
      const handle = await this.d.launcher.open(input);
      this.nativeAgents.add(input.request.agent);
      this.d.register(`scoped:${input.request.invocationId}`, handle);
      return handle;
    };
    return this.d.withNativeLaunchFence
      ? this.d.withNativeLaunchFence(openAndRegister)
      : openAndRegister();
  }

  /** Leader assigns the publisher; the actual Agent receives every provider
   * result and decides its next action. The system only transports tools and
   * proves the task/PR/stop facts before the separate group completion turn. */
  private async integrateFinalAsAgent(integration: ScopedFinalIntegrationRecord): Promise<SynchronizedPullRequestFact> {
    const d = this.d;
    const group = d.database.scopedGroupRun(d.state.id, integration.groupRunId)!;
    const agentId = d.database.scopedGroupIntegrationRequest(d.state.id, group.id)?.integrationOwnerAgentId;
    if (!agentId || agentId === group.leaderAgentId) throw new Error("Final delivery requires the Leader's eligible business Agent");
    const retained = d.database.scopedFinalRecoveryPull(d.state.id, integration.id, integration.ownershipEpoch);
    const synchronization = retained?.mergeCommitSha ? d.database.scopedMergedSynchronization({
      projectId: d.state.id, executionId: integration.id, ownershipEpoch: integration.ownershipEpoch,
      providerNumber: retained.providerNumber, expectedHead: integration.expectedHeadSha,
      expectedBase: integration.integrationTarget, expectedMergeCommitSha: retained.mergeCommitSha }) : undefined;
    const taskId = `${integration.id}:epoch:${integration.ownershipEpoch}`;
    if (retained?.status === "merged" && synchronization && d.state.taskCompletions?.[taskId])
      return { ...retained, localSynchronization: synchronization };
    const invocationId = `inv_${randomUUID().replaceAll("-", "")}`;
    const runtimePath = await d.storage.invocationRuntimePath(d.state.id, invocationId);
    if (!d.database.reserveScopedFinalNativeTurn({ projectId: d.state.id, groupRunId: group.id,
      executionId: integration.id, ownershipEpoch: integration.ownershipEpoch, agentId, invocationId, runtimePath }))
      throw new ScopedManagementDeferredError();
    const turn = d.database.scopedFinalNativeTurns(d.state.id).find((entry) => entry.invocationId === invocationId)!;
    const workspace = path.join(d.storage.projectDir(d.state.id), "git-worktrees", "agents", agentId);
    const facts: AgentGitFacts = { pushedHeadSha: integration.expectedHeadSha,
      ...(retained ? { pullRequest: retained } : {}), ...(retained && synchronization ? { merged: { ...retained, localSynchronization: synchronization } } : {}) };
    const deliveryStatus = () => agentGitDeliveryStatus({ executionId: integration.id, ownershipEpoch: integration.ownershipEpoch,
      headSha: facts.pushedHeadSha, pull: facts.pullRequest, synchronized: Boolean(facts.merged?.localSynchronization),
      operations: d.database.projectState(d.state.id).operations });
    const sources = new AgentContextSources();
    const assignment = [`You are now the delivery Agent assigned by Leader ${group.leaderAgentId} for canonical final integration of ${group.groupId}.`,
      `Preserve your existing business checkout and native session. Only publish the canonical branch ${integration.executionBranch}@${integration.expectedHeadSha} into its direct target ${integration.integrationTarget}. Its head is already confirmed published by member delivery.`,
      "Use github_get_pr, github_create_pr and github_merge_pr to inspect/publish/integrate this exact canonical PR. Every provider result returns to you. Call finish_task for this delivery task. Group completion remains a separate Leader action.",
      "Do not push a new business branch or change completed work in this delivery task. If the provider reports a conflict or an unresolved result, report the real fact in your existing handoff so the Leader can coordinate retained member repair.",
      ].join("\n\n");
    sources.record("final-delivery-facts", "Retained provider facts", facts);
    let handle: CollaborationResidentHandle | undefined;
    let launchBegan = false;
    let stopped = false;
    try {
      const inbox = await d.storage.writeInbox(d.state, agentId, invocationId, assignment);
      const context: NonNullable<AgentRunRequest["executionContext"]> = { role: "delivery", nodeRunId: this.rootNode(group),
        groupRunId: group.id, executionId: integration.id, ownershipEpoch: integration.ownershipEpoch, executionWorktree: workspace };
      const request = await this.request(agentId, invocationId, workspace, runtimePath, inbox, assignment, context);
      request.contextSources = sources.sources;
      request.gitDirectBase = group.integrationTarget;
      const controlAuthorityFactory: CollaborationControlAuthorityFactory = async ({ turn: nativeTurn }) => {
        const capability = randomUUID();
        const capabilityHash = createHash("sha256").update(capability).digest("hex");
        const control: ControlMcpRequest = { capability, capabilityHash, stateVersion: integration.ownershipEpoch,
          stagingPath: path.join(runtimePath, "controls", "actions.json"), candidates: [], decisionBy: "agent",
          scopedAgentRouting: true, canComplete: false, allowUserIntervention: false,
          allowAgentGitActions: true, canonicalFinalIntegration: true, allowFinishRoute: true, requireBridge: true, workspacePath: workspace };
        return { control, revalidate: async (envelope) => {
          if (envelope.projectId !== d.state.id || envelope.agent !== agentId || envelope.invocationId !== nativeTurn.invocationId ||
            envelope.stateVersion !== integration.ownershipEpoch || envelope.capabilityHash !== capabilityHash)
            throw new Error("Final Agent action differs from its live task capability");
          await d.database.operationsForProject(d.state.id, true).assertExecutionOwnership({ projectId: d.state.id,
            executionId: integration.id, ownershipEpoch: integration.ownershipEpoch, expectedBranch: integration.executionBranch, operation: "provider.mutate" });
          if (d.database.scopedFinalNativeTurns(d.state.id).find((entry) => entry.invocationId === invocationId)?.status !== "opened")
            throw new Error("Final Agent native authority is not open");
          if (envelope.action.tool === "finish_task") await d.storage.requestTaskCompletion(d.state, taskId, envelope);
          else if (!isAgentGitAction(envelope.action.tool)) throw new Error("Final delivery only has its task completion and canonical PR tools");
        }, execute: async (envelope, signal) => {
          const result = await executeAgentGitTool({ git: d.git as CollaborationGitFacade, repository: d.repository,
            execution: { ...integration, purpose: "group-final-integration" }, base: integration.integrationTarget,
            facts, envelope, signal,
            ...agentGitOperationJournal(d.database, d.state.id),
            recordedOperation: id => d.database.recordedGitOperation(d.state.id, id),
            recordedSynchronization: query => d.database.scopedMergedSynchronization(query), deliveryStatus });
          if (facts.pullRequest) d.database.recordScopedFinalRecoveryPull(d.state.id, group.id, facts.pullRequest);
          return result;
        } };
      };
      const reopenProof = d.database.assertScopedFinalNativeReopenLaunch(turn);
      handle = await this.openAgentResident({ request, executionRuntimePath: runtimePath, signal: d.signal,
        ...(reopenProof ? { sameEpochReopen: { previousRuntimePath: reopenProof.previousRuntimePath,
          revalidate: () => {
            if (d.database.assertScopedFinalNativeReopenLaunch(turn)?.previousRuntimePath !== reopenProof.previousRuntimePath)
              throw new Error("Final supplemental launch lineage changed before native open");
          } } } : {}),
        filesystemAuthorityInput: await d.filesystem(), onTrace: d.trace(agentId, invocationId),
        onOpened: async () => { d.database.markScopedFinalNativeOpened(turn); },
        turnRequestFactory: async () => ({ request: { ...request, project: structuredClone(d.state) }, onTrace: d.trace(agentId, invocationId) }),
        controlScope: { role: "scoped-agent", projectId: d.state.id, nodeRunId: context.nodeRunId, groupRunId: group.id,
          executionId: integration.id, agentId, ownershipEpoch: integration.ownershipEpoch, candidates: [], decisionBy: "agent" },
        controlAuthorityFactory }, () => { launchBegan = true; });
      await d.publish();
      let result: AgentRunResult | undefined;
      const missing = () => [!d.state.taskCompletions?.[taskId] && "finish_task",
        ...deliveryStatus().missingActions].filter(Boolean);
      for (let attempt = 0; attempt <= 2; attempt += 1) {
        d.signal.throwIfAborted();
        result = await d.submit(handle, { inputId: `scoped-final:${integration.id}:${invocationId}:${attempt}`, invocationId,
          prompt: attempt === 0 ? assignment : `Continue the same canonical delivery task. Missing actions: ${missing().join(", ")}. Existing provider facts: source=final-delivery-facts in the current context index. Inspect real results and report any blocker to the Leader.` });
        if (!missing().length || facts.pullRequest && ["conflicted", "closed", "unknown"].includes(facts.pullRequest.status)) break;
      }
      await d.storage.writeHandoff(d.state, agentId, invocationId, result?.handoff ?? "Canonical delivery turn returned without a textual handoff.");
      if (!facts.pullRequest) throw new Error("Final Agent returned without an explicit canonical PR action");
      if (!d.state.taskCompletions?.[taskId]) throw new Error("Final Agent must explicitly call finish_task");
      return facts.merged ?? facts.pullRequest;
    } finally {
      if (handle) { await handle.close(); stopped = true; d.unregister(`scoped:${invocationId}`); this.nativeAgents.delete(agentId); }
      if (stopped || !launchBegan) d.database.stopScopedFinalNativeTurn(turn, true);
      await d.publish();
    }
  }

  private async prepareAgent(input: ScopedAgentTurnInput): Promise<CollaborationResidentOpenInput> {
    const d = this.d;
    const plan = d.database.scopedGroupPlan(d.state.id, input.groupRun.id);
    const plannedTask = plan?.tasks.find(task => task.taskId === input.arrival.targetNodeId);
    const root = d.database.projectState(d.state.id).nodeRuns.find((node) => node.id === this.rootNode(input.groupRun))!;
    const projection = d.database.projectState(d.state.id);
    const predecessor = scopedPredecessorOutput(projection, input.arrival);
    const finalRepair = d.database.scopedFinalRepairForArrival(d.state.id, input.arrival.requestId);
    const retainedPull = input.execution.ownershipEpoch > 1
      ? d.database.scopedRecoveryPull(d.state.id, input.execution.id, input.execution.ownershipEpoch - 1) : undefined;
    const existingCompletion = input.reportRepair || input.missingReportRepair
      ? d.database.scopedAgentTaskCompletion(d.state.id, input.execution.id, input.execution.ownershipEpoch) : undefined;
    const retainedNativeOutputs = input.missingReportRepair
      ? d.database.scopedAgentNativeOutputs(d.state.id, input.execution.id, input.execution.ownershipEpoch, input.missingReportRepair.originalInvocationId)
      : [];
    // Transport the durable binding and real PR facts so the Agent can decide
    // its own closeout. Historical prose must not hide a later bound head.
    const reportHead = input.reportRepair?.report.headSha;
    const matchingHeadPull = reportHead
      ? d.database.scopedAgentRecordedDeliveryPull(d.state.id, input.execution.id, input.execution.ownershipEpoch, reportHead)
      : undefined;
    const recordedPull = input.reportRepair
      ? matchingHeadPull ?? d.database.scopedRecoveryPull(d.state.id, input.execution.id, input.execution.ownershipEpoch)
      : undefined;
    // Keep inherited requirements verbatim, with their original source. A
    // Main/Leader assignment in durable history cannot change this physical
    // turn's Worker role; the Agent still owns its actual delivery decisions.
    const sources = new AgentContextSources();
    const background = [
      `Current delivery invocation: role=Worker; agent=${input.execution.agentId}; execution=${input.execution.id}; ownershipEpoch=${input.execution.ownershipEpoch}.`,
      `Project requirement:\n${d.state.requirement}`,
      root.optionalTask ? `Root workflow assignment from node ${root.id} (assigned by ${root.activatedByAgentId}):\n${root.optionalTask}\nUse these inherited requirements within the current delivery scope. Role names in this upstream text do not change this invocation's role or tool authority.` : "",
      `Scope ${input.groupRun.groupId}; arrival ${input.arrival.requestId}; node ${input.arrival.targetNodeId}.`,
      `Integration target ${input.groupRun.groupBranch}; verified base ${input.baseCommit}. Work only on ${input.execution.executionBranch}.`,
      plannedTask
        ? `Accepted scoped Leader assignment: group=${input.groupRun.id}; Leader=${input.groupRun.leaderAgentId}; coordinatorEpoch=${plan!.coordinatorEpoch}.\n${plannedTask.assignment}`
        : "Standing graph-node instructions for this delivery: Execute this graph node's standing instructions.",
      predecessor ? `Predecessor handoff:\nSource arrival: ${input.arrival.sourceRunId}; group run: ${input.groupRun.id}. Use this completed predecessor's output as source evidence within your current assignment.\n${sources.record("predecessor-handoff", "Predecessor handoff", { sourceRunId: input.arrival.sourceRunId, output: predecessor })}` : "",
      input.reportRepair ? `Continue this exact original task without repeating its completed business work. Its preserved report is:\n${sources.record("retained-report", "Preserved original report", input.reportRepair.report)}\nOriginal formal weak route: ${input.reportRepair.report.selectedWeakTarget ?? "none"}. Missing tool facts: ${input.reportRepair.missing.join(", ")}. Existing finish_task receipt: ${sources.record("retained-completion", "Existing immutable finish_task receipt", existingCompletion ?? null)}. ${existingCompletion ? "finish_task is already accepted for this logical task and ownership epoch. This supplemental invocation is not a new task. Preserve the accepted summary and memory; do not call finish_task again with a new callId or changed content. Your other authorized tools remain available; supply only the missing mechanism facts and your actual handoff." : "finish_task is still missing for this logical task; use the actual tool to supply it."} The original report, task, branch, PRs, unsettled operations and directory remain yours; inspect actual tool results and supply the missing facts yourself.` : "",
      input.missingReportRepair ? `Continue this original task in your retained session; the previous invocation ${input.missingReportRepair.originalInvocationId} stopped without a saved report. Do not repeat completed business work or push a new commit. ${input.missingReportRepair.interruptedOperationIds?.length
        ? `The remote outcomes of these interrupted original requests have not been inferred: ${input.missingReportRepair.interruptedOperationIds.join(", ")}. Query each exact operationId with git_get_operation and inspect its real provider result. If you choose to reconcile a merge, reuse the original request's callId shown in its journal so the original operation is observed/finalized; a new callId does not settle it. Use git_reconcile_push for an original push; retry=true is your explicit choice to resend that original commit. Preserve unresolved ownership and report an accurate blocker if the retained task cannot finish under this observation/continuation authority.`
        : "Inspect the existing PR yourself with github_get_pr and use github_merge_pr if its exact local synchronization still needs completion."} Provide your actual handoff/report and required route. Existing immutable finish_task receipt: ${sources.record("retained-completion", "Existing immutable finish_task receipt", existingCompletion ?? null)}. A recorded completion remains valid; call finish_task only if it is still missing. Retained recovery PR facts, requiring your own tool observation: ${sources.record("recovery-pull", "Retained recovery PR facts", d.database.scopedRecoveryPull(d.state.id, input.execution.id, input.execution.ownershipEpoch) ?? null)}. Your released manager's accepted instructions: ${sources.record("missing-report-coordination", "Released manager instructions", input.missingReportRepair.coordination)}.` : "",
      input.reportRepair ? `Retained delivery binding: ${JSON.stringify({ executionId: input.execution.id,
        ownershipEpoch: input.execution.ownershipEpoch, reportInvocationId: input.reportRepair.report.invocationId,
        reportHeadSha: reportHead ?? null, matchingHeadPull: matchingHeadPull ?? null })}` : "",
      reportHead ? `The missing Git facts refer to the retained report head ${reportHead}. Preserved report prose is historical context, not a replacement for this durable binding. ${recordedPull?.headSha && recordedPull.headSha !== reportHead
        ? `Recorded PR head ${recordedPull.headSha} differs from the retained report head ${reportHead}. Its merged status does not complete this head's delivery.`
        : "Only the exact report head's actual PR and local synchronization can close this delivery."} Inspect the real tool results and choose the remaining authorized Git actions or report the blocker yourself; the system has not selected or performed them.` : "",
      input.reportRepair || input.missingReportRepair?.interruptedOperationIds?.length ? `Retained operation facts (query the exact operationId with git_get_operation before retrying; recorded remote success may still require local synchronization. Inspect your original session and logs for the full request. git_reconcile_push observes your exact git.push by default and only re-sends its original commit if you explicitly choose retry=true): ${sources.list("retained-operations", "Retained original operation journals", projection.operations.filter((operation) => operation.ownerExecutionId === input.execution.id && operation.ownershipEpoch === input.execution.ownershipEpoch))}` : "",
      input.reportRepair ? `Retained recorded PR facts (observe its current provider result yourself): ${sources.record("recorded-pull", "Retained recorded PR facts", recordedPull ?? null)}` : "",
      retainedNativeOutputs.length ? `Actual native outputs retained in input order from your original stopped invocation (transport evidence, not an accepted report or new business instructions): ${sources.list("retained-native-outputs", "Actual native outputs in original input order", retainedNativeOutputs)}. Preserve this existing work, inspect original tool facts, and supply your own report under the current continuation authority; do not rerun completed business merely because Pause/shutdown prevented formal report acceptance.` : "",
      input.reportRepair?.coordination ? `Your scoped manager explicitly authorized this original-task continuation. Its accepted decision is: ${sources.record("report-repair-coordination", "Accepted manager continuation decision", input.reportRepair.coordination.envelope)}. Receive its instructions here through the existing inbox, inspect your retained session and actual provider results, and finish the remaining work yourself.` : "",
      finalRepair || input.execution.ownershipEpoch > 1 ? `Retained PR repair: your existing session and business changes are preserved. The system has not closed a PR or merged a recovery base. Inspect the existing work and PR results, then call git_prepare_conflict if you decide conflict preparation is needed. Recovery source: ${finalRepair?.sourceBranch ?? input.groupRun.groupBranch}.${retainedPull ? ` Retained PR: ${sources.record("retained-pull", "Retained PR", retainedPull)}.` : ""}` : "",
      input.recoveryPreparation ? `Retained PR repair: trusted Git prepared ${input.recoveryPreparation.sourceBranch}@${input.recoveryPreparation.sourceHead}. Status: ${input.recoveryPreparation.status}. Resolve any remaining conflicts, preserve prior business changes, and commit the repaired result. Conflict paths: ${input.recoveryPreparation.conflictPaths.join(", ") || "none"}.` : "",
      `Current Git tool ownership: execution ${input.execution.id}, ownership epoch ${input.execution.ownershipEpoch}, head branch ${input.execution.executionBranch}, direct target ${input.groupRun.groupBranch}. github_get_pr without providerNumber discovers this execution's own PR. An explicit providerNumber must belong to this execution and its head/direct target; an earlier task's PR number from session memory or a predecessor handoff cannot stand in for this task's delivery. A missing PR is an actual observation, not permission to reuse an unrelated one. Inspect the real result and choose the remaining Git actions or report a blocker to your scoped manager yourself.`,
      reportHead
        ? `Retained work-record path: agent-memory/${input.execution.agentId}/Memory.md; report head ${reportHead}. A bound report head does not prove this file was committed. Inspect its actual committed content and current git_status before deciding what remains. Preserve completed work-record steps; do not append another record or create another commit solely to repeat them. A clean worktree or older merged PR does not supply the missing facts for this head. Keep the report head and any accepted finish_task immutable, and provide this supplement's verified operational facts through your actual handoff. If a pending required file needs authority unavailable under the retained report binding, report that exact blocker to your scoped manager rather than discarding required evidence or replacing the report.`
        : input.missingReportRepair
        ? `Retained work record for this stopped task: agent-memory/${input.execution.agentId}/Memory.md. Preserve the existing file and accepted finish_task summary/memory. Supply this report continuation's verified observations through your actual handoff. Report any unresolved work-record or checkout issue to your scoped manager within this continuation's existing authority.`
        : input.reportRepair
        ? `Original-task work record: agent-memory/${input.execution.agentId}/Memory.md. Inspect the retained file, its actual committed content and current git_status. Do not append another record solely because this is a new physical invocation. Preserve any completed work-record step and accepted finish_task; supply this supplement's operational observations through your actual handoff. Complete a genuinely missing work record only within this task's current tool authority. Any new commit requires its own exact-head push, PR merge and local synchronization; a previously merged PR does not cover it. Report authority blockers to your scoped manager without repeating completed business or discarding required evidence.`
        : `Record this turn's verified facts, decisions, handoff and any no-code review in agent-memory/${input.execution.agentId}/Memory.md inside this execution worktree. Append to the existing file and preserve earlier entries. Treat that work record as a deliverable: commit it with the business changes, or commit it by itself when no other files changed, before calling git_push. The finish_task memory field is a durable mirror, not a substitute for the committed record.`,
      (() => {
        const weak = (input.workflow.routes[input.arrival.targetNodeId] ?? []).filter((edge) => edge.kind === "weak").map((edge) => edge.target);
        return d.state.agents[input.execution.agentId]?.decisionBy === "agent" && weak.length
          ? `This Agent owns the current local weak route. After completing the business task and Git delivery, call route_to_agent with exactly one of: ${weak.join(", ")}. A prose handoff is not a formal route receipt.` : "";
      })(),
      `Publish artifacts through MCP. When delivery is required, use the explicit Git/GitHub tools exposed to this turn; the system will return their real provider results.`].filter(Boolean).join("\n\n");
    sources.record("delivery-reference", "Delivery protocol and retained evidence", background);
    const messages: WorkflowDirectMessage[] = [];
    if (plannedTask) messages.push({ sender: input.groupRun.leaderAgentId, body: plannedTask.assignment });
    messages.push(...scopedPredecessorMessages(projection, input.arrival, input.workflow.routes));
    if (input.reportRepair) messages.push({ sender: "OpenFARS", body:
      `Continue the original task. Missing formal mechanism facts: ${input.reportRepair.missing.join(", ")}. Preserve accepted reports and receipts.` });
    if (input.missingReportRepair) messages.push({ sender: "OpenFARS", body:
      `Continue the original task in its retained session; the previous invocation ${input.missingReportRepair.originalInvocationId} stopped without a saved report. Supply your missing report. Interrupted operations: ${(input.missingReportRepair.interruptedOperationIds ?? []).join(", ")}. Preserve accepted receipts.` });
    const coordination = input.reportRepair?.coordination?.envelope ?? input.missingReportRepair?.coordination;
    if (coordination && "rationale" in coordination.action && typeof coordination.action.rationale === "string")
      messages.push({ sender: coordination.agent, body: coordination.action.rationale });
    const assignment = workflowMessagesText(messages);
    const runtime = await d.storage.invocationRuntimePath(d.state.id, input.invocationId);
    if (runtime !== input.runtimePath) throw new Error("Scoped native runtime path differs from trusted storage");
    const inbox = await d.storage.writeInbox(d.state, input.execution.agentId, input.invocationId, assignment);
    const context: NonNullable<AgentRunRequest["executionContext"]> = { role: "delivery", nodeRunId: this.rootNode(input.groupRun),
      groupRunId: input.groupRun.id, executionId: input.execution.id, ownershipEpoch: input.execution.ownershipEpoch,
      executionWorktree: input.execution.worktreePath };
    const request = await this.request(input.execution.agentId, input.invocationId, input.execution.worktreePath, runtime, inbox, assignment, context);
    request.contextSources = sources.sources;
    const decisionBy = d.state.agents[input.execution.agentId].decisionBy === "main" ? "main" : "agent";
    const candidates = decisionBy === "agent" ? (input.workflow.routes[input.arrival.targetNodeId] ?? []).filter((edge) => edge.kind === "weak").map((edge) => edge.target) : [];
    const repairIdentity = input.reportRepair ? { projectId: d.state.id, executionId: input.execution.id,
      ownershipEpoch: input.execution.ownershipEpoch, agentId: input.execution.agentId,
      invocationId: input.invocationId, runtimePath: runtime, originalReportInvocationId: input.reportRepair.report.invocationId } : undefined;
    const repairProof = repairIdentity ? d.database.assertScopedAgentReportRepairLaunch(repairIdentity) : undefined;
    const missingRepairIdentity = input.missingReportRepair ? { projectId: d.state.id, executionId: input.execution.id,
      ownershipEpoch: input.execution.ownershipEpoch, agentId: input.execution.agentId, invocationId: input.invocationId, runtimePath: runtime } : undefined;
    const missingRepairProof = missingRepairIdentity ? d.database.assertScopedAgentMissingReportRepairLaunch(missingRepairIdentity) : undefined;
    return { request, initialTask: assignment, executionRuntimePath: runtime, filesystemAuthorityInput: await d.filesystem(), signal: d.signal,
      ...(repairProof ? { sameEpochReopen: { previousRuntimePath: repairProof.previousRuntimePath,
        revalidate: () => { d.database.assertScopedAgentReportRepairLaunch(repairIdentity!); } } } : {}),
      ...(missingRepairProof ? { sameEpochReopen: { previousRuntimePath: missingRepairProof.previousRuntimePath,
        revalidate: () => { d.database.assertScopedAgentMissingReportRepairLaunch(missingRepairIdentity!); } } } : {}),
      onTrace: d.trace(request.agent, request.invocationId),
      turnRequestFactory: async ({ turn }) => {
        const current = { ...request, project: structuredClone(d.state) };
        const onTrace = d.trace(request.agent, request.invocationId);
        const gatewayModelFetch = await createR11GatewayFetch({ projectTitle: d.state.title,
          projectRoot: d.storage.projectDir(d.state.id), execution: { ...input.execution, purpose: "delivery" },
          arrivalRequestId: input.arrival.requestId, arrivalSequence: input.arrival.sequence,
          targetNodeId: input.arrival.targetNodeId, groupRunId: input.groupRun.id,
          base: input.groupRun.groupBranch, repository: d.repository,
          invocationId: turn.invocationId, inputId: turn.inputId, config: current.project.agents[current.agent], onTrace });
        return { request: { ...current, ...(gatewayModelFetch ? { gatewayModelFetch } : {}) }, onTrace };
      },
      controlScope: { role: "scoped-agent", projectId: d.state.id, nodeRunId: context.nodeRunId, groupRunId: input.groupRun.id,
        executionId: input.execution.id, agentId: input.execution.agentId, ownershipEpoch: input.execution.ownershipEpoch, candidates, decisionBy },
      controlAuthorityFactory: this.agentControl(input, candidates, decisionBy) };
  }

  private agentControl(input: ScopedAgentTurnInput, candidates: string[], decisionBy: "main" | "agent"): CollaborationControlAuthorityFactory {
    // Agents own their choices and provider operations. Each model turn gets
    // fresh authority and a separate journal; the system preserves previously
    // accepted choices without re-authorizing their old capabilities.
    const retained: ControlActionEnvelope[] = [];
    return async ({ turn }) => {
      const capability = randomUUID();
      const hash = createHash("sha256").update(capability).digest("hex");
      this.capabilities.set(turn.invocationId, { hash, accepted: [], retained });
      const control: ControlMcpRequest = { capability, capabilityHash: hash,
        stagingPath: path.join(input.runtimePath, "control-turns", createHash("sha256").update(turn.inputId).digest("hex"), "actions.json"),
        stateVersion: input.execution.ownershipEpoch,
        candidates, decisionBy, scopedAgentRouting: true, allowFinishRoute: true, allowUserIntervention: false,
        canComplete: false, allowAgentGitActions: true, workspacePath: input.execution.worktreePath, requireBridge: true };
      return { control, revalidate: async (envelope) => {
        this.assertReceipt(envelope, input.invocationId, input.execution.agentId, input.execution.ownershipEpoch);
        const native = this.d.database.scopedAgentTurn(this.d.state.id, input.execution.id, input.execution.ownershipEpoch);
        if (native?.invocationId !== input.invocationId || native.status !== "opened" ||
          native.writerLeaseEpoch !== this.d.database.writerLease().epoch) {
          throw new Error("Scoped Agent tool receipt is outside its exact live native authority");
        }
        await this.d.database.operationsForProject(this.d.state.id, true).assertExecutionOwnership({ projectId: this.d.state.id,
          executionId: input.execution.id, ownershipEpoch: input.execution.ownershipEpoch, expectedBranch: input.execution.executionBranch, operation: "provider.mutate" });
        if (envelope.action.tool === "route_to_agent") {
          const original = retained.find((item) => item.action.tool === "route_to_agent")?.action;
          const originalTarget = original?.tool === "route_to_agent" ? original.target : input.reportRepair?.report.selectedWeakTarget;
          if (originalTarget && envelope.action.target !== originalTarget) {
            throw new Error("Supplemental mechanism turn cannot replace the original Agent's formal route");
          }
          if (!candidates.includes(envelope.action.target)) throw new Error("Worker route is outside its Agent-owned local candidates");
          this.d.database.previewScopedArrivalRoute(this.d.state.id, input.arrival.requestId, envelope.action.target);
        } else if (envelope.action.tool === "finish_task") {
          await rejectR03InitialFinish({ projectTitle: this.d.state.title, projectRoot: this.d.storage.projectDir(this.d.state.id),
            execution: { ...input.execution, purpose: "delivery" }, arrivalRequestId: input.arrival.requestId,
            groupRunId: input.groupRun.id, base: input.groupRun.groupBranch, repository: this.d.repository,
            envelope, inputId: turn.inputId, facts: this.agentGitFacts.get(input.invocationId),
            completionAlreadyAccepted: this.d.database.scopedAgentTaskCompleted(this.d.state.id, input.execution.id,
              input.execution.ownershipEpoch, input.invocationId) });
          // The completion receipt records only this delivery task. It does
          // not release the group, create a PR, or close the native channel.
          await this.recordAgentTaskCompletion(input, envelope);
        } else if (envelope.action.tool === "publish_artifact") {
          if (envelope.action.replacesPath !== undefined) {
            throw new Error("Pending publication replacement requires standalone execution authority");
          }
          await this.d.storage.resolveExecutionArtifactCandidate(this.d.state.id, input.execution, envelope.action.path);
        } else if (!isAgentGitAction(envelope.action.tool)) throw new Error("Scoped business turn cannot perform management or global actions");
        const accepted = this.capabilities.get(input.invocationId)!.accepted;
        if (!accepted.some((item) => item.callId === envelope.callId)) accepted.push(structuredClone(envelope));
      }, execute: (envelope, signal) => this.executeAgentGitAction({ ...input, signal }, envelope, turn.inputId) };
    };
  }

  private assertReceipt(envelope: ControlActionEnvelope, invocationId: string, agentId: string, version: number): void {
    const capability = this.capabilities.get(invocationId);
    if (!capability || envelope.projectId !== this.d.state.id || envelope.agent !== agentId ||
      envelope.invocationId !== invocationId || envelope.stateVersion !== version || envelope.capabilityHash !== capability.hash) {
      throw new Error("Native receipt does not match its exact scoped turn capability");
    }
  }

  private async executeAgentGitAction(input: ScopedAgentTurnInput, envelope: ControlActionEnvelope, inputId: string): Promise<unknown> {
    const action = envelope.action;
    const authority: GitExecutionAuthority & { projectId: string } = { ...input.execution, purpose: "delivery" };
    const key = input.invocationId;
    const facts = this.agentGitFacts.get(key) ?? {
      pushedHeadSha: this.d.database.scopedAgentReport(this.d.state.id, input.execution.id, input.execution.ownershipEpoch)?.headSha
    };
    this.agentGitFacts.set(key, facts);
    if (isAgentGitAction(action.tool) && action.tool !== "git_prepare_conflict") {
      // Provider/checkpoint outcomes belong to the submitting Agent. Reuse
      // the common tool so unchanged or unconfirmed pushes stay real tool
      // results. An explicit PR observation can recover its published head;
      // the system must not choose another commit, PR or provider merge.
      const gitInput = { git: this.d.git, repository: this.d.repository,
        execution: authority, base: input.groupRun.groupBranch, facts, envelope, signal: input.signal,
        ...agentGitOperationJournal(this.d.database, this.d.state.id),
        recordedOperation: (id: string) => this.d.database.recordedGitOperation(this.d.state.id, id),
        recordedSynchronization: (query: Parameters<CollaborationStateDatabase["scopedMergedSynchronization"]>[0]) => this.d.database.scopedMergedSynchronization(query),
        deliveryStatus: () => this.agentGitDelivery(input) };
      const result = await executeAgentGitTool(gitInput);
      const mergeOperation = action.tool === "github_merge_pr" ? this.d.database.recordedGitOperation(this.d.state.id,
        agentGitOperationId(gitInput, "merge")) : undefined;
      if (action.tool === "github_get_pr" && result && typeof result === "object" &&
        "id" in result && "providerNumber" in result) {
        const observedPull = result as GitHubPullRequestFact;
        // Keep this turn's explicit observations by PR. A later history read
        // cannot erase the Agent's observation of its current delivered head.
        const observed = this.agentObservedPulls.get(key) ?? new Map<number, GitHubPullRequestFact>();
        observed.set(observedPull.providerNumber, structuredClone(observedPull));
        this.agentObservedPulls.set(key, observed);
      }
      await withholdR12MergeResponse({ projectTitle: this.d.state.title, projectRoot: this.d.storage.projectDir(this.d.state.id),
        execution: authority, arrivalRequestId: input.arrival.requestId, groupRunId: input.groupRun.id,
        base: input.groupRun.groupBranch, repository: this.d.repository, envelope, result,
        operation: mergeOperation });
      return requestR04PendingFile({ projectTitle: this.d.state.title, projectRoot: this.d.storage.projectDir(this.d.state.id),
        execution: authority, arrivalRequestId: input.arrival.requestId, groupRunId: input.groupRun.id,
        base: input.groupRun.groupBranch, repository: this.d.repository, inputId, envelope, result,
        operation: mergeOperation });
    }
    const group = input.groupRun;
    if (action.tool === "git_prepare_conflict") {
      if (!this.d.git.prepareConflictResolution) throw new Error("Conflict preparation is unavailable for this Git facade");
      // Recovery only wakes the original Agent. The Agent chooses this tool;
      // the runtime must not merge a base into its retained worktree on launch.
      const finalRepair = this.d.database.scopedFinalRepairForArrival(this.d.state.id, input.arrival.requestId);
      const sourceBranch = finalRepair?.sourceBranch ?? group.groupBranch;
      const base = this.d.git.refreshRecoveryBase
        ? await this.d.git.refreshRecoveryBase(this.d.repository, authority, input.execution.ownershipEpoch, sourceBranch, input.signal)
        : await this.d.git.observeRemoteRef(this.d.repository, sourceBranch, input.signal);
      if (base.status !== "present" || !/^[0-9a-f]{40}$/i.test(base.sha ?? "") || base.ref !== sourceBranch ||
        base.owner !== this.d.repository.owner || base.repository !== this.d.repository.name)
        throw new Error("Recovery base is unavailable for conflict preparation");
      const prepared = await this.d.git.prepareConflictResolution(authority, input.execution.ownershipEpoch,
        sourceBranch === "main" ? { kind: "main", expectedHead: base.sha! }
          : { kind: "group", groupRunId: sourceBranch.slice("groups/".length), expectedHead: base.sha! }, input.signal);
      return prepared;
    }
    throw new Error("Agent Git action is not supported by this scoped execution");
  }

  private async agentGitDelivery(input: ScopedAgentTurnInput): Promise<AgentGitDeliveryStatus> {
    const { database } = this.d;
    const execution = input.execution;
    const facts = this.agentGitFacts.get(input.invocationId);
    const observed = await this.observedRetainedReportDelivery(input);
    const report = database.scopedAgentReport(this.d.state.id, execution.id, execution.ownershipEpoch);
    const headSha = facts?.pushedHeadSha ?? observed?.headSha ?? input.reportRepair?.report.headSha ?? report?.headSha;
    const recorded = headSha ? database.scopedAgentRecordedDeliveryPull(this.d.state.id, execution.id, execution.ownershipEpoch, headSha) : undefined;
    const pull = observed?.pullRequest ?? (facts?.pullRequest && facts.pullRequest.headSha === headSha ? facts.pullRequest : undefined) ?? recorded;
    const merged = facts?.merged && facts.merged.headSha === headSha ? facts.merged : undefined;
    const synchronized = Boolean(observed?.synchronized || merged?.status === "merged" && merged.localSynchronization ||
      pull?.status === "merged" && pull.mergeCommitSha && database.scopedMergedSynchronization({ projectId: this.d.state.id,
        executionId: execution.id, ownershipEpoch: execution.ownershipEpoch, providerNumber: pull.providerNumber,
        expectedHead: headSha!, expectedBase: pull.base, expectedMergeCommitSha: pull.mergeCommitSha }));
    return agentGitDeliveryStatus({ executionId: execution.id, ownershipEpoch: execution.ownershipEpoch, headSha, pull, synchronized,
      operations: database.projectState(this.d.state.id).operations,
      worktreeMissingActions: await executionWorktreeClosingActions(this.d.git, { ...execution, purpose: "delivery" }, input.signal) });
  }

  private retainAgentTurnResult(input: ScopedAgentTurnInput, result: AgentRunResult): void {
    const capability = this.capabilities.get(input.invocationId);
    if (!capability?.retained) throw new Error("Scoped Agent turn has no retained receipt authority");
    for (const envelope of result.controlActions ?? []) {
      this.assertReceipt(envelope, input.invocationId, input.execution.agentId, input.execution.ownershipEpoch);
      if (!capability.accepted.some((item) => item.callId === envelope.callId && isDeepStrictEqual(item, envelope))) {
        throw new Error("Native result contains an action not accepted by the live control broker");
      }
    }
    // Validate the entire completed turn before retaining any of its receipts.
    // Failed/forged results cannot leave partial business routing or artifacts.
    for (const envelope of result.controlActions ?? []) {
      if (!capability.retained.some((item) => isDeepStrictEqual(item, envelope))) capability.retained.push(structuredClone(envelope));
    }
  }

  /** A report-only continuation requires the Agent's explicit current-head
   * PR observation. A later supplemental delivery also needs its original
   * exact push, merge and sync journal; the older recovery PR stays intact. */
  private async observedRetainedReportDelivery(input: ScopedAgentTurnInput): Promise<{
    headSha: string; synchronized: boolean; pullRequest: GitHubPullRequestFact
  } | undefined> {
    const facts = this.agentGitFacts.get(input.invocationId);
    if (!(input.reportRepair || input.missingReportRepair) || input.reportRepair?.report.headSha || facts?.pushedHeadSha) return undefined;
    const retained = this.d.database.scopedRecoveryPull(this.d.state.id, input.execution.id, input.execution.ownershipEpoch);
    if (retained?.status !== "merged") return undefined;
    const observations = [...(this.agentObservedPulls.get(input.invocationId)?.values() ?? [])];
    if (!observations.length) return undefined;
    const checkout = await this.d.git.observeRetainedExecution({ ...input.execution, purpose: "delivery" },
      input.execution.ownershipEpoch, input.signal);
    if (checkout.projectId !== this.d.state.id || checkout.executionId !== input.execution.id ||
      checkout.ownershipEpoch !== input.execution.ownershipEpoch || checkout.branch !== input.execution.executionBranch ||
      checkout.worktreePath !== input.execution.worktreePath) throw new Error("Retained report observation changed its exact checkout identity");
    const matching = observations.filter(pull => pull.status === "merged" && pull.headSha === checkout.head &&
      pull.ownerExecutionId === input.execution.id && pull.head === input.execution.executionBranch &&
      pull.owner === this.d.repository.owner && pull.repository === this.d.repository.name &&
      pull.base === input.groupRun.groupBranch && /^[0-9a-f]{40}$/i.test(pull.headSha ?? "") &&
      /^[0-9a-f]{40}$/i.test(pull.mergeCommitSha ?? ""));
    if (matching.length !== 1) return undefined;
    const observed = matching[0];
    const original = observed.id === retained.id && observed.providerNumber === retained.providerNumber &&
      observed.headSha === retained.headSha && observed.mergeCommitSha === retained.mergeCommitSha;
    if (!original) {
      const recorded = this.d.database.scopedAgentRecordedDeliveryPull(this.d.state.id,
        input.execution.id, input.execution.ownershipEpoch, checkout.head);
      if (recorded?.status !== "merged" || recorded.id !== observed.id || recorded.providerNumber !== observed.providerNumber ||
        recorded.headSha !== observed.headSha || recorded.base !== observed.base ||
        recorded.mergeCommitSha !== observed.mergeCommitSha) return undefined;
      const pushed = this.d.database.projectState(this.d.state.id).operations.some(operation =>
        operation.kind === "git.push" && operation.status === "finalized" &&
        operation.ownerExecutionId === input.execution.id && operation.ownershipEpoch === input.execution.ownershipEpoch &&
        operation.expectedHead === checkout.head && operation.expectedBase === input.execution.executionBranch &&
        operation.remoteFact?.status === "present" && operation.remoteFact.sha === checkout.head &&
        operation.remoteFact.ref === input.execution.executionBranch &&
        operation.remoteFact.owner === this.d.repository.owner && operation.remoteFact.repository === this.d.repository.name);
      if (!pushed) return undefined;
    }
    const synchronization = this.d.database.scopedMergedSynchronization({ projectId: this.d.state.id,
      executionId: input.execution.id, ownershipEpoch: input.execution.ownershipEpoch, providerNumber: observed.providerNumber,
      expectedHead: observed.headSha!, expectedBase: input.groupRun.groupBranch, expectedMergeCommitSha: observed.mergeCommitSha! });
    if (!original && !synchronization) return undefined;
    return { headSha: observed.headSha!, synchronized: Boolean(synchronization), pullRequest: observed };
  }

  private async acceptAgent(input: ScopedAgentTurnInput, result: AgentRunResult): Promise<{ output: string; selectedWeakTarget?: string; reportHeadSha?: string }> {
    const d = this.d;
    this.retainAgentTurnResult(input, result);
    let selectedWeakTarget: string | undefined = input.reportRepair?.report.selectedWeakTarget;
    for (const envelope of this.capabilities.get(input.invocationId)!.retained!) {
      if (envelope.action.tool === "route_to_agent") {
        if (input.reportRepair && envelope.action.target !== input.reportRepair.report.selectedWeakTarget) {
          throw new Error("Supplemental mechanism turn cannot replace the original report's formal route");
        }
        selectedWeakTarget = envelope.action.target;
      }
      else if (envelope.action.tool === "finish_task") await this.recordAgentTaskCompletion(input, envelope);
      else if (envelope.action.tool === "publish_artifact") d.database.appendEvent({ projectId: d.state.id,
        requestId: `scoped-artifact-intent:${input.execution.id}:${input.execution.ownershipEpoch}:${envelope.callId}`,
        workflowRevision: input.groupRun.workflowRevision, agentId: input.execution.agentId, invocationId: input.invocationId,
        type: "scoped.artifact.staged", payload: { executionId: input.execution.id, ownershipEpoch: input.execution.ownershipEpoch,
          groupRunId: input.groupRun.id, envelope } });
    }
    const output = redactTrace(result.handoff ?? "");
    const weak = (input.workflow.routes[input.arrival.targetNodeId] ?? []).filter((edge) => edge.kind === "weak");
    if (weak.length && !input.reportRepair && d.state.agents[input.execution.agentId].decisionBy === "main") {
      await this.manage(input.groupRun, "route", input.arrival.requestId, output);
      selectedWeakTarget = d.database.scopedArrivalRouteDecision(d.state.id, input.arrival.requestId)?.targetNodeId;
    }
    if (weak.length && !selectedWeakTarget) throw new Error("Scoped weak route requires a formal current local decision");
    await d.storage.writeHandoff(d.state, input.execution.agentId, input.invocationId, output || "Business turn completed.");
    const facts = this.agentGitFacts.get(input.invocationId);
    let reportHeadSha = facts?.pushedHeadSha ?? (await this.observedRetainedReportDelivery(input))?.headSha;
    if (input.reportRepair) {
      const retained = d.database.scopedRecoveryPull(d.state.id, input.execution.id, input.execution.ownershipEpoch);
      if (input.reportRepair.report.headSha) reportHeadSha = input.reportRepair.report.headSha;
      else if (retained?.status === "merged" && facts?.pushedHeadSha) {
        const observed = facts?.pullRequest;
        // A later push and an observed old PR are separate deliveries. Only
        // the Agent's matching PR action may associate its supplement's head.
        reportHeadSha = observed?.headSha === facts.pushedHeadSha ? facts.pushedHeadSha : undefined;
      }
    }
    const omitHead = await withholdR14ReportHead({ projectTitle: d.state.title, projectRoot: d.storage.projectDir(d.state.id),
      execution: { ...input.execution, purpose: "delivery" }, arrivalRequestId: input.arrival.requestId,
      groupRunId: input.groupRun.id, base: input.groupRun.groupBranch, repository: d.repository,
      invocationId: input.invocationId, nativeTurn: d.database.scopedAgentTurn(d.state.id, input.execution.id, input.execution.ownershipEpoch),
      output, selectedWeakTarget, facts, repair: Boolean(input.reportRepair || input.missingReportRepair) });
    this.agentGitFacts.delete(input.invocationId);
    this.agentObservedPulls.delete(input.invocationId);
    return { output, ...(selectedWeakTarget ? { selectedWeakTarget } : {}), ...(!omitHead && reportHeadSha ? { reportHeadSha } : {}) };
  }

  private async recordAgentTaskCompletion(input: ScopedAgentTurnInput, envelope: ControlActionEnvelope): Promise<void> {
    if (envelope.action.tool !== "finish_task") throw new Error("Scoped Agent completion receipt requires finish_task");
    await this.d.storage.requestTaskCompletion(this.d.state, input.execution.id, envelope,
      input.reportRepair || input.missingReportRepair ? {} : { executionWorktree: input.execution.worktreePath });
    this.d.database.recordScopedAgentTaskCompletion({
      projectId: this.d.state.id,
      executionId: input.execution.id,
      ownershipEpoch: input.execution.ownershipEpoch,
      agentId: input.execution.agentId,
      invocationId: input.invocationId,
      callId: envelope.callId,
      ...(envelope.action.summary === undefined ? {} : { summary: envelope.action.summary }),
      ...(envelope.action.memory === undefined ? {} : { memory: envelope.action.memory }),
      requestedAt: envelope.receivedAt
    });
  }

  private manage(group: ScopedGroupRunRecord, purpose: "plan" | "route" | "root-route" | "recover" | "complete", sourceArrivalRequestId?: string, context = "", globalMain = false,
    routeContext: { sourceArrivalGroupRunId?: string; sourceOuterNodeRunId?: string; routeCandidates?: string[] } = {}): Promise<void> {
    const attempt = () => {
      const job = this.managementTail.catch(() => undefined).then(() => this.performManagement(group, purpose, sourceArrivalRequestId, context, globalMain, routeContext));
      this.managementTail = job.catch(() => undefined);
      return job;
    };
    // A stopped Worker's result still needs its management-owned weak route
    // before report acceptance. Retain that result while waiting OUTSIDE the
    // serial management queue, so the recovery needed to admit it can run.
    // Skipped arrivals and other graph jobs instead use the pump's durable
    // deferred-admission path and must never hold this queue while waiting.
    const pendingHandoff = () => purpose === "route" && sourceArrivalRequestId &&
      this.d.database.scopedArrivals(routeContext.sourceArrivalGroupRunId ?? group.id)
        .some(arrival => arrival.requestId === sourceArrivalRequestId && arrival.status === "running");
    if (!pendingHandoff()) return attempt();
    return (async () => {
      for (;;) {
        const revision = this.d.database.projectState(this.d.state.id).stateRevision;
        try { return await attempt(); }
        catch (error) {
          if (!(error instanceof ScopedManagementDeferredError) || !pendingHandoff()) throw error;
          do {
            this.d.signal.throwIfAborted();
            this.d.assertManagementActive?.();
            await new Promise(resolve => setTimeout(resolve, 100));
          } while (pendingHandoff() && this.d.database.projectState(this.d.state.id).stateRevision === revision);
        }
      }
    })();
  }

  private restoreReceivedMainInputs(): void {
    for (const input of this.d.state.userInputs.filter(entry => entry.status === "pending")) {
      const received = this.d.database.eventByRequestId(this.d.state.id, `scoped-user-input-received:${input.id}`);
      if (!received) continue;
      if (received.type !== "user.input.delivered" || received.payload.inputId !== input.id ||
        received.payload.messageDigest !== createHash("sha256").update(input.message).digest("hex") ||
        typeof received.invocationId !== "string" || !Number.isSafeInteger(received.payload.mainInvocation)) {
        throw new Error("Received Main input lost its immutable original binding");
      }
      input.status = "delivered";
      input.deliveredAt = received.ts;
      input.deliveredInvocationId = received.invocationId;
      this.d.state.mainInvocationSeq = Math.max(this.d.state.mainInvocationSeq, received.payload.mainInvocation as number);
    }
  }

  private async performManagement(group: ScopedGroupRunRecord, purpose: "plan" | "route" | "root-route" | "recover" | "complete", sourceArrivalRequestId: string | undefined, context: string, globalMain: boolean,
    routeContext: { sourceArrivalGroupRunId?: string; sourceOuterNodeRunId?: string; routeCandidates?: string[] } = {}): Promise<void> {
    const d = this.d;
    // A management job may have waited in managementTail since the user
    // requested Pause. Check before doing any new durable work and after each
    // asynchronous preparation boundary below. The scheduler turns this
    // sentinel into ordinary waiting and keeps the job retryable on Resume.
    d.assertManagementActive?.();
    await d.applyWaitingWorkflowAdjustments?.();
    d.assertManagementActive?.();
    const invocationId = `inv_${randomUUID().replaceAll("-", "")}`;
    const runtime = await d.storage.invocationRuntimePath(d.state.id, invocationId);
    d.assertManagementActive?.();
    group = d.database.scopedGroupRun(d.state.id, group.id)!;
    const worktreeClosingOnly = group.status === "completed";
    if (worktreeClosingOnly && (purpose !== "recover" || globalMain)) throw new Error("Completed group permits only its original Leader's closing coordination");
    const agentId = globalMain ? "main" : group.leaderAgentId;
    const sourceArrivalGroupRunId = routeContext.sourceArrivalGroupRunId ?? group.id;
    const handoffArrival = sourceArrivalRequestId
      ? d.database.scopedArrivals(sourceArrivalGroupRunId).find((arrival) => arrival.requestId === sourceArrivalRequestId)
      : undefined;
    const handoffExecution = handoffArrival
      ? d.database.projectState(d.state.id).scopedExecutions?.find((execution) => execution.arrivalRequestId === handoffArrival.requestId)
      : undefined;
    const claimInput = { projectId: d.state.id, groupRunId: group.id, agentId, invocationId, runtimePath: runtime,
      ...(globalMain ? { globalMain: true } : {}),
      ...(purpose === "recover" || globalMain ? { allowStoppedRepairFaults: true } : {}),
      ...(purpose === "route" && handoffArrival?.targetKind === "agent" && handoffExecution
        ? { allowStoppedWorkerHandoff: true, allowStoppedWorkerHandoffExecutionId: handoffExecution.id } : {}) };
    const claim = d.database.claimScopedLeaderTurn(claimInput);
    if (!claim) throw new ScopedManagementDeferredError();
    const identity = { ...claimInput, coordinatorEpoch: claim.coordinatorEpoch };
    let handle: CollaborationResidentHandle | undefined;
    let launchBegan = false;
    let stopped = false;
    let failure: unknown;
    try {
      const repairScopeKey = createHash("sha256").update(JSON.stringify([group.id, agentId, purpose,
        sourceArrivalRequestId ?? null, globalMain, ...(d.state.workflowRecovery?.attempt
          ? [d.state.workflowRecovery.attempt] : [])])).digest("hex");
      if (d.database.scopedManagementRepairCount(d.state.id, repairScopeKey) >= 2) {
        throw new Error("Manager still lacks required formal actions after two retained-session mechanism repairs");
      }
      const workflow = d.database.scopedGroupWorkflow(d.state.id, group.id);
      const source = sourceArrivalRequestId ? d.database.scopedArrivals(sourceArrivalGroupRunId).find((item) => item.requestId === sourceArrivalRequestId) : undefined;
      const routeCandidates = routeContext.routeCandidates ?? (source?.status === "skipped" ? [...workflow.nodes.map((node) => node.nodeId), "finish"]
        : source ? (d.database.scopedGroupWorkflow(d.state.id, sourceArrivalGroupRunId).routes[source.targetNodeId] ?? []).filter((edge) => edge.kind === "weak").map((edge) => edge.target) : []);
      const recoveryCandidates = d.database.scopedRecoveryCandidates(d.state.id, group.id, globalMain)
        .filter(candidate => !worktreeClosingOnly || candidate.kind === "worktree-closing");
      const recoveryOptions = d.database.scopedRecoveryOptions(d.state.id, group.id, globalMain, recoveryCandidates);
      const failedArrivalRequestIds = recoveryCandidates.map((item) => item.arrivalRequestId);
      const ordinaryFailureIds = recoveryCandidates.filter(item => item.kind !== "worktree-closing").map(item => item.arrivalRequestId);
      const closingCandidates = recoveryCandidates.filter(item => item.kind === "worktree-closing");
      const closingArrivalRequestIds = globalMain ? [] : closingCandidates.filter(item => item.closing && !item.closingGrantFailure && item.originGroupRunId === group.id && !item.pendingOperation &&
        !item.closingAttempts?.at(-1)?.returned?.observationFailure)
        .map(item => item.arrivalRequestId);
      const definition = d.state.orchestration.scopedWorkflow!.groups.find((item) => item.id === group.groupId)!;
      const allowEdit = !worktreeClosingOnly && (globalMain ? d.state.orchestration.allowMainReconfiguration === true : definition.allowLeaderReconfiguration);
      const projectAllowsUserIntervention = d.state.orchestration.allowUserIntervention !== false;
      const canRequestUser = globalMain && projectAllowsUserIntervention;
      const userEscalationGuidance = projectAllowsUserIntervention ? "GLOBAL Main may request_user."
        : "User intervention is disabled for this project. Do not ask or wait for user clarification or approval. Choose and record reasonable assumptions, assign actionable research work, and complete a final deliverable with the missing information and limitations documented. Use available recovery and authorized Workflow adjustments for actual technical failures; never fabricate results.";
      // A persistent Leader may remember an earlier business report saying
      // delivery is absent. Supply the current S proof before bounded report
      // excerpts, without choosing/completing the group on the Agent's behalf.
      const finalFacts = purpose === "complete" ? {
        groupRunId: group.id,
        integration: d.database.scopedFinalIntegration(d.state.id, group.id) ?? null,
        integrationRequest: d.database.scopedGroupIntegrationRequest(d.state.id, group.id) ?? null,
        finalMerge: d.database.scopedGroupFinalMergeFact(d.state.id, group.id) ?? null
      } : undefined;
      const terminalCandidates = d.database.scopedRecoveryCandidates(d.state.id,group.id,globalMain)
        .filter(candidate => candidate.kind === "terminal-push");
      const terminalFacts = terminalCandidates.length ? d.database.authoritativeWorkflowFiles(d.state.id).currentState : undefined;
      if (globalMain) this.restoreReceivedMainInputs();
      const pendingInputs = globalMain ? d.state.userInputs.filter(input => input.status === "pending").map(input => ({
        ...structuredClone(input), text: workflowMessagesText([{ sender: "user", body: input.message }])
      })) : [];
      // State the actual role and purpose precisely, including when a retained
      // session changes roles. The Agent makes its plan and recovery choices;
      // the system supplies facts, tools, and safe workflow sequencing only.
      const sources = new AgentContextSources();
      const background = [`You are ${agentId}, the management-only ${globalMain ? "GLOBAL Main" : "Leader"} of ${group.groupId}. Purpose: ${purpose}.`,
        worktreeClosingOnly ? "This group is already completed. Coordinate only its retained original-owner worktree closing or escalate the actual issue to your parent. Your own finish_task closes this coordination turn. Business planning, ordinary retry, routing, workflow editing, integration and group completion remain closed." : "",
        `Current control identity: ${JSON.stringify({ projectId: d.state.id, groupRunId: group.id,
          coordinatorEpoch: claim.coordinatorEpoch, invocationId, role: globalMain ? "scoped-main" : "scoped-leader" })}. Use this groupRunId and coordinatorEpoch in formal control calls for this turn; do not reuse an earlier turn's epoch or a failed member's ownershipEpoch.`,
        `Requirement: ${d.state.requirement}`, `Graph:\n${sources.record("management-graph", "Current group graph", workflow)}`,
        pendingInputs.length ? `Pending project user requirements (authoritative; received through the formal user-input queue):\n\n${pendingInputs.map(input => input.text).join("\n\n")}` : "",
        finalFacts ? `Canonical final integration facts:\n${sources.fields("canonical-final", "Canonical final integration facts", finalFacts)}\nThese are the current authoritative SQLite provider and local synchronization facts for this exact group. Inspect this turn's read-only current-state.json detail reference, scopedRuntime.agentMerges and scopedRuntime.groupFinalMerges, for the full published proof. Earlier Agent-authored business reports describe their own turn; use the current facts when deciding your separate group completion action.` : "",
        `Context:\n${sources.record("management-source-context", "Source task and handoff context", context)}`,
        globalMain ? "Do not execute business work. This is the global recovery control turn, not a local Leader turn. Preserve every Agent identity/session/cwd."
          : purpose === "complete"
            ? "This is a group completion control turn. First call finish_task for your own management task. After the explicit final integration proof exists, call complete_group; otherwise call request_group_integration with an eligible non-leader Agent. Do not perform business Git work yourself."
            : purpose === "recover"
              ? "This is a recovery control turn for existing retained failures. Use coordinate_group_task for the distinct recovery actions described below. assign_group_tasks produces a plan and does not resolve these failures. Do not perform business work or dispatch outside this scope."
          : purpose === "route" || purpose === "root-route"
                ? "This is a local routing control turn. Use route_to_agent to choose an available weak route for the source arrival. Do not replace this routing decision with a new task plan or perform business work."
                : "Plan only direct graph nodes with assign_group_tasks. Do not execute business work or dispatch outside this scope.",
        "Call finish_task for this management round and include any durable Agent-authored memory there. It keeps your channel open for separate authorized group/control actions; a previous round's completion does not finish this one.",
        source ? `Choose exactly one local weak route for ${source.requestId}: ${routeCandidates.join(", ")}.` : purpose === "root-route" ? `Choose exactly one weak outer route for ${group.groupId}: ${routeCandidates.join(", ")}.` : "",
        ordinaryFailureIds.length ? `Use coordinate_group_task for these retained failures: ${ordinaryFailureIds.join(", ")}. Choose only an operation listed for that exact arrival in recoveryOptions. ${globalMain ? userEscalationGuidance : "You cannot skip tasks."}` : "",
        recoveryOptions.length ? `Current recoveryOptions: ${sources.list("recovery-options", "Current recoveryOptions", recoveryOptions)}. blockedOperations explains prerequisites to resolve; repeating a blocked skip does not settle Git. Retry retains the original Agent/session; repairNodeIds are exact eligible graph nodes for final-conflict retry only. Omit repairNodeId for ordinary retries. After recording your decisions, use finish_task and finish this management turn so the system can apply them.` : "",
        failedArrivalRequestIds.length > 1 ? "You may coordinate multiple independent failed arrivals in this same turn, with one immutable choice per arrival and a distinct callId per action. Repeating an identical choice keeps its original receipt. These choices take effect only after this management call stops; the system does not choose for you." + (worktreeClosingOnly ? "" : " Global workflow, planning, routing or user-request transitions remain alternatives to the recovery batch.") : "",
        `Retained failures: ${sources.list("recovery-candidates", "Retained failures", recoveryCandidates)}`,
        closingCandidates.length ? `Identified original-task worktree closing issues: ${sources.list("closing-candidates", "Identified original-task worktree closing issues", closingCandidates)}. Original completed/failed status, report A, finish, business PR and newer reservations remain immutable. These are not ordinary business retries. ${globalMain
          ? `GLOBAL Main cannot grant file writes or skip/retry these issues. ${userEscalationGuidance}`
          : `Only these direct arrivals may receive an explicit close_worktree decision this turn: ${JSON.stringify(closingArrivalRequestIds)}. For each, supply closing={executionId,ownershipEpoch,paths} with exact identified file paths you authorize, and your factual rationale. Issues with closingGrantFailure, without closing.observation, or with a stopped attempt's observationFailure have no current trusted writable manifest: preserve their files and escalate the actual read-failure reason. closingAttempts transports actual output, missing finish/output, current independent B operations and native result reception; a saved or prepared result is not received. After a stopped attempt has formally returned, a new decision permits exactly one new call in the same original Session with no expansion of its previous paths. It does not replay an old grant, restore a capability, or reset any automatic repair budget. The original Agent judges file source and whether to deliver or remove them; bound-report-memory permits only its own necessary Memory. Escalate to your direct parent if source or scope is uncertain. An accepted pending grant cannot be granted again.`} Neither a grant, finish nor Stop proves B delivery or releases FIFO; original A, any independent B with original-Session receipt, and the directory must all settle.` : "",
        failedArrivalRequestIds.length && !worktreeClosingOnly ? "For an ordinary failed Agent task (no kind=final), omit repairNodeId entirely in coordinate_group_task. Escalation also omits it. Only a final PR conflict retry may supply an actual graph nodeId of the original group; an Agent identity is not a nodeId." : "",
        terminalFacts ? `Original completed Agent receipt facts at stateRevision ${terminalFacts.stateRevision}:\n${sources.fields("terminal-receipts", "Original completed Agent receipt facts", {
          terminalPushObservationOperations: terminalFacts.terminalPushObservationOperations?.filter(operation => terminalCandidates.some(candidate => candidate.executionId === operation.ownerExecutionId)),
          terminalPushObservations: terminalFacts.terminalPushObservations?.filter(turn => terminalCandidates.some(candidate => candidate.executionId === turn.executionId)),
          terminalPushObservationIssues: terminalFacts.terminalPushObservationIssues?.filter(issue => terminalCandidates.some(candidate => candidate.executionId === issue.executionId))
        })}\nA terminal-push incident preserves an already successful business task. Its turn.operation is the immutable reservation snapshot; terminalPushObservationOperations carries the current S journal and recorded provider proof. Use the actual Agent handoff and output. An explicit retry authorizes one read-only original-session receipt turn after you stop; it cannot push, replay business or reset automatic repairs. Escalate to your direct parent if you cannot resolve it. ${userEscalationGuidance} The system only transports these facts and your instructions.` : "",
        !worktreeClosingOnly ? `A mechanism incident retains the exact stopped original Agent's task, epoch, branch, PR and unsettled operations. Retry authorizes that Agent to continue once in its original session; it does not replenish automatic supplements. GLOBAL Main may explicitly skip this failed Worker after its original Git operations are settled and its native process has stopped; a skip excludes its report from successful evidence and preserves Git history, including any already merged PR. Group/final-integration incidents cannot be skipped as Workers. Unsettled operations require the original Agent's exact reconciliation, not deletion or a new push ID. Escalate through the direct parent if you cannot resolve it. ${userEscalationGuidance} Supply your factual instructions in the coordination rationale; do not perform the Agent's business or Git work yourself.` : "",
        !worktreeClosingOnly ? `For a final PR conflict, choose repairNodeId from an actual Agent node of the original group. This creates only a repair-only arrival and preserves completed paths; the repaired PR must still merge into that group before its next canonical final PR. Leaders never write business code. A retry without repairNodeId requests Git-only reconciliation; parent managers may delegate selection back to the original Leader. Group-level incidents cannot be marked successful by skip.` : "",
        d.state.userIntervention?.status === "answered" ? `User response: ${d.state.userIntervention.response}` : "",
        allowEdit ? `You may formally edit ${globalMain ? "the global workflow" : "this group's graph and local shared Agent configuration"}; locked fields and necessary active nodes remain protected.` : "Workflow reconfiguration is disabled."].filter(Boolean).join("\n\n");
      sources.record("management-reference", "Management facts and protocol reference", background);
      const rootNode = d.database.projectState(d.state.id).nodeRuns.find(node => node.id === this.rootNode(group));
      const messages: WorkflowDirectMessage[] = [];
      if (purpose === "plan") {
        if (group.parentGroupRunId && group.parentArrivalRequestId) {
          const parent = d.database.scopedGroupRun(d.state.id, group.parentGroupRunId)!;
          const arrival = d.database.scopedArrivals(parent.id).find(item => item.requestId === group.parentArrivalRequestId);
          const task = d.database.scopedGroupPlan(d.state.id, parent.id)?.tasks.find(item => item.taskId === arrival?.targetNodeId);
          if (task) messages.push({ sender: parent.leaderAgentId, body: task.assignment });
          if (arrival) messages.push(...scopedPredecessorMessages(d.database.projectState(d.state.id), arrival,
            d.database.scopedGroupWorkflow(d.state.id, parent.id).routes));
        } else if (rootNode?.optionalTask) {
          messages.push({ sender: rootNode.sourceAgentId ?? (rootNode.inputSnapshotRef.startsWith("project:") ? "user" : rootNode.activatedByAgentId), body: rootNode.optionalTask });
        }
      }
      if (context) messages.push({ sender: sourceArrivalRequestId
        ? d.database.scopedArrivals(routeContext.sourceArrivalGroupRunId ?? group.id).find(item => item.requestId === sourceArrivalRequestId)?.agentId ?? "OpenFARS"
        : purpose === "complete" || purpose === "root-route" ? group.leaderAgentId : "OpenFARS", body: context });
      messages.push(...pendingInputs.map(input => ({ sender: "user", body: input.message })));
      if (globalMain && d.state.userIntervention?.status === "answered")
        messages.push({ sender: "user", body: d.state.userIntervention.response ?? "" });
      const assignment = workflowMessagesText(messages);

      const inbox = await d.storage.writeInbox(d.state, agentId, invocationId, assignment);
      d.assertManagementActive?.();
      const inputs = await d.managementInputs({ ...group, leaderAgentId: agentId }, invocationId, inbox, runtime, allowEdit);
      d.assertManagementActive?.();
      const request = await this.request(agentId, invocationId, inputs.workspacePath, runtime, inputs.inboxPath, assignment,
        { role: "leader", nodeRunId: this.rootNode(group), groupRunId: group.id, coordinatorEpoch: claim.coordinatorEpoch });
      request.contextSources = sources.sources;
      request.nativeInputNotices = pendingInputs.map(input => input.text);
      d.assertManagementActive?.();
      if (pendingInputs.length) {
        const priorNativeInput = request.onNativeUserInput;
        const mainInvocation = d.state.mainInvocationSeq + 1;
        request.onNativeUserInput = async (event, session) => {
          await priorNativeInput?.(event, session);
          const binding = d.database.latestAgentNativeSessionBinding(d.state.id, agentId);
          if (!session || !binding || event.kind !== "user.message" || event.invocationId !== invocationId ||
            event.harnessId !== session.harnessId || typeof event.eventId !== "string" || !event.eventId ||
            typeof event.message !== "string" || binding.invocationId !== invocationId || binding.runtimePath !== runtime ||
            binding.worktreePath !== inputs.workspacePath || !isDeepStrictEqual(binding.executionContext, request.executionContext) ||
            !sameDurableSession(binding.session, session)) return;
          d.database.assertScopedLeaderAuthority(identity);
          for (const input of pendingInputs) {
            if (!event.message.includes(redactTrace(input.text))) continue;
            const requestId = `scoped-user-input-received:${input.id}`;
            if (d.database.eventByRequestId(d.state.id, requestId)) continue;
            d.database.appendEvent({ projectId: d.state.id, agentId, invocationId, coordinatorEpoch: claim!.coordinatorEpoch,
              requestId, type: "user.input.delivered", payload: { inputId: input.id, mainInvocation,
                messageDigest: createHash("sha256").update(input.message).digest("hex"), eventId: event.eventId,
                sourceType: event.sourceType, session, groupRunId: group.id } });
          }
          this.restoreReceivedMainInputs();
          await d.storage.saveState(d.state);
        };
      }
      request.workflowContext = { scope: globalMain ? "global" : "group", groupId: group.groupId,
        groupRunId: group.id, sourceNodeId: source?.targetNodeId, purpose, candidates: [...routeCandidates] };
      Object.assign(inputs, await prepareWorkflowContext(request, inputs, d.database.authoritativeWorkflowFiles(d.state.id)));
      const proposalCache = new Map<string, Pick<ScopedLeaderActionInput, "proposal" | "baseWorkflowHash" | "configuration" | "baseConfigurationHash" | "baseVersion">>();
      const retainedActions: ControlActionEnvelope[] = [];
      let finishOnlyRepair = false;
      const controlScope = { role: globalMain ? "scoped-main" as const : "scoped-leader" as const, projectId: d.state.id, nodeRunId: this.rootNode(group),
        groupRunId: group.id, leaderAgentId: agentId, coordinatorEpoch: claim.coordinatorEpoch,
        memberNodeIds: worktreeClosingOnly ? [] : workflow.nodes.map((node) => node.nodeId), routeCandidates, failedArrivalRequestIds, recoveryOptions,
        ...(closingArrivalRequestIds.length ? { closingArrivalRequestIds } : {}),
        ...(worktreeClosingOnly ? { worktreeClosingOnly: true as const } : {}),
        allowReconfiguration: allowEdit, ...(sourceArrivalRequestId ? { sourceArrivalRequestId } : {}),
        ...(routeContext.sourceOuterNodeRunId ? { sourceOuterNodeRunId: routeContext.sourceOuterNodeRunId } : {}) };
      const openAndRegister = async (): Promise<CollaborationResidentHandle> => {
        d.assertManagementActive?.();
        const filesystemAuthorityInput = await d.filesystem();
        d.assertManagementActive?.();
        // Once this boundary starts, Pause must wait until open and register
        // both complete so it can pause the exact resident that was opened.
        launchBegan = true;
        handle = await d.launcher.open({ request, inputs, executionRuntimePath: runtime, filesystemAuthorityInput,
        signal: d.signal, onTrace: d.trace(agentId, invocationId), onOpened: async () => { d.database.markScopedLeaderOpened(identity); await d.publish(); },
        turnRequestFactory: async () => ({ request: { ...request, project: structuredClone(d.state),
          sessionContinuity: "strict", resumeThreadId: d.state.agentSessionIds?.[agentId] }, onTrace: d.trace(agentId, invocationId) }),
        controlScope, controlAuthorityFactory: async ({ turn }) => {
          const capability = randomUUID(); const hash = createHash("sha256").update(capability).digest("hex");
          this.capabilities.set(invocationId, { hash, accepted: [] });
          return { control: { capability, capabilityHash: hash, stateVersion: claim.coordinatorEpoch,
            stagingPath: path.join(runtime, "control-turns", createHash("sha256").update(turn.inputId).digest("hex"), "actions.json"),
            candidates: [], decisionBy: "main", canComplete: false,
            allowUserIntervention: canRequestUser, allowWorkflowReconfiguration: allowEdit,
            ...(inputs.workflowAuthoringPath ? { workflowAuthoringPath: inputs.workflowAuthoringPath } : {}),
            collaboration: { nodeRunId: controlScope.nodeRunId, groupRunId: group.id,
              coordinatorEpoch: claim!.coordinatorEpoch, role: controlScope.role,
              memberNodeIds: [...controlScope.memberNodeIds], routeCandidates: [...routeCandidates],
              failedArrivalRequestIds: [...failedArrivalRequestIds], recoveryOptions: structuredClone(recoveryOptions), allowReconfiguration: allowEdit,
              ...(closingArrivalRequestIds.length ? { closingArrivalRequestIds: [...closingArrivalRequestIds] } : {}),
              ...(worktreeClosingOnly ? { worktreeClosingOnly: true as const } : {}),
              ...(sourceArrivalRequestId ? { sourceArrivalRequestId } : {}),
              ...(routeContext.sourceOuterNodeRunId ? { sourceOuterNodeRunId: routeContext.sourceOuterNodeRunId } : {}) },
            workspacePath: inputs.workspacePath, requireBridge: true },
            revalidate: async (envelope) => {
              this.assertReceipt(envelope, invocationId, agentId, claim!.coordinatorEpoch);
              if (envelope.action.tool === "request_user" && (!globalMain || d.state.orchestration.allowUserIntervention === false)) {
                throw new Error("User intervention is disabled by this Workflow");
              }
              if (finishOnlyRepair && envelope.action.tool !== "finish_task" &&
                !retainedActions.some((entry) => isDeepStrictEqual(entry.action, envelope.action))) {
                throw new Error("The management round's staged decision cannot be replaced during finish_task repair");
              }
              let proposal: Pick<ScopedLeaderActionInput, "proposal" | "baseWorkflowHash" | "configuration" | "baseConfigurationHash" | "baseVersion"> = {};
              if (envelope.action.tool === "apply_workflow") {
                const retained = d.database.scopedWorkflowAdjustmentProposal(d.state.id, invocationId, envelope.callId);
                if (retained) {
                  proposal = { proposal: retained.proposal, baseWorkflowHash: retained.baseWorkflowHash,
                    ...(retained.baseVersion ? { baseVersion: retained.baseVersion } : {}),
                    ...(retained.configuration ? { configuration: retained.configuration, baseConfigurationHash: retained.baseConfigurationHash } : {}) };
                } else {
                  if (!inputs.workflowAuthoringPath) throw new Error("Scoped proposal authoring is not enabled");
                  const base = d.database.workflowAdjustmentCurrent(d.state.id);
                  const baseConfigurationHash = d.database.scopedConfigurationHash(d.state.id);
                  const info = await fs.lstat(inputs.workflowAuthoringPath);
                  if (!info.isFile() || info.isSymbolicLink() || info.nlink !== 1 || await fs.realpath(inputs.workflowAuthoringPath) !== inputs.workflowAuthoringPath) throw new Error("Scoped proposal is not its pinned regular file");
                  const raw = await fs.readFile(inputs.workflowAuthoringPath, "utf8");
                  const resources = { skillDefinitions: d.state.skillDefinitions ?? {}, mcpDefinitions: d.state.mcpDefinitions ?? {}, baseVersion: base.version };
                  const refreshCurrentReference = async (current = base) => d.storage.writeManagementWorkflowCurrentSnapshot(inputs.workflowCurrentPath
                    ? path.dirname(path.dirname(inputs.workflowCurrentPath)) : inputs.workspacePath,
                    (JSON.parse(raw) as { schemaVersion?: unknown }).schemaVersion === 2
                      ? mainAgentOrchestrationDocument(d.state.id, current.snapshot.orchestration,
                        restoreAgentConfiguration(current.snapshot, d.state.agents), current.snapshot.skillDefinitions, current.snapshot.mcpDefinitions, current.version)
                      : mainWorkflowDocument(d.state.id, current.snapshot.orchestration, current.version),
                    () => sameWorkflowConfigurationVersion(d.database.workflowAdjustmentCurrent(d.state.id).version, current.version));
                  await refreshCurrentReference();
                  const parsed = globalMain ? parseAgentOrchestrationProposal(raw, d.state.id, d.state.orchestration, d.state.agents, resources)
                    : parseScopedWorkflowProposal(raw, d.state.id, d.state.orchestration, d.state.agents, group.groupId, resources);
                  if (parsed.skillDefinitions && parsed.mcpDefinitions) {
                    if (!d.validateConfiguration) throw new Error("Agent configuration proposals require the existing server route/resource validator");
                    await d.validateConfiguration(parsed as AgentOrchestrationProposal);
                    const current = d.database.workflowAdjustmentCurrent(d.state.id);
                    if (!sameWorkflowConfigurationVersion(base.version, current.version)) await refreshCurrentReference(current);
                  }
                  proposal = { proposal: parsed.orchestration, baseWorkflowHash: workflowBaseHash(base.snapshot.orchestration), baseVersion: base.version,
                    configuration: credentialFreeAgentConfiguration({ agents: parsed.agents,
                      skillDefinitions: parsed.skillDefinitions ?? resources.skillDefinitions, mcpDefinitions: parsed.mcpDefinitions ?? resources.mcpDefinitions }),
                    baseConfigurationHash };
                }
              }
              if (envelope.action.tool === "finish_task") {
                // Management completion is a task-scoped receipt. It does not
                // complete the group or release its parent route.
                d.database.revalidateScopedLeaderTaskCompletion({ ...identity, envelope });
                const receipt = await d.storage.requestTaskCompletion(d.state, `management:${group.id}:${invocationId}`, envelope);
                if (receipt.summary !== envelope.action.summary || receipt.memory !== envelope.action.memory) {
                  throw new Error("Repeat management finish_task must preserve its accepted summary and memory");
                }
                d.database.recordScopedLeaderTaskCompletion({ ...identity, envelope });
              } else {
                d.database.revalidateScopedLeaderAction({ ...identity, envelope, ...(sourceArrivalRequestId ? { sourceArrivalRequestId } : {}),
                  ...(routeContext.sourceArrivalGroupRunId ? { sourceArrivalGroupRunId: routeContext.sourceArrivalGroupRunId } : {}),
                  ...(routeContext.sourceOuterNodeRunId ? { sourceOuterNodeRunId: routeContext.sourceOuterNodeRunId } : {}), ...proposal });
                if (envelope.action.tool === "apply_workflow") {
                  proposalCache.set(envelope.callId, proposal);
                  await d.publish();
                }
              }
              const accepted = this.capabilities.get(invocationId)!.accepted;
              if (!accepted.some((item) => item.callId === envelope.callId)) accepted.push(structuredClone(envelope));
            } };
        } });
        d.register(`scoped:${invocationId}`, handle);
        return handle;
      };
      await (d.withNativeLaunchFence
        ? d.withNativeLaunchFence(openAndRegister)
        : openAndRegister());
      if (!handle) throw new Error("Scoped management resident did not open");
      const formalTools = worktreeClosingOnly ? ["coordinate_group_task"] : purpose === "recover" ? ["coordinate_group_task", ...(canRequestUser ? ["request_user"] : []), "apply_workflow"]
        : purpose === "complete" ? ["request_group_integration", "complete_group"]
        : purpose === "route" || purpose === "root-route" ? ["route_to_agent", "apply_workflow"] : ["assign_group_tasks", "apply_workflow"];
      const stateRequests = () => purpose === "recover" && !globalMain
        ? d.database.projectStateMainCoordinationRequests(d.state.id, invocationId) : [];
      const hasDecision = () => retainedActions.some((entry) => formalTools.includes(entry.action.tool)) || stateRequests().length > 0;
      const missing = () => [!d.database.scopedLeaderTaskCompleted(d.state.id, group.id, agentId,
        invocationId, claim!.coordinatorEpoch) && "finish_task", !hasDecision() && `formal ${purpose} control action`].filter(Boolean);
      const inputId = `${purpose}:${group.id}:${sourceArrivalRequestId ?? invocationId}`;
      let result = await d.submit(handle, { inputId, invocationId, prompt: assignment });
      d.assertManagementActive?.();
      while (true) {
        d.signal.throwIfAborted();
        for (const envelope of result.controlActions ?? []) {
          this.assertReceipt(envelope, invocationId, agentId, claim.coordinatorEpoch);
          if (!this.capabilities.get(invocationId)!.accepted.some((entry) => isDeepStrictEqual(entry, envelope))) {
            throw new Error("Leader result was not accepted by its live scoped broker");
          }
          if (!retainedActions.some((entry) => isDeepStrictEqual(entry.action, envelope.action))) retainedActions.push(envelope);
        }
        const absent = missing();
        if (!absent.length) break;
        const count = d.database.scopedManagementRepairCount(d.state.id, repairScopeKey);
        if (count >= 2) throw new Error("Manager still lacks required formal actions after two retained-session mechanism repairs");
        d.database.assertScopedLeaderAuthority(identity);
        d.database.appendEvent({ projectId: d.state.id, agentId, invocationId, coordinatorEpoch: claim.coordinatorEpoch,
          requestId: `scoped-management-repair:${invocationId}:${count + 1}`, type: "scoped.management.mechanism_repair.requested",
          payload: { groupRunId: group.id, repairScopeKey, purpose, attempt: count + 1, missing: absent } });
        // Keep the actual Agent/session/claim and its staged choices. The
        // runtime supplies facts and tools; it never fills in a business plan.
        finishOnlyRepair = hasDecision();
        result = await d.submit(handle, { inputId: `${inputId}:mechanism-repair:${count + 1}`, invocationId,
          prompt: [assignment, `Continue this management round in your retained session. Missing formal mechanism actions: ${absent.join(", ")}.`,
            `Already staged actions: ${sources.list("management-staged-actions", "Already staged actions", retainedActions.filter((entry) => entry.action.tool !== "finish_task").map((entry) => entry.action))}.`,
            d.database.scopedLeaderTaskCompleted(d.state.id, group.id, agentId, invocationId, claim.coordinatorEpoch)
              ? "finish_task is already accepted for this invocation. Preserve its immutable summary and memory; do not call it again. Supply the still-missing formal control action with the actual tool."
              : "finish_task is still missing for this invocation; supply it with the actual tool.",
            "A statement that a tool was called does not create a receipt. Check the actual tool response; rejected calls are still missing. Invoke the control tool exposed by your current Harness, using the current control identity above.",
            purpose === "recover" ? globalMain
              ? canRequestUser ? "If no recovery or authorized skip can be applied, call request_user with the exact unresolved blocker, then finish_task if still missing. A prose statement that recovery is blocked is not this formal decision. Preserve the user's existing authorization; do not ask again for an already authorized skip when it is now valid."
                : userEscalationGuidance
              : "If you cannot recover the failed task, formally call coordinate_group_task with operation=escalate for its arrivalRequestId, or use state_request_main for the exact retained mechanism issue when available. Then finish_task if still missing. A prose handoff to Main does not submit this escalation."
              : "",
            finishOnlyRepair ? "Preserve those choices and supply finish_task; do not replace the staged decision." : "Use the assigned control tools to decide; the system cannot decide for you."
          ].join("\n\n") });
        d.assertManagementActive?.();
      }
      d.assertManagementActive?.();
      await handle.close(); stopped = true; d.unregister(`scoped:${invocationId}`);
      d.assertManagementActive?.();
      if (retainedActions.some(envelope => envelope.action.tool === "apply_workflow")) await this.discoverWorktreeClosings();
      d.assertManagementActive?.();
      const workflowAdjustments: WorkflowAdjustmentPublication[] = [];
      for (const envelope of retainedActions) {
        if (envelope.action.tool !== "finish_task") {
          d.assertManagementActive?.();
          const acceptance = d.database.acceptScopedLeaderAction({ ...identity, envelope, ...(sourceArrivalRequestId ? { sourceArrivalRequestId } : {}),
            ...(routeContext.sourceArrivalGroupRunId ? { sourceArrivalGroupRunId: routeContext.sourceArrivalGroupRunId } : {}),
            ...(routeContext.sourceOuterNodeRunId ? { sourceOuterNodeRunId: routeContext.sourceOuterNodeRunId } : {}),
            ...proposalCache.get(envelope.callId), residentStopConfirmed: true }, d.state);
          if (acceptance.workflowAdjustment) workflowAdjustments.push(acceptance.workflowAdjustment);
          if (envelope.action.tool === "complete_group") {
            d.database.completeScopedGroupAfterLeaderDecision({ projectId: d.state.id, groupRunId: group.id,
              agentId, invocationId, coordinatorEpoch: claim!.coordinatorEpoch, output: envelope.action.output,
              requestId: `scoped-group-complete:${group.id}:${envelope.callId}` });
          }
        }
      }
      await d.storage.writeHandoff(d.state, agentId, invocationId, result.handoff ?? "Management turn completed without a textual handoff.");
      d.assertManagementActive?.();
      d.database.appendEvent({ projectId: d.state.id, agentId, invocationId, coordinatorEpoch: claim.coordinatorEpoch,
        requestId: `scoped-management-round-completed:${invocationId}`, type: "scoped.management.round.completed",
        payload: { groupRunId: group.id, repairScopeKey, purpose,
          ...(stateRequests().length ? { mainStateRequestIds: stateRequests().map(event => event.requestId) } : {}),
          ...(workflowAdjustments.length ? { workflowAdjustments } : {}) } });
      if (globalMain && d.state.userIntervention?.status === "answered" && retainedActions.some((entry) =>
        entry.action.tool !== "finish_task" && entry.action.tool !== "request_user")) {
        d.database.appendEvent({ projectId: d.state.id, requestId: `scoped-user-consumed:${d.state.userIntervention.id}`, agentId: "main", invocationId,
          type: "scoped.user.response.consumed", payload: { interventionId: d.state.userIntervention.id } });
        d.state.userIntervention = undefined;
      }
      await d.publish();
    } catch (error) { failure = error;
    } finally {
      if (handle && !stopped) { await handle.close(); stopped = true; d.unregister(`scoped:${invocationId}`); }
      if (stopped || !launchBegan) { d.database.releaseScopedLeaderTurn({ ...identity, residentStopConfirmed: true }); await d.publish(); }
    }
    if (failure !== undefined) {
      if (failure instanceof ScopedManagementDeferredError) throw failure;
      // Transport recovery preserves the unfinished management task. Its
      // native claim is already stopped/released above; do not consume the
      // finite business control-repair allowance or invent request_user.
      if (transientHarnessFailure(failure) && (stopped || !launchBegan)) throw failure;
      const failureReason = failure instanceof Error ? redactTrace(failure.message) : "Leader coordination failed";
      if ((stopped || !launchBegan) && (purpose === "recover" || purpose === "plan" || globalMain) &&
        !d.signal.aborted && !d.database.projectCancellationIntent(d.state.id)) {
        if (purpose === "plan" && !globalMain) {
          d.database.recordScopedGroupIssue({ projectId: d.state.id, groupRunId: group.id, kind: "plan", reason: failureReason });
        }
        const failures = d.database.recordScopedManagementFailure({ ...identity, purpose, reason: failureReason });
        if (globalMain && failures.some((entry) => entry.exhausted)) {
          // A technical Main failure is a durable runtime condition. Preserve
          // the exact source for the next automatic recovery round without
          // inventing a Main request_user decision.
          d.state.status = "retrying";
          d.state.phase = "collaboration:technical-failure";
          d.state.lastError = failureReason;
          await d.storage.saveState(d.state);
        }
      }
      throw failure;
    }
    if (purpose === "plan" && !globalMain) {
      d.database.resolveScopedGroupIssueIfPresent(d.state.id, group.id, "plan", "Leader produced a durable group plan after technical recovery");
    }
    await this.applyAcceptedRecoveries();
  }

  private applyAcceptedRecoveries(): Promise<void> {
    const job = this.recoveryTail.catch(() => undefined).then(() => this.performAcceptedRecoveries());
    this.recoveryTail = job.catch(() => undefined);
    return job;
  }

  private async prepareFinalRepair(incidentId: string, envelope: ControlActionEnvelope): Promise<void> {
    const d = this.d; const issue = d.database.scopedGroupIssues(d.state.id).find((entry) => entry.id === incidentId);
    if (!issue) return;
    const group = d.database.scopedGroupRun(d.state.id, issue.groupRunId)!;
    const owner = d.database.scopedFinalIntegration(d.state.id, group.id);
    if (owner) {
      if (!d.git.observePullRequestForExecution) throw new Error("Final recovery requires authoritative canonical PR discovery");
      const execution = { ...owner, purpose: "group-final-integration" as const };
      const pull = await d.git.observePullRequestForExecution({ repository: d.repository, execution, expectedBase: owner.integrationTarget, signal: d.signal });
      // A formal retry authorizes retained execution recovery, not GitHub
      // cleanup. Keep the actual PR and let an authorized Agent act on it.
      d.database.recordScopedFinalRecoveryPull(d.state.id, group.id, pull);
    }
    const source = await d.git.observeRemoteRef(d.repository, group.integrationTarget, d.signal);
    if (source.status !== "present" || !/^[0-9a-f]{40}$/i.test(source.sha ?? "") || source.ref !== group.integrationTarget || source.owner !== d.repository.owner || source.repository !== d.repository.name)
      throw new Error("Final repair lost its canonical direct parent base");
    d.database.startScopedFinalRepair({ projectId: d.state.id, incidentId, envelope, sourceHead: source.sha! });
  }

  private async observeScopedRecoveryPull(execution: ScopedExecutionRecord): Promise<GitHubPullRequestFact | undefined> {
    const d = this.d;
    const base = d.database.scopedGroupRun(d.state.id, execution.groupRunId)!.groupBranch;
    const authority = { ...execution, purpose: "delivery" as const };
    const bound = d.database.scopedRecoveryPull(d.state.id, execution.id, execution.ownershipEpoch);
    if (!bound && d.database.projectState(d.state.id).operations.some(operation =>
      operation.ownerExecutionId === execution.id && operation.ownershipEpoch === execution.ownershipEpoch &&
      operation.status === "finalized" && ["pull.create", "pull.merge", "pull.close"].includes(operation.kind))) {
      // Several successive PRs on one branch can deliver the business result
      // and its later Memory commit. Use this stopped checkout's exact head
      // (or its immutable report head), never the newest PR in a branch list.
      const local = await d.git.observeRetainedExecution(authority, execution.ownershipEpoch, d.signal);
      if (local.projectId !== d.state.id || local.executionId !== execution.id || local.ownershipEpoch !== execution.ownershipEpoch ||
        local.branch !== execution.executionBranch || local.worktreePath !== execution.worktreePath || !/^[0-9a-f]{40}$/i.test(local.head)) {
        throw new Error("Scoped recovery lost its exact retained execution checkout");
      }
      const head = d.database.scopedAgentReport(d.state.id, execution.id, execution.ownershipEpoch)?.headSha ?? local.head;
      const recorded = d.database.scopedAgentRecordedDeliveryPull(d.state.id, execution.id, execution.ownershipEpoch,
        head, { requireUniqueProvider: true });
      if (recorded) {
        if (!d.git.observePullRequest) throw new Error("Scoped recovery requires authoritative journaled-PR observation");
        const observed = await d.git.observePullRequest({ repository: d.repository, providerNumber: recorded.providerNumber,
          ownerExecutionId: execution.id, signal: d.signal });
        if (!observed || observed.providerNumber !== recorded.providerNumber || observed.owner !== d.repository.owner ||
          observed.repository !== d.repository.name || observed.ownerExecutionId !== execution.id ||
          observed.head !== execution.executionBranch || observed.base !== base || observed.headSha !== recorded.headSha ||
          recorded.status === "merged" && (observed.status !== "merged" || observed.mergeCommitSha !== recorded.mergeCommitSha)) {
          throw new Error("Journaled recovery PR is missing or differs from its exact retained delivery identity");
        }
        return observed;
      }
    }
    if (bound) {
      if (!d.git.observePullRequest) throw new Error("Scoped recovery requires authoritative retained-PR observation");
      const observed = await d.git.observePullRequest({ repository: d.repository, providerNumber: bound.providerNumber,
        ownerExecutionId: execution.id, signal: d.signal });
      if (!observed || observed.providerNumber !== bound.providerNumber || bound.status === "merged" &&
        (observed.status !== "merged" || observed.headSha !== bound.headSha || observed.base !== bound.base ||
          observed.mergeCommitSha !== bound.mergeCommitSha)) {
        throw new Error("Retained recovery PR is missing or differs from its immutable merged identity");
      }
      return observed;
    }
    if (!d.git.observePullRequestForExecution) throw new Error("Scoped recovery requires authoritative owned-PR discovery");
    return d.git.observePullRequestForExecution({ repository: d.repository, execution: authority, expectedBase: base, signal: d.signal });
  }

  private async performAcceptedRecoveries(): Promise<void> {
    const d = this.d;
    if (d.database.projectCancellationIntent(d.state.id)) return;
    for (const group of d.database.projectState(d.state.id).scopedGroupRuns ?? []) {
      for (const receipt of d.database.scopedAcceptedLeaderActions(d.state.id, group.id)) {
        const action = receipt.envelope.action;
        if (action.tool === "request_user" && receipt.globalMain) {
          await this.requestScopedUser(receipt.envelope.invocationId, receipt.envelope.callId, action.message, action.rationale);
          continue;
        }
        if (action.tool === "coordinate_group_task" && action.operation === "close_worktree") {
          if (d.database.scopedWorktreeClosingGrantFailure(d.state.id, receipt.envelope.invocationId, receipt.envelope.callId)) continue;
          if (d.database.scopedWorktreeClosingTurns(d.state.id).some(turn => turn.grantInvocationId === receipt.envelope.invocationId &&
            turn.grantCallId === receipt.envelope.callId)) continue;
          if (!d.continueWorktreeClosings) throw new Error("Closing requires its original-session supplemental dispatcher");
          await d.continueWorktreeClosings();
          continue;
        }
        if (action.tool !== "coordinate_group_task" || action.operation === "escalate" || !receipt.failedOwnershipEpoch) continue;
        if (d.database.eventByRequestId(d.state.id,
          `scoped-recovery-application-failed:${receipt.envelope.invocationId}:${receipt.envelope.callId}`)) continue;
        const manager = d.database.scopedLeaderTurns(d.state.id).find(turn => turn.invocationId === receipt.envelope.invocationId);
        if (manager?.status !== "released") continue;
        try {
          if (receipt.incidentId) {
            const issue = d.database.scopedGroupIssues(d.state.id).find((entry) => entry.id === receipt.incidentId);
            if (!issue) continue;
            // Report retries are consumed by the runner; an unreported owner
            // first needs its existing same-epoch reservation. Both wait until
            // the exact manager releases; neither chooses a remote Git outcome.
            if (issue.kind === "mechanism") {
              if (action.operation === "skip" && receipt.globalMain && receipt.executionId) {
                const execution = d.database.scopedExecution(d.state.id, receipt.executionId);
                if (!execution || execution.ownershipEpoch !== receipt.failedOwnershipEpoch) continue;
                const pull = await this.observeScopedRecoveryPull(execution);
                d.database.applyScopedMainSkip(d.state.id, execution.id, execution.ownershipEpoch, pull ?? null);
                continue;
              }
              if (!issue.interruptedOperationIds?.length || !receipt.executionId || action.operation !== "retry" ||
                d.database.eventByRequestId(d.state.id, `scoped-missing-report-repair:${receipt.envelope.invocationId}:${receipt.envelope.callId}`)) continue;
              const manager = d.database.scopedLeaderTurns(d.state.id).find(turn => turn.invocationId === receipt.envelope.invocationId);
              if (manager?.status !== "released") continue;
              const execution = d.database.scopedExecution(d.state.id, receipt.executionId);
              if (!execution || execution.ownershipEpoch !== receipt.failedOwnershipEpoch || execution.status !== "running" ||
                d.database.scopedAgentReport(d.state.id, execution.id, execution.ownershipEpoch)) continue;
              const pull = await this.observeScopedRecoveryPull(execution);
              d.database.recordScopedRecoveryPull({ projectId: d.state.id, executionId: execution.id,
                ownershipEpoch: execution.ownershipEpoch, pull });
              const invocationId = `inv_${createHash("sha256").update(JSON.stringify([execution.id, execution.ownershipEpoch,
                "missing-report-repair", receipt.envelope.invocationId, receipt.envelope.callId])).digest("hex").slice(0, 32)}`;
              const runtimePath = await d.storage.invocationRuntimePath(d.state.id, invocationId);
              d.database.beginScopedAgentMissingReportRepair({ projectId: d.state.id, executionId: execution.id,
                ownershipEpoch: execution.ownershipEpoch, invocationId, runtimePath, coordination: receipt.envelope });
              continue;
            }
            if (issue.kind === "terminal-push") {
              if (!d.continueTerminalPushObservations) throw new Error("Terminal receipt coordination requires its original-session continuation boundary");
              await d.continueTerminalPushObservations();
              continue;
            }
            if (issue.kind === "final") {
              if (!action.repairNodeId && group.id !== issue.groupRunId && !receipt.globalMain) d.database.returnScopedFinalIssueToLeader(d.state.id, issue.id, receipt.envelope);
              else await this.prepareFinalRepair(issue.id, receipt.envelope);
            } else d.database.applyScopedGroupIssueRetry(d.state.id, issue.id, receipt.envelope);
            continue;
          }
          if (!receipt.executionId) continue;
          if (d.database.eventByRequestId(d.state.id, `scoped-agent-coordinated-repair:${receipt.envelope.invocationId}:${receipt.envelope.callId}`) ||
            d.database.eventByRequestId(d.state.id, `scoped-missing-report-repair:${receipt.envelope.invocationId}:${receipt.envelope.callId}`)) continue;
          const execution = d.database.scopedExecution(d.state.id, receipt.executionId);
          if (execution?.status === "failed" && execution.ownershipEpoch === receipt.failedOwnershipEpoch) {
            const pull = await this.observeScopedRecoveryPull(execution);
            if (action.operation === "skip") {
              d.database.applyScopedMainSkip(d.state.id, execution.id, execution.ownershipEpoch, pull ?? null);
              continue;
            }
            d.database.recordScopedRecoveryPull({ projectId: d.state.id, executionId: execution.id, ownershipEpoch: execution.ownershipEpoch, pull });
            if (pull?.status === "merged") {
              // Retain the original report/epoch rather than rerunning business
              // work or discarding a merged PR. The runner must wake its Agent
              // if explicit finish/PR/local-sync facts are still missing.
              if (!d.database.scopedAgentReport(d.state.id, execution.id, execution.ownershipEpoch) && action.operation === "retry") {
                const invocationId = `inv_${createHash("sha256").update(JSON.stringify([execution.id, execution.ownershipEpoch,
                  "missing-report-repair", receipt.envelope.invocationId, receipt.envelope.callId])).digest("hex").slice(0, 32)}`;
                const runtimePath = await d.storage.invocationRuntimePath(d.state.id, invocationId);
                d.database.beginScopedAgentMissingReportRepair({ projectId: d.state.id, executionId: execution.id,
                  ownershipEpoch: execution.ownershipEpoch, invocationId, runtimePath, coordination: receipt.envelope });
              } else d.database.resumeScopedMergedDelivery(d.state.id, execution.id, execution.ownershipEpoch,
                receipt.envelope);
            } else d.database.retryScopedAgentArrival({ projectId: d.state.id, executionId: execution.id,
              arrivalRequestId: execution.arrivalRequestId, failedOwnershipEpoch: receipt.failedOwnershipEpoch });
          }
        } catch (error) {
          if (d.signal.aborted || d.database.projectCancellationIntent(d.state.id) || error instanceof ScopedManagementDeferredError ||
            error instanceof CollaborationStateError && (error.code === "WORKFLOW_ADJUSTMENT_PENDING" ||
              error.code === "ACTIVE_NODE_CONFLICT" && error.details.reason === "management-occupancy")) throw error;
          const reason = `Recovery decision could not be applied: ${error instanceof Error ? redactTrace(error.message) : "Unknown recovery application failure"}`;
          const failures = d.database.recordScopedManagementFailure({ projectId: d.state.id, groupRunId: group.id,
            agentId: manager.agentId, invocationId: manager.invocationId, runtimePath: manager.runtimePath,
            coordinatorEpoch: manager.coordinatorEpoch, purpose: "recover", reason, applicationFailure: receipt.envelope });
          if (receipt.globalMain && failures.some(failure => failure.exhausted)) {
            d.state.status = "retrying";
            d.state.phase = "collaboration:technical-failure";
            d.state.lastError = reason;
            await d.storage.saveState(d.state);
          }
        }
      }
    }
    await d.publish();
  }

  private async requestScopedUser(invocationId: string, callId: string, message: string, rationale: string): Promise<void> {
    const d = this.d;
    if (d.state.orchestration.allowUserIntervention === false) {
      if (d.state.userIntervention?.status === "pending" && d.database.isScopedUserIntervention(d.state.id, d.state.userIntervention.id)) {
        d.state.userIntervention = undefined;
        if (d.state.phase === "user-intervention-required") {
          d.state.status = "retrying"; d.state.phase = "collaboration:scoped-failure";
          d.state.lastError = "当前 Workflow 已关闭用户介入，保留原任务及恢复记录等待故障恢复。";
        }
        await d.storage.saveState(d.state);
      }
      return;
    }
    const latest = d.database.latestScopedUserRequest(d.state.id);
    if (!latest || latest.invocationId !== invocationId || latest.callId !== callId) return;
    const key = `scoped-user-request:${invocationId}:${callId}`;
    const prior = d.database.eventByRequestId(d.state.id, key);
    const intervention = prior?.payload.intervention as ProjectState["userIntervention"] | undefined ?? {
      id: `intervention_${createHash("sha256").update(key).digest("hex").slice(0, 32)}`, status: "pending" as const,
      requestedAt: new Date().toISOString(), message, rationale, successCriteria: [], requestedBy: "main",
      requestedInvocationId: invocationId, requestKind: "main" as const
    };
    if (prior) {
      if (d.database.eventByRequestId(d.state.id, `scoped-user-consumed:${intervention.id}`)) {
        if (d.state.userIntervention && d.database.isScopedUserIntervention(d.state.id, d.state.userIntervention.id)) {
          d.state.userIntervention = undefined;
          await d.storage.saveState(d.state);
        }
        return;
      }
      if (d.state.userIntervention?.id === intervention.id) return;
      const answered = d.database.eventByRequestId(d.state.id, `user-response-${intervention.id}`);
      if (answered && typeof answered.payload.response === "string" && answered.payload.response.trim()) {
        d.state.userIntervention = { ...intervention, status: "answered", response: answered.payload.response,
          answeredAt: typeof answered.payload.answeredAt === "string" ? answered.payload.answeredAt : answered.ts };
        d.state.status = "queued"; d.state.phase = "collaboration:user-response";
        await d.storage.saveState(d.state); return;
      }
    } else d.database.appendEvent({ projectId: d.state.id, requestId: key, agentId: "main", invocationId,
      type: "user.intervention.requested", payload: { intervention, scoped: true } });
    d.state.userIntervention = intervention; d.state.status = "retrying"; d.state.phase = "user-intervention-required";
    await d.storage.saveState(d.state);
  }

  private async publishArtifacts(): Promise<void> {
    // Publications are derived solely from accepted scoped control intents and
    // immutable PR+sync facts; never from an open PR or a mutable checkout.
    const d = this.d;
    const projection = d.database.projectState(d.state.id);
    const events = [] as ReturnType<CollaborationStateDatabase["eventsAfter"]>;
    let cursor = 0;
    for (;;) {
      const page = d.database.eventsAfter(d.state.id, cursor, 1_000);
      if (!page.length) break;
      events.push(...page); cursor = page.at(-1)!.seq;
    }
    for (const merge of projection.scopedAgentMerges ?? []) {
      const execution = projection.scopedExecutions?.find((item) => item.id === merge.executionId)!;
      for (const event of events.filter((item) => item.type === "scoped.artifact.staged" && item.payload.executionId === execution.id && item.payload.ownershipEpoch === execution.ownershipEpoch)) {
        const envelope = event.payload.envelope as ControlActionEnvelope;
        if (envelope.action.tool !== "publish_artifact") continue;
        const action = envelope.action;
        const id = `artifact_${createHash("sha256").update(JSON.stringify([execution.id, execution.ownershipEpoch, merge.pullRequest.id, action.path])).digest("hex")}`;
        if (d.state.artifacts?.some((item) => item.id === id)) continue;
        const record = { id, agent: execution.agentId, invocationId: envelope.invocationId, path: action.path,
          title: action.title, kind: action.kind, description: action.description, size: 0, updatedAt: merge.recordedAt,
          registeredAt: merge.recordedAt, gitSource: { executionId: execution.id, ownershipEpoch: execution.ownershipEpoch,
            worktreePath: execution.worktreePath, commitSha: merge.pullRequest.headSha!, pullRequestId: merge.pullRequest.id, acceptedBase: merge.pullRequest.base } };
        const verification = { ...d.state, scopedExecutions: projection.scopedExecutions, scopedAgentMerges: projection.scopedAgentMerges };
        const artifact = await d.storage.validateGitArtifactRecord(verification, record);
        const content = await fs.readFile(artifact.sourcePath);
        d.state.artifacts = [...(d.state.artifacts ?? []), { ...record, size: content.length, mediaType: artifact.mediaType,
          sha256: createHash("sha256").update(content).digest("hex") }];
        await d.storage.saveState(d.state);
      }
    }
  }
}
