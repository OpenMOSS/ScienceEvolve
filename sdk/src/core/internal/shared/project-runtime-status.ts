/** Browser/server shared read-only projection. No runtime or database dependencies. */
interface AuthorizationAttempt {
  status: string;
  errorCode: string | null;
  redactedMessage: string;
  metadata?: Readonly<Record<string, unknown>>;
}

/** Only a current blocker may override a retained orchestration incident.
 * Historical authorization failures remain auditable after recovery. */
export function githubAuthorizationWaiting(project: {
  status: string;
  phase?: string;
  lastError?: string;
  error?: string;
  git?: { enabled: boolean; status: string };
  runtime?: { status: string; activities: readonly unknown[] };
  failureSummary?: { latestAttempt?: AuthorizationAttempt };
  failureAttempts?: readonly AuthorizationAttempt[];
}): { kind: "authorization"; reason: string } | undefined {
  if (!project.git?.enabled || !["queued", "retrying", "interrupted"].includes(project.status) ||
    project.phase === "user-intervention-required" ||
    project.phase === "collaboration:workflow-adjustment-waiting" ||
    project.runtime?.status === project.status && project.runtime.activities.length > 0) return undefined;
  const latest = project.failureSummary?.latestAttempt ?? project.failureAttempts?.at(-1);
  const currentError = project.lastError ?? project.error;
  if (project.git.status !== "waiting_for_github" && !(latest?.status === "failed" &&
    latest.errorCode === "GITHUB_WAITING_FOR_AUTHORIZATION" && currentError &&
    currentError === latest.redactedMessage)) return undefined;
  return { kind: "authorization", reason: latest?.metadata?.status === 403
    ? "GitHub 权限不足或访问被拒绝，请检查绑定账号的仓库权限。"
    : "GitHub 授权已失效或不可用，请重新登录项目绑定的 GitHub 账号。" };
}

export type RuntimeDisplayState =
  | "waiting" | "queued" | "running" | "completed" | "retrying" | "paused"
  | "stopping" | "stopped" | "superseded" | "failed" | "interrupted" | "skipped";

interface ExecutionFact {
  id: string;
  agentId: string;
  status: string;
  groupRunId?: string;
  arrivalRequestId?: string;
  taskId?: string;
  ownershipEpoch?: number;
}
interface GroupFact {
  id: string;
  groupId: string;
  parentGroupRunId?: string;
  parentArrivalRequestId?: string;
  status: string;
}
interface ArrivalFact {
  sequence: number;
  requestId: string;
  groupRunId: string;
  targetNodeId: string;
  agentId?: string;
  status: string;
}
export interface RuntimeStatusSource {
  status: string;
  currentAgent?: string;
  queuedAgent?: string;
  runtime?: {
    status: string;
    executionId?: string;
    groupRunId?: string;
    leaseState?: string;
    activities: readonly {
      agentId: string;
      executionId?: string;
      groupRunId?: string;
      ownershipEpoch?: number;
      leaseState?: string;
    }[];
  };
  orchestration: {
    scopedWorkflow?: { groups: readonly { id: string; parentGroupId?: string }[] };
  };
  nodeRuns?: readonly { node: { kind: string; nodeId: string; agentId?: string }; status: string }[];
  executions?: readonly ExecutionFact[];
  scopedExecutions?: readonly ExecutionFact[];
  scopedArrivals?: readonly ArrivalFact[];
  scopedGroupRuns?: readonly GroupFact[];
}

export function runtimeDisplayState(status: string): RuntimeDisplayState {
  if (["running", "working", "coordinating", "integrating", "resolving", "active"].includes(status)) return "running";
  if (["preparing", "queued", "pending", "assigned"].includes(status)) return "queued";
  if (["completed", "succeeded", "merged"].includes(status)) return "completed";
  if (["cancelled", "stopped"].includes(status)) return "stopped";
  if (["interrupting", "pausing", "cancelling", "stop_requested"].includes(status)) return "stopping";
  if (["paused", "failed", "interrupted", "retrying", "skipped", "superseded"].includes(status)) return status as RuntimeDisplayState;
  return "waiting";
}

export function projectLifecycleState(project: RuntimeStatusSource, state: RuntimeDisplayState): RuntimeDisplayState {
  if (["completed", "failed", "stopped", "skipped", "superseded", "waiting"].includes(state)) return state;
  const status = project.runtime?.status ?? project.status;
  if (status === "paused") return "paused";
  if (status === "interrupted") return "interrupted";
  if (["interrupting", "pausing", "cancelling", "stopping"].includes(status)) return "stopping";
  if (["cancelled", "stopped"].includes(status)) return "stopped";
  if (status === "failed") return "failed";
  if (status === "completed") return "waiting";
  return state;
}

/** A nested group belongs to the current parent run, never a previous parent batch. */
export function currentScopedGroupRun<T extends GroupFact>(
  project: Omit<RuntimeStatusSource, "scopedGroupRuns"> & { scopedGroupRuns?: readonly T[] }, groupId: string,
  visited = new Set<string>()
): T | undefined {
  if (visited.has(groupId)) return undefined;
  visited.add(groupId);
  const definition = project.orchestration.scopedWorkflow?.groups.find((group) => group.id === groupId);
  const parent = definition?.parentGroupId
    ? currentScopedGroupRun(project, definition.parentGroupId, visited) : undefined;
  if (definition?.parentGroupId && !parent) return undefined;
  return project.scopedGroupRuns?.filter((run) => run.groupId === groupId &&
    (!definition?.parentGroupId || run.parentGroupRunId === parent?.id)).at(-1);
}

export function scopedGroupDisplayState(project: RuntimeStatusSource, groupId: string): RuntimeDisplayState {
  const run = currentScopedGroupRun(project, groupId);
  return run ? scopedLifecycleState(project, groupId, runtimeDisplayState(run.status)) : "waiting";
}

function scopedLifecycleState(project: RuntimeStatusSource, groupId: string, state: RuntimeDisplayState): RuntimeDisplayState {
  if (["completed", "failed", "stopped", "skipped", "superseded", "waiting"].includes(state)) return state;
  const visited = new Set<string>();
  let run: GroupFact | undefined = currentScopedGroupRun(project, groupId);
  while (run && !visited.has(run.id)) {
    visited.add(run.id);
    const groupState = runtimeDisplayState(run.status);
    if (["paused", "stopped", "stopping", "failed", "interrupted"].includes(groupState)) state = groupState;
    run = project.scopedGroupRuns?.find((parent) => parent.id === run!.parentGroupRunId);
  }
  return projectLifecycleState(project, state);
}

/** An executing arrival wins over its queued successor; settled history cannot hide a new attempt. */
export function scopedNodeDisplayState(project: RuntimeStatusSource, groupId: string, nodeId: string): RuntimeDisplayState {
  const run = currentScopedGroupRun(project, groupId);
  if (!run) return "waiting";
  const arrivals = (project.scopedArrivals ?? []).filter((arrival) =>
    arrival.groupRunId === run.id && arrival.targetNodeId === nodeId).sort((a, b) => b.sequence - a.sequence);
  const arrival = arrivals.find((fact) => runtimeDisplayState(fact.status) === "running") ?? arrivals[0];
  if (!arrival) return "waiting";
  const execution = (project.scopedExecutions ?? []).filter((fact) => fact.arrivalRequestId === arrival.requestId)
    .sort((a, b) => (b.ownershipEpoch ?? 0) - (a.ownershipEpoch ?? 0))[0];
  let state = runtimeDisplayState(execution?.status ?? arrival.status);
  if (["completed", "failed", "stopped", "skipped"].includes(runtimeDisplayState(arrival.status))) state = runtimeDisplayState(arrival.status);
  // Retained leases from a prior backend writer describe recovery, not current execution.
  if (execution && state === "running" && project.runtime?.activities.some((activity) =>
    activity.executionId === execution.id && activity.leaseState === "recovering") &&
    !project.runtime.activities.some((activity) => activity.executionId === execution.id &&
      activity.leaseState !== "recovering" && activity.ownershipEpoch === execution.ownershipEpoch)) state = "interrupted";
  if (execution?.status === "running" && state === "running" && project.runtime?.status === "running" && run.status === "running" &&
    !project.runtime.activities.some((activity) => activity.executionId === execution.id &&
      activity.leaseState !== "recovering" && (activity.ownershipEpoch === undefined || activity.ownershipEpoch === execution.ownershipEpoch)) &&
    !(project.runtime.executionId === execution.id && project.runtime.leaseState !== "recovering")) state = "waiting";
  if (run.status === "paused" && ["running", "queued"].includes(state)) state = "paused";
  if (["cancelled", "stopped"].includes(run.status) && ["running", "queued"].includes(state)) state = "stopped";
  return scopedLifecycleState(project, groupId, state);
}

export function agentDisplayState(
  project: RuntimeStatusSource, agentId: string, fallback?: RuntimeDisplayState
): RuntimeDisplayState {
  const executions = [...(project.executions ?? []), ...(project.scopedExecutions ?? [])];
  const activities = (project.runtime?.activities ?? []).filter((activity) => {
    if (activity.agentId !== agentId) return false;
    const group = project.scopedGroupRuns?.find((run) => run.id === activity.groupRunId);
    if (group && currentScopedGroupRun(project, group.groupId)?.id !== group.id) return false;
    const execution = executions.find((fact) => fact.id === activity.executionId);
    if (!execution) return true;
    if (["completed", "failed", "stopped", "skipped", "superseded"].includes(runtimeDisplayState(execution.status))) return false;
    return activity.ownershipEpoch === undefined || activity.ownershipEpoch === execution.ownershipEpoch;
  });
  if (activities.some((activity) => activity.leaseState !== "recovering")) return projectLifecycleState(project, "running");
  if (activities.length) return projectLifecycleState(project, "interrupted");
  if (project.queuedAgent === agentId) return projectLifecycleState(project,
    project.status === "retrying" ? "retrying" : "queued");

  const states: RuntimeDisplayState[] = [];
  const groups = project.orchestration.scopedWorkflow?.groups ?? [];
  for (const group of groups) {
    const run = currentScopedGroupRun(project, group.id);
    const arrivals = (project.scopedArrivals ?? []).filter((arrival) => arrival.groupRunId === run?.id && arrival.agentId === agentId);
    for (const nodeId of new Set(arrivals.map((arrival) => arrival.targetNodeId))) states.push(scopedNodeDisplayState(project, group.id, nodeId));
  }
  const node = project.nodeRuns?.filter((run) => run.node.kind === "agent" && run.node.agentId === agentId).at(-1);
  if (node) states.push(projectLifecycleState(project,
    project.runtime?.status === "running" && node.status === "running" ? "waiting" : runtimeDisplayState(node.status)));
  const latestExecution = project.executions?.filter((execution) => execution.agentId === agentId).at(-1);
  if (latestExecution && !node) states.push(projectLifecycleState(project, runtimeDisplayState(latestExecution.status)));
  if (states.length) {
    const priority: RuntimeDisplayState[] = ["running", "stopping", "retrying", "queued", "paused", "interrupted", "failed", "completed", "stopped", "skipped", "superseded", "waiting"];
    return priority.find((state) => states.includes(state))!;
  }
  if (!project.runtime && project.currentAgent === agentId) return projectLifecycleState(project, "running");
  // Once a live projection exists, a stale running snapshot cannot revive a closed call.
  return project.runtime && fallback === "running" ? "waiting" : projectLifecycleState(project, fallback ?? "waiting");
}

export function agentProgressState(state: RuntimeDisplayState):
  "waiting" | "queued" | "running" | "completed" | "retrying" | "paused" | "interrupting" | "interrupted" | "cancelled" | "failed" {
  if (state === "stopping") return "interrupting";
  if (state === "stopped") return "cancelled";
  if (state === "superseded" || state === "skipped") return "waiting";
  return state;
}
