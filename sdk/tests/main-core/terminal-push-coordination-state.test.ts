import { pathToFileURL as sdkFixtureFileURL } from "node:url";
import { promises as fs } from "node:fs";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { CollaborationStateDatabase } from "../../src/core/collaboration-state/store.js";
import type { BeginTerminalPushCoordinatorInput, TerminalPushCoordinatorTurn } from "../../src/core/collaboration-state/contracts.js";
import type { ControlAction, ControlActionEnvelope } from "../../src/core/types.js";
import type { AgentRunRequest, ProjectState } from "../../src/core/types.js";
import { ProjectStorage } from "../../src/core/storage.js";
import { EventHub } from "../../src/core/event-hub.js";
import { ControlActionService, startControlActionBridge } from "../../src/core/orchestration-control-bridge.js";
import { terminalPushCoordinationControlAuthorityFactory } from "../../src/core/terminal-push-coordination-control.js";
import { serializeInvocationControlContext } from "../../src/core/harness-runtime/runtime-support.js";
import { toolsFor, visibleToolNamesForPrompt, type CapabilityContext } from "../../src/core/orchestration-control-mcp.js";
import { compileInvocationPolicy, compileWorkflowPrompt } from "../../src/core/harness-runtime/invocation-policy.js";
import { HarnessRuntimeFacade } from "../../src/core/harness-runtime/runtime.js";
import type { ProjectStateEntry } from "../../src/core/project-state.js";

const PROJECT = `prj_${"c".repeat(32)}`;
const HEAD = "7".repeat(40);
const roots: string[] = [];
const databases: CollaborationStateDatabase[] = [];
afterEach(async () => {
  databases.splice(0).forEach(database => database.close());
  await Promise.all(roots.splice(0).map(root => fs.rm(root, { recursive: true, force: true })));
});

async function fixture(scope: "outer" | "legacy" | "closed" = "closed", leaders = ["root", "parent", "direct"], replaceLeaders = false, stateProjection = false, allowUserIntervention = true) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "receipt-coordination-")); roots.push(root);
  const databasePath = path.join(root, "state.sqlite"); const clock = { now: Date.now() };
  const ts = new Date(clock.now).toISOString();
  const open = (instanceId: string) => {
    const database = CollaborationStateDatabase.open({ databasePath, serviceId: "receipt-coordination-test", instanceId,
      hostId: "test-host", topology: "single-host", now: () => clock.now }); databases.push(database); return database;
  };
  let database = open("original-writer");
  database.createProject({ projectId: PROJECT, workflowRevision: 1, workerCapacity: 1, managementCapacity: 1,
    // State projection must use the scoped protocol for the historical scoped
    // records below. Older receipt-only tests deliberately retain their v2 fixture.
    workflowSnapshot: { schemaVersion: stateProjection && scope === "closed" ? 3 : 2, collaborations: [], allowUserIntervention },
    git: { enabled: true, status: "ready", repository: { owner: "example", name: "retained", private: true,
      defaultBranch: "main", htmlUrl: "https://github.com/example/retained", observedAt: ts, localPath: root } } });
  // Historical fixture only: setup immutable completed work and the original
  // uncertain push. Every tested transition below goes through production S.
  const raw = new DatabaseSync(databasePath); raw.exec("PRAGMA foreign_keys=ON");
  raw.prepare(`INSERT INTO node_runs(node_run_id,project_id,node_kind,node_id,agent_id,workflow_revision,
    activation_request_id,activation_payload_hash,input_snapshot_ref,activated_by_agent_id,status,activated_at,updated_at,completed_at)
    VALUES ('old-node',?,'agent','worker','worker',1,'old-activation','old-hash','old-input','main','completed',?,?,?)`).run(PROJECT,ts,ts,ts);
  if (scope === "legacy") raw.prepare(`INSERT INTO group_runs(group_run_id,node_run_id,member_snapshot_json,leader_agent_id,
    acting_coordinator_id,coordinator_epoch,base_commit,group_branch,status,started_at,updated_at,completed_at)
    VALUES ('old-group','old-node','["worker","direct"]','direct','main',3,?,'groups/old-group','completed',?,?,?)`).run(HEAD,ts,ts,ts);
  raw.prepare(`INSERT INTO work_tasks(task_id,node_run_id,group_run_id,assignment,assignee_agent_id,queue_ordinal,purpose,status,created_at,updated_at,completed_at)
    VALUES ('old-task','old-node',?,'Original completed assignment','worker',1,'delivery','succeeded',?,?,?)`).run(scope === "legacy" ? "old-group" : null,ts,ts,ts);
  const worktree = path.join(root,"project","git-worktrees","agents","worker");
  if (scope !== "closed") {
    raw.prepare(`INSERT INTO member_executions(execution_id,project_id,node_run_id,group_run_id,task_id,agent_id,purpose,ownership_epoch,status,
      execution_branch,worktree_path,queued_at,started_at,updated_at,completed_at,process_stop_confirmed,invocation_id,session_id)
      VALUES ('old-execution',?,'old-node',?,'old-task','worker','delivery',2,'succeeded','executions/old-execution',?,?,?,?,?,1,'inv_original_worker','original-worker-session')`)
      .run(PROJECT,scope === "legacy" ? "old-group" : null,worktree,ts,ts,ts,ts);
  } else {
    for (const [index,id] of ["G","H","J"].entries()) {
      raw.prepare(`INSERT INTO scoped_group_runs(group_run_id,project_id,group_id,parent_group_run_id,parent_arrival_id,
        activation_request_id,workflow_revision,workflow_snapshot_json,leader_agent_id,base_commit,group_branch,integration_target,status,created_at,updated_at)
        VALUES (?,?,?,?,?, ?,1,'{}',?,?,?,?,'completed',?,?)`).run(`run-${id}`,PROJECT,id,index ? `run-${index === 1 ? "G" : "H"}` : null,
          index ? `child-${index === 1 ? "G" : "H"}` : null,`activate-${id}`,leaders[index],HEAD,`groups/run-${id}`,index ? `groups/run-${index === 1 ? "G" : "H"}` : "main",ts,ts);
      raw.prepare(`INSERT INTO scoped_arrivals(request_id,group_run_id,source_run_id,target_node_id,target_kind,agent_id,child_group_id,node_run_id,status,created_at,updated_at)
        VALUES (?,?,?,?,?,?,?,?, 'completed',?,?)`).run(index === 2 ? "worker-arrival" : `child-${id}`,`run-${id}`,`input-${id}`,
          index === 2 ? "worker-node" : `child-${id}`,index === 2 ? "agent" : "collaboration",index === 2 ? "worker" : null,
          index === 2 ? null : index === 0 ? "H" : "J",index === 2 ? "old-node" : null,ts,ts);
      raw.prepare(`INSERT INTO project_events(project_id,seq,event_id,request_id,occurred_at,event_type,agent_id,payload_json)
        SELECT ?,next_event_seq,?,?,?,'scoped.group.activated',?,? FROM project_heads WHERE project_id=?`).run(PROJECT,`evt_activate_${id}`,`activate-${id}`,ts,
          leaders[index],JSON.stringify({groupRunId:`run-${id}`,parentGroupRunId:index ? `run-${index === 1 ? "G" : "H"}` : null}),PROJECT);
      raw.prepare("UPDATE project_heads SET next_event_seq=next_event_seq+1 WHERE project_id=?").run(PROJECT);
    }
    raw.prepare(`INSERT INTO scoped_executions(execution_id,project_id,group_run_id,arrival_request_id,agent_id,ownership_epoch,execution_branch,
      worktree_path,status,created_at,updated_at,completed_at) VALUES ('old-execution',?,'run-J','worker-arrival','worker',2,'executions/old-execution',?,'completed',?,?,?)`).run(PROJECT,worktree,ts,ts,ts);
    raw.prepare(`INSERT INTO scoped_agent_turns(execution_id,ownership_epoch,project_id,writer_lease_epoch,invocation_id,runtime_path,base_commit,status,created_at,opened_at,stopped_at)
      VALUES ('old-execution',2,?,?,'inv_original_worker',?,?,'stopped',?,?,?)`).run(PROJECT,database.writerLease().epoch,path.join(root,"runtime","inv_original_worker"),HEAD,ts,ts,ts);
  }
  if(replaceLeaders)raw.prepare("UPDATE scoped_group_runs SET leader_agent_id='replacement'").run();
  raw.prepare(`INSERT INTO ${scope === "closed" ? "scoped_operations" : "operations"}(operation_id,project_id,kind,payload_hash,status,owner_execution_id,
    ownership_epoch,expected_head,expected_base,created_at,updated_at) VALUES ('original-push',?,'git.push',?,'uncertain','old-execution',1,?,'executions/old-execution',?,?)`).run(PROJECT,"a".repeat(64),HEAD,ts,ts);
  for (const attempt of [1,2]) {
    raw.prepare(`INSERT INTO project_events(project_id,seq,event_id,request_id,occurred_at,event_type,agent_id,execution_id,ownership_epoch,payload_json)
      SELECT ?,next_event_seq,?,?,?,?,'worker',?,?,? FROM project_heads WHERE project_id=?`).run(PROJECT,`evt_repair_${attempt}`,`old-repair-${attempt}`,ts,
      scope === "closed" ? "scoped.agent.mechanism_repair.requested" : "execution.mechanism_repair.requested",
      scope === "closed" ? null : "old-execution",scope === "closed" ? null : 2,JSON.stringify({executionId:"old-execution",attempt,ownershipEpoch:2}),PROJECT);
    raw.prepare("UPDATE project_heads SET next_event_seq=next_event_seq+1 WHERE project_id=?").run(PROJECT);
  }
  raw.close();
  const unresolved = "original-unresolved";
  database.appendEvent({projectId:PROJECT,eventId:"evt_original_unresolved",requestId:unresolved,agentId:"worker",type:"agent.terminal_push_observation.unresolved",
    payload:{executionId:"old-execution",ownershipEpoch:2,operationId:"original-push",nativeStopped:true,
      nativeStop:{invocationId:"inv_original_worker",runtimePath:path.join(root,"runtime","inv_original_worker"),evidence:{fixtureTrustedNativeAbsence:true}}}});
  const input = {projectId:PROJECT,executionId:"old-execution",ownershipEpoch:2,operationId:"original-push",unresolvedRequestId:unresolved};
  const incident = database.recordTerminalPushCoordinationIncident(input);
  let sequence = 0;
  const reserveInput = (level = database.terminalPushCoordinationIncidents(PROJECT)[0].level, allowUserIntervention = false): BeginTerminalPushCoordinatorInput => {
    const agentId = incident.coordinators[level].agentId;
    const previous = database.terminalPushCoordinatorTurns(PROJECT).filter(turn => turn.agentId === agentId).at(-1);
    const invocationId = `inv_coordinator_${++sequence}`;
    const previousInvocationId = previous?.invocationId ?? `inv_original_${agentId}`;
    const userResponse = database.terminalPushCoordinationIncidents(PROJECT)[0].userResponse;
    return {projectId:PROJECT,incidentId:incident.id,agentId,invocationId,level,capabilityHash:"b".repeat(64),allowUserIntervention,
      ...(userResponse ? { userResponseRequestId: userResponse.requestId } : {}),
      previousInvocationId,previousRuntimePath:previous?.runtimePath ?? path.join(root,"runtime",previousInvocationId),runtimePath:path.join(root,"runtime",invocationId),
      worktreePath:previous?.worktreePath ?? path.join(root,"project","git-worktrees","agents",agentId),residentStopConfirmed:true,evidence:{fixtureTrustedPriorManagerAbsence:true}};
  };
  const begin = (level?: number, allow = false) => { const input=reserveInput(level,allow); const turn=database.beginTerminalPushCoordinator(input)!; expect(turn).toBeDefined(); database.assertTerminalPushCoordinatorLaunch({...turn,runtimePath:input.runtimePath}); database.markTerminalPushCoordinatorOpened({...turn,nativeProcessOpened:true}); return turn; };
  const envelope = (turn:TerminalPushCoordinatorTurn,action:ControlAction):ControlActionEnvelope => ({schemaVersion:1,projectId:PROJECT,agent:turn.agentId,
    invocationId:turn.invocationId,callId:`call-${action.tool}`,stateVersion:turn.coordinatorEpoch,capabilityHash:turn.capabilityHash,receivedAt:ts,action});
  const stage = (turn:TerminalPushCoordinatorTurn,action:ControlAction) => database.stageTerminalPushCoordinatorAction({...turn,controlCapabilityHash:turn.capabilityHash,envelope:envelope(turn,action)});
  const finish = (turn:TerminalPushCoordinatorTurn) => stage(turn,{tool:"finish_task",summary:"I reviewed the original receipt",memory:"My actual coordination memory"});
  const result = (turn:TerminalPushCoordinatorTurn) => database.recordTerminalPushCoordinatorResult({...turn,output:"Actual manager handoff",handoffPath:path.join(root,"messages",`${turn.invocationId}.md`)});
  const stop = (turn:TerminalPushCoordinatorTurn) => database.stopTerminalPushCoordinator({...turn,residentStopConfirmed:true,evidence:{fixtureTrustedManagerAbsence:true}});
  const decide = (turn:TerminalPushCoordinatorTurn, operation:"retry"|"escalate") => stage(turn,{tool:"coordinate_agent_receipt",incidentId:incident.id,operation,rationale:"My explicit coordination choice"});
  const accept = (turn:TerminalPushCoordinatorTurn) => database.acceptTerminalPushCoordinatorDecision(turn);
  const closeChoice = (turn:TerminalPushCoordinatorTurn,operation:"retry"|"escalate") => { finish(turn); decide(turn,operation); result(turn); stop(turn); return accept(turn); };
  const reload = () => { database.close(); clock.now += 120_000; database=open(`writer-${++sequence}`); return database; };
  return {root,databasePath,get database(){return database;},incident,input,reserveInput,begin,envelope,stage,finish,result,stop,decide,accept,closeChoice,reload,worktree,ts};
}

function business(database:CollaborationStateDatabase) {
  const s=database.projectState(PROJECT);
  return {activeNodeRunId:s.activeNodeRunId,nodeRuns:s.nodeRuns,groupRuns:s.groupRuns,scopedGroups:s.scopedGroupRuns,
    tasks:s.tasks,executions:s.executions,scopedExecutions:s.scopedExecutions,scopedArrivals:s.scopedArrivals,pulls:s.pullRequests,
    operations:s.operations,lanes:s.laneLeases,workflowRevision:s.workflowRevision,workflow:s.workflowSnapshot};
}

async function managerControl(role: "leader" | "main" | "main-as-leader" = "leader", allowUser = false) {
  const f = role === "main" ? await fixture("outer") : await fixture("closed", ["root", "parent", role === "main-as-leader" ? "main" : "direct"]);
  const secret = "invocation-bound-coordination-secret";
  const input = { ...f.reserveInput(0, allowUser), capabilityHash: createHash("sha256").update(secret).digest("hex") };
  const turn = f.database.beginTerminalPushCoordinator(input)!;
  f.database.markTerminalPushCoordinatorOpened({ ...turn, nativeProcessOpened: true });
  const storage = new ProjectStorage(path.join(f.root, "data"), new EventHub()); await storage.initialize();
  await fs.mkdir(storage.projectDir(PROJECT), { recursive: true });
  const oldMemory = path.join(storage.projectDir(PROJECT), "workspaces", "agent-memory", turn.agentId, "Memory.md");
  await fs.mkdir(path.dirname(oldMemory), { recursive: true }); await fs.writeFile(oldMemory, "Original persistent role memory\n");
  const config = { harness: "codex", instructions: "Build the business product and publish its code", permission: "yolo", sessionPersistence: false,
    skills: [], autoSkills: [], mcpServers: [], webSearch: true };
  const state = { id: PROJECT, status: "running", phase: "workflow", orchestration: { allowUserIntervention: true },
    agents: { [turn.agentId]: config }, git: { enabled: true } } as unknown as ProjectState;
  const scope = { incidentId: turn.incidentId, coordinatorEpoch: turn.coordinatorEpoch, level: turn.level,
    role: role === "main" ? "main" as const : "leader" as const, canRequestUser: allowUser };
  const request = { project: state, agent: turn.agentId, kind: turn.agentId === "main" ? "main" : "worker",
    invocationId: turn.invocationId, runtimePath: turn.runtimePath, workspacePath: turn.worktreePath,
    permission: "workspace", skillPaths: [], autoSkillPaths: [], sessionContinuity: "strict", terminalPushCoordination: scope,
    executionContext: { role: "leader", coordinatorEpoch: turn.coordinatorEpoch, routeScopeId: "running-workflow" } } as AgentRunRequest;
  const factory = await terminalPushCoordinationControlAuthorityFactory({ state, database: f.database, storage,
    coordination: turn, capability: secret, assertCurrent() {} });
  const authority = await factory({ request,
    turn: { invocationId: turn.invocationId, inputId: "manager-input", prompt: "Decide this exact receipt issue" } });
  const control = authority.control;
  const service = new ControlActionService({ projectId: PROJECT, agent: turn.agentId, invocationId: turn.invocationId,
    stateVersion: turn.coordinatorEpoch, capability: control.capability, capabilityHash: control.capabilityHash,
    stagingPath: control.stagingPath, revalidate: authority.revalidate });
  await fs.mkdir(path.dirname(control.stagingPath), { recursive: true });
  const bridge = await startControlActionBridge(service, path.dirname(control.stagingPath));
  const context = JSON.parse(serializeInvocationControlContext({ ...control, bridgePath: bridge.endpoint.path,
    bridgeHost: bridge.endpoint.host, bridgePort: bridge.endpoint.port }, { projectId: PROJECT, agent: turn.agentId,
    invocationId: turn.invocationId, kind: request.kind, workspacePath: request.workspacePath })) as CapabilityContext;
  const call = (name: string, args: Record<string, unknown>) => ({ method: "tools/call", params: { name, arguments: args } });
  const run = async (requests: Array<Record<string, unknown>>, overrides: Record<string, unknown> = {}) => {
    const source = fileURLToPath(new URL("../../src/core/orchestration-control-mcp.ts", import.meta.url));
    const loader = sdkFixtureFileURL(createRequire(import.meta.url).resolve("tsx")).href;
    const child = spawn(process.execPath, ["--import", loader, source], { env: { ...process.env,
      SCIENCEEVOLVE_CONTROL_CONTEXT: JSON.stringify({ ...context, ...overrides }), SCIENCEEVOLVE_CONTROL_CAPABILITY: control.capability }, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = ""; let stderr = "";
    child.stdout.on("data", value => { stdout += String(value); }); child.stderr.on("data", value => { stderr += String(value); });
    const ended = new Promise<void>((resolve, reject) => { child.once("error", reject); child.once("close", code => code ? reject(new Error(stderr)) : resolve()); });
    child.stdin.end(requests.map((entry, i) => JSON.stringify({ id: i + 1, ...entry })).join("\n") + "\n");
    await ended;
    return stdout.trim().split("\n").filter(Boolean).map(line => JSON.parse(line) as { result?: { tools?: { name: string }[]; isError?: boolean }; error?: unknown });
  };
  return { f, turn, storage, oldMemory, state, request, scope, authority, factory, context, bridge, call, run };
}

describe("running-workflow receipt coordinator MCP transport", () => {
  it("rotates input capabilities while retaining its grant, accepted finish and exact historical envelope", async () => {
    const m = await managerControl();
    try {
      const first: ControlActionEnvelope = { ...m.f.envelope(m.turn, { tool: "finish_task", summary: "Original accepted finish" }),
        capabilityHash: m.authority.control.capabilityHash };
      await m.authority.revalidate(first, []);
      const next = await m.factory({ request: m.request,
        turn: { invocationId: m.turn.invocationId, inputId: "manager-input:process-cleanup:1", prompt: "Continue the same task" } });
      expect(next.control.capability).not.toBe(m.authority.control.capability);
      expect(next.control.capabilityHash).not.toBe(m.authority.control.capabilityHash);
      expect(next.control.stagingPath).not.toBe(m.authority.control.stagingPath);
      await expect(m.authority.revalidate(first, [])).rejects.toThrow("live manager authority");
      await expect(next.revalidate(first, [])).rejects.toThrow("live manager authority");
      const decision = { ...m.f.envelope(m.turn, { tool: "coordinate_agent_receipt", incidentId: m.turn.incidentId,
        operation: "retry", rationale: "My original receipt still needs observation" }), capabilityHash: next.control.capabilityHash };
      await next.revalidate(decision, []);
      const current = m.f.database.terminalPushCoordinatorTurns(PROJECT)[0];
      expect(current.capabilityHash).toBe(m.turn.capabilityHash);
      expect(current.completion).toEqual(first);
      expect(current.stagedDecision).toEqual(decision);
      expect(() => m.f.database.stageTerminalPushCoordinatorAction({ ...m.turn, capabilityHash: "f".repeat(64),
        controlCapabilityHash: next.control.capabilityHash!, envelope: decision })).toThrow("exact native capability");
    } finally { await m.bridge.close(); }
  });

  it("materializes a Chinese coordinator's accepted completion without changing its identity", async () => {
    const f = await fixture("closed", ["root", "parent", "观测总师"]);
    const input = f.reserveInput();
    input.previousInvocationId = "inv_original_manager";
    input.previousRuntimePath = path.join(f.root, "runtime", input.previousInvocationId);
    const turn = f.database.beginTerminalPushCoordinator(input)!;
    f.database.markTerminalPushCoordinatorOpened({ ...turn, nativeProcessOpened: true });
    f.finish(turn);
    const accepted = f.database.terminalPushCoordinatorTurns(PROJECT).find(entry => entry.invocationId === turn.invocationId)!;
    const storage = new ProjectStorage(path.join(f.root, "data"), new EventHub()); await storage.initialize();
    await fs.mkdir(storage.projectDir(PROJECT), { recursive: true });
    const before = business(f.database);
    const saved = await storage.saveTerminalPushCoordinatorCompletion(accepted);
    const receipt = JSON.parse(await fs.readFile(saved.receiptPath, "utf8"));
    expect(receipt).toMatchObject({ agentId: "观测总师", completion: accepted.completion });
    expect(await fs.readFile(saved.memoryPath!, "utf8")).toBe("My actual coordination memory");
    expect(await storage.saveTerminalPushCoordinatorCompletion(accepted)).toEqual(saved);
    expect(business(f.database)).toEqual(before);
  });

  it.each(["leader", "main", "main-as-leader"] as const)("allocates only the %s role's tools and saves that Agent's own finish/memory", async role => {
    const m = await managerControl(role, role === "main");
    const before = business(m.f.database);
    try {
      const decision = role === "main" ? m.call("request_user", { callId: "ask", message: "Please decide this receipt blocker", rationale: "The actual evidence is inconclusive" })
        : m.call("coordinate_agent_receipt", { callId: "escalate", incidentId: m.turn.incidentId, operation: "escalate", rationale: "My direct parent should inspect this evidence" });
      const replies = await m.run([{ method: "tools/list" }, m.call("finish_task", { callId: "finish", summary: "I inspected the evidence", memory: "My actual coordination memory" }), decision]);
      const names = replies[0].result?.tools?.map(tool => tool.name);
      expect(names).toEqual(role === "main" ? ["finish_task", "coordinate_agent_receipt", "request_user"] : ["finish_task", "coordinate_agent_receipt"]);
      expect(visibleToolNamesForPrompt(m.authority.control, m.request.kind)).toEqual(names);
      expect(replies.slice(1).every(reply => !reply.error && !reply.result?.isError)).toBe(true);
      expect(business(m.f.database)).toEqual(before);
      const current = m.f.database.terminalPushCoordinatorTurns(PROJECT)[0];
      expect(current.completion?.action).toMatchObject({ tool: "finish_task", memory: "My actual coordination memory" });
      expect(current.stagedDecision?.action.tool).toBe(role === "main" ? "request_user" : "coordinate_agent_receipt");
      const actions = JSON.parse(await fs.readFile(m.authority.control.stagingPath, "utf8")) as ControlActionEnvelope[];
      const returned = { handoff: "My actual coordination handoff", controlActions: actions };
      const request = { ...m.request, control: m.authority.control };
      const facade = new HarnessRuntimeFacade();
      expect(facade.validateResidentTurnResult(returned, request)).toEqual(returned);
      const wrong = structuredClone(returned); wrong.controlActions[1].action = { tool: "coordinate_agent_receipt",
        incidentId: "another-issue", operation: "retry", rationale: "Unassigned issue" };
      expect(() => facade.validateResidentTurnResult(wrong, request)).toThrow();
      expect(() => facade.validateResidentTurnResult(returned, { ...request,
        control: { ...m.authority.control, terminalPushCoordination: undefined } })).toThrow();
      const directory = path.join(m.storage.projectDir(PROJECT), "runtime", m.turn.invocationId, "terminal-push-coordination");
      expect(await fs.readFile(path.join(directory, "Memory.md"), "utf8")).toBe("My actual coordination memory");
      expect(JSON.parse(await fs.readFile(path.join(directory, "finish.json"), "utf8")).completion).toEqual(current.completion);
      expect(await fs.readFile(m.oldMemory, "utf8")).toBe("Original persistent role memory\n");
      expect(() => m.f.accept(m.turn)).toThrow(/own finish, actual output and physical Stop/);
      m.f.result(m.turn); m.f.stop(m.turn); m.f.accept(m.turn);
      expect(m.f.database.terminalPushCoordinationIncidents(PROJECT)[0].status).toBe(role === "main" ? "waiting-user" : "open");
      expect(business(m.f.database)).toEqual(before);
    } finally { await m.bridge.close(); }
  });

  it("rejects foreign incidents, business tools, user calls from a Leader and extra fields before recording anything", async () => {
    const m = await managerControl("main-as-leader");
    try {
      const replies = await m.run([
        m.call("coordinate_agent_receipt", { callId: "foreign", incidentId: "unrelated", operation: "retry", rationale: "Wrong issue" }),
        m.call("coordinate_agent_receipt", { callId: "unknown-op", incidentId: m.turn.incidentId, operation: "skip", rationale: "Skip work" }),
        m.call("coordinate_agent_receipt", { callId: "extra", incidentId: m.turn.incidentId, operation: "retry", rationale: "My decision", target: "worker" }),
        m.call("request_user", { callId: "user", message: "Wake user", rationale: "Not granted" }),
        m.call("route_to_agent", { callId: "route", target: "main", rationale: "Wake arbitrary Main" }),
        m.call("git_push", { callId: "push" }), m.call("complete_project", { callId: "complete", rationale: "End project" }),
        m.call("finish_task", { callId: "fake-finish", memory: "Invalid receipt", taskId: "foreign" })
      ]);
      expect(replies.every(reply => reply.result?.isError || reply.error)).toBe(true);
      expect(m.f.database.terminalPushCoordinatorTurns(PROJECT)[0]).not.toHaveProperty("completion");
      expect(m.f.database.terminalPushCoordinatorTurns(PROJECT)[0]).not.toHaveProperty("stagedDecision");
      await expect(fs.stat(path.join(m.storage.projectDir(PROJECT), "runtime", m.turn.invocationId))).rejects.toMatchObject({ code: "ENOENT" });
    } finally { await m.bridge.close(); }
  });

  it("normal Main does not expose or accept the internal coordination tool even when it can complete a project", async () => {
    const m = await managerControl("main", true);
    try {
      const replies = await m.run([{ method: "tools/list" }, m.call("coordinate_agent_receipt", { callId: "unallocated", incidentId: m.turn.incidentId,
        operation: "retry", rationale: "Not my assigned tool" })], { terminalPushCoordination: undefined, canComplete: true });
      expect(replies[0].result?.tools?.map(tool => tool.name)).not.toContain("coordinate_agent_receipt");
      expect(replies[1].result?.isError).toBe(true);
      expect(m.f.database.terminalPushCoordinatorTurns(PROJECT)[0]).not.toHaveProperty("stagedDecision");
    } finally { await m.bridge.close(); }
  });

  it("equivalent repeats retain the first receipt and a changed decision cannot replace it", async () => {
    const m = await managerControl();
    try {
      const finish = { summary: "I inspected the issue", memory: "My first memory" };
      const retry = { incidentId: m.turn.incidentId, operation: "retry", rationale: "Inspect the provider evidence again" };
      const replies = await m.run([
        m.call("finish_task", { callId: "finish-first", ...finish }), m.call("finish_task", { callId: "finish-repeat", ...finish }),
        m.call("coordinate_agent_receipt", { callId: "retry-first", ...retry }), m.call("coordinate_agent_receipt", { callId: "retry-repeat", ...retry }),
        m.call("coordinate_agent_receipt", { callId: "changed", ...retry, operation: "escalate" })
      ]);
      expect(replies.slice(0, 4).every(reply => !reply.error && !reply.result?.isError)).toBe(true);
      expect(replies[4].result?.isError).toBe(true);
      const current = m.f.database.terminalPushCoordinatorTurns(PROJECT)[0];
      expect(current.completion?.callId).toBe("finish-first"); expect(current.stagedDecision?.callId).toBe("retry-first");
      expect(await fs.readFile(m.oldMemory, "utf8")).toBe("Original persistent role memory\n");
    } finally { await m.bridge.close(); }
  });

  it("revokes the stopped manager's tool authority without minting a finish receipt", async () => {
    const m = await managerControl();
    try {
      m.f.stop(m.turn);
      const replies = await m.run([m.call("finish_task", { callId: "late", memory: "Late memory" })]);
      expect(replies[0].result?.isError).toBe(true);
      expect(m.f.database.terminalPushCoordinatorTurns(PROJECT)[0]).not.toHaveProperty("completion");
    } finally { await m.bridge.close(); }
  });

  it("does not extend the new coordination control to a completed project", async () => {
    const m = await managerControl();
    try {
      m.state.status = "completed";
      const replies = await m.run([m.call("finish_task", { callId: "after-project-finish", memory: "Not accepted" })]);
      expect(replies[0].result?.isError).toBe(true);
      expect(m.f.database.terminalPushCoordinatorTurns(PROJECT)[0]).not.toHaveProperty("completion");
    } finally { await m.bridge.close(); }
  });

  it("restricts Main user help to its explicit grant and rejects mixed scope authority", async () => {
    const m = await managerControl("main");
    try {
      const context = { ...m.context, secret: "catalog-only" };
      expect(toolsFor(context).map(tool => tool.name)).toEqual(["finish_task", "coordinate_agent_receipt"]);
      for (const extra of [{ allowAgentGitActions: true }, { terminalPushObservation: { operationId: "original-push" } },
        { candidates: ["worker"] }, { mainCapabilities: {} }, { stateVersion: m.turn.coordinatorEpoch + 1 },
        { agent: "other-agent" }, { terminalPushCoordination: { ...m.scope, unexpected: true } }]) {
        expect(() => toolsFor({ ...context, ...extra } as CapabilityContext)).toThrow(/exact manager-only/);
      }
      const replies = await m.run([m.call("request_user", { callId: "not-granted", message: "Help", rationale: "Missing user grant" })]);
      expect(replies[0].result?.isError).toBe(true);
    } finally { await m.bridge.close(); }
  });

  it("revokes a live receipt Main's user request when the user disables intervention", async () => {
    const m = await managerControl("main", true);
    try {
      m.state.orchestration.allowUserIntervention = false;
      const replies = await m.run([m.call("request_user", { callId: "disabled-live", message: "Help", rationale: "Old grant" })]);
      expect(replies[0].result?.isError).toBe(true);
      expect(JSON.stringify(replies[0])).toContain("User intervention is disabled");
      expect(m.f.database.terminalPushCoordinatorTurns(PROJECT)[0].stagedDecision).toBeUndefined();
    } finally { await m.bridge.close(); }
  });

  it("gives the coordinator its current role and restores the same Agent's business mandate on a later Worker invocation", async () => {
    const m = await managerControl();
    try {
      const request = { ...m.request, control: m.authority.control }; const config = m.state.agents[m.turn.agentId];
      const inputs = { projectPath: "/test/project", workspacePath: request.workspacePath, runtimePath: request.runtimePath,
        inboxPath: "/test/inbox", memoryPath: "/test/memory", schemaPath: "/test/schema" };
      const policy = compileInvocationPolicy(config, request);
      const prompt = compileWorkflowPrompt(request, inputs, policy);
      expect(policy).toMatchObject({ permission: "workspace", webSearch: false, skillPaths: [], autoSkillPaths: [], mcpServers: [] });
      expect(prompt).toContain("coordinate_agent_receipt"); expect(prompt).toContain("direct parent coordinator");
      expect(prompt).not.toContain(config.instructions);
      const worker = { ...request, terminalPushCoordination: undefined, control: undefined, permission: "yolo" as const,
        executionContext: undefined };
      const laterPolicy = compileInvocationPolicy(config, worker);
      const laterPrompt = compileWorkflowPrompt(worker, inputs, laterPolicy);
      expect(laterPolicy.permission).toBe("yolo"); expect(laterPrompt).toContain(config.instructions);
      expect(laterPrompt).not.toContain("wake reason: terminal-push-coordination"); expect(config.sessionPersistence).toBe(false);
    } finally { await m.bridge.close(); }
  });
});

describe("historical terminal receipt coordination state", () => {
  it("restores a historical scoped coordinator from its original root node when nested Agent arrivals have no node row", async () => {
    const f = await fixture("closed", undefined, false, true);
    const raw = new DatabaseSync(f.databasePath);
    try {
      raw.prepare("UPDATE scoped_arrivals SET node_run_id=NULL WHERE request_id='worker-arrival'").run();
      raw.prepare("UPDATE node_runs SET activation_request_id='activate-G' WHERE node_run_id='old-node'").run();
    } finally { raw.close(); }
    expect(f.database.terminalPushOwnerNodeRunId(PROJECT, "old-execution")).toBe("old-node");
    const turn = f.begin();
    expect(f.database.projectState(PROJECT).runtimeActivities).toContainEqual(expect.objectContaining({
      invocationId: turn.invocationId, scopeKind: "terminal-push-coordinator", nodeRunId: "old-node", leaseState: "current"
    }));
    f.reload();
    expect(f.database.projectState(PROJECT).runtimeActivities).toContainEqual(expect.objectContaining({
      invocationId: turn.invocationId, scopeKind: "terminal-push-coordinator", nodeRunId: "old-node", leaseState: "recovering"
    }));
  });

  it.each(["closed", "legacy"] as const)("keeps the current receipt Leader's exact %s group write scope and project-wide read access", async scope => {
    const f = await fixture(scope, undefined, false, true), turn = f.begin();
    const principal = { kind: "agent" as const, projectId: PROJECT, agentId: turn.agentId, invocationId: turn.invocationId };
    const object = { kind: "group" as const, id: scope === "closed" ? "run-J" : "old-group" };
    const current = f.database.projectStateRequest(principal, { operation: "get", object }) as ProjectStateEntry;
    expect(current.access).toMatchObject({ role: "leader", canWrite: true });
    const project = f.database.projectStateRequest(principal, { operation: "get", object: { kind: "project", id: PROJECT } }) as ProjectStateEntry;
    expect(project.access).toMatchObject({ role: "leader", canWrite: false });
    const before = business(f.database);
    f.database.projectStateRequest(principal, { operation: "patch", object, expectedVersion: current.version,
      set: { receipt_review: "Leader's own assessment" }, reason: "Review exact retained facts", callId: "own-group" });
    expect(() => f.database.projectStateRequest(principal, { operation: "patch", object: project.object, expectedVersion: project.version,
      set: { forbidden: true }, reason: "Outside this Leader's group", callId: "outside" })).toThrow(/responsible Leader/);
    const owner = f.database.projectStateRequest(principal, { operation: "get", object: { kind: "execution", id: "old-execution" } }) as ProjectStateEntry;
    expect(() => f.database.projectStateRequest(principal, { operation: "request_main", object: owner.object, expectedVersion: owner.version,
      sourceIssueId: "another-key-state-issue", reason: "A receipt-only role cannot obtain another management action", callId: "forged-action" }))
      .toThrow(expect.objectContaining({ code: "STATE_SCOPE_DENIED" }));
    expect(business(f.database)).toEqual(before);
    if (scope === "closed") expect((f.database.projectStateRequest(principal, { operation: "get", object: { kind: "group", id: "run-G" } }) as ProjectStateEntry).access.canWrite).toBe(false);
  });

  it("derives Main-as-Leader and later global Main from the exact current receipt level, retaining recursive scope and revoking old connections", async () => {
    const f = await fixture("closed", ["main", "main", "main"], false, true);
    for (let level = 0; level <= 3; level++) {
      const turn = f.begin(level), principal = { kind: "agent" as const, projectId: PROJECT, agentId: "main", invocationId: turn.invocationId };
      const get = (kind: "group" | "project", id: string) => f.database.projectStateRequest(principal, { operation: "get", object: { kind, id } }) as ProjectStateEntry;
      expect(get("group", "run-J").access).toMatchObject({ role: level === 3 ? "main" : "leader", canWrite: true });
      expect(get("group", "run-G").access.canWrite).toBe(level >= 2);
      expect(get("project", PROJECT).access.canWrite).toBe(level === 3);
      if (level < 3) {
        f.closeChoice(turn, "escalate");
        expect(() => get("group", "run-J")).toThrow(/live invocation/);
      }
    }
  });

  it.each(["outer","legacy","closed"] as const)("records the original %s hierarchy without reopening completed work",async scope=>{
    const f=await fixture(scope); const before=business(f.database);
    const expected=scope === "outer" ? ["main"] : scope === "legacy" ? ["direct","main"] : ["direct","parent","root","main"];
    expect(f.incident.coordinators.map(entry=>entry.agentId)).toEqual(expected);
    expect(f.incident.coordinators.at(-1)).toEqual({agentId:"main",role:"main"});
    expect(f.database.recordTerminalPushCoordinationIncident(f.input)).toEqual(f.incident);
    expect(f.database.terminalPushObservationRepairCount(PROJECT,"old-execution")).toBe(2);
    expect(f.database.authoritativeWorkflowFiles(PROJECT).currentState.terminalPushCoordinationIncidents).toEqual([f.incident]);
    expect(f.database.authoritativeWorkflowFiles(PROJECT).currentState.terminalPushObservationOperations?.[0].id).toBe("original-push");
    expect(business(f.database)).toEqual(before);
    expect(before.activeNodeRunId).toBeUndefined();
    expect(f.database.scopedGroupIssues(PROJECT)).toEqual([]);
  });

  it("preserves each closed-group level even when Leaders share an identity, including Main as Leader",async()=>{
    const f=await fixture("closed",["main","shared","shared"]); const before=business(f.database);
    expect(f.incident.coordinators).toEqual([{agentId:"shared",role:"leader",groupRunId:"run-J"},{agentId:"shared",role:"leader",groupRunId:"run-H"},
      {agentId:"main",role:"leader",groupRunId:"run-G"},{agentId:"main",role:"main"}]);
    for(let level=0;level<3;level++) f.closeChoice(f.begin(level),"escalate");
    const turn=f.begin(3,true); f.finish(turn); f.stage(turn,{tool:"request_user",message:"Please decide the unresolved receipt",rationale:"Every original level escalated"});
    f.result(turn); f.stop(turn); f.accept(turn);
    expect(f.database.terminalPushCoordinationIncidents(PROJECT)[0]).toMatchObject({level:3,status:"waiting-user"});
    expect(f.database.terminalPushCoordinatorTurns(PROJECT).every(turn=>turn.status==="stopped")).toBe(true);
    expect(business(f.database)).toEqual(before);
  });

  it.each(["opened","missing-finish","missing-result"] as const)("does not accept a coordinator choice at the %s boundary",async boundary=>{
    const f=await fixture(); const turn=f.begin(); const before=business(f.database);
    f.decide(turn,"retry"); if(boundary!=="missing-finish") f.finish(turn); if(boundary!=="missing-result") f.result(turn); if(boundary!=="opened") f.stop(turn);
    expect(()=>f.accept(turn)).toThrow(/own finish, actual output and physical Stop/);
    expect(f.database.terminalPushObservationContinuation(PROJECT,"old-execution","original-push")).toBeUndefined();
    expect(f.database.terminalPushCoordinationIncidents(PROJECT)[0].status).toBe("open");
    expect(business(f.database)).toEqual(before);
  });

  it.each(["outer","legacy","closed"] as const)("consumes an explicit %s manager retry once without replenishing the original automatic budget",async scope=>{
    const f=await fixture(scope); const before=business(f.database); const turn=f.begin();
    const decision=f.closeChoice(turn,"retry");
    const coordination=f.database.terminalPushObservationContinuation(PROJECT,"old-execution","original-push")!;
    expect(coordination).toEqual({incidentId:f.incident.id,envelope:decision});
    const originalRuntime=path.join(f.root,"runtime","inv_original_worker");
    const input={projectId:PROJECT,executionId:"old-execution",ownershipEpoch:2,agentId:"worker",invocationId:"inv_receipt_retry",operationId:"original-push",
      originalInvocationId:"inv_original_worker",previousInvocationId:"inv_original_worker",previousRuntimePath:originalRuntime,runtimePath:path.join(f.root,"runtime","inv_receipt_retry"),
      residentStopConfirmed:true as const,evidence:{fixtureTrustedOriginalNativeAbsence:true},coordination};
    const observation=f.database.beginTerminalPushObservation(input)!;
    expect(observation).toMatchObject({attempt:3,worktreePath:f.worktree,nodeRunId:"old-node",coordination});
    expect(f.database.terminalPushObservationRepairCount(PROJECT,"old-execution")).toBe(2);
    expect(f.database.terminalPushCoordinationIncidents(PROJECT)[0].status).toBe("retry-consumed");
    expect(f.database.terminalPushObservationContinuation(PROJECT,"old-execution","original-push")).toBeUndefined();
    expect(f.database.beginTerminalPushObservation(input)).toBeUndefined();
    f.database.stopTerminalPushObservation({...observation,residentStopConfirmed:true,evidence:{fixtureTrustedSupplementAbsence:true}});
    expect(()=>f.database.beginTerminalPushObservation({...input,invocationId:"inv_reused_retry",runtimePath:path.join(f.root,"runtime","inv_reused_retry"),
      previousInvocationId:observation.invocationId,previousRuntimePath:observation.runtimePath})).toThrow(/released manager/);
    expect(business(f.database)).toEqual(before);
  });

  it("a fresh writer consumes the already-stopped manager's exact staged decision, never its old capability",async()=>{
    const f=await fixture("legacy"); const before=business(f.database); const turn=f.begin();
    f.finish(turn); f.decide(turn,"retry"); f.result(turn); f.stop(turn);
    const oldEpoch=turn.writerLeaseEpoch; f.reload(); expect(f.database.writerLease().epoch).not.toBe(oldEpoch);
    expect(()=>f.stage(turn,{tool:"finish_task"})).toThrow(/exact live native authority/);
    const accepted=f.accept(turn); expect(f.accept(turn)).toEqual(accepted);
    expect(f.database.terminalPushObservationContinuation(PROJECT,"old-execution","original-push")).toEqual({incidentId:f.incident.id,envelope:accepted});
    expect(business(f.database)).toEqual(before);
  });

  it("a writer crash holds the native reservation until exact prior-writer Stop is recorded",async()=>{
    const f=await fixture("legacy"); const turn=f.begin(); f.finish(turn); f.decide(turn,"retry"); f.result(turn); f.reload();
    expect(()=>f.accept(turn)).toThrow(/physical Stop/);
    expect(()=>f.stage(turn,{tool:"finish_task"})).toThrow(/exact live native authority/);
    expect(f.database.beginTerminalPushCoordinator(f.reserveInput())).toBeUndefined();
    expect(()=>f.stop(turn)).toThrow(/original writer/);
    f.database.stopTerminalPushCoordinator({...turn,residentStopConfirmed:true,evidence:{fixtureExactRecoveredNativeAbsence:true},priorWriterLeaseEpoch:turn.writerLeaseEpoch});
    f.accept(turn); expect(f.database.terminalPushCoordinationIncidents(PROJECT)[0].status).toBe("retry-authorized");
  });

  it("two stopped technical failures advance only the direct original parent; writer changes do not refill the limit",async()=>{
    const f=await fixture(); const before=business(f.database);
    for(let attempt=0;attempt<2;attempt++) {
      const turn=f.begin(); f.stop(turn); f.database.recordTerminalPushCoordinatorFailure({...turn,reason:`Actual channel failure ${attempt}`});
      if(!attempt){expect(f.database.terminalPushCoordinationIncidents(PROJECT)[0].level).toBe(0);f.reload();}
    }
    expect(f.database.terminalPushCoordinationIncidents(PROJECT)[0]).toMatchObject({level:1,status:"open"});
    expect(()=>f.database.beginTerminalPushCoordinator(f.reserveInput(0))).toThrow(/exact current level/);
    const parent=f.begin(); expect(parent.agentId).toBe("parent"); f.closeChoice(parent,"escalate");
    expect(f.database.terminalPushCoordinationIncidents(PROJECT)[0].level).toBe(2);
    expect(f.database.terminalPushObservationRepairCount(PROJECT,"old-execution")).toBe(2);
    expect(business(f.database)).toEqual(before);
  });

  it("Main native failure exhausts finitely without inventing a request_user action",async()=>{
    const f=await fixture("outer");
    for(let attempt=0;attempt<2;attempt++){const turn=f.begin();f.stop(turn);f.database.recordTerminalPushCoordinatorFailure({...turn,reason:"Actual Main native error"});}
    expect(f.database.terminalPushCoordinationIncidents(PROJECT)[0]).toMatchObject({status:"manager-failed",level:0});
    expect(()=>f.database.beginTerminalPushCoordinator(f.reserveInput())).toThrow(/exact current level/);
    expect(f.database.terminalPushCoordinatorTurns(PROJECT).every(turn=>!turn.stagedDecision&&!turn.acceptedDecision)).toBe(true);
  });

  it("workflow continuity: reopens a stopped receipt manager after backoff without changing its hierarchy or business owner", async () => {
    const f = await fixture("outer");
    for (let attempt = 0; attempt < 2; attempt++) {
      const turn = f.begin(); f.stop(turn);
      f.database.recordTerminalPushCoordinatorFailure({ ...turn, reason: "Actual native failure" });
    }
    expect(f.database.terminalPushCoordinationIncidents(PROJECT)[0].status).toBe("manager-failed");
    const original = structuredClone(f.database.terminalPushCoordinationIncidents(PROJECT)[0]);
    f.database.resumeTerminalPushCoordinatorRecovery(PROJECT, f.incident.id);
    expect(f.database.terminalPushCoordinationIncidents(PROJECT)[0]).toMatchObject({
      status: "open", level: original.level, executionId: original.executionId,
      operationId: original.operationId, coordinators: original.coordinators });
    const next = f.begin();
    expect(next.coordinatorEpoch).toBe(3);
    expect(next.stagedDecision).toBeUndefined();
    expect(next.acceptedDecision).toBeUndefined();
    expect(() => f.database.resumeTerminalPushCoordinatorRecovery(PROJECT, f.incident.id)).not.toThrow();
    expect(f.database.terminalPushCoordinatorTurns(PROJECT)).toHaveLength(3);
  });

  it.each(["agent","invocation","project","version","capability","expires","bad-call","bad-time","other-incident","leader-user","git","route","empty-memory"] as const)("rejects %s actions before recording a manager decision",async invalid=>{
    const f=await fixture();const turn=f.begin(); const envelope=f.envelope(turn,{tool:"coordinate_agent_receipt",incidentId:f.incident.id,operation:"retry",rationale:"My real choice"});
    if(invalid==="agent")envelope.agent="main"; if(invalid==="invocation")envelope.invocationId="other"; if(invalid==="project")envelope.projectId="other";
    if(invalid==="version")envelope.stateVersion++; if(invalid==="capability")envelope.capabilityHash="c".repeat(64); if(invalid==="expires")envelope.expiresAt=f.ts;
    if(invalid==="bad-call")envelope.callId="bad call"; if(invalid==="bad-time")envelope.receivedAt="invalid";
    if(invalid==="other-incident")envelope.action={tool:"coordinate_agent_receipt",incidentId:"another",operation:"retry",rationale:"wrong incident"};
    if(invalid==="leader-user")envelope.action={tool:"request_user",message:"User",rationale:"Wrong level"};
    if(invalid==="git")envelope.action={tool:"git_push"}; if(invalid==="route")envelope.action={tool:"route_to_agent",target:"worker"};
    if(invalid==="empty-memory")envelope.action={tool:"finish_task",memory:" "};
    expect(()=>f.database.stageTerminalPushCoordinatorAction({...turn,controlCapabilityHash:turn.capabilityHash,envelope})).toThrow(/outside its exact native capability/);
    expect(f.database.terminalPushCoordinatorTurns(PROJECT)[0]).toMatchObject({status:"opened"});
    expect(f.database.terminalPushCoordinatorTurns(PROJECT)[0].stagedDecision).toBeUndefined();
  });

  it("Main as a historical group Leader has no user authority; global Main obeys the user-intervention grant",async()=>{
    const f=await fixture("closed",["main","main","main"]);
    expect(()=>f.database.beginTerminalPushCoordinator(f.reserveInput(0,true))).toThrow(/exact current level/);
    for(let level=0;level<3;level++){const turn=f.begin(level);expect(()=>f.stage(turn,{tool:"request_user",message:"Help",rationale:"Not global"})).toThrow();f.closeChoice(turn,"escalate");}
    const main=f.begin(3);expect(()=>f.stage(main,{tool:"request_user",message:"Help",rationale:"Intervention disabled"})).toThrow();
    expect(()=>f.decide(main,"escalate")).toThrow();
    f.closeChoice(main,"retry");expect(f.database.terminalPushCoordinationIncidents(PROJECT)[0].status).toBe("retry-authorized");
  });

  it("rejects a receipt user grant against the disabled authoritative Workflow while allowing receipt retry", async () => {
    const f = await fixture("outer", undefined, false, false, false);
    expect(() => f.database.beginTerminalPushCoordinator(f.reserveInput(0, true))).toThrow("User intervention is disabled");
    const main = f.begin(0, false);
    expect(() => f.stage(main, { tool: "request_user", message: "Help", rationale: "Forbidden question" })).toThrow("User intervention is disabled");
    f.closeChoice(main, "retry");
    expect(f.database.terminalPushCoordinationIncidents(PROJECT)[0].status).toBe("retry-authorized");
  });

  it.each(["before-stage", "before-accept"] as const)("checks the current authoritative intervention choice %s for a retained receipt grant", async boundary => {
    const f = await fixture("outer"); const main = f.begin(0, true);
    f.finish(main);
    const action = { tool: "request_user" as const, message: "Help", rationale: "Old allowed grant" };
    if (boundary === "before-accept") { f.stage(main, action); f.result(main); f.stop(main); }
    // Simulate the authoritative current Workflow after a user disables the
    // setting; the old native turn and capability deliberately remain intact.
    const raw = new DatabaseSync(f.databasePath);
    raw.prepare(`INSERT INTO workflow_revisions(project_id, workflow_revision, snapshot_json, created_at)
      SELECT project_id, workflow_revision + 1, json_set(snapshot_json, '$.allowUserIntervention', json('false')), created_at
      FROM workflow_revisions WHERE project_id = ? AND workflow_revision = 1`).run(PROJECT);
    raw.prepare("UPDATE project_heads SET workflow_revision = 2 WHERE project_id = ?").run(PROJECT);
    raw.close();
    expect(() => boundary === "before-stage" ? f.stage(main, action) : f.accept(main)).toThrow("User intervention is disabled");
    expect(f.database.terminalPushCoordinationIncidents(PROJECT)[0].status).toBe("open");
    expect(f.database.terminalPushCoordinatorTurns(PROJECT)[0].acceptedDecision).toBeUndefined();
  });

  it("accepts the exact Main user reply once, retains it across writers and gives only that reply a new finite management allowance", async () => {
    const f = await fixture("outer"); const before = business(f.database);
    const main = f.begin(0, true); f.finish(main); f.stage(main, { tool: "request_user", message: "My actual question", rationale: "I need user input" });
    f.result(main); f.stop(main); const decision = f.accept(main);
    f.database.appendEvent({ projectId: PROJECT, requestId: "intervention-original-user", agentId: "main", nodeRunId: "old-node",
      type: "user.intervention.requested", payload: { interventionId: "original-user", incidentId: f.incident.id,
        managerInvocationId: main.invocationId, decisionCallId: decision.callId } });
    f.database.appendEvent({ projectId: PROJECT, requestId: "user-response-original-user", agentId: "main", invocationId: main.invocationId,
      type: "user.intervention.answered", payload: { interventionId: "original-user", answeredAt: f.ts, response: "My original user response" } });
    const response = f.database.recordTerminalPushCoordinationUserResponse({ projectId: PROJECT, interventionId: "original-user" })!;
    expect(response.response).toBe("My original user response");
    const revision = f.database.projectState(PROJECT).stateRevision;
    expect(f.database.recordTerminalPushCoordinationUserResponse({ projectId: PROJECT, interventionId: "original-user" })).toEqual(response);
    expect(f.database.projectState(PROJECT).stateRevision).toBe(revision);
    expect(f.database.terminalPushObservationContinuation(PROJECT, "old-execution", "original-push")).toBeUndefined();
    const input = f.reserveInput(0, true);
    expect(() => f.database.beginTerminalPushCoordinator({ ...input, userResponseRequestId: "foreign-user-answer" })).toThrow(/exact current level/);
    expect(() => f.database.beginTerminalPushCoordinator({ ...input, userResponseRequestId: undefined })).toThrow(/exact current level/);
    f.reload();
    const first = f.begin(0, true); expect(first.userResponseRequestId).toBe(response.requestId);
    expect(() => f.stage(main, { tool: "finish_task" })).toThrow();
    f.result(first); f.stop(first); f.database.recordTerminalPushCoordinatorFailure({ ...first, reason: "Actual reply session channel failed" });
    const second = f.begin(0, true); f.result(second); f.stop(second);
    f.database.recordTerminalPushCoordinatorFailure({ ...second, reason: "Actual second reply session channel failed" });
    expect(f.database.terminalPushCoordinationIncidents(PROJECT)[0]).toMatchObject({ status: "manager-failed", userResponse: response });
    expect(f.database.terminalPushObservationRepairCount(PROJECT, "old-execution")).toBe(2);
    expect(business(f.database)).toEqual(before);
  });

  it.each(["missing-answer", "wrong-manager", "wrong-call", "wrong-incident", "wrong-invocation", "wrong-type", "not-released", "stop"] as const)("rejects a %s user response without releasing any retry or changing the incident", async mode => {
    const f = await fixture("outer"); const main = f.begin(0, true);
    f.finish(main); f.stage(main, { tool: "request_user", message: "My question", rationale: "My rationale" }); f.result(main);
    let decision = f.envelope(main, { tool: "request_user", message: "My question", rationale: "My rationale" });
    if (mode !== "not-released") { f.stop(main); decision = f.accept(main); }
    f.database.appendEvent({ projectId: PROJECT, requestId: "intervention-user", agentId: "main", nodeRunId: "old-node",
      type: "user.intervention.requested", payload: { interventionId: "user", incidentId: mode === "wrong-incident" ? "foreign" : f.incident.id,
        managerInvocationId: mode === "wrong-manager" ? "other-main-invocation" : main.invocationId,
        decisionCallId: mode === "wrong-call" ? "foreign-call" : decision.callId } });
    if (mode !== "missing-answer") f.database.appendEvent({ projectId: PROJECT, requestId: "user-response-user", agentId: "main",
      invocationId: mode === "wrong-invocation" ? "other-invocation" : main.invocationId,
      type: mode === "wrong-type" ? "user.input.queued" : "user.intervention.answered", payload: { interventionId: "user", answeredAt: f.ts, response: "Actual response" } });
    if (mode === "stop") f.database.appendEvent({ projectId: PROJECT, requestId: "stop", type: "project.cancellation.requested",
      payload: { actor: "user", reason: "Stop", resumable: true } });
    const before = f.database.terminalPushCoordinationIncidents(PROJECT)[0];
    expect(() => f.database.recordTerminalPushCoordinationUserResponse({ projectId: PROJECT, interventionId: "user" })).toThrow(/exact formal answer/);
    expect(f.database.terminalPushCoordinationIncidents(PROJECT)[0]).toEqual(before);
    expect(f.database.terminalPushObservationContinuation(PROJECT, "old-execution", "original-push")).toBeUndefined();
  });

  it("blocks normal native activity and another receipt while a historical manager owns the boundary",async()=>{
    const f=await fixture("legacy");const input=f.reserveInput();const turn=f.database.beginTerminalPushCoordinator(input)!;
    expect(f.database.beginTerminalPushCoordinator(input)).toBeUndefined();
    expect(()=>f.database.stageTerminalPushCoordinatorAction({...turn,controlCapabilityHash:turn.capabilityHash,envelope:f.envelope(turn,{tool:"finish_task"})})).toThrow(/exact live native authority/);
    expect(()=>f.database.startRuntimeActivity({projectId:PROJECT,kind:"resident",phase:"test",invocationId:"inv_other",nodeRunId:"old-node",agentId:"worker"})).toThrow(/terminal receipt observation/);
    expect(f.database.beginTerminalPushObservation({projectId:PROJECT,executionId:"old-execution",ownershipEpoch:2,agentId:"worker",invocationId:"inv_unapproved_receipt",operationId:"original-push",
      originalInvocationId:"inv_original_worker",previousInvocationId:"inv_original_worker",previousRuntimePath:path.join(f.root,"runtime","inv_original_worker"),runtimePath:path.join(f.root,"runtime","inv_unapproved_receipt"),
      residentStopConfirmed:true,evidence:{fixtureOriginalNativeAbsence:true}})).toBeUndefined();
    f.stop(turn);
    expect(()=>f.database.assertTerminalPushCoordinatorLaunch({...turn,runtimePath:turn.runtimePath})).toThrow(/exact live native authority/);
  });

  it.each(["freeze","stop"] as const)("revokes manager tools after %s while preserving physical accounting and actual output",async kind=>{
    const f=await fixture("legacy");const turn=f.begin();const before=business(f.database);
    if(kind==="freeze")f.database.freezeMainRouteFailure({projectId:PROJECT,nodeRunId:"old-node",routeEpoch:1,error:"Actual Main failure"});
    else f.database.appendEvent({projectId:PROJECT,eventId:"evt_stop",requestId:"stop-intent",agentId:"main",type:"project.cancellation.requested",payload:{actor:"user",reason:"User Stop",resumable:true}});
    expect(()=>f.finish(turn)).toThrow(); f.result(turn); f.stop(turn); expect(()=>f.accept(turn)).toThrow();
    expect(f.database.terminalPushCoordinatorTurns(PROJECT)[0]).toMatchObject({status:"stopped",result:{output:"Actual manager handoff"}});
    expect(f.database.terminalPushCoordinatorTurns(PROJECT)[0].completion).toBeUndefined();
    if(kind==="stop")expect(business(f.database)).toEqual(before);
  });

  it("keeps the original hierarchy snapshot across a later Leader configuration change",async()=>{
    const f=await fixture("closed",["root","parent","direct"],true);const raw=new DatabaseSync(f.databasePath);
    raw.prepare("UPDATE scoped_group_runs SET leader_agent_id='replacement' WHERE group_run_id='run-J'").run();raw.close();
    expect(f.database.recordTerminalPushCoordinationIncident(f.input).coordinators[0]).toEqual({agentId:"direct",role:"leader",groupRunId:"run-J"});
    expect(f.begin().agentId).toBe("direct");
  });

  it("preserves a non-Main outer slot while recording the original completed owner's coordination",async()=>{
    const f=await fixture("outer");const raw=new DatabaseSync(f.databasePath);
    raw.prepare(`INSERT INTO node_runs(node_run_id,project_id,node_kind,node_id,agent_id,workflow_revision,
      activation_request_id,activation_payload_hash,input_snapshot_ref,activated_by_agent_id,status,activated_at,updated_at)
      VALUES ('other-node',?,'agent','other-worker','other-worker',1,'other-activation','other-hash','other-input','main','running',?,?)`).run(PROJECT,f.ts,f.ts);
    raw.prepare("UPDATE project_heads SET active_node_run_id='other-node' WHERE project_id=?").run(PROJECT);raw.close();
    const before=business(f.database);f.closeChoice(f.begin(),"retry");
    expect(business(f.database)).toEqual(before);expect(before.activeNodeRunId).toBe("other-node");
    expect(f.database.terminalPushCoordinationIncidents(PROJECT)[0].coordinators).toEqual([{agentId:"main",role:"main"}]);
  });

  it("equivalent finish replays preserve the first Agent memory and changed decisions, output or Stop proof fail",async()=>{
    const f=await fixture("legacy");const turn=f.begin();f.finish(turn);
    const first=f.database.terminalPushCoordinatorTurns(PROJECT)[0].completion;
    const equivalent=f.envelope(turn,{tool:"finish_task",summary:"I reviewed the original receipt",memory:"My actual coordination memory"});equivalent.callId="equivalent-finish";
    f.database.stageTerminalPushCoordinatorAction({...turn,controlCapabilityHash:turn.capabilityHash,envelope:equivalent});expect(f.database.terminalPushCoordinatorTurns(PROJECT)[0].completion).toEqual(first);
    expect(()=>f.stage(turn,{tool:"finish_task",memory:"Changed Agent memory"})).toThrow(/original action/);
    f.decide(turn,"retry");expect(()=>f.decide(turn,"escalate")).toThrow(/original action/);
    f.result(turn);expect(()=>f.database.recordTerminalPushCoordinatorResult({...turn,output:"Changed output"})).toThrow(/output changed/);
    f.stop(turn);expect(()=>f.database.stopTerminalPushCoordinator({...turn,residentStopConfirmed:true,evidence:{differentProof:true}})).toThrow(/Stop proof changed/);
    f.accept(turn);expect(f.database.terminalPushCoordinatorTurns(PROJECT)[0].completion).toEqual(first);
  });

  it("rejects synthetic stopped booleans and foreign journals instead of creating another coordination incident",async()=>{
    const f=await fixture("outer");
    f.database.appendEvent({projectId:PROJECT,eventId:"evt_fake_stop",requestId:"fake-stop",agentId:"worker",type:"agent.terminal_push_observation.unresolved",
      payload:{executionId:"old-execution",ownershipEpoch:2,operationId:"original-push",nativeStopped:true}});
    expect(()=>f.database.recordTerminalPushCoordinationIncident({...f.input,unresolvedRequestId:"fake-stop"})).toThrow(/exact unresolved journal/);
    expect(()=>f.database.recordTerminalPushCoordinationIncident({...f.input,operationId:"foreign-journal"})).toThrow(/exact unresolved journal/);
    expect(f.database.terminalPushCoordinationIncidents(PROJECT)).toEqual([f.incident]);
  });
});
