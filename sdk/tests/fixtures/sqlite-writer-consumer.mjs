import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFile, mkdtemp, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

// Installed JS entrypoints; no checkout, tsx, project launcher or model.
const core = new URL("./core/collaboration-state/", import.meta.resolve("@scienceevolve/sdk/application/main-runtime"));
const { initializeCollaborationStateSchema } = await import(new URL("schema.js", core));
const { CollaborationStateDatabase } = await import(new URL("store.js", core));
const root = await mkdtemp(path.resolve("sqlite-offline-")), hostId = "package-host", serviceId = "package-service";
const databasePath = path.join(root, "state.sqlite"), options = { databasePath, hostId, serviceId, topology: "single-host" };
const cli = (name, args) => JSON.parse(execFileSync(process.execPath, [fileURLToPath(new URL(name, core)), ...args], { encoding: "utf8", timeout: 30_000 }));
try {
  const legacy = new DatabaseSync(databasePath);
  try {
    legacy.exec("PRAGMA journal_mode=DELETE; PRAGMA synchronous=FULL; PRAGMA foreign_keys=ON");
    initializeCollaborationStateSchema(legacy);
    legacy.prepare("INSERT INTO writer_service_lease VALUES(1,?,?,?,?,?,?)").run(serviceId, "legacy-instance", hostId, 7, 2000, 1000);
  } finally { legacy.close(); }
  assert.throws(() => CollaborationStateDatabase.open(options), { code: "WRITER_UPGRADE_REQUIRED" });
  const upgrade = cli("upgrade-writer.js", ["--database", databasePath, "--backup-directory", path.join(root, "backup"),
    "--host", hostId, "--service", serviceId, "--confirm-stopped"]);
  assert.equal(upgrade.status, "upgraded"); assert.equal(upgrade.epoch, 8);
  const backup = new DatabaseSync(upgrade.backupPath, { readOnly: true });
  try { assert.equal(backup.prepare("SELECT schema_version FROM collaboration_state_meta").get().schema_version, 29); }
  finally { backup.close(); }
  const db = CollaborationStateDatabase.open(options); let sourceEpoch;
  try {
    sourceEpoch = db.writerLease().epoch; assert.equal(sourceEpoch, 9);
    db.createProject({ projectId: "p", workflowRevision: 1, workflowSnapshot: { agents: [] }, git: { enabled: false, status: "disabled" }, workerCapacity: 1 });
    db.appendEvent({ projectId: "p", requestId: "committed-after-upgrade", type: "fixture.return", payload: { invocationId: "original" } });
    const journal = db.operationsForProject("p");
    await journal.prepare({ id: "remote", kind: "repository.create", status: "prepared", payloadHash: "original-request" });
    await journal.transition({ id: "remote", status: "uncertain", payloadHash: "original-request" });
  } finally { db.close(); }
  const snapshot = path.join(root, "final.sqlite"), target = path.join(root, "restored.sqlite");
  await copyFile(databasePath, snapshot);
  const digest = createHash("sha256").update(await readFile(snapshot)).digest("hex");
  const { lockId } = JSON.parse(await readFile(databasePath + ".writer.lock", "utf8"));
  const restore = cli("restore-writer.js", ["--snapshot", snapshot, "--sha256", digest, "--source-lock-id", lockId, "--source-epoch", String(sourceEpoch),
    "--database", target, "--host", hostId, "--service", serviceId, "--confirm-stopped"]);
  assert.equal(restore.status, "restored"); assert.notEqual(restore.lockId, lockId); assert.equal(restore.epoch, 10);
  const next = CollaborationStateDatabase.open({ ...options, databasePath: target });
  try {
    assert.equal(next.writerLease().epoch, 11);
    assert.equal(next.eventsAfter("p").filter(e => e.requestId === "committed-after-upgrade").length, 1);
    assert.equal(next.recordedGitOperation("p", "remote").status, "uncertain");
    assert.equal(next.verifyHealth().integrity, "ok");
  } finally { next.close(); }
  assert.equal(createHash("sha256").update(await readFile(snapshot)).digest("hex"), digest);
  console.log("Installed offline upgrade and final snapshot restore verified: retained post-upgrade event and uncertain receipt, no replay.");
} finally { await rm(root, { recursive: true }); }
