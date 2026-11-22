import { initializeCollaborationStateSchema } from "../../../src/core/collaboration-state/schema.js";
import { DatabaseSync } from "node:sqlite";
import type { CollaborationStateOpenOptions, WriterLeaseToken } from "../../../src/core/collaboration-state/contracts.js";
import { CollaborationStateDatabase } from "../../../src/core/collaboration-state/store.js";
import { upgradeOwnerProtocol } from "../../../src/core/collaboration-state/owner-protocol.js";
import { WriterOwner } from "../../../src/core/collaboration-state/writer-owner.js";

/** Restore the exact pre-workspace delivery DDL in an isolated, stopped test database. */
export function legacyDeliveryFixture(database: DatabaseSync): void {
  const original = new DatabaseSync(":memory:");
  const foreignKeys = database.prepare("PRAGMA foreign_keys").get()?.foreign_keys;
  const rename = database.prepare("PRAGMA legacy_alter_table").get()?.legacy_alter_table;
  try {
    initializeCollaborationStateSchema(original);
    database.exec("PRAGMA foreign_keys=OFF; PRAGMA legacy_alter_table=ON; BEGIN IMMEDIATE");
    for (const table of ["scoped_group_runs", "scoped_executions", "scoped_agent_turns", "member_executions", "project_state_domains"]) {
      const objects = original.prepare("SELECT type,sql FROM sqlite_schema WHERE tbl_name=? AND sql IS NOT NULL").all(table);
      database.exec(`ALTER TABLE ${table} RENAME TO fixture_v31_${table}`);
      database.exec(String(objects.find(o => o.type === "table")!.sql));
      database.exec(`INSERT INTO ${table} SELECT * FROM fixture_v31_${table}; DROP TABLE fixture_v31_${table}`);
      for (const o of objects) if (o.type !== "table") database.exec(String(o.sql));
    }
    database.exec("UPDATE collaboration_state_meta SET schema_version=30; COMMIT");
  } finally {
    if (database.isTransaction) database.exec("ROLLBACK");
    database.exec(`PRAGMA foreign_keys=${foreignKeys ? 1 : 0}; PRAGMA legacy_alter_table=${rename ? 1 : 0}`);
    original.close();
  }
}

/** Test-only conversion after the fixture's real owner has closed. Research
 * tables are unchanged; the test then applies its historical schema DDL. */
export function legacyWriterFixture(database: DatabaseSync, lease: WriterLeaseToken, nowMs: number): void {
  legacyDeliveryFixture(database);
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
