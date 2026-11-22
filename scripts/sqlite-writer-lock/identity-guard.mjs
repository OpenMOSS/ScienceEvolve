import { constants, closeSync, fstatSync, fsyncSync, lstatSync, openSync, readSync, realpathSync, writeSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { tryLock } from "fs-native-extensions";

// S0 executable design: no product imports, schema migration or auto-repair.
const protocol = "scienceevolve-writer-identity-probe-v1";
const headerSize = 37; // UUID plus newline; immutable while the identity exists.

export class IdentityGuardError extends Error {
  constructor(code, message, options) {
    super(message, options);
    this.name = "IdentityGuardError";
    this.code = code;
  }
}
function invalid(message) { return new IdentityGuardError("OWNER_IDENTITY_INVALID", message); }
function requireFile(stat, label) {
  if (!stat.isFile() || stat.nlink !== 1n || stat.ino === 0n)
    throw invalid(`${label} must be a regular, single-link file with a usable file identity`);
  return stat;
}
function identity(stat) { return { device: String(stat.dev), inode: String(stat.ino) }; }
function sameFile(actual, expected, label) {
  if (!isDeepStrictEqual(identity(actual), expected)) throw invalid(`${label} identity changed`);
}
function validateBinding(binding) {
  if (!binding || Object.getPrototypeOf(binding) !== Object.prototype ||
      !isDeepStrictEqual(Object.keys(binding).sort(), ["database", "lock", "lockId", "parent", "protocol"].sort()) ||
      binding.protocol !== protocol || typeof binding.lockId !== "string" ||
      !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(binding.lockId))
    throw invalid("Invalid persisted identity binding");
  for (const key of ["database", "parent", "lock"]) {
    const value = binding[key];
    if (!value || Object.getPrototypeOf(value) !== Object.prototype ||
        !isDeepStrictEqual(Object.keys(value).sort(), ["device", "inode"]) ||
        typeof value.device !== "string" || typeof value.inode !== "string" ||
        !/^(0|[1-9][0-9]*)$/.test(value.device) || !/^[1-9][0-9]*$/.test(value.inode))
      throw invalid(`Invalid persisted ${key} identity`);
  }
}
function readHeader(fd) {
  const stat = fstatSync(fd, { bigint: true });
  if (stat.size !== BigInt(headerSize)) throw invalid("Lock identity header is missing or malformed");
  const bytes = Buffer.alloc(headerSize);
  if (readSync(fd, bytes, 0, headerSize, 0) !== headerSize) throw invalid("Incomplete lock identity header");
  const value = bytes.toString("utf8");
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}\n$/.test(value))
    throw invalid("Malformed lock identity header");
  return value.slice(0, -1);
}
function openFlags() {
  // Windows uses handle identity checks; POSIX additionally forbids symlink
  // following and blocking on a raced FIFO. Native locking is never optional.
  if (process.platform === "win32") return constants.O_RDWR;
  if (typeof constants.O_NOFOLLOW !== "number" || typeof constants.O_NONBLOCK !== "number")
    throw invalid("This platform has no validated no-follow/nonblocking open flags");
  return constants.O_RDWR | constants.O_NOFOLLOW | constants.O_NONBLOCK;
}

export class ProbeIdentityGuard {
  #fd;
  #binding;
  #failure;
  #closing;
  #closed = false;
  #databasePath;
  #parentPath;
  #lockPath;

  constructor(key, fd, databasePath, parentPath, lockPath, binding) {
    if (key !== protocolKey) throw new TypeError("Use the guarded acquire entrypoint");
    this.#fd = fd;
    this.#databasePath = databasePath;
    this.#parentPath = parentPath;
    this.#lockPath = lockPath;
    this.#binding = structuredClone(binding);
  }

  get databasePath() { return this.#databasePath; }
  get lockPath() { return this.#lockPath; }
  binding() { return structuredClone(this.#binding); }

  static acquire({ databasePath, expectedBinding, provision = false, afterInspect, afterLock }) {
    if (typeof databasePath !== "string" || !databasePath.trim() || databasePath.includes("\0") ||
        databasePath === ":memory:" || databasePath.startsWith("file:")) throw invalid("A durable existing database path is required");
    if (typeof provision !== "boolean" || (provision ? expectedBinding !== undefined : expectedBinding === undefined))
      throw invalid("Choose explicit fixture provisioning or supply an existing persisted binding");
    if (expectedBinding !== undefined) validateBinding(expectedBinding);
    const canonical = realpathSync(resolve(databasePath)), parent = dirname(canonical);
    const databaseStat = requireFile(lstatSync(canonical, { bigint: true }), "Database");
    const parentStat = lstatSync(parent, { bigint: true });
    if (!parentStat.isDirectory() || parentStat.ino === 0n) throw invalid("Database parent has no stable directory identity");
    const lockPath = canonical + ".writer.lock";
    if (!provision) {
      // Missing locks are not recreated for an existing binding.
      const lock = requireFile(lstatSync(lockPath, { bigint: true }), "Lock");
      sameFile(lock, expectedBinding.lock, "Persisted lock");
      sameFile(databaseStat, expectedBinding.database, "Persisted database");
      sameFile(parentStat, expectedBinding.parent, "Persisted parent");
    }
    // Test-only interleaving point between path inspection and descriptor open.
    afterInspect?.();
    const fd = openSync(lockPath, openFlags() | (provision ? constants.O_CREAT | constants.O_EXCL : 0), 0o600);
    try {
      const descriptor = requireFile(fstatSync(fd, { bigint: true }), "Lock descriptor");
      const named = requireFile(lstatSync(lockPath, { bigint: true }), "Lock path");
      sameFile(named, identity(descriptor), "Opened lock");
      if (!tryLock(fd)) throw new IdentityGuardError("OWNER_HELD", "Another owner holds this database lock");
      if (provision) {
        const bytes = Buffer.from(randomUUID() + "\n", "ascii");
        if (writeSync(fd, bytes, 0, bytes.length, 0) !== bytes.length) throw invalid("Incomplete lock identity write");
        fsyncSync(fd);
      }
      const binding = { protocol, database: identity(databaseStat), parent: identity(parentStat),
        lock: identity(descriptor), lockId: readHeader(fd) };
      if (!provision && !isDeepStrictEqual(binding, expectedBinding)) throw invalid("Persisted owner identity does not match the acquired lock");
      const guard = new ProbeIdentityGuard(protocolKey, fd, canonical, parent, lockPath, binding);
      // Test-only interleaving point: replacement must fail before return or SQL.
      afterLock?.();
      guard.assertHeld();
      return guard;
    } catch (error) {
      try { closeSync(fd); }
      catch (closeError) { throw new AggregateError([error, closeError], "Acquisition failed and descriptor cleanup also failed"); }
      throw error;
    }
  }

  assertHeld() {
    if (this.#closed) throw new IdentityGuardError("OWNER_CLOSED", "Owner guard is closed");
    if (this.#closing) throw new IdentityGuardError("OWNER_CLOSING", "Owner guard is draining");
    if (this.#failure) throw this.#failure;
    try {
      if (realpathSync(this.#databasePath) !== this.#databasePath) throw invalid("Canonical database path changed");
      const parent = lstatSync(this.#parentPath, { bigint: true });
      if (!parent.isDirectory()) throw invalid("Database parent is no longer a directory");
      sameFile(parent, this.#binding.parent, "Database parent");
      sameFile(requireFile(lstatSync(this.#databasePath, { bigint: true }), "Database"), this.#binding.database, "Database");
      sameFile(requireFile(lstatSync(this.#lockPath, { bigint: true }), "Lock"), this.#binding.lock, "Lock path");
      sameFile(requireFile(fstatSync(this.#fd, { bigint: true }), "Lock descriptor"), this.#binding.lock, "Lock descriptor");
      if (readHeader(this.#fd) !== this.#binding.lockId) throw invalid("Lock identity header changed");
    } catch (error) {
      this.fence(error);
      throw this.#failure;
    }
  }

  fence(error) {
    if (!(error instanceof Error)) throw new TypeError("An owner failure requires the original error");
    this.#failure ??= error;
  }

  close(drain) {
    if (this.#closing) return this.#closing;
    if (typeof drain !== "function") throw new TypeError("Closing an owner requires an explicit confirmed-drain callback");
    // Set closing before invoking user code; all reentrant calls see one drain.
    this.#closing = Promise.resolve().then(drain).then(() => {
      closeSync(this.#fd);
      this.#closed = true;
    }, error => {
      this.fence(error instanceof Error ? error : new Error("Owner drain failed", { cause: error }));
      throw error;
    });
    return this.#closing;
  }
}
const protocolKey = Symbol("S0 identity guard");
