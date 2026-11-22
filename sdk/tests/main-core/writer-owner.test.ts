import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { DatabaseSync } from "node:sqlite";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, expect, it, vi } from "vitest";
import { CollaborationStateDatabase } from "../../src/core/collaboration-state/store.js";
import { WriterOwner } from "../../src/core/collaboration-state/writer-owner.js";
import { initializeCollaborationStateSchema } from "../../src/core/collaboration-state/schema.js";
import { upgradeOwnerProtocol } from "../../src/core/collaboration-state/owner-protocol.js";
import { upgradeCollaborationWriter } from "../../src/core/collaboration-state/upgrade-writer.js";
import { CollaborationRuntimeCoordinator } from "../../src/core/collaboration-runtime.js";
import { openCollaborationStateWorker } from "../../src/core/collaboration-state/database-worker.js";
import { ProjectStorage } from "../../src/core/storage.js";
import { EventHub } from "../../src/core/event-hub.js";

const resources: Array<{ root: string; close(): void }> = [];
afterEach(async () => {
  for (const item of resources.splice(0).reverse()) { item.close(); await fs.rm(item.root, { recursive: true }); }
});
async function fixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "writer-owner-"));
  const databasePath = path.join(root, "state.sqlite");
  let now = 100_000;
  const options = { databasePath, serviceId: "service", instanceId: "original", hostId: "host", topology: "single-host" as const, now: () => now };
  const database = CollaborationStateDatabase.open(options);
  resources.push({ root, close: () => database.close() });
  database.createProject({ projectId: "project", workflowRevision: 1, workflowSnapshot: { agents: [] }, git: { enabled: false, status: "disabled" }, workerCapacity: 2, managementCapacity: 1 });
  return { root, databasePath, database, options, advance: () => { now += 86_400_000; } };
}

it("holds ownership across elapsed old TTL without updating the owner row, then advances epoch only on reopen", async () => {
  const f = await fixture(); const sql = new DatabaseSync(f.databasePath);
  try {
    const before = sql.prepare("SELECT * FROM writer_service_owner").get();
    f.advance();
    expect(() => f.database.assertWriterLeaseHeld()).not.toThrow();
    expect(() => CollaborationStateDatabase.open({ ...f.options, instanceId: "competitor" })).toThrow(expect.objectContaining({ code: "WRITER_LEASE_HELD" }));
    f.database.appendEvent({ projectId: "project", type: "still-owned", payload: {}, requestId: "once" });
    expect(sql.prepare("SELECT * FROM writer_service_owner").get()).toEqual(before);
    expect(f.database.verifyHealth()).toMatchObject({ schemaVersion: 31, journalMode: "delete", synchronous: "full" });
    const old = f.database.writerLease(); f.database.close();
    const next = CollaborationStateDatabase.open({ ...f.options, instanceId: "next" });
    try {
      expect(next.writerLease().epoch).toBe(old.epoch + 1);
      expect(() => f.database.appendEvent({ projectId: "project", type: "late", payload: {} })).toThrow("closed");
      expect(next.eventsAfter("project").filter(event => event.type === "still-owned")).toHaveLength(1);
    } finally { next.close(); }
  } finally { sql.close(); }
});

it("requires a local connection capability and keeps the owner locked until attached connections close", async () => {
  const f = await fixture(), lease = f.database.writerLease();
  expect(() => CollaborationStateDatabase.open({ ...f.options, writerLease: lease })).toThrow("local lifecycle owner capability");
  const attachment = f.database.writerOwnerAttachment();
  const attached = CollaborationStateDatabase.open({ ...f.options, writerLease: lease, writerOwner: attachment });
  try {
    expect(() => f.database.close()).toThrow("attached connections remain");
    expect(() => CollaborationStateDatabase.open({ ...f.options, instanceId: "other" })).toThrow(expect.objectContaining({ code: "WRITER_LEASE_HELD" }));
    attached.appendEvent({ projectId: "project", type: "attached", payload: {} });
  } finally { attached.close(); f.database.close(); }
});

it("refuses another epoch acquisition through a live owner's attachment", async () => {
  const f = await fixture(), original = f.database.writerLease();
  const attachment = f.database.writerOwnerAttachment();
  expect(() => CollaborationStateDatabase.open({ ...f.options, writerOwner: attachment }))
    .toThrow("acquisition was already claimed");
  expect(f.database.writerLease()).toEqual(original);
  f.database.assertWriterLeaseHeld();
  f.database.close();
});

it("rejects an attached Worker's wrong database path and drains its rejected reservation", async () => {
  const f = await fixture();
  await expect(openCollaborationStateWorker({ ...f.options, databasePath: path.join(f.root, "wrong.sqlite"),
    writerLease: f.database.writerLease(), writerOwner: f.database.writerOwnerAttachment() })).rejects.toThrow("another database path");
  f.database.assertWriterLeaseHeld();
  expect(() => f.database.close()).not.toThrow();
});

it("rejects a stale Worker attachment without fencing the established owner or changing its epoch", async () => {
  const f = await fixture();
  f.database.close();
  const database = CollaborationStateDatabase.open(f.options);
  try {
    const current = database.writerLease();
    const before = database.eventsAfter("project");
    const failed = vi.fn();
    await expect(openCollaborationStateWorker({ ...f.options, writerOwner: database.writerOwnerAttachment(),
      writerLease: { ...current, epoch: current.epoch - 1 } }, failed)).rejects.toMatchObject({ code: "WRITER_LEASE_STALE" });
    database.assertWriterLeaseHeld();
    expect(failed).not.toHaveBeenCalled();
    expect(database.writerLease()).toEqual(current);
    expect(database.eventsAfter("project")).toEqual(before);
    const valid = await openCollaborationStateWorker({ ...f.options, writerOwner: database.writerOwnerAttachment(), writerLease: current });
    try {
      await valid.appendEvent({ projectId: "project", requestId: "valid-attachment", type: "attached", payload: {} });
      expect(database.eventsAfter("project").filter(event => event.requestId === "valid-attachment")).toHaveLength(1);
    } finally { await valid.close(); }
  } finally { database.close(); }
});

it("fences the shared owner when an admitted attached Worker observes a replaced epoch", async () => {
  const f = await fixture();
  const lease = f.database.writerLease(), before = f.database.eventsAfter("project");
  const failed = vi.fn();
  const worker = await openCollaborationStateWorker({ ...f.options, writerLease: lease, writerOwner: f.database.writerOwnerAttachment() }, failed);
  try {
    const observer = new DatabaseSync(f.databasePath);
    try { observer.exec("UPDATE writer_service_owner SET epoch = epoch + 1"); }
    finally { observer.close(); }
    await expect(worker.appendEvent({ projectId: "project", type: "late", payload: {} })).rejects.toMatchObject({ code: "WRITER_LEASE_STALE" });
    expect(failed).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ code: "WRITER_LEASE_STALE" }));
    expect(() => f.database.assertWriterAvailable()).toThrow(expect.objectContaining({ code: "WRITER_LEASE_STALE" }));
    expect(f.database.eventsAfter("project")).toEqual(before);
    expect(() => CollaborationStateDatabase.open(f.options)).toThrow(expect.objectContaining({ code: "WRITER_LEASE_HELD" }));
  } finally { await worker.close(); }
});

it("notifies the host immediately when an admitted Worker fences on invalid ownership metadata", async () => {
  const f = await fixture(), before = f.database.eventsAfter("project"), failed = vi.fn();
  const worker = await openCollaborationStateWorker({ ...f.options, writerLease: f.database.writerLease(), writerOwner: f.database.writerOwnerAttachment() }, failed);
  try {
    const raw = new DatabaseSync(f.databasePath);
    try { raw.exec("UPDATE writer_service_owner SET identity_json='{}'"); } finally { raw.close(); }
    await expect(worker.appendEvent({ projectId: "project", type: "late", payload: {} })).rejects.toMatchObject({ code: "UNSAFE_CONFIGURATION" });
    // No health poll, next request or time-based check should be needed to stop the host.
    expect(failed).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ code: "UNSAFE_CONFIGURATION" }));
    expect(await worker.eventsAfter("project")).toEqual(before);
    expect(() => CollaborationStateDatabase.open(f.options)).toThrow(expect.objectContaining({ code: "WRITER_LEASE_HELD" }));
  } finally { await worker.close(); }
});

it("rejects a busy read of the ownership table without revoking a live owner", async () => {
  const f = await fixture(), peer = new DatabaseSync(f.databasePath), owner = f.database.writerLease();
  const raw = Reflect.get(f.database, "database") as DatabaseSync;
  raw.exec("PRAGMA busy_timeout=1");
  try {
    peer.exec("BEGIN EXCLUSIVE");
    expect(() => f.database.assertWriterLeaseHeld()).toThrow(expect.objectContaining({ errcode: 5 }));
    peer.exec("ROLLBACK");
    f.database.assertWriterLeaseHeld();
    expect(f.database.writerLease()).toEqual(owner);
    const result = f.database.appendEvent({ projectId: "project", requestId: "after-reader-busy", type: "written.once", payload: {} });
    expect(result.replay).toBe(false);
  } finally { if (peer.isTransaction) peer.exec("ROLLBACK"); peer.close(); }
});

it("fences when SQLite cannot read the authority table, preserving the SQL error and the lock", async () => {
  const f = await fixture(), failed = vi.fn();
  const worker = await openCollaborationStateWorker({ ...f.options, writerLease: f.database.writerLease(), writerOwner: f.database.writerOwnerAttachment() }, failed);
  try {
    const raw = new DatabaseSync(f.databasePath);
    try { raw.exec("DROP TABLE writer_service_owner"); } finally { raw.close(); }
    const original = expect.objectContaining({ errcode: 1, message: expect.stringContaining("writer_service_owner") });
    await expect(worker.appendEvent({ projectId: "project", type: "not-authorized", payload: {} })).rejects.toThrow(original);
    expect(failed).toHaveBeenCalledExactlyOnceWith(original);
    expect(await worker.eventsAfter("project")).not.toContainEqual(expect.objectContaining({ type: "not-authorized" }));
    expect(() => CollaborationStateDatabase.open(f.options)).toThrow(expect.objectContaining({ code: "WRITER_LEASE_HELD" }));
  } finally { await worker.close(); }
});

it("rejects hardlinked databases before creating another sidecar and rejects missing or replaced lock identity", async () => {
  const f = await fixture(), alias = path.join(f.root, "hardlink.sqlite");
  await fs.link(f.databasePath, alias);
  expect(() => CollaborationStateDatabase.open({ ...f.options, databasePath: alias })).toThrow("single-link");
  await expect(fs.stat(alias + ".writer.lock")).rejects.toMatchObject({ code: "ENOENT" });
  await fs.unlink(alias);
  f.database.close();
  const lock = f.databasePath + ".writer.lock", retained = lock + ".retained";
  await fs.rename(lock, retained);
  const before = await fs.readFile(f.databasePath);
  expect(() => CollaborationStateDatabase.open(f.options)).toThrow(expect.objectContaining({ code: "WRITER_UPGRADE_REQUIRED" }));
  await fs.copyFile(retained, lock);
  expect(() => CollaborationStateDatabase.open(f.options)).toThrow("filesystem identity");
  expect(await fs.readFile(f.databasePath)).toEqual(before);
});

it("converges directory aliases and refuses live sidecar substitution without accepting a second writer", async () => {
  const f = await fixture(), alias = path.join(f.root, "alias"), lock = f.databasePath + ".writer.lock";
  await fs.symlink(f.root, alias, process.platform === "win32" ? "junction" : "dir");
  expect(() => CollaborationStateDatabase.open({ ...f.options, databasePath: path.join(alias, path.basename(f.databasePath)) }))
    .toThrow(expect.objectContaining({ code: "WRITER_LEASE_HELD" }));
  const before = f.database.eventsAfter("project"), binding = f.database.writerLease();
  try { await fs.rename(lock, lock + ".retained"); }
  catch (error) {
    // Some Windows filesystems deny rename while the exclusive handle is open.
    if (process.platform !== "win32" || !["EPERM", "EBUSY", "EACCES"].includes((error as NodeJS.ErrnoException).code!)) throw error;
    f.database.assertWriterLeaseHeld();
    expect(() => CollaborationStateDatabase.open(f.options)).toThrow(expect.objectContaining({ code: "WRITER_LEASE_HELD" }));
    expect(f.database.writerLease()).toEqual(binding);
    return;
  }
  // A new regular file at the old name must not establish a new owner, even
  // though it has a different (and independently lockable) physical identity.
  await fs.writeFile(lock, "replacement", { flag: "wx" });
  expect(() => f.database.appendEvent({ projectId: "project", type: "late", payload: {} })).toThrow(/identity changed/);
  expect(() => CollaborationStateDatabase.open(f.options)).toThrow();
  expect(f.database.eventsAfter("project")).toEqual(before);
  const reader = new DatabaseSync(f.databasePath, { readOnly: true });
  try { expect(reader.prepare("SELECT epoch FROM writer_service_owner").get()?.epoch).toBe(binding.epoch); }
  finally { reader.close(); }
});

it("preserves CAS and the original SQLite trigger error with no partial project mutation", async () => {
  const f = await fixture(), sql = new DatabaseSync(f.databasePath);
  try {
    const revision = f.database.projectState("project").stateRevision;
    f.database.appendEvent({ projectId: "project", expectedRevision: revision, type: "winner", payload: {} });
    expect(() => f.database.appendEvent({ projectId: "project", expectedRevision: revision, type: "loser", payload: {} })).toThrow(expect.objectContaining({ code: "STALE_PROJECT_REVISION" }));
    const before = f.database.eventsAfter("project");
    sql.exec("CREATE TRIGGER fail_event BEFORE INSERT ON project_events BEGIN SELECT RAISE(ROLLBACK, 'original_event_failure'); END");
    expect(() => f.database.appendEvent({ projectId: "project", type: "failed", payload: {} })).toThrow(expect.objectContaining({ message: "original_event_failure", errcode: 1811 }));
    expect(f.database.eventsAfter("project")).toEqual(before);
    expect(() => f.database.assertWriterLeaseHeld()).not.toThrow();
  } finally { sql.close(); }
});

it("retains the original SQLite FULL statement error and no partial event at a real page limit", async () => {
  const f = await fixture(), raw = Reflect.get(f.database, "database") as DatabaseSync;
  const before = f.database.projectState("project"), events = f.database.eventsAfter("project"), owner = f.database.writerLease();
  const pages = raw.prepare("PRAGMA page_count").get()!.page_count;
  expect(raw.prepare(`PRAGMA max_page_count=${pages}`).get()!.max_page_count).toBe(pages);
  expect(() => f.database.appendEvent({ projectId: "project", type: "out-of-pages", payload: { detail: "x".repeat(128 * 1024) } }))
    .toThrow(expect.objectContaining({ errcode: 13 }));
  expect(raw.isTransaction).toBe(false);
  expect(f.database.projectState("project").stateRevision).toBe(before.stateRevision);
  expect(f.database.eventsAfter("project")).toEqual(events);
  f.database.assertWriterLeaseHeld(); expect(f.database.writerLease()).toEqual(owner);
});

it("fences an unconfirmed COMMIT without replay or pretending a committed event rolled back", async () => {
  const f = await fixture(), raw = Reflect.get(f.database, "database") as DatabaseSync;
  const original = raw.exec.bind(raw); let commits = 0, elapsed = 0;
  const clock = vi.spyOn(performance, "now").mockImplementation(() => elapsed);
  const diagnostic = vi.spyOn(console, "warn").mockImplementation(() => {});
  const spy = vi.spyOn(raw, "exec").mockImplementation(sql => {
    original(sql);
    if (sql === "COMMIT") { commits++; elapsed += 1500; throw new Error("Lost committed result"); }
  });
  try {
    expect(() => f.database.appendEvent({ projectId: "project", type: "unknown", payload: {} })).toThrow(expect.objectContaining({ code: "WRITER_COMMIT_UNCONFIRMED", cause: expect.objectContaining({ message: "Lost committed result" }) }));
    expect(() => f.database.appendEvent({ projectId: "project", type: "retry-not-allowed", payload: {} })).toThrow();
    expect(commits).toBe(1);
    expect(raw.prepare("SELECT count(*) AS n FROM project_events WHERE event_type='unknown'").get()).toMatchObject({ n: 1 });
    expect(raw.isTransaction).toBe(false);
    expect(diagnostic).toHaveBeenCalledWith("Collaboration SQLite mutation exceeded 1000ms", expect.objectContaining({ committed: null, commitMs: 1500 }));
  } finally { spy.mockRestore(); diagnostic.mockRestore(); clock.mockRestore(); }
});

it("rejects old schemas at ordinary startup and preserves research facts through explicit offline upgrade", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "writer-upgrade-")), file = path.join(root, "legacy.sqlite");
  let sql: DatabaseSync | undefined = new DatabaseSync(file), owner: WriterOwner | undefined;
  resources.push({ root, close: () => { sql?.close(); owner?.close(); } });
  sql.exec("PRAGMA journal_mode=DELETE; PRAGMA synchronous=FULL; PRAGMA foreign_keys=ON");
  initializeCollaborationStateSchema(sql);
  sql.exec("INSERT INTO writer_service_lease VALUES(1,'old-service','old-instance','host',21,9999999999999,100000)");
  const old = sql.prepare("SELECT * FROM writer_service_lease").get();
  sql.close(); sql = undefined;
  const before = await fs.readFile(file);
  const options = { databasePath: file, serviceId: "new", instanceId: "new", hostId: "host", topology: "single-host" as const };
  expect(() => CollaborationStateDatabase.open(options)).toThrow(expect.objectContaining({ code: "WRITER_UPGRADE_REQUIRED" }));
  expect(await fs.readFile(file)).toEqual(before);
  owner = WriterOwner.open(file, { offlineUpgrade: true });
  sql = new DatabaseSync(file); sql.exec("PRAGMA synchronous=FULL; PRAGMA foreign_keys=ON");
  const next = upgradeOwnerProtocol(sql, owner, { serviceId: "new", instanceId: "upgrade", hostId: "host" }, 200_000);
  expect(next.epoch).toBe(22);
  expect(sql.prepare("SELECT * FROM legacy_writer_service_lease_v29").get()).toEqual(old);
  expect(sql.prepare("SELECT name FROM sqlite_schema WHERE name='writer_service_lease'").get()).toBeUndefined();
  expect(sql.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
  sql.close(); sql = undefined; owner.close(); owner = undefined;
  const opened = CollaborationStateDatabase.open(options);
  try { expect(opened.writerLease().epoch).toBe(23); } finally { opened.close(); }
});

it("refuses offline migration on a foreign SQLite connection before changing schema or consuming the lock acquisition", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "writer-foreign-connection-"));
  const first = path.join(root, "original.sqlite"), copy = path.join(root, "copy.sqlite");
  resources.push({ root, close: () => {} });
  const original = new DatabaseSync(first);
  try {
    initializeCollaborationStateSchema(original);
    original.exec("INSERT INTO writer_service_lease VALUES(1,'original','original','host',4,1,1)");
  } finally { original.close(); }
  await fs.copyFile(first, copy);
  const expected = await fs.readFile(copy), identity = { serviceId: "service", instanceId: "upgrade", hostId: "host" };
  const owner = WriterOwner.open(first, { offlineUpgrade: true });
  const foreign = new DatabaseSync(copy), matching = new DatabaseSync(first);
  try {
    foreign.exec("PRAGMA synchronous=FULL; PRAGMA foreign_keys=ON"); matching.exec("PRAGMA synchronous=FULL; PRAGMA foreign_keys=ON");
    expect(() => upgradeOwnerProtocol(foreign, owner, identity, 100)).toThrow(/SQLite connection does not match/);
    expect(await fs.readFile(copy)).toEqual(expected);
    expect(upgradeOwnerProtocol(matching, owner, identity, 100).epoch).toBe(5);
  } finally { foreign.close(); matching.close(); owner.close(); }
});

it.each(["modern", "missing-meta", "unrelated"])("refuses %s research schema initialization before any DDL", async mode => {
  const f = await fixture(); f.database.close();
  const file = mode === "unrelated" ? path.join(f.root, "other.sqlite") : f.databasePath;
  const sql = new DatabaseSync(file);
  try {
    if (mode === "unrelated") sql.exec("CREATE TABLE retained(value TEXT); INSERT INTO retained VALUES('original')");
    if (mode === "missing-meta") sql.exec("DELETE FROM collaboration_state_meta");
    const before = await fs.readFile(file);
    expect(() => initializeCollaborationStateSchema(sql)).toThrow(expect.objectContaining({
      code: mode === "modern" ? "UNSAFE_CONFIGURATION" : "DATABASE_INTEGRITY_FAILED" }));
    expect(await fs.readFile(file)).toEqual(before);
  } finally { sql.close(); }
});

it("keeps lifecycle ownership during a business transaction crossing the old deadline and fences a real epoch replacement", async () => {
  const f = await fixture(), raw = Reflect.get(f.database, "database") as DatabaseSync;
  const immediate = Reflect.get(f.database, "immediate").bind(f.database) as (work: () => void) => void;
  immediate(() => { f.advance(); raw.exec("CREATE TABLE committed_work(value TEXT); INSERT INTO committed_work VALUES('committed')"); });
  expect(raw.prepare("SELECT * FROM committed_work").all()).toEqual([{ value: "committed" }]);
  const before = f.database.eventsAfter("project");
  raw.exec("UPDATE writer_service_owner SET epoch=epoch+1");
  expect(() => f.database.appendEvent({ projectId: "project", type: "late", payload: {} })).toThrow(expect.objectContaining({ code: "WRITER_LEASE_STALE" }));
  expect(f.database.eventsAfter("project")).toEqual(before);
});

it("preserves the writer and event cursor across a real SQLITE_BUSY, then commits the original request once", async () => {
  const f = await fixture(), holder = new DatabaseSync(f.databasePath);
  const writer = Reflect.get(f.database, "database") as DatabaseSync;
  writer.exec("PRAGMA busy_timeout=5");
  const owner = f.database.writerLease(), events = f.database.eventsAfter("project");
  const request = { projectId: "project", requestId: "same-after-busy", type: "test.saved", payload: {} };
  try {
    holder.exec("BEGIN IMMEDIATE");
    expect(() => f.database.appendEvent(request)).toThrow(expect.objectContaining({ errcode: 5 }));
    expect(f.database.eventsAfter("project")).toEqual(events);
    expect(f.database.writerLease()).toEqual(owner);
    holder.exec("ROLLBACK");
    expect(f.database.appendEvent(request).replay).toBe(false);
    expect(f.database.appendEvent(request).replay).toBe(true);
    expect(f.database.eventsAfter("project").filter(row => row.requestId === request.requestId)).toHaveLength(1);
  } finally { holder.close(); }
});

it("does not roll back another transaction when BEGIN fails and retains actual SQL errors", async () => {
  const f = await fixture(), raw = Reflect.get(f.database, "database") as DatabaseSync;
  raw.exec("BEGIN IMMEDIATE");
  try {
    expect(() => f.database.appendEvent({ projectId: "project", type: "nested", payload: {} })).toThrow("within a transaction");
    expect(raw.isTransaction).toBe(true);
  } finally { raw.exec("ROLLBACK"); }
  expect(() => f.database.assertWriterLeaseHeld()).not.toThrow();
});

it("closes duplicate runtime initialization and shutdown through one lifecycle without heartbeat expiry", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "runtime-owner-"));
  const storage = new ProjectStorage(root, new EventHub()); await storage.initialize();
  let clock = Date.now();
  const runtime = new CollaborationRuntimeCoordinator({ storage, serviceId: "runtime", hostId: "host", now: () => clock });
  try {
    const first = runtime.initialize(); expect(runtime.initialize()).toBe(first); await first;
    const original = runtime.writerLeaseHealth(); clock += 86_400_000;
    expect(runtime.writerLeaseHealth()).toEqual(original);
    expect(original).toMatchObject({ status: "ready", ownership: "lifecycle-lock", epoch: 1 });
    const closing = runtime.shutdown(); expect(runtime.shutdown()).toBe(closing); await closing;
    expect(runtime.writerLeaseHealth().status).toBe("unavailable");
    const next = new CollaborationRuntimeCoordinator({ storage, serviceId: "next", hostId: "host" });
    try { await next.initialize(); expect(next.writerLeaseHealth().epoch).toBe(2); }
    finally { await next.shutdown(); }
  } finally { await runtime.shutdown(); await fs.rm(root, { recursive: true }); }
});

it("retains the descriptor and rejects writes when runtime dispatcher drain fails", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "writer-failed-drain-"));
  const databasePath = path.join(root, "state.sqlite"), storage = new ProjectStorage(root, new EventHub()); await storage.initialize();
  const failure = new Error("Original dispatcher drain failure");
  const runtime = new CollaborationRuntimeCoordinator({ storage, databasePath, serviceId: "drain", hostId: "host",
    invocationDispatcher: { flush: async () => { throw failure; }, decorate: () => {}, trace: () => { throw new Error("No invocation expected"); } } });
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  await runtime.initialize();
  const database = runtime.database();
  try {
    const closing = runtime.shutdown();
    await expect(closing).rejects.toBe(failure); expect(runtime.shutdown()).toBe(closing);
    expect(() => CollaborationStateDatabase.open({ databasePath, serviceId: "other", hostId: "host", topology: "single-host" }))
      .toThrow(expect.objectContaining({ code: "WRITER_LEASE_HELD" }));
    await expect(database.createProject({ projectId: "late", workflowRevision: 1, workflowSnapshot: {},
      git: { enabled: false, status: "disabled" }, workerCapacity: 1, managementCapacity: 1 })).rejects.toMatchObject({ code: "WRITER_LEASE_STALE" });
    expect(await database.listProjectStates()).toEqual([]);
  } finally {
    // No Agent or external operation was opened in this fixture. Close its
    // captured database only after the failed-drain lock assertion above.
    await database.close(); log.mockRestore(); await fs.rm(root, { recursive: true });
  }
});

it("backs up an offline legacy database before upgrading and refuses a foreign host without provisioning", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "offline-writer-")), databasePath = path.join(root, "legacy.sqlite");
  resources.push({ root, close: () => {} });
  const raw = new DatabaseSync(databasePath);
  try {
    raw.exec("PRAGMA journal_mode=DELETE; PRAGMA synchronous=FULL"); initializeCollaborationStateSchema(raw);
    raw.exec("INSERT INTO writer_service_lease VALUES(1,'original','original','host',7,9999999999999,1)");
  } finally { raw.close(); }
  const backupDirectory = path.join(root, "backup");
  await expect(upgradeCollaborationWriter({ databasePath, backupDirectory, hostId: "foreign", serviceId: "new", confirmedStopped: true }))
    .rejects.toThrow("original writer host");
  await expect(fs.stat(databasePath + ".writer.lock")).rejects.toMatchObject({ code: "ENOENT" });
  const result = await upgradeCollaborationWriter({ databasePath, backupDirectory, hostId: "host", serviceId: "new", confirmedStopped: true });
  expect(result.epoch).toBe(8);
  const backup = new DatabaseSync(result.backupPath, { readOnly: true });
  try {
    expect(backup.prepare("SELECT schema_version FROM collaboration_state_meta").get()).toMatchObject({ schema_version: 29 });
    expect(backup.prepare("SELECT epoch FROM writer_service_lease").get()).toMatchObject({ epoch: 7 });
    expect(backup.prepare("PRAGMA integrity_check").get()).toMatchObject({ integrity_check: "ok" });
  } finally { backup.close(); }
});

it.each(["normal", "exit"])("releases a child-owned database after confirmed %s shutdown", async mode => {
  const f = await fixture(); f.database.close();
  const module = new URL("../../src/core/collaboration-state/store.ts", import.meta.url).href;
  const program = `const {CollaborationStateDatabase}=await import(${JSON.stringify(module)});
    const db=CollaborationStateDatabase.open(${JSON.stringify({ ...f.options, now: undefined })});
    ${mode === "normal" ? "db.close();" : ""}process.stdout.write('ready');`;
  const result = await promisify(execFile)(process.execPath, ["--import", "tsx", "--input-type=module", "-e", program], { timeout: 10_000 });
  expect(result.stdout).toBe("ready");
  const next = CollaborationStateDatabase.open(f.options);
  try { expect(next.writerLease().epoch).toBe(3); } finally { next.close(); }
});
