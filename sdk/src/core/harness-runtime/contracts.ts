import type { ChildProcessWithoutNullStreams } from "node:child_process";
import type {
  AgentPermission,
  AgentRunRequest,
  AgentRunResult,
  GatewayTokenUsage,
  GatewayModelStreamEvent,
  GatewayUsageReport,
  ProjectState,
  TraceSink
} from "../types.js";
import type { InvocationProcessHost } from "./process-host.js";
import type { OfficialEventMapper } from "./official-event-bridge.js";
import type { ResidentProtocol, ResidentRecoveryStrategy } from "./resident-native-driver.js";
import type { NativeInputHistoryEvidence, NativeInputHistoryRequest } from "./native-input-history.js";

/** Harness identifiers are catalog data, not a closed TypeScript union. */
export type HarnessId = string;
export type HarnessPurpose = "workflow" | "explainer" | "probe";
export type HarnessProtocol = "responses" | "chat-completions" | "anthropic-messages";

export interface HarnessCapabilities {
  structuredEvents: boolean;
  toolResults: boolean;
  durableSession: boolean;
  permissionPrompts: readonly AgentPermission[];
  workspaceInputs: boolean;
  autoSkills: boolean;
  officialEvents: boolean;
  toolEvents: boolean;
  usageEvents: boolean;
  readOnlyExplainer: boolean;
  /** Formats the Adapter actually transports to its read-only Explainer. */
  explainerInputFormats?: readonly ("text" | "image" | "pdf")[];
  webSearch: boolean;
  skills: boolean;
  mcp: boolean;
  /** Adapter-declared source of user-visible Assistant deltas. */
  assistantStreaming?: "native" | "proxy-visible-output" | "terminal";
}

export interface HarnessDescriptor {
  schemaVersion: 1;
  id: HarnessId;
  label: string;
  adapterVersion: string;
  nativeProtocol: HarnessProtocol;
  purposes: readonly HarnessPurpose[];
  /** False keeps a legacy Adapter runnable while excluding it from new selections. */
  selectable?: boolean;
  executableEnv: string;
  defaultCommand: string;
  default?: boolean;
  /** False for registered compatibility adapters that must not be user-selectable. */
  userSelectable?: boolean;
  notes: string;
  capabilities: HarnessCapabilities;
  /** How the Adapter makes the explainer purpose mechanically read-only. */
  explainerIsolation?: "adapter-read-only-tools" | "host-read-only-sandbox";
  route?: {
    /** Expose the invocation Gateway's authenticated Web MCP to this Adapter. */
    webSearchMcp?: boolean;
    requireMainControlTools?: boolean;
    /** Supports a trusted host profile instead of an invocation Gateway. */
    nativeProfileAuth?: boolean;
  };
}

/**
 * Browser-safe Catalog metadata. Process discovery and routing details stay on
 * the server even though they are part of the adapter-owned descriptor.
 */
export interface PublicHarnessDescriptor extends Omit<
  HarnessDescriptor,
  "executableEnv" | "defaultCommand" | "route" | "explainerIsolation"
> {
  available: boolean;
  availabilityReason?: string;
  executableFingerprint?: string;
}

/** Durable, adapter-owned native session identity persisted by OpenFARS. */
export interface SessionRef {
  schemaVersion: 1;
  harnessId: HarnessId;
  adapterVersion: string;
  generation: number;
  nativeId: string;
  durable: boolean;
  createdAt: string;
  resumedAt?: string;
}

/** Paths an adapter may see. The server-authority Inbox path is deliberately absent. */
export interface InvocationInputs {
  contextBackgrounds?: import("../context-injection-budget.js").ContextReplacement[];
  additionalContextIndexes?: import("../agent-context-index.js").AgentContextIndex[];
  contextIndex?: import("../agent-context-index.js").AgentContextIndex;
  /** Server-generated, scope-filtered read-only management context. */
  workflowContext?: import("../workflow-context.js").WorkflowContextSnapshot;
  /** Trusted logical-task proposal file, never the business checkout's workflow.json. */
  workflowAuthoringPath?: string;
  /** Current accepted reference lives beside trusted inputs, outside Git. */
  workflowCurrentPath?: string;
  /** Coordinator-bound snapshot identity retained across physical invocations. */
  workflowAuthoringInvocationId?: string;
  /** Canonical server publication; the workspace workflow symlink is not a broker root. */
  workflowReadDirectory?: string;
  /** Canonical shared inputs, readable even when cwd is a collaboration worktree. */
  userInputsPath?: string;
  projectPath: string;
  workspacePath: string;
  inboxPath: string;
  memoryPath: string;
  runtimePath: string;
  inboxSha256: string;
}

export interface InvocationPolicy {
  permission: AgentPermission;
  constraintPrompt: string;
  skillPaths: readonly string[];
  autoSkillPaths: readonly string[];
  mcpServers: ReadonlyArray<{ name: string; url: string }>;
  webSearch: boolean;
  reasoningEffort?: AgentRunRequest["project"]["agents"][string]["reasoningEffort"];
}

/**
 * The subset of an MCP tools/list entry that every native Harness must receive
 * without OpenFARS inventing aliases or replacing the server's JSON Schema.
 */
export interface RuntimeMcpToolDefinition {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  annotations?: Record<string, unknown>;
}

/** One exact MCP tools/list entry compiled for a native Harness invocation. */
export interface HarnessRegisteredTool {
  /** Exact tools/list wire name; namespace presentation remains Harness-native. */
  name: string;
  namespace: string;
  description?: string;
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  annotations?: Record<string, unknown>;
}

/**
 * Auditable snapshot compiled from an actual runtime tools/list result. It is
 * deliberately not a static list: permissions decide what the MCP server
 * lists, then this contract verifies the catalog delivered to the Harness.
 */
export interface HarnessRuntimeToolCatalog {
  schemaVersion: 1;
  harnessId: HarnessId;
  source: "runtime-tools-list";
  naming: "runtime-name-verbatim";
  errorDelivery: "same-native-turn-structured";
  tools: readonly HarnessRegisteredTool[];
}

export interface InvocationSpec {
  invocationId: string;
  harnessId: HarnessId;
  purpose: HarnessPurpose;
  model: string;
  prompt: string;
  inputs: InvocationInputs;
  policy: InvocationPolicy;
  session?: SessionRef;
  durableSession: boolean;
}

/**
 * Deliberately narrow project snapshot exposed to an Adapter. It contains the
 * selected Agent only; orchestration state and other Agents' credentials are
 * neither promised by the type nor present at runtime.
 */
export interface HarnessAdapterProject {
  id: string;
  agents: Partial<ProjectState["agents"]>;
  agentSessionIds?: Partial<NonNullable<ProjectState["agentSessionIds"]>>;
  agentSessions?: Partial<NonNullable<ProjectState["agentSessions"]>>;
  agentSessionMeta?: Partial<NonNullable<ProjectState["agentSessionMeta"]>>;
  taskSessionRefs?: Partial<NonNullable<ProjectState["taskSessionRefs"]>>;
  taskSessionIds?: Partial<NonNullable<ProjectState["taskSessionIds"]>>;
}

export type HarnessAdapterRequest = Omit<
  AgentRunRequest,
  | "project"
  | "contextBackgrounds"
  | "additionalContextIndexes"
  | "gatewayModelFetch"
  | "onDurableSessionStarted"
  | "onControlResult"
  | "onProjectStateRequest"
  | "onPendingControlResults"
  | "onPendingWorkflowAdjustments"
  | "onPrepareWorkflowAdjustmentInput"
  | "onWorkflowAdjustmentInputReceived"
  | "onExperimentWait"
  | "onSessionStarted"
  | "onThreadStarted"
  | "onOfficialHarnessEvent"
  | "onNativeUserInput"
  | "onTokenUsage"
  | "onTokenUsagePersistenceFailure"
  | "onModelStreamEvent"
  | "onLiveHarnessEvent"
  | "onHarnessAttemptReset"
> & {
  project: HarnessAdapterProject;
};

export type HarnessEventKind =
  | "lifecycle"
  | "assistant.delta"
  | "assistant.message"
  | "reasoning.summary"
  | "user.message"
  | "tool.started"
  | "tool.updated"
  | "tool.completed"
  | "tool.failed"
  | "usage"
  | "activity"
  | "diagnostic";

export interface HarnessToolEventData {
  callId: string;
  name: string;
  /** Native MCP server identity, when supplied by the official protocol. */
  server?: string;
  toolType?: "shell" | "mcp" | "file" | "web" | "collaboration" | "other";
  status: "started" | "updated" | "completed" | "failed";
  input?: unknown;
  outputPreview?: string;
  truncated?: boolean;
  isError?: boolean;
  durationMs?: number;
}

/**
 * Canonical display envelope. Only explicitly published reasoning summaries
 * have a display body; hidden chain-of-thought remains body-free activity.
 */
export interface HarnessEvent {
  schemaVersion: 1;
  eventId: string;
  seq: number;
  timestamp: string;
  invocationId: string;
  harnessId: HarnessId;
  kind: HarnessEventKind;
  phase: "started" | "delta" | "completed" | "failed";
  attempt?: number;
  itemId?: string;
  parentItemId?: string;
  sourceType?: string;
  message?: string;
  /** Display body exceeded the canonical Assistant limit; full handoff remains durable. */
  messageTruncated?: boolean;
  tool?: HarnessToolEventData;
  usage?: Omit<GatewayTokenUsage, "usageId">;
  diagnostic?: {
    source: "proxy" | "cli" | "adapter";
    level: "info" | "warning" | "error";
    message: string;
  };
}

export interface LaunchPlan {
  command: string;
  args: string[];
  cwd: string;
  env: NodeJS.ProcessEnv;
  stdin?: string;
  eventFormat: "jsonl" | "stream-json" | "json-rpc";
  session: SessionRef;
  rawLogLimitBytes: number;
  /** Harness-neutral reason consumed by the invocation-scoped process budget. */
  recoveryEvidence?: InvocationRecoveryEvidence;
  /** Non-secret, Adapter-specific environment keys present in `env`. */
  adapterEnvironmentKeys?: readonly string[];
}

export interface ProcessExit {
  code: number | null;
  signal: NodeJS.Signals | null;
  stderr: string;
  stdout: string;
  child?: ChildProcessWithoutNullStreams;
}

export const DEFAULT_RESIDENT_MODEL_INACTIVITY_TIMEOUT_MS = 20 * 60_000;
export const DEFAULT_RESIDENT_TOOL_INACTIVITY_TIMEOUT_MS = 120 * 60_000;

export interface ResidentInactivityPolicy {
  modelTimeoutMs: number;
  toolTimeoutMs: number;
}

export interface ResidentKnownUsage {
  inputTokens?: number;
  cachedInputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

export type ResidentActivitySignal =
  | {
      kind: "model";
      phase: "delta" | "completed";
    }
  | {
      kind: "tool";
      phase: "started" | "updated" | "completed" | "failed";
      callId: string;
      name?: string;
    }
  | {
      kind: "heartbeat";
    };

/** Harness-specific codecs map native frames into this common liveness vocabulary. */
export interface ResidentProtocolObservation {
  activities?: readonly ResidentActivitySignal[];
  usage?: ResidentKnownUsage;
}

/** Harness-neutral reason attached to a native process launch. */
export interface InvocationRecoveryEvidence {
  /** Adapter-owned stable category; the common controller never branches on Harness IDs. */
  kind: string;
}

export interface InvocationProcessAttempt {
  attempt: number;
  maxAttempts: number;
  evidence: InvocationRecoveryEvidence;
}

/**
 * A single native-process budget owned by the Facade and shared across Adapter
 * execution for one invocation (including a same-Harness replacement Session).
 */
export interface InvocationRecoveryBudget {
  readonly maxAttempts: number;
  readonly attemptsStarted: number;
  /**
   * Account for one native Harness process launch. The invocation-scoped
   * ProcessHost calls this at every launch boundary, including Adapter-native
   * recovery and same-Harness replacement. The call fails closed when the
   * invocation-wide limit is exhausted.
   */
  startAttempt(evidence: InvocationRecoveryEvidence): InvocationProcessAttempt;
}

export interface HarnessAdapterContext {
  request: HarnessAdapterRequest;
  spec: InvocationSpec;
  /** Report an official native identity; the Facade validates and persists it. */
  onSessionStarted?: (session: SessionRef) => Promise<void>;
  onEvent: (event: HarnessEvent) => Promise<void> | void;
  /** Private observation of a complete native user input before display bounds. */
  onNativeUserInput?: (event: HarnessEvent) => Promise<void> | void;
  /** Trusted input-boundary callback owned by the Facade, never serialized
   * into an Adapter request or exposed as a model tool. */
  prepareNativeInput?: (prompt: string) => Promise<string>;
  onTrace: TraceSink;
  signal: AbortSignal;
  /**
   * The only native-process launcher exposed to an Adapter. It is bound by
   * the Facade to this invocation's AbortSignal, marker lifecycle and shared
   * recovery budget, so a fifth Adapter cannot bypass those common rules.
   */
  processHost: InvocationProcessHost;
  /** Read-only progress for diagnostics; only ProcessHost can consume it. */
  recoveryBudget: Pick<InvocationRecoveryBudget, "maxAttempts" | "attemptsStarted">;
  route: import("./gateway-route.js").AdapterModelRoute;
}

export interface ExplainerInvocationRequest {
  contextIndex?: import("../agent-context-index.js").AgentContextIndex;
  contextBackgrounds?: import("../context-injection-budget.js").ContextReplacement[];
  /** Shared Explainer core has already included current input and index. */
  evidenceInPrompt?: boolean;
  invocationId: string;
  projectId: string;
  projectPath: string;
  workspacePath: string;
  runtimePath: string;
  inboxPath: string;
  memoryPath: string;
  harnessId: HarnessId;
  gateway: {
    modelContextWindows?: Record<string, number>;
    id: string;
    name: string;
    url: string;
    apiKey: string;
    models: string[];
    defaultModel: string;
    protocol: HarnessProtocol;
  };
  model: string;
  reasoningEffort: "low" | "medium" | "high" | "xhigh";
  prompt: string;
  assistantMcp?: { url: string };
  session?: SessionRef;
  onTrace: TraceSink;
  onEvent: (event: HarnessEvent) => Promise<void> | void;
  onTokenUsage?: (usage: GatewayUsageReport) => Promise<void> | void;
  onModelStreamEvent?: (event: GatewayModelStreamEvent) => Promise<void> | void;
}

export interface ExplainerInvocationResult {
  answer: string;
  session: SessionRef;
}

export interface HarnessAdapter {
  readonly descriptor: HarnessDescriptor;
  /** Native execution-scoped protocol; launch remains owned by the trusted resident host. */
  readonly resident?: {
    protocol: ResidentProtocol;
    recoveryStrategy: ResidentRecoveryStrategy;
    /** Adapter-owned translation for raw frames emitted by the resident protocol. */
    createOfficialEventMapper(): OfficialEventMapper;
    /** Code-level extension; the common host still validates authority and the resulting launch plan. */
    buildLaunch?(input: import("./resident-lease.js").ResidentAdapterLaunchRequest):
      Promise<import("./resident-lease.js").ResidentAdapterLaunchDefinition>;
  };
  /** CLI compatibility only; the workspace mirror remains the canonical input. */
  readonly requiresInlineInbox?: boolean;
  resolveExecutable(): Promise<string | undefined>;
  fingerprint(executable: string): Promise<string>;
  run(context: HarnessAdapterContext): Promise<AgentRunResult>;
  cleanupInterrupted?(invocationId: string, runtimePath: string): Promise<void>;
  /** Optional exact visible-input proof; private native formats stay Adapter-owned. */
  readNativeNotification?(input: NativeInputHistoryRequest): Promise<NativeInputHistoryEvidence | undefined>;
  validateNativeSession?(nativeId: string): boolean;
  createSession(
    request: HarnessAdapterRequest,
    inputs: InvocationInputs,
    generation: number,
    durable: boolean
  ): Promise<SessionRef> | SessionRef;
  sessionFromLegacyId?(legacyId: string, generation: number, durable: boolean): SessionRef | undefined;
  sessionToLegacyId?(session: SessionRef): string;
}
