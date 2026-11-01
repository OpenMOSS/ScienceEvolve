import type { AgentHarness, AgentProtocol } from "./agent-runtime.js";
import type { CancellationRequest } from "./cancellation.js";
import type { WorkspaceCheckpoint } from "./workspace-checkpoint.js";
import type { HarnessEvent, PublicHarnessDescriptor, SessionRef } from "./harness-runtime/contracts.js";
import type {
  HarnessRuntimeErrorCode,
  HarnessRuntimeErrorSource
} from "./harness-runtime/errors.js";
import type {
  GatewayModelReasoningConfigs,
  LegacyReasoningEffort,
  ResolvedGatewayReasoning
} from "./gateway-reasoning.js";
import type { MainCapabilitySnapshot } from "./internal/shared/contracts.js";
import type { AgentActivitySignal } from "./internal/shared/invocation-activity.js";
export type { AgentActivitySignal } from "./internal/shared/invocation-activity.js";
import type {
  GatewayTokenUsage,
  GatewayUnknownTokenUsage,
  GatewayUsageLedgerEntry,
  GatewayUsageReport,
  ProjectTokenUsage,
  ThreadTokenUsageCursor,
  TokenUsageTotals
} from "./internal/shared/token-usage-ledger.js";
export type {
  GatewayTokenUsage,
  GatewayUnknownTokenUsage,
  GatewayUsageLedgerEntry,
  GatewayUsageReport,
  ProjectTokenUsage,
  ThreadTokenUsageCursor,
  TokenUsageTotals
} from "./internal/shared/token-usage-ledger.js";

/**
 * Stable collaboration identities. They are serialized as strings, but the
 * distinct names keep configuration, runtime, provider, and invocation
 * records from being conflated by their consumers.
 */
export type AgentId = string;
export type WorkflowNodeId = string;
export type NodeRunId = string;
export type GroupRunId = string;
/** Stable scope of one independent Main routing resident; never a group FK. */
export type MainRouteScopeId = string;
export type TaskId = string;
export type ExecutionId = string;
export type InvocationId = string;
export type PullRequestId = string;
export type OperationId = string;
/** Unique per-project Agent instance identifier used for routing and storage. */
export type AgentName = AgentId;
export type AgentKind = "main" | "worker";
export const OPENFARS_COLLABORATION_CONTRACT_VERSION = "openfars-collaboration-v2.0" as const;
/** The one mandatory public Agent in every project. */
export const MAIN_AGENT_NAME = "main" as const;
/**
 * Source-compatible aliases for modules that still use the old internal
 * terminology. They intentionally resolve to the public name and must never
 * be serialized as controller identities.
 */
export const SYSTEM_CONTROLLER_AGENT = MAIN_AGENT_NAME;
export const SYSTEM_CONTROLLER_ROUTE_TARGET = MAIN_AGENT_NAME;
/** User-facing execution permission. */
export type AgentPermission = "workspace" | "compute" | "yolo";
/**
 * A setup-only configuration template. It provides initial prompt, Skill, and
 * MCP choices in the UI; it never grants a backend permission.
 */
export type AgentTemplate =
  | "general"
  | "main"
  | "idea"
  | "execution"
  | "writing"
  | "review";

/** Directed workflow edge semantics. Strong edges are deterministic; weak
 * edges are alternatives that Main may choose between when there is more than
 * one candidate. */
export type WorkflowEdgeKind = "strong" | "weak";
export type WorkflowRouteTarget = WorkflowNodeId | "finish";

export interface WorkflowEdge {
  target: WorkflowRouteTarget;
  kind: WorkflowEdgeKind;
}

export type WorkflowEdgeMap = Record<WorkflowNodeId, WorkflowEdge[]>;

export interface ScopedRecoveryOption {
  arrivalRequestId: string;
  allowedOperations: Array<"retry" | "skip" | "escalate" | "close_worktree">;
  blockedOperations: Partial<Record<"retry" | "skip" | "escalate" | "close_worktree", string>>;
  repairNodeIds: string[];
}
/** Invocation-bound authority for one collaboration role. */
export type CollaborationControlScope =
  | { nodeRunId: NodeRunId; groupRunId: GroupRunId; role: "scoped-leader" | "scoped-main"; coordinatorEpoch: number;
      memberNodeIds: string[]; routeCandidates: string[]; sourceArrivalRequestId?: string;
      sourceOuterNodeRunId?: string;
      failedArrivalRequestIds: string[]; recoveryOptions?: ScopedRecoveryOption[];
      closingArrivalRequestIds?: string[]; worktreeClosingOnly?: true; allowReconfiguration: boolean }
  | { nodeRunId: NodeRunId; groupRunId: GroupRunId; role: "leader"; coordinatorEpoch: number }
  | { nodeRunId: NodeRunId; groupRunId: GroupRunId; taskId: TaskId; executionId: ExecutionId; role: "delivery" | "final-integration"; ownershipEpoch: number; coordinatorEpoch: number };

export interface GatewayUsagePersistenceFailure {
  usageId: string;
  protocol: AgentProtocol;
  model: string;
  error: string;
}

export type WorkflowCanvasPort = "top" | "right" | "bottom" | "left";

export interface WorkflowCanvasNodeLayout {
  x: number;
  y: number;
}

export interface WorkflowCanvasEdgeLayout {
  sourcePort: WorkflowCanvasPort;
  targetPort: WorkflowCanvasPort;
  sourcePortPinned: boolean;
  targetPortPinned: boolean;
}

/** Presentation-only layout persisted with the Workflow configuration. */
export interface WorkflowCanvasLayout {
  schemaVersion: 1;
  nodes: Record<string, WorkflowCanvasNodeLayout>;
  edges: Record<string, WorkflowCanvasEdgeLayout>;
  viewport: { x: number; y: number; zoom: number };
  layoutMode: "free" | "layered";
  /** Presentation-only visibility of the input and termination anchor edges. */
  connections?: { input: boolean; termination: boolean };
}

export interface ResultFormat {
  /** Common natural-language delivery intents selected by the user. */
  presets: string[];
  /** Optional free-form delivery guidance. */
  custom: string;
  /** Explicit user choice to finish without an additional deliverable. */
  none?: boolean;
}

export type NodeRef =
  | { kind: "agent"; nodeId: WorkflowNodeId; agentId: AgentId }
  | { kind: "collaboration"; nodeId: WorkflowNodeId; groupId: string };

/** A routable outer node whose members remain in the flat Agent registry. */
export interface CollaborationNode {
  id: string;
  displayName: string;
  memberAgentIds: AgentId[];
  renamePolicy: "editable" | "locked";
  /** Lossless pre-group topology used only when the group is dissolved. */
  formationSnapshot?: CollaborationFormationSnapshot;
}

export interface CollaborationFormationSnapshot {
  schemaVersion: 1;
  /** Workflow revision in which the collaboration node was formed. */
  workflowRevision: number;
  memberRoutes: Record<AgentId, WorkflowEdge[]>;
  memberDecisionPlans: Record<AgentId, string>;
  inboundRoutes: Record<WorkflowNodeId, WorkflowEdge[]>;
  /** Group-era routes recorded at formation; later changes require guided dissolution. */
  formedRoutes: Record<WorkflowNodeId, WorkflowEdge[]>;
  inputTarget?: WorkflowNodeId;
  terminationAgent?: WorkflowNodeId;
  memberCanvasNodes?: Record<AgentId, WorkflowCanvasNodeLayout>;
}

export interface CollaborationDissolutionPlan {
  mode: "guided";
  incomingTargetBySource: Record<WorkflowNodeId, AgentId>;
  memberRoutes: Record<AgentId, WorkflowEdge[]>;
  inputTarget?: AgentId;
  terminationAgent?: AgentId;
  memberCanvasNodes?: Record<AgentId, WorkflowCanvasNodeLayout>;
}

export type GitRepositoryVisibility = "private" | "public";

export interface ProjectGitInput {
  enabled: boolean;
  provider?: "github";
  /** Global GitHub account selected explicitly for this project. */
  accountId?: string;
  repositoryName?: string;
  repositoryVisibility?: GitRepositoryVisibility;
}

export interface ProjectGitAccountBinding {
  id: string;
  login: string;
  providerUserId: number;
  avatarUrl?: string;
}

export interface ProjectGitBranchFact {
  name: string;
  head?: string;
  base?: string;
  ownerExecutionId?: ExecutionId;
  worktreePath?: string;
  status: string;
  retained?: true;
  observedAt?: string;
}

export interface ProjectGitCommitFact {
  sha: string;
  htmlUrl?: string;
  message?: string;
  observedAt?: string;
}

export interface ProjectGitState {
  enabled: boolean;
  status:
    | "disabled"
    | "authorizing"
    | "creating_repository"
    | "initializing_local"
    | "pushing_main"
    | "ready"
    | "waiting_for_github"
    | "failed";
  provider?: "github";
  /** Credential-free immutable account identity pinned at project creation. */
  account?: ProjectGitAccountBinding;
  /** Requested name retained across initialization retries and restarts. */
  requestedRepositoryName?: string;
  /** Requested visibility retained across initialization retries and restarts. */
  requestedRepositoryVisibility?: GitRepositoryVisibility;
  repository?: {
    owner: string;
    name: string;
    htmlUrl: string;
    private: boolean;
    defaultBranch: "main";
    localPath: string;
  };
  initialization?: {
    operationId: OperationId;
    attempt: number;
    completedSteps: string[];
    error?: string;
  };
  /** Credential-free, provider-observed read model for the UI. */
  branches?: ProjectGitBranchFact[];
  commits?: ProjectGitCommitFact[];
  blockers?: string[];
  observedAt?: string;
  capacity?: {
    retainedWorktreeCount: number;
    warningThreshold?: number;
    warning?: string;
  };
}

export type ProjectStatus =
  | "queued"
  | "running"
  | "retrying"
  | "interrupting"
  | "interrupted"
  | "pausing"
  | "paused"
  | "cancelling"
  | "cancelled"
  | "completed";

export type AgentMcpServer = { name: string } & (
  | { url: string; project?: never }
  | { project: string; url?: never }
);

export interface AgentConfig {
  model: string;
  /** User-selected CLI harness; defaults to the current Codex adapter. */
  harness?: AgentHarness;
  /** Global gateway selected for this Agent. */
  gatewayId?: string;
  /** Trusted standalone-host native Codex profile alias; never a credential or path. */
  nativeCodexProfileId?: string;
  /** Model-level Gateway reasoning option. Absence means provider default. */
  gatewayReasoningOption?: string;
  /** Server-only snapshot captured when a project starts. */
  gatewaySnapshot?: {
    id: string;
    name: string;
    url: string;
    apiKey: string;
    models: string[];
    modelContextWindows?: Record<string, number>;
    /** Immutable model option mapping captured when the project starts. */
    modelReasoning?: GatewayModelReasoningConfigs;
    /** Exact resolved outbound value for this Agent; absent means provider default. */
    reasoning?: ResolvedGatewayReasoning;
    /** Read-only notice produced when a legacy Harness effort could not migrate safely. */
    reasoningMigrationWarning?: string;
    defaultModel: string;
    /** Derived from the selected GatewayStore record; never Agent input. */
    protocol: AgentProtocol;
    /** Harness wire protocol and route decision captured at project start. */
    nativeProtocol?: AgentProtocol;
    routeMode?: "direct" | "proxy";
    routeDirection?: `${AgentProtocol}->${AgentProtocol}`;
    /** Capability-derived transport mode for this exact route. */
    deliveryMode?: "native-stream" | "buffered-json";
    testedAt?: string;
  };
  /** Skills that every invocation of this Agent must load and follow. */
  skills: string[];
  /** Skills exposed to Codex for task-driven automatic selection. */
  autoSkills: string[];
  /** Streamable HTTP MCP servers enabled for every invocation of this Agent. */
  mcpServers: AgentMcpServer[];
  /** Explicit built-in SII selection; absence never grants experiment tools. */
  experimentMcp?: boolean;
  /** Complete Agent prompt. Empty values use the selected template default. */
  instructions: string;
  /** @deprecated Read compatibility only; never persisted or sent to a Harness. */
  reasoningEffort?: LegacyReasoningEffort;
  /** Server/Web migration hint for legacy saved configurations; never writable. */
  legacyReasoningEffort?: LegacyReasoningEffort;
  /** Read-only migration notice; never an outbound model setting. */
  reasoningMigrationWarning?: string;
  /** User-facing permission. Main defaults to yolo but remains editable. */
  permission: AgentPermission;
  webSearch: boolean;
  /** Reuse one durable Codex thread for this Agent within this project. */
  sessionPersistence: boolean;
  /** Owner of ordinary weak-edge decisions for this Agent. */
  decisionBy: "main" | "agent";
}

export type AgentConfigMap = Record<AgentName, AgentConfig>;

export interface AgentDefinition {
  /** Unique identity and all workflow route targets use this field. */
  name: AgentName;
  /** Optional starting configuration for a Worker, without runtime semantics. */
  template?: AgentTemplate;
  /** Short user-facing role description shown by the workflow editor. */
  description?: string;
}

/** A loop group whose return edge is from (exit) -> to (entry). Each entry from Main starts a new batch. */
export interface WorkflowLoop {
  id: string;
  from: AgentName;
  to: AgentName;
  /** Iterations per batch, not a project-wide termination budget. */
  maxIterations: number;
  exitTo: AgentName;
}

export interface AgentOrchestrationTemplate {
  /** Missing on a legacy v1 read; v3 adds an explicit scoped group graph. */
  schemaVersion?: 2 | 3;
  /** Every entry is exactly one Agent; names are unique. */
  agents: AgentDefinition[];
  /** Missing on a legacy v1 read; normalized writers always emit an array. */
  collaborations?: CollaborationNode[];
  /** v3 source of truth for group membership, nested scopes and group routes. */
  scopedWorkflow?: import("./scoped-workflow-contract.js").ScopedWorkflowContract;
  /** User-created library templates, separate from canvas Agent instances. */
  agentTemplates?: AgentDefinition[];
  /** The first Agent that receives the original user input. */
  input: {
    source: "input";
    target: WorkflowNodeId;
  };
  /** Canonical directed workflow edges. */
  routes: WorkflowEdgeMap;
  /** Optional bounded deterministic loop groups. */
  loops?: WorkflowLoop[];
  /** Guidance Main follows when a node has multiple weak edges. */
  decisionPlans: Record<WorkflowNodeId, string>;
  /** Whether Main may pause for a user response. */
  allowUserIntervention: boolean;
  /** User-owned policy gate for Main-authored runtime topology changes. */
  allowMainReconfiguration?: boolean;
  termination: {
    /** Legacy field name; v2 values are outer workflow-node identities. */
    agent: WorkflowNodeId;
    condition: string;
    decisionBy: "main";
    automatic: boolean;
  };
  /** Optional user intent describing the desired final delivery form. */
  resultFormat?: ResultFormat;
  /** Presentation-only canvas state; never read by the scheduler. */
  canvas?: WorkflowCanvasLayout;
}

/** Fully normalized orchestration emitted by the v2 writer. */
export interface AgentOrchestrationTemplateV2 extends AgentOrchestrationTemplate {
  schemaVersion: 2;
  collaborations: CollaborationNode[];
}

export interface AgentOrchestrationTemplateV3 extends AgentOrchestrationTemplate {
  schemaVersion: 3;
  collaborations: CollaborationNode[];
  scopedWorkflow: import("./scoped-workflow-contract.js").ScopedWorkflowContract;
}

export type NormalizedAgentOrchestrationTemplate =
  | AgentOrchestrationTemplateV2
  | AgentOrchestrationTemplateV3;

/** Harness-neutral lifecycle vocabulary used by the authoritative workflow files. */
export type AuthoritativeWorkflowRunState =
  | "idle"
  | "pending"
  | "active"
  | "waiting"
  | "paused"
  | "blocked"
  | "stopping"
  | "cancelled"
  | "failed"
  | "completed";

export interface AuthoritativeWorkflowDefinition {
  schemaVersion: 1;
  projectId: string;
  workflowRevision: number;
  /** Complete credential-free workflow used by the scheduler for this revision. */
  workflow: AgentOrchestrationTemplate;
}

export interface AuthoritativeWorkflowMemberState {
  agentId: AgentId;
  role: "leader" | "member" | "standalone";
  taskIds: TaskId[];
  executionId?: ExecutionId;
  invocationId?: InvocationId;
  ownershipEpoch?: number;
  runState: AuthoritativeWorkflowRunState;
  rawStatus: string;
}

export interface AuthoritativeWorkflowCurrentState {
  agentGitDelivery?: Record<string, import("./agent-git-delivery.js").AgentGitDeliveryStatus>;
  schemaVersion: 1;
  projectId: string;
  workflowRevision: number;
  /** SQLite project-head revision from which every field in this document was derived. */
  stateRevision: number;
  runState: AuthoritativeWorkflowRunState;
  frozen: boolean;
  freezeReason?: string;
  currentNode?: {
    nodeRunId: NodeRunId;
    nodeId: WorkflowNodeId;
    kind: NodeRef["kind"];
    agentId?: AgentId;
    groupId?: string;
    workflowRevision: number;
    runState: AuthoritativeWorkflowRunState;
    rawStatus: NodeRunStatus;
    invocationId?: InvocationId;
    epoch?: number;
  };
  currentGroup?: {
    groupRunId: GroupRunId;
    nodeRunId: NodeRunId;
    leaderAgentId: AgentId;
    actingCoordinatorId: AgentId;
    memberAgentIds: AgentId[];
    coordinatorEpoch: number;
    invocationId?: InvocationId;
    runState: AuthoritativeWorkflowRunState;
    rawStatus: GroupRunStatus;
  };
  members: AuthoritativeWorkflowMemberState[];
  /** Agent-authored mechanism turns; operation is the immutable reservation snapshot. */
  terminalPushObservations?: import("./collaboration-state/contracts.js").TerminalPushObservationTurn[];
  terminalPushObservationIssues?: Record<string, unknown>[];
  /** Current S journals and recorded provider proof for these exact receipt
   * owners, derived at stateRevision rather than at the earlier reservation. */
  terminalPushObservationOperations?: OperationRecord[];
  terminalPushCoordinationIncidents?: import("./collaboration-state/contracts.js").TerminalPushCoordinationIncident[];
  terminalPushCoordinatorTurns?: import("./collaboration-state/contracts.js").TerminalPushCoordinatorTurn[];
  scopedRuntime?: {
    activationPreparations?: import("./collaboration-state/contracts.js").ScopedGroupActivationPreparation[];
    groupRuns: import("./collaboration-state/contracts.js").ScopedGroupRunRecord[];
    arrivals: import("./collaboration-state/contracts.js").ScopedArrivalRecord[];
    executions: import("./collaboration-state/contracts.js").ScopedExecutionRecord[];
    finalIntegrations: import("./collaboration-state/contracts.js").ScopedFinalIntegrationRecord[];
    /** Actual provider merge/synchronization facts, not Agent report claims. */
    agentMerges: import("./collaboration-state/contracts.js").ScopedAgentMergeRecord[];
    groupFinalMerges: import("./collaboration-state/contracts.js").ScopedGroupFinalMergeRecord[];
    managementTurns: import("./collaboration-state/contracts.js").ScopedLeaderTurnRecord[];
    activities: import("./collaboration-state/contracts.js").RuntimeActivity[];
    issues: import("./collaboration-state/contracts.js").ScopedGroupIssue[];
  };
}

export interface AuthoritativeWorkflowFiles {
  definition: AuthoritativeWorkflowDefinition;
  currentState: AuthoritativeWorkflowCurrentState;
}

export interface PendingMainDecision {
  sourceAgent: AgentName;
  sourceInvocationId: string;
  decisionPlan: string;
  requestedAt: string;
  /** Candidate outer workflow-node or finish targets for the current decision. */
  candidateAgents?: Array<WorkflowNodeId | "finish">;
  /** Exceptional events allow Main to choose any configured Agent. */
  allowAnyAgent?: boolean;
  reason?: "deterministic-route" | "weak-branch" | "termination" | "exception" | "route-missing" | "user" | "workflow-reconfigured" | "workflow-reconfiguration-rejected" | "loop-limit";
  diagnostic?: string;
  /** Authoritative invocation permissions captured when Main is queued. */
  capabilities?: MainCapabilitySnapshot;
}

export interface WorkflowImportSource {
  filename: string;
  text: string;
  notices: Array<{ path: string; message: string }>;
}

export interface AgentConfigPreset {
  schemaVersion: 2;
  kind: "scienceevolve-agent-config-preset";
  id: string;
  name: string;
  builtin: boolean;
  importSource?: WorkflowImportSource;
  sourceProjectId?: string;
  sourceProjectTitle?: string;
  createdAt?: string;
  updatedAt?: string;
  agents: AgentConfigMap;
  orchestration: AgentOrchestrationTemplate;
  skillDefinitions?: import("./project-skills.js").ProjectSkillDefinitions;
  mcpDefinitions?: import("./project-mcp.js").ProjectMcpDefinitions;
}

export interface SavedResearchTask {
  schemaVersion: 2;
  kind: "scienceevolve-saved-research-task";
  id: string;
  title: string;
  requirement: string;
  createdAt: string;
  updatedAt: string;
  agents: AgentConfigMap;
  orchestration: AgentOrchestrationTemplate;
  git?: ProjectGitInput;
  skillDefinitions?: import("./project-skills.js").ProjectSkillDefinitions;
  mcpDefinitions?: import("./project-mcp.js").ProjectMcpDefinitions;
}

export interface MainDecision {
  assessment: string;
  nextAgent: WorkflowNodeId | "finish" | "user";
  /** The sole natural-language handoff/output field for every Main decision. */
  message: string;
  rationale: string;
  successCriteria: string[];
  display: DisplaySelection | null;
  overridden?: boolean;
  overrideReason?: string;
}

/** The current business arrangement, derived from one committed control action. */
export interface CurrentAssignment {
  target: WorkflowNodeId | "finish" | "user";
  message: string;
  rationale: string;
  successCriteria: string[];
  display?: DisplaySelection | null;
  invocationId: string;
  updatedAt: string;
  overridden?: boolean;
  overrideReason?: string;
}

export interface UserIntervention {
  id: string;
  status: "pending" | "answered";
  requestedAt: string;
  answeredAt?: string;
  message: string;
  rationale: string;
  successCriteria: string[];
  requestedBy: AgentName;
  requestedInvocationId: string;
  requestKind: "main";
  /**
   * The routing context that caused Main to ask for a response. Keeping this
   * snapshot lets a reply resume a termination decision without losing its
   * finish candidate or the source Agent's weak-edge candidates.
   */
  pendingDecision?: PendingMainDecision;
  response?: string;
}

export interface DisplayItem {
  agent: AgentName;
  path: string;
  title: string;
  /**
   * Server-owned immutable publication identity. Control clients select by
   * Agent/path; Git collaboration binds the accepted selection to these
   * fields before it is journalled and exposed to readers.
   */
  artifactId?: string;
  commitSha?: string;
}

export interface DisplaySelection {
  primary: DisplayItem;
  items: DisplayItem[];
}

export interface ProjectUserInput {
  id: string;
  status: "pending" | "delivered";
  createdAt: string;
  message: string;
  /** How an input interacts with the currently running invocation. */
  mode?: "wait" | "interrupt";
  /** Client supplied idempotency key; never used as a credential. */
  requestId?: string;
  targetMainInvocation: number;
  deliveredAt?: string;
  deliveredInvocationId?: string;
}

/**
 * Public user-input operations that a Git collaboration runtime must commit
 * against its own authoritative state machine. The Orchestrator may delegate
 * these operations, but must never emulate them with the legacy serial loop.
 */
export interface CollaborationProjectUserInputRequest {
  message: string;
  mode: "wait" | "interrupt";
  requestId?: string;
}

export interface CollaborationUserInterventionResponseRequest {
  message: string;
}

export interface CollaborationRuntimeUserInteractionLifecycle {
  addProjectUserInput(
    state: ProjectState,
    input: CollaborationProjectUserInputRequest
  ): Promise<void>;
  respondToUserIntervention(
    state: ProjectState,
    input: CollaborationUserInterventionResponseRequest
  ): Promise<void>;
}

/** Durable, credential-free checkpoint captured before a user interrupt. */
export interface InterruptionSnapshot {
  status: "requested" | "interrupting" | "interrupted" | "force-terminated";
  inputId: string;
  requestId?: string;
  agent: AgentName;
  kind: AgentKind;
  invocationId: string;
  harness?: AgentHarness;
  gatewayId?: string;
  gatewayName?: string;
  gatewayProtocol?: AgentProtocol;
  model?: string;
  sessionId?: string;
  startedAt?: string;
  requestedAt: string;
  interruptedAt?: string;
  eventSeq: number;
  lastActivityAt?: string;
  activeTools: string[];
  partialOutput?: string;
  partialHandoff?: string;
  traceTail: string[];
  artifacts: Array<{ agent: AgentName; path: string; title?: string }>;
  workspaceSummary?: string;
  forceTerminated?: boolean;
  recoverable: boolean;
}

export interface GatewayModelStreamEvent {
  phase: "started" | "delta" | "completed";
  requestId: string;
  timestamp: string;
  streaming: boolean;
  deliveryMode: "native-stream" | "buffered-json";
  deltaKind?: "visible-text" | "reasoning" | "tool-arguments";
  text?: string;
  /** Local estimate for an atomically delivered response; never implies a live delta. */
  estimatedOutputTokens?: number;
  usage?: GatewayTokenUsage;
}

export interface InvocationPerformance {
  invocationId: string;
  agent: AgentName;
  attempt: number;
  status: "active" | "completed" | "incomplete";
  startedAt: string;
  firstTokenAt?: string;
  completedAt?: string;
  firstTokenLatencyMs?: number;
  currentTokensPerSecond?: number;
  /** A provider request is open; an invocation may instead be running tools. */
  requestActive?: boolean;
  averageTokensPerSecond?: number;
  /** Wall-clock interval used by the completed throughput calculation. */
  outputDurationMs?: number;
  outputTokens: number;
  tokenSource: "estimated" | "official";
  streaming: boolean;
}

export interface PerformanceAggregate {
  invocations: number;
  outputTokens: number;
  outputDurationMs: number;
  firstTokenSamples: number;
  totalFirstTokenLatencyMs: number;
  averageFirstTokenLatencyMs?: number;
  averageTokensPerSecond?: number;
  tokenSource: "estimated" | "official" | "mixed";
  updatedAt: string;
}

export interface ProjectPerformance {
  /** Most recently finished invocation for each Agent. */
  byAgent: Record<AgentName, InvocationPerformance>;
  /** Successful invocation aggregates for each Agent. */
  aggregateByAgent?: Record<AgentName, PerformanceAggregate>;
  /** Successful invocation aggregate for the whole project. */
  aggregate?: PerformanceAggregate;
  /** Recent terminal attempts, including attempts replaced during recovery. */
  history?: InvocationPerformance[];
  latest?: InvocationPerformance;
}

export interface LiveAssistantStream {
  projectId: string;
  invocationId: string;
  agent: AgentName;
  harnessId: string;
  attempt: number;
  itemId: string;
  content: string;
  truncated?: boolean;
  phase: "streaming" | "complete" | "incomplete";
  role: "active" | "process" | "final";
  updatedAt: string;
}

export interface ProjectLiveSnapshot {
  projectId: string;
  streams: LiveAssistantStream[];
  /** Attempt-local canonical tool events; never written to durable history. */
  events: TimelineEvent[];
  performance?: InvocationPerformance;
  /** Durable SQLite projection paired with this ephemeral stream snapshot. */
  runtime?: ProjectRuntimeProjection;
}

export interface AcceleratorAllocation {
  type: string;
  count: number;
}

export interface InspireWorkloadUsage {
  kind: "job" | "hpc" | "notebook" | "ray" | "serving";
  name: string;
  workspace: string;
  status: string;
  runningTimeMs: number;
  accelerators: AcceleratorAllocation[];
  observedAt: string;
}

export interface AcceleratorCardHours {
  type: string;
  cardHours: number;
}

export interface ProjectComputeUsage {
  source: "inspire";
  totalCardHours: number;
  byAccelerator: AcceleratorCardHours[];
  workloadCount: number;
  activeWorkloadCount: number;
  workloads: InspireWorkloadUsage[];
  updatedAt?: string;
}

export type NodeRunStatus =
  | "preparing"
  | "queued"
  | "coordinating"
  | "running"
  | "integrating"
  | "paused"
  | "blocked"
  | "cancelled"
  | "failed"
  | "completed";

export interface NodeRun {
  id: NodeRunId;
  node: NodeRef;
  workflowRevision: number;
  activationRequestId: string;
  inputSnapshotRef: string;
  optionalTask?: string;
  sourceNodeRunId?: NodeRunId;
  sourceAgentId?: AgentId;
  activatedByAgentId: AgentId;
  status: NodeRunStatus;
  routeEmissionId?: string;
  activatedAt?: string;
  updatedAt?: string;
  completedAt?: string;
  output?: string;
  failureReason?: string;
}

export type GroupRunStatus = Exclude<NodeRunStatus, "queued">;

export interface GroupRun {
  id: GroupRunId;
  nodeRunId: NodeRunId;
  memberSnapshot: AgentId[];
  leaderAgentId: AgentId;
  actingCoordinatorId?: AgentId;
  coordinatorEpoch: number;
  baseCommit: string;
  groupBranch: string;
  integrationTarget: "main";
  integrationOwnerExecutionId?: ExecutionId;
  finalPullRequestId?: PullRequestId;
  taskIds: TaskId[];
  status: GroupRunStatus;
  cancellationRequested?: boolean;
  pauseReason?: string;
  /** Durable bounded-recovery counter; exposed so Resume can derive a fresh idempotency key. */
  memberRecoveryAttempts?: number;
  memberRecoveryLimit?: number;
  startedAt?: string;
  updatedAt?: string;
  completedAt?: string;
  leaderDecision?: string;
  output?: string;
  failureReason?: string;
}

export type WorkTaskStatus =
  | "pending"
  | "assigned"
  | "working"
  | "waiting"
  | "continuation_pending"
  | "succeeded"
  | "failed"
  | "cancelled";

export interface WorkTask {
  id: TaskId;
  nodeRunId: NodeRunId;
  groupRunId?: GroupRunId;
  assignment: string;
  assigneeAgentId?: AgentId;
  dependencyTaskIds: TaskId[];
  queueOrdinal: number;
  currentExecutionId?: ExecutionId;
  status: WorkTaskStatus;
  predecessorTaskId?: TaskId;
  successorTaskId?: TaskId;
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string;
  waitReason?: string;
  failureReason?: string;
  cancelReason?: string;
}

export type MemberExecutionStatus =
  | "queued"
  | "working"
  | "waiting_authorization"
  | "waiting_review"
  | "pr_open"
  | "resolving"
  | "merged"
  | "stop_requested"
  | "stopped"
  | "superseded"
  | "succeeded"
  | "failed"
  | "cancelled";

export interface MemberExecution {
  id: ExecutionId;
  nodeRunId: NodeRunId;
  groupRunId?: GroupRunId;
  taskId: TaskId;
  agentId: AgentId;
  purpose: "delivery" | "final-integration";
  ownershipEpoch: number;
  status: MemberExecutionStatus;
  executionBranch: string;
  worktreePath: string;
  pullRequestId?: PullRequestId;
  invocationId?: InvocationId;
  sessionId?: string;
  predecessorExecutionId?: ExecutionId;
  successorExecutionId?: ExecutionId;
  failureReason?: string;
  queuedAt?: string;
  startedAt?: string;
  updatedAt?: string;
  completedAt?: string;
  waitReason?: string;
  output?: string;
}

export interface PullRequestCheckRecord {
  id: number;
  name: string;
  status: string;
  conclusion?: string;
  htmlUrl?: string;
  observedAt: string;
}

export interface PullRequestRecord {
  id: PullRequestId;
  providerNumber: number;
  htmlUrl: string;
  head: string;
  base: string;
  ownerExecutionId: ExecutionId;
  status: "open" | "conflicted" | "closed" | "merged" | "unknown";
  headSha?: string;
  baseSha?: string;
  mergeable?: boolean;
  mergeCommitSha?: string;
  diffUrl?: string;
  headCommitUrl?: string;
  conflictPaths?: string[];
  checks?: PullRequestCheckRecord[];
  blockers?: string[];
  reconciliation?: {
    status: "pending" | "observed" | "uncertain" | "failed";
    operationId?: OperationId;
    message?: string;
    observedAt?: string;
  };
  observedAt: string;
}

export interface OperationRecord {
  id: OperationId;
  kind:
    | "repository.create"
    | "git.push"
    | "git.revert"
    | "pull.create"
    | "pull.merge"
    | "pull.close"
    | "memory.commit";
  payloadHash: string;
  status: "prepared" | "observed" | "finalized" | "uncertain" | "failed" | "superseded";
  ownerExecutionId?: ExecutionId;
  ownershipEpoch?: number;
  expectedHead?: string;
  expectedBase?: string;
  remoteFact?: Record<string, unknown>;
}

/** Credential-free native Session identity fenced by a recovery observation. */
export interface ResidentRecoverySessionIdentity {
  schemaVersion: 1;
  harnessId: string;
  adapterVersion: string;
  generation: number;
  nativeId: string;
  durable: boolean;
  createdAt: string;
  resumedAt?: string;
}

export interface ResidentDurableRehydrateProvenance {
  sourceDigest: string;
  lastBusinessTurn: number;
  lastInputId: string;
  transcript: string;
}

export type ResidentRecoveryScope = "main-route" | "group-leader" | "member";

/**
 * Durable stop observation. It is not yet authority to run: the next turn
 * must bind it to one exact invocation/input/epoch and consume that proof.
 */
export interface ResidentRecoveryProofSeed {
  schemaVersion: 1;
  seedId: string;
  scope: ResidentRecoveryScope;
  projectId: string;
  sourceNodeRunId: string;
  scopeId: string;
  agentId: string;
  stoppedEpoch: number;
  oldSession: ResidentRecoverySessionIdentity;
  oldSessionDigest: string;
  stopObservation: {
    observedAt: string;
    evidence: Readonly<Record<string, unknown>>;
  };
  durableRehydrate?: ResidentDurableRehydrateProvenance;
}

/** One seed bound to exactly one new native turn. */
export interface ResidentRecoveryProof {
  schemaVersion: 1;
  proofId: string;
  seedId: string;
  scope: ResidentRecoveryScope;
  projectId: string;
  sourceNodeRunId: string;
  scopeId: string;
  agentId: string;
  oldSession: ResidentRecoverySessionIdentity;
  oldSessionDigest: string;
  stopObservation: ResidentRecoveryProofSeed["stopObservation"];
  newInvocationId: string;
  routeEpoch: number;
  inputId: string;
  createdAt: string;
  durableRehydrate?: ResidentDurableRehydrateProvenance;
}

/**
 * One business task handled by an Agent. Technical invocations, retries and
 * session resumes remain attached to the same execution until the task is
 * handed off, superseded or terminated.
 */
export interface ActiveAgentExecution {
  id: string;
  agent: AgentName;
  source:
    | "project-input"
    | "main-assignment"
    | "configured-route"
    | "main-decision"
    | "user-input"
    | "user-response"
    | "project-reopen"
    | "recovery";
  createdAt: string;
  sourceAgent?: AgentName;
  sourceInvocationId?: string;
  startedAt?: string;
  firstInvocationId?: string;
  latestInvocationId?: string;
}

/**
 * The live project fields derived from one SQLite collaboration projection.
 * Legacy state.json fields mirror this value but never outrank it.
 */
export interface ProjectRuntimeProjection {
  stateRevision: number;
  status: ProjectStatus;
  phase: string;
  waiting?: {
    kind: "recovery" | "management" | "workflow-adjustment";
    reason: string;
    agentId?: AgentName;
    groupRunId?: string;
    executionId?: string;
    operationId?: string;
  };
  currentAgent?: AgentName;
  activeInvocationId?: InvocationId;
  activityStartedAt?: string;
  nodeRunId?: NodeRunId;
  groupRunId?: GroupRunId;
  taskId?: TaskId;
  executionId?: ExecutionId;
  ownershipEpoch?: number;
  coordinatorEpoch?: number;
  leaseState?: "current" | "recovering";
  executionCount: number;
  primaryActivity?: import("./collaboration-state/contracts.js").RuntimeActivity;
  activities: import("./collaboration-state/contracts.js").RuntimeActivity[];
}

export type FailureAttemptStatus = "failed" | "succeeded";

/**
 * One immutable outcome at a recoverable backend boundary. A retry always
 * creates another record; it never mutates or replaces an earlier failure.
 */
export interface FailureAttempt {
  attemptId: string;
  projectId: string;
  scope: "git" | "resident" | "tool" | "control" | "usage" | "scheduler";
  operation: string;
  status: FailureAttemptStatus;
  errorCode: string | null;
  retryable: boolean;
  redactedMessage: string;
  causeClass: string;
  agentId?: AgentId;
  nodeRunId?: NodeRunId;
  groupRunId?: GroupRunId;
  taskId?: TaskId;
  executionId?: ExecutionId;
  coordinatorEpoch?: number;
  invocationId?: InvocationId;
  ownershipEpoch?: number;
  startedAt: string;
  finishedAt: string;
  metadata: Readonly<Record<string, unknown>>;
}

export interface FailureAttemptOperationSummary {
  scope: FailureAttempt["scope"];
  operation: string;
  status: FailureAttemptStatus;
  attemptId: string;
  attemptCount: number;
  failureCount: number;
  startedAt: string;
  finishedAt: string;
  lastFailureAt?: string;
  lastSuccessAt?: string;
}

/** Mutable read-model summary derived from the immutable attempt history. */
export interface FailureAttemptSummary {
  currentStatus: "healthy" | "failed";
  totalAttempts: number;
  failedAttempts: number;
  succeededAttempts: number;
  unresolvedFailures: number;
  latestAttempt?: FailureAttempt;
  latestFailure?: FailureAttempt;
  operations: FailureAttemptOperationSummary[];
}

export type GitRetrySchedulingMilestoneName =
  | "retryAcceptedAt"
  | "gitReadyPersistedAt"
  | "priorRunSettledAt"
  | "scheduleEnqueuedAt"
  | "mainResidentOpenedAt";

export interface GitRetrySchedulingWait {
  kind:
    | "none"
    | "git-initialization"
    | "prior-project-run"
    | "scheduler"
    | "main-resident";
  objectId: string | null;
  reason: string | null;
  deadlineAt: string | null;
}

/** One immutable point in the accepted Git-retry to Main-resident timeline. */
export interface GitRetrySchedulingPoint {
  at: string;
  projectId: string;
  invocationId: InvocationId | null;
  epoch: number | null;
  epochKind: "ownership" | "coordinator" | null;
  waitingFor: GitRetrySchedulingWait;
}

/** Read model grouped from append-only git.retry.scheduling.milestone events. */
export interface GitRetrySchedulingTimeline {
  retryId: string;
  projectId: string;
  operationId: string;
  attempt: number;
  retryAcceptedAt?: GitRetrySchedulingPoint;
  gitReadyPersistedAt?: GitRetrySchedulingPoint;
  priorRunSettledAt?: GitRetrySchedulingPoint;
  scheduleEnqueuedAt?: GitRetrySchedulingPoint;
  mainResidentOpenedAt?: GitRetrySchedulingPoint;
}

export interface ProjectState {
  /** Set by new-project creation only; opening old projects never opts them in. */
  formalStateProtocol?: "project-state-v1";
  /** Task-owned, immutable versioned Skill and stdio MCP source bundles. */
  skillDefinitions?: import("./project-skills.js").ProjectSkillDefinitions;
  mcpDefinitions?: import("./project-mcp.js").ProjectMcpDefinitions;
  id: string;
  title: string;
  requirement: string;
  /** Original user-supplied files in the shared workspaces/user_inputs folder. */
  inputFiles?: string[];
  inputDescription?: string;
  status: ProjectStatus;
  phase: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelledBy?: CancellationRequest["actor"];
  cancelReason?: CancellationRequest["reason"];
  cancellationRequestedAt?: string;
  cancellationSettledAt?: string;
  /** User safe-point Pause intent. A pending request survives service loss;
   * settledAt is written only after the live residents actually pause. */
  pauseRequest?: { requestedAt: string; settledAt?: string };
  workspaceCheckpoints?: WorkspaceCheckpoint[];
  routeRecovery?: { agent: AgentName; invocationId: string; status: "repairing" | "awaiting_main" | "repaired" };
  archivedAt?: string;
  interruptedAt?: string;
  currentAgent?: AgentName;
  queuedAgent?: AgentName;
  queueEnteredAt?: string;
  queueOrder?: number;
  activeInvocationId?: string;
  turn: number;
  cycle: number;
  eventSeq: number;
  consecutiveFailures: number;
  retryAt?: string;
  /** Durable automatic recovery intent. Exhausted fast retries schedule a
   * later round instead of pausing the workflow or discarding its progress. */
  workflowRecovery?: {
    attempt: number;
    pending: boolean;
    nextRetryAt: string;
    startedAt: string;
    phase: string;
    reason: string;
  };
  lastError?: string;
  /** Incremented whenever a completed project is reopened by new user input. */
  completionGeneration: number;
  /** Successful technical invocation commits; retained for orchestration compatibility. */
  runCounts: Record<AgentName, number>;
  /** Iterations started in the current batch; only explicit group re-entry resets this count. */
  loopIterations?: Record<string, number>;
  loopBatches?: Record<string, number>;
  /** Audit-only total, never used as a termination condition. */
  loopTotalIterations?: Record<string, number>;
  /** Business executions started per Agent, independent of retries and resumes. */
  executionCounts?: Record<AgentName, number>;
  /** The single queued/running business execution in this serial workflow. */
  activeAgentExecution?: ActiveAgentExecution;
  mainInvocationSeq: number;
  /** Durable Codex threads for Workers whose config enables persistence. */
  agentSessionIds?: Record<AgentName, string>;
  /** Structured cross-Harness sessions; legacy IDs are dual-written during migration. */
  agentSessions?: Record<AgentName, SessionRef>;
  /** Exact historical bindings of Agents removed by an accepted revision. */
  archivedAgentSessions?: ArchivedWorkflowAgentSessions[];
  /** Session identities owned by unfinished business executions. */
  taskSessionRefs?: Record<string, SessionRef>;
  taskSessionIds?: Record<string, string>;
  agentSessionMeta?: Record<AgentName, {
    generation: number;
    contextSeq: number;
    resumeFailureCount: number;
    replacementPending?: boolean;
    lastResumeFailureAt?: string;
  }>;
  controlProtocol?: "natural-language-tools-v1";
  /** Last event sequence acknowledged by the durable Main thread. */
  mainContextSeq: number;
  agents: AgentConfigMap;
  orchestration: AgentOrchestrationTemplate;
  latestHandoff?: HandoffRecord;
  /** Agent-authored completion requests; acceptance never implies group/project completion. */
  taskCompletions?: Record<string, TaskCompletionRecord>;
  /** Last business arrangement committed by Main; never a model result schema. */
  latestAssignment?: CurrentAssignment;
  /** A completed Agent whose weak route now requires Main to choose. */
  pendingMainDecision?: PendingMainDecision;
  /** Current Main permissions; legacy states derive this once on next invocation. */
  mainCapabilities?: MainCapabilitySnapshot;
  /** Structured snapshot supplied to each Main invocation and persisted for recovery/audit. */
  mainInvocationContext?: Record<string, unknown>;
  userIntervention?: UserIntervention;
  display?: DisplaySelection;
  /** Non-fatal display diagnostic; the last valid display remains active. */
  displayError?: string;
  userInputs: ProjectUserInput[];
  /** Pending/last user interrupt checkpoint; contains no gateway secret. */
  interruptionSnapshot?: InterruptionSnapshot;
  /** Internal request marker used to complete one interrupt exactly once. */
  interruptRequest?: {
    inputId: string;
    invocationId: string;
    agent: AgentName;
    requestedAt: string;
    deadlineAt: string;
    forceTerminated?: boolean;
  };
  tokenUsage: ProjectTokenUsage;
  /** Last completed invocation performance per Agent; active values are live-only. */
  performance?: ProjectPerformance;
  computeUsage: ProjectComputeUsage;
  /** Missing on legacy projects and interpreted as disabled by v2 readers. */
  git?: ProjectGitState;
  /** Immutable workflow revision used by new node/group runs. */
  workflowRevision?: number;
  /** Serial outer-node ownership; member executions are scoped below it. */
  activeNodeRunId?: NodeRunId;
  nodeRuns?: NodeRun[];
  groupRuns?: GroupRun[];
  scopedGroupRuns?: import("./collaboration-state/contracts.js").ScopedGroupRunRecord[];
  scopedGroupIssues?: import("./collaboration-state/contracts.js").ScopedGroupIssue[];
  scopedManagementFailures?: import("./collaboration-state/contracts.js").ScopedManagementFailureRecord[];
  scopedManagementTurns?: import("./collaboration-state/contracts.js").ScopedLeaderTurnRecord[];
  scopedArrivals?: import("./collaboration-state/contracts.js").ScopedArrivalRecord[];
  scopedExecutions?: import("./collaboration-state/contracts.js").ScopedExecutionRecord[];
  scopedAgentReports?: import("./collaboration-state/contracts.js").ScopedAgentReportRecord[];
  scopedAgentTaskCompletions?: import("./collaboration-state/contracts.js").ScopedAgentTaskCompletionRecord[];
  scopedFinalIntegrations?: import("./collaboration-state/contracts.js").ScopedFinalIntegrationRecord[];
  scopedPullRequests?: PullRequestRecord[];
  scopedAgentMerges?: import("./collaboration-state/contracts.js").ScopedAgentMergeRecord[];
  scopedGroupFinalMerges?: import("./collaboration-state/contracts.js").ScopedGroupFinalMergeRecord[];
  tasks?: WorkTask[];
  executions?: MemberExecution[];
  pullRequests?: PullRequestRecord[];
  /** Independently observed deliveries after the original standalone PR. */
  additionalPullRequests?: Array<PullRequestRecord & { originalPullRequestId: string; ownershipEpoch: number }>;
  operations?: OperationRecord[];
  /** Current activity and public status, derived exclusively from SQLite S. */
  runtime?: ProjectRuntimeProjection;
  /** Durable append-only backend attempt history projected from SQLite S. */
  failureAttempts?: FailureAttempt[];
  /** Current diagnostics derived separately from the immutable history. */
  failureSummary?: FailureAttemptSummary;
  /** Durable Git retry-to-scheduler timelines projected from SQLite S. */
  gitRetryScheduling?: GitRetrySchedulingTimeline[];
  /**
   * Credential-free projection metadata owned by the collaboration state
   * machine. The legacy file state remains the UI/read-model envelope; SQLite
   * is authoritative for every collaboration transition.
   */
  collaboration?: {
    stateRevision: number;
    formalState?: import("./project-state-documents.js").UnifiedProjectStateProjection;
    businessState?: import("./collaboration-state/contracts.js").CredentialFreeProjectStateProjection["businessState"];
    frozen: boolean;
    freezeReason?: string;
    /** Highest collaboration event durably mirrored into events.jsonl. */
    eventSeq: number;
    routeOutbox: import("./collaboration-state/contracts.js").RouteOutboxRecord[];
    usage: import("./collaboration-state/contracts.js").UsageRecord[];
  };
  /** User edits remain locked after start; authorized Main changes use apply_workflow. */
  configurationLocked?: boolean;
  lockedAt?: string;
  /** Consecutive whole-call failures tracked independently per Agent. */
  workerFailureCounts?: Record<AgentName, number>;
  /** Transport recovery has its own durable backoff, outside business retries. */
  harnessRecoveryAttempts?: Record<AgentName, number>;
  /** Recent whole-call failures supplied to Main after the retry limit. */
  agentFailureHistory?: Record<AgentName, AgentFailureRecord[]>;
  /** Formal artifacts explicitly published through the orchestration control channel. */
  artifacts?: ArtifactRecord[];
  /** Legacy Explainer proposals retained for compatibility; no longer affect progress. */
  explainerProgress?: {
    percent: number;
    evidence: string;
    successfulCalls: number;
    artifactCount: number;
    updatedAt: string;
  };
}

export interface ArtifactRecord {
  id: string;
  agent: AgentName;
  invocationId: string;
  path: string;
  title: string;
  kind: string;
  description: string;
  size: number;
  mediaType?: string;
  /** Content identity captured when publish_artifact commits. */
  sha256?: string;
  /** Filesystem facts captured at commit time. */
  modifiedAt?: string;
  registeredAt?: string;
  updatedAt: string;
  /**
   * Git-enabled projects may expose an artifact only after the producing
   * execution's pull request is observed merged.  The retained worktree is
   * recorded for authority checks, while reads are pinned to commitSha.
   * Legacy Git-off records intentionally omit this field.
   */
  gitSource?: {
    executionId: ExecutionId;
    ownershipEpoch: number;
    worktreePath: string;
    commitSha: string;
    pullRequestId: PullRequestId;
    acceptedBase: string;
  };
}

export interface AgentFailureRecord {
  invocationId: string;
  failedAt: string;
  errorType: string;
  error: string;
  /** Stable Harness error classification; absent on legacy/Agent errors. */
  errorCode?: HarnessRuntimeErrorCode;
  /** Credential-free component boundary that classified the Harness error. */
  errorSource?: HarnessRuntimeErrorSource;
  /** Whether automatic whole-invocation retry was permitted. */
  retryable?: boolean;
  tracePath: string;
  message: string;
  candidateAgents: Array<WorkflowNodeId | "finish">;
}

export type AgentProgressState =
  | "waiting"
  | "queued"
  | "running"
  | "retrying"
  | "interrupting"
  | "interrupted"
  | "completed"
  | "paused"
  | "cancelled"
  | "failed";

export interface AgentProgress {
  state: AgentProgressState;
  runs: number;
  /** User-facing business execution count. */
  executions?: number;
  queuePosition?: number;
}

export interface OverallProgress {
  percent: number;
  label: string;
  /** Position estimate from shortest workflow distances; not elapsed-time progress. */
  estimated: true;
  /** Legacy activity telemetry; does not affect the percentage. */
  successfulCalls: number;
}

export interface ArchivedWorkflowAgentSessions {
  agentId: AgentName;
  harnessId: string;
  workflowRevision: number;
  sessions: Record<string, { session?: SessionRef; legacyId?: string }>;
  definition?: AgentOrchestrationTemplate["agents"][number];
  meta?: Partial<NonNullable<ProjectState["agentSessionMeta"]>[AgentName]>;
}

export interface ProjectView extends ProjectState {
  queuePosition?: number;
  queueDepth: number;
  agentProgress: Record<AgentName, AgentProgress>;
  overallProgress: OverallProgress;
}

export interface AgentQueueItem {
  projectId: string;
  position: number;
  enteredAt: string;
  id?: string;
  agentId?: string;
  executionId?: string;
  groupRunId?: string;
  poolId?: string;
  reason?: string;
}

export interface AgentQueueTask {
  id: string;
  projectId: string;
  agentId?: string;
  invocationId?: string;
  executionId?: string;
  groupRunId?: string;
  startedAt?: string;
  state: "running" | "starting" | "recovering";
}

export interface AgentQueuePool {
  id: string;
  scope: "shared" | "project";
  projectId?: string;
  capacity: number;
  occupied: number;
}

export interface AgentKindQueueSnapshot {
  capacity: number;
  activeProjectIds: string[];
  queued: AgentQueueItem[];
  activeTasks?: AgentQueueTask[];
  recoveringTasks?: AgentQueueTask[];
  pools?: AgentQueuePool[];
}

export type AgentQueueSnapshot = Record<AgentKind, AgentKindQueueSnapshot>;

export interface ProjectSummary {
  id: string;
  title: string;
  requirement: string;
  status: ProjectStatus;
  phase: string;
  createdAt: string;
  updatedAt: string;
  currentAgent?: AgentName;
  queuedAgent?: AgentName;
  turn: number;
  cycle: number;
}

export interface TimelineEvent {
  id: string;
  /** Stable collaboration-event identity used for reconnect deduplication. */
  eventId?: string;
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
  invocationId?: InvocationId;
  ownershipEpoch?: number;
  coordinatorEpoch?: number;
  ts: string;
  type:
    | "project.created"
    | "configuration.locked"
    | "project.completed"
    | "project.progress.updated"
    | "project.reopened"
    | "project.status"
    | "project.cancellation.settled"
    | "workspace.checkpoint.saved"
    | "project.config.updated"
    | "workflow.reconfigured"
    | "workflow.reconfiguration.rejected"
    | "workflow.loop.iteration"
    | "workflow.loop.exhausted"
    | "workflow.loop.batch.started"
    | "agent.queued"
    | "agent.execution.started"
    | "agent.execution.ended"
    | "agent.started"
    | "agent.experiment.waiting"
    | "agent.experiment.resumed"
    | "agent.trace"
    | "agent.completed"
    | "agent.failed"
    | "invocation.started"
    | "invocation.completed"
    | "invocation.performance"
    | "invocation.failed"
    | "handoff.saved"
    | "task.finish.requested"
    | "route.queued"
    | "main.assignment.queued"
    | "main.assignment.committed"
    | "session.started"
    | "control.action.staged"
    | "control.action.rejected"
    | "control.action.committed"
    | "control.channel.unavailable"
    | "artifact.published"
    | "display.selected"
    | "session.resume_failed"
    | "session.replaced"
    | "iteration.started"
    | "user.intervention.requested"
    | "user.intervention.answered"
    | "user.input.queued"
    | "user.input.delivered"
    | "user.input.interrupt.requested"
    | "user.input.interrupt.completed"
    | "agent.interrupting"
    | "agent.interrupted"
    | "workflow.node.started"
    | "workflow.node.updated"
    | "workflow.node.completed"
    | "workflow.node.failed"
    | "collaboration.group.started"
    | "collaboration.group.updated"
    | "collaboration.group.completed"
    | "collaboration.group.failed"
    | "collaboration.task.created"
    | "collaboration.task.assigned"
    | "collaboration.task.updated"
    | "collaboration.execution.queued"
    | "collaboration.execution.started"
    | "collaboration.execution.updated"
    | "collaboration.execution.completed"
    | "collaboration.execution.failed"
    | "collaboration.route.emitted"
    | "collaboration.main.frozen"
    | "collaboration.main.recovered"
    | "pull.request.observed"
    | "pull.request.updated"
    | "git.initialization.updated"
    | "failure.attempt.recorded"
    | "usage.persistence.failed";
  level: "info" | "warning" | "error";
  agent?: AgentName;
  message: string;
  data?: Record<string, unknown>;
}

/**
 * Read model exposed by the workspace file catalog. Files are indexed once
 * in the common project workspace; unregistered files use producer "shared".
 * Publication remains a separate formal registration and integrity boundary.
 */
export interface ArtifactFileVariant {
  id: string;
  path: string;
  mediaType: string;
  producer: AgentName;
  size: number;
  updatedAt: string;
  origin: "workspace";
  /** Credential-free provenance for an immutable Git-backed catalog item. */
  gitSource?: Omit<NonNullable<ArtifactRecord["gitSource"]>, "worktreePath">;
  /** User-facing live file source; never grants Agent publication authority. */
  workspaceId?: string;
  workspaceLabel?: string;
}
export interface ArtifactListItem extends ArtifactFileVariant { variants?: ArtifactFileVariant[] }

export interface ArtifactCatalogSummary {
  groups: Record<AgentName, number>;
  total: number;
}

export interface ArtifactCatalogPage extends ArtifactCatalogSummary {
  artifacts: ArtifactListItem[];
  offset: number;
  limit: number;
  hasMore: boolean;
}

export interface ArtifactDirectoryEntry {
  type: "directory" | "file";
  name: string;
  path: string;
  producer: AgentName;
  origin: "workspace";
  size?: number;
  updatedAt?: string;
  mediaType?: string;
  id?: string;
  commitSha?: string;
  workspaceId?: string;
  workspaceLabel?: string;
  variants?: ArtifactFileVariant[];
}

/** A bounded listing of only the direct children of one shared-workspace directory. */
export interface ArtifactDirectoryPage {
  agent: AgentName;
  directory: string;
  parent?: string;
  entries: ArtifactDirectoryEntry[];
  offset: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

/** Canonical natural-language handoff read model; legacy result snapshots are UI compatibility only. */
export interface HandoffRecord {
  /** Verbatim Agent communication, separate from the archived Markdown envelope. */
  body?: string;
  agent: AgentName;
  invocationId: string;
  markdown: string;
  excerpt: string;
  updatedAt: string;
}

export interface TaskCompletionRecord {
  taskId: string;
  agent: AgentName;
  invocationId: string;
  callId: string;
  requestedAt: string;
  status: "requested" | "accepted";
  summary?: string;
  memory?: string;
  memoryPath?: string;
  handoffPath?: string;
  acceptedAt?: string;
}

/** Invocation ownership supplied to a Harness without changing its workflow purpose. */
export type CollaborationExecutionContext =
  | {
      nodeRunId: NodeRunId;
      groupRunId: GroupRunId;
      routeScopeId?: never;
      role: "leader";
      coordinatorEpoch: number;
    }
  | {
      nodeRunId: NodeRunId;
      routeScopeId: MainRouteScopeId;
      groupRunId?: never;
      role: "leader";
      coordinatorEpoch: number;
    }
  | {
      nodeRunId: NodeRunId;
      groupRunId?: GroupRunId;
      /** Scoped graph arrivals do not fabricate legacy WorkTasks. */
      taskId?: TaskId;
      executionId: ExecutionId;
      role: "delivery" | "final-integration";
      ownershipEpoch: number;
      coordinatorEpoch?: number;
      executionWorktree: string;
    };

/** Server-only grant for the original Agent to observe one completed task's
 * retained push. This is neither Agent configuration nor renewed business work. */
export interface TerminalPushObservationScope {
  operationId: OperationId;
}

/** Server-only, single-invocation grant for the original stopped execution.
 * Its immutable report remains A; necessary closing delivery is recorded separately. */
export interface WorktreeClosingScope {
  kind: "completed-leftovers" | "bound-report-memory";
  reportHeadSha: string;
  paths: string[];
  executionId: ExecutionId;
  ownershipEpoch: number;
  grantInvocationId: string;
  grantCallId: string;
}

/** Server-only grant for one original manager's historical receipt decision.
 * Main acting as a group Leader retains Leader capabilities in this turn. */
export interface TerminalPushCoordinationScope {
  incidentId: string;
  coordinatorEpoch: number;
  level: number;
  role: "leader" | "main";
  canRequestUser: boolean;
}

export interface HarnessRecoveryEvent {
  phase: "waiting" | "recovered";
  inputId: string;
  invocationId: string;
  harnessId: string;
  attempt: number;
  errorCode: string;
  message: string;
  nextRetryAt?: string;
}

export interface AgentRunRequest {
  /** Exact Storage-authored optional sections, never inferred from task text. */
  contextBackgrounds?: import("./context-injection-budget.js").ContextReplacement[];
  additionalContextIndexes?: import("./agent-context-index.js").AgentContextIndex[];
  /** Server-owned detail records, published with complete read-only indexes. */
  contextSources?: import("./agent-context-index.js").AgentContextSource[];
  /** Current user requirements that require actual native-message reception. */
  nativeInputNotices?: string[];
  /** Trusted, invocation-scoped built-in SII MCP. Never user supplied. */
  siiMcp?: { url: string };
  siiResumePrompt?: string;
  /** Release/reacquire model scheduler authority around code-only waiting. */
  onExperimentWait?: (waiting: boolean) => Promise<void>;
  /** Trusted lifecycle callbacks; recovery never changes business ownership. */
  onHarnessRecovery?: (event: HarnessRecoveryEvent) => Promise<void>;
  onHarnessRecoveryWait?: (waiting: boolean) => Promise<void>;
  /** I-owned physical turn boundaries, including retained-session retries. */
  onResidentTurnActivity?: (activity: { inputId: string; invocationId: string; active: boolean }) => void;
  project: ProjectState;
  /** Runtime purpose; workflow is the backward-compatible default. */
  purpose?: "workflow" | "explainer" | "probe";
  agent: AgentName;
  /** Agent kind resolved from the project's orchestration template. */
  kind: AgentKind;
  permission: AgentPermission;
  invocationId: string;
  inboxPath: string;
  projectPath: string;
  workspacePath: string;
  schemaPath: string;
  skillPaths: string[];
  autoSkillPaths?: string[];
  availableSkillPaths: string[];
  /** Read-only discovery metadata; it never adds invocation tool capabilities. */
  toolCatalog?: import("./agent-tool-catalog.js").AgentToolCatalog;
  /** Trusted catalog for on-demand management inspection; never auto-inlined. */
  availableSkills?: import("./skill-catalog.js").SkillDescriptor[];
  /** This turn's actual management scope, independent of the Agent name. */
  workflowContext?: import("./workflow-context.js").WorkflowContextRequest;
  runtimePath: string;
  /** Stable business-execution identity used for strict in-task recovery. */
  taskSessionId?: string;
  /** Collaboration scope; Harness adapters still receive purpose `workflow`. */
  executionContext?: CollaborationExecutionContext;
  /** Trusted direct integration target for Git inspection; never Agent input. */
  gitDirectBase?: string;
  /** Server-only invocation transport; never exposed as an Agent capability. */
  gatewayModelFetch?: import("./protocol-router.js").GatewayModelFetch;
  /** Scoped workflow invariant: a still-existing Agent must never acquire a replacement native session. */
  sessionContinuity?: "strict";
  /** Resume the same Session for a missing terminal control action. */
  terminalControlRepair?: { originalHandoff: string };
  terminalPushObservation?: TerminalPushObservationScope;
  terminalPushCoordination?: TerminalPushCoordinationScope;
  worktreeClosing?: WorktreeClosingScope;
  /** Invocation-scoped natural-language control bridge. */
  control?: ControlMcpRequest;
  /** Compatibility form of the selected Adapter's durable native session ID. */
  resumeThreadId?: string;
  /** Legacy Adapter-facing callback; Facades combine it before persistence. */
  onThreadStarted?: (threadId: string) => Promise<void> | void;
  /** Structured Adapter-facing callback; Facades combine it before persistence. */
  onSessionStarted?: (session: SessionRef) => Promise<void> | void;
  /**
   * Atomically publishes both forms of one durable Harness session identity.
   * Facades should prefer this callback so persisted readers can never observe
   * a structured SessionRef without its compatibility native ID (or vice
   * versa).
   */
  onDurableSessionStarted?: (
    session: SessionRef,
    legacyId: string
  ) => Promise<void> | void;
  /** Trusted resident launcher reports the actual native runtime, rather
   * than inferring it from an invocation's staged input directory. */
  onResidentNativeOpened?: (binding: { runtimePath: string; session: SessionRef }) => Promise<void> | void;
  /** Server-only result capture with the actual opened resident Session. */
  onControlResult?: (input: import("./control-result-receipts.js").ControlResultInput, session: SessionRef) => Promise<string> | string;
  /** Server-only state service; no caller-selected identity or project. */
  onProjectStateRequest?: (request: import("./project-state.js").ProjectStateRequest) => Promise<unknown> | unknown;
  /** Server-only supplements to the next already-authorized native input. */
  onPendingControlResults?: (inputId: string, session: SessionRef) => Promise<string> | string;
  /** Bound immediately before the next authorized native input is sent. */
  onPendingWorkflowAdjustments?: (inputId: string, session: SessionRef,
    publishContext?: import("./agent-context-index.js").AgentContextPublisher) => Promise<string> | string;
  /** Ordinary invocation input intent; some CLIs report their actual Session
   * only after launch. Reception still requires the trusted native observer. */
  onPrepareWorkflowAdjustmentInput?: (input: { inputId: string; expectedSession?: SessionRef;
    publishContext?: import("./agent-context-index.js").AgentContextPublisher }) => Promise<string> | string;
  onWorkflowAdjustmentInputReceived?: (event: Record<string, unknown>, session: SessionRef, inputId: string) => Promise<void> | void;
  /** Reports classified substantive model progress or local tool lifecycle. */
  onModelActivity?: (activity: AgentActivitySignal) => void;
  /** Adapter-only tap for the CLI's already-structured official event envelope. */
  onOfficialHarnessEvent?: (event: Record<string, unknown>, nativeSession?: SessionRef) => Promise<void> | void;
  /** Server-only observation of an actual, redacted native user message
   * before its display preview is bounded. Never an admission acknowledgement. */
  onNativeUserInput?: (event: Record<string, unknown>, nativeSession?: SessionRef) => Promise<void> | void;
  /** Reports one completed upstream model request at the gateway boundary. */
  onTokenUsage?: (usage: GatewayUsageReport) => Promise<void> | void;
  /** Reports a durable-accounting failure after the provider request completed. */
  onTokenUsagePersistenceFailure?: (
    failure: GatewayUsagePersistenceFailure
  ) => Promise<void> | void;
  /** Provider-boundary request/delta lifecycle used for performance telemetry. */
  onModelStreamEvent?: (event: GatewayModelStreamEvent) => Promise<void> | void;
  /** Facade-owned validated canonical display channel; never exposed to an Adapter.
   * The Record intersection retains compatibility with generic observation callbacks. */
  onLiveHarnessEvent?: (event: HarnessEvent & Record<string, unknown>) => Promise<void> | void;
  /** Clears failed-attempt display state before same-Harness recovery. */
  onHarnessAttemptReset?: (attempt: number) => Promise<void> | void;
}

export interface AgentRunResult {
  threadId?: string;
  /** Raw natural-language final agent message for the current invocation. */
  handoff?: string;
  controlActions?: ControlActionEnvelope[];
}

export type ControlAction =
  | { tool: "finish_task"; summary?: string; memory?: string }
  /** Explicit business Git operations. These are invocation-scoped intents;
   * the server binds execution, branch, repository and ownership epoch. */
  | { tool: "git_push"; reason?: string }
  | { tool: "git_get_operation"; operationId: OperationId }
  | { tool: "git_reconcile_push"; operationId: OperationId; retry?: boolean; historical?: boolean }
  | { tool: "github_create_pr"; base: string; title: string; body: string }
  | { tool: "github_get_pr"; providerNumber?: number; sourceOperationId?: OperationId }
  | { tool: "github_merge_pr"; providerNumber: number; reason?: string }
  | { tool: "github_close_pr"; providerNumber: number; reason?: string }
  | { tool: "git_prepare_conflict" }
  | { tool: "git_log"; revision?: string; offset?: number; limit?: number }
  | { tool: "git_show"; commit: string; offset?: number; maxBytes?: number; expectedVersion?: string }
  | { tool: "git_diff"; mode: "workspace" | "staged" | "revisions"; from?: string; to?: string;
      expectedHead?: string; offset?: number; maxBytes?: number; expectedVersion?: string }
  | { tool: "git_revert"; mode: "preview" | "apply"; target: string; expectedHead: string;
      mainline?: number; sourceOperationId?: OperationId; offset?: number; maxBytes?: number; expectedVersion?: string }
  | { tool: "git_revert"; mode: "status" | "continue" | "abort"; operationId: OperationId; expectedHead?: string }
  | { tool: "coordinate_group_task"; groupRunId: GroupRunId; coordinatorEpoch: number;
      arrivalRequestId: string; operation: "retry" | "escalate" | "skip" | "close_worktree"; rationale: string;
      repairNodeId?: string;
      /** Separate explicit permission for an identified original owner. An
       * ordinary retry never grants completed/bound-report file writes. */
      closing?: { executionId: ExecutionId; ownershipEpoch: number; paths: string[] } }
  /** Internal receipt coordinator intent; allocated only to that exact
   * mechanism turn, never as a general-purpose Leader/Main wake tool. */
  | { tool: "coordinate_agent_receipt"; incidentId: string;
      operation: "retry" | "escalate"; rationale: string }
  | { tool: "route_to_agent"; target: WorkflowNodeId; assignment?: string; rationale?: string; context?: string; successCriteria?: string[] }
  | { tool: "publish_artifact"; path: string; title: string; kind: string; description: string; replacesPath?: string }
  | { tool: "select_display"; primary: DisplayItem; items?: DisplayItem[] }
  | { tool: "request_user"; message: string; rationale: string; context?: string }
  | { tool: "apply_workflow"; path: string; rationale: string }
  | {
      tool: "assign_group_tasks";
      groupRunId: GroupRunId;
      coordinatorEpoch: number;
      tasks: Array<{
        /** Stable leader-chosen identity; dependencyTaskIds reference these ids. */
        taskId: TaskId;
        assignment: string;
        assigneeAgentId?: AgentId;
        dependencyTaskIds?: TaskId[];
      }>;
    }
  | { tool: "claim_group_task"; taskId: TaskId; coordinatorEpoch: number }
  | {
      tool: "request_group_integration";
      groupRunId: GroupRunId;
      coordinatorEpoch: number;
      integrationOwnerAgentId: AgentId;
    }
  | {
      tool: "complete_group";
      groupRunId: GroupRunId;
      coordinatorEpoch: number;
      output: string;
    }
  | { tool: "complete_project"; rationale: string };

export interface ControlActionEnvelope {
  projectId: string;
  agent: AgentName;
  invocationId: string;
  callId: string;
  stateVersion: number;
  /** SHA-256 digest of the invocation capability; never the raw secret. */
  capabilityHash?: string;
  /** Optional lease copied from the invocation context; commit checks the server receipt time. */
  expiresAt?: string;
  receivedAt: string;
  action: ControlAction;
}

export interface ControlMcpRequest {
  /** Built-in collaboration capability, independent of business tool selection. */
  projectState?: boolean;
  projectStateReconciliation?: boolean;
  /** Server-pinned physical proposal; apply_workflow still uses workflow.json. */
  workflowAuthoringPath?: string;
  /** Only the server's scoped worker front door may expose local Finish as a route. */
  scopedAgentRouting?: boolean;
  stagingPath: string;
  capability: string;
  /** Server-side digest used to reject envelopes from another invocation. */
  capabilityHash?: string;
  /** Optional file removed when the invocation leaves the commit boundary. */
  capabilityPath?: string;
  /** Optional lease for standalone callers; normal invocations are revoked with their lifecycle. */
  expiresAt?: string;
  stateVersion: number;
  candidates: Array<WorkflowNodeId | "finish">;
  /** Main may omit assignment only when routing to one of these group nodes. */
  tasklessRouteTargets?: WorkflowNodeId[];
  decisionBy: "main" | "agent";
  allowUserIntervention: boolean;
  /** Exposes apply_workflow only to Main when the user enabled the policy. */
  allowAgentOrchestrationReconfiguration?: boolean;
  /**
   * Compatibility authority for Git collaboration's topology-only workflow.json.
   * It is deliberately separate from editable Agent runtime configuration.
   */
  allowWorkflowReconfiguration?: boolean;
  canComplete: boolean;
  allowFinishRoute?: boolean;
  /** Exposes the invocation-bound Git/GitHub tools to a business Agent. */
  allowAgentGitActions?: boolean;
  terminalPushObservation?: TerminalPushObservationScope;
  terminalPushCoordination?: TerminalPushCoordinationScope;
  worktreeClosing?: WorktreeClosingScope;
  canonicalFinalIntegration?: boolean;
  collaboration?: CollaborationControlScope;
  /** The same immutable snapshot used by Main prompt and server validation. */
  mainCapabilities?: MainCapabilitySnapshot;
  /** Workspace root used by publish_artifact path validation. */
  workspacePath?: string;
  /** Invocation-local bridge used by the orchestration MCP subprocess. */
  bridgePath?: string;
  /** TCP fallback port when Unix domain sockets are unavailable. */
  bridgePort?: number;
  /** Host for the TCP fallback; always loopback when set by the server. */
  bridgeHost?: string;
  /** Production invocations must fail closed when no bridge is available. */
  requireBridge?: boolean;
}

export type TraceSink = (
  type: "status" | "message" | "tool" | "output" | "stderr",
  message: string,
  data?: Record<string, unknown>
) => Promise<void> | void;

export interface AgentRunner {
  run(request: AgentRunRequest, onTrace: TraceSink, signal: AbortSignal): Promise<AgentRunResult>;
  /** Registry-backed runtime metadata; production callers never rebuild it. */
  harnessCatalog?(): Promise<PublicHarnessDescriptor[]>;
  probe?(request: {
    model: string;
    gatewayReasoningOption?: string;
    reasoningFingerprint?: string;
  }, signal: AbortSignal): Promise<void>;
  cleanupInterrupted?(invocationId: string, runtimePath: string): Promise<void>;
}
