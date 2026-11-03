import { mainAgentOrchestrationDocument } from "../../src/core/agent-orchestration-reconfiguration.js";
import { restoreAgentConfiguration } from "../../src/core/scoped-agent-configuration.js";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { mkdtemp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ScopedProjectRuntime, type ScopedProjectRuntimeDependencies } from "../../src/core/scoped-project-runtime.js";
import { ScopedManagementDeferredError } from "../../src/core/scoped-workflow-runtime.js";
import { ScopedRuntimeGit } from "./helpers/scoped-runtime-git.js";
import { CollaborationStateDatabase } from "../../src/core/collaboration-state/store.js";
import { ProjectStorage } from "../../src/core/storage.js";
import { EventHub } from "../../src/core/event-hub.js";
import { cloneAgentOrchestrationTemplate } from "../../src/core/agent-orchestration.js";
import { mergeAgentConfigs, normalizeAgentOrchestrationTemplate } from "../../src/core/validation.js";
import { emptyProjectComputeUsage } from "../../src/core/inspire-compute-usage.js";
import { prepareInvocationInputs, validateStagedInvocationInputs } from "../../src/core/harness-runtime/invocation-inputs.js";
import { mergedPullSynchronizationOperationId } from "../../src/core/collaboration-git/operation.js";
import { prepareOperation, transitionOperation } from "../../src/core/collaboration-git/operation.js";
import { ControlActionService, publishAuthoritativeWorkflowFiles, readStagedControlActions } from "../../src/core/orchestration-control-bridge.js";
import { HarnessRuntimeFacade } from "../../src/core/harness-runtime/runtime.js";
import { openInvocationGatewayRoute } from "../../src/core/harness-runtime/gateway-route.js";
import type { HarnessDescriptor } from "../../src/core/harness-runtime/contracts.js";
import { prepareFilesystemAuthorityMcp } from "../../src/core/harness-runtime/filesystem-authority.js";
import type { AgentRunRequest, ProjectState, ControlActionEnvelope, ControlAction } from "../../src/core/types.js";
import type { CollaborationResidentOpenInput } from "../../src/core/collaboration-runtime.js";
import { ProtocolToolArgumentsError } from "../../src/core/harness-runtime/errors.js";
import { GitInputError } from "../../src/core/collaboration-git/errors.js";

const id = "prj_12345678901234567890123456789012";
const repository = { provider: "github" as const, providerId: 1, owner: "example", name: "openfars", private: true,
  defaultBranch: "main", htmlUrl: "https://github.com/example/openfars", cloneUrl: "https://github.com/example/openfars.git", observedAt: "2026-09-30T00:00:00Z" };
function contextSourceText(request: AgentRunRequest): string {
  const strings: string[] = [];
  const visit = (value: unknown): void => {
    if (typeof value === "string") strings.push(value);
    else if (Array.isArray(value)) value.forEach(visit);
    else if (value && typeof value === "object") Object.values(value).forEach(visit);
  };
  visit(request.contextSources);
  return [JSON.stringify(request.contextSources), ...strings].join("\n");
}

const roots: string[] = [];
const stores: CollaborationStateDatabase[] = [];
afterEach(async () => { vi.unstubAllEnvs(); stores.splice(0).forEach((store) => store.close()); await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))); });

async function fixture(mainRouting = false, scenario: { nested?: boolean; allowUserIntervention?: boolean; businessAgentCount?: number; failIdeaOnce?: boolean; recovery?: "retry" | "skip" | "user";
  failLeaderGroup?: string; failLeaderTimes?: number; failGlobalMainTimes?: number; failPlanGroup?: string; rootLeader?: string;
  transientLeaderFailures?: number;
  agentWeakRouting?: boolean; completionReadsPublishedFacts?: boolean; userWorkflowAdjustment?: boolean;
  directMainStateCoordination?: boolean; singleNecessaryArrival?: boolean;
  uncertainPushAfterMerge?: boolean;
  workflowAdjustment?: "apply" | "withdraw" | "changed-draft" | "validation-race" | "late-session" | "stale-version" | "missing-version" | "validation-cycle" } = {}) {
  const root = await mkdtemp(path.join(tmpdir(), "openfars-scoped-production-")); roots.push(root);
  const storage = new ProjectStorage(root, new EventHub()); await storage.initialize();
  let workflow = cloneAgentOrchestrationTemplate(); workflow.schemaVersion = 3;
  workflow.allowUserIntervention = scenario.allowUserIntervention !== false;
  workflow.collaborations = [{ id: "G", displayName: "G", memberAgentIds: [], renamePolicy: "editable" }];
  workflow.scopedWorkflow = { schemaVersion: 1, rootAgentIds: workflow.agents.map((agent) => agent.name), groups: [{ id: "G",
    leaderAgentId: "main", allowLeaderReconfiguration: false, workflow: {
      nodes: ["idea", "execution"].map((agentId) => ({ kind: "agent" as const, nodeId: `G_${agentId}`, agentId })),
      input: { source: "input", edges: ["idea", "execution"].map((name) => ({ kind: "parallel" as const, target: `G_${name}` })) },
      routes: { G_idea: mainRouting || scenario.agentWeakRouting ? [{ kind: "weak", target: "finish" }] : [{ kind: "strong", target: "finish" }],
        G_execution: [{ kind: "strong", target: "G_idea" }] }
    } }] };
  workflow.routes.G = [{ kind: "strong", target: "finish" }];
  if (scenario.nested) {
    workflow.collaborations = ["G", "H", "J"].map((id) => ({ id, displayName: id, memberAgentIds: [], renamePolicy: "editable" as const }));
    workflow.scopedWorkflow.groups = [
      { id: "G", leaderAgentId: "main", allowLeaderReconfiguration: false, workflow: {
        nodes: [{ kind: "agent", nodeId: "G_execution", agentId: "execution" }, { kind: "collaboration", nodeId: "G_H", groupId: "H" }],
        input: { source: "input", edges: ["G_execution", "G_H"].map((target) => ({ kind: "parallel", target })) },
        routes: { G_execution: [{ kind: "strong", target: "finish" }], G_H: [{ kind: "strong", target: "finish" }] } } },
      { id: "H", parentGroupId: "G", leaderAgentId: "main", allowLeaderReconfiguration: false, workflow: {
        nodes: [{ kind: "collaboration", nodeId: "H_J", groupId: "J" }], input: { source: "input", edges: [{ kind: "parallel", target: "H_J" }] }, routes: { H_J: [{ kind: "strong", target: "finish" }] } } },
      { id: "J", parentGroupId: "H", leaderAgentId: "main", allowLeaderReconfiguration: false, workflow: {
        nodes: [{ kind: "agent", nodeId: "J_idea", agentId: "idea" }], input: { source: "input", edges: [{ kind: "parallel", target: "J_idea" }] }, routes: { J_idea: [{ kind: "strong", target: "finish" }] } } }
    ];
  }
  if (scenario.businessAgentCount) {
    const group = workflow.scopedWorkflow.groups[0];
    for (let index = 2; index < scenario.businessAgentCount; index += 1) {
      const agentId = `worker_${index}`, nodeId = `G_${agentId}`;
      workflow.agents.push({ name: agentId, template: "general" });
      workflow.routes[agentId] = [{ target: "main", kind: "strong" }];
      workflow.routes.main.push({ target: agentId, kind: "weak" });
      workflow.decisionPlans[agentId] = "Return verified evidence to Main.";
      workflow.scopedWorkflow.rootAgentIds.push(agentId);
      group.workflow.nodes.push({ kind: "agent", nodeId, agentId });
      group.workflow.input.edges.push({ kind: "parallel", target: nodeId });
      group.workflow.routes[nodeId] = [{ kind: "strong", target: "finish" }];
    }
  }
  if (scenario.rootLeader) workflow.scopedWorkflow.groups[0].leaderAgentId = scenario.rootLeader;
  if (scenario.singleNecessaryArrival) {
    const direct = workflow.scopedWorkflow.groups[0].workflow;
    direct.nodes = direct.nodes.filter(node => node.nodeId === "G_idea");
    direct.input.edges = direct.input.edges.filter(edge => edge.target === "G_idea");
    delete direct.routes.G_execution;
  }
  if (scenario.workflowAdjustment || scenario.userWorkflowAdjustment) {
    if (scenario.workflowAdjustment) workflow.scopedWorkflow.groups[0].allowLeaderReconfiguration = true;
    workflow.termination.agent = "G";
    for (const [source, edges] of Object.entries(workflow.routes)) if (source !== "G") workflow.routes[source] = edges.filter(edge => edge.target !== "finish");
    workflow = normalizeAgentOrchestrationTemplate(workflow);
  }
  const agents = mergeAgentConfigs(undefined, workflow); agents.idea.decisionBy = mainRouting ? "main" : "agent";
  agents.execution.decisionBy = "agent";
  if (scenario.workflowAdjustment) {
    agents.main.gatewayId = "gwy_" + "a".repeat(32);
    agents.main.gatewaySnapshot = { id: agents.main.gatewayId, name: "Accepted scoped gateway", url: "https://controlled.invalid/v1",
      apiKey: "private-original-scoped-route", models: [agents.main.model], defaultModel: agents.main.model, protocol: "responses" };
  }
  const zero = { inputTokens: 0, cachedInputTokens: 0, outputTokens: 0, totalTokens: 0, invocations: 0 };
  const state: ProjectState = { id, title: "Scoped native composition", requirement: "Use the same Agent session and serialize repeated arrivals.",
    status: "queued", phase: "queued", createdAt: repository.observedAt, updatedAt: repository.observedAt,
    turn: 0, cycle: 1, eventSeq: 0, consecutiveFailures: 0, completionGeneration: 0,
    controlProtocol: "natural-language-tools-v1", runCounts: {}, mainInvocationSeq: 0, agents, orchestration: workflow,
    userInputs: [], tokenUsage: { ...zero, byAgent: {} }, computeUsage: emptyProjectComputeUsage(), workflowRevision: 1,
    git: { enabled: true, status: "ready", repository: { owner: repository.owner, name: repository.name, private: true,
      defaultBranch: "main", htmlUrl: repository.htmlUrl, localPath: path.join(storage.projectDir(id), "repository") } } };
  await storage.createProject(state);
  const options = { databasePath: path.join(root, "state.sqlite"), serviceId: "test", hostId: "test",
    topology: "single-host" as const, instanceId: "one", now: () => 1_000_000 };
  const database = CollaborationStateDatabase.open(options); stores.push(database);
  database.createProject({ projectId: id, workflowRevision: 1, workflowSnapshot: workflow, workerCapacity: 2, git: state.git });
  const git = new ScopedRuntimeGit(database, id);
  const begin = git.sessionBegin.getMockImplementation()!;
  git.sessionBegin.mockImplementation(async (...args) => { const fact = await begin(...args); await mkdir(fact.worktreePath, { recursive: true }); return fact; });
  const opened: CollaborationResidentOpenInput[] = [];
  const submitted: Array<{ agent: string; invocationId: string; prompt: string; inbox: string; canComplete: boolean }> = [];
  const active = new Set<string>();
  const closed: string[] = [];
  const handles = new Map();
  let ideaFailed = false; let leaderFailed = false; let leaderFailures = 0; let globalMainFailures = 0; let planFailed = false;
  let transientLeaderFailures = 0;
  let adjustmentProposed = false, validationRaceInjected = false;
  let uncertainPushId: string | undefined;
  const cycleConfiguration = () => {
    const original = database.workflowAdjustmentCurrent(id);
    const changed = structuredClone(original.snapshot.orchestration);
    changed.decisionPlans.main = "Intermediate accepted configuration";
    database.saveWorkflowRevision({ projectId: id, workflowRevision: original.version.revision + 1, snapshot: changed, affectedGroupIds: [] });
    database.saveWorkflowRevision({ projectId: id, workflowRevision: original.version.revision + 2, snapshot: original.snapshot.orchestration, affectedGroupIds: [] });
    expect(database.workflowAdjustmentCurrent(id).version).toEqual({ ...original.version, revision: original.version.revision + 2 });
  };
  const launcher = { stopScopedForRecovery: vi.fn(async (input) => ({ stopped: true, evidence: {
    protocol: "scoped-supervisor-stop-v1", projectId: id, agentId: input.agentId, scopeId: input.scopeId,
    role: input.role, ownershipEpoch: input.ownershipEpoch, runtimePath: input.executionRuntimePath, nativeProcessScanCleared: true
  } })), open: vi.fn(async (input: CollaborationResidentOpenInput) => {
    expect(active.has(input.request.agent)).toBe(false); active.add(input.request.agent); opened.push(input);
    if (input.sameEpochReopen) {
      expect(input.sameEpochReopen.previousRuntimePath).not.toBe(input.executionRuntimePath);
      await input.sameEpochReopen.revalidate();
      await input.sameEpochReopen.revalidate();
    }
    if (input.inputs) await validateStagedInvocationInputs({ projectId: id, invocationId: input.request.invocationId,
      ...input.inputs, fixedAgentId: input.request.agent });
    else await prepareInvocationInputs(input.request);
    await input.onOpened?.();
      const handle = { pause: vi.fn(), resume: vi.fn(), close: vi.fn(async () => { active.delete(input.request.agent); closed.push(input.request.invocationId); }),
      submit: vi.fn(async (turn) => {
        const operationSignal = input.signal ?? new AbortController().signal;
        const nativeId = `session-${input.request.agent}`;
        expect(input.request.resumeThreadId ?? nativeId).toBe(nativeId);
        await input.request.onDurableSessionStarted!({ schemaVersion: 1, harnessId: input.request.project.agents[input.request.agent].harness!,
          adapterVersion: "test", nativeId, generation: 1, durable: true, createdAt: repository.observedAt }, nativeId);
        const authority = await input.controlAuthorityFactory!({ request: input.request, turn });
        submitted.push({ agent: input.request.agent, invocationId: turn.invocationId, prompt: turn.prompt,
          inbox: await readFile(input.request.inboxPath, "utf8"), canComplete: authority.control.canComplete });
        const scope = input.controlScope!;
        if (scope.role === "scoped-agent" && scope.executionId.startsWith("group-final-")) {
          const final = database.scopedFinalIntegration(id, scope.groupRunId)!;
          const controlActions: ControlActionEnvelope[] = [];
          const call = async (action: ControlAction) => {
            const envelope: ControlActionEnvelope = { schemaVersion: 1, callId: `final-${input.request.invocationId}-${controlActions.length}`,
              projectId: id, agent: input.request.agent, invocationId: turn.invocationId, stateVersion: authority.control.stateVersion,
              receivedAt: new Date().toISOString(), capabilityHash: authority.control.capabilityHash!, action };
            await authority.revalidate(envelope, controlActions);
            if (action.tool !== "finish_task") await authority.execute!(envelope, operationSignal);
            controlActions.push(envelope);
          };
          if (git.pulls.get(final.id)?.status !== "merged") await call({ tool: "github_create_pr", base: final.integrationTarget,
            title: "Canonical final delivery", body: "Canonical final delivery" });
          await call({ tool: "github_merge_pr", providerNumber: git.pulls.get(final.id)!.providerNumber, reason: "Publish assigned group delivery" });
          await call({ tool: "finish_task" });
          return { handoff: "Canonical final delivery processed", controlActions };
        }
        if (scenario.uncertainPushAfterMerge && scope.role === "scoped-agent" && uncertainPushId &&
          turn.inputId.includes(":mechanism-repair:") && database.recordedGitOperation(id, uncertainPushId)?.ownerExecutionId === scope.executionId) {
          expect(turn.prompt).toContain(`git_reconcile_push for retained operationId=${uncertainPushId}`);
          const envelope: ControlActionEnvelope = { projectId: id, agent: input.request.agent, invocationId: turn.invocationId,
            callId: "observe-original-push", stateVersion: authority.control.stateVersion, capabilityHash: authority.control.capabilityHash,
            receivedAt: repository.observedAt, action: { tool: "git_reconcile_push", operationId: uncertainPushId, retry: false } };
          await authority.revalidate(envelope, []);
          expect(await authority.execute!(envelope, operationSignal)).toMatchObject({ status: "confirmed", gitDelivery: { ready: true } });
          return { handoff: "Original push reconciled without repeating research, PR creation or merge", controlActions: [envelope] };
        }
        if (scope.role === "scoped-leader" && !scope.failedArrivalRequestIds.length && !scope.sourceArrivalRequestId &&
          scenario.failPlanGroup && database.scopedGroupRun(id, scope.groupRunId)?.groupId === scenario.failPlanGroup && !planFailed) { planFailed = true; throw new Error("Stopped Leader could not produce a plan"); }
        if (scope.role === "scoped-agent" && scope.agentId === "idea" && scenario.failIdeaOnce && !ideaFailed) { ideaFailed = true; throw new Error("Controlled native failure before report"); }
        // A parent business turn must deliver independently of a nested
        // Leader's future plan. Waiting here would deadlock the correctly
        // symmetric management barrier before the planned failure can fire.
        if (scope.role === "scoped-leader" && transientLeaderFailures < (scenario.transientLeaderFailures ?? 0)) {
          transientLeaderFailures += 1;
          throw new ProtocolToolArgumentsError("codex");
        }
        let action: ControlAction | undefined;
        if ((scope.role === "scoped-leader" || scope.role === "scoped-main") && scope.failedArrivalRequestIds.length && input.request.workflowContext?.purpose !== "plan") {
          if (scope.role === "scoped-main" && scenario.failGlobalMainTimes && globalMainFailures < scenario.failGlobalMainTimes) {
            globalMainFailures += 1; throw new Error("Global Main technical channel failed");
          }
          if (scope.role === "scoped-leader" && scenario.failLeaderGroup && database.scopedGroupRun(id, scope.groupRunId)?.groupId === scenario.failLeaderGroup &&
            (scenario.failLeaderTimes ? leaderFailures < scenario.failLeaderTimes : !leaderFailed)) {
            leaderFailed = true; leaderFailures += 1; throw new Error("Leader cannot resolve this failure");
          }
          if (scope.role === "scoped-main" && scenario.recovery === "user") action = { tool: "request_user", message: "Please advise how to recover the retained failure", rationale: "All group levels exhausted" };
          else action = { tool: "coordinate_group_task", groupRunId: scope.groupRunId, coordinatorEpoch: scope.coordinatorEpoch,
            arrivalRequestId: scope.failedArrivalRequestIds[0], operation: scope.role === "scoped-main" ? scenario.recovery === "skip" ? "skip" : "retry"
              : scenario.recovery === "retry" ? "retry" : "escalate", rationale: "Scoped failure coordination" };
          const failure = database.scopedRecoveryCandidates(id, scope.groupRunId, scope.role === "scoped-main")[0];
          if (scenario.directMainStateCoordination && scope.role === "scoped-leader" && failure?.kind === "mechanism") {
            const object = { kind: "execution", id: failure.executionId! };
            const current = await input.request.onProjectStateRequest!({ operation: "get", object }) as { version: string };
            expect(await input.request.onProjectStateRequest!({ operation: "request_main", object, expectedVersion: current.version,
              sourceIssueId: failure.incidentId!, reason: "Main must judge this exact unconfirmed original PR request", callId: "direct-key-state" }))
              .toMatchObject({ status: "queued", targetAgentId: "main" });
            action = undefined;
          }
          if (failure?.kind === "final" && failure.originGroupRunId === scope.groupRunId && action.tool === "coordinate_group_task" && action.operation === "retry")
            action.repairNodeId = database.scopedGroupWorkflow(id, scope.groupRunId).nodes.find((entry) => entry.kind === "agent")!.nodeId;
        } else if (scope.role === "scoped-leader" && input.request.workflowContext?.purpose === "complete") {
          // The real Agent cannot peek into S. This scenario decides from
          // the actual published read-only input, even with stale memory.
          const published = scenario.completionReadsPublishedFacts
            ? JSON.parse(await readFile(path.join(storage.projectDir(id), "workflow", "current-state.json"), "utf8"))
            : undefined;
          const finalProof = scenario.completionReadsPublishedFacts
            ? published.scopedRuntime.groupFinalMerges?.find((proof) => proof.groupRunId === scope.groupRunId)
            : database.scopedGroupFinalMergeFact(id, scope.groupRunId);
          if (scenario.completionReadsPublishedFacts && finalProof) {
            const label = "Canonical final integration facts:\n";
            const facts = Object.fromEntries((input.request.contextSources ?? []).filter(source => source.key.startsWith("canonical-final."))
              .map(source => [source.key.slice("canonical-final.".length), source.records[0]]));
            Object.assign(facts, facts.metadata);
            expect(turn.prompt).not.toContain(JSON.stringify(finalProof));
            expect(facts).toMatchObject({ groupRunId: scope.groupRunId, finalMerge: finalProof });
            expect(facts.finalMerge.synchronization.mergeCommitSha).toBe(finalProof.pullRequest.mergeCommitSha);
          }
          if (finalProof) action = { tool: "complete_group", groupRunId: scope.groupRunId, coordinatorEpoch: scope.coordinatorEpoch,
            output: `Completed final integration for ${scope.groupRunId}` };
          else {
            const direct = database.scopedGroupWorkflow(id, scope.groupRunId).nodes.find((node) => node.kind === "agent" && node.agentId !== input.request.agent)?.agentId;
            const descendants = database.projectState(id).scopedGroupRuns?.filter((candidate) => candidate.parentGroupRunId === scope.groupRunId) ?? [];
            const member = direct ?? descendants.flatMap((candidate) => database.scopedGroupWorkflow(id, candidate.id).nodes)
              .find((node) => node.kind === "agent" && node.agentId !== input.request.agent)?.agentId;
            if (!member) throw new Error("Test group has no eligible integration Agent");
            action = { tool: "request_group_integration", groupRunId: scope.groupRunId,
              coordinatorEpoch: scope.coordinatorEpoch, integrationOwnerAgentId: member };
          }
        } else if (scope.role === "scoped-leader" && !scope.sourceArrivalRequestId) action = { tool: "assign_group_tasks", groupRunId: scope.groupRunId,
          coordinatorEpoch: scope.coordinatorEpoch, tasks: scope.memberNodeIds.map((taskId) => ({ taskId, assignment: `Complete ${taskId} in the existing workflow.` })), rationale: "Graph-scoped plan" };
        else if (scope.role === "scoped-leader") action = { tool: "route_to_agent", target: scope.routeCandidates.includes("finish") ? "finish" : scope.routeCandidates[0], rationale: "Local management-owned route" };
        else if (scope.role === "scoped-agent" && scope.candidates.length) action = { tool: "route_to_agent", target: scope.candidates[0], rationale: "Local Agent-owned route" };
        if (scenario.workflowAdjustment && !adjustmentProposed && scope.role === "scoped-leader" && input.request.workflowContext?.purpose === "plan") {
          adjustmentProposed = true;
          const file = authority.control.workflowAuthoringPath!;
          const document = JSON.parse(await readFile(file, "utf8")); document.agents.idea.instructions = "Exact live scoped proposal";
          if (scenario.workflowAdjustment === "late-session") document.agents.idea.harness = "claude-code";
          if (scenario.workflowAdjustment === "missing-version") delete document.baseVersion;
          if (scenario.workflowAdjustment === "stale-version") cycleConfiguration();
          await writeFile(file, JSON.stringify(document));
          action = { tool: "apply_workflow", path: "workflow.json", rationale: "Actual simulated manager proposal" };
        }
        const controlActions: ControlActionEnvelope[] = [];
        const finish: ControlActionEnvelope = { schemaVersion: 1, callId: `finish-${input.request.invocationId}`, projectId: id,
          agent: input.request.agent, invocationId: input.request.invocationId, stateVersion: authority.control.stateVersion,
          receivedAt: new Date().toISOString(), capabilityHash: authority.control.capabilityHash!,
          action: { tool: "finish_task", summary: `Finished ${input.request.invocationId}` } };
        const manager = scope.role === "scoped-leader" || scope.role === "scoped-main";
        // This simulated manager explicitly finishes its own round before
        // requesting integration/group completion. Worker completion follows
        // its actual Git tool results below.
        if (manager) { await authority.revalidate(finish, []); controlActions.push(finish); }
        if (action) {
          const envelope: ControlActionEnvelope = { schemaVersion: 1, callId: `action-${input.request.invocationId}`, projectId: id,
            agent: input.request.agent, invocationId: input.request.invocationId, stateVersion: authority.control.stateVersion,
            receivedAt: new Date().toISOString(), capabilityHash: authority.control.capabilityHash!, action };
          if (action.tool === "apply_workflow" && ["validation-race", "stale-version", "missing-version", "validation-cycle"].includes(scenario.workflowAdjustment!)) {
            const draft = await readFile(authority.control.workflowAuthoringPath!, "utf8");
            await expect(authority.revalidate(envelope, [])).rejects.toThrow(/base.*stale|original configuration version|original configuration version changed/);
            expect(await readFile(authority.control.workflowAuthoringPath!, "utf8")).toBe(draft);
            expect(database.workflowAdjustments(id)).toEqual([]);
            if (scenario.workflowAdjustment !== "validation-race") {
              const reference = JSON.parse(await readFile(path.join(input.inputs!.workspacePath, ".scienceevolve", "workflow-current.json"), "utf8"));
              expect(reference.baseVersion).toEqual(database.workflowAdjustmentCurrent(id).version);
              expect(reference.agents.idea.instructions).toBe(database.workflowAdjustmentCurrent(id).snapshot.agents.idea.instructions);
              expect(reference.lockedRuntime.main.gatewayName).toBe("Accepted scoped gateway");
              expect(JSON.stringify(reference)).not.toContain("private-original-scoped-route");
            }
            // Explicit choice by the simulated manager after receiving the
            // rejection; the production runtime never supplies this plan.
            const corrected = { ...envelope, callId: `${envelope.callId}-actual-plan`, action: { tool: "assign_group_tasks" as const,
              groupRunId: scope.groupRunId, coordinatorEpoch: scope.coordinatorEpoch,
              tasks: scope.memberNodeIds.map(taskId => ({ taskId, assignment: `Complete ${taskId}` })), rationale: "Manager's next formal decision" } };
            await authority.revalidate(corrected, []); controlActions.push(corrected);
          } else {
            await authority.revalidate(envelope, []); controlActions.push(envelope);
            if (action.tool === "apply_workflow") {
              const reference = JSON.parse(await readFile(path.join(input.inputs!.workspacePath, ".scienceevolve", "workflow-current.json"), "utf8"));
              expect(reference.lockedRuntime.main.gatewayName).toBe("Accepted scoped gateway");
              expect(JSON.stringify(reference)).not.toContain("private-original-scoped-route");
              const record = database.workflowAdjustments(id)[0]; expect(record.status).toBe("pending");
              expect(database.projectState(id).workflowRevision).toBe(1);
              if (scenario.workflowAdjustment === "withdraw") database.withdrawWorkflowAdjustment({ projectId: id, requestId: record.requestId,
                operationId: "withdraw-live-proposal", note: "Retain original Agent instructions" });
              if (scenario.workflowAdjustment === "changed-draft") {
                const document = JSON.parse(await readFile(authority.control.workflowAuthoringPath!, "utf8"));
                document.agents.idea.instructions = "Later unsubmitted draft must not apply";
                await writeFile(authority.control.workflowAuthoringPath!, JSON.stringify(document));
                await authority.revalidate(envelope, []);
              }
            }
          }
        }
        if (input.controlScope?.role === "scoped-agent") {
          const execution = database.scopedExecution(id, input.request.executionContext!.executionId!)!;
          const finalRepair = database.scopedFinalRepairForArrival(id, execution.arrivalRequestId);
          if (execution.ownershipEpoch > 1 || finalRepair) {
            // The simulated Agent, after opening its retained session, chooses
            // conflict preparation. Recovery itself may only preserve facts.
            expect(git.closePullRequest).not.toHaveBeenCalled();
            const prepare: ControlActionEnvelope = { schemaVersion: 1, callId: `prepare-${input.request.invocationId}`, projectId: id,
              agent: input.request.agent, invocationId: input.request.invocationId, stateVersion: authority.control.stateVersion,
              receivedAt: new Date().toISOString(), capabilityHash: authority.control.capabilityHash!, action: { tool: "git_prepare_conflict" } };
            await authority.revalidate(prepare, []);
            await authority.execute!(prepare, operationSignal);
            controlActions.push(prepare);
          }
          let push: ControlActionEnvelope = { schemaVersion: 1, callId: `push-${input.request.invocationId}`, projectId: id,
            agent: input.request.agent, invocationId: input.request.invocationId, stateVersion: authority.control.stateVersion,
            receivedAt: new Date().toISOString(), capabilityHash: authority.control.capabilityHash!, action: { tool: "git_push", reason: "Checkpoint scoped business work" } };
          await authority.revalidate(push, []);
          if (scenario.uncertainPushAfterMerge && scope.agentId === "idea" && !uncertainPushId) {
            git.failPushJournalOnceAgent = "idea";
            await expect(authority.execute!(push, operationSignal)).rejects.toThrow("Native stopped after push before its result");
            uncertainPushId = `agent-git-${execution.id}-epoch-${execution.ownershipEpoch}-${push.callId}-push`;
            const original = database.recordedGitOperation(id, uncertainPushId)!;
            git.checkpointHeads.set(execution.id, original.expectedHead!);
            push = { ...push, callId: push.callId + "-second" };
            await authority.revalidate(push, []);
          }
          await authority.execute!(push, operationSignal);
          controlActions.push(push);
          const group = database.scopedGroupRun(id, execution.groupRunId)!;
          const create: ControlActionEnvelope = { schemaVersion: 1, callId: `create-${input.request.invocationId}`, projectId: id,
            agent: input.request.agent, invocationId: input.request.invocationId, stateVersion: authority.control.stateVersion,
            receivedAt: new Date().toISOString(), capabilityHash: authority.control.capabilityHash!, action: {
              tool: "github_create_pr", base: group.groupBranch, title: `Delivery ${execution.agentId}`,
              body: `Scoped delivery ${execution.id}`
            } };
          await authority.revalidate(create, []);
          await authority.execute!(create, operationSignal);
          controlActions.push(create);
          const pull = git.pulls.get(execution.id)!;
          const merge: ControlActionEnvelope = { schemaVersion: 1, callId: `merge-${input.request.invocationId}`, projectId: id,
            agent: input.request.agent, invocationId: input.request.invocationId, stateVersion: authority.control.stateVersion,
            receivedAt: new Date().toISOString(), capabilityHash: authority.control.capabilityHash!, action: {
              tool: "github_merge_pr", providerNumber: pull.providerNumber, reason: "Integrate scoped delivery"
            } };
          await authority.revalidate(merge, []);
          const merged = await authority.execute!(merge, operationSignal) as { status?: string; mergeCommitSha?: string };
          controlActions.push(merge);
        }
        if (!manager) { await authority.revalidate(finish, []); controlActions.push(finish); }
        return { handoff: `Finished ${input.request.invocationId}`, controlActions };
      }) };
    return handle;
  }) };
  const dependencies: ScopedProjectRuntimeDependencies = { database, state, storage, git, repository, launcher, signal: new AbortController().signal,
    filesystem: async () => ({ serviceUserRoot: root, projectWorktreeRoot: path.join(storage.projectDir(id), "git-worktrees"), protectedRoots: [] }),
    decorate: (request) => { request.onProjectStateRequest = value => database.projectStateRequest({ kind: "agent", projectId: id,
      agentId: request.agent, invocationId: request.invocationId }, value);
      request.onDurableSessionStarted = async (_session, legacy) => {
      const current = state.agentSessionIds?.[request.agent]; if (current && current !== legacy) throw new Error("Session changed");
      state.agentSessionIds = { ...state.agentSessionIds, [request.agent]: legacy }; await storage.saveState(state);
    }; },
    trace: () => async () => undefined, publish: async () => {
      state.scopedExecutions = database.projectState(id).scopedExecutions;
      if (scenario.workflowAdjustment) {
        const projection = database.projectState(id);
        state.orchestration = projection.workflowSnapshot as ProjectState["orchestration"];
        state.workflowRevision = projection.workflowRevision;
        if (projection.scopedConfiguration) state.agents = restoreAgentConfiguration(projection.scopedConfiguration, state.agents);
      }
      if (scenario.completionReadsPublishedFacts)
        await publishAuthoritativeWorkflowFiles(storage.projectDir(id), database.authoritativeWorkflowFiles(id));
      await storage.saveState(state);
    },
    validateConfiguration: async () => {
      if (scenario.workflowAdjustment === "validation-cycle" && !validationRaceInjected) {
        validationRaceInjected = true;
        cycleConfiguration();
      }
      if (scenario.workflowAdjustment === "validation-race" && !validationRaceInjected) {
        validationRaceInjected = true;
        const configuration = structuredClone(database.scopedConfiguration(id)!);
        configuration.agents.idea.instructions = "Actual newer authoritative configuration";
        database.appendEvent({ projectId: id, type: "scoped.configuration.applied", payload: { configuration } });
      }
    },
    managementInputs: async (group, invocationId, authorityInbox, runtimePath) => {
      const workspacePath = path.join(storage.projectDir(id), "git-worktrees", "agents", group.leaderAgentId);
      const snapshot = path.join(workspacePath, ".scienceevolve", "management", invocationId); await mkdir(snapshot, { recursive: true });
      const inboxPath = path.join(snapshot, `${invocationId}-Inbox.md`); const memoryPath = path.join(snapshot, "Memory.md");
      const content = await readFile(authorityInbox); await writeFile(inboxPath, content); await writeFile(memoryPath, "Read-only management snapshot");
      const workflowAuthoringPath = path.join(snapshot, "proposal", "workflow.json");
      if (scenario.workflowAdjustment) {
        await mkdir(path.dirname(workflowAuthoringPath), { recursive: true });
        await writeFile(workflowAuthoringPath, JSON.stringify(mainAgentOrchestrationDocument(id, state.orchestration, state.agents, {}, {}, database.workflowAdjustmentCurrent(id).version)));
      }
      return { projectPath: storage.projectDir(id), workspacePath, inboxPath, memoryPath, runtimePath,
        ...(scenario.workflowAdjustment ? { workflowAuthoringPath } : {}), inboxSha256: createHash("sha256").update(content).digest("hex") };
    }, submit: async (handle, turn, retainNativeReturn) => {
      const result = await handle.submit(turn);
      await retainNativeReturn?.(result);
      return result;
    }, register: (key, handle) => handles.set(key, handle), unregister: (key) => handles.delete(key) };
  const runtime = new ScopedProjectRuntime(dependencies);
  return { database, runtime, state, opened, submitted, closed, handles, git, dependencies, options, storage, root, launcher, scenario };
}

describe("scoped project native production composition", () => {
  it("preserves scoped management repair allowances through transient Harness failures", async () => {
    const f = await fixture(false, { transientLeaderFailures: 2 });
    await f.runtime.activate({ projectId: id, groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G", workflowRevision: 1,
      outer: { nodeRunId: "node-G", inputSnapshotRef: "input", activatedByAgentId: "main" } });
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const result = await f.runtime.advance("run-G");
      expect(result.issues.some(issue => issue.transientFailure?.code === "PROTOCOL_TOOL_ARGUMENTS_INVALID")).toBe(true);
      expect(f.database.scopedManagementFailures(id, true)).toEqual([]);
      expect(f.state.status).not.toBe("paused");
      expect(f.state.userIntervention).toBeUndefined();
    }
    expect((await advanceUntilTerminal(f)).status).toBe("completed");
    expect(f.database.scopedManagementFailures(id, true)).toEqual([]);
  });
  it("recovers a stopped parallel Git owner before routing a skipped sibling, without holding the management queue", async () => {
    const f = await fixture(false, { uncertainPushAfterMerge: true, recovery: "skip" });
    const controller = new AbortController();
    f.dependencies.signal = controller.signal;
    let failedExecution = false;
    let allowSettlement = false;
    let recoveryAfterSkip = false;
    let routedAfterRecovery = false;
    let deferredContinuation: Promise<void> | undefined;
    let deferredWithoutFailure = false;
    const publish = f.dependencies.publish;
    f.dependencies.publish = async () => {
      await publish();
      const skipped = f.database.scopedArrivals("run-G").find(arrival => arrival.agentId === "execution" && arrival.status === "skipped");
      if (skipped) {
        allowSettlement = true;
        f.scenario.recovery = "retry";
        if (!deferredContinuation) {
          // Also cover a continuation already queued before recovery became
          // eligible. Reordering new submissions alone cannot release it.
          const management = f.runtime as unknown as { manage(group: NonNullable<ReturnType<typeof f.database.scopedGroupRun>>,
            purpose: "route", arrivalRequestId: string): Promise<void> };
          deferredContinuation = management.manage(f.database.scopedGroupRun(id, "run-G")!, "route", skipped.requestId)
            .then(() => { throw new Error("Blocked ordinary routing was incorrectly admitted"); }, error => {
              expect(error).toBeInstanceOf(ScopedManagementDeferredError);
              deferredWithoutFailure = true;
            });
        }
      }
    };
    const open = f.launcher.open.getMockImplementation()!;
    f.launcher.open.mockImplementation(async input => {
      const handle = await open(input);
      const scope = input.controlScope!;
      if (scope.role === "scoped-agent" && !scope.executionId.startsWith("group-final-")) {
        if (scope.agentId === "execution" && !failedExecution) {
          failedExecution = true;
          handle.submit.mockImplementation(async () => { throw new Error("Independent stopped Worker failure"); });
        }
        if (scope.agentId === "idea") {
          const submit = handle.submit.getMockImplementation()!;
          handle.submit.mockImplementation(async turn => {
            const retained = f.database.projectState(id).operations.find(operation => operation.kind === "git.push" &&
              operation.ownerExecutionId === scope.executionId && operation.status === "uncertain");
            if (!retained) return submit(turn);
            expect(f.database.projectSchedulingState(id)?.pendingGitOperations).toContainEqual(expect.objectContaining({
              id: retained.id, status: "uncertain", ownerExecutionId: scope.executionId
            }));
            if (!allowSettlement) return { handoff: "Original push is still unconfirmed; retain this task", controlActions: [] };
            const authority = await input.controlAuthorityFactory!({ request: input.request, turn });
            const envelope: ControlActionEnvelope = { projectId: id, agent: "idea", invocationId: turn.invocationId,
              callId: "settle-original-push", stateVersion: authority.control.stateVersion,
              capabilityHash: authority.control.capabilityHash, receivedAt: repository.observedAt,
              action: { tool: "git_reconcile_push", operationId: retained.id, retry: false } };
            await authority.revalidate(envelope, []);
            expect(await authority.execute!(envelope, controller.signal)).toMatchObject({ status: "confirmed" });
            return { handoff: "Original Agent reconciled its retained push", controlActions: [envelope] };
          });
        }
      } else if (scope.role === "scoped-leader" || scope.role === "scoped-main") {
        if (allowSettlement && scope.failedArrivalRequestIds.length) recoveryAfterSkip = true;
        if (scope.sourceArrivalRequestId && f.database.scopedArrivals("run-G")
          .some(arrival => arrival.requestId === scope.sourceArrivalRequestId && arrival.status === "skipped")) {
          expect(recoveryAfterSkip).toBe(true);
          expect(f.database.projectState(id).operations.some(operation => operation.status === "uncertain")).toBe(false);
          routedAfterRecovery = true;
        }
      }
      return handle;
    });
    const timeout = setTimeout(() => controller.abort(new Error("Recovery remained blocked behind a skipped continuation")), 10_000);
    try {
      await f.runtime.activate({ projectId: id, groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G", workflowRevision: 1,
        outer: { nodeRunId: "node-G", inputSnapshotRef: "project:requirement", activatedByAgentId: "main" } });
      expect((await advanceUntilTerminal(f)).status).toBe("completed");
    } finally { clearTimeout(timeout); controller.abort(); }
    expect(recoveryAfterSkip).toBe(true);
    await deferredContinuation;
    expect(deferredWithoutFailure).toBe(true);
    expect(routedAfterRecovery).toBe(true);
    const skipped = f.database.scopedArrivals("run-G").find(arrival => arrival.agentId === "execution")!;
    expect(skipped.status).toBe("skipped");
    expect(f.database.eventByRequestId(id, `scoped-skip-continuation:${skipped.requestId}`)).toBeDefined();
    expect(f.opened.filter(input => input.controlScope?.role === "scoped-agent" && input.request.agent === "execution")).toHaveLength(1);
    expect(f.database.projectState(id).scopedExecutions?.filter(execution => execution.agentId === "idea")
      .every(execution => execution.ownershipEpoch === 1)).toBe(true);
    expect(f.database.scopedManagementFailures(id)).toEqual([]);
    expect(f.database.projectSchedulingState(id)?.pendingGitOperations).toEqual([]);
    const unsettledChoice = f.opened.flatMap(input => input.controlScope?.role === "scoped-main" ? input.controlScope.recoveryOptions ?? [] : [])
      .find(option => option.blockedOperations.skip?.includes("unsettled Git operations"));
    expect(unsettledChoice).toMatchObject({ allowedOperations: ["retry"] });
  });

  it("wakes the same Agent to settle the first unknown push after a second push and PR merge succeeded", async () => {
    const f = await fixture(false, { uncertainPushAfterMerge: true });
    await f.runtime.activate({ projectId: id, groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G", workflowRevision: 1,
      outer: { nodeRunId: "node-G", inputSnapshotRef: "project:requirement", activatedByAgentId: "main" } });
    expect((await advanceUntilTerminal(f)).status).toBe("completed");
    const original = f.database.projectState(id).operations.find(operation => operation.kind === "git.push" &&
      operation.id.endsWith("-push") && !operation.id.endsWith("-second-push") &&
      f.database.projectState(id).scopedExecutions?.some(execution => execution.id === operation.ownerExecutionId && execution.agentId === "idea"));
    expect(original?.status).toBe("finalized");
    const repair = f.submitted.filter(turn => turn.prompt.includes("git_reconcile_push for retained operationId="));
    expect(repair).toHaveLength(1);
    expect(f.opened.filter(input => input.request.invocationId === repair[0].invocationId)).toHaveLength(1);
    expect(f.git.reconcilePushOperation).toHaveBeenCalledOnce();
    expect(f.git.closePullRequest).not.toHaveBeenCalled();
    expect(f.database.scopedGroupIssues(id)).toEqual([]);
  });
  const rootActivation = { projectId: id, groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G", workflowRevision: 1,
    outer: { nodeRunId: "node-G", inputSnapshotRef: "input", activatedByAgentId: "main" } };

  it.each(["user", "technical-failure"] as const)("finishes the existing bounded Leader failure escalation within one production advance (%s)", async outcome => {
    const f = await fixture(false, { failIdeaOnce: true, recovery: "user", rootLeader: "review", singleNecessaryArrival: true,
      ...(outcome === "technical-failure" ? { failGlobalMainTimes: 2 } : {}) });
    const open = f.launcher.open.getMockImplementation()!;
    let localRepairSubmissions = 0;
    f.launcher.open.mockImplementation(async input => {
      const handle = await open(input);
      if (input.controlScope?.role !== "scoped-leader" ||
        input.request.workflowContext?.purpose !== "recover") return handle;
      handle.submit.mockImplementation(async () => {
        localRepairSubmissions += 1;
        await input.request.onDurableSessionStarted!({ schemaVersion: 1, harnessId: "codex", adapterVersion: "test",
          nativeId: "session-review", generation: 1, durable: true, createdAt: repository.observedAt }, "session-review");
        return { handoff: "The original Leader still omitted its required management controls." };
      });
      return handle;
    });
    await f.runtime.activate(rootActivation);
    await f.runtime.advance("run-G");
    expect(f.database.scopedArrivals("run-G")).toHaveLength(1);
    if (outcome === "user") expect(f.state.userIntervention?.status).toBe("pending");
    else {
      expect(f.state.userIntervention).toBeUndefined();
      expect(f.state).toMatchObject({ status: "retrying", phase: "collaboration:technical-failure" });
    }
    expect(localRepairSubmissions).toBe(3);
    const history = f.database.scopedManagementFailures(id);
    expect(history.filter(failure => !failure.globalMain).map(failure => failure.attempt)).toEqual([1, 2]);
    const events = f.database.eventsAfter(id, 0, 10_000);
    expect(events.filter(event => event.type === "scoped.management.escalated")).toHaveLength(1);
    expect(events.filter(event => event.type === "scoped.management.mechanism_repair.requested")).toHaveLength(2);
    expect(events.filter(event => event.type === "scoped.management.recovery.resumed")).toHaveLength(0);
    expect(f.database.scopedAcceptedLeaderActions(id, "run-G").filter(entry => entry.globalMain &&
      entry.envelope.action.tool === "request_user")).toHaveLength(outcome === "user" ? 1 : 0);
    expect(f.database.projectState(id).scopedExecutions?.filter(execution => execution.agentId === "idea")
      .every(execution => execution.status === "failed")).toBe(true);
    expect(f.state.agentSessionIds?.review).toBe("session-review");
    if (outcome === "technical-failure") {
      expect(history.filter(failure => failure.globalMain).map(failure => failure.attempt)).toEqual([1, 2]);
      expect(f.opened.filter(input => input.controlScope?.role === "scoped-main")).toHaveLength(2);
      const opened = f.opened.length;
      await f.runtime.advance("run-G");
      expect(f.opened).toHaveLength(opened);
      expect(f.database.scopedManagementFailures(id)).toEqual(history);
      expect(localRepairSubmissions).toBe(3);
    }
  });

  it("defers a scoped management round while a durable Pause fence is active", async () => {
    const f = await fixture();
    let paused = true;
    f.dependencies.assertManagementActive = () => {
      if (paused) throw new ScopedManagementDeferredError();
    };
    const activated = await f.runtime.activate(rootActivation);
    let result = await f.runtime.advance(activated.groupRun.id);
    expect(result.status).toBe("waiting");
    expect(f.opened.filter(input => input.controlScope?.role === "scoped-leader")).toHaveLength(0);
    expect(f.database.scopedLeaderTurns(id)).toHaveLength(0);

    paused = false;
    for (let step = 0; result.status !== "completed" && step < 6; step++) {
      result = await f.runtime.advance(activated.groupRun.id);
    }
    expect(result.status).toBe("completed");
  });

  async function holdBirth(f: Awaited<ReturnType<typeof fixture>>, phase: "read" | "pushed") {
    let entered!: () => void, release!: () => void;
    const ready = new Promise<void>(resolve => { entered = resolve; }), gate = new Promise<void>(resolve => { release = resolve; });
    if (phase === "read") {
      const observe = f.git.observeRemoteRef.getMockImplementation()!;
      let held = false;
      f.git.observeRemoteRef.mockImplementation(async (...args) => {
        if (!held && args[1] === "groups/run-G") { held = true; entered(); await gate; }
        return observe(...args);
      });
    } else {
      const begin = f.git.beginGroup.getMockImplementation()!;
      f.git.beginGroup.mockImplementation(async request => { const result = await begin(request); entered(); await gate; return result; });
    }
    const activation = f.runtime.activate(rootActivation);
    await ready;
    return { activation, release };
  }

  it.each((["read", "pushed"] as const).flatMap(phase => (["input", "outer-route", "leader"] as const).map(edit => ({ phase, edit }))))(
    "retains original Git preparation and necessary delivery when a user changes $edit during $phase", async ({ phase, edit }) => {
    const f = await fixture(false, { userWorkflowAdjustment: true }), held = await holdBirth(f, phase);
    try {
      const projection = f.database.projectState(id), original = f.database.scopedGroupActivationPreparations(id)[0];
      expect(original).toMatchObject({ status: "preparing", workflowRevision: 1, input: rootActivation });
      expect(projection.activeNodeRunId).toBeUndefined(); expect(projection.scopedGroupRuns).toEqual([]);
      expect(projection.scopedArrivals).toEqual([]); expect(f.opened).toEqual([]);
      expect(() => f.database.activateNode({ projectId: id, nodeRunId: "competing-main", node: { kind: "agent", nodeId: "main", agentId: "main" },
        activationRequestId: "competing-main", inputSnapshotRef: "new-input", activatedByAgentId: "main", workflowRevision: 1 }))
        .toThrow(/original scoped Git preparation/i);
      const current = f.database.workflowAdjustmentCurrent(id), proposal = structuredClone(current.snapshot);
      if (edit === "input") proposal.orchestration.scopedWorkflow!.groups[0].workflow.input.edges.reverse();
      if (edit === "outer-route") proposal.orchestration.routes.G = [{ kind: "weak", target: "finish" }];
      if (edit === "leader") proposal.orchestration.scopedWorkflow!.groups[0].leaderAgentId = "writing";
      f.database.submitUserWorkflowAdjustment({ projectId: id, requestId: "edit-during-birth", base: current.version, proposal });
      expect(f.database.prepareUserWorkflowAdjustmentPublication(id, "edit-during-birth")).toMatchObject({ ready: false,
        publication: { status: "pending", reason: expect.stringContaining("原Git激活准备") } });
      expect(() => f.database.prepareScopedGroupActivation({ ...rootActivation, groupRunId: "another-run", activationRequestId: "another-root" }))
        .toThrow(/outer activation slot/);
      expect(() => f.database.prepareScopedGroupActivation({ ...rootActivation, outer: { ...rootActivation.outer, inputSnapshotRef: "replaced" } }))
        .toThrow(/identity changed/);
      expect(f.database.scopedGroupActivationPreparations(id)).toEqual([original]);
      expect(() => f.database.saveWorkflowRevision({ projectId: id, workflowRevision: 2, snapshot: proposal.orchestration, affectedGroupIds: ["G"] }))
        .toThrow(/Original scoped Git preparation binding cannot change/);
    } finally { held.release(); await held.activation; }
    const activated = await held.activation;
    expect(activated.arrivals.map(arrival => arrival.targetNodeId)).toEqual(["G_idea", "G_execution"]);
    expect(f.database.scopedGroupActivationPreparations(id)[0].status).toBe("activated");
    expect(f.database.prepareUserWorkflowAdjustmentPublication(id, "edit-during-birth").ready).toBe(false);
    expect((await advanceUntilTerminal(f)).status).toBe("completed");
    f.database.completeScopedRootRoute({ projectId: id, groupRunId: "run-G", nodeRunId: "node-G", routeEmissionId: "original-birth-finish",
      output: "Original verified delivery", route: { kind: "fixed", targetNodeId: "finish" } });
    const prepared = f.database.prepareUserWorkflowAdjustmentPublication(id, "edit-during-birth");
    expect(prepared.ready).toBe(true); if (!prepared.ready) throw new Error("Original Input and outer delivery must release the edit");
    expect(f.database.publishUserWorkflowAdjustment(id, "edit-during-birth", prepared.validationToken).status).toBe("applied");
    expect(f.git.log.filter(event => event.kind === "birth")).toHaveLength(1);
    expect(f.state.agentSessionIds?.idea).toBe("session-idea");
  });

  it.each(["read", "pushed"] as const)("accepts an unrelated configuration version during %s without replacing the birth or replay proof", async phase => {
    const f = await fixture(false, { userWorkflowAdjustment: true }), held = await holdBirth(f, phase);
    let original!: ReturnType<CollaborationStateDatabase["scopedGroupActivationPreparations"]>[number];
    try {
      original = f.database.scopedGroupActivationPreparations(id)[0];
      const current = f.database.workflowAdjustmentCurrent(id), proposal = structuredClone(current.snapshot);
      proposal.agents.idea.instructions = "New instructions before the first actual task";
      f.database.submitUserWorkflowAdjustment({ projectId: id, requestId: "configuration-during-birth", base: current.version, proposal });
      const prepared = f.database.prepareUserWorkflowAdjustmentPublication(id, "configuration-during-birth");
      expect(prepared.ready).toBe(true); if (!prepared.ready) throw new Error("Unclaimed Agent configuration is safe before Input");
      expect(f.database.publishUserWorkflowAdjustment(id, "configuration-during-birth", prepared.validationToken)).toMatchObject({ status: "applied", appliedVersion: { revision: 2 } });
      expect(f.database.projectState(id).scopedArrivals).toEqual([]); expect(f.opened).toEqual([]);
    } finally { held.release(); await held.activation; }
    const activated = await held.activation, projection = f.database.projectState(id);
    expect(activated.groupRun.workflowRevision).toBe(2); expect(activated.arrivals).toHaveLength(2);
    expect(f.database.scopedGroupActivationPreparations(id)[0]).toMatchObject({ ...original, status: "activated", workflowRevision: 2 });
    const accepted = f.database.eventsAfter(id, 0, 10_000).filter(event => event.type === "scoped.group.activation.version.accepted");
    expect(accepted).toHaveLength(1); expect(accepted[0].payload).toMatchObject({ previousWorkflowRevision: 1, workflowRevision: 2, bindingHash: original.bindingHash });
    expect(await f.runtime.activate(rootActivation)).toMatchObject({ replay: true, groupRun: { workflowRevision: 2 } });
    expect(f.database.projectState(id).stateRevision).toBe(projection.stateRevision);
    expect(f.database.projectState(id).scopedArrivals).toEqual(projection.scopedArrivals);
    expect(f.git.beginGroup).toHaveBeenCalledTimes(1); expect(f.git.log.filter(event => event.kind === "birth")).toHaveLength(1);
    f.state.orchestration = projection.workflowSnapshot as ProjectState["orchestration"];
    f.state.workflowRevision = projection.workflowRevision; f.state.agents = structuredClone(projection.scopedConfiguration!.agents);
    expect((await advanceUntilTerminal(f)).status).toBe("completed");
    const idea = f.opened.find(input => input.controlScope?.role === "scoped-agent" && input.request.agent === "idea")!;
    expect(idea.request.project.agents.idea.instructions).toBe("New instructions before the first actual task");
  });

  it("admits the accepted user version before a new activation owner and any Git read", async () => {
    const f = await fixture(false, { userWorkflowAdjustment: true }), current = f.database.workflowAdjustmentCurrent(id);
    const proposal = structuredClone(current.snapshot); proposal.orchestration.scopedWorkflow!.groups[0].workflow.input.edges.reverse();
    f.database.submitUserWorkflowAdjustment({ projectId: id, requestId: "prepared-before-birth", base: current.version, proposal });
    const publication = f.database.prepareUserWorkflowAdjustmentPublication(id, "prepared-before-birth");
    expect(publication.ready).toBe(true); if (!publication.ready) throw new Error("Initially no activation owns Input");
    await expect(f.runtime.activate(rootActivation)).rejects.toMatchObject({ code: "WORKFLOW_ADJUSTMENT_PENDING" });
    expect(f.database.scopedGroupActivationPreparations(id)).toEqual([]); expect(f.git.observeRemoteRef).not.toHaveBeenCalled();
    expect(f.database.publishUserWorkflowAdjustment(id, "prepared-before-birth", publication.validationToken).status).toBe("applied");
    const activated = await f.runtime.activate(rootActivation);
    expect(activated.groupRun.workflowRevision).toBe(2);
    expect(activated.arrivals.map(arrival => arrival.targetNodeId)).toEqual(["G_execution", "G_idea"]);
    expect(f.database.scopedGroupActivationPreparations(id)[0].input.workflowRevision).toBe(2);
  });

  it("restarts a crashed branch birth from its original preparation and operation while retaining an affected user request", async () => {
    const f = await fixture(false, { userWorkflowAdjustment: true }); f.git.crashBirthOnce = true;
    await expect(f.runtime.activate(rootActivation)).rejects.toThrow("crash after group branch push");
    const original = f.database.scopedGroupActivationPreparations(id)[0], before = f.database.projectState(id);
    const operation = before.operations.find(operation => operation.id === "scoped-group-begin-run-G")!;
    expect(before.scopedArrivals).toEqual([]); expect(before.scopedGroupRuns).toEqual([]); expect(f.opened).toEqual([]);
    const current = f.database.workflowAdjustmentCurrent(id), proposal = structuredClone(current.snapshot);
    proposal.orchestration.scopedWorkflow!.groups[0].workflow.input.edges.reverse();
    f.database.submitUserWorkflowAdjustment({ projectId: id, requestId: "edit-before-restart", base: current.version, proposal });
    f.database.close();
    const database = CollaborationStateDatabase.open({ ...f.options, instanceId: "two", now: () => 2_000_000 }); stores.push(database);
    const git = new ScopedRuntimeGit(database, id); git.restoreProviderState(f.git);
    const runtime = new ScopedProjectRuntime({ ...f.dependencies, database, git, publish: async () => undefined });
    expect(database.scopedGroupActivationPreparations(id)).toEqual([original]);
    expect(database.prepareUserWorkflowAdjustmentPublication(id, "edit-before-restart")).toMatchObject({ ready: false });
    const activated = await runtime.activate(database.scopedGroupActivationPreparations(id)[0].input);
    expect(activated.groupRun.baseCommit).toBe(operation.expectedHead); expect(activated.arrivals).toHaveLength(2);
    expect(database.projectState(id).operations.find(item => item.id === operation.id)).toEqual(operation);
    expect(database.scopedGroupActivationPreparations(id)[0]).toEqual({ ...original, status: "activated" });
    expect(database.workflowAdjustments(id)[0].status).toBe("pending"); expect(git.log.filter(event => event.kind === "birth")).toHaveLength(1);
    expect(await runtime.activate(rootActivation)).toMatchObject({ replay: true }); expect(f.opened).toEqual([]);
  });

  it.each([false, true])("adopts an unchanged legacy branch journal without replacing its original revision (configuration advanced: %s)", async advanced => {
    const f = await fixture(false, { userWorkflowAdjustment: true });
    await f.git.beginGroup({ repository, groupRunId: "run-G", baseCommit: "b".repeat(40), integrationTarget: "main", operationId: "scoped-group-begin-run-G" });
    const operation = f.database.projectState(id).operations.find(operation => operation.id === "scoped-group-begin-run-G")!;
    expect(f.database.scopedGroupActivationPreparations(id)).toEqual([]);
    if (advanced) {
      const current = f.database.workflowAdjustmentCurrent(id), proposal = structuredClone(current.snapshot);
      proposal.agents.idea.instructions = "Configuration accepted before legacy adoption";
      f.database.submitUserWorkflowAdjustment({ projectId: id, requestId: "legacy-configuration", base: current.version, proposal });
      const publication = f.database.prepareUserWorkflowAdjustmentPublication(id, "legacy-configuration");
      expect(publication.ready).toBe(true); if (!publication.ready) throw new Error("Legacy branch has not claimed an Agent task");
      expect(f.database.publishUserWorkflowAdjustment(id, "legacy-configuration", publication.validationToken).status).toBe("applied");
      await expect(f.runtime.activate({ ...rootActivation, workflowRevision: 2 })).rejects.toThrow(/original workflow revision and unchanged activation binding/);
    }
    const current = f.database.workflowAdjustmentCurrent(id), proposal = structuredClone(current.snapshot);
    proposal.orchestration.scopedWorkflow!.groups[0].workflow.input.edges.reverse();
    f.database.submitUserWorkflowAdjustment({ projectId: id, requestId: "legacy-input-edit", base: current.version, proposal });
    expect(f.database.prepareUserWorkflowAdjustmentPublication(id, "legacy-input-edit")).toMatchObject({ ready: false,
      publication: { reason: expect.stringContaining("旧版原Git分支准备") } });
    expect(() => f.database.activateNode({ projectId: id, nodeRunId: "competing-main", node: { kind: "agent", nodeId: "main", agentId: "main" },
      activationRequestId: "competing-main", inputSnapshotRef: "new-input", activatedByAgentId: "main", workflowRevision: current.version.revision }))
      .toThrow(/original legacy branch preparation/);
    const activated = await f.runtime.activate(rootActivation);
    expect(activated.arrivals.map(arrival => arrival.targetNodeId)).toEqual(["G_idea", "G_execution"]);
    expect(activated.groupRun.workflowRevision).toBe(advanced ? 2 : 1);
    expect(f.database.scopedGroupActivationPreparations(id)[0]).toMatchObject({ status: "activated", input: { workflowRevision: 1 },
      legacyBirth: { operationId: operation.id, workflowRevision: 1 } });
    expect(f.database.projectState(id).operations.find(item => item.id === operation.id)).toEqual(operation);
    expect(f.git.log.filter(event => event.kind === "birth")).toHaveLength(1);
    expect(f.database.workflowAdjustments(id).find(record => record.requestId === "legacy-input-edit")!.status).toBe("pending");
  });

  it("refuses a different legacy birth revision and protects its binding through direct graph storage", async () => {
    const f = await fixture(false, { userWorkflowAdjustment: true });
    await f.git.beginGroup({ repository, groupRunId: "run-G", baseCommit: "b".repeat(40), integrationTarget: "main", operationId: "scoped-group-begin-run-G" });
    const snapshot = structuredClone(f.state.orchestration); snapshot.scopedWorkflow!.groups[0].workflow.input.edges.reverse();
    expect(() => f.database.saveWorkflowRevision({ projectId: id, workflowRevision: 2, snapshot, affectedGroupIds: ["G"] }))
      .toThrow(/Original scoped Git preparation binding cannot change/);
    await expect(f.runtime.activate({ ...rootActivation, workflowRevision: 2 })).rejects.toThrow(/ahead of authority/);
    expect(f.database.scopedGroupActivationPreparations(id)).toEqual([]); expect(f.database.projectState(id).scopedArrivals).toEqual([]);
    expect(f.git.log.filter(event => event.kind === "birth")).toHaveLength(1); expect(f.opened).toEqual([]);
  });

  it("rejects an invalid outer Input identity before reserving or reading Git", async () => {
    const f = await fixture(false, { userWorkflowAdjustment: true });
    await expect(f.runtime.activate({ ...rootActivation, outer: { ...rootActivation.outer, inputSnapshotRef: "" } })).rejects.toThrow(/inputSnapshotRef/);
    await expect(f.runtime.activate({ ...rootActivation, workflowRevision: 2 })).rejects.toThrow(/ahead of authority/);
    expect(f.database.scopedGroupActivationPreparations(id)).toEqual([]); expect(f.git.observeRemoteRef).not.toHaveBeenCalled();
    expect(f.git.beginGroup).not.toHaveBeenCalled(); expect(f.database.projectState(id).scopedArrivals).toEqual([]);
  });

  it.each(["read", "pushed"] as const)("retains cancelled preparation evidence and never invents Input after cancellation during %s", async phase => {
    const f = await fixture(false, { userWorkflowAdjustment: true }), held = await holdBirth(f, phase);
    const outcome = held.activation.catch(error => error);
    f.database.appendEvent({ projectId: id, requestId: "cancel-preparation", type: "project.cancellation.requested", payload: { actor: "user" } });
    held.release(); expect(await outcome).toMatchObject({ code: "INVALID_STATE_TRANSITION" });
    const before = f.database.scopedGroupActivationPreparations(id)[0];
    f.database.settleScopedProjectCancellation(id);
    expect(f.database.scopedGroupActivationPreparations(id)[0]).toEqual({ ...before, status: "cancelled" });
    expect(f.database.projectState(id).scopedArrivals).toEqual([]); expect(f.database.projectState(id).scopedGroupRuns).toEqual([]);
    expect(() => f.database.prepareScopedGroupActivation(rootActivation)).toThrow(/cannot be revived/);
    expect(f.opened).toEqual([]); expect(f.git.log.filter(event => event.kind === "birth")).toHaveLength(phase === "pushed" ? 1 : 0);
  });

  it("retains a completed group's necessary outer route before a user removes that group", async () => {
    const f = await fixture(false, { userWorkflowAdjustment: true });
    const activated = await f.runtime.activate({ projectId: id, groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G",
      workflowRevision: 1, outer: { nodeRunId: "node-G", inputSnapshotRef: "input", activatedByAgentId: "main" } });
    expect((await f.runtime.advance(activated.groupRun.id)).status).toBe("completed");
    const current = f.database.workflowAdjustmentCurrent(id), proposal = structuredClone(current.snapshot);
    proposal.orchestration.collaborations = []; proposal.orchestration.scopedWorkflow!.groups = [];
    delete proposal.orchestration.routes.G; proposal.orchestration.termination.agent = "main";
    f.database.submitUserWorkflowAdjustment({ projectId: id, requestId: "remove-after-original-outer-route", base: current.version, proposal });
    expect(f.database.prepareUserWorkflowAdjustmentPublication(id, "remove-after-original-outer-route")).toMatchObject({ ready: false,
      publication: { status: "pending", reason: expect.stringContaining("外层路由") } });
    expect(f.database.rootMainWorkflowAdjustmentAdmission(id, "node-G")).toBeUndefined();
    f.database.completeScopedRootRoute({ projectId: id, groupRunId: "run-G", nodeRunId: "node-G", routeEmissionId: "original-root-finish",
      output: "Original verified group delivery", route: { kind: "fixed", targetNodeId: "finish" } });
    const prepared = f.database.prepareUserWorkflowAdjustmentPublication(id, "remove-after-original-outer-route");
    expect(prepared.ready).toBe(true); if (!prepared.ready) throw new Error("Original outer route must release its necessary group");
    expect(f.database.publishUserWorkflowAdjustment(id, "remove-after-original-outer-route", prepared.validationToken).status).toBe("applied");
    expect(f.database.projectState(id).routeOutbox).toMatchObject([{ routeEmissionId: "original-root-finish", targetNodeId: "finish", status: "pending" }]);
    expect(f.database.scopedGroupRun(id, "run-G")!.status).toBe("completed");
  });

  it.each(["apply", "withdraw", "original-input"] as const)("reevaluates the user queue before the next shared Agent FIFO task (%s)", async outcome => {
    const f = await fixture(false, { userWorkflowAdjustment: true }), initial = f.state.agents.idea.instructions;
    let submitted = false, originalExecutionId = "", published = false, readyCount = 0;
    const openedInstructions: string[] = [];
    const publish = f.dependencies.publish;
    f.dependencies.publish = async () => {
      const projection = f.database.projectState(id);
      f.state.orchestration = projection.workflowSnapshot as ProjectState["orchestration"];
      f.state.workflowRevision = projection.workflowRevision;
      f.state.agents = structuredClone(projection.scopedConfiguration!.agents);
      await publish();
    };
    f.dependencies.applyWaitingWorkflowAdjustments = async () => {
      const record = f.database.workflowAdjustments(id).find(record => record.source.kind === "user");
      if (!record || record.status !== "pending") return;
      const prepared = f.database.prepareUserWorkflowAdjustmentPublication(id, record.requestId);
      if (!prepared.ready) return;
      readyCount += 1;
      const before = f.database.projectState(id), original = before.scopedExecutions!.find(execution => execution.id === originalExecutionId)!;
      expect(original.status).toBe("completed");
      expect(before.scopedAgentMerges!.some(merge => merge.executionId === originalExecutionId)).toBe(true);
      expect(f.closed).toContain(f.database.scopedAgentReport(id, original.id, original.ownershipEpoch)!.invocationId);
      if (outcome === "withdraw") {
        f.database.recordWorkflowAdjustmentWaiting({ projectId: id, requestId: record.requestId, reason: "Controlled resource evidence remains unavailable" });
        return;
      }
      const arrivals = structuredClone(before.scopedArrivals), reports = structuredClone(before.scopedAgentReports);
      const publication = f.database.publishUserWorkflowAdjustment(id, record.requestId, prepared.validationToken);
      expect(publication.status).toBe("applied"); published = true;
      expect(f.database.projectState(id).scopedArrivals).toEqual(arrivals);
      expect(f.database.projectState(id).scopedAgentReports).toEqual(reports);
      await f.dependencies.publish();
    };
    const open = f.launcher.open.getMockImplementation()!;
    f.launcher.open.mockImplementation(async input => {
      const handle = await open(input);
      if (input.controlScope?.role === "scoped-agent" && input.request.agent === "idea" &&
        !input.controlScope.executionId.startsWith("group-final-")) {
        openedInstructions.push(input.request.project.agents.idea.instructions);
        if (!submitted) {
          submitted = true; originalExecutionId = input.controlScope.executionId;
          const current = f.database.workflowAdjustmentCurrent(id), proposal = structuredClone(current.snapshot);
          proposal.agents.idea.instructions = "User instructions for the next original FIFO task";
          if (outcome === "original-input") proposal.orchestration.scopedWorkflow!.groups[0].workflow.input.edges =
            proposal.orchestration.scopedWorkflow!.groups[0].workflow.input.edges.slice(1);
          f.database.submitUserWorkflowAdjustment({ projectId: id, requestId: "user-while-original-running", base: current.version, proposal });
          expect(f.database.prepareUserWorkflowAdjustmentPublication(id, "user-while-original-running")).toMatchObject({ ready: false });
        }
      }
      return handle;
    });
    const activated = await f.runtime.activate({ projectId: id, groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G",
      workflowRevision: 1, outer: { nodeRunId: "node-G", inputSnapshotRef: "input", activatedByAgentId: "main" } });
    let result = await f.runtime.advance(activated.groupRun.id);
    expect(result.issues.filter(issue => issue.severity === "failure"), JSON.stringify(result.issues)).toEqual([]);
    if (outcome === "withdraw") {
      expect(result.status).toBe("waiting"); expect(result.issues.some(issue => issue.kind === "waiting_for_workflow_adjustment"), JSON.stringify(result.issues)).toBe(true);
      expect(result.issues.some(issue => issue.severity === "failure")).toBe(false);
      expect(openedInstructions).toEqual([initial]); expect(published).toBe(false);
      f.database.withdrawWorkflowAdjustment({ projectId: id, requestId: "user-while-original-running", operationId: "explicit-withdraw-held-dispatch" });
      result = await f.runtime.advance(activated.groupRun.id);
    }
    for (let step = 0; result.status !== "completed" && step < 4; step++) result = await f.runtime.advance(activated.groupRun.id);
    expect(result.status, JSON.stringify({ issues: result.issues, records: f.database.workflowAdjustments(id).map(record => ({ status: record.status, reason: record.waitingReason })) })).toBe("completed"); expect(readyCount).toBeGreaterThan(0);
    expect(openedInstructions).toEqual([initial, outcome === "apply" ? "User instructions for the next original FIFO task" : initial]);
    expect(f.state.agentSessionIds?.idea).toBe("session-idea");
    expect(f.database.workflowAdjustments(id)[0].status).toBe(outcome === "withdraw" ? "withdrawn" : "applied");
    if (outcome === "original-input") expect(f.database.workflowAdjustmentCurrent(id).snapshot.orchestration.scopedWorkflow!.groups[0].workflow.input.edges).toHaveLength(1);
  });

  it.each(["structured", "legacy"] as const)("checks a late retained %s Session in the real scoped stopped-publication path", async kind => {
    const f = await fixture(false, { workflowAdjustment: "late-session" }), before = f.database.workflowAdjustmentCurrent(id);
    const original = { schemaVersion: 1 as const, harnessId: "codex", adapterVersion: "test", nativeId: "session-idea", generation: 1, durable: true, createdAt: repository.observedAt };
    let bound = false;
    f.dependencies.discoverWorktreeClosings = async () => {
      const record = f.database.workflowAdjustments(id).find(record => record.source.kind !== "user");
      if (!bound && record?.source.kind !== "user" && record && f.closed.includes(record.source.invocationId)) {
        bound = true;
        if (kind === "structured") f.state.agentSessions = { ...f.state.agentSessions, idea: original };
        else f.state.agentSessionIds = { ...f.state.agentSessionIds, idea: original.nativeId };
      }
    };
    const activated = await f.runtime.activate({ projectId: id, groupRunId: "run-G", groupId: "G", activationRequestId: "late-session", workflowRevision: 1,
      outer: { nodeRunId: "outer-late-session", inputSnapshotRef: "original-input", activatedByAgentId: "main" } });
    await f.runtime.advance(activated.groupRun.id);
    const record = f.database.workflowAdjustments(id)[0]; expect(bound).toBe(true);
    expect(record).toMatchObject({ status: "pending", waitingReason: expect.stringContaining("Harness"), proposal: { agents: { idea: { harness: "claude-code" } } } });
    expect(f.database.workflowAdjustmentCurrent(id)).toEqual(before); expect(f.state.pauseRequest).toBeUndefined();
    expect(kind === "structured" ? f.state.agentSessions?.idea : f.state.agentSessionIds?.idea).toEqual(kind === "structured" ? original : original.nativeId);
    f.database.withdrawWorkflowAdjustment({ projectId: id, requestId: record.requestId, operationId: "withdraw-late-session", note: "Retain the original Harness" });
    let result = await f.runtime.advance(activated.groupRun.id);
    for (let step = 0; result.status !== "completed" && step < 4; step++) result = await f.runtime.advance(activated.groupRun.id);
    expect(result.status).toBe("completed"); expect(f.state.workflowRevision).toBe(1);
    expect(f.state.agentSessionIds?.idea).toBe(original.nativeId);
    expect(f.database.workflowAdjustment(id, record.requestId)!.status).toBe("withdrawn");
  });

  it.each(["apply", "withdraw", "changed-draft", "validation-race", "stale-version", "missing-version", "validation-cycle"] as const)(
    "uses the durable live tool snapshot and truthful scoped application outcome (%s)", async workflowAdjustment => {
      const f = await fixture(false, { workflowAdjustment });
      const before = f.database.scopedConfiguration(f.state.id)!.agents.idea.instructions;
      let discoveredBeforePublication = 0;
      f.dependencies.discoverWorktreeClosings = async () => {
        const original = f.database.workflowAdjustments(f.state.id).find(record => record.source.kind !== "user");
        if (original && original.status !== "applied" && original.source.kind !== "user" && f.closed.includes(original.source.invocationId)) {
          expect(f.database.workflowAdjustmentCurrent(f.state.id).snapshot.agents.idea.instructions).toBe(before);
          discoveredBeforePublication += 1;
        }
      };
      const activated = await f.runtime.activate({ projectId: f.state.id, groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G",
        workflowRevision: 1, outer: { nodeRunId: "node-G", inputSnapshotRef: "input", activatedByAgentId: "main" } });
      let result = await f.runtime.advance(activated.groupRun.id);
      for (let step = 0; result.status !== "completed" && step < 4; step++) result = await f.runtime.advance(activated.groupRun.id);
      expect(result.status).toBe("completed");
      const records = f.database.workflowAdjustments(f.state.id), events = f.database.eventsAfter(f.state.id, 0, 10_000);
      if (["validation-race", "stale-version", "missing-version", "validation-cycle"].includes(workflowAdjustment)) {
        expect(records).toEqual([]);
        expect(discoveredBeforePublication).toBe(0);
        expect(f.state.agents.idea.instructions).toBe(workflowAdjustment === "validation-race" ? "Actual newer authoritative configuration" : before);
        if (workflowAdjustment === "stale-version" || workflowAdjustment === "validation-cycle")
          expect(f.database.workflowAdjustmentCurrent(id).version.revision).toBe(3);
      } else {
        expect(discoveredBeforePublication).toBeGreaterThan(0);
        expect(records, JSON.stringify(events.filter(event => event.type === "scoped.management.failure").map(event => event.payload.reason))).toHaveLength(1);
        expect(records[0]).toMatchObject({ status: workflowAdjustment === "withdraw" ? "withdrawn" : "applied",
          proposal: { agents: { idea: { instructions: "Exact live scoped proposal" } } } });
        expect(f.state.agents.idea.instructions).toBe(workflowAdjustment === "withdraw" ? before : "Exact live scoped proposal");
        expect(events.find(event => event.type === "scoped.management.round.completed" && Array.isArray(event.payload.workflowAdjustments))?.payload.workflowAdjustments)
          .toEqual([expect.objectContaining({ status: workflowAdjustment === "withdraw" ? "withdrawn" : "applied" })]);
        expect(events.filter(event => event.type === "scoped.workflow.proposal.staged")).toHaveLength(1);
      }
      expect(f.state.workflowRevision).toBe(workflowAdjustment === "stale-version" || workflowAdjustment === "validation-cycle" ? 3
        : workflowAdjustment === "apply" || workflowAdjustment === "changed-draft" ? 2 : 1);
      expect(f.state.agentSessionIds?.main).toBe("session-main");
      expect(f.database.projectState(f.state.id).scopedExecutions!.filter(execution => execution.agentId === "idea")).toHaveLength(2);
    }
  );

  it("awaits closing discovery before publishing retained workflow changes and entering business admission", async () => {
    const f = await fixture(), calls: string[] = [];
    f.dependencies.discoverWorktreeClosings = vi.fn(async () => { calls.push("discovered"); });
    vi.spyOn(f.runtime as any, "reconcileResidents").mockImplementation(async () => { calls.push("reconciled"); });
    vi.spyOn(f.runtime as any, "publishRetainedWorkflowAdjustments").mockImplementation(async () => {
      expect(calls).toEqual(["reconciled", "discovered"]); calls.push("published");
    });
    vi.spyOn((f.runtime as any).runtime, "advance").mockImplementation(async () => {
      expect(calls).toEqual(["reconciled", "discovered", "published"]); return { status: "awaiting-management" };
    });
    await f.runtime.advance("run-G"); expect(f.dependencies.discoverWorktreeClosings).toHaveBeenCalledTimes(1);
  });


  it("serializes closing discovery at concurrent publication boundaries before accepting recovery actions", async () => {
    const f = await fixture(), order: string[] = []; let active = 0, maximum = 0;
    f.dependencies.discoverWorktreeClosings = vi.fn(async () => {
      active++; maximum = Math.max(maximum, active); order.push("discovery-start");
      await new Promise(resolve => setTimeout(resolve, 15)); order.push("discovery-end"); active--;
    });
    vi.spyOn(f.runtime as any, "applyAcceptedRecoveries").mockImplementation(async () => { order.push("accepted-recovery"); });
    await Promise.all([(f.runtime as any).runtime.onProgress(id), (f.runtime as any).runtime.onProgress(id)]);
    expect(maximum).toBe(1); expect(f.dependencies.discoverWorktreeClosings).toHaveBeenCalledTimes(2);
    expect(order.indexOf("accepted-recovery")).toBeGreaterThan(order.indexOf("discovery-end"));
  });

  it.each([{ globalMain: false, identified: true, returned: undefined }, { globalMain: true, identified: true, returned: undefined },
    { globalMain: false, identified: false, returned: undefined }, { globalMain: true, identified: false, returned: undefined },
    { globalMain: false, identified: true, returned: "trusted" }, { globalMain: false, identified: true, returned: "read-failed" },
    { globalMain: false, identified: true, returned: "grant-failed" }])("carries original-owner closing through the actual manager control scope ($globalMain, identified=$identified, returned=$returned)", async ({ globalMain, identified, returned }) => {
    const f = await fixture(), A = "b".repeat(40), now = new Date(1_000_000).toISOString();
    const activated = f.database.activateScopedGroup({ projectId: id, groupRunId: "run-G", groupId: "G", activationRequestId: "activate",
      workflowRevision: 1, baseCommit: A, outer: { nodeRunId: "node-G", inputSnapshotRef: "requirement", activatedByAgentId: "main" } });
    const arrival = activated.arrivals.find(item => item.agentId === "idea")!;
    const execution = f.database.claimScopedAgentArrival({ projectId: id, arrivalRequestId: arrival.requestId, agentId: "idea", executionId: "original-idea",
      worktreePath: path.join(f.storage.projectDir(id), "git-worktrees", "agents", "idea") })!.execution;
    const identity = { projectId: id, executionId: execution.id, ownershipEpoch: 1, invocationId: "inv_original_idea" };
    const runtimePath = path.join(f.storage.projectDir(id), "runtime", identity.invocationId);
    f.database.beginScopedAgentTurn({ ...identity, runtimePath, baseCommit: A }); f.database.markScopedAgentTurnOpened({ ...identity, nativeProcessOpened: true });
    const session = { schemaVersion: 1 as const, harnessId: "pi" as const, adapterVersion: "fixture", generation: 0, durable: true, nativeId: "original-idea-session", createdAt: now };
    f.database.recordAgentNativeSessionBinding({ projectId: id, agentId: "idea", invocationId: identity.invocationId, runtimePath, worktreePath: execution.worktreePath,
      session, executionContext: { role: "delivery", nodeRunId: "node-G", groupRunId: "run-G", executionId: execution.id, ownershipEpoch: 1, executionWorktree: execution.worktreePath } });
    f.database.recordScopedAgentTaskCompletion({ ...identity, agentId: "idea", callId: "original-finish", requestedAt: now, memory: "Original immutable Memory" });
    f.database.recordScopedAgentReport({ ...identity, output: "Original report A", reportHeadSha: A, residentTurnCompleted: true, residentStopConfirmed: true });
    f.database.failScopedAgentArrival({ ...identity, arrivalRequestId: arrival.requestId, reason: "Necessary original Memory remains after A", residentStopConfirmed: true });
    const files = ["agent-memory/idea/Memory.md"];
    if (identified) f.database.recordScopedWorktreeClosingIssue({ projectId: id, agentId: "idea", executionId: execution.id, ownershipEpoch: 1,
      observation: { projectId: id, executionId: execution.id, ownershipEpoch: 1, branch: execution.executionBranch, worktreePath: execution.worktreePath,
        head: A, retained: true, observedAt: now, reportHeadSha: A, pendingPaths: files, committedPaths: [], authorizedPaths: files, kind: "bound-report-memory", deliveryRequired: false },
      originalStop: { invocationId: identity.invocationId, runtimePath, residentStopConfirmed: true, evidence: { nativeProcessScanCleared: true } } });
    else f.database.recordScopedWorktreeClosingDiscoveryFailure({ projectId: id, executionId: execution.id, agentId: "idea", ownershipEpoch: 1,
      executionBranch: execution.executionBranch, worktreePath: execution.worktreePath, reportHeadSha: A, originalSession: session,
      originalStop: { invocationId: identity.invocationId, runtimePath, residentStopConfirmed: true, evidence: { nativeProcessScanCleared: true } },
      reason: "Original file scope is uncertain", errorCode: "GIT_PATH_VIOLATION", errorClass: "GitPathViolationError", trustedReadFailed: true });
    if (returned) {
      const claim = f.database.claimScopedLeaderTurn({ projectId: id, groupRunId: "run-G", agentId: "main", invocationId: "inv_first_grant",
        runtimePath: path.join(f.storage.projectDir(id), "runtime/inv_first_grant"), allowStoppedRepairFaults: true })!;
      const manager = { projectId: id, groupRunId: "run-G", agentId: "main", invocationId: "inv_first_grant", coordinatorEpoch: claim.coordinatorEpoch };
      f.database.markScopedLeaderOpened(manager);
      const envelope = (action: ControlAction, callId: string): ControlActionEnvelope => ({ projectId: id, agent: "main", invocationId: manager.invocationId,
        callId, stateVersion: manager.coordinatorEpoch, capabilityHash: "c".repeat(64), receivedAt: now, action });
      f.database.recordScopedLeaderTaskCompletion({ ...manager, envelope: envelope({ tool: "finish_task", summary: "My first explicit closing grant" }, "finish") });
      f.database.acceptScopedLeaderAction({ ...manager, residentStopConfirmed: true, envelope: envelope({ tool: "coordinate_group_task", groupRunId: "run-G",
        coordinatorEpoch: manager.coordinatorEpoch, arrivalRequestId: arrival.requestId, operation: "close_worktree", rationale: "My original Memory only",
        closing: { executionId: execution.id, ownershipEpoch: 1, paths: files } }, "close") });
      f.database.releaseScopedLeaderTurn({ ...manager, residentStopConfirmed: true });
      if (returned === "grant-failed") {
        f.database.recordScopedWorktreeClosingGrantFailure({ projectId: id, executionId: execution.id, agentId: "idea", ownershipEpoch: 1,
          grantInvocationId: manager.invocationId, grantCallId: "close", originalStop: { invocationId: identity.invocationId, runtimePath,
            residentStopConfirmed: true, evidence: { exactOriginalNativeStopped: true } },
          reason: "Actual late path outside the manifest", errorCode: "GIT_PATH_VIOLATION", errorClass: "GitPathViolationError" });
      } else {
        const closingInvocation = "inv_first_closing", closingRuntime = path.join(f.storage.projectDir(id), "runtime", closingInvocation);
        const observation = f.database.scopedWorktreeClosingCandidates(id)[0]!.observation;
        const closing = f.database.beginScopedWorktreeClosingTurn({ projectId: id, executionId: execution.id, ownershipEpoch: 1, agentId: "idea",
          invocationId: closingInvocation, runtimePath: closingRuntime, capabilityHash: "e".repeat(64), grantInvocationId: manager.invocationId, grantCallId: "close",
          observation, originalStop: { invocationId: identity.invocationId, runtimePath, residentStopConfirmed: true, evidence: { exactOriginalNativeStopped: true } } })!.turn;
        f.database.markScopedWorktreeClosingOpened({ ...closing, nativeProcessOpened: true });
        f.database.recordAgentNativeSessionBinding({ projectId: id, agentId: "idea", invocationId: closingInvocation, runtimePath: closingRuntime,
          worktreePath: execution.worktreePath, session, executionContext: { role: "delivery", nodeRunId: "node-G", groupRunId: "run-G", executionId: execution.id, ownershipEpoch: 1, executionWorktree: execution.worktreePath } });
        f.database.recordScopedWorktreeClosingResult({ ...closing, inputId: "actual-original-closing-input", output: "Actual original closing output: source still needs my Leader's decision", residentTurnCompleted: true });
        f.database.stopScopedWorktreeClosingTurn({ ...closing, residentStopConfirmed: true, evidence: { exactClosingNativeStopped: true } });
        f.database.returnScopedWorktreeClosingToLeader({ projectId: id, executionId: execution.id, ownershipEpoch: 1, agentId: "idea", invocationId: closingInvocation,
          ...(returned === "trusted" ? { observation } : { observationFailure: { reason: "Actual late path outside the manifest", errorCode: "GIT_PATH_VIOLATION", errorClass: "GitPathViolationError" } }) });
      }
    }
    const initialGrants = returned ? 1 : 0, canClose = identified && !["read-failed", "grant-failed"].includes(returned ?? "");
    const before = { owner: f.database.scopedExecution(id, execution.id), report: f.database.scopedAgentReport(id, execution.id, 1),
      completion: f.database.scopedAgentTaskCompleted(id, execution.id, 1, identity.invocationId) };
    if (globalMain) {
      const claim = f.database.claimScopedLeaderTurn({ projectId: id, groupRunId: "run-G", agentId: "main", invocationId: "inv_escalate",
        runtimePath: path.join(f.storage.projectDir(id), "runtime", "inv_escalate") })!;
      const manager = { projectId: id, groupRunId: "run-G", agentId: "main", invocationId: "inv_escalate", coordinatorEpoch: claim.coordinatorEpoch };
      f.database.markScopedLeaderOpened(manager);
      const envelope = (action: ControlAction, callId: string): ControlActionEnvelope => ({ projectId: id, agent: "main", invocationId: manager.invocationId,
        callId, stateVersion: manager.coordinatorEpoch, capabilityHash: "c".repeat(64), receivedAt: now, action });
      f.database.recordScopedLeaderTaskCompletion({ ...manager, envelope: envelope({ tool: "finish_task", summary: "Original Leader escalated the uncertain scope" }, "finish") });
      f.database.acceptScopedLeaderAction({ ...manager, residentStopConfirmed: true, envelope: envelope({ tool: "coordinate_group_task", groupRunId: "run-G",
        coordinatorEpoch: manager.coordinatorEpoch, arrivalRequestId: arrival.requestId, operation: "escalate", rationale: "Original file ownership requires clarification" }, "escalate") });
      f.database.releaseScopedLeaderTurn({ ...manager, residentStopConfirmed: true });
    }
    const open = f.launcher.open.getMockImplementation()!;
    let managerClosed = false, invocationId = "";
    const continueWorktreeClosings = vi.fn(async () => { expect(managerClosed).toBe(true); });
    f.dependencies.continueWorktreeClosings = continueWorktreeClosings;
    f.launcher.open.mockImplementation(async input => {
      const handle = await open(input), scope = input.controlScope!;
      expect(scope.role).toBe(globalMain ? "scoped-main" : "scoped-leader"); invocationId = input.request.invocationId;
      expect("closingArrivalRequestIds" in scope ? scope.closingArrivalRequestIds : undefined).toEqual(globalMain || !canClose ? undefined : [arrival.requestId]);
      const close = handle.close.getMockImplementation()!;
      handle.close.mockImplementation(async () => { await close(); managerClosed = true; });
      handle.submit.mockImplementation(async turn => {
        const authority = await input.controlAuthorityFactory!({ request: input.request, turn });
        expect(authority.control.collaboration?.closingArrivalRequestIds).toEqual(globalMain || !canClose ? undefined : [arrival.requestId]);
        expect(contextSourceText(input.request)).toContain("These are not ordinary business retries"); expect(contextSourceText(input.request)).toContain(A);
        expect(contextSourceText(input.request)).toContain(globalMain ? "GLOBAL Main cannot grant file writes" : "Only these direct arrivals");
        if (returned && returned !== "grant-failed") {
          expect(contextSourceText(input.request)).toContain("Actual original closing output"); expect(contextSourceText(input.request)).toContain("original Agent finish_task");
          expect(contextSourceText(input.request)).toContain("exactly one new call");
        }
        const service = new ControlActionService({ projectId: id, agent: "main", invocationId, capability: authority.control.capability,
          capabilityHash: authority.control.capabilityHash, stateVersion: authority.control.stateVersion, stagingPath: authority.control.stagingPath, revalidate: authority.revalidate });
        await service.stage(authority.control.capability, "own-finish", { tool: "finish_task", summary: "My independent coordination task" });
        const action: ControlAction = { tool: "coordinate_group_task", groupRunId: "run-G", coordinatorEpoch: authority.control.stateVersion,
          arrivalRequestId: arrival.requestId, operation: "close_worktree", rationale: "Inspect only the original necessary Memory", closing: { executionId: execution.id, ownershipEpoch: 1, paths: files } };
        if (globalMain) {
          await expect(service.stage(authority.control.capability, "forbidden-close", action)).rejects.toThrow();
          await service.stage(authority.control.capability, "user", { tool: "request_user", message: "Original direct Leader needs clarification", rationale: "Cannot expand file authority" });
        } else if (canClose) await service.stage(authority.control.capability, "direct-close", action);
        else {
          await expect(service.stage(authority.control.capability, "unidentified-close", action)).rejects.toThrow();
          expect(contextSourceText(input.request)).toContain("trusted writable manifest"); expect(contextSourceText(input.request)).toContain(returned ? "Actual late path outside the manifest" : "Original file scope is uncertain");
          const { closing, ...escalation } = action;
          await service.stage(authority.control.capability, "escalate", { ...escalation, operation: "escalate" });
        }
        expect(f.database.scopedWorktreeClosingAuthorizations(id)).toHaveLength(initialGrants);
        const result = { handoff: "My explicit retained-owner coordination", controlActions: await readStagedControlActions(authority.control.stagingPath) };
        expect(new HarnessRuntimeFacade().validateResidentTurnResult(result, { ...input.request, control: authority.control })).toEqual(result);
        return result;
      });
      return handle;
    });
    await (f.runtime as any).performManagement(activated.groupRun, "recover", undefined, "Identified retained original Memory", globalMain);
    expect(managerClosed).toBe(true); expect(f.database.scopedLeaderTurns(id).find(turn => turn.invocationId === invocationId)?.status).toBe("released");
    expect(f.database.scopedWorktreeClosingAuthorizations(id)).toHaveLength(initialGrants + (globalMain || !canClose ? 0 : 1));
    expect(continueWorktreeClosings).toHaveBeenCalledTimes(globalMain || !canClose ? 0 : 1);
    expect({ owner: f.database.scopedExecution(id, execution.id), report: f.database.scopedAgentReport(id, execution.id, 1),
      completion: f.database.scopedAgentTaskCompleted(id, execution.id, 1, identity.invocationId) }).toEqual(before);
    expect(f.database.scopedWorktreeClosingTurns(id)).toHaveLength(returned && returned !== "grant-failed" ? 1 : 0); expect(f.git.checkpointAndPush).not.toHaveBeenCalled();
  });

  it.each(["current_last", "history_last", "history_only", "missing_sync", "missing_journal", "missing_push"] as const)(
    "recovers an observed current supplementary PR with %s while preserving the old recovery PR", async mode => {
      const scenario = { recovery: "retry" as "retry" | "user" };
      const f = await fixture(true, scenario);
      const activated = await f.runtime.activate({ projectId: id, groupRunId: "run-G", groupId: "G",
        activationRequestId: "activate-G", workflowRevision: 1,
        outer: { nodeRunId: "node-G", inputSnapshotRef: "project:requirement", activatedByAgentId: "main" } });
      const planInvocation = "inv_" + "1".repeat(32);
      const plan = f.database.claimScopedLeaderTurn({ projectId: id, groupRunId: "run-G", agentId: "main",
        invocationId: planInvocation, runtimePath: path.join(f.storage.projectDir(id), "runtime", planInvocation) })!;
      const manager = { projectId: id, groupRunId: "run-G", agentId: "main", invocationId: planInvocation,
        coordinatorEpoch: plan.coordinatorEpoch };
      const envelope = (action: ControlAction, callId: string): ControlActionEnvelope => ({ projectId: id,
        agent: "main", invocationId: planInvocation, stateVersion: plan.coordinatorEpoch, callId,
        capabilityHash: "a".repeat(64), receivedAt: repository.observedAt, action });
      f.database.markScopedLeaderOpened(manager);
      f.database.recordScopedLeaderTaskCompletion({ ...manager, envelope: envelope({ tool: "finish_task" }, "plan-finish") });
      f.database.acceptScopedLeaderAction({ ...manager, residentStopConfirmed: true, envelope: envelope({
        tool: "assign_group_tasks", groupRunId: "run-G", coordinatorEpoch: plan.coordinatorEpoch,
        tasks: ["G_idea", "G_execution"].map(taskId => ({ taskId, assignment: `Deliver ${taskId}` })) }, "plan") });
      f.database.releaseScopedLeaderTurn({ ...manager, residentStopConfirmed: true });
      const arrival = activated.arrivals.find(a => a.agentId === "idea")!;
      const execution = f.database.claimScopedAgentArrival({ projectId: id, arrivalRequestId: arrival.requestId,
        agentId: "idea", executionId: "original-observed-execution",
        worktreePath: path.join(f.storage.projectDir(id), "git-worktrees/agents/idea") })!.execution;
      const originalInvocation = "inv_" + "2".repeat(32);
      const identity = { projectId: id, executionId: execution.id, ownershipEpoch: 1, invocationId: originalInvocation };
      const authority = { ...execution, purpose: "delivery" as const };
      f.database.beginScopedAgentTurn({ ...identity, runtimePath: path.join(f.storage.projectDir(id), "runtime", originalInvocation), baseCommit: "b".repeat(40) });
      await f.git.sessionBegin(authority, 1, { kind: "delivery", base: { kind: "commit", commitSha: "b".repeat(40) } });
      f.database.markScopedAgentTurnOpened({ ...identity, nativeProcessOpened: true });
      const deliver = async (label: string, synchronize: boolean) => {
        const pushed = await f.git.checkpointAndPush({ repository, execution: authority, ownershipEpoch: 1,
          operationId: label + "-push", reason: label });
        const pull = await f.git.createPullRequest({ repository, execution: authority, ownershipEpoch: 1,
          operationId: label + "-create", expectedHead: pushed.checkpoint.commitSha,
          base: "groups/run-G", title: label, body: label });
        const merged = await f.git.mergePullRequest({ repository, execution: authority, ownershipEpoch: 1,
          operationId: label + "-merge", providerNumber: pull.providerNumber,
          expectedHead: pull.headSha!, expectedBase: pull.base });
        if (synchronize) await f.git.reconcileMergedPullRequest({ repository, execution: authority, ownershipEpoch: 1,
          operationId: mergedPullSynchronizationOperationId(execution.id, 1, pull.headSha!, pull.base, merged.mergeCommitSha!),
          providerNumber: pull.providerNumber, expectedHead: pull.headSha!, expectedBase: pull.base,
          expectedMergeCommitSha: merged.mergeCommitSha! });
        return merged;
      };
      const old = await deliver("original", true);
      // Retain both actual journaled deliveries. The stopped owner below has
      // an unbound report and an older, immutable merged recovery source.
      f.git.pulls.set("retained-old-observation", old);
      f.git.checkpointHeads.set(execution.id, "c".repeat(40));
      const current = await deliver("supplement", mode !== "missing_sync");
      f.database.recordScopedAgentTaskCompletion({ ...identity, agentId: "idea", callId: "original-finish", requestedAt: repository.observedAt });
      for (let attempt = 1; attempt <= 2; attempt++) f.database.reserveScopedAgentMechanismRepair({ ...identity, missing: ["github_get_pr"] });
      f.database.recordScopedAgentReport({ ...identity, output: "Immutable original business report", selectedWeakTarget: "finish",
        residentTurnCompleted: true, residentStopConfirmed: true });
      f.database.failScopedAgentArrival({ ...identity, arrivalRequestId: arrival.requestId,
        reason: "The original report head remains unbound", residentStopConfirmed: true });
      f.database.recordScopedRecoveryPull({ ...identity, pull: old });
      f.state.agentSessionIds = { ...f.state.agentSessionIds, idea: "session-idea" };
      const originalReport = f.database.scopedAgentReport(id, execution.id, 1)!;
      const originalCompletion = f.database.scopedAgentTaskCompletion(id, execution.id, 1);
      const originalProjection = f.database.projectState.bind(f.database);
      const operations = originalProjection(id).operations.filter(o => o.ownerExecutionId === execution.id);
      if (mode === "missing_journal") {
        const recorded = f.database.scopedAgentRecordedDeliveryPull.bind(f.database);
        vi.spyOn(f.database, "scopedAgentRecordedDeliveryPull").mockImplementation((project, owner, epoch, head) =>
          owner === execution.id && head === current.headSha ? undefined : recorded(project, owner, epoch, head));
      }
      if (mode === "missing_push") {
        vi.spyOn(f.database, "projectState").mockImplementation(project => {
          const snapshot = originalProjection(project);
          return { ...snapshot, operations: snapshot.operations.filter(operation => !(operation.kind === "git.push" &&
            operation.ownerExecutionId === execution.id && operation.expectedHead === current.headSha)) };
        });
      }
      const discover = f.git.observePullRequestForExecution.getMockImplementation()!;
      f.git.observePullRequestForExecution.mockImplementation(request => {
        if (request.execution.id === execution.id) throw new Error("Multiple pull requests claim the same execution branch; recovery is ambiguous");
        return discover(request);
      });
      const open = f.launcher.open.getMockImplementation()!;
      let supplements = 0;
      f.launcher.open.mockImplementation(async input => {
        const handle = await open(input);
        if (input.controlScope?.role !== "scoped-agent" || input.controlScope.executionId !== execution.id) return handle;
        handle.submit.mockImplementation(async turn => {
          supplements++;
          const capability = await input.controlAuthorityFactory!({ request: input.request, turn });
          const actions: ControlActionEnvelope[] = [];
          const query = async (pull: typeof old) => {
            const receipt: ControlActionEnvelope = { projectId: id, agent: "idea", invocationId: turn.invocationId,
              callId: "observe-" + pull.providerNumber, stateVersion: capability.control.stateVersion,
              capabilityHash: capability.control.capabilityHash, receivedAt: repository.observedAt,
              action: { tool: "github_get_pr", providerNumber: pull.providerNumber } };
            await capability.revalidate(receipt, actions); actions.push(receipt);
            expect(await capability.execute!(receipt)).toMatchObject({ id: pull.id, headSha: pull.headSha, status: "merged" });
          };
          if (mode === "current_last") { await query(old); await query(current); }
          else { if (mode !== "history_only") await query(current); await query(old); }
          scenario.recovery = "user"; // A failed check escalates, never loops to repair the fixture.
          return { handoff: "Read-only actual current and historical PR observations", controlActions: actions };
        });
        return handle;
      });
      const result = await advanceUntilTerminal(f);
      expect(supplements).toBe(1);
      expect(f.database.scopedRecoveryPull(id, execution.id, 1)).toEqual(old);
      expect(f.database.scopedAgentTaskCompletion(id, execution.id, 1)).toEqual(originalCompletion);
      expect(f.database.scopedAgentMechanismRepairCount(id, execution.id)).toBe(2);
      expect(originalProjection(id).operations.filter(o => o.ownerExecutionId === execution.id)).toEqual(operations);
      expect(f.git.observePullRequestForExecution.mock.calls.filter(([r]) => r.execution.id === execution.id)).toEqual([]);
      expect(f.git.log.filter(entry => entry.head === execution.executionBranch && entry.kind === "push")).toHaveLength(2);
      expect(f.git.log.filter(entry => entry.head === execution.executionBranch && entry.kind === "create")).toHaveLength(2);
      expect(f.git.log.filter(entry => entry.head === execution.executionBranch && entry.kind === "merge")).toHaveLength(2);
      if (mode === "current_last" || mode === "history_last") {
        expect(f.database.scopedAgentReport(id, execution.id, 1)).toMatchObject({ ...originalReport, headSha: current.headSha });
        expect(f.database.scopedExecution(id, execution.id)).toMatchObject({ status: "completed", ownershipEpoch: 1 });
        expect(result.status).toBe("completed");
      } else {
        expect(f.database.scopedAgentReport(id, execution.id, 1)).toEqual(originalReport);
        expect(f.database.scopedExecution(id, execution.id)).toMatchObject({ status: "failed", ownershipEpoch: 1 });
        expect(result.status).not.toBe("completed");
      }
    });

  it("R11 binds the actual first model turn and passes persistent proxy failure into existing scoped escalation", async () => {
    const f = await fixture(false, { recovery: "user" });
    f.state.title = "OpenFARS R11 fixture-r11: gateway unavailable";
    const directory = path.join(f.root, "r11-controller"); await mkdir(directory);
    vi.stubEnv("OPENFARS_R11_FAULT_DIRECTORY", directory);
    const config = f.state.agents.idea;
    config.gatewayId = `gwy_${"a".repeat(32)}`;
    config.gatewaySnapshot = { id: config.gatewayId, name: "isolated fixture", url: "https://unreached.invalid/v1",
      apiKey: "fixture-only", models: [config.model], defaultModel: config.model,
      protocol: "chat-completions", nativeProtocol: "chat-completions" };
    await f.runtime.activate({ projectId: id, groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G", workflowRevision: 1,
      outer: { nodeRunId: "node-G", inputSnapshotRef: "project:requirement", activatedByAgentId: "main" } });
    const arrival = f.database.scopedArrivals("run-G").find((a) => a.agentId === "idea")!;
    expect(arrival.status).toBe("queued");
    await writeFile(path.join(directory, `${id}.arm.json`), JSON.stringify({ schemaVersion: 1, case: "R11",
      variant: "gateway-unavailable", runId: "fixture-r11", projectId: id, projectTitle: f.state.title,
      payloadSha256: "a".repeat(64), submissionSha256: "b".repeat(64), observedStateSha256: "c".repeat(64), armedAt: new Date().toISOString(),
      target: { selection: "queued-arrival", agentId: "idea", ownershipEpoch: 1, groupRunId: "run-G",
        arrivalRequestId: arrival.requestId, arrivalSequence: arrival.sequence, targetNodeId: arrival.targetNodeId,
        base: "groups/run-G", repository: { owner: repository.owner, name: repository.name, providerId: repository.providerId },
        route: { gatewayId: config.gatewayId, model: config.model, harness: config.harness,
          protocol: "chat-completions", nativeProtocol: "chat-completions", deliveryMode: "native-stream",
          gatewayUrlSha256: createHash("sha256").update(config.gatewaySnapshot.url).digest("hex") } } }));
    let selectedInvocation: string | undefined;
    const errors: string[] = [];
    const submit = f.dependencies.submit;
    f.dependencies.submit = async (handle, turn) => {
      const opened = f.opened.find((o) => o.request.invocationId === turn.invocationId)!;
      const current = await opened.turnRequestFactory!({ request: opened.request, turn });
      if (!current.request.gatewayModelFetch) return submit(handle, turn);
      selectedInvocation = turn.invocationId;
      await current.request.onDurableSessionStarted!({ schemaVersion: 1, harnessId: config.harness!, adapterVersion: "test",
        nativeId: "session-idea", generation: 1, durable: true, createdAt: repository.observedAt }, "session-idea");
      const route = await openInvocationGatewayRoute({ id: config.harness, label: "Fixture", nativeProtocol: "chat-completions" } as HarnessDescriptor,
        current.request, current.onTrace, new AbortController().signal, { validateGatewayTarget: async () => undefined });
      try {
        const response = await fetch(`${route.baseUrl}/chat/completions`, { method: "POST",
          headers: { authorization: `Bearer ${route.token}`, "content-type": "application/json" },
          body: JSON.stringify({ model: config.model, messages: [{ role: "user", content: "Verify 5" }], stream: false }) });
        const body = await response.text(); errors.push(body); expect(response.status).toBe(503);
        throw new Error(body);
      } finally { await route.close(); }
    };
    const outcome = await advanceUntilTerminal(f);
    expect(outcome.status).toBe("waiting");
    expect(f.state.userIntervention?.status).toBe("pending");
    expect(errors).toHaveLength(1); expect(errors[0]).toContain("R11 controlled gateway-unavailable");
    const executions = f.database.projectState(id).scopedExecutions!.filter((e) => e.arrivalRequestId === arrival.requestId);
    expect(executions).toHaveLength(1);
    const execution = executions[0];
    expect(execution.ownershipEpoch).toBe(1);
    expect(f.database.scopedAgentTurn(id, execution.id, 1)).toMatchObject({ invocationId: selectedInvocation, status: "stopped" });
    expect(f.closed).toContain(selectedInvocation);
    expect(f.state.agentSessionIds?.idea).toBe("session-idea");
    expect(f.opened.filter((o) => o.request.invocationId === selectedInvocation)[0].request.workspacePath).toBe(execution.worktreePath);
    expect(f.git.checkpointAndPush.mock.calls.filter(([r]) => r.execution.id === execution.id)).toHaveLength(0);
    const receipt = JSON.parse(await readFile(path.join(directory, `${id}.consumed.json`), "utf8"));
    expect(receipt.binding).toMatchObject({ executionId: execution.id, invocationId: selectedInvocation,
      inputId: `scoped:${arrival.requestId}:epoch:1`, branch: execution.executionBranch });
  });

  it("R04 requests an Agent-written pending file after merge and waits for its real file/Git-tool supplement", async () => {
    const f = await fixture(); f.state.agents.idea.sessionPersistence = false;
    f.state.title = "OpenFARS R04 fixture-pending: owned pending diagnostic";
    const directory = path.join(f.root, "pending-controller"); await mkdir(directory);
    vi.stubEnv("OPENFARS_R04_PENDING_FAULT_DIRECTORY", directory);
    const run = promisify(execFile);
    const open = f.launcher.open.getMockImplementation()!;
    let selected: string | undefined, turns = 0, pendingContent = "";
    const heads: string[] = [];
    const observe = f.git.observeExecutionWorktree.getMockImplementation()!;
    f.git.observeExecutionWorktree.mockImplementation(async (owner, epoch) => {
      const base = await observe(owner, epoch);
      if (owner.id !== selected) return base;
      const status = await run("git", ["status", "--porcelain=v1", "-z", "--untracked-files=all"], { cwd: owner.worktreePath });
      return { ...base, pendingPaths: status.stdout.split("\0").filter(Boolean).map((entry) => entry.slice(3)) };
    });
    f.launcher.open.mockImplementation(async (input) => {
      const handle = await open(input), scope = input.controlScope;
      if (selected || scope?.role !== "scoped-agent" || scope.agentId !== "idea") return handle;
      selected = scope.executionId;
      const execution = f.database.scopedExecution(id, selected)!;
      const group = f.database.scopedGroupRun(id, execution.groupRunId)!;
      await run("git", ["init", "--initial-branch", execution.executionBranch], { cwd: execution.worktreePath });
      await run("git", ["config", "user.name", "Fixture Agent"], { cwd: execution.worktreePath });
      await run("git", ["config", "user.email", "agent@example.test"], { cwd: execution.worktreePath });
      const runtime = input.request.runtimePath!; await mkdir(runtime, { recursive: true });
      const prepared = await prepareFilesystemAuthorityMcp({ executionRuntimePath: runtime, authority: {
        serviceUserRoot: f.root, executionWorktree: execution.worktreePath,
        ownedMemoryPath: path.join(execution.worktreePath, "agent-memory/idea/Memory.md"),
        readRoots: [execution.worktreePath], writeRoots: [execution.worktreePath],
        projectWorktreeRoot: path.dirname(execution.worktreePath), protectedRoots: [runtime],
        gitCapability: "execution", rootBindings: [{ id: "write-fixture000000", path: execution.worktreePath, write: true }], rawTools: "forbidden"
      } });
      const client = new Client({ name: "r04-agent-fixture", version: "1" });
      await client.connect(new StdioClientTransport({ command: prepared.row.command, args: prepared.row.args }));
      const fileTool = async (name: string, args: Record<string, unknown>) => {
        const response = await client.callTool({ name, arguments: args });
        expect(response.isError, JSON.stringify(response)).not.toBe(true);
        return response;
      };
      const close = handle.close.getMockImplementation()!;
      handle.close.mockImplementation(async () => { await client.close(); await close(); });
      await writeFile(path.join(directory, `${id}.arm.json`), JSON.stringify({ schemaVersion: 1, case: "R04",
        variant: "owned-pending-file", runId: "fixture-pending", projectId: id, projectTitle: f.state.title,
        payloadSha256: "a".repeat(64), submissionSha256: "b".repeat(64), observedStateSha256: "c".repeat(64), armedAt: new Date().toISOString(),
        target: { agentId: "idea", executionId: selected, ownershipEpoch: 1, invocationId: input.request.invocationId,
          groupRunId: group.id, arrivalRequestId: execution.arrivalRequestId, branch: execution.executionBranch,
          base: group.groupBranch, repository: { owner: repository.owner, name: repository.name, providerId: repository.providerId } } }));
      handle.submit.mockImplementation(async (turn) => {
        const authority = await input.controlAuthorityFactory!({ request: input.request, turn });
        const service = new ControlActionService({ projectId: id, agent: "idea", invocationId: turn.invocationId,
          stateVersion: authority.control.stateVersion, capability: authority.control.capability,
          capabilityHash: authority.control.capabilityHash, stagingPath: authority.control.stagingPath,
          revalidate: authority.revalidate, execute: authority.execute });
        const call = async (action: ControlAction) => service.stageWithResult(authority.control.capability, `pending-${turns}-${action.tool}`, action);
        turns += 1;
        if (turns === 1) {
          for (const dir of ["evidence", "agent-memory/idea"]) await fileTool("make_directory", { rootId: "write-fixture000000", path: dir });
          await fileTool("write_file", { rootId: "write-fixture000000", path: "evidence/business.json", content: '{"sum":15}\n' });
          await fileTool("write_file", { rootId: "write-fixture000000", path: "agent-memory/idea/Memory.md", content: "Verified 4+5+6=15\n" });
          await fileTool("git_stage", { paths: ["evidence/business.json", "agent-memory/idea/Memory.md"] });
        } else {
          expect(turns).toBe(2); expect(turn.prompt).toContain("evidence/pending-owned.json");
          expect(f.opened.filter((o) => o.controlScope?.role === "scoped-agent" && o.request.agent === "idea")).toHaveLength(1);
          expect(JSON.parse(await readFile(path.join(directory, `${id}.observed.json`), "utf8"))).toMatchObject({
            status: "pending-file-observed", worktree: { head: heads[0], pendingPaths: expect.arrayContaining(["agent-memory/idea/Memory.md", "evidence/pending-owned.json"]) } });
          await fileTool("git_stage", { paths: ["."] });
        }
        await fileTool("git_commit", { message: turns === 1 ? "Agent business and Memory" : "Agent delivers its diagnostic after closing reminder" });
        const head = (await run("git", ["rev-parse", "HEAD"], { cwd: execution.worktreePath })).stdout.trim();
        heads.push(head); f.git.checkpointHeads.set(selected!, head);
        await call({ tool: "git_push", reason: turns === 1 ? "Business delivery" : "Additional owned diagnostic delivery" });
        await call({ tool: "github_create_pr", base: group.groupBranch, title: "Owned delivery", body: `Commit ${head}` });
        const merged = await call({ tool: "github_merge_pr", providerNumber: f.git.pulls.get(selected!)!.providerNumber });
        const returned = merged.result as { acceptancePendingFile?: { file: string; content: string } };
        if (turns === 1) {
          expect(returned.acceptancePendingFile).toBeDefined();
          const request = returned.acceptancePendingFile!; pendingContent = request.content;
          await expect(readFile(path.join(execution.worktreePath, request.file))).rejects.toThrow(/ENOENT/);
          await fileTool("write_file", { rootId: "write-fixture000000", path: request.file, content: request.content });
        } else expect(returned.acceptancePendingFile).toBeUndefined();
        if (turns === 1) await call({ tool: "finish_task", summary: "Current delivery steps complete" });
        return { handoff: "Original business preserved; current owned files delivered", controlActions: await readStagedControlActions(authority.control.stagingPath) };
      });
      return handle;
    });
    await f.runtime.activate({ projectId: id, groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G", workflowRevision: 1,
      outer: { nodeRunId: "node-G", inputSnapshotRef: "project:requirement", activatedByAgentId: "main" } });
    const outcome = await f.runtime.advance("run-G");
    expect(turns, JSON.stringify({ outcome, events: f.database.eventsAfter(id, 0, 10000).filter(e => /fail|invalid/.test(e.type)) })).toBe(2); expect(heads[0]).not.toBe(heads[1]);
    expect(f.database.scopedExecution(id, selected!)?.status, JSON.stringify({ outcome,
      events: f.database.eventsAfter(id, 0, 10000).filter(e => /fail|issue|repair/.test(e.type)) })).toBe("completed");
    expect(f.database.scopedAgentReport(id, selected!, 1)?.headSha).toBe(heads[1]);
    const workspace = f.database.scopedExecution(id, selected!)!.worktreePath;
    expect((await run("git", ["show", `${heads[1]}:evidence/pending-owned.json`], { cwd: workspace })).stdout).toBe(pendingContent);
    expect((await run("git", ["diff", heads[0], heads[1], "--", "evidence/business.json"], { cwd: workspace })).stdout).toBe("");
    expect((await run("git", ["show", `${heads[1]}:agent-memory/idea/Memory.md`], { cwd: workspace })).stdout).toContain("Current delivery steps complete");
    expect(f.git.checkpointAndPush.mock.calls.filter(([r]) => r.execution.id === selected)).toHaveLength(2);
    expect(f.git.mergePullRequest.mock.calls.filter(([r]) => r.execution.id === selected)).toHaveLength(2);
  });

  it("reopens the stopped original nonpersistent session for files left by native shutdown before releasing FIFO", async () => {
    const f = await fixture(); f.state.agents.idea.sessionPersistence = false;
    const open = f.launcher.open.getMockImplementation()!;
    let selected: string | undefined, pending = false, injected = false, repairs = 0;
    const file = "shutdown-owned-note.txt";
    f.git.observeExecutionWorktree.mockImplementation(async (owner, epoch) => ({
      projectId: id, executionId: owner.id, ownershipEpoch: epoch, branch: owner.executionBranch,
      worktreePath: owner.worktreePath, head: f.git.localRefs.get(owner.executionBranch)!, retained: true,
      observedAt: repository.observedAt, pendingPaths: owner.id === selected && pending ? [file] : []
    }));
    f.launcher.open.mockImplementation(async (input) => {
      const handle = await open(input), scope = input.controlScope;
      if (scope?.role !== "scoped-agent" || scope.agentId !== "idea") return handle;
      if (selected && scope.executionId !== selected) { expect(pending).toBe(false); return handle; }
      selected = scope.executionId;
      if (!injected) {
        const close = handle.close.getMockImplementation()!;
        handle.close.mockImplementation(async () => {
          await writeFile(path.join(input.request.workspacePath, file), "Late original writer file");
          pending = injected = true;
          await close();
        });
      } else {
        repairs += 1;
        expect(input.request.resumeThreadId).toBe("session-idea");
        expect(input.sameEpochReopen).toBeDefined();
        const report = f.database.scopedAgentReport(id, selected, 1)!;
        expect(report.headSha).toBeUndefined();
        const execution = f.database.scopedExecution(id, selected)!;
        handle.submit.mockImplementation(async (turn) => {
          expect(turn.prompt).toContain(file);
          const authority = await input.controlAuthorityFactory!({ request: input.request, turn });
          const service = new ControlActionService({ projectId: id, agent: "idea", invocationId: turn.invocationId,
            stateVersion: authority.control.stateVersion, capability: authority.control.capability,
            capabilityHash: authority.control.capabilityHash, stagingPath: authority.control.stagingPath,
            revalidate: authority.revalidate, execute: authority.execute });
          const pull = f.git.pulls.get(selected!)!;
          await service.stageWithResult(authority.control.capability, "observe-original", { tool: "github_get_pr", providerNumber: pull.providerNumber });
          await service.stageWithResult(authority.control.capability, "confirm-original", { tool: "github_merge_pr", providerNumber: pull.providerNumber });
          await rm(path.join(execution.worktreePath, file)); pending = false; // Original Agent chooses cleanup.
          return { handoff: "Removed my own shutdown diagnostic", controlActions: await readStagedControlActions(authority.control.stagingPath) };
        });
      }
      return handle;
    });
    await f.runtime.activate({ projectId: id, groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G", workflowRevision: 1,
      outer: { nodeRunId: "node-G", inputSnapshotRef: "project:requirement", activatedByAgentId: "main" } });
    await f.runtime.advance("run-G");
    expect(repairs).toBe(1);
    expect(f.database.scopedExecution(id, selected!)?.status).toBe("completed");
    expect(f.database.scopedAgentReport(id, selected!, 1)?.output).toMatch(/^Finished inv_/);
    expect(f.git.checkpointAndPush.mock.calls.filter(([r]) => r.execution.id === selected)).toHaveLength(1);
    expect(f.git.mergePullRequest.mock.calls.filter(([r]) => r.execution.id === selected)).toHaveLength(1);
  });

  it.each([true, false])("holds the original Agent and its FIFO until post-merge pending files are closed (cleanup=%s)", async (cleanup) => {
    const f = await fixture(); f.state.agents.idea.sessionPersistence = false;
    const open = f.launcher.open.getMockImplementation()!;
    let selected: string | undefined, pending = false, repairs = 0;
    const file = "pending-owned-note.txt";
    Object.assign(f.git, { observeExecutionWorktree: vi.fn(async (owner) => ({
      projectId: id, executionId: owner.id, ownershipEpoch: owner.ownershipEpoch, branch: owner.executionBranch,
      worktreePath: owner.worktreePath, head: f.git.localRefs.get(owner.executionBranch), retained: true,
      observedAt: repository.observedAt, pendingPaths: owner.id === selected && pending ? [file] : []
    })) });
    f.launcher.open.mockImplementation(async (input) => {
      const handle = await open(input), scope = input.controlScope;
      if (scope?.role !== "scoped-agent" || scope.agentId !== "idea") return handle;
      if (selected && scope.executionId !== selected) { expect(pending).toBe(false); return handle; }
      selected = scope.executionId;
      const submit = handle.submit.getMockImplementation()!;
      handle.submit.mockImplementation(async (turn) => {
        if (!pending) {
          const result = await submit(turn);
          await writeFile(path.join(input.request.workspacePath, file), "Original Agent diagnostic after successful delivery");
          pending = true;
          return result;
        }
        repairs += 1;
        expect(turn.prompt).toContain(file);
        expect(input.request.sessionContinuity).toBe("strict");
        expect(f.database.projectState(id).scopedExecutions!.filter((e) => e.agentId === "idea")).toHaveLength(1);
        expect(f.database.scopedExecution(id, selected!)?.status).not.toBe("completed");
        expect(await readFile(path.join(input.request.workspacePath, file), "utf8")).toContain("Original Agent diagnostic");
        if (cleanup) { await rm(path.join(input.request.workspacePath, file)); pending = false; }
        return { handoff: cleanup ? "Removed my disposable diagnostic; existing delivery preserved" : "Cannot close my pending file", controlActions: [] };
      });
      return handle;
    });
    await f.runtime.activate({ projectId: id, groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G", workflowRevision: 1,
      outer: { nodeRunId: "node-G", inputSnapshotRef: "project:requirement", activatedByAgentId: "main" } });
    const outcome = await f.runtime.advance("run-G");
    expect(repairs).toBe(cleanup ? 1 : 3);
    expect(f.database.scopedExecution(id, selected!)?.status === "completed").toBe(cleanup);
    expect(f.git.checkpointAndPush.mock.calls.filter(([r]) => r.execution.id === selected)).toHaveLength(1);
    expect(f.git.createPullRequest.mock.calls.filter(([r]) => r.execution.id === selected)).toHaveLength(1);
    expect(f.git.mergePullRequest.mock.calls.filter(([r]) => r.execution.id === selected)).toHaveLength(1);
    if (!cleanup) {
      expect(outcome.status).not.toBe("completed");
      expect(f.opened.filter((i) => i.controlScope?.role === "scoped-agent" && i.request.agent === "idea")).toHaveLength(2);
      const original = f.database.scopedExecution(id, selected!)!;
      expect(await readFile(path.join(original.worktreePath, file), "utf8")).toContain("Original Agent diagnostic");
      expect(f.database.scopedAgentMechanismRepairCount(id, original.id)).toBe(2);
      const continuations = f.database.eventsAfter(id, 0, 10_000).filter(event => event.type === "scoped.agent.coordinated_repair.requested");
      expect(continuations).toHaveLength(1);
      const retry = continuations[0].payload.coordination.envelope as ControlActionEnvelope;
      expect(f.database.eventByRequestId(id, `scoped-leader-action:${retry.invocationId}:${retry.callId}`)?.payload.globalMain).toBe(true);
      expect(f.database.resumeScopedMergedDelivery(id, original.id, original.ownershipEpoch, retry)).toBe(false);
      expect(f.database.scopedAgentReportContinuation(id, original.id, original.ownershipEpoch)).toBeUndefined();
      expect(f.database.scopedAgentReport(id, original.id, original.ownershipEpoch)?.headSha).toBeUndefined();
    }
  });

  it("R04 retains its unopened reservation while the Leader retries the arrival from the current canonical group base", async () => {
    const f = await fixture(false, { recovery: "retry" });
    const begin = f.git.sessionBegin.getMockImplementation()!;
    let canonicalBaseAtRetry: string | undefined;
    f.git.sessionBegin.mockImplementation(async (...args) => {
      if (args[0].agentId === "idea" && args[1] === 2) canonicalBaseAtRetry = f.git.refs.get("groups/run-G");
      return begin(...args);
    });
    f.state.title = "OpenFARS R04 fixture-r04: first preparation failure";
    const directory = path.join(f.root, "r04-preparation-controller"); await mkdir(directory);
    vi.stubEnv("OPENFARS_R04_PREPARATION_FAULT_DIRECTORY", directory);
    await f.runtime.activate({ projectId: id, groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G", workflowRevision: 1,
      outer: { nodeRunId: "node-G", inputSnapshotRef: "project:requirement", activatedByAgentId: "main" } });
    const arrival = f.database.scopedArrivals("run-G").find((a) => a.agentId === "idea")!;
    expect(arrival.status).toBe("queued");
    expect(f.database.projectState(id).scopedExecutions).toHaveLength(0);
    await writeFile(path.join(directory, `${id}.arm.json`), JSON.stringify({ schemaVersion: 1, case: "R04",
      variant: "registered-unopened-preparation", runId: "fixture-r04", projectId: id, projectTitle: f.state.title,
      payloadSha256: "a".repeat(64), submissionSha256: "b".repeat(64), observedStateSha256: "c".repeat(64), armedAt: new Date().toISOString(),
      target: { selection: "queued-arrival", agentId: "idea", ownershipEpoch: 1, groupRunId: "run-G",
        arrivalRequestId: arrival.requestId, arrivalSequence: arrival.sequence, targetNodeId: arrival.targetNodeId,
        base: "groups/run-G", repository: { owner: repository.owner, name: repository.name, providerId: repository.providerId } } }));
    const outcome = await advanceUntilTerminal(f);
    expect(outcome.status, JSON.stringify(f.database.eventsAfter(id, 0, 10_000).filter((e) => /fail|error/.test(e.type)))).toBe("completed");
    const executions = f.database.projectState(id).scopedExecutions!.filter((e) => e.arrivalRequestId === arrival.requestId);
    expect(executions).toHaveLength(1);
    const execution = executions[0];
    expect(execution.ownershipEpoch).toBe(2);
    const first = f.database.scopedAgentTurn(id, execution.id, 1)!;
    const retry = f.database.scopedAgentTurn(id, execution.id, 2)!;
    expect(first).toMatchObject({ status: "stopped", baseCommit: "b".repeat(40) });
    expect(first.openedAt).toBeUndefined();
    expect(retry.openedAt).toBeDefined();
    expect(canonicalBaseAtRetry).toBeDefined();
    expect(retry.baseCommit).toBe(canonicalBaseAtRetry);
    const preparations = f.git.sessionBegin.mock.calls.filter(([owner]) => owner.id === execution.id);
    expect(preparations).toHaveLength(1);
    expect(preparations[0][1]).toBe(2);
    expect(preparations[0][2]).toEqual({ kind: "delivery", base: { kind: "commit", commitSha: canonicalBaseAtRetry } });
    expect(f.git.observeRetainedExecution.mock.calls.filter(([owner]) => owner.id === execution.id)).toHaveLength(0);
    const opens = f.opened.filter((o) => o.request.executionContext?.executionId === execution.id);
    expect(opens).toHaveLength(1);
    expect(opens[0].request.executionContext?.ownershipEpoch).toBe(2);
    const receipt = JSON.parse(await readFile(path.join(directory, `${id}.consumed.json`), "utf8"));
    expect(receipt).toMatchObject({ stage: "reserved-before-session-begin", savedBase: first.baseCommit,
      binding: { executionId: execution.id, invocationId: first.invocationId, branch: execution.executionBranch }, nativeTurn: { status: "reserved" } });
    expect(receipt.nativeTurn.openedAt).toBeUndefined();
  });

  it("R03 rejects the first finish receipt, then supplements the original nonpersistent session without repeating delivery", async () => {
    const f = await fixture(); f.state.agents.idea.sessionPersistence = false;
    f.state.title = "OpenFARS R03 fixture-r03: missing finish";
    const directory = path.join(f.root, "r03-controller"); await mkdir(directory);
    vi.stubEnv("OPENFARS_R03_FAULT_DIRECTORY", directory);
    const open = f.launcher.open.getMockImplementation()!;
    let selected: string | undefined, marker: string | undefined;
    let turns = 0;
    f.launcher.open.mockImplementation(async (input) => {
      const handle = await open(input), scope = input.controlScope;
      if (selected || scope?.role !== "scoped-agent" || scope.agentId !== "idea" || scope.executionId.startsWith("group-final-")) return handle;
      selected = scope.executionId;
      const execution = f.database.scopedExecution(id, selected)!;
      const group = f.database.scopedGroupRun(id, scope.groupRunId)!;
      await writeFile(path.join(directory, `${id}.arm.json`), JSON.stringify({ schemaVersion: 1, case: "R03",
        variant: "missing-finish-once", runId: "fixture-r03", projectId: id, projectTitle: f.state.title,
        payloadSha256: "a".repeat(64), submissionSha256: "b".repeat(64), observedStateSha256: "c".repeat(64), armedAt: new Date().toISOString(),
        target: { agentId: "idea", executionId: selected, ownershipEpoch: 1, invocationId: input.request.invocationId,
          groupRunId: group.id, arrivalRequestId: execution.arrivalRequestId, branch: execution.executionBranch,
          base: group.groupBranch, repository: { owner: repository.owner, name: repository.name, providerId: repository.providerId } } }));
      handle.submit.mockImplementation(async (turn) => {
        const authority = await input.controlAuthorityFactory!({ request: input.request, turn });
        const service = new ControlActionService({ projectId: id, agent: "idea", invocationId: turn.invocationId,
          stateVersion: authority.control.stateVersion, capability: authority.control.capability,
          capabilityHash: authority.control.capabilityHash, stagingPath: authority.control.stagingPath,
          revalidate: authority.revalidate, execute: authority.execute });
        const call = (action: ControlAction) => service.stageWithResult(authority.control.capability, `r03-${turns}-${action.tool}`, action);
        if (turns++ === 0) {
          await input.request.onDurableSessionStarted!({ schemaVersion: 1, harnessId: f.state.agents.idea.harness!,
            adapterVersion: "test", nativeId: "session-idea", generation: 1, durable: true, createdAt: repository.observedAt }, "session-idea");
          await call({ tool: "git_push", reason: "Deliver original temperature results" });
          await call({ tool: "github_create_pr", base: group.groupBranch, title: "Temperature results", body: "0C=32F; 100C=212F" });
          await call({ tool: "github_merge_pr", providerNumber: f.git.pulls.get(selected!)!.providerNumber });
          await expect(call({ tool: "finish_task", summary: "Original business is done" })).rejects.toThrow(/no finish_task receipt was recorded/);
          const receipt = JSON.parse(await readFile(path.join(directory, `${id}.consumed.json`), "utf8"));
          marker = receipt.marker;
          expect(receipt.deliveryAtAttempt.merged.status).toBe("merged");
          expect(f.database.scopedAgentTaskCompleted(id, selected!, 1, turn.invocationId)).toBe(false);
          expect((await readStagedControlActions(authority.control.stagingPath)).some((e) => e.action.tool === "finish_task")).toBe(false);
        } else {
          expect(turns).toBe(2);
          expect(turn.inputId).toContain(":mechanism-repair:1");
          expect(turn.prompt).toContain("finish_task");
          expect(turn.prompt).not.toContain(marker); // Available through the retained native session, not a new instruction.
          expect(f.state.agentSessionIds?.idea).toBe("session-idea");
          expect(f.database.scopedAgentTurn(id, selected!, 1)?.status).toBe("opened");
          await call({ tool: "finish_task", summary: `Original work only; recalled ${marker}` });
        }
        return { handoff: `0C=32F; 100C=212F; retained marker ${marker}`, controlActions: await readStagedControlActions(authority.control.stagingPath) };
      });
      return handle;
    });
    await f.runtime.activate({ projectId: id, groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G", workflowRevision: 1,
      outer: { nodeRunId: "node-G", inputSnapshotRef: "project:requirement", activatedByAgentId: "main" } });
    const outcome = await advanceUntilTerminal(f);
    expect(outcome.status, JSON.stringify(f.database.eventsAfter(id, 0, 10_000).filter((e) => /fail|error/.test(e.type)))).toBe("completed");
    expect(turns).toBe(2);
    expect(f.opened.filter((entry) => entry.request.executionContext?.executionId === selected)).toHaveLength(1);
    expect(f.git.checkpointAndPush.mock.calls.filter(([request]) => request.execution.id === selected)).toHaveLength(1);
    expect(f.git.createPullRequest.mock.calls.filter(([request]) => request.execution.id === selected)).toHaveLength(1);
    expect(f.git.mergePullRequest.mock.calls.filter(([request]) => request.execution.id === selected)).toHaveLength(1);
    expect(f.database.scopedAgentReport(id, selected!, 1)?.output).toContain(marker);
  });

  it("repairs an injected R14 partial report through the original nonpersistent Agent session without replacing business output", async () => {
    const f = await fixture(); f.state.agents.idea.sessionPersistence = false;
    f.state.title = "OpenFARS R14 fixture-r14: partial report association recovery";
    const directory = path.join(f.root, "r14-controller"); await mkdir(directory);
    vi.stubEnv("OPENFARS_R14_FAULT_DIRECTORY", directory);
    const open = f.launcher.open.getMockImplementation()!;
    let selected: string | undefined, originalInvocation: string | undefined;
    let businessTurns = 0, supplements = 0;
    const reportOutput = "Original immutable business report\nMissing=1; sum=30\n原始证据保留。";
    f.launcher.open.mockImplementation(async (input) => {
      const handle = await open(input);
      const scope = input.controlScope;
      if (scope?.role !== "scoped-agent" || scope.agentId !== "idea" || scope.executionId.startsWith("group-final-")) return handle;
      if (selected && scope.executionId !== selected) return handle;
      const execution = f.database.scopedExecution(id, scope.executionId)!;
      const group = f.database.scopedGroupRun(id, scope.groupRunId)!;
      if (!selected) {
        selected = execution.id; originalInvocation = input.request.invocationId;
        await writeFile(path.join(directory, `${id}.arm.json`), JSON.stringify({ schemaVersion: 1, case: "R14",
          variant: "partial-report-linkage", runId: "fixture-r14", projectId: id, projectTitle: f.state.title,
          payloadSha256: "a".repeat(64), submissionSha256: "b".repeat(64), observedStateSha256: "c".repeat(64),
          armedAt: new Date(999_000).toISOString(), target: { agentId: "idea", executionId: selected, ownershipEpoch: 1,
            invocationId: originalInvocation, groupRunId: group.id, arrivalRequestId: execution.arrivalRequestId,
            branch: execution.executionBranch, base: group.groupBranch,
            repository: { owner: repository.owner, name: repository.name, providerId: repository.providerId } } }));
        const submit = handle.submit.getMockImplementation()!;
        handle.submit.mockImplementation(async (turn) => { businessTurns++; return { ...await submit(turn), handoff: reportOutput }; });
      } else {
        expect(input.sameEpochReopen).toBeDefined();
        expect(input.request.resumeThreadId).toBe("session-idea");
        expect(f.state.agents.idea.sessionPersistence).toBe(false);
        const saved = f.database.scopedAgentReport(id, selected, 1)!;
        expect(saved).toMatchObject({ invocationId: originalInvocation, output: reportOutput });
        expect(saved.headSha).toBeUndefined();
        expect(await readFile(input.request.inboxPath, "utf8")).not.toContain(reportOutput);
        expect(contextSourceText(input.request)).toContain(reportOutput);
        handle.submit.mockImplementation(async (turn) => {
          supplements++;
          expect(turn.prompt).toContain("original task");
          const authority = await input.controlAuthorityFactory!({ request: input.request, turn });
          const service = new ControlActionService({ projectId: id, agent: "idea", invocationId: turn.invocationId,
            stateVersion: authority.control.stateVersion, capability: authority.control.capability,
            capabilityHash: authority.control.capabilityHash, stagingPath: authority.control.stagingPath,
            revalidate: authority.revalidate, execute: authority.execute });
          const pull = f.git.pulls.get(selected!)!;
          await service.stageWithResult(authority.control.capability, "r14-observe", { tool: "github_get_pr", providerNumber: pull.providerNumber });
          await service.stageWithResult(authority.control.capability, "r14-merge-proof", { tool: "github_merge_pr", providerNumber: pull.providerNumber });
          return { handoff: "Mechanism association supplied; original report remains authoritative", controlActions: await readStagedControlActions(authority.control.stagingPath) };
        });
      }
      return handle;
    });
    await f.runtime.activate({ projectId: id, groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G", workflowRevision: 1,
      outer: { nodeRunId: "node-G", inputSnapshotRef: "project:requirement", activatedByAgentId: "main" } });
    const outcome = await advanceUntilTerminal(f);
    expect(outcome.status, JSON.stringify(f.database.eventsAfter(id, 0, 10_000).filter((e) => /fail|error/.test(e.type)))).toBe("completed");
    expect(businessTurns).toBe(1); expect(supplements).toBe(1);
    const report = f.database.scopedAgentReport(id, selected!, 1)!;
    const receipt = JSON.parse(await readFile(path.join(directory, `${id}.consumed.json`), "utf8"));
    expect(report).toMatchObject({ invocationId: originalInvocation, output: reportOutput, headSha: receipt.omittedHeadSha });
    expect(createHash("sha256").update(report.output).digest("hex")).toBe(receipt.report.outputSha256);
    expect(f.git.checkpointAndPush.mock.calls.filter(([request]) => request.execution.id === selected)).toHaveLength(1);
    expect(f.git.createPullRequest.mock.calls.filter(([request]) => request.execution.id === selected)).toHaveLength(1);
    expect(f.git.mergePullRequest.mock.calls.filter(([request]) => request.execution.id === selected)).toHaveLength(1);
    expect(f.opened.filter((entry) => entry.request.executionContext?.executionId === selected)).toHaveLength(2);
  });

  it("returns the isolated R12 timeout through real control staging and lets the Agent query/replay without a second merge", async () => {
    const f = await fixture();
    f.state.title = "OpenFARS R12 fixture-r12: merged PR with lost response";
    const directory = path.join(f.root, "r12-controller"); await mkdir(directory);
    vi.stubEnv("OPENFARS_R12_FAULT_DIRECTORY", directory);
    const open = f.launcher.open.getMockImplementation()!;
    let selected: string | undefined;
    let seenTimeout = false;
    f.launcher.open.mockImplementation(async (input) => {
      const handle = await open(input);
      const scope = input.controlScope;
      if (selected || scope?.role !== "scoped-agent" || scope.agentId !== "idea" || scope.executionId.startsWith("group-final-")) return handle;
      selected = scope.executionId;
      const execution = f.database.scopedExecution(id, selected)!;
      const group = f.database.scopedGroupRun(id, scope.groupRunId)!;
      // This isolated fixture uses its own Agent name. The operator arming CLI
      // separately requires the catalog's first implementer and creation proof.
      await writeFile(path.join(directory, `${id}.arm.json`), JSON.stringify({ schemaVersion: 1, case: "R12",
        variant: "merge-response-lost", runId: "fixture-r12", projectId: id, projectTitle: f.state.title,
        payloadSha256: "a".repeat(64), submissionSha256: "b".repeat(64), observedStateSha256: "c".repeat(64),
        armedAt: new Date().toISOString(), target: { agentId: "idea", executionId: selected, ownershipEpoch: execution.ownershipEpoch,
          invocationId: input.request.invocationId, groupRunId: group.id, arrivalRequestId: execution.arrivalRequestId,
          branch: execution.executionBranch, base: group.groupBranch,
          repository: { owner: repository.owner, name: repository.name, providerId: repository.providerId } } }));
      handle.submit.mockImplementation(async (turn) => {
        await input.request.onDurableSessionStarted!({ schemaVersion: 1, harnessId: f.state.agents.idea.harness!,
          adapterVersion: "test", nativeId: "session-idea", generation: 1, durable: true, createdAt: repository.observedAt }, "session-idea");
        const authority = await input.controlAuthorityFactory!({ request: input.request, turn });
        const service = new ControlActionService({ projectId: id, agent: "idea", invocationId: turn.invocationId,
          stateVersion: authority.control.stateVersion, capability: authority.control.capability,
          capabilityHash: authority.control.capabilityHash, stagingPath: authority.control.stagingPath,
          revalidate: authority.revalidate, execute: authority.execute });
        const call = (callId: string, action: ControlAction) => service.stageWithResult(authority.control.capability, callId, action);
        await call("r12-push", { tool: "git_push", reason: "Agent checkpoint" });
        await call("r12-create", { tool: "github_create_pr", base: group.groupBranch, title: "Agent delivery", body: "Original work" });
        const pull = f.git.pulls.get(selected!)!;
        const merge: ControlAction = { tool: "github_merge_pr", providerNumber: pull.providerNumber, reason: "Agent merge" };
        await expect(call("r12-merge", merge)).rejects.toThrow(/ETIMEDOUT/);
        seenTimeout = true;
        // Staging records the authenticated request, even when its result is
        // lost. It is not a fabricated successful tool return.
        expect((await readStagedControlActions(authority.control.stagingPath)).filter((e) => e.callId === "r12-merge")).toHaveLength(1);
        const receipt = JSON.parse(await readFile(path.join(directory, `${id}.consumed.json`), "utf8"));
        expect(f.database.recordedGitOperation(id, receipt.operationId)?.status).toBe("finalized");
        expect(receipt.result.localSynchronization.expectedSourceHead).toBe(pull.headSha);
        expect(f.database.scopedAgentTurn(id, selected!, execution.ownershipEpoch)?.status).toBe("opened");
        expect(f.database.scopedAgentReport(id, selected!, execution.ownershipEpoch)).toBeUndefined();
        const writes = f.git.mergePullRequest.mock.calls.filter(([request]) => request.execution.id === selected).length;
        const syncs = f.git.reconcileMergedPullRequest.mock.calls.length;
        // Only these explicit Agent calls observe/replay the missing result.
        const observed = await call("r12-observe", { tool: "github_get_pr", providerNumber: pull.providerNumber });
        expect(observed.result).toMatchObject({ status: "merged", providerNumber: pull.providerNumber });
        const replay = await call("r12-merge", merge);
        expect(replay.result).toEqual(receipt.result);
        expect(f.git.mergePullRequest.mock.calls.filter(([request]) => request.execution.id === selected)).toHaveLength(writes);
        expect(f.git.reconcileMergedPullRequest.mock.calls).toHaveLength(syncs);
        await call("r12-finish", { tool: "finish_task", summary: "Original work verified after response loss" });
        return { handoff: "Original R12 work preserved", controlActions: await readStagedControlActions(authority.control.stagingPath) };
      });
      return handle;
    });
    await f.runtime.activate({ projectId: id, groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G", workflowRevision: 1,
      outer: { nodeRunId: "node-G", inputSnapshotRef: "project:requirement", activatedByAgentId: "main" } });
    const outcome = await advanceUntilTerminal(f);
    expect(outcome.status, JSON.stringify(f.database.eventsAfter(id, 0, 10_000).filter((e) => /fail|error/.test(e.type)))).toBe("completed");
    expect(seenTimeout).toBe(true);
    expect(f.git.mergePullRequest.mock.calls.filter(([request]) => request.execution.id === selected)).toHaveLength(1);
    expect(f.git.createPullRequest.mock.calls.filter(([request]) => request.execution.id === selected)).toHaveLength(1);
    expect(f.database.scopedAgentReport(id, selected!, 1)?.output).toBe("Original R12 work preserved");
  });

  it.each([false, true])("lets the Leader finish from actual published final PR/sync facts despite old business reports (nested=%s)", async (nested) => {
    const f = await fixture(false, { nested, completionReadsPublishedFacts: true });
    f.state.agents.main.sessionPersistence = false;
    const open = f.launcher.open.getMockImplementation()!;
    let completeDecisions = 0;
    f.launcher.open.mockImplementation(async (input) => {
      const handle = await open(input);
      const submit = handle.submit.getMockImplementation()!;
      handle.submit.mockImplementation(async (turn) => {
        const scope = input.controlScope!;
        const isBusiness = scope.role === "scoped-agent" && !scope.executionId.startsWith("group-final-");
        if (input.request.workflowContext?.purpose === "complete") {
          const current = JSON.parse(await readFile(path.join(f.storage.projectDir(id), "workflow", "current-state.json"), "utf8"));
          const proof = current.scopedRuntime.groupFinalMerges?.find((entry) => entry.groupRunId === scope.groupRunId);
          const group = f.database.scopedGroupRun(id, scope.groupRunId)!;
          expect(group.status).not.toBe("completed");
          if (proof) {
            // Publication of a real provider proof must leave completion to
            // this live Leader's MCP decision, rather than finishing in S.
            expect(f.database.scopedAcceptedLeaderActions(id, group.id).some((entry) => entry.envelope.action.tool === "complete_group")).toBe(false);
            expect(current.scopedRuntime.agentMerges.length).toBeGreaterThan(0);
            completeDecisions += 1;
          }
        }
        const result = await submit(turn);
        return isBusiness ? { ...result, handoff: "Old Agent-authored report: no final PR exists yet.\n" + "Earlier business results. ".repeat(3000) } : result;
      });
      return handle;
    });
    await f.runtime.activate({ projectId: id, groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G", workflowRevision: 1,
      outer: { nodeRunId: "node-G", inputSnapshotRef: "project:requirement", activatedByAgentId: "main" } });
    expect((await advanceUntilTerminal(f)).status).toBe("completed");
    expect(completeDecisions).toBe(nested ? 3 : 1);
    const projection = f.database.projectState(id);
    const published = JSON.parse(await readFile(path.join(f.storage.projectDir(id), "workflow", "current-state.json"), "utf8"));
    expect(published.stateRevision).toBe(projection.stateRevision);
    expect(published.scopedRuntime.groupFinalMerges).toEqual(projection.scopedGroupFinalMerges);
    expect(published.scopedRuntime.agentMerges).toEqual(projection.scopedAgentMerges);
    for (const group of projection.scopedGroupRuns!) {
      const decision = f.database.scopedAcceptedLeaderActions(id, group.id).find((entry) => entry.envelope.action.tool === "complete_group")!;
      expect(decision).toBeDefined();
      expect(f.database.scopedLeaderTaskCompleted(id, group.id, "main", decision.envelope.invocationId, decision.envelope.stateVersion)).toBe(true);
      expect(f.database.scopedLeaderTurns(id).find((turn) => turn.invocationId === decision.envelope.invocationId)?.status).toBe("released");
    }
    expect(f.state.agentSessionIds?.main).toBe("session-main");
    expect(f.git.closePullRequest).not.toHaveBeenCalled();
    expect(f.database.scopedGroupIssues(id)).toEqual([]);
  }, 15_000);

  it.each(["missing_finish", "missing_merge", "missing_route", "two_supplements"] as const)(
    "preserves Agent decisions and artifacts across %s with fresh per-turn MCP receipts", async (mode) => {
      const f = await fixture(false, { agentWeakRouting: true });
      f.state.agents.idea.sessionPersistence = false;
      const open = f.launcher.open.getMockImplementation()!;
      let target: string | undefined;
      let rounds = 0;
      let priorReceipt: ControlActionEnvelope | undefined;
      let priorCapability: string | undefined;
      const paths: string[] = [];
      const hashes: string[] = [];
      let originalRoute: ControlActionEnvelope | undefined;
      f.launcher.open.mockImplementation(async (input) => {
        const handle = await open(input);
        const scope = input.controlScope;
        if (target || scope?.role !== "scoped-agent" || scope.agentId !== "idea" || scope.executionId.startsWith("group-final-")) return handle;
        target = scope.executionId;
        const execution = f.database.scopedExecution(id, target)!;
        await writeFile(path.join(execution.worktreePath, "result.txt"), "Agent-authored retained result");
        handle.submit.mockImplementation(async (turn) => {
          await input.request.onDurableSessionStarted!({ schemaVersion: 1, harnessId: f.state.agents.idea.harness!,
            adapterVersion: "test", nativeId: "session-idea", generation: 1, durable: true, createdAt: repository.observedAt }, "session-idea");
          const authority = await input.controlAuthorityFactory!({ request: input.request, turn });
          paths.push(authority.control.stagingPath); hashes.push(authority.control.capabilityHash!);
          const service = new ControlActionService({ projectId: id, agent: "idea", invocationId: turn.invocationId,
            stateVersion: authority.control.stateVersion, capability: authority.control.capability,
            capabilityHash: authority.control.capabilityHash, stagingPath: authority.control.stagingPath,
            revalidate: authority.revalidate, execute: authority.execute });
          const call = async (action: ControlAction) => service.stageWithResult(authority.control.capability,
            `worker-round-${rounds}-${action.tool}`, action);
          if (rounds === 0) {
            await expect(service.stage(authority.control.capability, "foreign-publication-correction", {
              tool: "publish_artifact", path: "result.txt", title: "Scoped result", kind: "file",
              description: "Cannot replace standalone publications here", replacesPath: "old.txt"
            })).rejects.toThrow("requires standalone execution authority");
            if (mode !== "missing_route") originalRoute = (await call({ tool: "route_to_agent", target: "finish", rationale: "My local choice" })).envelope;
            priorReceipt = (await call({ tool: "publish_artifact", path: "result.txt", title: "My retained artifact", kind: "file", description: "My original result" })).envelope;
            await call({ tool: "git_push", reason: "Checkpoint my work" });
            await call({ tool: "github_create_pr", base: f.database.scopedGroupRun(id, scope.groupRunId)!.groupBranch,
              title: "My delivery", body: "My existing result" });
            if (mode !== "missing_merge") await call({ tool: "github_merge_pr", providerNumber: f.git.pulls.get(target!)!.providerNumber });
            if (mode === "missing_route") await call({ tool: "finish_task", summary: "My original work is finished" });
            priorCapability = authority.control.capability;
          } else {
            expect(turn.inputId).toContain("mechanism-repair:");
            expect(paths.at(-1)).not.toBe(paths[0]);
            expect(hashes.at(-1)).not.toBe(hashes[0]);
            await expect(authority.revalidate(priorReceipt!, [])).rejects.toThrow(/exact scoped turn capability/);
            await expect(service.stage(priorCapability!, "old-capability", { tool: "finish_task" })).rejects.toThrow();
            await expect(service.stage(authority.control.capability, "replace-original-route",
              { tool: "route_to_agent", target: "G_execution", rationale: "Replace the first choice" })).rejects.toThrow();
            await call({ tool: "github_get_pr", providerNumber: f.git.pulls.get(target!)!.providerNumber });
            if (mode === "missing_route") originalRoute = (await call({ tool: "route_to_agent", target: "finish", rationale: "My local choice" })).envelope;
            if (mode === "missing_merge") await call({ tool: "github_merge_pr", providerNumber: f.git.pulls.get(target!)!.providerNumber });
            if (mode !== "two_supplements" && mode !== "missing_route" || mode === "two_supplements" && rounds === 2) await call({ tool: "finish_task", summary: "My original work is finished" });
          }
          rounds += 1;
          const controlActions = await readStagedControlActions(authority.control.stagingPath);
          expect(controlActions.every((receipt) => receipt.capabilityHash === authority.control.capabilityHash)).toBe(true);
          const result = { handoff: "Original Agent completed its original business result", controlActions };
          expect(new HarnessRuntimeFacade().validateResidentTurnResult(result, { ...input.request, control: authority.control })).toEqual(result);
          return result;
        });
        return handle;
      });
      await f.runtime.activate({ projectId: id, groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G", workflowRevision: 1,
        outer: { nodeRunId: "node-G", inputSnapshotRef: "project:requirement", activatedByAgentId: "main" } });
      expect((await advanceUntilTerminal(f)).status).toBe("completed");
      expect(rounds).toBe(mode === "two_supplements" ? 3 : 2);
      expect(new Set(paths).size).toBe(rounds);
      expect(f.state.agentSessionIds?.idea).toBe("session-idea");
      expect(f.database.scopedAgentReport(id, target!, 1)).toMatchObject({ selectedWeakTarget: "finish" });
      const artifacts = f.database.eventsAfter(id, 0, 10_000).filter((event) => event.type === "scoped.artifact.staged" && event.payload.executionId === target);
      expect(artifacts).toHaveLength(1);
      expect(artifacts[0].payload.envelope).toEqual(priorReceipt);
      expect(artifacts[0].payload.envelope.capabilityHash).toBe(mode === "missing_route" ? priorReceipt!.capabilityHash : originalRoute!.capabilityHash);
      expect(f.database.scopedAgentMechanismRepairCount(id, target!)).toBe(rounds - 1);
      expect(f.opened.filter((input) => input.controlScope?.role === "scoped-agent" && input.controlScope.executionId === target)).toHaveLength(1);
      expect(f.git.log.filter((entry) => entry.kind === "push" && entry.head === f.database.scopedExecution(id, target!)!.executionBranch)).toHaveLength(1);
      expect(f.git.closePullRequest).not.toHaveBeenCalled();
    }
  );

  it("retains a sixty-Agent plan in S while keeping worker admission bounded", async () => {
    const f = await fixture(false, { businessAgentCount: 60 });
    const activated = await f.runtime.activate({ projectId: id, groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G", workflowRevision: 1,
      outer: { nodeRunId: "node-G", inputSnapshotRef: "project:requirement", activatedByAgentId: "main" } });
    expect(activated.arrivals).toHaveLength(60);
    const invocationId = "inv_large_group_plan";
    const claim = f.database.claimScopedLeaderTurn({ projectId: id, groupRunId: "run-G", agentId: "main", invocationId,
      runtimePath: path.join(f.storage.projectDir(id), "runtime", invocationId) })!;
    const manager = { projectId: id, groupRunId: "run-G", agentId: "main", invocationId, coordinatorEpoch: claim.coordinatorEpoch };
    f.database.markScopedLeaderOpened(manager);
    const receipt = (callId: string, action: ControlAction): ControlActionEnvelope => ({ projectId: id, agent: "main", invocationId,
      stateVersion: claim.coordinatorEpoch, callId, capabilityHash: "a".repeat(64), receivedAt: repository.observedAt, action });
    const tasks = f.state.orchestration.scopedWorkflow!.groups[0]!.workflow.nodes.map(node => ({ taskId: node.nodeId, assignment: `Research ${node.nodeId}` }));
    f.database.recordScopedLeaderTaskCompletion({ ...manager, envelope: receipt("own-finish", { tool: "finish_task" }) });
    f.database.acceptScopedLeaderAction({ ...manager, residentStopConfirmed: true, envelope: receipt("large-plan", {
      tool: "assign_group_tasks", groupRunId: "run-G", coordinatorEpoch: claim.coordinatorEpoch, tasks }) });
    expect(f.database.scopedGroupPlan(id, "run-G")!.tasks).toEqual(tasks);
    f.database.releaseScopedLeaderTurn({ ...manager, residentStopConfirmed: true });
    const claimed = activated.arrivals.slice(0, 3).map((arrival, index) => f.database.claimScopedAgentArrival({ projectId: id,
      arrivalRequestId: arrival.requestId, agentId: arrival.agentId!, executionId: `large-group-execution-${index}`,
      worktreePath: path.join(f.storage.projectDir(id), "git-worktrees", "agents", arrival.agentId!) }));
    expect(claimed[0]).toBeTruthy();
    expect(claimed[1]).toBeTruthy();
    expect(claimed[2]).toBeFalsy();
  });

  it.each([false, true])("coordinates two independent failed arrivals through production authority before either original Agent restarts (missing finish: %s)", async (missingFinish) => {
    const f = await fixture(false, { recovery: "retry" });
    f.state.agents.idea.sessionPersistence = false;
    f.state.agents.execution.sessionPersistence = false;
    const activated = await f.runtime.activate({ projectId: id, groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G", workflowRevision: 1,
      outer: { nodeRunId: "node-G", inputSnapshotRef: "project:requirement", activatedByAgentId: "main" } });
    const planInvocation = "inv_" + "1".repeat(32);
    const claim = f.database.claimScopedLeaderTurn({ projectId: id, groupRunId: "run-G", agentId: "main", invocationId: planInvocation,
      runtimePath: path.join(f.storage.projectDir(id), "runtime", planInvocation) })!;
    const manager = { projectId: id, groupRunId: "run-G", agentId: "main", invocationId: planInvocation, coordinatorEpoch: claim.coordinatorEpoch };
    f.database.markScopedLeaderOpened(manager);
    const receipt = (callId: string, action: ControlAction): ControlActionEnvelope => ({ projectId: id, agent: "main",
      invocationId: planInvocation, stateVersion: claim.coordinatorEpoch, callId, capabilityHash: "a".repeat(64), receivedAt: repository.observedAt, action });
    f.database.recordScopedLeaderTaskCompletion({ ...manager, envelope: receipt("plan-finish", { tool: "finish_task" }) });
    f.database.acceptScopedLeaderAction({ ...manager, residentStopConfirmed: true, envelope: receipt("plan", { tool: "assign_group_tasks",
      groupRunId: "run-G", coordinatorEpoch: claim.coordinatorEpoch, tasks: ["G_idea", "G_execution"].map((taskId) => ({ taskId, assignment: `Original ${taskId} work` })) }) });
    f.database.releaseScopedLeaderTurn({ ...manager, residentStopConfirmed: true });
    const originals = [];
    for (const arrival of activated.arrivals) {
      const execution = f.database.claimScopedAgentArrival({ projectId: id, arrivalRequestId: arrival.requestId, agentId: arrival.agentId!,
        executionId: `original-${arrival.agentId}`, worktreePath: path.join(f.storage.projectDir(id), "git-worktrees", "agents", arrival.agentId!) })!.execution;
      const invocationId = `inv_${arrival.agentId === "idea" ? "2" : "3"}`.padEnd(36, "0");
      const identity = { projectId: id, executionId: execution.id, ownershipEpoch: 1, invocationId };
      f.database.beginScopedAgentTurn({ ...identity, runtimePath: path.join(f.storage.projectDir(id), "runtime", invocationId), baseCommit: "b".repeat(40) });
      await f.git.sessionBegin({ ...execution, purpose: "delivery" }, 1, { kind: "delivery", base: { kind: "commit", commitSha: "b".repeat(40) } });
      f.database.markScopedAgentTurnOpened({ ...identity, nativeProcessOpened: true });
      f.database.stopScopedAgentTurn({ ...identity, residentStopConfirmed: true });
      f.database.failScopedAgentArrival({ ...identity, arrivalRequestId: arrival.requestId, reason: "Original controlled native failure", residentStopConfirmed: true });
      f.state.agentSessionIds = { ...f.state.agentSessionIds, [execution.agentId]: `session-${execution.agentId}` };
      const note = path.join(execution.worktreePath, "retained-note.txt"); await writeFile(note, `Original ${execution.agentId} work`);
      originals.push({ execution, arrival, note });
    }
    const open = f.launcher.open.getMockImplementation()!;
    let recoveryInvocation: string | undefined;
    let managerPhysicallyClosed = false;
    let submissions = 0;
    f.launcher.open.mockImplementation(async (input) => {
      const scope = input.controlScope!;
      if (scope.role === "scoped-agent") {
        expect(managerPhysicallyClosed).toBe(true);
        expect(f.database.scopedLeaderTurns(id).find((turn) => turn.invocationId === recoveryInvocation)?.status).toBe("released");
      }
      const handle = await open(input);
      if (scope.role !== "scoped-leader" || scope.failedArrivalRequestIds.length !== 2) return handle;
      expect(recoveryInvocation).toBeUndefined(); recoveryInvocation = input.request.invocationId;
      const close = handle.close.getMockImplementation()!;
      handle.close.mockImplementation(async () => { await close(); managerPhysicallyClosed = true; });
      handle.submit.mockImplementation(async (turn) => {
        const nativeId = `session-${input.request.agent}`;
        await input.request.onDurableSessionStarted!({ schemaVersion: 1, harnessId: input.request.project.agents[input.request.agent].harness!,
          adapterVersion: "test", nativeId, generation: 1, durable: true, createdAt: repository.observedAt }, nativeId);
        const authority = await input.controlAuthorityFactory!({ request: input.request, turn });
        const service = new ControlActionService({ projectId: id, agent: input.request.agent, invocationId: input.request.invocationId,
          stateVersion: authority.control.stateVersion, capability: authority.control.capability, capabilityHash: authority.control.capabilityHash,
          stagingPath: authority.control.stagingPath, revalidate: authority.revalidate });
        if (!missingFinish || submissions > 0) {
          await service.stage(authority.control.capability, "own-finish", { tool: "finish_task", memory: "Both original Agent failures have independent decisions" });
        }
        if (submissions === 0) {
          for (const arrivalRequestId of scope.failedArrivalRequestIds) {
            await service.stage(authority.control.capability, arrivalRequestId, { tool: "coordinate_group_task", groupRunId: scope.groupRunId,
              coordinatorEpoch: scope.coordinatorEpoch, arrivalRequestId, operation: "retry", rationale: "Continue this original Agent's retained work" });
          }
        } else {
          expect(turn.inputId).toContain("mechanism-repair:1");
          expect(turn.prompt).toContain("Missing formal mechanism actions: finish_task");
          for (const arrivalRequestId of scope.failedArrivalRequestIds) expect(turn.prompt).toContain(arrivalRequestId);
          await expect(service.stage(authority.control.capability, "replace-during-finish", { tool: "coordinate_group_task", groupRunId: scope.groupRunId,
            coordinatorEpoch: scope.coordinatorEpoch, arrivalRequestId: scope.failedArrivalRequestIds[0], operation: "escalate", rationale: "Replace a staged choice" }))
            .rejects.toThrow("staged decision cannot be replaced");
        }
        submissions += 1;
        for (const original of originals) expect(f.database.scopedExecution(id, original.execution.id)).toMatchObject({ status: "failed", ownershipEpoch: 1 });
        expect(f.database.scopedAcceptedLeaderActions(id, "run-G").filter((entry) => entry.envelope.invocationId === recoveryInvocation)).toEqual([]);
        expect(contextSourceText(input.request)).toContain("This is a recovery control turn");
        expect(input.request.workflowContext?.purpose).toBe("recover");
        expect(turn.prompt).not.toContain("Plan only direct graph nodes with assign_group_tasks");
        const controlActions = await readStagedControlActions(authority.control.stagingPath);
        const returned = { handoff: "Original manager chose both repairs", controlActions };
        expect(new HarnessRuntimeFacade().validateResidentTurnResult(returned, { ...input.request, control: authority.control })).toEqual(returned);
        return returned;
      });
      return handle;
    });
    const result = await advanceUntilTerminal(f);
    expect(result.status, JSON.stringify({ issues: result.issues, failures: f.database.scopedManagementFailures(id) })).toBe("completed"); expect(recoveryInvocation).toBeDefined();
    const decisions = f.database.scopedAcceptedLeaderActions(id, "run-G").filter((entry) => entry.envelope.invocationId === recoveryInvocation);
    expect(decisions).toHaveLength(2);
    expect(decisions.map((entry) => entry.envelope.action)).toEqual(expect.arrayContaining(originals.map(({ arrival }) => ({ tool: "coordinate_group_task", groupRunId: "run-G",
      coordinatorEpoch: f.database.scopedLeaderTurns(id).find((turn) => turn.invocationId === recoveryInvocation)!.coordinatorEpoch, arrivalRequestId: arrival.requestId,
      operation: "retry", rationale: "Continue this original Agent's retained work" }))));
    for (const original of originals) {
      expect(f.database.scopedExecution(id, original.execution.id)).toMatchObject({ status: "completed", ownershipEpoch: 2,
        agentId: original.execution.agentId, arrivalRequestId: original.arrival.requestId, worktreePath: original.execution.worktreePath });
      expect(await readFile(original.note, "utf8")).toBe(`Original ${original.execution.agentId} work`);
      expect(f.state.agentSessionIds?.[original.execution.agentId]).toBe(`session-${original.execution.agentId}`);
    }
    expect(f.database.scopedManagementFailures(id)).toEqual([]);
    expect(submissions).toBe(missingFinish ? 2 : 1);
    expect(f.database.eventsAfter(id, 0, 10_000).filter((event) => event.type === "scoped.management.mechanism_repair.requested")).toHaveLength(missingFinish ? 1 : 0);
    expect(f.git.closePullRequest).not.toHaveBeenCalled();
  });

  it("preserves an accepted management finish while repairing an ordinary failure with the actual coordination tool", async () => {
    const f = await fixture(false, { failIdeaOnce: true, recovery: "retry" });
    const open = f.launcher.open.getMockImplementation()!;
    let repairedInvocation: string | undefined;
    let submissions = 0;
    f.launcher.open.mockImplementation(async (input) => {
      const handle = await open(input);
      const scope = input.controlScope!;
      if (repairedInvocation || scope.role !== "scoped-leader" || !scope.failedArrivalRequestIds.length) return handle;
      repairedInvocation = input.request.invocationId;
      handle.submit.mockImplementation(async (turn) => {
        const authority = await input.controlAuthorityFactory!({ request: input.request, turn });
        const service = new ControlActionService({ projectId: id, agent: input.request.agent, invocationId: turn.invocationId,
          stateVersion: authority.control.stateVersion, capability: authority.control.capability,
          capabilityHash: authority.control.capabilityHash, stagingPath: authority.control.stagingPath,
          revalidate: authority.revalidate, execute: authority.execute });
        if (submissions === 0) {
          await service.stage(authority.control.capability, "original-manager-finish", { tool: "finish_task",
            summary: "Original management completion", memory: "Keep this exact accepted memory" });
        } else {
          expect(turn.prompt).toContain("finish_task is already accepted for this invocation");
          expect(turn.prompt).toContain("A statement that a tool was called does not create a receipt");
          expect(contextSourceText(input.request)).toContain("omit repairNodeId entirely");
          expect(turn.prompt).toContain("Missing formal mechanism actions: formal recover control action");
          const action: ControlAction = { tool: "coordinate_group_task", groupRunId: scope.groupRunId,
            coordinatorEpoch: scope.coordinatorEpoch, arrivalRequestId: scope.failedArrivalRequestIds[0], operation: "retry",
            rationale: "Original Agent should continue its retained task" };
          await expect(service.stage(authority.control.capability, "retry-ordinary-failure", { ...action, repairNodeId: "idea" }))
            .rejects.toThrow("omit this optional field for an ordinary failed Agent task");
          await service.stage(authority.control.capability, "retry-ordinary-failure", action);
        }
        submissions += 1;
        return { handoff: "Management facts preserved", controlActions: await readStagedControlActions(authority.control.stagingPath) };
      });
      return handle;
    });
    await f.runtime.activate({ projectId: id, groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G", workflowRevision: 1,
      outer: { nodeRunId: "node-G", inputSnapshotRef: "project:requirement", activatedByAgentId: "main" } });
    expect((await advanceUntilTerminal(f)).status).toBe("completed");
    expect(submissions).toBe(2);
    expect(f.state.taskCompletions?.[`management:run-G:${repairedInvocation}`]).toMatchObject({
      summary: "Original management completion", memory: "Keep this exact accepted memory" });
    expect(f.database.scopedAcceptedLeaderActions(id, "run-G").filter((receipt) => receipt.envelope.invocationId === repairedInvocation)
      .map((receipt) => receipt.envelope.action)).toEqual([{ tool: "coordinate_group_task", groupRunId: "run-G",
        coordinatorEpoch: expect.any(Number), arrivalRequestId: expect.any(String), operation: "retry",
        rationale: "Original Agent should continue its retained task" }]);
    expect(f.database.scopedManagementFailures(id)).toEqual([]);
  });

  it.each(["direct", "retry", "user", "leader_failure", "global_failure", "merged_no_sync", "merged_recovered",
    "merged_exhaust_retry", "merged_exhaust_user", "merged_uncertain", "merged_uncertain_retry", "legacy_push", "legacy_push_retry",
    "merged_no_report", "merged_no_report_finish_missing", "merged_no_report_observe_only", "merged_no_report_old_head", "merged_no_report_multiple_prs",
    "merged_no_report_multiple_prs_missing", "merged_no_report_multiple_prs_changed", "merged_no_report_multiple_prs_wrong_merge",
    "merged_no_report_multiple_prs_unbound_head", "merged_no_report_multiple_prs_ambiguous_head", "merged_partial_report", "merged_partial_exhausted",
    "merged_partial_pushed_unpublished", "merged_partial_pushed_delivered", "merged_partial_pushed_repair", "merged_partial_retained_push",
    "merged_partial_retained_push_crash_gap", "merged_partial_retained_push_known_pr",
    "merged_partial_retained_push_known_pr_missing", "merged_partial_retained_push_known_pr_changed",
    "interrupted_no_report_prepared", "interrupted_no_report_uncertain", "interrupted_no_report_merged_uncertain", "interrupted_no_report_multiple_prs",
    "interrupted_no_report_stop_resume"] as const)("recovers a historical stopped report through %s original-task coordination and actual Agent tools", async (mode) => {
    const interruptedOriginal = mode.startsWith("interrupted_no_report");
    const multiplePrs = mode.includes("multiple_prs");
    const rejectedPrIdentity = multiplePrs && !mode.endsWith("multiple_prs");
    const mergedOriginal = mode.startsWith("merged_") || mode === "interrupted_no_report_merged_uncertain" || multiplePrs;
    const partialReport = mode.startsWith("merged_partial_");
    const newSupplementPush = mode.startsWith("merged_partial_pushed_");
    const retainedBoundPush = mode.startsWith("merged_partial_retained_push");
    const failurePersistenceGap = mode === "merged_partial_retained_push_crash_gap";
    const exhaustedPartialReport = mode === "merged_partial_exhausted" || (newSupplementPush && mode !== "merged_partial_pushed_repair") || retainedBoundPush ||
      mode === "merged_no_report_observe_only" || mode === "merged_no_report_old_head" || mode === "merged_no_report_multiple_prs";
    const missingReportOriginal = mode.startsWith("merged_no_report") || interruptedOriginal;
    const observeReportOnly = mode === "merged_no_report_observe_only" || mode === "merged_no_report_old_head" || mode === "merged_no_report_multiple_prs";
    const observedOldHead = mode === "merged_no_report_old_head";
    const missingCompletion = mode === "merged_no_report_finish_missing" || interruptedOriginal;
    const unsettledMerged = mode.startsWith("merged_uncertain") || mode === "interrupted_no_report_merged_uncertain" || mode === "interrupted_no_report_multiple_prs";
    const legacyPush = mode.startsWith("legacy_push");
    const delayed = mode === "retry" || mode === "user" || mode === "leader_failure" || mode === "global_failure" ||
      mode === "merged_exhaust_retry" || mode === "merged_exhaust_user" || mode === "merged_uncertain_retry" || mode === "legacy_push_retry";
    const recoveryScenario: Parameters<typeof fixture>[1] = { recovery: mode === "direct" || mode === "merged_no_sync" || mode === "merged_uncertain" || mode === "legacy_push" ? undefined
      : missingReportOriginal || partialReport || mode === "merged_recovered" || mode === "merged_exhaust_retry" || mode === "merged_uncertain_retry" || mode === "legacy_push_retry" ? "retry"
      : mode === "leader_failure" || mode === "global_failure" || mode === "merged_exhaust_user" ? "user" : mode,
      ...(mode === "leader_failure" || mode === "global_failure" ? { failLeaderGroup: "G", failLeaderTimes: 2 } : {}),
      ...(mode === "global_failure" ? { failGlobalMainTimes: 2 } : {}) };
    const f = await fixture(true, recoveryScenario);
    f.state.agents.idea.sessionPersistence = false;
    const activated = await f.runtime.activate({ projectId: id, groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G", workflowRevision: 1,
      outer: { nodeRunId: "node-G", inputSnapshotRef: "project:requirement", activatedByAgentId: "main" } });
    // Seed the original formally accepted plan and stopped report, as persisted
    // by the older runtime. No success, owner release or Git repair is seeded.
    const planInvocation = "inv_" + "1".repeat(32);
    const claim = f.database.claimScopedLeaderTurn({ projectId: id, groupRunId: "run-G", agentId: "main",
      invocationId: planInvocation, runtimePath: path.join(f.storage.projectDir(id), "runtime", planInvocation) })!;
    const manager = { projectId: id, groupRunId: "run-G", agentId: "main", invocationId: planInvocation,
      coordinatorEpoch: claim.coordinatorEpoch };
    f.database.markScopedLeaderOpened(manager);
    const envelope = (action: ControlAction, callId: string): ControlActionEnvelope => ({ projectId: id, agent: "main",
      invocationId: planInvocation, stateVersion: claim.coordinatorEpoch, callId, capabilityHash: "a".repeat(64),
      receivedAt: repository.observedAt, action });
    f.database.recordScopedLeaderTaskCompletion({ ...manager, envelope: envelope({ tool: "finish_task" }, "original-plan-finish") });
    f.database.acceptScopedLeaderAction({ ...manager, residentStopConfirmed: true, envelope: envelope({ tool: "assign_group_tasks",
      groupRunId: "run-G", coordinatorEpoch: claim.coordinatorEpoch,
      tasks: ["G_idea", "G_execution"].map((taskId) => ({ taskId, assignment: `Original assignment for ${taskId}` })) }, "original-plan") });
    f.database.releaseScopedLeaderTurn({ ...manager, residentStopConfirmed: true });
    const arrival = activated.arrivals.find((candidate) => candidate.agentId === "idea")!;
    const execution = f.database.claimScopedAgentArrival({ projectId: id, arrivalRequestId: arrival.requestId, agentId: "idea",
      executionId: "original-idea-execution", worktreePath: path.join(f.storage.projectDir(id), "git-worktrees/agents/idea") })!.execution;
    const originalInvocation = "inv_" + "2".repeat(32);
    const identity = { projectId: id, executionId: execution.id, ownershipEpoch: 1, invocationId: originalInvocation };
    const authority = { ...execution, purpose: "delivery" as const };
    f.database.beginScopedAgentTurn({ ...identity, runtimePath: path.join(f.storage.projectDir(id), "runtime", originalInvocation), baseCommit: "b".repeat(40) });
    await f.git.sessionBegin(authority, 1, { kind: "delivery", base: { kind: "commit", commitSha: "b".repeat(40) } });
    f.database.markScopedAgentTurnOpened({ ...identity, nativeProcessOpened: true });
    const note = path.join(execution.worktreePath, "original-uncommitted-note.txt");
    await writeFile(note, "Original business work must be retained");
    f.state.agentSessionIds = { ...f.state.agentSessionIds, idea: "session-idea" };
    const originalPushId = legacyPush ? `scoped-checkpoint-${execution.id}-epoch-1` : "original-push";
    if (legacyPush) f.git.failPushJournalOnceAgent = "idea";
    const originalPush = f.git.checkpointAndPush({ repository, execution: authority, ownershipEpoch: 1,
      operationId: originalPushId, reason: "Original Agent work" });
    if (legacyPush) await expect(originalPush).rejects.toThrow("Native stopped after push before its result");
    else await originalPush;
    let originalHead = f.database.recordedGitOperation(id, originalPushId)!.expectedHead!;
    let pull = await f.git.createPullRequest({ repository, execution: authority, ownershipEpoch: 1,
      operationId: "original-create", expectedHead: originalHead, base: "groups/run-G",
      title: "Original Agent PR", body: "Original business result" });
    if (multiplePrs) {
      const earlier = await f.git.mergePullRequest({ repository, execution: authority, ownershipEpoch: 1,
        operationId: "earlier-business-merge", providerNumber: pull.providerNumber,
        expectedHead: originalHead, expectedBase: pull.base });
      f.git.pulls.set("earlier-business-delivery", earlier);
      originalHead = "c".repeat(40);
      f.git.checkpointHeads.set(execution.id, originalHead);
      await f.git.checkpointAndPush({ repository, execution: authority, ownershipEpoch: 1,
        operationId: "original-memory-push", reason: "Original Agent delivered its separate committed work record" });
      pull = await f.git.createPullRequest({ repository, execution: authority, ownershipEpoch: 1,
        operationId: "original-memory-create", expectedHead: originalHead, base: "groups/run-G",
        title: "Original work record", body: "Same execution, independently delivered current head" });
      const discover = f.git.observePullRequestForExecution.getMockImplementation()!;
      f.git.observePullRequestForExecution.mockImplementation(async request => {
        if (request.execution.id === execution.id) throw new Error("Multiple pull requests claim the same execution branch; recovery is ambiguous");
        return discover(request);
      });
    }
    const pendingId = legacyPush ? originalPushId : `agent-git-${execution.id}-epoch-1-original-merge-merge`;
    if (mergedOriginal) {
      if (unsettledMerged) f.git.failMergeJournalOnceAgent = "idea";
      const originalMerge = f.git.mergePullRequest({ repository, execution: authority, ownershipEpoch: 1, operationId: pendingId,
        providerNumber: pull.providerNumber, expectedHead: pull.headSha!, expectedBase: pull.base });
      if (unsettledMerged) await expect(originalMerge).rejects.toThrow("Native stopped after provider merge before its result");
      else await originalMerge;
      if (observeReportOnly) {
        const merged = f.database.recordedGitOperation(id, pendingId)!.remoteFact as unknown as typeof pull;
        await f.git.reconcileMergedPullRequest({ repository, execution: authority, ownershipEpoch: 1,
          operationId: mergedPullSynchronizationOperationId(execution.id, 1, originalHead, pull.base, merged.mergeCommitSha!),
          providerNumber: pull.providerNumber, expectedHead: originalHead, expectedBase: pull.base,
          expectedMergeCommitSha: merged.mergeCommitSha! });
      }
      if (!missingCompletion) f.database.recordScopedAgentTaskCompletion({ ...identity, agentId: "idea", callId: "original-task-finish", requestedAt: repository.observedAt });
    } else if (!legacyPush) await prepareOperation(f.database.operationsForProject(id, true), { id: pendingId, kind: "pull.merge",
      ownerExecutionId: execution.id, ownershipEpoch: 1, expectedHead: pull.headSha, expectedBase: pull.base },
      { head: pull.headSha, base: pull.base });
    if (mode === "interrupted_no_report_uncertain") await transitionOperation(f.database.operationsForProject(id, true),
      f.database.recordedGitOperation(id, pendingId)!, { status: "uncertain" });
    if (rejectedPrIdentity) {
      const observe = f.git.observePullRequest.getMockImplementation()!;
      f.git.observePullRequest.mockImplementation(async request => {
        const fact = await observe(request);
        if (request.ownerExecutionId !== execution.id) return fact;
        if (mode.endsWith("_missing")) return undefined;
        if (mode.endsWith("_changed") && fact) return { ...fact, headSha: "d".repeat(40) };
        if (mode.endsWith("_wrong_merge") && fact) return { ...fact, mergeCommitSha: "d".repeat(40) };
        return fact;
      });
      if (mode.endsWith("_unbound_head")) f.git.localRefs.set(execution.executionBranch, "d".repeat(40));
      if (mode.endsWith("_ambiguous_head")) await f.git.createPullRequest({ repository, execution: authority, ownershipEpoch: 1,
        operationId: "ambiguous-same-head-create", expectedHead: originalHead, base: "groups/run-G",
        title: "Unresolved second PR for this same head", body: "No unique current-head PR can be inferred" });
    }
    if (exhaustedPartialReport) {
      for (let attempt = 1; attempt <= 2; attempt++) expect(f.database.reserveScopedAgentMechanismRepair({
        ...identity, missing: ["github_get_pr", "github_merge_pr"] })).toBe(attempt);
    }
    const retainedBusinessOutput = "Original actual business output: " + "scientific-result-".repeat(3000);
    if (missingReportOriginal) {
      f.database.recordScopedAgentNativeOutput({ ...identity, agentId: "idea", inputId: "original-business", output: retainedBusinessOutput });
      f.database.recordScopedAgentNativeOutput({ ...identity, agentId: "idea", inputId: "original-mechanism-supplement", output: "Original supplement completed its exact Git observation" });
      f.database.stopScopedAgentTurn({ ...identity, residentStopConfirmed: true });
    }
    else f.database.recordScopedAgentReport({ ...identity, output: "Original stopped business result", selectedWeakTarget: "finish",
      ...(!partialReport ? { reportHeadSha: pull.headSha } : {}), residentTurnCompleted: true, residentStopConfirmed: true });
    const originalOperation = f.database.recordedGitOperation(id, pendingId)!;
    expect(originalOperation.status).toBe(unsettledMerged || legacyPush || mode === "interrupted_no_report_uncertain" ? "uncertain" : mergedOriginal ? "finalized" : "prepared");
    expect(f.database.recordedGitOperation("foreign-project", pendingId)).toBeUndefined();
    if (mode === "interrupted_no_report_stop_resume") {
      f.database.appendEvent({ projectId: id, requestId: "original-resumable-stop",
        type: "project.cancellation.requested", payload: { resumable: true, reason: "user_cancelled" } });
      await f.runtime.reconcileResidents();
      f.database.retainScopedProjectCancellation(id);
      expect(() => f.database.resumeProjectCancellation({ projectId: id })).toThrow(/before native stop is confirmed/);
      f.database.confirmProjectCancellationStopped(id);
      f.database.resumeProjectCancellation({ projectId: id });
      expect(f.database.scopedExecution(id, execution.id)).toMatchObject({ status: "running", ownershipEpoch: 1 });
      expect(f.database.scopedAgentTurn(id, execution.id, 1)).toMatchObject({ invocationId: originalInvocation, status: "stopped" });
      expect(f.database.recordedGitOperation(id, pendingId)).toEqual(originalOperation);
      expect(f.opened).toEqual([]);
    }
    if (interruptedOriginal) {
      await f.runtime.reconcileResidents();
      expect(f.database.scopedExecution(id, execution.id)).toMatchObject({ status: "running", ownershipEpoch: 1 });
      expect(f.database.recordedGitOperation(id, pendingId)).toEqual(originalOperation);
      expect(f.database.scopedGroupIssues(id)).toEqual([expect.objectContaining({ kind: "mechanism", interruptedOperationIds: [pendingId] })]);
    } else if (missingReportOriginal || partialReport || mode === "merged_recovered") f.database.failScopedAgentArrival({ ...identity, arrivalRequestId: arrival.requestId,
      reason: "Old report already merged but its local synchronization was interrupted", residentStopConfirmed: true });
    if (observedOldHead) f.git.localRefs.set(execution.executionBranch, "d".repeat(40));
    let retainedHead: string | undefined;
    let retainedRetry: ControlActionEnvelope | undefined;
    let retainedRepairInvocation: string | undefined;
    if (retainedBoundPush) {
      f.database.recordScopedRecoveryPull({ ...identity, pull: { ...pull, status: "merged", mergeCommitSha:
        (f.database.recordedGitOperation(id, pendingId)!.remoteFact as unknown as typeof pull).mergeCommitSha } });
      const managerInput = { projectId: id, groupRunId: "run-G", agentId: "main", invocationId: "inv_" + "3".repeat(32),
        runtimePath: path.join(f.storage.projectDir(id), "runtime", "inv_" + "3".repeat(32)) };
      const retainedManager = { ...managerInput, coordinatorEpoch: f.database.claimScopedLeaderTurn(managerInput)!.coordinatorEpoch };
      f.database.markScopedLeaderOpened(retainedManager);
      const retainedEnvelope = (action: ControlAction, callId: string): ControlActionEnvelope => ({ projectId: id, agent: "main",
        invocationId: retainedManager.invocationId, stateVersion: retainedManager.coordinatorEpoch, callId,
        capabilityHash: "a".repeat(64), receivedAt: repository.observedAt, action });
      f.database.recordScopedLeaderTaskCompletion({ ...retainedManager, envelope: retainedEnvelope({ tool: "finish_task" }, "retained-manager-finish") });
      retainedRetry = retainedEnvelope({ tool: "coordinate_group_task", groupRunId: "run-G", coordinatorEpoch: retainedManager.coordinatorEpoch,
        arrivalRequestId: arrival.requestId, operation: "retry", rationale: "Original Agent must continue its partial report" }, "retained-report-retry");
      f.database.acceptScopedLeaderAction({ ...retainedManager, envelope: retainedRetry, residentStopConfirmed: true });
      f.database.releaseScopedLeaderTurn({ ...retainedManager, residentStopConfirmed: true });
      expect(f.database.resumeScopedMergedDelivery(id, execution.id, 1, retainedRetry)).toBe(true);
      retainedRepairInvocation = "inv_" + "4".repeat(32);
      const repair = { ...identity, invocationId: retainedRepairInvocation,
        runtimePath: path.join(f.storage.projectDir(id), "runtime", retainedRepairInvocation) };
      f.database.beginScopedAgentReportRepair({ ...repair, originalReportInvocationId: originalInvocation,
        missing: ["github_get_pr"], coordination: { envelope: retainedRetry } });
      f.database.markScopedAgentTurnOpened({ ...repair, nativeProcessOpened: true });
      retainedHead = createHash("sha1").update(originalHead + "retained-memory").digest("hex");
      f.git.checkpointHeads.set(execution.id, retainedHead);
      await f.git.checkpointAndPush({ repository, execution: authority, ownershipEpoch: 1,
        operationId: "retained-agent-supplement-push", reason: "Original Agent pushed its actual supplemental work record" });
      f.database.stopScopedAgentTurn({ ...repair, residentStopConfirmed: true });
      f.database.recordScopedAgentReportRepairResult({ ...repair, originalReportInvocationId: originalInvocation,
        output: "Original Agent queried A after pushing B", residentStopConfirmed: true });
      f.database.bindScopedAgentReportHead({ ...identity, headSha: retainedHead });
      if (failurePersistenceGap) {
        expect(f.database.scopedExecution(id, execution.id)?.status).toBe("integrating");
        expect(f.database.scopedRecoveryCandidates(id, "run-G")).toEqual([]);
      } else {
        f.database.failScopedAgentArrival({ ...repair, arrivalRequestId: arrival.requestId,
          reason: "Supplement B still lacks its own PR delivery", residentStopConfirmed: true });
        expect(f.database.scopedRecoveryCandidates(id, "run-G")[0]?.pendingOperation).toBeUndefined();
        expect(() => f.database.resumeScopedMergedDelivery(id, execution.id, 1)).toThrow(/same stopped epoch/);
        expect(f.database.resumeScopedMergedDelivery(id, execution.id, 1, retainedRetry)).toBe(false);
      }
      expect(f.database.scopedAgentDeliveryMissingActions(id, execution.id, 1, retainedHead))
        .toEqual(["github_get_pr or github_create_pr", "github_merge_pr"]);
    }
    const originalReport = f.database.scopedAgentReport(id, execution.id, 1)!;
    const knownRecoveryPr = mode.startsWith("merged_partial_retained_push_known_pr");
    if (knownRecoveryPr) {
      const discover = f.git.observePullRequestForExecution.getMockImplementation()!;
      f.git.observePullRequestForExecution.mockImplementation(async request => {
        if (request.execution.id === execution.id) throw new Error("Multiple pull requests claim the same execution branch; recovery is ambiguous");
        return discover(request);
      });
      const observe = f.git.observePullRequest.getMockImplementation()!;
      f.git.observePullRequest.mockImplementation(async request => {
        const fact = await observe(request);
        if (request.ownerExecutionId !== execution.id) return fact;
        if (mode.endsWith("_missing")) return undefined;
        if (mode.endsWith("_changed") && fact) return { ...fact, headSha: "d".repeat(40) };
        return fact;
      });
    }
    if (partialReport) {
      const resume = f.database.resumeScopedMergedDelivery.bind(f.database);
      vi.spyOn(f.database, "resumeScopedMergedDelivery").mockImplementation((projectId, executionId, epoch, coordination) => {
        if (executionId === execution.id && f.database.scopedExecution(id, executionId)?.status === "failed" &&
          !f.database.scopedAgentReport(id, executionId, epoch)?.headSha) {
          expect(() => resume(projectId, executionId, epoch)).toThrow(/same stopped epoch/);
          expect(() => resume(projectId, executionId, epoch + 1, coordination)).toThrow(/same stopped epoch/);
          expect(() => resume(projectId, executionId, epoch, { ...coordination!,
            action: { ...coordination!.action, rationale: "Forged retry instructions" } as ControlAction })).toThrow(/exact released manager retry/);
          expect(f.database.scopedAgentReport(id, executionId, epoch)).toEqual(originalReport);
        }
        const result = resume(projectId, executionId, epoch, coordination);
        if (executionId === execution.id && !f.database.scopedAgentReport(id, executionId, epoch)?.headSha)
          expect(f.database.scopedAgentReport(id, executionId, epoch)).toEqual(originalReport);
        return result;
      });
    }
    const open = f.launcher.open.getMockImplementation()!;
    let repairs = 0;
    let supplementalHead: string | undefined;
    let incompleteSubmissions = 0;
    let supplementalRepairPrompt: string | undefined;
    const supplementalWorkRecordInboxes: string[] = [];
    let lateCapability: Awaited<ReturnType<NonNullable<CollaborationResidentOpenInput["controlAuthorityFactory"]>>> | undefined;
    let lateInvocation: string | undefined;
    let lateGuardChecks = 0;
    const publish = f.dependencies.publish;
    f.dependencies.publish = async () => {
      await publish();
      const native = f.database.scopedAgentTurn(id, execution.id, 1);
      if (!lateCapability || native?.status !== "stopped" || f.database.scopedExecution(id, execution.id)?.status !== "running") return;
      const stale: ControlActionEnvelope = { projectId: id, agent: "idea", invocationId: lateInvocation!,
        callId: "late-git-after-native-stop", stateVersion: lateCapability.control.stateVersion,
        capabilityHash: lateCapability.control.capabilityHash, receivedAt: repository.observedAt,
        action: { tool: "github_get_pr", providerNumber: pull.providerNumber } };
      await expect(lateCapability.revalidate(stale, [])).rejects.toThrow(/exact live native/);
      lateGuardChecks += 1;
    };
    f.launcher.open.mockImplementation(async (input) => {
      const handle = await open(input);
      if (input.controlScope?.role !== "scoped-agent" || input.controlScope.executionId !== execution.id) return handle;
      expect(input.request.resumeThreadId).toBe("session-idea");
      expect(input.request.sessionContinuity).toBe("strict");
      expect(input.request.workspacePath).toBe(execution.worktreePath);
      expect(input.request.invocationId).not.toBe(originalInvocation);
      expect(await readFile(note, "utf8")).toBe("Original business work must be retained");
      const inbox = await readFile(input.request.inboxPath, "utf8");
      expect(missingReportOriginal ? inbox : contextSourceText(input.request)).toContain(missingReportOriginal ? "stopped without a saved report" : originalReport.output);
      if (!missingReportOriginal && mergedOriginal && !missingCompletion) {
        expect(contextSourceText(input.request)).toContain("finish_task is already accepted for this logical task and ownership epoch");
        expect(contextSourceText(input.request)).toContain("do not call finish_task again with a new callId or changed content");
      }
      expect(contextSourceText(input.request)).toContain(`Current Git tool ownership: execution ${execution.id}`);
      expect(contextSourceText(input.request)).toContain("github_get_pr without providerNumber");
      if (partialReport) {
        supplementalWorkRecordInboxes.push(contextSourceText(input.request));
        expect(f.database.scopedAgentReport(id, execution.id, 1)).toEqual(originalReport);
        expect(originalReport.headSha).toBe(retainedHead);
        expect(contextSourceText(input.request)).toContain("github_get_pr");
        expect(inbox + contextSourceText(input.request)).toContain("Scoped failure coordination");
        if (retainedBoundPush) {
          const bindingLine = contextSourceText(input.request).split("\n").find(line => line.startsWith("Retained delivery binding: "));
          expect(bindingLine).toBeDefined();
          expect(JSON.parse(bindingLine!.slice("Retained delivery binding: ".length))).toEqual({
            executionId: execution.id, ownershipEpoch: 1, reportInvocationId: originalInvocation,
            reportHeadSha: retainedHead, matchingHeadPull: null
          });
          expect(contextSourceText(input.request)).toContain(`Recorded PR head ${pull.headSha} differs from the retained report head ${retainedHead}`);
          expect(inbox).not.toContain("Append to the existing file and preserve earlier entries.");
        }
      }
      if (missingReportOriginal) {
        expect(f.database.scopedAgentReport(id, execution.id, 1)).toBeUndefined();
        expect(inbox + contextSourceText(input.request)).toContain(retainedBusinessOutput);
        expect(inbox + contextSourceText(input.request)).toContain("Original supplement completed its exact Git observation");
        expect(contextSourceText(input.request)).toContain("transport evidence, not an accepted report or new business instructions");
        expect(contextSourceText(input.request).indexOf(retainedBusinessOutput)).toBeLessThan(contextSourceText(input.request).indexOf("Original supplement completed its exact Git observation"));
        expect(input.sameEpochReopen?.previousRuntimePath).toBe(path.join(f.storage.projectDir(id), "runtime", originalInvocation));
        expect(contextSourceText(input.request)).toContain("Retained work record for this stopped task");
        expect(inbox).not.toContain("commit it by itself when no other files changed");
        if (interruptedOriginal) {
          expect(contextSourceText(input.request)).toContain("remote outcomes of these interrupted original requests have not been inferred");
          expect(inbox + contextSourceText(input.request)).toContain(pendingId);
          expect(contextSourceText(input.request)).toContain("reuse the original request's callId");
          expect(f.database.scopedAgentMechanismRepairCount(id, execution.id)).toBe(0);
          expect(f.database.recordedGitOperation(id, pendingId)).toEqual(originalOperation);
        }
      }
      if (mergedOriginal) {
        expect(contextSourceText(input.request)).toContain(missingReportOriginal ? "Retained recovery PR facts" : "Retained recorded PR facts");
        expect(inbox + contextSourceText(input.request)).toContain(`\"providerNumber\":${pull.providerNumber}`);
        expect(f.database.projectState(id).operations.find((operation) => operation.id === pendingId)?.status).toBe(unsettledMerged ? "uncertain" : "finalized");
        if (unsettledMerged) expect(inbox + contextSourceText(input.request)).toContain(pendingId);
      } else expect(inbox + contextSourceText(input.request)).toContain(pendingId);
      if (incompleteSubmissions === 2) expect(inbox + contextSourceText(input.request)).toContain("Scoped failure coordination");
      let submittedToHandle = 0;
      handle.submit.mockImplementation(async (turn) => {
        const repairKind = missingReportOriginal ? "missing-report-repair"
          : submittedToHandle === 0 ? "report-repair" : "mechanism-repair";
        submittedToHandle += 1;
        if (!observeReportOnly) expect(turn.inputId).toBe(`scoped:${arrival.requestId}:epoch:1:${repairKind}:${retainedBoundPush ? 4 : exhaustedPartialReport ? 3 : mode === "merged_partial_pushed_repair" ? 1 : incompleteSubmissions + 1}`);
        const capability = await input.controlAuthorityFactory!({ request: input.request, turn });
        lateCapability = capability; lateInvocation = turn.invocationId;
        if (delayed && incompleteSubmissions < 2) {
          incompleteSubmissions += 1;
          return { handoff: "Original Agent cannot yet settle its provider operation", controlActions: [] };
        }
        const actions: ControlActionEnvelope[] = [];
        const call = async (action: ControlAction, callId: string) => {
          const receipt: ControlActionEnvelope = { projectId: id, agent: "idea", invocationId: turn.invocationId,
            callId, stateVersion: capability.control.stateVersion, capabilityHash: capability.control.capabilityHash,
            receivedAt: repository.observedAt, action };
          await capability.revalidate(receipt, actions); actions.push(receipt);
          return action.tool === "finish_task" ? undefined : capability.execute!(receipt);
        };
        if (legacyPush) {
          expect(f.database.recordedGitOperation(id, pendingId)).toEqual(originalOperation);
          expect(await call({ tool: "git_reconcile_push", operationId: pendingId }, "inspect-my-legacy-push"))
            .toMatchObject({ status: "confirmed", operation: { ...originalOperation, status: "finalized",
              remoteFact: { ref: execution.executionBranch, sha: originalHead } } });
          expect(f.database.recordedGitOperation(id, pendingId)).toMatchObject({ id: originalOperation.id,
            payloadHash: originalOperation.payloadHash, expectedHead: originalHead, status: "finalized" });
        }
        if (mode === "merged_partial_pushed_repair" && incompleteSubmissions > 0) supplementalRepairPrompt = turn.prompt;
        if (newSupplementPush && (mode !== "merged_partial_pushed_repair" || incompleteSubmissions === 0)) {
          f.git.checkpointHeads.set(execution.id, createHash("sha1").update(originalHead + "supplemental-memory").digest("hex"));
          const pushed = await call({ tool: "git_push", reason: "Agent commits its supplemental work record" }, "supplement-push") as
            Awaited<ReturnType<typeof f.git.checkpointAndPush>>;
          supplementalHead = pushed.checkpoint.commitSha;
          expect(supplementalHead).not.toBe(originalHead);
        }
        expect(await call({ tool: "github_get_pr", providerNumber: pull.providerNumber }, "inspect-original-pr"))
          .toMatchObject({ id: pull.id, headSha: pull.headSha, status: mergedOriginal ? "merged" : "open" });
        if (mode === "merged_partial_pushed_repair" && incompleteSubmissions === 0) {
          incompleteSubmissions += 1; repairs += 1;
          return { handoff: "Observed the old merged PR after pushing the supplemental record", controlActions: actions };
        }
        if (mode === "merged_partial_pushed_unpublished") {
          await expect(call({ tool: "github_merge_pr", providerNumber: pull.providerNumber }, "stale-original-merge"))
            .rejects.toThrow(/confirmed current head/);
          repairs += 1;
          recoveryScenario.recovery = "user";
          return { handoff: "Agent observed the old PR but has not delivered its supplemental commit", controlActions: actions };
        }
        const deliveryPull = mode === "merged_partial_pushed_delivered" || mode === "merged_partial_pushed_repair" || retainedBoundPush
          ? await call({ tool: "github_create_pr", base: "groups/run-G", title: "Supplemental record", body: "Agent chooses to deliver its new work record" }, "supplement-pr") as typeof pull
          : pull;
        if (!observeReportOnly) expect(await call({ tool: "github_merge_pr", providerNumber: deliveryPull.providerNumber, reason: "Verify my chosen delivery" },
          newSupplementPush || retainedBoundPush ? "supplement-merge" : "original-merge"))
          .toMatchObject({ id: deliveryPull.id, status: "merged" });
        if (!mergedOriginal || missingCompletion) await call({ tool: "finish_task", summary: "Original Agent verified its actual PR and finished", memory: "Retained actual business result" }, "repair-own-finish");
        repairs += 1;
        if (observeReportOnly) recoveryScenario.recovery = "user";
        return { handoff: "Original Agent's supplemental tool outcome", controlActions: actions };
      });
      return handle;
    });
    if (missingReportOriginal) {
      const first = await f.runtime.advance("run-G");
      if (rejectedPrIdentity) {
        expect(first.status).toBe("waiting");
        const failures = f.database.scopedManagementFailures(id).filter(failure => failure.executionId === execution.id);
        expect(failures).toHaveLength(4);
        expect(failures.every(failure => failure.reason.includes(mode.endsWith("_head")
          ? "recovery is ambiguous" : "Journaled recovery PR is missing or differs"))).toBe(true);
        expect(failures.filter(failure => !failure.globalMain).map(failure => failure.attempt)).toEqual([1, 2]);
        expect(failures.filter(failure => failure.globalMain).map(failure => failure.attempt)).toEqual([1, 2]);
        expect(f.state.userIntervention).toBeUndefined();
        expect(f.database.scopedAgentReport(id, execution.id, 1)).toBeUndefined();
        expect(f.database.scopedExecution(id, execution.id)).toMatchObject({ status: "failed", ownershipEpoch: 1 });
        expect(f.database.scopedAgentTurn(id, execution.id, 1)).toMatchObject({ invocationId: originalInvocation, status: "stopped" });
        expect(f.database.recordedGitOperation(id, pendingId)).toEqual(originalOperation);
        expect(f.database.scopedAgentTaskCompletion(id, execution.id, 1)?.invocationId).toBe(originalInvocation);
        expect(f.opened.filter(input => input.controlScope?.role === "scoped-agent" && input.controlScope.executionId === execution.id)).toEqual([]);
        expect(repairs).toBe(0);
        if (!mode.endsWith("_head")) expect(f.git.observePullRequestForExecution.mock.calls
          .filter(([request]) => request.execution.id === execution.id)).toEqual([]);
        return;
      }
      if (observedOldHead) {
        expect(first.status).not.toBe("completed");
        expect(f.database.scopedAgentReport(id, execution.id, 1)?.headSha).toBeUndefined();
        expect(f.database.scopedExecution(id, execution.id)).toMatchObject({ status: "failed", ownershipEpoch: 1 });
        expect(f.database.eventsAfter(id).filter(event => event.type === "scoped.agent.report_head_bound")).toEqual([]);
        return;
      }
      expect(first.issues.filter(issue => issue.kind === "failure"), JSON.stringify({ first,
        execution: f.database.scopedExecution(id, execution.id), native: f.database.scopedAgentTurn(id, execution.id, 1) })).toEqual([]);
    }
    if (knownRecoveryPr && mode !== "merged_partial_retained_push_known_pr") {
      expect((await advanceUntilTerminal(f)).status).toBe("waiting");
      const failures = f.database.scopedManagementFailures(id).filter(failure => failure.executionId === execution.id);
      expect(failures).toHaveLength(4);
      expect(failures.every(failure => failure.reason.includes("Retained recovery PR is missing or differs"))).toBe(true);
      expect(failures.filter(failure => !failure.globalMain).map(failure => failure.attempt)).toEqual([1, 2]);
      expect(failures.filter(failure => failure.globalMain).map(failure => failure.attempt)).toEqual([1, 2]);
      expect(f.state.userIntervention).toBeUndefined();
      expect(f.database.scopedExecution(id, execution.id)).toMatchObject({ status: "failed", ownershipEpoch: 1 });
      expect(f.database.scopedAgentReport(id, execution.id, 1)).toEqual(originalReport);
      expect(f.database.recordedGitOperation(id, pendingId)).toEqual(originalOperation);
      expect(f.database.scopedRecoveryPull(id, execution.id, 1)?.headSha).toBe(originalHead);
      expect(f.opened.filter(input => input.controlScope?.role === "scoped-agent" && input.controlScope.executionId === execution.id)).toEqual([]);
      expect(f.git.observePullRequestForExecution.mock.calls.filter(([request]) => request.execution.id === execution.id)).toEqual([]);
      expect(f.git.closePullRequest).not.toHaveBeenCalled();
      return;
    }
    const result = await advanceUntilTerminal(f);
    if (mode === "merged_partial_pushed_unpublished") {
      expect(result.status).not.toBe("completed");
      expect(repairs).toBe(1);
      expect(f.database.scopedAgentReport(id, execution.id, 1)).toEqual(originalReport);
      expect(f.database.scopedExecution(id, execution.id)).toMatchObject({ status: "failed", ownershipEpoch: 1 });
      expect(f.database.eventsAfter(id, 0, 10_000).filter(event => event.type === "scoped.agent.report_head_bound" &&
        event.payload.executionId === execution.id)).toEqual([]);
      expect(f.database.scopedAgentRecordedDeliveryPull(id, execution.id, 1, supplementalHead!)).toBeUndefined();
      expect(f.database.scopedAgentReportContinuation(id, execution.id, 1)).toBeUndefined();
      expect(f.database.scopedAgentMechanismRepairCount(id, execution.id)).toBe(2);
      expect(f.state.userIntervention).toMatchObject({ status: "pending", requestedBy: "main" });
      expect(f.git.log.filter(entry => entry.head === execution.executionBranch && entry.kind === "push")).toHaveLength(2);
      expect(f.git.log.filter(entry => entry.head === execution.executionBranch && entry.kind === "create")).toHaveLength(1);
      expect(f.git.log.filter(entry => entry.head === execution.executionBranch && entry.kind === "merge")).toHaveLength(1);
      expect(f.database.recordedGitOperation(id, pendingId)).toEqual(originalOperation);
      expect(f.git.closePullRequest).not.toHaveBeenCalled();
      return;
    }
    if (mode === "global_failure") {
      expect(result.status).toBe("waiting");
      expect(f.state).toMatchObject({ status: "retrying", phase: "collaboration:technical-failure" });
      expect(f.state.userIntervention).toBeUndefined();
      const failures = f.database.scopedManagementFailures(id).filter((entry) => entry.executionId === execution.id);
      expect(failures.filter((entry) => !entry.globalMain).map((entry) => entry.attempt)).toEqual([1, 2]);
      expect(failures.filter((entry) => entry.globalMain).map((entry) => entry.attempt)).toEqual([1, 2]);
      expect(failures[0].failureKey).not.toBe(failures[2].failureKey);
      expect(f.database.scopedAgentMechanismRepairCount(id, execution.id)).toBe(2);
      expect(f.database.scopedExecution(id, execution.id)).toMatchObject({ status: "integrating", ownershipEpoch: 1 });
      expect(f.database.projectState(id).operations.find((operation) => operation.id === pendingId)?.status).toBe("prepared");
      expect(f.git.closePullRequest).not.toHaveBeenCalled();
      expect(repairs).toBe(0);
      return;
    }
    if (mode === "user" || mode === "leader_failure" || mode === "merged_exhaust_user") {
      expect(result.status).toBe("waiting");
      expect(f.state.userIntervention, JSON.stringify({ failures: f.database.scopedManagementFailures(id),
        localCandidates: f.database.scopedRecoveryCandidates(id, "run-G"), globalCandidates: f.database.scopedRecoveryCandidates(id, "run-G", true),
        runtimeIssues: result.issues, managers: f.opened.filter((input) => input.controlScope?.role !== "scoped-agent")
          .map((input) => ({ invocationId: input.request.invocationId, role: input.controlScope?.role })) }))
        .toMatchObject({ status: "pending", requestedBy: "main" });
      expect(f.state.status).toBe("retrying");
      expect(f.database.scopedAgentMechanismRepairCount(id, execution.id)).toBe(2);
      expect(f.database.scopedExecution(id, execution.id)).toMatchObject({ status: "integrating", ownershipEpoch: 1 });
      expect(f.database.scopedAgentReport(id, execution.id, 1)).toEqual(originalReport);
      expect(f.database.projectState(id).operations.find((operation) => operation.id === pendingId)?.status).toBe(mergedOriginal ? "finalized" : "prepared");
      const decisions = f.database.eventsAfter(id, 0, 10_000).filter((event) => event.type === "scoped.leader.action.accepted" &&
        ["coordinate_group_task", "request_user"].includes(event.payload.envelope?.action?.tool));
      if (mode === "user" || mode === "merged_exhaust_user") {
        expect(decisions.map((event) => event.payload.envelope.action.tool)).toEqual(["coordinate_group_task", "request_user"]);
        expect(decisions[0].payload.envelope.action.operation).toBe("escalate");
      } else {
        expect(decisions.map((event) => event.payload.envelope.action.tool)).toEqual(["request_user"]);
        const failures = f.database.scopedManagementFailures(id).filter((entry) => entry.executionId === execution.id);
        expect(failures).toHaveLength(2);
        expect(failures.map((entry) => entry.attempt)).toEqual([1, 2]);
        expect(failures.every((entry) => entry.incidentId && !entry.globalMain)).toBe(true);
        expect(f.database.eventsAfter(id, 0, 10_000).filter((event) => event.type === "scoped.management.escalated")).toHaveLength(1);
      }
      expect(decisions.at(-1)?.payload.globalMain).toBe(true);
      expect(f.opened.filter((input) => input.controlScope?.role === "scoped-agent" && input.controlScope.executionId === execution.id)).toHaveLength(1);
      expect(f.git.closePullRequest).not.toHaveBeenCalled();
      expect(repairs).toBe(0);
      return;
    }
    expect(result.status, JSON.stringify({ issues: result.issues, current: f.database.scopedExecution(id, execution.id),
      native: f.database.scopedAgentTurn(id, execution.id, 1), budget: f.database.scopedAgentMechanismRepairCount(id, execution.id),
      ownFinish: f.database.scopedAgentTaskCompletion(id, execution.id, 1), repairs,
      missingGit: f.database.scopedAgentDeliveryMissingActions(id, execution.id, 1, pull.headSha!),
      faults: f.database.scopedGroupIssues(id) })).toBe("completed");
    if (partialReport) {
      expect(supplementalWorkRecordInboxes.length).toBeGreaterThan(0);
      for (const inbox of supplementalWorkRecordInboxes) {
        if (retainedBoundPush) {
          expect(inbox).toContain(`Retained work-record path: agent-memory/idea/Memory.md; report head ${retainedHead}`);
          expect(inbox).toContain("A bound report head does not prove this file was committed");
          expect(inbox).not.toContain("Retained committed work record:");
        } else {
          expect(inbox).toContain("Original-task work record: agent-memory/idea/Memory.md");
          expect(inbox).toContain("Do not append another record solely because this is a new physical invocation");
          expect(inbox).not.toContain("Record this turn's verified facts");
        }
      }
    }
    if (mode === "merged_partial_retained_push_known_pr") {
      expect(f.git.observePullRequestForExecution.mock.calls.filter(([request]) => request.execution.id === execution.id)).toEqual([]);
      expect(f.git.observePullRequest).toHaveBeenCalledWith(expect.objectContaining({ providerNumber: pull.providerNumber,
        ownerExecutionId: execution.id }));
    }
    expect(repairs).toBe(mode === "merged_partial_pushed_repair" ? 2 : 1);
    if (multiplePrs) {
      expect(f.git.observePullRequestForExecution.mock.calls.filter(([request]) => request.execution.id === execution.id)).toEqual([]);
      expect(f.git.observePullRequest).toHaveBeenCalledWith(expect.objectContaining({
        providerNumber: pull.providerNumber, ownerExecutionId: execution.id }));
      expect(f.database.scopedRecoveryPull(id, execution.id, 1)).toMatchObject({
        providerNumber: pull.providerNumber, headSha: originalHead });
    }
    if (mode === "merged_partial_pushed_repair") expect(supplementalRepairPrompt).toContain("github_get_pr or github_create_pr");
    expect(lateGuardChecks).toBeGreaterThan(0);
    if (missingReportOriginal) {
      expect(f.database.scopedAgentReport(id, execution.id, 1)).toMatchObject({ output: "Original Agent's supplemental tool outcome", headSha: originalHead });
      expect(f.database.eventsAfter(id, 0, 10_000).filter(event => event.type === "scoped.agent.missing_report_repair.requested")).toHaveLength(1);
      if (observeReportOnly) expect(f.database.scopedAgentMechanismRepairCount(id, execution.id)).toBe(2);
    } else expect(f.database.scopedAgentReport(id, execution.id, 1)).toEqual(partialReport
      ? { ...originalReport, headSha: supplementalHead ?? retainedHead ?? originalHead, headRecordedAt: new Date(1_000_000).toISOString() } : originalReport);
    expect(f.database.scopedAgentTaskCompleted(id, execution.id, 1,
      missingCompletion ? f.database.scopedAgentReport(id, execution.id, 1)!.invocationId : originalInvocation)).toBe(true);
    expect(f.database.scopedExecution(id, execution.id)).toMatchObject({ status: "completed", ownershipEpoch: 1 });
    if (partialReport) {
      expect(f.database.scopedAgentReportContinuation(id, execution.id, 1)).toBeUndefined();
      expect(f.database.scopedAgentMechanismRepairCount(id, execution.id)).toBe(exhaustedPartialReport ? 2 : mode === "merged_partial_pushed_repair" ? 1 : 0);
      expect(f.database.eventsAfter(id, 0, 10_000).filter(event => event.type === "scoped.agent.coordinated_repair.requested")).toHaveLength(retainedBoundPush ? 2 : 1);
    }
    expect(f.database.projectState(id).operations.find((operation) => operation.id === pendingId)?.status).toBe("finalized");
    expect(f.opened.filter((input) => input.controlScope?.role === "scoped-agent" && input.controlScope.executionId === execution.id)).toHaveLength(delayed ? 2 : 1);
    if (mergedOriginal) {
      expect(f.git.log.filter((entry) => entry.head === execution.executionBranch && entry.kind === "merge")).toHaveLength(newSupplementPush || retainedBoundPush || multiplePrs ? 2 : 1);
      expect(f.git.log.filter((entry) => entry.head === execution.executionBranch && entry.kind === "sync")).toHaveLength(1);
      if (!missingCompletion) expect(f.database.scopedAgentTaskCompletion(id, execution.id, 1)?.invocationId).toBe(originalInvocation);
    }
    if (mode === "retry" || mode === "merged_exhaust_retry" || mode === "legacy_push_retry") {
      expect(f.database.scopedAgentMechanismRepairCount(id, execution.id)).toBe(2);
      const decisions = f.database.eventsAfter(id, 0, 10_000).filter((event) => event.type === "scoped.agent.coordinated_repair.requested");
      expect(decisions).toHaveLength(1);
      expect(decisions[0].payload).toMatchObject({ ownershipEpoch: 1, attempt: 3,
        coordination: { envelope: { action: { operation: "retry", rationale: "Scoped failure coordination" } } } });
    }
    expect(f.git.log.filter((entry) => entry.head === execution.executionBranch && entry.kind === "push")).toHaveLength(newSupplementPush || retainedBoundPush || multiplePrs ? 2 : 1);
    expect(f.git.log.filter((entry) => entry.head === execution.executionBranch && entry.kind === "create")).toHaveLength(newSupplementPush || retainedBoundPush || multiplePrs ? 2 : 1);
    if (retainedBoundPush) {
      expect(f.database.scopedAgentReport(id, execution.id, 1)).toEqual(originalReport);
      expect(f.database.eventByRequestId(id, `scoped-leader-action:${retainedRetry!.invocationId}:${retainedRetry!.callId}`)).toBeDefined();
      expect(f.database.eventByRequestId(id, `scoped-report-repair-failure:${execution.id}:1:${retainedRepairInvocation}`)?.payload.reason)
        .toBe(failurePersistenceGap ? "Original Agent still lacks explicit Git delivery facts: github_get_pr or github_create_pr, github_merge_pr"
          : "Supplement B still lacks its own PR delivery");
      expect(f.database.recordedGitOperation(id, pendingId)).toEqual(originalOperation);
      expect(f.database.scopedRecoveryPull(id, execution.id, 1)?.headSha).toBe(originalHead);
      expect(f.database.scopedAgentRecordedDeliveryPull(id, execution.id, 1, originalHead)?.status).toBe("merged");
      expect(f.database.scopedAgentRecordedDeliveryPull(id, execution.id, 1, retainedHead!)?.status).toBe("merged");
      expect(f.database.eventsAfter(id, 0, 10_000).filter(event => event.type === "scoped.agent.failed" &&
        event.payload.executionId === execution.id)).toHaveLength(2);
    }
    expect(f.git.closePullRequest).not.toHaveBeenCalled();
    expect(f.database.eventsAfter(id, 0).filter((event) => event.type === "scoped.leader.action.accepted" &&
      event.payload.envelope?.action?.tool === "route_to_agent")).toHaveLength(missingReportOriginal ? 2 : 1);
  });

  it.each(["unchanged", "remote_missing", "remote_sha", "remote_repository", "checkpoint_execution", "checkpoint_epoch", "checkpoint_branch"] as const)(
    "returns the real scoped git_push %s result to the original Agent and rejects its stale PR head", async (mode) => {
      const f = await fixture();
      const open = f.launcher.open.getMockImplementation()!;
      const push = f.git.checkpointAndPush.getMockImplementation()!;
      let target: string | undefined;
      let armed = false;
      let previous: Awaited<ReturnType<typeof push>>;
      f.git.checkpointAndPush.mockImplementation(async (request) => {
        if (armed && request.execution.id === target) {
          armed = false;
          return {
            checkpoint: { ...previous.checkpoint,
              changed: mode !== "unchanged",
              ...(mode === "checkpoint_execution" ? { executionId: "foreign-execution" } : {}),
              ...(mode === "checkpoint_epoch" ? { ownershipEpoch: request.ownershipEpoch + 1 } : {}),
              ...(mode === "checkpoint_branch" ? { branch: "foreign-branch" } : {}) },
            ...(mode === "remote_missing" ? {} : { remote: { ...previous.remote!,
              ...(mode === "remote_sha" ? { sha: "f".repeat(40) } : {}),
              ...(mode === "remote_repository" ? { repository: "foreign-repository" } : {}) } })
          };
        }
        return push(request);
      });
      let observations = 0;
      const failures: string[] = [];
      f.launcher.open.mockImplementation(async (input) => {
        const handle = await open(input);
        const scope = input.controlScope;
        if (target || scope?.role !== "scoped-agent" || scope.agentId !== "idea" || scope.executionId.startsWith("group-final-")) return handle;
        target = scope.executionId;
        const submit = handle.submit.getMockImplementation()!;
        handle.submit.mockImplementation(async (turn) => {
          try {
            const authority = await input.controlAuthorityFactory!({ request: input.request, turn });
            const accepted: ControlActionEnvelope[] = [];
            const call = async (action: ControlAction) => {
              const envelope: ControlActionEnvelope = { projectId: id, agent: input.request.agent,
                invocationId: turn.invocationId, callId: `push-observation-${turn.invocationId}-${accepted.length}`,
                stateVersion: authority.control.stateVersion, capabilityHash: authority.control.capabilityHash,
                receivedAt: new Date().toISOString(), action };
              await authority.revalidate(envelope, accepted); accepted.push(envelope);
              return authority.execute!(envelope);
            };
            previous = await call({ tool: "git_push", reason: "Agent requests its first checkpoint" }) as typeof previous;
            expect(previous.remote).toMatchObject({ status: "present", sha: previous.checkpoint.commitSha });
            armed = true;
            const result = await call({ tool: "git_push", reason: "Agent checks the actual next provider result" });
            expect(result).toMatchObject({ status: mode === "unchanged" ? "not_committed" : "push_unconfirmed",
              checkpoint: { changed: mode !== "unchanged" } });
            const group = f.database.scopedGroupRun(id, scope.groupRunId)!;
            await expect(call({ tool: "github_create_pr", base: group.groupBranch, title: "Stale head", body: "This must be rejected" }))
              .rejects.toThrow(/confirmed pushed head/);
            expect(f.git.pulls.has(scope.executionId)).toBe(false);
            expect(f.database.scopedExecution(id, scope.executionId)).toMatchObject({ status: "running", ownershipEpoch: scope.ownershipEpoch });
            expect(f.closed).not.toContain(input.request.invocationId);
            observations += 1;
            // The same simulated Agent chooses to retry through its existing
            // native handle; no scheduler push, release or business retry runs.
            handle.submit.mockImplementation(submit);
            return submit(turn);
          } catch (error) {
            failures.push(error instanceof Error ? error.message : String(error));
            throw error;
          }
        });
        return handle;
      });
      await f.runtime.activate({ projectId: id, groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G", workflowRevision: 1,
        outer: { nodeRunId: "node-G", inputSnapshotRef: "project:requirement", activatedByAgentId: "main" } });
      expect((await advanceUntilTerminal(f)).status).toBe("completed");
      expect(observations, failures.join("\n")).toBe(1);
      expect(f.opened.filter((input) => input.controlScope?.role === "scoped-agent" && input.controlScope.executionId === target)).toHaveLength(1);
      expect(f.database.scopedAgentTaskCompleted(id, target!, 1)).toBe(true);
      expect(f.git.closePullRequest).not.toHaveBeenCalled();
    }
  );

  it("allows live member and canonical Agents to close their own draft PR without system completion", async () => {
    const f = await fixture();
    const open = f.launcher.open.getMockImplementation()!;
    const closedByAgent: string[] = [];
    f.launcher.open.mockImplementation(async (input) => {
      const handle = await open(input);
      const scope = input.controlScope;
      if (scope?.role !== "scoped-agent") return handle;
      handle.submit.mockImplementation(async (turn) => {
        const final = scope.executionId.startsWith("group-final-");
        const group = f.database.scopedGroupRun(id, scope.groupRunId)!;
        const owner = final ? f.database.scopedFinalIntegration(id, scope.groupRunId)!
          : f.database.scopedExecution(id, scope.executionId)!;
        const branch = owner.executionBranch;
        const store = f.database.operationsForProject(id, true);
        const assertion = { projectId: id, executionId: scope.executionId, ownershipEpoch: scope.ownershipEpoch,
          expectedBranch: branch, operation: "provider.close_terminal" as const };
        await store.assertExecutionOwnership(assertion);
        await expect(Promise.resolve().then(() => store.assertExecutionOwnership({ ...assertion, ownershipEpoch: scope.ownershipEpoch + 1 }))).rejects.toThrow();
        const authority = await input.controlAuthorityFactory!({ request: input.request, turn });
        const actions: ControlActionEnvelope[] = [];
        const call = async (action: ControlAction): Promise<any> => {
          const envelope: ControlActionEnvelope = { projectId: id, agent: input.request.agent, invocationId: turn.invocationId,
            callId: `agent-close-${turn.invocationId}-${actions.length}`, stateVersion: authority.control.stateVersion,
            capabilityHash: authority.control.capabilityHash, receivedAt: new Date().toISOString(), action };
          await authority.revalidate(envelope, actions);
          actions.push(envelope);
          return action.tool === "finish_task" ? undefined : authority.execute!(envelope);
        };
        if (!final) await call({ tool: "git_push" });
        const base = final ? f.database.scopedFinalIntegration(id, scope.groupRunId)!.integrationTarget : group.groupBranch;
        const draft = await call({ tool: "github_create_pr", base, title: "Agent draft", body: "I decide to replace this draft" });
        expect(f.git.closePullRequest).toHaveBeenCalledTimes(closedByAgent.length);
        const closed = await call({ tool: "github_close_pr", providerNumber: draft.providerNumber, reason: "I choose a new PR for this head" });
        expect(closed).toMatchObject({ status: "closed", ownerExecutionId: scope.executionId, head: branch, base });
        closedByAgent.push(scope.executionId);
        expect(f.database.scopedGroupRun(id, scope.groupRunId)?.status).toBe(final ? "integrating" : "running");
        const replacement = await call({ tool: "github_create_pr", base, title: "Agent replacement", body: "My current intended delivery" });
        expect(replacement.providerNumber).not.toBe(draft.providerNumber);
        await call({ tool: "github_merge_pr", providerNumber: replacement.providerNumber });
        await call({ tool: "finish_task", summary: "I finished the replacement delivery" });
        return { handoff: "Agent replaced and integrated its PR", controlActions: actions };
      });
      return handle;
    });
    await f.runtime.activate({ projectId: id, groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G", workflowRevision: 1,
      outer: { nodeRunId: "node-G", inputSnapshotRef: "project:requirement", activatedByAgentId: "main" } });
    expect((await advanceUntilTerminal(f)).status).toBe("completed");
    expect(closedByAgent).toHaveLength(4);
    expect(closedByAgent.some((owner) => owner.startsWith("group-final-"))).toBe(true);
    expect(f.git.closePullRequest).toHaveBeenCalledTimes(closedByAgent.length);
    expect(f.git.log.filter((item) => item.kind === "close")).toHaveLength(closedByAgent.length);
  });

  it.each(["retained", "foreign_repository"] as const)("lets the original scoped Agent verify its %s PR after a no-change result without pushing or merging again", async (mode) => {
    const f = await fixture(); f.state.agents.idea.sessionPersistence = false;
    const open = f.launcher.open.getMockImplementation()!;
    const push = f.git.checkpointAndPush.getMockImplementation()!;
    const observe = f.git.observePullRequest.getMockImplementation()!;
    let target: string | undefined;
    let observed = false;
    const failures: string[] = [];
    f.launcher.open.mockImplementation(async (input) => {
      const handle = await open(input);
      const scope = input.controlScope;
      if (target || scope?.role !== "scoped-agent" || scope.agentId !== "idea" || scope.executionId.startsWith("group-final-")) return handle;
      target = scope.executionId;
      handle.submit.mockImplementation(async (turn) => {
        try {
          await input.request.onDurableSessionStarted!({ schemaVersion: 1, harnessId: f.state.agents.idea.harness!,
            adapterVersion: "test", nativeId: "session-idea", generation: 1, durable: true, createdAt: repository.observedAt }, "session-idea");
          const authority = await input.controlAuthorityFactory!({ request: input.request, turn });
          const actions: ControlActionEnvelope[] = [];
          const call = async (action: ControlAction): Promise<any> => {
            const envelope: ControlActionEnvelope = { projectId: id, agent: "idea", invocationId: turn.invocationId,
              callId: `agent-retained-pr-${turn.invocationId}-${actions.length}`, stateVersion: authority.control.stateVersion,
              capabilityHash: authority.control.capabilityHash, receivedAt: new Date().toISOString(), action };
            await authority.revalidate(envelope, actions); actions.push(envelope);
            return action.tool === "finish_task" ? undefined : authority.execute!(envelope);
          };
          const first = await call({ tool: "git_push" });
          const group = f.database.scopedGroupRun(id, scope.groupRunId)!;
          const pull = await call({ tool: "github_create_pr", base: group.groupBranch, title: "Original Agent delivery", body: "Keep this original PR" });
          await call({ tool: "github_merge_pr", providerNumber: pull.providerNumber });
          f.git.checkpointAndPush.mockImplementation(async (request) => request.execution.id === target
            ? { ...first, checkpoint: { ...first.checkpoint, changed: false } } : push(request));
          expect(await call({ tool: "git_push" })).toMatchObject({ status: "not_committed" });
          if (mode === "foreign_repository") {
            f.git.observePullRequest.mockImplementation(async (request) => {
              const fact = await observe(request);
              return request.ownerExecutionId === target && fact ? { ...fact, repository: "foreign-repository" } : fact;
            });
            await expect(call({ tool: "github_get_pr", providerNumber: pull.providerNumber })).rejects.toThrow(/does not match/);
            f.git.observePullRequest.mockImplementation(observe);
          }
          // The Agent chooses to inspect its already merged PR instead of
          // inventing a new commit/PR after the truthful no-change result.
          expect(await call({ tool: "github_get_pr", providerNumber: pull.providerNumber })).toMatchObject({
            status: "merged", ownerExecutionId: scope.executionId, headSha: first.checkpoint.commitSha });
          expect(await call({ tool: "github_merge_pr", providerNumber: pull.providerNumber })).toMatchObject({
            status: "merged", localSynchronization: { expectedSourceHead: first.checkpoint.commitSha } });
          expect(f.git.mergePullRequest.mock.calls.filter(([request]) => request.execution.id === target)).toHaveLength(1);
          expect(f.git.log.filter((item) => item.kind === "push" && item.head === pull.head)).toHaveLength(1);
          expect(f.git.log.filter((item) => item.kind === "create" && item.head === pull.head)).toHaveLength(1);
          await call({ tool: "finish_task", summary: "My original PR is merged and synchronized" });
          observed = true;
          return { handoff: "Original Agent verified its original PR", controlActions: actions };
        } catch (error) {
          failures.push(error instanceof Error ? error.message : String(error)); throw error;
        }
      });
      return handle;
    });
    await f.runtime.activate({ projectId: id, groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G", workflowRevision: 1,
      outer: { nodeRunId: "node-G", inputSnapshotRef: "project:requirement", activatedByAgentId: "main" } });
    const terminal = await advanceUntilTerminal(f).catch(error => {
      throw new Error([...failures, error instanceof Error ? error.message : String(error)].join("\n"), { cause: error });
    });
    expect(terminal.status, failures.join("\n")).toBe("completed");
    expect(observed, failures.join("\n")).toBe(true);
    expect(f.database.scopedAgentReport(id, target!, 1)?.headSha).toMatch(/^[0-9a-f]{40}$/);
    expect(f.opened.filter((input) => input.controlScope?.role === "scoped-agent" && input.controlScope.executionId === target)).toHaveLength(1);
    expect(f.git.closePullRequest).not.toHaveBeenCalled();
  });

  it.each(["missing_finish", "memory_failure", "missing_decision"] as const)(
    "repairs scoped management %s in the original handle without consuming a staged plan early", async (mode) => {
      const f = await fixture(); f.state.agents.main.sessionPersistence = false;
      const open = f.launcher.open.getMockImplementation()!;
      const saveMemory = f.storage.saveRoleMemorySnapshot.bind(f.storage);
      let saves = 0;
      vi.spyOn(f.storage, "saveRoleMemorySnapshot").mockImplementation(async (...args) => {
        if (args[2] === "Own manager memory") {
          saves += 1;
          if (mode === "memory_failure" && saves === 1) throw new Error("Agent memory save failed");
        }
        return saveMemory(...args);
      });
      let invocationId: string | undefined; let turns = 0;
      const stagingPaths: string[] = [];
      f.launcher.open.mockImplementation(async (input) => {
        const handle = await open(input);
        if (input.controlScope?.role !== "scoped-leader" || invocationId) return handle;
        invocationId = input.request.invocationId;
        expect(input.request.sessionContinuity).toBe("strict");
        const scope = input.controlScope;
        handle.submit.mockImplementation(async (turn) => {
          turns += 1;
          const nativeId = "session-main";
          await input.request.onDurableSessionStarted!({ schemaVersion: 1, harnessId: f.state.agents.main.harness!,
            adapterVersion: "test", nativeId, generation: 1, durable: true, createdAt: repository.observedAt }, nativeId);
          if (turns > 1) {
            expect(turn.invocationId).toBe(invocationId);
            expect(turn.prompt).toContain("retained session");
            expect((await input.turnRequestFactory!({ request: input.request, turn })).request.resumeThreadId).toBe(nativeId);
          }
          const authority = await input.controlAuthorityFactory!({ request: input.request, turn });
          stagingPaths.push(authority.control.stagingPath);
          const actions: ControlActionEnvelope[] = [];
          const call = async (action: ControlAction) => {
            const envelope: ControlActionEnvelope = { projectId: id, agent: "main", invocationId: turn.invocationId,
              callId: `manager-${turns}-${actions.length}`, stateVersion: authority.control.stateVersion,
              capabilityHash: authority.control.capabilityHash, receivedAt: new Date().toISOString(), action };
            await authority.revalidate(envelope, actions); actions.push(envelope);
          };
          const plan: ControlAction = { tool: "assign_group_tasks", groupRunId: scope.groupRunId,
            coordinatorEpoch: scope.coordinatorEpoch, tasks: scope.memberNodeIds.map((taskId) => ({ taskId, assignment: `Original instruction for ${taskId}` })) };
          const finish: ControlAction = { tool: "finish_task", summary: "Own manager round", memory: "Own manager memory" };
          expect(f.database.scopedGroupPlan(id, scope.groupRunId)).toBeUndefined();
          expect(f.database.projectState(id).scopedExecutions).toEqual([]);
          if (turns === 1) {
            if (mode === "missing_decision") await call(finish);
            else {
              await call(plan);
              if (mode === "memory_failure") {
                await expect(call(finish)).rejects.toThrow("Agent memory save failed");
                expect(f.database.scopedLeaderTaskCompleted(id, scope.groupRunId, "main", invocationId!, scope.coordinatorEpoch)).toBe(false);
              }
            }
          } else {
            if (mode === "missing_decision") {
              expect(turn.prompt).toContain("formal plan control action"); await call(plan);
            } else {
              expect(turn.prompt).toContain("finish_task");
              await expect(call({ ...plan, tasks: [{ taskId: scope.memberNodeIds[0], assignment: "Replacement plan" }] }))
                .rejects.toThrow("staged decision cannot be replaced");
              await call(finish); await call(finish);
            }
          }
          return { handoff: "Original manager returned", controlActions: actions };
        });
        return handle;
      });
      await f.runtime.activate({ projectId: id, groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G", workflowRevision: 1,
        outer: { nodeRunId: "node-G", inputSnapshotRef: "project:requirement", activatedByAgentId: "main" } });
      expect((await advanceUntilTerminal(f)).status).toBe("completed");
      expect(turns).toBe(2); expect(new Set(stagingPaths).size).toBe(2);
      expect(f.opened.filter((entry) => entry.request.invocationId === invocationId)).toHaveLength(1);
      expect(f.database.scopedGroupPlan(id, "run-G")?.tasks[0].assignment).toContain("Original instruction");
      const events = f.database.eventsAfter(id, 0, 10_000).filter((event) => event.invocationId === invocationId);
      expect(events.filter((event) => event.type === "scoped.leader.task.completed")).toHaveLength(1);
      expect(events.filter((event) => event.type === "scoped.management.mechanism_repair.requested")).toHaveLength(1);
      expect(events.filter((event) => event.type === "scoped.leader.action.accepted")).toHaveLength(1);
      expect(saves).toBe(mode === "memory_failure" ? 2 : 1);
      const receipt = f.state.taskCompletions![`management:run-G:${invocationId}`];
      expect(await readFile(receipt.memoryPath!, "utf8")).toContain("Own manager memory");
    });

  it.each(["finish_task", "formal plan"])("bounds scoped management missing %s and keeps its original plan queued", async (missing) => {
    const f = await fixture(); f.state.agents.main.sessionPersistence = false;
    const open = f.launcher.open.getMockImplementation()!;
    let invocationId: string | undefined; let turns = 0;
    f.launcher.open.mockImplementation(async (input) => {
      const handle = await open(input);
      if (input.controlScope?.role !== "scoped-leader" || invocationId) return handle;
      invocationId = input.request.invocationId; const scope = input.controlScope;
      handle.submit.mockImplementation(async (turn) => {
        turns += 1; expect(turn.invocationId).toBe(invocationId);
        const authority = await input.controlAuthorityFactory!({ request: input.request, turn });
        if (turns > 1 || missing === "formal plan") return { handoff: "Missing required formal actions" };
        const envelope: ControlActionEnvelope = { projectId: id, agent: "main", invocationId: turn.invocationId,
          callId: "held-plan", stateVersion: authority.control.stateVersion, capabilityHash: authority.control.capabilityHash,
          receivedAt: new Date().toISOString(), action: { tool: "assign_group_tasks", groupRunId: scope.groupRunId,
            coordinatorEpoch: scope.coordinatorEpoch, tasks: scope.memberNodeIds.map((taskId) => ({ taskId, assignment: "Retain this original plan" })) } };
        await authority.revalidate(envelope, []);
        return { handoff: "Did not finish the management round", controlActions: [envelope] };
      });
      return handle;
    });
    await f.runtime.activate({ projectId: id, groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G", workflowRevision: 1,
      outer: { nodeRunId: "node-G", inputSnapshotRef: "project:requirement", activatedByAgentId: "main" } });
    await f.runtime.advance("run-G");
    expect(turns).toBe(3); expect(f.closed).toContain(invocationId);
    expect(f.database.scopedGroupPlan(id, "run-G")).toBeUndefined();
    expect(f.database.projectState(id).scopedExecutions).toEqual([]);
    const events = f.database.eventsAfter(id, 0, 10_000).filter((event) => event.invocationId === invocationId);
    expect(events.filter((event) => event.type === "scoped.management.mechanism_repair.requested")).toHaveLength(2);
    expect(events.filter((event) => event.type === "scoped.leader.action.accepted")).toHaveLength(0);
    expect(events.some((event) => event.type === "scoped.management.round.completed")).toBe(false);
    const repairScopeKey = events.find((event) => event.type === "scoped.management.mechanism_repair.requested")!.payload.repairScopeKey as string;
    expect(f.database.scopedManagementRepairCount(id, repairScopeKey)).toBe(2);
  });

  it.each((["plan", "recover"] as const).flatMap(purpose => (["repair", "exhaust"] as const).map(outcome => ({ purpose, outcome }))))(
    "renews only an explicitly resumed stopped scoped $purpose and still bounds $outcome", async ({ purpose, outcome }) => {
    const f = await fixture(false, { failIdeaOnce: purpose === "recover", recovery: outcome === "exhaust" ? "user" : "retry" });
    const open = f.launcher.open.getMockImplementation()!;
    const plans: CollaborationResidentOpenInput[] = [];
    let resumed = false; let turns = 0;
    f.launcher.open.mockImplementation(async input => {
      const handle = await open(input);
      if (input.controlScope?.role !== "scoped-leader" || input.request.workflowContext?.purpose !== purpose) return handle;
      plans.push(input);
      const submit = handle.submit.getMockImplementation()!;
      handle.submit.mockImplementation(async turn => {
        turns += 1;
        if (resumed && outcome === "repair") return submit(turn);
        await input.request.onDurableSessionStarted!({ schemaVersion: 1, harnessId: "codex", adapterVersion: "test",
          nativeId: "session-main", generation: 1, durable: true, createdAt: repository.observedAt }, "session-main");
        return { handoff: "Original manager has not supplied the required mechanism actions" };
      });
      return handle;
    });
    await f.runtime.activate({ projectId: id, groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G", workflowRevision: 1,
      outer: { nodeRunId: "node-G", inputSnapshotRef: "project:requirement", activatedByAgentId: "main" } });
    const paused = new AbortController();
    const recordFailure = f.database.recordScopedManagementFailure.bind(f.database);
    const recording = vi.spyOn(f.database, "recordScopedManagementFailure").mockImplementation(input => {
      const failures = recordFailure(input); paused.abort(); return failures;
    });
    await expect(new ScopedProjectRuntime({ ...f.dependencies, signal: paused.signal }).advance("run-G")).rejects.toThrow();
    recording.mockRestore();
    expect(turns).toBe(3);
    const original = f.database.scopedGroupRun(id, "run-G");
    const originalExecutions = f.database.projectState(id).scopedExecutions;
    const originalPlan = f.database.scopedGroupPlan(id, "run-G");
    const originalActions = f.database.scopedAcceptedLeaderActions(id, "run-G");
    const repairScopeKey = f.database.eventsAfter(id, 0, 10_000).find(event => event.type === "scoped.management.mechanism_repair.requested")!.payload.repairScopeKey as string;
    // Rehydrating a runtime preserves the exhausted automatic budget.
    await new ScopedProjectRuntime(f.dependencies).reconcileResidents();
    expect(turns).toBe(3);
    expect(f.database.scopedManagementRepairCount(id, repairScopeKey)).toBe(2);
    const history = f.database.scopedManagementFailures(id);
    const projection = f.database.projectState(id);
    expect(() => f.database.resumeScopedManagementRepairs({ projectId: id, nodeRunId: "foreign-root",
      expectedRevision: projection.stateRevision })).toThrow();
    expect(() => f.database.resumeScopedManagementRepairs({ projectId: id, nodeRunId: "node-G",
      expectedRevision: projection.stateRevision + 1 })).toThrow();
    const claim = f.database.claimScopedLeaderTurn({ projectId: id, groupRunId: "run-G", agentId: "main",
      invocationId: "still-live-manager", allowStoppedRepairFaults: true })!;
    expect(claim).toBeTruthy();
    expect(() => f.database.resumeScopedManagementRepairs({ projectId: id, nodeRunId: "node-G",
      expectedRevision: f.database.projectState(id).stateRevision })).toThrow(/stopped manager/);
    f.database.releaseScopedLeaderTurn({ projectId: id, groupRunId: "run-G", agentId: "main",
      invocationId: "still-live-manager", residentStopConfirmed: true });
    f.database.resumeScopedManagementRepairs({ projectId: id, nodeRunId: "node-G",
      expectedRevision: f.database.projectState(id).stateRevision });
    expect(f.database.scopedManagementRepairCount(id, repairScopeKey)).toBe(0);
    expect(f.database.scopedGroupRun(id, "run-G")).toEqual(original);
    expect(f.database.scopedManagementFailures(id)).toEqual(history);
    expect(f.database.projectState(id).scopedExecutions).toEqual(originalExecutions);
    expect(f.database.scopedAcceptedLeaderActions(id, "run-G")).toEqual(originalActions);
    // A duplicate Resume before new exhaustion cannot replenish anything.
    f.database.resumeScopedManagementRepairs({ projectId: id, nodeRunId: "node-G",
      expectedRevision: f.database.projectState(id).stateRevision });
    expect(f.database.eventsAfter(id, 0, 10_000).filter(event => event.type === "scoped.management.recovery.resumed")).toHaveLength(1);
    resumed = true;
    if (outcome === "repair") {
      expect((await advanceUntilTerminal(f)).status).toBe("completed");
      const manager = plans.at(-1)!;
      expect(manager.request.resumeThreadId).toBe("session-main");
      expect(manager.request.workspacePath).toBe(plans[0].request.workspacePath);
      expect(f.database.scopedGroupPlan(id, "run-G")).toBeTruthy();
    } else {
      await f.runtime.advance("run-G");
      expect(turns).toBe(6);
      expect(f.database.scopedManagementRepairCount(id, repairScopeKey)).toBe(2);
      await f.runtime.advance("run-G");
      expect(turns).toBe(6);
      expect(f.database.scopedGroupPlan(id, "run-G")).toEqual(originalPlan);
      expect(f.database.scopedManagementFailures(id).slice(history.length).map(failure => failure.attempt)).toEqual([1, 2]);
      expect(f.database.scopedManagementFailures(id).slice(0, history.length)).toEqual(history);
      expect(f.database.eventsAfter(id, 0, 10_000).filter(event => event.type === "scoped.management.escalated")).toHaveLength(1);
    }
  });

  it.each(["plan", "recover"] as const)("retains bounded scoped %s recovery across repeated explicit Resume cycles", async purpose => {
    const f = await fixture(false, { failIdeaOnce: purpose === "recover", recovery: "retry" });
    const open = f.launcher.open.getMockImplementation()!;
    const managers: CollaborationResidentOpenInput[] = [];
    let complete = false;
    let turns = 0;
    f.launcher.open.mockImplementation(async input => {
      const handle = await open(input);
      if (input.controlScope?.role !== "scoped-leader" ||
        input.request.workflowContext?.purpose !== purpose) return handle;
      managers.push(input);
      const submit = handle.submit.getMockImplementation()!;
      handle.submit.mockImplementation(async turn => {
        turns += 1;
        if (complete) return submit(turn);
        await input.request.onDurableSessionStarted!({ schemaVersion: 1, harnessId: "codex", adapterVersion: "test",
          nativeId: "session-main", generation: 1, durable: true, createdAt: repository.observedAt }, "session-main");
        return { handoff: "Manager returned without its required formal actions" };
      });
      return handle;
    });
    await f.runtime.activate({ projectId: id, groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G", workflowRevision: 1,
      outer: { nodeRunId: "node-G", inputSnapshotRef: "project:requirement", activatedByAgentId: "main" } });
    let previousFailures = f.database.scopedManagementFailures(id);
    for (let cycle = 0; cycle < 2; cycle += 1) {
      const stopped = new AbortController();
      const record = f.database.recordScopedManagementFailure.bind(f.database);
      const recording = vi.spyOn(f.database, "recordScopedManagementFailure").mockImplementation(input => {
        const failures = record(input); stopped.abort(); return failures;
      });
      try {
        await expect(new ScopedProjectRuntime({ ...f.dependencies, signal: stopped.signal }).advance("run-G")).rejects.toThrow();
      } finally { recording.mockRestore(); }
      expect(turns).toBe((cycle + 1) * 3);
      const history = f.database.scopedManagementFailures(id);
      expect(history.slice(0, previousFailures.length)).toEqual(previousFailures);
      previousFailures = history;
      const retained = f.database.projectState(id);
      const actions = f.database.scopedAcceptedLeaderActions(id, "run-G");
      const repairScopeKey = f.database.eventsAfter(id, 0, 10_000)
        .find(event => event.type === "scoped.management.mechanism_repair.requested")!.payload.repairScopeKey as string;
      expect(f.database.scopedManagementRepairCount(id, repairScopeKey)).toBe(2);
      f.database.resumeScopedManagementRepairs({ projectId: id, nodeRunId: "node-G", expectedRevision: retained.stateRevision });
      expect(f.database.scopedManagementRepairCount(id, repairScopeKey)).toBe(0);
      expect(f.database.projectState(id).scopedExecutions).toEqual(retained.scopedExecutions);
      expect(f.database.scopedManagementFailures(id)).toEqual(history);
      expect(f.database.scopedAcceptedLeaderActions(id, "run-G")).toEqual(actions);
      f.database.resumeScopedManagementRepairs({ projectId: id, nodeRunId: "node-G",
        expectedRevision: f.database.projectState(id).stateRevision });
      expect(f.database.eventsAfter(id, 0, 10_000).filter(event => event.type === "scoped.management.recovery.resumed"))
        .toHaveLength(cycle + 1);
    }
    const grants = f.database.eventsAfter(id, 0, 10_000).filter(event => event.type === "scoped.management.recovery.resumed");
    expect(new Set(grants.map(event => event.requestId)).size).toBe(2);
    complete = true;
    expect((await advanceUntilTerminal(f)).status).toBe("completed");
    expect(turns).toBe(7);
    expect(managers.at(-1)!.request.resumeThreadId).toBe("session-main");
    expect(managers.at(-1)!.request.workspacePath).toBe(managers[0].request.workspacePath);
    expect(f.database.scopedManagementFailures(id).slice(0, previousFailures.length)).toEqual(previousFailures);
  });

  it("transports pending project input only to GLOBAL Main through its ordinary turn", async () => {
    const f = await fixture(false, { nested: true, rootLeader: "review", failIdeaOnce: true, recovery: "user" });
    const message = `Clarify the original result contract. ${"Retain the original task. ".repeat(200)} End of original user input.`;
    f.state.userInputs.push({ id: "input-original-clarification", status: "pending", createdAt: repository.observedAt,
      message, mode: "wait", targetMainInvocation: 1 });
    await f.storage.saveState(f.state);
    await f.runtime.activate({ projectId: id, groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G", workflowRevision: 1,
      outer: { nodeRunId: "node-G", inputSnapshotRef: "project:requirement", activatedByAgentId: "main" } });
    await advanceUntilTerminal(f);
    const main = f.opened.find(entry => entry.controlScope?.role === "scoped-main")!;
    const mainTurn = f.submitted.find(turn => turn.invocationId === main.request.invocationId)!;
    expect(mainTurn.prompt).toContain(message);
    expect(mainTurn.inbox).toContain(message);
    expect(f.submitted.filter(turn => turn.invocationId !== main.request.invocationId)
      .some(turn => turn.prompt.includes(message))).toBe(false);
    // Prepared input and a successful model return are not native reception.
    expect(f.state.userInputs[0].status).toBe("pending");
  });

  it.each([false, true])("records only exact native reception and recovers its durable input receipt (file publication lost=%s)", async lostPublication => {
    const f = await fixture(false, { nested: true, rootLeader: "review", failIdeaOnce: true, recovery: "user" });
    const message = "Preserve the original checker; clarify only the conflicting Agent instructions.";
    f.state.userInputs.push({ id: "input-exact-native", status: "pending", createdAt: repository.observedAt,
      message, mode: "wait", targetMainInvocation: 1 });
    const open = f.launcher.open.getMockImplementation()!;
    let receivedInvocation: string | undefined;
    f.launcher.open.mockImplementation(async input => {
      const handle = await open(input);
      if (input.controlScope?.role !== "scoped-main") return handle;
      const submit = handle.submit.getMockImplementation()!;
      handle.submit.mockImplementation(async turn => {
        if (receivedInvocation) {
          expect(turn.prompt).not.toContain(message);
          expect(f.state.userInputs[0].status).toBe("delivered");
          return submit(turn);
        }
        const session = { schemaVersion: 1 as const, harnessId: f.state.agents.main.harness!, adapterVersion: "test",
          nativeId: "session-main", generation: 1, durable: true, createdAt: repository.observedAt };
        const event = { kind: "user.message", invocationId: turn.invocationId, harnessId: session.harnessId,
          eventId: "native-main-user", sourceType: "item.completed", message: turn.prompt };
        const observe = input.request.onNativeUserInput!;
        await observe(event, session); // There is no trusted native binding yet.
        expect(f.state.userInputs[0].status).toBe("pending");
        f.database.recordAgentNativeSessionBinding({ projectId: id, agentId: "main", invocationId: turn.invocationId,
          runtimePath: input.executionRuntimePath, worktreePath: input.request.workspacePath,
          executionContext: input.request.executionContext!, session });
        await observe(event);
        await observe({ ...event, invocationId: "another-invocation" }, session);
        await observe({ ...event, harnessId: "wrong-harness" }, session);
        await observe(event, { ...session, generation: 2 });
        await observe({ ...event, message: message }, session); // Missing the complete queued-input binding.
        expect(f.state.userInputs[0].status).toBe("pending");
        await observe(event, session);
        await observe({ ...event, eventId: "native-main-duplicate" }, session);
        receivedInvocation = turn.invocationId;
        expect(f.state.userInputs[0]).toMatchObject({ status: "delivered", deliveredInvocationId: receivedInvocation });
        expect(f.state.mainInvocationSeq).toBe(1);
        if (lostPublication) {
          // SQLite reception committed, but the published file was lost.
          f.state.userInputs[0] = { ...f.state.userInputs[0], status: "pending", deliveredAt: undefined, deliveredInvocationId: undefined };
          f.state.mainInvocationSeq = 0;
          throw new Error("Controlled channel stop after durable native reception");
        }
        return submit(turn);
      });
      return handle;
    });
    await f.runtime.activate({ projectId: id, groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G", workflowRevision: 1,
      outer: { nodeRunId: "node-G", inputSnapshotRef: "project:requirement", activatedByAgentId: "main" } });
    // The first GLOBAL Main failure is preserved; a later ordinary advance
    // restores the same input receipt rather than pretending another delivery.
    for (let attempt = 0; attempt < 12 && !f.state.userIntervention; attempt += 1) {
      try { await f.runtime.advance("run-G"); }
      catch (error) { expect(lostPublication && String(error).includes("Controlled channel stop")).toBe(true); }
    }
    expect(f.state.userIntervention?.status).toBe("pending");
    expect(f.state.userInputs[0]).toMatchObject({ status: "delivered", deliveredInvocationId: receivedInvocation });
    expect(f.state.mainInvocationSeq).toBe(1);
    expect(f.database.eventsAfter(id, 0, 10_000).filter(event => event.type === "user.input.delivered")).toHaveLength(1);
    expect((JSON.parse(await readFile(path.join(f.storage.projectDir(id), "state.json"), "utf8")) as ProjectState)
      .userInputs[0]).toMatchObject({ status: "delivered", deliveredInvocationId: receivedInvocation });
  });

  it("lets authorized global Main finish its own recovery turn when the root Leader is another Agent", async () => {
    const f = await fixture(false, { nested: true, rootLeader: "review", failIdeaOnce: true, recovery: "user" });
    await f.runtime.activate({ projectId: id, groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G", workflowRevision: 1,
      outer: { nodeRunId: "node-G", inputSnapshotRef: "project:requirement", activatedByAgentId: "main" } });
    await advanceUntilTerminal(f);
    const manager = f.opened.find((entry) => entry.controlScope?.role === "scoped-main")!;
    expect(manager.request.agent).toBe("main");
    expect(f.database.scopedGroupRun(id, "run-G")?.leaderAgentId).toBe("review");
    const turn = f.database.scopedLeaderTurns(id).find((entry) => entry.invocationId === manager.request.invocationId)!;
    expect(f.database.scopedLeaderTaskCompleted(id, "run-G", "main", turn.invocationId, turn.coordinatorEpoch)).toBe(true);
    expect(f.database.scopedLeaderTaskCompleted(id, "run-G", "review", turn.invocationId, turn.coordinatorEpoch)).toBe(false);
    expect(f.state.userIntervention?.status).toBe("pending");
    expect(f.database.scopedAcceptedLeaderActions(id, "run-G").some((entry) => entry.globalMain && entry.envelope.action.tool === "request_user")).toBe(true);
  });

  it("renews Global Main without reversing the stopped Leaders' accepted escalations", async () => {
    const f = await fixture(false, { nested: true, failIdeaOnce: true, recovery: "user" });
    const open = f.launcher.open.getMockImplementation()!;
    let resumed = false; let globalTurns = 0;
    f.launcher.open.mockImplementation(async input => {
      const handle = await open(input);
      if (input.controlScope?.role !== "scoped-main") return handle;
      const submit = handle.submit.getMockImplementation()!;
      handle.submit.mockImplementation(async turn => {
        globalTurns += 1;
        return resumed ? submit(turn) : { handoff: "Global Main omitted the required control tools" };
      });
      return handle;
    });
    await f.runtime.activate({ projectId: id, groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G", workflowRevision: 1,
      outer: { nodeRunId: "node-G", inputSnapshotRef: "project:requirement", activatedByAgentId: "main" } });
    const paused = new AbortController();
    const record = f.database.recordScopedManagementFailure.bind(f.database);
    const recording = vi.spyOn(f.database, "recordScopedManagementFailure").mockImplementation(input => {
      const result = record(input); if (input.globalMain) paused.abort(); return result;
    });
    await expect(new ScopedProjectRuntime({ ...f.dependencies, signal: paused.signal }).advance("run-G")).rejects.toThrow();
    recording.mockRestore();
    expect(globalTurns).toBe(3);
    const groups = f.database.projectState(id).scopedGroupRuns!;
    const actions = groups.map(group => f.database.scopedAcceptedLeaderActions(id, group.id));
    expect(actions.flat().filter(receipt => receipt.envelope.action.tool === "coordinate_group_task")).toHaveLength(3);
    const candidate = f.database.scopedRecoveryCandidates(id, "run-G", true)[0]!;
    expect(candidate).toBeTruthy();
    f.database.resumeScopedManagementRepairs({ projectId: id, nodeRunId: "node-G",
      expectedRevision: f.database.projectState(id).stateRevision });
    expect(groups.map(group => f.database.scopedAcceptedLeaderActions(id, group.id))).toEqual(actions);
    expect(f.database.scopedRecoveryCandidates(id, "run-G", true)).toEqual([candidate]);
    const grants = f.database.eventsAfter(id, 0, 10_000).filter(event => event.type === "scoped.management.recovery.resumed");
    expect(grants).toHaveLength(1);
    expect(grants[0].payload.globalMain).toBe(true);
    resumed = true;
    await advanceUntilTerminal(f);
    expect(globalTurns).toBe(4);
    expect(f.state.userIntervention?.status).toBe("pending");
    expect(f.database.scopedExecution(id, candidate.executionId!)?.ownershipEpoch).toBe(candidate.ownershipEpoch);
    expect(f.database.scopedAcceptedLeaderActions(id, "run-G").filter(receipt => receipt.globalMain).at(-1)?.envelope.action.tool).toBe("request_user");
  });

  it("escalates a stopped child Leader planning failure and retries its original management session, without fabricating Worker tasks", async () => {
    const f = await fixture(false, { nested: true, failPlanGroup: "J", recovery: "retry" });
    await f.runtime.activate({ projectId: id, groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G", workflowRevision: 1,
      outer: { nodeRunId: "node-G", inputSnapshotRef: "project:requirement", activatedByAgentId: "main" } });
    expect((await advanceUntilTerminal(f)).status).toBe("completed");
    expect(f.database.scopedGroupIssues(id)).toEqual([]);
    const decisions = f.opened.filter((entry) => entry.controlScope?.role === "scoped-leader" && entry.controlScope.failedArrivalRequestIds.length);
    expect(decisions.map((entry) => f.database.scopedGroupRun(id, entry.controlScope!.groupRunId)?.groupId)).toEqual(["J"]);
    expect(f.opened.filter((entry) => entry.controlScope?.role === "scoped-agent" && !entry.controlScope.executionId.startsWith("group-final-"))).toHaveLength(2);
    expect(f.database.projectState(id).tasks).toEqual([]);
  });

  it("binds repeated Leader channel failures to the retained task, then escalates once", async () => {
    const f = await fixture(false, { nested: true, failIdeaOnce: true, recovery: "retry", failLeaderGroup: "J", failLeaderTimes: 2 });
    await f.runtime.activate({ projectId: id, groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G", workflowRevision: 1,
      outer: { nodeRunId: "node-G", inputSnapshotRef: "project:requirement", activatedByAgentId: "main" } });
    expect((await advanceUntilTerminal(f)).status).toBe("completed");
    const failures = f.database.scopedManagementFailures(id).filter((entry) => entry.purpose === "recover");
    expect(failures.filter((entry) => entry.globalMain)).toHaveLength(0);
    expect(failures.map((entry) => entry.attempt)).toEqual([1, 2]);
    expect(failures.every((entry) => entry.failedArrivalRequestId && entry.executionId && entry.ownershipEpoch === 1)).toBe(true);
    expect(failures.at(-1)?.exhausted).toBe(true);
    const escalations = f.database.eventsAfter(id, 0, 10_000).filter((event) => event.type === "scoped.management.escalated");
    expect(escalations).toHaveLength(1);
    expect(escalations[0]?.payload.technical).toBe(true);
    const managers = f.opened.filter((entry) => entry.controlScope?.role === "scoped-leader" && entry.controlScope.failedArrivalRequestIds.length);
    expect(managers.map((entry) => f.database.scopedGroupRun(id, entry.controlScope!.groupRunId)?.groupId)).toEqual(["J", "J", "H"]);
  });

  it("retains automatic recovery on a repeated Global Main technical failure without fabricating a user decision", async () => {
    const f = await fixture(false, { nested: true, failIdeaOnce: true, recovery: "skip", failGlobalMainTimes: 2 });
    await f.runtime.activate({ projectId: id, groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G", workflowRevision: 1,
      outer: { nodeRunId: "node-G", inputSnapshotRef: "project:requirement", activatedByAgentId: "main" } });
    for (let attempt = 0; attempt < 8 && f.state.phase !== "collaboration:technical-failure"; attempt += 1) await f.runtime.advance("run-G");
    expect(f.state.status).toBe("retrying");
    expect(f.state.phase).toBe("collaboration:technical-failure");
    expect(f.state.userIntervention).toBeUndefined();
    const failures = f.database.scopedManagementFailures(id).filter((entry) => entry.globalMain);
    expect(failures.map((entry) => entry.attempt)).toEqual([1, 2]);
    expect(failures.at(-1)?.exhausted).toBe(true);
    expect(f.database.eventsAfter(id, 0, 10_000).filter((event) => event.type === "scoped.management.failure")).toHaveLength(2);
  });

  it("workflow continuity: renews a stopped Global Main after backoff and lets its own recovery decision finish the group", async () => {
    const f = await fixture(false, { nested: true, failIdeaOnce: true, recovery: "skip", failGlobalMainTimes: 2 });
    await f.runtime.activate({ projectId: id, groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G", workflowRevision: 1,
      outer: { nodeRunId: "node-G", inputSnapshotRef: "project:requirement", activatedByAgentId: "main" } });
    for (let attempt = 0; attempt < 8 && f.state.phase !== "collaboration:technical-failure"; attempt++) await f.runtime.advance("run-G");
    expect(f.state.status).toBe("retrying");
    expect(f.database.scopedManagementFailures(id).filter(failure => failure.globalMain)).toHaveLength(2);
    const before = f.database.projectState(id).scopedExecutions!.map(execution => execution.id);
    f.database.resumeScopedManagementRepairs({ projectId: id, nodeRunId: "node-G",
      expectedRevision: f.database.projectState(id).stateRevision, automaticRecovery: true });
    expect(f.database.projectState(id).scopedExecutions!.map(execution => execution.id)).toEqual(before);
    f.state.workflowRecovery = { attempt: 1, pending: false, phase: f.state.phase, reason: "Actual manager failure",
      nextRetryAt: new Date().toISOString(), startedAt: new Date().toISOString() };
    f.state.status = "queued";
    expect((await advanceUntilTerminal(f)).status).toBe("completed");
    expect(f.state.userIntervention).toBeUndefined();
    expect(f.database.eventsAfter(id, 0, 20_000).some(event => event.type === "scoped.management.recovery.resumed" && event.payload.automaticRecovery === true)).toBe(true);
  });

  it.each(["persistent", "temporary", "user"] as const)("returns a failed recovery application to bounded original management (%s)", async mode => {
    const scenario: Parameters<typeof fixture>[1] = { nested: true, failIdeaOnce: true, recovery: "retry" };
    const f = await fixture(false, scenario);
    const discover = f.git.observePullRequestForExecution.getMockImplementation()!;
    const source = "Multiple pull requests claim the same execution branch; recovery is ambiguous";
    let applications = 0;
    f.git.observePullRequestForExecution.mockImplementation(async request => {
      if (request.execution.agentId !== "idea") return discover(request);
      if (mode === "temporary" && applications > 0) return discover(request);
      applications += 1;
      const receipt = f.database.scopedAcceptedLeaderActions(id, "run-G")
        .concat(f.database.projectState(id).scopedGroupRuns!.flatMap(group =>
          group.id === "run-G" ? [] : f.database.scopedAcceptedLeaderActions(id, group.id)))
        .filter(entry => entry.executionId === request.execution.id && entry.envelope.action.tool === "coordinate_group_task"
          && entry.envelope.action.operation === "retry").at(-1)!;
      expect(f.database.scopedLeaderTurns(id).find(turn => turn.invocationId === receipt.envelope.invocationId)?.status).toBe("released");
      expect(f.database.scopedExecution(id, request.execution.id)).toMatchObject({ status: "failed", ownershipEpoch: 1 });
      if (mode === "user") scenario.recovery = "user";
      throw new Error(source);
    });
    await f.runtime.activate({ projectId: id, groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G", workflowRevision: 1,
      outer: { nodeRunId: "node-G", inputSnapshotRef: "project:requirement", activatedByAgentId: "main" } });
    const result = await advanceUntilTerminal(f);
    const failures = f.database.scopedManagementFailures(id).filter(failure => failure.reason.includes(source));
    expect(failures.length).toBe(mode === "persistent" ? 8 : 1);
    expect(f.database.eventsAfter(id, 0, 10_000).filter(event => event.type === "scoped.recovery.application.failed")).toHaveLength(failures.length);
    expect(f.opened.some(open => contextSourceText(open.request).includes(source))).toBe(true);
    if (mode === "temporary") {
      expect(result.status).toBe("completed");
      expect(applications).toBe(1);
      expect(f.database.projectState(id).scopedExecutions!.find(execution => execution.agentId === "idea")).toMatchObject({
        ownershipEpoch: 2, status: "completed" });
      const original = f.opened.filter(input => input.controlScope?.role === "scoped-agent" &&
        input.controlScope.executionId === failures[0].executionId);
      expect(original).toHaveLength(2);
      expect(original[1].request.resumeThreadId).toBe("session-idea");
      expect(original[1].request.workspacePath).toBe(original[0].request.workspacePath);
    } else {
      expect(result.status).toBe("waiting");
      expect(applications).toBe(mode === "persistent" ? 8 : 1);
      expect(f.database.projectState(id).scopedExecutions!.find(execution => execution.agentId === "idea")).toMatchObject({
        ownershipEpoch: 1, status: "failed" });
      const revisions = f.database.projectState(id).stateRevision;
      await f.runtime.advance("run-G");
      expect(f.database.projectState(id).stateRevision).toBe(revisions);
      expect(applications).toBe(mode === "persistent" ? 8 : 1);
      if (mode === "user") {
        expect(f.state.userIntervention).toMatchObject({ status: "pending", requestedBy: "main" });
        const main = f.opened.find(input => input.controlScope?.role === "scoped-main")!;
        expect(contextSourceText(main.request)).toContain(source);
      } else {
        expect(f.state.status).toBe("retrying");
        expect(f.state.phase).toBe("collaboration:technical-failure");
        expect(f.state.userIntervention).toBeUndefined();
        for (const group of f.database.projectState(id).scopedGroupRuns!) {
          const local = failures.filter(failure => failure.groupRunId === group.id && !failure.globalMain);
          expect(local.map(failure => failure.attempt)).toEqual([1, 2]);
        }
        expect(failures.filter(failure => failure.globalMain).map(failure => failure.attempt)).toEqual([1, 2]);
      }
    }
    expect(f.git.closePullRequest).not.toHaveBeenCalled();
    expect(f.handles.size).toBe(0);
  });

  it.each(["cancelled", "aborted", "deferred"] as const)("does not spend recovery application budgets for %s control", async mode => {
    const f = await fixture(false, { failIdeaOnce: true, recovery: "retry" });
    const cancellation = new AbortController(); f.dependencies.signal = cancellation.signal;
    const discover = f.git.observePullRequestForExecution.getMockImplementation()!;
    let observations = 0;
    f.git.observePullRequestForExecution.mockImplementation(async request => {
      if (request.execution.agentId !== "idea") return discover(request);
      observations += 1;
      if (mode === "cancelled") f.database.appendEvent({ projectId: id, requestId: "actual-cancel-before-recovery-observation-return",
        type: "project.cancellation.requested", payload: { actor: "user" } });
      if (mode === "aborted") cancellation.abort();
      if (mode === "deferred") throw new ScopedManagementDeferredError();
      throw new Error("Provider observation ended after cancellation");
    });
    await f.runtime.activate({ projectId: id, groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G", workflowRevision: 1,
      outer: { nodeRunId: "node-G", inputSnapshotRef: "project:requirement", activatedByAgentId: "main" } });
    const progress = f.runtime.advance("run-G");
    if (mode === "aborted") await expect(progress).rejects.toThrow();
    else if (mode === "cancelled") await expect(progress).rejects.toThrow("Scoped project is cancelling");
    else expect((await progress).status).toBe("waiting");
    expect(observations).toBe(1);
    expect(f.database.scopedManagementFailures(id)).toEqual([]);
    expect(f.database.eventsAfter(id, 0, 10_000).filter(event => event.type === "scoped.recovery.application.failed")).toEqual([]);
    expect(f.database.projectState(id).scopedExecutions!.find(execution => execution.agentId === "idea"))
      .toMatchObject({ ownershipEpoch: 1, status: "failed" });
    expect(f.state.userIntervention).toBeUndefined();
    expect(f.handles.size).toBe(0);
  });

  it.each(["valid", "active-manager", "changed-envelope", "wrong-call", "wrong-manager", "cancelled", "stale-epoch", "restarted", "independent-peer", "atomic-rollback"] as const)(
    "records a recovery application failure only for its exact released decision (%s)", async mode => {
      const f = await fixture();
      const execution = await reserveInterrupted(f, false);
      const previous = f.database.scopedAgentTurn(id, execution.id, 1)!;
      f.database.stopScopedAgentTurn({ projectId: id, executionId: execution.id, ownershipEpoch: 1,
        invocationId: previous.invocationId, residentStopConfirmed: true });
      f.database.failScopedAgentArrival({ projectId: id, executionId: execution.id, ownershipEpoch: 1,
        arrivalRequestId: execution.arrivalRequestId, reason: "Original failed task remains held", residentStopConfirmed: true });
      if (mode === "independent-peer") {
        const arrival = f.database.scopedArrivals("run-G").find(arrival => arrival.agentId === "execution")!;
        const peer = f.database.claimScopedAgentArrival({ projectId: id, arrivalRequestId: arrival.requestId,
          agentId: "execution", executionId: "independent-peer", worktreePath: path.join(f.storage.projectDir(id), "git-worktrees/agents/execution") })!.execution;
        f.database.failScopedAgentArrival({ projectId: id, executionId: peer.id, ownershipEpoch: 1,
          arrivalRequestId: arrival.requestId, reason: "Independent failure must not consume another decision's budget", residentStopConfirmed: true });
      }
      const managerInput = { projectId: id, groupRunId: "run-G", agentId: "main", invocationId: "inv_" + "5".repeat(32),
        runtimePath: path.join(f.storage.projectDir(id), "runtime", "inv_" + "5".repeat(32)) };
      const manager = { ...managerInput, coordinatorEpoch: f.database.claimScopedLeaderTurn(managerInput)!.coordinatorEpoch };
      f.database.markScopedLeaderOpened(manager);
      const envelope = (action: ControlAction, callId: string): ControlActionEnvelope => ({ projectId: id, agent: "main",
        invocationId: manager.invocationId, stateVersion: manager.coordinatorEpoch, callId,
        capabilityHash: "a".repeat(64), receivedAt: repository.observedAt, action });
      f.database.recordScopedLeaderTaskCompletion({ ...manager, envelope: envelope({ tool: "finish_task" }, "finish-manager") });
      const retry = envelope({ tool: "coordinate_group_task", groupRunId: "run-G", coordinatorEpoch: manager.coordinatorEpoch,
        arrivalRequestId: execution.arrivalRequestId, operation: "retry", rationale: "Recover this exact original failure" }, "original-retry");
      f.database.acceptScopedLeaderAction({ ...manager, envelope: retry, residentStopConfirmed: true });
      if (mode !== "active-manager") f.database.releaseScopedLeaderTurn({ ...manager, residentStopConfirmed: true });
      const original = f.database.projectState(id);
      const input = { ...manager, reason: "Exact provider observation failed: " + "retained-identity-".repeat(150),
        applicationFailure: structuredClone(retry) };
      if (mode === "changed-envelope") (input.applicationFailure.action as Extract<ControlAction, { tool: "coordinate_group_task" }>).rationale = "Changed formal decision";
      if (mode === "wrong-call") input.applicationFailure.callId = "unaccepted-call";
      if (mode === "wrong-manager") input.agentId = "execution";
      if (mode === "cancelled") f.database.appendEvent({ projectId: id, requestId: "cancel-before-application-failure",
        type: "project.cancellation.requested", payload: { actor: "user" } });
      if (mode === "stale-epoch") f.database.retryScopedAgentArrival({ projectId: id, executionId: execution.id,
        arrivalRequestId: execution.arrivalRequestId, failedOwnershipEpoch: 1 });
      let database = f.database;
      if (mode === "restarted") {
        f.database.close();
        database = CollaborationStateDatabase.open({ ...f.options, instanceId: "two", now: () => 2_000_000 }); stores.push(database);
      }
      const before = database.projectState(id);
      if (["valid", "restarted", "independent-peer", "atomic-rollback"].includes(mode)) {
        if (mode === "atomic-rollback") {
          const read = vi.spyOn(database, "scopedManagementFailures").mockImplementationOnce(() => {
            throw new Error("Interrupted after application failure insertion, before finite budget insertion");
          });
          expect(() => database.recordScopedManagementFailure(input)).toThrow("before finite budget insertion");
          read.mockRestore();
          expect(database.projectState(id).stateRevision).toBe(before.stateRevision);
          expect(database.scopedManagementFailures(id)).toEqual([]);
          expect(database.eventsAfter(id, 0, 10_000).filter(event => event.type === "scoped.recovery.application.failed")).toEqual([]);
        }
        const records = database.recordScopedManagementFailure(input);
        expect(records).toEqual([expect.objectContaining({ executionId: execution.id, ownershipEpoch: 1,
          managerInvocationId: manager.invocationId, reason: input.reason, attempt: 1, budget: 2, exhausted: false })]);
        const revision = database.projectState(id).stateRevision;
        expect(revision).toBe(before.stateRevision + 1);
        expect(database.recordScopedManagementFailure(input)).toEqual(records);
        expect(database.projectState(id).stateRevision).toBe(revision);
        expect(() => database.recordScopedManagementFailure({ ...input, reason: "Changed error on replay" })).toThrow(/changed on replay/);
        const candidate = database.scopedRecoveryCandidates(id, "run-G").find(candidate => candidate.executionId === execution.id)!;
        expect(candidate).toMatchObject({ reason: input.reason, ownershipEpoch: 1,
          applicationFailures: [expect.objectContaining({ managerInvocationId: manager.invocationId, callId: retry.callId, reason: input.reason })] });
        expect(candidate.pendingOperation).toBeUndefined();
        expect(candidate.coordinationRevision).toBeGreaterThan(0);
        expect(database.projectState(id).operations).toEqual(original.operations);
        expect(database.scopedAgentTurn(id, execution.id, 1)).toMatchObject({ invocationId: previous.invocationId, status: "stopped" });
        expect(database.scopedAgentReport(id, execution.id, 1)).toBeUndefined();
        if (mode === "independent-peer") expect(database.scopedManagementFailures(id).some(failure => failure.executionId === "independent-peer")).toBe(false);
      } else {
        expect(() => database.recordScopedManagementFailure(input)).toThrow();
        expect(database.projectState(id).stateRevision).toBe(before.stateRevision);
        expect(database.scopedManagementFailures(id)).toEqual([]);
        expect(database.eventsAfter(id, 0, 10_000).filter(event => event.type === "scoped.recovery.application.failed")).toEqual([]);
      }
    });

  it("keeps management failure budget evidence after a database restart", async () => {
    const f = await fixture(false, { nested: true, failPlanGroup: "J", recovery: "retry" });
    await f.runtime.activate({ projectId: id, groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G", workflowRevision: 1,
      outer: { nodeRunId: "node-G", inputSnapshotRef: "project:requirement", activatedByAgentId: "main" } });
    await f.runtime.advance("run-G");
    const before = f.database.scopedManagementFailures(id);
    expect(before).toHaveLength(1);
    f.database.close();
    const restarted = CollaborationStateDatabase.open({ ...f.options, instanceId: "two", now: () => 2_000_000 });
    stores.push(restarted);
    expect(restarted.scopedManagementFailures(id)).toEqual(before);
  });

  it("asks the original Leader for an actual Agent repair of a canonical final conflict and reclaims only Git final authority", async () => {
    const f = await fixture(false, { nested: true, recovery: "retry" }); f.git.conflictedFinalGroup = "J";
    await f.runtime.activate({ projectId: id, groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G", workflowRevision: 1,
      outer: { nodeRunId: "node-G", inputSnapshotRef: "project:requirement", activatedByAgentId: "main" } });
    expect((await advanceUntilTerminal(f)).status).toBe("completed");
    const group = f.database.projectState(id).scopedGroupRuns!.find((entry) => entry.groupId === "J")!;
    const repairManager = f.opened.find(entry => entry.controlScope?.role === "scoped-leader" &&
      entry.controlScope.recoveryOptions?.some(option => option.repairNodeIds.length));
    expect(repairManager?.controlScope).toMatchObject({ recoveryOptions: [expect.objectContaining({
      allowedOperations: ["retry", "escalate"], repairNodeIds: ["J_idea"]
    })] });
    expect(f.database.scopedFinalIntegration(id, group.id)?.ownershipEpoch).toBe(2);
    expect(f.git.closePullRequest).not.toHaveBeenCalled();
    const finalPull = f.git.pulls.get(f.database.scopedFinalIntegration(id, group.id)!.id)!;
    expect(f.database.scopedFinalRecoveryPull(id, finalPull.ownerExecutionId!, 1)?.providerNumber).toBe(finalPull.providerNumber);
    expect(f.git.prepareConflictResolution).toHaveBeenCalledWith(expect.objectContaining({ agentId: "idea", purpose: "delivery" }), 1,
      { kind: "group", groupRunId: group.parentGroupRunId, expectedHead: expect.any(String) }, expect.any(AbortSignal));
    const idea = f.opened.filter((entry) => entry.request.agent === "idea" && entry.controlScope?.role === "scoped-agent" && !entry.controlScope.executionId.startsWith("group-final-")); expect(idea).toHaveLength(2);
    expect(idea[1].request.resumeThreadId).toBe("session-idea"); expect(idea[1].request.workspacePath).toBe(idea[0].request.workspacePath);
    expect(f.opened.filter((entry) => entry.controlScope?.role === "scoped-agent" && !entry.controlScope.executionId.startsWith("group-final-") && entry.request.agent === "execution")).toHaveLength(1);
    expect(f.database.projectState(id).executions).toEqual([]);
    expect(f.database.scopedGroupIssues(id)).toEqual([]);
  });

  it.each([false, true])("isolates real canonical final MCP receipts and returns a dirty-target blocker without unchanged supplements (blocked=%s)", async blocked => {
    const f = await fixture(false, blocked ? { recovery: "user" } : {});
    const open = f.launcher.open.getMockImplementation()!;
    const paths: string[] = []; const archived: string[] = []; const invocations: string[] = [];
    const blocker = new GitInputError("Main must preserve pending final-manifest.json before synchronization", {
      blocker: "TARGET_WORKTREE_DIRTY", targetAgentId: "main", pendingEntries: ["?? final-manifest.json"]
    });
    if (blocked) f.git.mergeGroupFinalPullRequest.mockRejectedValue(blocker);
    f.launcher.open.mockImplementation(async input => {
      const handle = await open(input); const scope = input.controlScope;
      if (scope?.role !== "scoped-agent" || !scope.executionId.startsWith("group-final-")) return handle;
      handle.submit.mockImplementation(async turn => {
        const authority = await input.controlAuthorityFactory!({ request: input.request, turn });
        paths.push(authority.control.stagingPath);
        invocations.push(turn.invocationId);
        const service = new ControlActionService({ projectId: id, agent: input.request.agent, invocationId: turn.invocationId,
          stateVersion: authority.control.stateVersion, capability: authority.control.capability,
          capabilityHash: authority.control.capabilityHash, stagingPath: authority.control.stagingPath,
          revalidate: authority.revalidate, execute: authority.execute });
        const call = (name: string, action: ControlAction) => service.stageWithResult(authority.control.capability, name, action);
        const final = f.database.scopedFinalIntegration(id, scope.groupRunId)!;
        if (paths.length === 1) {
          await call("canonical-create", { tool: "github_create_pr", base: final.integrationTarget, title: "Actual canonical delivery", body: "Retain the same PR" });
        }
        if (blocked || paths.length > 1) {
          const merge = call("canonical-merge", { tool: "github_merge_pr", providerNumber: f.git.pulls.get(final.id)!.providerNumber, reason: "My actual assigned delivery" });
          if (blocked) await expect(merge).rejects.toBe(blocker); else await merge;
          await call("canonical-finish", { tool: "finish_task", summary: blocked ? "Target owner must handle pending files" : "My final delivery is complete" });
        }
        await service.drain(); service.revoke();
        const actions = await readStagedControlActions(authority.control.stagingPath);
        const result = { handoff: blocked ? blocker.message : "Original Agent supplied its next canonical action", controlActions: actions };
        expect(new HarnessRuntimeFacade().validateResidentTurnResult(result, { ...input.request, control: authority.control })).toEqual(result);
        for (let n = 0; n < archived.length; n++) expect(await readFile(paths[n], "utf8")).toBe(archived[n]);
        archived.push(await readFile(authority.control.stagingPath, "utf8"));
        return result;
      });
      return handle;
    });
    await f.runtime.activate({ projectId: id, groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G", workflowRevision: 1,
      outer: { nodeRunId: "node-G", inputSnapshotRef: "project:requirement", activatedByAgentId: "main" } });
    const outcome = await f.runtime.advance("run-G");
    if (blocked) {
      expect(outcome.status).not.toBe("completed");
      // A Leader may explicitly assign a new recovery. The failed Agent
      // turn itself must not receive unchanged automatic supplements.
      expect(paths.length).toBeGreaterThan(0);
      expect(new Set(invocations).size).toBe(paths.length);
      expect(f.database.scopedGroupIssues(id).map(issue => issue.reason).join("\n"), JSON.stringify(outcome)).toContain("final-manifest.json");
      expect(f.database.scopedGroupIssues(id).some(issue => issue.reason.includes("invalid orchestration control envelope"))).toBe(false);
    } else {
      expect(outcome.status).toBe("completed");
      expect(paths).toHaveLength(2);
      expect(new Set(paths).size).toBe(2);
      expect((await readStagedControlActions(paths[1])).some(action => action.callId === "canonical-create")).toBe(false);
    }
    expect(f.git.closePullRequest).not.toHaveBeenCalled();
  });
  it("builds actual immutable inputs, accepts formal Leader planning and preserves cwd/session for FIFO arrivals", async () => {
    const { runtime, database, opened, submitted, state, handles, closed } = await fixture();
    const inherited = 'Continue Main recovery; use project completion authority if available.\nKeep review result {"sum":5}.';
    await runtime.activate({ projectId: id, groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G", workflowRevision: 1,
      outer: { nodeRunId: "node-G", inputSnapshotRef: "project:requirement", activatedByAgentId: "main", optionalTask: inherited } });
    expect(await runtime.advance("run-G")).toMatchObject({ status: "completed", issues: [] });
    const turns = opened.filter((entry) => entry.controlScope?.role === "scoped-agent" && !entry.controlScope.executionId.startsWith("group-final-") && entry.request.agent === "idea");
    expect(turns).toHaveLength(2); expect(new Set(turns.map((entry) => entry.request.workspacePath)).size).toBe(1);
    expect(turns[1].request.resumeThreadId).toBe("session-idea"); expect(state.agentSessionIds?.idea).toBe("session-idea");
    const predecessor = opened.find((entry) => entry.controlScope?.role === "scoped-agent" && !entry.controlScope.executionId.startsWith("group-final-") && entry.request.agent === "execution")!;
    const successorInbox = await readFile(turns[1].request.inboxPath, "utf8");
    expect(successorInbox).toContain("来源：execution"); expect(successorInbox).toContain(`Finished ${predecessor.request.invocationId}`);
    expect(contextSourceText(turns[1].request)).toContain(`Finished ${predecessor.request.invocationId}`);
    expect(turns[1].request.executionContext!.executionId).not.toBe(predecessor.request.executionContext!.executionId);
    for (const input of turns) {
      const sent = submitted.find(item => item.invocationId === input.request.invocationId)!;
      expect(sent.prompt).toBe(sent.inbox);
      expect(sent.inbox).toMatch(/^来源：main\n内容：/);
      expect(input.request.executionContext).toMatchObject({ role: "delivery", executionId: input.controlScope && "executionId" in input.controlScope ? input.controlScope.executionId : undefined });
      expect(sent.inbox).not.toContain(`Project requirement:\n${state.requirement}`);
      expect(sent.inbox).not.toContain(inherited);
      expect(sent.inbox).toContain("Complete G_idea in the existing workflow.");
      expect(sent.canComplete).toBe(false);
    }
    expect(database.projectState(id).tasks).toEqual([]); expect(database.projectState(id).executions).toEqual([]);
    expect(database.scopedGroupPlan(id, "run-G")?.tasks).toHaveLength(2);
    expect(handles.size).toBe(0); expect(closed).toHaveLength(opened.length);
    const requests = database.eventsAfter(id, 0, 10_000).filter(event => event.type === "agent.git.operation.requested");
    expect(requests.length).toBeGreaterThan(0);
    for (const event of requests) {
      const request = event.payload.request as { operationId: string; agentId: string; invocationId: string;
        executionId: string; ownershipEpoch: number; nativeBinding?: { invocationId: string; session: { nativeId: string } } };
      const owner = opened.find(entry => entry.request.invocationId === request.invocationId);
      expect(owner?.controlScope?.role).toBe("scoped-agent");
      expect(request).toMatchObject({ agentId: owner!.request.agent,
        executionId: owner!.request.executionContext!.executionId,
        ownershipEpoch: owner!.request.executionContext!.ownershipEpoch });
      // This fake launcher saves mutable session state but does not emit the
      // production launcher's trusted binding. Never invent it from state.
      expect(request.nativeBinding).toEqual(database.eventByRequestId(id, `agent-native-binding:${request.invocationId}`)?.payload.binding);
      expect(database.eventByRequestId(id, `agent-git-request:${request.operationId}`)?.seq).toBe(event.seq);
    }
  });

  it("uses the group Leader for management-owned Worker weak routing without granting that route to the Worker", async () => {
    const { runtime, database, opened } = await fixture(true);
    await runtime.activate({ projectId: id, groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G", workflowRevision: 1,
      outer: { nodeRunId: "node-G", inputSnapshotRef: "project:requirement", activatedByAgentId: "main" } });
    expect(await runtime.advance("run-G")).toMatchObject({ status: "completed", issues: [] });
    expect(opened.filter((entry) => entry.controlScope?.role === "scoped-agent" && !entry.controlScope.executionId.startsWith("group-final-") && entry.request.agent === "idea")
      .map((entry) => entry.controlScope)).toEqual([expect.objectContaining({ decisionBy: "main", candidates: [] }), expect.objectContaining({ decisionBy: "main", candidates: [] })]);
    expect(database.scopedAcceptedLeaderActions(id, "run-G").filter((item) => item.envelope.action.tool === "route_to_agent")).toHaveLength(2);
  });

  it("a new writer preserves the report and refuses Git delivery until the original task has its finish receipt", async () => {
    const f = await fixture();
    const execution = await reserveInterrupted(f, true);
    f.database.close();
    const database = CollaborationStateDatabase.open({ ...f.options, instanceId: "two", now: () => 2_000_000 }); stores.push(database);
    const git = new ScopedRuntimeGit(database, id);
    git.refs.set("groups/run-G", "b".repeat(40)); git.localRefs.set("groups/run-G", "b".repeat(40));
    git.localRefs.set(execution.executionBranch, "b".repeat(40));
    const runtime = new ScopedProjectRuntime({ ...f.dependencies, database, git,
      publish: async () => undefined });
    await runtime.reconcileResidents();
    expect(f.launcher.stopScopedForRecovery).toHaveBeenCalledWith(expect.objectContaining({ scopeId: execution.id, agentId: "idea", ownershipEpoch: 1 }));
    expect(database.scopedAgentRecoveredForCurrentWriter(id, execution.id, 1)).toBe(true);
    await expect(new (await import("../../src/core/scoped-agent-execution.js")).ScopedAgentExecutionRunner(database, git,
      { invoke: vi.fn(() => { throw new Error("Model must not rerun"); }) }, (key) => f.storage.projectDir(key))
      .prepareDelivery({ projectId: id, executionId: execution.id, ownershipEpoch: 1, repository })).rejects.toThrow(/finish_task/);
    expect(database.scopedAgentReport(id, execution.id, 1)?.output).toBe("Durable original result");
    expect(git.checkpointAndPush).not.toHaveBeenCalled();
    expect(git.sessionBegin).not.toHaveBeenCalled(); expect(f.opened).toHaveLength(0);
    const count = f.launcher.stopScopedForRecovery.mock.calls.length;
    await runtime.reconcileResidents(); expect(f.launcher.stopScopedForRecovery).toHaveBeenCalledTimes(count);
  });

  it("an interrupted result without a report stays failed for Leader coordination and holds the Agent FIFO", async () => {
    const f = await fixture(); const execution = await reserveInterrupted(f, false);
    await f.runtime.reconcileResidents();
    expect(f.database.scopedExecution(id, execution.id)?.status).toBe("failed");
    expect(f.database.scopedAgentReport(id, execution.id, 1)).toBeUndefined();
    expect(f.database.projectState(id).tasks).toEqual([]);
    expect(f.opened).toHaveLength(0);
    expect(f.database.scopedGroupReadyForFinalIntegration(id, "run-G")).toBe(false);
  });

  it.each(["prepared", "uncertain"] as const)("retains an interrupted unreported %s Git owner and exposes its exact blocker to the existing Leader", async status => {
    const f = await fixture(); const execution = await reserveInterrupted(f, false);
    const store = f.database.operationsForProject(id, true);
    let operation = await prepareOperation(store, { id: "interrupted-merge", kind: "pull.merge",
      ownerExecutionId: execution.id, ownershipEpoch: execution.ownershipEpoch,
      expectedHead: "a".repeat(40), expectedBase: "groups/run-G" }, { providerNumber: 1 });
    if (status === "uncertain") operation = await transitionOperation(store, operation, { status: "uncertain" });
    await expect(f.runtime.reconcileResidents()).resolves.toBeUndefined();
    expect(f.database.recordedGitOperation(id, operation.id)).toEqual(operation);
    expect(f.database.scopedExecution(id, execution.id)).toMatchObject({ status: "running", ownershipEpoch: 1 });
    expect(f.database.scopedAgentTurn(id, execution.id, 1)?.status).toBe("stopped");
    expect(f.database.scopedAgentReport(id, execution.id, 1)).toBeUndefined();
    expect(f.database.scopedAgentTaskCompletion(id, execution.id, 1)).toBeUndefined();
    expect(f.database.scopedRecoveryCandidates(id, "run-G")).toEqual([expect.objectContaining({
      kind: "mechanism", executionId: execution.id, ownershipEpoch: 1, failedArrivalRequestId: execution.arrivalRequestId,
      reason: expect.stringContaining("interrupted-merge")
    })]);
    expect(f.opened).toEqual([]); expect(f.git.checkpointAndPush).not.toHaveBeenCalled();
    expect(f.git.mergePullRequest).not.toHaveBeenCalled();
    const revision = f.database.projectState(id).stateRevision;
    await f.runtime.reconcileResidents();
    expect(f.database.projectState(id).stateRevision).toBe(revision);
  });

  it.each([
    ["prepared", false], ["observed", false], ["uncertain", false],
    ["prepared", true], ["observed", true], ["uncertain", true]
  ] as const)("preserves the unreported %s Git owner through confirmed Stop/Resume (new writer: %s)", async (status, newWriter) => {
    const f = await fixture(); const execution = await reserveInterrupted(f, false);
    const originalTurn = f.database.scopedAgentTurn(id, execution.id, 1)!;
    const identity = { projectId: id, executionId: execution.id, ownershipEpoch: 1, invocationId: originalTurn.invocationId };
    const store = f.database.operationsForProject(id, true);
    let operation = await prepareOperation(store, { id: "stopped-unreported-merge", kind: "pull.merge",
      ownerExecutionId: execution.id, ownershipEpoch: 1, expectedHead: "a".repeat(40), expectedBase: "groups/run-G" }, { providerNumber: 1 });
    if (status !== "prepared") operation = await transitionOperation(store, operation, { status });
    for (let attempt = 1; attempt <= 2; attempt++) f.database.reserveScopedAgentMechanismRepair({ ...identity, missing: ["github_merge_pr"] });
    f.database.appendEvent({ projectId: id, requestId: "resumable-interrupted-stop",
      type: "project.cancellation.requested", payload: { resumable: true, reason: "user_cancelled" } });
    await f.runtime.reconcileResidents();
    f.database.retainScopedProjectCancellation(id);
    f.database.confirmProjectCancellationStopped(id);
    const stopped = f.database.projectState(id);
    expect(stopped.scopedExecutions).toMatchObject([{ id: execution.id, status: "stopped", ownershipEpoch: 1 }]);
    let database = f.database, runtime = f.runtime;
    if (newWriter) {
      f.database.close();
      database = CollaborationStateDatabase.open({ ...f.options, instanceId: "stop-resume-successor", now: () => 2_000_000 }); stores.push(database);
      const git = new ScopedRuntimeGit(database, id); git.restoreProviderState(f.git);
      runtime = new ScopedProjectRuntime({ ...f.dependencies, database, git, publish: async () => undefined });
    }
    database.resumeProjectCancellation({ projectId: id });
    expect(database.scopedExecution(id, execution.id)).toMatchObject({ id: execution.id, agentId: execution.agentId,
      arrivalRequestId: execution.arrivalRequestId, executionBranch: execution.executionBranch,
      worktreePath: execution.worktreePath, status: "running", ownershipEpoch: 1 });
    expect(database.scopedAgentTurn(id, execution.id, 1)).toEqual(originalTurn.status === "stopped" ? originalTurn
      : { ...originalTurn, status: "stopped", stoppedAt: expect.any(String) });
    expect(database.scopedAgentTurn(id, execution.id, 2)).toBeUndefined();
    await runtime.reconcileResidents();
    expect(() => database.assertScopedGitExecutionOwnership({ projectId: id, executionId: execution.id,
      ownershipEpoch: 1, expectedBranch: execution.executionBranch, operation: "provider.mutate" })).not.toThrow();
    expect(() => database.assertScopedGitExecutionOwnership({ projectId: id, executionId: execution.id,
      ownershipEpoch: 2, expectedBranch: execution.executionBranch, operation: "provider.mutate" })).toThrow();
    expect(database.scopedRecoveryCandidates(id, "run-G")).toEqual([expect.objectContaining({ kind: "mechanism",
      executionId: execution.id, ownershipEpoch: 1, reason: expect.stringContaining(operation.id) })]);
    expect(database.scopedAgentMechanismRepairCount(id, execution.id)).toBe(2);
    expect(database.recordedGitOperation(id, operation.id)).toEqual(operation);
    expect(database.scopedAgentReport(id, execution.id, 1)).toBeUndefined();
    expect(database.scopedAgentTaskCompletion(id, execution.id, 1)).toBeUndefined();
    expect(f.opened).toEqual([]); expect(f.git.checkpointAndPush).not.toHaveBeenCalled();
    expect(f.git.mergePullRequest).not.toHaveBeenCalled();
  });

  it("accepts a Leader's direct key-state request as its management decision and transports the actual handoff to Main without repeating business work", async () => {
    const f = await fixture(false, { rootLeader: "review", directMainStateCoordination: true, recovery: "user" });
    const execution = await reserveInterrupted(f, false);
    const original = f.database.scopedAgentTurn(id, execution.id, 1)!;
    const operation = await prepareOperation(f.database.operationsForProject(id, true), { id: "unconfirmed-original-pr",
      kind: "pull.merge", ownerExecutionId: execution.id, ownershipEpoch: 1, expectedHead: "a".repeat(40), expectedBase: "groups/run-G" }, { providerNumber: 1 });
    await f.runtime.reconcileResidents();
    const group = f.database.scopedGroupRun(id, "run-G")!;
    const manager = f.runtime as unknown as { manage(group: typeof group, purpose: "recover", source?: string, context?: string, globalMain?: boolean): Promise<void> };
    await manager.manage(group, "recover");
    const candidate = f.database.scopedRecoveryCandidates(id, "run-G", true)[0];
    expect(candidate).toMatchObject({ executionId: execution.id, mainStateRequest: {
      reason: "Main must judge this exact unconfirmed original PR request", requestedBy: "review" } });
    const leader = f.opened.find(o => o.controlScope?.role === "scoped-leader")!;
    expect(f.database.scopedLeaderTurns(id).find(t => t.invocationId === leader.request.invocationId)?.status).toBe("released");
    expect(f.database.scopedLeaderTaskCompleted(id, "run-G", "review", leader.request.invocationId,
      leader.controlScope!.coordinatorEpoch)).toBe(true);
    expect(f.database.eventByRequestId(id, `scoped-management-round-completed:${leader.request.invocationId}`)?.payload.mainStateRequestIds).toHaveLength(1);
    const completion = Object.values(f.state.taskCompletions!).find(c => c.invocationId === leader.request.invocationId)!;
    expect(await readFile(completion.handoffPath!, "utf8")).toBe(`Finished ${leader.request.invocationId}`);
    await manager.manage(group, "recover", undefined, "Recorded direct key-state coordination", true);
    const main = f.submitted.find(s => f.opened.find(o => o.request.invocationId === s.invocationId)?.controlScope?.role === "scoped-main")!;
    const mainRequest = f.opened.find(open => open.request.invocationId === main.invocationId)!.request;
    expect(contextSourceText(mainRequest)).toContain(candidate.mainStateRequest!.reason); expect(contextSourceText(mainRequest)).toContain(operation.id);
    expect(f.database.recordedGitOperation(id, operation.id)).toEqual(operation);
    expect(f.database.scopedAgentTurn(id, execution.id, 1)).toMatchObject({ invocationId: original.invocationId, status: "stopped" });
    expect(f.database.scopedAgentReport(id, execution.id, 1)).toBeUndefined();
    expect(f.database.scopedAgentMechanismRepairCount(id, execution.id)).toBe(0);
    expect(f.database.scopedManagementFailures(id)).toEqual([]);
    expect(f.git.checkpointAndPush).not.toHaveBeenCalled(); expect(f.git.mergePullRequest).not.toHaveBeenCalled();
    expect(f.closed).toHaveLength(f.opened.length);
  });

  it.each(["no-operation", "finalized", "reported"] as const)(
    "preserves ordinary confirmed Stop/Resume behavior for an owner with %s", async mode => {
      const f = await fixture(); const execution = await reserveInterrupted(f, mode === "reported");
      const report = f.database.scopedAgentReport(id, execution.id, 1);
      if (mode !== "no-operation") {
        const store = f.database.operationsForProject(id, true);
        let operation = await prepareOperation(store, { id: "ordinary-stopped-merge", kind: "pull.merge",
          ownerExecutionId: execution.id, ownershipEpoch: 1, expectedHead: "a".repeat(40), expectedBase: "groups/run-G" }, { providerNumber: 1 });
        if (mode === "finalized") {
          operation = await transitionOperation(store, operation, { status: "observed" });
          await transitionOperation(store, operation, { status: "finalized" });
        }
      }
      const operations = f.database.projectState(id).operations;
      f.database.appendEvent({ projectId: id, requestId: "ordinary-resumable-stop",
        type: "project.cancellation.requested", payload: { resumable: true, reason: "user_cancelled" } });
      await f.runtime.reconcileResidents();
      f.database.retainScopedProjectCancellation(id);
      f.database.confirmProjectCancellationStopped(id);
      f.database.resumeProjectCancellation({ projectId: id });
      expect(f.database.scopedExecution(id, execution.id)).toMatchObject({ id: execution.id,
        ownershipEpoch: mode === "reported" ? 1 : 2, status: mode === "reported" ? "integrating" : "running" });
      expect(f.database.projectState(id).operations).toEqual(operations);
      expect(f.database.scopedAgentReport(id, execution.id, 1)).toEqual(report);
      expect(f.database.scopedAgentMechanismRepairCount(id, execution.id)).toBe(0);
      expect(f.opened).toEqual([]);
    });

  it.each(["live", "wrong-invocation", "wrong-epoch", "no-operation", "reported", "unreconciled-writer", "cancelled"] as const)(
    "rejects interrupted Git coordination without exact stopped unreported ownership (%s)", async mode => {
      const f = await fixture(); const execution = await reserveInterrupted(f, mode === "reported");
      const turn = f.database.scopedAgentTurn(id, execution.id, 1)!;
      const identity = { projectId: id, executionId: execution.id, ownershipEpoch: 1, invocationId: turn.invocationId };
      if (mode !== "no-operation") await prepareOperation(f.database.operationsForProject(id, true), {
        id: "unsettled-original", kind: "pull.merge", ownerExecutionId: execution.id, ownershipEpoch: 1,
        expectedHead: "a".repeat(40), expectedBase: "groups/run-G" }, { providerNumber: 1 });
      if (mode !== "live" && mode !== "reported") f.database.stopScopedAgentTurn({ ...identity, residentStopConfirmed: true });
      if (mode === "wrong-invocation") identity.invocationId = "foreign-invocation";
      if (mode === "wrong-epoch") identity.ownershipEpoch = 2;
      if (mode === "cancelled") f.database.appendEvent({ projectId: id, requestId: "stop-before-coordination",
        type: "project.cancellation.requested", payload: { actor: "user" } });
      let database = f.database;
      if (mode === "unreconciled-writer") {
        f.database.close();
        database = CollaborationStateDatabase.open({ ...f.options, instanceId: "two", now: () => 2_000_000 }); stores.push(database);
      }
      const before = database.projectState(id);
      expect(() => database.recordScopedAgentInterruptedOperation(identity)).toThrow();
      expect(database.projectState(id).stateRevision).toBe(before.stateRevision);
      expect(database.scopedGroupIssues(id)).toEqual([]);
      expect(database.scopedAgentMechanismRepairCount(id, execution.id)).toBe(0);
      expect(database.projectState(id).operations).toEqual(before.operations);
    });

  it.each(["valid", "active-manager", "wrong-decision", "wrong-call", "wrong-epoch", "cancelled", "unreconciled-writer", "reconciled-writer"] as const)(
    "reserves an interrupted Git supplement only once after the exact manager releases (%s)", async mode => {
      const f = await fixture(); const execution = await reserveInterrupted(f, false);
      const previous = f.database.scopedAgentTurn(id, execution.id, 1)!;
      const identity = { projectId: id, executionId: execution.id, ownershipEpoch: 1, invocationId: previous.invocationId };
      const operation = await prepareOperation(f.database.operationsForProject(id, true), { id: "unsettled-original",
        kind: "pull.merge", ownerExecutionId: execution.id, ownershipEpoch: 1, expectedHead: "a".repeat(40), expectedBase: "groups/run-G" },
        { providerNumber: 1 });
      f.database.recordScopedAgentTaskCompletion({ ...identity, agentId: "idea", callId: "original-finish",
        requestedAt: repository.observedAt, memory: "Keep original immutable completion" });
      for (let attempt = 1; attempt <= 2; attempt++) f.database.reserveScopedAgentMechanismRepair({ ...identity, missing: ["github_merge_pr"] });
      await f.runtime.reconcileResidents();
      const completion = f.database.scopedAgentTaskCompletion(id, execution.id, 1);
      const managerInput = { projectId: id, groupRunId: "run-G", agentId: "main", invocationId: "inv_" + "6".repeat(32),
        runtimePath: path.join(f.storage.projectDir(id), "runtime", "inv_" + "6".repeat(32)), allowStoppedRepairFaults: true };
      const manager = { ...managerInput, coordinatorEpoch: f.database.claimScopedLeaderTurn(managerInput)!.coordinatorEpoch };
      f.database.markScopedLeaderOpened(manager);
      const envelope = (action: ControlAction, callId: string): ControlActionEnvelope => ({ projectId: id, agent: "main",
        invocationId: manager.invocationId, callId, stateVersion: manager.coordinatorEpoch,
        capabilityHash: "a".repeat(64), receivedAt: repository.observedAt, action });
      f.database.recordScopedLeaderTaskCompletion({ ...manager, envelope: envelope({ tool: "finish_task" }, "manager-finish") });
      const coordination = envelope({ tool: "coordinate_group_task", groupRunId: "run-G", coordinatorEpoch: manager.coordinatorEpoch,
        arrivalRequestId: execution.arrivalRequestId, operation: "retry", rationale: "Observe this original interrupted request" }, "manager-retry");
      f.database.acceptScopedLeaderAction({ ...manager, envelope: coordination, residentStopConfirmed: true });
      if (mode !== "active-manager") f.database.releaseScopedLeaderTurn({ ...manager, residentStopConfirmed: true });
      const repair = { projectId: id, executionId: execution.id, ownershipEpoch: 1, invocationId: "inv_" + "7".repeat(32),
        runtimePath: path.join(f.storage.projectDir(id), "runtime", "inv_" + "7".repeat(32)), coordination: structuredClone(coordination) };
      if (mode === "wrong-call") repair.coordination.callId = "another-call";
      if (mode === "wrong-decision") (repair.coordination.action as Extract<ControlAction, { tool: "coordinate_group_task" }>).operation = "escalate";
      if (mode === "wrong-epoch") repair.ownershipEpoch = 2;
      if (mode === "cancelled") f.database.appendEvent({ projectId: id, requestId: "stop-before-continuation",
        type: "project.cancellation.requested", payload: { actor: "user" } });
      let database = f.database;
      if (mode === "unreconciled-writer" || mode === "reconciled-writer") {
        f.database.close();
        database = CollaborationStateDatabase.open({ ...f.options, instanceId: "two", now: () => 2_000_000 }); stores.push(database);
        if (mode === "reconciled-writer") {
          const runtime = new ScopedProjectRuntime({ ...f.dependencies, database, git: new ScopedRuntimeGit(database, id),
            publish: async () => undefined });
          await runtime.reconcileResidents();
          expect(database.scopedAgentRecoveredForCurrentWriter(id, execution.id, 1, previous.invocationId)).toBe(true);
          expect(f.launcher.stopScopedForRecovery).toHaveBeenCalledWith(expect.objectContaining({ scopeId: execution.id,
            executionRuntimePath: previous.runtimePath, ownershipEpoch: 1 }));
        }
      }
      const before = database.projectState(id);
      if (mode === "active-manager") {
        await expect((f.runtime as unknown as { applyAcceptedRecoveries(): Promise<void> }).applyAcceptedRecoveries()).resolves.toBeUndefined();
        expect(f.git.observePullRequestForExecution).not.toHaveBeenCalled();
        expect(database.projectState(id).stateRevision).toBe(before.stateRevision);
        expect(database.scopedAgentTurn(id, execution.id, 1)?.invocationId).toBe(previous.invocationId);
      }
      if (mode !== "valid" && mode !== "reconciled-writer") {
        expect(() => database.beginScopedAgentMissingReportRepair(repair)).toThrow();
        expect(database.projectState(id).stateRevision).toBe(before.stateRevision);
      } else {
        expect(database.beginScopedAgentMissingReportRepair(repair)).toMatchObject({ attempt: 1, turn: { status: "reserved", ownershipEpoch: 1 } });
        expect(database.beginScopedAgentMissingReportRepair(repair)).toBeUndefined();
        expect(database.scopedAgentMissingReportRepair(id, execution.id, 1)).toMatchObject({
          originalInvocationId: previous.invocationId, previousRuntimePath: previous.runtimePath, interruptedOperationIds: [operation.id] });
        expect(database.scopedGroupIssues(id)).toEqual([]);
        expect(database.assertScopedAgentMissingReportRepairLaunch({ ...repair, agentId: "idea" })).toEqual({ previousRuntimePath: previous.runtimePath });
        expect(database.scopedAgentTaskCompleted(id, execution.id, 1, repair.invocationId)).toBe(true);
        expect(database.scopedAgentTaskCompleted(id, execution.id, 1, "foreign-native-turn")).toBe(false);
        for (const action of ["checkpoint", "worktree.create", "merge.prepare", "merge.integrate"] as const) {
          expect(() => database.assertScopedGitExecutionOwnership({ projectId: id, executionId: execution.id,
            ownershipEpoch: 1, expectedBranch: execution.executionBranch, operation: action })).toThrow();
        }
      }
      expect(database.recordedGitOperation(id, operation.id)).toEqual(operation);
      expect(database.scopedAgentTaskCompletion(id, execution.id, 1)).toEqual(completion);
      expect(database.scopedAgentReport(id, execution.id, 1)).toBeUndefined();
      expect(database.scopedAgentMechanismRepairCount(id, execution.id)).toBe(2);
      expect(database.scopedExecution(id, execution.id)).toMatchObject({ status: "running", ownershipEpoch: 1,
        executionBranch: execution.executionBranch, worktreePath: execution.worktreePath });
    });

  it("cancellation refuses live native owners, closes no foreign PR, and settles idempotently retaining evidence", async () => {
    const f = await fixture(); const execution = await reserveInterrupted(f, false);
    f.database.appendEvent({ projectId: id, requestId: "cancel", type: "project.cancellation.requested", payload: { actor: "user" } });
    expect(() => f.database.settleScopedProjectCancellation(id)).toThrow(/native stop/);
    expect(() => f.database.claimScopedLeaderTurn({ projectId: id, groupRunId: "run-G", agentId: "main", invocationId: "no-launch" })).toThrow();
    await f.runtime.reconcileResidents();
    const foreign = { id: "pull", providerNumber: 1, owner: "wrong", repository: repository.name, htmlUrl: `${repository.htmlUrl}/pull/1`,
      head: execution.executionBranch, base: "groups/run-G", headSha: "a".repeat(40), ownerExecutionId: execution.id, status: "closed" as const, checks: [], observedAt: repository.observedAt };
    expect(() => f.database.recordScopedCancellationPull({ projectId: id, executionId: execution.id, ownershipEpoch: 1, pull: foreign })).toThrow(/exact owned/);
    f.database.recordScopedCancellationPull({ projectId: id, executionId: execution.id, ownershipEpoch: 1 });
    f.database.settleScopedProjectCancellation(id);
    const projection = f.database.projectState(id);
    expect(projection.scopedExecutions?.[0]).toMatchObject({ status: "cancelled", executionBranch: execution.executionBranch, worktreePath: execution.worktreePath });
    expect(projection.scopedGroupRuns?.[0].status).toBe("cancelled");
    expect(projection.activeNodeRunId).toBeUndefined();
    f.database.settleScopedProjectCancellation(id); expect(f.database.projectState(id).stateRevision).toBe(projection.stateRevision);
    expect(f.database.scopedAgentTurn(id, execution.id, 1)?.status).toBe("stopped");
  });

  it("automatically queues the same Main entity's nested Leader turns and retries only the failed Agent using the retained session/branch", async () => {
    const f = await fixture(false, { nested: true, failIdeaOnce: true, recovery: "retry" });
    await f.runtime.activate({ projectId: id, groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G", workflowRevision: 1,
      outer: { nodeRunId: "node-G", inputSnapshotRef: "project:requirement", activatedByAgentId: "main" } });
    expect((await advanceUntilTerminal(f)).status).toBe("completed");
    const idea = f.opened.filter((entry) => entry.controlScope?.role === "scoped-agent" && !entry.controlScope.executionId.startsWith("group-final-") && entry.request.agent === "idea");
    expect(idea).toHaveLength(2); expect(idea[1].request.resumeThreadId).toBe("session-idea");
    expect(idea[1].request.workspacePath).toBe(idea[0].request.workspacePath);
    expect(idea[1].request.executionContext?.executionId).toBe(idea[0].request.executionContext?.executionId);
    expect(f.opened.filter((entry) => entry.controlScope?.role === "scoped-agent" && !entry.controlScope.executionId.startsWith("group-final-") && entry.request.agent === "execution")).toHaveLength(1);
    expect(f.database.projectState(id).scopedExecutions?.find((entry) => entry.agentId === "idea")?.ownershipEpoch).toBe(2);
    expect(f.database.projectState(id).tasks).toEqual([]); expect(f.handles.size).toBe(0);
  });

  it("retains the conflicting PR and lets the original Agent request preparation in its resumed session", async () => {
    const f = await fixture(false, { recovery: "retry" }); f.git.conflictedAgent = "idea";
    await f.runtime.activate({ projectId: id, groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G", workflowRevision: 1,
      outer: { nodeRunId: "node-G", inputSnapshotRef: "project:requirement", activatedByAgentId: "main" } });
    expect((await advanceUntilTerminal(f)).status).toBe("completed");
    const turns = f.opened.filter((entry) => entry.controlScope?.role === "scoped-agent" && !entry.controlScope.executionId.startsWith("group-final-") && entry.request.agent === "idea");
    const retried = turns.find((entry) => entry.request.executionContext?.ownershipEpoch === 2)!;
    expect(retried.request.resumeThreadId).toBe("session-idea");
    expect(retried.request.workspacePath).toBe(turns[0].request.workspacePath);
    expect(retried.request.invocationId).not.toBe(turns[0].request.invocationId);
    expect(contextSourceText(retried.request)).toContain("Retained PR repair");
    expect(await readFile(retried.request.inboxPath, "utf8")).not.toContain("Retained PR repair");
    expect(f.git.closePullRequest).not.toHaveBeenCalled(); expect(f.git.prepareConflictResolution).toHaveBeenCalledTimes(1);
    const execution = f.database.projectState(id).scopedExecutions!.find((entry) => entry.id === retried.request.executionContext!.executionId)!;
    expect(f.database.scopedRecoveryPull(id, execution.id, 1)).toMatchObject({ status: "conflicted",
      providerNumber: f.git.pulls.get(execution.id)!.providerNumber });
    expect(f.git.log.some((entry) => entry.kind === "close")).toBe(false);
  });

  it("escalates J → H → G → GLOBAL Main, then asks the original Leader to plan an explicit skipped continuation", async () => {
    const f = await fixture(false, { nested: true, failIdeaOnce: true, recovery: "skip" });
    await f.runtime.activate({ projectId: id, groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G", workflowRevision: 1,
      outer: { nodeRunId: "node-G", inputSnapshotRef: "project:requirement", activatedByAgentId: "main" } });
    expect((await advanceUntilTerminal(f)).status).toBe("completed");
    const managers = f.opened.filter((entry) => (entry.controlScope?.role === "scoped-leader" || entry.controlScope?.role === "scoped-main") && entry.controlScope.failedArrivalRequestIds.length);
    expect(managers.map((entry) => [f.database.scopedGroupRun(id, entry.controlScope!.groupRunId)?.groupId, entry.controlScope!.role]))
      .toEqual([["J", "scoped-leader"], ["H", "scoped-leader"], ["G", "scoped-leader"], ["G", "scoped-main"]]);
    for (const manager of managers) {
      const scope = manager.controlScope!;
      expect(scope.recoveryOptions?.map(option => option.arrivalRequestId)).toEqual(scope.failedArrivalRequestIds);
      expect(scope.recoveryOptions?.[0].allowedOperations).toEqual(scope.role === "scoped-main" ? ["retry", "skip"] : ["retry", "escalate"]);
      expect(contextSourceText(manager.request)).toContain("Current recoveryOptions:");
    }
    const execution = f.database.projectState(id).scopedExecutions!.find((entry) => entry.agentId === "idea")!;
    expect(execution.status).toBe("stopped");
    const arrival = f.database.scopedArrivals(execution.groupRunId).find((entry) => entry.requestId === execution.arrivalRequestId)!;
    expect(arrival.status).toBe("skipped"); expect(f.database.scopedAgentReport(id, execution.id, 1)).toBeUndefined();
    expect(f.database.eventByRequestId(id, `scoped-skip-continuation:${arrival.requestId}`)).toBeDefined();
    expect(f.opened.filter((entry) => entry.controlScope?.role === "scoped-agent" && !entry.controlScope.executionId.startsWith("group-final-") && entry.request.agent === "idea")).toHaveLength(1);
    expect(f.database.projectState(id).scopedAgentMerges?.some((merge) => merge.executionId === execution.id)).toBe(false);
  });

  it("keeps disabled user intervention out of Global Main recovery capabilities, S receipts and project state", async () => {
    const f = await fixture(false, { nested: true, allowUserIntervention: false, failIdeaOnce: true, recovery: "user" });
    const flags: boolean[] = [];
    const directRejections: string[] = [];
    const originalOpen = f.launcher.open.getMockImplementation()!;
    f.launcher.open.mockImplementation(async input => originalOpen({ ...input, controlAuthorityFactory: async args => {
      const authority = await input.controlAuthorityFactory!(args);
      const scope = input.controlScope!;
      if (scope.role === "scoped-main") {
        flags.push(authority.control.allowUserIntervention);
        const envelope: ControlActionEnvelope = { projectId: id, agent: input.request.agent, invocationId: args.turn.invocationId,
          stateVersion: scope.coordinatorEpoch, callId: "forged-user", capabilityHash: authority.control.capabilityHash!, receivedAt: repository.observedAt,
          action: { tool: "request_user", message: "Forbidden question", rationale: "Cannot bypass disabled intervention" } };
        try {
          f.database.revalidateScopedLeaderAction({ projectId: id, groupRunId: scope.groupRunId, agentId: input.request.agent,
            invocationId: args.turn.invocationId, coordinatorEpoch: scope.coordinatorEpoch, globalMain: true, envelope });
          directRejections.push("ALLOWED");
        } catch (error) { directRejections.push(error instanceof Error ? error.message : String(error)); }
      }
      return authority;
    } }));
    await f.runtime.activate({ projectId: id, groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G", workflowRevision: 1,
      outer: { nodeRunId: "node-G", inputSnapshotRef: "project:requirement", activatedByAgentId: "main" } });
    await advanceUntilTerminal(f);
    expect(flags.length).toBeGreaterThan(0);
    expect(flags.every(flag => flag === false)).toBe(true);
    expect(directRejections.every(reason => reason.includes("User intervention is disabled"))).toBe(true);
    expect(f.state.userIntervention).toBeUndefined();
    expect(f.state.phase).not.toBe("user-intervention-required");
    expect(f.database.eventsAfter(id, 0, 10_000).some(event => event.type === "user.intervention.requested")).toBe(false);
    expect(f.database.scopedAcceptedLeaderActions(id, "run-G").some(receipt => receipt.envelope.action.tool === "request_user")).toBe(false);
  });

  it("preserves all queues at user escalation, waits without another Main call, and resumes only the retained failed Agent after the reply", async () => {
    const f = await fixture(false, { nested: true, failIdeaOnce: true, recovery: "user", failLeaderGroup: "J" });
    await f.runtime.activate({ projectId: id, groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G", workflowRevision: 1,
      outer: { nodeRunId: "node-G", inputSnapshotRef: "project:requirement", activatedByAgentId: "main" } });
    expect((await advanceUntilTerminal(f)).status).toBe("waiting");
    expect(f.state.userIntervention?.status).toBe("pending"); const count = f.opened.length;
    await f.runtime.advance("run-G"); expect(f.opened).toHaveLength(count);
    expect(f.database.projectState(id).scopedExecutions?.find((entry) => entry.agentId === "execution")?.status).toBe("completed");
    const pending = f.state.userIntervention!; f.state.userIntervention = { ...pending, status: "answered", response: "Retry in the original session" };
    f.database.appendEvent({ projectId: id, requestId: `user-response-${pending.id}`, type: "user.intervention.answered", payload: { interventionId: pending.id } });
    f.scenario.recovery = "retry";
    expect((await f.runtime.advance("run-G")).status).toBe("completed");
    expect(f.state.userIntervention).toBeUndefined();
    expect(f.opened.filter((entry) => entry.controlScope?.role === "scoped-agent" && !entry.controlScope.executionId.startsWith("group-final-") && entry.request.agent === "execution")).toHaveLength(1);
    expect(f.opened.filter((entry) => entry.controlScope?.role === "scoped-agent" && !entry.controlScope.executionId.startsWith("group-final-") && entry.request.agent === "idea")).toHaveLength(2);
  });

  it("keeps superseded user replies as history and does not restore them after a newer reply was consumed across restart", async () => {
    const f = await fixture(false, { nested: true, failIdeaOnce: true, recovery: "user" });
    await f.runtime.activate({ projectId: id, groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G", workflowRevision: 1,
      outer: { nodeRunId: "node-G", inputSnapshotRef: "project:requirement", activatedByAgentId: "main" } });
    await advanceUntilTerminal(f);
    const first = f.state.userIntervention!;
    f.database.appendEvent({ projectId: id, requestId: `user-response-${first.id}`, type: "user.intervention.answered",
      payload: { interventionId: first.id, answeredAt: repository.observedAt, response: "Earlier user instruction" } });
    f.state.userIntervention = { ...first, status: "answered", response: "Earlier user instruction" };
    await advanceUntilTerminal(f);
    const latest = f.state.userIntervention!;
    expect(latest.id).not.toBe(first.id);
    f.database.appendEvent({ projectId: id, requestId: `user-response-${latest.id}`, type: "user.intervention.answered",
      payload: { interventionId: latest.id, answeredAt: repository.observedAt, response: "Latest user instruction: retry in the original session" } });
    // Simulate a file publication crash leaving an older request in state.json.
    f.state.userIntervention = { ...first, status: "answered", response: "Earlier user instruction" };
    f.scenario.recovery = "retry";
    expect((await advanceUntilTerminal(f)).status).toBe("completed");
    const manager = f.opened.filter(input => input.controlScope?.role === "scoped-main").at(-1)!;
    expect(await readFile(manager.request.inboxPath, "utf8")).toContain("Latest user instruction: retry in the original session");
    expect(f.state.userIntervention).toBeUndefined();
    expect(f.database.eventByRequestId(id, `scoped-user-consumed:${latest.id}`)).toBeDefined();
    expect(f.database.eventByRequestId(id, `scoped-user-consumed:${first.id}`)).toBeUndefined();
    const opened = f.opened.length;
    f.database.close();
    const database = CollaborationStateDatabase.open({ ...f.options, instanceId: "reply-recovery", now: () => 2_000_000 });
    stores.push(database);
    const git = new ScopedRuntimeGit(database, id); git.restoreProviderState(f.git);
    const runtime = new ScopedProjectRuntime({ ...f.dependencies, database, git,
      publish: async () => { await f.storage.saveState(f.state); } });
    f.state.userIntervention = { ...first, status: "answered", response: "Earlier user instruction" };
    await runtime.advance("run-G");
    expect(f.state.userIntervention).toBeUndefined();
    expect(f.opened).toHaveLength(opened);
    expect(database.eventByRequestId(id, `user-response-${first.id}`)).toBeDefined();
  });

  it("restores a durable user reply when file publication crashed before Main resumed", async () => {
    const f = await fixture(false, { nested: true, failIdeaOnce: true, recovery: "user" });
    await f.runtime.activate({ projectId: id, groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G", workflowRevision: 1,
      outer: { nodeRunId: "node-G", inputSnapshotRef: "project:requirement", activatedByAgentId: "main" } });
    await advanceUntilTerminal(f); const pending = f.state.userIntervention!;
    f.database.appendEvent({ projectId: id, requestId: `user-response-${pending.id}`, type: "user.intervention.answered",
      payload: { interventionId: pending.id, answeredAt: repository.observedAt, response: "Retry without replacing the session" } });
    f.state.userIntervention = undefined; f.scenario.recovery = "retry";
    expect((await f.runtime.advance("run-G")).status).toBe("completed");
    const global = f.opened.filter((entry) => entry.controlScope?.role === "scoped-main").at(-1)!;
    expect(await readFile(global.request.inboxPath, "utf8")).toContain("Retry without replacing the session");
    expect(f.state.userIntervention).toBeUndefined();
  });
});

async function reserveInterrupted(f: Awaited<ReturnType<typeof fixture>>, report: boolean) {
  await f.runtime.activate({ projectId: id, groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G", workflowRevision: 1,
    outer: { nodeRunId: "node-G", inputSnapshotRef: "project:requirement", activatedByAgentId: "main" } });
  const arrival = f.database.scopedArrivals("run-G").find((entry) => entry.agentId === "idea")!;
  const execution = f.database.claimScopedAgentArrival({ projectId: id, arrivalRequestId: arrival.requestId, agentId: "idea", executionId: "interrupted-idea",
    worktreePath: path.join(f.storage.projectDir(id), "git-worktrees", "agents", "idea") })!.execution;
  const invocationId = "inv_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  const identity = { projectId: id, executionId: execution.id, ownershipEpoch: 1, invocationId };
  f.database.beginScopedAgentTurn({ ...identity, runtimePath: await f.storage.invocationRuntimePath(id, invocationId), baseCommit: "b".repeat(40) });
  f.database.markScopedAgentTurnOpened({ ...identity, nativeProcessOpened: true });
  if (report) f.database.recordScopedAgentReport({ ...identity, output: "Durable original result", residentTurnCompleted: true, residentStopConfirmed: true });
  return execution;
}

async function advanceUntilTerminal(f: Awaited<ReturnType<typeof fixture>>, limit = 12) {
  let result!: Awaited<ReturnType<typeof f.runtime.advance>>;
  for (let attempt = 0; attempt < limit; attempt += 1) {
    result = await f.runtime.advance("run-G");
    if (result.status === "completed" || f.state.userIntervention?.status === "pending") return result;
  }
  return result;
}
