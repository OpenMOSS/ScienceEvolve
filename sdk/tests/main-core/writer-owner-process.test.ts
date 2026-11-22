import { spawn, execFileSync } from "node:child_process";
import { createInterface } from "node:readline";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { acknowledgeWindowsResident, controlWindowsResident, prepareWindowsResidentLaunch, registeredWindowsResident } from "../../src/core/harness-runtime/windows-resident.js";
import type { LaunchPlan } from "../../src/core/harness-runtime/contracts.js";
import { Worker } from "node:worker_threads";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, expect, it, vi } from "vitest";
import { CollaborationStateDatabase } from "../../src/core/collaboration-state/store.js";
import { openCollaborationStateWorker } from "../../src/core/collaboration-state/database-worker.js";

const roots: string[] = [];
afterEach(async () => { for (const root of roots.splice(0)) await fs.rm(root, { recursive: true }); });
async function fixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "writer-process-")); roots.push(root);
  return { databasePath: path.join(root, "state.sqlite"), serviceId: "test", hostId: "host", topology: "single-host" as const };
}

it("retains the same writer while its owning process is suspended past the old 30-second TTL", async () => {
  const options = await fixture(), authority = { projectId: "writer-fixture", harnessId: "fixture", scopeId: "owner", role: "leader" as const, coordinatorEpoch: 1 };
  const plan: LaunchPlan = { command: process.execPath, args: ["--import", pathToFileURL(createRequire(import.meta.url).resolve("tsx")).href, fileURLToPath(new URL("./fixtures/writer-owner-child.ts", import.meta.url)), JSON.stringify(options)],
    cwd: path.dirname(options.databasePath), env: {}, eventFormat: "jsonl", rawLogLimitBytes: 4096,
    session: { schemaVersion: 1, harnessId: "fixture", adapterVersion: "test", generation: 0, nativeId: "fixture", durable: false, createdAt: new Date().toISOString() } };
  // The Windows supervisor assigns the child to a private job before it can open SQLite.
  const supervisor = process.platform === "win32" ? await prepareWindowsResidentLaunch(authority, plan.cwd, plan) : undefined;
  const child = spawn(supervisor?.command ?? plan.command, supervisor?.args ?? plan.args, { cwd: plan.cwd, stdio: "pipe", windowsHide: true });
  const ended = new Promise<void>((resolve, reject) => { child.once("close", () => resolve()); child.once("error", reject); });
  const lines: string[] = [];
  createInterface({ input: child.stdout }).on("line", line => lines.push(line)); child.stderr.resume();
  const excluded = () => expect(() => CollaborationStateDatabase.open(options)).toThrow(expect.objectContaining({ code: "WRITER_LEASE_HELD" }));
  try {
    if (supervisor) await acknowledgeWindowsResident(authority, supervisor.claimFile, child);
    await vi.waitFor(() => expect(lines).toHaveLength(1), { timeout: 6000 });
    const ready = JSON.parse(lines[0]); expect(ready).toMatchObject({ epoch: 1, pid: expect.any(Number) });
    const job = supervisor ? registeredWindowsResident(child) : undefined;
    if (supervisor) {
      expect(job).toBeDefined();
      const paused = await controlWindowsResident(job!, "pause");
      expect(paused.stopped).toBe(true); expect(paused.members).toContain(ready.pid);
    } else {
      expect(ready.pid).toBe(child.pid); child.kill("SIGSTOP");
      await vi.waitFor(() => expect(execFileSync("ps", ["-o", "stat=", "-p", String(child.pid)], { encoding: "utf8" })).toContain("T"));
    }
    excluded(); child.stdin.write("write\n");
    await new Promise(resolve => setTimeout(resolve, 31_000));
    expect(lines).toHaveLength(1); excluded();
    if (job) await controlWindowsResident(job, "resume"); else child.kill("SIGCONT");
    await vi.waitFor(() => expect(lines).toHaveLength(2), { timeout: 6000 });
    expect(JSON.parse(lines[1])).toEqual({ committed: true, epoch: 1 });
    if (job) { await controlWindowsResident(job, "terminate"); expect((await controlWindowsResident(job, "probe")).alive).toBe(false); }
    else child.kill("SIGKILL");
    await ended;
    const next = CollaborationStateDatabase.open(options);
    try { expect(next.writerLease().epoch).toBe(2); expect(next.eventsAfter("p").filter(event => event.type === "resumed")).toHaveLength(1); }
    finally { next.close(); }
  } finally {
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
    await ended;
  }
}, 65_000);

it("retains a failed Worker owner until explicit close while leaving another database independent", async () => {
  const options = await fixture(), other = await fixture();
  const errors: Error[] = [];
  let actual: Worker | undefined;
  const original = Worker.prototype.unref;
  const capture = vi.spyOn(Worker.prototype, "unref").mockImplementation(function (this: Worker) {
    actual = this; return original.call(this);
  });
  const worker = await openCollaborationStateWorker(options, error => errors.push(error));
  capture.mockRestore();
  const independent = CollaborationStateDatabase.open(other);
  try {
    expect(() => worker.assertWriterAvailable()).not.toThrow();
    expect(actual).toBeDefined();
    await actual!.terminate();
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain("unconfirmed and were not retried");
    expect(() => worker.assertWriterAvailable()).toThrow();
    expect(() => CollaborationStateDatabase.open(options)).toThrow(expect.objectContaining({ code: "WRITER_LEASE_HELD" }));
    independent.assertWriterLeaseHeld();
    await worker.close();
    const next = CollaborationStateDatabase.open(options);
    try { next.assertWriterLeaseHeld(); } finally { next.close(); }
  } finally { await worker.close(); independent.close(); }
});
