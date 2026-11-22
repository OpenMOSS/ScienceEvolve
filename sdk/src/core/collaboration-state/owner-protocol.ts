import type { DatabaseSync } from "node:sqlite";
import { isDeepStrictEqual } from "node:util";
import { COLLABORATION_STATE_SCHEMA_VERSION, type WriterLeaseToken } from "./contracts.js";
import { CollaborationStateError } from "./errors.js";
import { initializeCollaborationStateSchema } from "./schema.js";
import { decodeWriterOwnerBinding, type WriterOwner } from "./writer-owner.js";
import { installWorkspaceDeliverySchema } from "./workspace-delivery-schema.js";

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
function persistedOwner(database: DatabaseSync, version: number = COLLABORATION_STATE_SCHEMA_VERSION) {
  const meta = database.prepare("SELECT schema_version FROM collaboration_state_meta WHERE singleton=1").get();
  if (meta?.schema_version !== version) invalid("Writer protocol schema does not match this runtime");
  const row = database.prepare("SELECT * FROM writer_service_owner WHERE singleton=1").get();
  if (!row || row.protocol !== "lifecycle-lock-v1" || typeof row.identity_json !== "string") invalid("Writer ownership metadata is missing or invalid");
  return { lease: token(row), binding: decodeWriterOwnerBinding(JSON.parse(row.identity_json)), identityJson: row.identity_json };
}
export function assertOwnerProtocol(database: DatabaseSync, owner: WriterOwner, expected?: WriterLeaseToken): WriterLeaseToken {
  owner.assertConnection(database);
  const prior = persistedOwner(database);
  if (!isDeepStrictEqual(prior.binding, owner.binding())) invalid("Persisted writer lock identity differs from the acquired owner");
  const current = prior.lease;
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
  installWorkspaceDeliverySchema(database);
  database.prepare("UPDATE collaboration_state_meta SET schema_version=? WHERE singleton=1").run(COLLABORATION_STATE_SCHEMA_VERSION);
  return { ...identity, epoch };
}
function formatTransaction<T>(database: DatabaseSync, owner: WriterOwner, work: () => T): T {
  const foreignKeys = database.prepare("PRAGMA foreign_keys").get()?.foreign_keys;
  const legacyRename = database.prepare("PRAGMA legacy_alter_table").get()?.legacy_alter_table;
  database.exec("PRAGMA foreign_keys=OFF; PRAGMA legacy_alter_table=ON");
  try { return transaction(database, owner, work); }
  finally { database.exec(`PRAGMA legacy_alter_table=${legacyRename ? 1 : 0}; PRAGMA foreign_keys=${foreignKeys ? 1 : 0}`); }
}
export function initializeOwnerDatabase(database: DatabaseSync, owner: WriterOwner, identity: OwnerIdentity, nowMs: number): WriterLeaseToken {
  owner.claimAcquisition(database);
  return formatTransaction(database, owner, () => {
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
/** A restore is only valid for an explicitly identified, self-contained current snapshot. */
export function inspectRestoreSnapshot(database: DatabaseSync, hostId: string, lockId: string, epoch: number): WriterLeaseToken {
  const prior = persistedOwner(database);
  assertHost(prior.lease.hostId, hostId);
  if (prior.binding.lockId !== lockId || prior.lease.epoch !== epoch)
    invalid("Restore snapshot does not match the confirmed source lock ID and epoch");
  nextEpoch(epoch);
  if (database.prepare("SELECT 1 FROM sqlite_schema WHERE name='writer_service_lease'").get() ||
      !database.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='legacy_writer_service_lease_v29'").get())
    invalid("Restore snapshot contains incompatible writer authority tables");
  if (database.prepare("PRAGMA journal_mode").get()?.journal_mode !== "delete" ||
      database.prepare("PRAGMA integrity_check").get()?.integrity_check !== "ok" || database.prepare("PRAGMA foreign_key_check").all().length)
    invalid("Restore snapshot failed SQLite journal, integrity or foreign-key validation");
  return prior.lease;
}
/** The caller copied a confirmed snapshot to a new, exclusively provisioned inode. */
export function bindRestoredOwner(database: DatabaseSync, owner: WriterOwner, identity: OwnerIdentity, sourceLockId: string, sourceEpoch: number, nowMs: number): WriterLeaseToken {
  owner.claimAcquisition(database);
  return transaction(database, owner, () => {
    const prior = persistedOwner(database);
    assertHost(prior.lease.hostId, identity.hostId);
    if (prior.binding.lockId !== sourceLockId || prior.lease.epoch !== sourceEpoch || sourceLockId === owner.binding().lockId)
      invalid("Restored writer identity changed before rebinding");
    const epoch = nextEpoch(sourceEpoch);
    const changed = database.prepare(`UPDATE writer_service_owner SET service_id=?,instance_id=?,epoch=?,acquired_at_ms=?,identity_json=?
      WHERE singleton=1 AND host_id=? AND epoch=? AND identity_json=?`).run(identity.serviceId, identity.instanceId, epoch, nowMs,
        JSON.stringify(owner.binding()), identity.hostId, sourceEpoch, prior.identityJson);
    if (changed.changes !== 1) invalid("Restored writer row was not rebound exactly once");
    return assertOwnerProtocol(database, owner, { ...identity, epoch });
  });
}
/** Offline caller has separately stopped old writers and retained a backup. */
export function upgradeOwnerProtocol(database: DatabaseSync, owner: WriterOwner, identity: OwnerIdentity, nowMs: number): WriterLeaseToken {
  owner.claimAcquisition(database);
  const meta = database.prepare("SELECT schema_version FROM collaboration_state_meta WHERE singleton=1").get();
  if (meta?.schema_version === 30) return formatTransaction(database, owner, () => {
    owner.assertConnection(database);
    const prior = persistedOwner(database, 30);
    if (!isDeepStrictEqual(prior.binding, owner.binding())) invalid("Offline upgrade requires the original writer lock");
    assertHost(prior.lease.hostId, identity.hostId);
    const epoch = nextEpoch(prior.lease.epoch);
    installWorkspaceDeliverySchema(database);
    database.prepare("UPDATE writer_service_owner SET service_id=?,instance_id=?,epoch=?,acquired_at_ms=? WHERE singleton=1")
      .run(identity.serviceId, identity.instanceId, epoch, nowMs);
    database.prepare("UPDATE collaboration_state_meta SET schema_version=? WHERE singleton=1").run(COLLABORATION_STATE_SCHEMA_VERSION);
    return assertOwnerProtocol(database, owner, { ...identity, epoch });
  });
  if (!meta || typeof meta.schema_version !== "number" || !Number.isSafeInteger(meta.schema_version) || meta.schema_version < 1 || meta.schema_version > 29)
    invalid("Offline writer upgrade requires a supported schema 1–29");
  const row = database.prepare("SELECT * FROM writer_service_lease WHERE singleton=1").get();
  if (!row) invalid("Offline writer upgrade requires the original writer identity");
  const prior = token(row); assertHost(prior.hostId, identity.hostId);
  // Existing research migrations retain their individual atomic checkpoints.
  initializeCollaborationStateSchema(database, { writerLease: prior, offlineOwner: owner });
  return formatTransaction(database, owner, () => transition(database, owner, identity, nextEpoch(prior.epoch), nowMs));
}
