import { beginWorkflowRecovery, checkpointWorkflowRecovery, finishWorkflowRecovery, hasUserWorkflowPause } from "./workflow-recovery.js";
import { legacyContextBackground } from "./context-injection-budget.js";
import { validateDisplayArtifacts } from "./display-artifact-validation.js";
import { removedWorkflowAgentTaskReason } from "./workflow-session-archive.js";
import { assertWorkflowSessionHarnesses } from "./workflow-session-compatibility.js";
import type { WorkflowAdjustmentPageInput, WorkflowAdjustmentRecord, WorkflowAdjustmentSnapshot, WorkflowConfigurationVersion } from "./workflow-adjustments.js";
import { sameWorkflowConfigurationVersion } from "./workflow-adjustments.js";
import { credentialFreeAgentConfiguration } from "./scoped-agent-configuration.js";
import { workflowAdjustmentRuntimeImpact } from "./workflow-adjustment-impact.js";
import { InvocationPerformanceTracker, recordTerminalPerformance } from "./invocation-performance.js";
import { promises as fs } from "node:fs";
import { CollaborationStateError } from "./collaboration-state/errors.js";
import { createHash, randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ZodError, type z } from "zod";
import type { AppConfig } from "./config.js";
import {
  AgentApiError,
  AgentInterruptedError
} from "./agent-errors.js";
import type { AgentLease } from "./agent-scheduler.js";
import {
  AgentQueueAbortedError,
  AgentScheduler,
  DEFAULT_AGENT_KIND_CAPACITY
} from "./agent-scheduler.js";
import type {
  ActiveAgentExecution,
  AgentConfig,
  AgentConfigMap,
  ArtifactRecord,
  CollaborationDissolutionPlan,
  CollaborationRuntimeUserInteractionLifecycle,
  ControlActionEnvelope,
  ControlMcpRequest,
  DisplaySelection,
  AgentName,
  AgentMcpServer,
  AgentProgress,
  AgentQueueSnapshot,
  AgentKind,
  AgentRunner,
  AgentRunRequest,
  AgentRunResult,
  FailureAttempt,
  InterruptionSnapshot,
  CurrentAssignment,
  MainDecision,
  AgentOrchestrationTemplate,
  ProjectComputeUsage,
  ProjectTokenUsage,
  ProjectGitState,
  ProjectUserInput,
  ProjectState,
  ProjectView,
  ThreadTokenUsageCursor,
  TraceSink,
  TokenUsageTotals,
  TimelineEvent,
  UserIntervention
} from "./types.js";
import { dissolveCollaborationGroup } from "./collaboration-dissolution.js";
import { buildAgentQueueSnapshot } from "./agent-queue-view.js";
import { readProjectGitGraph, type GitGraphPage } from "./git-graph.js";
import type { CollaborationProjectResumeOptions, CollaborationRuntimeLifecycle } from "./collaboration-runtime.js";
import { SYSTEM_CONTROLLER_ROUTE_TARGET } from "./types.js";
import { buildAgentToolCatalog } from "./agent-tool-catalog.js";
import {
  DEFAULT_MODEL_ACTIVITY_IDLE_WINDOW_MS,
  DEFAULT_TOOL_ACTIVITY_IDLE_WINDOW_MS,
  InvocationActivityTracker,
  type InvocationActivityTimeoutOptions
} from "./internal/shared/invocation-activity.js";
import {
  applyGatewayUsageReport,
  createProjectTokenUsage,
  emptyTokenUsageTotals,
  gatewayUsageReportFromData,
  isProjectTokenUsage as isSharedProjectTokenUsage,
  refreshUsageCompleteness
} from "./internal/shared/token-usage-ledger.js";
import { cancellationLabel, type CancellationRequest } from "./cancellation.js";
import { scanWorkspace, type WorkspaceFileStamp } from "./workspace-checkpoint.js";
import {
  DEFAULT_HARNESS_ID,
  type AgentProtocol
} from "./agent-runtime.js";
import {
  harnessCatalogRegistry,
  harnessSupportsNativeProfile,
  toPublicHarnessDescriptor
} from "./harness-runtime/registry.js";
import { HANDOFF_CHARACTER_LIMIT } from "./content-limits.js";
import type { HarnessEvent, SessionRef } from "./harness-runtime/contracts.js";
import {
  HarnessRuntimeError,
  harnessRecoveryDelayMs,
  transientHarnessFailure
} from "./harness-runtime/errors.js";
import {
  DEFAULT_AGENT_ORCHESTRATION_TEMPLATE,
  agentTemplateFor,
  defaultDecisionPlan,
  isConfiguredAgent,
  loopIterationCount,
  workflowAgentCandidates,
  workflowAutomaticReturnTarget,
  workflowDirectTarget,
  workflowRoutesForAgent,
  workflowTargetAllowsTasklessActivation,
  workflowRequiresMainChoice
} from "./agent-orchestration.js";
import {
  agentDefinitionFor,
  SYSTEM_CONTROLLER_AGENT,
  isSystemController
} from "./system-controller.js";
import {
  emptyProjectComputeUsage,
  isProjectComputeUsage
} from "./inspire-compute-usage.js";
import { ProjectStorage } from "./storage.js";
import { SkillCatalog } from "./skill-catalog.js";
import { agentDisplayState, agentProgressState } from "./internal/shared/project-runtime-status.js";
import { workflowProgressPercent } from "./workflow-progress.js";
import {
  BUILTIN_AGENT_PROMPTS,
  buildAgentDispatchSummary,
  buildInboxMarkdown,
  buildMainCapabilitySnapshot,
  buildMainInvocationContext,
  mainHandoffMarkdown,
  projectUserInputMarkdown,
  userInterventionResponseMarkdown,
  workerHandoffMarkdown
} from "./prompt.js";
import { MainDecisionValidationError, resolveMainDecision, validateDisplaySelection } from "./main-decision.js";
import {
  ControlActionService,
  hashControlCapability,
  readStagedControlActions,
  startControlActionBridge,
  type ControlActionBridge
} from "./orchestration-control-bridge.js";
import {
  createProjectSchema,
  defaultInstructionsForAgent,
  ensureAgentConfigInvariantsForTemplate,
  mergeAgentConfigs,
  withoutLegacyAgentProxy,
  normalizeAgentOrchestrationTemplate,
  normalizeNewGitOrchestration,
  normalizedAgentMcpServers,
  normalizedAgentSkills,
  publicAgentConfigs
} from "./validation.js";
import {
  newId,
  nowIso,
  redactTrace,
} from "./utils.js";
import {
  migrateLegacyGatewayReasoning,
  resolveGatewayReasoning
} from "./gateway-reasoning.js";
import type { GatewayStore } from "./agent-runtime.js";
import type { GitHubAccountStore } from "./github-accounts.js";
import { affectedCollaborationGroupIds } from "./workflow-reconfiguration.js";
export { affectedCollaborationGroupIds } from "./workflow-reconfiguration.js";
import {
  MAIN_AGENT_ORCHESTRATION_FILE,
  MAIN_AGENT_ORCHESTRATION_CURRENT_FILE,
  mainAgentOrchestrationDocument,
  parseAgentOrchestrationProposal,
  type AgentOrchestrationProposal
} from "./agent-orchestration-reconfiguration.js";
import {
  changedProjectSkills,
  materializeProjectSkills,
  validateProjectSkillReferences
} from "./project-skills.js";
import {
  changedProjectMcps,
  materializeProjectMcps,
  startProjectMcps,
  validateProjectMcpReferences,
  type ProjectMcpLease
} from "./project-mcp.js";

interface RuntimeProject {
  state: ProjectState;
  loop?: Promise<void>;
  controller?: AbortController;
  queueController?: AbortController;
  sleepController?: AbortController;
  mainInputRefresh?: MainInputRefreshRequest;
  cancellationFinalizing?: Promise<void>;
  /** Resolves when an active invocation receives an interrupt request. */
  interruptWaiters?: Map<string, () => void>;
  /** Ephemeral telemetry used to build a durable, credential-free checkpoint. */
  activeInvocationTelemetry?: ActiveInvocationTelemetry;
  eventQueue: Promise<void>;
}

interface ActiveInvocationTelemetry {
  invocationId: string;
  agent: AgentName;
  kind: AgentKind;
  startedAt: string;
  lastActivityAt: string;
  workspacePath?: string;
  runtimePath?: string;
  threadId?: string;
  traceTail: string[];
  activeTools: string[];
  partialOutput: string;
  partialHandoff?: string;
}

interface MainInputRefreshRequest {
  inputIds: string[];
  requestedAt: string;
  pendingWrites: number;
  writesSettled: Promise<void>;
  resolveWritesSettled: () => void;
}

interface EventDraft {
  type: TimelineEvent["type"];
  level?: TimelineEvent["level"];
  agent?: AgentName;
  message: string;
  data?: Record<string, unknown>;
}

type AgentExecutionSource = ActiveAgentExecution["source"];
type AgentExecutionOutcome =
  | "completed"
  | "failed"
  | "interrupted"
  | "cancelled"
  | "superseded";

function harnessFailureMetadata(error: Error): {
  errorCode?: HarnessRuntimeError["code"];
  errorSource?: HarnessRuntimeError["source"];
  retryable?: boolean;
} {
  if (!(error instanceof HarnessRuntimeError)) return {};
  return {
    errorCode: error.code,
    errorSource: error.source,
    retryable: error.retryable
  };
}

function arraysEqual(left: readonly string[], right: readonly string[]): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function mcpServersEqual(
  left: readonly AgentMcpServer[],
  right: readonly AgentMcpServer[]
): boolean {
  return (
    left.length === right.length &&
    left.every(
      (server, index) =>
        server.name === right[index]?.name &&
        server.url === right[index]?.url &&
        server.project === right[index]?.project
    )
  );
}

export const AGENT_ACTIVITY_IDLE_WINDOW_MS = DEFAULT_MODEL_ACTIVITY_IDLE_WINDOW_MS;
export const AGENT_TOOL_ACTIVITY_IDLE_WINDOW_MS = DEFAULT_TOOL_ACTIVITY_IDLE_WINDOW_MS;
export const WORKER_INVOCATION_FAILURE_LIMIT = 5;
export const MAIN_AUTOMATIC_RETRY_LIMIT = 1;
/** Maximum time an interrupt may wait after abort before cleanup is forced. */
export const DEFAULT_INTERRUPT_FORCE_TIMEOUT_MS = 8_000;

export { InvocationPerformanceTracker, updatedPerformanceAggregate } from "./invocation-performance.js";

export const EXECUTION_TOKEN_GRACE_MS = 0;
export const EXECUTION_TOKEN_IDLE_WINDOW_MS = AGENT_ACTIVITY_IDLE_WINDOW_MS;
export const EXECUTION_TOKEN_FINAL_FALLBACK_MS = 120 * 60_000;

interface AgentApiWatchdogConfig extends InvocationActivityTimeoutOptions {
  /** Injectable only for deterministic control-channel startup tests. */
  controlBridgeFactory?: typeof startControlActionBridge;
}

export interface AgentActivityIdleObservation {
  lastActivityAt: number;
  observedAt: number;
  idleWindowMs: number;
}

export { MainDecisionValidationError, resolveMainDecision } from "./main-decision.js";

/** The model returned prose but did not commit the required control action. */
export class ControlProtocolError extends Error {
  override name = "ControlProtocolError";
}

class MissingMainTerminalActionError extends ControlProtocolError {
  override name = "MissingMainTerminalActionError";
}

export class ProjectConfigurationLockedError extends Error {
  override name = "ProjectConfigurationLockedError";
}

type OrchestratorCollaborationRuntime = CollaborationRuntimeLifecycle &
  Partial<CollaborationRuntimeUserInteractionLifecycle>;


export class Orchestrator {
  private readonly runtimes = new Map<string, RuntimeProject>();
  private readonly deletingProjects = new Set<string>();
  private readonly scheduler: AgentScheduler;
  private queueOrderCounter = 0;
  private shuttingDown = false;
  private listingViewTail: Promise<void> = Promise.resolve();

  constructor(
    private readonly storage: ProjectStorage,
    private readonly skills: SkillCatalog,
    private readonly runner: AgentRunner,
    private readonly config: Pick<AppConfig, "retryBaseMs" | "retryMaxMs"> &
      Partial<Pick<AppConfig, "agentConcurrency" | "interruptForceTimeoutMs">> &
      AgentApiWatchdogConfig,
    private readonly gatewayStore?: GatewayStore,
    private readonly collaborationRuntime?: OrchestratorCollaborationRuntime,
    private readonly githubAccounts?: GitHubAccountStore,
    /** Trusted host lifecycle, independent of the per-create source selection. */
    private readonly hostLifecycle?: {
      beforePersist?: (context: { projectId: string; gitEnabled: boolean }) => Promise<void>;
      validateNativeCodexProfile?: (config: AgentConfig) => Promise<void>;
    }
  ) {
    this.scheduler = new AgentScheduler(
      config.agentConcurrency ?? DEFAULT_AGENT_KIND_CAPACITY
    );
  }

  async initialize(): Promise<void> {
    await this.collaborationRuntime?.initialize();
    await this.storage.initialize();
    await this.storage.recoverIncompleteCommits();
    const states = await this.storage.listStates();
    this.queueOrderCounter = Math.max(
      0,
      ...states.map((state) =>
        isValidQueueOrder(state.queueOrder) ? state.queueOrder : 0
      )
    );
    const unorderedWaiting = states
      .filter(
        (state) =>
          state.status === "queued" &&
          state.queuedAgent !== undefined &&
          state.currentAgent === undefined &&
          state.activeInvocationId === undefined &&
          state.queueEnteredAt !== undefined &&
          !isValidQueueOrder(state.queueOrder)
      )
      .sort(
        (left, right) =>
          left.queueEnteredAt!.localeCompare(right.queueEnteredAt!) ||
          left.createdAt.localeCompare(right.createdAt) ||
          left.id.localeCompare(right.id)
      );
    for (const state of unorderedWaiting) {
      state.queueOrder = this.allocateQueueOrder();
    }
    const resumable: RuntimeProject[] = [];
    for (const state of states) {
      const serialWorkflow = !state.git?.enabled
        ? await this.collaborationRuntime?.recoverSerialWorkflowConfiguration?.(state) : undefined;
      let stateShapeRepaired = serialWorkflow?.changed ?? false;
      if (!state.orchestration) {
        throw new Error(`Project ${state.id} has no orchestration configuration`);
      }
      const normalizedOrchestration = normalizeAgentOrchestrationTemplate(
        state.orchestration
      );
      if (
        JSON.stringify(state.orchestration) !==
        JSON.stringify(normalizedOrchestration)
      ) {
        state.orchestration = normalizedOrchestration;
        stateShapeRepaired = true;
      }
      const normalizedAgents = mergeAgentConfigs(
        state.agents,
        normalizedOrchestration,
        { restoreRuntimeState: true }
      );
      const readableAgents = Object.fromEntries(Object.entries(state.agents).map(([name, config]) => [name, withoutLegacyAgentProxy(config)]));
      if (JSON.stringify(readableAgents) !== JSON.stringify(normalizedAgents)) stateShapeRepaired = true;
      // Drop the obsolete field in memory; do not migrate completed project
      // files solely because their old config contains it.
      state.agents = normalizedAgents;
      if (!state.skillDefinitions) {
        state.skillDefinitions = {};
        stateShapeRepaired = true;
      }
      if (!state.mcpDefinitions) {
        state.mcpDefinitions = {};
        stateShapeRepaired = true;
      }
      validateProjectSkillReferences(state.agents, state.skillDefinitions);
      validateProjectMcpReferences(state.agents, state.mcpDefinitions);
      await materializeProjectSkills(this.storage.projectDir(state.id), state.skillDefinitions);
      await materializeProjectMcps(this.storage.projectDir(state.id), state.mcpDefinitions);
      // Every persisted project has already crossed the startup boundary.
      // Older state files predate the explicit lock fields, so repair them as
      // locked instead of silently restoring a configuration-edit window.
      if (state.configurationLocked !== true) {
        state.configurationLocked = true;
        state.lockedAt ??= state.createdAt;
        stateShapeRepaired = true;
      }
      if (state.controlProtocol !== "natural-language-tools-v1") {
        // ProjectStorage filters pre-protocol projects. Keep this guard so a
        // custom storage implementation cannot silently upgrade an old state.
        throw new Error(
          `Project ${state.id} uses an incompatible control protocol`
        );
      }
      const sessionIds = { ...(state.agentSessionIds ?? {}) };
      state.agentSessionIds = sessionIds;
      state.agentSessions = { ...(state.agentSessions ?? {}) };
      const sessionMeta = { ...(state.agentSessionMeta ?? {}) };
      for (const definition of normalizedOrchestration.agents) {
        const current = sessionMeta[definition.name];
        if (!current || !Number.isSafeInteger(current.generation) || !Number.isSafeInteger(current.contextSeq) || !Number.isSafeInteger(current.resumeFailureCount)) {
          sessionMeta[definition.name] = {
            generation: current?.generation >= 0 ? current.generation : 0,
            contextSeq: current?.contextSeq >= 0 ? current.contextSeq : 0,
            resumeFailureCount: current?.resumeFailureCount >= 0 ? current.resumeFailureCount : 0
          };
          stateShapeRepaired = true;
        }
      }
      state.agentSessionMeta = sessionMeta;
      if (!Array.isArray(state.artifacts)) {
        state.artifacts = [];
        stateShapeRepaired = true;
      }
      const normalizedRunCounts = Object.fromEntries(
        [...(serialWorkflow ? Object.entries(state.runCounts ?? {}) : []), ...normalizedOrchestration.agents
          .map((definition) => definition.name)
          .map((name) => [
          name,
          isNonNegativeSafeInteger(state.runCounts?.[name])
            ? state.runCounts[name]
            : 0
          ])]
      );
      if (JSON.stringify(state.runCounts) !== JSON.stringify(normalizedRunCounts)) {
        state.runCounts = normalizedRunCounts;
        stateShapeRepaired = true;
      }
      // Upgrade previously persisted single-budget loops without losing their
      // already-started iterations or reusing historical evidence numbers.
      for (const loop of normalizedOrchestration.loops ?? []) {
        const iterations = loopIterationCount(state.loopIterations, loop.id);
        if (!state.loopBatches || !Object.hasOwn(state.loopBatches, loop.id)) {
          state.loopBatches = {
            ...state.loopBatches,
            [loop.id]: iterations > 0 ? 1 : 0
          };
          stateShapeRepaired = true;
        }
        if (!state.loopTotalIterations || !Object.hasOwn(state.loopTotalIterations, loop.id)) {
          state.loopTotalIterations = {
            ...state.loopTotalIterations,
            [loop.id]: iterations
          };
          stateShapeRepaired = true;
        }
      }
      const normalizedExecutionCounts = Object.fromEntries(
        [...(serialWorkflow ? Object.entries(state.executionCounts ?? {}) : []), ...normalizedOrchestration.agents.map((definition) => {
          const name = definition.name;
          return [
            name,
            isNonNegativeSafeInteger(state.executionCounts?.[name])
              ? state.executionCounts[name]
              : state.runCounts[name]
          ];
        })]
      );
      if (
        JSON.stringify(state.executionCounts) !==
        JSON.stringify(normalizedExecutionCounts)
      ) {
        state.executionCounts = normalizedExecutionCounts;
        stateShapeRepaired = true;
      }
      if (
        state.activeAgentExecution &&
        (!state.activeAgentExecution.id ||
          !normalizedOrchestration.agents.some(
            (definition) =>
              definition.name === state.activeAgentExecution?.agent
          ))
      ) {
        state.activeAgentExecution = undefined;
        stateShapeRepaired = true;
      }
      const tokenUsageNeedsBackfill = !isProjectTokenUsage(
        state.tokenUsage,
        normalizedOrchestration
      );
      if (tokenUsageNeedsBackfill) {
        state.tokenUsage = emptyProjectTokenUsage(normalizedOrchestration);
        stateShapeRepaired = true;
      }
      if (!isProjectComputeUsage(state.computeUsage)) {
        state.computeUsage = emptyProjectComputeUsage();
        stateShapeRepaired = true;
      }
      const mainInvocationSeq =
        Number.isSafeInteger(state.mainInvocationSeq) &&
        state.mainInvocationSeq >= state.runCounts[SYSTEM_CONTROLLER_AGENT]
          ? state.mainInvocationSeq
          : state.runCounts[SYSTEM_CONTROLLER_AGENT];
      if (state.mainInvocationSeq !== mainInvocationSeq) {
        state.mainInvocationSeq = mainInvocationSeq;
        stateShapeRepaired = true;
      }
      if (!Array.isArray(state.userInputs)) {
        state.userInputs = [];
        stateShapeRepaired = true;
      }
      if (!isNonNegativeSafeInteger(state.completionGeneration)) {
        state.completionGeneration = 0;
        stateShapeRepaired = true;
      }
      const interruptedActive =
        state.status === "running" ||
        state.currentAgent !== undefined ||
        state.activeInvocationId !== undefined;
      const interruptRecovery =
        state.status === "interrupting" ||
        state.interruptRequest !== undefined;
      const eventSeqBeforeRecovery = state.eventSeq;
      await this.storage.reconcileEventLog(state);
      if (tokenUsageNeedsBackfill) {
        const rebuiltUsage = tokenUsageFromEvents(
          await this.storage.readEvents(state.id, 0, Number.MAX_SAFE_INTEGER),
          normalizedOrchestration,
          state.agentSessionIds?.[SYSTEM_CONTROLLER_AGENT]
        );
        state.tokenUsage = rebuiltUsage;
      }
      if (state.activeInvocationId && this.runner.cleanupInterrupted) {
        const runtimePath = await this.storage.invocationRuntimePath(
          state.id,
          state.activeInvocationId
        );
        await this.runner.cleanupInterrupted(
          state.activeInvocationId,
          runtimePath
        );
      }
      if (
        state.eventSeq !== eventSeqBeforeRecovery ||
        stateShapeRepaired
      ) {
        await this.storage.saveState(state);
      }
    // Keep the human-readable request/config snapshot aligned with the
    // normalized project configuration.
      await this.storage.refreshRequestSnapshot(state);
      const runtime: RuntimeProject = {
        state,
        eventQueue: Promise.resolve(),
        interruptWaiters: new Map()
      };
      this.runtimes.set(state.id, runtime);
      if (!state.git?.enabled) this.collaborationRuntime?.prepareSerialWorkflowAdjustments?.(state);
      if (["paused", "pausing"].includes(state.status) && !hasUserWorkflowPause(state)) {
        state.status = "retrying";
        checkpointWorkflowRecovery(state);
        await this.storage.saveState(state);
      }
      if (await this.collaborationRuntime?.recoverProject(state)) {
        // Git-enabled projects are owned exclusively by the collaboration
        // coordinator. They must never fall through to the legacy scheduler.
        continue;
      }
      if (
        state.status === "completed" ||
        state.status === "cancelled" ||
        state.status === "paused" ||
        state.status === "interrupted" && state.phase === "harness-recovery-required"
      ) {
        continue;
      }
      if (state.status === "pausing") {
        state.queuedAgent =
          state.currentAgent ??
          state.queuedAgent ??
          initialAgent(state);
        state.status = "paused";
        state.phase = "paused";
        state.queueEnteredAt = undefined;
        state.queueOrder = undefined;
        state.currentAgent = undefined;
        state.activeInvocationId = undefined;
        await this.storage.saveState(state);
        continue;
      }
      if (isCancelling(state)) {
        await this.endActiveAgentExecution(
          runtime,
          "cancelled",
          state.activeInvocationId
        );
        state.status = "cancelled";
        state.phase = "cancelled";
        state.cancelledAt = nowIso();
        state.completedAt = undefined;
        state.currentAgent = undefined;
        state.queuedAgent = undefined;
        state.queueEnteredAt = undefined;
        state.queueOrder = undefined;
        state.activeInvocationId = undefined;
        state.retryAt = undefined;
        await this.storage.saveState(state);
        await this.markCancellationSettled(runtime);
        continue;
      }
      state.queuedAgent =
        state.currentAgent ??
        state.queuedAgent ??
        initialAgent(state);
      state.currentAgent = undefined;
      state.activeInvocationId = undefined;
      if (interruptRecovery) {
        await this.endActiveAgentExecution(runtime, "interrupted");
        this.createPendingAgentExecution(
          state,
          SYSTEM_CONTROLLER_AGENT,
          "user-input",
          {
            sourceAgent: state.interruptionSnapshot?.agent,
            sourceInvocationId: state.interruptionSnapshot?.invocationId
          }
        );
        const interruptedAt = state.interruptionSnapshot?.interruptedAt ?? state.interruptedAt ?? state.updatedAt;
        state.interruptedAt = interruptedAt;
        if (state.interruptionSnapshot) {
          state.interruptionSnapshot.status = state.interruptRequest?.forceTerminated
            ? "force-terminated"
            : "interrupted";
          state.interruptionSnapshot.interruptedAt ??= interruptedAt;
          state.interruptionSnapshot.recoverable = true;
        }
        state.interruptRequest = undefined;
        state.queuedAgent = SYSTEM_CONTROLLER_AGENT;
        state.status = "queued";
        state.phase = `${SYSTEM_CONTROLLER_AGENT}:queued`;
        state.retryAt = undefined;
        this.enterQueue(state);
        await this.emit(runtime, {
          type: "project.status",
          level: "warning",
          agent: SYSTEM_CONTROLLER_AGENT,
          message: "Recovered an interrupted user request; Main was queued to reassess the saved checkpoint",
          data: {
            interruptRecovery: true,
            interruptedAt,
            checkpointAgent: state.interruptionSnapshot?.agent,
            inputId: state.interruptionSnapshot?.inputId,
            automaticResume: true
          }
        });
        resumable.push(runtime);
        continue;
      }
      if (interruptedActive || state.status === "interrupted") {
        const interruptedAt = state.interruptedAt ?? state.updatedAt;
        state.interruptedAt = undefined;
        state.status = "queued";
        state.phase = `${state.queuedAgent}:queued`;
        state.retryAt = undefined;
        this.enterQueue(state);
        await this.emit(runtime, {
          type: "project.status",
          level: "warning",
          agent: state.queuedAgent,
          message:
            `Recovered checkpoint after service interruption; ` +
            `${state.queuedAgent} was automatically queued to continue`,
          data: {
            checkpointAgent: state.queuedAgent,
            interruptedAt,
            automaticResume: true
          }
        });
        resumable.push(runtime);
        continue;
      }
      state.status = state.retryAt ? "retrying" : "queued";
      if (state.retryAt) {
        this.clearQueueEntry(state);
      } else {
        state.queueEnteredAt ??= state.updatedAt ?? state.createdAt;
        if (!isValidQueueOrder(state.queueOrder)) {
          state.queueOrder = this.allocateQueueOrder();
        }
      }
      state.phase = state.retryAt
        ? `${state.queuedAgent}:retrying`
        : `${state.queuedAgent}:queued`;
      await this.emit(runtime, {
        type: "project.status",
        level: "warning",
        message: `Recovered queued project; ${state.queuedAgent} will continue`
      });
      resumable.push(runtime);
    }
    resumable
      .sort((left, right) =>
        (left.state.queueOrder ?? Number.MAX_SAFE_INTEGER) -
          (right.state.queueOrder ?? Number.MAX_SAFE_INTEGER) ||
        (left.state.queueEnteredAt ?? left.state.createdAt).localeCompare(
          right.state.queueEnteredAt ?? right.state.createdAt
        ) ||
        left.state.id.localeCompare(right.state.id)
      )
      .forEach((runtime) => this.startLoop(runtime));
  }

  getQueueSnapshot(): AgentQueueSnapshot {
    const states = [...this.runtimes.values()].map(runtime => runtime.state);
    const formal = states.flatMap(state => {
      if (!state.git?.enabled || state.archivedAt || ["completed", "cancelled"].includes(state.status)) return [];
      const source = this.collaborationRuntime?.queueReadModel?.(state);
      return source ? [source] : [];
    });
    return buildAgentQueueSnapshot(this.scheduler.snapshot(), states, formal);
  }

  private allocateQueueOrder(): number {
    if (this.queueOrderCounter >= Number.MAX_SAFE_INTEGER) {
      throw new Error("Agent queue order exhausted");
    }
    this.queueOrderCounter += 1;
    return this.queueOrderCounter;
  }

  private enterQueue(state: ProjectState): void {
    state.queueEnteredAt = nowIso();
    state.queueOrder = this.allocateQueueOrder();
  }

  private createPendingAgentExecution(
    state: ProjectState,
    agent: AgentName,
    source: AgentExecutionSource,
    context: {
      sourceAgent?: AgentName;
      sourceInvocationId?: string;
    } = {}
  ): ActiveAgentExecution {
    const execution: ActiveAgentExecution = {
      id: newId("exec"),
      agent,
      source,
      createdAt: nowIso(),
      ...context
    };
    state.activeAgentExecution = execution;
    return execution;
  }

  private async endActiveAgentExecution(
    runtime: RuntimeProject,
    outcome: AgentExecutionOutcome,
    invocationId?: string
  ): Promise<void> {
    const { state } = runtime;
    const execution = state.activeAgentExecution;
    if (!execution) return;
    state.activeAgentExecution = undefined;
    // A queued task that never began is not a business execution and must not
    // create a terminal event or affect the count.
    if (!execution.startedAt) return;
    await this.emit(runtime, {
      type: "agent.execution.ended",
      agent: execution.agent,
      message: `${execution.agent} business execution ${outcome}`,
      data: {
        executionId: execution.id,
        executionNumber:
          state.executionCounts?.[execution.agent] ??
          state.runCounts[execution.agent] ??
          0,
        outcome,
        executionSource: execution.source,
        firstInvocationId: execution.firstInvocationId,
        latestInvocationId: invocationId ?? execution.latestInvocationId,
        ...(execution.sourceAgent
          ? { sourceAgent: execution.sourceAgent }
          : {}),
        ...(execution.sourceInvocationId
          ? { sourceInvocationId: execution.sourceInvocationId }
          : {})
      }
    });
  }

  private async replaceAgentExecution(
    runtime: RuntimeProject,
    agent: AgentName,
    source: AgentExecutionSource,
    context: {
      sourceAgent?: AgentName;
      sourceInvocationId?: string;
    } = {}
  ): Promise<ActiveAgentExecution> {
    if (runtime.state.activeAgentExecution) {
      await this.endActiveAgentExecution(runtime, "superseded");
    }
    return this.createPendingAgentExecution(
      runtime.state,
      agent,
      source,
      context
    );
  }

  private async beginAgentExecution(
    runtime: RuntimeProject,
    agent: AgentName,
    invocationId: string
  ): Promise<{ executionId: string; executionNumber: number }> {
    const { state } = runtime;
    let execution = state.activeAgentExecution;
    if (!execution || execution.agent !== agent) {
      if (execution) {
        await this.endActiveAgentExecution(runtime, "superseded");
      }
      execution = this.createPendingAgentExecution(state, agent, "recovery");
    }
    state.executionCounts ??= Object.fromEntries(
      orchestrationFor(state).agents.map((definition) => [
        definition.name,
        state.runCounts[definition.name] ?? 0
      ])
    );
    if (!execution.startedAt) {
      const executionNumber =
        (state.executionCounts[agent] ?? state.runCounts[agent] ?? 0) + 1;
      state.executionCounts[agent] = executionNumber;
      execution.startedAt = nowIso();
      execution.firstInvocationId = invocationId;
      execution.latestInvocationId = invocationId;
      await this.emit(runtime, {
        type: "agent.execution.started",
        agent,
        message: `${agent} started business execution ${executionNumber}`,
        data: {
          executionId: execution.id,
          executionNumber,
          executionSource: execution.source,
          invocationId,
          ...(execution.sourceAgent
            ? { sourceAgent: execution.sourceAgent }
            : {}),
          ...(execution.sourceInvocationId
            ? { sourceInvocationId: execution.sourceInvocationId }
            : {})
        }
      });
      return { executionId: execution.id, executionNumber };
    }
    execution.latestInvocationId = invocationId;
    return {
      executionId: execution.id,
      executionNumber:
        state.executionCounts[agent] ?? state.runCounts[agent] ?? 0
    };
  }

  private clearQueueEntry(state: ProjectState): void {
    state.queueEnteredAt = undefined;
    state.queueOrder = undefined;
  }

  private projectView(state: ProjectState): ProjectView {
    const liveState = this.collaborationRuntime?.projectReadModel?.(state) ?? state;
    const project = structuredClone(liveState) as ProjectView;
    // Main is a public first-class Agent. Clone all configurations before
    // exposing the read model so callers cannot mutate runtime state.
    project.agents = publicAgentConfigs(project.agents);
    const queue =
      liveState.queuedAgent && !liveState.currentAgent
        ? this.scheduler.position(
            agentKindForState(liveState, liveState.queuedAgent),
            liveState.id
          )
        : undefined;
    if (queue) {
      project.queuePosition = queue.position;
    }
    project.queueDepth = queue?.depth ?? 0;
    project.agentProgress = Object.fromEntries(
      orchestrationFor(liveState).agents.map((definition) => [
        definition.name,
        this.agentProgress(liveState, definition.name, queue)
      ])
    ) as Record<AgentName, AgentProgress>;
    project.overallProgress = overallProgress(liveState);
    return project;
  }

  private agentProgress(
    state: ProjectState,
    role: AgentName,
    queue: { position: number; depth: number } | undefined
  ): AgentProgress {
    const runs = state.runCounts[role] ?? 0;
    const scopedExecutions = new Set((state.scopedExecutions ?? [])
      .filter((execution) => execution.agentId === role).map((execution) => execution.arrivalRequestId)).size;
    const executions = (state.executionCounts?.[role] ?? runs) + scopedExecutions;
    const fallback = runs > 0 ? "completed" : "waiting";
    let progressState = agentProgressState(agentDisplayState(state, role, fallback));
    if (state.queuedAgent === role && state.phase === "storage-recovery-required") progressState = "failed";
    return { state: progressState, runs, executions,
      ...(progressState === "queued" && queue ? { queuePosition: queue.position } : {}) };
  }

  async shutdown(): Promise<void> {
    this.shuttingDown = true;
    for (const runtime of this.runtimes.values()) {
      runtime.queueController?.abort();
      runtime.sleepController?.abort();
      runtime.controller?.abort();
    }
    await Promise.allSettled(
      [...this.runtimes.values()]
        .map((runtime) => runtime.loop)
        .filter((loop): loop is Promise<void> => Boolean(loop))
    );
    await this.collaborationRuntime?.shutdown();
  }

  async createProject(
    input: z.input<typeof createProjectSchema>,
    /** Trusted host lifecycle only; never parsed from HTTP/workflow/Agent input. */
    hostInput?: {
      beforePersist?: (context: { projectId: string; gitEnabled: boolean }) => Promise<void>;
      initialInputs?: { files: string[]; install: (projectId: string) => Promise<void> };
    } | { files: string[]; install: (projectId: string) => Promise<void> }
  ): Promise<ProjectView> {
    // Preserve the Web host's existing positional initial-input contract.
    const host = hostInput && "files" in hostInput ? { initialInputs: hostInput } : hostInput;
    const creationStartedAt = performance.now();
    const parsed = createProjectSchema.parse(input);
    if (Boolean(parsed.inputUploadId) !== Boolean(host?.initialInputs)) {
      throw new Error("上传会话与课题输入不匹配");
    }
    const selectedGitHubAccount = parsed.git.enabled && this.githubAccounts
      ? await this.githubAccounts.requireReady(parsed.git.accountId ?? "")
      : undefined;
    const orchestration = parsed.git.enabled && this.collaborationRuntime
      ? normalizeNewGitOrchestration(parsed.orchestration) : normalizeAgentOrchestrationTemplate(parsed.orchestration);
    if (orchestration.schemaVersion === 3 && (!parsed.git.enabled || !this.collaborationRuntime)) {
      throw new Error("组内 Workflow/v3 项目要求启用 Git collaboration 和可信递归运行时，不能使用旧串行调度器");
    }
    const agents = mergeAgentConfigs(parsed.agents, orchestration);
    const projectId = newId("prj");
    const skillDefinitions = parsed.skillDefinitions ?? {};
    const mcpDefinitions = parsed.mcpDefinitions ?? {};
    validateProjectSkillReferences(agents, skillDefinitions);
    validateProjectMcpReferences(agents, mcpDefinitions);
    await this.validateAndSnapshotGatewayConfigs(agents, orchestration);
    const projectSkills = await materializeProjectSkills(
      this.storage.projectDir(projectId),
      skillDefinitions
    );
    await materializeProjectMcps(
      this.storage.projectDir(projectId),
      mcpDefinitions
    );
    const skillValidationStartedAt = performance.now();
    const availableSkills = await this.skills.forSelections(Object.values(agents).flatMap(config => [...config.skills, ...config.autoSkills]));
    for (const role of Object.keys(agents)) {
      await this.skills.resolveConfigured(availableSkills, [
        ...agents[role].skills,
        ...agents[role].autoSkills
      ], projectSkills);
    }
    const skillValidationMs = Math.round(performance.now() - skillValidationStartedAt);
    const timestamp = nowIso();
    const firstAgent = orchestration.input.target;
    const git: ProjectGitState = parsed.git.enabled
      ? {
          enabled: true,
          status: "authorizing",
          provider: "github",
          ...(selectedGitHubAccount
            ? {
                account: {
                  id: selectedGitHubAccount.id,
                  login: selectedGitHubAccount.login,
                  providerUserId: selectedGitHubAccount.providerUserId,
                  ...(selectedGitHubAccount.avatarUrl
                    ? { avatarUrl: selectedGitHubAccount.avatarUrl }
                    : {})
                }
              }
            : {}),
          ...(parsed.git.repositoryName
            ? { requestedRepositoryName: parsed.git.repositoryName }
            : {}),
          requestedRepositoryVisibility: parsed.git.repositoryVisibility ?? "private",
          initialization: {
            operationId: `git-init-pending`,
            attempt: 1,
            completedSteps: []
          }
        }
      : { enabled: false, status: "disabled" };
    if (git.initialization) {
      git.initialization.operationId = `git-init-${projectId}`;
    }
    const state: ProjectState = {
      id: projectId,
      formalStateProtocol: "project-state-v1",
      skillDefinitions,
      mcpDefinitions,
      title: parsed.title,
      requirement: parsed.requirement,
      inputFiles: host?.initialInputs?.files ?? [],
      inputDescription: parsed.inputDescription ?? "",
      status: "queued",
      phase: parsed.git.enabled ? "git:initializing" : `${firstAgent}:queued`,
      createdAt: timestamp,
      updatedAt: timestamp,
      ...(parsed.git.enabled ? {} : {
        queuedAgent: firstAgent,
        queueEnteredAt: timestamp,
        queueOrder: this.allocateQueueOrder()
      }),
      turn: 0,
      cycle: 1,
      eventSeq: 0,
      consecutiveFailures: 0,
      completionGeneration: 0,
      controlProtocol: "natural-language-tools-v1",
      agentSessionIds: {},
      agentSessions: {},
      agentSessionMeta: Object.fromEntries(
        orchestration.agents.map((definition) => [definition.name, {
          generation: 0,
          contextSeq: 0,
          resumeFailureCount: 0
        }])
      ),
      mainContextSeq: 0,
      runCounts: Object.fromEntries(
        orchestration.agents.map((definition) => [definition.name, 0])
      ),
      loopIterations: Object.fromEntries(
        (orchestration.loops ?? []).map((loop) => [
          loop.id,
          loop.to === firstAgent ? 1 : 0
        ])
      ),
      loopBatches: Object.fromEntries(
        (orchestration.loops ?? [])
          .filter((loop) => loop.to === firstAgent)
          .map((loop) => [loop.id, 1])
      ),
      loopTotalIterations: Object.fromEntries(
        (orchestration.loops ?? [])
          .filter((loop) => loop.to === firstAgent)
          .map((loop) => [loop.id, 1])
      ),
      executionCounts: Object.fromEntries(
        orchestration.agents.map((definition) => [definition.name, 0])
      ),
      ...(parsed.git.enabled ? {} : {
        activeAgentExecution: {
          id: newId("exec"),
          agent: firstAgent,
          source: "project-input" as const,
          createdAt: timestamp
        }
      }),
      mainInvocationSeq: 0,
      userInputs: [],
      tokenUsage: emptyProjectTokenUsage(orchestration),
      computeUsage: emptyProjectComputeUsage(),
      configurationLocked: true,
      lockedAt: timestamp,
      workerFailureCounts: Object.fromEntries(
        orchestration.agents.map((definition) => [definition.name, 0])
      ),
      agentFailureHistory: Object.fromEntries(
        orchestration.agents.map((definition) => [definition.name, []])
      ),
      artifacts: [],
      git,
      workflowRevision: 1,
      agents,
      orchestration
    };
    // Bind host-owned initial source before any durable project/provider/Agent work.
    await host?.beforePersist?.({ projectId, gitEnabled: parsed.git.enabled });
    await this.hostLifecycle?.beforePersist?.({ projectId, gitEnabled: parsed.git.enabled });
    // Bind the selected workspace first, then install original inputs before
    // persistence/queueing so neither ordinary nor Git Agents race the copy.
    await host?.initialInputs?.install(projectId);
    await this.storage.createProject(state);
    const runtime: RuntimeProject = {
      state,
      eventQueue: Promise.resolve(),
      interruptWaiters: new Map()
    };
    this.runtimes.set(state.id, runtime);
    await this.emit(runtime, {
      type: "project.created",
      message: `Project created; orchestration input is routed to ${firstAgent}`,
      data: { firstAgent, orchestration, preparationMs: Math.round(performance.now() - creationStartedAt), skillValidationMs }
    });
    if (orchestration.loops?.some((loop) => loop.to === firstAgent)) {
      await this.beginLoopBatch(runtime, firstAgent, true);
    }
    await this.emit(runtime, {
      type: "configuration.locked",
      message: "Project configuration snapshot locked at creation",
      data: { lockedAt: timestamp, configurationLocked: true }
    });
    if (parsed.git.enabled) {
      if (!this.collaborationRuntime) {
        state.status = "retrying";
        state.phase = "collaboration:runtime-unavailable";
        state.lastError = "Git collaboration runtime is unavailable";
        await this.storage.saveState(state);
      } else {
        await this.collaborationRuntime.createProject(state, parsed.git);
      }
    } else {
      this.collaborationRuntime?.prepareSerialWorkflowAdjustments?.(state);
      this.collaborationRuntime?.initializeNewProjectState?.(state);
      await this.emit(runtime, {
        type: "agent.queued",
        agent: firstAgent,
        message: `${firstAgent} agent entered the shared role queue`
      });
      this.startLoop(runtime);
    }
    return this.projectView(state);
  }

  async retryGitInitialization(projectId: string): Promise<ProjectView> {
    const runtime = await this.requireRuntime(projectId);
    if (!runtime.state.git?.enabled || !this.collaborationRuntime) {
      throw new Error("Project does not have an available Git collaboration runtime");
    }
    if (this.githubAccounts) {
      const binding = runtime.state.git.account;
      if (!binding) throw new Error("该 Git 项目尚未绑定 GitHub 账号");
      const account = await this.githubAccounts.requireReady(binding.id);
      if (account.providerUserId !== binding.providerUserId) {
        throw new Error("GitHub 账号身份与项目绑定不一致");
      }
      runtime.state.git.account = {
        id: account.id,
        login: account.login,
        providerUserId: account.providerUserId,
        ...(account.avatarUrl ? { avatarUrl: account.avatarUrl } : {})
      };
    }
    await this.collaborationRuntime.retryInitialization(runtime.state);
    return this.projectView(runtime.state);
  }

  /**
   * Validate Workflow Harness eligibility and resolve global gateways exactly
   * once at project creation. When the GatewayStore is enabled (the production
   * wiring), every Agent must select a global gateway; no harness may silently
   * inherit a host provider environment. Connection probe failures are shown
   * to the user but do not prevent an attempted run. Missing or incompatible
   * configurations still prevent the automatic create→run transition.
   */
  private async validateAndSnapshotGatewayConfigs(
    agents: AgentConfigMap,
    orchestration: AgentOrchestrationTemplate,
    options: {
      preserveGatewaySnapshots?: boolean;
    } = {}
  ): Promise<void> {
    const gatewayStore = this.gatewayStore;
    const harnesses = this.runner.harnessCatalog
      ? await this.runner.harnessCatalog()
      : harnessCatalogRegistry.list().map((descriptor) =>
          toPublicHarnessDescriptor(descriptor, {
            available: false,
            availabilityReason: "Runner 未提供 Harness Runtime Catalog"
          })
        );
    const issues: z.ZodIssue[] = [];
    const snapshots: Array<{
      config: AgentConfig;
      snapshot: NonNullable<AgentConfig["gatewaySnapshot"]>;
    }> = [];
    const reject = (agent: AgentName, message: string) => {
      issues.push({ code: "custom", path: ["agents", agent], message });
    };
    for (const definition of orchestration.agents) {
      const config = agents[definition.name];
      if (!config) {
        reject(definition.name, `${definition.name} Agent 缺少运行配置`);
        continue;
      }
      const harness = config?.harness ?? DEFAULT_HARNESS_ID;
      const harnessInfo = harnesses.find((item) => item.id === harness);
      const supportsWorkflow = harnessInfo?.purposes.includes("workflow") === true;
      if (!harnessInfo?.available) {
        reject(definition.name, `${definition.name} Agent 选择的 ${harness} harness 当前不可用`);
      }
      if (harnessInfo?.available && !supportsWorkflow) {
        reject(definition.name, `${definition.name} Agent 选择的 ${harness} harness 不支持 Workflow purpose`);
        continue;
      }
      if (harnessInfo) {
        const capabilities = harnessInfo.capabilities;
        if (config.webSearch && !capabilities.webSearch) {
          reject(definition.name, `${definition.name} Agent 选择的 ${harness} harness 不支持 Web Search`);
        }
        if (config.skills.length > 0 && !capabilities.skills) {
          reject(definition.name, `${definition.name} Agent 选择的 ${harness} harness 不支持 Skills`);
        }
        if (config.autoSkills.length > 0 && !capabilities.autoSkills) {
          reject(definition.name, `${definition.name} Agent 选择的 ${harness} harness 不支持 Auto Skills`);
        }
        if ((config.mcpServers.length > 0 || config.experimentMcp) && !capabilities.mcp) {
          reject(definition.name, `${definition.name} Agent 选择的 ${harness} harness 不支持 MCP`);
        }
        if (!capabilities.permissionPrompts.includes(config.permission)) {
          reject(definition.name, `${definition.name} Agent 选择的 ${harness} harness 不支持 ${config.permission} 权限约束`);
        }
      }
      if (config.nativeCodexProfileId) {
        try {
          if (!harnessSupportsNativeProfile(harness) || config.gatewayId || config.gatewaySnapshot || config.gatewayReasoningOption ||
            !this.hostLifecycle?.validateNativeCodexProfile) {
            throw new Error("Native Codex profile requires an explicit trusted host binding and cannot be mixed with a Gateway");
          }
          await this.hostLifecycle.validateNativeCodexProfile(config);
        } catch (error) {
          reject(definition.name, error instanceof Error ? error.message : "Invalid native Codex profile binding");
        }
        continue;
      }
      if (!gatewayStore) continue;
      if (options.preserveGatewaySnapshots && config.gatewaySnapshot) {
        // A running project's Gateway identity and credentials are locked.
        // Keep the credential-bearing snapshot and refresh derived route
        // metadata. Probe status is advisory and must not block execution.
        const lockedSnapshot = structuredClone(config.gatewaySnapshot);
        if (
          config.gatewayId &&
          lockedSnapshot.id !== config.gatewayId
        ) {
          reject(
            definition.name,
            `${definition.name} Agent 的 Gateway 运行快照与已选择网关不一致`
          );
          continue;
        }
        if (!lockedSnapshot.models.includes(config.model)) {
          reject(
            definition.name,
            `${definition.name} Agent 的 Gateway 运行快照不包含当前 model`
          );
          continue;
        }
        const gateway = await gatewayStore.get(lockedSnapshot.id);
        if (!gateway) {
          reject(
            definition.name,
            `${definition.name} Agent 的锁定 Gateway 已不存在，不能切换 Harness`
          );
          continue;
        }
        if (
          gateway.name !== lockedSnapshot.name ||
          gateway.url !== lockedSnapshot.url ||
          gateway.protocol !== lockedSnapshot.protocol
        ) {
          reject(
            definition.name,
            `${definition.name} Agent 的锁定 Gateway 已发生变化，请重新创建项目`
          );
          continue;
        }
        let lockedReasoning: ReturnType<typeof resolveGatewayReasoning>;
        let currentReasoning: ReturnType<typeof resolveGatewayReasoning>;
        try {
          lockedReasoning = resolveGatewayReasoning(
            lockedSnapshot.modelReasoning,
            config.model,
            config.gatewayReasoningOption
          );
          if (lockedReasoning?.fingerprint !== lockedSnapshot.reasoning?.fingerprint) {
            reject(
              definition.name,
              `${definition.name} Agent 的 Gateway 思考强度运行快照与所选项不一致`
            );
            continue;
          }
          currentReasoning = resolveGatewayReasoning(
            gateway.modelReasoning,
            config.model,
            config.gatewayReasoningOption
          );
          if (currentReasoning?.fingerprint !== lockedReasoning?.fingerprint) {
            reject(
              definition.name,
              `${definition.name} Agent 的锁定 Gateway 思考强度配置已发生变化，请重新创建项目`
            );
            continue;
          }
        } catch (error) {
          reject(
            definition.name,
            `${definition.name} Agent 的 Gateway 思考强度配置无效：${error instanceof Error ? error.message : "未知配置错误"}`
          );
          continue;
        }
        const hasPassingProbe = await gatewayStore.harnessCombinationPassed(
          gateway.id,
          harness,
          config.model,
          config.gatewayReasoningOption
        );
        const nativeProtocol = harnessInfo?.nativeProtocol;
        if (!nativeProtocol) {
          reject(definition.name, `${definition.name} Agent 的 Harness 缺少 native protocol`);
          continue;
        }
        const routeMode = nativeProtocol === gateway.protocol ? "direct" : "proxy";
        const routeDirection = routeMode === "proxy"
          ? `${nativeProtocol}->${gateway.protocol}` as `${AgentProtocol}->${AgentProtocol}`
          : undefined;
        const matchingTests = gateway.tests?.length ? gateway.tests : [gateway.test];
        const matchingTest = hasPassingProbe ? [...matchingTests].reverse().find((test) =>
          test.status === "passed" &&
          test.probeKind === "adapter-smoke" &&
          test.protocol === gateway.protocol &&
          test.model === config.model &&
          test.harness === harness &&
          test.reasoningOptionId === config.gatewayReasoningOption &&
          test.reasoningFingerprint === lockedReasoning?.fingerprint &&
          test.nativeProtocol === nativeProtocol &&
          (test.routeMode ?? "direct") === routeMode &&
          (routeMode === "direct" || test.routeDirection === routeDirection)
        ) : undefined;
        snapshots.push({ config, snapshot: {
          ...lockedSnapshot,
          nativeProtocol,
          routeMode,
          ...(routeDirection ? { routeDirection } : {}),
          deliveryMode: matchingTest?.deliveryMode ?? lockedSnapshot.deliveryMode,
          ...(matchingTest?.testedAt ? { testedAt: matchingTest.testedAt } : {})
        } });
        continue;
      }
      if (!config.gatewayId) {
        reject(definition.name, `${definition.name} Agent 必须选择全局网关`);
        continue;
      }
      const gateway = await gatewayStore.get(config.gatewayId);
      if (!gateway) {
        reject(definition.name, `${definition.name} Agent 选择的全局网关不存在，请重新选择`);
        continue;
      }
      try {
        await this.gatewayStore.assertAllowedNetworkTarget(gateway.url);
      } catch (error) {
        reject(
          definition.name,
          `${definition.name} Agent 的全局网关网络目标校验失败：${error instanceof Error ? error.message : "域名解析失败"}`
        );
        continue;
      }
      const protocol = gateway.protocol;
      if (!gateway.models.includes(config.model)) {
        reject(definition.name, `${definition.name} Agent 的 model 不在所选网关模型列表中`);
        continue;
      }
      const legacyReasoningEffort = config.legacyReasoningEffort ?? config.reasoningEffort;
      if (!config.gatewayReasoningOption && legacyReasoningEffort) {
        const migration = migrateLegacyGatewayReasoning(
          gateway.modelReasoning,
          config.model,
          legacyReasoningEffort
        );
        if (migration.optionId) {
          config.gatewayReasoningOption = migration.optionId;
          delete config.reasoningMigrationWarning;
        } else if (migration.warning) {
          config.reasoningMigrationWarning = migration.warning;
        }
      } else if (config.gatewayReasoningOption) {
        delete config.reasoningMigrationWarning;
      }
      delete config.reasoningEffort;
      delete config.legacyReasoningEffort;
      let reasoning: ReturnType<typeof resolveGatewayReasoning>;
      // An explicit Agent choice wins; only previously confirmed defaults are
      // used here. Project creation never probes the model or scans gateways.
      if (!config.gatewayReasoningOption && gateway.autoReasoning !== false && gateway.modelReasoning?.[config.model]?.defaultOptionId)
        config.gatewayReasoningOption = gateway.modelReasoning[config.model]!.defaultOptionId;
      try {
        reasoning = resolveGatewayReasoning(
          gateway.modelReasoning,
          config.model,
          config.gatewayReasoningOption
        );
      } catch (error) {
        reject(
          definition.name,
          `${definition.name} Agent 的 Gateway 思考强度配置无效：${error instanceof Error ? error.message : "未知配置错误"}`
        );
        continue;
      }
      if (!harnessInfo?.available) continue;
      const nativeProtocol = harnessInfo.nativeProtocol;
      const routeMode = nativeProtocol === protocol ? "direct" : "proxy";
      const routeDirection = routeMode === "proxy"
        ? `${nativeProtocol}->${protocol}` as `${AgentProtocol}->${AgentProtocol}`
        : undefined;
      const matchingTests = gateway.tests?.length ? gateway.tests : [gateway.test];
      // Use only an exact passing smoke record for optional delivery metadata.
      // A failed or missing probe keeps the default delivery mode and does not
      // prevent the project from attempting the configured route.
      const hasPassingProbe = await gatewayStore.harnessCombinationPassed(
        gateway.id,
        harness,
        config.model,
        config.gatewayReasoningOption
      );
      const matchingTest = hasPassingProbe ? [...matchingTests].reverse().find((test) =>
        test.status === "passed" &&
        test.probeKind === "adapter-smoke" &&
        test.protocol === protocol &&
        test.model === config.model &&
        test.harness === harness &&
        test.reasoningOptionId === config.gatewayReasoningOption &&
        test.reasoningFingerprint === reasoning?.fingerprint &&
        test.nativeProtocol === nativeProtocol &&
        (test.routeMode ?? "direct") === routeMode &&
        (routeMode === "direct" || test.routeDirection === routeDirection)
      ) : undefined;
      snapshots.push({ config, snapshot: {
        id: gateway.id,
        name: gateway.name,
        url: gateway.url,
        apiKey: gateway.apiKey,
        models: [...gateway.models],
        modelContextWindows: { ...gateway.modelContextWindows },
        modelReasoning: structuredClone(gateway.modelReasoning ?? {}),
        ...(reasoning ? { reasoning } : {}),
        ...(config.reasoningMigrationWarning
          ? { reasoningMigrationWarning: config.reasoningMigrationWarning }
          : {}),
        defaultModel: gateway.defaultModel,
        protocol,
        nativeProtocol,
        routeMode,
        ...(routeDirection ? { routeDirection } : {}),
        deliveryMode: matchingTest?.deliveryMode ?? "native-stream",
        ...(matchingTest?.testedAt ? { testedAt: matchingTest.testedAt } : {})
      } });
    }
    if (issues.length) {
      throw new ZodError(issues);
    }
    for (const { config, snapshot } of snapshots) {
      config.gatewaySnapshot = snapshot;
      delete config.reasoningEffort;
      delete config.legacyReasoningEffort;
    }
  }

  private async readAndValidateAgentOrchestrationProposal(
    state: ProjectState,
    baseVersion = !state.git?.enabled ? this.collaborationRuntime?.prepareSerialMainWorkflowAdjustment?.(state).version : undefined
  ): Promise<AgentOrchestrationProposal> {
    if (!state.activeInvocationId) throw new Error("Workflow proposal requires the active invocation");
    const raw = await this.storage.readMainAgentOrchestrationSnapshot(
      state.id,
      MAIN_AGENT_ORCHESTRATION_FILE,
      state.activeInvocationId
    );
    const proposal = parseAgentOrchestrationProposal(
      raw.toString("utf8"),
      state.id,
      state.orchestration,
      state.agents,
      {
        baseDir: await this.storage.roleWorkspace(
          state.id,
          SYSTEM_CONTROLLER_AGENT,
          "inv_workflow_proposal"
        ),
        skillDefinitions: state.skillDefinitions,
        mcpDefinitions: state.mcpDefinitions,
        ...(baseVersion ? { baseVersion } : {})
      }
    );
    await this.prepareWorkflowConfiguration(state, proposal);
    return proposal;
  }

  /** Same route/Skill/MCP validation for Main and a scoped Leader. Updating
   * configuration never deletes a durable Agent session or changes cwd. */
  async prepareWorkflowConfiguration(state: ProjectState, proposal: AgentOrchestrationProposal): Promise<void> {
    assertWorkflowSessionHarnesses(state, proposal.agents);
    await this.validateAndSnapshotGatewayConfigs(
      proposal.agents,
      proposal.orchestration,
      { preserveGatewaySnapshots: true }
    );
    const availableSkills = await this.skills.forSelections(Object.values(proposal.agents).flatMap(config => [...config.skills, ...config.autoSkills]));
    const projectSkills = await materializeProjectSkills(
      this.storage.projectDir(state.id),
      proposal.skillDefinitions
    );
    await materializeProjectMcps(
      this.storage.projectDir(state.id),
      proposal.mcpDefinitions
    );
    for (const definition of proposal.orchestration.agents) {
      const config = proposal.agents[definition.name];
      await this.skills.resolveConfigured(availableSkills, [
        ...config.skills,
        ...config.autoSkills
      ], projectSkills);
    }
    assertWorkflowSessionHarnesses(state, proposal.agents);
  }

  async getWorkflowAdjustments(projectId: string) {
    const runtime = await this.requireRuntime(projectId);
    if (!this.collaborationRuntime?.getWorkflowAdjustments || (!runtime.state.git?.enabled && !this.collaborationRuntime.prepareSerialWorkflowAdjustments))
      throw new CollaborationStateError("INVALID_STATE_TRANSITION", "Workflow adjustments require the project runtime");
    return this.storage.withStableProjectSnapshot(projectId, async () => this.collaborationRuntime!.getWorkflowAdjustments!(runtime.state));
  }

  async queryWorkflowAdjustments(projectId: string, ifNoneMatch?: string) {
    const runtime = await this.requireRuntime(projectId);
    if (!this.collaborationRuntime?.getWorkflowAdjustments || (!runtime.state.git?.enabled && !this.collaborationRuntime.prepareSerialWorkflowAdjustments))
      throw new CollaborationStateError("INVALID_STATE_TRANSITION", "Workflow adjustments require the project runtime");
    return this.storage.withStableProjectSnapshot(projectId, async () => this.collaborationRuntime!.queryWorkflowAdjustments
      ? this.collaborationRuntime!.queryWorkflowAdjustments(runtime.state, ifNoneMatch)
      : { context: this.collaborationRuntime!.getWorkflowAdjustments!(runtime.state) });
  }

  async getWorkflowAdjustmentPage(projectId: string, input: WorkflowAdjustmentPageInput, ifNoneMatch?: string) {
    const runtime = await this.requireRuntime(projectId);
    if (!this.collaborationRuntime?.getWorkflowAdjustmentPage || (!runtime.state.git?.enabled && !this.collaborationRuntime.prepareSerialWorkflowAdjustments))
      throw new CollaborationStateError("INVALID_STATE_TRANSITION", "Workflow history requires the project runtime");
    return this.storage.withStableProjectSnapshot(projectId, async () => this.collaborationRuntime!.getWorkflowAdjustmentPage!(runtime.state, input, ifNoneMatch));
  }

  async getWorkflowAdjustmentDetail(projectId: string, requestId: string, expectedVersion?: string) {
    const runtime = await this.requireRuntime(projectId);
    if (!this.collaborationRuntime?.getWorkflowAdjustmentDetail || (!runtime.state.git?.enabled && !this.collaborationRuntime.prepareSerialWorkflowAdjustments))
      throw new CollaborationStateError("INVALID_STATE_TRANSITION", "Workflow history requires the project runtime");
    return this.storage.withStableProjectSnapshot(projectId, async () => this.collaborationRuntime!.getWorkflowAdjustmentDetail!(runtime.state, requestId, expectedVersion));
  }

  async submitWorkflowAdjustment(projectId: string, input: unknown) {
    const runtime = await this.requireRuntime(projectId);
    if (!this.collaborationRuntime?.submitWorkflowAdjustment || (!runtime.state.git?.enabled && !this.collaborationRuntime.prepareSerialWorkflowAdjustments))
      throw new CollaborationStateError("INVALID_STATE_TRANSITION", "Workflow adjustments require the project runtime");
    // Git admission is already fenced by S's transaction and publication
    // queue. Holding the native-event queue here would prevent its reserved
    // events from clearing the stable read needed by projection publication.
    if (runtime.state.git?.enabled) return this.collaborationRuntime.submitWorkflowAdjustment(runtime.state, input);
    // The serial scheduler still owns its file-state write lane.
    const result = await this.serializeProjectWrite(runtime, () => this.collaborationRuntime!.submitWorkflowAdjustment!(runtime.state, input));
    try {
      await this.applyWaitingSerialWorkflowAdjustments(runtime);
    } catch (error) {
      await this.deferSerialWorkflowPublicationRecovery(runtime, error, { requestId: result.record.requestId });
    }
    return this.collaborationRuntime!.getWorkflowAdjustmentSubmissionResult!(runtime.state, result.record.requestId, result.replay);
  }

  async withdrawWorkflowAdjustment(projectId: string, input: unknown) {
    const runtime = await this.requireRuntime(projectId);
    if (!this.collaborationRuntime?.withdrawWorkflowAdjustment || (!runtime.state.git?.enabled && !this.collaborationRuntime.prepareSerialWorkflowAdjustments))
      throw new CollaborationStateError("INVALID_STATE_TRANSITION", "Workflow adjustments require the project runtime");
    if (runtime.state.git?.enabled) return this.collaborationRuntime.withdrawWorkflowAdjustment(runtime.state, input);
    const result = await this.serializeProjectWrite(runtime, async () => {
      const result = await this.collaborationRuntime!.withdrawWorkflowAdjustment!(runtime.state, input);
      if (!runtime.state.git?.enabled && this.refreshSerialWorkflowMainDecision(runtime.state, result.record))
        await this.storage.saveState(runtime.state);
      return result;
    });
    if (!runtime.state.git?.enabled) {
      try {
        await this.applyWaitingSerialWorkflowAdjustments(runtime);
      } catch (error) {
        await this.deferSerialWorkflowPublicationRecovery(runtime, error, { requestId: result.record.requestId });
      }
    }
    return result;
  }

  async getProject(projectId: string): Promise<ProjectView | undefined> {
    const runtime = this.runtimes.get(projectId);
    if (runtime) {
      if (runtime.state.phase === "storage-recovery-required") {
        return this.projectView(runtime.state);
      }
      return this.storage.withStableProjectSnapshot(projectId, async () =>
        this.projectView(runtime.state)
      );
    }
    const state = await this.storage.tryLoadState(projectId);
    return state ? this.projectView(state) : undefined;
  }

  async listProjects(includeArchived = false): Promise<ProjectView[]> {
    // Each row needs its own committed snapshot. Independent projects need
    // not reach a shared idle instant before an already captured row can return.
    const projects = await Promise.all(
      [...this.runtimes.values()].map((runtime) =>
        this.listingProjectView(runtime)
      )
    );
    return projects
      .filter((project) => includeArchived || !project.archivedAt)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  private listingProjectView(runtime: RuntimeProject): Promise<ProjectView> {
    // Wait for each project's own writer independently. Queue the expensive
    // projection after that barrier: several barriers can clear together,
    // and must not release a burst of synchronous reads into one microtask turn.
    if (runtime.state.phase === "storage-recovery-required") return this.captureListingProjectView(runtime);
    return this.storage.withStableProjectSnapshot(runtime.state.id, () => this.captureListingProjectView(runtime));
  }

  private captureListingProjectView(runtime: RuntimeProject): Promise<ProjectView> {
    return new Promise<ProjectView>((resolve, reject) => {
      const start = this.listingViewTail.then(() => new Promise<void>(release => {
        setImmediate(() => {
          try {
            resolve(this.projectView(runtime.state));
          } catch (error) { reject(error); }
          finally { release(); }
        });
      }));
      this.listingViewTail = start.catch(error => { reject(error); });
    });
  }

  async pause(projectId: string): Promise<ProjectView> {
    const runtime = await this.requireRuntime(projectId);
    const { state } = runtime;
    if (state.git?.enabled) {
      if (!this.collaborationRuntime) throw new Error("Git collaboration runtime is unavailable");
      await this.collaborationRuntime.pauseProject(state);
      return this.projectView(state);
    }
    if (
      (state.status === "completed" &&
        !this.storage.hasActiveInvocationCommit(projectId)) ||
      state.status === "cancelled" ||
      state.status === "cancelling" ||
      state.status === "interrupted" ||
      state.status === "paused" ||
      state.status === "pausing"
    ) {
      return this.projectView(state);
    }
    state.pauseRequest ??= { requestedAt: nowIso() };
    if (state.currentAgent) {
      state.status = "pausing";
      state.phase = `pausing:after:${state.currentAgent}`;
    } else {
      state.status = "paused";
      state.phase = "paused";
      state.pauseRequest.settledAt = nowIso();
      runtime.queueController?.abort();
      runtime.sleepController?.abort();
    }
    await this.emit(runtime, {
      type: "project.status",
      message:
        state.status === "pausing"
          ? "Pause requested; the current agent will finish before pausing"
          : "Project paused"
    });
    return this.projectView(state);
  }

  async resume(projectId: string, options?: CollaborationProjectResumeOptions): Promise<ProjectView> {
    const runtime = await this.requireRuntime(projectId);
    const { state } = runtime;
    if (state.archivedAt) throw new Error("Cannot resume an archived project; unarchive it first");
    if (state.git?.enabled) {
      if (!this.collaborationRuntime) throw new Error("Git collaboration runtime is unavailable");
      if (options?.preserveRecoveryBudget) await this.collaborationRuntime.resumeProject(state, options);
      else await this.collaborationRuntime.resumeProject(state);
      return this.projectView(state);
    }
    if (options?.preserveRecoveryBudget) throw new Error("Cannot resume retained scoped recovery in a non-Git project");
    state.pauseRequest = undefined;
    beginWorkflowRecovery(state, { renew: true });
    runtime.sleepController?.abort();
    if (
      this.storage.hasActiveInvocationCommit(projectId) &&
      (state.status === "paused" || state.status === "pausing") &&
      runtime.loop
    ) {
      // Do not withdraw a pause while its invocation result is at the commit
      // boundary. Let that loop reach the durable paused state first.
      await runtime.loop;
    }
    if (state.status === "completed" || state.status === "cancelled") {
      throw new Error(`Cannot resume a ${state.status} project`);
    }
    if (
      state.phase === "user-intervention-required" &&
      state.userIntervention?.status === "pending"
    ) {
      throw new Error(
        "Cannot resume while Main is waiting for a user intervention response"
      );
    }
    if (
      state.status === "paused" &&
      state.phase === "main-recovery-required"
    ) {
      state.workerFailureCounts ??= {};
      state.agentFailureHistory ??= {};
      state.workerFailureCounts[SYSTEM_CONTROLLER_AGENT] = 0;
      state.consecutiveFailures = 0;
      state.currentAgent = undefined;
      state.activeInvocationId = undefined;
      state.queuedAgent = SYSTEM_CONTROLLER_AGENT;
      state.retryAt = undefined;
      state.interruptedAt = undefined;
      state.lastError = undefined;
      state.status = "queued";
      state.phase = `${SYSTEM_CONTROLLER_AGENT}:queued`;
      this.enterQueue(state);
      await this.emit(runtime, {
        type: "project.status",
        agent: SYSTEM_CONTROLLER_AGENT,
        message:
          "Main recovery requested; the original persistent Main thread and pending decision context were preserved",
        data: {
          resumedMain: true,
          preservedSession: Boolean(state.agentSessionIds?.[SYSTEM_CONTROLLER_AGENT]),
          preservedPendingDecision: Boolean(state.pendingMainDecision)
        }
      });
      this.startLoop(runtime);
      return this.projectView(state);
    }
    if (
      state.status !== "paused" &&
      state.status !== "pausing" &&
      state.status !== "retrying" &&
      state.status !== "interrupted"
    ) {
      return this.projectView(state);
    }
    if (state.status === "interrupted") {
      const checkpointAgent =
        state.queuedAgent ??
        initialAgent(state);
      const interruptedAt = state.interruptedAt;
      state.currentAgent = undefined;
      state.activeInvocationId = undefined;
      state.queuedAgent = checkpointAgent;
      state.retryAt = undefined;
      state.interruptedAt = undefined;
      state.status = "queued";
      state.phase = `${checkpointAgent}:queued`;
      this.enterQueue(state);
      await this.emit(runtime, {
        type: "project.status",
        agent: checkpointAgent,
        message:
          `Project resumed from checkpoint; ${checkpointAgent} will restart`,
        data: {
          checkpointAgent,
          interruptedAt
        }
      });
      this.startLoop(runtime);
      return this.projectView(state);
    }
    if (state.status === "pausing" && state.currentAgent) {
      state.status = "running";
      state.phase = `${state.currentAgent}:running`;
      await this.emit(runtime, {
        type: "project.status",
        message: `Pause request withdrawn; ${state.currentAgent} continues running`
      });
      return this.projectView(state);
    }
    const pendingUserInputIds = state.userInputs
      .filter((input) => input.status === "pending")
      .map((input) => input.id);
    // A paused Worker checkpoint was chosen before these requirements
    // existed.  Let Main accept the authoritative user update before that
    // stale assignment is allowed to run again.
    if (state.status === "paused" && pendingUserInputIds.length > 0) {
      await this.replaceAgentExecution(
        runtime,
        SYSTEM_CONTROLLER_AGENT,
        "user-input",
        { sourceAgent: state.queuedAgent }
      );
      state.queuedAgent = SYSTEM_CONTROLLER_AGENT;
    }
    state.status = "queued";
    state.phase = `${state.queuedAgent ?? SYSTEM_CONTROLLER_AGENT}:queued`;
    if (!state.queuedAgent) state.queuedAgent = SYSTEM_CONTROLLER_AGENT;
    this.enterQueue(state);
    await this.emit(runtime, {
      type: "project.status",
      message: pendingUserInputIds.length > 0
        ? "Project resumed at Main so pending user requirements are applied before the paused checkpoint"
        : `Project resumed; ${state.queuedAgent} is next`,
      ...(pendingUserInputIds.length > 0
        ? { data: { pendingUserInputIds, nextAgent: SYSTEM_CONTROLLER_AGENT } }
        : {})
    });
    this.startLoop(runtime);
    return this.projectView(state);
  }

  async respondToUserIntervention(
    projectId: string,
    message: string
  ): Promise<ProjectView> {
    const runtime = await this.requireRuntime(projectId);
    const response = message.trim();
    if (!response) throw new Error("User intervention response cannot be empty");
    if (runtime.state.git?.enabled) {
      const respond = this.collaborationRuntime?.respondToUserIntervention;
      if (!respond) {
        throw new Error(
          "Git collaboration runtime does not support user intervention responses"
        );
      }
      await respond.call(this.collaborationRuntime, runtime.state, {
        message: response
      });
      return this.projectView(runtime.state);
    }
    if (this.storage.hasActiveInvocationCommit(projectId)) {
      await this.storage.waitForInvocationCommit(projectId);
    }
    const releaseMutation = this.storage.reserveProjectMutation(projectId);
    let project: ProjectView;
    try {
      project = await this.serializeProjectWrite(runtime, async () => {
        const { state } = runtime;
        const pending = state.userIntervention;
        if (
          !["paused", "retrying"].includes(state.status) ||
          state.phase !== "user-intervention-required" ||
          pending?.status !== "pending"
        ) {
          throw new Error("No pending user intervention for this project");
        }

        const answered = {
          ...pending,
          status: "answered" as const,
          answeredAt: nowIso(),
          response
        };
        await this.storage.writeUserResponse(
          state,
          pending.id,
          userInterventionResponseMarkdown(state, answered),
          pending.requestedBy
        );
        state.userIntervention = answered;
        state.currentAgent = undefined;
        state.activeInvocationId = undefined;
        // User intervention is a Main-only protocol. Every response resumes
        // the same durable Main thread so Main can reassess the full state.
        const nextAgent = SYSTEM_CONTROLLER_AGENT;
        state.activeAgentExecution = undefined;
        this.createPendingAgentExecution(state, nextAgent, "user-response", {
          sourceAgent: pending.requestedBy,
          sourceInvocationId: pending.requestedInvocationId
        });
        state.queuedAgent = nextAgent;
        state.retryAt = undefined;
        state.interruptedAt = undefined;
        state.status = "queued";
        state.phase = `${nextAgent}:queued`;
        this.enterQueue(state);
        const orchestration = orchestrationFor(state);
        const childAgents = orchestration.agents
          .map((definition) => definition.name)
          .filter((name) => name !== SYSTEM_CONTROLLER_AGENT);
        state.pendingMainDecision = {
          sourceAgent: pending.pendingDecision?.sourceAgent ?? SYSTEM_CONTROLLER_AGENT,
          sourceInvocationId:
            pending.pendingDecision?.sourceInvocationId ?? pending.id,
          decisionPlan:
            pending.pendingDecision?.decisionPlan ??
            defaultDecisionPlan(SYSTEM_CONTROLLER_AGENT),
          requestedAt: nowIso(),
          candidateAgents:
            pending.pendingDecision?.candidateAgents ??
            (orchestration.termination.agent === SYSTEM_CONTROLLER_AGENT
              ? [...childAgents, "finish"]
              : childAgents),
          allowAnyAgent: pending.pendingDecision?.allowAnyAgent ?? true,
          reason:
            pending.pendingDecision?.reason ??
            (orchestration.termination.agent === SYSTEM_CONTROLLER_AGENT
              ? "termination"
              : "user"),
          ...(pending.pendingDecision?.diagnostic
            ? { diagnostic: pending.pendingDecision.diagnostic }
            : {})
        };
        state.mainCapabilities = buildMainCapabilitySnapshot(state);
        state.pendingMainDecision.capabilities = state.mainCapabilities;
        await this.storage.appendEvent(state, {
          type: "user.intervention.answered",
          agent: pending.requestedBy,
          message: "User responded; Main queued to continue the research flow",
          data: {
            requestId: pending.id,
            nextAgent,
            ...(state.pendingMainDecision
              ? {
                  candidateAgents: state.pendingMainDecision.candidateAgents,
                  allowAnyAgent: state.pendingMainDecision.allowAnyAgent,
                  capabilities: state.mainCapabilities,
                  controlMode: state.mainCapabilities.controlMode,
                  mainAutonomous: state.mainCapabilities.controlMode === "autonomous"
                }
          : {})
          }
        });
        return this.projectView(state);
      });
    } finally {
      releaseMutation();
    }
    runtime.sleepController?.abort();
    this.startLoop(runtime);
    return project;
  }

  async addProjectUserInput(
    projectId: string,
    message: string,
    mode: "wait" | "interrupt" = "wait",
    requestId?: string
  ): Promise<ProjectView> {
    const runtime = await this.requireRuntime(projectId);
    const text = message.trim();
    if (!text) throw new Error("Project user input cannot be empty");

    const normalizedRequestId = requestId?.trim() || undefined;
    if (runtime.state.git?.enabled) {
      const addInput = this.collaborationRuntime?.addProjectUserInput;
      if (!addInput) {
        throw new Error(
          "Git collaboration runtime does not support project user input"
        );
      }
      await addInput.call(this.collaborationRuntime, runtime.state, {
        message: text,
        mode,
        ...(normalizedRequestId ? { requestId: normalizedRequestId } : {})
      });
      return this.projectView(runtime.state);
    }
    const inputId = newId("inp");
    const inputCreatedAt = nowIso();

    const releaseMutation = this.storage.reserveProjectMutation(projectId);
    let result: ProjectView | undefined;
    let reopened = false;
    let inputPersisted = false;
    let interruptInvocationId: string | undefined;
    try {
      while (!result) {
        await this.storage.waitForInvocationCommit(projectId);
        let retryAfterCommit = false;
        const project = await this.serializeProjectWrite(runtime, async () => {
          if (this.storage.hasActiveInvocationCommit(projectId)) {
            retryAfterCommit = true;
            return undefined;
          }
          const { state } = runtime;
          // Retrying a browser request with the same key must be a pure read:
          // do not append a second message or send another interrupt signal.
          if (normalizedRequestId) {
            const existing = state.userInputs.find(
              (candidate) => candidate.requestId === normalizedRequestId
            );
            if (existing) return this.projectView(state);
          }
          if (
            state.status === "cancelled" ||
            state.status === "cancelling"
          ) {
            throw new Error(`Cannot add user input to a ${state.status} project`);
          }
          if (
            state.userInputs.filter((input) => input.status === "pending")
              .length >= 100
          ) {
            throw new Error("Project already has 100 pending user inputs");
          }

          const reopensCompletedProject = state.status === "completed";
          if (
            reopensCompletedProject &&
            (state.completionGeneration >= Number.MAX_SAFE_INTEGER ||
              state.cycle >= Number.MAX_SAFE_INTEGER)
          ) {
            throw new Error("Project continuation generation exhausted");
          }
          const previousCompletion = reopensCompletedProject
            ? {
                status: state.status,
                phase: state.phase,
                completedAt: state.completedAt,
                currentAgent: state.currentAgent,
                queuedAgent: state.queuedAgent,
                queueEnteredAt: state.queueEnteredAt,
                queueOrder: state.queueOrder,
                activeInvocationId: state.activeInvocationId,
                activeAgentExecution: state.activeAgentExecution,
                retryAt: state.retryAt,
                interruptedAt: state.interruptedAt,
                lastError: state.lastError,
                interruptionSnapshot: state.interruptionSnapshot,
                interruptRequest: state.interruptRequest,
                cycle: state.cycle,
                completionGeneration: state.completionGeneration
              }
            : undefined;

          if (reopensCompletedProject) {
            state.status = "queued";
            state.phase = `${SYSTEM_CONTROLLER_AGENT}:queued`;
            state.completedAt = undefined;
            state.currentAgent = undefined;
            state.queuedAgent = SYSTEM_CONTROLLER_AGENT;
            state.activeInvocationId = undefined;
            state.retryAt = undefined;
            state.interruptedAt = undefined;
            state.lastError = undefined;
            state.cycle += 1;
            state.completionGeneration += 1;
            state.activeAgentExecution = undefined;
            this.createPendingAgentExecution(
              state,
              SYSTEM_CONTROLLER_AGENT,
              "project-reopen",
              { sourceAgent: SYSTEM_CONTROLLER_AGENT }
            );
            this.enterQueue(state);
            await this.storage.appendEvent(state, {
              type: "project.reopened",
              agent: SYSTEM_CONTROLLER_AGENT,
              message: "Completed project reopened for a new user requirement",
              data: { completionGeneration: state.completionGeneration, cycle: state.cycle }
            });
          }

          const input: ProjectUserInput = {
            id: inputId,
            status: "pending",
            createdAt: inputCreatedAt,
            message: text,
            mode,
            ...(normalizedRequestId ? { requestId: normalizedRequestId } : {}),
            targetMainInvocation: state.mainInvocationSeq + 1
          };
          const activeAgent = state.currentAgent;
          const activeInvocationId = state.activeInvocationId;
          const interruptThisInvocation =
            mode === "interrupt" &&
            state.status === "running" &&
            activeAgent !== undefined &&
            activeInvocationId !== undefined &&
            state.interruptRequest === undefined;
          try {
            await this.storage.writeProjectUserInput(
              state,
              input,
              projectUserInputMarkdown(state, input)
            );
            state.userInputs.push(input);
            await this.storage.appendEvent(state, {
              type: "user.input.queued",
              agent: SYSTEM_CONTROLLER_AGENT,
              message: reopensCompletedProject
                ? "User added a requirement; the completed project reopened at main"
                : interruptThisInvocation
                  ? "User added a requirement and requested an immediate checkpoint of the running Agent"
                  : "User added a project-level requirement for the next Main invocation",
              data: {
                inputId: input.id,
                targetMainInvocation: input.targetMainInvocation,
                preview: input.message.slice(0, 240),
                mode,
                ...(normalizedRequestId ? { requestId: normalizedRequestId } : {}),
                reopened: reopensCompletedProject,
                interruptRunningAgent: interruptThisInvocation,
                completionGeneration: state.completionGeneration,
                ...(reopensCompletedProject
                  ? {
                      terminationCondition:
                        orchestrationFor(state).termination.condition,
                      nextAgent: SYSTEM_CONTROLLER_AGENT
                    }
                  : {})
              }
            });
            if (interruptThisInvocation) {
              const requestedAt = nowIso();
              const deadlineAt = new Date(
                Date.now() +
                  (this.config.interruptForceTimeoutMs ?? DEFAULT_INTERRUPT_FORCE_TIMEOUT_MS)
              ).toISOString();
              state.interruptionSnapshot = this.buildInterruptionSnapshot(
                runtime,
                input,
                activeAgent!,
                activeInvocationId!,
                requestedAt
              );
              state.interruptionSnapshot.status = "requested";
              state.interruptionSnapshot.recoverable = true;
              state.interruptRequest = {
                inputId: input.id,
                invocationId: activeInvocationId!,
                agent: activeAgent!,
                requestedAt,
                deadlineAt
              };
              state.status = "interrupting";
              state.phase = `${activeAgent}:interrupting`;
              interruptInvocationId = activeInvocationId;
              await this.storage.appendEvent(state, {
                type: "user.input.interrupt.requested",
                level: "warning",
                agent: activeAgent,
                message: "正在保存当前 Agent 的中断状态，完成后由 Main 接管新需求",
                data: {
                  inputId: input.id,
                  ...(normalizedRequestId ? { requestId: normalizedRequestId } : {}),
                  invocationId: activeInvocationId,
                  checkpointAgent: activeAgent,
                  deadlineAt,
                  snapshot: {
                    eventSeq: state.interruptionSnapshot.eventSeq,
                    activeTools: state.interruptionSnapshot.activeTools,
                    partialOutput: state.interruptionSnapshot.partialOutput
                  }
                }
              });
              state.interruptionSnapshot.status = "interrupting";
              await this.storage.saveState(state);
            }
          } catch (error) {
            state.userInputs = state.userInputs.filter(
              (candidate) => candidate.id !== input.id
            );
            if (previousCompletion) Object.assign(state, previousCompletion);
            if (interruptInvocationId === activeInvocationId) {
              interruptInvocationId = undefined;
              state.interruptRequest = undefined;
              state.interruptionSnapshot = undefined;
            }
            throw error;
          }
          inputPersisted = true;
          if (reopensCompletedProject) reopened = true;
          return this.projectView(state);
        });
        if (project) {
          result = project;
          break;
        }
        if (!retryAfterCommit) {
          throw new Error("Failed to queue project user input");
        }
      }
    } finally {
      releaseMutation();
      if (interruptInvocationId && inputPersisted) {
        // The durable marker is installed before the abort. The invocation
        // checks it at its commit boundary, while this notification wakes the
        // bounded force-termination waiter for non-cooperative runners.
        this.requestRuntimeInterrupt(runtime, interruptInvocationId);
      }
    }
    if (!result) throw new Error("Failed to queue project user input");
    if (reopened || interruptInvocationId === undefined) this.startLoop(runtime);
    return result;
  }

  private reserveRunningMainInputRefresh(
    runtime: RuntimeProject,
    requestedAt: string
  ): MainInputRefreshRequest {
    let refresh = runtime.mainInputRefresh;
    if (!refresh) {
      let resolveWritesSettled!: () => void;
      const writesSettled = new Promise<void>((resolve) => {
        resolveWritesSettled = resolve;
      });
      refresh = {
        inputIds: [],
        requestedAt,
        pendingWrites: 0,
        writesSettled,
        resolveWritesSettled
      };
      runtime.mainInputRefresh = refresh;
    } else if (refresh.pendingWrites === 0) {
      refresh.writesSettled = new Promise<void>((resolve) => {
        refresh!.resolveWritesSettled = resolve;
      });
    }
    refresh.pendingWrites += 1;

    runtime.controller?.abort();
    runtime.queueController?.abort();
    runtime.sleepController?.abort();
    return refresh;
  }

  private settleRunningMainInputRefresh(
    refresh: MainInputRefreshRequest,
    inputId: string,
    persisted: boolean
  ): void {
    if (persisted && !refresh.inputIds.includes(inputId)) {
      refresh.inputIds.push(inputId);
    }
    refresh.pendingWrites = Math.max(0, refresh.pendingWrites - 1);
    if (refresh.pendingWrites === 0) refresh.resolveWritesSettled();
  }

  /** Build a checkpoint from the in-memory invocation telemetry without ever
   * copying a gateway credential into project state or timeline data. */
  private buildInterruptionSnapshot(
    runtime: RuntimeProject,
    input: ProjectUserInput,
    agent: AgentName,
    invocationId: string,
    requestedAt: string
  ): InterruptionSnapshot {
    const state = runtime.state;
    const telemetry = runtime.activeInvocationTelemetry?.invocationId === invocationId
      ? runtime.activeInvocationTelemetry
      : undefined;
    const config = state.agents[agent];
    const gateway = config?.gatewaySnapshot;
    return {
      status: "requested",
      inputId: input.id,
      ...(input.requestId ? { requestId: input.requestId } : {}),
      agent,
      kind: agentKindForState(state, agent),
      invocationId,
      ...(config?.harness ? { harness: config.harness } : {}),
      ...(gateway?.id ? { gatewayId: gateway.id } : {}),
      ...(gateway?.name ? { gatewayName: gateway.name } : {}),
      ...(gateway?.protocol ? { gatewayProtocol: gateway.protocol } : {}),
      ...(config?.model ? { model: config.model } : {}),
      ...(telemetry?.threadId || state.agentSessionIds?.[agent]
        ? { sessionId: telemetry?.threadId ?? state.agentSessionIds?.[agent] }
        : {}),
      ...(telemetry?.startedAt ? { startedAt: telemetry.startedAt } : {}),
      requestedAt,
      eventSeq: state.eventSeq,
      ...(telemetry?.lastActivityAt ? { lastActivityAt: telemetry.lastActivityAt } : {}),
      activeTools: [...(telemetry?.activeTools ?? [])],
      ...(telemetry?.partialOutput ? { partialOutput: telemetry.partialOutput } : {}),
      ...(telemetry?.partialHandoff ? { partialHandoff: telemetry.partialHandoff } : {}),
      traceTail: [...(telemetry?.traceTail ?? [])].slice(-80),
      artifacts: (state.artifacts ?? []).map((artifact) => ({
        agent: artifact.agent,
        path: artifact.path,
        ...(artifact.title ? { title: artifact.title } : {})
      })),
      ...(telemetry?.workspacePath
        ? { workspaceSummary: `已准备 Agent 工作区：${telemetry.workspacePath}` }
        : {}),
      recoverable: true
    };
  }

  /** Abort only after the interrupt request and checkpoint have been durable. */
  private requestRuntimeInterrupt(
    runtime: RuntimeProject,
    invocationId: string
  ): void {
    if (runtime.state.interruptRequest?.invocationId !== invocationId) return;
    runtime.controller?.abort();
    runtime.queueController?.abort();
    runtime.sleepController?.abort();
    runtime.interruptWaiters?.get(invocationId)?.();
    void this.emit(runtime, {
      type: "agent.interrupting",
      level: "warning",
      agent: runtime.state.interruptRequest.agent,
      message: "已确认中断请求，正在等待当前 Agent 安全退出",
      data: {
        inputId: runtime.state.interruptRequest.inputId,
        invocationId,
        deadlineAt: runtime.state.interruptRequest.deadlineAt
      }
    }).catch(() => {
      // The invocation catch path records the durable recovery state even if
      // a best-effort status event cannot be appended.
    });
  }

  /** Race a runner against the bounded interrupt cleanup deadline. */
  private async awaitRunnerResult(
    runtime: RuntimeProject,
    invocationId: string,
    runtimePath: string,
    runnerPromise: Promise<AgentRunResult>
  ): Promise<AgentRunResult> {
    runtime.interruptWaiters ??= new Map();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let settled = false;
    let resolveInterrupt!: () => void;
    const interruptNotified = new Promise<void>((resolve) => {
      resolveInterrupt = resolve;
    });
    const notifyInterrupt = () => resolveInterrupt();
    runtime.interruptWaiters.set(invocationId, notifyInterrupt);
    const forceAfterDeadline = (async () => {
      await interruptNotified;
      const request = runtime.state.interruptRequest;
      if (!request || request.invocationId !== invocationId) {
        return new Promise<never>(() => undefined);
      }
      const remaining = Math.max(1, Date.parse(request.deadlineAt) - Date.now());
      await new Promise<void>((resolve) => {
        timer = setTimeout(resolve, remaining);
      });
      if (settled || runtime.state.interruptRequest?.invocationId !== invocationId) {
        return new Promise<never>(() => undefined);
      }
      const currentRequest = runtime.state.interruptRequest;
      currentRequest.forceTerminated = true;
      if (runtime.state.interruptionSnapshot) {
        runtime.state.interruptionSnapshot.status = "force-terminated";
        runtime.state.interruptionSnapshot.forceTerminated = true;
      }
      await this.serializeProjectWrite(runtime, async () => {
        await this.storage.saveState(runtime.state);
        await this.storage.appendEvent(runtime.state, {
          type: "project.status",
          level: "warning",
          agent: runtime.state.interruptRequest?.agent,
          message: "当前 Agent 未在限定时间内退出，系统已执行强制终止并保留可恢复快照",
          data: {
            inputId: currentRequest.inputId,
            invocationId,
            forceTerminated: true,
            recoverable: true
          }
        });
      });
      try {
        await Promise.race([
          this.runner.cleanupInterrupted?.(invocationId, runtimePath) ?? Promise.resolve(),
          new Promise<void>((resolve) => setTimeout(resolve, 2_000))
        ]);
      } catch {
        // The invocation catch path still transitions to an interrupted,
        // recoverable state if process cleanup is unavailable.
      }
      throw new AgentInterruptedError(
        "Agent invocation did not stop before the interrupt deadline; force termination was requested"
      );
    })();
    if (runtime.state.interruptRequest?.invocationId === invocationId) {
      notifyInterrupt();
    }
    try {
      return await Promise.race([runnerPromise, forceAfterDeadline]);
    } finally {
      settled = true;
      if (timer) clearTimeout(timer);
      if (runtime.interruptWaiters?.get(invocationId) === notifyInterrupt) {
        runtime.interruptWaiters.delete(invocationId);
      }
    }
  }

  /** Convert an aborted invocation into one Main wake-up, preserving all
   * partial work as an explicitly interrupted checkpoint. */
  private async finalizeUserInterrupt(
    runtime: RuntimeProject,
    agent: AgentName,
    invocationId: string,
    reason: Error
  ): Promise<void> {
    const { state } = runtime;
    const request = state.interruptRequest;
    if (!request || request.invocationId !== invocationId) return;
    const interruptedAt = nowIso();
    const snapshot = state.interruptionSnapshot;
    if (snapshot) {
      snapshot.status = request.forceTerminated ? "force-terminated" : "interrupted";
      snapshot.interruptedAt = interruptedAt;
      snapshot.forceTerminated = request.forceTerminated;
      snapshot.recoverable = true;
      const telemetry = runtime.activeInvocationTelemetry;
      if (telemetry?.invocationId === invocationId) {
        snapshot.activeTools = [...telemetry.activeTools];
        snapshot.traceTail = [...telemetry.traceTail].slice(-80);
        if (telemetry.partialOutput) snapshot.partialOutput = telemetry.partialOutput;
        if (telemetry.partialHandoff) snapshot.partialHandoff = telemetry.partialHandoff;
        if (telemetry.lastActivityAt) snapshot.lastActivityAt = telemetry.lastActivityAt;
      }
    }
    state.interruptedAt = interruptedAt;
    state.currentAgent = undefined;
    state.activeInvocationId = undefined;
    state.queuedAgent = SYSTEM_CONTROLLER_AGENT;
    state.retryAt = undefined;
    state.status = "interrupted";
    state.phase = `${agent}:interrupted`;
    state.lastError = request.forceTerminated
      ? "用户中断请求触发了强制终止；已保存可恢复快照"
      : undefined;
    await this.emit(runtime, {
      type: "agent.interrupted",
      level: "warning",
      agent,
      message: `${agent} 已按用户请求中断；未完成内容已标记为中断快照`,
      data: {
        inputId: request.inputId,
        invocationId,
        interruptedAt,
        forceTerminated: Boolean(request.forceTerminated),
        reason: redactTrace(reason.message).slice(-2_000),
        partialOutput: snapshot?.partialOutput ?? "",
        activeTools: snapshot?.activeTools ?? [],
        recoverable: true
      }
    });
    await this.emit(runtime, {
      type: "project.status",
      level: "warning",
      agent: SYSTEM_CONTROLLER_AGENT,
      message: "中断状态已保存，Main 将接管并处理新的用户需求",
      data: {
        status: "interrupted",
        inputId: request.inputId,
        checkpointAgent: agent,
        invocationId,
        recoverable: true
      }
    });
    state.interruptRequest = undefined;
    try {
      await this.endActiveAgentExecution(runtime, "interrupted", invocationId);
      await this.queueMainDecision(
        runtime,
        agent,
        invocationId,
        "user",
        orchestrationFor(state).agents
          .map((definition) => definition.name)
          .filter((name) => name !== SYSTEM_CONTROLLER_AGENT),
        true,
        `用户要求立即中断 ${agent}。已保存中断快照（未完成内容不可视为正常交接）；请先读取快照和新的用户需求，再决定下一步。${snapshot?.partialOutput ? ` 部分输出：${snapshot.partialOutput.slice(-2_000)}` : ""}`
      );
      await this.emit(runtime, {
        type: "user.input.interrupt.completed",
        agent: SYSTEM_CONTROLLER_AGENT,
        message: "中断快照已保存，Main 已排队接管用户需求",
        data: {
          inputId: request.inputId,
          sourceAgent: agent,
          sourceInvocationId: invocationId,
          mainWakeOnce: true,
          recoverable: true
        }
      });
    } catch (queueError) {
      // Keep a visible, restartable checkpoint if Main cannot be queued now.
      state.status = "retrying";
      state.phase = "main-recovery-required";
      state.queuedAgent = SYSTEM_CONTROLLER_AGENT;
      state.lastError = `中断已保存，但 Main 暂时无法接管：${redactTrace(
        queueError instanceof Error ? queueError.message : String(queueError)
      )}`.slice(0, 4_000);
      await this.emit(runtime, {
        type: "user.input.interrupt.completed",
        level: "error",
        agent: SYSTEM_CONTROLLER_AGENT,
        message: "中断快照已保存；Main 接管失败，项目可恢复",
        data: { inputId: request.inputId, sourceAgent: agent, recoverable: true }
      });
    }
  }

  async updateAgentModels(
    projectId: string,
    models: Partial<Record<AgentName, string>>
  ): Promise<ProjectView> {
    return this.updateAgentConfigs(
      projectId,
      Object.fromEntries(
        Object.entries(models).flatMap(([agent, model]) =>
          model === undefined ? [] : [[agent, { model }]]
        )
      )
    );
  }

  async updateCollaborationGroup(
    projectId: string,
    input:
      | {
          action: "rename";
          groupId: string;
          displayName: string;
          requestId?: string;
        }
      | {
          action: "dissolve";
          groupId: string;
          expectedWorkflowRevision: number;
          restoration?: CollaborationDissolutionPlan;
          requestId: string;
        }
  ): Promise<ProjectView> {
    const runtime = await this.requireRuntime(projectId);
    if (!runtime.state.git?.enabled) {
      throw new Error("Collaboration groups require Git collaboration");
    }
    if (!this.collaborationRuntime) {
      throw new Error("Git collaboration runtime is unavailable");
    }
    const collaborationRuntime = this.collaborationRuntime;
    const releaseMutation = this.storage.reserveProjectMutation(projectId);
    try {
      return await this.serializeProjectWrite(runtime, async () => {
        const current = runtime.state.orchestration;
        const requestContext = {
          kind: `collaboration.${input.action}` as const,
          subjectId: input.groupId
        };
        if (
          input.requestId &&
          collaborationRuntime.isWorkflowRevisionRequestRecorded?.(runtime.state, {
            requestId: input.requestId,
            ...requestContext
          })
        ) {
          return this.projectView(runtime.state);
        }
        const next = structuredClone(current);
        const group = (next.collaborations ?? []).find(
          (entry) => entry.id === input.groupId
        );
        if (!group) throw new Error(`Unknown collaboration group: ${input.groupId}`);
        if (group.renamePolicy !== "editable") {
          throw new ProjectConfigurationLockedError(
            `Collaboration group ${input.groupId} is policy locked`
          );
        }
        if (input.action === "rename") {
          if (group.displayName === input.displayName) return this.projectView(runtime.state);
          group.displayName = input.displayName;
        } else {
          if (input.expectedWorkflowRevision !== runtime.state.workflowRevision) {
            throw new Error(
              `Workflow revision changed from ${input.expectedWorkflowRevision} to ${runtime.state.workflowRevision}; reload before dissolving the collaboration group`
            );
          }
          dissolveCollaborationGroup(next, input.groupId, input.restoration);
        }
        const orchestration = normalizeAgentOrchestrationTemplate(next);
        await collaborationRuntime.saveWorkflowRevision(runtime.state, {
          orchestration,
          affectedGroupIds: affectedCollaborationGroupIds(current, orchestration),
          ...(input.requestId ? { requestId: input.requestId } : {}),
          requestContext
        });
        return this.projectView(runtime.state);
      });
    } finally {
      releaseMutation();
    }
  }

  async getProjectGitGraph(
    projectId: string,
    options: { limit: number; cursor?: string; includeTechnical?: boolean }
  ): Promise<GitGraphPage> {
    const runtime = await this.requireRuntime(projectId);
    return readProjectGitGraph(runtime.state, options);
  }

  async updateAgentConfigs(
    projectId: string,
    agents: Partial<
      Record<
        AgentName,
        Partial<
          Pick<
            AgentConfig,
            | "model"
            | "harness"
            | "gatewayId"
            | "instructions"
            | "skills"
            | "autoSkills"
            | "mcpServers"
            | "experimentMcp"
            | "permission"
            | "webSearch"
            | "sessionPersistence"
            | "decisionBy"
          >
        > & { gatewayReasoningOption?: string | null }
      >
    >
  ): Promise<ProjectView> {
    const runtime = await this.requireRuntime(projectId);
    if (runtime.state.configurationLocked) {
      throw new ProjectConfigurationLockedError(
        "Project configuration is locked after startup"
      );
    }
    type RuntimeConfigUpdate = Partial<
      Pick<
        AgentConfig,
        | "model"
        | "harness"
        | "gatewayId"
        | "instructions"
        | "skills"
        | "autoSkills"
        | "mcpServers"
        | "experimentMcp"
        | "permission"
        | "webSearch"
        | "sessionPersistence"
        | "decisionBy"
      > & { gatewayReasoningOption?: string | null }
    >;
    const orchestration = orchestrationFor(runtime.state);
    const configuredNames = new Set(
      orchestration.agents.map((definition) => definition.name)
    );
    const requested = Object.fromEntries(
      Object.entries(agents).flatMap(([agent, requestedConfig]) => {
        if (!requestedConfig) return [];
        if (!configuredNames.has(agent)) {
          throw new Error(`Unknown Agent name: ${agent}`);
        }
        const definition = agentDefinitionFor(orchestration, agent);
        const config: RuntimeConfigUpdate = {};
        if (Object.hasOwn(requestedConfig, "proxy")) throw new Error("Agent-level proxy configuration is no longer supported");
        if (requestedConfig.model !== undefined) {
          const model = requestedConfig.model.trim();
          if (!model) throw new Error("Agent model cannot be empty");
          config.model = model;
        }
        if (requestedConfig.harness !== undefined) config.harness = requestedConfig.harness;
        if (requestedConfig.gatewayId !== undefined) config.gatewayId = requestedConfig.gatewayId ?? undefined;
        if (Object.prototype.hasOwnProperty.call(requestedConfig, "gatewayReasoningOption")) {
          config.gatewayReasoningOption = requestedConfig.gatewayReasoningOption ?? null;
        }
        if (requestedConfig.instructions !== undefined) {
          config.instructions =
            requestedConfig.instructions.trim() ||
            defaultInstructionsForAgent(definition.name, definition.template);
        }
        if (requestedConfig.skills !== undefined) {
          config.skills = [...requestedConfig.skills];
        }
        if (requestedConfig.autoSkills !== undefined) {
          config.autoSkills = [...requestedConfig.autoSkills];
        }
        if (requestedConfig.mcpServers !== undefined) {
          config.mcpServers = requestedConfig.mcpServers.map((server) => ({
            ...server
          }));
        }
        if (requestedConfig.experimentMcp !== undefined) {
          config.experimentMcp = requestedConfig.experimentMcp;
        }
        if (requestedConfig.permission !== undefined) {
          config.permission = requestedConfig.permission;
        }
        if (requestedConfig.webSearch !== undefined) {
          config.webSearch = requestedConfig.webSearch;
        }
        if (requestedConfig.sessionPersistence !== undefined) {
          config.sessionPersistence = requestedConfig.sessionPersistence;
        }
        if (requestedConfig.decisionBy !== undefined) {
          config.decisionBy = requestedConfig.decisionBy;
        }
        if (Object.keys(config).length === 0) return [];
        return [[agent, config]];
      })
    ) as Partial<Record<AgentName, RuntimeConfigUpdate>>;
    if (Object.keys(requested).length === 0) {
      throw new Error("At least one agent configuration must be provided");
    }
    const availableSkills = await this.skills.forSelections(Object.values(requested).flatMap(config => [...(config?.skills ?? []), ...(config?.autoSkills ?? [])]));
    const projectSkills = await materializeProjectSkills(
      this.storage.projectDir(projectId),
      runtime.state.skillDefinitions
    );
    for (const agent of Object.keys(requested)) {
      const config = requested[agent];
      if (config?.skills !== undefined) {
        await this.skills.resolveConfigured(
          availableSkills,
          config.skills,
          projectSkills
        );
      }
      if (config?.autoSkills !== undefined) {
        await this.skills.resolveConfigured(
          availableSkills,
          config.autoSkills,
          projectSkills
        );
      }
    }

    const releaseMutation = this.storage.reserveProjectMutation(projectId);
    try {
      while (true) {
        await this.storage.waitForInvocationCommit(projectId);
        let retryAfterCommit = false;
        const result = await this.serializeProjectWrite(runtime, async () => {
          if (this.storage.hasActiveInvocationCommit(projectId)) {
            retryAfterCommit = true;
            return undefined;
          }
          const { state } = runtime;
          const changes = orchestration.agents.flatMap((definition) => {
            const agent = definition.name;
            const config = requested[agent];
            if (!config) return [];
            const model = config.model ?? state.agents[agent].model;
            const gatewayReasoningOption = config.gatewayReasoningOption === null
              ? undefined
              : config.gatewayReasoningOption ?? state.agents[agent].gatewayReasoningOption;
            const instructions =
              config.instructions ?? state.agents[agent].instructions;
            const skillSelection = normalizedAgentSkills(
              definition.name,
              config.skills ?? state.agents[agent].skills,
              config.autoSkills ?? state.agents[agent].autoSkills
            );
            const mcpServers = config.mcpServers
              ? normalizedAgentMcpServers(config.mcpServers)
              : state.agents[agent].mcpServers;
            const experimentMcp = config.experimentMcp ?? state.agents[agent].experimentMcp;
            if (
              model === state.agents[agent].model &&
              (config.harness ?? state.agents[agent].harness) === state.agents[agent].harness &&
              (config.gatewayId ?? state.agents[agent].gatewayId) === state.agents[agent].gatewayId &&
              gatewayReasoningOption === state.agents[agent].gatewayReasoningOption &&
              instructions === state.agents[agent].instructions &&
              arraysEqual(skillSelection.skills, state.agents[agent].skills) &&
              arraysEqual(
                skillSelection.autoSkills,
                state.agents[agent].autoSkills
              ) &&
              mcpServersEqual(mcpServers, state.agents[agent].mcpServers) &&
              experimentMcp === state.agents[agent].experimentMcp &&
              (config.permission ?? state.agents[agent].permission) === state.agents[agent].permission &&
              (config.webSearch ?? state.agents[agent].webSearch) === state.agents[agent].webSearch
              && (config.sessionPersistence ?? state.agents[agent].sessionPersistence) === state.agents[agent].sessionPersistence
              && (config.decisionBy ?? state.agents[agent].decisionBy) === state.agents[agent].decisionBy
            ) {
              return [];
            }
            return [
              {
                agent,
                kind: definition.name === SYSTEM_CONTROLLER_AGENT ? "main" : "worker",
                template: definition.template,
                previousWebSearch: state.agents[agent].webSearch,
                previousModel: state.agents[agent].model,
                previousHarness: state.agents[agent].harness,
                previousGatewayId: state.agents[agent].gatewayId,
                previousGatewayReasoningOption: state.agents[agent].gatewayReasoningOption,
                previousInstructions: state.agents[agent].instructions,
                previousSkills: [...state.agents[agent].skills],
                previousAutoSkills: [...state.agents[agent].autoSkills],
                previousMcpServers: state.agents[agent].mcpServers.map(
                  (server) => ({ ...server })
                ),
                previousPermission: state.agents[agent].permission,
                previousExperimentMcp: state.agents[agent].experimentMcp,
                previousSessionPersistence: state.agents[agent].sessionPersistence,
                previousDecisionBy: state.agents[agent].decisionBy,
                model,
                harness: config.harness ?? state.agents[agent].harness ?? DEFAULT_HARNESS_ID,
                gatewayId: config.gatewayId ?? state.agents[agent].gatewayId,
                gatewayReasoningOption,
                instructions,
                skills: skillSelection.skills,
                autoSkills: skillSelection.autoSkills,
                mcpServers,
                experimentMcp,
                permission: config.permission ?? state.agents[agent].permission,
                webSearch: config.webSearch ?? state.agents[agent].webSearch,
                sessionPersistence: config.sessionPersistence ?? state.agents[agent].sessionPersistence,
                decisionBy: config.decisionBy ?? state.agents[agent].decisionBy
              }
            ];
          });
          if (changes.length === 0) return this.projectView(state);

          const candidateAgents = structuredClone(state.agents);
          for (const change of changes) {
            candidateAgents[change.agent].mcpServers = change.mcpServers;
          }
          validateProjectMcpReferences(
            candidateAgents,
            state.mcpDefinitions ?? {}
          );

          for (const change of changes) {
            state.agents[change.agent].model = change.model;
            state.agents[change.agent].harness = change.harness ?? state.agents[change.agent].harness ?? DEFAULT_HARNESS_ID;
            state.agents[change.agent].gatewayId = change.gatewayId;
            state.agents[change.agent].gatewayReasoningOption = change.gatewayReasoningOption;
            delete state.agents[change.agent].reasoningEffort;
            state.agents[change.agent].instructions = change.instructions;
            state.agents[change.agent].skills = change.skills;
            state.agents[change.agent].autoSkills = change.autoSkills;
            state.agents[change.agent].mcpServers = change.mcpServers;
            if (change.experimentMcp !== undefined) state.agents[change.agent].experimentMcp = change.experimentMcp;
            state.agents[change.agent].permission = change.permission;
            state.agents[change.agent].webSearch = change.webSearch;
            state.agents[change.agent].sessionPersistence = change.agent === SYSTEM_CONTROLLER_AGENT
              ? true
              : change.sessionPersistence;
            state.agents[change.agent].decisionBy = change.agent === SYSTEM_CONTROLLER_AGENT
              ? "main"
              : change.decisionBy;
          }
          try {
            await this.storage.appendEvent(state, {
              type: "project.config.updated",
              message: `${changes.length} agent runtime configuration${changes.length === 1 ? "" : "s"} updated`,
              data: {
                changes: changes.map((change) => ({
                  agent: change.agent,
                  kind: change.kind,
                  template: change.template,
                  previousModel: change.previousModel,
                  previousHarness: change.previousHarness,
                  previousGatewayId: change.previousGatewayId,
                  previousGatewayReasoningOption: change.previousGatewayReasoningOption,
                  model: change.model,
                  harness: change.harness,
                  gatewayId: change.gatewayId,
                  gatewayReasoningOption: change.gatewayReasoningOption,
                  instructionsChanged:
                    change.previousInstructions !== change.instructions,
                  instructionsLength: change.instructions.length,
                  previousSkills: change.previousSkills,
                  previousAutoSkills: change.previousAutoSkills,
                  previousMcpServers: change.previousMcpServers,
                  previousPermission: change.previousPermission,
                  previousExperimentMcp: change.previousExperimentMcp,
                  skills: change.skills,
                  autoSkills: change.autoSkills,
                  mcpServers: change.mcpServers,
                  experimentMcp: change.experimentMcp,
                  permission: change.permission,
                  webSearch: change.webSearch,
                  sessionPersistence: change.sessionPersistence,
                  decisionBy: change.decisionBy
                })),
                activeInvocationUnaffected: Boolean(
                  state.currentAgent &&
                    changes.some((change) => change.agent === state.currentAgent)
                ),
                effectiveFor: "future-invocations"
              }
            });
          } catch (error) {
            for (const change of changes) {
              state.agents[change.agent].model = change.previousModel;
              state.agents[change.agent].harness = change.previousHarness;
              state.agents[change.agent].gatewayId = change.previousGatewayId;
              state.agents[change.agent].gatewayReasoningOption =
                change.previousGatewayReasoningOption;
              state.agents[change.agent].instructions =
                change.previousInstructions;
              state.agents[change.agent].skills = change.previousSkills;
              state.agents[change.agent].autoSkills = change.previousAutoSkills;
              state.agents[change.agent].mcpServers =
                change.previousMcpServers;
              if (change.previousExperimentMcp === undefined) delete state.agents[change.agent].experimentMcp;
              else state.agents[change.agent].experimentMcp = change.previousExperimentMcp;
              state.agents[change.agent].permission =
                change.previousPermission;
              state.agents[change.agent].webSearch = change.previousWebSearch;
              state.agents[change.agent].sessionPersistence =
                change.previousSessionPersistence;
              state.agents[change.agent].decisionBy = change.previousDecisionBy;
            }
            throw error;
          }
          return this.projectView(state);
        });
        if (result) return result;
        if (!retryAfterCommit) {
          throw new Error("Failed to update agent configurations");
        }
      }
    } finally {
      releaseMutation();
    }
  }

  async updateComputeUsage(
    projectId: string,
    usage: ProjectComputeUsage
  ): Promise<ProjectView> {
    if (!isProjectComputeUsage(usage)) {
      throw new Error("Invalid project compute usage");
    }
    const runtime = await this.requireRuntime(projectId);
    const releaseMutation = this.storage.reserveProjectMutation(projectId);
    try {
      while (true) {
        await this.storage.waitForInvocationCommit(projectId);
        let retryAfterCommit = false;
        const result = await this.serializeProjectWrite(runtime, async () => {
          if (this.storage.hasActiveInvocationCommit(projectId)) {
            retryAfterCommit = true;
            return undefined;
          }
          const previous = runtime.state.computeUsage;
          runtime.state.computeUsage = structuredClone(usage);
          try {
            await this.storage.saveState(runtime.state);
          } catch (error) {
            runtime.state.computeUsage = previous;
            throw error;
          }
          return this.projectView(runtime.state);
        });
        if (result) return result;
        if (!retryAfterCommit) {
          throw new Error("Failed to update project compute usage");
        }
      }
    } finally {
      releaseMutation();
    }
  }

  async cancel(projectId: string, input: CancellationRequest = {}): Promise<ProjectView> {
    const runtime = await this.requireRuntime(projectId);
    const { state } = runtime;
    if (state.git?.enabled) {
      if (!this.collaborationRuntime) throw new Error("Git collaboration runtime is unavailable");
      await this.collaborationRuntime.cancelProject(state, input);
      return this.projectView(state);
    }
    if (
      (state.status === "completed" &&
        !this.storage.hasActiveInvocationCommit(projectId)) ||
      state.status === "cancelled" || state.status === "cancelling"
    ) {
      if (input.waitForSettlement) await this.waitForIdle(projectId);
      if (state.status === "cancelled" && !runtime.loop) await this.markCancellationSettled(runtime);
      return this.projectView(state);
    }
    state.cancelledBy = input.actor ?? "user";
    state.cancelReason = input.reason ?? "user_cancelled";
    state.cancellationRequestedAt = nowIso();
    state.cancellationSettledAt = undefined;
    state.status = "cancelling";
    state.phase = "cancelling";
    runtime.queueController?.abort();
    runtime.sleepController?.abort();
    runtime.controller?.abort();
    await this.emit(runtime, {
      type: "project.status",
      level: "warning",
      message: `Project cancellation requested by ${state.cancelledBy}: ${state.cancelReason}`,
      data: { actor: state.cancelledBy, reason: state.cancelReason, requestedAt: state.cancellationRequestedAt }
    });
    if (!state.currentAgent) {
      await this.finishCancellation(runtime);
    }
    if (!runtime.loop) await this.markCancellationSettled(runtime);
    if (input.waitForSettlement) await this.waitForIdle(projectId);
    return this.projectView(state);
  }

  async archive(projectId: string): Promise<ProjectView> {
    const runtime = await this.requireRuntime(projectId);
    const { state } = runtime;
    if (state.archivedAt) return this.projectView(state);
    if (state.git?.enabled && this.collaborationRuntime?.archiveProject) {
      await this.collaborationRuntime.archiveProject(state);
      return this.projectView(state);
    }
    if (state.status !== "cancelled" && state.status !== "completed") {
      throw new Error("Only completed or cancelled projects can be archived");
    }
    if (state.archivedAt) return this.projectView(state);
    state.archivedAt = nowIso();
    await this.emit(runtime, {
      type: "project.status",
      message: "Terminal project archived; all project data remains available",
      data: { archived: true, archivedAt: state.archivedAt }
    });
    return this.projectView(state);
  }

  async unarchive(projectId: string): Promise<ProjectView> {
    const runtime = await this.requireRuntime(projectId);
    const { state } = runtime;
    if (!state.archivedAt) return this.projectView(state);
    state.archivedAt = undefined;
    await this.emit(runtime, {
      type: "project.status",
      message: "Project restored from archive",
      data: { archived: false }
    });
    return this.projectView(state);
  }

  async deleteArchived(projectId: string, confirmation: string): Promise<void> {
    if (this.deletingProjects.has(projectId)) {
      throw new Error("Project deletion is already in progress");
    }
    const runtime = await this.requireRuntime(projectId);
    if (this.deletingProjects.has(projectId)) {
      throw new Error("Project deletion is already in progress");
    }
    const { state } = runtime;
    if (!state.archivedAt) {
      throw new Error("Only archived projects can be deleted");
    }
    if (confirmation !== state.title) {
      throw new Error("Project name confirmation does not match");
    }
    if (
      runtime.loop ||
      state.currentAgent ||
      state.activeInvocationId ||
      this.storage.hasActiveInvocationCommit(projectId)
    ) {
      throw new Error("Archived project is still settling and cannot be deleted");
    }
    this.deletingProjects.add(projectId);
    try {
      await runtime.eventQueue;
      if (!state.archivedAt) {
        throw new Error("Only archived projects can be deleted");
      }
      await this.storage.deleteProject(projectId);
      this.runtimes.delete(projectId);
      this.storage.hub.clearProject(projectId);
    } finally {
      this.deletingProjects.delete(projectId);
    }
  }

  async deleteArchivedConfirmed(projectId: string): Promise<void> {
    const runtime = await this.requireRuntime(projectId);
    await this.deleteArchived(projectId, runtime.state.title);
  }

  async waitForIdle(projectId: string): Promise<void> {
    const runtime = await this.requireRuntime(projectId);
    while (true) {
      await runtime.loop;
      await Promise.resolve();
      if (!runtime.loop) {
        return;
      }
    }
  }

  private startLoop(runtime: RuntimeProject): void {
    // Git collaboration has a separate authoritative scheduler. This guard is
    // intentionally centralized so a new or overlooked legacy call site can
    // never start AgentRunner for a Git-enabled project.
    if (runtime.state.git?.enabled) return;
    if (runtime.loop || this.shuttingDown) return;
    let canContinue = false;
    const loop = this.runLoop(runtime)
      .catch(async (error) => {
        if (runtime.state.status === "cancelling") {
          await this.finishCancellation(runtime);
          return;
        }
        await this.handleInvocationFailure(
          runtime,
          runtime.state.queuedAgent ??
            runtime.state.currentAgent ??
            initialAgent(runtime.state),
          newId("loop"),
          error as Error
        );
      })
      .then(() => { canContinue = true; })
      .finally(async () => {
        try {
          if (runtime.state.status === "cancelled") await this.markCancellationSettled(runtime);
        } finally {
          if (runtime.loop === loop) runtime.loop = undefined;
        }
        if (!canContinue) return;
        const refreshCanRun =
          runtime.mainInputRefresh !== undefined &&
          (runtime.state.status !== "paused" ||
            runtime.state.phase === "user-intervention-required");
        if (
          !this.shuttingDown &&
          (refreshCanRun ||
            runtime.state.status === "running" ||
            runtime.state.status === "retrying" ||
            runtime.state.status === "queued")
        ) {
          queueMicrotask(() => this.startLoop(runtime));
        }
      });
    runtime.loop = loop;
    // Observe failures while reporting an earlier error or persisting stop
    // settlement. Awaiters keep the original rejection; no new loop is queued.
    void loop.catch(error => {
        runtime.controller?.abort();
        runtime.queueController?.abort();
        runtime.sleepController?.abort();
        runtime.state.status = "interrupted";
        runtime.state.phase = "storage-recovery-required";
        runtime.state.lastError = redactTrace(error instanceof Error ? error.message : String(error));
        try {
          console.error("Project background execution stopped; failure reporting could not be persisted", {
            projectId: runtime.state.id, error: runtime.state.lastError
          });
        } catch { /* Logging cannot create another detached rejection. */ }
    });
  }

  private async restartMainWithUpdatedUserContext(
    runtime: RuntimeProject,
    supersededAgent?: AgentName,
    supersededInvocationId?: string
  ): Promise<void> {
    const refresh = runtime.mainInputRefresh;
    if (!refresh) return;

    while (refresh.pendingWrites > 0) {
      await refresh.writesSettled;
    }
    if (runtime.mainInputRefresh !== refresh) return;
    runtime.mainInputRefresh = undefined;

    const { state } = runtime;
    if (refresh.inputIds.length === 0 && state.status === "completed") return;
    if (isCancelling(state)) return;

    const staleRouteAgent =
      supersededAgent && !isSystemController(supersededAgent)
        ? supersededAgent
        : state.currentAgent && !isSystemController(state.currentAgent)
          ? state.currentAgent
          : state.queuedAgent && !isSystemController(state.queuedAgent)
            ? state.queuedAgent
            : undefined;
    if (staleRouteAgent && state.latestAssignment) {
      state.latestAssignment.overridden = true;
      state.latestAssignment.overrideReason =
        "A user requirement arrived during the Main invocation that produced this route; Main must reassess it with updated context first.";
    }
    if (
      state.phase === "user-intervention-required" &&
      state.userIntervention?.status === "pending"
    ) {
      state.userIntervention = undefined;
    }

    await this.replaceAgentExecution(
      runtime,
      SYSTEM_CONTROLLER_AGENT,
      "user-input",
      {
        sourceAgent: supersededAgent,
        sourceInvocationId: supersededInvocationId
      }
    );

    state.status = "queued";
    state.phase = `${SYSTEM_CONTROLLER_AGENT}:queued`;
    state.completedAt = undefined;
    state.currentAgent = undefined;
    state.queuedAgent = SYSTEM_CONTROLLER_AGENT;
    state.activeInvocationId = undefined;
    state.retryAt = undefined;
    state.interruptedAt = undefined;
    state.lastError = undefined;
    this.enterQueue(state);
    await this.emit(runtime, {
      type: "project.status",
      level: "warning",
      agent: SYSTEM_CONTROLLER_AGENT,
      message:
        "Running Main was superseded by new user input; Main is restarting with updated context",
      data: {
        inputIds: [...refresh.inputIds],
        requestedAt: refresh.requestedAt,
        supersededAgent,
        supersededInvocationId,
        staleRouteAgent,
        nextAgent: SYSTEM_CONTROLLER_AGENT
      }
    });
  }

  private async runLoop(runtime: RuntimeProject): Promise<void> {
    const { state } = runtime;
    while (true) {
      if (isCancelling(state)) {
        await this.finishCancellation(runtime);
        return;
      }
      if (state.status === "interrupting") {
        // The active invocation owns the transition to interrupted/Main
        // takeover. Never start a replacement Agent while its checkpoint is
        // still being committed.
        return;
      }
      if (state.status === "pausing") {
        state.status = "paused";
        state.phase = "paused";
        if (state.pauseRequest) state.pauseRequest.settledAt = nowIso();
        await this.emit(runtime, {
          type: "project.status",
          message: "Project paused at a safe agent boundary"
        });
        return;
      }
      if (
        runtime.mainInputRefresh &&
        (state.status !== "paused" ||
          state.phase === "user-intervention-required")
      ) {
        await this.restartMainWithUpdatedUserContext(runtime);
        continue;
      }
      if (this.shuttingDown) return;
      if (
        state.status === "paused" ||
        state.status === "interrupted" ||
        state.status === "cancelled" ||
        state.status === "completed"
      ) {
        return;
      }
      if (state.retryAt) {
        const waitMs = Math.max(0, Date.parse(state.retryAt) - Date.now());
        if (waitMs > 0) {
          runtime.sleepController = new AbortController();
          try {
            await abortableDelay(waitMs, runtime.sleepController.signal);
          } catch {
            // A control action wakes retry sleep so the loop can re-check state.
          } finally {
            runtime.sleepController = undefined;
          }
          continue;
        }
        beginWorkflowRecovery(state);
      }
      if (state.phase === "storage-recovery-required") {
        const recovery = state.workflowRecovery;
        try {
          await this.storage.retryFailedInvocationRecovery(state);
          // Rollback restores the exact original task/Session and may replace
          // the object. Keep the scheduler's retry audit separate from it.
          if (isCancelling(state) || ["cancelled", "interrupting", "interrupted"].includes(state.status)) continue;
          const originalAgent = state.queuedAgent ?? state.currentAgent ?? state.activeAgentExecution?.agent ?? initialAgent(state);
          state.queuedAgent = originalAgent;
          state.currentAgent = undefined;
          state.activeInvocationId = undefined;
          // A user Pause may arrive during the asynchronous journal restore.
          // Retain the original queued task without withdrawing that request.
          if (hasUserWorkflowPause(state)) continue;
          state.workflowRecovery = recovery;
          state.status = "queued";
          state.phase = `${originalAgent}:queued`;
          await this.emit(runtime, { type: "project.status", message: "原调用事务已恢复，继续原任务" });
        } catch (error) {
          if (hasUserWorkflowPause(state) || isCancelling(state) ||
            ["cancelled", "interrupting", "interrupted"].includes(state.status)) continue;
          state.status = "retrying";
          state.phase = "storage-recovery-required";
          state.lastError = redactTrace(error instanceof Error ? error.message : String(error));
          checkpointWorkflowRecovery(state);
          continue;
        }
      }
      if (state.userIntervention?.status === "pending") {
        state.status = "retrying";
        state.phase = "user-intervention-required";
        checkpointWorkflowRecovery(state);
        await this.storage.saveState(state);
        continue;
      }

      try {
        await this.applyWaitingSerialWorkflowAdjustments(runtime);
      } catch (error) {
        // Configuration publication retains its accepted request and original
        // continuation. A failed projection is not another failed Agent turn.
        await this.deferSerialWorkflowPublicationRecovery(runtime, error, {});
        continue;
      }
      if (this.shuttingDown || isCancelling(state) || isPauseRequested(state) || (state as ProjectState).status === "interrupting") continue;
      const agent =
        state.queuedAgent ??
        initialAgent(state);
      await this.ensureAgentQueued(runtime, agent);
      if (
        this.shuttingDown ||
        isCancelling(state) ||
        isPauseRequested(state) ||
        runtime.mainInputRefresh !== undefined
      ) {
        continue;
      }
      const queueController = new AbortController();
      runtime.queueController = queueController;
      let lease: AgentLease;
      try {
        const kind = agentKindForState(state, agent);
        lease = await this.scheduler.acquire(
          kind,
          state.id,
          state.queueEnteredAt!,
          state.queueOrder!,
          queueController.signal
        );
      } catch (error) {
        if (
          error instanceof AgentQueueAbortedError &&
          queueController.signal.aborted
        ) {
          continue;
        }
        throw error;
      } finally {
        if (runtime.queueController === queueController) {
          runtime.queueController = undefined;
        }
      }
      if (
        this.shuttingDown ||
        isCancelling(state) ||
        isPauseRequested(state) ||
        runtime.mainInputRefresh !== undefined
      ) {
        lease.release();
        continue;
      }
      try {
        await this.invokeAgent(runtime, agent, lease);
      } finally {
        // invokeAgent can fail before its own try/finally (for example while
        // persisting agent.execution.started). Never retain the role slot.
        lease.release();
      }
    }
  }

  private async ensureAgentQueued(
    runtime: RuntimeProject,
    agent: AgentName
  ): Promise<void> {
    const { state } = runtime;
    if (
      state.status === "queued" &&
      state.queuedAgent === agent &&
      state.phase === `${agent}:queued` &&
      state.queueEnteredAt &&
      isValidQueueOrder(state.queueOrder)
    ) {
      return;
    }
    state.status = "queued";
    state.phase = `${agent}:queued`;
    state.currentAgent = undefined;
    state.activeInvocationId = undefined;
    state.queuedAgent = agent;
    this.enterQueue(state);
    await this.emit(runtime, {
      type: "agent.queued",
      agent,
      message: `${agent} agent entered the shared role queue`
    });
  }

  private async invokeAgent(
    runtime: RuntimeProject,
    agent: AgentName,
    lease: AgentLease
  ): Promise<void> {
    const { state } = runtime;
    const definition = agentDefinitionFor(orchestrationFor(state), agent);
    const kind = agentKindForState(state, agent);
    if (kind === "main") {
      await this.storage.waitForProjectReadBarrier(state.id);
    }
    const invocationId = newId("inv");
    const invocationStartedAt = nowIso();
    state.status = "running";
    state.phase = `${agent}:running`;
    state.currentAgent = agent;
    state.queuedAgent = undefined;
    this.clearQueueEntry(state);
    state.activeInvocationId = invocationId;
    const agentExecution = await this.beginAgentExecution(
      runtime,
      agent,
      invocationId
    );
    let projectUserInputs: ProjectUserInput[] = [];
    if (kind === "main") {
      state.mainInvocationSeq += 1;
      projectUserInputs = state.userInputs.filter(
        (input) =>
          input.status === "pending" &&
          input.targetMainInvocation <= state.mainInvocationSeq
      );
    } else {
      // Main commits project-level requirement updates before routing the next
      // Worker. Keep those authoritative updates visible to every downstream
      // Worker instead of relying on Main to restate them perfectly in an
      // assignment. Inputs that are still pending remain Main-only until Main
      // has accepted them into the project flow.
      projectUserInputs = state.userInputs.filter(
        (input) => input.status === "delivered"
      );
    }
    const controller = new AbortController();
    runtime.controller = controller;
    runtime.interruptWaiters ??= new Map();
    runtime.activeInvocationTelemetry = {
      invocationId,
      agent,
      kind,
      startedAt: invocationStartedAt,
      lastActivityAt: invocationStartedAt,
      traceTail: [],
      activeTools: [],
      partialOutput: ""
    };
    const performanceTracker = new InvocationPerformanceTracker(
      invocationId,
      agent,
      Date.parse(invocationStartedAt),
      (performance) => this.storage.hub.publishPerformance(state.id, performance)
    );
    let traceQueue = Promise.resolve();
    let commitStarted = false;
    let leaseReleased = false;
    const activityTracker = new InvocationActivityTracker(Date.now());
    const agentWatchdogController = new AbortController();
    let agentWatchdogTask: Promise<void> | undefined;
    let agentWatchdogFailure: Error | undefined;
    let controlStagingPath: string | undefined;
    let controlCapabilityPath: string | undefined;
    let projectMcps: ProjectMcpLease | undefined;
    let projectMcpFailure: Error | undefined;
    let controlBridge: ControlActionBridge | undefined;
    let revokeControlCapability: (() => void) | undefined;
    let sealControlActions: (() => void) | undefined;
    let drainControlActions: (() => Promise<void>) | undefined;
    let resumeThreadId: string | undefined;
    let receivedControlActions: ControlActionEnvelope[] = [];
    let returnedHandoff: string | undefined;
    let controlStateVersion: number | undefined;
    let controlCapabilityHash: string | undefined;
    const serialWorkflow = kind === "main" && !state.git?.enabled && this.collaborationRuntime?.prepareSerialMainWorkflowAdjustment &&
      this.collaborationRuntime.getSerialMainWorkflowAdjustment && this.collaborationRuntime.stageSerialMainWorkflowAdjustment &&
      this.collaborationRuntime.publishSerialMainWorkflowAdjustment && this.collaborationRuntime.recordSerialMainWorkflowBoundary;
    const serialProposals = new Map<string, { base: WorkflowConfigurationVersion; proposal: WorkflowAdjustmentSnapshot }>();
    let terminalRepairActive = false;
    let workspaceBaseline: WorkspaceFileStamp[] | undefined;
    const releaseLease = () => {
      if (leaseReleased) return;
      leaseReleased = true;
      lease.release();
    };
    const stopAgentWatchdog = async () => {
      agentWatchdogController.abort();
      await agentWatchdogTask;
      agentWatchdogTask = undefined;
    };
    const onTrace: TraceSink = (
      traceKind,
      message,
      data
    ) => {
      const telemetry = runtime.activeInvocationTelemetry;
      const canonicalKind = data?.canonicalEvent &&
        typeof data.canonicalEvent === "object" &&
        !Array.isArray(data.canonicalEvent)
          ? (data.canonicalEvent as Record<string, unknown>).kind
          : undefined;
      const safeMessage = redactTrace(message).slice(
        canonicalKind === "assistant.message" ? -200_000 : -20_000
      );
      if (telemetry?.invocationId === invocationId) {
        telemetry.traceTail = [...telemetry.traceTail, `${traceKind}: ${safeMessage}`].slice(-80);
        if (traceKind === "output" || traceKind === "message") {
          telemetry.partialOutput = `${telemetry.partialOutput}${safeMessage}`.slice(-40_000);
        }
      }
      traceQueue = traceQueue.then(async () => {
        await this.storage.appendTrace(
          state,
          agent,
          invocationId,
          traceKind,
          safeMessage
        );
        const draft: EventDraft = {
          type: "agent.trace",
          level: traceKind === "stderr" ? "warning" : "info",
          agent,
          message: safeMessage,
          data: { ...data, traceKind, invocationId }
        };
        const gatewayUsageId =
          traceKind === "status" &&
          (message === "Gateway token usage" || message === "Gateway token usage unknown") &&
          typeof data?.usageId === "string" &&
          data.usageId.trim()
            ? data.usageId
            : undefined;
        const gatewayUsage = gatewayUsageId
          ? gatewayUsageReportFromData(data)
          : undefined;
        if (!gatewayUsage) {
          await this.emit(runtime, draft);
          return;
        }

        const releaseMutation = this.storage.reserveProjectMutation(state.id);
        try {
          await this.serializeProjectWrite(runtime, async () => {
            applyGatewayUsageReport(
              state.tokenUsage,
              agent,
              gatewayUsage,
              nowIso()
            );
            await this.storage.appendEvent(state, draft);
          });
        } finally {
          releaseMutation();
        }
      });
      return traceQueue;
    };
    try {
      await this.emit(runtime, {
        type: "invocation.started",
        agent,
        message: `${agent} invocation started`,
        data: { invocationId, kind, ...agentExecution }
      });
      const dispatch = buildAgentDispatchSummary(
        state,
        agent,
        projectUserInputs
      );
      await this.emit(runtime, {
        type: "agent.started",
        agent,
        message: `${agent} agent started`,
        data: {
          invocationId,
          ...agentExecution,
          model: state.agents[agent].model || "default",
          skills: state.agents[agent].skills,
          autoSkills: state.agents[agent].autoSkills,
          mcpServers: state.agents[agent].mcpServers.map(
            (server) => server.name
          ),
          kind,
          permission: state.agents[agent].permission,
          cycle: state.cycle,
          assignedTask: dispatch.assignedTask,
          successCriteria: dispatch.successCriteria,
          inputSources: dispatch.inputSources,
          ...(kind === "main"
            ? {
                mainInvocation: state.mainInvocationSeq,
                proactiveUserInputCount: projectUserInputs.length
              }
            : {})
        }
      });

      const skillPreparationStartedAt = performance.now();
      state.phase = `${agent}:preparing-skills`;
      await this.emit(runtime, { type: "agent.trace", agent, message: "正在准备选中的 Skills…",
        data: { invocationId, stage: "preparing-skills", selectedSkills: state.agents[agent].skills.length + state.agents[agent].autoSkills.length } });
      const allSkills = agent === "main" && state.orchestration.allowMainReconfiguration
        ? await this.skills.list()
        : await this.skills.forSelections([...state.agents[agent].skills, ...state.agents[agent].autoSkills]);
      const projectSkills = await materializeProjectSkills(
        this.storage.projectDir(state.id),
        state.skillDefinitions
      );
      const skillPaths = await this.skills.resolveConfigured(
        allSkills,
        state.agents[agent].skills,
        projectSkills
      );
      const autoSkillPaths = await this.skills.resolveConfigured(
        allSkills,
        state.agents[agent].autoSkills,
        projectSkills
      );
      state.phase = `${agent}:preparing-context`;
      await this.emit(runtime, { type: "agent.trace", agent, message: "Skills 准备完成，正在准备调用上下文…",
        data: { invocationId, stage: "preparing-context", skillPreparationMs: Math.round(performance.now() - skillPreparationStartedAt) } });
      const projectPath = this.storage.projectDir(state.id);
      const workspacePath = await this.storage.roleWorkspace(
        state.id,
        agent,
        invocationId
      );
      try {
        workspaceBaseline = (await scanWorkspace(workspacePath)).files;
      } catch {
        // A best-effort recovery index must not prevent the business invocation.
      }
      if (kind === "main") {
        state.mainCapabilities =
          state.pendingMainDecision?.capabilities ??
          buildMainCapabilitySnapshot(state);
        if (state.pendingMainDecision) {
          state.pendingMainDecision.capabilities = state.mainCapabilities;
        }
      }
      let workflowAuthoringPath: string | undefined;
      if (
        kind === "main" &&
        mainCanReconfigure(state)
      ) {
        const baseVersion = !state.git?.enabled ? this.collaborationRuntime?.prepareSerialMainWorkflowAdjustment?.(state).version : undefined;
        const proposalPath = await this.storage.writeMainAgentOrchestrationSnapshot(
          state.id,
          MAIN_AGENT_ORCHESTRATION_FILE,
          mainAgentOrchestrationDocument(
            state.id,
            orchestrationFor(state),
            state.agents,
            state.skillDefinitions,
            state.mcpDefinitions,
            baseVersion
          ),
          baseVersion ? () => this.collaborationRuntime!.isSerialWorkflowConfigurationCurrent?.(state, baseVersion) ??
            sameWorkflowConfigurationVersion(this.collaborationRuntime!.prepareSerialMainWorkflowAdjustment!(state).version, baseVersion) : undefined,
          invocationId
        );
        if (proposalPath !== path.join(workspacePath, MAIN_AGENT_ORCHESTRATION_FILE)) workflowAuthoringPath = proposalPath;
      }
      const mainContextTargetSeq =
        kind === "main" ? state.eventSeq : undefined;
      // Every active business execution owns a durable session until its
      // completion facts are committed. The configured preference only
      // controls reuse by the next independent execution.
      const durableSession = Boolean(agentExecution.executionId) || state.agents[agent].sessionPersistence || kind === "main";
      const taskSessionId = agentExecution.executionId;
      const taskSessionLegacyId = state.taskSessionIds?.[taskSessionId];
      const taskSessionRef = state.taskSessionRefs?.[taskSessionId];
      const agentSessionId = taskSessionLegacyId ?? state.agentSessionIds?.[agent] ??
        (kind === "main" ? state.agentSessionIds?.[SYSTEM_CONTROLLER_AGENT] : undefined);
      const agentContextSeq = kind === "main"
        ? state.mainContextSeq
        : state.agentSessionMeta?.[agent]?.contextSeq ?? 0;
      // Existing sessions already contain prior evidence. The current Inbox
      // always retains canonical requirements, state and file references so a
      // replacement can reconstruct context without replaying the transcript.
      const contextFullSync = durableSession && !agentSessionId && !taskSessionRef && !state.agentSessions?.[agent];
      const contextPackage = await this.storage.buildContextPackage(
        state,
        durableSession ? agentContextSeq : 0,
        contextFullSync,
        true
      );
      const context = contextPackage.text;
      if (kind === "main") {
        state.mainInvocationContext = buildMainInvocationContext(state) as unknown as Record<string, unknown>;
        await this.storage.saveState(state);
      }
      const inbox = buildInboxMarkdown(
        state,
        agent,
        invocationId,
        context,
        skillPaths,
        autoSkillPaths,
        projectUserInputs
      ) + (workflowAuthoringPath
        ? `\n\n## Workflow proposal location\nEdit only ${workflowAuthoringPath} for reconfiguration. The apply_workflow path "workflow.json" is a logical alias for this proposal; do not edit the user's root workflow.json.\n`
        : "");
      const inboxPath = await this.storage.writeInbox(
        state,
        agent,
        invocationId,
        inbox
      );
      const runtimePath = await this.storage.invocationRuntimePath(
        state.id,
        invocationId
      );
      await this.storage.writePublishedArtifactAccessManifest(
        state,
        invocationId,
        runtimePath
      );
      if (runtime.activeInvocationTelemetry?.invocationId === invocationId) {
        runtime.activeInvocationTelemetry.workspacePath = workspacePath;
        runtime.activeInvocationTelemetry.runtimePath = runtimePath;
      }
      const schemaPath = "";
      const controlCapability = randomUUID();
      const mainCapabilities = kind === "main"
        ? state.mainCapabilities ?? buildMainCapabilitySnapshot(state)
        : undefined;
      const control: ControlMcpRequest = {
        ...(workflowAuthoringPath ? { workflowAuthoringPath } : {}),
        stagingPath: path.join(runtimePath, "control-actions.json"),
        capability: controlCapability,
        capabilityHash: hashControlCapability(controlCapability),
        stateVersion: state.eventSeq,
        candidates: mainCapabilities?.routeCandidates ?? controlCandidates(state, agent, kind),
        decisionBy: kind === "main"
          ? "main"
          : state.agents[agent].decisionBy,
        allowUserIntervention: mainCapabilities?.canRequestUser ?? false,
        allowAgentOrchestrationReconfiguration:
          mainCapabilities?.canReconfigure ?? false,
        canComplete: mainCapabilities?.canComplete ??
          automaticTerminationWorkerCanComplete(state, agent),
        ...(mainCapabilities ? { mainCapabilities } : {}),
        requireBridge: true
      };
      const formalSerialState = this.collaborationRuntime?.serialProjectStateEnabled?.(state) === true;
      if (formalSerialState) { control.projectState = true; control.projectStateReconciliation = false; }
      controlStagingPath = control.stagingPath;
      controlCapabilityPath = path.join(runtimePath, "control-capability.json");
      await fs.writeFile(
        controlCapabilityPath,
        `${JSON.stringify({
          projectId: state.id,
          agent,
          invocationId,
          stateVersion: control.stateVersion,
          capabilityHash: control.capabilityHash,
          expiresAt: control.expiresAt
        })}\n`,
        { encoding: "utf8", mode: 0o600, flag: "wx" }
      );
      if (formalSerialState) control.nativeBackgroundJobs = true;
      controlStateVersion = control.stateVersion;
      controlCapabilityHash = control.capabilityHash;
      const controlService = new ControlActionService({
        nativeJobScope: { projectId: state.id, projectPath, workspacePath, agentId: agent, invocationId },
        projectId: state.id,
        agent,
        invocationId,
        stateVersion: control.stateVersion,
        capability: controlCapability,
        capabilityHash: control.capabilityHash,
        expiresAt: control.expiresAt,
        stagingPath: control.stagingPath,
        ...(formalSerialState ? { projectState: (input: unknown) => this.serializeProjectWrite(runtime, () =>
          this.collaborationRuntime!.requestSerialProjectState!(state, { projectId: state.id, agentId: agent, invocationId,
            executionId: agentExecution.executionId, kind }, input)) } : {}),
        revalidate: async (envelope, stagedActions) => {
          await this.serializeProjectWrite(runtime, async () => {
            if (
              state.activeInvocationId !== invocationId ||
              state.currentAgent !== agent ||
              state.status !== "running"
            ) {
              throw new ControlProtocolError("control action is no longer valid for the active invocation");
            }
            validateControlActionEnvelopes(
              state,
              agent,
              invocationId,
              [envelope],
              control.capabilityHash,
              control.stateVersion
            );
            validateControlActionSemantics(state, agent, kind, [envelope], control.allowAgentGitActions === true);
            if (envelope.action.tool === "apply_workflow") {
              if (!serialWorkflow) await this.readAndValidateAgentOrchestrationProposal(state);
              else {
                const canonical = stagedActions.find(action => action.action.tool === "apply_workflow") ?? envelope;
                const existing = this.collaborationRuntime!.getSerialMainWorkflowAdjustment!(state, canonical.invocationId, canonical.callId);
                if (existing) {
                  if (canonical.action.tool !== "apply_workflow" || canonical.action.rationale !== existing.explanation)
                    throw new ControlProtocolError("Original Main workflow call changed on replay");
                } else if (!serialProposals.has(canonical.callId)) {
                  const current = this.collaborationRuntime!.prepareSerialMainWorkflowAdjustment!(state);
                  const proposal = await this.readAndValidateAgentOrchestrationProposal(state, current.version);
                  serialProposals.set(canonical.callId, { base: current.version,
                    proposal: { orchestration: structuredClone(proposal.orchestration), ...credentialFreeAgentConfiguration(proposal) } });
                }
              }
            }
            if (envelope.action.tool === "select_display") {
              await validateDisplayArtifacts(this.storage, state, {
                primary: envelope.action.primary, items: envelope.action.items ?? []
              }, stagedActions);
            }
            validateCompletionDisplayContract(state, [
              ...stagedActions,
              envelope
            ]);
          });
        },
        onStaged: async envelope => {
          if (!serialWorkflow || envelope.action.tool !== "apply_workflow") return;
          await this.serializeProjectWrite(runtime, async () => {
            if (state.activeInvocationId !== invocationId || state.currentAgent !== agent || state.status !== "running")
              throw new ControlProtocolError("Main workflow call no longer owns its original live invocation");
            const prior = this.collaborationRuntime!.getSerialMainWorkflowAdjustment!(state, envelope.invocationId, envelope.callId);
            if (prior) return;
            const captured = serialProposals.get(envelope.callId);
            if (!captured) throw new ControlProtocolError("Main workflow call has no immutable validated original proposal");
            this.collaborationRuntime!.stageSerialMainWorkflowAdjustment!(state, { ...captured, envelope });
          });
        },
        onRejected: async (envelope, error) => {
          await this.emit(runtime, {
            type: "control.action.rejected",
            level: "warning",
            agent,
            message: "Invocation control action was rejected before staging",
            data: {
              ...(envelope ? controlAuditData(envelope) : {}),
              reason: redactTrace(error.message).slice(0, 1_000)
            }
          });
        }
      });
      revokeControlCapability = () => controlService.revoke();
      sealControlActions = () => controlService.seal();
      drainControlActions = () => controlService.drain();
      controller.signal.addEventListener("abort", revokeControlCapability, { once: true });
      try {
        controlBridge = await (
          this.config.controlBridgeFactory ?? startControlActionBridge
        )(controlService, runtimePath);
      } catch (error) {
        // Never start an Agent that cannot reach the authoritative control
        // service.  A prose handoff without a bridge can never commit a
        // route, user request, artifact selection, or completion action, so
        // fail before spawning the child and let the normal recovery path
        // preserve a retryable project state.
        const reason = redactTrace(
          error instanceof Error ? error.message : String(error)
        ).slice(0, 1_000);
        await this.emit(runtime, {
          type: "control.channel.unavailable",
          level: "error",
          agent,
          message: "控制通道不可用，未启动 Agent；项目保持可恢复状态",
          data: {
            invocationId,
            controlBridgeUnavailable: true,
            recoverable: true,
            reason
          }
        });
        throw new ControlProtocolError(
          `Invocation-local control bridge unavailable; Agent was not started${reason ? `: ${reason}` : ""}`
        );
      }
      if (controlBridge?.endpoint.path) control.bridgePath = controlBridge.endpoint.path;
      if (controlBridge?.endpoint.port !== undefined) {
        control.bridgePort = controlBridge.endpoint.port;
        control.bridgeHost = controlBridge.endpoint.host ?? "127.0.0.1";
      }
      resumeThreadId = durableSession ? agentSessionId : undefined;
      if (controller.signal.aborted || isCancelling(state)) {
        throw new AgentInterruptedError(
          "Agent invocation was cancelled during setup"
        );
      }

      const invocationGateway = state.agents[agent].gatewaySnapshot;
      if (this.gatewayStore && invocationGateway) {
        // Re-resolve immediately before every real invocation. A domain that
        // passed when the project snapshot was created may later be rebound.
        await this.gatewayStore.assertAllowedNetworkTarget(invocationGateway.url);
      }
      projectMcps = await startProjectMcps({
        definitions: state.mcpDefinitions,
        servers: state.agents[agent].mcpServers,
        projectPath,
        workspacePath,
        runtimePath,
        signal: controller.signal,
        onFailure: (error) => {
          projectMcpFailure = error;
          controller.abort(error);
        }
      });
      const invocationProject = projectSnapshotForAgent(
        state,
        agent,
        projectUserInputs.map((input) => input.id)
      );
      // Invocation-local loopback endpoints never replace durable project references.
      invocationProject.agents[agent].mcpServers = projectMcps.servers;
      const baseRunRequest: AgentRunRequest = {
        project: invocationProject,
        agent,
        kind,
        permission: state.agents[agent].permission,
        invocationId,
        inboxPath,
        projectPath,
        workspacePath,
        runtimePath,
        schemaPath,
        skillPaths,
        autoSkillPaths,
        availableSkills: allSkills,
        contextBackgrounds: legacyContextBackground(context),
        additionalContextIndexes: contextPackage.index ? [contextPackage.index] : [],
        ...(kind === "main" ? { workflowContext: { scope: "global" as const,
          configuredMcpServers: structuredClone(state.agents[agent].mcpServers) } } : {}),
        availableSkillPaths: [
          ...allSkills.map((skill) => skill.path),
          ...Object.values(projectSkills)
        ],
        ...(agent === "main" && state.orchestration.allowMainReconfiguration
          ? { toolCatalog: buildAgentToolCatalog(allSkills, state.skillDefinitions, state.mcpDefinitions) }
          : {}),
        taskSessionId,
        onExperimentWait: async (waiting) => {
          if (waiting) {
            state.phase = `${agent}:awaiting-experiment-result`;
            releaseLease();
            await this.emit(runtime, { type: "agent.experiment.waiting", agent,
              message: "Agent yielded its model turn; experiment results are pending and this task remains unfinished", data: { invocationId, executionId: taskSessionId } });
          } else {
            controller.signal.throwIfAborted();
            if (isPauseRequested(state) || isCancelling(state)) throw new AgentInterruptedError("Experiment event retained until project recovery");
            lease = await this.scheduler.acquire(kind, state.id, nowIso(), Date.now(), controller.signal);
            leaseReleased = false;
            state.phase = `${agent}:running`;
            activityTracker.beginModelWait();
            await this.emit(runtime, { type: "agent.experiment.resumed", agent,
              message: "Experiment event resumes the original task/session", data: { invocationId, executionId: taskSessionId } });
          }
        },
        sessionContinuity: "strict",
        ...(durableSession
          ? {
              ...(resumeThreadId ? { resumeThreadId } : {}),
              onDurableSessionStarted: (
                session: SessionRef,
                legacyId: string
              ) => {
                if (runtime.activeInvocationTelemetry?.invocationId === invocationId) {
                  runtime.activeInvocationTelemetry.threadId = legacyId;
                }
                return this.persistDurableSession(
                  runtime,
                  agent,
                  session,
                  legacyId,
                  agentExecution.executionId
                );
              }
            }
          : {}),
        control,
        onModelActivity: (activity) => {
          activityTracker.record(activity);
          if (runtime.activeInvocationTelemetry?.invocationId === invocationId) {
            runtime.activeInvocationTelemetry.lastActivityAt = nowIso();
            if (activity.kind === "tool") {
              runtime.activeInvocationTelemetry.activeTools = activityTracker
                .snapshot()
                .activeTools
                .map((tool) => tool.name ?? tool.callId)
                .slice(-40);
            }
          }
        },
        onTokenUsage: (usage) => {
          if ("inputTokens" in usage) {
            performanceTracker.recordUsage(usage);
            return onTrace("status", "Gateway token usage", {
              usageId: usage.usageId,
              protocol: usage.protocol,
              model: usage.model,
              inputTokens: usage.inputTokens,
              cachedInputTokens: usage.cachedInputTokens,
              outputTokens: usage.outputTokens,
              totalTokens: usage.totalTokens,
              usageStatus: "known",
              usageScope: "request"
            });
          }
          return onTrace("status", "Gateway token usage unknown", {
            usageId: usage.usageId,
            protocol: usage.protocol,
            model: usage.model,
            usageStatus: "unknown",
            reason: usage.reason,
            processingState: usage.processingState,
            usageScope: "request"
          });
        },
        onModelStreamEvent: (event) => performanceTracker.observe(event),
        onLiveHarnessEvent: (event) =>
          this.publishLiveHarnessEvent(state.id, agent, event),
        onHarnessAttemptReset: async (attempt) => {
          const replacedAttemptPerformance = performanceTracker.finish("incomplete");
          recordTerminalPerformance(state, replacedAttemptPerformance, false);
          await onTrace("status", "Harness attempt ended; continuing the original task", {
            diagnostic: true,
            invocationId,
            attempt: replacedAttemptPerformance.attempt,
            performance: replacedAttemptPerformance
          });
          this.storage.hub.resetInvocationAttempt(state.id, invocationId);
          performanceTracker.reset(attempt);
        }
      };
      this.collaborationRuntime?.decorateSerialWorkflowNotifications?.(state, baseRunRequest);
      const runTurn = async (request: AgentRunRequest): Promise<AgentRunResult> => {
        const runnerPromise = Promise.resolve().then(() => this.runner.run(request, onTrace, controller.signal));
        // Keep the underlying promise observed even if a force-termination
        // timeout wins the race; late runner rejection must never become an
        // unhandled process-level error or commit stale control actions.
        void runnerPromise.catch(() => undefined);
        const result = await this.awaitRunnerResult(runtime, invocationId, runtimePath, runnerPromise);
        // Native work has ended. Accepted callback persistence is server work
        // and must not be charged to model liveness or trigger a repair turn.
        await stopAgentWatchdog();
        await drainControlActions?.();
        return { ...result, controlActions: mergeControlActions(result.controlActions ?? [],
          await readStagedControlActions(control.stagingPath)) };
      };
      const ensureInvocationCanContinue = (): void => {
        if (projectMcpFailure) throw projectMcpFailure;
        if (agentWatchdogFailure) throw agentWatchdogFailure;
        if (isCancelling(state)) {
          throw new AgentInterruptedError("Cancelled after agent returned");
        }
        if (runtime.mainInputRefresh) {
          throw new AgentInterruptedError(
            "Agent invocation was superseded by user input for Main"
          );
        }
        if (state.interruptRequest?.invocationId === invocationId) {
          throw new AgentInterruptedError(
            "Agent invocation was interrupted by a user request"
          );
        }
      };

      // Gateway resolution, MCP startup, and request staging are host setup,
      // not model silence. Start the activity deadline only at the Runner
      // boundary so a loaded host cannot consume an Agent's model window.
      activityTracker.beginModelWait();
      agentWatchdogTask = this.monitorAgentActivity(
        runtime,
        agent,
        invocationId,
        activityTracker,
        onTrace,
        agentWatchdogController.signal
      ).catch((error) => {
        if (agentWatchdogController.signal.aborted) return;
        agentWatchdogFailure = error as Error;
        controller.abort();
      });

      ensureInvocationCanContinue();
      let result = await runTurn(baseRunRequest);
      // The native Harness turn has ended. Stop liveness accounting before
      // draining traces or validating/committing its result so server-side
      // bookkeeping cannot be misclassified as model inactivity.
      await stopAgentWatchdog();
      await traceQueue;
      ensureInvocationCanContinue();
      receivedControlActions = result.controlActions ?? [];
      returnedHandoff = result.handoff;
      if (!returnedHandoff?.trim()) {
        throw new ControlProtocolError(
          `${agent} returned no natural-language handoff`
        );
      }
      if (
        kind === "worker" && workerCanChooseRoute(state, agent) &&
        state.agents[agent].decisionBy === "agent" &&
        !terminalControlAction(receivedControlActions)
      ) {
        terminalRepairActive = true;
        state.routeRecovery = { agent, invocationId, status: "repairing" };
        state.phase = `${agent}:terminal-repair`;
        this.storage.hub.resetInvocationAttempt(state.id, invocationId);
        await onTrace("status", `${agent} returned its handoff; repairing the missing route without repeating its work`, {
          invocationId, terminalControlRepair: true, routeStatus: "missing"
        });
        try {
          const repairResult = await runTurn({
            ...baseRunRequest,
            resumeThreadId: result.threadId ?? state.taskSessionIds?.[agentExecution.executionId] ?? state.agentSessionIds?.[agent] ?? resumeThreadId,
            terminalControlRepair: { originalHandoff: returnedHandoff }
          });
          await traceQueue;
          ensureInvocationCanContinue();
          receivedControlActions = mergeControlActions(receivedControlActions, repairResult.controlActions ?? []);
          result = { ...repairResult, handoff: returnedHandoff, controlActions: receivedControlActions };
        } catch (repairError) {
          ensureInvocationCanContinue();
          await onTrace("status", "Worker route repair failed; preserving the handoff for a decision-only Main turn", {
            invocationId,
            diagnostic: redactTrace(repairError instanceof Error ? repairError.message : String(repairError)).slice(0, 2_000)
          });
        }
      }
      if (kind === "main" && !terminalControlAction(receivedControlActions)) {
        terminalRepairActive = true;
        const repairSessionId = result.threadId ??
          state.taskSessionIds?.[agentExecution.executionId] ??
          state.agentSessionIds?.[agent] ??
          resumeThreadId;
        if (!repairSessionId) {
          throw new MissingMainTerminalActionError(
            "Main omitted its terminal control action and no durable Session was available for repair"
          );
        }
        state.phase = `${agent}:terminal-repair`;
        this.storage.hub.resetInvocationAttempt(state.id, invocationId);
        await onTrace("status", "Main omitted its terminal action; resuming the same Session for an evidence-aware repair", {
          diagnostic: true,
          terminalControlRepair: true,
          invocationId,
          sessionId: repairSessionId
        });
        await traceQueue;
        let repairResult: AgentRunResult;
        try {
          const repairProject = projectSnapshotForAgent(
            state,
            agent,
            projectUserInputs.map((input) => input.id)
          );
          repairProject.agents[agent].mcpServers = projectMcps.servers;
          repairResult = await runTurn({
            ...baseRunRequest,
            project: repairProject,
            resumeThreadId: repairSessionId,
            terminalControlRepair: {
              originalHandoff: returnedHandoff
            }
          });
        } catch (repairError) {
          ensureInvocationCanContinue();
          throw new MissingMainTerminalActionError(
            `Main terminal-action repair failed: ${redactTrace(
              repairError instanceof Error ? repairError.message : String(repairError)
            ).slice(0, 2_000)}`
          );
        }
        await traceQueue;
        ensureInvocationCanContinue();
        receivedControlActions = mergeControlActions(
          receivedControlActions,
          repairResult.controlActions ?? []
        );
        if (!terminalControlAction(receivedControlActions)) {
          throw new MissingMainTerminalActionError(
            "Main terminal-action repair returned without route_to_agent, request_user, apply_workflow, or complete_project"
          );
        }
        result = {
          ...repairResult,
          handoff: returnedHandoff,
          controlActions: receivedControlActions
        };
      }
      sealControlActions?.();
      await drainControlActions?.();
      await projectMcps.close();
      if (projectMcpFailure) throw projectMcpFailure;
      revokeControlCapability?.();
      if (agentWatchdogFailure) throw agentWatchdogFailure;
      // The role slot protects the Harness process lifetime, not publication I/O.
      // A signalled process keeps the slot until its runner promise settles.
      releaseLease();
      await traceQueue;
      await this.serializeProjectWrite(runtime, () => {
        if (runtime.mainInputRefresh) {
          throw new AgentInterruptedError(
            "Agent invocation was superseded before commit by user input for Main"
          );
        }
        if (state.interruptRequest?.invocationId === invocationId) {
          throw new AgentInterruptedError(
            "Agent invocation was interrupted before its result could be committed"
          );
        }
        return this.storage.beginInvocationCommit(
          state,
          invocationId
        );
      });
      commitStarted = true;
      await this.commitAgentResult(
        runtime,
        agent,
        invocationId,
        result.threadId,
        mainContextTargetSeq,
        result.handoff,
        receivedControlActions,
        control.capabilityHash,
        controlStateVersion
      );
      const completedPerformance = performanceTracker.finish("completed");
      recordTerminalPerformance(state, completedPerformance, true);
      const completion = await this.emit(runtime, {
        type: "invocation.completed",
        agent,
        message: `${agent} invocation committed`,
        data: {
          invocationId,
          executionId: agentExecution.executionId,
          ...(kind === "main" ? { mainInvocationSeq: state.mainInvocationSeq } : {}),
          kind,
          phase: state.phase,
          status: state.status,
          performance: completedPerformance
        }
      });
      this.storage.hub.finishInvocation(state.id, invocationId, "completed");
      if (isCancelling(state)) {
        await this.serializeProjectWrite(runtime, () =>
          this.storage.rollbackInvocationCommit(state, invocationId)
        );
        commitStarted = false;
        await this.finishCancellation(runtime);
        this.clearLiveInvocationSoon(state.id, invocationId);
        return;
      }
      await this.serializeProjectWrite(runtime, () =>
        this.storage.commitInvocationCommit(state, invocationId, {
          abortOnControl:
            state.status === "completed" ||
            (kind === "main" && state.latestAssignment?.target === "finish")
        })
      );
      commitStarted = false;
      const workflowAction = receivedControlActions.find(action => action.action.tool === "apply_workflow");
      if (serialWorkflow && workflowAction) {
        const record = this.collaborationRuntime!.getSerialMainWorkflowAdjustment!(state, invocationId, workflowAction.callId);
        if (!record) throw new ControlProtocolError("Committed Main workflow call lost its exact original accepted record");
        try {
          this.collaborationRuntime!.recordSerialMainWorkflowBoundary!(state, record.requestId, completion);
          await this.applyWaitingSerialWorkflowAdjustments(runtime);
        } catch (error) {
          // The original invocation is already durably committed. Publication
          // recovery cannot turn that successful result into a failed turn or
          // consume another task attempt. Keep its unstarted continuation.
          await this.deferSerialWorkflowPublicationRecovery(runtime, error, { invocationId, requestId: record.requestId });
        }
      }
      this.clearLiveInvocationSoon(state.id, invocationId);
      if (controlStagingPath) await fs.rm(controlStagingPath, { force: true });
      if (controlCapabilityPath) await fs.rm(controlCapabilityPath, { force: true });
    } catch (error) {
      revokeControlCapability?.();
      await drainControlActions?.();
      const invocationError = projectMcpFailure ?? agentWatchdogFailure ?? (
        error instanceof Error ? error : new Error(String(error))
      );
      const invocationErrorMessage = redactTrace(invocationError.message).slice(0, 4_000);
      const incompletePerformance = performanceTracker.finish("incomplete");
      releaseLease();
      await traceQueue;
      if (controlStagingPath) await fs.rm(controlStagingPath, { force: true });
      if (controlCapabilityPath) await fs.rm(controlCapabilityPath, { force: true });
      const workerControlRecovery =
        kind === "worker" && invocationError instanceof ControlProtocolError;
      const mainTerminalRepairRecovery =
        kind === "main" && invocationError instanceof MissingMainTerminalActionError;
      const mainAgentOrchestrationControlRecovery =
        kind === "main" &&
        receivedControlActions.some(
          (envelope) => envelope.action.tool === "apply_workflow"
        );
      if (
        receivedControlActions.length &&
        !workerControlRecovery &&
        !mainTerminalRepairRecovery &&
        !mainAgentOrchestrationControlRecovery
      ) {
        for (const envelope of receivedControlActions) {
          await this.emit(runtime, {
            type: "control.action.rejected",
            level: "warning",
            agent,
            message: `${envelope.action.tool} action rejected during invocation commit`,
            data: {
              ...controlAuditData(envelope),
              reason: invocationErrorMessage.slice(0, 1_000)
            }
          });
        }
      }
      if (commitStarted) {
        try {
          await this.serializeProjectWrite(runtime, () =>
            this.storage.rollbackInvocationCommit(state, invocationId)
          );
          commitStarted = false;
          if (controlStagingPath) await fs.rm(controlStagingPath, { force: true });
          if (controlCapabilityPath) await fs.rm(controlCapabilityPath, { force: true });
        } catch (rollbackError) {
          state.status = "retrying";
          state.phase = "storage-recovery-required";
          state.currentAgent = undefined;
          state.queuedAgent = agent;
          state.activeInvocationId = undefined;
          state.lastError = (
            `Invocation commit failed: ${invocationErrorMessage}; ` +
            `rollback also failed: ${redactTrace(
              rollbackError instanceof Error ? rollbackError.message : String(rollbackError)
            ).slice(0, 1_000)}. ` +
            "原事务日志已保留，正在自动重试恢复。"
          ).slice(0, 6_000);
          this.storage.markInvocationRecoveryRequired(
            state.id,
            new Error(state.lastError)
          );
          checkpointWorkflowRecovery(state);
          return;
        }
      }
      recordTerminalPerformance(state, incompletePerformance, false);
      const incompleteStreams = this.storage.hub.finishInvocation(
        state.id,
        invocationId,
        "incomplete"
      );
      const incompleteOutput = incompleteStreams.at(-1);
      const incompleteContent = incompleteStreams
        .map((stream) => stream.content.trim())
        .filter(Boolean)
        .join("\n\n")
        .slice(0, 200_000);
      if (incompleteOutput && incompleteContent) {
        await onTrace("message", incompleteContent, {
          invocationId,
          incompleteOutput: true,
          canonicalEvent: {
            schemaVersion: 1,
            eventId: `${invocationId}:incomplete:${incompleteOutput.attempt}`,
            seq: 0,
            timestamp: nowIso(),
            invocationId,
            harnessId: incompleteOutput.harnessId,
            kind: "assistant.message",
            phase: "completed",
            attempt: incompleteOutput.attempt,
            itemId: `assistant-incomplete-${incompleteOutput.attempt}`,
            sourceType: "assistant.incomplete",
            message: incompleteContent,
            ...(incompleteStreams.some((stream) => stream.truncated) ||
              incompleteStreams.reduce((sum, stream) => sum + stream.content.length, 0) > 200_000
              ? { messageTruncated: true }
              : {})
          }
        });
        await traceQueue;
      }
      this.clearLiveInvocationSoon(state.id, invocationId);
      if (
        state.interruptRequest?.invocationId === invocationId &&
        !isCancelling(state)
      ) {
        await this.finalizeUserInterrupt(
          runtime,
          agent,
          invocationId,
          invocationError
        );
        return;
      }
      if (isCancelling(state)) {
        await this.finishCancellation(runtime);
        return;
      }
      if (isPauseRequested(state)) {
        state.currentAgent = undefined;
        state.activeInvocationId = undefined;
        state.queuedAgent = agent;
        state.status = "paused";
        state.phase = "paused";
        if (state.pauseRequest) state.pauseRequest.settledAt = nowIso();
        await this.emit(runtime, {
          type: "project.status",
          message: "Project paused after the failed invocation was rolled back"
        });
        return;
      }
      if (runtime.mainInputRefresh) {
        await this.restartMainWithUpdatedUserContext(
          runtime,
          agent,
          invocationId
        );
        return;
      }
      await this.emit(runtime, {
        type: "invocation.failed",
        level: "error",
        agent,
        message: `${agent} invocation failed`,
        data: {
          invocationId,
          kind,
          errorType: redactTrace(invocationError.name).slice(0, 128),
          error: invocationErrorMessage.slice(-4_000),
          performance: incompletePerformance,
          ...harnessFailureMetadata(invocationError)
        }
      });
      if (workerControlRecovery) {
        await this.preserveWorkerControlFailure(
          runtime,
          agent,
          invocationId,
          returnedHandoff,
          receivedControlActions,
          controlCapabilityHash,
          controlStateVersion,
          invocationError
        );
        return;
      }
      if (mainTerminalRepairRecovery) {
        await this.preserveMainTerminalRepairFailure(
          runtime,
          agent,
          invocationId,
          returnedHandoff,
          receivedControlActions,
          controlCapabilityHash,
          controlStateVersion,
          invocationError
        );
        return;
      }
      if (mainAgentOrchestrationControlRecovery) {
        await this.preserveMainAgentOrchestrationControlFailure(
          runtime,
          invocationId,
          receivedControlActions,
          invocationError
        );
        return;
      }
      if (this.shuttingDown) {
        await this.preserveAgentCheckpointForShutdown(runtime, agent);
        return;
      }
      await this.handleInvocationFailure(
        runtime,
        agent,
        invocationId,
        invocationError
      );
    } finally {
      sealControlActions?.();
      revokeControlCapability?.();
      await drainControlActions?.();
      await projectMcps?.close();
      await stopAgentWatchdog();
      await controlBridge?.close();
      releaseLease();
      if (!this.storage.hasActiveInvocationCommit(state.id)) {
        try {
          const checkpoint = await this.storage.writeWorkspaceCheckpoint(state, agent, invocationId, state.status, workspaceBaseline);
          state.workspaceCheckpoints = [...(state.workspaceCheckpoints ?? []), checkpoint].slice(-50);
          await this.emit(runtime, {
            type: "workspace.checkpoint.saved", agent,
            message: checkpoint.fileCount ? "Recoverable workspace output indexed; files remain unverified" : "Invocation ended without new workspace output",
            data: { checkpoint }
          });
        } catch (checkpointError) {
          await this.emit(runtime, {
            type: "agent.trace", agent, level: "warning",
            message: "Workspace checkpoint could not be indexed",
            data: { invocationId, reason: redactTrace(String(checkpointError)).slice(0, 1_000) }
          });
        }
      }
      runtime.interruptWaiters?.delete(invocationId);
      if (runtime.activeInvocationTelemetry?.invocationId === invocationId) {
        runtime.activeInvocationTelemetry = undefined;
      }
      runtime.controller = undefined;
    }
  }

  private async preserveWorkerControlFailure(
    runtime: RuntimeProject,
    agent: AgentName,
    invocationId: string,
    handoff: string | undefined,
    actions: ControlActionEnvelope[],
    capabilityHash: string | undefined,
    expectedStateVersion: number | undefined,
    error: Error
  ): Promise<void> {
    const { state } = runtime;
    const safeError = redactTrace(error.message).slice(0, 4_000);
    const safeActions = actions.filter((envelope) => envelope.action.tool === "publish_artifact");
    if (safeActions.length) {
      try {
        validateControlActionEnvelopes(
          state,
          agent,
          invocationId,
          safeActions,
          capabilityHash,
          expectedStateVersion
        );
        validateControlActionSemantics(state, agent, "worker", safeActions);
        await this.applyNonTerminalControlActions(runtime, agent, invocationId, safeActions);
      } catch (safeActionError) {
        for (const envelope of safeActions) {
          await this.emit(runtime, {
            type: "control.action.rejected",
            level: "warning",
            agent,
            message: `${envelope.action.tool} action rejected during Worker recovery`,
            data: {
              ...controlAuditData(envelope),
              reason: redactTrace(safeActionError instanceof Error ? safeActionError.message : String(safeActionError)).slice(0, 1_000)
            }
          });
        }
      }
    }
    for (const envelope of actions.filter((item) => item.action.tool !== "publish_artifact")) {
      await this.emit(runtime, {
        type: "control.action.rejected",
        level: "warning",
        agent,
        message: `${envelope.action.tool} action rejected during Worker recovery`,
        data: {
          ...controlAuditData(envelope),
          reason: safeError.slice(0, 1_000)
        }
      });
    }

    if (handoff?.trim()) {
      const handoffText = naturalHandoffMarkdown(state, agent, invocationId, handoff);
      state.latestHandoff = {
        agent,
        invocationId,
        markdown: handoffText,
        body: handoff ?? "The Agent completed without a textual handoff.",
        excerpt: handoffExcerpt(handoff),
        updatedAt: nowIso()
      };
      const handoffPath = await this.storage.writeHandoff(state, agent, invocationId, handoffText);
      await this.emit(runtime, {
        type: "handoff.saved",
        agent,
        message: `${agent} natural-language handoff saved during control recovery`,
        data: { invocationId, path: handoffPath, excerpt: handoffExcerpt(handoff) }
      });
    }

    state.lastError = safeError;
    state.currentAgent = undefined;
    state.activeInvocationId = undefined;
    await this.queueMainDecision(
      runtime,
      agent,
      invocationId,
      "exception",
      orchestrationFor(state).agents
        .map((definition) => definition.name)
        .filter((name) => name !== SYSTEM_CONTROLLER_AGENT),
      true,
      `Worker control action could not be committed. Main must recover this handoff without automatically rerunning ${agent}: ${safeError}`
    );
  }

  private async preserveMainTerminalRepairFailure(
    runtime: RuntimeProject,
    agent: AgentName,
    invocationId: string,
    handoff: string | undefined,
    actions: ControlActionEnvelope[],
    capabilityHash: string | undefined,
    expectedStateVersion: number | undefined,
    error: Error
  ): Promise<void> {
    const { state } = runtime;
    const safeError = redactTrace(error.message);
    const safeActions = actions.filter((envelope) =>
      envelope.action.tool === "publish_artifact" ||
      envelope.action.tool === "select_display"
    );
    if (safeActions.length) {
      try {
        validateControlActionEnvelopes(
          state,
          agent,
          invocationId,
          safeActions,
          capabilityHash,
          expectedStateVersion
        );
        validateControlActionSemantics(state, agent, "main", safeActions);
        await this.applyNonTerminalControlActions(
          runtime,
          agent,
          invocationId,
          safeActions
        );
      } catch (safeActionError) {
        for (const envelope of safeActions) {
          await this.emit(runtime, {
            type: "control.action.rejected",
            level: "warning",
            agent,
            message: `${envelope.action.tool} action rejected during Main terminal repair recovery`,
            data: {
              ...controlAuditData(envelope),
              reason: redactTrace(
                safeActionError instanceof Error
                  ? safeActionError.message
                  : String(safeActionError)
              ).slice(0, 1_000)
            }
          });
        }
      }
    }

    if (handoff?.trim()) {
      const handoffText = naturalHandoffMarkdown(
        state,
        agent,
        invocationId,
        handoff
      );
      state.latestHandoff = {
        agent,
        invocationId,
        markdown: handoffText,
        body: handoff ?? "The Agent completed without a textual handoff.",
        excerpt: handoffExcerpt(handoff),
        updatedAt: nowIso()
      };
      const handoffPath = await this.storage.writeHandoff(
        state,
        agent,
        invocationId,
        handoffText
      );
      await this.emit(runtime, {
        type: "handoff.saved",
        agent,
        message: "Main natural-language handoff saved while awaiting a terminal decision",
        data: {
          invocationId,
          path: handoffPath,
          excerpt: handoffExcerpt(handoff)
        }
      });
    }

    state.lastError = safeError;
    state.retryAt = undefined;
    state.currentAgent = undefined;
    state.activeInvocationId = undefined;
    state.queuedAgent = agent;
    state.status = "retrying";
    state.phase = "missing-terminal-action";
    this.clearQueueEntry(state);
    await this.emit(runtime, {
      type: "project.status",
      level: "warning",
      agent,
      message: "Main did not commit a terminal decision after one same-Session repair; the original task is scheduled for automatic recovery",
      data: {
        invocationId,
        recoverable: true,
        repairAttempted: true,
        sessionId: state.agentSessionIds?.[agent]
      }
    });
  }

  private async preserveMainAgentOrchestrationControlFailure(
    runtime: RuntimeProject,
    invocationId: string,
    actions: ControlActionEnvelope[],
    error: Error
  ): Promise<void> {
    const { state } = runtime;
    const safeError = redactTrace(error.message).slice(0, 4_000);
    for (const envelope of actions.filter(
      (item) => item.action.tool === "apply_workflow"
    )) {
      await this.emit(runtime, {
        type: "control.action.rejected",
        level: "warning",
        agent: SYSTEM_CONTROLLER_AGENT,
        message: "Main orchestration change was rejected during commit",
        data: {
          ...controlAuditData(envelope),
          reason: safeError.slice(0, 1_000)
        }
      });
    }
    await this.emit(runtime, {
      type: "workflow.reconfiguration.rejected",
      level: "warning",
      agent: SYSTEM_CONTROLLER_AGENT,
      message: "Main must reread the server-generated orchestration snapshot and retry",
      data: {
        invocationId,
        reason: safeError,
        statePreserved: true
      }
    });
    state.lastError = safeError;
    const previous = state.pendingMainDecision;
    state.currentAgent = undefined;
    state.activeInvocationId = undefined;
    state.queuedAgent = SYSTEM_CONTROLLER_AGENT;
    this.clearQueueEntry(state);
    await this.endActiveAgentExecution(runtime, "failed", invocationId);
    const candidates = previous?.candidateAgents ??
      workflowAgentCandidates(orchestrationFor(state), SYSTEM_CONTROLLER_AGENT);
    await this.queueMainDecision(
      runtime,
      previous?.sourceAgent ?? SYSTEM_CONTROLLER_AGENT,
      invocationId,
      "workflow-reconfiguration-rejected",
      candidates,
      previous?.allowAnyAgent ?? false,
      `The proposed Workflow was rejected and no state was changed. Main must preserve and correct its workflow.json draft${state.git?.enabled ? "" : ` against the current reference at ${MAIN_AGENT_ORCHESTRATION_CURRENT_FILE} relative to the directory containing its authoring proposal`} before retrying. Validation error: ${safeError}`
    );
  }

  private async preserveAgentCheckpointForShutdown(
    runtime: RuntimeProject,
    agent: AgentName
  ): Promise<void> {
    const { state } = runtime;
    state.currentAgent = undefined;
    state.activeInvocationId = undefined;
    state.queuedAgent = agent;
    state.status = "running";
    state.phase = `${agent}:interrupted-for-shutdown`;
    await this.emit(runtime, {
      type: "project.status",
      level: "warning",
      agent,
      message:
        `${agent} was interrupted by server shutdown and will be ` +
        "automatically queued after recovery"
    });
  }

  private async commitSerialMainWorkflowContinuation(
    runtime: RuntimeProject, invocationId: string, handoff: string | undefined,
    terminal: ControlActionEnvelope, record: WorkflowAdjustmentRecord
  ): Promise<void> {
    const { state } = runtime, source = record.source;
    if (source.kind !== "main" || source.scope?.kind !== "serial" || source.invocationId !== invocationId ||
      source.callId !== terminal.callId || source.scope.agentExecutionId !== state.activeAgentExecution?.id ||
      source.scope.mainInvocationSeq !== state.mainInvocationSeq)
      throw new ControlProtocolError("Workflow continuation lost its exact original Main task identity");
    await this.endActiveAgentExecution(runtime, "completed", invocationId);
    state.pendingMainDecision = {
      sourceAgent: SYSTEM_CONTROLLER_AGENT, sourceInvocationId: invocationId,
      decisionPlan: defaultDecisionPlan(SYSTEM_CONTROLLER_AGENT), requestedAt: nowIso(),
      candidateAgents: workflowAgentCandidates(state.orchestration, SYSTEM_CONTROLLER_AGENT), reason: "exception",
      diagnostic: `工作流修改请求 ${record.requestId} 已接受，等待原调用结果提交后复核实际状态。`
    };
    state.mainCapabilities = buildMainCapabilitySnapshot(state);
    state.pendingMainDecision.capabilities = state.mainCapabilities;
    this.refreshSerialWorkflowMainDecision(state, record);
    state.mainInvocationContext = undefined;
    state.latestAssignment = {
      target: SYSTEM_CONTROLLER_AGENT, message: "读取原工作流修改请求的实际结果并继续原任务。",
      rationale: record.explanation, successCriteria: ["根据原修改请求的真实状态和当前正式配置继续。"],
      invocationId, updatedAt: nowIso()
    };
    const markdown = naturalHandoffMarkdown(state, SYSTEM_CONTROLLER_AGENT, invocationId,
      handoff ?? "Main workflow proposal accepted; publication is awaiting the original result commit.");
    state.latestHandoff = { agent: SYSTEM_CONTROLLER_AGENT, invocationId, markdown,
      excerpt: handoffExcerpt(handoff ?? markdown), updatedAt: nowIso() };
    const handoffPath = await this.storage.writeHandoff(state, SYSTEM_CONTROLLER_AGENT, invocationId, markdown);
    state.currentAgent = undefined;
    state.activeInvocationId = undefined;
    state.queuedAgent = SYSTEM_CONTROLLER_AGENT;
    if (!isPauseRequested(state) && !isCancelling(state) && state.status !== "interrupting") {
      state.status = "queued";
      state.phase = `${SYSTEM_CONTROLLER_AGENT}:queued`;
      this.enterQueue(state);
    }
    this.createPendingAgentExecution(state, SYSTEM_CONTROLLER_AGENT, "main-decision",
      { sourceAgent: SYSTEM_CONTROLLER_AGENT, sourceInvocationId: invocationId });
    await this.emit(runtime, { type: "handoff.saved", agent: SYSTEM_CONTROLLER_AGENT,
      message: "Main workflow proposal handoff saved", data: { invocationId, path: handoffPath, excerpt: state.latestHandoff.excerpt } });
    await this.emit(runtime, { type: "control.action.committed", agent: SYSTEM_CONTROLLER_AGENT,
      message: "Main workflow proposal accepted; configuration publication is pending",
      data: { ...controlAuditData(terminal), requestId: record.requestId, status: record.status } });
    await this.emit(runtime, { type: "agent.completed", agent: SYSTEM_CONTROLLER_AGENT,
      message: "Main completed its workflow proposal decision", data: { invocationId } });
    await this.emit(runtime, { type: "main.assignment.queued", agent: SYSTEM_CONTROLLER_AGENT,
      message: "Main continuation retained to read the original workflow request result",
      data: { sourceAgent: SYSTEM_CONTROLLER_AGENT, sourceInvocationId: invocationId, requestId: record.requestId, status: record.status } });
  }

  private async applyWaitingSerialWorkflowAdjustments(runtime: RuntimeProject): Promise<void> {
    const coordinator = this.collaborationRuntime, { state } = runtime;
    if (state.git?.enabled || !coordinator?.pendingSerialMainWorkflowAdjustments || !coordinator.publishSerialMainWorkflowAdjustment) return;
    if (this.storage.hasActiveInvocationCommit(state.id)) return;
    // Read only surviving committed original results before reserving the
    // write barrier used for configuration projection and publication.
    await coordinator.recoverSerialMainWorkflowBoundaries?.(state);
    const releaseMutation = this.storage.reserveProjectMutation(state.id);
    try {
      await this.serializeProjectWrite(runtime, async () => {
        if (this.storage.hasActiveInvocationCommit(state.id)) return;
        // An applied journal revision may outlive a failed file projection.
        // Restore it before dispatch even when no request remains pending.
        // Startup alone replays original completion events; doing that while
        // holding this write barrier would wait on the barrier itself.
        const restored = await coordinator.recoverSerialWorkflowConfiguration?.(state, { recoverResultBoundaries: false });
        if (restored?.changed) {
          this.refreshSerialWorkflowRuntimeConfiguration(state);
          if (state.pendingMainDecision) {
            state.pendingMainDecision.reason = "workflow-reconfigured";
            state.pendingMainDecision.diagnostic = `已恢复正式工作流版本 ${state.workflowRevision}，保留原任务、会话及执行计数。`;
          }
          await this.storage.saveState(state);
        }
        const pending = (coordinator.pendingSerialWorkflowAdjustments?.(state) ?? coordinator.pendingSerialMainWorkflowAdjustments!(state))
          .sort((a, b) => Number(a.source.kind !== "user") - Number(b.source.kind !== "user"));
        if (!pending.length) return;
        for (const original of pending) {
          const impact = workflowAdjustmentRuntimeImpact(original);
          const publish = original.source.kind === "user" ? coordinator.publishSerialWorkflowAdjustment!.bind(coordinator)
            : coordinator.publishSerialMainWorkflowAdjustment!.bind(coordinator);
          const record = await publish(state, original.requestId, {
            sessions: state,
            waitingReason: request => {
              if (this.shuttingDown || isCancelling(state)) return "等待项目恢复正常运行后复核原修改请求";
              if (isPauseRequested(state) || state.status === "interrupting" || state.status === "interrupted" || state.userIntervention)
                return "等待原项目的暂停、中断或人工干预结束；保留原修改请求";
              if (state.status === "completed") return "原项目已经结束，修改请求保留且尚未发布";
              const source = request.source, task = state.activeAgentExecution;
              const removal = removedWorkflowAgentTaskReason(state, request.proposal.agents);
              if (removal) return removal;
              if (task?.startedAt && (source.kind === "main" && source.scope?.kind === "serial" && task.id === source.scope.agentExecutionId ||
                impact.rootNodeChanged({ kind: "agent", nodeId: task.agent, agentId: task.agent })))
                return "等待原受影响任务的实际执行和结果提交边界";
              if (state.activeInvocationId && state.currentAgent && impact.rootNodeChanged({ kind: "agent", nodeId: state.currentAgent, agentId: state.currentAgent }))
                return "等待原受影响调用的实际结束及结果提交";
              return undefined;
            }
          });
          if (record.status === "applied") {
            this.refreshSerialWorkflowRuntimeConfiguration(state);
            await this.storage.appendEvent(state, { type: "workflow.reconfigured", agent: SYSTEM_CONTROLLER_AGENT,
              message: "The original accepted workflow proposal is now applied",
              data: { requestId: record.requestId, source: record.source.kind, status: record.status, version: record.currentVersion, rationale: record.explanation } });
          }
          this.refreshSerialWorkflowMainDecision(state, record);
        }
        await this.storage.saveState(state);
      });
    } finally {
      releaseMutation();
    }
  }

  private async deferSerialWorkflowPublicationRecovery(runtime: RuntimeProject, error: unknown, identity: { requestId?: string; invocationId?: string }): Promise<void> {
    const { state } = runtime;
    if (!isCancelling(state) && !hasUserWorkflowPause(state) &&
      !["interrupting", "interrupted", "completed", "cancelled"].includes(state.status)) {
      state.status = "retrying";
      state.phase = "workflow-publication-recovery-required";
    }
    state.lastError = redactTrace(error instanceof Error ? error.message : String(error)).slice(0, 4_000);
    await this.emit(runtime, { type: "project.status", level: "warning",
      message: "Workflow request accepted; publication recovery will retry automatically", data: { ...identity, reason: state.lastError } });
    this.startLoop(runtime);
  }

  private refreshSerialWorkflowRuntimeConfiguration(state: ProjectState): void {
    state.executionCounts ??= {};
    state.tokenUsage.byAgent ??= {};
    for (const agent of Object.keys(state.agents)) {
      state.runCounts[agent] ??= 0;
      state.executionCounts[agent] ??= 0;
      state.tokenUsage.byAgent[agent] ??= emptyTokenUsageTotals();
    }
    state.mainCapabilities = buildMainCapabilitySnapshot(state);
    if (state.pendingMainDecision) {
      state.pendingMainDecision.candidateAgents = workflowAgentCandidates(state.orchestration, SYSTEM_CONTROLLER_AGENT);
      state.pendingMainDecision.capabilities = state.mainCapabilities;
    }
  }

  private refreshSerialWorkflowMainDecision(state: ProjectState, record: WorkflowAdjustmentRecord): boolean {
    if (record.source.kind !== "main" || state.pendingMainDecision?.sourceInvocationId !== record.source.invocationId) return false;
    state.pendingMainDecision.reason = record.status === "applied" ? "workflow-reconfigured" :
      record.status === "pending" ? "exception" : "workflow-reconfiguration-rejected";
    const transition = record.history.at(-1);
    state.pendingMainDecision.diagnostic = `工作流修改请求 ${record.requestId}：${record.status}。原修改说明：${record.explanation}。` +
      `${record.waitingReason ?? transition?.reason ?? ""}${transition?.note ? `。撤回说明：${transition.note}` : ""}`;
    state.pendingMainDecision.candidateAgents = workflowAgentCandidates(state.orchestration, SYSTEM_CONTROLLER_AGENT);
    state.mainCapabilities = buildMainCapabilitySnapshot(state);
    state.pendingMainDecision.capabilities = state.mainCapabilities;
    return true;
  }

  private async commitAgentOrchestrationReconfiguration(
    runtime: RuntimeProject,
    invocationId: string,
    handoff: string | undefined,
    terminal: ControlActionEnvelope,
    proposal: AgentOrchestrationProposal
  ): Promise<void> {
    const { state } = runtime;
    if (proposal.orchestration.schemaVersion === 3 && (!state.git?.enabled || !this.collaborationRuntime)) {
      throw new Error("组内 Workflow 重配置要求 Git collaboration 和可信递归运行时");
    }
    const previousOrchestration = state.orchestration;
    const affectedGroupIds = affectedCollaborationGroupIds(previousOrchestration, proposal.orchestration);
    if (state.git?.enabled && affectedGroupIds.length) {
      this.collaborationRuntime?.assertWorkflowRevisionEditable(state, affectedGroupIds);
    }
    const previousNames = new Set(
      previousOrchestration.agents.map((definition) => definition.name)
    );
    const nextNames = proposal.orchestration.agents.map(
      (definition) => definition.name
    );
    const nextNameSet = new Set(nextNames);
    const addedAgents = nextNames.filter((name) => !previousNames.has(name));
    const removedAgents = [...previousNames].filter(
      (name) => !nextNameSet.has(name)
    );
    const changedSkills = changedProjectSkills(
      state.skillDefinitions,
      proposal.skillDefinitions
    );
    const changedMcps = changedProjectMcps(
      state.mcpDefinitions,
      proposal.mcpDefinitions
    );
    const usesChangedSkill = (selection: string) =>
      selection.startsWith("project:") &&
      changedSkills.includes(selection.slice("project:".length));
    // A graph or resource edit must not change an existing Agent's session.
    // Keep the change set for audit and reject edits that cannot be applied
    // safely to a native session already owned by that Agent.
    const changedAgents: AgentName[] = nextNames.filter((name) => {
      if (!previousNames.has(name)) return false;
      return JSON.stringify(state.agents[name]) !== JSON.stringify(proposal.agents[name]) ||
        [...proposal.agents[name].skills, ...proposal.agents[name].autoSkills]
          .some(usesChangedSkill) ||
        proposal.agents[name].mcpServers.some(
          (server) => server.project !== undefined && changedMcps.includes(server.project)
        );
    });
    for (const name of changedAgents) {
      if ((state.agentSessions?.[name] || state.agentSessionIds?.[name]) &&
        (state.agents[name].harness ?? DEFAULT_HARNESS_ID) !== (proposal.agents[name].harness ?? DEFAULT_HARNESS_ID)) {
        throw new Error(
          `Agent ${name} 的 Harness 发生变化，但现有 session 必须保留；` +
          "不能跨 Harness 重建同一 Agent 会话，请保留 Harness 或删除该 Agent 实体后重建"
        );
      }
    }
    const resetSessions = new Set(addedAgents);

    // Ensure the common project workspace exists before switching authoritative state.
    // A failed preparation can leave only an inert directory, never a partial
    // Agent orchestration commit or a deleted historical workspace.
    for (const name of addedAgents) {
      await this.storage.roleWorkspace(state.id, name, invocationId);
    }

    await this.endActiveAgentExecution(runtime, "completed", invocationId);

    const previousRunCounts = state.runCounts;
    const previousExecutionCounts = state.executionCounts ?? {};
    const previousFailureCounts = state.workerFailureCounts ?? {};
    const previousFailureHistory = state.agentFailureHistory ?? {};
    const previousSessionIds = state.agentSessionIds ?? {};
    const previousSessions = state.agentSessions ?? {};
    const previousSessionMeta = state.agentSessionMeta ?? {};

    state.orchestration = proposal.orchestration;
    state.agents = proposal.agents;
    state.skillDefinitions = proposal.skillDefinitions;
    state.mcpDefinitions = proposal.mcpDefinitions;
    state.runCounts = Object.fromEntries(
      nextNames.map((name) => [name, previousRunCounts[name] ?? 0])
    );
    state.executionCounts = Object.fromEntries(
      nextNames.map((name) => [name, previousExecutionCounts[name] ?? 0])
    );
    state.workerFailureCounts = Object.fromEntries(
      nextNames.map((name) => [
        name,
        resetSessions.has(name) ? 0 : previousFailureCounts[name] ?? 0
      ])
    );
    state.agentFailureHistory = Object.fromEntries(
      nextNames.map((name) => [
        name,
        resetSessions.has(name)
          ? []
          : structuredClone(previousFailureHistory[name] ?? [])
      ])
    );

    const nextSessionIds: Record<AgentName, string> = {};
    const nextSessions: Record<AgentName, SessionRef> = {};
    const nextSessionMeta: NonNullable<ProjectState["agentSessionMeta"]> = {};
    for (const name of nextNames) {
      const reset = resetSessions.has(name);
      if (!reset && previousSessionIds[name]) {
        nextSessionIds[name] = previousSessionIds[name];
      }
      if (!reset && previousSessions[name]) {
        nextSessions[name] = previousSessions[name];
      }
      const previousMeta = previousSessionMeta[name];
      nextSessionMeta[name] = reset
        ? {
            generation:
              (previousMeta?.generation ?? (previousNames.has(name) ? 0 : -1)) +
              1,
            contextSeq: 0,
            resumeFailureCount: 0
          }
        : structuredClone(
            previousMeta ?? {
              generation: 0,
              contextSeq: 0,
              resumeFailureCount: 0
            }
          );
    }
    state.agentSessionIds = nextSessionIds;
    state.agentSessions = nextSessions;
    state.agentSessionMeta = nextSessionMeta;
    if (resetSessions.has(SYSTEM_CONTROLLER_AGENT)) {
      state.mainContextSeq = 0;
    }

    state.tokenUsage.byAgent ??= {};
    for (const name of nextNames) {
      state.tokenUsage.byAgent[name] ??= emptyTokenUsageTotals();
    }
    if (state.tokenUsage.threadUsageCursors) {
      state.tokenUsage.threadUsageCursors = Object.fromEntries(
        Object.entries(state.tokenUsage.threadUsageCursors).filter(([key]) => {
          try {
            const parsed = JSON.parse(key) as unknown;
            return !(
              Array.isArray(parsed) &&
              typeof parsed[0] === "string" &&
              (resetSessions.has(parsed[0]) || removedAgents.includes(parsed[0]))
            );
          } catch {
            return true;
          }
        })
      );
    }

    if (
      state.display &&
      [state.display.primary, ...state.display.items].some(
        (item) => !nextNameSet.has(item.agent)
      )
    ) {
      state.display = undefined;
      state.displayError =
        "The previous display referenced an Agent removed by Agent orchestration reconfiguration.";
    }
    state.userIntervention = undefined;
    state.pendingMainDecision = {
      sourceAgent: SYSTEM_CONTROLLER_AGENT,
      sourceInvocationId: invocationId,
      decisionPlan: defaultDecisionPlan(SYSTEM_CONTROLLER_AGENT),
      requestedAt: nowIso(),
      candidateAgents: workflowAgentCandidates(
        proposal.orchestration,
        SYSTEM_CONTROLLER_AGENT
      ),
      reason: "workflow-reconfigured",
      diagnostic: terminal.action.tool === "apply_workflow"
        ? terminal.action.rationale
        : undefined
    };
    state.mainCapabilities = buildMainCapabilitySnapshot(state);
    state.pendingMainDecision.capabilities = state.mainCapabilities;
    state.mainInvocationContext = undefined;
    state.latestAssignment = {
      target: SYSTEM_CONTROLLER_AGENT,
      message: "Review the committed Agent orchestration and continue under its new configuration.",
      rationale:
        terminal.action.tool === "apply_workflow"
          ? terminal.action.rationale
          : "Agent orchestration reconfigured",
      successCriteria: [
        "Main continues using the newly committed Agent orchestration configuration."
      ],
      invocationId,
      updatedAt: nowIso()
    };
    const mainHandoff = handoff
      ? naturalHandoffMarkdown(
          state,
          SYSTEM_CONTROLLER_AGENT,
          invocationId,
          handoff
        )
      : naturalHandoffMarkdown(
          state,
          SYSTEM_CONTROLLER_AGENT,
          invocationId,
          "Agent orchestration committed."
        );
    state.latestHandoff = {
      agent: SYSTEM_CONTROLLER_AGENT,
      invocationId,
      markdown: mainHandoff,
        body: handoff ?? "Agent orchestration committed.",
      excerpt: handoffExcerpt(handoff ?? mainHandoff),
      updatedAt: nowIso()
    };
    const handoffPath = await this.storage.writeHandoff(
      state,
      SYSTEM_CONTROLLER_AGENT,
      invocationId,
      mainHandoff
    );

    state.currentAgent = undefined;
    state.activeInvocationId = undefined;
    state.queuedAgent = SYSTEM_CONTROLLER_AGENT;
    state.status = "queued";
    state.phase = `${SYSTEM_CONTROLLER_AGENT}:queued`;
    this.enterQueue(state);
    this.createPendingAgentExecution(
      state,
      SYSTEM_CONTROLLER_AGENT,
      "main-decision",
      {
        sourceAgent: SYSTEM_CONTROLLER_AGENT,
        sourceInvocationId: invocationId
      }
    );

    if (state.git?.enabled) {
      if (!this.collaborationRuntime) {
        throw new Error("Git collaboration runtime is unavailable");
      }
      // Persist only after the complete in-memory proposal (topology, Agent
      // registry, sessions, counters and next Main assignment) is coherent.
      // The runtime publishes this exact state together with revision N+1.
      await this.collaborationRuntime.saveWorkflowRevision(state, {
        orchestration: proposal.orchestration,
        affectedGroupIds,
        requestId: `main-workflow-${state.id}-${invocationId}`
      });
    }

    await this.emit(runtime, {
      type: "handoff.saved",
      agent: SYSTEM_CONTROLLER_AGENT,
      message: "Main Agent-orchestration handoff saved",
      data: {
        invocationId,
        path: handoffPath,
        excerpt: handoffExcerpt(handoff ?? mainHandoff)
      }
    });
    await this.emit(runtime, {
      type: "control.action.committed",
      agent: SYSTEM_CONTROLLER_AGENT,
      message: "apply_workflow action committed",
      data: controlAuditData(terminal)
    });
    await this.emit(runtime, {
      type: "agent.completed",
      agent: SYSTEM_CONTROLLER_AGENT,
      message: "Main completed its Agent-orchestration decision",
      data: { invocationId }
    });
    await this.emit(runtime, {
      type: "workflow.reconfigured",
      agent: SYSTEM_CONTROLLER_AGENT,
      message: "Main committed a new Agent orchestration configuration",
      data: {
        invocationId,
        addedAgents,
        removedAgents,
        changedAgents,
        changedProjectSkills: changedSkills,
        changedProjectMcps: changedMcps,
        agentCount: nextNames.length,
        rationale:
          terminal.action.tool === "apply_workflow"
            ? terminal.action.rationale
            : undefined
      }
    });
    await this.emit(runtime, {
      type: "main.assignment.queued",
      agent: SYSTEM_CONTROLLER_AGENT,
      message: "Main queued to continue under the reconfigured Agent orchestration",
      data: {
        sourceAgent: SYSTEM_CONTROLLER_AGENT,
        sourceInvocationId: invocationId,
        reason: "workflow-reconfigured",
        candidateAgents: state.pendingMainDecision?.candidateAgents,
        capabilities: state.mainCapabilities,
        controlMode: state.mainCapabilities.controlMode,
        mainAutonomous: state.mainCapabilities.controlMode === "autonomous",
        mainWakeOnce: true
      }
    });
    await this.emit(runtime, {
      type: "agent.queued",
      agent: SYSTEM_CONTROLLER_AGENT,
      message: "Main agent queued after workflow reconfiguration"
    });
  }

  private async commitAgentResult(
    runtime: RuntimeProject,
    agent: AgentName,
    invocationId: string,
    threadId?: string,
    mainContextTargetSeq?: number,
    handoff?: string,
    controlActions: ControlActionEnvelope[] = [],
    capabilityHash?: string,
    expectedStateVersion?: number
  ): Promise<void> {
    const { state } = runtime;
    const definition = agentDefinitionFor(orchestrationFor(state), agent);
    const kind = agentKindForState(state, agent);
    validateControlActionEnvelopes(
      state,
      agent,
      invocationId,
      controlActions,
      capabilityHash,
      expectedStateVersion
    );
    validateControlActionSemantics(state, agent, kind, controlActions);
    validateCompletionDisplayContract(state, controlActions);

    const terminal = terminalControlAction(controlActions);
    // finish_task is the Agent's own completion receipt. It ends this native
    // turn but deliberately does not choose a group/project outcome; routing
    // continues through the existing Workflow below.
    const routingTerminal = terminal?.action.tool === "finish_task" ? undefined : terminal;
    if (kind === "worker" && state.routeRecovery?.invocationId === invocationId && routingTerminal?.action.tool === "route_to_agent") {
      state.routeRecovery.status = "repaired";
    }
    const serialMainCall = kind === "main" && !state.git?.enabled && routingTerminal?.action.tool === "apply_workflow" &&
      this.collaborationRuntime?.prepareSerialMainWorkflowAdjustment && this.collaborationRuntime.getSerialMainWorkflowAdjustment &&
      this.collaborationRuntime.stageSerialMainWorkflowAdjustment && this.collaborationRuntime.publishSerialMainWorkflowAdjustment &&
      this.collaborationRuntime.recordSerialMainWorkflowBoundary;
    const serialMainRecord = serialMainCall
      ? this.collaborationRuntime!.getSerialMainWorkflowAdjustment!(state, invocationId, routingTerminal!.callId) : undefined;
    if (serialMainCall && (!serialMainRecord || serialMainRecord.source.kind !== "main" || serialMainRecord.source.scope?.kind !== "serial" ||
      routingTerminal!.action.tool !== "apply_workflow" || serialMainRecord.explanation !== routingTerminal!.action.rationale))
      throw new ControlProtocolError("Main workflow commit requires the exact original accepted proposal and explanation");
    const orchestrationProposal =
      kind === "main" && routingTerminal?.action.tool === "apply_workflow" && !serialMainRecord
        ? await this.readAndValidateAgentOrchestrationProposal(state)
        : undefined;

    for (const envelope of controlActions) {
      await this.emit(runtime, {
        type: "control.action.staged",
        agent,
        message: `${envelope.action.tool} action staged for invocation commit`,
        data: controlAuditData(envelope)
      });
    }

    state.turn += 1;
    state.runCounts[agent] += 1;
    state.consecutiveFailures = 0;
    state.workerFailureCounts ??= {};
    state.workerFailureCounts[agent] = 0;
    if (state.harnessRecoveryAttempts) state.harnessRecoveryAttempts[agent] = 0;
    finishWorkflowRecovery(state);
    state.agentFailureHistory ??= {};
    // Keep Main's recovery diagnostics across successful turns. A manual
    // recovery resumes the same durable thread and must not erase the failure
    // context that led to the pause. Worker histories reset after recovery.
    if (kind !== "main") state.agentFailureHistory[agent] = [];
    state.lastError = undefined;
    state.retryAt = undefined;

    await this.applyNonTerminalControlActions(
      runtime,
      agent,
      invocationId,
      controlActions
    );
    const controlDecision = kind === "main" && routingTerminal && !orchestrationProposal && !serialMainRecord
      ? mainDecisionFromControl(state, routingTerminal, handoff, controlActions)
      : undefined;
    if (kind === "main") {
      if (!state.agentSessionIds?.[SYSTEM_CONTROLLER_AGENT] && threadId) {
        state.agentSessionIds = { ...(state.agentSessionIds ?? {}), [SYSTEM_CONTROLLER_AGENT]: threadId };
      }
      const deliveredAt = nowIso();
      const deliveredInputs = state.userInputs.filter(
        (input) =>
          input.status === "pending" &&
          input.targetMainInvocation <= state.mainInvocationSeq
      );
      for (const input of deliveredInputs) {
        input.status = "delivered";
        input.deliveredAt = deliveredAt;
        input.deliveredInvocationId = invocationId;
      }
      if (deliveredInputs.length > 0) {
        await this.emit(runtime, {
          type: "user.input.delivered",
          agent: SYSTEM_CONTROLLER_AGENT,
          message: `${deliveredInputs.length} project-level user input${deliveredInputs.length === 1 ? " was" : "s were"} delivered to Main`,
          data: {
            invocationId,
            mainInvocation: state.mainInvocationSeq,
            inputIds: deliveredInputs.map((input) => input.id)
          }
        });
      }
      const pendingDecision = state.pendingMainDecision;
      const pendingCapabilities = state.mainCapabilities ??
        pendingDecision?.capabilities ??
        buildMainCapabilitySnapshot(state);
      if (mainContextTargetSeq !== undefined) {
        state.mainContextSeq = Math.max(
          state.mainContextSeq,
          mainContextTargetSeq
        );
      }
      if (kind === "main" && threadId) {
        state.agentSessionMeta = {
          ...(state.agentSessionMeta ?? {}),
          [agent]: {
            generation: state.agentSessionMeta?.[agent]?.generation ?? 0,
            contextSeq: Math.max(
              state.agentSessionMeta?.[agent]?.contextSeq ?? 0,
              mainContextTargetSeq ?? state.eventSeq
            ),
            resumeFailureCount: 0
          }
        };
      } else if (kind !== "main" && state.agents[agent].sessionPersistence && threadId) {
        state.agentSessionMeta = {
          ...(state.agentSessionMeta ?? {}),
          [agent]: {
            generation: state.agentSessionMeta?.[agent]?.generation ?? 0,
            contextSeq: Math.max(
              state.agentSessionMeta?.[agent]?.contextSeq ?? 0,
              state.eventSeq
            ),
            resumeFailureCount: 0
          }
        };
      }
      if (serialMainRecord && routingTerminal?.action.tool === "apply_workflow") {
        await this.commitSerialMainWorkflowContinuation(runtime, invocationId, handoff, routingTerminal, serialMainRecord);
        return;
      }
      if (orchestrationProposal && routingTerminal?.action.tool === "apply_workflow") {
        await this.commitAgentOrchestrationReconfiguration(
          runtime,
          invocationId,
          handoff,
          routingTerminal,
          orchestrationProposal
        );
        return;
      }
      if (!routingTerminal) {
        const mainHandoff = naturalHandoffMarkdown(
          state,
          agent,
          invocationId,
          handoff ?? "Main completed this native Harness turn without recording an orchestration decision."
        );
        state.latestHandoff = {
          agent,
          invocationId,
          markdown: mainHandoff,
        body: handoff ?? "Main completed without recording an orchestration decision.",
          excerpt: handoffExcerpt(handoff ?? mainHandoff),
          updatedAt: nowIso()
        };
        const mainHandoffPath = await this.storage.writeHandoff(
          state,
          agent,
          invocationId,
          mainHandoff
        );
        await this.emit(runtime, {
          type: "handoff.saved",
          agent,
          message: "Main natural-language handoff saved",
          data: {
            invocationId,
            path: mainHandoffPath,
            excerpt: handoffExcerpt(handoff ?? mainHandoff)
          }
        });
        for (const envelope of controlActions) {
          await this.emit(runtime, {
            type: "control.action.committed",
            agent,
            message: `${envelope.action.tool} action committed`,
            data: controlAuditData(envelope)
          });
        }
        await this.emit(runtime, {
          type: "agent.completed",
          agent,
          message: "Main completed its native Harness turn without an orchestration decision",
          data: {
            invocationId,
            threadId,
            decisionRecorded: false,
            ordinaryContinuation: true
          }
        });
        if (isCancelling(state)) return;

        // Preserve the exact pending capability snapshot. Candidate derivation
        // belongs to the Main control-mode implementation, not this lifecycle
        // continuation.
        state.currentAgent = undefined;
        state.activeInvocationId = undefined;
        state.queuedAgent = SYSTEM_CONTROLLER_AGENT;
        if (isPauseRequested(state)) {
          this.clearQueueEntry(state);
        } else {
          state.status = "queued";
          this.enterQueue(state);
        }
        state.phase = `${SYSTEM_CONTROLLER_AGENT}:queued`;
        await this.emit(runtime, {
          type: "main.assignment.queued",
          level: "warning",
          agent: SYSTEM_CONTROLLER_AGENT,
          message: "Main will continue in the same durable Session with its full configured capabilities",
          data: {
            sourceAgent: pendingDecision?.sourceAgent,
            sourceInvocationId: pendingDecision?.sourceInvocationId,
            reason: pendingDecision?.reason ?? "decision-not-recorded",
            candidateAgents: pendingDecision?.candidateAgents ?? [],
            mainWakeOnce: true,
            decisionRecorded: false,
            ordinaryContinuation: true
          }
        });
        await this.emit(runtime, {
          type: "agent.queued",
          agent: SYSTEM_CONTROLLER_AGENT,
          message: "Main queued for an ordinary continuation turn",
          data: {
            sourceInvocationId: invocationId,
            decisionRecorded: false,
            ordinaryContinuation: true
          }
        });
        return;
      }
      const rawDecision = controlDecision!;
      const decision = resolveMainDecision(state, rawDecision);
      if (state.pendingMainDecision?.reason === "route-missing" && state.routeRecovery && routingTerminal?.action.tool === "route_to_agent") {
        state.routeRecovery.status = "repaired";
      }
      if (decision.display) {
        decision.display = await this.applyDisplaySelection(runtime, decision.display);
      }
      state.pendingMainDecision = undefined;
      const completionDeferredForUserInput =
        decision.nextAgent === "finish" &&
        state.userInputs.some((input) => input.status === "pending");
      if (completionDeferredForUserInput) {
        decision.overridden = true;
        decision.overrideReason =
          "A project-level user requirement arrived during this Main invocation; completion is deferred until the next Main invocation processes it.";
      }
      state.latestAssignment = {
        target: decision.nextAgent,
        message: decision.message,
        rationale: decision.rationale,
        successCriteria: [...decision.successCriteria],
        ...(decision.display ? { display: structuredClone(decision.display) } : {}),
        invocationId,
        updatedAt: nowIso(),
        ...(decision.overridden ? { overridden: true, overrideReason: decision.overrideReason } : {})
      };
      const mainHandoff = handoff
        ? naturalHandoffMarkdown(state, agent, invocationId, handoff)
        : mainHandoffMarkdown(state, invocationId, decision);
      state.latestHandoff = {
        agent,
        invocationId,
        markdown: mainHandoff,
        body: handoff ?? decision.message,
        excerpt: handoffExcerpt(handoff ?? mainHandoff),
        updatedAt: nowIso()
      };
      const mainHandoffPath = await this.storage.writeHandoff(
        state,
        agent,
        invocationId,
        mainHandoff
      );
      await this.emit(runtime, {
        type: "handoff.saved",
        agent,
        message: "Main natural-language handoff saved",
        data: {
          invocationId,
          path: mainHandoffPath,
          excerpt: handoffExcerpt(handoff ?? mainHandoff)
        }
      });
      for (const envelope of controlActions) {
        await this.emit(runtime, {
          type: "control.action.committed",
          agent,
          message: `${envelope.action.tool} action committed`,
          data: controlAuditData(envelope)
        });
      }
      if (isCancelling(state)) return;
      await this.emit(runtime, {
        type: "agent.completed",
        agent,
        message: "Main completed its routing decision",
        data: { invocationId, threadId }
      });
      if (isCancelling(state)) return;
      await this.emit(runtime, {
        type: "main.assignment.committed",
        agent,
        message:
          decision.nextAgent === "user"
            ? `Main requested user intervention: ${decision.message}`
            : `Main assigned ${decision.nextAgent}: ${decision.message}`,
        data: {
          ...decision,
          invocationId,
          ...(pendingDecision
            ? {
                decisionSourceAgent: pendingDecision.sourceAgent,
                decisionSourceInvocationId:
                  pendingDecision.sourceInvocationId,
                decisionPlan: pendingDecision.decisionPlan
              }
            : {})
        }
      });
      if (isCancelling(state)) return;

      if (
        decision.nextAgent === "finish" &&
        pendingCapabilities.controlMode === "weak-branch"
      ) {
        await this.queueMainDecision(
          runtime,
          pendingDecision?.sourceAgent ?? SYSTEM_CONTROLLER_AGENT,
          invocationId,
          "termination",
          ["finish"],
          true,
          "A weak-branch choice selected finish. Perform a separate autonomous termination review against the full requirement and project evidence."
        );
        return;
      }
      if (
        decision.nextAgent === SYSTEM_CONTROLLER_AGENT &&
        pendingCapabilities.controlMode === "weak-branch"
      ) {
        await this.queueMainDecision(
          runtime,
          pendingDecision?.sourceAgent ?? SYSTEM_CONTROLLER_AGENT,
          invocationId,
          "deterministic-route",
          [],
          true,
          "A weak-branch choice routed to Main. Continue in a separate autonomous Main review."
        );
        return;
      }

      if (decision.nextAgent === "user") {
        await this.endActiveAgentExecution(runtime, "completed", invocationId);
        const intervention = {
          id: newId("usr"),
          status: "pending" as const,
          requestedAt: nowIso(),
          requestedBy: SYSTEM_CONTROLLER_AGENT,
          requestedInvocationId: invocationId,
          requestKind: "main" as const,
          message: decision.message,
          rationale: decision.rationale,
          successCriteria: [...decision.successCriteria],
          ...(pendingDecision
            ? { pendingDecision: structuredClone(pendingDecision) }
            : {})
        };
        state.userIntervention = intervention;
        state.currentAgent = undefined;
        state.activeInvocationId = undefined;
        state.queuedAgent = SYSTEM_CONTROLLER_AGENT;
        state.status = "retrying";
        state.phase = "user-intervention-required";
        this.clearQueueEntry(state);
        await this.emit(runtime, {
          type: "user.intervention.requested",
          level: "warning",
          agent: SYSTEM_CONTROLLER_AGENT,
          message: "Main requested user information; the pending task is retained and other eligible work may continue",
          data: {
            requestId: intervention.id,
            request: intervention.message,
            rationale: intervention.rationale,
            successCriteria: intervention.successCriteria
          }
        });
        return;
      }

      if (completionDeferredForUserInput) {
        state.mainCapabilities = buildMainCapabilitySnapshot(state);
        await this.replaceAgentExecution(
          runtime,
          SYSTEM_CONTROLLER_AGENT,
          "user-input",
          {
            sourceAgent: SYSTEM_CONTROLLER_AGENT,
            sourceInvocationId: invocationId
          }
        );
        state.currentAgent = undefined;
        state.activeInvocationId = undefined;
        state.queuedAgent = SYSTEM_CONTROLLER_AGENT;
        state.status = "queued";
        state.phase = `${SYSTEM_CONTROLLER_AGENT}:queued`;
        this.enterQueue(state);
        await this.emit(runtime, {
          type: "project.status",
          level: "warning",
          agent: SYSTEM_CONTROLLER_AGENT,
          message:
            "Completion deferred because a new user requirement must be processed by Main",
          data: {
            pendingUserInputIds: state.userInputs
              .filter((input) => input.status === "pending")
              .map((input) => input.id)
          }
        });
        await this.emit(runtime, {
          type: "main.assignment.queued",
          agent: SYSTEM_CONTROLLER_AGENT,
          message: "Main 已因新的用户需求重新排队；当前输入将在本次接管中处理",
          data: {
            sourceAgent: SYSTEM_CONTROLLER_AGENT,
            sourceInvocationId: invocationId,
            reason: "user",
            pendingUserInputIds: state.userInputs
              .filter((input) => input.status === "pending")
              .map((input) => input.id),
            capabilities: state.mainCapabilities,
            controlMode: state.mainCapabilities.controlMode,
            mainAutonomous: state.mainCapabilities.controlMode === "autonomous",
            mainWakeOnce: true
          }
        });
        return;
      }

      if (decision.nextAgent === "finish") {
        if (isPauseRequested(state)) return;
        await this.endActiveAgentExecution(runtime, "completed", invocationId);
        await this.requestProjectFinish(runtime, "main", SYSTEM_CONTROLLER_AGENT, invocationId);
        return;
      }
      if (decision.nextAgent === SYSTEM_CONTROLLER_AGENT) {
        const childCandidates = orchestrationFor(state).agents
          .map((definition) => definition.name)
          .filter((name) => name !== SYSTEM_CONTROLLER_AGENT);
        state.pendingMainDecision = {
          sourceAgent: SYSTEM_CONTROLLER_AGENT,
          sourceInvocationId: invocationId,
          decisionPlan: defaultDecisionPlan(SYSTEM_CONTROLLER_AGENT),
          requestedAt: nowIso(),
          candidateAgents: childCandidates,
          reason: "weak-branch",
          diagnostic: decision.message
        };
        state.mainCapabilities = buildMainCapabilitySnapshot(state);
        state.pendingMainDecision.capabilities = state.mainCapabilities;
      } else {
        await this.beginLoopBatch(runtime, decision.nextAgent);
        await this.endActiveAgentExecution(runtime, "completed", invocationId);
        this.createPendingAgentExecution(
          state,
          decision.nextAgent,
          "main-assignment",
          {
            sourceAgent: SYSTEM_CONTROLLER_AGENT,
            sourceInvocationId: invocationId
          }
        );
      }
      state.currentAgent = undefined;
      state.activeInvocationId = undefined;
      state.queuedAgent = decision.nextAgent;
      if (isPauseRequested(state)) {
        this.clearQueueEntry(state);
      } else {
        this.enterQueue(state);
      }
      if (!isPauseRequested(state)) state.status = "queued";
      state.phase = `${state.queuedAgent}:queued`;
      await this.emit(runtime, {
        type: "agent.queued",
        agent: state.queuedAgent,
        message: `${state.queuedAgent} agent queued by Main`,
        data: { message: decision.message }
      });
      return;
    }

    if (
      state.userIntervention?.status === "answered" &&
      state.userIntervention.requestedBy === agent
    ) {
      state.userIntervention = undefined;
    }
    const handoffText = handoff
      ? naturalHandoffMarkdown(state, agent, invocationId, handoff)
      : workerHandoffMarkdown(state, agent, invocationId, "The Agent completed without a textual handoff.");
    state.latestHandoff = {
      agent,
      invocationId,
      markdown: handoffText,
        body: handoff ?? "The Agent completed without a textual handoff.",
      excerpt: handoffExcerpt(handoff ?? handoffText),
      updatedAt: nowIso()
    };
    const handoffPath = await this.storage.writeHandoff(state, agent, invocationId, handoffText);
    await this.emit(runtime, {
      type: "handoff.saved",
      agent,
      message: `${agent} natural-language handoff saved`,
      data: {
        invocationId,
        path: handoffPath,
        excerpt: handoffExcerpt(handoff ?? handoffText)
      }
    });
    if (controlActions.length) {
      for (const envelope of controlActions) {
        await this.emit(runtime, {
          type: "control.action.committed",
          agent,
          message: `${envelope.action.tool} action committed`,
          data: controlAuditData(envelope)
        });
      }
    }
    if (isCancelling(state)) return;
    await this.emit(runtime, {
      type: "agent.completed",
      agent,
      message: `${agent} agent completed`,
      data: {
        invocationId,
        threadId,
        cycle: state.cycle
      }
    });
    if (isCancelling(state)) return;
    await this.endActiveAgentExecution(runtime, "completed", invocationId);
    if (terminal?.action.tool === "complete_project") {
      await this.requestProjectFinish(runtime, "automatic", agent, invocationId);
      return;
    }
    if (state.userInputs.some((input) => input.status === "pending")) {
      await this.queueMainDecision(
        runtime,
        agent,
        invocationId,
        "user",
        orchestrationFor(state).agents
          .map((definition) => definition.name)
          .filter((name) => name !== SYSTEM_CONTROLLER_AGENT),
        true,
        "A project-level user requirement arrived while a child Agent was running."
      );
      return;
    }
    const orchestration = orchestrationFor(state);
    const routes = workflowRoutesForAgent(orchestration, agent);
    const loop = orchestration.loops?.find((entry) => entry.from === agent);
    if (loop) {
      // This executes inside the invocation transaction. Failed commits roll
      // back both the counter and queued route; recovery never counts twice.
      const iterations = loopIterationCount(state.loopIterations, loop.id);
      const exhausted = iterations >= loop.maxIterations;
      const nextAgent = exhausted ? loop.exitTo : loop.to;
      if (!exhausted) {
        if (iterations === 0) {
          await this.beginLoopBatch(runtime, loop.to);
        } else {
          state.loopIterations = {
            ...state.loopIterations,
            [loop.id]: iterations + 1
          };
          state.loopTotalIterations = {
            ...state.loopTotalIterations,
            [loop.id]: loopIterationCount(state.loopTotalIterations, loop.id) + 1
          };
        }
      }
      await this.emit(runtime, {
        type: exhausted
          ? "workflow.loop.exhausted"
          : "workflow.loop.iteration",
        agent,
        message: exhausted
          ? `Loop ${loop.id} completed its batch; routing to ${nextAgent}`
          : `Loop ${loop.id} starting iteration ${iterations + 1}/${loop.maxIterations}`,
        data: {
          loopId: loop.id,
          batch: loopIterationCount(state.loopBatches, loop.id),
          totalIterations: loopIterationCount(state.loopTotalIterations, loop.id),
          iterations: exhausted ? iterations : iterations + 1,
          maxIterations: loop.maxIterations,
          from: loop.from,
          to: loop.to,
          exitTo: loop.exitTo,
          nextAgent
        }
      });
      if (nextAgent === SYSTEM_CONTROLLER_AGENT) {
        await this.queueMainDecision(
          runtime,
          agent,
          invocationId,
          "loop-limit",
          workflowAgentCandidates(orchestration, SYSTEM_CONTROLLER_AGENT),
          false,
          `Loop group ${loop.id} completed batch ${loopIterationCount(state.loopBatches, loop.id)} (${iterations}/${loop.maxIterations} iterations). Evaluate the existing termination condition. If unfinished, route to its entry ${loop.to} to start a fresh batch with the same configured size; no reconfiguration or user approval is required merely to continue. Completing a batch does not complete the project.`
        );
      } else {
        await this.queueAgentAfterWorker(
          runtime,
          agent,
          invocationId,
          nextAgent
        );
      }
      return;
    }
    if (routes.length === 0) {
      throw new Error(`Agent orchestration has no valid next route after ${agent}`);
    }
    const isTerminationAgent = agent === orchestration.termination.agent;
    const automaticReturnTarget = workflowAutomaticReturnTarget(orchestration, agent);
    if (automaticReturnTarget) {
      // Completion and pending user input were handled above. A single repair
      // destination needs no Main decision and must not be treated as success.
      await this.queueAgentAfterWorker(
        runtime,
        agent,
        invocationId,
        automaticReturnTarget
      );
      return;
    }
    const directTarget = workflowDirectTarget(orchestration, agent);
    const workerSelfCandidates = workerDecisionCandidates(state, agent);
    if (workerCanChooseRoute(state, agent) && state.agents[agent].decisionBy === "agent") {
      if (terminal?.action.tool !== "route_to_agent" || !workerSelfCandidates.includes(terminal.action.target)) {
        state.routeRecovery = { agent, invocationId, status: "awaiting_main" };
        await this.queueMainDecision(
          runtime,
          agent,
          invocationId,
          "route-missing",
          workerSelfCandidates,
          false,
          "Worker returned its handoff but still needs a route after one terminal-action repair. Main must inspect the saved handoff and current evidence before choosing a route."
        );
        return;
      }
      await this.queueAgentAfterWorker(
        runtime,
        agent,
        invocationId,
        terminal.action.target
      );
      return;
    }
    if (workflowRequiresMainChoice(orchestration, agent)) {
      await this.queueMainDecision(
        runtime,
        agent,
        invocationId,
        "weak-branch",
        workflowAgentCandidates(orchestration, agent),
        false
      );
      return;
    }
    if (isTerminationAgent) {
      await this.queueMainDecision(
        runtime,
        agent,
        invocationId,
        "termination",
        ["finish"],
        true
      );
      return;
    }
    if (!directTarget || directTarget === "finish") {
      throw new Error(
        `${agent} has no deterministic Agent route; configure multiple weak edges for Main selection`
      );
    }
    if (directTarget === SYSTEM_CONTROLLER_ROUTE_TARGET) {
      await this.queueMainDecision(
        runtime,
        agent,
        invocationId,
        "deterministic-route",
        [],
        true
      );
      return;
    }
    await this.queueAgentAfterWorker(runtime, agent, invocationId, directTarget);
  }

  private async applyNonTerminalControlActions(
    runtime: RuntimeProject,
    agent: AgentName,
    invocationId: string,
    actions: ControlActionEnvelope[]
  ): Promise<void> {
    const { state } = runtime;
    for (const envelope of actions) {
      const action = envelope.action;
      if (action.tool === "finish_task") {
        const taskId = state.activeAgentExecution?.id ?? `${agent}:${invocationId}`;
        const receipt = await this.storage.requestTaskCompletion(state, taskId, envelope);
        await this.emit(runtime, {
          type: "task.finish.requested",
          agent,
          message: receipt.status === "accepted"
            ? `${agent} task completion was already accepted`
            : `${agent} task completion request saved`,
          data: { invocationId, taskId, status: receipt.status, callId: envelope.callId }
        });
        continue;
      }
      if (action.tool === "publish_artifact") {
        const source = await this.storage.resolveWorkspaceArtifact(
          state.id,
          agent,
          action.path
        );
        const sha256 = createHash("sha256")
          .update(await fs.readFile(source.sourcePath))
          .digest("hex");
        const record: ArtifactRecord = {
          id: `${agent}:${source.relativePath}`,
          agent,
          invocationId,
          path: source.relativePath,
          title: action.title,
          kind: action.kind,
          description: action.description,
          size: source.size,
          mediaType: source.mediaType,
          sha256,
          modifiedAt: new Date(source.mtimeMs).toISOString(),
          registeredAt: nowIso(),
          updatedAt: new Date(source.mtimeMs).toISOString()
        };
        state.artifacts = [
          ...(state.artifacts ?? []).filter((item) => item.path !== record.path),
          record
        ];
        await this.emit(runtime, {
          type: "artifact.published",
          agent,
          message: `Artifact published: ${source.relativePath}`,
          data: {
            invocationId,
            action: "publish_artifact",
            artifact: record
          }
        });
        continue;
      }
      if (action.tool === "select_display") {
        await validateDisplayArtifacts(this.storage, state, { primary: action.primary, items: action.items ?? [] });
        const display = await this.applyDisplaySelection(runtime, {
          primary: action.primary,
          items: action.items ?? []
        }, true);
        if (!display) {
          throw new ControlProtocolError(
            "select_display referenced an unreadable workspace file"
          );
        }
        await this.emit(runtime, {
          type: "display.selected",
          agent,
          message: "Main selected project display artifacts",
          data: {
            invocationId,
            action: "select_display",
            display
          }
        });
      }
    }
  }

  private async applyDisplaySelection(
    runtime: RuntimeProject,
    display: DisplaySelection,
    requireRegistered = false
  ): Promise<DisplaySelection | null> {
    const { state } = runtime;
    const entries = [display.primary, ...display.items];
    try {
      const resolved = await Promise.all(
        entries.map(async (item) => {
          const source = await this.storage.resolveWorkspaceArtifact(
            state.id,
            item.agent,
            item.path
          );
          if (requireRegistered) {
            const registered = state.artifacts?.find(
              (artifact) =>
                artifact.agent === item.agent &&
                artifact.path === source.relativePath
            );
            if (!registered) {
              throw new ControlProtocolError(
                `Display selection must reference a published artifact: ${item.agent}/${source.relativePath}`
              );
            }
            await this.storage.resolvePublishedArtifactRecord(
              state.id,
              registered
            );
          }
          return { ...item, path: source.relativePath };
        })
      );
      state.display = {
        primary: resolved[0],
        items: resolved.slice(1)
      };
      state.displayError = undefined;
      return state.display;
    } catch (error) {
      const safeError = redactTrace(
        error instanceof Error ? error.message : String(error)
      ).slice(0, 1_000);
      state.displayError = `Main 选择的展示文件当前不可用，已保留上一个有效展示：${safeError}`;
      await this.emit(runtime, {
        type: "agent.trace",
        level: "warning",
        agent: SYSTEM_CONTROLLER_AGENT,
        message: `Main display selection was not applied because a file is unavailable: ${safeError}`,
        data: { display, preservedPreviousDisplay: Boolean(state.display) }
      });
      if (requireRegistered) throw error;
      return null;
    }
  }

  private async queueMainDecision(
    runtime: RuntimeProject,
    sourceAgent: AgentName,
    sourceInvocationId: string,
    reason: "deterministic-route" | "weak-branch" | "termination" | "exception" | "route-missing" | "user" | "workflow-reconfiguration-rejected" | "loop-limit",
    candidateAgents: Array<AgentName | "finish"> = [],
    allowAnyAgent = false,
    diagnostic?: string
  ): Promise<void> {
    const { state } = runtime;
    const orchestration = orchestrationFor(state);
    state.pendingMainDecision = {
      sourceAgent,
      sourceInvocationId,
      decisionPlan:
        orchestration.decisionPlans[sourceAgent] ??
        `根据 ${sourceAgent} 的结果和全局状态决定下一步。`,
      requestedAt: nowIso(),
      candidateAgents: [...new Set(candidateAgents)].filter((candidate) =>
        candidate === "finish"
          ? workflowRoutesForAgent(orchestration, sourceAgent).some(
              (edge) => edge.target === "finish"
            )
          : isConfiguredAgent(orchestration, candidate)
      ),
      allowAnyAgent,
      reason,
      ...(diagnostic ? { diagnostic } : {})
    };
    state.mainCapabilities = buildMainCapabilitySnapshot(state);
    state.pendingMainDecision.capabilities = state.mainCapabilities;
    await this.queueAgent(runtime, SYSTEM_CONTROLLER_AGENT, {
      sourceAgent,
      executionSource: "main-decision",
      message:
        reason === "termination"
          ? `${sourceAgent} completed; Main will decide whether the project may finish or continue`
          : reason === "route-missing"
            ? `${sourceAgent} work invocation completed; awaiting route repair by Main`
          : reason === "workflow-reconfiguration-rejected"
            ? "Main's orchestration change was rejected; Main will reread the server snapshot and retry"
          : reason === "exception"
            ? `${sourceAgent} reached the failure limit; Main will choose recovery`
            : `Main will choose the next route after ${sourceAgent}`,
      data: {
        sourceAgent,
        sourceInvocationId,
        reason,
        candidateAgents: state.pendingMainDecision.candidateAgents,
        allowAnyAgent,
        capabilities: state.mainCapabilities,
        controlMode: state.mainCapabilities.controlMode,
        mainAutonomous: state.mainCapabilities.controlMode === "autonomous",
        decisionPlan: state.pendingMainDecision.decisionPlan,
        ...(diagnostic ? { diagnostic } : {})
      }
    });
    await this.emit(runtime, {
      type: "main.assignment.queued",
      agent: SYSTEM_CONTROLLER_AGENT,
      message: `Main decision queued after ${sourceAgent}`,
      data: {
        sourceAgent,
        sourceInvocationId,
        reason,
        candidateAgents: state.pendingMainDecision.candidateAgents,
        allowAnyAgent,
        capabilities: state.mainCapabilities
      }
    });
  }

  private async queueAgentAfterWorker(
    runtime: RuntimeProject,
    sourceAgent: AgentName,
    sourceInvocationId: string,
    nextAgent: AgentName
  ): Promise<void> {
    await this.queueAgent(runtime, nextAgent, {
      sourceAgent,
      executionSource: "configured-route",
      message: `${nextAgent} agent queued by the configured ${sourceAgent} route`,
      data: {
        sourceAgent,
        sourceInvocationId,
        configuredRoute: true
      }
    });
  }

  private async beginLoopBatch(
    runtime: RuntimeProject,
    entry: AgentName,
    initialized = false
  ): Promise<void> {
    const { state } = runtime;
    const loop = orchestrationFor(state).loops?.find((item) => item.to === entry);
    if (!loop) return;
    const batch = loopIterationCount(state.loopBatches, loop.id) + (initialized ? 0 : 1);
    const totalIterations = loopIterationCount(state.loopTotalIterations, loop.id) + (initialized ? 0 : 1);
    state.loopIterations = { ...state.loopIterations, [loop.id]: 1 };
    state.loopBatches = { ...state.loopBatches, [loop.id]: batch };
    state.loopTotalIterations = {
      ...state.loopTotalIterations,
      [loop.id]: totalIterations
    };
    await this.emit(runtime, {
      type: "workflow.loop.batch.started",
      agent: entry,
      message: `Loop group ${loop.id} starting batch ${batch} at ${entry}`,
      data: {
        loopId: loop.id,
        batch,
        iterations: 1,
        totalIterations,
        maxIterations: loop.maxIterations,
        entry
      }
    });
  }

  private async queueAgent(
    runtime: RuntimeProject,
    nextAgent: AgentName,
    event: {
      sourceAgent: AgentName;
      executionSource: AgentExecutionSource;
      message: string;
      data?: Record<string, unknown>;
    }
  ): Promise<void> {
    const { state } = runtime;
    if (!isSystemController(nextAgent) && !isConfiguredAgent(orchestrationFor(state), nextAgent)) {
      throw new Error(`Agent orchestration has no valid next route: ${nextAgent}`);
    }
    if (state.status === "retrying") {
      // A formal handoff to Main/another Agent is new runnable work. A late
      // checkpoint while replacing the failed execution must not inherit
      // its retry sleep and leave the new management task silently queued.
      finishWorkflowRecovery(state);
      state.status = "queued";
    }
    const enteredLoop = orchestrationFor(state).loops?.find(
      (loop) => loop.to === nextAgent
    );
    if (enteredLoop && event.sourceAgent !== enteredLoop.from) {
      await this.beginLoopBatch(runtime, nextAgent);
    }
    if (!isSystemController(nextAgent)) {
      const meta = state.agentSessionMeta?.[nextAgent];
      if (meta?.replacementPending) {
        const oldThread = state.agentSessionIds?.[nextAgent];
        const nextGeneration = meta.generation + 1;
        const sessions = { ...(state.agentSessionIds ?? {}) };
        delete sessions[nextAgent];
        state.agentSessionIds = sessions;
        const structuredSessions = { ...(state.agentSessions ?? {}) };
        delete structuredSessions[nextAgent];
        state.agentSessions = structuredSessions;
        state.agentSessionMeta = {
          ...(state.agentSessionMeta ?? {}),
          [nextAgent]: {
            generation: nextGeneration,
            contextSeq: 0,
            resumeFailureCount: meta.resumeFailureCount,
            replacementPending: false,
            lastResumeFailureAt: meta.lastResumeFailureAt
          }
        };
        await this.emit(runtime, {
          type: "session.replaced",
          level: "warning",
          agent: nextAgent,
          message: `${nextAgent} will start a replacement durable session after the previous thread became unavailable`,
          data: {
            sourceAgent: event.sourceAgent,
            oldThread,
            generation: nextGeneration,
            contextReset: true,
            replacementPending: true
          }
        });
      }
    }
    await this.replaceAgentExecution(
      runtime,
      nextAgent,
      event.executionSource,
      {
        sourceAgent: event.sourceAgent,
        sourceInvocationId:
          typeof event.data?.sourceInvocationId === "string"
            ? event.data.sourceInvocationId
            : undefined
      }
    );
    state.currentAgent = undefined;
    state.activeInvocationId = undefined;
    state.queuedAgent = nextAgent;
    if (isPauseRequested(state)) {
      this.clearQueueEntry(state);
    } else {
      this.enterQueue(state);
    }
    if (!isPauseRequested(state)) state.status = "queued";
    state.phase = `${nextAgent}:queued`;
    await this.emit(runtime, {
      type: "agent.queued",
      agent: nextAgent,
      message: event.message,
      data: event.data
    });
    await this.emit(runtime, {
      type: "route.queued",
      agent: nextAgent,
      message: `Configured route queued ${nextAgent}`,
      data: { sourceAgent: event.sourceAgent, ...event.data }
    });
  }

  /** Complete a project after Main accepts the configured termination route. */
  private async requestProjectFinish(
    runtime: RuntimeProject,
    mode: "main" | "automatic",
    sourceAgent: AgentName,
    sourceInvocationId: string
  ): Promise<void> {
    const { state } = runtime;
    if (isCancelling(state) || isPauseRequested(state)) return;
    if (state.userInputs.some((input) => input.status === "pending")) {
      await this.queueMainDecision(
        runtime,
        sourceAgent,
        sourceInvocationId,
        "user",
        [],
        true,
        "A new user requirement arrived before the direct finish could be committed."
      );
      this.startLoop(runtime);
      return;
    }
    if (
      (state.artifacts?.length ?? 0) > 0 &&
      !displayReferencesPublishedArtifacts(state)
    ) {
      throw new MainDecisionValidationError(
        "A project cannot complete with published artifacts until a non-empty display selection referencing published artifacts has been committed"
      );
    }
    if (state.display?.primary) {
      for (const item of [state.display.primary, ...state.display.items]) {
        const artifact = state.artifacts?.find(
          (candidate) =>
            candidate.agent === item.agent && candidate.path === item.path
        );
        if (!artifact) {
          throw new MainDecisionValidationError(
            `Displayed artifact is no longer registered: ${item.agent}/${item.path}`
          );
        }
        try {
          await this.storage.resolvePublishedArtifactRecord(state.id, artifact);
        } catch {
          throw new MainDecisionValidationError(
            `Displayed artifact changed after publication and must be republished: ${item.agent}/${item.path}`
          );
        }
      }
    }
    await this.completeProjectFromTermination(runtime, mode, sourceAgent, sourceInvocationId);
  }

  private async completeProjectFromTermination(
    runtime: RuntimeProject,
    mode: "main" | "automatic" = "main",
    sourceAgent: AgentName = SYSTEM_CONTROLLER_AGENT,
    sourceInvocationId?: string
  ): Promise<void> {
    const { state } = runtime;
    const termination = orchestrationFor(state).termination;
    await this.endActiveAgentExecution(
      runtime,
      "completed",
      sourceInvocationId
    );
    state.currentAgent = undefined;
    state.activeInvocationId = undefined;
    state.status = "completed";
    state.phase = "accepted";
    state.completedAt = nowIso();
    state.cancelledAt = undefined;
    state.queuedAgent = undefined;
    this.clearQueueEntry(state);
    await this.emit(runtime, {
      type: "project.status",
      message: mode === "automatic"
        ? `Research completed automatically after ${sourceAgent} verified the configured termination condition`
        : "Research completed by Main after its finish decision",
      data: {
        termination,
        completionMode: mode
      }
    });
    await this.emit(runtime, {
      type: "project.completed",
      agent: sourceAgent,
      message: mode === "automatic"
        ? `Project completed by automatic termination action from ${sourceAgent}`
        : "Project completed by Main terminal action",
      data: { sourceAgent, ...(sourceInvocationId ? { sourceInvocationId } : {}), completionMode: mode }
    });
  }

  private async handleInvocationFailure(
    runtime: RuntimeProject,
    agent: AgentName,
    invocationId: string,
    error: Error
  ): Promise<void> {
    const { state } = runtime;
    const harnessError = error instanceof HarnessRuntimeError ? error : undefined;
    const safeError = redactTrace(harnessError?.safeMessage ?? error.message).slice(0, 4_000);
    const failureMetadata = harnessFailureMetadata(error);
    if (state.status === "cancelling") {
      await this.finishCancellation(runtime);
      return;
    }
    if (hasUserWorkflowPause(state)) return;
    state.workerFailureCounts ??= {};
    state.agentFailureHistory ??= {};
    const previousFailures = state.workerFailureCounts[agent] ?? 0;
    const failureCount = previousFailures + 1;
    state.workerFailureCounts[agent] = failureCount;
    state.consecutiveFailures = failureCount;
    const candidateAgents = workflowAgentCandidates(orchestrationFor(state), agent);
    const tracePath = `traces/${String(state.turn + 1).padStart(4, "0")}_${agent}_${invocationId}.md`;
    const record = {
      invocationId,
      failedAt: nowIso(),
      errorType: redactTrace(error.name).slice(0, 128),
      error: safeError.slice(-12_000),
      tracePath,
      message: state.latestAssignment?.message ?? state.requirement,
      candidateAgents,
      ...failureMetadata
    };
    state.agentFailureHistory[agent] = [
      ...(state.agentFailureHistory[agent] ?? []),
      record
    ].slice(-WORKER_INVOCATION_FAILURE_LIMIT);
    state.lastError = safeError;
    state.currentAgent = undefined;
    state.activeInvocationId = undefined;
    state.queuedAgent = agent;
    this.clearQueueEntry(state);
    const transient = transientHarnessFailure(error);
    if (transient) {
      // A provider/protocol failure is not a failed business assignment. Keep
      // the original Agent/task/session and schedule a durable backoff even
      // after the native CLI's fast retry allowance has been exhausted.
      state.workerFailureCounts[agent] = previousFailures;
      state.consecutiveFailures = previousFailures;
      state.harnessRecoveryAttempts ??= {};
      const attempt = (state.harnessRecoveryAttempts[agent] ?? 0) + 1;
      state.harnessRecoveryAttempts[agent] = attempt;
      state.retryAt = new Date(Date.now() + harnessRecoveryDelayMs(attempt)).toISOString();
      state.status = "retrying";
      state.phase = `${agent}:gateway-retrying`;
      await this.emit(runtime, {
        type: "agent.failed",
        level: "warning",
        agent,
        message: "模型或网关暂时失败，正在自动恢复原任务…",
        data: {
          error: record.error,
          errorType: record.errorType,
          invocationId,
          tracePath,
          failureCount,
          automaticRetry: true,
          userActionRequired: false,
          transportRecoveryAttempt: attempt,
          retryAt: state.retryAt,
          ...failureMetadata
        }
      });
      return;
    }
    if (harnessError && !harnessError.retryable) {
      state.retryAt = undefined;
      state.status = "interrupted";
      state.phase = "harness-recovery-required";
      state.interruptedAt = nowIso();
      finishWorkflowRecovery(state);
      await this.emit(runtime, {
        type: "agent.failed",
        level: "error",
        agent,
        message: `${agent} failed with a non-retryable Harness error; fix the reported problem before explicitly continuing the retained task`,
        data: {
          error: record.error,
          errorType: record.errorType,
          invocationId,
          tracePath,
          failureCount,
          automaticRetry: false,
          userActionRequired: true,
          harnessRecoveryRequired: true,
          ...failureMetadata
        }
      });
      return;
    }
    state.status = "retrying";
    state.phase = `${agent}:retrying`;
    const isMain = isSystemController(agent);
    const retryLimit = isMain
      ? MAIN_AUTOMATIC_RETRY_LIMIT
      : WORKER_INVOCATION_FAILURE_LIMIT - 1;
    if (failureCount > retryLimit) {
      state.retryAt = undefined;
      if (isMain) {
        state.status = "retrying";
        state.phase = "main-recovery-required";
        state.queuedAgent = SYSTEM_CONTROLLER_AGENT;
        await this.emit(runtime, {
          type: "agent.failed",
          level: "error",
          agent,
          message: "Main failed again; its original task and Session are retained for automatic recovery",
          data: {
            error: record.error,
            errorType: record.errorType,
            invocationId,
            tracePath,
            failureCount,
            resumeMain: true,
            ...failureMetadata
          }
        });
        return;
      }
      const history = state.agentFailureHistory[agent] ?? [];
      state.workerFailureCounts[agent] = 0;
      await this.emit(runtime, {
        type: "agent.failed",
        level: "error",
        agent,
        message: `${agent} failed ${WORKER_INVOCATION_FAILURE_LIMIT} consecutive whole invocations; Main will choose recovery`,
        data: {
          error: record.error,
          errorType: record.errorType,
          invocationId,
          tracePath,
          failureCount,
          mainRecoveryRequired: true,
          ...failureMetadata
        }
      });
      await this.endActiveAgentExecution(runtime, "failed", invocationId);
      const diagnostic = JSON.stringify({
        failedAgent: agent,
        failures: history,
        lastMessage: record.message,
        originalCandidates: candidateAgents
      }, null, 2);
      await this.queueMainDecision(
        runtime,
        agent,
        invocationId,
        "exception",
        orchestrationFor(state).agents
          .map((definition) => definition.name)
          .filter((name) => name !== SYSTEM_CONTROLLER_AGENT),
        true,
        diagnostic
      );
      return;
    }
    const exponential = Math.min(
      this.config.retryMaxMs,
      this.config.retryBaseMs * 2 ** Math.min(10, failureCount - 1)
    );
    const delayMs = Math.max(
      100,
      Math.round(exponential * (0.85 + Math.random() * 0.3))
    );
    state.retryAt = new Date(Date.now() + delayMs).toISOString();
    await this.emit(runtime, {
      type: "agent.failed",
      level: "error",
      agent,
      message: `${agent} failed; automatic whole-invocation retry ${failureCount} scheduled`,
      data: {
        error: safeError,
        errorType: redactTrace(error.name).slice(0, 128),
        retryAt: state.retryAt,
        retryInMs: delayMs,
        invocationId,
        tracePath,
        failureCount,
        timedOut: error instanceof HarnessRuntimeError &&
          (error.code === "INVOCATION_TIMED_OUT" ||
            error.code === "TOOL_EXECUTION_TIMED_OUT"),
        apiError: error instanceof AgentApiError || (
          error instanceof HarnessRuntimeError &&
          (error.code === "MODEL_AUTHENTICATION_FAILED" || error.code === "MODEL_PROVIDER_FAILED")
        ),
        ...failureMetadata
      }
    });
  }

  private async monitorAgentActivity(
    runtime: RuntimeProject,
    agent: AgentName,
    invocationId: string,
    tracker: InvocationActivityTracker,
    onTrace: TraceSink,
    signal: AbortSignal
  ): Promise<void> {
    const modelIdleWindowMs =
      this.config.agentActivityIdleWindowMs ??
      AGENT_ACTIVITY_IDLE_WINDOW_MS;
    const toolIdleWindowMs =
      this.config.agentToolActivityIdleWindowMs ??
      AGENT_TOOL_ACTIVITY_IDLE_WINDOW_MS;
    while (!signal.aborted) {
      const snapshot = tracker.snapshot();
      const observedAt = Date.now();
      const activeInvocation =
        runtime.state.activeInvocationId === invocationId &&
        runtime.state.currentAgent === agent;
      if (!activeInvocation) return;
      if (runtime.state.phase === `${agent}:awaiting-experiment-result`) {
        await tracker.waitForChange(modelIdleWindowMs, signal);
        continue;
      }

      if (snapshot.activeTools.length > 0) {
        const staleTool = [...snapshot.activeTools]
          .sort((left, right) => left.lastActivityAt - right.lastActivityAt)[0]!;
        const elapsedMs = observedAt - staleTool.lastActivityAt;
        if (elapsedMs >= toolIdleWindowMs) {
          await onTrace(
            "status",
            `${agent} tool ${staleTool.name ?? staleTool.callId} produced no tool activity for ${toolIdleWindowMs} ms`,
            {
              diagnosticKind: "agent.tool.timeout",
              failureCode: "TOOL_EXECUTION_TIMED_OUT",
              phase: "tool-running",
              activitySource: "harness",
              deadlineType: "tool-activity-idle",
              timeoutMs: toolIdleWindowMs,
              elapsedMs,
              toolCallId: staleTool.callId,
              toolName: staleTool.name,
              toolStartedAt: new Date(staleTool.startedAt).toISOString(),
              lastSubstantiveActivityAt: new Date(staleTool.lastActivityAt).toISOString(),
              observedAt: new Date(observedAt).toISOString(),
              activeToolCount: snapshot.activeTools.length
            }
          );
          throw new HarnessRuntimeError(
            "TOOL_EXECUTION_TIMED_OUT",
            `${agent} tool execution exceeded its activity deadline`,
            {
              harnessId: runtime.state.agents[agent]?.harness,
              toolCallId: staleTool.callId,
              toolName: staleTool.name,
              timeoutMs: toolIdleWindowMs,
              elapsedMs
            },
            { source: "process" }
          );
        }
        const waitResult = await tracker.waitForChange(
          toolIdleWindowMs - elapsedMs,
          signal
        );
        if (waitResult === "aborted") return;
        continue;
      }

      const elapsedMs = observedAt - snapshot.lastModelActivityAt;
      if (elapsedMs >= modelIdleWindowMs) {
        await onTrace(
          "status",
          `${agent} produced no substantive model activity for ${modelIdleWindowMs} ms; the whole invocation will be retried`,
          {
            diagnosticKind: "agent.activity.timeout",
            failureCode: "INVOCATION_TIMED_OUT",
            phase: "waiting-model",
            activitySource: snapshot.lastModelActivitySource,
            deadlineType: "model-activity-idle",
            timeoutMs: modelIdleWindowMs,
            elapsedMs,
            lastSubstantiveActivityAt: new Date(snapshot.lastModelActivityAt).toISOString(),
            observedAt: new Date(observedAt).toISOString(),
            activeToolCount: 0
          }
        );
        throw new HarnessRuntimeError(
          "INVOCATION_TIMED_OUT",
          `${agent} produced no substantive model activity within the allowed window`,
          {
            harnessId: runtime.state.agents[agent]?.harness,
            idleWindowMs: modelIdleWindowMs,
            lastSubstantiveActivityAt: new Date(snapshot.lastModelActivityAt).toISOString()
          },
          { source: "process" }
        );
      }
      const waitResult = await tracker.waitForChange(
        modelIdleWindowMs - elapsedMs,
        signal
      );
      if (waitResult === "aborted") return;
    }
  }

  private finishCancellation(runtime: RuntimeProject): Promise<void> {
    if (runtime.cancellationFinalizing) {
      return runtime.cancellationFinalizing;
    }
    const finalizing = this.doFinishCancellation(runtime).finally(() => {
      if (runtime.cancellationFinalizing === finalizing) {
        runtime.cancellationFinalizing = undefined;
      }
    });
    runtime.cancellationFinalizing = finalizing;
    return finalizing;
  }

  private async markCancellationSettled(runtime: RuntimeProject): Promise<void> {
    if (runtime.state.cancellationSettledAt) return;
    runtime.state.cancellationSettledAt = nowIso();
    await this.emit(runtime, {
      type: "project.cancellation.settled",
      message: "Project cancellation settled; workspace and final state are ready for a snapshot",
      data: { settledAt: runtime.state.cancellationSettledAt }
    });
  }

  private async doFinishCancellation(runtime: RuntimeProject): Promise<void> {
    const { state } = runtime;
    runtime.mainInputRefresh = undefined;
    const alreadyCanonical =
      state.status === "cancelled" &&
      state.phase === "cancelled" &&
      state.cancelledAt !== undefined &&
      state.completedAt === undefined &&
      state.currentAgent === undefined &&
      state.queuedAgent === undefined &&
      state.queueEnteredAt === undefined &&
      state.queueOrder === undefined &&
      state.activeInvocationId === undefined &&
      state.retryAt === undefined;
    if (alreadyCanonical) return;
    await this.endActiveAgentExecution(
      runtime,
      "cancelled",
      state.activeInvocationId
    );
    state.status = "cancelled";
    state.phase = "cancelled";
    state.cancelledAt = nowIso();
    state.completedAt = undefined;
    state.currentAgent = undefined;
    state.queuedAgent = undefined;
    this.clearQueueEntry(state);
    state.activeInvocationId = undefined;
    state.retryAt = undefined;
    await this.emit(runtime, {
      type: "project.status",
      level: "warning",
      message: cancellationLabel(state),
      data: { actor: state.cancelledBy, reason: state.cancelReason, cancelledAt: state.cancelledAt }
    });
  }

  private emit(
    runtime: RuntimeProject,
    draft: EventDraft
  ): Promise<TimelineEvent> {
    checkpointWorkflowRecovery(runtime.state);
    if (["completed", "cancelled"].includes(runtime.state.status)) finishWorkflowRecovery(runtime.state);
    const releaseMutation = this.storage.reserveProjectMutation(
      runtime.state.id
    );
    const result = this.serializeProjectWrite(runtime, () =>
      this.storage.appendEvent(runtime.state, draft)
    );
    return result.finally(releaseMutation);
  }

  private persistDurableSession(
    runtime: RuntimeProject,
    agent: AgentName,
    session: SessionRef,
    legacyId: string,
    taskSessionId?: string
  ): Promise<void> {
    let firstThread = false;
    let replacement:
      | {
          previousHarnessId?: string;
          previousGeneration: number;
        }
      | undefined;
    const persisted = this.serializeProjectWrite(runtime, async () => {
      const { state } = runtime;
      const previous = state.agentSessions?.[agent];
      const previousLegacyId = state.agentSessionIds?.[agent];
      const previousTaskSession = taskSessionId
        ? state.taskSessionRefs?.[taskSessionId]
        : undefined;
      const previousTaskLegacyId = taskSessionId
        ? state.taskSessionIds?.[taskSessionId]
        : undefined;
      const structuredUnchanged = JSON.stringify(previous) === JSON.stringify(session);
      const legacyUnchanged = previousLegacyId === legacyId;
      const taskUnchanged = !taskSessionId || (
        JSON.stringify(previousTaskSession) === JSON.stringify(session) &&
        previousTaskLegacyId === legacyId
      );
      if (structuredUnchanged && legacyUnchanged && taskUnchanged) return;
      firstThread = !previousLegacyId;
      const currentMeta = state.agentSessionMeta?.[agent];
      const previousGeneration = previous?.generation ?? currentMeta?.generation ?? 0;
      const replaced =
        session.generation > previousGeneration ||
        Boolean(
          previous &&
            (previous.harnessId !== session.harnessId ||
              previous.adapterVersion !== session.adapterVersion ||
              previous.nativeId !== session.nativeId)
        );
      if (replaced) {
        replacement = {
          previousHarnessId: previous?.harnessId,
          previousGeneration
        };
      }
      state.agentSessionIds = {
        ...(state.agentSessionIds ?? {}),
        [agent]: legacyId
      };
      state.agentSessions = {
        ...(state.agentSessions ?? {}),
        [agent]: session
      };
      if (taskSessionId) {
        state.taskSessionRefs = {
          ...(state.taskSessionRefs ?? {}),
          [taskSessionId]: session
        };
        state.taskSessionIds = {
          ...(state.taskSessionIds ?? {}),
          [taskSessionId]: legacyId
        };
      }
      state.agentSessionMeta = {
        ...(state.agentSessionMeta ?? {}),
        [agent]: {
          generation: session.generation,
          contextSeq:
            replaced || (agent === SYSTEM_CONTROLLER_AGENT && !legacyUnchanged)
              ? 0
              : currentMeta?.contextSeq ?? 0,
          resumeFailureCount:
            replaced || !legacyUnchanged
              ? 0
              : currentMeta?.resumeFailureCount ?? 0,
          replacementPending: undefined,
          lastResumeFailureAt:
            replaced || !legacyUnchanged
              ? undefined
              : currentMeta?.lastResumeFailureAt
        }
      };
      if (
        agent === SYSTEM_CONTROLLER_AGENT &&
        (replaced || !legacyUnchanged)
      ) {
        state.mainContextSeq = 0;
      }
      await this.storage.saveState(state);
    });
    return persisted.then(async () => {
      if (replacement) {
        await this.emit(runtime, {
          type: "session.replaced",
          level: "warning",
          agent,
          message: `${agent} durable session was replaced inside the selected Harness`,
          data: {
            errorCode: "SESSION_RESUME_FAILED",
            harnessId: session.harnessId,
            previousHarnessId: replacement.previousHarnessId,
            previousGeneration: replacement.previousGeneration,
            replacementGeneration: session.generation,
            contextReset: true
          }
        });
      }
      if (firstThread) {
        await this.emit(runtime, {
          type: "session.started",
          agent,
          message: agent === SYSTEM_CONTROLLER_AGENT
            ? "Main durable session started"
            : `${agent} durable session started`,
          data: { threadId: legacyId }
        });
      }
    });
  }

  private serializeProjectWrite<T>(
    runtime: RuntimeProject,
    operation: () => Promise<T>
  ): Promise<T> {
    const result = runtime.eventQueue.then(operation);
    runtime.eventQueue = result.then(
      () => undefined,
      () => undefined
    );
    return result;
  }

  private publishLiveHarnessEvent(
    projectId: string,
    agent: AgentName,
    value: HarnessEvent
  ): void {
    const event = value;
    const attempt = Number.isSafeInteger(event.attempt) ? event.attempt! : 0;
    if (
      (event.kind === "assistant.delta" || event.kind === "assistant.message") &&
      event.itemId &&
      typeof event.message === "string"
    ) {
      const stream = {
        projectId,
        invocationId: event.invocationId,
        agent,
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
    if (event.kind.startsWith("tool.")) {
      this.storage.hub.publishHarnessEvent(projectId, agent, event);
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

  private clearLiveInvocationSoon(projectId: string, invocationId: string): void {
    const timer = setTimeout(() => {
      this.storage.hub.clearInvocation(projectId, invocationId);
    }, 750);
    timer.unref();
  }

  private async requireRuntime(projectId: string): Promise<RuntimeProject> {
    if (this.deletingProjects.has(projectId)) {
      throw new Error("Project deletion is already in progress");
    }
    const current = this.runtimes.get(projectId);
    if (current) return current;
    const state = await this.storage.tryLoadState(projectId);
    if (!state) throw new Error("Project not found");
    const runtime: RuntimeProject = {
      state,
      eventQueue: Promise.resolve(),
      interruptWaiters: new Map()
    };
    this.runtimes.set(projectId, runtime);
    return runtime;
  }
}

function naturalHandoffMarkdown(
  state: ProjectState,
  agent: AgentName,
  invocationId: string,
  handoff: string
): string {
  if (handoff.length > HANDOFF_CHARACTER_LIMIT) throw new Error("Handoff exceeds the communication character limit");
  const bounded = handoff;
  return `---\nproject_id: ${state.id}\ninvocation_id: ${invocationId}\nagent: ${agent}\nkind: natural_language_handoff\nfrom: ${agent}\n---\n\n# ${agent} handoff\n\n${bounded}\n`;
}

function handoffExcerpt(value: string): string {
  return value
    .replace(/^---[\s\S]*?---\s*/m, "")
    .trim()
    .slice(0, 1_000);
}

function terminalControlAction(
  actions: ControlActionEnvelope[]
): ControlActionEnvelope | undefined {
  return actions.find((envelope) =>
    envelope.action.tool === "route_to_agent" ||
    envelope.action.tool === "request_user" ||
    envelope.action.tool === "apply_workflow" ||
    envelope.action.tool === "complete_project"
  ) ?? actions.find((envelope) => envelope.action.tool === "finish_task");
}

function mergeControlActions(
  previous: ControlActionEnvelope[],
  repair: ControlActionEnvelope[]
): ControlActionEnvelope[] {
  const byCallId = new Map(previous.map((action) => [action.callId, action]));
  for (const action of repair) {
    const existing = byCallId.get(action.callId);
    if (existing && JSON.stringify(existing) !== JSON.stringify(action)) {
      throw new ControlProtocolError(`Conflicting control action callId: ${action.callId}`);
    }
    byCallId.set(action.callId, action);
  }
  return [...byCallId.values()];
}

function validateControlActionEnvelopes(
  state: ProjectState,
  agent: AgentName,
  invocationId: string,
  actions: ControlActionEnvelope[],
  expectedCapabilityHash?: string,
  expectedStateVersion?: number
): void {
  const callIds = new Set<string>();
  let decisionSeen = false;
  for (const envelope of actions) {
    if (
      envelope.projectId !== state.id ||
      envelope.agent !== agent ||
      envelope.invocationId !== invocationId
    ) {
      throw new ControlProtocolError("control action identity does not match the active invocation");
    }
    if (!Number.isSafeInteger(envelope.stateVersion) || envelope.stateVersion < 0 || envelope.stateVersion > state.eventSeq) {
      throw new ControlProtocolError("control action state version is stale or invalid");
    }
    if (expectedStateVersion !== undefined && envelope.stateVersion !== expectedStateVersion) {
      throw new ControlProtocolError("control action state version does not match the active invocation context");
    }
    if (expectedCapabilityHash && envelope.capabilityHash !== expectedCapabilityHash) {
      throw new ControlProtocolError("control action capability does not match the active invocation");
    }
    const receivedAt = Date.parse(envelope.receivedAt);
    if (!Number.isFinite(receivedAt)) {
      throw new ControlProtocolError("control action received time is invalid");
    }
    if (envelope.expiresAt !== undefined) {
      const expiresAt = Date.parse(envelope.expiresAt);
      if (!Number.isFinite(expiresAt) || receivedAt > expiresAt) {
        throw new ControlProtocolError("control action capability had expired when the server received it");
      }
    }
    if (!envelope.callId || callIds.has(envelope.callId)) {
      throw new ControlProtocolError("control action callId must be unique within an invocation");
    }
    callIds.add(envelope.callId);
    const isDecision = envelope.action.tool === "route_to_agent" || envelope.action.tool === "request_user" || envelope.action.tool === "apply_workflow" || envelope.action.tool === "complete_project";
    if (decisionSeen && isDecision) {
      throw new ControlProtocolError("an invocation may record only one orchestration decision");
    }
    if (isDecision) decisionSeen = true;
  }
}

function controlAuditData(envelope: ControlActionEnvelope): Record<string, unknown> {
  const action = envelope.action;
  const summary: Record<string, unknown> = {
    invocationId: envelope.invocationId,
    callId: envelope.callId,
    stateVersion: envelope.stateVersion,
    tool: action.tool,
    capabilityHash: envelope.capabilityHash
  };
  if (action.tool === "route_to_agent") {
    summary.target = action.target;
  } else if (action.tool === "finish_task") {
    summary.hasSummary = Boolean(action.summary);
    summary.hasMemory = Boolean(action.memory);
  } else if (action.tool === "apply_workflow") {
    summary.path = action.path;
  } else if (action.tool === "publish_artifact") {
    summary.path = action.path;
    summary.title = action.title.slice(0, 200);
  } else if (action.tool === "select_display") {
    summary.paths = [action.primary, ...(action.items ?? [])].map((item) => `${item.agent}:${item.path}`).slice(0, 20);
  }
  return summary;
}

function validateControlActionSemantics(
  state: ProjectState,
  agent: AgentName,
  kind: AgentKind,
  actions: ControlActionEnvelope[],
  allowAgentGitActions = false
): void {
  const candidates = controlCandidates(state, agent, kind);
  const mainCapabilities = kind === "main"
    ? state.mainCapabilities ?? buildMainCapabilitySnapshot(state)
    : undefined;
  for (const envelope of actions) {
    const action = envelope.action;
    if (action.tool === "finish_task") continue;
    if (["git_push", "git_get_operation", "git_reconcile_push", "github_create_pr", "github_get_pr", "github_merge_pr", "github_close_pr", "git_prepare_conflict", "git_log", "git_show", "git_diff", "git_revert"].includes(action.tool)) {
      if (kind !== "worker" || !allowAgentGitActions) {
        throw new ControlProtocolError("Agent Git action is not allowed in this invocation");
      }
      continue;
    }
    if (action.tool === "publish_artifact") {
      if (action.replacesPath !== undefined) {
        throw new ControlProtocolError("Pending Git publication replacement requires standalone execution authority");
      }
      if (resultFormatNone(state)) {
        throw new ControlProtocolError("This project explicitly requests no additional deliverable; publish_artifact is not allowed");
      }
      continue;
    }
    if (kind === "worker") {
      if (action.tool === "select_display" && automaticTerminationWorkerCanComplete(state, agent)) {
        validateDisplaySelection(orchestrationFor(state), {
          primary: action.primary,
          items: action.items ?? []
        });
        continue;
      }
      if (action.tool === "complete_project" && automaticTerminationWorkerCanComplete(state, agent)) {
        continue;
      }
      if (action.tool !== "route_to_agent" || !workerCanChooseRoute(state, agent) || !workerDecisionCandidates(state, agent).includes(action.target)) {
        throw new ControlProtocolError("Worker control action is not allowed by the current route contract");
      }
      continue;
    }
    if (action.tool === "select_display") {
      validateDisplaySelection(orchestrationFor(state), {
        primary: action.primary,
        items: action.items ?? []
      });
      continue;
    }
    if (action.tool === "apply_workflow") {
      if (
        mainCapabilities?.canReconfigure !== true ||
        action.path !== MAIN_AGENT_ORCHESTRATION_FILE
      ) {
        throw new ControlProtocolError(
          "Main cannot apply Agent orchestration changes in this invocation"
        );
      }
      continue;
    }
    if (action.tool === "route_to_agent") {
      if (!candidates.includes(action.target)) throw new ControlProtocolError("Main route target is not a current candidate");
      if (!action.assignment?.trim() &&
        !workflowTargetAllowsTasklessActivation(orchestrationFor(state), action.target)) {
        throw new ControlProtocolError(
          "Main route assignment may be omitted only for a collaboration target"
        );
      }
    } else if (action.tool === "request_user") {
      if (mainCapabilities?.canRequestUser !== true) throw new ControlProtocolError("Main cannot request user intervention in this invocation");
    } else if (action.tool === "complete_project") {
      if (!mainCanComplete(state)) throw new ControlProtocolError("Main cannot complete outside a configured termination context");
    }
  }
}

function validateCompletionDisplayContract(
  state: ProjectState,
  actions: ControlActionEnvelope[]
): void {
  if (!actions.some((envelope) => envelope.action.tool === "complete_project")) {
    return;
  }
  if (resultFormatNone(state) && ((state.artifacts?.length ?? 0) > 0 || actions.some((envelope) => envelope.action.tool === "publish_artifact"))) {
    throw new ControlProtocolError("This project explicitly requests no additional deliverable; remove published artifacts before completing");
  }
  const hasPublishedResult =
    (state.artifacts?.length ?? 0) > 0 ||
    actions.some((envelope) => envelope.action.tool === "publish_artifact");
  if (!hasPublishedResult) return;

  const stagesDisplay = actions.some(
    (envelope) => envelope.action.tool === "select_display"
  );
  if (stagesDisplay || displayReferencesPublishedArtifacts(state)) return;

  throw new ControlProtocolError(
    "A project cannot complete with published artifacts before staging select_display for published artifacts"
  );
}

function displayReferencesPublishedArtifacts(state: ProjectState): boolean {
  if (!state.display?.primary) return false;
  const artifacts = state.artifacts ?? [];
  return [state.display.primary, ...state.display.items].every((item) =>
    artifacts.some(
      (artifact) => artifact.agent === item.agent && artifact.path === item.path
    )
  );
}

function resultFormatNone(state: ProjectState): boolean {
  return state.orchestration.resultFormat?.none === true;
}

function workerDecisionCandidates(
  state: ProjectState,
  agent: AgentName
): AgentName[] {
  return workflowRoutesForAgent(orchestrationFor(state), agent)
    .filter((edge) =>
      edge.kind === "weak" &&
      edge.target !== SYSTEM_CONTROLLER_AGENT &&
      edge.target !== "finish" &&
      isConfiguredAgent(orchestrationFor(state), edge.target)
    )
    .map((edge) => edge.target as AgentName);
}

function workerCanChooseRoute(state: ProjectState, agent: AgentName): boolean {
  const routes = workflowRoutesForAgent(orchestrationFor(state), agent);
  const candidates = workerDecisionCandidates(state, agent);
  return candidates.length >= 2 && routes.length === candidates.length && routes.every((edge) => edge.kind === "weak");
}

function automaticTerminationWorkerCanComplete(
  state: ProjectState,
  agent: AgentName
): boolean {
  const orchestration = orchestrationFor(state);
  return agent !== SYSTEM_CONTROLLER_AGENT &&
    orchestration.termination.automatic === true &&
    orchestration.termination.agent === agent &&
    workflowRoutesForAgent(orchestration, agent).some((edge) => edge.target === "finish");
}

function controlCandidates(
  state: ProjectState,
  agent: AgentName,
  kind: AgentKind
): Array<AgentName | "finish"> {
  if (kind === "main") {
    return (state.mainCapabilities ?? buildMainCapabilitySnapshot(state)).routeCandidates;
  }
  return workerCanChooseRoute(state, agent)
    ? workerDecisionCandidates(state, agent)
    : [];
}

function mainCanComplete(state: ProjectState): boolean {
  return (state.mainCapabilities ?? buildMainCapabilitySnapshot(state)).canComplete;
}

/**
 * Main may edit the live Workflow only in autonomous mode when the user-owned
 * policy gate is enabled. Completion authority is a separate capability.
 */
function mainCanReconfigure(state: ProjectState): boolean {
  return (state.mainCapabilities ?? buildMainCapabilitySnapshot(state)).canReconfigure;
}

function mainDecisionFromControl(
  state: ProjectState,
  terminal: ControlActionEnvelope | undefined,
  handoff: string | undefined,
  actions: ControlActionEnvelope[]
): MainDecision {
  if (!terminal) {
    throw new ControlProtocolError(
      "Main completed without a route_to_agent, request_user, apply_workflow, or complete_project action"
    );
  }
  const displayAction = actions.find((item) => item.action.tool === "select_display")?.action;
  const display = displayAction?.tool === "select_display"
    ? { primary: displayAction.primary, items: displayAction.items ?? [] }
    : null;
  const text = handoff?.trim() || "Main completed the current coordination turn.";
  if (terminal.action.tool === "route_to_agent") {
    return {
      assessment: text.slice(0, 20_000),
      nextAgent: terminal.action.target,
      message: terminal.action.assignment ?? terminal.action.context ?? text,
      rationale: terminal.action.rationale ?? text,
      successCriteria: terminal.action.successCriteria?.length
        ? terminal.action.successCriteria
        : ["The selected Agent completes its assigned task and returns a natural-language handoff."],
      display
    };
  }
  if (terminal.action.tool === "request_user") {
    return {
      assessment: text.slice(0, 20_000),
      nextAgent: "user",
      message: terminal.action.message,
      rationale: terminal.action.rationale,
      successCriteria: ["The user supplies the requested information."],
      display
    };
  }
  if (!mainCanComplete(state)) {
    throw new MainDecisionValidationError("Main cannot complete outside a configured termination context");
  }
  const completion = terminal.action as Extract<ControlActionEnvelope["action"], { tool: "complete_project" }>;
  return {
    assessment: text.slice(0, 20_000),
    nextAgent: "finish",
    message: text,
    rationale: completion.rationale,
    successCriteria: ["The requested project result is delivered."],
    display
  };
}

function projectSnapshotForAgent(
  state: ProjectState,
  agent: AgentName,
  visiblePendingUserInputIds: string[]
): ProjectState {
  const snapshot = structuredClone(state);
  // An invocation only needs the credential for its own configured harness.
  // Keep the other Agents' gateway metadata visible for orchestration, but do
  // not place unrelated server-side credentials inside this Agent's process
  // boundary.
  for (const [candidate, config] of Object.entries(snapshot.agents)) {
    if (candidate === agent || !config.gatewaySnapshot) continue;
    const { apiKey: _apiKey, ...publicGatewaySnapshot } = config.gatewaySnapshot;
    void _apiKey;
    config.gatewaySnapshot = publicGatewaySnapshot as typeof config.gatewaySnapshot;
  }
  if (isSystemController(agent)) {
    const visiblePending = new Set(visiblePendingUserInputIds);
    snapshot.userInputs = snapshot.userInputs.filter(
      (input) =>
        input.status === "delivered" || visiblePending.has(input.id)
    );
    return snapshot;
  }

  snapshot.userInputs = [];
  if (snapshot.userIntervention) {
    delete snapshot.userIntervention.response;
  }
  return snapshot;
}

function emptyProjectTokenUsage(
  orchestration: AgentOrchestrationTemplate = DEFAULT_AGENT_ORCHESTRATION_TEMPLATE,
  historicalIncomplete = false
): ProjectTokenUsage {
  return createProjectTokenUsage(
    orchestration.agents.map((definition) => definition.name),
    historicalIncomplete
  );
}

function tokenCount(
  data: Record<string, unknown>,
  keys: string[]
): number | undefined {
  for (const key of keys) {
    const raw = data[key];
    const value =
      typeof raw === "number"
        ? raw
        : typeof raw === "string" && raw.trim()
          ? Number(raw)
          : Number.NaN;
    if (Number.isFinite(value) && value >= 0) {
      return Math.min(Number.MAX_SAFE_INTEGER, Math.floor(value));
    }
  }
  return undefined;
}

function tokenUsageFromData(
  data: Record<string, unknown> | undefined
): TokenUsageTotals | undefined {
  if (!data) return undefined;
  const inputTokens = tokenCount(data, [
    "input_tokens",
    "inputTokens",
    "prompt_tokens",
    "promptTokens"
  ]);
  const outputTokens = tokenCount(data, [
    "output_tokens",
    "outputTokens",
    "completion_tokens",
    "completionTokens"
  ]);
  const cachedInputTokens = tokenCount(data, [
    "cached_input_tokens",
    "cachedInputTokens",
    "cached_tokens",
    "cachedTokens"
  ]);
  const reportedTotal = tokenCount(data, ["total_tokens", "totalTokens"]);
  if (
    inputTokens === undefined &&
    outputTokens === undefined &&
    cachedInputTokens === undefined &&
    reportedTotal === undefined
  ) {
    return undefined;
  }
  const input = inputTokens ?? 0;
  const output = outputTokens ?? 0;
  return {
    inputTokens: input,
    cachedInputTokens: cachedInputTokens ?? 0,
    outputTokens: output,
    totalTokens: reportedTotal ?? input + output,
    invocations: 1
  };
}

function safeTokenSum(left: number, right: number): number {
  return Math.min(Number.MAX_SAFE_INTEGER, left + right);
}

function tokenUsageCursor(
  usage: TokenUsageTotals
): ThreadTokenUsageCursor {
  return {
    inputTokens: usage.inputTokens,
    cachedInputTokens: usage.cachedInputTokens,
    outputTokens: usage.outputTokens,
    totalTokens: usage.totalTokens
  };
}

function tokenUsageDelta(
  current: TokenUsageTotals,
  previous: ThreadTokenUsageCursor
): TokenUsageTotals {
  const counterReset =
    current.inputTokens < previous.inputTokens ||
    current.cachedInputTokens < previous.cachedInputTokens ||
    current.outputTokens < previous.outputTokens ||
    current.totalTokens < previous.totalTokens;
  if (counterReset) {
    return {
      ...emptyTokenUsageTotals(),
      // A completed turn remains one invocation even when a provider counter
      // restarts or temporarily reports a lower cumulative value.
      invocations: current.invocations
    };
  }
  return {
    inputTokens: current.inputTokens - previous.inputTokens,
    cachedInputTokens: current.cachedInputTokens - previous.cachedInputTokens,
    outputTokens: current.outputTokens - previous.outputTokens,
    totalTokens: current.totalTokens - previous.totalTokens,
    invocations: current.invocations
  };
}

function threadUsageCursorKey(agent: AgentName, threadId: string): string {
  return JSON.stringify([agent, threadId]);
}

function traceThreadId(data: Record<string, unknown> | undefined): string | undefined {
  const threadId = data?.threadId;
  return typeof threadId === "string" && threadId.trim()
    ? threadId
    : undefined;
}

function isThreadCumulativeUsage(
  data: Record<string, unknown> | undefined,
  kind: AgentKind | undefined
): boolean {
  return data?.usageScope === "thread" || kind === "main";
}

function threadIdForUsage(
  data: Record<string, unknown> | undefined,
  agent: AgentName,
  kind: AgentKind | undefined,
  knownMainThreadId?: string
): string {
  return (
    traceThreadId(data) ??
    (kind === "main" ? knownMainThreadId : undefined) ??
    `thread:${agent}`
  );
}

function addTokenUsage(
  target: TokenUsageTotals,
  usage: TokenUsageTotals
): void {
  target.inputTokens = safeTokenSum(target.inputTokens, usage.inputTokens);
  target.cachedInputTokens = safeTokenSum(
    target.cachedInputTokens,
    usage.cachedInputTokens
  );
  target.outputTokens = safeTokenSum(target.outputTokens, usage.outputTokens);
  target.totalTokens = safeTokenSum(target.totalTokens, usage.totalTokens);
  target.invocations = safeTokenSum(target.invocations, usage.invocations);
}

function applyTokenUsage(
  projectUsage: ProjectTokenUsage,
  agent: AgentName,
  usage: TokenUsageTotals,
  updatedAt: string,
  cumulativeThreadId?: string
): void {
  let usageToAdd = usage;
  if (cumulativeThreadId) {
    projectUsage.threadUsageCursors ??= {};
    const key = threadUsageCursorKey(agent, cumulativeThreadId);
    const cursor = projectUsage.threadUsageCursors[key];
    if (cursor) {
      usageToAdd = tokenUsageDelta(usage, cursor);
    }
    projectUsage.threadUsageCursors[key] = tokenUsageCursor(usage);
  }
  addTokenUsage(projectUsage, usageToAdd);
  projectUsage.byAgent[agent] ??= emptyTokenUsageTotals();
  addTokenUsage(projectUsage.byAgent[agent], usageToAdd);
  projectUsage.updatedAt = updatedAt;
}

function isProjectTokenUsage(
  value: unknown,
  orchestration: AgentOrchestrationTemplate
): value is ProjectTokenUsage {
  return isSharedProjectTokenUsage(
    value,
    orchestration.agents.map((definition) => definition.name)
  );
}

function tokenUsageFromEvents(
  events: TimelineEvent[],
  orchestration: AgentOrchestrationTemplate,
  mainThreadId?: string
): ProjectTokenUsage {
  // Recovery-only compatibility reader for timelines written before gateway
  // request metering became authoritative. Live accounting above never
  // recognizes CLI labels or any concrete Harness's trace wording.
  const usage = emptyProjectTokenUsage(orchestration, true);
  const seenInvocations = new Set<string>();
  const gatewayMeteredInvocations = new Set<string>();
  const currentThreads = new Map<AgentName, string>();
  const mainThreadIdByInvocation = new Map<string, string>();
  for (const event of events) {
    if (
      event.type === "agent.trace" &&
      (event.message === "Gateway token usage" || event.message === "Gateway token usage unknown") &&
      event.agent &&
      gatewayUsageReportFromData(event.data)
    ) {
      gatewayMeteredInvocations.add(
        typeof event.data?.invocationId === "string"
          ? event.data.invocationId
          : event.id
      );
    }
    if (
      event.type === "agent.completed" &&
      event.agent &&
      typeof event.data?.invocationId === "string" &&
      typeof event.data.threadId === "string"
    ) {
      mainThreadIdByInvocation.set(
        event.data.invocationId,
        event.data.threadId
      );
    }
  }
  for (const event of events) {
    if (
      event.type === "agent.trace" &&
      (event.message === "Gateway token usage" || event.message === "Gateway token usage unknown") &&
      event.agent
    ) {
      const invocationId =
        typeof event.data?.invocationId === "string"
          ? event.data.invocationId
          : event.id;
      const usageId =
        typeof event.data?.usageId === "string" && event.data.usageId.trim()
          ? event.data.usageId
          : `${invocationId}:${event.id}`;
      const requestUsage = gatewayUsageReportFromData({
        ...(event.data ?? {}),
        usageId
      });
      if (!requestUsage) continue;
      applyGatewayUsageReport(
        usage,
        event.agent,
        requestUsage,
        event.ts
      );
      continue;
    }
    if (
      event.type === "agent.trace" &&
      event.message === "Codex thread started" &&
      event.agent
    ) {
      const threadId = traceThreadId(event.data);
      if (threadId) currentThreads.set(event.agent, threadId);
      continue;
    }
    if (
      event.type !== "agent.trace" ||
      event.message !== "Codex turn completed" ||
      !event.agent
    ) {
      continue;
    }
    const invocationId =
      typeof event.data?.invocationId === "string"
        ? event.data.invocationId
        : event.id;
    if (gatewayMeteredInvocations.has(invocationId)) continue;
    if (seenInvocations.has(invocationId)) continue;
    const turnUsage = tokenUsageFromData(event.data);
    if (!turnUsage) continue;
    seenInvocations.add(invocationId);
    let kind: AgentKind | undefined;
    kind = event.agent === SYSTEM_CONTROLLER_AGENT ? "main" : "worker";
    const cumulativeThreadId = isThreadCumulativeUsage(event.data, kind)
      ? threadIdForUsage(
          event.data,
          event.agent,
          kind,
          mainThreadIdByInvocation.get(invocationId) ??
            currentThreads.get(event.agent) ??
            mainThreadId
        )
      : undefined;
    applyTokenUsage(
      usage,
      event.agent,
      turnUsage,
      event.ts,
      cumulativeThreadId
    );
  }
  refreshUsageCompleteness(usage);
  return usage;
}

function initialAgent(state: ProjectState): AgentName {
  return orchestrationFor(state).input.target;
}

function agentKindForState(state: ProjectState, agent: AgentName): AgentKind {
  return agent === SYSTEM_CONTROLLER_AGENT ? "main" : "worker";
}

function orchestrationFor(state: ProjectState): AgentOrchestrationTemplate {
  return state.orchestration;
}

export function overallProgress(
  state: ProjectState
): ProjectView["overallProgress"] {
  const accepted = state.status === "completed";
  const unresolvedFailures = state.failureSummary?.unresolvedFailures ?? (() => {
    const latest = new Map<string, FailureAttempt["status"]>();
    for (const attempt of state.failureAttempts ?? []) {
      latest.set(`${attempt.scope}\0${attempt.operation}`, attempt.status);
    }
    return [...latest.values()].filter((status) => status === "failed").length;
  })();
  const workerNames = orchestrationFor(state).agents
    .map((definition) => definition.name)
    .filter((name) => name !== SYSTEM_CONTROLLER_AGENT);
  const successfulCalls = workerNames.length > 0
    ? workerNames.reduce((sum, name) => sum + (state.runCounts[name] ?? 0), 0)
    : state.runCounts[SYSTEM_CONTROLLER_AGENT] ?? 0;
  const latestGitRetry = state.gitRetryScheduling?.at(-1);
  const priorRunWait = latestGitRetry?.gitReadyPersistedAt?.waitingFor.kind ===
      "prior-project-run" && !latestGitRetry.priorRunSettledAt
    ? latestGitRetry.gitReadyPersistedAt.waitingFor
    : undefined;
  let label = "等待科研任务启动";
  if (priorRunWait) {
    label = `等待旧运行 ${priorRunWait.objectId} 安全结束：${priorRunWait.reason}` +
      `（截止 ${priorRunWait.deadlineAt}）`;
  } else if (state.phase === "storage-recovery-required") {
    label = "存储恢复后才能继续";
  } else if (state.phase === "main-recovery-required") {
    label = "main 运行失败，等待恢复";
  } else if (state.pendingMainDecision?.reason === "route-missing" && (state.status === "queued" || state.status === "running")) {
    label = "Worker 工作已返回，等待 Main 补交路由";
  } else if (
    state.phase === "user-intervention-required" &&
    state.userIntervention?.status === "pending"
  ) {
    label = "Main Agent 等待用户介入";
  } else if (accepted) {
    label = unresolvedFailures > 0
      ? `项目已完成；仍有 ${unresolvedFailures} 项未解决的技术故障`
      : "项目已完成";
  } else if (state.status === "cancelled" || state.status === "cancelling") {
    label = state.status === "cancelled" ? cancellationLabel(state) : "正在取消任务";
  } else if (state.runtime?.status === state.status && state.runtime.waiting) {
    label = state.runtime.waiting.reason;
  } else if (state.status === "paused" || state.status === "pausing") {
    label = state.status === "paused" ? "任务已暂停" : "将在安全边界暂停";
  } else if (state.status === "retrying" && state.queuedAgent) {
    label = `${agentDisplayName(state, state.queuedAgent)}等待重试`;
  } else if (state.status === "interrupted" && state.queuedAgent) {
    label = `${agentDisplayName(state, state.queuedAgent)}运行中断，等待恢复`;
  } else if (state.currentAgent) {
    label = `${agentDisplayName(state, state.currentAgent)}正在运行`;
  } else if (state.queuedAgent) {
    label = `${agentDisplayName(state, state.queuedAgent)}排队中`;
  }
  return {
    percent: workflowProgressPercent(state),
    label,
    estimated: true,
    successfulCalls
  };
}

function agentDisplayName(state: ProjectState, agent: AgentName): string {
  if (isSystemController(agent)) return "main";
  const template = agentTemplateFor(orchestrationFor(state), agent);
  const builtins: Record<string, string> = {
    idea: "构思 Agent", main: "main", execution: "执行 Agent",
    writing: "写作 Agent", review: "评审 Agent", general: `${agent} Agent`
  };
  return builtins[template] ?? `${agent} Agent`;
}

async function schemaPathFor(kind: AgentKind): Promise<string> {
  const fileName =
    kind === "main"
      ? "main-decision.json"
      : "worker-result.json";
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
      // Continue to the next source/dev/build layout candidate.
    }
  }
  throw new Error(`Unable to locate output schema ${fileName}`);
}

function abortableDelay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new Error("Delay aborted"));
      return;
    }
    const abort = () => {
      clearTimeout(timeout);
      reject(new Error("Delay aborted"));
    };
    const timeout = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve();
    }, ms);
    signal.addEventListener("abort", abort, { once: true });
  });
}

export async function waitForAgentActivityIdle(
  readLastActivityAt: () => number,
  signal: AbortSignal,
  idleWindowMs = AGENT_ACTIVITY_IDLE_WINDOW_MS
): Promise<AgentActivityIdleObservation | undefined> {
  const normalizedIdleWindowMs = Math.max(1, Math.floor(idleWindowMs));
  try {
    while (!signal.aborted) {
      const lastActivityAt = readLastActivityAt();
      const remainingMs = Math.max(
        1,
        lastActivityAt + normalizedIdleWindowMs - Date.now()
      );
      await abortableDelay(remainingMs, signal);
      const observedAt = Date.now();
      const currentLastActivityAt = readLastActivityAt();
      if (observedAt - currentLastActivityAt >= normalizedIdleWindowMs) {
        return {
          lastActivityAt: currentLastActivityAt,
          observedAt,
          idleWindowMs: normalizedIdleWindowMs
        };
      }
    }
  } catch (error) {
    if (!signal.aborted) throw error;
  }
  return undefined;
}

function isCancelling(state: ProjectState): boolean {
  return state.status === "cancelling" || state.status === "cancelled";
}

function isPauseRequested(state: ProjectState): boolean {
  return state.status === "pausing" || state.status === "paused";
}

function isNonNegativeSafeInteger(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0
  );
}

function isValidQueueOrder(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0
  );
}
