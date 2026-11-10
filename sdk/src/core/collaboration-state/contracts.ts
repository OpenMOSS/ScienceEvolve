import type {
  CollaborationExecutionContext,
  ControlActionEnvelope,
  AgentOrchestrationTemplate,
  AgentId,
  ControlAction,
  ExecutionId,
  FailureAttempt,
  FailureAttemptSummary,
  GitRetrySchedulingMilestoneName,
  GitRetrySchedulingPoint,
  GitRetrySchedulingTimeline,
  GitRetrySchedulingWait,
  GroupRun,
  GroupRunId,
  MemberExecution,
  NodeRef,
  NodeRun,
  NodeRunId,
  OperationRecord,
  ProjectGitState,
  PullRequestRecord,
  TaskId,
  WorkflowNodeId,
  WorkTask
} from "../types.js";
import type { SessionRef } from "../harness-runtime/contracts.js";
import type { RemoteMergeSyncFact } from "../collaboration-git/contracts.js";
import type { ScopedRoutePlan } from "../scoped-workflow-planner.js";

export const COLLABORATION_STATE_SCHEMA_VERSION = 28 as const;

/** Exact native launch fact written by the trusted launcher, independent of
 * mutable workflow roles. This is evidence, never an Agent wake authority. */
export interface AgentNativeSessionBinding {
  projectId: string; agentId: string; invocationId: string; runtimePath: string; worktreePath: string;
  executionContext: CollaborationExecutionContext; session: SessionRef;
}

/** A physical receipt-only supplement keeps the original completed task
 * immutable. It is not a new business execution or a restored Git grant. */
export interface TerminalPushObservationIdentity {
  projectId: string;
  executionId: string;
  ownershipEpoch: number;
  agentId: string;
  invocationId: string;
}

export interface TerminalPushObservationTurn extends TerminalPushObservationIdentity {
  operation: OperationRecord;
  originalInvocationId: string;
  previousInvocationId: string;
  previousRuntimePath: string;
  runtimePath: string;
  worktreePath: string;
  executionBranch: string;
  nodeRunId: string;
  attempt: number;
  writerLeaseEpoch: number;
  status: "reserved" | "opened" | "stopped";
  openedAt?: string;
  stoppedAt?: string;
  completion?: TerminalPushObservationCompletionRecord;
  result?: TerminalPushObservationResultRecord;
  /** A released manager's explicit retry permits one read-only continuation;
   * it does not restore business authority or replenish automatic repairs. */
  coordination?: { incidentId: string; envelope: ControlActionEnvelope };
}

/** Agent-authored receipt for this mechanism turn, separate from the old
 * business task and its successful report/completion. */
export interface TerminalPushObservationCompletionRecord extends TerminalPushObservationIdentity {
  operationId: string;
  originalInvocationId: string;
  writerLeaseEpoch: number;
  callId: string;
  capabilityHash: string;
  requestedAt: string;
  acceptedAt: string;
  summary?: string;
  memory?: string;
  memorySha256?: string;
}

export interface TerminalPushObservationResultRecord extends TerminalPushObservationIdentity {
  writerLeaseEpoch: number;
  output: string;
  recordedAt: string;
  handoffPath?: string;
}

export interface TerminalPushObservationCandidate {
  projectId: string;
  executionId: string;
  ownershipEpoch: number;
  agentId: string;
  originalInvocationId: string;
  nodeRunId: string;
  worktreePath: string;
  executionBranch: string;
  operation: OperationRecord;
}

export interface BeginTerminalPushObservationInput extends TerminalPushObservationIdentity {
  operationId: string;
  originalInvocationId: string;
  previousInvocationId: string;
  previousRuntimePath: string;
  runtimePath: string;
  /** Supplied only by the trusted native stop/absence boundary, never by
   * task status, a model result, or an Agent-supplied control action. */
  residentStopConfirmed: true;
  evidence: Readonly<Record<string, unknown>>;
  coordination?: { incidentId: string; envelope: ControlActionEnvelope };
}

/** Historical receipt coordination has its own ledger. A closed group or
 * successful task never regains business authority to make a manager usable. */
export interface TerminalPushCoordinator {
  agentId: string;
  role: "leader" | "main";
  groupRunId?: string;
}

export interface TerminalPushCoordinationIncident {
  id: string;
  projectId: string;
  executionId: string;
  ownershipEpoch: number;
  agentId: string;
  operationId: string;
  originalInvocationId: string;
  unresolvedRequestId: string;
  nativeStop: { invocationId: string; runtimePath: string; evidence: Readonly<Record<string, unknown>> };
  coordinators: TerminalPushCoordinator[];
  level: number;
  status: "open" | "retry-authorized" | "retry-consumed" | "waiting-user" | "manager-failed";
  decision?: ControlActionEnvelope;
  userResponse?: TerminalPushCoordinationUserResponse;
}

export interface TerminalPushCoordinationUserResponse {
  interventionId: string;
  requestId: string;
  managerInvocationId: string;
  answeredAt: string;
  response: string;
}

export interface TerminalPushCoordinatorIdentity {
  projectId: string;
  incidentId: string;
  agentId: string;
  invocationId: string;
  level: number;
}

export interface TerminalPushCoordinatorTurn extends TerminalPushCoordinatorIdentity {
  coordinatorEpoch: number;
  writerLeaseEpoch: number;
  runtimePath: string;
  worktreePath: string;
  previousInvocationId: string;
  previousRuntimePath: string;
  userResponseRequestId?: string;
  capabilityHash: string;
  allowUserIntervention: boolean;
  status: "reserved" | "opened" | "stopped";
  completion?: ControlActionEnvelope;
  stagedDecision?: ControlActionEnvelope;
  acceptedDecision?: ControlActionEnvelope;
  result?: { output: string; handoffPath?: string };
  failure?: string;
}

export interface BeginTerminalPushCoordinatorInput extends TerminalPushCoordinatorIdentity {
  runtimePath: string;
  worktreePath: string;
  previousInvocationId: string;
  previousRuntimePath: string;
  previousNativeBindingRequestId?: string;
  userResponseRequestId?: string;
  capabilityHash: string;
  allowUserIntervention: boolean;
  /** The trusted resident launcher supplies this evidence. Agent tools never
   * select a manager, a native session or a stop proof. */
  residentStopConfirmed: true;
  evidence: Readonly<Record<string, unknown>>;
}

export interface WriterLeaseToken {
  serviceId: string;
  instanceId: string;
  hostId: string;
  epoch: number;
  expiresAtMs: number;
}

/** Local diagnostics only: reading these facts never queries a failing database
 * or establishes permission to write. A successful renewal requires COMMIT. */
export interface WriterLeaseDiagnostics {
  lease: WriterLeaseToken;
  lastSuccessfulRenewalAtMs: number | null;
  lastRenewalAttempt?: {
    startedAtMs: number;
    durationMs: number;
    stage: "begin" | "update" | "commit";
    outcome: "succeeded" | "failed";
    transactionActive: boolean;
  };
}

export interface CollaborationStateOpenOptions {
  databasePath: string;
  serviceId: string;
  hostId: string;
  /** v2 deliberately supports one writer service on one host only. */
  topology: "single-host";
  leaseDurationMs?: number;
  now?: () => number;
  instanceId?: string;
  /** Attach another connection owned by the same service instance. */
  writerLease?: WriterLeaseToken;
  /**
   * Test-only synchronous fault hook used to prove transaction isolation with
   * independent processes. Production callers must leave this undefined.
   */
  transactionFault?: (
    point: "usage.after_insert",
    context: Readonly<{ projectId: string; usageId: string }>
  ) => void;
}

export interface DatabaseHealth {
  journalMode: "delete";
  synchronous: "full";
  busyTimeoutMs: 5000;
  foreignKeys: true;
  integrity: "ok";
  lockingMode: "normal";
  schemaVersion: typeof COLLABORATION_STATE_SCHEMA_VERSION;
}

export type GroupActivationOrigin =
  | {
      kind: "agent-route";
      sourceAgentId: AgentId;
      sourceNodeRunId?: NodeRunId;
      route: "strong" | "autonomous";
    }
  | {
      kind: "main-selection";
      sourceNodeRunId?: NodeRunId;
      sourceAgentId?: AgentId;
    }
  | { kind: "main-direct"; sourceNodeRunId?: NodeRunId }
  | { kind: "project-input" }
  | {
      kind: "group-route";
      sourceNodeRunId: NodeRunId;
      sourceGroupRunId: GroupRunId;
      route: "fixed" | "weak";
    };

export interface CreateCollaborationProjectInput {
  projectId: string;
  workflowRevision: number;
  workflowSnapshot: unknown;
  git: ProjectGitState;
  workerCapacity?: number;
  managementCapacity?: number;
  recoveryLimit?: number;
  requestId?: string;
  /** Server-owned new-project opt-in; never accepted from an Agent payload. */
  formalState?: { checkpoint: import("../types.js").ProjectState;
    publishView?: (document: import("../project-state-documents.js").ProjectStateDocument) => void };
}

export interface ActivateGroupInput {
  projectId: string;
  expectedRevision?: number;
  nodeRunId: NodeRunId;
  groupRunId: GroupRunId;
  nodeId: WorkflowNodeId;
  groupId: string;
  activationRequestId: string;
  inputSnapshotRef: string;
  optionalTask?: string;
  memberAgentIds: AgentId[];
  origin: GroupActivationOrigin;
  baseCommit: string;
  groupBranch: string;
  workflowRevision: number;
  residentLaunchProtocol?: "trusted-supervisor-v1";
  leaderInvocationId?: string;
  leaderRuntimePath?: string;
  requestId?: string;
}

export interface ActivateScopedGroupInput {
  projectId: string;
  groupRunId: GroupRunId;
  groupId: string;
  activationRequestId: string;
  workflowRevision: number;
  baseCommit: string;
  /** Omitted only for a top-level group. */
  parentGroupRunId?: GroupRunId;
  parentArrivalRequestId?: string;
  /** Required only for a top-level group. The outer node and scoped run are
   * activated atomically so the root workflow retains its single-node slot. */
  outer?: {
    nodeRunId: NodeRunId;
    inputSnapshotRef: string;
    activatedByAgentId: AgentId;
    optionalTask?: string;
    sourceNodeRunId?: NodeRunId;
    sourceAgentId?: AgentId;
  };
  expectedRevision?: number;
}

export interface ScopedGroupRunRecord {
  id: GroupRunId;
  projectId: string;
  groupId: string;
  parentGroupRunId?: GroupRunId;
  parentArrivalRequestId?: string;
  activationRequestId: string;
  workflowRevision: number;
  leaderAgentId: AgentId;
  baseCommit: string;
  groupBranch: string;
  integrationTarget: string;
  status: string;
}

export type PrepareScopedGroupActivationInput = Omit<ActivateScopedGroupInput, "baseCommit" | "expectedRevision">;
export interface ScopedGroupActivationPreparation {
  input: PrepareScopedGroupActivationInput;
  workflowRevision: number;
  integrationTarget: string;
  bindingHash: string;
  preparedAt: string;
  status: "preparing" | "activated" | "cancelled";
  legacyBirth?: { operationId: string; workflowRevision: number };
}

export interface ScopedArrivalRecord {
  sequence: number;
  requestId: string;
  groupRunId: GroupRunId;
  sourceRunId: string;
  targetNodeId: WorkflowNodeId;
  targetKind: "agent" | "collaboration";
  agentId?: AgentId;
  childGroupId?: string;
  status: string;
  pathContext?: import("../scoped-workflow-planner.js").ScopedPathContext;
}

export interface ActivatedScopedGroup {
  replay: boolean;
  revision: number;
  groupRun: ScopedGroupRunRecord;
  arrivals: ScopedArrivalRecord[];
}

export interface ClaimScopedLeaderTurnInput {
  projectId: string;
  groupRunId: GroupRunId;
  agentId: AgentId;
  invocationId: string;
  runtimePath?: string;
  expectedRevision?: number;
  /** Trusted runtime sets this only after every group level escalates. */
  globalMain?: boolean;
  /** The native Agent turn has stopped and recorded finish_task; this narrow
   * handoff permits its Leader to persist a management-owned weak route before
   * the report enters Git delivery. */
  allowStoppedWorkerHandoff?: boolean;
  allowStoppedWorkerHandoffExecutionId?: string;
  /** Recovery-only barrier exception for a durable fault whose exact native
   * owner has stopped. The business lease and uncertain journal stay held. */
  allowStoppedRepairFaults?: boolean;
}

export interface ClaimedScopedLeaderTurn {
  revision: number;
  replay: boolean;
  groupRun: ScopedGroupRunRecord;
  invocationId: string;
  managementSlot: number;
  coordinatorEpoch: number;
}

export interface ScopedLeaderTurnRecord {
  projectId: string; groupRunId: GroupRunId; agentId: AgentId; invocationId: string;
  coordinatorEpoch: number; writerLeaseEpoch: number; status: "active" | "released";
  runtimePath?: string; openedAt?: string;
  globalMain: boolean;
  createdAt: string;
}

export interface ScopedLeaderActionInput extends ClaimScopedLeaderTurnInput {
  coordinatorEpoch: number;
  envelope: import("../types.js").ControlActionEnvelope;
  sourceArrivalRequestId?: string;
  /** Parent-scope arrival when a nested child's Leader owns the child node's route. */
  sourceArrivalGroupRunId?: GroupRunId;
  /** Outer node when a root group's own Leader owns the root group route. */
  sourceOuterNodeRunId?: NodeRunId;
  proposal?: import("../types.js").AgentOrchestrationTemplate;
  baseWorkflowHash?: string;
  /** Exact global configuration version of the original authoring input. */
  baseVersion?: import("../workflow-adjustments.js").WorkflowConfigurationVersion;
  configuration?: import("../scoped-agent-configuration.js").ScopedAgentConfiguration;
  baseConfigurationHash?: string;
}

export interface ScopedRecoveryCandidate {
  arrivalRequestId: string;
  failedArrivalRequestId: string;
  executionId?: string;
  incidentId?: string;
  kind?: ScopedGroupIssue["kind"];
  reason?: string;
  /** Exact formal direct-Main request, admitted only after its originating
   * manager's own finish, handoff and native Stop. */
  mainStateRequest?: { requestId: string; sequence: number; reason: string; sourceSequence: number; sourceHash: string;
    requestedBy: string; invocationId?: string };
  /** Exact original leaf failures, retained across authorized retries. */
  failureHistory?: Array<{ ownershipEpoch: number; reason: string; occurredAt: string; seq: number }>;
  /** Failed application of an exact, accepted manager decision. These are
   * technical coordination facts, not additional business/native attempts. */
  applicationFailures?: Array<{ reason: string; occurredAt: string; seq: number;
    managerGroupRunId: string; managerInvocationId: string; callId: string; globalMain: boolean }>;
  ownershipEpoch: number;
  originGroupRunId: string;
  pendingOperation?: "retry" | "skip" | "close_worktree";
  /** Latest actual closing return or recovery application failure, for
   * scheduling only. It neither grants authority nor resets any budgets. */
  coordinationRevision?: number;
  closing?: ScopedWorktreeClosingCandidate;
  closingGrantFailure?: ScopedWorktreeClosingGrantFailure;
  /** Actual supplements and current S facts, never a new grant. */
  closingAttempts?: Array<{
    turn: ScopedWorktreeClosingTurn;
    returned?: ScopedWorktreeClosingReturnRecord;
    checkpoint?: import("../collaboration-git/contracts.js").RestrictedWorktreeClosingFact;
    operations: OperationRecord[];
    stopEvidence?: Readonly<Record<string, unknown>>;
    results: Array<{ receipt: import("../control-result-receipts.js").ControlResultReceipt; received: boolean }>;
    failures: Array<{ reason: string; occurredAt: string }>;
  }>;
  /** Read-failure provenance is context only; it has no writable paths. */
  closingReadFailure?: {
    reportHeadSha: string; executionBranch: string; worktreePath: string;
    originalSession: import("../harness-runtime/contracts.js").SessionRef;
    originalStop: RecordScopedWorktreeClosingInput["originalStop"];
    reason: string; errorCode: string; errorClass: string;
  };
}

/** Trusted local observation and exact stopped-session owner. Identifying a
 * blocker supplies evidence to its direct Leader; it grants no file writes. */
export interface ScopedWorktreeClosingCandidate {
  incidentId: string;
  projectId: string;
  groupRunId: string;
  arrivalRequestId: string;
  executionId: string;
  ownershipEpoch: number;
  agentId: string;
  originalStatus: "completed" | "failed";
  originalInvocationId: string;
  originalRuntimePath: string;
  originalSession: import("../harness-runtime/contracts.js").SessionRef;
  reportInvocationId: string;
  reportHash: string;
  observation: import("../collaboration-git/contracts.js").RestrictedWorktreeClosingFact;
}

export interface RecordScopedWorktreeClosingInput {
  projectId: string;
  executionId: string;
  ownershipEpoch: number;
  agentId: string;
  observation: import("../collaboration-git/contracts.js").RestrictedWorktreeClosingFact;
  /** Only the trusted native supervisor may supply this physical proof. */
  originalStop: { invocationId: string; runtimePath: string; residentStopConfirmed: true; evidence: Record<string, unknown> };
}

export interface ScopedWorktreeClosingAuthorization {
  candidate: ScopedWorktreeClosingCandidate;
  paths: string[];
  envelope: import("../types.js").ControlActionEnvelope;
  acceptedAt: string;
  /** Server-derived predecessor: one new formal decision, one new call. */
  continuation?: { invocationId: string; returnRequestId: string; bindingInvocationId: string; bindingRuntimePath: string };
}

export interface ScopedWorktreeClosingReturnRecord extends ScopedWorktreeClosingTurnIdentity {
  incidentId: string;
  grantInvocationId: string;
  grantCallId: string;
  reportHeadSha: string;
  reportHash: string;
  bindingInvocationId: string;
  bindingRuntimePath: string;
  returnedAt: string;
  observation?: import("../collaboration-git/contracts.js").RestrictedWorktreeClosingFact;
  observationFailure?: { reason: string; errorCode: string; errorClass: string };
  targetObservationFailure?: { reason: string; errorCode: string; errorClass: string };
  missing: string[];
}

export interface ScopedWorktreeClosingSettlementRecord extends ScopedWorktreeClosingTurnIdentity {
  incidentId: string;
  grantInvocationId: string;
  grantCallId: string;
  originalStatus: "completed" | "failed";
  reportHash: string;
  reportHeadSha: string;
  writerLeaseEpoch: number;
  settledAt: string;
  supplementalFinishCallId: string;
  outputSha256: string;
  nativeStop: RecordScopedWorktreeClosingInput["originalStop"];
  observation: import("../collaboration-git/contracts.js").RestrictedWorktreeClosingFact;
  target: import("../collaboration-git/contracts.js").RestrictedWorktreeClosingTargetFact;
  delivery: import("../scoped-worktree-closing-delivery.js").ScopedWorktreeClosingDeliveryProof;
}

export interface SettleScopedWorktreeClosingInput extends ScopedWorktreeClosingTurnIdentity {
  observation: ScopedWorktreeClosingSettlementRecord["observation"];
  target: ScopedWorktreeClosingSettlementRecord["target"];
  /** Fresh proof from the trusted Supervisor, never an Agent tool claim. */
  nativeStop: ScopedWorktreeClosingSettlementRecord["nativeStop"];
  expectedRevision?: number;
}

/** A real Git refusal before any supplement was reserved or opened. */
export interface ScopedWorktreeClosingGrantFailure extends Omit<ScopedWorktreeClosingTurnIdentity, "invocationId"> {
  incidentId: string;
  grantInvocationId: string;
  grantCallId: string;
  reportHeadSha: string;
  originalStop: RecordScopedWorktreeClosingInput["originalStop"];
  reason: string;
  errorCode: string;
  errorClass: string;
  recordedAt: string;
}

export interface ScopedWorktreeClosingTurnIdentity {
  projectId: string;
  executionId: string;
  ownershipEpoch: number;
  agentId: string;
  invocationId: string;
}

/** A supplemental native call, never a new or reopened business execution. */
export interface ScopedWorktreeClosingTurn extends ScopedWorktreeClosingTurnIdentity {
  grantInvocationId: string;
  grantCallId: string;
  groupRunId: string;
  nodeRunId: string;
  runtimePath: string;
  previousInvocationId: string;
  previousRuntimePath: string;
  worktreePath: string;
  executionBranch: string;
  originalSession: SessionRef;
  kind: import("../collaboration-git/contracts.js").RestrictedWorktreeClosingScope["kind"];
  reportHeadSha: string;
  paths: string[];
  capabilityHash: string;
  writerLeaseEpoch: number;
  status: "reserved" | "opened" | "stopped";
  reservedAt: string;
  openedAt?: string;
  stoppedAt?: string;
  completion?: ScopedWorktreeClosingCompletionRecord;
  result?: ScopedWorktreeClosingResultRecord;
}

/** Actual returned text of this supplemental native turn. Separate from its
 * finish request, native tool receipts, physical Stop and final settlement. */
export interface ScopedWorktreeClosingResultRecord extends ScopedWorktreeClosingTurnIdentity {
  grantInvocationId: string;
  grantCallId: string;
  reportHeadSha: string;
  originalSession: SessionRef;
  writerLeaseEpoch: number;
  inputId: string;
  output: string;
  outputSha256: string;
  recordedAt: string;
  handoffPath?: string;
}

/** The original Agent's separate closing receipt. Never a replacement report
 * or business task completion, and never sufficient to release FIFO. */
export interface ScopedWorktreeClosingCompletionRecord extends ScopedWorktreeClosingTurnIdentity {
  grantInvocationId: string;
  grantCallId: string;
  reportHeadSha: string;
  originalSession: SessionRef;
  writerLeaseEpoch: number;
  callId: string;
  capabilityHash: string;
  requestedAt: string;
  acceptedAt: string;
  summary?: string;
  memory?: string;
  memorySha256?: string;
}

export interface BeginScopedWorktreeClosingTurnInput extends ScopedWorktreeClosingTurnIdentity {
  grantInvocationId: string;
  grantCallId: string;
  runtimePath: string;
  capabilityHash: string;
  observation: import("../collaboration-git/contracts.js").RestrictedWorktreeClosingFact;
  originalStop: RecordScopedWorktreeClosingInput["originalStop"];
}

/** Durable technical failure evidence for a scoped management turn.  The
 * failure key is tied to the retained arrival/epoch and manager scope, so a
 * new invocation cannot reset the automatic recovery budget. */
export interface ScopedManagementFailureRecord {
  projectId: string;
  groupRunId: GroupRunId;
  managerAgentId: AgentId;
  globalMain: boolean;
  managerInvocationId: string;
  coordinatorEpoch: number;
  purpose: "plan" | "route" | "root-route" | "recover" | "complete";
  failedArrivalRequestId?: string;
  executionId?: string;
  incidentId?: string;
  ownershipEpoch?: number;
  failureKey: string;
  attempt: number;
  budget: number;
  reason: string;
  recordedAt: string;
  exhausted: boolean;
}

export interface ScopedGroupIssue {
  id: string; groupRunId: string; kind: "plan" | "route" | "final" | "initialization" | "mechanism" | "terminal-push" | "worktree-closing"; sequence: number;
  arrivalRequestId: string; reason: string; operationId?: string; finalOwnershipEpoch?: number;
  executionId?: string; ownershipEpoch?: number;
  /** Exact unfinished operations retained by a stopped, unreported owner. */
  interruptedOperationIds?: string[];
}

export interface ReleaseScopedLeaderTurnInput extends ClaimScopedLeaderTurnInput {
  /** Retire scheduling authority while preserving the actual cleanup result. */
  residentStopConfirmed: boolean;
}

export interface ReleasedScopedLeaderTurn {
  revision: number;
  released: boolean;
  replay: boolean;
}

export interface ClaimScopedAgentArrivalInput {
  projectId: string;
  arrivalRequestId: string;
  agentId: AgentId;
  executionId: string;
  worktreePath: string;
  expectedRevision?: number;
}

export interface ScopedExecutionRecord {
  id: string;
  projectId: string;
  groupRunId: GroupRunId;
  arrivalRequestId: string;
  agentId: AgentId;
  ownershipEpoch: number;
  executionBranch: string;
  worktreePath: string;
  status: "running" | "integrating" | "merged" | "failed" | "paused" | "stopped" | "completed" | "cancelled";
}

export interface ClaimedScopedAgentArrival {
  revision: number;
  arrival: ScopedArrivalRecord;
  execution: ScopedExecutionRecord;
}

/** Immutable model result for one fenced turn; its pushed head is bound once.
 * Separate epochs retain separate reports without replacing the Agent. */
export interface ScopedAgentReportRecord {
  projectId: string;
  executionId: string;
  ownershipEpoch: number;
  invocationId: string;
  output: string;
  selectedWeakTarget?: string;
  headSha?: string;
  recordedAt: string;
  headRecordedAt?: string;
}

/** Durable proof that a scoped Worker explicitly finished its own task.
 * This is separate from the model report and from Git delivery so a missing
 * mechanism action can be repaired without inventing business progress. */
export interface ScopedAgentTaskCompletionRecord {
  projectId: string;
  executionId: string;
  ownershipEpoch: number;
  agentId: AgentId;
  invocationId: string;
  callId: string;
  summary?: string;
  memory?: string;
  requestedAt: string;
}

/** Native launch authority, separate from the immutable business report. An
 * interrupted launch must never be mistaken for a not-yet-invoked arrival.
 * This is the current physical authority; a report supplement archives the
 * prior stopped authority in its immutable reservation event before reopening. */
export interface ScopedAgentTurnRecord {
  projectId: string;
  executionId: string;
  ownershipEpoch: number;
  writerLeaseEpoch: number;
  invocationId: string;
  runtimePath: string;
  baseCommit: string;
  status: "reserved" | "opened" | "stopped";
  openedAt?: string;
  stoppedAt?: string;
}

export interface BeginScopedAgentTurnInput {
  projectId: string;
  executionId: string;
  ownershipEpoch: number;
  invocationId: string;
  runtimePath: string;
  baseCommit: string;
  expectedRevision?: number;
}

export interface ScopedAgentTurnIdentity {
  projectId: string;
  executionId: string;
  ownershipEpoch: number;
  invocationId: string;
  expectedRevision?: number;
}

export interface ScopedMergedSynchronizationIdentity {
  projectId: string;
  executionId: string;
  ownershipEpoch: number;
  providerNumber: number;
  expectedHead: string;
  expectedBase: string;
  expectedMergeCommitSha: string;
}

export interface RecordScopedAgentReportInput {
  projectId: string;
  executionId: string;
  ownershipEpoch: number;
  invocationId: string;
  output: string;
  selectedWeakTarget?: string;
  /** Exact head explicitly pushed by the Agent during this native turn. */
  reportHeadSha?: string;
  /** Server-only native turn-end proof; not supplied by an MCP caller. */
  residentTurnCompleted: true;
  /** Native resource stop is recorded separately from task result return. */
  residentStopConfirmed?: boolean;
  expectedRevision?: number;
}

export interface RecordScopedAgentTaskCompletionInput {
  projectId: string;
  executionId: string;
  ownershipEpoch: number;
  agentId: AgentId;
  invocationId: string;
  callId: string;
  summary?: string;
  memory?: string;
  requestedAt: string;
  expectedRevision?: number;
}

export interface BindScopedAgentReportHeadInput {
  projectId: string;
  executionId: string;
  ownershipEpoch: number;
  headSha: string;
  expectedRevision?: number;
}

export interface FailScopedAgentArrivalInput {
  projectId: string;
  arrivalRequestId: string;
  executionId: string;
  ownershipEpoch: number;
  reason: string;
  /** The worker lane cannot be freed while its resident may still run. */
  residentStopConfirmed: true;
  expectedRevision?: number;
}

export interface FailedScopedAgentArrival {
  revision: number;
  replay: boolean;
  executionId: string;
  failedOwnershipEpoch: number;
}

export interface RetryScopedAgentArrivalInput {
  projectId: string;
  arrivalRequestId: string;
  executionId: string;
  failedOwnershipEpoch: number;
  expectedRevision?: number;
}

export interface RetriedScopedAgentArrival {
  revision: number;
  replay: boolean;
  execution: ScopedExecutionRecord;
}

export interface CompleteScopedAgentArrivalInput {
  projectId: string;
  arrivalRequestId: string;
  executionId: string;
  ownershipEpoch: number;
  pullRequest: PullRequestRecord;
  synchronization: RemoteMergeSyncFact;
  selectedWeakTarget?: string;
  expectedRevision?: number;
}

export interface CompletedScopedAgentArrival {
  revision: number;
  replay: boolean;
  arrival: ScopedArrivalRecord;
  execution: ScopedExecutionRecord;
  route: ScopedRoutePlan;
  readyForFinalIntegration: boolean;
}

/** Runtime-owned Git integration, not a business invocation of the Leader.
 * It neither consumes an Agent session nor checks out an Agent worktree. */
export interface ScopedFinalNativeTurn {
  projectId: string;
  groupRunId: string;
  executionId: string;
  ownershipEpoch: number;
  agentId: string;
  invocationId: string;
  runtimePath: string;
  writerLeaseEpoch: number;
  status: "reserved" | "opened" | "stopped";
}

export interface ScopedFinalIntegrationRecord {
  id: ExecutionId;
  projectId: string;
  groupRunId: GroupRunId;
  ownershipEpoch: number;
  executionBranch: string;
  integrationTarget: string;
  expectedHeadSha: string;
  status: "integrating" | "completed";
}

export interface BeginScopedFinalIntegrationInput {
  projectId: string;
  groupRunId: GroupRunId;
  /** Last provider-confirmed head of this group's canonical branch. */
  expectedHeadSha: string;
  expectedRevision?: number;
}

export interface BegunScopedFinalIntegration {
  revision: number;
  replay: boolean;
  integration: ScopedFinalIntegrationRecord;
}

export type ScopedFinalPullEvidence = Pick<PullRequestRecord,
  "id" | "providerNumber" | "htmlUrl" | "head" | "base" | "status" |
  "headSha" | "mergeCommitSha" | "observedAt" | "ownerExecutionId"
>;

export interface CompleteScopedGroupInput {
  projectId: string;
  groupRunId: GroupRunId;
  executionId: ExecutionId;
  ownershipEpoch: number;
  pullRequest: ScopedFinalPullEvidence;
  synchronization: RemoteMergeSyncFact;
  selectedWeakTarget?: string;
  /** Record the immutable final merge proof but wait for the Leader's explicit
   * complete_group decision before releasing the parent route. */
  deferCompletion?: boolean;
  expectedRevision?: number;
}

export interface CompletedScopedGroup {
  revision: number;
  replay: boolean;
  groupRun: ScopedGroupRunRecord;
  parentArrival?: ScopedArrivalRecord;
  parentRoute?: ScopedRoutePlan;
  parentReadyForFinalIntegration?: boolean;
}

export interface ScopedAgentMergeRecord {
  arrivalRequestId: string;
  executionId: ExecutionId;
  groupRunId: GroupRunId;
  pullRequest: PullRequestRecord;
  synchronization: RemoteMergeSyncFact;
  recordedAt: string;
}

export interface ScopedGroupFinalMergeRecord {
  groupRunId: GroupRunId;
  pullRequest: ScopedFinalPullEvidence;
  synchronization: RemoteMergeSyncFact;
  recordedAt: string;
}

/** Emits the outer successor only after a root group's canonical PR has been
 * merged and the project target has been synchronized locally. */
export interface CompleteScopedRootRouteInput {
  projectId: string;
  groupRunId: GroupRunId;
  nodeRunId: NodeRunId;
  routeEmissionId: string;
  route: RouteDecisionFact;
  output: string;
  expectedRevision?: number;
  requestId?: string;
}

export interface CompletedScopedRootRoute {
  revision: number;
  replay: boolean;
  groupRun: ScopedGroupRunRecord;
  nodeRun: NodeRun;
  outbox: RouteOutboxRecord;
}

export interface ActivateNodeInput {
  projectId: string;
  expectedRevision?: number;
  nodeRunId: NodeRunId;
  node: Extract<NodeRef, { kind: "agent" }>;
  activationRequestId: string;
  inputSnapshotRef: string;
  optionalTask?: string;
  sourceNodeRunId?: NodeRunId;
  sourceAgentId?: AgentId;
  activatedByAgentId: AgentId;
  workflowRevision: number;
  requestId?: string;
}

export interface ActivatedGroup {
  replay: boolean;
  revision: number;
  nodeRun: NodeRun;
  groupRun: GroupRun;
}

export interface StartStandaloneExecutionInput {
  projectId: string;
  nodeRunId: NodeRunId;
  taskId: TaskId;
  executionId: ExecutionId;
  agentId: AgentId;
  assignment: string;
  executionBranch: string;
  worktreePath: string;
  invocationId?: string;
  residentLaunchProtocol?: "trusted-supervisor-v1";
  sessionId?: string;
  expectedRevision?: number;
  requestId?: string;
}

export interface AssignedTaskInput {
  id: TaskId;
  assignment: string;
  assigneeAgentId?: AgentId;
  dependencyTaskIds?: TaskId[];
}

export interface AssignTasksInput {
  projectId: string;
  groupRunId: GroupRunId;
  actorAgentId: AgentId;
  coordinatorEpoch: number;
  tasks: AssignedTaskInput[];
  expectedRevision?: number;
  requestId?: string;
}

export interface ClaimTaskInput {
  projectId: string;
  groupRunId: GroupRunId;
  agentId: AgentId;
  executionId: ExecutionId;
  executionBranch: string;
  worktreePath: string;
  invocationId?: string;
  residentLaunchProtocol?: "trusted-supervisor-v1";
  sessionId?: string;
  expectedRevision?: number;
  requestId?: string;
}

export interface ClaimedTask {
  revision: number;
  task: WorkTask;
  execution: MemberExecution;
}

export interface PullRequestObservationInput {
  projectId: string;
  executionId: ExecutionId;
  ownershipEpoch: number;
  pullRequest: PullRequestRecord;
  expectedRevision?: number;
  requestId?: string;
}

export interface CompletionDecisionInput {
  projectId: string;
  groupRunId: GroupRunId;
  actorAgentId: AgentId;
  coordinatorEpoch: number;
  output: string;
  expectedRevision?: number;
  requestId?: string;
}

export type RouteDecisionFact =
  | { kind: "fixed"; targetNodeId: WorkflowNodeId | "finish" }
  | {
      kind: "weak";
      targetNodeId: WorkflowNodeId | "finish";
      selectedByAgentId: AgentId;
      decisionRequestId: string;
    };

export interface CompleteGroupInput {
  projectId: string;
  groupRunId: GroupRunId;
  nodeRunId: NodeRunId;
  coordinatorEpoch: number;
  routeEmissionId: string;
  route: RouteDecisionFact;
  expectedRevision?: number;
  requestId?: string;
}

export interface CompleteStandaloneNodeInput {
  projectId: string;
  nodeRunId: NodeRunId;
  executionId: ExecutionId;
  ownershipEpoch: number;
  output: string;
  routeEmissionId: string;
  route: RouteDecisionFact;
  /** Root-graph finite Loop transition committed with the route emission. */
  loopTransition?: {
    id: string;
    iterations: number;
    batch: number;
    totalIterations: number;
    exhausted: boolean;
  };
  expectedRevision?: number;
  requestId?: string;
}

/** Completes the system Main node without creating delivery work or a PR. */
export interface CompleteManagementNodeInput {
  projectId: string;
  nodeRunId: NodeRunId;
  output: string;
  routeEmissionId: string;
  route: RouteDecisionFact;
  expectedRevision?: number;
  requestId?: string;
}

export interface RouteOutboxRecord {
  routeEmissionId: string;
  projectId: string;
  sourceNodeRunId: NodeRunId;
  sourceGroupRunId?: GroupRunId;
  targetNodeId: WorkflowNodeId | "finish";
  decisionKind: "fixed" | "weak";
  decisionId: string;
  selectedByAgentId?: AgentId;
  decisionRequestId?: string;
  payload: Readonly<Record<string, unknown>>;
  status: "pending" | "delivered";
  createdAt: string;
  deliveredAt?: string;
  deliveryAttempts: number;
}

export interface CollaborationEvent {
  eventId: string;
  requestId?: string;
  seq: number;
  projectId: string;
  workflowRevision?: number;
  nodeId?: WorkflowNodeId;
  nodeRunId?: NodeRunId;
  groupRunId?: GroupRunId;
  agentId?: AgentId;
  taskId?: TaskId;
  executionId?: ExecutionId;
  invocationId?: string;
  ownershipEpoch?: number;
  coordinatorEpoch?: number;
  ts: string;
  type: string;
  payload: Readonly<Record<string, unknown>>;
}

export interface AppendEventInput extends Omit<CollaborationEvent, "eventId" | "seq" | "ts"> {
  eventId?: string;
  ts?: string;
  expectedRevision?: number;
}

export interface AcceptedGroupControlAction {
  projectId: string;
  nodeRunId: NodeRunId;
  groupRunId: GroupRunId;
  coordinatorEpoch: number;
  actorAgentId: AgentId;
  inputId: string;
  invocationId: string;
  callId: string;
  stateVersion: number;
  semanticInputHash: string;
  authorityStateHash: string;
  action: Extract<ControlAction, {
    tool: "assign_group_tasks" | "request_group_integration" | "complete_group";
  }>;
  acceptedAt: string;
}

export interface AcceptedMainRouteAction {
  projectId: string;
  nodeRunId: NodeRunId;
  routeEpoch: number;
  inputId: string;
  invocationId: string;
  callId: string;
  stateVersion: number;
  semanticInputHash: string;
  authorityStateHash: string;
  candidateNodeIds: string[];
  canComplete: boolean;
  allowFinishRoute: boolean;
  /** Stable zero-based position inside one semantic Main turn. */
  sequence: number;
  action:
    | Extract<ControlAction, { tool: "route_to_agent" }>
    | Extract<ControlAction, { tool: "complete_project" }>
    | Extract<ControlAction, { tool: "request_user" }>
    | Extract<ControlAction, { tool: "select_display" }>
    | Extract<ControlAction, { tool: "apply_workflow" }>;
  /** Immutable, credential-free proposal captured with apply_workflow. */
  workflowProposal?: {
    orchestration: AgentOrchestrationTemplate;
    affectedGroupIds: string[];
    prestateWorkflowRevision: number;
    prestateWorkflowHash: string;
    targetWorkflowRevision: number;
    proposalHash: string;
    configuration?: import("../scoped-agent-configuration.js").ScopedAgentConfiguration;
    baseConfigurationHash?: string;
  };
  acceptedAt: string;
}

export interface UsageRecord {
  scopeKind?: "scoped";
  usageId: string;
  requestId?: string;
  projectId: string;
  nodeRunId?: NodeRunId;
  groupRunId?: GroupRunId;
  agentId: AgentId;
  taskId?: TaskId;
  executionId?: ExecutionId;
  invocationId?: string;
  ownershipEpoch?: number;
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  totalTokens: number;
  model?: string;
  protocol?: string;
  recordedAt: string;
}

export interface AppendUsageInput extends Omit<UsageRecord, "recordedAt"> {
  recordedAt?: string;
  expectedRevision?: number;
}

export interface AppendFailureAttemptInput extends Omit<FailureAttempt, "metadata"> {
  metadata?: Readonly<Record<string, unknown>>;
  nodeRunId?: NodeRunId;
  groupRunId?: GroupRunId;
  taskId?: TaskId;
  executionId?: ExecutionId;
  coordinatorEpoch?: number;
  expectedRevision?: number;
}

export interface AppendGitRetrySchedulingMilestoneInput {
  projectId: string;
  retryId: string;
  operationId: string;
  attempt: number;
  milestone: GitRetrySchedulingMilestoneName;
  invocationId: string | null;
  epoch: number | null;
  epochKind: GitRetrySchedulingPoint["epochKind"];
  waitingFor: GitRetrySchedulingWait;
  occurredAt?: string;
  expectedRevision?: number;
}

export interface LaneAvailability {
  lane: "worker" | "management";
  capacity: number;
  occupied: number;
  available: number;
}

/**
 * One durable, currently-open runtime boundary.  These records are projected
 * from immutable project_events rows; they are not a second state store.
 */
export interface RuntimeActivity {
  activityId: string;
  projectId: string;
  kind: "resident" | "turn";
  scopeKind?: "scoped-agent" | "scoped-leader" | "scoped-main" | "terminal-push-observation" | "terminal-push-coordinator";
  phase: "resident:starting" | "resident:running" | "model:running";
  invocationId: string;
  agentId: AgentId;
  nodeRunId: NodeRunId;
  groupRunId?: GroupRunId;
  taskId?: TaskId;
  executionId?: ExecutionId;
  ownershipEpoch?: number;
  coordinatorEpoch?: number;
  inputId?: string;
  startedAt: string;
  writerLeaseEpoch: number;
  /** A prior writer's unclosed fact is recoverable, never current authority. */
  leaseState: "current" | "recovering";
}

export interface StartRuntimeActivityInput {
  projectId: string;
  kind: RuntimeActivity["kind"];
  phase: RuntimeActivity["phase"];
  invocationId: string;
  agentId: AgentId;
  nodeRunId: NodeRunId;
  groupRunId?: GroupRunId;
  taskId?: TaskId;
  executionId?: ExecutionId;
  ownershipEpoch?: number;
  coordinatorEpoch?: number;
  inputId?: string;
  expectedRevision?: number;
  requestId?: string;
}

export interface CloseRuntimeActivityInput {
  projectId: string;
  kind: RuntimeActivity["kind"];
  invocationId: string;
  nodeRunId: NodeRunId;
  groupRunId?: GroupRunId;
  executionId?: ExecutionId;
  ownershipEpoch?: number;
  coordinatorEpoch?: number;
  outcome: "completed" | "failed" | "cancelled" | "superseded" | "stopped";
  expectedRevision?: number;
  requestId?: string;
}

export interface CredentialFreeProjectStateProjection {
  agentGitDelivery?: Record<string, import("../agent-git-delivery.js").AgentGitDeliveryStatus>;
  id: string;
  stateRevision: number;
  /** Explicit new-project domain; old projects retain their original owners. */
  formalState?: import("../project-state-documents.js").UnifiedProjectStateProjection;
  /** Registered Git projects derive live status from their collaboration
   * tables; the auxiliary checkpoint does not own those runtime fields. */
  runtime?: import("../types.js").ProjectRuntimeProjection;
  /** Business extensions in the same authoritative journal. They never
   * override core facts or authorize scheduling, delivery or completion. */
  businessState?: Array<{ object: import("../project-state.js").ProjectStateRef;
    extensions: Record<string, unknown>; sequence: number; updatedAt: string }>;
  workflowRevision: number;
  workflowSnapshot: unknown;
  activeNodeRunId?: NodeRunId;
  frozen: boolean;
  freezeReason?: string;
  recoveryAttempts: number;
  recoveryLimit: number;
  git: ProjectGitState;
  nodeRuns: NodeRun[];
  groupRuns: GroupRun[];
  terminalPushObservations?: TerminalPushObservationTurn[];
  terminalPushCoordinationIncidents?: TerminalPushCoordinationIncident[];
  terminalPushCoordinatorTurns?: TerminalPushCoordinatorTurn[];
  /** v3's recursive, arrival-keyed runtime facts; absent for legacy projects. */
  scopedGroupRuns?: ScopedGroupRunRecord[];
  scopedGroupActivationPreparations?: ScopedGroupActivationPreparation[];
  scopedGroupIssues?: ScopedGroupIssue[];
  scopedManagementFailures?: ScopedManagementFailureRecord[];
  scopedManagementTurns?: ScopedLeaderTurnRecord[];
  scopedArrivals?: ScopedArrivalRecord[];
  scopedExecutions?: ScopedExecutionRecord[];
  scopedAgentReports?: ScopedAgentReportRecord[];
  scopedAgentTaskCompletions?: ScopedAgentTaskCompletionRecord[];
  /** Runtime-only final publishers; never business Agent executions. */
  scopedFinalIntegrations?: ScopedFinalIntegrationRecord[];
  /** Provider-confirmed scoped PR observations; not proof of local integration. */
  scopedPullRequests?: PullRequestRecord[];
  scopedAgentMerges?: ScopedAgentMergeRecord[];
  scopedWorktreeClosingSettlements?: ScopedWorktreeClosingSettlementRecord[];
  scopedGroupFinalMerges?: ScopedGroupFinalMergeRecord[];
  scopedConfiguration?: import("../scoped-agent-configuration.js").ScopedAgentConfiguration;
  tasks: WorkTask[];
  executions: MemberExecution[];
  pullRequests: PullRequestRecord[];
  /** Additional exact-head standalone deliveries; original PR identities stay fixed. */
  additionalPullRequests?: Array<PullRequestRecord & { originalPullRequestId: string; ownershipEpoch: number }>;
  operations: OperationRecord[];
  /** Small provider journal projection used to explain scheduling blockers. */
  pendingGitOperations?: Array<Pick<OperationRecord, "id" | "kind" | "status" | "ownerExecutionId" | "ownershipEpoch">>;
  routeOutbox: RouteOutboxRecord[];
  usage: UsageRecord[];
  failureAttempts: FailureAttempt[];
  failureSummary: FailureAttemptSummary;
  gitRetryScheduling: GitRetrySchedulingTimeline[];
  runtimeActivities: RuntimeActivity[];
  /** A lifecycle Stop is retained until explicit Resume. Its confirmation
   * belongs to this exact durable intent, never to the state.json envelope. */
  resumableCancellation?: { requestedEventSeq: number; stoppedAt?: string };
}

/** Scheduling facts without artifacts, provider payloads or usage history. */
export type ProjectSchedulingProjection = Pick<CredentialFreeProjectStateProjection,
  "id" | "stateRevision" | "workflowSnapshot" | "activeNodeRunId" | "frozen" | "freezeReason" | "git" |
  "nodeRuns" | "groupRuns" | "scopedGroupRuns" | "scopedGroupIssues" | "scopedArrivals" | "scopedExecutions" |
  "tasks" | "executions" | "runtimeActivities" | "resumableCancellation" | "pendingGitOperations"> & {
    arrivalEnteredAt?: Record<string, string>;
  };
