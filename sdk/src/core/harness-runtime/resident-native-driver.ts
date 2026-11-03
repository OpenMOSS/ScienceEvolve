import type { ChildProcessWithoutNullStreams } from "node:child_process";
import { createHash } from "node:crypto";
import { claudeProgressCallId } from "./claude-tool-progress.js";
import { promises as fs } from "node:fs";
import { redactTrace } from "../utils.js";
import type { AgentRunResult, ControlActionEnvelope, TraceSink } from "../types.js";
import {
  DEFAULT_RESIDENT_MODEL_INACTIVITY_TIMEOUT_MS,
  DEFAULT_RESIDENT_TOOL_INACTIVITY_TIMEOUT_MS,
  type ResidentActivitySignal,
  type ResidentInactivityPolicy,
  type ResidentKnownUsage,
  type ResidentProtocolObservation,
  type SessionRef
} from "./contracts.js";
import { HarnessRuntimeError, ResidentInputPreparationError, ResidentTurnRetryableError, transientHarnessFailure } from "./errors.js";
import {
  linuxProcessStopped,
  linuxProcPath,
  readResidentProcessIdentity,
  type ResidentHarnessDriver,
  type ResidentProcessIdentity,
  type ResidentTurn
} from "./resident-lease.js";
import { controlWindowsResident } from "./windows-resident.js";
import { signalProcessTree, terminateProcessTree } from "./process-host.js";

export type ResidentRecoveryStrategy = "native-session-resume" | "durable-rehydrate";
export type BuiltinResidentProtocol =
  | "codex-app-server"
  | "claude-stream-json"
  | "pi-rpc"
  | "dsh-sdk-json-rpc";
/** Additional codecs are supplied by trusted Adapter code, never a workflow string. */
export type ResidentProtocol = BuiltinResidentProtocol | (string & {});

export const RESIDENT_PROTOCOL_BUFFER_CAPACITY = 256;
/**
 * Native tool results are transported as one JSON line. This is a transport
 * ceiling for ordinary frames, independent from UI preview limits. An exact
 * just-sent user input gets a size derived from its bound text; its remaining
 * metadata is bounded separately. Complete frames reach the durable sink.
 */
export const RESIDENT_PROTOCOL_MAX_FRAME_BYTES = 8 * 1024 * 1024;
const RESIDENT_INPUT_ECHO_METADATA_BYTES = 64 * 1024;
export const RESIDENT_COMPLETION_TAIL_QUIET_MS = 100;
export const RESIDENT_COMPLETION_TAIL_MAX_MS = 1_000;
const RESIDENT_PROTOCOL_QUEUE_HIGH_WATER = RESIDENT_PROTOCOL_BUFFER_CAPACITY - 1;
const RESIDENT_PROTOCOL_QUEUE_LOW_WATER = Math.floor(
  RESIDENT_PROTOCOL_BUFFER_CAPACITY / 2
);

export interface ResidentProtocolBufferState {
  bufferedFrames: number;
  capacity: number;
  backpressured: boolean;
  maxObservedBufferedFrames: number;
  maxObservedFrameBytes: number;
  oversizedBufferedFrames: number;
  maxObservedOversizedFrames: number;
}

export interface ResidentTurnAuthorityLease {
  inputId: string;
  invocationId: string;
  ownershipEpoch: number;
  /** Trusted late input facts; cannot change route, capability or identity. */
  inputSupplement?: () => Promise<string> | string;
  /** Read the exact turn's proxy failure before revoking/disposal loses it. */
  classifyFailure?(error: unknown): unknown;
  release(
    outcome: "completed" | "failed"
  ): Promise<void | readonly ControlActionEnvelope[]> | void | readonly ControlActionEnvelope[];
}

/**
 * Implemented by the trusted Gateway/control layer. It must rotate the live
 * downstream route and control capability before the retained CLI can start a
 * turn. A driver cannot submit without this acknowledgement.
 */
export interface ResidentTurnAuthorityBroker {
  activate(turn: ResidentTurn): Promise<ResidentTurnAuthorityLease>;
}

export interface ResidentProtocolConnection {
  /** Bound by the trusted codec immediately before sending this exact input. */
  expectInputEcho?(session: SessionRef, text: string): void;
  send(frame: Record<string, unknown>): Promise<void>;
  next(
    predicate: (frame: Readonly<Record<string, unknown>>) => boolean,
    label: string
  ): Promise<Record<string, unknown>>;
  notify(frame: Record<string, unknown>, turn?: ResidentTurn): Promise<void> | void;
  /** Consume only Adapter-declared, non-business initialization notifications. */
  consumeInitializationNotifications(
    predicate: (frame: Readonly<Record<string, unknown>>) => boolean,
    label: string
  ): Promise<void>;
  requestId(): number;
}

export interface ResidentCompletionTailPolicy {
  /** Completion evidence may arrive just after the codec's primary terminal frame. */
  isComplete(): boolean;
  /** Accept only a tail owned by the just-finished session and native turn. */
  accept(
    frame: Readonly<Record<string, unknown>>,
    session: SessionRef
  ): boolean;
}

export interface ResidentProtocolCodec {
  readonly protocol: ResidentProtocol;
  /** Only an initial pending session may receive a native-allocated identity. */
  readonly allocatesNativeSessionId?: boolean;
  readonly recoveryStrategy: ResidentRecoveryStrategy;
  /** Native-frame mapping; the common driver alone owns liveness policy. */
  observe(frame: Readonly<Record<string, unknown>>): ResidentProtocolObservation | undefined;
  readonly completionTail: ResidentCompletionTailPolicy;
  initialize(connection: ResidentProtocolConnection, session: SessionRef): Promise<SessionRef>;
  /** Adapter-owned allowlist drain for non-business frames at idle boundaries. */
  settleIdle?(connection: ResidentProtocolConnection, session: SessionRef): Promise<void>;
  submit(
    connection: ResidentProtocolConnection,
    session: SessionRef,
    turn: ResidentTurn
  ): Promise<AgentRunResult>;
  close(connection: ResidentProtocolConnection, session: SessionRef): Promise<void>;
}

export interface OpenResidentNativeDriverOptions {
  child: ChildProcessWithoutNullStreams;
  session: SessionRef;
  codec: ResidentProtocolCodec;
  turnAuthority: ResidentTurnAuthorityBroker;
  ownershipEpoch: number;
  /** Common ProcessHost completion, retained so callback failures are observed. */
  processCompletion?: Promise<unknown>;
  /** Trusted ProcessHost cancellation; never supplied by a model turn. */
  processSignal?: AbortSignal;
  onFrame?: (
    frame: Readonly<Record<string, unknown>>,
    turn?: ResidentTurn
  ) => Promise<void> | void;
  onTrace?: TraceSink;
  inactivityPolicy?: Partial<ResidentInactivityPolicy>;
  /** Process discovery is bounded independently from the lifetime of a native turn. */
  startupTimeoutMs?: number;
}

interface ResidentTrackedToolActivity {
  callId: string;
  name?: string;
  startedAt: number;
  lastActivityAt: number;
}

export interface ResidentTurnActivitySnapshot {
  harnessId: string;
  invocationId: string;
  deadlineType: "model-activity-idle" | "tool-activity-idle";
  timeoutMs: number;
  deadlineBaselineAt: number;
  deadlineAt: number;
  lastActivityAt: number;
  lastActivityType: string;
  toolSteps: number;
  toolCallId?: string;
  toolName?: string;
  knownUsage?: ResidentKnownUsage;
}

/** Harness-neutral resident liveness state; codecs only emit typed observations. */
export class ResidentTurnActivityClock {
  readonly policy: ResidentInactivityPolicy;
  readonly #onTimeout: (
    error: HarnessRuntimeError,
    snapshot: ResidentTurnActivitySnapshot
  ) => void;
  readonly #activeTools = new Map<string, ResidentTrackedToolActivity>();
  #timer: NodeJS.Timeout | undefined;
  #active = false;
  #harnessId = "";
  #invocationId = "";
  #lastModelActivityAt = 0;
  #lastHeartbeatAt = 0;
  #lastActivityAt = 0;
  #lastActivityType = "turn.started";
  #lastActivityTool: { callId: string; name?: string } | undefined;
  #knownUsage: ResidentKnownUsage | undefined;
  #toolSteps = 0;

  constructor(
    policy: Partial<ResidentInactivityPolicy> = {},
    onTimeout: (
      error: HarnessRuntimeError,
      snapshot: ResidentTurnActivitySnapshot
    ) => void = () => undefined
  ) {
    this.policy = {
      modelTimeoutMs: positiveInactivityTimeout(
        policy.modelTimeoutMs,
        DEFAULT_RESIDENT_MODEL_INACTIVITY_TIMEOUT_MS
      ),
      toolTimeoutMs: positiveInactivityTimeout(
        policy.toolTimeoutMs,
        DEFAULT_RESIDENT_TOOL_INACTIVITY_TIMEOUT_MS
      )
    };
    this.#onTimeout = onTimeout;
  }

  begin(input: { harnessId: string; invocationId: string }, observedAt = Date.now()): void {
    if (this.#active) throw driverError("Resident activity clock cannot track concurrent turns");
    this.#active = true;
    this.#harnessId = input.harnessId;
    this.#invocationId = input.invocationId;
    this.#activeTools.clear();
    this.#knownUsage = undefined;
    this.#lastModelActivityAt = observedAt;
    this.#lastHeartbeatAt = observedAt;
    this.#lastActivityAt = observedAt;
    this.#lastActivityType = "turn.started";
    this.#lastActivityTool = undefined;
    this.#toolSteps = 0;
    this.#arm();
  }

  observe(observation: ResidentProtocolObservation, observedAt = Date.now()): void {
    if (!this.#active) return;
    if (observation.usage) {
      this.#knownUsage = { ...this.#knownUsage, ...observation.usage };
    }
    let changed = false;
    for (const activity of observation.activities ?? []) {
      changed = this.#recordActivity(activity, observedAt) || changed;
    }
    if (changed) this.#arm();
  }

  end(): void {
    this.#active = false;
    if (this.#timer) clearTimeout(this.#timer);
    this.#timer = undefined;
    this.#activeTools.clear();
  }

  snapshot(): ResidentTurnActivitySnapshot | undefined {
    if (!this.#active) return undefined;
    const deadline = this.#currentDeadline();
    return {
      harnessId: this.#harnessId,
      invocationId: this.#invocationId,
      deadlineType: deadline.type,
      timeoutMs: deadline.timeoutMs,
      deadlineBaselineAt: deadline.baselineAt,
      deadlineAt: deadline.baselineAt + deadline.timeoutMs,
      lastActivityAt: this.#lastActivityAt,
      lastActivityType: this.#lastActivityType,
      toolSteps: this.#toolSteps,
      ...(deadline.tool ? {
        toolCallId: deadline.tool.callId,
        ...(deadline.tool.name ? { toolName: deadline.tool.name } : {})
      } : this.#lastActivityTool ? {
        toolCallId: this.#lastActivityTool.callId,
        ...(this.#lastActivityTool.name ? { toolName: this.#lastActivityTool.name } : {})
      } : {}),
      ...(this.#knownUsage ? { knownUsage: { ...this.#knownUsage } } : {})
    };
  }

  #recordActivity(activity: ResidentActivitySignal, observedAt: number): boolean {
    if (activity.kind === "model") {
      this.#lastModelActivityAt = observedAt;
      this.#recordLastActivity(`model.${activity.phase}`, observedAt);
      return true;
    }
    if (activity.kind === "heartbeat") {
      this.#lastHeartbeatAt = observedAt;
      this.#recordLastActivity("heartbeat", observedAt);
      return true;
    }
    if (activity.phase === "started") {
      if (!this.#activeTools.has(activity.callId)) {
        this.#toolSteps = Math.min(Number.MAX_SAFE_INTEGER, this.#toolSteps + 1);
      }
      this.#activeTools.set(activity.callId, {
        callId: activity.callId,
        ...(activity.name ? { name: activity.name } : {}),
        startedAt: observedAt,
        lastActivityAt: observedAt
      });
    } else {
      const current = this.#activeTools.get(activity.callId);
      if (!current) return false;
      current.lastActivityAt = observedAt;
      if (activity.name) current.name = activity.name;
      if (activity.phase === "completed" || activity.phase === "failed") {
        this.#activeTools.delete(activity.callId);
        if (this.#activeTools.size === 0) {
          // Tool wall time never consumes the next model/provider wait window.
          this.#lastModelActivityAt = observedAt;
          this.#lastHeartbeatAt = observedAt;
        }
      }
    }
    this.#recordLastActivity(`tool.${activity.phase}`, observedAt, activity);
    return true;
  }

  #recordLastActivity(
    type: string,
    observedAt: number,
    tool?: { callId: string; name?: string }
  ): void {
    this.#lastActivityAt = observedAt;
    this.#lastActivityType = type;
    this.#lastActivityTool = tool
      ? { callId: tool.callId, ...(tool.name ? { name: tool.name } : {}) }
      : undefined;
  }

  #currentDeadline(): {
    type: ResidentTurnActivitySnapshot["deadlineType"];
    timeoutMs: number;
    baselineAt: number;
    tool?: ResidentTrackedToolActivity;
  } {
    if (this.#activeTools.size > 0) {
      const tool = [...this.#activeTools.values()]
        .sort((left, right) =>
          Math.max(left.lastActivityAt, this.#lastHeartbeatAt) -
          Math.max(right.lastActivityAt, this.#lastHeartbeatAt)
        )[0]!;
      return {
        type: "tool-activity-idle",
        timeoutMs: this.policy.toolTimeoutMs,
        baselineAt: Math.max(tool.lastActivityAt, this.#lastHeartbeatAt),
        tool
      };
    }
    return {
      type: "model-activity-idle",
      timeoutMs: this.policy.modelTimeoutMs,
      baselineAt: Math.max(this.#lastModelActivityAt, this.#lastHeartbeatAt)
    };
  }

  #arm(): void {
    if (!this.#active) return;
    if (this.#timer) clearTimeout(this.#timer);
    const deadline = this.#currentDeadline();
    const remaining = Math.max(1, deadline.baselineAt + deadline.timeoutMs - Date.now());
    this.#timer = setTimeout(() => this.#expire(), remaining);
    this.#timer.unref();
  }

  #expire(): void {
    if (!this.#active) return;
    const snapshot = this.snapshot()!;
    const observedAt = Date.now();
    if (observedAt < snapshot.deadlineAt) {
      this.#arm();
      return;
    }
    this.#active = false;
    this.#timer = undefined;
    const elapsedMs = Math.max(0, observedAt - snapshot.deadlineBaselineAt);
    const toolDeadline = snapshot.deadlineType === "tool-activity-idle";
    const error = new HarnessRuntimeError(
      toolDeadline ? "TOOL_EXECUTION_TIMED_OUT" : "INVOCATION_TIMED_OUT",
      toolDeadline
        ? "Resident tool produced no valid activity within the allowed window"
        : "Resident model/provider produced no valid activity within the allowed window",
      {
        harnessId: snapshot.harnessId,
        invocationId: snapshot.invocationId,
        operation: "Resident turn inactivity",
        timeoutMode: "inactivity",
        deadlineType: snapshot.deadlineType,
        timeoutMs: snapshot.timeoutMs,
        elapsedMs,
        lastActivityAt: new Date(snapshot.lastActivityAt).toISOString(),
        lastActivityType: snapshot.lastActivityType,
        toolSteps: snapshot.toolSteps,
        deadlineBaselineAt: new Date(snapshot.deadlineBaselineAt).toISOString(),
        observedAt: new Date(observedAt).toISOString(),
        ...(snapshot.toolCallId ? { toolCallId: snapshot.toolCallId } : {}),
        ...(snapshot.toolName ? { toolName: snapshot.toolName } : {}),
        ...(snapshot.knownUsage ? { knownUsage: snapshot.knownUsage } : {})
      },
      { source: "process" }
    );
    this.#onTimeout(error, snapshot);
  }
}

export class ResidentNativeDriver implements ResidentHarnessDriver {
  #windowsPaused = false;
  readonly identity: ResidentProcessIdentity;
  session: SessionRef;
  readonly protocol: ResidentProtocol;
  readonly recoveryStrategy: ResidentRecoveryStrategy;
  readonly #child: ChildProcessWithoutNullStreams;
  readonly #connection: JsonLineConnection;
  readonly #codec: ResidentProtocolCodec;
  readonly #activityClock: ResidentTurnActivityClock;
  readonly #turnAuthority: ResidentTurnAuthorityBroker;
  readonly #submittedInputIds = new Set<string>();
  readonly #activatedRouteDigests = new Set<string>();
  readonly #activatedControlDigests = new Set<string>();
  readonly #ownershipEpoch: number;
  readonly #processSignal?: AbortSignal;
  #active = false;
  #closed = false;
  #closePromise?: Promise<void>;

  private constructor(
    options: OpenResidentNativeDriverOptions,
    identity: ResidentProcessIdentity,
    connection: JsonLineConnection,
    activityClock: ResidentTurnActivityClock
  ) {
    this.#child = options.child;
    this.identity = identity;
    this.session = structuredClone(options.session);
    this.#codec = options.codec;
    this.#activityClock = activityClock;
    this.protocol = options.codec.protocol;
    this.recoveryStrategy = options.codec.recoveryStrategy;
    this.#turnAuthority = options.turnAuthority;
    this.#ownershipEpoch = options.ownershipEpoch;
    this.#processSignal = options.processSignal;
    this.#connection = connection;
  }

  static async open(options: OpenResidentNativeDriverOptions): Promise<ResidentNativeDriver> {
    if (!options.child.pid) throw driverError("Resident native process has no PID");
    if (!Number.isSafeInteger(options.ownershipEpoch) || options.ownershipEpoch < 0) {
      throw driverError("Resident native process has an invalid ownership epoch");
    }
    const identity = await waitForIdentity(options.child.pid, options.startupTimeoutMs ?? 10_000);
    let connection!: JsonLineConnection;
    const activityClock = new ResidentTurnActivityClock(
      options.inactivityPolicy,
      (error, snapshot) => {
        connection.fail(error);
        void Promise.resolve(options.onTrace?.(
          "status",
          "Resident Harness inactivity deadline reached",
          {
            diagnostic: true,
            diagnosticSource: "adapter",
            errorCode: error.code,
            harnessId: snapshot.harnessId,
            invocationId: snapshot.invocationId,
            timeoutMode: "inactivity",
            deadlineType: snapshot.deadlineType,
            timeoutMs: snapshot.timeoutMs,
            lastActivityAt: new Date(snapshot.lastActivityAt).toISOString(),
            lastActivityType: snapshot.lastActivityType,
            toolSteps: snapshot.toolSteps,
            deadlineBaselineAt: new Date(snapshot.deadlineBaselineAt).toISOString(),
            ...(snapshot.toolCallId ? { toolCallId: snapshot.toolCallId } : {}),
            ...(snapshot.toolName ? { toolName: snapshot.toolName } : {}),
            ...(snapshot.knownUsage ? { knownUsage: snapshot.knownUsage } : {})
          }
        )).catch(() => undefined);
      }
    );
    connection = new JsonLineConnection(
      options.child,
      options.onFrame,
      (frame) => {
        const observation = options.codec.observe(frame);
        if (observation) activityClock.observe(observation);
      },
      options.codec.protocol
    );
    const driver = new ResidentNativeDriver(options, identity, connection, activityClock);
    void options.processCompletion?.catch((error: unknown) => {
      connection.fail(driverError("Resident ProcessHost callback failed", error));
    });
    try {
      const initialized = await options.codec.initialize(connection, driver.session);
      assertInitializedSession(driver.session, initialized, options.codec);
      driver.session = initialized;
      await options.codec.settleIdle?.(connection, driver.session);
      connection.assertQuiescent("after native session initialization");
      return driver;
    } catch (error) {
      signalProcessTree(options.child, "SIGKILL");
      await connection.completed.catch(() => undefined);
      throw error;
    }
  }

  async submit(turn: ResidentTurn): Promise<AgentRunResult> {
    if (this.#closed) throw driverError("Resident native driver is closed");
    if (this.#active) throw driverError("Resident native driver cannot run concurrent turns");
    if (this.#submittedInputIds.has(turn.inputId)) {
      throw driverError("Resident native driver rejected a duplicate input id");
    }
    if (this.recoveryStrategy === "durable-rehydrate" && this.session.resumedAt &&
      !turn.durableRehydrate) {
      throw driverError("Durable rehydrate recovery requires explicit provenance");
    }
    this.#consumeFreshTurnAuthority(turn);
    await this.#codec.settleIdle?.(this.#connection, this.session);
    this.#connection.assertQuiescent("before a resident turn");
    this.#active = true;
    let authority: ResidentTurnAuthorityLease;
    try {
      authority = await this.#turnAuthority.activate(structuredClone(turn));
    } catch (error) {
      this.#connection.fail(driverError("Turn-authority activation failed", error));
      this.#active = false;
      throw error;
    }
    if (authority.inputId !== turn.inputId || authority.invocationId !== turn.invocationId ||
      authority.ownershipEpoch !== this.#ownershipEpoch) {
      await Promise.resolve(authority.release("failed")).catch(() => undefined);
      const error = driverError("Turn-authority broker returned a mismatched acknowledgement");
      this.#connection.fail(error);
      this.#active = false;
      throw error;
    }
    let result: AgentRunResult;
    let nativeSubmissionAttempted = false;
    try {
      const supplement = await authority.inputSupplement?.();
      if (supplement !== undefined && typeof supplement !== "string") throw driverError("Resident input supplement is invalid");
      const nativeTurn = supplement ? { ...turn, prompt: `${supplement}\n\n${turn.prompt}` } : turn;
      this.#activityClock.begin({
        harnessId: this.session.harnessId,
        invocationId: turn.invocationId
      });
      try {
        nativeSubmissionAttempted = true;
        result = await this.#codec.submit(this.#connection, this.session, nativeTurn);
      } finally {
        this.#activityClock.end();
      }
      await this.#connection.settleCompletionTail(
        this.#codec.completionTail,
        this.session,
        nativeTurn
      );
      this.#connection.assertQuiescent("after a resident turn completion");
      this.#connection.clearInputEcho();
      this.#submittedInputIds.add(turn.inputId);
    } catch (originalError) {
      if (!nativeSubmissionAttempted) {
        try {
          await authority.release("failed");
          this.#connection.assertQuiescent("after rejected input preparation");
        } catch (releaseError) {
          this.#connection.fail(releaseError instanceof Error ? releaseError : driverError("Input preparation revocation failed"));
          await this.forceClose(); throw releaseError;
        } finally { this.#active = false; }
        throw new ResidentInputPreparationError(originalError);
      }
      const modelBoundaryFailure = originalError instanceof NativeTurnFailedError ||
        originalError instanceof HarnessRuntimeError && ["HARNESS_PROCESS_EXITED", "INVOCATION_TIMED_OUT", "TOOL_EXECUTION_TIMED_OUT"].includes(originalError.code);
      let error = modelBoundaryFailure ? authority.classifyFailure?.(originalError) ?? originalError : originalError;
      // A native terminal failure is a model-call boundary, not task failure.
      // Retain the process only after its own terminal evidence and idle tail
      // are verified. Unknown protocol frames, exits and missing completion
      // evidence continue through the full physical stop fence below.
      if (originalError instanceof NativeTurnFailedError && !this.#processSignal?.aborted &&
        transientHarnessFailure(error)) {
        let idle = false;
        try {
          await this.#connection.settleCompletionTail(this.#codec.completionTail, this.session, turn);
          this.#connection.assertQuiescent("after a failed native turn");
          idle = true;
        } catch (tailError) { error = tailError; }
        if (idle) {
          this.#connection.clearInputEcho();
          this.#submittedInputIds.add(turn.inputId);
          try { await authority.release("failed"); }
          catch (releaseError) {
            this.#connection.fail(releaseError instanceof Error ? releaseError : driverError("Failed turn revocation failed"));
            await this.forceClose();
            throw releaseError;
          } finally { this.#active = false; }
          throw new ResidentTurnRetryableError(error as HarnessRuntimeError);
        }
      }
      this.#connection.clearInputEcho();
      this.#connection.fail(error instanceof Error
        ? error
        : driverError("Resident turn failed with an unknown error"));
      // A failed native turn may still own tool descendants. Confirm the
      // process tree stopped before releasing the turn and allowing recovery.
      // Agent business work remains with the Agent; this only fences writers.
      try {
        await this.forceClose();
        await Promise.resolve(authority.release("failed")).catch(() => undefined);
      } finally {
        this.#active = false;
      }
      throw error;
    }
    try {
      const releasedActions = await authority.release("completed");
      if (!releasedActions?.length) return result;
      return {
        ...result,
        controlActions: [
          ...(result.controlActions ?? []),
          ...releasedActions.map((action) => structuredClone(action))
        ]
      };
    } catch (error) {
      // Completed-release owns revocation and cleanup. Retrying it as
      // `failed` could act on the next turn after an atomic rotation.
      this.#connection.fail(error instanceof Error
        ? error
        : driverError("Resident turn authority release failed"));
      throw error;
    } finally {
      this.#active = false;
    }
  }

  protocolBufferState(): ResidentProtocolBufferState {
    return this.#connection.bufferState();
  }

  activityState(): ResidentTurnActivitySnapshot | undefined {
    return this.#activityClock.snapshot();
  }

  inactivityPolicy(): ResidentInactivityPolicy {
    return { ...this.#activityClock.policy };
  }

  async probe(): Promise<{ alive: boolean; stopped: boolean; identity: ResidentProcessIdentity }> {
    try {
      const identity = await readResidentProcessIdentity(this.identity.pid, this.identity.windowsJobName);
      if (process.platform === "win32") {
        const job = await controlWindowsResident(this.identity, "probe");
        return { alive: job.alive && sameIdentity(this.identity, identity), stopped: this.#windowsPaused, identity };
      }
      const status = await fs.readFile(`${await linuxProcPath(this.identity.pid)}/status`, "utf8");
      return { alive: sameIdentity(this.identity, identity), stopped: linuxProcessStopped(status), identity };
    } catch {
      return { alive: false, stopped: false, identity: this.identity };
    }
  }

  async pause(): Promise<void> {
    if (this.#active) throw driverError("A busy resident turn cannot be process-paused");
    if (process.platform === "win32") {
      const result = await controlWindowsResident(this.identity, "pause");
      if (!result.alive || !result.stopped) throw driverError("Windows resident did not acknowledge suspension");
      this.#windowsPaused = true;
      return;
    }
    signalProcessTree(this.#child, "SIGSTOP");
    await waitForProcessState(this.identity, true);
  }

  async resume(): Promise<void> {
    if (process.platform === "win32") {
      const result = await controlWindowsResident(this.identity, "resume");
      if (!result.alive || result.stopped) throw driverError("Windows resident did not acknowledge resumption");
      this.#windowsPaused = false;
      return;
    }
    signalProcessTree(this.#child, "SIGCONT");
    await waitForProcessState(this.identity, false);
  }

  async close(): Promise<void> {
    if (this.#closePromise) return this.#closePromise;
    if (this.#active) throw driverError("A busy resident turn cannot close without interruption");
    this.#closed = true;
    const closing = this.#performClose();
    this.#closePromise = closing;
    try {
      await closing;
    } catch (error) {
      // A failed graceful close may still have successfully killed the owned
      // process tree. Let its owner retry and observe that terminal fact
      // instead of pinning the first rejected promise forever.
      if (this.#closePromise === closing) this.#closePromise = undefined;
      throw error;
    }
  }

  forceClose(): Promise<void> {
    return terminateProcessTree(this.#child, {
      initialSignal: "SIGKILL",
      killAfterMs: 0
    });
  }

  async #performClose(): Promise<void> {
    if (this.#processSignal?.aborted || !(await this.probe()).alive) {
      // The root can exit before its paused lease is closed. The common host
      // retains the exact captured PGID identity and must also stop/prove any
      // remaining descendants; an absent root alone is not a closed driver.
      await terminateProcessTree(this.#child, { killAfterMs: 250 });
      await residentDeadline(this.#connection.completed, 1_000,
        "Resident native process remained alive after termination");
      return;
    }
    let shutdownFailure: unknown;
    try {
      await this.#codec.settleIdle?.(this.#connection, this.session);
      this.#connection.assertQuiescent("before resident shutdown");
      await residentDeadline(
        this.#codec.close(this.#connection, this.session),
        5_000,
        "Resident native protocol shutdown timed out"
      );
    } catch (error) {
      shutdownFailure = error;
    }
    this.#child.stdin.end();
    let exit: { code: number | null; signal: NodeJS.Signals | null } | undefined;
    try {
      exit = await residentDeadline(
        this.#connection.completed,
        5_000,
        "Resident native process did not exit after protocol shutdown"
      );
    } catch (error) {
      shutdownFailure ??= error;
    }
    // CommonProcessHost captured the detached PGID at spawn. Always perform a
    // bounded group quiescence check, even if the leader exited cleanly, so a
    if (shutdownFailure || !exit) {
      await terminateProcessTree(this.#child, { killAfterMs: 1_000 });
      exit = await residentDeadline(
        this.#connection.completed,
        1_000,
        "Resident native process remained alive after termination"
      );
    } else {
      await terminateProcessTree(this.#child, { killAfterMs: 250 });
    }
    // Cancellation can race a native shutdown response. Only the trusted host
    // signal, after actual root exit and owned-tree quiescence, permits that
    // interrupted protocol result to settle as a stopped physical lease.
    if (this.#processSignal?.aborted) return;
    if (shutdownFailure) throw shutdownFailure;
    if (exit.code !== 0 && exit.signal !== "SIGTERM") {
      const cause = this.#connection.failure;
      if (cause instanceof HarnessRuntimeError && cause.code !== "HARNESS_PROCESS_EXITED") throw cause;
      throw driverError(
        `Resident native process exited with ${exit.code ?? exit.signal ?? "unknown status"}`, cause
      );
    }
  }

  #consumeFreshTurnAuthority(turn: ResidentTurn): void {
    const routeDigest = createHash("sha256")
      .update("nativeCodexProfileHome" in turn.route ? turn.route.authorityId : turn.route.token)
      .digest("hex");
    if (this.#activatedRouteDigests.has(routeDigest)) {
      throw driverError("Resident native driver rejected a stale per-turn route");
    }
    this.#activatedRouteDigests.add(routeDigest);
    if (turn.controlCapability !== undefined) {
      if (!turn.controlCapability || turn.controlCapability.includes("\0")) {
        throw driverError("Resident native driver received an invalid control capability");
      }
      const controlDigest = createHash("sha256")
        .update(turn.controlCapability)
        .digest("hex");
      if (this.#activatedControlDigests.has(controlDigest)) {
        throw driverError("Resident native driver rejected a stale per-turn control capability");
      }
      this.#activatedControlDigests.add(controlDigest);
    }
  }
}

export class JsonLineConnection implements ResidentProtocolConnection {
  #inputEcho?: { session: SessionRef; text: string; frameLimit: number };
  readonly #protocol: ResidentProtocol;
  readonly #frameBytes = new WeakMap<Record<string, unknown>, number>();
  #maxObservedOversizedFrames = 0;
  readonly completed: Promise<{ code: number | null; signal: NodeJS.Signals | null }>;
  readonly #child: ChildProcessWithoutNullStreams;
  readonly #frames: Record<string, unknown>[] = [];
  readonly #frameReceivedAt = new WeakMap<Record<string, unknown>, number>();
  readonly #waiters: Array<{
    predicate: (frame: Readonly<Record<string, unknown>>) => boolean;
    label: string;
    resolve: (frame: Record<string, unknown>) => void;
    reject: (error: Error) => void;
  }> = [];
  readonly #onFrame?: OpenResidentNativeDriverOptions["onFrame"];
  readonly #onProtocolFrame?: (frame: Readonly<Record<string, unknown>>) => void;
  #pendingFrame: Record<string, unknown> | undefined;
  #readerPausedMs = 0;
  #readerPausedAt: number | undefined;
  #readerWaiter: {
    resolve: () => void;
    reject: (error: Error) => void;
  } | undefined;
  #frameWaiter: {
    resolve: (available: boolean) => void;
    reject: (error: Error) => void;
    timer: NodeJS.Timeout;
  } | undefined;
  #maxObservedFrameBytes = 0;
  #maxObservedBufferedFrames = 0;
  #requestId = 0;
  #failure: Error | undefined;

  constructor(
    child: ChildProcessWithoutNullStreams,
    onFrame: OpenResidentNativeDriverOptions["onFrame"],
    onProtocolFrame: ((frame: Readonly<Record<string, unknown>>) => void) | undefined,
    protocol: ResidentProtocol
  ) {
    this.#child = child;
    this.#onFrame = onFrame;
    this.#onProtocolFrame = onProtocolFrame;
    this.#protocol = protocol;
    this.completed = new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((resolve) => {
      child.once("close", (code, signal) => resolve({ code, signal }));
    }).then((exit) => {
      const error = this.#failure ?? new HarnessRuntimeError(
        "HARNESS_PROCESS_EXITED",
        "Resident native process exited while awaiting a protocol frame",
        { protocol: this.#protocol, exitCode: exit.code, signal: exit.signal },
        { source: "process" }
      );
      this.#failure = error;
      for (const waiter of this.#waiters.splice(0)) {
        waiter.reject(error);
      }
      this.#rejectReader(error);
      this.#rejectFrameWaiter(error);
      return exit;
    });
    void this.#readFrames().catch((error: unknown) => {
      this.#fatal(error instanceof Error
        ? error
        : driverError("Resident native protocol stream failed"));
    });
  }

  expectInputEcho(session: SessionRef, text: string): void {
    this.#inputEcho = { session: structuredClone(session), text,
      frameLimit: Math.max(RESIDENT_PROTOCOL_MAX_FRAME_BYTES,
        Buffer.byteLength(JSON.stringify(text), "utf8") + RESIDENT_INPUT_ECHO_METADATA_BYTES) };
  }

  clearInputEcho(): void { this.#inputEcho = undefined; }

  /** Preserve the protocol failure that required containment, rather than its later kill signal. */
  get failure(): Error | undefined { return this.#failure; }

  bufferState(): ResidentProtocolBufferState {
    return {
      bufferedFrames: this.#bufferedFrameCount(),
      capacity: RESIDENT_PROTOCOL_BUFFER_CAPACITY,
      backpressured: this.#pendingFrame !== undefined,
      maxObservedBufferedFrames: this.#maxObservedBufferedFrames,
      maxObservedFrameBytes: this.#maxObservedFrameBytes,
      oversizedBufferedFrames: this.#oversizedBufferedFrames(),
      maxObservedOversizedFrames: this.#maxObservedOversizedFrames
    };
  }

  requestId(): number {
    this.#requestId += 1;
    return this.#requestId;
  }

  async send(frame: Record<string, unknown>): Promise<void> {
    if (this.#failure) throw this.#failure;
    const value = `${JSON.stringify(frame)}\n`;
    try {
      if (this.#child.stdin.write(value, "utf8")) return;
      await new Promise<void>((resolve, reject) => {
        let settled = false;
        const cleanup = () => {
          this.#child.stdin.removeListener("drain", onDrain);
          this.#child.stdin.removeListener("error", onError);
          this.#child.stdin.removeListener("close", onClose);
        };
        const finish = (error?: Error) => {
          if (settled) return;
          settled = true;
          cleanup();
          if (error) reject(error);
          else resolve();
        };
        const onDrain = () => finish();
        const onError = (error: Error) => finish(driverError("Resident native protocol write failed", error));
        const onClose = () => finish(driverError("Resident native protocol input closed before drain"));
        this.#child.stdin.once("drain", onDrain);
        this.#child.stdin.once("error", onError);
        this.#child.stdin.once("close", onClose);
      });
    } catch (error) {
      if (error instanceof HarnessRuntimeError) throw error;
      throw driverError("Resident native protocol write failed", error);
    }
  }

  async next(
    predicate: (frame: Readonly<Record<string, unknown>>) => boolean,
    label: string
  ): Promise<Record<string, unknown>> {
    if (this.#failure) throw this.#failure;
    const index = this.#findFrame(predicate, label);
    if (index >= 0) {
      const frame = this.#frames.splice(index, 1)[0]!;
      this.#resumeReader();
      return frame;
    }
    if (this.#pendingFrame && this.#matches(predicate, this.#pendingFrame, label)) {
      const frame = this.#pendingFrame;
      this.#pendingFrame = undefined;
      this.#resumeReader(true);
      return frame;
    }
    return new Promise<Record<string, unknown>>((resolve, reject) => {
      this.#waiters.push({ predicate, label, resolve, reject });
    });
  }

  notify(frame: Record<string, unknown>, turn?: ResidentTurn): Promise<void> | void {
    return this.#onFrame?.(frame, turn);
  }

  async consumeInitializationNotifications(
    predicate: (frame: Readonly<Record<string, unknown>>) => boolean,
    label: string
  ): Promise<void> {
    const maximumMs = 1_000;
    const quietMs = 100;
    const startedAt = this.#protocolTime();
    const deadline = startedAt + maximumMs;
    let quietDeadline = startedAt + quietMs;
    let acceptedNotifications = 0;
    let lastReceivedElapsedMs = 0;
    const failUnsettled = (): never => {
      const error = new HarnessRuntimeError(
        "HARNESS_CONTRACT_VIOLATION",
        `Resident ${label} notifications did not quiesce`,
        { operation: "initialization-quiescence", protocol: this.#protocol,
          maximumMs, quietMs, acceptedNotifications, lastReceivedElapsedMs },
        { source: "adapter" }
      );
      this.#fatal(error);
      throw error;
    };
    for (;;) {
      if (this.#failure) throw this.#failure;
      const frame = this.#frames[0];
      if (frame) {
        // Keep the native production bound even when our consumer is delayed.
        // Already received notifications do not become new native activity
        // merely because their local processing resumes later.
        const receivedAt = Math.max(startedAt, this.#frameReceivedAt.get(frame)!);
        lastReceivedElapsedMs = receivedAt - startedAt;
        if (receivedAt >= deadline) failUnsettled();
        let accepted = false;
        try { accepted = predicate(frame); } catch (error) {
          const failure = driverError(`Resident ${label} predicate failed`, error);
          this.#fatal(failure);
          throw failure;
        }
        if (!accepted) return;
        this.#frames.shift();
        this.#resumeReader();
        acceptedNotifications += 1;
        quietDeadline = receivedAt + quietMs;
        continue;
      }
      const now = this.#protocolTime();
      if (now >= quietDeadline && quietDeadline < deadline) return;
      if (now >= deadline) failUnsettled();
      await this.#waitForFrame(Math.min(quietDeadline, deadline) - now);
    }
  }

  async settleCompletionTail(
    policy: ResidentCompletionTailPolicy,
    session: SessionRef,
    turn: ResidentTurn
  ): Promise<void> {
    const startedAt = this.#protocolTime();
    const maximumDeadline = startedAt + RESIDENT_COMPLETION_TAIL_MAX_MS;
    let quietDeadline = startedAt + RESIDENT_COMPLETION_TAIL_QUIET_MS;
    const failUnsettled = (): never => {
      const error = driverError(
        policy.isComplete()
          ? "Resident completion tail did not quiesce within its bounded window"
          : "Resident completion evidence did not arrive within its bounded window"
      );
      this.#fatal(error);
      throw error;
    };
    for (;;) {
      if (this.#failure) throw this.#failure;
      const frame = this.#frames.shift();
      if (frame) {
        // Bound native production, not our durable delivery of already received events.
        // The reader stays active during delivery and still records a non-quiescing producer.
        const receivedAt = this.#frameReceivedAt.get(frame)!;
        if (receivedAt >= maximumDeadline) failUnsettled();
        this.#resumeReader();
        let accepted = false;
        try { accepted = policy.accept(frame, session); } catch (error) {
          const failure = driverError("Resident completion-tail predicate failed", error);
          this.#fatal(failure);
          throw failure;
        }
        if (!accepted) {
          const failure = driverError(
            `Resident protocol emitted an unexpected completion-tail frame (${protocolFrameShape(frame)})`
          );
          this.#fatal(failure);
          throw failure;
        }
        try {
          await this.notify(frame, turn);
        } catch (error) {
          const failure = driverError("Resident completion-tail delivery failed", error);
          this.#fatal(failure);
          throw failure;
        }
        quietDeadline = Math.max(startedAt, receivedAt) + RESIDENT_COMPLETION_TAIL_QUIET_MS;
        continue;
      }
      const now = this.#protocolTime();
      if (policy.isComplete() && now >= quietDeadline && quietDeadline < maximumDeadline) return;
      if (now >= maximumDeadline) failUnsettled();
      const waitUntil = policy.isComplete()
        ? Math.min(quietDeadline, maximumDeadline)
        : maximumDeadline;
      const available = await this.#waitForFrame(waitUntil - now);
      if (available) continue;
      const afterWait = this.#protocolTime();
      if (policy.isComplete() && afterWait >= quietDeadline &&
        afterWait < maximumDeadline) return;
    }
  }

  assertQuiescent(label: string): void {
    if (this.#failure) throw this.#failure;
    if (this.#frames.length !== 0 || this.#pendingFrame || this.#waiters.length !== 0) {
      const shapes = [
        ...this.#frames.slice(0, 5),
        ...(this.#pendingFrame && this.#frames.length < 5 ? [this.#pendingFrame] : [])
      ].map(protocolFrameShape).join(", ");
      const error = driverError(
        `Resident protocol emitted an unexpected frame ${label}` +
        (shapes ? ` (${shapes})` : "")
      );
      this.#fatal(error);
      throw error;
    }
  }

  fail(error: Error): void {
    this.#fatal(error);
  }

  async #readFrames(): Promise<void> {
    let fragments: Buffer[] = [];
    let fragmentBytes = 0;
    for await (const rawChunk of this.#child.stdout) {
      if (this.#failure) throw this.#failure;
      const chunk = Buffer.isBuffer(rawChunk) ? rawChunk : Buffer.from(rawChunk);
      let cursor = 0;
      while (cursor < chunk.length) {
        const newline = chunk.indexOf(0x0a, cursor);
        const end = newline < 0 ? chunk.length : newline;
        const fragment = chunk.subarray(cursor, end);
        fragmentBytes += fragment.length;
        if (fragmentBytes > (this.#inputEcho?.frameLimit ?? RESIDENT_PROTOCOL_MAX_FRAME_BYTES)) {
          throw driverError("Resident native protocol frame exceeded its byte limit");
        }
        if (fragment.length > 0) fragments.push(fragment);
        if (newline < 0) break;
        const bytes = fragments.length === 1
          ? fragments[0]!
          : Buffer.concat(fragments, fragmentBytes);
        fragments = [];
        fragmentBytes = 0;
        const line = bytes.length > 0 && bytes[bytes.length - 1] === 0x0d
          ? bytes.subarray(0, -1).toString("utf8")
          : bytes.toString("utf8");
        await this.#acceptLine(line);
        cursor = newline + 1;
      }
    }
    if (fragmentBytes > 0) {
      const bytes = fragments.length === 1
        ? fragments[0]!
        : Buffer.concat(fragments, fragmentBytes);
      await this.#acceptLine(bytes.toString("utf8"));
    }
  }

  async #acceptLine(line: string): Promise<void> {
    if (this.#failure) throw this.#failure;
    if (!line.trim()) return;
    const frameBytes = Buffer.byteLength(line, "utf8");
    this.#maxObservedFrameBytes = Math.max(this.#maxObservedFrameBytes, frameBytes);
    let frame: unknown;
    try { frame = JSON.parse(line); } catch (error) {
      throw driverError("Resident native protocol emitted malformed JSON", error);
    }
    if (!isRecord(frame)) {
      throw driverError("Resident native protocol frame is not an object");
    }
    if (frameBytes > RESIDENT_PROTOCOL_MAX_FRAME_BYTES && (!this.#inputEcho ||
      !isExactNativeInputEcho(this.#protocol, frame, this.#inputEcho.session, this.#inputEcho.text))) {
      throw driverError("Resident native protocol frame exceeded its byte limit without its exact bound user input");
    }
    this.#frameBytes.set(frame, frameBytes);
    this.#frameReceivedAt.set(frame, this.#protocolTime());
    this.#onProtocolFrame?.(frame);
    if (this.#deliverToWaiter(frame)) return;
    if (this.#frames.length < RESIDENT_PROTOCOL_QUEUE_HIGH_WATER &&
      (frameBytes <= RESIDENT_PROTOCOL_MAX_FRAME_BYTES || !this.#frames.some(item => this.#oversized(item)))) {
      this.#frames.push(frame);
      this.#observeBufferSize();
      this.#signalFrame();
      return;
    }
    this.#pendingFrame = frame;
    this.#observeBufferSize();
    this.#signalFrame();
    this.#readerPausedAt = Date.now();
    try {
      await new Promise<void>((resolve, reject) => {
        this.#readerWaiter = { resolve, reject };
      });
    } finally {
      this.#readerPausedMs += Date.now() - this.#readerPausedAt;
      this.#readerPausedAt = undefined;
    }
    if (this.#failure) throw this.#failure;
    const pending = this.#pendingFrame;
    this.#pendingFrame = undefined;
    if (!pending || this.#deliverToWaiter(pending)) return;
    this.#frames.push(pending);
    this.#observeBufferSize();
    this.#signalFrame();
  }

  #deliverToWaiter(frame: Record<string, unknown>): boolean {
    for (let index = 0; index < this.#waiters.length; index += 1) {
      const waiter = this.#waiters[index]!;
      if (!this.#matches(waiter.predicate, frame, waiter.label)) continue;
      this.#waiters.splice(index, 1);
      waiter.resolve(frame);
      return true;
    }
    return false;
  }

  #findFrame(
    predicate: (frame: Readonly<Record<string, unknown>>) => boolean,
    label: string
  ): number {
    for (let index = 0; index < this.#frames.length; index += 1) {
      if (this.#matches(predicate, this.#frames[index]!, label)) return index;
    }
    return -1;
  }

  #matches(
    predicate: (frame: Readonly<Record<string, unknown>>) => boolean,
    frame: Record<string, unknown>,
    label: string
  ): boolean {
    try {
      return predicate(frame);
    } catch (error) {
      const failure = driverError(`Resident ${label} predicate failed`, error);
      this.#fatal(failure);
      throw failure;
    }
  }

  #bufferedFrameCount(): number {
    return this.#frames.length + (this.#pendingFrame ? 1 : 0);
  }

  #protocolTime(): number {
    const now = Date.now();
    // Backpressure is a local transport pause, not evidence that the Agent is still
    // producing output. Keep the finite queue and native tail bound without counting
    // that pause against an already completed Agent or choosing its business outcome.
    return now - this.#readerPausedMs -
      (this.#readerPausedAt === undefined ? 0 : now - this.#readerPausedAt);
  }

  #observeBufferSize(): void {
    this.#maxObservedOversizedFrames = Math.max(this.#maxObservedOversizedFrames, this.#oversizedBufferedFrames());
    this.#maxObservedBufferedFrames = Math.max(
      this.#maxObservedBufferedFrames,
      this.#bufferedFrameCount()
    );
  }

  #oversized(frame: Record<string, unknown>): boolean { return (this.#frameBytes.get(frame) ?? 0) > RESIDENT_PROTOCOL_MAX_FRAME_BYTES; }
  #oversizedBufferedFrames(): number {
    return this.#frames.filter(frame => this.#oversized(frame)).length + (this.#pendingFrame && this.#oversized(this.#pendingFrame) ? 1 : 0);
  }

  #resumeReader(force = false): void {
    if (!this.#readerWaiter ||
      (!force && (this.#frames.length > RESIDENT_PROTOCOL_QUEUE_LOW_WATER ||
        this.#pendingFrame && this.#oversized(this.#pendingFrame) && this.#frames.some(frame => this.#oversized(frame))))) return;
    const waiter = this.#readerWaiter;
    this.#readerWaiter = undefined;
    waiter.resolve();
  }

  #rejectReader(error: Error): void {
    if (!this.#readerWaiter) return;
    const waiter = this.#readerWaiter;
    this.#readerWaiter = undefined;
    waiter.reject(error);
  }

  #waitForFrame(timeoutMs: number): Promise<boolean> {
    if (this.#failure) return Promise.reject(this.#failure);
    if (this.#frames.length > 0) return Promise.resolve(true);
    if (this.#frameWaiter) {
      return Promise.reject(driverError("Resident protocol already has a frame waiter"));
    }
    return new Promise<boolean>((resolve, reject) => {
      const timer = setTimeout(() => {
        if (this.#frameWaiter?.timer !== timer) return;
        this.#frameWaiter = undefined;
        resolve(false);
      }, Math.max(1, timeoutMs));
      timer.unref();
      this.#frameWaiter = { resolve, reject, timer };
    });
  }

  #signalFrame(): void {
    const waiter = this.#frameWaiter;
    if (!waiter) return;
    this.#frameWaiter = undefined;
    clearTimeout(waiter.timer);
    waiter.resolve(true);
  }

  #rejectFrameWaiter(error: Error): void {
    const waiter = this.#frameWaiter;
    if (!waiter) return;
    this.#frameWaiter = undefined;
    clearTimeout(waiter.timer);
    waiter.reject(error);
  }

  #fatal(error: Error): void {
    if (this.#failure) return;
    this.#failure = error;
    for (const waiter of this.#waiters.splice(0)) {
      waiter.reject(error);
    }
    this.#rejectReader(error);
    this.#rejectFrameWaiter(error);
    signalProcessTree(this.#child, "SIGKILL");
  }
}

function codexResidentObservation(
  frame: Readonly<Record<string, unknown>>
): ResidentProtocolObservation | undefined {
  const method = typeof frame.method === "string" ? frame.method : "";
  const params = maybeRecord(frame.params);
  if (method === "thread/tokenUsage/updated") {
    const tokenUsage = maybeRecord(params?.tokenUsage);
    return residentObservation([], residentKnownUsage(tokenUsage?.total ?? tokenUsage?.last));
  }
  if (method === "turn/completed") {
    const turn = maybeRecord(params?.turn);
    return residentObservation(
      [{ kind: "model", phase: "completed" }],
      residentKnownUsage(turn?.usage ?? params?.usage)
    );
  }
  if (method === "turn/started" || method === "turn/heartbeat") {
    return residentObservation([{ kind: "heartbeat" }]);
  }
  if (method.includes("agentMessage") && method.endsWith("/delta")) {
    return residentObservation([{ kind: "model", phase: "delta" }]);
  }
  if (method !== "item/started" && method !== "item/updated" &&
    method !== "item/completed") return undefined;
  const item = maybeRecord(params?.item);
  const itemType = activityString(item?.type);
  if (!item) return undefined;
  if (itemType === "reasoning") return residentObservation([{ kind: "heartbeat" }]);
  if (itemType === "agentMessage" || itemType === "agent_message") {
    return residentObservation([{
      kind: "model",
      phase: method === "item/completed" ? "completed" : "delta"
    }]);
  }
  const callId = activityString(item.id);
  if (!callId) return undefined;
  const failed = item.status === "failed" || item.is_error === true ||
    (typeof item.exit_code === "number" && item.exit_code !== 0);
  const phase = method === "item/started"
    ? "started"
    : method === "item/updated"
      ? "updated"
      : failed ? "failed" : "completed";
  const name = activityString(item.name) ?? activityString(item.tool_name) ??
    activityString(item.tool) ?? itemType;
  return residentObservation([{
    kind: "tool",
    phase,
    callId,
    ...(name ? { name } : {})
  }]);
}

function claudeResidentObservation(
  frame: Readonly<Record<string, unknown>>
): ResidentProtocolObservation | undefined {
  const type = activityString(frame.type);
  if (type === "tool_progress") {
    const callId = claudeProgressCallId(frame);
    const name = activityString(frame.tool_name);
    return callId && name ? residentObservation([{ kind: "tool", phase: "updated", callId, name }]) : undefined;
  }
  if (type === "assistant") {
    const message = maybeRecord(frame.message);
    const activities: ResidentActivitySignal[] = [];
    for (const value of Array.isArray(message?.content) ? message.content : []) {
      const block = maybeRecord(value);
      if (block?.type === "tool_use") {
        const callId = activityString(block.id);
        if (callId) activities.push({
          kind: "tool",
          phase: "started",
          callId,
          ...(activityString(block.name) ? { name: activityString(block.name)! } : {})
        });
      } else if (block?.type === "text") {
        activities.push({ kind: "model", phase: "completed" });
      } else if (block?.type === "thinking" || block?.type === "redacted_thinking") {
        activities.push({ kind: "heartbeat" });
      }
    }
    return residentObservation(activities, residentKnownUsage(message?.usage));
  }
  if (type === "user") {
    const message = maybeRecord(frame.message);
    const activities: ResidentActivitySignal[] = [];
    for (const value of Array.isArray(message?.content) ? message.content : []) {
      const block = maybeRecord(value);
      if (block?.type !== "tool_result") continue;
      const callId = activityString(block.tool_use_id);
      if (!callId) continue;
      activities.push({
        kind: "tool",
        phase: block.is_error === true ? "failed" : "completed",
        callId,
        ...(activityString(block.name) ? { name: activityString(block.name)! } : {})
      });
    }
    return residentObservation(activities);
  }
  if (type === "stream_event") {
    const event = maybeRecord(frame.event);
    const eventType = activityString(event?.type);
    const delta = maybeRecord(event?.delta);
    const block = maybeRecord(event?.content_block);
    if (eventType === "content_block_start" && block?.type === "tool_use") {
      const callId = activityString(block.id);
      if (callId) return residentObservation([{
        kind: "tool",
        phase: "started",
        callId,
        ...(activityString(block.name) ? { name: activityString(block.name)! } : {})
      }]);
    }
    if (delta?.type === "text_delta") {
      return residentObservation([{ kind: "model", phase: "delta" }]);
    }
    if (delta?.type === "thinking_delta" || delta?.type === "signature_delta" ||
      delta?.type === "input_json_delta" || eventType === "content_block_stop" ||
      eventType === "message_start") {
      return residentObservation([{ kind: "heartbeat" }]);
    }
    if (eventType === "message_delta" || eventType === "message_stop") {
      return residentObservation([{ kind: "model", phase: "completed" }]);
    }
    return undefined;
  }
  if (type === "result") {
    return residentObservation(
      [{ kind: "model", phase: "completed" }],
      residentKnownUsage(frame.usage)
    );
  }
  if (type === "system" && ["turn_start", "heartbeat", "keepalive", "keep_alive"]
    .includes(activityString(frame.subtype) ?? "")) {
    return residentObservation([{ kind: "heartbeat" }]);
  }
  return undefined;
}

function piResidentObservation(
  frame: Readonly<Record<string, unknown>>
): ResidentProtocolObservation | undefined {
  const type = activityString(frame.type);
  if (type === "tool_execution_start" || type === "tool_execution_update" ||
    type === "tool_execution_end") {
    const callId = activityString(frame.toolCallId);
    if (!callId) return undefined;
    return residentObservation([{
      kind: "tool",
      phase: type === "tool_execution_start"
        ? "started"
        : type === "tool_execution_update"
          ? "updated"
          : frame.isError === true ? "failed" : "completed",
      callId,
      ...(activityString(frame.toolName) ? { name: activityString(frame.toolName)! } : {})
    }]);
  }
  if (type === "message_update") {
    const update = maybeRecord(frame.assistantMessageEvent);
    return update?.type === "text_delta"
      ? residentObservation([{ kind: "model", phase: "delta" }])
      : activityString(update?.type)?.includes("thinking")
        ? residentObservation([{ kind: "heartbeat" }])
        : undefined;
  }
  if (type === "message_end") {
    const message = maybeRecord(frame.message);
    if (message?.role !== "assistant") return undefined;
    return residentObservation(
      [{ kind: "model", phase: "completed" }],
      residentKnownUsage(message.usage)
    );
  }
  if (type === "agent_end" || type === "turn_end") {
    return residentObservation([{ kind: "model", phase: "completed" }]);
  }
  if (type === "agent_start" || type === "turn_start" || type === "auto_retry_start" ||
    type === "compaction_start" || type === "heartbeat") {
    return residentObservation([{ kind: "heartbeat" }]);
  }
  return undefined;
}

function dshResidentObservationMapper(): ResidentProtocolCodec["observe"] {
  const activeTools = new Map<string, string | undefined>();
  return (frame) => {
    const params = maybeRecord(frame.params);
    if (frame.method === "session.status") {
      if (params?.status === "running") return residentObservation([{ kind: "heartbeat" }]);
      if (params?.status === "idle") {
        activeTools.clear();
        return residentObservation([{ kind: "model", phase: "completed" }]);
      }
      return undefined;
    }
    if (frame.method !== "session.event") return undefined;
    const event = maybeRecord(params?.event);
    const data = maybeRecord(event?.data);
    const type = activityString(event?.type);
    if (!type) return undefined;
    if (maybeRecord(event?.surfaceOp)?.op === "replace") {
      return residentObservation([{ kind: "heartbeat" }]);
    }
    if (type === "assistant/chunk") {
      const chunk = maybeRecord(data?.chunk);
      const chunkType = activityString(chunk?.type);
      if (chunkType === "text-delta" || chunkType === "text_delta") {
        return residentObservation([{ kind: "model", phase: "delta" }]);
      }
      if ([
        "reasoning-delta",
        "tool-call-delta",
        "block-start",
        "block-end",
        "usage",
        "finish"
      ].includes(chunkType ?? "")) {
        return residentObservation(
          [{ kind: "heartbeat" }],
          chunkType === "usage" ? residentKnownUsage(chunk?.usage) : undefined
        );
      }
      return undefined;
    }
    if (type === "assistant/message") {
      return residentObservation(
        [{ kind: "model", phase: "completed" }],
        residentKnownUsage(data?.usage)
      );
    }
    if (type === "tool/call" || type === "tool/update" || type === "tool/result") {
      const message = maybeRecord(data?.message);
      const source = maybeRecord(message?.source);
      const resultBlock = (Array.isArray(message?.content) ? message.content : [])
        .map((value) => maybeRecord(value))
        .find((value) => value?.type === "tool-result");
      const candidates = dshToolCallIdCandidates(data, source, resultBlock, message);
      const callId = candidates.find((candidate) => activeTools.has(candidate)) ?? candidates[0];
      if (!callId) return undefined;
      const name = activityString(data?.name) ?? activityString(message?.toolName) ??
        activeTools.get(callId);
      const failed = Boolean(data?.error) || resultBlock?.isError === true ||
        message?.isError === true;
      const phase = type === "tool/call"
        ? "started"
        : type === "tool/update"
          ? "updated"
          : failed ? "failed" : "completed";
      if (phase === "started") activeTools.set(callId, name);
      if (phase === "completed" || phase === "failed") activeTools.delete(callId);
      return residentObservation([{
        kind: "tool",
        phase,
        callId,
        ...(name ? { name } : {})
      }]);
    }
    if (type === "turn/start") activeTools.clear();
    if (["turn/start", "turn/end", "step/start", "step/end", "heartbeat"]
      .includes(type)) {
      return residentObservation([{ kind: "heartbeat" }]);
    }
    return undefined;
  };
}

function dshToolCallIdCandidates(
  data: Readonly<Record<string, unknown>> | undefined,
  source: Readonly<Record<string, unknown>> | undefined,
  resultBlock: Readonly<Record<string, unknown>> | undefined,
  message: Readonly<Record<string, unknown>> | undefined
): string[] {
  const values = [
    activityString(source?.callId),
    activityString(resultBlock?.toolCallId),
    activityString(message?.toolCallId),
    activityString(data?.callId)
  ];
  return values.filter((callId, index): callId is string =>
    Boolean(callId) && values.indexOf(callId) === index
  );
}

function residentObservation(
  activities: readonly ResidentActivitySignal[],
  usage?: ResidentKnownUsage
): ResidentProtocolObservation | undefined {
  return activities.length > 0 || usage
    ? { ...(activities.length > 0 ? { activities } : {}), ...(usage ? { usage } : {}) }
    : undefined;
}

function residentKnownUsage(value: unknown): ResidentKnownUsage | undefined {
  const usage = maybeRecord(value);
  if (!usage) return undefined;
  const inputTokens = usageInteger(usage.inputTokens ?? usage.input_tokens);
  const cachedInputTokens = usageInteger(
    usage.cachedInputTokens ?? usage.cached_input_tokens ?? usage.cache_read_input_tokens
  );
  const outputTokens = usageInteger(usage.outputTokens ?? usage.output_tokens);
  const totalTokens = usageInteger(usage.totalTokens ?? usage.total_tokens);
  if (inputTokens === undefined && cachedInputTokens === undefined &&
    outputTokens === undefined && totalTokens === undefined) return undefined;
  return {
    ...(inputTokens !== undefined ? { inputTokens } : {}),
    ...(cachedInputTokens !== undefined ? { cachedInputTokens } : {}),
    ...(outputTokens !== undefined ? { outputTokens } : {}),
    ...(totalTokens !== undefined ? { totalTokens } : {})
  };
}

function usageInteger(value: unknown): number | undefined {
  return Number.isSafeInteger(value) && (value as number) >= 0 ? value as number : undefined;
}

function activityString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 && value.length <= 100_000 &&
    !value.includes("\0") ? value : undefined;
}

export function codexAppServerCodec(options: {
  cwd: string;
  model: string;
  modelProvider?: string;
  sandbox: "read-only" | "workspace-write" | "danger-full-access";
}): ResidentProtocolCodec {
  let threadId = "";
  let completedTurnId = "";
  return {
    protocol: "codex-app-server",
    recoveryStrategy: "native-session-resume",
    observe: codexResidentObservation,
    completionTail: {
      isComplete: () => completedTurnId.length > 0,
      accept: (frame, session) => session.nativeId === threadId &&
        codexCompletionTailNotification(frame, threadId, completedTurnId)
    },
    settleIdle: (connection) => connection.consumeInitializationNotifications(
      (frame) => codexIdleNotification(frame, threadId),
      "Codex initialization"
    ),
    async initialize(connection, session) {
      const initializeId = connection.requestId();
      await connection.send({
        id: initializeId,
        method: "initialize",
        params: {
          clientInfo: { name: "openfars", title: "OpenFARS", version: "2.0" },
          capabilities: null
        }
      });
      await jsonRpcResult(connection, initializeId, "Codex initialize");
      await connection.send({ method: "initialized", params: {} });
      const requestId = connection.requestId();
      const resume = session.resumedAt && !session.nativeId.startsWith("pending:");
      await connection.send({
        id: requestId,
        method: resume ? "thread/resume" : "thread/start",
        params: resume
          ? {
              threadId: session.nativeId,
              // We need the original native thread, not its entire history in a
              // single reply. This projection preserves Agent memory and avoids
              // breaking long-lived sessions against the protocol frame limit.
              excludeTurns: true,
              cwd: options.cwd,
              model: options.model,
              ...(options.modelProvider ? { modelProvider: options.modelProvider } : {}),
              sandbox: options.sandbox,
              approvalPolicy: "never"
            }
          : {
              cwd: options.cwd,
              model: options.model,
              ...(options.modelProvider ? { modelProvider: options.modelProvider } : {}),
              sandbox: options.sandbox,
              approvalPolicy: "never",
              ephemeral: false
            }
      });
      const response = await jsonRpcResult(connection, requestId, "Codex thread open");
      const result = recordField(response, "result");
      const thread = recordField(result, "thread");
      threadId = stringField(thread, "id", "Codex thread identity");
      if (resume && threadId !== session.nativeId) {
        throw driverError("Codex resumed a different native thread identity");
      }
      return { ...session, nativeId: threadId };
    },
    async submit(connection, session, turn) {
      if (session.nativeId !== threadId) throw driverError("Codex driver SessionRef changed");
      completedTurnId = "";
      const requestId = connection.requestId();
      connection.expectInputEcho?.(session, turn.prompt);
      await connection.send({
        id: requestId,
        method: "turn/start",
        params: {
          threadId,
          clientUserMessageId: turn.inputId,
          input: [{ type: "text", text: turn.prompt, text_elements: [] }]
        }
      });
      const response = await jsonRpcResult(connection, requestId, "Codex turn start");
      const turnId = stringField(recordField(recordField(response, "result"), "turn"), "id", "Codex turn identity");
      await connection.notify(response, turn);
      let completed: Record<string, unknown>;
      for (;;) {
        const frame = await connection.next(() => true, "Codex turn event");
        // MCP/config startup can complete after the thread-open response. These
        // exact notifications remain non-business protocol metadata even when
        // they race with turn one, so consume them without turn attribution.
        if (codexGoalUpdatedNotification(frame, threadId, turnId)) { await connection.notify(frame, turn); continue; }
        if (codexBackgroundNotification(frame, threadId)) continue;
        if (codexTurnMetadataNotification(frame, threadId, turnId)) {
          await connection.notify(frame, turn);
          continue;
        }
        // Official app-server error notifications precede either a native
        // retry or turn/completed. Keep both under this exact turn authority.
        if (frame.method === "error") {
          const params = maybeRecord(frame.params);
          const error = maybeRecord(params?.error);
          if (frame.id !== undefined || params?.threadId !== threadId || params.turnId !== turnId ||
            typeof params.willRetry !== "boolean" || !boundedProtocolString(error?.message) ||
            !optionalBoundedProtocolString(error?.additionalDetails)) {
            throw driverError("Codex emitted an invalid or out-of-turn error notification");
          }
          await connection.notify(frame, turn);
          continue;
        }
        if (frame.id !== undefined || typeof frame.method !== "string" ||
          (!frame.method.startsWith("turn/") && !frame.method.startsWith("item/"))) {
          throw driverError(
            `Codex emitted an unknown or out-of-turn frame (${protocolFrameShape(frame)})`
          );
        }
        const params = recordField(frame, "params");
        if (params.threadId !== threadId) {
          throw driverError("Codex emitted a different native thread identity");
        }
        const frameTurn = maybeRecord(params.turn);
        const frameTurnId = typeof params.turnId === "string"
          ? params.turnId
          : typeof frameTurn?.id === "string" ? frameTurn.id : undefined;
        if (frameTurnId !== undefined && frameTurnId !== turnId) {
          throw driverError("Codex emitted an event for a different native turn");
        }
        await connection.notify(frame, turn);
        if (frame.method !== "turn/completed") continue;
        if (frameTurnId !== turnId) {
          throw driverError("Codex turn completion omitted its native turn identity");
        }
        completed = frame;
        break;
      }
      const nativeTurn = recordField(recordField(completed, "params"), "turn");
      if (nativeTurn.status !== "completed") {
        const error = maybeRecord(nativeTurn.error);
        const detail = typeof error?.message === "string" ? redactTrace(error.message).slice(0, 1_000) : "";
        if (nativeTurn.status !== "failed") throw driverError("Codex turn did not reach a completed or failed terminal state");
        completedTurnId = turnId;
        throw new NativeTurnFailedError(`Codex resident turn did not complete successfully${detail ? `: ${detail}` : ""}`);
      }
      completedTurnId = turnId;
      return { handoff: extractAssistantText(nativeTurn) || "Codex turn completed.", threadId };
    },
    async close(connection) {
      if (!threadId) return;
      const requestId = connection.requestId();
      await connection.send({ id: requestId, method: "thread/unsubscribe", params: { threadId } });
      await jsonRpcResult(connection, requestId, "Codex thread unsubscribe");
    }
  };
}

const CODEX_INITIALIZATION_NOTIFICATIONS = new Set([
  "account/updated",
  "account/rateLimits/updated",
  "configWarning",
  "deprecationNotice",
  "mcpServer/startupStatus/updated",
  "remoteControl/status/changed",
  "skills/changed",
  "thread/started",
  "thread/goal/cleared",
  "thread/goal/updated",
  "thread/status/changed",
  "warning"
]);

/** A larger frame is permitted only for the verbatim, just-sent native user
 * input. All remaining metadata stays bounded and every other frame retains
 * the ordinary limit, including assistant/tool output and stale input. */
function isExactNativeInputEcho(protocol: ResidentProtocol, frame: Record<string, unknown>, session: SessionRef, text: string): boolean {
  const strip = (content: unknown): unknown => {
    if (content === text) return "";
    if (!Array.isArray(content) || !content.length) return undefined;
    const blocks = content.map(maybeRecord);
    if (blocks.some(block => !block || !["text", "output_text"].includes(String(block.type)) || typeof block.text !== "string") ||
      blocks.map(block => block!.text).filter(Boolean).join("\n") !== text) return undefined;
    return blocks.map(block => ({ ...block, text: "" }));
  };
  let metadata: unknown;
  if (protocol === "codex-app-server") {
    const params = maybeRecord(frame.params), item = maybeRecord(params?.item);
    if (frame.method !== "item/completed" || params?.threadId !== session.nativeId ||
      typeof params?.turnId !== "string" || !item || !["userMessage", "user_message"].includes(String(item.type))) return false;
    const content = strip(item.content); if (content === undefined) return false;
    metadata = { ...frame, params: { ...params, item: { ...item, content } } };
  } else if (protocol === "claude-stream-json" || protocol === "pi-rpc") {
    const message = maybeRecord(frame.message);
    if (!message || message.role !== "user" || (protocol === "claude-stream-json"
      ? frame.type !== "user" || frame.session_id !== session.nativeId : frame.type !== "message_end")) return false;
    const content = strip(message.content); if (content === undefined) return false;
    metadata = { ...frame, message: { ...message, content } };
  } else {
    const params = maybeRecord(frame.params), event = maybeRecord(params?.event), data = maybeRecord(event?.data);
    if (frame.method !== "session.event" || params?.sessionId !== session.nativeId || event?.type !== "user/message" ||
      event.surfaceOp !== "append" || maybeRecord(data?.source)?.kind !== "user" || !data) return false;
    const content = strip(data.content); if (content === undefined) return false;
    metadata = { ...frame, params: { ...params, event: { ...event, data: { ...data, content } } } };
  }
  return Buffer.byteLength(JSON.stringify(metadata), "utf8") <= RESIDENT_INPUT_ECHO_METADATA_BYTES;
}

function codexIdleNotification(
  frame: Readonly<Record<string, unknown>>,
  threadId: string
): boolean {
  return codexBackgroundNotification(frame, threadId) ||
    codexThreadTokenUsageNotification(frame, threadId);
}

function codexGoalUpdatedNotification(frame: Readonly<Record<string, unknown>>, threadId: string, turnId?: string): boolean {
  if (frame.id !== undefined || frame.method !== "thread/goal/updated" || !isRecord(frame.params) || frame.params.threadId !== threadId) return false;
  const params = frame.params, goal = maybeRecord(params.goal);
  if (params.turnId !== undefined && params.turnId !== null && params.turnId !== turnId) return false;
  return !!goal && goal.threadId === threadId && typeof goal.objective === "string" &&
    ["active", "paused", "blocked", "usageLimited", "budgetLimited", "complete"].includes(String(goal.status)) &&
    ["createdAt", "updatedAt", "timeUsedSeconds", "tokensUsed"].every(key => nonnegativeSafeInteger(goal[key])) &&
    (goal.tokenBudget === undefined || goal.tokenBudget === null || nonnegativeSafeInteger(goal.tokenBudget));
}

function codexBackgroundNotification(
  frame: Readonly<Record<string, unknown>>,
  threadId: string
): boolean {
  if (frame.id !== undefined || typeof frame.method !== "string" ||
    !CODEX_INITIALIZATION_NOTIFICATIONS.has(frame.method) ||
    !isRecord(frame.params)) return false;
  if (frame.method === "warning") {
    return (frame.params.threadId === null || frame.params.threadId === threadId) &&
      boundedProtocolString(frame.params.message);
  }
  if (frame.method === "thread/status/changed") {
    return frame.params.threadId === threadId && codexThreadStatus(frame.params.status);
  }
  if (frame.method === "thread/goal/updated") return codexGoalUpdatedNotification(frame, threadId);
  if (frame.method === "thread/goal/cleared") {
    return frame.params.threadId === threadId;
  }
  if (frame.method === "account/rateLimits/updated") {
    return isRecord(frame.params.rateLimits);
  }
  if (frame.method === "account/updated") {
    return ["authMode", "planType"].every((key) => Object.hasOwn(frame.params as object, key)) &&
      Object.keys(frame.params).every((key) => key === "authMode" || key === "planType") &&
      (frame.params.authMode === null || ["apiKey", "chatgpt", "chatgptAuthTokens"].includes(String(frame.params.authMode))) &&
      (frame.params.planType === null || boundedProtocolString(frame.params.planType));
  }
  // Codex watches its skills directory even with automatic skill discovery
  // disabled. This empty invalidation notification carries no turn/tool data.
  if (frame.method === "skills/changed") {
    return Object.keys(frame.params).length === 0;
  }
  if (frame.method === "deprecationNotice") {
    return boundedProtocolString(frame.params.summary) &&
      optionalBoundedProtocolString(frame.params.details);
  }
  if (frame.method === "configWarning") {
    return boundedProtocolString(frame.params.summary) &&
      optionalBoundedProtocolString(frame.params.details) &&
      optionalBoundedProtocolString(frame.params.path) &&
      codexOptionalTextRange(frame.params.range);
  }
  if (frame.method === "mcpServer/startupStatus/updated") {
    return (frame.params.threadId === undefined || frame.params.threadId === null ||
        frame.params.threadId === threadId) &&
      boundedProtocolString(frame.params.name) &&
      ["starting", "ready", "failed", "cancelled"].includes(String(frame.params.status)) &&
      optionalBoundedProtocolString(frame.params.error) &&
      (frame.params.failureReason === undefined || frame.params.failureReason === null ||
        frame.params.failureReason === "reauthenticationRequired");
  }
  if (frame.method === "remoteControl/status/changed") {
    return ["disabled", "connecting", "connected", "errored"].includes(
      String(frame.params.status)
    ) && boundedProtocolString(frame.params.serverName) &&
      boundedProtocolString(frame.params.installationId) &&
      optionalBoundedProtocolString(frame.params.environmentId);
  }
  if (frame.method !== "thread/started") return true;
  const thread = maybeRecord(frame.params.thread);
  const reportedThreadId = typeof frame.params.threadId === "string"
    ? frame.params.threadId
    : typeof thread?.id === "string"
      ? thread.id
      : undefined;
  return reportedThreadId === threadId;
}

function codexTurnMetadataNotification(
  frame: Readonly<Record<string, unknown>>,
  threadId: string,
  turnId: string
): boolean {
  return codexThreadTokenUsageNotification(frame, threadId) &&
    (frame.params as Record<string, unknown>).turnId === turnId;
}

function codexCompletionTailNotification(
  frame: Readonly<Record<string, unknown>>,
  threadId: string,
  turnId: string
): boolean {
  if (!threadId || !turnId || frame.id !== undefined || !isRecord(frame.params)) return false;
  if (codexTurnMetadataNotification(frame, threadId, turnId)) return true;
  if (frame.method === "thread/status/changed") {
    return frame.params.threadId === threadId &&
      maybeRecord(frame.params.status)?.type === "idle";
  }
  if (frame.method === "warning") {
    return frame.params.threadId === threadId && boundedProtocolString(frame.params.message);
  }
  return frame.method === "thread/goal/cleared" && frame.params.threadId === threadId;
}

function codexThreadTokenUsageNotification(
  frame: Readonly<Record<string, unknown>>,
  threadId: string
): boolean {
  if (frame.id !== undefined || frame.method !== "thread/tokenUsage/updated" ||
    !isRecord(frame.params) || frame.params.threadId !== threadId ||
    !boundedProtocolString(frame.params.turnId) || !isRecord(frame.params.tokenUsage)) return false;
  const usage = frame.params.tokenUsage;
  return codexTokenUsageBreakdown(usage.total) && codexTokenUsageBreakdown(usage.last) &&
    (usage.modelContextWindow === undefined || usage.modelContextWindow === null ||
      nonnegativeSafeInteger(usage.modelContextWindow));
}

function codexTokenUsageBreakdown(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return [
    "totalTokens",
    "inputTokens",
    "cachedInputTokens",
    "outputTokens",
    "reasoningOutputTokens"
  ].every((field) => nonnegativeSafeInteger(value[field])) &&
    (value.cacheWriteInputTokens === undefined || nonnegativeSafeInteger(value.cacheWriteInputTokens));
}

function codexThreadStatus(value: unknown): boolean {
  if (!isRecord(value) || !["notLoaded", "idle", "systemError", "active"].includes(String(value.type))) {
    return false;
  }
  if (value.type !== "active") return true;
  return Array.isArray(value.activeFlags) && value.activeFlags.every((flag) =>
    flag === "waitingOnApproval" || flag === "waitingOnUserInput");
}

function codexOptionalTextRange(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (!isRecord(value) || !isRecord(value.start) || !isRecord(value.end)) return false;
  return positiveSafeInteger(value.start.line) && positiveSafeInteger(value.start.column) &&
    positiveSafeInteger(value.end.line) && positiveSafeInteger(value.end.column);
}

function boundedProtocolString(value: unknown): value is string {
  return typeof value === "string" && value.length <= 100_000 && !value.includes("\0");
}

function optionalBoundedProtocolString(value: unknown): boolean {
  return value === undefined || value === null || boundedProtocolString(value);
}

function nonnegativeSafeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}

function positiveSafeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) > 0;
}

export function claudeStreamJsonCodec(): ResidentProtocolCodec {
  let turnComplete = false;
  return {
    protocol: "claude-stream-json",
    recoveryStrategy: "native-session-resume",
    observe: claudeResidentObservation,
    completionTail: {
      isComplete: () => turnComplete,
      accept: () => false
    },
    async initialize(_connection, session) { return session; },
    async submit(connection, session, turn) {
      turnComplete = false;
      connection.expectInputEcho?.(session, turn.prompt);
      await connection.send({
        type: "user",
        session_id: session.nativeId,
        message: {
          role: "user",
          content: [{ type: "text", text: turn.prompt }]
        }
      });
      let handoff = "";
      const activeTools = new Map<string, string>();
      for (;;) {
        const frame = await connection.next(() => true, "Claude stream event");
        if (typeof frame.type !== "string" || !CLAUDE_TURN_FRAME_TYPES.has(frame.type)) {
          throw driverError(`Claude emitted an unknown or out-of-turn frame (${protocolFrameShape(frame)})`);
        }
        if (frame.session_id !== session.nativeId) {
          throw driverError("Claude stream emitted a different native session identity");
        }
        if (frame.type === "tool_progress") {
          const callId = claudeProgressCallId(frame);
          if (!callId || typeof frame.tool_name !== "string" || activeTools.get(callId) !== frame.tool_name ||
            typeof frame.elapsed_time_seconds !== "number" || !Number.isFinite(frame.elapsed_time_seconds) ||
            frame.elapsed_time_seconds < 0) {
            throw driverError("Claude tool progress does not match an active call in the current turn");
          }
        } else {
          trackClaudeToolCalls(frame, activeTools);
        }
        await connection.notify(frame, turn);
        if (frame.type === "assistant") handoff = extractAssistantText(frame) || handoff;
        if (frame.type !== "result") continue;
        if (frame.is_error === true) {
          turnComplete = true;
          throw new NativeTurnFailedError("Claude resident turn returned an error result");
        }
        if (typeof frame.result === "string" && frame.result.trim()) handoff = frame.result;
        turnComplete = true;
        return { handoff: handoff || "Claude turn completed.", threadId: session.nativeId };
      }
    },
    async close() { /* EOF terminates stream-json mode. */ }
  };
}

const CLAUDE_TURN_FRAME_TYPES = new Set([
  "system",
  "stream_event",
  "assistant",
  "user",
  "tool_progress",
  "result"
]);

function trackClaudeToolCalls(frame: Readonly<Record<string, unknown>>, active: Map<string, string>): void {
  const message = maybeRecord(frame.message);
  const event = maybeRecord(frame.event);
  const blocks = frame.type === "stream_event" && event?.type === "content_block_start"
    ? [event.content_block]
    : frame.type === "assistant" || frame.type === "user"
      ? Array.isArray(message?.content) ? message.content : []
      : [];
  for (const value of blocks) {
    const block = maybeRecord(value);
    if (block?.type === "tool_use" && frame.type !== "user") {
      const id = activityString(block.id), name = activityString(block.name);
      if (id && name) active.set(id, name);
    } else if (frame.type === "user" && block?.type === "tool_result" && typeof block.tool_use_id === "string") {
      active.delete(block.tool_use_id);
    }
  }
}

export function piRpcCodec(options: {
  expectedSessionId?: string;
  expectedSessionPath?: string;
} = {}): ResidentProtocolCodec {
  let officialSessionId = "";
  let turnComplete = false;
  return {
    protocol: "pi-rpc",
    recoveryStrategy: "native-session-resume",
    observe: piResidentObservation,
    completionTail: {
      isComplete: () => turnComplete,
      // A completed Pi request has no remaining retry activity. New activity,
      // including another agent_end, must never be attributed to the next turn.
      accept: () => false
    },
    async initialize(connection, session) {
      const id = `state-${connection.requestId()}`;
      await connection.send({ id, type: "get_state" });
      const frame = await connection.next((candidate) =>
        candidate.type === "response" && candidate.command === "get_state" && candidate.id === id,
      "Pi initial state");
      const data = recordField(frame, "data");
      if (data.isStreaming !== false) throw driverError("Pi RPC opened while already streaming");
      officialSessionId = stringField(data, "sessionId", "Pi session identity");
      if (options.expectedSessionId && officialSessionId !== options.expectedSessionId) {
        throw driverError("Pi RPC resumed a different native session identity");
      }
      if (options.expectedSessionPath) {
        const sessionFile = stringField(data, "sessionFile", "Pi session file identity");
        if (session.nativeId !== options.expectedSessionPath ||
          sessionFile !== options.expectedSessionPath) {
          throw driverError("Pi RPC opened a different durable session file");
        }
      } else if (!options.expectedSessionId && officialSessionId !== session.nativeId) {
        // Low-level callers without a durable path still bind SessionRef to
        // the official Pi ID rather than accepting any process state.
        throw driverError("Pi RPC resumed a different native session identity");
      }
      return session;
    },
    async submit(connection, session, turn) {
      turnComplete = false;
      const id = `prompt-${connection.requestId()}`;
      connection.expectInputEcho?.(session, turn.prompt);
      await connection.send({ id, type: "prompt", message: turn.prompt });
      const receipt = await connection.next((candidate) =>
        candidate.type === "response" && candidate.command === "prompt" && candidate.id === id,
      "Pi prompt receipt");
      if (receipt.success !== true) throw driverError("Pi RPC rejected the prompt");
      assertPiSession(receipt, officialSessionId);
      await connection.notify(receipt, turn);
      let completion: Record<string, unknown> | undefined;
      let completionSequence = 0;
      let pendingResult: { id: string; sequence: number } | undefined;
      let retryAttempt = 0;
      let finalRetryError: string | undefined;
      let compacting = false;
      const requestResult = async () => {
        if (!completion || compacting || pendingResult) return;
        pendingResult = { id: `result-${connection.requestId()}`, sequence: completionSequence };
        await connection.send({ id: pendingResult.id, type: "get_last_assistant_text" });
      };
      for (;;) {
        const frame = await connection.next(() => true, "Pi turn event");
        assertPiSession(frame, officialSessionId);
        if (frame.type === "response") {
          if (!pendingResult || frame.id !== pendingResult.id ||
            frame.command !== "get_last_assistant_text" || frame.success !== true) {
            throw driverError("Pi emitted an invalid or out-of-turn result response");
          }
          const sequence = pendingResult.sequence;
          pendingResult = undefined;
          const data = recordField(frame, "data");
          assertPiSession(data, officialSessionId);
          await connection.notify(frame, turn);
          if (!completion || compacting || sequence !== completionSequence) {
            await requestResult();
            continue;
          }
          const assistant = piLastAssistant(completion);
          if (finalRetryError) {
            turnComplete = true;
            throw new NativeTurnFailedError(finalRetryError);
          }
          if (assistant?.stopReason === "error" || assistant?.stopReason === "aborted") {
            if (retryAttempt) throw driverError("Pi retry completed without auto_retry_end evidence");
            turnComplete = true;
            throw new NativeTurnFailedError(`Pi turn ended with ${assistant.stopReason}: ${
              redactTrace(activityString(assistant.errorMessage) ?? "no successful assistant result")
            }`);
          }
          if (retryAttempt) throw driverError("Pi retry completed without auto_retry_end evidence");
          turnComplete = true;
          return {
            handoff: typeof data.text === "string" && data.text.trim()
              ? data.text : extractAssistantText(assistant) || "Pi turn completed.",
            threadId: session.nativeId
          };
        }
        if (typeof frame.type !== "string" || !PI_TURN_FRAME_TYPES.has(frame.type)) {
          throw driverError("Pi emitted an unknown or out-of-turn frame");
        }
        if (frame.type === "auto_retry_start") {
          if (!completion || piLastAssistant(completion)?.stopReason !== "error" ||
            frame.attempt !== retryAttempt + 1 || !positiveSafeInteger(frame.maxAttempts) ||
            (frame.attempt as number) > (frame.maxAttempts as number) ||
            !nonnegativeSafeInteger(frame.delayMs) || !activityString(frame.errorMessage)) {
            throw driverError("Pi emitted invalid automatic retry evidence");
          }
          retryAttempt = frame.attempt as number;
          completion = undefined;
        } else if (frame.type === "auto_retry_end") {
          if (!retryAttempt || frame.attempt !== retryAttempt || typeof frame.success !== "boolean") {
            throw driverError("Pi emitted mismatched automatic retry completion");
          }
          await connection.notify(frame, turn);
          if (!frame.success) {
            const message = `Pi automatic retry failed: ${redactTrace(activityString(frame.finalError) ?? "no final error supplied")}`;
            if (!completion) throw driverError(message);
            // The final agent_end and the outstanding read acknowledgement
            // together prove the native request is idle. Drain that read
            // before handing a retryable failure to the shared recovery loop.
            finalRetryError = message;
            retryAttempt = 0;
            await requestResult();
            continue;
          }
          // Pi emits this after the first successful message (possibly a tool
          // call), before the final agent_end. Keep waiting under this lease.
          retryAttempt = 0;
          continue;
        } else if (frame.type === "compaction_start") {
          if (compacting) throw driverError("Pi emitted overlapping compaction starts");
          compacting = true;
        } else if (frame.type === "compaction_end") {
          // Pi reports a repeated context overflow without starting another
          // compaction. Preserve that native failure rather than accepting it
          // as successful completion or calling it an unmatched end marker.
          if (!compacting && completion && frame.reason === "overflow" &&
            frame.willRetry === false && activityString(frame.errorMessage) &&
            piLastAssistant(completion)?.stopReason === "error") {
            throw driverError(`Pi compaction failed: ${redactTrace(String(frame.errorMessage))}`);
          }
          if (!compacting || typeof frame.willRetry !== "boolean") {
            throw driverError("Pi emitted invalid compaction completion");
          }
          compacting = false;
          if (frame.willRetry) completion = undefined;
        } else if (frame.type === "agent_end") {
          if (completion) throw driverError("Pi emitted duplicate agent_end evidence");
          completion = frame;
          completionSequence += 1;
        } else if (completion && !compacting) {
          throw driverError("Pi emitted late activity after agent_end without an automatic retry");
        }
        await connection.notify(frame, turn);
        // Pi's event handler emits auto_retry_start synchronously after
        // agent_end, before it can answer this read command. Consume in wire
        // order: the response is a barrier, not proof based on elapsed silence.
        // If a retry/compaction crossed the read, discard that stale text and
        // query again after the final agent_end. Native retries remain in the
        // ordinary submit/activity clock, outside the one-second tail drain.
        await requestResult();
      }
    },
    async close() { /* EOF is the native RPC shutdown boundary. */ }
  };
}

const PI_TURN_FRAME_TYPES = new Set([
  "agent_start", "agent_end", "turn_start", "turn_end",
  "message_start", "message_update", "message_end",
  "tool_execution_start", "tool_execution_update", "tool_execution_end",
  "queue_update", "auto_retry_start", "auto_retry_end",
  "compaction_start", "compaction_end", "extension_error", "heartbeat"
]);

function assertPiSession(frame: Readonly<Record<string, unknown>>, sessionId: string): void {
  // Official Pi RPC events omit sessionId: the initialized, serialized process
  // owns those frames. If an extension includes an identity it must still match.
  if (frame.sessionId !== undefined && frame.sessionId !== sessionId) {
    throw driverError("Pi emitted a different native session identity");
  }
}

function piLastAssistant(frame: Readonly<Record<string, unknown>>): Record<string, unknown> | undefined {
  return Array.isArray(frame.messages)
    ? [...frame.messages].reverse().map(maybeRecord).find((message) => message?.role === "assistant")
    : undefined;
}

interface DshCompletionTailState {
  nativeSequence: number;
  turnNumber?: number;
  sawTurnEnd: boolean;
  sawIdle: boolean;
}

function dshCompletionTailFrame(
  frame: Readonly<Record<string, unknown>>,
  session: SessionRef,
  state: DshCompletionTailState
): boolean {
  if (frame.id !== undefined ||
    (frame.method !== "session.status" && frame.method !== "session.event")) return false;
  const params = maybeRecord(frame.params);
  if (!params || params.sessionId !== session.nativeId) return false;
  if (frame.method === "session.status") {
    if (params.status !== "idle") return false;
    state.sawIdle = true;
    return true;
  }
  const event = maybeRecord(params.event);
  const data = maybeRecord(event?.data);
  if (!event || !data || !Number.isSafeInteger(event.seq) ||
    event.seq !== state.nativeSequence + 1) return false;
  const turnNumber = Number.isSafeInteger(data.turn) && (data.turn as number) >= 0
    ? data.turn as number
    : undefined;
  if (turnNumber === undefined || turnNumber !== state.turnNumber) return false;
  if (event.type === "turn/end") {
    if (state.sawTurnEnd) return false;
    assertDshTurnCompleted(data);
    state.nativeSequence = event.seq as number;
    state.sawTurnEnd = true;
    return true;
  }
  if (event.type !== "step/end") return false;
  state.nativeSequence = event.seq as number;
  return true;
}

function assertDshTurnCompleted(data: Readonly<Record<string, unknown>>): void {
  const reason = maybeRecord(data.reason);
  if (reason?.kind !== "completed") {
    throw driverError(`DSH native turn ended without success (${activityString(reason?.kind) ?? "missing reason"})`);
  }
}

export function dshSdkCodec(options: {
  cwd?: string;
  provider?: string;
  model?: string;
  expectedSessionId?: string;
  recoverySourceSessionId?: string;
  nativeSessionResume?: boolean;
} = {}): ResidentProtocolCodec {
  const completionState: DshCompletionTailState = {
    nativeSequence: -1,
    sawTurnEnd: false,
    sawIdle: false
  };
  const observe = dshResidentObservationMapper();
  return {
    protocol: "dsh-sdk-json-rpc",
    recoveryStrategy: options.nativeSessionResume ? "native-session-resume" : "durable-rehydrate",
    observe,
    completionTail: {
      isComplete: () => completionState.sawTurnEnd && completionState.sawIdle,
      accept: (frame, session) => dshCompletionTailFrame(frame, session, completionState)
    },
    async initialize(connection, session) {
      if (options.expectedSessionId && session.nativeId !== options.expectedSessionId) {
        throw driverError("DSH driver SessionRef does not match its allocated native identity");
      }
      if (options.recoverySourceSessionId &&
        options.recoverySourceSessionId === session.nativeId) {
        throw driverError("DSH durable rehydrate reused the source native session identity");
      }
      const id = connection.requestId();
      await connection.send({
        jsonrpc: "2.0",
        id,
        method: "initialize",
        params: {
          ...(options.cwd ? { cwd: options.cwd } : {}),
          ...(options.provider ? { provider: options.provider } : {}),
          ...(options.model ? { model: options.model } : {})
        }
      });
      const response = await jsonRpcResult(connection, id, "DSH initialize");
      const server = recordField(recordField(response, "result"), "serverInfo");
      if (server.name !== "deepseek-harness-sdk-runtime") {
        throw driverError("DSH returned an unexpected SDK runtime identity");
      }
      if (options.nativeSessionResume && session.resumedAt) {
        const resumeId = connection.requestId();
        await connection.send({ jsonrpc: "2.0", id: resumeId, method: "session/resume",
          params: { sessionId: session.nativeId } });
        const resumed = recordField(await jsonRpcResult(connection, resumeId, "DSH native resume"), "result");
        const lastSequence = resumed.lastSequence;
        if (resumed.sessionId !== session.nativeId || typeof lastSequence !== "number" ||
          !Number.isSafeInteger(lastSequence) || lastSequence < -1) {
          throw driverError("DSH native resume returned an invalid session or sequence");
        }
        completionState.nativeSequence = lastSequence as number;
        await connection.consumeInitializationNotifications(frame => {
          const params = maybeRecord(frame.params);
          const event = maybeRecord(params?.event);
          const data = maybeRecord(event?.data);
          return frame.method === "session.event" && params?.sessionId === session.nativeId &&
            Number.isSafeInteger(event?.seq) && (event!.seq as number) <= (lastSequence as number) &&
            (["permission/preset", "sandbox/mode", "approval/policy"].includes(activityString(event?.type) ?? "") ||
              (event?.type === "turn/end" && maybeRecord(data?.reason)?.kind === "interrupted"));
        }, "DSH native resume metadata");
      }
      return session;
    },
    async submit(connection, session, turn) {
      if (options.expectedSessionId && session.nativeId !== options.expectedSessionId) {
        throw driverError("DSH resident SessionRef changed");
      }
      completionState.turnNumber = undefined;
      let turnStartSequence = -1;
      let prunedSurface: { start: number; end: number; sequences: Set<number> } | undefined;
      completionState.sawTurnEnd = false;
      completionState.sawIdle = false;
      const id = connection.requestId();
      const prompt = turn.durableRehydrate && !options.nativeSessionResume
        ? [
            "OpenFARS durable rehydrate (not native DSH resume).",
            `sourceDigest=${turn.durableRehydrate.sourceDigest}`,
            `lastBusinessTurn=${turn.durableRehydrate.lastBusinessTurn}`,
            `lastInputId=${turn.durableRehydrate.lastInputId}`,
            `currentInputId=${turn.inputId}`,
            "Committed transcript follows:",
            turn.durableRehydrate.transcript,
            "Current prompt follows:",
            turn.prompt
          ].join("\n")
        : turn.prompt;
      connection.expectInputEcho?.(session, prompt);
      await connection.send({
        jsonrpc: "2.0",
        id,
        method: "session/prompt",
        params: { sessionId: session.nativeId, contentBlocks: [{ type: "text", text: prompt }] }
      });
      const receipt = await jsonRpcResult(connection, id, "DSH prompt receipt");
      stringField(recordField(receipt, "result"), "messageId", "DSH prompt message identity");
      await connection.notify(receipt, turn);
      let running = false;
      let handoff = "";
      for (;;) {
        const frame = await connection.next(() => true, "DSH turn event");
        if (frame.id !== undefined ||
          (frame.method !== "session.status" && frame.method !== "session.event")) {
          throw driverError("DSH emitted an unknown or out-of-turn frame");
        }
        const params = recordField(frame, "params");
        if (params.sessionId !== session.nativeId) {
          throw driverError("DSH emitted a different native session identity");
        }
        if (frame.method === "session.event") {
          const event = recordField(params, "event");
          const seq = numberField(event, "seq", "DSH event sequence");
          if (seq !== completionState.nativeSequence + 1) {
            throw driverError("DSH native event sequence replayed or contains a gap");
          }
          completionState.nativeSequence = seq;
          const data = recordField(event, "data");
          const eventTurn = data.turn === undefined
            ? undefined
            : numberField(data, "turn", "DSH event turn identity");
          if (event.type === "compaction/prune") {
            const range = recordField(data, "shadowedRange");
            const start = numberField(range, "start", "DSH pruned surface start");
            const end = numberField(range, "end", "DSH pruned surface end");
            const source = data.shadowedSeqs;
            if (end < start || end >= seq || !Array.isArray(source) || source.length === 0 ||
              source.some(value => !Number.isSafeInteger(value) || value < start || value > end) ||
              new Set(source).size !== source.length) throw driverError("DSH emitted invalid compaction source evidence");
            prunedSurface = { start, end, sequences: new Set(source as number[]) };
          } else if (maybeRecord(event.surfaceOp)) {
            const surface = recordField(event, "surfaceOp"), source = event.sourceEventSeqs;
            if (surface.op !== "replace" || !["tool/result", "assistant/message", "user/message"].includes(String(event.type)) ||
              !prunedSurface || surface.start !== prunedSurface.start || surface.end !== prunedSurface.end ||
              !Array.isArray(source) || source.length !== prunedSurface.sequences.size ||
              new Set(source).size !== source.length || source.some(value => !prunedSurface!.sequences.has(value)) ||
              completionState.turnNumber === undefined || eventTurn !== undefined && (
                eventTurn > completionState.turnNumber || eventTurn < completionState.turnNumber && prunedSurface.end >= turnStartSequence)) {
              throw driverError("DSH emitted an unbound or invalid historical surface replacement");
            }
            // This is an edit to retained native history. Its source sequence
            // and paired prune are checked, but it cannot be a fresh tool
            // result, assistant output, usage or input for this invocation.
            prunedSurface = undefined;
            continue;
          } else {
            prunedSurface = undefined;
          }
          if (event.type === "turn/start") {
            if (completionState.turnNumber !== undefined) {
              throw driverError("DSH emitted a new native turn before the current turn completed");
            }
            completionState.turnNumber = numberField(data, "turn", "DSH turn identity");
            turnStartSequence = seq;
          } else if (eventTurn !== undefined) {
            if (completionState.turnNumber === undefined) {
              throw driverError("DSH emitted a turn-scoped event before native turn start");
            }
            if (eventTurn !== completionState.turnNumber) {
              throw driverError("DSH emitted an event for a different native turn");
            }
          }
          if (event.type === "turn/end") {
            if (completionState.turnNumber === undefined ||
              eventTurn !== completionState.turnNumber || completionState.sawTurnEnd) {
              throw driverError("DSH emitted invalid native turn completion evidence");
            }
            completionState.sawTurnEnd = true;
            try { assertDshTurnCompleted(data); }
            catch (error) { throw new NativeTurnFailedError(error instanceof Error ? error.message : "DSH native turn failed"); }
          }
          if (event.type === "assistant/message") handoff = extractAssistantText(event) || handoff;
          await connection.notify(frame, turn);
          continue;
        }
        if (params.status === "running") {
          running = true;
          await connection.notify(frame, turn);
          continue;
        }
        if (params.status === "idle" && running) {
          completionState.sawIdle = true;
          await connection.notify(frame, turn);
          return { handoff: handoff || "DSH turn completed.", threadId: session.nativeId };
        }
        throw driverError("DSH returned an invalid resident session status");
      }
    },
    async close(connection) {
      const id = connection.requestId();
      await connection.send({ jsonrpc: "2.0", id, method: "shutdown" });
      await jsonRpcResult(connection, id, "DSH shutdown");
    }
  };
}

async function jsonRpcResult(
  connection: ResidentProtocolConnection,
  id: number,
  label: string
): Promise<Record<string, unknown>> {
  const frame = await connection.next((candidate) => candidate.id === id, label);
  if (frame.error !== undefined || !isRecord(frame.result)) {
    throw driverError(
      `${label} returned an invalid JSON-RPC result (${protocolFrameShape(frame)})`
    );
  }
  return frame;
}

function assertInitializedSession(
  requested: SessionRef,
  initialized: SessionRef,
  codec: ResidentProtocolCodec
): void {
  if (!initialized || initialized.schemaVersion !== requested.schemaVersion ||
    initialized.harnessId !== requested.harnessId ||
    initialized.adapterVersion !== requested.adapterVersion ||
    initialized.generation !== requested.generation ||
    initialized.durable !== requested.durable ||
    initialized.createdAt !== requested.createdAt ||
    initialized.resumedAt !== requested.resumedAt ||
    typeof initialized.nativeId !== "string" || !initialized.nativeId.trim() ||
    initialized.nativeId.includes("\0")) {
    throw driverError("Resident protocol returned an invalid initialized SessionRef");
  }
  const nativeAllocation = (codec.protocol === "codex-app-server" || codec.allocatesNativeSessionId === true) &&
    requested.nativeId.startsWith("pending:") && !requested.resumedAt;
  if (!nativeAllocation && initialized.nativeId !== requested.nativeId) {
    throw driverError("Resident protocol changed its authoritative native session identity");
  }
}

async function waitForIdentity(pid: number, timeoutMs: number): Promise<ResidentProcessIdentity> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try { return await readResidentProcessIdentity(pid); } catch {
      await new Promise<void>((resolve) => setTimeout(resolve, 5));
    }
  }
  throw driverError("Resident native process did not expose a stable PID identity");
}

async function waitForProcessState(identity: ResidentProcessIdentity, stopped: boolean): Promise<void> {
  // A heavily loaded service host can take several seconds to schedule the
  // stopped child and expose its new /proc state.  This is an acknowledgement
  // boundary, not a polling cadence for model work, so prefer a bounded longer
  // deadline over spuriously declaring a live resident lease broken.
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    try {
      const current = await readResidentProcessIdentity(identity.pid);
      if (!sameIdentity(identity, current)) throw driverError("Resident PID identity was reused");
      const status = await fs.readFile(`${await linuxProcPath(identity.pid)}/status`, "utf8");
      if (linuxProcessStopped(status) === stopped) return;
    } catch (error) {
      if (error instanceof HarnessRuntimeError) throw error;
    }
    await new Promise<void>((resolve) => setTimeout(resolve, 5));
  }
  throw driverError(stopped
    ? "Resident native process did not acknowledge SIGSTOP"
    : "Resident native process did not acknowledge SIGCONT");
}

function sameIdentity(left: ResidentProcessIdentity, right: ResidentProcessIdentity): boolean {
  return left.pid === right.pid && left.processGroupId === right.processGroupId &&
    left.bootId === right.bootId && left.startTicks === right.startTicks;
}

function extractAssistantText(value: unknown): string {
  const found: string[] = [];
  const visit = (item: unknown, key?: string): void => {
    if (typeof item === "string") {
      if (key === "text" || key === "result" || key === "output_text") found.push(item);
      return;
    }
    if (Array.isArray(item)) {
      for (const entry of item) visit(entry);
      return;
    }
    if (!isRecord(item)) return;
    if (item.role === "assistant" || item.type === "agentMessage" ||
      item.type === "assistant/message" || item.type === "text") {
      for (const [childKey, child] of Object.entries(item)) visit(child, childKey);
      return;
    }
    for (const [childKey, child] of Object.entries(item)) {
      if (["message", "content", "items", "turn", "data"].includes(childKey)) visit(child, childKey);
    }
  };
  visit(value);
  return found.join("\n").trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function protocolFrameShape(frame: Readonly<Record<string, unknown>>): string {
  const error = isRecord(frame.error) ? frame.error : undefined;
  const params = isRecord(frame.params) ? frame.params : undefined;
  const fields = [
    frame.id !== undefined ? `id=${String(frame.id).slice(0, 80)}` : undefined,
    typeof frame.method === "string" ? `method=${frame.method.slice(0, 120)}` : undefined,
    typeof frame.type === "string" ? `type=${frame.type.slice(0, 120)}` : undefined,
    params ? `params.keys=${Object.keys(params).sort().slice(0, 20).join("|")}` : undefined,
    frame.result === null ? "result=null" : frame.result !== undefined
      ? `result=${Array.isArray(frame.result) ? "array" : typeof frame.result}`
      : undefined,
    error?.code !== undefined ? `error.code=${String(error.code).slice(0, 80)}` : undefined,
    typeof error?.message === "string" ? `error.message=${error.message.slice(0, 200)}` : undefined
  ].filter((value): value is string => Boolean(value));
  return fields.length ? fields.join(";") : "unclassified-object";
}

function maybeRecord(value: unknown): Record<string, unknown> | undefined {
  return isRecord(value) ? value : undefined;
}

function recordField(value: Record<string, unknown>, key: string): Record<string, unknown> {
  const field = value[key];
  if (!isRecord(field)) throw driverError(`Resident protocol omitted object field ${key}`);
  return field;
}

function stringField(value: Record<string, unknown>, key: string, label: string): string {
  const field = value[key];
  if (typeof field !== "string" || !field.trim() || field.includes("\0")) {
    throw driverError(`${label} is invalid`);
  }
  return field;
}

function numberField(value: Record<string, unknown>, key: string, label: string): number {
  const field = value[key];
  if (!Number.isSafeInteger(field) || (field as number) < 0) throw driverError(`${label} is invalid`);
  return field as number;
}

async function residentDeadline<T>(
  operation: Promise<T>,
  timeoutMs: number,
  message: string
): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(driverError(message)), timeoutMs);
        timer.unref();
      })
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function positiveInactivityTimeout(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) && value !== undefined && value > 0
    ? Math.floor(value)
    : fallback;
}

class NativeTurnFailedError extends HarnessRuntimeError {
  constructor(message: string) {
    super("HARNESS_CONTRACT_VIOLATION", message, {}, { source: "adapter" });
  }
}

function driverError(message: string, cause?: unknown): HarnessRuntimeError {
  return new HarnessRuntimeError(
    "HARNESS_CONTRACT_VIOLATION",
    message,
    {},
    { source: "adapter", cause: cause instanceof Error ? cause : undefined }
  );
}
