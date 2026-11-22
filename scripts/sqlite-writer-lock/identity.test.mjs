import assert from "node:assert/strict";
import { fork } from "node:child_process";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { closeSync, copyFileSync, existsSync, linkSync, mkdirSync, mkdtempSync, openSync, readFileSync,
  readdirSync, renameSync, rmSync, statSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { tryLock } from "fs-native-extensions";
import { ProbeIdentityGuard } from "./identity-guard.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const scratch = join(here, "../../.scratch/sqlite-writer-lock-validation");
mkdirSync(scratch, { recursive: true });
const digest = path => createHash("sha256").update(readFileSync(path)).digest("hex");
const noDrain = async () => {};
const replacedPath = process.platform === "win32" ? "POSIX replacement fixture; Windows replacement behavior still needs verification" : false;

const cleanups = new WeakMap();
function cleanup(t, callback) {
  if (!cleanups.has(t)) {
    const callbacks = [];
    cleanups.set(t, callbacks);
    t.after(async () => {
      const failures = [];
      for (const dispose of callbacks.reverse()) {
        try { await dispose(); } catch (error) { failures.push(error); }
      }
      if (failures.length) throw new AggregateError(failures, "Identity fixture cleanup failed");
    });
  }
  cleanups.get(t).push(callback);
}

function fixture(t) {
  const root = mkdtempSync(join(scratch, "identity-"));
  const databasePath = join(root, "state.sqlite");
  closeSync(openSync(databasePath, "wx", 0o600));
  const guards = [];
  cleanup(t, async () => {
    for (const guard of guards.reverse()) await guard.close(noDrain);
    rmSync(root, { recursive: true });
  });
  const acquire = options => {
    const guard = ProbeIdentityGuard.acquire({ databasePath, ...options });
    guards.push(guard);
    return guard;
  };
  const owner = acquire({ provision: true });
  const binding = owner.binding();
  return { root, databasePath, owner, binding, acquire, lockPath: owner.lockPath };
}

function rawContender(t, path) {
  const fd = openSync(path, "r+");
  cleanup(t, () => closeSync(fd));
  return () => tryLock(fd);
}

function next(channel) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => finish(new Error("Identity fixture did not reply within 10 seconds")), 10_000);
    const message = value => finish(undefined, value);
    const exit = code => finish(new Error(`Identity fixture exited before replying (${code})`));
    const error = error => finish(error);
    function finish(failure, value) {
      clearTimeout(timeout);
      channel.off("message", message); channel.off("exit", exit); channel.off("error", error);
      if (failure) reject(failure); else resolve(value);
    }
    channel.once("message", message); channel.once("exit", exit); channel.once("error", error);
  });
}
async function child(t, f) {
  const bindingPath = join(f.root, "fixture-binding.json");
  writeFileSync(bindingPath, JSON.stringify(f.binding));
  const process = fork(join(here, "identity-holder.mjs"), [JSON.stringify({ databasePath: f.databasePath, bindingPath })],
    { execArgv: [], stdio: ["ignore", "ignore", "pipe", "ipc"] });
  let stderr = "";
  process.stderr.on("data", bytes => { stderr += bytes; });
  cleanup(t, async () => {
    if (process.exitCode === null && process.signalCode === null) {
      const ended = once(process, "exit"); process.kill("SIGKILL"); await ended;
    }
  });
  try { return { process, reply: await next(process) }; }
  catch (error) { throw new Error(`${error.message}: ${stderr}`, { cause: error }); }
}

function persistBinding(owner) {
  owner.assertHeld();
  const sql = new DatabaseSync(owner.databasePath);
  try {
    sql.exec("PRAGMA journal_mode=DELETE; PRAGMA synchronous=FULL; BEGIN IMMEDIATE");
    owner.assertHeld();
    sql.exec("CREATE TABLE fixture_owner(singleton INTEGER PRIMARY KEY CHECK(singleton=1), binding TEXT NOT NULL, epoch INTEGER NOT NULL) STRICT");
    sql.prepare("INSERT INTO fixture_owner VALUES(1, ?, 1)").run(JSON.stringify(owner.binding()));
    sql.exec("CREATE TABLE fixture_receipts(id TEXT PRIMARY KEY, outcome TEXT NOT NULL) STRICT");
    sql.prepare("INSERT INTO fixture_receipts VALUES(?, ?)").run("original-session-and-effect", "unconfirmed");
    owner.assertHeld();
    sql.exec("COMMIT");
  } finally {
    if (sql.isTransaction) sql.exec("ROLLBACK");
    sql.close();
  }
}
function loadBinding(databasePath) {
  const sql = new DatabaseSync(databasePath, { readOnly: true });
  try { return JSON.parse(sql.prepare("SELECT binding FROM fixture_owner WHERE singleton=1").get().binding); }
  finally { sql.close(); }
}
function acquireAndAdvance(f) {
  const owner = f.acquire({ expectedBinding: loadBinding(f.databasePath) });
  const sql = new DatabaseSync(owner.databasePath);
  try {
    sql.exec("PRAGMA synchronous=FULL; BEGIN IMMEDIATE");
    owner.assertHeld();
    assert.equal(sql.prepare("SELECT binding FROM fixture_owner WHERE singleton=1").get().binding, JSON.stringify(owner.binding()));
    sql.exec("UPDATE fixture_owner SET epoch=epoch+1 WHERE singleton=1");
    owner.assertHeld();
    sql.exec("COMMIT");
    return owner;
  } finally {
    if (sql.isTransaction) sql.exec("ROLLBACK");
    sql.close();
  }
}

test("explicit provisioning binds one file identity and normal reopen preserves it", async t => {
  const f = fixture(t);
  const before = statSync(f.lockPath, { bigint: true });
  assert.throws(() => f.acquire({ expectedBinding: f.binding }), { code: "OWNER_HELD" });
  assert.throws(() => f.acquire({ provision: true }), { code: "EEXIST" });
  await f.owner.close(noDrain);
  const reopened = f.acquire({ expectedBinding: f.binding });
  assert.deepEqual(reopened.binding(), f.binding);
  assert.equal(statSync(f.lockPath, { bigint: true }).ino, before.ino);
  reopened.assertHeld();
});

test("persisted binding and epoch survive restart without changing unknown-effect receipts", async t => {
  const f = fixture(t);
  persistBinding(f.owner);
  await f.owner.close(noDrain);
  const reopened = acquireAndAdvance(f);
  reopened.assertHeld();
  const sql = new DatabaseSync(f.databasePath, { readOnly: true });
  try {
    assert.equal(sql.prepare("SELECT epoch FROM fixture_owner").get().epoch, 2);
    assert.equal(sql.prepare("SELECT outcome FROM fixture_receipts").get().outcome, "unconfirmed");
    assert.equal(sql.prepare("PRAGMA journal_mode").get().journal_mode, "delete");
  } finally { sql.close(); }
});

test("database and directory symlinks converge on the same locked identity", async t => {
  const f = fixture(t);
  const fileAlias = join(f.root, "alias.sqlite"), directoryAlias = f.root + "-alias";
  symlinkSync(f.databasePath, fileAlias, "file");
  symlinkSync(f.root, directoryAlias, process.platform === "win32" ? "junction" : "dir");
  cleanup(t, () => unlinkSync(directoryAlias));
  for (const databasePath of [fileAlias, join(directoryAlias, "state.sqlite")]) {
    assert.throws(() => f.acquire({ databasePath, expectedBinding: f.binding }), { code: "OWNER_HELD" });
  }
  await f.owner.close(noDrain);
  const reopened = f.acquire({ databasePath: fileAlias, expectedBinding: f.binding });
  assert.equal(reopened.databasePath, f.databasePath);
});

test("hardlinked databases are rejected before another sidecar can be created", t => {
  const f = fixture(t), alias = join(f.root, "alias.sqlite");
  linkSync(f.databasePath, alias);
  assert.throws(() => f.acquire({ databasePath: alias, provision: true }), /single-link file/);
  assert.equal(existsSync(alias + ".writer.lock"), false);
  assert.throws(() => f.owner.assertHeld(), /single-link file/);
  unlinkSync(alias);
  assert.throws(() => f.owner.assertHeld(), /single-link file/, "A repaired path cannot unfence the original owner");
  assert.equal(rawContender(t, f.lockPath)(), false);
});

for (const mode of ["hardlink", "symlink", "directory"]) {
  test(`a ${mode} lock is rejected without rewriting it`, { skip: mode === "hardlink" ? false : replacedPath }, async t => {
    const f = fixture(t);
    await f.owner.close(noDrain);
    const oldPath = f.lockPath + ".retained";
    if (mode === "hardlink") linkSync(f.lockPath, oldPath);
    else {
      renameSync(f.lockPath, oldPath);
      if (mode === "symlink") symlinkSync(oldPath, f.lockPath, "file"); else mkdirSync(f.lockPath);
    }
    const bytes = readFileSync(oldPath);
    assert.throws(() => f.acquire({ expectedBinding: f.binding }), /regular, single-link file/);
    assert.deepEqual(readFileSync(oldPath), bytes);
  });
}

test("a partial provisioning file is retained and cannot be silently initialized on retry", async t => {
  const f = fixture(t), databasePath = join(f.root, "partial.sqlite"), lockPath = databasePath + ".writer.lock";
  closeSync(openSync(databasePath, "wx", 0o600));
  closeSync(openSync(lockPath, "wx", 0o600));
  assert.throws(() => f.acquire({ databasePath, provision: true }), { code: "EEXIST" });
  assert.equal(statSync(lockPath).size, 0);
});

for (const mode of ["missing", "replaced", "copied-header", "database-replaced", "database-missing"]) {
  test(`${mode} identity refuses open before the fixture epoch or receipts change`, { skip: replacedPath }, async t => {
    const f = fixture(t);
    persistBinding(f.owner);
    const retainedDatabase = f.databasePath + ".retained";
    const before = digest(f.databasePath);
    if (mode === "database-replaced" || mode === "database-missing") {
      renameSync(f.databasePath, retainedDatabase);
      if (mode === "database-replaced") copyFileSync(retainedDatabase, f.databasePath);
    } else {
      renameSync(f.lockPath, f.lockPath + ".retained");
      if (mode === "copied-header") copyFileSync(f.lockPath + ".retained", f.lockPath);
      else if (mode === "replaced") closeSync(openSync(f.lockPath, "wx", 0o600));
    }
    assert.throws(() => acquireAndAdvance(f));
    const preserved = existsSync(retainedDatabase) ? retainedDatabase : f.databasePath;
    assert.equal(digest(preserved), before);
    if (mode === "database-replaced") assert.equal(digest(f.databasePath), before);
    assert.throws(() => f.owner.assertHeld());
    if (mode === "missing") assert.equal(existsSync(f.lockPath), false, "Missing lock must never be recreated by open");
  });
}

test("a corrupt lock header fails explicitly and never repairs the file", async t => {
  const f = fixture(t);
  await f.owner.close(noDrain);
  writeFileSync(f.lockPath, "corrupt");
  assert.throws(() => f.acquire({ expectedBinding: f.binding }), /header is missing or malformed/);
  assert.equal(readFileSync(f.lockPath, "utf8"), "corrupt");
  assert.equal(rawContender(t, f.lockPath)(), true, "Failed acquisition must release its descriptor");
});

test("non-ASCII header bytes cannot decode as a valid lock ID", async t => {
  const f = fixture(t);
  await f.owner.close(noDrain);
  const bytes = readFileSync(f.lockPath);
  bytes[0] |= 0x80;
  writeFileSync(f.lockPath, bytes);
  assert.throws(() => f.acquire({ expectedBinding: f.binding }), /Malformed lock identity header/);
  assert.deepEqual(readFileSync(f.lockPath), bytes);
});

test("a modified header fences an existing owner without unlocking it or repairing its contents", t => {
  const f = fixture(t), contender = rawContender(t, f.lockPath);
  const original = readFileSync(f.lockPath);
  writeFileSync(f.lockPath, "bad-header");
  assert.throws(() => f.owner.assertHeld(), /header is missing or malformed/);
  assert.equal(contender(), false);
  writeFileSync(f.lockPath, original);
  assert.throws(() => f.owner.assertHeld(), /header is missing or malformed/);
});

test("identity records reject missing, surplus and lossy numeric fields before touching files", async t => {
  const f = fixture(t);
  await f.owner.close(noDrain);
  const before = digest(f.lockPath);
  for (const expectedBinding of [undefined, null, {}, { ...f.binding, extra: true },
    { ...f.binding, lockId: "not-a-lock-id" },
    { ...f.binding, lock: { ...f.binding.lock, inode: Number(f.binding.lock.inode) } }]) {
    assert.throws(() => f.acquire({ expectedBinding }), /persisted|binding/i);
    assert.equal(digest(f.lockPath), before);
  }
  assert.throws(() => f.acquire({ expectedBinding: f.binding, provision: true }), /explicit fixture provisioning/);
});

for (const mode of ["regular", "symlink"]) {
  test(`a ${mode} lock substitution between inspection and open is rejected`, { skip: replacedPath }, async t => {
    const f = fixture(t);
    await f.owner.close(noDrain);
    const retained = f.lockPath + ".retained";
    assert.throws(() => f.acquire({ expectedBinding: f.binding, afterInspect: () => {
      renameSync(f.lockPath, retained);
      if (mode === "symlink") symlinkSync(retained, f.lockPath, "file"); else copyFileSync(retained, f.lockPath);
    } }));
    assert.equal(rawContender(t, retained)(), true);
  });
}

for (const mode of ["lock", "database", "parent"]) {
  test(`replacing the ${mode} during acquisition is rejected before the guard is returned`, { skip: replacedPath }, async t => {
    const f = fixture(t);
    await f.owner.close(noDrain);
    const original = mode === "parent" ? f.root + ".retained" : (mode === "lock" ? f.lockPath : f.databasePath) + ".retained";
    if (mode === "parent") cleanup(t, () => rmSync(original, { recursive: true }));
    assert.throws(() => f.acquire({ expectedBinding: f.binding, afterLock: () => {
      if (mode === "parent") {
        renameSync(f.root, original);
        mkdirSync(f.root);
        copyFileSync(join(original, "state.sqlite"), f.databasePath);
        copyFileSync(join(original, "state.sqlite.writer.lock"), f.lockPath);
      } else {
        const path = mode === "lock" ? f.lockPath : f.databasePath;
        renameSync(path, original); copyFileSync(original, path);
      }
    } }), /identity changed/);
    const lockPath = mode === "lock" ? original : mode === "parent" ? join(original, "state.sqlite.writer.lock") : f.lockPath;
    assert.equal(rawContender(t, lockPath)(), true, "Acquisition failure has no runtime to drain and must not leak its descriptor");
  });
}

test("copying a database backup cannot silently rebind it to another root or lock", async t => {
  const source = fixture(t), destination = fixture(t);
  persistBinding(source.owner);
  await source.owner.close(noDrain);
  await destination.owner.close(noDrain);
  copyFileSync(source.databasePath, destination.databasePath);
  const before = digest(destination.databasePath);
  assert.throws(() => acquireAndAdvance(destination), /Persisted (lock|database|parent) identity changed/);
  assert.equal(digest(destination.databasePath), before);
});

test("binding snapshots cannot mutate the guard's authoritative identity", t => {
  const f = fixture(t), copy = f.owner.binding();
  copy.lock.inode = "1"; copy.lockId = "changed";
  assert.deepEqual(f.owner.binding(), f.binding);
  f.owner.assertHeld();
});

test("close without a drain contract is rejected and keeps the owner usable", t => {
  const f = fixture(t);
  assert.throws(() => f.owner.close(), /confirmed-drain callback/);
  f.owner.assertHeld();
  assert.equal(rawContender(t, f.lockPath)(), false);
});

test("normal close is reentrant, fences admission immediately and holds through asynchronous drain", async t => {
  const f = fixture(t), contender = rawContender(t, f.lockPath);
  let release;
  const drained = new Promise(resolve => { release = resolve; });
  let calls = 0;
  const first = f.owner.close(async () => { calls++; await drained; });
  const second = f.owner.close(async () => { throw new Error("Second drain must not run"); });
  assert.equal(first, second);
  assert.throws(() => f.owner.assertHeld(), { code: "OWNER_CLOSING" });
  assert.equal(contender(), false);
  await Promise.resolve();
  assert.equal(calls, 1);
  release(); await first;
  assert.equal(contender(), true);
  assert.equal(f.owner.close(noDrain), first);
  assert.throws(() => f.owner.assertHeld(), { code: "OWNER_CLOSED" });
});

test("a fenced owner rejects late calls but retains its descriptor until drain completes", async t => {
  const f = fixture(t), failure = new Error("Worker response outcome is unconfirmed");
  const contender = rawContender(t, f.lockPath);
  f.owner.fence(failure);
  assert.throws(() => f.owner.assertHeld(), error => error === failure);
  f.owner.fence(new Error("Later error"));
  assert.throws(() => f.owner.assertHeld(), error => error === failure);
  assert.equal(contender(), false);
  await f.owner.close(noDrain);
  assert.equal(contender(), true);
});

test("independent identities remain available when another owner is fenced", t => {
  const first = fixture(t), second = fixture(t);
  first.owner.fence(new Error("First root unavailable"));
  assert.throws(() => first.owner.assertHeld(), /First root unavailable/);
  second.owner.assertHeld();
});

test("another process is refused while the guard is held", async t => {
  const f = fixture(t);
  const competitor = await child(t, f);
  assert.equal(competitor.reply.held, false);
  assert.equal(competitor.reply.code, "OWNER_HELD");
  f.owner.assertHeld();
});

test("failed drain stays fenced and locked until process death, without a retry drain", async t => {
  const f = fixture(t);
  await f.owner.close(noDrain);
  const owner = await child(t, f);
  assert.equal(owner.reply.held, true);
  const response = next(owner.process);
  owner.process.send("fail-drain");
  assert.deepEqual(await response, { failed: true, same: true, message: "Injected unknown worker shutdown" });
  assert.throws(() => f.acquire({ expectedBinding: f.binding }), { code: "OWNER_HELD" });
  const ended = once(owner.process, "exit"); owner.process.kill("SIGKILL"); await ended;
  f.acquire({ expectedBinding: f.binding }).assertHeld();
});

test("rejected durable path inputs create no files", async t => {
  const f = fixture(t);
  await f.owner.close(noDrain);
  const before = readdirSync(f.root).sort();
  for (const databasePath of ["", " ", ":memory:", "file:state.sqlite", "bad\0path"])
    assert.throws(() => f.acquire({ databasePath, expectedBinding: f.binding }), /durable existing database path/);
  assert.deepEqual(readdirSync(f.root).sort(), before);
});
