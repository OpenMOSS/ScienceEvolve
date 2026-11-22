import assert from "node:assert/strict";
import { fork, spawnSync } from "node:child_process";
import { once } from "node:events";
import { mkdirSync, mkdtempSync, openSync, closeSync, linkSync, symlinkSync, renameSync, rmSync, statSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { test } from "node:test";
import { DatabaseSync } from "node:sqlite";
import { Worker } from "node:worker_threads";
import { tryLock } from "fs-native-extensions";

const here = dirname(fileURLToPath(import.meta.url));
const holder = join(here, "holder.mjs");
const scratch = join(here, "../../.scratch/sqlite-writer-lock-validation");
mkdirSync(scratch, { recursive: true });

const cleanups = new WeakMap();
function cleanup(t, callback) {
  if (!cleanups.has(t)) {
    const callbacks = [];
    cleanups.set(t, callbacks);
    t.after(async () => {
      const errors = [];
      for (const dispose of callbacks.reverse()) {
        try { await dispose(); } catch (error) { errors.push(error); }
      }
      if (errors.length) throw new AggregateError(errors, "Lock fixture cleanup failed");
    });
  }
  cleanups.get(t).push(callback);
}

function fixture(t) {
  const root = mkdtempSync(join(scratch, "case-"));
  cleanup(t, () => rmSync(root, { recursive: true }));
  return join(root, "writer.lock");
}

function open(t, path) {
  const fd = openSync(path, "a+", 0o600);
  cleanup(t, () => closeSync(fd));
  return fd;
}

function nextMessage(channel) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => finish(new Error("Lock fixture did not reply within 10 seconds")), 10_000);
    const message = value => finish(undefined, value);
    const exit = code => finish(new Error(`Lock fixture exited before replying (${code})`));
    const onError = error => finish(error);
    function finish(error, value) {
      clearTimeout(timeout);
      channel.off("message", message);
      channel.off("exit", exit);
      channel.off("error", onError);
      if (error) reject(error); else resolve(value);
    }
    channel.once("message", message);
    channel.once("exit", exit);
    channel.once("error", onError);
  });
}

async function launch(t, path, mode = "lock", extra = {}) {
  const child = fork(holder, [JSON.stringify({ path, mode, ...extra })], {
    stdio: ["ignore", "ignore", "pipe", "ipc"],
    execArgv: []
  });
  let stderr = "";
  child.stderr.on("data", bytes => { stderr += bytes; });
  cleanup(t, async () => {
    if (child.exitCode === null && child.signalCode === null) {
      const ended = once(child, "exit");
      child.kill("SIGKILL");
      await ended;
    }
  });
  try { return { child, ready: await nextMessage(child), stderr: () => stderr }; }
  catch (error) { throw new Error(`${error.message}: ${stderr}`, { cause: error }); }
}

async function request(child, message) {
  const result = nextMessage(child);
  child.send(message);
  return result;
}

async function stop(child, signal) {
  const ended = once(child, "exit");
  if (signal) child.kill(signal); else child.send("exit");
  return ended;
}

test("independent opens in one process cannot both hold the same inode", t => {
  const path = fixture(t);
  assert.equal(tryLock(open(t, path)), true);
  assert.equal(tryLock(open(t, path)), false);
});

test("independent roots can hold their locks concurrently", async t => {
  const first = fixture(t), second = fixture(t);
  const owner = await launch(t, first);
  assert.equal(owner.ready.held, true);
  assert.equal(tryLock(open(t, second)), true);
  assert.equal(tryLock(open(t, first)), false);
});

test("another process is rejected while held, then acquires after explicit close", async t => {
  const path = fixture(t), contender = open(t, path);
  const owner = await launch(t, path);
  assert.equal(owner.ready.held, true);
  assert.equal(tryLock(contender), false);
  assert.deepEqual(await request(owner.child, "release"), { released: true });
  assert.equal(tryLock(contender), true);
});

for (const signal of [undefined, "SIGKILL"]) {
  test(`process ${signal ?? "normal exit"} releases its lock`, async t => {
    const path = fixture(t), contender = open(t, path);
    const owner = await launch(t, path);
    assert.equal(owner.ready.held, true);
    assert.equal(tryLock(contender), false);
    await stop(owner.child, signal);
    assert.equal(tryLock(contender), true);
  });
}

test("symlink and hardlink aliases of a lock inode cannot bypass the primitive", t => {
  const path = fixture(t);
  assert.equal(tryLock(open(t, path)), true);
  linkSync(path, path + ".hardlink");
  symlinkSync(path, path + ".symlink", "file");
  assert.equal(tryLock(open(t, path + ".hardlink")), false);
  assert.equal(tryLock(open(t, path + ".symlink")), false);
});

test("realpath converges database symlinks but hardlink database aliases need an explicit guard", t => {
  const path = fixture(t), databasePath = path + ".sqlite";
  closeSync(openSync(databasePath, "wx", 0o600));
  symlinkSync(databasePath, databasePath + ".symlink", "file");
  assert.equal(realpathSync(databasePath), realpathSync(databasePath + ".symlink"));
  linkSync(databasePath, databasePath + ".hardlink");
  assert.notEqual(realpathSync(databasePath), realpathSync(databasePath + ".hardlink"));
  const original = statSync(databasePath, { bigint: true });
  const alias = statSync(databasePath + ".hardlink", { bigint: true });
  assert.equal(original.dev, alias.dev);
  assert.equal(original.ino, alias.ino);
  assert.equal(original.nlink, 2n);
  assert.equal(tryLock(open(t, realpathSync(databasePath) + ".writer.lock")), true);
  assert.equal(tryLock(open(t, realpathSync(databasePath + ".hardlink") + ".writer.lock")), true,
    "Sidecar naming alone does not protect a hardlinked database");
});

test("renaming a held lock and creating a replacement yields a different lock identity", {
  skip: process.platform === "win32" ? "Windows open-handle rename policy needs a separate fixture" : false
}, t => {
  const path = fixture(t), first = open(t, path);
  assert.equal(tryLock(first), true);
  const original = statSync(path, { bigint: true });
  renameSync(path, path + ".original");
  const replacement = open(t, path);
  assert.notEqual(statSync(path, { bigint: true }).ino, original.ino);
  assert.equal(tryLock(replacement), true, "The kernel locks inodes, not a permanent path name");
  assert.equal(tryLock(open(t, path + ".original")), false);
});

for (const mode of ["worker", "nested-worker"]) {
  test(`${mode} termination releases worker-opened descriptors`, async t => {
    const path = fixture(t), contender = open(t, path);
    const owner = await launch(t, path, mode);
    assert.equal(owner.ready.held, true);
    assert.equal(tryLock(contender), false);
    assert.deepEqual(await request(owner.child, "terminate-worker"), { terminated: true });
    assert.equal(tryLock(contender), true);
  });
}

test("an uncaught worker error releases its worker-opened descriptor", async t => {
  const path = fixture(t), contender = open(t, path);
  const worker = new Worker(new URL("./holder.mjs", import.meta.url), { workerData: { mode: "lock", path } });
  cleanup(t, () => worker.terminate());
  assert.equal((await nextMessage(worker)).held, true);
  assert.equal(tryLock(contender), false);
  const failed = once(worker, "error");
  const ended = new Promise(resolve => worker.once("exit", resolve));
  worker.postMessage("crash");
  assert.match((await failed)[0].message, /Intentional isolated lock holder failure/);
  await ended;
  assert.equal(tryLock(contender), true);
});

test("a worker exit does not close a descriptor opened by its parent", async t => {
  const path = fixture(t), descriptor = open(t, path), contender = open(t, path);
  const worker = new Worker(new URL("./holder.mjs", import.meta.url), {
    workerData: { mode: "lock", path, descriptor }
  });
  cleanup(t, () => worker.terminate());
  assert.equal((await nextMessage(worker)).held, true);
  await worker.terminate();
  assert.equal(tryLock(contender), false, "Parent-owned fd outlives the worker's JS environment");
});

test("terminating an owner worker does not release its lock while its database worker is in native SQLite", async t => {
  const path = fixture(t), contender = open(t, path), databasePath = path + ".sqlite";
  const database = new DatabaseSync(databasePath);
  cleanup(t, () => { if (database.isTransaction) database.exec("ROLLBACK"); database.close(); });
  database.exec("CREATE TABLE fixture(value INTEGER); BEGIN IMMEDIATE");
  const state = new Int32Array(new SharedArrayBuffer(4));
  const worker = new Worker(new URL("./holder.mjs", import.meta.url), {
    workerData: { mode: "owner-with-blocked-database", path, databasePath, state: state.buffer }
  });
  cleanup(t, async () => {
    if (database.isTransaction) database.exec("ROLLBACK");
    await worker.terminate();
  });
  assert.deepEqual(await nextMessage(worker), { blocking: true });
  assert.equal(Atomics.load(state, 0), 1);
  let terminated = false;
  const termination = worker.terminate().then(() => { terminated = true; });
  for (let i = 0; i < 20; i++) {
    await delay(5);
    assert.equal(terminated, false, "The DB worker still owns a native SQLite call");
    assert.equal(tryLock(contender), false, "The parent descriptor must cover child-worker teardown");
  }
  database.exec("ROLLBACK");
  await termination;
  assert.equal(tryLock(contender), true);
});

test("parent process death releases a nested worker lock", async t => {
  const path = fixture(t), contender = open(t, path);
  const owner = await launch(t, path, "nested-worker");
  assert.equal(owner.ready.held, true);
  assert.equal(tryLock(contender), false);
  await stop(owner.child, "SIGKILL");
  assert.equal(tryLock(contender), true);
});

test("ordinary spawned children do not retain the owner's lock after close", async t => {
  const path = fixture(t), contender = open(t, path);
  const owner = await launch(t, path);
  assert.equal(owner.ready.held, true);
  await request(owner.child, "spawn-child");
  try {
    assert.equal(tryLock(contender), false);
    await request(owner.child, "release");
    assert.deepEqual(await request(owner.child, "child-alive"), { childAlive: true });
    assert.equal(tryLock(contender), true);
  } finally { await request(owner.child, "stop-child"); }
});

test("invalid or closed descriptors fail explicitly rather than returning contention", t => {
  const path = fixture(t), descriptor = openSync(path, "a+");
  closeSync(descriptor);
  assert.throws(() => tryLock(descriptor), { code: "EBADF" });
});

test("a paused owner retains its lock beyond the old 30-second TTL and resumes normally", {
  skip: process.platform === "win32" ? "SIGSTOP/SIGCONT are unavailable; a Windows suspend/resume fixture is still required" : false,
  timeout: 45_000
}, async t => {
  const path = fixture(t), contender = open(t, path);
  const owner = await launch(t, path);
  assert.equal(owner.ready.held, true);
  owner.child.kill("SIGSTOP");
  try {
    const state = spawnSync("ps", ["-o", "stat=", "-p", String(owner.child.pid)], { encoding: "utf8" });
    assert.equal(state.status, 0);
    assert.match(state.stdout, /T/, "The fixture must actually be suspended, not only sent a signal");
    const started = performance.now();
    assert.equal(tryLock(contender), false);
    await delay(31_000);
    assert.ok(performance.now() - started > 30_000);
    assert.equal(tryLock(contender), false);
  } finally { owner.child.kill("SIGCONT"); }
  assert.deepEqual(await request(owner.child, "release"), { released: true });
  assert.equal(tryLock(contender), true);
});
