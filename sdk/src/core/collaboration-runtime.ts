import { failureAttemptHistory } from "./internal/shared/failure-attempt-history.js";
import { MAX_TASK_REPAIR_WAKEUPS, nextTaskRepair, superviseTask, supervisionError, supervisionHandoff } from "./task-supervision.js";
import { nativeBackgroundJobLifecycle } from "./harness-runtime/background-jobs.js";
import type { WorkflowReplayConfigurationHistory } from "./workflow-replay.js";
import { workflowMessagesText } from "./workflow-input.js";
import { beginWorkflowRecovery, canAutomaticallyRecoverWorkflow, checkpointWorkflowRecovery, finishWorkflowRecovery, hasUserWorkflowPause } from "./workflow-recovery.js";
import { deriveProjectRuntimeProjection } from "./project-runtime-projection.js";
import { AgentContextSources } from "./agent-context-index.js";
import { workflowAdjustmentContextSources } from "./workflow-adjustment-notifications.js";
export { deriveProjectRuntimeProjection } from "./project-runtime-projection.js";
import { archiveRemovedWorkflowAgentSessions } from "./workflow-session-archive.js";
import { boundWorkflowHarnesses } from "./workflow-session-compatibility.js";
import type { SerialWorkflowNotificationContext } from "./serial-workflow-notifications.js";
import type { SerialMainWorkflowAdjustmentInput, SerialWorkflowPublicationAuthority } from "./serial-workflow-adjustment-contracts.js";
import { sameWorkflowConfigurationVersion, type WorkflowAdjustmentRecord, type WorkflowConfigurationVersion } from "./workflow-adjustments.js";
import { workflowAdjustmentSubmissionEnvelopeSchema, withdrawWorkflowAdjustmentSchema,
  type SubmitUserWorkflowAdjustmentInput, type WorkflowAdjustmentContext, type WorkflowAdjustmentPageInput, type WorkflowAdjustmentPageResult, type WorkflowAdjustmentDetail, type WorkflowAdjustmentQueryResult, type WorkflowAdjustmentPublication,
  type WorkflowAdjustmentSubmissionResult, type WorkflowAdjustmentWithdrawalResult } from "./workflow-adjustments.js";
import { executionWorktreeClosingActions } from "./execution-worktree-closing.js";
import { managementInputRoot, isManagementProposal } from "./management-input-paths.js";
import { MAIN_AGENT_ORCHESTRATION_CURRENT_FILE } from "./main-workflow-files.js";
import { controlResultReceipts, sameDurableSession } from "./control-result-receipts.js";
import { workflowAdjustmentNotifications } from "./workflow-adjustment-notifications.js";
import { executeProjectStateRequest } from "./project-state-service.js";
import { readOnlyProjectStateDocuments, type ProjectStateDocumentStore, type SerialProjectStateInvocation } from "./project-state-documents.js";
import { WriterLeaseHeartbeat, type HeartbeatDiagnostics } from "./collaboration-state/writer-lease-heartbeat.js";
import os from "node:os";
import type { ProjectAgentQueueSource } from "./agent-queue-view.js";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { ZodError } from "zod";
import { DEFAULT_HARNESS_ID } from "./agent-runtime.js";
import { InvocationPerformanceTracker, recordTerminalPerformance } from "./invocation-performance.js";
import { collaborationSessionKey } from "./internal/shared/collaboration-session-key.js";
import { validateSessionRef } from "./harness-runtime/session-ref.js";
import type {
  AgentRunRequest,
  AgentRunResult,
  AgentOrchestrationTemplate,
  ArtifactRecord,
  ControlAction,
  ControlActionEnvelope,
  ControlMcpRequest,
  DisplayItem,
  DisplaySelection,
  CollaborationProjectUserInputRequest,
  CollaborationUserInterventionResponseRequest,
  FailureAttempt,
  GitRetrySchedulingMilestoneName,
  GitRetrySchedulingPoint,
  GitRetrySchedulingWait,
  GroupRun,
  MemberExecution,
  NodeRun,
  NodeRef,
  ProjectGitAccountBinding,
  ProjectGitState,
  ProjectGitInput,
  ProjectState,
  ProjectUserInput,
  PullRequestRecord,
  ResidentDurableRehydrateProvenance,
  ResidentRecoveryProofSeed,
  TimelineEvent,
  TraceSink,
  WorkTask
} from "./types.js";
import { ProjectStorage, type ProjectEventDraft } from "./storage.js";
import { executeAgentGitTool, isAgentGitAction, type AgentGitFacts } from "./agent-git-tools.js";
import { agentGitDeliveryStatus, agentGitFactsSynchronized } from "./agent-git-delivery.js";
import { agentGitOperationJournal } from "./agent-git-operation-journal.js";
import { captureKnownAgentGitResults } from "./agent-git-result-observations.js";
import { terminalPushObservationControlAuthorityFactory } from "./terminal-push-observation-control.js";
import { TerminalPushCoordinatorRuntime } from "./terminal-push-coordinator-runtime.js";
import { ScopedWorktreeClosingRuntime } from "./scoped-worktree-closing-runtime.js";
import { scopedGroupOutput } from "./scoped-group-output.js";
import { scopedWorkerCapacity } from "./scoped-workflow-capacity.js";
import { ScopedProjectRuntime } from "./scoped-project-runtime.js";
import type { ScopedGroupRunRecord, TerminalPushObservationTurn, TerminalPushObservationCandidate, TerminalPushCoordinatorTurn } from "./collaboration-state/contracts.js";
import { ScopedManagementDeferredError, type ScopedRuntimeAdvanceResult, type ScopedRuntimeIssue, type ScopedWorkflowGit } from "./scoped-workflow-runtime.js";
import type { ScopedAgentExecutionGit } from "./scoped-agent-execution.js";
import { mainAgentOrchestrationDocument, parseAgentOrchestrationProposal, type AgentOrchestrationProposal } from "./agent-orchestration-reconfiguration.js";
import { assertWorkflowGatewaySnapshots, credentialFreeAgentConfiguration, restoreAgentConfiguration, workflowGatewaySnapshotsNeedValidation } from "./scoped-agent-configuration.js";
import { restoreSerialWorkflowConfiguration } from "./serial-workflow-projection.js";
import { materializeProjectSkills } from "./project-skills.js";
import { buildAgentToolCatalog } from "./agent-tool-catalog.js";
import {
  CollaborationStateError,
  type AcceptedGroupControlAction,
  type AcceptedMainRouteAction,
  type CollaborationEvent,
  type CredentialFreeProjectStateProjection,
  type GroupActivationOrigin,
  type RuntimeActivity
} from "./collaboration-state/index.js";
import { openCollaborationStateWorker, type AsyncCollaborationStateStore as CollaborationStateDatabase } from "./collaboration-state/database-worker.js";
import {
  CollaborationGitFacade,
  createCollaborationGitFacade,
  safeAgentId,
  type CollaborationGitFactoryOptions,
  type GitHubPullRequestFact,
  type GitHubRepositoryFact,
  type GitHubCredentialResolver,
  type GitInitializationResult,
  type ManagementMemorySnapshot
} from "./collaboration-git/index.js";
import {
  CollaborationGitError,
  GitHubAuthorizationError
} from "./collaboration-git/errors.js";
import {
  loopIterationCount,
  workflowNodeRefFor,
  workflowRoutesForAgent,
  workflowTargetAllowsTasklessActivation,
  workflowWorkerChoiceCandidates
} from "./agent-orchestration.js";
import { newId, nowIso, redactTrace, safeProjectRelativePath } from "./utils.js";
import { SkillCatalog } from "./skill-catalog.js";
import { prepareWorkflowContext } from "./workflow-context.js";
import type { HarnessEvent, InvocationInputs, SessionRef } from "./harness-runtime/contracts.js";
import { HarnessRuntimeError, harnessRecoveryDelayMs, transientHarnessFailure } from "./harness-runtime/errors.js";
import {
  AUTHORITATIVE_WORKFLOW_DIRECTORY,
  AUTHORITATIVE_WORKFLOW_REFERENCES,
  ControlActionRejectedError,
  authoritativeWorkflowPaths,
  publishAuthoritativeWorkflowFiles
} from "./orchestration-control-bridge.js";
import {
  affectedCollaborationGroupIds,
  MAIN_WORKFLOW_FILE,
  mainWorkflowDocument,
  parseWorkflowProposal,
  reconcileAgentConfigsForWorkflow
} from "./workflow-reconfiguration.js";
import {
  bindResidentRecoveryProof,
  assertResidentRecoveryProofSeed
} from "./recovery-proof.js";

const DEFAULT_LEASE_MS = 30_000;
const EVENT_PAGE_SIZE = 500;
const GIT_RETRY_SCHEDULE_SLO_MS = 5_000;

/** v3 retains one checkout per Agent across every workflow scope. */
export function executionWorktreePath(
  projectRoot: string,
  orchestration: AgentOrchestrationTemplate,
  agentId: string,
  executionId: string
): string {
  const scoped = orchestration.schemaVersion === 3;
  const component = scoped ? safeAgentId(agentId) : executionId;
  if (!scoped && !/^[A-Za-z0-9][A-Za-z0-9._-]{0,159}$/.test(component)) {
    throw new Error("Unsafe execution worktree identity");
  }
  return scoped
    ? path.join(projectRoot, "git-worktrees", "agents", component)
    : path.join(projectRoot, "git-worktrees", component);
}

class ResidentRetainedWaitError extends Error {}
class TerminalPushObservationUnresolvedError extends ResidentRetainedWaitError {
  constructor(message: string, readonly coordinationNodeRunId?: string) { super(message); }
}
class CoordinatorSubstitutedError extends Error {}
class MainRouteRecoveryRequiredError extends Error {}
type GroupContinuationOutcome = "progressed" | "idle" | "fault-paused";
class ExecutionArtifactPublicationError extends Error {
  constructor(readonly artifactPath: string, readonly commitSha: string, cause: unknown) {
    super(`Git artifact publication failed for ${artifactPath} at ${commitSha}: ${safeRuntimeError(cause)}`, { cause });
  }
}

type IndependentMainRouteRecovery =
  | { recovered: true; recovery?: ResidentRecoveryProofSeed; priorProcessStopped?: boolean }
  | { recovered: false; priorProcessStopped?: boolean };

interface StandaloneIntegrationOutcome {
  terminal: boolean;
  next?: {
    target: string;
    routeEmissionId: string;
    output: string;
    sourceNodeRunId: string;
    sourceAgentId: string;
    routeKind: "fixed" | "weak";
    selectedByAgentId?: string;
  };
}

type StandaloneLoopTransition = {
  id: string;
  iterations: number;
  batch: number;
  totalIterations: number;
  exhausted: boolean;
};

interface NodeActivationInput {
  activationRequestId: string;
  inputSnapshotRef: string;
  assignment: string;
  activatedByAgentId: string;
  sourceNodeRunId?: string;
  sourceGroupRunId?: string;
  sourceAgentId?: string;
  sourceRouteKind?: "fixed" | "weak";
  sourceRouteSelectedByAgentId?: string;
}

interface RuntimeActivityAuthority {
  agentId: string;
  nodeRunId: string;
  groupRunId?: string;
  taskId?: string;
  executionId?: string;
  ownershipEpoch?: number;
  coordinatorEpoch?: number;
}

interface DurableFailureAttemptInput {
  attemptId?: string;
  scope?: FailureAttempt["scope"];
  operation: string;
  error: unknown;
  errorCode?: string;
  retryable?: boolean;
  startedAt?: string;
  metadata?: Readonly<Record<string, unknown>>;
  agentId?: string;
  nodeRunId?: string;
  groupRunId?: string;
  taskId?: string;
  executionId?: string;
  invocationId?: string;
  ownershipEpoch?: number;
  coordinatorEpoch?: number;
}

interface GitRetrySchedulingContext {
  retryId: string;
  operationId: string;
  attempt: number;
  authority: Pick<GitRetrySchedulingPoint,
    "invocationId" | "epoch" | "epochKind">;
  retryAcceptedAt: string;
}

function routeActivationActor(input: {
  sourceGroupRunId?: string;
  sourceAgentId?: string;
  routeKind: "fixed" | "weak";
  selectedByAgentId?: string;
}): string {
  if (input.sourceGroupRunId) return "main";
  if (input.routeKind === "weak") {
    if (!input.selectedByAgentId) {
      throw new Error("A weak downstream route is missing its durable selector identity");
    }
    if (input.selectedByAgentId !== "main" &&
      input.selectedByAgentId !== input.sourceAgentId) {
      throw new Error("A weak downstream route selector does not own its source decision");
    }
    return input.selectedByAgentId;
  }
  if (input.selectedByAgentId) {
    throw new Error("A fixed downstream route cannot carry a selector identity");
  }
  return input.sourceAgentId ?? "main";
}

function groupActivationOrigin(input: NodeActivationInput): GroupActivationOrigin {
  if (!input.sourceNodeRunId) return { kind: "project-input" };
  const route = input.sourceRouteKind ?? "fixed";
  if (input.sourceGroupRunId) {
    return {
      kind: "group-route",
      sourceNodeRunId: input.sourceNodeRunId,
      sourceGroupRunId: input.sourceGroupRunId,
      route
    };
  }
  if (!input.sourceAgentId) {
    throw new Error("A routed group activation is missing its source Agent identity");
  }
  if (route === "weak") {
    if (input.sourceRouteSelectedByAgentId === "main") {
      return {
        kind: "main-selection",
        sourceNodeRunId: input.sourceNodeRunId,
        ...(input.sourceAgentId !== "main" ? { sourceAgentId: input.sourceAgentId } : {})
      };
    }
    if (input.sourceAgentId !== "main" &&
      input.sourceRouteSelectedByAgentId === input.sourceAgentId) {
      return {
        kind: "agent-route",
        sourceAgentId: input.sourceAgentId,
        sourceNodeRunId: input.sourceNodeRunId,
        route: "autonomous"
      };
    }
    throw new Error("A weak group activation is missing a valid durable selector identity");
  }
  if (input.sourceRouteSelectedByAgentId) {
    throw new Error("A fixed group activation cannot carry a selector identity");
  }
  return input.sourceAgentId === "main"
    ? { kind: "main-direct", sourceNodeRunId: input.sourceNodeRunId }
    : {
        kind: "agent-route",
        sourceAgentId: input.sourceAgentId,
        sourceNodeRunId: input.sourceNodeRunId,
        route: "strong"
      };
}


export interface CollaborationProjectResumeOptions {
  /** Continue an already stopped scoped recovery without authorizing any new repair cycle. */
  preserveRecoveryBudget?: boolean;
}

export interface CollaborationRuntimeLifecycle {
  initialize(): Promise<void>;
  initializeNewProjectState?(state: ProjectState): void | Promise<void>;
  serialProjectStateEnabled?(state: ProjectState): boolean | Promise<boolean>;
  requestSerialProjectState?(state: ProjectState, identity: SerialProjectStateInvocation, request: unknown): Promise<unknown>;
  queueReadModel?(state: ProjectState): ProjectAgentQueueSource | undefined | Promise<ProjectAgentQueueSource | undefined>;
  /** SDK-only configuration roll-forward before its original scheduler starts. */
  recoverSerialWorkflowConfiguration?(state: ProjectState, options?: { recoverResultBoundaries?: boolean }): Promise<{ changed: boolean } | undefined>;
  prepareSerialWorkflowAdjustments?(state: ProjectState): WorkflowAdjustmentContext["current"] | Promise<WorkflowAdjustmentContext["current"]>;
  pendingSerialWorkflowAdjustments?(state: ProjectState): WorkflowAdjustmentRecord[] | Promise<WorkflowAdjustmentRecord[]>;
  publishSerialWorkflowAdjustment?(state: ProjectState, requestId: string, authority: SerialWorkflowPublicationAuthority): Promise<WorkflowAdjustmentRecord>;
  getWorkflowAdjustmentSubmissionResult?(state: ProjectState, requestId: string, replay: boolean): WorkflowAdjustmentSubmissionResult | Promise<WorkflowAdjustmentSubmissionResult>;
  decorateSerialWorkflowNotifications?(state: ProjectState, request: AgentRunRequest): void | Promise<void>;
  prepareSerialMainWorkflowAdjustment?(state: ProjectState): WorkflowAdjustmentContext["current"] | Promise<WorkflowAdjustmentContext["current"]>;
  isSerialWorkflowConfigurationCurrent?(state: ProjectState, version: WorkflowConfigurationVersion): boolean | Promise<boolean>;
  getSerialMainWorkflowAdjustment?(state: ProjectState, invocationId: string, callId: string): WorkflowAdjustmentRecord | undefined | Promise<WorkflowAdjustmentRecord | undefined>;
  stageSerialMainWorkflowAdjustment?(state: ProjectState, input: Pick<SerialMainWorkflowAdjustmentInput, "base" | "proposal" | "envelope">): WorkflowAdjustmentSubmissionResult | Promise<WorkflowAdjustmentSubmissionResult>;
  publishSerialMainWorkflowAdjustment?(state: ProjectState, requestId: string, authority: SerialWorkflowPublicationAuthority): Promise<WorkflowAdjustmentRecord>;
  recordSerialMainWorkflowBoundary?(state: ProjectState, requestId: string, completion: TimelineEvent): void | Promise<void>;
  recoverSerialMainWorkflowBoundaries?(state: ProjectState): Promise<void>;
  pendingSerialMainWorkflowAdjustments?(state: ProjectState): WorkflowAdjustmentRecord[] | Promise<WorkflowAdjustmentRecord[]>;
  /** Build an API/UI view directly from the current SQLite projection. */
  projectReadModel?(state: ProjectState): ProjectState | Promise<ProjectState>;
  committedProjectState?(state: ProjectState): ProjectState | undefined | Promise<ProjectState | undefined>;
  getWorkflowAdjustments?(state: ProjectState): WorkflowAdjustmentContext | Promise<WorkflowAdjustmentContext>;
  queryWorkflowAdjustments?(state: ProjectState, ifNoneMatch?: string): WorkflowAdjustmentQueryResult | Promise<WorkflowAdjustmentQueryResult>;
  getWorkflowAdjustmentPage?(state: ProjectState, input: WorkflowAdjustmentPageInput, ifNoneMatch?: string): WorkflowAdjustmentPageResult | Promise<WorkflowAdjustmentPageResult>;
  getWorkflowAdjustmentDetail?(state: ProjectState, requestId: string, expectedVersion?: string): WorkflowAdjustmentDetail | Promise<WorkflowAdjustmentDetail>;
  workflowReplayConfigurationHistory?(state: ProjectState): WorkflowReplayConfigurationHistory | Promise<WorkflowReplayConfigurationHistory>;
  submitWorkflowAdjustment?(state: ProjectState, input: unknown): Promise<WorkflowAdjustmentSubmissionResult>;
  withdrawWorkflowAdjustment?(state: ProjectState, input: unknown): Promise<WorkflowAdjustmentWithdrawalResult>;
  recoverProject(state: ProjectState): Promise<boolean>;
  createProject(state: ProjectState, input: ProjectGitInput): Promise<void>;
  assertWorkflowRevisionEditable(state: ProjectState, affectedGroupIds: string[]): void | Promise<void>;
  saveWorkflowRevision(state: ProjectState, input: {
    orchestration: AgentOrchestrationTemplate;
    affectedGroupIds: string[];
    requestId?: string;
    requestContext?: {
      kind: "collaboration.rename" | "collaboration.dissolve";
      subjectId: string;
    };
  }): Promise<number>;
  isWorkflowRevisionRequestRecorded?(state: ProjectState, input: {
    requestId: string;
    kind: "collaboration.rename" | "collaboration.dissolve";
    subjectId: string;
  }): boolean | Promise<boolean>;
  retryInitialization(state: ProjectState): Promise<void>;
  pauseProject(state: ProjectState): Promise<void>;
  resumeProject(state: ProjectState, options?: CollaborationProjectResumeOptions): Promise<void>;
  cancelProject(state: ProjectState, input: { actor?: string; reason?: string }): Promise<void>;
  archiveProject?(state: ProjectState): Promise<void>;
  shutdown(): Promise<void>;
}

export type CollaborationGitRuntime = Pick<CollaborationGitFacade,
  | "initialize"
  | "beginGroup"
  | "sessionBegin"
  | "checkpointAndPush"
  | "createPullRequest"
  | "observePullRequest"
  | "mergePullRequest"
  | "closePullRequest"
  | "prepareConflictResolution"> & Partial<Pick<CollaborationGitFacade,
    | "reconcilePushOperation"
    | "refreshRecoveryBase"
    | "observeRemoteRef"
    | "observePullRequestForExecution"
    | "reconcileMergedPullRequest"
    | "observeRetainedExecution"
    | "observeDeliveryPreparation"
    | "observeExecutionCommit"
    | "observeExecutionWorktree"
    | "clearExecutionWorktree"
    | "observeRestrictedWorktreeClosing"
    | "observeRestrictedWorktreeClosingTarget"
    | "identifyRestrictedWorktreeClosing"
    | "commitManagementMemory"
    | "managementMemorySnapshot"
    | "prepareAgentManagementWorkspace"
    | "createGroupFinalPullRequest"
    | "mergeGroupFinalPullRequest"
    | "reconcileGroupFinalPullRequest"
    | "checkpointGroupCompletion"
    | "releaseFinalIntegrationWorktree"
    | "releaseFailedFinalIntegrationWorktree">>;

export type CollaborationGitFacadeFactory = (
  options: CollaborationGitFactoryOptions
) => CollaborationGitRuntime;

export interface CollaborationResidentHandle {
  readonly closed?: boolean;
  submit(input: { inputId: string; invocationId: string; prompt: string }): Promise<AgentRunResult>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  close(): Promise<void>;
  supervisionActions?(): Promise<string[]>;
}

export interface CollaborationResidentOpenInput {
  /** Exact source-authored current messages for the first scoped task turn. */
  initialTask?: string;
  request: AgentRunRequest;
  executionRuntimePath: string;
  /** Internal finite S report-repair grant; never provided by an Agent prompt/tool. */
  sameEpochReopen?: import("./harness-runtime/resident-lease.js").ResidentSameEpochReopen;
  filesystemAuthorityInput: {
    serviceUserRoot: string;
    projectWorktreeRoot: string;
    projectWorktrees?: readonly string[];
    protectedRoots: readonly string[];
  };
  signal: AbortSignal;
  onTrace: TraceSink;
  /** Called only after the native resident process has opened successfully. */
  onOpened?: () => Promise<void> | void;
  /** Rebuilds callbacks and attribution for every resident business turn. */
  turnRequestFactory: CollaborationTurnRequestFactory;
  /** Required for a leader; staged under the invocation runtime, never a business workspace. */
  inputs?: InvocationInputs;
  controlScope?:
    | import("./harness-runtime/resident-runtime-adapter.js").ResidentReceiptCoordinatorControlScope
    | import("./harness-runtime/resident-runtime-adapter.js").ResidentScopedLeaderControlScope
    | {
        projectId: string;
        nodeRunId: string;
        groupRunId: string;
        executionId: string;
        agentId: string;
        ownershipEpoch: number;
        role: "scoped-agent";
        candidates: readonly string[];
        decisionBy: "agent" | "main";
      }
    | {
        projectId: string;
        nodeRunId: string;
        groupRunId: string;
        leaderAgentId: string;
        coordinatorEpoch: number;
        role?: "leader";
      }
    | {
        projectId: string;
        nodeRunId: string;
        executionId: string;
        agentId: string;
        ownershipEpoch: number;
        role: "standalone-route";
        candidates: readonly string[];
        decisionBy: "agent";
      }
    | {
        projectId: string;
        nodeRunId: string;
        executionId: string;
        agentId: string;
        ownershipEpoch: number;
        role: "execution-artifact";
        terminalPushObservation?: import("./types.js").TerminalPushObservationScope;
        worktreeClosing?: import("./types.js").WorktreeClosingScope;
      }
    | {
        projectId: string;
        nodeRunId: string;
        routeScopeId: string;
        leaderAgentId: "main";
        coordinatorEpoch: number;
        role: "main-route";
        candidates: readonly string[];
        tasklessRouteTargets: readonly string[];
        allowUserIntervention: boolean;
        allowWorkflowReconfiguration: boolean;
        canComplete: boolean;
        allowFinishRoute: boolean;
      }
    | {
        projectId: string;
        nodeRunId: string;
        routeScopeId: string;
        leaderAgentId: "main";
        coordinatorEpoch: number;
        role: "main-node";
        candidates: readonly string[];
        tasklessRouteTargets: readonly string[];
        allowUserIntervention: boolean;
        allowWorkflowReconfiguration: boolean;
        canComplete: boolean;
        allowFinishRoute: false;
      };
  controlAuthorityFactory?: CollaborationControlAuthorityFactory;
}

/** One common stop result for Main routes, group leaders, and members. */
export interface CollaborationResidentRecoveryResult {
  stopped: boolean;
  evidence: Readonly<Record<string, unknown>>;
  recovery?: ResidentRecoveryProofSeed;
}

/**
 * Trusted I/H boundary. An implementation owns the stable resident front
 * door and must rotate/revoke downstream route plus control capability before
 * acknowledging each submit. A model turn is never an execution terminal.
 */
export interface CollaborationResidentLauncher {
  open(input: CollaborationResidentOpenInput): Promise<CollaborationResidentHandle>;
  stopScopedForRecovery?(input: {
    state: ProjectState; nodeRunId: string; scopeId: string; agentId: string;
    role: "leader" | "delivery"; ownershipEpoch: number; executionRuntimePath: string;
  }): Promise<CollaborationResidentRecoveryResult>;
  /**
   * Service restart cannot reconnect inherited stdio. Stop and prove the old
   * process group first; I advances S ownership before opening a new process.
   */
  stopForRecovery?(input: {
    state: ProjectState;
    execution: MemberExecution;
    executionRuntimePath: string;
    residentLaunchProtocol?: "trusted-supervisor-v1";
  }): Promise<CollaborationResidentRecoveryResult>;
  stopLeaderForRecovery?(input: {
    state: ProjectState;
    groupRun: GroupRun;
    nodeRunId: string;
    leaderInvocationId: string;
    executionRuntimePath: string;
    residentLaunchProtocol?: "trusted-supervisor-v1";
  }): Promise<CollaborationResidentRecoveryResult>;
  /** Opens/reuses a separate management-only Main scope; never the source resident. */
  decideRoute?(input: {
    state: ProjectState;
    sourceNodeRunId: string;
    sourceAgentId: string;
    output: string;
    candidates: readonly string[];
    signal: AbortSignal;
    open: CollaborationResidentOpenInput;
    turn: { inputId: string; invocationId: string; prompt: string };
    /** Main uses the same runtime-owned Pause/Resume/Stop lifecycle as other
     * residents. These hooks transport handles/results, never Agent choices. */
    register?(handle: CollaborationResidentHandle): void;
    unregister?(handle: CollaborationResidentHandle): void;
    submit?(handle: CollaborationResidentHandle, turn: {
      inputId: string; invocationId: string; prompt: string;
    }): Promise<AgentRunResult>;
    /** Keep the actual Main handle/session for missing mechanism actions.
     * The coordinator checks durable facts; Agent supplies every decision. */
    onTurnCompleted?(result: AgentRunResult, turn: {
      inputId: string; invocationId: string; prompt: string;
    }): Promise<{ inputId: string; invocationId: string; prompt: string } | undefined>;
  }): Promise<
    | {
        decisionRecorded: false;
        output?: string;
        controlActions?: ControlActionEnvelope[];
      }
    | {
        /** Optional for compatibility with injected launchers that predate the discriminator. */
        decisionRecorded?: true;
        targetNodeId: string;
        decisionRequestId: string;
        output?: string;
        intervention?: Extract<ControlAction, { tool: "request_user" }>;
        decisionAction?: Extract<ControlAction,
          { tool: "route_to_agent" | "request_user" | "apply_workflow" | "complete_project" }>;
        controlActions?: ControlActionEnvelope[];
        acceptedActions?: AcceptedMainRouteAction[];
      }
  >;
  /** Stop/process and Git observations used for bounded Main recovery. */
  observeMainRecovery?(input: {
    state: ProjectState;
    groupRun: GroupRun;
    executionRuntimePath: string;
  }): Promise<CollaborationResidentRecoveryResult>;
  /** Stop proof for a standalone system-Main routing resident. */
  observeMainRouteRecovery?(input: {
    state: ProjectState;
    sourceNodeRunId: string;
    routeScopeId: string;
    routeEpoch: number;
    executionRuntimePath: string;
  }): Promise<CollaborationResidentRecoveryResult>;
}

export type CollaborationControlAuthorityFactory = (input: {
  request: AgentRunRequest;
  turn: { inputId: string; invocationId: string; prompt: string };
}) => Promise<{
  control: ControlMcpRequest;
  revalidate(
    envelope: ControlActionEnvelope,
    stagedActions: readonly ControlActionEnvelope[]
  ): Promise<unknown>;
  onRejected?(
    envelope: ControlActionEnvelope | undefined,
    error: Error
  ): Promise<void>;
  /** Executes an invocation-scoped Agent-owned business action and returns
   * the provider fact to the same native turn. */
  execute?(envelope: ControlActionEnvelope, signal: AbortSignal): Promise<unknown>;
}>;

export interface CollaborationTurnRuntime {
  request: AgentRunRequest;
  onTrace: TraceSink;
  /** Required by DSH when a recovered native process starts a new session. */
  durableRehydrate?: ResidentDurableRehydrateProvenance;
}

export type CollaborationTurnRequestFactory = (input: {
  /** The immutable identity/configuration request supplied to open(). */
  baseRequest: AgentRunRequest;
  turn: { inputId: string; invocationId: string; prompt: string };
}) => Promise<CollaborationTurnRuntime>;

export interface CollaborationExecutionInputBuilder {
  build(input: {
    state: ProjectState;
    agentId: string;
    execution?: MemberExecution;
    executionContext: NonNullable<AgentRunRequest["executionContext"]>;
    assignment: string;
    invocationId: string;
    inboxPath: string;
    projectPath: string;
    worktreePath: string;
    runtimePath: string;
    /** Internal mechanism turn; never a second business assignment. */
    terminalPushObservation?: import("./types.js").TerminalPushObservationScope;
    terminalPushCoordination?: import("./types.js").TerminalPushCoordinationScope;
    worktreeClosing?: import("./types.js").WorktreeClosingScope;
  }): Promise<AgentRunRequest>;
}

/** Production request builder; tests may inject a smaller deterministic one. */
export class ProductionCollaborationExecutionInputBuilder
implements CollaborationExecutionInputBuilder {
  constructor(
    private readonly storage: ProjectStorage,
    private readonly skills: SkillCatalog
  ) {}

  async build(input: Parameters<CollaborationExecutionInputBuilder["build"]>[0]): Promise<AgentRunRequest> {
    if (path.resolve(input.projectPath) !== path.resolve(this.storage.projectDir(input.state.id))) {
      throw new Error("Collaboration request project path does not match storage authority");
    }
    const config = input.state.agents[input.agentId];
    if (!config) throw new Error(`Unknown collaboration Agent ${input.agentId}`);
    // Allocate the mechanism before any business resource preparation. A
    // closed task must not rematerialize Skills or acquire their capabilities.
    const mechanismOnly = input.terminalPushObservation !== undefined || input.terminalPushCoordination !== undefined || input.worktreeClosing !== undefined;
    const catalog = mechanismOnly ? [] : input.agentId === "main" && input.state.orchestration.allowMainReconfiguration
      ? await this.skills.list() : await this.skills.forSelections([...config.skills, ...config.autoSkills]);
    const projectSkills = mechanismOnly ? {} : await materializeProjectSkills(input.projectPath, input.state.skillDefinitions);
    const skillPaths = mechanismOnly ? [] : await this.skills.resolveConfigured(catalog, config.skills, projectSkills);
    const autoSkillPaths = mechanismOnly ? [] : await this.skills.resolveConfigured(catalog, config.autoSkills, projectSkills);
    const leader = input.executionContext.role === "leader";
    const scoped = input.state.orchestration.schemaVersion === 3;
    if (scoped) assertScopedSessionIdentity(input.state, input.agentId);
    const sessionKey = collaborationSessionKey(input.agentId, input.executionContext, scoped);
    const resumeThreadId = input.state.agentSessionIds?.[sessionKey];
    return {
      project: structuredClone(input.state),
      purpose: "workflow",
      agent: input.agentId,
      kind: input.agentId === "main" ? "main" : "worker",
      // Management residents never inherit a user's delivery-level yolo
      // setting. Their filesystem/control scope is read-only and brokered.
      permission: leader || mechanismOnly ? "workspace" : config.permission,
      invocationId: input.invocationId,
      inboxPath: input.inboxPath,
      projectPath: input.projectPath,
      workspacePath: input.worktreePath,
      schemaPath: await collaborationSchemaPath(input.agentId === "main" ? "main" : "worker"),
      skillPaths,
      autoSkillPaths,
      availableSkillPaths: catalog.map((skill) => skill.path),
      ...(input.agentId === "main" && input.state.orchestration.allowMainReconfiguration && !mechanismOnly
        ? { toolCatalog: buildAgentToolCatalog(catalog, input.state.skillDefinitions, input.state.mcpDefinitions) }
        : {}),
      availableSkills: catalog,
      runtimePath: input.runtimePath,
      executionContext: structuredClone(input.executionContext),
      ...(input.terminalPushObservation ? { terminalPushObservation: structuredClone(input.terminalPushObservation) } : {}),
      ...(input.terminalPushCoordination ? { terminalPushCoordination: structuredClone(input.terminalPushCoordination) } : {}),
      ...(input.worktreeClosing ? { worktreeClosing: structuredClone(input.worktreeClosing) } : {}),
      sessionContinuity: "strict" as const,
      ...(resumeThreadId ? { resumeThreadId } : {})
    };
  }
}

export interface CollaborationInvocationDispatcher {
  finish?(state: ProjectState, invocationId: string, status: "completed" | "incomplete"): Promise<void>;
  flush?(projectId?: string): Promise<void>;
  decorate(input: {
    state: ProjectState;
    request: AgentRunRequest;
    execution?: MemberExecution;
  }): void;
  trace(input: {
    state: ProjectState;
    agentId: string;
    invocationId: string;
  }): TraceSink;
}

/**
 * Production UI/audit callback boundary. The collaboration coordinator owns
 * S accounting, while this dispatcher preserves the same durable trace,
 * model activity, live Harness and attempt-reset channels as legacy runs.
 */
export class ProductionCollaborationInvocationDispatcher
implements CollaborationInvocationDispatcher {
  readonly #queues = new Map<string, Promise<void>>();
  readonly #performance = new Map<string, InvocationPerformanceTracker>();
  readonly #eventBatches = new Map<string, { state: ProjectState; drafts: ProjectEventDraft[];
    traces: Array<Parameters<ProjectStorage["appendTraces"]>[1][number]>; timer?: ReturnType<typeof setTimeout> }>();
  readonly #eventFlushes = new Map<string, Promise<void>>();
  readonly #eventBatchFailures = new Map<string, unknown>();
  readonly #checkpointAt = new Map<string, number>();
  readonly #pendingCheckpoints = new Map<string, ProjectState>();

  constructor(private readonly storage: ProjectStorage) {}

  decorate(input: {
    state: ProjectState;
    request: AgentRunRequest;
    execution?: MemberExecution;
  }): void {
    const { state, request } = input;
    if (!this.#checkpointAt.has(state.id)) this.#checkpointAt.set(state.id, Date.now());
    const performanceKey = `${state.id}:${request.invocationId}`;
    const tracker = () => {
      let value = this.#performance.get(performanceKey);
      if (!value) {
        value = new InvocationPerformanceTracker(request.invocationId, request.agent, Date.now(),
          (performance) => this.storage.hub.publishPerformance(state.id, performance));
        this.#performance.set(performanceKey, value);
      }
      return value;
    };
    const priorUsage = request.onTokenUsage;
    request.onTokenUsage = async (usage) => {
      await priorUsage?.(usage);
      if ("inputTokens" in usage) tracker().recordUsage(usage);
    };
    const priorActivity = request.onModelActivity;
    request.onModelActivity = (activity) => {
      priorActivity?.(activity);
      // Synchronous activity callbacks cannot perform file I/O. Keep the live
      // read model fresh; subsequent durable callback writes persist it.
      state.updatedAt = new Date().toISOString();
    };
    const priorOfficial = request.onOfficialHarnessEvent;
    request.onOfficialHarnessEvent = async (event) => {
      await priorOfficial?.(event);
      this.publishLiveHarnessEvent(state.id, request.agent, event);
      const canonical = event as unknown as HarnessEvent;
      const draft: ProjectEventDraft = { type: "agent.trace", agent: request.agent,
        message: canonical.message ?? canonical.diagnostic?.message ?? canonical.tool?.name ?? "Resident Harness event",
        invocationId: request.invocationId, data: { resident: true, canonicalEvent: canonical } };
      // Native character/activity fragments are audit events, not scheduler
      // transitions. Keep their original records but share durable writes.
      // Tool/lifecycle/message boundaries below drain the preceding prefix.
      if (canonical.kind === "assistant.delta" || canonical.kind === "activity" || canonical.kind === "tool.updated" ||
          canonical.kind === "usage" || canonical.kind === "reasoning.summary") {
        await this.bufferEvent(state, draft);
        return;
      }
      await this.bufferEvent(state, draft);
      await this.drainBufferedEvents(state.id);
    };
    const priorLive = request.onLiveHarnessEvent;
    request.onLiveHarnessEvent = async (event) => {
      await priorLive?.(event);
      this.publishLiveHarnessEvent(state.id, request.agent, event);
    };
    const priorStream = request.onModelStreamEvent;
    request.onModelStreamEvent = async (event) => {
      await priorStream?.(event);
      tracker().observe(event);
      if (event.phase === "delta") return;
      await this.bufferEvent(state, {
        type: "agent.trace",
        agent: request.agent,
        message: `Resident model stream ${event.phase}`,
        invocationId: request.invocationId,
        data: { resident: true, stream: event }
      });
    };
    const priorReset = request.onHarnessAttemptReset;
    request.onHarnessAttemptReset = async (attempt) => {
      await this.drainBufferedEvents(state.id);
      await priorReset?.(attempt);
      this.storage.hub.resetInvocationAttempt(state.id, request.invocationId);
      const previous = this.#performance.get(performanceKey);
      if (previous) {
        const performance = previous.finish("incomplete");
        await this.enqueue(state.id, async () => {
          recordTerminalPerformance(state, performance, false);
          await this.storage.saveState(state);
        });
        previous.reset(attempt);
      } else tracker().reset(attempt);
      await this.enqueue(state.id, async () => {
        await this.storage.appendEvent(state, {
          type: "agent.trace",
          level: "warning",
          agent: request.agent,
          message: "Resident Harness attempt replaced for automatic recovery",
          invocationId: request.invocationId,
          data: { resident: true, attempt }
        });
      });
    };
  }

  async finish(state: ProjectState, invocationId: string, status: "completed" | "incomplete"): Promise<void> {
    await this.drainBufferedEvents(state.id);
    // Official Harness callbacks have committed before invocation settlement.
    // Retired resident sessions must not retain tools/output in live snapshots.
    this.storage.hub.clearInvocation(state.id, invocationId);
    const key = `${state.id}:${invocationId}`;
    const tracker = this.#performance.get(key);
    if (!tracker) { await this.flushCheckpoint(state.id); return; }
    this.#performance.delete(key);
    const performance = tracker.finish(status);
    await this.enqueue(state.id, async () => {
      recordTerminalPerformance(state, performance, status === "completed");
      await this.storage.appendEvent(state, { type: "invocation.performance", agent: performance.agent,
        invocationId, message: "Model performance recorded", data: { performance } });
      this.#pendingCheckpoints.delete(state.id);
      this.#checkpointAt.set(state.id, Date.now());
    });
  }

  async flush(projectId?: string): Promise<void> {
    const projects = projectId ? [projectId] : [...new Set([
      ...this.#eventBatches.keys(), ...this.#eventFlushes.keys(), ...this.#queues.keys(), ...this.#eventBatchFailures.keys(),
      ...this.#pendingCheckpoints.keys()
    ])];
    await Promise.all(projects.map(async id => { await this.drainBufferedEvents(id); await this.flushCheckpoint(id); }));
  }

  private flushCheckpoint(projectId: string): Promise<void> {
    return this.enqueue(projectId, async () => {
      const state = this.#pendingCheckpoints.get(projectId);
      if (!state) return;
      await this.storage.saveState(state);
      this.#pendingCheckpoints.delete(projectId);
      this.#checkpointAt.set(projectId, Date.now());
    });
  }

  trace(input: {
    state: ProjectState;
    agentId: string;
    invocationId: string;
  }): TraceSink {
    return async (kind, message, data) => {
      await this.bufferEvent(input.state, {
        type: "agent.trace",
        level: kind === "stderr" ? "warning" : "info",
        agent: input.agentId,
        message,
        invocationId: input.invocationId,
        data: { resident: true, traceKind: kind, ...(data ?? {}) }
      }, { agent: input.agentId, invocationId: input.invocationId, kind, message, timestamp: new Date().toISOString() });
      if (kind === "tool" || kind === "stderr") await this.drainBufferedEvents(input.state.id);
    };
  }

  private async bufferEvent(state: ProjectState, draft: ProjectEventDraft,
    trace?: Parameters<ProjectStorage["appendTraces"]>[1][number]): Promise<void> {
    if (this.#eventBatchFailures.has(state.id)) await this.drainBufferedEvents(state.id);
    // Keep only one writing batch and one bounded pending batch per project.
    // Producers wait at capacity instead of queueing an unbounded write tail.
    while ((this.#eventBatches.get(state.id)?.drafts.length ?? 0) >= 128) await this.drainBufferedEvents(state.id);
    let batch = this.#eventBatches.get(state.id);
    if (!batch) {
      batch = { state, drafts: [], traces: [] };
      this.#eventBatches.set(state.id, batch);
      this.armEventBatch(state.id, batch, 1000);
    } else if (!batch.timer && !this.#eventFlushes.has(state.id)) {
      this.armEventBatch(state.id, batch, 1000);
    }
    batch.drafts.push(structuredClone(draft));
    if (trace) batch.traces.push(trace);
    if (batch.drafts.length >= 128) await this.drainBufferedEvents(state.id);
  }

  private armEventBatch(projectId: string, batch: { timer?: ReturnType<typeof setTimeout> }, delayMs: number): void {
    batch.timer = setTimeout(() => {
      batch.timer = undefined;
      // Completion of the active write will flush this accumulated prefix.
      if (this.#eventFlushes.has(projectId) || this.#eventBatchFailures.has(projectId)) return;
      void this.flushBufferedEvents(projectId).catch(() => undefined);
    }, delayMs);
  }

  private flushBufferedEvents(projectId: string): Promise<void> {
    const active = this.#eventFlushes.get(projectId);
    if (active) return active;
    const batch = this.#eventBatches.get(projectId);
    if (!batch) return Promise.resolve();
    clearTimeout(batch.timer);
    this.#eventBatches.delete(projectId);
    const writing = this.enqueue(projectId, async () => {
      await this.storage.appendTraces(batch.state, batch.traces);
      // The audit log is durable before publication. Full recovery snapshots
      // are bounded separately; tools need not rewrite all project history.
      const checkpoint = Date.now() - (this.#checkpointAt.get(projectId) ?? -Infinity) >= 10_000;
      await this.storage.appendEvents(batch.state, batch.drafts, undefined, { checkpoint });
      if (checkpoint) {
        this.#checkpointAt.set(projectId, Date.now());
        this.#pendingCheckpoints.delete(projectId);
      } else this.#pendingCheckpoints.set(projectId, batch.state);
    });
    const completed = writing.catch(error => {
      if (!this.#eventBatchFailures.has(projectId)) this.#eventBatchFailures.set(projectId, error);
      throw error;
    }).finally(() => {
      if (this.#eventFlushes.get(projectId) === completed) this.#eventFlushes.delete(projectId);
      const pending = this.#eventBatches.get(projectId);
      if (pending && this.#eventBatchFailures.has(projectId)) {
        clearTimeout(pending.timer);
        pending.timer = undefined;
      }
      if (pending && !pending.timer && !this.#eventBatchFailures.has(projectId)) this.armEventBatch(projectId, pending, 0);
    });
    this.#eventFlushes.set(projectId, completed);
    return completed;
  }

  private async drainBufferedEvents(projectId: string): Promise<void> {
    try {
      if (this.#eventBatchFailures.has(projectId)) throw this.#eventBatchFailures.get(projectId);
      await this.#eventFlushes.get(projectId);
      await this.flushBufferedEvents(projectId);
      await this.#queues.get(projectId);
    } catch (error) {
      if (!this.#eventBatchFailures.has(projectId)) this.#eventBatchFailures.set(projectId, error);
    }
    if (this.#eventBatchFailures.has(projectId)) {
      const failure = this.#eventBatchFailures.get(projectId);
      this.#eventBatchFailures.delete(projectId);
      throw failure;
    }
  }

  private enqueue(projectId: string, task: () => Promise<void>): Promise<void> {
    const prior = this.#queues.get(projectId) ?? Promise.resolve();
    const next = prior.catch(() => undefined).then(task);
    this.#queues.set(projectId, next);
    const clear = () => {
      if (this.#queues.get(projectId) === next) this.#queues.delete(projectId);
    };
    // The caller owns the original rejection. A discarded finally promise
    // would create a second unhandled rejection even when the caller caught
    // the durable write failure, potentially exiting before lease cleanup.
    void next.then(clear, clear);
    return next;
  }

  private publishLiveHarnessEvent(
    projectId: string,
    agentId: string,
    value: Record<string, unknown>
  ): void {
    const event = value as unknown as HarnessEvent;
    const attempt = Number.isSafeInteger(event.attempt) ? event.attempt! : 0;
    if (
      (event.kind === "assistant.delta" || event.kind === "assistant.message") &&
      event.itemId && typeof event.message === "string"
    ) {
      const stream = {
        projectId,
        invocationId: event.invocationId,
        agent: agentId,
        harnessId: event.harnessId,
        attempt,
        itemId: event.itemId
      };
      if (event.kind === "assistant.delta") {
        this.storage.hub.appendAssistantDelta(stream, event.message);
      } else {
        this.storage.hub.completeAssistantMessage(stream, event.message);
      }
      return;
    }
    if (event.kind.startsWith("tool.") || event.kind === "reasoning.summary" || event.kind === "activity") {
      this.storage.hub.publishHarnessEvent(projectId, agentId, event);
    }
    if (event.kind === "tool.started" && event.parentItemId) {
      this.storage.hub.markAssistantProcess(
        projectId,
        event.invocationId,
        attempt,
        event.parentItemId
      );
    }
  }
}

export interface CollaborationRuntimeOptions {
  storage: ProjectStorage;
  serviceId?: string;
  hostId?: string;
  databasePath?: string;
  leaseDurationMs?: number;
  gitFactory?: CollaborationGitFacadeFactory;
  /** Production resolver keyed by the immutable account binding on a project. */
  credentialResolverForAccount?: (accountId: string) => GitHubCredentialResolver;
  residentLauncher?: CollaborationResidentLauncher;
  executionInputBuilder?: CollaborationExecutionInputBuilder;
  invocationDispatcher?: CollaborationInvocationDispatcher;
  validateWorkflowConfiguration?: (state: ProjectState, proposal: AgentOrchestrationProposal) => Promise<void>;
  /** OS service-account root, never a project-controlled directory. */
  serviceUserRoot?: string;
  /** Tests can supply a deterministic clock without weakening production. */
  now?: () => number;
  harnessRecoveryDelayMs?: (attempt: number) => number;
}

/**
 * Production owner of the collaboration writer lease and the bridge from the
 * authoritative SQLite state machine into the legacy ProjectState/SSE read
 * model. Execution scheduling is deliberately layered on this owner so no
 * Git-enabled workflow can accidentally fall through to the legacy runner.
 */
export class CollaborationRuntimeCoordinator implements CollaborationRuntimeLifecycle {
  readonly #storage: ProjectStorage;
  readonly #serviceId: string;
  readonly #hostId: string;
  readonly #databasePath: string;
  readonly #leaseDurationMs: number;
  readonly #gitFactory: CollaborationGitFacadeFactory;
  readonly #credentialResolverForAccount?: (accountId: string) => GitHubCredentialResolver;
  readonly #residentLauncher?: CollaborationResidentLauncher;
  readonly #executionInputBuilder?: CollaborationExecutionInputBuilder;
  readonly #validateWorkflowConfiguration?: CollaborationRuntimeOptions["validateWorkflowConfiguration"];
  readonly #invocationDispatcher?: CollaborationInvocationDispatcher;
  readonly #serviceUserRoot: string;
  readonly #now?: () => number;
  readonly #harnessRecoveryDelayMs: (attempt: number) => number;
  #database?: CollaborationStateDatabase;
  #leaseTimer?: NodeJS.Timeout;
  #leaseRenewal?: Promise<void>;
  #leaseWorker?: WriterLeaseHeartbeat;
  #leaseWorkerDiagnostics?: HeartbeatDiagnostics;
  #leaseFailedAt?: string;
  #leaseHeartbeat?: { intervalMs: number; scheduledAtMs: number; startedAtMs: number; delayMs: number };
  #leaseError?: Error;
  #closed = false;
  readonly #runs = new Map<string, Promise<void>>();
  readonly #workflowRecoveryTimers = new Map<string, NodeJS.Timeout>();
  readonly #git = new Map<string, CollaborationGitRuntime>();
  readonly #gitAccounts = new Map<string, ProjectGitAccountBinding>();
  readonly #repositories = new Map<string, GitHubRepositoryFact>();
  readonly #mainHeads = new Map<string, string>();
  readonly #branchHeads = new Map<string, string>();
  readonly #agentGitFacts = new Map<string, AgentGitFacts>();
  // Native transport input IDs are unique per submit. Keep the original
  // semantic management task while its same-session Agent repairs MCP facts.
  readonly #managementTaskInputs = new Map<string, string>();
  readonly #mergeQueues = new Map<string, Promise<void>>();
  readonly #controllers = new Map<string, AbortController>();
  readonly #residents = new Map<string, {
    projectId: string;
    execution?: MemberExecution;
    activity?: RuntimeActivityAuthority & { invocationId: string };
    observation?: TerminalPushObservationTurn;
    coordination?: TerminalPushCoordinatorTurn;
    handle: CollaborationResidentHandle;
  }>();
  #shuttingDown = false;
  readonly #pausedProjects = new Set<string>();
  readonly #cancellingProjects = new Set<string>();
  readonly #activeTurns = new Map<string, number>();
  readonly #nativeTaskTurns = new Map<string, { signal: AbortSignal; counted: boolean }>();
  readonly #activeResidentTurns = new Set<string>();
  readonly #turnIdleWaiters = new Map<string, Array<() => void>>();
  readonly #pauseWaiters = new Map<string, Array<() => void>>();
  readonly #locallyAcceptedMainRoutes = new Set<string>();
  readonly #projectionQueues = new Map<string, Promise<void>>();
  readonly #workflowAdjustmentQueues = new Map<string, Promise<void>>();
  readonly #workflowAdjustmentDeferredProjects = new Set<string>();
  /** Serializes lifecycle actions so Resume and Cancel have one linearization order. */
  readonly #lifecycleQueues = new Map<string, Promise<void>>();
  readonly #runsWithAcceptedContinuation = new WeakSet<Promise<void>>();
  /** In-process proof that S created an execution but no resident launch began. */
  readonly #prelaunchExecutions = new Set<string>();

  constructor(options: CollaborationRuntimeOptions) {
    this.#storage = options.storage;
    this.#serviceId = options.serviceId ?? "openfars-collaboration";
    this.#hostId = options.hostId ?? os.hostname();
    this.#databasePath = options.databasePath ?? path.join(
      path.dirname(options.storage.projectsDir()),
      "collaboration-state.sqlite"
    );
    this.#leaseDurationMs = options.leaseDurationMs ?? DEFAULT_LEASE_MS;
    this.#gitFactory = options.gitFactory ?? createCollaborationGitFacade;
    this.#credentialResolverForAccount = options.credentialResolverForAccount;
    this.#residentLauncher = options.residentLauncher;
    this.#executionInputBuilder = options.executionInputBuilder;
    this.#validateWorkflowConfiguration = options.validateWorkflowConfiguration;
    this.#harnessRecoveryDelayMs = options.harnessRecoveryDelayMs ?? harnessRecoveryDelayMs;
    this.#invocationDispatcher = options.invocationDispatcher;
    this.#serviceUserRoot = path.resolve(options.serviceUserRoot ?? os.homedir());
    this.#now = options.now;
  }

  async initialize(): Promise<void> {
    if (this.#database) return;
    if (this.#closed) throw new Error("Collaboration runtime is closed");
    await fs.mkdir(path.dirname(this.#databasePath), { recursive: true });
    this.#database = await openCollaborationStateWorker({
      databasePath: this.#databasePath,
      serviceId: this.#serviceId,
      hostId: this.#hostId,
      topology: "single-host",
      leaseDurationMs: this.#leaseDurationMs,
      ...(this.#now ? { now: this.#now } : {})
    }, error => this.loseWriterLease(error));
    this.#leaseWorkerDiagnostics = await this.#database.writerLeaseDiagnostics();
    try { await this.#storage.configureProjectStateStore(this.projectStateDocuments()); }
    catch (error) {
      try { await this.#database.relinquishWriterLease(); } catch { /* Preserve the source registration error. */ }
      await this.#database.close(); this.#database = undefined; throw error;
    }
    // The injected clock is a deterministic test scheduler. Production uses
    // an independent thread and a connection attached to this exact lease.
    if (this.#now) this.startControlledHeartbeat();
    else {
      try {
        this.#leaseWorker = await WriterLeaseHeartbeat.start({ databasePath: this.#databasePath,
          lease: await this.#database.writerLease(), leaseDurationMs: this.#leaseDurationMs }, async (error, diagnostics) => {
          this.#leaseWorkerDiagnostics = diagnostics;
          this.loseWriterLease(error);
        });
        await this.#database.bindWriterAvailabilityCheck(() => this.#leaseWorker!.assertHeld(), this.#leaseWorker.sharedState());
      } catch (error) {
        try { await this.#database.relinquishWriterLease(); } catch { /* Retain the startup failure. */ }
        await this.#database.close(); this.#database = undefined;
        throw error;
      }
    }
  }

  private startControlledHeartbeat(): void {
    const intervalMs = Math.max(500, Math.floor(this.#leaseDurationMs / 3));
    let scheduledAtMs = (this.#now?.() ?? Date.now()) + intervalMs;
    this.#leaseTimer = setInterval(() => {
      const database = this.#database;
      if (!database || this.#leaseError || this.#leaseRenewal) return;
      this.#leaseRenewal = (async () => {
        const startedAtMs = this.#now?.() ?? Date.now();
        this.#leaseHeartbeat = { intervalMs, scheduledAtMs, startedAtMs,
          delayMs: Math.max(0, startedAtMs - scheduledAtMs) };
        scheduledAtMs = startedAtMs + intervalMs;
        try {
          await database.renewWriterLease();
          this.#leaseWorkerDiagnostics = await database.writerLeaseDiagnostics();
        } catch (error) {
          const sqliteErrorCode = error && typeof error === "object" && "errcode" in error
            ? error.errcode : undefined;
          if (typeof sqliteErrorCode === "number" && (sqliteErrorCode & 0xff) === 5) {
            // A DELETE-journal reader can block COMMIT without taking ownership.
            // Retry at the next heartbeat only while the original lease is still
            // held. An expired or replaced writer must never reacquire here.
            try {
              if ((await database.writerLeaseDiagnostics()).lastRenewalAttempt?.transactionActive) {
                this.loseWriterLease(error);
                return;
              }
              await database.assertWriterLeaseHeld();
              try {
                console.warn("Collaboration writer lease renewal delayed; original lease still held",
                  this.writerLeaseFailureDiagnostics(error));
              } catch { /* Diagnostic sinks cannot change lease ownership. */ }
              return;
            } catch (leaseError) {
              // Keep the first SQLite failure even if confirming the lease
              // fails too. Report the fencing/check failure separately.
              this.loseWriterLease(error, leaseError);
              return;
            }
          }
          this.loseWriterLease(error);
        }
      })().finally(() => { this.#leaseRenewal = undefined; });
    }, intervalMs);
    this.#leaseTimer.unref();
  }


  projectStateDocuments(): ProjectStateDocumentStore {
    const source = { protocol: "project-state-v1" as const, kind: "sqlite" as const, databasePath: path.resolve(this.#databasePath) };
    const reader = readOnlyProjectStateDocuments(source);
    return { source, domain: async projectId => this.#database ? (await this.#database.projectStateDomain(projectId)) : (await reader.domain(projectId)),
      read: async (projectId, name) => this.#database ? (await this.#database.projectStateDocument(projectId, name)) : (await reader.read(projectId, name)),
      write: async (projectId, name, value, expectedVersion, publishView) => {
        this.assertWritable(); return await this.database().writeProjectStateDocument(projectId, name, value, expectedVersion, publishView);
      } };
  }

  async initializeNewProjectState(state: ProjectState): Promise<void> {
    this.assertWritable();
    await this.database().initializeProjectStateDomain({ projectId: state.id, scheduler: state.git?.enabled ? "git" : "serial", checkpoint: state,
      publishView: document => this.#storage.publishProjectStateView(document) });
  }

  async serialProjectStateEnabled(state: ProjectState): Promise<boolean> {
    return !state.git?.enabled && (await this.database().projectStateDomain(state.id))?.scheduler === "serial";
  }

  async requestSerialProjectState(state: ProjectState, identity: SerialProjectStateInvocation, request: unknown): Promise<unknown> {
    this.assertWritable();
    if (identity.projectId !== state.id || !(await this.serialProjectStateEnabled(state)))
      throw new CollaborationStateError("STATE_SCOPE_DENIED", "Serial state request belongs to another project or scheduler");
    return executeProjectStateRequest(this.database(), { kind: "agent", projectId: state.id,
      agentId: identity.agentId, invocationId: identity.invocationId }, request, { observePullRequest: async () => {
        throw new Error("Serial projects have no Git PR reconciliation authority");
      } });
  }

  /** Git checkpoints and workflow facts commit in SQLite. A reader can use
   * that committed state while a later trace prepares its filesystem view. */
  async committedProjectState(state: ProjectState): Promise<ProjectState | undefined> {
    if (!state.git?.enabled || !this.#database || state.phase === "storage-recovery-required") return;
    if ((await this.#database.projectStateDomain(state.id))?.scheduler !== "git") return;
    const document = await this.#database.projectStateDocument(state.id, "project.checkpoint");
    if (!document) throw new Error("Registered Git project has no committed checkpoint");
    return document.value as ProjectState;
  }

  async projectReadModel(state: ProjectState): Promise<ProjectState> {
    if (!this.#database) return structuredClone(state);
    if (state.phase === "storage-recovery-required") return structuredClone(state);
    if (this.writerLeaseHealth().status === "unavailable") return this.withWriterLeaseFailure(structuredClone(state));
    if (!state.git?.enabled) {
      const formal = await this.#database.projectStateDomain(state.id);
      if (!formal) return structuredClone(state);
      const projection = await this.#database.projectState(state.id);
      return { ...structuredClone(state), ...structuredClone(projection.formalState!.checkpoint.lifecycle), collaboration: {
        stateRevision: projection.stateRevision, frozen: projection.frozen, eventSeq: state.collaboration?.eventSeq ?? 0,
        routeOutbox: projection.routeOutbox, usage: projection.usage, businessState: projection.businessState, formalState: projection.formalState } };
    }
    const projection = await this.#database.getProjectState(state.id);
    if (!projection) return structuredClone(state);
    const projected = structuredClone(state);
    mergeProjection(projected, projection, projected.collaboration?.eventSeq ?? 0);
    projected.executionCounts!.main = (await this.#database.agentNativeInvocationCount(state.id, "main"));
    if (projected.runtime) {
      projected.status = projected.runtime.status;
      projected.phase = projected.runtime.phase;
      projected.currentAgent = projected.runtime.currentAgent;
      projected.activeInvocationId = projected.runtime.activeInvocationId;
      projected.queuedAgent = projected.runtime.status === "queued"
        ? projected.runtime.currentAgent
        : undefined;
    }
    if (!["completed", "cancelled"].includes(projected.status) &&
      (this.#leaseError || state.phase === "collaboration:failure-reporting-failed")) {
      if (this.#leaseError) return this.withWriterLeaseFailure(projected);
      projected.status = hasUserWorkflowPause(state) ? state.status : "retrying";
      projected.phase = state.phase;
      projected.lastError = state.lastError;
      if (projected.runtime) {
        projected.runtime.status = projected.status;
        projected.runtime.phase = projected.phase;
      }
    }
    return projected;
  }

  async queueReadModel(state: ProjectState): Promise<ProjectAgentQueueSource | undefined> {
    if (!state.git?.enabled || !this.#database) return;
    const lanes = await this.#database.laneAvailability(state.id);
    if (!lanes.length) return;
    const projection = await this.#database.projectSchedulingState(state.id);
    if (!projection) return;
    const runtime = deriveProjectRuntimeProjection(projection, state);
    if (this.writerLeaseHealth().status === "unavailable" && !["completed", "cancelled"].includes(runtime.status)) {
      const failed = this.withWriterLeaseFailure({ ...state, runtime });
      Object.assign(runtime, failed.runtime);
    } else if (state.phase === "collaboration:failure-reporting-failed" && !["completed", "cancelled"].includes(runtime.status))
      runtime.status = hasUserWorkflowPause(state) ? state.status : "retrying";
    const main = lanes.find(lane => lane.lane === "management");
    const worker = lanes.find(lane => lane.lane === "worker");
    return { state: {
      id: state.id, status: runtime.status, archivedAt: state.archivedAt, updatedAt: state.updatedAt,
      queueEnteredAt: state.queueEnteredAt, orchestration: projection.workflowSnapshot as AgentOrchestrationTemplate,
      activeNodeRunId: projection.activeNodeRunId, nodeRuns: projection.nodeRuns, groupRuns: projection.groupRuns,
      scopedGroupRuns: projection.scopedGroupRuns, scopedGroupIssues: projection.scopedGroupIssues, scopedArrivals: projection.scopedArrivals,
      executions: projection.executions, tasks: projection.tasks, runtime
    }, arrivalEnteredAt: projection.arrivalEnteredAt, capacities: { main: main?.capacity ?? 1, worker: worker?.capacity ?? 1 },
      occupied: { main: main?.occupied ?? 0, worker: worker?.occupied ?? 0 } };
  }

  async recoverSerialWorkflowConfiguration(state: ProjectState, options: { recoverResultBoundaries?: boolean } = {}): Promise<{ changed: boolean } | undefined> {
    if (state.git?.enabled) return undefined;
    this.assertWritable();
    if (options.recoverResultBoundaries !== false) await this.recoverSerialMainWorkflowBoundaries(state);
    return restoreSerialWorkflowConfiguration(this.database(), this.#storage, state, this.#validateWorkflowConfiguration);
  }

  async recoverSerialMainWorkflowBoundaries(state: ProjectState): Promise<void> {
    if (state.git?.enabled) return;
    this.assertWritable();
    const database = this.database();
    const pending: WorkflowAdjustmentRecord[] = [];
    for (const record of await this.pendingSerialMainWorkflowAdjustments(state)) {
      if (!await database.serialMainWorkflowBoundaryCommitted(state.id, record.requestId)) pending.push(record);
    }
    if (pending.length) {
      if (this.#storage.hasActiveInvocationCommit(state.id))
        throw new CollaborationStateError("INVALID_STATE_TRANSITION", "Original result recovery must finish before workflow boundary recovery");
      // Startup has already recovered incomplete original file transactions.
      // Only a surviving, exactly matching original completion is evidence;
      // a queued/paused state or a newly generated event cannot substitute.
      await this.#storage.replayEvents(state.id, 0, async event => {
        if (event.type !== "invocation.completed" || event.agent !== "main") return;
        const record = pending.find(candidate => candidate.source.kind === "main" && candidate.source.scope?.kind === "serial" &&
          candidate.source.invocationId === event.data?.invocationId && candidate.source.scope.agentExecutionId === event.data?.executionId &&
          candidate.source.scope.mainInvocationSeq === event.data?.mainInvocationSeq);
        if (record) await database.recordSerialMainWorkflowBoundary(state.id, record.requestId, event);
      });
    }
  }

  async prepareSerialMainWorkflowAdjustment(state: ProjectState): Promise<WorkflowAdjustmentContext["current"]> {
    return await this.prepareSerialWorkflowAdjustments(state);
  }

  async isSerialWorkflowConfigurationCurrent(state: ProjectState, version: WorkflowConfigurationVersion): Promise<boolean> {
    const current = !state.git?.enabled && (await this.database().serialWorkflowAdjustmentCurrent(state.id));
    return Boolean(current && sameWorkflowConfigurationVersion(current.version, version));
  }

  async prepareSerialWorkflowAdjustments(state: ProjectState): Promise<WorkflowAdjustmentContext["current"]> {
    this.assertWritable();
    if (state.git?.enabled || state.orchestration.schemaVersion === 3)
      throw new CollaborationStateError("INVALID_STATE_TRANSITION", "This workflow belongs to another scheduler");
    const database = this.database();
    if (!(await database.getProjectState(state.id))) await database.createProject({ projectId: state.id, workflowRevision: state.workflowRevision ?? 1,
      workflowSnapshot: state.orchestration, git: state.git ?? { enabled: false, status: "disabled" }, workerCapacity: 1, managementCapacity: 1,
      requestId: `serial-workflow-project:${state.id}`, ...(state.formalStateProtocol === "project-state-v1" ? {
        formalState: { checkpoint: state, publishView: document => this.#storage.publishProjectStateView(document) }
      } : {}) });
    if (!(await database.scopedConfiguration(state.id))) await database.initializeScopedConfiguration(state.id, this.workflowAdjustmentSeed(state));
    await database.initializeSerialWorkflowJournal(state.id);
    const current = (await database.serialWorkflowAdjustmentCurrent(state.id))!;
    if ((state.workflowRevision ?? 1) !== current.version.revision || !isDeepStrictEqual(current.snapshot,
      { orchestration: state.orchestration, ...this.workflowAdjustmentSeed(state) }))
      throw new CollaborationStateError("WORKFLOW_ADJUSTMENT_CONFLICT", "The original scheduler must read the current formal configuration before submitting");
    return current;
  }

  async getSerialMainWorkflowAdjustment(state: ProjectState, invocationId: string, callId: string): Promise<WorkflowAdjustmentRecord | undefined> {
    return await this.database().serialMainWorkflowAdjustment(state.id, invocationId, callId);
  }

  async recordSerialMainWorkflowBoundary(state: ProjectState, requestId: string, completion: TimelineEvent): Promise<void> {
    this.assertWritable();
    if (this.#storage.hasActiveInvocationCommit(state.id)) throw new CollaborationStateError("INVALID_STATE_TRANSITION", "SDK result transaction is not committed");
    await this.database().recordSerialMainWorkflowBoundary(state.id, requestId, completion);
  }

  async pendingSerialMainWorkflowAdjustments(state: ProjectState): Promise<WorkflowAdjustmentRecord[]> {
    return (await this.pendingSerialWorkflowAdjustments(state)).filter(record => record.source.kind === "main" && record.source.scope?.kind === "serial");
  }

  async pendingSerialWorkflowAdjustments(state: ProjectState): Promise<WorkflowAdjustmentRecord[]> {
    if (state.git?.enabled || !(await this.database().serialWorkflowAdjustmentCurrent(state.id))) return [];
    return (await this.database().activeWorkflowAdjustments(state.id)).filter(record => record.status === "pending");
  }

  async stageSerialMainWorkflowAdjustment(state: ProjectState, input: Pick<SerialMainWorkflowAdjustmentInput, "base" | "proposal" | "envelope">): Promise<WorkflowAdjustmentSubmissionResult> {
    this.assertWritable();
    const task = state.activeAgentExecution, envelope = input.envelope;
    if (state.git?.enabled || state.status !== "running" || state.currentAgent !== "main" || state.activeInvocationId !== envelope.invocationId ||
      !task?.startedAt || task.agent !== "main" || task.latestInvocationId !== envelope.invocationId)
      throw new CollaborationStateError("INVALID_STATE_TRANSITION", "Serial Main workflow acceptance requires its actual live original task");
    await this.database().assertRetainedWorkflowSessionHarnesses(state.id, input.proposal.agents, state);
    return await this.database().stageSerialMainWorkflowAdjustment({ ...structuredClone(input), projectId: state.id, agentExecutionId: task.id,
      mainInvocationSeq: state.mainInvocationSeq, ...(state.agentSessions?.main ? { session: state.agentSessions.main } : {}) });
  }

  async publishSerialMainWorkflowAdjustment(state: ProjectState, requestId: string, authority: SerialWorkflowPublicationAuthority): Promise<WorkflowAdjustmentRecord> {
    return this.publishSerialWorkflowAdjustment(state, requestId, authority);
  }

  async publishSerialWorkflowAdjustment(state: ProjectState, requestId: string, authority: SerialWorkflowPublicationAuthority): Promise<WorkflowAdjustmentRecord> {
    this.assertWritable();
    const database = this.database(), prepared = await database.prepareSerialWorkflowAdjustmentPublication(state.id, requestId);
    if (prepared.ready) {
      try {
        if (!this.#validateWorkflowConfiguration) throw new Error("Serial publication requires the existing resource validator");
        const proposal = structuredClone(prepared.record.proposal);
        proposal.agents = restoreAgentConfiguration(proposal, state.agents);
        await this.#validateWorkflowConfiguration(state, proposal);
      } catch (error) {
        await database.recordWorkflowAdjustmentWaiting({ projectId: state.id, requestId, reason: error instanceof Error ? error.message : "Workflow resource validation failed" });
        return (await database.workflowAdjustment(state.id, requestId))!;
      }
      await database.publishSerialWorkflowAdjustment(state.id, requestId, prepared.validationToken, { sessions: authority.sessions,
        waitingReason: record => this.#storage.hasActiveInvocationCommit(state.id)
          ? "等待原调用结果事务持久提交后再发布配置"
          : authority.waitingReason(record) });
    }
    const record = (await database.workflowAdjustment(state.id, requestId))!;
    if (record.status === "applied") await restoreSerialWorkflowConfiguration(database, this.#storage, state, this.#validateWorkflowConfiguration);
    return record;
  }

  async decorateSerialWorkflowNotifications(state: ProjectState, request: AgentRunRequest): Promise<void> {
    if (state.git?.enabled) return;
    this.assertWritable();
    const task = state.activeAgentExecution;
    if (!task?.startedAt || task.agent !== request.agent || task.latestInvocationId !== request.invocationId ||
      state.currentAgent !== request.agent || state.activeInvocationId !== request.invocationId)
      throw new CollaborationStateError("INVALID_STATE_TRANSITION", "Workflow notification requires the actual original running task");
    const context: SerialWorkflowNotificationContext = { projectId: state.id, agentId: request.agent, invocationId: request.invocationId,
      agentExecutionId: task.id, ...(request.kind === "main" ? { mainInvocationSeq: state.mainInvocationSeq } : {}) };
    if ((await this.serialProjectStateEnabled(state))) {
      const identity: SerialProjectStateInvocation = { projectId: state.id, agentId: request.agent,
        invocationId: request.invocationId, executionId: task.id, kind: request.kind === "main" ? "main" : "worker" };
      await this.database().bindSerialProjectStateInvocation(identity);
      request.onProjectStateRequest = async input => this.requestSerialProjectState(state, identity, input);
    }
    request.onPrepareWorkflowAdjustmentInput = async input => {
      this.assertWritable();
      if (state.activeAgentExecution?.id !== context.agentExecutionId || state.activeInvocationId !== context.invocationId ||
        state.currentAgent !== context.agentId || !["running", "pausing"].includes(state.status))
        throw new CollaborationStateError("INVALID_STATE_TRANSITION", "Original workflow input lost its live invocation authority");
      const notification = await this.database().prepareSerialWorkflowAdjustmentInput(context, input.inputId, input.expectedSession);
      if (!notification) return "";
      const details = await input.publishContext?.(workflowAdjustmentContextSources(notification.facts));
      return `${notification.text}${details ? `\n\n${details}` : ""}`;
    };
    request.onWorkflowAdjustmentInputReceived = async (event, session, inputId) => {
      this.assertWritable();
      await this.database().confirmSerialWorkflowAdjustmentInput(context, inputId, session, event);
    };
  }

  async recoverProject(state: ProjectState): Promise<boolean> {
    if (!state.git?.enabled) return false;
    this.#storage.trackCheckpoint(state);
    const savedProjectPause = hasUserWorkflowPause(state);
    if (["paused", "pausing"].includes(state.status) && !savedProjectPause) state.status = "retrying";
    const database = this.database();
    if (this.#credentialResolverForAccount) {
      if (!state.git.account) {
        if ((await database.getProjectState(state.id))) {
          await this.appendFailureAttempt(state, {
            scope: "git",
            operation: "project.recovery.authorization",
            error: new Error("Historical Git project has no bound GitHub account"),
            errorCode: "GITHUB_ACCOUNT_REQUIRED",
            retryable: true,
            metadata: { phase: state.phase }
          });
        }
        state.status = "retrying";
        state.phase = "git:waiting_for_github";
        state.git.status = "waiting_for_github";
        state.lastError = "该历史 Git 项目尚未绑定 GitHub 账号；不会自动使用服务器账号";
        await this.saveState(state);
        return true;
      }
      this.#gitAccounts.set(state.id, state.git.account);
    }
    if (state.status === "interrupted" && state.phase === "collaboration:repair-required") {
      this.assertWritable();
      this.clearWorkflowRecoveryTimer(state.id);
      return true; // Retain the repair gate after restoring the bound account for explicit Resume.
    }
    const restoredProjection = await database.getProjectState(state.id);
    if (!restoredProjection) {
      // A file state without its authoritative SQLite row must never resume a
      // Git workflow. Preserve it for an operator-visible, idempotent retry.
      state.status = "retrying";
      state.phase = "collaboration:state-missing";
      state.lastError = "Collaboration state is missing; workflow was not started";
      await this.saveState(state);
      return true;
    }
    for (const node of restoredProjection.nodeRuns.filter(node => node.status === "completed")) {
      const attempt = await database.latestMainRouteAttempt(state.id, node.id);
      if (!attempt?.coordinatorEpoch) continue;
      const response = await database.eventByRequestId(state.id, `main-route-response-${node.id}-${attempt.coordinatorEpoch}`);
      if (response?.type === "main.route.response.committed" && typeof response.payload.inputId === "string" &&
        (await this.mainRouteTaskCompleted(state.id, node.id, attempt.coordinatorEpoch, response.payload.inputId))) {
        await this.resolveMainRouteFailures(state, node.id, attempt.coordinatorEpoch, response.invocationId);
      }
    }
    const projection = await database.projectState(state.id);
    await this.publishProjection(state, projection);
    const activeNode = projection.activeNodeRunId
      ? projection.nodeRuns.find((node) => node.id === projection.activeNodeRunId)
      : undefined;
    const activeGroup = projection.groupRuns.find((group) =>
      group.nodeRunId === projection.activeNodeRunId &&
      !["completed", "failed", "cancelled"].includes(group.status)
    );
    const cancellationIntent = await database.projectCancellationIntent(state.id);
    const resumableCancellation = await database.resumableProjectCancellationIntent(state.id);
    if (state.status === "completed") {
      await this.saveState(state);
      return true;
    }
    if (state.status === "cancelled" || activeNode?.status === "cancelled" ||
      (cancellationIntent && !resumableCancellation && (
        projection.activeNodeRunId === undefined ||
        projection.nodeRuns.some((node) => node.status === "cancelled") ||
        projection.groupRuns.some((group) => group.status === "cancelled")
      ))) {
      state.status = "cancelled";
      state.phase = "cancelled";
      await this.saveState(state);
      return true;
    }
    // Durable cancellation intent outranks every scheduler path. A restart
    // between stop request and native stop proof must reconcile the old
    // process first. Once the proof is durable, remain paused until an
    // explicit resume; never re-enter the active collaboration node here.
    if (resumableCancellation) {
      const stopped = await database.eventByRequestId(state.id,
        `project-stop-confirmed:${state.id}:${resumableCancellation.seq}`);
      if (stopped?.type === "project.cancellation.stop_confirmed" &&
        stopped.payload.requestedEventSeq === resumableCancellation.seq) {
        // S already confirmed every exact native writer stopped for this
        // still-current user intent. Restore the retained pause; do not run
        // the completed Stop lifecycle again on each service restart.
        this.#pausedProjects.add(state.id);
        state.status = "paused";
        state.phase = "collaboration:user-cancelled";
        await this.saveState(state);
        return true;
      }
      state.status = "cancelling";
      state.phase = "collaboration:cancelling";
      await this.saveState(state);
      await this.cancelProject(state, {
        actor: state.cancelledBy === "system" ? "system" : "user",
        reason: state.cancelReason ?? "user_cancelled"
      });
      this.#pausedProjects.add(state.id);
      return true;
    }
    if (state.status === "cancelling" || cancellationIntent ||
      activeGroup?.cancellationRequested === true) {
      state.status = "cancelling";
      state.phase = "collaboration:cancelling";
      await this.saveState(state);
      await this.cancelProject(state, {
        actor: state.cancelledBy === "system" ? "system" : "user",
        reason: state.cancelReason ?? "user_cancelled"
      });
      return true;
    }
    if (state.pauseRequest) {
      // Preserve the user's lifecycle intent before any provider refresh or
      // native recovery. A restart is not evidence of an old safe point:
      // leave an unconfirmed request visibly pending, retaining all Agent
      // work/session/journal facts until an explicit Resume or Stop.
      this.#pausedProjects.add(state.id);
      state.status = state.pauseRequest.settledAt ? "paused" : "pausing";
      state.phase = state.pauseRequest.settledAt
        ? "collaboration:user-paused" : "collaboration:user-pause-recovery-required";
      await this.publishProjection(state, (await database.projectState(state.id)));
      return true;
    }
    if (activeGroup?.status === "paused" &&
      activeGroup.pauseReason?.startsWith("all_members")) {
      state.status = "retrying";
      state.phase = activeGroup.pauseReason.includes("exhausted")
        ? "collaboration:all-members-recovering"
        : activeGroup.pauseReason.includes("retryable")
          ? "collaboration:all-members-retryable"
          : "collaboration:all-members-failed";
      state.lastError = undefined;
      await this.saveState(state);
      return true;
    }
    const receiptResponse = state.phase === "user-intervention-required" && state.userIntervention?.status === "pending"
      ? (await database.terminalPushCoordinationIncidents(state.id)).find(incident =>
        incident.userResponse?.interventionId === state.userIntervention!.id &&
        incident.userResponse.managerInvocationId === state.userIntervention!.requestedInvocationId)?.userResponse
      : undefined;
    if (receiptResponse) {
      // The actual user answer is an explicit continuation authorization.
      // Restore it before the generic saved-pause return; explicit Pause and
      // Stop requests above still preserve their scene without dispatch.
      state.userIntervention = { ...state.userIntervention!, status: "answered",
        response: receiptResponse.response, answeredAt: receiptResponse.answeredAt };
      state.status = "queued";
      state.phase = "collaboration:user-response";
      await this.saveState(state);
      this.#pausedProjects.delete(state.id);
    }
    if (savedProjectPause && !receiptResponse) {
      // Only a saved user Pause/Stop withdraws authorization to run.
      // Technical waits retain their scene and recover automatically.
      this.#pausedProjects.add(state.id);
      state.status = "paused";
      await this.saveState(state);
      return true;
    }
    if (projection.frozen) {
      state.status = "retrying";
      state.phase = projection.freezeReason?.includes("waiting_user")
        ? "collaboration:main-recovery-waiting"
        : "collaboration:main-recovery-retryable";
      state.lastError = "Main authority is frozen pending process and state reconciliation";
      await this.saveState(state);
      // A retained technical freeze is retried automatically after backoff.
      try {
        await this.withProjectLifecycle(state.id, async () => this.resumeProjectLocked(state));
      } catch (error) {
        if (!(error instanceof GitHubAuthorizationError)) throw error;
        await this.recordProjectRecoveryFailure(state, error);
      }
      return true;
    }
    if (projection.git.status !== "ready") {
      state.status = "retrying";
      state.phase = `git:${projection.git.status}`;
      state.lastError = projection.git.initialization?.error
        ? safeRuntimeError(projection.git.initialization.error)
        : undefined;
      await this.saveState(state);
    } else if (state.phase.startsWith("git:") || state.phase === "collaboration:state-missing") {
      state.status = "queued";
      state.phase = "collaboration:ready";
      state.lastError = undefined;
      await this.saveState(state);
    }
    if (projection.git.status === "ready") {
      const durableUserPause = state.status === "paused" && (
        state.phase === "collaboration:user-paused" ||
        state.phase === "user-intervention-required" ||
        state.phase.startsWith("collaboration:all-members-")
      );
      if (durableUserPause) return true;
      if (state.status === "retrying" && state.workflowRecovery?.pending) {
        await this.saveState(state);
        return true;
      }
      if (state.status === "paused" || state.status === "retrying") {
        state.status = "queued";
        state.phase = "collaboration:recovering";
        await this.saveState(state);
      }
      try {
        await this.refreshMainHeadFromRemote(state);
      } catch (error) {
        await this.recordProjectRecoveryFailure(state, error);
        return true;
      }
      this.scheduleProject(state);
    }
    return true;
  }

  private async recordProjectRecoveryFailure(state: ProjectState, error: unknown): Promise<void> {
    // Provider failures belong to the retained project, including a frozen
    // Main's recovery. A lost writer must still fail the service.
    this.assertWritable();
    await this.appendFailureAttempt(state, {
      scope: "git", operation: "project.recovery.remote-ref", error,
      metadata: { targetBranch: "main", remoteRefConfirmed: false,
        phase: state.phase, projectStatus: state.status }
    });
    await this.publishProjection(state, (await this.database().projectState(state.id)));
    if (await this.cancellationIsDurable(state.id)) return;
    const failure = classifyDurableFailure(error, {});
    state.status = failure.retryable ? "retrying" : "interrupted";
    state.phase = failure.retryable ? "collaboration:recovering" : "collaboration:repair-required";
    if (!failure.retryable) { finishWorkflowRecovery(state); this.clearWorkflowRecoveryTimer(state.id); }
    state.lastError = safeRuntimeError(error);
    await this.saveState(state);
  }

  async createProject(state: ProjectState, input: ProjectGitInput): Promise<void> {
    if (this.#credentialResolverForAccount) {
      if (!state.git?.account || input.accountId !== state.git.account.id) {
        throw new GitHubAuthorizationError(401, "Git 项目没有有效的 GitHub 账号绑定");
      }
      this.#gitAccounts.set(state.id, state.git.account);
    }
    return this.withProjectLifecycle(state.id, async () => this.createProjectLocked(state));
  }

  private async createProjectLocked(state: ProjectState): Promise<void> {
    const database = this.database();
    if (!state.git?.enabled || !state.git.initialization) {
      throw new Error("Git collaboration state was not initialized by the orchestrator");
    }
    if (!(await database.getProjectState(state.id))) {
      await database.createProject({
        projectId: state.id,
        workflowRevision: state.workflowRevision ?? 1,
        // Agent configs contain server-only Gateway credentials. The workflow
        // topology is the complete credential-free scheduling snapshot.
        workflowSnapshot: state.orchestration,
        git: state.git,
        workerCapacity: state.orchestration.schemaVersion === 3
          ? scopedWorkerCapacity(state.orchestration.scopedWorkflow)
          : Math.max(
              1,
              ...(state.orchestration.collaborations ?? []).map((group) => group.memberAgentIds.length)
            ),
        managementCapacity: 1,
        requestId: `create-${state.id}`,
        ...(state.formalStateProtocol === "project-state-v1" ? {
          formalState: { checkpoint: state, publishView: document => this.#storage.publishProjectStateView(document) }
        } : {})
      });
    }
    await this.runInitialization(state);
  }

  async retryInitialization(state: ProjectState): Promise<void> {
    if (this.#credentialResolverForAccount && state.git?.account) {
      this.#gitAccounts.set(state.id, state.git.account);
      this.#git.delete(state.id);
    }
    return this.withProjectLifecycle(state.id, async () => this.retryInitializationLocked(state));
  }

  private async retryInitializationLocked(state: ProjectState): Promise<void> {
    await this.assertDurableResumeAllowed(state.id);
    const projection = await this.database().getProjectState(state.id);
    if (!projection?.git.enabled || projection.git.status === "ready") {
      throw new Error("Project does not have a retryable Git initialization");
    }
    const operationId = projection.git.initialization?.operationId ?? `git-init-${state.id}`;
    const attempt = (projection.git.initialization?.attempt ?? 0) + 1;
    const retryId = `git-retry:${operationId}:${attempt}`;
    const authority = this.gitRetrySchedulingAuthority(state);
    const accepted = await this.appendGitRetrySchedulingMilestone(state, {
      retryId,
      operationId,
      attempt,
      milestone: "retryAcceptedAt",
      authority,
      waitingFor: {
        kind: "git-initialization",
        objectId: `${operationId}@${attempt}`,
        reason: "Waiting for the accepted Git initialization retry to persist ready state",
        deadlineAt: null
      }
    });
    state.git = projection.git;
    await this.runInitialization(state, attempt, {
      retryId,
      operationId,
      attempt,
      authority,
      retryAcceptedAt: accepted.at
    });
  }

  private workflowAdjustmentSeed(state: ProjectState) {
    return credentialFreeAgentConfiguration({ agents: state.agents,
      skillDefinitions: state.skillDefinitions ?? {}, mcpDefinitions: state.mcpDefinitions ?? {} });
  }

  private workflowAdjustmentConstraints(state: ProjectState): WorkflowAdjustmentContext["constraints"] {
    const agentHarnesses: NonNullable<WorkflowAdjustmentContext["constraints"]>["agentHarnesses"] = {};
    for (const [id, config] of Object.entries(state.agents)) {
      const harnesses = boundWorkflowHarnesses(state, id);
      if (!harnesses.length) continue;
      const configured = config.harness ?? DEFAULT_HARNESS_ID;
      agentHarnesses[id] = { harnessId: harnesses.includes(configured) ? configured : harnesses[0]!,
        reason: harnesses.length > 1 ? `此 Agent 保留多个原 Harness 绑定（${harnesses.join("、")}）；不能替换原 Session，须显式新建不同名称的 Agent 实体。`
          : "此 Agent 已有原生会话，须保留原 Harness；更换需显式新建不同名称的 Agent 实体；原会话继续保留。" };
    }
    return Object.keys(agentHarnesses).length ? { agentHarnesses } : undefined;
  }

  async workflowReplayConfigurationHistory(state: ProjectState): Promise<WorkflowReplayConfigurationHistory> {
    return await this.database().workflowReplayConfigurationHistory(state.id);
  }

  async getWorkflowAdjustments(state: ProjectState): Promise<WorkflowAdjustmentContext> {
    return await this.database().workflowAdjustmentContext(state.id, this.workflowAdjustmentSeed(state), this.workflowAdjustmentConstraints(state));
  }

  async getWorkflowAdjustmentSubmissionResult(state: ProjectState, requestId: string, replay: boolean): Promise<WorkflowAdjustmentSubmissionResult> {
    const database = this.database(), record = await database.workflowAdjustment(state.id, requestId, this.workflowAdjustmentSeed(state));
    if (!record) throw new CollaborationStateError("RECORD_NOT_FOUND", "Accepted workflow adjustment does not exist");
    return { record, revision: (await database.projectState(state.id)).stateRevision, replay };
  }

  async queryWorkflowAdjustments(state: ProjectState, ifNoneMatch?: string): Promise<WorkflowAdjustmentQueryResult> {
    return await this.database().workflowAdjustmentQuery(state.id, this.workflowAdjustmentSeed(state), ifNoneMatch, this.workflowAdjustmentConstraints(state));
  }

  async getWorkflowAdjustmentPage(state: ProjectState, input: WorkflowAdjustmentPageInput, ifNoneMatch?: string): Promise<WorkflowAdjustmentPageResult> {
    return await this.database().workflowAdjustmentPage(state.id, input, this.workflowAdjustmentSeed(state), ifNoneMatch, this.workflowAdjustmentConstraints(state));
  }

  async getWorkflowAdjustmentDetail(state: ProjectState, requestId: string, expectedVersion?: string): Promise<WorkflowAdjustmentDetail> {
    return await this.database().workflowAdjustmentDetail(state.id, requestId, expectedVersion, this.workflowAdjustmentSeed(state), this.workflowAdjustmentConstraints(state));
  }

  async submitWorkflowAdjustment(state: ProjectState, raw: unknown): Promise<WorkflowAdjustmentSubmissionResult> {
    const input = structuredClone(workflowAdjustmentSubmissionEnvelopeSchema.parse(raw)) as SubmitUserWorkflowAdjustmentInput;
    if (input.projectId !== state.id) throw new CollaborationStateError("INVALID_STATE_TRANSITION", "Workflow adjustment project identity does not match");
    if (!state.git?.enabled && !(await this.database().serialWorkflowAdjustmentCurrent(state.id)))
      throw new CollaborationStateError("INVALID_STATE_TRANSITION", "Workflow adjustments require registration by the original scheduler");
    const prepared = await this.database().prepareUserWorkflowAdjustment(input, this.workflowAdjustmentSeed(state));
    if (prepared.replay) return prepared.result;
    if (!state.git?.enabled && prepared.proposal.orchestration.schemaVersion === 3)
      throw new CollaborationStateError("UNSAFE_CONFIGURATION", "This project must retain its original scheduler");
    if (["completed", "cancelled", "archived", "archiving", "cancelling"].includes(state.status) || (await this.database().projectCancellationIntent(state.id)))
      throw new CollaborationStateError("INVALID_STATE_TRANSITION", "This project no longer accepts new workflow adjustments");
    if (!this.#validateWorkflowConfiguration) throw new CollaborationStateError("UNSAFE_CONFIGURATION", "Workflow adjustments require the existing server configuration validator");
    // Resource validation may enrich only this disposable copy with private
    // Gateway facts; the original public request and proof remain unchanged.
    const proposal = structuredClone(prepared.proposal);
    proposal.agents = restoreAgentConfiguration(proposal, state.agents);
    try {
      await this.assertSessionCompatibleWorkflow(state, prepared.proposal.orchestration, prepared.proposal.agents);
      await this.#validateWorkflowConfiguration(state, proposal);
      await this.assertSessionCompatibleWorkflow(state, prepared.proposal.orchestration, prepared.proposal.agents);
    } catch (error) {
      if (error instanceof ZodError || error instanceof CollaborationStateError) throw error;
      throw new CollaborationStateError("UNSAFE_CONFIGURATION", error instanceof Error ? error.message : "Invalid workflow configuration", {}, { cause: error });
    }
    if (["completed", "cancelled", "archived", "archiving", "cancelling"].includes(state.status) || (await this.database().projectCancellationIntent(state.id)))
      throw new CollaborationStateError("INVALID_STATE_TRANSITION", "This project no longer accepts new workflow adjustments");
    const result = await this.database().submitUserWorkflowAdjustment(input, this.workflowAdjustmentSeed(state));
    if (!state.git?.enabled) return result;
    await this.publishProjection(state, (await this.database().projectState(state.id)));
    await this.applyWaitingWorkflowAdjustments(state);
    return { ...result, revision: (await this.database().projectState(state.id)).stateRevision,
      record: (await this.database().workflowAdjustment(state.id, input.requestId, this.workflowAdjustmentSeed(state)))! };
  }

  async withdrawWorkflowAdjustment(state: ProjectState, raw: unknown): Promise<WorkflowAdjustmentWithdrawalResult> {
    const input = withdrawWorkflowAdjustmentSchema.parse(raw);
    if (input.projectId !== state.id) throw new CollaborationStateError("INVALID_STATE_TRANSITION", "Workflow withdrawal project identity does not match");
    if (!state.git?.enabled && !(await this.database().serialWorkflowAdjustmentCurrent(state.id)))
      throw new CollaborationStateError("INVALID_STATE_TRANSITION", "Workflow withdrawal requires registration by the original scheduler");
    const result = await this.database().withdrawWorkflowAdjustment(input);
    if (state.git?.enabled) {
      if (!result.replay && result.withdrawn) await this.publishProjection(state, (await this.database().projectState(state.id)));
      if (result.withdrawn) await this.resumeWorkflowAdjustmentDispatch(state);
    }
    return result;
  }

  /** A configuration queue never wakes Main. These calls run at an existing
   * dispatch/completion boundary, or apply an already idle user submission. */
  async applyWaitingWorkflowAdjustments(state: ProjectState): Promise<void> {
    const prior = this.#workflowAdjustmentQueues.get(state.id) ?? Promise.resolve();
    const queued = prior.catch(() => undefined).then(async () => {
      if (!(await this.canApplyWorkflowAdjustment(state))) return;
      const record = (await this.database().activeWorkflowAdjustments(state.id, this.workflowAdjustmentSeed(state), "user")).find(item => item.source.kind === "user" &&
        (item.status === "pending" || item.status === "needs_resubmission"));
      if (!record) return;
      const prepared = await this.database().prepareUserWorkflowAdjustmentPublication(state.id, record.requestId);
      if (prepared.ready) {
        const proposal = structuredClone(prepared.record.proposal);
        proposal.agents = restoreAgentConfiguration(proposal, state.agents);
        try {
          if (!this.#validateWorkflowConfiguration) throw new Error("Workflow adjustments require the existing server configuration validator");
          await this.assertSessionCompatibleWorkflow(state, proposal.orchestration, proposal.agents);
          await this.#validateWorkflowConfiguration(state, proposal);
          if (!(await this.canApplyWorkflowAdjustment(state))) return;
          await this.assertSessionCompatibleWorkflow(state, prepared.record.proposal.orchestration, prepared.record.proposal.agents);
        } catch (error) {
          await this.database().recordWorkflowAdjustmentWaiting({ projectId: state.id, requestId: record.requestId,
            reason: `等待运行配置重新校验通过：${safeRuntimeError(error)}` });
          await this.publishProjection(state, (await this.database().projectState(state.id)));
          return;
        }
        if (!(await this.canApplyWorkflowAdjustment(state))) return;
        await this.database().publishUserWorkflowAdjustment(state.id, record.requestId, prepared.validationToken, state);
      }
      await this.publishProjection(state, (await this.database().projectState(state.id)));
      await this.resumeWorkflowAdjustmentDispatch(state);
    });
    this.#workflowAdjustmentQueues.set(state.id, queued);
    try { await queued; }
    finally { if (this.#workflowAdjustmentQueues.get(state.id) === queued) this.#workflowAdjustmentQueues.delete(state.id); }
  }

  private async canApplyWorkflowAdjustment(state: ProjectState): Promise<boolean> {
    return !this.#shuttingDown && !state.pauseRequest && !["paused", "completed", "cancelled", "archived", "archiving", "cancelling"].includes(state.status) &&
      !this.#cancellingProjects.has(state.id) && !(await this.database().projectCancellationIntent(state.id));
  }

  private async resumeWorkflowAdjustmentDispatch(state: ProjectState): Promise<void> {
    if (!this.#workflowAdjustmentDeferredProjects.has(state.id) || !(await this.canApplyWorkflowAdjustment(state)) ||
      (await this.database().activeWorkflowAdjustments(state.id, this.workflowAdjustmentSeed(state), "user")).some(record => record.source.kind === "user" && record.status === "pending")) return;
    this.#workflowAdjustmentDeferredProjects.delete(state.id);
    // Only the original dispatch that actually yielded is resumed. There is
    // no new model turn merely to announce a queue event.
    this.scheduleProjectAfterSettlingRun(state);
  }

  async assertWorkflowRevisionEditable(
    state: ProjectState,
    affectedGroupIds: string[]
  ): Promise<void> {
    this.assertWritable();
    if (!state.git?.enabled) {
      throw new Error("Workflow revisions require Git collaboration");
    }
    await this.database().assertWorkflowRevisionEditable(state.id, affectedGroupIds);
  }

  async saveWorkflowRevision(state: ProjectState, input: {
    orchestration: AgentOrchestrationTemplate;
    affectedGroupIds: string[];
    requestId?: string;
    requestContext?: {
      kind: "collaboration.rename" | "collaboration.dissolve";
      subjectId: string;
    };
  }): Promise<number> {
    this.assertWritable();
    if (!state.git?.enabled) {
      throw new Error("Workflow revisions require Git collaboration");
    }
    await this.assertSessionCompatibleWorkflow(state, input.orchestration);
    const database = this.database();
    const projection = await database.projectState(state.id);
    if (isDeepStrictEqual(projection.workflowSnapshot, input.orchestration)) {
      await this.publishProjection(state, projection);
      return projection.workflowRevision;
    }
    const workflowRevision = projection.workflowRevision + 1;
    await database.saveWorkflowRevision({
      projectId: state.id,
      workflowRevision,
      snapshot: input.orchestration,
      affectedGroupIds: input.affectedGroupIds,
      ...(input.requestId ? { requestId: input.requestId } : {}),
      ...(input.requestContext ? { requestContext: input.requestContext } : {})
    });
    await this.publishProjection(state, (await database.projectState(state.id)));
    return workflowRevision;
  }

  async isWorkflowRevisionRequestRecorded(state: ProjectState, input: {
    requestId: string;
    kind: "collaboration.rename" | "collaboration.dissolve";
    subjectId: string;
  }): Promise<boolean> {
    const prior = await this.database().eventByRequestId(state.id, input.requestId);
    if (!prior) return false;
    if (
      prior.type !== "workflow.revision.created" ||
      prior.payload.requestKind !== input.kind ||
      prior.payload.requestSubjectId !== input.subjectId
    ) {
      throw new Error(`Workflow requestId ${input.requestId} was already used by another mutation`);
    }
    return true;
  }

  async laneAvailability(projectId: string) {
    return await this.database().laneAvailability(projectId);
  }

  async pauseProject(state: ProjectState): Promise<void> {
    return this.withProjectLifecycle(state.id, async () => this.pauseProjectLocked(state));
  }

  private async pauseProjectLocked(state: ProjectState): Promise<void> {
    this.assertWritable();
    if (this.#cancellingProjects.has(state.id)) {
      throw new CollaborationStateError("INVALID_STATE_TRANSITION", "Pause superseded by pending Stop; native stop still requires confirmation");
    }
    const durableStatus = await this.durableProjectStatus(state.id);
    if (durableStatus === "completed" || durableStatus === "cancelled" ||
      durableStatus === "cancelling") {
      throw new Error(`Cannot pause a ${durableStatus} project`);
    }
    if (state.pauseRequest && !state.pauseRequest.settledAt &&
      state.phase === "collaboration:user-pause-recovery-required") {
      throw new Error("Pending Pause recovery lacks the original native safe-point proof; explicitly Resume or Stop to reconcile it");
    }
    this.#pausedProjects.add(state.id);
    this.clearWorkflowRecoveryTimer(state.id);
    state.pauseRequest ??= { requestedAt: nowIso() };
    state.status = "pausing";
    state.phase = "collaboration:user-pausing";
    // This must be durable before awaiting a possibly long native turn. Do
    // not turn a lost HTTP response into lost user intent, or ask the system
    // to finish the Agent's business/Git work on its behalf.
    await this.saveState(state);
    await this.publishProjection(state, (await this.database().projectState(state.id)));
    // Pause is a safe-point operation. Never abort the resident lifetime
    // signal: ProcessHost interprets that as termination and the same PID
    // could not resume. New turns block at waitWhilePaused; an active turn is
    // allowed to finish before SIGSTOP/pause is requested.
    await this.waitForTurnIdleOrStopRequest(state.id);
    if (this.#cancellingProjects.has(state.id)) {
      // Release the lifecycle lane to the explicit Stop. Waking this waiter
      // is not an idle/Stop proof and must never settle the pending Pause.
      throw new CollaborationStateError("INVALID_STATE_TRANSITION", "Pause superseded by pending Stop; native stop still requires confirmation");
    }
    const residents = [...this.#residents.values()].filter((item) => item.projectId === state.id);
    await Promise.all(residents.map((item) => item.handle.pause()));
    await nativeBackgroundJobLifecycle(this.#storage.projectDir(state.id), "pause", () => this.assertWritable());
    state.pauseRequest.settledAt ??= nowIso();
    state.status = "paused";
    state.phase = "collaboration:user-paused";
    state.lastError = undefined;
    await this.publishProjection(state, (await this.database().projectState(state.id)));
    await this.saveState(state);
  }

  async resumeProject(state: ProjectState, options?: CollaborationProjectResumeOptions): Promise<void> {
    return await this.withProjectLifecycle(state.id, async () => {
      this.assertWritable();
      if (options?.preserveRecoveryBudget) {
        const database = this.database(), projection = await database.projectState(state.id);
        const node = projection.nodeRuns.find(node => node.id === projection.activeNodeRunId);
        const root = projection.scopedGroupRuns?.find(group => !group.parentGroupRunId && group.activationRequestId === node?.activationRequestId);
        if (!["paused", "retrying"].includes(state.status) || state.userIntervention?.status === "pending" || projection.frozen ||
          projection.git.status !== "ready" || node?.node.kind !== "collaboration" || !root ||
          ["completed", "failed", "cancelled"].includes(root.status)) {
          throw new Error("Cannot resume retained scoped recovery outside an unfinished, nonfrozen paused scope");
        }
        let scopedTurnActive = false;
        for (const execution of projection.scopedExecutions ?? []) {
          const turn = await database.scopedAgentTurn(state.id, execution.id, execution.ownershipEpoch);
          if (turn && turn.status !== "stopped") { scopedTurnActive = true; break; }
        }
        if ((await database.scopedLeaderTurns(state.id)).some(turn => turn.status === "active") || scopedTurnActive ||
          (await database.scopedFinalNativeTurns(state.id)).some(turn => turn.status !== "stopped") ||
          (await database.scopedWorktreeClosingTurns(state.id)).some(turn => turn.status !== "stopped")) {
          throw new Error("Cannot resume retained scoped recovery before every native stop is confirmed");
        }
      }
      if (["running", "queued"].includes(state.status) && !state.pauseRequest &&
        !this.#pausedProjects.has(state.id) && this.#runs.has(state.id)) {
        const projection = await this.database().projectSchedulingState(state.id);
        // An automatic continuation can win the race with the user's Resume
        // request. Joining that live run must not queue another management
        // turn or resume its native handle a second time.
        if (projection && !projection.frozen && projection.git.status === "ready") {
          this.assertWritable();
          return;
        }
      }
      await this.resumeProjectLocked(state, !options?.preserveRecoveryBudget, options?.preserveRecoveryBudget);
    });
  }

  private async resumeProjectLocked(state: ProjectState, explicitUserResume = false, preserveRecoveryBudget = false): Promise<void> {
    this.assertWritable();
    this.clearWorkflowRecoveryTimer(state.id);
    if (state.archivedAt) throw new Error("Cannot resume an archived project; unarchive it first");
    if (explicitUserResume) beginWorkflowRecovery(state, { renew: true });
    const renewScopedManagement = !preserveRecoveryBudget && (explicitUserResume || Boolean(state.workflowRecovery));
    const resumableCancellation = await this.database().resumableProjectCancellationIntent(state.id);
    if (resumableCancellation) {
      if (!(await this.database().projectState(state.id)).resumableCancellation?.stoppedAt ||
        await this.durableProjectStatus(state.id) !== "paused") {
        throw new Error("Cannot resume before native stop is confirmed");
      }
      await this.database().resumeProjectCancellation({ projectId: state.id, actorAgentId: "main" });
      if (renewScopedManagement) await this.authorizeScopedManagementResume(state, !explicitUserResume);
      state.pauseRequest = undefined;
      this.#pausedProjects.delete(state.id);
      for (const resolve of this.#pauseWaiters.get(state.id) ?? []) resolve();
      this.#pauseWaiters.delete(state.id);
      state.status = "queued";
      state.phase = "collaboration:resuming-user-cancelled";
      state.lastError = undefined;
      await this.publishProjection(state, (await this.database().projectState(state.id)));
      await this.saveState(state);
      if ((await this.database().projectState(state.id)).git.status === "ready") this.scheduleProject(state);
      return;
    }
    await this.assertDurableResumeAllowed(state.id);
    if (["cancelling", "cancelled"].includes(state.status) ||
      this.#cancellingProjects.has(state.id)) {
      throw new Error(`Cannot resume a ${state.status === "cancelled" ? "cancelled" : "cancelling"} project`);
    }
    if (state.pauseRequest) {
      // Only this explicit lifecycle entry withdraws the saved user request;
      // a failed later recovery still has the existing ownership/stop fence.
      state.pauseRequest = undefined;
      await this.saveState(state);
    }
    let projection = await this.database().projectState(state.id);
    if (projection.git.enabled && projection.git.status !== "ready") {
      // The public Resume action is also the recovery affordance rendered by
      // the existing UI. Reuse the persisted operation id and advance only
      // the attempt; never publish a fake queued state while Git is unready.
      await this.retryInitializationLocked(state);
      if ((await this.database().projectState(state.id)).git.status === "ready") {
        this.#pausedProjects.delete(state.id);
        for (const resolve of this.#pauseWaiters.get(state.id) ?? []) resolve();
        this.#pauseWaiters.delete(state.id);
      }
      return;
    }
    const allMembersFailed = projection.groupRuns.find((group) =>
      group.nodeRunId === projection.activeNodeRunId &&
      group.status === "paused" &&
      group.pauseReason?.startsWith("all_members")
    );
    if (allMembersFailed) {
      // User Resume reopens coordination, not a system-selected business
      // successor. Keep the existing task/PR/context and let the actual
      // Leader choose continuations with the existing assignment tools.
      await this.database().recoverAllMembers({
        projectId: state.id,
        groupRunId: allMembersFailed.id,
        coordinatorEpoch: allMembersFailed.coordinatorEpoch,
        requestId: `recover-members-coordinate-${allMembersFailed.id}-${allMembersFailed.coordinatorEpoch}-${projection.stateRevision}`
      });
      projection = (await this.database().projectState(state.id));
    }
    if (projection.frozen && projection.freezeReason?.startsWith("main_route_")) {
      const recovered = await this.recoverIndependentMainRoute(state, projection, explicitUserResume);
      if (!recovered.recovered) return;
      projection = (await this.database().projectState(state.id));
    } else if (projection.frozen) {
      const group = projection.groupRuns.find((item) =>
        item.nodeRunId === projection.activeNodeRunId &&
        !["completed", "failed", "cancelled"].includes(item.status)
      );
      if (!group) throw new Error("Frozen collaboration project has no recoverable active group");
      const priorProof = await this.database().coordinatorStopProof(
        state.id,
        group.id,
        group.coordinatorEpoch
      );
      const observation = priorProof
        ? {
            stopped: true,
            evidence: priorProof.payload.evidence as Readonly<Record<string, unknown>>,
            recovery: await this.database().residentRecoverySeed({
              projectId: state.id,
              scope: "group-leader",
              scopeId: group.id,
              stoppedEpoch: group.coordinatorEpoch
            })
          }
        : await this.#residentLauncher?.observeMainRecovery?.({
            state: structuredClone(state),
            groupRun: structuredClone(group),
            executionRuntimePath: this.leaderRuntimePath(state.id, group.id)
          });
      if (observation?.stopped === true && observation.recovery) {
        await this.persistResidentRecoverySeed(observation.recovery, {
          projectId: state.id,
          sourceNodeRunId: group.nodeRunId,
          scope: "group-leader",
          scopeId: group.id,
          agentId: group.actingCoordinatorId ?? group.leaderAgentId,
          harnessId: state.agents[group.actingCoordinatorId ?? group.leaderAgentId]!.harness,
          stoppedEpoch: group.coordinatorEpoch
        });
      }
      if (observation?.stopped === true && !priorProof) {
        await this.database().confirmCoordinatorStopped({
          projectId: state.id,
          groupRunId: group.id,
          coordinatorEpoch: group.coordinatorEpoch,
          evidence: observation.evidence ?? {},
          reason: "main_recovery",
          requestId: `main-stop-proof-${group.id}-${group.coordinatorEpoch}`
        });
      }
      const recovered = await this.database().recoverMain({
        projectId: state.id,
        groupRunId: group.id,
        priorProcessStopped: observation?.stopped === true,
        requestId: `recover-main-${group.id}-${group.coordinatorEpoch}-${projection.recoveryAttempts + 1}`
      });
      if (!recovered.recovered) {
        await this.appendFailureAttempt(state, {
          scope: "resident",
          operation: `group-coordinator.recovery:${group.id}`,
          error: new Error(recovered.waitingForUser
            ? "Group coordinator recovery requires user intervention"
            : "Group coordinator recovery could not yet prove safe ownership"),
          errorCode: recovered.waitingForUser
            ? "GROUP_COORDINATOR_RECOVERY_WAITING_USER"
            : "GROUP_COORDINATOR_RECOVERY_DEFERRED",
          retryable: !recovered.waitingForUser,
          agentId: group.actingCoordinatorId ?? group.leaderAgentId,
          nodeRunId: group.nodeRunId,
          groupRunId: group.id,
          coordinatorEpoch: group.coordinatorEpoch,
          metadata: { priorProcessStopped: observation?.stopped === true }
        });
        state.status = "retrying";
        state.phase = recovered.waitingForUser
          ? "collaboration:main-recovery-waiting"
          : "collaboration:main-recovery-retryable";
        await this.publishProjection(state, (await this.database().projectState(state.id)));
        await this.saveState(state);
        return;
      }
      await this.appendSuccessfulAttempt(state, {
        scope: "resident",
        operation: `group-coordinator.recovery:${group.id}`,
        message: "A later group coordinator recovery attempt succeeded",
        agentId: group.actingCoordinatorId ?? group.leaderAgentId,
        nodeRunId: group.nodeRunId,
        groupRunId: group.id,
        coordinatorEpoch: group.coordinatorEpoch
      });
      // The project-head counter is shared by the single active management
      // authority. A recovered group coordinator must not make a later,
      // independent weak-route failure appear to have exhausted its own
      // retry budget.
      await this.database().resetMainRouteRecovery({
        projectId: state.id,
        nodeRunId: group.nodeRunId
      });
      await this.publishProjection(state, (await this.database().projectState(state.id)));
    }
    projection = (await this.database().projectState(state.id));
    if (projection.git.status === "ready") {
      // Resume owns scheduling for both explicit user recovery and the
      // recoverProject frozen-Main path. Refresh the provider-authoritative
      // head here, after the freeze fence is cleared and before any route can
      // activate a group from a stale initialization commit.
      await this.refreshMainHeadFromRemote(state);
    }
    if (renewScopedManagement) await this.authorizeScopedManagementResume(state, !explicitUserResume);
    const residents = [...this.#residents.values()].filter((item) => item.projectId === state.id);
    await Promise.all(residents.filter(item => !item.handle.closed).map((item) => item.handle.resume()));
    await this.forgetStoppedResidents(state);
    await this.assertDurableResumeAllowed(state.id);
    if (["cancelling", "cancelled"].includes(state.status) ||
      this.#cancellingProjects.has(state.id)) {
      throw new Error(`Cannot resume a ${state.status === "cancelled" ? "cancelled" : "cancelling"} project`);
    }
    this.#pausedProjects.delete(state.id);
    for (const resolve of this.#pauseWaiters.get(state.id) ?? []) resolve();
    this.#pauseWaiters.delete(state.id);
    state.status = "queued";
    state.phase = "collaboration:recovering";
    state.lastError = undefined;
    await this.saveState(state);
    this.scheduleProjectAfterSettlingRun(
      state,
      async () => this.assertDurableResumeAllowed(state.id)
    );
  }

  private async authorizeScopedManagementResume(state: ProjectState, automaticRecovery = false): Promise<void> {
    const projection = await this.database().projectState(state.id);
    const node = projection.nodeRuns.find(node => node.id === projection.activeNodeRunId);
    if (!node || node.node.kind !== "collaboration" || !projection.scopedGroupRuns?.some(group =>
      !group.parentGroupRunId && group.activationRequestId === node.activationRequestId)) return;
    await this.database().resumeScopedManagementRepairs({ projectId: state.id, nodeRunId: node.id,
      expectedRevision: projection.stateRevision, automaticRecovery });
    await this.publishProjection(state, (await this.database().projectState(state.id)));
  }

  async addProjectUserInput(
    state: ProjectState,
    input: CollaborationProjectUserInputRequest
  ): Promise<void> {
    return this.withProjectLifecycle(state.id, async () => this.addProjectUserInputLocked(state, input));
  }

  private async addProjectUserInputLocked(
    state: ProjectState,
    input: CollaborationProjectUserInputRequest
  ): Promise<void> {
    this.assertWritable();
    if (state.archivedAt) throw new Error("Cannot add user input to an archived project; unarchive it first");
    const durableStatus = await this.durableProjectStatus(state.id);
    if (durableStatus === "cancelled" || durableStatus === "cancelling") {
      throw new Error(`Cannot add user input to a ${durableStatus} project`);
    }
    const message = input.message.trim();
    if (!message) throw new Error("Project user input cannot be empty");
    if (["cancelled", "cancelling"].includes(state.status)) {
      throw new Error(`Cannot add user input to a ${state.status} project`);
    }
    const requestId = input.requestId?.trim();
    if (requestId) {
      const replay = state.userInputs.find((candidate) => candidate.requestId === requestId);
      if (replay) {
        if (replay.message !== message || replay.mode !== input.mode) {
          throw new Error("Project user input request id was reused with different content");
        }
        return;
      }
    }
    if (state.userInputs.filter((candidate) => candidate.status === "pending").length >= 100) {
      throw new Error("Project already has 100 pending user inputs");
    }
    // Revoke any in-flight Main terminal authority before the first durable
    // write. Otherwise a concurrent complete_project can commit while this
    // input is being queued, leaving a completed project with pending work.
    const runningFence = state.status === "running";
    if (runningFence) this.#pausedProjects.add(state.id);
    try {
      const reopensCompletedProject = state.status === "completed";
      if (reopensCompletedProject &&
        (state.cycle >= Number.MAX_SAFE_INTEGER ||
          state.completionGeneration >= Number.MAX_SAFE_INTEGER)) {
        throw new Error("Project continuation generation exhausted");
      }
      const inputId = requestId
        ? `inp_${createHash("sha256").update(`${state.id}\0${requestId}`).digest("hex").slice(0, 32)}`
        : newId("inp");
      const queued: ProjectUserInput = {
        id: inputId,
        status: "pending",
        createdAt: new Date().toISOString(),
        message,
        mode: input.mode,
        ...(requestId ? { requestId } : {}),
        targetMainInvocation: state.mainInvocationSeq + 1
      };
      await this.#storage.writeProjectUserInput(
        state,
        queued,
        [
          "# Project user input",
          "",
          `Input: ${queued.id}`,
          `Mode: ${queued.mode}`,
          "",
          boundedSharedText(message, 20_000),
          ""
        ].join("\n")
      );
      state.userInputs.push(queued);
      await this.database().appendEvent({
        projectId: state.id,
        eventId: `evt_user_input_${createHash("sha256").update(queued.id).digest("hex").slice(0, 32)}`,
        ...(requestId ? { requestId: `user-input-${requestId}` } : {}),
        workflowRevision: state.workflowRevision ?? 1,
        agentId: "main",
        type: "user.input.queued",
        payload: {
          inputId: queued.id,
          mode: queued.mode,
          preview: boundedSharedText(message, 240),
          reopened: reopensCompletedProject
        }
      });
      if (reopensCompletedProject) {
        state.status = "queued";
        state.phase = "collaboration:reopened";
        state.completedAt = undefined;
        state.lastError = undefined;
        state.cycle += 1;
        state.completionGeneration += 1;
      }
      await this.publishProjection(state, (await this.database().projectState(state.id)));
      await this.saveState(state);
      if (reopensCompletedProject) {
        this.scheduleProjectAfterSettlingRun(state);
      } else if (runningFence) {
        await this.pauseProjectLocked(state);
        await this.resumeProjectLocked(state);
      } else if (state.status === "retrying" && !state.userIntervention && canAutomaticallyRecoverWorkflow(state)) {
        beginWorkflowRecovery(state);
        await this.resumeProjectLocked(state);
      }
    } catch (error) {
      if (runningFence && !this.#cancellingProjects.has(state.id)) {
        // This lifecycle lane has not admitted another user's Pause. Any
        // pauseRequest here was generated solely for this input boundary.
        state.pauseRequest = undefined;
        this.#pausedProjects.delete(state.id);
        for (const resolve of this.#pauseWaiters.get(state.id) ?? []) resolve();
        this.#pauseWaiters.delete(state.id);
        if (!["completed", "cancelled", "cancelling"].includes(state.status)) {
          state.status = "retrying";
          state.phase = "collaboration:input-recovery";
          state.lastError = safeRuntimeError(error);
          try { await this.saveState(state); } catch { /* Retain the existing durable task if storage is unavailable. */ }
        }
      }
      throw error;
    }
  }

  async respondToUserIntervention(
    state: ProjectState,
    input: CollaborationUserInterventionResponseRequest
  ): Promise<void> {
    return this.withProjectLifecycle(state.id, async () =>
      this.respondToUserInterventionLocked(state, input));
  }

  private async respondToUserInterventionLocked(
    state: ProjectState,
    input: CollaborationUserInterventionResponseRequest
  ): Promise<void> {
    this.assertWritable();
    await this.assertDurableResumeAllowed(state.id);
    if (!["paused", "retrying"].includes(state.status) || state.phase !== "user-intervention-required") {
      throw new Error("Project is not waiting for a user intervention response");
    }
    const message = input.message.trim();
    if (!message) throw new Error("User intervention response cannot be empty");
    const pending = state.userIntervention;
    if (!pending) throw new Error("No pending user intervention for this project");
    if (pending.status === "answered") {
      if (pending.response !== message) {
        throw new Error("User intervention already has a different response");
      }
    }
    const responseRequestId = `user-response-${pending.id}`;
    const existingAnswer = await this.database().eventByRequestId(state.id, responseRequestId);
    if (existingAnswer && (existingAnswer.type !== "user.intervention.answered" || existingAnswer.agentId !== "main" ||
      existingAnswer.invocationId !== pending.requestedInvocationId || existingAnswer.payload.response !== message ||
      existingAnswer.payload.interventionId !== pending.id)) throw new Error("User intervention already has a different formal response");
    const answeredAt = typeof existingAnswer?.payload.answeredAt === "string" ? existingAnswer.payload.answeredAt : new Date().toISOString();
    await this.database().appendEvent({
      projectId: state.id,
      eventId: `evt_user_response_${createHash("sha256").update(pending.id).digest("hex").slice(0, 32)}`,
      requestId: responseRequestId,
      workflowRevision: state.workflowRevision ?? 1,
      agentId: "main",
      invocationId: pending.requestedInvocationId,
      type: "user.intervention.answered",
      payload: { interventionId: pending.id, answeredAt, response: message }
    });
    await this.database().recordTerminalPushCoordinationUserResponse({ projectId: state.id, interventionId: pending.id });
    state.userIntervention = { ...pending, status: "answered", answeredAt, response: message };
    this.clearWorkflowRecoveryTimer(state.id);
    beginWorkflowRecovery(state);
    state.status = "queued";
    state.phase = "collaboration:user-response";
    state.lastError = undefined;
    await this.publishProjection(state, (await this.database().projectState(state.id)));
    await this.saveState(state);
    // Recovery restores a durable scoped pause into the in-process fence.
    // Persisting an answered intervention must also release that fence, or
    // scheduling/submit remains blocked despite the queued/running view.
    this.#pausedProjects.delete(state.id);
    for (const resolve of this.#pauseWaiters.get(state.id) ?? []) resolve();
    this.#pauseWaiters.delete(state.id);
    this.scheduleProjectAfterSettlingRun(state);
  }

  async archiveProject(state: ProjectState): Promise<void> {
    return this.withProjectLifecycle(state.id, async () => {
      this.assertWritable();
      if (state.archivedAt) return;
      const database = this.database();
      const retainedStop = await this.restoreConfirmedProjectStop(state);
      if (!retainedStop && state.status === "paused") {
        await this.cancelProjectLocked(state, { actor: "user", reason: "user_cancelled" });
        await database.confirmProjectCancellationStopped(state.id);
      } else if (!retainedStop && state.status !== "completed" && state.status !== "cancelled") {
        throw new Error("Only completed, cancelled or paused Git projects can be archived");
      }
      state.archivedAt = nowIso();
      try {
        await this.appendEvent(state, {
          type: "project.status",
          message: "Project archived; all project data and resumable state remain available",
          data: { archived: true, archivedAt: state.archivedAt }
        });
      } catch (error) {
        state.archivedAt = undefined;
        throw error;
      }
    });
  }

  private async restoreConfirmedProjectStop(state: ProjectState): Promise<boolean> {
    if (state.status !== "paused" && state.status !== "cancelling") return false;
    const database = this.database();
    const intent = await database.resumableProjectCancellationIntent(state.id);
    if (!intent) return false;
    const stopped = await database.eventByRequestId(state.id,
      `project-stop-confirmed:${state.id}:${intent.seq}`);
    if (!stopped || stopped.type !== "project.cancellation.stop_confirmed" ||
      stopped.payload.requestedEventSeq !== intent.seq || this.#runs.has(state.id) ||
      [...this.#residents.values()].some(entry => entry.projectId === state.id)) return false;
    // An exact Stop remains valid until explicit Resume. Revalidate native
    // rows before reusing it, without scanning old sessions or replaying history.
    await database.confirmProjectCancellationStopped(state.id);
    state.status = "paused";
    state.phase = "collaboration:user-cancelled";
    return true;
  }

  async cancelProject(
    state: ProjectState,
    input: { actor?: string; reason?: string }
  ): Promise<void> {
    // Publish the in-process revocation before waiting for a lifecycle owner.
    // An initializer or failure handler already inside an await boundary must
    // see cancellation immediately and must not schedule/save a stale state.
    this.#cancellingProjects.add(state.id);
    // A safe-point Pause may hold the lifecycle lane while an Agent's turn
    // remains active. Stop must release that wait before entering its own
    // existing durable-intent and physical-close path, rather than waiting
    // for the very native return it was requested to terminate.
    for (const resolve of this.#turnIdleWaiters.get(state.id) ?? []) resolve();
    this.#turnIdleWaiters.delete(state.id);
    try {
      return await this.withProjectLifecycle(
        state.id,
        async () => this.cancelProjectLocked(state, input)
      );
    } finally {
      this.#cancellingProjects.delete(state.id);
    }
  }

  private async cancelProjectLocked(
    state: ProjectState,
    input: { actor?: string; reason?: string }
  ): Promise<void> {
    this.assertWritable();
    if ((await this.restoreConfirmedProjectStop(state))) {
      await this.saveState(state);
      return;
    }
    const durableStatus = await this.durableProjectStatus(state.id);
    if (durableStatus === "completed" || durableStatus === "cancelled") return;
    const reason = input.reason?.trim() || "user_cancelled";
    // F13 cancellation is a resumable stop fence. It records the intent and
    // proves every native writer stopped, then preserves all business/Git
    // state for an explicit in-place resume.
    const resumableStop = true;
    this.#cancellingProjects.add(state.id);
    const database = this.database();
    const priorCancellation = await database.projectCancellationIntent(state.id);
    if (!priorCancellation || priorCancellation.payload.resumable !== true) {
      await database.appendEvent({
        projectId: state.id,
        // Each stop after an explicit resume needs a new durable fence. A
        // pending legacy intent is retained in history and upgraded here;
        // completed/cancelled historical projects returned above stay terminal.
        requestId: `cancel-intent-${state.id}-${(await database.projectState(state.id)).stateRevision}`,
        workflowRevision: state.workflowRevision ?? 1,
        agentId: input.actor === "system" ? "system" : "main",
        type: "project.cancellation.requested",
        payload: {
          actor: input.actor === "system" ? "system" : "user",
          reason,
          resumable: resumableStop
        }
      });
    }
    state.status = "cancelling";
    state.phase = "collaboration:cancelling";
    await nativeBackgroundJobLifecycle(this.#storage.projectDir(state.id), input.reason === "shutdown" ? "pause" : "stop", () => this.assertWritable());
    state.cancellationRequestedAt ??= new Date().toISOString();
    // An explicitly requested Stop supersedes Pause. Its own durable S
    // intent and physical-stop proof continue to govern recovery/resume.
    state.pauseRequest = undefined;
    state.cancelledBy = input.actor === "system" ? "system" : "user";
    state.cancelReason = ([
      "shutdown",
      "user_cancelled",
      "arm_timeout",
      "budget_exhausted",
      "dependency_failure"
    ] as const).find((candidate) => candidate === reason) ?? "user_cancelled";
    state.lastError = undefined;
    // Revoke every S-owned writer synchronously after the durable project
    // intent and before the first await. A provider call that passed an
    // earlier facade check cannot prepare a new create/merge operation after
    // this boundary.
    let projection = await database.projectState(state.id);
    if (state.orchestration.schemaVersion === 3 && projection.nodeRuns.some((node) => node.id === projection.activeNodeRunId &&
      node.node.kind === "collaboration" && projection.scopedGroupRuns?.some((group) => group.activationRequestId === node.activationRequestId))) {
      try { await this.cancelScopedProject(state); }
      finally { this.#cancellingProjects.delete(state.id); }
      return;
    }
    const activeGroup = projection.groupRuns.find((group) =>
      group.nodeRunId === projection.activeNodeRunId &&
      !["completed", "cancelled", "failed"].includes(group.status)
    );
    if (activeGroup) {
      const stopIntent = await database.resumableProjectCancellationIntent(state.id);
      if (!stopIntent) throw new Error("Group Stop requires its durable project Stop intent");
      await database.requestGroupCancellation({
        projectId: state.id,
        groupRunId: activeGroup.id,
        actorAgentId: "main",
        reason,
        // Retrying this Stop keeps its identity; an explicit Resume followed
        // by another Stop must not collide with the preceding lifecycle.
        // This records process control only, never an Agent's business work.
        requestId: `group-stop:${state.id}:${activeGroup.id}:${stopIntent.seq}`
      });
    } else {
      for (const execution of projection.executions.filter((item) =>
        item.nodeRunId === projection.activeNodeRunId &&
        !["succeeded", "failed", "cancelled", "stopped", "superseded"].includes(item.status)
      )) {
        await database.requestExecutionStop({
          projectId: state.id,
          executionId: execution.id,
          ownershipEpoch: execution.ownershipEpoch,
          reason,
          requestId: `cancel-stop-${executionEpochIdentity(execution)}`
        });
      }
    }
    projection = (await database.projectState(state.id));
    await this.saveState(state);
    try {
      this.#pausedProjects.delete(state.id);
      for (const resolve of this.#pauseWaiters.get(state.id) ?? []) resolve();
      this.#pauseWaiters.delete(state.id);
      // Capture this before abort: the run removes itself from #runs in its
      // finally block. Cancellation must wait for every in-flight provider
      // call to settle before discovery can prove that no lost-response PR
      // remains remotely.
      const activeRun = this.#runs.get(state.id);
      this.#controllers.get(state.id)?.abort();
      const residentEntries = [...this.#residents.entries()]
        .filter(([, item]) => item.projectId === state.id);
      const stopEvidence = new Map<string, Readonly<Record<string, unknown>>>();

      const closeResults = await Promise.allSettled(
        residentEntries.map(([, item]) => item.handle.close())
      );
      for (const [[key, item], result] of residentEntries.map((entry, index) =>
        [entry, closeResults[index]!] as const
      )) {
        if (result.status === "fulfilled") this.#residents.delete(key);
        if (result.status !== "fulfilled") continue;
        if (item.activity) {
          await this.closeRuntimeActivity(state, item.activity, {
            kind: "resident",
            invocationId: item.activity.invocationId,
            outcome: "cancelled",
            requestId: `runtime-resident-cancel-${key}-${item.activity.ownershipEpoch ?? item.activity.coordinatorEpoch ?? 1}`
          });
        }
        if (item.execution) {
          stopEvidence.set(item.execution.id, { residentClosed: true });
        } else if (activeGroup && key === `leader:${activeGroup.id}`) {
          await database.confirmCoordinatorStopped({
            projectId: state.id,
            groupRunId: activeGroup.id,
            coordinatorEpoch: activeGroup.coordinatorEpoch,
            evidence: { residentClosed: true },
            reason: "cancellation",
            requestId: `cancel-leader-proof-${activeGroup.id}-${activeGroup.coordinatorEpoch}`
          });
        }
      }
      await this.publishProjection(state, (await database.projectState(state.id)));
      const failedClose = closeResults.find((result) => result.status === "rejected");
      if (failedClose?.status === "rejected") {
        state.lastError = `Cancellation awaits resident stop proof: ${safeRuntimeError(failedClose.reason)}`;
        await this.saveState(state);
        throw failedClose.reason;
      }

      // The coordinator is also a writer, despite having no delivery
      // execution row. On restart its inherited stdio is unavailable, so it
      // needs an independent process-group stop proof before provider state
      // can be mutated or the group cancellation settled.
      if (activeGroup && !residentEntries.some(([key]) => key === `leader:${activeGroup.id}`)) {
        const priorProof = await database.coordinatorStopProof(
          state.id,
          activeGroup.id,
          activeGroup.coordinatorEpoch
        );
        const stopLeader = this.#residentLauncher?.stopLeaderForRecovery;
        if (!priorProof && !stopLeader) {
          throw new Error(`Cancellation lacks leader stop proof for group ${activeGroup.id}`);
        }
        const leaderObservation = priorProof
          ? {
              stopped: true,
              evidence: (priorProof.payload.evidence ?? {}) as Readonly<Record<string, unknown>>
            }
          : await stopLeader!({
              state: structuredClone(state),
              groupRun: structuredClone(activeGroup),
              nodeRunId: activeGroup.nodeRunId,
              leaderInvocationId: groupLeaderInvocationId(
                state.id,
                activeGroup.id,
                activeGroup.coordinatorEpoch
              ),
              executionRuntimePath: this.leaderRuntimePath(state.id, activeGroup.id),
              residentLaunchProtocol: await this.leaderLaunchProtocol(state.id, activeGroup)
            });
        if (!leaderObservation.stopped) {
          throw new Error(`Cancellation awaits leader stop proof for group ${activeGroup.id}`);
        }
        if (!priorProof) {
          await database.confirmCoordinatorStopped({
            projectId: state.id,
            groupRunId: activeGroup.id,
            coordinatorEpoch: activeGroup.coordinatorEpoch,
            evidence: leaderObservation.evidence,
            reason: "cancellation",
            requestId: `cancel-leader-proof-${activeGroup.id}-${activeGroup.coordinatorEpoch}`
          });
        }
      }

      // A service restart loses in-memory handles but not the stop obligation.
      // Reconcile every orphan through the launcher's process proof before
      // changing provider PR state or settling S cancellation.
      projection = (await database.projectState(state.id));
      for (const execution of projection.executions.filter((item) =>
        item.status === "stop_requested" &&
        !this.#residents.has(item.id) &&
        !stopEvidence.has(item.id)
      )) {
        if (!execution.invocationId || !this.#residentLauncher?.stopForRecovery) {
          throw new Error(`Cancellation lacks stop proof for execution ${execution.id}`);
        }
        const observation = await this.#residentLauncher.stopForRecovery({
          state: structuredClone(state),
          execution: structuredClone(execution),
          executionRuntimePath: await this.#storage.invocationRuntimePath(
            state.id,
            execution.invocationId
          ),
          residentLaunchProtocol: await this.executionStopProtocol(state.id, execution)
        });
        if (!observation.stopped) {
          const evidence = observation.evidence;
          await database.confirmExecutionStopped({
            projectId: state.id,
            executionId: execution.id,
            ownershipEpoch: execution.ownershipEpoch,
            stopped: false,
            evidence,
            requestId: executionStopObservationRequestId(
              "cancel-reconcile",
              execution,
              false,
              evidence
            )
          });
          throw new Error(`Cancellation awaits stop proof for execution ${execution.id}`);
        }
        stopEvidence.set(execution.id, observation.evidence);
      }

      // Process closure only proves that the model/native writers stopped.
      // The coordinator run may still be awaiting a provider response. Let it
      // unwind under the aborted signal before discovering remote PRs.
      if (activeRun) await activeRun;
      await this.reconcileTerminalPushObservationResidents(state);

      if (resumableStop) {
        projection = (await database.projectState(state.id));
        for (const execution of projection.executions.filter((item) => item.status === "stop_requested")) {
          const evidence = stopEvidence.get(execution.id);
          if (!evidence) throw new Error(`Cancellation lacks stop proof for execution ${execution.id}`);
          await database.confirmExecutionStopped({
            projectId: state.id,
            executionId: execution.id,
            ownershipEpoch: execution.ownershipEpoch,
            stopped: true,
            evidence,
            requestId: executionStopObservationRequestId("cancel-reconcile", execution, true, evidence)
          });
        }
        await database.confirmProjectCancellationStopped(state.id);
        state.status = "paused";
        state.phase = "collaboration:user-cancelled";
        state.cancellationSettledAt = undefined;
        state.cancelledAt = undefined;
        state.lastError = undefined;
        await this.publishProjection(state, (await database.projectState(state.id)), { stopConfirmed: true });
        await this.saveState(state);
        return;
      }

      projection = (await database.projectState(state.id));
      for (const execution of projection.executions.filter((item) =>
        item.status === "stop_requested"
      )) {
        const evidence = stopEvidence.get(execution.id);
        if (!evidence) {
          throw new Error(`Cancellation lacks stop proof for execution ${execution.id}`);
        }
        const executionGroup = execution.groupRunId
          ? projection.groupRuns.find((candidate) => candidate.id === execution.groupRunId)
          : undefined;
        if (execution.groupRunId && !executionGroup) {
          throw new Error(`Cancellation cannot resolve group for execution ${execution.id}`);
        }
        await this.observeExecutionPullForRecovery(
          state,
          execution,
          executionGroup ? (await database.executionPullBase(state.id, execution.id)) : "main",
          new AbortController().signal
        );
        const terminalEvidence = await this.prepareStoppedExecutionForTerminalTransition(
          state,
          execution,
          reason,
          "cancellation"
        );
        const confirmedEvidence = { ...evidence, ...terminalEvidence };
        await database.confirmExecutionStopped({
          projectId: state.id,
          executionId: execution.id,
          ownershipEpoch: execution.ownershipEpoch,
          stopped: true,
          evidence: confirmedEvidence,
          requestId: executionStopObservationRequestId(
            "cancel-reconcile",
            execution,
            true,
            confirmedEvidence
          )
        });
      }

      // PRs are closed while their stop-requested predecessor still owns the
      // provider fence. A stopped/superseded epoch must never mutate GitHub.
      const remainingPull = (await database.projectState(state.id)).pullRequests.find((pull) =>
        !["closed", "merged"].includes(pull.status)
      );
      if (remainingPull) {
        throw new Error(`Cancellation awaits pull request ${remainingPull.providerNumber} closure`);
      }
      projection = (await database.projectState(state.id));
      if (activeGroup) {
        await database.settleGroupCancellation({
          projectId: state.id,
          groupRunId: activeGroup.id,
          reason,
          requestId: `cancel-settle-${activeGroup.id}`
        });
      } else if (projection.activeNodeRunId) {
        await database.cancelStandaloneNode({
          projectId: state.id,
          nodeRunId: projection.activeNodeRunId,
          reason,
          requestId: `cancel-node-${projection.activeNodeRunId}`
        });
      }
      state.cancellationSettledAt = new Date().toISOString();
      state.cancelledAt = state.cancellationSettledAt;
      state.status = "cancelled";
      state.phase = "cancelled";
      await this.publishProjection(state, (await database.projectState(state.id)));
      await this.saveState(state);
    } finally {
      // The durable S stop/cancellation facts remain authoritative. This is
      // only an in-memory reentrancy guard and must never poison an explicit
      // retry after provider/close failure.
      this.#cancellingProjects.delete(state.id);
    }
  }

  private async assertDurableResumeAllowed(projectId: string): Promise<void> {
    // Read only the durable cancellation fence. Some in-flight workflow
    // revisions are intentionally not accepted by the startup loader until
    // their S projection is published, but their status field is still the
    // authoritative lifecycle fact needed here.
    const persistedStatus = await this.durableProjectStatus(projectId);
    if (persistedStatus === "cancelling" || persistedStatus === "cancelled" ||
      persistedStatus === "completed" ||
      this.#cancellingProjects.has(projectId)) {
      throw new Error(
        `Cannot resume a ${persistedStatus ?? "terminal"} project`
      );
    }
    const projection = await this.database().projectState(projectId);
    const activeNode = projection.activeNodeRunId
      ? projection.nodeRuns.find((node) => node.id === projection.activeNodeRunId)
      : undefined;
    const activeGroup = projection.groupRuns.find((group) =>
      group.nodeRunId === projection.activeNodeRunId &&
      !["completed", "failed", "cancelled"].includes(group.status)
    );
    if (activeNode?.status === "cancelled" ||
      projection.groupRuns.some((group) =>
        group.nodeRunId === projection.activeNodeRunId && group.status === "cancelled"
      ) ||
      activeGroup?.cancellationRequested === true) {
      throw new Error("Cannot resume a cancelled project");
    }
  }

  private async durableProjectStatus(projectId: string): Promise<string | undefined> {
    const raw = await this.#storage.readStateSnapshot(projectId) as { status?: unknown };
    return typeof raw?.status === "string" ? raw.status : undefined;
  }

  private async cancellationIsDurable(projectId: string): Promise<boolean> {
    if (this.#cancellingProjects.has(projectId)) return true;
    try {
      const status = await this.durableProjectStatus(projectId);
      if (status === "cancelling" || status === "cancelled") return true;
    } catch {
      // A missing state file is possible only during initial creation. The S
      // event below remains the cross-process cancellation authority.
    }
    const projection = await this.database().getProjectState(projectId);
    if (!projection) return false;
    if (projection.groupRuns.some((group) => group.cancellationRequested)) return true;
    return (await this.database().projectCancellationIntent(projectId)) !== undefined;
  }

  private async withProjectLifecycle<T>(projectId: string, run: () => Promise<T>): Promise<T> {
    const prior = this.#lifecycleQueues.get(projectId) ?? Promise.resolve();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const queued = prior.catch(() => undefined).then(() => gate);
    this.#lifecycleQueues.set(projectId, queued);
    await prior.catch(() => undefined);
    try {
      return await run();
    } finally {
      release();
      if (this.#lifecycleQueues.get(projectId) === queued) {
        this.#lifecycleQueues.delete(projectId);
      }
    }
  }

  /**
   * The process has stopped, but S intentionally still holds the execution in
   * `stop_requested` so its epoch can checkpoint and reconcile its own PR.
   * The final event is the durable boundary: after it is present the caller
   * may commit `stopped`, and no old-epoch provider write is needed again.
   */
  private async prepareStoppedExecutionForTerminalTransition(
    state: ProjectState,
    execution: MemberExecution,
    reason: string,
    transition: "cancellation" | "handoff"
  ): Promise<Readonly<Record<string, unknown>>> {
    const database = this.database();
    const prior = await database.latestExecutionTerminalPreparation(
      state.id,
      execution.id,
      execution.ownershipEpoch,
      transition
    );

    const git = await this.git(state.id);
    const repository = this.repository(state);
    const terminalSignal = new AbortController().signal;
    let checkpointCommit = typeof prior?.payload.checkpointCommit === "string"
      ? prior.payload.checkpointCommit
      : undefined;
    let checkpointError = typeof prior?.payload.checkpointError === "string"
      ? prior.payload.checkpointError
      : undefined;
    let checkpointStatus = prior?.payload.checkpointStatus === "committed" ||
      prior?.payload.checkpointStatus === "not_committed"
      ? prior.payload.checkpointStatus
      : undefined;
    // Stop/recovery preserves the Agent's checkout and PR. The system may
    // observe exact facts for fencing and handoff; it must never commit, push
    // or close a PR on behalf of the stopped Agent.
    if (!prior && git.observeExecutionCommit) {
      try {
        const observed = await git.observeExecutionCommit(
          execution, execution.ownershipEpoch, terminalSignal
        );
        checkpointStatus = observed.changed ? "committed" : "not_committed";
        if (observed.changed) checkpointCommit = observed.commitSha;
      } catch (error) {
        checkpointError = safeRuntimeError(error);
      }
    }

    let pull = (await database.projectState(state.id)).pullRequests.find((candidate) =>
      candidate.ownerExecutionId === execution.id
    );
    if (pull && !["closed", "merged"].includes(pull.status)) {
      const observed = await git.observePullRequest({
        repository, providerNumber: pull.providerNumber,
        ownerExecutionId: execution.id, signal: terminalSignal
      });
      if (!observed) {
        throw new Error(`Pull request ${pull.providerNumber} disappeared before ${transition}`);
      }
      await database.observePullRequest({
        projectId: state.id, executionId: execution.id,
        ownershipEpoch: execution.ownershipEpoch,
        pullRequest: pullRequestRecord(observed),
        requestId: `${transition}-observe-retained-${executionEpochIdentity(execution)}-${pullRecoveryFactKey(observed)}`
      });
      pull = pullRequestRecord(observed);
    }

    const payload = {
      ...(prior?.payload ?? {
        transition,
        reason: boundedSharedText(reason, 1_000),
        checkpointAttempted: false,
        checkpointObserved: checkpointStatus !== undefined,
        ...(checkpointStatus ? { checkpointStatus } : {}),
        ...(checkpointCommit ? { checkpointCommit } : {}),
        ...(checkpointError ? { checkpointError } : {}),
        retainedExecution: execution.id,
        retainedBranch: execution.executionBranch,
        retainedWorktreePath: execution.worktreePath
      }),
      ...(pull ? {
        pullRequestId: pull.id,
        pullRequestNumber: pull.providerNumber,
        pullRequestUrl: pull.htmlUrl,
        pullRequestStatus: pull.status,
        ...(pull.headSha ? { pullRequestHead: pull.headSha } : {})
      } : {})
    } satisfies Readonly<Record<string, unknown>>;
    const priorPullStatus = prior?.payload.pullRequestStatus;
    const priorPullId = prior?.payload.pullRequestId;
    if (prior && (
      (!pull && priorPullId === undefined) ||
      (pull && priorPullId === pull.id && priorPullStatus === pull.status)
    )) {
      return prior.payload;
    }
    await database.appendEvent({
      projectId: state.id,
      requestId: prior && pull
        ? `${transition}-terminal-stop-reconcile-${executionEpochIdentity(execution)}-${pull.providerNumber}-${pull.status}`
        : `${transition}-terminal-stop-${executionEpochIdentity(execution)}`,
      workflowRevision: state.workflowRevision ?? 1,
      nodeRunId: execution.nodeRunId,
      ...(execution.groupRunId ? { groupRunId: execution.groupRunId } : {}),
      agentId: execution.agentId,
      taskId: execution.taskId,
      executionId: execution.id,
      ...(execution.invocationId ? { invocationId: execution.invocationId } : {}),
      ownershipEpoch: execution.ownershipEpoch,
      type: "execution.terminal_stop.prepared",
      payload
    });
    return payload;
  }

  async shutdown(): Promise<void> {
    if (this.#closed) return;
    this.#shuttingDown = true;
    for (const timer of this.#workflowRecoveryTimers.values()) clearTimeout(timer);
    this.#workflowRecoveryTimers.clear();
    for (const controller of this.#controllers.values()) controller.abort();
    const residentEntries = [...this.#residents.entries()];
    const residentStops = await Promise.allSettled(residentEntries.map(async ([, { handle }]) => {
      await handle.close();
    }));
    for (const [[key, entry], stopped] of residentEntries.map((item, index) =>
      [item, residentStops[index]!] as const
    )) {
      if (stopped.status !== "fulfilled" || !this.#database) continue;
      if (!entry.activity) continue;
      try {
        await this.#database.closeRuntimeActivity({
          projectId: entry.projectId,
          kind: "resident",
          invocationId: entry.activity.invocationId,
          nodeRunId: entry.activity.nodeRunId,
          ...(entry.activity.groupRunId ? { groupRunId: entry.activity.groupRunId } : {}),
          ...(entry.activity.executionId ? { executionId: entry.activity.executionId } : {}),
          ...(entry.activity.ownershipEpoch !== undefined
            ? { ownershipEpoch: entry.activity.ownershipEpoch }
            : {}),
          ...(entry.activity.coordinatorEpoch !== undefined
            ? { coordinatorEpoch: entry.activity.coordinatorEpoch }
            : {}),
          outcome: "stopped",
          requestId: `runtime-shutdown-${key}-${entry.activity.ownershipEpoch ?? entry.activity.coordinatorEpoch ?? 1}`
        });
      } catch {
        // A concurrently settling run may already have closed or fenced it.
      }
    }
    await Promise.allSettled([...this.#runs.values()]);
    // Preserve any actual return that was already arriving when close began.
    // Only after active submits settle may Stop accounting seal this turn.
    for (const [index, [, entry]] of residentEntries.entries()) {
      if (residentStops[index]?.status === "fulfilled" && entry.observation && this.#database) {
        try { await this.recordTerminalNativeStopped(entry.observation, { residentClosed: true }); }
        catch { /* A fenced writer cannot publish another Stop fact. */ }
      }
    }
    try {
      await this.#invocationDispatcher?.flush?.();
    } finally {
      this.#closed = true;
      if (this.#leaseTimer) clearInterval(this.#leaseTimer);
      this.#leaseTimer = undefined;
      await this.#leaseRenewal;
      await this.#leaseWorker?.stop();
      if (this.#database) {
        try {
          await this.#database.relinquishWriterLease();
        } finally {
          await this.#database.close();
          this.#database = undefined;
        }
      }
    }
  }

  private async appendFailureAttempt(
    state: ProjectState,
    input: DurableFailureAttemptInput
  ): Promise<boolean> {
    const attemptId = input.attemptId ?? newId("attempt");
    const prior = input.attemptId
      ? (await this.database().failureAttempts(state.id))
        .find((attempt) => attempt.attemptId === input.attemptId)
      : undefined;
    const finishedAt = prior?.finishedAt ?? nowIso();
    const classified = classifyDurableFailure(input.error, {
      ...(input.scope ? { scope: input.scope } : {}),
      ...(input.errorCode ? { errorCode: input.errorCode } : {}),
      ...(input.retryable !== undefined ? { retryable: input.retryable } : {})
    });
    const appended = await this.database().appendFailureAttempt({
      attemptId,
      projectId: state.id,
      scope: classified.scope,
      operation: input.operation,
      status: "failed",
      errorCode: classified.errorCode,
      retryable: classified.retryable,
      redactedMessage: classified.redactedMessage,
      causeClass: classified.causeClass,
      ...(input.agentId ? { agentId: input.agentId } : {}),
      ...(input.nodeRunId ? { nodeRunId: input.nodeRunId } : {}),
      ...(input.groupRunId ? { groupRunId: input.groupRunId } : {}),
      ...(input.taskId ? { taskId: input.taskId } : {}),
      ...(input.executionId ? { executionId: input.executionId } : {}),
      ...(input.invocationId ? { invocationId: input.invocationId } : {}),
      ...(input.ownershipEpoch !== undefined
        ? { ownershipEpoch: input.ownershipEpoch }
        : {}),
      ...(input.coordinatorEpoch !== undefined
        ? { coordinatorEpoch: input.coordinatorEpoch }
        : {}),
      startedAt: prior?.startedAt ?? input.startedAt ?? finishedAt,
      finishedAt,
      metadata: {
        ...classified.metadata,
        ...(input.metadata ?? {})
      }
    });
    return !appended.replay;
  }

  private async appendSuccessfulAttempt(state: ProjectState, input: {
    attemptId?: string;
    scope: FailureAttempt["scope"];
    operation: string;
    startedAt?: string;
    message: string;
    metadata?: Readonly<Record<string, unknown>>;
    agentId?: string;
    nodeRunId?: string;
    groupRunId?: string;
    taskId?: string;
    executionId?: string;
    invocationId?: string;
    ownershipEpoch?: number;
    coordinatorEpoch?: number;
    onlyIfUnresolved?: boolean;
  }): Promise<boolean> {
    if (input.onlyIfUnresolved !== false &&
      !(await this.database().hasUnresolvedFailureAttempt(state.id, input.scope, input.operation, input))) {
      return false;
    }
    const attemptId = input.attemptId ?? newId("attempt");
    const prior = input.attemptId
      ? (await this.database().failureAttempts(state.id))
        .find((attempt) => attempt.attemptId === input.attemptId)
      : undefined;
    const finishedAt = prior?.finishedAt ?? nowIso();
    const appended = await this.database().appendFailureAttempt({
      attemptId,
      projectId: state.id,
      scope: input.scope,
      operation: input.operation,
      status: "succeeded",
      errorCode: null,
      retryable: false,
      redactedMessage: input.message,
      causeClass: "None",
      ...(input.agentId ? { agentId: input.agentId } : {}),
      ...(input.nodeRunId ? { nodeRunId: input.nodeRunId } : {}),
      ...(input.groupRunId ? { groupRunId: input.groupRunId } : {}),
      ...(input.taskId ? { taskId: input.taskId } : {}),
      ...(input.executionId ? { executionId: input.executionId } : {}),
      ...(input.invocationId ? { invocationId: input.invocationId } : {}),
      ...(input.ownershipEpoch !== undefined
        ? { ownershipEpoch: input.ownershipEpoch }
        : {}),
      ...(input.coordinatorEpoch !== undefined
        ? { coordinatorEpoch: input.coordinatorEpoch }
        : {}),
      startedAt: prior?.startedAt ?? input.startedAt ?? finishedAt,
      finishedAt,
      metadata: input.metadata ?? {}
    });
    return !appended.replay;
  }

  private gitRetrySchedulingAuthority(
    state: ProjectState
  ): GitRetrySchedulingContext["authority"] {
    const invocationId = state.runtime?.activeInvocationId ?? state.activeInvocationId ?? null;
    if (state.runtime?.ownershipEpoch !== undefined) {
      return {
        invocationId,
        epoch: state.runtime.ownershipEpoch,
        epochKind: "ownership"
      };
    }
    if (state.runtime?.coordinatorEpoch !== undefined) {
      return {
        invocationId,
        epoch: state.runtime.coordinatorEpoch,
        epochKind: "coordinator"
      };
    }
    return { invocationId, epoch: null, epochKind: null };
  }

  private gitRetrySchedulingDeadline(at: string): string {
    return new Date(Date.parse(at) + GIT_RETRY_SCHEDULE_SLO_MS).toISOString();
  }

  private async appendGitRetrySchedulingMilestone(
    state: ProjectState,
    input: {
      retryId: string;
      operationId: string;
      attempt: number;
      milestone: GitRetrySchedulingMilestoneName;
      authority: GitRetrySchedulingContext["authority"];
      waitingFor: GitRetrySchedulingWait;
      occurredAt?: string;
    }
  ): Promise<GitRetrySchedulingPoint> {
    return (await this.database().appendGitRetrySchedulingMilestone({
      projectId: state.id,
      retryId: input.retryId,
      operationId: input.operationId,
      attempt: input.attempt,
      milestone: input.milestone,
      invocationId: input.authority.invocationId,
      epoch: input.authority.epoch,
      epochKind: input.authority.epochKind,
      waitingFor: input.waitingFor,
      ...(input.occurredAt ? { occurredAt: input.occurredAt } : {})
    })).milestone;
  }

  private async recordRetryMainResidentOpened(
    state: ProjectState,
    authority: GitRetrySchedulingContext["authority"]
  ): Promise<void> {
    const timeline = [...(await this.database().gitRetryScheduling(state.id))].reverse().find((item) =>
      item.scheduleEnqueuedAt !== undefined && item.mainResidentOpenedAt === undefined
    );
    if (!timeline) return;
    await this.appendGitRetrySchedulingMilestone(state, {
      retryId: timeline.retryId,
      operationId: timeline.operationId,
      attempt: timeline.attempt,
      milestone: "mainResidentOpenedAt",
      authority,
      waitingFor: {
        kind: "none",
        objectId: null,
        reason: null,
        deadlineAt: null
      }
    });
    await this.publishProjection(state, (await this.database().projectState(state.id)));
  }

  private async resolveOperationFailures(
    state: ProjectState,
    operation: string,
    startedAt: string,
    message: string,
    context: Omit<Parameters<CollaborationRuntimeCoordinator["appendSuccessfulAttempt"]>[1],
      "scope" | "operation" | "startedAt" | "message" | "attemptId" | "onlyIfUnresolved"> = {}
  ): Promise<boolean> {
    let changed = false;
    for (const scope of ["git", "resident", "tool", "control", "usage", "scheduler"] as const) {
      changed = (await this.appendSuccessfulAttempt(state, {
        ...context,
        scope,
        operation,
        startedAt,
        message
      })) || changed;
    }
    return changed;
  }

  private async resolveMainRouteFailures(state: ProjectState, nodeRunId: string, routeEpoch: number,
    invocationId?: string): Promise<void> {
    const operations = new Set([`main-route:${nodeRunId}`, "main-route.recovery",
      `main-route.recovery:${nodeRunId}`, `main-route.decision:${nodeRunId}`]);
    const attempts = await this.database().failureAttempts(state.id);
    const { resolved } = failureAttemptHistory(attempts);
    for (const attempt of attempts) {
      if (attempt.status !== "failed" || attempt.nodeRunId !== nodeRunId ||
        !operations.has(attempt.operation) || resolved.has(attempt.attemptId)) continue;
      await this.appendSuccessfulAttempt(state, {
        attemptId: durableAttemptId("main-route-failure-recovered", [attempt.attemptId, nodeRunId, String(routeEpoch)]),
        scope: attempt.scope, operation: attempt.operation, startedAt: attempt.startedAt,
        message: "The original Main task committed its formal decision",
        agentId: "main", nodeRunId, coordinatorEpoch: routeEpoch, ...(invocationId ? { invocationId } : {}),
        metadata: { resolvedAttemptId: attempt.attemptId,
          recoveryEvidence: `main-route-response-${nodeRunId}-${routeEpoch}` }
      });
    }
  }

  private async runInitialization(
    state: ProjectState,
    requestedAttempt?: number,
    retry?: GitRetrySchedulingContext
  ): Promise<void> {
    this.assertWritable();
    if (await this.cancellationIsDurable(state.id)) return;
    const prior = (await this.database().projectState(state.id)).git;
    const operationId = prior.initialization?.operationId ?? `git-init-${state.id}`;
    const attempt = requestedAttempt ?? prior.initialization?.attempt ?? 1;
    const startedAt = nowIso();
    state.status = "queued";
    state.phase = "git:initializing";
    state.lastError = undefined;
    await this.saveState(state);

    const facade = await this.git(state.id);
    let result: GitInitializationResult;
    try {
      result = await facade.initialize({
        projectId: state.id,
        repositoryName: state.git?.requestedRepositoryName ?? safeRepositoryName(state.title, state.id),
        repositoryVisibility: state.git?.requestedRepositoryVisibility ?? "private",
        title: state.title,
        operationId,
        attempt,
        priorState: prior
      });
    } catch (error) {
      if (await this.cancellationIsDurable(state.id)) return;
      // Initializer implementations normally checkpoint and return a failed
      // public state. A thrown infrastructure error still leaves every prior
      // checkpoint intact and must not start the workflow.
      await this.appendFailureAttempt(state, {
        attemptId: `git-initialization:${operationId}:${attempt}`,
        scope: "git",
        operation: "initialization",
        error,
        errorCode: error instanceof CollaborationGitError
          ? error.code
          : "GIT_INITIALIZATION_FAILED",
        retryable: error instanceof CollaborationGitError ? error.retryable : true,
        startedAt,
        metadata: { operationId, attempt, outcome: "thrown" }
      });
      state.status = "retrying";
      state.phase = "git:failed";
      state.lastError = safeRuntimeError(error);
      await this.publishProjection(state, (await this.database().projectState(state.id)));
      await this.saveState(state);
      return;
    }
    if (await this.cancellationIsDurable(state.id)) return;
    if (result.state.status === "ready") {
      await this.appendSuccessfulAttempt(state, {
        attemptId: `git-initialization:${operationId}:${attempt}`,
        scope: "git",
        operation: "initialization",
        startedAt,
        message: "Git initialization succeeded",
        metadata: {
          operationId,
          attempt,
          completedSteps: result.state.initialization?.completedSteps ?? []
        },
        onlyIfUnresolved: false
      });
    } else {
      const initializationError = result.state.initialization?.error ??
        `Git initialization ended with ${result.state.status}`;
      await this.appendFailureAttempt(state, {
        attemptId: `git-initialization:${operationId}:${attempt}`,
        scope: "git",
        operation: "initialization",
        error: result.failure ?? new Error(initializationError),
        errorCode: gitInitializationFailureCode(result.state),
        retryable: true,
        startedAt,
        metadata: {
          operationId,
          attempt,
          gitStatus: result.state.status,
          completedSteps: result.state.initialization?.completedSteps ?? []
        }
      });
    }
    await this.publishProjection(state, (await this.database().projectState(state.id)));
    if (await this.cancellationIsDurable(state.id)) return;
    if (result.repository) this.#repositories.set(state.id, result.repository);
    if (result.localRepository) this.#mainHeads.set(state.id, result.localRepository.head);
    if (result.state.status === "ready") {
      state.status = "queued";
      state.phase = "collaboration:ready";
      state.lastError = undefined;
    } else {
      state.status = "retrying";
      state.phase = `git:${result.state.status}`;
      state.lastError = result.state.initialization?.error
        ? safeRuntimeError(result.state.initialization.error)
        : undefined;
    }
    await this.saveState(state);
    if (result.state.status === "ready" && !await this.cancellationIsDurable(state.id)) {
      if (!retry) {
        this.scheduleProject(state);
        return;
      }
      const readyAt = new Date(this.#now?.() ?? Date.now()).toISOString();
      const schedulingDeadlineAt = this.gitRetrySchedulingDeadline(readyAt);
      const hasPriorRun = this.#runs.has(state.id);
      const gitReady = await this.appendGitRetrySchedulingMilestone(state, {
        retryId: retry.retryId,
        operationId: retry.operationId,
        attempt: retry.attempt,
        milestone: "gitReadyPersistedAt",
        authority: retry.authority,
        occurredAt: readyAt,
        waitingFor: hasPriorRun
          ? {
              kind: "prior-project-run",
              objectId: retry.authority.invocationId ?? `project-run:${state.id}`,
              reason: "The accepted Git retry is ready but the prior project run still owns the scheduler fence",
              deadlineAt: schedulingDeadlineAt
            }
          : {
              kind: "scheduler",
              objectId: `project-scheduler:${state.id}`,
              reason: "Git is ready and the project is waiting to enter the scheduler",
              deadlineAt: schedulingDeadlineAt
            }
      });
      await this.publishProjection(state, (await this.database().projectState(state.id)));
      // Recheck after projection publication: the old run may have settled
      // while the durable ready milestone was being mirrored.
      if (!this.#runs.has(state.id)) {
        await this.appendGitRetrySchedulingMilestone(state, {
          retryId: retry.retryId,
          operationId: retry.operationId,
          attempt: retry.attempt,
          milestone: "priorRunSettledAt",
          authority: retry.authority,
          waitingFor: {
            kind: "scheduler",
            objectId: `project-scheduler:${state.id}`,
            reason: "The prior run fence is clear and scheduling is the next durable boundary",
            deadlineAt: this.gitRetrySchedulingDeadline(gitReady.at)
          }
        });
        if (this.scheduleProject(state)) {
          await this.appendGitRetrySchedulingMilestone(state, {
            retryId: retry.retryId,
            operationId: retry.operationId,
            attempt: retry.attempt,
            milestone: "scheduleEnqueuedAt",
            authority: { invocationId: null, epoch: null, epochKind: null },
            waitingFor: {
              kind: "main-resident",
              objectId: `main-resident:${state.id}`,
              reason: "The project run is queued and waiting for Main resident authority to open",
              deadlineAt: null
            }
          });
        }
        await this.publishProjection(state, (await this.database().projectState(state.id)));
        return;
      }
      // The observed nine-minute gap is the prior run's settlement fence.
      // Register against that exact promise instead of letting the duplicate-
      // run guard silently discard the already-accepted retry.
      this.scheduleProjectAfterSettlingRun(
        state,
        async () => {
          const settledAt = new Date(this.#now?.() ?? Date.now()).toISOString();
          await this.appendGitRetrySchedulingMilestone(state, {
            retryId: retry.retryId,
            operationId: retry.operationId,
            attempt: retry.attempt,
            milestone: "priorRunSettledAt",
            authority: retry.authority,
            occurredAt: settledAt,
            waitingFor: {
              kind: "scheduler",
              objectId: `project-scheduler:${state.id}`,
              reason: "The prior run settled and the accepted Git retry can enter scheduling",
              deadlineAt: this.gitRetrySchedulingDeadline(settledAt)
            }
          });
          await this.publishProjection(state, (await this.database().projectState(state.id)));
        },
        async (scheduled) => {
          if (scheduled) {
            await this.appendGitRetrySchedulingMilestone(state, {
              retryId: retry.retryId,
              operationId: retry.operationId,
              attempt: retry.attempt,
              milestone: "scheduleEnqueuedAt",
              authority: { invocationId: null, epoch: null, epochKind: null },
              waitingFor: {
                kind: "main-resident",
                objectId: `main-resident:${state.id}`,
                reason: "The project run is queued and waiting for Main resident authority to open",
                deadlineAt: null
              }
            });
          }
          await this.publishProjection(state, (await this.database().projectState(state.id)));
        }
      );
    }
  }

  private scheduleProject(state: ProjectState): boolean {
    if (this.#shuttingDown || this.#runs.has(state.id) ||
      state.pauseRequest ||
      this.#cancellingProjects.has(state.id) ||
      state.status === "paused" || state.status === "interrupted" || state.status === "completed" ||
      state.status === "cancelled" || state.status === "cancelling") return false;
    const controller = new AbortController();
    this.#workflowAdjustmentDeferredProjects.delete(state.id);
    this.#controllers.set(state.id, controller);
    const runStartedAt = nowIso();
    let originalRunFailure: unknown;
    const run = this.runManagedProjectWithRecovery(state, controller.signal).then(async () => {
      if (this.#shuttingDown || state.status === "paused" || state.status === "interrupted" || state.status === "retrying" || state.status === "cancelled" ||
        state.status === "cancelling") return;
      const resolvedRun = await this.resolveOperationFailures(
        state, "project.run", runStartedAt, "A later scheduled project run succeeded"
      );
      const resolvedRecovery = await this.resolveOperationFailures(
        state, "workflow.recovery", runStartedAt, "The original project continued successfully after recovery"
      );
      if (resolvedRun || resolvedRecovery) {
        await this.publishProjection(state, (await this.database().projectState(state.id)));
      }
    }).catch(async (error: unknown) => {
      originalRunFailure = error;
      if (this.#shuttingDown || this.#pausedProjects.has(state.id) ||
        await this.cancellationIsDurable(state.id)) return;
      if (error instanceof CollaborationStateError && error.code === "WORKFLOW_ADJUSTMENT_PENDING") {
        this.#workflowAdjustmentDeferredProjects.add(state.id);
        state.status = "queued";
        state.phase = "collaboration:workflow-adjustment-waiting";
        await this.publishProjection(state, (await this.database().projectState(state.id)));
        await this.resumeWorkflowAdjustmentDispatch(state);
        return;
      }
      if (error instanceof MainRouteRecoveryRequiredError) {
        const projection = await this.database().projectState(state.id);
        // The retry timer retains the exact frozen authority until its stop
        // proof can be reconciled; no business action is fabricated here.
        const nodeRunId = projection.activeNodeRunId;
        const attempt = nodeRunId ? (await this.database().latestMainRouteAttempt(state.id, nodeRunId)) : undefined;
        await this.appendFailureAttempt(state, { scope: "resident", operation: "main-route.recovery",
          error, errorCode: "MAIN_ROUTE_RECOVERY_REQUIRED", retryable: true, startedAt: runStartedAt,
          agentId: "main", ...(nodeRunId ? { nodeRunId } : {}),
          ...(attempt?.invocationId ? { invocationId: attempt.invocationId } : {}),
          ...(attempt?.coordinatorEpoch ? { coordinatorEpoch: attempt.coordinatorEpoch } : {}),
          metadata: { phase: state.phase, projectStatus: state.status } });
        await this.publishProjection(state, (await this.database().projectState(state.id)));
        // An accepted Resume queues its replacement against this old run.
        // Preserve it, and any user Pause, rather than writing an older wait.
        const currentRun = this.#runs.get(state.id);
        if (await this.cancellationIsDurable(state.id) || state.pauseRequest ||
          state.status === "queued" && currentRun && this.#runsWithAcceptedContinuation.has(currentRun)) return;
        state.status = "retrying";
        state.phase = "collaboration:main-recovery-required";
        state.lastError = safeRuntimeError(error);
        await this.saveState(state);
        return;
      }
      if (error instanceof GitHubAuthorizationError) {
        await this.appendFailureAttempt(state, {
          scope: "git",
          operation: "project.run",
          error,
          startedAt: runStartedAt,
          ...((state.runtime?.currentAgent ?? state.currentAgent)
            ? { agentId: (state.runtime?.currentAgent ?? state.currentAgent)! }
            : {}),
          ...((state.runtime?.activeInvocationId ?? state.activeInvocationId)
            ? { invocationId: (state.runtime?.activeInvocationId ?? state.activeInvocationId)! }
            : {}),
          metadata: { phase: state.phase, projectStatus: state.status }
        });
        let projection = await this.database().projectState(state.id);
        for (const execution of projection.executions.filter((item) =>
          item.nodeRunId === projection.activeNodeRunId &&
          ["working", "waiting_authorization", "waiting_review", "pr_open", "resolving"]
            .includes(item.status)
        )) {
          await this.database().transitionExecutionStatus({
            projectId: state.id,
            executionId: execution.id,
            ownershipEpoch: execution.ownershipEpoch,
            status: "waiting_authorization",
            waitReason: execution.waitReason ?? "GitHub authorization is required",
            requestId: `github-authorization-${execution.id}-${execution.ownershipEpoch}`
          });
        }
        const currentGit = projection.git;
        const waitingGit: ProjectGitState = {
          ...currentGit,
          enabled: true,
          status: "waiting_for_github",
          initialization: {
            operationId: currentGit.initialization?.operationId ?? `git-init-${state.id}`,
            attempt: currentGit.initialization?.attempt ?? 1,
            completedSteps: currentGit.initialization?.completedSteps ?? [],
            error: safeRuntimeError(error)
          }
        };
        // SQLite is the restart authority. Persist the authorization wait
        // under the same initialization operation before publishing file
        // state, otherwise recoverProject could overwrite the pause with the
        // former ready projection and schedule the model again.
        await this.database().checkpointGitInitialization({
          projectId: state.id,
          operationId: waitingGit.initialization!.operationId,
          attempt: waitingGit.initialization!.attempt,
          state: waitingGit
        });
        projection = (await this.database().projectState(state.id));
        await this.publishProjection(state, projection).catch(() => undefined);
        if (await this.cancellationIsDurable(state.id)) return;
        state.status = "retrying";
        state.phase = "git:waiting_for_github";
        state.lastError = safeRuntimeError(error);
        await this.saveState(state);
        return;
      }
      await this.appendFailureAttempt(state, {
        operation: "project.run",
        error,
        startedAt: runStartedAt,
        ...((state.runtime?.currentAgent ?? state.currentAgent)
          ? { agentId: (state.runtime?.currentAgent ?? state.currentAgent)! }
          : {}),
        ...((state.runtime?.activeInvocationId ?? state.activeInvocationId)
          ? { invocationId: (state.runtime?.activeInvocationId ?? state.activeInvocationId)! }
          : {}),
        metadata: { phase: state.phase, projectStatus: state.status }
      });
      if (await this.cancellationIsDurable(state.id)) return;
      const failure = classifyDurableFailure(error, {});
      state.status = failure.retryable ? "retrying" : "interrupted";
      state.phase = failure.retryable ? "collaboration:recovering" : "collaboration:repair-required";
      state.lastError = safeRuntimeError(error);
      if (!failure.retryable) {
        state.interruptedAt = nowIso();
        finishWorkflowRecovery(state);
        this.clearWorkflowRecoveryTimer(state.id);
      }
      await this.publishProjection(state, (await this.database().projectState(state.id))).catch(() => undefined);
      await this.saveState(state);
    }).catch(async (error: unknown) => {
      // Failure reporting itself needs the writer fence. An expired/replaced
      // lease can reject that write too; this scheduled promise has no caller
      // to catch its rejection, so contain it without fabricating persistence.
      if (this.#leaseError || (error instanceof CollaborationStateError && error.code === "WRITER_LEASE_STALE")) {
        this.loseWriterLease(error);
      } else {
        controller.abort();
        const primary = originalRunFailure ?? error;
        const failure = classifyDurableFailure(primary, {});
        state.status = failure.retryable ? "retrying" : "interrupted";
        state.phase = failure.retryable ? "collaboration:failure-reporting-failed" : "collaboration:repair-required";
        state.lastError = safeRuntimeError(primary);
        console.warn("Collaboration failure reporting also failed", safeRuntimeError(error));
        if (failure.retryable) checkpointWorkflowRecovery(state, { delayMs: this.#harnessRecoveryDelayMs });
        else { state.interruptedAt = nowIso(); finishWorkflowRecovery(state); this.clearWorkflowRecoveryTimer(state.id); }
        try { await this.saveState(state); } catch { /* The retained checkpoint is retried when storage becomes available. */ }
      }
    }).finally(() => {
      this.#runs.delete(state.id);
      this.#controllers.delete(state.id);
      this.armWorkflowRecovery(state);
    });
    this.#runs.set(state.id, run);
    return true;
  }

  private scheduleProjectAfterSettlingRun(
    state: ProjectState,
    beforeDispatch?: () => Promise<void>,
    afterDispatch?: (scheduled: boolean) => Promise<void>
  ): void {
    const settlingRun = this.#runs.get(state.id);
    if (!settlingRun) {
      this.scheduleProject(state);
      return;
    }
    this.#runsWithAcceptedContinuation.add(settlingRun);
    // Paused/intervention/completed state becomes observable before the
    // current run's finally block removes its promise. Queue the replacement
    // after that exact run settles so scheduleProject's duplicate-run fence
    // cannot silently discard an acknowledged continuation.
    const dispatch = async () => {
      void this.withProjectLifecycle(state.id, async () => {
        await beforeDispatch?.();
        if (state.status === "queued" && !this.#runs.has(state.id) &&
          !this.#cancellingProjects.has(state.id)) {
          const scheduled = this.scheduleProject(state);
          await afterDispatch?.(scheduled);
        }
      }).catch(() => undefined);
    };
    void settlingRun.then(dispatch, dispatch);
  }

  private async runManagedProjectWithRecovery(state: ProjectState, signal: AbortSignal): Promise<void> {
    let pending = await this.database().pendingHarnessRecovery(state.id);
    for (;;) {
      if (pending) {
        const next = typeof pending.payload.nextRetryAt === "string" ? Date.parse(pending.payload.nextRetryAt) : Date.now();
        await abortableRuntimeDelay(Math.max(0, Math.min(60_000, next - Date.now())), signal);
        await this.waitWhilePaused(state.id, signal);
      }
      try {
        if (pending) {
          beginWorkflowRecovery(state);
          state.status = "queued";
          state.phase = "collaboration:recovering";
        }
        const projection = await this.database().projectState(state.id);
        if (pending && projection.frozen && projection.freezeReason?.startsWith("main_route_")) {
          const recovered = await this.recoverIndependentMainRoute(state, projection, false);
          if (!recovered.recovered) throw new HarnessRuntimeError("PROTOCOL_ROUTE_FAILED",
            "Original Main process recovery is waiting for confirmed authority", {}, { retryable: true });
          state.status = "queued";
          state.phase = "collaboration:recovering";
        }
        await nativeBackgroundJobLifecycle(this.#storage.projectDir(state.id), "resume", () => this.assertWritable());
        await this.runManagedProject(state, signal);
        if (pending && !state.pauseRequest && state.status !== "paused") {
          await this.database().appendEvent({ projectId: state.id, type: "runtime.harness_recovery.completed",
            requestId: `${pending.requestId}:completed`, payload: { recoveryRequestId: pending.requestId } });
          state.retryAt = undefined;
          await this.publishProjection(state, (await this.database().projectState(state.id)));
        } else if (pending && state.status === "paused" && !state.pauseRequest && !this.#pausedProjects.has(state.id)) {
          await this.database().appendEvent({ projectId: state.id, type: "runtime.harness_recovery.abandoned",
            requestId: `${pending.requestId}:abandoned`, payload: { recoveryRequestId: pending.requestId,
              phase: state.phase, reason: "The transport recovered; a separate durable task condition requires attention" } });
        }
        return;
      } catch (error) {
        const failure = transientHarnessFailure(error);
        if (!failure && pending && !signal.aborted && !state.pauseRequest && !this.#pausedProjects.has(state.id)) {
          await this.database().appendEvent({ projectId: state.id, type: "runtime.harness_recovery.abandoned",
            requestId: `${pending.requestId}:abandoned`, payload: { recoveryRequestId: pending.requestId,
              reason: safeRuntimeError(error) } });
        }
        if (!failure || signal.aborted || this.#shuttingDown || state.pauseRequest ||
          this.#pausedProjects.has(state.id) || await this.cancellationIsDurable(state.id)) throw error;
        await this.appendFailureAttempt(state, { operation: "project.run", error: failure,
          metadata: { automaticRecovery: true, phase: state.phase } });
        const previous = await this.database().pendingHarnessRecovery(state.id);
        const attempt = Number(previous?.payload.attempt ?? 0) + 1;
        const nextRetryAt = new Date(Date.now() + this.#harnessRecoveryDelayMs(attempt)).toISOString();
        pending = (await this.database().appendEvent({ projectId: state.id,
          requestId: `harness-auto-recovery:${state.id}:${newId("retry")}`,
          type: "runtime.harness_recovery.scheduled", payload: { attempt, nextRetryAt,
            errorCode: failure.code, message: safeRuntimeError(failure),
            activeNodeRunId: (await this.database().projectState(state.id)).activeNodeRunId } })).event;
        await this.forgetStoppedResidents(state);
        state.status = "retrying";
        state.phase = "collaboration:harness-recovery";
        state.retryAt = nextRetryAt;
        state.lastError = safeRuntimeError(failure);
        await this.publishProjection(state, (await this.database().projectState(state.id)));
        await this.saveState(state);
        await this.appendEvent(state, { type: "agent.failed", level: "warning",
          message: "模型或网关暂时失败，正在自动恢复原任务…", data: { attempt, nextRetryAt,
            errorCode: failure.code, automaticRecovery: true } });
      }
    }
  }

  /** Physical close is already confirmed by the launcher. Persist that fact
   * before forgetting the handle, keeping the original task/worktree/PR. */
  private async forgetStoppedResidents(state: ProjectState): Promise<void> {
    for (const [key, entry] of this.#residents) {
      if (entry.projectId !== state.id || entry.handle.closed !== true) continue;
      const execution = entry.execution;
      if (execution && !execution.groupRunId) {
        const current = (await this.database().projectState(state.id)).executions.find(item => item.id === execution.id);
        if (current && ["queued", "working", "waiting_authorization", "waiting_review", "pr_open", "resolving", "merged", "stop_requested"].includes(current.status)) {
          await this.database().requestExecutionStop({ projectId: state.id, executionId: current.id,
            ownershipEpoch: current.ownershipEpoch, reason: "native_turn_recovery",
            requestId: `native-recovery-stop:${current.id}:${current.ownershipEpoch}` });
          const observation = current.invocationId && this.#residentLauncher?.stopForRecovery
            ? await this.#residentLauncher.stopForRecovery({ state: structuredClone(state), execution: current,
                executionRuntimePath: await this.#storage.invocationRuntimePath(state.id, current.invocationId),
                residentLaunchProtocol: await this.executionStopProtocol(state.id, current) })
            : { stopped: true, evidence: { residentClosed: true }, recovery: undefined };
          if (observation.recovery) await this.persistResidentRecoverySeed(observation.recovery, {
            projectId: state.id, sourceNodeRunId: current.nodeRunId, scope: "member", scopeId: current.id,
            agentId: current.agentId, harnessId: state.agents[current.agentId]!.harness,
            stoppedEpoch: current.ownershipEpoch });
          await this.database().confirmExecutionStopped({ projectId: state.id, executionId: current.id,
            ownershipEpoch: current.ownershipEpoch, stopped: observation.stopped, evidence: observation.evidence,
            requestId: `native-recovery-confirm:${current.id}:${current.ownershipEpoch}` });
          if (!observation.stopped) throw new Error("Original native process stop is not confirmed");
        }
      }
      if (entry.activity) await this.closeRuntimeActivity(state, entry.activity, { kind: "resident",
        invocationId: entry.activity.invocationId, outcome: "stopped",
        requestId: `native-recovery-resident-close:${key}:${entry.activity.invocationId}` });
      this.#residents.delete(key);
    }
  }

  private async runManagedProject(state: ProjectState, signal: AbortSignal): Promise<void> {
    const launcherCheckStartedAt = nowIso();
    if (!this.#residentLauncher) {
      await this.appendFailureAttempt(state, {
        scope: "resident",
        operation: "launcher.available",
        error: new Error("The trusted collaboration resident launcher is unavailable"),
        errorCode: "RESIDENT_LAUNCHER_UNAVAILABLE",
        retryable: true,
        startedAt: launcherCheckStartedAt,
        metadata: { phase: state.phase }
      });
      await this.publishProjection(state, (await this.database().projectState(state.id)));
      state.status = "retrying";
      state.phase = "collaboration:resident-launcher-required";
      state.lastError = "The trusted collaboration resident launcher is unavailable";
      await this.saveState(state);
      return;
    }
    if ((await this.appendSuccessfulAttempt(state, {
      scope: "resident",
      operation: "launcher.available",
      startedAt: launcherCheckStartedAt,
      message: "The trusted collaboration resident launcher is available"
    }))) {
      await this.publishProjection(state, (await this.database().projectState(state.id)));
    }
    let projection = await this.database().projectState(state.id);
    if (projection.git.status !== "ready") return;
    if (state.orchestration.schemaVersion === 3) await this.worktreeClosingRuntime(state, signal).discover();
    try { await this.advanceTerminalPushObservations(state, signal); }
    catch (error) {
      const active = (await this.database().projectState(state.id)).nodeRuns.find(node => node.id === projection.activeNodeRunId);
      // Existing scoped managers or an authorized Main receive the facts.
      // No business route or request_user decision is selected by the system.
      if (!(error instanceof TerminalPushObservationUnresolvedError) ||
        !(active?.node.kind === "agent" && active.node.agentId === "main" ||
          active?.node.kind === "collaboration" && active.id === error.coordinationNodeRunId)) throw error;
    }
    if (state.status === "paused" || state.status === "retrying") return;
    if (await this.drainPendingRoutes(state, signal)) return;
    projection = (await this.database().projectState(state.id));
    if (state.status === "completed") return;
    if (projection.activeNodeRunId) {
      await this.reconcileActiveExecution(state, projection, signal);
      return;
    }
    const preparation = (await this.database().scopedGroupActivationPreparations(state.id)).find(record => record.status === "preparing" && !record.input.parentGroupRunId);
    if (preparation) {
      const scoped = await this.scopedRuntime(state, signal);
      const activated = await scoped.activate(preparation.input);
      await this.advanceScopedGroup(state, activated.groupRun, signal, scoped);
      return;
    }
    await this.restoreReceivedRootMainInputs(state);
    const pendingInputs = state.userInputs.filter((input) => input.status === "pending");
    // Preserve this activation's task for recovery. Pending user inputs are
    // delivered to Main below, rather than replayed as the original request.
    const initialAssignment = state.phase === "collaboration:reopened"
      ? pendingInputs.map(input => input.message).join("\n\n")
      : state.requirement;
    const activationRequestId = state.cycle > 1
      ? `input-${state.id}-cycle-${state.cycle}`
      : `input-${state.id}`;
    const targetNodeId = state.phase === "collaboration:reopened"
      ? "main"
      : state.orchestration.input.target;
    await this.activateAndRunNode(state, targetNodeId, {
      activationRequestId,
      inputSnapshotRef: `project:${state.id}:requirement:cycle:${state.cycle}`,
      assignment: initialAssignment,
      activatedByAgentId: "main"
    }, signal);
  }

  /** Closed business tasks only receive a finite original-session receipt
   * turn. The system checks mechanisms; the Agent observes provider results
   * and authors finish/memory/handoff. Never reopen its business execution. */
  private async advanceTerminalPushObservations(state: ProjectState, signal: AbortSignal): Promise<void> {
    if (state.status === "completed") return;
    await this.reconcileTerminalPushObservationResidents(state);
    const database = this.database();
    await captureKnownAgentGitResults(database, state.id);
    for (const candidate of (await database.terminalPushObservationCandidates(state.id))) {
      if ((await database.executionSupervisionResult(state.id, candidate.executionId))) {
        await database.retireExecutionSupervisionIssues(state.id, candidate.executionId, "Task supervision ended; retained tool outcomes remain factual records");
        continue;
      }
      const explicit = await database.terminalPushObservationContinuation(state.id, candidate.executionId, candidate.operation.id);
      if (!explicit) {
        await database.appendEvent({ projectId: state.id, agentId: candidate.agentId,
          type: "execution.supervision.finished", payload: { outcome: "unconfirmed", missing: [
            `Retained operation ${candidate.operation.id} has an unfinished or unreceived result`],
            executionId: candidate.executionId, ownershipEpoch: candidate.ownershipEpoch,
            reason: "The original task ended; no additional automatic task is created for a historical tool result" } });
        await database.retireExecutionSupervisionIssues(state.id, candidate.executionId, "Historical receipt remains recorded without another automatic wakeup");
        continue;
      }
      while (!signal.aborted) {
        await this.waitWhilePaused(state.id, signal);
        const operation = (await database.recordedGitOperation(state.id, candidate.operation.id))!;
        const prior = (await database.terminalPushObservationTurns(state.id)).filter(turn => turn.executionId === candidate.executionId).at(-1);
        const receipt = (await database.terminalPushObservationTurns(state.id)).filter(turn => turn.executionId === candidate.executionId && turn.operation.id === candidate.operation.id).at(-1);
        const coordination = await database.terminalPushObservationContinuation(state.id,candidate.executionId,candidate.operation.id);
        const pendingResults = await database.terminalPushObservationPendingResults(state.id, candidate.executionId);
        if (operation.status === "failed" || ["finalized", "superseded"].includes(operation.status) && (!receipt || receipt.completion && receipt.result) && !pendingResults.length) break;
        if (!coordination && (receipt?.completion && receipt.result && !pendingResults.length || (await database.terminalPushObservationRepairCount(state.id, candidate.executionId)) >= MAX_TASK_REPAIR_WAKEUPS)) {
          const nativeInvocationId = prior?.invocationId ?? candidate.originalInvocationId;
          const nativeRuntimePath = prior?.runtimePath ?? await this.#storage.invocationRuntimePath(state.id,nativeInvocationId);
          const stopped = await this.observeTerminalNativeStop(state,candidate,nativeRuntimePath);
          const unresolvedRequestId = `terminal-push-unresolved:${candidate.executionId}:${candidate.operation.id}:${nativeInvocationId}`;
          if (!(await database.eventByRequestId(state.id,unresolvedRequestId))) await database.appendEvent({ projectId: state.id, agentId: candidate.agentId, nodeRunId: candidate.nodeRunId,
            requestId: unresolvedRequestId,
            type: "agent.terminal_push_observation.unresolved",
            payload: { executionId: candidate.executionId, ownershipEpoch: candidate.ownershipEpoch,
              operationId: candidate.operation.id, nativeStopped: true,
              nativeStop: { invocationId: nativeInvocationId, runtimePath: nativeRuntimePath, evidence: stopped.evidence },
              ...(receipt?.result ? { result: receipt.result } : {}),
              pendingResults: pendingResults.map(event => event.payload.receipt),
              repairCount: await database.terminalPushObservationRepairCount(state.id, candidate.executionId) } });
          const issue = await database.recordTerminalPushObservationGroupIssue({ projectId: state.id, executionId: candidate.executionId,
            ownershipEpoch: candidate.ownershipEpoch, operationId: candidate.operation.id, unresolvedRequestId });
          await this.publishProjection(state, (await database.projectState(state.id)));
          if (!issue && state.orchestration.schemaVersion === 3 && (await database.latestAgentNativeSessionBinding(state.id, "main"))) {
            await database.recordTerminalPushCoordinationIncident({ projectId: state.id, executionId: candidate.executionId,
              ownershipEpoch: candidate.ownershipEpoch, operationId: candidate.operation.id, unresolvedRequestId });
            await this.receiptCoordinatorRuntime(state, signal).advance();
            if (state.status === "paused" || state.status === "retrying") return;
            continue;
          }
          throw new TerminalPushObservationUnresolvedError(`Original Agent ${candidate.agentId} receipt for ${candidate.operation.id} requires coordination; its original completion and finite budget are retained`,
            issue ? candidate.nodeRunId : undefined);
        }
        const previousInvocationId = prior?.invocationId ?? candidate.originalInvocationId;
        const previousRuntimePath = prior?.runtimePath ?? await this.#storage.invocationRuntimePath(state.id, previousInvocationId);
        const stopped = await this.observeTerminalNativeStop(state, candidate, previousRuntimePath);
        signal.throwIfAborted();
        await this.waitWhilePaused(state.id, signal);
        const invocationId = newId("inv");
        const runtimePath = path.join(path.dirname(previousRuntimePath), invocationId);
        const observation = await database.beginTerminalPushObservation({ ...candidate, invocationId,
          operationId: candidate.operation.id, previousInvocationId, previousRuntimePath, runtimePath,
          residentStopConfirmed: true, evidence: stopped.evidence, ...(coordination ? { coordination } : {}) });
        if (!observation) return; // A competing owner/pause/fence never consumes another wake.
        await this.publishProjection(state, (await database.projectState(state.id)));
        await this.runTerminalPushObservation(state, observation, signal);
      }
      signal.throwIfAborted();
    }
  }

  private async observeTerminalNativeStop(
    state: ProjectState,
    owner: Pick<TerminalPushObservationCandidate, "nodeRunId" | "executionId" | "agentId" | "ownershipEpoch">,
    runtimePath: string
  ): Promise<CollaborationResidentRecoveryResult> {
    const observe = this.#residentLauncher?.stopScopedForRecovery;
    if (!observe) throw new ResidentRetainedWaitError("Original receipt turn requires the trusted native Stop boundary");
    const result = await observe({ state: structuredClone(state), nodeRunId: owner.nodeRunId,
      scopeId: owner.executionId, agentId: owner.agentId, role: "delivery", ownershipEpoch: owner.ownershipEpoch,
      executionRuntimePath: runtimePath });
    if (!result.stopped || !Object.keys(result.evidence).length) {
      throw new ResidentRetainedWaitError("Original receipt turn native Stop could not be proven; no wake was reserved");
    }
    return result;
  }

  private async recordTerminalNativeStopped(observation: TerminalPushObservationTurn, evidence: Readonly<Record<string, unknown>>): Promise<void> {
    const database = this.database();
    if ((await database.terminalPushObservationTurns(observation.projectId)).find(turn => turn.invocationId === observation.invocationId)?.status === "stopped") return;
    if (observation.writerLeaseEpoch === (await database.writerLease()).epoch) {
      await database.stopTerminalPushObservation({ ...observation, residentStopConfirmed: true, evidence });
    } else {
      await database.reconcileTerminalPushObservation({ ...observation, priorWriterLeaseEpoch: observation.writerLeaseEpoch,
        residentStopConfirmed: true, evidence });
    }
  }

  private async reconcileTerminalPushObservationResidents(state: ProjectState): Promise<void> {
    const database = this.database();
    if ((await database.terminalPushCoordinatorTurns(state.id)).length) await this.receiptCoordinatorRuntime(state, new AbortController().signal).reconcile();
    for (const turn of (await database.terminalPushObservationTurns(state.id))) {
      if (turn.completion) await this.#storage.saveTerminalPushObservationCompletion(turn.completion);
      if (turn.status === "stopped" || this.#residents.has(`terminal:${turn.invocationId}`)) continue;
      const stopped = await this.observeTerminalNativeStop(state, turn, turn.runtimePath);
      await this.recordTerminalNativeStopped(turn, stopped.evidence);
    }
    await this.publishProjection(state, (await database.projectState(state.id)));
  }

  private receiptCoordinatorRuntime(state: ProjectState, signal: AbortSignal): TerminalPushCoordinatorRuntime {
    const assertCurrent = async () => {
      this.assertWritable();
      if (this.#shuttingDown || this.#cancellingProjects.has(state.id) ||
        this.#pausedProjects.has(state.id) && !(this.#activeTurns.get(state.id) ?? 0)) {
        throw new Error("Original coordinator turn authority was revoked");
      }
    };
    return new TerminalPushCoordinatorRuntime({ state, signal, database: this.database(), storage: this.#storage,
      launcher: this.#residentLauncher!, builder: this.#executionInputBuilder, assertCurrent,
      wait: () => this.waitWhilePaused(state.id, signal), publish: async () => this.publishProjection(state, (await this.database().projectState(state.id))),
      inputs: async (agent, invocation, inbox, runtime) => this.stageLeaderManagementInputs(state, invocation, inbox, runtime, agent),
      filesystem: async () => this.filesystemAuthorityInput(state), decorate: async request => await this.attachRuntimeCallbacks(state, request),
      trace: (agent, invocation) => this.traceSink(state, agent, invocation), turnRequestFactory: request => this.turnRequestFactory(state, request),
      hasResident: key => this.#residents.has(key),
      register: (key, coordination, handle) => { this.#residents.set(key, { projectId: state.id, coordination, handle }); },
      unregister: key => { this.#residents.delete(key); },
      submit: async (handle, turn) => {
        await this.waitWhilePaused(state.id, signal);
        this.#activeTurns.set(state.id, (this.#activeTurns.get(state.id) ?? 0) + 1);
        try { return await this.submitNativeTurn(state, handle, turn); }
        finally {
          const remaining = Math.max(0, (this.#activeTurns.get(state.id) ?? 1) - 1);
          if (remaining) this.#activeTurns.set(state.id, remaining);
          else {
            this.#activeTurns.delete(state.id);
            for (const resolve of this.#turnIdleWaiters.get(state.id) ?? []) resolve();
            this.#turnIdleWaiters.delete(state.id);
          }
        }
      },
      requestUser: async (incident, decision) => {
        if (decision.agent !== "main" || decision.action.tool !== "request_user") throw new Error("Only the original Main can author a receipt user request");
        const nodeRunId = await this.database().terminalPushOwnerNodeRunId(state.id, incident.executionId);
        await this.pauseForMainIntervention(state, nodeRunId, decision.callId, decision.action,
          { incidentId: incident.id, managerInvocationId: decision.invocationId });
      } });
  }

  private async runTerminalPushObservation(state: ProjectState, observation: TerminalPushObservationTurn, signal: AbortSignal): Promise<void> {
    const database = this.database();
    const launcher = this.#residentLauncher!;
    const runtimePath = await this.#storage.invocationRuntimePath(state.id, observation.invocationId);
    const previous = (await database.terminalPushObservationTurns(state.id)).filter(turn => turn.executionId === observation.executionId && turn.invocationId !== observation.invocationId).at(-1);
    const sources = new AgentContextSources();
    const assignment = [
      "Your original business task is already complete. Continue in its original durable session only to receive saved tool results or supply its historical push receipt.",
      `Original operation: ${observation.operation.id}; status=${observation.operation.status}. ${sources.record("receipt-original-operation", "Original operation", observation.operation)}`,
      ["finalized", "superseded"].includes(observation.operation.status)
        ? `The original push journal is ${observation.operation.status}. Superseded means inclusion in a later confirmed publication, not success of the original push. Read the saved original tool returns supplied before this input; do not repeat publication, PR actions or business work.`
        : "Use git_reconcile_push with this exact operationId and historical=true; do not retry or perform business work. The actual provider result returns to you.",
      "Call finish_task for this supplemental turn, supplying your own summary/memory, then return your actual handoff and any unresolved issue for your coordinator.",
      ...(observation.coordination ? [`Your manager explicitly requested this read-only continuation: ${observation.coordination.envelope.action.tool === "coordinate_group_task" ? observation.coordination.envelope.action.rationale : ""}. Your completed business task and original automatic repair count are retained.`] : []),
      ...(previous ? [`${sources.record("receipt-previous-supplement", "Previous supplemental facts", previous)} Its accepted Memory.md is under runtime/${previous.invocationId}/terminal-push-observation; preserve the old business memory.`] : [])
    ].join("\n\n");
    const inboxPath = await this.#storage.writeInbox(state, observation.agentId, observation.invocationId, assignment);
    const scope = { operationId: observation.operation.id };
    const context: NonNullable<AgentRunRequest["executionContext"]> = { nodeRunId: observation.nodeRunId,
      executionId: observation.executionId, ownershipEpoch: observation.ownershipEpoch,
      role: "delivery", executionWorktree: observation.worktreePath };
    const fallback: AgentRunRequest = { project: structuredClone(state), purpose: "workflow", agent: observation.agentId,
      kind: "worker", permission: "workspace", invocationId: observation.invocationId, inboxPath,
      projectPath: this.#storage.projectDir(state.id), workspacePath: observation.worktreePath,
      schemaPath: "", skillPaths: [], autoSkillPaths: [], availableSkillPaths: [], runtimePath,
      executionContext: context, terminalPushObservation: scope, sessionContinuity: "strict",
      ...(state.agentSessionIds?.[observation.agentId] ? { resumeThreadId: state.agentSessionIds[observation.agentId] } : {}) };
    const request = this.#executionInputBuilder ? await this.#executionInputBuilder.build({ state,
      agentId: observation.agentId, executionContext: context, assignment, invocationId: observation.invocationId,
      inboxPath, projectPath: fallback.projectPath, worktreePath: observation.worktreePath, runtimePath,
      terminalPushObservation: scope }) : fallback;
    request.contextSources = sources.sources;
    await this.attachRuntimeCallbacks(state, request);
    const key = `terminal:${observation.invocationId}`;
    let handle: CollaborationResidentHandle | undefined;
    try {
      await this.waitWhilePaused(state.id, signal);
      handle = await launcher.open({ request, executionRuntimePath: observation.runtimePath,
        filesystemAuthorityInput: await this.filesystemAuthorityInput(state), signal,
        onTrace: this.traceSink(state, observation.agentId, observation.invocationId),
        onOpened: async () => { await database.markTerminalPushObservationOpened({ ...observation, nativeProcessOpened: true });
          await this.publishProjection(state, (await database.projectState(state.id))); },
        sameEpochReopen: { previousRuntimePath: observation.previousRuntimePath,
          revalidate: async () => { this.assertWritable(); signal.throwIfAborted();
            await database.assertTerminalPushObservationLaunch({ ...observation, runtimePath: observation.runtimePath }); } },
        turnRequestFactory: this.turnRequestFactory(state, request),
        controlScope: { projectId: state.id, nodeRunId: observation.nodeRunId, executionId: observation.executionId,
          agentId: observation.agentId, ownershipEpoch: observation.ownershipEpoch,
          role: "execution-artifact", terminalPushObservation: scope },
        controlAuthorityFactory: terminalPushObservationControlAuthorityFactory({ state, database, storage: this.#storage,
          observation, git: await this.git(state.id), repository: this.repository(state), signal,
          assertCurrent: async () => { this.assertWritable();
            // A pending Pause lets the current model reach its safe point;
            // new turns cannot acquire tools until the user resumes.
            if (this.#shuttingDown || this.#cancellingProjects.has(state.id) ||
              this.#pausedProjects.has(state.id) && !(this.#activeTurns.get(state.id) ?? 0)) {
              throw new Error("Original receipt turn authority was revoked");
            } } }) });
      this.#residents.set(key, { projectId: state.id, observation, handle });
      await this.waitWhilePaused(state.id, signal);
      this.#activeTurns.set(state.id, (this.#activeTurns.get(state.id) ?? 0) + 1);
      try {
        const result = await this.submitNativeTurn(state, handle, { inputId: `terminal-observation:${observation.invocationId}`,
          invocationId: observation.invocationId, prompt: assignment });
        if (typeof result.handoff === "string" && result.handoff.trim()) {
          const output = redactTrace(result.handoff);
          const handoffPath = await this.#storage.writeHandoff(state, observation.agentId, observation.invocationId, output);
          await database.recordTerminalPushObservationResult({ ...observation, output, handoffPath });
          await this.publishProjection(state, (await database.projectState(state.id)));
        }
      } finally {
        const remaining = Math.max(0, (this.#activeTurns.get(state.id) ?? 1) - 1);
        if (!remaining) { this.#activeTurns.delete(state.id);
          for (const resolve of this.#turnIdleWaiters.get(state.id) ?? []) resolve();
          this.#turnIdleWaiters.delete(state.id);
        } else this.#activeTurns.set(state.id, remaining);
      }
      await this.waitWhilePaused(state.id, signal);
    } catch (error) {
      if (!signal.aborted && !this.#shuttingDown && !this.#cancellingProjects.has(state.id)) {
        await database.appendEvent({ projectId: state.id, agentId: observation.agentId, invocationId: observation.invocationId,
          requestId: `terminal-observation-failure:${observation.invocationId}`,
          type: "agent.terminal_push_observation.failed", payload: { executionId: observation.executionId,
            ownershipEpoch: observation.ownershipEpoch, error: safeRuntimeError(error) } });
      }
    } finally {
      // open may fail after spawning. Only a real handle.close or the trusted
      // exact-native reconciliation can release this reservation.
      if (handle) { await handle.close(); await this.recordTerminalNativeStopped(observation, { residentClosed: true }); }
      else { const stopped = await this.observeTerminalNativeStop(state, observation, observation.runtimePath);
        await this.recordTerminalNativeStopped(observation, stopped.evidence); }
      this.#residents.delete(key);
      await this.publishProjection(state, (await database.projectState(state.id)));
    }
  }

  private async drainPendingRoutes(state: ProjectState, signal: AbortSignal): Promise<boolean> {
    const pending = await this.database().pendingRoutes(state.id, 100);
    if (pending.length === 0) return false;
    for (const outbox of pending) {
      if (outbox.sourceGroupRunId) {
        await this.releaseCompletedGroupWorktree(state, outbox.sourceGroupRunId, signal);
      }
      const activationRequestId = `route-${outbox.routeEmissionId}`;
      const output = typeof outbox.payload.output === "string"
        ? outbox.payload.output
        : "Recovered collaboration route";
      if (outbox.targetNodeId === "finish") {
        await this.database().deliverRoute({
          projectId: state.id,
          routeEmissionId: outbox.routeEmissionId,
          activationRequestId: `finish-${outbox.routeEmissionId}`
        });
        await this.publishProjection(state, (await this.database().projectState(state.id)));
        state.status = "completed";
        state.phase = "completed";
        state.completedAt ??= new Date().toISOString();
        state.lastError = undefined;
        await this.saveState(state);
        continue;
      }
      const projection = await this.database().projectState(state.id);
      const existingConsumer = projection.nodeRuns.find((node) =>
        node.activationRequestId === activationRequestId
      );
      if (existingConsumer) {
        // The consumer activation committed before a crash but its outbox ACK
        // did not. ACK that durable fact and let normal active-run recovery
        // resume it; never create a second execution.
        await this.database().deliverRoute({
          projectId: state.id,
          routeEmissionId: outbox.routeEmissionId,
          activationRequestId
        });
        await this.publishProjection(state, (await this.database().projectState(state.id)));
        continue;
      }
      const sourceNode = projection.nodeRuns.find((node) => node.id === outbox.sourceNodeRunId);
      const sourceGroup = outbox.sourceGroupRunId
        ? projection.groupRuns.find((group) => group.id === outbox.sourceGroupRunId)
        : undefined;
      const sourceAgentId = sourceGroup?.leaderAgentId ??
        (sourceNode?.node.kind === "agent" ? sourceNode.node.agentId : "main");
      const activatedByAgentId = routeActivationActor({
        ...(outbox.sourceGroupRunId ? { sourceGroupRunId: outbox.sourceGroupRunId } : {}),
        sourceAgentId,
        routeKind: outbox.decisionKind,
        ...(outbox.selectedByAgentId
          ? { selectedByAgentId: outbox.selectedByAgentId }
          : {})
      });
      await this.activateAndRunNode(state, outbox.targetNodeId, {
        activationRequestId,
        inputSnapshotRef: `route:${outbox.routeEmissionId}`,
        assignment: output,
        activatedByAgentId,
        sourceNodeRunId: outbox.sourceNodeRunId,
        ...(outbox.sourceGroupRunId ? { sourceGroupRunId: outbox.sourceGroupRunId } : {}),
        sourceAgentId,
        sourceRouteKind: outbox.decisionKind,
        ...(outbox.selectedByAgentId
          ? { sourceRouteSelectedByAgentId: outbox.selectedByAgentId }
          : {})
      }, signal, async () => {
        await this.database().deliverRoute({
          projectId: state.id,
          routeEmissionId: outbox.routeEmissionId,
          activationRequestId
        });
        await this.publishProjection(state, (await this.database().projectState(state.id)));
      });
      return true;
    }
    return false;
  }

  private async reconcileActiveExecution(
    state: ProjectState,
    projection: CredentialFreeProjectStateProjection,
    signal: AbortSignal
  ): Promise<void> {
    const activeNode = projection.nodeRuns.find((node) => node.id === projection.activeNodeRunId);
    if (projection.scopedGroupRuns && activeNode?.node.kind === "collaboration") {
      const root = projection.scopedGroupRuns.find((group) => !group.parentGroupRunId &&
        group.activationRequestId === activeNode.activationRequestId);
      if (root) { await this.advanceScopedGroup(state, root, signal); return; }
      throw new CollaborationStateError("INVALID_STATE_TRANSITION",
        "Scoped active collaboration node has no persisted root group");
    }
    const activeGroup = projection.groupRuns.find((item) =>
      item.nodeRunId === projection.activeNodeRunId &&
      !["completed", "failed", "cancelled"].includes(item.status)
    );
    if (activeGroup) {
      await this.reconcileActiveGroup(state, projection, activeGroup, signal);
      return;
    }
    const execution = projection.executions.find((item) =>
      item.nodeRunId === projection.activeNodeRunId &&
      !["succeeded", "failed", "cancelled", "stopped", "superseded"].includes(item.status)
    );
    if (!execution) {
      const stopped = projection.executions.find((item) => {
        if (item.nodeRunId !== projection.activeNodeRunId || item.groupRunId ||
          item.status !== "stopped") return false;
        const task = projection.tasks.find((candidate) => candidate.id === item.taskId);
        return task?.status === "continuation_pending" && task.currentExecutionId === item.id;
      });
      if (stopped) {
        const recoveryStartedAt = nowIso();
        const recoveryOperation = `standalone.recovery:${stopped.id}`;
        const recovered = await this.recoverStandaloneAfterServiceRestart(
          state,
          stopped,
          signal,
          true
        );
        if (recovered) {
          if ((await this.recordStandaloneRecoverySuccess(state, stopped, recoveryOperation, recoveryStartedAt))) {
            await this.publishProjection(state, (await this.database().projectState(state.id)));
          }
          return;
        }
        await this.appendFailureAttempt(state, {
          scope: "resident",
          operation: recoveryOperation,
          error: new Error("Stop-confirmed standalone ownership could not reopen safely"),
          errorCode: "RESIDENT_RECOVERY_REOPEN_FAILED",
          retryable: true,
          startedAt: recoveryStartedAt,
          agentId: stopped.agentId,
          nodeRunId: stopped.nodeRunId,
          taskId: stopped.taskId,
          executionId: stopped.id,
          ...(stopped.invocationId ? { invocationId: stopped.invocationId } : {}),
          ownershipEpoch: stopped.ownershipEpoch
        });
        state.status = "retrying";
        state.phase = "collaboration:resident-stopped";
        state.lastError = "Stop-confirmed standalone ownership could not reopen safely";
        await this.publishProjection(state, (await this.database().projectState(state.id)));
        await this.saveState(state);
        return;
      }
      const succeeded = projection.executions.find((item) =>
        item.nodeRunId === projection.activeNodeRunId && !item.groupRunId && item.status === "succeeded"
      );
      if (succeeded) {
        const outcome = await this.completeStandaloneRoute(
          state,
          succeeded,
          succeeded.output ?? "Recovered collaboration result",
          signal
        );
        await this.dispatchStandaloneOutcome(state, outcome, signal);
        return;
      }
      const activated = projection.nodeRuns.find((item) =>
        item.id === projection.activeNodeRunId && item.node.kind === "agent" &&
        !["completed", "failed", "cancelled"].includes(item.status)
      );
      if (activated?.node.kind === "agent") {
        if (activated.node.agentId === "main") {
          // A transactionally accepted apply_workflow may advance S to the
          // next workflow revision before this already-active Main node is
          // completed. Re-running activateNode with the new revision would
          // make the original activation id appear to have another payload.
          // Resume the durable node directly; decideMainRoute consumes the
          // accepted action journal before it can open another model turn.
          await this.runManagementNode(
            state,
            activated,
            activated.optionalTask ?? state.requirement,
            activated.sourceAgentId ?? activated.activatedByAgentId,
            signal
          );
          return;
        }
        // Activation and its upstream outbox ACK are durable before process
        // launch. Re-enter the same deterministic task/execution identities
        // if the service stopped in that narrow window.
        await this.activateAndRunNode(state, activated.node.nodeId, {
          activationRequestId: activated.activationRequestId,
          inputSnapshotRef: activated.inputSnapshotRef,
          assignment: activated.optionalTask ?? state.requirement,
          activatedByAgentId: activated.activatedByAgentId,
          ...(activated.sourceNodeRunId ? { sourceNodeRunId: activated.sourceNodeRunId } : {}),
          ...(activated.sourceAgentId ? { sourceAgentId: activated.sourceAgentId } : {})
        }, signal);
        return;
      }
      await this.appendFailureAttempt(state, {
        scope: "resident",
        operation: `standalone.reconciliation:${projection.activeNodeRunId ?? "unknown"}`,
        error: new Error("Active collaboration ownership requires resident reconciliation"),
        errorCode: "RESIDENT_OWNERSHIP_UNRESOLVED",
        retryable: true,
        ...(projection.activeNodeRunId ? { nodeRunId: projection.activeNodeRunId } : {}),
        metadata: { activeNodeRunId: projection.activeNodeRunId }
      });
      state.status = "retrying";
      state.phase = "collaboration:recovery-required";
      state.lastError = "Active collaboration ownership requires resident reconciliation";
      await this.publishProjection(state, (await this.database().projectState(state.id)));
      await this.saveState(state);
      return;
    }
    const invocationId = execution.invocationId;
    if (!invocationId) {
      throw new Error("Active collaboration execution has no invocation identity");
    }
    const retainedEntry = this.#residents.get(execution.id);
    const retained = retainedEntry?.handle;
    if (!retained) {
      const recoveryStartedAt = nowIso();
      const recoveryOperation = `standalone.recovery:${execution.id}`;
      const recovered = await this.recoverStandaloneAfterServiceRestart(
        state,
        execution,
        signal
      );
      if (recovered) {
        if ((await this.recordStandaloneRecoverySuccess(state, execution, recoveryOperation, recoveryStartedAt))) {
          await this.publishProjection(state, (await this.database().projectState(state.id)));
        }
        return;
      }
      await this.appendFailureAttempt(state, {
        scope: "resident",
        operation: recoveryOperation,
        error: new Error("Resident process stop could not be proven; ownership remains fenced"),
        errorCode: "RESIDENT_STOP_NOT_CONFIRMED",
        retryable: true,
        startedAt: recoveryStartedAt,
        agentId: execution.agentId,
        nodeRunId: execution.nodeRunId,
        taskId: execution.taskId,
        executionId: execution.id,
        ...(execution.invocationId ? { invocationId: execution.invocationId } : {}),
        ownershipEpoch: execution.ownershipEpoch
      });
      state.status = "retrying";
      state.phase = "collaboration:resident-stopped";
      state.lastError = "Resident process stop could not be proven; ownership remains fenced";
      await this.publishProjection(state, (await this.database().projectState(state.id)));
      await this.saveState(state);
      return;
    }
    const handle = retained;
    this.#residents.set(execution.id, {
      projectId: state.id,
      execution,
      ...(retainedEntry?.activity ? { activity: retainedEntry.activity } : {}),
      handle
    });
    const pull = projection.pullRequests.find((item) => item.ownerExecutionId === execution.id);
    if (!execution.groupRunId && pull && pull.status !== "closed") {
      const outcome = await this.resumeStandalonePullRequest(state, execution, pull, handle, signal);
      await this.dispatchStandaloneOutcome(state, outcome, signal);
      return;
    }
    if (!execution.groupRunId && execution.status === "waiting_authorization") {
      const outcome = await this.integrateStandalone(
        state,
        execution,
        execution.waitReason ?? "Resume the retained Git operation after authorization",
        handle,
        signal,
        (await this.persistedStandaloneRouteDecision(state.id, execution))
      );
      await this.dispatchStandaloneOutcome(state, outcome, signal);
      return;
    }
    const task = projection.tasks.find((item) => item.id === execution.taskId);
    // A persisted native return and completion already describe this logical
    // task. Continue its delivery repairs rather than rerunning its business
    // assignment and losing the original completion/route bindings.
    if (state.taskCompletions?.[execution.id] && execution.output) {
      const outcome = await this.integrateStandalone(state, execution, execution.output, handle, signal,
        (await this.persistedStandaloneRouteDecision(state.id, execution)));
      await this.dispatchStandaloneOutcome(state, outcome, signal);
      return;
    }
    const result = await this.submitResident(state, handle, signal, {
      inputId: `input-${execution.id}-recovery-${execution.ownershipEpoch}-${newId("turn")}`,
      invocationId,
      prompt: `Resume the retained execution after coordinator recovery.\n\n${task?.assignment ?? execution.waitReason ?? state.requirement}`
    }, (await this.executionActivityAuthority(state.id, execution)));
    await this.persistArtifactPublicationIntents(state, execution, result);
    const outcome = await this.integrateStandalone(
      state,
      execution,
      result.handoff ?? execution.waitReason ?? "Recovered collaboration result",
      handle,
      signal
    );
    await this.dispatchStandaloneOutcome(state, outcome, signal);
  }

  private async recordStandaloneRecoverySuccess(
    state: ProjectState,
    predecessor: MemberExecution,
    operation: string,
    startedAt: string
  ): Promise<boolean> {
    const current = (await this.database().projectState(state.id)).executions.find((item) => item.id === predecessor.id);
    if (!current || current.ownershipEpoch < predecessor.ownershipEpoch) {
      throw new Error("Recovered standalone execution lost its current ownership record");
    }
    return await this.appendSuccessfulAttempt(state, {
      scope: "resident",
      operation,
      startedAt,
      message: "A later standalone resident recovery attempt succeeded",
      agentId: current.agentId,
      nodeRunId: current.nodeRunId,
      taskId: current.taskId,
      executionId: current.id,
      ...(current.invocationId ? { invocationId: current.invocationId } : {}),
      ownershipEpoch: current.ownershipEpoch,
      metadata: { predecessorOwnershipEpoch: predecessor.ownershipEpoch }
    });
  }

  private async resumeStandalonePullRequest(
    state: ProjectState, execution: MemberExecution, pull: PullRequestRecord,
    resident: CollaborationResidentHandle, signal: AbortSignal
  ): Promise<StandaloneIntegrationOutcome> {
    return this.integrateAgentOwnedStandalone(state, execution,
      execution.waitReason ?? execution.output ?? "Resume retained delivery", resident, signal,
      undefined, pull);
  }

  private async recoverStandaloneAfterServiceRestart(
    state: ProjectState,
    predecessor: MemberExecution,
    signal: AbortSignal,
    alreadyStopped = false
  ): Promise<boolean> {
    const launcher = this.#residentLauncher;
    const durablePrelaunch = Boolean(
      (await this.executionPrelaunchProtocol(state.id, predecessor))
    ) && !(await this.executionLaunchStarted(state.id, predecessor));
    if (!launcher || (!alreadyStopped && !durablePrelaunch &&
      (!launcher.stopForRecovery || !predecessor.invocationId))) {
      return false;
    }
    const database = this.database();
    const remotePull = durablePrelaunch
      ? undefined
      : await this.observeExecutionPullForRecovery(
          state,
          predecessor,
          "main",
          signal
        );
    if (remotePull?.status === "closed") {
      throw new Error(
        `Recovered standalone pull request ${remotePull.providerNumber} is closed; refusing to reuse its execution identity`
      );
    }
    const authorizationResume = !remotePull && (await this.hasRecoverableAuthorizationOutput(
      state.id,
      predecessor
    ));
    let recoverySeed = await database.residentRecoverySeed({
      projectId: state.id,
      scope: "member",
      scopeId: predecessor.id,
      stoppedEpoch: predecessor.ownershipEpoch
    });
    if (!alreadyStopped && !durablePrelaunch) {
      await database.requestExecutionStop({
        projectId: state.id,
        executionId: predecessor.id,
        ownershipEpoch: predecessor.ownershipEpoch,
        reason: "service_restart_reconcile",
        requestId: `restart-stop-${predecessor.id}-${predecessor.ownershipEpoch}`
      });
      const observation = await launcher.stopForRecovery!({
        state: structuredClone(state),
        execution: structuredClone(predecessor),
        executionRuntimePath: await this.#storage.invocationRuntimePath(
          state.id,
          predecessor.invocationId!
        ),
        residentLaunchProtocol: await this.executionStopProtocol(state.id, predecessor)
      });
      const terminalEvidence = observation.stopped && !remotePull
        ? await this.prepareStoppedExecutionForTerminalTransition(
            state,
            predecessor,
            "service_restart_reconcile",
            "handoff"
          )
        : {};
      if (observation.stopped && observation.recovery) {
        recoverySeed = (await this.persistResidentRecoverySeed(observation.recovery, {
          projectId: state.id,
          sourceNodeRunId: predecessor.nodeRunId,
          scope: "member",
          scopeId: predecessor.id,
          agentId: predecessor.agentId,
          harnessId: state.agents[predecessor.agentId]!.harness,
          stoppedEpoch: predecessor.ownershipEpoch
        }));
      }
      await database.confirmExecutionStopped({
        projectId: state.id,
        executionId: predecessor.id,
        ownershipEpoch: predecessor.ownershipEpoch,
        stopped: observation.stopped,
        evidence: { ...observation.evidence, ...terminalEvidence },
        requestId: executionStopObservationRequestId(
          "restart-stop",
          predecessor,
          observation.stopped,
          { ...observation.evidence, ...terminalEvidence }
        )
      });
      if (!observation.stopped) return false;
    }
    const invocationId = durablePrelaunch
      ? predecessor.invocationId!
      : newId("inv");
    let recovered = durablePrelaunch
      ? predecessor
      : (await database.recoverStandaloneExecution({
          projectId: state.id,
          executionId: predecessor.id,
          predecessorOwnershipEpoch: predecessor.ownershipEpoch,
          invocationId,
          residentLaunchProtocol: "trusted-supervisor-v1",
          requestId: `restart-owner-${predecessor.id}-${predecessor.ownershipEpoch + 1}`
        })).execution;
    await this.claimWorkerLaneWithWait(state.id, recovered, signal);
    await (await this.git(state.id)).sessionBegin(
      recovered,
      recovered.ownershipEpoch,
      { kind: "delivery", base: { kind: "main" } },
      signal
    );
    if (recovered.status === "queued") {
      recovered = (await database.transitionExecutionStatus({
        projectId: state.id,
        executionId: recovered.id,
        ownershipEpoch: recovered.ownershipEpoch,
        status: "working",
        invocationId,
        requestId: `execution-running-${recovered.id}-${recovered.ownershipEpoch}`
      })).execution;
    }
    const residentAuthority = await this.executionActivityAuthority(state.id, recovered);
    await this.startRuntimeActivity(state, residentAuthority, {
      kind: "resident",
      phase: "resident:starting",
      invocationId,
      requestId: `runtime-resident-start-${recovered.id}-${recovered.ownershipEpoch}`
    });
    const projection = await database.projectState(state.id);
    const node = projection.nodeRuns.find((item) => item.id === recovered.nodeRunId);
    const task = projection.tasks.find((item) => item.id === recovered.taskId);
    if (!node || node.node.kind !== "agent" || !task) {
      throw new Error("Recovered standalone execution lost its node/task authority");
    }
    const assignment = task.assignment;
    const businessAssignment = await this.businessAssignmentWithOwnManagement(
      state,
      recovered.agentId,
      assignment,
      signal
    );
    const inboxPath = await this.#storage.writeInbox(
      state,
      recovered.agentId,
      invocationId,
      businessAssignment
    );
    const runtimePath = await this.#storage.invocationRuntimePath(state.id, invocationId);
    const fallback: AgentRunRequest = {
      project: structuredClone(state),
      purpose: "workflow",
      agent: recovered.agentId,
      kind: recovered.agentId === "main" ? "main" : "worker",
      permission: state.agents[recovered.agentId].permission,
      invocationId,
      inboxPath,
      projectPath: this.#storage.projectDir(state.id),
      workspacePath: recovered.worktreePath,
      schemaPath: "",
      skillPaths: [],
      autoSkillPaths: [],
      availableSkillPaths: [],
      runtimePath,
      executionContext: {
        nodeRunId: recovered.nodeRunId,
        taskId: recovered.taskId,
        executionId: recovered.id,
        role: "delivery",
        ownershipEpoch: recovered.ownershipEpoch,
        executionWorktree: recovered.worktreePath
      }
    };
    const request = this.#executionInputBuilder
      ? await this.#executionInputBuilder.build({
          state,
          agentId: recovered.agentId,
          execution: recovered,
          executionContext: fallback.executionContext!,
          assignment: businessAssignment,
          invocationId,
          inboxPath,
          projectPath: this.#storage.projectDir(state.id),
          worktreePath: recovered.worktreePath,
          runtimePath
        })
      : fallback;
    await this.attachRuntimeCallbacks(state, request, recovered);
    const candidates = this.workerRouteCandidates(state, recovered.agentId);
    await database.appendEvent({
      projectId: state.id,
      requestId: `execution-launch-${recovered.id}-${recovered.ownershipEpoch}`,
      workflowRevision: state.workflowRevision ?? 1,
      nodeRunId: recovered.nodeRunId,
      agentId: recovered.agentId,
      taskId: recovered.taskId,
      executionId: recovered.id,
      invocationId,
      ownershipEpoch: recovered.ownershipEpoch,
      type: "execution.launch.started",
      payload: {
        worktreePath: recovered.worktreePath,
        runtimePath,
        residentLaunchProtocol: "trusted-supervisor-v1"
      }
    });
    const handle = await launcher.open({
      request,
      executionRuntimePath: runtimePath,
      filesystemAuthorityInput: await this.filesystemAuthorityInput(state),
      signal,
      onTrace: this.traceSink(state, recovered.agentId, invocationId),
      turnRequestFactory: this.turnRequestFactory(
        state,
        request,
        recovered,
        recoverySeed
      ),
      controlScope: candidates.length > 0
        ? {
          projectId: state.id,
          nodeRunId: recovered.nodeRunId,
          executionId: recovered.id,
          agentId: recovered.agentId,
          ownershipEpoch: recovered.ownershipEpoch,
          role: "standalone-route" as const,
          candidates,
          decisionBy: "agent" as const
        }
        : {
            projectId: state.id,
            nodeRunId: recovered.nodeRunId,
            executionId: recovered.id,
            agentId: recovered.agentId,
            ownershipEpoch: recovered.ownershipEpoch,
            role: "execution-artifact" as const
          },
      controlAuthorityFactory: this.standaloneControlAuthorityFactory(
        state,
        recovered.nodeRunId,
        recovered,
        candidates
      )
    });
    this.#residents.set(recovered.id, {
      projectId: state.id,
      execution: recovered,
      activity: { ...residentAuthority, invocationId },
      handle
    });
    const pull = (await database.projectState(state.id)).pullRequests.find((item) =>
      item.ownerExecutionId === recovered.id && !["closed"].includes(item.status)
    );
    let outcome: StandaloneIntegrationOutcome;
    if (pull) {
      outcome = await this.resumeStandalonePullRequest(state, recovered, pull, handle, signal);
    } else if (authorizationResume || (await this.hasRecoverableAuthorizationOutput(state.id, recovered))) {
      const writable = recovered.status === "waiting_authorization"
        ? (await database.transitionExecutionStatus({
            projectId: state.id,
            executionId: recovered.id,
            ownershipEpoch: recovered.ownershipEpoch,
            status: "working",
            waitReason: recovered.waitReason,
            invocationId: recovered.invocationId,
            requestId: `authorization-resume-${recovered.id}-${recovered.ownershipEpoch}`
          })).execution
        : recovered;
      outcome = await this.integrateStandalone(
        state,
        writable,
        writable.waitReason ?? "Resume the persisted Git operation after authorization",
        handle,
        signal,
        (await this.persistedStandaloneRouteDecision(state.id, writable))
      );
    } else {
      const result = await this.submitResident(state, handle, signal, {
        inputId: `input-${recovered.id}-recovery-${recovered.ownershipEpoch}`,
        invocationId,
        prompt: `Resume this stop-confirmed execution after service recovery.\n\n${businessAssignment}`
      }, (await this.executionActivityAuthority(state.id, recovered)));
      await this.persistArtifactPublicationIntents(state, recovered, result);
      const routeDecision = await this.persistStandaloneRouteDecision(state, recovered, result);
      outcome = await this.integrateStandalone(
        state,
        recovered,
        result.handoff ?? "Recovered collaboration result",
        handle,
        signal,
        routeDecision
      );
    }
    await this.dispatchStandaloneOutcome(state, outcome, signal);
    return true;
  }

  private async observeExecutionPullForRecovery(
    state: ProjectState,
    execution: MemberExecution,
    expectedBase: string,
    signal: AbortSignal
  ): Promise<PullRequestRecord | undefined> {
    const database = this.database();
    const projection = await database.projectState(state.id);
    const persisted = projection.pullRequests.find((item) =>
      item.ownerExecutionId === execution.id
    );
    const git = await this.git(state.id);
    let observed: GitHubPullRequestFact | undefined;
    if (persisted) {
      observed = await git.observePullRequest({
        repository: this.repository(state),
        providerNumber: persisted.providerNumber,
        ownerExecutionId: execution.id,
        signal
      });
      if (!observed) {
        throw new Error(
          `Persisted pull request ${persisted.providerNumber} disappeared during restart reconciliation`
        );
      }
    } else if (git.observePullRequestForExecution) {
      observed = await git.observePullRequestForExecution({
        repository: this.repository(state),
        execution,
        expectedBase,
        signal
      });
    }
    const unresolvedCreate = projection.operations.some((operation) =>
      operation.kind === "pull.create" &&
      operation.ownerExecutionId === execution.id &&
      operation.ownershipEpoch === execution.ownershipEpoch &&
      operation.status !== "failed"
    );
    if (!observed) {
      if (unresolvedCreate) {
        throw new Error(
          `Pull-request creation for ${execution.id}@${execution.ownershipEpoch} has no confirmed remote fact; refusing recovery handoff`
        );
      }
      return undefined;
    }
    if (
      observed.ownerExecutionId !== execution.id ||
      observed.head !== execution.executionBranch ||
      observed.base !== expectedBase
    ) {
      throw new Error(
        `Remote pull request ${observed.providerNumber} does not match the fenced execution head/base`
      );
    }
    const recorded = await database.observePullRequest({
      projectId: state.id,
      executionId: execution.id,
      ownershipEpoch: execution.ownershipEpoch,
      pullRequest: pullRequestRecord(observed),
      requestId: `restart-pull-observe-${executionEpochIdentity(execution)}-${pullRecoveryFactKey(observed)}`
    });
    return recorded.pullRequest;
  }

  private async reconcileActiveGroup(
    state: ProjectState,
    projection: CredentialFreeProjectStateProjection,
    group: GroupRun,
    signal: AbortSignal
  ): Promise<void> {
    if (group.status === "paused") {
      // S owns durable all-member pauses. A stale file/scheduler snapshot
      // must not touch Git, recover the coordinator epoch, or open Main.
      return;
    }
    const nodeRun = projection.nodeRuns.find((item) => item.id === group.nodeRunId);
    if (!nodeRun || nodeRun.node.kind !== "collaboration") {
      throw new Error("Active group has no collaboration node projection");
    }
    const collaborationNode = nodeRun.node;
    const definition = (state.orchestration.collaborations ?? [])
      .find((item) => item.id === collaborationNode.groupId);
    if (!definition) throw new Error(`Recovered group ${collaborationNode.groupId} is not in the workflow`);
    // Activation and upstream ACK intentionally precede the remote branch
    // side effect. Reconcile that crash window before opening any resident;
    // beginGroup is journaled under the same stable operation id and must
    // either observe the expected ref or fail closed on divergent history.
    const reconciledGroup = await (await this.git(state.id)).beginGroup({
      repository: this.repository(state),
      groupRunId: group.id,
      baseCommit: group.baseCommit,
      operationId: `push-group-${group.id}`,
      signal
    });
    if (reconciledGroup.group.branch !== group.groupBranch ||
      reconciledGroup.group.baseCommit !== group.baseCommit ||
      reconciledGroup.remote.sha !== group.baseCommit) {
      throw new Error("Recovered group branch diverged from its fenced activation base");
    }
    const observeRemoteRef = (await this.git(state.id)).observeRemoteRef;
    const currentGroupRef = observeRemoteRef
      ? await observeRemoteRef.call(
          (await this.git(state.id)),
          this.repository(state),
          group.groupBranch,
          signal
        )
      : reconciledGroup.remote;
    if (currentGroupRef.status !== "present" || !currentGroupRef.sha) {
      throw new Error("Recovered group branch has no confirmed remote head");
    }
    this.#branchHeads.set(`${state.id}:${group.groupBranch}`, currentGroupRef.sha);
    const leaderKey = `leader:${group.id}`;
    let currentGroup = group;
    let leader = this.#residents.get(leaderKey)?.handle;
    const leaderRecoveryStartedAt = nowIso();
    const leaderRecoveryOperation = `group-leader.recovery:${group.id}`;
    let leaderRecoveryObservation: Awaited<ReturnType<
      NonNullable<CollaborationResidentLauncher["stopLeaderForRecovery"]>
    >> | undefined;
    if (!leader) {
      // A service restart cannot reconnect the old leader's inherited stdio.
      // Obtain and persist stop evidence now, but do not advance the
      // coordinator epoch or open a new management authority until every
      // member writer below has also been observed and fenced.
      const priorProof = await this.database().coordinatorStopProof(
        state.id,
        currentGroup.id,
        currentGroup.coordinatorEpoch
      );
      const stopLeaderForRecovery = this.#residentLauncher?.stopLeaderForRecovery;
      if (!priorProof && !stopLeaderForRecovery) {
        await this.appendFailureAttempt(state, {
          scope: "resident",
          operation: leaderRecoveryOperation,
          error: new Error("Active group leader lacks stop-confirm recovery"),
          errorCode: "GROUP_LEADER_RECOVERY_UNAVAILABLE",
          retryable: true,
          startedAt: leaderRecoveryStartedAt,
          agentId: currentGroup.actingCoordinatorId ?? currentGroup.leaderAgentId,
          nodeRunId: currentGroup.nodeRunId,
          groupRunId: currentGroup.id,
          invocationId: groupLeaderInvocationId(
            state.id,
            currentGroup.id,
            currentGroup.coordinatorEpoch
          ),
          coordinatorEpoch: currentGroup.coordinatorEpoch
        });
        state.status = "retrying";
        state.phase = "collaboration:group-leader-recovery-required";
        state.lastError = "Active group leader lacks stop-confirm recovery";
        await this.publishProjection(state, (await this.database().projectState(state.id)));
        await this.saveState(state);
        return;
      }
      const observation = priorProof
        ? {
            stopped: true,
            evidence: (priorProof.payload.evidence ?? {}) as Readonly<Record<string, unknown>>,
            recovery: await this.database().residentRecoverySeed({
              projectId: state.id,
              scope: "group-leader",
              scopeId: currentGroup.id,
              stoppedEpoch: currentGroup.coordinatorEpoch
            })
          }
        : await stopLeaderForRecovery!({
            state: structuredClone(state),
            groupRun: structuredClone(currentGroup),
            nodeRunId: currentGroup.nodeRunId,
            leaderInvocationId: groupLeaderInvocationId(
              state.id,
              currentGroup.id,
              currentGroup.coordinatorEpoch
            ),
            executionRuntimePath: this.leaderRuntimePath(state.id, currentGroup.id),
            residentLaunchProtocol: await this.leaderLaunchProtocol(state.id, currentGroup)
          });
      if (!observation.stopped) {
        await this.appendFailureAttempt(state, {
          scope: "resident",
          operation: leaderRecoveryOperation,
          error: new Error("Active group leader process is not stop-confirmed"),
          errorCode: "GROUP_LEADER_STOP_NOT_CONFIRMED",
          retryable: true,
          startedAt: leaderRecoveryStartedAt,
          agentId: currentGroup.actingCoordinatorId ?? currentGroup.leaderAgentId,
          nodeRunId: currentGroup.nodeRunId,
          groupRunId: currentGroup.id,
          invocationId: groupLeaderInvocationId(
            state.id,
            currentGroup.id,
            currentGroup.coordinatorEpoch
          ),
          coordinatorEpoch: currentGroup.coordinatorEpoch,
          metadata: { evidence: observation.evidence }
        });
        state.status = "retrying";
        state.phase = "collaboration:group-leader-recovery-required";
        state.lastError = "Active group leader process is not stop-confirmed";
        await this.publishProjection(state, (await this.database().projectState(state.id)));
        await this.saveState(state);
        return;
      }
      const persistedLeaderRecovery = observation.recovery
        ? (await this.persistResidentRecoverySeed(observation.recovery, {
            projectId: state.id,
            sourceNodeRunId: currentGroup.nodeRunId,
            scope: "group-leader",
            scopeId: currentGroup.id,
            agentId: currentGroup.actingCoordinatorId ?? currentGroup.leaderAgentId,
            harnessId: state.agents[
              currentGroup.actingCoordinatorId ?? currentGroup.leaderAgentId
            ]!.harness,
            stoppedEpoch: currentGroup.coordinatorEpoch
          }))
        : undefined;
      if (!priorProof) {
        await this.database().confirmCoordinatorStopped({
          projectId: state.id,
          groupRunId: currentGroup.id,
          coordinatorEpoch: currentGroup.coordinatorEpoch,
          evidence: observation.evidence,
          reason: "service_restart",
          requestId: `restart-leader-stop-proof-${currentGroup.id}-${currentGroup.coordinatorEpoch}`
        });
      }
      leaderRecoveryObservation = {
        ...observation,
        ...(persistedLeaderRecovery ? { recovery: persistedLeaderRecovery } : {})
      };
    }

    const activeExecutions: MemberExecution[] = [];
    for (const execution of projection.executions) {
      if (execution.groupRunId !== currentGroup.id ||
        ["succeeded", "failed", "cancelled", "superseded"].includes(execution.status)) {
        continue;
      }
      if (execution.status !== "stopped") { activeExecutions.push(execution); continue; }
      const task = projection.tasks.find((item) => item.id === execution.taskId);
      const hasRemotePullBoundary = projection.pullRequests.some((pull) =>
        pull.ownerExecutionId === execution.id
      ) || projection.operations.some((operation) =>
        operation.kind === "pull.create" &&
        operation.ownerExecutionId === execution.id &&
        operation.ownershipEpoch === execution.ownershipEpoch &&
        operation.status !== "failed"
      );
      const canonicalPrePullRetry = canonicalFinalRepairForExecution(
        projection,
        currentGroup,
        execution
      ) !== undefined;
      const authorizationOutputRetry = await this.hasRecoverableAuthorizationOutput(
        state.id,
        execution
      );
      if (task?.status === "continuation_pending" &&
        task.currentExecutionId === execution.id &&
        (hasRemotePullBoundary || canonicalPrePullRetry || authorizationOutputRetry ||
          (await this.hasExactRestartStopProvenance(state.id, execution)) ||
          (await this.database().executionHasResumableStopProvenance(state.id, execution.id, execution.ownershipEpoch)))) activeExecutions.push(execution);
    }
    const recoveryPlans: Array<{
      execution: MemberExecution;
      task: WorkTask | undefined;
      retained: CollaborationResidentHandle | undefined;
      prelaunched: boolean;
      authorizationResume: boolean;
      remotePull: PullRequestRecord | undefined;
      recoverySeed?: ResidentRecoveryProofSeed;
    }> = [];

    // Phase one is observation and fencing only. Reconcile every provider PR
    // and stop-confirm every disconnected writer before any successor or new
    // ownership epoch is allowed to open a resident.
    for (const execution of activeExecutions) {
      const invocationId = execution.invocationId;
      let alreadyStopped = execution.status === "stopped";
      if (!invocationId && !alreadyStopped) {
        throw new Error(`Recovered execution ${execution.id} has no invocation identity`);
      }
      const retainedEntry = this.#residents.get(execution.id);
      // A stop-requested resident is poisoned even when its in-memory handle
      // survived a failed close. It must pass exact stop reconciliation and
      // can never be submitted again as a retained writer.
      const retained = execution.status === "stop_requested"
        ? undefined
        : retainedEntry?.handle;
      if (execution.status === "stop_requested" && retainedEntry) {
        this.#residents.delete(execution.id);
      }
      const task = projection.tasks.find((item) => item.id === execution.taskId);
      const durableCanonicalPrelaunch = execution.status === "queued" && Boolean(
        canonicalFinalRepairForExecution(projection, currentGroup, execution)
      );
      const durableCreationPrelaunch = Boolean(
        (await this.executionPrelaunchProtocol(state.id, execution))
      ) && !(await this.executionLaunchStarted(state.id, execution));
      const authorizationResume = await this.hasRecoverableAuthorizationOutput(
        state.id,
        execution
      );
      let prelaunched = !retained && !alreadyStopped && execution.status !== "stop_requested" && (
        durableCreationPrelaunch ||
        durableCanonicalPrelaunch && !(await this.executionLaunchStarted(state.id, execution)) ||
        this.#prelaunchExecutions.delete(execution.id)
      );
      let recoverySeed = await this.database().residentRecoverySeed({
        projectId: state.id,
        scope: "member",
        scopeId: execution.id,
        stoppedEpoch: execution.ownershipEpoch
      });
      if (
        durableCanonicalPrelaunch &&
        !retained &&
        (await this.executionLaunchStarted(state.id, execution))
      ) {
        const stopForRecovery = this.#residentLauncher?.stopForRecovery;
        if (!stopForRecovery || !invocationId) {
          throw new Error(
            `Queued canonical execution ${execution.id} has launch intent but no stop-confirm recovery`
          );
        }
        await this.database().requestExecutionStop({
          projectId: state.id,
          executionId: execution.id,
          ownershipEpoch: execution.ownershipEpoch,
          reason: "service_restart_reconcile",
          requestId: `restart-stop-${execution.id}-${execution.ownershipEpoch}`
        });
        const observation = await stopForRecovery({
          state: structuredClone(state),
          execution: structuredClone(execution),
          executionRuntimePath: await this.#storage.invocationRuntimePath(state.id, invocationId),
          residentLaunchProtocol: await this.executionStopProtocol(state.id, execution)
        });
        if (!observation.stopped) {
          throw new Error(
            `Queued canonical execution ${execution.id} has unresolved launch intent; refusing a second resident`
          );
        }
        const terminalEvidence = await this.prepareStoppedExecutionForTerminalTransition(
          state,
          execution,
          "service_restart_reconcile",
          "handoff"
        );
        if (observation.stopped && observation.recovery) {
          recoverySeed = (await this.persistResidentRecoverySeed(observation.recovery, {
            projectId: state.id,
            sourceNodeRunId: execution.nodeRunId,
            scope: "member",
            scopeId: execution.id,
            agentId: execution.agentId,
            harnessId: state.agents[execution.agentId]!.harness,
            stoppedEpoch: execution.ownershipEpoch
          }));
        }
        await this.database().confirmExecutionStopped({
          projectId: state.id,
          executionId: execution.id,
          ownershipEpoch: execution.ownershipEpoch,
          stopped: true,
          evidence: { ...observation.evidence, ...terminalEvidence },
          requestId: `restart-stop-confirm-${execution.id}-${execution.ownershipEpoch}`
        });
        alreadyStopped = true;
        prelaunched = false;
      }
      const expectedBase = await this.database().executionPullBase(state.id, execution.id);
      const remotePull = await this.observeExecutionPullForRecovery(
        state,
        execution,
        expectedBase,
        signal
      );
      if (!retained && !prelaunched && !alreadyStopped) {
        const stopForRecovery = this.#residentLauncher?.stopForRecovery;
        if (!stopForRecovery) {
          throw new Error(`Active group execution ${execution.id} lacks stop-confirm recovery`);
        }
        await this.database().requestExecutionStop({
          projectId: state.id,
          executionId: execution.id,
          ownershipEpoch: execution.ownershipEpoch,
          reason: "service_restart_reconcile",
          requestId: `restart-stop-${execution.id}-${execution.ownershipEpoch}`
        });
        const observation = await stopForRecovery({
          state: structuredClone(state),
          execution: structuredClone(execution),
          executionRuntimePath: await this.#storage.invocationRuntimePath(state.id, invocationId!),
          residentLaunchProtocol: await this.executionStopProtocol(state.id, execution)
        });
        const stopReason = (await this.database().latestExecutionStopRequest(
          state.id,
          execution.id,
          execution.ownershipEpoch
        ))?.payload.reason;
        const terminalEvidence = observation.stopped &&
          ((!remotePull || remotePull.status === "closed") ||
            stopReason !== "service_restart_reconcile")
          ? await this.prepareStoppedExecutionForTerminalTransition(
              state,
              execution,
              "service_restart_reconcile",
              "handoff"
            )
          : {};
        if (observation.stopped && observation.recovery) {
          recoverySeed = (await this.persistResidentRecoverySeed(observation.recovery, {
            projectId: state.id,
            sourceNodeRunId: execution.nodeRunId,
            scope: "member",
            scopeId: execution.id,
            agentId: execution.agentId,
            harnessId: state.agents[execution.agentId]!.harness,
            stoppedEpoch: execution.ownershipEpoch
          }));
        }
        await this.database().confirmExecutionStopped({
          projectId: state.id,
          executionId: execution.id,
          ownershipEpoch: execution.ownershipEpoch,
          stopped: observation.stopped,
          evidence: { ...observation.evidence, ...terminalEvidence },
          requestId: executionStopObservationRequestId(
            "restart-stop",
            execution,
            observation.stopped,
            { ...observation.evidence, ...terminalEvidence }
          )
        });
        if (!observation.stopped) {
          throw new Error(`Active group execution ${execution.id} is not stop-confirmed`);
        }
      }
      recoveryPlans.push({
        execution,
        task,
        retained,
        prelaunched,
        authorizationResume,
        remotePull,
        ...(recoverySeed ? { recoverySeed } : {})
      });
    }

    // Phase two may advance epochs and create writers only after phase one
    // proved both the coordinator and every disconnected member predecessor
    // stopped, and persisted every discoverable remote PR fact.
    if (!leader) {
      if (!leaderRecoveryObservation?.stopped) {
        throw new Error("Recovered group leader lacks durable stop confirmation");
      }
      currentGroup = (await this.database().recoverCoordinatorOwnership({
        projectId: state.id,
        groupRunId: currentGroup.id,
        expectedCoordinatorEpoch: currentGroup.coordinatorEpoch,
        stopped: true,
        evidence: leaderRecoveryObservation.evidence,
        residentLaunchProtocol: "trusted-supervisor-v1",
        leaderInvocationId: groupLeaderInvocationId(
          state.id,
          currentGroup.id,
          currentGroup.coordinatorEpoch + 1
        ),
        leaderRuntimePath: this.leaderRuntimePath(state.id, currentGroup.id),
        requestId: `restart-leader-${currentGroup.id}-${currentGroup.coordinatorEpoch}`
      })).groupRun;
      leader = (await this.openGroupCoordinatorResident(
        state,
        currentGroup,
        nodeRun.optionalTask ?? state.requirement,
        signal,
        leaderRecoveryObservation.recovery
      )).leader;
    } else {
      await this.database().claimManagementLane({
        projectId: state.id,
        groupRunId: currentGroup.id,
        agentId: currentGroup.actingCoordinatorId ?? currentGroup.leaderAgentId,
        coordinatorEpoch: currentGroup.coordinatorEpoch
      });
    }
    if ((await this.appendSuccessfulAttempt(state, {
      scope: "resident",
      operation: leaderRecoveryOperation,
      startedAt: leaderRecoveryStartedAt,
      message: "A later group leader recovery attempt succeeded",
      agentId: currentGroup.actingCoordinatorId ?? currentGroup.leaderAgentId,
      nodeRunId: currentGroup.nodeRunId,
      groupRunId: currentGroup.id,
      invocationId: groupLeaderInvocationId(
        state.id,
        currentGroup.id,
        currentGroup.coordinatorEpoch
      ),
      coordinatorEpoch: currentGroup.coordinatorEpoch
    }))) {
      await this.publishProjection(state, (await this.database().projectState(state.id)));
    }
    const leaderEntry = this.#residents.get(leaderKey);
    this.#residents.set(leaderKey, {
      projectId: state.id,
      ...(leaderEntry?.activity ? { activity: leaderEntry.activity } : {}),
      handle: leader
    });

    // Phase two may create writers because phase one proved every disconnected
    // predecessor stopped and persisted every discoverable remote PR fact.
    // Restore every restart-fenced member before running any one chain. If the
    // first resumed turn then fails for real, the untouched peers remain
    // healthy survivors instead of being mistaken for an all-members failure.
    for (const plan of recoveryPlans) {
      const current = (await this.database().projectState(state.id)).executions.find((candidate) =>
        candidate.id === plan.execution.id
      );
      if (current?.status === "stopped" &&
        (await this.hasExactRestartStopProvenance(state.id, current))) {
        await this.database().restoreRestartStoppedMemberEligibility({
          projectId: state.id,
          groupRunId: currentGroup.id,
          executionId: current.id,
          ownershipEpoch: current.ownershipEpoch,
          requestId: `restart-eligibility-${executionEpochIdentity(current)}`
        });
      }
    }
    // Run live/prelaunch owners before stopped continuations. A stopped task
    // may need one of those healthy-but-busy members after its current writer
    // settles; treating temporary busyness as all-members-failed deadlocks the
    // same oldest recovery plan on every restart.
    const recoveryPriority = async (plan: (typeof recoveryPlans)[number]): Promise<number> => {
      if (plan.retained || plan.prelaunched) return 0;
      if (plan.execution.status !== "stopped") return 1;
      const stopReason = (await this.database().latestExecutionStopRequest(
        state.id,
        plan.execution.id,
        plan.execution.ownershipEpoch
      ))?.payload.reason;
      return stopReason === "service_restart_reconcile" ? 1 : 2;
    };
    const priorities = new Map<(typeof recoveryPlans)[number], number>();
    for (const plan of recoveryPlans) priorities.set(plan, await recoveryPriority(plan));
    recoveryPlans.sort((left, right) => priorities.get(left)! - priorities.get(right)!);
    for (const plan of recoveryPlans) {
      const {
        execution,
        task,
        retained,
        prelaunched,
        authorizationResume,
        remotePull,
        recoverySeed
      } = plan;
      const recoveryStopReason = (await this.database().latestExecutionStopRequest(
        state.id,
        execution.id,
        execution.ownershipEpoch
      ))?.payload.reason;
      const resumableStop = await this.database().executionHasResumableStopProvenance(
        state.id, execution.id, execution.ownershipEpoch
      );
      // A provider observation is input for the original Agent. Even a
      // merged PR does not authorize the system to synchronize or finish it.
      if (retained) {
        const retainedEntry = this.#residents.get(execution.id);
        this.#residents.set(execution.id, {
          projectId: state.id,
          execution,
          ...(retainedEntry?.activity ? { activity: retainedEntry.activity } : {}),
          handle: retained
        });
        if (remotePull) {
          const settled = await this.runGroupExecutionWithRecovery(
            state,
            currentGroup,
            execution,
            `Resume the retained group pull after coordinator recovery.\n\n${task?.assignment ?? execution.waitReason ?? "Complete the assigned group task."}`,
            (await this.database().executionPullBase(state.id, execution.id)),
            signal,
            retained,
            undefined,
            execution.status === "waiting_authorization",
            remotePull
          );
          if (settled.status === "stopped") {
            const continued = await this.resumeContinuationTask(
              state,
              currentGroup,
              leader,
              signal,
              undefined,
              settled.id
            );
            if (continued === "fault-paused") return;
            if (continued === "idle" && (await this.database().projectState(state.id)).groupRuns.some((candidate) =>
              candidate.id === currentGroup.id && candidate.status === "paused"
            )) return;
          }
          continue;
        }
        await (await this.git(state.id)).sessionBegin(
          execution,
          execution.ownershipEpoch,
          execution.purpose === "final-integration"
            ? { kind: "final-integration", groupRunId: currentGroup.id }
            : { kind: "delivery", base: { kind: "group", groupRunId: currentGroup.id } },
          signal
        );
        const settled = await this.runGroupExecutionWithRecovery(
          state,
          currentGroup,
          execution,
          `Resume the retained group execution after coordinator recovery.\n\n${task?.assignment ?? execution.waitReason ?? "Complete the assigned group task."}`,
          (await this.database().executionPullBase(state.id, execution.id)),
          signal,
          retained,
          undefined,
          execution.status === "waiting_authorization"
        );
        if (settled.status === "stopped") {
          const continued = await this.resumeContinuationTask(
            state,
            currentGroup,
            leader,
            signal,
            undefined,
            settled.id
          );
          if (continued === "fault-paused") return;
          if (continued === "idle" && (await this.database().projectState(state.id)).groupRuns.some((candidate) =>
            candidate.id === currentGroup.id && candidate.status === "paused"
          )) return;
        }
        continue;
      }
      if (prelaunched) {
        await this.claimWorkerLaneWithWait(state.id, execution, signal);
        await (await this.git(state.id)).sessionBegin(
          execution,
          execution.ownershipEpoch,
          execution.purpose === "final-integration"
            ? { kind: "final-integration", groupRunId: currentGroup.id }
            : { kind: "delivery", base: { kind: "group", groupRunId: currentGroup.id } },
          signal
        );
        const settled = await this.runGroupExecutionWithRecovery(
          state,
          currentGroup,
          execution,
          `Resume durable prelaunch task ownership at epoch ${execution.ownershipEpoch}.\n\n${task?.assignment ?? execution.waitReason ?? "Complete the recovered group task."}`,
          (await this.database().executionPullBase(state.id, execution.id)),
          signal,
          undefined,
          undefined,
          execution.status === "waiting_authorization" || (
            execution.purpose === "final-integration" &&
            execution.executionBranch === currentGroup.groupBranch
          ),
          remotePull
        );
        if (settled.status === "stopped") {
          const continued = await this.resumeContinuationTask(
            state,
            currentGroup,
            leader,
            signal,
            undefined,
            settled.id
          );
          if (continued === "fault-paused") return;
          if (continued === "idle" && (await this.database().projectState(state.id)).groupRuns.some((candidate) =>
            candidate.id === currentGroup.id && candidate.status === "paused"
          )) return;
        }
        continue;
      }
      if (!remotePull && authorizationResume &&
        (recoveryStopReason === "service_restart_reconcile" || resumableStop)) {
        const invocationId = stableRuntimeId(
          "inv",
          `restart-authorization:${execution.id}:${execution.ownershipEpoch + 1}`
        );
        const recovered = (await this.database().recoverGroupExecution({
          projectId: state.id,
          groupRunId: currentGroup.id,
          executionId: execution.id,
          predecessorOwnershipEpoch: execution.ownershipEpoch,
          invocationId,
          residentLaunchProtocol: "trusted-supervisor-v1",
          requestId: `restart-authorization-${execution.id}-${execution.ownershipEpoch + 1}`
        })).execution;
        await this.claimWorkerLaneWithWait(state.id, recovered, signal);
        await (await this.git(state.id)).sessionBegin(
          recovered,
          recovered.ownershipEpoch,
          recovered.purpose === "final-integration"
            ? { kind: "final-integration", groupRunId: currentGroup.id }
            : { kind: "delivery", base: { kind: "group", groupRunId: currentGroup.id } },
          signal
        );
        const settled = await this.runGroupExecutionWithRecovery(
          state,
          currentGroup,
          recovered,
          (await this.groupMemberAssignment(
            state,
            currentGroup,
            recovered,
            task?.assignment ?? "Resume the persisted Git operation after authorization.",
            `Authorization output recovery at ownership epoch ${recovered.ownershipEpoch}`
          )),
          (await this.database().executionPullBase(state.id, recovered.id)),
          signal,
          undefined,
          recoverySeed,
          true
        );
        if (settled.status === "stopped") {
          const continued = await this.resumeContinuationTask(
            state,
            currentGroup,
            leader,
            signal,
            undefined,
            settled.id
          );
          if (continued === "fault-paused") return;
          if (continued === "idle" && (await this.database().projectState(state.id)).groupRuns.some((candidate) =>
            candidate.id === currentGroup.id && candidate.status === "paused"
          )) return;
        }
        continue;
      }
      if (!remotePull && (recoveryStopReason === "service_restart_reconcile" || resumableStop) &&
        canonicalFinalRepairForExecution(
          (await this.database().projectState(state.id)),
          currentGroup,
          execution
      )) {
        const invocationId = stableRuntimeId(
          "inv",
          `restart-canonical-final:${execution.id}:${execution.ownershipEpoch + 1}`
        );
        const recovered = (await this.database().recoverCanonicalFinalRetry({
          projectId: state.id,
          groupRunId: currentGroup.id,
          executionId: execution.id,
          predecessorOwnershipEpoch: execution.ownershipEpoch,
          invocationId,
          residentLaunchProtocol: "trusted-supervisor-v1",
          requestId: `restart-canonical-final-${execution.id}-${execution.ownershipEpoch + 1}`
        })).execution;
        await this.claimWorkerLaneWithWait(state.id, recovered, signal);
        await (await this.git(state.id)).sessionBegin(
          recovered,
          recovered.ownershipEpoch,
          { kind: "final-integration", groupRunId: currentGroup.id },
          signal
        );
        const settled = await this.runGroupExecutionWithRecovery(
          state,
          currentGroup,
          recovered,
          (await this.groupMemberAssignment(
            state,
            currentGroup,
            recovered,
            task?.assignment ?? "Publish the repaired group branch to main.",
            `Canonical pre-PR restart recovery at ownership epoch ${recovered.ownershipEpoch}`
          )),
          "main",
          signal,
          undefined,
          recoverySeed,
          true
        );
        if (settled.status === "stopped") {
          const continued = await this.resumeContinuationTask(
            state,
            currentGroup,
            leader,
            signal,
            undefined,
            settled.id
          );
          if (continued === "fault-paused") return;
          if (continued === "idle" && (await this.database().projectState(state.id)).groupRuns.some((candidate) =>
            candidate.id === currentGroup.id && candidate.status === "paused"
          )) return;
        }
        continue;
      }
      if (!remotePull && (recoveryStopReason === "service_restart_reconcile" || resumableStop) &&
        !(await this.database().legacyV1FinalRepairRequiresFreshHandoff(
          state.id,
          execution.id
        ))) {
        // Restart or an explicitly resumed mechanical Stop retains the exact
        // Agent, task and checkout. The Agent continues its own work/tools;
        // the system must not turn this lifecycle into a business handoff.
        const invocationId = stableRuntimeId(
          "inv",
          `restart-no-remote:${execution.id}:${execution.ownershipEpoch + 1}`
        );
        const recovered = (await this.database().recoverGroupExecution({
          projectId: state.id,
          groupRunId: currentGroup.id,
          executionId: execution.id,
          predecessorOwnershipEpoch: execution.ownershipEpoch,
          invocationId,
          residentLaunchProtocol: "trusted-supervisor-v1",
          requestId: `restart-no-remote-${execution.id}-${execution.ownershipEpoch + 1}`
        })).execution;
        await this.claimWorkerLaneWithWait(state.id, recovered, signal);
        await (await this.git(state.id)).sessionBegin(
          recovered,
          recovered.ownershipEpoch,
          recovered.purpose === "final-integration"
            ? { kind: "final-integration", groupRunId: currentGroup.id }
            : { kind: "delivery", base: { kind: "group", groupRunId: currentGroup.id } },
          signal
        );
        const settled = await this.runGroupExecutionWithRecovery(
          state,
          currentGroup,
          recovered,
          (await this.groupMemberAssignment(
            state,
            currentGroup,
            recovered,
            task?.assignment ?? "Resume the exact pre-PR execution after service recovery.",
            `Pre-PR ${resumableStop ? "explicit Stop/Resume" : "service-restart"} recovery at ownership epoch ${recovered.ownershipEpoch}`
          )),
          (await this.database().executionPullBase(state.id, recovered.id)),
          signal,
          undefined,
          recoverySeed
        );
        if (settled.status === "stopped") {
          const continued = await this.resumeContinuationTask(
            state,
            currentGroup,
            leader,
            signal,
            undefined,
            settled.id
          );
          if (continued === "fault-paused") return;
          if (continued === "idle" && (await this.database().projectState(state.id)).groupRuns.some((candidate) =>
            candidate.id === currentGroup.id && candidate.status === "paused"
          )) return;
        }
        continue;
      }
      if (remotePull) {
        const continued = await this.resumeContinuationTask(
          state,
          currentGroup,
          leader,
          signal,
          recoverySeed,
          execution.id,
          execution.status === "waiting_authorization"
        );
        if (continued === "progressed") continue;
        if (continued === "fault-paused") return;
        if ((await this.database().projectState(state.id)).groupRuns.some((candidate) =>
          candidate.id === currentGroup.id && candidate.status === "paused"
        )) return;
        if ((await this.groupHasHealthyBusyMember(state.id, currentGroup))) continue;
        throw new Error(`Remote pull execution ${execution.id} could not reopen at a fresh epoch`);
      }
      const continued = await this.resumeContinuationTask(
        state,
        currentGroup,
        leader,
        signal,
        recoverySeed,
        execution.id,
        execution.status === "waiting_authorization"
      );
      if (continued === "fault-paused") return;
      if (continued === "idle") {
        if ((await this.database().projectState(state.id)).groupRuns.some((candidate) =>
          candidate.id === currentGroup.id && candidate.status === "paused"
        )) return;
        if ((await this.groupHasHealthyBusyMember(state.id, currentGroup))) continue;
        throw new Error(`Active group execution ${execution.id} could not advance to a fresh epoch`);
      }
    }

    let refreshed = await this.database().projectState(state.id);
    let refreshedGroup = refreshed.groupRuns.find((item) => item.id === currentGroup.id) ?? currentGroup;
    const tasks = refreshed.tasks.filter((task) => task.groupRunId === currentGroup.id);
    if (tasks.length === 0 && !refreshedGroup.integrationOwnerExecutionId) {
      const invocationId = newId("inv");
      const plan = await this.submitGroupLeader(state, refreshedGroup, leader, signal, {
        inputId: `input-${currentGroup.id}-recovery-plan`,
        invocationId,
        prompt: nodeRun.optionalTask ?? state.requirement
      });
      const action = plan.controlActions
        ?.map((envelope) => envelope.action)
        .find((candidate) => candidate.tool === "assign_group_tasks");
      if (!action) throw new Error("Recovered group leader did not assign its first task batch");
      await this.commitGroupAssignments(state, refreshedGroup, action);
      refreshed = (await this.database().projectState(state.id));
      refreshedGroup = refreshed.groupRuns.find((item) => item.id === currentGroup.id) ?? refreshedGroup;
    }
    await this.continueGroupRun(
      state,
      collaborationNode,
      definition,
      refreshedGroup,
      leader,
      leaderKey,
      signal
    );
  }

  private async resumeGroupPullRequest(
    state: ProjectState, _group: GroupRun, execution: MemberExecution, pull: PullRequestRecord,
    resident: CollaborationResidentHandle, signal: AbortSignal
  ): Promise<string> {
    const completed = await this.completeAgentOwnedExecution(state, execution,
      execution.waitReason ?? execution.output ?? "Resume retained group delivery", resident, signal,
      (await this.database().executionPullBase(state.id, execution.id)), undefined, pull);
    await this.publishProjection(state, (await this.database().projectState(state.id)));
    return completed.output;
  }

  private async groupHasHealthyBusyMember(projectId: string, group: GroupRun): Promise<boolean> {
    const database = this.database();
    const projection = await database.projectState(projectId);
    const activeAgents = new Set(projection.executions
      .filter((execution) => execution.groupRunId === group.id &&
        !["succeeded", "failed", "cancelled", "stopped", "superseded"].includes(execution.status))
      .map((execution) => execution.agentId));
    const healthy = new Set((await database.eligibleDeliveryMembers(projectId, group.id)));
    return group.memberSnapshot.some((agentId) =>
      agentId !== group.leaderAgentId && healthy.has(agentId) && activeAgents.has(agentId)
    );
  }

  private async dispatchStandaloneOutcome(
    state: ProjectState,
    outcome: StandaloneIntegrationOutcome,
    signal: AbortSignal
  ): Promise<void> {
    if (!outcome.next) return;
    const next = outcome.next;
    await this.activateAndRunNode(state, next.target, {
      activationRequestId: `route-${next.routeEmissionId}`,
      inputSnapshotRef: `route:${next.routeEmissionId}`,
      assignment: next.output,
      activatedByAgentId: routeActivationActor({
        sourceAgentId: next.sourceAgentId,
        routeKind: next.routeKind,
        ...(next.selectedByAgentId ? { selectedByAgentId: next.selectedByAgentId } : {})
      }),
      sourceNodeRunId: next.sourceNodeRunId,
      sourceAgentId: next.sourceAgentId,
      sourceRouteKind: next.routeKind,
      ...(next.selectedByAgentId
        ? { sourceRouteSelectedByAgentId: next.selectedByAgentId }
        : {})
    }, signal, async () => {
      await this.database().deliverRoute({
        projectId: state.id,
        routeEmissionId: next.routeEmissionId,
        activationRequestId: `route-${next.routeEmissionId}`
      });
      await this.publishProjection(state, (await this.database().projectState(state.id)));
    });
  }

  private async activateAndRunNode(
    state: ProjectState,
    nodeId: string,
    input: NodeActivationInput,
    signal: AbortSignal,
    afterActivation?: () => Promise<void> | void
  ): Promise<void> {
    const initialRequestId = state.cycle > 1 ? `input-${state.id}-cycle-${state.cycle}` : `input-${state.id}`;
    const initialProjectInput = input.activationRequestId === initialRequestId && !input.sourceNodeRunId && !input.sourceAgentId;
    const reopened = state.phase === "collaboration:reopened";
    await this.applyWaitingWorkflowAdjustments(state);
    if (initialProjectInput) {
      const projection = await this.database().projectState(state.id);
      if (!projection.nodeRuns.some(node => node.activationRequestId === input.activationRequestId) &&
        !projection.scopedGroupActivationPreparations?.some(record => record.input.activationRequestId === input.activationRequestId))
        nodeId = reopened ? "main" : state.orchestration.input.target;
    }
    const node = workflowNodeRefFor(state.orchestration, nodeId);
    if (!node) throw new Error(`Unknown workflow node ${nodeId}`);
    const database = this.database();
    const enteredLoop = state.orchestration.loops?.find((loop) => loop.to === nodeId);
    if (enteredLoop && input.sourceNodeRunId) {
      const source = (await database.projectState(state.id)).nodeRuns.find((item) => item.id === input.sourceNodeRunId);
      if (source && source.node.nodeId !== enteredLoop.from) {
        state.loopIterations = { ...(state.loopIterations ?? {}), [enteredLoop.id]: 0 };
        await this.saveState(state);
      }
    }
    if (node.kind === "collaboration") {
      if (state.orchestration.schemaVersion === 3) {
        const scoped = await this.scopedRuntime(state, signal);
        const activated = await scoped.activate({ projectId: state.id,
          groupRunId: stableRuntimeId("group", input.activationRequestId), groupId: node.groupId,
          activationRequestId: input.activationRequestId, workflowRevision: state.workflowRevision ?? 1,
          outer: { nodeRunId: stableRuntimeId("node", input.activationRequestId), inputSnapshotRef: input.inputSnapshotRef,
            optionalTask: input.assignment, activatedByAgentId: input.activatedByAgentId,
            ...(input.sourceNodeRunId ? { sourceNodeRunId: input.sourceNodeRunId } : {}),
            ...(input.sourceAgentId ? { sourceAgentId: input.sourceAgentId } : {}) } });
        await afterActivation?.();
        await this.advanceScopedGroup(state, activated.groupRun, signal, scoped);
      } else await this.runGroupNode(state, node, input, signal, afterActivation);
      return;
    }
    const nodeRunId = stableRuntimeId("node", input.activationRequestId);
    const activated = await database.activateNode({
      projectId: state.id,
      nodeRunId,
      node,
      activationRequestId: input.activationRequestId,
      inputSnapshotRef: input.inputSnapshotRef,
      optionalTask: input.assignment,
      ...(input.sourceNodeRunId ? { sourceNodeRunId: input.sourceNodeRunId } : {}),
      ...(input.sourceAgentId ? { sourceAgentId: input.sourceAgentId } : {}),
      activatedByAgentId: input.activatedByAgentId,
      workflowRevision: state.workflowRevision ?? 1,
      requestId: input.activationRequestId
    });
    await afterActivation?.();
    if (node.agentId === "main") {
      await this.runManagementNode(
        state,
        activated.nodeRun,
        input.assignment,
        input.sourceAgentId ?? input.activatedByAgentId,
        signal
      );
      return;
    }
    const executionId = stableRuntimeId("execution", input.activationRequestId);
    const taskId = stableRuntimeId("task", input.activationRequestId);
    const invocationId = stableRuntimeId("inv", input.activationRequestId);
    const executionBranch = `executions/${executionId}`;
    const worktreePath = executionWorktreePath(
      this.#storage.projectDir(state.id), state.orchestration, node.agentId, executionId
    );
    const started = await database.startStandaloneExecution({
      projectId: state.id,
      nodeRunId: activated.nodeRun.id,
      taskId,
      executionId,
      agentId: node.agentId,
      assignment: input.assignment,
      executionBranch,
      worktreePath,
      invocationId,
      residentLaunchProtocol: "trusted-supervisor-v1",
      requestId: `standalone-${executionId}`
    });
    let execution = started.execution;
    await this.claimWorkerLaneWithWait(state.id, execution, signal);
    const git = await this.git(state.id);
    await git.sessionBegin(execution, execution.ownershipEpoch, {
      kind: "delivery",
      base: { kind: "main" }
    });
    if (execution.status === "queued") {
      execution = (await database.transitionExecutionStatus({
        projectId: state.id,
        executionId: execution.id,
        ownershipEpoch: execution.ownershipEpoch,
        status: "working",
        invocationId,
        requestId: `execution-running-${execution.id}-${execution.ownershipEpoch}`
      })).execution;
    }
    const residentAuthority = await this.executionActivityAuthority(state.id, execution);
    await this.startRuntimeActivity(state, residentAuthority, {
      kind: "resident",
      phase: "resident:starting",
      invocationId,
      requestId: `runtime-resident-start-${execution.id}-${execution.ownershipEpoch}`
    });

    const businessAssignment = await this.businessAssignmentWithOwnManagement(
      state,
      node.agentId,
      workflowMessagesText([{ sender: input.sourceAgentId ?? (initialProjectInput ? "user" : input.activatedByAgentId), body: input.assignment }]),
      signal
    );
    const inboxPath = await this.#storage.writeInbox(
      state,
      node.agentId,
      invocationId,
      businessAssignment
    );
    const executionRuntimePath = await this.#storage.invocationRuntimePath(state.id, invocationId);
    const fallbackRequest: AgentRunRequest = {
      project: structuredClone(state),
      purpose: "workflow",
      agent: node.agentId,
      kind: node.agentId === "main" ? "main" : "worker",
      permission: state.agents[node.agentId].permission,
      invocationId,
      inboxPath,
      projectPath: this.#storage.projectDir(state.id),
      workspacePath: worktreePath,
      schemaPath: "",
      skillPaths: [],
      autoSkillPaths: [],
      availableSkillPaths: [],
      runtimePath: executionRuntimePath,
      executionContext: {
        nodeRunId: activated.nodeRun.id,
        taskId,
        executionId,
        role: "delivery",
        ownershipEpoch: execution.ownershipEpoch,
        executionWorktree: worktreePath
      }
    };
    const request = this.#executionInputBuilder
      ? await this.#executionInputBuilder.build({
          state,
          agentId: node.agentId,
          execution,
          executionContext: fallbackRequest.executionContext!,
          assignment: businessAssignment,
          invocationId,
          inboxPath,
          projectPath: this.#storage.projectDir(state.id),
          worktreePath,
          runtimePath: executionRuntimePath
        })
      : fallbackRequest;
    await this.attachRuntimeCallbacks(state, request, execution);
    const launcher = this.#residentLauncher;
    if (!launcher) throw new Error("The trusted collaboration resident launcher is unavailable");
    await this.database().appendEvent({
      projectId: state.id,
      requestId: `execution-launch-${execution.id}-${execution.ownershipEpoch}`,
      workflowRevision: state.workflowRevision ?? 1,
      nodeRunId: execution.nodeRunId,
      agentId: execution.agentId,
      taskId: execution.taskId,
      executionId: execution.id,
      invocationId,
      ownershipEpoch: execution.ownershipEpoch,
      type: "execution.launch.started",
      payload: {
        worktreePath: execution.worktreePath,
        runtimePath: executionRuntimePath,
        residentLaunchProtocol: "trusted-supervisor-v1"
      }
    });
    const workerRouteCandidates = this.workerRouteCandidates(state, node.agentId);
    const resident = await launcher.open({
      request,
      executionRuntimePath,
      filesystemAuthorityInput: await this.filesystemAuthorityInput(state),
      signal,
      onTrace: this.traceSink(state, node.agentId, invocationId),
      turnRequestFactory: this.turnRequestFactory(state, request, execution),
      controlScope: workerRouteCandidates.length > 0
        ? {
          projectId: state.id,
          nodeRunId: activated.nodeRun.id,
          executionId: execution.id,
          agentId: execution.agentId,
          ownershipEpoch: execution.ownershipEpoch,
          role: "standalone-route" as const,
          candidates: workerRouteCandidates,
          decisionBy: "agent" as const
        }
        : {
            projectId: state.id,
            nodeRunId: activated.nodeRun.id,
            executionId: execution.id,
            agentId: execution.agentId,
            ownershipEpoch: execution.ownershipEpoch,
            role: "execution-artifact" as const
          },
      controlAuthorityFactory: this.standaloneControlAuthorityFactory(
        state,
        activated.nodeRun.id,
        execution,
        workerRouteCandidates
      )
    });
    this.#residents.set(execution.id, {
      projectId: state.id,
      execution,
      activity: { ...residentAuthority, invocationId },
      handle: resident
    });
    let result: AgentRunResult;
    try {
      result = await this.submitResident(state, resident, signal, {
        inputId: `input-${executionId}-1`,
        invocationId,
        prompt: businessAssignment
      }, (await this.executionActivityAuthority(state.id, execution)));
      await this.persistArtifactPublicationIntents(state, execution, result);
      const routeDecision = await this.persistStandaloneRouteDecision(state, execution, result);
      // A completed turn only advances to the Git gate. S remains the sole
      // authority that can mark the execution/node successful.
      const outcome = await this.integrateStandalone(
        state,
        execution,
        result.handoff ?? "Work completed",
        resident,
        signal,
        routeDecision
      );
      if (outcome.next) {
        const next = outcome.next;
        await this.activateAndRunNode(state, next.target, {
          activationRequestId: `route-${next.routeEmissionId}`,
          inputSnapshotRef: `route:${next.routeEmissionId}`,
          assignment: next.output,
          activatedByAgentId: routeActivationActor({
            sourceAgentId: next.sourceAgentId,
            routeKind: next.routeKind,
            ...(next.selectedByAgentId ? { selectedByAgentId: next.selectedByAgentId } : {})
          }),
          sourceNodeRunId: next.sourceNodeRunId,
          sourceAgentId: next.sourceAgentId,
          sourceRouteKind: next.routeKind,
          ...(next.selectedByAgentId
            ? { sourceRouteSelectedByAgentId: next.selectedByAgentId }
            : {})
        }, signal, async () => {
          await this.database().deliverRoute({
            projectId: state.id,
            routeEmissionId: next.routeEmissionId,
            activationRequestId: `route-${next.routeEmissionId}`
          });
          await this.publishProjection(state, (await this.database().projectState(state.id)));
        });
      }
    } finally {
      // Waiting authorization/review/conflict retains the same resident PID,
      // state lane, and ownership epoch. Shutdown/cancel owns explicit close.
    }
  }

  private async runManagementNode(
    state: ProjectState,
    nodeRun: NodeRun,
    assignment: string,
    sourceAgentId: string,
    signal: AbortSignal
  ): Promise<void> {
    const database = this.database();
    const edges = workflowRoutesForAgent(state.orchestration, nodeRun.node.nodeId);
    const candidates = [...new Set([
      ...edges.map((edge) => edge.target),
      ...((await this.mainCanComplete(state)) ? ["finish" as const] : [])
    ])];
    const routeAttemptStartedAt = nowIso();
    const routeAttemptOperation = `main-route.decision:${nodeRun.id}`;
    const decision = await this.decideMainRoute(
      state,
      nodeRun.id,
      sourceAgentId,
      assignment,
      candidates,
      signal
    );
    const validRouteDecision = decision?.decisionAction?.tool === "apply_workflow" ||
      decision?.intervention !== undefined ||
      Boolean(decision && candidates.includes(decision.targetNodeId));
    if (validRouteDecision) {
      await this.appendSuccessfulAttempt(state, {
        scope: "scheduler",
        operation: routeAttemptOperation,
        startedAt: routeAttemptStartedAt,
        message: "A later Main route decision attempt succeeded",
        agentId: "main",
        nodeRunId: nodeRun.id,
        metadata: { sourceAgentId, candidateCount: candidates.length }
      });
      state.lastError = undefined;
    }
    if (decision?.decisionAction?.tool === "apply_workflow") {
      const routeEmissionId = `route-${nodeRun.id}-workflow-${state.workflowRevision ?? 1}`;
      const output = decision.output?.trim() ||
        `Workflow reconfigured: ${decision.decisionAction.rationale}`;
      await database.completeManagementNode({
        projectId: state.id,
        nodeRunId: nodeRun.id,
        output,
        routeEmissionId,
        route: {
          kind: "weak",
          targetNodeId: "main",
          selectedByAgentId: "main",
          decisionRequestId: decision.decisionRequestId
        },
        requestId: `main-node-workflow-${nodeRun.id}-${state.workflowRevision ?? 1}`
      });
      await this.publishProjection(state, (await database.projectState(state.id)));
      await this.activateAndRunNode(state, "main", {
        activationRequestId: `route-${routeEmissionId}`,
        inputSnapshotRef: `workflow:${state.workflowRevision ?? 1}`,
        assignment: output,
        activatedByAgentId: "main",
        sourceNodeRunId: nodeRun.id,
        sourceAgentId: "main",
        sourceRouteKind: "weak"
      }, signal, async () => {
        await database.deliverRoute({
          projectId: state.id,
          routeEmissionId,
          activationRequestId: `route-${routeEmissionId}`
        });
        await this.publishProjection(state, (await database.projectState(state.id)));
      });
      return;
    }
    if (decision?.intervention) {
      const interventionId = `usr_${createHash("sha256")
        .update(`${nodeRun.id}\0${decision.decisionRequestId}`)
        .digest("hex")
        .slice(0, 32)}`;
      state.userIntervention = {
        id: interventionId,
        status: "pending",
        requestedAt: new Date().toISOString(),
        message: decision.intervention.message,
        rationale: decision.intervention.rationale,
        successCriteria: [],
        requestedBy: "main",
        requestedInvocationId: decision.decisionRequestId,
        requestKind: "main"
      };
      await database.appendEvent({
        projectId: state.id,
        eventId: `evt_${interventionId}`,
        requestId: `intervention-${interventionId}`,
        workflowRevision: state.workflowRevision ?? 1,
        nodeId: nodeRun.node.nodeId,
        nodeRunId: nodeRun.id,
        agentId: "main",
        type: "user.intervention.requested",
        payload: {
          interventionId,
          message: boundedSharedText(decision.intervention.message, 4_000),
          rationale: boundedSharedText(decision.intervention.rationale, 4_000)
        }
      });
      state.status = "retrying";
      state.phase = "user-intervention-required";
      state.lastError = undefined;
      await this.publishProjection(state, (await database.projectState(state.id)));
      await this.saveState(state);
      return;
    }
    if (!decision || !candidates.includes(decision.targetNodeId)) {
      await this.appendFailureAttempt(state, {
        scope: "scheduler",
        operation: routeAttemptOperation,
        error: new Error("Main management node awaits a fenced route or completion decision"),
        errorCode: decision
          ? "MAIN_ROUTE_DECISION_INVALID"
          : "MAIN_ROUTE_DECISION_MISSING",
        retryable: true,
        startedAt: routeAttemptStartedAt,
        agentId: "main",
        nodeRunId: nodeRun.id,
        metadata: {
          sourceAgentId,
          candidates,
          ...(decision ? { selectedTarget: decision.targetNodeId } : {})
        }
      });
      state.status = "running";
      state.phase = "collaboration:main-route-required";
      state.lastError = "Main management node awaits a fenced route or completion decision";
      await this.publishProjection(state, (await database.projectState(state.id)));
      await this.saveState(state);
      return;
    }
    const managementOutput = decision.output?.trim() || assignment;
    const selectedEdge = edges.find((edge) => edge.target === decision.targetNodeId);
    const route = selectedEdge?.kind === "strong" && edges.length === 1
      ? { kind: "fixed" as const, targetNodeId: decision.targetNodeId }
      : {
          kind: "weak" as const,
          targetNodeId: decision.targetNodeId,
          selectedByAgentId: "main",
          decisionRequestId: decision.decisionRequestId
        };
    const routeEmissionId = `route-${nodeRun.id}`;
    await database.completeManagementNode({
      projectId: state.id,
      nodeRunId: nodeRun.id,
      output: managementOutput,
      routeEmissionId,
      route,
      requestId: `main-node-complete-${nodeRun.id}`
    });
    await this.publishProjection(state, (await database.projectState(state.id)));
    if (decision.targetNodeId === "finish") {
      await database.deliverRoute({
        projectId: state.id,
        routeEmissionId,
        activationRequestId: `finish-${routeEmissionId}`
      });
      await this.publishProjection(state, (await database.projectState(state.id)));
      state.status = "completed";
      state.phase = "completed";
      state.completedAt = new Date().toISOString();
      state.lastError = undefined;
      await this.saveState(state);
      return;
    }
    await this.activateAndRunNode(state, decision.targetNodeId, {
      activationRequestId: `route-${routeEmissionId}`,
      inputSnapshotRef: `route:${routeEmissionId}`,
      assignment: managementOutput,
      activatedByAgentId: "main",
      sourceNodeRunId: nodeRun.id,
      sourceAgentId: "main",
      sourceRouteKind: route.kind,
      ...(route.kind === "weak"
        ? { sourceRouteSelectedByAgentId: route.selectedByAgentId }
        : {})
    }, signal, async () => {
      await database.deliverRoute({
        projectId: state.id,
        routeEmissionId,
        activationRequestId: `route-${routeEmissionId}`
      });
      await this.publishProjection(state, (await database.projectState(state.id)));
    });
  }

  private async pauseForMainIntervention(
    state: ProjectState,
    nodeRunId: string,
    decisionRequestId: string,
    intervention: Extract<ControlAction, { tool: "request_user" }>,
    receiptCoordination?: { incidentId: string; managerInvocationId: string }
  ): Promise<void> {
    if (state.orchestration.allowUserIntervention === false) {
      throw new Error("User intervention is disabled by this Workflow");
    }
    const interventionId = `usr_${createHash("sha256")
      .update(`${nodeRunId}\0${decisionRequestId}`)
      .digest("hex")
      .slice(0, 32)}`;
    state.userIntervention = {
      id: interventionId,
      status: "pending",
      requestedAt: new Date().toISOString(),
      message: intervention.message,
      rationale: intervention.rationale,
      successCriteria: [],
      requestedBy: "main",
      requestedInvocationId: receiptCoordination?.managerInvocationId ?? decisionRequestId,
      requestKind: "main"
    };
    const node = (await this.database().projectState(state.id)).nodeRuns
      .find((item) => item.id === nodeRunId);
    await this.database().appendEvent({
      projectId: state.id,
      eventId: `evt_${interventionId}`,
      requestId: `intervention-${interventionId}`,
      workflowRevision: state.workflowRevision ?? 1,
      ...(node ? { nodeId: node.node.nodeId } : {}),
      nodeRunId,
      agentId: "main",
      type: "user.intervention.requested",
      payload: {
        interventionId,
        message: boundedSharedText(intervention.message, 4_000),
        rationale: boundedSharedText(intervention.rationale, 4_000),
        ...(receiptCoordination ? { ...receiptCoordination, decisionCallId: decisionRequestId } : {})
      }
    });
    state.status = "retrying";
    state.phase = "user-intervention-required";
    state.lastError = undefined;
    await this.publishProjection(state, (await this.database().projectState(state.id)));
    await this.saveState(state);
  }

  private async runGroupNode(
    state: ProjectState,
    node: Extract<NodeRef, { kind: "collaboration" }>,
    input: NodeActivationInput,
    signal: AbortSignal,
    afterActivation?: () => Promise<void> | void
  ): Promise<void> {
    const launcher = this.#residentLauncher;
    if (!launcher) throw new Error("The trusted collaboration resident launcher is unavailable");
    const groupDefinition = (state.orchestration.collaborations ?? [])
      .find((group) => group.id === node.groupId);
    if (!groupDefinition) throw new Error(`Unknown collaboration group ${node.groupId}`);
    const database = this.database();
    const git = await this.git(state.id);
    const nodeRunId = stableRuntimeId("node", input.activationRequestId);
    const groupRunId = stableRuntimeId("group", input.activationRequestId);
    const groupBranch = `groups/${groupRunId}`;
    const baseCommit = await this.mainHead(state);
    const initialLeaderInvocationId = groupLeaderInvocationId(state.id, groupRunId, 1);
    const initialLeaderRuntimePath = this.leaderRuntimePath(state.id, groupRunId);
    const activationOrigin = groupActivationOrigin(input);
    const activationLeader = activationOrigin.kind === "agent-route"
      ? activationOrigin.sourceAgentId
      : "main";
    if (input.activatedByAgentId !== activationLeader) {
      throw new Error("Group activation actor does not match its durable activation origin");
    }
    const activated = await database.activateGroup({
      projectId: state.id,
      nodeRunId,
      groupRunId,
      nodeId: node.nodeId,
      groupId: node.groupId,
      activationRequestId: input.activationRequestId,
      inputSnapshotRef: input.inputSnapshotRef,
      optionalTask: input.assignment,
      memberAgentIds: groupDefinition.memberAgentIds,
      origin: activationOrigin,
      baseCommit,
      groupBranch,
      workflowRevision: state.workflowRevision ?? 1,
      residentLaunchProtocol: "trusted-supervisor-v1",
      leaderInvocationId: initialLeaderInvocationId,
      leaderRuntimePath: initialLeaderRuntimePath,
      requestId: input.activationRequestId
    });
    await afterActivation?.();
    await git.beginGroup({
      repository: this.repository(state),
      groupRunId,
      baseCommit,
      operationId: `push-group-${groupRunId}`,
      signal
    });
    this.#branchHeads.set(`${state.id}:${groupBranch}`, baseCommit);
    await this.publishProjection(state, (await database.projectState(state.id)));
    // The branch operation may finish after a user Pause has settled.
    while (this.#pausedProjects.has(state.id)) await this.waitWhilePaused(state.id, signal);
    state.status = "running";
    state.phase = `${node.groupId}:coordinating`;
    await this.saveState(state);

    const {
      leader,
      leaderKey,
      invocationId: leaderInvocationId
    } = await this.openGroupCoordinatorResident(
      state,
      activated.groupRun,
      input.assignment,
      signal
    );
    try {
      const plan = await this.submitGroupLeader(state, activated.groupRun, leader, signal, {
        inputId: `input-${groupRunId}-plan`,
        invocationId: leaderInvocationId,
        prompt: input.assignment
      });
      const assignmentAction = plan.controlActions
        ?.map((envelope) => envelope.action)
        .find((action) => action.tool === "assign_group_tasks");
      if (!assignmentAction) return;
      if (assignmentAction.groupRunId !== groupRunId ||
        assignmentAction.coordinatorEpoch !== activated.groupRun.coordinatorEpoch) {
        throw new Error("Group leader did not commit a fenced assign_group_tasks action");
      }
      await this.commitGroupAssignments(state, activated.groupRun, assignmentAction);
      await this.continueGroupRun(
        state,
        node,
        groupDefinition,
        activated.groupRun,
        leader,
        leaderKey,
        signal
      );
    } catch (error) {
      if (!(error instanceof CoordinatorSubstitutedError)) throw error;
      await this.continueWithSubstitutedMain(
        state,
        node,
        groupDefinition,
        groupRunId,
        input.assignment,
        signal
      );
    }
  }

  private async continueWithSubstitutedMain(
    state: ProjectState,
    node: Extract<NodeRef, { kind: "collaboration" }>,
    groupDefinition: NonNullable<ProjectState["orchestration"]["collaborations"]>[number],
    groupRunId: string,
    assignment: string,
    signal: AbortSignal
  ): Promise<void> {
    const database = this.database();
    const group = (await database.projectState(state.id)).groupRuns.find((item) => item.id === groupRunId);
    if (!group || group.actingCoordinatorId !== "main") {
      throw new Error("Failed collaboration leader was not fenced before Main substitution");
    }
    const { leader, leaderKey, invocationId } = await this.openGroupCoordinatorResident(
      state,
      group,
      assignment,
      signal
    );
    if (!(await database.projectState(state.id)).tasks.some((task) => task.groupRunId === groupRunId)) {
      const plan = await this.submitGroupLeader(state, group, leader, signal, {
        inputId: `input-${groupRunId}-substitute-plan-${group.coordinatorEpoch}`,
        invocationId,
        prompt: assignment
      });
      const action = plan.controlActions?.map((item) => item.action)
        .find((item) => item.tool === "assign_group_tasks");
      if (!action || action.tool !== "assign_group_tasks") {
        throw new Error("Substitute Main did not assign a fenced task batch");
      }
      await this.commitGroupAssignments(state, group, action);
    }
    await this.continueGroupRun(
      state,
      node,
      groupDefinition,
      group,
      leader,
      leaderKey,
      signal
    );
  }

  private async openGroupCoordinatorResident(
    state: ProjectState,
    group: GroupRun,
    assignment: string,
    signal: AbortSignal,
    recoverySeed?: ResidentRecoveryProofSeed
  ): Promise<{ leader: CollaborationResidentHandle; leaderKey: string; invocationId: string }> {
    // Recheck after every awaited Resume before claiming activity. Pause may
    // otherwise settle while preparation is waiting or the handle is opening.
    while (this.#pausedProjects.has(state.id)) await this.waitWhilePaused(state.id, signal);
    if (signal.aborted || this.#shuttingDown || this.#cancellingProjects.has(state.id)) {
      throw new Error("Group coordinator launch was cancelled");
    }
    this.#activeTurns.set(state.id, (this.#activeTurns.get(state.id) ?? 0) + 1);
    try {
      return await this.prepareGroupCoordinatorResident(state, group, assignment, signal, recoverySeed);
    } finally {
      // Registration is part of the operation: Pause must see the new handle
      // before it can acknowledge that every native resident is suspended.
      const remaining = (this.#activeTurns.get(state.id) ?? 1) - 1;
      if (remaining > 0) this.#activeTurns.set(state.id, remaining);
      else {
        this.#activeTurns.delete(state.id);
        for (const resolve of this.#turnIdleWaiters.get(state.id) ?? []) resolve();
        this.#turnIdleWaiters.delete(state.id);
      }
    }
  }

  private async prepareGroupCoordinatorResident(
    state: ProjectState,
    group: GroupRun,
    assignment: string,
    signal: AbortSignal,
    recoverySeed?: ResidentRecoveryProofSeed
  ): Promise<{ leader: CollaborationResidentHandle; leaderKey: string; invocationId: string }> {
    await this.applyWaitingWorkflowAdjustments(state);
    const coordinator = group.actingCoordinatorId ?? group.leaderAgentId;
    const invocationId = groupLeaderInvocationId(
      state.id,
      group.id,
      group.coordinatorEpoch
    );
    const runtimePath = this.leaderRuntimePath(state.id, group.id);
    const priorLaunch = await this.database().latestGroupLeaderLaunch(
      state.id, group.id, coordinator, group.coordinatorEpoch
    );
    // Recovery preserves the Agent's working context; it must not move a
    // retained native session to a new invocation's cwd. A substituted Main
    // has its own anchor, and an original Leader returning later retains its
    // own directory. The system transports facts, not Agent decisions/files.
    const managementWorkspaceName = priorLaunch?.payload.managementWorkspaceName ??
      `management-workspace-${priorLaunch?.invocationId ?? invocationId}`;
    if (typeof managementWorkspaceName !== "string" ||
      !/^management-workspace-[A-Za-z0-9_-]+$/.test(managementWorkspaceName)) {
      throw new Error("Leader's retained management workspace identity is invalid");
    }
    // This durable protocol fact precedes every async preparation and the
    // launcher call. A missing resident claim is safe only for this exact
    // epoch: trusted-supervisor-v1 creates its claim before any process spawn.
    await this.database().appendEvent({
      projectId: state.id,
      requestId: `group-leader-launch-${group.id}-${group.coordinatorEpoch}`,
      workflowRevision: priorLaunch?.coordinatorEpoch === group.coordinatorEpoch ? priorLaunch.workflowRevision : state.workflowRevision ?? 1,
      nodeRunId: group.nodeRunId,
      groupRunId: group.id,
      agentId: coordinator,
      invocationId,
      coordinatorEpoch: group.coordinatorEpoch,
      type: "group.leader.launch.started",
      payload: priorLaunch?.coordinatorEpoch === group.coordinatorEpoch ? priorLaunch.payload : {
        residentLaunchProtocol: "trusted-supervisor-v1",
        runtimePath,
        invocationId,
        managementWorkspaceName
      }
    });
    await this.database().claimManagementLane({
      projectId: state.id,
      groupRunId: group.id,
      agentId: coordinator,
      coordinatorEpoch: group.coordinatorEpoch
    });
    const residentAuthority = this.groupActivityAuthority(group);
    await this.startRuntimeActivity(state, residentAuthority, {
      kind: "resident",
      phase: "resident:starting",
      invocationId,
      requestId: `runtime-group-resident-start-${group.id}-${group.coordinatorEpoch}`
    });
    const authorityInbox = await this.#storage.writeInbox(
      state,
      coordinator,
      invocationId,
      assignment
    );
    await fs.mkdir(runtimePath, { recursive: true, mode: 0o700 });
    const inputs = await this.stageLeaderManagementInputs(
      state,
      invocationId,
      authorityInbox,
      runtimePath,
      coordinator,
      managementWorkspaceName
    );
    const fallback: AgentRunRequest = {
      project: structuredClone(state),
      purpose: "workflow",
      agent: coordinator,
      kind: coordinator === "main" ? "main" : "worker",
      permission: "workspace",
      invocationId,
      inboxPath: inputs.inboxPath,
      projectPath: this.#storage.projectDir(state.id),
      workspacePath: inputs.workspacePath,
      schemaPath: "",
      skillPaths: [],
      autoSkillPaths: [],
      availableSkillPaths: [],
      runtimePath,
      executionContext: {
        nodeRunId: group.nodeRunId,
        groupRunId: group.id,
        role: "leader",
        coordinatorEpoch: group.coordinatorEpoch
      }
    };
    const request = this.#executionInputBuilder
      ? await this.#executionInputBuilder.build({
          state,
          agentId: coordinator,
          executionContext: fallback.executionContext!,
          assignment,
          invocationId,
          inboxPath: inputs.inboxPath,
          projectPath: this.#storage.projectDir(state.id),
          worktreePath: inputs.workspacePath,
          runtimePath
        })
      : fallback;
    await this.attachRuntimeCallbacks(state, request);
    Object.assign(inputs, await prepareWorkflowContext(request, inputs, (await this.database().authoritativeWorkflowFiles(state.id))));
    const leader = await this.#residentLauncher!.open({
      request,
      executionRuntimePath: runtimePath,
      filesystemAuthorityInput: await this.filesystemAuthorityInput(state),
      signal,
      onTrace: this.traceSink(state, coordinator, invocationId),
      turnRequestFactory: this.turnRequestFactory(
        state,
        request,
        undefined,
        recoverySeed
      ),
      inputs,
      controlScope: {
        projectId: state.id,
        nodeRunId: group.nodeRunId,
        groupRunId: group.id,
        leaderAgentId: coordinator,
        coordinatorEpoch: group.coordinatorEpoch,
        role: "leader"
      },
      controlAuthorityFactory: this.groupControlAuthorityFactory(
        state,
        group.id,
        group.nodeRunId
      )
    });
    const leaderKey = `leader:${group.id}`;
    this.#residents.set(leaderKey, {
      projectId: state.id,
      activity: { ...residentAuthority, invocationId },
      handle: leader
    });
    return { leader, leaderKey, invocationId };
  }

  private async commitGroupAssignments(
    state: ProjectState,
    group: GroupRun,
    action: Extract<ControlAction, { tool: "assign_group_tasks" }>
  ): Promise<void> {
    if (action.groupRunId !== group.id || action.coordinatorEpoch !== group.coordinatorEpoch) {
      throw new Error("Group leader returned a stale assign_group_tasks action");
    }
    const coordinator = group.actingCoordinatorId ?? group.leaderAgentId;
    const taskFingerprint = createHash("sha256")
      .update(JSON.stringify(action.tasks.map((task) => task.taskId)))
      .digest("hex")
      .slice(0, 20);
    await this.database().assignTasks({
      projectId: state.id,
      groupRunId: group.id,
      actorAgentId: coordinator,
      coordinatorEpoch: group.coordinatorEpoch,
      tasks: action.tasks.map((task) => ({
        id: task.taskId,
        assignment: task.assignment,
        ...(task.assigneeAgentId ? { assigneeAgentId: task.assigneeAgentId } : {}),
        ...(task.dependencyTaskIds?.length ? { dependencyTaskIds: task.dependencyTaskIds } : {})
      })),
      requestId: `assign-${group.id}-${taskFingerprint}`
    });
    await this.publishProjection(state, (await this.database().projectState(state.id)));
  }

  private async continueGroupRun(
    state: ProjectState,
    node: Extract<NodeRef, { kind: "collaboration" }>,
    groupDefinition: NonNullable<ProjectState["orchestration"]["collaborations"]>[number],
    group: GroupRun,
    leader: CollaborationResidentHandle,
    leaderKey: string,
    signal: AbortSignal
  ): Promise<void> {
    const database = this.database();
    const coordinator = group.actingCoordinatorId ?? group.leaderAgentId;
    let currentGroup = (await database.projectState(state.id)).groupRuns.find((item) => item.id === group.id) ?? group;
    let finalExecution = currentGroup.integrationOwnerExecutionId
      ? (await database.projectState(state.id)).executions.find((item) =>
          item.id === currentGroup.integrationOwnerExecutionId
        )
      : undefined;
    let finalOutput = finalExecution?.output;
    const retainedFinalPull = finalExecution
      ? (await database.projectState(state.id)).pullRequests.find((pull) =>
          pull.ownerExecutionId === finalExecution!.id
        )
      : undefined;
    const migratedLegacyDirectMain = Boolean(
      finalExecution && retainedFinalPull &&
      finalExecution.executionBranch !== currentGroup.groupBranch &&
      (await database.executionPullBase(state.id, finalExecution.id)) === currentGroup.integrationTarget &&
      currentGroup.finalPullRequestId === retainedFinalPull.id &&
      retainedFinalPull.status === "merged" &&
      retainedFinalPull.head === finalExecution.executionBranch &&
      retainedFinalPull.base === currentGroup.integrationTarget
    );

    // A crash can occur after the repair PR was durably merged into the group
    // branch and its execution completed, but before the canonical retry row
    // is created. Resume that exact transition before asking the leader for a
    // completion decision; a repair branch is never itself the final owner.
    if (
      finalExecution?.purpose === "final-integration" &&
      finalExecution.status === "succeeded" &&
      finalExecution.executionBranch !== currentGroup.groupBranch &&
      !migratedLegacyDirectMain
    ) {
      const repairTask = (await database.projectState(state.id)).tasks.find((task) =>
        task.id === finalExecution!.taskId
      );
      const canonicalRetry = await this.runCanonicalFinalRetryAfterRepair(
        state,
        currentGroup,
        finalExecution,
        repairTask?.assignment ?? "Publish the repaired group branch to main.",
        leader,
        signal
      );
      if (!canonicalRetry) return;
      finalExecution = canonicalRetry;
      if (finalExecution.status !== "succeeded") {
        if ((await this.resumeContinuationTask(
          state,
          currentGroup,
          leader,
          signal,
          undefined,
          finalExecution.id
        )) !== "progressed") return;
        const afterCanonicalRecovery = await database.projectState(state.id);
        const afterCanonicalGroup = afterCanonicalRecovery.groupRuns.find((item) =>
          item.id === group.id
        );
        finalExecution = afterCanonicalRecovery.executions.find((item) =>
          item.id === afterCanonicalGroup?.integrationOwnerExecutionId
        ) ?? finalExecution;
      }
      finalOutput = finalExecution.output;
      currentGroup = (await database.projectState(state.id)).groupRuns.find((item) =>
        item.id === group.id
      ) ?? currentGroup;
    }

    if (!finalExecution) {
      // Derive the next durable input identity from committed assignment
      // batches. A coordinator restart after round N must not reuse round 1
      // and accidentally replay an older native/session turn.
      let managementRound = await database.groupTaskAssignmentCount(state.id, group.id);
      let integrationAction: Extract<ControlAction, { tool: "request_group_integration" }> | undefined;
      while (!signal.aborted && !integrationAction) {
        while (!signal.aborted) {
          const groupTasks = (await database.projectState(state.id)).tasks
            .filter((task) => task.groupRunId === group.id);
          if (groupTasks.length > 0 && groupTasks.every((task) =>
            ["succeeded", "failed", "cancelled"].includes(task.status)
          )) break;
          const attempts = await Promise.allSettled(groupDefinition.memberAgentIds.map(async (agentId) =>
            this.runGroupMemberOnce(state, currentGroup, agentId, signal)
          ));
          const held = attempts.find((attempt) => attempt.status === "rejected" &&
            attempt.reason instanceof CollaborationStateError && attempt.reason.code === "WORKFLOW_ADJUSTMENT_PENDING");
          const rejected = attempts.find((attempt) => attempt.status === "rejected" &&
            !(attempt.reason instanceof CollaborationStateError && attempt.reason.code === "WORKFLOW_ADJUSTMENT_PENDING"));
          if (rejected?.status === "rejected") throw rejected.reason;
          const latestGroup = (await database.projectState(state.id)).groupRuns
            .find((item) => item.id === group.id);
          if (latestGroup?.status === "paused") {
            state.status = "retrying";
            state.phase = latestGroup.pauseReason === "all_members_failed"
              ? "collaboration:all-members-failed"
              : "collaboration:group-paused";
            await this.publishProjection(state, (await database.projectState(state.id)));
            await this.saveState(state);
            return;
          }
          const claimed = attempts.map((attempt) =>
            attempt.status === "fulfilled" ? attempt.value : false
          );
          if (!claimed.some(Boolean)) {
            const continuation = await this.resumeContinuationTask(state, currentGroup, leader, signal);
            if (continuation === "progressed") continue;
            // This old run yielded because it persisted a fault pause. Resume
            // may already have accepted a new intent and changed the group to
            // running; only the replacement run may act on that intent.
            if (continuation === "fault-paused") return;
            const afterContinuation = (await database.projectState(state.id)).groupRuns
              .find((item) => item.id === group.id);
            if (afterContinuation?.status === "paused") return;
            if (held?.status === "rejected") throw held.reason;
            const blocked = (await database.projectState(state.id)).tasks
              .filter((task) => task.groupRunId === group.id &&
                !["succeeded", "failed", "cancelled"].includes(task.status));
            throw new Error(
              `Group scheduler made no progress; unresolved dependencies or assignee capacity: ${blocked.map((task) => task.id).join(", ")}`
            );
          }
        }
        managementRound += 1;
        const invocationId = newId("inv");
        const currentBatch = new Set((await database.latestGroupAssignmentTaskIds(state.id, group.id)));
        const result = await this.submitGroupLeader(state, currentGroup, leader, signal, {
          inputId: `input-${group.id}-post-delivery-${managementRound}`,
          invocationId,
          prompt: workflowMessagesText((await database.projectState(state.id)).executions
            .filter(execution => execution.groupRunId === group.id && currentBatch.has(execution.taskId) && execution.output !== undefined && execution.status === "succeeded")
            .map(execution => ({ sender: execution.agentId, body: execution.output! })))
        });
        const action = result.controlActions
          ?.map((envelope) => envelope.action)
          .find((candidate) => candidate.tool === "assign_group_tasks" ||
            candidate.tool === "request_group_integration");
        if (!action) return;
        if (action.tool === "assign_group_tasks") {
          await this.commitGroupAssignments(state, currentGroup, action);
          continue;
        }
        integrationAction = action;
      }
      if (!integrationAction || integrationAction.groupRunId !== group.id ||
        integrationAction.coordinatorEpoch !== currentGroup.coordinatorEpoch ||
        integrationAction.integrationOwnerAgentId === currentGroup.leaderAgentId ||
        !groupDefinition.memberAgentIds.includes(integrationAction.integrationOwnerAgentId)) {
        throw new Error("Group leader did not commit a valid fenced request_group_integration action");
      }
      const suffix = createHash("sha256").update(`${group.id}:final`).digest("hex").slice(0, 24);
      const finalExecutionId = `execution-final-${suffix}`;
      const finalTaskId = `task-final-${suffix}`;
      const finalWorktree = executionWorktreePath(
        this.#storage.projectDir(state.id), state.orchestration,
        integrationAction.integrationOwnerAgentId, finalExecutionId
      );
      const finalInvocationId = stableRuntimeId("inv", `final:${group.id}:${finalExecutionId}`);
      await this.applyWaitingWorkflowAdjustments(state);
      const final = await database.startFinalIntegration({
        projectId: state.id,
        groupRunId: group.id,
        actorAgentId: coordinator,
        coordinatorEpoch: currentGroup.coordinatorEpoch,
        ownerAgentId: integrationAction.integrationOwnerAgentId,
        taskId: finalTaskId,
        executionId: finalExecutionId,
        assignment: "Integrate all merged group work and prepare the final pull request to main.",
        executionBranch: currentGroup.groupBranch,
        worktreePath: finalWorktree,
        invocationId: finalInvocationId,
        residentLaunchProtocol: "trusted-supervisor-v1",
        requestId: `final-${group.id}`
      });
      finalExecution = final.execution;
      await this.claimWorkerLaneWithWait(state.id, finalExecution, signal);
      await (await this.git(state.id)).sessionBegin(finalExecution, finalExecution.ownershipEpoch, {
        kind: "final-integration",
        groupRunId: group.id
      }, signal);
      const finalAssignment = await this.groupMemberAssignment(
        state,
        currentGroup,
        finalExecution,
        "Integrate all group delivery branches and validate the final result.",
        "Final integration owner; produce the only group pull request to main"
      );
      finalExecution = await this.runGroupExecutionWithRecovery(
        state,
        currentGroup,
        finalExecution,
        finalAssignment,
        "main",
        signal
      );
      finalOutput = finalExecution.output;
      if (finalExecution.status !== "succeeded") {
        let recoveredProjection = await database.projectState(state.id);
        let recoveredGroup = recoveredProjection.groupRuns.find((item) => item.id === group.id);
        finalExecution = recoveredProjection.executions.find((item) =>
          item.id === recoveredGroup?.integrationOwnerExecutionId
        ) ?? finalExecution;
        // If the failure raced a provider merge, recovery settles the same
        // stop-confirmed execution as succeeded. There is no continuation to
        // hand off; proceed directly to the leader's completion decision.
        if (finalExecution.status !== "succeeded") {
          if ((await this.resumeContinuationTask(state, currentGroup, leader, signal)) !== "progressed") {
            return;
          }
          recoveredProjection = (await database.projectState(state.id));
          recoveredGroup = recoveredProjection.groupRuns.find((item) => item.id === group.id);
          finalExecution = recoveredProjection.executions.find((item) =>
            item.id === recoveredGroup?.integrationOwnerExecutionId
          ) ?? finalExecution;
        }
        finalOutput = finalExecution.output;
      }
      currentGroup = (await database.projectState(state.id)).groupRuns.find((item) => item.id === group.id) ?? currentGroup;
    }

    if (!finalExecution || finalExecution.status !== "succeeded") {
      finalExecution = (await database.projectState(state.id)).executions.find((item) =>
        item.id === currentGroup.integrationOwnerExecutionId
      );
    }
    if (!finalExecution || finalExecution.status !== "succeeded") {
      throw new Error("Recovered group final integration is not terminal");
    }
    finalOutput ??= finalExecution.output ?? "Final integration completed";
    currentGroup = (await database.projectState(state.id)).groupRuns
      .find((item) => item.id === group.id) ?? currentGroup;
    let completionOutput = currentGroup.leaderDecision === "complete"
      ? currentGroup.output
      : undefined;
    if (!completionOutput) {
      const completionInvocationId = newId("inv");
      const completion = await this.submitGroupLeader(state, currentGroup, leader, signal, {
        inputId: `input-${group.id}-complete`,
        invocationId: completionInvocationId,
        prompt: workflowMessagesText([{ sender: finalExecution.agentId, body: finalOutput }])
      });
      const completionAction = completion.controlActions
        ?.map((envelope) => envelope.action)
        .find((action) => action.tool === "complete_group");
      if (!completionAction) return;
      if (completionAction.groupRunId !== group.id ||
        completionAction.coordinatorEpoch !== currentGroup.coordinatorEpoch) {
        throw new Error("Group leader did not commit a fenced complete_group action");
      }
      completionOutput = completionAction.output;
      await database.decideGroupCompletion({
        projectId: state.id,
        groupRunId: group.id,
        actorAgentId: coordinator,
        coordinatorEpoch: currentGroup.coordinatorEpoch,
        output: completionOutput,
        requestId: `decision-${group.id}`
      });
    }

    // The fenced complete_group decision is durable, but neither a weak Main
    // router nor a downstream node may start while the coordinator process is
    // still live. This is particularly important for a Main-led group: two
    // simultaneous Main management residents would violate the single
    // management lane and could issue conflicting decisions.
    await this.closeResidentForTerminal(state, leaderKey, leader, false);

    const edges = workflowRoutesForAgent(state.orchestration, node.nodeId);
    const strong = edges.filter((edge) => edge.kind === "strong");
    let target: string;
    let route: Parameters<CollaborationStateDatabase["completeGroup"]>[0]["route"];
    if (strong.length === 1 && edges.length === 1) {
      target = strong[0].target;
      route = { kind: "fixed", targetNodeId: target };
    } else {
      const decision = await this.decideMainRoute(
        state,
        currentGroup.nodeRunId,
        coordinator,
        completionOutput,
        edges.map((edge) => edge.target),
        signal
      );
      if (decision?.intervention) {
        this.#residents.delete(leaderKey);
        await this.pauseForMainIntervention(
          state,
          currentGroup.nodeRunId,
          decision.decisionRequestId,
          decision.intervention
        );
        return;
      }
      if (!decision || !edges.some((edge) => edge.target === decision.targetNodeId)) {
        throw new Error("Independent Main did not commit a valid fenced downstream route");
      }
      target = decision.targetNodeId;
      route = {
        kind: "weak",
        targetNodeId: target,
        selectedByAgentId: "main",
        decisionRequestId: decision.decisionRequestId
      };
    }
    const routeEmissionId = `route-${currentGroup.nodeRunId}`;
    this.#residents.delete(leaderKey);
    await database.completeGroup({
      projectId: state.id,
      groupRunId: group.id,
      nodeRunId: currentGroup.nodeRunId,
      coordinatorEpoch: currentGroup.coordinatorEpoch,
      routeEmissionId,
      route,
      requestId: `group-complete-${group.id}`
    });
    await this.releaseCompletedGroupWorktree(state, group.id, signal);
    await this.publishProjection(state, (await database.projectState(state.id)));
    if (target === "finish") {
      await database.deliverRoute({
        projectId: state.id,
        routeEmissionId,
        activationRequestId: `finish-${routeEmissionId}`
      });
      await this.publishProjection(state, (await database.projectState(state.id)));
      state.status = "completed";
      state.phase = "completed";
      state.completedAt = new Date().toISOString();
      state.lastError = undefined;
      await this.saveState(state);
      return;
    }
    await this.activateAndRunNode(state, target, {
      activationRequestId: `route-${routeEmissionId}`,
      inputSnapshotRef: `route:${routeEmissionId}`,
      assignment: completionOutput,
      activatedByAgentId: "main",
      sourceNodeRunId: currentGroup.nodeRunId,
      sourceGroupRunId: group.id,
      sourceAgentId: coordinator,
      sourceRouteKind: route.kind,
      ...(route.kind === "weak"
        ? { sourceRouteSelectedByAgentId: route.selectedByAgentId }
        : {})
    }, signal, async () => {
      await database.deliverRoute({
        projectId: state.id,
        routeEmissionId,
        activationRequestId: `route-${routeEmissionId}`
      });
      await this.publishProjection(state, (await database.projectState(state.id)));
    });
  }

  private async releaseCompletedGroupWorktree(
    state: ProjectState,
    groupRunId: string,
    signal: AbortSignal
  ): Promise<void> {
    const release = (await this.git(state.id)).releaseFinalIntegrationWorktree;
    if (!release) return;
    const projection = await this.database().projectState(state.id);
    const group = projection.groupRuns.find((item) => item.id === groupRunId);
    if (!group || group.status !== "completed" || !group.integrationOwnerExecutionId) return;
    const execution = projection.executions.find((item) =>
      item.id === group.integrationOwnerExecutionId &&
      item.purpose === "final-integration" &&
      item.status === "succeeded"
    );
    if (!execution) return;
    await release.call(
      (await this.git(state.id)),
      execution,
      execution.ownershipEpoch,
      signal
    );
  }

  private async resumeContinuationTask(
    state: ProjectState,
    group: GroupRun,
    leader: CollaborationResidentHandle,
    signal: AbortSignal,
    recoverySeed?: ResidentRecoveryProofSeed,
    targetPredecessorExecutionId?: string,
    resumeAfterAuthorization = false
  ): Promise<GroupContinuationOutcome> {
    const database = this.database();
    let target = targetPredecessorExecutionId;
    let chainTaskId = target
      ? (await database.projectState(state.id)).executions.find((item) => item.id === target)?.taskId
      : undefined;
    let progressed = false;
    const transitionLimit = Math.max(8, group.memberSnapshot.length * 4);
    for (let transition = 0; transition < transitionLimit; transition += 1) {
      const projection = await database.projectState(state.id);
      group = projection.groupRuns.find((item) => item.id === group.id) ?? group;
      const task = projection.tasks.find((item) =>
        item.groupRunId === group.id && item.status === "continuation_pending" &&
        (!chainTaskId || item.id === chainTaskId) &&
        (!target || item.currentExecutionId === target)
      );
      const predecessor = task?.currentExecutionId
        ? projection.executions.find((item) => item.id === task.currentExecutionId)
        : undefined;

      if (!task || !predecessor || predecessor.status !== "stopped") {
        let repair: MemberExecution | undefined;
        for (const item of projection.executions) {
          if (item.id === group.integrationOwnerExecutionId && item.purpose === "final-integration" && item.status === "succeeded" &&
            (!chainTaskId || item.taskId === chainTaskId) && item.executionBranch !== group.groupBranch &&
            await database.executionPullBase(state.id, item.id) === group.groupBranch) { repair = item; break; }
        }
        if (!repair) return progressed ? "progressed" : "idle";
        const repairTask = projection.tasks.find((item) => item.id === repair.taskId);
        const canonical = await this.runCanonicalFinalRetryAfterRepair(
          state,
          group,
          repair,
          repairTask?.assignment ?? "Publish the repaired group branch to main.",
          leader,
          signal
        );
        if (!canonical) return "fault-paused";
        progressed = true;
        target = canonical.status === "stopped" ? canonical.id : undefined;
        if (canonical.status === "stopped") continue;
        return "progressed";
      }
      chainTaskId ??= task.id;

      const expectedBase = await database.executionPullBase(state.id, predecessor.id);
      let remotePull = await this.observeExecutionPullForRecovery(
        state,
        predecessor,
        expectedBase,
        new AbortController().signal
      );
      const stopReason = (await database.latestExecutionStopRequest(
        state.id,
        predecessor.id,
        predecessor.ownershipEpoch
      ))?.payload.reason;
      let coordinationRequestId: string | undefined;
      if (remotePull && remotePull.status !== "closed" && stopReason !== "service_restart_reconcile" &&
        !(await database.executionHasResumableStopProvenance(state.id, predecessor.id, predecessor.ownershipEpoch))) {
        // Wait for all business writers to settle before waking management.
        // Preserve the PR: only the actual Leader can decide to resume its
        // original Agent, using the existing assignment/handoff protocol.
        if (projection.executions.some((item) => item.groupRunId === group.id &&
          !["succeeded", "failed", "cancelled", "stopped", "superseded"].includes(item.status))) return "idle";
        const input = {
          inputId: `input-${group.id}-retained-owner-${predecessor.id}-${predecessor.ownershipEpoch}-${group.coordinatorEpoch}`,
          invocationId: stableRuntimeId("inv",
            `retained-owner:${group.id}:${predecessor.id}:${predecessor.ownershipEpoch}:${group.coordinatorEpoch}`),
          prompt: [
            `Execution ${predecessor.id}@${predecessor.ownershipEpoch} is stop-confirmed after failure: ${predecessor.failureReason ?? "unknown"}.`,
            `Task ${task.id}: ${task.assignment}`,
            `Original Agent: ${predecessor.agentId}; retained branch: ${predecessor.executionBranch}; cwd: ${predecessor.worktreePath}.`,
            `Its existing PR #${remotePull.providerNumber} is ${remotePull.status}, targeting ${expectedBase}.`,
            "Decide whether the original Agent can continue this task in its retained context and handle the actual tool results.",
            "To resume it, use assign_group_tasks with exactly this existing task id, its original Agent as assignee, your continuation instructions, and no new dependencies. Do not create another PR owner or do its business work."
          ].join("\n\n")
        };
        const arrangement = await this.submitGroupLeader(state, group, leader, signal, input);
        const action = arrangement.controlActions?.map((envelope) => envelope.action)
          .find((candidate) => candidate.tool === "assign_group_tasks");
        const chosen = action?.tool === "assign_group_tasks" && action.tasks.length === 1 ? action.tasks[0] : undefined;
        if (!chosen || chosen.taskId !== task.id || chosen.assigneeAgentId !== predecessor.agentId ||
          (chosen.dependencyTaskIds?.length ?? 0) !== 0) {
          throw new Error("Leader did not authorize the retained PR's original Agent to continue");
        }
        coordinationRequestId = acceptedGroupControlIdentity(state.id, group.nodeRunId, group, input).requestId;
      }
      if (remotePull && remotePull.status !== "closed") {
        const invocationId = newId("inv");
        const recovered = (await database.recoverGroupExecution({
          projectId: state.id,
          groupRunId: group.id,
          executionId: predecessor.id,
          predecessorOwnershipEpoch: predecessor.ownershipEpoch,
          invocationId,
          ...(coordinationRequestId ? { coordinationRequestId } : {}),
          residentLaunchProtocol: "trusted-supervisor-v1",
          requestId: `restart-owner-${predecessor.id}-${predecessor.ownershipEpoch + 1}`
        })).execution;
        await this.claimWorkerLaneWithWait(state.id, recovered, signal);
        await (await this.git(state.id)).sessionBegin(
          recovered,
          recovered.ownershipEpoch,
          recovered.purpose === "final-integration"
            ? { kind: "final-integration", groupRunId: group.id }
            : { kind: "delivery", base: { kind: "group", groupRunId: group.id } },
          signal
        );
        const pull = (await database.projectState(state.id)).pullRequests.find((item) =>
          item.ownerExecutionId === recovered.id
        );
        if (!pull) throw new Error(`Recovered execution ${recovered.id} lost its remote pull fact`);
        const settled = await this.runGroupExecutionWithRecovery(
          state,
          group,
          recovered,
          (await this.groupMemberAssignment(
            state,
            group,
            recovered,
            (await database.projectState(state.id)).tasks.find((item) => item.id === task.id)?.assignment ?? task.assignment,
            `${coordinationRequestId ? "Leader-authorized original Agent continuation" : "Remote pull reconciliation"} at ownership epoch ${recovered.ownershipEpoch}`
          )),
          expectedBase,
          signal,
          undefined,
          recoverySeed,
          false,
          pull
        );
        progressed = true;
        target = settled.status === "stopped" ? settled.id : undefined;
        if (settled.status === "stopped") continue;
        continue;
      }

      const activeAgents = new Set((await database.projectState(state.id)).executions
        .filter((execution) => execution.groupRunId === group.id &&
          !["succeeded", "failed", "cancelled", "stopped", "superseded"].includes(execution.status))
        .map((execution) => execution.agentId));
      const stateEligible = new Set((await database.eligibleDeliveryMembers(state.id, group.id)));
      const healthyAgents = group.memberSnapshot.filter((candidate) =>
        candidate !== group.leaderAgentId &&
        stateEligible.has(candidate)
      );
      const eligibleAgents = healthyAgents.filter((candidate) => !activeAgents.has(candidate));
      const coordinator = group.actingCoordinatorId ?? group.leaderAgentId;
      if (eligibleAgents.length === 0) {
        // Another recovery plan still owns a healthy member. Defer this chain
        // until that writer settles instead of falsely declaring all members
        // failed (which S correctly rejects while a healthy member remains).
        if (healthyAgents.length !== 0) return "idle";
        await database.pauseAllMembersFailed({
          projectId: state.id,
          groupRunId: group.id,
          actorAgentId: coordinator,
          coordinatorEpoch: group.coordinatorEpoch,
          requestId: `all-members-failed-${group.id}-${group.coordinatorEpoch}`
        });
        await this.publishProjection(state, (await database.projectState(state.id)));
        // Publication yields to lifecycle requests. A durable Resume/Cancel
        // accepted in that interval owns the newer state, even before save.
        if (await this.cancellationIsDurable(state.id) || state.pauseRequest ||
          (await database.projectState(state.id)).groupRuns.find(item => item.id === group.id)?.status !== "paused") return "fault-paused";
        state.status = "retrying";
        state.phase = "collaboration:all-members-failed";
        state.lastError = undefined;
        await this.saveState(state);
        return "fault-paused";
      }

      const arrangementInput = {
        inputId: `input-${group.id}-handoff-${predecessor.id}-${predecessor.ownershipEpoch}-${group.coordinatorEpoch}`,
        invocationId: stableRuntimeId(
          "inv",
          `handoff:${group.id}:${predecessor.id}:${predecessor.ownershipEpoch}:${group.coordinatorEpoch}`
        ),
        prompt: [
          `Execution ${predecessor.id}@${predecessor.ownershipEpoch} is stop-confirmed after failure.`,
          `Task ${task.id}: ${task.assignment}`,
          `Eligible, currently idle survivors: ${eligibleAgents.join(", ")}.`,
          "Arrange the continuation now with assign_group_tasks: emit exactly this existing task id, name exactly one eligible assignee, and do not add dependencies."
        ].join("\n\n")
      };
      const arrangement = await this.submitGroupLeader(state, group, leader, signal, arrangementInput);
      const action = arrangement.controlActions
        ?.map((envelope) => envelope.action)
        .find((candidate) => candidate.tool === "assign_group_tasks");
      const arrangedTask = action?.tool === "assign_group_tasks" && action.tasks.length === 1
        ? action.tasks[0]
        : undefined;
      const candidate = arrangedTask?.assigneeAgentId;
      if (!arrangedTask || arrangedTask.taskId !== task.id || !candidate ||
        !eligibleAgents.includes(candidate) || (arrangedTask.dependencyTaskIds?.length ?? 0) !== 0) {
        throw new Error("Group leader did not commit a valid fenced handoff arrangement");
      }

      if (predecessor.purpose === "final-integration" && candidate !== predecessor.agentId) {
        const git = await this.git(state.id);
        const release = git.releaseFailedFinalIntegrationWorktree ??
          git.releaseFinalIntegrationWorktree;
        if (!release) {
          throw new Error("Final-integration handoff requires retained worktree release support");
        }
        await release.call(git, predecessor, predecessor.ownershipEpoch, signal);
      }
      if (candidate === predecessor.agentId) {
        const recovered = (await database.recoverGroupExecution({
          projectId: state.id,
          groupRunId: group.id,
          executionId: predecessor.id,
          predecessorOwnershipEpoch: predecessor.ownershipEpoch,
          invocationId: stableRuntimeId("inv", `original-owner:${predecessor.id}:${predecessor.ownershipEpoch + 1}`),
          coordinationRequestId: acceptedGroupControlIdentity(state.id, group.nodeRunId, group, arrangementInput).requestId,
          residentLaunchProtocol: "trusted-supervisor-v1",
          requestId: `original-owner-${predecessor.id}-${predecessor.ownershipEpoch + 1}`
        })).execution;
        await this.claimWorkerLaneWithWait(state.id, recovered, signal);
        await (await this.git(state.id)).sessionBegin(recovered, recovered.ownershipEpoch,
          recovered.purpose === "final-integration"
            ? { kind: "final-integration", groupRunId: group.id }
            : { kind: "delivery", base: { kind: "group", groupRunId: group.id } }, signal);
        const settled = await this.runGroupExecutionWithRecovery(state, group, recovered,
          (await this.groupMemberAssignment(state, group, recovered, arrangedTask.assignment,
            `Leader-authorized original Agent continuation at ownership epoch ${recovered.ownershipEpoch}`)),
          expectedBase, signal, undefined, recoverySeed, resumeAfterAuthorization);
        progressed = true;
        target = settled.status === "stopped" ? settled.id : undefined;
        if (settled.status === "stopped") continue;
        continue;
      }

      const successorExecutionId = stableRuntimeId(
        "execution",
        `handoff:${predecessor.id}:${predecessor.ownershipEpoch + 1}`
      );
      const successorInvocationId = stableRuntimeId(
        "inv",
        `handoff:${predecessor.id}:${predecessor.ownershipEpoch + 1}`
      );
      const worktreePath = executionWorktreePath(
        this.#storage.projectDir(state.id), state.orchestration,
        candidate, successorExecutionId
      );
      const retainedCheckpoint = (await database.latestExecutionTerminalPreparation(
        state.id,
        predecessor.id,
        predecessor.ownershipEpoch,
        "handoff"
      ))?.payload.checkpointCommit;
      const successor = (await database.handoffExecution({
        projectId: state.id,
        groupRunId: group.id,
        taskId: task.id,
        predecessorExecutionId: predecessor.id,
        predecessorOwnershipEpoch: predecessor.ownershipEpoch,
        successorAgentId: candidate,
        successorExecutionId,
        successorBranch: `executions/${successorExecutionId}`,
        successorWorktreePath: worktreePath,
        successorInvocationId,
        residentLaunchProtocol: "trusted-supervisor-v1",
        actorAgentId: coordinator,
        coordinatorEpoch: group.coordinatorEpoch,
        requestId: `continue-${predecessor.id}-${predecessor.ownershipEpoch + 1}`
      })).successor;
      await this.claimWorkerLaneWithWait(state.id, successor, signal);
      await (await this.git(state.id)).sessionBegin(
        successor,
        successor.ownershipEpoch,
        predecessor.purpose === "final-integration"
          ? { kind: "final-integration", groupRunId: group.id }
          : typeof retainedCheckpoint === "string"
            ? { kind: "delivery", base: { kind: "commit", commitSha: retainedCheckpoint } }
            : { kind: "delivery", base: { kind: "group", groupRunId: group.id } },
        signal
      );
      const settled = await this.runGroupExecutionWithRecovery(
        state,
        group,
        successor,
        (await this.groupMemberAssignment(
          state,
          group,
          successor,
          task.assignment,
          `Leader-arranged stop-confirmed continuation at ownership epoch ${successor.ownershipEpoch}`
        )),
        (await database.executionPullBase(state.id, successor.id)),
        signal,
        undefined,
        undefined,
        resumeAfterAuthorization
      );
      progressed = true;
      target = settled.status === "stopped" ? settled.id : undefined;
      if (settled.status === "stopped") continue;
    }
    throw new Error(`Group continuation exceeded its bounded recovery chain for ${group.id}`);
  }

  private async runCanonicalFinalRetryAfterRepair(
    state: ProjectState,
    group: GroupRun,
    repair: MemberExecution,
    assignment: string,
    leader: CollaborationResidentHandle,
    signal: AbortSignal
  ): Promise<MemberExecution | undefined> {
    const coordinator = group.actingCoordinatorId ?? group.leaderAgentId;
    const projection = await this.database().projectState(state.id);
    const activeAgents = new Set(projection.executions
      .filter((execution) => execution.groupRunId === group.id &&
        !["succeeded", "failed", "cancelled", "stopped", "superseded"].includes(execution.status))
      .map((execution) => execution.agentId));
    const stateEligible = new Set((await this.database().eligibleDeliveryMembers(state.id, group.id)));
    const eligibleAgents = group.memberSnapshot.filter((candidate) =>
      candidate !== group.leaderAgentId &&
      !activeAgents.has(candidate) &&
      stateEligible.has(candidate)
    );
    if (eligibleAgents.length === 0) {
      await this.database().pauseAllMembersFailed({
        projectId: state.id,
        groupRunId: group.id,
        actorAgentId: coordinator,
        coordinatorEpoch: group.coordinatorEpoch,
        requestId: `all-members-failed-after-repair-${group.id}-${repair.id}`
      });
      await this.publishProjection(state, (await this.database().projectState(state.id)));
      if (await this.cancellationIsDurable(state.id) || state.pauseRequest ||
        (await this.database().projectState(state.id)).groupRuns.find(item => item.id === group.id)?.status !== "paused") return undefined;
      state.status = "retrying";
      state.phase = "collaboration:all-members-failed";
      state.lastError = undefined;
      await this.saveState(state);
      return undefined;
    }
    const task = projection.tasks.find((candidate) => candidate.id === repair.taskId);
    if (!task) throw new Error(`Merged repair ${repair.id} lost its final task`);
    const arrangement = await this.submitGroupLeader(state, group, leader, signal, {
      inputId: `input-${group.id}-canonical-${repair.id}-${group.coordinatorEpoch}`,
      invocationId: stableRuntimeId(
        "inv",
        `canonical-owner:${group.id}:${repair.id}:${group.coordinatorEpoch}`
      ),
      prompt: [
        `Repair execution ${repair.id}@${repair.ownershipEpoch} is authoritatively merged into ${group.groupBranch}.`,
        `Eligible, currently idle final publishers: ${eligibleAgents.join(", ")}.`,
        "Arrange the canonical group-to-main retry with assign_group_tasks: emit exactly the existing final task id, name exactly one eligible assignee, and do not add dependencies.",
        `Existing final task id: ${task.id}.`
      ].join("\n\n")
    });
    const action = arrangement.controlActions
      ?.map((envelope) => envelope.action)
      .find((candidate) => candidate.tool === "assign_group_tasks");
    const arrangedTask = action?.tool === "assign_group_tasks" && action.tasks.length === 1
      ? action.tasks[0]
      : undefined;
    const ownerAgentId = arrangedTask?.assigneeAgentId;
    if (!arrangedTask || arrangedTask.taskId !== task.id || !ownerAgentId ||
      !eligibleAgents.includes(ownerAgentId) ||
      (arrangedTask.dependencyTaskIds?.length ?? 0) !== 0) {
      throw new Error("Group leader did not commit a valid canonical retry owner");
    }
    const canonicalExecutionId = stableRuntimeId(
      "execution",
      `canonical-final:${repair.id}:${repair.ownershipEpoch + 1}`
    );
    const canonicalInvocationId = stableRuntimeId(
      "inv",
      `canonical-final:${repair.id}:${repair.ownershipEpoch + 1}`
    );
    const canonical = (await this.database().startCanonicalFinalRetry({
      projectId: state.id,
      groupRunId: group.id,
      repairExecutionId: repair.id,
      repairOwnershipEpoch: repair.ownershipEpoch,
      ownerAgentId,
      executionId: canonicalExecutionId,
      executionBranch: group.groupBranch,
      worktreePath: executionWorktreePath(
        this.#storage.projectDir(state.id), state.orchestration,
        ownerAgentId, canonicalExecutionId
      ),
      invocationId: canonicalInvocationId,
      residentLaunchProtocol: "trusted-supervisor-v1",
      actorAgentId: coordinator,
      coordinatorEpoch: group.coordinatorEpoch,
      requestId: `canonical-final-${repair.id}-${repair.ownershipEpoch + 1}`
    })).execution;
    await this.claimWorkerLaneWithWait(state.id, canonical, signal);
    await (await this.git(state.id)).sessionBegin(
      canonical,
      canonical.ownershipEpoch,
      { kind: "final-integration", groupRunId: group.id },
      signal
    );
    const settled = await this.runGroupExecutionWithRecovery(
      state,
      group,
      canonical,
      (await this.groupMemberAssignment(
        state,
        group,
        canonical,
        assignment,
        `Canonical group-to-main retry after repair ${repair.id}`
      )),
      "main",
      signal,
      undefined,
      undefined,
      true
    );
    return (await this.database().projectState(state.id)).executions.find((execution) =>
      execution.id === canonical.id
    ) ?? settled;
  }

  private async runGroupMemberOnce(
    state: ProjectState,
    group: GroupRun,
    agentId: string,
    signal: AbortSignal
  ): Promise<boolean> {
    await this.applyWaitingWorkflowAdjustments(state);
    const database = this.database();
    if (signal.aborted) return false;
    const workerLane = (await database.laneAvailability(state.id)).find((lane) => lane.lane === "worker");
    if (!workerLane || workerLane.available < 1) return false;
    const executionId = `execution-${newId("run")}`;
    const worktreePath = executionWorktreePath(
      this.#storage.projectDir(state.id), state.orchestration, agentId, executionId
    );
    const claimed = await database.claimNextTask({
        projectId: state.id,
        groupRunId: group.id,
        agentId,
        executionId,
        executionBranch: `executions/${executionId}`,
        worktreePath,
        invocationId: newId("inv"),
        residentLaunchProtocol: "trusted-supervisor-v1",
        requestId: `claim-${executionId}`
      });
    if (!claimed) return false;
    await this.claimWorkerLaneWithWait(state.id, claimed.execution, signal);
    await (await this.git(state.id)).sessionBegin(
      claimed.execution,
      claimed.execution.ownershipEpoch,
      { kind: "delivery", base: { kind: "group", groupRunId: group.id } },
      signal
    );
    await this.runGroupExecutionWithRecovery(
      state,
      group,
      claimed.execution,
      (await this.groupMemberAssignment(
        state,
        group,
        claimed.execution,
        claimed.task.assignment,
        "Preclaimed by the trusted FIFO scheduler; complete only this assignment"
      )),
      group.groupBranch,
      signal
    );
    return true;
  }

  private async recoverFailedGroupExecution(
    state: ProjectState,
    failed: MemberExecution,
    cause: unknown
  ): Promise<void> {
    const database = this.database();
    const reason = safeRuntimeError(cause);
    const current = (await database.projectState(state.id)).executions.find((item) => item.id === failed.id);
    if (!current || ["succeeded", "failed", "cancelled", "stopped", "superseded"].includes(current.status)) {
      throw cause;
    }
    await this.appendFailureAttempt(state, {
      attemptId: durableAttemptId("execution-failure", [
        state.id,
        failed.id,
        String(failed.ownershipEpoch)
      ]),
      operation: `task:${failed.taskId}`,
      error: cause,
      ...(failed.startedAt ? { startedAt: failed.startedAt } : {}),
      agentId: failed.agentId,
      nodeRunId: failed.nodeRunId,
      ...(failed.groupRunId ? { groupRunId: failed.groupRunId } : {}),
      taskId: failed.taskId,
      executionId: failed.id,
      ...(failed.invocationId ? { invocationId: failed.invocationId } : {}),
      ownershipEpoch: failed.ownershipEpoch,
      metadata: { executionStatus: current.status, purpose: failed.purpose }
    });
    await database.requestExecutionStop({
      projectId: state.id,
      executionId: failed.id,
      ownershipEpoch: failed.ownershipEpoch,
      reason,
      requestId: `failure-stop-${executionEpochIdentity(failed)}`
    });
    const residentEntry = this.#residents.get(failed.id);
    let residentStopEvidence: Readonly<Record<string, unknown>> = { residentClosed: true };
    if (residentEntry) {
      try {
        await residentEntry.handle.close();
      } catch (closeError) {
        await database.confirmExecutionStopped({
          projectId: state.id,
          executionId: failed.id,
          ownershipEpoch: failed.ownershipEpoch,
          stopped: false,
          evidence: { closeFailed: true },
          requestId: `failure-stop-unconfirmed-${executionEpochIdentity(failed)}`
        });
        throw new Error(`Failed execution ${failed.id} could not be stop-confirmed`, {
          cause: closeError
        });
      }
    } else {
      const stopForRecovery = this.#residentLauncher?.stopForRecovery;
      if (!stopForRecovery || !failed.invocationId ||
        !(await this.executionLaunchStarted(state.id, failed))) {
        throw new Error(`Failed execution ${failed.id} has no resident stop authority`, { cause });
      }
      const observation = await stopForRecovery({
        state: structuredClone(state),
        execution: structuredClone(failed),
        executionRuntimePath: await this.#storage.invocationRuntimePath(
          state.id,
          failed.invocationId
        ),
        residentLaunchProtocol: await this.executionStopProtocol(state.id, failed)
      });
      if (!observation.stopped) {
        await database.confirmExecutionStopped({
          projectId: state.id,
          executionId: failed.id,
          ownershipEpoch: failed.ownershipEpoch,
          stopped: false,
          evidence: observation.evidence,
          requestId: `failure-stop-unconfirmed-${executionEpochIdentity(failed)}`
        });
        throw new Error(`Failed execution ${failed.id} could not be stop-confirmed`, { cause });
      }
      residentStopEvidence = observation.evidence;
    }
    const residentActivity = residentEntry?.activity ?? (await database.projectState(state.id))
      .runtimeActivities.find((activity) =>
        activity.kind === "resident" && activity.executionId === failed.id &&
        activity.ownershipEpoch === failed.ownershipEpoch
      );
    if (residentActivity) {
      await this.closeRuntimeActivity(state, residentActivity, {
        kind: "resident",
        invocationId: residentActivity.invocationId,
        outcome: "stopped",
        requestId: `runtime-resident-stop-${failed.id}-${failed.ownershipEpoch}`
      });
    }
    this.#residents.delete(failed.id);
    // The provider may have committed pull.create or merge even though the
    // resident observed an exception. Discover and persist that exact remote
    // fact while the failed epoch still owns its provider fence. An
    // unresolved create operation deliberately throws here and leaves the
    // execution stop-requested instead of authorizing an unsafe handoff.
    const observedPull = await this.observeExecutionPullForRecovery(
      state,
      failed,
      (await database.executionPullBase(state.id, failed.id)),
      new AbortController().signal
    );
    const terminalEvidence = await this.prepareStoppedExecutionForTerminalTransition(
      state,
      failed,
      reason,
      "handoff"
    );
    await database.confirmExecutionStopped({
      projectId: state.id,
      executionId: failed.id,
      ownershipEpoch: failed.ownershipEpoch,
      stopped: true,
      evidence: {
        ...residentStopEvidence,
        failure: reason.slice(0, 500),
        ...terminalEvidence
      },
      requestId: `failure-stop-confirmed-${executionEpochIdentity(failed)}`
    });
    // Stop proof and remote observations only preserve the failed owner's
    // facts. The original Agent must process them and explicitly finish;
    // the service cannot complete a task merely because its PR was merged.
    await this.publishProjection(state, (await database.projectState(state.id)));
  }

  /**
   * Every group writer, including repair and canonical retry writers, uses
   * the same failure fence. A model/native failure may race a provider-side
   * create or merge, so callers must never let the exception bypass stop,
   * remote discovery, terminal preparation, and same-owner merge recovery.
   */
  private async runGroupExecutionWithRecovery(
    state: ProjectState,
    group: GroupRun,
    execution: MemberExecution,
    assignment: string,
    pullBase: string,
    signal: AbortSignal,
    recoveredResident?: CollaborationResidentHandle,
    recoverySeed?: ResidentRecoveryProofSeed,
    resumeAfterAuthorization = false,
    recoveredPull?: PullRequestRecord
  ): Promise<MemberExecution> {
    try {
      await this.runGroupExecution(
        state,
        group,
        execution,
        assignment,
        pullBase,
        signal,
        recoveredResident,
        recoverySeed,
        resumeAfterAuthorization,
        recoveredPull
      );
      if ((await this.resolveOperationFailures(
        state,
        `task:${execution.taskId}`,
        execution.startedAt ?? nowIso(),
        "A later task execution succeeded",
        {
          agentId: execution.agentId,
          nodeRunId: execution.nodeRunId,
          ...(execution.groupRunId ? { groupRunId: execution.groupRunId } : {}),
          taskId: execution.taskId,
          executionId: execution.id,
          ...(execution.invocationId ? { invocationId: execution.invocationId } : {}),
          ownershipEpoch: execution.ownershipEpoch
        }
      ))) {
        await this.publishProjection(state, (await this.database().projectState(state.id)));
      }
    } catch (error) {
      if (error instanceof ResidentRetainedWaitError ||
        (error instanceof CollaborationGitError &&
          error.code === "GITHUB_WAITING_FOR_AUTHORIZATION") ||
        signal.aborted || this.#shuttingDown || this.#cancellingProjects.has(state.id)) {
        throw error;
      }
      await this.recoverFailedGroupExecution(state, execution, error);
    }
    return (await this.database().projectState(state.id)).executions.find((candidate) =>
      candidate.id === execution.id
    ) ?? execution;
  }

  private async groupMemberAssignment(
    state: ProjectState,
    group: GroupRun,
    execution: MemberExecution,
    assignment: string,
    phase: string
  ): Promise<string> {
    const projection = await this.database().projectState(state.id);
    const current = projection.tasks.find(task => task.id === execution.taskId);
    const messages = [{ sender: group.actingCoordinatorId ?? group.leaderAgentId,
      body: current?.assignment ?? assignment }];
    for (const dependencyId of current?.dependencyTaskIds ?? []) {
      const owner = projection.tasks.find(task => task.id === dependencyId)?.currentExecutionId;
      const dependency = projection.executions.find(item => item.id === owner && item.status === "succeeded");
      if (dependency?.output !== undefined) messages.push({ sender: dependency.agentId, body: dependency.output });
    }
    return workflowMessagesText(messages);
  }

  private async claimWorkerLaneWithWait(
    projectId: string,
    execution: MemberExecution,
    signal: AbortSignal
  ): Promise<void> {
    while (!signal.aborted) {
      try {
        await this.database().claimWorkerLane({
          projectId,
          executionId: execution.id,
          ownershipEpoch: execution.ownershipEpoch
        });
        return;
      } catch (error) {
        const code = error && typeof error === "object" && "code" in error
          ? String((error as { code?: unknown }).code)
          : "";
        if (code !== "CAPACITY_UNAVAILABLE") throw error;
        await abortableRuntimeDelay(10, signal);
      }
    }
    throw new Error("Worker lane wait was aborted");
  }

  private async waitWhilePaused(projectId: string, signal: AbortSignal): Promise<void> {
    while (this.#pausedProjects.has(projectId)) {
      if (signal.aborted) throw new Error("Collaboration turn was cancelled while paused");
      await new Promise<void>((resolve, reject) => {
        const waiters = this.#pauseWaiters.get(projectId) ?? [];
        waiters.push(resolve);
        this.#pauseWaiters.set(projectId, waiters);
        const abort = () => {
          signal.removeEventListener("abort", abort);
          reject(new Error("Collaboration turn was cancelled while paused"));
        };
        signal.addEventListener("abort", abort, { once: true });
      });
    }
  }

  private async executionActivityAuthority(
    projectId: string,
    execution: MemberExecution
  ): Promise<RuntimeActivityAuthority> {
    const group = execution.groupRunId
      ? (await this.database().projectState(projectId)).groupRuns
          .find((candidate) => candidate.id === execution.groupRunId)
      : undefined;
    if (execution.groupRunId && !group) {
      throw new Error(`Execution ${execution.id} lost its collaboration group authority`);
    }
    return {
      agentId: execution.agentId,
      nodeRunId: execution.nodeRunId,
      ...(execution.groupRunId ? { groupRunId: execution.groupRunId } : {}),
      taskId: execution.taskId,
      executionId: execution.id,
      ownershipEpoch: execution.ownershipEpoch,
      ...(group ? { coordinatorEpoch: group.coordinatorEpoch } : {})
    };
  }

  private groupActivityAuthority(group: GroupRun): RuntimeActivityAuthority {
    return {
      agentId: group.actingCoordinatorId ?? group.leaderAgentId,
      nodeRunId: group.nodeRunId,
      groupRunId: group.id,
      coordinatorEpoch: group.coordinatorEpoch
    };
  }

  private async startRuntimeActivity(
    state: ProjectState,
    authority: RuntimeActivityAuthority,
    input: {
      kind: RuntimeActivity["kind"];
      phase: RuntimeActivity["phase"];
      invocationId: string;
      inputId?: string;
      requestId: string;
    }
  ): Promise<void> {
    await this.database().startRuntimeActivity({
      projectId: state.id,
      ...authority,
      ...input
    });
    // The SQLite commit above is the launch barrier. SSE consumes the same
    // pure projection directly; state.json waits for the next compatibility
    // publication so sibling member launches are never serialized by file I/O.
    const runtime = deriveProjectRuntimeProjection(
      (await this.database().projectState(state.id)),
      state
    );
    state.runtime = runtime;
    await publishAuthoritativeWorkflowFiles(
      this.#storage.projectDir(state.id),
      (await this.database().authoritativeWorkflowFiles(state.id)),
      () => this.assertWritable()
    );
    this.assertWritable();
    this.#storage.hub.publishRuntime(state.id, runtime);
  }

  private async closeRuntimeActivity(
    state: ProjectState,
    authority: RuntimeActivityAuthority,
    input: {
      kind: RuntimeActivity["kind"];
      invocationId: string;
      outcome: "completed" | "failed" | "cancelled" | "superseded" | "stopped";
      requestId: string;
    }
  ): Promise<void> {
    await this.database().closeRuntimeActivity({
      projectId: state.id,
      kind: input.kind,
      invocationId: input.invocationId,
      nodeRunId: authority.nodeRunId,
      ...(authority.groupRunId ? { groupRunId: authority.groupRunId } : {}),
      ...(authority.executionId ? { executionId: authority.executionId } : {}),
      ...(authority.ownershipEpoch !== undefined
        ? { ownershipEpoch: authority.ownershipEpoch }
        : {}),
      ...(authority.coordinatorEpoch !== undefined
        ? { coordinatorEpoch: authority.coordinatorEpoch }
        : {}),
      outcome: input.outcome,
      requestId: input.requestId
    });
    const runtime = deriveProjectRuntimeProjection(
      (await this.database().projectState(state.id)),
      state
    );
    state.runtime = runtime;
    await publishAuthoritativeWorkflowFiles(
      this.#storage.projectDir(state.id),
      (await this.database().authoritativeWorkflowFiles(state.id)),
      () => this.assertWritable()
    );
    this.assertWritable();
    this.#storage.hub.publishRuntime(state.id, runtime);
  }

  private async submitNativeTurn(
    state: ProjectState, resident: CollaborationResidentHandle,
    turn: { inputId: string; invocationId: string; prompt: string }
  ): Promise<AgentRunResult> {
    let status: "completed" | "incomplete" = "incomplete";
    try {
      const notice = await this.latestFailureNotice(state);
      const result = await resident.submit(notice ? { ...turn, prompt: `${notice}\n\n${turn.prompt}` } : turn);
      status = "completed";
      return result;
    } finally {
      await this.finishInvocationDiagnostics(state, turn.invocationId, status);
    }
  }

  private async finishInvocationDiagnostics(state: ProjectState, invocationId: string, status: "completed" | "incomplete"): Promise<void> {
    try { await this.#invocationDispatcher?.finish?.(state, invocationId, status); }
    catch (error) { console.warn(`Invocation diagnostics were not saved (${invocationId}): ${supervisionError(error)}`); }
  }

  private async submitResident(
    state: ProjectState,
    resident: CollaborationResidentHandle,
    signal: AbortSignal,
    input: { inputId: string; invocationId: string; prompt: string },
    authority: RuntimeActivityAuthority
  ): Promise<AgentRunResult> {
    await this.waitWhilePaused(state.id, signal);
    await this.startRuntimeActivity(state, authority, {
      kind: "turn",
      phase: "model:running",
      invocationId: input.invocationId,
      inputId: input.inputId,
      requestId: `runtime-turn-start-${input.inputId}-${input.invocationId}`
    });
    const endNativeTaskTurn = this.beginNativeTaskTurn(state.id, signal, input.invocationId);
    let result: AgentRunResult;
    let outcome: "completed" | "failed" | "cancelled" = "failed";
    try {
      const turnKey = JSON.stringify([state.id, input.invocationId, input.inputId]);
      this.#activeResidentTurns.add(turnKey);
      let nativeStatus: "completed" | "incomplete" = "incomplete";
      try {
        const notice = await this.latestFailureNotice(state, authority);
        result = await resident.submit(notice ? { ...input, prompt: `${notice}\n\n${input.prompt}` } : input);
        nativeStatus = "completed";
      } finally {
        // Metrics persistence must not extend a returned turn's tool authority.
        this.#activeResidentTurns.delete(turnKey);
        await this.finishInvocationDiagnostics(state, input.invocationId, nativeStatus);
      }
      if (authority.executionId && authority.ownershipEpoch !== undefined && typeof result.handoff === "string") {
        // Persist only the Agent's actual output before acknowledging a safe
        // Pause. A later shutdown may abort the orchestration wait; it must
        // not discard this return or fabricate accepted business actions.
        await this.database().recordExecutionOutput({ projectId: state.id,
          executionId: authority.executionId, ownershipEpoch: authority.ownershipEpoch,
          agentId: authority.agentId, inputId: input.inputId, invocationId: input.invocationId,
          output: result.handoff });
        await this.publishProjection(state, (await this.database().projectState(state.id)));
      }
      outcome = "completed";
    } finally {
      if (signal.aborted || this.#cancellingProjects.has(state.id)) outcome = "cancelled";
      try {
        await this.closeRuntimeActivity(state, authority, {
          kind: "turn",
          invocationId: input.invocationId,
          outcome,
          requestId: `runtime-turn-close-${input.inputId}-${input.invocationId}`
        });
      } finally {
        endNativeTaskTurn();
      }
    }
    // A pause request may have arrived while the model turn was active. Stop
    // orchestration at this exact safe point before any Git or S transition.
    await this.waitWhilePaused(state.id, signal);
    return result;
  }

  private async submitGroupLeader(
    state: ProjectState, group: GroupRun, resident: CollaborationResidentHandle, signal: AbortSignal,
    input: { inputId: string; invocationId: string; prompt: string }
  ): Promise<AgentRunResult> {
    const database = this.database(), coordinator = group.actingCoordinatorId ?? group.leaderAgentId;
    const identity = acceptedGroupControlIdentity(state.id, group.nodeRunId, group, input);
    const completionKey = groupTaskCompletionKey(group, input.inputId);
    const accepted = async () => await database.acceptedGroupControlAction({ projectId: state.id, requestId: identity.requestId,
      nodeRunId: group.nodeRunId, groupRunId: group.id, coordinatorEpoch: group.coordinatorEpoch,
      actorAgentId: coordinator, inputId: input.inputId, semanticInputHash: identity.semanticInputHash });
    const completed = async () => Boolean((await database.eventByRequestId(state.id, groupTaskCompletionRequestId(completionKey))));
    const prior = await accepted();
    if (prior && (await database.eventByRequestId(state.id, `group-round-complete-${identity.semanticInputHash}`))) return acceptedGroupControlResult(prior);
    const initial = (await database.groupControlRepairCount(state.id, group.id, coordinator)) >= MAX_TASK_REPAIR_WAKEUPS
      ? prior ? acceptedGroupControlResult(prior) : { handoff: "No formal group decision was supplied" }
      : await this.submitGroupLeaderTurn(state, group, resident, signal, input);
    const supervised = await superviseTask({ key: `${state.id}:group:${group.id}:${input.inputId}`, value: initial, signal,
      inspect: async () => [!(await accepted()) && "formal group control decision", !(await completed()) && "finish_task",
        ...await resident.supervisionActions?.() ?? []].filter((item): item is string => Boolean(item)),
      reserve: async missing => {
        await this.waitWhilePaused(state.id, signal); signal.throwIfAborted();
        const count = await database.groupControlRepairCount(state.id, group.id, coordinator);
        if (count >= MAX_TASK_REPAIR_WAKEUPS || resident.closed) return undefined;
        await database.appendEvent({ projectId: state.id, groupRunId: group.id, nodeRunId: group.nodeRunId, agentId: coordinator,
          coordinatorEpoch: group.coordinatorEpoch, requestId: `group-control-repair-${group.id}-${identity.semanticInputHash}-${count + 1}`,
          type: "group.control.mechanism_repair.requested", payload: { attempt: count + 1, inputId: input.inputId, missing,
            semanticInputHash: identity.semanticInputHash } });
        return count + 1;
      },
      invoke: async attempt => this.submitGroupLeaderTurn(state, group, resident, signal, { ...input, invocationId: newId("inv") }, attempt),
      record: async (outcome, missing, reason) => {
        await database.appendEvent({ projectId: state.id, groupRunId: group.id, nodeRunId: group.nodeRunId, agentId: coordinator,
          coordinatorEpoch: group.coordinatorEpoch,
          type: "group.control.supervision.finished", payload: { inputId: input.inputId, outcome, missing, ...(reason ? { reason } : {}) } });
      }
    });
    const decision = await accepted();
    if (decision) {
      await database.appendEvent({ projectId: state.id, groupRunId: group.id, nodeRunId: group.nodeRunId,
        agentId: coordinator, coordinatorEpoch: group.coordinatorEpoch,
        requestId: `group-round-complete-${identity.semanticInputHash}`, type: "group.control.round.completed",
        payload: { inputId: input.inputId, completionKey, acceptedRequestId: identity.requestId } });
      return { ...acceptedGroupControlResult(decision), handoff: supervisionHandoff(supervised.value.handoff ?? "", supervised) };
    }
    const entry = [...this.#residents].find(([, value]) => value.projectId === state.id && value.handle === resident);
    if (entry) await this.closeResidentForTerminal(state, entry[0], resident);
    return { ...supervised.value, handoff: supervisionHandoff(supervised.value.handoff ?? "", supervised) };
  }

  private async submitGroupLeaderTurn(
    state: ProjectState,
    group: GroupRun,
    resident: CollaborationResidentHandle,
    signal: AbortSignal,
    input: { inputId: string; invocationId: string; prompt: string },
    reservedRepair?: number
  ): Promise<AgentRunResult> {
    await this.applyWaitingWorkflowAdjustments(state);
    const coordinator = group.actingCoordinatorId ?? group.leaderAgentId;
    const attemptStartedAt = nowIso();
    const identity = acceptedGroupControlIdentity(
      state.id,
      group.nodeRunId,
      group,
      input
    );
    const accepted = async (): Promise<AcceptedGroupControlAction | undefined> =>
      await this.database().acceptedGroupControlAction({
        projectId: state.id,
        requestId: identity.requestId,
        nodeRunId: group.nodeRunId,
        groupRunId: group.id,
        coordinatorEpoch: group.coordinatorEpoch,
        actorAgentId: coordinator,
        inputId: input.inputId,
        semanticInputHash: identity.semanticInputHash
      });
    const prior = await accepted();
    const rebound = !prior && group.coordinatorEpoch > 1
      ? (await this.database().rebindAcceptedGroupControlAction({
          projectId: state.id,
          groupRunId: group.id,
          sourceCoordinatorEpoch: group.coordinatorEpoch - 1,
          targetCoordinatorEpoch: group.coordinatorEpoch,
          actorAgentId: coordinator,
          requestId: identity.requestId,
          inputId: input.inputId,
          invocationId: input.invocationId,
          stateVersion: (await this.database().projectState(state.id)).stateRevision,
          semanticInputHash: identity.semanticInputHash
        }))
      : undefined;
    const completionKey = groupTaskCompletionKey(group, input.inputId);
    const completed = async () => {
      const event = await this.database().eventByRequestId(state.id, groupTaskCompletionRequestId(completionKey));
      return event?.type === "group.task_completion.committed" && event.agentId === coordinator &&
        event.groupRunId === group.id && event.coordinatorEpoch === group.coordinatorEpoch &&
        event.payload.taskId === completionKey;
    };
    const consume = async (fact: AcceptedGroupControlAction): Promise<AgentRunResult> => {
      await this.database().appendEvent({ projectId: state.id, groupRunId: group.id, nodeRunId: group.nodeRunId,
        agentId: coordinator, coordinatorEpoch: group.coordinatorEpoch,
        requestId: `group-round-complete-${identity.semanticInputHash}`, type: "group.control.round.completed",
        payload: { inputId: input.inputId, completionKey, acceptedRequestId: identity.requestId } });
      return acceptedGroupControlResult(fact);
    };
    if ((prior || rebound) && (await completed())) return await consume((prior ?? rebound)!);
    let result: AgentRunResult;
    try {
      this.#managementTaskInputs.set(input.invocationId, input.inputId);
      result = await this.submitResident(
        state,
        resident,
        signal,
        { ...input, inputId: reservedRepair === undefined ? input.inputId
          : `${input.inputId}-mechanism-repair-${input.invocationId}`, prompt: (prior || rebound) ? [input.prompt,
          "Your formal group decision has already been accepted. Continue in the same session and role and call finish_task for this management round. The accepted decision stays in force; do not replace it.",
          `Accepted decision: ${JSON.stringify((prior ?? rebound)!.action)}.`
        ].join("\n\n") : reservedRepair === undefined ? [input.prompt,
          "Call finish_task for your own management round; group/project completion is a separate authorized tool action and your tool channel remains open. Include any durable Agent-authored memory in finish_task."
        ].join("\n\n") : [input.prompt,
          "Your previous turn ended without a formal group control decision. Continue in the same session and role. Supply the appropriate assigned group control action and finish_task; the system cannot decide the action for you."
        ].join("\n\n") },
        this.groupActivityAuthority(group)
      ).finally(() => this.#managementTaskInputs.delete(input.invocationId));
    } catch (error) {
      if (signal.aborted || this.#shuttingDown || this.#cancellingProjects.has(state.id)) {
        // Cancellation owns resident closure, stop proof, and terminal PR
        // reconciliation. A revoked coordinator must not freeze Main or
        // substitute a fresh leader while that sequence is in flight.
        throw error;
      }
      // Preserve any earlier accepted decision as recovery input, but a
      // failed native turn still needs stop proof before business can start.
      await this.appendFailureAttempt(state, {
        attemptId: durableAttemptId("coordinator-failure", [
          state.id,
          group.id,
          String(group.coordinatorEpoch),
          input.invocationId
        ]),
        operation: `group-coordinator:${group.id}`,
        error,
        startedAt: attemptStartedAt,
        agentId: coordinator,
        nodeRunId: group.nodeRunId,
        groupRunId: group.id,
        invocationId: input.invocationId,
        coordinatorEpoch: group.coordinatorEpoch,
        metadata: { inputId: input.inputId }
      });
      let closed = false;
      let closedActivity: (RuntimeActivityAuthority & { invocationId: string }) | undefined;
      try {
        await resident.close();
        closed = true;
      } finally {
        if (closed) {
          for (const [key, entry] of this.#residents) {
            if (entry.handle !== resident) continue;
            closedActivity = entry.activity;
            this.#residents.delete(key);
          }
        }
      }
      if (closedActivity) {
        await this.closeRuntimeActivity(state, closedActivity, {
          kind: "resident",
          invocationId: closedActivity.invocationId,
          outcome: "failed",
          requestId: `runtime-resident-failed-${group.id}-${group.coordinatorEpoch}`
        });
      }
      if (coordinator === "main") {
        await this.database().freezeForMainFailure({
          projectId: state.id,
          groupRunId: group.id,
          expectedFacts: mainRecoveryFacts(group),
          requestId: `freeze-main-${group.id}-${group.coordinatorEpoch}`
        });
        await this.publishProjection(state, (await this.database().projectState(state.id)));
        throw error;
      }
      const substituted = await this.database().substituteMainForFailedLeader({
          projectId: state.id,
          groupRunId: group.id,
          expectedCoordinatorEpoch: group.coordinatorEpoch,
          residentLaunchProtocol: "trusted-supervisor-v1",
          leaderInvocationId: groupLeaderInvocationId(
            state.id,
            group.id,
            group.coordinatorEpoch + 1
          ),
          leaderRuntimePath: this.leaderRuntimePath(state.id, group.id),
          requestId: `substitute-main-${group.id}-${group.coordinatorEpoch}`
      });
      await this.publishProjection(state, (await this.database().projectState(state.id)));
      throw new CoordinatorSubstitutedError(
        `Coordinator ${coordinator} failed; Main assumed epoch ${substituted.groupRun.coordinatorEpoch}`,
        { cause: error }
      );
    }
    if ((await this.resolveOperationFailures(
      state,
      `group-coordinator:${group.id}`,
      attemptStartedAt,
      "A later collaboration coordinator turn succeeded",
      {
        agentId: coordinator,
        nodeRunId: group.nodeRunId,
        groupRunId: group.id,
        invocationId: input.invocationId,
        coordinatorEpoch: group.coordinatorEpoch,
        metadata: { inputId: input.inputId }
      }
    ))) {
      await this.publishProjection(state, (await this.database().projectState(state.id)));
    }
    const decisionEnvelope = result.controlActions?.find((envelope) =>
      envelope.action.tool === "assign_group_tasks" ||
      envelope.action.tool === "request_group_integration" ||
      envelope.action.tool === "complete_group"
    );
    if (!(await accepted()) && decisionEnvelope && (
      decisionEnvelope.action.tool === "assign_group_tasks" ||
      decisionEnvelope.action.tool === "request_group_integration" ||
      decisionEnvelope.action.tool === "complete_group"
    )) {
      await this.database().revalidateGroupControl({
        projectId: state.id,
        groupRunId: group.id,
        actorAgentId: coordinator,
        coordinatorEpoch: group.coordinatorEpoch,
        stateVersion: decisionEnvelope.stateVersion,
        accepted: {
          requestId: identity.requestId,
          inputId: input.inputId,
          invocationId: input.invocationId,
          callId: decisionEnvelope.callId,
          semanticInputHash: identity.semanticInputHash
        },
        action: decisionEnvelope.action
      });
    }
    const committed = await accepted();
    if (!committed || !(await completed())) {
      await this.database().appendEvent({
        projectId: state.id,
        requestId: `group-no-decision-${identity.semanticInputHash}-${input.invocationId}`,
        workflowRevision: state.workflowRevision ?? 1,
        nodeRunId: group.nodeRunId,
        groupRunId: group.id,
        agentId: coordinator,
        invocationId: input.invocationId,
        coordinatorEpoch: group.coordinatorEpoch,
        type: committed ? "group.control.missing_completion" : "group.control.no_decision",
        payload: {
          inputId: input.inputId,
          decisionRecorded: Boolean(committed),
          handoff: boundedSharedText(
            result.handoff ?? "Coordinator completed without an orchestration decision",
            4_000
          )
        }
      });
      await this.publishProjection(state, (await this.database().projectState(state.id)));
      if (signal.aborted || this.#shuttingDown ||
        this.#pausedProjects.has(state.id) || this.#cancellingProjects.has(state.id)) {
        throw new Error("Collaboration decision continuation was cancelled");
      }
      return result;
    }
    return await consume(committed);
  }

  private groupControlAuthorityFactory(
    state: ProjectState,
    groupRunId: string,
    nodeRunId: string
  ): CollaborationControlAuthorityFactory {
    return async ({ request, turn }) => {
      this.assertWritable();
      if (this.#pausedProjects.has(state.id) || this.#cancellingProjects.has(state.id)) {
        throw new Error("Collaboration control authority is paused or cancelling");
      }
      const projection = await this.database().projectState(state.id);
      const group = projection.groupRuns.find((item) => item.id === groupRunId);
      if (!group || projection.activeNodeRunId !== nodeRunId) {
        throw new Error("Collaboration group control scope is no longer active");
      }
      const coordinator = group.actingCoordinatorId ?? group.leaderAgentId;
      if (request.agent !== coordinator) {
        throw new Error("Resident Agent is no longer the fenced group coordinator");
      }
      const taskInputId = this.#managementTaskInputs.get(turn.invocationId) ?? turn.inputId;
      const capability = randomUUID();
      const capabilityHash = createHash("sha256").update(capability).digest("hex");
      const turnKey = createHash("sha256")
        .update(`${turn.inputId}\0${turn.invocationId}`)
        .digest("hex")
        .slice(0, 32);
      const control: ControlMcpRequest = {
        stagingPath: path.join(request.runtimePath, "control-turns", turnKey, "actions.json"),
        capability,
        capabilityHash,
        stateVersion: projection.stateRevision,
        candidates: [],
        decisionBy: "main",
        allowUserIntervention: false,
        allowWorkflowReconfiguration: false,
        canComplete: false,
        collaboration: {
          nodeRunId,
          groupRunId,
          role: "leader",
          coordinatorEpoch: group.coordinatorEpoch
        },
        workspacePath: request.workspacePath,
        requireBridge: true
      };
      return {
        control,
        revalidate: async (envelope) => {
          try {
            this.assertWritable();
            if (this.#pausedProjects.has(state.id) || this.#cancellingProjects.has(state.id)) {
              throw new CollaborationStateError(
                "INVALID_STATE_TRANSITION",
                "Collaboration control authority was revoked by pause or cancellation",
                { field: "action" }
              );
            }
            const action = envelope.action;
            if (action.tool !== "finish_task" && action.tool !== "assign_group_tasks" &&
              action.tool !== "request_group_integration" &&
              action.tool !== "complete_group") {
              throw new CollaborationStateError(
                "INVALID_STATE_TRANSITION",
                "Control action is not valid for a group leader",
                { field: "tool" }
              );
            }
            const envelopeField = envelope.projectId !== state.id
              ? "projectId"
              : envelope.agent !== coordinator
                ? "agent"
                : envelope.invocationId !== turn.invocationId
                  ? "invocationId"
                  : envelope.stateVersion !== control.stateVersion
                    ? "stateVersion"
                    : envelope.capabilityHash !== capabilityHash
                      ? "capability"
                      : undefined;
            if (envelopeField) {
              throw new CollaborationStateError(
                "INVALID_STATE_TRANSITION",
                "Control envelope does not match its fresh turn authority",
                { field: envelopeField }
              );
            }
            let completion: unknown;
            if (action.tool === "finish_task") {
              const authority = { projectId: state.id, groupRunId, actorAgentId: coordinator,
                coordinatorEpoch: group.coordinatorEpoch, stateVersion: control.stateVersion, action };
              await this.database().revalidateGroupControl(authority);
              const taskId = groupTaskCompletionKey(group, taskInputId);
              const committed = await this.database().eventByRequestId(state.id, groupTaskCompletionRequestId(taskId));
              const receipt = await this.#storage.requestTaskCompletion(state, taskId, envelope);
              completion = receipt;
              if (receipt.summary !== action.summary || receipt.memory !== action.memory) {
                throw new Error("Repeat management finish_task must preserve its accepted summary and memory");
              }
              if (!committed) {
                await this.database().revalidateGroupControl(authority);
                await this.database().appendEvent({ projectId: state.id, nodeRunId, groupRunId, agentId: coordinator,
                  coordinatorEpoch: group.coordinatorEpoch, invocationId: turn.invocationId,
                  requestId: groupTaskCompletionRequestId(taskId), type: "group.task_completion.committed",
                  payload: { taskId, inputId: taskInputId, nativeInputId: turn.inputId, callId: envelope.callId } });
              }
            } else {
              const prior = await this.database().acceptedGroupControlForInput({ projectId: state.id, groupRunId,
                actorAgentId: coordinator, coordinatorEpoch: group.coordinatorEpoch, inputId: taskInputId });
              if (prior && acceptedControlHash(prior.action) !== acceptedControlHash(action)) {
                throw new CollaborationStateError("IDEMPOTENCY_CONFLICT", "The management round's accepted decision cannot be replaced");
              }
              await this.database().revalidateGroupControl({
                projectId: state.id,
                groupRunId,
                actorAgentId: coordinator,
                coordinatorEpoch: group.coordinatorEpoch,
                stateVersion: control.stateVersion,
                action
              });
            }
            await this.appendSuccessfulAttempt(state, {
              attemptId: durableAttemptId("control-success", [
                state.id,
                turn.invocationId,
                envelope.callId
              ]),
              scope: "control",
              operation: controlAttemptOperation(action.tool),
              message: "A corrected collaboration control action passed revalidation",
              agentId: coordinator,
              nodeRunId,
              groupRunId,
              invocationId: turn.invocationId,
              coordinatorEpoch: group.coordinatorEpoch,
              metadata: {
                callId: envelope.callId,
                tool: action.tool,
                stateVersion: envelope.stateVersion
              }
            });
            return completion;
          } catch (error) {
            if (error instanceof ControlActionRejectedError) throw error;
            let current = projection;
            try {
              current = (await this.database().projectState(state.id));
            } catch {
              // The invocation snapshot is still a useful fail-closed revision
              // if shutdown raced the diagnostic lookup.
            }
            const detailField = error instanceof CollaborationStateError &&
              typeof error.details.field === "string"
              ? error.details.field
              : undefined;
            throw new ControlActionRejectedError({
              code: error instanceof CollaborationStateError
                ? error.code
                : "CONTROL_ACTION_REJECTED",
              message: safeRuntimeError(error),
              invalidField: detailField ?? groupControlInvalidField(envelope.action, error),
              currentRevision: current.stateRevision,
              workflowRevision: current.workflowRevision,
              authoritativeFiles: AUTHORITATIVE_WORKFLOW_REFERENCES
            });
          }
        },
        onRejected: async (envelope, error) => {
          await this.appendFailureAttempt(state, {
            ...(envelope ? {
              attemptId: durableAttemptId("control-failure", [
                state.id,
                turn.invocationId,
                envelope.callId
              ])
            } : {}),
            scope: "control",
            operation: controlAttemptOperation(envelope?.action.tool),
            error,
            errorCode: error instanceof ControlActionRejectedError
              ? error.rejection.code
              : "CONTROL_ACTION_REJECTED",
            retryable: true,
            agentId: coordinator,
            nodeRunId,
            groupRunId,
            invocationId: turn.invocationId,
            coordinatorEpoch: group.coordinatorEpoch,
            metadata: {
              ...(envelope ? {
                callId: envelope.callId,
                tool: envelope.action.tool,
                stateVersion: envelope.stateVersion
              } : {})
            }
          });
          await this.appendEvent(state, {
            type: "control.action.rejected",
            level: "warning",
            agent: coordinator,
            message: "Collaboration control action rejected",
            invocationId: turn.invocationId,
            data: {
              ...(envelope ? { callId: envelope.callId, tool: envelope.action.tool } : {}),
              reason: safeRuntimeError(error)
            }
          });
        }
      };
    };
  }

  /** Mirror the legacy Main completion gate for Git-owned management nodes. */
  private async mainCanComplete(state: ProjectState): Promise<boolean> {
    if (state.orchestration.termination.agent !== "main") return false;
    const delegable = workflowRoutesForAgent(state.orchestration, "main")
      .some((edge) => edge.target !== "main" && edge.target !== "finish");
    if (!delegable) return true;
    return (await this.database().projectState(state.id)).nodeRuns.some((nodeRun) =>
      nodeRun.status === "completed" &&
      (nodeRun.node.kind === "collaboration" || nodeRun.node.agentId !== "main")
    );
  }

  private workerRouteCandidates(state: ProjectState, agentId: string): string[] {
    if (state.agents[agentId]?.decisionBy !== "agent") return [];
    const edges = workflowRoutesForAgent(state.orchestration, agentId);
    const candidates = workflowWorkerChoiceCandidates(state.orchestration, agentId);
    return candidates.length >= 2 && edges.length === candidates.length &&
      edges.every((edge) => edge.kind === "weak")
      ? candidates
      : [];
  }

  private standaloneControlAuthorityFactory(
    state: ProjectState,
    nodeRunId: string,
    execution: MemberExecution,
    candidates: readonly string[]
  ): CollaborationControlAuthorityFactory {
    return async ({ request, turn }) => {
      this.assertWritable();
      const activeTurnKey = JSON.stringify([state.id, turn.invocationId, turn.inputId]);
      const finishingPausedTurn = () => state.status === "pausing" && this.#activeResidentTurns.has(activeTurnKey);
      if (this.#shuttingDown || this.#cancellingProjects.has(state.id) ||
        this.#pausedProjects.has(state.id) && !finishingPausedTurn()) {
        throw new Error("Standalone control authority is paused or cancelling");
      }
      if (request.agent !== execution.agentId) {
        throw new Error("Standalone control request Agent does not own the execution");
      }
      const capability = randomUUID();
      const capabilityHash = createHash("sha256").update(capability).digest("hex");
      const turnKey = createHash("sha256")
        .update(`${turn.inputId}\0${turn.invocationId}`)
        .digest("hex")
        .slice(0, 32);
      const stateVersion = (await this.database().projectState(state.id)).stateRevision;
      const control: ControlMcpRequest = {
        stagingPath: path.join(request.runtimePath, "control-turns", turnKey, "actions.json"),
        capability,
        capabilityHash,
        stateVersion,
        candidates: [...candidates],
        decisionBy: "agent",
        allowUserIntervention: false,
        allowWorkflowReconfiguration: false,
        canComplete: false,
        allowAgentGitActions: true,
        workspacePath: request.workspacePath,
        requireBridge: true
      };
      return {
        control,
        revalidate: async (envelope, staged) => {
          this.assertWritable();
          // Preserve only this already active native invocation until its
          // safe point. A different live Worker cannot authorize a stale
          // capability after this invocation's actual return.
          if (this.#shuttingDown || this.#cancellingProjects.has(state.id) ||
            this.#pausedProjects.has(state.id) && !finishingPausedTurn()) {
            throw new Error("Standalone control authority was revoked");
          }
          if (
            envelope.projectId !== state.id ||
            envelope.agent !== execution.agentId ||
            envelope.invocationId !== turn.invocationId ||
            envelope.stateVersion !== stateVersion ||
            envelope.capabilityHash !== capabilityHash
          ) {
            throw new Error("Standalone control envelope does not match its fresh turn authority");
          }
          await this.database().operationsForProject(state.id, true).assertExecutionOwnership({
            projectId: state.id, executionId: execution.id, ownershipEpoch: execution.ownershipEpoch,
            expectedBranch: execution.executionBranch, operation: "provider.mutate"
          });
          if (isAgentGitAction(envelope.action.tool)) return;
          if (envelope.action.tool === "finish_task") {
            return await this.#storage.requestTaskCompletion(state, execution.id, envelope);
          } else if (envelope.action.tool === "publish_artifact") {
            await this.validateExecutionPublicationIntent(state, execution, envelope, staged);
            await this.appendSuccessfulAttempt(state, {
              attemptId: durableAttemptId("control-success", [
                state.id,
                turn.invocationId,
                envelope.callId
              ]),
              scope: "control",
              operation: controlAttemptOperation(envelope.action.tool),
              message: "A corrected standalone control action passed revalidation",
              agentId: execution.agentId,
              nodeRunId,
              ...(execution.groupRunId ? { groupRunId: execution.groupRunId } : {}),
              taskId: execution.taskId,
              executionId: execution.id,
              invocationId: turn.invocationId,
              ownershipEpoch: execution.ownershipEpoch,
              metadata: { callId: envelope.callId, tool: envelope.action.tool, stateVersion }
            });
            return;
          }
          if (envelope.action.tool !== "route_to_agent") {
            throw new Error("Standalone execution may only publish artifacts or select its fenced route");
          }
          await this.database().revalidateStandaloneRouteControl({
            projectId: state.id,
            nodeRunId,
            executionId: execution.id,
            ownershipEpoch: execution.ownershipEpoch,
            actorAgentId: execution.agentId,
            candidateNodeIds: candidates,
            action: envelope.action
          });
          await this.appendSuccessfulAttempt(state, {
            attemptId: durableAttemptId("control-success", [
              state.id,
              turn.invocationId,
              envelope.callId
            ]),
            scope: "control",
            operation: controlAttemptOperation(envelope.action.tool),
            message: "A corrected standalone control action passed revalidation",
            agentId: execution.agentId,
            nodeRunId,
            ...(execution.groupRunId ? { groupRunId: execution.groupRunId } : {}),
            taskId: execution.taskId,
            executionId: execution.id,
            invocationId: turn.invocationId,
            ownershipEpoch: execution.ownershipEpoch,
            metadata: { callId: envelope.callId, tool: envelope.action.tool, stateVersion }
          });
        },
        execute: async (envelope, signal) => {
          const facts = await this.standaloneGitFacts(state, execution);
          try {
            const result = await executeAgentGitTool({ git: await this.git(state.id), repository: this.repository(state),
              execution, base: await this.database().executionPullBase(state.id, execution.id), facts, envelope, signal,
              ...agentGitOperationJournal(this.database(), state.id),
              recordedOperation: async id => await this.database().recordedGitOperation(state.id, id),
              deliveryStatus: async () => agentGitDeliveryStatus({ executionId: execution.id, ownershipEpoch: execution.ownershipEpoch,
                headSha: facts.pushedHeadSha, pull: facts.pullRequest,
                synchronized: agentGitFactsSynchronized(facts, (await this.database().executionPullBase(state.id, execution.id))),
                operations: (await this.database().projectState(state.id)).operations }) });
            if (envelope.action.tool === "git_push" && facts.pushResult?.status === "not_committed") {
              await this.persistExecutionGitStage(state, execution, "not_committed", facts.pushResult.checkpoint.commitSha);
            }
            return result;
          } catch (error) {
            await this.appendFailureAttempt(state, { scope: "git", operation: `agent.${envelope.action.tool}`,
              error, agentId: execution.agentId, nodeRunId: execution.nodeRunId,
              executionId: execution.id, ownershipEpoch: execution.ownershipEpoch,
              invocationId: envelope.invocationId, metadata: { callId: envelope.callId } });
            throw error;
          } finally {
            const factDigest = createHash("sha256").update(JSON.stringify(facts)).digest("hex").slice(0, 24);
            await this.database().appendEvent({ projectId: state.id, executionId: execution.id,
              ownershipEpoch: execution.ownershipEpoch, agentId: execution.agentId,
              requestId: `agent-git-fact:${execution.id}:${execution.ownershipEpoch}:${envelope.callId}:${factDigest}`,
              type: "execution.agent_git.fact", payload: { facts: structuredClone(facts) } });
            if (facts.pullRequest) await this.database().observeStandaloneDeliveryPullRequest({ projectId: state.id,
              executionId: execution.id, ownershipEpoch: execution.ownershipEpoch,
              pullRequest: pullRequestRecord(facts.pullRequest),
              requestId: `agent-pull:${execution.id}:${execution.ownershipEpoch}:${envelope.callId}:${factDigest}` });
            if (facts.merged?.localSynchronization) {
              if (facts.merged.base === "main") this.#mainHeads.set(state.id, facts.merged.localSynchronization.localHeadAfter);
              this.#branchHeads.set(`${state.id}:${facts.merged.base}`, facts.merged.localSynchronization.localHeadAfter);
            }
          }
        },
        onRejected: async (envelope, error) => {
          await this.appendFailureAttempt(state, {
            ...(envelope ? {
              attemptId: durableAttemptId("control-failure", [
                state.id,
                turn.invocationId,
                envelope.callId
              ])
            } : {}),
            scope: "control",
            operation: controlAttemptOperation(envelope?.action.tool),
            error,
            errorCode: "CONTROL_ACTION_REJECTED",
            retryable: true,
            agentId: execution.agentId,
            nodeRunId,
            ...(execution.groupRunId ? { groupRunId: execution.groupRunId } : {}),
            taskId: execution.taskId,
            executionId: execution.id,
            invocationId: turn.invocationId,
            ownershipEpoch: execution.ownershipEpoch,
            metadata: {
              ...(envelope ? {
                callId: envelope.callId,
                tool: envelope.action.tool,
                stateVersion: envelope.stateVersion
              } : {})
            }
          });
          await this.appendEvent(state, {
            type: "control.action.rejected",
            level: "warning",
            agent: execution.agentId,
            message: "Standalone route action rejected",
            invocationId: turn.invocationId,
            data: {
              ...(envelope ? { callId: envelope.callId, tool: envelope.action.tool } : {}),
              reason: safeRuntimeError(error)
            }
          });
        }
      };
    };
  }

  private async persistStandaloneRouteDecision(
    state: ProjectState,
    execution: MemberExecution,
    result: AgentRunResult
  ): Promise<{ targetNodeId: string; decisionRequestId: string } | undefined> {
    const candidates = this.workerRouteCandidates(state, execution.agentId);
    if (candidates.length === 0) return undefined;
    const envelope = result.controlActions?.find((item) => item.action.tool === "route_to_agent");
    if (!envelope) {
      await this.database().appendEvent({
        projectId: state.id,
        requestId: `route-no-decision-${execution.id}-${execution.ownershipEpoch}`,
        workflowRevision: state.workflowRevision ?? 1,
        nodeRunId: execution.nodeRunId,
        agentId: execution.agentId,
        taskId: execution.taskId,
        executionId: execution.id,
        invocationId: execution.invocationId,
        ownershipEpoch: execution.ownershipEpoch,
        type: "execution.route.no_decision",
        payload: {
          candidateNodeIds: candidates,
          decisionRecorded: false,
          handoff: boundedSharedText(
            result.handoff ?? "Execution completed without a route decision",
            4_000
          )
        }
      });
      return undefined;
    }
    if (envelope.action.tool !== "route_to_agent" ||
      !candidates.includes(envelope.action.target)) {
      throw new Error("Agent-owned weak route returned an invalid route_to_agent decision");
    }
    await this.database().appendEvent({
      projectId: state.id,
      eventId: `evt-route-${envelope.callId}`,
      requestId: envelope.callId,
      workflowRevision: state.workflowRevision ?? 1,
      nodeRunId: execution.nodeRunId,
      agentId: execution.agentId,
      taskId: execution.taskId,
      executionId: execution.id,
      invocationId: envelope.invocationId,
      ownershipEpoch: execution.ownershipEpoch,
      type: "execution.route.selected",
      payload: {
        targetNodeId: envelope.action.target,
        decisionRequestId: envelope.callId
      }
    });
    return {
      targetNodeId: envelope.action.target,
      decisionRequestId: envelope.callId
    };
  }

  private async persistArtifactPublicationIntent(
    state: ProjectState,
    execution: MemberExecution,
    envelope: ControlActionEnvelope
  ): Promise<void> {
    if (envelope.action.tool !== "publish_artifact") return;
    const action = envelope.action;
    const intentKey = createHash("sha256")
      .update(`${execution.id}\0${execution.ownershipEpoch}\0${envelope.callId}`)
      .digest("hex");
    await this.database().appendEvent({
      projectId: state.id,
      eventId: `evt-artifact-${intentKey.slice(0, 32)}`,
      requestId: `artifact-${intentKey}`,
      workflowRevision: state.workflowRevision ?? 1,
      nodeRunId: execution.nodeRunId,
      ...(execution.groupRunId ? { groupRunId: execution.groupRunId } : {}),
      agentId: execution.agentId,
      taskId: execution.taskId,
      executionId: execution.id,
      invocationId: envelope.invocationId,
      ownershipEpoch: execution.ownershipEpoch,
      type: "artifact.publication.staged",
      payload: {
        path: action.path,
        title: action.title,
        kind: action.kind,
        description: action.description,
        callId: envelope.callId,
        ...(action.replacesPath ? { replacesPath: action.replacesPath } : {})
      }
    });
  }

  private async persistArtifactPublicationIntents(
    state: ProjectState,
    execution: MemberExecution,
    result: AgentRunResult
  ): Promise<void> {
    for (const envelope of result.controlActions ?? []) {
      if (envelope.action.tool !== "publish_artifact") continue;
      await this.validateExecutionPublicationIntent(state, execution, envelope, [], false);
      await this.persistArtifactPublicationIntent(state, execution, envelope);
    }
  }

  private async executionPublicationEvents(projectId: string): Promise<CollaborationEvent[]> {
    const events: CollaborationEvent[] = [];
    let cursor = 0;
    for (;;) {
      const page = await this.database().eventsAfter(projectId, cursor, EVENT_PAGE_SIZE);
      events.push(...page.filter((event) => event.type === "artifact.publication.staged"));
      if (page.length < EVENT_PAGE_SIZE) return events;
      cursor = page.at(-1)!.seq;
    }
  }

  /** The Agent alone corrects a pending publication. A fresh tool capability
   * can replace only its own execution's intent, never another owner's output. */
  private async validateExecutionPublicationIntent(state: ProjectState, execution: MemberExecution,
    envelope: ControlActionEnvelope, staged: readonly ControlActionEnvelope[] = [], verifyAcceptedCommit = true): Promise<void> {
    const action = envelope.action;
    if (action.tool !== "publish_artifact") return;
    await this.#storage.resolveExecutionArtifactCandidate(state.id, execution, action.path);
    if (action.replacesPath !== undefined) {
      const oldPath = safeProjectRelativePath(action.replacesPath);
      if (oldPath !== action.replacesPath || oldPath === action.path) {
        throw new Error("replacesPath must be the exact different pending publication path");
      }
      const prior = (await this.executionPublicationEvents(state.id)).some((event) =>
        event.executionId === execution.id && event.ownershipEpoch !== undefined &&
        event.ownershipEpoch <= execution.ownershipEpoch && event.payload.path === oldPath);
      const stagedPrior = staged.some((item) => item.action.tool === "publish_artifact" && item.action.path === oldPath);
      if (!prior && !stagedPrior) throw new Error("replacesPath does not belong to this execution's pending publications");
      if (state.artifacts?.some((record) => record.gitSource?.executionId === execution.id && record.path === oldPath)) {
        throw new Error("replacesPath cannot remove an already published artifact");
      }
    }
    const pull = (await this.standaloneGitFacts(state, execution)).merged;
    if (verifyAcceptedCommit && pull?.status === "merged" && pull.headSha) {
      const verification = structuredClone(state);
      mergeProjection(verification, (await this.database().projectState(state.id)), verification.collaboration?.eventSeq ?? 0);
      const record: ArtifactRecord = { id: `candidate:${envelope.callId}`, agent: execution.agentId,
        invocationId: envelope.invocationId, path: action.path, title: action.title, kind: action.kind,
        description: action.description, size: 0, updatedAt: envelope.receivedAt,
        gitSource: { executionId: execution.id, ownershipEpoch: execution.ownershipEpoch,
          worktreePath: execution.worktreePath, commitSha: pull.headSha, pullRequestId: pull.id, acceptedBase: pull.base } };
      // Return immutable-commit errors during the Agent's MCP call, while it
      // can still decide a correction. Mutable checkout bytes are no substitute.
      await this.#storage.validateGitArtifactRecord(verification, record);
    }
  }

  private async commitUnchangedMergedArtifactIntents(
    state: ProjectState, publisher: MemberExecution, base: string
  ): Promise<void> {
    const intents = inheritedArtifactPublicationIntents((await this.executionPublicationEvents(state.id)), publisher);
    if (!intents.length) return;
    const projection = await this.database().projectState(state.id);
    const source = [...projection.pullRequests, ...(projection.additionalPullRequests ?? [])]
      .filter(pull => pull.status === "merged" && pull.base === base && pull.headSha &&
        pull.ownerExecutionId !== publisher.id && projection.executions.some(execution =>
          execution.id === pull.ownerExecutionId && execution.agentId === publisher.agentId &&
          ["merged", "succeeded"].includes(execution.status)))
      .sort((left, right) => right.observedAt.localeCompare(left.observedAt))[0];
    if (!source) return;
    const owner = projection.executions.find(execution => execution.id === source.ownerExecutionId)!;
    const verification = structuredClone(state);
    mergeProjection(verification, projection, verification.collaboration?.eventSeq ?? 0);
    const latest = new Map<string, CollaborationEvent>();
    for (const event of intents) {
      if (typeof event.payload.path !== "string") throw new Error("Publication intent lost its artifact path");
      latest.set(event.payload.path, event);
    }
    // A registration task can publish unchanged, already-merged files. Its
    // request does not acquire the source execution's PR or Git readiness.
    for (const [artifactPath, event] of latest) {
      try {
        if (typeof event.invocationId !== "string" || typeof event.payload.title !== "string" ||
          typeof event.payload.kind !== "string" || typeof event.payload.description !== "string") {
          throw new Error("Publication intent lost its invocation or artifact metadata");
        }
        const candidate = await this.#storage.resolveExecutionArtifactCandidate(state.id, publisher, artifactPath);
        const record: ArtifactRecord = { id: `candidate:${event.requestId}`, agent: owner.agentId,
          invocationId: event.invocationId, path: artifactPath, title: event.payload.title,
          kind: event.payload.kind, description: event.payload.description, size: 0, updatedAt: event.ts,
          gitSource: { executionId: owner.id, ownershipEpoch: owner.ownershipEpoch, worktreePath: owner.worktreePath,
            commitSha: source.headSha!, pullRequestId: source.id, acceptedBase: base } };
        const immutable = await this.#storage.validateGitArtifactRecord(verification, record);
        const [requestedBytes, acceptedBytes] = await Promise.all([fs.readFile(candidate.sourcePath), fs.readFile(immutable.sourcePath)]);
        if (!requestedBytes.equals(acceptedBytes)) throw new Error("Requested publication differs from the observed merged version");
      } catch (cause) {
        throw new ExecutionArtifactPublicationError(artifactPath, source.headSha!, cause);
      }
    }
    await this.commitMergedExecutionArtifacts(state, owner, source, [...latest.values()]);
  }

  private async commitMergedExecutionArtifacts(
    state: ProjectState,
    execution: MemberExecution,
    pull: Pick<PullRequestRecord, "id" | "base" | "headSha" | "status" | "ownerExecutionId">,
    publicationEvents?: readonly CollaborationEvent[]
  ): Promise<void> {
    if (pull.status !== "merged" || pull.ownerExecutionId !== execution.id || !pull.headSha) {
      throw new Error("Artifact publication requires an observed merged pull request head");
    }
    const stagedEvents: CollaborationEvent[] = [];
    let stopConfirmed = false;
    let cursor = 0;
    while (true) {
      const page = await this.database().eventsAfter(state.id, cursor, EVENT_PAGE_SIZE);
      for (const event of page) {
        if (event.type === "artifact.publication.staged") stagedEvents.push(event);
        if (
          event.type === "execution.stop_confirmed" &&
          event.executionId === execution.id &&
          event.ownershipEpoch === execution.ownershipEpoch
        ) {
          stopConfirmed = true;
        }
      }
      if (page.length < EVENT_PAGE_SIZE) break;
      cursor = page.at(-1)!.seq;
    }
    const staged = publicationEvents ?? inheritedArtifactPublicationIntents(stagedEvents, execution);
    if (staged.length === 0) return;
    const latestByPath = new Map<string, typeof staged[number]>();
    for (const event of staged) {
      if (typeof event.payload.path === "string") latestByPath.set(event.payload.path, event);
    }
    const projection = await this.database().projectState(state.id);
    const verificationState = structuredClone(state);
    mergeProjection(
      verificationState,
      projection,
      verificationState.collaboration?.eventSeq ?? 0
    );
    // Immutable artifact verification uses the exact observed merged head.
    // This validation snapshot does not finish the task; the original Agent
    // must supply its own completion receipt before runtime advancement.
    const verificationExecution = verificationState.executions?.find((candidate) =>
      candidate.id === execution.id &&
      candidate.ownershipEpoch === execution.ownershipEpoch
    );
    if (verificationExecution?.status === "stopped") {
      if (!stopConfirmed) {
        throw new Error("Stopped artifact owner lacks exact stop-confirmed provenance");
      }
      verificationExecution.status = "merged";
    }
    for (const [artifactPath, event] of latestByPath) {
      const artifactId = `artifact_${createHash("sha256").update([
        execution.id,
        String(execution.ownershipEpoch),
        pull.id,
        pull.headSha,
        pull.base,
        artifactPath
      ].join("\0")).digest("hex")}`;
      const existing = state.artifacts?.find((record) =>
        record.id === artifactId &&
        record.gitSource?.executionId === execution.id &&
        record.gitSource.ownershipEpoch === execution.ownershipEpoch &&
        record.gitSource.commitSha === pull.headSha &&
        record.gitSource.pullRequestId === pull.id &&
        record.gitSource.acceptedBase === pull.base
      );
      if (existing) {
        try {
          await this.#storage.validateGitArtifactRecord(verificationState, existing);
        } catch (cause) {
          throw new ExecutionArtifactPublicationError(artifactPath, pull.headSha, cause);
        }
        continue;
      }
      const publishedAt = new Date().toISOString();
      const record: ArtifactRecord = {
        id: artifactId,
        agent: execution.agentId,
        invocationId: event.invocationId ?? execution.invocationId ?? `artifact-${execution.id}`,
        path: artifactPath,
        title: typeof event.payload.title === "string" ? event.payload.title : artifactPath,
        kind: typeof event.payload.kind === "string" ? event.payload.kind : "document",
        description: typeof event.payload.description === "string"
          ? event.payload.description
          : "Merged Git artifact",
        size: 0,
        modifiedAt: publishedAt,
        registeredAt: publishedAt,
        updatedAt: publishedAt,
        gitSource: {
          executionId: execution.id,
          ownershipEpoch: execution.ownershipEpoch,
          worktreePath: execution.worktreePath,
          commitSha: pull.headSha,
          pullRequestId: pull.id,
          acceptedBase: pull.base
        }
      };
      verificationState.artifacts = [
        ...(verificationState.artifacts ?? []).filter((item) => item.id !== record.id),
        record
      ];
      let immutable: Awaited<ReturnType<ProjectStorage["validateGitArtifactRecord"]>>;
      try {
        immutable = await this.#storage.validateGitArtifactRecord(verificationState, record);
      } catch (cause) {
        throw new ExecutionArtifactPublicationError(artifactPath, pull.headSha, cause);
      }
      const content = await fs.readFile(immutable.sourcePath);
      record.size = content.length;
      record.mediaType = immutable.mediaType;
      record.sha256 = createHash("sha256").update(content).digest("hex");
      state.artifacts = [
        ...(state.artifacts ?? []).filter((item) => item.id !== record.id),
        record
      ];
      await this.appendEvent(state, {
        type: "artifact.published",
        agent: execution.agentId,
        message: `Merged Git artifact published: ${record.path}`,
        invocationId: record.invocationId,
        executionId: execution.id,
        ownershipEpoch: execution.ownershipEpoch,
        data: {
          artifactId: record.id,
          executionId: execution.id,
          ownershipEpoch: execution.ownershipEpoch,
          ...(publicationEvents ? { publicationExecutionId: event.executionId } : {}),
          commitSha: pull.headSha,
          pullRequestId: pull.id,
          path: record.path
        }
      });
    }
  }

  private async persistedStandaloneRouteDecision(
    projectId: string,
    execution: MemberExecution
  ): Promise<{ targetNodeId: string; decisionRequestId: string } | undefined> {
    // A restart advances the writer epoch but retains the execution's already
    // committed model decision. Reusing that immutable event avoids rerunning
    // the model after its PR has opened or merged.
    const event = await this.database().standaloneRouteDecision(
      projectId,
      execution.id,
      execution.ownershipEpoch
    );
    const targetNodeId = event?.payload.targetNodeId;
    const decisionRequestId = event?.payload.decisionRequestId;
    return typeof targetNodeId === "string" && typeof decisionRequestId === "string"
      ? { targetNodeId, decisionRequestId }
      : undefined;
  }

  private async hasRecoverableAuthorizationOutput(
    projectId: string,
    execution: MemberExecution
  ): Promise<boolean> {
    return await this.database().executionHasRecoverableAuthorizationOutput(
      projectId,
      execution.id,
      execution.ownershipEpoch
    );
  }

  private async executionLaunchProtocol(
    projectId: string,
    execution: MemberExecution
  ): Promise<"trusted-supervisor-v1" | undefined> {
    if (!execution.invocationId) return undefined;
    const runtimePath = path.join(
      this.#storage.projectDir(projectId),
      "runtime",
      execution.invocationId
    );
    const event = await this.database().executionLaunchStartedFact(
      projectId,
      execution.id,
      execution.ownershipEpoch
    );
    return event?.payload.residentLaunchProtocol === "trusted-supervisor-v1" &&
      event.payload.worktreePath === execution.worktreePath &&
      event.payload.runtimePath === runtimePath
      ? "trusted-supervisor-v1"
      : undefined;
  }

  private async executionPrelaunchProtocol(
    projectId: string,
    execution: MemberExecution
  ): Promise<"trusted-supervisor-v1" | undefined> {
    if (!execution.invocationId) return undefined;
    const event = await this.database().executionPrelaunchFact(
      projectId,
      execution.id,
      execution.ownershipEpoch
    );
    if (!event) return undefined;
    if (event.type === "execution.handed_off") {
      return event.payload.successorExecutionId === execution.id &&
        event.payload.ownershipEpoch === execution.ownershipEpoch &&
        event.payload.successorInvocationId === execution.invocationId &&
        event.payload.successorWorktreePath === execution.worktreePath &&
        event.payload.residentLaunchProtocol === "trusted-supervisor-v1"
        ? "trusted-supervisor-v1"
        : undefined;
    }
    return event.executionId === execution.id &&
      event.ownershipEpoch === execution.ownershipEpoch &&
      event.invocationId === execution.invocationId &&
      event.payload.residentLaunchProtocol === "trusted-supervisor-v1" &&
      event.payload.invocationId === execution.invocationId &&
      event.payload.worktreePath === execution.worktreePath
      ? "trusted-supervisor-v1"
      : undefined;
  }

  private async executionStopProtocol(
    projectId: string,
    execution: MemberExecution
  ): Promise<"trusted-supervisor-v1" | undefined> {
    const launched = await this.executionLaunchProtocol(projectId, execution);
    if (launched) return launched;
    return (await this.executionLaunchStarted(projectId, execution))
      ? undefined
      : (await this.executionPrelaunchProtocol(projectId, execution));
  }

  private async executionLaunchStarted(projectId: string, execution: MemberExecution): Promise<boolean> {
    return (await this.database().executionLaunchStartedFact(
      projectId,
      execution.id,
      execution.ownershipEpoch
    )) !== undefined;
  }

  private async hasExactRestartStopProvenance(
    projectId: string,
    execution: MemberExecution
  ): Promise<boolean> {
    return await this.database().executionHasExactRestartStopProvenance(
      projectId,
      execution.id,
      execution.ownershipEpoch
    );
  }

  private async leaderLaunchProtocol(
    projectId: string,
    group: GroupRun
  ): Promise<"trusted-supervisor-v1" | undefined> {
    const invocationId = groupLeaderInvocationId(projectId, group.id, group.coordinatorEpoch);
    const runtimePath = this.leaderRuntimePath(projectId, group.id);
    const evidence = await this.database().groupLeaderLaunchEvidence(
      projectId,
      group.id,
      group.coordinatorEpoch
    );
    if (evidence?.type === "group.leader.launch.started") {
      return evidence.invocationId === invocationId &&
        evidence.payload.residentLaunchProtocol === "trusted-supervisor-v1" &&
        evidence.payload.invocationId === invocationId &&
        evidence.payload.runtimePath === runtimePath
        ? "trusted-supervisor-v1"
        : undefined;
    }
    const planned = evidence &&
      [
        "group.activated",
        "group.coordinator.substituted",
        "group.coordinator.recovered"
      ].includes(evidence.type) &&
      evidence.payload.residentLaunchProtocol === "trusted-supervisor-v1" &&
      evidence.payload.invocationId === invocationId &&
      evidence.payload.runtimePath === runtimePath;
    return planned ? "trusted-supervisor-v1" : undefined;
  }

  private async waitForTurnIdleOrStopRequest(projectId: string): Promise<void> {
    if ((this.#activeTurns.get(projectId) ?? 0) === 0 || this.#cancellingProjects.has(projectId)) return;
    await new Promise<void>((resolve) => {
      const waiters = this.#turnIdleWaiters.get(projectId) ?? [];
      waiters.push(resolve);
      this.#turnIdleWaiters.set(projectId, waiters);
    });
  }

  private async runGroupExecution(
    state: ProjectState,
    group: GroupRun,
    execution: MemberExecution,
    assignment: string,
    pullBase: string,
    signal: AbortSignal,
    recoveredResident?: CollaborationResidentHandle,
    recoverySeed?: ResidentRecoveryProofSeed,
    resumeAfterAuthorization = false,
    recoveredPull?: PullRequestRecord
  ): Promise<string> {
    const launcher = this.#residentLauncher;
    if (!launcher) throw new Error("The trusted collaboration resident launcher is unavailable");
    const invocationId = execution.invocationId ?? newId("inv");
    if (!recoveredResident && execution.status === "queued") {
      execution = (await this.database().transitionExecutionStatus({
        projectId: state.id,
        executionId: execution.id,
        ownershipEpoch: execution.ownershipEpoch,
        status: "working",
        invocationId,
        waitReason: execution.waitReason,
        requestId: `execution-running-${execution.id}-${execution.ownershipEpoch}`
      })).execution;
    }
    const residentAuthority = await this.executionActivityAuthority(state.id, execution);
    const businessAssignment = await this.businessAssignmentWithOwnManagement(
      state,
      execution.agentId,
      assignment,
      signal
    );
    let resident = recoveredResident;
    if (!resident) {
      const inboxPath = await this.#storage.writeInbox(
        state,
        execution.agentId,
        invocationId,
        businessAssignment
      );
      const runtimePath = await this.#storage.invocationRuntimePath(state.id, invocationId);
      const fallbackRequest: AgentRunRequest = {
        project: structuredClone(state),
        purpose: "workflow",
        agent: execution.agentId,
        kind: execution.agentId === "main" ? "main" : "worker",
        permission: state.agents[execution.agentId].permission,
        invocationId,
        inboxPath,
        projectPath: this.#storage.projectDir(state.id),
        workspacePath: execution.worktreePath,
        schemaPath: "",
        skillPaths: [],
        autoSkillPaths: [],
        availableSkillPaths: [],
        runtimePath,
        executionContext: {
          nodeRunId: execution.nodeRunId,
          groupRunId: group.id,
          taskId: execution.taskId,
          executionId: execution.id,
          role: execution.purpose,
          ownershipEpoch: execution.ownershipEpoch,
          coordinatorEpoch: group.coordinatorEpoch,
          executionWorktree: execution.worktreePath
        }
      };
      const request = this.#executionInputBuilder
        ? await this.#executionInputBuilder.build({
            state,
            agentId: execution.agentId,
            execution,
            executionContext: fallbackRequest.executionContext!,
            assignment: businessAssignment,
            invocationId,
            inboxPath,
            projectPath: this.#storage.projectDir(state.id),
            worktreePath: execution.worktreePath,
            runtimePath
          })
        : fallbackRequest;
      await this.attachRuntimeCallbacks(state, request, execution);
      if (!(await this.executionLaunchStarted(state.id, execution))) {
        await this.database().appendEvent({
          projectId: state.id,
          requestId: `execution-launch-${execution.id}-${execution.ownershipEpoch}`,
          workflowRevision: state.workflowRevision ?? 1,
          nodeRunId: execution.nodeRunId,
          groupRunId: group.id,
          agentId: execution.agentId,
          taskId: execution.taskId,
          executionId: execution.id,
          invocationId,
          ownershipEpoch: execution.ownershipEpoch,
          coordinatorEpoch: group.coordinatorEpoch,
          type: "execution.launch.started",
          payload: {
            worktreePath: execution.worktreePath,
            runtimePath,
            residentLaunchProtocol: "trusted-supervisor-v1"
          }
        });
      }
      await this.startRuntimeActivity(state, residentAuthority, {
        kind: "resident",
        phase: "resident:starting",
        invocationId,
        requestId: `runtime-resident-start-${execution.id}-${execution.ownershipEpoch}`
      });
      resident = await launcher.open({
        request,
        executionRuntimePath: runtimePath,
        filesystemAuthorityInput: await this.filesystemAuthorityInput(state),
        signal,
        onTrace: this.traceSink(state, execution.agentId, invocationId),
        turnRequestFactory: this.turnRequestFactory(
          state,
          request,
          execution,
          recoverySeed
        ),
        controlScope: {
          projectId: state.id,
          nodeRunId: execution.nodeRunId,
          executionId: execution.id,
          agentId: execution.agentId,
          ownershipEpoch: execution.ownershipEpoch,
          role: "execution-artifact"
        },
        controlAuthorityFactory: this.standaloneControlAuthorityFactory(
          state,
          execution.nodeRunId,
          execution,
          []
        )
      });
    }
    this.#residents.set(execution.id, {
      projectId: state.id,
      execution,
      activity: { ...residentAuthority, invocationId },
      handle: resident
    });
    if (recoveredPull) {
      return this.resumeGroupPullRequest(
        state,
        group,
        execution,
        recoveredPull,
        resident,
        signal
      );
    }
    const result = resumeAfterAuthorization
      ? undefined
      : await this.submitResident(state, resident, signal, {
          inputId: `input-${execution.id}-1`,
          invocationId,
          prompt: businessAssignment
        }, (await this.executionActivityAuthority(state.id, execution)));
    if (result) await this.persistArtifactPublicationIntents(state, execution, result);
    const output = result?.handoff ?? execution.waitReason ??
      `${execution.agentId} returned from its assigned work`;
    const completed = await this.completeAgentOwnedExecution(state, execution, output, resident, signal, pullBase);
    await this.publishProjection(state, (await this.database().projectState(state.id)));
    return completed.output;
  }

  private async persistExecutionGitStage(
    state: ProjectState,
    execution: MemberExecution,
    stage: "model_output_persisted" | "checkpoint_pending" | "not_committed" | "pull_request_pending" | "merge_pending",
    output: string
  ): Promise<void> {
    await this.database().appendEvent({
      projectId: state.id,
      requestId: `git-stage-${execution.id}-${execution.ownershipEpoch}-${stage}`,
      workflowRevision: state.workflowRevision ?? 1,
      nodeRunId: execution.nodeRunId,
      ...(execution.groupRunId ? { groupRunId: execution.groupRunId } : {}),
      agentId: execution.agentId,
      taskId: execution.taskId,
      executionId: execution.id,
      ...(execution.invocationId ? { invocationId: execution.invocationId } : {}),
      ownershipEpoch: execution.ownershipEpoch,
      type: "execution.git_stage.persisted",
      payload: {
        stage,
        outputSha256: createHash("sha256").update(output).digest("hex")
      }
    });
  }

  private async recordExecutionCheckpoint(
    state: ProjectState,
    execution: MemberExecution,
    checkpoint: { commitSha: string; changed: boolean },
    operationId: string,
    checkpointKind: "checkpoint" | "conflict-resolution"
  ): Promise<void> {
    if (!checkpoint.changed) return;
    await this.database().appendEvent({
      projectId: state.id,
      requestId: `checkpoint-recorded-${operationId}`,
      workflowRevision: state.workflowRevision ?? 1,
      nodeRunId: execution.nodeRunId,
      ...(execution.groupRunId ? { groupRunId: execution.groupRunId } : {}),
      agentId: execution.agentId,
      taskId: execution.taskId,
      executionId: execution.id,
      ...(execution.invocationId ? { invocationId: execution.invocationId } : {}),
      ownershipEpoch: execution.ownershipEpoch,
      type: "execution.checkpoint.committed",
      payload: {
        commitSha: checkpoint.commitSha,
        checkpointKind,
        operationId,
        source: "harness"
      }
    });
  }

  private protectedProjectRoots(projectId: string): string[] {
    return this.#storage.projectDirectoryPaths(projectId).flatMap((projectRoot) => [
      path.join(projectRoot, "state.json"),
      path.join(projectRoot, "events.jsonl"),
      path.join(projectRoot, "messages"),
      path.join(projectRoot, "runtime"),
      path.join(projectRoot, "repository")
    ]);
  }

  /** Session retirement and native resource cleanup retain separate facts. */
  private async closeResidentForTerminal(
    state: ProjectState,
    residentKey: string,
    resident: CollaborationResidentHandle,
    forget = true
  ): Promise<boolean> {
    const entry = this.#residents.get(residentKey);
    try {
      await resident.close();
    } catch (error) {
      if (forget) this.#residents.delete(residentKey);
      try {
        await this.database().appendEvent({ projectId: state.id, agentId: entry?.activity?.agentId,
          executionId: entry?.execution?.id, invocationId: entry?.activity?.invocationId,
          ...(entry?.execution ? { ownershipEpoch: entry.execution.ownershipEpoch } : {}),
          type: "execution.resource_cleanup.failed", payload: { residentKey, reason: supervisionError(error), nativeStopConfirmed: false } });
      } catch (recordError) { console.warn(`Resource cleanup record unavailable: ${supervisionError(recordError)}`); }
      return false;
    }
    if (entry?.activity) {
      try { await this.closeRuntimeActivity(state, entry.activity, {
        kind: "resident",
        invocationId: entry.activity.invocationId,
        outcome: "completed",
        requestId: `runtime-resident-close-${residentKey}-${entry.activity.ownershipEpoch ?? entry.activity.coordinatorEpoch ?? 1}`
      }); } catch (error) { console.warn(`Resident cleanup diagnostics were not saved (${residentKey}): ${supervisionError(error)}`); }
    }
    if (forget) this.#residents.delete(residentKey);
    return true;
  }

  /**
   * Compile compute-visible worktrees from this project's authoritative S
   * projection.  Never scan the service user's filesystem: doing so could
   * accidentally register a different project's checkout as a descriptor
   * root.  A concurrent claim may not have created its directory yet, so only
   * advertise retained paths that exist at this instant; every caller's own
   * session has already completed sessionBegin before it reaches open().
   */
  private async filesystemAuthorityInput(
    state: ProjectState
  ): Promise<CollaborationResidentOpenInput["filesystemAuthorityInput"]> {
    const projectRoot = this.#storage.projectDir(state.id);
    const projectWorktreeRoot = path.join(projectRoot, "git-worktrees");
    // Main can run before the first member execution creates a worktree. The
    // production launcher still compiles the same filesystem authority for
    // that management turn, so materialize and verify the project-owned root
    // here instead of letting realpath() treat a valid empty project as an
    // authority failure.
    await fs.mkdir(projectWorktreeRoot, { recursive: true, mode: 0o700 });
    const worktreeRootInfo = await fs.lstat(projectWorktreeRoot);
    if (worktreeRootInfo.isSymbolicLink() || !worktreeRootInfo.isDirectory()) {
      throw new Error("Project worktree root is not a trusted directory");
    }
    const [realProjectRoot, realWorktreeRoot] = await Promise.all([
      fs.realpath(projectRoot),
      fs.realpath(projectWorktreeRoot)
    ]);
    if (!isPathInside(realProjectRoot, realWorktreeRoot)) {
      throw new Error("Project worktree root resolves outside the project");
    }
    const projection = await this.database().projectState(state.id);
    // Compute authority is project-wide, not active-run-wide. Every retained
    // execution worktree recorded by this project's authoritative S database
    // is eligible; path containment still excludes every other project and
    // shared repository metadata.
    const candidates = [...new Set([...projection.executions, ...(projection.scopedExecutions ?? [])]
      .map((execution) => path.resolve(execution.worktreePath))
      .concat((await this.database().scopedLeaderTurns(state.id)).map((turn) =>
        path.join(projectWorktreeRoot, "agents", safeAgentId(turn.agentId))))
      .filter((worktree) => isPathInside(projectWorktreeRoot, worktree)))];
    const projectWorktrees: string[] = [];
    for (const worktree of candidates) {
      try {
        if ((await fs.stat(worktree)).isDirectory()) projectWorktrees.push(worktree);
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (code !== "ENOENT") throw error;
      }
    }
    return {
      serviceUserRoot: this.#serviceUserRoot,
      projectWorktreeRoot: realWorktreeRoot,
      projectWorktrees,
      protectedRoots: this.protectedProjectRoots(state.id)
    };
  }

  private async snapshotExecutionRecoveryMemory(
    state: ProjectState,
    execution: MemberExecution
  ): Promise<void> {
    const memoryPath = path.join(
      execution.worktreePath,
      "agent-memory",
      execution.agentId,
      "Memory.md"
    );
    let content: string;
    try {
      content = await fs.readFile(memoryPath, "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
      throw error;
    }
    if (!content.trim()) return;
    const snapshot = await this.#storage.saveRoleMemorySnapshot(
      state.id,
      execution.agentId,
      content,
      { runtimeOnly: true }
    );
    await this.database().appendEvent({
      projectId: state.id,
      requestId: `execution-memory-${execution.id}-${execution.ownershipEpoch}-${snapshot.sha256}`,
      workflowRevision: state.workflowRevision ?? 1,
      nodeRunId: execution.nodeRunId,
      ...(execution.groupRunId ? { groupRunId: execution.groupRunId } : {}),
      agentId: execution.agentId,
      taskId: execution.taskId,
      executionId: execution.id,
      ...(execution.invocationId ? { invocationId: execution.invocationId } : {}),
      ownershipEpoch: execution.ownershipEpoch,
      type: "execution.recovery_memory.snapshotted",
      payload: {
        sha256: snapshot.sha256,
        storage: "role_workspace"
      }
    });
  }

  private leaderRuntimePath(projectId: string, groupRunId: string): string {
    return path.join(
      this.#storage.projectDir(projectId),
      "runtime",
      "collaboration-leaders",
      createHash("sha256").update(groupRunId).digest("hex").slice(0, 24)
    );
  }

  private async cancelScopedProject(state: ProjectState): Promise<void> {
    await this.saveState(state);
    this.#pausedProjects.delete(state.id);
    for (const resolve of this.#pauseWaiters.get(state.id) ?? []) resolve();
    this.#pauseWaiters.delete(state.id);
    const activeRun = this.#runs.get(state.id);
    this.#controllers.get(state.id)?.abort();
    const residents = [...this.#residents.entries()].filter(([, entry]) => entry.projectId === state.id);
    const closeResults = await Promise.allSettled(residents.map(([, entry]) => entry.handle.close()));
    for (const [[key, entry], result] of residents.map((entry, index) => [entry, closeResults[index]!] as const)) {
      if (result.status === "fulfilled") {
        this.#residents.delete(key);
      }
    }
    const failedClose = closeResults.find((result) => result.status === "rejected");
    if (failedClose?.status === "rejected") {
      state.lastError = `Cancellation awaits resident stop proof: ${safeRuntimeError(failedClose.reason)}`;
      await this.saveState(state);
      throw failedClose.reason;
    }
    // The aborted coordinator may still be unwinding a provider call. Wait for
    // it before freezing the scoped projection, so no late writer can publish
    // after the pause fence.
    await activeRun;
    await this.reconcileTerminalPushObservationResidents(state);
    const runtime = await this.scopedRuntime(state, new AbortController().signal);
    await runtime.reconcileResidents();
    const database = this.database();
    // F13 deliberately performs no PR discovery, close, checkpoint, push,
    // merge, or cleanup. Provider facts and retained worktrees remain exactly
    // as observed; only the durable local scheduling projection is paused.
    await database.retainScopedProjectCancellation(state.id);
    await database.confirmProjectCancellationStopped(state.id);
    state.status = "paused";
    state.phase = "collaboration:user-cancelled";
    state.cancellationSettledAt = undefined;
    state.cancelledAt = undefined;
    state.lastError = undefined;
    await this.publishProjection(state, (await database.projectState(state.id)), { stopConfirmed: true });
    await this.saveState(state);
  }

  private worktreeClosingRuntime(state: ProjectState, signal: AbortSignal): ScopedWorktreeClosingRuntime {
    return new ScopedWorktreeClosingRuntime({ state, database: this.database(), storage: this.#storage, signal,
      launcher: this.#residentLauncher!, builder: this.#executionInputBuilder, repository: this.repository(state),
      observeGit: { clearExecutionWorktree: async (...args) => {
        const git = await this.git(state.id);
        if (!git.clearExecutionWorktree) throw new Error("Trusted worktree lifecycle cleanup is unavailable");
        return git.clearExecutionWorktree(...args);
      }, identifyRestrictedWorktreeClosing: async (...args) => {
        const git = await this.git(state.id);
        if (!git.identifyRestrictedWorktreeClosing) throw new Error("Closing requires trusted exact-file discovery");
        return git.identifyRestrictedWorktreeClosing(...args);
      }, observeRestrictedWorktreeClosing: async (...args) => {
        const git = await this.git(state.id);
        if (!git.observeRestrictedWorktreeClosing) throw new Error("Closing requires trusted exact-file Git observation");
        return git.observeRestrictedWorktreeClosing(...args);
      }, observeRestrictedWorktreeClosingTarget: async (...args) => {
        const git = await this.git(state.id);
        if (!git.observeRestrictedWorktreeClosingTarget) throw new Error("Closing requires trusted actual group-target inclusion");
        return git.observeRestrictedWorktreeClosingTarget(...args);
      } },
      gitForClosing: async turn => {
        const git = await this.git(state.id, { invocationId: turn.invocationId, capabilityHash: turn.capabilityHash,
          scope: { kind: turn.kind, reportHeadSha: turn.reportHeadSha, paths: [...turn.paths] } });
        if (!git.observeRestrictedWorktreeClosing) throw new Error("Closing requires its independently bound Git facade");
        return { checkpointAndPush: git.checkpointAndPush.bind(git), createPullRequest: git.createPullRequest.bind(git),
          mergePullRequest: git.mergePullRequest.bind(git), closePullRequest: git.closePullRequest.bind(git),
          observePullRequest: git.observePullRequest.bind(git), observeRestrictedWorktreeClosing: git.observeRestrictedWorktreeClosing.bind(git),
          ...(git.observePullRequestForExecution ? { observePullRequestForExecution: git.observePullRequestForExecution.bind(git) } : {}),
          ...(git.reconcilePushOperation ? { reconcilePushOperation: git.reconcilePushOperation.bind(git) } : {}),
          ...(git.reconcileMergedPullRequest ? { reconcileMergedPullRequest: git.reconcileMergedPullRequest.bind(git) } : {}) };
      },
      assertCurrent: async () => { this.assertWritable();
        if (this.#shuttingDown || this.#cancellingProjects.has(state.id) ||
          this.#pausedProjects.has(state.id) && !(this.#activeTurns.get(state.id) ?? 0)) throw new Error("Original closing authority was revoked"); },
      wait: () => this.waitWhilePaused(state.id, signal), publish: async () => this.publishProjection(state, (await this.database().projectState(state.id))),
      filesystem: async () => this.filesystemAuthorityInput(state), decorate: async request => await this.attachRuntimeCallbacks(state, request),
      trace: (agent, invocation) => this.traceSink(state, agent, invocation), turnRequestFactory: request => this.turnRequestFactory(state, request),
      hasResident: key => this.#residents.has(key), register: (key, handle) => { this.#residents.set(key, { projectId: state.id, handle }); },
      unregister: key => { this.#residents.delete(key); },
      submit: async (handle, turn, retain) => this.submitScopedNativeTurn(state, signal, handle, turn, retain) });
  }

  private async submitScopedNativeTurn(state: ProjectState, signal: AbortSignal, handle: CollaborationResidentHandle,
    turn: { inputId: string; invocationId: string; prompt: string }, retainNativeReturn?: (result: AgentRunResult) => void | Promise<void>): Promise<AgentRunResult> {
    await this.waitWhilePaused(state.id, signal);
    const endNativeTaskTurn = this.beginNativeTaskTurn(state.id, signal, turn.invocationId);
    let result: AgentRunResult;
    try { result = await this.submitNativeTurn(state, handle, turn); await retainNativeReturn?.(result); }
    finally {
      endNativeTaskTurn();
    }
    await this.waitWhilePaused(state.id, signal);
    return result;
  }

  private releaseActiveTurn(projectId: string): void {
    const remaining = Math.max(0, (this.#activeTurns.get(projectId) ?? 1) - 1);
    if (remaining) this.#activeTurns.set(projectId, remaining);
    else {
      this.#activeTurns.delete(projectId);
      for (const resolve of this.#turnIdleWaiters.get(projectId) ?? []) resolve();
      this.#turnIdleWaiters.delete(projectId);
    }
  }

  private beginNativeTaskTurn(projectId: string, signal: AbortSignal, invocationId: string): () => void {
    const key = JSON.stringify([projectId, invocationId]);
    if (this.#nativeTaskTurns.has(key)) throw new Error("Original native task already has an active submit");
    const turn = { signal, counted: true };
    this.#nativeTaskTurns.set(key, turn);
    this.#activeTurns.set(projectId, (this.#activeTurns.get(projectId) ?? 0) + 1);
    return () => {
      this.#nativeTaskTurns.delete(key);
      // Aborting a deferred wait never steals another concurrent task's
      // activity count. Its logical execution and FIFO remain authoritative.
      if (turn.counted) this.releaseActiveTurn(projectId);
    };
  }

  private async scopedRuntime(state: ProjectState, signal: AbortSignal): Promise<ScopedProjectRuntime> {
    if (!this.#residentLauncher) throw new Error("Scoped workflow requires the trusted resident launcher");
    const git = await this.git(state.id);
    for (const key of ["observeRemoteRef", "observeRetainedExecution", "observeExecutionWorktree", "createGroupFinalPullRequest", "mergeGroupFinalPullRequest",
      "reconcileGroupFinalPullRequest", "prepareAgentManagementWorkspace", "checkpointGroupCompletion"] as const) {
      if (typeof git[key] !== "function") throw new Error(`Scoped workflow requires trusted Git method ${key}`);
    }
    return await ScopedProjectRuntime.create({ state, database: this.database(), storage: this.#storage,
      git: git as ScopedWorkflowGit & ScopedAgentExecutionGit, repository: this.repository(state), launcher: this.#residentLauncher,
      inputBuilder: this.#executionInputBuilder, signal,
      filesystem: async () => this.filesystemAuthorityInput(state), decorate: async (request) => await this.attachRuntimeCallbacks(state, request),
      trace: (agentId, invocationId) => this.traceSink(state, agentId, invocationId),
      publish: async () => this.publishProjection(state, (await this.database().projectState(state.id))),
      applyWaitingWorkflowAdjustments: () => this.applyWaitingWorkflowAdjustments(state),
      assertManagementActive: async () => {
        this.assertWritable();
        if (this.#shuttingDown || this.#cancellingProjects.has(state.id) ||
          this.#pausedProjects.has(state.id) || state.pauseRequest ||
          (await this.database().projectCancellationIntent(state.id))) {
          throw new ScopedManagementDeferredError();
        }
      },
      withNativeLaunchFence: async <T>(action: () => Promise<T>): Promise<T> => {
        // Preparation may outlive a settled Pause. Recheck after every wait
        // before synchronously joining the open-and-register safe point.
        while (this.#pausedProjects.has(state.id)) await this.waitWhilePaused(state.id, signal);
        this.assertWritable();
        if (signal.aborted || this.#shuttingDown || this.#cancellingProjects.has(state.id)) {
          throw new Error("Scoped resident launch was cancelled");
        }
        this.#activeTurns.set(state.id, (this.#activeTurns.get(state.id) ?? 0) + 1);
        try {
          return await action();
        } finally {
          const remaining = Math.max(0, (this.#activeTurns.get(state.id) ?? 1) - 1);
          if (remaining) this.#activeTurns.set(state.id, remaining);
          else {
            this.#activeTurns.delete(state.id);
            for (const resolve of this.#turnIdleWaiters.get(state.id) ?? []) resolve();
            this.#turnIdleWaiters.delete(state.id);
          }
        }
      },
      reconcileWorktreeClosings: async () => this.worktreeClosingRuntime(state, signal).reconcile(),
      discoverWorktreeClosings: async () => this.worktreeClosingRuntime(state, signal).discover(),
      continueWorktreeClosings: async () => this.worktreeClosingRuntime(state, signal).advance(),
      continueTerminalPushObservations: async () => {
        try { await this.advanceTerminalPushObservations(state,signal); }
        catch (error) {
          if (!(error instanceof TerminalPushObservationUnresolvedError) || !error.coordinationNodeRunId) throw error;
          // The same stopped Agent's new unresolved receipt remains in the
          // existing hierarchy; managers must make their next decision.
        }
      },
      managementInputs: async (group, invocationId, inbox, runtime, allowEdit) =>
        this.stageLeaderManagementInputs(state, invocationId, inbox, runtime, group.leaderAgentId, "management-workspace", allowEdit),
      register: (key, handle) => { this.#residents.set(key, { projectId: state.id, handle }); },
      unregister: (key) => { this.#residents.delete(key); },
      validateConfiguration: async (proposal) => {
        await this.assertSessionCompatibleWorkflow(state, proposal.orchestration, proposal.agents);
        if (!this.#validateWorkflowConfiguration) throw new Error("Shared Agent editing requires the existing configuration validator");
        await this.#validateWorkflowConfiguration(state, proposal);
        await this.assertSessionCompatibleWorkflow(state, proposal.orchestration, proposal.agents);
      },
      submit: async (handle, turn, retain) => this.submitScopedNativeTurn(state, signal, handle, turn, retain)
    });
  }

  private scopedRuntimeFailureOperation(issue: Pick<ScopedRuntimeIssue, "groupRunId" | "arrivalRequestId">): string {
    return `scoped.runtime:${issue.groupRunId}:${issue.arrivalRequestId ?? "group"}`;
  }

  /**
   * A scoped runtime retry is only a recovery after the same graph scope has
   * made an observable transition. A later advance that merely omits the old
   * error is not enough: the arrival/execution must have progressed, the
   * group must have completed, or the exact persisted incident must be gone.
   */
  private async scopedRuntimeRecoveryEvidence(
    state: ProjectState,
    result: ScopedRuntimeAdvanceResult,
    attempt: FailureAttempt
  ): Promise<Readonly<Record<string, unknown>> | undefined> {
    const metadata = attempt.metadata;
    const rootGroupRunId = typeof metadata.rootGroupRunId === "string"
      ? metadata.rootGroupRunId : undefined;
    const groupRunId = typeof metadata.groupRunId === "string"
      ? metadata.groupRunId : undefined;
    if (!rootGroupRunId || rootGroupRunId !== result.groupRun.id || !groupRunId) return undefined;

    const projection = await this.database().projectState(state.id);
    const group = projection.scopedGroupRuns?.find((item) => item.id === groupRunId);
    if (!group || ["failed", "cancelled"].includes(group.status)) return undefined;
    const arrivalRequestId = typeof metadata.arrivalRequestId === "string"
      ? metadata.arrivalRequestId : undefined;
    const arrival = arrivalRequestId
      ? projection.scopedArrivals?.find((item) => item.requestId === arrivalRequestId)
      : undefined;
    // Group-level incidents use the GroupRun activation request as their
    // durable identity even when no scoped arrival row exists for it.
    if (arrival && ["failed", "cancelled", "stopped"].includes(arrival.status)) {
      return undefined;
    }
    const executionId = typeof metadata.executionId === "string"
      ? metadata.executionId : undefined;
    const execution = executionId
      ? projection.scopedExecutions?.find((item) => item.id === executionId)
      : undefined;
    if (executionId && (!execution || ["failed", "cancelled", "stopped", "paused"].includes(execution.status))) {
      return undefined;
    }

    const openIncident = projection.scopedGroupIssues?.find((issue) =>
      issue.groupRunId === groupRunId &&
      (!arrivalRequestId || issue.arrivalRequestId === arrivalRequestId)
    );
    if (openIncident) return undefined;

    const arrivalProgressed = Boolean(arrival && [
      "running", "integrating", "merged", "completed", "skipped"
    ].includes(arrival.status));
    const executionProgressed = Boolean(execution && [
      "running", "integrating", "merged", "completed"
    ].includes(execution.status));
    const completed = result.status === "completed" || group.status === "completed";
    if (!completed && !arrivalProgressed && !executionProgressed) return undefined;

    return {
      rootGroupRunId,
      groupRunId,
      ...(arrivalRequestId ? { arrivalRequestId } : {}),
      ...(executionId ? { executionId } : {}),
      resultStatus: result.status,
      groupStatus: group.status,
      ...(arrival ? { arrivalStatus: arrival.status } : {}),
      ...(execution ? { executionStatus: execution.status } : {}),
      incidentCleared: true
    };
  }

  /** Keep transient queue waits out of the durable failure ledger while
   * recording each real scoped runtime fault and its later recovery. */
  private async reconcileScopedRuntimeFailures(
    state: ProjectState,
    result: ScopedRuntimeAdvanceResult
  ): Promise<{ unresolvedMessages: string[] }> {
    const failures = result.issues.filter((issue) =>
      issue.severity === "failure" || issue.kind === "failure"
    );
    const failureOperations = new Set<string>();
    for (const issue of failures) {
      const operation = this.scopedRuntimeFailureOperation(issue);
      failureOperations.add(operation);
      const prior = (await this.database().failureAttempts(state.id))
        .filter((attempt) => attempt.scope === "scheduler" && attempt.operation === operation)
        .at(-1);
      if (prior?.status === "failed" && prior.redactedMessage === issue.message) continue;
      await this.appendFailureAttempt(state, {
        scope: "scheduler",
        operation,
        error: new Error(issue.message),
        errorCode: "SCOPED_RUNTIME_FAILURE",
        retryable: true,
        metadata: {
          rootGroupRunId: result.groupRun.id,
          groupRunId: issue.groupRunId,
          ...(issue.arrivalRequestId ? { arrivalRequestId: issue.arrivalRequestId } : {}),
          ...(issue.executionId ? { executionId: issue.executionId } : {}),
          kind: issue.kind
        }
      });
    }

    // Resolve only the latest failure for this exact root graph, and retain a
    // machine-readable link to both the failure and the observed transition.
    const latestFailures = new Map<string, FailureAttempt>();
    for (const attempt of (await this.database().failureAttempts(state.id))) {
      if (attempt.scope !== "scheduler" || !attempt.operation.startsWith("scoped.runtime:") ||
        attempt.status !== "failed" || failureOperations.has(attempt.operation)) continue;
      latestFailures.set(attempt.operation, attempt);
    }
    for (const attempt of latestFailures.values()) {
      const recoveryEvidence = await this.scopedRuntimeRecoveryEvidence(state, result, attempt);
      if (!recoveryEvidence) continue;
      await this.appendSuccessfulAttempt(state, {
        attemptId: durableAttemptId("scoped-runtime-recovery", [attempt.attemptId]),
        scope: "scheduler",
        operation: attempt.operation,
        message: "Scoped runtime recovered with an authoritative graph transition",
        onlyIfUnresolved: true,
        metadata: {
          resolvedAttemptId: attempt.attemptId,
          // Scoped group identities live in the scoped state tables. Keep the
          // identity in metadata for recovery evidence, but do not serialize it
          // as the legacy failure envelope's groupRunId, which is validated
          // against ordinary group_runs.
          ...(typeof attempt.metadata.groupRunId === "string"
            ? { groupRunId: attempt.metadata.groupRunId } : {}),
          recoveryEvidence
        }
      });
    }

    const unresolved = (await this.database().failureAttempts(state.id))
      .filter((attempt) => attempt.scope === "scheduler" && attempt.operation.startsWith("scoped.runtime:"))
      .reduce((latest, attempt) => latest.set(attempt.operation, attempt), new Map<string, FailureAttempt>());
    const unresolvedMessages = [...unresolved.values()]
      .filter((attempt) => {
        if (attempt.status !== "failed") return false;
        // Keep an unresolved historical attempt visible in the ledger without
        // turning a later, independent root execution into a false pause.
        const rootGroupRunId = attempt.metadata.rootGroupRunId;
        return failureOperations.has(attempt.operation) ||
          rootGroupRunId === result.groupRun.id;
      })
      .map((attempt) => attempt.redactedMessage);
    return { unresolvedMessages };
  }

  private async advanceScopedGroup(state: ProjectState, root: ScopedGroupRunRecord, signal: AbortSignal,
    runtime?: ScopedProjectRuntime): Promise<void> {
    runtime ??= await this.scopedRuntime(state, signal);
    const result = await runtime.advance(root.id);
    const transient = result.issues.find(issue => issue.transientFailure)?.transientFailure;
    if (transient) throw transient;
    const failureState = await this.reconcileScopedRuntimeFailures(state, result);
    await this.publishProjection(state, (await this.database().projectState(state.id)));
    // A management job may have settled while Pause was waiting for its last
    // native safe point. Preserve that lifecycle projection after the scoped
    // pump returns; its ordinary waiting result must not write queued or route
    // the root onward behind the user's durable Pause request.
    if (state.pauseRequest || this.#pausedProjects.has(state.id)) {
      const settled = Boolean(state.pauseRequest?.settledAt) || state.status === "paused";
      state.status = settled ? "paused" : "pausing";
      state.phase = settled ? "collaboration:user-paused" : "collaboration:user-pausing";
      state.lastError = undefined;
      await this.saveState(state);
      return;
    }
    if (result.status !== "completed") {
      const hasFailure = failureState.unresolvedMessages.length > 0;
      if (state.userIntervention?.status === "pending") {
        state.status = "retrying";
        state.phase = "user-intervention-required";
      } else if (hasFailure) {
        state.status = "retrying";
        state.phase = "collaboration:scoped-failure";
      } else {
        state.status = "retrying";
        state.phase = "collaboration:scoped-waiting";
        if (result.issues.some(issue => issue.kind === "waiting_for_workflow_adjustment")) {
          this.#workflowAdjustmentDeferredProjects.add(state.id);
          state.status = "queued";
          state.phase = "collaboration:workflow-adjustment-waiting";
        }
      }
      state.lastError = hasFailure
        ? failureState.unresolvedMessages.join("\n").slice(0, 4_000)
        : undefined;
      await this.saveState(state);
      return;
    }
    if (failureState.unresolvedMessages.length === 0 && state.phase.startsWith("collaboration:scoped-")) {
      state.lastError = undefined;
    }
    const projection = await this.database().projectState(state.id);
    const node = projection.nodeRuns.find((item) => item.activationRequestId === root.activationRequestId)!;
    const output = scopedGroupOutput(projection, root.id);
    const edges = state.orchestration.routes[root.groupId] ?? [];
    const fixed = edges.length === 1 && edges[0]?.kind === "strong" ? edges[0] : undefined;
    const groupDefinition = state.orchestration.scopedWorkflow?.groups.find((entry) => entry.id === root.groupId);
    const weakCandidates = edges.filter((edge) => edge.kind === "weak").map((edge) => edge.target);
    let decision: Awaited<ReturnType<typeof this.decideMainRoute>> | undefined;
    if (!fixed && groupDefinition?.decisionBy === "agent") {
      const route = await this.database().scopedRootRouteDecision(state.id, node.id);
      if (route) decision = { targetNodeId: route.targetNodeId, decisionRequestId: route.decisionRequestId };
    } else if (!fixed) {
      decision = await this.decideMainRoute(state, node.id, "main", output, weakCandidates, signal);
    }
    if (!fixed && (!decision || decision.intervention)) {
      if (decision?.intervention) {
        await this.pauseForMainIntervention(state, node.id, decision.decisionRequestId, decision.intervention);
        return;
      }
      state.status = "retrying";
      state.phase = "collaboration:scoped-root-route-waiting";
      await this.saveState(state);
      return;
    }
    await this.database().completeScopedRootRoute({ projectId: state.id, groupRunId: root.id, nodeRunId: node.id,
      routeEmissionId: `scoped-root-route-${root.id}`, output,
      route: fixed ? { kind: "fixed", targetNodeId: fixed.target }
        : { kind: "weak", targetNodeId: decision!.targetNodeId,
          selectedByAgentId: groupDefinition?.decisionBy === "agent" ? groupDefinition.leaderAgentId : "main",
          decisionRequestId: decision!.decisionRequestId } });
    await this.publishProjection(state, (await this.database().projectState(state.id)));
    await this.drainPendingRoutes(state, signal);
  }

  private async stageLeaderManagementInputs(
    state: ProjectState,
    invocationId: string,
    authorityInbox: string,
    runtimePath: string,
    coordinatorAgentId: string,
    workspaceName = "management-workspace",
    allowWorkflowAuthoring = false,
    workflowAuthoringInvocationId = invocationId
  ): Promise<InvocationInputs> {
    if (typeof workflowAuthoringInvocationId !== "string" || !/^[A-Za-z0-9_-]{1,160}$/.test(workflowAuthoringInvocationId)) {
      throw new Error("Management proposal snapshot identity is invalid");
    }
    const fixed = state.orchestration.schemaVersion === 3;
    const prepare = (await this.git(state.id)).prepareAgentManagementWorkspace;
    if (fixed && !prepare) throw new Error("Scoped management requires the canonical Agent workspace service");
    const workspacePath = fixed ? await prepare!.call((await this.git(state.id)), coordinatorAgentId)
      : path.join(runtimePath, workspaceName);
    await fs.mkdir(workspacePath, { recursive: true, mode: 0o700 });
    // Read-only inputs belong to an invocation, whereas the resumed native
    // Agent keeps its cwd and files. Never replace its prior Memory snapshot
    // merely because a new management turn needs current facts.
    const managementRoot = fixed
      ? path.dirname(managementInputRoot(this.#storage.projectDir(state.id), coordinatorAgentId, invocationId))
      : path.join(workspacePath, ".scienceevolve", "management");
    const snapshotRoot = path.join(managementRoot, invocationId);
    const authoringRoot = fixed
      ? managementInputRoot(this.#storage.projectDir(state.id), coordinatorAgentId, workflowAuthoringInvocationId)
      : workspacePath;
    for (const directory of [path.dirname(path.dirname(managementRoot)), path.dirname(managementRoot), managementRoot, snapshotRoot,
      ...(fixed && allowWorkflowAuthoring ? [managementInputRoot(this.#storage.projectDir(state.id), coordinatorAgentId, workflowAuthoringInvocationId)] : [])]) {
      try { await fs.mkdir(directory, { mode: 0o700 }); }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error; }
      const info = await fs.lstat(directory);
      if (!info.isDirectory() || info.isSymbolicLink() || await fs.realpath(directory) !== directory) {
        throw new Error("Management input snapshot traverses an untrusted directory");
      }
    }
    const workflowDirectory = authoritativeWorkflowPaths(
      this.#storage.projectDir(state.id)
    ).directory;
    const workspaceWorkflowDirectory = path.join(
      fixed ? snapshotRoot : workspacePath,
      AUTHORITATIVE_WORKFLOW_DIRECTORY
    );
    await ensureExactDirectorySymlink(workflowDirectory, workspaceWorkflowDirectory,
      this.#storage.projectDirectoryPaths(state.id).map((directory) => authoritativeWorkflowPaths(directory).directory));
    const inboxPath = path.join(snapshotRoot, `${invocationId}-Inbox.md`);
    const memoryPath = path.join(snapshotRoot, "Memory.md");
    const bytes = await fs.readFile(authorityInbox);
    const snapshot = await this.optionalManagementMemorySnapshot(state.id);
    await Promise.all([
      writeImmutableRecoveryFile(inboxPath, bytes, 0o400),
      writeImmutableRecoveryFile(
        memoryPath,
        managementMemoryDocument(state.id, snapshot, coordinatorAgentId),
        0o400
      )
    ]);
    let workflowAuthoringPath: string | undefined;
    const authoringBase = allowWorkflowAuthoring ? (await this.database().workflowAdjustmentCurrent(state.id, this.workflowAdjustmentSeed(state))) : undefined;
    const authoringAgents = authoringBase
      ? restoreAgentConfiguration(authoringBase.snapshot, state.agents)
      : undefined;
    if (authoringBase) await this.#storage.writeManagementWorkflowCurrentSnapshot(authoringRoot,
      fixed ? mainAgentOrchestrationDocument(state.id, authoringBase.snapshot.orchestration, authoringAgents!, authoringBase.snapshot.skillDefinitions, authoringBase.snapshot.mcpDefinitions, authoringBase.version)
        : mainWorkflowDocument(state.id, authoringBase.snapshot.orchestration, authoringBase.version),
      async () => {
        this.assertWritable();
        return sameWorkflowConfigurationVersion((await this.database().workflowAdjustmentCurrent(state.id, this.workflowAdjustmentSeed(state))).version, authoringBase.version);
      });
    if (fixed && allowWorkflowAuthoring) {
      // Current Inbox/Memory snapshots rotate with native authority. The
      // Agent's unfinished authoring file belongs to its original logical
      // task and must survive a new epoch without a system-authored reset.
      const directory = path.join(managementInputRoot(this.#storage.projectDir(state.id), coordinatorAgentId, workflowAuthoringInvocationId), "proposal");
      try { await fs.mkdir(directory, { mode: 0o700 }); }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error; }
      if ((await fs.lstat(directory)).isSymbolicLink() || await fs.realpath(directory) !== directory) {
        throw new Error("Management proposal directory is not canonical");
      }
      workflowAuthoringPath = path.join(directory, MAIN_WORKFLOW_FILE);
      await ensureMainWorkflowProposalFile(workflowAuthoringPath,
        `${JSON.stringify(mainAgentOrchestrationDocument(state.id, authoringBase!.snapshot.orchestration, authoringAgents!, authoringBase!.snapshot.skillDefinitions, authoringBase!.snapshot.mcpDefinitions, authoringBase!.version), null, 2)}\n`);
    }
    return {
      projectPath: await fs.realpath(this.#storage.projectDir(state.id)),
      workspacePath: await fs.realpath(workspacePath),
      inboxPath: await fs.realpath(inboxPath),
      memoryPath: await fs.realpath(memoryPath),
      runtimePath: await fs.realpath(runtimePath),
      ...(workflowAuthoringPath ? { workflowAuthoringPath, workflowAuthoringInvocationId,
        workflowCurrentPath: path.join(authoringRoot, MAIN_AGENT_ORCHESTRATION_CURRENT_FILE) } : {}),
      inboxSha256: createHash("sha256").update(bytes).digest("hex")
    };
  }

  private async optionalManagementMemorySnapshot(
    projectId: string,
    signal?: AbortSignal
  ): Promise<ManagementMemorySnapshot | undefined> {
    const read = (await this.git(projectId)).managementMemorySnapshot;
    if (!read) return undefined;
    try {
      return await read.call((await this.git(projectId)), signal);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Required Git ref is missing")) {
        return undefined;
      }
      throw error;
    }
  }

  private async businessAssignmentWithOwnManagement(
    state: ProjectState,
    agentId: string,
    assignment: string,
    signal?: AbortSignal
  ): Promise<string> {
    // Memory remains in project records; it is no longer attached to a task.
    return assignment;
  }

  private async attachRuntimeCallbacks(
    state: ProjectState,
    request: AgentRunRequest,
    execution?: MemberExecution
  ): Promise<void> {
    const priorResidentActivity = request.onResidentTurnActivity;
    request.onResidentTurnActivity = activity => {
      const key = JSON.stringify([state.id, activity.invocationId, activity.inputId]);
      if (activity.active) this.#activeResidentTurns.add(key);
      else this.#activeResidentTurns.delete(key);
      priorResidentActivity?.(activity);
    };
    const priorRecovery = request.onHarnessRecovery;
    request.onHarnessRecovery = async event => {
      this.assertWritable();
      const context = request.executionContext;
      await this.database().appendEvent({ projectId: state.id, agentId: request.agent, invocationId: request.invocationId,
        requestId: `harness-recovery:${request.invocationId}:${createHash("sha256").update(JSON.stringify([event.inputId, event.attempt, event.phase])).digest("hex").slice(0, 24)}`,
        type: `runtime.harness_recovery.${event.phase}`, payload: { ...event,
          ...(context ? { executionContext: context } : {}), runtimePath: request.runtimePath,
          worktreePath: request.workspacePath } });
      await this.publishProjection(state, (await this.database().projectState(state.id)));
      await priorRecovery?.(event);
    };
    const priorRecoveryWait = request.onHarnessRecoveryWait;
    request.onHarnessRecoveryWait = async waiting => {
      const key = JSON.stringify([state.id, request.invocationId]);
      const turn = this.#nativeTaskTurns.get(key);
      if (!turn) throw new Error("Harness recovery requires its original active native task");
      turn.signal.throwIfAborted();
      this.assertWritable();
      if (waiting && turn.counted) { turn.counted = false; this.releaseActiveTurn(state.id); }
      else if (!waiting && !turn.counted) {
        await this.waitWhilePaused(state.id, turn.signal);
        turn.signal.throwIfAborted();
        this.assertWritable();
        if (this.#shuttingDown || this.#cancellingProjects.has(state.id) || this.#nativeTaskTurns.get(key) !== turn)
          throw new Error("Original Harness recovery was stopped");
        turn.counted = true;
        this.#activeTurns.set(state.id, (this.#activeTurns.get(state.id) ?? 0) + 1);
      }
      await priorRecoveryWait?.(waiting);
    };
    const priorExperimentWait = request.onExperimentWait;
    request.onExperimentWait = async waiting => {
      const key = JSON.stringify([state.id, request.invocationId]);
      const turn = this.#nativeTaskTurns.get(key);
      if (!turn) throw new Error("Experiment wait requires its original active native task");
      turn.signal.throwIfAborted();
      this.assertWritable();
      if (waiting && turn.counted) {
        // The native model has returned its pending handoff. Release only
        // the physical Pause safe point; never release task ownership/FIFO.
        turn.counted = false;
        this.releaseActiveTurn(state.id);
      } else if (!waiting && !turn.counted) {
        await this.waitWhilePaused(state.id, turn.signal);
        turn.signal.throwIfAborted();
        this.assertWritable();
        if (this.#shuttingDown || this.#cancellingProjects.has(state.id) || this.#nativeTaskTurns.get(key) !== turn) {
          throw new Error("Original experiment continuation was stopped");
        }
        turn.counted = true;
        this.#activeTurns.set(state.id, (this.#activeTurns.get(state.id) ?? 0) + 1);
      }
      await priorExperimentWait?.(waiting);
    };
    if (request.executionContext && (state.orchestration.schemaVersion === 3 ||
      (request.executionContext.role === "leader" && "routeScopeId" in request.executionContext))) {
      const priorNativeOpened = request.onResidentNativeOpened;
      request.onResidentNativeOpened = async binding => {
        await priorNativeOpened?.(binding);
        this.assertWritable();
        await this.database().recordAgentNativeSessionBinding({ projectId: state.id, agentId: request.agent,
          invocationId: request.invocationId, runtimePath: binding.runtimePath, worktreePath: request.workspacePath,
          executionContext: request.executionContext!, session: binding.session });
      };
    }
    const sessionKey = collaborationSessionKey(
      request.agent,
      request.executionContext,
      state.orchestration.schemaVersion === 3
    );
    const context = request.executionContext;
    const persisted = request.project.agentSessions?.[sessionKey];
    if (state.orchestration.schemaVersion === 2 && context && persisted && validateSessionRef(persisted).valid) {
      const leader = context.role === "leader";
      const scopeId = leader
        ? ("routeScopeId" in context ? context.routeScopeId : context.groupRunId)
        : context.executionId;
      const epoch = leader ? context.coordinatorEpoch : context.ownershipEpoch;
      const original = scopeId ? (await this.database().recordedResidentSession({
        projectId: state.id, sourceNodeRunId: context.nodeRunId,
        scope: leader ? ("routeScopeId" in context ? "main-route" : "group-leader") : "member",
        scopeId, agentId: request.agent, nativeId: persisted.nativeId, throughEpoch: epoch
      })) : undefined;
      if (original && original.harnessId === persisted.harnessId &&
        original.adapterVersion === persisted.adapterVersion && original.durable === persisted.durable &&
        (original.generation !== persisted.generation || original.createdAt !== persisted.createdAt)) {
        // Old Harness projection could rebuild metadata around the same
        // native ID. Prepare only a private request view from trusted S
        // history; native open must still pass its ordinary Stop/epoch gates.
        // Publish through the real native-session callback after open, never
        // rewrite live state or replace the Agent's memory/business decisions.
        request.project = structuredClone(request.project);
        request.project.agentSessions![sessionKey] = { ...persisted,
          generation: original.generation, createdAt: original.createdAt };
        if (request.project.agentSessionMeta?.[sessionKey]) {
          request.project.agentSessionMeta[sessionKey].generation = original.generation;
        }
      }
    }
    this.#invocationDispatcher?.decorate({ state, request, ...(execution ? { execution } : {}) });
    const receipts = (session: SessionRef) => controlResultReceipts(this.database(), {
      projectId: state.id, agentId: request.agent, invocationId: request.invocationId,
      session, ...(request.executionContext ? { executionContext: request.executionContext } : {})
    });
    const workflowNotifications = (session: SessionRef) => workflowAdjustmentNotifications(this.database(), {
      projectId: state.id, agentId: request.agent, invocationId: request.invocationId,
      session, ...(request.executionContext ? { executionContext: request.executionContext } : {})
    });
    request.onControlResult = async (input, session) => {
      this.assertWritable();
      return await receipts(session).record(input);
    };
    request.onProjectStateRequest = async input => {
      this.assertWritable();
      return await executeProjectStateRequest(this.database(), { kind: "agent", projectId: state.id,
        agentId: request.agent, invocationId: request.invocationId }, input, { observePullRequest: async preparation => {
        const repository = this.repository(state);
        if (repository.owner !== preparation.repository.owner || repository.name !== preparation.repository.name)
          throw new Error("Project repository changed before its exact PR observation");
        return (await this.git(state.id)).observePullRequest({ repository, providerNumber: preparation.providerNumber,
          ownerExecutionId: preparation.executionId });
      } });
    };
    request.onPendingControlResults = async (inputId, session) => {
      this.assertWritable();
      await captureKnownAgentGitResults(this.database(), state.id);
      return await receipts(session).prepareNotification(inputId);
    };
    request.onPendingWorkflowAdjustments = async (inputId, session, publishContext) => {
      this.assertWritable();
      const notifications = workflowNotifications(session);
      const text = await notifications.prepare(inputId);
      const sources = await notifications.details(inputId);
      const messages = request.agent === "main" ? (await this.database().unexpectedSystemMessages(state.id)) : [];
      if (messages.length) sources.push({ key: "unexpected-system-messages", label: "Unexpected late system messages",
        records: messages.map(event => ({ ...event.payload, recordedAt: event.ts })) });
      if (!text && !messages.length) return "";
      const details = await publishContext?.(sources);
      return [text, messages.length ? `Unexpected system messages from known other native Agents are available (${messages.length}). Read them during this normal task if useful; they do not assign a repair, confirm Git success or renew any original task allowance.` : "",
        details ?? (messages.length ? JSON.stringify(sources.at(-1)!.records) : "")].filter(Boolean).join("\n\n");
    };
    const priorOfficial = request.onOfficialHarnessEvent;
    request.onOfficialHarnessEvent = async (event, nativeSession) => {
      await priorOfficial?.(event);
      // Only the trusted resident broker supplies an actually opened Session.
      // A persisted result, queued input, or one-shot event is not reception.
      if (nativeSession) { await receipts(nativeSession).observeNative(event); await workflowNotifications(nativeSession).observe(event); }
    };
    const priorNativeInput = request.onNativeUserInput;
    request.onNativeUserInput = async (event, nativeSession) => {
      await priorNativeInput?.(event, nativeSession);
      if (nativeSession) { await receipts(nativeSession).observeNative(event); await workflowNotifications(nativeSession).observe(event); }
    };
    const priorSession = request.onDurableSessionStarted;
    request.onDurableSessionStarted = async (session: SessionRef, legacyId: string) => {
      if (state.orchestration.schemaVersion === 3 && state.agentSessionIds?.[sessionKey] &&
        state.agentSessionIds[sessionKey] !== legacyId) {
        throw new Error(`Scoped Agent ${request.agent} attempted to replace its persistent native Session`);
      }
      await priorSession?.(session, legacyId);
      state.agentSessions = { ...(state.agentSessions ?? {}), [sessionKey]: structuredClone(session) };
      state.agentSessionIds = { ...(state.agentSessionIds ?? {}), [sessionKey]: legacyId };
      state.agentSessionMeta = {
        ...(state.agentSessionMeta ?? {}),
        [sessionKey]: {
          generation: session.generation,
          contextSeq: state.eventSeq,
          resumeFailureCount: state.agentSessionMeta?.[sessionKey]?.resumeFailureCount ?? 0
        }
      };
      await this.saveState(state);
    };
    const priorUsage = request.onTokenUsage;
    const priorUsageFailure = request.onTokenUsagePersistenceFailure;
    request.onTokenUsage = async (usage) => {
      await priorUsage?.(usage);
      const recordedAt = new Date().toISOString();
      state.tokenUsage.requestLedger ??= {};
      const previous = state.tokenUsage.requestLedger[usage.usageId];
      if (!("inputTokens" in usage)) {
        if (previous) return;
        const agentTotals = state.tokenUsage.byAgent[request.agent] ?? {
          inputTokens: 0,
          cachedInputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          invocations: 0
        };
        state.tokenUsage.unknownRequests = (state.tokenUsage.unknownRequests ?? 0) + 1;
        agentTotals.unknownRequests = (agentTotals.unknownRequests ?? 0) + 1;
        state.tokenUsage.complete = false;
        agentTotals.complete = false;
        state.tokenUsage.byAgent[request.agent] = agentTotals;
        state.tokenUsage.requestLedger[usage.usageId] = {
          agent: request.agent,
          status: "unknown",
          protocol: usage.protocol,
          model: usage.model,
          reason: usage.reason,
          processingState: usage.processingState,
          updatedAt: recordedAt
        };
        state.tokenUsage.updatedAt = recordedAt;
        await this.saveState(state);
        return;
      }
      const context = request.executionContext;
      const scopedGroup = context && "groupRunId" in context && context.groupRunId
        ? (await this.database().scopedGroupRun(state.id, context.groupRunId)) : undefined;
      const appended = await this.database().appendUsage({
        ...(scopedGroup ? { scopeKind: "scoped" as const } : {}),
        usageId: usage.usageId,
        requestId: usage.usageId,
        projectId: state.id,
        ...(context ? { nodeRunId: context.nodeRunId } : {}),
        ...(context && "groupRunId" in context && context.groupRunId
          ? { groupRunId: context.groupRunId }
          : {}),
        agentId: request.agent,
        ...(scopedGroup && context && context.role !== "leader" && !context.executionId.startsWith("group-final-") ? { executionId: context.executionId }
          : execution ? { taskId: execution.taskId, executionId: execution.id } : {}),
        invocationId: request.invocationId,
        ...(scopedGroup && context && context.role !== "leader" && !context.executionId.startsWith("group-final-") ? { ownershipEpoch: context.ownershipEpoch }
          : execution ? { ownershipEpoch: execution.ownershipEpoch } : {}),
        inputTokens: usage.inputTokens,
        cachedInputTokens: usage.cachedInputTokens,
        outputTokens: usage.outputTokens,
        totalTokens: usage.totalTokens,
        model: usage.model,
        protocol: usage.protocol
      });
      await this.appendSuccessfulAttempt(state, {
        attemptId: `usage-persistence-success:${createHash("sha256")
          .update(`${state.id}\0${request.invocationId}\0${usage.usageId}`)
          .digest("hex")
          .slice(0, 32)}`,
        scope: "usage",
        operation: `persistence:${usage.usageId}`,
        startedAt: recordedAt,
        message: "Usage persistence succeeded on a later attempt",
        agentId: request.agent,
        invocationId: request.invocationId,
        metadata: {
          usageId: usage.usageId,
          protocol: usage.protocol,
          model: usage.model
        }
      });
      if (!appended.replay) {
        const totals = state.tokenUsage;
        const agentTotals = totals.byAgent[request.agent] ?? {
          inputTokens: 0,
          cachedInputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          invocations: 0
        };
        if (previous?.status === "unknown") {
          totals.unknownRequests = Math.max(0, (totals.unknownRequests ?? 0) - 1);
          const previousAgentTotals = totals.byAgent[previous.agent];
          if (previousAgentTotals) {
            previousAgentTotals.unknownRequests = Math.max(
              0,
              (previousAgentTotals.unknownRequests ?? 0) - 1
            );
          }
        }
        for (const target of [totals, agentTotals]) {
          target.inputTokens += usage.inputTokens;
          target.cachedInputTokens += usage.cachedInputTokens;
          target.outputTokens += usage.outputTokens;
          target.totalTokens += usage.totalTokens;
          target.invocations += 1;
        }
        totals.byAgent[request.agent] = agentTotals;
        totals.requestLedger![usage.usageId] = {
          agent: request.agent,
          status: "known",
          protocol: usage.protocol,
          model: usage.model,
          inputTokens: usage.inputTokens,
          cachedInputTokens: usage.cachedInputTokens,
          outputTokens: usage.outputTokens,
          totalTokens: usage.totalTokens,
          updatedAt: recordedAt
        };
        totals.complete = (totals.unknownRequests ?? 0) === 0 &&
          totals.historicalIncomplete !== true;
        for (const target of Object.values(totals.byAgent)) {
          target.complete = (target.unknownRequests ?? 0) === 0 &&
            totals.historicalIncomplete !== true;
        }
        totals.updatedAt = recordedAt;
        await this.saveState(state);
      }
    };
    request.onTokenUsagePersistenceFailure = async (failure) => {
      const context = request.executionContext;
      const groupRunId = context && "groupRunId" in context
        ? context.groupRunId
        : undefined;
      const routeScopeId = context && "routeScopeId" in context
        ? context.routeScopeId
        : undefined;
      const failureIdentity = createHash("sha256")
        .update(`${state.id}\0${request.invocationId}\0${failure.usageId}`)
        .digest("hex")
        .slice(0, 32);
      const safeFailure = safeRuntimeError(failure.error);
      await this.appendFailureAttempt(state, {
        attemptId: `usage-persistence:${failureIdentity}`,
        scope: "usage",
        operation: `persistence:${failure.usageId}`,
        error: new Error(safeFailure),
        errorCode: "USAGE_PERSISTENCE_FAILED",
        retryable: true,
        agentId: request.agent,
        invocationId: request.invocationId,
        ...(context ? { nodeRunId: context.nodeRunId } : {}),
        ...(groupRunId ? { groupRunId } : {}),
        ...(execution ? {
          taskId: execution.taskId,
          executionId: execution.id,
          ownershipEpoch: execution.ownershipEpoch
        } : {}),
        metadata: {
          usageId: failure.usageId,
          protocol: failure.protocol,
          model: failure.model,
          ...(routeScopeId ? { routeScopeId } : {})
        }
      });
      await this.database().appendEvent({
        projectId: state.id,
        eventId: `evt-usage-persistence-failed-${failureIdentity}`,
        requestId: `usage-persistence-failed-${failureIdentity}`,
        workflowRevision: state.workflowRevision ?? 1,
        agentId: request.agent,
        invocationId: request.invocationId,
        type: "usage.persistence.failed",
        payload: {
          usageId: failure.usageId,
          protocol: failure.protocol,
          model: failure.model,
          error: safeFailure,
          ...(context ? { nodeRunId: context.nodeRunId, role: context.role } : {}),
          ...(groupRunId ? { groupRunId } : {}),
          ...(routeScopeId ? { routeScopeId } : {}),
          ...(execution ? {
            taskId: execution.taskId,
            executionId: execution.id,
            ownershipEpoch: execution.ownershipEpoch
          } : {})
        }
      });
      await this.publishProjection(state, (await this.database().projectState(state.id)));
      await priorUsageFailure?.(failure);
    };
  }

  private turnRequestFactory(
    state: ProjectState,
    lockedBaseRequest: AgentRunRequest,
    execution?: MemberExecution,
    recoverySeed?: ResidentRecoveryProofSeed
  ): CollaborationTurnRequestFactory {
    const recovery = recoverySeed
      ? assertResidentRecoveryProofSeed(recoverySeed)
      : undefined;
    let recoveryConsumed = false;
    return async ({ baseRequest, turn }) => {
      if (
        baseRequest.agent !== lockedBaseRequest.agent ||
        baseRequest.projectPath !== lockedBaseRequest.projectPath ||
        baseRequest.workspacePath !== lockedBaseRequest.workspacePath ||
        baseRequest.runtimePath !== lockedBaseRequest.runtimePath ||
        JSON.stringify(baseRequest.executionContext) !==
          JSON.stringify(lockedBaseRequest.executionContext)
      ) {
        throw new Error("Resident turn request does not match its locked execution authority");
      }
      const request: AgentRunRequest = {
        ...lockedBaseRequest,
        project: structuredClone(state),
        invocationId: turn.invocationId,
        ...(state.agentSessionIds?.[collaborationSessionKey(
          lockedBaseRequest.agent,
          lockedBaseRequest.executionContext,
          state.orchestration.schemaVersion === 3
        )]
          ? { resumeThreadId: state.agentSessionIds[collaborationSessionKey(
              lockedBaseRequest.agent,
              lockedBaseRequest.executionContext,
              state.orchestration.schemaVersion === 3
            )] }
          : {})
      };
      // The base callbacks capture its first invocation. Every turn gets a
      // clean callback set so usage/session/trace/UI events are attributed to
      // the turn invocation supplied by the stable resident front door.
      delete request.onThreadStarted;
      delete request.onSessionStarted;
      delete request.onDurableSessionStarted;
      delete request.onControlResult;
      delete request.onPendingControlResults;
      delete request.onPendingWorkflowAdjustments;
      delete request.onModelActivity;
      delete request.onOfficialHarnessEvent;
      delete request.onNativeUserInput;
      delete request.onTokenUsage;
      delete request.onTokenUsagePersistenceFailure;
      delete request.onModelStreamEvent;
      delete request.onLiveHarnessEvent;
      delete request.onHarnessRecovery;
      delete request.onHarnessRecoveryWait;
      delete request.onResidentTurnActivity;
      delete request.onHarnessAttemptReset;
      await this.attachRuntimeCallbacks(state, request, execution);
      let durableRehydrate: ResidentDurableRehydrateProvenance | undefined;
      if (recovery && !recoveryConsumed) {
        const context = lockedBaseRequest.executionContext;
        const targetEpoch = context?.role === "leader"
          ? context.coordinatorEpoch
          : context?.ownershipEpoch;
        const targetScopeId = context?.role === "leader"
          ? ("routeScopeId" in context ? context.routeScopeId : context.groupRunId)
          : context?.executionId;
        if (!context || targetEpoch === undefined || !targetScopeId ||
          recovery.projectId !== state.id ||
          recovery.sourceNodeRunId !== context.nodeRunId ||
          recovery.scopeId !== targetScopeId ||
          recovery.agentId !== lockedBaseRequest.agent ||
          targetEpoch !== recovery.stoppedEpoch + 1) {
          throw new Error("Resident recovery proof does not match its locked process authority");
        }
        const persistedRecovery = await this.persistResidentRecoverySeed(recovery, {
          projectId: state.id,
          sourceNodeRunId: context.nodeRunId,
          scope: recovery.scope,
          scopeId: targetScopeId,
          agentId: lockedBaseRequest.agent,
          harnessId: state.agents[lockedBaseRequest.agent]!.harness,
          stoppedEpoch: recovery.stoppedEpoch
        });
        const existing = await this.database().residentRecoveryProofForSeed(
          state.id,
          persistedRecovery.seedId
        );
        const recorded = (await this.database().recordResidentRecoveryProof(
          existing ?? bindResidentRecoveryProof({
            seed: persistedRecovery,
            newInvocationId: turn.invocationId,
            routeEpoch: targetEpoch,
            inputId: turn.inputId,
            createdAt: new Date().toISOString()
          })
        )).proof;
        const consumed = (await this.database().consumeResidentRecoveryProof({
          projectId: state.id,
          proofId: recorded.proofId,
          seedId: recorded.seedId,
          sourceNodeRunId: context.nodeRunId,
          scopeId: targetScopeId,
          agentId: lockedBaseRequest.agent,
          newInvocationId: turn.invocationId,
          routeEpoch: targetEpoch,
          inputId: turn.inputId
        })).proof;
        recoveryConsumed = true;
        durableRehydrate = consumed.durableRehydrate;
      }
      return {
        request,
        onTrace: this.traceSink(state, request.agent, turn.invocationId),
        ...(durableRehydrate ? { durableRehydrate } : {})
      };
    };
  }

  private async persistResidentRecoverySeed(
    input: ResidentRecoveryProofSeed,
    expected: Pick<ResidentRecoveryProofSeed,
      | "projectId"
      | "sourceNodeRunId"
      | "scope"
      | "scopeId"
      | "agentId"
      | "stoppedEpoch">
    & { harnessId?: string }
  ): Promise<ResidentRecoveryProofSeed> {
    const recovery = assertResidentRecoveryProofSeed(input);
    if (
      recovery.projectId !== expected.projectId ||
      recovery.sourceNodeRunId !== expected.sourceNodeRunId ||
      recovery.scope !== expected.scope ||
      recovery.scopeId !== expected.scopeId ||
      recovery.agentId !== expected.agentId ||
      recovery.stoppedEpoch !== expected.stoppedEpoch ||
      !expected.harnessId ||
      recovery.oldSession.harnessId !== expected.harnessId
    ) {
      throw new Error("Resident recovery observation does not match its stopped authority");
    }
    return (await this.database().recordResidentRecoverySeed(recovery)).seed;
  }

  private traceSink(state: ProjectState, agent: string, invocationId: string): TraceSink {
    const sink: TraceSink = this.#invocationDispatcher
      ? this.#invocationDispatcher.trace({ state, agentId: agent, invocationId })
      : async (kind, message, data) => {
        await this.#storage.appendTrace(state, agent, invocationId, kind, message);
        await this.appendEvent(state, { type: "agent.trace", level: kind === "stderr" ? "warning" : "info",
          agent, message, invocationId, data: { resident: true, traceKind: kind, ...(data ?? {}) } });
      };
    return async (kind, message, data) => {
      await sink(kind, message, data);
      if (data?.late !== true || data.foreignSystemMessage !== true) return;
      const source = { sourceAgentId: agent, sourceInvocationId: invocationId,
        inputId: data.inputId, message: redactTrace(message), recipient: "main" };
      await this.database().appendEvent({ projectId: state.id, agentId: agent, invocationId,
        requestId: `late-system-message:${createHash("sha256").update(JSON.stringify(source)).digest("hex")}`,
        type: "native.system_message.late", payload: source });
    };
  }

  private async mainHead(state: ProjectState): Promise<string> {
    const retained = this.#mainHeads.get(state.id);
    if (retained) return retained;
    const projection = await this.database().projectState(state.id);
    const mergedOperationHead = projection.operations
      .filter((item) =>
        item.kind === "pull.merge" && item.status === "finalized" &&
        item.expectedBase === "main" &&
        typeof item.remoteFact?.mergeCommitSha === "string" &&
        /^[a-f0-9]{40}$/u.test(item.remoteFact.mergeCommitSha)
      )
      .at(-1)?.remoteFact?.mergeCommitSha;
    if (typeof mergedOperationHead === "string") {
      this.#mainHeads.set(state.id, mergedOperationHead);
      return mergedOperationHead;
    }
    const mergedPullHead = [...projection.pullRequests, ...(projection.additionalPullRequests ?? [])]
      .sort((left, right) => left.observedAt.localeCompare(right.observedAt))
      .filter((pull) =>
        pull.base === "main" && pull.status === "merged" &&
        typeof pull.mergeCommitSha === "string" && /^[a-f0-9]{40}$/u.test(pull.mergeCommitSha)
      )
      .at(-1)?.mergeCommitSha;
    if (mergedPullHead) {
      this.#mainHeads.set(state.id, mergedPullHead);
      return mergedPullHead;
    }
    const operation = projection.operations.find((item) =>
      item.kind === "git.push" && item.status === "finalized" &&
      item.expectedBase === "main" && typeof item.expectedHead === "string"
    );
    if (!operation?.expectedHead || !/^[a-f0-9]{40}$/u.test(operation.expectedHead)) {
      throw new Error("Finalized main initialization head is unavailable");
    }
    this.#mainHeads.set(state.id, operation.expectedHead);
    return operation.expectedHead;
  }

  private async refreshMainHeadFromRemote(state: ProjectState): Promise<void> {
    const git = await this.git(state.id);
    if (!git.observeRemoteRef) return;
    const observed = await git.observeRemoteRef(this.repository(state), "main");
    if (observed.status !== "present" || !observed.sha) {
      throw new Error("Remote main ref is unavailable during collaboration recovery");
    }
    this.#mainHeads.set(state.id, observed.sha);
    this.#branchHeads.set(`${state.id}:main`, observed.sha);
  }

  private async branchHead(state: ProjectState, branch: string): Promise<string> {
    const key = `${state.id}:${branch}`;
    const retained = this.#branchHeads.get(key);
    if (retained) return retained;
    const projection = await this.database().projectState(state.id);
    const recordedMerge = projection.operations.filter(item => item.kind === "pull.merge" && item.status === "finalized"
      && item.expectedBase === branch && typeof item.remoteFact?.mergeCommitSha === "string"
      && /^[a-f0-9]{40}$/u.test(item.remoteFact.mergeCommitSha)).at(-1)?.remoteFact?.mergeCommitSha;
    const merged = [...projection.pullRequests, ...(projection.additionalPullRequests ?? [])]
      .sort((left, right) => left.observedAt.localeCompare(right.observedAt))
      .filter((pull) => pull.base === branch && pull.status === "merged" && pull.mergeCommitSha)
      .at(-1)?.mergeCommitSha;
    const initial = branch === "main"
      ? (await this.mainHead(state))
      : (await this.database().projectState(state.id)).groupRuns
          .find((group) => group.groupBranch === branch)?.baseCommit;
    const head = typeof recordedMerge === "string" ? recordedMerge : merged ?? initial;
    if (!head) throw new Error(`Authoritative head for ${branch} is unavailable`);
    this.#branchHeads.set(key, head);
    return head;
  }

  private async standaloneGitFacts(state: ProjectState, execution: MemberExecution): Promise<AgentGitFacts> {
    const key = `${state.id}:${execution.id}:${execution.ownershipEpoch}`;
    let facts = this.#agentGitFacts.get(key);
    if (!facts) {
      facts = (await this.database().latestAgentGitFacts(state.id, execution.id, execution.ownershipEpoch)) ?? {};
      this.#agentGitFacts.set(key, facts);
    }
    return facts;
  }

  /** Only mechanism checks belong here. Wake the original Agent to supply
   * missing actions; never push, create/merge a PR or resolve its conflicts. */
  private async latestFailureNotice(state: ProjectState, authority?: RuntimeActivityAuthority): Promise<string> {
    const attempts = (await this.database().failureAttempts(state.id)).filter(item =>
      (!authority || (!item.agentId || item.agentId === authority.agentId) &&
        (!item.executionId || !authority.executionId || item.executionId === authority.executionId)));
    const latest = new Map<string, FailureAttempt>();
    for (const attempt of attempts) { const key = `${attempt.scope}\0${attempt.operation}`; latest.delete(key); latest.set(key, attempt); }
    const failure = [...latest.values()].filter(item => item.status === "failed").at(-1);
    if (!failure) return "";
    return `Latest recorded failure for this retained task (historical evidence, not a new tool result): ${JSON.stringify({
      attemptId: failure.attemptId, operation: failure.operation, code: failure.errorCode,
      reason: boundedSharedText(failure.redactedMessage, 1800), retryableWithoutChangedConditions: failure.retryable,
      invocationId: failure.invocationId, ...(typeof failure.metadata.diagnosticRef === "string"
        ? { diagnosticRef: boundedSharedText(failure.metadata.diagnosticRef, 500) } : {})
    })}. Inspect current tool results and correct the specific condition in the original Session. Confirmed effects stay completed; observe any unknown remote result before retrying it. Read further evidence on demand.`;
  }

  private async completeAgentOwnedExecution(state: ProjectState, execution: MemberExecution,
    output: string, resident: CollaborationResidentHandle, signal: AbortSignal, base: string,
    routeDecision?: { targetNodeId: string; decisionRequestId: string }, retainedPull?: PullRequestRecord): Promise<{
      output: string; routeDecision?: { targetNodeId: string; decisionRequestId: string }
    }> {
    const current = (await this.database().projectState(state.id)).executions.find(item => item.id === execution.id);
    if (current?.status === "succeeded") return { output: current.output ?? output, routeDecision };
    let repairInvocationId: string | undefined;
    const supervision = await superviseTask<AgentRunResult>({
      key: `${state.id}:${execution.id}`, value: { handoff: output }, signal,
      inspect: async () => {
        const facts = await this.standaloneGitFacts(state, execution);
        const synchronized = agentGitFactsSynchronized(facts, base);
        const delivery = agentGitDeliveryStatus({ executionId: execution.id, ownershipEpoch: execution.ownershipEpoch,
          headSha: facts.pushedHeadSha, pull: facts.pullRequest, synchronized,
          operations: (await this.database().projectState(state.id)).operations });
        const missing = [!state.taskCompletions?.[execution.id] && "finish_task",
          ...delivery.missingActions.map(action => action === "git_push" && retainedPull
            ? `Observe the retained PR #${retainedPull.providerNumber} and finish its original delivery` : action),
        ...await executionWorktreeClosingActions((await this.git(state.id)), execution, signal),
        ...await resident.supervisionActions?.() ?? []].filter(Boolean) as string[];
        try {
          if (facts.merged) await this.commitMergedExecutionArtifacts(state, execution, pullRequestRecord(facts.merged));
          else await this.commitUnchangedMergedArtifactIntents(state, execution, base);
        } catch (error) {
          if (!(error instanceof ExecutionArtifactPublicationError)) throw error;
          missing.push(`Pending publication ${error.artifactPath} at ${error.commitSha}: ${error.message}. Inspect the file and correct your publication intent with publish_artifact and replacesPath if appropriate.`);
        }
        return missing;
      },
      reserve: async missing => {
        await this.waitWhilePaused(state.id, signal);
        signal.throwIfAborted();
        if (this.#shuttingDown || this.#cancellingProjects.has(state.id)) throw new Error("Task supervision was cancelled");
        if (resident.closed) throw new Error("The original resident session is closed; no additional wakeup was sent");
        repairInvocationId = newId("inv");
        return await this.database().reserveExecutionSupervisionRepair({ projectId: state.id, executionId: execution.id,
          ownershipEpoch: execution.ownershipEpoch, invocationId: repairInvocationId, missing });
      },
      invoke: async (attempt, missing) => this.submitResident(state, resident, signal, {
        inputId: `execution-supervision:${execution.id}:${attempt}`, invocationId: repairInvocationId!,
        prompt: `Continue the original task in this session and directory. Current remaining facts: ${missing.join("; ")}. Inspect the available tool results and do what you can to correct these omissions. Preserve confirmed operations and the existing PR; do not repeat a successful merge. Return the available result and the actual remaining limitations if you cannot finish. Existing task and Git evidence: ${JSON.stringify({
          ...(await this.standaloneGitFacts(state, execution)), worktreePath: execution.worktreePath,
          taskInstructions: (await this.database().projectState(state.id)).tasks.find(task => task.id === execution.taskId)?.assignment })}.`
      }, (await this.executionActivityAuthority(state.id, execution))),
      accept: async result => {
        await this.database().appendEvent({ projectId: state.id, executionId: execution.id,
          ownershipEpoch: execution.ownershipEpoch, agentId: execution.agentId, invocationId: repairInvocationId,
          requestId: `execution-supervision-returned:${repairInvocationId}`, type: "execution.supervision.returned", payload: {} });
        await this.persistArtifactPublicationIntents(state, execution, result);
        routeDecision = (await this.persistStandaloneRouteDecision(state, execution, result)) ?? routeDecision;
      },
      record: async (outcome, missing, reason) => {
        await this.database().appendEvent({ projectId: state.id, executionId: execution.id,
          ownershipEpoch: execution.ownershipEpoch, agentId: execution.agentId,
          requestId: `execution-supervision-result:${execution.id}:${outcome}`, type: "execution.supervision.finished",
          payload: { outcome, missing, ...(reason ? { reason } : {}) } });
      }
    });
    output = supervisionHandoff(supervision.value.handoff ?? output, supervision);
    const nativeStopConfirmed = await this.closeResidentForTerminal(state, execution.id, resident);
    const postStop = await nextTaskRepair({ key: `${state.id}:${execution.id}:retirement`, signal,
      inspect: async () => executionWorktreeClosingActions((await this.git(state.id)), execution, signal), reserve: () => undefined,
      record: async (outcome, missing, reason) => {
        if (outcome === "resolved") return;
        await this.database().appendEvent({ projectId: state.id, executionId: execution.id, agentId: execution.agentId, ownershipEpoch: execution.ownershipEpoch,
          type: "execution.supervision.finished", payload: { outcome: outcome === "exhausted" ? "unavailable" : outcome,
            missing, nativeStopConfirmed, source: "session_retirement", ...(reason ? { reason } : {}) } });
      }
    });
    if ("outcome" in postStop && postStop.outcome !== "resolved") output = supervisionHandoff(output,
      { remaining: postStop.remaining, outcome: postStop.outcome === "exhausted" ? "unavailable" : postStop.outcome });
    await this.database().completeExecution({ projectId: state.id, executionId: execution.id,
      ownershipEpoch: execution.ownershipEpoch, output, requestId: `complete-${executionEpochIdentity(execution)}` });
    return { output, routeDecision };
  }

  private async integrateAgentOwnedStandalone(
    state: ProjectState, execution: MemberExecution, output: string,
    resident: CollaborationResidentHandle, signal: AbortSignal,
    routeDecision?: { targetNodeId: string; decisionRequestId: string }, retainedPull?: PullRequestRecord
  ): Promise<StandaloneIntegrationOutcome> {
    const completed = await this.completeAgentOwnedExecution(state, execution, output, resident, signal,
      "main", routeDecision, retainedPull);
    return this.completeStandaloneRoute(state, execution, completed.output, signal, completed.routeDecision);
  }

  private async integrateStandalone(
    state: ProjectState, execution: MemberExecution, output: string,
    resident: CollaborationResidentHandle, signal: AbortSignal,
    routeDecision?: { targetNodeId: string; decisionRequestId: string }
  ): Promise<StandaloneIntegrationOutcome> {
    return this.integrateAgentOwnedStandalone(state, execution, output, resident, signal, routeDecision);
  }

  private async completeStandaloneRoute(
    state: ProjectState,
    execution: MemberExecution,
    output: string,
    signal: AbortSignal,
    suppliedRouteDecision?: { targetNodeId: string; decisionRequestId: string }
  ): Promise<StandaloneIntegrationOutcome> {
    const database = this.database();
    const projection = await database.projectState(state.id);
    const node = projection.nodeRuns.find((item) => item.id === execution.nodeRunId);
    if (!node) throw new Error("Standalone node disappeared during completion");
    const routeEmissionId = `route-${node.id}`;
    const persistedOutbox = projection.routeOutbox.find((item) => item.routeEmissionId === routeEmissionId);
    const edges = workflowRoutesForAgent(state.orchestration, node.node.nodeId);
    const strong = edges.filter((edge) => edge.kind === "strong");
    let target: string;
    let route: Parameters<CollaborationStateDatabase["completeStandaloneNode"]>[0]["route"];
    let loopTransition: StandaloneLoopTransition | undefined;
    let completionOutput = output;
    if (persistedOutbox) {
      target = persistedOutbox.targetNodeId;
      completionOutput = typeof persistedOutbox.payload.output === "string"
        ? persistedOutbox.payload.output
        : output;
      route = persistedOutbox.decisionKind === "weak"
        ? {
            kind: "weak",
            targetNodeId: target,
            selectedByAgentId: persistedOutbox.selectedByAgentId ?? "main",
            decisionRequestId: persistedOutbox.decisionRequestId ?? `recovered-${routeEmissionId}`
          }
        : { kind: "fixed", targetNodeId: target };
      const rawLoop = persistedOutbox.payload.loopTransition;
      if (rawLoop && typeof rawLoop === "object") {
        const candidate = rawLoop as Partial<StandaloneLoopTransition>;
        const iterations = candidate.iterations;
        const batch = candidate.batch;
        const totalIterations = candidate.totalIterations;
        if (typeof candidate.id === "string" &&
          typeof iterations === "number" && Number.isSafeInteger(iterations) && iterations >= 0 &&
          typeof batch === "number" && Number.isSafeInteger(batch) && batch >= 0 &&
          typeof totalIterations === "number" && Number.isSafeInteger(totalIterations) && totalIterations >= 0 &&
          typeof candidate.exhausted === "boolean") {
          loopTransition = { id: candidate.id, iterations, batch, totalIterations, exhausted: candidate.exhausted };
        }
      }
    } else if (state.orchestration.loops?.some((loop) => loop.from === node.node.nodeId)) {
      // A finite root Loop is a graph-level transition. It takes precedence
      // over the source node's configured edge and is recorded with the route
      // so a restart consumes the same decision rather than counting again.
      const loop = state.orchestration.loops.find((entry) => entry.from === node.node.nodeId)!;
      const iterations = loopIterationCount(state.loopIterations, loop.id);
      const alreadyExhausted = iterations >= loop.maxIterations;
      const nextIterations = alreadyExhausted ? iterations : iterations + 1;
      const exhausted = alreadyExhausted || nextIterations >= loop.maxIterations;
      const batch = loopIterationCount(state.loopBatches, loop.id) +
        (iterations === 0 && !alreadyExhausted ? 1 : 0);
      const totalIterations = loopIterationCount(state.loopTotalIterations, loop.id) +
        (alreadyExhausted ? 0 : 1);
      loopTransition = {
        id: loop.id,
        iterations: nextIterations,
        batch,
        totalIterations,
        exhausted
      };
      target = exhausted ? loop.exitTo : loop.to;
      route = { kind: "fixed", targetNodeId: target };
    } else if (strong.length === 1 && edges.length === 1) {
      target = strong[0].target;
      route = { kind: "fixed", targetNodeId: target };
    } else if (this.workerRouteCandidates(state, execution.agentId).length > 0 && (
      suppliedRouteDecision ?? (await this.persistedStandaloneRouteDecision(state.id, execution))
    )) {
      const persisted = suppliedRouteDecision ?? (await this.persistedStandaloneRouteDecision(
        state.id,
        execution
      ));
      const candidates = this.workerRouteCandidates(state, execution.agentId);
      if (!persisted || !candidates.includes(persisted.targetNodeId)) {
        throw new Error("Agent-owned weak route has an invalid fenced route_to_agent decision");
      }
      target = persisted.targetNodeId;
      route = {
        kind: "weak",
        targetNodeId: target,
        selectedByAgentId: execution.agentId,
        decisionRequestId: persisted.decisionRequestId
      };
    } else {
      const routeAttemptStartedAt = nowIso();
      const routeAttemptOperation = `main-route.decision:${node.id}`;
      const decision = await this.decideMainRoute(
        state,
        node.id,
        execution.agentId,
        output,
        edges.map((edge) => edge.target),
        signal
      );
      if (decision?.intervention) {
        await this.appendSuccessfulAttempt(state, {
          scope: "scheduler",
          operation: routeAttemptOperation,
          startedAt: routeAttemptStartedAt,
          message: "A later Main route decision attempt succeeded",
          agentId: "main",
          nodeRunId: node.id,
          taskId: execution.taskId,
          executionId: execution.id,
          ...(execution.invocationId ? { invocationId: execution.invocationId } : {}),
          ownershipEpoch: execution.ownershipEpoch,
          metadata: { sourceAgentId: execution.agentId, outcome: "user_intervention" }
        });
        await this.pauseForMainIntervention(
          state,
          node.id,
          decision.decisionRequestId,
          decision.intervention
        );
        return { terminal: true };
      }
      if (!decision || !edges.some((edge) => edge.target === decision.targetNodeId)) {
        await this.appendFailureAttempt(state, {
          scope: "scheduler",
          operation: routeAttemptOperation,
          error: new Error("Merged execution awaits a fenced Main route decision"),
          errorCode: decision
            ? "MAIN_ROUTE_DECISION_INVALID"
            : "MAIN_ROUTE_DECISION_MISSING",
          retryable: true,
          startedAt: routeAttemptStartedAt,
          agentId: "main",
          nodeRunId: node.id,
          taskId: execution.taskId,
          executionId: execution.id,
          ...(execution.invocationId ? { invocationId: execution.invocationId } : {}),
          ownershipEpoch: execution.ownershipEpoch,
          metadata: {
            sourceAgentId: execution.agentId,
            candidates: edges.map((edge) => edge.target),
            ...(decision ? { selectedTarget: decision.targetNodeId } : {})
          }
        });
        state.status = "running";
        state.phase = "collaboration:main-route-required";
        state.lastError = "Merged execution awaits a fenced Main route decision";
        await this.publishProjection(state, (await database.projectState(state.id)));
        await this.saveState(state);
        return { terminal: true };
      }
      await this.appendSuccessfulAttempt(state, {
        scope: "scheduler",
        operation: routeAttemptOperation,
        startedAt: routeAttemptStartedAt,
        message: "A later Main route decision attempt succeeded",
        agentId: "main",
        nodeRunId: node.id,
        taskId: execution.taskId,
        executionId: execution.id,
        ...(execution.invocationId ? { invocationId: execution.invocationId } : {}),
        ownershipEpoch: execution.ownershipEpoch,
        metadata: { sourceAgentId: execution.agentId, selectedTarget: decision.targetNodeId }
      });
      target = decision.targetNodeId;
      route = {
        kind: "weak",
        targetNodeId: target,
        selectedByAgentId: "main",
        decisionRequestId: decision.decisionRequestId
      };
    }
    await database.completeStandaloneNode({
      projectId: state.id,
      nodeRunId: node.id,
      executionId: execution.id,
      ownershipEpoch: execution.ownershipEpoch,
      output: completionOutput,
      routeEmissionId,
      route,
      ...(loopTransition ? { loopTransition } : {}),
      requestId: `node-complete-${node.id}`
    });
    if (loopTransition) {
      state.loopIterations = {
        ...(state.loopIterations ?? {}),
        [loopTransition.id]: loopTransition.iterations
      };
      state.loopBatches = {
        ...(state.loopBatches ?? {}),
        [loopTransition.id]: loopTransition.batch
      };
      state.loopTotalIterations = {
        ...(state.loopTotalIterations ?? {}),
        [loopTransition.id]: loopTransition.totalIterations
      };
      await this.saveState(state);
    }
    await this.publishProjection(state, (await database.projectState(state.id)));
    if (target === "finish") {
      // deliverRoute first persists the terminal downstream-activation fact in
      // the authoritative database. The legacy completed flag is only its
      // read-model projection and must never be the consumption authority.
      await database.deliverRoute({
        projectId: state.id,
        routeEmissionId,
        activationRequestId: `finish-${routeEmissionId}`
      });
      await this.publishProjection(state, (await database.projectState(state.id)));
      state.status = "completed";
      state.phase = "completed";
      state.completedAt = new Date().toISOString();
      state.lastError = undefined;
      await this.saveState(state);
      return { terminal: true };
    }
    return {
      terminal: true,
      next: {
        target,
        routeEmissionId,
        output: completionOutput,
        sourceNodeRunId: node.id,
        sourceAgentId: execution.agentId,
        routeKind: route.kind,
        ...(route.kind === "weak" ? { selectedByAgentId: route.selectedByAgentId } : {})
      }
    };
  }

  private async recoverIndependentMainRoute(
    state: ProjectState,
    projection: CredentialFreeProjectStateProjection,
    explicitUserResume: boolean
  ): Promise<IndependentMainRouteRecovery> {
    const attemptStartedAt = nowIso();
    const sourceNodeRunId = projection.activeNodeRunId;
    if (!sourceNodeRunId) {
      await this.appendFailureAttempt(state, {
        scope: "scheduler",
        operation: "main-route.recovery",
        error: new Error("Frozen independent Main has no active node authority"),
        errorCode: "MAIN_ROUTE_AUTHORITY_MISSING",
        retryable: false,
        startedAt: attemptStartedAt,
        agentId: "main",
        metadata: { stateRevision: projection.stateRevision }
      });
      await this.publishProjection(state, (await this.database().projectState(state.id)));
      state.status = "retrying";
      state.phase = "collaboration:main-recovery-waiting";
      state.lastError = "Frozen independent Main has no active node authority";
      await this.saveState(state);
      return { recovered: false };
    }
    const routeEpoch = Math.max(
      1,
      (await this.database().latestMainRouteAttempt(state.id, sourceNodeRunId))
        ?.coordinatorEpoch ?? 0
    );
    const routeScopeId = `main-route-${sourceNodeRunId}`;
    const runtimePath = this.mainRouteRuntimePath(state.id, sourceNodeRunId);
    const observation = await this.#residentLauncher?.observeMainRouteRecovery?.({
      state: structuredClone(state),
      sourceNodeRunId,
      routeScopeId,
      routeEpoch,
      executionRuntimePath: runtimePath
    });
    const recovery = observation?.stopped && observation.recovery
      ? (await this.persistResidentRecoverySeed(observation.recovery, {
          projectId: state.id,
          sourceNodeRunId,
          scope: "main-route",
          scopeId: routeScopeId,
          agentId: "main",
          harnessId: state.agents.main!.harness,
          stoppedEpoch: routeEpoch
        }))
      : undefined;
    const recovered = await this.database().recoverMainRoute({
      projectId: state.id,
      nodeRunId: sourceNodeRunId,
      routeEpoch,
      priorProcessStopped: observation?.stopped === true,
      explicitUserResume,
      requestId: `recover-main-route-${sourceNodeRunId}-${routeEpoch}-${projection.stateRevision}`
    });
    if (recovered.recovered) {
      // Reopening an owner proves transport recovery, not a successful Main
      // decision. Resolve its failure ledger at the actual decision commit.
    } else {
      await this.appendFailureAttempt(state, {
        scope: "scheduler",
        operation: `main-route.recovery:${sourceNodeRunId}`,
        error: new Error(observation?.stopped === true
          ? "Main state changed while its prior process was stopped"
          : "Main prior process stop could not be proven"),
        errorCode: recovered.waitingForUser
          ? "MAIN_ROUTE_RECOVERY_WAITING_FOR_USER"
          : "MAIN_ROUTE_RECOVERY_RETRYABLE",
        retryable: !recovered.waitingForUser,
        startedAt: attemptStartedAt,
        agentId: "main",
        nodeRunId: sourceNodeRunId,
        coordinatorEpoch: routeEpoch,
        metadata: { priorProcessStopped: observation?.stopped === true }
      });
    }
    await this.publishProjection(state, (await this.database().projectState(state.id)));
    if (!recovered.recovered) {
      state.status = "retrying";
      state.phase = recovered.waitingForUser
        ? "collaboration:main-recovery-waiting"
        : "collaboration:main-recovery-retryable";
      state.lastError = observation?.stopped === true
        ? "Main state changed while its prior process was stopped"
        : "Main prior process stop could not be proven";
      await this.saveState(state);
      return { recovered: false };
    }
    return { recovered: true, ...(recovery ? { recovery } : {}) };
  }

  private mainRouteRuntimePath(projectId: string, sourceNodeRunId: string): string {
    return path.join(
      this.#storage.projectDir(projectId),
      "runtime",
      "collaboration-main-route",
      createHash("sha256").update(sourceNodeRunId).digest("hex").slice(0, 24)
    );
  }

  private async freezeAndRecoverIndependentMainRoute(input: {
    state: ProjectState;
    sourceNodeRunId: string;
    routeScopeId: string;
    routeEpoch: number;
    runtimePath: string;
    error: unknown;
  }): Promise<IndependentMainRouteRecovery> {
    const attemptStartedAt = nowIso();
    const failure = safeRuntimeError(input.error);
    await this.appendFailureAttempt(input.state, {
      scope: "resident",
      operation: `main-route:${input.sourceNodeRunId}`,
      error: input.error,
      startedAt: attemptStartedAt,
      agentId: "main",
      nodeRunId: input.sourceNodeRunId,
      coordinatorEpoch: input.routeEpoch,
      metadata: { routeScopeId: input.routeScopeId }
    });
    const frozen = await this.database().freezeMainRouteFailure({
      projectId: input.state.id,
      nodeRunId: input.sourceNodeRunId,
      routeEpoch: input.routeEpoch,
      error: failure,
      requestId: `freeze-main-route-${input.sourceNodeRunId}-${input.routeEpoch}`
    });
    await this.publishProjection(
      input.state,
      (await this.database().projectState(input.state.id))
    );
    // The old lifetime cap is now a cadence boundary. Yield the native
    // recovery recursion to the durable scheduler after the fast attempts;
    // the next round still observes exact Stop before opening a new owner.
    if (frozen.attempt >= frozen.limit) {
      input.state.status = "retrying";
      input.state.phase = "collaboration:main-recovery-waiting";
      input.state.lastError = failure;
      await this.saveState(input.state);
      return { recovered: false };
    }
    const observation = await this.#residentLauncher?.observeMainRouteRecovery?.({
      state: structuredClone(input.state),
      sourceNodeRunId: input.sourceNodeRunId,
      routeScopeId: input.routeScopeId,
      routeEpoch: input.routeEpoch,
      executionRuntimePath: input.runtimePath
    });
    const recovery = observation?.stopped && observation.recovery
      ? (await this.persistResidentRecoverySeed(observation.recovery, {
          projectId: input.state.id,
          sourceNodeRunId: input.sourceNodeRunId,
          scope: "main-route",
          scopeId: input.routeScopeId,
          agentId: "main",
          harnessId: input.state.agents.main!.harness,
          stoppedEpoch: input.routeEpoch
        }))
      : undefined;
    const recovered = await this.database().recoverMainRoute({
      projectId: input.state.id,
      nodeRunId: input.sourceNodeRunId,
      routeEpoch: input.routeEpoch,
      priorProcessStopped: observation?.stopped === true,
      requestId: `auto-recover-main-route-${input.sourceNodeRunId}-${input.routeEpoch}`
    });
    await this.publishProjection(
      input.state,
      (await this.database().projectState(input.state.id))
    );
    if (!recovered.recovered) {
      input.state.status = "retrying";
      input.state.phase = recovered.waitingForUser
        ? "collaboration:main-recovery-waiting"
        : "collaboration:main-recovery-retryable";
      input.state.lastError = observation?.stopped === true
        ? "Main state changed while its prior process was stopped"
        : `Main failed and its prior process stop is unconfirmed: ${failure}`;
      await this.saveState(input.state);
      return { recovered: false };
    }
    // The reopened transport is recorded by main.route.recovered. A recovery
    // success in the failure ledger requires the actual formal decision.
    await this.publishProjection(
      input.state,
      (await this.database().projectState(input.state.id))
    );
    return { recovered: true, ...(recovery ? { recovery } : {}) };
  }

  private async ensureAcceptedMainRouteConsumable(input: {
    state: ProjectState;
    sourceNodeRunId: string;
    routeScopeId: string;
    fact: AcceptedMainRouteAction;
    semanticInputHash: string;
  }): Promise<void> {
    if (this.#locallyAcceptedMainRoutes.has(input.semanticInputHash)) return;
    if ((await this.database().mainRouteHasConfirmedRecovery(input.state.id, input.sourceNodeRunId, input.fact.routeEpoch))) {
      this.#locallyAcceptedMainRoutes.add(input.semanticInputHash);
      return;
    }
    const recovered = await this.freezeAndRecoverIndependentMainRoute({
      state: input.state,
      sourceNodeRunId: input.sourceNodeRunId,
      routeScopeId: input.routeScopeId,
      routeEpoch: input.fact.routeEpoch,
      runtimePath: this.mainRouteRuntimePath(input.state.id, input.sourceNodeRunId),
      error: new Error("Accepted Main route response was lost before local completion")
    });
    if (!recovered.recovered) {
      throw new MainRouteRecoveryRequiredError(
        "Accepted Main route remains fenced until its prior process stop is proven"
      );
    }
    this.#locallyAcceptedMainRoutes.add(input.semanticInputHash);
  }

  private async restoreReceivedRootMainInputs(state: ProjectState): Promise<void> {
    for (const input of state.userInputs.filter(entry => entry.status === "pending")) {
      const received = await this.database().eventByRequestId(state.id, `main-route-user-input-received:${input.id}`);
      if (!received) continue;
      if (received.type !== "user.input.delivered" || received.agentId !== "main" || received.payload.inputId !== input.id ||
        received.payload.messageDigest !== createHash("sha256").update(input.message).digest("hex") ||
        typeof received.invocationId !== "string") {
        throw new Error("Received root Main input lost its immutable original binding");
      }
      input.status = "delivered";
      input.deliveredAt = received.ts;
      input.deliveredInvocationId = received.invocationId;
    }
  }

  private attachRootMainInputReception(state: ProjectState, request: AgentRunRequest,
    pendingInputs: Array<ProjectUserInput & { text: string }>): void {
    const context = request.executionContext;
    if (!pendingInputs.length || context?.role !== "leader" || !("routeScopeId" in context)) return;
    const priorNativeInput = request.onNativeUserInput;
    request.onNativeUserInput = async (event, session) => {
      await priorNativeInput?.(event, session);
      const binding = await this.database().latestAgentNativeSessionBinding(state.id, "main");
      if (!session || !binding || event.kind !== "user.message" || event.invocationId !== request.invocationId ||
        event.harnessId !== session.harnessId || typeof event.eventId !== "string" || !event.eventId ||
        typeof event.message !== "string" || binding.invocationId !== request.invocationId ||
        binding.runtimePath !== request.runtimePath || binding.worktreePath !== request.workspacePath ||
        !isDeepStrictEqual(binding.executionContext, context) || !sameDurableSession(binding.session, session) ||
        (await this.database().latestMainRouteAttempt(state.id, context.nodeRunId))?.coordinatorEpoch !== context.coordinatorEpoch) return;
      this.assertWritable();
      for (const input of pendingInputs) {
        if (!event.message.includes(redactTrace(input.text))) continue;
        const requestId = `main-route-user-input-received:${input.id}`;
        if ((await this.database().eventByRequestId(state.id, requestId))) continue;
        await this.database().appendEvent({ projectId: state.id, agentId: "main", nodeRunId: context.nodeRunId,
          invocationId: request.invocationId, coordinatorEpoch: context.coordinatorEpoch, requestId,
          type: "user.input.delivered", payload: { inputId: input.id,
            messageDigest: createHash("sha256").update(input.message).digest("hex"), eventId: event.eventId,
            sourceType: event.sourceType, session } });
      }
      await this.restoreReceivedRootMainInputs(state);
      await this.saveState(state);
    };
  }

  private async decideMainRoute(
    state: ProjectState,
    sourceNodeRunId: string,
    sourceAgentId: string,
    output: string,
    candidates: readonly string[],
    signal: AbortSignal
  ): Promise<{
    targetNodeId: string;
    decisionRequestId: string;
    output?: string;
    intervention?: Extract<ControlAction, { tool: "request_user" }>;
    decisionAction?: Extract<ControlAction,
      { tool: "route_to_agent" | "request_user" | "apply_workflow" | "complete_project" }>;
    controlActions?: ControlActionEnvelope[];
    acceptedActions?: AcceptedMainRouteAction[];
  } | undefined> {
    const decideRoute = this.#residentLauncher?.decideRoute;
    if (!decideRoute) return undefined;
    const previousWorkflowRevision = state.workflowRevision;
    await this.applyWaitingWorkflowAdjustments(state);
    const adjustment = await this.database().rootMainWorkflowAdjustmentAdmission(state.id, sourceNodeRunId);
    if (adjustment) throw new CollaborationStateError("WORKFLOW_ADJUSTMENT_PENDING", `等待用户修改在下一管理任务前重新评估：${adjustment.requestId}`,
      { projectId: state.id, requestId: adjustment.requestId });
    const routeScopeId = `main-route-${sourceNodeRunId}`;
    const sourceNode = (await this.database().projectState(state.id)).nodeRuns
      .find((nodeRun) => nodeRun.id === sourceNodeRunId);
    const sourceIsMain = sourceNode?.node.kind === "agent" &&
      sourceNode.node.agentId === "main";
    if (sourceNode && previousWorkflowRevision !== state.workflowRevision) {
      const edges = state.orchestration.routes[sourceNode.node.nodeId] ?? [];
      candidates = sourceIsMain ? [...new Set([...edges.map(edge => edge.target), ...((await this.mainCanComplete(state)) ? ["finish"] : [])])]
        : edges.filter(edge => edge.kind === "weak").map(edge => edge.target);
    }
    // Main still needs its existing request_user coordination capability
    // when a receipt blocks completion and there are no business routes.
    if (candidates.length === 0 && !sourceIsMain) return undefined;
    await this.restoreReceivedRootMainInputs(state);
    const pendingInputs = state.userInputs.filter((input) => input.status === "pending")
      .map(input => ({ ...structuredClone(input), text: projectUserInputText(input) }));
    const answeredIntervention = state.userIntervention?.status === "answered"
      ? state.userIntervention
      : undefined;
    const contextSources = new AgentContextSources();
    contextSources.record("main-route-source-output", "Source Agent handoff for this route", { agentId: sourceAgentId, nodeRunId: sourceNodeRunId, output });
    const reopenedUserInput = sourceIsMain && state.cycle > 1 &&
      sourceNode?.inputSnapshotRef?.startsWith("project:") && pendingInputs.length > 0;
    let assignment = workflowMessagesText([
      ...(!reopenedUserInput ? [{ sender: sourceIsMain ? sourceNode?.sourceAgentId ?? (sourceNode?.inputSnapshotRef?.startsWith("project:") ? "user" : sourceAgentId) : sourceAgentId, body: output }] : []),
      ...pendingInputs.map(input => ({ sender: "user", body: input.message })),
      ...(answeredIntervention ? [{ sender: "user", body: answeredIntervention.response ?? "" }] : [])
    ]);
    const latestAttempt = await this.database().latestMainRouteAttempt(state.id, sourceNodeRunId);
    const priorAccepted = latestAttempt
      ? (await this.database().acceptedMainRouteActions({
          projectId: state.id,
          nodeRunId: sourceNodeRunId,
          ...(typeof latestAttempt.payload.semanticInputHash === "string"
            ? { semanticInputHash: latestAttempt.payload.semanticInputHash } : {})
        }))
      : [];
    const answeredPriorRequest = answeredIntervention && priorAccepted.some((fact) => fact.action.tool === "request_user" && fact.callId === answeredIntervention.requestedInvocationId);
    const retainedAccepted = !answeredPriorRequest ? priorAccepted : [];
    if (retainedAccepted.some((fact) => fact.action.tool !== "select_display")) {
      await this.ensureAcceptedMainRouteConsumable({
        state,
        sourceNodeRunId,
        routeScopeId,
        fact: priorAccepted[0]!,
        semanticInputHash: priorAccepted[0]!.semanticInputHash
      });
      const consumable = await this.database().acceptedMainRouteActions({
        projectId: state.id,
        nodeRunId: sourceNodeRunId,
        semanticInputHash: priorAccepted[0]!.semanticInputHash
      });
      if (!consumable.some((fact) => fact.action.tool !== "select_display")) {
        throw new Error("Accepted Main control sequence disappeared after stop-confirmed recovery");
      }
      if ((await this.mainRouteTaskMayReturn(state.id, sourceNodeRunId, consumable[0]!.routeEpoch, consumable[0]!.inputId))) {
        return this.finishMainRouteDecision({
          state,
          sourceNodeRunId,
          sourceAgentId,
          sourceIsMain,
          workspacePath: "",
          routeEpoch: consumable[0]!.routeEpoch,
          inputId: consumable[0]!.inputId,
          invocationId: consumable[0]!.invocationId,
          answeredIntervention,
          decision: acceptedMainRouteDecision(consumable, output),
          signal
        });
      }
    }
    let newUserRequest = false;
    for (const input of pendingInputs) {
      const queued = await this.database().eventById(state.id,
        `evt_user_input_${createHash("sha256").update(input.id).digest("hex").slice(0, 32)}`);
      if (queued?.type === "user.input.queued" && queued.payload.inputId === input.id &&
        (!latestAttempt || queued.seq > latestAttempt.seq)) { newUserRequest = true; break; }
    }
    // A new explicit User request admits an ordinary Main turn. Re-reading
    // that same queued input cannot renew the ended task's repair allowance.
    if (!newUserRequest && (await this.database().mainRouteControlRepairCount(state.id, sourceNodeRunId)) >= MAX_TASK_REPAIR_WAKEUPS) return undefined;
    const recoverySeed = await this.database().residentRecoverySeed({
      projectId: state.id,
      scope: "main-route",
      scopeId: routeScopeId,
      sourceNodeRunId
    });
    if (latestAttempt && !recoverySeed && !(await this.database().mainRouteAttemptSettled(
      state.id,
      sourceNodeRunId,
      latestAttempt.coordinatorEpoch ?? 0
    ))) {
      const recovered = await this.freezeAndRecoverIndependentMainRoute({
        state,
        sourceNodeRunId,
        routeScopeId,
        routeEpoch: latestAttempt.coordinatorEpoch ?? 0,
        runtimePath: this.mainRouteRuntimePath(state.id, sourceNodeRunId),
        error: new Error("Independent Main response was interrupted before durable commit")
      });
      if (!recovered.recovered) {
        throw new MainRouteRecoveryRequiredError(
          "Interrupted Main route remains fenced until its prior process stop is proven"
        );
      }
      return this.decideMainRoute(
        state,
        sourceNodeRunId,
        sourceAgentId,
        output,
        candidates,
        signal
      );
    }
    try { await this.advanceTerminalPushObservations(state, signal); }
    catch (error) {
      if (!(error instanceof TerminalPushObservationUnresolvedError)) throw error;
      const facts = (await this.database().authoritativeWorkflowFiles(state.id)).currentState;
      contextSources.fields("main-route-receipts", "Original Agent receipt records", { stateRevision: facts.stateRevision,
        terminalPushObservations: facts.terminalPushObservations ?? [],
        terminalPushObservationIssues: facts.terminalPushObservationIssues ?? [],
        terminalPushObservationOperations: facts.terminalPushObservationOperations ?? [] });
      assignment += `\n\n${workflowMessagesText([{ sender: "OpenFARS", body: error.message }])}`;
    }
    const priorAttempt = latestAttempt?.coordinatorEpoch ?? 0;
    const pendingProof = recoverySeed
      ? (await this.database().residentRecoveryProofForSeed(state.id, recoverySeed.seedId))
      : undefined;
    const attempt = pendingProof?.routeEpoch ??
      (recoverySeed ? recoverySeed.stoppedEpoch + 1 : priorAttempt + 1);
    if (recoverySeed && (
      recoverySeed.projectId !== state.id ||
      recoverySeed.scope !== "main-route" ||
      recoverySeed.scopeId !== routeScopeId ||
      recoverySeed.sourceNodeRunId !== sourceNodeRunId ||
      recoverySeed.agentId !== "main" ||
      attempt !== recoverySeed.stoppedEpoch + 1 ||
      priorAttempt > attempt
    )) {
      throw new MainRouteRecoveryRequiredError(
        "Persisted Main recovery proof does not match the next route turn"
      );
    }
    const acceptedIdentity = acceptedMainRouteIdentity(
      state.id,
      sourceNodeRunId,
      `${assignment}\n\nOrdinary turn epoch: ${attempt}`
    );
    const invocationId = pendingProof?.newInvocationId ??
      (recoverySeed
        ? stableRuntimeId("inv", `main-route-recovery:${recoverySeed.seedId}`)
        : newId("inv"));
    const reservedRecovery = recoverySeed && priorAttempt === attempt && latestAttempt?.invocationId === invocationId;
    const turnInputId = pendingProof?.inputId ?? (reservedRecovery && typeof latestAttempt.payload.inputId === "string"
      ? latestAttempt.payload.inputId : undefined) ?? retainedAccepted[0]?.inputId ??
      `input-main-route-${sourceNodeRunId}-${attempt}`;
    // Old attempts predate the workspace anchor. Retain the directory of
    // that actual prior invocation rather than moving its native session.
    const managementWorkspaceName = latestAttempt?.payload.managementWorkspaceName ??
      `management-workspace-${latestAttempt?.invocationId ?? invocationId}`;
    if (typeof managementWorkspaceName !== "string" || !/^management-workspace-[A-Za-z0-9_-]+$/.test(managementWorkspaceName)) {
      throw new Error("Main's retained management workspace identity is invalid");
    }
    // Retain the last durably bound proposal when upgrading old task records;
    // never search old files for a business edit or choose one on Main's behalf.
    const priorTaskClosed = latestAttempt && (await this.database().eventByRequestId(state.id,
      `main-route-response-${sourceNodeRunId}-${latestAttempt.coordinatorEpoch ?? 0}`))?.type === "main.route.response.committed";
    const workflowAuthoringInvocationId = !priorTaskClosed && latestAttempt
      ? latestAttempt.payload.workflowAuthoringInvocationId ?? latestAttempt.invocationId ?? invocationId
      : invocationId;
    if (typeof workflowAuthoringInvocationId !== "string" || !/^[A-Za-z0-9_-]{1,160}$/.test(workflowAuthoringInvocationId)) {
      throw new Error("Main's retained proposal identity is invalid");
    }
    if (reservedRecovery && latestAttempt.payload.semanticInputHash !== acceptedIdentity.semanticInputHash) {
      throw new MainRouteRecoveryRequiredError("Reserved Main recovery input changed; preserve its original invocation and reconcile the current task");
    }
    if (!reservedRecovery) await this.database().appendEvent({
      projectId: state.id,
      eventId: `evt-main-route-${sourceNodeRunId}-${attempt}`,
      requestId: `main-route-${sourceNodeRunId}-${attempt}`,
      workflowRevision: state.workflowRevision ?? 1,
      nodeRunId: sourceNodeRunId,
      agentId: "main",
      invocationId,
      coordinatorEpoch: attempt,
      type: "main.route.attempt",
      payload: { sourceAgentId, candidates: [...candidates], attempt, routeScopeId,
        semanticInputHash: acceptedIdentity.semanticInputHash, inputId: turnInputId, managementWorkspaceName,
        workflowAuthoringInvocationId, ...(recoverySeed ? { recoverySeedId: recoverySeed.seedId } : {}) }
    });
    await this.publishProjection(state, (await this.database().projectState(state.id)));
    const authorityInbox = await this.#storage.writeInbox(
      state,
      "main",
      invocationId,
      assignment
    );
    // The marker path is stable across service restarts so the production
    // launcher can stop-confirm an orphan before opening attempt N+1. The
    // management cwd stays fixed; only its input snapshots change per turn.
    const runtimePath = this.mainRouteRuntimePath(state.id, sourceNodeRunId);
    await fs.mkdir(runtimePath, { recursive: true, mode: 0o700 });
    const inputs = await this.stageLeaderManagementInputs(
      state,
      invocationId,
      authorityInbox,
      runtimePath,
      "main",
      managementWorkspaceName,
      sourceIsMain && state.orchestration.allowMainReconfiguration === true,
      workflowAuthoringInvocationId
    );
    if (sourceIsMain && state.orchestration.allowMainReconfiguration === true && !inputs.workflowAuthoringPath) {
      const current = await this.database().workflowAdjustmentCurrent(state.id, this.workflowAdjustmentSeed(state));
      await ensureMainWorkflowProposalFile(
        inputs.workflowAuthoringPath ?? path.join(inputs.workspacePath, MAIN_WORKFLOW_FILE),
        `${JSON.stringify(mainWorkflowDocument(state.id, current.snapshot.orchestration, current.version), null, 2)}\n`
      );
    }
    const executionContext: NonNullable<AgentRunRequest["executionContext"]> = {
      nodeRunId: sourceNodeRunId,
      routeScopeId,
      role: "leader",
      coordinatorEpoch: attempt
    };
    const fallback: AgentRunRequest = {
      project: structuredClone(state),
      purpose: "workflow",
      agent: "main",
      kind: "main",
      permission: "workspace",
      invocationId,
      inboxPath: inputs.inboxPath,
      projectPath: this.#storage.projectDir(state.id),
      workspacePath: inputs.workspacePath,
      schemaPath: "",
      skillPaths: [],
      autoSkillPaths: [],
      availableSkillPaths: [],
      runtimePath,
      executionContext
    };
    const request = this.#executionInputBuilder
      ? await this.#executionInputBuilder.build({
          state,
          agentId: "main",
          executionContext,
          assignment,
          invocationId,
          inboxPath: inputs.inboxPath,
          projectPath: this.#storage.projectDir(state.id),
          worktreePath: inputs.workspacePath,
          runtimePath
        })
      : fallback;
    const canComplete = sourceIsMain &&
      (await this.mainCanComplete(state)) && candidates.includes("finish");
    const allowFinishRoute = !sourceIsMain && candidates.includes("finish");
    const routeCandidates = [...candidates];
    request.workflowContext = { scope: "global", sourceNodeId: sourceNode?.node.nodeId ?? sourceAgentId,
      purpose: "outer-routing", candidates: routeCandidates };
    request.contextSources = contextSources.sources;
    request.nativeInputNotices = pendingInputs.map(input => input.text);
    Object.assign(inputs, await prepareWorkflowContext(request, inputs, (await this.database().authoritativeWorkflowFiles(state.id))));
    const tasklessRouteTargets = routeCandidates.filter((candidate) =>
      candidate !== "finish" &&
      workflowTargetAllowsTasklessActivation(state.orchestration, candidate));
    const allowUserIntervention = state.orchestration.allowUserIntervention;
    const allowWorkflowReconfiguration = sourceIsMain &&
      state.orchestration.allowMainReconfiguration === true;
    await this.attachRuntimeCallbacks(state, request);
    this.attachRootMainInputReception(state, request, pendingInputs);
    const routeTurnRequestFactory = this.turnRequestFactory(state, request, undefined, recoverySeed);
    // Transport current capability/receipt facts, never choose Main's action.
    // A retained session can recall an old rejection as if it happened again;
    // its prose is not a live tool receipt and cannot replace an assigned MCP.
    const currentFormalTools = [
      ...(routeCandidates.length ? ["route_to_agent"] : []),
      ...(allowUserIntervention ? ["request_user"] : []),
      ...(allowWorkflowReconfiguration ? ["apply_workflow"] : []),
      ...(canComplete ? ["complete_project"] : [])
    ];
    const managementToolInstructions = (taskCompleted = false) => [
      ...mainRouteTargetInstructions(sourceIsMain, routeCandidates),
      `Current authorized formal decision tools: ${JSON.stringify(currentFormalTools)}. Use the callable tool names exposed by this Harness, including their MCP namespace when present; choose the authorized action yourself. select_display alone is not a formal orchestration decision.`,
      "Earlier session text, memory and handoffs are historical context, not current tool receipts. Use the actual current tool returns to assess success or failure; do not report a remembered rejection as a newly executed call. Read the current Inbox and authoritative state when needed.",
      ...(allowWorkflowReconfiguration && inputs.workflowAuthoringPath ? [
        `The original task's writable authoring proposal is ${inputs.workflowAuthoringPath}. If you choose to change it, use the Harness native file/edit tools with this exact authoring path, preserve the proposal contract, and submit that proposal with apply_workflow. A text description does not edit or apply a file.`,
        "Historical proposal snapshots may exist under .scienceevolve/management in your current read-only workspace. They are unaccepted drafts, not applied configuration. If earlier unfinished edits matter, inspect them yourself with the assigned filesystem tools and reconcile them with the authoritative workflow and your current bound proposal; the system does not choose or transplant their business edits."
      ] : []),
      taskCompleted
        ? "finish_task for this original management task is already accepted. Preserve its immutable content; only supply the missing authorized formal action."
        : "Call finish_task for your own Main management task, including any durable Agent-authored memory. Recording a route or project decision does not finish your task; finishing your task keeps the tool channel open for the separate authorized decision."
    ];
    const turn = {
      inputId: turnInputId,
      invocationId,
      prompt: [assignment,
        ...(retainedAccepted.length ? [
          "Continue the original management task/session. Its formal decisions are retained and must not be replaced. Supply the missing finish_task for the current recovered authority.",
          `Retained accepted actions: ${JSON.stringify(retainedAccepted.map((fact) => fact.action))}.`
        ] : [])].join("\n\n")
    };
    let activeRouteTurn = turn;
    let activeRouteTurnClosed = false;
    let routeResidentClosed = false;
    let nativeMainInvocation: string | undefined;
    const residentKey = `main-route:${state.id}:${sourceNodeRunId}:${attempt}`;
    let activeRouteOperation = false;
    const beginRouteOperation = () => {
      if (activeRouteOperation) return;
      activeRouteOperation = true;
      this.#activeTurns.set(state.id, (this.#activeTurns.get(state.id) ?? 0) + 1);
    };
    const endRouteOperation = () => {
      if (!activeRouteOperation) return;
      activeRouteOperation = false;
      const remaining = (this.#activeTurns.get(state.id) ?? 1) - 1;
      if (remaining > 0) this.#activeTurns.set(state.id, remaining);
      else {
        this.#activeTurns.delete(state.id);
        for (const resolve of this.#turnIdleWaiters.get(state.id) ?? []) resolve();
        this.#turnIdleWaiters.delete(state.id);
      }
    };
    const routeAuthority: RuntimeActivityAuthority = {
      agentId: "main",
      nodeRunId: sourceNodeRunId,
      coordinatorEpoch: attempt
    };
    await this.startRuntimeActivity(state, routeAuthority, {
      kind: "resident",
      phase: "resident:starting",
      invocationId,
      requestId: `runtime-main-resident-start-${sourceNodeRunId}-${attempt}`
    });
    await this.startRuntimeActivity(state, routeAuthority, {
      kind: "turn",
      phase: "model:running",
      invocationId,
      inputId: turnInputId,
      requestId: `runtime-main-turn-start-${sourceNodeRunId}-${attempt}`
    });
    try {
      // Stop-confirmed recovery carries the Agent's immutable prior choice,
      // never invents another choice, and never reuses its old finish receipt.
      for (const fact of retainedAccepted) {
        if (fact.routeEpoch + 1 !== attempt) throw new Error("Retained Main decision does not belong to the immediately stopped authority");
        await this.database().revalidateMainRouteControl({ projectId: state.id, nodeRunId: sourceNodeRunId,
          routeEpoch: attempt, stateVersion: attempt, invocationId, candidateNodeIds: candidates, tasklessRouteNodeIds: tasklessRouteTargets,
          canComplete, allowFinishRoute, action: fact.action,
          accepted: { requestId: acceptedMainControlRequestId(acceptedIdentity.semanticInputHash, fact.sequence),
            inputId: turnInputId, invocationId, callId: fact.callId, semanticInputHash: acceptedIdentity.semanticInputHash,
            sequence: fact.sequence, ...(fact.workflowProposal ? { workflowProposal: fact.workflowProposal } : {}),
            reboundFrom: { routeEpoch: fact.routeEpoch, semanticInputHash: fact.semanticInputHash, sequence: fact.sequence } } });
      }
      await this.waitWhilePaused(state.id, signal);
      // Count the launch too: Pause requested during native initialization
      // must wait until its handle can be paused, before the first model turn.
      beginRouteOperation();
      await decideRoute({
        state: structuredClone(state),
        sourceNodeRunId,
        sourceAgentId,
        output,
        candidates: [...candidates],
        signal,
        turn,
        register: (handle) => { this.#residents.set(residentKey, { projectId: state.id,
          activity: { ...routeAuthority, invocationId }, handle }); },
        unregister: (handle) => {
          if (this.#residents.get(residentKey)?.handle === handle) {
            this.#residents.delete(residentKey);
            routeResidentClosed = true;
          }
        },
        submit: async (handle, submittedTurn) => {
          if (this.#pausedProjects.has(state.id)) {
            endRouteOperation();
            await this.waitWhilePaused(state.id, signal);
          }
          beginRouteOperation();
          nativeMainInvocation = submittedTurn.invocationId;
          let result: AgentRunResult;
          let outcome: "completed" | "failed" | "cancelled" = "failed";
          try {
            result = await this.submitNativeTurn(state, handle, submittedTurn);
            outcome = "completed";
          } finally {
            nativeMainInvocation = undefined;
            if (signal.aborted || this.#cancellingProjects.has(state.id)) outcome = "cancelled";
            try {
              await this.closeRuntimeActivity(state, routeAuthority, { kind: "turn",
                invocationId: submittedTurn.invocationId, outcome,
                requestId: `runtime-main-turn-close-${submittedTurn.invocationId}` });
              activeRouteTurnClosed = true;
            } finally { endRouteOperation(); }
          }
          // Preserve the actual result and the same native handle while
          // paused. Resume, not the system, permits the Agent's next action.
          await this.waitWhilePaused(state.id, signal);
          return result;
        },
        onTurnCompleted: async (result, completedTurn) => {
          // Injected launchers may not implement submit; their completed turn
          // still releases the initial launch fence before waiting for Resume.
          endRouteOperation();
          await this.waitWhilePaused(state.id, signal);
          if (signal.aborted || this.#shuttingDown || this.#cancellingProjects.has(state.id)) {
            throw new Error("Main mechanism continuation was cancelled");
          }
          await this.finishInvocationDiagnostics(state, completedTurn.invocationId, "completed");
          await this.commitMainRouteStaging({ state, nodeRunId: sourceNodeRunId, routeEpoch: attempt,
            inputId: turnInputId, invocationId: completedTurn.invocationId, semanticInputHash: acceptedIdentity.semanticInputHash,
            candidates, canComplete, allowFinishRoute, sourceIsMain, workspacePath: inputs.workspacePath,
            workflowAuthoringPath: inputs.workflowAuthoringPath,
            actions: result.controlActions ?? [] });
          if (!activeRouteTurnClosed) {
            await this.closeRuntimeActivity(state, routeAuthority, { kind: "turn", invocationId: completedTurn.invocationId,
              outcome: "completed", requestId: `runtime-main-turn-close-${completedTurn.invocationId}` });
            activeRouteTurnClosed = true;
          }
          const accepted = await this.database().acceptedMainRouteActions({ projectId: state.id, nodeRunId: sourceNodeRunId,
            semanticInputHash: acceptedIdentity.semanticInputHash });
          const missing = [
            !accepted.some((fact) => fact.action.tool !== "select_display") && "formal Main orchestration action",
            !(await this.mainRouteTaskCompleted(state.id, sourceNodeRunId, attempt, turnInputId)) && "finish_task"
          ].filter((item): item is string => Boolean(item));
          const repairInvocationId = newId("inv");
          const step = await nextTaskRepair({ key: `${state.id}:main:${sourceNodeRunId}`, signal,
            inspect: async () => [...missing, ...await this.#residents.get(residentKey)?.handle.supervisionActions?.() ?? []],
            reserve: async remaining => {
              const count = await this.database().mainRouteControlRepairCount(state.id, sourceNodeRunId);
              if (count >= MAX_TASK_REPAIR_WAKEUPS) return undefined;
              await this.database().appendEvent({ projectId: state.id, nodeRunId: sourceNodeRunId, agentId: "main",
                invocationId: repairInvocationId, coordinatorEpoch: attempt,
                requestId: `main-control-repair-${sourceNodeRunId}-${turnInputId}-${count + 1}`,
                type: "main.route.mechanism_repair.requested",
                payload: { attempt: count + 1, inputId: turnInputId, nativeInputId: `${turnInputId}:supervision:${count + 1}`,
                  previousInvocationId: completedTurn.invocationId, missing: remaining } });
              return count + 1;
            },
            record: async (outcome, remaining, reason) => {
              await this.database().appendEvent({ projectId: state.id, nodeRunId: sourceNodeRunId, agentId: "main",
                coordinatorEpoch: attempt, type: "main.route.supervision.finished",
                payload: { inputId: turnInputId, outcome, missing: remaining, ...(reason ? { reason } : {}) } });
            }
          });
          if (!("attempt" in step)) return undefined;
          activeRouteTurn = { inputId: `${turnInputId}:supervision:${step.attempt}`, invocationId: repairInvocationId,
            prompt: [assignment, `Continue the same management task. Remaining facts: ${step.remaining.join("; ")}.`,
              ...managementToolInstructions((await this.mainRouteTaskCompleted(state.id, sourceNodeRunId, attempt, turnInputId))),
              "Preserve accepted actions and actual tool results. Do what you can and return the existing result and actual limitations if anything remains.",
              ...(accepted.length ? [`Accepted actions: ${JSON.stringify(accepted.map(fact => fact.action))}.`] : [])
            ].join("\n\n") };
          await this.publishProjection(state, (await this.database().projectState(state.id)));
          activeRouteTurnClosed = false;
          await this.startRuntimeActivity(state, routeAuthority, { kind: "turn", phase: "model:running",
            invocationId: activeRouteTurn.invocationId, inputId: activeRouteTurn.inputId,
            requestId: `runtime-main-turn-start-${activeRouteTurn.invocationId}` });
          return activeRouteTurn;
        },
        open: {
          request,
          executionRuntimePath: runtimePath,
          filesystemAuthorityInput: await this.filesystemAuthorityInput(state),
          signal,
          onTrace: this.traceSink(state, "main", invocationId),
          onOpened: async () => this.recordRetryMainResidentOpened(state, {
            invocationId,
            epoch: attempt,
            epochKind: "coordinator"
          }),
          turnRequestFactory: async input => {
            const runtime = await routeTurnRequestFactory(input);
            this.attachRootMainInputReception(state, runtime.request, pendingInputs);
            return runtime;
          },
          inputs,
          controlScope: sourceIsMain
            ? {
              role: "main-node" as const,
               projectId: state.id,
              nodeRunId: sourceNodeRunId,
              routeScopeId,
              leaderAgentId: "main" as const,
              coordinatorEpoch: attempt,
              candidates: routeCandidates,
              tasklessRouteTargets,
              allowUserIntervention,
              allowWorkflowReconfiguration,
              canComplete,
              allowFinishRoute: false as const
            }
          : {
              role: "main-route" as const,
              projectId: state.id,
              nodeRunId: sourceNodeRunId,
              routeScopeId,
              leaderAgentId: "main" as const,
              coordinatorEpoch: attempt,
              candidates: routeCandidates,
              tasklessRouteTargets,
              allowUserIntervention,
              allowWorkflowReconfiguration: false,
              canComplete: false,
               allowFinishRoute
             },
          controlAuthorityFactory: this.mainRouteControlAuthorityFactory(
            state,
            sourceNodeRunId,
            attempt,
            candidates,
            canComplete,
            allowFinishRoute,
            allowUserIntervention,
            sourceIsMain,
            acceptedIdentity.semanticInputHash,
            turnInputId,
            inputs.workflowAuthoringPath,
            (currentInvocationId) => nativeMainInvocation === currentInvocationId
          )
        }
      });
      endRouteOperation();
    } catch (error) {
      endRouteOperation();
      await this.finishInvocationDiagnostics(state, activeRouteTurn.invocationId, "incomplete");
      if (!activeRouteTurnClosed) await this.closeRuntimeActivity(state, routeAuthority, {
        kind: "turn",
        invocationId: activeRouteTurn.invocationId,
        outcome: signal.aborted ? "cancelled" : "failed",
        requestId: `runtime-main-turn-close-${activeRouteTurn.invocationId}`
      });
      if (routeResidentClosed) await this.closeRuntimeActivity(state, routeAuthority, {
        kind: "resident", invocationId, outcome: "stopped",
        requestId: `runtime-main-resident-close-${sourceNodeRunId}-${attempt}`
      });
      if (signal.aborted || this.#shuttingDown ||
        this.#pausedProjects.has(state.id) || this.#cancellingProjects.has(state.id)) {
        throw error;
      }
      const recovered = await this.freezeAndRecoverIndependentMainRoute({
        state,
        sourceNodeRunId,
        routeScopeId,
        routeEpoch: attempt,
        runtimePath,
        error
      });
      if (recovered.recovered || recovered.priorProcessStopped) {
        await this.closeRuntimeActivity(state, routeAuthority, {
          kind: "resident",
          invocationId,
          outcome: "stopped",
          requestId: `runtime-main-resident-close-${sourceNodeRunId}-${attempt}`
        });
      }
      if (recovered.recovered) {
        return this.decideMainRoute(
          state,
          sourceNodeRunId,
          sourceAgentId,
          output,
          candidates,
          signal
        );
      }
      throw new MainRouteRecoveryRequiredError(
        "Independent Main route is frozen pending bounded recovery",
        { cause: error }
      );
    }
    await this.finishInvocationDiagnostics(state, activeRouteTurn.invocationId, "completed");
    if (!activeRouteTurnClosed) await this.closeRuntimeActivity(state, routeAuthority, {
      kind: "turn", invocationId: activeRouteTurn.invocationId, outcome: "completed",
      requestId: `runtime-main-turn-close-${activeRouteTurn.invocationId}`
    });
    await this.closeRuntimeActivity(state, routeAuthority, {
      kind: "resident",
      invocationId,
      outcome: "completed",
      requestId: `runtime-main-resident-close-${sourceNodeRunId}-${attempt}`
    });
    await this.waitWhilePaused(state.id, signal);
    if (signal.aborted || this.#shuttingDown ||
      this.#cancellingProjects.has(state.id)) {
      throw new Error("Main route turn was superseded before staged control commit");
    }
    const committed = await this.database().acceptedMainRouteActions({ projectId: state.id,
      nodeRunId: sourceNodeRunId, semanticInputHash: acceptedIdentity.semanticInputHash });
    if (!committed.some(fact => fact.action.tool !== "select_display")) return undefined;
    return this.finishMainRouteDecision({
      state,
      sourceNodeRunId,
      sourceAgentId,
      sourceIsMain,
      workspacePath: inputs.workspacePath,
      workflowAuthoringPath: inputs.workflowAuthoringPath,
      routeEpoch: committed[0]!.routeEpoch,
      inputId: committed[0]!.inputId,
      invocationId: committed[0]!.invocationId,
      answeredIntervention,
      decision: acceptedMainRouteDecision(committed, output),
      signal
    });
  }

  private async finishMainRouteDecision(input: {
    state: ProjectState;
    sourceNodeRunId: string;
    sourceAgentId: string;
    routeEpoch: number;
    inputId: string;
    invocationId: string;
    answeredIntervention?: NonNullable<ProjectState["userIntervention"]>;
    sourceIsMain: boolean;
    workspacePath: string;
    workflowAuthoringPath?: string;
    decision: {
      targetNodeId: string;
      decisionRequestId: string;
      output?: string;
      intervention?: Extract<ControlAction, { tool: "request_user" }>;
      decisionAction?: Extract<ControlAction,
        { tool: "route_to_agent" | "request_user" | "apply_workflow" | "complete_project" }>;
      controlActions?: ControlActionEnvelope[];
      acceptedActions?: AcceptedMainRouteAction[];
    };
    signal: AbortSignal;
  }): Promise<{
    targetNodeId: string;
    decisionRequestId: string;
    output?: string;
    intervention?: Extract<ControlAction, { tool: "request_user" }>;
    decisionAction?: Extract<ControlAction,
      { tool: "route_to_agent" | "request_user" | "apply_workflow" | "complete_project" }>;
    controlActions?: ControlActionEnvelope[];
  }> {
    this.assertWritable();
    const originalResponse = await this.database().eventByRequestId(input.state.id,
      `main-route-response-${input.sourceNodeRunId}-${input.routeEpoch}`);
    if (originalResponse) {
      // A published user revision does not re-author the original native
      // response. Transport that immutable decision without re-counting the
      // task or repeating configuration/display effects.
      if (originalResponse.type !== "main.route.response.committed" ||
        originalResponse.nodeRunId !== input.sourceNodeRunId || originalResponse.agentId !== "main" ||
        originalResponse.invocationId !== input.invocationId || originalResponse.coordinatorEpoch !== input.routeEpoch ||
        originalResponse.payload.inputId !== input.inputId ||
        originalResponse.payload.targetNodeId !== input.decision.targetNodeId ||
        originalResponse.payload.decisionRequestId !== input.decision.decisionRequestId) {
        throw new CollaborationStateError("IDEMPOTENCY_CONFLICT",
          "Committed Main response does not match its original task and accepted decision");
      }
      const publication = originalResponse.payload.workflowAdjustment as WorkflowAdjustmentPublication | undefined;
      if (publication) {
        const record = await this.database().workflowAdjustment(input.state.id, publication.requestId);
        const withdrawal = record?.history.find(item => item.status === "withdrawn");
        return { ...input.decision, output: `Workflow adjustment result: ${JSON.stringify({ ...publication,
          ...(withdrawal?.note === undefined ? {} : { userNote: withdrawal.note }) })}` };
      }
      return input.decision;
    }
    let workflowAdjustment: WorkflowAdjustmentPublication | undefined;
    const acceptedActions = input.decision.acceptedActions ?? [];
    const acceptedDecision = acceptedActions.find((fact) =>
      fact.action.tool !== "select_display"
    );
    if (input.sourceIsMain) {
      await this.commitMainPreparatoryActions(
        input.state,
        input.decision.controlActions,
        acceptedActions
      );
    }
    if (input.sourceIsMain && input.decision.decisionAction?.tool === "apply_workflow") {
      await this.applyWaitingWorkflowAdjustments(input.state);
      if (acceptedDecision?.action.tool === "apply_workflow") {
        workflowAdjustment = (await this.database().rollForwardAcceptedMainWorkflow({
          projectId: input.state.id,
          nodeRunId: input.sourceNodeRunId,
          routeEpoch: acceptedDecision.routeEpoch,
          semanticInputHash: acceptedDecision.semanticInputHash,
          sequence: acceptedDecision.sequence
        }, input.state));
        await this.publishProjection(
          input.state,
          (await this.database().projectState(input.state.id))
        );
        const adjustment = await this.database().workflowAdjustment(input.state.id, workflowAdjustment.requestId);
        const withdrawal = adjustment?.history.find(item => item.status === "withdrawn");
        input.decision = { ...input.decision, output: `Workflow adjustment result: ${JSON.stringify({ ...workflowAdjustment,
          ...(withdrawal?.note === undefined ? {} : { userNote: withdrawal.note }) })}` };
        if (workflowAdjustment.status === "applied" && !(await this.database().acceptedMainControlEffect({
          projectId: input.state.id,
          nodeRunId: input.sourceNodeRunId,
          routeEpoch: acceptedDecision.routeEpoch,
          semanticInputHash: acceptedDecision.semanticInputHash,
          sequence: acceptedDecision.sequence,
          effect: "workflow_projection"
        }))) {
          await this.database().recordAcceptedMainControlEffect({
            projectId: input.state.id,
            nodeRunId: input.sourceNodeRunId,
            routeEpoch: acceptedDecision.routeEpoch,
            semanticInputHash: acceptedDecision.semanticInputHash,
            sequence: acceptedDecision.sequence,
            effect: "workflow_projection"
          });
          await this.publishProjection(
            input.state,
            (await this.database().projectState(input.state.id))
          );
        }
      } else {
        if (!input.workspacePath) {
          throw new Error("Main workflow action lost its proposal workspace");
        }
        const proposal = await this.readMainWorkflowProposal(input.state, input.workspacePath, input.workflowAuthoringPath);
        const affectedGroupIds = affectedCollaborationGroupIds(
          input.state.orchestration,
          proposal.orchestration
        );
        await this.assertWorkflowRevisionEditable(input.state, affectedGroupIds);
        const requestId = `main-workflow-${input.state.id}-${input.invocationId}`;
        const revision = (await this.database().projectState(input.state.id)).workflowRevision + 1;
        const previous = { agents: input.state.agents, archivedAgentSessions: input.state.archivedAgentSessions };
        archiveRemovedWorkflowAgentSessions(input.state, proposal.agents, revision);
        input.state.agents = proposal.agents;
        try {
          await this.saveWorkflowRevision(input.state, { orchestration: proposal.orchestration, affectedGroupIds, requestId });
        } catch (error) {
          const accepted = await this.database().eventByRequestId(input.state.id, requestId);
          if (accepted?.type !== "workflow.revision.created" || accepted.workflowRevision !== revision) Object.assign(input.state, previous);
          throw error;
        }
      }
    }
    const resetRecovery = await this.database().resetMainRouteRecovery({
      projectId: input.state.id,
      nodeRunId: input.sourceNodeRunId
    });
    if (resetRecovery.reset) {
      await this.publishProjection(
        input.state,
        (await this.database().projectState(input.state.id))
      );
    }
    input.state.mainInvocationSeq += 1;
    await this.restoreReceivedRootMainInputs(input.state);
    if (input.answeredIntervention) input.state.userIntervention = undefined;
    await this.saveState(input.state);
    await this.database().appendEvent({
      projectId: input.state.id,
      eventId: `evt-main-route-response-${input.sourceNodeRunId}-${input.routeEpoch}`,
      requestId: `main-route-response-${input.sourceNodeRunId}-${input.routeEpoch}`,
      workflowRevision: input.state.workflowRevision ?? 1,
      nodeRunId: input.sourceNodeRunId,
      agentId: "main",
      invocationId: input.invocationId,
      coordinatorEpoch: input.routeEpoch,
      type: "main.route.response.committed",
      payload: {
        inputId: input.inputId,
        targetNodeId: input.decision.targetNodeId,
        decisionRequestId: input.decision.decisionRequestId,
        ...(workflowAdjustment ? { workflowAdjustment } : {})
      }
    });
    await this.resolveMainRouteFailures(input.state, input.sourceNodeRunId, input.routeEpoch, input.invocationId);
    await this.publishProjection(
      input.state,
      (await this.database().projectState(input.state.id))
    );
    return input.decision;
  }

  private async mainRouteTaskMayReturn(projectId: string, nodeRunId: string, routeEpoch: number, inputId: string): Promise<boolean> {
    if ((await this.mainRouteTaskCompleted(projectId, nodeRunId, routeEpoch, inputId))) return true;
    let cursor = 0;
    for (;;) {
      const events = await this.database().eventsAfter(projectId, cursor, EVENT_PAGE_SIZE);
      if (events.some(event => event.nodeRunId === nodeRunId && event.coordinatorEpoch === routeEpoch &&
        event.type === "main.route.supervision.finished" && event.payload.inputId === inputId)) return true;
      if (events.length < EVENT_PAGE_SIZE) return false;
      cursor = events.at(-1)!.seq;
    }
  }

  private async mainRouteTaskCompleted(projectId: string, nodeRunId: string, routeEpoch: number, inputId: string): Promise<boolean> {
    const taskId = mainRouteTaskCompletionKey(nodeRunId, routeEpoch, inputId);
    const event = await this.database().eventByRequestId(projectId, mainRouteTaskCompletionRequestId(taskId));
    return event?.type === "main.route.task_completion.committed" && event.agentId === "main" &&
      event.nodeRunId === nodeRunId && event.coordinatorEpoch === routeEpoch && event.payload.taskId === taskId;
  }

  private async commitMainRouteStaging(input: {
    state: ProjectState;
    nodeRunId: string;
    routeEpoch: number;
    inputId: string;
    invocationId: string;
    semanticInputHash: string;
    candidates: readonly string[];
    canComplete: boolean;
    allowFinishRoute: boolean;
    sourceIsMain: boolean;
    workspacePath: string;
    workflowAuthoringPath?: string;
    actions: readonly ControlActionEnvelope[];
  }): Promise<void> {
    const tasklessRouteTargets = input.candidates.filter((candidate) =>
      candidate !== "finish" &&
      workflowTargetAllowsTasklessActivation(input.state.orchestration, candidate));
    for (const envelope of input.actions) {
      const action = envelope.action;
      if (envelope.projectId !== input.state.id || envelope.agent !== "main" ||
        envelope.invocationId !== input.invocationId || envelope.stateVersion !== input.routeEpoch) {
        throw new Error("Main route staging does not match the completed turn authority");
      }
      if (action.tool === "finish_task") {
        if (!(await this.mainRouteTaskCompleted(input.state.id, input.nodeRunId, input.routeEpoch, input.inputId))) {
          throw new Error("Main finish_task result lacks its matching live durable completion");
        }
        continue;
      }
      if (action.tool === "publish_artifact") continue;
      if (![
        "route_to_agent",
        "select_display",
        "request_user",
        "apply_workflow",
        "complete_project"
      ].includes(action.tool)) {
        throw new Error("Main route staging contains an action outside its authority");
      }
      if (!input.sourceIsMain && action.tool !== "route_to_agent" &&
        action.tool !== "request_user") {
        throw new Error("Weak-route Main staging contains a management-only action");
      }
      const acceptedAction: ControlAction = input.sourceIsMain && action.tool === "select_display"
        ? {
            tool: "select_display",
            ...await this.validateRetainedMainDisplaySelection(input.state, input.nodeRunId, input.semanticInputHash, action)
          }
        : action;
      const retained = await this.database().acceptedMainRouteActions({ projectId: input.state.id, nodeRunId: input.nodeRunId,
        semanticInputHash: input.semanticInputHash });
      const priorSlot = retained.find((fact) => (fact.action.tool === "select_display") === (action.tool === "select_display"));
      if (priorSlot && acceptedControlHash(priorSlot.action) !== acceptedControlHash(acceptedAction)) {
        throw new Error("The Main management task's accepted formal action cannot be replaced");
      }
      let workflowProposal: AcceptedMainRouteAction["workflowProposal"] = priorSlot?.workflowProposal;
      if (!workflowProposal && input.sourceIsMain && action.tool === "apply_workflow") {
        // Bind the authority before file/resource validation can yield. Legacy
        // graph-only paths seed this exact configuration after a valid read.
        const projection = await this.database().projectState(input.state.id);
        const baseConfigurationHash = (await this.database().scopedConfigurationHash(input.state.id)) ??
          acceptedControlHash(credentialFreeAgentConfiguration({ agents: input.state.agents,
            skillDefinitions: input.state.skillDefinitions ?? {}, mcpDefinitions: input.state.mcpDefinitions ?? {} }));
        const baseVersion = (await this.database().workflowAdjustmentCurrent(input.state.id, this.workflowAdjustmentSeed(input.state))).version;
        const proposal = await this.readMainWorkflowProposal(input.state, input.workspacePath, input.workflowAuthoringPath, baseVersion);
        workflowProposal = {
          orchestration: proposal.orchestration,
          affectedGroupIds: affectedCollaborationGroupIds(
            input.state.orchestration,
            proposal.orchestration
          ),
          prestateWorkflowRevision: projection.workflowRevision,
          prestateWorkflowHash: acceptedControlHash(projection.workflowSnapshot),
          targetWorkflowRevision: projection.workflowRevision + 1,
          proposalHash: acceptedControlHash(proposal.orchestration),
          configuration: credentialFreeAgentConfiguration({ agents: proposal.agents ?? input.state.agents,
            skillDefinitions: proposal.skillDefinitions ?? input.state.skillDefinitions ?? {},
            mcpDefinitions: proposal.mcpDefinitions ?? input.state.mcpDefinitions ?? {} }),
          baseConfigurationHash
        };
      }
      const sequence = priorSlot?.sequence ?? retained.length;
      await this.database().revalidateMainRouteControl({
        projectId: input.state.id,
        nodeRunId: input.nodeRunId,
        routeEpoch: input.routeEpoch,
        stateVersion: input.routeEpoch,
        invocationId: input.invocationId,
        candidateNodeIds: input.candidates,
        tasklessRouteNodeIds: tasklessRouteTargets,
        canComplete: input.canComplete,
        allowFinishRoute: input.allowFinishRoute,
        accepted: {
          requestId: acceptedMainControlRequestId(input.semanticInputHash, sequence),
          inputId: input.inputId,
          invocationId: input.invocationId,
          callId: envelope.callId,
          semanticInputHash: input.semanticInputHash,
          sequence,
          ...(workflowProposal ? { workflowProposal } : {})
        },
        action: acceptedAction
      });
    }
    if (input.actions.some((envelope) => !["publish_artifact", "finish_task"].includes(envelope.action.tool))) {
      this.#locallyAcceptedMainRoutes.add(input.semanticInputHash);
    }
  }

  private mainRouteControlAuthorityFactory(
    state: ProjectState,
    nodeRunId: string,
    routeEpoch: number,
    candidates: readonly string[],
    canComplete: boolean,
    allowFinishRoute: boolean,
    allowUserIntervention: boolean,
    sourceIsMain: boolean,
    semanticInputHash: string,
    inputId: string,
    workflowAuthoringPath?: string,
    isActiveTurn?: (invocationId: string) => boolean
  ): CollaborationControlAuthorityFactory {
    return async ({ request, turn }) => {
      this.assertWritable();
      const capability = randomUUID();
      const capabilityHash = createHash("sha256").update(capability).digest("hex");
      const turnKey = createHash("sha256")
        .update(`${turn.inputId}\0${turn.invocationId}`)
        .digest("hex")
        .slice(0, 32);
      const control: ControlMcpRequest = {
        stagingPath: path.join(request.runtimePath, "control-turns", turnKey, "actions.json"),
        capability,
        capabilityHash,
        stateVersion: routeEpoch,
        candidates: [...candidates],
        tasklessRouteTargets: candidates.filter((candidate) =>
          candidate !== "finish" &&
          workflowTargetAllowsTasklessActivation(state.orchestration, candidate)),
        decisionBy: "main",
        allowUserIntervention,
        allowWorkflowReconfiguration: sourceIsMain &&
          state.orchestration.allowMainReconfiguration === true,
        canComplete,
        allowFinishRoute,
        workspacePath: request.workspacePath,
        // Supplements share the original logical management task and its
        // editable proposal. Only native input/capability identity rotates;
        // inventing a new proposal path changes the resident's tool scope.
        // The Agent keeps its unfinished work and chooses the formal action.
        ...(sourceIsMain && state.orchestration.schemaVersion === 3 && state.orchestration.allowMainReconfiguration && workflowAuthoringPath ? {
          workflowAuthoringPath
        } : {}),
        requireBridge: true
      };
      return {
        control,
        revalidate: async (envelope, stagedActions) => {
          this.assertWritable();
          // A safe-point Pause lets this exact already active native turn
          // finish its own live tools. Once it ends, no stale capability or
          // new supplement may use the pending/settled Pause as authorization.
          const finishingPausedTurn = state.status === "pausing" && isActiveTurn?.(turn.invocationId) === true;
          if (this.#shuttingDown || this.#cancellingProjects.has(state.id) ||
            this.#pausedProjects.has(state.id) && !finishingPausedTurn) {
            throw new Error("Main route authority was revoked");
          }
          const action = envelope.action;
          if (envelope.projectId !== state.id || envelope.agent !== "main" ||
            envelope.invocationId !== turn.invocationId ||
            envelope.stateVersion !== routeEpoch ||
            envelope.capabilityHash !== capabilityHash) {
            throw new Error("Main route envelope does not match its fresh authority");
          }
          if (!sourceIsMain && action.tool !== "route_to_agent" && action.tool !== "finish_task" && action.tool !== "request_user") {
            throw new Error("Weak-route Main may only route or request user input");
          }
          const tasklessRouteTargets = candidates.filter((candidate) =>
            candidate !== "finish" &&
            workflowTargetAllowsTasklessActivation(state.orchestration, candidate));
          if (action.tool === "route_to_agent" &&
            !action.assignment?.trim() && !tasklessRouteTargets.includes(action.target)) {
            throw new Error(
              "Main route_to_agent requires a non-empty assignment for an ordinary target"
            );
          }
          if (sourceIsMain && ![
            "finish_task",
            "route_to_agent",
            "publish_artifact",
            "select_display",
            "request_user",
            "apply_workflow",
            "complete_project"
          ].includes(action.tool)) {
            throw new Error("System Main action is outside its management tool scope");
          }
          if (sourceIsMain && action.tool === "publish_artifact") {
            throw new Error(
              "Git-on Main management files are not merged business artifacts and cannot be published"
            );
          }
          if (sourceIsMain && action.tool === "select_display") {
            await this.validateRetainedMainDisplaySelection(state, nodeRunId, semanticInputHash, action);
          }
          const authority = { projectId: state.id, nodeRunId, routeEpoch, stateVersion: routeEpoch, invocationId: turn.invocationId,
            candidateNodeIds: candidates, tasklessRouteNodeIds: tasklessRouteTargets, canComplete, allowFinishRoute, action };
          await this.database().revalidateMainRouteControl(authority);
          let completion: unknown;
          if (action.tool === "finish_task") {
            const taskId = mainRouteTaskCompletionKey(nodeRunId, routeEpoch, inputId);
            const receipt = await this.#storage.requestTaskCompletion(state, taskId, envelope);
            completion = receipt;
            if (receipt.summary !== action.summary || receipt.memory !== action.memory) {
              throw new Error("Repeat Main finish_task must preserve its accepted summary and memory");
            }
            if (!(await this.mainRouteTaskCompleted(state.id, nodeRunId, routeEpoch, inputId))) {
              await this.database().revalidateMainRouteControl(authority);
              await this.database().appendEvent({ projectId: state.id, nodeRunId, agentId: "main", coordinatorEpoch: routeEpoch,
                invocationId: turn.invocationId, requestId: mainRouteTaskCompletionRequestId(taskId),
                type: "main.route.task_completion.committed", payload: { taskId, inputId, callId: envelope.callId } });
            }
          } else {
            await this.commitMainRouteStaging({ state, nodeRunId, routeEpoch, inputId, invocationId: turn.invocationId,
              semanticInputHash, candidates, canComplete, allowFinishRoute, sourceIsMain,
              workspacePath: request.workspacePath, workflowAuthoringPath, actions: [...stagedActions, envelope] });
          }
          await this.appendSuccessfulAttempt(state, {
            attemptId: durableAttemptId("control-success", [
              state.id,
              turn.invocationId,
              envelope.callId
            ]),
            scope: "control",
            operation: controlAttemptOperation(action.tool),
            message: "A corrected Main control action passed revalidation",
            agentId: "main",
            nodeRunId,
            invocationId: turn.invocationId,
            coordinatorEpoch: routeEpoch,
            metadata: {
              callId: envelope.callId,
              tool: action.tool,
              stateVersion: envelope.stateVersion
            }
          });
          return completion;
        },
        onRejected: async (envelope, error) => {
          await this.appendFailureAttempt(state, {
            ...(envelope ? {
              attemptId: durableAttemptId("control-failure", [
                state.id,
                turn.invocationId,
                envelope.callId
              ])
            } : {}),
            scope: "control",
            operation: controlAttemptOperation(envelope?.action.tool),
            error,
            errorCode: "CONTROL_ACTION_REJECTED",
            retryable: true,
            agentId: "main",
            nodeRunId,
            invocationId: turn.invocationId,
            coordinatorEpoch: routeEpoch,
            metadata: {
              ...(envelope ? {
                callId: envelope.callId,
                tool: envelope.action.tool,
                stateVersion: envelope.stateVersion
              } : {})
            }
          });
          await this.appendEvent(state, {
            type: "control.action.rejected",
            level: "warning",
            agent: "main",
            message: "Main route action rejected",
            invocationId: turn.invocationId,
            data: {
              ...(envelope ? { callId: envelope.callId, tool: envelope.action.tool } : {}),
              reason: safeRuntimeError(error)
            }
          });
        }
      };
    };
  }

  private async assertSessionCompatibleWorkflow(state: ProjectState, proposed: AgentOrchestrationTemplate, agents?: ProjectState["agents"]): Promise<void> {
    if (agents) await this.database().assertRetainedWorkflowSessionHarnesses(state.id, agents, state);
    if (state.orchestration.schemaVersion === 3 && proposed.schemaVersion !== 3) throw new Error("A scoped project cannot downgrade to scope-specific sessions/checkouts");
    if (state.orchestration.schemaVersion !== 3 && proposed.schemaVersion === 3 &&
      [...Object.keys(state.agentSessionIds ?? {}), ...Object.keys(state.agentSessions ?? {})].length) {
      throw new Error("Existing legacy native sessions have execution-specific folders/identities; a live v3 conversion cannot replace them. Retain the existing project/session and use v3 for new Git projects.");
    }
  }

  private async readMainWorkflowProposal(
    state: ProjectState,
    workspacePath: string,
    workflowAuthoringPath?: string,
    baseVersion?: WorkflowConfigurationVersion
  ): Promise<ReturnType<typeof parseWorkflowProposal> & Partial<AgentOrchestrationProposal>> {
    baseVersion ??= (await this.database().workflowAdjustmentCurrent(state.id, this.workflowAdjustmentSeed(state))).version;
    const root = await fs.realpath(workspacePath);
    if (root !== path.resolve(workspacePath)) {
      throw new Error("Main management workspace is not canonical");
    }
    // The capability and filesystem roots pin the original logical task's
    // proposal. A supplement/recovery rotates its physical invocation only;
    // reconstructing a path from that new ID loses the Agent's actual edit.
    let candidate = path.join(root, MAIN_WORKFLOW_FILE);
    if (state.orchestration.schemaVersion === 3) {
      if (!workflowAuthoringPath || path.resolve(workflowAuthoringPath) !== workflowAuthoringPath ||
        !isManagementProposal(this.#storage.projectDir(state.id), root, "main", workflowAuthoringPath)) {
        throw new Error("Main workflow action lost its pinned original proposal authority");
      }
      candidate = workflowAuthoringPath;
    }
    const file = await fs.lstat(candidate);
    if (file.isSymbolicLink() || !file.isFile() || file.nlink !== 1) {
      throw new Error("workflow.json must be a regular file in Main's management workspace");
    }
    const real = await fs.realpath(candidate);
    if (real !== candidate) throw new Error("workflow.json traverses a symbolic link");
    const raw = await fs.readFile(real, "utf8");
    const full = (JSON.parse(raw) as { schemaVersion?: unknown }).schemaVersion === 2;
    const refreshCurrentReference = async () => {
      const current = await this.database().workflowAdjustmentCurrent(state.id, this.workflowAdjustmentSeed(state));
      await this.#storage.writeManagementWorkflowCurrentSnapshot(workflowAuthoringPath
        ? path.dirname(path.dirname(workflowAuthoringPath)) : workspacePath,
        full ? mainAgentOrchestrationDocument(state.id, current.snapshot.orchestration,
          restoreAgentConfiguration(current.snapshot, state.agents), current.snapshot.skillDefinitions, current.snapshot.mcpDefinitions, current.version)
          : mainWorkflowDocument(state.id, current.snapshot.orchestration, current.version),
        async () => {
        this.assertWritable();
        return sameWorkflowConfigurationVersion((await this.database().workflowAdjustmentCurrent(state.id, this.workflowAdjustmentSeed(state))).version, current.version);
      });
    };
    await refreshCurrentReference();
    if (full) {
      const proposal = parseAgentOrchestrationProposal(raw, state.id, state.orchestration, state.agents,
        { baseDir: workspacePath, skillDefinitions: state.skillDefinitions, mcpDefinitions: state.mcpDefinitions, baseVersion });
      await this.assertSessionCompatibleWorkflow(state, proposal.orchestration, proposal.agents);
      if (!this.#validateWorkflowConfiguration) throw new Error("Agent configuration editing requires the server validator");
      await this.#validateWorkflowConfiguration(state, proposal);
      if (!sameWorkflowConfigurationVersion((await this.database().workflowAdjustmentCurrent(state.id, this.workflowAdjustmentSeed(state))).version, baseVersion)) await refreshCurrentReference();
      await this.assertSessionCompatibleWorkflow(state, proposal.orchestration, proposal.agents);
      await this.database().initializeScopedConfiguration(state.id, { agents: state.agents, skillDefinitions: state.skillDefinitions ?? {}, mcpDefinitions: state.mcpDefinitions ?? {} });
      return proposal;
    }
    const proposal = parseWorkflowProposal(
      raw,
      state.id,
      state.orchestration,
      state.agents,
      { baseVersion }
    );
    await this.assertSessionCompatibleWorkflow(state, proposal.orchestration, proposal.agents);
    await this.database().initializeScopedConfiguration(state.id, { agents: state.agents, skillDefinitions: state.skillDefinitions ?? {}, mcpDefinitions: state.mcpDefinitions ?? {} });
    return proposal;
  }

  /** Agent clients select by path; the accepted task binds that request once.
   * Repeating the same tool after a memory failure must use its original
   * artifact identity. The system only preserves the Agent's accepted choice. */
  private async validateRetainedMainDisplaySelection(
    state: ProjectState,
    nodeRunId: string,
    semanticInputHash: string,
    action: Extract<ControlAction, { tool: "select_display" }>
  ): Promise<DisplaySelection> {
    const prior = (await this.database().acceptedMainRouteActions({ projectId: state.id, nodeRunId, semanticInputHash }))
      .find((fact) => fact.action.tool === "select_display");
    if (prior?.action.tool !== "select_display") return this.validateMainDisplaySelection(state, action);
    const requested = [action.primary, ...(action.items ?? [])];
    const retained = [prior.action.primary, ...(prior.action.items ?? [])];
    if (requested.length !== retained.length || requested.some((item, index) => {
      const old = retained[index]!;
      return item.agent !== old.agent || item.path !== old.path || item.title !== old.title ||
        Boolean(item.artifactId) !== Boolean(item.commitSha) ||
        item.artifactId !== undefined && item.artifactId !== old.artifactId ||
        item.commitSha !== undefined && item.commitSha !== old.commitSha;
    })) {
      throw new Error("The Main management task's accepted formal action cannot be replaced");
    }
    return this.validateMainDisplaySelection(state, prior.action, true);
  }

  private async validateMainDisplaySelection(
    state: ProjectState,
    action: Extract<ControlAction, { tool: "select_display" }>,
    requireExistingBinding = false
  ): Promise<DisplaySelection> {
    const entries = [action.primary, ...(action.items ?? [])];
    const bound: DisplayItem[] = [];
    for (const item of entries) {
      if (!state.agents[item.agent]) {
        throw new Error(`Main cannot display an artifact from unknown Agent ${item.agent}`);
      }
      const hasArtifactId = Boolean(item.artifactId);
      const hasCommitSha = Boolean(item.commitSha);
      if (hasArtifactId !== hasCommitSha || requireExistingBinding && !hasArtifactId) {
        throw new Error(
          `Display selection lacks an immutable artifact binding: ${item.agent}/${item.path}`
        );
      }
      // Publications are append-only. An unbound control action selects the
      // newest accepted publication for this path once, at acceptance time;
      // a persisted display must resolve only its exact id+commit pair.
      const candidates = [...(state.artifacts ?? [])].reverse().filter((artifact) =>
        artifact.agent === item.agent &&
        artifact.path === item.path &&
        artifact.gitSource &&
        (!item.artifactId || artifact.id === item.artifactId) &&
        (!item.commitSha || artifact.gitSource.commitSha === item.commitSha)
      );
      const record = candidates[0];
      if (!record) {
        throw new Error(`Display selection is not a published Git artifact: ${item.agent}/${item.path}`);
      }
      if (hasArtifactId && candidates.length !== 1) {
        throw new Error(`Display selection artifact binding is ambiguous: ${item.artifactId}`);
      }
      await this.#storage.resolveWorkspaceArtifact(state.id, item.agent, item.path, {
        artifactId: record.id,
        commitSha: record.gitSource!.commitSha
      });
      bound.push({
        agent: item.agent,
        path: item.path,
        title: item.title,
        artifactId: record.id,
        commitSha: record.gitSource!.commitSha
      });
    }
    return { primary: bound[0]!, items: bound.slice(1) };
  }

  private async commitMainPreparatoryActions(
    state: ProjectState,
    actions: readonly ControlActionEnvelope[] | undefined,
    acceptedActions: readonly AcceptedMainRouteAction[] = []
  ): Promise<void> {
    const acceptedDisplays = acceptedActions.filter((fact) =>
      fact.action.tool === "select_display"
    );
    if (acceptedDisplays.length > 0) {
      for (const fact of acceptedDisplays) {
        if (fact.action.tool !== "select_display") continue;
        if ((await this.database().acceptedMainControlEffect({
          projectId: state.id,
          nodeRunId: fact.nodeRunId,
          routeEpoch: fact.routeEpoch,
          semanticInputHash: fact.semanticInputHash,
          sequence: fact.sequence,
          effect: "display"
        }))) continue;
        const display = await this.validateMainDisplaySelection(
          state,
          fact.action,
          true
        );
        state.display = structuredClone(display);
        state.displayError = undefined;
        // The file projection precedes the immutable effect marker. A crash
        // in this gap can only repeat the same assignment; the marker/event
        // remains exactly once.
        await this.saveState(state);
        await this.database().recordAcceptedMainControlEffect({
          projectId: state.id,
          nodeRunId: fact.nodeRunId,
          routeEpoch: fact.routeEpoch,
          semanticInputHash: fact.semanticInputHash,
          sequence: fact.sequence,
          effect: "display"
        });
        await this.publishProjection(state, (await this.database().projectState(state.id)));
      }
      return;
    }
    for (const envelope of actions ?? []) {
      if (envelope.action.tool !== "select_display") continue;
      const display = await this.validateMainDisplaySelection(state, envelope.action);
      state.display = structuredClone(display);
      state.displayError = undefined;
      await this.appendEvent(state, {
        type: "display.selected",
        agent: "main",
        message: "Main selected immutable merged Git artifacts for display",
        invocationId: envelope.invocationId,
        data: {
          callId: envelope.callId,
          paths: [envelope.action.primary, ...(envelope.action.items ?? [])]
            .map((item) => `${item.agent}:${item.path}`)
        }
      });
    }
  }

  private async publishProjection(
    state: ProjectState,
    projection: CredentialFreeProjectStateProjection,
    options: { stopConfirmed?: true } = {}
  ): Promise<void> {
    if (projection.id !== state.id) throw new Error("Projection belongs to another project");
    const prior = this.#projectionQueues.get(state.id) ?? Promise.resolve();
    const queued = prior.catch(() => undefined).then(async () => {
      // readEvents already scans the complete JSONL file. Keep every existing
      // id here so an old projection with more than 100k entries cannot cause
      // an early collaboration event to be mirrored a second time.
      const existingEvents = await this.#storage.readEvents(
        state.id,
        0,
        Number.MAX_SAFE_INTEGER
      );
      const existingEventIds = new Set(existingEvents.map((event) => event.eventId));
      const mirroredSeq = maximumMirroredCollaborationSeq(
        existingEvents,
        state.collaboration?.eventSeq ?? 0
      );
      // Only SQLite owns configuration authority. A caller's captured revision
      // cannot grant permission to install its configuration, even if larger.
      let validated: CredentialFreeProjectStateProjection | undefined;
      const mergeLatest = async (eventSeq: number): Promise<CredentialFreeProjectStateProjection> => {
        for (;;) {
          this.assertWritable();
          let newest = await this.database().projectState(state.id);
          // Legacy Git projects retain their original file configuration until
          // S has an Agent configuration. Recovery must not invent an S edit.
          const configuration = newest.scopedConfiguration ?? credentialFreeAgentConfiguration({ agents: state.agents,
            skillDefinitions: state.skillDefinitions ?? {}, mcpDefinitions: state.mcpDefinitions ?? {} });
          const recoverGateway = workflowGatewaySnapshotsNeedValidation(restoreAgentConfiguration(configuration, state.agents));
          if (recoverGateway && !this.#validateWorkflowConfiguration) throw new Error("Gateway snapshot recovery requires the existing resource validator");
          if ((!validated || !sameProjectionWorkflowConfiguration(validated, newest) || recoverGateway) &&
            this.#validateWorkflowConfiguration && (recoverGateway || !isDeepStrictEqual(credentialFreeAgentConfiguration(configuration),
              credentialFreeAgentConfiguration({ agents: state.agents, skillDefinitions: state.skillDefinitions ?? {}, mcpDefinitions: state.mcpDefinitions ?? {} })))) {
            const previousAgents = structuredClone(state.agents);
            const proposal: AgentOrchestrationProposal = {
              orchestration: structuredClone(newest.workflowSnapshot) as AgentOrchestrationTemplate,
              ...structuredClone(configuration),
              agents: restoreAgentConfiguration(configuration, state.agents)
            };
            try {
              await this.#validateWorkflowConfiguration(state, proposal);
            } catch (error) {
              this.assertWritable();
              if (!sameProjectionWorkflowConfiguration(newest, (await this.database().workflowConfiguration(state.id)))) continue;
              throw error;
            }
            this.assertWritable();
            const current = await this.database().projectState(state.id);
            if (!sameProjectionWorkflowConfiguration(newest, current)) continue;
            if (!isDeepStrictEqual(state.agents, previousAgents)) throw new Error("Agent configuration changed during gateway recovery validation; retry using the retained original snapshot");
            const restoredAgents = restoreAgentConfiguration(configuration, proposal.agents);
            assertWorkflowGatewaySnapshots(restoredAgents);
            await this.assertSessionCompatibleWorkflow(state, current.workflowSnapshot as AgentOrchestrationTemplate, restoredAgents);
            archiveRemovedWorkflowAgentSessions(state, restoredAgents, current.workflowRevision);
            state.agents = restoredAgents;
            newest = current;
          }
          // Recheck original Session bindings after every asynchronous boundary,
          // including when the public configuration itself did not change.
          await this.assertSessionCompatibleWorkflow(state, newest.workflowSnapshot as AgentOrchestrationTemplate,
            newest.scopedConfiguration ? restoreAgentConfiguration(newest.scopedConfiguration, state.agents) : undefined);
          mergeProjection(state, newest, eventSeq);
          validated = newest;
          return newest;
        }
      };
      const isCurrent = async (applied: CredentialFreeProjectStateProjection): Promise<boolean> => {
        this.assertWritable();
        const current = await this.database().workflowConfiguration(state.id);
        if (!sameProjectionWorkflowConfiguration(applied, current)) return false;
        await this.assertSessionCompatibleWorkflow(state, current.workflowSnapshot as AgentOrchestrationTemplate,
          current.scopedConfiguration ? restoreAgentConfiguration(current.scopedConfiguration, state.agents) : undefined);
        assertWorkflowGatewaySnapshots(state.agents);
        return true;
      };
      await mergeLatest(mirroredSeq);
      let cursor = mirroredSeq;
      for (;;) {
        while (true) {
          const page = await this.database().eventsAfter(state.id, cursor, EVENT_PAGE_SIZE);
          if (page.length === 0) break;
          for (const event of page) {
            cursor = event.seq;
            if (existingEventIds.has(event.eventId)) {
              if (state.collaboration) state.collaboration.eventSeq = cursor;
              continue;
            }
            existingEventIds.add(event.eventId);
            if (state.collaboration) state.collaboration.eventSeq = cursor;
            // These records already have authoritative MCP history. Mirroring
            // one through appendEvent saves the same checkpoint and produces
            // another document event, so a full page would reproduce forever.
            if (event.type === "project.state.document.changed") continue;
            await this.appendEvent(state, collaborationEventDraft(event));
          }
          if (page.length < EVENT_PAGE_SIZE) break;
        }
        const applied = await mergeLatest(cursor);
        if (!(await isCurrent(applied))) continue;
        if (state.runtime) this.#storage.hub.publishRuntime(state.id, state.runtime);
        await publishAuthoritativeWorkflowFiles(
          this.#storage.projectDir(state.id),
          (await this.database().authoritativeWorkflowFiles(state.id)),
          () => this.assertWritable()
        );
        if (!(await isCurrent(applied))) continue;
        let persistedStatus: string | undefined;
        try {
          persistedStatus = await this.durableProjectStatus(state.id);
        } catch {
          persistedStatus = undefined;
        }
        if (!(await isCurrent(applied))) continue;
        if ((persistedStatus === "cancelling" || persistedStatus === "cancelled") &&
          state.status !== persistedStatus &&
          !(options.stopConfirmed && state.status === "paused" && (await this.database().resumableProjectCancellationIntent(state.id)))) {
          // A stale publisher may have entered before Cancel obtained the
          // lifecycle lane. Never overwrite its already-durable terminal fence.
          state.status = persistedStatus;
          state.phase = persistedStatus === "cancelled"
            ? "cancelled"
            : "collaboration:cancelling";
          return;
        }
        await this.saveState(state);
        if ((await isCurrent(applied))) return;
      }
    });
    this.#projectionQueues.set(state.id, queued);
    try {
      await queued;
    } finally {
      if (this.#projectionQueues.get(state.id) === queued) {
        this.#projectionQueues.delete(state.id);
      }
    }
  }

  private async git(projectId: string, closing?: import("./collaboration-git/contracts.js").RestrictedWorktreeClosingAuthority): Promise<CollaborationGitRuntime> {
    const existing = closing ? undefined : this.#git.get(projectId);
    if (existing) return existing;
    const account = this.#gitAccounts.get(projectId);
    if (this.#credentialResolverForAccount && !account) {
      throw new GitHubAuthorizationError(401, "Git 项目没有绑定可用的 GitHub 账号");
    }
    const workflowSnapshot = (await this.database().getProjectState(projectId))?.workflowSnapshot;
    const worktreeMode = workflowSnapshot && typeof workflowSnapshot === "object" &&
      "schemaVersion" in workflowSnapshot && workflowSnapshot.schemaVersion === 3
      ? "agent" : "execution";
    if (closing && worktreeMode !== "agent") throw new Error("Closing cannot acquire a legacy Git facade");
    const created = this.#gitFactory({
      projectId,
      projectRoot: this.#storage.projectDir(projectId),
      operationStore: this.database().operationsForProject(projectId, worktreeMode === "agent", closing),
      worktreeMode,
      ...(account && this.#credentialResolverForAccount
        ? {
            credentialResolver: this.#credentialResolverForAccount(account.id),
            expectedIdentity: { id: account.providerUserId, login: account.login }
          }
        : {})
    });
    if (!closing) this.#git.set(projectId, created);
    return created;
  }

  private repository(state: ProjectState): GitHubRepositoryFact {
    const retained = this.#repositories.get(state.id);
    if (retained) return retained;
    const operation = state.operations?.find((item) =>
      item.kind === "repository.create" && item.status === "finalized"
    );
    const fact = operation?.remoteFact;
    if (
      !fact || fact.provider !== "github" ||
      typeof fact.providerId !== "number" ||
      typeof fact.owner !== "string" || typeof fact.name !== "string" ||
      typeof fact.htmlUrl !== "string" || typeof fact.cloneUrl !== "string" ||
      typeof fact.private !== "boolean" || fact.defaultBranch !== "main" ||
      typeof fact.observedAt !== "string"
    ) {
      throw new Error("Finalized GitHub repository operation fact is unavailable or malformed");
    }
    const repository: GitHubRepositoryFact = {
      provider: "github",
      providerId: fact.providerId,
      owner: fact.owner,
      name: fact.name,
      htmlUrl: fact.htmlUrl,
      cloneUrl: fact.cloneUrl,
      private: fact.private,
      defaultBranch: "main",
      observedAt: fact.observedAt,
      ...(typeof fact.operationMarker === "string" ? { operationMarker: fact.operationMarker } : {})
    };
    this.#repositories.set(state.id, repository);
    return repository;
  }

  private database(): CollaborationStateDatabase {
    if (!this.#database) throw new Error("Collaboration runtime is not initialized");
    return this.#database;
  }

  private assertWritable(): void {
    if (!this.#leaseError) {
      try {
        this.database();
        this.#leaseWorker?.assertHeld();
        if (!this.#leaseWorker && this.#leaseWorkerDiagnostics &&
          this.#leaseWorkerDiagnostics.lease.expiresAtMs <= (this.#now?.() ?? Date.now()))
          throw new CollaborationStateError("WRITER_LEASE_STALE", "The confirmed writer lease has expired");
      } catch (error) { this.loseWriterLease(error); }
    }
    if (this.#leaseError) throw new Error("Collaboration writer lease was lost", { cause: this.#leaseError });
  }

  private async saveState(state: ProjectState): Promise<void> {
    this.assertWritable();
    if (["paused", "completed", "cancelled", "stopped"].includes(state.status)) await this.#invocationDispatcher?.flush?.(state.id);
    checkpointWorkflowRecovery(state, { delayMs: this.#harnessRecoveryDelayMs });
    if (["completed", "cancelled"].includes(state.status)) finishWorkflowRecovery(state);
    await this.#storage.saveState(state, () => this.assertWritable());
    this.assertWritable();
    this.armWorkflowRecovery(state);
  }

  private clearWorkflowRecoveryTimer(projectId: string): void {
    const timer = this.#workflowRecoveryTimers.get(projectId);
    if (timer) clearTimeout(timer);
    this.#workflowRecoveryTimers.delete(projectId);
  }

  /** A real scheduled continuation, independent of native handles and role
   * slots. Its checkpoint survives restart; only user intent cancels it. */
  private armWorkflowRecovery(state: ProjectState): void {
    if (this.#shuttingDown || this.#closed || this.#leaseError ||
      !canAutomaticallyRecoverWorkflow(state) || state.status !== "retrying" ||
      !state.workflowRecovery?.pending || this.#workflowRecoveryTimers.has(state.id)) return;
    // A live run owns its own native wait/recovery. Its finally block arms
    // this timer after that exact scheduling fence is released.
    if (this.#runs.has(state.id)) return;
    const delay = Math.max(1, Math.min(60_000, Date.parse(state.workflowRecovery.nextRetryAt) - Date.now()));
    const timer = setTimeout(async () => {
      this.#workflowRecoveryTimers.delete(state.id);
      void this.withProjectLifecycle(state.id, async () => {
        if (this.#shuttingDown || this.#leaseError || !canAutomaticallyRecoverWorkflow(state) ||
          state.status !== "retrying" || this.#runs.has(state.id)) return;
        if (state.workflowRecovery?.pending && Date.parse(state.workflowRecovery.nextRetryAt) > Date.now() + 5) {
          this.armWorkflowRecovery(state);
          return;
        }
        this.assertWritable();
        beginWorkflowRecovery(state);
        if (state.userIntervention?.status === "pending") {
          // Human information can be unavailable indefinitely. Keep checking
          // its durable response without spending model tokens on repeats.
          await this.saveState(state);
          return;
        }
        for (const incident of (await this.database().terminalPushCoordinationIncidents(state.id))) {
          if (incident.status === "manager-failed") await this.database().resumeTerminalPushCoordinatorRecovery(state.id, incident.id);
        }
        state.status = "queued";
        await this.saveState(state);
        await this.resumeProjectLocked(state, false);
      }).catch(async (error: unknown) => {
        if (this.#shuttingDown || this.#leaseError || !canAutomaticallyRecoverWorkflow(state) ||
          this.#cancellingProjects.has(state.id)) return;
        try { await this.appendFailureAttempt(state, { operation: "workflow.recovery", error, metadata: { phase: state.phase } }); }
        catch (auditError) {
          if (auditError instanceof CollaborationStateError && auditError.code === "WRITER_LEASE_STALE") { this.loseWriterLease(auditError); return; }
          console.warn("Workflow recovery failure audit also failed", safeRuntimeError(auditError));
        }
        const failure = classifyDurableFailure(error, {});
        state.status = failure.retryable ? "retrying" : "interrupted";
        state.phase = failure.retryable ? "collaboration:recovering" : "collaboration:repair-required";
        state.lastError = safeRuntimeError(error);
        if (!failure.retryable) {
          state.interruptedAt = nowIso();
          finishWorkflowRecovery(state);
        }
        try { await this.saveState(state); }
        catch { this.armWorkflowRecovery(state); }
      });
    }, delay);
    timer.unref();
    this.#workflowRecoveryTimers.set(state.id, timer);
  }

  private async appendEvent(state: ProjectState, draft: Parameters<ProjectStorage["appendEvent"]>[1]): Promise<TimelineEvent> {
    this.assertWritable();
    const event = await this.#storage.appendEvent(state, draft, () => this.assertWritable());
    this.assertWritable();
    return event;
  }

  writerLeaseHealth(): { status: "ready" | "unavailable"; code?: string; reason?: string;
    failedAt?: string; lastSuccessfulRenewalAt?: string; leaseExpiresAt?: string; epoch?: number } {
    if (!this.#database || this.#closed || this.#shuttingDown) return { status: "unavailable", reason: "Collaboration runtime is not running" };
    if (!this.#leaseError) {
      try { this.assertWritable(); }
      catch (error) { this.loseWriterLease(error); }
    }
    const diagnostics = this.#leaseWorker?.diagnostics() ?? this.#leaseWorkerDiagnostics!;
    return { status: this.#leaseError ? "unavailable" : "ready", epoch: diagnostics.lease.epoch,
      leaseExpiresAt: new Date(diagnostics.lease.expiresAtMs).toISOString(),
      ...(diagnostics.lastSuccessfulRenewalAtMs != null ? { lastSuccessfulRenewalAt: new Date(diagnostics.lastSuccessfulRenewalAtMs).toISOString() } : {}),
      ...(this.#leaseError ? { code: writerLeaseFailureFields(this.#leaseError).code ?? "WRITER_LEASE_UNAVAILABLE",
        reason: safeRuntimeError(this.#leaseError), failedAt: this.#leaseFailedAt } : {}) };
  }

  private withWriterLeaseFailure(project: ProjectState): ProjectState {
    if (["draft", "completed", "cancelled", "stopped"].includes(project.status)) return project;
    const health = this.writerLeaseHealth();
    project.status = hasUserWorkflowPause(project) ? project.status : "interrupted";
    project.phase = "collaboration:writer-lease-lost";
    project.lastError = `服务写入租约失效：${health.reason ?? "续租线程不可用"}。需要恢复服务后接续原任务，项目记录和原会话已保留。`;
    project.currentAgent = undefined; project.queuedAgent = undefined; project.activeInvocationId = undefined;
    project.runtime = { stateRevision: 0, executionCount: 0, ...project.runtime, status: project.status, phase: project.phase,
      waiting: { kind: "service", reason: project.lastError, failedAt: health.failedAt, errorCode: health.code },
      activities: (project.runtime?.activities ?? []).map(activity => ({ ...activity, leaseState: "recovering" as const })),
      primaryActivity: undefined, currentAgent: undefined, activeInvocationId: undefined, leaseState: "recovering" };
    return project;
  }

  private writerLeaseFailureDiagnostics(error: unknown, leaseCheckError?: unknown) {
    const timestampMs = this.#now?.() ?? Date.now();
    const diagnostics = this.#leaseWorker?.diagnostics() ?? this.#leaseWorkerDiagnostics;
    const lease = diagnostics?.lease;
    return {
      timestamp: this.#leaseFailedAt ?? new Date(timestampMs).toISOString(),
      ...((this.#leaseWorkerDiagnostics?.heartbeat ?? this.#leaseHeartbeat) ? { heartbeat: { ...(this.#leaseWorkerDiagnostics?.heartbeat ?? this.#leaseHeartbeat)! } } : {}),
      ...writerLeaseFailureFields(error),
      ...(lease ? { leaseEpoch: lease.epoch, leaseExpiresAt: new Date(lease.expiresAtMs).toISOString(),
        leaseServiceId: boundedSharedText(lease.serviceId, 200),
        leaseInstanceId: boundedSharedText(lease.instanceId, 200),
        leaseHostId: boundedSharedText(lease.hostId, 200), leaseRemainingMs: lease.expiresAtMs - timestampMs } : {}),
      lastSuccessfulRenewalAt: diagnostics?.lastSuccessfulRenewalAtMs != null
        ? new Date(diagnostics.lastSuccessfulRenewalAtMs).toISOString() : null,
      ...(diagnostics?.lastRenewalAttempt ? { lastRenewalAttempt: diagnostics.lastRenewalAttempt } : {}),
      ...(this.#leaseWorkerDiagnostics?.leaseCheck ? { leaseCheck: this.#leaseWorkerDiagnostics.leaseCheck } : {}),
      ...(leaseCheckError !== undefined ? { leaseCheckFailure: writerLeaseFailureFields(leaseCheckError) } : {})
    };
  }

  private loseWriterLease(error: unknown, leaseCheckError?: unknown): void {
    if (this.#leaseError) return;
    this.#leaseError = error instanceof Error ? error : new Error("Writer lease renewal failed", { cause: error });
    this.#leaseFailedAt = this.#leaseWorkerDiagnostics?.failedAt ?? new Date(this.#now?.() ?? Date.now()).toISOString();
    try {
      console.error("Collaboration writer lease renewal failed; writer fenced",
        this.writerLeaseFailureDiagnostics(error, leaseCheckError));
    } catch { /* A diagnostic failure must not prevent fencing/aborting work. */ }
    void this.#leaseWorker?.stop().catch(error => console.warn("Failed to stop the fenced heartbeat", safeRuntimeError(error)));
    for (const controller of this.#controllers.values()) controller.abort();
    // Stop exact resident handles, without further database mutations or an
    // automatic lease reacquisition that could defeat a replacement writer.
    void Promise.allSettled([...this.#residents.values()].map(({ handle }) => handle.close()));
  }
}

function writerLeaseFailureFields(error: unknown) {
  const fields = error && typeof error === "object" ? error as Record<string, unknown> : {};
  return {
    error: safeRuntimeError(error),
    ...(typeof fields.code === "string" ? { code: boundedSharedText(fields.code, 200) } : {}),
    ...(typeof fields.errcode === "number" ? { sqliteCode: fields.errcode,
      sqlitePrimaryCode: fields.errcode & 0xff } : {}),
    ...(typeof fields.errstr === "string" ? { sqliteError: boundedSharedText(fields.errstr, 200) } : {}),
    ...(error instanceof CollaborationStateError && error.code === "WRITER_LEASE_STALE" &&
      error.details.expectedLease ? { leaseCheck: {
        checkedAtMs: error.details.checkedAtMs, expectedLease: error.details.expectedLease,
        observedLease: error.details.observedLease
      } } : {})
  };
}

export function safeRepositoryName(title: string, projectId: string): string {
  const suffix = projectId.replace(/^prj_/, "").slice(-10).toLowerCase() || "project";
  const stem = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/gu, "-")
    .replace(/[-_.]{2,}/gu, "-")
    .replace(/^[^a-z0-9]+|[^a-z0-9]+$/gu, "") || "openfars";
  return `${stem.slice(0, Math.max(1, 89 - suffix.length)).replace(/[-_.]+$/gu, "")}-${suffix}`;
}

/**
 * A stop-confirmed restart may advance ownership without rerunning the model.
 * In that one execution lineage, already-durable publication intent remains
 * valid; future epochs and every other execution stay fenced out.
 */
export function inheritedArtifactPublicationIntents(
  events: readonly CollaborationEvent[],
  execution: Pick<MemberExecution, "id" | "ownershipEpoch">
): CollaborationEvent[] {
  const owned = events.filter((event) =>
    event.type === "artifact.publication.staged" &&
    event.executionId === execution.id &&
    event.ownershipEpoch !== undefined &&
    Number.isSafeInteger(event.ownershipEpoch) &&
    event.ownershipEpoch >= 1 &&
    event.ownershipEpoch <= execution.ownershipEpoch
  ).sort((left, right) => left.seq - right.seq);
  // Replay only explicit Agent replacements. A later unrelated publication
  // never silently clears an invalid intent, including after service restart.
  let active: CollaborationEvent[] = [];
  for (const event of owned) {
    if (typeof event.payload.replacesPath === "string") {
      active = active.filter((prior) => prior.payload.path !== event.payload.replacesPath);
    }
    active.push(event);
  }
  return active;
}

/**
 * Keep assignment prompts bounded without hiding the current round once a
 * long-running group has accumulated more than fifty historical tasks.
 * The complete current FIFO batch wins first, then dependency provenance,
 * with the newest terminal history filling any remaining room.
 */
export function groupAssignmentContextTasks(
  tasks: readonly WorkTask[],
  currentTaskId: string,
  limit = 50
): WorkTask[] {
  if (!Number.isSafeInteger(limit) || limit <= 0) {
    throw new Error("Group assignment task context limit must be a positive safe integer");
  }
  const ordered = [...tasks].sort((left, right) =>
    left.queueOrdinal - right.queueOrdinal || left.id.localeCompare(right.id));
  const byId = new Map(ordered.map((task) => [task.id, task]));
  const selected: WorkTask[] = [];
  const selectedIds = new Set<string>();
  const add = (task: WorkTask | undefined) => {
    if (!task || selected.length >= limit || selectedIds.has(task.id)) return false;
    selected.push(task);
    selectedIds.add(task.id);
    return true;
  };

  const current = byId.get(currentTaskId);
  add(current);
  const terminal = new Set<WorkTask["status"]>(["succeeded", "failed", "cancelled"]);
  for (const task of ordered) {
    if (!terminal.has(task.status)) add(task);
  }
  const dependencyQueue = [...(current?.dependencyTaskIds ?? [])];
  const visitedDependencies = new Set<string>();
  while (dependencyQueue.length > 0 && selected.length < limit) {
    const dependencyId = dependencyQueue.shift()!;
    if (visitedDependencies.has(dependencyId)) continue;
    visitedDependencies.add(dependencyId);
    const dependency = byId.get(dependencyId);
    if (!dependency) continue;
    add(dependency);
    dependencyQueue.push(...dependency.dependencyTaskIds);
  }

  for (let index = ordered.length - 1; index >= 0; index -= 1) add(ordered[index]);
  return selected.sort((left, right) =>
    left.queueOrdinal - right.queueOrdinal || left.id.localeCompare(right.id));
}

function stableRuntimeId(
  prefix: "node" | "group" | "task" | "execution" | "inv",
  requestId: string
): string {
  const digest = createHash("sha256").update(requestId).digest("hex").slice(0, 32);
  return prefix === "inv" ? `inv_${digest}` : `${prefix}-${digest}`;
}

function groupLeaderInvocationId(
  projectId: string,
  groupRunId: string,
  coordinatorEpoch: number
): string {
  return stableRuntimeId(
    "inv",
    `group-leader:${projectId}:${groupRunId}:${coordinatorEpoch}`
  );
}

function executionEpochIdentity(
  execution: Pick<MemberExecution, "id" | "ownershipEpoch">
): string {
  // Preserve the original epoch-one identity for existing projects while
  // guaranteeing that every recovered writer receives a disjoint namespace.
  return execution.ownershipEpoch === 1
    ? execution.id
    : `${execution.id}-epoch-${execution.ownershipEpoch}`;
}

function canonicalFinalRepairForExecution(
  projection: Pick<CredentialFreeProjectStateProjection, "executions" | "pullRequests">,
  group: Pick<GroupRun, "id" | "groupBranch" | "integrationOwnerExecutionId">,
  execution: MemberExecution
): MemberExecution | undefined {
  if (
    execution.groupRunId !== group.id ||
    execution.purpose !== "final-integration" ||
    execution.executionBranch !== group.groupBranch ||
    group.integrationOwnerExecutionId !== execution.id ||
    !execution.predecessorExecutionId
  ) return undefined;
  const repair = projection.executions.find((candidate) =>
    candidate.id === execution.predecessorExecutionId &&
    candidate.groupRunId === group.id &&
    candidate.purpose === "final-integration" &&
    candidate.executionBranch !== group.groupBranch &&
    candidate.status === "succeeded"
  );
  if (!repair) return undefined;
  const repairPull = projection.pullRequests.find((pull) =>
    pull.ownerExecutionId === repair.id &&
    pull.status === "merged" &&
    pull.head === repair.executionBranch &&
    pull.base === group.groupBranch
  );
  return repairPull ? repair : undefined;
}

function executionGitOperationId(
  kind: string,
  execution: Pick<MemberExecution, "id" | "ownershipEpoch">,
  suffix?: string
): string {
  return [kind, executionEpochIdentity(execution), suffix].filter(Boolean).join("-");
}

function executionTask(
  state: Pick<ProjectState, "tasks">,
  execution: Pick<MemberExecution, "taskId">
): WorkTask | undefined {
  return (state.tasks ?? []).find((task) => task.id === execution.taskId);
}

function safeGitNarrative(value: string, maximum: number, singleLine = false): string {
  const safe = boundedSharedText(value, maximum)
    .replace(/\b(?:gh[pousr]_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+)\b/g, "[REDACTED]")
    .replace(/\bBearer\s+[^\s]+/gi, "Bearer [REDACTED]");
  return singleLine ? safe.replace(/\s+/g, " ").trim() : safe;
}

function pullRequestBody(
  state: Pick<ProjectState, "tasks">,
  execution: MemberExecution,
  output: string,
  git: { commitSha: string; base: string; operationId: string }
): string {
  const task = executionTask(state, execution);
  const reason = safeGitNarrative(output, 500, true);
  const generatedAt = nowIso();
  return [
    "## OpenFARS attribution",
    "",
    `- Agent 作者：\`${execution.agentId}\``,
    `- Agent 角色：\`${execution.purpose}\``,
    `- Task：\`${execution.taskId}\`${task?.assignment ? ` — ${safeGitNarrative(task.assignment, 240, true)}` : ""}`,
    `- Execution：\`${execution.id}\``,
    ...(execution.groupRunId ? [`- Collaboration：\`${execution.groupRunId}\``] : []),
    `- Commit：\`${git.commitSha}\``,
    `- 分支：\`${execution.executionBranch}\` → \`${git.base}\``,
    `- Operation：\`${git.operationId}\``,
    `- 生成时间：${generatedAt}`,
    `- 操作原因：${reason || "完成当前分工并提交可审计交付"}`,
    "",
    "## Agent handoff",
    "",
    safeGitNarrative(output, 20_000)
  ].join("\n");
}

function pullRequestTitle(
  state: Pick<ProjectState, "title" | "tasks">,
  execution: MemberExecution
): string {
  const task = executionTask(state, execution);
  const taskTitle = safeGitNarrative(task?.assignment ?? state.title, 140, true);
  return `[Agent ${execution.agentId}] ${taskTitle}`;
}

function pullRecoveryFactKey(pull: GitHubPullRequestFact): string {
  return createHash("sha256").update([
    String(pull.providerNumber),
    pull.status,
    pull.head,
    pull.headSha,
    pull.base,
    pull.mergeCommitSha ?? ""
  ].join("\0")).digest("hex").slice(0, 16);
}

function executionStopObservationRequestId(
  scope: "restart-stop" | "cancel-reconcile",
  execution: Pick<MemberExecution, "id" | "ownershipEpoch">,
  stopped: boolean,
  evidence: Readonly<Record<string, unknown>> | undefined
): string {
  const identity = executionEpochIdentity(execution);
  if (stopped) return `${scope}-confirmed-${identity}`;
  const factKey = createHash("sha256")
    .update(JSON.stringify(canonicalRuntimeFact(evidence ?? {})))
    .digest("hex")
    .slice(0, 32);
  return `${scope}-unconfirmed-${identity}-${factKey}`;
}

function canonicalRuntimeFact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalRuntimeFact);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, canonicalRuntimeFact(item)])
    );
  }
  return value;
}

function acceptedControlHash(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(canonicalRuntimeFact(value)))
    .digest("hex");
}

function groupTaskCompletionKey(group: Pick<GroupRun, "id" | "coordinatorEpoch">, inputId: string): string {
  return `management:${group.id}:${group.coordinatorEpoch}:${inputId}`;
}

function groupTaskCompletionRequestId(taskId: string): string {
  return `group-task-complete-${createHash("sha256").update(taskId).digest("hex")}`;
}

function acceptedGroupControlIdentity(
  projectId: string,
  nodeRunId: string,
  group: Pick<GroupRun, "id" | "coordinatorEpoch">,
  input: Pick<{ inputId: string; prompt: string }, "inputId" | "prompt">
): { requestId: string; semanticInputHash: string } {
  const semanticInputHash = acceptedControlHash({
    protocol: "accepted-group-control-v1",
    projectId,
    nodeRunId,
    groupRunId: group.id,
    coordinatorEpoch: group.coordinatorEpoch,
    inputId: input.inputId,
    prompt: input.prompt
  });
  return {
    requestId: `accepted-group-control-${semanticInputHash}`,
    semanticInputHash
  };
}

function mainRouteTaskCompletionKey(nodeRunId: string, routeEpoch: number, inputId: string): string {
  return `main-management:${nodeRunId}:${routeEpoch}:${inputId}`;
}
function mainRouteTaskCompletionRequestId(taskId: string): string {
  return `main-task-completion-${createHash("sha256").update(taskId).digest("hex")}`;
}

function acceptedMainRouteIdentity(
  projectId: string,
  nodeRunId: string,
  assignment: string
): { semanticInputHash: string } {
  // A service retry changes invocation/attempt identities. They must not
  // change the semantic key for the already accepted route decision.
  const semanticInputHash = acceptedControlHash({
    protocol: "accepted-main-route-v1",
    projectId,
    nodeRunId,
    assignment
  });
  return { semanticInputHash };
}

function acceptedMainControlRequestId(
  semanticInputHash: string,
  sequence: number
): string {
  return `accepted-main-control-${semanticInputHash}-${sequence}`;
}

function acceptedGroupControlResult(fact: AcceptedGroupControlAction): AgentRunResult {
  return {
    handoff: `Durably accepted group control action: ${fact.action.tool}`,
    controlActions: [{
      projectId: fact.projectId,
      agent: fact.actorAgentId,
      invocationId: fact.invocationId,
      callId: fact.callId,
      stateVersion: fact.stateVersion,
      receivedAt: fact.acceptedAt,
      action: fact.action
    }]
  };
}

function acceptedMainRouteDecision(
  facts: readonly AcceptedMainRouteAction[],
  sourceOutput: string
): {
  targetNodeId: string;
  decisionRequestId: string;
  output?: string;
  intervention?: Extract<ControlAction, { tool: "request_user" }>;
  decisionAction?: Extract<ControlAction,
    { tool: "route_to_agent" | "request_user" | "apply_workflow" | "complete_project" }>;
  controlActions?: ControlActionEnvelope[];
  acceptedActions: AcceptedMainRouteAction[];
} {
  const decision = facts.find((fact) => fact.action.tool !== "select_display");
  if (!decision || decision.action.tool === "select_display") {
    throw new Error("Accepted Main control sequence has no orchestration decision");
  }
  const controlActions = facts.map((fact) => ({
    projectId: fact.projectId,
    agent: "main" as const,
    invocationId: fact.invocationId,
    callId: fact.callId,
    stateVersion: fact.stateVersion,
    receivedAt: fact.acceptedAt,
    action: fact.action
  }));
  const common = {
    decisionAction: decision.action,
    controlActions,
    acceptedActions: [...facts]
  };
  if (decision.action.tool === "request_user") {
    return {
      targetNodeId: "user",
      decisionRequestId: decision.callId,
      output: decision.action.rationale,
      intervention: decision.action,
      ...common
    };
  }
  if (decision.action.tool === "complete_project") {
    return {
      targetNodeId: "finish",
      decisionRequestId: decision.callId,
      output: decision.action.rationale,
      ...common
    };
  }
  if (decision.action.tool === "apply_workflow") {
    return {
      targetNodeId: "__apply_workflow__",
      decisionRequestId: decision.callId,
      output: [
        "Historical accepted Main proposal. Its current publication status is checked separately; do not repeat it automatically.",
        JSON.stringify({ tool: decision.action.tool, path: decision.action.path, rationale: decision.action.rationale,
          acceptedSequence: decision.sequence, acceptedRouteEpoch: decision.routeEpoch }),
        "Inspect the current workflow revision and choose only the next task's action.",
        decision.action.rationale
      ].join("\n"),
      ...common
    };
  }
  return {
    targetNodeId: decision.action.target,
    decisionRequestId: decision.callId,
    output: decision.action.assignment ?? decision.action.context ??
      decision.action.rationale ?? sourceOutput,
    ...common
  };
}

function isPathInside(root: string, candidate: string): boolean {
  const relative = path.relative(path.resolve(root), path.resolve(candidate));
  return relative.length > 0 && relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

export async function ensureExactDirectorySymlink(
  target: string,
  linkPath: string,
  verifiedTargets: readonly string[] = [target]
): Promise<void> {
  try {
    await fs.symlink(target, linkPath, process.platform === "win32" ? "junction" : "dir");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    const info = await fs.lstat(linkPath);
    if (!info.isSymbolicLink()) {
      throw new Error("Recovered management workspace has a mismatched workflow link");
    }
    const resolvedLink = path.resolve(await fs.realpath(linkPath));
    const resolvedTarget = path.resolve(await fs.realpath(target));
    // Only ProjectStorage's explicitly verified project roots may supply
    // alternate bind spellings. The Agent retains its original cwd, link,
    // memory and proposal; the system validates the same authoritative
    // directory rather than rewriting the Agent's scene or doing its work.
    if (resolvedLink !== resolvedTarget) {
      const allowed = new Set(verifiedTargets.map((directory) => path.resolve(directory)));
      if (!allowed.has(resolvedLink) || !allowed.has(resolvedTarget)) {
        throw new Error("Recovered management workspace has a mismatched workflow link");
      }
    }
    const [actualDirectory, expectedDirectory] = await Promise.all([
      fs.lstat(resolvedLink, { bigint: true }), fs.lstat(resolvedTarget, { bigint: true })
    ]);
    if (!actualDirectory.isDirectory() || actualDirectory.isSymbolicLink() ||
      !expectedDirectory.isDirectory() || expectedDirectory.isSymbolicLink() ||
      actualDirectory.dev !== expectedDirectory.dev || actualDirectory.ino !== expectedDirectory.ino) {
      throw new Error("Recovered management workspace has a mismatched workflow link");
    }
  }
}

/** Bootstrap once. A resumed Agent owns any existing edits to its proposal;
 * the system supplies current authoritative inputs without overwriting it. */
async function ensureMainWorkflowProposalFile(filePath: string, content: string): Promise<void> {
  try { await fs.writeFile(filePath, content, { flag: "wx", mode: 0o600 }); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    const info = await fs.lstat(filePath);
    if (!info.isFile() || info.isSymbolicLink() || info.nlink !== 1 || await fs.realpath(filePath) !== filePath) {
      throw new Error("Main's retained workflow proposal is not a canonical regular file");
    }
  }
}

async function writeImmutableRecoveryFile(
  filePath: string,
  content: string | Buffer,
  mode: number
): Promise<void> {
  const expected = Buffer.isBuffer(content) ? content : Buffer.from(content, "utf8");
  try {
    await fs.writeFile(filePath, expected, { flag: "wx", mode });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    const [actual, info] = await Promise.all([fs.readFile(filePath), fs.lstat(filePath)]);
    if (!info.isFile() || info.isSymbolicLink() || info.nlink !== 1 ||
      (process.platform === "win32"
        ? (info.mode & 0o200) !== (mode & 0o200)
        : (info.mode & 0o777) !== mode) || !actual.equals(expected)) {
      throw new Error("Recovered management input does not match its durable invocation");
    }
  }
}


/** Describe terminal authority without hiding a legal finish candidate. */
export function mainRouteTargetInstructions(sourceIsMain: boolean, candidates: readonly string[]): string[] {
  return [
    `Allowed route targets: ${candidates.join(", ") || "none"}.`,
    ...(candidates.includes("finish") ? [sourceIsMain
      ? "finish is an authorized terminal choice: use complete_project if the project is ready to end."
      : "finish is an authorized workflow terminal route: use route_to_agent with target finish and a non-empty assignment if this path is ready to end. This is separate from finish_task for your own management task."] : [])
  ];
}

function assertScopedSessionIdentity(state: ProjectState, agentId: string): void {
  const prefix = `${agentId}::collaboration:`;
  const scopedKeys = new Set([
    ...Object.keys(state.agentSessionIds ?? {}),
    ...Object.keys(state.agentSessions ?? {})
  ].filter((key) => key.startsWith(prefix)));
  if (scopedKeys.size > 0) {
    throw new Error(
      `Agent ${agentId} has legacy scope-specific sessions; resolve their identity before scoped execution`
    );
  }
}

function mainRecoveryFacts(group: GroupRun): Readonly<Record<string, unknown>> {
  return {
    groupRunId: group.id,
    nodeRunId: group.nodeRunId,
    coordinatorEpoch: group.coordinatorEpoch,
    groupBranch: group.groupBranch
  };
}

function sameProjectionWorkflowConfiguration(
  left: Pick<CredentialFreeProjectStateProjection, "workflowRevision" | "workflowSnapshot" | "scopedConfiguration">,
  right: Pick<CredentialFreeProjectStateProjection, "workflowRevision" | "workflowSnapshot" | "scopedConfiguration">
): boolean {
  // Business events advance stateRevision independently. They must not discard
  // resource validation, while A -> B -> A must invalidate it by revision.
  return left.workflowRevision === right.workflowRevision &&
    isDeepStrictEqual(left.workflowSnapshot, right.workflowSnapshot) &&
    isDeepStrictEqual(left.scopedConfiguration, right.scopedConfiguration);
}

function mergeProjection(
  state: ProjectState,
  projection: CredentialFreeProjectStateProjection,
  eventSeq: number
): void {
  state.git = structuredClone(projection.git);
  const orchestration = structuredClone(
    projection.workflowSnapshot as AgentOrchestrationTemplate
  );
  // S intentionally stores only the credential-free workflow. If S commits a
  // revision but state.json publication crashes, reconstruct the exact
  // credential-bearing Agent map from the last file state during recovery.
  let nextAgents = reconcileAgentConfigsForWorkflow(state.agents, orchestration);
  if (projection.scopedConfiguration) {
    nextAgents = reconcileAgentConfigsForWorkflow(restoreAgentConfiguration(projection.scopedConfiguration, state.agents), orchestration);
    state.skillDefinitions = structuredClone(projection.scopedConfiguration.skillDefinitions);
    state.mcpDefinitions = structuredClone(projection.scopedConfiguration.mcpDefinitions);
  }
  archiveRemovedWorkflowAgentSessions(state, nextAgents, projection.workflowRevision);
  state.agents = nextAgents;
  state.orchestration = orchestration;
  state.workflowRevision = projection.workflowRevision;
  state.activeNodeRunId = projection.activeNodeRunId;
  state.nodeRuns = structuredClone(projection.nodeRuns);
  state.groupRuns = structuredClone(projection.groupRuns);
  state.scopedGroupRuns = projection.scopedGroupRuns ? structuredClone(projection.scopedGroupRuns) : undefined;
  state.scopedGroupIssues = projection.scopedGroupIssues ? structuredClone(projection.scopedGroupIssues) : undefined;
  state.scopedManagementFailures = projection.scopedManagementFailures ? structuredClone(projection.scopedManagementFailures) : undefined;
  state.scopedManagementTurns = projection.scopedManagementTurns ? structuredClone(projection.scopedManagementTurns) : undefined;
  state.scopedArrivals = projection.scopedArrivals ? structuredClone(projection.scopedArrivals) : undefined;
  state.scopedExecutions = projection.scopedExecutions ? structuredClone(projection.scopedExecutions) : undefined;
  state.scopedAgentReports = projection.scopedAgentReports ? structuredClone(projection.scopedAgentReports) : undefined;
  state.scopedFinalIntegrations = projection.scopedFinalIntegrations ? structuredClone(projection.scopedFinalIntegrations) : undefined;
  state.scopedPullRequests = projection.scopedPullRequests ? structuredClone(projection.scopedPullRequests) : undefined;
  state.scopedAgentMerges = projection.scopedAgentMerges ? structuredClone(projection.scopedAgentMerges) : undefined;
  state.scopedGroupFinalMerges = projection.scopedGroupFinalMerges ? structuredClone(projection.scopedGroupFinalMerges) : undefined;
  state.tasks = structuredClone(projection.tasks);
  state.executions = structuredClone(projection.executions);
  state.pullRequests = structuredClone(projection.pullRequests);
  state.additionalPullRequests = projection.additionalPullRequests ? structuredClone(projection.additionalPullRequests) : undefined;
  state.operations = structuredClone(projection.operations);
  state.failureAttempts = structuredClone(projection.failureAttempts);
  state.failureSummary = structuredClone(projection.failureSummary);
  state.gitRetryScheduling = structuredClone(projection.gitRetryScheduling);
  const runtime = deriveProjectRuntimeProjection(projection, state);
  state.runtime = runtime;
  if (state.pauseRequest && !["cancelling", "cancelled", "completed"].includes(state.status)) {
    state.status = runtime.status;
    state.phase = runtime.phase;
  }
  const executionTasksByAgent = new Map<string, Set<string>>();
  for (const execution of projection.executions) {
    const tasks = executionTasksByAgent.get(execution.agentId) ?? new Set<string>();
    tasks.add(execution.taskId);
    executionTasksByAgent.set(execution.agentId, tasks);
  }
  state.executionCounts = Object.fromEntries(
    state.orchestration.agents.map(({ name }) => [
      name,
      executionTasksByAgent.get(name)?.size ?? 0
    ])
  );
  state.collaboration = {
    stateRevision: projection.stateRevision,
    ...(projection.businessState?.length ? { businessState: structuredClone(projection.businessState) } : {}),
    ...(projection.formalState ? { formalState: structuredClone(projection.formalState) } : {}),
    frozen: projection.frozen,
    ...(projection.freezeReason ? { freezeReason: projection.freezeReason } : {}),
    eventSeq,
    routeOutbox: structuredClone(projection.routeOutbox),
    usage: structuredClone(projection.usage)
  };
}

function collaborationSourceSeq(event: TimelineEvent): number {
  const value = event.data?.collaborationSeq;
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : 0;
}

export function maximumMirroredCollaborationSeq(
  events: ReadonlyArray<Pick<TimelineEvent, "data">>,
  baseline = 0
): number {
  let maximum = baseline;
  for (const event of events) {
    maximum = Math.max(maximum, collaborationSourceSeq(event as TimelineEvent));
  }
  return maximum;
}

function collaborationEventDraft(event: CollaborationEvent) {
  const type = canonicalEventType(event.type);
  const failedAttempt = event.type === "failure.attempt.recorded" &&
    event.payload.status === "failed";
  return {
    type,
    level: failedAttempt || event.type.includes("failed") || event.type.includes("frozen")
      ? "error" as const
      : "info" as const,
    message: collaborationEventMessage(event),
    eventId: event.eventId,
    ...(event.requestId ? { requestId: event.requestId } : {}),
    ...(event.workflowRevision !== undefined ? { workflowRevision: event.workflowRevision } : {}),
    ...(event.nodeId ? { nodeId: event.nodeId } : {}),
    ...(event.nodeRunId ? { nodeRunId: event.nodeRunId } : {}),
    ...(event.groupRunId ? { groupRunId: event.groupRunId } : {}),
    ...(event.agentId ? { agentId: event.agentId } : {}),
    ...(event.taskId ? { taskId: event.taskId } : {}),
    ...(event.executionId ? { executionId: event.executionId } : {}),
    ...(event.invocationId ? { invocationId: event.invocationId } : {}),
    ...(event.ownershipEpoch !== undefined ? { ownershipEpoch: event.ownershipEpoch } : {}),
    ...(event.coordinatorEpoch !== undefined ? { coordinatorEpoch: event.coordinatorEpoch } : {}),
    data: { collaborationSeq: event.seq, sourceType: event.type, ...event.payload }
  };
}

function canonicalEventType(type: string): TimelineEvent["type"] {
  if (type === "user.input.delivered") return "user.input.delivered";
  if (type.startsWith("scoped.group.")) return type.endsWith("activated") ? "collaboration.group.started"
    : type.endsWith("completed") ? "collaboration.group.completed" : "collaboration.group.updated";
  if (type === "scoped.final.native.opened") return "collaboration.execution.started";
  if (type === "scoped.final.native.stopped") return "collaboration.execution.updated";
  if (type.startsWith("scoped.agent.")) return type.endsWith("native_opened") ? "collaboration.execution.started"
    : type.endsWith("completed") ? "collaboration.execution.completed" : "collaboration.execution.updated";
  if (type.startsWith("scoped.arrival.")) return type.includes("failed") ? "collaboration.execution.failed" : "collaboration.execution.updated";
  if (type.includes("scoped.") && type.endsWith("pull_observed")) return "pull.request.observed";
  if (type === "scoped.workflow.applied" || type === "scoped.configuration.applied") return "workflow.reconfigured";
  if (type === "scoped.leader.action.accepted") return "control.action.committed";
  if (type === "scoped.management.failure") return "collaboration.group.failed";
  if (type === "scoped.management.escalated") return "collaboration.group.updated";
  if (type === "failure.attempt.recorded") return "failure.attempt.recorded";
  if (type === "usage.persistence.failed") return "usage.persistence.failed";
  if (type === "git.initialization.checkpoint") return "git.initialization.updated";
  if (type === "display.selected") return "display.selected";
  if (type === "main.management_memory.committed") return "control.action.committed";
  if (type === "main.workflow_projection.committed") return "control.action.committed";
  if (type === "workflow.revision.created") return "workflow.reconfigured";
  if (type === "node.activated") return "workflow.node.started";
  if (type === "node.completed") return "workflow.node.completed";
  if (type.startsWith("group.task")) return type.includes("assigned")
    ? "collaboration.task.assigned"
    : "collaboration.task.updated";
  if (type.startsWith("group.")) {
    if (type === "group.activated") return "collaboration.group.started";
    if (type === "group.completed") return "collaboration.group.completed";
    if (type.includes("failed") || type.includes("cancelled")) return "collaboration.group.failed";
    return "collaboration.group.updated";
  }
  if (type.startsWith("execution.") || type === "node.execution.started") {
    if (type.endsWith("succeeded")) return "collaboration.execution.completed";
    if (type.includes("failed")) return "collaboration.execution.failed";
    if (type === "node.execution.started") return "collaboration.execution.started";
    if (type.includes("queued")) return "collaboration.execution.queued";
    return "collaboration.execution.updated";
  }
  if (type.startsWith("pull_request.") || type.startsWith("pull.request.")) {
    return type.includes("observed") || type.includes("merged")
      ? "pull.request.observed"
      : "pull.request.updated";
  }
  if (
    type === "main.failed.frozen"
    || type === "main.route.failed.frozen"
    || type === "main.route.recovery.retryable"
    || type === "main.route.recovery.waiting_user"
  ) return "collaboration.main.frozen";
  if (type === "main.recovered" || type === "main.route.recovered") {
    return "collaboration.main.recovered";
  }
  return "workflow.node.updated";
}

function collaborationEventMessage(event: CollaborationEvent): string {
  const agent = event.agentId ? `Agent ${event.agentId}` : "协作成员";
  const pullRequest = typeof event.payload.pullRequestNumber === "number"
    ? `PR #${event.payload.pullRequestNumber}`
    : typeof event.payload.providerNumber === "number"
      ? `PR #${event.payload.providerNumber}`
      : "PR";
  const target = typeof event.payload.base === "string" && event.payload.base.trim()
    ? event.payload.base.trim()
    : undefined;
  const status = typeof event.payload.to === "string" ? event.payload.to : undefined;
  switch (event.type) {
    case "scoped.group.activated": return "协作组 Workflow 已启动，入口并行路径已入队";
    case "scoped.agent.native_opened": return `${agent} 正在原固定目录和 session 中执行组内任务`;
    case "scoped.agent.native_stopped": return `${agent} 的原生执行已确认停止，保留交付与队列记录`;
    case "scoped.management.escalated": return "组 Leader 无法解决，故障已交直接上级协调";
    case "scoped.management.failure": return `范围化管理技术故障（第 ${typeof event.payload.attempt === "number" ? event.payload.attempt : "?"} 次）：${typeof event.payload.reason === "string" ? event.payload.reason : "未提供错误摘要"}`;
    case "scoped.leader.action.accepted": return "本轮范围化管理动作已正式接受";
    case "scoped.agent.skipped": return "全局 Main 已批准跳过，等待所属组明确接续";
    case "scoped.recovery.pull_observed": return "保留任务的 PR 已完成权威恢复对账";
    case "scoped.final.native.opened": return `${agent} 正在原 session 中处理组最终交付的 GitHub 返回`;
    case "scoped.final.native.stopped": return `${agent} 的组交付原生调用已确认停止`;
    case "scoped.group.final_integration_started": return "全部必要路径已交付，开始规范组分支最终 PR 集成";
    case "scoped.group.completed": return "组最终 PR 已合并并同步，协作组完成";
    case "scoped.project.cancelled": return "协作已停止，原分支、成果及 session 均保留";
    case "failure.attempt.recorded": {
      const scope = typeof event.payload.scope === "string" ? event.payload.scope : "runtime";
      const operation = typeof event.payload.operation === "string"
        ? event.payload.operation
        : "operation";
      return event.payload.status === "succeeded"
        ? `${scope}/${operation} 重试成功`
        : `${scope}/${operation} 失败：${typeof event.payload.redactedMessage === "string"
          ? event.payload.redactedMessage
          : "未提供错误摘要"}`;
    }
    case "group.activated": return "协作组开始执行";
    case "group.tasks.assigned": return "协作任务已分配，成员即将并行执行";
    case "group.task.claimed": return `${agent} 开始执行成员任务`;
    case "node.execution.started": return `${agent} 开始执行任务`;
    case "execution.launch.started": return `${agent} 的执行环境已启动`;
    case "execution.handed_off": return `${agent} 已提交任务交接结果`;
    case "execution.checkpoint.committed": return `${agent} 提交 commit ${typeof event.payload.commitSha === "string" ? event.payload.commitSha.slice(0, 8) : ""}`.trim();
    case "execution.succeeded": return `${agent} 已完成成员任务`;
    case "execution.status.changed": return status
      ? `${agent} 的任务状态更新为 ${status}`
      : `${agent} 的任务状态已更新`;
    case "pull_request.observed": return target
      ? `${agent} 的 ${pullRequest} 状态已更新（目标 ${target}）`
      : `${agent} 的 ${pullRequest} 状态已更新`;
    case "pull_request.merged": return target
      ? `${agent} 的 ${pullRequest} 已合入 ${target}`
      : `${agent} 的 ${pullRequest} 已合并`;
    case "group.final_integration.started": return `${agent} 开始最终集成`;
    case "group.completion.decided": return "协作组已完成集成决策";
    case "group.completed": return "协作组执行完成";
    case "group.member.failed": return `${agent} 执行失败`;
    case "group.paused.all_members_failed": return "所有协作成员执行失败，协作组已暂停";
    case "group.cancellation.requested": return "协作组正在停止";
    case "group.cancelled": return "协作组已停止";
    default: return `${agent} 的协作状态已更新`;
  }
}

export function managementMemoryDocument(
  projectId: string,
  snapshot?: ManagementMemorySnapshot,
  currentCoordinatorId?: string
): string {
  let remainingEntryCharacters = 16_000;
  const entrySections: string[] = [];
  const entries = snapshot?.entries ?? [];
  const own = currentCoordinatorId
    ? entries.find((entry) => entry.agentId === currentCoordinatorId)
    : undefined;
  const prioritized = [
    ...(own ? [own] : []),
    ...entries.filter((entry) => entry !== own)
  ].slice(0, 32);
  for (const entry of prioritized) {
    if (remainingEntryCharacters <= 0) break;
    const content = boundedSharedText(
      entry.content,
      Math.min(2_000, remainingEntryCharacters)
    );
    remainingEntryCharacters -= content.length;
    entrySections.push(
      "",
      `## ${boundedSharedText(entry.agentId, 128)}`,
      "",
      `Source: ${boundedSharedText(
        `${snapshot?.branch ?? "management/memory"}@${snapshot?.commitSha ?? "unknown"}:${entry.path}`,
        512
      )}`,
      "",
      content
    );
  }
  return [
    "# Group management snapshot",
    "",
    `Project: ${projectId}`,
    `Provenance: ${boundedSharedText(
      snapshot?.provenance ?? "No prior management-memory snapshot",
      512
    )}`,
    "",
    "Coordination only; business worktrees are not available.",
    "Authoritative workflow context (read-only): use this turn's Workflow overview and its definition.json, current-state.json and agents.json detail references. These inputs match your current management scope; use the exact native file paths supplied in this turn.",
    ...entrySections,
    ""
  ].join("\n");
}

function groupControlInvalidField(action: ControlAction, error: unknown): string {
  if (error instanceof CollaborationStateError) {
    if (error.code === "STALE_COORDINATOR_EPOCH") return "coordinatorEpoch";
    if (typeof error.details.expectedCoordinatorAgentId === "string") return "agent";
  }
  if (action.tool === "assign_group_tasks") return "tasks";
  if (action.tool === "request_group_integration") return "integrationOwnerAgentId";
  if (action.tool === "complete_group") return "action";
  return "tool";
}

function durableAttemptId(prefix: string, values: readonly string[]): string {
  return `${prefix}:${createHash("sha256")
    .update(values.join("\0"))
    .digest("hex")
    .slice(0, 40)}`;
}

function controlAttemptOperation(tool: ControlAction["tool"] | undefined): string {
  return `revalidate:${tool ?? "unknown"}`;
}

function gitInitializationFailureCode(state: ProjectGitState): string {
  if (state.status === "waiting_for_github") return "GITHUB_WAITING_FOR_AUTHORIZATION";
  const message = state.initialization?.error ?? "";
  return /^([A-Z][A-Z0-9_]{2,})(?::|\s|$)/.exec(message)?.[1] ??
    "GIT_INITIALIZATION_FAILED";
}

interface DurableFailureClassification {
  scope: FailureAttempt["scope"];
  errorCode: string;
  retryable: boolean;
  redactedMessage: string;
  causeClass: string;
  metadata: Readonly<Record<string, unknown>>;
}

function classifyDurableFailure(
  error: unknown,
  overrides: {
    scope?: FailureAttempt["scope"];
    errorCode?: string;
    retryable?: boolean;
  }
): DurableFailureClassification {
  const causeClass = error instanceof Error
    ? boundedSharedText(error.name || error.constructor.name || "Error", 200)
    : "NonErrorFailure";
  let scope: FailureAttempt["scope"] = "scheduler";
  let errorCode = "UNCLASSIFIED_RUNTIME_FAILURE";
  let retryable = true;
  let details: Readonly<Record<string, unknown>> = {};
  if (error instanceof ControlActionRejectedError) {
    scope = "control";
    errorCode = error.rejection.code;
    retryable = true;
    details = {
      invalidField: error.rejection.invalidField,
      currentRevision: error.rejection.currentRevision,
      workflowRevision: error.rejection.workflowRevision
    };
  } else if (error instanceof CollaborationGitError) {
    scope = "git";
    errorCode = error.code;
    retryable = error.retryable;
    details = error.publicData;
  } else if (error instanceof HarnessRuntimeError) {
    scope = error.code === "TOOL_EXECUTION_TIMED_OUT" ||
      error.code === "PROTOCOL_TOOL_ARGUMENTS_INVALID" ||
      error.code === "PROTOCOL_RECOVERY_EXHAUSTED"
      ? "tool"
      : "resident";
    errorCode = error.code;
    retryable = error.retryable;
    details = {
      source: error.source,
      ...error.details,
      ...(error.diagnosticRef ? { diagnosticRef: error.diagnosticRef } : {})
    };
  } else if (error instanceof CollaborationStateError) {
    errorCode = error.code;
    retryable = error.code.startsWith("STALE_") ||
      error.code === "CAPACITY_UNAVAILABLE" ||
      error.code === "WRITER_LEASE_STALE";
    details = error.details;
  } else if (error && typeof error === "object" && "code" in error &&
    typeof (error as { code?: unknown }).code === "string") {
    errorCode = boundedSharedText(String((error as { code: string }).code), 200);
    retryable = /^(?:E(?:CONN|PIPE|TIMEDOUT|AI_AGAIN)|ETIMEDOUT|ECONNRESET)/.test(errorCode);
  }
  const causeChain: Array<{ causeClass: string; redactedMessage: string }> = [];
  const seen = new Set<unknown>();
  let current: unknown = error;
  while (current !== undefined && current !== null && causeChain.length < 6 && !seen.has(current)) {
    seen.add(current);
    causeChain.push({
      causeClass: current instanceof Error
        ? boundedSharedText(current.name || current.constructor.name || "Error", 200)
        : "NonErrorFailure",
      redactedMessage: safeRuntimeError(current)
    });
    current = current instanceof Error
      ? (current as Error & { cause?: unknown }).cause
      : undefined;
  }
  return {
    scope: overrides.scope ?? scope,
    errorCode: boundedSharedText(overrides.errorCode ?? errorCode, 200),
    retryable: overrides.retryable ?? retryable,
    redactedMessage: safeRuntimeError(error),
    causeClass,
    metadata: { ...details, causeChain }
  };
}

function projectUserInputText(input: ProjectUserInput): string {
  return workflowMessagesText([{ sender: "user", body: input.message }]);
}

function boundedSharedText(value: string, limit: number): string {
  return redactTrace(value.replace(/\0/gu, ""))
    .trim()
    .slice(0, limit);
}

function safeRuntimeError(error: unknown): string {
  const message = error instanceof Error
    ? error.message
    : typeof error === "string"
      ? error
      : "Collaboration runtime failed";
  return redactTrace(message).trim().slice(0, 1_000) || "Collaboration runtime failed";
}

async function collaborationSchemaPath(kind: "main" | "worker"): Promise<string> {
  const fileName = kind === "main" ? "main-decision.json" : "worker-result.json";
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.resolve(moduleDir, "..", "schemas", fileName),
    path.resolve(moduleDir, "..", "..", "schemas", fileName),
    path.resolve(process.cwd(), "schemas", fileName),
    path.resolve(process.cwd(), "server", "schemas", fileName)
  ];
  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // Try the next source/build layout.
    }
  }
  throw new Error(`Unable to locate collaboration output schema ${fileName}`);
}

function abortableRuntimeDelay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new Error("Collaboration runtime wait was aborted"));
      return;
    }
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve();
    }, ms);
    const abort = () => {
      clearTimeout(timer);
      reject(new Error("Collaboration runtime wait was aborted"));
    };
    signal.addEventListener("abort", abort, { once: true });
  });
}

function pullRequestRecord(fact: GitHubPullRequestFact): PullRequestRecord {
  return {
    id: fact.id,
    providerNumber: fact.providerNumber,
    htmlUrl: fact.htmlUrl,
    head: fact.head,
    base: fact.base,
    ownerExecutionId: fact.ownerExecutionId,
    status: fact.status,
    headSha: fact.headSha,
    ...(fact.mergeable !== undefined ? { mergeable: fact.mergeable } : {}),
    ...(fact.mergeCommitSha ? { mergeCommitSha: fact.mergeCommitSha } : {}),
    checks: fact.checks.map((check) => ({
      id: check.id,
      name: check.name,
      status: check.status,
      ...(check.conclusion ? { conclusion: check.conclusion } : {}),
      ...(check.htmlUrl ? { htmlUrl: check.htmlUrl } : {}),
      observedAt: check.observedAt
    })),
    observedAt: fact.observedAt
  };
}
