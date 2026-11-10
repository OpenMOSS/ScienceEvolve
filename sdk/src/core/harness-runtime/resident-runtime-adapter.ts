import type { ChildProcessWithoutNullStreams } from "node:child_process";
import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { promises as fs } from "node:fs";
import {
  createServer as createHttpServer,
  request as requestHttp,
  type IncomingMessage,
  type Server as HttpServer,
  type ServerResponse
} from "node:http";
import net, { type Server as NetServer, type Socket } from "node:net";
import path from "node:path";
import { AgentContextSources } from "../agent-context-index.js";
import type { AgentContextIndex } from "../agent-context-index.js";
import { agentContextWindow, fitContextInjection, contextReplacements } from "../context-injection-budget.js";
import { protectWindowsRuntimeFile } from "./windows-resident.js";
import readline from "node:readline";
import { setTimeout as delay } from "node:timers/promises";
import { Transform } from "node:stream";
import { isDeepStrictEqual } from "node:util";
import { isTerminalPushObservationScope, terminalPushObservationActionAllowed } from "../internal/terminal-push-observation.js";
import { isTerminalPushCoordinationScope, terminalPushCoordinationActionAllowed } from "../internal/terminal-push-coordination.js";
import { assertWorktreeClosingRequest, worktreeClosingActionAllowed } from "../internal/worktree-closing.js";
import { collaborationSessionKey } from "../internal/shared/collaboration-session-key.js";
import { CONTROL_DRAIN_TIMEOUT_MS, controlRequestTimeoutMs } from "../control-request-lifetime.js";
import { redactTrace } from "../utils.js";
import type { SiiMcpBinding } from "../sii-experiments.js";
import type {
  AgentRunRequest,
  AgentRunResult,
  CollaborationControlScope,
  ControlActionEnvelope,
  ControlMcpRequest,
  ResidentDurableRehydrateProvenance,
  TraceSink
} from "../types.js";
import {
  toolsFor,
  type CapabilityContext
} from "../orchestration-control-mcp.js";
import { codexModelsResponse } from "../protocol-router.js";
import {
  ControlActionService,
  readStagedControlActions,
  startControlActionBridge,
  type ControlActionBridge,
  type ControlActionServiceOptions
} from "../orchestration-control-bridge.js";
import type { InvocationInputs, InvocationPolicy, SessionRef } from "./contracts.js";
import { validateSessionRef } from "./session-ref.js";
import { compileWorkflowPrompt } from "./invocation-policy.js";
import { type FilesystemAuthority } from "./filesystem-authority.js";
import { modelRouteBinding, type InvocationGatewayRoute, type InvocationModelRoute } from "./gateway-route.js";
import { HarnessRuntimeError, ResidentInputPreparationError, ResidentTurnRetryableError, harnessRecoveryDelayMs, proxyFailureError } from "./errors.js";
import { sessionRecoveryNote } from "../internal/shared/session-recovery.js";
import {
  resolveOrchestrationControlMcpCommand,
  resolveResidentControlProxyCommand,
  serializeInvocationControlContext
} from "./runtime-support.js";
import type {
  PrepareResidentScopeRequest,
  ResidentControlMcpBinding,
  ResidentLeaseAuthority,
  ResidentMcpRow,
  ResidentProcessLease,
  ResidentStartupReconcileResult,
  ResidentTurn
} from "./resident-lease.js";
import { residentScopeId } from "./resident-lease.js";
import { spawnTrustedUtility } from "./process-host.js";
import type {
  ResidentTurnAuthorityBroker,
  ResidentTurnAuthorityLease
} from "./resident-native-driver.js";
import {
  HarnessRuntimeFacade,
  type ResidentTurnFrameSink
} from "./runtime.js";

const MAX_CONTROL_LINE_BYTES = 1024 * 1024;
export function residentControlRequestTimeoutMs(request: Record<string, unknown>): number {
  return controlRequestTimeoutMs(request.method);
}


export type ResidentGatewayRouteFactory = (
  request: AgentRunRequest,
  onTrace: TraceSink,
  signal: AbortSignal
) => Promise<InvocationModelRoute>;

export interface ResidentControlRevalidationInput {
  request: AgentRunRequest;
  turn: Readonly<Pick<ResidentTurn, "inputId" | "invocationId" | "prompt">>;
  envelope: ControlActionEnvelope;
  stagedActions: readonly ControlActionEnvelope[];
}

export interface ResidentControlRejectionInput {
  request: AgentRunRequest;
  turn: Readonly<Pick<ResidentTurn, "inputId" | "invocationId" | "prompt">>;
  envelope?: ControlActionEnvelope;
  error: Error;
}

export interface ResidentTurnControlAuthority {
  /** Full server-owned turn context; the adapter adds only the live bridge endpoint. */
  control: ControlMcpRequest;
  /** Must revalidate current state/epoch while the authoritative database write lock is held. */
  revalidate: (
    envelope: ControlActionEnvelope,
    stagedActions: readonly ControlActionEnvelope[]
  ) => Promise<unknown>;
  onRejected?: (
    envelope: ControlActionEnvelope | undefined,
    error: Error
  ) => Promise<void>;
  execute?(envelope: ControlActionEnvelope, signal: AbortSignal): Promise<unknown>;
}

export type ResidentControlAuthorityFactory = (input: {
  request: AgentRunRequest;
  turn: Readonly<Pick<ResidentTurn, "inputId" | "invocationId" | "prompt">>;
}) => Promise<ResidentTurnControlAuthority>;

export type ResidentDurableRehydrateInput = ResidentDurableRehydrateProvenance;

export type ResidentTurnRequestFactory = (input: {
  baseRequest: AgentRunRequest;
  turn: Readonly<Pick<ResidentTurn, "inputId" | "invocationId" | "prompt">>;
}) => Promise<{
  request: AgentRunRequest;
  onTrace: TraceSink;
  durableRehydrate?: ResidentDurableRehydrateInput;
}>;

export interface HarnessRuntimeResidentAdapterOptions {
  runtime: HarnessRuntimeFacade;
  /** Explicit so tests and alternate deployments cannot silently bypass the real route boundary. */
  routeFactory: ResidentGatewayRouteFactory;
  /** Narrow construction seams used by failure/authority tests. */
  controlServiceFactory?: (options: ControlActionServiceOptions) => ControlActionService;
  controlBridgeFactory?: typeof startControlActionBridge;
  /** Test seam for the common automatic recovery backoff. */
  recoveryDelayMs?: (attempt: number) => number;
}

export type HarnessRuntimeResidentAdapterOverrides = Omit<
  HarnessRuntimeResidentAdapterOptions,
  "runtime" | "routeFactory"
>;

/** Production composition keeps the real Facade route boundary non-optional. */
export function createProductionHarnessRuntimeResidentAdapter(
  runtime: HarnessRuntimeFacade,
  overrides: HarnessRuntimeResidentAdapterOverrides = {}
): HarnessRuntimeResidentAdapter {
  return new HarnessRuntimeResidentAdapter({
    runtime,
    routeFactory: (request, onTrace, signal) =>
      runtime.openResidentTurnGatewayRoute(request, onTrace, signal),
    ...overrides
  });
}

export interface ResidentLeaderControlScope {
  role?: "leader";
  projectId: string;
  nodeRunId: string;
  groupRunId: string;
  leaderAgentId: string;
  coordinatorEpoch: number;
}

export interface ResidentScopedLeaderControlScope {
  role: "scoped-leader" | "scoped-main";
  projectId: string; nodeRunId: string; groupRunId: string; leaderAgentId: string; coordinatorEpoch: number;
  memberNodeIds: string[]; routeCandidates: string[]; sourceArrivalRequestId?: string;
  sourceOuterNodeRunId?: string;
  failedArrivalRequestIds: string[]; recoveryOptions?: import("../types.js").ScopedRecoveryOption[];
  closingArrivalRequestIds?: string[]; worktreeClosingOnly?: true; allowReconfiguration: boolean;
}

export interface ResidentStandaloneRouteControlScope {
  role: "standalone-route";
  projectId: string;
  nodeRunId: string;
  executionId: string;
  agentId: string;
  ownershipEpoch: number;
  candidates: readonly string[];
  decisionBy: "agent";
}

/** Same worker control front door, restricted to this arrival's local weak
 * candidates. It never grants the group's management or root Main authority. */
export interface ResidentScopedAgentControlScope {
  role: "scoped-agent";
  projectId: string;
  nodeRunId: string;
  groupRunId: string;
  executionId: string;
  agentId: string;
  ownershipEpoch: number;
  candidates: readonly string[];
  decisionBy: "agent" | "main";
}

/** Artifact publication only; valid for standalone, group, and final delivery. */
export interface ResidentExecutionArtifactControlScope {
  role: "execution-artifact";
  projectId: string;
  nodeRunId: string;
  executionId: string;
  agentId: string;
  ownershipEpoch: number;
  terminalPushObservation?: import("../types.js").TerminalPushObservationScope;
  worktreeClosing?: import("../types.js").WorktreeClosingScope;
}

/** The system supplies a retained management session and transports its own
 * decision. This grant carries no business routing or group completion power. */
export type ResidentReceiptCoordinatorControlScope = {
  role: "receipt-coordinator";
  projectId: string;
  nodeRunId: string;
  leaderAgentId: string;
  coordinatorEpoch: number;
  terminalPushCoordination: import("../types.js").TerminalPushCoordinationScope;
} & ({ groupRunId: string; routeScopeId?: never } | { routeScopeId: string; groupRunId?: never });

/** Main-only management turn that routes a workflow node, never a group leader. */
export interface ResidentMainRouteControlScope {
  role: "main-route";
  projectId: string;
  nodeRunId: string;
  routeScopeId: string;
  leaderAgentId: "main";
  coordinatorEpoch: number;
  candidates: readonly string[];
  tasklessRouteTargets: readonly string[];
  allowUserIntervention: boolean;
  allowWorkflowReconfiguration: boolean;
  canComplete: boolean;
  allowFinishRoute: boolean;
}

/** Full legacy Main semantics for an actual outer Main node. */
export interface ResidentMainNodeControlScope {
  role: "main-node";
  projectId: string;
  nodeRunId: string;
  routeScopeId: string;
  leaderAgentId: "main";
  coordinatorEpoch: number;
  candidates: readonly string[];
  tasklessRouteTargets: readonly string[];
  allowUserIntervention: boolean;
  allowWorkflowReconfiguration: boolean;
  canComplete: boolean;
  allowFinishRoute: false;
}

export type ResidentControlScope =
  | ResidentReceiptCoordinatorControlScope
  | ResidentScopedLeaderControlScope
  | ResidentLeaderControlScope
  | ResidentStandaloneRouteControlScope
  | ResidentScopedAgentControlScope
  | ResidentExecutionArtifactControlScope
  | ResidentMainRouteControlScope
  | ResidentMainNodeControlScope;

/** Structural match for CollaborationResidentLauncher.open without importing its owner module. */
export interface HarnessRuntimeResidentOpenInput {
  request: AgentRunRequest;
  /** Required for leader management; forbidden for delivery/final-integration. */
  inputs?: InvocationInputs;
  executionRuntimePath: string;
  sameEpochReopen?: PrepareResidentScopeRequest["sameEpochReopen"];
  unstartedSession?: PrepareResidentScopeRequest["unstartedSession"];
  filesystemAuthorityInput: PrepareResidentScopeRequest["filesystemAuthorityInput"];
  signal: AbortSignal;
  onTrace: TraceSink;
  controlScope?: ResidentControlScope;
  /** Required whenever this resident exposes orchestration control tools. */
  controlAuthorityFactory?: ResidentControlAuthorityFactory;
  /** Required when later turns use a fresh invocation id/callback ownership. */
  turnRequestFactory?: ResidentTurnRequestFactory;
}

export interface HarnessRuntimeResidentHandle {
  readonly initialLease: ResidentProcessLease;
  submit(input: {
    inputId: string;
    invocationId: string;
    prompt: string;
  }): Promise<AgentRunResult>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  probe(): Promise<ResidentProcessLease>;
  supervisionActions?(): Promise<string[]>;
  close(): Promise<void>;
}

/** The broker refused a turn before it could be submitted to the native lease. */
export class ResidentTurnPreparationError extends Error {
  constructor(readonly cause: unknown) {
    super(cause instanceof Error ? cause.message : "Resident turn preparation failed", { cause });
    this.name = "ResidentTurnPreparationError";
  }
}

export interface HarnessRuntimeResidentReconcileInput {
  /** Complete fresh server-owned reopen input for the advanced epoch. */
  open: HarnessRuntimeResidentOpenInput;
  nextOwnershipEpoch: number;
}

export interface HarnessRuntimeResidentReconcileResult {
  reconciliation: ResidentStartupReconcileResult;
  handle: HarnessRuntimeResidentHandle;
}

/**
 * Production adapter from the collaboration scheduler's small resident handle
 * to HarnessRuntimeFacade.  A process sees only stable loopback frontdoors;
 * provider and orchestration authority are installed for one submitted turn.
 */
export class HarnessRuntimeResidentAdapter {
  readonly #options: HarnessRuntimeResidentAdapterOptions;

  constructor(options: HarnessRuntimeResidentAdapterOptions) {
    this.#options = options;
  }

  async reconcile(
    input: HarnessRuntimeResidentReconcileInput
  ): Promise<HarnessRuntimeResidentReconcileResult> {
    assertOpenInputAuthority(input.open);
    const context = input.open.request.executionContext!;
    const contextEpoch = context.role === "leader"
      ? context.coordinatorEpoch
      : context.ownershipEpoch;
    const harnessId = input.open.request.project.agents[input.open.request.agent]?.harness;
    if (!harnessId || contextEpoch !== input.nextOwnershipEpoch) {
      throw adapterError("Resident reconcile input does not match its advanced epoch");
    }
    if (this.#options.runtime.residentRecoveryStrategy(harnessId) === "durable-rehydrate" &&
      !input.open.turnRequestFactory) {
      throw adapterError(
        "DSH resident recovery requires a turn request factory with durable provenance"
      );
    }
    const reconciliation = await this.#options.runtime.reconcileResidentStartup({
      executionId: residentScopeId(context),
      harnessId,
      runtimePath: input.open.executionRuntimePath,
      nextOwnershipEpoch: input.nextOwnershipEpoch
    });
    // reconcileResidentStartup returns only after an identity-matched old PGID
    // is gone. Never reuse its stdio; open always allocates a fresh process and
    // the LeaseManager fences it at nextOwnershipEpoch.
    const handle = await this.open(input.open);
    return { reconciliation, handle };
  }

  async open(input: HarnessRuntimeResidentOpenInput): Promise<HarnessRuntimeResidentHandle> {
    assertOpenInputAuthority(input);
    const context = input.request.executionContext!;
    const harnessId = input.request.project.agents[input.request.agent]?.harness;
    if (!harnessId) {
      throw adapterError(`Agent ${input.request.agent} has no locked resident Harness`);
    }
    const protocol = this.#options.runtime.nativeProtocol(harnessId);
    if (!protocol) throw adapterError(`Harness ${harnessId} has no native protocol`);

    const request: AgentRunRequest = {
      ...input.request,
      ...(input.request.terminalPushObservation || input.request.terminalPushCoordination || input.request.worktreeClosing ? { permission: "workspace" as const } : {}),
      ...(input.request.worktreeClosing ? { worktreeClosing: structuredClone(input.request.worktreeClosing) } : {}),
      project: structuredClone(input.request.project),
      executionContext: structuredClone(context)
    };
    const model = request.project.agents[request.agent]?.model;
    if (!model) throw adapterError(`Agent ${request.agent} has no locked resident model`);
    const controlTemplate = deriveControlTemplate(request, input.controlScope);
    if (controlTemplate && request.onProjectStateRequest) controlTemplate.projectState = true;
    if (controlTemplate && input.inputs?.workflowAuthoringPath) {
      controlTemplate.workflowAuthoringPath = input.inputs.workflowAuthoringPath;
    }
    if (controlTemplate && !input.controlAuthorityFactory) {
      throw adapterError(
        "Resident orchestration control requires a per-turn server-owned authority factory"
      );
    }
    if (!controlTemplate && input.controlAuthorityFactory) {
      throw adapterError(
        "Resident control authority factory requires an explicit server-owned control scope"
      );
    }
    const gatewayFrontdoor = await StableGatewayFrontdoor.open(protocol, model);
    let controlFrontdoor: StableControlFrontdoor | undefined;
    try {
      controlFrontdoor = controlTemplate
        ? await StableControlFrontdoor.open(
            input.executionRuntimePath,
            discoveryCapabilityContext(request, controlTemplate)
          )
        : undefined;
    } catch (error) {
      await gatewayFrontdoor.close().catch(() => undefined);
      throw error;
    }
    const siiBinding = await this.#options.runtime.openSiiBinding(request, input.signal, input.filesystemAuthorityInput, input.inputs).catch(async error => {
      await gatewayFrontdoor.close(); await controlFrontdoor?.close(); throw error;
    });
    if (siiBinding) request.siiMcp = { url: siiBinding.url };
    const broker = new StableTurnAuthorityBroker({
      siiBinding,
      runtime: this.#options.runtime,
      request,
      executionRuntimePath: input.executionRuntimePath,
      ownershipEpoch: context.role === "leader"
        ? context.coordinatorEpoch
        : context.ownershipEpoch,
      gatewayFrontdoor,
      controlFrontdoor,
      controlTemplate,
      ...(input.controlAuthorityFactory
        ? { controlAuthorityFactory: input.controlAuthorityFactory }
        : {}),
      ...(input.turnRequestFactory ? { turnRequestFactory: input.turnRequestFactory } : {}),
      routeFactory: this.#options.routeFactory,
      controlServiceFactory: this.#options.controlServiceFactory ??
        ((options) => new ControlActionService(options)),
      controlBridgeFactory: this.#options.controlBridgeFactory ?? startControlActionBridge,
      signal: input.signal,
      onTrace: input.onTrace
    });

    let openedLease: ResidentProcessLease | undefined;
    try {
      const launchRequest: AgentRunRequest = {
        ...request,
        ...(controlTemplate ? { control: controlTemplate } : { control: undefined })
      };
      const prepared = await this.#options.runtime.prepareResidentScope({
        request: launchRequest,
        ...(context.role === "leader" ? { inputs: input.inputs! } : {}),
        launchRoute: request.project.agents[request.agent].nativeCodexProfileId
          ? modelRouteBinding(await this.#options.runtime.openResidentTurnGatewayRoute(launchRequest, input.onTrace, input.signal))
          : gatewayFrontdoor.route,
        filesystemAuthorityInput: input.filesystemAuthorityInput,
        ...(controlFrontdoor
          ? { controlMcp: broker.controlMcpBinding(controlFrontdoor) }
          : {}),
        executionRuntimePath: input.executionRuntimePath,
        ...(input.sameEpochReopen ? { sameEpochReopen: input.sameEpochReopen } : {}),
        ...(input.unstartedSession ? { unstartedSession: input.unstartedSession } : {}),
        turnAuthority: broker,
        signal: input.signal,
        onTrace: (kind, message, data) => broker.trace(kind, message, data),
        onFrame: (frame, turn) => broker.acceptFrame(frame, turn)
      });
      broker.configurePrompt(prepared.spec.inputs, prepared.spec.policy, prepared.filesystemAuthority, Boolean(prepared.filesystemMcp));
      const result = await this.#options.runtime.openResidentScope(prepared);
      openedLease = result.lease;
      broker.bindNativeSession(result.lease.session);
      if (siiBinding) siiBinding.session = result.lease.session;
      return new FacadeResidentHandle(this.#options.runtime, broker, result.lease, this.#options.recoveryDelayMs);
    } catch (error) {
      await broker.close().catch(() => undefined);
      if (openedLease) {
        // openResidentScope owns native cleanup until it returns; after return
        // the handle normally owns it. This branch is only a bootstrap-release
        // failure, so close the registered lease as well.
        const snapshot = { ...broker.leaseAuthority(harnessId, residentScopeId(context), 1),
          ...(openedLease.physicalLeaseId ? { physicalLeaseId: openedLease.physicalLeaseId } : {}) };
        await this.#options.runtime.closeResident(snapshot).catch(() => undefined);
      }
      throw error;
    }
  }
}

class FacadeResidentHandle implements HarnessRuntimeResidentHandle {
  #logicalSubmit = false;
  readonly initialLease: ResidentProcessLease;
  readonly #runtime: HarnessRuntimeFacade;
  readonly #broker: StableTurnAuthorityBroker;
  readonly #executionId: string;
  readonly #harnessId: string;
  readonly #ownershipEpoch: number;
  readonly #physicalLeaseId?: string;
  #controlSeq: number;
  #tail: Promise<unknown> = Promise.resolve();
  #closeRequested = false;
  #runtimeClosed = false;
  #brokerClosed = false;
  #closed = false;
  #retryRequest?: AgentRunRequest;
  readonly #recoveryDelayMs: (attempt: number) => number;

  constructor(
    runtime: HarnessRuntimeFacade,
    broker: StableTurnAuthorityBroker,
    lease: ResidentProcessLease,
    recoveryDelayMs = harnessRecoveryDelayMs
  ) {
    this.#runtime = runtime;
    this.#broker = broker;
    this.initialLease = structuredClone(lease);
    this.#executionId = lease.executionId;
    this.#harnessId = lease.harnessId;
    this.#ownershipEpoch = lease.ownershipEpoch;
    this.#physicalLeaseId = lease.physicalLeaseId;
    this.#controlSeq = lease.acknowledgedControlSeq;
    this.#recoveryDelayMs = recoveryDelayMs;
  }

  async submit(input: {
    inputId: string;
    invocationId: string;
    prompt: string;
  }): Promise<AgentRunResult> {
    if (this.#logicalSubmit) throw adapterError("This Agent already owns an unfinished native task");
    this.#logicalSubmit = true;
    try {
      let notification = this.#broker.siiEnabled ? await this.#broker.waitForExperiments(undefined) : undefined;
      let experimentNotice = Boolean(notification);
      let round = 0;
      for (;;) {
        this.#assertOpen();
        while ((await this.#runtime.probeResident(this.#nextAuthority())).state === "paused") {
          this.#broker.signal.throwIfAborted();
          await new Promise(resolve => setTimeout(resolve, 250));
          this.#assertOpen();
        }
        if (notification && experimentNotice) await this.#broker.beginExperimentResume();
        const current = { ...input, inputId: `${input.inputId}${round ? `:sii:${round}` : ""}`, prompt: notification ?? input.prompt,
          ...(notification ? { nativeNotice: notification } : {}) };
        const result = await this.#submitWithRecovery(current);
        notification = this.#broker.siiEnabled ? await this.#broker.waitForExperiments(result.handoff) : undefined;
        experimentNotice = Boolean(notification);
        if (!notification) {
          await this.#broker.assertExperimentsComplete();
          await this.#broker.clearExperimentWait(); return result;
        }
        round += 1;
      }
    } finally { this.#logicalSubmit = false; }
  }

  async #submitWithRecovery(input: { inputId: string; invocationId: string; prompt: string; nativeNotice?: string }): Promise<AgentRunResult> {
    let current = input;
    let attempt = 0;
    let lastError: ResidentTurnRetryableError | undefined;
    for (;;) {
      this.#broker.signal.throwIfAborted();
      this.#assertOpen();
      try {
        const result = await this.#submitPhysical(current);
        if (lastError) await this.#retryRequest?.onHarnessRecovery?.({ phase: "recovered",
          inputId: current.inputId, invocationId: input.invocationId, harnessId: this.#harnessId, attempt, errorCode: lastError.code, message: lastError.safeMessage });
        this.#retryRequest = undefined;
        return result;
      } catch (error) {
        if (!(error instanceof ResidentTurnRetryableError) || this.#broker.signal.aborted) throw error;
        lastError = error;
        attempt += 1;
        const request = this.#retryRequest!;
        const retryDelay = this.#recoveryDelayMs(attempt);
        const nextRetryAt = new Date(Date.now() + retryDelay).toISOString();
        await request.onHarnessRecovery?.({ phase: "waiting", inputId: current.inputId,
          invocationId: input.invocationId, harnessId: this.#harnessId, attempt,
          errorCode: error.code, message: error.safeMessage, nextRetryAt });
        // Outside the serialized native command: explicit Pause/Stop must be
        // able to suspend or close this idle process during recovery backoff.
        await request.onHarnessRecoveryWait?.(true);
        await this.#broker.trace("status", "模型调用暂时失败，正在自动恢复原任务…", {
          diagnostic: true, automaticRecovery: true, errorCode: error.code,
          attempt, nextRetryAt, inputId: current.inputId, invocationId: input.invocationId
        });
        await delay(retryDelay, undefined, { signal: this.#broker.signal });
        await request.onHarnessRecoveryWait?.(false);
        for (;;) {
          this.#broker.signal.throwIfAborted();
          this.#assertOpen();
          const lease = await this.probe();
          if (["crashed", "stopped", "stopping"].includes(lease.state)) throw new HarnessRuntimeError(
            error.code, "Original Harness process exited during automatic recovery", error.details,
            { source: error.source, retryable: true, cause: error });
          if (lease.state !== "paused") break;
          await delay(100, undefined, { signal: this.#broker.signal });
        }
        current = { ...input, inputId: `${input.inputId}:gateway-recovery:${attempt}`,
          prompt: `${sessionRecoveryNote(error.safeMessage)}\n\nThe preceding model request failed; it did not complete this task. Read the current formal state and actual tool receipts before continuing. Preserve successful state patches, files, commits and merged PRs. Regenerate only the unfinished tool call as one complete JSON object; a changed mutation needs the current version and a new callId.\n\n${input.prompt}` };
      }
    }
  }

  #submitPhysical(input: { inputId: string; invocationId: string; prompt: string; nativeNotice?: string }): Promise<AgentRunResult> {
    return this.#serialized(async () => {
      this.#assertOpen();
      let turn: ResidentTurn;
      try {
        turn = await this.#broker.prepareTurn(input);
      } catch (error) {
        // No native input or lease control was attempted. The launcher may
        // retain this handle and still Pause or submit a valid later turn.
        throw new ResidentTurnPreparationError(error);
      }
      this.#retryRequest = this.#broker.requestFor(turn);
      try {
        const submitted = await this.#runtime.submitResidentTurn(
          this.#nextAuthority(),
          turn,
          this.#broker.requestFor(turn)
        );
        return submitted.result;
      } catch (error) {
        await this.#broker.cancelPrepared(turn).catch(() => undefined);
        if (error instanceof ResidentInputPreparationError) throw new ResidentTurnPreparationError(error.cause);
        throw error;
      }
    });
  }

  pause(): Promise<void> {
    return this.#serialized(async () => {
      // A turn failure can finish closing this handle while its safe-point
      // Pause is queued. Successful native/broker close already proves it
      // cannot run. A failed or incomplete close still fails #assertOpen.
      if (this.#closed) return;
      this.#assertOpen();
      await this.#runtime.pauseResident(this.#nextAuthority());
    });
  }

  resume(): Promise<void> {
    return this.#serialized(async () => {
      this.#assertOpen();
      const lease = await this.#runtime.waitResident(this.#nextAuthority());
      if (lease.state === "paused") await this.#runtime.resumeResident(this.#nextAuthority());
    });
  }

  probe(): Promise<ResidentProcessLease> {
    return this.#serialized(async () => {
      this.#assertOpen();
      return this.#runtime.probeResident(this.#nextAuthority());
    });
  }

  async supervisionActions(): Promise<string[]> {
    this.#assertOpen();
    const pending = await this.#runtime.pendingResidentProcesses(this.#nextAuthority());
    return pending.length ? ["Processes started by this task are still running: " + JSON.stringify(pending.map(process => ({
      pid: process.pid, processGroupId: process.processGroupId, command: process.command, firstObservedAt: process.firstObservedAt
    }))) + ". Inspect and stop obsolete work using the native tools, or explicitly transfer an intentional isolated job with background_job. Managed experiments retain their own lifecycle."] : [];
  }

  close(): Promise<void> {
    return this.#serialized(async () => {
      if (this.#closed) return;
      this.#closeRequested = true;
      let failure: unknown;
      if (!this.#runtimeClosed) {
        try {
          await this.#runtime.closeResident(this.#nextAuthority());
          this.#runtimeClosed = true;
        } catch (error) {
          failure = error;
        }
      }
      if (!this.#brokerClosed) {
        try {
          await this.#broker.close();
          this.#brokerClosed = true;
        } catch (error) {
          failure ??= error;
        }
      }
      if (failure) throw failure;
      this.#closed = true;
    });
  }

  #serialized<T>(operation: () => Promise<T>): Promise<T> {
    const current = this.#tail.catch(() => undefined).then(operation);
    this.#tail = current;
    return current;
  }

  #nextAuthority(): ResidentLeaseAuthority {
    this.#controlSeq += 1;
    return {
      executionId: this.#executionId,
      harnessId: this.#harnessId,
      ownershipEpoch: this.#ownershipEpoch,
      ...(this.#physicalLeaseId ? { physicalLeaseId: this.#physicalLeaseId } : {}),
      controlSeq: this.#controlSeq
    };
  }

  #assertOpen(): void {
    if (this.#closeRequested) throw adapterError("Resident runtime handle is closing or closed");
  }
}

interface StableTurnAuthorityBrokerOptions {
  siiBinding?: SiiMcpBinding;
  runtime: HarnessRuntimeFacade;
  request: AgentRunRequest;
  executionRuntimePath: string;
  ownershipEpoch: number;
  gatewayFrontdoor: StableGatewayFrontdoor;
  controlFrontdoor?: StableControlFrontdoor;
  controlTemplate?: ControlMcpRequest;
  controlAuthorityFactory?: ResidentControlAuthorityFactory;
  turnRequestFactory?: ResidentTurnRequestFactory;
  routeFactory: ResidentGatewayRouteFactory;
  controlServiceFactory: NonNullable<HarnessRuntimeResidentAdapterOptions["controlServiceFactory"]>;
  controlBridgeFactory: NonNullable<HarnessRuntimeResidentAdapterOptions["controlBridgeFactory"]>;
  signal: AbortSignal;
  onTrace: TraceSink;
}

interface PreparedControlAuthority {
  capability: string;
  stagingPath: string;
  request: ControlMcpRequest;
  service: ControlActionService;
  bridge: ControlActionBridge;
  downstream: ControlMcpDownstream;
}

interface PreparedTurnAuthority {
  inboxPath: string;
  inputs: InvocationInputs;
  supplementaryIndexes: AgentContextIndex[];
  key: string;
  request: AgentRunRequest;
  turn: ResidentTurn;
  nativeTurn?: ResidentTurn;
  route: InvocationModelRoute;
  controller: AbortController;
  detachSignal: () => void;
  control?: PreparedControlAuthority;
  frameSink: ResidentTurnFrameSink;
  onTrace: TraceSink;
  installed: boolean;
  revoked: boolean;
}

class StableTurnAuthorityBroker implements ResidentTurnAuthorityBroker {
  get siiEnabled(): boolean { return Boolean(this.#options.siiBinding); }
  get signal(): AbortSignal { return this.#options.siiBinding?.signal ?? this.#options.signal; }
  waitForExperiments(handoff: string | undefined): Promise<string | undefined> { return this.#options.siiBinding?.wait(handoff, (kind, message, data) => this.trace(kind, message, data)) ?? Promise.resolve(undefined); }
  beginExperimentResume(): Promise<void> { return this.#options.siiBinding?.beginResume() ?? Promise.resolve(); }
  clearExperimentWait(): Promise<void> { return this.#options.siiBinding?.clearWait() ?? Promise.resolve(); }
  assertExperimentsComplete(): Promise<void> { return this.#options.siiBinding?.assertTaskComplete() ?? Promise.resolve(); }
  readonly #options: StableTurnAuthorityBrokerOptions;
  readonly #pending = new Map<string, PreparedTurnAuthority>();
  readonly #returnedTurns = new Map<string, { turn: ResidentTurn; onTrace: TraceSink }>();
  #current?: PreparedTurnAuthority;
  #tail: Promise<unknown> = Promise.resolve();
  #closed = false;
  #closeComplete = false;
  #turnSequence = 0;
  #promptContext?: { inputs: InvocationInputs; policy: InvocationPolicy; authority: FilesystemAuthority; filesystemMcpAvailable: boolean };
  #nativeSession?: SessionRef;

  constructor(options: StableTurnAuthorityBrokerOptions) {
    this.#options = options;
  }

  bindNativeSession(session: SessionRef): void {
    if (this.#nativeSession || !validateSessionRef(session).valid || !session.durable) {
      throw adapterError("Resident result transport requires its actual unique durable native Session");
    }
    this.#nativeSession = structuredClone(session);
  }

  configurePrompt(inputs: InvocationInputs, policy: InvocationPolicy, authority: FilesystemAuthority, filesystemMcpAvailable: boolean): void {
    this.#promptContext = { inputs, policy, authority, filesystemMcpAvailable };
  }

  controlMcpBinding(frontdoor: StableControlFrontdoor): ResidentControlMcpBinding {
    return {
      row: frontdoor.row,
      turnAuthority: this,
      assertReady: () => frontdoor.assertReady()
    };
  }

  async prepareTurn(input: {
    inputId: string;
    invocationId: string;
    prompt: string;
    nativeNotice?: string;
  }): Promise<ResidentTurn> {
    assertTurnInput(input);
    if (this.#closed) throw adapterError("Resident turn authority is closed");
    if (this.#options.signal.aborted) throw adapterError("Resident turn authority was cancelled");
    const key = turnKey(input.inputId, input.invocationId);
    if (this.#pending.has(key) || this.#current?.key === key) {
      throw adapterError("Resident turn authority rejected a duplicate input identity");
    }

    const controller = new AbortController();
    const abort = () => controller.abort(this.#options.signal.reason);
    this.#options.signal.addEventListener("abort", abort, { once: true });
    const detachSignal = () => this.#options.signal.removeEventListener("abort", abort);
    let control: PreparedControlAuthority | undefined;
    let route: InvocationModelRoute | undefined;
    try {
      const runtime: Awaited<ReturnType<ResidentTurnRequestFactory>> =
        this.#options.turnRequestFactory
        ? await this.#options.turnRequestFactory({
            baseRequest: this.#options.request,
            turn: structuredClone(input)
          })
        : (() => {
            if (input.invocationId !== this.#options.request.invocationId) {
              throw adapterError(
                "A later resident invocation requires a per-turn runtime factory"
              );
            }
            return {
              request: this.#options.request,
              onTrace: this.#options.onTrace,
              durableRehydrate: undefined
            };
          })();
      assertTurnRuntime(runtime, this.#options.request, input);
      const requestWithoutControl: AgentRunRequest = {
        ...runtime.request,
        ...(this.#options.siiBinding ? { siiMcp: { url: this.#options.siiBinding.url } } : {}),
        control: undefined
      };
      const controlAuthority = this.#options.controlTemplate
        ? await this.#options.controlAuthorityFactory!({
            request: requestWithoutControl,
            turn: structuredClone(input)
          })
        : undefined;
      control = controlAuthority
        ? await this.#prepareControl(requestWithoutControl, input, controlAuthority, controller.signal)
        : undefined;
      const request: AgentRunRequest = {
        ...requestWithoutControl,
        ...(control ? { control: control.request } : {})
      };
      const publish = request.onOfficialHarnessEvent;
      request.onOfficialHarnessEvent = async event => {
        const session = this.#nativeSession ? structuredClone(this.#nativeSession) : undefined;
        await publish?.(event, session);
        await this.#options.siiBinding?.observeNativeResult(event, session);
      };
      const observeInput = request.onNativeUserInput;
      request.onNativeUserInput = async event => {
        const session = this.#nativeSession ? structuredClone(this.#nativeSession) : undefined;
        await observeInput?.(event, session);
        await this.#options.siiBinding?.observeNativeNotification(event, session);
      };
      route = await this.#options.routeFactory(
        request,
        runtime.onTrace,
        controller.signal
      );
      assertInvocationRoute(route);
      // Bounded supplements retain their invocation and native Session, but
      // each submitted input owns a new native event/call sequence.
      const frameSink = this.#options.runtime.createResidentTurnFrameSink(request, input.inputId);
      const context = this.#promptContext;
      if (!context) throw adapterError("Resident prompt context was not prepared");
      const sources = new AgentContextSources();
      sources.record("resident-assignment", "Current resident assignment", input.prompt);
      let inputs = await this.#options.runtime.prepareAgentContext({ ...request,
        contextSources: [...(request.contextSources ?? []), ...sources.sources] }, {
        ...context.inputs,
        ...(request.invocationId !== this.#options.request.invocationId ? { inboxPath: request.inboxPath } : {})
      });
      inputs = { ...inputs, contextIndex: await this.#options.runtime.contextIndexes.delivery(inputs.contextIndex,
        inputs.projectPath, request.agent, this.#nativeSession) };
      if (request.onPendingControlResults && !this.#nativeSession) {
        throw adapterError("Result notification requires the actually opened native Session");
      }
      const resultNotification = request.onPendingControlResults
        ? await request.onPendingControlResults(input.inputId, structuredClone(this.#nativeSession!)) : "";
      const unboundedPrompt = [
        resultNotification,
        compileWorkflowPrompt(request, inputs, context.policy, { inlineInbox: input.nativeNotice ?? input.prompt }),
      ].filter(Boolean).join("\n\n");
      const fitted = fitContextInjection(unboundedPrompt, agentContextWindow(request.project.agents[request.agent]),
        [], context.policy.constraintPrompt);
      const prompt = fitted.prompt;
      route.setInjectionBudget?.(prompt, context.policy.constraintPrompt);
      this.#turnSequence += 1;
      const turn: ResidentTurn = {
        inputId: input.inputId,
        invocationId: input.invocationId,
        prompt,
        route: modelRouteBinding(route),
        ...(control ? { controlCapability: control.capability } : {}),
        ...(runtime.durableRehydrate
          ? { durableRehydrate: structuredClone(runtime.durableRehydrate) }
          : {})
      };
      const prepared: PreparedTurnAuthority = {
        inboxPath: inputs.inboxPath,
        inputs,
        supplementaryIndexes: [],
        key,
        request,
        turn,
        route,
        controller,
        detachSignal,
        ...(control ? { control } : {}),
        frameSink,
        onTrace: runtime.onTrace,
        installed: false,
        revoked: false
      };
      this.#pending.set(key, prepared);
      return structuredClone(turn);
    } catch (error) {
      controller.abort(error);
      detachSignal();
      if (route) await route.close().catch(() => undefined);
      if (control) await closePreparedControl(control).catch(() => undefined);
      throw error;
    }
  }

  activate(turn: ResidentTurn): Promise<ResidentTurnAuthorityLease> {
    return this.#serialized(async () => {
      if (this.#closed) throw adapterError("Resident turn authority is closed");
      const key = turnKey(turn.inputId, turn.invocationId);
      const prepared = this.#pending.get(key);
      if (!prepared || !sameTurnAuthority(prepared.turn, turn)) {
        if (prepared) {
          this.#pending.delete(key);
          await this.#dispose(prepared, "failed");
        }
        throw adapterError("Resident turn authority activation is stale or was not prepared");
      }
      this.#pending.delete(key);
      if (Boolean(prepared.control) !== Boolean(this.#options.controlFrontdoor)) {
        await this.#dispose(prepared, "failed");
        throw adapterError("Resident control authority does not match its stable frontdoor");
      }
      if (this.#current) {
        this.#revoke(prepared);
        await this.#dispose(prepared, "failed");
        throw adapterError("A previous resident turn authority is still active");
      }

      // No await is permitted between these assignments. They form one event-
      // loop atomic publication of Gateway plus control downstream authority.
      this.#options.gatewayFrontdoor.rotate("nativeCodexProfileHome" in prepared.route ? undefined : prepared.route);
      this.#options.controlFrontdoor?.rotate(prepared.control?.downstream);
      this.#current = prepared;
      this.#options.siiBinding?.activate(prepared.request);
      prepared.installed = true;
      try {
        prepared.request.onResidentTurnActivity?.({ inputId: turn.inputId, invocationId: turn.invocationId, active: true });
        await prepared.onTrace("status", "Resident turn authority activated", {
          diagnostic: true,
          diagnosticSource: "proxy",
          resident: true,
          invocationId: turn.invocationId,
          inputId: turn.inputId,
          authoritySequence: this.#turnSequence
        });
      } catch (error) {
        if (this.#current === prepared) {
          this.#options.gatewayFrontdoor.rotate(undefined);
          this.#options.controlFrontdoor?.rotate(undefined);
          this.#current = undefined;
        }
        this.#revoke(prepared);
        await this.#dispose(prepared, "failed");
        throw error;
      }

      let releasePromise: Promise<void | readonly ControlActionEnvelope[]> | undefined;
      return {
        inputId: turn.inputId,
        invocationId: turn.invocationId,
        ownershipEpoch: this.#options.ownershipEpoch,
        inputSupplement: async () => {
          if (this.#current !== prepared || prepared.revoked || !this.#nativeSession)
            throw adapterError("Late native input facts lost their actual resident authority");
          const rawSupplement = await prepared.request.onPendingWorkflowAdjustments?.(prepared.turn.inputId, structuredClone(this.#nativeSession),
            async sources => {
              const index = await this.#options.runtime.publishContextIndex({ projectId: prepared.request.project.id,
                projectPath: prepared.inputs.projectPath, inboxPath: prepared.inboxPath, sources });
              if (index) prepared.supplementaryIndexes.push(index);
              return index?.preview ?? "";
            }) ?? "";
          const supplement = fitContextInjection(rawSupplement, agentContextWindow(prepared.request.project.agents[prepared.request.agent]),
            prepared.supplementaryIndexes.map(index => ({ text: index.preview, alternatives: [index.compactPreview, index.minimalPreview] })),
            `${prepared.turn.prompt}\n\n${this.#promptContext!.policy.constraintPrompt}`).prompt;
          if (typeof supplement !== "string" || this.#current !== prepared || prepared.revoked)
            throw adapterError("Late native input facts changed their active authority");
          prepared.nativeTurn = supplement ? { ...prepared.turn, prompt: `${supplement}\n\n${prepared.turn.prompt}` } : prepared.turn;
          prepared.route.setInjectionBudget?.(prepared.nativeTurn.prompt, this.#promptContext!.policy.constraintPrompt);
          return supplement;
        },
        classifyFailure: error => {
          const failure = prepared.route.getFailure();
          return failure ? proxyFailureError(failure, this.#nativeSession!.harnessId, error) : error;
        },
        release: async (outcome) => {
          releasePromise ??= this.#serialized(() => this.#release(prepared, outcome));
          return releasePromise;
        }
      };
    });
  }

  async cancelPrepared(turn: ResidentTurn): Promise<void> {
    const key = turnKey(turn.inputId, turn.invocationId);
    return this.#serialized(async () => {
      const prepared = this.#pending.get(key);
      if (!prepared) return;
      this.#pending.delete(key);
      this.#revoke(prepared);
      await this.#dispose(prepared, "failed");
    });
  }

  requestFor(turn: ResidentTurn): AgentRunRequest {
    const key = turnKey(turn.inputId, turn.invocationId);
    const prepared = this.#pending.get(key) ??
      (this.#current?.key === key ? this.#current : undefined);
    if (!prepared || !sameTurnAuthority(prepared.turn, turn)) {
      throw adapterError("Resident turn validation request is unavailable");
    }
    return prepared.request;
  }

  async acceptFrame(
    frame: Readonly<Record<string, unknown>>,
    turn?: ResidentTurn
  ): Promise<void> {
    // Initialization and shutdown acknowledgements do not belong to a model
    // turn and must never be attributed to the open-time invocation.
    if (!turn) return;
    const key = turnKey(turn.inputId, turn.invocationId);
    const prepared = this.#current?.key === key
      ? this.#current
      : this.#pending.get(key);
    const returned = this.#returnedTurns.get(key);
    if (!prepared && returned && sameTurnAuthority(returned.turn, turn) &&
      typeof frame.method === "string") {
      const params = frame.params && typeof frame.params === "object" && !Array.isArray(frame.params)
        ? frame.params as Record<string, unknown> : undefined;
      try { await returned.onTrace("output", JSON.stringify(frame), { diagnostic: true, diagnosticSource: "adapter",
        late: true, ...(typeof params?.threadId === "string" &&
          params.threadId !== this.#nativeSession?.nativeId ? { foreignSystemMessage: true } : {}),
        inputId: turn.inputId, invocationId: turn.invocationId, nativeFrame: frame }); }
      catch (error) { console.warn(`Late native diagnostic unavailable: ${redactTrace(error instanceof Error ? error.message : String(error)).slice(0, 2000)}`); }
      return;
    }
    if (!prepared || !sameTurnAuthority(prepared.nativeTurn ?? prepared.turn, turn)) {
      throw adapterError("Resident protocol frame has no active turn attribution");
    }
    await prepared.frameSink.accept(frame);
  }

  trace(
    kind: Parameters<TraceSink>[0],
    message: Parameters<TraceSink>[1],
    data?: Parameters<TraceSink>[2]
  ): ReturnType<TraceSink> {
    return (this.#current?.onTrace ?? this.#options.onTrace)(kind, message, data);
  }

  leaseAuthority(
    harnessId: string,
    executionId: string,
    controlSeq: number
  ): ResidentLeaseAuthority {
    return {
      harnessId,
      executionId,
      ownershipEpoch: this.#options.ownershipEpoch,
      controlSeq
    };
  }

  async close(): Promise<void> {
    return this.#serialized(async () => {
      if (this.#closeComplete) return;
      this.#closed = true;
      this.#options.siiBinding?.close();
      this.#options.gatewayFrontdoor.rotate(undefined);
      this.#options.controlFrontdoor?.rotate(undefined);
      const authorities = [
        ...(this.#current ? [this.#current] : []),
        ...this.#pending.values()
      ];
      this.#current = undefined;
      this.#pending.clear();
      for (const authority of authorities) this.#revoke(authority);
      await Promise.allSettled(authorities.map((authority) =>
        this.#dispose(authority, "failed")));
      await Promise.all([
        this.#options.gatewayFrontdoor.close(),
        this.#options.controlFrontdoor?.close() ?? Promise.resolve()
      ]);
      this.#closeComplete = true;
    });
  }

  async #prepareControl(
    request: AgentRunRequest,
    turn: Pick<ResidentTurn, "inputId" | "invocationId" | "prompt">,
    authority: ResidentTurnControlAuthority,
    signal: AbortSignal
  ): Promise<PreparedControlAuthority> {
    if (!authority || typeof authority.revalidate !== "function" ||
      authority.onRejected !== undefined && typeof authority.onRejected !== "function") {
      throw adapterError("Resident control authority factory omitted server revalidation");
    }
    const template = authority.control;
    assertTurnControlAuthority(
      template,
      this.#options.controlTemplate!,
      request,
      turn,
      this.#options.executionRuntimePath
    );
    const capability = template.capability;
    const stagingPath = path.resolve(template.stagingPath);
    const stagingDirectory = path.dirname(stagingPath);
    await fs.mkdir(stagingDirectory, { recursive: true, mode: 0o700 });
    const service = this.#options.controlServiceFactory({
      nativeJobScope: { projectId: request.project.id, projectPath: request.projectPath, agentId: request.agent, invocationId: turn.invocationId,
        workspacePath: request.workspacePath, ...(request.executionContext && "executionId" in request.executionContext ? { executionId: request.executionContext.executionId } : {}) },
      projectId: request.project.id,
      agent: request.agent,
      invocationId: turn.invocationId,
      stateVersion: template.stateVersion,
      capability,
      capabilityHash: template.capabilityHash,
      ...(template.expiresAt ? { expiresAt: template.expiresAt } : {}),
      stagingPath,
      signal,
      ...(request.onProjectStateRequest ? { projectState: input => request.onProjectStateRequest!(input) } : {}),
      ...(request.onControlResult ? { onResult: input => {
        if (!this.#nativeSession) throw adapterError("Native Session is unavailable for control result capture");
        return request.onControlResult!(input, structuredClone(this.#nativeSession));
      } } : {}),
      revalidate: (envelope, stagedActions) => {
        if (template.worktreeClosing && !worktreeClosingActionAllowed(envelope.action)) {
          throw adapterError("Worktree closing rejected an action outside its exact closing scope");
        }
        if (template.terminalPushCoordination &&
          !terminalPushCoordinationActionAllowed(template.terminalPushCoordination, envelope.action)) {
          throw adapterError("Receipt coordinator rejected an action outside its exact coordination scope");
        }
        if (template.terminalPushObservation &&
          !terminalPushObservationActionAllowed(template.terminalPushObservation, envelope.action)) {
          throw adapterError("Terminal push observation rejected an action outside its exact receipt scope");
        }
        return authority.revalidate(envelope, stagedActions);
      },
      ...(authority.onRejected
        ? { onRejected: authority.onRejected }
        : {})
      , ...(authority.execute
        ? { execute: authority.execute }
        : {})
    });
    let bridge: ControlActionBridge | undefined;
    let downstream: ControlMcpDownstream | undefined;
    try {
      bridge = await this.#options.controlBridgeFactory(service, stagingDirectory);
      const control: ControlMcpRequest = {
        ...stripControlAuthority(template),
        ...(request.onProjectStateRequest ? { projectState: true, nativeBackgroundJobs: true } : {}),
        stagingPath,
        capability,
        capabilityHash: template.capabilityHash,
        stateVersion: template.stateVersion,
        requireBridge: true,
        ...(bridge.endpoint.path ? { bridgePath: bridge.endpoint.path } : {}),
        ...(bridge.endpoint.port !== undefined
          ? {
              bridgePort: bridge.endpoint.port,
              bridgeHost: bridge.endpoint.host ?? "127.0.0.1"
            }
          : {})
      };
      const command = await resolveOrchestrationControlMcpCommand();
      downstream = await ControlMcpDownstream.open(command, {
        SCIENCEEVOLVE_CONTROL_CONTEXT: serializeInvocationControlContext(control, {
          projectId: request.project.id,
          agent: request.agent,
          invocationId: turn.invocationId,
          kind: request.kind,
          workspacePath: request.workspacePath
        }),
        SCIENCEEVOLVE_CONTROL_CAPABILITY: capability
      });
      return { capability, stagingPath, request: control, service, bridge, downstream };
    } catch (error) {
      service.revoke();
      await downstream?.close().catch(() => undefined);
      await bridge?.close().catch(() => undefined);
      throw error;
    }
  }

  async #release(
    prepared: PreparedTurnAuthority,
    outcome: "completed" | "failed"
  ): Promise<void | readonly ControlActionEnvelope[]> {
    this.#returnedTurns.set(prepared.key, { turn: prepared.nativeTurn ?? prepared.turn, onTrace: prepared.onTrace });
    if (this.#current === prepared) {
      this.#options.gatewayFrontdoor.rotate(undefined);
      this.#options.controlFrontdoor?.rotate(undefined);
      this.#current = undefined;
    }
    prepared.control?.service.seal();
    if (outcome === "failed") this.#revoke(prepared);
    const drains = await Promise.allSettled([
        "nativeCodexProfileHome" in prepared.route ? Promise.resolve() : this.#options.gatewayFrontdoor.drain(prepared.route),
        prepared.control && this.#options.controlFrontdoor
          ? this.#options.controlFrontdoor.drain(prepared.control.downstream)
          : Promise.resolve(),
        prepared.frameSink.drain(),
        prepared.control?.service.drain() ?? Promise.resolve()
      ]);
    const drainFailure = drains.slice(2).find((result): result is PromiseRejectedResult => result.status === "rejected");
    const cleanupFailures = drains.slice(0, 2).flatMap((result, index) => result.status === "rejected"
      ? [{ resource: index === 0 ? "gateway" : "control-transport", reason: redactTrace(result.reason instanceof Error ? result.reason.message : String(result.reason)).slice(0, 2000) }]
      : []);
    this.#revoke(prepared);
    let disposeFailure: unknown;
    try {
      await this.#dispose(prepared, outcome);
    } catch (error) {
      disposeFailure = error;
    }
    if (disposeFailure) cleanupFailures.push({ resource: "turn-transport", reason: redactTrace(
      disposeFailure instanceof Error ? disposeFailure.message : String(disposeFailure)).slice(0, 2000) });
    const actions = outcome === "completed" && prepared.control
      ? await readStagedControlActions(prepared.control.stagingPath)
      : [];
    if (outcome === "completed" && !drainFailure && !disposeFailure) {
      for (const index of [prepared.inputs.contextIndex, ...prepared.supplementaryIndexes]) {
        await this.#options.runtime.contextIndexes.acknowledge(index, prepared.inputs.projectPath,
          prepared.request.agent, this.#nativeSession).catch(() => undefined);
      }
    }
    try {
      await prepared.onTrace("status", "Resident turn authority released", {
        diagnostic: true,
        diagnosticSource: "proxy",
        resident: true,
        invocationId: prepared.turn.invocationId,
        inputId: prepared.turn.inputId,
        outcome,
        ...(cleanupFailures.length ? { resourceCleanupFailed: true, cleanupFailures } : {}),
        controlActionCount: actions.length
      });
    } catch {
      // A completed native turn and durable staged actions must not be lost
      // because diagnostic persistence became unavailable during release.
    }
    if (cleanupFailures.length) console.warn("Resident turn transport cleanup incomplete", cleanupFailures);
    if (drainFailure) throw drainFailure.reason;
    return actions;
  }

  #revoke(prepared: PreparedTurnAuthority): void {
    if (prepared.revoked) return;
    prepared.revoked = true;
    try {
      prepared.request.onResidentTurnActivity?.({ inputId: prepared.turn.inputId, invocationId: prepared.turn.invocationId, active: false });
    } finally {
      this.#options.siiBinding?.deactivate();
      prepared.controller.abort(new Error("resident turn authority revoked"));
      prepared.control?.service.revoke();
    }
  }

  async #dispose(
    prepared: PreparedTurnAuthority,
    outcome: "completed" | "failed"
  ): Promise<void> {
    prepared.detachSignal();
    const results = await Promise.allSettled([
      prepared.route.close(),
      ...(prepared.control ? [closePreparedControl(prepared.control)] : []),
      ...(outcome === "failed" && prepared.control
        ? [fs.rm(prepared.control.stagingPath, { force: true })]
        : [])
    ]);
    const rejected = results.find((result): result is PromiseRejectedResult =>
      result.status === "rejected");
    if (rejected) throw rejected.reason;
  }

  #serialized<T>(operation: () => Promise<T>): Promise<T> {
    const current = this.#tail.catch(() => undefined).then(operation);
    this.#tail = current;
    return current;
  }
}

class StableGatewayFrontdoor {
  readonly route: { baseUrl: string; token: string };
  readonly #protocol: string;
  readonly #model: string;
  readonly #server: HttpServer;
  readonly #sockets = new Set<Socket>();
  readonly #inflight = new Map<InvocationGatewayRoute, Set<Promise<void>>>();
  #current?: InvocationGatewayRoute;
  #closed = false;
  #closeComplete = false;

  private constructor(protocol: string, model: string, server: HttpServer, port: number) {
    this.#protocol = protocol;
    this.#model = model;
    this.#server = server;
    this.route = {
      baseUrl: `http://127.0.0.1:${port}/v1`,
      token: randomUUID().replaceAll("-", "")
    };
  }

  static async open(protocol: string, model: string): Promise<StableGatewayFrontdoor> {
    let frontdoor!: StableGatewayFrontdoor;
    const server = createHttpServer((request, response) => {
      void frontdoor.#handle(request, response);
    });
    server.on("connection", (socket) => {
      if (frontdoor) frontdoor.#sockets.add(socket);
      socket.once("close", () => {
        if (frontdoor) frontdoor.#sockets.delete(socket);
      });
    });
    await listenHttp(server);
    const address = server.address();
    if (!address || typeof address === "string") {
      await closeHttp(server, new Set());
      throw adapterError("Resident Gateway frontdoor did not receive a loopback address");
    }
    frontdoor = new StableGatewayFrontdoor(protocol, model, server, address.port);
    return frontdoor;
  }

  rotate(route: InvocationGatewayRoute | undefined): void {
    if (this.#closed && route) throw adapterError("Resident Gateway frontdoor is closed");
    if (route) assertLoopbackRoute(route.baseUrl);
    this.#current = route;
  }

  async drain(route: InvocationGatewayRoute): Promise<void> {
    const pending = [...(this.#inflight.get(route) ?? [])];
    if (!pending.length) return;
    await withDeadline(
      Promise.allSettled(pending).then(() => undefined),
      5_000,
      "Resident Gateway requests did not drain"
    );
  }

  async close(): Promise<void> {
    if (this.#closeComplete) return;
    this.#closed = true;
    this.#current = undefined;
    await closeHttp(this.#server, this.#sockets);
    this.#closeComplete = true;
  }

  async #handle(request: IncomingMessage, response: ServerResponse): Promise<void> {
    if (!authorizedGatewayRequest(request, this.#protocol, this.route.token)) {
      response.writeHead(401, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: { message: "resident Gateway credential is invalid" } }));
      return;
    }
    const requestPath = ((request.url ?? "").split("?", 1)[0] ?? "").replace(/\/+$/, "");
    if (request.method === "GET" && ["/health", "/v1/health"].includes(requestPath)) {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ ok: true }));
      return;
    }
    if (request.method === "GET" && ["/models", "/v1/models"].includes(requestPath) &&
      this.#protocol === "responses") {
      const body = codexModelsResponse(JSON.stringify({ data: [{ id: this.#model }] }));
      response.writeHead(200, {
        "content-type": "application/json",
        "content-length": Buffer.byteLength(body)
      });
      response.end(body);
      return;
    }
    if (request.method !== "POST") {
      response.writeHead(405, { allow: "POST", connection: "close" });
      response.end("method not allowed");
      return;
    }
    const endpoint = this.#protocol === "responses"
      ? "responses"
      : this.#protocol === "chat-completions"
        ? "chat/completions"
        : "messages";
    if (![`/${endpoint}`, `/v1/${endpoint}`].includes(requestPath)) {
      response.writeHead(404, { "content-type": "application/json", connection: "close" });
      response.end(JSON.stringify({ error: { message: "resident Gateway endpoint is unavailable" } }));
      return;
    }
    const current = this.#current;
    if (!current) {
      response.writeHead(503, { "content-type": "application/json", connection: "close" });
      response.end(JSON.stringify({ error: { message: "resident turn Gateway authority is inactive" } }));
      return;
    }
    let target: URL;
    try {
      target = downstreamUrl(current.baseUrl, request.url ?? "/");
    } catch {
      response.writeHead(502, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: { message: "resident Gateway downstream is invalid" } }));
      return;
    }
    const headers = { ...request.headers };
    stripHopByHopHeaders(headers);
    delete headers.host;
    delete headers["x-api-key"];
    delete headers.authorization;
    headers.authorization = `Bearer ${current.token}`;
    if (this.#protocol === "anthropic-messages") headers["x-api-key"] = current.token;
    const declaredHeader = request.headers["content-length"];
    const declaredLength = declaredHeader === undefined ? 0 : Number(declaredHeader);
    if (!Number.isSafeInteger(declaredLength) || declaredLength < 0 ||
      declaredLength > 8 * 1024 * 1024) {
      response.writeHead(declaredLength > 8 * 1024 * 1024 ? 413 : 400, {
        "content-type": "application/json",
        connection: "close"
      });
      response.end(JSON.stringify({ error: { message: declaredLength > 8 * 1024 * 1024
        ? "resident Gateway request is too large"
        : "resident Gateway content length is invalid" } }));
      request.resume();
      return;
    }
    const complete = this.#track(current);
    response.once("finish", complete);
    response.once("close", complete);
    const upstream = requestHttp(target, {
      method: request.method,
      headers,
      agent: false
    }, (upstreamResponse) => {
      if (response.writableEnded) {
        upstreamResponse.destroy();
        return;
      }
      const responseHeaders = { ...upstreamResponse.headers };
      stripHopByHopHeaders(responseHeaders);
      upstreamResponse.once("aborted", () => response.destroy());
      upstreamResponse.once("error", () => response.destroy());
      response.writeHead(upstreamResponse.statusCode ?? 502, responseHeaders);
      upstreamResponse.pipe(response);
    });
    upstream.once("error", () => {
      if (!response.headersSent) {
        response.writeHead(502, { "content-type": "application/json", connection: "close" });
        response.end(JSON.stringify({ error: { message: "resident Gateway downstream failed" } }));
      } else {
        response.destroy();
      }
    });
    let received = 0;
    const limiter = new Transform({
      transform(chunk: Buffer, _encoding, callback) {
        received += chunk.length;
        if (received > 8 * 1024 * 1024) {
          callback(new Error("resident Gateway request is too large"));
          return;
        }
        callback(undefined, chunk);
      }
    });
    limiter.once("error", () => {
      upstream.destroy();
      if (!response.headersSent) {
        response.writeHead(413, { "content-type": "application/json", connection: "close" });
        response.end(JSON.stringify({ error: { message: "resident Gateway request is too large" } }));
      } else {
        response.destroy();
      }
      request.unpipe(limiter);
      request.resume();
    });
    request.once("aborted", () => {
      limiter.destroy();
      upstream.destroy();
    });
    response.once("close", () => {
      if (!response.writableEnded) {
        limiter.destroy();
        upstream.destroy();
      }
    });
    request.pipe(limiter).pipe(upstream);
  }

  #track(route: InvocationGatewayRoute): () => void {
    let resolve!: () => void;
    const pending = new Promise<void>((settled) => { resolve = settled; });
    const active = this.#inflight.get(route) ?? new Set<Promise<void>>();
    active.add(pending);
    this.#inflight.set(route, active);
    let completed = false;
    return () => {
      if (completed) return;
      completed = true;
      active.delete(pending);
      if (!active.size) this.#inflight.delete(route);
      resolve();
    };
  }
}

/** Internal transport; not part of the public SDK workflow/API surface. */
export class StableControlFrontdoor {
  readonly row: ResidentMcpRow;
  readonly #server: NetServer;
  readonly #token: string;
  readonly #discovery: CapabilityContext;
  readonly #configurationPath: string;
  readonly #sockets = new Set<Socket>();
  readonly #inflight = new Map<ControlMcpDownstream, Set<Promise<void>>>();
  #current?: ControlMcpDownstream;
  #closed = false;
  #closeComplete = false;

  private constructor(
    server: NetServer,
    token: string,
    row: ResidentMcpRow,
    discovery: CapabilityContext,
    configurationPath: string
  ) {
    this.#server = server;
    this.#token = token;
    this.row = row;
    this.#discovery = discovery;
    this.#configurationPath = configurationPath;
  }

  static async open(
    runtimePath: string,
    discovery: CapabilityContext
  ): Promise<StableControlFrontdoor> {
    const token = randomUUID();
    let frontdoor!: StableControlFrontdoor;
    const server = net.createServer((socket) => frontdoor.#accept(socket));
    await listenNet(server);
    const address = server.address();
    if (!address || typeof address === "string") {
      await closeNet(server, new Set());
      throw adapterError("Resident control frontdoor did not receive a loopback address");
    }
    let configurationPath: string | undefined;
    try {
      const command = await resolveResidentControlProxyCommand();
      configurationPath = path.join(
        runtimePath,
        `resident-control-frontdoor-${randomUUID()}.json`
      );
      await fs.mkdir(runtimePath, { recursive: true, mode: 0o700 });
      await fs.writeFile(configurationPath, `${JSON.stringify({
        schemaVersion: 1,
        host: "127.0.0.1",
        port: address.port,
        token
      })}\n`, { encoding: "utf8", mode: 0o600, flag: "wx" });
      if (process.platform === "win32") await protectWindowsRuntimeFile(configurationPath);
      const row: ResidentMcpRow = {
        name: "openfars-resident-control",
        namespace: "openfars-resident-control",
        transport: "stdio",
        command: command.command,
        args: [...command.args, configurationPath]
      };
      frontdoor = new StableControlFrontdoor(
        server,
        token,
        row,
        discovery,
        configurationPath
      );
      return frontdoor;
    } catch (error) {
      await closeNet(server, new Set()).catch(() => undefined);
      if (configurationPath) await fs.rm(configurationPath, { force: true }).catch(() => undefined);
      throw error;
    }
  }

  rotate(downstream: ControlMcpDownstream | undefined): void {
    if (this.#closed && downstream) throw adapterError("Resident control frontdoor is closed");
    this.#current = downstream;
  }

  async drain(downstream: ControlMcpDownstream): Promise<void> {
    const pending = [...(this.#inflight.get(downstream) ?? [])];
    if (!pending.length) return;
    await withDeadline(
      Promise.allSettled(pending).then(() => undefined),
      CONTROL_DRAIN_TIMEOUT_MS,
      "Resident control requests did not drain"
    );
  }

  async assertReady(): Promise<void> {
    if (this.#closed || !this.#server.listening) {
      throw adapterError("Resident control frontdoor is not ready");
    }
  }

  async close(): Promise<void> {
    if (this.#closeComplete) return;
    this.#closed = true;
    this.#current = undefined;
    await closeNet(this.#server, this.#sockets);
    await fs.rm(this.#configurationPath, { force: true });
    this.#closeComplete = true;
  }

  #accept(socket: Socket): void {
    this.#sockets.add(socket);
    // A disconnected MCP client owns only its transport failure. Close that
    // connection without taking down the service or making Agent decisions.
    socket.on("error", () => socket.destroy());
    socket.setEncoding("utf8");
    socket.once("close", () => this.#sockets.delete(socket));
    let buffered = "";
    let queue: Promise<void> = Promise.resolve();
    socket.on("data", (chunk: string) => {
      buffered += chunk;
      if (Buffer.byteLength(buffered, "utf8") > MAX_CONTROL_LINE_BYTES) {
        socket.destroy(new Error("resident control frontdoor request is too large"));
        return;
      }
      while (true) {
        const newline = buffered.indexOf("\n");
        if (newline < 0) break;
        const line = buffered.slice(0, newline);
        buffered = buffered.slice(newline + 1);
        queue = queue.then(() => this.#handleLine(socket, line)).catch(() => { socket.destroy(); });
      }
    });
  }

  async #handleLine(socket: Socket, line: string): Promise<void> {
    if (socket.destroyed) return;
    let response: Record<string, unknown>;
    try {
      const envelope = JSON.parse(line) as Record<string, unknown>;
      if (typeof envelope.capability !== "string" ||
        !safeSecretEqual(this.#token, envelope.capability) ||
        !envelope.request || typeof envelope.request !== "object" ||
        Array.isArray(envelope.request)) {
        throw new Error("resident control frontdoor request is unauthorized");
      }
      const request = envelope.request as Record<string, unknown>;
      const id = request.id;
      if (request.method === "initialize") {
        response = {
          ok: true,
          response: {
            jsonrpc: "2.0",
            id,
            result: {
              protocolVersion: "2024-11-05",
              capabilities: { tools: { listChanged: false } },
              serverInfo: { name: "scienceevolve-resident-control", version: "1.0.0" }
            }
          }
        };
        if (!socket.destroyed) socket.write(`${JSON.stringify(response)}\n`);
        return;
      }
      if (request.method === "tools/list") {
        response = {
          ok: true,
          response: {
            jsonrpc: "2.0",
            id,
            result: { tools: toolsFor(this.#discovery) }
          }
        };
        if (!socket.destroyed) socket.write(`${JSON.stringify(response)}\n`);
        return;
      }
      const current = this.#current;
      if (!current) {
        response = {
          ok: true,
          response: {
            jsonrpc: "2.0",
            id,
            error: { code: -32001, message: "resident turn control authority is inactive" }
          }
        };
        if (!socket.destroyed) socket.write(`${JSON.stringify(response)}\n`);
        return;
      }
      const complete = this.#track(current);
      try {
        const forwarded = await current.forward(request);
        response = { ok: true, ...(forwarded ? { response: forwarded } : {}) };
      } finally {
        complete();
      }
    } catch (error) {
      response = { ok: false, error: "resident control request failed" };
    }
    if (!socket.destroyed) socket.write(`${JSON.stringify(response)}\n`);
  }

  #track(downstream: ControlMcpDownstream): () => void {
    let resolve!: () => void;
    const pending = new Promise<void>((settled) => { resolve = settled; });
    const active = this.#inflight.get(downstream) ?? new Set<Promise<void>>();
    active.add(pending);
    this.#inflight.set(downstream, active);
    let completed = false;
    return () => {
      if (completed) return;
      completed = true;
      active.delete(pending);
      if (!active.size) this.#inflight.delete(downstream);
      resolve();
    };
  }
}

class ControlMcpDownstream {
  readonly #child: ChildProcessWithoutNullStreams;
  readonly #responses = new Map<string, Record<string, unknown>>();
  readonly #waiters = new Map<string, {
    resolve: (response: Record<string, unknown>) => void;
    reject: (error: Error) => void;
    timer: NodeJS.Timeout;
  }>();
  readonly #closed: Promise<void>;
  #failure?: Error;
  #closing = false;
  #stderr = "";
  #stderrBytes = 0;
  #stdoutBytes = 0;
  readonly #controlCapability: string;

  private constructor(child: ChildProcessWithoutNullStreams, controlCapability: string) {
    this.#child = child;
    this.#controlCapability = controlCapability;
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk: string) => {
      this.#stderrBytes += Buffer.byteLength(chunk, "utf8");
      this.#stderr = `${this.#stderr}${chunk}`.slice(-4_096);
    });
    child.stdout.on("data", (chunk: Buffer | string) => {
      this.#stdoutBytes += Buffer.byteLength(chunk);
    });
    readline.createInterface({ input: child.stdout, crlfDelay: Infinity })
      .on("line", (line) => this.#accept(line));
    this.#closed = new Promise<void>((resolve) => {
      child.once("close", () => resolve());
    }).then(() => {
      const error = this.#failure ?? new Error(
        this.#stderr || "resident orchestration-control MCP exited"
      );
      for (const waiter of this.#waiters.values()) {
        clearTimeout(waiter.timer);
        waiter.reject(error);
      }
      this.#waiters.clear();
    });
    child.once("error", (error) => this.#fail(error));
  }

  static async open(
    command: { command: string; args: string[] },
    environment: Record<string, string>
  ): Promise<ControlMcpDownstream> {
    const child = spawnTrustedUtility(command.command, command.args, {
      LANG: "C.UTF-8",
      LC_ALL: "C.UTF-8",
      ...environment
    });
    const downstream = new ControlMcpDownstream(child, environment.SCIENCEEVOLVE_CONTROL_CAPABILITY ?? "");
    try {
      const id = `resident-ready-${randomUUID()}`;
      const response = await downstream.forward({
        jsonrpc: "2.0",
        id,
        method: "initialize",
        params: {}
      });
      if (!response || response.id !== id || !response.result) {
        throw new Error("resident orchestration-control MCP initialization failed");
      }
      return downstream;
    } catch (error) {
      await downstream.close().catch(() => undefined);
      throw error;
    }
  }

  async forward(
    request: Record<string, unknown>
  ): Promise<Record<string, unknown> | undefined> {
    if (this.#failure) throw this.#failure;
    if (this.#closing) throw new Error("resident orchestration-control MCP is closing");
    const id = request.id;
    if (id === undefined) {
      await this.#write(request);
      return undefined;
    }
    const key = rpcIdKey(id);
    if (this.#waiters.has(key)) throw new Error("resident control JSON-RPC id is already active");
    const buffered = this.#responses.get(key);
    if (buffered) {
      this.#responses.delete(key);
      return buffered;
    }
    const startedAt = Date.now();
    const timeoutMs = controlRequestTimeoutMs(request.method);
    const response = new Promise<Record<string, unknown>>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.#waiters.delete(key);
        // A transport deadline is not evidence that the provider/model failed.
        // Preserve bounded child diagnostics at the deadline before close can
        // replace its live status. Never serialize request arguments or env.
        const stderr = this.#controlCapability
          ? this.#stderr.split(this.#controlCapability).join("[REDACTED]")
          : this.#stderr;
        const diagnostics = {
          method: ["initialize", "tools/list", "tools/call", "resources/list", "resources/templates/list",
            "resources/read", "prompts/list", "prompts/get", "ping"].includes(String(request.method)) ? request.method : "other",
          timeoutMs,
          elapsedMs: Date.now() - startedAt,
          childPid: this.#child.pid ?? null,
          childExitCode: this.#child.exitCode,
          childSignal: this.#child.signalCode,
          stdoutBytes: this.#stdoutBytes,
          stderrBytes: this.#stderrBytes,
          unmatchedResponses: this.#responses.size,
          stderr: redactTrace(stderr).slice(-4_096)
        };
        reject(new Error(`resident orchestration-control MCP did not respond; diagnostics=${JSON.stringify(diagnostics)}`));
      }, timeoutMs);
      timer.unref();
      this.#waiters.set(key, { resolve, reject, timer });
    });
    try {
      await this.#write(request);
      return await response;
    } catch (error) {
      const waiter = this.#waiters.get(key);
      if (waiter) {
        clearTimeout(waiter.timer);
        this.#waiters.delete(key);
      }
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.#closing) return this.#closed;
    this.#closing = true;
    this.#child.stdin.end();
    const timer = new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        this.#child.kill("SIGKILL");
        resolve();
      }, 2_000);
      timeout.unref();
      void this.#closed.finally(() => clearTimeout(timeout));
    });
    await Promise.race([this.#closed, timer]);
    await withDeadline(
      this.#closed,
      2_000,
      "Resident orchestration-control MCP remained alive after SIGKILL"
    );
  }

  async #write(request: Record<string, unknown>): Promise<void> {
    const line = `${JSON.stringify(request)}\n`;
    if (Buffer.byteLength(line, "utf8") > MAX_CONTROL_LINE_BYTES) {
      throw new Error("resident control JSON-RPC request is too large");
    }
    if (this.#child.stdin.write(line, "utf8")) return;
    await new Promise<void>((resolve, reject) => {
      this.#child.stdin.once("drain", resolve);
      this.#child.stdin.once("error", reject);
    });
  }

  #accept(line: string): void {
    if (!line.trim()) return;
    let response: Record<string, unknown>;
    try {
      const parsed = JSON.parse(line) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("resident orchestration-control MCP returned a non-object response");
      }
      response = parsed as Record<string, unknown>;
    } catch (error) {
      this.#fail(error instanceof Error ? error : new Error(String(error)));
      return;
    }
    const key = rpcIdKey(response.id);
    const waiter = this.#waiters.get(key);
    if (waiter) {
      clearTimeout(waiter.timer);
      this.#waiters.delete(key);
      waiter.resolve(response);
      return;
    }
    this.#responses.set(key, response);
    if (this.#responses.size > 1_000) {
      this.#fail(new Error("resident orchestration-control MCP emitted unmatched responses"));
    }
  }

  #fail(error: Error): void {
    if (this.#failure) return;
    this.#failure = error;
    this.#child.kill("SIGKILL");
    for (const waiter of this.#waiters.values()) {
      clearTimeout(waiter.timer);
      waiter.reject(error);
    }
    this.#waiters.clear();
  }
}

function assertOpenInputAuthority(input: HarnessRuntimeResidentOpenInput): void {
  const context = input.request.executionContext;
  if (!context) throw adapterError("Resident runtime adapter requires collaboration execution context");
  if (input.request.control !== undefined) {
    throw adapterError(
      "Resident runtime adapter rejects caller-supplied control; use the canonical server scope"
    );
  }
  const observation = input.request.terminalPushObservation;
  const coordination = input.request.terminalPushCoordination;
  const closing = input.request.worktreeClosing;
  const scopedClosing = input.controlScope?.role === "execution-artifact" ? input.controlScope.worktreeClosing : undefined;
  if (closing !== undefined || scopedClosing !== undefined) {
    try { assertWorktreeClosingRequest(input.request, input.sameEpochReopen); }
    catch (error) { throw adapterError(String(error)); }
    if (closing === undefined || !isDeepStrictEqual(closing, scopedClosing) || input.inputs) {
      throw adapterError("Worktree closing requires its exact retained grant without extra inputs or MCP rows");
    }
  }
  const coordinatorScope = input.controlScope?.role === "receipt-coordinator" ? input.controlScope : undefined;
  if (coordination !== undefined || coordinatorScope !== undefined) {
    const sessionKey = collaborationSessionKey(input.request.agent, context, input.request.project.orchestration.schemaVersion === 3);
    if (!isTerminalPushCoordinationScope(coordination) ||
      !isDeepStrictEqual(coordination, coordinatorScope?.terminalPushCoordination) ||
      coordination.coordinatorEpoch !== coordinatorScope?.coordinatorEpoch ||
      observation !== undefined || context.role !== "leader" ||
      input.request.kind !== (input.request.agent === "main" ? "main" : "worker") ||
      coordination.role === "main" && input.request.agent !== "main" ||
      input.request.project.status === "completed" ||
      input.request.project.agentSessions?.[sessionKey]?.durable !== true ||
      input.request.sessionContinuity !== "strict" || input.sameEpochReopen !== undefined ||
      input.request.terminalControlRepair !== undefined || input.inputs?.workflowAuthoringPath !== undefined) {
      throw adapterError("Receipt coordination requires the exact original durable management session and narrow control scope");
    }
  }
  const scopedObservation = input.controlScope?.role === "execution-artifact"
    ? input.controlScope.terminalPushObservation : undefined;
  if (observation !== undefined || scopedObservation !== undefined) {
    if (!isTerminalPushObservationScope(observation) ||
      !isDeepStrictEqual(observation, scopedObservation) || context.role !== "delivery" ||
      input.request.kind !== "worker" || input.request.project.git?.enabled !== true ||
      input.request.project.agentSessions?.[input.request.agent]?.durable !== true ||
      input.request.sessionContinuity !== "strict" || !input.sameEpochReopen ||
      input.request.terminalControlRepair !== undefined) {
      throw adapterError("Terminal push observation requires the exact retained-session delivery grant and control scope");
    }
  }
  if (context.role === "leader") {
    if (!input.inputs) {
      throw adapterError("Leader resident requires explicit management-only InvocationInputs");
    }
    const scope = input.controlScope;
    const contextIsMainRoute = "routeScopeId" in context;
    const scopeIsMainRoute = scope?.role === "main-route" || scope?.role === "main-node" ||
      scope?.role === "receipt-coordinator" && typeof scope.routeScopeId === "string";
    const contextScopeId = contextIsMainRoute ? context.routeScopeId : context.groupRunId;
    const controlScopeId = scopeIsMainRoute ? scope.routeScopeId :
      scope && scope.role !== "standalone-route" && scope.role !== "execution-artifact" && scope.role !== "scoped-agent"
        ? scope.groupRunId
        : undefined;
    if (!scope || scope.role === "standalone-route" ||
      scope.role === "execution-artifact" || scope.role === "scoped-agent" ||
      scope.projectId !== input.request.project.id ||
      scope.nodeRunId !== context.nodeRunId ||
      scopeIsMainRoute !== contextIsMainRoute ||
      controlScopeId !== contextScopeId ||
      scope.leaderAgentId !== input.request.agent ||
      scope.coordinatorEpoch !== context.coordinatorEpoch) {
      throw adapterError("Leader resident control scope does not match management authority");
    }
    if ((scope.role === "main-route" || scope.role === "main-node") &&
      (input.request.agent !== "main" || input.request.kind !== "main" ||
        !Array.isArray(scope.candidates) ||
        scope.candidates.length < 1 ||
        new Set(scope.candidates).size !== scope.candidates.length ||
        scope.candidates.some((candidate) => typeof candidate !== "string" ||
          !candidate.trim() || candidate.includes("\0") || candidate.length > 512) ||
        !Array.isArray(scope.tasklessRouteTargets) ||
        new Set(scope.tasklessRouteTargets).size !== scope.tasklessRouteTargets.length ||
        scope.tasklessRouteTargets.some((candidate) => !scope.candidates.includes(candidate)))) {
      throw adapterError("Main route resident scope is malformed");
    }
    return;
  }
  if (input.inputs) {
    throw adapterError("Delivery residents cannot accept caller-staged InvocationInputs");
  }
  if (input.controlScope) {
    const scope = input.controlScope;
    const executionScope = scope.role === "standalone-route" || scope.role === "execution-artifact" || scope.role === "scoped-agent";
    if (!executionScope ||
      (scope.role === "standalone-route" &&
        (context.role !== "delivery" || context.groupRunId !== undefined)) ||
      (scope.role === "execution-artifact" &&
        context.role !== "delivery" && context.role !== "final-integration") ||
      (scope.role === "scoped-agent" && (context.role !== "delivery" ||
        context.groupRunId !== scope.groupRunId || input.request.project.orchestration.schemaVersion !== 3)) ||
      scope.projectId !== input.request.project.id ||
      scope.nodeRunId !== context.nodeRunId ||
      scope.executionId !== context.executionId ||
      scope.agentId !== input.request.agent ||
      scope.ownershipEpoch !== context.ownershipEpoch ||
      ((scope.role === "standalone-route" || scope.role === "scoped-agent") &&
        ((scope.decisionBy !== "agent" && !(scope.role === "scoped-agent" && scope.decisionBy === "main" && scope.candidates.length === 0)) || !Array.isArray(scope.candidates) ||
          (scope.role === "standalone-route" && scope.candidates.length < 1) ||
          new Set(scope.candidates).size !== scope.candidates.length ||
          scope.candidates.some((candidate) => typeof candidate !== "string" ||
            !candidate.trim() || candidate.includes("\0") || candidate.length > 512)))) {
      throw adapterError("Standalone resident route scope does not match execution authority");
    }
  }
}

function deriveControlTemplate(
  request: AgentRunRequest,
  scope: ResidentControlScope | undefined
): ControlMcpRequest | undefined {
  const context = request.executionContext;
  if (!context) return undefined;
  if (scope?.role === "receipt-coordinator") {
    return { stagingPath: "/turn-scoped/control-actions.json", capability: "turn-scoped",
      stateVersion: scope.coordinatorEpoch, candidates: [], decisionBy: "agent",
      allowUserIntervention: scope.terminalPushCoordination.canRequestUser, canComplete: false,
      terminalPushCoordination: structuredClone(scope.terminalPushCoordination), requireBridge: true };
  }
  let collaboration: CollaborationControlScope | undefined;
  let stateVersion: number;
  if (context.role === "leader") {
    if (!scope || scope.role === "standalone-route" || scope.role === "execution-artifact" || scope.role === "scoped-agent") {
      throw adapterError("Leader resident control scope is missing");
    }
    if (scope.role === "main-route" || scope.role === "main-node") {
      return {
        stagingPath: "/turn-scoped/control-actions.json",
        capability: "turn-scoped",
        stateVersion: scope.coordinatorEpoch,
        candidates: [...scope.candidates],
        ...(scope.tasklessRouteTargets
          ? { tasklessRouteTargets: [...scope.tasklessRouteTargets] }
          : {}),
        decisionBy: "main",
        allowUserIntervention: scope.allowUserIntervention,
        allowWorkflowReconfiguration: scope.allowWorkflowReconfiguration,
        canComplete: scope.canComplete,
        allowFinishRoute: scope.allowFinishRoute,
        requireBridge: true
      };
    }
    if (scope.role === "scoped-leader" || scope.role === "scoped-main") {
      return { stagingPath: "/turn-scoped/control-actions.json", capability: "turn-scoped", stateVersion: scope.coordinatorEpoch,
        candidates: [], decisionBy: "main", allowUserIntervention: scope.role === "scoped-main" && request.project.orchestration.allowUserIntervention !== false, canComplete: false,
        allowWorkflowReconfiguration: scope.allowReconfiguration,
        collaboration: { nodeRunId: scope.nodeRunId, groupRunId: scope.groupRunId, coordinatorEpoch: scope.coordinatorEpoch,
          role: scope.role, memberNodeIds: [...scope.memberNodeIds], routeCandidates: [...scope.routeCandidates],
          failedArrivalRequestIds: [...scope.failedArrivalRequestIds], allowReconfiguration: scope.allowReconfiguration,
          ...(scope.recoveryOptions ? { recoveryOptions: structuredClone(scope.recoveryOptions) } : {}),
          ...(scope.closingArrivalRequestIds ? { closingArrivalRequestIds: [...scope.closingArrivalRequestIds] } : {}),
          ...(scope.worktreeClosingOnly ? { worktreeClosingOnly: true as const } : {}),
          ...(scope.sourceArrivalRequestId ? { sourceArrivalRequestId: scope.sourceArrivalRequestId } : {}),
          ...(scope.sourceOuterNodeRunId ? { sourceOuterNodeRunId: scope.sourceOuterNodeRunId } : {}) }, requireBridge: true };
    }
    if (!("groupRunId" in context) || !context.groupRunId) {
      throw adapterError("Group leader resident is missing a real collaboration identity");
    }
    collaboration = {
      nodeRunId: context.nodeRunId,
      groupRunId: context.groupRunId,
      role: "leader",
      coordinatorEpoch: context.coordinatorEpoch
    };
    stateVersion = context.coordinatorEpoch;
  } else if (scope?.role === "standalone-route" || scope?.role === "execution-artifact" || scope?.role === "scoped-agent") {
    stateVersion = context.ownershipEpoch;
  } else {
    // Group delivery is server-side FIFO preclaimed. It receives no model
    // control authority unless the caller explicitly supplies request.control.
    return undefined;
  }
  return {
    stagingPath: "/turn-scoped/control-actions.json",
    capability: "turn-scoped",
    stateVersion,
    candidates: scope?.role === "standalone-route" || scope?.role === "scoped-agent" ? [...scope.candidates] : [],
    decisionBy: collaboration
      ? "main"
      : scope?.role === "standalone-route" || scope?.role === "scoped-agent"
        ? scope.decisionBy
        : "agent",
    allowUserIntervention: false,
    canComplete: false,
    collaboration,
    ...(request.terminalPushObservation ? { terminalPushObservation: structuredClone(request.terminalPushObservation) } : {}),
    ...(request.worktreeClosing ? { worktreeClosing: structuredClone(request.worktreeClosing) } : {}),
    ...(scope?.role === "scoped-agent" ? { scopedAgentRouting: true, allowFinishRoute: true,
      ...(scope.executionId.startsWith("group-final-") ? { canonicalFinalIntegration: true } : {}) } : {}),
    ...(scope && ["scoped-agent", "standalone-route", "execution-artifact"].includes(scope.role ?? "")
      ? { allowAgentGitActions: true } : {}),
    requireBridge: true
  };
}

function stripControlAuthority(control: ControlMcpRequest): Omit<
  ControlMcpRequest,
  | "stagingPath"
  | "capability"
  | "capabilityHash"
  | "capabilityPath"
  | "bridgePath"
  | "bridgePort"
  | "bridgeHost"
  | "expiresAt"
> {
  const {
    stagingPath: _stagingPath,
    capability: _capability,
    capabilityHash: _capabilityHash,
    capabilityPath: _capabilityPath,
    bridgePath: _bridgePath,
    bridgePort: _bridgePort,
    bridgeHost: _bridgeHost,
    expiresAt: _expiresAt,
    ...safe
  } = control;
  return safe;
}

function discoveryCapabilityContext(
  request: AgentRunRequest,
  control: ControlMcpRequest
): CapabilityContext {
  return {
    secret: "inactive-resident-discovery",
    projectId: request.project.id,
    agent: request.agent,
    invocationId: request.invocationId,
    stateVersion: control.stateVersion,
    ...(request.onProjectStateRequest || control.projectState ? { projectState: true } : {}),
    ...(request.onProjectStateRequest || control.nativeBackgroundJobs ? { nativeBackgroundJobs: true } : {}),
    ...(control.capabilityHash ? { capabilityHash: control.capabilityHash } : {}),
    kind: request.kind,
    candidates: [...control.candidates],
    ...(control.tasklessRouteTargets
      ? { tasklessRouteTargets: [...control.tasklessRouteTargets] }
      : {}),
    decisionBy: control.decisionBy,
    ...(control.scopedAgentRouting !== undefined ? { scopedAgentRouting: control.scopedAgentRouting } : {}),
    allowUserIntervention: control.allowUserIntervention,
    ...(control.allowAgentOrchestrationReconfiguration !== undefined
      ? {
          allowAgentOrchestrationReconfiguration:
            control.allowAgentOrchestrationReconfiguration
        }
      : {}),
    ...(control.allowWorkflowReconfiguration !== undefined
      ? { allowWorkflowReconfiguration: control.allowWorkflowReconfiguration }
      : {}),
    ...(control.canonicalFinalIntegration !== undefined ? { canonicalFinalIntegration: control.canonicalFinalIntegration } : {}),
    ...(control.allowAgentGitActions !== undefined
      ? { allowAgentGitActions: control.allowAgentGitActions }
      : {}),
    ...(control.terminalPushObservation ? { terminalPushObservation: structuredClone(control.terminalPushObservation) } : {}),
    ...(control.terminalPushCoordination ? { terminalPushCoordination: structuredClone(control.terminalPushCoordination) } : {}),
    ...(control.worktreeClosing ? { worktreeClosing: structuredClone(control.worktreeClosing) } : {}),
    canComplete: control.canComplete,
    ...(control.allowFinishRoute !== undefined
      ? { allowFinishRoute: control.allowFinishRoute }
      : {}),
    ...(control.collaboration
      ? { collaboration: structuredClone(control.collaboration) }
      : {}),
    stagingPath: control.stagingPath,
    workspacePath: request.workspacePath,
    ...(control.workflowAuthoringPath ? { workflowAuthoringPath: control.workflowAuthoringPath } : {}),
    requireBridge: true
  };
}

function assertTurnControlAuthority(
  control: ControlMcpRequest,
  discovery: ControlMcpRequest,
  request: AgentRunRequest,
  turn: Pick<ResidentTurn, "inputId" | "invocationId" | "prompt">,
  runtimePath: string
): void {
  if (!control || typeof control !== "object" ||
    typeof control.capability !== "string" || !control.capability.trim() ||
    control.capability.includes("\0") || control.capability.length > 8_192 ||
    control.capabilityHash !== createHash("sha256").update(control.capability).digest("hex") ||
    !Number.isSafeInteger(control.stateVersion) || control.stateVersion < 0 ||
    typeof control.stagingPath !== "string" || !path.isAbsolute(control.stagingPath) ||
    !pathIsWithin(control.stagingPath, runtimePath) ||
    control.capabilityPath !== undefined ||
    control.bridgePath !== undefined || control.bridgePort !== undefined ||
    control.bridgeHost !== undefined || control.requireBridge !== true) {
    throw adapterError("Resident control authority factory returned an invalid turn capability");
  }
  if (control.expiresAt !== undefined &&
    (!Number.isFinite(Date.parse(control.expiresAt)) || Date.parse(control.expiresAt) <= Date.now())) {
    throw adapterError("Resident control authority factory returned an expired turn capability");
  }
  const policy = (value: ControlMcpRequest) => ({
    candidates: value.candidates,
    tasklessRouteTargets: value.tasklessRouteTargets ?? [],
    decisionBy: value.decisionBy,
    allowUserIntervention: value.allowUserIntervention,
    allowAgentOrchestrationReconfiguration:
      value.allowAgentOrchestrationReconfiguration === true,
    allowWorkflowReconfiguration: value.allowWorkflowReconfiguration === true,
    allowAgentGitActions: value.allowAgentGitActions === true,
    terminalPushObservation: value.terminalPushObservation,
    terminalPushCoordination: value.terminalPushCoordination,
    worktreeClosing: value.worktreeClosing,
    canonicalFinalIntegration: value.canonicalFinalIntegration === true,
    canComplete: value.canComplete,
    allowFinishRoute: value.allowFinishRoute === true,
    collaboration: value.collaboration,
    scopedAgentRouting: value.scopedAgentRouting === true,
    workflowAuthoringPath: value.workflowAuthoringPath
  });
  if (!isDeepStrictEqual(policy(control), policy(discovery))) {
    throw adapterError("Resident control authority changed its stable tool scope");
  }
  if (request.invocationId !== turn.invocationId) {
    throw adapterError("Resident control authority does not match the turn invocation");
  }
}

function assertTurnRuntime(
  runtime: Awaited<ReturnType<ResidentTurnRequestFactory>>,
  base: AgentRunRequest,
  turn: Pick<ResidentTurn, "inputId" | "invocationId" | "prompt">
): void {
  const request = runtime?.request;
  if (!request || typeof runtime.onTrace !== "function" ||
    request.invocationId !== turn.invocationId ||
    (base.terminalPushObservation !== undefined || base.terminalPushCoordination !== undefined || base.worktreeClosing !== undefined) && request.invocationId !== base.invocationId ||
    request.project.id !== base.project.id ||
    request.agent !== base.agent ||
    request.kind !== base.kind ||
    request.permission !== base.permission ||
    (request.purpose ?? "workflow") !== (base.purpose ?? "workflow") ||
    request.inboxPath !== base.inboxPath ||
    request.projectPath !== base.projectPath ||
    request.workspacePath !== base.workspacePath ||
    request.schemaPath !== base.schemaPath ||
    request.runtimePath !== base.runtimePath ||
    JSON.stringify(request.skillPaths) !== JSON.stringify(base.skillPaths) ||
    JSON.stringify(request.autoSkillPaths ?? []) !== JSON.stringify(base.autoSkillPaths ?? []) ||
    JSON.stringify(request.availableSkillPaths) !== JSON.stringify(base.availableSkillPaths) ||
    JSON.stringify(request.executionContext) !== JSON.stringify(base.executionContext) ||
    !isDeepStrictEqual(request.terminalPushObservation, base.terminalPushObservation) ||
    !isDeepStrictEqual(request.terminalPushCoordination, base.terminalPushCoordination) ||
    !isDeepStrictEqual(request.worktreeClosing, base.worktreeClosing) ||
    JSON.stringify(request.project.agents[request.agent]) !==
      JSON.stringify(base.project.agents[base.agent]) ||
    request.project.agents[request.agent]?.harness !==
      base.project.agents[base.agent]?.harness ||
    request.project.agents[request.agent]?.model !==
      base.project.agents[base.agent]?.model) {
    throw adapterError("Resident per-turn runtime changed its stable process authority");
  }
  const durable = runtime.durableRehydrate;
  if (durable && (!/^[a-f0-9]{64}$/i.test(durable.sourceDigest) ||
    !Number.isSafeInteger(durable.lastBusinessTurn) || durable.lastBusinessTurn < 0 ||
    typeof durable.lastInputId !== "string" || !durable.lastInputId.trim() ||
    durable.lastInputId.includes("\0") ||
    typeof durable.transcript !== "string" || durable.transcript.includes("\0") ||
    durable.transcript.length > 8 * 1024 * 1024 ||
    createHash("sha256").update(durable.transcript).digest("hex") !==
      durable.sourceDigest)) {
    throw adapterError("Resident durable-rehydrate provenance is invalid");
  }
}

function assertTurnInput(input: {
  inputId: string;
  invocationId: string;
  prompt: string;
}): void {
  for (const [label, value] of [
    ["inputId", input.inputId],
    ["invocationId", input.invocationId],
    ["prompt", input.prompt]
  ] as const) {
    if (typeof value !== "string" || !value.trim() || value.includes("\0") || value.length > 1_000_000) {
      throw adapterError(`Resident turn ${label} is invalid`);
    }
  }
}

function assertInvocationRoute(route: InvocationModelRoute): void {
  if (route && "nativeCodexProfileHome" in route) {
    if (!path.isAbsolute(route.nativeCodexProfileHome) || !route.authorityId || route.authorityId.includes("\0") || typeof route.close !== "function") {
      throw adapterError("Resident route factory returned invalid native profile authority");
    }
    return;
  }
  if (!route || typeof route.baseUrl !== "string" || typeof route.token !== "string" ||
    !route.token.trim() || route.token.includes("\0") || typeof route.close !== "function") {
    throw adapterError("Resident route factory returned an invalid invocation route");
  }
  assertLoopbackRoute(route.baseUrl);
}

function assertLoopbackRoute(baseUrl: string): void {
  const parsed = new URL(baseUrl);
  if (parsed.protocol !== "http:" ||
    !["127.0.0.1", "[::1]", "::1"].includes(parsed.hostname) ||
    !parsed.port || parsed.username || parsed.password) {
    throw adapterError("Resident Gateway downstream must be an uncredentialed loopback HTTP route");
  }
}

function downstreamUrl(baseUrl: string, incoming: string): URL {
  assertLoopbackRoute(baseUrl);
  const base = new URL(baseUrl);
  const source = new URL(incoming, "http://resident.invalid");
  const basePath = base.pathname.replace(/\/+$/, "");
  const suffix = source.pathname === "/v1"
    ? ""
    : source.pathname.startsWith("/v1/")
      ? source.pathname.slice(3)
      : source.pathname;
  base.pathname = `${basePath}${suffix.startsWith("/") ? suffix : `/${suffix}`}`;
  base.search = source.search;
  return base;
}

function authorizedGatewayRequest(
  request: IncomingMessage,
  protocol: string,
  token: string
): boolean {
  const values = protocol === "anthropic-messages"
    ? [
        String(request.headers["x-api-key"] ?? ""),
        String(request.headers.authorization ?? "").replace(/^Bearer\s+/i, "")
      ]
    : [String(request.headers.authorization ?? "").replace(/^Bearer\s+/i, "")];
  return values.some((value) => safeSecretEqual(token, value));
}

function safeSecretEqual(expected: string, supplied: string): boolean {
  const left = Buffer.from(expected, "utf8");
  const right = Buffer.from(supplied, "utf8");
  return left.length === right.length && timingSafeEqual(left, right);
}

function pathIsWithin(candidate: string, root: string): boolean {
  const relative = path.relative(path.resolve(root), path.resolve(candidate));
  return relative === "" || (!path.isAbsolute(relative) && relative !== ".." &&
    !relative.startsWith(`..${path.sep}`));
}

function stripHopByHopHeaders(headers: Record<string, unknown>): void {
  const connection = Array.isArray(headers.connection)
    ? headers.connection.join(",")
    : typeof headers.connection === "string"
      ? headers.connection
      : "";
  const named = connection.split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  for (const name of [
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "proxy-connection",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
    ...named
  ]) delete headers[name];
}

function sameTurnAuthority(expected: ResidentTurn, supplied: ResidentTurn): boolean {
  return expected.inputId === supplied.inputId &&
    expected.invocationId === supplied.invocationId &&
    expected.prompt === supplied.prompt &&
    sameModelRouteAuthority(expected.route, supplied.route) &&
    expected.controlCapability === supplied.controlCapability;
}

function sameModelRouteAuthority(expected: ResidentTurn["route"], supplied: ResidentTurn["route"]): boolean {
  if ("nativeCodexProfileHome" in expected) return "nativeCodexProfileHome" in supplied &&
    expected.nativeCodexProfileHome === supplied.nativeCodexProfileHome && safeSecretEqual(expected.authorityId, supplied.authorityId);
  return "baseUrl" in supplied && expected.baseUrl === supplied.baseUrl && safeSecretEqual(expected.token, supplied.token);
}

function turnKey(inputId: string, invocationId: string): string {
  return createHash("sha256").update(`${inputId}\0${invocationId}`).digest("hex");
}

function rpcIdKey(id: unknown): string {
  if (typeof id === "string") return `s:${id}`;
  if (typeof id === "number" && Number.isFinite(id)) return `n:${id}`;
  if (id === null) return "null";
  throw new Error("resident control JSON-RPC response has an invalid id");
}

async function closePreparedControl(control: PreparedControlAuthority): Promise<void> {
  control.service.revoke();
  await control.service.drain();
  const results = await Promise.allSettled([
    control.downstream.close(),
    control.bridge.close()
  ]);
  const rejected = results.find((result): result is PromiseRejectedResult =>
    result.status === "rejected");
  if (rejected) throw rejected.reason;
}

function listenHttp(server: HttpServer): Promise<void> {
  return new Promise((resolve, reject) => {
    const onError = (error: Error) => {
      server.off("listening", onListening);
      reject(error);
    };
    const onListening = () => {
      server.off("error", onError);
      resolve();
    };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(0, "127.0.0.1");
  });
}

function listenNet(server: NetServer): Promise<void> {
  return new Promise((resolve, reject) => {
    const onError = (error: Error) => {
      server.off("listening", onListening);
      reject(error);
    };
    const onListening = () => {
      server.off("error", onError);
      resolve();
    };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(0, "127.0.0.1");
  });
}

async function closeHttp(server: HttpServer, sockets: Set<Socket>): Promise<void> {
  for (const socket of sockets) socket.destroy();
  if (!server.listening) return;
  await withDeadline(
    new Promise<void>((resolve) => server.close(() => resolve())),
    2_000,
    "Resident Gateway frontdoor did not close"
  );
}

async function closeNet(server: NetServer, sockets: Set<Socket>): Promise<void> {
  for (const socket of sockets) socket.destroy();
  if (!server.listening) return;
  await withDeadline(
    new Promise<void>((resolve) => server.close(() => resolve())),
    2_000,
    "Resident control frontdoor did not close"
  );
}

async function withDeadline<T>(
  operation: Promise<T>,
  timeoutMs: number,
  message: string
): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(adapterError(message)), timeoutMs);
        timer.unref();
      })
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function adapterError(message: string, cause?: unknown): HarnessRuntimeError {
  return new HarnessRuntimeError(
    "HARNESS_CONTRACT_VIOLATION",
    message,
    {},
    { source: "runtime", cause: cause instanceof Error ? cause : undefined }
  );
}
