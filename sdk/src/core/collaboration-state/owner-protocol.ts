import type { DatabaseSync } from "node:sqlite";
import { isDeepStrictEqual } from "node:util";
import { COLLABORATION_STATE_SCHEMA_VERSION, type WriterLeaseToken } from "./contracts.js";
import { CollaborationStateError } from "./errors.js";
import { initializeCollaborationStateSchema } from "./schema.js";
import { decodeWriterOwnerBinding, type WriterOwner } from "./writer-owner.js";

type OwnerIdentity = Omit<WriterLeaseToken, "epoch">;
function invalid(message: string): never { throw new CollaborationStateError("DATABASE_INTEGRITY_FAILED", message); }
function nextEpoch(epoch: number): number {
  if (!Number.isSafeInteger(epoch) || epoch < 0 || epoch >= Number.MAX_SAFE_INTEGER) invalid("Writer epoch cannot be advanced safely");
  return epoch + 1;
}
export function writerCommitUnconfirmed(owner: WriterOwner, cause: unknown): CollaborationStateError {
  const error = new CollaborationStateError("WRITER_COMMIT_UNCONFIRMED", "SQLite COMMIT outcome is unconfirmed; writer fenced and operation was not retried", {}, { cause });
  owner.fence(error); return error;
}
function transaction<T>(database: DatabaseSync, owner: WriterOwner, work: () => T): T {
  owner.assertHeld();
  let began = false, committing = false;
  try {
    database.exec("BEGIN IMMEDIATE"); began = true;
    owner.assertHeld(); const result = work(); owner.assertHeld();
    committing = true; database.exec("COMMIT"); return result;
  } catch (cause) {
    const error = committing ? writerCommitUnconfirmed(owner, cause) : cause;
    try { if (began && database.isTransaction) database.exec("ROLLBACK"); }
    catch (cleanup) { owner.fence(error); throw new AggregateError([error, cleanup], "Owner transaction rollback is unconfirmed"); }
    throw error;
  }
}
function assertHost(host: unknown, configured: string): void {
  if (host !== configured) throw new CollaborationStateError("UNSAFE_CONFIGURATION", "This collaboration database is pinned to another host; multi-host failover is unsupported");
}
function token(row: Record<string, unknown>): WriterLeaseToken {
  const epoch = Number(row.epoch);
  if (!Number.isSafeInteger(epoch) || epoch < 1) invalid("Invalid persisted writer epoch");
  for (const key of ["service_id", "instance_id", "host_id"])
    if (typeof row[key] !== "string" || !(row[key] as string).trim()) invalid(`Missing writer ${key}`);
  return { serviceId: row.service_id as string, instanceId: row.instance_id as string, hostId: row.host_id as string, epoch };
}
export function assertOwnerProtocol(database: DatabaseSync, owner: WriterOwner, expected?: WriterLeaseToken): WriterLeaseToken {
  owner.assertConnection(database);
  const meta = database.prepare("SELECT schema_version FROM collaboration_state_meta WHERE singleton=1").get();
  if (meta?.schema_version !== COLLABORATION_STATE_SCHEMA_VERSION) invalid("Writer protocol schema does not match this runtime");
  const row = database.prepare("SELECT * FROM writer_service_owner WHERE singleton=1").get();
  if (!row || row.protocol !== "lifecycle-lock-v1" || typeof row.identity_json !== "string") invalid("Writer ownership metadata is missing or invalid");
  if (!isDeepStrictEqual(decodeWriterOwnerBinding(JSON.parse(row.identity_json)), owner.binding())) invalid("Persisted writer lock identity differs from the acquired owner");
  const current = token(row);
  if (expected && !isDeepStrictEqual(current, expected)) throw new CollaborationStateError("WRITER_LEASE_STALE", "Collaboration mutation was rejected by the writer epoch fence", { expected, observed: current });
  return current;
}
function transition(database: DatabaseSync, owner: WriterOwner, identity: OwnerIdentity, epoch: number, nowMs: number): WriterLeaseToken {
  database.exec(`
    ALTER TABLE writer_service_lease RENAME TO legacy_writer_service_lease_v29;
    CREATE TRIGGER legacy_writer_owner_no_update BEFORE UPDATE ON legacy_writer_service_lease_v29
      BEGIN SELECT RAISE(ABORT, 'Legacy writer facts are immutable'); END;
    CREATE TRIGGER legacy_writer_owner_no_delete BEFORE DELETE ON legacy_writer_service_lease_v29
      BEGIN SELECT RAISE(ABORT, 'Legacy writer facts are immutable'); END;
    CREATE TRIGGER legacy_writer_owner_no_insert BEFORE INSERT ON legacy_writer_service_lease_v29
      BEGIN SELECT RAISE(ABORT, 'Legacy writer facts are immutable'); END;
    CREATE TABLE writer_service_owner (
      singleton INTEGER PRIMARY KEY CHECK(singleton=1),
      protocol TEXT NOT NULL CHECK(protocol='lifecycle-lock-v1'),
      service_id TEXT NOT NULL CHECK(length(service_id)>0),
      instance_id TEXT NOT NULL CHECK(length(instance_id)>0),
      host_id TEXT NOT NULL CHECK(length(host_id)>0),
      epoch INTEGER NOT NULL CHECK(epoch>=1 AND epoch<=9007199254740991),
      acquired_at_ms INTEGER NOT NULL CHECK(acquired_at_ms>=0),
      identity_json TEXT NOT NULL CHECK(json_valid(identity_json))
    ) STRICT;
  `);
  database.prepare("INSERT INTO writer_service_owner VALUES(1,'lifecycle-lock-v1',?,?,?,?,?,?)")
    .run(identity.serviceId, identity.instanceId, identity.hostId, epoch, nowMs, JSON.stringify(owner.binding()));
  if (database.prepare("PRAGMA foreign_key_check").all().length) invalid("Writer protocol migration left invalid foreign keys");
  database.prepare("UPDATE collaboration_state_meta SET schema_version=? WHERE singleton=1").run(COLLABORATION_STATE_SCHEMA_VERSION);
  return { ...identity, epoch };
}
export function initializeOwnerDatabase(database: DatabaseSync, owner: WriterOwner, identity: OwnerIdentity, nowMs: number): WriterLeaseToken {
  owner.claimAcquisition(database);
  return transaction(database, owner, () => {
    if (database.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().length)
      invalid("A new writer database must have no existing schema");
    initializeCollaborationStateSchema(database);
    return transition(database, owner, identity, 1, nowMs);
  });
}
export function acquireOwnerEpoch(database: DatabaseSync, owner: WriterOwner, identity: OwnerIdentity, nowMs: number): WriterLeaseToken {
  owner.claimAcquisition(database);
  return transaction(database, owner, () => {
    const prior = assertOwnerProtocol(database, owner);
    assertHost(prior.hostId, identity.hostId);
    const epoch = nextEpoch(prior.epoch);
    const result = database.prepare("UPDATE writer_service_owner SET service_id=?,instance_id=?,epoch=?,acquired_at_ms=? WHERE singleton=1 AND epoch=? AND host_id=?")
      .run(identity.serviceId, identity.instanceId, epoch, nowMs, prior.epoch, identity.hostId);
    if (result.changes !== 1) invalid("Writer epoch changed during exclusive acquisition");
    return { ...identity, epoch };
  });
}
/** Offline caller has separately stopped old writers and retained a backup. */
export function upgradeOwnerProtocol(database: DatabaseSync, owner: WriterOwner, identity: OwnerIdentity, nowMs: number): WriterLeaseToken {
  owner.claimAcquisition(database);
  const meta = database.prepare("SELECT schema_version FROM collaboration_state_meta WHERE singleton=1").get();
  if (!meta || typeof meta.schema_version !== "number" || !Number.isSafeInteger(meta.schema_version) || meta.schema_version < 1 || meta.schema_version > 29)
    invalid("Offline writer upgrade requires a supported schema 1–29");
  const row = database.prepare("SELECT * FROM writer_service_lease WHERE singleton=1").get();
  if (!row) invalid("Offline writer upgrade requires the original writer identity");
  const prior = token(row); assertHost(prior.hostId, identity.hostId);
  // Existing research migrations retain their individual atomic checkpoints.
  // Failure leaves a supported intermediate legacy schema, never a fake v30.
  initializeCollaborationStateSchema(database, { writerLease: prior, offlineOwner: owner });
  return transaction(database, owner, () => transition(database, owner, identity, nextEpoch(prior.epoch), nowMs));
}
