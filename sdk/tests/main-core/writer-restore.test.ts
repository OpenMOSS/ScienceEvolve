import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, expect, it, vi } from "vitest";
import { CollaborationStateDatabase } from "../../src/core/collaboration-state/store.js";
import { restoreCollaborationWriter } from "../../src/core/collaboration-state/restore-writer.js";

const roots: string[] = [];
afterEach(async () => { for (const root of roots.splice(0)) await fs.rm(root, { recursive: true }); });
async function fixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "writer-restore-")); roots.push(root);
  const original = path.join(root, "original.sqlite"), snapshotPath = path.join(root, "snapshot.sqlite"), databasePath = path.join(root, "restored.sqlite");
  const options = { databasePath: original, hostId: "host", serviceId: "service", topology: "single-host" as const };
  const db = CollaborationStateDatabase.open(options);
  try {
    db.createProject({ projectId: "original", workflowRevision: 1, workflowSnapshot: { agents: [] }, git: { enabled: false, status: "disabled" }, workerCapacity: 2 });
    db.appendEvent({ projectId: "original", requestId: "original-request", type: "remote.unconfirmed", payload: { operation: "original-operation" } });
    const journal = db.operationsForProject("original");
    await journal.prepare({ id: "remote-original", kind: "repository.create", payloadHash: "original-hash", status: "prepared" });
    await journal.transition({ id: "remote-original", payloadHash: "original-hash", status: "uncertain" });
    const projection = db.projectState("original"), events = db.eventsAfter("original"), sourceEpoch = db.writerLease().epoch;
    db.close(); await fs.copyFile(original, snapshotPath);
    const bytes = await fs.readFile(snapshotPath);
    const sourceLockId = JSON.parse(await fs.readFile(original + ".writer.lock", "utf8")).lockId as string;
    return { root, original, options, projection, events, bytes,
      input: { snapshotPath, databasePath, snapshotSha256: createHash("sha256").update(bytes).digest("hex"), sourceLockId,
        sourceEpoch, serviceId: "restore", hostId: "host", confirmedStopped: true as const } };
  } finally { db.close(); }
}

it("rebinds only a verified offline snapshot to a new database, preserving revisions, history and uncertain receipts", async () => {
  const f = await fixture(), result = await restoreCollaborationWriter(f.input);
  expect(result).toMatchObject({ sourceLockId: f.input.sourceLockId, sourceEpoch: 1, epoch: 2 });
  expect(result.lockId).not.toBe(result.sourceLockId);
  const opened = CollaborationStateDatabase.open({ ...f.options, databasePath: result.databasePath });
  try {
    expect(opened.writerLease().epoch).toBe(3);
    expect(opened.projectState("original")).toEqual(f.projection); expect(opened.eventsAfter("original")).toEqual(f.events);
    expect(opened.recordedGitOperation("original", "remote-original")).toMatchObject({ status: "uncertain", payloadHash: "original-hash" });
    expect(opened.verifyHealth()).toMatchObject({ synchronous: "full", journalMode: "delete", integrity: "ok" });
    await expect(restoreCollaborationWriter(f.input)).rejects.toThrow(/new database and lock path/);
  } finally { opened.close(); }
  expect(await fs.readFile(f.original)).toEqual(f.bytes); expect(await fs.readFile(f.input.snapshotPath)).toEqual(f.bytes);
});

it.each(["unconfirmed-stop", "wrong-host", "stale-epoch", "wrong-lock", "live-source", "source-journal", "target-journal", "existing-target", "bad-digest"] as const)(
  "refuses %s without modifying the source or rebinding the destination", async mode => {
    const f = await fixture(), input = { ...f.input };
    if (mode === "unconfirmed-stop") input.confirmedStopped = false as true;
    if (mode === "wrong-host") input.hostId = "another-host";
    if (mode === "stale-epoch") input.sourceEpoch++;
    if (mode === "wrong-lock") input.sourceLockId = "another-lock";
    if (mode === "live-source") input.snapshotPath = f.original;
    if (mode === "source-journal") await fs.writeFile(input.snapshotPath + "-journal", "retained");
    if (mode === "target-journal") await fs.writeFile(input.databasePath + "-journal", "retained");
    if (mode === "existing-target") await fs.writeFile(input.databasePath, "must not overwrite");
    if (mode === "bad-digest") input.snapshotSha256 = "0".repeat(64);
    await expect(restoreCollaborationWriter(input)).rejects.toThrow();
    expect(await fs.readFile(f.input.snapshotPath)).toEqual(f.bytes); expect(await fs.readFile(f.original)).toEqual(f.bytes);
    if (mode === "existing-target") expect(await fs.readFile(input.databasePath, "utf8")).toBe("must not overwrite");
    else if (mode !== "bad-digest") await expect(fs.stat(input.databasePath)).rejects.toMatchObject({ code: "ENOENT" });
    if (mode === "bad-digest") {
      expect(() => CollaborationStateDatabase.open({ ...f.options, databasePath: input.databasePath })).toThrow(/binding/);
      await expect(restoreCollaborationWriter(f.input)).rejects.toThrow(/new database and lock path/);
    } else await expect(fs.stat(input.databasePath + ".writer.lock")).rejects.toMatchObject({ code: "ENOENT" });
  });

it("reports lost restore COMMIT acknowledgement without replay or overwriting the rebound database", async () => {
  const f = await fixture(), exec = DatabaseSync.prototype.exec;
  let commits = 0;
  const spy = vi.spyOn(DatabaseSync.prototype, "exec").mockImplementation(function(this: DatabaseSync, sql: string) {
    exec.call(this, sql);
    if (this.location() === f.input.databasePath && sql === "COMMIT") { commits++; throw new Error("restore acknowledgement lost"); }
  });
  try { await expect(restoreCollaborationWriter(f.input)).rejects.toMatchObject({ code: "WRITER_COMMIT_UNCONFIRMED", cause: { message: "restore acknowledgement lost" } }); }
  finally { spy.mockRestore(); }
  expect(commits).toBe(1);
  await expect(restoreCollaborationWriter(f.input)).rejects.toThrow(/new database and lock path/);
  const read = new DatabaseSync(f.input.databasePath, { readOnly: true });
  try {
    expect(read.prepare("SELECT epoch FROM writer_service_owner").get()).toEqual({ epoch: 2 });
    expect(read.prepare("SELECT COUNT(*) AS n FROM project_events WHERE request_id='original-request'").get()).toEqual({ n: 1 });
  } finally { read.close(); }
  expect(await fs.readFile(f.input.snapshotPath)).toEqual(f.bytes);
});
