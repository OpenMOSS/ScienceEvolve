import { createHash, randomUUID } from "node:crypto";
import { constants as fsConstants, promises as fs } from "node:fs";
import path from "node:path";
import { syncDirectory } from "./directory-sync.js";
import { controlWindowsResident, protectWindowsRuntimeFile, readWindowsProcessIdentity } from "./windows-resident.js";
import type {
  AgentRunRequest,
  AgentRunResult,
  CollaborationExecutionContext,
  ResidentDurableRehydrateProvenance,
  TraceSink
} from "../types.js";
import type {
  HarnessAdapterRequest,
  HarnessAdapter,
  LaunchPlan,
  ResidentInactivityPolicy,
  HarnessId,
  InvocationInputs,
  InvocationSpec,
  SessionRef
} from "./contracts.js";
import { HarnessRuntimeError } from "./errors.js";
import type {
  FilesystemAuthority,
  PreparedFilesystemMcp
} from "./filesystem-authority.js";
import type { ResidentProcessBinding, ResidentProcessLauncher } from "./process-host.js";
import type {
  ResidentProtocol,
  ResidentProtocolCodec,
  ResidentRecoveryStrategy,
  ResidentTurnAuthorityBroker
} from "./resident-native-driver.js";

export type ResidentLeaseState =
  | "starting"
  | "busy"
  | "waiting"
  | "pausing"
  | "paused"
  | "stopping"
  | "stopped"
  | "crashed";

export interface ResidentProcessIdentity {
  pid: number;
  processGroupId?: number;
  bootId?: string;
  startTicks?: string;
  windowsJobName?: string;
}

export interface ResidentProcessLease extends ResidentProcessIdentity {
  schemaVersion: 1;
  executionId: string;
  harnessId: HarnessId;
  role: "leader" | "delivery" | "final-integration";
  session: SessionRef;
  ownershipEpoch: number;
  /** Distinguishes a supplemental native process without changing its business epoch. */
  physicalLeaseId?: string;
  /** Monotonic input fence. Absence in older markers is unknown, never false. */
  inputStarted?: boolean;
  workspacePath?: string;
  state: ResidentLeaseState;
  controlSeq: number;
  acknowledgedControlSeq: number;
  lastActivityAt: string;
}

export interface ResidentLeaseAuthority {
  executionId: string;
  harnessId: HarnessId;
  ownershipEpoch: number;
  physicalLeaseId?: string;
  controlSeq: number;
}

/** Trusted S/I grant, never part of Agent configuration or a model tool request.
 * S revalidates the exact finite report-repair reservation; I also fences and
 * proves the preceding native process stopped before launching its replacement.
 * The Agent still owns its decisions, memory and all missing business/Git work. */
export interface ResidentSameEpochReopen {
  previousRuntimePath: string;
  revalidate(): Promise<void> | void;
}

/** I-owned proof for an empty Pi reservation whose original process stopped.
 * It is carried outside Agent configuration and rechecked before native spawn. */
export interface ResidentUnstartedSessionGrant {
  projectId: string;
  scopeId: string;
  role: ResidentProcessLease["role"];
  stoppedEpoch: number;
  workspacePath: string;
  session: SessionRef;
  revalidate(): Promise<void> | void;
}

export interface ResidentTurn {
  inputId: string;
  invocationId: string;
  prompt: string;
  /** A fresh, short-lived route is required for every model turn. */
  route: import("./gateway-route.js").ModelRouteBinding;
  /** A fresh orchestration capability is required for every model turn. */
  controlCapability?: string;
  durableRehydrate?: ResidentDurableRehydrateProvenance;
}

export type ResidentMcpRow = {
  name: string;
  namespace: string;
  transport: "stdio";
  command: string;
  args: string[];
  env?: Record<string, string>;
} | {
  name: string;
  namespace: string;
  transport: "streamable-http";
  url: string;
  headers?: Record<string, string>;
};

/** S/I-owned stable control endpoint paired to the per-turn authority broker. */
export interface ResidentControlMcpBinding {
  row: ResidentMcpRow;
  turnAuthority: ResidentTurnAuthorityBroker;
  assertReady(): Promise<void>;
}

export interface ResidentScopeOpenRequest {
  request: HarnessAdapterRequest;
  spec: InvocationSpec;
  session: SessionRef;
  launchRoute: import("./gateway-route.js").ModelRouteBinding;
  filesystemAuthority: FilesystemAuthority;
  mcpRows: readonly ResidentMcpRow[];
  /** Facade-captured credential used only for fixed-directory MCP indirection. */
  fixedMcpToken?: string;
  filesystemMcp?: PreparedFilesystemMcp;
  controlMcp?: ResidentControlMcpBinding;
  executionRuntimePath: string;
  sameEpochReopen?: ResidentSameEpochReopen;
  unstartedSession?: ResidentUnstartedSessionGrant;
  processBinding: ResidentProcessBinding;
  turnAuthority: ResidentTurnAuthorityBroker;
  signal: AbortSignal;
  onTrace: TraceSink;
  onFrame?: (
    frame: Readonly<Record<string, unknown>>,
    turn?: ResidentTurn
  ) => Promise<void> | void;
  /** Trusted persistence callback retained outside the Adapter-visible request. */
  publishDurableSession?: (session: SessionRef, legacyId: string) => Promise<void> | void;
  /** DSH rehydrate provenance; this is never represented as native resume. */
  recoverySourceSessionId?: string;
}

export interface PrepareResidentScopeRequest {
  request: AgentRunRequest;
  /** Required only for leader management; delivery inputs are staged here. */
  inputs?: InvocationInputs;
  launchRoute: import("./gateway-route.js").ModelRouteBinding;
  /** Compiled only after first-use Git memory has been safely staged. */
  filesystemAuthorityInput: {
    serviceUserRoot: string;
    projectWorktreeRoot?: string;
    projectWorktrees?: readonly string[];
    protectedRoots: readonly string[];
  };
  mcpRows?: readonly ResidentMcpRow[];
  filesystemMcp?: PreparedFilesystemMcp;
  controlMcp?: ResidentControlMcpBinding;
  executionRuntimePath: string;
  sameEpochReopen?: ResidentSameEpochReopen;
  unstartedSession?: ResidentUnstartedSessionGrant;
  turnAuthority: ResidentTurnAuthorityBroker;
  signal: AbortSignal;
  onTrace: TraceSink;
  onFrame?: ResidentScopeOpenRequest["onFrame"];
  recoveryMaxAttempts?: number;
}

export interface ResidentAdapterLaunchEvidence {
  harnessId: string;
  protocol: ResidentProtocol;
  recoveryStrategy: ResidentRecoveryStrategy;
  command: string;
  args: readonly string[];
  cwd: string;
  rawTools: FilesystemAuthority["rawTools"];
}

export interface ResidentHarnessDriver {
  readonly identity: ResidentProcessIdentity;
  readonly session: SessionRef;
  /** Must complete one actual provider/model turn, not merely write to stdin. */
  submit(turn: ResidentTurn): Promise<AgentRunResult>;
  /** Must not poll the model provider while idle. */
  probe(): Promise<{ alive: boolean; stopped: boolean; identity: ResidentProcessIdentity }>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  /** Resolves only after the native process emits exit/close. */
  close(): Promise<void>;
  /** Last-resort leak containment; close() must still observe process exit. */
  forceClose?(): Promise<void> | void;
}

export interface ResidentLeaseOpenRequest {
  executionId: string;
  harnessId: HarnessId;
  ownershipEpoch: number;
  role?: "leader" | "delivery" | "final-integration";
  runtimePath: string;
  workspacePath?: string;
  sameEpochReopen?: ResidentSameEpochReopen;
  /** Trusted adapter proved the original reservation still has no history. */
  unstartedReservation?: true;
  driver: ResidentHarnessDriver;
}

export interface ResidentStartupReconcileRequest {
  executionId: string;
  harnessId: HarnessId;
  runtimePath: string;
  /** Epoch that the caller intends to use after reconciliation. */
  nextOwnershipEpoch: number;
}

export interface ResidentStartupReconcileResult {
  outcome: "none" | "dead" | "terminated" | "identity-mismatch";
  previous?: ResidentProcessLease;
}

interface LeaseRecord {
  lease: ResidentProcessLease;
  runtimePath: string;
  driver: ResidentHarnessDriver;
  operation: Promise<unknown>;
}

const MARKER_NAME = "resident-process.json";
const NO_FOLLOW = typeof fsConstants.O_NOFOLLOW === "number" ? fsConstants.O_NOFOLLOW : 0;

/** Stable collaboration lease key, independent of any per-turn invocation id. */
export function residentScopeId(context: CollaborationExecutionContext): string {
  if (context.role !== "leader") return context.executionId;
  const managementScopeId = "routeScopeId" in context
    ? context.routeScopeId
    : context.groupRunId;
  return `management:${context.nodeRunId}:${managementScopeId}`;
}

/**
 * Execution-scoped resident-process registry. It deliberately does not equate
 * a completed model turn with an execution terminal state: successful submit
 * returns the lease to `waiting` with the same checked native identity.
 */
export class ResidentLeaseManager {
  readonly #records = new Map<string, LeaseRecord>();
  readonly #sessionOwners = new Map<string, string>();
  readonly #reconciledEpochFloor = new Map<string, number>();
  readonly #opening = new Set<string>();

  async open(request: ResidentLeaseOpenRequest): Promise<ResidentProcessLease> {
    assertExecutionId(request.executionId);
    assertEpoch(request.ownershipEpoch);
    const key = leaseKey(request.executionId, request.harnessId);
    if (this.#opening.has(key)) throw contractError("A resident Harness open already owns this scope");
    this.#opening.add(key);
    try {
      return await this.#open(request, key);
    } finally {
      this.#opening.delete(key);
    }
  }

  async #open(request: ResidentLeaseOpenRequest, key: string): Promise<ResidentProcessLease> {
    const existing = this.#records.get(key);
    if (existing && !terminalLeaseState(existing.lease.state)) {
      throw contractError("A resident Harness lease already owns this execution and Harness");
    }
    const epochFloor = Math.max(
      this.#reconciledEpochFloor.get(key) ?? -1,
      existing?.lease.ownershipEpoch ?? -1
    );
    const reopen = request.sameEpochReopen;
    if (reopen && ((request.role ?? "delivery") !== "delivery" ||
      typeof reopen.revalidate !== "function" || !path.isAbsolute(reopen.previousRuntimePath) ||
      path.normalize(reopen.previousRuntimePath) !== reopen.previousRuntimePath ||
      reopen.previousRuntimePath === request.runtimePath ||
      path.dirname(reopen.previousRuntimePath) !== path.dirname(request.runtimePath) ||
      existing && (existing.runtimePath !== reopen.previousRuntimePath ||
        existing.lease.ownershipEpoch !== request.ownershipEpoch ||
        nativeSessionKey(existing.lease.session) !== nativeSessionKey(request.driver.session)))) {
      throw contractError("Resident supplemental open does not match its stopped original process");
    }
    if (request.ownershipEpoch < epochFloor || request.ownershipEpoch === epochFloor && !reopen) {
      throw contractError("Resident Harness open used an obsolete ownership epoch");
    }
    await reopen?.revalidate();
    if (existing) {
      const priorSessionKey = nativeSessionKey(existing.lease.session);
      if (this.#sessionOwners.get(priorSessionKey) === key) {
        this.#sessionOwners.delete(priorSessionKey);
      }
    }
    const sessionKey = nativeSessionKey(request.driver.session);
    const sessionOwner = this.#sessionOwners.get(sessionKey);
    if (sessionOwner && sessionOwner !== key) {
      const owner = this.#records.get(sessionOwner);
      if (owner && !terminalLeaseState(owner.lease.state)) {
        throw contractError("A resident native session is already owned by another collaboration role");
      }
      this.#sessionOwners.delete(sessionKey);
    }
    const identity = await assertDriverIdentity(request.driver);
    if (!sameIdentity(identity, request.driver.identity)) {
      throw contractError("Resident Harness process identity changed during open");
    }
    // Launch/probe may await I/O. Revoked S authority must not become a live
    // lease, and neither an old epoch nor an old handle may own this new PID.
    await reopen?.revalidate();
    const concurrentSessionOwner = this.#sessionOwners.get(sessionKey);
    const concurrentSessionRecord = concurrentSessionOwner ? this.#records.get(concurrentSessionOwner) : undefined;
    if (concurrentSessionOwner !== key && concurrentSessionRecord &&
      !terminalLeaseState(concurrentSessionRecord.lease.state)) {
      throw contractError("A resident native session is already owned by another collaboration role");
    }
    const lease: ResidentProcessLease = {
      schemaVersion: 1,
      executionId: request.executionId,
      harnessId: request.harnessId,
      role: request.role ?? "delivery",
      ...identity,
      session: structuredClone(request.driver.session),
      ownershipEpoch: request.ownershipEpoch,
      ...(reopen ? { physicalLeaseId: randomUUID() } : {}),
      inputStarted: request.driver.session.resumedAt !== undefined && request.unstartedReservation !== true,
      ...(request.workspacePath ? { workspacePath: request.workspacePath } : {}),
      state: "starting",
      controlSeq: 0,
      acknowledgedControlSeq: 0,
      lastActivityAt: new Date().toISOString()
    };
    const record: LeaseRecord = {
      lease,
      runtimePath: request.runtimePath,
      driver: request.driver,
      operation: Promise.resolve()
    };
    this.#records.set(key, record);
    this.#sessionOwners.set(sessionKey, key);
    try {
      await persistLeaseMarker(record);
      lease.state = "waiting";
      touch(lease);
      await persistLeaseMarker(record);
      this.#reconciledEpochFloor.set(key, request.ownershipEpoch);
      return cloneLease(lease);
    } catch (error) {
      lease.state = "crashed";
      touch(lease);
      await Promise.resolve(request.driver.forceClose?.()).catch(() => undefined);
      if (this.#sessionOwners.get(sessionKey) === key) this.#sessionOwners.delete(sessionKey);
      throw error;
    }
  }

  async submit(
    authority: ResidentLeaseAuthority,
    turn: ResidentTurn
  ): Promise<{ lease: ResidentProcessLease; result: AgentRunResult }> {
    validateTurn(turn);
    return this.#serialized(authority, async (record) => {
      assertControllable(record.lease, authority, ["waiting"]);
      advanceControl(record.lease, authority.controlSeq, "busy");
      // Write before calling the native driver. A crash or rejected write can
      // only make this proof conservative; it must never hide a possible input.
      record.lease.inputStarted = true;
      await persistLeaseMarker(record);
      try {
        const result = await record.driver.submit(structuredClone(turn));
        await assertRecordAlive(record, false);
        record.lease.acknowledgedControlSeq = authority.controlSeq;
        record.lease.state = "waiting";
        touch(record.lease);
        await persistLeaseMarker(record);
        return { lease: cloneLease(record.lease), result };
      } catch (error) {
        await markAfterFailure(record);
        throw error;
      }
    });
  }

  /** Observe an idle lease. This performs an OS/process probe, never a model call. */
  async wait(authority: ResidentLeaseAuthority): Promise<ResidentProcessLease> {
    return this.#serialized(authority, async (record) => {
      assertControllable(record.lease, authority, ["waiting", "paused"]);
      await assertRecordAlive(record, record.lease.state === "paused");
      advanceControl(record.lease, authority.controlSeq, record.lease.state);
      record.lease.acknowledgedControlSeq = authority.controlSeq;
      await persistLeaseMarker(record);
      return cloneLease(record.lease);
    });
  }

  async pause(authority: ResidentLeaseAuthority): Promise<ResidentProcessLease> {
    return this.#serialized(authority, async (record) => {
      assertControllable(record.lease, authority, ["waiting"]);
      advanceControl(record.lease, authority.controlSeq, "pausing");
      await persistLeaseMarker(record);
      try {
        await record.driver.pause();
        await assertRecordAlive(record, true);
        record.lease.state = "paused";
        record.lease.acknowledgedControlSeq = authority.controlSeq;
        touch(record.lease);
        await persistLeaseMarker(record);
        return cloneLease(record.lease);
      } catch (error) {
        await markAfterFailure(record);
        throw error;
      }
    });
  }

  async resume(authority: ResidentLeaseAuthority): Promise<ResidentProcessLease> {
    return this.#serialized(authority, async (record) => {
      assertControllable(record.lease, authority, ["paused"]);
      advanceControl(record.lease, authority.controlSeq, "pausing");
      await persistLeaseMarker(record);
      try {
        await record.driver.resume();
        await assertRecordAlive(record, false);
        record.lease.state = "waiting";
        record.lease.acknowledgedControlSeq = authority.controlSeq;
        touch(record.lease);
        await persistLeaseMarker(record);
        return cloneLease(record.lease);
      } catch (error) {
        await markAfterFailure(record);
        throw error;
      }
    });
  }

  async probe(authority: ResidentLeaseAuthority): Promise<ResidentProcessLease> {
    return this.#serialized(authority, async (record) => {
      assertAuthority(record.lease, authority);
      if (!terminalLeaseState(record.lease.state)) {
        const probe = await record.driver.probe();
        if (!probe.alive || !sameIdentity(record.lease, probe.identity)) {
          record.lease.state = "crashed";
          touch(record.lease);
          await persistLeaseMarker(record);
        }
      }
      if (authority.controlSeq > record.lease.controlSeq) {
        record.lease.controlSeq = authority.controlSeq;
        record.lease.acknowledgedControlSeq = authority.controlSeq;
        touch(record.lease);
        await persistLeaseMarker(record);
      } else if (authority.controlSeq <= record.lease.acknowledgedControlSeq) {
        throw staleControlError();
      }
      return cloneLease(record.lease);
    });
  }

  async close(authority: ResidentLeaseAuthority): Promise<ResidentProcessLease> {
    return this.#serialized(authority, async (record) => {
      assertControllable(record.lease, authority, ["waiting", "paused", "crashed"]);
      const wasPaused = record.lease.state === "paused";
      advanceControl(record.lease, authority.controlSeq, "stopping");
      await persistLeaseMarker(record);
      let closeFailure: unknown;
      // Cancellation may already have stopped the ProcessHost before this
      // serialized close reaches a paused lease. A failed resume is not stop
      // proof; still require the driver's owned-tree close and final probe.
      if (wasPaused) {
        try {
          await record.driver.resume();
          await assertRecordAlive(record, false);
        } catch {
          // driver.close owns shutdown/containment even if the leader exited.
        }
      }
      try {
        await record.driver.close();
      } catch (error) {
        closeFailure = error;
      }
      const probeStop = async () => {
        try {
          return await record.driver.probe();
        } catch (error) {
          record.lease.state = "crashed";
          touch(record.lease);
          await persistLeaseMarker(record);
          throw error;
        }
      };
      let probe = await probeStop();
      if (probe.alive && sameIdentity(record.lease, probe.identity)) {
        await Promise.resolve(record.driver.forceClose?.()).catch(() => undefined);
        probe = await probeStop();
      }
      if (probe.alive && sameIdentity(record.lease, probe.identity)) {
        record.lease.state = "crashed";
        touch(record.lease);
        await persistLeaseMarker(record);
        throw contractError("Resident Harness process remained alive after close");
      }
      record.lease.state = closeFailure ? "crashed" : "stopped";
      record.lease.acknowledgedControlSeq = authority.controlSeq;
      touch(record.lease);
      await persistLeaseMarker(record);
      if (!closeFailure) {
        const sessionKey = nativeSessionKey(record.lease.session);
        if (this.#sessionOwners.get(sessionKey) ===
          leaseKey(record.lease.executionId, record.lease.harnessId)) {
          this.#sessionOwners.delete(sessionKey);
        }
      }
      if (closeFailure) throw closeFailure;
      return cloneLease(record.lease);
    });
  }

  snapshot(executionId: string, harnessId: HarnessId): ResidentProcessLease | undefined {
    const record = this.#records.get(leaseKey(executionId, harnessId));
    return record ? cloneLease(record.lease) : undefined;
  }

  /**
   * Startup-only orphan reconciliation. A marker identity must match all of
   * PID, process group, boot id and start ticks before this method signals it.
   * The previous epoch is fenced even when the PID is dead or has been reused.
   */
  async reconcileStartup(
    request: ResidentStartupReconcileRequest
  ): Promise<ResidentStartupReconcileResult> {
    assertExecutionId(request.executionId);
    assertEpoch(request.nextOwnershipEpoch);
    const key = leaseKey(request.executionId, request.harnessId);
    if (this.#opening.has(key)) throw contractError("Resident startup recovery cannot overlap a scope open");
    const inMemory = this.#records.get(key);
    let terminatedInMemory = false;
    if (inMemory) {
      if (request.nextOwnershipEpoch <= inMemory.lease.ownershipEpoch) {
        throw contractError("Resident startup recovery must advance the ownership epoch");
      }
      const initialProbe = await inMemory.driver.probe().catch(() => ({
        alive: false,
        stopped: false,
        identity: inMemory.driver.identity
      }));
      if (initialProbe.alive && sameIdentity(inMemory.lease, initialProbe.identity)) {
        terminatedInMemory = true;
        if (inMemory.driver.forceClose) await inMemory.driver.forceClose();
        else await inMemory.driver.close();
      }
      const finalProbe = await inMemory.driver.probe().catch(() => ({
        alive: false,
        stopped: false,
        identity: inMemory.driver.identity
      }));
      if (finalProbe.alive && sameIdentity(inMemory.lease, finalProbe.identity)) {
        throw contractError("Unable to quiesce the in-memory resident process group");
      }
      await leaseDeadline(
        inMemory.operation.catch(() => undefined),
        5_000,
        "Unable to settle the in-memory resident operation during recovery"
      );
      inMemory.lease.state = "crashed";
      touch(inMemory.lease);
      await persistLeaseMarker(inMemory);
      const sessionKey = nativeSessionKey(inMemory.lease.session);
      if (this.#sessionOwners.get(sessionKey) === key) this.#sessionOwners.delete(sessionKey);
      this.#records.delete(key);
      this.#reconciledEpochFloor.set(key, inMemory.lease.ownershipEpoch);
    }
    const marker = await readResidentMarker(request.runtimePath);
    if (!marker) return { outcome: terminatedInMemory ? "terminated" : "none" };
    if (marker.executionId !== request.executionId || marker.harnessId !== request.harnessId) {
      throw contractError("Resident startup marker does not match the requested collaboration scope");
    }
    if (request.nextOwnershipEpoch <= marker.ownershipEpoch) {
      throw contractError("Resident startup recovery must advance the ownership epoch");
    }
    this.#reconciledEpochFloor.set(key, marker.ownershipEpoch);
    let outcome: ResidentStartupReconcileResult["outcome"];
    let actual: ResidentProcessIdentity | undefined;
    try { actual = await readResidentProcessIdentity(marker.pid, marker.windowsJobName); } catch { /* already dead */ }
    if (!actual) {
      outcome = terminatedInMemory ? "terminated" : "dead";
    } else if (!sameIdentity(marker, actual)) {
      // PID reuse or host reboot: never signal an identity that the marker did
      // not authorize, but still fence the stale durable epoch.
      outcome = "identity-mismatch";
    } else if (process.platform === "win32") {
      await controlWindowsResident(marker, "terminate");
      outcome = "terminated";
    } else {
      const target = marker.processGroupId && marker.processGroupId > 1
        ? -marker.processGroupId
        : marker.pid;
      const pidNamespace = marker.processGroupId && marker.processGroupId > 1
        ? await fs.readlink(`${await linuxProcPath(marker.pid)}/ns/pid`)
        : undefined;
      try { process.kill(target, "SIGKILL"); } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ESRCH") throw error;
      }
      const deadline = Date.now() + 5_000;
      while (Date.now() < deadline) {
        const groupAlive = pidNamespace && marker.processGroupId
          ? await linuxProcessGroupAlive(marker.processGroupId, pidNamespace)
          : false;
        try {
          const current = await readLinuxProcessIdentity(marker.pid);
          if (!sameIdentity(marker, current) && !groupAlive) break;
        } catch {
          actual = undefined;
          if (!groupAlive) break;
        }
        await new Promise<void>((resolve) => setTimeout(resolve, 10));
      }
      if (pidNamespace && marker.processGroupId &&
        await linuxProcessGroupAlive(marker.processGroupId, pidNamespace)) {
        throw contractError("Unable to quiesce the startup resident process group");
      }
      if (actual !== undefined) {
        try {
          const current = await readLinuxProcessIdentity(marker.pid);
          if (sameIdentity(marker, current)) {
            throw contractError("Unable to quiesce the startup resident orphan");
          }
        } catch (error) {
          if (error instanceof HarnessRuntimeError &&
            error.message === "Unable to quiesce the startup resident orphan") throw error;
        }
      }
      outcome = "terminated";
    }
    const reconciled: ResidentProcessLease = {
      ...marker,
      state: "crashed",
      lastActivityAt: new Date().toISOString()
    };
    await writeResidentMarker(request.runtimePath, reconciled);
    // A durable stopped marker is the process-exit proof needed when the
    // service crashes after close but before S commits the execution terminal.
    // Preserve that evidence in the result while still replacing the on-disk
    // marker with the crashed fence that prevents reuse of the old epoch.
    const previous = marker.state === "stopped" &&
      (outcome === "dead" || outcome === "identity-mismatch")
      ? marker
      : reconciled;
    return { outcome, previous: cloneLease(previous) };
  }

  async #serialized<T>(
    authority: ResidentLeaseAuthority,
    operation: (record: LeaseRecord) => Promise<T>
  ): Promise<T> {
    const record = this.#records.get(leaseKey(authority.executionId, authority.harnessId));
    if (!record) throw contractError("No resident Harness lease owns this execution");
    const previous = record.operation.catch(() => undefined);
    const current = previous.then(() => operation(record));
    record.operation = current;
    return current;
  }
}

function nativeSessionKey(session: SessionRef): string {
  return `${session.harnessId}\0${session.adapterVersion}\0${session.nativeId}`;
}

async function leaseDeadline<T>(
  operation: Promise<T>,
  timeoutMs: number,
  message: string
): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(contractError(message)), timeoutMs);
        timer.unref();
      })
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function readLinuxProcessIdentity(pid: number): Promise<ResidentProcessIdentity> {
  if (process.platform !== "linux" || !Number.isSafeInteger(pid) || pid <= 1) {
    throw contractError("Resident process identity requires a positive Linux PID");
  }
  const procPid = await resolveProcPid(pid);
  const [stat, status, bootId] = await Promise.all([
    fs.readFile(`/proc/${procPid}/stat`, "utf8"),
    fs.readFile(`/proc/${procPid}/status`, "utf8"),
    fs.readFile("/proc/sys/kernel/random/boot_id", "utf8")
  ]);
  // comm may contain spaces and parentheses; field 22 is token 20 after it.
  const close = stat.lastIndexOf(")");
  const tail = close >= 0 ? stat.slice(close + 2).trim().split(/\s+/) : [];
  const startTicks = tail[19];
  if (!startTicks || !/^\d+$/.test(startTicks)) {
    throw contractError("Unable to read resident process start ticks");
  }
  const namespacePid = namespaceId(status, "NSpid") ?? pid;
  const processGroupId = namespaceId(status, "NSpgid") ?? namespacePid;
  return {
    pid: namespacePid,
    processGroupId,
    bootId: bootId.trim(),
    startTicks
  };
}

export async function readResidentProcessIdentity(pid: number, windowsJobName?: string): Promise<ResidentProcessIdentity> {
  return process.platform === "win32"
    ? readWindowsProcessIdentity(pid, windowsJobName)
    : readLinuxProcessIdentity(pid);
}

/** Resolve a PID reported inside the service namespace to its visible /proc row. */
export async function linuxProcPath(pid: number): Promise<string> {
  return `/proc/${await resolveProcPid(pid)}`;
}

export function linuxProcessStopped(status: string): boolean {
  return /^State:\s+[Tt]\b/m.test(status);
}

async function linuxProcessGroupAlive(
  processGroupId: number,
  pidNamespace: string
): Promise<boolean> {
  for (const entry of await fs.readdir("/proc")) {
    if (!/^\d+$/.test(entry)) continue;
    try {
      if (await fs.readlink(`/proc/${entry}/ns/pid`) !== pidNamespace) continue;
      const status = await fs.readFile(`/proc/${entry}/status`, "utf8");
      if (/^State:\s+Z\b/m.test(status)) continue;
      if (namespaceId(status, "NSpgid") === processGroupId) return true;
    } catch {
      // Processes can exit between the directory scan and identity reads.
    }
  }
  return false;
}

async function assertDriverIdentity(driver: ResidentHarnessDriver): Promise<ResidentProcessIdentity> {
  validateIdentity(driver.identity);
  const probe = await driver.probe();
  validateIdentity(probe.identity);
  if (!probe.alive || !sameIdentity(driver.identity, probe.identity)) {
    throw contractError("Resident Harness process is not alive at lease open");
  }
  return { ...probe.identity };
}

async function assertRecordAlive(record: LeaseRecord, stopped: boolean): Promise<void> {
  const probe = await record.driver.probe();
  if (!probe.alive || !sameIdentity(record.lease, probe.identity)) {
    record.lease.state = "crashed";
    touch(record.lease);
    await persistLeaseMarker(record);
    throw contractError("Resident Harness process exited or its PID identity was reused");
  }
  if (probe.stopped !== stopped) {
    throw contractError(stopped
      ? "Resident Harness pause was not acknowledged by the native process"
      : "Resident Harness process did not resume from its stopped state");
  }
}

async function markAfterFailure(record: LeaseRecord): Promise<void> {
  const probe = await record.driver.probe().catch(() => ({
    alive: false,
    stopped: false,
    identity: record.driver.identity
  }));
  record.lease.state = !probe.alive || !sameIdentity(record.lease, probe.identity)
    ? "crashed"
    : probe.stopped ? "paused" : "waiting";
  touch(record.lease);
  await persistLeaseMarker(record).catch(() => undefined);
}

function assertControllable(
  lease: ResidentProcessLease,
  authority: ResidentLeaseAuthority,
  states: readonly ResidentLeaseState[]
): void {
  assertAuthority(lease, authority);
  if (!states.includes(lease.state)) {
    throw contractError(`Resident Harness lease cannot accept control while ${lease.state}`);
  }
  if (authority.controlSeq <= lease.acknowledgedControlSeq ||
    authority.controlSeq <= lease.controlSeq) {
    throw staleControlError();
  }
}

function assertAuthority(lease: ResidentProcessLease, authority: ResidentLeaseAuthority): void {
  assertEpoch(authority.ownershipEpoch);
  if (lease.executionId !== authority.executionId || lease.harnessId !== authority.harnessId) {
    throw contractError("Resident Harness control does not match lease ownership");
  }
  if (lease.ownershipEpoch !== authority.ownershipEpoch) {
    throw contractError("Resident Harness control used an obsolete ownership epoch");
  }
  if (lease.physicalLeaseId !== authority.physicalLeaseId) {
    throw contractError("Resident Harness control used an obsolete physical lease identity");
  }
  if (!Number.isSafeInteger(authority.controlSeq) || authority.controlSeq <= 0) {
    throw contractError("Resident Harness control sequence must be a positive integer");
  }
}

function advanceControl(
  lease: ResidentProcessLease,
  controlSeq: number,
  state: ResidentLeaseState
): void {
  lease.controlSeq = controlSeq;
  lease.state = state;
  touch(lease);
}

async function persistLeaseMarker(record: LeaseRecord): Promise<void> {
  await writeResidentMarker(record.runtimePath, record.lease);
}

async function writeResidentMarker(
  runtimePath: string,
  lease: ResidentProcessLease
): Promise<void> {
  await fs.mkdir(runtimePath, { recursive: true, mode: 0o700 });
  const marker = path.join(runtimePath, MARKER_NAME);
  const temporary = path.join(
    runtimePath,
    `.${MARKER_NAME}.${process.pid}.${randomUUID()}.tmp`
  );
  try {
    const value = `${JSON.stringify(lease)}\n`;
    const handle = await fs.open(
      temporary,
      fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL | NO_FOLLOW,
      0o600
    );
    try {
      const info = await handle.stat();
      if (!info.isFile() || info.nlink !== 1) {
        throw new Error("Resident process marker must be a private regular file");
      }
      await handle.writeFile(value, "utf8");
      await handle.sync();
    } finally {
      await handle.close();
    }
    if (process.platform === "win32") await protectWindowsRuntimeFile(temporary);
    const existing = await fs.lstat(marker).catch((error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") return undefined;
      throw error;
    });
    if (existing?.isSymbolicLink() || existing && !existing.isFile()) {
      throw new Error("Resident process marker destination is not a regular file");
    }
    await fs.rename(temporary, marker);
    await syncDirectory(runtimePath);
  } catch (error) {
    await fs.rm(temporary, { force: true }).catch(() => undefined);
    throw contractError("Unable to atomically persist resident process identity", error);
  }
}

export async function readResidentMarker(runtimePath: string): Promise<ResidentProcessLease | undefined> {
  const markerPath = path.join(runtimePath, MARKER_NAME);
  let handle: Awaited<ReturnType<typeof fs.open>>;
  try {
    handle = await fs.open(markerPath, fsConstants.O_RDONLY | NO_FOLLOW);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw contractError("Unable to open resident startup marker", error);
  }
  try {
    const info = await handle.stat();
    if (!info.isFile() || info.nlink !== 1 || info.size <= 0 || info.size > 16 * 1024) {
      throw contractError("Resident startup marker is not a bounded private regular file");
    }
    const raw = await handle.readFile("utf8");
    const value = JSON.parse(raw) as unknown;
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("marker is not an object");
    }
    const marker = value as ResidentProcessLease;
    validateIdentity(marker);
    assertExecutionId(marker.executionId);
    assertEpoch(marker.ownershipEpoch);
    if (marker.schemaVersion !== 1 || typeof marker.harnessId !== "string" ||
      !["leader", "delivery", "final-integration"].includes(marker.role) ||
      !["starting", "busy", "waiting", "pausing", "paused", "stopping", "stopped", "crashed"]
        .includes(marker.state) ||
      typeof marker.bootId !== "string" || !marker.bootId ||
      typeof marker.startTicks !== "string" || !/^\d+$/.test(marker.startTicks) ||
      marker.physicalLeaseId !== undefined && (typeof marker.physicalLeaseId !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(marker.physicalLeaseId)) ||
      marker.inputStarted !== undefined && typeof marker.inputStarted !== "boolean" ||
      marker.workspacePath !== undefined && (typeof marker.workspacePath !== "string" ||
        !path.isAbsolute(marker.workspacePath) || path.normalize(marker.workspacePath) !== marker.workspacePath) ||
      !Number.isSafeInteger(marker.controlSeq) || marker.controlSeq < 0 ||
      !Number.isSafeInteger(marker.acknowledgedControlSeq) || marker.acknowledgedControlSeq < 0 ||
      !marker.session || marker.session.harnessId !== marker.harnessId ||
      typeof marker.session.nativeId !== "string" || !marker.session.nativeId) {
      throw new Error("marker fields are invalid");
    }
    return structuredClone(marker);
  } catch (error) {
    if (error instanceof HarnessRuntimeError) throw error;
    throw contractError("Resident startup marker is malformed", error);
  } finally {
    await handle.close();
  }
}

function validateIdentity(identity: ResidentProcessIdentity): void {
  if (!Number.isSafeInteger(identity.pid) || identity.pid <= 1 ||
    identity.processGroupId !== undefined &&
      (!Number.isSafeInteger(identity.processGroupId) || identity.processGroupId <= 1) ||
    identity.bootId !== undefined && !identity.bootId.trim() ||
    identity.startTicks !== undefined && !/^\d+$/.test(identity.startTicks)) {
    throw contractError("Resident Harness driver returned an invalid process identity");
  }
}

function sameIdentity(
  expected: ResidentProcessIdentity,
  actual: ResidentProcessIdentity
): boolean {
  return expected.pid === actual.pid &&
    expected.processGroupId === actual.processGroupId &&
    expected.bootId === actual.bootId &&
    expected.startTicks === actual.startTicks;
}

function validateTurn(turn: ResidentTurn): void {
  for (const [label, value] of [
    ["inputId", turn.inputId],
    ["invocationId", turn.invocationId],
    ["prompt", turn.prompt],
    ...("nativeCodexProfileHome" in turn.route
      ? [["native profile home", turn.route.nativeCodexProfileHome], ["native authority", turn.route.authorityId]] as const
      : [["route base URL", turn.route.baseUrl], ["route token", turn.route.token]] as const)
  ] as const) {
    if (!value || value.length > 1_000_000 || value.includes("\0")) {
      throw contractError(`Resident turn has an invalid ${label}`);
    }
  }
  if (turn.durableRehydrate) {
    if (!/^[a-f0-9]{64}$/i.test(turn.durableRehydrate.sourceDigest) ||
      !Number.isSafeInteger(turn.durableRehydrate.lastBusinessTurn) ||
      turn.durableRehydrate.lastBusinessTurn < 0 ||
      !turn.durableRehydrate.lastInputId ||
      typeof turn.durableRehydrate.transcript !== "string" ||
      turn.durableRehydrate.transcript.includes("\0") ||
      turn.durableRehydrate.transcript.length > 8 * 1024 * 1024 ||
      createHash("sha256").update(turn.durableRehydrate.transcript).digest("hex") !==
        turn.durableRehydrate.sourceDigest) {
      throw contractError("Resident durable rehydrate metadata is invalid");
    }
  }
}

function assertExecutionId(value: string): void {
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,511}$/.test(value)) {
    throw contractError("Invalid resident execution id");
  }
}

function assertEpoch(value: number): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw contractError("Resident ownership epoch must be a non-negative integer");
  }
}

function leaseKey(executionId: string, harnessId: HarnessId): string {
  return `${executionId}\0${harnessId}`;
}

function namespaceId(status: string, name: "NSpid" | "NSpgid"): number | undefined {
  const raw = status.match(new RegExp(`^${name}:\\s+(.+)$`, "m"))?.[1];
  const value = Number.parseInt(raw?.trim().split(/\s+/).at(-1) ?? "", 10);
  return Number.isSafeInteger(value) && value > 1 ? value : undefined;
}

async function resolveProcPid(pid: number): Promise<number> {
  const pidNamespace = await fs.readlink("/proc/self/ns/pid");
  try {
    const [status, candidateNamespace] = await Promise.all([
      fs.readFile(`/proc/${pid}/status`, "utf8"),
      fs.readlink(`/proc/${pid}/ns/pid`)
    ]);
    if (candidateNamespace === pidNamespace &&
      (namespaceId(status, "NSpid") ?? pid) === pid) return pid;
  } catch { /* The caller may see a nested namespace PID. */ }
  const entries = await fs.readdir("/proc");
  for (const entry of entries) {
    if (!/^\d+$/.test(entry)) continue;
    try {
      const [status, candidateNamespace] = await Promise.all([
        fs.readFile(`/proc/${entry}/status`, "utf8"),
        fs.readlink(`/proc/${entry}/ns/pid`)
      ]);
      if (candidateNamespace === pidNamespace && namespaceId(status, "NSpid") === pid) {
        return Number.parseInt(entry, 10);
      }
    } catch { /* Process exited during the scan. */ }
  }
  throw contractError("Resident process PID is not present in the current process namespace");
}

function touch(lease: ResidentProcessLease): void {
  lease.lastActivityAt = new Date().toISOString();
}

function terminalLeaseState(state: ResidentLeaseState): boolean {
  return state === "stopped" || state === "crashed";
}

function cloneLease(lease: ResidentProcessLease): ResidentProcessLease {
  return structuredClone(lease);
}

function staleControlError(): HarnessRuntimeError {
  return contractError("Resident Harness control sequence is stale or already acknowledged");
}

function contractError(message: string, cause?: unknown): HarnessRuntimeError {
  return new HarnessRuntimeError(
    "HARNESS_CONTRACT_VIOLATION",
    message,
    {},
    { source: "process", cause: cause instanceof Error ? cause : undefined }
  );
}

/** Adapter-owned protocol preparation; common ProcessHost retains launch authority. */
export interface ResidentAdapterLaunchRequest extends ResidentScopeOpenRequest {
  adapter: HarnessAdapter;
  executable: string;
  processHost: ResidentProcessLauncher;
  inactivityPolicy?: Partial<ResidentInactivityPolicy>;
}
export interface ResidentAdapterLaunchDefinition {
  plan: LaunchPlan;
  codec: ResidentProtocolCodec;
  unstartedReservation?: true;
}
