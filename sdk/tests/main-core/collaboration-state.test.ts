import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import type { ProjectGitState, PullRequestRecord } from "../../src/core/types.js";
import { initializeCollaborationStateSchema } from "../../src/core/collaboration-state/schema.js";
import {
  CollaborationStateDatabase,
  CollaborationStateError,
  COLLABORATION_STATE_SCHEMA_VERSION,
  type ActivateGroupInput,
  type CollaborationStateOpenOptions
} from "../../src/core/collaboration-state/index.js";

const temporaryRoots: string[] = [];
const openDatabases: CollaborationStateDatabase[] = [];
const require = createRequire(import.meta.url);
const tsxCliPath = require.resolve("tsx/cli");
const concurrentWorkerPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "fixtures",
  "collaboration-concurrent-worker.ts"
);

interface Clock {
  value: number;
}

async function waitForMarker(markerPath: string, timeoutMs = 10_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      await fs.access(markerPath);
      return;
    } catch {
      await new Promise<void>((resolve) => setTimeout(resolve, 10));
    }
  }
  throw new Error(`Timed out waiting for concurrent test marker ${markerPath}`);
}

async function markerExists(markerPath: string): Promise<boolean> {
  try {
    await fs.access(markerPath);
    return true;
  } catch {
    return false;
  }
}

function launchConcurrentWorker(configPath: string): Promise<void> {
  const child = spawn(process.execPath, [tsxCliPath, concurrentWorkerPath, configPath], {
    cwd: path.dirname(concurrentWorkerPath),
    stdio: ["ignore", "pipe", "pipe"]
  });
  let stdout = "";
  let stderr = "";
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => { stdout += String(chunk); });
  child.stderr.on("data", (chunk) => { stderr += String(chunk); });
  return new Promise<void>((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(
        `Concurrent worker exited with code ${String(code)} signal ${String(signal)}\n${stdout}\n${stderr}`
      ));
    });
  });
}

const READY_GIT: ProjectGitState = {
  enabled: true,
  status: "ready",
  provider: "github",
  repository: {
    owner: "research-team",
    name: "collaboration-fixture",
    htmlUrl: "https://github.com/research-team/collaboration-fixture",
    private: true,
    defaultBranch: "main",
    localPath: "/srv/openfars/collaboration-fixture"
  }
};

afterEach(async () => {
  for (const database of openDatabases.splice(0)) database.close();
  await Promise.all(
    temporaryRoots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true }))
  );
});

async function stateFixture(input: {
  clock?: Clock;
  serviceId?: string;
  instanceId?: string;
  hostId?: string;
  databasePath?: string;
  writerLease?: CollaborationStateOpenOptions["writerLease"];
} = {}): Promise<{
  root: string;
  databasePath: string;
  clock: Clock;
  database: CollaborationStateDatabase;
}> {
  const root = input.databasePath
    ? path.dirname(input.databasePath)
    : await fs.mkdtemp(path.join(os.tmpdir(), "openfars-collaboration-state-"));
  if (!input.databasePath) temporaryRoots.push(root);
  const databasePath = input.databasePath ?? path.join(root, "collaboration.sqlite");
  const clock = input.clock ?? { value: Date.parse("2026-09-22T00:00:00.000Z") };
  const database = CollaborationStateDatabase.open({
    databasePath,
    serviceId: input.serviceId ?? "collaboration-service",
    instanceId: input.instanceId ?? "instance-a",
    hostId: input.hostId ?? "host-a",
    topology: "single-host",
    leaseDurationMs: 1_000,
    now: () => clock.value,
    ...(input.writerLease ? { writerLease: input.writerLease } : {})
  });
  openDatabases.push(database);
  return { root, databasePath, clock, database };
}

function downgradeCollaborationSchemaToV1(databasePath: string): void {
  const legacy = new DatabaseSync(databasePath);
  legacy.exec("PRAGMA foreign_keys=OFF");
  legacy.exec("PRAGMA legacy_alter_table=ON");
  try {
    legacy.exec(`
      BEGIN IMMEDIATE;
      DROP TRIGGER IF EXISTS legacy_v1_direct_main_markers_no_update;
      DROP TRIGGER IF EXISTS legacy_v1_direct_main_markers_no_delete;
      DROP TABLE IF EXISTS legacy_v1_direct_main_markers;
      DROP INDEX IF EXISTS member_executions_one_active_per_group_member;
      DROP INDEX IF EXISTS member_executions_one_active_per_normal_member;
      DROP INDEX IF EXISTS member_executions_one_active_branch;
      ALTER TABLE member_executions RENAME TO member_executions_schema_v2;

      CREATE TABLE member_executions (
        execution_id TEXT PRIMARY KEY CHECK (length(execution_id) > 0),
        project_id TEXT NOT NULL,
        node_run_id TEXT NOT NULL,
        group_run_id TEXT,
        task_id TEXT NOT NULL,
        agent_id TEXT NOT NULL CHECK (length(agent_id) > 0),
        purpose TEXT NOT NULL CHECK (purpose IN ('delivery', 'final-integration')),
        ownership_epoch INTEGER NOT NULL CHECK (ownership_epoch >= 1),
        status TEXT NOT NULL CHECK (status IN (
          'queued','working','waiting_authorization','waiting_review','pr_open',
          'resolving','merged','stop_requested','stopped','superseded',
          'succeeded','failed','cancelled'
        )),
        execution_branch TEXT NOT NULL CHECK (length(execution_branch) > 0),
        worktree_path TEXT NOT NULL CHECK (length(worktree_path) > 0),
        pull_request_id TEXT,
        invocation_id TEXT,
        session_id TEXT,
        predecessor_execution_id TEXT,
        successor_execution_id TEXT,
        process_stop_confirmed INTEGER NOT NULL DEFAULT 0 CHECK (process_stop_confirmed IN (0, 1)),
        failure_reason TEXT,
        wait_reason TEXT,
        output TEXT,
        queued_at TEXT NOT NULL,
        started_at TEXT,
        updated_at TEXT NOT NULL,
        completed_at TEXT,
        UNIQUE (task_id, ownership_epoch),
        UNIQUE (project_id, execution_branch),
        UNIQUE (project_id, worktree_path),
        FOREIGN KEY (project_id) REFERENCES project_heads(project_id) ON DELETE RESTRICT,
        FOREIGN KEY (node_run_id) REFERENCES node_runs(node_run_id) ON DELETE RESTRICT,
        FOREIGN KEY (group_run_id) REFERENCES group_runs(group_run_id) ON DELETE RESTRICT,
        FOREIGN KEY (task_id) REFERENCES work_tasks(task_id) ON DELETE RESTRICT,
        FOREIGN KEY (pull_request_id)
          REFERENCES pull_requests(pull_request_id) DEFERRABLE INITIALLY DEFERRED,
        FOREIGN KEY (predecessor_execution_id) REFERENCES member_executions(execution_id) ON DELETE RESTRICT,
        FOREIGN KEY (successor_execution_id) REFERENCES member_executions(execution_id) ON DELETE RESTRICT
      ) STRICT;

      INSERT INTO member_executions(
        execution_id, project_id, node_run_id, group_run_id, task_id, agent_id,
        purpose, ownership_epoch, status, execution_branch, worktree_path,
        pull_request_id, invocation_id, session_id, predecessor_execution_id,
        successor_execution_id, process_stop_confirmed, failure_reason,
        wait_reason, output, queued_at, started_at, updated_at, completed_at
      )
      SELECT
        execution_id, project_id, node_run_id, group_run_id, task_id, agent_id,
        purpose, ownership_epoch, status, execution_branch, worktree_path,
        pull_request_id, invocation_id, session_id, predecessor_execution_id,
        successor_execution_id, process_stop_confirmed, failure_reason,
        wait_reason, output, queued_at, started_at, updated_at, completed_at
      FROM member_executions_schema_v2;
      DROP TABLE member_executions_schema_v2;

      CREATE UNIQUE INDEX member_executions_one_active_per_group_member
        ON member_executions(group_run_id, agent_id)
        WHERE group_run_id IS NOT NULL AND status IN (
          'queued','working','waiting_authorization','waiting_review',
          'pr_open','resolving','merged','stop_requested'
        );
      CREATE UNIQUE INDEX member_executions_one_active_per_normal_member
        ON member_executions(node_run_id, agent_id)
        WHERE group_run_id IS NULL AND status IN (
          'queued','working','waiting_authorization','waiting_review',
          'pr_open','resolving','merged','stop_requested'
        );
      UPDATE collaboration_state_meta SET schema_version = 1 WHERE singleton = 1;
      COMMIT;
    `);
  } finally {
    legacy.exec("PRAGMA legacy_alter_table=OFF");
    legacy.exec("PRAGMA foreign_keys=ON");
  }
  try {
    if (legacy.prepare("PRAGMA foreign_key_check").all().length > 0) {
      throw new Error("fixture v1 schema contains invalid foreign keys");
    }
  } finally {
    legacy.close();
  }
}

function createProject(
  database: CollaborationStateDatabase,
  input: {
    projectId?: string;
    workerCapacity?: number;
    managementCapacity?: number;
    recoveryLimit?: number;
    git?: ProjectGitState;
    workflowSnapshot?: unknown;
  } = {}
): void {
  database.createProject({
    projectId: input.projectId ?? "project-1",
    workflowRevision: 1,
    workflowSnapshot: input.workflowSnapshot ?? {
      schemaVersion: 2,
      collaborations: [{ id: "group-node", memberAgentIds: ["alice", "bob"] }]
    },
    git: input.git ?? READY_GIT,
    workerCapacity: input.workerCapacity ?? 2,
    managementCapacity: input.managementCapacity ?? 1,
    recoveryLimit: input.recoveryLimit ?? 2,
    requestId: `create:${input.projectId ?? "project-1"}`
  });
}

function workflowSnapshot(input: {
  agents: Array<string | { name: string; description?: string }>;
  collaborations?: Array<{
    id: string;
    displayName: string;
    memberAgentIds: string[];
  }>;
}) {
  const agents = input.agents.map((agent) => typeof agent === "string"
    ? { name: agent }
    : agent);
  return {
    schemaVersion: 2,
    agents,
    collaborations: (input.collaborations ?? []).map((group) => ({
      ...group,
      renamePolicy: "editable" as const
    })),
    input: { source: "input", target: "main" },
    routes: Object.fromEntries(agents.map((agent) => [agent.name, []])),
    decisionPlans: Object.fromEntries(agents.map((agent) => [agent.name, "Continue safely"])),
    allowUserIntervention: true,
    termination: {
      agent: "main",
      condition: "Main confirms completion",
      decisionBy: "main",
      automatic: false
    }
  };
}

function groupActivation(
  input: Partial<ActivateGroupInput> = {}
): ActivateGroupInput {
  return {
    projectId: "project-1",
    nodeRunId: "node-run-1",
    groupRunId: "group-run-1",
    nodeId: "group-node",
    groupId: "group-node",
    activationRequestId: "activate-group-1",
    inputSnapshotRef: "snapshot:project-1:1",
    memberAgentIds: ["alice", "bob"],
    origin: {
      kind: "agent-route",
      sourceAgentId: "leader",
      route: "strong"
    },
    baseCommit: "a".repeat(40),
    groupBranch: "groups/group-run-1",
    workflowRevision: 1,
    ...input
  };
}

function seedGroup(
  database: CollaborationStateDatabase,
  input: {
    tasks?: Array<{
      id: string;
      assignment: string;
      assigneeAgentId?: string;
      dependencyTaskIds?: string[];
    }>;
    origin?: ActivateGroupInput["origin"];
    recoveryLimit?: number;
  } = {}
): void {
  createProject(database, { recoveryLimit: input.recoveryLimit });
  const origin = input.origin ?? groupActivation().origin;
  const activation = database.activateGroup(groupActivation({ origin }));
  if (input.tasks) {
    database.assignTasks({
      projectId: "project-1",
      groupRunId: "group-run-1",
      actorAgentId: activation.groupRun.leaderAgentId,
      coordinatorEpoch: 1,
      tasks: input.tasks
    });
  }
}

function claim(
  database: CollaborationStateDatabase,
  agentId: string,
  executionId: string
) {
  return database.claimNextTask({
    projectId: "project-1",
    groupRunId: "group-run-1",
    agentId,
    executionId,
    executionBranch: `executions/${executionId}`,
    worktreePath: `/srv/openfars/git-worktrees/${executionId}`,
    invocationId: `invocation-${executionId}`,
    sessionId: `session-${executionId}`
  });
}

function padProjectEventsPastLegacyWindow(
  databasePath: string,
  projectId: string,
  count = 100_001
): void {
  const raw = new DatabaseSync(databasePath);
  raw.exec("PRAGMA busy_timeout=5000");
  try {
    raw.exec("BEGIN IMMEDIATE");
    const head = raw.prepare(`
      SELECT next_event_seq FROM project_heads WHERE project_id = ?
    `).get(projectId) as { next_event_seq: number } | undefined;
    if (!head) throw new Error(`Missing project head ${projectId}`);
    const firstSeq = Number(head.next_event_seq);
    raw.prepare(`
      WITH RECURSIVE padding(offset) AS (
        VALUES(0)
        UNION ALL
        SELECT offset + 1 FROM padding WHERE offset + 1 < ?
      )
      INSERT INTO project_events(
        project_id, seq, event_id, workflow_revision, occurred_at,
        event_type, payload_json
      )
      SELECT ?, ? + offset, 'evt_exact_padding_' || (? + offset), 1,
        '2026-09-22T00:00:00.000Z', 'fixture.exact_query_padding', '{}'
      FROM padding
    `).run(count, projectId, firstSeq, firstSeq);
    raw.prepare(`
      UPDATE project_heads SET next_event_seq = ? WHERE project_id = ?
    `).run(firstSeq + count, projectId);
    raw.exec("COMMIT");
  } catch (error) {
    try {
      raw.exec("ROLLBACK");
    } catch {
      // Preserve the original fixture failure.
    }
    throw error;
  } finally {
    raw.close();
  }
}

function pullRequest(input: {
  id: string;
  number: number;
  executionId: string;
  head: string;
  base: string;
  status: PullRequestRecord["status"];
  mergeCommitSha?: string;
}): PullRequestRecord {
  return {
    id: input.id,
    providerNumber: input.number,
    htmlUrl: `https://github.com/research-team/collaboration-fixture/pull/${input.number}`,
    head: input.head,
    base: input.base,
    ownerExecutionId: input.executionId,
    status: input.status,
    headSha: `${input.number}`.repeat(40).slice(0, 40),
    baseSha: "b".repeat(40),
    mergeable: input.status !== "conflicted",
    ...(input.mergeCommitSha ? { mergeCommitSha: input.mergeCommitSha } : {}),
    observedAt: `2026-09-22T00:00:${String(input.number).padStart(2, "0")}.000Z`
  };
}

function localMergeSynchronization(input: {
  executionId: string;
  ownershipEpoch: number;
  targetBranch: string;
  expectedSourceHead: string;
  mergeCommitSha: string;
}) {
  const epochIdentity = input.ownershipEpoch === 1
    ? input.executionId
    : `${input.executionId}-epoch-${input.ownershipEpoch}`;
  const factHash = createHash("sha256").update([
    input.expectedSourceHead,
    input.targetBranch,
    input.mergeCommitSha
  ].join("\0")).digest("hex").slice(0, 24);
  const operationId = `reconcile-merged-${epochIdentity}-${factHash}`;
  return {
    operationId,
    targetBranch: input.targetBranch,
    expectedSourceHead: input.expectedSourceHead,
    mergeCommitSha: input.mergeCommitSha,
    remoteHead: input.mergeCommitSha,
    localHeadAfter: input.mergeCommitSha,
    status: "synchronized" as const
  };
}

function recordLocalMergeSynchronization(
  database: CollaborationStateDatabase,
  input: {
    executionId: string;
    ownershipEpoch: number;
    providerNumber: number;
    targetBranch: string;
    expectedSourceHead: string;
    mergeCommitSha: string;
  }
) {
  const evidence = localMergeSynchronization(input);
  database.recordMergedSynchronization({
    projectId: "project-1",
    executionId: input.executionId,
    ownershipEpoch: input.ownershipEpoch,
    providerNumber: input.providerNumber,
    expectedHead: input.expectedSourceHead,
    expectedBase: input.targetBranch,
    expectedMergeCommitSha: input.mergeCommitSha,
    synchronization: {
      projectId: "project-1",
      ...evidence,
      targetBranch: input.targetBranch as "main" | `groups/${string}`,
      temporaryRef: `refs/openfars/reconcile/${input.executionId}`,
      localHeadBefore: "0".repeat(40),
      observedAt: "2026-09-22T00:00:00.000Z"
    }
  });
  return evidence;
}

function expectStateError(
  action: () => unknown,
  code: CollaborationStateError["code"]
): CollaborationStateError {
  try {
    action();
  } catch (error) {
    expect(error).toBeInstanceOf(CollaborationStateError);
    expect((error as CollaborationStateError).code).toBe(code);
    return error as CollaborationStateError;
  }
  throw new Error(`Expected CollaborationStateError ${code}`);
}

describe("Collaboration workflow revision lifecycle", () => {
  it("locks an active group, unlocks only after final PR merge, and preserves run snapshots", async () => {
    const { database } = await stateFixture();
    seedGroup(database, {
      tasks: [
        { id: "task-alice", assignment: "Alice delivery", assigneeAgentId: "alice" }
      ]
    });
    expectStateError(
      () => database.assertWorkflowRevisionEditable("project-1", ["group-node"]),
      "WORKFLOW_EDIT_LOCKED"
    );
    expectStateError(
      () => database.saveWorkflowRevision({
        projectId: "project-1",
        workflowRevision: 2,
        snapshot: { schemaVersion: 2, collaborations: [] },
        affectedGroupIds: ["group-node"],
        requestId: "edit-while-active"
      }),
      "WORKFLOW_EDIT_LOCKED"
    );
    expect(database.projectState("project-1").workflowRevision).toBe(1);

    claim(database, "alice", "execution-alice");
    database.claimManagementLane({
      projectId: "project-1",
      groupRunId: "group-run-1",
      agentId: "leader",
      coordinatorEpoch: 1
    });
    database.observePullRequest({
      projectId: "project-1",
      executionId: "execution-alice",
      ownershipEpoch: 1,
      pullRequest: pullRequest({
        id: "pull-alice",
        number: 1,
        executionId: "execution-alice",
        head: "executions/execution-alice",
        base: "groups/group-run-1",
        status: "merged",
        mergeCommitSha: "a".repeat(40)
      })
    });
    database.completeExecution({
      projectId: "project-1",
      executionId: "execution-alice",
      ownershipEpoch: 1,
      output: "Alice completed"
    });
    database.startFinalIntegration({
      projectId: "project-1",
      groupRunId: "group-run-1",
      actorAgentId: "leader",
      coordinatorEpoch: 1,
      ownerAgentId: "alice",
      taskId: "task-final",
      executionId: "execution-final",
      assignment: "Integrate delivery",
      executionBranch: "groups/group-run-1",
      worktreePath: "/srv/openfars/git-worktrees/execution-final"
    });
    const openFinalPull = pullRequest({
      id: "pull-final",
      number: 2,
      executionId: "execution-final",
      head: "groups/group-run-1",
      base: "main",
      status: "open"
    });
    database.observePullRequest({
      projectId: "project-1",
      executionId: "execution-final",
      ownershipEpoch: 1,
      pullRequest: openFinalPull
    });
    expectStateError(
      () => database.assertWorkflowRevisionEditable("project-1", ["group-node"]),
      "WORKFLOW_EDIT_LOCKED"
    );
    database.observePullRequest({
      projectId: "project-1",
      executionId: "execution-final",
      ownershipEpoch: 1,
      pullRequest: {
        ...openFinalPull,
        status: "merged",
        mergeCommitSha: "f".repeat(40),
        observedAt: "2026-09-22T00:00:03.000Z"
      }
    });
    database.completeExecution({
      projectId: "project-1",
      executionId: "execution-final",
      ownershipEpoch: 1,
      output: "Final integration merged"
    });
    database.decideGroupCompletion({
      projectId: "project-1",
      groupRunId: "group-run-1",
      actorAgentId: "leader",
      coordinatorEpoch: 1,
      output: "Group complete"
    });
    database.completeGroup({
      projectId: "project-1",
      groupRunId: "group-run-1",
      nodeRunId: "node-run-1",
      coordinatorEpoch: 1,
      routeEmissionId: "route-after-group",
      route: { kind: "fixed", targetNodeId: "next-node" }
    });

    expect(() =>
      database.assertWorkflowRevisionEditable("project-1", ["group-node"])
    ).not.toThrow();
    const revisionOneSnapshot = database.workflowSnapshot("project-1", 1);
    const revisionTwoSnapshot = {
      schemaVersion: 2,
      collaborations: [
        { id: "group-node", memberAgentIds: ["alice", "bob"], displayName: "Renamed group" }
      ]
    };
    const saved = database.saveWorkflowRevision({
      projectId: "project-1",
      workflowRevision: 2,
      snapshot: revisionTwoSnapshot,
      affectedGroupIds: ["group-node"],
      requestId: "terminal-group-edit",
      requestContext: { kind: "collaboration.rename", subjectId: "group-node" }
    });
    expect(saved).toMatchObject({ workflowRevision: 2, replay: false });
    expect(database.eventByRequestId("project-1", "terminal-group-edit")).toMatchObject({
      type: "workflow.revision.created",
      payload: {
        affectedGroupIds: ["group-node"],
        requestKind: "collaboration.rename",
        requestSubjectId: "group-node"
      }
    });
    expect(database.saveWorkflowRevision({
      projectId: "project-1",
      workflowRevision: 2,
      snapshot: revisionTwoSnapshot,
      affectedGroupIds: ["group-node"],
      requestId: "terminal-group-edit",
      requestContext: { kind: "collaboration.rename", subjectId: "group-node" }
    })).toMatchObject({ workflowRevision: 2, replay: true, revision: saved.revision });
    expectStateError(
      () => database.saveWorkflowRevision({
        projectId: "project-1",
        workflowRevision: 3,
        snapshot: {
          ...revisionTwoSnapshot,
          collaborations: [{
            ...revisionTwoSnapshot.collaborations[0],
            displayName: "Conflicting replay"
          }]
        },
        affectedGroupIds: ["group-node"],
        requestId: "terminal-group-edit"
      }),
      "IDEMPOTENCY_CONFLICT"
    );
    expect(database.projectState("project-1").workflowRevision).toBe(2);
    expect(database.workflowSnapshot("project-1", 1)).toEqual(revisionOneSnapshot);
    expect(database.workflowSnapshot("project-1", 2)).toEqual(revisionTwoSnapshot);
    const projection = database.projectState("project-1");
    expect(projection.nodeRuns.find((run) => run.id === "node-run-1")).toMatchObject({
      workflowRevision: 1,
      status: "completed"
    });
    expect(projection.groupRuns.find((run) => run.id === "group-run-1")).toMatchObject({
      memberSnapshot: ["alice", "bob"],
      status: "completed",
      finalPullRequestId: "pull-final"
    });
  });

  it("reserves historical node ids to their original kind without blocking same-kind renames", async () => {
    const { database } = await stateFixture();
    const agentFirst = workflowSnapshot({
      agents: ["main", { name: "research", description: "Initial role" }, "writer", "review"]
    });
    createProject(database, { workflowSnapshot: agentFirst });
    const beforeAgentConflict = database.projectState("project-1");
    const beforeAgentEvents = database.eventsAfter("project-1");
    const agentConflict = expectStateError(
      () => database.saveWorkflowRevision({
        projectId: "project-1",
        workflowRevision: 2,
        snapshot: workflowSnapshot({
          agents: ["main", "writer", "review"],
          collaborations: [{
            id: "research",
            displayName: "Research group",
            memberAgentIds: ["writer", "review"]
          }]
        }),
        affectedGroupIds: [],
        requestId: "reuse-agent-as-group"
      }),
      "INVALID_STATE_TRANSITION"
    );
    expect(agentConflict.details).toMatchObject({
      nodeId: "research",
      historicalKind: "agent",
      proposedKind: "collaboration",
      historicalRevision: 1
    });
    expect(database.projectState("project-1")).toEqual(beforeAgentConflict);
    expect(database.eventsAfter("project-1")).toEqual(beforeAgentEvents);
    expect(() => database.workflowSnapshot("project-1", 2)).toThrow(/does not exist/);

    const withoutAgent = workflowSnapshot({
      agents: ["main", "writer", "review"]
    });
    expect(database.saveWorkflowRevision({
      projectId: "project-1",
      workflowRevision: 2,
      snapshot: withoutAgent,
      affectedGroupIds: [],
      requestId: "remove-agent"
    })).toMatchObject({ workflowRevision: 2, replay: false });
    const renamedAgent = workflowSnapshot({
      agents: ["main", { name: "research", description: "Renamed visible role" }, "writer", "review"]
    });
    expect(database.saveWorkflowRevision({
      projectId: "project-1",
      workflowRevision: 3,
      snapshot: renamedAgent,
      affectedGroupIds: [],
      requestId: "restore-same-agent-kind"
    })).toMatchObject({ workflowRevision: 3, replay: false });
    expect(database.workflowSnapshot("project-1", 3)).toEqual(renamedAgent);

    const groupFirst = workflowSnapshot({
      agents: ["main", "writer", "review"],
      collaborations: [{
        id: "research",
        displayName: "Research group",
        memberAgentIds: ["writer", "review"]
      }]
    });
    createProject(database, { projectId: "project-2", workflowSnapshot: groupFirst });
    const renamedGroup = workflowSnapshot({
      agents: ["main", "writer", "review"],
      collaborations: [{
        id: "research",
        displayName: "Evidence synthesis group",
        memberAgentIds: ["writer", "review"]
      }]
    });
    expect(database.saveWorkflowRevision({
      projectId: "project-2",
      workflowRevision: 2,
      snapshot: renamedGroup,
      affectedGroupIds: ["research"],
      requestId: "rename-group-display"
    })).toMatchObject({ workflowRevision: 2, replay: false });
    expect(database.workflowSnapshot("project-2", 2)).toEqual(renamedGroup);

    const withoutGroup = workflowSnapshot({
      agents: ["main", "writer", "review"]
    });
    expect(database.saveWorkflowRevision({
      projectId: "project-2",
      workflowRevision: 3,
      snapshot: withoutGroup,
      affectedGroupIds: ["research"],
      requestId: "remove-group"
    })).toMatchObject({ workflowRevision: 3, replay: false });
    const restoredGroup = workflowSnapshot({
      agents: ["main", "writer", "review"],
      collaborations: [{
        id: "research",
        displayName: "Restored evidence group",
        memberAgentIds: ["writer", "review"]
      }]
    });
    expect(database.saveWorkflowRevision({
      projectId: "project-2",
      workflowRevision: 4,
      snapshot: restoredGroup,
      affectedGroupIds: ["research"],
      requestId: "restore-same-group-kind"
    })).toMatchObject({ workflowRevision: 4, replay: false });
    expect(database.workflowSnapshot("project-2", 4)).toEqual(restoredGroup);

    const beforeGroupConflict = database.projectState("project-2");
    const beforeGroupEvents = database.eventsAfter("project-2");
    const groupConflict = expectStateError(
      () => database.saveWorkflowRevision({
        projectId: "project-2",
        workflowRevision: 5,
        snapshot: workflowSnapshot({
          agents: ["main", "research", "writer", "review"]
        }),
        affectedGroupIds: ["research"],
        requestId: "reuse-group-as-agent"
      }),
      "INVALID_STATE_TRANSITION"
    );
    expect(groupConflict.details).toMatchObject({
      nodeId: "research",
      historicalKind: "collaboration",
      proposedKind: "agent",
      historicalRevision: 1
    });
    expect(database.projectState("project-2")).toEqual(beforeGroupConflict);
    expect(database.eventsAfter("project-2")).toEqual(beforeGroupEvents);
    expect(() => database.workflowSnapshot("project-2", 5)).toThrow(/does not exist/);
  });

  it("fails closed when equal-timestamp history contains any active group run", async () => {
    const { database } = await stateFixture();
    createProject(database);
    database.activateGroup(groupActivation());
    database.requestGroupCancellation({
      projectId: "project-1",
      groupRunId: "group-run-1",
      actorAgentId: "leader",
      reason: "finish first fixed-clock run"
    });
    database.confirmCoordinatorStopped({
      projectId: "project-1",
      groupRunId: "group-run-1",
      coordinatorEpoch: 1,
      reason: "cancellation"
    });
    database.settleGroupCancellation({
      projectId: "project-1",
      groupRunId: "group-run-1",
      reason: "finish first fixed-clock run"
    });
    expect(() => database.assertWorkflowRevisionEditable(
      "project-1",
      ["group-node"]
    )).not.toThrow();

    database.activateGroup(groupActivation({
      nodeRunId: "node-run-2",
      groupRunId: "group-run-2",
      activationRequestId: "activate-group-2",
      groupBranch: "groups/group-run-2"
    }));
    const runs = database.projectState("project-1").nodeRuns
      .filter((run) => run.node.kind === "collaboration" && run.node.groupId === "group-node");
    expect(runs).toHaveLength(2);
    expect(new Set(runs.map((run) => run.activatedAt))).toEqual(new Set([
      "2026-09-22T00:00:00.000Z"
    ]));
    const error = expectStateError(
      () => database.assertWorkflowRevisionEditable("project-1", ["group-node"]),
      "WORKFLOW_EDIT_LOCKED"
    );
    expect(error.details).toMatchObject({
      nodeRunId: "node-run-2",
      groupRunId: "group-run-2",
      groupStatus: "coordinating",
      nodeStatus: "coordinating"
    });
  });
});

describe("Collaboration retained worktree capacity projection", () => {
  it("counts unique non-empty execution paths, warns at 100, and never cleans history", async () => {
    const { database, databasePath } = await stateFixture();
    createProject(database);
    expect(database.projectState("project-1").git.capacity).toEqual({
      retainedWorktreeCount: 0,
      warningThreshold: 100
    });

    const raw = new DatabaseSync(databasePath);
    raw.exec("PRAGMA foreign_keys=ON");
    raw.exec("BEGIN IMMEDIATE");
    try {
      const insertNode = raw.prepare(`
        INSERT INTO node_runs(
          node_run_id, project_id, node_kind, node_id, agent_id,
          workflow_revision, activation_request_id, activation_payload_hash,
          input_snapshot_ref, activated_by_agent_id, status,
          activated_at, updated_at, completed_at
        ) VALUES (?, 'project-1', 'agent', 'alice', 'alice', 1, ?, ?, ?,
          'main', 'completed', ?, ?, ?)
      `);
      const insertTask = raw.prepare(`
        INSERT INTO work_tasks(
          task_id, node_run_id, assignment, queue_ordinal, purpose, status,
          created_at, updated_at, completed_at
        ) VALUES (?, ?, 'Retained capacity fixture', 1, 'delivery', 'succeeded', ?, ?, ?)
      `);
      const insertExecution = raw.prepare(`
        INSERT INTO member_executions(
          execution_id, project_id, node_run_id, task_id, agent_id, purpose,
          ownership_epoch, status, execution_branch, worktree_path,
          queued_at, started_at, updated_at, completed_at
        ) VALUES (?, 'project-1', ?, ?, 'alice', 'delivery', 1, 'succeeded', ?, ?, ?, ?, ?, ?)
      `);
      const timestamp = "2026-09-22T00:00:00.000Z";
      for (let index = 0; index <= 100; index += 1) {
        const suffix = String(index).padStart(3, "0");
        const nodeRunId = `capacity-node-${suffix}`;
        const taskId = `capacity-task-${suffix}`;
        const executionId = `capacity-execution-${suffix}`;
        insertNode.run(
          nodeRunId,
          `capacity-activation-${suffix}`,
          `capacity-hash-${suffix}`,
          `capacity-input-${suffix}`,
          timestamp,
          timestamp,
          timestamp
        );
        insertTask.run(taskId, nodeRunId, timestamp, timestamp, timestamp);
        insertExecution.run(
          executionId,
          nodeRunId,
          taskId,
          `executions/${executionId}`,
          index === 100 ? "   " : `/srv/openfars/git-worktrees/${executionId}`,
          timestamp,
          timestamp,
          timestamp,
          timestamp
        );
      }
      raw.exec("COMMIT");
    } catch (error) {
      raw.exec("ROLLBACK");
      throw error;
    } finally {
      raw.close();
    }

    const expectedCapacity = {
      retainedWorktreeCount: 100,
      warningThreshold: 100,
      warning: "保留 worktree 数量已达到提醒阈值；系统不会自动删除或清理。"
    };
    expect(database.projectState("project-1").git.capacity).toEqual(expectedCapacity);
    expect(database.projectState("project-1").git.capacity).toEqual(expectedCapacity);
    expect(database.projectState("project-1").executions).toHaveLength(101);
  });
});

describe("CollaborationStateDatabase writer authority", () => {
  it("enforces DELETE/FULL health, one renewable writer epoch, and revision CAS", async () => {
    const fixture = await stateFixture();
    const { database, databasePath, clock } = fixture;
    expect(database.verifyHealth()).toEqual({
      journalMode: "delete",
      synchronous: "full",
      busyTimeoutMs: 5000,
      foreignKeys: true,
      integrity: "ok",
      lockingMode: "normal",
      schemaVersion: COLLABORATION_STATE_SCHEMA_VERSION
    });

    const attached = (await stateFixture({
      databasePath,
      clock,
      instanceId: "instance-a",
      writerLease: database.writerLease()
    })).database;
    createProject(database);
    const committed = database.appendEvent({
      projectId: "project-1",
      expectedRevision: 1,
      eventId: "event-cas-winner",
      type: "test.cas.winner",
      payload: { writer: "primary" }
    });
    expect(committed.revision).toBe(2);
    expectStateError(
      () => attached.appendEvent({
        projectId: "project-1",
        expectedRevision: 1,
        eventId: "event-cas-loser",
        type: "test.cas.loser",
        payload: { writer: "attached" }
      }),
      "STALE_PROJECT_REVISION"
    );
    expect(database.eventsAfter("project-1").map((event) => event.eventId)).not.toContain(
      "event-cas-loser"
    );

    expectStateError(
      () => CollaborationStateDatabase.open({
        databasePath,
        serviceId: "other-service",
        instanceId: "instance-b",
        hostId: "host-a",
        topology: "single-host",
        leaseDurationMs: 1_000,
        now: () => clock.value
      }),
      "WRITER_LEASE_HELD"
    );

    clock.value += 1_001;
    const replacement = (await stateFixture({
      databasePath,
      clock,
      serviceId: "replacement-service",
      instanceId: "instance-c"
    })).database;
    expect(replacement.writerLease().epoch).toBe(2);
    expectStateError(
      () => database.appendEvent({
        projectId: "project-1",
        eventId: "event-stale-writer",
        type: "test.writer.stale",
        payload: {}
      }),
      "WRITER_LEASE_STALE"
    );
    expect(replacement.appendEvent({
      projectId: "project-1",
      expectedRevision: 2,
      eventId: "event-epoch-two",
      type: "test.writer.recovered",
      payload: { epoch: 2 }
    }).revision).toBe(3);
  });

  it("migrates a real v1 branch constraint without retargeting foreign keys", async () => {
    const fixture = await stateFixture();
    let database = fixture.database;
    seedGroup(database, {
      tasks: [
        { id: "task-schema-v1-a", assignment: "Historical branch owner", assigneeAgentId: "alice" },
        { id: "task-schema-v1-b", assignment: "Write after the migration", assigneeAgentId: "bob" }
      ]
    });
    const historical = database.claimNextTask({
      projectId: "project-1",
      groupRunId: "group-run-1",
      agentId: "alice",
      executionId: "execution-schema-v1-a",
      executionBranch: "executions/execution-schema-v1-a",
      worktreePath: "/srv/openfars/git-worktrees/execution-schema-v1-a",
      invocationId: "invocation-schema-v1-a"
    });
    if (!historical) throw new Error("failed to seed the historical v1 execution");
    database.observePullRequest({
      projectId: "project-1",
      executionId: historical.execution.id,
      ownershipEpoch: 1,
      pullRequest: pullRequest({
        id: "pull-schema-v1-a",
        number: 91,
        executionId: historical.execution.id,
        head: historical.execution.executionBranch,
        base: "groups/group-run-1",
        status: "merged",
        mergeCommitSha: "9".repeat(40)
      })
    });
    database.completeExecution({
      projectId: "project-1",
      executionId: historical.execution.id,
      ownershipEpoch: 1,
      output: "Historical execution retained"
    });

    const lease = database.writerLease();
    database.close();
    openDatabases.splice(openDatabases.indexOf(database), 1);
    downgradeCollaborationSchemaToV1(fixture.databasePath);

    database = (await stateFixture({
      databasePath: fixture.databasePath,
      clock: fixture.clock,
      instanceId: "instance-a",
      writerLease: lease
    })).database;
    expect(database.verifyHealth().schemaVersion).toBe(COLLABORATION_STATE_SCHEMA_VERSION);
    const migratedInspection = new DatabaseSync(fixture.databasePath, { readOnly: true });
    try {
      expect(migratedInspection.prepare(
        "SELECT name, sql FROM sqlite_schema WHERE sql LIKE '%member_executions_schema_v1%'"
      ).all()).toEqual([]);
      expect(migratedInspection.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
      const executionSql = migratedInspection.prepare(
        "SELECT sql FROM sqlite_schema WHERE type = 'table' AND name = 'member_executions'"
      ).get() as { sql: string };
      expect(executionSql.sql).not.toContain("UNIQUE (project_id, execution_branch)");
    } finally {
      migratedInspection.close();
    }

    const reused = database.claimNextTask({
      projectId: "project-1",
      groupRunId: "group-run-1",
      agentId: "bob",
      executionId: "execution-schema-v2-b",
      executionBranch: "executions/execution-schema-v2-b",
      worktreePath: "/srv/openfars/git-worktrees/execution-schema-v2-b",
      invocationId: "invocation-schema-v2-b"
    });
    expect(reused?.execution).toMatchObject({
      id: "execution-schema-v2-b",
      executionBranch: "executions/execution-schema-v2-b",
      status: "working"
    });

    const migratedLease = database.writerLease();
    database.close();
    openDatabases.splice(openDatabases.indexOf(database), 1);
    const reopened = (await stateFixture({
      databasePath: fixture.databasePath,
      clock: fixture.clock,
      instanceId: "instance-a",
      writerLease: migratedLease
    })).database;
    expect(reopened.projectState("project-1").executions.map((execution) => execution.id)).toEqual([
      "execution-schema-v1-a",
      "execution-schema-v2-b"
    ]);
  });

  it("does not mutate a v1 schema while another writer lease is live", async () => {
    const fixture = await stateFixture();
    const database = fixture.database;
    database.close();
    openDatabases.splice(openDatabases.indexOf(database), 1);
    downgradeCollaborationSchemaToV1(fixture.databasePath);
    const inspectSchema = () => {
      const inspection = new DatabaseSync(fixture.databasePath, { readOnly: true });
      try {
        return {
          journalMode: String((inspection.prepare("PRAGMA journal_mode").get() as {
            journal_mode: string;
          }).journal_mode),
          version: (inspection.prepare(
            "SELECT schema_version FROM collaboration_state_meta WHERE singleton = 1"
          ).get() as { schema_version: number }).schema_version,
          objects: inspection.prepare(`
            SELECT type, name, tbl_name, sql FROM sqlite_schema
            WHERE name NOT LIKE 'sqlite_%' ORDER BY type, name
          `).all()
        };
      } finally {
        inspection.close();
      }
    };
    const before = inspectSchema();
    expect(before.version).toBe(1);
    expect(before.objects.some((object) =>
      String((object as { name: string }).name).includes("legacy_v1_direct_main") ||
      (object as { name: string }).name === "member_executions_one_active_branch"
    )).toBe(false);
    expectStateError(() => CollaborationStateDatabase.open({
      databasePath: fixture.databasePath,
      serviceId: "other-collaboration-service",
      instanceId: "other-instance",
      hostId: "host-a",
      topology: "single-host",
      leaseDurationMs: 1_000,
      now: () => fixture.clock.value
    }), "WRITER_LEASE_HELD");
    expect(inspectSchema()).toEqual(before);
  });

  it("rolls back an invalid v1 migration and rejects every repeated open", async () => {
    const fixture = await stateFixture();
    const database = fixture.database;
    seedGroup(database, {
      tasks: [{ id: "task-invalid-v1", assignment: "Keep an invalid legacy reference" }]
    });
    const lease = database.writerLease();
    database.close();
    openDatabases.splice(openDatabases.indexOf(database), 1);
    downgradeCollaborationSchemaToV1(fixture.databasePath);

    const corrupt = new DatabaseSync(fixture.databasePath);
    corrupt.exec("PRAGMA foreign_keys=OFF");
    corrupt.prepare(`
      UPDATE work_tasks SET current_execution_id = 'missing-v1-execution'
      WHERE task_id = 'task-invalid-v1'
    `).run();
    corrupt.close();
    const schemaSnapshot = () => {
      const inspection = new DatabaseSync(fixture.databasePath, { readOnly: true });
      try {
        return inspection.prepare(`
          SELECT type, name, tbl_name, sql FROM sqlite_schema
          WHERE name NOT LIKE 'sqlite_%' ORDER BY type, name
        `).all();
      } finally {
        inspection.close();
      }
    };
    const schemaBeforeFailure = schemaSnapshot();
    expect(schemaBeforeFailure.some((object) =>
      String((object as { name: string }).name).includes("legacy_v1_direct_main") ||
      (object as { name: string }).name === "member_executions_one_active_branch"
    )).toBe(false);

    const openInvalid = () => CollaborationStateDatabase.open({
      databasePath: fixture.databasePath,
      serviceId: "collaboration-service",
      instanceId: "instance-a",
      hostId: "host-a",
      topology: "single-host",
      leaseDurationMs: 1_000,
      now: () => fixture.clock.value,
      writerLease: lease
    });
    expectStateError(openInvalid, "DATABASE_INTEGRITY_FAILED");
    const afterFirst = new DatabaseSync(fixture.databasePath, { readOnly: true });
    expect((afterFirst.prepare(
      "SELECT schema_version FROM collaboration_state_meta WHERE singleton = 1"
    ).get() as { schema_version: number }).schema_version).toBe(1);
    expect(afterFirst.prepare(
      "SELECT name FROM sqlite_schema WHERE type = 'table' AND name = 'member_executions_schema_v1'"
    ).get()).toBeUndefined();
    afterFirst.close();
    expect(schemaSnapshot()).toEqual(schemaBeforeFailure);
    expectStateError(openInvalid, "DATABASE_INTEGRITY_FAILED");

    // An open that acquires a new epoch itself must expire only that exact
    // token after migration failure, so the same integrity error remains
    // observable immediately instead of being masked by a 30s live lease.
    fixture.clock.value += 1_001;
    const openWithAcquiredLease = () => CollaborationStateDatabase.open({
      databasePath: fixture.databasePath,
      serviceId: "migration-repair-service",
      instanceId: "migration-repair-instance",
      hostId: "host-a",
      topology: "single-host",
      leaseDurationMs: 1_000,
      now: () => fixture.clock.value
    });
    expectStateError(openWithAcquiredLease, "DATABASE_INTEGRITY_FAILED");
    expectStateError(openWithAcquiredLease, "DATABASE_INTEGRITY_FAILED");
  });
});

describe("Writer lease acquisition errors", () => {
  it.each(["renew", "release", "mutation"] as const)("preserves the original SQLite error after automatic rollback during %s", async operation => {
    const fixture = await stateFixture();
    const inspect = new DatabaseSync(fixture.databasePath);
    try {
      const before = inspect.prepare("SELECT * FROM writer_service_lease").get();
      const table = operation === "mutation" ? "project_heads" : "writer_service_lease";
      const event = operation === "mutation" ? "INSERT" : "UPDATE";
      inspect.exec(`CREATE TRIGGER reject_transaction BEFORE ${event} ON ${table}
        BEGIN SELECT RAISE(ROLLBACK, 'original SQLite transaction failure'); END`);
      const invoke = () => operation === "renew" ? fixture.database.renewWriterLease()
        : operation === "release" ? fixture.database.relinquishWriterLease() : createProject(fixture.database);
      for (let attempt = 0; attempt < 2; attempt++) {
        const error = (() => { try { invoke(); } catch (error) { return error; } })();
        expect(error).toMatchObject({ message: "original SQLite transaction failure", code: "ERR_SQLITE_ERROR", errcode: 1811 });
        expect(inspect.prepare("SELECT * FROM writer_service_lease").get()).toEqual(before);
        expect(() => fixture.database.assertWriterLeaseHeld()).not.toThrow();
      }
      if (operation === "mutation") expect(inspect.prepare("SELECT count(*) AS count FROM project_heads").get()).toMatchObject({ count: 0 });
      inspect.exec("DROP TRIGGER reject_transaction");
      expect(() => invoke()).not.toThrow();
    } finally { inspect.close(); }
  });

  it("preserves the SQLite failure when lease acquisition has already rolled back its transaction", async () => {
    const fixture = await stateFixture();
    fixture.database.close();
    openDatabases.splice(openDatabases.indexOf(fixture.database), 1);
    fixture.clock.value += 1_001;
    const inspect = new DatabaseSync(fixture.databasePath);
    const before = inspect.prepare("SELECT * FROM writer_service_lease").get();
    inspect.exec(`CREATE TRIGGER reject_lease_update BEFORE UPDATE ON writer_service_lease
      BEGIN SELECT RAISE(ROLLBACK, 'original lease acquisition failure'); END`);
    inspect.close();
    const open = () => CollaborationStateDatabase.open({ databasePath: fixture.databasePath,
      serviceId: "collaboration-service", instanceId: "new-instance", hostId: "host-a",
      topology: "single-host", leaseDurationMs: 1_000, now: () => fixture.clock.value });
    expect(open).toThrow("original lease acquisition failure");
    expect(open).toThrow("original lease acquisition failure");
    const after = new DatabaseSync(fixture.databasePath);
    expect(after.prepare("SELECT * FROM writer_service_lease").get()).toEqual(before);
    after.exec("DROP TRIGGER reject_lease_update");
    after.close();
    const recovered = open(); openDatabases.push(recovered);
    expect(recovered.writerLease().instanceId).toBe("new-instance");
    expect(recovered.writerLease().epoch).toBe(Number((before as { epoch: number }).epoch) + 1);
  });
});

describe("Resumable project Stop receipts", () => {
  it.each(["user_cancelled", "arm_timeout", "budget_exhausted", "dependency_failure", "shutdown"])(
    "retains exact pre-PR owners after a confirmed bulk Stop with reason %s", async (reason) => {
      const { database } = await stateFixture();
      seedGroup(database, { tasks: [
        { id: "bulk-stop-alice", assignment: "Original Alice instructions", assigneeAgentId: "alice" },
        { id: "bulk-stop-bob", assignment: "Original Bob instructions", assigneeAgentId: "bob" }
      ] });
      const originals = [claim(database, "alice", "bulk-stop-execution-alice")!,
        claim(database, "bob", "bulk-stop-execution-bob")!];
      const projectId = "project-1", groupRunId = "group-run-1";
      database.appendEvent({ projectId, type: "project.cancellation.requested", payload: { resumable: true, reason } });
      database.requestGroupCancellation({ projectId, groupRunId, actorAgentId: "main", reason });
      expect(database.eventsAfter(projectId, 0).filter((event) => event.type === "execution.stop_requested")).toEqual([]);
      const recovery = { projectId, groupRunId, executionId: originals[0]!.execution.id,
        predecessorOwnershipEpoch: 1, invocationId: "bulk-resume-alice-2", residentLaunchProtocol: "trusted-supervisor-v1" as const };
      for (const original of originals) {
        expect(database.executionHasResumableStopProvenance(projectId, original.execution.id, 1)).toBe(false);
        database.confirmExecutionStopped({ projectId, executionId: original.execution.id, ownershipEpoch: 1,
          stopped: true, evidence: { processGroupAbsent: true, sessionNotPreviouslyCommitted: true } });
      }
      // Exact worker proofs alone cannot stand in for the complete project Stop.
      expect(database.executionHasResumableStopProvenance(projectId, recovery.executionId, 1)).toBe(false);
      database.confirmCoordinatorStopped({ projectId, groupRunId, coordinatorEpoch: 1, reason: "cancellation",
        evidence: { processGroupAbsent: true } });
      database.confirmProjectCancellationStopped(projectId);
      const stopped = database.projectState(projectId);
      expect(database.executionHasResumableStopProvenance(projectId, recovery.executionId, 1)).toBe(true);
      expectStateError(() => database.recoverGroupExecution(recovery), "STALE_OWNERSHIP_EPOCH");
      expect(database.projectState(projectId)).toEqual(stopped);
      database.resumeProjectCancellation({ projectId });
      const resumed = database.projectState(projectId);
      expect(resumed.executions).toEqual(stopped.executions);
      expect(resumed.tasks).toEqual(stopped.tasks);
      for (const [index, original] of originals.entries()) {
        const identity = { ...recovery, executionId: original.execution.id, invocationId: `bulk-resume-${index}-2` };
        const result = database.recoverGroupExecution(identity);
        expect(result.execution).toMatchObject({ id: original.execution.id, ownershipEpoch: 2,
          agentId: original.execution.agentId, taskId: original.task.id, executionBranch: original.execution.executionBranch,
          worktreePath: original.execution.worktreePath, sessionId: original.execution.sessionId, status: "working" });
        expect(database.recoverGroupExecution(identity).replay).toBe(true);
        expect(database.executionHasResumableStopProvenance(projectId, original.execution.id, 2)).toBe(false);
        expectStateError(() => database.transitionExecutionStatus({ projectId, executionId: original.execution.id,
          ownershipEpoch: 1, status: "working" }), "STALE_OWNERSHIP_EPOCH");
      }
      const after = database.projectState(projectId);
      expect(after.executions).toHaveLength(2);
      expect(after.executions.every((entry) => !entry.predecessorExecutionId && !entry.successorExecutionId)).toBe(true);
      expect(after.tasks.map((task) => task.assignment)).toEqual(stopped.tasks.map((task) => task.assignment));
      expect(after.operations).toEqual(stopped.operations);
      expect(after.pullRequests).toEqual(stopped.pullRequests);
      expect(after.routeOutbox).toEqual(stopped.routeOutbox);
      expect(database.eventsAfter(projectId, 0).some((event) => event.type === "execution.handed_off")).toBe(false);
    });

  it.each(["ordinary_group_cancel", "unrelated_owner", "wrong_scope", "newer_business_failure"])(
    "rejects unrelated or superseded bulk Stop provenance: %s", async (mode) => {
      const { database } = await stateFixture();
      seedGroup(database, { tasks: [{ id: "bulk-negative", assignment: "Preserve my task", assigneeAgentId: "alice" }] });
      const original = claim(database, "alice", "bulk-negative-execution")!;
      const projectId = "project-1", groupRunId = "group-run-1";
      if (mode !== "ordinary_group_cancel") database.appendEvent({ projectId,
        type: "project.cancellation.requested", payload: { resumable: true, reason: "shutdown" } });
      database.requestGroupCancellation({ projectId, groupRunId, actorAgentId: "main", reason: "shutdown" });
      database.confirmExecutionStopped({ projectId, executionId: original.execution.id, ownershipEpoch: 1,
        stopped: true, evidence: { processGroupAbsent: true } });
      database.confirmCoordinatorStopped({ projectId, groupRunId, coordinatorEpoch: 1, reason: "cancellation",
        evidence: { processGroupAbsent: true } });
      if (mode !== "ordinary_group_cancel") {
        database.confirmProjectCancellationStopped(projectId);
        database.resumeProjectCancellation({ projectId });
        if (mode === "newer_business_failure") {
          database.recoverGroupExecution({ projectId, groupRunId, executionId: original.execution.id,
            predecessorOwnershipEpoch: 1, invocationId: "bulk-negative-next-owner" });
          database.requestExecutionStop({ projectId, executionId: original.execution.id,
            ownershipEpoch: 2, reason: "Actual business failure" });
          database.confirmExecutionStopped({ projectId, executionId: original.execution.id, ownershipEpoch: 2,
            stopped: true, evidence: { nativeHandleClosed: true } });
        } else database.appendEvent({ projectId, groupRunId, ...(mode === "wrong_scope" ? {} : { nodeRunId: original.execution.nodeRunId }),
          type: "group.cancellation.requested", payload: { reason: "Actual business failure",
            activeExecutionIds: mode === "unrelated_owner" ? ["other-execution"] : [original.execution.id] } });
      }
      const before = database.projectState(projectId);
      // Unrelated later events must not supersede the exact valid original Stop;
      // a newer same-owner business failure must supersede it.
      const valid = mode === "unrelated_owner" || mode === "wrong_scope";
      expect(database.executionHasResumableStopProvenance(projectId, original.execution.id,
        mode === "newer_business_failure" ? 2 : 1)).toBe(valid);
      expect(database.executionHasResumableStopProvenance(projectId, original.execution.id, 2)).toBe(false);
      expect(database.projectState(projectId)).toEqual(before);
    });

  it("retires each proven stopped native scope without completing its business or requiring an old writer's close callback", async () => {
    const f = await stateFixture();
    const { database } = f;
    seedGroup(database, { tasks: [{ id: "activity-stop-task", assignment: "Keep my original work", assigneeAgentId: "alice" }] });
    const claimed = claim(database, "alice", "activity-stop-execution")!;
    const group = database.projectState("project-1").groupRuns[0]!;
    const leader = { projectId: "project-1", nodeRunId: group.nodeRunId, groupRunId: group.id,
      coordinatorEpoch: 1, agentId: group.leaderAgentId, invocationId: "activity-stop-leader" };
    const worker = { ...leader, agentId: "alice", invocationId: claimed.execution.invocationId!,
      taskId: claimed.task.id, executionId: claimed.execution.id, ownershipEpoch: 1 };
    for (const scope of [leader, worker]) {
      database.startRuntimeActivity({ ...scope, kind: "resident", phase: "resident:starting" });
      database.startRuntimeActivity({ ...scope, kind: "turn", phase: "model:running", inputId: `${scope.invocationId}-input` });
    }
    expect(database.projectState("project-1").runtimeActivities).toHaveLength(4);
    database.appendEvent({ projectId: "project-1", type: "project.cancellation.requested", payload: { resumable: true } });
    database.requestGroupCancellation({ projectId: "project-1", groupRunId: group.id, actorAgentId: "main", reason: "user_cancelled" });
    expect(database.projectState("project-1").runtimeActivities).toHaveLength(4);
    database.confirmExecutionStopped({ projectId: "project-1", executionId: claimed.execution.id, ownershipEpoch: 1,
      stopped: false, evidence: { processGroupStillPresent: true } });
    expect(database.projectState("project-1").runtimeActivities).toHaveLength(4);
    database.confirmCoordinatorStopped({ projectId: "project-1", groupRunId: group.id, coordinatorEpoch: 1,
      reason: "cancellation", evidence: { residentClosed: true } });
    expect(database.projectState("project-1").runtimeActivities).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: "resident", executionId: claimed.execution.id }),
      expect.objectContaining({ kind: "turn", executionId: claimed.execution.id })
    ]));
    expect(database.projectState("project-1").runtimeActivities).toHaveLength(2);
    expect(() => database.confirmProjectCancellationStopped("project-1")).toThrow(/every exact native stop proof/);
    database.confirmExecutionStopped({ projectId: "project-1", executionId: claimed.execution.id, ownershipEpoch: 1,
      stopped: true, evidence: { residentClosed: true } });
    const stopped = database.projectState("project-1");
    expect(stopped.runtimeActivities).toEqual([]);
    database.confirmProjectCancellationStopped("project-1");
    const confirmed = database.projectState("project-1");
    expect(confirmed.tasks).toEqual(stopped.tasks);
    expect(confirmed.executions).toEqual(stopped.executions);
    expect(confirmed.operations).toEqual(stopped.operations);
    expect(confirmed.pullRequests).toEqual(stopped.pullRequests);
    expect(confirmed.routeOutbox).toEqual(stopped.routeOutbox);
    expect(database.eventsAfter("project-1", 0).filter((event) => event.type === "runtime.activity.closed")).toEqual([]);
    database.close();
    f.clock.value += 1_001;
    const next = (await stateFixture({ databasePath: f.databasePath, clock: f.clock,
      serviceId: "stopped-activity-successor", instanceId: "stopped-activity-successor" })).database;
    expect(next.projectState("project-1").runtimeActivities).toEqual([]);
    next.resumeProjectCancellation({ projectId: "project-1" });
    const revision = next.projectState("project-1").stateRevision;
    next.startRuntimeActivity({ ...leader, invocationId: "activity-stop-new-leader", kind: "resident", phase: "resident:starting" });
    expect(next.projectState("project-1").runtimeActivities).toMatchObject([{ invocationId: "activity-stop-new-leader",
      coordinatorEpoch: 1, leaseState: "current" }]);
    expect(next.projectState("project-1").stateRevision).toBe(revision + 1);
    expect(next.projectState("project-1").tasks).toEqual(stopped.tasks);
    expect(next.eventsAfter("project-1", 0).filter((event) => event.type === "runtime.activity.started")).toHaveLength(5);
  });

  it("applies the trusted project stop receipt to old independent Main activity across Resume and later calls", async () => {
    const { database } = await stateFixture(); createProject(database);
    const projectId = "project-1", nodeRunId = "stopped-independent-main";
    database.activateNode({ projectId, nodeRunId, node: { kind: "agent", nodeId: "main", agentId: "main" },
      activationRequestId: "stopped-main-activation", inputSnapshotRef: "original-main-context", activatedByAgentId: "main", workflowRevision: 1 });
    const scope = { projectId, nodeRunId, agentId: "main", coordinatorEpoch: 1, invocationId: "original-stopped-main" };
    database.appendEvent({ ...scope, type: "main.route.attempt", payload: { attempt: 1 } });
    database.startRuntimeActivity({ ...scope, kind: "resident", phase: "resident:starting" });
    database.startRuntimeActivity({ ...scope, kind: "turn", phase: "model:running" });
    const before = database.projectState(projectId);
    const intent = database.appendEvent({ projectId, type: "project.cancellation.requested", payload: { resumable: true } }).event;
    expect(database.projectState(projectId).runtimeActivities).toHaveLength(2);
    // Untrusted descriptive events cannot be substituted for the supervisor's
    // canonical stop receipt. The existing Stop producer owns this proof.
    database.appendEvent({ projectId, type: "project.cancellation.stop_confirmed", payload: { requestedEventSeq: intent.seq } });
    expect(database.projectState(projectId).runtimeActivities).toHaveLength(2);
    database.confirmProjectCancellationStopped(projectId);
    const stopped = database.projectState(projectId);
    expect(stopped.runtimeActivities).toEqual([]);
    expect(stopped.nodeRuns).toEqual(before.nodeRuns);
    expect(stopped.routeOutbox).toEqual(before.routeOutbox);
    database.resumeProjectCancellation({ projectId });
    expect(database.projectState(projectId).runtimeActivities).toEqual([]);
    database.appendEvent({ ...scope, invocationId: "resumed-independent-main", coordinatorEpoch: 2,
      type: "main.route.attempt", payload: { attempt: 2 } });
    database.startRuntimeActivity({ ...scope, invocationId: "resumed-independent-main", coordinatorEpoch: 2,
      kind: "resident", phase: "resident:starting" });
    expect(database.projectState(projectId).runtimeActivities).toMatchObject([{ invocationId: "resumed-independent-main", coordinatorEpoch: 2 }]);
    expect(database.eventsAfter(projectId, 0).filter((event) => event.type === "runtime.activity.closed")).toEqual([]);
  });

  it("requires both the exact Worker and coordinator stop proofs and records no Agent completion", async () => {
    const { database } = await stateFixture();
    seedGroup(database, { tasks: [{ id: "stop-task", assignment: "Retain unfinished work", assigneeAgentId: "alice" }] });
    const claimed = claim(database, "alice", "stop-execution")!;
    const intent = database.appendEvent({ projectId: "project-1", type: "project.cancellation.requested",
      payload: { resumable: true, reason: "user_cancelled" } }).event;
    database.requestGroupCancellation({ projectId: "project-1", groupRunId: "group-run-1",
      actorAgentId: "main", reason: "user_cancelled" });
    const pending = database.projectState("project-1");
    expect(pending.resumableCancellation).toEqual({ requestedEventSeq: intent.seq });
    expect(() => database.resumeProjectCancellation({ projectId: "project-1" })).toThrow(/before native stop is confirmed/);
    expect(() => database.confirmProjectCancellationStopped("project-1")).toThrow(/every exact native stop proof/);
    database.confirmCoordinatorStopped({ projectId: "project-1", groupRunId: "group-run-1", coordinatorEpoch: 1,
      reason: "cancellation", evidence: { processGroupAbsent: true } });
    expect(() => database.confirmProjectCancellationStopped("project-1")).toThrow(/every exact native stop proof/);
    database.confirmExecutionStopped({ projectId: "project-1", executionId: claimed.execution.id, ownershipEpoch: 1,
      stopped: true, evidence: { processGroupAbsent: true } });
    const physicallyStopped = database.projectState("project-1");
    database.confirmProjectCancellationStopped("project-1");
    const stopped = database.projectState("project-1");
    expect(stopped.resumableCancellation).toEqual({ requestedEventSeq: intent.seq, stoppedAt: expect.any(String) });
    expect(stopped.executions[0]).toMatchObject({ id: claimed.execution.id, ownershipEpoch: 1, status: "stopped",
      executionBranch: claimed.execution.executionBranch, worktreePath: claimed.execution.worktreePath });
    expect(stopped.tasks).toEqual(physicallyStopped.tasks);
    expect(stopped.pullRequests).toEqual(pending.pullRequests);
    expect(stopped.operations).toEqual(pending.operations);
    expect(stopped.routeOutbox).toEqual(pending.routeOutbox);
    database.confirmProjectCancellationStopped("project-1");
    expect(database.projectState("project-1").stateRevision).toBe(stopped.stateRevision);
    expect(database.eventsAfter("project-1", intent.seq).filter((event) =>
      event.type === "project.cancellation.stop_confirmed")).toHaveLength(1);
  });

  it("does not reuse a previous Stop receipt after explicit Resume and another Stop", async () => {
    const { database } = await stateFixture();
    seedGroup(database);
    const first = database.appendEvent({ projectId: "project-1", type: "project.cancellation.requested",
      payload: { resumable: true } }).event;
    database.requestGroupCancellation({ projectId: "project-1", groupRunId: "group-run-1",
      actorAgentId: "main", reason: "user_cancelled" });
    database.confirmCoordinatorStopped({ projectId: "project-1", groupRunId: "group-run-1", coordinatorEpoch: 1,
      reason: "cancellation", evidence: { processGroupAbsent: true } });
    database.confirmProjectCancellationStopped("project-1");
    expect(database.projectState("project-1").resumableCancellation?.stoppedAt).toBeDefined();
    database.resumeProjectCancellation({ projectId: "project-1" });
    expect(database.projectState("project-1").resumableCancellation).toBeUndefined();
    expect(() => database.confirmProjectCancellationStopped("project-1")).toThrow(/requires its resumable cancellation intent/);
    const second = database.appendEvent({ projectId: "project-1", type: "project.cancellation.requested",
      payload: { resumable: true } }).event;
    expect(second.seq).toBeGreaterThan(first.seq);
    expect(database.projectState("project-1").resumableCancellation).toEqual({ requestedEventSeq: second.seq });
    database.requestGroupCancellation({ projectId: "project-1", groupRunId: "group-run-1",
      actorAgentId: "main", reason: "user_cancelled" });
    database.confirmProjectCancellationStopped("project-1");
    expect(database.projectState("project-1").resumableCancellation).toEqual({ requestedEventSeq: second.seq,
      stoppedAt: expect.any(String) });
    expect(database.eventsAfter("project-1", 0).filter((event) =>
      event.type === "project.cancellation.stop_confirmed").map((event) => event.payload.requestedEventSeq))
      .toEqual([first.seq, second.seq]);
  });
});

describe("Collaboration runtime activity facts", () => {
  it("persists native recovery progress and retains accepted Git facts across writer restart", async () => {
    const fixture = await stateFixture();
    const { database } = fixture;
    createProject(database, { workflowSnapshot: { schemaVersion: 2, agents: [{ name: "analyst" }], collaborations: [] } });
    database.activateNode({ projectId: "project-1", nodeRunId: "native-recovery-node",
      node: { kind: "agent", nodeId: "analysis", agentId: "analyst" }, activationRequestId: "native-recovery-activate",
      inputSnapshotRef: "original-task", activatedByAgentId: "main", workflowRevision: 1 });
    const original = database.startStandaloneExecution({ projectId: "project-1", nodeRunId: "native-recovery-node",
      taskId: "original-task", executionId: "original-execution", agentId: "analyst", assignment: "Original task",
      executionBranch: "executions/original-execution", worktreePath: "/srv/original", invocationId: "original-invocation" }).execution;
    database.transitionExecutionStatus({ projectId: "project-1", executionId: original.id, ownershipEpoch: 1,
      status: "working", invocationId: original.invocationId });
    database.appendEvent({ projectId: "project-1", executionId: original.id, ownershipEpoch: 1,
      type: "execution.agent_git.fact", payload: { facts: { pushedHeadSha: "b".repeat(40) } } });
    database.appendEvent({ projectId: "project-1", requestId: "original-retry", type: "runtime.harness_recovery.scheduled",
      payload: { attempt: 3, nextRetryAt: "2026-10-15T13:00:00.000Z", errorCode: "PROTOCOL_TOOL_ARGUMENTS_INVALID" } });
    database.requestExecutionStop({ projectId: "project-1", executionId: original.id, ownershipEpoch: 1, reason: "native_turn_recovery" });
    database.confirmExecutionStopped({ projectId: "project-1", executionId: original.id, ownershipEpoch: 1, stopped: false });
    expect(database.executionHasNativeRecoveryStopProvenance("project-1", original.id, 1)).toBe(false);
    expect(() => database.recoverStandaloneExecution({ projectId: "project-1", executionId: original.id,
      predecessorOwnershipEpoch: 1, invocationId: "recovered-invocation" })).toThrow();
    database.relinquishWriterLease(); database.close();
    const reopened = (await stateFixture({ databasePath: fixture.databasePath, clock: fixture.clock })).database;
    expect(reopened.pendingHarnessRecovery("project-1")?.payload).toMatchObject({ attempt: 3,
      nextRetryAt: "2026-10-15T13:00:00.000Z", errorCode: "PROTOCOL_TOOL_ARGUMENTS_INVALID" });
    reopened.confirmExecutionStopped({ projectId: "project-1", executionId: original.id, ownershipEpoch: 1,
      stopped: true, evidence: { supervisorStopConfirmed: true } });
    const recovered = reopened.recoverStandaloneExecution({ projectId: "project-1", executionId: original.id,
      predecessorOwnershipEpoch: 1, invocationId: "recovered-invocation" }).execution;
    expect(recovered).toMatchObject({ id: original.id, taskId: original.taskId, executionBranch: original.executionBranch,
      worktreePath: original.worktreePath, ownershipEpoch: 2 });
    expect(reopened.latestAgentGitFacts("project-1", original.id, 2)).toEqual({ pushedHeadSha: "b".repeat(40) });
    reopened.appendEvent({ projectId: "project-1", type: "runtime.harness_recovery.completed", payload: {} });
    expect(reopened.pendingHarnessRecovery("project-1")).toBeUndefined();
  });

  it("atomically replaces turns and fences late events from an expired writer lease", async () => {
    const fixture = await stateFixture();
    createProject(fixture.database, {
      workflowSnapshot: {
        schemaVersion: 2,
        agents: [{ name: "analyst" }],
        collaborations: []
      }
    });
    fixture.database.activateNode({
      projectId: "project-1",
      nodeRunId: "runtime-node",
      node: { kind: "agent", nodeId: "analysis-node", agentId: "analyst" },
      activationRequestId: "activate-runtime-node",
      inputSnapshotRef: "snapshot:runtime-node",
      activatedByAgentId: "main",
      workflowRevision: 1
    });
    fixture.database.startStandaloneExecution({
      projectId: "project-1",
      nodeRunId: "runtime-node",
      taskId: "runtime-task",
      executionId: "runtime-execution",
      agentId: "analyst",
      assignment: "Run the model",
      executionBranch: "executions/runtime-execution",
      worktreePath: "/srv/openfars/git-worktrees/runtime-execution",
      invocationId: "runtime-invocation-1",
      residentLaunchProtocol: "trusted-supervisor-v1"
    });
    fixture.database.transitionExecutionStatus({
      projectId: "project-1",
      executionId: "runtime-execution",
      ownershipEpoch: 1,
      status: "working",
      invocationId: "runtime-invocation-1"
    });
    const scope = {
      projectId: "project-1",
      agentId: "analyst",
      nodeRunId: "runtime-node",
      taskId: "runtime-task",
      executionId: "runtime-execution",
      ownershipEpoch: 1
    } as const;
    fixture.database.startRuntimeActivity({
      ...scope,
      kind: "resident",
      phase: "resident:starting",
      invocationId: "runtime-invocation-1",
      requestId: "resident-start"
    });
    fixture.database.startRuntimeActivity({
      ...scope,
      kind: "turn",
      phase: "model:running",
      invocationId: "runtime-invocation-1",
      inputId: "turn-input-1",
      requestId: "turn-start-1"
    });
    expect(fixture.database.projectState("project-1").runtimeActivities).toMatchObject([
      { kind: "resident", invocationId: "runtime-invocation-1", leaseState: "current" },
      { kind: "turn", invocationId: "runtime-invocation-1", inputId: "turn-input-1", leaseState: "current" }
    ]);

    fixture.database.startRuntimeActivity({
      ...scope,
      kind: "turn",
      phase: "model:running",
      invocationId: "runtime-invocation-2",
      inputId: "turn-input-2",
      requestId: "turn-start-2"
    });
    expect(fixture.database.closeRuntimeActivity({
      projectId: "project-1",
      kind: "turn",
      invocationId: "runtime-invocation-1",
      nodeRunId: "runtime-node",
      executionId: "runtime-execution",
      ownershipEpoch: 1,
      outcome: "completed"
    }).closed).toBe(false);
    expect(fixture.database.projectState("project-1").runtimeActivities
      .filter((activity) => activity.kind === "turn"))
      .toMatchObject([{ invocationId: "runtime-invocation-2", inputId: "turn-input-2" }]);

    fixture.clock.value += 1_001;
    const successor = await stateFixture({
      databasePath: fixture.databasePath,
      clock: fixture.clock,
      serviceId: "successor-service",
      instanceId: "successor-instance"
    });
    expect(successor.database.projectState("project-1").runtimeActivities)
      .toEqual(expect.arrayContaining([
        expect.objectContaining({ kind: "resident", leaseState: "recovering" }),
        expect.objectContaining({ kind: "turn", leaseState: "recovering" })
      ]));
    successor.database.startRuntimeActivity({
      ...scope,
      kind: "turn",
      phase: "model:running",
      invocationId: "runtime-invocation-3",
      inputId: "turn-input-3",
      requestId: "turn-start-3"
    });
    expect(successor.database.projectState("project-1").runtimeActivities
      .filter((activity) => activity.kind === "turn"))
      .toMatchObject([{ invocationId: "runtime-invocation-3", leaseState: "current" }]);
    expectStateError(() => fixture.database.closeRuntimeActivity({
      projectId: "project-1",
      kind: "turn",
      invocationId: "runtime-invocation-2",
      nodeRunId: "runtime-node",
      executionId: "runtime-execution",
      ownershipEpoch: 1,
      outcome: "completed"
    }), "WRITER_LEASE_STALE");
  });
});

describe("Additional standalone delivery facts", () => {
  async function fixture(originalStatus: "open" | "merged" = "merged") {
    const f = await stateFixture(), { database } = f;
    createProject(database);
    database.activateNode({ projectId: "project-1", nodeRunId: "additional-node",
      node: { kind: "agent", nodeId: "analysis-node", agentId: "analyst" }, activationRequestId: "additional-activate",
      inputSnapshotRef: "fixture:additional", activatedByAgentId: "main", workflowRevision: 1 });
    database.startStandaloneExecution({ projectId: "project-1", nodeRunId: "additional-node", taskId: "additional-task",
      executionId: "additional-execution", agentId: "analyst", assignment: "Original task and necessary Memory",
      executionBranch: "executions/additional-execution", worktreePath: "/srv/openfars/git-worktrees/additional-execution",
      invocationId: "original-native" });
    const a = pullRequest({ id: "original-a", number: 1, executionId: "additional-execution",
      head: "executions/additional-execution", base: "main", status: originalStatus,
      ...(originalStatus === "merged" ? { mergeCommitSha: "a".repeat(40) } : {}) });
    database.observePullRequest({ projectId: "project-1", executionId: "additional-execution", ownershipEpoch: 1,
      pullRequest: a, requestId: "original-a-observed" });
    const b = pullRequest({ id: "additional-b", number: 2, executionId: "additional-execution",
      head: "executions/additional-execution", base: "main", status: "open" });
    const proof = (pull: PullRequestRecord) => database.appendEvent({ projectId: "project-1",
      executionId: "additional-execution", ownershipEpoch: 1, invocationId: "original-native", agentId: "analyst",
      type: "execution.agent_git.fact", payload: { facts: { pushedHeadSha: pull.headSha, pullRequest: pull } } });
    const observe = (pull = b, epoch = 1) => database.observeStandaloneDeliveryPullRequest({ projectId: "project-1",
      executionId: "additional-execution", ownershipEpoch: epoch, pullRequest: pull });
    return { ...f, a, b, proof, observe };
  }

  it("keeps the same Agent writable across repeated merged PRs and synchronizes each exact delivery after restart", async () => {
    const f = await fixture();
    let database = f.database;
    const ownership = { projectId: "project-1", executionId: "additional-execution", ownershipEpoch: 1,
      expectedBranch: "executions/additional-execution" };
    for (const number of [2, 3, 4]) {
      const operations = database.operationsForProject("project-1");
      await expect(operations.assertExecutionOwnership({ ...ownership, operation: "checkpoint" })).resolves.toBeUndefined();
      await expect(operations.assertExecutionOwnership({ ...ownership, operation: "provider.mutate" })).resolves.toBeUndefined();
      const merged = pullRequest({ id: `additional-${number}`, number, executionId: ownership.executionId,
        head: ownership.expectedBranch, base: "main", status: "merged", mergeCommitSha: number.toString(16).repeat(40) });
      database.appendEvent({ ...ownership, agentId: "analyst", invocationId: `turn-${number}`,
        type: "execution.agent_git.fact", payload: { facts: { pushedHeadSha: merged.headSha, pullRequest: merged } } });
      database.observeStandaloneDeliveryPullRequest({ ...ownership, pullRequest: merged });
      // The remote merge is retained while a failed local fetch is retried
      // in the same execution and epoch after a server restart.
      const lease = database.writerLease();
      database.close();
      database = (await stateFixture({ databasePath: f.databasePath, clock: f.clock, writerLease: lease })).database;
      await expect(database.operationsForProject("project-1").assertExecutionOwnership({ ...ownership,
        operation: "provider.reconcile_merged", providerNumber: number, expectedHeadSha: merged.headSha,
        expectedBase: "main", expectedMergeCommitSha: merged.mergeCommitSha })).resolves.toBeUndefined();
      recordLocalMergeSynchronization(database, { executionId: ownership.executionId, ownershipEpoch: 1,
        providerNumber: number, targetBranch: "main", expectedSourceHead: merged.headSha!, mergeCommitSha: merged.mergeCommitSha! });
      const projection = database.projectState("project-1");
      expect(projection.executions[0]).toMatchObject({ status: "merged", ownershipEpoch: 1, pullRequestId: f.a.id });
      expect(projection.pullRequests).toEqual([f.a]);
      expect(projection.additionalPullRequests).toHaveLength(number - 1);
    }
    expect(database.eventsAfter("project-1", 0, 1000).filter(event => event.type === "execution.merged_local_sync.recorded")).toHaveLength(3);
  });

  it.each(["number", "head", "base", "merge", "epoch", "branch", "unmerged"] as const)(
    "rejects mismatched %s during supplemental merge synchronization", async variant => {
      const f = await fixture();
      const merged = { ...f.b, status: variant === "unmerged" ? "open" as const : "merged" as const,
        ...(variant === "unmerged" ? {} : { mergeCommitSha: "c".repeat(40) }) };
      f.proof(merged); f.observe(merged);
      await expect(f.database.operationsForProject("project-1").assertExecutionOwnership({ projectId: "project-1",
        executionId: "additional-execution", ownershipEpoch: variant === "epoch" ? 2 : 1,
        expectedBranch: variant === "branch" ? "executions/foreign" : f.b.head,
        operation: "provider.reconcile_merged", providerNumber: variant === "number" ? 3 : f.b.providerNumber,
        expectedHeadSha: variant === "head" ? f.a.headSha : f.b.headSha,
        expectedBase: variant === "base" ? "groups/foreign" : "main",
        expectedMergeCommitSha: variant === "merge" ? "d".repeat(40) : "c".repeat(40)
      })).rejects.toMatchObject({ code: "GIT_OWNERSHIP_STALE" });
    });

  it("persists independent B and keeps the original PR pointer through restart and history observation", async () => {
    const f = await fixture(), { database, a, b } = f;
    expectStateError(() => database.observePullRequest({ projectId: "project-1", executionId: "additional-execution",
      ownershipEpoch: 1, pullRequest: b }), "IDEMPOTENCY_CONFLICT");
    f.proof(b); expect(f.observe()).toMatchObject({ replay: false, pullRequest: b });
    expect(f.observe()).toMatchObject({ replay: true });
    const merged = { ...b, status: "merged" as const, mergeCommitSha: "c".repeat(40) };
    expect(f.observe(merged)).toMatchObject({ replay: false });
    const before = database.projectState("project-1");
    expect(before.pullRequests).toEqual([a]);
    expect(before.executions[0]).toMatchObject({ ownershipEpoch: 1, pullRequestId: a.id, status: "merged" });
    expect(before.additionalPullRequests).toEqual([{ ...merged, originalPullRequestId: a.id, ownershipEpoch: 1 }]);
    const lease = database.writerLease(); database.close();
    const reopened = (await stateFixture({ databasePath: f.databasePath, clock: f.clock, writerLease: lease })).database;
    expect(reopened.projectState("project-1")).toEqual(before);
    expect(reopened.observeStandaloneDeliveryPullRequest({ projectId: "project-1", executionId: "additional-execution",
      ownershipEpoch: 1, pullRequest: a })).toMatchObject({ replay: true });
    expect(reopened.projectState("project-1").additionalPullRequests).toEqual(before.additionalPullRequests);
    const sql = new DatabaseSync(f.databasePath);
    try {
      expect(sql.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
      expect(() => sql.prepare("UPDATE standalone_delivery_pull_requests SET ownership_epoch=2").run()).toThrow(/immutable/);
      expect(() => sql.prepare("DELETE FROM standalone_delivery_pull_requests").run()).toThrow(/cannot be deleted/);
    } finally { sql.close(); }
  });

  it.each(["original-open", "owner", "epoch", "branch", "base", "original-head", "missing-push", "different-head"] as const)(
    "rejects an additional delivery with invalid %s without changing original facts", async variant => {
      const f = await fixture(variant === "original-open" ? "open" : "merged");
      f.proof(f.b);
      let pull = { ...f.b }, epoch = 1;
      if (variant === "owner") pull.ownerExecutionId = "foreign-owner";
      if (variant === "epoch") epoch = 2;
      if (variant === "branch") pull.head = "executions/foreign";
      if (variant === "base") pull.base = "groups/foreign";
      if (variant === "original-head") pull.headSha = f.a.headSha;
      if (variant === "different-head") pull.headSha = "d".repeat(40);
      if (variant === "missing-push") f.database.appendEvent({ projectId: "project-1", executionId: "additional-execution",
        ownershipEpoch: 1, type: "execution.agent_git.fact", payload: { facts: { pullRequest: f.b } } });
      const before = f.database.projectState("project-1");
      expect(() => f.observe(pull, epoch)).toThrow();
      expect(f.database.projectState("project-1")).toEqual(before);
    });

  it("rejects a duplicate-head PR and any mutation of a merged supplemental identity or head", async () => {
    const f = await fixture(); f.proof(f.b); f.observe();
    const merged = { ...f.b, status: "merged" as const, mergeCommitSha: "c".repeat(40) }; f.observe(merged);
    for (const pull of [
      { ...merged, id: "duplicate-head", providerNumber: 3 },
      { ...merged, providerNumber: 3 },
      { ...merged, headSha: "d".repeat(40) },
      { ...merged, mergeCommitSha: "e".repeat(40) },
      { ...merged, status: "open" as const }
    ]) {
      f.proof(pull); const before = f.database.projectState("project-1");
      expect(() => f.observe(pull)).toThrow();
      expect(f.database.projectState("project-1")).toEqual(before);
    }
  });

  it("rejects a foreign v24 migration before changing schema or original records", async () => {
    const f = await fixture(), lease = f.database.writerLease(); f.database.close();
    const sql = new DatabaseSync(f.databasePath);
    try {
      sql.exec("DROP TABLE standalone_delivery_pull_requests; UPDATE collaboration_state_meta SET schema_version=24");
      const before = sql.prepare("SELECT type,name,sql FROM sqlite_schema ORDER BY type,name").all();
      expect(() => initializeCollaborationStateSchema(sql, { writerLease: { ...lease, instanceId: "foreign" }, nowMs: f.clock.value })).toThrow(/lease/i);
      expect(sql.prepare("SELECT type,name,sql FROM sqlite_schema ORDER BY type,name").all()).toEqual(before);
      expect(sql.prepare("SELECT schema_version FROM collaboration_state_meta").get()).toEqual({ schema_version: 24 });
    } finally { sql.close(); }
  });

  it("rolls back failed v24 supplemental-storage DDL under its exact writer", async () => {
    const f = await fixture(), lease = f.database.writerLease(); f.database.close();
    const sql = new DatabaseSync(f.databasePath);
    try {
      sql.exec("DROP TABLE standalone_delivery_pull_requests; UPDATE collaboration_state_meta SET schema_version=24; CREATE VIEW standalone_delivery_pull_requests AS SELECT 1 AS fixture");
      const before = sql.prepare("SELECT type,name,sql FROM sqlite_schema ORDER BY type,name").all();
      expect(() => initializeCollaborationStateSchema(sql, { writerLease: lease, nowMs: f.clock.value })).toThrow();
      expect(sql.prepare("SELECT type,name,sql FROM sqlite_schema ORDER BY type,name").all()).toEqual(before);
      expect(sql.prepare("SELECT schema_version FROM collaboration_state_meta").get()).toEqual({ schema_version: 24 });
    } finally { sql.close(); }
  });

  it("adds empty v25 storage under the original v24 writer without rewriting original project records", async () => {
    const f = await fixture(), lease = f.database.writerLease(); f.database.close();
    const sql = new DatabaseSync(f.databasePath);
    sql.exec("DROP TABLE standalone_delivery_pull_requests; UPDATE collaboration_state_meta SET schema_version=24");
    const tables = ["project_heads", "member_executions", "pull_requests", "project_events"];
    const before = tables.map(table => sql.prepare(`SELECT * FROM ${table}`).all()); sql.close();
    const reopened = (await stateFixture({ databasePath: f.databasePath, clock: f.clock, writerLease: lease })).database;
    expect(reopened.verifyHealth().schemaVersion).toBe(COLLABORATION_STATE_SCHEMA_VERSION);
    const after = new DatabaseSync(f.databasePath, { readOnly: true });
    try {
      expect(tables.map(table => after.prepare(`SELECT * FROM ${table}`).all())).toEqual(before);
      expect(after.prepare("SELECT COUNT(*) AS count FROM standalone_delivery_pull_requests").get()).toEqual({ count: 0 });
      expect(after.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
    } finally { after.close(); }
  });
});

describe("Collaboration group activation and scheduling", () => {
  it("fails closed when a Git-enabled ordinary node activates before Git is ready", async () => {
    const { database } = await stateFixture();
    createProject(database, {
      git: {
        enabled: true,
        status: "initializing_local",
        provider: "github"
      }
    });
    expectStateError(
      () => database.activateNode({
        projectId: "project-1",
        nodeRunId: "premature-node-run",
        node: { kind: "agent", nodeId: "analysis-node", agentId: "analyst" },
        activationRequestId: "activate-before-git-ready",
        inputSnapshotRef: "snapshot:premature",
        activatedByAgentId: "main",
        workflowRevision: 1
      }),
      "INVALID_STATE_TRANSITION"
    );
    expect(database.projectState("project-1").activeNodeRunId).toBeUndefined();
  });

  it("runs a Git-enabled standalone Agent through task, main PR, completion, and route outbox", async () => {
    const { database } = await stateFixture();
    createProject(database);
    database.activateNode({
      projectId: "project-1",
      expectedRevision: 1,
      nodeRunId: "standalone-node-run",
      node: { kind: "agent", nodeId: "analysis-node", agentId: "analyst" },
      activationRequestId: "activate-standalone",
      inputSnapshotRef: "snapshot:standalone",
      activatedByAgentId: "main",
      workflowRevision: 1
    });
    const startInput = {
      projectId: "project-1",
      nodeRunId: "standalone-node-run",
      taskId: "standalone-task",
      executionId: "standalone-execution",
      agentId: "analyst",
      assignment: "Produce the ordinary Agent result",
      executionBranch: "executions/standalone-execution",
      worktreePath: "/srv/openfars/git-worktrees/standalone-execution",
      expectedRevision: 2
    };
    expect(database.startStandaloneExecution(startInput)).toMatchObject({
      replay: false,
      task: { status: "working" },
      execution: { status: "working", ownershipEpoch: 1 }
    });
    expect(database.startStandaloneExecution(startInput)).toMatchObject({ replay: true });
    expectStateError(
      () => database.observePullRequest({
        projectId: "project-1",
        executionId: "standalone-execution",
        ownershipEpoch: 1,
        pullRequest: pullRequest({
          id: "standalone-pull-wrong",
          number: 8,
          executionId: "standalone-execution",
          head: "executions/standalone-execution",
          base: "groups/not-main",
          status: "open"
        })
      }),
      "INVALID_STATE_TRANSITION"
    );
    database.observePullRequest({
      projectId: "project-1",
      executionId: "standalone-execution",
      ownershipEpoch: 1,
      pullRequest: pullRequest({
        id: "standalone-pull",
        number: 9,
        executionId: "standalone-execution",
        head: "executions/standalone-execution",
        base: "main",
        status: "merged",
        mergeCommitSha: "9".repeat(40)
      })
    });
    database.completeExecution({
      projectId: "project-1",
      executionId: "standalone-execution",
      ownershipEpoch: 1,
      output: "Standalone PR merged"
    });
    const expectedRevision = database.projectState("project-1").stateRevision;
    const completionInput = {
      projectId: "project-1",
      nodeRunId: "standalone-node-run",
      executionId: "standalone-execution",
      ownershipEpoch: 1,
      output: "Standalone result",
      routeEmissionId: "standalone-route",
      route: { kind: "fixed" as const, targetNodeId: "finish" as const },
      loopTransition: {
        id: "validation_rounds",
        iterations: 2,
        batch: 1,
        totalIterations: 2,
        exhausted: true
      },
      expectedRevision
    };
    expect(database.completeStandaloneNode(completionInput)).toMatchObject({
      replay: false,
      nodeRun: { status: "completed", output: "Standalone result" },
      outbox: { status: "pending", targetNodeId: "finish" }
    });
    expect(database.completeStandaloneNode(completionInput)).toMatchObject({ replay: true });
    const standaloneProjection = database.projectState("project-1");
    expect(standaloneProjection.activeNodeRunId).toBeUndefined();
    expect(standaloneProjection).toMatchObject({
      tasks: [expect.objectContaining({ id: "standalone-task", status: "succeeded" })],
      executions: [expect.objectContaining({ id: "standalone-execution", status: "succeeded" })],
      pullRequests: [expect.objectContaining({ id: "standalone-pull", base: "main" })],
      routeOutbox: [expect.objectContaining({ routeEmissionId: "standalone-route" })]
    });
    expect(standaloneProjection.routeOutbox[0]?.payload.loopTransition).toEqual({
      id: "validation_rounds",
      iterations: 2,
      batch: 1,
      totalIterations: 2,
      exhausted: true
    });
  });

  it("completes Main as a management node without creating a task, execution, or PR", async () => {
    const { database } = await stateFixture();
    createProject(database);
    database.activateNode({
      projectId: "project-1",
      nodeRunId: "main-node-run",
      node: { kind: "agent", nodeId: "main", agentId: "main" },
      activationRequestId: "activate-main",
      inputSnapshotRef: "snapshot:main",
      activatedByAgentId: "analyst",
      workflowRevision: 1
    });
    const input = {
      projectId: "project-1",
      nodeRunId: "main-node-run",
      output: "Main chose the next step",
      routeEmissionId: "main-route",
      route: {
        kind: "weak" as const,
        targetNodeId: "finish" as const,
        selectedByAgentId: "main",
        decisionRequestId: "main-decision-1"
      }
    };
    expect(database.completeManagementNode(input)).toMatchObject({
      replay: false,
      nodeRun: { status: "completed" },
      outbox: {
        targetNodeId: "finish",
        status: "pending",
        selectedByAgentId: "main",
        decisionRequestId: "main-decision-1"
      }
    });
    expect(database.completeManagementNode(input)).toMatchObject({ replay: true });
    expect(database.pendingRoutes("project-1")).toEqual([
      expect.objectContaining({
        routeEmissionId: "main-route",
        selectedByAgentId: "main",
        decisionRequestId: "main-decision-1"
      })
    ]);
    const projection = database.projectState("project-1");
    expect(projection.tasks).toEqual([]);
    expect(projection.executions).toEqual([]);
    expect(projection.pullRequests).toEqual([]);
    expect(projection.routeOutbox).toEqual([
      expect.objectContaining({
        routeEmissionId: "main-route",
        selectedByAgentId: "main",
        decisionRequestId: "main-decision-1"
      })
    ]);
  });

  it("keeps request_user separate and forbids route_to_agent from impersonating completion", async () => {
    const { database } = await stateFixture();
    createProject(database);
    database.activateNode({
      projectId: "project-1",
      nodeRunId: "main-node-run",
      node: { kind: "agent", nodeId: "main", agentId: "main" },
      activationRequestId: "activate-main-control",
      inputSnapshotRef: "snapshot:main-control",
      activatedByAgentId: "analyst",
      workflowRevision: 1
    });
    expect(() => database.revalidateMainRouteControl({
      projectId: "project-1",
      nodeRunId: "main-node-run",
      candidateNodeIds: ["review", "finish"],
      canComplete: true,
      allowFinishRoute: false,
      action: { tool: "route_to_agent", target: "finish" }
    })).toThrow(CollaborationStateError);
    expect(() => database.revalidateMainRouteControl({
      projectId: "project-1",
      nodeRunId: "main-node-run",
      candidateNodeIds: ["review", "finish"],
      canComplete: true,
      allowFinishRoute: false,
      action: { tool: "request_user", message: "Need evidence", rationale: "Ambiguous" }
    })).not.toThrow();
    expect(() => database.revalidateMainRouteControl({
      projectId: "project-1",
      nodeRunId: "main-node-run",
      candidateNodeIds: ["review", "finish"],
      canComplete: true,
      allowFinishRoute: false,
      action: { tool: "complete_project", rationale: "All requirements met" }
    })).not.toThrow();
    expect(() => database.revalidateMainRouteControl({
      projectId: "project-1",
      nodeRunId: "main-node-run",
      candidateNodeIds: ["review", "finish"],
      canComplete: false,
      allowFinishRoute: true,
      action: { tool: "route_to_agent", target: "finish" }
    })).toThrow(CollaborationStateError);
    expect(() => database.revalidateMainRouteControl({
      projectId: "project-1",
      nodeRunId: "main-node-run",
      candidateNodeIds: ["review", "finish"],
      canComplete: false,
      allowFinishRoute: true,
      action: {
        tool: "route_to_agent",
        target: "finish",
        assignment: "Finish with the accepted project result."
      }
    })).not.toThrow();
    expect(() => database.revalidateMainRouteControl({
      projectId: "project-1",
      nodeRunId: "main-node-run",
      candidateNodeIds: ["review", "delivery-group"],
      tasklessRouteNodeIds: ["delivery-group"],
      canComplete: false,
      allowFinishRoute: false,
      action: { tool: "route_to_agent", target: "review" }
    })).toThrow(CollaborationStateError);
    expect(() => database.revalidateMainRouteControl({
      projectId: "project-1",
      nodeRunId: "main-node-run",
      candidateNodeIds: ["review", "delivery-group"],
      tasklessRouteNodeIds: ["delivery-group"],
      canComplete: false,
      allowFinishRoute: false,
      action: { tool: "route_to_agent", target: "delivery-group" }
    })).not.toThrow();
  });

  it("retains the missing-control repair budget across coordinator ownership changes", async () => {
    const { database } = await stateFixture();
    seedGroup(database);
    const group = database.projectState("project-1").groupRuns[0]!;
    for (let attempt = 1; attempt <= 2; attempt += 1) database.appendEvent({
      projectId: "project-1", groupRunId: group.id, nodeRunId: group.nodeRunId, agentId: group.leaderAgentId,
      coordinatorEpoch: 1, invocationId: `invocation-missing-${attempt}`,
      type: "group.control.mechanism_repair.requested", payload: { attempt, missing: ["formal group control decision"] }
    });
    expect(database.groupControlRepairCount("project-1", group.id, group.leaderAgentId)).toBe(2);
    database.confirmCoordinatorStopped({ projectId: "project-1", groupRunId: group.id, coordinatorEpoch: 1,
      reason: "service_restart", evidence: { exactResidentStopped: true } });
    const recovered = database.recoverCoordinatorOwnership({ projectId: "project-1", groupRunId: group.id,
      expectedCoordinatorEpoch: 1, stopped: true, evidence: { exactResidentStopped: true } }).groupRun;
    expect(recovered.coordinatorEpoch).toBe(2);
    expect(database.groupControlRepairCount("project-1", group.id, recovered.leaderAgentId)).toBe(2);
    database.revalidateGroupControl({ projectId: "project-1", groupRunId: group.id, actorAgentId: recovered.leaderAgentId,
      coordinatorEpoch: 2, stateVersion: database.projectState("project-1").stateRevision,
      accepted: { requestId: "accepted-budget-reset", inputId: "input-budget-reset", invocationId: "invocation-budget-reset",
        callId: "call-budget-reset", semanticInputHash: "a".repeat(64) },
      action: { tool: "assign_group_tasks", groupRunId: group.id, coordinatorEpoch: 2,
        tasks: [{ taskId: "task-budget-reset", assignment: "Actual Agent decision", assigneeAgentId: "alice" }] } });
    // A decision alone no longer completes a management round: finish_task
    // must also succeed before the runtime records round completion.
    expect(database.groupControlRepairCount("project-1", group.id, recovered.leaderAgentId)).toBe(2);
    database.appendEvent({ projectId: "project-1", groupRunId: group.id, agentId: recovered.leaderAgentId,
      coordinatorEpoch: 2, type: "group.control.round.completed", payload: { inputId: "input-budget-reset" } });
    expect(database.groupControlRepairCount("project-1", group.id, recovered.leaderAgentId)).toBe(0);
  });

  it("validates finish_task only for the active exact Leader without recording a group decision", async () => {
    const { database } = await stateFixture();
    seedGroup(database);
    const group = database.projectState("project-1").groupRuns[0]!;
    const input = { projectId: "project-1", groupRunId: group.id, actorAgentId: group.leaderAgentId,
      coordinatorEpoch: group.coordinatorEpoch, stateVersion: database.projectState("project-1").stateRevision,
      action: { tool: "finish_task" as const, summary: "Agent-authored completion" } };
    const revision = database.projectState("project-1").revision;
    expect(database.revalidateGroupControl(input)).toBeUndefined();
    expect(database.projectState("project-1").revision).toBe(revision);
    expectStateError(() => database.revalidateGroupControl({ ...input, actorAgentId: "alice" }), "INVALID_STATE_TRANSITION");
    expectStateError(() => database.revalidateGroupControl({ ...input, coordinatorEpoch: 2 }), "STALE_COORDINATOR_EPOCH");
    expectStateError(() => database.revalidateGroupControl({ ...input, accepted: {
      requestId: "cannot-replace-group-decision", inputId: "input-finish", invocationId: "invocation-finish",
      callId: "call-finish", semanticInputHash: "a".repeat(64) } }), "INVALID_STATE_TRANSITION");
    expect(database.projectState("project-1").revision).toBe(revision);
    expect(database.eventsAfter("project-1", 0, 1000).some((event) => event.type === "group.control_action.accepted")).toBe(false);
    database.requestGroupCancellation({ projectId: "project-1", groupRunId: group.id, actorAgentId: group.leaderAgentId,
      reason: "User stopped this group" });
    expectStateError(() => database.revalidateGroupControl(input), "INVALID_STATE_TRANSITION");
  });

  it("atomically accepts one exact group control action with its authority check", async () => {
    const { database } = await stateFixture();
    seedGroup(database);
    const group = database.projectState("project-1").groupRuns[0]!;
    const action = {
      tool: "assign_group_tasks" as const,
      groupRunId: group.id,
      coordinatorEpoch: group.coordinatorEpoch,
      tasks: [{ taskId: "task-accepted", assignment: "Durable assignment", assigneeAgentId: "alice" }]
    };
    const input = {
      projectId: "project-1",
      groupRunId: group.id,
      actorAgentId: group.leaderAgentId,
      coordinatorEpoch: group.coordinatorEpoch,
      stateVersion: database.projectState("project-1").stateRevision,
      accepted: {
        requestId: "accepted-group-semantic-1",
        inputId: "input-group-semantic-1",
        invocationId: "invocation-group-semantic-1",
        callId: "call-group-semantic-1",
        semanticInputHash: "a".repeat(64)
      },
      action
    };
    const before = database.projectState("project-1").stateRevision;
    expect(database.revalidateGroupControl(input)).toMatchObject({
      groupRunId: group.id,
      coordinatorEpoch: 1,
      callId: "call-group-semantic-1",
      action
    });
    expect(database.projectState("project-1").stateRevision).toBe(before + 1);
    expect(database.revalidateGroupControl(input)).toMatchObject({ callId: input.accepted.callId });
    expect(database.projectState("project-1").stateRevision).toBe(before + 1);
    expect(database.acceptedGroupControlAction({
      projectId: "project-1",
      requestId: input.accepted.requestId,
      nodeRunId: group.nodeRunId,
      groupRunId: group.id,
      coordinatorEpoch: group.coordinatorEpoch,
      actorAgentId: group.leaderAgentId,
      inputId: input.accepted.inputId,
      semanticInputHash: input.accepted.semanticInputHash
    })).toMatchObject({ action });
    expect(database.acceptedGroupControlForInput({ projectId: "project-1", groupRunId: group.id,
      actorAgentId: group.leaderAgentId, coordinatorEpoch: 1, inputId: input.accepted.inputId })).toMatchObject({ action });
    expect(database.acceptedGroupControlForInput({ projectId: "project-1", groupRunId: group.id,
      actorAgentId: group.leaderAgentId, coordinatorEpoch: 1, inputId: "different-management-round" })).toBeUndefined();
    expectStateError(() => database.acceptedGroupControlForInput({ projectId: "project-1", groupRunId: group.id,
      actorAgentId: "alice", coordinatorEpoch: 1, inputId: input.accepted.inputId }), "INVALID_STATE_TRANSITION");
    expectStateError(
      () => database.revalidateGroupControl({
        ...input,
        accepted: { ...input.accepted, callId: "call-group-semantic-other" }
      }),
      "IDEMPOTENCY_CONFLICT"
    );
    database.confirmCoordinatorStopped({
      projectId: "project-1",
      groupRunId: group.id,
      coordinatorEpoch: 1,
      reason: "service_restart",
      evidence: { exactResidentStopped: true }
    });
    const recovered = database.recoverCoordinatorOwnership({
      projectId: "project-1",
      groupRunId: group.id,
      expectedCoordinatorEpoch: 1,
      stopped: true,
      evidence: { exactResidentStopped: true }
    }).groupRun;
    const reboundInput = {
      projectId: "project-1",
      groupRunId: group.id,
      sourceCoordinatorEpoch: 1,
      targetCoordinatorEpoch: 2,
      actorAgentId: recovered.leaderAgentId,
      requestId: "accepted-group-semantic-rebound-2",
      inputId: "input-group-semantic-rebound-2",
      invocationId: "invocation-group-semantic-rebound-2",
      stateVersion: database.projectState("project-1").stateRevision,
      semanticInputHash: "c".repeat(64)
    };
    expect(database.rebindAcceptedGroupControlAction(reboundInput)).toMatchObject({
      groupRunId: group.id,
      coordinatorEpoch: 2,
      invocationId: reboundInput.invocationId,
      callId: input.accepted.callId,
      action: {
        tool: "assign_group_tasks",
        groupRunId: group.id,
        coordinatorEpoch: 2
      }
    });
    expect(database.rebindAcceptedGroupControlAction(reboundInput)).toMatchObject({
      coordinatorEpoch: 2,
      callId: input.accepted.callId
    });
    database.assignTasks({
      projectId: "project-1",
      groupRunId: group.id,
      actorAgentId: recovered.leaderAgentId,
      coordinatorEpoch: 2,
      tasks: [{
        id: "task-accepted",
        assignment: "Durable assignment",
        assigneeAgentId: "alice"
      }],
      requestId: "apply-rebound-accepted-task"
    });
    // The source fact cannot authorize another target fact after its business
    // state has already been consumed. Only exact replay of the first rebound
    // request remains valid.
    expect(database.rebindAcceptedGroupControlAction({
      ...reboundInput,
      requestId: "accepted-group-semantic-rebound-after-state-change",
      inputId: "input-group-semantic-rebound-after-state-change",
      invocationId: "invocation-group-semantic-rebound-after-state-change",
      stateVersion: database.projectState("project-1").stateRevision,
      semanticInputHash: "d".repeat(64)
    })).toBeUndefined();
    database.requestGroupCancellation({
      projectId: "project-1",
      groupRunId: group.id,
      actorAgentId: recovered.leaderAgentId,
      reason: "fixture cancellation"
    });
    expectStateError(() => database.revalidateGroupControl({
      ...input,
      coordinatorEpoch: 2,
      stateVersion: reboundInput.stateVersion,
      accepted: {
        requestId: reboundInput.requestId,
        inputId: reboundInput.inputId,
        invocationId: reboundInput.invocationId,
        callId: input.accepted.callId,
        semanticInputHash: reboundInput.semanticInputHash
      },
      action: { ...action, coordinatorEpoch: 2 }
    }), "INVALID_STATE_TRANSITION");
  });

  it("atomically accepts a stable Main action slot independent of transport identities", async () => {
    const { database } = await stateFixture();
    createProject(database);
    database.activateNode({
      projectId: "project-1",
      nodeRunId: "main-accepted-node",
      node: { kind: "agent", nodeId: "main", agentId: "main" },
      activationRequestId: "activate-main-accepted",
      inputSnapshotRef: "snapshot:main-accepted",
      activatedByAgentId: "main",
      workflowRevision: 1
    });
    database.appendEvent({
      projectId: "project-1",
      nodeRunId: "main-accepted-node",
      agentId: "main",
      invocationId: "invocation-main-semantic-1",
      coordinatorEpoch: 1,
      type: "main.route.attempt",
      payload: { attempt: 1 }
    });
    const semanticInputHash = "b".repeat(64);
    const input = {
      projectId: "project-1",
      nodeRunId: "main-accepted-node",
      routeEpoch: 1,
      stateVersion: 1,
      candidateNodeIds: ["finish"],
      canComplete: true,
      allowFinishRoute: false,
      accepted: {
        requestId: `accepted-main-control-${semanticInputHash}-0`,
        inputId: "input-main-semantic-1",
        invocationId: "invocation-main-semantic-1",
        callId: "call-main-semantic-1",
        semanticInputHash,
        sequence: 0
      },
      action: { tool: "complete_project" as const, rationale: "Complete" }
    };
    const fact = database.revalidateMainRouteControl(input);
    expect(fact).toMatchObject({
      nodeRunId: input.nodeRunId,
      routeEpoch: 1,
      callId: input.accepted.callId,
      action: input.action
    });
    const revision = database.projectState("project-1").stateRevision;
    expect(database.revalidateMainRouteControl(input)).toMatchObject({ callId: input.accepted.callId });
    expect(database.projectState("project-1").stateRevision).toBe(revision);
    for (const accepted of [
      { ...input.accepted, inputId: "input-other" },
      { ...input.accepted, invocationId: "invocation-other" },
      { ...input.accepted, callId: "call-other" }
    ]) {
      expect(database.revalidateMainRouteControl({ ...input, accepted })).toMatchObject({
        callId: input.accepted.callId,
        action: input.action
      });
    }
    expectStateError(
      () => database.revalidateMainRouteControl({
        ...input,
        action: { tool: "complete_project", rationale: "Different action in slot zero" }
      }),
      "IDEMPOTENCY_CONFLICT"
    );
    database.appendEvent({
      projectId: "project-1",
      type: "project.cancellation.requested",
      payload: { reason: "fixture cancellation" }
    });
    expectStateError(
      () => database.revalidateMainRouteControl(input),
      "INVALID_STATE_TRANSITION"
    );
  });

  it("accepts one Main decision followed by select_display and conflicts a changed slot", async () => {
    const { database } = await stateFixture();
    const snapshot = {
      ...workflowSnapshot({ agents: ["main", "review"] }),
      allowMainReconfiguration: true
    };
    createProject(database, { workflowSnapshot: snapshot });
    database.activateNode({
      projectId: "project-1",
      nodeRunId: "main-multi-action-node",
      node: { kind: "agent", nodeId: "main", agentId: "main" },
      activationRequestId: "activate-main-multi-action",
      inputSnapshotRef: "snapshot:main-multi-action",
      activatedByAgentId: "main",
      workflowRevision: 1
    });
    database.appendEvent({
      projectId: "project-1",
      nodeRunId: "main-multi-action-node",
      agentId: "main",
      invocationId: "invocation-main-multi",
      coordinatorEpoch: 1,
      type: "main.route.attempt",
      payload: { attempt: 1 }
    });
    const semanticInputHash = "c".repeat(64);
    const base = {
      projectId: "project-1",
      nodeRunId: "main-multi-action-node",
      routeEpoch: 1,
      stateVersion: 1,
      candidateNodeIds: ["finish"],
      canComplete: true,
      allowFinishRoute: false
    };
    const display = {
      tool: "select_display" as const,
      primary: { agent: "review", path: "report.md", title: "Report" },
      items: []
    };
    const complete = { tool: "complete_project" as const, rationale: "Ready" };
    expect(database.revalidateMainRouteControl({
      ...base,
      accepted: {
        requestId: `accepted-main-control-${semanticInputHash}-0`,
        inputId: "stable-input",
        invocationId: "random-invocation-one",
        callId: "complete-call",
        semanticInputHash,
        sequence: 0
      },
      action: complete
    })).toMatchObject({ sequence: 0, action: complete });
    expect(database.revalidateMainRouteControl({
      ...base,
      accepted: {
        requestId: `accepted-main-control-${semanticInputHash}-1`,
        inputId: "another-random-input",
        invocationId: "random-invocation-two",
        callId: "display-call",
        semanticInputHash,
        sequence: 1
      },
      action: display
    })).toMatchObject({ sequence: 1, action: display });
    expect(database.acceptedMainRouteActions({
      projectId: "project-1",
      nodeRunId: "main-multi-action-node"
    })).toMatchObject([
      { sequence: 0, action: complete },
      { sequence: 1, action: display }
    ]);
    expectStateError(
      () => database.revalidateMainRouteControl({
        ...base,
        accepted: {
          requestId: `accepted-main-control-${semanticInputHash}-0`,
          inputId: "changed-input",
          invocationId: "changed-invocation",
          callId: "changed-call",
          semanticInputHash,
          sequence: 0
        },
        action: {
          tool: "request_user",
          message: "Changed terminal",
          rationale: "Must conflict"
        }
      }),
      "IDEMPOTENCY_CONFLICT"
    );
    expectStateError(
      () => database.revalidateMainRouteControl({
        ...base,
        accepted: {
          requestId: `accepted-main-control-${semanticInputHash}-2`,
          inputId: "publish-input",
          invocationId: "publish-invocation",
          callId: "publish-call",
          semanticInputHash,
          sequence: 2
        },
        action: {
          tool: "publish_artifact",
          path: "main.md",
          title: "Forbidden",
          kind: "document",
          description: "Main cannot publish"
        }
      }),
      "INVALID_STATE_TRANSITION"
    );
  });

  it("replays an identical activation and enforces one active outer node", async () => {
    const { database } = await stateFixture();
    createProject(database);
    const activation = groupActivation({ expectedRevision: 1, requestId: "request-activate-1" });
    const first = database.activateGroup(activation);
    expect(first).toMatchObject({ replay: false, revision: 2 });
    expect(first.groupRun).toMatchObject({
      leaderAgentId: "leader",
      memberSnapshot: ["alice", "bob"],
      coordinatorEpoch: 1,
      integrationTarget: "main"
    });

    const replay = database.activateGroup(activation);
    expect(replay).toMatchObject({
      replay: true,
      revision: 2,
      nodeRun: { id: "node-run-1" },
      groupRun: { id: "group-run-1" }
    });
    expectStateError(
      () => database.activateGroup(groupActivation({ optionalTask: "different payload" })),
      "IDEMPOTENCY_CONFLICT"
    );
    expectStateError(
      () => database.activateNode({
        projectId: "project-1",
        nodeRunId: "ordinary-node-run",
        node: { kind: "agent", nodeId: "ordinary-node", agentId: "ordinary" },
        activationRequestId: "activate-ordinary",
        inputSnapshotRef: "snapshot:ordinary",
        activatedByAgentId: "main",
        workflowRevision: 1
      }),
      "ACTIVE_NODE_CONFLICT"
    );
    expect(database.projectState("project-1").activeNodeRunId).toBe("node-run-1");
  });

  it("persists the frozen leader and source identities for every non-group activation origin", async () => {
    const scenarios: Array<{
      name: string;
      origin: ActivateGroupInput["origin"];
      leaderAgentId: string;
      sourceAgentId?: string;
    }> = [
      {
        name: "project input",
        origin: { kind: "project-input" },
        leaderAgentId: "main"
      },
      {
        name: "Main direct",
        origin: { kind: "main-direct" },
        leaderAgentId: "main"
      },
      {
        name: "Main selection retaining an ordinary source",
        origin: { kind: "main-selection", sourceAgentId: "analyst" },
        leaderAgentId: "main",
        sourceAgentId: "analyst"
      },
      {
        name: "ordinary strong route",
        origin: { kind: "agent-route", sourceAgentId: "analyst", route: "strong" },
        leaderAgentId: "analyst",
        sourceAgentId: "analyst"
      },
      {
        name: "ordinary autonomous weak route",
        origin: { kind: "agent-route", sourceAgentId: "analyst", route: "autonomous" },
        leaderAgentId: "analyst",
        sourceAgentId: "analyst"
      }
    ];

    for (const scenario of scenarios) {
      const { database } = await stateFixture();
      createProject(database);
      const activated = database.activateGroup(groupActivation({ origin: scenario.origin }));
      expect(activated.groupRun.leaderAgentId, scenario.name).toBe(scenario.leaderAgentId);
      expect(activated.nodeRun.activatedByAgentId, scenario.name).toBe(scenario.leaderAgentId);
      expect(activated.nodeRun.sourceAgentId, scenario.name).toBe(scenario.sourceAgentId);
      const event = database.eventsAfter("project-1", 0, 100)
        .find((entry) => entry.type === "group.activated");
      expect(event?.payload.origin, scenario.name).toEqual(scenario.origin);
    }
  });

  it("claims FIFO tasks across independent connections while preserving per-member and lane limits", async () => {
    const fixture = await stateFixture();
    seedGroup(fixture.database, {
      tasks: [
        { id: "task-1", assignment: "First task" },
        { id: "task-2", assignment: "Second task" },
        { id: "task-3", assignment: "Third task" }
      ]
    });
    const attached = (await stateFixture({
      databasePath: fixture.databasePath,
      clock: fixture.clock,
      instanceId: "instance-a",
      writerLease: fixture.database.writerLease()
    })).database;

    const alice = claim(fixture.database, "alice", "execution-alice-1");
    const bob = claim(attached, "bob", "execution-bob-1");
    expect(alice?.task).toMatchObject({ id: "task-1", queueOrdinal: 1 });
    expect(bob?.task).toMatchObject({ id: "task-2", queueOrdinal: 2 });
    expect(claim(fixture.database, "alice", "execution-alice-2")).toBeUndefined();

    expect(fixture.database.claimWorkerLane({
      projectId: "project-1",
      executionId: "execution-alice-1",
      ownershipEpoch: 1
    })).toMatchObject({ slot: 1, replay: false });
    expect(attached.claimWorkerLane({
      projectId: "project-1",
      executionId: "execution-bob-1",
      ownershipEpoch: 1
    })).toMatchObject({ slot: 2, replay: false });
    expect(fixture.database.claimManagementLane({
      projectId: "project-1",
      groupRunId: "group-run-1",
      agentId: "leader",
      coordinatorEpoch: 1
    })).toMatchObject({ slot: 1, replay: false });
    expect(fixture.database.substituteMainForFailedLeader({
      projectId: "project-1",
      groupRunId: "group-run-1",
      expectedCoordinatorEpoch: 1
    })).toMatchObject({
      groupRun: { actingCoordinatorId: "main", coordinatorEpoch: 2 }
    });
    expect(fixture.database.claimManagementLane({
      projectId: "project-1",
      groupRunId: "group-run-1",
      agentId: "main",
      coordinatorEpoch: 2
    })).toMatchObject({ slot: 1, replay: false });
    expect(fixture.database.laneAvailability("project-1")).toEqual([
      { lane: "management", capacity: 1, occupied: 1, available: 0 },
      { lane: "worker", capacity: 2, occupied: 2, available: 0 }
    ]);
    expect(fixture.database.projectState("project-1").executions).toHaveLength(2);
  });
});

describe("Collaboration completion and recovery", () => {
  it("orders merged PR facts before success and commits completion with one durable route", async () => {
    const { database } = await stateFixture();
    seedGroup(database, {
      tasks: [
        { id: "task-alice", assignment: "Alice delivery", assigneeAgentId: "alice" },
        { id: "task-bob", assignment: "Bob delivery", assigneeAgentId: "bob" }
      ]
    });
    claim(database, "alice", "execution-alice");
    claim(database, "bob", "execution-bob");
    database.claimManagementLane({
      projectId: "project-1",
      groupRunId: "group-run-1",
      agentId: "leader",
      coordinatorEpoch: 1
    });

    for (const [index, executionId, agent] of [
      [1, "execution-alice", "alice"],
      [2, "execution-bob", "bob"]
    ] as const) {
      database.observePullRequest({
        projectId: "project-1",
        executionId,
        ownershipEpoch: 1,
        pullRequest: pullRequest({
          id: `pull-${agent}`,
          number: index,
          executionId,
          head: `executions/${executionId}`,
          base: "groups/group-run-1",
          status: "merged",
          mergeCommitSha: `${index + 2}`.repeat(40).slice(0, 40)
        })
      });
      database.completeExecution({
        projectId: "project-1",
        executionId,
        ownershipEpoch: 1,
        output: `${agent} completed`
      });
    }

    database.startFinalIntegration({
      projectId: "project-1",
      groupRunId: "group-run-1",
      actorAgentId: "leader",
      coordinatorEpoch: 1,
      ownerAgentId: "alice",
      taskId: "task-final",
      executionId: "execution-final",
      assignment: "Integrate member pull requests",
      executionBranch: "groups/group-run-1",
      worktreePath: "/srv/openfars/git-worktrees/execution-final"
    });
    database.observePullRequest({
      projectId: "project-1",
      executionId: "execution-final",
      ownershipEpoch: 1,
      pullRequest: pullRequest({
        id: "pull-final",
        number: 3,
        executionId: "execution-final",
        head: "groups/group-run-1",
        base: "main",
        status: "merged",
        mergeCommitSha: "f".repeat(40)
      })
    });
    database.completeExecution({
      projectId: "project-1",
      executionId: "execution-final",
      ownershipEpoch: 1,
      output: "Final integration merged"
    });
    database.decideGroupCompletion({
      projectId: "project-1",
      groupRunId: "group-run-1",
      actorAgentId: "leader",
      coordinatorEpoch: 1,
      output: "The collaboration result is complete."
    });

    const expectedRevision = database.projectState("project-1").stateRevision;
    const completionInput = {
      projectId: "project-1",
      groupRunId: "group-run-1",
      nodeRunId: "node-run-1",
      coordinatorEpoch: 1,
      routeEmissionId: "route-emission-1",
      route: { kind: "fixed" as const, targetNodeId: "next-node" },
      expectedRevision
    };
    const completed = database.completeGroup(completionInput);
    expect(completed).toMatchObject({
      replay: false,
      groupRun: { status: "completed", output: "The collaboration result is complete." },
      nodeRun: { status: "completed", routeEmissionId: "route-emission-1" },
      outbox: { status: "pending", deliveryAttempts: 0, targetNodeId: "next-node" }
    });
    expect(database.completeGroup(completionInput)).toMatchObject({ replay: true });
    expect(database.pendingRoutes("project-1")).toHaveLength(1);

    const routeRevision = database.projectState("project-1").stateRevision;
    const delivered = database.deliverRoute({
      projectId: "project-1",
      routeEmissionId: "route-emission-1",
      activationRequestId: "activation-from-route-1",
      expectedRevision: routeRevision
    });
    expect(delivered).toMatchObject({
      delivered: true,
      activationInserted: true,
      outbox: { status: "delivered", deliveryAttempts: 1 }
    });
    expect(database.deliverRoute({
      projectId: "project-1",
      routeEmissionId: "route-emission-1",
      activationRequestId: "activation-from-route-1",
      expectedRevision: routeRevision
    })).toMatchObject({
      delivered: true,
      activationInserted: false,
      outbox: { status: "delivered", deliveryAttempts: 1 }
    });

    const events = database.eventsAfter("project-1");
    for (const executionId of ["execution-alice", "execution-bob", "execution-final"]) {
      const scoped = events.filter((event) => event.executionId === executionId);
      expect(scoped.findIndex((event) => event.type === "pull_request.merged")).toBeLessThan(
        scoped.findIndex((event) => event.type === "execution.succeeded")
      );
    }
    const projection = database.projectState("project-1");
    expect(projection.activeNodeRunId).toBeUndefined();
    expect(projection.routeOutbox).toEqual([
      expect.objectContaining({ routeEmissionId: "route-emission-1", status: "delivered" })
    ]);
    expect(database.laneAvailability("project-1")).toContainEqual({
      lane: "management",
      capacity: 1,
      occupied: 0,
      available: 1
    });
    expectStateError(
      () => database.requestGroupCancellation({
        projectId: "project-1",
        groupRunId: "group-run-1",
        actorAgentId: "main",
        reason: "Too late"
      }),
      "INVALID_STATE_TRANSITION"
    );
  });

  it("requires confirmed stop for handoff and fences every stale execution write", async () => {
    const { database } = await stateFixture();
    seedGroup(database, {
      tasks: [{ id: "task-handoff", assignment: "Retain this task across handoff" }]
    });
    claim(database, "alice", "execution-old");
    database.transitionExecutionStatus({
      projectId: "project-1",
      executionId: "execution-old",
      ownershipEpoch: 1,
      status: "waiting_review",
      waitReason: "the exact model output used for the replacement PR"
    });
    const oldPull = pullRequest({
      id: "pull-handoff-old",
      number: 41,
      executionId: "execution-old",
      head: "executions/execution-old",
      base: "groups/group-run-1",
      status: "open"
    });
    database.observePullRequest({
      projectId: "project-1",
      executionId: "execution-old",
      ownershipEpoch: 1,
      pullRequest: oldPull
    });
    database.requestExecutionStop({
      projectId: "project-1",
      executionId: "execution-old",
      ownershipEpoch: 1,
      reason: "Alice process failed"
    });
    expectStateError(
      () => database.handoffExecution({
        projectId: "project-1",
        groupRunId: "group-run-1",
        taskId: "task-handoff",
        predecessorExecutionId: "execution-old",
        predecessorOwnershipEpoch: 1,
        successorAgentId: "bob",
        successorExecutionId: "execution-new",
        successorBranch: "executions/execution-new",
        successorWorktreePath: "/srv/openfars/git-worktrees/execution-new",
        actorAgentId: "leader",
        coordinatorEpoch: 1
      }),
      "INVALID_STATE_TRANSITION"
    );
    database.appendEvent({
      projectId: "project-1",
      groupRunId: "group-run-1",
      agentId: "alice",
      taskId: "task-handoff",
      executionId: "execution-old",
      ownershipEpoch: 1,
      type: "execution.terminal_stop.prepared",
      payload: { transition: "handoff", checkpointCommit: "a".repeat(40) }
    });
    database.confirmExecutionStopped({
      projectId: "project-1",
      executionId: "execution-old",
      ownershipEpoch: 1,
      stopped: true,
      evidence: { exitCode: 137, processIdentity: "pid:42:start:100" }
    });
    expectStateError(
      () => database.handoffExecution({
        projectId: "project-1",
        groupRunId: "group-run-1",
        taskId: "task-handoff",
        predecessorExecutionId: "execution-old",
        predecessorOwnershipEpoch: 1,
        successorAgentId: "bob",
        successorExecutionId: "execution-new",
        successorBranch: "executions/execution-new",
        successorWorktreePath: "/srv/openfars/git-worktrees/execution-new",
        actorAgentId: "leader",
        coordinatorEpoch: 1
      }),
      "INVALID_STATE_TRANSITION"
    );
    for (const [status, observedAt] of [
      ["conflicted", "2026-09-22T00:01:10.000Z"],
      ["unknown", "2026-09-22T00:01:20.000Z"]
    ] as const) {
      database.observePullRequest({
        projectId: "project-1",
        executionId: "execution-old",
        ownershipEpoch: 1,
        pullRequest: { ...oldPull, status, observedAt }
      });
      expectStateError(
        () => database.handoffExecution({
          projectId: "project-1",
          groupRunId: "group-run-1",
          taskId: "task-handoff",
          predecessorExecutionId: "execution-old",
          predecessorOwnershipEpoch: 1,
          successorAgentId: "bob",
          successorExecutionId: "execution-new",
          successorBranch: "executions/execution-new",
          successorWorktreePath: "/srv/openfars/git-worktrees/execution-new",
          actorAgentId: "leader",
          coordinatorEpoch: 1
        }),
        "INVALID_STATE_TRANSITION"
      );
    }
    database.observePullRequest({
      projectId: "project-1",
      executionId: "execution-old",
      ownershipEpoch: 1,
      pullRequest: { ...oldPull, status: "closed", observedAt: "2026-09-22T00:02:00.000Z" }
    });
    expectStateError(
      () => database.handoffExecution({
        projectId: "project-1",
        groupRunId: "group-run-1",
        taskId: "task-handoff",
        predecessorExecutionId: "execution-old",
        predecessorOwnershipEpoch: 1,
        successorAgentId: "bob",
        successorExecutionId: "execution-new",
        successorBranch: "executions/execution-new",
        successorWorktreePath: "/srv/openfars/git-worktrees/execution-new",
        actorAgentId: "leader",
        coordinatorEpoch: 1
      }),
      "INVALID_STATE_TRANSITION"
    );
    database.appendEvent({
      projectId: "project-1",
      requestId: "handoff-terminal-stop-reconcile-execution-old-41-closed",
      groupRunId: "group-run-1",
      agentId: "alice",
      taskId: "task-handoff",
      executionId: "execution-old",
      ownershipEpoch: 1,
      type: "execution.terminal_stop.prepared",
      payload: {
        transition: "handoff",
        checkpointCommit: "a".repeat(40),
        pullRequestId: oldPull.id,
        pullRequestNumber: oldPull.providerNumber,
        pullRequestUrl: oldPull.htmlUrl,
        pullRequestStatus: "closed",
        pullRequestHead: oldPull.headSha
      }
    });
    const handedOff = database.handoffExecution({
      projectId: "project-1",
      groupRunId: "group-run-1",
      taskId: "task-handoff",
      predecessorExecutionId: "execution-old",
      predecessorOwnershipEpoch: 1,
      successorAgentId: "bob",
      successorExecutionId: "execution-new",
      successorBranch: "executions/execution-new",
      successorWorktreePath: "/srv/openfars/git-worktrees/execution-new",
      actorAgentId: "leader",
      coordinatorEpoch: 1
    });
    expect(handedOff).toMatchObject({
      predecessor: { status: "superseded", successorExecutionId: "execution-new" },
      successor: {
        status: "working",
        ownershipEpoch: 2,
        predecessorExecutionId: "execution-old",
        waitReason: "the exact model output used for the replacement PR"
      },
      task: { status: "working", currentExecutionId: "execution-new" }
    });
    expectStateError(
      () => database.handoffExecution({
        projectId: "project-1",
        groupRunId: "group-run-1",
        taskId: "task-handoff",
        predecessorExecutionId: "execution-old",
        predecessorOwnershipEpoch: 1,
        successorAgentId: "bob",
        successorExecutionId: "execution-new",
        successorBranch: "executions/replayed-under-another-branch",
        successorWorktreePath: "/srv/openfars/git-worktrees/execution-new",
        actorAgentId: "leader",
        coordinatorEpoch: 1
      }),
      "IDEMPOTENCY_CONFLICT"
    );
    expect(database.eventsAfter("project-1").find((event) =>
      event.type === "execution.handed_off" && event.executionId === "execution-old"
    )).toMatchObject({
      payload: {
        failureReason: "Alice process failed",
        retainedPredecessor: {
          executionId: "execution-old",
          branch: "executions/execution-old",
          worktreePath: "/srv/openfars/git-worktrees/execution-old",
          pullRequestId: "pull-handoff-old",
          pullRequestNumber: 41,
          pullRequestStatus: "closed"
        }
      }
    });

    expectStateError(
      () => database.transitionExecutionStatus({
        projectId: "project-1",
        executionId: "execution-old",
        ownershipEpoch: 1,
        status: "working"
      }),
      "STALE_OWNERSHIP_EPOCH"
    );
    expectStateError(
      () => database.appendUsage({
        usageId: "usage-stale",
        projectId: "project-1",
        groupRunId: "group-run-1",
        agentId: "alice",
        taskId: "task-handoff",
        executionId: "execution-old",
        ownershipEpoch: 1,
        inputTokens: 1,
        cachedInputTokens: 0,
        outputTokens: 1,
        totalTokens: 2
      }),
      "STALE_OWNERSHIP_EPOCH"
    );
    expectStateError(
      () => database.appendEvent({
        projectId: "project-1",
        eventId: "event-stale-execution",
        nodeRunId: "node-run-1",
        groupRunId: "group-run-1",
        agentId: "alice",
        taskId: "task-handoff",
        executionId: "execution-old",
        ownershipEpoch: 1,
        type: "execution.late_write",
        payload: {}
      }),
      "STALE_OWNERSHIP_EPOCH"
    );
    expect(database.appendUsage({
      usageId: "usage-current",
      projectId: "project-1",
      groupRunId: "group-run-1",
      agentId: "bob",
      taskId: "task-handoff",
      executionId: "execution-new",
      ownershipEpoch: 2,
      inputTokens: 2,
      cachedInputTokens: 1,
      outputTokens: 3,
      totalTokens: 6
    })).toMatchObject({ replay: false, usage: { ownershipEpoch: 2 } });
  });

  it("durably transports the exact Agent return without finishing it and rejects changed or revoked authority", async () => {
    const { database } = await stateFixture();
    seedGroup(database, { tasks: [{ id: "task-agent-output", assignment: "Produce output", assigneeAgentId: "alice" }] });
    const claimed = claim(database, "alice", "execution-agent-output")!;
    const returned = { projectId: "project-1", executionId: claimed.execution.id, ownershipEpoch: 1,
      agentId: "alice", inputId: "input-agent-output", invocationId: "invocation-agent-output",
      output: "Exact Agent output\nwith a second line\n" };
    expect(database.recordExecutionOutput(returned)).toMatchObject({ replay: false });
    const persisted = database.projectState("project-1");
    expect(persisted.executions.find((item) => item.id === claimed.execution.id))
      .toMatchObject({ status: "working", output: returned.output, waitReason: returned.output });
    expect(persisted.tasks.find((item) => item.id === claimed.task.id)?.status).toBe("working");
    expect(database.eventsAfter("project-1", 0, 1000).filter((event) =>
      event.executionId === claimed.execution.id && event.type === "execution.git_stage.persisted"))
      .toMatchObject([{ invocationId: returned.invocationId, ownershipEpoch: 1,
        payload: { stage: "model_output_persisted", source: "agent_return", inputId: returned.inputId,
          outputSha256: createHash("sha256").update(returned.output).digest("hex") } }]);
    expect(database.recordExecutionOutput(returned)).toMatchObject({ replay: true, revision: persisted.stateRevision });
    expectStateError(() => database.recordExecutionOutput({ ...returned, output: "Another output" }), "IDEMPOTENCY_CONFLICT");
    expectStateError(() => database.recordExecutionOutput({ ...returned, agentId: "bob" }), "INVALID_STATE_TRANSITION");
    expectStateError(() => database.recordExecutionOutput({ ...returned, ownershipEpoch: 2 }), "STALE_OWNERSHIP_EPOCH");
    expect(database.projectState("project-1")).toEqual(persisted);
    database.requestExecutionStop({ projectId: "project-1", executionId: claimed.execution.id, ownershipEpoch: 1, reason: "user paused" });
    const fenced = database.projectState("project-1");
    expectStateError(() => database.recordExecutionOutput({ ...returned, invocationId: "late-invocation", output: "Late return" }), "INVALID_STATE_TRANSITION");
    expect(database.projectState("project-1")).toEqual(fenced);
  });

  it("rejects handoff without an exact-epoch handoff terminal preparation fact", async () => {
    const { database } = await stateFixture();
    seedGroup(database, {
      tasks: [{ id: "task-missing-terminal", assignment: "Do not hand off without evidence" }]
    });
    claim(database, "alice", "execution-missing-terminal");
    database.requestExecutionStop({
      projectId: "project-1",
      executionId: "execution-missing-terminal",
      ownershipEpoch: 1,
      reason: "writer crashed"
    });
    database.appendEvent({
      projectId: "project-1",
      groupRunId: "group-run-1",
      agentId: "alice",
      taskId: "task-missing-terminal",
      executionId: "execution-missing-terminal",
      ownershipEpoch: 1,
      type: "execution.terminal_stop.prepared",
      payload: { transition: "cancellation" }
    });
    database.confirmExecutionStopped({
      projectId: "project-1",
      executionId: "execution-missing-terminal",
      ownershipEpoch: 1,
      stopped: true,
      evidence: { processGroupAbsent: true }
    });
    expectStateError(
      () => database.handoffExecution({
        projectId: "project-1",
        groupRunId: "group-run-1",
        taskId: "task-missing-terminal",
        predecessorExecutionId: "execution-missing-terminal",
        predecessorOwnershipEpoch: 1,
        successorAgentId: "bob",
        successorExecutionId: "execution-after-missing-terminal",
        successorBranch: "executions/execution-after-missing-terminal",
        successorWorktreePath: "/srv/openfars/git-worktrees/execution-after-missing-terminal",
        actorAgentId: "leader",
        coordinatorEpoch: 1
      }),
      "INVALID_STATE_TRANSITION"
    );
  });

  it("rejects merged-PR handoff and finalizes the same stop-confirmed execution", async () => {
    const { database } = await stateFixture();
    seedGroup(database, {
      tasks: [{ id: "task-terminal-merged", assignment: "Retain a merged predecessor" }]
    });
    claim(database, "alice", "execution-terminal-merged");
    database.observePullRequest({
      projectId: "project-1",
      executionId: "execution-terminal-merged",
      ownershipEpoch: 1,
      pullRequest: pullRequest({
        id: "pull-terminal-merged",
        number: 93,
        executionId: "execution-terminal-merged",
        head: "executions/execution-terminal-merged",
        base: "groups/group-run-1",
        status: "merged",
        mergeCommitSha: "6".repeat(40)
      })
    });
    database.requestExecutionStop({
      projectId: "project-1",
      executionId: "execution-terminal-merged",
      ownershipEpoch: 1,
      reason: "writer stopped after provider merge"
    });
    database.appendEvent({
      projectId: "project-1",
      groupRunId: "group-run-1",
      agentId: "alice",
      taskId: "task-terminal-merged",
      executionId: "execution-terminal-merged",
      ownershipEpoch: 1,
      type: "execution.terminal_stop.prepared",
      payload: { transition: "handoff", checkpointCommit: "7".repeat(40) }
    });
    database.confirmExecutionStopped({
      projectId: "project-1",
      executionId: "execution-terminal-merged",
      ownershipEpoch: 1,
      stopped: true,
      evidence: { processGroupAbsent: true }
    });
    expectStateError(() => database.completeStopConfirmedMergedExecution({
      projectId: "project-1",
      groupRunId: "group-run-1",
      executionId: "execution-terminal-merged",
      ownershipEpoch: 1,
      output: "forged local synchronization",
      localSynchronization: localMergeSynchronization({
        executionId: "execution-terminal-merged",
        ownershipEpoch: 1,
        targetBranch: "groups/group-run-1",
        expectedSourceHead: "93".repeat(40).slice(0, 40),
        mergeCommitSha: "6".repeat(40)
      }),
      requestId: "forged-local-sync"
    }), "INVALID_STATE_TRANSITION");
    const mergedSynchronization = recordLocalMergeSynchronization(database, {
      executionId: "execution-terminal-merged",
      ownershipEpoch: 1,
      providerNumber: 93,
      targetBranch: "groups/group-run-1",
      expectedSourceHead: "93".repeat(40).slice(0, 40),
      mergeCommitSha: "6".repeat(40)
    });
    expectStateError(
      () => database.handoffExecution({
        projectId: "project-1",
        groupRunId: "group-run-1",
        taskId: "task-terminal-merged",
        predecessorExecutionId: "execution-terminal-merged",
        predecessorOwnershipEpoch: 1,
        successorAgentId: "bob",
        successorExecutionId: "execution-after-terminal-merged",
        successorBranch: "executions/execution-after-terminal-merged",
        successorWorktreePath: "/srv/openfars/git-worktrees/execution-after-terminal-merged",
        actorAgentId: "leader",
        coordinatorEpoch: 1
      }),
      "INVALID_STATE_TRANSITION"
    );
    expect(database.completeStopConfirmedMergedExecution({
      projectId: "project-1",
      groupRunId: "group-run-1",
      executionId: "execution-terminal-merged",
      ownershipEpoch: 1,
      output: "the merged result",
      localSynchronization: mergedSynchronization,
      requestId: "complete-lost-merge-response"
    })).toMatchObject({
      replay: false,
      execution: { id: "execution-terminal-merged", status: "succeeded", ownershipEpoch: 1 },
      task: { id: "task-terminal-merged", status: "succeeded" }
    });
    expect(database.completeStopConfirmedMergedExecution({
      projectId: "project-1",
      groupRunId: "group-run-1",
      executionId: "execution-terminal-merged",
      ownershipEpoch: 1,
      output: "the merged result",
      localSynchronization: mergedSynchronization,
      requestId: "complete-lost-merge-response"
    })).toMatchObject({ replay: true });
    const revisionAfterCompletion = database.projectState("project-1").revision;
    for (const conflicting of [
      { groupRunId: "another-group" },
      { ownershipEpoch: 2 },
      { output: "different output" },
      { requestId: "different-request" }
    ]) {
      expectStateError(() => database.completeStopConfirmedMergedExecution({
        projectId: "project-1",
        groupRunId: "group-run-1",
        executionId: "execution-terminal-merged",
        ownershipEpoch: 1,
        output: "the merged result",
        localSynchronization: mergedSynchronization,
        requestId: "complete-lost-merge-response",
        ...conflicting
      }), "IDEMPOTENCY_CONFLICT");
      expect(database.projectState("project-1").revision).toBe(revisionAfterCompletion);
    }
    expect(database.projectState("project-1").executions.some((execution) =>
      execution.id === "execution-after-terminal-merged"
    )).toBe(false);
  });

  it("does not replay merged recovery over an ordinary succeeded execution", async () => {
    const { database } = await stateFixture();
    seedGroup(database, {
      tasks: [{ id: "task-ordinary-success", assignment: "Complete normally" }]
    });
    claim(database, "alice", "execution-ordinary-success");
    database.observePullRequest({
      projectId: "project-1",
      executionId: "execution-ordinary-success",
      ownershipEpoch: 1,
      pullRequest: pullRequest({
        id: "pull-ordinary-success",
        number: 94,
        executionId: "execution-ordinary-success",
        head: "executions/execution-ordinary-success",
        base: "groups/group-run-1",
        status: "merged",
        mergeCommitSha: "8".repeat(40)
      })
    });
    database.completeExecution({
      projectId: "project-1",
      executionId: "execution-ordinary-success",
      ownershipEpoch: 1,
      output: "ordinary result"
    });
    const revision = database.projectState("project-1").revision;
    expectStateError(() => database.completeStopConfirmedMergedExecution({
      projectId: "project-1",
      groupRunId: "group-run-1",
      executionId: "execution-ordinary-success",
      ownershipEpoch: 1,
      output: "ordinary result",
      localSynchronization: localMergeSynchronization({
        executionId: "execution-ordinary-success",
        ownershipEpoch: 1,
        targetBranch: "groups/group-run-1",
        expectedSourceHead: "94".repeat(40).slice(0, 40),
        mergeCommitSha: "8".repeat(40)
      }),
      requestId: "not-the-original-completion"
    }), "IDEMPOTENCY_CONFLICT");
    expect(database.projectState("project-1").revision).toBe(revision);
  });

  it.each(["open", "conflicted", "unknown", "merged"] as const)(
    "resumes the original failed %s PR owner only with the current Leader's accepted decision", async (status) => {
      const { database } = await stateFixture();
      seedGroup(database, { tasks: [{ id: "task-coordinated", assignment: "Original work", assigneeAgentId: "alice" }] });
      const original = claim(database, "alice", "execution-coordinated")!.execution;
      database.observePullRequest({ projectId: "project-1", executionId: original.id, ownershipEpoch: 1,
        pullRequest: pullRequest({ id: "pull-coordinated", number: 71, executionId: original.id,
          head: original.executionBranch, base: "groups/group-run-1", status,
          ...(status === "merged" ? { mergeCommitSha: "e".repeat(40) } : {}) }) });
      database.requestExecutionStop({ projectId: "project-1", executionId: original.id, ownershipEpoch: 1,
        reason: "Actual provider failure" });
      database.confirmExecutionStopped({ projectId: "project-1", executionId: original.id, ownershipEpoch: 1,
        stopped: true, evidence: { nativeHandleClosed: true } });
      const group = database.projectState("project-1").groupRuns[0]!;
      const recovery = { projectId: "project-1", groupRunId: group.id, executionId: original.id,
        predecessorOwnershipEpoch: 1, invocationId: "invocation-coordinated-2", requestId: "recover-coordinated" };
      const revisionBefore = database.projectState("project-1").revision;
      expectStateError(() => database.recoverGroupExecution(recovery), "STALE_OWNERSHIP_EPOCH");
      expectStateError(() => database.recoverGroupExecution({ ...recovery,
        coordinationRequestId: "not-an-accepted-Leader-decision" }), "INVALID_STATE_TRANSITION");
      expect(database.projectState("project-1").revision).toBe(revisionBefore);
      const action = { tool: "assign_group_tasks" as const, groupRunId: group.id, coordinatorEpoch: group.coordinatorEpoch,
        tasks: [{ taskId: original.taskId, assignment: "Leader asks the original Agent to inspect its retained PR", assigneeAgentId: "alice" }] };
      const decision = { projectId: "project-1", groupRunId: group.id, actorAgentId: group.leaderAgentId,
        coordinatorEpoch: group.coordinatorEpoch, stateVersion: database.projectState("project-1").stateRevision,
        accepted: { requestId: "accepted-original-owner", inputId: "input-original-owner",
          invocationId: "invocation-Leader", callId: "call-Leader", semanticInputHash: "f".repeat(64) }, action };
      // A legitimate survivor assignment does not authorize transferring the
      // predecessor's existing PR to that survivor.
      database.revalidateGroupControl({ ...decision,
        accepted: { ...decision.accepted, requestId: "accepted-other-owner" },
        action: { ...action, tasks: [{ ...action.tasks[0]!, assigneeAgentId: "bob" }] } });
      expectStateError(() => database.recoverGroupExecution({ ...recovery,
        coordinationRequestId: "accepted-other-owner" }), "INVALID_STATE_TRANSITION");
      database.revalidateGroupControl(decision);
      const recovered = database.recoverGroupExecution({ ...recovery, coordinationRequestId: decision.accepted.requestId });
      expect(recovered).toMatchObject({ replay: false, execution: { id: original.id, taskId: original.taskId,
        agentId: original.agentId, ownershipEpoch: 2, executionBranch: original.executionBranch,
        worktreePath: original.worktreePath, sessionId: original.sessionId } });
      expect(database.projectState("project-1").tasks[0]).toMatchObject({ id: original.taskId,
        currentExecutionId: original.id, status: "working", assignment: action.tasks[0]!.assignment });
      expect(database.projectState("project-1").pullRequests).toHaveLength(1);
      expect(database.projectState("project-1").pullRequests[0]).toMatchObject({ id: "pull-coordinated", status });
      expect(database.eligibleDeliveryMembers("project-1", group.id)).toContain("alice");
      expect(database.eventsAfter("project-1", 0, 1000).find((event) => event.type === "execution.recovered")?.payload)
        .toMatchObject({ recoveryMode: "coordinator_original_owner", coordinationRequestId: decision.accepted.requestId });
      expect(database.recoverGroupExecution({ ...recovery, coordinationRequestId: decision.accepted.requestId }).replay).toBe(true);
      expectStateError(() => database.recoverGroupExecution({ ...recovery, coordinationRequestId: "accepted-other-owner" }),
        "IDEMPOTENCY_CONFLICT");
      expectStateError(() => database.transitionExecutionStatus({ projectId: "project-1", executionId: original.id,
        ownershipEpoch: 1, status: "working" }), "STALE_OWNERSHIP_EPOCH");
    });

  it("rejects an accepted original-owner recovery decision after its PR facts change", async () => {
    const { database } = await stateFixture();
    seedGroup(database, { tasks: [{ id: "task-stale-decision", assignment: "Original work", assigneeAgentId: "alice" }] });
    const original = claim(database, "alice", "execution-stale-decision")!.execution;
    const pull = pullRequest({ id: "pull-stale-decision", number: 72, executionId: original.id,
      head: original.executionBranch, base: "groups/group-run-1", status: "open" });
    database.observePullRequest({ projectId: "project-1", executionId: original.id, ownershipEpoch: 1, pullRequest: pull });
    database.requestExecutionStop({ projectId: "project-1", executionId: original.id, ownershipEpoch: 1, reason: "Provider failure" });
    database.confirmExecutionStopped({ projectId: "project-1", executionId: original.id, ownershipEpoch: 1, stopped: true });
    const group = database.projectState("project-1").groupRuns[0]!;
    database.revalidateGroupControl({ projectId: "project-1", groupRunId: group.id, actorAgentId: group.leaderAgentId,
      coordinatorEpoch: group.coordinatorEpoch, stateVersion: database.projectState("project-1").stateRevision,
      accepted: { requestId: "accepted-stale-owner", inputId: "input-stale-owner", invocationId: "invocation-stale-Leader",
        callId: "call-stale-Leader", semanticInputHash: "f".repeat(64) },
      action: { tool: "assign_group_tasks", groupRunId: group.id, coordinatorEpoch: group.coordinatorEpoch,
        tasks: [{ taskId: original.taskId, assignment: "Continue original work", assigneeAgentId: "alice" }] } });
    database.observePullRequest({ projectId: "project-1", executionId: original.id, ownershipEpoch: 1,
      pullRequest: { ...pull, status: "conflicted" } });
    expectStateError(() => database.recoverGroupExecution({ projectId: "project-1", groupRunId: group.id,
      executionId: original.id, predecessorOwnershipEpoch: 1, invocationId: "invocation-stale-2",
      coordinationRequestId: "accepted-stale-owner" }), "INVALID_STATE_TRANSITION");
    expect(database.projectState("project-1").executions[0]).toMatchObject({ status: "stopped", ownershipEpoch: 1 });
  });

  it("reopens a retained delivery PR and restores restart-only member eligibility", async () => {
    const { database } = await stateFixture();
    seedGroup(database, {
      tasks: [{ id: "task-restart-pr", assignment: "Reconcile the remote PR" }]
    });
    claim(database, "alice", "execution-restart-pr");
    database.observePullRequest({
      projectId: "project-1",
      executionId: "execution-restart-pr",
      ownershipEpoch: 1,
      pullRequest: pullRequest({
        id: "pull-restart-pr",
        number: 41,
        executionId: "execution-restart-pr",
        head: "executions/execution-restart-pr",
        base: "groups/group-run-1",
        status: "open"
      })
    });
    database.requestExecutionStop({
      projectId: "project-1",
      executionId: "execution-restart-pr",
      ownershipEpoch: 1,
      reason: "service_restart_reconcile",
      requestId: "restart-stop-execution-restart-pr-1"
    });
    database.confirmExecutionStopped({
      projectId: "project-1",
      executionId: "execution-restart-pr",
      ownershipEpoch: 1,
      stopped: true,
      evidence: { processGroupAbsent: true }
    });

    const recovered = database.recoverGroupExecution({
      projectId: "project-1",
      groupRunId: "group-run-1",
      executionId: "execution-restart-pr",
      predecessorOwnershipEpoch: 1,
      invocationId: "invocation-restart-pr-epoch-2",
      requestId: "recover-group-pr-epoch-2"
    });
    expect(recovered).toMatchObject({
      replay: false,
      execution: {
        id: "execution-restart-pr",
        ownershipEpoch: 2,
        status: "pr_open",
        invocationId: "invocation-restart-pr-epoch-2"
      }
    });
    expect(database.recoverGroupExecution({
      projectId: "project-1",
      groupRunId: "group-run-1",
      executionId: "execution-restart-pr",
      predecessorOwnershipEpoch: 1,
      invocationId: "invocation-restart-pr-epoch-2",
      requestId: "recover-group-pr-epoch-2"
    })).toMatchObject({ replay: true, execution: { ownershipEpoch: 2 } });
    expect(database.projectState("project-1").tasks.find((task) =>
      task.id === "task-restart-pr"
    )).toMatchObject({ status: "working", currentExecutionId: "execution-restart-pr" });
    expectStateError(
      () => database.transitionExecutionStatus({
        projectId: "project-1",
        executionId: "execution-restart-pr",
        ownershipEpoch: 1,
        status: "working"
      }),
      "STALE_OWNERSHIP_EPOCH"
    );
    database.observePullRequest({
      projectId: "project-1",
      executionId: "execution-restart-pr",
      ownershipEpoch: 2,
      pullRequest: pullRequest({
        id: "pull-restart-pr",
        number: 41,
        executionId: "execution-restart-pr",
        head: "executions/execution-restart-pr",
        base: "groups/group-run-1",
        status: "merged",
        mergeCommitSha: "b".repeat(40)
      })
    });
    database.completeExecution({
      projectId: "project-1",
      executionId: "execution-restart-pr",
      ownershipEpoch: 2,
      output: "Restart-reconciled delivery"
    });
    expect(database.startFinalIntegration({
      projectId: "project-1",
      groupRunId: "group-run-1",
      actorAgentId: "leader",
      coordinatorEpoch: 1,
      ownerAgentId: "alice",
      taskId: "task-after-restart-final",
      executionId: "execution-after-restart-final",
      assignment: "Integrate after the ordinary delivery PR restart",
      executionBranch: "groups/group-run-1",
      worktreePath: "/srv/openfars/git-worktrees/execution-after-restart-final"
    })).toMatchObject({
      execution: {
        id: "execution-after-restart-final",
        agentId: "alice",
        purpose: "final-integration"
      }
    });
  });

  it("replays one unconfirmed stop fact and later accepts an independent confirmed proof", async () => {
    const { database } = await stateFixture();
    seedGroup(database, {
      tasks: [{ id: "task-stop-retry", assignment: "Fence the same process across observations" }]
    });
    claim(database, "alice", "execution-stop-retry");
    database.requestExecutionStop({
      projectId: "project-1",
      executionId: "execution-stop-retry",
      ownershipEpoch: 1,
      reason: "service_restart_reconcile",
      requestId: "restart-stop-execution-stop-retry-1"
    });
    const unconfirmed = {
      projectId: "project-1",
      executionId: "execution-stop-retry",
      ownershipEpoch: 1,
      stopped: false,
      evidence: { processStillPresent: true, processIdentity: "pid:42:start:100" },
      requestId: "restart-stop-unconfirmed-execution-stop-retry-fact-one"
    } as const;
    expect(database.confirmExecutionStopped(unconfirmed)).toMatchObject({
      confirmed: false,
      replay: false,
      execution: { status: "stop_requested", ownershipEpoch: 1 }
    });
    const afterFirstObservation = database.projectState("project-1").stateRevision;
    expect(database.confirmExecutionStopped(unconfirmed)).toMatchObject({
      confirmed: false,
      replay: true,
      revision: afterFirstObservation
    });
    expect(database.confirmExecutionStopped({
      projectId: "project-1",
      executionId: "execution-stop-retry",
      ownershipEpoch: 1,
      stopped: true,
      evidence: { processGroupAbsent: true },
      requestId: "restart-stop-confirmed-execution-stop-retry"
    })).toMatchObject({
      confirmed: true,
      replay: false,
      execution: { status: "stopped", ownershipEpoch: 1 }
    });
    expect(database.eventsAfter("project-1").filter((event) =>
      event.executionId === "execution-stop-retry" &&
      ["execution.stop_unconfirmed", "execution.stop_confirmed"].includes(event.type)
    ).map((event) => event.type)).toEqual([
      "execution.stop_unconfirmed",
      "execution.stop_confirmed"
    ]);
  });

  it("does not restore group eligibility when a real failure reopens a retained pull request", async () => {
    const { database } = await stateFixture();
    seedGroup(database, {
      tasks: [{ id: "task-failed-pr", assignment: "Reconcile a PR after a real failure" }]
    });
    claim(database, "alice", "execution-failed-pr");
    database.observePullRequest({
      projectId: "project-1",
      executionId: "execution-failed-pr",
      ownershipEpoch: 1,
      pullRequest: pullRequest({
        id: "pull-failed-pr",
        number: 42,
        executionId: "execution-failed-pr",
        head: "executions/execution-failed-pr",
        base: "groups/group-run-1",
        status: "open"
      })
    });
    database.requestExecutionStop({
      projectId: "project-1",
      executionId: "execution-failed-pr",
      ownershipEpoch: 1,
      reason: "service_restart_reconcile",
      requestId: "failure-stop-execution-failed-pr-1"
    });
    database.confirmExecutionStopped({
      projectId: "project-1",
      executionId: "execution-failed-pr",
      ownershipEpoch: 1,
      stopped: true,
      evidence: { processGroupAbsent: true }
    });
    database.recoverGroupExecution({
      projectId: "project-1",
      groupRunId: "group-run-1",
      executionId: "execution-failed-pr",
      predecessorOwnershipEpoch: 1,
      invocationId: "invocation-failed-pr-epoch-2"
    });
    database.observePullRequest({
      projectId: "project-1",
      executionId: "execution-failed-pr",
      ownershipEpoch: 2,
      pullRequest: pullRequest({
        id: "pull-failed-pr",
        number: 42,
        executionId: "execution-failed-pr",
        head: "executions/execution-failed-pr",
        base: "groups/group-run-1",
        status: "merged",
        mergeCommitSha: "c".repeat(40)
      })
    });
    database.completeExecution({
      projectId: "project-1",
      executionId: "execution-failed-pr",
      ownershipEpoch: 2,
      output: "Failed member PR reconciled without restoring eligibility"
    });
    expectStateError(
      () => database.startFinalIntegration({
        projectId: "project-1",
        groupRunId: "group-run-1",
        actorAgentId: "leader",
        coordinatorEpoch: 1,
        ownerAgentId: "alice",
        taskId: "task-failed-member-final",
        executionId: "execution-failed-member-final",
        assignment: "Must remain ineligible",
        executionBranch: "groups/group-run-1",
        worktreePath: "/srv/openfars/git-worktrees/execution-failed-member-final"
      }),
      "INVALID_STATE_TRANSITION"
    );
  });

  it("restores survivor eligibility when a service restart fences a group writer before any PR", async () => {
    const { database } = await stateFixture();
    seedGroup(database, {
      tasks: [{ id: "task-restart-no-pr", assignment: "Resume interrupted model work" }]
    });
    const claimed = claim(database, "alice", "execution-restart-no-pr");
    if (!claimed) throw new Error("failed to seed no-PR restart fixture");
    database.requestExecutionStop({
      projectId: "project-1",
      executionId: claimed.execution.id,
      ownershipEpoch: 1,
      reason: "service_restart_reconcile"
    });
    database.confirmExecutionStopped({
      projectId: "project-1",
      executionId: claimed.execution.id,
      ownershipEpoch: 1,
      stopped: true,
      evidence: { residentProcessScanCleared: true }
    });
    expect(database.eligibleDeliveryMembers("project-1", "group-run-1")).not.toContain("alice");
    expect(database.restoreRestartStoppedMemberEligibility({
      projectId: "project-1",
      groupRunId: "group-run-1",
      executionId: claimed.execution.id,
      ownershipEpoch: 1,
      requestId: "restore-restart-survivor"
    })).toMatchObject({
      replay: false
    });
    expect(database.eligibleDeliveryMembers("project-1", "group-run-1")).toContain("alice");
    expect(database.restoreRestartStoppedMemberEligibility({
      projectId: "project-1",
      groupRunId: "group-run-1",
      executionId: claimed.execution.id,
      ownershipEpoch: 1,
      requestId: "restore-restart-survivor"
    })).toMatchObject({ replay: true });
  });

  it("restores every restart-fenced member before one recovered chain can fail", async () => {
    const { database } = await stateFixture();
    seedGroup(database, {
      tasks: [
        { id: "task-restart-many-a", assignment: "Restart A", assigneeAgentId: "alice" },
        { id: "task-restart-many-b", assignment: "Restart B", assigneeAgentId: "bob" }
      ]
    });
    const alice = claim(database, "alice", "execution-restart-many-a");
    const bob = claim(database, "bob", "execution-restart-many-b");
    if (!alice || !bob) throw new Error("failed to seed parallel restart executions");
    for (const execution of [alice.execution, bob.execution]) {
      database.requestExecutionStop({
        projectId: "project-1",
        executionId: execution.id,
        ownershipEpoch: 1,
        reason: "service_restart_reconcile"
      });
      database.appendEvent({
        projectId: "project-1",
        groupRunId: "group-run-1",
        agentId: execution.agentId,
        taskId: execution.taskId,
        executionId: execution.id,
        ownershipEpoch: 1,
        type: "execution.terminal_stop.prepared",
        payload: { transition: "handoff", reason: "service_restart_reconcile" }
      });
      database.confirmExecutionStopped({
        projectId: "project-1",
        executionId: execution.id,
        ownershipEpoch: 1,
        stopped: true,
        evidence: { residentProcessScanCleared: true }
      });
    }
    for (const execution of [alice.execution, bob.execution]) {
      database.restoreRestartStoppedMemberEligibility({
        projectId: "project-1",
        groupRunId: "group-run-1",
        executionId: execution.id,
        ownershipEpoch: 1,
        requestId: `restore-${execution.id}`
      });
    }
    const successor = database.handoffExecution({
      projectId: "project-1",
      groupRunId: "group-run-1",
      taskId: alice.task.id,
      predecessorExecutionId: alice.execution.id,
      predecessorOwnershipEpoch: 1,
      successorAgentId: "bob",
      successorExecutionId: "execution-restart-many-successor",
      successorBranch: "executions/execution-restart-many-successor",
      successorWorktreePath: "/srv/openfars/git-worktrees/execution-restart-many-successor",
      actorAgentId: "leader",
      coordinatorEpoch: 1
    }).successor;
    database.requestExecutionStop({
      projectId: "project-1",
      executionId: successor.id,
      ownershipEpoch: successor.ownershipEpoch,
      reason: "recovered successor failed for real"
    });
    database.appendEvent({
      projectId: "project-1",
      groupRunId: "group-run-1",
      agentId: successor.agentId,
      taskId: successor.taskId,
      executionId: successor.id,
      ownershipEpoch: successor.ownershipEpoch,
      type: "execution.terminal_stop.prepared",
      payload: { transition: "handoff", reason: "recovered successor failed for real" }
    });
    database.confirmExecutionStopped({
      projectId: "project-1",
      executionId: successor.id,
      ownershipEpoch: successor.ownershipEpoch,
      stopped: true,
      evidence: { residentProcessScanCleared: true }
    });
    expect(database.eligibleDeliveryMembers("project-1", "group-run-1")).toEqual(["alice"]);
    expectStateError(() => database.pauseAllMembersFailed({
      projectId: "project-1",
      groupRunId: "group-run-1",
      actorAgentId: "leader",
      coordinatorEpoch: 1
    }), "INVALID_STATE_TRANSITION");
  });

  it("finds an exact restart stop beyond 100k events and reopens the same pre-PR execution", async () => {
    const { database, databasePath } = await stateFixture();
    seedGroup(database, {
      tasks: [{ id: "task-large-log-restart", assignment: "Resume the exact pre-PR owner" }]
    });
    const claimed = claim(database, "alice", "execution-large-log-restart");
    if (!claimed) throw new Error("failed to seed large-log restart execution");

    const raw = new DatabaseSync(databasePath);
    try {
      const head = raw.prepare(`
        SELECT next_event_seq, revision FROM project_heads WHERE project_id = ?
      `).get("project-1") as { next_event_seq: number; revision: number } | undefined;
      if (!head) throw new Error("large-log project head is unavailable");
      const insert = raw.prepare(`
        INSERT INTO project_events(
          project_id, seq, event_id, workflow_revision, occurred_at, event_type, payload_json
        ) VALUES ('project-1', ?, ?, 1, ?, 'fixture.padding', '{}')
      `);
      raw.exec("BEGIN IMMEDIATE");
      try {
        const occurredAt = new Date().toISOString();
        for (let offset = 0; offset < 100_050; offset += 1) {
          const seq = Number(head.next_event_seq) + offset;
          insert.run(seq, `evt_padding_${seq}`, occurredAt);
        }
        raw.prepare(`
          UPDATE project_heads
          SET next_event_seq = next_event_seq + 100050,
              revision = revision + 100050
          WHERE project_id = 'project-1'
        `).run();
        raw.exec("COMMIT");
      } catch (error) {
        raw.exec("ROLLBACK");
        throw error;
      }
    } finally {
      raw.close();
    }

    const group = database.projectState("project-1").groupRuns[0]!;
    const leaderLaunch = database.appendEvent({
      projectId: "project-1",
      nodeRunId: group.nodeRunId,
      groupRunId: group.id,
      agentId: group.actingCoordinatorId ?? group.leaderAgentId,
      invocationId: "inv_large_history_leader",
      coordinatorEpoch: group.coordinatorEpoch,
      type: "group.leader.launch.started",
      payload: {
        residentLaunchProtocol: "trusted-supervisor-v1",
        invocationId: "inv_large_history_leader",
        runtimePath: "/srv/openfars/runtime/large-history-leader"
      }
    }).event;
    expect(database.eventsAfter("project-1", 0, 100_000).some((event) =>
      event.type === "group.leader.launch.started"
    )).toBe(false);
    expect(database.groupLeaderLaunchEvidence(
      "project-1",
      group.id,
      group.coordinatorEpoch
    )).toEqual(leaderLaunch);
    expect(database.latestGroupLeaderLaunch("project-1", group.id,
      group.actingCoordinatorId ?? group.leaderAgentId, group.coordinatorEpoch)).toEqual(leaderLaunch);
    expect(database.latestGroupLeaderLaunch("project-1", group.id,
      "another-coordinator", group.coordinatorEpoch)).toBeUndefined();
    expect(database.latestGroupLeaderLaunch("project-1", "another-group",
      group.actingCoordinatorId ?? group.leaderAgentId, group.coordinatorEpoch)).toBeUndefined();
    expect(database.latestGroupLeaderLaunch("project-1", group.id,
      group.actingCoordinatorId ?? group.leaderAgentId, group.coordinatorEpoch - 1)).toBeUndefined();

    const authorizationOutput = "EXACT LARGE-LOG AUTHORIZATION OUTPUT";
    database.transitionExecutionStatus({
      projectId: "project-1",
      executionId: claimed.execution.id,
      ownershipEpoch: 1,
      status: "working",
      waitReason: authorizationOutput
    });
    database.transitionExecutionStatus({
      projectId: "project-1",
      executionId: claimed.execution.id,
      ownershipEpoch: 1,
      status: "waiting_review",
      waitReason: authorizationOutput
    });
    database.appendEvent({
      projectId: "project-1",
      groupRunId: "group-run-1",
      agentId: claimed.execution.agentId,
      taskId: claimed.execution.taskId,
      executionId: claimed.execution.id,
      ownershipEpoch: 1,
      type: "execution.git_stage.persisted",
      payload: {
        stage: "model_output_persisted",
        outputSha256: createHash("sha256").update(authorizationOutput).digest("hex")
      }
    });
    database.transitionExecutionStatus({
      projectId: "project-1",
      executionId: claimed.execution.id,
      ownershipEpoch: 1,
      status: "waiting_authorization",
      waitReason: authorizationOutput
    });
    expect(database.executionHasRecoverableAuthorizationOutput(
      "project-1",
      claimed.execution.id,
      1
    )).toBe(true);
    expect(database.eventsAfter("project-1", 0, 100_000).some((event) =>
      event.executionId === claimed.execution.id &&
      event.type === "execution.git_stage.persisted"
    )).toBe(false);
    database.transitionExecutionStatus({
      projectId: "project-1",
      executionId: claimed.execution.id,
      ownershipEpoch: 1,
      status: "working",
      waitReason: authorizationOutput
    });
    expect(database.executionHasRecoverableAuthorizationOutput(
      "project-1",
      claimed.execution.id,
      1
    )).toBe(false);

    database.requestExecutionStop({
      projectId: "project-1",
      executionId: claimed.execution.id,
      ownershipEpoch: 1,
      reason: "service_restart_reconcile",
      requestId: "restart-stop-execution-large-log-restart-1"
    });
    database.appendEvent({
      projectId: "project-1",
      groupRunId: "group-run-1",
      agentId: claimed.execution.agentId,
      taskId: claimed.execution.taskId,
      executionId: claimed.execution.id,
      ownershipEpoch: 1,
      type: "execution.terminal_stop.prepared",
      payload: { transition: "handoff", reason: "service_restart_reconcile" }
    });
    database.confirmExecutionStopped({
      projectId: "project-1",
      executionId: claimed.execution.id,
      ownershipEpoch: 1,
      stopped: true,
      evidence: { processGroupAbsent: true }
    });

    expect(database.eventsAfter("project-1", 0, 100_000).some((event) =>
      event.executionId === claimed.execution.id &&
      event.type === "execution.stop_requested"
    )).toBe(false);
    expect(database.latestExecutionStopRequest(
      "project-1",
      claimed.execution.id,
      1
    )?.payload.reason).toBe("service_restart_reconcile");
    const recovered = database.recoverGroupExecution({
      projectId: "project-1",
      groupRunId: "group-run-1",
      executionId: claimed.execution.id,
      predecessorOwnershipEpoch: 1,
      invocationId: "invocation-large-log-restart-epoch-2",
      residentLaunchProtocol: "trusted-supervisor-v1",
      requestId: "restart-no-remote-execution-large-log-restart-2"
    }).execution;
    expect(recovered).toMatchObject({
      id: claimed.execution.id,
      ownershipEpoch: 2,
      status: "working",
      executionBranch: claimed.execution.executionBranch,
      worktreePath: claimed.execution.worktreePath
    });
    expect(database.eventsAfter("project-1", 100_000, 10_000).find((event) =>
      event.executionId === claimed.execution.id &&
      event.type === "execution.recovered"
    )?.payload.recoveryMode).toBe("restart_no_remote");
  }, 20_000);

  it("reopens the same merged owner after stop proof so the Agent can explicitly finish", async () => {
    const { database } = await stateFixture();
    seedGroup(database, {
      tasks: [{ id: "task-restart-merged", assignment: "Do not reopen merged work" }]
    });
    const claimed = claim(database, "alice", "execution-restart-merged");
    if (!claimed) throw new Error("failed to seed merged restart fixture");
    database.observePullRequest({
      projectId: "project-1",
      executionId: claimed.execution.id,
      ownershipEpoch: 1,
      pullRequest: pullRequest({
        id: "pull-restart-merged",
        number: 142,
        executionId: claimed.execution.id,
        head: claimed.execution.executionBranch,
        base: "groups/group-run-1",
        status: "merged",
        mergeCommitSha: "d".repeat(40)
      })
    });
    database.requestExecutionStop({
      projectId: "project-1",
      executionId: claimed.execution.id,
      ownershipEpoch: 1,
      reason: "service_restart_reconcile"
    });
    database.confirmExecutionStopped({
      projectId: "project-1",
      executionId: claimed.execution.id,
      ownershipEpoch: 1,
      stopped: true,
      evidence: { residentProcessScanCleared: true }
    });
    const recovered = database.recoverGroupExecution({
      projectId: "project-1", groupRunId: "group-run-1", executionId: claimed.execution.id,
      predecessorOwnershipEpoch: 1, invocationId: "invocation-original-agent-resume",
      requestId: "recover-original-merged-owner"
    }).execution;
    expect(recovered).toMatchObject({ id: claimed.execution.id, agentId: "alice", status: "merged",
      ownershipEpoch: 2, executionBranch: claimed.execution.executionBranch,
      worktreePath: claimed.execution.worktreePath });
    expect(database.projectState("project-1").tasks.find((task) => task.id === claimed.execution.taskId))
      .toMatchObject({ currentExecutionId: claimed.execution.id, status: "working" });
    expect(database.projectState("project-1").executions).toHaveLength(1);
    expect(database.projectState("project-1").pullRequests).toHaveLength(1);
    // Exercise production S ownership validation for an explicit live-Agent
    // reconciliation; a fake Git facade alone cannot prove this boundary.
    expect(recordLocalMergeSynchronization(database, { executionId: claimed.execution.id,
      ownershipEpoch: 2, providerNumber: 142, targetBranch: "groups/group-run-1",
      expectedSourceHead: "142".repeat(40).slice(0, 40), mergeCommitSha: "d".repeat(40)
    }).status).toBe("synchronized");
    expectStateError(() => database.completeExecution({ projectId: "project-1", executionId: claimed.execution.id,
      ownershipEpoch: 1 }), "STALE_OWNERSHIP_EPOCH");
  });

  it("hands final integration through a unique repair branch after migrating retained v1 history", async () => {
    const fixture = await stateFixture();
    let database = fixture.database;
    seedGroup(database, {
      tasks: [{ id: "task-before-final", assignment: "Complete delivery first", assigneeAgentId: "alice" }]
    });
    claim(database, "alice", "execution-before-final");
    database.observePullRequest({
      projectId: "project-1",
      executionId: "execution-before-final",
      ownershipEpoch: 1,
      pullRequest: pullRequest({
        id: "pull-before-final",
        number: 39,
        executionId: "execution-before-final",
        head: "executions/execution-before-final",
        base: "groups/group-run-1",
        status: "merged",
        mergeCommitSha: "f".repeat(40)
      })
    });
    database.completeExecution({
      projectId: "project-1",
      executionId: "execution-before-final",
      ownershipEpoch: 1,
      output: "delivery complete"
    });
    const final = database.startFinalIntegration({
      projectId: "project-1",
      groupRunId: "group-run-1",
      actorAgentId: "leader",
      coordinatorEpoch: 1,
      ownerAgentId: "bob",
      taskId: "task-final-handoff",
      executionId: "execution-final-old",
      assignment: "Integrate retained group work",
      executionBranch: "groups/group-run-1",
      worktreePath: "/srv/openfars/git-worktrees/execution-final-old"
    });
    database.requestExecutionStop({
      projectId: "project-1",
      executionId: final.execution.id,
      ownershipEpoch: 1,
      reason: "final owner crashed"
    });
    database.appendEvent({
      projectId: "project-1",
      groupRunId: "group-run-1",
      agentId: "bob",
      taskId: "task-final-handoff",
      executionId: final.execution.id,
      ownershipEpoch: 1,
      type: "execution.terminal_stop.prepared",
      payload: { transition: "handoff", checkpointCommit: "e".repeat(40) }
    });
    database.confirmExecutionStopped({
      projectId: "project-1",
      executionId: final.execution.id,
      ownershipEpoch: 1,
      stopped: true,
      evidence: { processGroupAbsent: true }
    });
    const handedOff = database.handoffExecution({
      projectId: "project-1",
      groupRunId: "group-run-1",
      taskId: "task-final-handoff",
      predecessorExecutionId: "execution-final-old",
      predecessorOwnershipEpoch: 1,
      successorAgentId: "alice",
      successorExecutionId: "execution-final-repair",
      successorBranch: "executions/execution-final-repair",
      successorWorktreePath: "/srv/openfars/git-worktrees/execution-final-repair",
      actorAgentId: "leader",
      coordinatorEpoch: 1
    });
    expect(handedOff).toMatchObject({
      predecessor: {
        id: "execution-final-old",
        status: "superseded",
        executionBranch: "groups/group-run-1"
      },
      successor: {
        id: "execution-final-repair",
        status: "working",
        purpose: "final-integration",
        executionBranch: "executions/execution-final-repair",
        predecessorExecutionId: "execution-final-old"
      }
    });
    expect(database.projectState("project-1").groupRuns[0]).toMatchObject({
      integrationOwnerExecutionId: "execution-final-repair"
    });
    expectStateError(() => database.observePullRequest({
      projectId: "project-1",
      executionId: "execution-final-repair",
      ownershipEpoch: 2,
      pullRequest: pullRequest({
        id: "pull-final-repair-direct-main",
        number: 400,
        executionId: "execution-final-repair",
        head: "executions/execution-final-repair",
        base: "main",
        status: "open"
      })
    }), "INVALID_STATE_TRANSITION");
    database.observePullRequest({
      projectId: "project-1",
      executionId: "execution-final-repair",
      ownershipEpoch: 2,
      pullRequest: pullRequest({
        id: "pull-final-repair",
        number: 40,
        executionId: "execution-final-repair",
        head: "executions/execution-final-repair",
        base: "groups/group-run-1",
        status: "merged",
        mergeCommitSha: "d".repeat(40)
      })
    });
    database.completeExecution({
      projectId: "project-1",
      executionId: "execution-final-repair",
      ownershipEpoch: 2,
      output: "repaired final output"
    });
    expectStateError(
      () => database.decideGroupCompletion({
        projectId: "project-1",
        groupRunId: "group-run-1",
        actorAgentId: "leader",
        coordinatorEpoch: 1,
        output: "must not complete from a repair PR"
      }),
      "INVALID_STATE_TRANSITION"
    );

    // Reproduce the exact v1 layout at the transition boundary: the retained
    // canonical predecessor owns the globally unique group branch, while the
    // repair uses its fenced execution branch. Migration must remove that
    // historical uniqueness so the next legal canonical epoch can reuse the
    // group branch without deleting or rewriting its predecessor.
    const lease = database.writerLease();
    database.close();
    openDatabases.splice(openDatabases.indexOf(database), 1);
    downgradeCollaborationSchemaToV1(fixture.databasePath);
    database = (await stateFixture({
      databasePath: fixture.databasePath,
      clock: fixture.clock,
      instanceId: "instance-a",
      writerLease: lease
    })).database;
    const canonical = database.startCanonicalFinalRetry({
      projectId: "project-1",
      groupRunId: "group-run-1",
      repairExecutionId: "execution-final-repair",
      repairOwnershipEpoch: 2,
      ownerAgentId: "alice",
      executionId: "execution-final-canonical-retry",
      executionBranch: "groups/group-run-1",
      worktreePath: "/srv/openfars/git-worktrees/execution-final-canonical-retry",
      invocationId: "invocation-final-canonical-retry",
      actorAgentId: "leader",
      coordinatorEpoch: 1
    });
    expect(canonical).toMatchObject({
      execution: {
        id: "execution-final-canonical-retry",
        ownershipEpoch: 3,
        executionBranch: "groups/group-run-1",
        predecessorExecutionId: "execution-final-repair",
        waitReason: "repaired final output"
      },
      task: { status: "working", currentExecutionId: "execution-final-canonical-retry" }
    });
    expectStateError(
      () => database.startCanonicalFinalRetry({
        projectId: "project-1",
        groupRunId: "group-run-1",
        repairExecutionId: "execution-final-repair",
        repairOwnershipEpoch: 2,
        ownerAgentId: "alice",
        executionId: "execution-final-canonical-retry",
        executionBranch: "groups/group-run-1",
        worktreePath: "/srv/openfars/git-worktrees/replayed-elsewhere",
        invocationId: "invocation-final-canonical-retry",
        actorAgentId: "leader",
        coordinatorEpoch: 1
      }),
      "IDEMPOTENCY_CONFLICT"
    );
    const retryGroup = database.projectState("project-1").groupRuns[0]!;
    expect(retryGroup).toMatchObject({
      integrationOwnerExecutionId: "execution-final-canonical-retry"
    });
    expect(retryGroup.finalPullRequestId).toBeUndefined();
    database.requestExecutionStop({
      projectId: "project-1",
      executionId: canonical.execution.id,
      ownershipEpoch: 3,
      reason: "service_restart_reconcile"
    });
    database.appendEvent({
      projectId: "project-1",
      groupRunId: "group-run-1",
      agentId: canonical.execution.agentId,
      taskId: canonical.execution.taskId,
      executionId: canonical.execution.id,
      ownershipEpoch: 3,
      type: "execution.terminal_stop.prepared",
      payload: { transition: "handoff", checkpointCommit: "5".repeat(40) }
    });
    database.confirmExecutionStopped({
      projectId: "project-1",
      executionId: canonical.execution.id,
      ownershipEpoch: 3,
      stopped: true,
      evidence: { processGroupAbsent: true }
    });
    expect(database.recoverCanonicalFinalRetry({
      projectId: "project-1",
      groupRunId: "group-run-1",
      executionId: canonical.execution.id,
      predecessorOwnershipEpoch: 3,
      invocationId: "invocation-final-canonical-restart",
      requestId: "recover-final-canonical-restart"
    })).toMatchObject({
      replay: false,
      execution: {
        id: "execution-final-canonical-retry",
        ownershipEpoch: 4,
        status: "queued",
        executionBranch: "groups/group-run-1",
        predecessorExecutionId: "execution-final-repair",
        waitReason: "repaired final output"
      }
    });
  });

  it("resumes coordination after all-member failure and waits for the Leader to select a canonical writer", async () => {
    const { database } = await stateFixture();
    seedGroup(database, {
      tasks: [{ id: "task-before-all-failed", assignment: "Seed group", assigneeAgentId: "alice" }]
    });
    const delivery = claim(database, "alice", "execution-before-all-failed");
    if (!delivery) throw new Error("failed to seed delivery before final recovery");
    database.observePullRequest({
      projectId: "project-1",
      executionId: delivery.execution.id,
      ownershipEpoch: 1,
      pullRequest: pullRequest({
        id: "pull-before-all-failed",
        number: 90,
        executionId: delivery.execution.id,
        head: delivery.execution.executionBranch,
        base: "groups/group-run-1",
        status: "merged",
        mergeCommitSha: "8".repeat(40)
      })
    });
    database.completeExecution({
      projectId: "project-1",
      executionId: delivery.execution.id,
      ownershipEpoch: 1,
      output: "group seeded"
    });
    const final = database.startFinalIntegration({
      projectId: "project-1",
      groupRunId: "group-run-1",
      actorAgentId: "leader",
      coordinatorEpoch: 1,
      ownerAgentId: "bob",
      taskId: "task-final-all-failed",
      executionId: "execution-final-all-failed",
      assignment: "Publish the group result",
      executionBranch: "groups/group-run-1",
      worktreePath: "/srv/openfars/git-worktrees/execution-final-all-failed"
    });
    database.requestExecutionStop({
      projectId: "project-1",
      executionId: final.execution.id,
      ownershipEpoch: 1,
      reason: "canonical owner failed"
    });
    database.appendEvent({
      projectId: "project-1",
      groupRunId: "group-run-1",
      agentId: "bob",
      taskId: final.task.id,
      executionId: final.execution.id,
      ownershipEpoch: 1,
      type: "execution.terminal_stop.prepared",
      payload: { transition: "handoff", checkpointCommit: "1".repeat(40) }
    });
    database.confirmExecutionStopped({
      projectId: "project-1",
      executionId: final.execution.id,
      ownershipEpoch: 1,
      stopped: true,
      evidence: { processGroupAbsent: true }
    });
    const repair = database.handoffExecution({
      projectId: "project-1",
      groupRunId: "group-run-1",
      taskId: final.task.id,
      predecessorExecutionId: final.execution.id,
      predecessorOwnershipEpoch: 1,
      successorAgentId: "alice",
      successorExecutionId: "execution-final-all-failed-repair",
      successorBranch: "executions/execution-final-all-failed-repair",
      successorWorktreePath: "/srv/openfars/git-worktrees/execution-final-all-failed-repair",
      actorAgentId: "leader",
      coordinatorEpoch: 1
    }).successor;
    database.requestExecutionStop({
      projectId: "project-1",
      executionId: repair.id,
      ownershipEpoch: repair.ownershipEpoch,
      reason: "repair merge response was lost"
    });
    database.observePullRequest({
      projectId: "project-1",
      executionId: repair.id,
      ownershipEpoch: repair.ownershipEpoch,
      pullRequest: pullRequest({
        id: "pull-final-all-failed-repair",
        number: 91,
        executionId: repair.id,
        head: repair.executionBranch,
        base: "groups/group-run-1",
        status: "merged",
        mergeCommitSha: "9".repeat(40)
      })
    });
    database.appendEvent({
      projectId: "project-1",
      groupRunId: "group-run-1",
      agentId: "alice",
      taskId: repair.taskId,
      executionId: repair.id,
      ownershipEpoch: repair.ownershipEpoch,
      type: "execution.terminal_stop.prepared",
      payload: { transition: "handoff", checkpointCommit: "2".repeat(40) }
    });
    database.confirmExecutionStopped({
      projectId: "project-1",
      executionId: repair.id,
      ownershipEpoch: repair.ownershipEpoch,
      stopped: true,
      evidence: { processGroupAbsent: true }
    });
    const repairSynchronization = recordLocalMergeSynchronization(database, {
      executionId: repair.id,
      ownershipEpoch: repair.ownershipEpoch,
      providerNumber: 91,
      targetBranch: "groups/group-run-1",
      expectedSourceHead: "91".repeat(40).slice(0, 40),
      mergeCommitSha: "9".repeat(40)
    });
    database.completeStopConfirmedMergedExecution({
      projectId: "project-1",
      groupRunId: "group-run-1",
      executionId: repair.id,
      ownershipEpoch: repair.ownershipEpoch,
      output: "repair already merged",
      localSynchronization: repairSynchronization,
      requestId: "complete-merged-repair"
    });
    database.pauseAllMembersFailed({
      projectId: "project-1",
      groupRunId: "group-run-1",
      actorAgentId: "leader",
      coordinatorEpoch: 1,
      requestId: "pause-after-merged-repair"
    });
    const before = database.projectState("project-1");
    const recovery = {
      projectId: "project-1", groupRunId: "group-run-1", coordinatorEpoch: 1,
      requestId: "resume-coordination-after-merged-repair"
    };
    expect(database.recoverAllMembers(recovery)).toMatchObject({ recovered: true, replay: false });
    expect(database.projectState("project-1").executions).toEqual(before.executions);
    expect(database.projectState("project-1").tasks).toEqual(before.tasks);
    expect(database.recoverAllMembers(recovery)).toMatchObject({ recovered: true, replay: true });
    expectStateError(() => database.recoverAllMembers({ ...recovery, coordinatorEpoch: 2 }), "IDEMPOTENCY_CONFLICT");
    expect(database.projectState("project-1").groupRuns[0]).toMatchObject({
      status: "integrating", integrationOwnerExecutionId: repair.id
    });
    // A publisher exists only after the actual Leader selects it. Reuse the
    // canonical retry mechanism, preserving the already-merged repair.
    const canonical = database.startCanonicalFinalRetry({
      projectId: "project-1", groupRunId: "group-run-1", repairExecutionId: repair.id,
      repairOwnershipEpoch: repair.ownershipEpoch, ownerAgentId: "bob",
      executionId: "execution-final-all-failed-canonical", executionBranch: "groups/group-run-1",
      worktreePath: "/srv/openfars/git-worktrees/execution-final-all-failed-canonical",
      actorAgentId: "leader", coordinatorEpoch: 1,
      invocationId: "invocation-final-all-failed-canonical", residentLaunchProtocol: "trusted-supervisor-v1",
      requestId: "leader-selected-canonical-after-merged-repair"
    }).execution;
    expect(canonical).toMatchObject({ agentId: "bob", ownershipEpoch: 3, predecessorExecutionId: repair.id });
  });

  it("closes a late pull fact with only exact terminal authority before handoff", async () => {
    const { database } = await stateFixture();
    seedGroup(database, {
      tasks: [{ id: "task-late-close", assignment: "Close late pull", assigneeAgentId: "alice" }]
    });
    const claimed = claim(database, "alice", "execution-late-close");
    if (!claimed) throw new Error("failed to claim late-close fixture");
    database.requestExecutionStop({
      projectId: "project-1",
      executionId: claimed.execution.id,
      ownershipEpoch: 1,
      reason: "worker failed before create response"
    });
    database.appendEvent({
      projectId: "project-1",
      groupRunId: "group-run-1",
      agentId: "alice",
      taskId: claimed.task.id,
      executionId: claimed.execution.id,
      ownershipEpoch: 1,
      type: "execution.terminal_stop.prepared",
      payload: {
        transition: "handoff",
        reason: "worker failed before create response",
        checkpointAttempted: true,
        checkpointCommit: "3".repeat(40),
        retainedExecution: claimed.execution.id,
        retainedBranch: claimed.execution.executionBranch,
        retainedWorktreePath: claimed.execution.worktreePath
      }
    });
    database.confirmExecutionStopped({
      projectId: "project-1",
      executionId: claimed.execution.id,
      ownershipEpoch: 1,
      stopped: true,
      evidence: { processGroupAbsent: true }
    });
    const open = pullRequest({
      id: "pull-late-close",
      number: 92,
      executionId: claimed.execution.id,
      head: claimed.execution.executionBranch,
      base: "groups/group-run-1",
      status: "open"
    });
    database.observePullRequest({
      projectId: "project-1",
      executionId: claimed.execution.id,
      ownershipEpoch: 1,
      pullRequest: open
    });
    const operations = database.operationsForProject("project-1");
    await expect(operations.assertExecutionOwnership({
      projectId: "project-1",
      executionId: claimed.execution.id,
      ownershipEpoch: 1,
      expectedBranch: claimed.execution.executionBranch,
      operation: "provider.mutate"
    })).rejects.toMatchObject({ code: "GIT_OWNERSHIP_STALE" });
    await expect(operations.assertExecutionOwnership({
      projectId: "project-1",
      executionId: claimed.execution.id,
      ownershipEpoch: 1,
      expectedBranch: claimed.execution.executionBranch,
      operation: "provider.reconcile_merged"
    })).rejects.toMatchObject({ code: "GIT_OWNERSHIP_STALE" });
    await expect(operations.assertExecutionOwnership({
      projectId: "project-1",
      executionId: claimed.execution.id,
      ownershipEpoch: 2,
      expectedBranch: claimed.execution.executionBranch,
      operation: "provider.close_terminal"
    })).rejects.toMatchObject({ code: "GIT_OWNERSHIP_STALE" });
    await operations.assertExecutionOwnership({
      projectId: "project-1",
      executionId: claimed.execution.id,
      ownershipEpoch: 1,
      expectedBranch: claimed.execution.executionBranch,
      operation: "provider.close_terminal"
    });
    const prepared = await operations.prepare({
      id: "close-late-pull",
      kind: "pull.close",
      payloadHash: "close-late-pull-payload",
      status: "prepared",
      ownerExecutionId: claimed.execution.id,
      ownershipEpoch: 1,
      expectedHead: open.headSha,
      expectedBase: open.base
    });
    await operations.transition({
      id: prepared.id,
      payloadHash: prepared.payloadHash,
      status: "observed",
      remoteFact: { ...open, status: "closed" }
    });
    await operations.transition({
      id: prepared.id,
      payloadHash: prepared.payloadHash,
      status: "finalized",
      remoteFact: { ...open, status: "closed" }
    });
    database.observePullRequest({
      projectId: "project-1",
      executionId: claimed.execution.id,
      ownershipEpoch: 1,
      pullRequest: { ...open, status: "closed" }
    });
    const appendSupplement = (
      payload: Record<string, unknown> = {},
      requestId = "handoff-terminal-stop-reconcile-execution-late-close-92-closed"
    ) => database.appendEvent({
        projectId: "project-1",
        requestId,
        groupRunId: "group-run-1",
        agentId: "alice",
        taskId: claimed.task.id,
        executionId: claimed.execution.id,
        ownershipEpoch: 1,
        type: "execution.terminal_stop.prepared",
        payload: {
        transition: "handoff",
        reason: "worker failed before create response",
        checkpointAttempted: true,
        checkpointCommit: "3".repeat(40),
        retainedExecution: claimed.execution.id,
        retainedBranch: claimed.execution.executionBranch,
        retainedWorktreePath: claimed.execution.worktreePath,
        pullRequestId: open.id,
        pullRequestNumber: open.providerNumber,
        pullRequestUrl: open.htmlUrl,
        pullRequestStatus: "closed",
        pullRequestHead: open.headSha,
        ...payload
        }
      });
    for (const mutation of [
      { checkpointCommit: "4".repeat(40) },
      { pullRequestNumber: open.providerNumber + 1 },
      { pullRequestUrl: `${open.htmlUrl}/wrong` },
      { pullRequestHead: "f".repeat(40) }
    ]) {
      expectStateError(() => appendSupplement(mutation), "INVALID_STATE_TRANSITION");
    }
    expectStateError(
      () => appendSupplement({}, "handoff-terminal-stop-reconcile-wrong-request"),
      "INVALID_STATE_TRANSITION"
    );
    appendSupplement();
    expect(database.handoffExecution({
      projectId: "project-1",
      groupRunId: "group-run-1",
      taskId: claimed.task.id,
      predecessorExecutionId: claimed.execution.id,
      predecessorOwnershipEpoch: 1,
      successorAgentId: "bob",
      successorExecutionId: "execution-after-late-close",
      successorBranch: "executions/execution-after-late-close",
      successorWorktreePath: "/srv/openfars/git-worktrees/execution-after-late-close",
      actorAgentId: "leader",
      coordinatorEpoch: 1
    })).toMatchObject({
      predecessor: { status: "superseded" },
      successor: { id: "execution-after-late-close", status: "working" }
    });
    await expect(operations.assertExecutionOwnership({
      projectId: "project-1",
      executionId: claimed.execution.id,
      ownershipEpoch: 1,
      expectedBranch: claimed.execution.executionBranch,
      operation: "provider.close_terminal"
    })).rejects.toMatchObject({ code: "GIT_OWNERSHIP_STALE" });
  });

  it("allows only checkpoint and terminal-close Git work after stop is requested", async () => {
    const { database } = await stateFixture();
    seedGroup(database, {
      tasks: [{ id: "task-stop-git-fence", assignment: "Fence new provider writes" }]
    });
    const claimed = claim(database, "alice", "execution-stop-git-fence");
    if (!claimed) throw new Error("failed to claim stop-request Git fence execution");
    const preparedBeforeStop = database.prepareOperation("project-1", {
      id: "pull-before-stop",
      kind: "pull.create",
      payloadHash: "pull-before-stop-payload",
      status: "prepared",
      ownerExecutionId: claimed.execution.id,
      ownershipEpoch: claimed.execution.ownershipEpoch,
      expectedHead: "a".repeat(40),
      expectedBase: "groups/group-run-1"
    });
    database.requestExecutionStop({
      projectId: "project-1",
      executionId: claimed.execution.id,
      ownershipEpoch: claimed.execution.ownershipEpoch,
      reason: "cancel fence"
    });

    const operations = database.operationsForProject("project-1");
    await expect(operations.assertExecutionOwnership({
      projectId: "project-1",
      executionId: claimed.execution.id,
      ownershipEpoch: claimed.execution.ownershipEpoch,
      expectedBranch: claimed.execution.executionBranch,
      operation: "provider.mutate"
    })).rejects.toMatchObject({ code: "GIT_OWNERSHIP_STALE" });
    await operations.assertExecutionOwnership({
      projectId: "project-1",
      executionId: claimed.execution.id,
      ownershipEpoch: claimed.execution.ownershipEpoch,
      expectedBranch: claimed.execution.executionBranch,
      operation: "checkpoint"
    });

    const before = database.projectState("project-1");
    for (const kind of ["pull.create", "pull.merge", "memory.commit"] as const) {
      expect(() => database.prepareOperation("project-1", {
        id: `forbidden-after-stop-${kind}`,
        kind,
        payloadHash: `forbidden-after-stop-${kind}-payload`,
        status: "prepared",
        ownerExecutionId: claimed.execution.id,
        ownershipEpoch: claimed.execution.ownershipEpoch,
        expectedHead: "b".repeat(40),
        expectedBase: "groups/group-run-1"
      })).toThrow(/stop-requested execution/);
      expect(database.projectState("project-1").stateRevision).toBe(before.stateRevision);
    }
    expect(database.prepareOperation("project-1", {
      id: "checkpoint-after-stop",
      kind: "git.push",
      payloadHash: "checkpoint-after-stop-payload",
      status: "prepared",
      ownerExecutionId: claimed.execution.id,
      ownershipEpoch: claimed.execution.ownershipEpoch,
      expectedHead: "c".repeat(40),
      expectedBase: claimed.execution.executionBranch
    })).toMatchObject({ kind: "git.push", status: "prepared" });
    // A response arriving after the stop fence must still be journaled for an
    // operation that was durably prepared before the stop request.
    expect(database.transitionOperation("project-1", {
      id: preparedBeforeStop.id,
      payloadHash: preparedBeforeStop.payloadHash,
      status: "observed",
      remoteFact: { provider: "github", providerNumber: 71 }
    })).toMatchObject({ status: "observed" });
  });

  it.each(["open", "unresolved-create"] as const)(
    "restores coordination but refuses handoff across the stopped predecessor %s pull boundary",
    async (boundary) => {
      const { database } = await stateFixture();
      seedGroup(database, {
        tasks: [
          { id: "task-recover-boundary-a", assignment: "Recover A", assigneeAgentId: "alice" },
          { id: "task-recover-boundary-b", assignment: "Recover B", assigneeAgentId: "bob" }
        ]
      });
      const target = claim(database, "alice", "execution-recover-boundary-a");
      const other = claim(database, "bob", "execution-recover-boundary-b");
      if (!target || !other) throw new Error("failed to seed all-member pull boundary");
      if (boundary === "open") {
        database.observePullRequest({
          projectId: "project-1",
          executionId: target.execution.id,
          ownershipEpoch: target.execution.ownershipEpoch,
          pullRequest: pullRequest({
            id: "pull-recover-boundary",
            number: 93,
            executionId: target.execution.id,
            head: target.execution.executionBranch,
            base: "groups/group-run-1",
            status: "open"
          })
        });
      } else {
        database.prepareOperation("project-1", {
          id: "pull-execution-recover-boundary-a",
          kind: "pull.create",
          payloadHash: "recover-boundary-create",
          status: "prepared",
          ownerExecutionId: target.execution.id,
          ownershipEpoch: target.execution.ownershipEpoch,
          expectedHead: "a".repeat(40),
          expectedBase: "groups/group-run-1"
        });
      }
      for (const execution of [target.execution, other.execution]) {
        database.requestExecutionStop({
          projectId: "project-1",
          executionId: execution.id,
          ownershipEpoch: execution.ownershipEpoch,
          reason: "member failed"
        });
        if (execution.id === target.execution.id) {
          database.appendEvent({
            projectId: "project-1",
            groupRunId: "group-run-1",
            agentId: execution.agentId,
            taskId: execution.taskId,
            executionId: execution.id,
            ownershipEpoch: execution.ownershipEpoch,
            type: "execution.terminal_stop.prepared",
            payload: { transition: "handoff", checkpointAttempted: true }
          });
        }
        database.confirmExecutionStopped({
          projectId: "project-1",
          executionId: execution.id,
          ownershipEpoch: execution.ownershipEpoch,
          stopped: true,
          evidence: { processGroupAbsent: true }
        });
      }
      database.pauseAllMembersFailed({
        projectId: "project-1",
        groupRunId: "group-run-1",
        actorAgentId: "leader",
        coordinatorEpoch: 1
      });
      const ownersBefore = database.projectState("project-1").executions;
      expect(database.recoverAllMembers({
        projectId: "project-1", groupRunId: "group-run-1", coordinatorEpoch: 1,
        requestId: `resume-boundary-${boundary}`
      })).toMatchObject({ recovered: true });
      expect(database.projectState("project-1").executions).toEqual(ownersBefore);
      const before = database.projectState("project-1");
      expectStateError(() => database.handoffExecution({
        projectId: "project-1", groupRunId: "group-run-1", taskId: target.task.id,
        predecessorExecutionId: target.execution.id,
        predecessorOwnershipEpoch: target.execution.ownershipEpoch,
        successorAgentId: "bob", successorExecutionId: "execution-recover-boundary-successor",
        successorBranch: "executions/execution-recover-boundary-successor",
        successorWorktreePath: "/srv/openfars/git-worktrees/execution-recover-boundary-successor",
        actorAgentId: "leader", coordinatorEpoch: 1,
        requestId: `recover-boundary-${boundary}`
      }), "INVALID_STATE_TRANSITION");
      const after = database.projectState("project-1");
      expect(after.stateRevision).toBe(before.stateRevision);
      expect(after.executions).toHaveLength(before.executions.length);
      expect(after.executions.some((execution) =>
        execution.id === "execution-recover-boundary-successor"
      )).toBe(false);
    }
  );

  it.each([
    "observed-pull",
    "lost-create",
    "lost-create-head-mismatch",
    "lost-create-mismatch"
  ] as const)(
    "grandfathers only an exact migrated v1 direct-main final repair (%s)",
    async (legacyFact) => {
      const fixture = await stateFixture();
      let database = fixture.database;
      seedGroup(database, {
        tasks: [{ id: "task-legacy-delivery", assignment: "Seed final integration" }]
      });
      const delivery = database.claimNextTask({
        projectId: "project-1",
        groupRunId: "group-run-1",
        agentId: "alice",
        executionId: "execution-legacy-delivery",
        executionBranch: "executions/execution-legacy-delivery",
        worktreePath: "/srv/openfars/git-worktrees/execution-legacy-delivery"
      })!;
      database.observePullRequest({
        projectId: "project-1",
        executionId: delivery.execution.id,
        ownershipEpoch: 1,
        pullRequest: pullRequest({
          id: "pull-legacy-delivery",
          number: 501,
          executionId: delivery.execution.id,
          head: delivery.execution.executionBranch,
          base: "groups/group-run-1",
          status: "merged",
          mergeCommitSha: "a".repeat(40)
        })
      });
      database.completeExecution({
        projectId: "project-1",
        executionId: delivery.execution.id,
        ownershipEpoch: 1,
        output: "delivery complete"
      });
      const final = database.startFinalIntegration({
        projectId: "project-1",
        groupRunId: "group-run-1",
        actorAgentId: "leader",
        coordinatorEpoch: 1,
        ownerAgentId: "bob",
        taskId: "task-legacy-final",
        executionId: "execution-legacy-canonical",
        assignment: "Legacy final integration",
        executionBranch: "groups/group-run-1",
        worktreePath: "/srv/openfars/git-worktrees/execution-legacy-canonical"
      });
      database.requestExecutionStop({
        projectId: "project-1",
        executionId: final.execution.id,
        ownershipEpoch: 1,
        reason: "legacy final owner failed"
      });
      database.appendEvent({
        projectId: "project-1",
        groupRunId: "group-run-1",
        taskId: "task-legacy-final",
        executionId: final.execution.id,
        ownershipEpoch: 1,
        type: "execution.terminal_stop.prepared",
        payload: { transition: "handoff", checkpointCommit: "b".repeat(40) }
      });
      database.confirmExecutionStopped({
        projectId: "project-1",
        executionId: final.execution.id,
        ownershipEpoch: 1,
        stopped: true,
        evidence: { processGroupAbsent: true }
      });
      const repair = database.handoffExecution({
        projectId: "project-1",
        groupRunId: "group-run-1",
        taskId: "task-legacy-final",
        predecessorExecutionId: final.execution.id,
        predecessorOwnershipEpoch: 1,
        successorAgentId: "alice",
        successorExecutionId: "execution-legacy-repair",
        successorBranch: "executions/execution-legacy-repair",
        successorWorktreePath: "/srv/openfars/git-worktrees/execution-legacy-repair",
        actorAgentId: "leader",
        coordinatorEpoch: 1
      }).successor;
      const lease = database.writerLease();
      database.close();
      openDatabases.splice(openDatabases.indexOf(database), 1);
      downgradeCollaborationSchemaToV1(fixture.databasePath);

      const legacy = new DatabaseSync(fixture.databasePath);
      const observedAt = "2026-09-22T00:00:01.000Z";
      if (legacyFact === "observed-pull") {
        legacy.prepare(`
          INSERT INTO pull_requests(
            pull_request_id, project_id, owner_execution_id, provider_number, html_url,
            head, base, status, head_sha, base_sha, merge_commit_sha, observed_at
          ) VALUES (?, ?, ?, ?, ?, ?, 'main', 'open', ?, ?, NULL, ?)
        `).run(
          "pull-legacy-direct-main",
          "project-1",
          repair.id,
          502,
          "https://github.example/pulls/502",
          repair.executionBranch,
          "502".repeat(40).slice(0, 40),
          "b".repeat(40),
          observedAt
        );
        legacy.prepare(`
          UPDATE member_executions SET pull_request_id = ?, status = 'pr_open', updated_at = ?
          WHERE execution_id = ?
        `).run("pull-legacy-direct-main", observedAt, repair.id);
        legacy.prepare(`
          UPDATE group_runs SET final_pull_request_id = ?, updated_at = ?
          WHERE group_run_id = 'group-run-1'
        `).run("pull-legacy-direct-main", observedAt);
      } else {
        const headSha = "c".repeat(40);
        legacy.prepare(`
          INSERT INTO operations(
            operation_id, project_id, kind, payload_hash, status,
            owner_execution_id, ownership_epoch, expected_head, expected_base,
            created_at, updated_at
          ) VALUES (?, ?, 'git.push', ?, 'finalized', ?, ?, ?, ?, ?, ?)
        `).run(
          "operation-legacy-push",
          "project-1",
          "push-payload",
          repair.id,
          repair.ownershipEpoch,
          legacyFact !== "lost-create-mismatch" ? headSha : "e".repeat(40),
          repair.executionBranch,
          observedAt,
          observedAt
        );
        legacy.prepare(`
          INSERT INTO operations(
            operation_id, project_id, kind, payload_hash, status,
            owner_execution_id, ownership_epoch, expected_head, expected_base,
            created_at, updated_at
          ) VALUES (?, ?, 'pull.create', ?, 'uncertain', ?, ?, ?, 'main', ?, ?)
        `).run(
          "operation-legacy-pull-create",
          "project-1",
          "pull-payload",
          repair.id,
          repair.ownershipEpoch,
          headSha,
          observedAt,
          observedAt
        );
      }
      legacy.close();

      database = (await stateFixture({
        databasePath: fixture.databasePath,
        clock: fixture.clock,
        instanceId: "instance-a",
        writerLease: lease
      })).database;
      if (legacyFact === "lost-create-mismatch") {
        expect(database.executionPullBase("project-1", repair.id)).toBe("groups/group-run-1");
        expectStateError(() => database.observePullRequest({
          projectId: "project-1",
          executionId: repair.id,
          ownershipEpoch: repair.ownershipEpoch,
          pullRequest: pullRequest({
            id: "pull-untrusted-direct-main",
            number: 504,
            executionId: repair.id,
            head: repair.executionBranch,
            base: "main",
            status: "open"
          })
        }), "INVALID_STATE_TRANSITION");
        return;
      }
      expect(database.executionPullBase("project-1", repair.id)).toBe("main");
      if (legacyFact === "lost-create-head-mismatch") {
        expectStateError(() => database.observePullRequest({
          projectId: "project-1",
          executionId: repair.id,
          ownershipEpoch: repair.ownershipEpoch,
          pullRequest: {
            ...pullRequest({
              id: "pull-untrusted-sha-direct-main",
              number: 505,
              executionId: repair.id,
              head: repair.executionBranch,
              base: "main",
              status: "open"
            }),
            headSha: "f".repeat(40)
          }
        }), "INVALID_STATE_TRANSITION");
        return;
      }
      const pullId = legacyFact === "observed-pull"
        ? "pull-legacy-direct-main"
        : "pull-legacy-discovered-main";
      database.observePullRequest({
        projectId: "project-1",
        executionId: repair.id,
        ownershipEpoch: repair.ownershipEpoch,
        pullRequest: {
          ...pullRequest({
            id: pullId,
            number: legacyFact === "observed-pull" ? 502 : 503,
            executionId: repair.id,
            head: repair.executionBranch,
            base: "main",
            status: "merged",
            mergeCommitSha: "d".repeat(40)
          }),
          ...(legacyFact === "lost-create" ? { headSha: "c".repeat(40) } : {})
        }
      });
      database.completeExecution({
        projectId: "project-1",
        executionId: repair.id,
        ownershipEpoch: repair.ownershipEpoch,
        output: "legacy direct-main result"
      });
      expect(database.decideGroupCompletion({
        projectId: "project-1",
        groupRunId: "group-run-1",
        actorAgentId: "leader",
        coordinatorEpoch: 1,
        output: "legacy group completed"
      }).groupRun).toMatchObject({
        integrationOwnerExecutionId: repair.id,
        finalPullRequestId: pullId,
        leaderDecision: "complete"
      });
      expect(database.projectState("project-1").executions).toHaveLength(3);
    }
  );

  it("freezes Main-owned collaboration mutation and resumes only from matching facts", async () => {
    const { database } = await stateFixture();
    seedGroup(database, {
      origin: { kind: "project-input" }
    });
    const group = database.projectState("project-1").groupRuns[0]!;
    const facts = {
      groupRunId: group.id,
      nodeRunId: group.nodeRunId,
      coordinatorEpoch: group.coordinatorEpoch,
      groupBranch: group.groupBranch
    };
    const beforeFreeze = database.projectState("project-1").stateRevision;
    expect(database.freezeForMainFailure({
      projectId: "project-1",
      groupRunId: "group-run-1",
      expectedFacts: facts,
      expectedRevision: beforeFreeze
    })).toMatchObject({ frozen: true });
    expect(database.freezeForMainFailure({
      projectId: "project-1",
      groupRunId: "group-run-1",
      expectedFacts: facts,
      expectedRevision: beforeFreeze
    })).toMatchObject({ frozen: true });
    expectStateError(
      () => database.assignTasks({
        projectId: "project-1",
        groupRunId: "group-run-1",
        actorAgentId: "main",
        coordinatorEpoch: 1,
        tasks: [{ id: "task-frozen", assignment: "Must wait for Main recovery" }]
      }),
      "PROJECT_FROZEN"
    );

    expect(database.recoverMain({
      projectId: "project-1",
      groupRunId: "group-run-1"
    })).toMatchObject({ recovered: false, waitingForUser: false, attempt: 1 });
    expect(database.recoverMain({
      projectId: "project-1",
      groupRunId: "group-run-1",
      priorProcessStopped: true
    })).toMatchObject({ recovered: true, waitingForUser: false, attempt: 2 });
    expect(database.projectState("project-1")).toMatchObject({ frozen: false });
    expect(database.assignTasks({
      projectId: "project-1",
      groupRunId: "group-run-1",
      actorAgentId: "main",
      coordinatorEpoch: 1,
      tasks: [{ id: "task-after-recovery", assignment: "Continue after reconciliation" }]
    })).toMatchObject({ replay: false });
    expect(database.eventsAfter("project-1").map((event) => event.type)).toEqual(
      expect.arrayContaining(["main.failed.frozen", "main.recovery.retryable", "main.recovered"])
    );
  });

  it("fences independent Main route failures and retains retry audit and automatic recovery until success", async () => {
    const { database } = await stateFixture();
    createProject(database, { recoveryLimit: 2 });
    database.activateNode({
      projectId: "project-1",
      nodeRunId: "main-route-node",
      node: { kind: "agent", nodeId: "main", agentId: "main" },
      activationRequestId: "activate-main-route",
      inputSnapshotRef: "snapshot:main-route",
      activatedByAgentId: "main",
      workflowRevision: 1
    });

    expect(database.freezeMainRouteFailure({
      projectId: "project-1",
      nodeRunId: "main-route-node",
      routeEpoch: 1,
      error: "Main process crashed",
      requestId: "freeze-main-route-one"
    })).toMatchObject({
      frozen: true,
      attempt: 1,
      limit: 2,
      waitingForUser: false
    });
    expect(database.recoverMainRoute({
      projectId: "project-1",
      nodeRunId: "main-route-node",
      routeEpoch: 1,
      requestId: "recover-main-route-unconfirmed"
    })).toMatchObject({ recovered: false, waitingForUser: false, attempt: 1 });
    expect(database.recoverMainRoute({
      projectId: "project-1",
      nodeRunId: "main-route-node",
      routeEpoch: 1,
      priorProcessStopped: true,
      requestId: "recover-main-route-confirmed"
    })).toMatchObject({ recovered: true, waitingForUser: false, attempt: 1 });

    expect(database.freezeMainRouteFailure({
      projectId: "project-1",
      nodeRunId: "main-route-node",
      routeEpoch: 2,
      error: "Main process crashed again",
      requestId: "freeze-main-route-two"
    })).toMatchObject({
      frozen: true,
      attempt: 2,
      waitingForUser: false
    });
    expect(database.projectState("project-1")).toMatchObject({
      frozen: true,
      freezeReason: "main_route_failed",
      nodeRuns: [expect.objectContaining({ id: "main-route-node", status: "paused" })]
    });

    // An explicit user recovery can proceed once the same fenced process is
    // stop-confirmed, but the counter is reset only after a successful Main
    // orchestration decision.
    expect(database.recoverMainRoute({
      projectId: "project-1",
      nodeRunId: "main-route-node",
      routeEpoch: 2,
      priorProcessStopped: true,
      requestId: "recover-main-route-after-user"
    })).toMatchObject({ recovered: true, attempt: 2 });
    expect(database.resetMainRouteRecovery({
      projectId: "project-1",
      nodeRunId: "main-route-node"
    })).toMatchObject({ reset: true });
    expect(database.projectState("project-1")).toMatchObject({
      frozen: false,
      nodeRuns: [expect.objectContaining({ id: "main-route-node", status: "running" })]
    });
    expect(database.eventsAfter("project-1").map((event) => event.type)).toEqual(
      expect.arrayContaining([
        "main.route.failed.frozen",
        "main.route.recovery.retryable",
        "main.route.recovered"
      ])
    );
  });

  it("reuses a durable coordinator stop proof after two service crash boundaries", async () => {
    const fixture = await stateFixture();
    const { database, databasePath, clock } = fixture;
    seedGroup(database, { origin: { kind: "project-input" } });
    const group = database.projectState("project-1").groupRuns[0]!;
    database.freezeForMainFailure({
      projectId: "project-1",
      groupRunId: group.id,
      expectedFacts: {
        groupRunId: group.id,
        nodeRunId: group.nodeRunId,
        coordinatorEpoch: group.coordinatorEpoch,
        groupBranch: group.groupBranch
      }
    });
    expect(database.confirmCoordinatorStopped({
      projectId: "project-1",
      groupRunId: group.id,
      coordinatorEpoch: group.coordinatorEpoch,
      reason: "main_recovery",
      evidence: { processGroupAbsent: true },
      requestId: "proof-main-stop-1"
    })).toMatchObject({ replay: false });
    expect(database.confirmCoordinatorStopped({
      projectId: "project-1",
      groupRunId: group.id,
      coordinatorEpoch: group.coordinatorEpoch,
      reason: "main_recovery",
      evidence: { processGroupAbsent: true },
      requestId: "proof-main-stop-1"
    })).toMatchObject({ replay: true });

    database.close();
    openDatabases.splice(openDatabases.indexOf(database), 1);
    clock.value += 2_000;
    const reopened = (await stateFixture({
      databasePath,
      clock,
      serviceId: "collaboration-service",
      instanceId: "instance-a",
      hostId: "host-a"
    })).database;
    expect(reopened.coordinatorStopProof(
      "project-1",
      group.id,
      group.coordinatorEpoch
    )).toMatchObject({
      type: "coordinator.stop_confirmed",
      payload: { reason: "main_recovery", evidence: { processGroupAbsent: true } }
    });
    // A second crash can recover from S alone; I does not have to reproduce
    // the already committed process observation.
    expect(reopened.recoverMain({
      projectId: "project-1",
      groupRunId: group.id
    })).toMatchObject({ recovered: true, waitingForUser: false });
  });

  it("restores only the original coordination scope on explicit all-member Resume", async () => {
    const { database } = await stateFixture();
    seedGroup(database, {
      recoveryLimit: 2,
      tasks: [
        { id: "task-failed-alice", assignment: "Alice task", assigneeAgentId: "alice" },
        { id: "task-failed-bob", assignment: "Bob task", assigneeAgentId: "bob" }
      ]
    });
    claim(database, "alice", "execution-failed-alice");
    claim(database, "bob", "execution-failed-bob");
    for (const [executionId, reason] of [
      ["execution-failed-alice", "Alice failed"],
      ["execution-failed-bob", "Bob failed"]
    ] as const) {
      database.requestExecutionStop({
        projectId: "project-1",
        executionId,
        ownershipEpoch: 1,
        reason
      });
      database.confirmExecutionStopped({
        projectId: "project-1",
        executionId,
        ownershipEpoch: 1,
        stopped: true,
        evidence: { stopped: true }
      });
    }
    database.pauseAllMembersFailed({
      projectId: "project-1",
      groupRunId: "group-run-1",
      actorAgentId: "leader",
      coordinatorEpoch: 1
    });
    const before = database.projectState("project-1");
    expectStateError(() => database.recoverAllMembers({
      projectId: "project-1", groupRunId: "group-run-1", coordinatorEpoch: 2
    }), "STALE_COORDINATOR_EPOCH");
    expect(database.projectState("project-1").stateRevision).toBe(before.stateRevision);
    const resume = { projectId: "project-1", groupRunId: "group-run-1", coordinatorEpoch: 1, requestId: "user-resume-all-members" };
    expect(database.recoverAllMembers(resume)).toMatchObject({ recovered: true, replay: false });
    const resumed = database.projectState("project-1");
    expect(resumed.executions).toEqual(before.executions);
    expect(resumed.tasks).toEqual(before.tasks);
    expect(resumed.pullRequests).toEqual(before.pullRequests);
    expect(resumed.groupRuns[0]).toMatchObject({ status: "running", coordinatorEpoch: 1, memberRecoveryAttempts: 0 });
    expect(database.eligibleDeliveryMembers("project-1", "group-run-1")).toEqual(["alice", "bob"]);
    expect(database.recoverAllMembers(resume)).toMatchObject({ recovered: true, replay: true, revision: resumed.stateRevision });

  });

  it("settles cancellation only after writers stop and open PR facts are reconciled", async () => {
    const { database } = await stateFixture();
    seedGroup(database, {
      tasks: [{ id: "task-cancel", assignment: "Work that will be cancelled" }]
    });
    claim(database, "alice", "execution-cancel");
    database.claimManagementLane({
      projectId: "project-1",
      groupRunId: "group-run-1",
      agentId: "leader",
      coordinatorEpoch: 1
    });
    const openPull = pullRequest({
      id: "pull-cancel",
      number: 7,
      executionId: "execution-cancel",
      head: "executions/execution-cancel",
      base: "groups/group-run-1",
      status: "open"
    });
    database.observePullRequest({
      projectId: "project-1",
      executionId: "execution-cancel",
      ownershipEpoch: 1,
      pullRequest: openPull
    });
    database.requestGroupCancellation({
      projectId: "project-1",
      groupRunId: "group-run-1",
      actorAgentId: "main",
      reason: "User cancelled the project"
    });
    expectStateError(
      () => database.settleGroupCancellation({
        projectId: "project-1",
        groupRunId: "group-run-1",
        reason: "User cancelled the project"
      }),
      "INVALID_STATE_TRANSITION"
    );
    database.confirmExecutionStopped({
      projectId: "project-1",
      executionId: "execution-cancel",
      ownershipEpoch: 1,
      stopped: true,
      evidence: { signal: "SIGTERM" }
    });
    expectStateError(
      () => database.settleGroupCancellation({
        projectId: "project-1",
        groupRunId: "group-run-1",
        reason: "User cancelled the project"
      }),
      "INVALID_STATE_TRANSITION"
    );
    database.observePullRequest({
      projectId: "project-1",
      executionId: "execution-cancel",
      ownershipEpoch: 1,
      pullRequest: { ...openPull, status: "closed", observedAt: "2026-09-22T00:01:00.000Z" }
    });
    expectStateError(
      () => database.settleGroupCancellation({
        projectId: "project-1",
        groupRunId: "group-run-1",
        reason: "User cancelled the project"
      }),
      "INVALID_STATE_TRANSITION"
    );
    database.confirmCoordinatorStopped({
      projectId: "project-1",
      groupRunId: "group-run-1",
      coordinatorEpoch: 1,
      reason: "cancellation",
      evidence: { residentClosed: true }
    });
    const beforeSettle = database.projectState("project-1").stateRevision;
    expect(database.settleGroupCancellation({
      projectId: "project-1",
      groupRunId: "group-run-1",
      reason: "User cancelled the project",
      expectedRevision: beforeSettle
    })).toMatchObject({
      replay: false,
      groupRun: { status: "cancelled" },
      nodeRun: { status: "cancelled" }
    });
    expect(database.settleGroupCancellation({
      projectId: "project-1",
      groupRunId: "group-run-1",
      reason: "User cancelled the project",
      expectedRevision: beforeSettle
    })).toMatchObject({ replay: true });
    const cancelledProjection = database.projectState("project-1");
    expect(cancelledProjection.activeNodeRunId).toBeUndefined();
    expect(cancelledProjection).toMatchObject({
      tasks: [expect.objectContaining({ id: "task-cancel", status: "cancelled" })],
      executions: [expect.objectContaining({ id: "execution-cancel", status: "cancelled" })]
    });
    expect(database.laneAvailability("project-1")).toContainEqual({
      lane: "management",
      capacity: 1,
      occupied: 0,
      available: 1
    });
  });

  it("atomically fences coordinator recovery, lane claims, and resident launches after cancellation", async () => {
    const { database } = await stateFixture();
    seedGroup(database, {
      tasks: [{ id: "task-cancel-fence", assignment: "Writer must not restart" }]
    });
    const claimed = claim(database, "alice", "execution-cancel-fence");
    if (!claimed) throw new Error("failed to claim cancellation fence execution");
    database.requestGroupCancellation({
      projectId: "project-1",
      groupRunId: "group-run-1",
      actorAgentId: "main",
      reason: "Fence every writer before cancellation settles"
    });
    const before = database.projectState("project-1");
    const beforeLanes = database.laneAvailability("project-1");
    const assertRejectedWithoutMutation = (
      action: () => unknown,
      code: CollaborationStateError["code"] = "INVALID_STATE_TRANSITION"
    ): void => {
      expectStateError(action, code);
      expect(database.projectState("project-1")).toEqual(before);
      expect(database.laneAvailability("project-1")).toEqual(beforeLanes);
    };

    assertRejectedWithoutMutation(() => database.claimWorkerLane({
      projectId: "project-1",
      executionId: claimed.execution.id,
      ownershipEpoch: claimed.execution.ownershipEpoch
    }));
    assertRejectedWithoutMutation(() => database.claimManagementLane({
      projectId: "project-1",
      groupRunId: "group-run-1",
      agentId: "leader",
      coordinatorEpoch: 1
    }));
    assertRejectedWithoutMutation(() => database.appendEvent({
      projectId: "project-1",
      nodeRunId: claimed.execution.nodeRunId,
      groupRunId: "group-run-1",
      agentId: claimed.execution.agentId,
      taskId: claimed.execution.taskId,
      executionId: claimed.execution.id,
      invocationId: claimed.execution.invocationId,
      ownershipEpoch: claimed.execution.ownershipEpoch,
      type: "execution.launch.started",
      payload: { residentLaunchProtocol: "trusted-supervisor-v1" }
    }));
    assertRejectedWithoutMutation(() => database.appendEvent({
      projectId: "project-1",
      nodeRunId: claimed.execution.nodeRunId,
      groupRunId: "group-run-1",
      agentId: "leader",
      coordinatorEpoch: 1,
      type: "group.leader.launch.started",
      payload: { residentLaunchProtocol: "trusted-supervisor-v1" }
    }));
    assertRejectedWithoutMutation(() => database.recoverCoordinatorOwnership({
      projectId: "project-1",
      groupRunId: "group-run-1",
      expectedCoordinatorEpoch: 1,
      stopped: true,
      evidence: { processGroupAbsent: true }
    }), "STALE_COORDINATOR_EPOCH");
    assertRejectedWithoutMutation(() => database.substituteMainForFailedLeader({
      projectId: "project-1",
      groupRunId: "group-run-1",
      expectedCoordinatorEpoch: 1
    }));
    assertRejectedWithoutMutation(() => database.pauseAllMembersFailed({
      projectId: "project-1",
      groupRunId: "group-run-1",
      actorAgentId: "leader",
      coordinatorEpoch: 1
    }));
  });

  it("reuses cancellation stop proofs in a new service instance and preserves a merged PR", async () => {
    const fixture = await stateFixture();
    const { database, databasePath, clock } = fixture;
    seedGroup(database, {
      tasks: [{ id: "task-cancel-restart", assignment: "Retain merged cancellation facts" }]
    });
    const claimed = claim(database, "alice", "execution-cancel-restart");
    if (!claimed) throw new Error("failed to claim cancellation restart execution");
    const mergedPull = pullRequest({
      id: "pull-cancel-restart",
      number: 92,
      executionId: claimed.execution.id,
      head: claimed.execution.executionBranch,
      base: "groups/group-run-1",
      status: "merged",
      mergeCommitSha: "8".repeat(40)
    });
    database.observePullRequest({
      projectId: "project-1",
      executionId: claimed.execution.id,
      ownershipEpoch: 1,
      pullRequest: mergedPull
    });
    database.claimManagementLane({
      projectId: "project-1",
      groupRunId: "group-run-1",
      agentId: "leader",
      coordinatorEpoch: 1
    });
    database.requestGroupCancellation({
      projectId: "project-1",
      groupRunId: "group-run-1",
      actorAgentId: "main",
      reason: "Cancellation must survive restart"
    });
    database.confirmExecutionStopped({
      projectId: "project-1",
      executionId: claimed.execution.id,
      ownershipEpoch: 1,
      stopped: true,
      evidence: { processGroupAbsent: true },
      requestId: "cancel-restart-execution-proof"
    });
    database.confirmCoordinatorStopped({
      projectId: "project-1",
      groupRunId: "group-run-1",
      coordinatorEpoch: 1,
      reason: "cancellation",
      evidence: { processGroupAbsent: true },
      requestId: "cancel-restart-coordinator-proof"
    });
    database.relinquishWriterLease();
    database.close();
    openDatabases.splice(openDatabases.indexOf(database), 1);

    const restarted = (await stateFixture({
      databasePath,
      clock,
      serviceId: "replacement-cancellation-service",
      instanceId: "replacement-cancellation-instance"
    })).database;
    expect(restarted.eventsAfter("project-1").filter((event) =>
      event.type === "execution.stop_confirmed" || event.type === "coordinator.stop_confirmed"
    )).toHaveLength(2);
    expect(restarted.settleGroupCancellation({
      projectId: "project-1",
      groupRunId: "group-run-1",
      reason: "Cancellation must survive restart"
    })).toMatchObject({
      groupRun: { status: "cancelled" },
      nodeRun: { status: "cancelled" }
    });
    const projection = restarted.projectState("project-1");
    expect(projection.pullRequests).toContainEqual(expect.objectContaining({
      id: mergedPull.id,
      status: "merged",
      mergeCommitSha: mergedPull.mergeCommitSha
    }));
    expect(projection.executions).toContainEqual(expect.objectContaining({
      id: claimed.execution.id,
      status: "cancelled"
    }));
  });
});

describe("Collaboration exact event fact lookup", () => {
  it("finds launch, route, terminal, Main-attempt, and assignment facts beyond 100k events", async () => {
    const { database, databasePath } = await stateFixture();
    seedGroup(database, {
      tasks: [{ id: "task-exact-window", assignment: "Cross the legacy event window" }]
    });
    const claimed = claim(database, "alice", "execution-exact-window");
    if (!claimed) throw new Error("failed to claim exact-window fixture task");
    const execution = claimed.execution;
    const prelaunch = database.executionPrelaunchFact(
      "project-1",
      execution.id,
      execution.ownershipEpoch
    );
    expect(prelaunch).toMatchObject({ type: "group.task.claimed" });

    padProjectEventsPastLegacyWindow(databasePath, "project-1");
    const launch = database.appendEvent({
      projectId: "project-1",
      requestId: "exact-window-launch",
      nodeRunId: execution.nodeRunId,
      groupRunId: execution.groupRunId,
      agentId: execution.agentId,
      taskId: execution.taskId,
      executionId: execution.id,
      invocationId: execution.invocationId,
      ownershipEpoch: execution.ownershipEpoch,
      type: "execution.launch.started",
      payload: {
        worktreePath: execution.worktreePath,
        runtimePath: "/srv/openfars/runtime/exact-window",
        residentLaunchProtocol: "trusted-supervisor-v1"
      }
    }).event;
    const route = database.appendEvent({
      projectId: "project-1",
      requestId: "exact-window-route",
      nodeRunId: execution.nodeRunId,
      groupRunId: execution.groupRunId,
      agentId: execution.agentId,
      taskId: execution.taskId,
      executionId: execution.id,
      invocationId: execution.invocationId,
      ownershipEpoch: execution.ownershipEpoch,
      type: "execution.route.selected",
      payload: { targetNodeId: "review", decisionRequestId: "exact-route-call" }
    }).event;
    const terminal = database.appendEvent({
      projectId: "project-1",
      requestId: "exact-window-terminal",
      nodeRunId: execution.nodeRunId,
      groupRunId: execution.groupRunId,
      agentId: execution.agentId,
      taskId: execution.taskId,
      executionId: execution.id,
      invocationId: execution.invocationId,
      ownershipEpoch: execution.ownershipEpoch,
      type: "execution.terminal_stop.prepared",
      payload: {
        transition: "handoff",
        reason: "fixture",
        checkpointAttempted: true,
        checkpointCommit: "e".repeat(40),
        retainedExecution: execution.id,
        retainedBranch: execution.executionBranch,
        retainedWorktreePath: execution.worktreePath
      }
    }).event;
    database.appendEvent({
      projectId: "project-1",
      requestId: "exact-window-assignment",
      nodeRunId: execution.nodeRunId,
      groupRunId: execution.groupRunId,
      coordinatorEpoch: 1,
      type: "group.tasks.assigned",
      payload: { fixture: true }
    });
    const mainAttempt = database.appendEvent({
      projectId: "project-1",
      requestId: "exact-window-main-attempt",
      nodeRunId: execution.nodeRunId,
      agentId: "main",
      coordinatorEpoch: 37,
      type: "main.route.attempt",
      payload: { attempt: 37 }
    }).event;

    expect(Math.min(launch.seq, route.seq, terminal.seq, mainAttempt.seq)).toBeGreaterThan(100_000);
    expect(database.executionLaunchStartedFact(
      "project-1",
      execution.id,
      execution.ownershipEpoch
    )).toMatchObject({ eventId: launch.eventId, type: "execution.launch.started" });
    expect(database.standaloneRouteDecision(
      "project-1",
      execution.id,
      execution.ownershipEpoch
    )).toMatchObject({ eventId: route.eventId, payload: { targetNodeId: "review" } });
    expect(database.latestExecutionTerminalPreparation(
      "project-1",
      execution.id,
      execution.ownershipEpoch,
      "handoff"
    )).toMatchObject({
      eventId: terminal.eventId,
      payload: { checkpointCommit: "e".repeat(40) }
    });
    expect(database.latestMainRouteAttempt("project-1", execution.nodeRunId)).toMatchObject({
      eventId: mainAttempt.eventId,
      coordinatorEpoch: 37
    });
    expect(database.groupTaskAssignmentCount("project-1", execution.groupRunId!)).toBe(2);
  }, 15_000);

  it("limits retained Main stop confirmation to its recovered current authority", async () => {
    const { database } = await stateFixture(); createProject(database);
    const projectId = "project-1", nodeRunId = "main-confirmed-recovery-node";
    database.activateNode({ projectId, nodeRunId, node: { kind: "agent", nodeId: "main", agentId: "main" },
      activationRequestId: "main-confirmed-recovery-activation", inputSnapshotRef: "original-main-input",
      activatedByAgentId: "main", workflowRevision: 1 });
    database.appendEvent({ projectId, nodeRunId, agentId: "main", invocationId: "original-main-inv", coordinatorEpoch: 1,
      type: "main.route.attempt", payload: { attempt: 1 } });
    expect(database.mainRouteHasConfirmedRecovery(projectId, nodeRunId, 1)).toBe(false);
    database.freezeMainRouteFailure({ projectId, nodeRunId, routeEpoch: 1, error: "Original response lost" });
    database.recoverMainRoute({ projectId, nodeRunId, routeEpoch: 1, priorProcessStopped: false });
    expect(database.mainRouteHasConfirmedRecovery(projectId, nodeRunId, 1)).toBe(false);
    database.recoverMainRoute({ projectId, nodeRunId, routeEpoch: 1, priorProcessStopped: true });
    expect(database.mainRouteHasConfirmedRecovery(projectId, nodeRunId, 1)).toBe(true);
    expect(database.mainRouteHasConfirmedRecovery(projectId, "another-main-node", 1)).toBe(false);
    expect(database.mainRouteHasConfirmedRecovery(projectId, nodeRunId, 2)).toBe(false);
    database.freezeMainRouteFailure({ projectId, nodeRunId, routeEpoch: 1, error: "Authority frozen again" });
    expect(database.mainRouteHasConfirmedRecovery(projectId, nodeRunId, 1)).toBe(false);
    database.recoverMainRoute({ projectId, nodeRunId, routeEpoch: 1, priorProcessStopped: true });
    expect(database.mainRouteHasConfirmedRecovery(projectId, nodeRunId, 1)).toBe(true);
    database.appendEvent({ projectId, nodeRunId, agentId: "main", invocationId: "next-main-inv", coordinatorEpoch: 2,
      type: "main.route.attempt", payload: { attempt: 2 } });
    expect(database.mainRouteHasConfirmedRecovery(projectId, nodeRunId, 1)).toBe(false);
    expect(database.mainRouteHasConfirmedRecovery(projectId, nodeRunId, 2)).toBe(false);
  });

  it("permits only the reserved Main repair turn while keeping the original resident authority", async () => {
    const { database } = await stateFixture(); createProject(database);
    const projectId = "project-1", nodeRunId = "main-reserved-repair-node";
    database.activateNode({ projectId, nodeRunId, node: { kind: "agent", nodeId: "main", agentId: "main" },
      activationRequestId: "main-reserved-repair-activation", inputSnapshotRef: "main-original-input",
      activatedByAgentId: "main", workflowRevision: 1 });
    database.appendEvent({ projectId, nodeRunId, agentId: "main", invocationId: "main-original-inv", coordinatorEpoch: 1,
      type: "main.route.attempt", payload: { attempt: 1 } });
    database.startRuntimeActivity({ projectId, nodeRunId, agentId: "main", coordinatorEpoch: 1,
      invocationId: "main-original-inv", kind: "resident", phase: "resident:running" });
    database.appendEvent({ projectId, nodeRunId, agentId: "main", invocationId: "main-reserved-repair-inv", coordinatorEpoch: 1,
      type: "main.route.mechanism_repair.requested", payload: { attempt: 1, missing: ["finish_task"] } });
    const authority = { projectId, nodeRunId, agentId: "main", coordinatorEpoch: 1, invocationId: "main-reserved-repair-inv" };
    expectStateError(() => database.startRuntimeActivity({ ...authority, invocationId: "unreserved-inv", kind: "turn", phase: "model:running" }), "INVALID_STATE_TRANSITION");
    expectStateError(() => database.startRuntimeActivity({ ...authority, kind: "resident", phase: "resident:starting" }), "INVALID_STATE_TRANSITION");
    database.startRuntimeActivity({ ...authority, kind: "turn", phase: "model:running" });
    expect(database.projectState(projectId).runtimeActivities).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: "resident", invocationId: "main-original-inv" }),
      expect.objectContaining({ kind: "turn", invocationId: "main-reserved-repair-inv" })
    ]));
    const control = { projectId, nodeRunId, routeEpoch: 1, stateVersion: 1, candidateNodeIds: ["finish"],
      canComplete: true, allowFinishRoute: false, action: { tool: "finish_task" as const } };
    expectStateError(() => database.revalidateMainRouteControl({ ...control, invocationId: "main-original-inv" }), "INVALID_STATE_TRANSITION");
    expect(database.revalidateMainRouteControl({ ...control, invocationId: "main-reserved-repair-inv" })).toBeUndefined();
    expectStateError(() => database.revalidateMainRouteControl({ ...control, invocationId: "main-reserved-repair-inv",
      accepted: { requestId: `accepted-main-control-${"a".repeat(64)}-0`, inputId: "original-input",
        invocationId: "main-reserved-repair-inv", callId: "own-finish-not-decision", semanticInputHash: "a".repeat(64) } }), "INVALID_STATE_TRANSITION");
    database.appendEvent({ projectId, nodeRunId, agentId: "main", invocationId: "new-epoch-inv", coordinatorEpoch: 2,
      type: "main.route.attempt", payload: { attempt: 2 } });
    expectStateError(() => database.revalidateMainRouteControl({ ...control, invocationId: "main-reserved-repair-inv" }), "INVALID_STATE_TRANSITION");
  });

  it("preserves Main missing-tool budget across route epochs and writer restart until a formal task response", async () => {
    const { database, databasePath, clock } = await stateFixture(); createProject(database);
    const projectId = "project-1", nodeRunId = "main-persistent-budget-node";
    database.activateNode({ projectId, nodeRunId, node: { kind: "agent", nodeId: "main", agentId: "main" },
      activationRequestId: "main-persistent-budget-activation", inputSnapshotRef: "main-original-input", activatedByAgentId: "main", workflowRevision: 1 });
    for (const attempt of [1, 2]) {
      database.appendEvent({ projectId, nodeRunId, agentId: "main", invocationId: `new-inv-${attempt}`, coordinatorEpoch: attempt,
        type: "main.route.attempt", payload: { attempt } });
      database.appendEvent({ projectId, nodeRunId, agentId: "main", invocationId: `repair-inv-${attempt}`, coordinatorEpoch: attempt,
        type: "main.route.mechanism_repair.requested", payload: { attempt, missing: ["finish_task"] } });
    }
    expect(database.mainRouteControlRepairCount(projectId, nodeRunId)).toBe(2);
    database.relinquishWriterLease(); database.close(); openDatabases.splice(openDatabases.indexOf(database), 1);
    const restarted = (await stateFixture({ databasePath, clock, serviceId: "main-budget-restarted", instanceId: "main-budget-restarted-instance" })).database;
    expect(restarted.mainRouteControlRepairCount(projectId, nodeRunId)).toBe(2);
    restarted.appendEvent({ projectId, nodeRunId, agentId: "main", coordinatorEpoch: 3,
      type: "main.route.attempt", payload: { attempt: 3 } });
    expect(restarted.mainRouteControlRepairCount(projectId, nodeRunId)).toBe(2);
    restarted.appendEvent({ projectId, nodeRunId, agentId: "main", coordinatorEpoch: 3,
      type: "main.route.response.committed", payload: { inputId: "original-input" } });
    expect(restarted.mainRouteControlRepairCount(projectId, nodeRunId)).toBe(2);
    restarted.appendEvent({ projectId, nodeRunId, agentId: "main", coordinatorEpoch: 2,
      type: "main.route.task_completion.committed", payload: { inputId: "original-input" } });
    expect(restarted.mainRouteControlRepairCount(projectId, nodeRunId)).toBe(2);
    restarted.appendEvent({ projectId, nodeRunId, agentId: "main", coordinatorEpoch: 3,
      type: "main.route.task_completion.committed", payload: { inputId: "original-input" } });
    expect(restarted.mainRouteControlRepairCount(projectId, nodeRunId)).toBe(0);
  });

  it("renews an exhausted Main repair cycle after exact stopped authority for automatic and explicit Resume", async () => {
    const { database } = await stateFixture(); createProject(database);
    const projectId = "project-1", nodeRunId = "main-explicit-resume-node";
    database.activateNode({ projectId, nodeRunId, node: { kind: "agent", nodeId: "main", agentId: "main" },
      activationRequestId: "main-explicit-resume-activation", inputSnapshotRef: "original-task",
      activatedByAgentId: "main", workflowRevision: 1 });
    const repair = (epoch: number) => database.appendEvent({ projectId, nodeRunId, agentId: "main", coordinatorEpoch: epoch,
      type: "main.route.mechanism_repair.requested", payload: { missing: ["finish_task"] } });
    repair(1); repair(1);
    database.freezeMainRouteFailure({ projectId, nodeRunId, routeEpoch: 1, error: "exhausted repairs" });
    expect(database.recoverMainRoute({ projectId, nodeRunId, routeEpoch: 1, explicitUserResume: true }).recovered).toBe(false);
    expect(database.recoverMainRoute({ projectId, nodeRunId, routeEpoch: 2, priorProcessStopped: true, explicitUserResume: true }).recovered).toBe(false);
    expect(database.mainRouteControlRepairCount(projectId, nodeRunId)).toBe(2);
    expect(database.recoverMainRoute({ projectId, nodeRunId, routeEpoch: 1, priorProcessStopped: true }).recovered).toBe(true);
    expect(database.mainRouteControlRepairCount(projectId, nodeRunId)).toBe(0);
    repair(2); repair(2);
    database.freezeMainRouteFailure({ projectId, nodeRunId, routeEpoch: 2, error: "still exhausted" });
    const resume = { projectId, nodeRunId, routeEpoch: 2, priorProcessStopped: true, explicitUserResume: true };
    expect(database.recoverMainRoute(resume).recovered).toBe(true);
    expect(database.mainRouteControlRepairCount(projectId, nodeRunId)).toBe(0);
    repair(3);
    // Repeating Resume after the freeze was cleared cannot keep renewing the budget.
    expect(database.recoverMainRoute(resume).recovered).toBe(true);
    expect(database.mainRouteControlRepairCount(projectId, nodeRunId)).toBe(1);
    repair(3);
    expect(database.mainRouteControlRepairCount(projectId, nodeRunId)).toBe(2);
    expect(database.eventsAfter(projectId, 0, 2000).filter(event => event.type === "main.route.mechanism_repair.requested")).toHaveLength(6);
    expect(database.eventsAfter(projectId, 0, 2000).filter(event => event.type === "main.route.recovered" && event.payload.mechanismRepairBudgetRenewed === true)).toHaveLength(2);
  });

  it("rebinds only an exact Main accepted choice after proven stop and rejects replacement", async () => {
    const { database } = await stateFixture(); createProject(database);
    const projectId = "project-1", nodeRunId = "main-rebind-node", sourceHash = "a".repeat(64), targetHash = "b".repeat(64);
    database.activateNode({ projectId, nodeRunId, node: { kind: "agent", nodeId: "main", agentId: "main" },
      activationRequestId: "main-rebind-activation", inputSnapshotRef: "main-original-input", activatedByAgentId: "main", workflowRevision: 1 });
    database.appendEvent({ projectId, nodeRunId, agentId: "main", invocationId: "source-inv", coordinatorEpoch: 1,
      type: "main.route.attempt", payload: { attempt: 1 } });
    const base = { projectId, nodeRunId, candidateNodeIds: ["finish"], canComplete: true, allowFinishRoute: false };
    const action = { tool: "request_user" as const, message: "Preserve Main's choice", rationale: "Main decided" };
    database.revalidateMainRouteControl({ ...base, routeEpoch: 1, stateVersion: 1, action,
      accepted: { requestId: `accepted-main-control-${sourceHash}-0`, inputId: "original-input", invocationId: "source-inv",
        callId: "main-source-request", semanticInputHash: sourceHash } });
    database.appendEvent({ projectId, nodeRunId, agentId: "main", invocationId: "target-inv", coordinatorEpoch: 2,
      type: "main.route.attempt", payload: { attempt: 2 } });
    const rebound = { ...base, routeEpoch: 2, stateVersion: 2, action,
      accepted: { requestId: `accepted-main-control-${targetHash}-0`, inputId: "original-input", invocationId: "target-inv",
        callId: "main-source-request", semanticInputHash: targetHash,
        reboundFrom: { routeEpoch: 1, semanticInputHash: sourceHash, sequence: 0 } } };
    expectStateError(() => database.revalidateMainRouteControl(rebound), "INVALID_STATE_TRANSITION");
    database.freezeMainRouteFailure({ projectId, nodeRunId, routeEpoch: 1, error: "old native response lost" });
    expect(database.recoverMainRoute({ projectId, nodeRunId, routeEpoch: 1, priorProcessStopped: true }).recovered).toBe(true);
    expectStateError(() => database.revalidateMainRouteControl({ ...rebound, action: { ...action, message: "Changed choice" } }), "INVALID_STATE_TRANSITION");
    expect(database.revalidateMainRouteControl(rebound)).toMatchObject({ routeEpoch: 2, action });
    expect(database.acceptedMainRouteActions({ projectId, nodeRunId, semanticInputHash: targetHash })).toHaveLength(1);
  });

  it("does not unfreeze independent Main from a stop proof for another route epoch", async () => {
    const { database } = await stateFixture();
    createProject(database);
    database.activateNode({
      projectId: "project-1",
      nodeRunId: "main-route-exact-node",
      node: { kind: "agent", nodeId: "main", agentId: "main" },
      activationRequestId: "activate-main-route-exact",
      inputSnapshotRef: "snapshot:main-route-exact",
      activatedByAgentId: "main",
      workflowRevision: 1
    });
    database.appendEvent({
      projectId: "project-1",
      requestId: "main-route-exact-attempt",
      nodeRunId: "main-route-exact-node",
      agentId: "main",
      coordinatorEpoch: 9,
      type: "main.route.attempt",
      payload: { attempt: 9 }
    });
    database.freezeMainRouteFailure({
      projectId: "project-1",
      nodeRunId: "main-route-exact-node",
      routeEpoch: 9,
      error: "route process crashed"
    });

    expect(database.recoverMainRoute({
      projectId: "project-1",
      nodeRunId: "main-route-exact-node",
      routeEpoch: 8,
      priorProcessStopped: true
    })).toMatchObject({ recovered: false, waitingForUser: false });
    expect(database.projectState("project-1")).toMatchObject({ frozen: true });
    expect(database.recoverMainRoute({
      projectId: "project-1",
      nodeRunId: "main-route-exact-node",
      routeEpoch: 9,
      priorProcessStopped: true
    })).toMatchObject({ recovered: true });
  });
});

describe("Collaboration transaction isolation", () => {
  it("isolates an overlapping pre-commit rollback from another process's committed facts", async () => {
    const fixture = await stateFixture();
    seedGroup(fixture.database, { origin: { kind: "project-input" } });
    const mainLeader = fixture.database.projectState("project-1").groupRuns[0]!.leaderAgentId;
    expect(mainLeader).toBe("main");
    fixture.database.appendEvent({
      projectId: "project-1",
      eventId: "evt_usage_usage-a",
      agentId: "alice",
      type: "fixture.collision",
      payload: { retained: true }
    });
    const attached = (await stateFixture({
      databasePath: fixture.databasePath,
      clock: fixture.clock,
      serviceId: "collaboration-service",
      instanceId: "instance-a",
      hostId: "host-a",
      writerLease: fixture.database.writerLease()
    })).database;
    attached.assignTasks({
      projectId: "project-1",
      groupRunId: "group-run-1",
      actorAgentId: mainLeader,
      coordinatorEpoch: 1,
      tasks: [{ id: "task-b", assignment: "Committed by writer B", assigneeAgentId: "alice" }],
      requestId: "writer-b-assign"
    });
    claim(attached, "alice", "execution-b");
    attached.claimManagementLane({
      projectId: "project-1",
      groupRunId: "group-run-1",
      agentId: mainLeader,
      coordinatorEpoch: 1
    });
    attached.observePullRequest({
      projectId: "project-1",
      executionId: "execution-b",
      ownershipEpoch: 1,
      pullRequest: pullRequest({
        id: "pull-writer-b",
        number: 41,
        executionId: "execution-b",
        head: "executions/execution-b",
        base: "groups/group-run-1",
        status: "merged",
        mergeCommitSha: "b".repeat(40)
      })
    });
    attached.completeExecution({
      projectId: "project-1",
      executionId: "execution-b",
      ownershipEpoch: 1,
      output: "Writer B delivery"
    });
    attached.startFinalIntegration({
      projectId: "project-1",
      groupRunId: "group-run-1",
      actorAgentId: mainLeader,
      coordinatorEpoch: 1,
      ownerAgentId: "bob",
      taskId: "task-writer-b-final",
      executionId: "execution-writer-b-final",
      assignment: "Writer B final integration",
      executionBranch: "groups/group-run-1",
      worktreePath: "/srv/openfars/git-worktrees/execution-writer-b-final"
    });
    attached.observePullRequest({
      projectId: "project-1",
      executionId: "execution-writer-b-final",
      ownershipEpoch: 1,
      pullRequest: pullRequest({
        id: "pull-writer-b-final",
        number: 42,
        executionId: "execution-writer-b-final",
        head: "groups/group-run-1",
        base: "main",
        status: "merged",
        mergeCommitSha: "c".repeat(40)
      })
    });
    attached.completeExecution({
      projectId: "project-1",
      executionId: "execution-writer-b-final",
      ownershipEpoch: 1,
      output: "Writer B final integration"
    });
    attached.decideGroupCompletion({
      projectId: "project-1",
      groupRunId: "group-run-1",
      actorAgentId: mainLeader,
      coordinatorEpoch: 1,
      output: "Writer B durable leader decision",
      requestId: "writer-b-leader-decision"
    });
    attached.completeGroup({
      projectId: "project-1",
      groupRunId: "group-run-1",
      nodeRunId: "node-run-1",
      coordinatorEpoch: 1,
      routeEmissionId: "writer-b-route",
      route: { kind: "fixed", targetNodeId: "finish" },
      requestId: "writer-b-complete-group"
    });
    attached.appendUsage({
      projectId: "project-1",
      usageId: "usage-b",
      requestId: "writer-b-usage",
      agentId: "bob",
      inputTokens: 3,
      cachedInputTokens: 0,
      outputTokens: 2,
      totalTokens: 5
    });
    attached.appendEvent({
      projectId: "project-1",
      eventId: "evt-writer-b-durable",
      requestId: "writer-b-event",
      groupRunId: "group-run-1",
      agentId: mainLeader,
      coordinatorEpoch: 1,
      type: "fixture.writer-b.committed",
      payload: { durableDecision: "continue" }
    });
    const revisionBeforeFailure = attached.projectState("project-1").stateRevision;

    const lease = fixture.database.writerLease();
    const concurrent = {
      aAfterInsert: path.join(fixture.root, "round-one-a-after-insert"),
      aRelease: path.join(fixture.root, "round-one-a-release"),
      aDone: path.join(fixture.root, "round-one-a-done"),
      bReady: path.join(fixture.root, "round-one-b-ready"),
      bGo: path.join(fixture.root, "round-one-b-go"),
      bAttempt: path.join(fixture.root, "round-one-b-attempt"),
      bDone: path.join(fixture.root, "round-one-b-done")
    };
    const writerAConfig = path.join(fixture.root, "round-one-writer-a.json");
    const writerBConfig = path.join(fixture.root, "round-one-writer-b.json");
    await Promise.all([
      fs.writeFile(writerAConfig, JSON.stringify({
        mode: "fail-after-usage-insert",
        databasePath: fixture.databasePath,
        lease,
        nowMs: fixture.clock.value,
        projectId: "project-1",
        usageId: "usage-a-concurrent-fault",
        requestId: "writer-a-concurrent-fault",
        agentId: "alice",
        attemptPath: concurrent.aAfterInsert,
        releasePath: concurrent.aRelease,
        donePath: concurrent.aDone
      }), "utf8"),
      fs.writeFile(writerBConfig, JSON.stringify({
        mode: "commit",
        databasePath: fixture.databasePath,
        lease,
        nowMs: fixture.clock.value,
        projectId: "project-1",
        usageId: "usage-b-concurrent",
        requestId: "writer-b-concurrent",
        agentId: "bob",
        eventId: "evt-writer-b-concurrent",
        readyPath: concurrent.bReady,
        goPath: concurrent.bGo,
        attemptPath: concurrent.bAttempt,
        donePath: concurrent.bDone
      }), "utf8")
    ]);

    // Writer B owns an independent attached connection before A enters its
    // transaction. A then pauses after its usage INSERT but before COMMIT.
    // B starts a real competing mutation and blocks on SQLite's write lock;
    // after A faults and rolls back, B must commit all of its own facts.
    const writerB = launchConcurrentWorker(writerBConfig);
    await waitForMarker(concurrent.bReady);
    const writerA = launchConcurrentWorker(writerAConfig);
    await waitForMarker(concurrent.aAfterInsert);
    await fs.writeFile(concurrent.bGo, "go\n", "utf8");
    await waitForMarker(concurrent.bAttempt);
    await new Promise<void>((resolve) => setTimeout(resolve, 75));
    expect(await markerExists(concurrent.bDone)).toBe(false);
    await fs.writeFile(concurrent.aRelease, "rollback\n", "utf8");
    await Promise.all([writerA, writerB]);
    await Promise.all([
      waitForMarker(concurrent.aDone),
      waitForMarker(concurrent.bDone)
    ]);

    // Reverse ordering: B commits first, then A writes inside a later scoped
    // transaction and fails before commit. The later rollback must not rewind
    // the already committed revision or any earlier Main/PR/route facts.
    const reverse = {
      bReady: path.join(fixture.root, "round-two-b-ready"),
      bGo: path.join(fixture.root, "round-two-b-go"),
      bDone: path.join(fixture.root, "round-two-b-done"),
      aAfterInsert: path.join(fixture.root, "round-two-a-after-insert"),
      aRelease: path.join(fixture.root, "round-two-a-release"),
      aDone: path.join(fixture.root, "round-two-a-done")
    };
    const reverseBConfig = path.join(fixture.root, "round-two-writer-b.json");
    const reverseAConfig = path.join(fixture.root, "round-two-writer-a.json");
    await Promise.all([
      fs.writeFile(reverseBConfig, JSON.stringify({
        mode: "commit",
        databasePath: fixture.databasePath,
        lease,
        nowMs: fixture.clock.value,
        projectId: "project-1",
        usageId: "usage-b-before-fault",
        requestId: "writer-b-before-fault",
        agentId: "bob",
        eventId: "evt-writer-b-before-fault",
        readyPath: reverse.bReady,
        goPath: reverse.bGo,
        donePath: reverse.bDone
      }), "utf8"),
      fs.writeFile(reverseAConfig, JSON.stringify({
        mode: "fail-after-usage-insert",
        databasePath: fixture.databasePath,
        lease,
        nowMs: fixture.clock.value,
        projectId: "project-1",
        usageId: "usage-a-after-b-fault",
        requestId: "writer-a-after-b-fault",
        agentId: "alice",
        attemptPath: reverse.aAfterInsert,
        releasePath: reverse.aRelease,
        donePath: reverse.aDone
      }), "utf8")
    ]);
    const reverseB = launchConcurrentWorker(reverseBConfig);
    await waitForMarker(reverse.bReady);
    await fs.writeFile(reverse.bGo, "go\n", "utf8");
    await reverseB;
    await waitForMarker(reverse.bDone);
    const reverseA = launchConcurrentWorker(reverseAConfig);
    await waitForMarker(reverse.aAfterInsert);
    await fs.writeFile(reverse.aRelease, "rollback\n", "utf8");
    await reverseA;
    await waitForMarker(reverse.aDone);

    const after = attached.projectState("project-1");
    expect(after.stateRevision).toBe(revisionBeforeFailure + 4);
    expect(after.groupRuns[0]).toMatchObject({
      status: "completed",
      leaderAgentId: "main",
      leaderDecision: "complete",
      output: "Writer B durable leader decision"
    });
    expect(after.tasks).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "task-b", status: "succeeded" }),
      expect.objectContaining({ id: "task-writer-b-final", status: "succeeded" })
    ]));
    expect(after.usage).toEqual(expect.arrayContaining([
      expect.objectContaining({ usageId: "usage-b", totalTokens: 5 }),
      expect.objectContaining({ usageId: "usage-b-concurrent", totalTokens: 5 }),
      expect.objectContaining({ usageId: "usage-b-before-fault", totalTokens: 5 })
    ]));
    expect(after.usage.some((usage) => usage.usageId.startsWith("usage-a-"))).toBe(false);
    expect(after.routeOutbox).toEqual([
      expect.objectContaining({
        routeEmissionId: "writer-b-route",
        status: "pending",
        targetNodeId: "finish"
      })
    ]);
    expect(attached.eventsAfter("project-1", 0, 1_000)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ eventId: "evt-writer-b-durable" }),
        expect.objectContaining({ eventId: "evt-writer-b-concurrent" }),
        expect.objectContaining({ eventId: "evt-writer-b-before-fault" }),
        expect.objectContaining({ eventId: "evt_usage_usage-a", type: "fixture.collision" })
      ])
    );
    expect(attached.eventsAfter("project-1", 0, 1_000)
      .filter((event) => event.type === "group.completed")).toHaveLength(1);
  }, 15_000);
});

describe("Collaboration event log and credential-free projection", () => {
  it("replays append-only events and usage across reopen without exposing credentials", async () => {
    const fixture = await stateFixture();
    createProject(fixture.database);
    const eventInput = {
      projectId: "project-1",
      expectedRevision: 1,
      eventId: "event-custom",
      requestId: "request-custom",
      ts: "2026-09-22T00:02:00.000Z",
      type: "collaboration.custom",
      payload: { durable: true, detail: "credential-free" }
    };
    const first = fixture.database.appendEvent(eventInput);
    expect(first).toMatchObject({ replay: false, revision: 2, event: { seq: 2 } });
    expect(fixture.database.appendEvent({
      ...eventInput,
      ts: "2026-09-22T00:03:00.000Z"
    })).toMatchObject({ replay: true, revision: 2, event: { seq: 2 } });
    expectStateError(
      () => fixture.database.appendEvent({
        ...eventInput,
        expectedRevision: undefined,
        payload: { durable: false }
      }),
      "IDEMPOTENCY_CONFLICT"
    );

    const usageInput = {
      usageId: "usage-1",
      requestId: "request-usage-1",
      projectId: "project-1",
      agentId: "alice",
      inputTokens: 10,
      cachedInputTokens: 3,
      outputTokens: 4,
      totalTokens: 17,
      model: "research-model",
      protocol: "responses",
      recordedAt: "2026-09-22T00:04:00.000Z",
      expectedRevision: 2
    };
    expect(fixture.database.appendUsage(usageInput)).toMatchObject({
      replay: false,
      revision: 3,
      usage: { totalTokens: 17 }
    });
    expect(fixture.database.appendUsage(usageInput)).toMatchObject({ replay: true, revision: 3 });
    const implicitTimestampUsage = {
      usageId: "usage-implicit-time",
      requestId: "request-usage-implicit-time",
      projectId: "project-1",
      agentId: "bob",
      inputTokens: 1,
      cachedInputTokens: 0,
      outputTokens: 1,
      totalTokens: 2
    };
    const implicitFirst = fixture.database.appendUsage(implicitTimestampUsage);
    fixture.clock.value += 500;
    expect(fixture.database.appendUsage(implicitTimestampUsage)).toMatchObject({
      replay: true,
      revision: implicitFirst.revision,
      usage: { recordedAt: implicitFirst.usage.recordedAt }
    });
    expectStateError(
      () => fixture.database.appendUsage({
        ...implicitTimestampUsage,
        usageId: "usage-synthetic-main-route",
        requestId: "request-usage-synthetic-main-route",
        groupRunId: "main-route-node-run-1"
      }),
      "RECORD_NOT_FOUND"
    );
    expect(fixture.database.projectState("project-1").groupRuns).toEqual([]);
    expectStateError(
      () => fixture.database.appendEvent({
        projectId: "project-1",
        eventId: "event-secret",
        type: "collaboration.secret",
        payload: { authorization: "Bearer abcdefghijklmnopqrstuvwxyz" }
      }),
      "CREDENTIAL_DATA_REJECTED"
    );
    const forbiddenPayloads: ReadonlyArray<Readonly<Record<string, unknown>>> = [
      { nested: { "API-Key": "value-hidden-by-key-name" } },
      { nested: { CLIENT_SECRET: "value-hidden-by-key-name" } },
      { nested: { AWS_ACCESS_KEY_ID: "AKIAIOSFODNN7EXAMPLE" } },
      { nested: { AWS_SECRET_ACCESS_KEY: "aws-structured-secret" } },
      { detail: "AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE" },
      {
        detail: "AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
      },
      { detail: "Authorization: Basic YWxhZGRpbjpvcGVuIHNlc2FtZQ==" },
      { detail: "classic token ghp_1234567890abcdefghij" },
      { detail: "fine grained github_pat_1234567890abcdefghij" },
      { detail: "gateway sk-1234567890abcdefghijklmnop" },
      { detail: "remote https://alice:swordfish@example.test/private.git" },
      {
        detail: [
          "-----BEGIN PRIVATE KEY-----",
          "PRIVATE-KEY-MATERIAL",
          "-----END PRIVATE KEY-----"
        ].join("\n")
      }
    ];
    forbiddenPayloads.forEach((payload, index) => {
      expectStateError(
        () => fixture.database.appendEvent({
          projectId: "project-1",
          eventId: `event-secret-variant-${index}`,
          type: "collaboration.secret-variant",
          payload
        }),
        "CREDENTIAL_DATA_REJECTED"
      );
    });
    expectStateError(
      () => fixture.database.appendUsage({
        ...usageInput,
        usageId: "usage-secret",
        requestId: "request-usage-secret",
        expectedRevision: undefined,
        model: "Bearer abcdefghijklmnopqrstuvwxyz"
      }),
      "CREDENTIAL_DATA_REJECTED"
    );

    const lease = fixture.database.writerLease();
    fixture.database.close();
    const reopened = (await stateFixture({
      databasePath: fixture.databasePath,
      clock: fixture.clock,
      instanceId: "instance-a",
      writerLease: lease
    })).database;
    expect(reopened.eventsAfter("project-1", 1).map((event) => event.type)).toEqual([
      "collaboration.custom",
      "usage.recorded",
      "usage.recorded"
    ]);
    const projection = reopened.projectState("project-1");
    expect(projection.usage).toEqual(expect.arrayContaining([
      expect.objectContaining({ usageId: "usage-1" }),
      expect.objectContaining({ usageId: "usage-implicit-time" })
    ]));
    const serialized = JSON.stringify(projection);
    expect(serialized).not.toMatch(/Bearer|ghp_|authorization|access_token/i);
    expect(reopened.listProjectStates()).toHaveLength(1);
    expect(reopened.getProjectState("missing-project")).toBeUndefined();
  });

  it("keeps redacted failure attempts append-only across retries and reopen", async () => {
    const fixture = await stateFixture();
    createProject(fixture.database);
    const leakedToken = "ghp_1234567890supersecret";
    const failedInput = {
      attemptId: "git-initialization:project-1:1",
      projectId: "project-1",
      scope: "git" as const,
      operation: "initialization",
      status: "failed" as const,
      errorCode: "GITHUB_PROVIDER_FAILED",
      retryable: true,
      redactedMessage: `remote rejected Bearer abcdefghijklmnop and ${leakedToken}`,
      causeClass: "GitHubProviderError",
      startedAt: "2026-09-22T00:01:00.000Z",
      finishedAt: "2026-09-22T00:01:01.000Z",
      metadata: {
        authorization: "Bearer abcdefghijklmnop",
        nested: { detail: `provider returned ${leakedToken}` },
        causeChain: [{ causeClass: "Error", message: `failed with ${leakedToken}` }]
      }
    };
    const failed = fixture.database.appendFailureAttempt(failedInput);
    expect(failed).toMatchObject({
      replay: false,
      attempt: {
        attemptId: failedInput.attemptId,
        status: "failed",
        errorCode: "GITHUB_PROVIDER_FAILED",
        retryable: true
      }
    });
    expect(JSON.stringify(failed.attempt)).not.toContain(leakedToken);
    expect(JSON.stringify(failed.attempt)).not.toContain("Bearer abcdefghijklmnop");
    expect(fixture.database.appendFailureAttempt(failedInput)).toMatchObject({
      replay: true,
      revision: failed.revision
    });
    expectStateError(
      () => fixture.database.appendFailureAttempt({
        ...failedInput,
        redactedMessage: "a different immutable failure"
      }),
      "IDEMPOTENCY_CONFLICT"
    );

    const succeeded = fixture.database.appendFailureAttempt({
      attemptId: "git-initialization:project-1:2",
      projectId: "project-1",
      scope: "git",
      operation: "initialization",
      status: "succeeded",
      errorCode: null,
      retryable: false,
      redactedMessage: "Git initialization succeeded",
      causeClass: "None",
      startedAt: "2026-09-22T00:01:02.000Z",
      finishedAt: "2026-09-22T00:01:03.000Z",
      metadata: { attempt: 2 }
    });
    expect(succeeded.replay).toBe(false);
    const projection = fixture.database.projectState("project-1");
    expect(projection.failureAttempts).toHaveLength(2);
    expect(projection.failureAttempts.map((attempt) => attempt.status)).toEqual([
      "failed",
      "succeeded"
    ]);
    expect(projection.failureSummary).toMatchObject({
      currentStatus: "healthy",
      totalAttempts: 2,
      failedAttempts: 1,
      succeededAttempts: 1,
      unresolvedFailures: 0,
      latestAttempt: { attemptId: "git-initialization:project-1:2" },
      latestFailure: { attemptId: "git-initialization:project-1:1" },
      operations: [{
        scope: "git",
        operation: "initialization",
        status: "succeeded",
        attemptCount: 2,
        failureCount: 1
      }]
    });

    const lease = fixture.database.writerLease();
    fixture.database.close();
    const reopened = (await stateFixture({
      databasePath: fixture.databasePath,
      clock: fixture.clock,
      instanceId: "instance-a",
      writerLease: lease
    })).database;
    expect(reopened.projectState("project-1").failureAttempts)
      .toEqual(projection.failureAttempts);
    expect(JSON.stringify(reopened.projectState("project-1")))
      .not.toMatch(/ghp_|Bearer\s|authorization/i);
  });

  it("persists all Git retry scheduling milestones and localizes a nine-minute fence wait", async () => {
    const fixture = await stateFixture();
    createProject(fixture.database);
    const base = {
      projectId: "project-1",
      retryId: "git-retry:git-init-project-1:2",
      operationId: "git-init-project-1",
      attempt: 2,
      invocationId: "inv_prior_project_run",
      epoch: 3,
      epochKind: "coordinator" as const
    };
    fixture.database.appendGitRetrySchedulingMilestone({
      ...base,
      milestone: "retryAcceptedAt",
      occurredAt: "2026-09-22T00:00:00.000Z",
      waitingFor: {
        kind: "git-initialization",
        objectId: "git-init-project-1@2",
        reason: "Waiting for Git ready",
        deadlineAt: null
      }
    });
    fixture.database.appendGitRetrySchedulingMilestone({
      ...base,
      milestone: "gitReadyPersistedAt",
      occurredAt: "2026-09-22T00:00:01.000Z",
      waitingFor: {
        kind: "prior-project-run",
        objectId: "inv_prior_project_run",
        reason: "Prior run owns the scheduler fence",
        deadlineAt: "2026-09-22T00:00:06.000Z"
      }
    });
    fixture.database.appendGitRetrySchedulingMilestone({
      ...base,
      milestone: "priorRunSettledAt",
      occurredAt: "2026-09-22T00:09:01.000Z",
      waitingFor: {
        kind: "scheduler",
        objectId: "project-scheduler:project-1",
        reason: "Prior run settled",
        deadlineAt: "2026-09-22T00:09:06.000Z"
      }
    });
    fixture.database.appendGitRetrySchedulingMilestone({
      ...base,
      invocationId: null,
      epoch: null,
      epochKind: null,
      milestone: "scheduleEnqueuedAt",
      occurredAt: "2026-09-22T00:09:01.100Z",
      waitingFor: {
        kind: "main-resident",
        objectId: "main-resident:project-1",
        reason: "Waiting for Main resident",
        deadlineAt: null
      }
    });
    fixture.database.appendGitRetrySchedulingMilestone({
      ...base,
      invocationId: "inv_new_main",
      epoch: 1,
      milestone: "mainResidentOpenedAt",
      occurredAt: "2026-09-22T00:09:01.200Z",
      waitingFor: {
        kind: "none",
        objectId: null,
        reason: null,
        deadlineAt: null
      }
    });

    const revisionBeforeReplay = fixture.database.projectState("project-1").stateRevision;
    expect(fixture.database.appendGitRetrySchedulingMilestone({
      ...base,
      milestone: "retryAcceptedAt",
      occurredAt: "2026-09-22T00:00:00.000Z",
      waitingFor: {
        kind: "git-initialization",
        objectId: "git-init-project-1@2",
        reason: "Waiting for Git ready",
        deadlineAt: null
      }
    })).toMatchObject({ replay: true, revision: revisionBeforeReplay });

    const [timeline] = fixture.database.projectState("project-1").gitRetryScheduling;
    expect(timeline).toMatchObject({
      retryId: base.retryId,
      operationId: base.operationId,
      attempt: 2,
      retryAcceptedAt: {
        at: "2026-09-22T00:00:00.000Z",
        projectId: "project-1",
        invocationId: "inv_prior_project_run",
        epoch: 3,
        epochKind: "coordinator"
      },
      gitReadyPersistedAt: {
        waitingFor: {
          kind: "prior-project-run",
          objectId: "inv_prior_project_run",
          deadlineAt: "2026-09-22T00:00:06.000Z"
        }
      },
      mainResidentOpenedAt: {
        invocationId: "inv_new_main",
        epoch: 1,
        epochKind: "coordinator",
        waitingFor: { kind: "none" }
      }
    });
    const adjacentMs = [
      Date.parse(timeline!.gitReadyPersistedAt!.at) -
        Date.parse(timeline!.retryAcceptedAt!.at),
      Date.parse(timeline!.priorRunSettledAt!.at) -
        Date.parse(timeline!.gitReadyPersistedAt!.at),
      Date.parse(timeline!.scheduleEnqueuedAt!.at) -
        Date.parse(timeline!.priorRunSettledAt!.at),
      Date.parse(timeline!.mainResidentOpenedAt!.at) -
        Date.parse(timeline!.scheduleEnqueuedAt!.at)
    ];
    expect(adjacentMs).toEqual([1_000, 9 * 60_000, 100, 100]);

    const lease = fixture.database.writerLease();
    fixture.database.close();
    const reopened = (await stateFixture({
      databasePath: fixture.databasePath,
      clock: fixture.clock,
      instanceId: "instance-a",
      writerLease: lease
    })).database;
    expect(reopened.projectState("project-1").gitRetryScheduling).toEqual([timeline]);
  });
});

describe("Authoritative workflow file projection", () => {
  it("derives the workflow, current group, members, invocation, and epochs from one SQLite revision", async () => {
    const { database } = await stateFixture();
    const snapshot = workflowSnapshot({
      agents: ["main", "alice", "bob"],
      collaborations: [{
        id: "group-node",
        displayName: "Evidence group",
        memberAgentIds: ["alice", "bob"]
      }]
    });
    createProject(database, { workflowSnapshot: snapshot });
    const activation = database.activateGroup(groupActivation({
      leaderInvocationId: "inv_group_leader_epoch_1",
      leaderRuntimePath: "/srv/openfars/runtime/group-run-1",
      residentLaunchProtocol: "trusted-supervisor-v1"
    }));
    database.assignTasks({
      projectId: "project-1",
      groupRunId: "group-run-1",
      actorAgentId: activation.groupRun.leaderAgentId,
      coordinatorEpoch: 1,
      tasks: [
        { id: "task-alice", assignment: "Collect facts", assigneeAgentId: "alice" },
        { id: "task-bob", assignment: "Verify facts", assigneeAgentId: "bob" }
      ]
    });
    claim(database, "alice", "execution-alice");

    const projection = database.projectState("project-1");
    const files = database.authoritativeWorkflowFiles("project-1");
    expect(files.definition).toEqual({
      schemaVersion: 1,
      projectId: "project-1",
      workflowRevision: 1,
      workflow: snapshot
    });
    expect(files.currentState).toMatchObject({
      schemaVersion: 1,
      projectId: "project-1",
      workflowRevision: 1,
      stateRevision: projection.stateRevision,
      runState: "active",
      currentNode: {
        nodeRunId: "node-run-1",
        nodeId: "group-node",
        kind: "collaboration",
        groupId: "group-node",
        workflowRevision: 1,
        runState: "active"
      },
      currentGroup: {
        groupRunId: "group-run-1",
        nodeRunId: "node-run-1",
        coordinatorEpoch: 1,
        invocationId: "inv_group_leader_epoch_1",
        memberAgentIds: ["alice", "bob"],
        runState: "active"
      },
      members: expect.arrayContaining([
        expect.objectContaining({
          agentId: "alice",
          taskIds: ["task-alice"],
          executionId: "execution-alice",
          invocationId: "invocation-execution-alice",
          ownershipEpoch: 1,
          runState: "active",
          rawStatus: "working"
        }),
        expect.objectContaining({
          agentId: "bob",
          taskIds: ["task-bob"],
          runState: "pending",
          rawStatus: "assigned"
        })
      ])
    });
    expect(JSON.stringify(files)).not.toMatch(
      /"(?:apiKey|authorization|oauthToken|gatewaySecret)"|gh[pousr]_|github_pat_|sk-[a-z0-9]{16}/i
    );
  });
});
