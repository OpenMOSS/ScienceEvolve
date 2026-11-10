import { AsyncLocalStorage } from "node:async_hooks";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { Worker, MessageChannel, isMainThread, parentPort, receiveMessageOnPort, workerData, type MessagePort } from "node:worker_threads";
import type { CollaborationStateDatabase } from "./store.js";
import type { CollaborationStateOpenOptions, DatabaseHealth } from "./contracts.js";
import * as stateErrors from "./errors.js";
import * as gitErrors from "../collaboration-git/errors.js";
import { ZodError } from "zod";

type Methods = Omit<CollaborationStateDatabase, "health" | "operationsForProject" | "bindWriterAvailabilityCheck">;
/** Local state-machine tests may use the same interface without a thread. */
export type CollaborationStateStore = {
  [K in keyof Methods]: Methods[K] extends (...args: infer A) => infer R ? (...args: A) => R | Promise<R> : Methods[K]
} & Pick<CollaborationStateDatabase, "health" | "operationsForProject"> & {
  bindWriterAvailabilityCheck(check: () => void, heartbeat?: SharedArrayBuffer): void | Promise<void>;
};
export type AsyncCollaborationStateStore = {
  [K in keyof Methods]: Methods[K] extends (...args: infer A) => infer R ? (...args: A) => Promise<R> : Methods[K]
} & Pick<CollaborationStateDatabase, "health" | "operationsForProject"> & {
  bindWriterAvailabilityCheck(check: () => void, heartbeat?: SharedArrayBuffer): Promise<void>;
};

interface SavedError { name: string; message: string; stack?: string; properties: Record<string, unknown>; cause?: SavedError }
function saveError(value: unknown): SavedError {
  const error = value instanceof Error ? value : new Error(String(value));
  const properties = Object.fromEntries(Object.entries(error).filter(([key]) => key !== "cause"));
  if (error instanceof ZodError) properties.issues = error.issues;
  return { name: error.name, message: error.message, stack: error.stack, properties,
    ...(error.cause instanceof Error ? { cause: saveError(error.cause) } : {}) };
}
function restoreError(saved: SavedError): Error {
  const constructors = { ...stateErrors, ...gitErrors, ZodError } as Record<string, { prototype: Error }>;
  const error = new Error(saved.message, saved.cause ? { cause: restoreError(saved.cause) } : undefined);
  const constructor = Object.hasOwn(constructors, saved.name) ? constructors[saved.name] : undefined;
  if (constructor) Object.setPrototypeOf(error, constructor.prototype);
  Object.assign(error, saved.properties, { name: saved.name, stack: saved.stack });
  return error;
}

type Input = {
  protocol: "collaboration-database-v1";
  clock?: SharedArrayBuffer;
  gate: SharedArrayBuffer;
} & ({ mode: "writer"; options: Omit<CollaborationStateOpenOptions, "now" | "transactionFault"> }
  | { mode: "documents"; databasePath: string });
interface Request { id: number; method: string; args: unknown[]; operations?: unknown[] }
type Reply = { kind: "ready"; health?: DatabaseHealth } | { kind: "result"; id: number; value?: unknown; error?: SavedError }
  | { kind: "fatal"; error: SavedError } | { kind: "callback"; id: number; callbackId: number; args: unknown[]; port: MessagePort; signal: SharedArrayBuffer };

/** Every request executes once in FIFO order; loss of a reply never resends it. */
class DatabaseWorkerClient {
  readonly worker: Worker;
  readonly gate = new Int32Array(new SharedArrayBuffer(4));
  readonly clock?: BigInt64Array;
  readonly callbacks = new Map<number, (...args: unknown[]) => unknown>();
  readonly pending = new Map<number, { resolve(value: unknown): void; reject(error: Error): void; callbacks: number[] }>();
  readonly callbackContext = new AsyncLocalStorage<boolean>();
  readonly ready: Promise<DatabaseHealth | undefined>;
  private sequence = 0;
  private callbackSequence = 0;
  private closed = false;
  private failure?: Error;
  private availabilityBound = false;
  private health?: DatabaseHealth;

  constructor(configuration: { mode: "writer"; options: CollaborationStateOpenOptions } | { mode: "documents"; databasePath: string },
    private readonly onFailure?: (error: Error) => void) {
    if (configuration.mode === "writer" && configuration.options.transactionFault)
      throw new Error("Database worker does not accept synchronous transaction fault hooks");
    this.now = configuration.mode === "writer" ? configuration.options.now : undefined;
    if (this.now) this.clock = new BigInt64Array(new SharedArrayBuffer(8));
    this.updateClock();
    let input: Input;
    if (configuration.mode === "writer") {
      const { now: _now, transactionFault: _fault, ...options } = configuration.options;
      input = { protocol: "collaboration-database-v1", mode: "writer", options, gate: this.gate.buffer,
        ...(this.clock ? { clock: this.clock.buffer as SharedArrayBuffer } : {}) };
    } else input = { protocol: "collaboration-database-v1", mode: "documents", databasePath: configuration.databasePath, gate: this.gate.buffer };
    const register = import.meta.url.endsWith(".ts")
      ? `const { register } = await import(${JSON.stringify(pathToFileURL(createRequire(import.meta.url).resolve("tsx/esm/api")).href)}); register();` : "";
    const entry = new URL("data:text/javascript," + encodeURIComponent(`${register} await import(${JSON.stringify(import.meta.url)});`));
    this.worker = new Worker(entry, { workerData: input });
    this.ready = new Promise((resolve, reject) => {
      this.worker.on("message", (reply: Reply) => {
        if (reply.kind === "ready") { this.health = reply.health; resolve(reply.health); this.releaseIdle(); }
        else if (reply.kind === "fatal") { const error = restoreError(reply.error); reject(error); this.fail(error); }
        else if (reply.kind === "callback") void this.callback(reply);
        else {
          const pending = this.pending.get(reply.id);
          if (!pending) return;
          this.pending.delete(reply.id);
          for (const id of pending.callbacks) this.callbacks.delete(id);
          if (reply.error) pending.reject(restoreError(reply.error)); else pending.resolve(reply.value);
          this.releaseIdle();
        }
      });
      this.worker.on("error", error => { reject(error); this.fail(error); });
      this.worker.on("exit", code => {
        if (this.closed && !this.pending.size) return;
        const error = new Error(`Collaboration database worker exited (${code}); pending operation results are unconfirmed and were not retried`);
        reject(error); this.fail(error);
      });
    });
  }
  private readonly now?: () => number;
  private updateClock(): void { if (this.clock) Atomics.store(this.clock, 0, BigInt(Math.trunc(this.now!()))); }
  private releaseIdle(): void { if (!this.pending.size) this.worker.unref(); }
  private fail(error: Error): void {
    if (this.failure) return;
    this.failure = error; Atomics.store(this.gate, 0, 1);
    for (const pending of this.pending.values()) pending.reject(error);
    this.pending.clear(); this.callbacks.clear(); this.onFailure?.(error);
  }
  private encode(value: unknown, callbacks: number[]): unknown {
    if (typeof value === "function") {
      const callbackId = ++this.callbackSequence; callbacks.push(callbackId);
      this.callbacks.set(callbackId, value as (...args: unknown[]) => unknown);
      return { protocol: "database-callback-v1", callbackId };
    }
    if (Array.isArray(value)) return value.map(item => this.encode(item, callbacks));
    if (value && Object.getPrototypeOf(value) === Object.prototype)
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, this.encode(item, callbacks)]));
    return value;
  }
  private async callback(reply: Extract<Reply, { kind: "callback" }>): Promise<void> {
    try {
      const callback = this.callbacks.get(reply.callbackId);
      if (!callback) throw new Error("Database callback no longer belongs to a pending request");
      const value = await this.callbackContext.run(true, () => callback(...reply.args));
      reply.port.postMessage({ value });
    } catch (error) { reply.port.postMessage({ error: saveError(error) }); }
    finally {
      this.updateClock();
      Atomics.store(new Int32Array(reply.signal), 0, 1); Atomics.notify(new Int32Array(reply.signal), 0); reply.port.close();
    }
  }
  async request(method: string, args: unknown[], operations?: unknown[]): Promise<unknown> {
    if (this.callbackContext.getStore()) throw new Error("A database publication callback cannot issue a nested database request");
    await this.ready;
    if (this.failure) throw this.failure;
    if (this.closed) throw new Error("Collaboration database worker is closed");
    this.updateClock();
    const id = ++this.sequence, callbacks: number[] = [];
    const encoded = this.encode(args, callbacks) as unknown[];
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject, callbacks }); this.worker.ref();
      try { this.worker.postMessage({ id, method, args: encoded, ...(operations ? { operations } : {}) } satisfies Request); }
      catch (error) {
        this.pending.delete(id); for (const callback of callbacks) this.callbacks.delete(callback);
        this.releaseIdle(); reject(error);
      }
    });
  }
  async close(): Promise<void> {
    if (this.closed) return;
    try { if (!this.failure) await this.request("close", []); }
    finally { this.closed = true; await this.worker.terminate(); }
  }
  proxy(): AsyncCollaborationStateStore {
    return new Proxy({} as AsyncCollaborationStateStore, { get: (target, key) => {
      if (Object.hasOwn(target, key)) return Reflect.get(target, key);
      if (key === "then" || key === "toJSON" || typeof key !== "string") return undefined;
      if (Object.hasOwn(Object.prototype, key)) return Reflect.get(target, key);
      if (key === "health") return this.health;
      if (key === "close") return () => this.close();
      if (key === "bindWriterAvailabilityCheck") return async (check: () => void, heartbeat?: SharedArrayBuffer) => {
        if (this.availabilityBound) throw new Error("Writer availability check is already bound");
        check(); this.availabilityBound = true;
        await this.request("bindHeartbeat", heartbeat ? [heartbeat] : []);
      };
      if (key === "operationsForProject") return (...binding: unknown[]) => new Proxy({}, {
        get: (_store, method) => method === "then" || method === "toJSON" || typeof method !== "string" ? undefined
          : (...args: unknown[]) => this.request(method, args, binding)
      });
      const method = (...args: unknown[]) => this.request(String(key), args);
      Object.defineProperty(target, key, { value: method, writable: true, configurable: true });
      return method;
    } });
  }
}

export async function openCollaborationStateWorker(options: CollaborationStateOpenOptions,
  onFailure?: (error: Error) => void): Promise<AsyncCollaborationStateStore> {
  const client = new DatabaseWorkerClient({ mode: "writer", options }, onFailure);
  try { await client.ready; return client.proxy(); }
  catch (error) { await client.close(); throw error; }
}

/** Independent readers have no writer lease or schema migration capability. */
export function projectStateDocumentReader(databasePath: string) {
  let client: DatabaseWorkerClient | undefined;
  let idle: NodeJS.Immediate | undefined;
  return {
    request: async (method: "domain" | "read", args: unknown[]) => {
      if (idle) clearImmediate(idle);
      client ??= new DatabaseWorkerClient({ mode: "documents", databasePath });
      const current = client;
      try { return await current.request(method, args); }
      finally {
        idle = setImmediate(() => {
          if (client !== current || current.pending.size) return;
          client = undefined;
          void current.close().catch(error => console.warn("Read-only database worker cleanup failed", error.message));
        });
        idle.unref();
      }
    },
    close: async () => { if (idle) clearImmediate(idle); await client?.close(); client = undefined; }
  };
}

function decode(value: unknown, requestId: number): unknown {
  if (Array.isArray(value)) return value.map(item => decode(item, requestId));
  if (value && Object.getPrototypeOf(value) === Object.prototype) {
    const record = value as Record<string, unknown>;
    if (record.protocol === "database-callback-v1" && typeof record.callbackId === "number") return (...args: unknown[]) => {
      const channel = new MessageChannel(), signal = new Int32Array(new SharedArrayBuffer(4));
      try {
        parentPort!.postMessage({ kind: "callback", id: requestId, callbackId: record.callbackId as number, args,
          port: channel.port2, signal: signal.buffer } satisfies Reply, [channel.port2]);
        Atomics.wait(signal, 0, 0);
        const result = receiveMessageOnPort(channel.port1)?.message as { value?: unknown; error?: SavedError } | undefined;
        if (!result) throw new Error("Database callback completed without its result");
        if (result.error) throw restoreError(result.error);
        return result.value;
      } finally { channel.port1.close(); }
    };
    return Object.fromEntries(Object.entries(record).map(([key, item]) => [key, decode(item, requestId)]));
  }
  return value;
}

async function runDatabaseWorker(input: Input): Promise<void> {
  const gate = new Int32Array(input.gate), clock = input.clock ? new BigInt64Array(input.clock) : undefined;
  let heartbeat: BigInt64Array | undefined;
  let database: CollaborationStateDatabase | undefined;
  let documents: ReturnType<typeof import("../project-state-documents.js")["readOnlyProjectStateDocumentsSync"]> | undefined;
  try {
    if (input.mode === "writer") {
      const { CollaborationStateDatabase } = await import("./store.js");
      database = CollaborationStateDatabase.open({ ...input.options,
        ...(clock ? { now: () => Number(Atomics.load(clock, 0)) } : {}) });
      database.bindWriterAvailabilityCheck(() => {
        if (Atomics.load(gate, 0) || heartbeat && (Atomics.load(heartbeat, 0) !== 1n || Number(Atomics.load(heartbeat, 1)) <= Date.now()))
          throw new stateErrors.CollaborationStateError("WRITER_LEASE_STALE", "Collaboration writer heartbeat is no longer held");
      });
    } else {
      const { readOnlyProjectStateDocumentsSync } = await import("../project-state-documents.js");
      documents = readOnlyProjectStateDocumentsSync({ protocol: "project-state-v1", kind: "sqlite", databasePath: input.databasePath });
    }
    let queue = Promise.resolve();
    parentPort!.on("message", (request: Request) => { queue = queue.then(async () => {
      try {
        const args = decode(request.args, request.id) as unknown[];
        let value: unknown;
        if (request.method === "bindHeartbeat") { heartbeat = args[0] ? new BigInt64Array(args[0] as SharedArrayBuffer) : undefined; }
        else if (request.method === "close") database?.close();
        else {
          const target = request.operations ? database!.operationsForProject(...request.operations as Parameters<CollaborationStateDatabase["operationsForProject"]>) : database ?? documents!;
          const method = Reflect.get(target, request.method);
          if (typeof method !== "function" || request.method === "constructor") throw new Error(`Unknown database method: ${request.method}`);
          value = await Reflect.apply(method, target, args);
        }
        parentPort!.postMessage({ kind: "result", id: request.id, value } satisfies Reply);
      } catch (error) { parentPort!.postMessage({ kind: "result", id: request.id, error: saveError(error) } satisfies Reply); }
      if (request.method === "close") parentPort!.close();
    }); });
    parentPort!.postMessage({ kind: "ready", ...(database ? { health: database.health } : {}) } satisfies Reply);
  } catch (error) {
    try { database?.close(); } finally { parentPort!.postMessage({ kind: "fatal", error: saveError(error) } satisfies Reply); parentPort!.close(); }
  }
}

if (!isMainThread && workerData?.protocol === "collaboration-database-v1") void runDatabaseWorker(workerData as Input);
