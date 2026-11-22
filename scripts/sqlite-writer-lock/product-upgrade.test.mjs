import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const legacy = process.env.SCIENCEEVOLVE_LEGACY_WRITER_CORE, current = process.env.SCIENCEEVOLVE_CURRENT_WRITER_CORE;
if (!legacy || !current || !path.isAbsolute(legacy) || !path.isAbsolute(current) || legacy === current)
  throw new Error("Supply separate absolute pinned legacy and current product core source directories");
const load = (core, name) => import(pathToFileURL(path.join(core, "collaboration-state", name + ".ts")).href);
assert.equal((await load(legacy, "contracts")).COLLABORATION_STATE_SCHEMA_VERSION, 29);
assert.equal((await load(current, "contracts")).COLLABORATION_STATE_SCHEMA_VERSION, 30);
const Old = (await load(legacy, "store")).CollaborationStateDatabase;
const New = (await load(current, "store")).CollaborationStateDatabase;
const { upgradeCollaborationWriter } = await load(current, "upgrade-writer");
const { restoreCollaborationWriter } = await load(current, "restore-writer");
const scratch = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../.scratch/sqlite-writer-lock-validation");
mkdirSync(scratch, { recursive: true });
const digest = file => createHash("sha256").update(readFileSync(file)).digest("hex");

async function fixture(t) {
  const root = mkdtempSync(path.join(scratch, "product-upgrade-"));
  t.after(() => rmSync(root, { recursive: true }));
  const databasePath = path.join(root, "state.sqlite"), backupDirectory = path.join(root, "backup");
  const options = { databasePath, serviceId: "original", instanceId: "original", hostId: "test-host", topology: "single-host", now: () => 100_000 };
  const old = Old.open(options);
  try {
    old.createProject({ projectId: "p", workflowRevision: 1, workflowSnapshot: { agents: [] }, git: { enabled: false, status: "disabled" }, workerCapacity: 2 });
    old.appendEvent({ projectId: "p", requestId: "retained-session", type: "fixture.session", payload: { invocationId: "original-invocation", sessionId: "original-session" } });
    const journal = old.operationsForProject("p");
    await journal.prepare({ id: "original-operation", kind: "repository.create", status: "prepared", payloadHash: "original-request" });
    await journal.transition({ id: "original-operation", status: "uncertain", payloadHash: "original-request" });
    return { root, databasePath, options, lease: old.writerLease(), projection: old.projectState("p"), events: old.eventsAfter("p"),
      upgrade: { databasePath, hostId: options.hostId, serviceId: "upgrade", backupDirectory, confirmedStopped: true } };
  } finally { old.close(); }
}

function refuseOldOpen(file, options, token) {
  const bytes = digest(file), lock = digest(file + ".writer.lock");
  for (const attach of [false, true]) {
    assert.throws(() => Old.open({ ...options, databasePath: file, ...(attach ? { writerLease: token } : {}) }),
      error => error.code === "DATABASE_INTEGRITY_FAILED" && /omitted its writer lease table/.test(error.message));
    assert.equal(digest(file), bytes); assert.equal(digest(file + ".writer.lock"), lock);
  }
}

test("actual stopped schema-29 Store upgrades, rejects both old open paths, and restores post-upgrade commits without replay", async t => {
  const f = await fixture(t), result = await upgradeCollaborationWriter(f.upgrade);
  assert.equal(result.epoch, f.lease.epoch + 1);
  refuseOldOpen(f.databasePath, f.options, f.lease);
  const current = New.open(f.options); let epoch;
  try {
    assert.deepEqual(current.projectState("p"), f.projection); assert.deepEqual(current.eventsAfter("p"), f.events);
    current.appendEvent({ projectId: "p", requestId: "post-upgrade-commit", type: "fixture.post-upgrade", payload: { confirmed: true } });
    epoch = current.writerLease().epoch;
  } finally { current.close(); }
  // This must be a fresh stopped snapshot, not the pre-upgrade backup: rolling
  // back to that backup would silently lose the confirmed new-version event.
  const snapshotPath = path.join(f.root, "final-snapshot.sqlite"), databasePath = path.join(f.root, "restored.sqlite"); copyFileSync(f.databasePath, snapshotPath);
  const sourceLockId = JSON.parse(readFileSync(f.databasePath + ".writer.lock", "utf8")).lockId;
  const restored = await restoreCollaborationWriter({ ...f.upgrade, databasePath, snapshotPath, snapshotSha256: digest(snapshotPath), sourceLockId, sourceEpoch: epoch });
  assert.equal(restored.epoch, epoch + 1); refuseOldOpen(databasePath, f.options, f.lease);
  const next = New.open({ ...f.options, databasePath });
  try {
    assert.equal(next.writerLease().epoch, epoch + 2);
    const events = next.eventsAfter("p"); assert.deepEqual(events.slice(0, f.events.length), f.events);
    assert.equal(events.length, f.events.length + 1); assert.equal(events.at(-1).requestId, "post-upgrade-commit");
    assert.equal(next.recordedGitOperation("p", "original-operation").status, "uncertain");
  } finally { next.close(); }
});

test("actual failed protocol transition preserves the old schema, original SQL cause, projects, epoch and readable backup", async t => {
  const f = await fixture(t), raw = new DatabaseSync(f.databasePath);
  try { raw.exec(`CREATE TRIGGER deny_upgrade BEFORE UPDATE ON collaboration_state_meta WHEN NEW.schema_version=30
    BEGIN SELECT RAISE(ROLLBACK,'original protocol failure'); END;`); } finally { raw.close(); }
  const bytes = digest(f.databasePath);
  await assert.rejects(upgradeCollaborationWriter(f.upgrade), error => error.code === "WRITER_UPGRADE_REQUIRED" &&
    error.cause?.message === "original protocol failure" && error.cause.errcode === 1811);
  assert.equal(digest(f.databasePath), bytes);
  for (const file of [f.databasePath, path.join(f.upgrade.backupDirectory, "collaboration-state.sqlite")]) {
    const inspect = new DatabaseSync(file, { readOnly: true });
    try {
      assert.equal(inspect.prepare("SELECT schema_version FROM collaboration_state_meta").get().schema_version, 29);
      assert.equal(inspect.prepare("SELECT epoch FROM writer_service_lease").get().epoch, f.lease.epoch);
      assert.equal(inspect.prepare("SELECT name FROM sqlite_schema WHERE name='writer_service_owner'").get(), undefined);
      assert.equal(inspect.prepare("SELECT status FROM operations WHERE operation_id='original-operation'").get().status, "uncertain");
      assert.equal(inspect.prepare("PRAGMA integrity_check").get().integrity_check, "ok");
    } finally { inspect.close(); }
  }
});
