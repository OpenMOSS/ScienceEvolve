import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, expect, it } from "vitest";
import { CollaborationStateDatabase } from "../../src/core/collaboration-state/store.js";
import { COLLABORATION_STATE_SCHEMA_VERSION } from "../../src/core/collaboration-state/contracts.js";

const roots: string[] = [];
const owners: CollaborationStateDatabase[] = [];
afterEach(async () => {
  for (const owner of owners.splice(0)) owner.close();
  for (const root of roots.splice(0)) await fs.rm(root, { recursive: true });
});
async function fixture(keepOpen = false) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "collaboration-preflight-")); roots.push(root);
  const databasePath = path.join(root, "state.sqlite");
  const options = { databasePath, serviceId: "preflight", instanceId: "original-instance", hostId: "test-host", topology: "single-host" as const,
    now: () => 100_000 };
  const original = CollaborationStateDatabase.open(options);
  const lease = original.writerLease();
  owners.push(original);
  if (!keepOpen) original.close();
  return { databasePath, options, lease, original };
}

it.each(["acquire", "attach"] as const)("refuses a newer schema before %s changes authority or schema bytes", async mode => {
  const { databasePath, options, lease, original } = await fixture(mode === "attach");
  const attachments = mode === "attach" ? [original.writerOwnerAttachment(), original.writerOwnerAttachment()] : [];
  const sql = new DatabaseSync(databasePath);
  try {
    sql.prepare("UPDATE collaboration_state_meta SET schema_version=?").run(COLLABORATION_STATE_SCHEMA_VERSION + 1);
    // Triggers make an accidentally reached acquisition/failed-open cleanup
    // visible even if it would restore the original timestamp afterwards.
    sql.exec(`CREATE TRIGGER forbid_owner_update BEFORE UPDATE ON writer_service_owner
      BEGIN SELECT RAISE(ABORT, 'preflight must precede owner mutation'); END;`);
  } finally { sql.close(); }
  const before = await fs.readFile(databasePath);
  for (let attempt = 0; attempt < 2; attempt++) {
    expect(() => CollaborationStateDatabase.open({ ...options,
      ...(mode === "attach" ? { writerLease: lease, writerOwner: attachments[attempt] } : { instanceId: "new-instance" }) }))
      .toThrow(expect.objectContaining({ code: "UNSAFE_CONFIGURATION", message: `Unsupported collaboration state schema ${COLLABORATION_STATE_SCHEMA_VERSION + 1}` }));
    expect(await fs.readFile(databasePath)).toEqual(before);
  }
});

it("rejects missing schema authority metadata before changing a writer epoch", async () => {
  const { databasePath, options } = await fixture();
  const sql = new DatabaseSync(databasePath);
  try {
    sql.exec("DELETE FROM collaboration_state_meta");
  } finally { sql.close(); }
  const before = await fs.readFile(databasePath);
  expect(() => CollaborationStateDatabase.open({ ...options, instanceId: "new-instance" }))
    .toThrow(expect.objectContaining({ code: "DATABASE_INTEGRITY_FAILED", message: "Collaboration database has missing or invalid schema authority metadata" }));
  expect(await fs.readFile(databasePath)).toEqual(before);
});
