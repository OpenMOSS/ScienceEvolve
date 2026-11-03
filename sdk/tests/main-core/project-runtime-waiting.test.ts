import { describe, expect, it } from "vitest";
import { deriveProjectRuntimeProjection } from "../../src/core/project-runtime-projection.js";
import { buildAgentQueueSnapshot } from "../../src/core/agent-queue-view.js";
import type { ProjectSchedulingProjection } from "../../src/core/collaboration-state/contracts.js";
import type { FailureAttempt, ProjectState } from "../../src/core/types.js";

function fixture(): ProjectSchedulingProjection & Partial<Pick<ProjectState, "failureSummary" | "failureAttempts">> {
  return {
    id: "project", stateRevision: 3, frozen: false, git: { enabled: true, status: "ready" },
    workflowSnapshot: {}, activeNodeRunId: "node-G", tasks: [], executions: [], groupRuns: [],
    nodeRuns: [{ id: "node-G", activationRequestId: "activate-G", status: "running", node: { kind: "collaboration", groupId: "G" } }],
    scopedGroupRuns: [{ id: "run-G", groupId: "G", leaderAgentId: "main", activationRequestId: "activate-G", status: "running" }],
    scopedArrivals: [], runtimeActivities: [],
    scopedExecutions: [{ id: "exec-a", agentId: "opportunity", groupRunId: "run-G", ownershipEpoch: 1, status: "integrating" }],
    scopedGroupIssues: [{ id: "issue-a", groupRunId: "run-G", kind: "mechanism", arrivalRequestId: "arrival-a", executionId: "exec-a", ownershipEpoch: 1 }],
    pendingGitOperations: [{ id: "original-push", ownerExecutionId: "exec-a", ownershipEpoch: 1, kind: "git.push", status: "uncertain" }]
  } as unknown as ProjectSchedulingProjection;
}
const waiting = { status: "queued", phase: "collaboration:scoped-waiting" } as const;

describe("project waiting reasons", () => {
  function authorizationFailure(): FailureAttempt {
    return { status: "failed", errorCode: "GITHUB_WAITING_FOR_AUTHORIZATION", redactedMessage: "项目绑定的 GitHub 账号需要重新授权",
      attemptId: "auth-1", projectId: "project", scope: "git", operation: "workflow.recovery", retryable: true,
      causeClass: "GitHubAuthorizationError", startedAt: "2026-11-03T08:00:00Z", finishedAt: "2026-11-03T08:00:00Z",
      metadata: { provider: "github", status: 401 } };
  }

  it("prioritizes the current GitHub authorization blocker over an older final integration incident", () => {
    const projection = fixture();
    const failure = authorizationFailure();
    projection.failureAttempts = [failure];
    const state = { status: "retrying", phase: "collaboration:recovering", lastError: failure.redactedMessage } as const;
    const before = structuredClone(projection);
    expect(deriveProjectRuntimeProjection(projection, state).waiting).toEqual({ kind: "authorization",
      reason: "GitHub 授权已失效或不可用，请重新登录项目绑定的 GitHub 账号。" });
    expect(projection).toEqual(before);
    projection.failureAttempts[0]!.metadata = { status: 403 };
    expect(deriveProjectRuntimeProjection(projection, state).waiting?.reason).toContain("权限不足");
  });

  it("stops showing historical authorization failures once recovery advances or another blocker takes over", () => {
    const projection = fixture();
    const failure = authorizationFailure();
    projection.failureAttempts = [failure];
    for (const state of [
      { status: "queued", phase: "collaboration:scoped-waiting" },
      { status: "retrying", phase: "collaboration:recovering", lastError: "A different current failure" },
      { status: "retrying", phase: "user-intervention-required", lastError: failure.redactedMessage },
      { status: "paused", phase: "collaboration:user-paused", lastError: failure.redactedMessage },
      { status: "completed", phase: "completed", lastError: failure.redactedMessage }
    ] as const) {
      expect(deriveProjectRuntimeProjection(projection, state).waiting?.kind).not.toBe("authorization");
    }
    projection.failureAttempts.push({ ...failure, status: "succeeded", errorCode: null });
    expect(deriveProjectRuntimeProjection(projection, { status: "retrying", phase: "collaboration:recovering", lastError: failure.redactedMessage })
      .waiting?.kind).not.toBe("authorization");
  });

  it("reports authorization waits during Git initialization without requiring an active group", () => {
    const projection = fixture();
    projection.git.status = "waiting_for_github";
    projection.activeNodeRunId = undefined;
    expect(deriveProjectRuntimeProjection(projection).waiting?.kind).toBe("authorization");
  });

  it("explains the original unsettled operation without pretending it is resource contention or altering its outcome", () => {
    const projection = fixture();
    const before = structuredClone(projection);
    const runtime = deriveProjectRuntimeProjection(projection, waiting);
    expect(runtime).toMatchObject({ status: "queued", phase: "collaboration:scoped-recovery-waiting", activities: [], waiting: {
      kind: "recovery", reason: "等待恢复：opportunity 的 Git 操作结果待确认", agentId: "opportunity", operationId: "original-push", executionId: "exec-a", groupRunId: "run-G"
    } });
    expect(projection).toEqual(before);
  });

  it("uses the same reason in the project view and Main queue while its execution slot is idle", () => {
    const projection = fixture();
    const runtime = deriveProjectRuntimeProjection(projection, waiting);
    const state = { ...projection, status: runtime.status, runtime, orchestration: {} } as unknown as ProjectState;
    const queue = buildAgentQueueSnapshot({ main: { capacity: 10, activeProjectIds: [], queued: [] }, worker: { capacity: 10, activeProjectIds: [], queued: [] } }, [],
      [{ state, capacities: { main: 1, worker: 8 }, occupied: { main: 0, worker: 1 } }]);
    expect(queue.main.activeTasks).toEqual([]);
    expect(queue.main.queued).toEqual([expect.objectContaining({ reason: runtime.waiting!.reason, groupRunId: "run-G" })]);
    expect(queue.main.pools).toContainEqual(expect.objectContaining({ scope: "project", occupied: 0, capacity: 1 }));
  });

  it("keeps nested recovery visible and excludes incidents from a previous root activation", () => {
    const projection = fixture();
    projection.scopedGroupRuns!.push({ ...projection.scopedGroupRuns![0]!, id: "old-G", activationRequestId: "old-activation" });
    projection.scopedGroupIssues!.unshift({ ...projection.scopedGroupIssues![0]!, id: "old-issue", groupRunId: "old-G" });
    expect(deriveProjectRuntimeProjection(projection, waiting).waiting?.groupRunId).toBe("run-G");
    projection.scopedGroupRuns!.push({ ...projection.scopedGroupRuns![0]!, id: "inner-H", groupId: "H", parentGroupRunId: "run-G" });
    projection.scopedGroupIssues![1]!.groupRunId = "inner-H";
    expect(deriveProjectRuntimeProjection(projection, waiting).waiting?.groupRunId).toBe("inner-H");
  });

  it("does not let a retained incident override a live invocation, user Pause or Stop", () => {
    const projection = fixture();
    for (const phase of ["collaboration:user-paused", "collaboration:user-cancelled"]) {
      expect(deriveProjectRuntimeProjection(projection, { status: "paused", phase }).waiting).toBeUndefined();
    }
    expect(deriveProjectRuntimeProjection(projection, { status: "retrying", phase: "user-intervention-required" }).waiting).toMatchObject({ kind: "user-input" });
    expect(deriveProjectRuntimeProjection(projection, { status: "retrying", phase: "user-intervention-required" }))
      .toMatchObject({ status: "retrying", phase: "user-intervention-required" });
    projection.runtimeActivities.push({ activityId: "active", kind: "turn", agentId: "main", invocationId: "manager", startedAt: "2026-10-15T00:00:00Z",
      leaseState: "current", phase: "model:running" } as never);
    expect(deriveProjectRuntimeProjection(projection, waiting)).toMatchObject({ status: "running", currentAgent: "main" });
    expect(deriveProjectRuntimeProjection(projection, waiting).waiting).toBeUndefined();
  });

  it("keeps ordinary arrival queues and workflow-adjustment waits distinct from technical recovery", () => {
    const projection = fixture();
    expect(deriveProjectRuntimeProjection(projection, { status: "queued", phase: "collaboration:workflow-adjustment-waiting" }).waiting)
      .toMatchObject({ kind: "workflow-adjustment" });
    projection.scopedGroupIssues = [];
    projection.scopedArrivals = [{ requestId: "ready-worker", groupRunId: "run-G", status: "queued" } as never];
    expect(deriveProjectRuntimeProjection(projection, waiting).waiting).toBeUndefined();
    projection.scopedArrivals = [];
    expect(deriveProjectRuntimeProjection(projection, waiting).waiting).toMatchObject({ kind: "management" });
  });
});
