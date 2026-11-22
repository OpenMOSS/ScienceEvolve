import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ProbeIdentityGuard } from "./identity-guard.mjs";
import { migrateStoppedFixture, acquireFixtureEpoch, assertFixtureWriter, ProbeCommitUnconfirmed } from "./protocol-fixture.mjs";

const source = process.env.SCIENCEEVOLVE_LEGACY_WRITER_CORE;
if (!source) throw new Error("SCIENCEEVOLVE_LEGACY_WRITER_CORE must name a pinned schema-29 source directory");
const { CollaborationStateDatabase } = await import(pathToFileURL(join(resolve(source), "collaboration-state/store.ts")).href);
const { COLLABORATION_STATE_SCHEMA_VERSION } = await import(pathToFileURL(join(resolve(source), "collaboration-state/contracts.ts")).href);
assert.equal(COLLABORATION_STATE_SCHEMA_VERSION, 29);
const scratch = join(dirname(fileURLToPath(import.meta.url)), "../../.scratch/sqlite-writer-lock-validation");
mkdirSync(scratch, { recursive: true });
const digest = file => createHash("sha256").update(readFileSync(file)).digest("hex");
const identity = { serviceId: "s0-protocol", hostId: "s0-host", instanceId: "new-owner", nowMs: 100_000 };

function fixture(t) {
  const root = mkdtempSync(join(scratch, "protocol-")), databasePath = join(root, "state.sqlite");
  const options = { databasePath, serviceId: "legacy-fixture", hostId: identity.hostId, topology: "single-host", now: () => 100_000 };
  let legacy, sql;
  const guards = [];
  t.after(async () => {
    legacy?.close();
    if (sql?.isTransaction) sql.exec("ROLLBACK");
    sql?.close();
    for (const guard of guards.reverse()) await guard.close(async () => {});
    rmSync(root, { recursive: true });
  });
  legacy = CollaborationStateDatabase.open(options);
  legacy.createProject({ projectId: "original-project", workflowRevision: 1, workflowSnapshot: { nodes: [], edges: [] },
    git: { enabled: false, status: "disabled" }, workerCapacity: 2, managementCapacity: 1, recoveryLimit: 3 });
  legacy.appendEvent({ projectId: "original-project", requestId: "original-receipt", type: "fixture.uncertain-effect",
    payload: { sessionId: "original-session", invocationId: "original-invocation", outcome: "unconfirmed" } });
  const oldToken = legacy.writerLease();
  // Confirm the actual legacy connection has stopped. Its unexpired timestamp
  // is deliberately retained; it is not the evidence of stop or new authority.
  legacy.close();
  const openConnection = () => {
    sql = new DatabaseSync(databasePath);
    sql.exec("PRAGMA synchronous=FULL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=50");
  };
  const closeConnection = () => { sql.close(); sql = undefined; };
  const acquire = options => {
    const guard = ProbeIdentityGuard.acquire({ databasePath, ...options }); guards.push(guard); return guard;
  };
  const guard = acquire({ provision: true });
  openConnection();
  return { root, databasePath, get sql() { return sql; }, openConnection, closeConnection, guard, acquire, oldToken, options };
}
function snapshot(sql, omitOwner = false) {
  const tables = sql.prepare("SELECT name, sql FROM sqlite_schema WHERE type='table' ORDER BY name").all()
    .filter(table => !omitOwner || !["writer_service_lease", "writer_service_owner", "legacy_writer_service_lease_v29", "collaboration_state_meta"].includes(table.name))
    .map(table => ({ ...table, rows: sql.prepare(`SELECT * FROM "${String(table.name).replaceAll('"', '""')}"`).all() }));
  return omitOwner ? tables : { tables, schema: sql.prepare("SELECT type, name, tbl_name, sql FROM sqlite_schema ORDER BY type, name").all() };
}
function reopen(f) {
  const observer = new DatabaseSync(f.databasePath, { readOnly: true });
  let expectedBinding;
  try { expectedBinding = JSON.parse(observer.prepare("SELECT identity_json FROM writer_service_owner WHERE singleton=1").get().identity_json); }
  finally { observer.close(); }
  const guard = f.acquire({ expectedBinding });
  f.openConnection();
  return guard;
}

// Each test operates only on its newly created database. The DDL is deliberately
// probe-namespaced, not a production schema or an approved live migration.
test("guarded upgrade preserves research tables and immutable old writer facts", async t => {
  const f = fixture(t), research = snapshot(f.sql, true);
  const old = f.sql.prepare("SELECT * FROM writer_service_lease WHERE singleton=1").get();
  assert.ok(old.expires_at_ms > identity.nowMs);
  const owner = migrateStoppedFixture(f.sql, f.guard, identity);
  assert.equal(owner.epoch, f.oldToken.epoch + 1);
  assert.deepEqual(f.sql.prepare("SELECT * FROM legacy_writer_service_lease_v29").get(), old);
  assert.deepEqual(snapshot(f.sql, true), research);
  assertFixtureWriter(f.sql, f.guard, owner);
  assert.throws(() => f.sql.exec("DELETE FROM legacy_writer_service_lease_v29"), /immutable/);
  assert.throws(() => f.sql.exec("UPDATE legacy_writer_service_lease_v29 SET epoch=epoch+1"), /immutable/);
  assert.throws(() => f.sql.exec("INSERT OR REPLACE INTO legacy_writer_service_lease_v29 SELECT * FROM legacy_writer_service_lease_v29"), /immutable/);
  assert.equal(f.sql.prepare("PRAGMA integrity_check").get().integrity_check, "ok");
  assert.deepEqual(f.sql.prepare("PRAGMA foreign_key_check").all(), []);
  const beforeRejection = digest(f.databasePath);
  assert.throws(() => migrateStoppedFixture(f.sql, f.guard, identity), /requires schema 29/);
  assert.equal(digest(f.databasePath), beforeRejection);
  for (const attach of [false, true]) {
    assert.throws(() => CollaborationStateDatabase.open({ ...f.options,
      ...(attach ? { instanceId: f.oldToken.instanceId, writerLease: f.oldToken } : {}) }),
    error => error.code === "DATABASE_INTEGRITY_FAILED" && /omitted its writer lease table/.test(error.message));
    assert.equal(digest(f.databasePath), beforeRejection);
  }
  assertFixtureWriter(f.sql, f.guard, owner);
  await f.guard.close(async () => f.closeConnection());
  // A far-future wall clock is diagnostic only; no expiry exists in this owner.
  const next = reopen(f), nextToken = acquireFixtureEpoch(f.sql, next, { ...identity, instanceId: "restart", nowMs: 1_000_000_000 });
  assert.equal(nextToken.epoch, owner.epoch + 1);
  assert.throws(() => assertFixtureWriter(f.sql, next, owner), /epoch was fenced/);
  assert.throws(() => assertFixtureWriter(f.sql, f.guard, owner), /closed/);
  assertFixtureWriter(f.sql, next, nextToken);
  assert.deepEqual(snapshot(f.sql, true), research);
});

test("pre-COMMIT migration failure rolls back every table and version without resetting evidence", t => {
  const f = fixture(t), before = snapshot(f.sql), original = new Error("Injected migration failure");
  assert.throws(() => migrateStoppedFixture(f.sql, f.guard, identity, point => {
    if (point === "before-commit") throw original;
  }), error => error === original);
  assert.deepEqual(snapshot(f.sql), before);
  assert.equal(f.sql.isTransaction, false);
  f.guard.assertHeld();
});

test("an actual SQLite migration error retains its error code and rolls back DDL", t => {
  const f = fixture(t);
  f.sql.exec(`CREATE TRIGGER reject_fixture_upgrade BEFORE UPDATE ON collaboration_state_meta
    BEGIN SELECT RAISE(ABORT, 'Injected SQLite migration failure'); END;`);
  const before = snapshot(f.sql);
  assert.throws(() => migrateStoppedFixture(f.sql, f.guard, identity), error =>
    /Injected SQLite migration failure/.test(error.message) && typeof error.errcode === "number" &&
    !(error instanceof ProbeCommitUnconfirmed));
  assert.deepEqual(snapshot(f.sql), before);
  assert.equal(f.sql.isTransaction, false);
  f.guard.assertHeld();
});

test("loss of a migration COMMIT result fences the owner and retains committed facts without replay", t => {
  const f = fixture(t), research = snapshot(f.sql, true);
  let attempts = 0;
  const original = new Error("Lost result after actual COMMIT");
  let failure;
  try {
    migrateStoppedFixture(f.sql, f.guard, identity, point => {
      if (point === "after-commit") { attempts++; throw original; }
    });
  } catch (error) { failure = error; }
  assert.ok(failure instanceof ProbeCommitUnconfirmed);
  assert.equal(failure.cause, original);
  assert.equal(attempts, 1);
  assert.equal(f.sql.isTransaction, false);
  assert.equal(f.sql.prepare("SELECT epoch FROM writer_service_owner").get().epoch, f.oldToken.epoch + 1);
  assert.deepEqual(snapshot(f.sql, true), research);
  assert.throws(() => f.guard.assertHeld(), error => error === failure);
  assert.throws(() => migrateStoppedFixture(f.sql, f.guard, identity), error => error === failure);
  assert.throws(() => f.acquire({ expectedBinding: f.guard.binding() }), { code: "OWNER_HELD" });
});

test("a real blocked migration COMMIT does not publish authority or blind-retry", t => {
  const f = fixture(t), before = snapshot(f.sql);
  const reader = new DatabaseSync(f.databasePath, { readOnly: true });
  reader.exec("BEGIN"); reader.prepare("SELECT * FROM project_heads").all();
  let failure;
  try { migrateStoppedFixture(f.sql, f.guard, identity); } catch (error) { failure = error; }
  finally { reader.exec("ROLLBACK"); reader.close(); }
  assert.ok(failure instanceof ProbeCommitUnconfirmed);
  assert.equal(failure.cause.errcode & 0xff, 5);
  assert.deepEqual(snapshot(f.sql), before);
  assert.equal(f.sql.isTransaction, false);
  assert.throws(() => f.guard.assertHeld(), error => error === failure);
});

for (const stage of ["before-commit", "after-commit"]) {
  test(`owner acquisition ${stage} failure preserves its exact confirmed/unknown epoch outcome`, async t => {
    const f = fixture(t), first = migrateStoppedFixture(f.sql, f.guard, identity);
    await f.guard.close(async () => f.closeConnection());
    const next = reopen(f);
    const before = snapshot(f.sql), failure = new Error(`Injected ${stage} acquisition failure`);
    let caught;
    try { acquireFixtureEpoch(f.sql, next, { ...identity, instanceId: "restart" }, point => { if (point === stage) throw failure; }); }
    catch (error) { caught = error; }
    if (stage === "before-commit") {
      assert.equal(caught, failure);
      assert.deepEqual(snapshot(f.sql), before);
      next.assertHeld();
    } else {
      assert.ok(caught instanceof ProbeCommitUnconfirmed);
      assert.equal(caught.cause, failure);
      assert.equal(f.sql.prepare("SELECT epoch FROM writer_service_owner").get().epoch, first.epoch + 1);
      assert.throws(() => next.assertHeld(), error => error === caught);
    }
  });
}

test("reacquisition rejects a different host or invalid persisted binding without incrementing epoch", async t => {
  const f = fixture(t);
  const priorToken = migrateStoppedFixture(f.sql, f.guard, identity);
  await f.guard.close(async () => f.closeConnection());
  const next = reopen(f), before = snapshot(f.sql);
  assert.throws(() => acquireFixtureEpoch(f.sql, next, { ...identity, hostId: "foreign" }), /host mismatch/);
  assert.deepEqual(snapshot(f.sql), before);
  f.sql.prepare("UPDATE writer_service_owner SET identity_json=?").run(JSON.stringify({ unexpected: true }));
  const malformed = snapshot(f.sql);
  assert.throws(() => acquireFixtureEpoch(f.sql, next, identity), /binding mismatch/);
  assert.deepEqual(snapshot(f.sql), malformed);
  assert.throws(() => assertFixtureWriter(f.sql, next, priorToken), /epoch was fenced/);
});

test("host, schema, epoch overflow and connection mismatches are rejected without mutation", async t => {
  const f = fixture(t), other = fixture(t), before = snapshot(f.sql);
  assert.throws(() => migrateStoppedFixture(f.sql, f.guard, { ...identity, hostId: "foreign-host" }), /host/);
  assert.deepEqual(snapshot(f.sql), before);
  assert.throws(() => migrateStoppedFixture(f.sql, other.guard, identity), /connection does not belong/);
  assert.deepEqual(snapshot(f.sql), before);
  f.sql.exec("UPDATE collaboration_state_meta SET schema_version=28");
  const prior = snapshot(f.sql);
  assert.throws(() => migrateStoppedFixture(f.sql, f.guard, identity), /requires schema 29/);
  assert.deepEqual(snapshot(f.sql), prior);
  f.sql.exec("UPDATE collaboration_state_meta SET schema_version=29");
  f.sql.prepare("UPDATE writer_service_lease SET epoch=?").run(Number.MAX_SAFE_INTEGER);
  const overflow = snapshot(f.sql);
  assert.throws(() => migrateStoppedFixture(f.sql, f.guard, identity), /incremented safely/);
  assert.deepEqual(snapshot(f.sql), overflow);
});
