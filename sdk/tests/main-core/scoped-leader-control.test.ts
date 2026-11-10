import { mkdtemp, rm } from "node:fs/promises";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { CollaborationStateDatabase } from "../../src/core/collaboration-state/store.js";
import { cloneAgentOrchestrationTemplate } from "../../src/core/agent-orchestration.js";
import { normalizeAgentOrchestrationTemplate, mergeAgentConfigs } from "../../src/core/validation.js";
import { mainWorkflowDocument, parseWorkflowProposal, workflowBaseHash } from "../../src/core/workflow-reconfiguration.js";
import { parseScopedWorkflowProposal } from "../../src/core/scoped-workflow-reconfiguration.js";
import { mainAgentOrchestrationDocument } from "../../src/core/agent-orchestration-reconfiguration.js";
import { assertScopedAgentConfigurationRange, credentialFreeAgentConfiguration, restoreAgentConfiguration } from "../../src/core/scoped-agent-configuration.js";
import { toolsFor, type CapabilityContext } from "../../src/core/orchestration-control-mcp.js";
import { DatabaseSync } from "node:sqlite";
import { initializeCollaborationStateSchema } from "../../src/core/collaboration-state/schema.js";
import { COLLABORATION_STATE_SCHEMA_VERSION } from "../../src/core/collaboration-state/contracts.js";
import { prepareOperation, mergedPullSynchronizationOperationId } from "../../src/core/collaboration-git/operation.js";
import type { AgentOrchestrationTemplate, ControlAction, ControlActionEnvelope } from "../../src/core/types.js";
import { controlResultReceipts, controlResultMarker } from "../../src/core/control-result-receipts.js";

const roots: string[] = [];
const stores: CollaborationStateDatabase[] = [];
afterEach(async () => { stores.splice(0).forEach((store) => store.close());
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))); });
const edge = (target: string) => ({ kind: "strong" as const, target });
const canonical = (value: unknown): unknown => Array.isArray(value) ? value.map(canonical)
  : value && typeof value === "object" ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b))
    .map(([key, item]) => [key, canonical(item)])) : value;
const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex");
const legacyConfiguration = (agents: ReturnType<typeof mergeAgentConfigs>) => ({ skillDefinitions: {}, mcpDefinitions: {},
  agents: Object.fromEntries(Object.entries(agents).map(([id, config]) => [id, { ...structuredClone(config), proxy: { mode: "direct" } }])) });
function workflow(): AgentOrchestrationTemplate {
  const draft = cloneAgentOrchestrationTemplate() as AgentOrchestrationTemplate;
  draft.schemaVersion = 3;
  draft.collaborations = ["G", "H"].map((id) => ({ id, displayName: id, memberAgentIds: [], renamePolicy: "editable" as const }));
  draft.routes.G = [edge("main")];
  draft.scopedWorkflow = { schemaVersion: 1, rootAgentIds: draft.agents.map((agent) => agent.name), groups: [
    { id: "G", leaderAgentId: "review", allowLeaderReconfiguration: true, workflow: {
      nodes: [{ kind: "agent", nodeId: "G_idea", agentId: "idea" }, { kind: "agent", nodeId: "G_execution", agentId: "execution" },
        { kind: "collaboration", nodeId: "G_H", groupId: "H" }],
      input: { source: "input", edges: ["G_idea", "G_H"].map((target) => ({ target, kind: "parallel" as const })) },
      routes: { G_idea: [edge("G_execution")], G_execution: [edge("finish")],
        G_H: [{ kind: "weak", target: "G_execution" }, { kind: "weak", target: "finish" }] } } },
    { id: "H", parentGroupId: "G", leaderAgentId: "main", allowLeaderReconfiguration: false, workflow: {
      nodes: [{ kind: "agent", nodeId: "H_writing", agentId: "writing" }],
      input: { source: "input", edges: [{ kind: "parallel", target: "H_writing" }] }, routes: { H_writing: [edge("finish")] } } }
  ] };
  return normalizeAgentOrchestrationTemplate(draft);
}
async function fixture(finished = true, current = workflow()) {
  const root = await mkdtemp(join(tmpdir(), "openfars-scoped-manager-")); roots.push(root);
  const options = { databasePath: join(root, "state.sqlite"), serviceId: "test", hostId: "test", topology: "single-host" as const,
    instanceId: "one", now: () => 1_000_000 };
  const database = CollaborationStateDatabase.open(options); stores.push(database);
  database.createProject({ projectId: "p", workflowRevision: 1, workflowSnapshot: current, git: { enabled: true, status: "ready", repository: {
    owner: "example", name: "openfars", private: true, defaultBranch: "main", htmlUrl: "https://github.com/example/openfars", localPath: join(root, "repository") } }, workerCapacity: 4 });
  database.initializeScopedConfiguration("p", { agents: mergeAgentConfigs(undefined, current), skillDefinitions: {}, mcpDefinitions: {} });
  const group = database.activateScopedGroup({ projectId: "p", groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G",
    workflowRevision: 1, baseCommit: "a".repeat(40), outer: { nodeRunId: "node-G", inputSnapshotRef: "input:p", activatedByAgentId: "main" } });
  const childArrival = group.arrivals.find((arrival) => arrival.targetKind === "collaboration")!;
  database.activateScopedGroup({ projectId: "p", groupRunId: "run-H", groupId: "H", activationRequestId: childArrival.requestId,
    workflowRevision: 1, baseCommit: "a".repeat(40), parentGroupRunId: "run-G", parentArrivalRequestId: childArrival.requestId });
  const claim = database.claimScopedLeaderTurn({ projectId: "p", groupRunId: "run-G", agentId: "review", invocationId: "leader-one",
    runtimePath: join(root, "runtime", "invocations", "leader-one") })!;
  const authority = { projectId: "p", groupRunId: "run-G", agentId: "review", invocationId: "leader-one", coordinatorEpoch: claim.coordinatorEpoch };
  database.markScopedLeaderOpened(authority);
  const receipt = (action: ControlAction, callId = "decision"): ControlActionEnvelope => ({ projectId: "p", agent: "review",
    invocationId: "leader-one", callId, stateVersion: 1, capabilityHash: "b".repeat(64), receivedAt: "2026-09-30T00:00:00.000Z", action });
  if (finished) database.recordScopedLeaderTaskCompletion({ ...authority,
    envelope: receipt({ tool: "finish_task", summary: "Leader explicitly finished this round" }, "own-finish") });
  return { root, options, database, current, authority, receipt, childArrival };
}
describe("formally scoped Leader management", () => {
  it("binds finish_task to the current opened native manager and rejects stale or cancelled receipt side effects", async () => {
    const { database, authority, receipt } = await fixture(false);
    const input = { ...authority, envelope: receipt({ tool: "finish_task", summary: "Own round", memory: "Agent-authored memory" }, "finish") };
    const revision = database.projectState("p").revision;
    for (const changed of [
      { agentId: "main" }, { groupRunId: "run-H" }, { invocationId: "other" }, { coordinatorEpoch: 2 },
      { envelope: { ...input.envelope, stateVersion: 2 } },
      { envelope: { ...input.envelope, capabilityHash: "invalid" } },
      { envelope: { ...input.envelope, agent: "main" } },
      { envelope: receipt({ tool: "route_to_agent", target: "finish" }) }
    ]) expect(() => database.recordScopedLeaderTaskCompletion({ ...input, ...changed })).toThrow();
    expect(database.projectState("p").revision).toBe(revision);
    expect(database.scopedLeaderTaskCompleted("p", "run-G", "review", "leader-one", 1)).toBe(false);
    database.recordScopedLeaderTaskCompletion(input);
    database.recordScopedLeaderTaskCompletion({ ...input, envelope: { ...input.envelope,
      receivedAt: "2026-10-02T00:00:00Z", capabilityHash: "c".repeat(64) } });
    database.recordScopedLeaderTaskCompletion({ ...input, envelope: { ...input.envelope, callId: "repeat", capabilityHash: "c".repeat(64) } });
    expect(database.scopedLeaderTaskCompleted("p", "run-G", "review", "leader-one", 1)).toBe(true);
    expect(database.scopedLeaderTaskCompleted("p", "run-G", "review", "other", 1)).toBe(false);
    expect(database.scopedLeaderTaskCompleted("p", "run-G", "review", "leader-one", 2)).toBe(false);
    expect(database.eventsAfter("p", 0, 1000).filter((event) => event.type === "scoped.leader.task.completed")).toHaveLength(1);
    expect(() => database.recordScopedLeaderTaskCompletion({ ...input, envelope: { ...input.envelope,
      callId: "changed", action: { tool: "finish_task", summary: "Different memory" } } })).toThrow(/changed/);
    database.appendEvent({ projectId: "p", requestId: "cancel", type: "project.cancellation.requested", payload: { actor: "user" } });
    expect(() => database.recordScopedLeaderTaskCompletion(input)).toThrow(/current invocation/);
    expect(database.eventsAfter("p", 0, 1000).filter((event) => event.type === "scoped.leader.task.completed")).toHaveLength(1);
  });

  it("requires the new management round's own finish before accepting a valid graph plan", async () => {
    const { database, authority, receipt } = await fixture();
    database.releaseScopedLeaderTurn({ ...authority, residentStopConfirmed: true });
    expect(() => database.recordScopedLeaderTaskCompletion({ ...authority,
      envelope: receipt({ tool: "finish_task", summary: "Old round" }, "too-late") })).toThrow(/current invocation/);
    const claim = database.claimScopedLeaderTurn({ ...authority, invocationId: "leader-two", runtimePath: "/srv/runtime/leader-two" })!;
    const next = { ...authority, invocationId: "leader-two", coordinatorEpoch: claim.coordinatorEpoch };
    const finish = { ...receipt({ tool: "finish_task", summary: "New round" }, "own-finish"), invocationId: next.invocationId,
      stateVersion: next.coordinatorEpoch };
    expect(() => database.recordScopedLeaderTaskCompletion({ ...next, envelope: finish })).toThrow(/process-open/);
    database.markScopedLeaderOpened(next);
    const plan = { ...finish, callId: "new-plan", action: { tool: "assign_group_tasks" as const, groupRunId: "run-G",
      coordinatorEpoch: next.coordinatorEpoch, tasks: [{ taskId: "G_idea", assignment: "The actual new plan" }] } };
    database.revalidateScopedLeaderAction({ ...next, envelope: plan });
    expect(() => database.acceptScopedLeaderAction({ ...next, envelope: plan, residentStopConfirmed: true })).toThrow(/current turn/);
    expect(database.scopedGroupPlan("p", "run-G")).toBeUndefined();
    database.recordScopedLeaderTaskCompletion({ ...next, envelope: finish });
    database.acceptScopedLeaderAction({ ...next, envelope: plan, residentStopConfirmed: true });
    expect(database.scopedGroupPlan("p", "run-G")?.tasks[0]?.assignment).toBe("The actual new plan");
  });

  it("counts management supplements across historical recovery keys without granting an unknown route a fresh allowance", async () => {
    const { database } = await fixture();
    for (const [key, purpose] of [["old-recovery-one", "plan"], ["old-recovery-two", "plan"], ["unknown-route", "route"]])
      database.appendEvent({ projectId: "p", agentId: "review", type: "scoped.management.mechanism_repair.requested",
        payload: { groupRunId: "run-G", repairScopeKey: key, purpose, attempt: 1 } });
    expect(database.scopedManagementRepairCount("p", "stable-plan", { groupRunId: "run-G", agentId: "review", purpose: "plan" })).toBe(2);
    expect(database.scopedManagementRepairCount("p", "stable-route", {
      groupRunId: "run-G", agentId: "review", purpose: "route", sourceArrivalRequestId: "retained-arrival" })).toBe(3);
  });

  it("preserves mechanism repair counts across a different management epoch and database restart", async () => {
    const { database, authority, options } = await fixture();
    const repairScopeKey = "same-original-management-task";
    for (let attempt = 1; attempt <= 2; attempt += 1) database.appendEvent({ projectId: "p", agentId: "review",
      invocationId: authority.invocationId, coordinatorEpoch: attempt,
      type: "scoped.management.mechanism_repair.requested", payload: { repairScopeKey, attempt } });
    database.releaseScopedLeaderTurn({ ...authority, residentStopConfirmed: true });
    database.claimScopedLeaderTurn({ ...authority, invocationId: "leader-two" });
    expect(database.scopedManagementRepairCount("p", repairScopeKey)).toBe(2);
    database.close();
    const restarted = CollaborationStateDatabase.open({ ...options, instanceId: "two", now: () => 2_000_000 }); stores.push(restarted);
    expect(restarted.scopedManagementRepairCount("p", repairScopeKey)).toBe(2);
    restarted.appendEvent({ projectId: "p", type: "scoped.management.round.completed", payload: { repairScopeKey: "unrelated" } });
    expect(restarted.scopedManagementRepairCount("p", repairScopeKey)).toBe(2);
    restarted.appendEvent({ projectId: "p", type: "scoped.management.round.completed", payload: { repairScopeKey } });
    expect(restarted.scopedManagementRepairCount("p", repairScopeKey)).toBe(0);
  });

  it("projects durable group problems into the public state and read-only management snapshot without inventing business tasks", async () => {
    const { database } = await fixture();
    const issue = database.recordScopedGroupIssue({ projectId: "p", groupRunId: "run-G", kind: "plan", reason: "Formal plan unavailable" });
    expect(database.projectState("p").scopedGroupIssues).toEqual([issue]);
    expect(database.authoritativeWorkflowFiles("p").currentState.scopedRuntime?.issues).toEqual([issue]);
    expect(database.projectState("p").tasks).toEqual([]); expect(database.projectState("p").executions).toEqual([]);
  });

  it("projects actual scoped management activity and removes it only after trusted release", async () => {
    const { database, authority } = await fixture();
    const activity = database.projectState("p").runtimeActivities.find((entry) => entry.invocationId === authority.invocationId)!;
    expect(activity).toMatchObject({ scopeKind: "scoped-leader", agentId: "review", nodeRunId: "node-G",
      groupRunId: "run-G", coordinatorEpoch: authority.coordinatorEpoch, phase: "resident:running", leaseState: "current" });
    expect(activity.executionId).toBeUndefined(); expect(activity.taskId).toBeUndefined();
    expect(database.authoritativeWorkflowFiles("p").currentState.scopedRuntime?.activities).toContainEqual(activity);
    database.releaseScopedLeaderTurn({ ...authority, residentStopConfirmed: true });
    expect(database.projectState("p").runtimeActivities).toEqual([]);
  });
  it("records an immutable parent-local weak receipt without releasing the child arrival", async () => {
    const { database, authority, receipt, childArrival } = await fixture();
    const input = { ...authority, sourceArrivalRequestId: childArrival.requestId, residentStopConfirmed: true as const,
      envelope: receipt({ tool: "route_to_agent", target: "finish", rationale: "Child results accepted" }) };
    expect(database.acceptScopedLeaderAction(input).replay).toBe(false);
    expect(database.scopedArrivalRouteDecision("p", childArrival.requestId)).toEqual({ targetNodeId: "finish", invocationId: "leader-one" });
    expect(database.scopedArrivals("run-G").find((arrival) => arrival.requestId === childArrival.requestId)?.status).toBe("running");
    database.releaseScopedLeaderTurn({ ...authority, residentStopConfirmed: true });
    expect(database.acceptScopedLeaderAction(input).replay).toBe(true);
    expect(() => database.acceptScopedLeaderAction({ ...input, envelope: receipt({ tool: "route_to_agent", target: "G_execution" }) })).toThrow(/changed on replay/);
  });

  it("rejects outside targets, project completion and global authority even when Main is a group Leader", async () => {
    const { database, authority, receipt, childArrival } = await fixture();
    for (const action of [{ tool: "route_to_agent", target: "writing" }, { tool: "complete_project", rationale: "finish" }] as ControlAction[]) {
      expect(() => database.revalidateScopedLeaderAction({ ...authority, sourceArrivalRequestId: childArrival.requestId, envelope: receipt(action) })).toThrow();
    }
    const claim = database.claimScopedLeaderTurn({ projectId: "p", groupRunId: "run-H", agentId: "main", invocationId: "child-leader", runtimePath: "/srv/runtime/child-leader" });
    expect(claim).toBeUndefined(); // management capacity belongs to the active parent.
    database.releaseScopedLeaderTurn({ ...authority, residentStopConfirmed: true });
    const child = database.claimScopedLeaderTurn({ projectId: "p", groupRunId: "run-H", agentId: "main", invocationId: "child-leader", runtimePath: "/srv/runtime/child-leader" })!;
    const childAuthority = { projectId: "p", groupRunId: "run-H", agentId: "main", invocationId: "child-leader", coordinatorEpoch: child.coordinatorEpoch };
    database.markScopedLeaderOpened(childAuthority);
    expect(() => database.revalidateScopedLeaderAction({ ...childAuthority, sourceArrivalRequestId: childArrival.requestId,
      envelope: { ...receipt({ tool: "route_to_agent", target: "finish" }), agent: "main", invocationId: "child-leader" } })).toThrow(/direct local/);
  });

  it("plans existing graph references only and never manufactures a business task", async () => {
    const { database, authority, receipt } = await fixture();
    const action: Extract<ControlAction, { tool: "assign_group_tasks" }> = { tool: "assign_group_tasks", groupRunId: "run-G",
      coordinatorEpoch: authority.coordinatorEpoch, tasks: [{ taskId: "G_idea", assignment: "Inspect the user's requirement" }] };
    database.acceptScopedLeaderAction({ ...authority, envelope: receipt(action), residentStopConfirmed: true });
    expect(database.scopedGroupPlan("p", "run-G")).toEqual(action);
    expect(database.projectState("p").tasks).toHaveLength(0);
    for (const task of [{ taskId: "H_writing", assignment: "outside" }, { taskId: "G_execution", assignment: "hidden", dependencyTaskIds: ["G_idea"] }]) {
      expect(() => database.revalidateScopedLeaderAction({ ...authority, envelope: receipt({ ...action, tasks: [task] }, "different") })).toThrow(/direct graph/);
    }
  });

  it("uses monotonically increasing management epochs and rejects released/static/native-unopened authority", async () => {
    const { database, authority, receipt } = await fixture();
    database.releaseScopedLeaderTurn({ ...authority, residentStopConfirmed: true });
    expect(() => database.revalidateScopedLeaderAction({ ...authority, envelope: receipt({ tool: "complete_project", rationale: "no" }) })).toThrow(/current invocation/);
    const next = database.claimScopedLeaderTurn({ ...authority, invocationId: "leader-two", runtimePath: "/srv/runtime/leader-two" })!;
    expect(next.coordinatorEpoch).toBe(authority.coordinatorEpoch + 1);
    expect(() => database.revalidateScopedLeaderAction({ ...authority, invocationId: "leader-two", coordinatorEpoch: next.coordinatorEpoch,
      envelope: { ...receipt({ tool: "complete_project", rationale: "no" }), invocationId: "leader-two" } })).toThrow(/process-open/);
  });

  it("commits only its own graph through the existing workflow file hash/field locks and projects revisions atomically", async () => {
    const { database, current, authority, receipt } = await fixture();
    const document = mainWorkflowDocument("p", current);
    document.orchestration.scopedWorkflow!.groups[0]!.workflow.routes.G_idea = [edge("G_H")];
    const agents = mergeAgentConfigs(undefined, current);
    const proposal = parseScopedWorkflowProposal(JSON.stringify(document), "p", current, agents, "G");
    const input = { ...authority, envelope: receipt({ tool: "apply_workflow", path: "workflow.json", rationale: "Local topology" }),
      proposal: proposal.orchestration, baseWorkflowHash: document.baseHash, residentStopConfirmed: true as const };
    expect(database.acceptScopedLeaderAction(input).replay).toBe(false);
    const state = database.projectState("p");
    expect(state.workflowRevision).toBe(2);
    expect(state.scopedGroupRuns!.every((run) => run.workflowRevision === 2)).toBe(true);
    expect(state.nodeRuns[0]!.workflowRevision).toBe(2);
    expect(database.scopedGroupWorkflow("p", "run-G").routes.G_idea).toEqual([edge("G_H")]);
    expect(database.scopedGroupRun("p", "run-H")?.workflowRevision).toBe(2);
    expect(state.scopedArrivals).toHaveLength(3);
    expect(database.acceptScopedLeaderAction(input).replay).toBe(true);
  });

  it("permits creating a child with existing identities without removing parent Agent references or changing session configs", async () => {
    const { current } = await fixture();
    const document = mainWorkflowDocument("p", current);
    const parent = document.orchestration.scopedWorkflow!.groups[0]!;
    parent.workflow.nodes.push({ kind: "collaboration", nodeId: "G_J", groupId: "J" });
    parent.workflow.routes.G_execution = [edge("G_J")]; parent.workflow.routes.G_J = [edge("finish")];
    document.orchestration.collaborations!.push({ id: "J", displayName: "J", renamePolicy: "editable", memberAgentIds: [] });
    document.orchestration.scopedWorkflow!.groups.push({ id: "J", parentGroupId: "G", leaderAgentId: "idea", allowLeaderReconfiguration: false,
      workflow: { nodes: [{ kind: "agent", nodeId: "J_execution", agentId: "execution" }], input: { source: "input", edges: [{ kind: "parallel", target: "J_execution" }] }, routes: { J_execution: [edge("finish")] } } });
    const agents = mergeAgentConfigs(undefined, current);
    const proposal = parseScopedWorkflowProposal(JSON.stringify(document), "p", current, agents, "G");
    expect(proposal.orchestration.scopedWorkflow!.groups[0]!.workflow.nodes).toContainEqual({ kind: "agent", nodeId: "G_idea", agentId: "idea" });
    expect(proposal.agents).toEqual(agents);
  });

  it("rejects outside graph edits, child internal edits, authority flag changes and runtime config injection", async () => {
    const { current } = await fixture(); const agents = mergeAgentConfigs(undefined, current);
    for (const mutate of [
      (doc: ReturnType<typeof mainWorkflowDocument>) => { doc.orchestration.resultFormat.custom = "outside"; },
      (doc: ReturnType<typeof mainWorkflowDocument>) => { doc.orchestration.scopedWorkflow!.groups[1]!.allowLeaderReconfiguration = true; },
      (doc: ReturnType<typeof mainWorkflowDocument>) => { doc.orchestration.scopedWorkflow!.groups[0]!.allowLeaderReconfiguration = false; },
      (doc: ReturnType<typeof mainWorkflowDocument>) => { (doc as unknown as Record<string, unknown>).agents = {}; }
    ]) {
      const doc = mainWorkflowDocument("p", current); mutate(doc);
      expect(() => parseScopedWorkflowProposal(JSON.stringify(doc), "p", current, agents, "G")).toThrow();
    }
  });

  it("defers overlapping management until an active business arrival has stopped", async () => {
    const { database, authority, root } = await fixture();
    const arrival = database.scopedArrivals("run-G").find((item) => item.agentId === "idea")!;
    database.releaseScopedLeaderTurn({ ...authority, residentStopConfirmed: true });
    database.claimScopedAgentArrival({ projectId: "p", arrivalRequestId: arrival.requestId, agentId: "idea", executionId: "one",
      worktreePath: join(root, "git-worktrees", "agents", "idea") });
    expect(database.claimScopedLeaderTurn({ projectId: "p", groupRunId: "run-G", agentId: "review", invocationId: "leader-two",
      runtimePath: join(root, "runtime", "leader-two") })).toBeUndefined();
  });

  it.each(["claimed", "reserved", "opened", "stopped"] as const)(
    "defers a nested Leader while its ancestor business owner is %s and has not settled", async (phase) => {
      const { database, authority, root } = await fixture();
      database.releaseScopedLeaderTurn({ ...authority, residentStopConfirmed: true });
      const arrival = database.scopedArrivals("run-G").find((item) => item.agentId === "idea")!;
      database.claimScopedAgentArrival({ projectId: "p", arrivalRequestId: arrival.requestId, agentId: "idea",
        executionId: "ancestor-work", worktreePath: join(root, "git-worktrees", "agents", "idea") });
      const native = { projectId: "p", executionId: "ancestor-work", ownershipEpoch: 1, invocationId: "ancestor-native" };
      if (phase !== "claimed") database.beginScopedAgentTurn({ ...native,
        runtimePath: join(root, "runtime", native.invocationId), baseCommit: "a".repeat(40) });
      if (phase === "opened" || phase === "stopped") database.markScopedAgentTurnOpened({ ...native, nativeProcessOpened: true });
      if (phase === "stopped") database.stopScopedAgentTurn({ ...native, residentStopConfirmed: true });
      const child = { projectId: "p", groupRunId: "run-H", agentId: "main", invocationId: "nested-manager",
        runtimePath: join(root, "runtime", "nested-manager") };
      const before = database.projectState("p");
      expect(database.claimScopedLeaderTurn(child)).toBeUndefined();
      expect(database.projectState("p")).toEqual(before);
      expect(database.scopedLeaderTurns("p").some((turn) => turn.invocationId === child.invocationId)).toBe(false);
      // The test's controlled fault releases the original business owner only
      // after its exact native Stop. A stopped process alone leaves delivery
      // pending and must not let a child Leader seize the ancestor's scope.
      if (phase === "reserved" || phase === "opened") database.stopScopedAgentTurn({ ...native, residentStopConfirmed: true });
      database.failScopedAgentArrival({ projectId: "p", arrivalRequestId: arrival.requestId,
        executionId: native.executionId, ownershipEpoch: 1, residentStopConfirmed: true,
        reason: "Controlled original business fault after exact Stop" });
      expect(database.claimScopedLeaderTurn(child)).toMatchObject({ coordinatorEpoch: 1, replay: false });
      expect(database.scopedExecution("p", native.executionId)).toMatchObject({
        id: native.executionId, arrivalRequestId: arrival.requestId, agentId: "idea", ownershipEpoch: 1, status: "failed" });
      expect(database.scopedAgentReport("p", native.executionId, 1)).toBeUndefined();
    }
  );

  it("keeps sibling management independent while an unrelated child business turn is active", async () => {
    const current = workflow();
    const parent = current.scopedWorkflow!.groups[0]!.workflow;
    parent.nodes.push({ kind: "collaboration", nodeId: "G_J", groupId: "J" });
    parent.input.edges.push({ kind: "parallel", target: "G_J" });
    parent.routes.G_J = [edge("finish")];
    current.collaborations!.push({ id: "J", displayName: "J", memberAgentIds: [], renamePolicy: "editable" });
    current.scopedWorkflow!.groups.push({ id: "J", parentGroupId: "G", leaderAgentId: "execution",
      allowLeaderReconfiguration: false, workflow: {
        nodes: [{ kind: "agent", nodeId: "J_idea", agentId: "idea" }],
        input: { source: "input", edges: [{ kind: "parallel", target: "J_idea" }] },
        routes: { J_idea: [edge("finish")] } } });
    const { database, authority, root } = await fixture(true, normalizeAgentOrchestrationTemplate(current));
    database.releaseScopedLeaderTurn({ ...authority, residentStopConfirmed: true });
    const siblingArrival = database.scopedArrivals("run-G").find((item) => item.childGroupId === "J")!;
    database.activateScopedGroup({ projectId: "p", groupRunId: "run-J", groupId: "J",
      activationRequestId: siblingArrival.requestId, workflowRevision: 1, baseCommit: "a".repeat(40),
      parentGroupRunId: "run-G", parentArrivalRequestId: siblingArrival.requestId });
    const arrival = database.scopedArrivals("run-H").find((item) => item.agentId === "writing")!;
    database.claimScopedAgentArrival({ projectId: "p", arrivalRequestId: arrival.requestId, agentId: "writing",
      executionId: "child-work", worktreePath: join(root, "git-worktrees", "agents", "writing") });
    const native = { projectId: "p", executionId: "child-work", ownershipEpoch: 1, invocationId: "child-native" };
    database.beginScopedAgentTurn({ ...native, runtimePath: join(root, "runtime", native.invocationId), baseCommit: "a".repeat(40) });
    database.markScopedAgentTurnOpened({ ...native, nativeProcessOpened: true });
    const claim = database.claimScopedLeaderTurn({ projectId: "p", groupRunId: "run-J", agentId: "execution",
      invocationId: "sibling-manager", runtimePath: join(root, "runtime", "sibling-manager") })!;
    expect(claim).toMatchObject({ coordinatorEpoch: 1 });
    expect(database.scopedManagementBlocksBusiness("p", "run-H")).toBe(false);
    expect(database.scopedAgentTurn("p", native.executionId, 1)?.status).toBe("opened");
    database.releaseScopedLeaderTurn({ projectId: "p", groupRunId: "run-J", agentId: "execution",
      invocationId: claim.invocationId, coordinatorEpoch: claim.coordinatorEpoch, residentStopConfirmed: true });
    expect(database.claimScopedLeaderTurn({ ...authority, invocationId: "parent-again" })).toBeUndefined();
  });

  it("does not retry a failed arrival while its scope is under management, then resumes after release", async () => {
    const { database, authority, root } = await fixture();
    database.releaseScopedLeaderTurn({ ...authority, residentStopConfirmed: true });
    const arrival = database.scopedArrivals("run-G").find((item) => item.agentId === "idea")!;
    database.claimScopedAgentArrival({ projectId: "p", arrivalRequestId: arrival.requestId, agentId: "idea", executionId: "failed-one",
      worktreePath: join(root, "git-worktrees", "agents", "idea") });
    database.failScopedAgentArrival({ projectId: "p", arrivalRequestId: arrival.requestId, executionId: "failed-one", ownershipEpoch: 1,
      residentStopConfirmed: true, reason: "native process stopped" });
    const claim = database.claimScopedLeaderTurn({ projectId: "p", groupRunId: "run-G", agentId: "review", invocationId: "leader-two",
      runtimePath: join(root, "runtime", "leader-two") })!;
    expect(database.retryScopedAgentArrival({ projectId: "p", executionId: "failed-one", arrivalRequestId: arrival.requestId,
      failedOwnershipEpoch: 1 })).toBeUndefined();
    database.releaseScopedLeaderTurn({ projectId: "p", groupRunId: "run-G", agentId: "review", invocationId: "leader-two",
      coordinatorEpoch: claim.coordinatorEpoch, residentStopConfirmed: true });
    expect(database.retryScopedAgentArrival({ projectId: "p", executionId: "failed-one", arrivalRequestId: arrival.requestId,
      failedOwnershipEpoch: 1 })?.execution.status).toBe("running");
  });

  it("exposes a scoped manager's tools even when the selected Agent is a Worker, without global finish/skip tools", () => {
    const context = { kind: "worker", collaboration: { role: "scoped-leader", nodeRunId: "node-G", groupRunId: "run-G",
      coordinatorEpoch: 1, memberNodeIds: ["G_idea"], routeCandidates: ["finish"], sourceArrivalRequestId: "arrival",
      failedArrivalRequestIds: ["failed"], allowReconfiguration: true } } as CapabilityContext;
    expect(toolsFor(context).map((tool) => tool.name)).toEqual(["finish_task", "assign_group_tasks", "route_to_agent", "apply_workflow", "coordinate_group_task", "request_group_integration", "complete_group"]);
    expect(toolsFor(context).some((tool) => ["complete_project", "request_user"].includes(tool.name))).toBe(false);
    for (const tool of toolsFor(context)) expect(tool.annotations).toEqual({
      readOnlyHint: false, destructiveHint: false, openWorldHint: false
    });
  });

  it("allows Main's existing formal proposal to create a v3 group and bind an existing Leader", () => {
    const current = cloneAgentOrchestrationTemplate(); current.allowMainReconfiguration = true;
    const doc = mainWorkflowDocument("p", current);
    const scoped = workflow(); scoped.allowMainReconfiguration = true;
    doc.orchestration = scoped;
    const agents = mergeAgentConfigs(undefined, current);
    expect(parseWorkflowProposal(JSON.stringify(doc), "p", current, agents).orchestration.scopedWorkflow?.groups[0]?.leaderAgentId).toBe("review");
  });

  it("accounts scoped management against its real invocation without legacy group/task rows", async () => {
    const { database, authority } = await fixture();
    const usage = { scopeKind: "scoped" as const, usageId: "manager-usage", requestId: "manager-usage", projectId: "p",
      nodeRunId: "node-G", groupRunId: "run-G", agentId: "review", invocationId: authority.invocationId,
      inputTokens: 10, cachedInputTokens: 2, outputTokens: 5, totalTokens: 15 };
    expect(database.appendUsage(usage).replay).toBe(false);
    database.releaseScopedLeaderTurn({ ...authority, residentStopConfirmed: true });
    expect(database.appendUsage(usage).replay).toBe(true);
    expect(database.projectState("p").usage).toMatchObject([usage]);
    expect(database.projectState("p").groupRuns).toHaveLength(0);
    expect(() => database.appendUsage({ ...usage, scopeKind: undefined })).toThrow(/different execution scope/);
    expect(() => database.appendUsage({ ...usage, usageId: "wrong", requestId: "wrong", groupRunId: "run-H" })).toThrow(/actual Leader/);
    expect(database.verifyHealth().integrity).toBe("ok");
  });

  it("binds Worker usage to the opened native epoch/Agent/group and preserves exact replay after completion", async () => {
    const { database, root, authority } = await fixture();
    database.releaseScopedLeaderTurn({ ...authority, residentStopConfirmed: true });
    const arrival = database.scopedArrivals("run-G").find((item) => item.agentId === "idea")!;
    database.claimScopedAgentArrival({ projectId: "p", arrivalRequestId: arrival.requestId, agentId: "idea", executionId: "work-one",
      worktreePath: join(root, "git-worktrees", "agents", "idea") });
    const turn = { projectId: "p", executionId: "work-one", ownershipEpoch: 1, invocationId: "native-one" };
    database.beginScopedAgentTurn({ ...turn, runtimePath: join(root, "runtime", "native-one"), baseCommit: "a".repeat(40) });
    const usage = { scopeKind: "scoped" as const, usageId: "worker-usage", projectId: "p", nodeRunId: "node-G",
      groupRunId: "run-G", agentId: "idea", executionId: "work-one", ownershipEpoch: 1, invocationId: "native-one",
      inputTokens: 20, cachedInputTokens: 0, outputTokens: 4, totalTokens: 24 };
    expect(() => database.appendUsage(usage)).toThrow(/actual native turn/);
    database.markScopedAgentTurnOpened({ ...turn, nativeProcessOpened: true });
    expect(database.appendUsage(usage).replay).toBe(false);
    for (const changed of [{ groupRunId: "run-H" }, { agentId: "execution" }, { ownershipEpoch: 2 }, { invocationId: "forged" }]) {
      expect(() => database.appendUsage({ ...usage, usageId: "forged", ...changed })).toThrow(/actual native turn/);
    }
    database.stopScopedAgentTurn({ ...turn, residentStopConfirmed: true });
    expect(database.appendUsage(usage).replay).toBe(true);
    expect(database.projectState("p").usage).toHaveLength(1);
  });

  it("reuses Main's editable fields for local shared Agent identities and durably projects configuration without credentials", async () => {
    const { database, current, authority, receipt } = await fixture();
    const agents = mergeAgentConfigs(undefined, current);
    database.initializeScopedConfiguration("p", { agents, skillDefinitions: {}, mcpDefinitions: {} });
    const document = mainAgentOrchestrationDocument("p", current, agents);
    document.agents.idea.instructions = "New instructions used by every reference to this Agent.";
    const parsed = parseScopedWorkflowProposal(JSON.stringify(document), "p", current, agents, "G", { skillDefinitions: {}, mcpDefinitions: {} });
    const configuration = credentialFreeAgentConfiguration({ agents: parsed.agents, skillDefinitions: parsed.skillDefinitions!, mcpDefinitions: parsed.mcpDefinitions! });
    database.acceptScopedLeaderAction({ ...authority, envelope: receipt({ tool: "apply_workflow", path: "workflow.json", rationale: "Shared local Agent configuration" }),
      proposal: parsed.orchestration, configuration, baseConfigurationHash: database.scopedConfigurationHash("p"),
      baseWorkflowHash: workflowBaseHash(current), residentStopConfirmed: true });
    expect(database.projectState("p").scopedConfiguration?.agents.idea.instructions).toBe(document.agents.idea.instructions);
    expect(database.projectState("p").workflowRevision).toBe(2);
    expect(database.projectState("p").scopedGroupRuns![0].workflowRevision).toBe(2);
    expect(database.scopedConfiguration("p")?.agents.writing).toEqual(agents.writing);
  });

  it("restores old shared configuration without its Agent proxy while preserving routes, credentials and scope locks", () => {
    const current = workflow(), agents = mergeAgentConfigs(undefined, current);
    agents.idea.gatewaySnapshot = { id: "gwy_" + "a".repeat(32), name: "Existing route", url: "https://gateway.invalid/v1",
      apiKey: "existing-server-only-secret", models: [agents.idea.model], defaultModel: agents.idea.model, protocol: "responses" };
    const legacy = legacyConfiguration(agents), original = structuredClone(legacy);
    // Historical S never contains the server-only Gateway snapshot.
    delete legacy.agents.idea.gatewaySnapshot;
    delete original.agents.idea.gatewaySnapshot;
    const restored = restoreAgentConfiguration(legacy, agents);
    expect(restored.idea.gatewaySnapshot).toEqual(agents.idea.gatewaySnapshot);
    expect(credentialFreeAgentConfiguration(legacy).agents.idea).not.toHaveProperty("gatewaySnapshot");
    for (const config of Object.values(restored)) expect(config).not.toHaveProperty("proxy");
    const next = credentialFreeAgentConfiguration(legacy); next.agents.idea.instructions += " Local change.";
    expect(() => assertScopedAgentConfigurationRange(current, "G", legacy, next)).not.toThrow();
    next.agents.writing.instructions += " Forbidden outside change.";
    expect(() => assertScopedAgentConfigurationRange(current, "G", legacy, next)).toThrow(/outside/);
    expect(legacy).toEqual(original); expect(agents.idea.gatewaySnapshot.apiKey).toBe("existing-server-only-secret");
  });

  it("keeps an old S configuration hash immutable while accepting a current local edit and rejecting new Agent proxies", async () => {
    const { database, current, authority, receipt } = await fixture();
    const agents = mergeAgentConfigs(undefined, current), legacy = legacyConfiguration(agents);
    const old = database.appendEvent({ projectId: "p", requestId: "historical-configuration", type: "scoped.configuration.applied",
      payload: { configuration: legacy } }).event;
    const baseConfigurationHash = database.scopedConfigurationHash("p");
    expect(baseConfigurationHash).toBe(hash(legacy));
    const configuration = credentialFreeAgentConfiguration(legacy); configuration.agents.idea.instructions += " New safe instructions.";
    const input = { ...authority, envelope: receipt({ tool: "apply_workflow", path: "workflow.json", rationale: "Current configuration" }),
      proposal: current, configuration, baseConfigurationHash, baseWorkflowHash: workflowBaseHash(current), residentStopConfirmed: true as const };
    const revision = database.projectState("p").revision;
    expect(() => database.acceptScopedLeaderAction({ ...input, configuration: legacyConfiguration(configuration.agents) })).toThrow(/proxy.*no longer supported/);
    expect(() => database.acceptScopedLeaderAction({ ...input, baseConfigurationHash: hash(credentialFreeAgentConfiguration(legacy)) })).toThrow(/stale/);
    expect(database.projectState("p").revision).toBe(revision);
    expect(database.scopedConfigurationHash("p")).toBe(baseConfigurationHash);
    expect(database.acceptScopedLeaderAction(input).replay).toBe(false);
    expect(database.acceptScopedLeaderAction(input).replay).toBe(true);
    expect(database.scopedConfiguration("p")).toEqual(configuration);
    expect(database.eventsAfter("p", 0, 1000).find((event) => event.eventId === old.eventId)).toEqual(old);
    expect(database.verifyHealth().integrity).toBe("ok");
  });

  it.each([false, true])("publishes an already accepted legacy Main proposal without rewriting its original receipt or restoring the proxy (recovered=%s)", async recovered => {
    const root = await mkdtemp(join(tmpdir(), "openfars-legacy-main-config-")); roots.push(root);
    const database = CollaborationStateDatabase.open({ databasePath: join(root, "state.sqlite"), serviceId: "test", hostId: "test",
      topology: "single-host", instanceId: "one", now: () => 1_000_000 }); stores.push(database);
    const current = cloneAgentOrchestrationTemplate(); current.allowMainReconfiguration = true;
    const agents = mergeAgentConfigs(undefined, current), legacy = legacyConfiguration(agents);
    database.createProject({ projectId: "p", workflowRevision: 1, workflowSnapshot: current, git: { enabled: true, status: "ready" }, workerCapacity: 4 });
    const { nodeRun } = database.activateNode({ projectId: "p", nodeRunId: "root-main", node: { kind: "agent", nodeId: "main", agentId: "main" },
      activationRequestId: "activate-main", inputSnapshotRef: "original-input", activatedByAgentId: "main", workflowRevision: 1 });
    database.appendEvent({ projectId: "p", nodeRunId: "root-main", agentId: "main", invocationId: "original-main", coordinatorEpoch: 1,
      type: "main.route.attempt", payload: { attempt: 1 } });
    database.appendEvent({ projectId: "p", requestId: "historical-configuration", type: "scoped.configuration.applied", payload: { configuration: legacy } });
    const next = structuredClone(current); next.decisionPlans.main = "An already accepted safe change.";
    const configuration = structuredClone(legacy); configuration.agents.idea.instructions += " Accepted historical instructions.";
    const workflowProposal = { orchestration: next, affectedGroupIds: [], prestateWorkflowRevision: 1, prestateWorkflowHash: hash(current),
      targetWorkflowRevision: 2, proposalHash: hash(next), configuration, baseConfigurationHash: database.scopedConfigurationHash("p")! };
    const semanticInputHash = "d".repeat(64), requestId = `accepted-main-control-${semanticInputHash}-0`;
    const control = { projectId: "p", nodeRunId: "root-main", routeEpoch: 1, stateVersion: 1, invocationId: "original-main",
      candidateNodeIds: ["finish"], canComplete: true, allowFinishRoute: false,
      action: { tool: "apply_workflow" as const, path: "workflow.json", rationale: "Historical accepted proposal" } };
    const revision = database.projectState("p").revision;
    expect(() => database.revalidateMainRouteControl({ ...control, accepted: { requestId, inputId: "original-input", invocationId: "original-main",
      callId: "apply", semanticInputHash, workflowProposal } })).toThrow(/proxy.*no longer supported/);
    expect(database.projectState("p").revision).toBe(revision);
    // Seed the immutable receipt produced by the older version, through the
    // isolated database's normal event fixture API. No production event changes.
    const old = database.appendEvent({ projectId: "p", nodeRunId: "root-main", agentId: "main", invocationId: "original-main", coordinatorEpoch: 1,
      requestId, type: "main.route_action.accepted", payload: { protocol: "accepted-control-action-v1", inputId: "original-input", callId: "apply",
        stateVersion: 1, semanticInputHash, authorityStateHash: hash({ projectId: "p", workflowRevision: 1, activeNodeRunId: "root-main",
          nodeStatus: nodeRun.status, candidateNodeIds: ["finish"], canComplete: true, allowFinishRoute: false }),
        sequence: 0, candidateNodeIds: ["finish"], canComplete: true,
        allowFinishRoute: false, action: control.action, workflowProposal } }).event;
    if (recovered) {
      database.appendEvent({ projectId: "p", nodeRunId: "root-main", agentId: "main", coordinatorEpoch: 1,
        type: "main.route.recovered", payload: { residentStopConfirmed: true } });
      database.appendEvent({ projectId: "p", nodeRunId: "root-main", agentId: "main", invocationId: "recovered-main", coordinatorEpoch: 2,
        type: "main.route.attempt", payload: { attempt: 2 } });
      expect(database.revalidateMainRouteControl({ ...control, routeEpoch: 2, stateVersion: 2, invocationId: "recovered-main", accepted: {
        requestId: `accepted-main-control-${"f".repeat(64)}-0`, inputId: "recovered-input", invocationId: "recovered-main", callId: "recovered-apply",
        semanticInputHash: "f".repeat(64), workflowProposal, reboundFrom: { routeEpoch: 1, semanticInputHash, sequence: 0 }
      } })?.workflowProposal).toEqual(workflowProposal);
    }
    const completedInvocation = recovered ? "recovered-main" : "original-main", completedEpoch = recovered ? 2 : 1;
    // This historical receipt fixture still needs the real runtime boundary's
    // independent completion and resident-close facts before publication.
    database.appendEvent({ projectId: "p", nodeRunId: "root-main", agentId: "main", invocationId: completedInvocation,
      coordinatorEpoch: completedEpoch, type: "main.route.task_completion.committed", payload: { taskId: "original-management-task", inputId: recovered ? "recovered-input" : "original-input" } });
    const activity = { projectId: "p", nodeRunId: "root-main", agentId: "main", invocationId: completedInvocation, coordinatorEpoch: completedEpoch };
    database.startRuntimeActivity({ ...activity, kind: "resident", phase: "resident:running" });
    database.closeRuntimeActivity({ ...activity, kind: "resident", outcome: "completed" });
    const publication = { projectId: "p", nodeRunId: "root-main", routeEpoch: recovered ? 2 : 1,
      semanticInputHash: recovered ? "f".repeat(64) : semanticInputHash, sequence: 0 };
    expect(database.rollForwardAcceptedMainWorkflow(publication)).toMatchObject({ workflowRevision: 2, replay: false });
    expect(database.rollForwardAcceptedMainWorkflow(publication)).toMatchObject({ workflowRevision: 2, replay: true });
    expect(database.scopedConfiguration("p")).toEqual(credentialFreeAgentConfiguration(configuration));
    expect(database.eventsAfter("p", 0, 1000).find((event) => event.eventId === old.eventId)).toEqual(old);
    expect(database.verifyHealth().integrity).toBe("ok");
  });

  it("forbids outside Agent edits and defers configuration management while business work is active", async () => {
    const { database, current, authority, receipt, root } = await fixture(); const agents = mergeAgentConfigs(undefined, current);
    database.initializeScopedConfiguration("p", { agents, skillDefinitions: {}, mcpDefinitions: {} });
    const outside = mainAgentOrchestrationDocument("p", current, agents); outside.agents.writing.instructions += "outside";
    expect(() => parseScopedWorkflowProposal(JSON.stringify(outside), "p", current, agents, "G")).toThrow(/outside/);
    const locked = mainAgentOrchestrationDocument("p", current, agents); (locked.agents.idea as unknown as Record<string, unknown>).sessionPersistence = false;
    expect(() => parseScopedWorkflowProposal(JSON.stringify(locked), "p", current, agents, "G")).toThrow(/locked/);
    const input = structuredClone(current); input.scopedWorkflow!.groups[0].workflow.input.edges.push({ kind: "parallel", target: "G_execution" });
    expect(() => database.revalidateScopedLeaderAction({ ...authority, proposal: input, baseWorkflowHash: workflowBaseHash(current),
      envelope: receipt({ tool: "apply_workflow", path: "workflow.json", rationale: "Late parallel spawn" }) })).toThrow(/entry batch/);
    database.releaseScopedLeaderTurn({ ...authority, residentStopConfirmed: true });
    const arrival = database.scopedArrivals("run-G").find((item) => item.agentId === "idea")!;
    database.claimScopedAgentArrival({ projectId: "p", arrivalRequestId: arrival.requestId, agentId: "idea", executionId: "busy-idea", worktreePath: join(root, "git-worktrees", "agents", "idea") });
    expect(database.claimScopedLeaderTurn({ projectId: "p", groupRunId: "run-G", agentId: "review", invocationId: "leader-two",
      runtimePath: join(root, "runtime", "leader-two") })).toBeUndefined();
  });

  it("never grants skip to Main-as-Leader or before parent escalation; only a separately opened global turn can approve it", async () => {
    const { database, authority, root, childArrival } = await fixture();
    database.releaseScopedLeaderTurn({ ...authority, residentStopConfirmed: true });
    const arrival = database.scopedArrivals("run-H")[0];
    database.claimScopedAgentArrival({ projectId: "p", arrivalRequestId: arrival.requestId, agentId: "writing", executionId: "failed-writing",
      worktreePath: join(root, "git-worktrees", "agents", "writing") });
    const worker = { projectId: "p", executionId: "failed-writing", ownershipEpoch: 1, invocationId: "worker-native" };
    database.beginScopedAgentTurn({ ...worker, runtimePath: join(root, "runtime", "worker-native"), baseCommit: "a".repeat(40) });
    database.markScopedAgentTurnOpened({ ...worker, nativeProcessOpened: true }); database.stopScopedAgentTurn({ ...worker, residentStopConfirmed: true });
    database.failScopedAgentArrival({ ...worker, arrivalRequestId: arrival.requestId, reason: "Controlled failure", residentStopConfirmed: true });
    expect(database.scopedRecoveryCandidates("p", "run-H")[0]).toMatchObject({ reason: "Controlled failure",
      failureHistory: [expect.objectContaining({ ownershipEpoch: 1, reason: "Controlled failure" })] });
    const global = { projectId: "p", groupRunId: "run-G", agentId: "main", invocationId: "global-main", runtimePath: join(root, "runtime", "global-main"), globalMain: true };
    expect(() => database.claimScopedLeaderTurn(global)).toThrow();
    const decide = (groupRunId: string, agentId: string, invocationId: string, requestId: string, operation: "skip" | "escalate", globalMain = false) => {
      const claim = database.claimScopedLeaderTurn({ projectId: "p", groupRunId, agentId, invocationId, runtimePath: join(root, "runtime", invocationId), globalMain })!;
      const identity = { projectId: "p", groupRunId, agentId, invocationId, coordinatorEpoch: claim.coordinatorEpoch, globalMain };
      database.markScopedLeaderOpened(identity);
      const input = { ...identity, residentStopConfirmed: true as const, envelope: { schemaVersion: 1, projectId: "p", agent: agentId, invocationId,
        callId: "decision", stateVersion: claim.coordinatorEpoch, capabilityHash: "c".repeat(64), receivedAt: "2026-09-30T00:00:00Z",
        action: { tool: "coordinate_group_task" as const, groupRunId, coordinatorEpoch: claim.coordinatorEpoch, arrivalRequestId: requestId, operation, rationale: "Scoped decision" } } };
      database.recordScopedLeaderTaskCompletion({ ...identity, envelope: { ...input.envelope, callId: "own-finish",
        action: { tool: "finish_task", summary: "This manager finished its own round" } } });
      return { input, identity };
    };
    const child = decide("run-H", "main", "child-main", arrival.requestId, "skip");
    expect(() => database.acceptScopedLeaderAction(child.input)).toThrow(/Main-only/);
    database.acceptScopedLeaderAction({ ...child.input, envelope: { ...child.input.envelope, action: { ...child.input.envelope.action, operation: "escalate" } } });
    database.releaseScopedLeaderTurn({ ...child.identity, residentStopConfirmed: true });
    expect(() => database.claimScopedLeaderTurn(global)).toThrow();
    expect(database.scopedRecoveryCandidates("p", "run-G")[0].arrivalRequestId).toBe(childArrival.requestId);
    expect(database.scopedRecoveryCandidates("p", "run-G")[0].reason).toBe("Controlled failure");
    const parent = decide("run-G", "review", "parent-review", childArrival.requestId, "escalate");
    database.acceptScopedLeaderAction(parent.input); database.releaseScopedLeaderTurn({ ...parent.identity, residentStopConfirmed: true });
    expect(database.scopedRecoveryCandidates("p", "run-G", true)[0]).toMatchObject({ reason: "Controlled failure",
      executionId: "failed-writing", failedArrivalRequestId: arrival.requestId });
    const main = decide("run-G", "main", "global-main", arrival.requestId, "skip", true);
    database.acceptScopedLeaderAction(main.input); database.releaseScopedLeaderTurn({ ...main.identity, residentStopConfirmed: true });
    expect(() => database.applyScopedMainSkip("p", "failed-writing", 1)).toThrow(/observed owned PR or confirmed absence/);
    database.recordScopedRecoveryPull({ projectId: "p", executionId: "failed-writing", ownershipEpoch: 1 });
    database.applyScopedMainSkip("p", "failed-writing", 1);
    expect(database.scopedArrivals("run-H")[0].status).toBe("skipped"); expect(database.scopedGroupReadyForFinalIntegration("p", "run-H")).toBe(false);
    expect(() => database.continueScopedSkippedArrival("p", "run-H", arrival.requestId)).toThrow(/explicit Leader/);
  });

  it("migrates v16 only with the exact writer and preserves all pre-existing local Leader turns as local", async () => {
    const { database, options } = await fixture(); const writerLease = database.writerLease(); database.close();
    const sql = new DatabaseSync(options.databasePath); sql.exec("ALTER TABLE scoped_leader_turns DROP COLUMN management_role");
    sql.exec("UPDATE collaboration_state_meta SET schema_version = 16");
    expect(() => initializeCollaborationStateSchema(sql)).toThrow(/lease/); sql.close();
    const migrated = CollaborationStateDatabase.open({ ...options, writerLease }); stores.push(migrated);
    expect(migrated.verifyHealth().schemaVersion).toBe(COLLABORATION_STATE_SCHEMA_VERSION);
    expect(migrated.scopedLeaderTurns("p")[0]).toMatchObject({ invocationId: "leader-one", globalMain: false, status: "active" });
  });
});

describe("durable scoped workflow adjustment publication", () => {
  async function adjustmentFixture(finished = true, globalMain = false) {
    const current = workflow(); current.allowMainReconfiguration = true;
    const f = await fixture(finished, current);
    let authority: typeof f.authority & { globalMain?: boolean } = f.authority;
    let receipt = f.receipt;
    if (globalMain) {
      const issue = f.database.recordScopedGroupIssue({ projectId: "p", groupRunId: "run-G", kind: "plan", reason: "Actual retained plan failure" });
      const candidate = f.database.scopedRecoveryCandidates("p", "run-G").find(entry => entry.incidentId === issue.id)!;
      f.database.acceptScopedLeaderAction({ ...authority, residentStopConfirmed: true, envelope: receipt({ tool: "coordinate_group_task",
        groupRunId: "run-G", coordinatorEpoch: authority.coordinatorEpoch, arrivalRequestId: candidate.arrivalRequestId, operation: "escalate", rationale: "Root Leader escalation" }, "escalate") });
      f.database.releaseScopedLeaderTurn({ ...authority, residentStopConfirmed: true });
      const claim = f.database.claimScopedLeaderTurn({ projectId: "p", groupRunId: "run-G", agentId: "main", invocationId: "global-adjustment",
        runtimePath: join(f.root, "runtime", "global-adjustment"), globalMain: true })!;
      authority = { projectId: "p", groupRunId: "run-G", agentId: "main", invocationId: "global-adjustment", coordinatorEpoch: claim.coordinatorEpoch, globalMain: true };
      f.database.markScopedLeaderOpened(authority);
      receipt = (action, callId = "decision") => ({ projectId: "p", agent: "main", invocationId: authority.invocationId,
        callId, stateVersion: authority.coordinatorEpoch, capabilityHash: "c".repeat(64), receivedAt: "2026-10-10T18:00:00Z", action });
      f.database.recordScopedLeaderTaskCompletion({ ...authority, envelope: receipt({ tool: "finish_task", summary: "Global Main's own memory" }, "own-finish") });
    }
    const { orchestration, ...configuration } = f.database.workflowAdjustmentCurrent("p").snapshot;
    configuration.agents.idea.instructions = "Exact formal scoped proposal";
    const input = { ...authority, envelope: receipt({ tool: "apply_workflow", path: "workflow.json", rationale: "Exact manager public explanation" }),
      proposal: orchestration, configuration, baseWorkflowHash: workflowBaseHash(orchestration), baseConfigurationHash: f.database.scopedConfigurationHash("p") };
    const requestId = `scoped-workflow-proposal:${authority.invocationId}:${input.envelope.callId}`;
    const stage = () => f.database.revalidateScopedLeaderAction(input);
    const accept = () => f.database.acceptScopedLeaderAction({ ...input, residentStopConfirmed: true });
    const release = () => f.database.releaseScopedLeaderTurn({ ...authority, residentStopConfirmed: true });
    const recover = (database = f.database) => database.publishStoppedScopedWorkflowAdjustment("p", requestId);
    return { ...f, authority, receipt, input, requestId, stage, accept, release, recover };
  }

  it.each([false, true])("rechecks a retained native Harness before scoped final acceptance and stopped recovery (global=%s)", async globalMain => {
    const f = await adjustmentFixture(true, globalMain); f.input.configuration.agents.idea.harness = "dsh";
    f.stage(); const before = f.database.workflowAdjustmentCurrent("p"), original = f.database.workflowAdjustment("p", f.requestId)!;
    f.database.recordAgentNativeSessionBinding({ projectId: "p", agentId: "idea", invocationId: "original-before-scoped-apply",
      runtimePath: join(f.root, "runtime", "original-idea"), worktreePath: join(f.root, "worktrees", "idea"),
      executionContext: { role: "delivery", nodeRunId: "original-idea-node", executionId: "original-idea-execution", ownershipEpoch: 1, executionWorktree: join(f.root, "worktrees", "idea") },
      session: { schemaVersion: 1, harnessId: "codex", adapterVersion: "test", nativeId: "original-idea-session", generation: 0, durable: true, createdAt: "2026-10-11T00:00:00.000Z" } });
    const accepted = f.accept();
    console.log(JSON.stringify({ experiment: "late-scoped-native-harness", globalMain, status: accepted.workflowAdjustment?.status, revision: accepted.workflowAdjustment?.workflowRevision }));
    expect(accepted.workflowAdjustment).toMatchObject({ status: "pending", workflowRevision: 1, reason: expect.stringContaining("Harness") });
    f.release();
    expect(f.recover()).toMatchObject({ status: "pending", workflowRevision: 1, reason: expect.stringContaining("Harness") });
    expect(f.database.workflowAdjustmentCurrent("p")).toEqual(before);
    expect(f.database.workflowAdjustment("p", f.requestId)!.proposal).toEqual(original.proposal);
    expect(f.database.latestAgentNativeSessionBinding("p", "idea")!.session.nativeId).toBe("original-idea-session");
  });

  it.each([false, true])("persists the real full proposal at live tool acceptance with its true manager identity (global=%s)", async globalMain => {
    const f = await adjustmentFixture(true, globalMain), before = f.database.workflowAdjustmentCurrent("p");
    f.stage(); const record = f.database.workflowAdjustments("p")[0];
    expect(record).toMatchObject({ requestId: f.requestId, status: "pending", base: before.version, baseSnapshot: before.snapshot,
      proposal: { agents: { idea: { instructions: "Exact formal scoped proposal" } } }, explanation: "Exact manager public explanation",
      source: { kind: globalMain ? "main" : "scoped_leader", invocationId: f.authority.invocationId, callId: "decision", nodeRunId: "node-G" } });
    if (globalMain) expect(record.source).toMatchObject({ scope: { kind: "scoped", groupRunId: "run-G" } });
    else expect(record.source).toMatchObject({ agentId: "review", groupRunId: "run-G" });
    expect(f.database.workflowAdjustmentCurrent("p")).toEqual(before);
    expect(f.database.scopedWorkflowAdjustmentProposal("p", f.authority.invocationId, "decision")).toEqual(f.input);
  });

  it("atomically rolls back the staged receipt if the shared snapshot cannot persist", async () => {
    const f = await adjustmentFixture(), before = f.database.eventsAfter("p", 0, 1000);
    const raw = new DatabaseSync(f.options.databasePath);
    raw.exec(`CREATE TRIGGER fixture_fail_scoped_stage BEFORE INSERT ON project_events WHEN NEW.event_type = 'workflow.adjustment.submitted'
      BEGIN SELECT RAISE(ABORT, 'fixture shared snapshot failed'); END;`); raw.close();
    expect(f.stage).toThrow("fixture shared snapshot failed");
    expect(f.database.eventsAfter("p", 0, 1000)).toEqual(before); expect(f.database.workflowAdjustments("p")).toEqual([]);
    expect(f.database.scopedWorkflowAdjustmentProposal("p", f.authority.invocationId, "decision")).toBeUndefined();
  });

  it("keeps an immutable tool snapshot across changed drafts, duplicate receipt and withdrawal", async () => {
    const f = await adjustmentFixture(); f.stage(); const staged = f.database.scopedWorkflowAdjustmentProposal("p", f.authority.invocationId, "decision");
    const changed = structuredClone(f.input); changed.configuration.agents.idea.instructions = "A later file draft";
    expect(() => f.database.revalidateScopedLeaderAction(changed)).toThrow(/changed on replay/);
    f.database.withdrawWorkflowAdjustment({ projectId: "p", requestId: f.requestId, operationId: "withdraw" });
    const events = f.database.eventsAfter("p", 0, 1000); f.stage();
    expect(f.database.eventsAfter("p", 0, 1000)).toEqual(events);
    expect(f.database.scopedWorkflowAdjustmentProposal("p", f.authority.invocationId, "decision")).toEqual(staged);
    expect(f.accept().workflowAdjustment).toMatchObject({ status: "withdrawn", workflowRevision: 1 });
    expect(f.database.workflowAdjustments("p")[0].status).toBe("withdrawn");
  });

  it.each([false, true])("prevents withdrawn scoped publication and recovery while preserving own finish/tool facts (global=%s)", async globalMain => {
    const f = await adjustmentFixture(true, globalMain); f.stage();
    const before = f.database.workflowAdjustmentCurrent("p"), staged = f.database.eventByRequestId("p", f.requestId),
      finish = f.database.eventsAfter("p", 0, 1000).filter(event => event.type === "scoped.leader.task.completed");
    f.database.withdrawWorkflowAdjustment({ projectId: "p", requestId: f.requestId, operationId: "withdraw", note: "Exact user constraint" });
    expect(f.accept().workflowAdjustment).toMatchObject({ status: "withdrawn", workflowRevision: 1 }); f.release();
    expect(f.recover()).toMatchObject({ status: "withdrawn", workflowRevision: 1 });
    expect(f.database.workflowAdjustmentCurrent("p")).toEqual(before); expect(f.database.eventByRequestId("p", f.requestId)).toEqual(staged);
    expect(f.database.eventsAfter("p", 0, 1000).filter(event => event.type === "scoped.leader.task.completed")).toEqual(finish);
    expect(f.accept()).toMatchObject({ replay: true, workflowAdjustment: { status: "withdrawn" } });
  });

  it("atomically applies a valid scoped proposal and reports applied if withdrawal arrives later", async () => {
    const f = await adjustmentFixture(); f.stage();
    const arrivals = f.database.projectState("p").scopedArrivals, result = f.accept(), current = f.database.workflowAdjustmentCurrent("p");
    expect(result.workflowAdjustment).toMatchObject({ status: "applied", workflowRevision: 2, appliedVersion: current.version });
    expect(current.snapshot.agents.idea.instructions).toBe("Exact formal scoped proposal");
    expect(f.database.projectState("p").scopedArrivals).toEqual(arrivals);
    expect(f.database.withdrawWorkflowAdjustment({ projectId: "p", requestId: f.requestId, operationId: "late" })).toMatchObject({ withdrawn: false, record: { status: "applied" } });
    expect(f.accept()).toMatchObject({ replay: true, workflowAdjustment: { status: "applied" } });
  });

  it("rolls back workflow, configuration and final acceptance when applied status persistence fails", async () => {
    const f = await adjustmentFixture(); f.stage(); const before = f.database.workflowAdjustmentCurrent("p"), events = f.database.eventsAfter("p", 0, 1000);
    const raw = new DatabaseSync(f.options.databasePath);
    raw.exec(`CREATE TRIGGER fixture_fail_scoped_applied BEFORE INSERT ON project_events
      WHEN NEW.event_type = 'workflow.adjustment.transitioned' AND json_extract(NEW.payload_json, '$.transition.status') = 'applied'
      BEGIN SELECT RAISE(ABORT, 'fixture applied failed'); END;`); raw.close();
    expect(f.accept).toThrow("fixture applied failed");
    expect(f.database.workflowAdjustmentCurrent("p")).toEqual(before); expect(f.database.eventsAfter("p", 0, 1000)).toEqual(events);
    expect(f.database.workflowAdjustments("p")[0].status).toBe("pending");
  });

  it("gives a same-base user conflict priority and later reevaluates the exact original staged request", async () => {
    const f = await adjustmentFixture(); f.stage(); const user = structuredClone(f.database.workflowAdjustmentCurrent("p")); user.snapshot.agents.idea.instructions = "User's own proposal";
    f.database.submitUserWorkflowAdjustment({ projectId: "p", requestId: "user-first", base: user.version, proposal: user.snapshot });
    expect(f.accept().workflowAdjustment).toMatchObject({ status: "pending", reason: expect.stringContaining("user-first") });
    const accepted = f.database.eventByRequestId("p", `scoped-leader-action:${f.authority.invocationId}:decision`);
    f.release(); f.database.withdrawWorkflowAdjustment({ projectId: "p", requestId: "user-first", operationId: "withdraw-user" });
    expect(f.recover()).toMatchObject({ status: "applied", workflowRevision: 2 });
    expect(f.database.eventByRequestId("p", `scoped-leader-action:${f.authority.invocationId}:decision`)).toEqual(accepted);
    expect(f.database.workflowAdjustmentCurrent("p").snapshot.agents.idea.instructions).toBe("Exact formal scoped proposal");
  });

  it("marks an old full snapshot stale when only configuration changes during the native window", async () => {
    const f = await adjustmentFixture(); f.stage(); const proposal = f.database.workflowAdjustments("p")[0];
    const configuration = structuredClone(f.database.scopedConfiguration("p")!); configuration.agents.idea.instructions = "Another formally accepted version";
    f.database.appendEvent({ projectId: "p", type: "scoped.configuration.applied", payload: { configuration } });
    expect(f.accept().workflowAdjustment).toMatchObject({ status: "needs_resubmission", workflowRevision: 1 });
    const record = f.database.workflowAdjustments("p")[0]; expect(record.proposal).toEqual(proposal.proposal); expect(record.base).toEqual(proposal.base);
    expect(record.history.at(-1)?.status).toBe("needs_resubmission"); expect(f.database.scopedConfiguration("p")).toEqual(configuration);
  });

  it("does not use native stop as a substitute for the original management task's finish", async () => {
    const f = await adjustmentFixture(false); f.stage();
    expect(f.recover()).toMatchObject({ status: "pending", reason: expect.stringContaining("原生停止") }); f.release();
    expect(f.recover()).toMatchObject({ status: "pending", reason: expect.stringContaining("finish_task") });
    expect(f.database.projectState("p").workflowRevision).toBe(1);
    expect(f.database.eventByRequestId("p", `scoped-leader-action:${f.authority.invocationId}:decision`)).toBeUndefined();
  });

  it.each(["apply", "withdraw"] as const)("restores the durable original proposal across a real writer restart without reading a draft (%s)", async outcome => {
    const f = await adjustmentFixture(); f.stage(); f.release();
    if (outcome === "withdraw") f.database.withdrawWorkflowAdjustment({ projectId: "p", requestId: f.requestId, operationId: "withdraw" });
    const staged = f.database.scopedWorkflowAdjustmentProposal("p", f.authority.invocationId, "decision"); f.database.close();
    const restarted = CollaborationStateDatabase.open({ ...f.options, instanceId: "next-writer", now: () => 1_030_001 }); stores.push(restarted);
    expect(f.recover(restarted)).toMatchObject({ status: outcome === "apply" ? "applied" : "withdrawn", workflowRevision: outcome === "apply" ? 2 : 1 });
    expect(restarted.scopedWorkflowAdjustmentProposal("p", f.authority.invocationId, "decision")).toEqual(staged);
    expect(restarted.verifyHealth().integrity).toBe("ok");
  });

  it.each(["idea", "writing"] as const)("checks affected logical tasks after their native stop and permits unrelated work (%s)", async agentId => {
    const f = await adjustmentFixture(); f.stage(); f.release();
    const groupRunId = agentId === "idea" ? "run-G" : "run-H", arrival = f.database.scopedArrivals(groupRunId).find(entry => entry.agentId === agentId)!;
    f.database.claimScopedAgentArrival({ projectId: "p", arrivalRequestId: arrival.requestId, agentId, executionId: "retained-task",
      worktreePath: join(f.root, "git-worktrees", "agents", agentId) });
    const identity = { projectId: "p", executionId: "retained-task", ownershipEpoch: 1, invocationId: "stopped-native" };
    f.database.beginScopedAgentTurn({ ...identity, runtimePath: join(f.root, "runtime", "stopped-native"), baseCommit: "a".repeat(40) });
    f.database.markScopedAgentTurnOpened({ ...identity, nativeProcessOpened: true }); f.database.stopScopedAgentTurn({ ...identity, residentStopConfirmed: true });
    const before = f.database.scopedExecution("p", "retained-task");
    expect(f.recover()).toMatchObject({ status: agentId === "idea" ? "pending" : "applied" });
    if (agentId === "idea") expect(f.database.workflowAdjustments("p")[0].waitingReason).toContain("逻辑任务 retained-task");
    expect(f.database.scopedExecution("p", "retained-task")).toEqual(before);
  });

  it.each(["idea", "writing"] as const)("retains an unsettled original Git operation despite a terminal execution projection (%s)", async agentId => {
    const f = await adjustmentFixture(); f.stage(); f.release();
    const groupRunId = agentId === "idea" ? "run-G" : "run-H", arrival = f.database.scopedArrivals(groupRunId).find(entry => entry.agentId === agentId)!;
    f.database.claimScopedAgentArrival({ projectId: "p", arrivalRequestId: arrival.requestId, agentId, executionId: "retained-git-task",
      worktreePath: join(f.root, "git-worktrees", "agents", agentId) });
    const identity = { projectId: "p", executionId: "retained-git-task", ownershipEpoch: 1, invocationId: "git-native" };
    f.database.beginScopedAgentTurn({ ...identity, runtimePath: join(f.root, "runtime", "git-native"), baseCommit: "a".repeat(40) });
    f.database.markScopedAgentTurnOpened({ ...identity, nativeProcessOpened: true });
    const operation = await prepareOperation(f.database.operationsForProject("p", true), { id: "retained-original-push", kind: "git.push",
      ownerExecutionId: identity.executionId, ownershipEpoch: 1, expectedHead: "b".repeat(40),
      expectedBase: f.database.scopedExecution("p", identity.executionId)!.executionBranch }, { head: "b".repeat(40) });
    f.database.stopScopedAgentTurn({ ...identity, residentStopConfirmed: true });
    // Isolated recovery fixture: a terminal projection is weaker than the
    // retained provider journal. No external Git result is invented here.
    const sql = new DatabaseSync(f.options.databasePath);
    try { sql.prepare("UPDATE scoped_executions SET status = 'stopped' WHERE execution_id = ?").run(identity.executionId); } finally { sql.close(); }
    const before = f.database.scopedExecution("p", identity.executionId);
    expect(f.recover()).toMatchObject({ status: agentId === "idea" ? "pending" : "applied" });
    if (agentId === "idea") expect(f.database.workflowAdjustments("p")[0].waitingReason).toContain("原交付/Git/控制收尾：retained-git-task");
    expect(await f.database.operationsForProject("p", true).recordedOperation(operation.id)).toEqual(operation);
    expect(f.database.scopedExecution("p", identity.executionId)).toEqual(before);
  });

  it.each(["stopped", "paused", "failed", "completed", "cancelled"] as const)("does not discharge an affected logical arrival from its %s execution projection", async status => {
    const f = await adjustmentFixture(); f.stage(); f.release();
    const arrival = f.database.scopedArrivals("run-G").find(entry => entry.agentId === "idea")!;
    f.database.claimScopedAgentArrival({ projectId: "p", arrivalRequestId: arrival.requestId, agentId: "idea", executionId: "original-logical-task",
      worktreePath: join(f.root, "git-worktrees", "agents", "idea") });
    const identity = { projectId: "p", executionId: "original-logical-task", ownershipEpoch: 1, invocationId: "original-stopped-native" };
    f.database.beginScopedAgentTurn({ ...identity, runtimePath: join(f.root, "runtime", identity.invocationId), baseCommit: "a".repeat(40) });
    f.database.markScopedAgentTurnOpened({ ...identity, nativeProcessOpened: true });
    f.database.stopScopedAgentTurn({ ...identity, residentStopConfirmed: true });
    // An isolated recovery projection must not manufacture a report, merge,
    // accepted skip, or finished logical arrival. The durable native did stop.
    const sql = new DatabaseSync(f.options.databasePath);
    try { sql.prepare("UPDATE scoped_executions SET status = ? WHERE execution_id = ?").run(status, identity.executionId); }
    finally { sql.close(); }
    const before = f.database.projectState("p"), configuration = f.database.workflowAdjustmentCurrent("p");
    expect(f.recover()).toMatchObject({ status: "pending", reason: expect.stringContaining("逻辑任务 original-logical-task") });
    const waitingEvents = f.database.eventsAfter("p", 0, 1000); expect(f.recover().status).toBe("pending");
    expect(f.database.eventsAfter("p", 0, 1000)).toEqual(waitingEvents);
    expect(f.database.workflowAdjustmentCurrent("p")).toEqual(configuration);
    const after = f.database.projectState("p");
    for (const field of ["scopedArrivals", "scopedExecutions", "scopedAgentReports", "scopedAgentTaskCompletions", "scopedAgentMerges", "failureAttempts", "gitRetryScheduling"] as const)
      expect(after[field]).toEqual(before[field]);
  });

  it("checks an affected node's original route after its native and execution have stopped", async () => {
    const f = await adjustmentFixture(), current = f.database.workflowAdjustmentCurrent("p");
    f.input.configuration.agents.idea = current.snapshot.agents.idea;
    f.input.proposal.scopedWorkflow!.groups.find(group => group.id === "G")!.workflow.routes.G_idea = [edge("finish")];
    f.stage(); f.release();
    const arrival = f.database.scopedArrivals("run-G").find(entry => entry.agentId === "idea")!;
    f.database.claimScopedAgentArrival({ projectId: "p", arrivalRequestId: arrival.requestId, agentId: "idea", executionId: "route-owner",
      worktreePath: join(f.root, "git-worktrees", "agents", "idea") });
    const identity = { projectId: "p", executionId: "route-owner", ownershipEpoch: 1, invocationId: "route-native" };
    f.database.beginScopedAgentTurn({ ...identity, runtimePath: join(f.root, "runtime", identity.invocationId), baseCommit: "a".repeat(40) });
    f.database.markScopedAgentTurnOpened({ ...identity, nativeProcessOpened: true }); f.database.stopScopedAgentTurn({ ...identity, residentStopConfirmed: true });
    const sql = new DatabaseSync(f.options.databasePath);
    try { sql.prepare("UPDATE scoped_executions SET status = 'stopped' WHERE execution_id = ?").run(identity.executionId); } finally { sql.close(); }
    expect(f.recover()).toMatchObject({ status: "pending", reason: expect.stringContaining("逻辑任务 route-owner") });
    expect(f.database.workflowAdjustmentCurrent("p")).toEqual(current);
  });

  it("preserves a stopped task's active Loop topology when another member's route changes", async () => {
    const current = workflow(), group = current.scopedWorkflow!.groups.find(group => group.id === "G")!;
    group.workflow.nodes.push({ kind: "agent", nodeId: "G_writing", agentId: "writing" });
    group.workflow.routes.G_execution = [edge("G_idea")]; group.workflow.routes.G_writing = [edge("finish")];
    group.workflow.routes.G_H = [{ kind: "weak", target: "G_idea" }, { kind: "weak", target: "finish" }];
    group.workflow.loops = [{ id: "original-loop", from: "G_execution", to: "G_idea", maxIterations: 2, exitTo: "G_writing" }];
    const f = await fixture(true, normalizeAgentOrchestrationTemplate(current)); f.database.releaseScopedLeaderTurn({ ...f.authority, residentStopConfirmed: true });
    const first = f.database.scopedArrivals("run-G").find(arrival => arrival.agentId === "idea")!;
    f.database.claimScopedAgentArrival({ projectId: "p", arrivalRequestId: first.requestId, agentId: "idea", executionId: "loop-entry",
      worktreePath: join(f.root, "git-worktrees", "agents", "idea") });
    const base = f.database.scopedGroupRun("p", "run-G")!.groupBranch as `groups/${string}`, now = "1970-01-01T00:16:40.000Z", merge = "c".repeat(40);
    // Legacy S completion fixture supplies controlled provider/local facts;
    // no native call is invented for this already delivered entry.
    f.database.completeScopedAgentArrivalAfterMerge({ projectId: "p", arrivalRequestId: first.requestId, executionId: "loop-entry", ownershipEpoch: 1,
      pullRequest: { id: "loop-entry-pull", providerNumber: 1, htmlUrl: "https://github.com/example/openfars/pull/1", ownerExecutionId: "loop-entry",
        head: "executions/loop-entry", base, status: "merged", headSha: "b".repeat(40), mergeCommitSha: merge, observedAt: now },
      synchronization: { projectId: "p", operationId: mergedPullSynchronizationOperationId("loop-entry", 1, "b".repeat(40), base, merge),
        targetBranch: base, temporaryRef: "refs/openfars/controlled-loop-entry", expectedSourceHead: "b".repeat(40), mergeCommitSha: merge,
        remoteHead: merge, localHeadBefore: "a".repeat(40), localHeadAfter: merge, status: "synchronized", observedAt: now } });
    const claim = f.database.claimScopedLeaderTurn({ projectId: "p", groupRunId: "run-G", agentId: "review", invocationId: "loop-manager",
      runtimePath: join(f.root, "runtime", "loop-manager") })!;
    const authority = { projectId: "p", groupRunId: "run-G", agentId: "review", invocationId: "loop-manager", coordinatorEpoch: claim.coordinatorEpoch };
    f.database.markScopedLeaderOpened(authority);
    const envelope = (action: ControlAction, callId: string): ControlActionEnvelope => ({ projectId: "p", agent: "review", invocationId: "loop-manager", callId,
      stateVersion: claim.coordinatorEpoch, capabilityHash: "d".repeat(64), receivedAt: now, action });
    f.database.recordScopedLeaderTaskCompletion({ ...authority, envelope: envelope({ tool: "finish_task", summary: "My actual topology proposal is ready" }, "own-finish") });
    const before = f.database.workflowAdjustmentCurrent("p"), proposal = structuredClone(before.snapshot.orchestration);
    const nextGroup = proposal.scopedWorkflow!.groups.find(group => group.id === "G")!;
    nextGroup.workflow.nodes.push({ kind: "agent", nodeId: "G_idea_again", agentId: "idea" });
    nextGroup.workflow.routes.G_idea = [edge("G_idea_again")]; nextGroup.workflow.routes.G_idea_again = [edge("G_execution")];
    f.database.revalidateScopedLeaderAction({ ...authority, envelope: envelope({ tool: "apply_workflow", path: "workflow.json", rationale: "My actual changed member path" }, "apply"),
      proposal, baseWorkflowHash: workflowBaseHash(before.snapshot.orchestration) });
    f.database.releaseScopedLeaderTurn({ ...authority, residentStopConfirmed: true });
    const original = f.database.scopedArrivals("run-G").find(arrival => arrival.agentId === "execution")!;
    expect(original.pathContext?.loops["original-loop"]).toBeDefined();
    f.database.claimScopedAgentArrival({ projectId: "p", arrivalRequestId: original.requestId, agentId: "execution", executionId: "loop-member",
      worktreePath: join(f.root, "git-worktrees", "agents", "execution") });
    const identity = { projectId: "p", executionId: "loop-member", ownershipEpoch: 1, invocationId: "loop-member-native" };
    f.database.beginScopedAgentTurn({ ...identity, runtimePath: join(f.root, "runtime", identity.invocationId), baseCommit: merge });
    f.database.markScopedAgentTurnOpened({ ...identity, nativeProcessOpened: true }); f.database.stopScopedAgentTurn({ ...identity, residentStopConfirmed: true });
    const sql = new DatabaseSync(f.options.databasePath);
    try { sql.prepare("UPDATE scoped_executions SET status = 'stopped' WHERE execution_id = ?").run(identity.executionId); } finally { sql.close(); }
    const arrivalsBefore = f.database.scopedArrivals("run-G");
    expect(f.database.publishStoppedScopedWorkflowAdjustment("p", "scoped-workflow-proposal:loop-manager:apply"))
      .toMatchObject({ status: "pending", reason: expect.stringContaining("逻辑任务 loop-member") });
    expect(f.database.workflowAdjustmentCurrent("p")).toEqual(before); expect(f.database.scopedArrivals("run-G")).toEqual(arrivalsBefore);
  });

  it("retains an unsettled Git operation from an older ownership epoch", async () => {
    const f = await adjustmentFixture(); f.stage(); f.release();
    const arrival = f.database.scopedArrivals("run-G").find(entry => entry.agentId === "idea")!;
    f.database.claimScopedAgentArrival({ projectId: "p", arrivalRequestId: arrival.requestId, agentId: "idea", executionId: "old-epoch-owner",
      worktreePath: join(f.root, "git-worktrees", "agents", "idea") });
    const operation = await prepareOperation(f.database.operationsForProject("p", true), { id: "old-epoch-push", kind: "git.push",
      ownerExecutionId: "old-epoch-owner", ownershipEpoch: 1, expectedHead: "b".repeat(40), expectedBase: "executions/old-epoch-owner" }, { head: "b".repeat(40) });
    // Reproduce recovery's newer ownership label without erasing the older
    // provider uncertainty. It cannot be hidden by checking only epoch 2.
    const sql = new DatabaseSync(f.options.databasePath);
    try { sql.prepare("UPDATE scoped_executions SET ownership_epoch = 2, status = 'stopped' WHERE execution_id = ?").run("old-epoch-owner"); } finally { sql.close(); }
    expect(f.recover()).toMatchObject({ status: "pending", reason: expect.stringContaining("原交付/Git/控制收尾：old-epoch-owner") });
    expect(await f.database.operationsForProject("p", true).recordedOperation(operation.id)).toEqual(operation);
    expect(f.database.scopedExecution("p", "old-epoch-owner")).toMatchObject({ ownershipEpoch: 2, status: "stopped" });
  });

  it.each([false, true])("applies after exact original completion, merge and any required native result reception (receipt=%s)", async pendingReceipt => {
    const f = await adjustmentFixture(); f.stage(); f.release();
    const arrival = f.database.scopedArrivals("run-G").find(entry => entry.agentId === "idea")!;
    f.database.claimScopedAgentArrival({ projectId: "p", arrivalRequestId: arrival.requestId, agentId: "idea", executionId: "delivered-owner",
      worktreePath: join(f.root, "git-worktrees", "agents", "idea") });
    const identity = { projectId: "p", executionId: "delivered-owner", ownershipEpoch: 1, invocationId: "delivered-native" };
    f.database.beginScopedAgentTurn({ ...identity, runtimePath: join(f.root, "runtime", identity.invocationId), baseCommit: "a".repeat(40) });
    f.database.markScopedAgentTurnOpened({ ...identity, nativeProcessOpened: true });
    const session = { schemaVersion: 1 as const, harnessId: "codex", adapterVersion: "test", generation: 1, nativeId: "original-idea-session", durable: true,
      createdAt: "1970-01-01T00:16:40.000Z" };
    const context = { projectId: "p", agentId: "idea", invocationId: identity.invocationId, session,
      executionContext: { role: "delivery" as const, nodeRunId: "node-G", groupRunId: "run-G", taskId: arrival.requestId, executionId: identity.executionId,
        ownershipEpoch: 1, coordinatorEpoch: 1 } };
    f.database.recordAgentNativeSessionBinding({ ...context, runtimePath: join(f.root, "runtime", identity.invocationId), worktreePath: join(f.root, "git-worktrees", "agents", "idea") });
    const receipts = controlResultReceipts(f.database, context);
    const receiptId = pendingReceipt ? receipts.record({ requestedCallId: "own-finish", envelope: { projectId: "p", agent: "idea", invocationId: identity.invocationId,
      callId: "own-finish", stateVersion: 1, capabilityHash: "d".repeat(64), receivedAt: session.createdAt, action: { tool: "finish_task", summary: "Original Agent's own finish" } } }) : undefined;
    f.database.recordScopedAgentTaskCompletion({ ...identity, agentId: "idea", callId: "own-finish", summary: "Original Agent's own finish",
      memory: "Original immutable memory", requestedAt: "1970-01-01T00:16:40.000Z" });
    f.database.recordScopedAgentReport({ ...identity, output: "Original A report", reportHeadSha: "b".repeat(40),
      residentTurnCompleted: true, residentStopConfirmed: true });
    expect(f.recover()).toMatchObject({ status: "pending", reason: expect.stringContaining("逻辑任务 delivered-owner") });
    const base = f.database.scopedGroupRun("p", "run-G")!.groupBranch as `groups/${string}`, merge = "c".repeat(40), now = "1970-01-01T00:16:40.000Z";
    // Controlled provider and local-sync evidence exercises the production S
    // completion gate; it is not a claim of a real provider/model acceptance.
    f.database.completeScopedAgentArrivalAfterMerge({ projectId: "p", arrivalRequestId: arrival.requestId, executionId: identity.executionId,
      ownershipEpoch: 1, pullRequest: { id: "pull-original", providerNumber: 1, htmlUrl: "https://github.com/example/openfars/pull/1",
        ownerExecutionId: identity.executionId, head: `executions/${identity.executionId}`, base, status: "merged", headSha: "b".repeat(40), mergeCommitSha: merge, observedAt: now },
      synchronization: { projectId: "p", operationId: mergedPullSynchronizationOperationId(identity.executionId, 1, "b".repeat(40), base, merge),
        targetBranch: base, temporaryRef: "refs/openfars/controlled-merge", expectedSourceHead: "b".repeat(40), mergeCommitSha: merge,
        remoteHead: merge, localHeadBefore: "a".repeat(40), localHeadAfter: merge, status: "synchronized", observedAt: now } });
    const before = f.database.projectState("p"), future = before.scopedArrivals?.filter(entry => entry.status === "queued");
    if (receiptId) {
      expect(f.recover()).toMatchObject({ status: "pending", reason: expect.stringContaining("原 Session 实际接收：delivered-owner") });
      const native = { invocationId: identity.invocationId, harnessId: session.harnessId, sourceType: "item.completed",
        tool: { callId: "native-finish", name: "finish_task", server: "openfars-resident-control", toolType: "mcp", input: JSON.stringify({ callId: "own-finish" }) } };
      receipts.observeNative({ ...native, kind: "tool.started", eventId: "actual-start" });
      receipts.observeNative({ ...native, kind: "tool.completed", eventId: "actual-return", tool: { ...native.tool, outputPreview: controlResultMarker(receiptId) } });
      expect(f.database.pendingControlResultEvents("p", "idea")).toEqual([]);
    }
    expect(f.recover()).toMatchObject({ status: "applied", workflowRevision: 2 });
    const after = f.database.projectState("p");
    expect(after.scopedArrivals?.filter(entry => entry.status === "queued")).toEqual(future);
    for (const field of ["scopedExecutions", "scopedAgentReports", "scopedAgentTaskCompletions", "scopedAgentMerges", "failureAttempts", "gitRetryScheduling"] as const)
      expect(after[field]).toEqual(before[field]);
    expect(f.database.scopedAgentTurn("p", identity.executionId, 1)?.status).toBe("stopped");
  });

  it("rejects user occupation of the reserved scoped tool proposal namespace", async () => {
    const f = await adjustmentFixture(), current = f.database.workflowAdjustmentCurrent("p");
    expect(() => f.database.submitUserWorkflowAdjustment({ projectId: "p", requestId: f.requestId, base: current.version, proposal: current.snapshot })).toThrow(/reserved/);
    expect(f.database.workflowAdjustments("p")).toEqual([]);
  });
  it("does not revive a withdrawn management choice through a new callId in the same finish repair", async () => {
    const f = await adjustmentFixture(); f.stage();
    f.database.withdrawWorkflowAdjustment({ projectId: "p", requestId: f.requestId, operationId: "withdraw" });
    expect(() => f.database.revalidateScopedLeaderAction({ ...f.input, envelope: { ...f.input.envelope, callId: "repair-repeat" } }))
      .toThrow(/preserve its original call identity/);
    f.release(); expect(f.recover().status).toBe("withdrawn"); expect(f.database.workflowAdjustments("p")).toHaveLength(1);
    expect(f.database.projectState("p").workflowRevision).toBe(1);
  });

  it("permits the manager's explicit new proposal in its next legitimate task without permanently locking a withdrawn field", async () => {
    const f = await adjustmentFixture(); f.stage(); f.database.withdrawWorkflowAdjustment({ projectId: "p", requestId: f.requestId, operationId: "withdraw" }); f.release();
    const claim = f.database.claimScopedLeaderTurn({ projectId: "p", groupRunId: "run-G", agentId: "review", invocationId: "leader-two", runtimePath: join(f.root, "runtime", "leader-two") })!;
    const authority = { projectId: "p", groupRunId: "run-G", agentId: "review", invocationId: "leader-two", coordinatorEpoch: claim.coordinatorEpoch };
    f.database.markScopedLeaderOpened(authority);
    const envelope = { ...f.input.envelope, invocationId: "leader-two", stateVersion: claim.coordinatorEpoch };
    f.database.recordScopedLeaderTaskCompletion({ ...authority, envelope: { ...envelope, callId: "new-finish", action: { tool: "finish_task", summary: "New task's own completion" } } });
    const input = { ...f.input, ...authority, envelope };
    f.database.revalidateScopedLeaderAction(input);
    expect(f.database.acceptScopedLeaderAction({ ...input, residentStopConfirmed: true }).workflowAdjustment?.status).toBe("applied");
    expect(f.database.workflowAdjustments("p").map(record => record.status)).toEqual(["withdrawn", "applied"]);
  });

});
