import { pathToFileURL as sdkFixtureFileURL } from "node:url";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import { createRequire } from "node:module";
import { DatabaseSync } from "node:sqlite";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CollaborationStateDatabase } from "../../src/core/collaboration-state/store.js";
import { CollaborationGitFacade } from "../../src/core/collaboration-git/facade.js";
import { ProjectStorage } from "../../src/core/storage.js";
import { EventHub } from "../../src/core/event-hub.js";
import { ControlActionService, startControlActionBridge } from "../../src/core/orchestration-control-bridge.js";
import { serializeInvocationControlContext } from "../../src/core/harness-runtime/runtime-support.js";
import type { AgentRunRequest, ControlActionEnvelope, ProjectState } from "../../src/core/types.js";
import type { TerminalPushObservationTurn } from "../../src/core/collaboration-state/contracts.js";

const PROJECT = `prj_${"d".repeat(32)}`;
const HEAD = "7".repeat(40);
const roots: string[] = [];
const databases: CollaborationStateDatabase[] = [];
afterEach(async () => {
  databases.splice(0).forEach(database => database.close());
  await Promise.all(roots.splice(0).map(root => fs.rm(root, { recursive: true, force: true })));
});

async function fixture(opened = true, agentId = "worker") {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "terminal-push-completion-")); roots.push(root);
  const clock = { now: Date.now() };
  const timestamp = new Date(clock.now).toISOString();
  const storage = new ProjectStorage(path.join(root, "data"), new EventHub());
  await storage.initialize();
  const projectPath = storage.projectDir(PROJECT);
  const worktree = path.join(projectPath, "git-worktrees", "agents", agentId);
  const oldMemory = path.join(worktree, "agent-memory", agentId, "Memory.md");
  const durableMemory = path.join(projectPath, "workspaces", "agent-memory", agentId, "Memory.md");
  for (const file of [oldMemory, durableMemory]) { await fs.mkdir(path.dirname(file), { recursive: true }); await fs.writeFile(file, "Retained original Agent memory\n"); }
  await fs.mkdir(path.join(projectPath, "messages"));
  const databasePath = path.join(root, "collaboration.sqlite");
  const database = CollaborationStateDatabase.open({ databasePath, serviceId: "receipt-test", instanceId: "original-writer",
    hostId: "test-host", topology: "single-host", now: () => clock.now }); databases.push(database);
  const repository = { owner: "example", name: "retained", private: true, defaultBranch: "main", htmlUrl: "https://github.com/example/retained", observedAt: timestamp };
  database.createProject({ projectId: PROJECT, workflowRevision: 1, workerCapacity: 1,
    workflowSnapshot: { schemaVersion: 2, collaborations: [] }, git: { enabled: true, status: "ready", repository: { ...repository, localPath: root } } });
  // Retained historical rows are fixture setup, never a test-side repair.
  const raw = new DatabaseSync(databasePath); raw.exec("PRAGMA foreign_keys=ON");
  raw.prepare(`INSERT INTO node_runs(node_run_id,project_id,node_kind,node_id,agent_id,workflow_revision,
    activation_request_id,activation_payload_hash,input_snapshot_ref,activated_by_agent_id,status,activated_at,updated_at,completed_at)
    VALUES ('old-node',?,'agent',?,?,1,'old-activation','old-hash','old-input','main','completed',?,?,?)`).run(PROJECT, agentId, agentId, timestamp, timestamp, timestamp);
  raw.prepare(`INSERT INTO work_tasks(task_id,node_run_id,assignment,queue_ordinal,purpose,status,created_at,updated_at,completed_at)
    VALUES ('old-task','old-node','Original completed work',1,'delivery','succeeded',?,?,?)`).run(timestamp, timestamp, timestamp);
  raw.prepare(`INSERT INTO member_executions(execution_id,project_id,node_run_id,task_id,agent_id,purpose,ownership_epoch,status,
    execution_branch,worktree_path,queued_at,started_at,updated_at,completed_at,process_stop_confirmed,invocation_id,session_id)
    VALUES ('old-execution',?,'old-node','old-task',?,'delivery',2,'succeeded','executions/old-execution',?,?,?,?,?,1,'inv_original_worker','original-worker-session')`)
    .run(PROJECT, agentId, worktree, timestamp, timestamp, timestamp, timestamp);
  raw.prepare(`INSERT INTO operations(operation_id,project_id,kind,payload_hash,status,owner_execution_id,ownership_epoch,
    expected_head,expected_base,created_at,updated_at) VALUES ('original-push',?,'git.push',?,'uncertain','old-execution',1,?,'executions/old-execution',?,?)`)
    .run(PROJECT, "a".repeat(64), HEAD, timestamp, timestamp);
  raw.close();
  const priorReceipt = { taskId: "old-execution", agent: agentId, invocationId: "inv_original_worker", callId: "old-finish",
    requestedAt: timestamp, status: "accepted", summary: "Original task finished", memory: "Original memory", handoffPath: "/retained/original-handoff.md", acceptedAt: timestamp };
  const state = { id: PROJECT, turn: 1, taskCompletions: { "old-execution": priorReceipt }, agents: { [agentId]: { harness: "pi", permission: "yolo", sessionPersistence: false } } } as unknown as ProjectState;
  const statePath = path.join(projectPath, "state.json"); await fs.writeFile(statePath, JSON.stringify(state));
  const originalTaskReceiptPath = path.join(projectPath, "runtime", "task-completions", `${createHash("sha256").update("old-execution").digest("hex")}.json`);
  await fs.mkdir(path.dirname(originalTaskReceiptPath), { recursive: true }); await fs.writeFile(originalTaskReceiptPath, JSON.stringify(priorReceipt));
  const turn = database.beginTerminalPushObservation({ projectId: PROJECT, executionId: "old-execution", ownershipEpoch: 2, agentId,
    invocationId: "inv_terminal_receipt", operationId: "original-push", originalInvocationId: "inv_original_worker", previousInvocationId: "inv_original_worker",
    previousRuntimePath: path.join(projectPath, "runtime", "resident", "inv_original_worker"), runtimePath: path.join(projectPath, "runtime", "resident", "inv_terminal_receipt"),
    residentStopConfirmed: true, evidence: { fixtureOriginalNativeAbsence: true } })!;
  if (opened) database.markTerminalPushObservationOpened({ ...turn, nativeProcessOpened: true });
  const envelope = (memory: string | undefined = "Actual Agent note: remote receipt remains unconfirmed"): ControlActionEnvelope => ({
    projectId: PROJECT, agent: agentId, invocationId: turn.invocationId, callId: "my-finish", stateVersion: 2,
    capabilityHash: "b".repeat(64), receivedAt: timestamp, action: { tool: "finish_task", summary: "I observed my old push", ...(memory === undefined ? {} : { memory }) } });
  const close = () => database.stopTerminalPushObservation({ ...turn, residentStopConfirmed: true, evidence: { fixtureSupplementNativeAbsence: true } });
  const observe = vi.fn(async () => ({ owner: repository.owner, repository: repository.name, ref: turn.executionBranch, status: "missing" as const, observedAt: timestamp }));
  const push = vi.fn(); const checkpoint = vi.fn();
  const git = new CollaborationGitFacade({ operationStore: database.operationsForProject(PROJECT),
    localGit: { projectId: PROJECT, pushRetainedExecution: push, checkpoint } as never, provider: { observeRef: observe } as never });
  return { root, storage, projectPath, worktree, oldMemory, durableMemory, databasePath, database, state, statePath, originalTaskReceiptPath,
    priorReceipt, turn, envelope, close, clock, repository, git, observe, push, checkpoint };
}

async function controlFor(f: Awaited<ReturnType<typeof fixture>>, assertCurrent = async () => {}) {
  const { terminalPushObservationControlAuthorityFactory } = await import("../../src/core/terminal-push-observation-control.js");
  const request = { project: f.state, agent: f.turn.agentId, kind: "worker", permission: "workspace", invocationId: f.turn.invocationId,
    runtimePath: path.join(f.projectPath, "runtime", f.turn.invocationId), workspacePath: f.worktree, sessionContinuity: "strict",
    terminalPushObservation: { operationId: f.turn.operation.id }, executionContext: { role: "delivery", nodeRunId: f.turn.nodeRunId,
      executionId: f.turn.executionId, ownershipEpoch: f.turn.ownershipEpoch, executionWorktree: f.worktree } } as unknown as AgentRunRequest;
  const authority = await terminalPushObservationControlAuthorityFactory({ state: f.state, database: f.database, storage: f.storage,
    observation: f.turn, git: f.git, repository: f.repository, assertCurrent })({ request,
      turn: { invocationId: f.turn.invocationId, inputId: "receipt-input", prompt: "Observe your actual original push" } });
  return { authority, request };
}

async function actualMcp(settings: Record<string, string>, requests: Array<Record<string, unknown>>) {
  const source = fileURLToPath(new URL("../../src/core/orchestration-control-mcp.ts", import.meta.url));
  const loader = sdkFixtureFileURL(createRequire(import.meta.url).resolve("tsx")).href;
  const child = spawn(process.execPath, ["--import", loader, source], { env: { ...process.env, ...settings }, stdio: ["pipe", "pipe", "pipe"] });
  let stdout = ""; let stderr = "";
  child.stdout.on("data", chunk => { stdout += String(chunk); }); child.stderr.on("data", chunk => { stderr += String(chunk); });
  const completion = new Promise<void>((resolve, reject) => { child.once("error", reject); child.once("close", code => { if (code) reject(new Error(stderr)); else resolve(); }); });
  child.stdin.end(requests.map(request => JSON.stringify(request)).join("\n") + "\n");
  await completion;
  return stdout.trim().split("\n").filter(Boolean).map(line => JSON.parse(line) as { result: { isError?: boolean; tools?: Array<{ name: string }>; content?: unknown }; error?: unknown });
}

function oldBusiness(projection: ReturnType<CollaborationStateDatabase["projectState"]>) {
  return { nodeRuns: projection.nodeRuns, tasks: projection.tasks, executions: projection.executions,
    groups: projection.groupRuns, pulls: projection.pullRequests, lanes: projection.laneLeases };
}

describe("terminal push completion receipts", () => {
  it.each([{ agentId: "worker", withMemory: true }, { agentId: "worker", withMemory: false },
    { agentId: "探测证据员", withMemory: true }, { agentId: "探测证据员", withMemory: false }])(
    "the real MCP saves $agentId supplemental finish (memory: $withMemory)", async ({ agentId, withMemory }) => {
    const f = await fixture(true, agentId); const before = oldBusiness(f.database.projectState(PROJECT));
    const oldFiles = await Promise.all([f.statePath, f.originalTaskReceiptPath, f.oldMemory, f.durableMemory].map(file => fs.readFile(file)));
    const { authority, request } = await controlFor(f);
    const service = new ControlActionService({ projectId: PROJECT, agent: agentId, invocationId: f.turn.invocationId,
      stateVersion: 2, capability: authority.control.capability, capabilityHash: authority.control.capabilityHash,
      stagingPath: authority.control.stagingPath, revalidate: authority.revalidate, execute: authority.execute });
    await fs.mkdir(path.dirname(authority.control.stagingPath), { recursive: true });
    const bridge = await startControlActionBridge(service, path.dirname(authority.control.stagingPath));
    try {
      const control = { ...authority.control, bridgePath: bridge.endpoint.path, bridgeHost: bridge.endpoint.host, bridgePort: bridge.endpoint.port };
      const responses = await actualMcp({ SCIENCEEVOLVE_CONTROL_CAPABILITY: control.capability, SCIENCEEVOLVE_CONTROL_CONTEXT:
        serializeInvocationControlContext(control, { projectId: PROJECT, agent: agentId, invocationId: f.turn.invocationId, kind: "worker", workspacePath: request.workspacePath }) }, [
        { id: 1, method: "tools/list" },
        { id: 2, method: "tools/call", params: { name: "git_reconcile_push", arguments: { callId: "my-query", operationId: "original-push", historical: true } } },
        { id: 3, method: "tools/call", params: { name: "finish_task", arguments: { callId: "my-finish", summary: "I found the original remote ref missing",
          ...(withMemory ? { memory: "My actual observation: remote ref is still missing" } : {}) } } }
      ]);
      expect(responses[0].result.tools!.map(tool => tool.name)).toEqual(["finish_task", "git_reconcile_push"]);
      expect(responses[1].result.isError).not.toBe(true); expect(JSON.stringify(responses[1].result)).toContain("missing");
      expect(responses[2].result.isError).not.toBe(true);
      const observed = f.database.terminalPushObservationTurns(PROJECT)[0];
      expect(observed.completion).toMatchObject({ projectId: PROJECT, agentId, invocationId: f.turn.invocationId, executionId: "old-execution",
        originalInvocationId: "inv_original_worker", operationId: "original-push", callId: "my-finish", summary: "I found the original remote ref missing" });
      expect(observed.status).toBe("opened");
      const saved = await f.storage.saveTerminalPushObservationCompletion(observed.completion!);
      expect((responses[2].result as any).structuredContent).toMatchObject({ status: "recorded", result: saved });
      expect(JSON.stringify(responses[2].result.content)).toContain(saved.receiptPath);
      expect(JSON.stringify(responses[2].result.content)).toContain("original business Memory is unchanged");
      expect(JSON.parse(await fs.readFile(saved.receiptPath, "utf8"))).toEqual(observed.completion);
      if (withMemory) expect(await fs.readFile(saved.memoryPath!, "utf8")).toBe("My actual observation: remote ref is still missing");
      else { expect(saved.memoryPath).toBeUndefined(); await expect(fs.access(path.join(path.dirname(saved.receiptPath), "Memory.md"))).rejects.toThrow(); }
      expect(f.database.recordedGitOperation(PROJECT, "original-push")!.status).toBe("uncertain");
      expect(oldBusiness(f.database.projectState(PROJECT))).toEqual(before);
      expect(f.state.taskCompletions).toEqual({ "old-execution": f.priorReceipt });
      expect(await Promise.all([f.statePath, f.originalTaskReceiptPath, f.oldMemory, f.durableMemory].map(file => fs.readFile(file)))).toEqual(oldFiles);
      expect(f.observe).toHaveBeenCalledOnce(); expect(f.push).not.toHaveBeenCalled(); expect(f.checkpoint).not.toHaveBeenCalled();
      const handoff = "Original Agent handoff: remote receipt is unresolved; ask my coordinator for help.";
      const handoffPath = await f.storage.writeHandoff(f.state, agentId, f.turn.invocationId, handoff);
      f.database.recordTerminalPushObservationResult({ ...f.turn, output: handoff, handoffPath });
      expect(await fs.readFile(handoffPath, "utf8")).toBe(handoff);
      f.close();
      expect(f.database.projectState(PROJECT).terminalPushObservations![0]).toMatchObject({ status: "stopped", result: { output: handoff, handoffPath }, completion: observed.completion });
      expect(f.database.terminalPushObservationRepairCount(PROJECT, "old-execution")).toBe(1);
      expect(oldBusiness(f.database.projectState(PROJECT))).toEqual(before);
    } finally { await bridge.close(); }
  });

  it("same-content finish replays preserve the first receipt and snapshot; changed memory or summary is rejected", async () => {
    const f = await fixture();
    const completion = f.database.completeTerminalPushObservation({ ...f.turn, envelope: f.envelope() });
    const saved = await f.storage.saveTerminalPushObservationCompletion(completion); const bytes = await fs.readFile(saved.receiptPath);
    const replay = f.envelope(); replay.callId = "new-equivalent-call"; replay.receivedAt = new Date(f.clock.now + 1).toISOString(); replay.capabilityHash = "c".repeat(64);
    expect(f.database.completeTerminalPushObservation({ ...f.turn, envelope: replay })).toEqual(completion);
    expect(await f.storage.saveTerminalPushObservationCompletion(f.database.terminalPushObservationTurns(PROJECT)[0].completion!)).toEqual(saved);
    expect(await fs.readFile(saved.receiptPath)).toEqual(bytes);
    for (const action of [{ tool: "finish_task" as const, summary: "changed", memory: completion.memory },
      { tool: "finish_task" as const, summary: completion.summary, memory: "changed memory" }]) {
      expect(() => f.database.completeTerminalPushObservation({ ...f.turn, envelope: { ...replay, action } })).toThrow(/content changed/);
    }
    expect(f.database.eventsAfter(PROJECT, 0, 100).filter(event => event.type === "agent.terminal_push_observation.task.completed")).toHaveLength(1);
    expect(f.database.terminalPushObservationRepairCount(PROJECT, "old-execution")).toBe(1);
    expect(f.database.recordedGitOperation(PROJECT, "original-push")!.status).toBe("uncertain");
  });

  it("restores a Chinese Agent's accepted finish after file persistence fails without duplicating its receipt", async () => {
    const f = await fixture(true, "探测证据员");
    const { authority } = await controlFor(f);
    const envelope = { ...f.envelope(), capabilityHash: authority.control.capabilityHash! };
    vi.spyOn(f.storage, "saveTerminalPushObservationCompletion").mockRejectedValueOnce(new Error("fixture file persistence failed"));
    await expect(authority.revalidate(envelope)).rejects.toThrow("fixture file persistence failed");
    const accepted = f.database.terminalPushObservationTurns(PROJECT)[0].completion!;
    expect(accepted.agentId).toBe("探测证据员");
    await authority.revalidate(envelope);
    const saved = await f.storage.saveTerminalPushObservationCompletion(accepted);
    expect(JSON.parse(await fs.readFile(saved.receiptPath, "utf8"))).toEqual(accepted);
    expect(await fs.readFile(saved.memoryPath!, "utf8")).toBe(envelope.action.tool === "finish_task" ? envelope.action.memory : undefined);
    expect(f.database.eventsAfter(PROJECT, 0, 100).filter(event => event.type === "agent.terminal_push_observation.task.completed")).toHaveLength(1);
    await expect(authority.revalidate({ ...envelope, action: { tool: "finish_task", summary: "changed" } })).rejects.toThrow("content changed");
    expect(f.push).not.toHaveBeenCalled();
  });

  it.each(["reserved", "stopped", "frozen", "cancelled"] as const)("rejects finish in %s scope without a new receipt or memory", async stage => {
    const f = await fixture(stage !== "reserved");
    if (stage === "stopped") f.close();
    if (stage === "frozen") f.database.freezeMainRouteFailure({ projectId: PROJECT, nodeRunId: "old-node", routeEpoch: 1, error: "fixture safety fence" });
    if (stage === "cancelled") f.database.appendEvent({ projectId: PROJECT, eventId: "evt_cancel_fixture", agentId: "main", type: "project.cancellation.requested", requestId: "stop-intent", payload: { actor: "user", reason: "fixture user Stop", resumable: true } });
    expect(() => f.database.completeTerminalPushObservation({ ...f.turn, envelope: f.envelope() })).toThrow();
    expect(f.database.terminalPushObservationTurns(PROJECT)[0].completion).toBeUndefined();
    await expect(fs.access(path.join(f.projectPath, "runtime", f.turn.invocationId, "terminal-push-observation", "finish.json"))).rejects.toThrow();
  });

  it.each(["wrong-agent", "wrong-execution", "wrong-epoch", "wrong-invocation", "envelope-project", "envelope-agent", "envelope-invocation",
    "envelope-version", "missing-hash", "bad-time", "bad-call-id", "wrong-tool", "empty-memory", "large-memory"] as const)("rejects %s completion before recording any Agent effect", async invalid => {
    const f = await fixture(); const input = { ...f.turn, envelope: f.envelope() };
    if (invalid === "wrong-agent") input.agentId = "peer";
    if (invalid === "wrong-execution") input.executionId = "other";
    if (invalid === "wrong-epoch") input.ownershipEpoch += 1;
    if (invalid === "wrong-invocation") input.invocationId = "inv_wrong_native";
    if (invalid === "envelope-project") input.envelope.projectId = `prj_${"e".repeat(32)}`;
    if (invalid === "envelope-agent") input.envelope.agent = "peer";
    if (invalid === "envelope-invocation") input.envelope.invocationId = "inv_wrong_native";
    if (invalid === "envelope-version") input.envelope.stateVersion += 1;
    if (invalid === "missing-hash") delete input.envelope.capabilityHash;
    if (invalid === "bad-time") input.envelope.receivedAt = "bad";
    if (invalid === "bad-call-id") input.envelope.callId = "bad call";
    if (invalid === "wrong-tool") input.envelope.action = { tool: "git_push" };
    if (invalid === "empty-memory") input.envelope = f.envelope(" ");
    if (invalid === "large-memory") input.envelope = f.envelope("x".repeat(100_001));
    expect(() => f.database.completeTerminalPushObservation(input)).toThrow();
    expect(f.database.terminalPushObservationTurns(PROJECT)[0].completion).toBeUndefined();
    expect(f.database.recordedGitOperation(PROJECT, "original-push")!.status).toBe("uncertain");
  });

  it("preserves actual supplemental output after tool revocation without ending the old task or declaring physical Stop", async () => {
    const f = await fixture();
    f.database.freezeMainRouteFailure({ projectId: PROJECT, nodeRunId: "old-node", routeEpoch: 1, error: "freeze while native returns" });
    const before = oldBusiness(f.database.projectState(PROJECT));
    const result = f.database.recordTerminalPushObservationResult({ ...f.turn, output: "The actual final Agent output" });
    expect(f.database.recordTerminalPushObservationResult({ ...f.turn, output: result.output })).toEqual(result);
    expect(() => f.database.recordTerminalPushObservationResult({ ...f.turn, output: "changed output" })).toThrow(/result changed/);
    expect(f.database.terminalPushObservationTurns(PROJECT)[0]).toMatchObject({ status: "opened", result });
    expect(oldBusiness(f.database.projectState(PROJECT))).toEqual(before);
    f.close();
    expect(f.database.terminalPushObservationTurns(PROJECT)[0]).toMatchObject({ status: "stopped", result });
    expect(() => f.database.recordTerminalPushObservationResult({ ...f.turn, output: result.output })).toThrow();
  });

  it.each(["before-snapshot", "before-receipt"] as const)("restores a %s crash gap solely from the accepted S receipt, even after native Stop", async phase => {
    const f = await fixture(); const completion = f.database.completeTerminalPushObservation({ ...f.turn, envelope: f.envelope() });
    if (phase === "before-receipt") {
      const dir = path.join(f.projectPath, "runtime", f.turn.invocationId, "terminal-push-observation"); await fs.mkdir(dir, { recursive: true }); await fs.writeFile(path.join(dir, "Memory.md"), completion.memory!);
    }
    f.close(); const saved = await f.storage.saveTerminalPushObservationCompletion(f.database.terminalPushObservationTurns(PROJECT)[0].completion!);
    expect(JSON.parse(await fs.readFile(saved.receiptPath, "utf8"))).toEqual(completion);
    expect(await fs.readFile(saved.memoryPath!, "utf8")).toBe(completion.memory);
    expect(f.database.terminalPushObservationTurns(PROJECT)[0].status).toBe("stopped");
    expect(await fs.readFile(f.oldMemory, "utf8")).toBe("Retained original Agent memory\n");
    expect(f.database.terminalPushObservationRepairCount(PROJECT, "old-execution")).toBe(1);
  });

  it.for(["symlink-parent", "symlink-file", "hardlink-file", "changed-content", "changed-digest"] as const)("rejects %s materialization and preserves all prior bytes", async (invalid, context) => {
    const f = await fixture(); const completion = f.database.completeTerminalPushObservation({ ...f.turn, envelope: f.envelope() });
    const outside = path.join(f.root, "outside"); await fs.mkdir(outside); const outsideFile = path.join(outside, "original.txt"); await fs.writeFile(outsideFile, "unchanged outside");
    const dir = path.join(f.projectPath, "runtime", f.turn.invocationId, "terminal-push-observation");
    if (invalid === "symlink-parent") await fs.symlink(outside, path.join(f.projectPath, "runtime", f.turn.invocationId), process.platform === "win32" ? "junction" : "dir");
    else {
      await fs.mkdir(dir, { recursive: true });
      if (invalid === "symlink-file") {
        try { await fs.symlink(outsideFile, path.join(dir, "Memory.md")); } catch (error) {
          if (process.platform === "win32" && (error as NodeJS.ErrnoException).code === "EPERM") { context.skip(); return; }
          throw error;
        }
      }
      if (invalid === "hardlink-file") await fs.link(outsideFile, path.join(dir, "Memory.md"));
      if (invalid === "changed-content") await fs.writeFile(path.join(dir, "finish.json"), JSON.stringify({ ...completion, summary: "different" }));
    }
    await expect(f.storage.saveTerminalPushObservationCompletion(invalid === "changed-digest" ? { ...completion, memorySha256: "0".repeat(64) } : completion)).rejects.toThrow();
    expect(await fs.readFile(outsideFile, "utf8")).toBe("unchanged outside");
    expect(await fs.readdir(outside)).toEqual(["original.txt"]);
    expect(await fs.readFile(f.oldMemory, "utf8")).toBe("Retained original Agent memory\n");
  });

  it("production authority rejects unallocated actions and withdrawal before returning a provider result", async () => {
    const f = await fixture(); let revoked = false;
    const { authority } = await controlFor(f, async () => { if (revoked) throw new Error("coordinator revoked this observation"); });
    const envelope = { ...f.envelope(), capabilityHash: authority.control.capabilityHash! };
    for (const action of [{ tool: "git_push" }, { tool: "git_reconcile_push", operationId: "other", historical: true },
      { tool: "git_reconcile_push", operationId: "original-push", historical: true, retry: true }, { tool: "route_to_agent", target: "next", rationale: "wrong" }]) {
      await expect(authority.revalidate({ ...envelope, action } as ControlActionEnvelope, [])).rejects.toThrow(/exact live receipt authority/);
    }
    expect(f.database.terminalPushObservationTurns(PROJECT)[0].completion).toBeUndefined();
    f.observe.mockImplementation(async () => { revoked = true; return { owner: f.repository.owner, repository: f.repository.name,
      ref: f.turn.executionBranch, status: "missing", observedAt: new Date(f.clock.now).toISOString() }; });
    await expect(authority.execute!({ ...envelope, action: { tool: "git_reconcile_push", operationId: "original-push", historical: true } })).rejects.toThrow(/coordinator revoked/);
    expect(f.observe).toHaveBeenCalledOnce(); expect(f.push).not.toHaveBeenCalled(); expect(f.checkpoint).not.toHaveBeenCalled();
    expect(f.database.recordedGitOperation(PROJECT, "original-push")!.status).toBe("uncertain");
  });

  it("a fresh writer retains an accepted receipt and its memory while the old native capability stays fenced", async () => {
    const f = await fixture(); const completion = f.database.completeTerminalPushObservation({ ...f.turn, envelope: f.envelope() });
    f.clock.now += 120_000;
    const next = CollaborationStateDatabase.open({ databasePath: f.databasePath, serviceId: "receipt-test", instanceId: "new-writer",
      hostId: "test-host", topology: "single-host", now: () => f.clock.now }); databases.push(next);
    expect(() => next.completeTerminalPushObservation({ ...f.turn, envelope: f.envelope() })).toThrow();
    expect(next.terminalPushObservationTurns(PROJECT)[0].completion).toEqual(completion);
    const saved = await f.storage.saveTerminalPushObservationCompletion(next.terminalPushObservationTurns(PROJECT)[0].completion!);
    expect(await fs.readFile(saved.memoryPath!, "utf8")).toBe(completion.memory);
    expect(next.terminalPushObservationRepairCount(PROJECT, "old-execution")).toBe(1);
    expect(() => f.database.completeTerminalPushObservation({ ...f.turn, envelope: f.envelope() })).toThrow();
    expect(next.terminalPushObservationTurns(PROJECT)[0].status).toBe("opened");
  });
});
