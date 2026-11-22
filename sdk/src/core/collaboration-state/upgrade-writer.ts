import { backup, DatabaseSync } from "node:sqlite";
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { WriterOwner } from "./writer-owner.js";
import { upgradeOwnerProtocol } from "./owner-protocol.js";
import { CollaborationStateError } from "./errors.js";

/** Explicit offline operation. Stop confirmation is an operator assertion, not
 * inferred from a PID, expired lease, elapsed time or absence of the new lock. */
export async function upgradeCollaborationWriter(input: {
  databasePath: string;
  backupDirectory: string;
  hostId: string;
  serviceId: string;
  confirmedStopped: true;
}): Promise<{ backupPath: string; epoch: number }> {
  if (input.confirmedStopped !== true) throw new Error("Stop every old writer and its scheduling entrypoints before upgrading");
  for (const key of ["databasePath", "backupDirectory", "hostId", "serviceId"] as const)
    if (typeof input[key] !== "string" || !input[key].trim()) throw new Error(`Missing ${key}`);
  const databasePath = await fs.realpath(input.databasePath);
  const backupDirectory = path.resolve(input.backupDirectory);
  if (backupDirectory === path.dirname(databasePath)) throw new Error("Backup must use a new, separate directory");
  // Fail before provisioning a lock if this is the wrong host/schema. No schema
  // writes, lease renewal or recovery of Agents happen during this preflight.
  const inspection = new DatabaseSync(databasePath, { readOnly: true });
  try {
    const meta = inspection.prepare("SELECT schema_version FROM collaboration_state_meta WHERE singleton=1").get();
    if (!meta || typeof meta.schema_version !== "number" || meta.schema_version < 1 || meta.schema_version > 30)
      throw new Error("Offline upgrade requires a schema 1–30 database");
    const writerTable = meta.schema_version === 30 ? "writer_service_owner" : "writer_service_lease";
    const writer = inspection.prepare(`SELECT host_id FROM ${writerTable} WHERE singleton=1`).get();
    if (writer?.host_id !== input.hostId) throw new Error("Configured host does not match the original writer host");
    if (inspection.prepare("PRAGMA journal_mode").get()?.journal_mode !== "delete") throw new Error("Existing database must use DELETE journal mode");
    if (inspection.prepare("PRAGMA integrity_check").get()?.integrity_check !== "ok") throw new Error("Legacy database integrity check failed");
  } finally { inspection.close(); }
  await fs.mkdir(backupDirectory, { mode: 0o700 });
  const backupPath = path.join(backupDirectory, "collaboration-state.sqlite");
  const owner = WriterOwner.open(databasePath, { offlineUpgrade: true });
  let database: DatabaseSync | undefined;
  try {
    database = new DatabaseSync(owner.databasePath);
    database.exec("PRAGMA synchronous=FULL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000; PRAGMA locking_mode=NORMAL");
    owner.assertHeld();
    await backup(database, backupPath);
    const handle = await fs.open(backupPath, "r+");
    try { await handle.sync(); } finally { await handle.close(); }
    if (process.platform !== "win32") {
      const directory = await fs.open(backupDirectory, "r");
      try { await directory.sync(); } finally { await directory.close(); }
    }
    owner.assertHeld();
    const token = upgradeOwnerProtocol(database, owner, {
      hostId: input.hostId, serviceId: input.serviceId, instanceId: randomUUID()
    }, Date.now());
    return { backupPath, epoch: token.epoch };
  } catch (error) {
    throw new CollaborationStateError("WRITER_UPGRADE_REQUIRED",
      "Offline upgrade did not complete normally. Retain the backup and lock identity; inspect the recorded schema/outcome before any explicit retry or restore",
      { databasePath, backupPath }, { cause: error });
  } finally {
    // Never remove a sidecar on error; it is evidence of an interrupted
    // provisioning/migration, not an expired timestamp to be repaired on open.
    database?.close(); owner.close();
  }
}

async function cli(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.length !== 9 || args[0] !== "--database" || args[2] !== "--backup-directory" ||
      args[4] !== "--host" || args[6] !== "--service" || args[8] !== "--confirm-stopped")
    throw new Error("Usage: upgrade-writer --database PATH --backup-directory NEW_DIRECTORY --host ORIGINAL_HOST --service SERVICE_ID --confirm-stopped");
  const result = await upgradeCollaborationWriter({ databasePath: args[1], backupDirectory: args[3], hostId: args[5], serviceId: args[7], confirmedStopped: true });
  console.log(JSON.stringify({ status: "upgraded", ...result }));
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  void cli().catch(error => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
