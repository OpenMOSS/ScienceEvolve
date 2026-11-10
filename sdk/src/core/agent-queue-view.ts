import type { AgentKind, AgentQueueItem, AgentQueueSnapshot, AgentQueueTask, ProjectState } from "./types.js";

export type ProjectAgentQueueState = Pick<ProjectState,
  "id" | "status" | "archivedAt" | "updatedAt" | "queueEnteredAt" | "orchestration" | "runtime" |
  "activeNodeRunId" | "nodeRuns" | "groupRuns" | "scopedGroupRuns" | "scopedGroupIssues" | "scopedArrivals" | "executions" | "tasks">;

export interface ProjectAgentQueueSource {
  state: ProjectAgentQueueState;
  capacities: Record<"main" | "worker", number>;
  occupied: Record<"main" | "worker", number>;
  arrivalEnteredAt?: Record<string, string>;
}

/** Read-only view of shared leases and project-owned Git scheduling facts. */
export function buildAgentQueueSnapshot(shared: AgentQueueSnapshot, projects: ProjectState[], formal: ProjectAgentQueueSource[]): AgentQueueSnapshot {
  const result = structuredClone(shared);
  const byProject = new Map(projects.map(state => [state.id, state]));
  for (const kind of ["main", "worker"] as const) {
    const row = result[kind];
    row.activeTasks = row.activeProjectIds.map(projectId => ({ id: `shared:${kind}:${projectId}`, projectId,
      agentId: byProject.get(projectId)?.currentAgent ?? byProject.get(projectId)?.queuedAgent,
      invocationId: byProject.get(projectId)?.activeInvocationId, state: "running" }));
    row.recoveringTasks = [];
    row.pools = [{ id: `shared:${kind}`, scope: "shared", capacity: row.capacity, occupied: row.activeTasks.length }];
    row.queued = row.queued.map(item => ({ ...item, id: `shared:${kind}:${item.projectId}`, poolId: `shared:${kind}`,
      agentId: byProject.get(item.projectId)?.queuedAgent }));
  }
  for (const { state, capacities, occupied, arrivalEnteredAt } of formal) {
    if (state.archivedAt || ["completed", "cancelled"].includes(state.status)) continue;
    const activities = new Map<string, NonNullable<ProjectState["runtime"]>["activities"][number]>();
    for (const activity of state.runtime?.activities ?? []) {
      const owner = JSON.stringify(activity.executionId
        ? [activity.scopeKind, activity.executionId, activity.ownershipEpoch]
        : [activity.scopeKind, activity.groupRunId ?? activity.nodeRunId, activity.agentId, activity.coordinatorEpoch]);
      const previous = activities.get(owner);
      // A resident and its current model turn occupy one slot, including a
      // later repair turn with a new invocation ID in the same resident.
      if (!previous || previous.leaseState === "recovering" && activity.leaseState === "current" ||
        previous.leaseState === activity.leaseState && activity.kind === "turn") activities.set(owner, activity);
    }
    const retained = ["paused", "retrying", "interrupted", "failed"].includes(state.runtime?.status ?? state.status);
    for (const activity of activities.values()) {
      const management = activity.scopeKind === "scoped-leader" || activity.scopeKind === "scoped-main" ||
        activity.scopeKind === "terminal-push-coordinator" || !activity.executionId;
      const kind: AgentKind = management ? "main" : "worker";
      const task: AgentQueueTask = { id: `${state.id}:${activity.invocationId}`, projectId: state.id, agentId: activity.agentId,
        invocationId: activity.invocationId, executionId: activity.executionId, groupRunId: activity.groupRunId, startedAt: activity.startedAt,
        state: retained || activity.leaseState === "recovering" ? "recovering" : activity.phase === "resident:starting" ? "starting" : "running" };
      (task.state === "recovering" ? result[kind].recoveringTasks! : result[kind].activeTasks!).push(task);
    }
    const waiting: Record<"main" | "worker", AgentQueueItem[]> = { main: [], worker: [] };
    if (["queued", "running"].includes(state.status)) {
      const scopedGroups = new Map(state.scopedGroupRuns?.map(group => [group.id, group]));
      const activeNode = state.nodeRuns?.find(node => node.id === state.activeNodeRunId);
      const scopedGroupIsActive = (groupRunId: string): boolean => {
        let group = scopedGroups.get(groupRunId);
        const seen = new Set<string>();
        while (group) {
          if (seen.has(group.id) || ["completed", "cancelled", "failed", "paused"].includes(group.status)) return false;
          seen.add(group.id);
          if (!group.parentGroupRunId) return !activeNode || activeNode.activationRequestId === group.activationRequestId;
          group = scopedGroups.get(group.parentGroupRunId);
        }
        return false;
      };
      for (const arrival of [...(state.scopedArrivals ?? [])].sort((left, right) => left.sequence - right.sequence)) {
        const group = scopedGroups.get(arrival.groupRunId);
        if (arrival.status !== "queued" || !group || !scopedGroupIsActive(group.id) || !["running", "coordinating", "integrating"].includes(group.status)) continue;
        const kind = arrival.targetKind === "collaboration" ? "main" : "worker";
        const agentId = arrival.agentId ?? state.orchestration.scopedWorkflow?.groups.find(group => group.id === arrival.childGroupId)?.leaderAgentId;
        waiting[kind].push({ id: `${state.id}:arrival:${arrival.requestId}`, projectId: state.id, agentId, groupRunId: arrival.groupRunId,
          position: waiting[kind].length + 1, enteredAt: arrivalEnteredAt?.[arrival.requestId] ?? state.queueEnteredAt ?? "", reason: "等待项目调度或 Agent 空闲" });
      }
      const activeExecutionIds = new Set([...activities.values()].map(activity => activity.executionId));
      for (const execution of state.executions ?? []) {
        if (execution.status !== "queued" || activeExecutionIds.has(execution.id) ||
          state.activeNodeRunId && execution.nodeRunId !== state.activeNodeRunId) continue;
        waiting.worker.push({ id: `${state.id}:execution:${execution.id}`, projectId: state.id, agentId: execution.agentId, executionId: execution.id,
          groupRunId: execution.groupRunId, position: waiting.worker.length + 1, enteredAt: execution.queuedAt ?? state.updatedAt });
      }
      for (const task of [...(state.tasks ?? [])].sort((left, right) => left.queueOrdinal - right.queueOrdinal)) {
        if (task.status !== "pending" || !task.assigneeAgentId || task.currentExecutionId ||
          state.activeNodeRunId && task.nodeRunId !== state.activeNodeRunId) continue;
        const group = task.groupRunId ? state.groupRuns?.find(group => group.id === task.groupRunId) : undefined;
        if (task.groupRunId && (!group || !["running", "coordinating"].includes(group.status))) continue;
        const dependencyPending = task.dependencyTaskIds.some(id => !state.tasks?.some(dependency => dependency.id === id && dependency.status === "succeeded"));
        waiting.worker.push({ id: `${state.id}:task:${task.id}`, projectId: state.id, agentId: task.assigneeAgentId, groupRunId: task.groupRunId,
          position: waiting.worker.length + 1, enteredAt: task.createdAt ?? state.updatedAt,
          reason: dependencyPending ? "等待前置任务" : "等待项目调度" });
      }
      for (const group of state.groupRuns ?? []) {
        if (group.status !== "coordinating" || state.activeNodeRunId && group.nodeRunId !== state.activeNodeRunId ||
          [...activities.values()].some(activity => activity.groupRunId === group.id && !activity.executionId)) continue;
        waiting.main.push({ id: `${state.id}:management:${group.id}`, projectId: state.id, agentId: group.actingCoordinatorId ?? group.leaderAgentId,
          groupRunId: group.id, position: waiting.main.length + 1, enteredAt: "", reason: "等待管理调用" });
      }
      const pendingGroups = new Set<string>();
      for (const issue of state.scopedGroupIssues ?? []) {
        const group = scopedGroups.get(issue.groupRunId);
        if (!group || !scopedGroupIsActive(group.id) || pendingGroups.has(group.id) ||
          [...activities.values()].some(activity => activity.groupRunId === group.id && !activity.executionId)) continue;
        pendingGroups.add(group.id);
        waiting.main.push({ id: `${state.id}:management:${group.id}`, projectId: state.id, agentId: group.leaderAgentId,
          groupRunId: group.id, position: waiting.main.length + 1, enteredAt: "",
          reason: state.runtime?.waiting?.groupRunId === group.id ? state.runtime.waiting.reason : "等待协作组恢复处理" });
      }
    }
    for (const kind of ["main", "worker"] as const) {
      const poolId = `project:${state.id}:${kind}`;
      result[kind].queued.push(...waiting[kind].map(item => ({ ...item, poolId })));
      if (occupied[kind] || waiting[kind].length || result[kind].activeTasks!.some(item => item.projectId === state.id) ||
        result[kind].recoveringTasks!.some(item => item.projectId === state.id)) {
        result[kind].pools!.push({ id: poolId, scope: "project", projectId: state.id, capacity: capacities[kind], occupied: occupied[kind] });
      }
    }
  }
  for (const kind of ["main", "worker"] as const) result[kind].activeProjectIds = [...new Set(result[kind].activeTasks!.map(task => task.projectId))];
  return result;
}
