import { describe, expect, it } from "vitest";
import { Orchestrator } from "../../src/core/orchestrator.js";
import { cloneAgentOrchestrationTemplate } from "../../src/core/agent-orchestration.js";
import {
  agentDisplayState, currentScopedGroupRun, scopedGroupDisplayState, scopedNodeDisplayState,
  type RuntimeStatusSource
} from "../../src/core/internal/shared/project-runtime-status.js";
import type { ProjectState } from "../../src/core/types.js";

function fixture(): RuntimeStatusSource {
  return {
    status: "running", orchestration: { scopedWorkflow: { groups: [{ id: "research" }, { id: "inner", parentGroupId: "research" }] } },
    scopedGroupRuns: [
      { id: "root-1", groupId: "research", status: "running" },
      { id: "inner-1", groupId: "inner", parentGroupRunId: "root-1", status: "running" }
    ],
    scopedArrivals: [
      { sequence: 1, requestId: "a-1", groupRunId: "inner-1", targetNodeId: "node-a", agentId: "a", status: "running" },
      { sequence: 2, requestId: "b-1", groupRunId: "inner-1", targetNodeId: "node-b", agentId: "b", status: "running" }
    ],
    scopedExecutions: [
      { id: "exec-a", agentId: "a", groupRunId: "inner-1", arrivalRequestId: "a-1", ownershipEpoch: 2, status: "running" },
      { id: "exec-b", agentId: "b", groupRunId: "inner-1", arrivalRequestId: "b-1", ownershipEpoch: 1, status: "running" }
    ],
    runtime: { status: "running", activities: [
      { agentId: "main", groupRunId: "root-1", leaseState: "current" },
      { agentId: "a", executionId: "exec-a", ownershipEpoch: 2, leaseState: "current" },
      { agentId: "b", executionId: "exec-b", ownershipEpoch: 1, leaseState: "current" }
    ] }
  };
}

describe("shared project runtime badges", () => {
  it("shows all parallel workers and their manager, independently of currentAgent", () => {
    const project = fixture();
    project.currentAgent = "main";
    for (const agent of ["main", "a", "b"]) expect(agentDisplayState(project, agent)).toBe("running");
    expect(scopedNodeDisplayState(project, "inner", "node-a")).toBe("running");
  });

  it.each([["paused", "paused"], ["retrying", "retrying"], ["interrupted", "interrupted"], ["cancelling", "stopping"], ["cancelled", "stopped"]] as const)(
    "applies %s to every active nested member", (status, expected) => {
      const project = fixture();
      project.runtime!.status = status;
      expect(agentDisplayState(project, "a")).toBe(expected);
      expect(scopedNodeDisplayState(project, "inner", "node-a")).toBe(expected);
      expect(scopedGroupDisplayState(project, "research")).toBe(expected);
    });

  it("keeps a real completion while paused but never calls a failed execution completed", () => {
    const project = fixture();
    project.runtime!.status = "paused";
    project.scopedExecutions![0]!.status = "failed";
    project.scopedArrivals![0]!.status = "failed";
    project.scopedExecutions![1]!.status = "completed";
    project.scopedArrivals![1]!.status = "completed";
    expect(agentDisplayState(project, "a")).toBe("failed");
    expect(scopedNodeDisplayState(project, "inner", "node-a")).toBe("failed");
    expect(scopedNodeDisplayState(project, "inner", "node-b")).toBe("completed");
  });

  it("rejects stale epochs and distinguishes recovery leases from live execution", () => {
    const project = fixture();
    project.runtime!.activities = [{ agentId: "a", executionId: "exec-a", ownershipEpoch: 1, leaseState: "current" }];
    expect(agentDisplayState(project, "a")).toBe("waiting");
    project.runtime!.activities = [{ agentId: "a", executionId: "exec-a", ownershipEpoch: 2, leaseState: "recovering" }];
    expect(agentDisplayState(project, "a")).toBe("interrupted");
    expect(scopedNodeDisplayState(project, "inner", "node-a")).toBe("interrupted");
  });

  it("does not borrow an old child run when a new parent batch starts", () => {
    const project = fixture();
    project.runtime!.activities = [];
    project.scopedGroupRuns = [...project.scopedGroupRuns!, { id: "root-2", groupId: "research", status: "running" }];
    expect(currentScopedGroupRun(project, "inner")).toBeUndefined();
    expect(scopedNodeDisplayState(project, "inner", "node-a")).toBe("waiting");
    expect(agentDisplayState(project, "a")).toBe("waiting");
  });

  it("retains the active arrival when a successor is queued, then selects the successor after completion", () => {
    const project = fixture();
    project.scopedArrivals = [...project.scopedArrivals!, { sequence: 3, requestId: "a-2", groupRunId: "inner-1", targetNodeId: "node-a", agentId: "a", status: "queued" }];
    expect(scopedNodeDisplayState(project, "inner", "node-a")).toBe("running");
    project.scopedExecutions![0]!.status = "completed";
    project.scopedArrivals![0]!.status = "completed";
    expect(scopedNodeDisplayState(project, "inner", "node-a")).toBe("queued");
    expect(agentDisplayState(project, "a")).toBe("queued");
  });

  it("allows a queued retry to replace a previous failure and an actual completion to replace the retry", () => {
    const project = fixture();
    project.runtime!.activities = [];
    project.scopedExecutions![0]!.status = "failed";
    project.scopedArrivals![0]!.status = "failed";
    project.status = "retrying";
    project.queuedAgent = "a";
    expect(agentDisplayState(project, "a")).toBe("retrying");
    project.queuedAgent = undefined;
    project.scopedArrivals = [...project.scopedArrivals!, { sequence: 3, requestId: "a-2", groupRunId: "inner-1", targetNodeId: "node-a", agentId: "a", status: "completed" }];
    expect(agentDisplayState(project, "a")).toBe("completed");
  });

  it("keeps preparing groups queued and untouched nodes waiting", () => {
    const project = fixture();
    project.scopedGroupRuns![0]!.status = "preparing";
    expect(scopedGroupDisplayState(project, "research")).toBe("queued");
    expect(scopedNodeDisplayState(project, "research", "never-started")).toBe("waiting");
  });

  it("inherits a parent group's pause while unrelated project work remains running", () => {
    const project = fixture();
    project.scopedGroupRuns![0]!.status = "paused";
    expect(scopedGroupDisplayState(project, "inner")).toBe("paused");
    expect(scopedNodeDisplayState(project, "inner", "node-a")).toBe("paused");
  });

  it("projects scoped execution counts and paused badges through the Orchestrator read model", () => {
    const project = { ...fixture(), orchestration: cloneAgentOrchestrationTemplate(),
      runCounts: { main: 0, a: 0 }, executionCounts: { main: 0, a: 0 }, status: "paused" } as unknown as ProjectState;
    project.orchestration.scopedWorkflow = fixture().orchestration.scopedWorkflow as ProjectState["orchestration"]["scopedWorkflow"];
    project.runtime!.status = "paused";
    const prototype = Orchestrator.prototype as unknown as { agentProgress(state: ProjectState, role: string, queue: undefined): unknown };
    expect(prototype.agentProgress.call({}, project, "a", undefined)).toMatchObject({ state: "paused", executions: 1 });
  });
});
