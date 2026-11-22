import { resolve as sdkFixturePath } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { createHash } from "node:crypto";
import { access, mkdtemp, rename, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CollaborationStateDatabase } from "../../src/core/collaboration-state/store.js";
import { COLLABORATION_STATE_SCHEMA_VERSION } from "../../src/core/collaboration-state/contracts.js";
import { upgradeCollaborationWriter } from "../../src/core/collaboration-state/upgrade-writer.js";
import { legacyDeliveryFixture, legacyWriterFixture, openUpgradedFixture } from "./helpers/legacy-writer-fixture.js";

function mergedScopedEvidence(
  executionId: string, base: `groups/${string}`, providerNumber: number, ownershipEpoch = 1
) {
  const headSha = "a".repeat(40);
  const mergeCommitSha = "c".repeat(40);
  const factHash = createHash("sha256")
    .update([headSha, base, mergeCommitSha].join("\0"))
    .digest("hex").slice(0, 24);
  return {
    pullRequest: {
      id: `pull-${executionId}`, providerNumber,
      htmlUrl: `https://github.com/example/openfars/pull/${providerNumber}`,
      head: `executions/${executionId}`, base, ownerExecutionId: executionId,
      status: "merged" as const, headSha, mergeCommitSha,
      observedAt: "2026-09-29T00:00:00.000Z"
    },
    synchronization: {
      projectId: "project-1", operationId: `reconcile-merged-${ownershipEpoch === 1
        ? executionId : `${executionId}-epoch-${ownershipEpoch}`}-${factHash}`,
      targetBranch: base, temporaryRef: `refs/openfars/reconcile/${executionId}`,
      expectedSourceHead: headSha, mergeCommitSha,
      remoteHead: mergeCommitSha, localHeadBefore: "b".repeat(40),
      localHeadAfter: mergeCommitSha, status: "synchronized" as const,
      observedAt: "2026-09-29T00:00:00.000Z"
    }
  };
}

function mergedGroupEvidence(groupRunId: string, base: "main" | `groups/${string}`, providerNumber: number) {
  const headSha = "d".repeat(40);
  const mergeCommitSha = "e".repeat(40);
  const factHash = createHash("sha256")
    .update([headSha, base, mergeCommitSha].join("\0"))
    .digest("hex").slice(0, 24);
  return {
    executionId: `group-final-${groupRunId}`, ownershipEpoch: 1,
    pullRequest: {
      id: `pull-final-${groupRunId}`, providerNumber,
      htmlUrl: `https://github.com/example/openfars/pull/${providerNumber}`,
      head: `groups/${groupRunId}`, base, status: "merged" as const,
      ownerExecutionId: `group-final-${groupRunId}`,
      headSha, mergeCommitSha, observedAt: "2026-09-29T00:00:00.000Z"
    },
    synchronization: {
      projectId: "project-1",
      operationId: `reconcile-merged-group-final-${groupRunId}-${factHash}`,
      targetBranch: base, temporaryRef: `refs/openfars/reconcile/final-${groupRunId}`,
      expectedSourceHead: headSha, mergeCommitSha,
      remoteHead: mergeCommitSha, localHeadBefore: "b".repeat(40),
      localHeadAfter: mergeCommitSha, status: "synchronized" as const,
      observedAt: "2026-09-29T00:00:00.000Z"
    }
  };
}

function activateFinalIntegrationFixture(database: CollaborationStateDatabase, workspace?: string) {
  database.createProject({
    projectId: "project-1", workflowRevision: 1,
    workflowSnapshot: {
      schemaVersion: 3, agents: [{ name: "main" }, { name: "worker" }],
      collaborations: [{ id: "G" }],
      scopedWorkflow: {
        schemaVersion: 1, rootAgentIds: ["main"],
        groups: [{
          id: "G", leaderAgentId: "main", allowLeaderReconfiguration: false,
          workflow: {
            nodes: [{ kind: "agent", nodeId: "G_worker", agentId: "worker" }],
            input: { source: "input", edges: [{ kind: "parallel", target: "G_worker" }] },
            routes: { G_worker: [{ kind: "strong", target: "finish" }] }
          }
        }]
      }
    },
    git: workspace ? { enabled: false, status: "disabled" } : { enabled: true, status: "ready" }, workerCapacity: 1
  });
  const group = database.activateScopedGroup({
    projectId: "project-1", groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G",
    workflowRevision: 1, ...(workspace ? {} : { baseCommit: "base-G" }),
    outer: { nodeRunId: "node-G", inputSnapshotRef: "project:input", activatedByAgentId: "main" }
  });
  const arrivalRequestId = group.arrivals[0]!.requestId;
  database.claimScopedAgentArrival({
    projectId: "project-1", arrivalRequestId, agentId: "worker", executionId: "exec-worker",
    worktreePath: workspace ?? sdkFixturePath("/srv/openfars/git-worktrees/agents/worker")
  });
  return () => database.completeScopedAgentArrivalAfterMerge({
    projectId: "project-1", arrivalRequestId, executionId: "exec-worker", ownershipEpoch: 1,
    ...mergedScopedEvidence("exec-worker", "groups/run-G", 1)
  });
}

describe("scoped collaboration state schema", () => {
  it.each([29, 30])("upgrades a stopped v%s Git project preserving the exact group, member, merge and backup", async version => {
    const directory = await mkdtemp(join(tmpdir(), "delivery-upgrade-"));
    const databasePath = join(directory, "state.sqlite");
    const options = { databasePath, serviceId: "service", hostId: "host", topology: "single-host" as const };
    let db = CollaborationStateDatabase.open(options);
    try {
      activateFinalIntegrationFixture(db)();
      const original = db.projectState("project-1");
      const lease = db.writerLease();
      db.close();
      const legacy = new DatabaseSync(databasePath);
      try {
        if (version === 29) legacyWriterFixture(legacy, lease, Date.now());
        else legacyDeliveryFixture(legacy);
      } finally { legacy.close(); }
      expect(() => CollaborationStateDatabase.open(options)).toThrow(expect.objectContaining({ code: "WRITER_UPGRADE_REQUIRED" }));
      const upgraded = await upgradeCollaborationWriter({ ...options, backupDirectory: join(directory, "backup"), confirmedStopped: true });
      const backup = new DatabaseSync(upgraded.backupPath, { readOnly: true });
      try {
        expect(backup.prepare("SELECT schema_version FROM collaboration_state_meta").get()?.schema_version).toBe(version);
        expect(backup.prepare("SELECT group_branch, base_commit FROM scoped_group_runs").get()).toMatchObject({ group_branch: "groups/run-G", base_commit: "base-G" });
        expect(backup.prepare("SELECT execution_branch FROM scoped_executions").get()?.execution_branch).toBe("executions/exec-worker");
      } finally { backup.close(); }
      db = CollaborationStateDatabase.open(options);
      expect(db.writerLease().epoch).toBe(lease.epoch + 2);
      expect(db.projectState("project-1")).toEqual(original);
      expect(db.verifyHealth().schemaVersion).toBe(31);
    } finally { db.close(); await rm(directory, { recursive: true, force: true }); }
  });

  it("requires the original lock to upgrade a stopped v30 database", async () => {
    const directory = await mkdtemp(join(tmpdir(), "delivery-lock-"));
    const databasePath = join(directory, "state.sqlite");
    const options = { databasePath, serviceId: "service", hostId: "host", topology: "single-host" as const };
    try {
      CollaborationStateDatabase.open(options).close();
      const database = new DatabaseSync(databasePath);
      try { legacyDeliveryFixture(database); } finally { database.close(); }
      const lock = databasePath + ".writer.lock";
      await rename(lock, join(directory, "retained-original.lock"));
      await expect(upgradeCollaborationWriter({ ...options, backupDirectory: join(directory, "backup"), confirmedStopped: true }))
        .rejects.toThrow(/original writer lock/);
      await expect(access(lock)).rejects.toMatchObject({ code: "ENOENT" });
      const retained = new DatabaseSync(databasePath, { readOnly: true });
      try { expect(retained.prepare("SELECT schema_version FROM collaboration_state_meta").get()?.schema_version).toBe(30); }
      finally { retained.close(); }
    } finally { await rm(directory, { recursive: true, force: true }); }
  });

  it("recovers a stopped workspace report once and refuses an incomplete or cross-invocation return", async () => {
    const directory = await mkdtemp(join(tmpdir(), "workspace-return-"));
    const options = { databasePath: join(directory, "state.sqlite"), hostId: "host", serviceId: "s", topology: "single-host" as const };
    let db = CollaborationStateDatabase.open(options);
    try {
      activateFinalIntegrationFixture(db, directory);
      const execution = db.scopedExecution("project-1", "exec-worker")!;
      const identity = { projectId: execution.projectId, executionId: execution.id, ownershipEpoch: execution.ownershipEpoch, invocationId: "inv_workspace_task" };
      const runtimePath = join(directory, "runtime", identity.invocationId);
      const report = { ...identity, output: "Measured result from the original worker", residentTurnCompleted: true as const, residentStopConfirmed: true };
      db.beginScopedAgentTurn({ ...identity, runtimePath });
      db.markScopedAgentTurnOpened({ ...identity, nativeProcessOpened: true });
      expect(() => db.recordScopedAgentReport(report)).toThrow(/finish_task/);
      const completion = { ...identity, agentId: execution.agentId, requestedAt: new Date().toISOString(), callId: "finish-1" };
      expect(() => db.recordScopedAgentTaskCompletion({ ...completion, invocationId: "inv_another" })).toThrow(/exact opened/);
      db.recordScopedAgentTaskCompletion(completion);
      expect(() => db.recordScopedAgentReport({ ...report, residentStopConfirmed: false })).toThrow(/confirmed native stop/);
      db.recordScopedAgentReport(report);
      db.close();
      db = CollaborationStateDatabase.open(options);
      const returned = { ...identity, arrivalRequestId: execution.arrivalRequestId };
      expect(() => db.completeScopedAgentArrival(returned)).toThrow(/stopped invocation/);
      db.reconcileScopedAgentTurn({ ...identity, residentStopConfirmed: true, evidence: { protocol: "scoped-supervisor-stop-v1",
        projectId: execution.projectId, agentId: execution.agentId, scopeId: execution.id, role: "delivery",
        ownershipEpoch: 1, runtimePath, nativeProcessScanCleared: true } });
      const first = db.completeScopedAgentArrival(returned);
      const replay = db.completeScopedAgentArrival(returned);
      expect(first.replay).toBe(false);
      expect(replay).toMatchObject({ replay: true, revision: first.revision, route: first.route });
      expect(db.scopedGroupReadyForFinalIntegration(execution.projectId, execution.groupRunId)).toBe(true);
      expect(db.scopedAgentReport(execution.projectId, execution.id, 1)?.output).toBe(report.output);
    } finally { db.close(); await rm(directory, { recursive: true, force: true }); }
  });

  it("migrates v26 event reads only under the exact live writer without changing projections or immutable facts", async () => {
    const directory = await mkdtemp(join(tmpdir(), "openfars-event-type-v27-migration-"));
    const databasePath = join(directory, "collaboration.sqlite");
    const options = { databasePath, serviceId: "event-index-migration", hostId: "host-a", topology: "single-host" as const,
      instanceId: "instance-a", now: () => 1_000_000 };
    let database: CollaborationStateDatabase | undefined;
    try {
      database = CollaborationStateDatabase.open(options);
      activateFinalIntegrationFixture(database);
      database.appendEvent({ projectId: "project-1", type: "test.unrelated", payload: { text: "unrelated".repeat(1024) } });
      const projection = database.projectState("project-1");
      const events = database.eventsAfter("project-1");
      const lease = database.writerLease();
      database.close(); database = undefined;
      const old = new DatabaseSync(databasePath);
      legacyWriterFixture(old, lease, options.now());
      old.exec("DROP INDEX project_events_project_type_seq; UPDATE collaboration_state_meta SET schema_version = 26");
      const originalLease = old.prepare("SELECT * FROM writer_service_lease").get();
      old.close();
      expect(() => CollaborationStateDatabase.open({ ...options, instanceId: "foreign-writer" })).toThrow();
      const unchanged = new DatabaseSync(databasePath, { readOnly: true });
      expect(unchanged.prepare("SELECT schema_version FROM collaboration_state_meta").get()).toMatchObject({ schema_version: 26 });
      expect(unchanged.prepare("SELECT name FROM sqlite_master WHERE name = 'project_events_project_type_seq'").get()).toBeUndefined();
      expect(unchanged.prepare("SELECT * FROM writer_service_lease").get()).toEqual(originalLease);
      unchanged.close();
      database = openUpgradedFixture(options);
      expect(database.verifyHealth().schemaVersion).toBe(COLLABORATION_STATE_SCHEMA_VERSION);
      expect(database.projectState("project-1")).toEqual(projection);
      expect(database.eventsAfter("project-1")).toEqual(events);
      expect(database.writerLease()).toMatchObject({ epoch: lease.epoch + 2, hostId: lease.hostId });
      const inspection = new DatabaseSync(databasePath);
      const plan = inspection.prepare("EXPLAIN QUERY PLAN SELECT payload_json FROM project_events WHERE project_id = ? AND event_type = ? ORDER BY seq")
        .all("project-1", "agent.terminal_push_observation.reserved") as Array<{ detail: string }>;
      expect(plan.some(row => row.detail.includes("project_events_project_type_seq") && row.detail.includes("event_type=?"))).toBe(true);
      expect(inspection.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
      expect(() => inspection.exec("UPDATE project_events SET event_type = 'changed' WHERE project_id = 'project-1'"))
        .toThrow("append-only");
      expect(() => inspection.exec("DELETE FROM project_events WHERE project_id = 'project-1'"))
        .toThrow("append-only");
      inspection.close();
    } finally { database?.close(); await rm(directory, { recursive: true, force: true }); }
  });

  it("migrates real v25 journal constraints under the live writer, preserving old rows, indexes, foreign keys and one active revert", async () => {
    const directory = await mkdtemp(join(tmpdir(), "openfars-revert-v26-migration-"));
    const databasePath = join(directory, "collaboration.sqlite");
    const options = { databasePath, serviceId: "revert-migration", hostId: "host-a", topology: "single-host" as const,
      instanceId: "instance-a", now: () => 1_000_000 };
    let database: CollaborationStateDatabase | undefined;
    try {
      database = CollaborationStateDatabase.open(options);
      activateFinalIntegrationFixture(database);
      const operations = database.operationsForProject("project-1", true);
      const oldRecord = await operations.prepare({ id: "old-record", kind: "git.push", payloadHash: "old-payload",
        ownerExecutionId: "exec-worker", ownershipEpoch: 1, expectedHead: "a".repeat(40), expectedBase: "executions/exec-worker", status: "prepared" });
      const lease = database.writerLease();
      database.close(); database = undefined;
      const old = new DatabaseSync(databasePath);
      legacyWriterFixture(old, lease, options.now());
      for (const table of ["operations", "scoped_operations"]) {
        const { sql } = old.prepare("SELECT sql FROM sqlite_master WHERE name = ?").get(table) as { sql: string };
        const v25 = sql.replace(new RegExp(`CREATE TABLE [\"\x60]?${table}[\"\x60]?`), `CREATE TABLE ${table}_v25`).replace(", 'git.revert'", "").replace(",'git.revert'", "");
        expect(v25).not.toContain("'git.revert'");
        old.exec(v25);
        old.exec(`INSERT INTO ${table}_v25 SELECT * FROM ${table}; DROP TABLE ${table}; ALTER TABLE ${table}_v25 RENAME TO ${table}`);
      }
      old.exec("CREATE INDEX preserved_operation_lookup ON scoped_operations(project_id,kind); UPDATE collaboration_state_meta SET schema_version = 25");
      const eventCount = old.prepare("SELECT count(*) AS n FROM project_events").get();
      old.close();
      expect(() => CollaborationStateDatabase.open({ ...options, instanceId: "foreign-writer" })).toThrow();
      const unchanged = new DatabaseSync(databasePath, { readOnly: true });
      expect(unchanged.prepare("SELECT schema_version FROM collaboration_state_meta").get()).toMatchObject({ schema_version: 25 });
      unchanged.close();
      database = openUpgradedFixture(options);
      expect(database.verifyHealth().schemaVersion).toBe(COLLABORATION_STATE_SCHEMA_VERSION);
      expect(database.recordedGitOperation("project-1", "old-record")).toEqual(oldRecord);
      const inspection = new DatabaseSync(databasePath, { readOnly: true });
      expect(inspection.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
      expect(inspection.prepare("SELECT count(*) AS n FROM project_events").get()).toEqual(eventCount);
      expect(inspection.prepare("SELECT name FROM sqlite_master WHERE name = 'preserved_operation_lookup'").get()).toBeDefined();
      expect(inspection.prepare("PRAGMA foreign_key_list(scoped_operations)").all()).toContainEqual(
        expect.objectContaining({ table: "scoped_executions", from: "owner_execution_id" }));
      inspection.close();
      const journal = database.operationsForProject("project-1", true);
      const revert = await journal.prepare({ id: `git-revert-${"a".repeat(64)}`, kind: "git.revert", payloadHash: "revert-payload",
        ownerExecutionId: "exec-worker", ownershipEpoch: 1, expectedHead: "b".repeat(40), expectedBase: "executions/exec-worker", status: "prepared" });
      expect(await journal.activeRevertOperation!("exec-worker")).toEqual(revert);
      await expect(journal.prepare({ ...revert, id: `git-revert-${"b".repeat(64)}` })).rejects.toThrow("settled prior journal");
    } finally { database?.close(); await rm(directory, { recursive: true, force: true }); }
  });

  it("migrates v9 final integration ownership without weakening member or legacy journals", async () => {
    const directory = await mkdtemp(join(tmpdir(), "openfars-scoped-final-owner-migration-"));
    const databasePath = join(directory, "collaboration.sqlite");
    const options = {
      databasePath, serviceId: "final-owner-migration-test", hostId: "host-a",
      topology: "single-host" as const, instanceId: "instance-a", now: () => 1_000_000
    };
    try {
      const created = CollaborationStateDatabase.open(options);
      activateFinalIntegrationFixture(created)();
      const lease = created.writerLease();
      created.close();
      const old = new DatabaseSync(databasePath);
      legacyWriterFixture(old, lease, options.now());
      old.exec("DROP TABLE scoped_final_operations; DROP TABLE scoped_final_integrations; UPDATE collaboration_state_meta SET schema_version = 9 WHERE singleton = 1");
      old.close();
      expect(() => CollaborationStateDatabase.open({ ...options, instanceId: "other-instance" })).toThrow();
      const unchanged = new DatabaseSync(databasePath, { readOnly: true });
      expect(unchanged.prepare("SELECT schema_version FROM collaboration_state_meta").get())
        .toMatchObject({ schema_version: 9 });
      expect(unchanged.prepare("SELECT name FROM sqlite_schema WHERE name = 'scoped_final_integrations'").get())
        .toBeUndefined();
      unchanged.close();
      const migrated = openUpgradedFixture(options);
      expect(migrated.verifyHealth().schemaVersion).toBe(COLLABORATION_STATE_SCHEMA_VERSION);
      expect(migrated.scopedExecution("project-1", "exec-worker")?.status).toBe("completed");
      expect(migrated.scopedGroupReadyForFinalIntegration("project-1", "run-G")).toBe(true);
      migrated.close();
      const inspection = new DatabaseSync(databasePath, { readOnly: true });
      expect(inspection.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
      expect(inspection.prepare("PRAGMA foreign_key_list(scoped_operations)").all())
        .toContainEqual(expect.objectContaining({ table: "scoped_executions", from: "owner_execution_id" }));
      expect(inspection.prepare("PRAGMA foreign_key_list(operations)").all())
        .toContainEqual(expect.objectContaining({ table: "member_executions", from: "owner_execution_id" }));
      expect(inspection.prepare("PRAGMA foreign_key_list(scoped_final_operations)").all())
        .toContainEqual(expect.objectContaining({ table: "scoped_final_integrations", from: "owner_execution_id" }));
      inspection.close();
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("owns the final PR only after Finish and Leader release without using an Agent session or slot", async () => {
    const directory = await mkdtemp(join(tmpdir(), "openfars-scoped-final-owner-"));
    const options = {
      databasePath: join(directory, "collaboration.sqlite"), serviceId: "final-owner-test", hostId: "host-a",
      topology: "single-host" as const, instanceId: "instance-a", now: () => 1_000_000
    };
    let database: CollaborationStateDatabase | undefined;
    try {
      database = CollaborationStateDatabase.open(options);
      const finishWorker = activateFinalIntegrationFixture(database);
      const evidence = mergedGroupEvidence("run-G", "main", 2);
      const begin = {
        projectId: "project-1", groupRunId: "run-G", expectedHeadSha: evidence.pullRequest.headSha
      };
      expect(() => database!.beginScopedFinalIntegration(begin)).toThrow(/unfinished or failed/);
      const turn = { projectId: "project-1", groupRunId: "run-G", agentId: "main", invocationId: "leader-final" };
      expect(database.claimScopedLeaderTurn(turn)).toBeUndefined();
      finishWorker();
      expect(database.claimScopedLeaderTurn(turn)).toBeDefined();
      expect(() => database!.beginScopedFinalIntegration(begin)).toThrow(/confirmed-stop release/);
      database.releaseScopedLeaderTurn({ ...turn, residentStopConfirmed: true });
      const claim = database.beginScopedFinalIntegration(begin);
      expect(claim.integration).toEqual({
        id: "group-final-run-G", projectId: "project-1", groupRunId: "run-G", ownershipEpoch: 1,
        executionBranch: "groups/run-G", integrationTarget: "main", expectedHeadSha: "d".repeat(40),
        status: "integrating"
      });
      expect(database.beginScopedFinalIntegration(begin)).toMatchObject({ replay: true, revision: claim.revision });
      expect(() => database!.beginScopedFinalIntegration({ ...begin, expectedHeadSha: "f".repeat(40) }))
        .toThrow(/changed on replay/);
      expect(database.laneAvailability("project-1").every((lane) => lane.occupied === 0)).toBe(true);
      expect(() => database!.claimScopedLeaderTurn({ ...turn, invocationId: "leader-too-late" }))
        .toThrow(/active group/);
      const store = database.operationsForProject("project-1", true);
      const authority = {
        projectId: "project-1", executionId: claim.integration.id, ownershipEpoch: 1,
        expectedBranch: "groups/run-G", operation: "provider.mutate" as const
      };
      await expect(store.assertExecutionOwnership(authority)).resolves.toBeUndefined();
      await expect(store.assertExecutionOwnership({ ...authority, operation: "checkpoint" })).rejects.toThrow();
      await expect(store.assertExecutionOwnership({ ...authority, ownershipEpoch: 2 })).rejects.toThrow();
      await expect(store.assertExecutionOwnership({ ...authority, expectedBranch: "groups/another" })).rejects.toThrow();
      const operation = {
        id: "final-pull-create", kind: "pull.create" as const, payloadHash: "final-pull-hash", status: "prepared" as const,
        ownerExecutionId: claim.integration.id, ownershipEpoch: 1, expectedHead: begin.expectedHeadSha, expectedBase: "main"
      };
      await expect(store.prepare({ ...operation, expectedBase: "groups/wrong-parent" })).rejects.toThrow(/direct parent target/);
      await expect(store.prepare({ ...operation, expectedHead: "f".repeat(40) })).rejects.toThrow(/frozen head/);
      await expect(store.prepare({ ...operation, kind: "git.push" })).rejects.toThrow();
      await store.prepare(operation);
      await expect(database.operationsForProject("project-1").prepare({
        id: operation.id, kind: "git.push", payloadHash: "different", status: "prepared"
      })).rejects.toThrow();
      expect(() => database!.completeScopedGroupAfterFinalMerge({
        projectId: "project-1", groupRunId: "run-G", ...evidence
      })).toThrow(/resolve uncertain Git operations/);
      const lease = database.writerLease();
      const attached = CollaborationStateDatabase.open({ ...options, writerLease: lease, writerOwner: database.writerOwnerAttachment() });
      try { expect(attached.beginScopedFinalIntegration(begin)).toMatchObject({ replay: true, integration: claim.integration }); }
      finally { attached.close(); }
      const recoveredStore = database.operationsForProject("project-1", true);
      await recoveredStore.transition({
        id: operation.id, payloadHash: operation.payloadHash, status: "observed", remoteFact: evidence.pullRequest
      });
      await recoveredStore.transition({
        id: operation.id, payloadHash: operation.payloadHash, status: "finalized", remoteFact: evidence.pullRequest
      });
      expect(database.projectState("project-1").operations).toContainEqual(expect.objectContaining({
        id: operation.id, ownerExecutionId: claim.integration.id, status: "finalized"
      }));
      expect(() => database!.completeScopedGroupAfterFinalMerge({
        projectId: "project-1", groupRunId: "run-G", ...evidence,
        pullRequest: { ...evidence.pullRequest, ownerExecutionId: "wrong-owner" }
      })).toThrow();
      const completed = database.completeScopedGroupAfterFinalMerge({
        projectId: "project-1", groupRunId: "run-G", ...evidence
      });
      expect(database.scopedFinalIntegration("project-1", "run-G")?.status).toBe("completed");
      expect(database.completeScopedGroupAfterFinalMerge({
        projectId: "project-1", groupRunId: "run-G", ...evidence
      })).toMatchObject({ replay: true, revision: completed.revision });
      await expect(recoveredStore.assertExecutionOwnership(authority)).rejects.toThrow();
      await expect(recoveredStore.prepare({ ...operation, id: "new-pull-after-completion" })).rejects.toThrow();
      expect(database.projectState("project-1").scopedExecutions).toHaveLength(1);
    } finally {
      database?.close();
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("preserves completed pre-owner merge proofs as immutable replays without creating Git authority", async () => {
    const directory = await mkdtemp(join(tmpdir(), "openfars-scoped-legacy-final-proof-"));
    const options = {
      databasePath: join(directory, "collaboration.sqlite"), serviceId: "legacy-final-proof-test", hostId: "host-a",
      topology: "single-host" as const, instanceId: "instance-a", now: () => 1_000_000
    };
    let database: CollaborationStateDatabase | undefined;
    try {
      database = CollaborationStateDatabase.open(options);
      activateFinalIntegrationFixture(database)();
      const evidence = mergedGroupEvidence("run-G", "main", 2);
      database.beginScopedFinalIntegration({
        projectId: "project-1", groupRunId: "run-G", expectedHeadSha: evidence.pullRequest.headSha
      });
      const completed = database.completeScopedGroupAfterFinalMerge({ projectId: "project-1", groupRunId: "run-G", ...evidence });
      const priorRevision = completed.revision;
      const lease = database.writerLease();
      database.close();
      const legacyProof = {
        groupRunId: "run-G", pullRequestId: evidence.pullRequest.id, providerNumber: 2,
        head: evidence.pullRequest.head, base: "main", headSha: evidence.pullRequest.headSha,
        mergeCommitSha: evidence.pullRequest.mergeCommitSha,
        synchronizationOperationId: evidence.synchronization.operationId,
        synchronizedHead: evidence.synchronization.localHeadAfter, selectedWeakTarget: null
      };
      const legacyHash = createHash("sha256").update(JSON.stringify(
        Object.fromEntries(Object.entries(legacyProof).sort(([left], [right]) => left.localeCompare(right)))
      )).digest("hex");
      const old = new DatabaseSync(options.databasePath);
      legacyWriterFixture(old, lease, options.now());
      old.prepare(`
        UPDATE scoped_group_final_merge_facts SET proof_hash = ?,
          pull_request_json = json_remove(pull_request_json, '$.ownerExecutionId') WHERE group_run_id = 'run-G'
      `).run(legacyHash);
      old.exec("DROP TABLE scoped_final_operations; DROP TABLE scoped_final_integrations; UPDATE collaboration_state_meta SET schema_version = 9 WHERE singleton = 1");
      old.close();
      database = openUpgradedFixture(options);
      expect(database.completeScopedGroupAfterFinalMerge({
        projectId: "project-1", groupRunId: "run-G", ...evidence
      })).toMatchObject({ replay: true, revision: priorRevision });
      expect(database.scopedFinalIntegration("project-1", "run-G")).toBeUndefined();
      await expect(database.operationsForProject("project-1", true).assertExecutionOwnership({
        projectId: "project-1", executionId: evidence.executionId, ownershipEpoch: 1,
        expectedBranch: "groups/run-G", operation: "provider.mutate"
      })).rejects.toThrow();
      expect(() => database!.completeScopedGroupAfterFinalMerge({
        projectId: "project-1", groupRunId: "run-G", ...evidence,
        pullRequest: { ...evidence.pullRequest, providerNumber: 99 }
      })).toThrow(/changed on replay/);
      const inspection = new DatabaseSync(options.databasePath, { readOnly: true });
      expect(inspection.prepare("SELECT proof_hash FROM scoped_group_final_merge_facts WHERE group_run_id = 'run-G'").get())
        .toEqual({ proof_hash: legacyHash });
      inspection.close();
    } finally {
      database?.close();
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("fences a prior writer's final integration instead of silently granting a new service its authority", async () => {
    const directory = await mkdtemp(join(tmpdir(), "openfars-scoped-final-writer-fence-"));
    const options = {
      databasePath: join(directory, "collaboration.sqlite"), serviceId: "final-writer-test", hostId: "host-a",
      topology: "single-host" as const, instanceId: "instance-a", now: () => 1_000_000
    };
    let database: CollaborationStateDatabase | undefined;
    try {
      database = CollaborationStateDatabase.open(options);
      activateFinalIntegrationFixture(database)();
      const begin = { projectId: "project-1", groupRunId: "run-G", expectedHeadSha: "d".repeat(40) };
      const original = database.beginScopedFinalIntegration(begin);
      database.relinquishWriterLease();
      database.close();
      database = CollaborationStateDatabase.open({ ...options, instanceId: "instance-b" });
      expect(database.scopedFinalIntegration("project-1", "run-G")).toEqual(original.integration);
      expect(() => database!.beginScopedFinalIntegration(begin)).toThrow();
      await expect(database.operationsForProject("project-1", true).assertExecutionOwnership({
        projectId: "project-1", executionId: original.integration.id, ownershipEpoch: 1,
        expectedBranch: "groups/run-G", operation: "provider.mutate"
      })).rejects.toThrow();
      expect(database.scopedGroupRun("project-1", "run-G")?.status).toBe("integrating");
    } finally {
      database?.close();
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("migrates v8 Leader ownership only under the exact live writer lease", async () => {
    const directory = await mkdtemp(join(tmpdir(), "openfars-scoped-leader-migration-"));
    const databasePath = join(directory, "collaboration.sqlite");
    const options = {
      databasePath, serviceId: "scoped-leader-migration-test", hostId: "host-a",
      topology: "single-host" as const, instanceId: "instance-a", now: () => 1_000_000
    };
    try {
      const created = CollaborationStateDatabase.open(options);
      const lease = created.writerLease();
      created.close();
      const old = new DatabaseSync(databasePath);
      legacyWriterFixture(old, lease, options.now());
      old.exec("DROP TABLE scoped_leader_turns; UPDATE collaboration_state_meta SET schema_version = 8 WHERE singleton = 1");
      old.close();
      expect(() => CollaborationStateDatabase.open({ ...options, instanceId: "other-instance" })).toThrow();
      const unchanged = new DatabaseSync(databasePath, { readOnly: true });
      expect(unchanged.prepare("SELECT schema_version FROM collaboration_state_meta").get())
        .toMatchObject({ schema_version: 8 });
      expect(unchanged.prepare("SELECT name FROM sqlite_schema WHERE name = 'scoped_leader_turns'").get())
        .toBeUndefined();
      unchanged.close();
      const migrated = openUpgradedFixture(options);
      expect(migrated.verifyHealth().schemaVersion).toBe(COLLABORATION_STATE_SCHEMA_VERSION);
      migrated.close();
      const inspection = new DatabaseSync(databasePath, { readOnly: true });
      expect(inspection.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
      expect(inspection.prepare("SELECT name FROM sqlite_schema WHERE name = 'scoped_leader_turns'").get())
        .toMatchObject({ name: "scoped_leader_turns" });
      inspection.close();
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("creates a versioned durable run/arrival ledger and migrates v2 under the exact writer lease", async () => {
    const directory = await mkdtemp(join(tmpdir(), "openfars-scoped-schema-"));
    const databasePath = join(directory, "collaboration.sqlite");
    const options = {
      databasePath,
      serviceId: "scoped-schema-test",
      hostId: "host-a",
      topology: "single-host" as const,
      instanceId: "instance-a",
      now: () => 1_000_000
    };
    try {
      const created = CollaborationStateDatabase.open(options);
      expect(created.verifyHealth().schemaVersion).toBe(COLLABORATION_STATE_SCHEMA_VERSION);
      const lease = created.writerLease();
      created.close();

      const old = new DatabaseSync(databasePath);
      legacyWriterFixture(old, lease, options.now());
      old.exec("DROP TABLE scoped_group_final_merge_facts; DROP TABLE scoped_finish_tokens; DROP TABLE scoped_agent_merge_facts; DROP TABLE scoped_executions; DROP TABLE scoped_arrivals; DROP TABLE scoped_group_runs");
      old.exec("UPDATE collaboration_state_meta SET schema_version = 2 WHERE singleton = 1");
      old.close();

      expect(() => CollaborationStateDatabase.open({
        ...options,
        instanceId: "other-instance"
      })).toThrow();
      const unchanged = new DatabaseSync(databasePath, { readOnly: true });
      expect(unchanged.prepare("SELECT schema_version FROM collaboration_state_meta").get()).toMatchObject({ schema_version: 2 });
      expect(unchanged.prepare("SELECT name FROM sqlite_schema WHERE name = 'scoped_group_runs'").get()).toBeUndefined();
      unchanged.close();

      const migrated = openUpgradedFixture(options);
      expect(migrated.verifyHealth().schemaVersion).toBe(COLLABORATION_STATE_SCHEMA_VERSION);
      migrated.close();
      const inspection = new DatabaseSync(databasePath, { readOnly: true });
      expect(inspection.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
      expect(inspection.prepare("SELECT name FROM sqlite_schema WHERE type = 'table' AND name IN ('scoped_group_runs','scoped_arrivals') ORDER BY name").all())
        .toEqual([{ name: "scoped_arrivals" }, { name: "scoped_group_runs" }]);
      inspection.close();
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("adds the scoped execution ledger to a v4 database only under its live writer lease", async () => {
    const directory = await mkdtemp(join(tmpdir(), "openfars-scoped-execution-migration-"));
    const databasePath = join(directory, "collaboration.sqlite");
    const options = {
      databasePath, serviceId: "scoped-execution-migration-test", hostId: "host-a",
      topology: "single-host" as const, instanceId: "instance-a", now: () => 1_000_000
    };
    try {
      const created = CollaborationStateDatabase.open(options);
      const lease = created.writerLease();
      created.close();
      const old = new DatabaseSync(databasePath);
      legacyWriterFixture(old, lease, options.now());
      old.exec("DROP TABLE scoped_group_final_merge_facts; DROP TABLE scoped_finish_tokens; DROP TABLE scoped_agent_merge_facts; DROP TABLE scoped_executions; UPDATE collaboration_state_meta SET schema_version = 4 WHERE singleton = 1");
      old.close();

      expect(() => CollaborationStateDatabase.open({ ...options, instanceId: "other-instance" })).toThrow();
      const unchanged = new DatabaseSync(databasePath, { readOnly: true });
      expect(unchanged.prepare("SELECT schema_version FROM collaboration_state_meta").get()).toMatchObject({ schema_version: 4 });
      expect(unchanged.prepare("SELECT name FROM sqlite_schema WHERE name = 'scoped_executions'").get()).toBeUndefined();
      unchanged.close();

      const migrated = openUpgradedFixture(options);
      expect(migrated.verifyHealth().schemaVersion).toBe(COLLABORATION_STATE_SCHEMA_VERSION);
      migrated.close();
      const inspection = new DatabaseSync(databasePath, { readOnly: true });
      expect(inspection.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
      expect(inspection.prepare("SELECT name FROM sqlite_schema WHERE name = 'scoped_executions'").get())
        .toMatchObject({ name: "scoped_executions" });
      expect(inspection.prepare("SELECT name FROM sqlite_schema WHERE name = 'scoped_executions_one_active_agent'").get())
        .toMatchObject({ name: "scoped_executions_one_active_agent" });
      inspection.close();
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("migrates v5 merge and Finish facts under the exact writer lease", async () => {
    const directory = await mkdtemp(join(tmpdir(), "openfars-scoped-integration-migration-"));
    const databasePath = join(directory, "collaboration.sqlite");
    const options = {
      databasePath, serviceId: "scoped-integration-migration-test", hostId: "host-a",
      topology: "single-host" as const, instanceId: "instance-a", now: () => 1_000_000
    };
    try {
      const created = CollaborationStateDatabase.open(options);
      const lease = created.writerLease();
      created.close();
      const old = new DatabaseSync(databasePath);
      legacyWriterFixture(old, lease, options.now());
      old.exec("DROP TABLE scoped_group_final_merge_facts; DROP TABLE scoped_finish_tokens; DROP TABLE scoped_agent_merge_facts; UPDATE collaboration_state_meta SET schema_version = 5 WHERE singleton = 1");
      old.close();
      expect(() => CollaborationStateDatabase.open({ ...options, instanceId: "other-instance" })).toThrow();
      const migrated = openUpgradedFixture(options);
      expect(migrated.verifyHealth().schemaVersion).toBe(COLLABORATION_STATE_SCHEMA_VERSION);
      migrated.close();
      const inspection = new DatabaseSync(databasePath, { readOnly: true });
      expect(inspection.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
      expect(inspection.prepare(`
        SELECT name FROM sqlite_schema WHERE type = 'table'
          AND name IN ('scoped_agent_merge_facts','scoped_finish_tokens') ORDER BY name
      `).all()).toEqual([
        { name: "scoped_agent_merge_facts" }, { name: "scoped_finish_tokens" }
      ]);
      inspection.close();
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("migrates v6 recursive final PR facts under the exact writer lease", async () => {
    const directory = await mkdtemp(join(tmpdir(), "openfars-scoped-final-migration-"));
    const databasePath = join(directory, "collaboration.sqlite");
    const options = {
      databasePath, serviceId: "scoped-final-migration-test", hostId: "host-a",
      topology: "single-host" as const, instanceId: "instance-a", now: () => 1_000_000
    };
    try {
      const created = CollaborationStateDatabase.open(options);
      const lease = created.writerLease();
      created.close();
      const old = new DatabaseSync(databasePath);
      legacyWriterFixture(old, lease, options.now());
      old.exec("DROP TABLE scoped_group_final_merge_facts; UPDATE collaboration_state_meta SET schema_version = 6 WHERE singleton = 1");
      old.close();
      expect(() => CollaborationStateDatabase.open({ ...options, instanceId: "other-instance" })).toThrow();
      const migrated = openUpgradedFixture(options);
      expect(migrated.verifyHealth().schemaVersion).toBe(COLLABORATION_STATE_SCHEMA_VERSION);
      migrated.close();
      const inspection = new DatabaseSync(databasePath, { readOnly: true });
      expect(inspection.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
      expect(inspection.prepare("SELECT name FROM sqlite_schema WHERE name = 'scoped_group_final_merge_facts'").get())
        .toMatchObject({ name: "scoped_group_final_merge_facts" });
      inspection.close();
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("migrates the scoped Git operation journal from v7 only under its live writer lease", async () => {
    const directory = await mkdtemp(join(tmpdir(), "openfars-scoped-operations-migration-"));
    const databasePath = join(directory, "collaboration.sqlite");
    const options = {
      databasePath, serviceId: "scoped-operations-migration-test", hostId: "host-a",
      topology: "single-host" as const, instanceId: "instance-a", now: () => 1_000_000
    };
    try {
      const created = CollaborationStateDatabase.open(options);
      const lease = created.writerLease();
      created.close();
      const old = new DatabaseSync(databasePath);
      legacyWriterFixture(old, lease, options.now());
      old.exec("DROP TABLE scoped_operations; UPDATE collaboration_state_meta SET schema_version = 7 WHERE singleton = 1");
      old.close();
      expect(() => CollaborationStateDatabase.open({ ...options, instanceId: "other-instance" })).toThrow();
      const migrated = openUpgradedFixture(options);
      expect(migrated.verifyHealth().schemaVersion).toBe(COLLABORATION_STATE_SCHEMA_VERSION);
      migrated.close();
      const inspection = new DatabaseSync(databasePath, { readOnly: true });
      expect(inspection.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
      expect(inspection.prepare("SELECT name FROM sqlite_schema WHERE name = 'scoped_operations'").get())
        .toMatchObject({ name: "scoped_operations" });
      inspection.close();
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("fences scoped Git operations to the active arrival, branch and worker lane", async () => {
    const directory = await mkdtemp(join(tmpdir(), "openfars-scoped-git-ownership-"));
    const options = {
      databasePath: join(directory, "collaboration.sqlite"), serviceId: "scoped-git-ownership-test",
      hostId: "host-a", topology: "single-host" as const, instanceId: "instance-a", now: () => 1_000_000
    };
    let database: CollaborationStateDatabase | undefined;
    try {
      database = CollaborationStateDatabase.open(options);
      database.createProject({
        projectId: "project-1", workflowRevision: 1,
        workflowSnapshot: {
          schemaVersion: 3, agents: [{ name: "main" }, { name: "worker1" }],
          collaborations: [{ id: "G" }], routes: { G: [{ kind: "strong", target: "finish" }] },
          scopedWorkflow: {
            schemaVersion: 1, rootAgentIds: ["main"], groups: [{
              id: "G", leaderAgentId: "main", allowLeaderReconfiguration: false,
              workflow: {
                nodes: [{ kind: "agent", nodeId: "A", agentId: "worker1" }],
                input: { source: "input", edges: [{ kind: "parallel", target: "A" }] },
                routes: { A: [{ kind: "strong", target: "finish" }] }
              }
            }]
          }
        },
        git: { enabled: true, status: "ready" }, workerCapacity: 1
      });
      const group = database.activateScopedGroup({
        projectId: "project-1", groupRunId: "run-G", groupId: "G",
        activationRequestId: "activate-G", workflowRevision: 1, baseCommit: "a".repeat(40),
        outer: { nodeRunId: "node-G", inputSnapshotRef: "project:input", activatedByAgentId: "main" }
      });
      const arrival = group.arrivals[0]!;
      database.claimScopedAgentArrival({
        projectId: "project-1", arrivalRequestId: arrival.requestId,
        agentId: "worker1", executionId: "exec-A",
        worktreePath: sdkFixturePath("/srv/openfars/git-worktrees/agents/worker1")
      });
      const readModel = database.projectState("project-1");
      expect(readModel.scopedGroupRuns).toContainEqual(expect.objectContaining({
        id: "run-G", groupId: "G", groupBranch: "groups/run-G", integrationTarget: "main"
      }));
      expect(readModel.scopedArrivals).toContainEqual(expect.objectContaining({
        requestId: arrival.requestId, targetNodeId: "A", status: "running"
      }));
      expect(readModel.scopedExecutions).toContainEqual(expect.objectContaining({
        id: "exec-A", arrivalRequestId: arrival.requestId, ownershipEpoch: 1,
        worktreePath: sdkFixturePath("/srv/openfars/git-worktrees/agents/worker1")
      }));
      const store = database.operationsForProject("project-1", true);
      const authority = {
        projectId: "project-1", executionId: "exec-A", ownershipEpoch: 1,
        expectedBranch: "executions/exec-A", operation: "checkpoint" as const
      };
      await expect(store.assertExecutionOwnership(authority)).resolves.toBeUndefined();
      await expect(store.assertExecutionOwnership({ ...authority, expectedBranch: "main" })).rejects.toThrow();
      const record = {
        id: "scoped-push-A", kind: "git.push" as const, payloadHash: "hash-A",
        status: "prepared" as const, ownerExecutionId: "exec-A", ownershipEpoch: 1,
        expectedHead: "a".repeat(40), expectedBase: "executions/exec-A"
      };
      expect(await store.prepare(record)).toMatchObject({ id: record.id, status: "prepared" });
      const observed = await store.transition({
        id: record.id, payloadHash: record.payloadHash, status: "observed",
        remoteFact: { ref: "executions/exec-A", status: "present" }
      });
      expect(observed).toMatchObject({ status: "observed", ownerExecutionId: "exec-A" });
      expect(await store.transition({
        id: record.id, payloadHash: record.payloadHash, status: "finalized",
        remoteFact: { ref: "executions/exec-A", status: "present" }
      })).toMatchObject({ status: "finalized" });
      expect(await store.prepare(record)).toMatchObject({ status: "finalized" });
      expect(database.projectState("project-1").operations).toContainEqual(
        expect.objectContaining({ id: record.id, ownerExecutionId: "exec-A" })
      );
      const proof = mergedScopedEvidence("exec-A", "groups/run-G", 1);
      const openPull = {
        ...proof.pullRequest, status: "open" as const, mergeCommitSha: undefined,
        owner: "example", repository: "openfars", checks: []
      };
      const create = {
        id: "scoped-pull-create-A", kind: "pull.create" as const, payloadHash: "hash-pull-create-A",
        status: "prepared" as const, ownerExecutionId: "exec-A", ownershipEpoch: 1,
        expectedHead: proof.pullRequest.headSha, expectedBase: proof.pullRequest.base
      };
      await store.prepare(create);
      await store.transition({ id: create.id, payloadHash: create.payloadHash, status: "observed", remoteFact: openPull });
      await store.transition({ id: create.id, payloadHash: create.payloadHash, status: "finalized", remoteFact: openPull });
      expect(database.projectState("project-1").scopedPullRequests).toContainEqual(expect.objectContaining({
        id: openPull.id, ownerExecutionId: "exec-A", status: "open", base: "groups/run-G"
      }));
      const wrongBranch = {
        ...create, id: "scoped-pull-wrong-branch", payloadHash: "hash-pull-wrong-branch"
      };
      await store.prepare(wrongBranch);
      await store.transition({ id: wrongBranch.id, payloadHash: wrongBranch.payloadHash, status: "observed",
        remoteFact: { ...openPull, head: "main" } });
      await store.transition({ id: wrongBranch.id, payloadHash: wrongBranch.payloadHash, status: "finalized",
        remoteFact: { ...openPull, head: "main" } });
      expect(database.projectState("project-1").scopedPullRequests).toHaveLength(1);
      const merge = {
        ...create, id: "scoped-pull-merge-A", kind: "pull.merge" as const, payloadHash: "hash-pull-merge-A"
      };
      await store.prepare(merge);
      await store.transition({ id: merge.id, payloadHash: merge.payloadHash, status: "observed",
        remoteFact: proof.pullRequest });
      await store.transition({ id: merge.id, payloadHash: merge.payloadHash, status: "finalized",
        remoteFact: proof.pullRequest });
      expect(database.projectState("project-1").scopedPullRequests).toContainEqual(expect.objectContaining({
        id: proof.pullRequest.id, ownerExecutionId: "exec-A", status: "merged",
        mergeCommitSha: proof.pullRequest.mergeCommitSha
      }));
      const syncInput = {
        projectId: "project-1", executionId: "exec-A", ownershipEpoch: 1,
        providerNumber: 1, expectedHead: proof.pullRequest.headSha,
        expectedBase: proof.pullRequest.base,
        expectedMergeCommitSha: proof.pullRequest.mergeCommitSha,
        synchronization: proof.synchronization
      };
      await expect(store.recordMergedSynchronization(syncInput)).resolves.toBeUndefined();
      await expect(store.recordMergedSynchronization(syncInput)).resolves.toBeUndefined();
      await expect(store.recordMergedSynchronization({ ...syncInput, expectedBase: "main" })).rejects.toThrow();
      database.completeScopedAgentArrivalAfterMerge({
        projectId: "project-1", arrivalRequestId: arrival.requestId,
        executionId: "exec-A", ownershipEpoch: 1, ...proof
      });
      await expect(store.assertExecutionOwnership(authority)).rejects.toThrow();
    } finally {
      database?.close();
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("emits a successor only after the exact merged PR and closes Finish after all parallel paths", async () => {
    const directory = await mkdtemp(join(tmpdir(), "openfars-scoped-merge-route-"));
    const options = {
      databasePath: join(directory, "collaboration.sqlite"), serviceId: "scoped-merge-route-test",
      hostId: "host-a", topology: "single-host" as const, instanceId: "instance-a", now: () => 1_000_000
    };
    let database: CollaborationStateDatabase | undefined;
    try {
      database = CollaborationStateDatabase.open(options);
      database.createProject({
        projectId: "project-1", workflowRevision: 1,
        workflowSnapshot: {
          schemaVersion: 3,
          agents: [{ name: "main" }, { name: "worker1" }, { name: "worker2" }, { name: "worker3" }],
          collaborations: [{ id: "G" }],
          routes: { G: [{ kind: "strong", target: "finish" }] },
          scopedWorkflow: {
            schemaVersion: 1, rootAgentIds: ["main"], groups: [{
              id: "G", leaderAgentId: "main", allowLeaderReconfiguration: false,
              workflow: {
                nodes: [
                  { kind: "agent", nodeId: "A", agentId: "worker1" },
                  { kind: "agent", nodeId: "B", agentId: "worker2" },
                  { kind: "agent", nodeId: "C", agentId: "worker3" }
                ],
                input: { source: "input", edges: [
                  { kind: "parallel", target: "A" }, { kind: "parallel", target: "C" }
                ] },
                routes: {
                  A: [{ kind: "strong", target: "B" }],
                  B: [{ kind: "strong", target: "finish" }],
                  C: [{ kind: "weak", target: "finish" }]
                }
              }
            }]
          }
        },
        git: { enabled: true, status: "ready" }, workerCapacity: 2
      });
      const group = database.activateScopedGroup({
        projectId: "project-1", groupRunId: "run-G", groupId: "G",
        activationRequestId: "activate-G", workflowRevision: 1, baseCommit: "base-G",
        outer: { nodeRunId: "node-G", inputSnapshotRef: "project:input", activatedByAgentId: "main" }
      });
      expect(() => database!.assertWorkflowRevisionEditable("project-1", ["G"]))
        .toThrow(/locked by active scoped run/);
      const arrivalA = group.arrivals.find((arrival) => arrival.targetNodeId === "A")!;
      const arrivalC = group.arrivals.find((arrival) => arrival.targetNodeId === "C")!;
      const claim = (requestId: string, agentId: string, executionId: string) => database!.claimScopedAgentArrival({
        projectId: "project-1", arrivalRequestId: requestId, agentId, executionId,
        worktreePath: sdkFixturePath(`/srv/openfars/git-worktrees/agents/${agentId}`)
      });
      expect(claim(arrivalA.requestId, "worker1", "exec-A")?.execution.status).toBe("running");
      expect(claim(arrivalC.requestId, "worker3", "exec-C")?.execution.status).toBe("running");
      expect(database.executionPullBase("project-1", "exec-A")).toBe("groups/run-G");
      expect(() => database.executionPullBase("project-1", "missing-scoped-execution")).toThrow(/Execution missing-scoped-execution does not exist/);
      expect(database.laneAvailability("project-1")).toContainEqual({
        lane: "worker", capacity: 2, occupied: 2, available: 0
      });
      expect(database.scopedGroupReadyForFinalIntegration("project-1", "run-G")).toBe(false);

      const proofA = mergedScopedEvidence("exec-A", "groups/run-G", 1);
      expect(() => database!.completeScopedAgentArrivalAfterMerge({
        projectId: "project-1", arrivalRequestId: arrivalA.requestId,
        executionId: "exec-A", ownershipEpoch: 1,
        ...proofA, pullRequest: { ...proofA.pullRequest, status: "open" }
      })).toThrow(/merged PR/);
      expect(() => database!.completeScopedAgentArrivalAfterMerge({
        projectId: "project-1", arrivalRequestId: arrivalA.requestId,
        executionId: "exec-A", ownershipEpoch: 1,
        ...proofA, pullRequest: { ...proofA.pullRequest, base: "main" }
      })).toThrow(/direct group branch/);
      expect(() => database!.completeScopedAgentArrivalAfterMerge({
        projectId: "project-1", arrivalRequestId: arrivalA.requestId,
        executionId: "exec-A", ownershipEpoch: 1,
        ...proofA, synchronization: { ...proofA.synchronization, targetBranch: "main" }
      })).toThrow(/local synchronization/);
      expect(database.scopedArrivals("run-G")).toHaveLength(2);
      const completedA = database.completeScopedAgentArrivalAfterMerge({
        projectId: "project-1", arrivalRequestId: arrivalA.requestId,
        executionId: "exec-A", ownershipEpoch: 1, ...proofA
      });
      expect(completedA).toMatchObject({
        replay: false, arrival: { status: "completed" }, execution: { status: "completed" },
        route: { kind: "activate", activation: { targetNodeId: "B", sourceRunId: arrivalA.requestId } },
        readyForFinalIntegration: false
      });
      expect(database.laneAvailability("project-1")).toContainEqual({
        lane: "worker", capacity: 2, occupied: 1, available: 1
      });
      expect(database.scopedArrivals("run-G").map((arrival) => arrival.targetNodeId)).toEqual(["A", "C", "B"]);
      expect(database.completeScopedAgentArrivalAfterMerge({
        projectId: "project-1", arrivalRequestId: arrivalA.requestId,
        executionId: "exec-A", ownershipEpoch: 1, ...proofA
      })).toMatchObject({ replay: true, revision: completedA.revision });
      expect(() => database!.completeScopedAgentArrivalAfterMerge({
        projectId: "project-1", arrivalRequestId: arrivalA.requestId,
        executionId: "exec-A", ownershipEpoch: 1,
        ...proofA, pullRequest: { ...proofA.pullRequest, providerNumber: 99 }
      })).toThrow(/proof changed on replay/);

      const proofC = mergedScopedEvidence("exec-C", "groups/run-G", 3);
      expect(database.completeScopedAgentArrivalAfterMerge({
        projectId: "project-1", arrivalRequestId: arrivalC.requestId,
        executionId: "exec-C", ownershipEpoch: 1, ...proofC, selectedWeakTarget: "finish"
      }).readyForFinalIntegration).toBe(false);
      expect(() => database!.completeScopedAgentArrivalAfterMerge({
        projectId: "project-1", arrivalRequestId: arrivalC.requestId,
        executionId: "exec-C", ownershipEpoch: 1, ...proofC, selectedWeakTarget: "B"
      })).toThrow(/proof changed on replay/);
      const arrivalB = database.scopedArrivals("run-G").find((arrival) => arrival.targetNodeId === "B")!;
      expect(claim(arrivalB.requestId, "worker2", "exec-B")?.execution.status).toBe("running");
      expect(database.laneAvailability("project-1")).toContainEqual({
        lane: "worker", capacity: 2, occupied: 1, available: 1
      });

      database.close();
      database = CollaborationStateDatabase.open(options);
      expect(database.scopedGroupReadyForFinalIntegration("project-1", "run-G")).toBe(false);
      const proofB = mergedScopedEvidence("exec-B", "groups/run-G", 2);
      expect(database.completeScopedAgentArrivalAfterMerge({
        projectId: "project-1", arrivalRequestId: arrivalB.requestId,
        executionId: "exec-B", ownershipEpoch: 1, ...proofB
      }).readyForFinalIntegration).toBe(true);
      expect(database.scopedGroupReadyForFinalIntegration("project-1", "run-G")).toBe(true);
      expect(database.laneAvailability("project-1")).toContainEqual({
        lane: "worker", capacity: 2, occupied: 0, available: 2
      });
      expect(database.scopedArrivals("run-G")).toHaveLength(3);
      const finalProof = mergedGroupEvidence("run-G", "main", 10);
      database.beginScopedFinalIntegration({
        projectId: "project-1", groupRunId: "run-G", expectedHeadSha: finalProof.pullRequest.headSha
      });
      const outerRoute = {
        projectId: "project-1", groupRunId: "run-G", nodeRunId: "node-G",
        routeEmissionId: "route-G", route: { kind: "fixed" as const, targetNodeId: "finish" },
        output: "Group result merged"
      };
      expect(() => database!.completeScopedRootRoute(outerRoute)).toThrow(/completed scoped root/);
      expect(() => database!.completeScopedGroupAfterFinalMerge({
        projectId: "project-1", groupRunId: "run-G",
        ...finalProof, pullRequest: { ...finalProof.pullRequest, base: "groups/other" }
      })).toThrow(/direct parent target/);
      const completedRoot = database.completeScopedGroupAfterFinalMerge({
        projectId: "project-1", groupRunId: "run-G", ...finalProof
      });
      expect(completedRoot).toMatchObject({ replay: false, groupRun: { status: "completed" } });
      const completedRevision = database.projectState("project-1").stateRevision;
      expect(() => database.resumeScopedManagementRepairs({ projectId: "project-1", nodeRunId: "node-G",
        expectedRevision: completedRevision })).not.toThrow();
      expect(database.projectState("project-1").stateRevision).toBe(completedRevision);
      expect(completedRoot.parentArrival).toBeUndefined();
      expect(database.completeScopedGroupAfterFinalMerge({
        projectId: "project-1", groupRunId: "run-G", ...finalProof
      })).toMatchObject({ replay: true, revision: completedRoot.revision });
      expect(database.projectState("project-1").scopedAgentMerges).toContainEqual(expect.objectContaining({
        executionId: "exec-A", groupRunId: "run-G",
        pullRequest: expect.objectContaining({ id: proofA.pullRequest.id, status: "merged" }),
        synchronization: expect.objectContaining({ targetBranch: "groups/run-G", status: "synchronized" })
      }));
      expect(database.projectState("project-1").scopedGroupFinalMerges).toContainEqual(expect.objectContaining({
        groupRunId: "run-G",
        pullRequest: expect.objectContaining({ id: finalProof.pullRequest.id, base: "main" }),
        synchronization: expect.objectContaining({ targetBranch: "main" })
      }));
      expect(database.projectState("project-1").activeNodeRunId).toBe("node-G");
      expect(() => database!.assertWorkflowRevisionEditable("project-1", ["G"]))
        .toThrow(/locked by active scoped run/);
      expect(() => database!.completeScopedRootRoute({
        ...outerRoute, route: { kind: "fixed", targetNodeId: "missing" }
      })).toThrow(/authorized outer workflow route/);
      const routed = database.completeScopedRootRoute(outerRoute);
      expect(routed).toMatchObject({
        replay: false, nodeRun: { status: "completed" },
        outbox: { status: "pending", targetNodeId: "finish", payload: { scopedGroupRunId: "run-G" } }
      });
      expect(database.projectState("project-1").activeNodeRunId).toBeUndefined();
      expect(() => database!.assertWorkflowRevisionEditable("project-1", ["G"]))
        .not.toThrow();
      expect(database.pendingRoutes("project-1")).toContainEqual(expect.objectContaining({ routeEmissionId: "route-G" }));
      expect(database.completeScopedRootRoute(outerRoute)).toMatchObject({
        replay: true, revision: routed.revision
      });
      expect(() => database!.completeScopedRootRoute({ ...outerRoute, output: "Changed" }))
        .toThrow(/changed on replay/);
    } finally {
      database?.close();
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("keeps an independent scoped arrival queued when the project's worker lane is full", async () => {
    const directory = await mkdtemp(join(tmpdir(), "openfars-scoped-worker-capacity-"));
    const options = {
      databasePath: join(directory, "collaboration.sqlite"), serviceId: "scoped-worker-capacity-test",
      hostId: "host-a", topology: "single-host" as const, instanceId: "instance-a", now: () => 1_000_000
    };
    let database: CollaborationStateDatabase | undefined;
    try {
      database = CollaborationStateDatabase.open(options);
      database.createProject({
        projectId: "project-1", workflowRevision: 1,
        workflowSnapshot: {
          schemaVersion: 3,
          agents: [{ name: "main" }, { name: "worker1" }, { name: "worker2" }],
          collaborations: [{ id: "G" }],
          scopedWorkflow: {
            schemaVersion: 1, rootAgentIds: ["main"], groups: [{
              id: "G", leaderAgentId: "main", allowLeaderReconfiguration: false,
              workflow: {
                nodes: [
                  { kind: "agent", nodeId: "A", agentId: "worker1" },
                  { kind: "agent", nodeId: "B", agentId: "worker2" }
                ],
                input: { source: "input", edges: [
                  { kind: "parallel", target: "A" }, { kind: "parallel", target: "B" }
                ] },
                routes: {
                  A: [{ kind: "strong", target: "finish" }],
                  B: [{ kind: "strong", target: "finish" }]
                }
              }
            }]
          }
        },
        git: { enabled: true, status: "ready" }, workerCapacity: 1
      });
      const group = database.activateScopedGroup({
        projectId: "project-1", groupRunId: "run-G", groupId: "G",
        activationRequestId: "activate-G", workflowRevision: 1, baseCommit: "base-G",
        outer: { nodeRunId: "node-G", inputSnapshotRef: "project:input", activatedByAgentId: "main" }
      });
      const [a, b] = group.arrivals;
      const claimA = {
        projectId: "project-1", arrivalRequestId: a!.requestId, agentId: "worker1",
        executionId: "exec-A", worktreePath: sdkFixturePath("/srv/openfars/git-worktrees/agents/worker1")
      };
      const claimB = {
        projectId: "project-1", arrivalRequestId: b!.requestId, agentId: "worker2",
        executionId: "exec-B", worktreePath: sdkFixturePath("/srv/openfars/git-worktrees/agents/worker2")
      };
      expect(database.claimScopedAgentArrival(claimA)?.execution.status).toBe("running");
      expect(() => database!.activateNode({
        projectId: "project-1", nodeRunId: "outer-worker1", node: {
          kind: "agent", nodeId: "worker1", agentId: "worker1"
        }, activationRequestId: "outer-worker1-activation", inputSnapshotRef: "outer:input",
        activatedByAgentId: "main", workflowRevision: 1
      })).toThrow(/active outer node/);
      expect(database.claimScopedAgentArrival(claimB)).toBeUndefined();
      expect(database.scopedArrivals("run-G")[1]?.status).toBe("queued");
      database.completeScopedAgentArrivalAfterMerge({
        projectId: "project-1", arrivalRequestId: a!.requestId,
        executionId: "exec-A", ownershipEpoch: 1,
        ...mergedScopedEvidence("exec-A", "groups/run-G", 1)
      });
      expect(database.claimScopedAgentArrival(claimB)?.execution.status).toBe("running");
    } finally {
      database?.close();
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("fences a nested Leader turn against the same Agent's business work and preserves the lease across restart", async () => {
    const directory = await mkdtemp(join(tmpdir(), "openfars-scoped-leader-turn-"));
    let clockMs = 1_000_000;
    const options = {
      databasePath: join(directory, "collaboration.sqlite"), serviceId: "scoped-leader-turn-test",
      hostId: "host-a", topology: "single-host" as const, instanceId: "instance-a", now: () => clockMs
    };
    let database: CollaborationStateDatabase | undefined;
    try {
      database = CollaborationStateDatabase.open(options);
      database.createProject({
        projectId: "project-1", workflowRevision: 1,
        workflowSnapshot: {
          schemaVersion: 3,
          agents: [{ name: "main" }, { name: "worker1" }, { name: "worker2" }],
          collaborations: [{ id: "G" }, { id: "H" }],
          scopedWorkflow: {
            schemaVersion: 1, rootAgentIds: ["main"], groups: [
              { id: "G", leaderAgentId: "main", allowLeaderReconfiguration: false,
                workflow: {
                  nodes: [
                    { kind: "agent", nodeId: "G_worker", agentId: "worker1" },
                    { kind: "collaboration", nodeId: "G_H", groupId: "H" }
                  ],
                  input: { source: "input", edges: [
                    { kind: "parallel", target: "G_worker" },
                    { kind: "parallel", target: "G_H" }
                  ] },
                  routes: {
                    G_worker: [{ kind: "strong", target: "finish" }],
                    G_H: [{ kind: "strong", target: "finish" }]
                  }
                } },
              { id: "H", parentGroupId: "G", leaderAgentId: "worker1",
                allowLeaderReconfiguration: false,
                workflow: {
                  nodes: [{ kind: "agent", nodeId: "H_worker", agentId: "worker2" }],
                  input: { source: "input", edges: [{ kind: "parallel", target: "H_worker" }] },
                  routes: { H_worker: [{ kind: "strong", target: "finish" }] }
                } }
            ]
          }
        },
        git: { enabled: true, status: "ready" }, workerCapacity: 2, managementCapacity: 1
      });
      const root = database.activateScopedGroup({
        projectId: "project-1", groupRunId: "run-G", groupId: "G",
        activationRequestId: "activate-G", workflowRevision: 1, baseCommit: "base-G",
        outer: { nodeRunId: "node-G", inputSnapshotRef: "project:input", activatedByAgentId: "main" }
      });
      const childArrival = root.arrivals.find((arrival) => arrival.targetNodeId === "G_H")!;
      const child = database.activateScopedGroup({
        projectId: "project-1", groupRunId: "run-H", groupId: "H",
        parentGroupRunId: "run-G", parentArrivalRequestId: childArrival.requestId,
        activationRequestId: "activate-H", workflowRevision: 1, baseCommit: "base-H"
      });
      const leader = {
        projectId: "project-1", groupRunId: "run-H", agentId: "worker1", invocationId: "leader-turn-1"
      };
      const first = database.claimScopedLeaderTurn(leader);
      expect(first).toMatchObject({ replay: false, managementSlot: 1,
        groupRun: { id: "run-H", leaderAgentId: "worker1" } });
      expect(database.claimScopedLeaderTurn(leader)).toMatchObject({ replay: true, revision: first!.revision });
      expect(() => database!.claimScopedLeaderTurn({ ...leader, groupRunId: "run-G" }))
        .toThrow(/configured Leader/);
      expect(database.claimScopedLeaderTurn({ ...leader, invocationId: "leader-turn-2" }))
        .toBeUndefined();
      expect(database.claimScopedLeaderTurn({
        projectId: "project-1", groupRunId: "run-G", agentId: "main", invocationId: "root-leader-turn"
      })).toBeUndefined();
      const rootWorker = root.arrivals.find((arrival) => arrival.targetNodeId === "G_worker")!;
      const work = {
        projectId: "project-1", arrivalRequestId: rootWorker.requestId, agentId: "worker1",
        executionId: "root-work-1", worktreePath: sdkFixturePath("/srv/openfars/git-worktrees/agents/worker1")
      };
      expect(database.claimScopedAgentArrival(work)).toBeUndefined();
      expect(() => database!.releaseLane({
        projectId: "project-1", lane: "management", ownerKind: "coordinator",
        ownerId: "scoped-leader:leader-turn-1"
      })).toThrow(/confirmed-stop release/);
      expect(database.claimScopedAgentArrival({
        projectId: "project-1", arrivalRequestId: child.arrivals[0]!.requestId,
        agentId: "worker2", executionId: "child-work-1",
        worktreePath: sdkFixturePath("/srv/openfars/git-worktrees/agents/worker2")
      })).toBeUndefined();
      expect(() => database!.releaseScopedLeaderTurn({ ...leader, residentStopConfirmed: false as true }))
        .toThrow(/confirmed resident stop/);
      const attached = CollaborationStateDatabase.open({ ...options, writerLease: database.writerLease(), writerOwner: database.writerOwnerAttachment() });
      try {
        expect(attached.claimScopedLeaderTurn(leader)).toMatchObject({ replay: true });
        expect(attached.claimScopedAgentArrival(work)).toBeUndefined();
      } finally { attached.close(); }
      database.close();
      database = CollaborationStateDatabase.open({ ...options, instanceId: "instance-b" });
      expect(() => database!.claimScopedLeaderTurn(leader)).toThrow(/prior-writer/);
      expect(database.claimScopedAgentArrival(work)).toBeUndefined();
      const released = database.releaseScopedLeaderTurn({ ...leader, residentStopConfirmed: true });
      expect(released).toMatchObject({ released: true, replay: false });
      expect(database.releaseScopedLeaderTurn({ ...leader, residentStopConfirmed: true }))
        .toMatchObject({ released: false, replay: true, revision: released.revision });
      expect(() => database!.claimScopedLeaderTurn(leader)).toThrow(/cannot resume/);
      expect(database.claimScopedAgentArrival(work)?.execution.status).toBe("running");
      expect(database.claimScopedLeaderTurn({ ...leader, invocationId: "leader-turn-2" }))
        .toBeUndefined();
      expect(database.laneAvailability("project-1"))
        .toContainEqual(expect.objectContaining({ lane: "management", occupied: 0 }));
    } finally {
      database?.close();
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("holds a failed Agent's FIFO while independent work uses its released worker slot, then retries the same branch", async () => {
    const directory = await mkdtemp(join(tmpdir(), "openfars-scoped-failure-retry-"));
    const options = {
      databasePath: join(directory, "collaboration.sqlite"), serviceId: "scoped-failure-retry-test",
      hostId: "host-a", topology: "single-host" as const, instanceId: "instance-a", now: () => 1_000_000
    };
    let database: CollaborationStateDatabase | undefined;
    try {
      database = CollaborationStateDatabase.open(options);
      database.createProject({
        projectId: "project-1", workflowRevision: 1,
        workflowSnapshot: {
          schemaVersion: 3,
          agents: [{ name: "main" }, { name: "worker1" }, { name: "worker2" }],
          collaborations: [{ id: "G" }],
          scopedWorkflow: {
            schemaVersion: 1, rootAgentIds: ["main"], groups: [{
              id: "G", leaderAgentId: "main", allowLeaderReconfiguration: false,
              workflow: {
                nodes: [
                  { kind: "agent", nodeId: "A", agentId: "worker1" },
                  { kind: "agent", nodeId: "B", agentId: "worker2" }
                ],
                input: { source: "input", edges: [
                  { kind: "parallel", target: "A" }, { kind: "parallel", target: "B" }
                ] },
                routes: {
                  A: [{ kind: "strong", target: "finish" }],
                  B: [{ kind: "strong", target: "A" }]
                }
              }
            }]
          }
        },
        git: { enabled: true, status: "ready" }, workerCapacity: 1
      });
      const group = database.activateScopedGroup({
        projectId: "project-1", groupRunId: "run-G", groupId: "G",
        activationRequestId: "activate-G", workflowRevision: 1, baseCommit: "base-G",
        outer: { nodeRunId: "node-G", inputSnapshotRef: "project:input", activatedByAgentId: "main" }
      });
      const [a, b] = group.arrivals;
      const claimA = {
        projectId: "project-1", arrivalRequestId: a!.requestId, agentId: "worker1",
        executionId: "exec-A", worktreePath: sdkFixturePath("/srv/openfars/git-worktrees/agents/worker1")
      };
      const claimB = {
        projectId: "project-1", arrivalRequestId: b!.requestId, agentId: "worker2",
        executionId: "exec-B", worktreePath: sdkFixturePath("/srv/openfars/git-worktrees/agents/worker2")
      };
      expect(database.claimScopedAgentArrival(claimA)?.execution.status).toBe("running");
      expect(database.claimScopedAgentArrival(claimB)).toBeUndefined();
      const failure = {
        projectId: "project-1", arrivalRequestId: a!.requestId,
        executionId: "exec-A", ownershipEpoch: 1, reason: "First model attempt failed"
      };
      expect(() => database!.failScopedAgentArrival({ ...failure, residentStopConfirmed: false as true }))
        .toThrow(/confirmed resident stop/);
      const store = database.operationsForProject("project-1", true);
      const pendingPush = {
        id: "scoped-failed-push-A", kind: "git.push" as const,
        payloadHash: "failed-push-hash-A", status: "prepared" as const,
        ownerExecutionId: "exec-A", ownershipEpoch: 1,
        expectedHead: "a".repeat(40), expectedBase: "executions/exec-A"
      };
      await store.prepare(pendingPush);
      expect(() => database!.failScopedAgentArrival({ ...failure, residentStopConfirmed: true }))
        .toThrow(/resolve uncertain Git operations/);
      const pushFact = { ref: "executions/exec-A", status: "present" };
      await store.transition({
        id: pendingPush.id, payloadHash: pendingPush.payloadHash,
        status: "observed", remoteFact: pushFact
      });
      await store.transition({
        id: pendingPush.id, payloadHash: pendingPush.payloadHash,
        status: "finalized", remoteFact: pushFact
      });
      const failed = database.failScopedAgentArrival({ ...failure, residentStopConfirmed: true });
      expect(failed).toMatchObject({ replay: false, failedOwnershipEpoch: 1 });
      expect(database.failScopedAgentArrival({ ...failure, residentStopConfirmed: true }))
        .toMatchObject({ replay: true, revision: failed.revision });
      expect(() => database!.failScopedAgentArrival({
        ...failure, reason: "Another failure", residentStopConfirmed: true
      })).toThrow(/changed on replay/);
      expect(database.scopedExecution("project-1", "exec-A")?.status).toBe("failed");
      expect(database.scopedArrivals("run-G")[0]?.status).toBe("failed");
      expect(database.scopedGroupReadyForFinalIntegration("project-1", "run-G")).toBe(false);
      expect(database.claimScopedAgentArrival(claimB)?.execution.status).toBe("running");
      const retry = {
        projectId: "project-1", arrivalRequestId: a!.requestId,
        executionId: "exec-A", failedOwnershipEpoch: 1
      };
      expect(database.retryScopedAgentArrival(retry)).toBeUndefined();
      database.completeScopedAgentArrivalAfterMerge({
        projectId: "project-1", arrivalRequestId: b!.requestId,
        executionId: "exec-B", ownershipEpoch: 1,
        ...mergedScopedEvidence("exec-B", "groups/run-G", 32)
      });
      const queuedA = database.scopedArrivals("run-G")
        .find((arrival) => arrival.targetNodeId === "A" && arrival.requestId !== a!.requestId)!;
      const claimA2 = {
        projectId: "project-1", arrivalRequestId: queuedA.requestId, agentId: "worker1",
        executionId: "exec-A2", worktreePath: claimA.worktreePath
      };
      expect(database.claimScopedAgentArrival(claimA2)).toBeUndefined();
      expect(database.scopedGroupReadyForFinalIntegration("project-1", "run-G")).toBe(false);
      database.close();
      database = CollaborationStateDatabase.open(options);
      expect(database.scopedExecution("project-1", "exec-A")?.status).toBe("failed");
      expect(database.scopedArrivals("run-G").find((arrival) => arrival.requestId === queuedA.requestId)?.status)
        .toBe("queued");
      expect(database.claimScopedAgentArrival(claimA2)).toBeUndefined();
      const resumed = database.retryScopedAgentArrival(retry);
      expect(resumed).toMatchObject({ replay: false, execution: {
        id: "exec-A", ownershipEpoch: 2, executionBranch: "executions/exec-A",
        worktreePath: claimA.worktreePath, status: "running"
      } });
      expect(database.retryScopedAgentArrival(retry)).toMatchObject({
        replay: true, revision: resumed!.revision
      });
      expect(() => database!.completeScopedAgentArrivalAfterMerge({
        projectId: "project-1", arrivalRequestId: a!.requestId,
        executionId: "exec-A", ownershipEpoch: 1,
        ...mergedScopedEvidence("exec-A", "groups/run-G", 31)
      })).toThrow();
      expect(database.completeScopedAgentArrivalAfterMerge({
        projectId: "project-1", arrivalRequestId: a!.requestId,
        executionId: "exec-A", ownershipEpoch: 2,
        ...mergedScopedEvidence("exec-A", "groups/run-G", 31, 2)
      }).readyForFinalIntegration).toBe(false);
      expect(database.claimScopedAgentArrival(claimA2)?.execution.status).toBe("running");
      expect(database.completeScopedAgentArrivalAfterMerge({
        projectId: "project-1", arrivalRequestId: queuedA.requestId,
        executionId: "exec-A2", ownershipEpoch: 1,
        ...mergedScopedEvidence("exec-A2", "groups/run-G", 33)
      }).readyForFinalIntegration).toBe(true);
    } finally {
      database?.close();
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("migrates v3 worktree uniqueness and allows a finished Agent to reuse its fixed folder", async () => {
    const directory = await mkdtemp(join(tmpdir(), "openfars-scoped-worktree-migration-"));
    const databasePath = join(directory, "collaboration.sqlite");
    const options = {
      databasePath,
      serviceId: "fixed-worktree-migration-test",
      hostId: "host-a",
      topology: "single-host" as const,
      instanceId: "instance-a",
      now: () => 1_000_000
    };
    let database: CollaborationStateDatabase | undefined;
    try {
      database = CollaborationStateDatabase.open(options);
      database.createProject({
        projectId: "project-1",
        workflowRevision: 1,
        workflowSnapshot: { schemaVersion: 3, agents: [{ name: "main" }, { name: "analyst" }], collaborations: [] },
        git: { enabled: true, status: "ready" },
        workerCapacity: 2
      });
      database.activateNode({
        projectId: "project-1", nodeRunId: "node-before", node: { kind: "agent", nodeId: "analyst", agentId: "analyst" },
        activationRequestId: "activate-before", inputSnapshotRef: "input:before",
        activatedByAgentId: "main", workflowRevision: 1
      });
      const worktreePath = sdkFixturePath("/srv/openfars/git-worktrees/agents/analyst");
      database.startStandaloneExecution({
        projectId: "project-1", nodeRunId: "node-before", taskId: "task-before", executionId: "execution-before",
        agentId: "analyst", assignment: "First task", executionBranch: "executions/execution-before", worktreePath
      });
      const lease = database.writerLease();
      database.close();
      database = undefined;

      // Simulate the pre-v4 permanent uniqueness restriction on an occupied v3 database.
      const old = new DatabaseSync(databasePath);
      legacyWriterFixture(old, lease, options.now());
      old.exec(`
        CREATE UNIQUE INDEX member_executions_v3_permanent_worktree
          ON member_executions(project_id, worktree_path);
        UPDATE collaboration_state_meta SET schema_version = 3 WHERE singleton = 1;
      `);
      old.close();
      expect(() => CollaborationStateDatabase.open({ ...options, instanceId: "another-instance" })).toThrow();

      database = openUpgradedFixture(options);
      expect(database.verifyHealth().schemaVersion).toBe(COLLABORATION_STATE_SCHEMA_VERSION);
      expect(database.projectState("project-1").executions[0]).toMatchObject({
        id: "execution-before", worktreePath
      });
      const inspection = new DatabaseSync(databasePath, { readOnly: true });
      expect(inspection.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
      expect(inspection.prepare(`
        SELECT name FROM sqlite_schema WHERE name = 'member_executions_v3_permanent_worktree'
      `).get()).toBeUndefined();
      expect(inspection.prepare(`
        SELECT sql FROM sqlite_schema WHERE name = 'member_executions_one_active_worktree'
      `).get()).toMatchObject({ sql: expect.stringContaining("'failed'") });
      inspection.close();

      database.observePullRequest({
        projectId: "project-1", executionId: "execution-before", ownershipEpoch: 1,
        pullRequest: {
          id: "pull-before", providerNumber: 1,
          htmlUrl: "https://github.com/example/openfars/pull/1",
          head: "executions/execution-before", base: "main", ownerExecutionId: "execution-before",
          status: "merged", headSha: "a".repeat(40), baseSha: "b".repeat(40),
          mergeCommitSha: "c".repeat(40), observedAt: "2026-09-22T00:00:00.000Z"
        }
      });
      database.completeExecution({
        projectId: "project-1", executionId: "execution-before", ownershipEpoch: 1, output: "First task merged"
      });
      database.completeStandaloneNode({
        projectId: "project-1", nodeRunId: "node-before", executionId: "execution-before", ownershipEpoch: 1,
        output: "First task merged", routeEmissionId: "route-before",
        route: { kind: "fixed", targetNodeId: "finish" }
      });
      database.activateNode({
        projectId: "project-1", nodeRunId: "node-after", node: { kind: "agent", nodeId: "analyst", agentId: "analyst" },
        activationRequestId: "activate-after", inputSnapshotRef: "input:after",
        activatedByAgentId: "main", workflowRevision: 1
      });
      expect(database.startStandaloneExecution({
        projectId: "project-1", nodeRunId: "node-after", taskId: "task-after", executionId: "execution-after",
        agentId: "analyst", assignment: "Second task", executionBranch: "executions/execution-after", worktreePath
      }).execution).toMatchObject({ id: "execution-after", worktreePath });
    } finally {
      database?.close();
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("persists a root and child GroupRun with exactly-once Input fan-out and parent branch ownership", async () => {
    const directory = await mkdtemp(join(tmpdir(), "openfars-scoped-runs-"));
    const databasePath = join(directory, "collaboration.sqlite");
    const options = {
      databasePath,
      serviceId: "scoped-run-test",
      hostId: "host-a",
      topology: "single-host" as const,
      instanceId: "instance-a",
      now: () => 1_000_000
    };
    let database: CollaborationStateDatabase | undefined;
    try {
      database = CollaborationStateDatabase.open(options);
      database.createProject({
        projectId: "project-1",
        workflowRevision: 1,
        workflowSnapshot: {
          schemaVersion: 3,
          agents: [{ name: "main" }, { name: "worker" }, { name: "worker2" }],
          collaborations: [{ id: "G" }, { id: "H" }],
          scopedWorkflow: {
            schemaVersion: 1,
            rootAgentIds: ["main", "worker"],
            groups: [
              {
                id: "G", leaderAgentId: "main", allowLeaderReconfiguration: false,
                workflow: {
                  nodes: [
                    { kind: "agent", nodeId: "G_worker", agentId: "worker" },
                    { kind: "agent", nodeId: "G_worker2", agentId: "worker2" },
                    { kind: "collaboration", nodeId: "G_H", groupId: "H" }
                  ],
                  input: { source: "input", edges: [
                    { kind: "parallel", target: "G_worker" },
                    { kind: "parallel", target: "G_worker2" },
                    { kind: "parallel", target: "G_H" }
                  ] },
                  routes: {
                    G_worker: [{ kind: "strong", target: "finish" }],
                    G_worker2: [{ kind: "strong", target: "finish" }],
                    G_H: [{ kind: "strong", target: "finish" }]
                  }
                }
              },
              {
                id: "H", parentGroupId: "G", leaderAgentId: "main", allowLeaderReconfiguration: false,
                workflow: {
                  nodes: [{ kind: "agent", nodeId: "H_worker", agentId: "worker" }],
                  input: { source: "input", edges: [{ kind: "parallel", target: "H_worker" }] },
                  routes: { H_worker: [{ kind: "strong", target: "finish" }] }
                }
              }
            ]
          }
        },
        git: { enabled: true, status: "ready" },
        workerCapacity: 2
      });
      const rootInput = {
        projectId: "project-1", groupRunId: "run-G", groupId: "G",
        activationRequestId: "activate-G", workflowRevision: 1, baseCommit: "base-G",
        outer: { nodeRunId: "node-G", inputSnapshotRef: "project:input", activatedByAgentId: "main" }
      };
      const root = database.activateScopedGroup(rootInput);
      expect(root.replay).toBe(false);
      expect(root.groupRun.integrationTarget).toBe("main");
      expect(root.arrivals.map((arrival) => arrival.targetNodeId)).toEqual(["G_worker", "G_worker2", "G_H"]);
      expect(root.arrivals.map((arrival) => arrival.sequence)).toEqual([1, 2, 3]);
      expect(database.activateScopedGroup(rootInput)).toMatchObject({ replay: true, revision: root.revision });
      expect(database.projectState("project-1").activeNodeRunId).toBe("node-G");
      expect(() => database!.assertWorkflowRevisionEditable("project-1", ["H"]))
        .toThrow(/locked by active scoped run/);
      expect(() => database!.activateScopedGroup({
        ...rootInput,
        outer: { ...rootInput.outer, nodeRunId: "different-node" }
      })).toThrow(/changed on replay/);
      expect(database.scopedArrivals("run-G")).toHaveLength(3);
      expect(() => database!.activateScopedGroup({ ...rootInput, baseCommit: "different" }))
        .toThrow(/changed on replay/);

      const childArrival = root.arrivals.find((arrival) => arrival.targetNodeId === "G_H")!;
      const childInput = {
        projectId: "project-1", groupRunId: "run-H", groupId: "H",
        parentGroupRunId: "run-G", parentArrivalRequestId: childArrival.requestId,
        activationRequestId: "activate-H", workflowRevision: 1, baseCommit: "base-H"
      };
      expect(() => database!.activateScopedGroup({ ...childInput, parentArrivalRequestId: "wrong" }))
        .toThrow(/queued parent arrival/);
      const child = database.activateScopedGroup(childInput);
      expect(child.groupRun).toMatchObject({
        parentGroupRunId: "run-G", integrationTarget: "groups/run-G", groupBranch: "groups/run-H"
      });
      expect(database.scopedArrivals("run-G").find((arrival) => arrival.requestId === childArrival.requestId)?.status)
        .toBe("running");
      expect(database.activateScopedGroup(childInput)).toMatchObject({ replay: true, revision: child.revision });

      const childTask = child.arrivals[0]!;
      const rootTask = root.arrivals.find((arrival) => arrival.targetNodeId === "G_worker")!;
      const childClaim = {
        projectId: "project-1", arrivalRequestId: childTask.requestId, agentId: "worker",
        executionId: "child-worker-1", worktreePath: sdkFixturePath("/srv/openfars/git-worktrees/agents/worker")
      };
      const rootClaim = {
        projectId: "project-1", arrivalRequestId: rootTask.requestId, agentId: "worker",
        executionId: "root-worker-1", worktreePath: sdkFixturePath("/srv/openfars/git-worktrees/agents/worker")
      };
      expect(() => database!.claimScopedAgentArrival({
        ...rootClaim, worktreePath: sdkFixturePath("/srv/openfars/git-worktrees/agents/another-worker")
      })).toThrow(/fixed worktree path/);
      expect(() => database!.claimScopedAgentArrival({
        ...rootClaim, executionId: "../unsafe"
      })).toThrow(/safe identity/);
      expect(database.claimScopedAgentArrival({
        ...childClaim
      })).toBeUndefined();
      const independentTask = root.arrivals.find((arrival) => arrival.targetNodeId === "G_worker2")!;
      expect(database.claimScopedAgentArrival({
        projectId: "project-1", arrivalRequestId: independentTask.requestId, agentId: "worker2",
        executionId: "root-worker2-1", worktreePath: sdkFixturePath("/srv/openfars/git-worktrees/agents/worker2")
      })?.arrival.status).toBe("running");
      const claimed = database.claimScopedAgentArrival(rootClaim);
      expect(claimed?.arrival).toMatchObject({
        requestId: rootTask.requestId, sequence: rootTask.sequence, status: "running"
      });
      expect(claimed?.execution).toMatchObject({
        id: "root-worker-1", arrivalRequestId: rootTask.requestId,
        executionBranch: "executions/root-worker-1",
        worktreePath: sdkFixturePath("/srv/openfars/git-worktrees/agents/worker"), status: "running"
      });
      expect(database.claimScopedAgentArrival(rootClaim)).toBeUndefined();
      expect(() => database!.claimScopedAgentArrival({ ...rootClaim, executionId: "replacement" }))
        .toThrow(/identity changed on replay/);
      expect(database.claimScopedAgentArrival(childClaim)).toBeUndefined();
      expect(database.scopedArrivals("run-H")[0]?.status).toBe("queued");

      database.close();
      database = CollaborationStateDatabase.open(options);
      expect(database.scopedGroupRun("project-1", "run-H")?.integrationTarget).toBe("groups/run-G");
      expect(database.scopedArrivals("run-H")).toHaveLength(1);
      expect(database.scopedExecution("project-1", "root-worker-1")?.arrivalRequestId).toBe(rootTask.requestId);
      expect(database.claimScopedAgentArrival(childClaim)).toBeUndefined();
      const childFinalProof = mergedGroupEvidence("run-H", "groups/run-G", 20);
      expect(() => database!.completeScopedGroupAfterFinalMerge({
        projectId: "project-1", groupRunId: "run-H", ...childFinalProof
      })).toThrow(/unfinished or failed necessary paths/);
      const rootProof = mergedScopedEvidence("root-worker-1", "groups/run-G", 21);
      database.completeScopedAgentArrivalAfterMerge({
        projectId: "project-1", arrivalRequestId: rootTask.requestId,
        executionId: "root-worker-1", ownershipEpoch: 1, ...rootProof
      });
      expect(database.claimScopedAgentArrival(childClaim)?.execution.status).toBe("running");
      const childWorkerProof = mergedScopedEvidence("child-worker-1", "groups/run-H", 22);
      expect(database.completeScopedAgentArrivalAfterMerge({
        projectId: "project-1", arrivalRequestId: childTask.requestId,
        executionId: "child-worker-1", ownershipEpoch: 1, ...childWorkerProof
      }).readyForFinalIntegration).toBe(true);
      database.beginScopedFinalIntegration({
        projectId: "project-1", groupRunId: "run-H", expectedHeadSha: childFinalProof.pullRequest.headSha
      });
      expect(() => database!.completeScopedGroupAfterFinalMerge({
        projectId: "project-1", groupRunId: "run-H",
        ...childFinalProof, pullRequest: { ...childFinalProof.pullRequest, head: "groups/run-G" }
      })).toThrow(/canonical group branch/);
      expect(() => database!.completeScopedGroupAfterFinalMerge({
        projectId: "project-1", groupRunId: "run-H", ...childFinalProof,
        synchronization: { ...childFinalProof.synchronization, targetBranch: "main" }
      })).toThrow(/exact local synchronization/);
      expect(database.scopedFinalIntegration("project-1", "run-H")?.status).toBe("integrating");
      expect(database.scopedGroupFinalMergeFact("project-1", "run-H")).toBeUndefined();
      const completedChild = database.completeScopedGroupAfterFinalMerge({
        projectId: "project-1", groupRunId: "run-H", ...childFinalProof
      });
      expect(() => database!.completeScopedRootRoute({
        projectId: "project-1", groupRunId: "run-H", nodeRunId: "node-G",
        routeEmissionId: "route-H", route: { kind: "fixed", targetNodeId: "finish" }, output: "Child"
      })).toThrow(/completed scoped root/);
      expect(database.projectState("project-1").activeNodeRunId).toBe("node-G");
      expect(completedChild).toMatchObject({
        replay: false, groupRun: { status: "completed", integrationTarget: "groups/run-G" },
        parentArrival: { requestId: childArrival.requestId, status: "completed" },
        parentRoute: { kind: "finish", sourceRunId: childArrival.requestId },
        parentReadyForFinalIntegration: false
      });
      expect(database.completeScopedGroupAfterFinalMerge({
        projectId: "project-1", groupRunId: "run-H", ...childFinalProof
      })).toMatchObject({ replay: true, revision: completedChild.revision });
      expect(database.scopedGroupReadyForFinalIntegration("project-1", "run-G")).toBe(false);
      expect(() => database!.completeScopedGroupAfterFinalMerge({
        projectId: "project-1", groupRunId: "run-G",
        ...mergedGroupEvidence("run-G", "main", 23)
      })).toThrow(/unfinished or failed necessary paths/);
    } finally {
      database?.close();
      await rm(directory, { recursive: true, force: true });
    }
  });
});
