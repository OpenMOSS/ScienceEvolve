import { isDeepStrictEqual } from "node:util";
import { realpathSync } from "node:fs";

// S0 test fixture only. Callers create a disposable schema-29 database, stop its
// actual old Store and hold a ProbeIdentityGuard. This is not an upgrade CLI.
export class ProbeCommitUnconfirmed extends Error {
  constructor(cause) {
    super("Fixture COMMIT outcome is unconfirmed; fenced without retry", { cause });
    this.name = "ProbeCommitUnconfirmed";
    this.code = "COMMIT_UNCONFIRMED";
  }
}
function fail(message) { throw new Error(message); }
function identity(input) {
  for (const key of ["serviceId", "instanceId", "hostId"])
    if (typeof input[key] !== "string" || !input[key].trim()) fail(`Missing owner ${key}`);
  if (!Number.isSafeInteger(input.nowMs) || input.nowMs < 0) fail("Invalid owner acquisition time");
  return input;
}
function requireSchema(database, version) {
  const row = database.prepare("SELECT schema_version FROM collaboration_state_meta WHERE singleton=1").get();
  if (!row || row.schema_version !== version) fail(`Fixture requires schema ${version}`);
  if (database.prepare("PRAGMA journal_mode").get().journal_mode !== "delete") fail("Fixture requires existing DELETE journal mode");
  if (database.prepare("PRAGMA synchronous").get().synchronous !== 2) fail("Fixture requires FULL synchronization");
}
function nextEpoch(epoch) {
  if (!Number.isSafeInteger(epoch) || epoch < 1 || epoch >= Number.MAX_SAFE_INTEGER) fail("Writer epoch cannot be incremented safely");
  return epoch + 1;
}
function checkConnection(database, guard) {
  guard.assertHeld();
  const location = database.location();
  if (!location || realpathSync(location) !== guard.databasePath) fail("SQLite connection does not belong to this guard");
}
function transaction(database, guard, work, fault) {
  checkConnection(database, guard);
  let began = false, commitEntered = false;
  try {
    database.exec("BEGIN IMMEDIATE"); began = true;
    guard.assertHeld();
    const result = work();
    fault?.("before-commit");
    guard.assertHeld();
    commitEntered = true;
    database.exec("COMMIT");
    // Simulate loss of the acknowledged result, not physical fsync failure.
    fault?.("after-commit");
    return result;
  } catch (error) {
    const failure = commitEntered ? new ProbeCommitUnconfirmed(error) : error;
    if (commitEntered) guard.fence(failure);
    try { if (began && database.isTransaction) database.exec("ROLLBACK"); }
    catch (rollbackError) {
      const cleanupFailure = new AggregateError([failure, rollbackError], "Fixture failed and rollback was not confirmed");
      guard.fence(cleanupFailure);
      throw cleanupFailure;
    }
    throw failure;
  }
}
function token(row) {
  return { serviceId: row.service_id, instanceId: row.instance_id, hostId: row.host_id, epoch: row.epoch };
}

export function migrateStoppedFixture(database, guard, input, fault) {
  identity(input);
  return transaction(database, guard, () => {
    requireSchema(database, 29);
    const legacy = database.prepare("SELECT * FROM writer_service_lease WHERE singleton=1").get();
    if (!legacy || legacy.host_id !== input.hostId) fail("Legacy writer host does not match the offline fixture host");
    const epoch = nextEpoch(legacy.epoch);
    database.exec(`
      ALTER TABLE writer_service_lease RENAME TO legacy_writer_service_lease_v29;
      CREATE TRIGGER legacy_owner_no_update BEFORE UPDATE ON legacy_writer_service_lease_v29
        BEGIN SELECT RAISE(ABORT, 'Legacy writer facts are immutable'); END;
      CREATE TRIGGER legacy_owner_no_delete BEFORE DELETE ON legacy_writer_service_lease_v29
        BEGIN SELECT RAISE(ABORT, 'Legacy writer facts are immutable'); END;
      CREATE TRIGGER legacy_owner_no_insert BEFORE INSERT ON legacy_writer_service_lease_v29
        BEGIN SELECT RAISE(ABORT, 'Legacy writer facts are immutable'); END;
      CREATE TABLE writer_service_owner (
        singleton INTEGER PRIMARY KEY CHECK(singleton=1),
        protocol TEXT NOT NULL CHECK(protocol='native-owner-probe-v1'),
        service_id TEXT NOT NULL CHECK(length(service_id)>0),
        instance_id TEXT NOT NULL CHECK(length(instance_id)>0),
        host_id TEXT NOT NULL CHECK(length(host_id)>0),
        epoch INTEGER NOT NULL CHECK(epoch>=1 AND epoch<=9007199254740991),
        acquired_at_ms INTEGER NOT NULL CHECK(acquired_at_ms>=0),
        identity_json TEXT NOT NULL CHECK(json_valid(identity_json))
      ) STRICT;
    `);
    database.prepare("INSERT INTO writer_service_owner VALUES(1, 'native-owner-probe-v1', ?, ?, ?, ?, ?, ?)")
      .run(input.serviceId, input.instanceId, input.hostId, epoch, input.nowMs, JSON.stringify(guard.binding()));
    database.exec("UPDATE collaboration_state_meta SET schema_version=30 WHERE singleton=1");
    if (database.prepare("PRAGMA foreign_key_check").all().length) fail("Fixture migration has foreign-key violations");
    return { serviceId: input.serviceId, instanceId: input.instanceId, hostId: input.hostId, epoch };
  }, fault);
}

export function acquireFixtureEpoch(database, guard, input, fault) {
  identity(input);
  return transaction(database, guard, () => {
    requireSchema(database, 30);
    const prior = database.prepare("SELECT * FROM writer_service_owner WHERE singleton=1").get();
    if (!prior || prior.protocol !== "native-owner-probe-v1" || prior.host_id !== input.hostId)
      fail("Persisted owner protocol or host mismatch");
    if (!isDeepStrictEqual(JSON.parse(prior.identity_json), guard.binding())) fail("Persisted owner binding mismatch");
    const epoch = nextEpoch(prior.epoch);
    const changed = database.prepare(`UPDATE writer_service_owner SET service_id=?, instance_id=?, epoch=?, acquired_at_ms=?
      WHERE singleton=1 AND epoch=? AND host_id=?`).run(input.serviceId, input.instanceId, epoch, input.nowMs, prior.epoch, input.hostId);
    if (changed.changes !== 1) fail("Persisted owner epoch changed during acquisition");
    return { serviceId: input.serviceId, instanceId: input.instanceId, hostId: input.hostId, epoch };
  }, fault);
}

export function assertFixtureWriter(database, guard, expected) {
  checkConnection(database, guard);
  requireSchema(database, 30);
  const row = database.prepare("SELECT * FROM writer_service_owner WHERE singleton=1").get();
  if (!row || row.protocol !== "native-owner-probe-v1" || !isDeepStrictEqual(token(row), expected) ||
      !isDeepStrictEqual(JSON.parse(row.identity_json), guard.binding())) fail("Writer identity/epoch was fenced");
}
