import { openSync, closeSync } from "node:fs";
import { fork } from "node:child_process";
import { Worker, isMainThread, parentPort, workerData } from "node:worker_threads";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { tryLock } from "fs-native-extensions";

const entry = fileURLToPath(import.meta.url);
const options = isMainThread ? JSON.parse(process.argv[2]) : workerData;
const send = value => parentPort ? parentPort.postMessage(value) : process.send(value);
const listen = callback => (parentPort ?? process).on("message", callback);
let descriptor;
let worker;
let child;
let closing = false;
async function close() {
  if (closing) return;
  closing = true;
  if (child && child.exitCode === null && child.signalCode === null) {
    const ended = new Promise(resolve => child.once("exit", resolve));
    child.kill("SIGKILL");
    await ended;
  }
  if (worker) await worker.terminate();
  if (descriptor !== undefined) { closeSync(descriptor); descriptor = undefined; }
  if (parentPort) parentPort.close(); else if (process.connected) process.disconnect();
}
if (isMainThread) process.once("disconnect", () => { void close(); });

if (options.mode === "owner-with-blocked-database") {
  descriptor = openSync(options.path, "a+", 0o600);
  if (!tryLock(descriptor)) throw new Error("Owner fixture lock is already held");
  worker = new Worker(new URL(import.meta.url), { workerData: { ...options, mode: "blocked-database" } });
  worker.on("message", send);
  worker.on("error", error => { throw error; });
} else if (options.mode === "blocked-database") {
  const database = new DatabaseSync(options.databasePath);
  database.exec("PRAGMA busy_timeout=5000");
  const state = new Int32Array(options.state);
  Atomics.store(state, 0, 1);
  send({ blocking: true });
  database.exec("BEGIN IMMEDIATE");
  database.exec("ROLLBACK");
  database.close();
  Atomics.store(state, 0, 2);
} else if (options.mode === "nested-worker") {
  worker = new Worker(new URL(import.meta.url), { workerData: { ...options, mode: "worker" } });
  worker.on("message", send);
  worker.on("error", error => { throw error; });
} else if (options.mode === "worker") {
  worker = new Worker(new URL(import.meta.url), { workerData: { ...options, mode: "lock" } });
  worker.on("message", send);
  worker.on("error", error => { throw error; });
} else if (options.mode !== "idle") {
  descriptor = options.descriptor ?? openSync(options.path, "a+", 0o600);
  send({ held: tryLock(descriptor), descriptor });
} else {
  send({ ready: true });
}

listen(async message => {
  if (message === "release") {
    closeSync(descriptor);
    descriptor = undefined;
    send({ released: true });
  } else if (message === "exit") {
    await close();
  } else if (message === "crash") {
    throw new Error("Intentional isolated lock holder failure");
  } else if (message === "terminate-worker") {
    await worker.terminate();
    send({ terminated: true });
  } else if (message === "spawn-child") {
    child = fork(entry, [JSON.stringify({ mode: "idle" })], { stdio: ["ignore", "ignore", "pipe", "ipc"] });
    child.stderr.pipe(process.stderr);
    child.once("message", () => send({ childPid: child.pid }));
  } else if (message === "child-alive") {
    send({ childAlive: child.exitCode === null && child.signalCode === null });
  } else if (message === "stop-child") {
    child.once("exit", () => send({ childStopped: true }));
    child.send("exit");
  }
});
