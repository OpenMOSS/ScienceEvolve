import { WorkflowGateSession, gateRunId, type GateRun, type GateOrigin } from "../../src/core/workflow-gate.js";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createHash } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CollaborationStateDatabase } from "../../src/core/collaboration-state/store.js";
import { ScopedWorkflowRuntime, type ScopedWorkflowGit } from "../../src/core/scoped-workflow-runtime.js";
import { ScopedAgentExecutionRunner, ScopedAgentTurnFailure, type ScopedAgentTurnInput } from "../../src/core/scoped-agent-execution.js";
import type { ScopedCollaboration, ScopedWorkflow } from "../../src/core/scoped-workflow-contract.js";
import type { GitHubPullRequestFact, GitHubRepositoryFact, RemoteMergeSyncFact } from "../../src/core/collaboration-git/contracts.js";
import type { CreatePullRequestRequest, CreateGroupFinalPullRequestRequest, MergePullRequestRequest,
  MergeGroupFinalPullRequestRequest } from "../../src/core/collaboration-git/facade.js";
import { finalizeOperation, prepareOperation } from "../../src/core/collaboration-git/operation.js";
import { ScopedRuntimeGit as RuntimeGit } from "./helpers/scoped-runtime-git.js";

const BASE = "b".repeat(40);
const NOW = "2026-09-30T00:00:00.000Z";
const repository: GitHubRepositoryFact = { provider: "github", providerId: 1, owner: "example", name: "openfars",
  private: true, defaultBranch: "main", htmlUrl: "https://github.com/example/openfars",
  cloneUrl: "https://github.com/example/openfars.git", observedAt: NOW };
const agentNames = ["one", "two", "three", "four", "five"];
const agent = (scope: string, name: string) => ({ kind: "agent" as const, nodeId: `${scope}_${name}`, agentId: name });
const edge = (target: string) => ({ kind: "strong" as const, target });
const entrance = (...targets: string[]) => ({ source: "input" as const,
  edges: targets.map((target) => ({ kind: "parallel" as const, target })) });
const definition = (id: string, workflow: ScopedWorkflow, parentGroupId?: string): ScopedCollaboration => ({
  id, parentGroupId, leaderAgentId: "main", allowLeaderReconfiguration: false, workflow
});
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => { resolve = done; });
  return { promise, resolve };
}
const roots: string[] = [];
const databases: CollaborationStateDatabase[] = [];
afterEach(async () => {
  databases.splice(0).forEach((database) => database.close());
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

function definitions(options: { fifo?: boolean; nested?: boolean; shared?: boolean; depth3?: boolean; weak?: boolean; childWeak?: boolean;
  loop?: boolean; loopPaths?: boolean; loopBatch?: boolean; gate?: "code" | "agent" | "decision"; gateLoop?: boolean; gateSources?: boolean }) {
  if (options.gate) return [definition("G", {
    nodes: [...(options.gate === "code" ? [agent("G", "one"), ...(options.gateSources ? [agent("G", "two")] : [])] : []), { kind: "gate", nodeId: "quality", gateId: "quality" }, agent("G", "four"), agent("G", "five")],
    input: entrance(options.gate === "code" ? "G_one" : "quality", ...(options.gateSources ? ["G_two"] : [])),
    routes: { ...(options.gate === "code" ? { G_one: [edge("quality")] } : {}), ...(options.gateSources ? { G_two: [edge("quality")] } : {}),
      quality: options.gateLoop ? [edge("G_four")] : [{ kind: "weak", target: "G_four" }, { kind: "weak", target: "G_five" }],
      G_four: [edge(options.gateLoop ? "G_one" : "finish")], G_five: [edge("finish")] },
    ...(options.gateLoop ? { loops: [{ id: "repeat", from: "G_four", to: "G_one", maxIterations: 2, exitTo: "G_five" }] } : {})
  })];
  if (options.loop || options.loopPaths || options.loopBatch) return [definition("G", {
    nodes: ["one", "two", "three", ...(options.loopPaths ? ["four"] : [])].map((name) => agent("G", name)),
    input: entrance("G_one", ...(options.loopPaths ? ["G_four"] : [])),
    routes: { G_one: [edge("G_two")], G_two: [edge("G_one")],
      G_three: options.loopBatch ? [{ kind: "weak", target: "G_one" }, { kind: "weak", target: "finish" }] : [edge("finish")],
      ...(options.loopPaths ? { G_four: [edge("G_one")] } : {}) },
    loops: [{ id: "cycle", from: "G_two", to: "G_one", maxIterations: 2, exitTo: "G_three" }]
  })];
  if (options.fifo) return [definition("G", { nodes: [agent("G", "one"), agent("G", "two")],
    input: entrance("G_one", "G_two"), routes: { G_one: [edge("finish")], G_two: [edge("G_one")] } })];
  if (options.shared) return [definition("G", { nodes: [{ kind: "collaboration", nodeId: "G_H", groupId: "H" },
    { kind: "collaboration", nodeId: "G_K", groupId: "K" }], input: entrance("G_H", "G_K"),
    routes: { G_H: [edge("finish")], G_K: [edge("finish")] } }), ...["H", "K"].map((id) =>
    definition(id, { nodes: [agent(id, "one")], input: entrance(`${id}_one`), routes: { [`${id}_one`]: [edge("finish")] } }, "G"))];
  if (options.nested || options.depth3) {
    const leafId = options.depth3 ? "J" : "H";
    const leaf = definition(leafId, { nodes: ["one", "two", "three"].map((name) => agent(leafId, name)),
      input: entrance(`${leafId}_one`), routes: { [`${leafId}_one`]: [edge(`${leafId}_two`)],
        [`${leafId}_two`]: [edge(`${leafId}_three`)], [`${leafId}_three`]: [edge("finish")] } }, options.depth3 ? "H" : "G");
    return [definition("G", { nodes: [{ kind: "collaboration", nodeId: "G_H", groupId: "H" },
      agent("G", "one"), agent("G", "four"), agent("G", "five")], input: entrance("G_H", "G_four", "G_five"),
      routes: { G_H: options.childWeak ? [{ kind: "weak", target: "G_one" }, { kind: "weak", target: "finish" }]
        : [edge("G_one")], G_one: [edge("finish")], G_four: [edge("finish")], G_five: [edge("finish")] } }),
    ...(options.depth3 ? [definition("H", { nodes: [{ kind: "collaboration", nodeId: "H_J", groupId: "J" }],
      input: entrance("H_J"), routes: { H_J: [edge("finish")] } }, "G")] : []), leaf];
  }
  return [definition("G", { nodes: agentNames.map((name) => agent("G", name)),
    input: entrance("G_one", "G_four", "G_five"), routes: {
      G_one: options.weak ? [{ kind: "weak", target: "G_two" }, { kind: "weak", target: "finish" }] : [edge("G_two")],
      G_two: [edge("G_three")], G_three: [edge("finish")], G_four: [edge("finish")], G_five: [edge("finish")]
    } })];
}

async function fixture(options: Parameters<typeof definitions>[0] = {}) {
  const root = await mkdtemp(join(tmpdir(), "openfars-scoped-pump-"));
  roots.push(root);
  const database = CollaborationStateDatabase.open({ databasePath: join(root, "collaboration.sqlite"),
    serviceId: "pump-test", hostId: "test-host", topology: "single-host", instanceId: "instance-a", now: () => 1_000_000 });
  databases.push(database);
  const groups = definitions(options);
  database.createProject({ projectId: "p", workflowRevision: 1, workerCapacity: 5,
    git: { enabled: true, status: "ready", repository: { owner: "example", name: "openfars", htmlUrl: repository.htmlUrl,
      private: true, defaultBranch: "main", localPath: join(root, "workspace") } },
    workflowSnapshot: { schemaVersion: 3, agents: ["main", ...agentNames].map((name) => ({ name })),
      ...(options.gate ? { gates: [{ id: "quality", name: "Quality", groupId: "G",
        verifier: options.gate === "code" ? { kind: "code", interpreter: "node", output: "json", code: 'console.log(JSON.stringify({score:76}))' }
          : { kind: "agent", agentId: "two", instructions: "Assess the original input" },
        ...(options.gate === "decision" ? { decisionAgentId: "three" } : {}) }] } : {}),
      collaborations: groups.map((group) => ({ id: group.id })), routes: { main: [edge("G")], G: [edge("finish")] },
      scopedWorkflow: { schemaVersion: 1, rootAgentIds: ["main"], groups } } });
  const git = new RuntimeGit(database);
  const starts: Array<ScopedAgentTurnInput & { session: string }> = [];
  const active = new Set<string>();
  const sessions = new Map<string, string>();
  let handler: (input: ScopedAgentTurnInput) => Promise<{ selectedWeakTarget?: string } | void> = async () => undefined;
  const invoker = { invoke: vi.fn(async (input: ScopedAgentTurnInput) => {
    if (active.has(input.execution.agentId)) throw new Error("Agent received overlapping native turns");
    active.add(input.execution.agentId);
    const session = sessions.get(input.execution.agentId) ?? `native-${input.execution.agentId}`;
    sessions.set(input.execution.agentId, session);
    starts.push({ ...input, session });
    input.onOpened();
    try {
      let gateResult: { selectedWeakTarget?: string } | undefined;
      if (options.gate && (input.arrival.targetNodeId === "G_one" || options.gateSources && input.arrival.targetNodeId === "G_two" || input.arrival.targetKind === "gate")) {
        const graph = database.workflowSnapshot("p", 1) as import("../../src/core/types.js").AgentOrchestrationTemplate;
        const gate = graph.gates![0];
        const bound = input.arrival.gateRunId ? database.workflowGate("p", input.arrival.gateRunId)! : undefined;
        const origin: GateOrigin = bound?.origin ?? { projectId: "p", sourceRunId: input.arrival.requestId,
          scopeId: input.groupRun.id, nodeId: input.arrival.targetNodeId, agentId: input.execution.agentId,
          executionId: input.execution.id, invocationId: input.invocationId, workspacePath: root, workflowRevision: 1,
          input: { assignment: "original scoped research", arrival: input.arrival.requestId } };
        const gateSession = new WorkflowGateSession(origin, [{ gate, targets: input.workflow.routes.quality.map(edge => edge.target) }],
          { read: async id => database.workflowGate("p", id), save: async (run, version) => database.saveWorkflowGate(run, version) },
          { agentId: input.execution.agentId, invocationId: input.invocationId }, async () => {});
        if (gate.verifier.kind === "code") {
          const record = await gateSession.request({ operation: "prepare", gateId: gate.id }, "prepare") as GateRun;
          const event = { schemaVersion: 1 as const, seq: 1, timestamp: NOW, invocationId: input.invocationId, harnessId: "fixture" };
          await gateSession.observe({ ...event, eventId: "started", kind: "tool.started", phase: "started",
            tool: { name: "bash", toolType: "shell", callId: "check", status: "started", input: { command: record.command } } });
          const actual = await promisify(execFile)("bash", ["-c", record.command!]);
          await gateSession.observe({ ...event, eventId: "completed", kind: "tool.completed", phase: "completed",
            tool: { name: "bash", toolType: "shell", callId: "check", status: "completed", outputPreview: actual.stdout } });
        } else if (input.execution.agentId === "two") {
          await gateSession.bindChecker(gate.id);
          await gateSession.request({ operation: "report", gateId: gate.id, result: { score: 76, diagnosis: "negative feedback is useful" } }, "actual-report");
        }
        const recorded = database.workflowGate("p", gateRunId(origin, gate.id))!;
        if (recorded.decisionAgentId === input.execution.agentId) {
          await gateSession.request({ operation: "choose", gateId: gate.id, target: "G_four" }, "choice");
          if (input.arrival.targetKind === "gate") gateResult = { selectedWeakTarget: "G_four" };
        }
      }
      const result = gateResult ?? await handler(input);
      database.recordScopedAgentTaskCompletion({
        projectId: "p", executionId: input.execution.id,
        ownershipEpoch: input.execution.ownershipEpoch, agentId: input.execution.agentId,
        invocationId: input.invocationId, callId: `finish-${input.invocationId}`,
        summary: "Finished scoped task", requestedAt: NOW
      });
      return { output: `${input.execution.agentId} completed ${input.invocationId}`, selectedWeakTarget: result?.selectedWeakTarget,
        residentStopConfirmed: true as const };
    } finally { active.delete(input.execution.agentId); }
  }) };
  const runner = new ScopedAgentExecutionRunner(database, git, invoker, () => root);
  const progress = vi.fn(async () => undefined);
  const runtime = new ScopedWorkflowRuntime(database, git, runner, () => root, progress);
  const activation = { projectId: "p", groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G",
    workflowRevision: 1, outer: { nodeRunId: "node-G", inputSnapshotRef: "input:p", activatedByAgentId: "main" }, repository };
  const input = { projectId: "p", rootGroupRunId: "run-G", repository };
  return { root, database, git, starts, invoker, runner, progress, runtime, activation, input,
    setHandler: (next: typeof handler) => { handler = next; } };
}

/** Deterministic provider/local-sync double; all ownership, journals, queues,
 * native reports, Finish barriers and parent routes use real SQLite. */

describe("recursive scoped graph runtime composition", () => {
  it.each(["loop", "sources"] as const)("isolates Gate results across %s entries and replays no checks", async scenario => {
    const f = await fixture({ gate: "code", gateLoop: scenario === "loop", gateSources: scenario === "sources" });
    await f.runtime.activateGroup(f.activation);
    expect(await f.runtime.advance(f.input)).toMatchObject({ status: "completed", issues: [] });
    const checks = f.database.workflowGates("p");
    expect(checks).toHaveLength(2);
    expect(new Set(checks.map(run => run.origin.sourceRunId)).size).toBe(2);
    expect(new Set(checks.map(run => run.origin.invocationId)).size).toBe(2);
    expect(checks.every(run => run.status === "delivered")).toBe(true);
    if (scenario === "sources") expect(new Set(checks.map(run => run.origin.agentId))).toEqual(new Set(["one", "two"]));
    const count = f.starts.length;
    expect(await f.runtime.advance(f.input)).toMatchObject({ status: "completed", issues: [] });
    expect(f.starts).toHaveLength(count);
    expect(f.database.workflowGates("p")).toEqual(checks);
  });

  it.each(["code", "agent", "decision"] as const)("runs a scoped %s Gate with one selected successor and retained original feedback", async gate => {
    const f = await fixture({ gate });
    await f.runtime.activateGroup(f.activation);
    expect(await f.runtime.advance(f.input)).toMatchObject({ status: "completed", issues: [] });
    const projection = f.database.projectState("p");
    const actual = f.starts.map(turn => turn.execution.agentId);
    expect(actual).toEqual(gate === "code" ? ["one", "four"] : gate === "agent" ? ["two", "four"] : ["two", "three", "four"]);
    expect(projection.workflowGates).toHaveLength(1);
    expect(projection.workflowGates![0]).toMatchObject({ status: "delivered", selectedTarget: "G_four", result: { score: 76 } });
    expect(projection.scopedArrivals?.filter(arrival => arrival.targetNodeId === "G_four")).toHaveLength(1);
    expect(projection.scopedArrivals?.some(arrival => arrival.targetNodeId === "G_five")).toBe(false);
    expect(await f.runtime.advance(f.input)).toMatchObject({ status: "completed", issues: [] });
    expect(f.starts.map(turn => turn.execution.agentId)).toEqual(actual);
  });

  it("runs 1-2-3 alongside 4 and 5, and holds the root outer slot after final synchronization", async () => {
    const { database, git, runtime, activation, input, starts, setHandler } = await fixture();
    const slow = deferred();
    setHandler(async (turn) => { if (turn.execution.agentId === "five") await slow.promise; });
    await runtime.activateGroup(activation);
    const running = runtime.advance(input);
    await vi.waitFor(() => expect(starts.map((turn) => turn.execution.agentId)).toContain("three"));
    expect(starts.slice(0, 3).map((turn) => turn.execution.agentId).sort()).toEqual(["five", "four", "one"]);
    expect(database.scopedGroupRun("p", "run-G")?.status).toBe("running");
    expect(git.createGroupFinalPullRequest).not.toHaveBeenCalled();
    slow.resolve();
    expect(await running).toMatchObject({ status: "completed", issues: [] });
    expect(starts.map((turn) => turn.execution.agentId)).toHaveLength(5);
    expect(git.pulls.size).toBe(6);
    expect(database.projectState("p").activeNodeRunId).toBe("node-G");
    expect(git.localRefs.get("main")).toBe(git.refs.get("main"));
    const calls = starts.length;
    expect(await runtime.advance(input)).toMatchObject({ status: "completed" });
    expect(starts).toHaveLength(calls);
    expect(git.pulls.size).toBe(6);
    database.completeScopedRootRoute({ projectId: "p", groupRunId: "run-G", nodeRunId: "node-G",
      routeEmissionId: "root-route-G", route: { kind: "fixed", targetNodeId: "finish" }, output: "Completed all necessary work" });
    expect(database.projectState("p").activeNodeRunId).toBeUndefined();
  });

  it("queues 2 -> 1 while Agent 1 is busy, then reuses its fixed folder and Agent identity", async () => {
    const { database, runtime, activation, input, starts, setHandler } = await fixture({ fifo: true });
    const firstOne = deferred();
    setHandler(async (turn) => {
      if (turn.execution.agentId === "one" && starts.filter((item) => item.execution.agentId === "one").length === 1) await firstOne.promise;
    });
    await runtime.activateGroup(activation);
    const running = runtime.advance(input);
    await vi.waitFor(() => expect(database.scopedArrivals("run-G").filter((arrival) => arrival.agentId === "one")).toHaveLength(2));
    expect(starts.filter((turn) => turn.execution.agentId === "one")).toHaveLength(1);
    expect(database.scopedArrivals("run-G").filter((arrival) => arrival.agentId === "one").map((arrival) => arrival.status)).toEqual(["running", "queued"]);
    firstOne.resolve();
    expect(await running).toMatchObject({ status: "completed" });
    const ones = starts.filter((turn) => turn.execution.agentId === "one");
    expect(ones).toHaveLength(2);
    expect(new Set(ones.map((turn) => turn.execution.worktreePath)).size).toBe(1);
    expect(new Set(ones.map((turn) => turn.session)).size).toBe(1);
    expect(ones[0]!.execution.id).not.toBe(ones[1]!.execution.id);
    expect(ones[0]!.baseCommit).not.toBe(ones[1]!.baseCommit);
  });

  it.each([false, true])("recursively integrates only direct parents (three levels: %s)", async (depth3) => {
    const { database, runtime, activation, input, git, starts } = await fixture({ nested: true, depth3 });
    await runtime.activateGroup(activation);
    expect(await runtime.advance(input)).toMatchObject({ status: "completed", issues: [] });
    const groups = database.projectState("p").scopedGroupRuns!;
    expect(groups).toHaveLength(depth3 ? 3 : 2);
    for (const group of groups) {
      const pull = git.pulls.get(`group-final-${group.id}`)!;
      expect(pull.base).toBe(group.integrationTarget);
      expect(pull.head).toBe(group.groupBranch);
      if (group.parentGroupRunId) expect(pull.base).toBe(groups.find((parent) => parent.id === group.parentGroupRunId)!.groupBranch);
    }
    const oneTurns = starts.filter((turn) => turn.execution.agentId === "one");
    expect(oneTurns).toHaveLength(2);
    expect(new Set(oneTurns.map((turn) => turn.execution.worktreePath)).size).toBe(1);
    expect(git.pulls.get(oneTurns[0]!.execution.id)!.base).not.toBe(git.pulls.get(oneTurns[1]!.execution.id)!.base);
    const childFinal = git.log.findIndex((event) => event.kind === "sync" && event.head.startsWith("groups/") && event.base === "groups/run-G");
    const parentTurn = git.log.findIndex((event) => event.kind === "checkout" && event.head === oneTurns[1]!.execution.executionBranch);
    expect(parentTurn).toBeGreaterThan(childFinal);
  });

  it("uses one project-wide Agent queue for parallel sibling groups", async () => {
    const { runtime, activation, input, starts } = await fixture({ shared: true });
    await runtime.activateGroup(activation);
    expect(await runtime.advance(input)).toMatchObject({ status: "completed", issues: [] });
    expect(starts).toHaveLength(2);
    expect(new Set(starts.map((turn) => turn.execution.agentId))).toEqual(new Set(["one"]));
    expect(starts[0]!.groupRun.id).not.toBe(starts[1]!.groupRun.id);
    expect(new Set(starts.map((turn) => turn.execution.worktreePath)).size).toBe(1);
  });

  it("defers child preparation behind an already claimed manager and rescans it after release", async () => {
    const { root, database, runtime, activation, input, git } = await fixture({ shared: true });
    await runtime.activateGroup(activation);
    const held = database.claimScopedLeaderTurn({ projectId: "p", groupRunId: "run-G", agentId: "main",
      invocationId: "hold-management", runtimePath: join(root, "runtime", "hold-management") });
    expect(held).toBeDefined();

    const deferred = await runtime.advance(input);
    expect(deferred.status).toBe("waiting");
    expect(deferred.issues.filter((issue) => issue.kind === "failure")).toEqual([]);
    expect(deferred.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: "waiting_for_management", arrivalRequestId: expect.any(String) })
    ]));
    expect(database.scopedGroupActivationPreparations("p").filter(record => record.status === "preparing")).toEqual([]);
    expect(database.projectState("p").scopedGroupRuns).toHaveLength(1);
    expect(database.scopedArrivals("run-G").map((arrival) => arrival.status)).toEqual(["queued", "queued"]);

    database.releaseScopedLeaderTurn({ projectId: "p", groupRunId: "run-G", agentId: "main",
      invocationId: "hold-management", residentStopConfirmed: true });
    expect(await runtime.advance(input)).toMatchObject({ status: "completed", issues: [] });
    expect(database.projectState("p").scopedGroupRuns).toHaveLength(3);
    expect(git.log.filter((event) => event.kind === "birth")).toHaveLength(3);
  });

  it("keeps an overlapping manager behind an original child Git preparation until confirmed activation", async () => {
    const { root, database, runtime, activation, input, git, starts } = await fixture({ shared: true });
    await runtime.activateGroup(activation);
    const arrival = database.scopedArrivals("run-G").find(arrival => arrival.childGroupId === "H")!;
    const entered = deferred(), release = deferred(), observe = git.observeRemoteRef.getMockImplementation()!;
    let held = false;
    git.observeRemoteRef.mockImplementation(async (...args) => {
      if (!held && args[1] === "groups/run-H") { held = true; entered.resolve(); await release.promise; }
      return observe(...args);
    });
    const pending = runtime.activateGroup({ projectId: "p", groupRunId: "run-H", groupId: "H", activationRequestId: arrival.requestId,
      parentGroupRunId: "run-G", parentArrivalRequestId: arrival.requestId, workflowRevision: 1, repository });
    await entered.promise;
    try {
      expect(database.scopedGroupRun("p", "run-H")).toBeUndefined(); expect(database.scopedArrivals("run-H")).toEqual([]);
      expect(database.claimScopedLeaderTurn({ projectId: "p", groupRunId: "run-G", agentId: "main",
        invocationId: "manager-during-child-preparation", runtimePath: join(root, "runtime", "manager") })).toBeUndefined();
      expect(starts).toEqual([]);
    } finally { release.resolve(); }
    expect((await pending).arrivals).toHaveLength(1);
    expect(await runtime.advance(input)).toMatchObject({ status: "completed", issues: [] });
    expect(git.log.filter(event => event.kind === "birth")).toHaveLength(3);
    expect(database.scopedGroupActivationPreparations("p").every(record => record.status === "activated")).toBe(true);
  });

  it("does not wait for an unselected weak path", async () => {
    const { runtime, activation, input, starts, setHandler } = await fixture({ weak: true });
    setHandler(async (turn) => turn.execution.agentId === "one" ? { selectedWeakTarget: "finish" } : undefined);
    await runtime.activateGroup(activation);
    expect(await runtime.advance(input)).toMatchObject({ status: "completed", issues: [] });
    expect(starts.map((turn) => turn.execution.agentId).sort()).toEqual(["five", "four", "one"]);
  });

  it("keeps independent branches moving after failure, then retries only failed work at a fresh epoch", async () => {
    const { database, runtime, activation, input, git, starts, setHandler } = await fixture();
    setHandler(async (turn) => { if (turn.execution.agentId === "two") throw new ScopedAgentTurnFailure("two failed", true); });
    await runtime.activateGroup(activation);
    expect(await runtime.advance(input)).toMatchObject({ status: "waiting", issues: [expect.objectContaining({ kind: "failure" })] });
    expect(starts.map((turn) => turn.execution.agentId).sort()).toEqual(["five", "four", "one", "two"]);
    expect([...git.pulls.values()].filter((pull) => pull.status === "merged")).toHaveLength(3);
    expect(git.createGroupFinalPullRequest).not.toHaveBeenCalled();
    const failed = database.projectState("p").scopedExecutions!.find((execution) => execution.agentId === "two")!;
    database.retryScopedAgentArrival({ projectId: "p", executionId: failed.id,
      arrivalRequestId: failed.arrivalRequestId, failedOwnershipEpoch: 1 });
    setHandler(async () => undefined);
    expect(await runtime.advance(input)).toMatchObject({ status: "completed", issues: [] });
    for (const agentId of ["one", "four", "five"]) expect(starts.filter((turn) => turn.execution.agentId === agentId)).toHaveLength(1);
    expect(starts.filter((turn) => turn.execution.agentId === "two").map((turn) => turn.execution.ownershipEpoch)).toEqual([1, 2]);
    const twos = starts.filter((turn) => turn.execution.agentId === "two");
    expect(twos[0]!.baseCommit).toBe(twos[1]!.baseCommit);
    expect(git.sessionBegin.mock.calls.filter(([execution]) => execution.agentId === "two")).toHaveLength(1);
    expect(git.observeRetainedExecution).toHaveBeenCalledOnce();
    expect(git.pulls.size).toBe(6);
  });

  it("does not advance a serial successor until exact local synchronization completes", async () => {
    const { database, runtime, activation, input, git, starts } = await fixture();
    const synchronized = deferred();
    git.beforeSync = async (request) => { if ("agentId" in request.execution && request.execution.agentId === "one") await synchronized.promise; };
    await runtime.activateGroup(activation);
    const running = runtime.advance(input);
    await vi.waitFor(() => expect(git.log.some((event) => event.kind === "merge" && event.head === starts.find((turn) => turn.execution.agentId === "one")?.execution.executionBranch)).toBe(true));
    expect(starts.some((turn) => turn.execution.agentId === "two")).toBe(false);
    expect(database.scopedArrivals("run-G").some((arrival) => arrival.targetNodeId === "G_two")).toBe(false);
    synchronized.resolve();
    expect(await running).toMatchObject({ status: "completed" });
  });

  it("resumes a merged/synchronized report without another model call or another PR", async () => {
    const { runtime, activation, input, git, starts } = await fixture();
    git.failSyncOnceAgent = "one";
    await runtime.activateGroup(activation);
    expect(await runtime.advance(input)).toMatchObject({ status: "waiting" });
    expect(starts.map((turn) => turn.execution.agentId).sort()).toEqual(["five", "four", "one"]);
    expect(await runtime.advance(input)).toMatchObject({ status: "completed" });
    expect(starts.filter((turn) => turn.execution.agentId === "one")).toHaveLength(1);
    expect(git.pulls.size).toBe(6);
  });

  it("leaves conflicted PRs active without stopping independent delivery or pretending Finish succeeded", async () => {
    const { database, runtime, activation, input, git, starts } = await fixture();
    git.conflictedAgent = "one";
    await runtime.activateGroup(activation);
    expect(await runtime.advance(input)).toMatchObject({ status: "waiting",
      issues: [expect.objectContaining({ kind: "waiting_for_pull" })] });
    expect(starts.map((turn) => turn.execution.agentId).sort()).toEqual(["five", "four", "one"]);
    expect([...git.pulls.values()].filter((pull) => pull.status === "merged")).toHaveLength(2);
    expect(database.scopedGroupRun("p", "run-G")?.status).toBe("running");
    expect(git.createGroupFinalPullRequest).not.toHaveBeenCalled();
  });

  it("replays a canonical branch birth interrupted before Input persistence", async () => {
    const { database, runtime, activation, input, git, starts } = await fixture();
    git.crashBirthOnce = true;
    await expect(runtime.activateGroup(activation)).rejects.toThrow("crash after group branch push");
    expect(database.scopedGroupRun("p", "run-G")).toBeUndefined();
    expect(starts).toHaveLength(0);
    expect(await runtime.activateGroup(activation)).toMatchObject({ replay: false });
    expect(git.log.filter((event) => event.kind === "birth")).toHaveLength(1);
    expect(await runtime.advance(input)).toMatchObject({ status: "completed" });
    expect(await runtime.activateGroup(activation)).toMatchObject({ replay: true });
    expect(git.log.filter((event) => event.kind === "birth")).toHaveLength(1);
  });

  it("persists a real branch-initialization failure, launches no Agent, and reuses the same operation on retry", async () => {
    const { database, runtime, activation, git, starts } = await fixture();
    git.failBirthBeforeJournalOnce = "run-G";
    await expect(runtime.activateGroup(activation)).rejects.toThrow("local group branch creation failed");
    expect(starts).toHaveLength(0);
    expect(database.scopedGroupRun("p", "run-G")).toBeUndefined();
    expect(database.scopedInitializationFailures("p")).toEqual([expect.objectContaining({
      groupRunId: "run-G",
      operationId: "scoped-group-begin-run-G",
      reason: "local group branch creation failed",
      resolved: false
    })]);
    await expect(runtime.activateGroup(activation)).resolves.toMatchObject({ replay: false });
    expect(git.beginGroup).toHaveBeenCalledTimes(2);
    expect(git.log.filter((event) => event.kind === "birth")).toHaveLength(1);
    expect(database.scopedInitializationFailures("p").at(-1)).toMatchObject({ resolved: true });
    expect(starts).toHaveLength(0);
  });

  it("rejects another root, foreign parent/repository, or an orphan remote branch before fan-out", async () => {
    const { database, runtime, activation, git } = await fixture({ nested: true });
    await expect(runtime.activateGroup({ ...activation, repository: { ...repository, owner: "foreign" } })).rejects.toThrow(/pinned/);
    await expect(runtime.activateGroup({ ...activation, groupId: "H" })).rejects.toThrow(/direct parent/);
    expect(git.beginGroup).not.toHaveBeenCalled();
    git.refs.set("groups/run-G", BASE);
    await expect(runtime.activateGroup(activation)).rejects.toThrow(/birth journal/);
    expect(database.projectState("p").scopedArrivals).toEqual([]);
    git.refs.delete("groups/run-G");
    await runtime.activateGroup(activation);
    await expect(runtime.activateGroup({ ...activation, groupRunId: "another-root", activationRequestId: "another-activation",
      outer: { ...activation.outer, nodeRunId: "another-node" } })).rejects.toThrow(/outer slot/);
    expect(git.log.filter((event) => event.kind === "birth")).toHaveLength(1);
  });

  it("keeps a child compound weak decision pending instead of inventing a route or final PR", async () => {
    const { runtime, activation, input, git, starts, database } = await fixture({ nested: true, childWeak: true });
    await runtime.activateGroup(activation);
    expect(await runtime.advance(input)).toMatchObject({ status: "waiting",
      issues: [expect.objectContaining({ kind: "waiting_for_route" })] });
    const child = database.projectState("p").scopedGroupRuns!.find((group) => group.parentGroupRunId)!;
    expect(git.pulls.has(`group-final-${child.id}`)).toBe(false);
    expect(starts.filter((turn) => turn.execution.agentId === "one")).toHaveLength(1);
    expect(database.scopedGroupRun("p", child.id)?.status).toBe("running");
  });

  it("holds later arrivals for a failed Agent while another Agent completes independently", async () => {
    const { database, runtime, activation, input, starts, setHandler } = await fixture({ fifo: true });
    setHandler(async (turn) => { if (turn.execution.agentId === "one") throw new ScopedAgentTurnFailure("failed first one", true); });
    await runtime.activateGroup(activation);
    expect(await runtime.advance(input)).toMatchObject({ status: "waiting" });
    expect(starts.map((turn) => turn.execution.agentId).sort()).toEqual(["one", "two"]);
    expect(database.scopedArrivals("run-G").filter((arrival) => arrival.agentId === "one").map((arrival) => arrival.status))
      .toEqual(["failed", "queued"]);
    expect(await runtime.advance(input)).toMatchObject({ status: "waiting" });
    expect(starts).toHaveLength(2);
  });

  it("reuses a child's exact final synchronization proof before routing its parent successor", async () => {
    const { runtime, activation, input, git, starts, database } = await fixture({ nested: true });
    git.failFinalSyncOnceGroup = "H";
    await runtime.activateGroup(activation);
    expect(await runtime.advance(input)).toMatchObject({ status: "waiting" });
    const child = database.projectState("p").scopedGroupRuns!.find((group) => group.groupId === "H")!;
    expect(child.status).toBe("integrating");
    expect(starts.filter((turn) => turn.execution.agentId === "one")).toHaveLength(1);
    expect(await runtime.advance(input)).toMatchObject({ status: "completed" });
    expect(starts.filter((turn) => turn.execution.agentId === "one")).toHaveLength(2);
    expect(git.reconcileGroupFinalPullRequest.mock.calls.filter(([request]) => request.execution.groupRunId === child.id)).toHaveLength(1);
    expect(git.createGroupFinalPullRequest.mock.calls.filter(([request]) => request.execution.groupRunId === child.id)).toHaveLength(2);
    expect(git.log.filter((event) => event.kind === "create" && event.head === child.groupBranch)).toHaveLength(1);
  });

  it("does not accept a retained synchronization proof for another provider identity or allow callers to mutate it", async () => {
    const { runtime, activation, input, git, database } = await fixture();
    git.failSyncOnceAgent = "one";
    await runtime.activateGroup(activation);
    await runtime.advance(input);
    const execution = database.projectState("p").scopedExecutions!.find((item) => item.agentId === "one")!;
    const pull = git.pulls.get(execution.id)!;
    const identity = { projectId: "p", executionId: execution.id, ownershipEpoch: 1, providerNumber: pull.providerNumber,
      expectedHead: pull.headSha!, expectedBase: pull.base, expectedMergeCommitSha: pull.mergeCommitSha! };
    const retained = database.scopedMergedSynchronization(identity)!;
    expect(retained).toMatchObject({ expectedSourceHead: pull.headSha, targetBranch: "groups/run-G" });
    const localHead = retained.localHeadAfter;
    retained.localHeadAfter = "0".repeat(40);
    expect(database.scopedMergedSynchronization(identity)?.localHeadAfter).toBe(localHead);
    expect(() => database.scopedMergedSynchronization({ ...identity, providerNumber: pull.providerNumber + 1 })).toThrow(/exact merged PR/);
    expect(database.scopedMergedSynchronization({ ...identity, expectedHead: "f".repeat(40) })).toBeUndefined();
  });

  it("rejects concurrent pumps and drains stopped native phases before propagating an abort", async () => {
    const { runtime, activation, input, git, starts, setHandler, database } = await fixture();
    const controller = new AbortController();
    setHandler(async (turn) => {
      if (turn.execution.agentId === "one") await new Promise<void>((_resolve, reject) => {
        turn.signal!.addEventListener("abort", () => reject(new ScopedAgentTurnFailure("native aborted and closed", true)), { once: true });
      });
    });
    await runtime.activateGroup(activation);
    const running = runtime.advance({ ...input, signal: controller.signal });
    // Attach a handler now so the eventual abort cannot become unhandled.
    const aborted = expect(running).rejects.toThrow();
    await vi.waitFor(() => expect(starts).toHaveLength(3));
    await expect(runtime.advance(input)).rejects.toThrow(/already in progress/);
    controller.abort();
    await aborted;
    const one = database.projectState("p").scopedExecutions!.find((execution) => execution.agentId === "one")!;
    expect(one.status).toBe("failed");
    expect(database.scopedAgentTurn("p", one.id, 1)?.status).toBe("stopped");
    expect(git.createGroupFinalPullRequest).not.toHaveBeenCalled();
  });

  it("revalidates a lease lost during provider observation before touching the group branch", async () => {
    const { runtime, activation, git, database } = await fixture();
    const observe = git.observeRemoteRef;
    git.observeRemoteRef = vi.fn(async (repo, ref) => {
      const fact = await observe(repo, ref);
      if (ref === "main") database.relinquishWriterLease();
      return fact;
    });
    await expect(runtime.activateGroup(activation)).rejects.toThrow(/writer|lease/i);
    expect(git.beginGroup).not.toHaveBeenCalled();
    expect(git.refs.has("groups/run-G")).toBe(false);
    expect(database.scopedGroupRun("p", "run-G")).toBeUndefined();
  });

  it("runs the configured number of Loop iterations and follows its implicit exit before Finish", async () => {
    const { runtime, activation, input, starts, database } = await fixture({ loop: true });
    await runtime.activateGroup(activation);
    expect((await runtime.advance(input)).status).toBe("completed");
    expect(starts.map((turn) => turn.execution.agentId)).toEqual(["one", "two", "one", "two", "three"]);
    expect(starts.at(-1)!.arrival.pathContext?.loops.cycle).toEqual({ batch: 1, iterations: 2, totalIterations: 2 });
    const evidence = database.projectState("p");
    expect(evidence.scopedArrivals!.every((arrival) => arrival.pathContext?.pathId === starts[0]!.arrival.pathContext?.pathId)).toBe(true);
    await runtime.advance(input);
    expect(starts).toHaveLength(5);
    expect(database.projectState("p").scopedArrivals).toEqual(evidence.scopedArrivals);
  });

  it("isolates counters for two parallel path instances sharing the same Agent Loop", async () => {
    const { runtime, activation, input, starts } = await fixture({ loopPaths: true });
    await runtime.activateGroup(activation);
    expect((await runtime.advance(input)).status).toBe("completed");
    expect(starts).toHaveLength(11);
    const exits = starts.filter((turn) => turn.execution.agentId === "three");
    expect(exits).toHaveLength(2);
    expect(new Set(exits.map((turn) => turn.arrival.pathContext?.pathId)).size).toBe(2);
    expect(exits.every((turn) => turn.arrival.pathContext?.loops.cycle.iterations === 2)).toBe(true);
  });

  it("starts a fresh same-size batch on a formally selected reentry without reconfiguring", async () => {
    const { runtime, activation, input, starts, setHandler } = await fixture({ loopBatch: true });
    setHandler(async (turn) => turn.execution.agentId === "three" ? {
      selectedWeakTarget: turn.arrival.pathContext!.loops.cycle.batch === 1 ? "G_one" : "finish"
    } : undefined);
    await runtime.activateGroup(activation);
    expect((await runtime.advance(input)).status).toBe("completed");
    expect(starts).toHaveLength(10);
    expect(starts.at(-1)!.arrival.pathContext?.loops.cycle).toEqual({ batch: 2, iterations: 2, totalIterations: 4 });
  });

  it("does not double count a Loop boundary when synchronization and completion are replayed", async () => {
    const { runtime, activation, input, starts, git } = await fixture({ loop: true });
    git.failSyncOnceAgent = "two";
    await runtime.activateGroup(activation);
    expect((await runtime.advance(input)).status).toBe("waiting");
    expect(starts).toHaveLength(2);
    expect((await runtime.advance(input)).status).toBe("completed");
    expect(starts.map((turn) => turn.execution.agentId)).toEqual(["one", "two", "one", "two", "three"]);
    expect(starts.at(-1)!.arrival.pathContext?.loops.cycle.totalIterations).toBe(2);
  });
});
