import { proxyFailureError } from "./errors.js";
import { resolveGatewayReasoning } from "../gateway-reasoning.js";
import { redactTrace } from "../utils.js";
import { createHash, randomUUID } from "node:crypto";
import { EXPLAINER_MCP_NAME, isExplainerMcp } from "../internal/shared/explainer-tools.js";
import { SiiExperimentService, canUseSiiExperiments, type SiiMcpBinding, type SiiFilesystemInput } from "../sii-experiments.js";
import type { InvocationInputs } from "./contracts.js";
import { isDeepStrictEqual } from "node:util";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { prepareWorkflowContext } from "../workflow-context.js";
import { publishAgentContextIndex } from "../agent-context-index.js";
import type { AgentContextSource, AgentContextIndex } from "../agent-context-index.js";
import { ContextIndexOrganizer, type ContextOrganizer } from "../context-index-organizer.js";
import { agentContextWindow, fitContextInjection, contextReplacements } from "../context-injection-budget.js";
import { collaborationSessionKey } from "../internal/shared/collaboration-session-key.js";
import type {
  AgentActivitySignal,
  AgentConfig,
  AgentRunRequest,
  AgentRunResult,
  AgentRunner,
  ControlActionEnvelope,
  ControlMcpRequest,
  ProjectState,
  TraceSink
} from "../types.js";
import { isTerminalPushObservationScope, terminalPushObservationActionAllowed } from "../internal/terminal-push-observation.js";
import { isTerminalPushCoordinationScope, terminalPushCoordinationActionAllowed } from "../internal/terminal-push-coordination.js";
import { assertWorktreeClosingControl, assertWorktreeClosingRequest, isWorktreeClosingScope, worktreeClosingActionAllowed } from "../internal/worktree-closing.js";
import { HANDOFF_CHARACTER_LIMIT } from "../content-limits.js";
import { MAIN_AGENT_ORCHESTRATION_FILE } from "../main-workflow-files.js";
import { controlDecisionsConflict, isControlDecision } from "../orchestration-control-decisions.js";
import type {
  AdapterSmokeProbeInput,
  AdapterSmokeProbeResult,
  AdapterSmokeProbeRunner,
  AgentHarness,
  CollaborationHarnessRunner,
  ResidentScopeOpenResult
} from "../agent-runtime.js";
import type {
  BufferedProtocolResponse,
  ProtocolProxyFailure
} from "../protocol-router.js";
import { parseGitInspectionRequest } from "../collaboration-git/inspection.js";
import { parseGitRevertRequest } from "../collaboration-git/revert.js";
import {
  fixedMcpToken,
  isFixedMcpServer
} from "../mcp-directory.js";
import {
  PROTOCOL_ROUTER_COMPATIBILITY_VERSION,
  startProtocolProxy
} from "../protocol-router.js";
import type {
  HarnessAdapter,
  HarnessAdapterProject,
  HarnessAdapterRequest,
  HarnessDescriptor,
  HarnessEvent,
  ExplainerInvocationRequest,
  ExplainerInvocationResult,
  InvocationPolicy,
  InvocationSpec,
  SessionRef
} from "./contracts.js";
import {
  DEFAULT_RESIDENT_MODEL_INACTIVITY_TIMEOUT_MS,
  DEFAULT_RESIDENT_TOOL_INACTIVITY_TIMEOUT_MS
} from "./contracts.js";
import {
  HarnessRuntimeError,
  HarnessEventStreamError,
  ProtocolRecoveryExhaustedError,
  ProtocolToolArgumentsError,
  SessionResumeError,
  isProtocolToolArgumentsFailure,
  isSessionResumeFailure,
  normalizeHarnessRuntimeError
} from "./errors.js";
import {
  openInvocationGatewayRoute,
  openInvocationModelRoute,
  modelRouteBinding,
  type InvocationModelRoute,
  type AdapterModelRoute,
  type ModelRouteBinding,
  type NativeCodexProfileResolver
} from "./gateway-route.js";
import {
  prepareInvocationInputs,
  prepareProjectUserInputsPath,
  validateStagedInvocationInputs
} from "./invocation-inputs.js";
import { InvocationRecoveryController } from "./invocation-recovery.js";
import {
  assertInvocationPolicySupported,
  compileInvocationPolicy,
  compileWorkflowPrompt,
  sessionRecoveryNote
} from "./invocation-policy.js";
import {
  OfficialEventBridge,
  emitCanonicalTrace,
  validateCanonicalHarnessEvent
} from "./official-event-bridge.js";
import {
  buildInvocationEnvironment,
  CommonProcessHost,
  type InvocationProcessHost,
  type ResidentProcessCleanupIdentity,
  type ResidentProcessCleanupOptions
} from "./process-host.js";
import { HarnessRegistry } from "./registry.js";
import { SessionCoordinator } from "./session-coordinator.js";
import { validateSessionRef } from "./session-ref.js";
import { stageInvocationSkills } from "./skill-staging.js";
import { CodexAdapter } from "./adapters/codex-adapter.js";
import { PiAdapter } from "./adapters/pi-adapter.js";
import { ClaudeCodeAdapter } from "./adapters/claude-code-adapter.js";
import { DshAdapter } from "./adapters/dsh-adapter.js";
import {
  agentEnvironment,
  natureFigureWorkspaceConfigPath,
  prepareComputeRuntime,
  type HarnessHostOptions
} from "./runtime-support.js";
import { type AdapterRuntimeOptions } from "./adapters/adapter-utils.js";
import { openBuiltinResidentAdapter } from "./adapters/resident-adapter-factory.js";
import {
  compileFilesystemAuthority,
  prepareGitWorktreeMcp
} from "./filesystem-authority.js";
import {
  ResidentLeaseManager,
  residentScopeId,
  type PrepareResidentScopeRequest,
  type ResidentMcpRow,
  type ResidentLeaseAuthority,
  type ResidentProcessLease,
  type ResidentScopeOpenRequest,
  type ResidentStartupReconcileRequest,
  type ResidentStartupReconcileResult,
  type ResidentTurn
} from "./resident-lease.js";

export interface HarnessRuntimeOptions extends HarnessHostOptions {
  siiExperiments?: SiiExperimentService;
  explainerSandboxMode?: "read-only" | "danger-full-access";
  explainerSandboxVerified?: boolean;
  explainerSandboxUnavailableReason?: string;
  harnessExecutables?: Partial<Record<AgentHarness, string>>;
  dshHandshakeTimeoutMs?: number;
  dshTurnIdleTimeoutMs?: number;
  residentModelInactivityTimeoutMs?: number;
  residentToolInactivityTimeoutMs?: number;
  protocolProxyTimeoutMs?: number;
  protocolProxyFactory?: typeof startProtocolProxy;
  validateGatewayTarget?: (url: string) => Promise<unknown>;
  invocationRecoveryMaxAttempts?: number;
  /** Replace the built-ins for isolated contract tests. */
  adapters?: HarnessAdapter[];
  /** Code-level extension point: one Adapter object carries its own descriptor. */
  additionalAdapters?: HarnessAdapter[];
  processHost?: CommonProcessHost;
  /** Standalone host-owned route resolver; omitted by the Web host. */
  resolveNativeCodexProfile?: NativeCodexProfileResolver;
  /** Trusted SDK host workspace binding; omitted by the Web host. */
  resolveProjectWorkspace?: (projectId: string) => Promise<string | undefined>;
}

function freezeRuntimeValue<T>(value: T, seen = new WeakSet<object>()): T {
  if (typeof value !== "object" || value === null) return value;
  const object = value as object;
  if (seen.has(object)) return value;
  seen.add(object);
  for (const key of Reflect.ownKeys(object)) {
    freezeRuntimeValue((object as unknown as Record<PropertyKey, unknown>)[key], seen);
  }
  return Object.freeze(value);
}

async function resolveAdapterExecutable(adapter: HarnessAdapter): Promise<string | undefined> {
  try {
    const executable = await adapter.resolveExecutable();
    if (executable !== undefined &&
      (typeof executable !== "string" || !executable.trim() || executable.length > 8_192)) {
      throw new Error("invalid executable result");
    }
    return executable;
  } catch (error) {
    throw normalizeHarnessRuntimeError(error, adapter.descriptor.id);
  }
}

async function fingerprintAdapterExecutable(
  adapter: HarnessAdapter,
  executable: string
): Promise<string> {
  try {
    const fingerprint = await adapter.fingerprint(executable);
    if (typeof fingerprint !== "string" || !fingerprint.trim() ||
      fingerprint.length > 8_192 || /[\u0000-\u001f\u007f]/u.test(fingerprint)) {
      throw new Error("invalid executable fingerprint");
    }
    return fingerprint;
  } catch (error) {
    throw normalizeHarnessRuntimeError(error, adapter.descriptor.id);
  }
}

function adapterAcceptsNativeSession(
  adapter: HarnessAdapter,
  nativeId: string
): boolean {
  if (!adapter.validateNativeSession) return Boolean(nativeId.trim());
  try {
    const accepted = adapter.validateNativeSession(nativeId);
    if (typeof accepted !== "boolean") throw new Error("invalid validator result");
    return accepted;
  } catch {
    throw new HarnessRuntimeError(
      "HARNESS_CONTRACT_VIOLATION",
      `${adapter.descriptor.label} native Session validator failed`,
      { harnessId: adapter.descriptor.id },
      { source: "adapter" }
    );
  }
}

function adapterLegacySessionId(adapter: HarnessAdapter, session: SessionRef): string {
  let legacyId: string;
  try {
    legacyId = adapter.sessionToLegacyId?.(session) ?? session.nativeId;
  } catch (error) {
    throw normalizeHarnessRuntimeError(error, adapter.descriptor.id);
  }
  if (!legacyId || legacyId !== legacyId.trim() || legacyId.length > 8_192 ||
    /[\u0000-\u001f\u007f-\u009f]/u.test(legacyId)) {
    throw new HarnessRuntimeError(
      "HARNESS_CONTRACT_VIOLATION",
      `${adapter.descriptor.label} returned an invalid compatibility Session identity`,
      { harnessId: adapter.descriptor.id, sessionGeneration: session.generation },
      { source: "adapter" }
    );
  }
  return legacyId;
}

function protocolRecoveryExhaustedError(
  failure: ProtocolProxyFailure | undefined,
  harnessId: string,
  cause?: unknown
): ProtocolRecoveryExhaustedError {
  return new ProtocolRecoveryExhaustedError(
    harnessId,
    {
      ...(failure
        ? {
            toolName: failure.toolName,
            toolIndex: failure.toolIndex,
            sourceProtocol: failure.sourceProtocol,
            targetProtocol: failure.targetProtocol,
            model: failure.model,
            protocolMessage: failure.message
          }
        : {}),
      recoveryLimit: 1
    },
    { cause: cause instanceof Error ? cause : undefined }
  );
}

function sessionRecoveryExhaustedError(error: unknown, harnessId: string): HarnessRuntimeError {
  return new HarnessRuntimeError(
    "SESSION_RESUME_FAILED",
    "Unable to continue the original native Session after one recovery attempt; the task and Session were preserved",
    { harnessId, recoveryAttempted: true, recoveryLimit: 1 },
    { source: "adapter", retryable: false, cause: error }
  );
}

function protocolCorrectionFeedback(error: unknown, secrets: Array<string | undefined>): string {
  let feedback = error instanceof HarnessRuntimeError
    ? String(error.details.protocolMessage ?? error.safeMessage)
    : "Invalid JSON tool arguments";
  for (const secret of secrets) {
    if (secret) feedback = feedback.split(secret).join("[REDACTED]");
  }
  return redactTrace(feedback).slice(0, 1000);
}

function adapterVisibleRequest(
  request: AgentRunRequest,
  inputs: InvocationSpec["inputs"],
  descriptor: HarnessDescriptor,
  route?: AdapterModelRoute
): HarnessAdapterRequest {
  const adapterSafeRequest = { ...request };
  delete adapterSafeRequest.gatewayModelFetch;
  // Management source catalogs/configuration are consumed by the server's
  // context compiler. Native adapters receive only their Agent and staged views.
  delete adapterSafeRequest.availableSkills;
  delete adapterSafeRequest.workflowContext;
  delete adapterSafeRequest.contextSources;
  delete adapterSafeRequest.contextBackgrounds;
  delete adapterSafeRequest.additionalContextIndexes;
  delete adapterSafeRequest.nativeInputNotices;
  delete adapterSafeRequest.onDurableSessionStarted;
  delete adapterSafeRequest.onControlResult;
  delete adapterSafeRequest.onProjectStateRequest;
  delete adapterSafeRequest.onPendingControlResults;
  delete adapterSafeRequest.onPendingWorkflowAdjustments;
  delete adapterSafeRequest.onPrepareWorkflowAdjustmentInput;
  delete adapterSafeRequest.onWorkflowAdjustmentInputReceived;
  delete adapterSafeRequest.onExperimentWait;
  delete adapterSafeRequest.onSessionStarted;
  delete adapterSafeRequest.onThreadStarted;
  delete adapterSafeRequest.onOfficialHarnessEvent;
  delete adapterSafeRequest.onNativeUserInput;
  delete adapterSafeRequest.onTokenUsage;
  delete adapterSafeRequest.onTokenUsagePersistenceFailure;
  delete adapterSafeRequest.onModelStreamEvent;
  delete adapterSafeRequest.onLiveHarnessEvent;
  delete adapterSafeRequest.onHarnessAttemptReset;
  const sourceConfig = request.project.agents[request.agent];
  const sourceGateway = sourceConfig.gatewaySnapshot;
  const gatewaySnapshot = sourceGateway
    ? {
        ...sourceGateway,
        // Before the invocation route exists, Session allocation receives no
        // provider endpoint or credential. During Adapter execution it sees
        // only the loopback endpoint and invocation-scoped token.
        url: route && "baseUrl" in route ? route.baseUrl : "about:blank",
        apiKey: route && "token" in route ? route.token : "",
        protocol: descriptor.nativeProtocol,
        nativeProtocol: descriptor.nativeProtocol,
        routeMode: "direct" as const,
        routeDirection: undefined
      }
    : undefined;
  const safeConfig = {
    ...sourceConfig,
    mcpServers: [...sourceConfig.mcpServers.filter(server => !request.siiMcp || server.name !== "scienceevolve-sii"), ...(request.siiMcp ? [{ name: "scienceevolve-sii", url: request.siiMcp.url }] : [])],
    // A scoped Agent's native session must remain durable even when this
    // project originated with the legacy ephemeral Worker setting.
    ...(request.sessionContinuity === "strict" ? { sessionPersistence: true } : {}),
    ...(gatewaySnapshot ? { gatewaySnapshot } : { gatewaySnapshot: undefined })
  };
  // Select the same binding as the collaboration builder and publication
  // callbacks before projecting it into the Adapter's single-Agent view.
  // A role's legacy ID alone cannot reconstruct its generation/createdAt.
  const version = request.project.orchestration?.schemaVersion;
  const sessionKey = request.executionContext && version === 2
    ? collaborationSessionKey(request.agent, request.executionContext)
    : request.agent;
  const currentSessionId = request.project.agentSessionIds?.[sessionKey];
  const currentSession = request.project.agentSessions?.[sessionKey];
  const currentSessionMeta = request.project.agentSessionMeta?.[sessionKey];
  const taskSessionRef = request.taskSessionId
    ? request.project.taskSessionRefs?.[request.taskSessionId]
    : undefined;
  const taskSessionId = request.taskSessionId;
  const project: HarnessAdapterProject = {
    id: request.project.id,
    agents: { [request.agent]: safeConfig },
    ...(currentSessionId
      ? { agentSessionIds: { [request.agent]: currentSessionId } }
      : {}),
    ...(currentSession
      ? { agentSessions: { [request.agent]: currentSession } }
      : {}),
    ...(currentSessionMeta
      ? { agentSessionMeta: { [request.agent]: currentSessionMeta } }
      : {}),
    ...(taskSessionId && taskSessionRef
      ? { taskSessionRefs: { [taskSessionId]: taskSessionRef } }
      : {}),
    ...(taskSessionId && request.project.taskSessionIds?.[taskSessionId]
      ? { taskSessionIds: { [taskSessionId]: request.project.taskSessionIds[taskSessionId] } }
      : {})
  };
  return freezeRuntimeValue({
    ...adapterSafeRequest,
    project: structuredClone(project),
    ...(request.control ? { control: structuredClone(request.control) } : {}),
    inboxPath: inputs.inboxPath,
    projectPath: inputs.projectPath,
    workspacePath: inputs.workspacePath,
    runtimePath: inputs.runtimePath,
    schemaPath: "",
    skillPaths: [],
    autoSkillPaths: [],
    availableSkillPaths: []
  });
}

function invocationAuthorityEnvironment(
  request: AgentRunRequest,
  inputs: InvocationSpec["inputs"],
  descriptor: HarnessDescriptor,
  route: ModelRouteBinding,
  options: HarnessHostOptions,
  hostEnvironment: Readonly<NodeJS.ProcessEnv>,
  fixedToken: string | undefined
): Record<string, string> {
  const config = request.project.agents[request.agent];
  const sourceGateway = config.gatewaySnapshot;
  const routedGateway = sourceGateway && "baseUrl" in route ? {
    ...sourceGateway,
    url: descriptor.nativeProtocol === "anthropic-messages"
      ? route.baseUrl.replace(/\/v1\/?$/, "")
      : route.baseUrl,
    apiKey: route.token,
    protocol: descriptor.nativeProtocol,
    nativeProtocol: descriptor.nativeProtocol,
    routeMode: "direct" as const,
    routeDirection: undefined
  } : undefined;
  const common = agentEnvironment(
    // HOME and CODEX_HOME have separate boundary rules because their exact
    // locations are Adapter-specific. Every other common value is generated
    // here once from Facade authority and must match at process launch.
    inputs.workspacePath,
    inputs.runtimePath,
    request.project.id,
    request.invocationId,
    request.agent,
    request.kind,
    request.permission,
    inputs.projectPath,
    inputs.workspacePath,
    options,
    [],
    undefined,
    fixedToken,
    request.control,
    routedGateway,
    descriptor.id,
    descriptor.nativeProtocol,
    hostEnvironment
  );
  const environment = buildInvocationEnvironment({ common, hostEnvironment });
  delete environment.HOME;
  delete environment.CODEX_HOME;
  delete environment.NATURE_FIGURE_CONFIG;
  delete environment.MPLBACKEND;
  const expected: Record<string, string> = {};
  for (const [key, value] of Object.entries(environment)) {
    if (value !== undefined) expected[key] = value;
  }
  return expected;
}

function residentAuthorityEnvironment(
  request: AgentRunRequest,
  inputs: InvocationSpec["inputs"],
  descriptor: HarnessDescriptor,
  route: ModelRouteBinding,
  options: HarnessHostOptions,
  hostEnvironment: Readonly<NodeJS.ProcessEnv>,
  fixedToken: string | undefined
): Record<string, string> {
  const context = request.executionContext;
  if (!context) {
    throw new HarnessRuntimeError(
      "HARNESS_CONTRACT_VIOLATION",
      "Resident authority requires a collaboration execution context",
      { invocationId: request.invocationId },
      { source: "runtime" }
    );
  }
  const authority = invocationAuthorityEnvironment(
    request,
    inputs,
    descriptor,
    route,
    options,
    hostEnvironment,
    fixedToken
  );
  // A resident process is stable across many business turns. Per-turn
  // identity and control capabilities belong only to turnAuthority/controlMcp.
  delete authority.SCIENCEEVOLVE_INVOCATION_ID;
  delete authority.SCIENCEEVOLVE_CONTROL_CONTEXT;
  delete authority.SCIENCEEVOLVE_CONTROL_CAPABILITY;
  delete authority.SCIENCEEVOLVE_APPEND_ROOT;
  authority.SCIENCEEVOLVE_RESIDENT_SCOPE_ID = residentScopeId(context);
  authority.SCIENCEEVOLVE_RESIDENT_ROLE = context.role;
  if (context.role === "leader") {
    authority.SCIENCEEVOLVE_COORDINATOR_EPOCH = String(context.coordinatorEpoch);
    delete authority.SCIENCEEVOLVE_EXECUTION_ID;
    delete authority.SCIENCEEVOLVE_OWNERSHIP_EPOCH;
  } else {
    authority.SCIENCEEVOLVE_EXECUTION_ID = context.executionId;
    authority.SCIENCEEVOLVE_OWNERSHIP_EPOCH = String(context.ownershipEpoch);
    delete authority.SCIENCEEVOLVE_COORDINATOR_EPOCH;
  }
  return authority;
}

function selectedNatureFigureConfig(
  request: AgentRunRequest,
  spec: InvocationSpec
): string | undefined {
  if (request.permission !== "compute") return undefined;
  const selected = [...spec.policy.skillPaths, ...spec.policy.autoSkillPaths];
  return selected.some((skillPath) => path.basename(path.dirname(skillPath)) === "nature-figure")
    ? natureFigureWorkspaceConfigPath(spec.inputs.workspacePath)
    : undefined;
}

async function validateLeaderResidentInputs(
  request: AgentRunRequest,
  staged: InvocationSpec["inputs"] | undefined
): Promise<InvocationSpec["inputs"]> {
  if (!staged) {
    throw new HarnessRuntimeError(
      "INVOCATION_INPUT_STAGING_FAILED",
      "Leader resident preparation requires a management-only staged input snapshot",
      { invocationId: request.invocationId },
      { source: "inputs" }
    );
  }
  for (const [label, supplied, expected] of [
    ["project", staged.projectPath, request.projectPath],
    ["workspace", staged.workspacePath, request.workspacePath],
    ["Inbox", staged.inboxPath, request.inboxPath],
    ["runtime", staged.runtimePath, request.runtimePath]
  ] as const) {
    if (path.resolve(supplied) !== path.resolve(expected)) {
      throw new HarnessRuntimeError(
        "INVOCATION_INPUT_STAGING_FAILED",
        `Leader resident ${label} input does not match the AgentRunRequest`,
        { invocationId: request.invocationId },
        { source: "inputs" }
      );
    }
  }
  const inputs = await validateStagedInvocationInputs({
    projectId: request.project.id,
    invocationId: request.invocationId,
    projectPath: request.projectPath,
    workspacePath: request.workspacePath,
    inboxPath: request.inboxPath,
    memoryPath: staged.memoryPath,
    runtimePath: request.runtimePath,
    ...(request.project.orchestration?.schemaVersion === 3 ? { fixedAgentId: request.agent } : {}),
    ...(staged.workflowAuthoringPath ? { workflowAuthoringPath: staged.workflowAuthoringPath,
      ...(staged.workflowCurrentPath ? { workflowCurrentPath: staged.workflowCurrentPath } : {}),
      workflowAuthoringInvocationId: staged.workflowAuthoringInvocationId } : {})
  });
  return { ...inputs, userInputsPath: await prepareProjectUserInputsPath(inputs.projectPath) };
}

function mergeResidentMcpRows(
  configured: readonly ResidentMcpRow[],
  additional: readonly ResidentMcpRow[]
): ResidentMcpRow[] {
  const rows = [...configured, ...additional];
  const names = new Set<string>();
  const namespaces = new Set<string>();
  for (const row of rows) {
    if (!row.name.trim() || !row.namespace.trim() || names.has(row.name) ||
      namespaces.has(row.namespace)) {
      throw new HarnessRuntimeError(
        "HARNESS_CONFIGURATION_INVALID",
        "Resident MCP rows must have unique non-empty names and namespaces",
        { mcpName: row.name, mcpNamespace: row.namespace },
        { source: "runtime" }
      );
    }
    names.add(row.name);
    namespaces.add(row.namespace);
  }
  return rows;
}

async function traceInvocationCapabilities(
  onTrace: TraceSink,
  descriptor: HarnessDescriptor,
  config: AgentConfig,
  request: AgentRunRequest,
  policy: InvocationPolicy
): Promise<void> {
  const deniedCapabilities: Array<{ capability: string; reason: string }> = [];
  if (policy.skillPaths.length > 0 && !descriptor.capabilities.skills) {
    deniedCapabilities.push({ capability: "skills", reason: "harness-not-supported" });
  }
  if (policy.autoSkillPaths.length > 0 && !descriptor.capabilities.autoSkills) {
    deniedCapabilities.push({ capability: "auto-skills", reason: "harness-not-supported" });
  }
  if (policy.mcpServers.length > 0 && !descriptor.capabilities.mcp) {
    deniedCapabilities.push({ capability: "mcp", reason: "harness-not-supported" });
  }
  if (policy.webSearch && !descriptor.capabilities.webSearch) {
    deniedCapabilities.push({ capability: "web-search", reason: "harness-not-supported" });
  }
  if (!descriptor.capabilities.permissionPrompts.includes(policy.permission)) {
    deniedCapabilities.push({
      capability: `permission:${policy.permission}`,
      reason: "harness-not-supported"
    });
  }
  if (request.executionContext?.role === "leader") {
    deniedCapabilities.push(
      { capability: "git-mutation", reason: "management-role" },
      { capability: "delivery-session", reason: "management-role-serialized" }
    );
  }
  await onTrace("status", "Compiled invocation capability policy", {
    eventType: "invocation.capabilities",
    diagnostic: true,
    diagnosticSource: "adapter",
    harness: descriptor.id,
    role: request.executionContext?.role ?? "standard",
    effectiveCapabilities: {
      skills: descriptor.capabilities.skills ? [...(config.skills ?? [])] : [],
      autoSkills: descriptor.capabilities.autoSkills ? [...(config.autoSkills ?? [])] : [],
      mcpServers: descriptor.capabilities.mcp
        ? policy.mcpServers.map((server) => server.name)
        : [],
      webSearch: descriptor.capabilities.webSearch && policy.webSearch,
      filesystem: "native",
      gitMutation: request.executionContext?.role !== "leader" &&
        request.project.git?.enabled === true
    },
    deniedCapabilities
  });
}

async function closeGatewayRoute(
  close: () => Promise<void>,
  harnessId: string,
  onTrace: TraceSink,
  primaryFailed: boolean
): Promise<void> {
  try {
    await close();
  } catch (error) {
    if (primaryFailed) {
      await Promise.resolve(onTrace(
        "stderr",
        "Invocation Gateway route cleanup failed after the invocation had already failed",
        {
          diagnostic: true,
          diagnosticSource: "proxy",
          harness: harnessId,
          errorCode: "PROTOCOL_ROUTE_FAILED"
        }
      )).catch(() => undefined);
      return;
    }
    throw new HarnessRuntimeError(
      "PROTOCOL_ROUTE_FAILED",
      "Unable to close the invocation Gateway route",
      { harnessId },
      { source: "gateway", cause: error instanceof Error ? error : undefined }
    );
  }
}

interface CanonicalEventIngress {
  accept(event: HarnessEvent, nativeUserMessage?: string): Promise<void>;
  acceptProxyDelta(message: string): Promise<void>;
  drain(requireClosedTools: boolean): Promise<void>;
  resetAttempt(): Promise<void>;
}

export interface ResidentTurnFrameSink {
  accept(frame: Readonly<Record<string, unknown>>): Promise<void>;
  drain(): Promise<void>;
}

/**
 * The Adapter callback is an untrusted asynchronous ingress. Queue every call
 * in call order and retain the first failure even when an Adapter neglects to
 * await the returned Promise.
 */
function createCanonicalEventIngress(options: {
  descriptor: HarnessDescriptor;
  invocationId: string;
  eventScope?: string;
  publish(event: HarnessEvent): Promise<void>;
  onActivity?: (activity: AgentActivitySignal) => void;
  onAttemptReset?: (attempt: number) => Promise<void> | void;
  observeNativeUserInput?: (event: HarnessEvent) => Promise<void> | void;
}): CanonicalEventIngress {
  const eventIdentity = options.eventScope ? `${options.invocationId}:${options.eventScope}` : options.invocationId;
  let sequence = 0;
  let proxySequence = 0;
  let attempt = 0;
  let assistantSegment = 0;
  let currentAssistantItemId: string | undefined;
  let lastAssistantItemId: string | undefined;
  let tail: Promise<void> = Promise.resolve();
  let failure: HarnessEventStreamError | undefined;
  const activeTools = new Set<string>();
  const completedTools = new Set<string>();
  const toolParents = new Map<string, string>();
  const completedAssistantItems = new Set<string>();
  const assistantText = new Map<string, string>();
  const adapterEventFingerprints = new Map<string, string>();

  const rememberFailure = (error: unknown): HarnessEventStreamError => {
    const normalized = error instanceof HarnessEventStreamError
      ? error
      : new HarnessEventStreamError(
          options.descriptor.id,
          "Unable to accept a canonical Harness event",
          { cause: error }
        );
    failure ??= normalized;
    return failure;
  };

  const publishEvent = async (event: HarnessEvent): Promise<void> => {
    try {
      await options.publish(event);
    } catch (error) {
      throw new HarnessEventStreamError(
        options.descriptor.id,
        "Unable to publish a canonical Harness event",
        { cause: error }
      );
    }
  };

  const lifecycleDiagnostic = (
    event: HarnessEvent,
    reason: string,
    message: string
  ): HarnessEvent => {
    const diagnosticMessage = event.sourceType
      ? `${message} (source: ${event.sourceType})`
      : message;
    return validateCanonicalHarnessEvent({
      schemaVersion: 1,
      eventId: event.eventId,
      seq: event.seq,
      timestamp: event.timestamp,
      invocationId: event.invocationId,
      harnessId: event.harnessId,
      kind: "diagnostic",
      phase: "completed",
      attempt: event.attempt,
      ...(event.itemId ? { itemId: event.itemId } : {}),
      sourceType: `tool.lifecycle.${reason}`,
      message: diagnosticMessage,
      diagnostic: {
        source: "adapter",
        level: "warning",
        message: diagnosticMessage
      }
    }, options.descriptor);
  };

  const publishOpenToolDiagnostic = async (reason: "attempt_reset" | "stream_end") => {
    if (activeTools.size === 0) return;
    const callIds = [...activeTools];
    const visibleCallIds = callIds.slice(0, 8).join(", ");
    const omitted = callIds.length - Math.min(callIds.length, 8);
    const callSummary = visibleCallIds
      ? ` (${visibleCallIds}${omitted > 0 ? `, +${omitted} more` : ""})`
      : "";
    const message = `${reason === "attempt_reset"
      ? `Harness attempt reset with ${callIds.length} active tool call(s)`
      : `Harness event stream ended with ${callIds.length} active tool call(s)`
    }${callSummary}; incomplete tool telemetry was ignored`;
    const seq = sequence++;
    const diagnostic = validateCanonicalHarnessEvent({
      schemaVersion: 1,
      eventId: `${eventIdentity}:${options.descriptor.id}:${seq}`,
      seq,
      timestamp: new Date().toISOString(),
      invocationId: options.invocationId,
      harnessId: options.descriptor.id,
      kind: "diagnostic",
      phase: "completed",
      attempt,
      sourceType: `tool.lifecycle.${reason}`,
      message,
      diagnostic: {
        source: "adapter",
        level: "warning",
        message
      }
    }, options.descriptor);
    await publishEvent(diagnostic);
  };

  const accept = (rawEvent: HarnessEvent, nativeUserMessage?: string): Promise<void> => {
    const task = tail.then(async () => {
      if (failure) throw failure;
      const adapterEvent = validateCanonicalHarnessEvent(rawEvent, options.descriptor);
      if (adapterEvent.invocationId !== options.invocationId) {
        throw new HarnessEventStreamError(
          options.descriptor.id,
          "Canonical event invocation identity does not match"
        );
      }
      const fingerprint = JSON.stringify(adapterEvent);
      const previousFingerprint = adapterEventFingerprints.get(adapterEvent.eventId);
      if (previousFingerprint !== undefined) {
        if (previousFingerprint !== fingerprint) {
          throw new HarnessEventStreamError(
            options.descriptor.id,
            "Canonical event ID was reused with different content"
          );
        }
        return;
      }
      adapterEventFingerprints.set(adapterEvent.eventId, fingerprint);
      let itemId = adapterEvent.itemId && options.eventScope ? `${options.eventScope}:${adapterEvent.itemId}` : adapterEvent.itemId;
      let parentItemId = adapterEvent.parentItemId && options.eventScope ? `${options.eventScope}:${adapterEvent.parentItemId}` : adapterEvent.parentItemId;
      if (adapterEvent.kind === "assistant.delta" || adapterEvent.kind === "assistant.message") {
        const message = adapterEvent.message ?? "";
        // Some native CLIs publish deltas, begin a tool call, and only then
        // emit the authoritative full Assistant envelope.  Correlate that
        // envelope back to the pre-tool segment when its body is identical;
        // a genuinely new post-tool message still receives a fresh itemId.
        const matchingPreviousItem =
          adapterEvent.kind === "assistant.message" &&
          !currentAssistantItemId &&
          activeTools.size > 0 &&
          lastAssistantItemId &&
          assistantText.get(lastAssistantItemId) === message
            ? lastAssistantItemId
            : undefined;
        currentAssistantItemId ??=
          matchingPreviousItem ?? `${options.eventScope ? `${options.eventScope}:` : ""}assistant-${attempt}-${assistantSegment++}`;
        itemId = currentAssistantItemId;
        if (
          adapterEvent.kind === "assistant.message" &&
          completedAssistantItems.has(itemId)
        ) {
          return;
        }
      }
      const nativeCallId = adapterEvent.tool?.callId;
      const callId = nativeCallId && options.eventScope ? `${options.eventScope}:${nativeCallId}` : nativeCallId;
      const assistantParent = adapterEvent.kind === "tool.started"
        ? currentAssistantItemId ?? lastAssistantItemId
        : undefined;
      if (assistantParent) {
        parentItemId = assistantParent;
      } else if (callId && toolParents.has(callId)) {
        parentItemId = toolParents.get(callId);
      }
      const seq = sequence++;
      let event = validateCanonicalHarnessEvent({
        ...adapterEvent,
        schemaVersion: 1,
        eventId: `${eventIdentity}:${options.descriptor.id}:${seq}`,
        seq,
        invocationId: options.invocationId,
        harnessId: options.descriptor.id,
        attempt,
        ...(adapterEvent.tool && callId ? { tool: { ...adapterEvent.tool, callId } } : {}),
        ...(itemId ? { itemId } : {}),
        ...(parentItemId ? { parentItemId } : {})
      }, options.descriptor);
      const canonicalCallId = event.tool?.callId;
      if (event.kind === "tool.started") {
        if (!canonicalCallId) {
          throw new HarnessEventStreamError(options.descriptor.id, "Canonical tool start has no call ID");
        }
        if (activeTools.has(canonicalCallId)) {
          event = lifecycleDiagnostic(
            event,
            "duplicate_start",
            `Ignored duplicate tool start for call ${canonicalCallId}`
          );
        } else if (completedTools.has(canonicalCallId)) {
          event = lifecycleDiagnostic(
            event,
            "replayed_start",
            `Ignored replayed tool start for completed call ${canonicalCallId}`
          );
        } else {
          activeTools.add(canonicalCallId);
          if (assistantParent) toolParents.set(canonicalCallId, assistantParent);
          if (currentAssistantItemId) lastAssistantItemId = currentAssistantItemId;
          currentAssistantItemId = undefined;
        }
      } else if (event.kind === "tool.updated") {
        if (!canonicalCallId) {
          throw new HarnessEventStreamError(options.descriptor.id, "Canonical tool update has no call ID");
        }
        if (!activeTools.has(canonicalCallId)) {
          event = lifecycleDiagnostic(
            event,
            completedTools.has(canonicalCallId) ? "late_update" : "orphan_update",
            completedTools.has(canonicalCallId)
              ? `Ignored tool update after completion for call ${canonicalCallId}`
              : `Ignored tool update without an active start for call ${canonicalCallId}`
          );
        }
      } else if (event.kind === "tool.completed" || event.kind === "tool.failed") {
        if (!canonicalCallId) {
          throw new HarnessEventStreamError(options.descriptor.id, "Canonical tool completion has no call ID");
        }
        if (activeTools.delete(canonicalCallId)) {
          completedTools.add(canonicalCallId);
          toolParents.delete(canonicalCallId);
        } else if (completedTools.has(canonicalCallId)) {
          event = lifecycleDiagnostic(
            event,
            "duplicate_completion",
            `Ignored duplicate tool completion for call ${canonicalCallId}`
          );
        } else {
          completedTools.add(canonicalCallId);
          toolParents.delete(canonicalCallId);
          event = lifecycleDiagnostic(
            event,
            "orphan_completion",
            `Ignored tool completion without an active start for call ${canonicalCallId}`
          );
        }
      }
      if (event.kind === "assistant.message" && event.itemId) {
        assistantText.set(event.itemId, event.message ?? "");
        completedAssistantItems.add(event.itemId);
        lastAssistantItemId = event.itemId;
        currentAssistantItemId = undefined;
      } else if (event.kind === "assistant.delta" && event.itemId) {
        assistantText.set(
          event.itemId,
          `${assistantText.get(event.itemId) ?? ""}${event.message ?? ""}`
        );
      }
      if (
        (event.kind === "assistant.delta" || event.kind === "assistant.message") &&
        Boolean(event.message)
      ) {
        options.onActivity?.({
          kind: "model",
          phase: event.kind === "assistant.delta" ? "delta" : "completed",
          source: "harness",
          ...(event.kind === "assistant.delta"
            ? { deltaKind: "visible-text" as const }
            : {})
        });
      } else if (event.kind === "activity") {
        // Canonical body-free activity events are emitted only by explicit
        // Adapter mappings for hidden reasoning or streamed tool arguments.
        // Unmapped/native metadata frames never reach this branch.
        options.onActivity?.({
          kind: "model",
          phase: "delta",
          source: "harness"
        });
      } else if (event.kind.startsWith("tool.") && event.tool?.callId) {
        options.onActivity?.({
          kind: "tool",
          phase: event.kind.slice("tool.".length) as "started" | "updated" | "completed" | "failed",
          source: "harness",
          callId: event.tool.callId,
          name: event.tool.name
        });
      }
      if (event.kind === "user.message" && typeof nativeUserMessage === "string") {
        if (!nativeUserMessage.startsWith(event.message ?? "")) {
          throw new HarnessEventStreamError(options.descriptor.id, "Native input differs from its canonical preview");
        }
        await options.observeNativeUserInput?.({ ...event, message: nativeUserMessage });
      }
      await publishEvent(event);
    });
    const observed = task.catch((error: unknown) => {
      throw rememberFailure(error);
    });
    // Keep the queue live solely so every already-enqueued event settles. The
    // retained failure prevents later work from crossing the boundary.
    tail = observed.then(() => undefined, () => undefined);
    void observed.catch(() => undefined);
    return observed;
  };

  return {
    accept,
    acceptProxyDelta(message: string): Promise<void> {
      if (!message) return Promise.resolve();
      return accept({
        schemaVersion: 1,
        eventId: `${eventIdentity}:proxy:${proxySequence}`,
        seq: proxySequence++,
        timestamp: new Date().toISOString(),
        invocationId: options.invocationId,
        harnessId: options.descriptor.id,
        kind: "assistant.delta",
        phase: "delta",
        sourceType: "proxy.visible_output",
        message
      });
    },
    async resetAttempt(): Promise<void> {
      await tail;
      if (failure) throw failure;
      try {
        await publishOpenToolDiagnostic("attempt_reset");
      } catch (error) {
        throw rememberFailure(error);
      }
      activeTools.clear();
      completedTools.clear();
      toolParents.clear();
      completedAssistantItems.clear();
      assistantText.clear();
      adapterEventFingerprints.clear();
      currentAssistantItemId = undefined;
      lastAssistantItemId = undefined;
      assistantSegment = 0;
      attempt += 1;
      await options.onAttemptReset?.(attempt);
    },
    async drain(requireClosedTools: boolean): Promise<void> {
      await tail;
      if (failure) throw failure;
      if (requireClosedTools && activeTools.size) {
        try {
          await publishOpenToolDiagnostic("stream_end");
        } catch (error) {
          throw rememberFailure(error);
        }
        activeTools.clear();
        toolParents.clear();
      }
    }
  };
}

const CONTROL_ACTION_TOOLS = new Set([
  "finish_task",
  "git_push",
  "git_get_operation",
  "git_reconcile_push",
  "github_create_pr",
  "github_get_pr",
  "github_merge_pr",
  "github_close_pr", "github_update_pr",
  "git_prepare_conflict",
  "git_log", "git_show", "git_diff", "git_revert",
  "coordinate_group_task",
  "coordinate_agent_receipt",
  "route_to_agent",
  "publish_artifact",
  "select_display",
  "request_user",
  "apply_workflow",
  "complete_project",
  "assign_group_tasks",
  "claim_group_task",
  "request_group_integration",
  "complete_group"
]);

const CONTROL_ENVELOPE_FIELDS = new Set([
  "projectId", "agent", "invocationId", "callId", "stateVersion",
  "capabilityHash", "expiresAt", "receivedAt", "action"
]);
const CONTROL_ACTION_FIELDS: Readonly<Record<string, ReadonlySet<string>>> = {
  finish_task: new Set(["tool", "summary", "memory"]),
  git_push: new Set(["tool", "reason"]),
  git_reconcile_push: new Set(["tool", "operationId", "retry", "historical"]),
  git_get_operation: new Set(["tool", "operationId"]),
  github_create_pr: new Set(["tool", "base", "title", "body"]),
  github_get_pr: new Set(["tool", "providerNumber", "sourceOperationId"]),
  github_merge_pr: new Set(["tool", "providerNumber", "reason"]),
  github_update_pr: new Set(["tool", "providerNumber", "title", "body"]),
  github_close_pr: new Set(["tool", "providerNumber", "reason"]),
  git_prepare_conflict: new Set(["tool"]),
  git_log: new Set(["tool", "revision", "offset", "limit"]),
  git_show: new Set(["tool", "commit", "offset", "maxBytes", "expectedVersion"]),
  git_diff: new Set(["tool", "mode", "from", "to", "expectedHead", "offset", "maxBytes", "expectedVersion"]),
  git_revert: new Set(["tool", "mode", "target", "expectedHead", "mainline", "sourceOperationId", "offset", "maxBytes", "expectedVersion", "operationId"]),
  coordinate_group_task: new Set(["tool", "groupRunId", "coordinatorEpoch", "arrivalRequestId", "operation", "rationale", "repairNodeId", "closing"]),
  coordinate_agent_receipt: new Set(["tool", "incidentId", "operation", "rationale"]),
  route_to_agent: new Set(["tool", "target", "assignment", "rationale", "context", "successCriteria"]),
  publish_artifact: new Set(["tool", "path", "title", "kind", "description", "replacesPath"]),
  select_display: new Set(["tool", "primary", "items"]),
  request_user: new Set(["tool", "message", "rationale", "context"]),
  apply_workflow: new Set(["tool", "path", "rationale"]),
  complete_project: new Set(["tool", "rationale"]),
  assign_group_tasks: new Set(["tool", "groupRunId", "coordinatorEpoch", "tasks"]),
  claim_group_task: new Set(["tool", "taskId", "coordinatorEpoch"]),
  request_group_integration: new Set([
    "tool", "groupRunId", "coordinatorEpoch", "integrationOwnerAgentId"
  ]),
  complete_group: new Set(["tool", "groupRunId", "coordinatorEpoch", "output"])
};
const DISPLAY_ITEM_FIELDS = new Set(["agent", "path", "title"]);
const GROUP_TASK_FIELDS = new Set([
  "taskId", "assignment", "assigneeAgentId", "dependencyTaskIds"
]);

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  try {
    return Object.getPrototypeOf(value) === Object.prototype;
  } catch {
    return false;
  }
}

function hasOnlyStringKeys(
  value: Record<string, unknown>,
  allowed: ReadonlySet<string>
): boolean {
  return Reflect.ownKeys(value).every((key) =>
    typeof key === "string" && allowed.has(key)
  );
}

function boundedControlString(value: unknown, required = false): boolean {
  if (value === undefined) return !required;
  return typeof value === "string" && (!required || Boolean(value.trim())) &&
    value.length <= 100_000 &&
    !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value);
}

function validDisplayItem(value: unknown): boolean {
  if (!isPlainRecord(value) || !hasOnlyStringKeys(value, DISPLAY_ITEM_FIELDS)) {
    return false;
  }
  return boundedControlString(value.agent, true) &&
    boundedControlString(value.path, true) &&
    boundedControlString(value.title, true);
}

function validControlAction(action: Record<string, unknown>, tool: string): boolean {
  const fields = CONTROL_ACTION_FIELDS[tool];
  if (!fields || !hasOnlyStringKeys(action, fields)) return false;
  if (tool === "finish_task") return boundedControlString(action.summary) && boundedControlString(action.memory);
  if (tool === "coordinate_agent_receipt") return typeof action.incidentId === "string" && Boolean(action.incidentId.trim()) &&
    action.incidentId.length <= 1024 && (action.operation === "retry" || action.operation === "escalate") && boundedControlString(action.rationale, true);
  if (tool === "git_push") return boundedControlString(action.reason);
  if (tool === "git_get_operation") return typeof action.operationId === "string" && Boolean(action.operationId.trim()) && action.operationId.length <= 1_024;
  if (tool === "git_reconcile_push") return typeof action.operationId === "string" && Boolean(action.operationId.trim()) && action.operationId.length <= 1_024 && (action.retry === undefined || typeof action.retry === "boolean") && (action.historical === undefined || typeof action.historical === "boolean") && !(action.historical === true && action.retry === true);
  if (tool === "github_create_pr") return boundedControlString(action.base, true) && boundedControlString(action.title, true) && boundedControlString(action.body);
  if (tool === "github_get_pr") return (action.providerNumber === undefined || (Number.isSafeInteger(action.providerNumber) && Number(action.providerNumber) >= 1)) &&
    (action.sourceOperationId === undefined || typeof action.sourceOperationId === "string" && Boolean(action.sourceOperationId.trim()) && action.sourceOperationId.length <= 1024);
  if (tool === "github_update_pr") return Number.isSafeInteger(action.providerNumber) && Number(action.providerNumber) >= 1 && boundedControlString(action.title, true) && boundedControlString(action.body);
  if (tool === "github_merge_pr" || tool === "github_close_pr") return Number.isSafeInteger(action.providerNumber) && Number(action.providerNumber) >= 1 && boundedControlString(action.reason);
  if (tool === "git_prepare_conflict") return true;
  if (tool === "git_log" || tool === "git_show" || tool === "git_diff") {
    try { parseGitInspectionRequest(tool, action); return true; } catch { return false; }
  }
  if (tool === "git_revert") {
    try { parseGitRevertRequest(action); return true; } catch { return false; }
  }
  if (tool === "coordinate_group_task") return boundedControlString(action.groupRunId, true) &&
    Number.isSafeInteger(action.coordinatorEpoch) && (action.coordinatorEpoch as number) >= 1 &&
    boundedControlString(action.arrivalRequestId, true) && ["retry", "escalate", "skip", "close_worktree"].includes(String(action.operation)) &&
    boundedControlString(action.rationale, true) &&
    (action.operation === "close_worktree"
      ? isPlainRecord(action.closing) && hasOnlyStringKeys(action.closing, new Set(["executionId", "ownershipEpoch", "paths"])) &&
        boundedControlString(action.closing.executionId, true) && (action.closing.executionId as string).length <= 256 &&
        Number.isSafeInteger(action.closing.ownershipEpoch) && Number(action.closing.ownershipEpoch) >= 1 &&
        Array.isArray(action.closing.paths) && action.closing.paths.length > 0 && action.closing.paths.length <= 1000 &&
        action.closing.paths.every(file => typeof file === "string" && file.length > 0 && file.length <= 4096 && !/[\u0000-\u001f\u007f]/u.test(file)) &&
        new Set(action.closing.paths).size === action.closing.paths.length && action.repairNodeId === undefined
      : action.closing === undefined) &&
    (action.repairNodeId === undefined ||
      (boundedControlString(action.repairNodeId, true) && (action.repairNodeId as string).length <= 256));
  if (tool === "route_to_agent") {
    return boundedControlString(action.target, true) &&
      boundedControlString(action.assignment) && boundedControlString(action.rationale) &&
      boundedControlString(action.context) &&
      (action.successCriteria === undefined ||
        (Array.isArray(action.successCriteria) && action.successCriteria.length <= 100 &&
          action.successCriteria.every((item) => boundedControlString(item, true))));
  }
  if (tool === "publish_artifact") {
    return boundedControlString(action.path, true) && boundedControlString(action.title, true) &&
      boundedControlString(action.kind, true) && boundedControlString(action.description, true) &&
      boundedControlString(action.replacesPath);
  }
  if (tool === "request_user") {
    return boundedControlString(action.message, true) && boundedControlString(action.rationale, true) &&
      boundedControlString(action.context);
  }
  if (tool === "apply_workflow") {
    return action.path === MAIN_AGENT_ORCHESTRATION_FILE &&
      boundedControlString(action.rationale, true);
  }
  if (tool === "complete_project") return boundedControlString(action.rationale, true);
  if (tool === "select_display") {
    if (!validDisplayItem(action.primary) ||
      (action.items !== undefined &&
        (!Array.isArray(action.items) || action.items.length > 100 ||
          !action.items.every(validDisplayItem)))) {
      return false;
    }
    return JSON.stringify({ primary: action.primary, items: action.items }).length <= 100_000;
  }
  if (tool === "assign_group_tasks") {
    if (!boundedControlString(action.groupRunId, true) ||
      !Number.isSafeInteger(action.coordinatorEpoch) || (action.coordinatorEpoch as number) < 1 ||
      !Array.isArray(action.tasks) || action.tasks.length < 1) {
      return false;
    }
    const taskIds = new Set<string>();
    for (const value of action.tasks) {
      if (!isPlainRecord(value) || !hasOnlyStringKeys(value, GROUP_TASK_FIELDS) ||
        !boundedControlString(value.taskId, true) ||
        !boundedControlString(value.assignment, true) ||
        !boundedControlString(value.assigneeAgentId) ||
        (value.dependencyTaskIds !== undefined &&
          (!Array.isArray(value.dependencyTaskIds) || value.dependencyTaskIds.length > 100 ||
            !value.dependencyTaskIds.every((item) => boundedControlString(item, true))))) {
        return false;
      }
      const taskId = value.taskId as string;
      const dependencies = value.dependencyTaskIds as string[] | undefined;
      if (taskIds.has(taskId) || dependencies?.includes(taskId) ||
        dependencies && new Set(dependencies).size !== dependencies.length) return false;
      taskIds.add(taskId);
    }
    return JSON.stringify(action.tasks).length <= 500_000;
  }
  if (tool === "claim_group_task") {
    return boundedControlString(action.taskId, true) &&
      Number.isSafeInteger(action.coordinatorEpoch) && (action.coordinatorEpoch as number) >= 1;
  }
  if (tool === "request_group_integration") {
    return boundedControlString(action.groupRunId, true) &&
      Number.isSafeInteger(action.coordinatorEpoch) && (action.coordinatorEpoch as number) >= 1 &&
      boundedControlString(action.integrationOwnerAgentId, true);
  }
  if (tool === "complete_group") {
    return boundedControlString(action.groupRunId, true) &&
      Number.isSafeInteger(action.coordinatorEpoch) && (action.coordinatorEpoch as number) >= 1 &&
      boundedControlString(action.output, true);
  }
  return false;
}

function validControlCollaborationScope(
  action: Record<string, unknown>,
  tool: string,
  control: ControlMcpRequest
): boolean {
  if (control.worktreeClosing) return worktreeClosingActionAllowed({ ...action, tool });
  if (control.terminalPushCoordination) {
    return terminalPushCoordinationActionAllowed(control.terminalPushCoordination, { ...action, tool });
  }
  if (tool === "coordinate_agent_receipt") return false;
  if (control.terminalPushObservation) {
    return terminalPushObservationActionAllowed(control.terminalPushObservation, { ...action, tool });
  }
  if (control.canonicalFinalIntegration && (["git_revert", "git_log", "git_show", "git_diff"].includes(tool) ||
    tool === "github_get_pr" && action.sourceOperationId !== undefined)) return false;
  const scope = control.collaboration;
  // Every assigned MCP scope exposes the Agent's own finish_task. Accept its
  // returned receipt here too: the live broker owns task/session authority
  // and saves Agent-authored memory. The system must never replace that work
  // or turn the Agent's valid finish into a fabricated management failure.
  if (tool === "finish_task") return true;
  const groupTools = new Set([
    "coordinate_group_task",
    "assign_group_tasks",
    "claim_group_task",
    "request_group_integration",
    "complete_group"
  ]);
  if (!scope) {
    if (groupTools.has(tool)) return false;
    if (tool === "route_to_agent") {
      return typeof action.target === "string" && control.candidates.includes(action.target);
    }
    if (tool === "request_user") return control.allowUserIntervention;
    if (tool === "apply_workflow") {
      return (control.allowAgentOrchestrationReconfiguration === true ||
        control.allowWorkflowReconfiguration === true) &&
        action.path === MAIN_AGENT_ORCHESTRATION_FILE;
    }
    if (tool === "complete_project") return control.canComplete;
    if (["git_push", "git_get_operation", "git_reconcile_push", "github_create_pr", "github_get_pr", "github_merge_pr", "github_close_pr", "github_update_pr", "git_prepare_conflict", "git_log", "git_show", "git_diff", "git_revert"].includes(tool)) {
      return control.allowAgentGitActions === true;
    }
    return true;
  }
  if (scope.role === "scoped-leader" || scope.role === "scoped-main") {
    if (scope.worktreeClosingOnly && (tool !== "coordinate_group_task" ||
      !["close_worktree", "escalate"].includes(String(action.operation)) || action.repairNodeId !== undefined)) return false;
    if (tool === "apply_workflow") return scope.allowReconfiguration && control.allowWorkflowReconfiguration === true;
    if (tool === "route_to_agent") return Boolean(scope.sourceArrivalRequestId || scope.sourceOuterNodeRunId) && scope.routeCandidates.includes(String(action.target));
    if (tool === "assign_group_tasks") return action.groupRunId === scope.groupRunId && action.coordinatorEpoch === scope.coordinatorEpoch &&
      (action.tasks as Array<{ taskId: string; assigneeAgentId?: string; dependencyTaskIds?: string[] }>).every((task) =>
        scope.memberNodeIds.includes(task.taskId) && !task.assigneeAgentId && !task.dependencyTaskIds?.length);
    if (tool === "coordinate_group_task") return action.groupRunId === scope.groupRunId && action.coordinatorEpoch === scope.coordinatorEpoch &&
      scope.failedArrivalRequestIds.includes(String(action.arrivalRequestId)) && (scope.role === "scoped-main" ? ["retry", "skip"] : ["retry", "escalate", ...(scope.closingArrivalRequestIds?.includes(String(action.arrivalRequestId)) ? ["close_worktree"] : [])]).includes(String(action.operation)) &&
      (action.operation === "close_worktree" ? Boolean(action.closing && !action.repairNodeId) : action.closing === undefined);
    if (tool === "request_group_integration") return scope.role === "scoped-leader" && action.groupRunId === scope.groupRunId &&
      action.coordinatorEpoch === scope.coordinatorEpoch && typeof action.integrationOwnerAgentId === "string" && Boolean(action.integrationOwnerAgentId.trim());
    if (tool === "complete_group") return scope.role === "scoped-leader" && action.groupRunId === scope.groupRunId &&
      action.coordinatorEpoch === scope.coordinatorEpoch && typeof action.output === "string" && Boolean(action.output.trim());
    if (tool === "request_user") return scope.role === "scoped-main" && control.allowUserIntervention === true;
    return false;
  }
  if (scope.role === "leader") {
    return ["assign_group_tasks", "request_group_integration", "complete_group"].includes(tool) &&
      action.groupRunId === scope.groupRunId &&
      action.coordinatorEpoch === scope.coordinatorEpoch;
  }
  if (scope.role === "delivery") {
    return tool === "claim_group_task" && action.taskId === scope.taskId &&
      action.coordinatorEpoch === scope.coordinatorEpoch;
  }
  return false;
}

function validateAdapterResult(
  value: AgentRunResult,
  request: AgentRunRequest,
  descriptor: HarnessDescriptor
): AgentRunResult {
  if ((request.worktreeClosing !== undefined || request.control?.worktreeClosing !== undefined) &&
    (!isWorktreeClosingScope(request.worktreeClosing, request.agent) ||
      !isDeepStrictEqual(request.worktreeClosing, request.control?.worktreeClosing))) {
    throw new HarnessRuntimeError("HARNESS_CONTRACT_VIOLATION", "Worktree closing result lost its exact assigned manifest",
      { harnessId: descriptor.id }, { source: "adapter" });
  }
  if ((request.terminalPushCoordination !== undefined || request.control?.terminalPushCoordination !== undefined) &&
    (!isTerminalPushCoordinationScope(request.terminalPushCoordination) ||
      !isDeepStrictEqual(request.terminalPushCoordination, request.control?.terminalPushCoordination))) {
    throw new HarnessRuntimeError("HARNESS_CONTRACT_VIOLATION", "Receipt coordination result lost its exact assigned turn scope",
      { harnessId: descriptor.id }, { source: "adapter" });
  }
  if (!isPlainRecord(value)) {
    throw new HarnessRuntimeError(
      "HARNESS_CONTRACT_VIOLATION",
      `${descriptor.label} returned an invalid invocation result`,
      { harnessId: descriptor.id },
      { source: "adapter" }
    );
  }
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== "string" || !["threadId", "handoff", "controlActions"].includes(key)) {
      throw new HarnessRuntimeError(
        "HARNESS_CONTRACT_VIOLATION",
        `${descriptor.label} returned an invalid invocation result`,
        { harnessId: descriptor.id },
        { source: "adapter" }
      );
    }
  }
  const handoff = value.handoff;
  if (typeof handoff !== "string" || !handoff.trim() || handoff.length > HANDOFF_CHARACTER_LIMIT ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(handoff)) {
    throw new HarnessRuntimeError(
      "HARNESS_CONTRACT_VIOLATION",
      `${descriptor.label} returned an invalid natural-language handoff`,
      { harnessId: descriptor.id },
      { source: "adapter" }
    );
  }
  if (value.threadId !== undefined &&
    (typeof value.threadId !== "string" || !value.threadId.trim() || value.threadId.length > 8_192 ||
      /[\u0000-\u001f\u007f]/u.test(value.threadId))) {
    throw new HarnessRuntimeError(
      "HARNESS_CONTRACT_VIOLATION",
      `${descriptor.label} returned an invalid Session identity`,
      { harnessId: descriptor.id },
      { source: "adapter" }
    );
  }
  const actions = value.controlActions === undefined ? [] : value.controlActions;
  if (!Array.isArray(actions) || actions.length > 64 || (!request.control && actions.length)) {
    throw new HarnessRuntimeError(
      "HARNESS_CONTRACT_VIOLATION",
      `${descriptor.label} returned invalid orchestration control actions`,
      { harnessId: descriptor.id },
      { source: "adapter" }
    );
  }
  const callIds = new Set<string>();
  const decisions: ControlActionEnvelope["action"][] = [];
  for (const raw of actions as ControlActionEnvelope[]) {
    const envelope = raw as unknown as Record<string, unknown>;
    const action = envelope?.action as Record<string, unknown> | undefined;
    const control = request.control;
    const receivedAt = typeof envelope?.receivedAt === "string"
      ? envelope.receivedAt
      : "";
    const canonicalReceivedAt = receivedAt && !Number.isNaN(Date.parse(receivedAt))
      ? new Date(receivedAt).toISOString()
      : "";
    const callId = typeof envelope?.callId === "string" ? envelope.callId : "";
    const tool = typeof action?.tool === "string" ? action.tool : "";
    if (!envelope || Array.isArray(envelope) || !action || Array.isArray(action) ||
      Object.getPrototypeOf(envelope) !== Object.prototype ||
      Object.getPrototypeOf(action) !== Object.prototype ||
      !hasOnlyStringKeys(envelope, CONTROL_ENVELOPE_FIELDS) ||
      envelope.projectId !== request.project.id || envelope.agent !== request.agent ||
      envelope.invocationId !== request.invocationId ||
      envelope.stateVersion !== control?.stateVersion ||
      envelope.capabilityHash !== control?.capabilityHash ||
      envelope.expiresAt !== control?.expiresAt ||
      !callId || callId.length > 512 || /[\s\u0000-\u001f\u007f]/u.test(callId) ||
      callIds.has(callId) || receivedAt !== canonicalReceivedAt ||
      !CONTROL_ACTION_TOOLS.has(tool) || !validControlAction(action, tool) ||
      !control || !validControlCollaborationScope(action, tool, control) ||
      decisions.some((existing) => controlDecisionsConflict(existing, action as unknown as ControlActionEnvelope["action"]))) {
      throw new HarnessRuntimeError(
        "HARNESS_CONTRACT_VIOLATION",
        `${descriptor.label} returned an invalid orchestration control envelope`,
        { harnessId: descriptor.id },
        { source: "adapter" }
      );
    }
    callIds.add(callId);
    const acceptedAction = action as unknown as ControlActionEnvelope["action"];
    if (isControlDecision(acceptedAction)) decisions.push(acceptedAction);
  }
  return { ...value, handoff: handoff.trim(), ...(actions.length ? { controlActions: actions } : {}) };
}

/** The only orchestration-facing execution entry point. It never falls back. */
export class HarnessRuntimeFacade implements AgentRunner, AdapterSmokeProbeRunner, CollaborationHarnessRunner {
  readonly contextIndexes = new ContextIndexOrganizer();

  configureContextOrganizer(organizer: ContextOrganizer): void { this.contextIndexes.configure(organizer); }

  publishContextIndex(input: { projectId: string; projectPath: string; inboxPath: string; sources: readonly AgentContextSource[] }): Promise<AgentContextIndex | undefined> {
    return publishAgentContextIndex(input.inboxPath, input.sources, { lookup: this.contextIndexes.lookup(input.projectId, input.projectPath) });
  }

  prepareAgentContext(request: AgentRunRequest, inputs: InvocationInputs): Promise<InvocationInputs> {
    return prepareWorkflowContext(request, { ...inputs, ...(request.contextBackgrounds ? { contextBackgrounds: request.contextBackgrounds } : {}),
      ...(request.additionalContextIndexes ? { additionalContextIndexes: request.additionalContextIndexes } : {}) },
      undefined, { lookup: this.contextIndexes.lookup(request.project.id, inputs.projectPath) });
  }
  private readonly registry: HarnessRegistry;
  private readonly processHost: CommonProcessHost;
  private readonly sessions = new SessionCoordinator();
  private readonly residentLeases = new ResidentLeaseManager();
  private readonly options: HarnessRuntimeOptions;

  constructor(options: HarnessRuntimeOptions = {}) {
    this.options = options;
    this.processHost = options.processHost ?? new CommonProcessHost();
    if (options.adapters && options.additionalAdapters?.length) {
      throw new Error("HarnessRuntimeFacade cannot replace and extend Adapters at the same time");
    }
    const adapterOptions: AdapterRuntimeOptions = {
      resolveProjectWorkspace: options.resolveProjectWorkspace,
      inspireBin: options.inspireBin,
      inspireConfigPath: options.inspireConfigPath,
      inspireNoProxy: options.inspireNoProxy,
      inspireWorkspaceRoot: options.inspireWorkspaceRoot,
      explainerSandboxMode: options.explainerSandboxMode,
      harnessExecutables: options.harnessExecutables as Record<string, string | undefined> | undefined,
      dshHandshakeTimeoutMs: options.dshHandshakeTimeoutMs,
      dshTurnIdleTimeoutMs: options.dshTurnIdleTimeoutMs,
      residentModelInactivityTimeoutMs: options.residentModelInactivityTimeoutMs,
      residentToolInactivityTimeoutMs: options.residentToolInactivityTimeoutMs,
      protocolProxyTimeoutMs: options.protocolProxyTimeoutMs
    };
    const adapters = options.adapters ?? [
      new DshAdapter(adapterOptions),
      new PiAdapter(adapterOptions),
      new CodexAdapter(adapterOptions),
      new ClaudeCodeAdapter(adapterOptions),
      ...(options.additionalAdapters ?? [])
    ];
    this.registry = new HarnessRegistry(
      options.adapters ? adapters.map((adapter) => adapter.descriptor) : undefined,
      adapters
    );
  }

  harnessIds(): AgentHarness[] {
    // GatewayStore treats this list as its default Adapter smoke matrix, so
    // purpose-specific Adapters that cannot run probes must not leak into it.
    return this.registry.adapterIds("probe");
  }

  async harnessCatalog() {
    const catalog = await this.registry.publicCatalog();
    return catalog.map((entry) => {
      if (!entry.capabilities.readOnlyExplainer) return entry;
      try {
        this.assertExplainerAvailable(entry.id);
        return entry;
      } catch {
        // Runtime-dependent isolation (for example a host sandbox backend) is
        // part of capability availability, not executable availability. Do
        // not advertise a read-only purpose that this process cannot enforce.
        return {
          ...entry,
          purposes: entry.purposes.filter((purpose) => purpose !== "explainer"),
          capabilities: {
            ...entry.capabilities,
            readOnlyExplainer: false
          }
        };
      }
    });
  }

  nativeProtocol(harness: AgentHarness) {
    return this.registry.has(harness)
      ? this.registry.descriptor(harness).nativeProtocol
      : undefined;
  }

  /** Adapter-owned recovery policy used by the collaboration resident wrapper. */
  residentRecoveryStrategy(harness: AgentHarness, _schemaVersion?: number) {
    if (!this.registry.has(harness)) return undefined;
    return this.registry.registeredAdapter(harness).resident?.recoveryStrategy;
  }

  /**
   * Narrow production route factory for the resident authority adapter.  The
   * caller supplies only a turn request; Registry metadata and Gateway proxy
   * policy remain Facade-owned.
   */
  async openResidentTurnGatewayRoute(
    request: AgentRunRequest,
    onTrace: TraceSink,
    signal: AbortSignal
  ): Promise<InvocationModelRoute> {
    const harnessId = request.project.agents[request.agent]?.harness;
    if (!harnessId) {
      throw new HarnessRuntimeError(
        "HARNESS_CONFIGURATION_INVALID",
        `Agent ${request.agent} has no locked Harness in the project runtime snapshot`,
        { agent: request.agent },
        { source: "runtime" }
      );
    }
    const descriptor = this.registry.adapter(harnessId, "workflow").descriptor;
    return openInvocationModelRoute(descriptor, request, onTrace, signal, {
      protocolProxyFactory: this.options.protocolProxyFactory,
      ...(this.options.protocolProxyTimeoutMs !== undefined
        ? { protocolProxyTimeoutMs: this.options.protocolProxyTimeoutMs }
        : {}),
      validateGatewayTarget: this.options.validateGatewayTarget,
      bufferedResponseCache: new Map<string, Promise<BufferedProtocolResponse>>()
    }, this.options.resolveNativeCodexProfile);
  }

  /** Build one invocation-owned canonical ingress for raw resident protocol frames. */
  createResidentTurnFrameSink(request: AgentRunRequest, eventScope?: string): ResidentTurnFrameSink {
    const harnessId = request.project.agents[request.agent]?.harness;
    if (!harnessId) {
      throw new HarnessRuntimeError(
        "HARNESS_CONFIGURATION_INVALID",
        `Agent ${request.agent} has no locked Harness in the project runtime snapshot`,
        { agent: request.agent },
        { source: "runtime" }
      );
    }
    const adapter = this.registry.adapter(harnessId, "workflow");
    const descriptor = adapter.descriptor;
    const mapEvent = adapter.resident?.createOfficialEventMapper();
    if (!mapEvent) {
      throw new HarnessRuntimeError(
        "HARNESS_CONFIGURATION_INVALID",
        `Harness ${harnessId} has no resident official-event mapper`,
        { harnessId },
        { source: "runtime" }
      );
    }
    let nativeUserMessage: string | undefined;
    const ingress = createCanonicalEventIngress({
      descriptor,
      invocationId: request.invocationId,
      eventScope,
      onActivity: request.onModelActivity,
      observeNativeUserInput: event => request.onNativeUserInput?.(event as unknown as Record<string, unknown>),
      publish: async (event) => {
        await request.onOfficialHarnessEvent?.(
          event as unknown as Record<string, unknown>
        );
        await request.onLiveHarnessEvent?.(
          event as HarnessEvent & Record<string, unknown>
        );
      }
    });
    const bridge = new OfficialEventBridge({
      descriptor,
      invocationId: request.invocationId,
      mapEvent,
      onActivity: request.onModelActivity,
      onNativeUserInput: event => { nativeUserMessage = event.message; },
      onEvent: event => {
        const message = nativeUserMessage;
        nativeUserMessage = undefined;
        return ingress.accept(event, message);
      }
    });
    return {
      accept: (frame) => bridge.accept(frame),
      drain: async () => {
        await bridge.drain();
        await ingress.drain(true);
      }
    };
  }

  /** Shared strict result validator for one-shot and resident production paths. */
  validateResidentTurnResult(
    value: AgentRunResult,
    request: AgentRunRequest
  ): AgentRunResult {
    const harnessId = request.project.agents[request.agent]?.harness;
    if (!harnessId) {
      throw new HarnessRuntimeError(
        "HARNESS_CONFIGURATION_INVALID",
        `Agent ${request.agent} has no locked Harness in the project runtime snapshot`,
        { agent: request.agent },
        { source: "runtime" }
      );
    }
    const adapter = this.registry.adapter(harnessId, "workflow");
    return validateAdapterResult(value, request, adapter.descriptor);
  }

  /**
   * Compose the low-level resident launch contract from the same trusted
   * request/session/policy/input plumbing as one-shot execution. Schedulers
   * supply only collaboration-owned authorities and never synthesize an
   * InvocationSpec, native SessionRef, ProcessHost binding, or broker row.
   */
  async prepareResidentScope(
    input: PrepareResidentScopeRequest
  ): Promise<ResidentScopeOpenRequest> {
    const { signal } = input;
    const mechanismOnly = input.request.terminalPushObservation !== undefined || input.request.terminalPushCoordination !== undefined || input.request.worktreeClosing !== undefined;
    const request = mechanismOnly
      ? { ...input.request, permission: "workspace" as const }
      : input.request;
    const context = request.executionContext;
    if (!context) {
      throw new HarnessRuntimeError(
        "HARNESS_CONTRACT_VIOLATION",
        "Resident Harness preparation requires a collaboration execution context",
        { invocationId: request.invocationId },
        { source: "runtime" }
      );
    }
    if ((request.terminalPushCoordination !== undefined || request.control?.terminalPushCoordination !== undefined) &&
      (!isTerminalPushCoordinationScope(request.terminalPushCoordination) || context.role !== "leader" ||
        request.kind !== (request.agent === "main" ? "main" : "worker") ||
        request.terminalPushCoordination.coordinatorEpoch !== context.coordinatorEpoch ||
        request.terminalPushCoordination.role === "main" && request.agent !== "main" ||
        request.project.status === "completed" || request.sessionContinuity !== "strict" ||
        request.project.agentSessions?.[collaborationSessionKey(request.agent, context, request.project.orchestration.schemaVersion === 3)]?.durable !== true ||
        request.terminalPushObservation !== undefined || request.terminalControlRepair !== undefined ||
        input.sameEpochReopen !== undefined || input.inputs?.workflowAuthoringPath !== undefined ||
        !isDeepStrictEqual(request.terminalPushCoordination, request.control?.terminalPushCoordination))) {
      throw new HarnessRuntimeError("HARNESS_CONTRACT_VIOLATION",
        "Receipt coordination requires its exact retained-session management grant", {}, { source: "runtime" });
    }
    if (request.worktreeClosing !== undefined || request.control?.worktreeClosing !== undefined) {
      try {
        assertWorktreeClosingRequest(request, input.sameEpochReopen);
        if (!isWorktreeClosingScope(request.worktreeClosing, request.agent) ||
          !isDeepStrictEqual(request.worktreeClosing, request.control?.worktreeClosing) || input.inputs || input.mcpRows?.length) {
          throw new Error("Worktree closing rejects mismatched control, staged management inputs and external MCP rows");
        }
        assertWorktreeClosingControl({ ...request.control!, agent: request.agent, kind: request.kind });
      } catch (error) {
        throw new HarnessRuntimeError("HARNESS_CONTRACT_VIOLATION", String(error), {}, { source: "runtime" });
      }
    }
    if (request.terminalPushObservation !== undefined &&
      (!isTerminalPushObservationScope(request.terminalPushObservation) ||
        context.role !== "delivery" || request.kind !== "worker" ||
        request.project.git?.enabled !== true || request.sessionContinuity !== "strict" ||
        request.project.agentSessions?.[request.agent]?.durable !== true ||
        !input.sameEpochReopen || request.terminalControlRepair !== undefined ||
        request.control?.terminalPushObservation?.operationId !== request.terminalPushObservation.operationId)) {
      throw new HarnessRuntimeError("HARNESS_CONTRACT_VIOLATION",
        "Terminal push observation requires an exact retained-session grant and receipt control", {}, { source: "runtime" });
    }
    if (signal.aborted) {
      throw new HarnessRuntimeError(
        "INVOCATION_INTERRUPTED",
        "Resident Harness preparation was cancelled before start"
      );
    }
    if (request.purpose !== undefined && request.purpose !== "workflow") {
      throw new HarnessRuntimeError(
        "HARNESS_CONTRACT_VIOLATION",
        "Collaboration resident scopes support workflow execution only",
        { invocationId: request.invocationId },
        { source: "runtime" }
      );
    }
    const config = request.project.agents[request.agent];
    const harnessId = config?.harness;
    if (!config || !harnessId) {
      throw new HarnessRuntimeError(
        "HARNESS_CONFIGURATION_INVALID",
        `Agent ${request.agent} has no locked Harness in the project runtime snapshot`,
        { agent: request.agent },
        { source: "runtime" }
      );
    }
    const adapter = this.registry.adapter(harnessId, "workflow");
    if (!adapter.resident) {
      throw new HarnessRuntimeError(
        "HARNESS_CAPABILITY_UNSUPPORTED",
        `${adapter.descriptor.label} does not expose a resident collaboration protocol`,
        { harnessId },
        { source: "runtime" }
      );
    }

    const stagedInputs = context.role === "leader"
      ? await validateLeaderResidentInputs(request, input.inputs)
      : await prepareInvocationInputs(request, this.options.resolveProjectWorkspace);
    const inputs = await this.prepareAgentContext(request, stagedInputs);
    await fs.mkdir(input.executionRuntimePath, { recursive: true, mode: 0o700 });
    await prepareComputeRuntime({
      permission: request.permission,
      workspacePath: inputs.workspacePath,
      runtimePath: inputs.runtimePath
    }, this.options);

    let stagedSkills: Awaited<ReturnType<typeof stageInvocationSkills>>;
    try {
      stagedSkills = mechanismOnly ? { skillPaths: [], autoSkillPaths: [] } : await stageInvocationSkills(
        request.skillPaths,
        request.autoSkillPaths ?? [],
        request.project.git?.enabled ? path.dirname(inputs.inboxPath) : inputs.workspacePath,
        request.availableSkillPaths,
        request.agent
      );
    } catch (error) {
      throw new HarnessRuntimeError(
        "INVOCATION_INPUT_STAGING_FAILED",
        "Unable to stage selected Skills inside the resident Agent workspace",
        { harnessId },
        { source: "inputs", cause: error instanceof Error ? error : undefined }
      );
    }
    const policy = compileInvocationPolicy(config, {
      ...request,
      skillPaths: stagedSkills.skillPaths,
      autoSkillPaths: stagedSkills.autoSkillPaths
    });
    await traceInvocationCapabilities(input.onTrace, adapter.descriptor, config, request, policy);
    assertInvocationPolicySupported(adapter.descriptor, policy);
    if (context.role === "leader" && (input.mcpRows?.length ?? 0) > 0) {
      throw new HarnessRuntimeError(
        "HARNESS_CONTRACT_VIOLATION",
        "Leader resident cannot receive delivery MCP rows",
        { harnessId },
        { source: "runtime" }
      );
    }
    if (request.permission !== "yolo" && (input.mcpRows?.length ?? 0) > 0) {
      throw new HarnessRuntimeError(
        "HARNESS_CONFIGURATION_INVALID",
        "Non-yolo resident collaboration accepts only MCP servers explicitly selected in the Agent configuration",
        {
          harnessId,
          permission: request.permission,
          unconfiguredMcpNames: (input.mcpRows ?? []).map((row) => row.name)
        },
        { source: "runtime" }
      );
    }
    const inlineInbox = await fs.readFile(inputs.inboxPath, "utf8");
    const prompt = fitContextInjection(compileWorkflowPrompt(request, inputs, policy, { inlineInbox }),
      agentContextWindow(config), [], policy.constraintPrompt).prompt;

    // Every resident execution needs a durable boundary even when the Agent's
    // ordinary one-shot preference is ephemeral.
    const durableRequest: AgentRunRequest = {
      ...request,
      project: {
        ...request.project,
        agents: {
          ...request.project.agents,
          [request.agent]: { ...config, sessionPersistence: true }
        }
      },
      skillPaths: stagedSkills.skillPaths,
      autoSkillPaths: stagedSkills.autoSkillPaths
    };
    const adapterRequest = adapterVisibleRequest(
      durableRequest,
      inputs,
      adapter.descriptor,
      {
        ...input.launchRoute,
        sourceProtocol: adapter.descriptor.nativeProtocol,
        targetProtocol: adapter.descriptor.nativeProtocol
      }
    );
    let preparedSession = await this.sessions
      .prepare(adapter, adapterRequest, inputs)
      .catch((error: unknown) => {
        throw normalizeHarnessRuntimeError(error, adapter.descriptor.id);
      });
    let recoverySourceSessionId: string | undefined;
    if (this.residentRecoveryStrategy(harnessId, request.project.orchestration?.schemaVersion) === "durable-rehydrate" && preparedSession.resumed) {
      recoverySourceSessionId = preparedSession.session.nativeId;
      const replacement = await this.sessions.replace(
        adapter,
        adapterRequest,
        inputs,
        preparedSession.session,
        "Resident protocol requires explicit durable rehydrate into a new native Session"
      ).catch((error: unknown) => {
        throw normalizeHarnessRuntimeError(error, adapter.descriptor.id);
      });
      preparedSession = {
        ...replacement,
        session: { ...replacement.session, resumedAt: new Date().toISOString() }
      };
    }
    const session = preparedSession.session;
    if (!session.durable) {
      throw new HarnessRuntimeError(
        "HARNESS_CONTRACT_VIOLATION",
        "Resident collaboration requires a durable SessionRef",
        { harnessId },
        { source: "runtime" }
      );
    }
    const spec: InvocationSpec = {
      invocationId: request.invocationId,
      harnessId,
      purpose: "workflow",
      model: config.model,
      prompt,
      inputs,
      policy,
      session,
      durableSession: true
    };

    const contextReadRoots = (await Promise.all([
      path.join(inputs.projectPath, "runtime", "project-context"), path.join(inputs.projectPath, "messages")
    ].map(async directory => await fs.stat(directory).then(stat => stat.isDirectory() ? directory : undefined).catch(() => undefined))))
      .filter((directory): directory is string => Boolean(directory));
    const filesystemAuthority = await compileFilesystemAuthority({
      ...(request.worktreeClosing ? { restrictedWorktreeClosing: { agentId: request.agent, scope: request.worktreeClosing } } : {}),
      ...(request.terminalPushObservation ? { terminalPushObservation: true } : {}),
      ...(request.terminalPushCoordination ? { terminalPushCoordination: true } : {}),
      permission: request.permission,
      role: context.role,
      gitEnabled: request.project.git?.enabled === true,
      directBase: request.gitDirectBase ?? (context.groupRunId ? `groups/${context.groupRunId}` : "main"),
      serviceUserRoot: input.filesystemAuthorityInput.serviceUserRoot,
      ...(context.role === "leader" ? {
        executionWorktree: inputs.workspacePath,
        ...(inputs.workflowAuthoringPath ? { managementWriteRoot: path.dirname(inputs.workflowAuthoringPath) } : {})
      } : {
        executionWorktree: inputs.workspacePath,
        ownedMemoryPath: inputs.memoryPath
      }),
      ...(input.filesystemAuthorityInput.projectWorktreeRoot
        ? { projectWorktreeRoot: input.filesystemAuthorityInput.projectWorktreeRoot }
        : {}),
      ...(input.filesystemAuthorityInput.projectWorktrees
        ? { projectWorktrees: input.filesystemAuthorityInput.projectWorktrees }
        : {}),
      protectedRoots: input.filesystemAuthorityInput.protectedRoots,
      inputReadRoots: [inputs.projectPath, path.dirname(inputs.inboxPath), ...contextReadRoots,
        ...(inputs.workflowCurrentPath ? [path.dirname(path.dirname(inputs.workflowCurrentPath))] : []),
        ...(inputs.workflowReadDirectory ? [inputs.workflowReadDirectory] : []),
        ...(inputs.userInputsPath ? [inputs.userInputsPath] : [])]
    });
    const filesystemMcp = input.filesystemMcp ?? (filesystemAuthority.gitCapability === "none"
      ? undefined
      : await prepareGitWorktreeMcp({
          authority: filesystemAuthority,
          executionRuntimePath: input.executionRuntimePath
        }));
    const facadeFixedMcpToken = policy.mcpServers.some(isFixedMcpServer)
      ? fixedMcpToken()
      : undefined;
    if (policy.mcpServers.some(isFixedMcpServer) && !facadeFixedMcpToken) {
      throw new HarnessRuntimeError(
        "HARNESS_CONFIGURATION_INVALID",
        "A selected system MCP requires its server credential",
        { harnessId },
        { source: "runtime" }
      );
    }
    const mcpRows = mergeResidentMcpRows(
      policy.mcpServers.map((server): ResidentMcpRow => ({
        name: server.name,
        namespace: server.name,
        transport: "streamable-http",
        url: server.url,
        ...(isFixedMcpServer(server) && facadeFixedMcpToken
          ? { headers: { Authorization: `Bearer ${facadeFixedMcpToken}` } }
          : {})
      })),
      input.mcpRows ?? []
    );
    const facadeHostEnvironment = buildInvocationEnvironment({ common: {} });
    const commonEnvironment = residentAuthorityEnvironment(
      request,
      inputs,
      adapter.descriptor,
      input.launchRoute,
      this.options,
      facadeHostEnvironment,
      facadeFixedMcpToken
    );
    const processBinding = {
      scopeId: residentScopeId(context),
      role: context.role,
      harnessId,
      runtimePath: input.executionRuntimePath,
      workspacePath: inputs.workspacePath,
      signal,
      recoveryBudget: new InvocationRecoveryController(
        input.recoveryMaxAttempts ?? this.options.invocationRecoveryMaxAttempts
      ),
      session: () => session,
      route: { ...input.launchRoute },
      commonEnvironment,
      authorityEnvironment: commonEnvironment,
      hostHome: filesystemAuthority.serviceUserRoot,
      natureFigureConfigPath: selectedNatureFigureConfig(request, spec)
    };
    return {
      request: adapterRequest,
      spec,
      session,
      launchRoute: { ...input.launchRoute },
      filesystemAuthority,
      mcpRows,
      ...(facadeFixedMcpToken ? { fixedMcpToken: facadeFixedMcpToken } : {}),
      ...(filesystemMcp ? { filesystemMcp } : {}),
      ...(input.controlMcp ? { controlMcp: input.controlMcp } : {}),
      executionRuntimePath: input.executionRuntimePath,
      processBinding,
      ...(input.sameEpochReopen ? { sameEpochReopen: input.sameEpochReopen } : {}),
      ...(input.unstartedSession ? { unstartedSession: input.unstartedSession } : {}),
      turnAuthority: input.turnAuthority,
      signal,
      onTrace: input.onTrace,
      ...(input.onFrame ? { onFrame: input.onFrame } : {}),
      ...(recoverySourceSessionId ? { recoverySourceSessionId } : {}),
      publishDurableSession: async (nativeSession, legacyId) => {
        if (request.onDurableSessionStarted) {
          await request.onDurableSessionStarted(nativeSession, legacyId);
          return;
        }
        await request.onSessionStarted?.(nativeSession);
        await request.onThreadStarted?.(legacyId);
      }
    };
  }

  async prepareAndOpenResidentScope(
    input: PrepareResidentScopeRequest
  ): Promise<ResidentScopeOpenResult> {
    return this.openResidentScope(await this.prepareResidentScope(input));
  }

  async openResidentScope(input: ResidentScopeOpenRequest): Promise<ResidentScopeOpenResult> {
    const context = input.request.executionContext;
    if (!context) {
      throw new HarnessRuntimeError(
        "HARNESS_CONTRACT_VIOLATION",
        "Resident Harness open requires a collaboration execution context",
        {},
        { source: "runtime" }
      );
    }
    const config = input.request.project.agents[input.request.agent];
    const harnessId = input.spec.harnessId;
    if (!config || config.harness !== harnessId ||
      input.processBinding.scopeId !== residentScopeId(context)) {
      throw new HarnessRuntimeError(
        "HARNESS_CONTRACT_VIOLATION",
        "Resident Harness open does not match the locked Agent collaboration scope",
        { harnessId },
        { source: "runtime" }
      );
    }
    const adapter = this.registry.adapter(harnessId, "workflow");
    const executable = await resolveAdapterExecutable(adapter);
    if (!executable) {
      throw new HarnessRuntimeError(
        "HARNESS_UNAVAILABLE",
        `Harness ${harnessId} is locked for this project but its executable is unavailable`,
        { harnessId }
      );
    }
    // Same-task supplements retain the logical business epoch. The trusted
    // grant must be current before native launch and again before registration;
    // the Agent, not this boundary, supplies all missing task/tool results.
    if (input.sameEpochReopen) {
      if (context.role !== "delivery") throw new HarnessRuntimeError("HARNESS_CONTRACT_VIOLATION",
        "Resident supplemental reopen requires its original delivery role", {}, { source: "runtime" });
      input.signal.throwIfAborted();
      await input.sameEpochReopen.revalidate();
      input.signal.throwIfAborted();
    }
    const opened = await openBuiltinResidentAdapter({
      ...input,
      adapter,
      executable,
      processHost: this.processHost,
      inactivityPolicy: {
        modelTimeoutMs: this.options.residentModelInactivityTimeoutMs ??
          DEFAULT_RESIDENT_MODEL_INACTIVITY_TIMEOUT_MS,
        toolTimeoutMs: this.options.residentToolInactivityTimeoutMs ??
          DEFAULT_RESIDENT_TOOL_INACTIVITY_TIMEOUT_MS
      }
    });
    const ownershipEpoch = context.role === "leader"
      ? context.coordinatorEpoch
      : context.ownershipEpoch;
    try {
      const initializedSession = opened.driver.session;
      const validation = validateSessionRef(initializedSession);
      if (!validation.valid ||
        initializedSession.harnessId !== harnessId ||
        initializedSession.adapterVersion !== adapter.descriptor.adapterVersion ||
        initializedSession.generation !== input.session.generation ||
        initializedSession.durable !== true ||
        !adapterAcceptsNativeSession(adapter, initializedSession.nativeId)) {
        throw new HarnessRuntimeError(
          "HARNESS_CONTRACT_VIOLATION",
          `${adapter.descriptor.label} initialized an invalid resident Session identity`,
          { harnessId, sessionGeneration: initializedSession.generation },
          { source: "adapter" }
        );
      }
      if (input.session.resumedAt && opened.evidence.recoveryStrategy === "native-session-resume" &&
        initializedSession.nativeId !== input.session.nativeId) {
        throw new SessionResumeError(harnessId, input.session.nativeId, {
          cause: new Error(
            `${adapter.descriptor.label} resumed an unexpected resident Session identity`
          )
        });
      }
      await input.publishDurableSession?.(
        initializedSession,
        adapterLegacySessionId(adapter, initializedSession)
      );
      const lease = await this.residentLeases.open({
        executionId: residentScopeId(context),
        harnessId,
        ownershipEpoch,
        role: context.role,
        runtimePath: input.executionRuntimePath,
        workspacePath: input.spec.inputs.workspacePath,
        ...(opened.unstartedReservation ? { unstartedReservation: true as const } : {}),
        ...(input.sameEpochReopen ? { sameEpochReopen: input.sameEpochReopen } : {}),
        driver: opened.driver
      });
      return { lease, evidence: opened.evidence };
    } catch (error) {
      await opened.driver.close().catch(async () => {
        await Promise.resolve(opened.driver.forceClose?.());
      });
      throw error;
    }
  }

  /** Business-name alias retained for scheduler/integration call sites. */
  openResidentExecution(input: ResidentScopeOpenRequest): Promise<ResidentScopeOpenResult> {
    return this.openResidentScope(input);
  }

  async submitResidentTurn(
    authority: ResidentLeaseAuthority,
    turn: ResidentTurn,
    /** Exact fresh per-turn control/request snapshot; never the open-time callback closure. */
    request: AgentRunRequest
  ): Promise<{ lease: ResidentProcessLease; result: AgentRunResult }> {
    const submitted = await this.residentLeases.submit(authority, turn);
    if (request.invocationId !== turn.invocationId ||
      request.project.agents[request.agent]?.harness !== authority.harnessId) {
      throw new HarnessRuntimeError(
        "HARNESS_CONTRACT_VIOLATION",
        "Resident turn validation request does not match the lease authority",
        { harnessId: authority.harnessId, invocationId: turn.invocationId },
        { source: "runtime" }
      );
    }
    const adapter = this.registry.adapter(authority.harnessId, "workflow");
    const result = this.validateResidentTurnResult(submitted.result, request);
    if (result.threadId !== undefined &&
      result.threadId !== submitted.lease.session.nativeId &&
      result.threadId !== adapterLegacySessionId(adapter, submitted.lease.session)) {
      throw new HarnessRuntimeError(
        "HARNESS_CONTRACT_VIOLATION",
        `${adapter.descriptor.label} changed its resident Session identity during a turn`,
        { harnessId: authority.harnessId, invocationId: turn.invocationId },
        { source: "adapter" }
      );
    }
    return { lease: submitted.lease, result };
  }

  waitResident(authority: ResidentLeaseAuthority): Promise<ResidentProcessLease> {
    return this.residentLeases.wait(authority);
  }

  pauseResident(authority: ResidentLeaseAuthority): Promise<ResidentProcessLease> {
    return this.residentLeases.pause(authority);
  }

  resumeResident(authority: ResidentLeaseAuthority): Promise<ResidentProcessLease> {
    return this.residentLeases.resume(authority);
  }

  probeResident(authority: ResidentLeaseAuthority): Promise<ResidentProcessLease> {
    return this.residentLeases.probe(authority);
  }

  closeResident(authority: ResidentLeaseAuthority): Promise<ResidentProcessLease> {
    return this.residentLeases.close(authority);
  }

  reconcileResidentStartup(
    request: ResidentStartupReconcileRequest
  ): Promise<ResidentStartupReconcileResult> {
    return this.residentLeases.reconcileStartup(request);
  }

  /** Startup diagnostics use Catalog metadata and never launch a CLI side channel. */
  async defaultHarnessVersion(): Promise<string> {
    const catalog = await this.registry.publicCatalog();
    const entry = catalog.find((item) => item.default) ?? catalog[0];
    if (!entry) return "Harness unavailable";
    if (!entry.available) return `${entry.label} unavailable`;
    return `${entry.label} adapter ${entry.adapterVersion}`;
  }

  async openSiiBinding(request: AgentRunRequest, signal: AbortSignal, filesystem?: SiiFilesystemInput,
    preparedInputs?: Pick<InvocationInputs, "memoryPath">): Promise<SiiMcpBinding | undefined> {
    if (!this.options.siiExperiments || !canUseSiiExperiments(request)) return undefined;
    // Compile against the same staged memory/root contract as the native
    // broker. First-use business memory may need its existing staging path.
    const inputs = preparedInputs ?? await prepareInvocationInputs(request, this.options.resolveProjectWorkspace);
    return this.options.siiExperiments.bind(request, signal,
      filesystem ? { ...filesystem, ownedMemoryPath: inputs.memoryPath } : undefined);
  }

  async run(
    request: AgentRunRequest,
    onTrace: TraceSink,
    signal: AbortSignal
  ): Promise<AgentRunResult> {
    if (request.worktreeClosing !== undefined || request.control?.worktreeClosing !== undefined) {
      throw new HarnessRuntimeError("HARNESS_CONTRACT_VIOLATION", "Worktree closing must use its retained resident lifecycle");
    }
    const binding = await this.openSiiBinding(request, signal);
    if (!binding) return this.runOnce(request, onTrace, signal);
    const priorPublish = request.onDurableSessionStarted;
    const priorOfficial = request.onOfficialHarnessEvent;
    const priorNativeInput = request.onNativeUserInput;
    let current: AgentRunRequest = { ...request, siiMcp: { url: binding.url }, sessionContinuity: "strict",
      onNativeUserInput: async (event, session) => {
        await priorNativeInput?.(event, session);
        await binding.observeNativeNotification(event, session);
      },
      onOfficialHarnessEvent: async event => {
        await priorOfficial?.(event, binding.session);
        await binding.observeNativeResult(event, binding.session);
        await binding.observeNativeNotification(event, binding.session);
      },
      onDurableSessionStarted: async (session, legacyId) => {
        binding.session = session;
        await priorPublish?.(session, legacyId);
        if (!priorPublish) { await request.onSessionStarted?.(session); await request.onThreadStarted?.(legacyId); }
      } };
    const sessionKey = request.taskSessionId;
    binding.session = (sessionKey ? request.project.taskSessionRefs?.[sessionKey] : undefined) ?? request.project.agentSessions?.[request.agent];
    try {
      const selectedHarness = request.project.agents[request.agent]?.harness;
      const selectedAdapter = selectedHarness ? this.registry.adapter(selectedHarness, "workflow") : undefined;
      const readNativeNotification = selectedAdapter?.readNativeNotification?.bind(selectedAdapter);
      if (readNativeNotification) {
        binding.readNativeNotification = ({ text, session }) => readNativeNotification({
          projectPath: request.projectPath, workspacePath: request.workspacePath, agentId: request.agent, session, notification: text });
      }
      // Restart recovery waits for the retained experiment before invoking a model.
      let notification = await binding.wait(undefined, onTrace);
      let notificationTurn = 0;
      for (;;) {
        if (notification && binding.session) {
          const session = { ...binding.session, resumedAt: new Date().toISOString() };
          current = { ...current, siiResumePrompt: notification, resumeThreadId: session.nativeId,
            project: { ...current.project, agentSessions: { ...current.project.agentSessions, [request.agent]: session },
              ...(sessionKey ? { taskSessionRefs: { ...current.project.taskSessionRefs, [sessionKey]: session } } : {}) } };
          await binding.beginResume();
        }
        binding.activate(current);
        const result = await this.runOnce(current, onTrace, signal, notification ? `sii-${++notificationTurn}` : undefined);
        notification = await binding.wait(result.handoff, onTrace);
        if (!notification) { await binding.assertTaskComplete(); await binding.clearWait(); return result; }
      }
    } finally { binding.close(); }
  }

  private async runOnce(
    request: AgentRunRequest,
    onTrace: TraceSink,
    signal: AbortSignal,
    eventScope?: string
  ): Promise<AgentRunResult> {
    if (request.executionContext) {
      throw new HarnessRuntimeError(
        "HARNESS_CONTRACT_VIOLATION",
        "Collaboration execution must use the resident Harness lifecycle",
        { invocationId: request.invocationId },
        { source: "runtime" }
      );
    }
    if (signal.aborted) {
      throw new HarnessRuntimeError("INVOCATION_INTERRUPTED", "Agent invocation was cancelled before start");
    }
    // Freeze all process-global inputs before any Adapter hook (including
    // resolveExecutable/createSession) can run.
    const facadeHostEnvironment = buildInvocationEnvironment({ common: {} });
    const facadeHostHome = process.env.HOME || os.homedir();
    const config = request.project.agents[request.agent];
    if (!config) {
      throw new HarnessRuntimeError(
        "HARNESS_CONFIGURATION_INVALID",
        `Agent ${request.agent} is missing from the project runtime snapshot`,
        { agent: request.agent },
        { source: "runtime" }
      );
    }
    const facadeFixedMcpToken = config.mcpServers.some(isFixedMcpServer)
      ? fixedMcpToken()
      : undefined;
    const harnessId = config.harness;
    if (!harnessId) {
      throw new HarnessRuntimeError(
        "HARNESS_CONFIGURATION_INVALID",
        `Agent ${request.agent} has no locked Harness in the project snapshot`,
        { agent: request.agent },
        { source: "runtime" }
      );
    }
    const purpose = request.purpose ?? "workflow";
    const adapter = this.registry.adapter(harnessId, purpose);
    const executable = await resolveAdapterExecutable(adapter);
    if (!executable) {
      throw new HarnessRuntimeError(
        "HARNESS_UNAVAILABLE",
        `Harness ${harnessId} is locked for this project but its executable is unavailable`,
        { harnessId }
      );
    }
    let inputs = await this.prepareAgentContext(request, await prepareInvocationInputs(request, this.options.resolveProjectWorkspace));
    await prepareComputeRuntime({
      permission: request.permission,
      workspacePath: inputs.workspacePath,
      runtimePath: inputs.runtimePath
    }, this.options);
    let stagedSkills: Awaited<ReturnType<typeof stageInvocationSkills>>;
    let invocationFailed = false;
    try {
      stagedSkills = await stageInvocationSkills(
        request.skillPaths,
        request.autoSkillPaths ?? [],
        request.project.git?.enabled ? path.dirname(inputs.inboxPath) : inputs.workspacePath,
        request.availableSkillPaths,
        request.agent
      );
    } catch (error) {
      throw new HarnessRuntimeError(
        "INVOCATION_INPUT_STAGING_FAILED",
        "Unable to stage selected Skills inside the project workspace",
        { harnessId },
        {
          source: "inputs",
          cause: error instanceof Error ? error : undefined
        }
      );
    }
    const policy = compileInvocationPolicy(config, {
      ...request,
      skillPaths: stagedSkills.skillPaths,
      autoSkillPaths: stagedSkills.autoSkillPaths
    });
    await traceInvocationCapabilities(onTrace, adapter.descriptor, config, request, policy);
    assertInvocationPolicySupported(adapter.descriptor, policy);
    let inlineInbox = await fs.readFile(inputs.inboxPath, "utf8");
    const sessionRequest = adapterVisibleRequest(request, inputs, adapter.descriptor);
    const preparedSession = await this.sessions
      .prepare(adapter, sessionRequest, inputs)
      .catch((error: unknown) => {
        throw normalizeHarnessRuntimeError(error, adapter.descriptor.id);
      });
    inputs = { ...inputs, contextIndex: await this.contextIndexes.delivery(inputs.contextIndex, inputs.projectPath, request.agent, preparedSession.session) };
    if (inputs.additionalContextIndexes?.length) {
      const views: AgentContextIndex[] = [];
      for (const index of inputs.additionalContextIndexes) {
        const view = (await this.contextIndexes.delivery(index, inputs.projectPath, request.agent, preparedSession.session))!;
        views.push(view);
      }
      inputs = { ...inputs, additionalContextIndexes: views };
    }
    const prompt = fitContextInjection(compileWorkflowPrompt(request, inputs, policy, {
      inlineInbox,
      ...(preparedSession.replaced
        ? {
            recoveryNote: sessionRecoveryNote(
              preparedSession.resumeFailure?.reason ??
                "The previous native Session could not be resumed."
            )
          }
        : {})
    }), agentContextWindow(config), [], policy.constraintPrompt).prompt;
    if (preparedSession.resumeFailure) {
      await onTrace("status", "Session resume failed; created a replacement in the same Harness", {
        diagnostic: true,
        diagnosticSource: "adapter",
        harness: harnessId,
        errorCode: preparedSession.resumeFailure.code,
        replacementGeneration: preparedSession.session.generation,
        previousHarnessId: preparedSession.resumeFailure.previousHarnessId,
        reason: preparedSession.resumeFailure.reason
      });
    }
    let spec: InvocationSpec = {
      invocationId: request.invocationId,
      harnessId,
      purpose,
      model: config.model,
      prompt,
      inputs,
      policy,
      session: preparedSession.session,
      durableSession: preparedSession.session.durable
    };
    let observedWorkflowSession: SessionRef | undefined;
    let pendingWorkflowInput: { event: HarnessEvent; inputId: string } | undefined;
    let workflowInputId = "";
    let workflowSupplement = "";
    const supplementaryIndexes: AgentContextIndex[] = [];
    const observeWorkflowSession = async (session: SessionRef): Promise<void> => {
      if (!session.durable || !adapterAcceptsNativeSession(adapter, session.nativeId)) return;
      observedWorkflowSession = structuredClone(session);
      if (pendingWorkflowInput) {
        const pending = pendingWorkflowInput; pendingWorkflowInput = undefined;
        await request.onWorkflowAdjustmentInputReceived?.(pending.event as unknown as Record<string, unknown>, structuredClone(session), pending.inputId);
      }
    };
    const prepareNativeInput = request.onPrepareWorkflowAdjustmentInput ? async (prompt: string): Promise<string> => {
      signal.throwIfAborted();
      const candidate = observedWorkflowSession ?? spec.session;
      const expectedSession = candidate?.durable && adapterAcceptsNativeSession(adapter, candidate.nativeId) ? structuredClone(candidate) : undefined;
      workflowInputId = `native-input:${randomUUID()}`;
      workflowSupplement = await request.onPrepareWorkflowAdjustmentInput!({ inputId: workflowInputId,
        publishContext: async sources => {
          const index = await this.publishContextIndex({ projectId: request.project.id, projectPath: inputs.projectPath, inboxPath: inputs.inboxPath, sources });
          if (index) {
            supplementaryIndexes.push(index);
            inputs.contextBackgrounds ??= [];
            inputs.contextBackgrounds.push({ text: index.preview, alternatives: [index.compactPreview, index.minimalPreview] });
          }
          return index?.preview ?? "";
        },
        ...(expectedSession ? { expectedSession } : {}) });
      if (typeof workflowSupplement !== "string") throw new HarnessRuntimeError("HARNESS_CONTRACT_VIOLATION", "Workflow input supplement must be text");
      signal.throwIfAborted();
      return workflowSupplement ? `${workflowSupplement}\n\n${prompt}` : prompt;
    } : undefined;
    const publishedDurableSessions = new Map<string, {
      nativeId: string;
      legacyId: string;
    }>();
    const validatePublishedSession = (session: SessionRef): void => {
      const structural = validateSessionRef(session);
      const expected = spec.session!;
      if (
        !structural.valid ||
        session.harnessId !== harnessId ||
        session.adapterVersion !== adapter.descriptor.adapterVersion ||
        session.generation !== expected.generation ||
        session.durable !== expected.durable ||
        !session.nativeId.trim() ||
        !adapterAcceptsNativeSession(adapter, session.nativeId)
      ) {
        throw new HarnessRuntimeError(
          "HARNESS_CONTRACT_VIOLATION",
          `${adapter.descriptor.label} returned an invalid native Session identity`,
          {
            harnessId,
            sessionGeneration: session.generation
          },
          { source: "adapter" }
        );
      }
      if (expected.resumedAt && session.nativeId !== expected.nativeId) {
        throw new SessionResumeError(harnessId, expected.nativeId, {
          cause: new Error(
            `${adapter.descriptor.label} resumed an unexpected native Session identity`
          )
        });
      }
    };
    const legacySessionId = (session: SessionRef): string =>
      adapterLegacySessionId(adapter, session);
    const publishDurableSession = async (session: SessionRef): Promise<void> => {
      if (!session.durable) return;
      validatePublishedSession(session);
      const legacyId = legacySessionId(session);
      const key = [
        session.harnessId,
        session.adapterVersion,
        session.generation
      ].join("\0");
      const published = publishedDurableSessions.get(key);
      if (published) {
        if (published.nativeId === session.nativeId && published.legacyId === legacyId) return;
        throw new HarnessRuntimeError(
          "HARNESS_CONTRACT_VIOLATION",
          `${adapter.descriptor.label} changed its durable Session identity during one generation`,
          { harnessId, sessionGeneration: session.generation },
          { source: "adapter" }
        );
      }
      const identity = { nativeId: session.nativeId, legacyId };
      publishedDurableSessions.set(key, identity);
      try {
        if (request.onDurableSessionStarted) {
          await request.onDurableSessionStarted(session, legacyId);
        } else {
          // Compatibility for non-Orchestrator callers. Production persistence
          // supplies the combined callback above and never observes half-state.
          await request.onSessionStarted?.(session);
          await request.onThreadStarted?.(legacyId);
        }
      } catch (error) {
        if (publishedDurableSessions.get(key) === identity) {
          publishedDurableSessions.delete(key);
        }
        throw error;
      }
    };
    // Most Adapters allocate their stable native ID before launch. Persist
    // that intent before the process starts so a service restart can attempt
    // a real resume. Codex's pending placeholder is deliberately invalid and
    // is published by its Adapter only after validated thread.started.
    if (
      preparedSession.session.durable &&
      adapterAcceptsNativeSession(adapter, preparedSession.session.nativeId)
    ) {
      await publishDurableSession(preparedSession.session);
    }
    const recoveryBudget = new InvocationRecoveryController(
      this.options.invocationRecoveryMaxAttempts
    );
    const bufferedResponseCache = new Map<string, Promise<BufferedProtocolResponse>>();
    let pendingCanonicalTraces: HarnessEvent[] = [];
    let eventIngress!: CanonicalEventIngress;
    const route = await openInvocationModelRoute(
      adapter.descriptor,
      request,
      onTrace,
      signal,
      {
        protocolProxyFactory: this.options.protocolProxyFactory,
        ...(this.options.protocolProxyTimeoutMs !== undefined
          ? { protocolProxyTimeoutMs: this.options.protocolProxyTimeoutMs }
          : {}),
        validateGatewayTarget: this.options.validateGatewayTarget,
        bufferedResponseCache,
        ...(adapter.descriptor.capabilities.assistantStreaming === "proxy-visible-output"
          ? { onVisibleAssistantDelta: (text: string) => eventIngress.acceptProxyDelta(text) }
          : {})
      }, this.options.resolveNativeCodexProfile
    );
    let adapterRequest: HarnessAdapterRequest = adapterVisibleRequest(
      request,
      inputs,
      adapter.descriptor,
      route
    );
    // Compile one authoritative environment from the pre-Adapter host snapshot.
    // A failed resume must not let that Adapter mutate process.env and establish
    // a new authority snapshot for its replacement attempt.
    const commonEnvironment = invocationAuthorityEnvironment(
      request,
      inputs,
      adapter.descriptor,
      route,
      this.options,
      facadeHostEnvironment,
      facadeFixedMcpToken
    );
    const natureFigureConfigPath = selectedNatureFigureConfig(request, spec);
    const createInvocationProcessHost = (): InvocationProcessHost => {
      return this.processHost.forInvocation({
        invocationId: request.invocationId,
        harnessId,
        runtimePath: inputs.runtimePath,
        workspacePath: inputs.workspacePath,
        signal,
        recoveryBudget,
        session: () => spec.session!,
        route: modelRouteBinding(route),
        commonEnvironment,
        authorityEnvironment: commonEnvironment,
        hostHome: facadeHostHome,
        natureFigureConfigPath
      });
    };
    let invocationProcessHost = createInvocationProcessHost();
    eventIngress = createCanonicalEventIngress({
      descriptor: adapter.descriptor,
      invocationId: request.invocationId,
      eventScope,
      onActivity: request.onModelActivity,
      publish: async (canonicalEvent) => {
        await request.onOfficialHarnessEvent?.(
          canonicalEvent as unknown as Record<string, unknown>
        );
        await request.onLiveHarnessEvent?.(
          canonicalEvent as HarnessEvent & Record<string, unknown>
        );
        if (canonicalEvent.kind === "assistant.delta") return;
        // Keep all canonical history attempt-local until the Adapter and
        // protocol route both succeed. Tool events remain visible through the
        // live snapshot, while replacement Sessions can discard the failed
        // attempt without leaking it into durable history.
        pendingCanonicalTraces.push(canonicalEvent);
      },
      onAttemptReset: async (attempt) => {
        pendingCanonicalTraces = [];
        await request.onHarnessAttemptReset?.(attempt);
      }
    });
    let protocolRecoveryAttempted = false;
    let resumeRecoveryAttempted = false;
    let contextRecoveryAttempted = false;
    const runCurrentAdapter = async (): Promise<AgentRunResult> => {
      try {
        const result = await this.runAdapter(
          adapter,
          adapterRequest,
          spec,
          route,
          onTrace,
          signal,
          recoveryBudget,
          invocationProcessHost,
          eventIngress.accept,
          async session => { await publishDurableSession(session); await observeWorkflowSession(session); },
          async event => {
            await request.onNativeUserInput?.(event as unknown as Record<string, unknown>, spec.session);
            if (!request.onWorkflowAdjustmentInputReceived || !workflowSupplement || event.kind !== "user.message" || !event.message?.includes(workflowSupplement)) return;
            if (observedWorkflowSession) await request.onWorkflowAdjustmentInputReceived(event as unknown as Record<string, unknown>, structuredClone(observedWorkflowSession), workflowInputId);
            else pendingWorkflowInput = { event, inputId: workflowInputId };
          },
          prepareNativeInput
        );
        const failure = route.getFailure();
        if (failure) throw proxyFailureError(failure, harnessId);
        return result;
      } catch (error) {
        const failure = route.getFailure();
        if (failure && !isProtocolToolArgumentsFailure(error)) {
          throw proxyFailureError(failure, harnessId, error);
        }
        throw error;
      }
    };
    try {
      await onTrace("status", `Starting ${adapter.descriptor.label} Adapter`, {
        harness: harnessId,
        adapterVersion: adapter.descriptor.adapterVersion,
        sessionGeneration: preparedSession.session.generation,
        sessionMode: preparedSession.session.durable
          ? preparedSession.resumed ? "resume" : preparedSession.replaced ? "replacement" : "new"
          : "ephemeral",
        diagnostic: true,
        diagnosticSource: "adapter"
      });
      let result: AgentRunResult;
      while (true) {
        try {
          result = await runCurrentAdapter();
          break;
        } catch (error) {
          await eventIngress.drain(false);
          if (signal.aborted) throw error;
          const protocolFailure = isProtocolToolArgumentsFailure(error);
          const contextFailure = error instanceof HarnessRuntimeError &&
            error.code === "MODEL_CONTEXT_LIMIT_EXCEEDED";
          if (contextFailure) {
            if (contextRecoveryAttempted) {
              throw new HarnessRuntimeError(error.code,
                "Model context window exceeded again after one Session recovery; further automatic retries are stopped",
                { ...error.details, recoveryAttempted: true, recoveryLimit: 1 },
                { source: "gateway", retryable: false, cause: error });
            }
          }
          const turnInactivityFailure =
            spec.session?.durable === true &&
            error instanceof HarnessRuntimeError &&
            error.code === "INVOCATION_TIMED_OUT" &&
            error.details.operation === "DSH session idle";
          const sessionResumeFailure = !resumeRecoveryAttempted && (
            turnInactivityFailure ||
            Boolean(spec.session?.resumedAt) && isSessionResumeFailure(error)
          );
          if (protocolFailure && protocolRecoveryAttempted) {
            throw protocolRecoveryExhaustedError(route.getFailure(), harnessId, error);
          }
          if (resumeRecoveryAttempted && (turnInactivityFailure || isSessionResumeFailure(error))) {
            throw sessionRecoveryExhaustedError(error, harnessId);
          }
          if (!protocolFailure && !sessionResumeFailure && !contextFailure) throw error;
          const retainSession = spec.session!.durable;
          // Receipts belong to the invocation, not the process. A resumed
          // Session must retain successful effects and the decision lock.
          if (!retainSession && request.control) {
            await fs.rm(request.control.stagingPath, { force: true });
          }
          if (protocolFailure) protocolRecoveryAttempted = true;
          if (sessionResumeFailure) resumeRecoveryAttempted = true;
          if (contextFailure) contextRecoveryAttempted = true;
          await eventIngress.resetAttempt();
          // Restore the server-authoritative Inbox after the failed process
          // exits, before submitting another input to the original Session.
          inputs = await this.prepareAgentContext(request, await prepareInvocationInputs(request, this.options.resolveProjectWorkspace));
          const recovered = retainSession
            ? this.sessions.resume(adapter, observedWorkflowSession ?? spec.session!)
            : await this.sessions.replace(
              adapter, sessionRequest, inputs, spec.session!,
              error instanceof Error ? error.message : "Native invocation failed"
            );
          const recoveryStrategy = retainSession ? "native-session-resume" : "ephemeral-session-replacement";
          await onTrace("status", retainSession
            ? protocolFailure
              ? "Invalid tool arguments detected; retrying once in the original Session"
              : "Native session recovery retrying the original Session"
            : "Invalid tool arguments detected; retrying once with an ephemeral replacement Session", {
            diagnostic: true,
            diagnosticSource: protocolFailure || contextFailure ? "gateway" : "adapter",
            errorCode: error instanceof HarnessRuntimeError ? error.code : "SESSION_RESUME_FAILED",
            harness: harnessId,
            sessionGeneration: recovered.session.generation,
            recoveryStrategy,
            automaticRecovery: true,
            recoveryLimit: 1
          });
          const protocolFeedback = protocolFailure
            ? protocolCorrectionFeedback(error, [config.gatewaySnapshot?.apiKey, route.token]) : "";
          const recoveryReason = contextFailure
            ? "the previous turn exceeded the model context window. This is the single context-limit recovery for the SAME invocation; continue the original task using native compaction and bounded file reads."
            : protocolFailure
              ? `the previous native Session emitted invalid JSON tool arguments. Protocol validation feedback: ${protocolFeedback}. Correct the rejected arguments and emit each tool argument as one complete JSON object without trailing text.`
              : turnInactivityFailure
                ? "the previous durable DSH turn exceeded its inactivity deadline. Continue the same task in the original Session."
                : error instanceof Error ? error.message : "the previous native turn failed.";
          const recoveryNote = [
            retainSession ? "Continue the SAME task in the SAME native Session. Retain its conversation history and completed work." : undefined,
            sessionRecoveryNote(recoveryReason),
            contextFailure
              ? "Read the Inbox, Memory.md, and referenced project files in bounded sections; preserve the canonical requirement, pending route decision, artifact catalog, and completed work."
              : undefined,
            retainSession && request.control
              ? `Already staged control actions are recorded at ${request.control.stagingPath}; inspect that record and do not repeat them.`
              : undefined
          ].filter((item): item is string => Boolean(item)).join("\n");
          spec = {
            ...spec,
            inputs,
            session: recovered.session,
            durableSession: recovered.session.durable,
            prompt: compileWorkflowPrompt(request, inputs, policy, { inlineInbox, recoveryNote })
          };
          observedWorkflowSession = retainSession ? recovered.session : undefined;
          pendingWorkflowInput = undefined;
          workflowInputId = "";
          workflowSupplement = "";
          const recoveredLegacyIds = { ...(adapterRequest.project.agentSessionIds ?? {}) };
          const recoveredLegacyId = retainSession ? legacySessionId(recovered.session) : undefined;
          if (recoveredLegacyId) recoveredLegacyIds[request.agent] = recoveredLegacyId;
          else delete recoveredLegacyIds[request.agent];
          adapterRequest = freezeRuntimeValue({
            ...adapterRequest,
            resumeThreadId: recoveredLegacyId,
            project: {
              ...adapterRequest.project,
              agentSessionIds: recoveredLegacyIds,
              agentSessions: {
                ...(adapterRequest.project.agentSessions ?? {}),
                [request.agent]: recovered.session
              },
              agentSessionMeta: {
                ...(adapterRequest.project.agentSessionMeta ?? {}),
                [request.agent]: {
                  ...(adapterRequest.project.agentSessionMeta?.[request.agent] ?? {
                    contextSeq: 0,
                    resumeFailureCount: 0
                  }),
                  generation: recovered.session.generation
                }
              },
              ...(retainSession && request.taskSessionId ? {
                taskSessionRefs: { ...(adapterRequest.project.taskSessionRefs ?? {}), [request.taskSessionId]: recovered.session },
                taskSessionIds: { ...(adapterRequest.project.taskSessionIds ?? {}), [request.taskSessionId]: recoveredLegacyId! }
              } : {})
            },
            inboxPath: inputs.inboxPath,
            projectPath: inputs.projectPath,
            workspacePath: inputs.workspacePath,
            runtimePath: inputs.runtimePath
          });
          if (adapterAcceptsNativeSession(adapter, recovered.session.nativeId)) {
            await publishDurableSession(recovered.session);
          }
          route.resetFailure();
          // The failed attempt's process capability was finalized before this
          // continuation. Give the next process a fresh lease while retaining the
          // same Facade-owned recovery budget.
          invocationProcessHost = createInvocationProcessHost();
        }
      }
      await eventIngress.drain(true);
      result = validateAdapterResult(result, request, adapter.descriptor);
      const finalSession: SessionRef = {
        ...spec.session!,
        nativeId: result.threadId || spec.session!.nativeId
      };
      const legacyId = legacySessionId(finalSession);
      if (finalSession.durable) {
        await publishDurableSession(finalSession);
        await observeWorkflowSession(finalSession);
      }
      for (const canonicalEvent of pendingCanonicalTraces) {
        await emitCanonicalTrace(canonicalEvent, onTrace);
      }
      pendingCanonicalTraces = [];
      await this.contextIndexes.acknowledge(inputs.contextIndex, inputs.projectPath, request.agent, finalSession).catch(() => undefined);
      for (const index of inputs.additionalContextIndexes ?? []) await this.contextIndexes.acknowledge(index, inputs.projectPath, request.agent, finalSession).catch(() => undefined);
      for (const index of supplementaryIndexes) await this.contextIndexes.acknowledge(index, inputs.projectPath, request.agent, finalSession).catch(() => undefined);
      return { ...result, threadId: finalSession.durable ? legacyId : undefined };
    } catch (error) {
      invocationFailed = true;
      throw error;
    } finally {
      await closeGatewayRoute(route.close, harnessId, onTrace, invocationFailed);
    }
  }

  private async runAdapter(
    adapter: HarnessAdapter,
    request: HarnessAdapterRequest,
    spec: InvocationSpec,
    route: InvocationModelRoute,
    onTrace: TraceSink,
    signal: AbortSignal,
    recoveryBudget: InvocationRecoveryController,
    processHost: InvocationProcessHost,
    onEvent: (event: HarnessEvent) => Promise<void>,
    onSessionStarted?: (session: SessionRef) => Promise<void>,
    onNativeUserInput?: (event: HarnessEvent) => Promise<void> | void,
    prepareNativeInput?: (prompt: string) => Promise<string>
  ): Promise<AgentRunResult> {
    let adapterFailed = false;
    try {
      const selectedConfig = request.project.agents[request.agent]!;
      const fitted = fitContextInjection(spec.prompt, agentContextWindow(selectedConfig), [], spec.policy.constraintPrompt);
      spec = { ...spec, prompt: fitted.prompt };
      route.setInjectionBudget?.(spec.prompt, spec.policy.constraintPrompt);
      const prepareBudgetedInput = async (prompt: string): Promise<string> => {
        const prepared = prepareNativeInput ? await prepareNativeInput(prompt) : prompt;
        const final = fitContextInjection(prepared, agentContextWindow(selectedConfig), [], spec.policy.constraintPrompt);
        route.setInjectionBudget?.(final.prompt, spec.policy.constraintPrompt);
        return final.prompt;
      };
      const recoveryView = Object.freeze(Object.defineProperties({}, {
        maxAttempts: { enumerable: true, get: () => recoveryBudget.maxAttempts },
        attemptsStarted: { enumerable: true, get: () => recoveryBudget.attemptsStarted }
      })) as Pick<InvocationRecoveryController, "maxAttempts" | "attemptsStarted">;
      return await adapter.run(Object.freeze({
        request,
        spec: freezeRuntimeValue(structuredClone(spec)),
        ...(onSessionStarted ? { onSessionStarted } : {}),
        ...(onNativeUserInput ? { onNativeUserInput } : {}),
        prepareNativeInput: prepareBudgetedInput,
        signal,
        processHost,
        recoveryBudget: recoveryView,
        onTrace,
        route: freezeRuntimeValue("nativeCodexProfileHome" in route ? modelRouteBinding(route) as import("./gateway-route.js").NativeCodexProfileBinding : {
          baseUrl: route.baseUrl,
          token: route.token,
          sourceProtocol: route.sourceProtocol,
          targetProtocol: route.targetProtocol
        }),
        onEvent
      }));
    } catch (error) {
      adapterFailed = true;
      throw normalizeHarnessRuntimeError(error, adapter.descriptor.id);
    } finally {
      try {
        await this.processHost.finalizeInvocation(processHost);
      } catch (error) {
        const normalized = normalizeHarnessRuntimeError(error, adapter.descriptor.id);
        if (!adapterFailed) throw normalized;
        // The Adapter's primary failure remains authoritative, but an
        // unawaited native process is still forcibly quiesced and observable.
        await Promise.resolve().then(() => onTrace(
          "stderr",
          "Harness Adapter left an active native process after failing",
          {
            harness: adapter.descriptor.id,
            diagnostic: true,
            diagnosticSource: "adapter",
            cleanupFailureSuppressed: true,
            errorCode: normalized.code
          }
        )).catch(() => undefined);
      }
    }
  }

  async cacheKey(input: AdapterSmokeProbeInput): Promise<AdapterSmokeProbeResult> {
    const adapter = this.registry.adapter(input.harness, "probe");
    const executable = await resolveAdapterExecutable(adapter);
    if (!executable) {
      throw new HarnessRuntimeError(
        "HARNESS_UNAVAILABLE",
        `Harness ${input.harness} executable is unavailable for smoke probe`,
        { harnessId: input.harness }
      );
    }
    const executableFingerprint = await fingerprintAdapterExecutable(adapter, executable);
    const payload = {
      harness: input.harness,
      adapterVersion: adapter.descriptor.adapterVersion,
      executableFingerprint,
      model: input.model,
      gatewayId: input.gateway.id,
      gatewayRevision: input.gateway.revision,
      gatewayProtocol: input.gateway.protocol,
      nativeProtocol: adapter.descriptor.nativeProtocol,
      routerCompatibilityVersion: PROTOCOL_ROUTER_COMPATIBILITY_VERSION,
      reasoningOptionId: input.reasoningOptionId,
      reasoningFingerprint: input.reasoning?.fingerprint
    };
    return {
      cacheKey: createHash("sha256").update(JSON.stringify(payload)).digest("hex"),
      adapterVersion: adapter.descriptor.adapterVersion,
      executableFingerprint,
      routerCompatibilityVersion: PROTOCOL_ROUTER_COMPATIBILITY_VERSION
    };
  }

  async runSmoke(
    input: AdapterSmokeProbeInput,
    signal: AbortSignal
  ): Promise<AdapterSmokeProbeResult> {
    return this.runSmokeProbe(input, signal);
  }

  private async runSmokeProbe(
    input: AdapterSmokeProbeInput,
    signal: AbortSignal
  ): Promise<AdapterSmokeProbeResult> {
    const identity = await this.cacheKey(input);
    if (signal.aborted) {
      throw new HarnessRuntimeError(
        "INVOCATION_INTERRUPTED",
        "Harness Adapter smoke probe was cancelled before start"
      );
    }
    const temporaryRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), "openfars-adapter-smoke-")
    );
    const suffix = identity.cacheKey.slice(0, 12);
    const projectId = `probe-${suffix}`;
    const agent = "probe";
    const invocationId = `probe-${suffix}-${Date.now()}`;
    const projectPath = path.join(temporaryRoot, projectId);
    const workspacePath = path.join(projectPath, "workspaces");
    const messagesPath = path.join(projectPath, "messages");
    const runtimePath = path.join(projectPath, "runtime", invocationId);
    const inboxPath = path.join(messagesPath, `0001_${invocationId}_to_${agent}.md`);
    const memoryPath = path.join(workspacePath, "Memory.md");
    const sentinelPath = path.join(workspacePath, "openfars-smoke-sentinel.txt");
    const sentinel = `OPENFARS_SMOKE_${suffix.toUpperCase()}`;
    const events: HarnessEvent[] = [];
    const forwardedTools: Array<{ count: number; forcedSentinel: boolean }> = [];
    try {
      await Promise.all([
        fs.mkdir(workspacePath, { recursive: true, mode: 0o700 }),
        fs.mkdir(messagesPath, { recursive: true, mode: 0o700 }),
        fs.mkdir(runtimePath, { recursive: true, mode: 0o700 })
      ]);
      await Promise.all([
        fs.writeFile(
          inboxPath,
          [
            "# Harness Adapter smoke probe",
            "Call the injected scienceevolve_read_smoke_sentinel tool exactly once with an empty object.",
            "Do not call read_mcp_resource, list_mcp_resources, shell, network, or write tools.",
            "After the tool succeeds, return its exact content."
          ].join("\n"),
          { encoding: "utf8", mode: 0o600 }
        ),
        fs.writeFile(memoryPath, "# Memory\n\nAdapter smoke probe.\n", {
          encoding: "utf8",
          mode: 0o600
        }),
        fs.writeFile(sentinelPath, `${sentinel}\n`, {
          encoding: "utf8",
          mode: 0o400
        })
      ]);
      const config: AgentConfig = {
        model: input.model,
        harness: input.harness,
        gatewayId: input.gateway.id,
        gatewaySnapshot: {
          id: input.gateway.id,
          name: input.gateway.name,
          url: input.gateway.url,
          apiKey: input.gateway.apiKey,
          models: [...input.gateway.models],
          modelContextWindows: { ...input.gateway.modelContextWindows },
          modelReasoning: structuredClone(input.gateway.modelReasoning ?? {}),
          ...(input.reasoning ? { reasoning: input.reasoning } : {}),
          defaultModel: input.gateway.defaultModel,
          protocol: input.gateway.protocol,
          nativeProtocol: this.registry.descriptor(input.harness, "probe").nativeProtocol,
          routeMode: this.registry.descriptor(input.harness, "probe").nativeProtocol === input.gateway.protocol
            ? "direct"
            : "proxy"
        },
        ...(input.reasoningOptionId
          ? { gatewayReasoningOption: input.reasoningOptionId }
          : {}),
        skills: [],
        autoSkills: [],
        mcpServers: [],
        instructions: [
          "This is a no-side-effect Harness Adapter smoke probe.",
          "Call the injected scienceevolve_read_smoke_sentinel tool exactly once with an empty object.",
          "Do not call read_mcp_resource, list_mcp_resources, shell, network, or write tools.",
          "Return the tool result's exact content after it completes."
        ].join(" "),
        permission: "workspace",
        webSearch: false,
        sessionPersistence: false,
        decisionBy: "agent"
      };
      const project = {
        id: projectId,
        agents: { [agent]: config },
        agentSessionIds: {},
        agentSessions: {},
        agentSessionMeta: {}
      } as unknown as ProjectState;
      const request: AgentRunRequest = {
        purpose: "probe",
        project,
        agent,
        kind: "worker",
        permission: "workspace",
        invocationId,
        inboxPath,
        projectPath,
        workspacePath,
        schemaPath: "",
        skillPaths: [],
        autoSkillPaths: [],
        availableSkillPaths: [],
        runtimePath,
        onModelActivity: () => undefined,
        onOfficialHarnessEvent: (event) => {
          if (
            event.schemaVersion === 1 &&
            typeof event.kind === "string" &&
            typeof event.eventId === "string"
          ) {
            events.push(event as unknown as HarnessEvent);
          }
        }
      };
      const result = await this.run(request, (_kind, message, data) => {
        if (message === "Protocol proxy forwarded request" && forwardedTools.length < 12) {
          forwardedTools.push({
            count: typeof data?.toolCount === "number" ? data.toolCount : -1,
            forcedSentinel: typeof data?.requiredToolName === "string" &&
              (data.requiredToolName === "scienceevolve_read_smoke_sentinel" || data.requiredToolName.endsWith("__scienceevolve_read_smoke_sentinel"))
          });
        }
      }, signal);
      const started = new Set(
        events.flatMap((event) =>
          event.kind === "tool.started" && event.tool?.callId
            ? [event.tool.callId]
            : []
        )
      );
      const completed = events.find((event) =>
        event.kind === "tool.completed" &&
        Boolean(event.tool?.callId && started.has(event.tool.callId)) &&
        event.tool?.outputPreview?.includes(sentinel)
      );
      if (!completed) {
        const noToolsAdvertised = forwardedTools.length > 0 && forwardedTools.every((item) => item.count === 0);
        const toolStarts = events.filter((event) => event.kind === "tool.started").length;
        const toolCompletes = events.filter((event) => event.kind === "tool.completed").length;
        const toolFailures = events.filter((event) => event.kind === "tool.failed").length;
        throw new HarnessRuntimeError(
          "HARNESS_EVENT_STREAM_FAILED",
          noToolsAdvertised
            ? `${input.harness} smoke probe did not advertise tools to the Gateway; check the selected model's Codex tool mode`
            : `${input.harness} smoke probe did not observe a paired official tool result containing the sentinel ` +
              `(gatewayTools=${forwardedTools.map((item) => item.count).join(",") || "unknown"}, forced=${forwardedTools.some((item) => item.forcedSentinel)}, started=${toolStarts}, completed=${toolCompletes}, failed=${toolFailures})`,
          { harnessId: input.harness, eventCount: events.length, forwardedTools, toolStarts, toolCompletes, toolFailures }
        );
      }
      if (!result.handoff?.includes(sentinel)) {
        throw new HarnessRuntimeError(
          "HARNESS_EVENT_STREAM_FAILED",
          `${input.harness} smoke probe handoff did not contain the sentinel`,
          { harnessId: input.harness }
        );
      }
      return identity;
    } finally {
      await fs.rm(temporaryRoot, { recursive: true, force: true });
    }
  }

  async runExplainer(
    input: ExplainerInvocationRequest,
    signal: AbortSignal
  ): Promise<ExplainerInvocationResult> {
    const facadeHostEnvironment = buildInvocationEnvironment({ common: {} });
    const facadeHostHome = process.env.HOME || os.homedir();
    this.assertExplainerAvailable(input.harnessId);
    const adapter = this.registry.adapter(input.harnessId, "explainer");
    let inputs = await validateStagedInvocationInputs({
      projectId: input.projectId,
      invocationId: input.invocationId,
      projectPath: input.projectPath,
      workspacePath: input.workspacePath,
      inboxPath: input.inboxPath,
      memoryPath: input.memoryPath,
      runtimePath: input.runtimePath
    });
    const agent = "__explainer__";
    const assistantServers = input.assistantMcp ? [{ name: EXPLAINER_MCP_NAME, url: input.assistantMcp.url }] : [];
    if (assistantServers.some(server => !isExplainerMcp(server)) || assistantServers.length && !adapter.descriptor.capabilities.mcp)
      throw new Error("所选 Harness 无法提供 Project Explainer 交互工具。");
    const reasoningOptionId = input.gateway.autoReasoning === false ? undefined
      : input.gateway.modelReasoning?.[input.model]?.defaultOptionId;
    const reasoning = resolveGatewayReasoning(input.gateway.modelReasoning, input.model, reasoningOptionId);
    const config = {
      model: input.model,
      harness: input.harnessId,
      gatewayId: input.gateway.id,
      ...(reasoningOptionId ? { gatewayReasoningOption: reasoningOptionId } : {}),
      gatewaySnapshot: {
        ...input.gateway,
        ...(reasoning ? { reasoning } : {}),
        nativeProtocol: adapter.descriptor.nativeProtocol,
        routeMode: adapter.descriptor.nativeProtocol === input.gateway.protocol ? "direct" as const : "proxy" as const
      },
      skills: [],
      autoSkills: [],
      mcpServers: assistantServers,
      instructions: input.prompt,
      permission: "workspace" as const,
      webSearch: false,
      sessionPersistence: true,
      decisionBy: "main" as const
    };
    const request = {
      purpose: "explainer" as const,
      project: {
        id: input.projectId,
        agents: { [agent]: config },
        agentSessionIds: {},
        agentSessions: input.session ? { [agent]: input.session } : {}
      },
      agent,
      kind: "worker" as const,
      permission: "workspace" as const,
      invocationId: input.invocationId,
      inboxPath: input.inboxPath,
      projectPath: input.projectPath,
      workspacePath: input.workspacePath,
      schemaPath: "",
      skillPaths: [],
      autoSkillPaths: [],
      availableSkillPaths: [],
      runtimePath: input.runtimePath,
      ...(input.session
        ? { resumeThreadId: adapterLegacySessionId(adapter, input.session) }
        : {}),
      onModelActivity: () => undefined,
      ...(input.onModelStreamEvent ? { onModelStreamEvent: input.onModelStreamEvent } : {}),
      ...(input.onTokenUsage ? { onTokenUsage: input.onTokenUsage } : {})
    } as unknown as AgentRunRequest;
    const sessionRequest = adapterVisibleRequest(request, inputs, adapter.descriptor);
    const preparedSession = await this.sessions
      .prepare(adapter, sessionRequest, inputs)
      .catch((error: unknown) => {
        throw normalizeHarnessRuntimeError(error, adapter.descriptor.id);
      });
    let session = preparedSession.session;
    const contextIndex = await this.contextIndexes.delivery(input.contextIndex, inputs.projectPath, agent, session);
    inputs = { ...inputs, ...(contextIndex ? { contextIndex } : {}),
      ...(input.contextBackgrounds ? { contextBackgrounds: input.contextBackgrounds } : {}) };
    let explainerPrompt = input.contextIndex && contextIndex
      ? input.prompt.split(input.contextIndex.preview).join(contextIndex.preview) : input.prompt;
    // The shared core already supplies the current question and index. Native
    // adapters must not append the entire Inbox a second time. Compatibility
    // callers can still supply quoted input through the staged Inbox once.
    if (!input.evidenceInPrompt) {
      const evidence = await fs.readFile(inputs.inboxPath, "utf8");
      if (evidence && !explainerPrompt.includes(evidence)) explainerPrompt += `\n\n<quoted-project-evidence>\n${evidence}\n</quoted-project-evidence>`;
    }
    if (preparedSession.resumeFailure) {
      await input.onTrace("status", "Explainer session resume failed; created a same-Harness replacement", {
        diagnostic: true,
        diagnosticSource: "adapter",
        harness: input.harnessId,
        errorCode: preparedSession.resumeFailure.code,
        replacementGeneration: session.generation
      });
    }
    const policy = {
      permission: "workspace" as const,
      constraintPrompt: "Project Explainer provides draft and project management. Use native Harness tools for general work and injected business tools within the user request. Read context on demand. Only Workflow-selected Skills may be loaded; this Explainer has none. Saving a draft never starts research; starting research requires an explicit business request.",
      skillPaths: [],
      autoSkillPaths: [],
      mcpServers: assistantServers,
      webSearch: false
    };
    let spec: InvocationSpec = {
      invocationId: input.invocationId,
      harnessId: input.harnessId,
      purpose: "explainer",
      model: input.model,
      prompt: fitContextInjection(explainerPrompt, agentContextWindow(config), contextReplacements(inputs), policy.constraintPrompt).prompt,
      inputs,
      policy,
      session,
      durableSession: true
    };
    const recoveryBudget = new InvocationRecoveryController(
      this.options.invocationRecoveryMaxAttempts
    );
    let eventIngress!: CanonicalEventIngress;
    // Stop this native attempt as soon as its proxy rejects malformed tool
    // arguments. The conversation signal stays live for the bounded recovery.
    let attemptController = new AbortController();
    let attemptSignal = AbortSignal.any([signal, attemptController.signal]);
    const route = await openInvocationGatewayRoute(adapter.descriptor, request, async (kind, message, data) => {
      if (kind === "stderr" && data?.errorCode === "PROTOCOL_TOOL_ARGUMENTS_INVALID") {
        attemptController.abort(new Error("Gateway returned malformed tool arguments"));
      }
      await input.onTrace(kind, message, data);
    }, signal, {
      protocolProxyFactory: this.options.protocolProxyFactory,
      validateGatewayTarget: this.options.validateGatewayTarget,
      onVisibleReasoningSummaryDelta: (text, itemId) => eventIngress.accept({
        schemaVersion: 1, eventId: `explainer-summary-${randomUUID()}`, seq: 0,
        timestamp: new Date().toISOString(), invocationId: input.invocationId, harnessId: input.harnessId,
        kind: "reasoning.summary", phase: "delta", itemId, sourceType: "proxy.reasoning_summary_text.delta", message: text
      }),
      ...(adapter.descriptor.capabilities.assistantStreaming === "proxy-visible-output"
        ? { onVisibleAssistantDelta: (text: string) => eventIngress.acceptProxyDelta(text) }
        : {})
    });
    let adapterRequest = adapterVisibleRequest(
      request,
      inputs,
      adapter.descriptor,
      route
    );
    const commonEnvironment = invocationAuthorityEnvironment(
      request,
      inputs,
      adapter.descriptor,
      route,
      this.options,
      facadeHostEnvironment,
      undefined
    );
    const natureFigureConfigPath = selectedNatureFigureConfig(request, spec);
    const createInvocationProcessHost = (): InvocationProcessHost => {
      return this.processHost.forInvocation({
        invocationId: input.invocationId,
        harnessId: input.harnessId,
        runtimePath: inputs.runtimePath,
        workspacePath: inputs.workspacePath,
        signal: attemptSignal,
        recoveryBudget,
        session: () => spec.session!,
        route: { baseUrl: route.baseUrl, token: route.token },
        commonEnvironment,
        authorityEnvironment: commonEnvironment,
        hostHome: facadeHostHome,
        natureFigureConfigPath
      });
    };
    let invocationProcessHost = createInvocationProcessHost();
    eventIngress = createCanonicalEventIngress({
      descriptor: adapter.descriptor,
      invocationId: input.invocationId,
      publish: async (event) => input.onEvent(event)
    });
    let protocolRecoveryAttempted = false;
    let resumeRecoveryAttempted = false;
    let invocationFailed = false;
    try {
      const invoke = async (): Promise<{
        result: AgentRunResult;
        finalSession: SessionRef;
      }> => {
        let result: AgentRunResult;
        try {
          result = await this.runAdapter(
            adapter,
            adapterRequest,
            spec,
            route,
            input.onTrace,
            attemptSignal,
            recoveryBudget,
            invocationProcessHost,
            eventIngress.accept
          );
          const failure = route.getFailure();
          if (failure) throw proxyFailureError(failure, input.harnessId);
        } catch (error) {
          await eventIngress.drain(false);
          const failure = route.getFailure();
          if (failure && !isProtocolToolArgumentsFailure(error)) {
            throw proxyFailureError(failure, input.harnessId, error);
          }
          throw normalizeHarnessRuntimeError(error, adapter.descriptor.id);
        }
        await eventIngress.drain(true);
        result = validateAdapterResult(result, request, adapter.descriptor);
        const nativeId = result.threadId || session.nativeId;
        if (!nativeId.trim() || !adapterAcceptsNativeSession(adapter, nativeId)) {
          throw new HarnessRuntimeError(
            "HARNESS_CONTRACT_VIOLATION",
            `${adapter.descriptor.label} returned an invalid Explainer Session identity`,
            { harnessId: input.harnessId, sessionGeneration: session.generation },
            { source: "adapter" }
          );
        }
        if (session.resumedAt && nativeId !== session.nativeId) {
          throw new SessionResumeError(input.harnessId, session.nativeId, {
            cause: new Error(
              `${adapter.descriptor.label} resumed an unexpected Explainer Session identity`
            )
          });
        }
        const finalSession = { ...session, nativeId };
        if (!validateSessionRef(finalSession).valid) {
          throw new HarnessRuntimeError(
            "HARNESS_CONTRACT_VIOLATION",
            `${adapter.descriptor.label} returned a malformed Explainer SessionRef`,
            { harnessId: input.harnessId, sessionGeneration: session.generation },
            { source: "adapter" }
          );
        }
        return { result, finalSession };
      };
      let invocation: Awaited<ReturnType<typeof invoke>>;
      while (true) {
        try {
          invocation = await invoke();
          break;
        } catch (error) {
          if (signal.aborted) throw error;
          const protocolFailure = isProtocolToolArgumentsFailure(error);
          const sessionResumeFailure = Boolean(session.resumedAt) &&
            !resumeRecoveryAttempted &&
            isSessionResumeFailure(error);
          if (protocolFailure && protocolRecoveryAttempted) {
            throw protocolRecoveryExhaustedError(route.getFailure(), input.harnessId, error);
          }
          if (!protocolFailure && !sessionResumeFailure) throw error;
          if (protocolFailure) protocolRecoveryAttempted = true;
          if (sessionResumeFailure) resumeRecoveryAttempted = true;
          await eventIngress.resetAttempt();
          const replacement = await this.sessions.replace(
            adapter,
            sessionRequest,
            inputs,
            session,
            protocolFailure
              ? "Gateway returned invalid JSON tool arguments; replacing the native Session"
              : error instanceof Error ? error.message : "Native session resume failed"
          ).catch((replacementError: unknown) => {
            throw normalizeHarnessRuntimeError(replacementError, adapter.descriptor.id);
          });
          session = replacement.session;
          spec = {
            ...spec,
            session,
            durableSession: session.durable,
            ...(protocolFailure
              ? {
                  prompt: `${spec.prompt}\n\nRecovery notice: the previous native Session emitted invalid JSON tool arguments. Continue from the current project checkpoint and emit each tool argument as one complete JSON object without trailing text. Before repeating an assistant mutation, call get_context to read the actual current revision and saved draft; preserve successful operations rather than replaying them. Split large draft edits into smaller valid merge patches with current expectedRevision and stable operationId values.`
                }
              : {})
          };
          adapterRequest = freezeRuntimeValue({
            ...adapterRequest,
            resumeThreadId: undefined,
            project: {
              ...adapterRequest.project,
              agentSessionIds: {},
              agentSessions: { [agent]: replacement.session },
              agentSessionMeta: {
                [agent]: {
                  generation: replacement.session.generation,
                  contextSeq: 0,
                  resumeFailureCount: 0
                }
              }
            }
          });
          await input.onTrace(
            "status",
            protocolFailure
              ? "Explainer received invalid tool arguments; retrying once with a same-Harness replacement Session"
              : "Explainer native session failed; retrying with a same-Harness replacement",
            {
              diagnostic: true,
              diagnosticSource: protocolFailure ? "proxy" : "adapter",
              harness: input.harnessId,
              errorCode: protocolFailure
                ? "PROTOCOL_TOOL_ARGUMENTS_INVALID"
                : "SESSION_RESUME_FAILED",
              replacementGeneration: session.generation,
              ...(protocolFailure
                ? { automaticRecovery: true, recoveryLimit: 1 }
                : {})
            }
          );
          route.resetFailure();
          attemptController = new AbortController();
          attemptSignal = AbortSignal.any([signal, attemptController.signal]);
          invocationProcessHost = createInvocationProcessHost();
        }
      }
      if (!invocation.result.handoff) {
        throw new HarnessRuntimeError(
          "HARNESS_CONTRACT_VIOLATION",
          `${input.harnessId} explainer returned no answer`,
          { harnessId: input.harnessId },
          { source: "adapter" }
        );
      }
      await this.contextIndexes.acknowledge(inputs.contextIndex, inputs.projectPath, agent, invocation.finalSession).catch(() => undefined);
      return {
        answer: invocation.result.handoff,
        session: invocation.finalSession
      };
    } catch (error) {
      invocationFailed = true;
      throw error;
    } finally {
      await closeGatewayRoute(
        route.close,
        input.harnessId,
        input.onTrace,
        invocationFailed
      );
    }
  }

  assertExplainerAvailable(harnessId: AgentHarness): void {
    const descriptor = this.registry.descriptor(harnessId, "explainer");
    if (!descriptor.capabilities.readOnlyExplainer || !descriptor.explainerIsolation) {
      throw new HarnessRuntimeError(
        "HARNESS_CAPABILITY_UNSUPPORTED",
        `${descriptor.label} does not support the Explainer purpose`,
        { harnessId, purpose: "explainer" }
      );
    }
    // General native tools use the same policy for every role. The isolated
    // product MCP still owns draft/start semantics and invocation identity.
  }

  async cleanupInterrupted(invocationId: string, runtimePath: string): Promise<void> {
    const hostResult = await Promise.allSettled([
      Promise.resolve().then(() =>
        this.processHost.cleanupInterrupted(invocationId, runtimePath)
      )
    ]);
    // Credential/config hooks run only after the host termination attempt has
    // settled. A failed host cleanup must not skip them, but they must not race
    // an in-progress process termination either.
    const adapterSteps = this.registry.adapterIds().map((harnessId) => ({
        phase: `adapter:${harnessId}`,
        run: () => {
          const adapter = this.registry.registeredAdapter(harnessId);
          return adapter.cleanupInterrupted?.(invocationId, runtimePath) ?? Promise.resolve();
        }
      }));
    const adapterResults = await Promise.allSettled(adapterSteps.map((step) =>
      Promise.resolve().then(step.run)
    ));
    const failedPhases = [
      ...(hostResult[0]?.status === "rejected" ? ["process-host"] : []),
      ...adapterResults.flatMap((result, index) =>
        result.status === "rejected" ? [adapterSteps[index]!.phase] : []
      )
    ];
    if (failedPhases.length) {
      throw new HarnessRuntimeError(
        "HARNESS_CONTRACT_VIOLATION",
        "Interrupted Harness cleanup did not complete",
        { cleanupPhases: failedPhases },
        { source: "runtime" }
      );
    }
  }

  cleanupResidentInterrupted(
    identity: ResidentProcessCleanupIdentity,
    runtimePath: string,
    options?: ResidentProcessCleanupOptions
  ): Promise<void> {
    return this.processHost.cleanupResidentInterrupted(identity, runtimePath, options);
  }
}
