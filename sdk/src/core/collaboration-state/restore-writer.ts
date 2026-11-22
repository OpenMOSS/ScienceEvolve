import { constants, promises as fs } from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { WriterOwner } from "./writer-owner.js";
import { bindRestoredOwner, inspectRestoreSnapshot } from "./owner-protocol.js";

/** Never repair a live path in place. The operator confirms that the old
 * service cannot restart and that this snapshot includes its final commits. */
export async function restoreCollaborationWriter(input: {
  snapshotPath: string; databasePath: string; snapshotSha256: string; sourceLockId: string;
  sourceEpoch: number; hostId: string; serviceId: string; confirmedStopped: true;
}): Promise<{ databasePath: string; sourceLockId: string; sourceEpoch: number; lockId: string; epoch: number }> {
  if (input.confirmedStopped !== true) throw new Error("Stop all writers and their scheduling entrypoints before restoring");
  for (const key of ["snapshotPath", "databasePath", "sourceLockId", "hostId", "serviceId"] as const)
    if (typeof input[key] !== "string" || !input[key].trim()) throw new Error(`Missing ${key}`);
  if (!/^[a-f0-9]{64}$/.test(input.snapshotSha256)) throw new Error("Expected the verified snapshot SHA-256");
  if (!Number.isSafeInteger(input.sourceEpoch) || input.sourceEpoch < 1 || input.sourceEpoch >= Number.MAX_SAFE_INTEGER)
    throw new Error("Expected the last confirmed source writer epoch, with room to advance");
  const source = await fs.realpath(input.snapshotPath);
  const metadata = await fs.lstat(source, { bigint: true });
  if (!metadata.isFile() || metadata.nlink !== 1n) throw new Error("Restore requires a regular single-link SQLite snapshot");
  for (const suffix of ["-journal", "-wal", "-shm", ".writer.lock"]) {
    try { await fs.lstat(source + suffix); throw new Error("Restore requires a detached, self-contained snapshot without a writer lock or journal files"); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
  }
  // Inspect via a read-only connection; never perform recovery on the source.
  const inspection = new DatabaseSync(source, { readOnly: true });
  try { inspectRestoreSnapshot(inspection, input.hostId, input.sourceLockId, input.sourceEpoch); }
  finally { inspection.close(); }
  const owner = WriterOwner.open(input.databasePath, { createOnly: true });
  let database: DatabaseSync | undefined;
  try {
    // Write into the newly provisioned inode, never rename a file over it.
    const dest = await fs.open(owner.databasePath, constants.O_RDWR | (process.platform === "win32" ? 0 : constants.O_NOFOLLOW));
    try {
      const stat = await dest.stat({ bigint: true }), expected = owner.binding().database;
      if (!stat.isFile() || stat.nlink !== 1n || stat.size !== 0n || String(stat.dev) !== expected.device || String(stat.ino) !== expected.inode)
        throw new Error("Restore destination does not match its new empty, locked inode");
      const sourceHandle = await fs.open(source, "r");
      try {
        const opened = await sourceHandle.stat({ bigint: true });
        if (opened.dev !== metadata.dev || opened.ino !== metadata.ino || opened.nlink !== 1n || opened.size !== metadata.size)
          throw new Error("Restore snapshot identity changed before copy");
        const digest = createHash("sha256"), buffer = Buffer.alloc(1024 * 1024);
        for (;;) {
          const { bytesRead } = await sourceHandle.read(buffer); if (!bytesRead) break;
          digest.update(buffer.subarray(0, bytesRead));
          for (let written = 0; written < bytesRead;) {
            const { bytesWritten } = await dest.write(buffer, written, bytesRead - written);
            if (!bytesWritten) throw new Error("Incomplete SQLite snapshot copy");
            written += bytesWritten;
          }
        }
        if (digest.digest("hex") !== input.snapshotSha256) throw new Error("Copied snapshot does not match the verified SHA-256; destination was not rebound");
      } finally { await sourceHandle.close(); }
      await dest.sync();
    } finally { await dest.close(); }
    owner.assertHeld();
    database = new DatabaseSync(owner.databasePath);
    database.exec("PRAGMA synchronous=FULL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000; PRAGMA locking_mode=NORMAL");
    inspectRestoreSnapshot(database, input.hostId, input.sourceLockId, input.sourceEpoch);
    const lease = bindRestoredOwner(database, owner, { serviceId: input.serviceId, instanceId: randomUUID(), hostId: input.hostId },
      input.sourceLockId, input.sourceEpoch, Date.now());
    return { databasePath: owner.databasePath, sourceLockId: input.sourceLockId, sourceEpoch: input.sourceEpoch,
      lockId: owner.binding().lockId, epoch: lease.epoch };
  } finally { database?.close(); owner.close(); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  void (async () => {
    if (args.length !== 15 || args[0] !== "--snapshot" || args[2] !== "--sha256" || args[4] !== "--source-lock-id" ||
        args[6] !== "--source-epoch" || args[8] !== "--database" || args[10] !== "--host" || args[12] !== "--service" || args[14] !== "--confirm-stopped")
      throw new Error("Usage: restore-writer --snapshot FILE --sha256 HASH --source-lock-id UUID --source-epoch EPOCH --database NEW_PATH --host ORIGINAL_HOST --service SERVICE_ID --confirm-stopped");
    console.log(JSON.stringify({ status: "restored", ...await restoreCollaborationWriter({ snapshotPath: args[1], snapshotSha256: args[3],
      sourceLockId: args[5], sourceEpoch: Number(args[7]), databasePath: args[9], hostId: args[11], serviceId: args[13], confirmedStopped: true }) }));
  })().catch(error => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
}
