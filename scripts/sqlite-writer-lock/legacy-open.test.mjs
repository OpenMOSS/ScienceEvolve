import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath, pathToFileURL } from "node:url";
import { test } from "node:test";

const source = process.env.SCIENCEEVOLVE_LEGACY_WRITER_CORE;
if (!source) throw new Error("Set SCIENCEEVOLVE_LEGACY_WRITER_CORE to the core source directory of a pinned, isolated schema-29 checkout");
const { CollaborationStateDatabase } = await import(pathToFileURL(join(resolve(source), "collaboration-state/store.ts")).href);
const { COLLABORATION_STATE_SCHEMA_VERSION } = await import(pathToFileURL(join(resolve(source), "collaboration-state/contracts.ts")).href);
assert.equal(COLLABORATION_STATE_SCHEMA_VERSION, 29, "This probe must run against the actual pinned schema-29 implementation");
const scratch = join(dirname(fileURLToPath(import.meta.url)), "../../.scratch/sqlite-writer-lock-validation");
mkdirSync(scratch, { recursive: true });
const now = () => 100_000;
const digest = file => createHash("sha256").update(readFileSync(file)).digest("hex");

function fixture(t, live = false) {
  const root = mkdtempSync(join(scratch, "legacy-"));
  const databasePath = join(root, "state.sqlite");
  const options = { databasePath, serviceId: "s0-legacy-fixture", hostId: "s0-host", topology: "single-host", now };
  const writer = CollaborationStateDatabase.open(options);
  let database;
  t.after(() => {
    try { writer.close(); } finally {
      try { database?.close(); } finally { rmSync(root, { recursive: true }); }
    }
  });
  writer.createProject({ projectId: "s0-project", workflowRevision: 1, workflowSnapshot: { nodes: [], edges: [] },
    git: { enabled: false, status: "disabled" }, workerCapacity: 2, managementCapacity: 1, recoveryLimit: 3 });
  writer.appendEvent({ projectId: "s0-project", requestId: "original-effect-receipt", type: "s0.evidence",
    payload: { invocationId: "original-invocation", sessionId: "original-session", outcome: "unconfirmed" } });
  if (!live) { writer.relinquishWriterLease(); writer.close(); }
  database = new DatabaseSync(databasePath);
  return { databasePath, options, database, writer };
}

function snapshot(database) {
  const tables = database.prepare("SELECT name, sql FROM sqlite_schema WHERE type='table' ORDER BY name").all();
  return tables.map(table => ({ ...table, rows: database.prepare(`SELECT * FROM "${String(table.name).replaceAll('"', '""')}"`).all() }));
}

test("a schema-version bump alone lets the old open mutate ownership before rejection", t => {
  const { options, database } = fixture(t);
  database.exec("UPDATE collaboration_state_meta SET schema_version=30 WHERE singleton=1");
  const before = database.prepare("SELECT * FROM writer_service_lease WHERE singleton=1").get();
  assert.throws(() => CollaborationStateDatabase.open(options));
  const after = database.prepare("SELECT * FROM writer_service_lease WHERE singleton=1").get();
  assert.equal(after.epoch, before.epoch + 1, "Control case must expose the unsafe old acquire-before-version-check order");
  assert.notEqual(after.instance_id, before.instance_id);
});

for (const attach of [false, true]) {
  test(`an incompatible owner-table identity rejects old ${attach ? "attach" : "acquire"} before mutation`, t => {
    const { databasePath, options, database, writer } = fixture(t);
    const token = writer.writerLease();
    database.exec(`BEGIN IMMEDIATE;
      ALTER TABLE writer_service_lease RENAME TO writer_service_owner;
      UPDATE collaboration_state_meta SET schema_version=30 WHERE singleton=1;
      COMMIT;`);
    const before = snapshot(database), bytes = digest(databasePath);
    assert.throws(() => CollaborationStateDatabase.open({ ...options,
      ...(attach ? { instanceId: token.instanceId, writerLease: token } : {})
    }), error => error.code === "DATABASE_INTEGRITY_FAILED" && /omitted its writer lease table/.test(error.message));
    assert.deepEqual(snapshot(database), before);
    assert.equal(digest(databasePath), bytes, "Rejected legacy open must not change any SQLite bytes");
    assert.equal(database.prepare("PRAGMA journal_mode").get().journal_mode, "delete");
  });
}

test("a failed identity-change transaction preserves the schema, owner epoch and project evidence", t => {
  const { database } = fixture(t);
  const before = snapshot(database);
  assert.throws(() => {
    database.exec("BEGIN IMMEDIATE");
    try {
      database.exec(`ALTER TABLE writer_service_lease RENAME TO writer_service_owner;
        UPDATE collaboration_state_meta SET schema_version=30 WHERE singleton=1;`);
      throw new Error("Injected S0 DDL failure");
    } catch (error) {
      database.exec("ROLLBACK");
      throw error;
    }
  }, /Injected S0 DDL failure/);
  assert.deepEqual(snapshot(database), before);
  assert.equal(database.prepare("PRAGMA integrity_check").get().integrity_check, "ok");
});

test("an already-open legacy connection cannot append after an incompatible table identity switch", t => {
  const { database, writer } = fixture(t, true);
  database.exec(`BEGIN IMMEDIATE;
    ALTER TABLE writer_service_lease RENAME TO writer_service_owner;
    UPDATE collaboration_state_meta SET schema_version=30 WHERE singleton=1;
    COMMIT;`);
  const before = snapshot(database);
  assert.throws(() => writer.appendEvent({ projectId: "s0-project", requestId: "late-legacy-call", type: "s0.late", payload: {} }),
    /no such table: writer_service_lease/);
  assert.deepEqual(snapshot(database), before);
  assert.equal(database.isTransaction, false);
});
