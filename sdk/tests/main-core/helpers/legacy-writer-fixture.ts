import { DatabaseSync } from "node:sqlite";
import type { CollaborationStateOpenOptions, WriterLeaseToken } from "../../../src/core/collaboration-state/contracts.js";
import { CollaborationStateDatabase } from "../../../src/core/collaboration-state/store.js";
import { upgradeOwnerProtocol } from "../../../src/core/collaboration-state/owner-protocol.js";
import { WriterOwner } from "../../../src/core/collaboration-state/writer-owner.js";

/** Test-only conversion after the fixture's real owner has closed. Research
 * tables are unchanged; the test then applies its historical schema DDL. */
export function legacyWriterFixture(database: DatabaseSync, lease: WriterLeaseToken, nowMs: number): void {
  database.exec(`BEGIN IMMEDIATE;
    DROP TRIGGER legacy_writer_owner_no_update;
    DROP TRIGGER legacy_writer_owner_no_delete;
    DROP TRIGGER legacy_writer_owner_no_insert;
    DROP TABLE legacy_writer_service_lease_v29;
    DROP TABLE writer_service_owner;
    CREATE TABLE writer_service_lease (
      singleton INTEGER PRIMARY KEY CHECK(singleton=1), service_id TEXT NOT NULL,
      instance_id TEXT NOT NULL, host_id TEXT NOT NULL, epoch INTEGER NOT NULL,
      expires_at_ms INTEGER NOT NULL, renewed_at_ms INTEGER NOT NULL
    ) STRICT;`);
  database.prepare("INSERT INTO writer_service_lease VALUES(1,?,?,?,?,?,?)")
    .run(lease.serviceId, lease.instanceId, lease.hostId, lease.epoch, nowMs + 30_000, nowMs);
  database.exec("UPDATE collaboration_state_meta SET schema_version=29; COMMIT");
}

/** Test-only offline ownership; the caller has already closed its fixture. */
export function withOfflineFixtureOwner<T>(databasePath: string, work: (owner: WriterOwner) => T): T {
  const owner = WriterOwner.open(databasePath, { offlineUpgrade: true });
  try { return work(owner); } finally { owner.close(); }
}

/** A stopped legacy fixture is explicitly upgraded, never opened with a stale
 * token to bypass the lifecycle lock. Epoch advancement is part of the test. */
export function openUpgradedFixture(options: CollaborationStateOpenOptions): CollaborationStateDatabase {
  const owner = WriterOwner.open(options.databasePath, { offlineUpgrade: true });
  const database = new DatabaseSync(owner.databasePath);
  try {
    database.exec("PRAGMA synchronous=FULL; PRAGMA foreign_keys=ON");
    upgradeOwnerProtocol(database, owner, { serviceId: options.serviceId, hostId: options.hostId,
      instanceId: options.instanceId ?? "fixture-upgrade" }, options.now?.() ?? Date.now());
  } finally { database.close(); owner.close(); }
  return CollaborationStateDatabase.open(options);
}
