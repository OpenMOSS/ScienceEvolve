import { COLLABORATION_STATE_SCHEMA_VERSION } from "../../src/core/collaboration-state/contracts.js";
import { execFileSync } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CollaborationStateDatabase } from "../../src/core/collaboration-state/store.js";
import { initializeCollaborationStateSchema } from "../../src/core/collaboration-state/schema.js";
import { CollaborationGitFacade } from "../../src/core/collaboration-git/facade.js";
import { LocalCollaborationGitService } from "../../src/core/collaboration-git/local-git.js";
import { finalizeOperation } from "../../src/core/collaboration-git/operation.js";
import type { GitHubRefFact, GitHubRepositoryFact } from "../../src/core/collaboration-git/contracts.js";
import { executeAgentGitTool, type AgentGitFacts } from "../../src/core/agent-git-tools.js";
import { queryAgentGitOperation } from "../../src/core/agent-git-operation-query.js";
import { agentGitOperationJournal } from "../../src/core/agent-git-operation-journal.js";
import { captureKnownAgentGitResults } from "../../src/core/agent-git-result-observations.js";
import { controlResultReceipts } from "../../src/core/control-result-receipts.js";
import type { AgentNativeSessionBinding } from "../../src/core/collaboration-state/contracts.js";

const roots: string[] = [];
const databases: CollaborationStateDatabase[] = [];
afterEach(async () => {
  for (const db of databases.splice(0)) db.close();
  await Promise.all(roots.splice(0).map(root => fs.rm(root, { recursive: true, force: true })));
});

async function fixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-supersession-")); roots.push(root);
  const projectRoot = path.join(root, "project"); await fs.mkdir(projectRoot);
  let now = Date.parse("2026-10-10T08:00:00.000Z");
  let writer = 0;
  const options = { databasePath: path.join(root, "state.sqlite"), serviceId: "supersession",
    hostId: "test", topology: "single-host" as const, leaseDurationMs: 1_000_000, now: () => now };
  const open = () => {
    if (writer) now += 1_000_001;
    const db = CollaborationStateDatabase.open({ ...options, instanceId: `writer-${++writer}` });
    databases.push(db); return db;
  };
  const db = open();
  const repository: GitHubRepositoryFact = { owner: "team", name: "project", private: true,
    defaultBranch: "main", htmlUrl: "https://github.com/team/project", observedAt: new Date(now).toISOString() };
  db.createProject({ projectId: "project", workflowRevision: 1, workerCapacity: 1,
    git: { enabled: true, status: "ready", repository: { ...repository, localPath: projectRoot } },
    workflowSnapshot: { schemaVersion: 3, agents: [{ name: "main" }, { name: "worker" }], collaborations: [{ id: "G" }],
      scopedWorkflow: { schemaVersion: 1, rootAgentIds: ["main"], groups: [{ id: "G", leaderAgentId: "main",
        allowLeaderReconfiguration: false, workflow: { nodes: [{ kind: "agent", nodeId: "G_worker", agentId: "worker" }],
          input: { source: "input", edges: [{ kind: "parallel", target: "G_worker" }] },
          routes: { G_worker: [{ kind: "strong", target: "finish" }] } } }] } } });
  const group = db.activateScopedGroup({ projectId: "project", groupRunId: "run-G", groupId: "G",
    activationRequestId: "activate-G", workflowRevision: 1, baseCommit: "a".repeat(40),
    outer: { nodeRunId: "node-G", inputSnapshotRef: "input", activatedByAgentId: "main" } });
  const execution = db.claimScopedAgentArrival({ projectId: "project", arrivalRequestId: group.arrivals[0]!.requestId,
    agentId: "worker", executionId: "original", worktreePath: path.join(projectRoot, "git-worktrees", "agents", "worker") })!.execution;
  await fs.mkdir(execution.worktreePath, { recursive: true });
  await fs.writeFile(path.join(execution.worktreePath, "unfinished-memory.txt"), "Keep the original pending work\n");
  const store = db.operationsForProject("project", true);
  const local = new LocalCollaborationGitService({ projectId: "project", projectRoot, operationStore: store });
  const git = (args: string[], input?: string) => execFileSync("git", args, { cwd: projectRoot, input, encoding: "utf8",
    env: { ...process.env, GIT_AUTHOR_NAME: "Fixture", GIT_AUTHOR_EMAIL: "fixture@example.test",
      GIT_COMMITTER_NAME: "Fixture", GIT_COMMITTER_EMAIL: "fixture@example.test" } }).trim();
  git(["init", "--bare", "--initial-branch=main", local.repositoryPath]);
  const tree = git(["--git-dir", local.repositoryPath, "hash-object", "-w", "-t", "tree", "--stdin"], "");
  const commit = (name: string, parent?: string) => git(["--git-dir", local.repositoryPath, "commit-tree", tree,
    "-m", name, ...(parent ? ["-p", parent] : [])]);
  const oldHead = commit("Original work"); const laterHead = commit("Later Agent work", oldHead);
  const unrelatedHead = commit("Unrelated work");
  const binding: AgentNativeSessionBinding = { projectId: "project", agentId: "worker", invocationId: "original-native",
    runtimePath: path.join(projectRoot, "runtime", "original-native"), worktreePath: execution.worktreePath,
    session: { schemaVersion: 1, harnessId: "codex", adapterVersion: "4", generation: 0,
      nativeId: "original-durable-session", durable: true, createdAt: repository.observedAt },
    executionContext: { role: "delivery", nodeRunId: "node-G", groupRunId: group.groupRun.id,
      executionId: execution.id, ownershipEpoch: 1, executionWorktree: execution.worktreePath } };
  db.recordAgentNativeSessionBinding(binding);
  const old = { id: "unknown-original-push", kind: "git.push" as const, status: "prepared" as const,
    payloadHash: "a".repeat(64), ownerExecutionId: execution.id, ownershipEpoch: 1,
    expectedBase: execution.executionBranch, expectedHead: oldHead };
  const journal = agentGitOperationJournal(db, "project");
  journal.recordRequest({ projectId: "project", operationId: old.id, executionId: execution.id, ownershipEpoch: 1,
    executionBranch: execution.executionBranch, integrationTarget: "groups/run-G", repository,
    agentId: "worker", invocationId: binding.invocationId, callId: "original-push-call", requestedAt: repository.observedAt,
    expectedHead: oldHead, action: { tool: "git_push" } });
  await store.prepare(old);
  const original = await store.transition({ id: old.id, payloadHash: old.payloadHash, status: "uncertain",
    remoteFact: { ref: execution.executionBranch, expectedHead: oldHead, reconcileRequired: true } });
  now += 1;
  let remote: GitHubRefFact = { owner: repository.owner, repository: repository.name, ref: execution.executionBranch,
    status: "present", sha: laterHead, observedAt: new Date(now).toISOString() };
  const publication = await store.prepare({ ...old, id: "confirmed-later-push", payloadHash: "b".repeat(64), expectedHead: laterHead });
  await finalizeOperation(store, publication, { ...remote });
  const observeRef = vi.fn(async () => ({ ...remote }));
  const push = vi.spyOn(local, "pushRetainedExecution");
  const facade = new CollaborationGitFacade({ localGit: local, operationStore: store, provider: { observeRef } as never });
  const request = { repository, execution: { ...execution, purpose: "delivery" as const }, ownershipEpoch: 1,
    operationId: old.id, invocationId: binding.invocationId };
  const query = (database = db) => queryAgentGitOperation({ projectId: "project", repository, execution: request.execution,
    base: "groups/run-G", operationId: old.id, recordedOperation: id => database.recordedGitOperation("project", id),
    recordedRequest: agentGitOperationJournal(database, "project").recordedRequest });
  const sql = (query: string, ...params: Array<string | number>) => {
    const raw = new DatabaseSync(options.databasePath); try { raw.prepare(query).run(...params); } finally { raw.close(); }
  };
  return { root, projectRoot, db, open, options, store, local, facade, request, original, oldHead, laterHead, unrelatedHead,
    publication, observeRef, push, binding, query, sql, setRemote: (value: Partial<GitHubRefFact>) => { remote = { ...remote, ...value }; } };
}

describe("Agent-selected unknown push inclusion reconciliation", () => {
  it("records a non-success terminal proof from real Git ancestry and retains work, report and FIFO facts", async () => {
    const f = await fixture(); const before = f.db.projectState("project");
    const facts: AgentGitFacts = { pushedHeadSha: f.laterHead };
    const result = await executeAgentGitTool({ git: f.facade, repository: f.request.repository, execution: f.request.execution,
      base: "groups/run-G", facts, envelope: { projectId: "project", agent: "worker", invocationId: f.binding.invocationId,
        stateVersion: 1, callId: "explicit-reconcile", receivedAt: f.binding.session.createdAt,
        action: { tool: "git_reconcile_push", operationId: f.original.id } } });
    expect(result).toMatchObject({ status: "superseded", operation: { ...f.original, status: "superseded",
      remoteFact: { kind: "included_in_later_publication", originalHead: f.oldHead, originalStatus: "uncertain",
        originalRemoteFact: f.original.remoteFact, publicationOperationId: f.publication.id, remote: { sha: f.laterHead } } } });
    expect(f.query().status).toBe("superseded"); expect(facts).toEqual({ pushedHeadSha: f.laterHead });
    expect(f.db.scopedExecutionHasUnsettledGitOperation("project", f.request.execution.id, 1)).toBe(false);
    const after = f.db.projectState("project");
    for (const key of ["scopedExecutions", "scopedArrivals", "scopedGroupRuns", "workflowRevision"] as const)
      expect(after[key]).toEqual(before[key]);
    expect(f.db.eventsAfter("project").filter(e => e.type === "scoped.operation.uncertain")).toHaveLength(1);
    expect(await fs.readFile(path.join(f.request.execution.worktreePath, "unfinished-memory.txt"), "utf8"))
      .toBe("Keep the original pending work\n");
    expect(f.push).not.toHaveBeenCalled(); expect(f.observeRef).toHaveBeenCalledTimes(2);
    expect(await f.facade.reconcilePushOperation({ ...f.request, retry: true })).toEqual({
      status: "superseded", operation: f.db.recordedGitOperation("project", f.original.id) });
    expect(f.observeRef).toHaveBeenCalledTimes(2); expect(f.push).not.toHaveBeenCalled();
    const checkpoint = vi.spyOn(f.local, "checkpointExecution");
    await expect(f.facade.checkpointAndPush({ ...f.request, checkpointKind: "checkpoint" })).rejects.toThrow("cannot checkpoint");
    expect(checkpoint).not.toHaveBeenCalled(); expect(f.push).not.toHaveBeenCalled();
    await expect(f.store.transition({ id: f.original.id, payloadHash: f.original.payloadHash, status: "finalized" })).rejects.toThrow("Illegal");
  });

  it.each(["no_publication", "unconfirmed_publication", "different_epoch", "different_ref", "different_owner",
    "different_repository", "older_publication", "fork", "missing_remote", "missing_object", "changed_remote",
    "changed_owner", "changed_payload", "pause", "cancel", "stale_observation", "no_invocation", "historical"] as const)("retains unknown evidence for %s", async mode => {
    const f = await fixture();
    if (mode === "no_publication") f.sql("DELETE FROM scoped_operations WHERE operation_id = ?", f.publication.id);
    if (mode === "unconfirmed_publication") f.sql("UPDATE scoped_operations SET status = 'uncertain' WHERE operation_id = ?", f.publication.id);
    if (mode === "different_epoch") f.sql("UPDATE scoped_operations SET ownership_epoch = 2 WHERE operation_id = ?", f.publication.id);
    if (mode === "different_ref") f.sql("UPDATE scoped_operations SET expected_base = 'executions/other' WHERE operation_id = ?", f.publication.id);
    if (mode === "different_owner") f.request.execution.id = "other";
    if (mode === "different_repository") f.setRemote({ repository: "other" });
    if (mode === "stale_observation") f.setRemote({ observedAt: "2026-10-09T00:00:00.000Z" });
    if (mode === "no_invocation") f.request.invocationId = "";
    if (mode === "historical") {
      await expect(f.facade.reconcilePushOperation({ ...f.request, historical: true })).rejects.toThrow();
      expect(f.db.recordedGitOperation("project", f.original.id)).toEqual(f.original); return;
    }
    if (mode === "older_publication") f.sql("UPDATE scoped_operations SET rowid = 0 WHERE operation_id = ?", f.publication.id);
    if (mode === "missing_remote") f.setRemote({ status: "missing", sha: undefined });
    if (mode === "fork" || mode === "missing_object") {
      const sha = mode === "fork" ? f.unrelatedHead : "d".repeat(40);
      f.setRemote({ sha });
      f.sql("UPDATE scoped_operations SET expected_head = ?, remote_fact_json = json_set(remote_fact_json, '$.sha', ?) WHERE operation_id = ?",
        sha, sha, f.publication.id);
    }
    if (["changed_remote", "changed_owner", "changed_payload", "pause", "cancel"].includes(mode)) {
      let calls = 0;
      f.observeRef.mockImplementation(async () => {
        calls++;
        if (calls === 2) {
          if (mode === "changed_remote") f.setRemote({ sha: f.unrelatedHead });
          if (mode === "changed_owner") f.sql("UPDATE scoped_executions SET ownership_epoch = 2 WHERE execution_id = ?", f.request.execution.id);
          if (mode === "changed_payload") f.sql("UPDATE scoped_operations SET payload_hash = 'changed' WHERE operation_id = ?", f.original.id);
          if (mode === "pause") f.sql("UPDATE project_heads SET frozen = 1 WHERE project_id = 'project'");
          if (mode === "cancel") f.db.appendEvent({ projectId: "project", type: "project.cancellation.requested",
            payload: { requestId: "cancel-during-observation" } });
        }
        return { owner: "team", repository: "project", ref: f.request.execution.executionBranch,
          status: "present", sha: mode === "changed_remote" && calls === 2 ? f.unrelatedHead : f.laterHead,
          observedAt: f.request.repository.observedAt };
      });
    }
    const throws = ["different_owner", "different_repository", "missing_object", "changed_remote", "changed_owner", "changed_payload", "pause", "cancel", "stale_observation"].includes(mode);
    if (throws) await expect(f.facade.reconcilePushOperation(f.request)).rejects.toThrow();
    else expect(await f.facade.reconcilePushOperation(f.request)).toMatchObject({ status: "unconfirmed" });
    expect(f.db.recordedGitOperation("project", f.original.id)?.status).toBe("uncertain");
    expect(f.db.eventsAfter("project").some(e => e.type.endsWith("operation.superseded"))).toBe(false);
    expect(f.push).not.toHaveBeenCalled();
  });

  it("serializes duplicate calls and preserves inclusion proof and pending native notification over writer restart", async () => {
    const f = await fixture();
    const context = { projectId: "project", agentId: "worker", invocationId: f.binding.invocationId,
      session: f.binding.session, executionContext: f.binding.executionContext };
    const receipts = controlResultReceipts(f.db, context);
    receipts.record({ requestedCallId: "original-push-call", envelope: { projectId: "project", agent: "worker",
      invocationId: context.invocationId, stateVersion: 1, callId: "original-push-call", receivedAt: f.binding.session.createdAt,
      action: { tool: "git_push" } }, result: { status: "push_unconfirmed" } });
    const results = await Promise.all([f.facade.reconcilePushOperation(f.request), f.facade.reconcilePushOperation(f.request)]);
    expect(results[0].operation).toEqual(results[1].operation);
    expect(f.db.eventsAfter("project").filter(e => e.type === "scoped.operation.superseded")).toHaveLength(1);
    await captureKnownAgentGitResults(f.db, "project"); await captureKnownAgentGitResults(f.db, "project");
    expect(f.db.eventsAfter("project").filter(e => e.type === "control.result.recorded" && e.payload.receipt &&
      (e.payload.receipt as { origin?: { status: string } }).origin?.status === "superseded")).toHaveLength(1);
    const proof = f.db.recordedGitOperation("project", f.original.id);
    f.db.close(); const reopened = f.open();
    expect(reopened.recordedGitOperation("project", f.original.id)).toEqual(proof);
    expect(f.query(reopened).status).toBe("superseded");
    const next = { ...context, invocationId: "next-worker-turn" };
    const delivery = controlResultReceipts(reopened, next);
    const text = delivery.prepareNotification("next-input");
    expect(text).toContain('"status":"superseded"'); expect(text).toContain('"originalStatus":"uncertain"');
    expect(reopened.eventsAfter("project").filter(e => e.type === "control.result.received")).toHaveLength(0);
    delivery.observeNative({ invocationId: next.invocationId, harnessId: "codex", eventId: "real-native-input",
      sourceType: "item.completed", kind: "user.message", message: text });
    expect(controlResultReceipts(reopened, { ...next, invocationId: "later-turn" }).prepareNotification("later-input")).toBe("");
  });

  it("upgrades v18 legacy and scoped constraints without reinterpreting any original journal or event", async () => {
    const f = await fixture(); f.db.close();
    const raw = new DatabaseSync(f.options.databasePath);
    raw.exec("PRAGMA foreign_keys = ON");
    raw.exec("INSERT INTO operations(operation_id, project_id, kind, payload_hash, status, created_at, updated_at) VALUES ('legacy-unknown','project','git.push','legacy','uncertain','old','old')");
    const original = raw.prepare("SELECT * FROM scoped_operations ORDER BY operation_id").all();
    const events = raw.prepare("SELECT * FROM project_events ORDER BY seq").all();
    for (const table of ["operations", "scoped_operations"]) {
      const sql = (raw.prepare("SELECT sql FROM sqlite_master WHERE name = ?").get(table) as { sql: string }).sql;
      raw.exec(sql.replace(new RegExp(`CREATE TABLE [\"]?${table}[\"]?`), `CREATE TABLE ${table}_v18`)
        .replace(" OR (status = 'superseded' AND kind = 'git.push')", ""));
      raw.exec(`INSERT INTO ${table}_v18 SELECT * FROM ${table} ORDER BY rowid`);
      raw.exec(`DROP TABLE ${table}`); raw.exec(`ALTER TABLE ${table}_v18 RENAME TO ${table}`);
    }
    raw.exec("UPDATE collaboration_state_meta SET schema_version = 18"); raw.close();
    const reopened = f.open();
    expect(reopened.recordedGitOperation("project", f.original.id)).toEqual(f.original);
    const inspect = new DatabaseSync(f.options.databasePath);
    expect(inspect.prepare("SELECT schema_version FROM collaboration_state_meta").get()).toEqual({ schema_version: COLLABORATION_STATE_SCHEMA_VERSION });
    expect(inspect.prepare("SELECT * FROM scoped_operations ORDER BY operation_id").all()).toEqual(original);
    expect(inspect.prepare("SELECT * FROM project_events ORDER BY seq").all()).toEqual(events);
    expect(inspect.prepare("SELECT status FROM operations WHERE operation_id = 'legacy-unknown'").get()).toEqual({ status: "uncertain" });
    expect(inspect.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
    expect(() => inspect.exec("UPDATE operations SET status = 'superseded', kind = 'pull.merge' WHERE operation_id = 'legacy-unknown'"))
      .toThrow(/CHECK constraint/);
    inspect.close();
    await expect(reopened.operationsForProject("project", true).transition({ id: f.original.id,
      payloadHash: f.original.payloadHash, status: "superseded" })).rejects.toThrow("Illegal");
    // DDL cannot be applied using an absent/foreign writer lease.
    const denied = new DatabaseSync(":memory:"); initializeCollaborationStateSchema(denied);
    denied.exec("UPDATE collaboration_state_meta SET schema_version = 18");
    expect(() => initializeCollaborationStateSchema(denied)).toThrow(/lease/); denied.close();
  });
});
