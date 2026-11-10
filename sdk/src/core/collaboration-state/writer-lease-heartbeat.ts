import { DatabaseSync } from "node:sqlite";
import { Worker, MessageChannel, isMainThread, parentPort, receiveMessageOnPort, workerData, type MessagePort } from "node:worker_threads";
import type { WriterLeaseDiagnostics, WriterLeaseToken } from "./contracts.js";

type RenewalAttempt = NonNullable<WriterLeaseDiagnostics["lastRenewalAttempt"]>;
export interface HeartbeatDiagnostics extends WriterLeaseDiagnostics {
  heartbeat?: { intervalMs: number; scheduledAtMs: number; startedAtMs: number; delayMs: number };
  leaseCheck?: { durationMs: number; outcome: "held" | "busy" | "stale" | "failed"; error?: string };
  failedAt?: string;
}
type LeaseError = Error & { code?: string; errcode?: number; errstr?: string };
function staleLease(): LeaseError {
  return Object.assign(new Error("The collaboration writer lease expired or was replaced"), { code: "WRITER_LEASE_STALE" });
}

/** Both the business connection and the heartbeat use this exact renewal transaction. */
export function renewLeaseConnection(database: DatabaseSync, lease: WriterLeaseToken, durationMs: number, now: number,
  diagnostics: { lastRenewalAttempt?: RenewalAttempt }, stale: () => Error = staleLease, clock: () => number = () => now): WriterLeaseToken {
  const started = performance.now();
  let stage: RenewalAttempt["stage"] = "begin", began = false, succeeded = false;
  try {
    database.exec("BEGIN IMMEDIATE"); began = true; stage = "update";
    // Waiting for BEGIN must not allow an already expired token to renew.
    const renewalAt = Math.trunc(clock());
    const expiresAtMs = renewalAt + durationMs;
    const result = database.prepare(`UPDATE writer_service_lease SET expires_at_ms=?, renewed_at_ms=?
      WHERE singleton=1 AND service_id=? AND instance_id=? AND host_id=? AND epoch=? AND expires_at_ms>?`)
      .run(expiresAtMs, renewalAt, lease.serviceId, lease.instanceId, lease.hostId, lease.epoch, renewalAt);
    if (Number(result.changes) !== 1) throw stale();
    stage = "commit"; database.exec("COMMIT");
    if (clock() >= expiresAtMs) throw stale();
    succeeded = true;
    return { ...lease, expiresAtMs };
  } catch (error) {
    if (began) {
      try { if (database.isTransaction) database.exec("ROLLBACK"); } catch { /* Retain the original SQLite error. */ }
    }
    throw error;
  } finally {
    try { diagnostics.lastRenewalAttempt = { startedAtMs: now, durationMs: Math.max(0, performance.now() - started),
      stage, outcome: succeeded ? "succeeded" : "failed", transactionActive: database.isTransaction };
    } catch { /* Diagnostics cannot replace the original SQLite error. */ }
  }
}

interface HeartbeatInput {
  protocol: "collaboration-heartbeat-v1";
  databasePath: string;
  lease: WriterLeaseToken;
  leaseDurationMs: number;
  shared: SharedArrayBuffer;
  port: MessagePort;
}
interface HeartbeatMessage {
  kind: "ready" | "renewed" | "delayed" | "failed";
  diagnostics: HeartbeatDiagnostics;
  error?: { message: string; name: string; code?: string; errcode?: number; errstr?: string };
}

/** An attached connection can renew this instance's live token, never acquire or migrate a database. */
export class WriterLeaseHeartbeat {
  readonly #worker: Worker;
  readonly #port: MessagePort;
  readonly #shared: BigInt64Array;
  readonly #onFailure: (error: Error, diagnostics: HeartbeatDiagnostics) => void;
  #diagnostics: HeartbeatDiagnostics;
  #error?: Error;
  #stopping = false;
  #stopped?: Promise<void>;

  private constructor(input: Omit<HeartbeatInput, "protocol" | "port" | "shared">,
    onFailure: (error: Error, diagnostics: HeartbeatDiagnostics) => void) {
    this.#onFailure = onFailure;
    this.#diagnostics = { lease: input.lease, lastSuccessfulRenewalAtMs: null };
    this.#shared = new BigInt64Array(new SharedArrayBuffer(24));
    Atomics.store(this.#shared, 1, BigInt(input.lease.expiresAtMs));
    const channel = new MessageChannel(); this.#port = channel.port1;
    // A URL bootstrap supports CLI parents using --input-type while retaining
    // their runtime loaders and permission flags unchanged.
    const entry = new URL("data:text/javascript," + encodeURIComponent(`import ${JSON.stringify(import.meta.url)};`));
    this.#worker = new Worker(entry, { workerData: { ...input,
      protocol: "collaboration-heartbeat-v1", shared: this.#shared.buffer, port: channel.port2 }, transferList: [channel.port2] });
  }

  static async start(input: Omit<HeartbeatInput, "protocol" | "port" | "shared">,
    onFailure: (error: Error, diagnostics: HeartbeatDiagnostics) => void): Promise<WriterLeaseHeartbeat> {
    const heartbeat = new WriterLeaseHeartbeat(input, onFailure);
    try {
      await new Promise<void>((resolve, reject) => {
        heartbeat.#port.on("message", (message: HeartbeatMessage) => {
          heartbeat.accept(message);
          if (message.kind === "ready") resolve();
          if (message.kind === "failed") reject(heartbeat.#error);
        });
        heartbeat.#worker.on("error", error => { heartbeat.fail(error); reject(error); });
        heartbeat.#worker.on("exit", code => {
          heartbeat.drain();
          if (!heartbeat.#stopping && !heartbeat.#error) heartbeat.fail(new Error(`Writer lease heartbeat exited unexpectedly (${code})`));
          if (Atomics.load(heartbeat.#shared, 0) !== 1n) reject(heartbeat.#error ?? new Error("Writer lease heartbeat stopped before readiness"));
        });
      });
      heartbeat.#port.unref(); heartbeat.#worker.unref();
      return heartbeat;
    } catch (error) {
      try { await heartbeat.stop(); } catch { /* Cleanup must retain the original startup error. */ }
      throw error;
    }
  }

  private accept(message: HeartbeatMessage): void {
    this.#diagnostics = message.diagnostics;
    if (message.kind === "failed") {
      const raw = message.error!;
      this.fail(Object.assign(new Error(raw.message), raw));
    } else if (message.kind === "delayed") {
      console.warn("Collaboration writer lease renewal waiting for SQLite; original expiry remains enforced", message);
    }
  }
  private drain(): void {
    let received;
    while ((received = receiveMessageOnPort(this.#port))) this.accept(received.message as HeartbeatMessage);
  }
  private fail(error: Error): void {
    if (this.#error || this.#stopping) return;
    this.#error = error;
    this.#diagnostics.failedAt ??= new Date().toISOString();
    Atomics.store(this.#shared, 0, 2n);
    this.#onFailure(error, this.diagnostics());
  }
  diagnostics(): HeartbeatDiagnostics {
    return { ...structuredClone(this.#diagnostics), lease: { ...this.#diagnostics.lease,
      expiresAtMs: Number(Atomics.load(this.#shared, 1)) },
      lastSuccessfulRenewalAtMs: Number(Atomics.load(this.#shared, 2)) || null };
  }
  /** Share the actual renewal receipt with the separate business connection. */
  sharedState(): SharedArrayBuffer { return this.#shared.buffer as SharedArrayBuffer; }
  assertHeld(): void {
    // Synchronous receipt draining observes a worker failure even when the
    // business thread has not yet dispatched its MessagePort callbacks.
    this.drain();
    if (this.#error) throw this.#error;
    if (this.#stopping) throw staleLease();
    if (Atomics.load(this.#shared, 0) !== 1n || Number(Atomics.load(this.#shared, 1)) <= Date.now()) throw staleLease();
  }
  stop(): Promise<void> {
    if (this.#stopped) return this.#stopped;
    this.#stopping = true;
    this.#stopped = new Promise<void>(resolve => {
      if (this.#worker.threadId === -1) { this.#port.close(); resolve(); return; }
      // Awaited cleanup must keep an otherwise idle SDK process alive until
      // the attached SQLite connection and worker have actually closed.
      this.#worker.ref();
      const timer = setTimeout(() => { void this.#worker.terminate(); }, 6000);
      timer.unref();
      this.#worker.once("exit", () => { clearTimeout(timer); this.#port.close(); resolve(); });
      this.#worker.postMessage("stop");
    });
    return this.#stopped;
  }
}

function runHeartbeat(input: HeartbeatInput): void {
  const shared = new BigInt64Array(input.shared);
  let database: DatabaseSync | undefined, timer: NodeJS.Timeout | undefined;
  let diagnostics: HeartbeatDiagnostics = { lease: input.lease, lastSuccessfulRenewalAtMs: null };
  const intervalMs = Math.max(500, Math.floor(input.leaseDurationMs / 3));
  let scheduledAtMs = Date.now();
  let stopped = false;
  const send = (kind: HeartbeatMessage["kind"], error?: unknown) => {
    const raw = error as LeaseError | undefined;
    input.port.postMessage({ kind, diagnostics, ...(raw ? { error: { message: raw.message, name: raw.name,
      ...(raw.code ? { code: raw.code } : {}), ...(typeof raw.errcode === "number" ? { errcode: raw.errcode } : {}),
      ...(raw.errstr ? { errstr: raw.errstr } : {}) } } : {}) } satisfies HeartbeatMessage);
  };
  const stop = () => {
    if (stopped) return;
    stopped = true;
    if (timer) clearTimeout(timer);
    try { database?.close(); } finally { input.port.close(); parentPort?.close(); }
  };
  const fail = (error: unknown) => {
    diagnostics.failedAt = new Date().toISOString();
    send("failed", error); Atomics.store(shared, 0, 2n); stop();
  };
  const busy = (error: unknown) => typeof (error as LeaseError)?.errcode === "number" &&
    (((error as LeaseError).errcode! & 0xff) === 5);
  const waitWithinLease = () => {
    const remaining = diagnostics.lease.expiresAtMs - Date.now();
    if (remaining <= 0) throw staleLease();
    database!.exec(`PRAGMA busy_timeout=${Math.max(1, Math.min(5000, remaining))}`);
  };
  const schedule = (delayMs: number) => {
    if (stopped) return;
    scheduledAtMs = Date.now() + delayMs;
    timer = setTimeout(() => tick(), delayMs);
  };
  const tick = (first = false) => {
    const now = Date.now();
    diagnostics.heartbeat = { intervalMs, scheduledAtMs, startedAtMs: now, delayMs: Math.max(0, now - scheduledAtMs) };
    delete diagnostics.leaseCheck;
    try {
      waitWithinLease();
      diagnostics.lease = renewLeaseConnection(database!, diagnostics.lease, input.leaseDurationMs, now, diagnostics, staleLease, Date.now);
      diagnostics.lastSuccessfulRenewalAtMs = diagnostics.lease.expiresAtMs - input.leaseDurationMs;
      Atomics.store(shared, 1, BigInt(diagnostics.lease.expiresAtMs)); Atomics.store(shared, 2, BigInt(diagnostics.lastSuccessfulRenewalAtMs));
      Atomics.store(shared, 0, 1n); send(first ? "ready" : "renewed");
      schedule(intervalMs);
    } catch (error) {
      if (!first && busy(error) && !database!.isTransaction && diagnostics.lease.expiresAtMs > Date.now()) {
        const started = performance.now();
        let retry = false;
        try {
          waitWithinLease();
          const row = database!.prepare(`SELECT service_id,instance_id,host_id,epoch,expires_at_ms
            FROM writer_service_lease WHERE singleton=1`).get();
          const lease = diagnostics.lease;
          retry = row?.service_id === lease.serviceId && row.instance_id === lease.instanceId && row.host_id === lease.hostId &&
            Number(row.epoch) === lease.epoch && Number(row.expires_at_ms) > Date.now();
          diagnostics.leaseCheck = { durationMs: performance.now() - started, outcome: retry ? "held" : "stale" };
        } catch (checkError) {
          retry = busy(checkError);
          diagnostics.leaseCheck = { durationMs: performance.now() - started, outcome: retry ? "busy" : "failed",
            error: checkError instanceof Error ? checkError.message : String(checkError) };
        }
        const remaining = diagnostics.lease.expiresAtMs - Date.now();
        if (retry && remaining > 0) {
          // A blocked confirmation is not a renewed lease. Business mutations
          // still check the exact row, and the confirmed expiry never advances.
          send("delayed", error);
          schedule(Math.min(1000, intervalMs, remaining));
          return;
        }
      }
      fail(error);
    }
  };
  try {
    database = new DatabaseSync(input.databasePath);
    if (String(database.prepare("PRAGMA journal_mode").get()!.journal_mode).toLowerCase() !== "delete")
      throw new Error("Writer lease heartbeat requires DELETE journal mode");
    database.exec("PRAGMA synchronous=FULL; PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON; PRAGMA locking_mode=NORMAL;");
    parentPort!.on("message", message => { if (message === "stop") stop(); });
    tick(true);
  } catch (error) { fail(error); }
}

if (!isMainThread && workerData?.protocol === "collaboration-heartbeat-v1") runHeartbeat(workerData as HeartbeatInput);
