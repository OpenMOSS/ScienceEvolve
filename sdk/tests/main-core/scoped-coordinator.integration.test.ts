import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CollaborationRuntimeCoordinator, ProductionCollaborationExecutionInputBuilder,
  type CollaborationResidentLauncher, type CollaborationResidentOpenInput } from "../../src/core/collaboration-runtime.js";
import { ProjectStorage } from "../../src/core/storage.js";
import { CollaborationStateDatabase } from "../../src/core/collaboration-state/store.js";
import { EventHub } from "../../src/core/event-hub.js";
import { SkillCatalog } from "../../src/core/skill-catalog.js";
import { cloneAgentOrchestrationTemplate } from "../../src/core/agent-orchestration.js";
import { mergeAgentConfigs, normalizeAgentOrchestrationTemplate } from "../../src/core/validation.js";
import { emptyProjectComputeUsage } from "../../src/core/inspire-compute-usage.js";
import { ScopedRuntimeGit } from "./helpers/scoped-runtime-git.js";
import { mergedPullSynchronizationOperationId, prepareOperation, finalizeOperation } from "../../src/core/collaboration-git/operation.js";
import { HarnessRuntimeError } from "../../src/core/harness-runtime/errors.js";
import { hasUserWorkflowPause } from "../../src/core/workflow-recovery.js";
import { validateStagedInvocationInputs, prepareInvocationInputs } from "../../src/core/harness-runtime/invocation-inputs.js";
import type { ControlAction, ControlActionEnvelope, ProjectState } from "../../src/core/types.js";

const roots: string[] = [];
const coordinators: CollaborationRuntimeCoordinator[] = [];
afterEach(async () => {
  await Promise.all(coordinators.splice(0).map((entry) => entry.shutdown()));
  await Promise.all(roots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true })));
});
const repository = { provider: "github" as const, providerId: 1, owner: "example", name: "openfars", private: true,
  defaultBranch: "main", htmlUrl: "https://github.com/example/openfars", cloneUrl: "https://github.com/example/openfars.git", observedAt: "2026-09-30T00:00:00Z" };

async function fixture(options: { inputTarget?: "main" | "G"; workspace?: boolean; nestedLoop?: boolean; mainCreatesGroups?: boolean; blockScopedAgent?: string; blockScopedOpen?: string; blockFinalOpen?: string; blockScopedTurns?: number; weakRootIntervention?: boolean; childHandoff?: boolean; omitFirstRootGit?: boolean; omitFirstFinish?: string; blockFinalAgent?: string; queueIdeaSibling?: boolean; legacyRoot?: boolean; now?: () => number } = {}) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-scoped-coordinator-")); roots.push(root);
  const hub = new EventHub(); const storage = new ProjectStorage(root, hub); await storage.initialize();
  const id = "prj_12345678901234567890123456789012";
  const orchestration = cloneAgentOrchestrationTemplate(); orchestration.schemaVersion = 3;
  orchestration.input.target = options.inputTarget ?? "main";
  orchestration.collaborations = ["G", "H"].map((id) => ({ id, displayName: id, memberAgentIds: [], renamePolicy: "editable" as const }));
  orchestration.routes.main = [{ kind: "weak", target: "G" }, { kind: "weak", target: "finish" }];
  orchestration.routes.G = [{ kind: "strong", target: "execution" }];
  orchestration.routes.execution = [{ kind: "strong", target: "finish" }];
  orchestration.termination.agent = "execution";
  orchestration.routes.review = [{ kind: "strong", target: "main" }];
  orchestration.scopedWorkflow = { schemaVersion: 1, rootAgentIds: orchestration.agents.map((agent) => agent.name), groups: [
    { id: "G", leaderAgentId: "main", allowLeaderReconfiguration: false, workflow: {
      nodes: [{ kind: "agent", nodeId: "G_execution", agentId: "execution" }, { kind: "collaboration", nodeId: "G_H", groupId: "H" }],
      input: { source: "input", edges: ["G_execution", "G_H"].map((target) => ({ kind: "parallel", target })) },
      routes: { G_execution: [{ kind: "strong", target: "finish" }], G_H: [{ kind: "strong", target: "finish" }] } } },
    { id: "H", parentGroupId: "G", leaderAgentId: "main", allowLeaderReconfiguration: false, workflow: {
      nodes: [{ kind: "agent", nodeId: "H_idea", agentId: "idea" }], input: { source: "input", edges: [{ kind: "parallel", target: "H_idea" }] },
      routes: { H_idea: [{ kind: "strong", target: "finish" }] } } }
  ] };
  if (options.nestedLoop) {
    const workflow = orchestration.scopedWorkflow.groups[1].workflow;
    workflow.nodes.push({ kind: "agent", nodeId: "H_review", agentId: "review" }, { kind: "agent", nodeId: "H_exit", agentId: "idea" });
    workflow.routes.H_idea = [{ kind: "strong", target: "H_review" }];
    workflow.routes.H_review = [{ kind: "strong", target: "H_idea" }];
    workflow.routes.H_exit = [{ kind: "strong", target: "finish" }];
    workflow.loops = [{ id: "repeat", from: "H_review", to: "H_idea", maxIterations: 2, exitTo: "H_exit" }];
  }
  if (options.childHandoff) {
    const parent = orchestration.scopedWorkflow.groups[0].workflow;
    parent.input.edges = [{ kind: "parallel", target: "G_H" }];
    parent.routes.G_H = [{ kind: "strong", target: "G_execution" }];
  }
  orchestration.allowMainReconfiguration = options.mainCreatesGroups === true;
  if (options.weakRootIntervention) orchestration.routes.G = [{ kind: "weak", target: "execution" }];
  if (options.queueIdeaSibling) {
    const nested = orchestration.scopedWorkflow.groups[1].workflow;
    nested.nodes.push({ kind: "agent", nodeId: "H_idea_next", agentId: "idea" });
    nested.input.edges.push({ kind: "parallel", target: "H_idea_next" });
    nested.routes.H_idea_next = [{ kind: "strong", target: "finish" }];
  }
  if (options.legacyRoot) {
    orchestration.schemaVersion = 2;
    delete orchestration.scopedWorkflow;
    orchestration.collaborations = [];
    delete orchestration.routes.G;
    orchestration.routes.main = [{ kind: "weak", target: "execution" }, { kind: "weak", target: "finish" }];
  }
  if (options.nestedLoop) Object.assign(orchestration, normalizeAgentOrchestrationTemplate(orchestration));
  const desiredWorkflow = structuredClone(orchestration);
  if (options.mainCreatesGroups) {
    orchestration.collaborations = []; orchestration.scopedWorkflow.groups = [];
    delete orchestration.routes.G;
    orchestration.routes.main = [{ kind: "weak", target: "execution" }, { kind: "weak", target: "finish" }];
  }
  const agents = mergeAgentConfigs(undefined, orchestration);
  for (const agent of Object.values(agents)) { agent.sessionPersistence = false; agent.skills = []; agent.autoSkills = []; agent.mcpServers = []; agent.decisionBy = "agent"; }
  if (options.nestedLoop) {
    agents.main.decisionBy = "main";
    agents.main.sessionPersistence = true;
  }
  if (options.mainCreatesGroups) {
    agents.main.gatewayId = "gwy_" + "a".repeat(32);
    agents.main.gatewaySnapshot = { id: agents.main.gatewayId, name: "Accepted Main gateway", url: "https://controlled.invalid/v1",
      apiKey: "private-original-main-route", models: [agents.main.model], defaultModel: agents.main.model, protocol: "responses" };
  }
  const zero = { inputTokens: 0, cachedInputTokens: 0, outputTokens: 0, totalTokens: 0, invocations: 0 };
  const state: ProjectState = { id, title: "Scoped coordinator", requirement: "Nested group, then the same outer Agent.",
    status: "queued", phase: "git:initializing", createdAt: repository.observedAt, updatedAt: repository.observedAt,
    turn: 0, cycle: 1, eventSeq: 0, consecutiveFailures: 0, completionGeneration: 0, controlProtocol: "natural-language-tools-v1",
    runCounts: {}, mainInvocationSeq: 0, agents, orchestration, userInputs: [], tokenUsage: { ...zero, byAgent: {} },
    computeUsage: emptyProjectComputeUsage(), workflowRevision: 1,
    git: { enabled: true, status: "authorizing", initialization: { operationId: `git-init-${id}`, attempt: 1, completedSteps: [] } } };
  if (options.workspace) {
    state.git = { enabled: false, status: "disabled" };
    state.phase = "collaboration:ready";
  }
  await storage.createProject(state);
  const opened: CollaborationResidentOpenInput[] = []; const active = new Set<string>(); const seenCwd = new Map<string, string>();
  const opening: CollaborationResidentOpenInput[] = [];
  const paused: string[] = []; const resumed: string[] = [];
  let coordinator!: CollaborationRuntimeCoordinator; let git!: ScopedRuntimeGit;
  let releaseBlocked!: () => void;
  const block = new Promise<void>((resolve) => { releaseBlocked = resolve; });
  let blockedTurns = 0; let requestedRootUser = false; let controlCallSequence = 0; let rootGitOmitted = false; let finishOmitted = false;
  const authorities = new Map<string, Awaited<ReturnType<NonNullable<CollaborationResidentOpenInput["controlAuthorityFactory"]>>>>();
  const prepare = async (input: CollaborationResidentOpenInput) => {
    expect(active.has(input.request.agent)).toBe(false); active.add(input.request.agent); opened.push(input);
    const prior = seenCwd.get(input.request.agent); if (prior) expect(input.request.workspacePath).toBe(prior);
    seenCwd.set(input.request.agent, input.request.workspacePath);
    if (options.childHandoff && input.controlScope?.role === "scoped-agent" && !input.controlScope.executionId.startsWith("group-final-") && input.request.agent === "execution") {
      const projection = await coordinator.database().projectState(id);
      const child = projection.scopedGroupRuns!.find((group) => group.groupId === "H")!;
      expect(child.status).toBe("completed"); expect(projection.scopedGroupFinalMerges?.some((merge) => merge.groupRunId === child.id) ?? false).toBe(!options.workspace);
    }
    if (input.inputs) await validateStagedInvocationInputs({ projectId: id, invocationId: input.request.invocationId,
      ...input.inputs, ...(input.request.project.orchestration.schemaVersion === 3
        ? { fixedAgentId: input.request.agent, ...(options.workspace ? { projectWorkspace: path.join(storage.projectDir(id), "workspaces") } : {}) } : {}) });
    else await prepareInvocationInputs(input.request);
    if (input.controlScope?.role === "scoped-leader" || input.controlScope?.role === "scoped-main") {
      const inbox = await fs.readFile(input.request.inboxPath, "utf8");
      expect(input.request.executionContext).toMatchObject({ groupRunId: input.controlScope.groupRunId,
        coordinatorEpoch: input.controlScope.coordinatorEpoch });
      expect(inbox).not.toContain("Current control identity:");
      expect(inbox).toContain("来源：");
    }
    await input.onOpened?.();
  };
  const session = async (input: CollaborationResidentOpenInput) => {
    const nativeId = `session-${input.request.agent}`;
    expect(input.request.resumeThreadId ?? nativeId).toBe(nativeId);
    await input.request.onDurableSessionStarted!({ schemaVersion: 1, harnessId: input.request.project.agents[input.request.agent].harness!,
      adapterVersion: "controlled-native", nativeId, generation: 1, durable: true, createdAt: repository.observedAt }, nativeId);
    await input.request.onTokenUsage!({ usageId: `usage-${input.request.invocationId}`, model: "controlled-model", protocol: "responses",
      inputTokens: 1, cachedInputTokens: 0, outputTokens: 1, totalTokens: 2 });
  };
  const accept = async (input: CollaborationResidentOpenInput, turn: { inputId: string; invocationId: string; prompt: string }, action: ControlAction) => {
    const authority = authorities.get(turn.invocationId) ?? await input.controlAuthorityFactory!({ request: input.request, turn });
    authorities.set(turn.invocationId, authority);
    const envelope: ControlActionEnvelope = { schemaVersion: 1, projectId: id, agent: input.request.agent,
      invocationId: turn.invocationId, stateVersion: authority.control.stateVersion, capabilityHash: authority.control.capabilityHash!,
      callId: `action-${turn.invocationId}-${++controlCallSequence}`, receivedAt: new Date().toISOString(), action };
    await authority.revalidate(envelope, []);
    if (["git_push", "github_create_pr", "github_merge_pr", "github_get_pr", "git_prepare_conflict"].includes(action.tool)) {
      await authority.execute!(envelope);
    }
    return envelope;
  };
  const launcher: CollaborationResidentLauncher = {
    stopScopedForRecovery: vi.fn(async (input) => {
      active.delete(input.agentId);
      return { stopped: true, evidence: { protocol: "scoped-supervisor-stop-v1", projectId: id, agentId: input.agentId,
        scopeId: input.scopeId, role: input.role, ownershipEpoch: input.ownershipEpoch, runtimePath: input.executionRuntimePath, nativeProcessScanCleared: true } };
    }),
    open: vi.fn(async (input) => {
      const scope = input.controlScope;
      if (scope?.role === "scoped-agent" && input.request.agent === (scope.executionId.startsWith("group-final-")
        ? options.blockFinalOpen : options.blockScopedOpen)) {
        opening.push(input);
        await new Promise<void>((resolve, reject) => {
          const abort = () => reject(new Error("Controlled native opening stop confirmed"));
          if (input.signal?.aborted) { abort(); return; }
          input.signal?.addEventListener("abort", abort, { once: true });
          block.then(resolve).finally(() => input.signal?.removeEventListener("abort", abort));
        });
      }
      await prepare(input);
      return { pause: vi.fn(async () => { paused.push(input.request.invocationId); }),
        resume: vi.fn(async () => { resumed.push(input.request.invocationId); }), close: vi.fn(async () => { active.delete(input.request.agent); }),
        submit: vi.fn(async (turn) => {
          await session(input); const scope = input.controlScope;
          if (scope?.role === "scoped-agent" && input.request.agent === (scope.executionId.startsWith("group-final-")
            ? options.blockFinalAgent : options.blockScopedAgent) && blockedTurns < (options.blockScopedTurns ?? 1)) {
            blockedTurns += 1;
            await new Promise<void>((resolve, reject) => {
              const abort = () => reject(new Error("Controlled native stop confirmed"));
              if (input.signal?.aborted) { abort(); return; }
              input.signal?.addEventListener("abort", abort, { once: true });
              block.then(resolve).finally(() => input.signal?.removeEventListener("abort", abort));
            });
          }
          const actions: ControlActionEnvelope[] = [];
          const rootTask = scope?.role === "execution-artifact" || scope?.role === "standalone-route";
          const businessTask = rootTask || scope?.role === "scoped-agent";
          if (options.nestedLoop && options.workspace && input.request.agent === "execution" && businessTask) {
            const name = rootTask ? "root-result.txt" : "group-result.txt";
            await fs.writeFile(path.join(input.request.workspacePath, name), "Verified workspace result");
            actions.push(await accept(input, turn, { tool: "publish_artifact", path: name,
              title: name, kind: "text", description: "Result from this execution" }));
          }
          const omitOwnFinish = options.omitFirstFinish === input.request.agent && scope?.role === "scoped-agent" &&
            !scope.executionId.startsWith("group-final-") && !finishOmitted;
          if (omitOwnFinish) finishOmitted = true;
          else if (businessTask) {
            // Completion records the Agent's handoff without changing Git.
            actions.push(await accept(input, turn, { tool: "finish_task", summary: `Verified ${input.request.agent}'s assigned task` }));
          }
          if (!options.workspace && (scope?.role === "execution-artifact" || scope?.role === "standalone-route") && !(options.omitFirstRootGit && !rootGitOmitted)) {
            const prior = git.pulls.get(scope.executionId);
            const delivered = prior?.status === "merged" && prior.headSha === git.localRefs.get(prior.head) &&
              git.localRefs.get("main") === git.refs.get("main");
            // A retained native continuation repairs its missing formal action;
            // it does not publish the same already merged head as a new PR.
            if (!delivered) {
              actions.push(await accept(input, turn, { tool: "git_push", reason: "Commit root delivery" }));
              actions.push(await accept(input, turn, { tool: "github_create_pr", base: "main", title: "Root delivery", body: "Root delivery" }));
              actions.push(await accept(input, turn, { tool: "github_merge_pr", providerNumber: git.pulls.get(scope.executionId)!.providerNumber, reason: "Integrate root delivery" }));
            }
          }
          if (scope?.role === "scoped-agent" && scope.executionId.startsWith("group-final-")) {
            const final = (await coordinator.database().scopedFinalIntegration(id, scope.groupRunId))!;
            if (git.pulls.get(final.id)?.status !== "merged") actions.push(await accept(input, turn, {
              tool: "github_create_pr", base: final.integrationTarget, title: "Canonical group delivery", body: "Canonical group delivery" }));
            actions.push(await accept(input, turn, { tool: "github_merge_pr", providerNumber: git.pulls.get(final.id)!.providerNumber,
              reason: "Integrate the Leader-assigned canonical group delivery" }));
          }
          if (!options.workspace && scope?.role === "scoped-agent" && !scope.executionId.startsWith("group-final-") &&
            !(turn.prompt.includes("Missing formal mechanism actions:") && git.pulls.get(scope.executionId)?.status === "merged")) {
            const execution = (await coordinator.database().scopedExecution(id, scope.executionId))!;
            const group = (await coordinator.database().scopedGroupRun(id, scope.groupRunId))!;
            actions.push(await accept(input, turn, { tool: "git_push", reason: `Commit ${input.request.agent}` }));
            actions.push(await accept(input, turn, { tool: "github_create_pr", base: group.groupBranch,
              title: `Delivery ${execution.agentId}`, body: `Delivery ${execution.id}` }));
            actions.push(await accept(input, turn, { tool: "github_merge_pr", providerNumber: git.pulls.get(execution.id)!.providerNumber,
              reason: "Integrate this delivery into its direct group" }));
          }
          if (scope?.role === "execution-artifact" || scope?.role === "standalone-route") rootGitOmitted = true;
          // Own-task completion keeps the current channel available for the
          // Leader's separate group operation, exactly as the native MCP does.
          if (!businessTask) actions.push(await accept(input, turn, { tool: "finish_task" }));
          if (scope?.role === "scoped-leader") {
            if (input.request.workflowContext?.purpose === "complete") {
              const proof = await coordinator.database().scopedGroupFinalMergeFact(id, scope.groupRunId);
              const action: ControlAction = proof || options.workspace
                ? { tool: "complete_group", groupRunId: scope.groupRunId, coordinatorEpoch: scope.coordinatorEpoch,
                    output: `Committed ${input.request.agent}` }
                : { tool: "request_group_integration", groupRunId: scope.groupRunId, coordinatorEpoch: scope.coordinatorEpoch,
                    integrationOwnerAgentId: (await coordinator.database().scopedGroupWorkflow(id, scope.groupRunId)).nodes
                      .filter((node) => node.kind === "agent").find((node) => node.agentId !== input.request.agent)!.agentId };
              actions.push(await accept(input, turn, action));
            } else if (scope.failedArrivalRequestIds.length) {
              actions.push(await accept(input, turn, { tool: "coordinate_group_task", groupRunId: scope.groupRunId,
                coordinatorEpoch: scope.coordinatorEpoch, arrivalRequestId: scope.failedArrivalRequestIds[0],
                operation: "retry", rationale: "Resume the retained failed task" }));
            } else actions.push(await accept(input, turn, { tool: "assign_group_tasks", groupRunId: scope.groupRunId,
              coordinatorEpoch: scope.coordinatorEpoch, tasks: scope.memberNodeIds.map((taskId) => ({ taskId, assignment: `Execute ${taskId}` })) }));
          }
          return { handoff: `Committed ${input.request.agent}`, controlActions: actions };
        }) };
    }),
    decideRoute: vi.fn(async (input) => {
      await prepare(input.open); await session(input.open);
      const completed = options.legacyRoot
        ? (await coordinator.database().projectState(id)).executions.some((execution) => execution.agentId === "execution" && execution.status === "succeeded")
        : state.scopedGroupRuns?.some((group) => group.groupId === "G" && group.status === "completed");
      let action: ControlAction = completed ? { tool: "complete_project", rationale: "Both nested group and outer Agent delivered through their PRs." }
        : { tool: "route_to_agent", target: options.legacyRoot ? "execution" : "G", assignment: "Execute the existing workflow.", rationale: "Use the existing graph" };
      if (options.mainCreatesGroups && !state.orchestration.scopedWorkflow?.groups.length) {
        const proposalPath = input.open.inputs!.workflowAuthoringPath!;
        const proposal = JSON.parse(await fs.readFile(proposalPath, "utf8"));
        expect(proposal.schemaVersion).toBe(2);
        expect(proposal.lockedRuntime.main.gatewayName).toBe("Accepted Main gateway");
        expect(JSON.stringify(proposal)).not.toContain("private-original-main-route");
        expect(input.open.inputs!.workflowCurrentPath).toEqual(expect.any(String));
        const reference = JSON.parse(await fs.readFile(input.open.inputs!.workflowCurrentPath!, "utf8"));
        expect(reference.baseHash).toBe(proposal.baseHash);
        expect(reference.lockedRuntime).toEqual(proposal.lockedRuntime);
        proposal.orchestration = desiredWorkflow;
        await fs.writeFile(proposalPath, `${JSON.stringify(proposal)}\n`);
        action = { tool: "apply_workflow", rationale: "Create nested collaboration nodes from existing Agents." };
      } else if (options.weakRootIntervention && completed && input.open.controlScope?.role === "main-route") {
        action = requestedRootUser
          ? { tool: "route_to_agent", target: "execution", assignment: "Continue the requested outer Agent after group delivery.", rationale: "User confirmed" }
          : { tool: "request_user", message: "Continue with the outer Agent?", rationale: "Ask before the weak root route" };
        requestedRootUser = true;
      }
      const finish = await accept(input.open, input.turn, { tool: "finish_task" });
      const envelope = await accept(input.open, input.turn, action);
      active.delete("main");
      return { targetNodeId: action.tool === "apply_workflow" ? "main" : action.tool === "request_user" ? "user" : action.tool === "route_to_agent" ? action.target : "finish", decisionRequestId: envelope.callId, terminalAction: action as never,
        ...(action.tool === "request_user" ? { intervention: action } : {}),
        output: "Main management only", controlActions: [finish, envelope] };
    })
  };
  const createCoordinator = () => new CollaborationRuntimeCoordinator({ storage, serviceId: "scoped-project-e2e", hostId: "test-host", residentLauncher: launcher,
    ...(options.now ? { now: options.now } : {}),
    executionInputBuilder: new ProductionCollaborationExecutionInputBuilder(storage, new SkillCatalog([])),
    validateWorkflowConfiguration: async (_state, proposal) => { expect(proposal.agents.main.harness).toBe(state.agents.main.harness); },
    gitFactory: (options) => {
      if (!state.git?.enabled) throw new Error("A workspace workflow attempted to construct a Git provider");
      const previous = git;
      git = new ScopedRuntimeGit(coordinator.database(), id);
      if (previous) git.restoreProviderState(previous);
      const merge = git.mergePullRequest.getMockImplementation()!;
      git.mergePullRequest.mockImplementation(async (request) => {
        const pull = await merge(request);
        if (pull.status !== "merged" || !pull.mergeCommitSha) return pull;
        // Production facade merges also synchronize the exact local target
        // before returning the provider result to the calling Agent.
        if (!(await coordinator.database().hasScopedGitExecution(id, request.execution.id))) {
          git.localRefs.set(request.expectedBase, git.refs.get(request.expectedBase)!);
          return { ...pull, localSynchronization: { projectId: id, operationId: request.operationId,
            targetBranch: request.expectedBase, temporaryRef: `refs/openfars/reconcile/${request.operationId}`,
            expectedSourceHead: request.expectedHead, mergeCommitSha: pull.mergeCommitSha,
            remoteHead: git.refs.get(request.expectedBase)!, localHeadBefore: request.expectedHead,
            localHeadAfter: git.refs.get(request.expectedBase)!, status: "synchronized", observedAt: repository.observedAt } };
        }
        return git.reconcileMergedPullRequest!({ ...request,
          operationId: mergedPullSynchronizationOperationId(request.execution.id, request.ownershipEpoch,
            request.expectedHead, request.expectedBase, pull.mergeCommitSha), expectedMergeCommitSha: pull.mergeCommitSha });
      });
      const begin = git.sessionBegin.getMockImplementation()!;
      git.sessionBegin.mockImplementation(async (execution, epoch, input) => {
        const base = input?.kind === "delivery" && input.base.commitSha ? input : { kind: "delivery" as const, base: { kind: "commit" as const, commitSha: git.localRefs.get("main")! } };
        const fact = await begin(execution, epoch, base); await fs.mkdir(fact.worktreePath, { recursive: true }); return fact;
      });
      return Object.assign(git, {
        initialize: async (input) => {
          const operation = await prepareOperation(options.operationStore, {
            id: `${input.operationId}-repository`, kind: "repository.create"
          }, { owner: repository.owner, name: repository.name });
          if (operation.status !== "finalized") await finalizeOperation(options.operationStore, operation, { ...repository });
          const ready = { enabled: true, status: "ready", provider: "github", repository: { owner: "example", name: "openfars", private: true,
            defaultBranch: "main", htmlUrl: repository.htmlUrl, localPath: path.join(options.projectRoot, "repository") },
            initialization: { operationId: input.operationId, attempt: input.attempt, completedSteps: ["remote.main.observed"] } } as ProjectState["git"];
          await options.operationStore.checkpointInitialization({ projectId: id, operationId: input.operationId, attempt: input.attempt, state: ready });
          return { state: ready, repository, localRepository: { projectId: id, repositoryPath: ready.repository!.localPath, branch: "main", head: git.refs.get("main"), observedAt: repository.observedAt } };
        },
        prepareAgentManagementWorkspace: async (agentId: string) => { const folder = path.join(storage.projectDir(id), "git-worktrees", "agents", agentId); await fs.mkdir(folder, { recursive: true }); return folder; },
        observeExecutionCommit: async (execution) => { const head = createHash("sha1").update(execution.id + execution.ownershipEpoch).digest("hex"); git.localRefs.set(execution.executionBranch, head);
          return { ...execution, projectId: id, executionId: execution.id, branch: execution.executionBranch, head, commitSha: head, changed: true, retained: true, observedAt: repository.observedAt }; },
        observePullRequest: async (input) => [...git.pulls.values()].find((pull) => pull.providerNumber === input.providerNumber)
      }) as never;
    } });
  coordinator = createCoordinator();
  coordinators.push(coordinator); await coordinator.initialize();
  const restart = async () => {
    await coordinator.shutdown();
    // This controlled fixture uses a minimal route graph, rather than the
    // public import graph. Reload its persisted bytes for the coordinator's
    // recovery entry without adding unrelated import-format validation.
    Object.assign(state, options.nestedLoop ? await storage.loadState(id)
      : JSON.parse(await fs.readFile(path.join(storage.projectDir(id), "state.json"), "utf8")));
    coordinator = createCoordinator();
    coordinators.push(coordinator); await coordinator.initialize();
    await coordinator.recoverProject(state);
    return coordinator;
  };
  return { coordinator, state, storage, root, opened, opening, paused, resumed, active, git: () => git, launcher, releaseBlocked, blockedTurnCount: () => blockedTurns, restart };
}

describe("v3 project coordinator production entry", () => {
  it("archives a resumably stopped project without losing its session or allowing an archived resume", async () => {
    const f = await fixture({ blockScopedAgent: "idea" });
    await f.coordinator.createProject(f.state, { enabled: true, provider: "github" });
    await expect.poll(() => ({ session: f.state.agentSessionIds?.idea, error: f.state.lastError }), { timeout: 10_000 })
      .toEqual({ session: "session-idea", error: undefined });
    await f.coordinator.cancelProject(f.state, { actor: "user" });
    expect(f.state.status).toBe("paused");
    const publication = vi.spyOn(f.coordinator as unknown as {
      publishProjection(...args: unknown[]): Promise<void>;
    }, "publishProjection");
    f.state.status = "cancelling";
    await f.coordinator.cancelProject(f.state, { actor: "user" });
    expect(f.state).toMatchObject({ status: "paused", phase: "collaboration:user-cancelled" });
    expect(publication).not.toHaveBeenCalled();
    publication.mockRestore();
    const nativeSessions = structuredClone(f.state.agentSessionIds);
    const opensBeforeArchive = f.opened.length;
    const beforeArchive = structuredClone(f.state);
    const stop = vi.spyOn(f.coordinator as unknown as { cancelProjectLocked(...args: unknown[]): Promise<void> }, "cancelProjectLocked");
    // A stale checkpoint can still say cancelling although its exact Stop is durable.
    f.state.status = "cancelling";
    await f.coordinator.archiveProject(f.state);
    expect(stop).not.toHaveBeenCalled();
    expect(f.state.archivedAt).toBeTruthy();
    expect(f.state.status).toBe("paused");
    expect(f.state.agentSessionIds).toEqual(nativeSessions);
    expect((await f.coordinator.database().projectState(f.state.id)).resumableCancellation?.stoppedAt).toBeTruthy();
    await expect(f.coordinator.resumeProject(f.state)).rejects.toThrow("unarchive it first");
    await expect(f.coordinator.resumeProject(beforeArchive)).rejects.toThrow("unarchive it first");
    expect(f.opened).toHaveLength(opensBeforeArchive);
    const restarted = await f.restart();
    expect(f.state.archivedAt).toBeTruthy();
    expect(f.state.agentSessionIds).toEqual(nativeSessions);
    await expect(restarted.resumeProject(f.state)).rejects.toThrow("unarchive it first");
    expect(f.opened).toHaveLength(opensBeforeArchive);
  }, 20_000);

  it.each((["worker", "final", "leader"] as const).flatMap(role => (["main", "G"] as const).map(target => ({ role, target }))))(
    "retains the writer for an unconfirmed retired scoped $role without resubmission (entry=$target)", async ({ role, target }) => {
    const f = await fixture({ inputTarget: target });
    const database = f.coordinator.database(), owner = await database.writerLease();
    const peer = () => CollaborationStateDatabase.open({ databasePath: path.join(f.root, "collaboration-state.sqlite"),
      topology: "single-host", hostId: owner.hostId, serviceId: "competing-service" });
    const open = vi.mocked(f.launcher.open), normal = open.getMockImplementation()!;
    let invocationId: string | undefined, confirmed = false;
    const submit = vi.fn(), close = vi.fn();
    open.mockImplementation(async input => {
      const handle = await normal(input), scope = input.controlScope;
      const selected = scope?.role === "scoped-agent" ? scope.executionId.startsWith("group-final-") ? "final" : "worker"
        : scope?.role === "scoped-leader" ? "leader" : undefined;
      if (invocationId || selected !== role) return handle;
      invocationId = input.request.invocationId;
      submit.mockImplementation(handle.submit.bind(handle));
      close.mockImplementation(async () => { if (!confirmed) throw new Error(`Unconfirmed ${role} Stop`); await handle.close(); });
      return { ...handle, submit, close };
    });
    try {
      await f.coordinator.createProject(f.state, { enabled: true, provider: "github" });
      await expect.poll(async () => (await database.eventsAfter(f.state.id, 0, 10000)).some(e =>
        e.type === "execution.resource_cleanup.failed" && e.invocationId === invocationId && e.payload.nativeStopConfirmed === false)
        || { phase: f.state.phase, lastError: f.state.lastError, invocationId, failures: f.state.lastError && !invocationId
          ? (await database.failureAttempts(f.state.id)).slice(0, 2).map(failure => failure.redactedMessage) : undefined }, { timeout: 10_000 }).toBe(true);
      const turns = submit.mock.calls.length;
      expect(turns).toBeGreaterThan(0);
      await expect(f.coordinator.shutdown()).rejects.toThrow(/writer ownership is retained/);
      expect(() => peer()).toThrow(expect.objectContaining({ code: "WRITER_LEASE_HELD" }));
      const attempts = close.mock.calls.length;
      expect(attempts).toBeGreaterThanOrEqual(2);
      confirmed = true;
      await f.coordinator.shutdown();
      expect(close).toHaveBeenCalledTimes(attempts + 1);
      expect(submit).toHaveBeenCalledTimes(turns);
      const next = peer(); try { expect(next.writerLease().epoch).toBe(owner.epoch + 1); } finally { next.close(); }
    } finally { confirmed = true; await f.coordinator.shutdown(); }
  }, 20_000);

  it("does not archive when the existing native stop fails", async () => {
    const f = await fixture({ blockScopedAgent: "idea" });
    await f.coordinator.createProject(f.state, { enabled: true, provider: "github" });
    await expect.poll(() => f.state.agentSessionIds?.idea, { timeout: 10_000 }).toBe("session-idea");
    const open = vi.mocked(f.launcher.open);
    const index = open.mock.calls.findIndex(([input]) => input.request.agent === "idea");
    expect(index).toBeGreaterThanOrEqual(0);
    const handle = await open.mock.results[index]!.value;
    vi.mocked(handle.close).mockRejectedValueOnce(new Error("native stop unavailable"));
    // The authoritative stop remains mandatory even if the UI reports paused.
    f.state.status = "paused";
    await expect(f.coordinator.archiveProject(f.state)).rejects.toThrow("native stop unavailable");
    expect(f.state.archivedAt).toBeUndefined();
    await f.coordinator.cancelProject(f.state, { actor: "user" });
  }, 20_000);
  it("persists the actual scoped launch cause while retaining the original session, task and unconfirmed native reservation", async () => {
    const f = await fixture();
    const original = { schemaVersion: 1 as const, harnessId: f.state.agents.idea.harness!, adapterVersion: "controlled-native",
      nativeId: "session-idea", generation: 1, durable: true, createdAt: repository.observedAt };
    f.state.agentSessions = { idea: original };
    f.state.agentSessionIds = { idea: original.nativeId };
    const open = vi.mocked(f.launcher.open);
    const normal = open.getMockImplementation()!;
    open.mockImplementation(async (request) => {
      if (request.controlScope?.role === "scoped-agent" && request.request.agent === "idea") {
        expect(request.request.resumeThreadId).toBe(original.nativeId);
        expect(request.request.sessionContinuity).toBe("strict");
        throw new HarnessRuntimeError("HARNESS_PROCESS_EXITED", "Native initialization failed", {}, {
          source: "process", cause: new Error("Original session cache is unreadable; Authorization: Bearer scoped-launch-secret")
        });
      }
      return normal(request);
    });
    await f.coordinator.createProject(f.state, { enabled: true, provider: "github" });
    await expect.poll(() => f.state.status, { timeout: 10_000 }).toBe("retrying");
    expect(hasUserWorkflowPause(f.state)).toBe(false);
    expect(f.state.lastError).toContain("Original session cache is unreadable");
    expect(f.state.lastError).not.toContain("scoped-launch-secret");
    // In-memory failure fields precede the awaited atomic state-file write.
    // Verify the durable boundary too; reading once at the earlier assignment
    // can still observe the preceding publish under full-suite concurrency.
    await expect.poll(async () => JSON.parse(await fs.readFile(path.join(f.storage.projectDir(f.state.id), "state.json"), "utf8")).lastError,
      { timeout: 10_000 }).toBe(f.state.lastError);
    const saved = JSON.parse(await fs.readFile(path.join(f.storage.projectDir(f.state.id), "state.json"), "utf8"));
    expect(saved.lastError).toBe(f.state.lastError);
    expect(saved.agentSessions.idea).toEqual(original);
    const execution = (await f.coordinator.database().projectState(f.state.id)).scopedExecutions!.find((execution) => execution.agentId === "idea")!;
    expect(execution.status).toBe("running");
    expect(execution.ownershipEpoch).toBe(1);
    const native = (await f.coordinator.database().scopedAgentTurn(f.state.id, execution.id, execution.ownershipEpoch))!;
    expect(native.status).toBe("reserved");
    expect(native.openedAt).toBeUndefined();
    expect(native.stoppedAt).toBeUndefined();
    expect(open.mock.calls.filter(([request]) => request.controlScope?.role === "scoped-agent" && request.request.agent === "idea")).toHaveLength(1);
    expect(f.git().createPullRequest.mock.calls.filter(([request]) => request.execution.id === execution.id)).toHaveLength(0);
  }, 15_000);

  it.each([false, true])("retains a v2 workflow while its original Agent explicitly supplies Git delivery (repair=%s)", async (repair) => {
    const f = await fixture({ legacyRoot: true, omitFirstRootGit: repair });
    await f.coordinator.createProject(f.state, { enabled: true, provider: "github" });
    try { await expect.poll(() => f.state.status, { timeout: 3_000 }).toBe("completed"); }
    catch (error) { throw new Error(`${f.state.phase}: ${f.state.lastError}`, { cause: error }); }
    expect(f.state.orchestration.schemaVersion).toBe(2);
    expect(f.state.scopedExecutions ?? []).toEqual([]);
    const native = f.opened.filter((entry) => entry.controlScope?.role === "execution-artifact");
    expect(native).toHaveLength(1);
    expect(native[0].request.sessionContinuity).toBe("strict");
    const handleIndex = vi.mocked(f.launcher.open).mock.calls.findIndex(([input]) => input === native[0]);
    const handle = await vi.mocked(f.launcher.open).mock.results[handleIndex].value;
    expect(handle.submit).toHaveBeenCalledTimes(repair ? 2 : 1);
    if (repair) expect(handle.submit.mock.calls[1][0].prompt).toContain("git_push");
    expect(f.git().createPullRequest).toHaveBeenCalledTimes(1);
    expect(f.git().mergePullRequest).toHaveBeenCalledTimes(1);
    expect(f.git().closePullRequest).not.toHaveBeenCalled();
    const owner = (await f.coordinator.database().projectState(f.state.id)).executions.find((execution) => execution.agentId === "execution")!;
    expect(f.state.taskCompletions?.[owner.id]).toBeDefined();
    expect(owner.status).toBe("succeeded");
  });

  it.each([false, true])("runs the same nested Loop and child handoff with workspace delivery %s", async workspace => {
    const f = await fixture({ workspace, nestedLoop: true, childHandoff: true });
    await f.coordinator.createProject(f.state, workspace ? { enabled: false } : { enabled: true, provider: "github" });
    try { await expect.poll(() => f.state.status, { timeout: 20_000 }).toBe("completed"); }
    catch (error) {
      const p = await f.coordinator.database().projectState(f.state.id);
      throw new Error(JSON.stringify({ phase: f.state.phase, error: f.state.lastError, issues: p.scopedGroupIssues,
        opened: f.opened.map(r => r.controlScope?.role), failures: (await f.coordinator.database().failureAttempts(f.state.id)).slice(-2).map(f => f.redactedMessage) }), { cause: error });
    }
    const p = await f.coordinator.database().projectState(f.state.id);
    expect(p.scopedGroupRuns?.map(g => [g.groupId, g.status])).toEqual([["G", "completed"], ["H", "completed"]]);
    const trace = await f.storage.readEvents(f.state.id);
    const completed = trace.filter(event => event.data?.sourceType === "scoped.group.completed");
    expect(completed.length).toBeGreaterThanOrEqual(2);
    for (const event of completed) expect(event.message).toBe("协作组已完成");
    const merges = trace.filter(event => event.data?.sourceType === "scoped.group.final_merged");
    expect(merges).toHaveLength(workspace ? 0 : 2);
    for (const event of merges) expect(event.message).toBe("协作组最终 PR 已合并并同步");
    expect(p.scopedArrivals?.filter(a => a.targetKind === "agent").map(a => a.targetNodeId)).toEqual(["H_idea", "H_review", "H_idea", "H_review", "H_exit", "G_execution"]);
    const successor = f.opened.find(r => r.controlScope?.role === "scoped-agent" && r.request.agent === "execution")!;
    expect(successor.request.contextSources?.find(s => s.key === "predecessor-handoff")?.records).toEqual([expect.objectContaining({ output: expect.stringContaining("Committed idea") })]);
    if (workspace) {
      expect(f.git()).toBeUndefined();
      expect(p.operations).toHaveLength(0);
      expect(p.scopedGroupRuns?.some(g => g.groupBranch || g.integrationTarget || g.baseCommit)).toBe(false);
      expect(p.scopedExecutions?.some(e => e.executionBranch)).toBe(false);
      expect(p.scopedAgentReports).toHaveLength(6);
      expect(p.scopedAgentTaskCompletions).toHaveLength(6);
      expect(f.state.artifacts?.map(record => record.path).sort()).toEqual(["group-result.txt", "root-result.txt"]);
      for (const record of f.state.artifacts!) {
        expect(record.sha256).toBe(createHash("sha256").update("Verified workspace result").digest("hex"));
      }
      expect(p.scopedGroupFinalMerges ?? []).toHaveLength(0);
      const opened = f.opened.length;
      const restarted = await f.restart();
      const persisted = await restarted.database().projectState(f.state.id);
      expect(f.state.status).toBe("completed");
      expect(f.opened).toHaveLength(opened);
      expect(persisted.scopedArrivals).toEqual(p.scopedArrivals);
      expect(persisted.operations).toHaveLength(0);
      expect(f.state.artifacts?.map(record => record.path).sort()).toEqual(["group-result.txt", "root-result.txt"]);
    } else expect(p.scopedGroupFinalMerges).toHaveLength(2);
  }, 30_000);

  it("delivers a merged child group's current results to its parent-scope successor without changing Agent identity", async () => {
    const f = await fixture({ childHandoff: true }); await f.coordinator.createProject(f.state, { enabled: true, provider: "github" });
    try { await expect.poll(() => f.state.status, { timeout: 15_000 }).toBe("completed"); } catch (error) {
      throw new Error(`${f.state.phase}: ${f.state.lastError}`, { cause: error });
    }
    const successor = f.opened.find((entry) => entry.controlScope?.role === "scoped-agent" && entry.request.agent === "execution")!;
    const inbox = await fs.readFile(successor.request.inboxPath, "utf8");
    expect(inbox).toContain("来源：");
    expect(inbox).not.toContain('source="predecessor-handoff"');
    expect(successor.request.contextSources?.find(source => source.key === "predecessor-handoff")?.records).toEqual([
      { sourceRunId: expect.any(String), output: expect.stringContaining("Committed idea") }
    ]);
    const child = f.state.scopedGroupRuns!.find((group) => group.groupId === "H")!;
    expect(f.state.scopedGroupFinalMerges?.some((merge) => merge.groupRunId === child.id)).toBe(true);
    expect(f.opened.filter((entry) => entry.request.agent === "execution" && !(entry.controlScope && "executionId" in entry.controlScope && entry.controlScope.executionId.startsWith("group-final-"))).map((entry) => entry.request.workspacePath))
      .toEqual([successor.request.workspacePath, successor.request.workspacePath]);
    expect(f.state.agentSessionIds?.execution).toBe("session-execution");
  }, 20_000);

  it("lets native Main on its retained Gateway formally create nested groups from the journal snapshot and execute the new graph", async () => {
    const f = await fixture({ mainCreatesGroups: true }); await f.coordinator.createProject(f.state, { enabled: true, provider: "github" });
    try { await expect.poll(() => f.state.status, { timeout: 15_000 }).toBe("completed"); } catch (error) { throw new Error(`${f.state.phase}: ${f.state.lastError}`, { cause: error }); }
    expect(f.state.workflowRevision).toBe(2); expect(f.state.orchestration.scopedWorkflow?.groups).toHaveLength(2);
    const mainCalls = f.opened.filter((entry) => entry.request.agent === "main");
    expect(new Set(mainCalls.map((entry) => entry.request.workspacePath)).size).toBe(1);
    expect(mainCalls.slice(1).every((entry) => entry.request.resumeThreadId === "session-main")).toBe(true);
    expect(f.state.scopedGroupFinalMerges).toHaveLength(2); expect(f.state.agentSessionIds?.main).toBe("session-main");
    expect(f.state.executions?.some((entry) => entry.agentId === "main")).toBe(false);
    expect(f.state.agents.main.gatewaySnapshot?.apiKey).toBe("private-original-main-route");
    expect((await f.coordinator.database().scopedConfiguration(f.state.id))?.agents.main.gatewaySnapshot).toBeUndefined();
  }, 20_000);

  it("uses formal request_user for a completed group's outer weak route and consumes the reply without rerunning the group", async () => {
    const f = await fixture({ weakRootIntervention: true }); await f.coordinator.createProject(f.state, { enabled: true, provider: "github" });
    await expect.poll(() => f.state.phase, { timeout: 12_000 }).toBe("user-intervention-required");
    expect(f.state.userIntervention?.status).toBe("pending"); const before = f.state.scopedExecutions!.map((entry) => entry.id);
    await f.coordinator.respondToUserIntervention(f.state, { message: "Yes, continue the outer Agent." });
    try { await expect.poll(() => f.state.status, { timeout: 12_000 }).toBe("completed"); } catch (error) { throw new Error(`${f.state.phase}: ${f.state.lastError}`, { cause: error }); }
    expect(f.state.scopedExecutions!.map((entry) => entry.id)).toEqual(before);
    expect(f.opened.some((entry) => entry.request.resumeThreadId === "session-main" && entry.request.inboxPath)).toBe(true);
    expect(f.state.userIntervention).toBeUndefined();
  }, 25_000);

  it("consumes an intervention reply after restart without needing a separate resume or rerunning completed groups", async () => {
    const f = await fixture({ weakRootIntervention: true });
    await f.coordinator.createProject(f.state, { enabled: true, provider: "github" });
    await expect.poll(() => f.state.phase, { timeout: 12_000 }).toBe("user-intervention-required");
    const executions = f.state.scopedExecutions!.map((entry) => entry.id);
    const merges = f.state.scopedGroupFinalMerges!.map((entry) => entry.groupRunId);
    const groupInvocations = f.opened.filter((entry) => entry.controlScope?.role === "scoped-agent")
      .map((entry) => entry.request.invocationId);
    const restarted = await f.restart();
    expect(f.state.status).toBe("retrying");
    expect(hasUserWorkflowPause(f.state)).toBe(false);
    expect(f.state.userIntervention?.status).toBe("pending");
    await restarted.respondToUserIntervention(f.state, { message: "Continue after the restart." });
    try { await expect.poll(() => f.state.status, { timeout: 4_000 }).toBe("completed"); }
    catch (error) { throw new Error(`${f.state.phase}: ${f.state.lastError}`, { cause: error }); }
    expect(f.state.scopedExecutions!.map((entry) => entry.id)).toEqual(executions);
    expect(f.state.scopedGroupFinalMerges!.map((entry) => entry.groupRunId)).toEqual(merges);
    expect(f.state.userIntervention).toBeUndefined();
    expect(f.opened.filter((entry) => entry.controlScope?.role === "scoped-agent")
      .map((entry) => entry.request.invocationId)).toEqual(groupInvocations);
  }, 20_000);

  it("contains a scheduled run's explicit writer fence without an unhandled rejection or later Git mutations", async () => {
    let clock = Date.now();
    const f = await fixture({ blockScopedAgent: "idea", now: () => clock });
    await f.coordinator.createProject(f.state, { enabled: true, provider: "github" });
    await expect.poll(() => ({ session: f.state.agentSessionIds?.idea, error: f.state.lastError }), { timeout: 10_000 })
      .toEqual({ session: "session-idea", error: undefined });
    const mutationsBefore = f.git().log.length;
    clock += 60_000;
    expect(f.coordinator.writerLeaseHealth().status).toBe("ready");
    await f.coordinator.database().relinquishWriterLease();
    f.releaseBlocked();
    await expect.poll(async () => (await f.coordinator.projectReadModel(f.state)).phase, { timeout: 4_000 }).toBe("collaboration:writer-lease-lost");
    expect((await f.coordinator.projectReadModel(f.state)).status).toBe("interrupted");
    expect(hasUserWorkflowPause((await f.coordinator.projectReadModel(f.state)))).toBe(false);
    expect((await f.coordinator.projectReadModel(f.state)).lastError).toContain("服务写入所有权失效");
    expect((await f.coordinator.projectReadModel(f.state)).runtime?.waiting)
      .toMatchObject({ kind: "service", errorCode: "WRITER_LEASE_STALE" });
    await expect(f.coordinator.resumeProject(f.state)).rejects.toThrow(/writer ownership was lost/);
    expect(f.git().log).toHaveLength(mutationsBefore);
    expect(f.state.scopedGroupFinalMerges ?? []).toHaveLength(0);
    await expect.poll(() => f.active.size, { timeout: 2_000 }).toBe(0);
  }, 20_000);

  it("retains completed status when the backend writer is later fenced", async () => {
    let clock = Date.now();
    const f = await fixture({ now: () => clock });
    await f.coordinator.createProject(f.state, { enabled: true, provider: "github" });
    await expect.poll(() => f.state.status, { timeout: 12_000 }).toBe("completed");
    clock += 60_000;
    expect(f.coordinator.writerLeaseHealth().status).toBe("ready");
    await f.coordinator.database().relinquishWriterLease();
    await expect(f.coordinator.resumeProject(f.state)).rejects.toThrow(/writer ownership was lost/);
    expect((await f.coordinator.projectReadModel(f.state)).status).toBe("completed");
    expect((await f.coordinator.projectReadModel(f.state)).lastError).toBeUndefined();
  }, 20_000);

  it("records completed scoped runtime recovery without validating its group as legacy state", async () => {
    const f = await fixture({ omitFirstFinish: "idea" });
    await f.coordinator.createProject(f.state, { enabled: true, provider: "github" });
    await expect.poll(() => f.state.status, { timeout: 15_000 }).toBe("completed");
    const projection = await f.coordinator.database().projectState(f.state.id);
    const root = projection.scopedGroupRuns!.find((group) => !group.parentGroupRunId)!;
    const child = projection.scopedGroupRuns!.find((group) => group.parentGroupRunId)!;
    const operation = `scoped.runtime:${child.id}:synthetic-recovery`;
    await f.coordinator.database().appendFailureAttempt({
      attemptId: "scoped-runtime-recovery-synthetic",
      projectId: f.state.id,
      scope: "scheduler",
      operation,
      status: "failed",
      errorCode: "SCOPED_RUNTIME_FAILURE",
      retryable: true,
      redactedMessage: "synthetic scoped runtime failure",
      causeClass: "Error",
      startedAt: repository.observedAt,
      finishedAt: repository.observedAt,
      metadata: { rootGroupRunId: root.id, groupRunId: child.id }
    });
    const runtime = f.coordinator as unknown as {
      reconcileScopedRuntimeFailures(state: ProjectState, result: unknown): Promise<{ unresolvedMessages: string[] }>;
    };
    const reconciled = await runtime.reconcileScopedRuntimeFailures(f.state, {
      status: "completed",
      groupRun: root,
      issues: []
    });
    expect(reconciled.unresolvedMessages).toEqual([]);
    expect((await f.coordinator.database().failureAttempts(f.state.id))
      .filter((attempt) => attempt.operation === operation)
      .map((attempt) => attempt.status)).toEqual(["failed", "succeeded"]);
  }, 20_000);

  it.each(["worker", "final"] as const)("defers scoped %s native opening when Pause settles during preparation", async kind => {
    const f = await fixture();
    const writeInbox = f.storage.writeInbox.bind(f.storage);
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    let blockedInvocation: string | undefined;
    vi.spyOn(f.storage, "writeInbox").mockImplementation(async (...args) => {
      const canonical = args[3].includes("for canonical final integration of");
      if (!blockedInvocation && args[1] === "idea" && canonical === (kind === "final")) {
        blockedInvocation = args[2];
        await gate;
      }
      return writeInbox(...args);
    });
    let pauseOutcome: Promise<unknown> | undefined;
    try {
      await f.coordinator.createProject(f.state, { enabled: true, provider: "github" });
      await expect.poll(() => blockedInvocation, { timeout: 10_000 }).toBeTruthy();
      pauseOutcome = f.coordinator.pauseProject(f.state).catch((error: unknown) => error);
      expect(await pauseOutcome).toBeUndefined();
      expect(f.state.status).toBe("paused");
      const sessions = structuredClone(f.state.agentSessionIds);
      release();
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(f.launcher.open.mock.calls.some(([input]) => input.request.invocationId === blockedInvocation)).toBe(false);
      expect(f.state.agentSessionIds).toEqual(sessions);
      await f.coordinator.resumeProject(f.state);
      await expect.poll(() => f.state.status, { timeout: 15_000 }).toBe("completed");
      expect(f.opened.filter(input => input.request.invocationId === blockedInvocation)).toHaveLength(1);
      expect(f.paused).not.toContain(blockedInvocation);
      expect(f.resumed).not.toContain(blockedInvocation);
      expect(f.state.agentSessionIds?.idea).toBe("session-idea");
    } finally { release(); await pauseOutcome; }
  }, 25_000);

  it.each(["worker", "final"] as const)("keeps scoped %s opening inside the Pause boundary and resumes the same invocation", async kind => {
    const f = await fixture(kind === "worker" ? { blockScopedOpen: "idea" } : { blockFinalOpen: "idea" });
    await f.coordinator.createProject(f.state, { enabled: true, provider: "github" });
    await expect.poll(() => f.opening.length, { timeout: 10_000 }).toBe(1);
    const original = f.opening[0];
    const sessions = structuredClone(f.state.agentSessionIds);
    let settled = false;
    const pause = f.coordinator.pauseProject(f.state).then(() => { settled = true; });
    const pauseOutcome = pause.catch((error: unknown) => error);
    try {
      await expect.poll(async () => JSON.parse(await fs.readFile(path.join(f.storage.projectDir(f.state.id), "state.json"), "utf8")).pauseRequest?.requestedAt).toBeTruthy();
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(settled).toBe(false);
      expect(f.state.pauseRequest?.settledAt).toBeUndefined();
      expect(f.paused).not.toContain(original.request.invocationId);
      expect(f.opened).not.toContain(original);
      f.releaseBlocked();
      expect(await pauseOutcome).toBeUndefined();
      expect(f.state.status).toBe("paused");
      expect(f.paused.filter(id => id === original.request.invocationId)).toHaveLength(1);
      const index = f.launcher.open.mock.calls.findIndex(([input]) => input.request.invocationId === original.request.invocationId);
      const handle = await f.launcher.open.mock.results[index].value;
      expect(handle.submit).not.toHaveBeenCalled();
      expect(f.state.agentSessionIds).toEqual(sessions);
      const requestedAt = f.state.pauseRequest!.requestedAt;
      expect(JSON.parse(await fs.readFile(path.join(f.storage.projectDir(f.state.id), "state.json"), "utf8")).pauseRequest).toMatchObject({ requestedAt, settledAt: expect.any(String) });
      await f.coordinator.resumeProject(f.state);
      await expect.poll(() => f.state.status, { timeout: 15_000 }).toBe("completed");
      expect(f.resumed.filter(id => id === original.request.invocationId)).toHaveLength(1);
      expect(f.opened.filter(input => input.request.invocationId === original.request.invocationId)).toHaveLength(1);
      expect(handle.submit).toHaveBeenCalledTimes(1);
      expect(f.state.agentSessionIds?.idea).toBe("session-idea");
      expect(f.state.pauseRequest).toBeUndefined();
    } finally { f.releaseBlocked(); await pauseOutcome; }
  }, 25_000);

  it.each([false, true])("pauses at the native safe point and resumes the same scoped invocation with workspace delivery %s", async workspace => {
    const f = await fixture({ workspace, blockScopedAgent: "idea" });
    await f.coordinator.createProject(f.state, workspace ? { enabled: false } : { enabled: true, provider: "github" });
    await expect.poll(() => f.state.agentSessionIds?.idea, { timeout: 10_000 }).toBe("session-idea");
    const pause = f.coordinator.pauseProject(f.state);
    const pauseOutcome = pause.catch((error: unknown) => error);
    const persisted = async () => JSON.parse(await fs.readFile(path.join(f.storage.projectDir(f.state.id), "state.json"), "utf8")) as ProjectState;
    let requestedAt: string | undefined;
    try {
      // This scoped fixture constructs its graph directly rather than using
      // public creation validation. Read the actual persisted Pause fields;
      // the separate writer-restart cases use validated storage.loadState.
      await expect.poll(async () => (await persisted()).pauseRequest?.requestedAt).toBeTruthy();
      const pending = await persisted(); requestedAt = pending.pauseRequest?.requestedAt;
      expect(pending.pauseRequest?.settledAt).toBeUndefined();
      expect((await f.coordinator.projectReadModel(f.state))).toMatchObject({ status: "pausing", runtime: { status: "pausing" } });
      f.releaseBlocked(); expect(await pauseOutcome).toBeUndefined();
    } finally { f.releaseBlocked(); await pauseOutcome; }
    expect(f.state.status).toBe("paused"); expect(f.state.scopedGroupFinalMerges ?? []).toHaveLength(0);
    expect(f.state.pauseRequest?.requestedAt).toBe(requestedAt);
    expect(f.state.pauseRequest?.settledAt).toBeTruthy();
    const nativeOutputs = (await f.coordinator.database().eventsAfter(f.state.id, 0, 1000))
      .filter(event => event.type === "scoped.agent.native_output.recorded" && event.agentId === "idea");
    expect(nativeOutputs).toHaveLength(1);
    expect(nativeOutputs[0]!.payload.output).toBe("Committed idea");
    expect((await f.coordinator.database().projectState(f.state.id)).scopedAgentReports?.some(report => report.agentId === "idea")).not.toBe(true);
    expect(f.opened.filter((entry) => entry.request.agent === "idea" && !(entry.controlScope && "executionId" in entry.controlScope && entry.controlScope.executionId.startsWith("group-final-")))).toHaveLength(1);
    await f.coordinator.resumeProject(f.state);
    try { await expect.poll(() => f.state.status, { timeout: 12_000 }).toBe("completed"); } catch (error) { throw new Error(`${f.state.phase}: ${f.state.lastError}`, { cause: error }); }
    expect(f.opened.filter((entry) => entry.request.agent === "idea" && !(entry.controlScope && "executionId" in entry.controlScope && entry.controlScope.executionId.startsWith("group-final-")))).toHaveLength(1);
    expect(f.state.agentSessionIds?.idea).toBe("session-idea"); expect(f.state.runtime?.activities).toEqual([]);
    expect(f.state.pauseRequest).toBeUndefined();
  }, 25_000);

  it("keeps the actual scoped native return across paused shutdown without accepting a report or reopening a task", async () => {
    const f = await fixture({ blockScopedAgent: "idea" });
    await f.coordinator.createProject(f.state, { enabled: true, provider: "github" });
    await expect.poll(() => f.state.agentSessionIds?.idea, { timeout: 10_000 }).toBe("session-idea");
    const pause = f.coordinator.pauseProject(f.state);
    const pauseOutcome = pause.catch((error: unknown) => error);
    try {
      await expect.poll(async () => JSON.parse(await fs.readFile(path.join(f.storage.projectDir(f.state.id), "state.json"), "utf8")).pauseRequest?.requestedAt).toBeTruthy();
      f.releaseBlocked();
      expect(await pauseOutcome).toBeUndefined();
    } finally { f.releaseBlocked(); await pauseOutcome; }
    const original = f.opened.find(entry => entry.request.agent === "idea")!;
    const scope = original.controlScope!;
    if (scope.role !== "scoped-agent") throw new Error("Expected original scoped Agent");
    const outputs = await f.coordinator.database().scopedAgentNativeOutputs(f.state.id, scope.executionId, scope.ownershipEpoch, original.request.invocationId);
    expect(outputs).toEqual([expect.objectContaining({ invocationId: original.request.invocationId, output: "Committed idea" })]);
    expect((await f.coordinator.database().scopedAgentReport(f.state.id, scope.executionId, scope.ownershipEpoch))).toBeUndefined();
    const sessions = structuredClone(f.state.agentSessionIds);
    const openedCount = f.opened.length;
    const restarted = await f.restart();
    expect(f.state.status).toBe("paused");
    expect(f.state.agentSessionIds).toEqual(sessions);
    expect(f.opened).toHaveLength(openedCount);
    expect((await restarted.database().scopedAgentNativeOutputs(f.state.id, scope.executionId, scope.ownershipEpoch, original.request.invocationId))).toEqual(outputs);
    expect((await restarted.database().scopedAgentReport(f.state.id, scope.executionId, scope.ownershipEpoch))).toBeUndefined();
    expect((await restarted.database().projectState(f.state.id)).scopedGroupFinalMerges ?? []).toHaveLength(0);
    expect(f.active.size).toBe(0);
  }, 25_000);

  it("stops nested scoped turns, preserves their PRs and resumes only after an explicit request", async () => {
    const f = await fixture({ blockScopedAgent: "idea" }); await f.coordinator.createProject(f.state, { enabled: true, provider: "github" });
    await expect.poll(() => f.state.agentSessionIds?.idea, { timeout: 10_000 }).toBe("session-idea");
    const before = (await f.coordinator.database().projectState(f.state.id)).scopedExecutions!.map((entry) => ({
      id: entry.id, branch: entry.executionBranch, path: entry.worktreePath
    }));
    await f.coordinator.cancelProject(f.state, { actor: "user", reason: "user_cancelled" });
    expect(f.state).toMatchObject({ status: "paused", phase: "collaboration:user-cancelled" });
    expect((await f.coordinator.projectReadModel({ ...f.state, status: "running", phase: "stale:running" })))
      .toMatchObject({ status: "paused", phase: "collaboration:user-cancelled",
        runtime: { status: "paused", phase: "collaboration:user-cancelled" } });
    expect(f.state.scopedGroupRuns?.every((group) => group.status === "paused")).toBe(true);
    expect(f.active.size).toBe(0); expect(f.state.runtime?.activities).toEqual([]);
    expect(f.state.scopedGroupFinalMerges ?? []).toHaveLength(0);
    expect(f.git().closePullRequest).not.toHaveBeenCalled();
    expect(f.state.agentSessionIds?.idea).toBe("session-idea");
    await expect(fs.access(path.join(f.storage.projectDir(f.state.id), "git-worktrees", "agents", "idea"))).resolves.toBeUndefined();
    const count = f.opened.length;
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(f.opened).toHaveLength(count);
    await f.coordinator.resumeProject(f.state);
    await expect.poll(() => f.state.status, { timeout: 12_000 }).toBe("completed");
    expect(f.state.scopedExecutions!.map((entry) => ({ id: entry.id, branch: entry.executionBranch, path: entry.worktreePath }))).toEqual(before);
    expect(f.state.agentSessionIds?.idea).toBe("session-idea");
    const turns = f.opened.filter((entry) => entry.request.agent === "idea" && !(entry.controlScope && "executionId" in entry.controlScope && entry.controlScope.executionId.startsWith("group-final-")));
    expect(turns).toHaveLength(2); expect(turns[1].request.resumeThreadId).toBe("session-idea");
  }, 20_000);

  it("creates a fresh stop fence on each user stop and retains the same scoped task through repeated resume", async () => {
    const f = await fixture({ blockScopedAgent: "idea", blockScopedTurns: 2 });
    await f.coordinator.createProject(f.state, { enabled: true, provider: "github" });
    let firstSequence = 0;
    for (let cycle = 1; cycle <= 2; cycle += 1) {
      await expect.poll(f.blockedTurnCount, { timeout: 10_000 }).toBe(cycle);
      await f.coordinator.cancelProject(f.state, { actor: "user", reason: "user_cancelled" });
      expect(f.state).toMatchObject({ status: "paused", phase: "collaboration:user-cancelled" });
      const intent = (await f.coordinator.database().resumableProjectCancellationIntent(f.state.id))!;
      expect(intent).toBeDefined(); expect(intent.seq).toBeGreaterThan(firstSequence); firstSequence = intent.seq;
      const before = f.opened.length;
      await new Promise((resolve) => setTimeout(resolve, 50)); expect(f.opened).toHaveLength(before);
      await f.coordinator.resumeProject(f.state);
      expect((await f.coordinator.database().projectCancellationIntent(f.state.id))).toBeUndefined();
    }
    await expect.poll(() => f.state.status, { timeout: 12_000 }).toBe("completed");
    const turns = f.opened.filter((entry) => entry.request.agent === "idea" && !(entry.controlScope && "executionId" in entry.controlScope && entry.controlScope.executionId.startsWith("group-final-")));
    expect(turns).toHaveLength(3);
    expect(new Set(turns.map((entry) => entry.request.workspacePath)).size).toBe(1);
    expect(new Set(turns.map((entry) => entry.request.executionContext!.executionId)).size).toBe(1);
    expect(turns.slice(1).every((entry) => entry.request.resumeThreadId === "session-idea")).toBe(true);
    expect(f.git().closePullRequest).not.toHaveBeenCalled();
  }, 30_000);

  it("preserves unstarted successor queues across a user stop and resumes them after the original predecessor delivers", async () => {
    const f = await fixture({ queueIdeaSibling: true, blockScopedAgent: "idea" });
    await f.coordinator.createProject(f.state, { enabled: true, provider: "github" });
    await expect.poll(f.blockedTurnCount, { timeout: 10_000 }).toBe(1);
    const original = f.state.scopedExecutions!.find((entry) => entry.agentId === "idea")!.id;
    await f.coordinator.cancelProject(f.state, { actor: "user", reason: "user_cancelled" });
    const unstarted = (await f.coordinator.database().projectState(f.state.id)).scopedArrivals!.find((entry) => entry.targetNodeId === "H_idea_next")!;
    expect(unstarted.status).toBe("queued");
    expect(f.state.scopedExecutions!.some((entry) => entry.arrivalRequestId === unstarted.requestId)).toBe(false);
    await f.coordinator.resumeProject(f.state);
    await expect.poll(() => f.state.status, { timeout: 15_000 }).toBe("completed");
    expect(f.state.scopedExecutions!.find((entry) => entry.agentId === "idea")!.id).toBe(original);
    expect(f.state.scopedAgentMerges).toHaveLength(3);
  }, 20_000);

  it("stop-confirms the assigned final Agent and resumes its original canonical integration and session", async () => {
    const f = await fixture({ blockFinalAgent: "idea" });
    await f.coordinator.createProject(f.state, { enabled: true, provider: "github" });
    await expect.poll(f.blockedTurnCount, { timeout: 10_000 }).toBe(1);
    const child = (await f.coordinator.database().projectState(f.state.id)).scopedGroupRuns!.find((group) => group.groupId === "H")!;
    const owner = (await f.coordinator.database().scopedFinalIntegration(f.state.id, child.id))!;
    expect(f.state.runtime?.activities.some((activity) => activity.executionId === owner.id && activity.agentId === "idea")).toBe(true);
    await f.coordinator.cancelProject(f.state, { actor: "user", reason: "user_cancelled" });
    expect(f.state.status).toBe("paused");
    expect((await f.coordinator.database().scopedFinalNativeTurns(f.state.id)).every((turn) => turn.status === "stopped")).toBe(true);
    expect(f.git().closePullRequest).not.toHaveBeenCalled();
    await f.coordinator.resumeProject(f.state);
    await expect.poll(() => f.state.status, { timeout: 15_000 }).toBe("completed");
    const turns = f.opened.filter((entry) => entry.controlScope?.role === "scoped-agent" && entry.controlScope.executionId === owner.id);
    expect(turns).toHaveLength(2);
    expect(turns[1].request.resumeThreadId).toBe("session-idea");
    expect(turns[1].request.workspacePath).toBe(turns[0].request.workspacePath);
    expect((await f.coordinator.database().scopedFinalIntegration(f.state.id, child.id))?.ownershipEpoch).toBe(owner.ownershipEpoch);
  }, 20_000);

  it("wakes the original root Agent to supply missing Git actions without a system PR or a second native session", async () => {
    const f = await fixture({ omitFirstRootGit: true }); await f.coordinator.createProject(f.state, { enabled: true, provider: "github" });
    await expect.poll(() => f.state.status, { timeout: 15_000 }).toBe("completed");
    const index = f.launcher.open.mock.calls.findIndex(([entry]) => entry.controlScope?.role === "execution-artifact");
    const handle = await f.launcher.open.mock.results[index].value;
    expect(handle.submit).toHaveBeenCalledTimes(2);
    expect(handle.submit.mock.calls[1][0].prompt).toContain("Missing formal mechanism actions:");
    expect(f.opened.filter((entry) => entry.controlScope?.role === "execution-artifact")).toHaveLength(1);
    expect(f.git().createPullRequest.mock.calls.filter(([request]) => request.base === "main")).toHaveLength(1);
    expect(f.git().closePullRequest).not.toHaveBeenCalled();
  }, 20_000);

  it("wakes a scoped Agent for missing finish_task while retaining its existing merged PR", async () => {
    const f = await fixture({ omitFirstFinish: "idea" }); await f.coordinator.createProject(f.state, { enabled: true, provider: "github" });
    await expect.poll(() => f.state.status, { timeout: 15_000 }).toBe("completed");
    const index = f.launcher.open.mock.calls.findIndex(([entry]) => entry.controlScope?.role === "scoped-agent" && !entry.controlScope.executionId.startsWith("group-final-") && entry.request.agent === "idea");
    const handle = await f.launcher.open.mock.results[index].value;
    expect(handle.submit).toHaveBeenCalledTimes(2);
    expect(handle.submit.mock.calls[1][0].prompt).toContain("finish_task");
    const execution = f.state.scopedExecutions!.find((entry) => entry.agentId === "idea")!;
    expect(f.state.scopedAgentMerges?.find((merge) => merge.executionId === execution.id)).toBeDefined();
    expect(f.git().createPullRequest.mock.calls.filter(([request]) => request.execution.id === execution.id)).toHaveLength(1);
    expect(f.launcher.open.mock.calls[index][0].request.sessionContinuity).toBe("strict");
    expect(f.state.agentSessionIds?.idea).toBe("session-idea");
  }, 20_000);

  it("runs native Main → nested scoped group → the retained outer Agent → Finish with formal controls and accounting", async () => {
    const f = await fixture(); await f.coordinator.createProject(f.state, { enabled: true, provider: "github" });
    try { await expect.poll(() => f.state.status, { timeout: 15_000 }).toBe("completed"); } catch (error) {
      throw new Error(JSON.stringify({ status: f.state.status, phase: f.state.phase, error: f.state.lastError, opened: f.opened.map((item) => item.controlScope) }), { cause: error });
    }
    expect(f.state.scopedGroupRuns).toHaveLength(2); expect(f.state.scopedGroupRuns?.every((group) => group.status === "completed")).toBe(true);
    const executionCalls = f.opened.filter((entry) => entry.request.agent === "execution"); expect(executionCalls).toHaveLength(3);
    expect(new Set(executionCalls.map((entry) => entry.request.workspacePath)).size).toBe(1);
    expect(executionCalls[1].request.resumeThreadId).toBe("session-execution");
    expect(f.state.agentSessionIds?.main).toBe("session-main");
    expect(f.state.executions?.some((execution) => execution.agentId === "main")).toBe(false);
    expect(f.state.scopedAgentMerges).toHaveLength(2); expect(f.state.scopedGroupFinalMerges).toHaveLength(2);
    expect(f.state.runtime?.activities).toEqual([]); expect(f.active.size).toBe(0);
    expect(f.state.collaboration?.usage.filter((usage) => usage.scopeKind === "scoped")).toHaveLength(10);
    const child = f.state.scopedGroupRuns!.find((group) => group.groupId === "H")!;
    expect(f.state.scopedGroupFinalMerges?.find((merge) => merge.groupRunId === child.id)?.pullRequest.base).toBe(`groups/${child.parentGroupRunId}`);
  }, 20_000);

  it("queues a nested Leader until the original ancestor Agent supplies its formal delivery", async () => {
    const f = await fixture({ blockScopedAgent: "execution" });
    const database = f.coordinator.database();
    const claims = vi.spyOn(database, "claimScopedLeaderTurn");
    await f.coordinator.createProject(f.state, { enabled: true, provider: "github" });
    try {
      await expect.poll(f.blockedTurnCount, { timeout: 10_000 }).toBe(1);
      await expect.poll(async () => (await database.projectState(f.state.id)).scopedGroupRuns?.find((group) => group.groupId === "H"),
        { timeout: 10_000 }).toBeDefined();
      const child = (await database.projectState(f.state.id)).scopedGroupRuns!.find((group) => group.groupId === "H")!;
      await expect.poll(() => claims.mock.calls.some(([input]) => input.groupRunId === child.id),
        { timeout: 10_000 }).toBe(true);
      const attempted = claims.mock.calls.flatMap(([input], index) => input.groupRunId === child.id ? [claims.mock.results[index]] : []);
      expect(attempted.every((result) => result.type === "return" && result.value === undefined)).toBe(true);
      expect(f.opened.some((input) => input.controlScope?.role === "scoped-leader" && input.controlScope.groupRunId === child.id)).toBe(false);
      const original = (await database.projectState(f.state.id)).scopedExecutions!.find((execution) => execution.agentId === "execution")!;
      expect(original.status).toBe("running");
      expect((await database.scopedAgentTurn(f.state.id, original.id, original.ownershipEpoch))?.status).toBe("opened");
      expect((await database.scopedAgentTaskCompletion(f.state.id, original.id, original.ownershipEpoch))).toBeUndefined();
      expect(f.git().pulls.get(original.id)).toBeUndefined();
      f.releaseBlocked();
      await expect.poll(() => f.state.status, { timeout: 15_000 }).toBe("completed");
      const final = await database.projectState(f.state.id);
      expect(final.scopedExecutions!.find((execution) => execution.id === original.id)).toMatchObject({
        arrivalRequestId: original.arrivalRequestId, ownershipEpoch: original.ownershipEpoch,
        agentId: original.agentId, worktreePath: original.worktreePath, executionBranch: original.executionBranch, status: "completed" });
      const events = await database.eventsAfter(f.state.id, 0, 1_000);
      const delivered = events.find((event) => event.type === "scoped.agent.merged_route" && event.payload.executionId === original.id)!;
      const nestedManager = events.find((event) => event.type === "scoped.leader.claimed" && event.payload.groupRunId === child.id)!;
      expect(delivered).toBeDefined(); expect(nestedManager).toBeDefined();
      expect(nestedManager.seq).toBeGreaterThan(delivered.seq);
      expect(f.opened.filter((input) => input.controlScope?.role === "scoped-agent" && input.controlScope.executionId === original.id)).toHaveLength(1);
      expect(final.scopedAgentMerges).toHaveLength(2);
      expect(final.scopedGroupFinalMerges).toHaveLength(2);
      expect(f.state.agentSessionIds?.execution).toBe("session-execution");
      expect(f.state.runtime?.activities).toEqual([]);
      expect(f.active.size).toBe(0);
    } finally { f.releaseBlocked(); }
  }, 30_000);
});
