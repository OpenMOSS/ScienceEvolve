import { afterEach, describe, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildAgentQueueSnapshot, type ProjectAgentQueueSource } from "../../src/core/agent-queue-view.js";
import { CollaborationStateDatabase } from "../../src/core/collaboration-state/store.js";
import { deriveProjectRuntimeProjection } from "../../src/core/collaboration-runtime.js";
import { cloneAgentOrchestrationTemplate } from "../../src/core/agent-orchestration.js";
import type { AgentQueueSnapshot, ProjectState } from "../../src/core/types.js";

const shared = (): AgentQueueSnapshot => ({ main: { capacity: 10, activeProjectIds: [], queued: [] }, worker: { capacity: 10, activeProjectIds: [], queued: [] } });
function state(): ProjectState {
  return { id: "parallel-project", status: "running", updatedAt: "2026-10-14T00:00:00Z", git: { enabled: true },
    agents: {}, orchestration: cloneAgentOrchestrationTemplate(), runtime: { stateRevision: 1, status: "running", phase: "collaboration:running", executionCount: 2, activities: [] } } as unknown as ProjectState;
}
const source = (state: ProjectState): ProjectAgentQueueSource => ({ state, capacities: { main: 1, worker: 2 }, occupied: { main: 0, worker: 2 } });
function activity(id: string, agentId: string, extra = {}) {
  return { activityId: id, projectId: "parallel-project", invocationId: id, agentId, nodeRunId: "root", executionId: `execution-${id}`,
    kind: "resident" as const, phase: "resident:running" as const, scopeKind: "scoped-agent" as const, startedAt: "2026-10-14T00:00:00Z",
    writerLeaseEpoch: 1, leaseState: "current" as const, ...extra };
}
const databases: CollaborationStateDatabase[] = [], roots: string[] = [];
afterEach(async () => { databases.splice(0).forEach(db => db.close()); await Promise.all(roots.splice(0).map(root => fs.rm(root, { recursive: true, force: true }))); });

describe("Agent queue read model", () => {
  it("counts parallel invocations in one project and retains shared scheduler owners", () => {
    const project = state(), legacy = shared();
    legacy.worker.activeProjectIds = ["serial-project"];
    project.runtime!.activities = [activity("call-a", "alice"), activity("call-b", "bob")];
    const result = buildAgentQueueSnapshot(legacy, [project], [source(project)]);
    expect(result.worker.activeTasks?.map(item => item.agentId)).toEqual([undefined, "alice", "bob"]);
    expect(result.worker.activeTasks).toHaveLength(3);
    expect(result.worker.activeProjectIds).toEqual(["serial-project", "parallel-project"]);
    expect(result.worker.pools).toContainEqual({ id: "project:parallel-project:worker", scope: "project", projectId: project.id, capacity: 2, occupied: 2 });
    expect(legacy.worker.activeTasks).toBeUndefined();
  });

  it("deduplicates resident/model facts by invocation and classifies non-Main Leaders as management", () => {
    const project = state();
    project.runtime!.activities = [activity("call", "alice"), activity("call", "alice", { activityId: "model", kind: "turn", phase: "model:running" }),
      activity("leader-call", "leader", { scopeKind: "scoped-leader", executionId: undefined })];
    const result = buildAgentQueueSnapshot(shared(), [project], [source(project)]);
    expect(result.worker.activeTasks).toHaveLength(1);
    expect(result.main.activeTasks).toMatchObject([{ agentId: "leader" }]);
  });

  it("counts a later repair turn in the original resident as one occupied slot", () => {
    const project = state();
    project.runtime!.activities = [activity("resident", "alice", { executionId: "execution", ownershipEpoch: 3 }),
      activity("repair", "alice", { executionId: "execution", ownershipEpoch: 3, kind: "turn", phase: "model:running" }),
      activity("leader-resident", "leader", { executionId: undefined, groupRunId: "group", coordinatorEpoch: 2 }),
      activity("leader-repair", "leader", { executionId: undefined, groupRunId: "group", coordinatorEpoch: 2, kind: "turn", phase: "model:running" })];
    const result = buildAgentQueueSnapshot(shared(), [], [source(project)]);
    expect(result.worker.activeTasks).toMatchObject([{ invocationId: "repair" }]);
    expect(result.worker.activeTasks).toHaveLength(1);
    expect(result.main.activeTasks).toMatchObject([{ invocationId: "leader-repair" }]);
    expect(result.main.activeTasks).toHaveLength(1);
  });

  it("separates prior-writer recovery facts and excludes paused, completed and archived waiting work", () => {
    const project = state(); project.status = "paused";
    project.runtime!.activities = [activity("old", "alice", { leaseState: "recovering" })];
    project.executions = [{ id: "queued", status: "queued", agentId: "bob" }] as never;
    const result = buildAgentQueueSnapshot(shared(), [], [source(project)]);
    expect(result.worker.activeTasks).toEqual([]);
    expect(result.worker.recoveringTasks).toMatchObject([{ agentId: "alice", state: "recovering" }]);
    expect(result.worker.queued).toEqual([]);
    for (const retired of [{ ...project, status: "completed" as const }, { ...project, archivedAt: "2026-10-14T00:00:00Z" }]) {
      expect(buildAgentQueueSnapshot(shared(), [], [source(retired)]).worker.recoveringTasks).toEqual([]);
    }
  });

  it("retains distinct arrival IDs for a shared Agent waiting in different scopes", () => {
    const project = state();
    project.scopedGroupRuns = [{ id: "group", status: "running", leaderAgentId: "leader" }] as never;
    project.scopedArrivals = [2, 1].map(sequence => ({ sequence, requestId: `arrival-${sequence}`, groupRunId: "group", targetKind: "agent", agentId: "alice", status: "queued" })) as never;
    const result = buildAgentQueueSnapshot(shared(), [], [source(project)]);
    expect(result.worker.queued.map(item => [item.id, item.position])).toEqual([["parallel-project:arrival:arrival-1", 1], ["parallel-project:arrival:arrival-2", 2]]);
  });

  it.each(["retrying", "interrupted", "paused", "failed"] as const)("does not count retained startup activities as executing while the project is %s", status => {
    const project = state();
    project.status = status;
    project.runtime!.status = status;
    project.runtime!.activities = [activity("failed-start", "alice", { phase: "resident:starting" }),
      activity("manager", "main", { executionId: undefined })];
    const before = structuredClone(project);
    const result = buildAgentQueueSnapshot(shared(), [project], [source(project)]);
    for (const kind of ["main", "worker"] as const) {
      expect(result[kind].activeTasks).toEqual([]);
      expect(result[kind].activeProjectIds).toEqual([]);
      expect(result[kind].recoveringTasks).toMatchObject([{ projectId: project.id, state: "recovering" }]);
    }
    expect(result.worker.pools).toContainEqual(expect.objectContaining({ occupied: 2 }));
    expect(project).toEqual(before);
  });

  it("excludes queued arrivals from an old outer node or a paused ancestor", () => {
    const project = state();
    project.activeNodeRunId = "current-node";
    project.nodeRuns = [{ id: "current-node", activationRequestId: "current-activation" }] as never;
    project.scopedGroupRuns = [{ id: "old", activationRequestId: "old-activation", status: "running" },
      { id: "paused", activationRequestId: "current-activation", status: "paused" },
      { id: "child", parentGroupRunId: "paused", status: "running" }] as never;
    project.scopedArrivals = ["old", "child"].map(groupRunId => ({ groupRunId, requestId: groupRunId, status: "queued", targetKind: "agent", agentId: "alice", sequence: 1 })) as never;
    expect(buildAgentQueueSnapshot(shared(), [], [source(project)]).worker.queued).toEqual([]);
  });

  it("reads real v3 parallel ownership and FIFO waits without changing the database revision", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-agent-queue-")); roots.push(root);
    const db = CollaborationStateDatabase.open({ databasePath: path.join(root, "state.sqlite"), serviceId: "queue-test", hostId: "test", topology: "single-host" }); databases.push(db);
    const project = state();
    const workflow = { schemaVersion: 3, agents: [{ name: "main" }, { name: "alice" }, { name: "bob" }], collaborations: [{ id: "team" }],
      scopedWorkflow: { schemaVersion: 1, rootAgentIds: ["main"], groups: [{ id: "team", leaderAgentId: "main", allowLeaderReconfiguration: false,
        workflow: { nodes: [{ kind: "agent", nodeId: "a1", agentId: "alice" }, { kind: "agent", nodeId: "b", agentId: "bob" }, { kind: "agent", nodeId: "a2", agentId: "alice" }],
          input: { source: "input", edges: ["a1", "b", "a2"].map(target => ({ kind: "parallel", target })) },
          routes: Object.fromEntries(["a1", "b", "a2"].map(node => [node, [{ kind: "strong", target: "finish" }]])) } }] } };
    db.createProject({ projectId: project.id, workflowRevision: 1, workerCapacity: 2, managementCapacity: 1, workflowSnapshot: workflow, git: { enabled: true, status: "ready" } });
    const group = db.activateScopedGroup({ projectId: project.id, groupRunId: "group", groupId: "team", activationRequestId: "activate", workflowRevision: 1,
      baseCommit: "a".repeat(40), outer: { nodeRunId: "root", inputSnapshotRef: "input", activatedByAgentId: "main" } });
    for (const arrival of group.arrivals.slice(0, 2)) {
      const execution = db.claimScopedAgentArrival({ projectId: project.id, arrivalRequestId: arrival.requestId, agentId: arrival.agentId!, executionId: `exec-${arrival.agentId}`,
        worktreePath: path.join(root, "git-worktrees", "agents", arrival.agentId!) })!.execution;
      const identity = { projectId: project.id, executionId: execution.id, ownershipEpoch: execution.ownershipEpoch, invocationId: `inv-${arrival.agentId}` };
      db.beginScopedAgentTurn({ ...identity, runtimePath: path.join(root, "runtime", arrival.agentId!), baseCommit: "a".repeat(40) });
      db.markScopedAgentTurnOpened({ ...identity, nativeProcessOpened: true });
    }
    const fullProjection = db.projectState(project.id);
    const projection = db.projectSchedulingState(project.id)!, revision = projection.stateRevision;
    for (const key of Object.keys(projection) as (keyof typeof projection)[]) {
      if (key === "arrivalEnteredAt") expect(Object.keys(projection.arrivalEnteredAt!)).toHaveLength(3);
      else if (key === "git") expect(fullProjection.git).toMatchObject(projection.git);
      else expect(projection[key]).toEqual(fullProjection[key]);
    }
    const live = { ...project, orchestration: workflow, activeNodeRunId: projection.activeNodeRunId, nodeRuns: projection.nodeRuns,
      scopedGroupRuns: projection.scopedGroupRuns, scopedArrivals: projection.scopedArrivals,
      scopedExecutions: projection.scopedExecutions, runtime: deriveProjectRuntimeProjection(projection, project) } as unknown as ProjectState;
    const result = buildAgentQueueSnapshot(shared(), [], [{ ...source(live), arrivalEnteredAt: projection.arrivalEnteredAt }]);
    expect(result.worker.activeTasks).toHaveLength(2);
    expect(result.worker.queued).toMatchObject([{ agentId: "alice", position: 1 }]);
    expect(result.worker.queued[0].enteredAt).toBe(projection.arrivalEnteredAt![group.arrivals[2].requestId]);
    expect(db.projectState(project.id).stateRevision).toBe(revision);
    const cached = db.projectSchedulingState(project.id)!;
    cached.runtimeActivities.length = 0;
    expect(db.projectSchedulingState(project.id)!.runtimeActivities).toHaveLength(2);
    db.stopScopedAgentTurn({ projectId: project.id, executionId: "exec-alice", ownershipEpoch: 1,
      invocationId: "inv-alice", residentStopConfirmed: true });
    const stopped = db.projectSchedulingState(project.id)!;
    expect(stopped.stateRevision).toBeGreaterThan(revision);
    expect(stopped.runtimeActivities).toHaveLength(1);
  });
});
