import { constants, closeSync, fstatSync, fsyncSync, lstatSync, openSync, readSync, realpathSync, writeSync, type BigIntStats } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { DatabaseSync } from "node:sqlite";
import { tryLock } from "fs-native-extensions";
import { CollaborationStateError } from "./errors.js";

interface FileIdentity { device: string; inode: string }
export interface WriterOwnerBinding {
  protocol: "scienceevolve-writer-owner-v1";
  database: FileIdentity;
  parent: FileIdentity;
  lock: FileIdentity;
  lockId: string;
}
export interface WriterOwnerAttachment {
  databasePath: string;
  binding: WriterOwnerBinding;
  /** A process-local fd and shared gate, never a serialized cross-process token. */
  descriptor: number;
  processId: number;
  gate: SharedArrayBuffer;
  connection: SharedArrayBuffer;
}
const PROTOCOL = "scienceevolve-writer-owner-v1";
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const identities = new WeakSet<WriterOwner>();
function invalid(message: string): CollaborationStateError {
  return new CollaborationStateError("UNSAFE_CONFIGURATION", message);
}
function fileIdentity(stat: BigIntStats): FileIdentity { return { device: String(stat.dev), inode: String(stat.ino) }; }
function regular(stat: BigIntStats, name: string): BigIntStats {
  if (!stat.isFile() || stat.nlink !== 1n || stat.ino === 0n) throw invalid(`${name} must be a regular single-link file with a stable file identity`);
  return stat;
}
function equalIdentity(stat: BigIntStats, identity: FileIdentity, name: string): void {
  if (!isDeepStrictEqual(fileIdentity(stat), identity)) throw invalid(`${name} identity changed; stop all writers and use the offline restore procedure`);
}
export function decodeWriterOwnerBinding(value: unknown): WriterOwnerBinding {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw invalid("Writer owner identity binding is missing");
  const binding = value as WriterOwnerBinding;
  if (!isDeepStrictEqual(Object.keys(binding).sort(), ["database", "lock", "lockId", "parent", "protocol"].sort()) ||
      binding.protocol !== PROTOCOL || typeof binding.lockId !== "string" || !uuid.test(binding.lockId)) throw invalid("Invalid writer owner identity binding");
  for (const name of ["database", "parent", "lock"] as const) {
    const id = binding[name];
    if (!id || typeof id !== "object" || !isDeepStrictEqual(Object.keys(id).sort(), ["device", "inode"]) ||
        typeof id.device !== "string" || typeof id.inode !== "string" ||
        !/^(0|[1-9][0-9]*)$/.test(id.device) || !/^[1-9][0-9]*$/.test(id.inode)) throw invalid(`Invalid writer ${name} identity`);
  }
  return structuredClone(binding);
}
function lockFlags(): number {
  if (process.platform === "win32") return constants.O_RDWR;
  if (typeof constants.O_NOFOLLOW !== "number" || typeof constants.O_NONBLOCK !== "number") throw invalid("Writer locks require no-follow and nonblocking filesystem open support");
  return constants.O_RDWR | constants.O_NOFOLLOW | constants.O_NONBLOCK;
}
function readBinding(fd: number): WriterOwnerBinding {
  const size = fstatSync(fd, { bigint: true }).size;
  if (size < 1n || size > 2048n) throw invalid("Writer lock has a missing or invalid identity header");
  const bytes = Buffer.alloc(Number(size));
  if (readSync(fd, bytes, 0, bytes.length, 0) !== bytes.length) throw invalid("Writer lock identity could not be read completely");
  const binding = decodeWriterOwnerBinding(JSON.parse(bytes.toString("utf8")));
  if (!bytes.equals(Buffer.from(JSON.stringify(binding) + "\n"))) throw invalid("Writer lock identity header is not canonical UTF-8");
  return binding;
}
function canonicalDatabase(input: string): string {
  if (!input.trim() || input.includes("\0") || input === ":memory:" || input.startsWith("file:")) throw invalid("Writer ownership requires a durable filesystem SQLite path");
  const absolute = path.resolve(input);
  try { return realpathSync(absolute); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    // A dangling symlink is not a new database. It must not choose another lock.
    try { lstatSync(absolute); throw invalid("Database symlink target is missing"); }
    catch (missing) { if ((missing as NodeJS.ErrnoException).code !== "ENOENT") throw missing; }
    return path.join(realpathSync(path.dirname(absolute)), path.basename(absolute));
  }
}
function syncParent(parent: string): void {
  // Windows file handles are flushed by fsync; directories cannot be opened
  // with Node's ordinary fs.open on Windows. No Windows durability claim is
  // made without its platform acceptance.
  if (process.platform === "win32") return;
  const fd = openSync(parent, constants.O_RDONLY);
  try { fsyncSync(fd); } finally { closeSync(fd); }
}

/** Lifecycle authority: no expiry, retries, lock deletion or automatic rebind. */
export class WriterOwner {
  readonly databasePath: string;
  readonly #descriptor: number;
  readonly #binding: WriterOwnerBinding;
  readonly #gate: Int32Array;
  readonly #ownsDescriptor: boolean;
  readonly #connections = new Set<SharedArrayBuffer>();
  #connection?: Int32Array;
  #closed = false;
  #failure?: Error;

  private constructor(databasePath: string, descriptor: number, binding: WriterOwnerBinding, gate: Int32Array, ownsDescriptor: boolean) {
    this.databasePath = databasePath; this.#descriptor = descriptor; this.#binding = binding;
    this.#gate = gate; this.#ownsDescriptor = ownsDescriptor; identities.add(this);
  }
  static open(databasePath: string, options: { offlineUpgrade?: true; createOnly?: never } | { createOnly: true; offlineUpgrade?: never } = {}): WriterOwner {
    const canonical = canonicalDatabase(databasePath), parent = path.dirname(canonical), lockPath = canonical + ".writer.lock";
    let databaseStat: BigIntStats | undefined;
    try { databaseStat = regular(lstatSync(canonical, { bigint: true }), "Database"); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    let existingLock: BigIntStats | undefined;
    try { existingLock = regular(lstatSync(lockPath, { bigint: true }), "Writer lock"); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    if (options.createOnly && (databaseStat || existingLock)) throw invalid("Offline restore requires a new database and lock path");
    if (!databaseStat) for (const suffix of ["-journal", "-wal", "-shm"]) {
      try { lstatSync(canonical + suffix); throw invalid("Cannot provision a database over existing SQLite journal files"); }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    }
    const provision = !databaseStat || options.offlineUpgrade === true && !existingLock;
    if (options.offlineUpgrade && !databaseStat) throw invalid("Offline upgrade requires an existing database");
    if (options.offlineUpgrade) {
      const reader = new DatabaseSync(canonical, { readOnly: true });
      try {
        const meta = reader.prepare("SELECT schema_version FROM collaboration_state_meta WHERE singleton=1").get();
        if (!meta || typeof meta.schema_version !== "number" || !Number.isSafeInteger(meta.schema_version) || meta.schema_version < 1 || meta.schema_version > 29)
          throw invalid("Offline upgrade requires a legacy schema 1–29 database");
      } finally { reader.close(); }
    }
    const parentStat = lstatSync(parent, { bigint: true });
    if (!parentStat.isDirectory() || parentStat.ino === 0n) throw invalid("Database parent has no usable directory identity");
    if (!provision) {
      try { regular(lstatSync(lockPath, { bigint: true }), "Writer lock"); }
      catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT")
          throw new CollaborationStateError("WRITER_UPGRADE_REQUIRED", "Collaboration writer lock is missing; inspect the database and use the explicit offline upgrade/restore procedure, never automatic takeover");
        throw error;
      }
    }
    const descriptor = openSync(lockPath, lockFlags() | (provision ? constants.O_CREAT | constants.O_EXCL : 0), 0o600);
    try {
      const locked = regular(fstatSync(descriptor, { bigint: true }), "Writer lock descriptor");
      equalIdentity(regular(lstatSync(lockPath, { bigint: true }), "Writer lock"), fileIdentity(locked), "Opened writer lock");
      if (!tryLock(descriptor)) throw new CollaborationStateError("WRITER_LEASE_HELD", "Another live collaboration writer owns this database");
      if (provision) {
        if (!databaseStat) {
          const databaseFd = openSync(canonical, lockFlags() | constants.O_CREAT | constants.O_EXCL, 0o600);
          try { fsyncSync(databaseFd); databaseStat = regular(fstatSync(databaseFd, { bigint: true }), "Database"); }
          finally { closeSync(databaseFd); }
        }
      }
      const stored = provision ? undefined : readBinding(descriptor);
      const binding: WriterOwnerBinding = { protocol: PROTOCOL, database: fileIdentity(databaseStat!), parent: fileIdentity(parentStat),
        lock: fileIdentity(locked), lockId: stored?.lockId ?? randomUUID() };
      if (provision) {
        const header = Buffer.from(JSON.stringify(binding) + "\n");
        if (writeSync(descriptor, header, 0, header.length, 0) !== header.length) throw invalid("Incomplete writer lock identity write");
        fsyncSync(descriptor); syncParent(parent);
      } else {
        if (!isDeepStrictEqual(binding, stored)) throw invalid("Writer lock header does not match the database/lock filesystem identity");
        // The immutable sidecar binds physical identity before SQLite may
        // recover a hot journal. No DDL or authority mutation occurs here.
        const reader = new DatabaseSync(canonical);
        try {
          const metadata = reader.prepare("SELECT schema_version FROM collaboration_state_meta WHERE singleton=1").get();
          const version = metadata?.schema_version;
          if (typeof version !== "number" || !Number.isSafeInteger(version) || version < 1)
            throw new CollaborationStateError("DATABASE_INTEGRITY_FAILED", "Collaboration database has missing or invalid schema authority metadata");
          if (version > 30) throw invalid(`Unsupported collaboration state schema ${version}`);
          if (version < 30 && !options.offlineUpgrade) throw new CollaborationStateError("WRITER_UPGRADE_REQUIRED", "Collaboration database requires an offline writer protocol upgrade");
          if (version === 30) {
            const row = reader.prepare("SELECT identity_json FROM writer_service_owner WHERE singleton=1").get();
            if (!row || typeof row.identity_json !== "string") throw invalid("Writer ownership metadata is missing");
            if (!isDeepStrictEqual(binding, decodeWriterOwnerBinding(JSON.parse(row.identity_json))))
              throw invalid("Acquired writer identity does not match the database binding");
          }
        } finally { reader.close(); }
      }
      const owner = new WriterOwner(canonical, descriptor, binding, new Int32Array(new SharedArrayBuffer(12)), true);
      owner.assertHeld();
      return owner;
    } catch (error) {
      try { closeSync(descriptor); } catch (cleanup) { throw new AggregateError([error, cleanup], "Writer acquisition and cleanup failed"); }
      throw error;
    }
  }
  static attach(input: WriterOwnerAttachment): WriterOwner {
    if (input.processId !== process.pid || !Number.isInteger(input.descriptor) || input.descriptor < 0 ||
        !(input.gate instanceof SharedArrayBuffer) || input.gate.byteLength !== 12 ||
        !(input.connection instanceof SharedArrayBuffer) || input.connection.byteLength !== 4) throw invalid("Writer attachment must share the exact local owner capability");
    const connection = new Int32Array(input.connection);
    const owner = new WriterOwner(input.databasePath, input.descriptor, decodeWriterOwnerBinding(input.binding), new Int32Array(input.gate), false);
    if (Atomics.compareExchange(connection, 0, 0, 1) !== 0) throw invalid("Writer connection capability was already consumed");
    owner.#connection = connection;
    try { owner.assertHeld(); return owner; }
    catch (error) { owner.close(); throw error; }
  }
  attachment(): WriterOwnerAttachment {
    this.assertHeld();
    const connection = new SharedArrayBuffer(4);
    this.#connections.add(connection);
    Atomics.add(this.#gate, 1, 1);
    return { databasePath: this.databasePath, binding: this.binding(), descriptor: this.#descriptor, processId: process.pid,
      gate: this.#gate.buffer as SharedArrayBuffer, connection };
  }
  /** Only after the exact child Worker has terminated, or failed to start. */
  detachTerminatedWorker(attachment: WriterOwnerAttachment): void {
    if (!this.#connections.delete(attachment.connection)) throw invalid("Unknown writer Worker connection capability");
    if (Atomics.exchange(new Int32Array(attachment.connection), 0, 2) !== 2) Atomics.sub(this.#gate, 1, 1);
  }
  binding(): WriterOwnerBinding { return structuredClone(this.#binding); }
  assertConnection(database: DatabaseSync): void {
    this.assertHeld();
    const location = database.location();
    if (!location || path.resolve(location) !== this.databasePath)
      throw invalid("SQLite connection does not match the locked database");
  }
  /** Exactly one acquisition for this descriptor lifetime, including its Workers. */
  claimAcquisition(database: DatabaseSync): void {
    this.assertConnection(database);
    if (Atomics.compareExchange(this.#gate, 2, 0, 1) !== 0)
      throw invalid("Writer epoch acquisition was already claimed; attached connections require the current token");
  }
  assertHeld(): void {
    if (!identities.has(this) || this.#closed || Atomics.load(this.#gate, 0) !== 0 ||
        this.#connection && Atomics.load(this.#connection, 0) !== 1) {
      throw this.#failure ?? new CollaborationStateError("WRITER_LEASE_STALE", "Writer owner is fenced or closed");
    }
    try {
      if (realpathSync(this.databasePath) !== this.databasePath) throw invalid("Canonical database identity changed");
      equalIdentity(lstatSync(path.dirname(this.databasePath), { bigint: true }), this.#binding.parent, "Database parent");
      equalIdentity(regular(lstatSync(this.databasePath, { bigint: true }), "Database"), this.#binding.database, "Database");
      equalIdentity(regular(lstatSync(this.databasePath + ".writer.lock", { bigint: true }), "Writer lock"), this.#binding.lock, "Writer lock");
      equalIdentity(regular(fstatSync(this.#descriptor, { bigint: true }), "Writer descriptor"), this.#binding.lock, "Writer descriptor");
      if (!isDeepStrictEqual(readBinding(this.#descriptor), this.#binding)) throw invalid("Writer lock identity header changed");
    } catch (error) { this.fence(error); throw error; }
  }
  fence(error: unknown): void {
    this.#failure ??= error instanceof Error ? error : new Error("Writer ownership failed", { cause: error });
    Atomics.store(this.#gate, 0, 1);
  }
  assertCanClose(): void {
    if (this.#ownsDescriptor && Atomics.load(this.#gate, 1) !== 0) throw invalid("Writer owner cannot close while attached connections remain");
  }
  /** Caller must first close every SQLite connection and await Worker/callback drain. */
  close(): void {
    if (this.#closed) return;
    this.assertCanClose();
    if (this.#ownsDescriptor) {
      Atomics.store(this.#gate, 0, 1); closeSync(this.#descriptor);
    } else if (this.#connection && Atomics.exchange(this.#connection, 0, 2) !== 2) Atomics.sub(this.#gate, 1, 1);
    this.#closed = true;
  }
}
