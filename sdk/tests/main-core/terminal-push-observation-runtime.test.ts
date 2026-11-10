import { hasUserWorkflowPause } from "../../src/core/workflow-recovery.js";
import { promises as fs } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EventHub } from "../../src/core/event-hub.js";
import { ProjectStorage } from "../../src/core/storage.js";
import { CollaborationRuntimeCoordinator, ProductionCollaborationExecutionInputBuilder } from "../../src/core/collaboration-runtime.js";
import { createProductionCollaborationResidentLauncher } from "../../src/core/collaboration-resident-launcher.js";
import type { AsyncCollaborationStateStore as CollaborationStateDatabase } from "../../src/core/collaboration-state/database-worker.js";
import { CollaborationGitFacade } from "../../src/core/collaboration-git/facade.js";
import { ControlActionService, readStagedControlActions } from "../../src/core/orchestration-control-bridge.js";
import { SkillCatalog } from "../../src/core/skill-catalog.js";
import { defaultAgentConfigs, normalizeAgentOrchestrationTemplate } from "../../src/core/validation.js";
import { cloneAgentOrchestrationTemplate } from "../../src/core/agent-orchestration.js";
import { emptyProjectComputeUsage } from "../../src/core/inspire-compute-usage.js";
import { agentFixtureMainDecision } from "./helpers/agent-git-native-fixture.js";
import { controlResultReceipts } from "../../src/core/control-result-receipts.js";
import { agentGitOperationJournal } from "../../src/core/agent-git-operation-journal.js";
import { captureKnownAgentGitResults } from "../../src/core/agent-git-result-observations.js";
import { OfficialEventBridge } from "../../src/core/harness-runtime/official-event-bridge.js";
import { BUILTIN_HARNESS_DESCRIPTORS } from "../../src/core/harness-runtime/registry.js";
import { mapPiOfficialEvent } from "../../src/core/harness-runtime/adapters/pi-event-mapper.js";
import type { CollaborationResidentOpenInput } from "../../src/core/collaboration-runtime.js";
import type { AuthoritativeWorkflowCurrentState, ProjectState } from "../../src/core/types.js";

const PROJECT = `prj_${"a1".repeat(16)}`;
const HEAD = "7".repeat(40);
const roots: string[] = [];
const coordinators: CollaborationRuntimeCoordinator[] = [];
afterEach(async () => {
  for (const coordinator of coordinators.splice(0)) await coordinator.shutdown();
  await Promise.all(roots.splice(0).map(root => fs.rm(root, { recursive: true, force: true })));
});
async function until(check: () => boolean | Promise<boolean>) {
  const deadline = Date.now() + 8000;
  while (!await check()) {
    if (Date.now() > deadline) throw new Error("Expected production lifecycle evidence did not arrive");
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

type Mode = "confirmed" | "missing-finish" | "never-finish" | "native-error" | "missing" | "unconfirmed-stop" | "close-error" | "gate";
type Hierarchy = "user" | "retry" | "retry-user" | "manager-error";
type Coordination = "user" | "retry" | "missing-finish" | "native-error" | "gate" | "close-error" | "user-reply" | "reply-native-error" | "prepare-error";
async function fixture(mode: Mode = "confirmed", twoJournals = false, hierarchy?: Hierarchy, coordination?: Coordination,
  pending?: { receive: boolean; journalOnly?: boolean; journalMerge?: boolean; foreignSession?: boolean; foreignExecution?: boolean; changedGeneration?: boolean; futureEpoch?: boolean; foreignWorktree?: boolean },
  allowUserIntervention = true) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-terminal-runtime-")); roots.push(root);
  const storage = new ProjectStorage(path.join(root, "data"), new EventHub()); await storage.initialize();
  const projectPath = storage.projectDir(PROJECT);
  const zero = { inputTokens: 0, cachedInputTokens: 0, outputTokens: 0, totalTokens: 0, invocations: 0 };
  const timestamp = new Date().toISOString();
  const session = { schemaVersion: 1 as const, harnessId: "pi" as const, adapterVersion: "1", generation: 0,
    nativeId: "original-worker-session", durable: true, createdAt: timestamp };
  const base = cloneAgentOrchestrationTemplate();
  const orchestration = { ...base, schemaVersion: 3 as const,
    allowUserIntervention,
    agents: [base.agents.find(agent => agent.name === "main")!, { ...base.agents.find(agent => agent.name === "execution")!, name: "worker" }],
    collaborations: [], input: { source: "input" as const, target: "main" }, routes: { main: [], worker: [{ kind: "strong" as const, target: "main" }] },
    scopedWorkflow: { schemaVersion: 1 as const, rootAgentIds: ["main", "worker"], groups: [] },
    termination: { ...base.termination, agent: "main" } };
  const repository = { provider: "github" as const, providerId: 1, owner: "fixture", name: "retained", private: true,
    htmlUrl: "https://github.com/fixture/retained", cloneUrl: "https://github.com/fixture/retained.git", defaultBranch: "main" as const, observedAt: timestamp };
  const priorReceipt = { taskId: "old-execution", agent: "worker", invocationId: "inv_original_worker", callId: "old-finish",
    requestedAt: timestamp, acceptedAt: timestamp, status: "accepted" as const, summary: "Original business completed" };
  const state = { id: PROJECT, title: "Original receipt scene", requirement: "Keep my existing work", status: "paused", phase: "collaboration:user-paused",
    createdAt: timestamp, updatedAt: timestamp, turn: 0, cycle: 1, eventSeq: 0, consecutiveFailures: 0, completionGeneration: 0,
    controlProtocol: "natural-language-tools-v1", mainInvocationSeq: 0, userInputs: [], workflowRevision: 1,
    orchestration, agents: { main: structuredClone(defaultAgentConfigs.main), worker: { ...structuredClone(defaultAgentConfigs.execution), harness: "pi", permission: "yolo", sessionPersistence: false } },
    runCounts: { main: 0, worker: 1 }, tokenUsage: { ...zero, byAgent: { main: { ...zero }, worker: { ...zero } } },
    computeUsage: emptyProjectComputeUsage(), git: { enabled: true, status: "ready", repository: { ...repository, localPath: path.join(projectPath, "repository") } },
    taskCompletions: { "old-execution": priorReceipt }, agentSessions: { worker: session }, agentSessionIds: { worker: session.nativeId },
    agentSessionMeta: { worker: { generation: 0, contextSeq: 0, resumeFailureCount: 0 } } } as unknown as ProjectState;
  if (hierarchy) {
    const leaders = ["root-leader","parent-leader","direct-leader"];
    const groups = ["G","H","J"].map((id,index) => ({ id, ...(index ? {parentGroupId: ["G","H"][index-1]} : {}),
      leaderAgentId: leaders[index], allowLeaderReconfiguration: false, workflow: {
        nodes: index < 2 ? [{kind:"collaboration",nodeId:`${id}-child`,groupId:["H","J"][index]}] : [{kind:"agent",nodeId:"J-worker",agentId:"worker"}],
        input: {source:"input",edges:[{kind:"parallel",target:index<2?`${id}-child`:"J-worker"}]},
        routes: {[index<2?`${id}-child`:"J-worker"]:[{kind:"strong",target:"finish"}]}
      } }));
    Object.assign(orchestration,{ collaborations: groups.map(group => ({id:group.id,displayName:group.id,memberAgentIds:[],renamePolicy:"editable"})),
      agents:[...orchestration.agents,...leaders.map(name=>({...base.agents.find(agent=>agent.name==="execution")!,name}))],
      scopedWorkflow:{schemaVersion:1,rootAgentIds:["main","worker",...leaders],groups},
      routes:{main:[],G:[{kind:"strong",target:"main"}],worker:[{kind:"strong",target:"main"}]} });
    for (const name of ["main",...leaders]) {
      state.agents[name] = {...structuredClone(defaultAgentConfigs.execution),harness:"pi",skills:[],autoSkills:[],mcpServers:[],sessionPersistence:false};
      const binding = {...session,nativeId:`original-${name}-session`};
      state.agentSessions![name] = binding; state.agentSessionIds![name] = binding.nativeId;
      state.agentSessionMeta![name] = {generation:0,contextSeq:0,resumeFailureCount:0};
    }
  }
  if (coordination) {
    orchestration.routes.main = [{ kind: "weak", target: "worker" }];
    orchestration.decisionPlans = { main: "Use current facts", worker: "Use the current handoff" };
    Object.assign(orchestration, normalizeAgentOrchestrationTemplate(orchestration));
    state.agents.main = { ...state.agents.worker, skills: [], autoSkills: [], mcpServers: [], sessionPersistence: true, decisionBy: "main" };
    const mainSession = { ...session, nativeId: "original-main-session" };
    state.agentSessions!.main = mainSession; state.agentSessionIds!.main = mainSession.nativeId;
    state.agentSessionMeta!.main = { generation: 0, contextSeq: 0, resumeFailureCount: 0 };
  }
  await storage.createProject(state);
  const worktree = path.join(projectPath, "git-worktrees", "agents", "worker");
  const oldMemory = path.join(worktree, "agent-memory", "worker", "Memory.md");
  await fs.mkdir(path.dirname(oldMemory), { recursive: true }); await fs.writeFile(oldMemory, "Original business memory\n");
  let turns = 0; let entered!: () => void; const active = new Promise<void>(resolve => { entered = resolve; });
  let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; });
  let allowClose = mode !== "close-error";
  let allowManagerClose = coordination !== "close-error";
  const nativeOpens: CollaborationResidentOpenInput[] = [];
  const managerOpens: CollaborationResidentOpenInput[] = [];
  const managerCloses: string[] = [];
  const managerChoices: Array<{agent:string;operation:string}> = [];
  const queries: unknown[] = [];
  const cleanup = vi.fn(async () => { if (mode === "unconfirmed-stop") throw new Error("Exact native absence not proven"); });
  const reconcile = vi.fn(async () => ({ status: "none" }));
  const paused = vi.fn(async () => {}); const resumed = vi.fn(async () => {});
  const closed = vi.fn(async () => { if (!allowClose) throw new Error("Original native remains alive"); });
  let remoteAvailable = mode !== "missing";
  const provider = { observeRef: vi.fn(async (_owner: string, _name: string, ref: string) => ({ owner: repository.owner, repository: repository.name,
    ref, status: !remoteAvailable && (hierarchy ? ref === "executions/old-execution" : ref !== "main") ? "missing" as const : "present" as const,
    ...(!remoteAvailable && (hierarchy ? ref === "executions/old-execution" : ref !== "main") ? {} : { sha: HEAD }), observedAt: new Date().toISOString() })) };
  const catalog = { list: vi.fn(async () => []), forSelections: vi.fn(async () => []), resolveConfigured: vi.fn(async () => []) };
  let latestCoordinator!: CollaborationRuntimeCoordinator;
  const adapter = { async open(input: CollaborationResidentOpenInput) {
    const database = (await (latestCoordinator as unknown as {database():CollaborationStateDatabase}).database());
    if (input.request.terminalPushCoordination) {
      managerOpens.push(input);
      const binding = state.agentSessions![input.request.agent];
      expect(input.request.resumeThreadId).toBe(binding.nativeId);
      expect(input.request.sessionContinuity).toBe("strict");
      expect(input.controlScope?.role).toBe("receipt-coordinator");
      expect((await database.terminalPushObservationTurns(PROJECT)).every(turn => turn.status === "stopped")).toBe(true);
      return { initialLease: { session: binding, acknowledgedControlSeq: 0 }, probe: async () => ({ session: binding, acknowledgedControlSeq: 0 }),
        pause: paused, resume: resumed, close: async () => { if (!allowManagerClose) throw new Error("Manager native Stop is unknown"); managerCloses.push(input.request.invocationId); },
        async submit(turn: { inputId: string; invocationId: string; prompt: string }) {
          const fresh = await input.turnRequestFactory({ baseRequest: input.request, turn });
          const authority = await input.controlAuthorityFactory!({ request: fresh.request, turn });
          const service = new ControlActionService({ projectId: PROJECT, agent: input.request.agent, invocationId: turn.invocationId,
            stateVersion: authority.control.stateVersion, capability: authority.control.capability, capabilityHash: authority.control.capabilityHash,
            stagingPath: authority.control.stagingPath, revalidate: authority.revalidate });
          const response = (await database.terminalPushCoordinationIncidents(PROJECT)).find(incident => incident.id === input.request.terminalPushCoordination!.incidentId)?.userResponse;
          if (response) {
            expect(turn.prompt.split(response.response)).toHaveLength(2);
            expect(JSON.stringify(input.request.contextSources)).toContain(response.response);
            expect(JSON.stringify(input.request.contextSources)).toContain("My actual Main coordination memory");
            expect((await database.terminalPushCoordinatorTurns(PROJECT)).at(-1)?.userResponseRequestId).toBe(response.requestId);
          }
          if (coordination === "native-error" || coordination === "reply-native-error" && response) throw new Error("Actual original Main channel failure");
          if (coordination !== "missing-finish" || managerOpens.length > 1) await service.stage(authority.control.capability,
            `manager-finish-${turn.invocationId}`, { tool: "finish_task", summary: "I reviewed these facts", memory: "My actual Main coordination memory" });
          if (coordination === "retry" || coordination === "user-reply" && response) {
            await service.stage(authority.control.capability, `manager-retry-${turn.invocationId}`, {
              tool: "coordinate_agent_receipt", incidentId: input.request.terminalPushCoordination!.incidentId,
              operation: "retry", rationale: "Read the exact original receipt again" });
            managerChoices.push({ agent: input.request.agent, operation: "retry" }); remoteAvailable = true;
          } else {
            await service.stage(authority.control.capability, `manager-user-${turn.invocationId}`, {
              tool: "request_user", message: "My exact receipt question", rationale: "I need the user's decision" });
            managerChoices.push({ agent: input.request.agent, operation: "request_user" });
          }
          if (coordination === "gate") { entered(); await gate; }
          return { handoff: "Actual Main receipt coordination handoff", threadId: binding.nativeId,
            controlActions: await readStagedControlActions(authority.control.stagingPath) };
        } };
    }
    if (hierarchy && !input.request.terminalPushObservation) {
      managerOpens.push(input);
      expect((await database.terminalPushObservationTurns(PROJECT)).every(turn=>turn.status==="stopped")).toBe(true);
      const binding = state.agentSessions![input.request.agent];
      expect(input.request.sessionContinuity).toBe("strict"); expect(input.request.resumeThreadId).toBe(binding.nativeId);
      return {initialLease:{session:binding,acknowledgedControlSeq:0},probe:async()=>({session:binding,acknowledgedControlSeq:0}),
        pause:paused,resume:resumed,close:async()=>{managerCloses.push(input.request.invocationId);},
        async submit(turn:{inputId:string;invocationId:string;prompt:string}) {
          const scope = input.controlScope!;
          if (scope.role !== "scoped-leader" && scope.role !== "scoped-main") throw new Error("Receipt hierarchy must use the existing manager scopes");
          if (!scope.failedArrivalRequestIds.length) throw new Error("Controlled receipt scene does not execute later group integration");
          expect(JSON.stringify(input.request.contextSources)).toContain("terminalPushObservationOperations");
          expect(turn.prompt).not.toContain("terminalPushObservationOperations");
          expect(JSON.stringify(input.request.contextSources)).toContain("already successful business task");
          const fresh = await input.turnRequestFactory({baseRequest:input.request,turn});
          const authority = await input.controlAuthorityFactory!({request:fresh.request,turn});
          const service = new ControlActionService({projectId:PROJECT,agent:input.request.agent,invocationId:turn.invocationId,
            stateVersion:authority.control.stateVersion,capability:authority.control.capability,capabilityHash:authority.control.capabilityHash,
            stagingPath:authority.control.stagingPath,revalidate:authority.revalidate,execute:authority.execute});
          await service.stage(authority.control.capability,`manager-finish-${turn.invocationId}`,{tool:"finish_task",summary:"I reviewed the original receipt"});
          if (hierarchy === "manager-error" && input.request.agent === "direct-leader") throw new Error("Actual direct Leader channel failed");
          const retry = input.request.agent === "direct-leader" && (hierarchy === "retry" || hierarchy === "retry-user") &&
            !managerChoices.some(choice=>choice.operation==="retry");
          if (scope.role === "scoped-main") {
            await service.stage(authority.control.capability,`user-${turn.invocationId}`,{tool:"request_user",message:"Please decide the original receipt issue",rationale:"All original group levels escalated"});
            managerChoices.push({agent:input.request.agent,operation:"request_user"});
          } else {
            await service.stage(authority.control.capability,`coordinate-${turn.invocationId}`,{tool:"coordinate_group_task",
              groupRunId:scope.groupRunId,coordinatorEpoch:scope.coordinatorEpoch,arrivalRequestId:scope.failedArrivalRequestIds[0],
              operation:retry?"retry":"escalate",rationale:"Inspect the same original journal again"});
            managerChoices.push({agent:input.request.agent,operation:retry?"retry":"escalate"});
            if (retry) {
              expect((await database.terminalPushObservationContinuation(PROJECT,"old-execution","original-push"))).toBeUndefined();
              const previous = (await database.terminalPushObservationTurns(PROJECT)).at(-1);
              const envelope = (await readStagedControlActions(authority.control.stagingPath)).at(-1)!;
              const pendingIssue = (await database.scopedGroupIssues(PROJECT)).find(issue=>issue.kind==="terminal-push")!;
              const runtimePath = path.join(projectPath,"runtime","inv_premature_manager_retry");
              expect((await database.beginTerminalPushObservation({projectId:PROJECT,executionId:"old-execution",ownershipEpoch:2,agentId:"worker",
                invocationId:"inv_premature_manager_retry",operationId:"original-push",originalInvocationId:"inv_original_worker",
                previousInvocationId:previous?.invocationId??"inv_original_worker",previousRuntimePath:previous?.runtimePath??path.join(projectPath,"runtime","inv_original_worker"),
                runtimePath,residentStopConfirmed:true,evidence:{fixtureNativeWasStopped:true},coordination:{incidentId:pendingIssue.id,envelope}}))).toBeUndefined();
              if (hierarchy === "retry") remoteAvailable = true;
            }
          }
          return {handoff:`Actual ${input.request.agent} coordination`,controlActions:await readStagedControlActions(authority.control.stagingPath)};
        }};
    }
    nativeOpens.push(input);
    if (hierarchy) expect((await database.scopedLeaderTurns(PROJECT)).every(turn=>turn.status==="released")).toBe(true);
    return { initialLease: { session, acknowledgedControlSeq: 0 }, probe: async () => ({ session, acknowledgedControlSeq: 0 }),
      pause: paused, resume: resumed, close: closed,
      async submit(turn: { inputId: string; invocationId: string; prompt: string }) {
        turns++; if (coordination !== "gate") entered();
        if (!hierarchy) expect(catalog.list).not.toHaveBeenCalled();
        const operationId = input.request.terminalPushObservation!.operationId;
        expect(["original-push","second-push"]).toContain(operationId);
        expect(input.request.sessionContinuity).toBe("strict"); expect(input.request.resumeThreadId).toBe(session.nativeId);
        expect(input.request.skillPaths).toEqual([]); expect(input.request.project.agents.worker.sessionPersistence).toBe(false);
        expect(input.controlScope).toMatchObject({ role: "execution-artifact", executionId: "old-execution", ownershipEpoch: 2 });
        const fresh = await input.turnRequestFactory({ baseRequest: input.request, turn });
        if (pending) {
          const notification = await fresh.request.onPendingControlResults!(turn.inputId, session);
          expect(notification).toContain('"providerNumber":71');
          expect(notification).toContain('"invocationId":"inv_original_worker"');
          expect((await database.pendingControlResultEvents(PROJECT, "worker"))).toHaveLength(1);
          if (pending.receive) {
            const bridge = new OfficialEventBridge({ descriptor: BUILTIN_HARNESS_DESCRIPTORS.find(item => item.id === "pi")!,
              invocationId: turn.invocationId, mapEvent: mapPiOfficialEvent,
              onEvent: event => fresh.request.onOfficialHarnessEvent!(event as unknown as Record<string, unknown>, session) });
            await bridge.accept({ type: "message_end", message: { role: "user", content: [{ type: "text", text: notification + "\n" + turn.prompt }] } });
            expect((await database.pendingControlResultEvents(PROJECT, "worker"))).toHaveLength(0);
          }
        }
        const authority = await input.controlAuthorityFactory!({ request: fresh.request, turn });
        const service = new ControlActionService({ projectId: PROJECT, agent: "worker", invocationId: turn.invocationId,
          stateVersion: authority.control.stateVersion, capability: authority.control.capability, capabilityHash: authority.control.capabilityHash,
          stagingPath: authority.control.stagingPath, revalidate: authority.revalidate, execute: authority.execute });
        if (mode === "gate") await new Promise<void>((resolve, reject) => {
          gate.then(resolve); input.signal.addEventListener("abort", () => reject(new Error("Actual native turn cancelled")), { once: true });
        });
        if (mode === "native-error" && turns === 1) throw new Error("Actual native output failed before finish");
        if (!pending) {
          const response = await service.stageWithResult(authority.control.capability, `query-${turn.invocationId}`,
            { tool: "git_reconcile_push", operationId, historical: true }); queries.push(response);
        }
        if (!(mode === "missing-finish" && turns === 1) && mode !== "never-finish") {
          await service.stage(authority.control.capability, `finish-${turn.invocationId}`, { tool: "finish_task",
            summary: mode === "missing" ? "My remote ref is missing" : "I confirmed my original push",
            memory: "Actual Agent observation memory" });
        }
        return { handoff: mode === "missing" ? "I cannot settle this original remote receipt; ask my coordinator" : "My original historical push is confirmed" };
      } };
  } };
  const launcher = createProductionCollaborationResidentLauncher({ reconcileResidentStartup: reconcile,
    cleanupResidentInterrupted: cleanup, residentRecoveryStrategy: () => "native-resume" } as never, adapter as never);
  const mainContextSources: unknown[] = [];
  const mainInputs: string[] = [];
  const mainWorkflowFacts: AuthoritativeWorkflowCurrentState[] = [];
  const makeCoordinator = () => {
    const builder = new ProductionCollaborationExecutionInputBuilder(storage, catalog as unknown as SkillCatalog);
    let failedPreparation = false;
    const coordinator = new CollaborationRuntimeCoordinator({ storage, serviceId: "terminal-production-test", hostId: "test-host",
      executionInputBuilder: { build: async input => {
        if (coordination === "prepare-error" && input.terminalPushCoordination && !failedPreparation) {
          failedPreparation = true; throw new Error("Actual coordinator preparation failed before native open");
        }
        return builder.build(input);
      } },
      gitFactory: options => {
        const facade = new CollaborationGitFacade({ operationStore: options.operationStore, localGit: { projectId: PROJECT } as never, provider: provider as never });
        return { reconcilePushOperation: facade.reconcilePushOperation.bind(facade), observeRemoteRef: facade.observeRemoteRef.bind(facade),
          identifyRestrictedWorktreeClosing: vi.fn(async () => undefined), // This controlled retained checkout has no extra paths/head.
          ...(hierarchy ? Object.fromEntries(["observeRetainedExecution","observeExecutionWorktree","createGroupFinalPullRequest","mergeGroupFinalPullRequest","reconcileGroupFinalPullRequest","checkpointGroupCompletion"]
            .map(name=>[name,vi.fn(async()=>{throw new Error(`Controlled receipt scene does not perform ${name}`);})])) : {}),
          prepareAgentManagementWorkspace: async (agentId: string) => path.join(projectPath,"git-worktrees","agents",agentId) } as never;
      },
      residentLauncher: { ...launcher, async decideRoute(input) {
        mainInputs.push(input.open.request.inboxPath);
        mainContextSources.push(input.open.request.contextSources);
        mainWorkflowFacts.push(JSON.parse(await fs.readFile(path.join(projectPath,"workflow","current-state.json"),"utf8")));
        return agentFixtureMainDecision(input, { targetNodeId: "user", decisionRequestId: `main-request-${input.turn.invocationId}`,
          output: "Main explicitly asks the user after reviewing the real receipt", intervention: { tool: "request_user", message: "Please decide how to proceed", rationale: "Main cannot settle this receipt" } });
      } } });
    coordinators.push(coordinator); latestCoordinator = coordinator; return coordinator;
  };
  const coordinator = makeCoordinator(); await coordinator.initialize();
  const database = (await (coordinator as unknown as { database(): CollaborationStateDatabase }).database());
  await database.createProject({ projectId: PROJECT, workflowRevision: 1, workflowSnapshot: orchestration, git: state.git!, workerCapacity: 1 });
  const raw = new DatabaseSync(path.join(root, "data", "collaboration-state.sqlite")); raw.exec("PRAGMA foreign_keys=ON");
  raw.prepare(`INSERT INTO node_runs(node_run_id,project_id,node_kind,node_id,agent_id,workflow_revision,
    activation_request_id,activation_payload_hash,input_snapshot_ref,activated_by_agent_id,status,activated_at,updated_at,completed_at)
    VALUES ('old-node',?,'agent','worker','worker',1,'old-activation','old-hash','old-input','main','completed',?,?,?)`).run(PROJECT,timestamp,timestamp,timestamp);
  raw.prepare(`INSERT INTO node_runs(node_run_id,project_id,node_kind,node_id,agent_id,workflow_revision,
    activation_request_id,activation_payload_hash,input_snapshot_ref,activated_by_agent_id,status,activated_at,updated_at)
    VALUES ('main-node',?,'agent','main','main',1,'main-activation','main-hash','main-input','main','running',?,?)`).run(PROJECT,timestamp,timestamp);
  raw.prepare("UPDATE project_heads SET active_node_run_id='main-node' WHERE project_id=?").run(PROJECT);
  raw.prepare(`INSERT INTO work_tasks(task_id,node_run_id,assignment,queue_ordinal,purpose,status,created_at,updated_at,completed_at)
    VALUES ('old-task','old-node','Already completed work',1,'delivery','succeeded',?,?,?)`).run(timestamp,timestamp,timestamp);
  raw.prepare(`INSERT INTO member_executions(execution_id,project_id,node_run_id,task_id,agent_id,purpose,ownership_epoch,status,
    execution_branch,worktree_path,queued_at,started_at,updated_at,completed_at,process_stop_confirmed,invocation_id,session_id)
    VALUES ('old-execution',?,'old-node','old-task','worker','delivery',2,'succeeded','executions/old-execution',?,?,?,?,?,0,'inv_original_worker','original-worker-session')`)
    .run(PROJECT,worktree,timestamp,timestamp,timestamp,timestamp);
  raw.prepare(`INSERT INTO operations(operation_id,project_id,kind,payload_hash,status,owner_execution_id,ownership_epoch,expected_head,expected_base,created_at,updated_at)
    VALUES ('original-push',?,'git.push',?,'uncertain','old-execution',1,?,'executions/old-execution',?,?)`).run(PROJECT,"a".repeat(64),HEAD,timestamp,timestamp);
  if (twoJournals) raw.prepare(`INSERT INTO operations(operation_id,project_id,kind,payload_hash,status,owner_execution_id,ownership_epoch,expected_head,expected_base,created_at,updated_at)
    VALUES ('second-push',?,'git.push',?,'uncertain','old-execution',1,?,'executions/old-execution',?,?)`).run(PROJECT,"e".repeat(64),HEAD,timestamp,timestamp);
  raw.prepare(`INSERT INTO operations(operation_id,project_id,kind,payload_hash,status,remote_fact_json,created_at,updated_at)
    VALUES ('original-repository',?,'repository.create',?,'finalized',?,?,?)`).run(PROJECT,"b".repeat(64),JSON.stringify(repository),timestamp,timestamp);
  if (hierarchy) {
    raw.prepare("UPDATE node_runs SET node_kind='collaboration',node_id='G',agent_id=NULL,group_id='G' WHERE node_run_id='main-node'").run();
    for (const [index,group] of state.orchestration.scopedWorkflow!.groups.entries()) {
      const id = `run-${group.id}`;
      raw.prepare(`INSERT INTO scoped_group_runs(group_run_id,project_id,group_id,parent_group_run_id,parent_arrival_id,
        activation_request_id,workflow_revision,workflow_snapshot_json,leader_agent_id,base_commit,group_branch,integration_target,status,created_at,updated_at)
        VALUES (?,?,?,?,?,?,1,?,?,?,?,?,'running',?,?)`).run(id,PROJECT,group.id,index?`run-${index===1?"G":"H"}`:null,
          index?`arrival-${index===1?"G":"H"}-child`:null,index?`activate-${group.id}`:"main-activation",JSON.stringify(group.workflow),
          group.leaderAgentId,HEAD,`groups/${id}`,index?`groups/run-${index===1?"G":"H"}`:"main",timestamp,timestamp);
      raw.prepare(`INSERT INTO scoped_arrivals(request_id,group_run_id,source_run_id,target_node_id,target_kind,agent_id,child_group_id,status,created_at,updated_at)
        VALUES (?,?,?,?,?,?,?, ?,?,?)`).run(index===2?"worker-arrival":`arrival-${group.id}-child`,id,`input-${group.id}`,
          index===2?"J-worker":`${group.id}-child`,index===2?"agent":"collaboration",index===2?"worker":null,index===2?null:index===0?"H":"J",index===2?"completed":"running",timestamp,timestamp);
      const plan = {schemaVersion:1,projectId:PROJECT,agent:group.leaderAgentId,invocationId:`inv_old_plan_${group.id}`,callId:`old-plan-${group.id}`,
        stateVersion:1,capabilityHash:"f".repeat(64),receivedAt:timestamp,action:{tool:"assign_group_tasks",groupRunId:id,coordinatorEpoch:1,
          tasks:group.workflow.nodes.map(node=>({taskId:node.nodeId,assignment:"Original group task"})),rationale:"Original retained plan"}};
      raw.prepare(`INSERT INTO project_events(project_id,seq,event_id,request_id,occurred_at,event_type,payload_json)
        SELECT ?,next_event_seq,?,?,?,'scoped.leader.action.accepted',? FROM project_heads WHERE project_id=?`)
        .run(PROJECT,`old-plan-${group.id}`,`old-plan-${group.id}`,timestamp,JSON.stringify({groupRunId:id,envelope:plan}),PROJECT);
      raw.prepare("UPDATE project_heads SET next_event_seq=next_event_seq+1 WHERE project_id=?").run(PROJECT);
    }
    raw.prepare("DELETE FROM operations WHERE operation_id='original-push'").run();
    raw.prepare("DELETE FROM member_executions WHERE execution_id='old-execution'").run();
    raw.prepare(`INSERT INTO scoped_executions(execution_id,project_id,group_run_id,arrival_request_id,agent_id,ownership_epoch,execution_branch,
      worktree_path,status,created_at,updated_at,completed_at) VALUES ('old-execution',?,'run-J','worker-arrival','worker',2,'executions/old-execution',?,'completed',?,?,?)`)
      .run(PROJECT,worktree,timestamp,timestamp,timestamp);
    raw.prepare(`INSERT INTO scoped_agent_turns(execution_id,ownership_epoch,project_id,writer_lease_epoch,invocation_id,runtime_path,base_commit,status,created_at,opened_at,stopped_at)
      VALUES ('old-execution',2,?,?,'inv_original_worker',?,?,'stopped',?,?,?)`).run(PROJECT,(await database.writerLease()).epoch,
        path.join(projectPath,"runtime","inv_original_worker"),HEAD,timestamp,timestamp,timestamp);
    raw.prepare(`INSERT INTO scoped_operations(operation_id,project_id,kind,payload_hash,status,owner_execution_id,ownership_epoch,expected_head,expected_base,created_at,updated_at)
      VALUES ('original-push',?,'git.push',?,'uncertain','old-execution',1,?,'executions/old-execution',?,?)`).run(PROJECT,"a".repeat(64),HEAD,timestamp,timestamp);
  }
  raw.close();
  if (coordination) {
    const mainWorkspace = path.join(projectPath, "git-worktrees", "agents", "main");
    await fs.mkdir(mainWorkspace, { recursive: true });
    await database.recordAgentNativeSessionBinding({ projectId: PROJECT, agentId: "main", invocationId: "inv_original_main",
      runtimePath: path.join(projectPath, "runtime", "original-main-native-scope"), worktreePath: mainWorkspace,
      session: state.agentSessions!.main, executionContext: { role: "leader", nodeRunId: "main-node", routeScopeId: "original-main-route", coordinatorEpoch: 1 } });
  }
  if (pending) {
    const originalContext = { role: "delivery" as const, nodeRunId: "old-node", executionId: "old-execution", ownershipEpoch: 2 };
    await database.recordAgentNativeSessionBinding({ projectId: PROJECT, agentId: "worker", invocationId: "inv_original_worker",
      runtimePath: path.join(projectPath, "runtime", "inv_original_worker"), worktreePath: pending.foreignWorktree ? path.join(projectPath, "unrelated-worktree") : worktree, session,
      executionContext: originalContext });
    if (!pending.journalOnly) (await controlResultReceipts(database, { projectId: PROJECT, agentId: "worker", invocationId: "inv_original_worker",
      session: pending.foreignSession ? { ...session, nativeId: "unrelated-session" } : pending.changedGeneration ? { ...session, generation: 1 } : session,
      executionContext: pending.foreignExecution ? { ...originalContext, executionId: "another-execution" }
        : pending.futureEpoch ? { ...originalContext, ownershipEpoch: 3 } : originalContext }).record({
      envelope: { projectId: PROJECT, agent: "worker", invocationId: "inv_original_worker", callId: "late-pr-result", stateVersion: 2,
        receivedAt: timestamp, action: { tool: "github_create_pr", title: "Original PR", body: "Original delivery" } },
      requestedCallId: "late-pr-result", result: { providerNumber: 71, headSha: HEAD, head: "executions/old-execution", base: "main",
        htmlUrl: "https://github.com/fixture/retained/pull/71", status: "open" } }));
    const finalized = new DatabaseSync(path.join(root, "data", "collaboration-state.sqlite"));
    if (pending.journalOnly) {
      (await agentGitOperationJournal(database, PROJECT).recordRequest({ operationId: "original-create", projectId: PROJECT,
        executionId: "old-execution", ownershipEpoch: 2, executionBranch: "executions/old-execution",
        integrationTarget: hierarchy ? "groups/run-J" : "main", repository: { owner: repository.owner, name: repository.name },
        agentId: "worker", invocationId: "inv_original_worker", callId: "late-pr-result", requestedAt: timestamp,
        expectedHead: HEAD, action: pending.journalMerge ? { tool: "github_merge_pr", providerNumber: 71 }
          : { tool: "github_create_pr", title: "Original PR", body: "Original delivery" } }));
      finalized.prepare(`INSERT INTO ${hierarchy ? "scoped_operations" : "operations"}
        (operation_id,project_id,kind,payload_hash,status,owner_execution_id,ownership_epoch,expected_head,expected_base,remote_fact_json,created_at,updated_at)
        VALUES ('original-create',?,?,?,'finalized','old-execution',2,?,?,?,?,?)`)
        .run(PROJECT,pending.journalMerge ? "pull.merge" : "pull.create","c".repeat(64),HEAD,hierarchy ? "groups/run-J" : "main",JSON.stringify({ owner: repository.owner,
          repository: repository.name, ownerExecutionId: "old-execution", providerNumber: 71, headSha: HEAD,
          head: "executions/old-execution", base: hierarchy ? "groups/run-J" : "main", status: pending.journalMerge ? "merged" : "open",
          ...(pending.journalMerge ? { mergeCommitSha: "8".repeat(40) } : {}),
          htmlUrl: "https://github.com/fixture/retained/pull/71", observedAt: timestamp }),timestamp,timestamp);
    }
    for (const table of ["operations", "scoped_operations"]) finalized.prepare(`UPDATE ${table} SET status='finalized',remote_fact_json=? WHERE operation_id='original-push'`).run(JSON.stringify({
      owner: repository.owner, repository: repository.name, ref: "executions/old-execution", status: "present", sha: HEAD, observedAt: timestamp }));
    finalized.close();
  }
  await coordinator.recoverProject(state);
  return { root, storage, state, coordinator, database, makeCoordinator, nativeOpens, queries, provider, cleanup, reconcile, paused, resumed, closed,
    mainInputs, mainWorkflowFacts, mainContextSources, managerOpens, managerCloses, managerChoices, active, release, oldMemory, priorReceipt, session,
    allowClose: () => { allowClose = true; allowManagerClose = true; } };
}

describe("production terminal receipt scheduling", () => {
  it.each([false, true])("retains a created PR with unknown mergeability without automatically reopening its completed task (normal return=%s)", async normalReturn => {
    const f = await fixture("confirmed", false, undefined, undefined, { receive: true, journalOnly: true });
    const request = (await agentGitOperationJournal(f.database, PROJECT).recordedRequest("original-create"))!;
    const original = (await f.database.recordedGitOperation(PROJECT, "original-create"))!;
    const remote = { ...original.remoteFact, status: "unknown" };
    const raw = new DatabaseSync(path.join(f.root, "data", "collaboration-state.sqlite"));
    try { raw.prepare("UPDATE operations SET remote_fact_json=? WHERE operation_id='original-create'").run(JSON.stringify(remote)); }
    finally { raw.close(); }
    if (normalReturn) (await controlResultReceipts(f.database, { projectId: PROJECT, agentId: "worker", invocationId: request.invocationId,
      session: f.session, executionContext: request.nativeBinding!.executionContext }).record({
      envelope: { projectId: PROJECT, agent: "worker", invocationId: request.invocationId,
        callId: request.callId, receivedAt: request.requestedAt, stateVersion: 2, action: request.action },
      requestedCallId: request.callId, result: { ...remote, status: "open" } }));
    await captureKnownAgentGitResults(f.database, PROJECT);
    const pending = (await f.database.pendingControlResultEvents(PROJECT, "worker"));
    expect(pending).toHaveLength(1);
    if (!normalReturn) expect(pending[0].payload.receipt).toMatchObject({
      result: { status: "completed", remoteStage: "pull_mergeability_pending", operation: { remoteFact: remote } } });
    expect((await f.database.recordedGitOperation(PROJECT, "original-create"))).toEqual({ ...original, remoteFact: remote });
    await f.coordinator.resumeProject(f.state);
    await until(() => f.state.userIntervention?.status === "pending");
    expect(f.state.lastError).toBeUndefined();
    expect(f.nativeOpens).toHaveLength(0);
    expect((await f.database.pendingControlResultEvents(PROJECT, "worker"))).toHaveLength(1);
    expect((await f.database.terminalPushObservationTurns(PROJECT))).toEqual([]);
    expect((await f.database.terminalPushObservationRepairCount(PROJECT, "old-execution"))).toBe(0);
    expect((await f.database.eventsAfter(PROJECT)).filter(event => event.type === "control.result.received")).toEqual([]);
    expect((await f.database.recordedGitOperation(PROJECT, "original-create"))).toEqual({ ...original, remoteFact: remote });
    expect(f.queries).toHaveLength(0);
    expect(f.state.taskCompletions!["old-execution"]).toEqual(f.priorReceipt);
    expect(await fs.readFile(f.oldMemory, "utf8")).toBe("Original business memory\n");
  });

  it("keeps unknown journals unnotified, captures each later known stage once, and preserves original requests across writer handoff", async () => {
    const f = await fixture("confirmed", false, undefined, undefined, { receive: false, journalOnly: true });
    const operation = (await f.database.recordedGitOperation(PROJECT, "original-create"))!;
    const raw = new DatabaseSync(path.join(f.root, "data", "collaboration-state.sqlite"));
    try {
      raw.prepare("UPDATE operations SET status='uncertain',remote_fact_json=NULL WHERE operation_id='original-create'").run();
      await captureKnownAgentGitResults(f.database, PROJECT);
      expect((await f.database.pendingControlResultEvents(PROJECT, "worker"))).toHaveLength(0);
      raw.prepare("UPDATE operations SET status='observed',remote_fact_json=? WHERE operation_id='original-create'").run(JSON.stringify(operation.remoteFact));
      await captureKnownAgentGitResults(f.database, PROJECT); await captureKnownAgentGitResults(f.database, PROJECT);
      expect((await f.database.pendingControlResultEvents(PROJECT, "worker"))).toHaveLength(1);
      expect((await f.database.pendingControlResultEvents(PROJECT, "worker"))[0].payload.receipt).toMatchObject({
        result: { status: "remote_success_local_pending", localStage: "journal_finalization_pending" } });
      raw.prepare("UPDATE operations SET status='finalized' WHERE operation_id='original-create'").run();
      await captureKnownAgentGitResults(f.database, PROJECT);
      expect((await f.database.pendingControlResultEvents(PROJECT, "worker"))).toHaveLength(2);
    } finally { raw.close(); }
    const original = (await agentGitOperationJournal(f.database, PROJECT).recordedRequest("original-create"));
    await f.coordinator.shutdown();
    const next = (await f.makeCoordinator()); await next.initialize(); await next.recoverProject(f.state);
    const database = (await (next as unknown as { database(): CollaborationStateDatabase }).database());
    await captureKnownAgentGitResults(database, PROJECT);
    expect((await database.pendingControlResultEvents(PROJECT, "worker"))).toHaveLength(2);
    expect((await agentGitOperationJournal(database, PROJECT).recordedRequest("original-create"))).toEqual(original);
    const later = controlResultReceipts(database, { projectId: PROJECT, agentId: "worker", invocationId: "later-role",
      session: f.session, executionContext: { role: "leader", nodeRunId: "main-node", routeScopeId: "route", coordinatorEpoch: 1 } });
    const text = (await later.prepareNotification("normal-input"));
    expect(text).toContain("journal_finalization_pending"); expect(text).toContain('"status":"completed"');
    (await later.observeNative({ kind: "user.message", invocationId: "later-role", harnessId: "pi", eventId: "partial", message: text.slice(0, -1) }));
    expect((await database.pendingControlResultEvents(PROJECT, "worker"))).toHaveLength(2);
    (await later.observeNative({ kind: "user.message", invocationId: "later-role", harnessId: "pi", eventId: "normal", message: text }));
    expect((await database.pendingControlResultEvents(PROJECT, "worker"))).toHaveLength(0);
    expect(f.nativeOpens).toHaveLength(0);
  });

  it.each([false, true])("never describes a known merge as locally complete without its exact synchronization proof (scoped=%s)", async scoped => {
    const f = await fixture("confirmed", false, scoped ? "user" : undefined, undefined,
      { receive: false, journalOnly: true, journalMerge: true });
    await captureKnownAgentGitResults(f.database, PROJECT);
    expect((await f.database.pendingControlResultEvents(PROJECT, "worker"))).toEqual([
      expect.objectContaining({ payload: { receipt: expect.objectContaining({ result: expect.objectContaining({
        status: "remote_success_local_pending", localStage: "synchronization_pending" }) }) } })
    ]);
    expect((await f.database.recordedGitOperation(PROJECT, "original-create"))?.status).toBe("finalized");
    expect(f.nativeOpens).toHaveLength(0);
  });

  it.each(["headSha", "base", "ownerExecutionId", "repository", "providerNumber"])("rejects a late result with a foreign %s before recording any notification", async field => {
    const f = await fixture("confirmed", false, undefined, undefined, { receive: false, journalOnly: true });
    const operation = (await f.database.recordedGitOperation(PROJECT, "original-create"))!;
    const remote = { ...operation.remoteFact, [field]: field === "providerNumber" ? 0 : "foreign" };
    const raw = new DatabaseSync(path.join(f.root, "data", "collaboration-state.sqlite"));
    try { raw.prepare("UPDATE operations SET remote_fact_json=? WHERE operation_id='original-create'").run(JSON.stringify(remote)); }
    finally { raw.close(); }
    await expect(captureKnownAgentGitResults(f.database, PROJECT)).rejects.toThrow("authoritative remote result");
    expect((await f.database.pendingControlResultEvents(PROJECT, "worker"))).toHaveLength(0);
    expect(f.nativeOpens).toHaveLength(0);
  });

  it.each([false, true])("uses a legacy local synchronization only from the exact original callback facts (foreign=%s)", async foreign => {
    const f = await fixture("confirmed", false, undefined, undefined, { receive: false, journalOnly: true, journalMerge: true });
    const request = (await agentGitOperationJournal(f.database, PROJECT).recordedRequest("original-create"))!;
    const remote = (await f.database.recordedGitOperation(PROJECT, "original-create"))!.remoteFact;
    const proof = { projectId: PROJECT, operationId: "original-create", targetBranch: "main", expectedSourceHead: HEAD,
      mergeCommitSha: "8".repeat(40), remoteHead: "9".repeat(40), localHeadBefore: "6".repeat(40),
      localHeadAfter: "9".repeat(40), status: "synchronized", observedAt: request.requestedAt };
    // Seed the callback fact from the earlier live owner. A stopped completed
    // owner correctly cannot append a new execution-authorized fact now.
    const raw = new DatabaseSync(path.join(f.root, "data", "collaboration-state.sqlite"));
    try {
      raw.prepare(`INSERT INTO project_events(project_id,seq,event_id,request_id,execution_id,ownership_epoch,agent_id,occurred_at,event_type,payload_json)
        SELECT ?,next_event_seq,'old-merge-callback',?,'old-execution',2,?,?,'execution.agent_git.fact',? FROM project_heads WHERE project_id=?`)
        .run(PROJECT,`agent-git-fact:old-execution:2:${request.callId}`,foreign ? "another-worker" : "worker",request.requestedAt,
          JSON.stringify({ facts: { merged: { ...remote, localSynchronization: proof } } }),PROJECT);
      raw.prepare("UPDATE project_heads SET next_event_seq=next_event_seq+1 WHERE project_id=?").run(PROJECT);
    } finally { raw.close(); }
    await captureKnownAgentGitResults(f.database, PROJECT);
    expect((await f.database.pendingControlResultEvents(PROJECT, "worker"))[0].payload.receipt).toMatchObject({
      result: foreign ? { status: "remote_success_local_pending", localStage: "synchronization_pending" }
        : { status: "completed", localStage: "synchronized", localSynchronization: proof }
    });
  });

  it("rejects a positive PR number that differs from the exact original merge action", async () => {
    const f = await fixture("confirmed", false, undefined, undefined, { receive: false, journalOnly: true, journalMerge: true });
    const operation = (await f.database.recordedGitOperation(PROJECT, "original-create"))!;
    const raw = new DatabaseSync(path.join(f.root, "data", "collaboration-state.sqlite"));
    try { raw.prepare("UPDATE operations SET remote_fact_json=? WHERE operation_id='original-create'")
      .run(JSON.stringify({ ...operation.remoteFact, providerNumber: 72 })); } finally { raw.close(); }
    await expect(captureKnownAgentGitResults(f.database, PROJECT)).rejects.toThrow("original Agent Git action");
    expect((await f.database.pendingControlResultEvents(PROJECT, "worker"))).toHaveLength(0);
  });

  it("keeps an existing normal tool result instead of manufacturing another journal return", async () => {
    const f = await fixture("confirmed", false, undefined, undefined, { receive: false, journalOnly: true });
    const request = (await agentGitOperationJournal(f.database, PROJECT).recordedRequest("original-create"))!;
    const result = (await f.database.recordedGitOperation(PROJECT, "original-create"))!.remoteFact;
    const receipts = controlResultReceipts(f.database, { projectId: PROJECT, agentId: "worker", invocationId: request.invocationId,
      session: f.session, executionContext: request.nativeBinding!.executionContext });
    const id = (await receipts.record({ envelope: { projectId: PROJECT, agent: "worker", invocationId: request.invocationId,
      callId: request.callId, receivedAt: request.requestedAt, stateVersion: 2, action: request.action }, requestedCallId: request.callId, result }));
    await captureKnownAgentGitResults(f.database, PROJECT);
    expect((await f.database.pendingControlResultEvents(PROJECT, "worker"))).toEqual([
      expect.objectContaining({ payload: { receipt: expect.objectContaining({ id, result }) } })
    ]);
  });

  it("keeps a later normal tool return separate from an already captured journal observation of the same call", async () => {
    const f = await fixture("confirmed", false, undefined, undefined, { receive: false, journalOnly: true });
    await captureKnownAgentGitResults(f.database, PROJECT);
    const earlier = (await f.database.pendingControlResultEvents(PROJECT, "worker"))[0];
    const request = (await agentGitOperationJournal(f.database, PROJECT).recordedRequest("original-create"))!;
    (await controlResultReceipts(f.database, { projectId: PROJECT, agentId: "worker", invocationId: request.invocationId,
      session: f.session, executionContext: request.nativeBinding!.executionContext }).record({
      envelope: { projectId: PROJECT, agent: "worker", invocationId: request.invocationId, callId: request.callId,
        receivedAt: request.requestedAt, stateVersion: 2, action: request.action }, requestedCallId: request.callId,
      result: (await f.database.recordedGitOperation(PROJECT, "original-create"))!.remoteFact }));
    await captureKnownAgentGitResults(f.database, PROJECT);
    expect((await f.database.pendingControlResultEvents(PROJECT, "worker"))).toHaveLength(2);
    expect((await f.database.eventByRequestId(PROJECT, earlier.requestId!))).toEqual(earlier);
  });

  it("does not invent an original Session when a historical journal has no captured request or a foreign worktree", async () => {
    const f = await fixture("confirmed", false, undefined, undefined, { receive: false, journalOnly: true, foreignWorktree: true });
    await captureKnownAgentGitResults(f.database, PROJECT);
    expect((await f.database.pendingControlResultEvents(PROJECT, "worker"))).toHaveLength(0);
    expect((await agentGitOperationJournal(f.database, PROJECT).recordedRequest("original-push"))).toBeUndefined();
    expect(f.nativeOpens).toHaveLength(0);
  });

  it.each([false, true])("captures a late known journal result for its stopped original owner (scoped=%s), then delivers it without repeating provider/Git actions", async scoped => {
    const f = await fixture("confirmed", false, scoped ? "user" : undefined, undefined, { receive: true, journalOnly: true });
    expect((await f.database.pendingControlResultEvents(PROJECT, "worker"))).toHaveLength(0);
    const before = (await f.database.projectState(PROJECT));
    const original = (await agentGitOperationJournal(f.database, PROJECT).recordedRequest("original-create"));
    await f.coordinator.resumeProject(f.state);
    await until(() => f.nativeOpens.length > 0 || ["paused", "retrying"].includes(f.state.status));
    expect(f.nativeOpens).toHaveLength(1);
    await until(async () => (await f.database.eventsAfter(PROJECT)).some(event => event.type === "control.result.received") &&
      (await f.database.terminalPushObservationTurns(PROJECT)).some(turn => turn.status === "stopped"));
    expect(f.queries).toHaveLength(0);
    expect(f.provider.observeRef.mock.calls.every(call => call[2] !== "executions/old-execution")).toBe(true);
    const observed = (await f.database.eventsAfter(PROJECT)).filter(event => event.type === "control.result.recorded");
    expect(observed).toEqual([expect.objectContaining({ invocationId: "inv_original_worker", payload: {
      receipt: expect.objectContaining({ callId: "late-pr-result", origin: { kind: "journal-observation",
        operationId: "original-create", status: "completed", localStage: "not_required" } }) } })]);
    expect((await f.database.pendingControlResultEvents(PROJECT, "worker"))).toHaveLength(0);
    expect((await agentGitOperationJournal(f.database, PROJECT).recordedRequest("original-create"))).toEqual(original);
    expect((await f.database.projectState(PROJECT)).executions).toEqual(before.executions);
    expect((await f.database.projectState(PROJECT)).scopedExecutions).toEqual(before.scopedExecutions);
    expect(f.state.taskCompletions!["old-execution"]).toEqual(f.priorReceipt);
    await captureKnownAgentGitResults(f.database, PROJECT);
    expect((await f.database.eventsAfter(PROJECT)).filter(event => event.type === "control.result.recorded")).toHaveLength(1);
    expect(await fs.readFile(f.oldMemory, "utf8")).toBe("Original business memory\n");
  });

  it("wakes a stopped completed owner for a saved PR result even after its push finalized, then records only actual original-Session input", async () => {
    const f = await fixture("confirmed", false, undefined, undefined, { receive: true });
    const before = (await f.database.projectState(PROJECT));
    await f.coordinator.resumeProject(f.state);
    await until(() => ["paused", "retrying"].includes(f.state.status));
    expect(f.nativeOpens).toHaveLength(1);
    expect(f.queries).toHaveLength(0);
    expect(f.provider.observeRef.mock.calls.every(call => call[2] !== "executions/old-execution")).toBe(true);
    expect((await f.database.pendingControlResultEvents(PROJECT, "worker"))).toHaveLength(0);
    expect((await f.database.eventsAfter(PROJECT)).filter(event => event.type === "control.result.received")).toEqual([
      expect.objectContaining({ payload: expect.objectContaining({ originalInvocationId: "inv_original_worker", session: f.session }) })
    ]);
    expect((await f.database.projectState(PROJECT)).executions).toEqual(before.executions);
    expect(f.state.taskCompletions!["old-execution"]).toEqual(f.priorReceipt);
    expect(await fs.readFile(f.oldMemory, "utf8")).toBe("Original business memory\n");
    expect((await f.database.terminalPushObservationRepairCount(PROJECT, "old-execution"))).toBe(1);
  });

  it.each([{ foreignSession: true }, { foreignExecution: true }, { changedGeneration: true }, { futureEpoch: true }, { foreignWorktree: true }])("never wakes an old completed owner for unrelated pending facts: %j", async foreign => {
    const f = await fixture("confirmed", false, undefined, undefined, { receive: true, ...foreign });
    expect((await f.database.terminalPushObservationCandidates(PROJECT))).toEqual([]);
    await f.coordinator.resumeProject(f.state);
    await until(() => ["paused", "retrying"].includes(f.state.status));
    expect(f.nativeOpens).toHaveLength(0);
    expect((await f.database.pendingControlResultEvents(PROJECT, "worker"))).toHaveLength(1);
    expect((await f.database.terminalPushObservationRepairCount(PROJECT, "old-execution"))).toBe(0);
  });

  it.each([false, true])("keeps prepared but unreceived results pending and exhausts the original finite budget across writer handoff (journalOnly=%s)", async journalOnly => {
    const f = await fixture("confirmed", false, undefined, undefined, { receive: false, journalOnly });
    await f.coordinator.resumeProject(f.state);
    await until(() => ["paused", "retrying"].includes(f.state.status));
    expect(f.nativeOpens).toHaveLength(2);
    expect((await f.database.terminalPushObservationTurns(PROJECT)).every(turn => turn.status === "stopped")).toBe(true);
    expect((await f.database.eventsAfter(PROJECT)).filter(event => event.type === "control.result.notification.prepared")).toHaveLength(2);
    expect((await f.database.eventsAfter(PROJECT)).filter(event => event.type === "control.result.received")).toHaveLength(0);
    expect((await f.database.pendingControlResultEvents(PROJECT, "worker"))).toHaveLength(1);
    expect((await f.database.terminalPushObservationRepairCount(PROJECT, "old-execution"))).toBe(2);
    const unresolved = (await f.database.eventsAfter(PROJECT)).find(event => event.type === "agent.terminal_push_observation.unresolved");
    expect(unresolved?.payload.pendingResults).toEqual([expect.objectContaining({ callId: "late-pr-result" })]);
    await f.coordinator.shutdown();
    const next = (await f.makeCoordinator()); await next.initialize(); await next.recoverProject(f.state);
    const database = (await (next as unknown as { database(): CollaborationStateDatabase }).database());
    expect((await database.terminalPushObservationRepairCount(PROJECT, "old-execution"))).toBe(2);
    expect((await database.pendingControlResultEvents(PROJECT, "worker"))).toHaveLength(1);
    expect(f.state.taskCompletions!["old-execution"]).toEqual(f.priorReceipt);
  });

  it.each([false, true])("retains a saved result without reserving a notification when the original native Stop is unproven (journalOnly=%s)", async journalOnly => {
    const f = await fixture("unconfirmed-stop", false, undefined, undefined, { receive: true, journalOnly });
    await f.coordinator.resumeProject(f.state);
    await until(() => ["paused", "retrying"].includes(f.state.status));
    expect(f.nativeOpens).toHaveLength(0);
    expect((await f.database.pendingControlResultEvents(PROJECT, "worker"))).toHaveLength(1);
    expect((await f.database.terminalPushObservationRepairCount(PROJECT, "old-execution"))).toBe(0);
  });

  it("delivers a stopped scoped owner's saved result without reopening its completed arrival or group business", async () => {
    const f = await fixture("confirmed", false, "user", undefined, { receive: true });
    const original = (await f.database.scopedExecution(PROJECT, "old-execution"));
    await f.coordinator.resumeProject(f.state);
    await until(async () => (await f.database.pendingControlResultEvents(PROJECT, "worker")).length === 0 &&
      (await f.database.terminalPushObservationTurns(PROJECT)).some(turn => turn.status === "stopped"));
    expect(f.nativeOpens).toHaveLength(1);
    expect((await f.database.pendingControlResultEvents(PROJECT, "worker"))).toHaveLength(0);
    expect((await f.database.scopedExecution(PROJECT, "old-execution"))).toEqual(original);
    expect((await f.database.scopedGroupIssues(PROJECT)).filter(issue => issue.kind === "terminal-push")).toEqual([]);
    expect((await f.database.terminalPushObservationRepairCount(PROJECT, "old-execution"))).toBe(1);
  });

  it("transports an unreceived scoped result through the original direct Leader hierarchy after the finite receipt budget", async () => {
    const f = await fixture("confirmed", false, "user", undefined, { receive: false });
    const original = (await f.database.scopedExecution(PROJECT, "old-execution"));
    await f.coordinator.resumeProject(f.state);
    await until(() => ["paused", "retrying"].includes(f.state.status));
    expect(f.nativeOpens).toHaveLength(2);
    expect((await f.database.pendingControlResultEvents(PROJECT, "worker"))).toHaveLength(1);
    expect(f.managerChoices.map(choice => choice.agent)).toEqual(["direct-leader", "parent-leader", "root-leader", "main"]);
    expect((await f.database.scopedExecution(PROJECT, "old-execution"))).toEqual(original);
    expect((await f.database.terminalPushObservationRepairCount(PROJECT, "old-execution"))).toBe(2);
  });

  it("formal user reply wakes the exact original Main once with its own memory and lets it choose the next receipt action", async () => {
    const f = await fixture("missing", false, undefined, "user-reply"); await f.coordinator.resumeProject(f.state);
    await until(() => f.state.userIntervention?.status === "pending" || Boolean(f.state.lastError));
    const first = (await f.database.terminalPushCoordinatorTurns(PROJECT))[0];
    const originalQuestion = f.state.userIntervention!;
    await f.coordinator.respondToUserIntervention(f.state, { message: "My explicit response: inspect the retained receipt again" });
    await until(async () => (await f.database.terminalPushObservationTurns(PROJECT)).length === 2 &&
      (await f.database.terminalPushObservationTurns(PROJECT)).every(turn => turn.status === "stopped") || Boolean(f.state.lastError));
    expect(f.state.lastError).toBeUndefined(); expect(f.managerOpens).toHaveLength(2);
    const turns = (await f.database.terminalPushCoordinatorTurns(PROJECT));
    expect(turns[1]).toMatchObject({ status: "stopped", previousInvocationId: first.invocationId,
      userResponseRequestId: `terminal-push-user-response:${originalQuestion.id}`, acceptedDecision: { action: { tool: "coordinate_agent_receipt", operation: "retry" } } });
    expect(f.managerChoices).toEqual([{ agent: "main", operation: "request_user" }, { agent: "main", operation: "retry" }]);
    expect((await f.database.terminalPushCoordinationIncidents(PROJECT))[0]).toMatchObject({ status: "retry-consumed", userResponse: {
      interventionId: originalQuestion.id, managerInvocationId: first.invocationId, response: "My explicit response: inspect the retained receipt again" } });
    expect((await f.database.terminalPushObservationRepairCount(PROJECT, "old-execution"))).toBe(1);
    expect(f.state.agentSessionIds!.main).toBe("original-main-session");
  });

  it("reply after writer restart resumes the original question's Main and preserves every prior native identity", async () => {
    const f = await fixture("missing", false, undefined, "user-reply"); await f.coordinator.resumeProject(f.state);
    await until(() => f.state.userIntervention?.status === "pending" || Boolean(f.state.lastError));
    const question = f.state.userIntervention!; const identities = structuredClone(f.state.agentSessions);
    await f.coordinator.shutdown(); const state = await f.storage.loadState(PROJECT); const next = (await f.makeCoordinator()); await next.initialize();
    await next.recoverProject(state); expect(f.managerOpens).toHaveLength(1);
    const db = (await (next as unknown as { database(): CollaborationStateDatabase }).database());
    await next.respondToUserIntervention(state, { message: "My exact response after restart" });
    await until(async () => (await db.terminalPushCoordinationIncidents(PROJECT))[0].status === "retry-consumed" || Boolean(state.lastError));
    expect(state.lastError).toBeUndefined(); expect(f.managerOpens).toHaveLength(2);
    expect((await db.terminalPushCoordinationIncidents(PROJECT))[0].userResponse).toMatchObject({ interventionId: question.id, response: "My exact response after restart" });
    expect(state.agentSessions).toEqual(identities);
  });

  it("an S-accepted reply survives a failed state save and restart without asking the user again or resetting the receipt budget", async () => {
    const f = await fixture("missing", false, undefined, "user-reply"); await f.coordinator.resumeProject(f.state);
    await until(() => f.state.userIntervention?.status === "pending" || Boolean(f.state.lastError));
    // Restore the fully settled question before injecting the next response
    // write failure; publication of the first question must not consume it.
    await f.coordinator.shutdown();
    const restored = await f.storage.loadState(PROJECT); const answering = (await f.makeCoordinator()); await answering.initialize();
    await answering.recoverProject(restored);
    const answeringDb = (await (answering as unknown as { database(): CollaborationStateDatabase }).database());
    const files = f.storage as unknown as { atomicJson(filePath: string, value: unknown): Promise<void> };
    const atomicJson = files.atomicJson.bind(f.storage);
    let failed = false;
    const fault = vi.spyOn(files, "atomicJson").mockImplementation(async (filePath, value) => {
      const snapshot = value as ProjectState;
      if (!failed && filePath === path.join(f.storage.projectDir(PROJECT), "state.json") && snapshot.userIntervention?.status === "answered") {
        failed = true; throw new Error("Actual response state-save failure");
      }
      return atomicJson(filePath, value);
    });
    await expect(answering.respondToUserIntervention(restored, { message: "My durable reply before file save" })).rejects.toThrow(/state-save failure/);
    fault.mockRestore();
    expect((await answeringDb.terminalPushCoordinationIncidents(PROJECT))[0].userResponse?.response).toBe("My durable reply before file save");
    expect((await f.storage.loadState(PROJECT)).userIntervention?.status).toBe("pending");
    await answering.shutdown();
    const state = await f.storage.loadState(PROJECT); const next = (await f.makeCoordinator()); await next.initialize();
    const db = (await (next as unknown as { database(): CollaborationStateDatabase }).database());
    await next.recoverProject(state);
    await until(async () => (await db.terminalPushCoordinationIncidents(PROJECT))[0].status === "retry-consumed" || Boolean(state.lastError));
    expect(state.lastError).toBeUndefined(); expect(f.managerOpens).toHaveLength(2);
    expect((await db.eventsAfter(PROJECT, 0, 1000)).filter(event => event.type === "agent.terminal_push_coordination.user.answered")).toHaveLength(1);
    expect((await db.terminalPushObservationRepairCount(PROJECT, "old-execution"))).toBe(1);
  });

  it("user reply gives only a finite Main mechanism allowance and never becomes a system-authored retry", async () => {
    const f = await fixture("missing", false, undefined, "reply-native-error"); await f.coordinator.resumeProject(f.state);
    await until(() => f.state.userIntervention?.status === "pending" || Boolean(f.state.lastError));
    await f.coordinator.respondToUserIntervention(f.state, { message: "My reply requires a Main decision" });
    await until(() => Boolean(f.state.lastError));
    expect(f.managerOpens).toHaveLength(3); expect(f.managerChoices).toEqual([{ agent: "main", operation: "request_user" }]);
    expect(f.nativeOpens).toHaveLength(1); expect((await f.database.terminalPushCoordinationIncidents(PROJECT))[0].status).toBe("manager-failed");
    expect((await f.database.terminalPushObservationRepairCount(PROJECT, "old-execution"))).toBe(1);
    expect((await f.database.terminalPushObservationContinuation(PROJECT, "old-execution", "original-push"))).toBeUndefined();
  });

  it("a preparation failure before native open keeps the original binding and allows one exact finite coordinator recovery", async () => {
    const f = await fixture("missing", false, undefined, "prepare-error"); await f.coordinator.resumeProject(f.state);
    await until(() => f.state.userIntervention?.status === "pending" || Boolean(f.state.lastError));
    expect(f.state.lastError).toBeUndefined(); expect(f.managerOpens).toHaveLength(1);
    const turns = (await f.database.terminalPushCoordinatorTurns(PROJECT));
    expect(turns).toHaveLength(2); expect(turns[0]).toMatchObject({ status: "stopped", failure: "Actual coordinator preparation failed before native open" });
    expect(turns[1]).toMatchObject({ status: "stopped", previousInvocationId: turns[0].invocationId, acceptedDecision: { action: { tool: "request_user" } } });
    expect(f.state.agentSessionIds!.main).toBe("original-main-session");
  });

  it("dispatches a narrow original Main coordinator and publishes only its accepted question after physical Stop", async () => {
    const f = await fixture("missing", false, undefined, "user");
    const before = (await f.database.projectState(PROJECT)); const sessions = structuredClone(f.state.agentSessions);
    await f.coordinator.resumeProject(f.state);
    await until(() => Boolean(f.state.userIntervention || f.state.lastError));
    expect(f.state.lastError).toBeUndefined();
    expect(f.state.userIntervention).toMatchObject({ status: "pending", requestedBy: "main", message: "My exact receipt question",
      requestedInvocationId: f.managerOpens[0]?.request.invocationId });
    expect(f.managerOpens).toHaveLength(1); expect(f.managerCloses).toHaveLength(1); expect(f.mainInputs).toHaveLength(0);
    const turn = (await f.database.terminalPushCoordinatorTurns(PROJECT))[0];
    expect(turn).toMatchObject({ status: "stopped", completion: { action: { memory: "My actual Main coordination memory" } }, acceptedDecision: { action: { tool: "request_user" } } });
    expect((await f.database.terminalPushCoordinationIncidents(PROJECT))[0].status).toBe("waiting-user");
    expect(await fs.readFile(path.join(f.storage.projectDir(PROJECT), "runtime", turn.invocationId, "terminal-push-coordination", "Memory.md"), "utf8"))
      .toBe("My actual Main coordination memory");
    expect(f.state.agentSessions).toEqual(sessions);
    const after = (await f.database.projectState(PROJECT));
    expect([after.tasks, after.executions, after.activeNodeRunId]).toEqual([before.tasks, before.executions, before.activeNodeRunId]);
  });

  it.each(["user", "retry"] as const)("honors disabled intervention during historical Git receipt recovery (Main choice: %s)", async choice => {
    const f = await fixture("missing", false, undefined, choice, undefined, false);
    await f.coordinator.resumeProject(f.state);
    await until(async () => Boolean(f.state.lastError) || (await f.database.recordedGitOperation(PROJECT, "original-push"))?.status === "finalized");
    expect(f.managerOpens.length).toBeGreaterThan(0);
    expect(f.managerOpens.every(input => input.request.terminalPushCoordination?.canRequestUser === false)).toBe(true);
    expect((await f.database.terminalPushCoordinatorTurns(PROJECT)).every(turn => turn.allowUserIntervention === false)).toBe(true);
    expect(f.state.userIntervention).toBeUndefined();
    expect(f.state.phase).not.toBe("user-intervention-required");
    expect((await f.database.eventsAfter(PROJECT, 0, 10_000)).some(event => event.type === "user.intervention.requested")).toBe(false);
    if (choice === "retry") {
      expect(f.state.lastError).toBeUndefined();
      expect(f.managerChoices).toEqual([{ agent: "main", operation: "retry" }]);
      expect((await f.database.recordedGitOperation(PROJECT, "original-push"))?.status).toBe("finalized");
    } else {
      expect(f.state.lastError).toContain("User intervention is disabled");
      expect(f.managerChoices).toEqual([]);
      expect((await f.database.terminalPushCoordinationIncidents(PROJECT))[0].status).toBe("manager-failed");
    }
  });

  it("a stopped Main's explicit retry dispatches the original read-only Agent once and retains its automatic budget", async () => {
    const f = await fixture("missing", false, undefined, "retry");
    await f.coordinator.resumeProject(f.state);
    await until(async () => (await f.database.recordedGitOperation(PROJECT, "original-push"))?.status === "finalized" || Boolean(f.state.lastError));
    expect(f.state.lastError).toBeUndefined(); expect(f.managerChoices).toEqual([{ agent: "main", operation: "retry" }]);
    expect(f.nativeOpens).toHaveLength(2); expect(f.managerCloses).toHaveLength(1);
    const observations = (await f.database.terminalPushObservationTurns(PROJECT));
    expect(observations[1].coordination?.envelope.action).toMatchObject({ tool: "coordinate_agent_receipt", operation: "retry" });
    expect((await f.database.terminalPushObservationRepairCount(PROJECT, "old-execution"))).toBe(1);
    expect((await f.database.terminalPushCoordinationIncidents(PROJECT))[0].status).toBe("retry-consumed");
  });

  it("a coordinator that omits finish receives a finite wake in the same session and authors its own finish", async () => {
    const f = await fixture("missing", false, undefined, "missing-finish");
    await f.coordinator.resumeProject(f.state); await until(() => Boolean(f.state.userIntervention || f.state.lastError));
    expect(f.state.lastError).toBeUndefined(); expect(f.managerOpens).toHaveLength(2);
    const turns = (await f.database.terminalPushCoordinatorTurns(PROJECT));
    expect(turns[0]).toMatchObject({ status: "stopped", failure: expect.any(String) });
    expect(turns[1]).toMatchObject({ status: "stopped", previousInvocationId: turns[0].invocationId, acceptedDecision: { action: { tool: "request_user" } } });
    expect(f.managerOpens.every(input => input.request.resumeThreadId === "original-main-session")).toBe(true);
    expect(f.state.userIntervention?.requestedInvocationId).toBe(turns[1].invocationId);
  });

  it("native Main failure exhausts its fast attempts and retains automatic recovery without manufacturing a user question", async () => {
    const f = await fixture("missing", false, undefined, "native-error");
    await f.coordinator.resumeProject(f.state); await until(() => Boolean(f.state.lastError));
    expect(f.managerOpens).toHaveLength(2); expect(f.managerCloses).toHaveLength(2);
    expect((await f.database.terminalPushCoordinationIncidents(PROJECT))[0].status).toBe("manager-failed");
    expect(f.state.userIntervention).toBeUndefined(); expect(f.state.status).toBe(hasUserWorkflowPause(f.state) ? "paused" : "retrying"); expect(f.mainInputs).toHaveLength(0);
  });

  it("Pause retains the active coordinator scene and Resume settles its own staged decision after Stop", async () => {
    const f = await fixture("missing", false, undefined, "gate"); await f.coordinator.resumeProject(f.state); await f.active;
    const pause = f.coordinator.pauseProject(f.state); (await f.release()); await pause;
    expect(f.state.status).toBe(hasUserWorkflowPause(f.state) ? "paused" : "retrying"); expect(f.managerCloses).toHaveLength(0);
    expect((await f.database.terminalPushCoordinatorTurns(PROJECT))[0]).toMatchObject({ status: "opened", completion: expect.any(Object) });
    expect((await f.database.projectState(PROJECT)).runtimeActivities.some(activity => activity.scopeKind === "terminal-push-coordinator")).toBe(true);
    await f.coordinator.resumeProject(f.state); await until(() => Boolean(f.state.userIntervention || f.state.lastError));
    expect(f.state.lastError).toBeUndefined(); expect(f.managerOpens).toHaveLength(1); expect(f.managerCloses).toHaveLength(1);
    expect(f.state.userIntervention?.status).toBe("pending");
  });

  it("unproven coordinator Stop retains the reservation and blocks its question until exact native recovery", async () => {
    const f = await fixture("missing", false, undefined, "close-error"); await f.coordinator.resumeProject(f.state);
    await until(() => Boolean(f.state.lastError)); expect(f.state.userIntervention).toBeUndefined();
    expect((await f.database.terminalPushCoordinatorTurns(PROJECT))[0].status).toBe("opened"); expect(f.managerOpens).toHaveLength(1);
    (await f.allowClose()); await f.coordinator.cancelProject(f.state, { actor: "user", reason: "user_cancelled" });
    expect((await f.database.terminalPushCoordinatorTurns(PROJECT))[0].status).toBe("stopped");
    expect(f.state.phase).toBe("collaboration:user-cancelled");
  });

  it("escalates a completed original Agent's receipt through J Leader, H Leader, G Leader and actual GLOBAL Main", async () => {
    const f = await fixture("missing",false,"user"); const before = (await f.database.projectState(PROJECT));
    const bindings = structuredClone(f.state.agentSessions);
    await f.coordinator.resumeProject(f.state);
    await until(()=>f.state.userIntervention?.status==="pending" || Boolean(f.state.lastError));
    expect(f.state.userIntervention,JSON.stringify({error:f.state.lastError,issues:(await f.database.scopedGroupIssues(PROJECT)),choices:f.managerChoices})).toMatchObject({status:"pending",requestedBy:"main"});
    expect(f.managerChoices).toEqual([
      {agent:"direct-leader",operation:"escalate"},{agent:"parent-leader",operation:"escalate"},
      {agent:"root-leader",operation:"escalate"},{agent:"main",operation:"request_user"}
    ]);
    expect(f.nativeOpens).toHaveLength(1); expect(f.managerCloses).toHaveLength(4);
    expect((await f.database.terminalPushObservationRepairCount(PROJECT,"old-execution"))).toBe(1);
    expect((await f.database.scopedExecution(PROJECT,"old-execution"))).toEqual(before.scopedExecutions![0]);
    expect((await f.database.projectState(PROJECT)).scopedArrivals).toEqual(before.scopedArrivals);
    expect((await f.database.projectState(PROJECT)).tasks).toEqual(before.tasks);
    expect(f.state.taskCompletions!["old-execution"]).toEqual(f.priorReceipt);
    expect(f.state.agentSessions).toEqual(bindings); expect(await fs.readFile(f.oldMemory,"utf8")).toBe("Original business memory\n");
    expect((await f.database.recordedGitOperation(PROJECT,"original-push"))!.status).toBe("uncertain");
    const issue = (await f.database.scopedGroupIssues(PROJECT)).find(issue=>issue.kind==="terminal-push")!;
    expect(issue).toMatchObject({groupRunId:"run-J",executionId:"old-execution",ownershipEpoch:2,operationId:"original-push",arrivalRequestId:"worker-arrival"});
    const decisions = (await f.database.scopedAcceptedLeaderActions(PROJECT,"run-J")).filter(receipt=>receipt.incidentId===issue.id);
    expect(decisions[0].failedOwnershipEpoch).toBe(2);
    const opened = f.managerOpens.length;
    await f.coordinator.shutdown(); const next = (await f.makeCoordinator()); await next.initialize(); await next.recoverProject(f.state);
    expect(f.managerOpens).toHaveLength(opened); expect(f.state.userIntervention?.status).toBe("pending");
    const db = (await (next as unknown as {database():CollaborationStateDatabase}).database());
    expect((await db.scopedGroupIssues(PROJECT))).toContainEqual(issue); expect((await db.terminalPushObservationRepairCount(PROJECT,"old-execution"))).toBe(1);
  });

  it("consumes a released direct Leader's explicit retry once in the original read-only session without reopening business", async () => {
    const f = await fixture("missing",false,"retry"); const before = (await f.database.projectState(PROJECT));
    await f.coordinator.resumeProject(f.state);
    await until(async ()=>(await f.database.recordedGitOperation(PROJECT,"original-push"))?.status==="finalized" &&
      (await f.database.terminalPushObservationTurns(PROJECT)).every(turn=>turn.status==="stopped") || Boolean(f.state.lastError));
    expect((await f.database.recordedGitOperation(PROJECT,"original-push"))!.status,JSON.stringify({error:f.state.lastError,choices:f.managerChoices})).toBe("finalized");
    expect(f.nativeOpens).toHaveLength(2);
    const turns = (await f.database.terminalPushObservationTurns(PROJECT));
    expect(turns[1].coordination?.envelope.action).toMatchObject({tool:"coordinate_group_task",operation:"retry",rationale:"Inspect the same original journal again"});
    expect(turns[1].previousInvocationId).toBe(turns[0].invocationId);
    expect((await f.database.terminalPushObservationRepairCount(PROJECT,"old-execution"))).toBe(1);
    expect((await f.database.scopedGroupIssues(PROJECT)).filter(issue=>issue.kind==="terminal-push")).toEqual([]);
    expect((await f.database.scopedExecution(PROJECT,"old-execution"))).toEqual(before.scopedExecutions![0]);
    expect((await f.database.projectState(PROJECT)).scopedArrivals).toEqual(before.scopedArrivals);
    expect(await fs.readFile(f.nativeOpens[1].request.inboxPath,"utf8")).toContain("Inspect the same original journal again");
    expect(f.managerCloses).toContain(turns[1].coordination!.envelope.invocationId);
    const count = turns.length;
    expect((await f.database.beginTerminalPushObservation({...turns[1],operationId:"original-push",invocationId:"inv_repeat_manager_retry",
      runtimePath:path.join(path.dirname(turns[1].runtimePath),"inv_repeat_manager_retry"),previousInvocationId:turns[1].invocationId,
      previousRuntimePath:turns[1].runtimePath,residentStopConfirmed:true,evidence:{fixtureNativeWasStopped:true}}))).toBeUndefined();
    expect((await f.database.terminalPushObservationTurns(PROJECT))).toHaveLength(count);
  });

  it("keeps an unsuccessful explicit receipt retry as a new precise issue and escalates without replenishing automatic repairs", async () => {
    const f = await fixture("missing",false,"retry-user"); const before = (await f.database.projectState(PROJECT));
    await f.coordinator.resumeProject(f.state);
    await until(()=>f.state.userIntervention?.status==="pending" || Boolean(f.state.lastError));
    expect(f.state.userIntervention,JSON.stringify({error:f.state.lastError,choices:f.managerChoices})).toMatchObject({status:"pending",requestedBy:"main"});
    expect(f.managerChoices.map(choice=>choice.operation)).toEqual(["retry","escalate","escalate","escalate","request_user"]);
    const turns = (await f.database.terminalPushObservationTurns(PROJECT)); expect(turns).toHaveLength(2);
    expect((await f.database.terminalPushObservationRepairCount(PROJECT,"old-execution"))).toBe(1);
    expect((await f.database.scopedExecution(PROJECT,"old-execution"))).toEqual(before.scopedExecutions![0]);
    const unresolved = (await f.database.authoritativeWorkflowFiles(PROJECT)).currentState.terminalPushObservationIssues!;
    expect(unresolved).toHaveLength(2);
    expect((unresolved[1].result as {invocationId:string}).invocationId).toBe(turns[1].invocationId);
    expect((await f.database.scopedGroupIssues(PROJECT)).filter(issue=>issue.kind==="terminal-push")).toHaveLength(1);
    await expect(f.database.beginTerminalPushObservation({...turns[1],operationId:"original-push",invocationId:"inv_reuse_old_manager_choice",
      runtimePath:path.join(path.dirname(turns[1].runtimePath),"inv_reuse_old_manager_choice"),previousInvocationId:turns[1].invocationId,
      previousRuntimePath:turns[1].runtimePath,residentStopConfirmed:true,evidence:{fixtureNativeWasStopped:true}})).rejects.toThrow(/exact released manager/);
    expect((await f.database.terminalPushObservationTurns(PROJECT))).toHaveLength(2);
    expect((await f.database.terminalPushObservationRepairCount(PROJECT,"old-execution"))).toBe(1);
  });

  it("a released Leader can explicitly authorize one receipt turn after the original two automatic repairs are spent", async () => {
    const f = await fixture("confirmed",false,"retry");
    for (const attempt of [1,2]) (await f.database.appendEvent({projectId:PROJECT,requestId:`original-scoped-repair-${attempt}`,
      type:"scoped.agent.mechanism_repair.requested",payload:{executionId:"old-execution",attempt}}));
    await f.coordinator.resumeProject(f.state);
    await until(async ()=>(await f.database.recordedGitOperation(PROJECT,"original-push"))?.status==="finalized" &&
      (await f.database.terminalPushObservationTurns(PROJECT)).every(turn=>turn.status==="stopped") || Boolean(f.state.lastError));
    expect((await f.database.recordedGitOperation(PROJECT,"original-push"))!.status,JSON.stringify({error:f.state.lastError,choices:f.managerChoices})).toBe("finalized");
    const turns = (await f.database.terminalPushObservationTurns(PROJECT)); expect(turns).toHaveLength(1);
    expect(turns[0].coordination?.envelope.action).toMatchObject({tool:"coordinate_group_task",operation:"retry"});
    expect(turns[0].attempt).toBe(3); expect(f.nativeOpens).toHaveLength(1);
    expect((await f.database.terminalPushObservationRepairCount(PROJECT,"old-execution"))).toBe(2);
    expect((await f.database.scopedExecution(PROJECT,"old-execution"))!.status).toBe("completed");
  });

  it("a new writer consumes the original released Leader retry without another manager choice or an automatic-budget reset", async () => {
    const f = await fixture("missing",false,"retry");
    const begin = f.database.beginTerminalPushObservation.bind(f.database);
    let shutdown: Promise<void> | undefined;
    let coordination: Awaited<ReturnType<CollaborationStateDatabase["terminalPushObservationContinuation"]>>;
    const reservation = vi.spyOn(f.database,"beginTerminalPushObservation").mockImplementation(async input=>{
      if (input.coordination && input.invocationId !== "inv_premature_manager_retry") {
        coordination = (await f.database.terminalPushObservationContinuation(PROJECT,"old-execution","original-push"));
        // An application exception now returns to its original manager. Model
        // a writer shutdown by actually aborting its run before reservation.
        shutdown = f.coordinator.shutdown();
        throw new DOMException("Controlled shutdown before the explicit retry reservation", "AbortError");
      }
      return begin(input);
    });
    await f.coordinator.resumeProject(f.state); await until(()=>Boolean(shutdown));
    await shutdown!;
    expect(f.nativeOpens).toHaveLength(1); expect(f.managerChoices).toEqual([{agent:"direct-leader",operation:"retry"}]);
    expect(coordination!.envelope.action).toMatchObject({tool:"coordinate_group_task",operation:"retry"});
    reservation.mockRestore();
    const next = (await f.makeCoordinator()); await next.initialize(); await next.recoverProject(f.state);
    const database = (await (next as unknown as {database():CollaborationStateDatabase}).database());
    expect((await database.eventsAfter(PROJECT,0,1000)).filter(event=>event.type==="scoped.recovery.application.failed")).toEqual([]);
    expect(f.nativeOpens).toHaveLength(1); expect((await database.terminalPushObservationContinuation(PROJECT,"old-execution","original-push"))).toEqual(coordination);
    await next.resumeProject(f.state);
    await until(async ()=>(await database.recordedGitOperation(PROJECT,"original-push"))?.status==="finalized" &&
      (await database.terminalPushObservationTurns(PROJECT)).every(turn=>turn.status==="stopped") || f.state.status==="paused");
    expect((await database.recordedGitOperation(PROJECT,"original-push"))!.status,JSON.stringify({error:f.state.lastError,phase:f.state.phase,
      turns:await database.terminalPushObservationTurns(PROJECT),issues:await database.scopedGroupIssues(PROJECT),choices:f.managerChoices})).toBe("finalized");
    expect((await database.terminalPushObservationTurns(PROJECT)).at(-1)!.coordination).toEqual(coordination);
    expect(f.nativeOpens).toHaveLength(2); expect((await database.terminalPushObservationRepairCount(PROJECT,"old-execution"))).toBe(1);
    expect(f.managerChoices).toEqual([{agent:"direct-leader",operation:"retry"}]);
  });

  it("existing finite manager failure recovery escalates an actual stopped direct Leader channel failure", async () => {
    const f = await fixture("missing",false,"manager-error"); const before = (await f.database.projectState(PROJECT));
    // Both already-authorized technical attempts and their escalation belong
    // to the same pump; another user Resume must not be required to advance it.
    await f.coordinator.resumeProject(f.state);
    await until(()=>f.state.userIntervention?.status==="pending");
    expect(f.state.userIntervention,JSON.stringify({error:f.state.lastError,choices:f.managerChoices,failures:(await f.database.scopedManagementFailures(PROJECT))})).toMatchObject({status:"pending",requestedBy:"main"});
    expect(f.managerOpens.filter(input=>input.request.agent==="direct-leader")).toHaveLength(2);
    expect((await f.database.scopedManagementFailures(PROJECT)).filter(failure=>failure.managerAgentId==="direct-leader").map(failure=>failure.attempt)).toEqual([1,2]);
    expect(f.managerChoices.map(choice=>choice.agent)).toEqual(["parent-leader","root-leader","main"]);
    expect((await f.database.scopedExecution(PROJECT,"old-execution"))).toEqual(before.scopedExecutions![0]);
    expect((await f.database.terminalPushObservationRepairCount(PROJECT,"old-execution"))).toBe(1);
  });

  it("never wakes a manager or fabricates a group receipt issue before trusted native stop", async () => {
    const f = await fixture("unconfirmed-stop",false,"user"); await f.coordinator.resumeProject(f.state);
    await until(()=>Boolean(f.state.lastError));
    expect(f.nativeOpens).toHaveLength(0); expect(f.managerOpens).toHaveLength(0); expect((await f.database.scopedGroupIssues(PROJECT))).toEqual([]);
    expect((await f.database.terminalPushObservationRepairCount(PROJECT,"old-execution"))).toBe(0);
    await expect(f.database.recordScopedGroupIssue({projectId:PROJECT,groupRunId:"run-J",kind:"terminal-push",reason:"Unverified synthetic issue"})).rejects.toThrow();
    (await f.database.appendEvent({projectId:PROJECT,agentId:"worker",requestId:"false-native-proof",type:"agent.terminal_push_observation.unresolved",
      payload:{executionId:"old-execution",ownershipEpoch:2,operationId:"original-push",nativeStopped:true,repairCount:2}}));
    await expect(f.database.recordTerminalPushObservationGroupIssue({projectId:PROJECT,executionId:"old-execution",ownershipEpoch:2,
      operationId:"original-push",unresolvedRequestId:"false-native-proof"})).rejects.toThrow(/exact unresolved journal/);
    expect((await f.database.scopedGroupIssues(PROJECT))).toEqual([]);
  });

  it.each(["confirmed", "never-finish", "missing"] as const)("Main reads the current original journal separately from its reservation snapshot (%s)", async mode => {
    const f = await fixture(mode); const before = (await f.database.projectState(PROJECT));
    await f.coordinator.resumeProject(f.state);
    await until(() => f.state.userIntervention?.status === "pending" || Boolean(f.state.lastError));
    expect(f.state.lastError).toBeUndefined(); expect(f.mainWorkflowFacts).toHaveLength(1);
    const facts = f.mainWorkflowFacts[0];
    const current = (await f.database.recordedGitOperation(PROJECT,"original-push"))!;
    expect(facts.terminalPushObservationOperations).toEqual([current]);
    expect(current).toMatchObject({ id: "original-push", kind: "git.push", ownerExecutionId: "old-execution",
      ownershipEpoch: 1, expectedHead: HEAD, expectedBase: "executions/old-execution", payloadHash: "a".repeat(64),
      status: mode === "missing" ? "uncertain" : "finalized" });
    expect(facts.terminalPushObservations![0].operation.status).toBe("uncertain");
    expect(facts.terminalPushObservations![0].operation.remoteFact).toBeUndefined();
    if (mode === "missing") expect(current.remoteFact).toBeUndefined();
    else expect(current.remoteFact).toMatchObject({ owner: "fixture", repository: "retained", ref: "executions/old-execution", status: "present", sha: HEAD });
    if (mode !== "confirmed") {
      const prompt = await fs.readFile(f.mainInputs[0],"utf8");
      expect(prompt).not.toContain("terminalPushObservationOperations");
      expect(prompt).not.toContain("immutable reservation snapshot");
      expect(prompt).not.toContain(JSON.stringify(current));
      expect(JSON.stringify(f.mainContextSources[0])).toContain(JSON.stringify(current));
    }
    expect((await f.database.projectState(PROJECT)).executions).toEqual(before.executions);
    expect((await f.database.projectState(PROJECT)).tasks).toEqual(before.tasks);
    expect(f.state.taskCompletions!["old-execution"]).toEqual(f.priorReceipt);
    expect(f.state.agentSessions!.worker).toEqual(f.session);
  });

  it("publishes the exact issue journal even when the original budget is exhausted before any receipt turn", async () => {
    const f = await fixture();
    const raw = new DatabaseSync(path.join(f.root,"data","collaboration-state.sqlite"));
    for (let attempt = 1; attempt <= 2; attempt++) {
      raw.prepare(`INSERT INTO project_events(project_id,seq,event_id,request_id,execution_id,
        ownership_epoch,occurred_at,event_type,payload_json)
        SELECT ?,next_event_seq,?,?,'old-execution',2,?,
          'execution.mechanism_repair.requested',? FROM project_heads WHERE project_id=?`)
        .run(PROJECT,`old-repair-${attempt}`,`old-repair-request-${attempt}`,new Date().toISOString(),JSON.stringify({attempt}),PROJECT);
      raw.prepare("UPDATE project_heads SET next_event_seq=next_event_seq+1 WHERE project_id=?").run(PROJECT);
    }
    raw.close();
    await f.coordinator.resumeProject(f.state);
    await until(() => f.state.userIntervention?.status === "pending" || Boolean(f.state.lastError));
    expect(f.state.lastError).toBeUndefined(); expect(f.nativeOpens).toHaveLength(0); expect(f.queries).toHaveLength(0);
    const facts = f.mainWorkflowFacts[0];
    expect(facts.terminalPushObservations).toEqual([]);
    expect(facts.terminalPushObservationIssues).toEqual([expect.objectContaining({ executionId: "old-execution", operationId: "original-push", repairCount: 2 })]);
    expect(facts.terminalPushObservationOperations).toEqual([(await f.database.recordedGitOperation(PROJECT,"original-push"))]);
    expect(JSON.stringify(f.mainContextSources[0])).toContain(JSON.stringify(facts.terminalPushObservationOperations![0]));
    expect((await f.database.terminalPushObservationRepairCount(PROJECT,"old-execution"))).toBe(2);
    expect(f.state.taskCompletions!["old-execution"]).toEqual(f.priorReceipt);
  });

  it("publishes only original push journals with the exact referenced owner without creating new proof or events", async () => {
    const f = await fixture("confirmed",true);
    for (const [requestId,executionId,operationId] of [
      ["wrong-owner","different-execution","original-push"],
      ["not-a-push","old-execution","original-repository"],
      ["missing-record","old-execution","missing-push"],
      ["exact-owner","old-execution","second-push"]
    ]) (await f.database.appendEvent({ projectId: PROJECT, type: "agent.terminal_push_observation.unresolved", requestId,
      payload: { executionId, operationId, nativeStopped: true, repairCount: 2 } }));
    const before = (await f.database.projectState(PROJECT));
    const files = (await f.database.authoritativeWorkflowFiles(PROJECT));
    expect(files.currentState.terminalPushObservationOperations).toEqual([(await f.database.recordedGitOperation(PROJECT,"second-push"))]);
    expect(files.currentState.terminalPushObservationOperations![0].remoteFact).toBeUndefined();
    expect(files.currentState.stateRevision).toBe(before.stateRevision);
    expect((await f.database.authoritativeWorkflowFiles(PROJECT))).toEqual(files);
    expect((await f.database.projectState(PROJECT))).toEqual(before);
    expect(f.provider.observeRef).not.toHaveBeenCalled(); expect(f.nativeOpens).toHaveLength(0);
  });

  it("each original journal gets its own receipt while sharing the same execution budget and native history", async () => {
    const f = await fixture("confirmed",true); await f.coordinator.resumeProject(f.state);
    await until(() => f.state.userIntervention?.status === "pending" || Boolean(f.state.lastError));
    expect(f.state.lastError).toBeUndefined(); expect(f.state.userIntervention?.status).toBe("pending");
    expect((await f.database.recordedGitOperation(PROJECT,"original-push"))!.status).toBe("finalized");
    expect((await f.database.recordedGitOperation(PROJECT,"second-push"))!.status).toBe("finalized");
    const turns = (await f.database.terminalPushObservationTurns(PROJECT));
    expect(turns).toHaveLength(2); expect(turns.map(turn => turn.completion!.operationId)).toEqual(["original-push","second-push"]);
    expect(turns[1].previousInvocationId).toBe(turns[0].invocationId);
    expect((await f.database.terminalPushObservationRepairCount(PROJECT,"old-execution"))).toBe(2);
    expect(f.state.agentSessions!.worker).toEqual(f.session);
  });
  it.each(["confirmed", "missing-finish", "native-error"] as const)("resumes the original closed owner and preserves its business records (%s)", async mode => {
    const f = await fixture(mode); const before = (await f.database.projectState(PROJECT));
    expect(f.nativeOpens).toHaveLength(0); // Saved user pause is not startup permission.
    await f.coordinator.resumeProject(f.state);
    await until(() => f.state.userIntervention?.status === "pending" || Boolean(f.state.lastError));
    expect(f.state.lastError).toBeUndefined(); expect(f.state.userIntervention?.status).toBe("pending");
    const expected = mode === "confirmed" ? 1 : 2;
    expect(f.nativeOpens).toHaveLength(expected); expect(f.closed).toHaveBeenCalledTimes(expected);
    const after = (await f.database.projectState(PROJECT));
    expect(after.executions).toEqual(before.executions); expect(after.tasks).toEqual(before.tasks);
    expect(f.state.taskCompletions!["old-execution"]).toEqual(f.priorReceipt);
    expect(f.state.agentSessions!.worker).toEqual(f.session);
    expect(await fs.readFile(f.oldMemory,"utf8")).toBe("Original business memory\n");
    expect((await f.database.recordedGitOperation(PROJECT,"original-push"))!.status).toBe("finalized");
    const turns = (await f.database.terminalPushObservationTurns(PROJECT)); expect(turns).toHaveLength(expected);
    expect(turns.every(turn => turn.status === "stopped")).toBe(true);
    expect(turns.at(-1)!.completion?.memory).toBe("Actual Agent observation memory");
    expect(turns.at(-1)!.result?.output).toBe("My original historical push is confirmed");
    expect((await f.database.terminalPushObservationRepairCount(PROJECT,"old-execution"))).toBe(expected);
    expect(f.cleanup).toHaveBeenCalled();
  });

  it("lets the original Agent report an unresolved receipt and gives the actual facts to Main without system Git retry", async () => {
    const f = await fixture("missing"); await f.coordinator.resumeProject(f.state);
    await until(() => f.state.userIntervention?.status === "pending" || Boolean(f.state.lastError));
    expect(f.state.lastError).toBeUndefined(); expect(f.state.userIntervention?.status).toBe("pending");
    expect(f.nativeOpens).toHaveLength(1);
    expect((await f.database.recordedGitOperation(PROJECT,"original-push"))!.status).toBe("uncertain");
    expect(await fs.readFile(f.mainInputs[0],"utf8")).toContain("requires coordination; its original completion and finite budget are retained");
    expect(f.state.userIntervention!.message).toBe("Please decide how to proceed");
    expect((await f.database.terminalPushObservationRepairCount(PROJECT,"old-execution"))).toBe(1);
    const facts = (await f.database.authoritativeWorkflowFiles(PROJECT)).currentState as {terminalPushObservationIssues: Array<{operationId:string;result:{output:string}}>};
    expect(facts.terminalPushObservationIssues[0]).toMatchObject({operationId:"original-push",result:{output:"I cannot settle this original remote receipt; ask my coordinator"}});
  });

  it("does not reserve any wake when the old native cannot be proven stopped", async () => {
    const f = await fixture("unconfirmed-stop"); await f.coordinator.resumeProject(f.state);
    await until(() => ["paused", "retrying"].includes(f.state.status) && Boolean(f.state.lastError));
    expect(f.nativeOpens).toHaveLength(0); expect(f.queries).toHaveLength(0);
    expect((await f.database.terminalPushObservationRepairCount(PROJECT,"old-execution"))).toBe(0);
  });

  it("missing finish remains bounded even after push succeeds, then Main explicitly asks the user", async () => {
    const f = await fixture("never-finish"); await f.coordinator.resumeProject(f.state);
    await until(() => f.state.userIntervention?.status === "pending" || Boolean(f.state.lastError));
    expect(f.state.lastError).toBeUndefined(); expect(f.state.userIntervention?.status).toBe("pending");
    expect(f.nativeOpens).toHaveLength(2); expect(f.closed).toHaveBeenCalledTimes(2);
    expect((await f.database.recordedGitOperation(PROJECT,"original-push"))!.status).toBe("finalized");
    expect((await f.database.terminalPushObservationTurns(PROJECT)).every(turn => turn.status === "stopped" && !turn.completion)).toBe(true);
    expect((await f.database.terminalPushObservationRepairCount(PROJECT,"old-execution"))).toBe(2);
    expect(await fs.readFile(f.mainInputs[0],"utf8")).toContain("requires coordination; its original completion and finite budget are retained");
  });

  it("a new writer restores the accepted snapshot, proves the orphan stopped, and continues the same original session within the old budget", async () => {
    const f = await fixture();
    const old = (await f.database.beginTerminalPushObservation({ projectId: PROJECT, executionId: "old-execution", ownershipEpoch: 2,
      agentId: "worker", invocationId: "inv_prior_crash", operationId: "original-push", originalInvocationId: "inv_original_worker",
      previousInvocationId: "inv_original_worker", previousRuntimePath: path.join(f.storage.projectDir(PROJECT),"runtime","inv_original_worker"),
      runtimePath: path.join(f.storage.projectDir(PROJECT),"runtime","inv_prior_crash"), residentStopConfirmed: true,
      evidence: { fixtureOriginalNativeWasStopped: true } }))!;
    (await f.database.markTerminalPushObservationOpened({ ...old, nativeProcessOpened: true }));
    const receipt = (await f.database.completeTerminalPushObservation({ ...old, envelope: { projectId: PROJECT, agent: "worker",
      invocationId: old.invocationId, callId: "prior-finish", capabilityHash: "c".repeat(64), stateVersion: 2,
      receivedAt: new Date().toISOString(), action: { tool: "finish_task", summary: "My prior observation", memory: "My accepted pre-crash memory" } } }));
    await f.coordinator.shutdown();
    const next = (await f.makeCoordinator()); await next.initialize();
    const nextDatabase = (await (next as unknown as { database(): CollaborationStateDatabase }).database());
    await next.recoverProject(f.state); expect(f.nativeOpens).toHaveLength(0);
    expect((await nextDatabase.terminalPushObservationTurns(PROJECT))[0].status).toBe("opened");
    await next.resumeProject(f.state);
    await until(() => f.state.userIntervention?.status === "pending" || Boolean(f.state.lastError));
    expect(f.state.lastError).toBeUndefined(); expect(f.state.userIntervention?.status).toBe("pending");
    expect(f.nativeOpens).toHaveLength(1);
    const turns = await nextDatabase.terminalPushObservationTurns(PROJECT);
    expect(turns).toHaveLength(2); expect(turns.every(turn => turn.status === "stopped")).toBe(true);
    expect(turns[0].completion).toEqual(receipt);
    expect(await fs.readFile(path.join(f.storage.projectDir(PROJECT),"runtime","inv_prior_crash","terminal-push-observation","Memory.md"),"utf8")).toBe("My accepted pre-crash memory");
    expect(await fs.readFile(f.nativeOpens[0].request.inboxPath,"utf8")).not.toContain("My accepted pre-crash memory");
    expect(JSON.stringify(f.nativeOpens[0].request.contextSources)).toContain("My accepted pre-crash memory");
    expect((await nextDatabase.terminalPushObservationRepairCount(PROJECT,"old-execution"))).toBe(2);
    expect(f.state.agentSessions!.worker).toEqual(f.session);
  });

  it("Pause reaches the current safe point and Resume keeps the same physical supplemental turn", async () => {
    const f = await fixture("gate"); await f.coordinator.resumeProject(f.state); await f.active;
    const pause = f.coordinator.pauseProject(f.state); await until(() => f.state.status === "pausing");
    (await f.release()); await pause;
    expect(f.paused, JSON.stringify({lastError:f.state.lastError, failures:(await f.database.eventsAfter(PROJECT,0,200)).filter(event=>event.type==="agent.terminal_push_observation.failed")})).toHaveBeenCalledOnce(); expect(f.closed).not.toHaveBeenCalled();
    expect((await f.database.terminalPushObservationTurns(PROJECT))[0]).toMatchObject({status:"opened",completion:{memory:"Actual Agent observation memory"}});
    await f.coordinator.resumeProject(f.state); await until(() => f.state.userIntervention?.status === "pending");
    expect(f.nativeOpens).toHaveLength(1); expect(f.resumed).toHaveBeenCalled(); expect(f.closed).toHaveBeenCalledOnce();
  });

  it("formal Stop closes the actual supplemental native while retaining the original business scene and budget", async () => {
    const f = await fixture("gate"); const before = (await f.database.projectState(PROJECT));
    await f.coordinator.resumeProject(f.state); await f.active;
    await f.coordinator.cancelProject(f.state,{actor:"user",reason:"user_cancelled"});
    expect(f.state.status).toBe(hasUserWorkflowPause(f.state) ? "paused" : "retrying"); expect(f.closed).toHaveBeenCalled();
    expect((await f.database.terminalPushObservationTurns(PROJECT))[0].status).toBe("stopped");
    expect((await f.database.projectState(PROJECT)).executions).toEqual(before.executions);
    expect(f.state.agentSessions!.worker).toEqual(f.session);
    expect((await f.database.terminalPushObservationRepairCount(PROJECT,"old-execution"))).toBe(1);
  });

  it("a failed physical close keeps the native reservation held until formal Stop obtains proof", async () => {
    const f = await fixture("close-error"); await f.coordinator.resumeProject(f.state);
    await until(() => ["paused", "retrying"].includes(f.state.status) && Boolean(f.state.lastError));
    expect((await f.database.terminalPushObservationTurns(PROJECT))[0].status).toBe("opened");
    expect((await f.database.projectState(PROJECT)).runtimeActivities.some(activity => activity.scopeKind === "terminal-push-observation")).toBe(true);
    (await f.allowClose()); await f.coordinator.cancelProject(f.state,{actor:"user",reason:"user_cancelled"});
    expect((await f.database.terminalPushObservationTurns(PROJECT))[0].status).toBe("stopped");
  });
});
