import { fork, execFileSync } from "node:child_process";
import { once } from "node:events";
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

it("retains the same writer while its owning process is suspended past the old 30-second TTL", async context => {
  if (process.platform === "win32") { context.skip(); return; }
  const options = await fixture();
  const child = fork(new URL("./fixtures/writer-owner-child.ts", import.meta.url), [JSON.stringify(options)],
    { execArgv: ["--import", "tsx"], stdio: ["ignore", "ignore", "pipe", "ipc"] });
  try {
    const [ready] = await once(child, "message"); expect(ready).toMatchObject({ epoch: 1 });
    child.kill("SIGSTOP");
    expect(execFileSync("ps", ["-o", "stat=", "-p", String(child.pid)], { encoding: "utf8" })).toContain("T");
    expect(() => CollaborationStateDatabase.open(options)).toThrow(expect.objectContaining({ code: "WRITER_LEASE_HELD" }));
    await new Promise(resolve => setTimeout(resolve, 31_000));
    expect(() => CollaborationStateDatabase.open(options)).toThrow(expect.objectContaining({ code: "WRITER_LEASE_HELD" }));
    child.kill("SIGCONT");
    const response = once(child, "message"); child.send("write");
    expect((await response)[0]).toMatchObject({ committed: true, epoch: 1 });
    const ended = once(child, "exit"); child.kill("SIGKILL"); await ended;
    const next = CollaborationStateDatabase.open(options);
    try { expect(next.writerLease().epoch).toBe(2); expect(next.eventsAfter("p").filter(event => event.type === "resumed")).toHaveLength(1); }
    finally { next.close(); }
  } finally {
    if (child.exitCode === null && child.signalCode === null) { const ended = once(child, "exit"); child.kill("SIGKILL"); await ended; }
  }
}, 45_000);

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
