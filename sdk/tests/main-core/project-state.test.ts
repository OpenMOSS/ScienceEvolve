import { pathToFileURL as sdkFixtureFileURL } from "node:url";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { ControlActionService, startControlActionBridge } from "../../src/core/orchestration-control-bridge.js";
import { toolsFor } from "../../src/core/orchestration-control-mcp.js";
import { controlResultReceipts, controlResultMarker, type ControlResultContext } from "../../src/core/control-result-receipts.js";
import { afterEach, describe, expect, it } from "vitest";
import { CollaborationStateDatabase } from "../../src/core/collaboration-state/store.js";
import { legacyWriterFixture, openUpgradedFixture } from "./helpers/legacy-writer-fixture.js";
import { COLLABORATION_STATE_SCHEMA_VERSION } from "../../src/core/collaboration-state/contracts.js";
import { cloneAgentOrchestrationTemplate } from "../../src/core/agent-orchestration.js";
import { normalizeAgentOrchestrationTemplate } from "../../src/core/validation.js";
import { deriveProjectRuntimeProjection } from "../../src/core/collaboration-runtime.js";
import type { ProjectStateEntry, ProjectStatePrincipal, ProjectStateRef } from "../../src/core/project-state.js";
import { ProjectStateReadSnapshots } from "../../src/core/project-state-read-snapshots.js";

const roots: string[] = [], stores: CollaborationStateDatabase[] = [];
afterEach(async () => { for (const db of stores.splice(0)) db.close(); await Promise.all(roots.splice(0).map(p => rm(p, { recursive: true, force: true }))); });

async function fixture(sharedWorker = false, extraAgents = 0) {
  const root = await mkdtemp(join(tmpdir(), "openfars-project-state-")); roots.push(root);
  const options = { databasePath: join(root, "state.sqlite"), serviceId: "state-test", hostId: "test", instanceId: "one",
    topology: "single-host" as const, now: () => 1_000_000 };
  const db = CollaborationStateDatabase.open(options); stores.push(db);
  const draft = cloneAgentOrchestrationTemplate();
  const edge = (target: string) => ({ kind: "strong" as const, target });
  for (let index = 0; index < extraAgents; index++) {
    const name = `extra_${index}`;
    draft.agents.push({ ...draft.agents[0], name }); draft.routes[name] = [edge("main")];
  }
  draft.schemaVersion = 3;
  draft.collaborations = ["G", "H", "I", "J"].map(id => ({ id, displayName: id, memberAgentIds: [], renamePolicy: "editable" as const }));
  draft.routes.G = [edge("main")];
  draft.scopedWorkflow = { schemaVersion: 1, rootAgentIds: draft.agents.map(a => a.name), groups: [
    { id: "G", leaderAgentId: "review", allowLeaderReconfiguration: false, workflow: {
      nodes: [{ kind: "agent", nodeId: "G_idea", agentId: "idea" }, { kind: "collaboration", nodeId: "G_H", groupId: "H" },
        { kind: "collaboration", nodeId: "G_J", groupId: "J" }],
      input: { source: "input", edges: ["G_idea", "G_H", "G_J"].map(target => ({ kind: "parallel" as const, target })) },
      routes: { G_idea: [edge("finish")], G_H: [edge("finish")], G_J: [edge("finish")] } } },
    { id: "H", parentGroupId: "G", leaderAgentId: sharedWorker ? "idea" : "main", allowLeaderReconfiguration: false, workflow: {
      nodes: [{ kind: "collaboration", nodeId: "H_I", groupId: "I" }], input: { source: "input", edges: [{ kind: "parallel", target: "H_I" }] }, routes: { H_I: [edge("finish")] } } },
    { id: "I", parentGroupId: "H", leaderAgentId: "writing", allowLeaderReconfiguration: false, workflow: {
      nodes: [{ kind: "agent", nodeId: "I_execution", agentId: "execution" }], input: { source: "input", edges: [{ kind: "parallel", target: "I_execution" }] }, routes: { I_execution: [edge("finish")] } } },
    { id: "J", parentGroupId: "G", leaderAgentId: "writing", allowLeaderReconfiguration: false, workflow: {
      nodes: [{ kind: "agent", nodeId: "J_execution", agentId: "execution" }], input: { source: "input", edges: [{ kind: "parallel", target: "J_execution" }] }, routes: { J_execution: [edge("finish")] } } }
  ] };
  const workflow = normalizeAgentOrchestrationTemplate(draft);
  for (const projectId of ["p", "other"]) db.createProject({ projectId, workflowRevision: 1, workflowSnapshot: workflow,
    git: { enabled: true, status: "ready" }, workerCapacity: 4 });
  const g = db.activateScopedGroup({ projectId: "p", groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G", workflowRevision: 1,
    baseCommit: "a".repeat(40), outer: { nodeRunId: "node-G", inputSnapshotRef: "input:p", activatedByAgentId: "main" } });
  const child = (parentGroupRunId: string, groupId: string) => {
    const a = db.projectState("p").scopedArrivals!.find(a => a.groupRunId === parentGroupRunId && a.childGroupId === groupId)!;
    return db.activateScopedGroup({ projectId: "p", groupRunId: `run-${groupId}`, groupId, activationRequestId: a.requestId,
      parentGroupRunId, parentArrivalRequestId: a.requestId, workflowRevision: 1, baseCommit: "a".repeat(40) });
  };
  child("run-G", "H"); child("run-H", "I"); child("run-G", "J");
  const system: ProjectStatePrincipal = { kind: "system", projectId: "p", source: "fixture-observation" };
  const lead = (groupRunId: string, agentId: string, invocationId: string) => {
    const claim = db.claimScopedLeaderTurn({ projectId: "p", groupRunId, agentId, invocationId, runtimePath: join(root, "runtime", invocationId) })!;
    expect(claim).toBeDefined();
    const identity = { projectId: "p", groupRunId, agentId, invocationId, coordinatorEpoch: claim.coordinatorEpoch };
    db.markScopedLeaderOpened(identity);
    return { identity, principal: { kind: "agent" as const, projectId: "p", agentId, invocationId } };
  };
  return { db, root, options, workflow, g, system, lead };
}

function read(db: CollaborationStateDatabase, principal: ProjectStatePrincipal, object: ProjectStateRef): ProjectStateEntry {
  return db.projectStateRequest(principal, { operation: "get", object }) as ProjectStateEntry;
}
function patch(db: CollaborationStateDatabase, principal: ProjectStatePrincipal, object: ProjectStateRef, set: Record<string, unknown>, callId = "change") {
  return db.projectStateRequest(principal, { operation: "patch", object, expectedVersion: read(db, principal, object).version,
    set, callId, reason: "Record measured progress without changing system facts" }) as { current: ProjectStateEntry; sequence: number; committedVersion: string; replay: boolean };
}

async function stateMcp(root: string, context: Record<string, unknown>, requests: Record<string, unknown>[]) {
  const child = spawn(process.execPath, ["--import", sdkFixtureFileURL(createRequire(import.meta.url).resolve("tsx")).href,
    fileURLToPath(new URL("../../src/core/orchestration-control-mcp.ts", import.meta.url))], {
    cwd: root, env: { ...process.env, SCIENCEEVOLVE_CONTROL_CONTEXT: JSON.stringify(context), SCIENCEEVOLVE_CONTROL_CAPABILITY: "test-state-secret" },
    stdio: ["pipe", "pipe", "pipe"]
  });
  let stdout = "", stderr = "";
  child.stdout.setEncoding("utf8"); child.stderr.setEncoding("utf8");
  child.stdout.on("data", data => { stdout += data; }); child.stderr.on("data", data => { stderr += data; });
  const finished = new Promise<void>((resolve, reject) => {
    child.once("error", reject); child.once("close", code => code === 0 ? resolve() : reject(new Error(stderr)));
  });
  child.stdin.end(requests.map(r => JSON.stringify(r)).join("\n") + "\n");
  await finished;
  return stdout.trim().split("\n").map(line => JSON.parse(line));
}

describe("unified authoritative project state", () => {
  it("returns the complete object index beyond 100 entries without loading detail bodies", async () => {
    const { db, system, workflow } = await fixture(false, 130);
    const full = db.projectStateRequest(system, { operation: "list", kind: "agent" }) as any;
    expect(full.total).toBe(workflow.agents.length); expect(full.objects).toHaveLength(workflow.agents.length);
    expect(full.objects.some(item => item.object.id === "extra_129")).toBe(true);
    expect(full.nextPage).toBeNull(); expect(full.nextOffset).toBeNull();
    for (const object of full.objects) { expect(object).not.toHaveProperty("core"); expect(object).not.toHaveProperty("extensions"); }
    const legacy = db.projectStateRequest(system, { operation: "list", kind: "agent", offset: 100, limit: 1 }) as any;
    expect(legacy.objects.map(item => item.object)).toEqual(full.objects.map(item => item.object));
    const tool = toolsFor({ projectId: "p", agent: "main", invocationId: "read", kind: "main", projectState: true, candidates: [] } as never)
      .find(tool => tool.name === "state_list")!;
    expect(tool.inputSchema.properties).not.toHaveProperty("offset"); expect(tool.inputSchema.properties).not.toHaveProperty("limit");
  });

  it("exposes the same live Git runtime as HTTP instead of a saved checkpoint's queued status", async () => {
    const { db } = await fixture();
    db.initializeProjectStateDomain({ projectId: "other", scheduler: "git", checkpoint: {
      id: "other", status: "queued", phase: "collaboration:ready", git: { enabled: true, status: "ready" },
      createdAt: "2026-10-13T00:00:00Z"
    } as never });
    const checkpoint = db.projectStateDocument("other", "project.checkpoint")!;
    const scope = { projectId: "other", nodeRunId: "live-main", agentId: "main", invocationId: "runtime-main", coordinatorEpoch: 1 };
    db.activateNode({ projectId: "other", nodeRunId: scope.nodeRunId, node: { kind: "agent", nodeId: "main", agentId: "main" },
      activationRequestId: "activate-main", inputSnapshotRef: "input:other", activatedByAgentId: "main", workflowRevision: 1 });
    db.appendEvent({ ...scope, type: "main.route.attempt", payload: { attempt: 1 } });
    db.startRuntimeActivity({ ...scope, kind: "turn", phase: "model:running" });
    const principal: ProjectStatePrincipal = { kind: "agent", projectId: "other", agentId: "main", invocationId: scope.invocationId };
    const object = { kind: "project" as const, id: "other" }, current = read(db, principal, object);
    const projection = db.projectState("other");
    expect(current.core).toMatchObject({ runtime: { status: "running", phase: "model:running", activeInvocationId: scope.invocationId, currentAgent: "main" } });
    expect((current.core as { runtime: unknown }).runtime).toEqual(deriveProjectRuntimeProjection(projection, checkpoint.value as never));
    expect(projection.formalState!.checkpoint.lifecycle).not.toHaveProperty("status");
    expect(projection.formalState!.checkpoint.lifecycle).not.toHaveProperty("activeInvocationId");
    expect(projection.formalState!.checkpoint.lifecycle.createdAt).toBe("2026-10-13T00:00:00Z");
    expect(db.projectStateDocument("other", "project.checkpoint")).toEqual(checkpoint);
    db.closeRuntimeActivity({ ...scope, kind: "turn", outcome: "completed" });
    const system: ProjectStatePrincipal = { kind: "system", projectId: "other", source: "after-original-close" };
    const stopped = read(db, system, object);
    expect((stopped.core as { runtime: { activities: unknown[]; activeInvocationId?: string } }).runtime.activities).toEqual([]);
    expect((stopped.core as { runtime: { activeInvocationId?: string } }).runtime.activeInvocationId).toBeUndefined();
    expect(stopped.version).not.toBe(current.version);
    expect(() => read(db, principal, object)).toThrow(/live invocation/);
  });

  it.each([false, true])("keeps Git project business CAS usable after real native usage accounting (registered=%s)", async (registered) => {
    const { db } = await fixture();
    if (registered) db.initializeProjectStateDomain({ projectId: "other", scheduler: "git",
      checkpoint: { id: "other", status: "queued", phase: "collaboration:ready", git: { enabled: true, status: "ready" } } as never });
    const scope = { projectId: "other", nodeRunId: "root-main", agentId: "main", invocationId: "usage-main", coordinatorEpoch: 1 };
    db.activateNode({ projectId: "other", nodeRunId: scope.nodeRunId, node: { kind: "agent", nodeId: "main", agentId: "main" },
      activationRequestId: "activate-main", inputSnapshotRef: "input:other", activatedByAgentId: "main", workflowRevision: 1 });
    db.appendEvent({ ...scope, type: "main.route.attempt", payload: { attempt: 1 } });
    db.startRuntimeActivity({ ...scope, kind: "turn", phase: "model:running" });
    const principal: ProjectStatePrincipal = { kind: "agent", projectId: "other", agentId: "main", invocationId: scope.invocationId };
    const object = { kind: "project" as const, id: "other" }, before = read(db, principal, object);
    db.appendUsage({ projectId: scope.projectId, nodeRunId: scope.nodeRunId, agentId: scope.agentId, invocationId: scope.invocationId,
      usageId: "native-next-model-request", inputTokens: 100, cachedInputTokens: 20, outputTokens: 10, totalTokens: 110 });
    const after = read(db, principal, object);
    expect(after.core).toMatchObject({ usage: [{ usageId: "native-next-model-request", totalTokens: 110 }] });
    expect(after.projectRevision).toBeGreaterThan(before.projectRevision);
    if (registered) expect(after.core).toMatchObject({ runtime: { stateRevision: after.projectRevision } });
    const result = db.projectStateRequest(principal, { operation: "patch", object, expectedVersion: before.version,
      set: { acceptance_input: { values: [2, 3], expected: 5 } }, reason: "Original Main uses its observed business version", callId: "after-native-usage" }) as { current: ProjectStateEntry };
    expect(after.version).toBe(before.version);
    expect(result).toMatchObject({ current: { extensions: { acceptance_input: { values: [2, 3], expected: 5 } } } });
    expect(() => db.projectStateRequest(principal, { operation: "patch", object, expectedVersion: before.version,
      set: { stale: true }, reason: "A real extension commit must still fence an old version", callId: "stale-after-commit" })).toThrow(/State object changed/);
    db.closeRuntimeActivity({ ...scope, kind: "turn", outcome: "completed" });
    const system: ProjectStatePrincipal = { kind: "system", projectId: "other", source: "fixture-observation" };
    expect(read(db, system, object).version).not.toBe(result.current.version);
    expect(() => db.projectStateRequest(system, { operation: "patch", object, expectedVersion: result.current.version,
      set: { stale: true }, reason: "A real runtime boundary change must retain its fence", callId: "stale-after-native-close" })).toThrow(/State object changed/);
    expect(() => read(db, principal, object)).toThrow(/live invocation/);
  });

  it("keeps an experiment's original ownership epoch when its logical task is retried, without granting the new Worker writes to the old result", async () => {
    const { db, g, root } = await fixture();
    db.initializeProjectStateDomain({ projectId: "p", scheduler: "git", checkpoint: { id: "p", status: "queued", git: { enabled: true, status: "ready" } } as never });
    const arrival = g.arrivals.find(a => a.agentId === "idea")!;
    const e = db.claimScopedAgentArrival({ projectId: "p", arrivalRequestId: arrival.requestId, agentId: "idea", executionId: "scope-owner",
      worktreePath: join(root, "git-worktrees", "agents", "idea") }).execution;
    const first = { projectId: "p", executionId: e.id, ownershipEpoch: 1, invocationId: "original-worker" };
    db.beginScopedAgentTurn({ ...first, runtimePath: join(root, "runtime", first.invocationId), baseCommit: "a".repeat(40) });
    db.markScopedAgentTurnOpened({ ...first, nativeProcessOpened: true });
    const doc = db.projectStateDocument("p", "sii.ledger")!;
    db.writeProjectStateDocument("p", "sii.ledger", { version: 1, waits: [], experiments: [{ id: "original-experiment", agent: "idea", taskId: e.id,
      owner: `idea\0${e.id}`, status: "running", scope: { projectId: "p", invocationId: first.invocationId, executionId: e.id,
        ownershipEpoch: 1, groupRunId: "run-G" } }] }, doc.version);
    const object = { kind: "experiment" as const, id: "original-experiment" };
    const worker = { kind: "agent" as const, projectId: "p", agentId: "idea", invocationId: first.invocationId };
    expect(read(db, worker, object).access.canWrite).toBe(true);
    db.stopScopedAgentTurn({ ...first, residentStopConfirmed: true });
    db.failScopedAgentArrival({ ...first, arrivalRequestId: arrival.requestId, reason: "Controlled original native failure", residentStopConfirmed: true });
    db.retryScopedAgentArrival({ projectId: "p", executionId: e.id, arrivalRequestId: arrival.requestId, failedOwnershipEpoch: 1 });
    const next = { ...first, ownershipEpoch: 2, invocationId: "retried-worker" };
    db.beginScopedAgentTurn({ ...next, runtimePath: join(root, "runtime", next.invocationId), baseCommit: "a".repeat(40) });
    db.markScopedAgentTurnOpened({ ...next, nativeProcessOpened: true });
    const currentWorker = { ...worker, invocationId: next.invocationId }, actual = read(db, currentWorker, object);
    expect(actual.core).toMatchObject({ scope: { ownershipEpoch: 1, invocationId: first.invocationId } });
    expect(actual.access.canWrite).toBe(false);
    expect(() => db.projectStateRequest(currentWorker, { operation: "patch", object, expectedVersion: actual.version,
      set: { ownershipEpoch: 2, completed: true }, reason: "Cannot claim the old experiment", callId: "old-epoch" })).toThrow(/responsible Leader/);
    expect(() => read(db, worker, object)).toThrow(/live invocation/);
  });

  it("exposes the same immutable original tool return and its separately proven Session reception", async () => {
    const { db, system } = await fixture();
    const context: ControlResultContext = { projectId: "p", agentId: "idea", invocationId: "original-tool-turn",
      session: { schemaVersion: 1, harnessId: "codex", adapterVersion: "1", generation: 0, nativeId: "original-session",
        durable: true, createdAt: "2026-10-13T00:00:00.000Z" },
      executionContext: { role: "delivery", nodeRunId: "node-G", groupRunId: "run-G", executionId: "original-execution", ownershipEpoch: 1 } };
    const receipts = controlResultReceipts(db, context);
    const result = { status: "outcome_unknown", operationId: "original-merge", error: "Provider connection lost" };
    const id = receipts.record({ requestedCallId: "original-call", envelope: { projectId: "p", agent: "idea",
      invocationId: context.invocationId, callId: "original-call", stateVersion: 1, receivedAt: context.session.createdAt,
      action: { tool: "github_merge_pr", providerNumber: 1 } }, result });
    const object = { kind: "receipt" as const, id };
    const before = read(db, system, object);
    expect(before.core).toMatchObject({ receipt: { result, session: context.session }, received: null });
    patch(db, system, object, { main_assessment: "Evidence still unknown", delivered: true });
    expect(read(db, system, object).core).toEqual(before.core);
    const tool = { callId: "native-call", name: "github_merge_pr", server: "openfars-resident-control", toolType: "mcp", input: JSON.stringify({ callId: "original-call" }) };
    receipts.observeNative({ invocationId: context.invocationId, harnessId: "codex", eventId: "native-start", kind: "tool.started", tool });
    receipts.observeNative({ invocationId: context.invocationId, harnessId: "codex", eventId: "native-completed", kind: "tool.completed",
      tool: { ...tool, outputPreview: controlResultMarker(id) } });
    const after = read(db, system, object);
    expect(after.core).toMatchObject({ receipt: { result }, received: { receiptId: id } });
    expect(after.version).not.toBe(before.version);
  });
  it("transports real reads, commits and exact scope/version errors through the authenticated MCP bridge without staging business decisions", async () => {
    const { db, root, lead, system } = await fixture();
    const child = lead("run-H", "main", "child");
    const object = { kind: "group" as const, id: "run-I" }, original = read(db, child.principal, object);
    const service = new ControlActionService({ projectId: "p", agent: "main", invocationId: "child", stateVersion: 1,
      capability: "test-state-secret", stagingPath: join(root, "actions.json"), revalidate: async () => {},
      projectState: request => db.projectStateRequest(child.principal, request) });
    const bridge = await startControlActionBridge(service, root);
    const context = { projectId: "p", agent: "main", invocationId: "child", kind: "main", stateVersion: 1,
      projectState: true, candidates: [], decisionBy: "main", canComplete: false, allowUserIntervention: false,
      stagingPath: join(root, "actions.json"), workspacePath: root, bridgePath: bridge.endpoint.path,
      bridgeHost: bridge.endpoint.host, bridgePort: bridge.endpoint.port, requireBridge: true };
    const call = (id: number, name: string, args: unknown = {}) => ({ id, method: "tools/call", params: { name, arguments: args } });
    try {
      const responses = await stateMcp(root, context, [
        { id: 1, method: "tools/list" }, call(2, "state_get", { object }),
        call(3, "state_patch", { object, expectedVersion: original.version, set: { science_phase: { step: 2 } }, callId: "progress", reason: "Current evidence" }),
        call(4, "state_patch", { object, expectedVersion: original.version, set: { science_phase: 3 }, callId: "stale", reason: "Older observation" }),
        call(5, "state_get", { object: { kind: "group", id: "run-J" } }),
        call(6, "state_patch", { object: { kind: "group", id: "run-J" }, expectedVersion: read(db, system, { kind: "group", id: "run-J" }).version,
          set: { forged: true }, callId: "out-of-scope", reason: "Must be denied" }),
        call(7, "state_list", { projectId: "other", role: "main" }),
        call(8, "state_get", { object }),
      ]);
      expect(responses[0].result.tools.map((t: { name: string }) => t.name)).toEqual(expect.arrayContaining(["state_list", "state_get", "state_patch"]));
      expect(responses[1].result.structuredContent.access).toMatchObject({ role: "leader", canWrite: true });
      expect(responses[2].result.structuredContent.current.extensions).toEqual({ science_phase: { step: 2 } });
      const current = read(db, system, object);
      expect(responses[3].result.isError).toBe(true);
      expect(JSON.stringify(responses[3].result)).toContain("STALE_STATE_VERSION");
      expect(JSON.stringify(responses[3].result)).toContain(current.version);
      const staleError = JSON.parse(responses[3].result.content[0].text).error;
      expect(staleError.currentRevision).toBe(staleError.stateDetails.projectRevision);
      expect(staleError.invalidField).toBeUndefined(); expect(staleError.authoritativeFiles).toBeUndefined();
      expect(responses[4].result.structuredContent.access.canWrite).toBe(false);
      expect(responses[5].result.isError).toBe(true);
      expect(JSON.stringify(responses[5].result)).toContain("STATE_SCOPE_DENIED");
      const scopeError = JSON.parse(responses[5].result.content[0].text).error;
      expect(scopeError.currentRevision).toBeUndefined(); expect(scopeError.authoritativeFiles).toBeUndefined();
      expect(responses[6].result.isError).toBe(true);
      expect(responses[7].result.structuredContent.extensions).toEqual(current.extensions);
      service.revoke();
      const revoked = await stateMcp(root, context, [call(9, "state_get", { object })]);
      expect(revoked[0].result.isError).toBe(true); expect(JSON.stringify(revoked)).toContain("revoked");
      const withoutState = { ...context, projectState: false };
      expect(toolsFor({ ...withoutState, secret: "test-state-secret" } as never).some(t => t.name.startsWith("state_"))).toBe(false);
      const hidden = await stateMcp(root, withoutState, [call(10, "state_get", { object })]);
      expect(hidden[0].result.isError).toBe(true);
      expect(db.projectState("p").scopedAgentTaskCompletions).toEqual([]);
    } finally { await bridge.close(); }
  });
  it("persists arbitrary business fields in the shared journal without satisfying finish, PR, Memory or routing gates", async () => {
    const { db, system, options } = await fixture(); const object = { kind: "group" as const, id: "run-I" };
    const before = db.projectState("p");
    const result = patch(db, system, object, { analysis_stage: "review", processed_count: 7,
      arbitrary: { samples: [null, 3, "ok"], flag: true }, completed: true, pr_submitted: true });
    expect(result.current.extensions).toMatchObject({ processed_count: 7, completed: true });
    expect(result.current.version).toBe(result.committedVersion);
    const after = db.projectState("p");
    expect(after.scopedGroupRuns).toEqual(before.scopedGroupRuns);
    expect(after.routeOutbox).toEqual(before.routeOutbox);
    expect(after.scopedAgentTaskCompletions).toEqual(before.scopedAgentTaskCompletions);
    expect(after.scopedAgentReports).toEqual(before.scopedAgentReports);
    expect(after.scopedPullRequests).toEqual(before.scopedPullRequests);
    expect(after.businessState?.[0]).toMatchObject({ object, extensions: result.current.extensions });
    const lease = db.writerLease(); db.close();
    const restarted = CollaborationStateDatabase.open(options); stores.push(restarted);
    expect(read(restarted, system, object).version).toBe(result.current.version);
    expect(read(restarted, system, object).extensions).toEqual(result.current.extensions);
  });

  it("allows full project reads and parent Leader writes to all descendants; a child Leader cannot write parents or siblings even when named main", async () => {
    const { db, system, lead } = await fixture();
    const parent = lead("run-G", "review", "parent");
    expect(read(db, parent.principal, { kind: "group", id: "run-I" }).access).toMatchObject({ role: "leader", canWrite: true });
    patch(db, parent.principal, { kind: "group", id: "run-I" }, { parent_note: "measured" });
    db.releaseScopedLeaderTurn({ ...parent.identity, residentStopConfirmed: true });
    const child = lead("run-H", "main", "child");
    expect(read(db, child.principal, { kind: "group", id: "run-I" }).access.canWrite).toBe(true);
    for (const id of ["run-G", "run-J"]) {
      expect(read(db, child.principal, { kind: "group", id }).access).toMatchObject({ role: "leader", canWrite: false });
      expect(() => patch(db, child.principal, { kind: "group", id }, { forged: true })).toThrow(/responsible Leader/);
    }
    const own = read(db, child.principal, { kind: "group", id: "run-I" });
    patch(db, system, own.object, { measured: 2 });
    expect(() => db.projectStateRequest(child.principal, { operation: "patch", object: own.object,
      expectedVersion: own.version, set: { measured: 3 }, reason: "Based on old input", callId: "stale" })).toThrow(/State object changed/);
    expect(read(db, system, own.object).extensions.measured).toBe(2);
    expect(() => read(db, parent.principal, own.object)).toThrow(/live invocation/);
  });

  it("binds Worker writes to its own identity, current task and execution epoch, with project-wide read access", async () => {
    const { db, system, g, root } = await fixture();
    const arrival = g.arrivals.find(a => a.agentId === "idea")!;
    const e = db.claimScopedAgentArrival({ projectId: "p", arrivalRequestId: arrival.requestId, agentId: "idea", executionId: "exec-idea",
      worktreePath: join(root, "git-worktrees", "agents", "idea") }).execution;
    const identity = { projectId: "p", executionId: e.id, ownershipEpoch: 1, invocationId: "worker" };
    db.beginScopedAgentTurn({ ...identity, runtimePath: join(root, "runtime", "worker"), baseCommit: "a".repeat(40) });
    db.markScopedAgentTurnOpened({ ...identity, nativeProcessOpened: true });
    const worker: ProjectStatePrincipal = { kind: "agent", projectId: "p", agentId: "idea", invocationId: "worker" };
    patch(db, worker, { kind: "agent", id: "idea" }, { analysis_stage: "measured" });
    patch(db, worker, { kind: "execution", id: e.id }, { processed_count: 6 }, "execution-progress");
    patch(db, worker, { kind: "task", id: arrival.requestId }, { observed: true }, "task-progress");
    expect(read(db, worker, { kind: "group", id: "run-J" }).access.canWrite).toBe(false);
    expect(() => patch(db, worker, { kind: "agent", id: "main" }, { role: "main" })).toThrow(/responsible Leader/);
    expect(() => patch(db, worker, { kind: "project", id: "p" }, { completed: true })).toThrow(/responsible Leader/);
    expect(() => db.projectStateRequest(worker, { operation: "get", object: { kind: "project", id: "other" } })).toThrow(/not registered/);
    expect(() => db.projectStateRequest(worker, { operation: "list", projectId: "other", role: "main" })).toThrow(/server-owned/);
    db.stopScopedAgentTurn({ ...identity, residentStopConfirmed: true });
    expect(() => read(db, worker, { kind: "group", id: "run-J" })).toThrow(/live invocation/);
    expect(read(db, system, { kind: "agent", id: "idea" }).extensions.analysis_stage).toBe("measured");
  });

  it("returns exact immutable history and enforces object concurrency and replay without overwriting another writer", async () => {
    const { db, system, options } = await fixture(); const object = { kind: "agent" as const, id: "idea" };
    const original = read(db, system, object);
    const request = { operation: "patch", object, expectedVersion: original.version, set: { progress: 1 }, callId: "first", reason: "First observation" };
    const first = db.projectStateRequest(system, request) as { sequence: number };
    const second = patch(db, system, object, { progress: 2 }, "second");
    expect(db.projectStateRequest(system, request)).toMatchObject({ replay: true, sequence: first.sequence, current: { extensions: { progress: 2 } } });
    expect(() => db.projectStateRequest(system, { ...request, callId: "competing", set: { progress: 3 } })).toThrow(/State object changed/);
    expect(() => db.projectStateRequest(system, { ...request, set: { progress: 3 } })).toThrow(/callId/);
    const full = db.projectStateRequest(system, { operation: "get", object, historyLimit: 1 }) as { history: Array<{ change: { reason: string } }>; historyTotal: number; historyNextOffset: number };
    expect(full.historyTotal).toBe(2); expect(full.historyNextOffset).toBe(1);
    expect(full.history[0].change.reason).toBe("Record measured progress without changing system facts");
    const raw = new DatabaseSync(options.databasePath);
    try { expect(() => raw.prepare("UPDATE project_events SET payload_json='{}' WHERE project_id='p' AND seq=?").run(second.sequence)).toThrow(); }
    finally { raw.close(); }
  });

  it("rejects core patches, forged identities, non-JSON, credentials and prototype keys without advancing the project revision", async () => {
    const { db, system } = await fixture(); const object = { kind: "agent" as const, id: "idea" }, original = read(db, system, object);
    const base = { operation: "patch", object, expectedVersion: original.version, reason: "Invalid requests", callId: "invalid", set: { valid: true } };
    for (const extra of [{ core: { status: "completed" } }, { owner: "main" }, { projectId: "other" }, { role: "main" },
      { set: { invalid: NaN } }, { set: { password: "secret" } }, { set: JSON.parse('{"__proto__":{"admin":true}}') }]) {
      expect(() => db.projectStateRequest(system, { ...base, ...extra })).toThrow();
      expect(db.projectState("p").stateRevision).toBe(original.projectRevision);
    }
    expect(() => read(db, { kind: "agent", projectId: "p", agentId: "main", invocationId: "invented" }, object)).toThrow(/live invocation/);
  });

  it("returns a fresh complete index after a formal transition while preserving strict object write CAS", async () => {
    const { db, system, g, root } = await fixture();
    const page = db.projectStateRequest(system, { operation: "list", kind: "group", limit: 2 }) as { projectRevision: number; total: number; nextOffset: number };
    expect(page.total).toBe(4); expect(page.nextOffset).toBeNull();
    const arrival = g.arrivals.find(a => a.agentId === "idea")!;
    const object = { kind: "task" as const, id: arrival.requestId }, before = read(db, system, object);
    db.claimScopedAgentArrival({ projectId: "p", arrivalRequestId: arrival.requestId, agentId: "idea", executionId: "claimed",
      worktreePath: join(root, "git-worktrees", "agents", "idea") });
    const current = db.projectStateRequest(system, { operation: "list", kind: "group", offset: 2, expectedRevision: page.projectRevision }) as any;
    expect(current.objects).toHaveLength(4); expect(current.projectRevision).toBeGreaterThan(page.projectRevision);
    const after = read(db, system, object);
    expect(after.version).not.toBe(before.version);
    expect(() => db.projectStateRequest(system, { operation: "patch", object, expectedVersion: before.version,
      set: { stale: true }, reason: "Based on the old queued task", callId: "stale-core" })).toThrow(/State object changed/);
    expect(after.core).toMatchObject({ status: "running" });
  });

  it("reads the latest complete index with old prompt revisions and optional empty read fields", async () => {
    const { db, system } = await fixture();
    const original = db.projectState("p").stateRevision;
    db.appendEvent({ projectId: "p", type: "agent.trace", payload: { kind: "tool.started", name: "state_list" } });
    for (const expectedRevision of [original, 0, null, undefined]) {
      const page = db.projectStateRequest(system, { operation: "list", kind: "project", expectedRevision, limit: null, snapshotId: "" }) as any;
      expect(page.projectRevision).toBeGreaterThan(original);
      expect(page.objects[0].object).toEqual({ kind: "project", id: "p" });
      expect(page.currentProjectRevision).toBe(page.projectRevision);
      if (expectedRevision === original) expect(page.notice).toContain("latest");
    }
    const revision = db.projectState("p").stateRevision;
    db.projectStateRequest(system, { operation: "list" });
    expect(db.projectState("p").stateRevision).toBe(revision);
  });

  it("keeps explicit complete index snapshots stable while preserving fresh object CAS", async () => {
    const { db, system } = await fixture();
    const page = db.projectStateRequest(system, { operation: "list", kind: "group", limit: 2 }) as any;
    expect(page.objects).toHaveLength(4); expect(page.nextPage).toBeNull();
    const object = { kind: "group" as const, id: "run-I" }, before = read(db, system, object);
    patch(db, system, object, { measured_progress: 2 });
    db.appendEvent({ projectId: "p", type: "agent.trace", payload: { kind: "tool.completed", name: "state_list" } });
    const next = db.projectStateRequest(system, { operation: "list", kind: "group", snapshotId: page.snapshotId, offset: 2, limit: 2 }) as any;
    expect(next.objects.map(item => item.object.id)).toEqual(["run-G", "run-H", "run-I", "run-J"]);
    expect(next.projectRevision).toBe(page.projectRevision);
    expect(next.currentProjectRevision).toBeGreaterThan(page.projectRevision);
    expect(next.objects.find(item => item.object.id === "run-I").version).toBe(before.version);
    expect(next.nextPage).toBeNull();
    const fresh = read(db, system, object);
    expect(fresh.version).not.toBe(before.version);
    expect(() => db.projectStateRequest(system, { operation: "patch", object, expectedVersion: before.version,
      set: { stale: true }, callId: "from-old-list", reason: "A read snapshot must not bypass a real write conflict" })).toThrow(/State object changed/);
  });

  it("binds complete index snapshots to the original project/principal and rechecks live authority", async () => {
    const { db, lead, system } = await fixture();
    const parent = lead("run-G", "review", "snapshot-owner");
    const page = db.projectStateRequest(parent.principal, { operation: "list", kind: "group", limit: 1 }) as any;
    const sameIndex = { operation: "list", kind: "group", snapshotId: page.snapshotId };
    expect(() => db.projectStateRequest(system, sameIndex)).toThrow(/snapshot is unavailable/);
    expect(() => db.projectStateRequest({ ...system, projectId: "other" }, sameIndex)).toThrow(/snapshot is unavailable/);
    expect(() => db.projectStateRequest(parent.principal, { ...sameIndex, kind: "agent" })).toThrow(/original kind/);
    db.releaseScopedLeaderTurn({ ...parent.identity, residentStopConfirmed: true });
    expect(() => db.projectStateRequest(parent.principal, sameIndex)).toThrow(/live invocation/);
    expect(db.projectStateRequest(system, { operation: "list", kind: "group", offset: 1 })).toMatchObject({ total: 4, offset: 0, nextPage: null });
  });

  it("returns an actionable fresh-read instruction after snapshot expiry or a service restart", async () => {
    const { db, system, options } = await fixture();
    let now = 1;
    const cache = new ProjectStateReadSnapshots(() => now, 10);
    const snapshot = cache.capture(system, "group", 1, []);
    now = 11;
    expect(() => cache.read(snapshot.id, system)).toThrow(/Start a fresh state_list/);
    const page = db.projectStateRequest(system, { operation: "list", kind: "group", limit: 1 }) as any;
    db.close();
    const restarted = CollaborationStateDatabase.open(options); stores.push(restarted);
    try { restarted.projectStateRequest(system, { operation: "list", kind: "group", snapshotId: page.snapshotId }); throw Error("Expected expired read snapshot"); }
    catch (error: any) {
      expect(error.code).toBe("STATE_READ_SNAPSHOT_EXPIRED");
      expect(error.details.nextCall).toEqual({ tool: "state_list", arguments: { kind: "group" } });
    }
    expect(restarted.projectStateRequest(system, { operation: "list", kind: "group" })).toMatchObject({ total: 4 });
  });

  it("omits history on request and pages immutable history without hiding the current object version", async () => {
    const { db, system } = await fixture(); const object = { kind: "agent" as const, id: "idea" };
    patch(db, system, object, { progress: 1 }, "one");
    patch(db, system, object, { progress: 2 }, "two");
    expect(db.projectStateRequest(system, { operation: "get", object })).toMatchObject({
      history: [], historyTotal: 2, historyNextOffset: null, nextHistoryPage: null });
    const first = db.projectStateRequest(system, { operation: "get", object, historyLimit: 1 }) as any;
    patch(db, system, object, { progress: 3 }, "three");
    const next = db.projectStateRequest(system, { operation: "get", ...first.nextHistoryPage }) as any;
    expect(next.history.map(entry => entry.change.extensions.progress)).toEqual([1]);
    expect(next.historyTotal).toBe(2); expect(next.nextHistoryPage).toBeNull();
    expect(next.extensions.progress).toBe(3); expect(next.version).not.toBe(first.version);
    const facts = db.projectStateRequest(system, { operation: "get", object, historyLimit: 0, historyOffset: null }) as any;
    expect(facts).toMatchObject({ extensions: { progress: 3 }, history: [], historyTotal: 3, historyNextOffset: null, nextHistoryPage: null });
    expect(db.projectStateRequest(system, { operation: "get", object, historyLimit: null })).toMatchObject({ historyTotal: 3 });
    expect(() => db.projectStateRequest(system, { operation: "get", object, historyLimit: 1, historyThroughSequence: Number.MAX_SAFE_INTEGER }))
      .toThrow(/ahead of the current journal/);
  });

  it("transports exact ID suggestions and numeric recovery hints through the actual MCP", async () => {
    const { db, root, lead } = await fixture(); const parent = lead("run-G", "review", "read-hints");
    const service = new ControlActionService({ projectId: "p", agent: "review", invocationId: "read-hints", stateVersion: 1,
      capability: "test-state-secret", stagingPath: join(root, "read-actions.json"), revalidate: async () => {},
      projectState: request => db.projectStateRequest(parent.principal, request) });
    const bridge = await startControlActionBridge(service, root);
    const context = { projectId: "p", agent: "review", invocationId: "read-hints", kind: "worker", stateVersion: 1,
      projectState: true, candidates: [], decisionBy: "main", canComplete: false, allowUserIntervention: false,
      stagingPath: join(root, "read-actions.json"), workspacePath: root, bridgePath: bridge.endpoint.path,
      bridgeHost: bridge.endpoint.host, bridgePort: bridge.endpoint.port, requireBridge: true };
    const call = (id: number, name: string, args: unknown) => ({ id, method: "tools/call", params: { name, arguments: args } });
    try {
      const replies = await stateMcp(root, context, [
        call(1, "state_get", { object: { kind: "project", id: "project" } }),
        call(2, "state_get", { object: { kind: "project", id: "p" }, historyLimit: 200 }),
        call(3, "state_get", { object: { kind: "project", id: "p" }, historyLimit: 0 }),
        call(4, "state_list", { expectedRevision: 0, kind: "project" }),
        call(5, "state_list", { expectedRevision: 1, kind: "project" }),
        call(6, "state_list", { limit: 200 })
      ]);
      expect(replies[0].result.structuredContent.error).toMatchObject({ code: "RECORD_NOT_FOUND", invalidField: "object",
        stateDetails: { availableObjects: [{ kind: "project", id: "p" }], nextCall: { tool: "state_list", arguments: { kind: "project" } } } });
      expect(replies[1].result.structuredContent.error).toMatchObject({ code: "INVALID_STATE_TRANSITION", invalidField: "historyLimit", stateDetails: { minimum: 0, maximum: 100 } });
      expect(replies[1].result.content[0].text).toContain("nextHistoryPage");
      expect(replies[2].result.structuredContent).toMatchObject({ object: { kind: "project", id: "p" }, history: [], historyNextOffset: null });
      for (const reply of replies.slice(3, 5)) expect(reply.result.structuredContent).toMatchObject({ total: 1, objects: [{ object: { kind: "project", id: "p" } }] });
      const index = replies[5].result.structuredContent;
      expect(index.objects).toHaveLength(index.total); expect(index.nextPage).toBeNull();
      for (const object of index.objects) expect(object).not.toHaveProperty("core");
    } finally { await bridge.close(); }
  });

  it("migrates the index under the existing writer lease and preserves existing authoritative records", async () => {
    const { db, system, options } = await fixture();
    patch(db, system, { kind: "agent", id: "idea" }, { observed: "before-migration" });
    const lease = db.writerLease(), before = db.projectState("p"); db.close();
    const raw = new DatabaseSync(options.databasePath);
    legacyWriterFixture(raw, lease, Date.now());
    raw.exec("DROP INDEX project_state_object_changes; UPDATE collaboration_state_meta SET schema_version=22"); raw.close();
    expect(() => CollaborationStateDatabase.open({ ...options, instanceId: "other" })).toThrow();
    const unchanged = new DatabaseSync(options.databasePath, { readOnly: true });
    expect(unchanged.prepare("SELECT schema_version FROM collaboration_state_meta").get()).toMatchObject({ schema_version: 22 }); unchanged.close();
    const migrated = openUpgradedFixture(options); stores.push(migrated);
    expect(migrated.verifyHealth().schemaVersion).toBe(COLLABORATION_STATE_SCHEMA_VERSION);
    expect(migrated.projectState("p")).toEqual(before);
    expect(read(migrated, system, { kind: "agent", id: "idea" }).extensions.observed).toBe("before-migration");
  });

  it("derives project-wide Main authority from a real root turn and isolates it from other projects", async () => {
    const { db } = await fixture();
    const scope = { projectId: "other", nodeRunId: "root-main", agentId: "main", invocationId: "main-turn", coordinatorEpoch: 1 };
    db.activateNode({ projectId: "other", nodeRunId: scope.nodeRunId, node: { kind: "agent", nodeId: "main", agentId: "main" },
      activationRequestId: "activate-main", inputSnapshotRef: "input:other", activatedByAgentId: "main", workflowRevision: 1 });
    db.appendEvent({ ...scope, type: "main.route.attempt", payload: { attempt: 1 } });
    db.startRuntimeActivity({ ...scope, kind: "turn", phase: "model:running" });
    const principal: ProjectStatePrincipal = { kind: "agent", projectId: "other", agentId: "main", invocationId: "main-turn" };
    expect(read(db, principal, { kind: "agent", id: "idea" }).access).toMatchObject({ role: "main", canWrite: true });
    patch(db, principal, { kind: "project", id: "other" }, { coordination: "source evidence reviewed" });
    expect(() => read(db, principal, { kind: "project", id: "p" })).toThrow(/not registered/);
  });

  it("removes temporary Leader scope when the same Agent returns as a Worker and fences its old connection", async () => {
    const { db, g, root, lead } = await fixture(true);
    const leader = lead("run-H", "idea", "idea-leader");
    const child = { kind: "group" as const, id: "run-I" };
    patch(db, leader.principal, child, { group_progress: 1 });
    db.releaseScopedLeaderTurn({ ...leader.identity, residentStopConfirmed: true });
    const arrival = g.arrivals.find(a => a.agentId === "idea")!;
    const execution = db.claimScopedAgentArrival({ projectId: "p", arrivalRequestId: arrival.requestId, agentId: "idea", executionId: "worker-idea",
      worktreePath: join(root, "git-worktrees", "agents", "idea") }).execution;
    const identity = { projectId: "p", executionId: execution.id, ownershipEpoch: 1, invocationId: "idea-worker" };
    db.beginScopedAgentTurn({ ...identity, runtimePath: join(root, "runtime", identity.invocationId), baseCommit: "a".repeat(40) });
    db.markScopedAgentTurnOpened({ ...identity, nativeProcessOpened: true });
    const worker: ProjectStatePrincipal = { kind: "agent", projectId: "p", agentId: "idea", invocationId: identity.invocationId };
    expect(read(db, worker, child).access).toMatchObject({ role: "worker", canWrite: false });
    expect(() => patch(db, worker, child, { group_progress: 2 })).toThrow(/responsible Leader/);
    expect(() => read(db, leader.principal, child)).toThrow(/live invocation/);
    patch(db, worker, { kind: "agent", id: "idea" }, { own_progress: 2 });
  });

  it("fences old-writer state connections after explicit closure without losing extensions", async () => {
    const { db, system, options, lead } = await fixture();
    const leader = lead("run-G", "review", "old-writer-leader");
    const object = { kind: "group" as const, id: "run-I" };
    patch(db, leader.principal, object, { original: true });
    expect(() => CollaborationStateDatabase.open({ ...options, instanceId: "successor", now: () => 1_031_000 }))
      .toThrow(expect.objectContaining({ code: "WRITER_LEASE_HELD" }));
    db.relinquishWriterLease();
    expect(() => read(db, leader.principal, object)).toThrow(/writer|relinquished/i);
    db.close();
    const next = CollaborationStateDatabase.open({ ...options, instanceId: "successor", now: () => 1_031_000 }); stores.push(next);
    expect(() => read(next, leader.principal, object)).toThrow(/live invocation/);
    expect(read(next, system, object).extensions).toEqual({ original: true });
  });
});
