import { hasUserWorkflowPause } from "./workflow-recovery.js";
import type { ProjectSchedulingProjection, RuntimeActivity } from "./collaboration-state/contracts.js";
import type { ProjectRuntimeProjection, ProjectState } from "./types.js";
import { scopedProjectWaiting } from "./project-runtime-waiting.js";
import { githubAuthorizationWaiting } from "./internal/shared/project-runtime-status.js";

function runtimeActivityPriority(activity: RuntimeActivity): number {
  return (activity.leaseState === "current" ? 4 : 0) +
    (activity.kind === "turn" ? 2 : 0) +
    (activity.phase === "model:running" ? 1 : 0);
}

/**
 * Produce the sole live status projection consumed by state.json mirroring,
 * HTTP reads and SSE.  The file envelope supplies static project metadata;
 * no mutable live field from it is consulted once SQLite S exists.
 */
export function deriveProjectRuntimeProjection(
  projection: ProjectSchedulingProjection & Partial<Pick<ProjectState, "failureSummary" | "failureAttempts">>,
  fallback?: Pick<ProjectState, "status" | "phase" | "currentAgent" | "activeInvocationId" | "pauseRequest" | "workflowRecovery" | "lastError" | "failureAttempts" | "failureSummary">
): ProjectRuntimeProjection {
  const activities = structuredClone(projection.runtimeActivities);
  const primaryActivity = activities.filter(activity => {
    if (!activity.executionId) return true;
    const execution = projection.executions.find(item => item.id === activity.executionId);
    const scoped = projection.scopedExecutions?.find(item => item.id === activity.executionId);
    return !(execution && ["succeeded", "failed", "cancelled", "stopped", "superseded"].includes(execution.status) ||
      scoped && ["completed", "stopped"].includes(scoped.status));
  }).sort((left, right) =>
    runtimeActivityPriority(right) - runtimeActivityPriority(left) ||
    right.startedAt.localeCompare(left.startedAt) ||
    right.activityId.localeCompare(left.activityId)
  )[0];
  const activeNode = projection.activeNodeRunId
    ? projection.nodeRuns.find((node) => node.id === projection.activeNodeRunId)
    : undefined;
  const activeGroup = activeNode
    ? projection.groupRuns.find((group) =>
        group.nodeRunId === activeNode.id &&
        !["completed", "failed", "cancelled"].includes(group.status)
      )
    : undefined;
  const activeScopedGroup = activeNode ? projection.scopedGroupRuns?.find((group) => !group.parentGroupRunId && group.activationRequestId === activeNode.activationRequestId &&
    !["completed", "cancelled", "failed"].includes(group.status)) : undefined;
  const scopedWaiting = Boolean(activeScopedGroup && (
    fallback?.phase === "collaboration:scoped-waiting" ||
    !primaryActivity && (
      projection.scopedArrivals?.some((arrival) => arrival.groupRunId === activeScopedGroup.id && arrival.status === "queued") ||
      projection.scopedGroupIssues?.some((issue) => issue.groupRunId === activeScopedGroup.id)
    )
  ));
  const scopedExecution = primaryActivity?.executionId
    ? projection.scopedExecutions?.find((execution) => execution.id === primaryActivity.executionId) : undefined;
  const activeExecution = primaryActivity?.executionId
    ? projection.executions.find((execution) => execution.id === primaryActivity.executionId) ??
      (scopedExecution ? { ...scopedExecution, invocationId: primaryActivity.invocationId } : undefined)
    : activeNode
      ? [...projection.executions].reverse().find((execution) =>
          execution.nodeRunId === activeNode.id &&
          !["succeeded", "failed", "cancelled", "stopped", "superseded"]
            .includes(execution.status)
        )
      : undefined;
  // A failed restart stop proof leaves the writer fenced and the project
  // waiting for another automatic observation. Preserve the Agent's work
  // without displaying a technical recovery as user cancellation.
  const standaloneRecoveryPaused = !activeGroup &&
    activeExecution?.status === "stop_requested" && (fallback?.status === "retrying" ||
    fallback?.status === "paused" && fallback.phase === "collaboration:resident-stopped");
  const stopping = activeGroup?.cancellationRequested === true ||
    activeExecution?.status === "stop_requested" && !standaloneRecoveryPaused;
  const paused = projection.frozen || activeGroup?.status === "paused" ||
    activeNode?.status === "paused";
  const latestNode = projection.nodeRuns.at(-1);
  let status: ProjectRuntimeProjection["status"];
  let phase: string;
  // S's exact Stop receipt survives restart and outranks stale file status.
  // Keeping the cancellation fence does not mean the process is still
  // stopping: only an explicit Resume removes the user's retained intent.
  if (projection.resumableCancellation) {
    status = projection.resumableCancellation.stoppedAt ? "paused" : "cancelling";
    phase = projection.resumableCancellation.stoppedAt
      ? "collaboration:user-cancelled" : "collaboration:cancelling";
  } else if (stopping) {
    status = "cancelling";
    phase = "collaboration:cancelling";
  } else if (fallback?.pauseRequest && !["cancelling", "cancelled", "completed"].includes(fallback.status)) {
    status = fallback.pauseRequest.settledAt ? "paused" : "pausing";
    phase = fallback.pauseRequest.settledAt ? "collaboration:user-paused"
      : fallback.phase === "collaboration:user-pause-recovery-required"
        ? fallback.phase : "collaboration:user-pausing";
  } else if (fallback && hasUserWorkflowPause(fallback)) {
    status = fallback.status;
    phase = fallback.phase;
  } else if (fallback?.phase === "user-intervention-required") {
    status = "retrying";
    phase = fallback.phase;
  } else if (fallback?.status === "interrupted" && fallback.phase === "collaboration:repair-required") {
    status = fallback.status; phase = fallback.phase;
  } else if (paused) {
    status = "retrying";
    phase = projection.freezeReason?.includes("waiting_user")
      ? "collaboration:main-recovery-waiting"
      : projection.freezeReason
        ? "collaboration:main-recovery-retryable"
        : activeGroup?.pauseReason?.includes("all_members_exhausted")
          ? "collaboration:all-members-recovering"
          : activeGroup?.pauseReason?.includes("all_members_retryable")
            ? "collaboration:all-members-retryable"
            : activeGroup?.pauseReason?.startsWith("all_members")
              ? "collaboration:all-members-failed"
              : fallback?.status === "paused"
                ? fallback.phase
                : `collaboration:${activeGroup?.status ?? activeNode?.status ?? "paused"}`;
  } else if (fallback && [
    "interrupting", "interrupted", "cancelling",
    "cancelled", "completed", "retrying"
  ].includes(fallback.status)) {
    status = fallback.status;
    phase = fallback.phase;
  } else if (primaryActivity) {
    status = "running";
    phase = primaryActivity.leaseState === "recovering"
      ? "collaboration:recovering"
      : primaryActivity.phase;
  } else if (fallback?.status === "queued" && fallback.phase === "collaboration:workflow-adjustment-waiting") {
    status = "queued";
    phase = fallback.phase;
  } else if (activeExecution) {
    status = activeExecution.status === "queued" ? "queued" : "running";
    phase = `collaboration:${activeExecution.status.replaceAll("_", "-")}`;
  } else if (activeGroup) {
    status = ["preparing"].includes(activeGroup.status) ? "queued" : "running";
    phase = `collaboration:${activeGroup.status}`;
  } else if (activeScopedGroup) {
    status = scopedWaiting ? "queued" : "running";
    phase = scopedWaiting ? "collaboration:scoped-waiting" : `collaboration:scoped-${activeScopedGroup.status}`;
  } else if (activeNode) {
    if (["preparing", "queued"].includes(activeNode.status)) {
      status = "queued";
      phase = `collaboration:${activeNode.status}`;
    } else if (["completed", "failed", "cancelled"].includes(activeNode.status) && fallback) {
      status = fallback.status;
      phase = fallback.phase;
    } else {
      status = "running";
      phase = `collaboration:${activeNode.status}`;
    }
  } else if (projection.git.enabled && projection.git.status !== "ready") {
    status = "retrying";
    phase = `git:${projection.git.status}`;
  } else {
    status = fallback?.status ?? (latestNode?.status === "cancelled" ? "cancelled" : "queued");
    phase = fallback?.phase ?? (status === "cancelled" ? "cancelled" : "collaboration:ready");
  }
  const recentFailure = (projection.failureAttempts ?? fallback?.failureAttempts)?.filter(item => item.status === "failed" &&
    fallback?.lastError && item.redactedMessage === fallback.lastError).at(-1);
  const repairCode = recentFailure?.errorCode ?? "";
  const repairKind = /^(?:MODEL_AUTHENTICATION_FAILED|GITHUB_(?:ACCOUNT_REQUIRED|WAITING_FOR_AUTHORIZATION))$/.test(repairCode)
    ? "authorization" as const
    : /^(?:HARNESS_(?:NOT_FOUND|UNAVAILABLE|CAPABILITY_UNSUPPORTED|CONFIGURATION_INVALID)|MODEL_REQUEST_INVALID)$/.test(repairCode)
      ? "configuration" as const : "recovery" as const;
  const authorizationWaiting = githubAuthorizationWaiting({ status, phase, git: projection.git,
    lastError: fallback?.lastError, failureSummary: projection.failureSummary ?? fallback?.failureSummary,
    failureAttempts: projection.failureAttempts ?? fallback?.failureAttempts,
    runtime: { status, activities } });
  const waiting = phase === "user-intervention-required" ? { kind: "user-input" as const, reason: "等待用户输入后继续原任务" }
    : authorizationWaiting ? authorizationWaiting
    : phase === "collaboration:repair-required" ? { kind: repairKind, reason: recentFailure?.redactedMessage ?? fallback?.lastError ?? "执行条件需要修复；修复后可恢复原任务" }
    : !primaryActivity && activeScopedGroup && (
    status === "queued" || status === "retrying"
  ) ? phase === "collaboration:workflow-adjustment-waiting"
      ? { kind: "workflow-adjustment" as const, reason: "等待 Workflow 修改完成后继续调度", groupRunId: activeScopedGroup.id }
      : scopedProjectWaiting(projection, activeScopedGroup.id) ?? (scopedWaiting &&
        !projection.scopedArrivals?.some(arrival => arrival.groupRunId === activeScopedGroup.id && arrival.status === "queued")
        ? { kind: "management" as const, reason: `等待协调：协作组 ${activeScopedGroup.groupId} 的后续流程尚未确认`, groupRunId: activeScopedGroup.id }
        : undefined)
    : status === "retrying" && fallback?.workflowRecovery
      ? { kind: "backoff" as const, reason: fallback.workflowRecovery.reason,
        ...(activeExecution ? { agentId: activeExecution.agentId, executionId: activeExecution.id } : {}) }
      : undefined;
  if (status === "queued" && waiting?.kind === "recovery") phase = "collaboration:scoped-recovery-waiting";
  if (status === "queued" && waiting?.kind === "management") phase = "collaboration:scoped-management-waiting";
  const candidateAgent = primaryActivity?.agentId ?? activeExecution?.agentId ??
    (activeGroup
      ? activeGroup.actingCoordinatorId ?? activeGroup.leaderAgentId
      : activeNode?.node.kind === "agent"
        ? activeNode.node.agentId
        : activeScopedGroup ? undefined : fallback?.currentAgent);
  // A stale file-level Agent is not evidence of a live process. Paused and
  // terminal projections expose an Agent only when SQLite still has an active
  // runtime activity to support that claim.
  const currentAgent = ["paused", "retrying", "completed", "cancelled"].includes(status) && !primaryActivity
    ? undefined
    : candidateAgent;
  const executionCount = new Set(
    projection.executions.map((execution) => execution.taskId)
  ).size + (projection.scopedExecutions?.length ?? 0);
  return {
    stateRevision: projection.stateRevision,
    status,
    phase,
    ...(waiting ? { waiting } : {}),
    ...(currentAgent ? { currentAgent } : {}),
    ...(primaryActivity?.invocationId
      ? { activeInvocationId: primaryActivity.invocationId }
      : activeExecution?.invocationId
        ? { activeInvocationId: activeExecution.invocationId }
        : fallback?.activeInvocationId
          ? { activeInvocationId: fallback.activeInvocationId }
          : {}),
    ...(primaryActivity ? { activityStartedAt: primaryActivity.startedAt } : {}),
    ...(primaryActivity?.nodeRunId ?? activeNode?.id
      ? { nodeRunId: primaryActivity?.nodeRunId ?? activeNode!.id }
      : {}),
    ...(primaryActivity?.groupRunId ?? activeGroup?.id ?? activeScopedGroup?.id
      ? { groupRunId: primaryActivity?.groupRunId ?? activeGroup?.id ?? activeScopedGroup!.id }
      : {}),
    ...(primaryActivity?.taskId ? { taskId: primaryActivity.taskId } : {}),
    ...(primaryActivity?.executionId ?? activeExecution?.id
      ? { executionId: primaryActivity?.executionId ?? activeExecution!.id }
      : {}),
    ...(primaryActivity?.ownershipEpoch !== undefined
      ? { ownershipEpoch: primaryActivity.ownershipEpoch }
      : activeExecution
        ? { ownershipEpoch: activeExecution.ownershipEpoch }
        : {}),
    ...(primaryActivity?.coordinatorEpoch !== undefined
      ? { coordinatorEpoch: primaryActivity.coordinatorEpoch }
      : activeGroup
        ? { coordinatorEpoch: activeGroup.coordinatorEpoch }
        : {}),
    ...(primaryActivity ? { leaseState: primaryActivity.leaseState } : {}),
    executionCount,
    ...(primaryActivity ? { primaryActivity } : {}),
    activities
  };
}
