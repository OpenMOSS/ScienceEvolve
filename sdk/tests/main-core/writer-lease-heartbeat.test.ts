import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { DatabaseSync } from "node:sqlite";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, expect, it, vi } from "vitest";
import { WriterLeaseHeartbeat } from "../../src/core/collaboration-state/writer-lease-heartbeat.js";
import { CollaborationStateDatabase } from "../../src/core/collaboration-state/store.js";
import type { WriterLeaseToken } from "../../src/core/collaboration-state/contracts.js";

const resources: Array<{ root: string; db: DatabaseSync; heartbeat?: WriterLeaseHeartbeat }> = [];
afterEach(async () => {
  for (const item of resources.splice(0)) { await item.heartbeat?.stop(); item.db.close(); await fs.rm(item.root, { recursive: true, force: true }); }
});
async function fixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "lease-heartbeat-"));
  const databasePath = path.join(root, "state.sqlite"), db = new DatabaseSync(databasePath);
  db.exec(`CREATE TABLE writer_service_lease (singleton INTEGER PRIMARY KEY, service_id TEXT, instance_id TEXT,
    host_id TEXT, epoch INTEGER, expires_at_ms INTEGER, renewed_at_ms INTEGER); CREATE TABLE work(value TEXT);`);
  const now = Date.now();
  const lease: WriterLeaseToken = { serviceId: "service", instanceId: "instance", hostId: "host", epoch: 1, expiresAtMs: now + 10_000 };
  db.prepare("INSERT INTO writer_service_lease VALUES(1,?,?,?,?,?,?)").run(lease.serviceId, lease.instanceId, lease.hostId, 1, lease.expiresAtMs, now);
  const item = { root, db, heartbeat: undefined as WriterLeaseHeartbeat | undefined }; resources.push(item);
  return { ...item, item, databasePath, lease };
}

it("renews the same epoch while the business thread is blocked longer than the lease", async () => {
  const f = await fixture(), failures: Error[] = [];
  f.item.heartbeat = await WriterLeaseHeartbeat.start({ databasePath: f.databasePath, lease: f.lease, leaseDurationMs: 3000 }, error => failures.push(error));
  const before = f.item.heartbeat.diagnostics().lastSuccessfulRenewalAtMs!;
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 3700);
  expect(() => f.item.heartbeat!.assertHeld()).not.toThrow();
  const row = f.db.prepare("SELECT * FROM writer_service_lease").get()!;
  expect(Number(row.expires_at_ms)).toBeGreaterThan(Date.now());
  expect(Number(row.renewed_at_ms)).toBeGreaterThan(before);
  expect(row).toMatchObject({ instance_id: f.lease.instanceId, epoch: 1 }); expect(failures).toEqual([]);
  await f.item.heartbeat.stop();
  expect(() => f.item.heartbeat!.assertHeld()).toThrow();
}, 15_000);

it("rejects an expired token without acquiring a new epoch", async () => {
  const f = await fixture(); f.db.prepare("UPDATE writer_service_lease SET expires_at_ms=?").run(Date.now() - 1);
  const before = f.db.prepare("SELECT * FROM writer_service_lease").get();
  await expect(WriterLeaseHeartbeat.start({ databasePath: f.databasePath, lease: f.lease, leaseDurationMs: 3000 }, () => {}))
    .rejects.toMatchObject({ code: "WRITER_LEASE_STALE" });
  expect(f.db.prepare("SELECT * FROM writer_service_lease").get()).toEqual(before);
});

it("waits through a blocked lease read and renews the original epoch after the lock clears", async () => {
  const f = await fixture(), failures: Error[] = [];
  f.item.heartbeat = await WriterLeaseHeartbeat.start({ databasePath: f.databasePath, lease: f.lease, leaseDurationMs: 24_000 }, error => failures.push(error));
  const confirmed = f.item.heartbeat.diagnostics();
  f.db.exec("BEGIN EXCLUSIVE");
  try {
    // One renewal and its confirmation each encounter the real 5s busy wait.
    await new Promise(resolve => setTimeout(resolve, 19_000));
    expect(() => f.item.heartbeat!.assertHeld()).not.toThrow();
    expect(failures).toEqual([]);
    expect(f.item.heartbeat.diagnostics().lease.expiresAtMs).toBe(confirmed.lease.expiresAtMs);
    expect(f.item.heartbeat.diagnostics().lastSuccessfulRenewalAtMs).toBe(confirmed.lastSuccessfulRenewalAtMs);
  } finally { f.db.exec("ROLLBACK"); }
  await vi.waitFor(() => expect(f.item.heartbeat!.diagnostics().lastSuccessfulRenewalAtMs)
    .toBeGreaterThan(confirmed.lastSuccessfulRenewalAtMs!), { timeout: 4000, interval: 25 });
  expect(f.db.prepare("SELECT epoch,instance_id FROM writer_service_lease").get()).toMatchObject({ epoch: 1, instance_id: "instance" });
  expect(failures).toEqual([]);
}, 28_000);

it("stops at the original expiry when SQLite remains locked and never reacquires it", async () => {
  const f = await fixture(), failures: Error[] = [];
  f.item.heartbeat = await WriterLeaseHeartbeat.start({ databasePath: f.databasePath, lease: f.lease, leaseDurationMs: 6000 }, error => failures.push(error));
  const confirmed = f.item.heartbeat.diagnostics();
  f.db.exec("BEGIN EXCLUSIVE");
  try {
    await new Promise(resolve => setTimeout(resolve, 6500));
    expect(() => f.item.heartbeat!.assertHeld()).toThrow();
    expect(failures).toHaveLength(1);
  } finally { f.db.exec("ROLLBACK"); }
  await f.item.heartbeat.stop();
  const row = f.db.prepare("SELECT * FROM writer_service_lease").get()!;
  expect(row).toMatchObject({ epoch: 1, instance_id: "instance", expires_at_ms: confirmed.lease.expiresAtMs });
  expect(f.item.heartbeat.diagnostics().lastSuccessfulRenewalAtMs).toBe(confirmed.lastSuccessfulRenewalAtMs);
}, 12_000);

it("fences synchronously after another epoch replaces this writer", async () => {
  const f = await fixture(), failures: Error[] = [];
  f.item.heartbeat = await WriterLeaseHeartbeat.start({ databasePath: f.databasePath, lease: f.lease, leaseDurationMs: 3000 }, error => failures.push(error));
  f.db.exec("UPDATE writer_service_lease SET epoch=2,instance_id='successor'");
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1600);
  expect(() => f.item.heartbeat!.assertHeld()).toThrow("expired or was replaced");
  expect(failures).toHaveLength(1); expect(failures[0]).toMatchObject({ code: "WRITER_LEASE_STALE" });
  expect(f.db.prepare("SELECT epoch,instance_id FROM writer_service_lease").get()).toMatchObject({ epoch: 2, instance_id: "successor" });
}, 10_000);

it("preserves the original SQLite trigger error across the worker boundary", async () => {
  const f = await fixture(); f.db.exec(`CREATE TRIGGER reject_heartbeat BEFORE UPDATE ON writer_service_lease
    BEGIN SELECT RAISE(ROLLBACK, 'original_failure'); END;`);
  await expect(WriterLeaseHeartbeat.start({ databasePath: f.databasePath, lease: f.lease, leaseDurationMs: 3000 }, () => {}))
    .rejects.toMatchObject({ message: "original_failure", errcode: 1811 });
  expect(f.db.prepare("SELECT expires_at_ms FROM writer_service_lease").get()!.expires_at_ms).toBe(f.lease.expiresAtMs);
});

it("rolls back a business transaction that crosses the lease deadline", async () => {
  const f = await fixture(); let now = Date.now();
  const state = Reflect.construct(CollaborationStateDatabase, [f.db, { now: () => now, leaseDurationMs: 3000 }, f.lease, {}]) as
    { immediate(work: () => void): void };
  expect(() => state.immediate(() => { f.db.exec("INSERT INTO work VALUES('unfinished')"); now = f.lease.expiresAtMs + 1; }))
    .toThrow("writer epoch/expiry fence");
  expect(f.db.prepare("SELECT COUNT(*) AS n FROM work").get()!.n).toBe(0);
  expect(f.db.isTransaction).toBe(false);
});

it("rechecks the clock after acquiring a lock instead of reviving an expired token", async () => {
  const f = await fixture(); let now = f.lease.expiresAtMs - 100;
  const originalExec = f.db.exec.bind(f.db);
  const exec = vi.spyOn(f.db, "exec").mockImplementation(sql => { originalExec(sql); if (sql === "BEGIN IMMEDIATE") now = f.lease.expiresAtMs + 1; });
  const state = Reflect.construct(CollaborationStateDatabase, [f.db, { now: () => now, leaseDurationMs: 3000 }, f.lease, {}]) as CollaborationStateDatabase;
  try {
    expect(() => state.renewWriterLease()).toThrow("expired or was replaced");
    expect(f.db.prepare("SELECT expires_at_ms FROM writer_service_lease").get()!.expires_at_ms).toBe(f.lease.expiresAtMs);
    expect(state.writerLeaseDiagnostics().lastSuccessfulRenewalAtMs).toBeNull();
  } finally { exec.mockRestore(); }
});
it("blocks business writes on a failed heartbeat before its valid token expires", async () => {
  const f = await fixture();
  f.item.heartbeat = await WriterLeaseHeartbeat.start({ databasePath: f.databasePath, lease: f.lease, leaseDurationMs: 5000 }, () => {});
  const state = Reflect.construct(CollaborationStateDatabase, [f.db, { now: Date.now, leaseDurationMs: 5000 }, f.lease, {}]) as CollaborationStateDatabase;
  state.bindWriterAvailabilityCheck(() => f.item.heartbeat!.assertHeld());
  f.db.exec(`CREATE TRIGGER reject_later_heartbeat BEFORE UPDATE ON writer_service_lease
    BEGIN SELECT RAISE(ROLLBACK, 'later_original_failure'); END;`);
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2200);
  expect(Number(f.db.prepare("SELECT expires_at_ms FROM writer_service_lease").get()!.expires_at_ms)).toBeGreaterThan(Date.now());
  expect(() => state.assertWriterLeaseHeld()).toThrow("later_original_failure");
}, 15_000);

it.each(["natural-exit", "stop"])("closes with its parent and completes awaited shutdown (%s)", async mode => {
  const f = await fixture();
  const module = new URL(import.meta.url.includes("/main-core/") ? "../../src/core/collaboration-state/writer-lease-heartbeat.ts"
    : "../src/collaboration-state/writer-lease-heartbeat.ts", import.meta.url).href;
  const program = `const {WriterLeaseHeartbeat}=await import(${JSON.stringify(module)});
    const heartbeat=await WriterLeaseHeartbeat.start(${JSON.stringify({ databasePath: f.databasePath, lease: f.lease, leaseDurationMs: 5000 })},()=>{});
    ${mode === "stop" ? "await heartbeat.stop();" : ""}
    process.stdout.write('ready');`;
  const result = await promisify(execFile)(process.execPath, ["--input-type=module", "-e", program], { timeout: 10_000 });
  expect(result.stdout).toBe("ready");
  const before = f.db.prepare("SELECT renewed_at_ms FROM writer_service_lease").get()!.renewed_at_ms;
  await new Promise(resolve => setTimeout(resolve, 1800));
  expect(f.db.prepare("SELECT renewed_at_ms FROM writer_service_lease").get()!.renewed_at_ms).toBe(before);
}, 15_000);
