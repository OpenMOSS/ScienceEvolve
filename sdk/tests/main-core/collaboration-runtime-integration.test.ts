import { hasUserWorkflowPause } from "../../src/core/workflow-recovery.js";
import { createHash } from "node:crypto";
import { collaborationSessionKey } from "../../src/core/internal/shared/collaboration-session-key.js";
import { promises as fs } from "node:fs";
import { execFile, spawn } from "node:child_process";
import { DatabaseSync } from "node:sqlite";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EventHub } from "../../src/core/event-hub.js";
import { Orchestrator } from "../../src/core/orchestrator.js";
import { harnessCatalogRegistry, toPublicHarnessDescriptor } from "../../src/core/harness-runtime/registry.js";
import { createProductionCollaborationResidentLauncher } from "../../src/core/collaboration-resident-launcher.js";
import type { HarnessRuntimeFacade } from "../../src/core/harness-runtime/runtime.js";
import type { HarnessRuntimeResidentAdapter } from "../../src/core/harness-runtime/resident-runtime-adapter.js";
import { HarnessRuntimeError, ProtocolToolArgumentsError } from "../../src/core/harness-runtime/errors.js";
import { validateStagedInvocationInputs } from "../../src/core/harness-runtime/invocation-inputs.js";
import { ProjectStorage } from "../../src/core/storage.js";
import { emptyProjectComputeUsage } from "../../src/core/inspire-compute-usage.js";
import { cloneAgentOrchestrationTemplate } from "../../src/core/agent-orchestration.js";
import { mainAgentOrchestrationDocument } from "../../src/core/agent-orchestration-reconfiguration.js";
import { credentialFreeAgentConfiguration } from "../../src/core/scoped-agent-configuration.js";
import { defaultAgentConfigs, mergeAgentConfigs, normalizeAgentOrchestrationTemplate, normalizeNewGitOrchestration } from "../../src/core/validation.js";
import {
  CollaborationRuntimeCoordinator,
  deriveProjectRuntimeProjection,
  ProductionCollaborationExecutionInputBuilder,
  ProductionCollaborationInvocationDispatcher,
  executionWorktreePath,
  groupAssignmentContextTasks,
  inheritedArtifactPublicationIntents,
  managementMemoryDocument,
  maximumMirroredCollaborationSeq,
  safeRepositoryName,
  type CollaborationGitRuntime,
  type CollaborationResidentLauncher
} from "../../src/core/collaboration-runtime.js";
import {
  CollaborationStateDatabase,
  type CollaborationEvent
} from "../../src/core/collaboration-state/index.js";
import { SkillCatalog } from "../../src/core/skill-catalog.js";
import { agentFixtureDelivery, agentFixtureRequests, agentFixtureLeaderResult, agentFixtureMainDecision } from "./helpers/agent-git-native-fixture.js";
import {
  assertResidentRecoveryProof,
  bindResidentRecoveryProof,
  createResidentRecoveryProofSeed
} from "../../src/core/recovery-proof.js";
import type {
  CollaborationGitFactoryOptions,
  GitHubPullRequestFact,
  GitInitializationResult
} from "../../src/core/collaboration-git/index.js";
import { GitCommandError, GitHubAuthorizationError, GitHubUncertainResultError } from "../../src/core/collaboration-git/index.js";
import type { SynchronizedPullRequestFact } from "../../src/core/collaboration-git/facade.js";
import {
  ControlActionRejectedError,
  ControlActionService
} from "../../src/core/orchestration-control-bridge.js";
import type {
  ArtifactRecord,
  AgentRunRequest,
  AgentRunner,
  ControlAction,
  ControlActionEnvelope,
  ProjectGitState,
  ProjectState
} from "../../src/core/types.js";

const temporaryRoots: string[] = [];
const liveCoordinators: CollaborationRuntimeCoordinator[] = [];

afterEach(async () => {
  await Promise.allSettled(liveCoordinators.splice(0).map(coordinator => coordinator.shutdown()));
  await Promise.all(temporaryRoots.splice(0).map((root) =>
    fs.rm(root, { recursive: true, force: true })));
});

describe("CollaborationRuntimeCoordinator", () => {
  it("continues multiple retained Worker recovery rounds without reusing an input or replacing its owner", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-retained-recovery-inputs-")); temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub()); await storage.initialize();
    const state = projectState("prj_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaac");
    state.orchestration.routes.idea = [{ target: "finish", kind: "strong" }];
    await storage.createProject(state);
    const inputs = new Set<string>(); let resumed = 0, workerOpens = 0;
    const coordinator = new CollaborationRuntimeCoordinator({ storage, serviceId: "unique-worker-inputs", hostId: "fixture",
      harnessRecoveryDelayMs: () => 1, gitFactory: options => happyGitFake(options, []),
      residentLauncher: { async open(input) {
        workerOpens += 1; let closed = false;
        return { get closed() { return closed; }, async submit(turn) {
          if (inputs.has(turn.inputId)) throw new HarnessRuntimeError("HARNESS_CONTRACT_VIOLATION", "Duplicate input reached the native driver");
          inputs.add(turn.inputId);
          if (turn.prompt.startsWith("Resume the retained execution after coordinator recovery.")) resumed += 1;
          if (resumed < 2) return { handoff: "Business output is retained; formal delivery still needs repair." };
          return agentFixtureDelivery(input, turn, { handoff: "Original task delivered under the same owner." }, coordinator);
        }, async pause() {}, async resume() {}, async close() { closed = true; } };
      }, decideRoute: input => agentFixtureMainDecision(input, { targetNodeId: "finish", decisionRequestId: "verified-finish",
        output: "The retained task is integrated." }) } });
    liveCoordinators.push(coordinator); await coordinator.initialize();
    try {
      await coordinator.createProject(state, { enabled: true, provider: "github" });
      await waitFor(() => state.status === "completed", 12_000).catch(error => {
        throw new Error(JSON.stringify({ status: state.status, phase: state.phase, lastError: state.lastError, resumed, workerOpens, inputs: [...inputs] }), { cause: error });
      });
      expect(resumed).toBe(2); expect(workerOpens).toBe(1);
      expect(inputs.size).toBeGreaterThanOrEqual(7);
      expect(state.executions?.[0]?.ownershipEpoch).toBe(1);
      expect(state.failureAttempts?.some(attempt => attempt.redactedMessage.includes("Duplicate input"))).toBe(false);
    } finally { await coordinator.shutdown(); }
  }, 15_000);

  it("reconciles historical Main failures only after the original decision and finish receipt are durable", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-main-failure-recovery-")); temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub()); await storage.initialize();
    const state = projectState("prj_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaad");
    state.orchestration = { ...state.orchestration, agents: [{ name: "main", template: "main" }],
      input: { source: "input", target: "main" }, routes: { main: [] },
      termination: { agent: "main", condition: "Main confirms completion" } };
    state.agents = { main: state.agents.main }; state.runCounts = { main: 0 };
    state.tokenUsage.byAgent = { main: state.tokenUsage.byAgent.main! };
    await storage.createProject(state);
    let decisions = 0;
    const coordinator = new CollaborationRuntimeCoordinator({ storage, serviceId: "historical-main-failures", hostId: "fixture",
      gitFactory: options => happyGitFake(options, []), residentLauncher: { async open() { throw new Error("Only Main is required"); },
        async decideRoute(input) { decisions += 1; return agentFixtureMainDecision(input, { targetNodeId: "finish",
          decisionRequestId: "main-complete", output: "Main verified the complete result." }); } } });
    liveCoordinators.push(coordinator); await coordinator.initialize();
    try {
      await coordinator.createProject(state, { enabled: true, provider: "github" });
      await waitFor(() => state.status === "completed");
      const database = coordinator.database(), node = database.projectState(state.id).nodeRuns[0]!;
      for (const [index, operation] of [`main-route:${node.id}`, "main-route.recovery", `main-route.recovery:${node.id}`].entries()) {
        database.appendFailureAttempt({ projectId: state.id, attemptId: `historical-main-${index}`, nodeRunId: node.id,
          agentId: "main", scope: index === 2 ? "scheduler" : "resident", operation, status: "failed",
          errorCode: "MAIN_ROUTE_RECOVERY_REQUIRED", retryable: true, redactedMessage: "Original Main decision was incomplete",
          causeClass: "Error", startedAt: node.activatedAt, finishedAt: node.completedAt!, metadata: {} });
      }
      expect(database.projectState(state.id).failureSummary.unresolvedFailures).toBe(3);
      await coordinator.recoverProject(state);
      expect(decisions).toBe(1); expect(state.status).toBe("completed");
      const repaired = database.projectState(state.id);
      expect(repaired.failureSummary.unresolvedFailures).toBe(0);
      expect(repaired.failureAttempts.filter(attempt => attempt.status === "failed")).toHaveLength(3);
      expect(repaired.failureAttempts.filter(attempt => attempt.status === "succeeded" && attempt.nodeRunId === node.id)).toHaveLength(3);
      await coordinator.recoverProject(state);
      expect(database.projectState(state.id).failureAttempts).toHaveLength(repaired.failureAttempts.length);
    } finally { await coordinator.shutdown(); }
  });
  it("workflow continuity: joins a live Resume and releases the temporary input fence after a write failure", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "workflow-resume-input-fence-")); temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub()); await storage.initialize();
    const state = projectState("prj_89898989898989898989898989898988");
    state.orchestration = { ...state.orchestration, routes: { ...state.orchestration.routes,
      idea: [{ target: "finish", kind: "strong" }] } };
    await storage.createProject(state);
    const order: string[] = [];
    let release!: () => void, submits = 0, opens = 0;
    const originalTurn = new Promise<void>(resolve => { release = resolve; });
    const resumes = vi.fn(async () => {});
    const coordinator = new CollaborationRuntimeCoordinator({ storage, harnessRecoveryDelayMs: () => 5,
      gitFactory: options => happyGitFake(options, order), residentLauncher: { open: async input => {
        opens++;
        return { pause: async () => {}, resume: resumes, close: async () => {}, submit: async turn => {
          submits++;
          await originalTurn;
          return agentFixtureDelivery(input, turn, { handoff: "Original task completed" }, coordinator);
        } };
      } } });
    liveCoordinators.push(coordinator); await coordinator.initialize();
    try {
      await coordinator.createProject(state, { enabled: true, provider: "github" });
      await waitFor(() => submits === 1);
      await Promise.all([coordinator.resumeProject(state), coordinator.resumeProject(state)]);
      expect(resumes).not.toHaveBeenCalled();
      const write = vi.spyOn(storage, "writeProjectUserInput").mockRejectedValueOnce(new Error("Temporary user-input write failure"));
      await expect(coordinator.addProjectUserInput(state, { message: "Additional evidence", mode: "wait" }))
        .rejects.toThrow("Temporary user-input write failure");
      write.mockRestore();
      expect(state.pauseRequest).toBeUndefined();
      expect(hasUserWorkflowPause(state)).toBe(false);
      release();
      await waitFor(() => state.status === "completed");
      expect(opens).toBe(1); expect(submits).toBe(1);
      expect(order.filter(item => item === "pr:idea")).toHaveLength(1);
      expect(state.executions).toHaveLength(1);
      expect(state.userInputs).toEqual([]);
    } finally { release(); await coordinator.shutdown(); }
  });

  it.each(["automatic", "manual", "restart"] as const)("workflow continuity: completes a known remote merge after an exhausted local repair round (%s)", async mode => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "workflow-continuity-")); temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub()); await storage.initialize();
    let state = projectState("prj_89898989898989898989898989898989");
    state.orchestration = { ...state.orchestration, routes: { ...state.orchestration.routes,
      idea: [{ target: "finish", kind: "strong" }] } };
    await storage.createProject(state);
    const order: string[] = [];
    let submits = 0, synchronized = false, remoteMerges = 0, synchronizations = 0;
    let fake: CollaborationGitRuntime | undefined, currentOptions: CollaborationGitFactoryOptions;
    const resumes = vi.fn(async () => {});
    const options: ConstructorParameters<typeof CollaborationRuntimeCoordinator>[0] = { storage,
      harnessRecoveryDelayMs: () => mode === "automatic" ? 5 : 1_000,
      gitFactory: opts => {
        currentOptions = opts;
        if (fake) return fake;
        const base = happyGitFake(opts, order);
        const remoteOnly = (pull: any) => {
          if (!pull || synchronized) return pull;
          const { localSynchronization: _sync, ...remote } = pull;
          return remote;
        };
        fake = { ...base,
          observePullRequest: async request => remoteOnly(await base.observePullRequest!(request)),
          observePullRequestForExecution: async request => remoteOnly(await base.observePullRequestForExecution!(request)),
          mergePullRequest: async request => {
            remoteMerges++;
            const remote = remoteOnly(await base.mergePullRequest(request));
            const operation = { id: request.operationId, payloadHash: "a".repeat(64), kind: "pull.merge" as const,
              status: "prepared" as const, ownerExecutionId: request.execution.id, ownershipEpoch: request.ownershipEpoch,
              expectedHead: request.expectedHead, expectedBase: request.expectedBase };
            await currentOptions.operationStore.prepare(operation);
            await currentOptions.operationStore.transition({ id: operation.id, payloadHash: operation.payloadHash, status: "observed", remoteFact: remote });
            await currentOptions.operationStore.transition({ id: operation.id, payloadHash: operation.payloadHash, status: "finalized", remoteFact: remote });
            throw new GitCommandError(null, "Local fetch timed out after remote merge", { command: "fetch", stderr: "simulated timeout" });
          },
          reconcileMergedPullRequest: async request => {
            await currentOptions.operationStore.assertExecutionOwnership({ projectId: state.id,
              executionId: request.execution.id, ownershipEpoch: request.ownershipEpoch,
              expectedBranch: request.execution.executionBranch, operation: "provider.reconcile_merged",
              providerNumber: request.providerNumber, expectedHeadSha: request.expectedHead,
              expectedBase: request.expectedBase, expectedMergeCommitSha: request.expectedMergeCommitSha });
            synchronizations++;
            synchronized = true;
            return base.reconcileMergedPullRequest!(request);
          } };
        return fake;
      }, residentLauncher: {
        stopForRecovery: async () => ({ stopped: true, evidence: { fixtureNativeStopped: true } }),
        open: async input => {
          let closed = false;
          return { get closed() { return closed; }, pause: async () => {}, resume: resumes,
            close: async () => { closed = true; }, submit: async turn => {
              submits++;
              if (submits === 1) {
                await expect(agentFixtureRequests(input, turn, [
                  { tool: "finish_task", summary: "Original research already completed" },
                  { tool: "git_push", reason: "Publish my existing result" },
                  { tool: "github_create_pr", base: "main", title: "Original result", body: "Preserve this result" },
                  { tool: "github_merge_pr", providerNumber: 1, reason: "Merge my original result" }
                ])).rejects.toMatchObject({ code: "GIT_OPERATION_RESULT_AVAILABLE" });
              } else if (submits >= 4) {
                return agentFixtureDelivery(input, turn, { handoff: "Recovered original delivery" }, coordinator,
                  undefined, undefined, { retainedPull: true });
              }
              return { handoff: "Retained result; local synchronization is temporarily unavailable" };
            } };
        }
      } };
    let coordinator = new CollaborationRuntimeCoordinator(options);
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    try {
      await coordinator.createProject(state, { enabled: true, provider: "github" });
      if (mode !== "automatic") {
        await waitFor(() => state.status === "retrying" && submits === 3);
        const execution = state.executions![0]!;
        expect(coordinator.database().projectState(state.id).agentGitDelivery?.[execution.id]).toMatchObject({
          ready: false, unresolvedOperations: [expect.objectContaining({ kind: "pull.merge", localStage: "synchronization_pending" })] });
        if (mode === "manual") {
          await coordinator.pauseProject(state);
          expect(state.status).toBe(hasUserWorkflowPause(state) ? "paused" : "retrying");
          await new Promise(resolve => setTimeout(resolve, 30));
          expect(submits).toBe(3);
          await coordinator.resumeProject(state);
          expect(resumes).toHaveBeenCalledOnce();
        } else {
          const repository = repositoryFact(state.git!.repository!.name);
          const operation = { id: "continuity-repository", payloadHash: "continuity-repository" };
          coordinator.database().prepareOperation(state.id, { ...operation, kind: "repository.create", status: "prepared" });
          coordinator.database().transitionOperation(state.id, { ...operation, status: "observed", remoteFact: repository });
          coordinator.database().transitionOperation(state.id, { ...operation, status: "finalized", remoteFact: repository });
          await coordinator.shutdown();
          state = await storage.loadState(state.id);
          expect(state.workflowRecovery).toMatchObject({ pending: true, attempt: 1 });
          coordinator = new CollaborationRuntimeCoordinator(options);
          if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
          await coordinator.initialize();
          await coordinator.recoverProject(state);
        }
      }
      await waitFor(() => state.status === "completed", 8_000).catch(error => {
        throw new Error(JSON.stringify({ status: state.status, phase: state.phase, error: state.lastError, submits,
          workflowRecovery: state.workflowRecovery, executions: state.executions?.map(e => ({ id: e.id, epoch: e.ownershipEpoch, status: e.status })) }), { cause: error });
      });
      expect(remoteMerges).toBe(1);
      expect(synchronizations).toBe(1);
      expect(order.filter(item => item === "pr:idea")).toHaveLength(1);
      expect(state.executions).toHaveLength(1);
      expect(state.executions?.[0]?.status).toBe("succeeded");
      expect(state.workflowRecovery).toBeUndefined();
    } finally { await coordinator.shutdown(); }
  }, 20_000);

  it.each(["automatic", "manual", "restart", "permanent"])("restores a closed original standalone Agent with its merged PR (%s)", async recovery => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-native-recovery-")); temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub()); await storage.initialize();
    const state = projectState("prj_71717171717171717171717171717171");
    state.orchestration = { ...state.orchestration, routes: { ...state.orchestration.routes,
      idea: [{ target: "finish", kind: "strong" }] } };
    await storage.createProject(state);
    const order: string[] = [], opens: Array<{ id: string; taskId?: string; worktree: string; epoch: number }> = [];
    const oldResume = vi.fn(async () => { throw new Error("Closed native handles must not be resumed"); });
    let submits = 0;
    let retainedGit: CollaborationGitRuntime | undefined;
    const options: ConstructorParameters<typeof CollaborationRuntimeCoordinator>[0] = { storage, hostId: "native-recovery-host",
      harnessRecoveryDelayMs: () => recovery === "restart" ? 2_000 : recovery === "manual" || recovery === "permanent" ? 1_000 : 0, gitFactory: options => retainedGit ??= happyGitFake(options, order),
      residentLauncher: {
        stopForRecovery: async () => ({ stopped: true, evidence: { residentClosed: true } }),
        async open(input) {
          const context = input.request.executionContext!;
          opens.push({ id: context.executionId!, taskId: context.taskId, worktree: input.request.workspacePath,
            epoch: context.role === "leader" ? context.coordinatorEpoch : context.ownershipEpoch });
          let closed = false;
          return { get closed() { return closed; }, pause: async () => undefined, resume: oldResume,
            close: async () => { closed = true; }, submit: async turn => {
              submits += 1;
              if (submits === 1) {
                await agentFixtureRequests(input, turn, [
                  { tool: "git_push", reason: "Publish my completed files" },
                  { tool: "github_create_pr", base: "main", title: "Original delivery", body: "Preserve this PR" },
                  { tool: "github_merge_pr", providerNumber: 1, reason: "Integrate original delivery" }
                ]);
                closed = true;
                if (recovery !== "manual") throw new ProtocolToolArgumentsError("codex");
                throw new Error("Native process already closed after a failed turn");
              }
              if (recovery === "permanent") {
                closed = true;
                throw new HarnessRuntimeError("MODEL_AUTHENTICATION_FAILED", "Model provider authentication failed");
              }
              expect(turn.prompt).toContain("finish_task");
              const completed = await agentFixtureRequests(input, turn, [{ tool: "finish_task", summary: "Complete my original delivery" }]);
              return { handoff: "Original task recovered", controlActions: completed.envelopes };
            } };
        }
      } };
    let coordinator = new CollaborationRuntimeCoordinator(options);
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    try {
      await coordinator.createProject(state, { enabled: true, provider: "github" });
      if (recovery === "manual") {
        await waitFor(() => state.status === "retrying");
        await coordinator.pauseProject(state);
        await coordinator.resumeProject(state);
      }
      if (recovery === "restart") {
        await waitFor(() => Boolean(coordinator.database().pendingHarnessRecovery(state.id)) && state.status === "retrying");
        // The lightweight Git fixture supplies a live repository to the first
        // writer. Persist its real provider fact as production initialization
        // does, so a new writer can recover without that in-memory cache.
        const repository = repositoryFact(state.git!.repository!.name);
        const operation = { id: "native-recovery-repository", payloadHash: "native-recovery-repository-fact" };
        coordinator.database().prepareOperation(state.id, { ...operation, kind: "repository.create", status: "prepared" });
        coordinator.database().transitionOperation(state.id, { ...operation, status: "observed", remoteFact: repository });
        coordinator.database().transitionOperation(state.id, { ...operation, status: "finalized", remoteFact: repository });
        await coordinator.shutdown();
        // A stale technical-pause mirror must not override S's saved automatic
        // recovery intent. Explicit Pause still has its own separate proof.
        state.status = "paused"; state.phase = "collaboration:paused";
        await storage.saveState(state);
        coordinator = new CollaborationRuntimeCoordinator(options);
        if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
        await coordinator.initialize();
        await coordinator.recoverProject(state);
      }
      if (recovery === "permanent") {
        await waitFor(() => ["paused", "retrying"].includes(state.status) && submits === 2);
        expect(state.lastError).toContain("authentication failed");
        expect(coordinator.database().pendingHarnessRecovery(state.id)).toBeUndefined();
        await coordinator.recoverProject(state);
        expect(state.status).toBe(hasUserWorkflowPause(state) ? "paused" : "retrying");
        expect(submits).toBe(2);
        return;
      }
      await waitFor(() => state.status === "completed").catch(error => {
        throw new Error(JSON.stringify({ status: state.status, phase: state.phase, error: state.lastError,
          pending: coordinator.database().pendingHarnessRecovery(state.id)?.payload, opens, submits }), { cause: error });
      });
      expect(oldResume).not.toHaveBeenCalled();
      expect(opens).toHaveLength(2);
      expect(opens[1]).toEqual({ ...opens[0], epoch: 2 });
      expect(order.filter(item => item.startsWith("push-") || item === "pr:idea")).toHaveLength(2);
      expect(state.executions?.[0]).toMatchObject({ id: opens[0]!.id, ownershipEpoch: 2, status: "succeeded" });
      expect(state.taskCompletions?.[opens[0]!.id]).toBeDefined();
      expect(coordinator.database().executionHasNativeRecoveryStopProvenance(state.id, opens[0]!.id, 1)).toBe(true);
      expect(coordinator.database().executionHasExactRestartStopProvenance(state.id, opens[0]!.id, 1)).toBe(false);
      expect(coordinator.database().latestAgentGitFacts(state.id, opens[0]!.id, 2)?.merged?.providerNumber).toBe(1);
      await waitFor(() => !coordinator.database().pendingHarnessRecovery(state.id));
    } finally { await coordinator.shutdown(); }
  }, 20_000);

  it.each([true, false])("restores the exact completed Stop without repeating its lifecycle (%s)", async alreadyConfirmed => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-completed-stop-recovery-")); temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub()); await storage.initialize();
    const state = projectState("prj_46464646464646464646464646464646");
    state.orchestration = normalizeNewGitOrchestration(state.orchestration); state.formalStateProtocol = "project-state-v1";
    state.git = { enabled: true, provider: "github", status: "ready", repository: repositoryFact("stopped-history") };
    state.mainInvocationSeq = 7;
    state.status = "paused"; state.phase = "collaboration:user-cancelled";
    await storage.createProject(state);
    const native = vi.fn(async () => { throw new Error("Stopped history must not restart native"); });
    const provider = vi.fn(async () => { throw new Error("Stopped history must not refresh remote Git"); });
    const coordinator = new CollaborationRuntimeCoordinator({ storage,
      gitFactory: options => ({ ...happyGitFake(options, []), observeRemoteRef: provider }), residentLauncher: { open: native, decideRoute: native } });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    try {
      const db = coordinator.database();
      db.createProject({ projectId: state.id, workflowRevision: 1, workflowSnapshot: state.orchestration,
        git: state.git, workerCapacity: 2, managementCapacity: 1, formalState: { checkpoint: state } });
      const intent = db.appendEvent({ projectId: state.id, agentId: "main", requestId: "original-user-stop",
        type: "project.cancellation.requested", payload: { actor: "user", reason: "user_cancelled", resumable: true } });
      if (alreadyConfirmed) db.confirmProjectCancellationStopped(state.id);
      const originalCounts = structuredClone({ mainInvocationSeq: state.mainInvocationSeq, runCounts: state.runCounts });
      const cancel = vi.spyOn(coordinator, "cancelProject");
      await coordinator.recoverProject(state);
      expect(state.status).toBe(hasUserWorkflowPause(state) ? "paused" : "retrying"); expect(state.phase).toBe("collaboration:user-cancelled");
      const proof = db.eventByRequestId(state.id, `project-stop-confirmed:${state.id}:${intent.event.seq}`);
      expect(proof?.type).toBe("project.cancellation.stop_confirmed");
      await coordinator.recoverProject(state);
      expect(cancel).toHaveBeenCalledTimes(alreadyConfirmed ? 0 : 1);
      expect(db.eventByRequestId(state.id, `project-stop-confirmed:${state.id}:${intent.event.seq}`)).toEqual(proof);
      expect({ mainInvocationSeq: state.mainInvocationSeq, runCounts: state.runCounts }).toEqual(originalCounts);
      expect(native).not.toHaveBeenCalled(); expect(provider).not.toHaveBeenCalled();
      expect(db.eventsAfter(state.id, 0, 1000).filter(e => e.type === "project.cancellation.stop_confirmed")).toHaveLength(1);
    } finally { await coordinator.shutdown(); }
  });

  it.each([false, true])("reuses an exactly committed Main response without recounting after a later user revision (%s)", async advance => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-main-response-replay-")); temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub()); await storage.initialize();
    const state = projectState("prj_45454545454545454545454545454545");
    state.orchestration = normalizeNewGitOrchestration(state.orchestration);
    state.formalStateProtocol = "project-state-v1";
    state.git = { enabled: true, provider: "github", status: "ready", repository: repositoryFact("main-replay") };
    await storage.createProject(state);
    const native = vi.fn(async () => { throw new Error("Replay must not start another native turn"); });
    const coordinator = new CollaborationRuntimeCoordinator({ storage, gitFactory: options => happyGitFake(options, []),
      residentLauncher: { open: native, decideRoute: native } });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    try {
      const db = coordinator.database();
      db.createProject({ projectId: state.id, workflowRevision: 1, workflowSnapshot: state.orchestration,
        git: state.git, workerCapacity: 2, managementCapacity: 1, formalState: { checkpoint: state } });
      const nodeRunId = "main-replay-node", inputId = "main-original-input", invocationId = "inv_" + "4".repeat(32);
      db.activateNode({ projectId: state.id, nodeRunId, node: { kind: "agent", nodeId: "main", agentId: "main" },
        activationRequestId: "main-replay-activation", inputSnapshotRef: inputId, activatedByAgentId: "main", workflowRevision: 1 });
      const taskId = `main-management:${nodeRunId}:1:${inputId}`;
      db.appendEvent({ projectId: state.id, nodeRunId, agentId: "main", coordinatorEpoch: 1, invocationId,
        requestId: "main-task-completion-" + createHash("sha256").update(taskId).digest("hex"),
        type: "main.route.task_completion.committed", payload: { taskId, inputId, callId: "original-finish" } });
      const input = { state, sourceNodeRunId: nodeRunId, sourceAgentId: "main", sourceIsMain: true,
        workspacePath: "", routeEpoch: 1, inputId, invocationId,
        decision: { targetNodeId: "idea", decisionRequestId: "original-main-route", output: "Original accepted route" },
        signal: new AbortController().signal };
      const finish = (coordinator as unknown as { finishMainRouteDecision(request: typeof input): Promise<unknown> }).finishMainRouteDecision.bind(coordinator);
      await finish(input);
      const response = db.eventByRequestId(state.id, `main-route-response-${nodeRunId}-1`);
      expect(response).toMatchObject({ workflowRevision: 1, type: "main.route.response.committed" });
      const originalMainInvocationSeq = state.mainInvocationSeq;
      if (advance) {
        const next = structuredClone(state.orchestration); next.decisionPlans.main = "A later original user instruction";
        await coordinator.saveWorkflowRevision(state, { orchestration: next, affectedGroupIds: [], requestId: "later-user-revision" });
        expect(state.workflowRevision).toBe(2);
      }
      const eventsBefore = db.eventsAfter(state.id, 0, 1000), revisionBefore = db.projectState(state.id).stateRevision;
      await expect(finish(input)).resolves.toEqual(input.decision);
      expect(state.mainInvocationSeq).toBe(originalMainInvocationSeq);
      expect(db.eventByRequestId(state.id, `main-route-response-${nodeRunId}-1`)).toEqual(response);
      expect(db.eventsAfter(state.id, 0, 1000).filter(e => e.type === "main.route.response.committed")).toHaveLength(1);
      expect(db.projectState(state.id).workflowRevision).toBe(advance ? 2 : 1);
      expect(db.projectState(state.id).stateRevision).toBe(revisionBefore);
      expect(db.eventsAfter(state.id, 0, 1000)).toEqual(eventsBefore);
      expect(native).not.toHaveBeenCalled();
    } finally { await coordinator.shutdown(); }
  });

  it.each(["missing", "missing-sha", "provider-error", "frozen-authorization-error"] as const)("isolates an unconfirmed remote main during actual project startup (%s)", async outcome => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-startup-remote-failure-")); temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub()); await storage.initialize();
    const blocked = projectState("prj_41414141414141414141414141414141"), untouched = projectState("prj_42424242424242424242424242424242");
    for (const state of [blocked, untouched]) {
      state.formalStateProtocol = "project-state-v1";
      state.git = { enabled: true, status: "ready", provider: "github", repository: {
        owner: "fixture-owner", name: state.id, htmlUrl: `https://github.example/${state.id}`, private: true,
        defaultBranch: "main", localPath: path.join(storage.projectDir(state.id), "repository")
      } };
      state.phase = "collaboration:ready";
      await storage.createProject(state);
    }
    blocked.status = "queued"; await storage.saveState(blocked);
    const provider = vi.fn(async (repository: { owner: string; name: string }, ref: string) => {
      if (outcome === "provider-error") throw new Error("Original provider ref query failed");
      if (outcome === "frozen-authorization-error") throw new GitHubAuthorizationError(401, "GitHub credential could not be resolved");
      return { owner: repository.owner, repository: repository.name, ref,
        status: outcome === "missing" ? "missing" as const : "present" as const, observedAt: new Date().toISOString() };
    });
    const native = vi.fn(async () => { throw new Error("Unconfirmed base must not start native or business work"); });
    const coordinator = new CollaborationRuntimeCoordinator({ storage, gitFactory: options => ({ ...happyGitFake(options, []),
      observeRemoteRef: provider }), residentLauncher: { open: native, decideRoute: native,
        async observeMainRouteRecovery() { return { stopped: true, evidence: { processGroupAbsent: true } }; } } });
    const runner: AgentRunner = { run: native, harnessCatalog: async () => harnessCatalogRegistry.list().map(d => toPublicHarnessDescriptor(d, { available: true })) };
    const orchestrator = new Orchestrator(storage, new SkillCatalog([]), runner, { retryBaseMs: 1, retryMaxMs: 1 }, undefined, coordinator);
    try {
      if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
      await coordinator.initialize();
      for (const state of [blocked, untouched]) coordinator.database().createProject({ projectId: state.id, workflowRevision: 1,
        workflowSnapshot: state.orchestration, git: state.git!, workerCapacity: 1, formalState: { checkpoint: state } });
      for (const state of [blocked, untouched]) {
        const id = `startup-repository-${state.id}`, fact = repositoryFact(state.id);
        coordinator.database().prepareOperation(state.id, { id, kind: "repository.create", payloadHash: id, status: "prepared" });
        for (const status of ["observed", "finalized"] as const)
          coordinator.database().transitionOperation(state.id, { id, payloadHash: id, status, remoteFact: fact });
      }
      // Register genuinely new empty domains first, then retain the real
      // checkpoint shape used by recovery rather than migrating history.
      for (const state of [blocked, untouched]) {
        state.agentSessions = { main: { schemaVersion: 1, harnessId: "codex", adapterVersion: "1", nativeId: `original-${state.id}`,
          generation: 0, durable: true, createdAt: state.createdAt } };
        state.agentSessionIds = { main: state.agentSessions.main!.nativeId };
        state.runCounts.main = 2; state.mainInvocationSeq = 2;
        await storage.saveState(state);
      }
      const original = structuredClone({ session: blocked.agentSessions, ids: blocked.agentSessionIds, counts: blocked.runCounts,
        mainInvocationSeq: blocked.mainInvocationSeq, requirement: blocked.requirement });
      if (outcome === "frozen-authorization-error") {
        const db = coordinator.database();
        db.activateNode({ projectId: blocked.id, nodeRunId: "frozen-startup-main",
          node: { kind: "agent", nodeId: "main", agentId: "main" }, activationRequestId: "frozen-startup-input",
          inputSnapshotRef: `project:${blocked.id}:requirement:cycle:1`, activatedByAgentId: "main", workflowRevision: 1 });
        db.freezeMainRouteFailure({ projectId: blocked.id, nodeRunId: "frozen-startup-main", routeEpoch: 1,
          error: "Original Main process disappeared", requestId: "freeze-startup-main" });
      }
      await expect(orchestrator.initialize()).resolves.toBeUndefined();
      const projects = await orchestrator.listProjects(); expect(projects).toHaveLength(2);
      const failed = projects.find(p => p.id === blocked.id)!;
      expect(failed).toMatchObject({ status: "retrying", phase: "collaboration:recovering" });
      expect(failed.lastError).toContain(outcome === "provider-error" ? "Original provider ref query failed"
        : outcome === "frozen-authorization-error" ? "GitHub credential could not be resolved" : "Remote main ref is unavailable");
      expect({ session: failed.agentSessions, ids: failed.agentSessionIds, counts: failed.runCounts,
        mainInvocationSeq: failed.mainInvocationSeq, requirement: failed.requirement }).toEqual(original);
      expect(projects.find(p => p.id === untouched.id)).toMatchObject({ status: "retrying", phase: "collaboration:ready" });
      expect(coordinator.database().failureAttempts(blocked.id)).toEqual(expect.arrayContaining([expect.objectContaining({
        scope: "git", operation: "project.recovery.remote-ref", status: "failed", retryable: true
      })]));
      expect(coordinator.database().failureAttempts(untouched.id)).toEqual([]);
      expect(provider).toHaveBeenCalledTimes(1); expect(native).not.toHaveBeenCalled();
      coordinator.database().assertWriterLeaseHeld();
    } finally { await orchestrator.shutdown(); }
  });

  it("drains more than one page of formal document events without generating a new event for each mirrored document", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-state-mirror-pages-")); temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub()); await storage.initialize();
    const state = projectState("prj_83838383838383838383838383838383"); state.git = { enabled: true, status: "ready" };
    state.phase = "paused"; state.formalStateProtocol = "project-state-v1"; await storage.createProject(state);
    const coordinator = new CollaborationRuntimeCoordinator({ storage });
    try {
      if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
      await coordinator.initialize(); const database = coordinator.database();
      database.createProject({ projectId: state.id, workflowRevision: 1, workflowSnapshot: state.orchestration,
        git: state.git, workerCapacity: 1, formalState: { checkpoint: state } });
      for (let i = 0; i < 510; i++) {
        const prior = database.projectStateDocument(state.id, "project.checkpoint")!;
        database.writeProjectStateDocument(state.id, "project.checkpoint", { ...state, phase: `observed-${i}` }, prior.version);
      }
      const before = database.eventsAfter(state.id, 0, 2000).length;
      const append = storage.appendEvent.bind(storage); let mirrored = 0;
      vi.spyOn(storage, "appendEvent").mockImplementation(async (...args) => {
        // Bound the reproduction even if a 500-event page reproduces itself.
        if (++mirrored > 530) throw new Error("Formal document mirror feedback did not converge");
        return append(...args);
      });
      const publisher = coordinator as unknown as { publishProjection(state: ProjectState, projection: ReturnType<typeof database.projectState>): Promise<void> };
      await publisher.publishProjection(state, database.projectState(state.id));
      const after = database.eventsAfter(state.id, 0, 2000).length;
      expect(after - before).toBeLessThan(10); expect(mirrored).toBeLessThan(10);
      expect(database.projectStateDocument(state.id, "project.checkpoint")?.value).toMatchObject({ id: state.id, status: "paused" });
      const history = database.projectStateRequest({ kind: "system", projectId: state.id, source: "controlled-system-reader" },
        { operation: "get", object: { kind: "project", id: state.id } }) as { historyTotal: number };
      expect(history.historyTotal).toBeGreaterThan(510);
    } finally { await coordinator.shutdown(); }
  });

  it("registers a genuinely new Git project through the Orchestrator and keeps its checkpoint and Agent extensions authoritative across shutdown", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-new-git-state-")); temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    let inspected = false;
    const coordinator = new CollaborationRuntimeCoordinator({ storage,
      gitFactory: options => ({ ...happyGitFake(options, []), async prepareAgentManagementWorkspace(agentId) {
        const directory = path.join(options.projectRoot, "git-worktrees", "agents", agentId);
        await fs.mkdir(directory, { recursive: true }); return directory;
      } }), residentLauncher: {
        async open() { throw new Error("The accepted workflow contains only the root Main"); },
        async decideRoute(input) {
          inspected = true;
          const runtime = await input.open.turnRequestFactory({ baseRequest: input.open.request, turn: input.turn });
          const object = { kind: "project", id: input.state.id };
          const before = await runtime.request.onProjectStateRequest!({ operation: "get", object }) as { version: string; core: { formalState: { domain: { scheduler: string } } } };
          expect(before.core.formalState.domain.scheduler).toBe("git");
          await runtime.request.onProjectStateRequest!({ operation: "patch", object, expectedVersion: before.version,
            set: { completed: true, acceptance_progress: { step: "Main inspected the original task" } },
            reason: "Main's explicitly chosen business fields", callId: "original-state-patch" });
          expect(input.state.status).not.toBe("completed");
          return agentFixtureMainDecision(input, { targetNodeId: "finish", decisionRequestId: "original-main-finish",
            output: "Main explicitly verified this bounded integration task" });
        }
      } });
    const runner: AgentRunner = { run: async () => { throw new Error("Git projects must use the trusted coordinator"); },
      harnessCatalog: async () => harnessCatalogRegistry.list().map(entry => toPublicHarnessDescriptor(entry, { available: true })) };
    const orchestrator = new Orchestrator(storage, new SkillCatalog([]), runner, { retryBaseMs: 1, retryMaxMs: 1 }, undefined, coordinator);
    try {
      await orchestrator.initialize();
      const project = await orchestrator.createProject({ title: "New formal Git state", requirement: "Main inspects the original task",
        git: { enabled: true }, agents: { main: { model: "fixture-model", harness: "codex", skills: [], autoSkills: [] } },
        orchestration: { agents: [{ name: "main", template: "main" }], input: { source: "input", target: "main" }, routes: { main: [] },
          decisionPlans: { main: "Inspect the original task" }, allowUserIntervention: true,
          termination: { agent: "main", condition: "Main explicitly verifies the task", decisionBy: "main", automatic: false }, resultFormat: { presets: [], custom: "" } } });
      await waitFor(() => coordinator.database().projectState(project.id).runtime?.status === "completed");
      expect(inspected).toBe(true); expect((await storage.loadState(project.id)).lastError).toBeFalsy();
      const projection = coordinator.database().projectState(project.id);
      expect(projection.runtime?.status).toBe("completed");
      expect(projection.formalState?.checkpoint.lifecycle).not.toHaveProperty("status");
      expect(coordinator.database().projectStateDocument(project.id, "project.checkpoint")!.value).toMatchObject({ status: "completed" });
      expect(projection.businessState).toEqual(expect.arrayContaining([expect.objectContaining({
        object: { kind: "project", id: project.id }, extensions: { completed: true, acceptance_progress: { step: "Main inspected the original task" } }
      })]));
      await orchestrator.shutdown();
      await fs.rm(path.join(storage.projectDir(project.id), "state.json"));
      const independent = new ProjectStorage(root, new EventHub()); await independent.initialize();
      expect((await independent.loadState(project.id)).status).toBe("completed");
      expect((await storage.loadState(project.id)).formalStateProtocol).toBe("project-state-v1");
    } finally { await orchestrator.shutdown(); }
  });

  it("logs the original SQLite heartbeat failure once and fences a still-unexpired writer", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-heartbeat-diagnostic-")); temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub()); await storage.initialize();
    let clock = Date.now();
    const state = projectState("prj_17171717171717171717171717171717");
    state.git = { enabled: true, status: "ready" }; state.phase = "idle";
    await storage.createProject(state);
    const coordinator = new CollaborationRuntimeCoordinator({ storage, databasePath: path.join(root, "collaboration.sqlite"),
      serviceId: "heartbeat-diagnostic", hostId: "test-host", leaseDurationMs: 30_000, now: () => clock });
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
    try {
      liveCoordinators.push(coordinator); await coordinator.initialize();
      const database = coordinator.database();
      database.createProject({ projectId: state.id, workflowRevision: 1, workflowSnapshot: state.orchestration,
        git: state.git, workerCapacity: 1, managementCapacity: 1 });
      const lease = database.writerLease();
      const error = Object.assign(new Error("disk I/O error"), { code: "ERR_SQLITE_ERROR", errcode: 778 });
      const renew = vi.spyOn(database, "renewWriterLease").mockImplementation(() => { throw error; });
      clock += 10_000; vi.advanceTimersByTime(10_000);
      expect(log).toHaveBeenCalledExactlyOnceWith("Collaboration writer lease renewal failed; writer fenced", {
        timestamp: new Date(clock).toISOString(), error: "disk I/O error", code: "ERR_SQLITE_ERROR", sqliteCode: 778,
        leaseEpoch: lease.epoch, leaseExpiresAt: new Date(lease.expiresAtMs).toISOString()
      });
      expect(() => database.assertWriterLeaseHeld()).not.toThrow();
      expect(database.writerLease()).toEqual(lease);
      expect(coordinator.projectReadModel(state).phase).toBe("collaboration:writer-lease-lost");
      await expect(coordinator.pauseProject(state)).rejects.toThrow("writer lease was lost");
      clock += 10_000; vi.advanceTimersByTime(10_000);
      expect(renew).toHaveBeenCalledOnce(); expect(log).toHaveBeenCalledOnce();
    } finally { await coordinator.shutdown().catch(() => undefined); vi.useRealTimers(); log.mockRestore(); }
  });

  it.each(["retry", "expired", "replaced", "unexpected"] as const)(
    "keeps an unexpired writer through actual SQLite reader contention, then handles %s", async outcome => {
      const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-reader-heartbeat-")); temporaryRoots.push(root);
      const storage = new ProjectStorage(root, new EventHub()); await storage.initialize();
      let clock = Date.now(); const startedAt = clock;
      const state = projectState("prj_15151515151515151515151515151515");
      state.git = { enabled: true, status: "ready" }; state.phase = "idle";
      await storage.createProject(state);
      const databasePath = path.join(root, "collaboration.sqlite");
      const coordinator = new CollaborationRuntimeCoordinator({ storage, databasePath,
        serviceId: "reader-heartbeat", hostId: "test-host", leaseDurationMs: 30_000, now: () => clock });
      let reader: DatabaseSync | undefined; let successor: CollaborationStateDatabase | undefined;
      vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
      try {
        if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
        await coordinator.initialize();
        const database = coordinator.database();
        database.createProject({ projectId: state.id, workflowRevision: 1, workflowSnapshot: state.orchestration,
          git: state.git, workerCapacity: 1, managementCapacity: 1 });
        const original = database.writerLease();
        const phase = coordinator.projectReadModel(state).phase;
        const failures: unknown[] = []; const renew = database.renewWriterLease.bind(database);
        vi.spyOn(database, "renewWriterLease").mockImplementation(() => {
          try { return renew(); } catch (error) { failures.push(error); throw error; }
        });
        reader = new DatabaseSync(databasePath, { readOnly: true });
        expect(reader.prepare("PRAGMA journal_mode").get()).toMatchObject({ journal_mode: "delete" });
        reader.exec("BEGIN"); reader.prepare("SELECT * FROM writer_service_lease").get();
        clock += 10_000;
        vi.advanceTimersByTime(10_000);
        expect(failures).toHaveLength(1);
        expect(failures[0]).toMatchObject({ errcode: 5 });
        // The actual failed COMMIT rolled back. The original epoch still
        // owns its unexpired lease; a reader did not become a successor.
        expect(() => database.assertWriterLeaseHeld()).not.toThrow();
        expect(database.writerLease()).toEqual(original);
        reader.exec("ROLLBACK"); reader.close(); reader = undefined;
        expect(coordinator.projectReadModel(state).phase).toBe(phase);
        if (outcome === "retry") {
          clock += 10_000; vi.advanceTimersByTime(10_000);
          expect(database.writerLease()).toMatchObject({ epoch: original.epoch, instanceId: original.instanceId,
            expiresAtMs: startedAt + 50_000 });
          await expect(coordinator.pauseProject(state)).resolves.toBeUndefined();
          expect(state.pauseRequest?.settledAt).toBeTruthy();
        } else if (outcome === "unexpected") {
          vi.mocked(database.renewWriterLease).mockImplementationOnce(() => {
            throw new Error("Unexpected heartbeat failure");
          });
          clock += 10_000; vi.advanceTimersByTime(10_000);
          expect(() => database.assertWriterLeaseHeld()).not.toThrow();
          expect(coordinator.projectReadModel(state).phase).toBe("collaboration:writer-lease-lost");
          await expect(coordinator.pauseProject(state)).rejects.toThrow("writer lease was lost");
        } else {
          clock = original.expiresAtMs + 1;
          if (outcome === "replaced") successor = CollaborationStateDatabase.open({ databasePath,
            serviceId: "reader-heartbeat-successor", instanceId: "successor", hostId: "test-host", topology: "single-host",
            leaseDurationMs: 30_000, now: () => clock });
          vi.advanceTimersByTime(10_000);
          expect(coordinator.projectReadModel(state).phase).toBe("collaboration:writer-lease-lost");
          await expect(coordinator.pauseProject(state)).rejects.toThrow("writer lease was lost");
          expect(database.writerLease().epoch).toBe(original.epoch);
          if (successor) {
            expect(successor.writerLease().epoch).toBe(original.epoch + 1);
            expect(() => successor!.assertWriterLeaseHeld()).not.toThrow();
          }
        }
      } finally {
        if (reader) { reader.exec("ROLLBACK"); reader.close(); }
        successor?.relinquishWriterLease(); successor?.close();
        await coordinator.shutdown().catch(() => undefined); vi.useRealTimers();
      }
    }, 15_000);

  it.each([false, true].flatMap(scoped => ["entry", "event append", "event state", "workflow definition", "workflow state", "durable status", "state file", "management reference"].map(boundary => ({ scoped, boundary }))))(
    "fences the old writer at $boundary after an independent successor publishes the same configuration (scoped=$scoped)", async ({ scoped, boundary }) => {
      const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-git-writer-")); temporaryRoots.push(root);
      const storage = new ProjectStorage(root, new EventHub()); await storage.initialize(); let clock = Date.now();
      const state = projectState("prj_16161616161616161616161616161616"); state.title = "Original writer publication";
      state.git = { enabled: true, status: "ready" }; state.status = "running"; state.phase = "idle";
      if (scoped) state.orchestration = { ...state.orchestration, schemaVersion: 3,
        scopedWorkflow: { schemaVersion: 1, rootAgentIds: state.orchestration.agents.map(agent => agent.name), groups: [] } };
      state.agents = mergeAgentConfigs(state.agents, state.orchestration);
      const session = { schemaVersion: 1 as const, harnessId: "codex", adapterVersion: "controlled", nativeId: "original-writer-session",
        generation: 4, durable: true, createdAt: new Date(clock).toISOString() };
      state.agentSessions = { main: session }; state.agentSessionIds = { main: session.nativeId };
      state.agentSessionMeta = { main: { generation: 4, contextSeq: 17, resumeFailureCount: 2 } }; state.runCounts.main = 9; state.mainInvocationSeq = 42;
      await storage.createProject(state);
      const native = { open: vi.fn(async () => { throw new Error("Writer publication cannot open a model"); }),
        decideRoute: vi.fn(async () => { throw new Error("Writer publication cannot create a Main turn"); }) };
      const options = { storage, databasePath: path.join(root, "writer.sqlite"), serviceId: "git-writer-fixture", hostId: "test",
        now: () => clock, leaseDurationMs: 300_000, validateWorkflowConfiguration: async () => undefined, residentLauncher: native };
      const coordinator = new CollaborationRuntimeCoordinator(options); await coordinator.initialize(); const database = coordinator.database();
      database.createProject({ projectId: state.id, workflowRevision: 1, workflowSnapshot: state.orchestration, git: state.git, workerCapacity: 2 });
      database.initializeScopedConfiguration(state.id, { agents: state.agents, skillDefinitions: {}, mcpDefinitions: {} });
      await coordinator.saveWorkflowRevision(state, { orchestration: state.orchestration, affectedGroupIds: [] });
      const current = coordinator.getWorkflowAdjustments(state).current;
      const workspace = await fs.realpath(await storage.roleWorkspace(state.id, "main", "inv_writer_fixture"));
      const draftName = scoped ? ".scienceevolve/management/inv_original/proposal/workflow.json" : "workflow.json";
      if (scoped) await fs.mkdir(path.dirname(path.join(workspace, draftName)), { recursive: true });
      const draft = await storage.writeMainAgentOrchestrationSnapshot(state.id, draftName, mainAgentOrchestrationDocument(state.id,
        current.snapshot.orchestration, current.snapshot.agents, current.snapshot.skillDefinitions, current.snapshot.mcpDefinitions, current.version));
      const draftBytes = await fs.readFile(draft), draftInode = (await fs.stat(draft)).ino;
      database.appendEvent({ projectId: state.id, type: "projection.test.observation", payload: { message: "Original writer has one accepted event to mirror" } });
      const targets = [path.join(storage.projectDir(state.id), "state.json"), path.join(storage.projectDir(state.id), "workflow", "definition.json"),
        path.join(storage.projectDir(state.id), "workflow", "current-state.json"), path.join(workspace, ".scienceevolve", "workflow-current.json")];
      let successor: { epoch: number; version: typeof current.version; nativeCalls: number } | undefined;
      let published: Array<{ bytes: Buffer; inode: number }> = [], finalStateWrite = false;
      const handoff = async () => {
        if (successor) return; clock += 1_000_000;
        successor = await new Promise((resolve, reject) => execFile(process.execPath,
          ["--import", "tsx", "tests/main-core/helpers/workflow-projection-writer.ts", root, state.id, String(clock)],
          { cwd: process.cwd(), encoding: "utf8", timeout: 20_000 }, (error, stdout, stderr) => {
            if (error) reject(new Error(`Independent writer failed: ${stderr}`, { cause: error })); else resolve(JSON.parse(stdout));
          }));
        published = await Promise.all(targets.map(async file => ({ bytes: await fs.readFile(file), inode: (await fs.stat(file)).ino })));
      };
      const append = storage.appendEvent.bind(storage), save = storage.saveState.bind(storage), write = fs.writeFile.bind(fs), durable = coordinator.durableProjectStatus.bind(coordinator);
      const appendHook = vi.spyOn(storage, "appendEvent").mockImplementation(async (...args) => { if (boundary === "event append") await handoff(); return append(...args); });
      const saveHook = vi.spyOn(storage, "saveState").mockImplementation(async (...args) => { finalStateWrite = true; return save(...args); });
      const writeHook = vi.spyOn(fs, "writeFile").mockImplementation(async (...args) => {
        await write(...args); const file = String(args[0]);
        if (boundary === "event state" && !finalStateWrite && file.includes(".state.json.") ||
          boundary === "state file" && finalStateWrite && file.includes(".state.json.") ||
          boundary === "workflow definition" && file.startsWith(targets[1] + ".") ||
          boundary === "workflow state" && file.startsWith(targets[2] + ".") ||
          boundary === "management reference" && file.includes(".workflow-current.json.")) await handoff();
      });
      const statusHook = vi.spyOn(coordinator, "durableProjectStatus").mockImplementation(async (...args) => {
        const status = await durable(...args); if (boundary === "durable status") await handoff(); return status;
      });
      let recovery: CollaborationRuntimeCoordinator | undefined;
      try {
        if (boundary === "entry") await handoff();
        const publish = boundary === "management reference"
          ? coordinator.readMainWorkflowProposal(state, workspace, draft, current.version)
          : coordinator.saveWorkflowRevision(state, { orchestration: state.orchestration, affectedGroupIds: [] });
        await expect(publish).rejects.toThrow(/writer|lease/i);
        expect(successor!.epoch).toBeGreaterThan(database.writerLease().epoch); expect(successor!.version).toEqual(current.version); expect(successor!.nativeCalls).toBe(0);
        for (let index = 0; index < targets.length; index++) {
          expect(await fs.readFile(targets[index])).toEqual(published[index].bytes); expect((await fs.stat(targets[index])).ino).toBe(published[index].inode);
        }
        expect(await fs.readFile(draft)).toEqual(draftBytes); expect((await fs.stat(draft)).ino).toBe(draftInode);
        appendHook.mockRestore(); saveHook.mockRestore(); writeHook.mockRestore(); statusHook.mockRestore();
        recovery = new CollaborationRuntimeCoordinator(options); await recovery.initialize();
        const loaded = await storage.loadState(state.id); await recovery.saveWorkflowRevision(loaded, { orchestration: loaded.orchestration, affectedGroupIds: [] });
        const persisted = await storage.loadState(state.id); expect(persisted.title).toBe("Current writer publication");
        expect(persisted.agentSessions).toEqual({ main: session }); expect(persisted.agentSessionIds).toEqual({ main: session.nativeId });
        expect(persisted.agentSessionMeta).toEqual(state.agentSessionMeta); expect(persisted.runCounts.main).toBe(9); expect(persisted.mainInvocationSeq).toBe(42);
        const events = await storage.readEvents(state.id, 0, Number.MAX_SAFE_INTEGER); expect(new Set(events.map(event => event.eventId)).size).toBe(events.length);
        expect(recovery.database().projectState(state.id).tasks).toEqual([]); expect(recovery.database().projectState(state.id).executions).toEqual([]);
        expect(native.open).not.toHaveBeenCalled(); expect(native.decideRoute).not.toHaveBeenCalled();
      } finally {
        appendHook.mockRestore(); saveHook.mockRestore(); writeHook.mockRestore(); statusHook.mockRestore();
        await recovery?.shutdown(); await coordinator.shutdown().catch(error => expect(error).toMatchObject({ code: "WRITER_LEASE_STALE" }));
      }
    }, 30_000);

  it.each([false, true].flatMap(scoped => ["recover", "legacy authority", "existing", "unavailable", "no validator", "empty validation", "wrong route", "late snapshot", "persistence failure"].map(mode => ({ scoped, mode }))))(
    "recovers an unchanged formal gateway route without replacing original runtime facts ($mode, scoped=$scoped)", async ({ scoped, mode }) => {
      const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-gateway-recovery-")); temporaryRoots.push(root);
      const storage = new ProjectStorage(root, new EventHub()); await storage.initialize();
      let state = projectState("prj_15151515151515151515151515151515");
      state.git = { enabled: true, status: "ready" }; state.status = "running"; state.phase = "idle";
      if (scoped) state.orchestration = { ...state.orchestration, schemaVersion: 3,
        scopedWorkflow: { schemaVersion: 1, rootAgentIds: state.orchestration.agents.map(agent => agent.name), groups: [] } };
      const session = { schemaVersion: 1 as const, harnessId: "codex", adapterVersion: "controlled", nativeId: "original-gateway-recovery-session",
        generation: 4, durable: true, createdAt: new Date().toISOString() };
      state.agentSessions = { main: session }; state.agentSessionIds = { main: session.nativeId };
      state.agentSessionMeta = { main: { generation: 4, contextSeq: 17, resumeFailureCount: 2 } }; state.runCounts.main = 9; state.mainInvocationSeq = 42;
      state.agents.main.gatewayId = "gwy_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"; state.agents.main.model = "recovery-model";
      const snapshot = { id: state.agents.main.gatewayId, name: "Original accepted gateway", url: "https://controlled.invalid", apiKey: "recovered-server-secret",
        models: [state.agents.main.model], defaultModel: state.agents.main.model, protocol: "responses" as const };
      state.agents = mergeAgentConfigs(state.agents, state.orchestration);
      if (mode === "existing") state.agents.main.gatewaySnapshot = { ...snapshot, apiKey: "original-locked-secret" };
      await storage.createProject(state);
      let retry = false;
      const validate = vi.fn(async (_state, proposal) => {
        if (mode === "unavailable" && !retry) throw new Error("Selected gateway unavailable");
        if (mode === "empty validation" && !retry) return;
        if (mode === "late snapshot" && !retry) {
          state.agents.main.gatewaySnapshot = { ...snapshot, apiKey: "late-original-locked-secret" }; await storage.saveState(state);
        }
        if (mode === "wrong route" && !retry) proposal.agents.main.gatewayId = "gwy_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
        proposal.agents.main.gatewaySnapshot = structuredClone(snapshot);
      });
      const native = { open: vi.fn(async () => { throw new Error("Snapshot recovery must retain the original Session"); }),
        decideRoute: vi.fn(async () => { throw new Error("Snapshot recovery must not create a Main turn"); }) };
      const coordinator = new CollaborationRuntimeCoordinator({ storage, serviceId: "gateway-recovery", hostId: "test",
        ...(mode === "no validator" ? {} : { validateWorkflowConfiguration: validate }), residentLauncher: native });
      if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
      await coordinator.initialize(); const database = coordinator.database();
      database.createProject({ projectId: state.id, workflowRevision: 1, workflowSnapshot: state.orchestration, git: state.git, workerCapacity: 2 });
      if (mode !== "legacy authority") database.initializeScopedConfiguration(state.id, { agents: state.agents, skillDefinitions: {}, mcpDefinitions: {} });
      const original = structuredClone({ usage: state.tokenUsage, compute: state.computeUsage, counts: state.runCounts, meta: state.agentSessionMeta });
      const formal = database.workflowConfiguration(state.id), before = database.eventsAfter(state.id, 0, 1000);
      const save = storage.saveState.bind(storage);
      const persistence = vi.spyOn(storage, "saveState").mockImplementation(async next => {
        if (mode === "persistence failure" && !retry && next.agents.main.gatewaySnapshot) throw new Error("Private snapshot persistence failed");
        await save(next);
      });
      const append = storage.appendEvent.bind(storage);
      const eventPersistence = vi.spyOn(storage, "appendEvent").mockImplementation(async (...args) => {
        if (mode === "persistence failure" && !retry) throw new Error("Private snapshot persistence failed");
        return append(...args);
      });
      const restore = () => coordinator.saveWorkflowRevision(state, { orchestration: structuredClone(state.orchestration), affectedGroupIds: [] });
      try {
        if (["unavailable", "no validator", "empty validation", "wrong route", "late snapshot", "persistence failure"].includes(mode)) {
          const reason = mode === "unavailable" ? /Selected gateway unavailable/ : mode === "no validator" ? /validator/ :
            mode === "late snapshot" ? /configuration changed during gateway recovery/ : mode === "persistence failure" ? /Private snapshot persistence failed/ : /网关.*快照/;
          await expect(restore()).rejects.toThrow(reason);
          if (mode === "persistence failure") state = await storage.loadState(state.id);
          expect(state.agents.main.gatewaySnapshot).toEqual(mode === "late snapshot" ? { ...snapshot, apiKey: "late-original-locked-secret" } : undefined);
          if (mode !== "no validator") { retry = true; await restore(); }
        } else await restore();
        const persisted = await storage.loadState(state.id);
        expect(persisted.agentSessions).toEqual({ main: session }); expect(persisted.agentSessionIds).toEqual({ main: session.nativeId });
        expect(persisted.mainInvocationSeq).toBe(42);
        expect({ usage: persisted.tokenUsage, compute: persisted.computeUsage, counts: persisted.runCounts, meta: persisted.agentSessionMeta }).toEqual(original);
        expect(database.workflowConfiguration(state.id)).toEqual(formal); expect(database.eventsAfter(state.id, 0, 1000)).toEqual(before);
        expect(database.projectState(state.id).tasks).toEqual([]); expect(database.projectState(state.id).executions).toEqual([]);
        if (mode !== "no validator") {
          const expected = mode === "existing" ? { ...snapshot, apiKey: "original-locked-secret" } :
            mode === "late snapshot" ? { ...snapshot, apiKey: "late-original-locked-secret" } : snapshot;
          expect(persisted.agents.main.gatewaySnapshot).toEqual(expected);
          const calls = validate.mock.calls.length; await restore(); expect(validate).toHaveBeenCalledTimes(calls);
        }
        expect(validate).toHaveBeenCalledTimes(mode === "existing" || mode === "no validator" ? 0 :
          ["recover", "legacy authority", "late snapshot"].includes(mode) ? 1 : 2);
        expect(native.open).not.toHaveBeenCalled(); expect(native.decideRoute).not.toHaveBeenCalled();
        expect(JSON.stringify(database.projectState(state.id))).not.toContain("server-secret"); expect(JSON.stringify(formal)).not.toContain("locked-secret");
      } finally { eventPersistence.mockRestore(); persistence.mockRestore(); await coordinator.shutdown(); }
    });

  it.each([false, true].flatMap(scoped => ["validation", "event mirror", "workflow files", "durable status", "state save"].map(boundary => ({ scoped, boundary }))))(
    "validates the actual latest configuration when authority advances during $boundary (scoped=$scoped)", async ({ scoped, boundary }) => {
      const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-projection-authority-")); temporaryRoots.push(root);
      const storage = new ProjectStorage(root, new EventHub()); await storage.initialize();
      const state = projectState("prj_13131313131313131313131313131313");
      state.git = { enabled: true, status: "ready" }; state.status = "running"; state.phase = "idle";
      if (scoped) state.orchestration = { ...state.orchestration, schemaVersion: 3,
        scopedWorkflow: { schemaVersion: 1, rootAgentIds: state.orchestration.agents.map(agent => agent.name), groups: [] } };
      const originalSession = { schemaVersion: 1 as const, harnessId: "codex", adapterVersion: "controlled", nativeId: "original-projection-session",
        generation: 4, durable: true, createdAt: new Date().toISOString() };
      state.agentSessions = { main: originalSession }; state.agentSessionIds = { main: originalSession.nativeId };
      state.agentSessionMeta = { main: { generation: 4, contextSeq: 17, resumeFailureCount: 2 } }; state.runCounts.main = 9;
      await storage.createProject(state);
      const configuration = credentialFreeAgentConfiguration({ agents: state.agents, skillDefinitions: {}, mcpDefinitions: {} });
      configuration.agents.main.model = "model-A"; configuration.agents.main.gatewayId = "gwy_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
      let advanced = false;
      const advance = () => {
        if (advanced) return; advanced = true;
        const next = structuredClone(configuration); next.agents.main.model = "model-B"; next.agents.main.gatewayId = "gwy_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
        const workflow = structuredClone(state.orchestration); workflow.decisionPlans.main = "Latest accepted workflow";
        database.saveWorkflowRevision({ projectId: state.id, workflowRevision: 2, snapshot: workflow, affectedGroupIds: [] });
        database.appendEvent({ projectId: state.id, requestId: "accepted-configuration-B", type: "scoped.configuration.applied", payload: { configuration: next } });
      };
      const validate = vi.fn(async (_state, proposal) => {
        const main = proposal.agents.main;
        main.gatewaySnapshot = { id: main.gatewayId!, name: main.gatewayId!, url: "https://controlled.invalid", apiKey: `private-${main.model}`,
          models: [main.model], defaultModel: main.model, protocol: "responses" };
        if (boundary === "validation") advance();
      });
      const native = { open: vi.fn(async () => { throw new Error("Configuration projection must not dispatch a model"); }),
        decideRoute: vi.fn(async () => { throw new Error("Configuration projection must not create a Main turn"); }) };
      const coordinator = new CollaborationRuntimeCoordinator({ storage, serviceId: "projection-authority", hostId: "test",
        validateWorkflowConfiguration: validate, residentLauncher: native });
      if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
      await coordinator.initialize(); const database = coordinator.database();
      database.createProject({ projectId: state.id, workflowRevision: 1, workflowSnapshot: state.orchestration, git: state.git, workerCapacity: 2 });
      database.initializeScopedConfiguration(state.id, configuration);
      const append = storage.appendEvent.bind(storage);
      vi.spyOn(storage, "appendEvent").mockImplementation(async (...args) => {
        await append(...args); if (boundary === "event mirror") advance();
      });
      const rename = fs.rename.bind(fs);
      const publication = vi.spyOn(fs, "rename").mockImplementation(async (...args) => {
        await rename(...args);
        if (boundary === "workflow files" && String(args[1]) === path.join(storage.projectDir(state.id), "workflow", "current-state.json")) advance();
      });
      const durable = coordinator.durableProjectStatus.bind(coordinator);
      vi.spyOn(coordinator, "durableProjectStatus").mockImplementation(async (...args) => {
        const result = await durable(...args); if (boundary === "durable status") advance(); return result;
      });
      const save = storage.saveState.bind(storage);
      vi.spyOn(storage, "saveState").mockImplementation(async (...args) => {
        await save(...args); if (boundary === "state save") advance();
      });
      try {
        await coordinator.saveWorkflowRevision(state, { orchestration: structuredClone(state.orchestration), affectedGroupIds: [] });
        expect(advanced).toBe(true);
        expect(validate.mock.calls.map(([, proposal]) => proposal.agents.main.model)).toEqual(["model-A", "model-B"]);
        const persisted = await storage.loadState(state.id);
        expect(persisted.workflowRevision).toBe(2);
        expect(persisted.orchestration).toEqual(database.projectState(state.id).workflowSnapshot);
        expect(persisted.agents.main).toEqual(expect.objectContaining({ model: "model-B", gatewayId: "gwy_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
          gatewaySnapshot: expect.objectContaining({ apiKey: "private-model-B" }) }));
        expect(persisted.agentSessions).toEqual({ main: originalSession }); expect(persisted.agentSessionIds).toEqual({ main: originalSession.nativeId });
        expect(persisted.agentSessionMeta).toEqual(state.agentSessionMeta); expect(persisted.runCounts.main).toBe(9);
        const published = JSON.parse(await fs.readFile(path.join(storage.projectDir(state.id), "workflow", "current-state.json"), "utf8"));
        expect(published.workflowRevision).toBe(2);
        const events = await storage.readEvents(state.id, 0, Number.MAX_SAFE_INTEGER);
        expect(new Set(events.map(event => event.eventId)).size).toBe(events.length);
        expect(native.open).not.toHaveBeenCalled(); expect(native.decideRoute).not.toHaveBeenCalled();
        expect(JSON.stringify(database.projectState(state.id))).not.toContain("private-model-");
      } finally { publication.mockRestore(); await coordinator.shutdown(); }
    });

  it.each(["A-B-A", "event only", "superseded rejection", "latest rejection", "late binding", "late binding after files", "late binding after status", "late retirement", "captured projection"])(
    "keeps configuration authority and original Session facts across %s", async mode => {
      const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-projection-proof-")); temporaryRoots.push(root);
      const storage = new ProjectStorage(root, new EventHub()); await storage.initialize();
      const state = projectState("prj_14141414141414141414141414141414");
      state.git = { enabled: true, status: "ready" }; state.status = "running"; state.phase = "idle";
      await storage.createProject(state);
      const originalWorkflow = structuredClone(state.orchestration);
      const configuration = credentialFreeAgentConfiguration({ agents: state.agents, skillDefinitions: {}, mcpDefinitions: {} });
      configuration.agents.main.instructions = "Accepted configuration A";
      if (mode === "late retirement") {
        originalWorkflow.agents = originalWorkflow.agents.filter(agent => agent.name !== "writing");
        delete configuration.agents.writing; delete originalWorkflow.routes.writing; delete originalWorkflow.decisionPlans.writing;
        for (const node of Object.keys(originalWorkflow.routes)) originalWorkflow.routes[node] = originalWorkflow.routes[node].filter(edge => edge.target !== "writing");
      }
      const save = storage.saveState.bind(storage);
      const bindLateSession = async () => {
        const agentId = mode === "late retirement" ? "writing" : "main";
        const session = { schemaVersion: 1 as const, harnessId: mode.startsWith("late binding") ? "claude" : "codex", adapterVersion: "controlled",
          nativeId: "late-original-session", generation: 8, durable: true, createdAt: new Date().toISOString() };
        state.agentSessions = { [agentId]: session }; state.agentSessionIds = { [agentId]: session.nativeId };
        state.agentSessionMeta = { [agentId]: { generation: 8, contextSeq: 34, resumeFailureCount: 2 } };
        await save(state);
      };
      let allowLatest = false;
      const validate = vi.fn(async (_state, proposal) => {
        if (validate.mock.calls.length === 1) {
          if (["A-B-A", "superseded rejection", "latest rejection"].includes(mode)) {
            const changed = structuredClone(originalWorkflow); changed.decisionPlans.main = "Accepted configuration B";
            const next = structuredClone(configuration); next.agents.main.instructions = "Accepted configuration B";
            database.saveWorkflowRevision({ projectId: state.id, workflowRevision: 2, snapshot: changed, affectedGroupIds: [] });
            database.appendEvent({ projectId: state.id, requestId: "configuration-B", type: "scoped.configuration.applied", payload: { configuration: next } });
            if (mode === "A-B-A") {
              database.saveWorkflowRevision({ projectId: state.id, workflowRevision: 3, snapshot: originalWorkflow, affectedGroupIds: [] });
              database.appendEvent({ projectId: state.id, requestId: "configuration-A-again", type: "scoped.configuration.applied", payload: { configuration } });
            }
          }
          if (mode === "event only") database.appendEvent({ projectId: state.id, type: "projection.test.observation", payload: { message: "An event independently advances stateRevision" } });
          if (mode === "late binding" || mode === "late retirement") {
            await bindLateSession();
          }
          if (mode === "superseded rejection") throw new Error("Superseded route unavailable");
        }
        if (mode === "latest rejection" && proposal.agents.main.instructions === "Accepted configuration B" && !allowLatest) throw new Error("Latest route unavailable");
      });
      const native = { open: vi.fn(async () => { throw new Error("Projection must not open a model"); }),
        decideRoute: vi.fn(async () => { throw new Error("Projection must not choose a new Main turn"); }) };
      const coordinator = new CollaborationRuntimeCoordinator({ storage, serviceId: "projection-proof", hostId: "test",
        validateWorkflowConfiguration: validate, residentLauncher: native });
      if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
      await coordinator.initialize(); const database = coordinator.database();
      database.createProject({ projectId: state.id, workflowRevision: 1, workflowSnapshot: originalWorkflow, git: state.git, workerCapacity: 2 });
      database.initializeScopedConfiguration(state.id, configuration);
      const rename = fs.rename.bind(fs);
      const publication = vi.spyOn(fs, "rename").mockImplementation(async (...args) => {
        await rename(...args);
        if (mode === "late binding after files" && String(args[1]) === path.join(storage.projectDir(state.id), "workflow", "current-state.json")) await bindLateSession();
      });
      const durable = coordinator.durableProjectStatus.bind(coordinator);
      vi.spyOn(coordinator, "durableProjectStatus").mockImplementation(async (...args) => {
        const result = await durable(...args); if (mode === "late binding after status") await bindLateSession(); return result;
      });
      const publish = () => coordinator.saveWorkflowRevision(state, { orchestration: structuredClone(database.projectState(state.id).workflowSnapshot) as typeof state.orchestration, affectedGroupIds: [] });
      try {
        if (mode === "captured projection") {
          const captured = database.projectState(state.id); captured.stateRevision += 1000; captured.workflowRevision = 999;
          captured.scopedConfiguration!.agents.main.instructions = "Unaccepted caller configuration";
          const boundary = coordinator as unknown as { publishProjection(state: ProjectState, projection: typeof captured): Promise<void> };
          await expect(boundary.publishProjection(state, { ...captured, id: "prj_other" })).rejects.toThrow("another project");
          expect(validate).not.toHaveBeenCalled();
          await boundary.publishProjection(state, captured);
        } else if (mode === "latest rejection") {
          await expect(publish()).rejects.toThrow("Latest route unavailable");
          expect(state.agents.main.instructions).not.toBe("Accepted configuration A");
          expect(state.agents.main.instructions).not.toBe("Accepted configuration B");
          expect(database.projectState(state.id).scopedConfiguration!.agents.main.instructions).toBe("Accepted configuration B");
          allowLatest = true; await publish();
        } else if (mode.startsWith("late binding")) {
          await expect(publish()).rejects.toThrow(/Harness|harness|Session/);
          if (mode === "late binding") expect(state.agents.main.instructions).not.toBe("Accepted configuration A");
        } else await publish();
        const persisted = await storage.loadState(state.id);
        if (mode.startsWith("late binding") || mode === "late retirement") {
          expect(persisted.agentSessions).toEqual(state.agentSessions); expect(persisted.agentSessionIds).toEqual(state.agentSessionIds);
          expect(persisted.agentSessionMeta).toEqual(state.agentSessionMeta);
          if (mode === "late retirement") expect(persisted.archivedAgentSessions).toEqual([expect.objectContaining({ agentId: "writing", workflowRevision: 1,
            sessions: { writing: { session: state.agentSessions!.writing, legacyId: "late-original-session" } } })]);
        }
        if (mode === "A-B-A") {
          expect(validate).toHaveBeenCalledTimes(2); expect(persisted.workflowRevision).toBe(3);
          expect(persisted.orchestration).toEqual(originalWorkflow); expect(persisted.agents.main.instructions).toBe("Accepted configuration A");
        }
        if (mode === "event only" || mode === "captured projection") {
          expect(validate).toHaveBeenCalledTimes(1); expect(persisted.workflowRevision).toBe(1);
          expect(persisted.agents.main.instructions).toBe("Accepted configuration A");
        }
        if (mode === "superseded rejection" || mode === "latest rejection") {
          expect(validate).toHaveBeenCalledTimes(mode === "latest rejection" ? 3 : 2);
          expect(persisted.workflowRevision).toBe(2); expect(persisted.agents.main.instructions).toBe("Accepted configuration B");
        }
        const events = await storage.readEvents(state.id, 0, Number.MAX_SAFE_INTEGER);
        expect(new Set(events.map(event => event.eventId)).size).toBe(events.length);
        expect(native.open).not.toHaveBeenCalled(); expect(native.decideRoute).not.toHaveBeenCalled();
      } finally { publication.mockRestore(); await coordinator.shutdown(); }
    });

  it.each([false, true].flatMap(scoped => [false, true].map(failure => ({ scoped, failure }))))(
    "archives original Agent Sessions through the actual user publication and recovery path (scoped=$scoped, failure=$failure)", async ({ scoped, failure }) => {
      const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-git-session-archive-")); temporaryRoots.push(root);
      const storage = new ProjectStorage(root, new EventHub()); await storage.initialize();
      const state = projectState("prj_12121212121212121212121212121212"); state.git = { enabled: true, status: "ready" };
      state.status = "running"; state.phase = "idle";
      if (scoped) state.orchestration = { ...state.orchestration, schemaVersion: 3,
        scopedWorkflow: { schemaVersion: 1, rootAgentIds: state.orchestration.agents.map(agent => agent.name), groups: [] } };
      const originalSession = { schemaVersion: 1 as const, harnessId: "codex", adapterVersion: "controlled", nativeId: "original-retired-native-session",
        generation: 4, durable: true, createdAt: new Date().toISOString() };
      const key = scoped ? "writing" : "writing::collaboration:delivery:original-scope";
      state.agentSessions = { [key]: originalSession }; state.agentSessionIds = { [key]: originalSession.nativeId };
      state.agentSessionMeta = { writing: { generation: 4, contextSeq: 21, resumeFailureCount: 2 } }; state.runCounts.writing = 9;
      await storage.createProject(state);
      const native = { open: vi.fn(async () => { throw new Error("Retirement must not wake a model"); }),
        decideRoute: vi.fn(async () => { throw new Error("Retirement must not create a Main turn"); }) };
      const coordinator = new CollaborationRuntimeCoordinator({ storage, serviceId: "session-archive", hostId: "test",
        validateWorkflowConfiguration: async () => undefined, residentLauncher: native });
      if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
      await coordinator.initialize(); const database = coordinator.database();
      database.createProject({ projectId: state.id, workflowRevision: 1, workflowSnapshot: state.orchestration, git: state.git, workerCapacity: 2 });
      const current = coordinator.getWorkflowAdjustments(state).current, proposal = structuredClone(current.snapshot);
      proposal.orchestration.agents = proposal.orchestration.agents.filter(agent => agent.name !== "writing");
      delete proposal.agents.writing; delete proposal.orchestration.routes.writing; delete proposal.orchestration.decisionPlans.writing;
      for (const node of Object.keys(proposal.orchestration.routes)) proposal.orchestration.routes[node] = proposal.orchestration.routes[node].filter(edge => edge.target !== "writing");
      if (proposal.orchestration.scopedWorkflow) proposal.orchestration.scopedWorkflow.rootAgentIds = proposal.orchestration.scopedWorkflow.rootAgentIds.filter(agent => agent !== "writing");
      let injected = false; const save = storage.saveState.bind(storage);
      const write = vi.spyOn(storage, "saveState").mockImplementation(async next => {
        if (failure && !injected && next.archivedAgentSessions?.length) { injected = true; throw new Error("Original archive file publication failed"); }
        return save(next);
      });
      try {
        const publish = coordinator.submitWorkflowAdjustment(state, { projectId: state.id, requestId: "retire-original-writing", base: current.version, proposal });
        if (failure) await expect(publish).rejects.toThrow("Original archive file publication failed");
        else expect((await publish).record.status).toBe("applied");
        expect(database.workflowAdjustment(state.id, "retire-original-writing")!.status).toBe("applied");
        write.mockRestore();
        const restored = await storage.loadState(state.id);
        await coordinator.saveWorkflowRevision(restored, { orchestration: proposal.orchestration, affectedGroupIds: [] });
        const persisted = await storage.loadState(state.id);
        expect(persisted.agents.writing).toBeUndefined(); expect(persisted.runCounts.writing).toBe(9);
        expect(persisted.agentSessions).toEqual({ [key]: originalSession }); expect(persisted.agentSessionIds).toEqual({ [key]: originalSession.nativeId });
        expect(persisted.archivedAgentSessions).toEqual([expect.objectContaining({ agentId: "writing", workflowRevision: 2,
          sessions: { [key]: { session: originalSession, legacyId: originalSession.nativeId } }, meta: { generation: 4, contextSeq: 21, resumeFailureCount: 2 } })]);
        const before = database.eventsAfter(state.id, 0, 1000);
        await coordinator.saveWorkflowRevision(persisted, { orchestration: proposal.orchestration, affectedGroupIds: [] });
        expect(persisted.archivedAgentSessions).toHaveLength(1); expect(database.eventsAfter(state.id, 0, 1000)).toEqual(before);
        const accepted = coordinator.getWorkflowAdjustments(persisted).current;
        const rejoin = structuredClone(current.snapshot);
        const replacement = structuredClone(rejoin); replacement.agents.writing.harness = "claude-code";
        await expect(coordinator.submitWorkflowAdjustment(persisted, { projectId: state.id, requestId: "reject-original-id-replacement", base: accepted.version, proposal: replacement }))
          .rejects.toThrow(/Session|session/);
        expect(database.workflowAdjustment(state.id, "reject-original-id-replacement")).toBeUndefined();
        expect((await coordinator.submitWorkflowAdjustment(persisted, { projectId: state.id, requestId: "explicitly-rejoin-original-writing", base: accepted.version, proposal: rejoin })).record.status).toBe("applied");
        expect(persisted.agents.writing.harness).toBe(current.snapshot.agents.writing.harness);
        expect(persisted.agentSessions).toEqual({ [key]: originalSession }); expect(persisted.archivedAgentSessions).toHaveLength(1);
        expect((await storage.loadState(state.id)).agentSessions).toEqual({ [key]: originalSession });
        expect(native.open).not.toHaveBeenCalled(); expect(native.decideRoute).not.toHaveBeenCalled();
      } finally { write.mockRestore(); await coordinator.shutdown(); }
    });

  it.each(["before_first", "between_tasks", "transaction_race", "transaction_apply"] as const)(
    "reevaluates the legacy FIFO at its actual claim boundary without faulting or replacing original work (%s)", async mode => {
      const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-legacy-user-admission-")); temporaryRoots.push(root);
      const storage = new ProjectStorage(root, new EventHub()); await storage.initialize();
      const state = projectState("prj_abababababababababababababababab");
      const graph = state.orchestration;
      graph.collaborations = [{ id: "original-team", displayName: "Original team", memberAgentIds: ["idea", "execution"], renamePolicy: "editable" }];
      graph.input = { source: "input", target: "original-team" };
      graph.routes = Object.fromEntries(graph.agents.filter(agent => !["idea", "execution"].includes(agent.name))
        .map(agent => [agent.name, [{ kind: "strong" as const, target: "original-team" }]]));
      graph.routes["original-team"] = [{ kind: "strong", target: "finish" }]; graph.decisionPlans = {}; graph.termination.agent = "original-team";
      state.orchestration = normalizeAgentOrchestrationTemplate(graph); await storage.createProject(state);
      const originalInstructions = state.agents.idea.instructions, nextInstructions = "Exact next-task instructions accepted from the user";
      let leaderTurns = 0, leaderOpens = 0, submitted = false;
      const deliveries: Array<{ taskId?: string; executionId?: string; instructions: string; branch?: string }> = [];
      const coordinator = new CollaborationRuntimeCoordinator({ storage, serviceId: "legacy-user-admission", hostId: "host-test",
        validateWorkflowConfiguration: async (_state, proposal) => {
          if (mode === "transaction_race" && submitted && proposal.agents.idea.instructions === nextInstructions)
            throw new Error("Controlled resource revalidation is still waiting");
        }, gitFactory: options => happyGitFake(options, []),
        residentLauncher: { async open(input) {
          const context = input.request.executionContext!; if (context.role === "leader") leaderOpens += 1;
          return { async pause() {}, async resume() {}, async close() {}, async submit(turn) {
            if (context.role !== "leader") {
              deliveries.push({ taskId: context.taskId, executionId: context.executionId,
                instructions: state.agents[input.request.agent].instructions, branch: context.executionBranch });
              if (mode === "between_tasks" && !submitted && input.request.agent === "idea") {
                submitted = true;
                const current = coordinator.getWorkflowAdjustments(state).current, proposal = structuredClone(current.snapshot);
                proposal.agents.idea.instructions = nextInstructions;
                const result = await coordinator.submitWorkflowAdjustment(state, { projectId: state.id, requestId: "original-user-edit", base: current.version, proposal });
                expect(result.record.status).toBe("pending"); expect(state.agents.idea.instructions).toBe(originalInstructions);
              }
              return agentFixtureDelivery(input, turn, { handoff: "Agent delivered its original assigned work" }, coordinator);
            }
            leaderTurns += 1;
            const action: ControlAction = leaderTurns === 1
              ? { tool: "assign_group_tasks", groupRunId: context.groupRunId!, coordinatorEpoch: context.coordinatorEpoch!,
                  tasks: [0, 1].map(index => ({ taskId: `original-task-${index}`, assignment: `Original FIFO assignment ${index}`, assigneeAgentId: "idea" })) }
              : leaderTurns === 2
                ? { tool: "request_group_integration", groupRunId: context.groupRunId!, coordinatorEpoch: context.coordinatorEpoch!, integrationOwnerAgentId: "execution" }
                : { tool: "complete_group", groupRunId: context.groupRunId!, coordinatorEpoch: context.coordinatorEpoch!, output: "Agent verified the original group result" };
            const authority = await input.controlAuthorityFactory!({ request: input.request, turn });
            const envelope: ControlActionEnvelope = { ...controlEnvelope(state.id, input.request.agent, turn.invocationId, action),
              stateVersion: authority.control.stateVersion, capabilityHash: authority.control.capabilityHash };
            const result = await agentFixtureLeaderResult(input, turn, { handoff: "Leader's original coordination decision", controlActions: [envelope] });
            if (mode === "before_first" && !submitted) {
              submitted = true;
              const current = coordinator.getWorkflowAdjustments(state).current, proposal = structuredClone(current.snapshot);
              proposal.agents.idea.instructions = nextInstructions;
              expect((await coordinator.submitWorkflowAdjustment(state, { projectId: state.id, requestId: "original-user-edit", base: current.version, proposal })).record.status).toBe("applied");
            }
            return result;
          } };
        } } });
      if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
      await coordinator.initialize();
      const database = coordinator.database(), claim = database.claimNextTask.bind(database);
      const race = vi.spyOn(database, "claimNextTask").mockImplementation(input => {
        if (["transaction_race", "transaction_apply"].includes(mode) && input.agentId === "idea" && !submitted) {
          submitted = true;
          const current = coordinator.getWorkflowAdjustments(state).current, proposal = structuredClone(current.snapshot);
          proposal.agents.idea.instructions = nextInstructions;
          database.submitUserWorkflowAdjustment({ projectId: state.id, requestId: "original-user-edit", base: current.version, proposal },
            credentialFreeAgentConfiguration({ agents: state.agents, skillDefinitions: state.skillDefinitions ?? {}, mcpDefinitions: state.mcpDefinitions ?? {} }));
        }
        return claim(input);
      });
      try {
        await coordinator.createProject(state, { enabled: true, provider: "github" });
        if (mode === "transaction_race") {
          await waitFor(() => state.phase === "collaboration:workflow-adjustment-waiting" || Boolean(state.lastError));
          expect(state.lastError).toBeUndefined(); expect(state.status).toBe("queued"); expect(deliveries).toEqual([]);
          const held = database.projectState(state.id), originalGroup = held.groupRuns[0]!;
          expect(held.executions).toEqual([]); expect(held.tasks.map(task => task.id)).toEqual(["original-task-0", "original-task-1"]);
          expect(leaderOpens).toBe(1); expect(originalGroup.coordinatorEpoch).toBe(1);
          await coordinator.withdrawWorkflowAdjustment(state, { projectId: state.id, requestId: "original-user-edit", operationId: "explicit-withdraw" });
        }
        await waitFor(() => state.status === "completed" || Boolean(state.lastError), 10_000);
        expect(state.lastError).toBeUndefined(); expect(state.status).toBe("completed");
        const final = database.projectState(state.id), records = coordinator.getWorkflowAdjustments(state).records;
        expect(final.groupRuns).toHaveLength(1); expect(final.groupRuns[0]?.coordinatorEpoch).toBe(1);
        expect(leaderOpens).toBe(1); expect(leaderTurns).toBe(3); expect(final.executions).toHaveLength(3);
        expect(final.executions.every(execution => execution.ownershipEpoch === 1 && execution.status === "succeeded")).toBe(true);
        expect(deliveries.slice(0, 2).map(delivery => delivery.taskId)).toEqual(["original-task-0", "original-task-1"]);
        expect(deliveries.slice(0, 2).map(delivery => delivery.instructions)).toEqual(["before_first", "transaction_apply"].includes(mode) ? [nextInstructions, nextInstructions]
          : mode === "between_tasks" ? [originalInstructions, nextInstructions] : [originalInstructions, originalInstructions]);
        expect(records).toMatchObject([{ requestId: "original-user-edit", status: mode === "transaction_race" ? "withdrawn" : "applied" }]);
        expect(final.pullRequests.every(pull => pull.status === "merged")).toBe(true);
        expect(database.eventsAfter(state.id, 0, 2000).filter(event => event.type === "group.activated")).toHaveLength(1);
      } finally { race.mockRestore(); await coordinator.shutdown(); }
    }, 15_000);

  it("replays the original pre-native legacy launch proof after an unrelated configuration version advances", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-legacy-launch-replay-")); temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub()); await storage.initialize();
    const state = projectState("prj_acacacacacacacacacacacacacacacac"); state.status = "running";
    state.git = { enabled: true, status: "ready" };
    state.orchestration.collaborations = [{ id: "G", displayName: "Original group", memberAgentIds: ["idea", "execution"], renamePolicy: "editable" }];
    state.orchestration.input = { source: "input", target: "G" };
    state.orchestration.routes = Object.fromEntries(state.orchestration.agents.filter(agent => !["idea", "execution"].includes(agent.name))
      .map(agent => [agent.name, [{ kind: "strong" as const, target: "G" }]]));
    state.orchestration.routes.G = [{ kind: "strong", target: "finish" }]; state.orchestration.decisionPlans = {}; state.orchestration.termination.agent = "G";
    state.orchestration = normalizeAgentOrchestrationTemplate(state.orchestration); await storage.createProject(state);
    const coordinator = new CollaborationRuntimeCoordinator({ storage, serviceId: "legacy-launch-replay", hostId: "test", validateWorkflowConfiguration: async () => undefined });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize(); const database = coordinator.database();
    database.createProject({ projectId: state.id, workflowRevision: 1, workflowSnapshot: state.orchestration, git: state.git, workerCapacity: 2 });
    const { groupRun } = database.activateGroup({ projectId: state.id, nodeRunId: "original-node", groupRunId: "original-group", nodeId: "G", groupId: "G",
      activationRequestId: "original-activation", inputSnapshotRef: "original-input", memberAgentIds: ["idea", "execution"], origin: { kind: "project-input" },
      baseCommit: "a".repeat(40), groupBranch: "groups/original-group", workflowRevision: 1 });
    const stop = new Error("Observed accepted launch before lane, Git inputs or native startup");
    const lane = vi.spyOn(database, "claimManagementLane").mockImplementation(() => { throw stop; });
    const internal = coordinator as unknown as { openGroupCoordinatorResident(...args: unknown[]): Promise<unknown> };
    try {
      await expect(internal.openGroupCoordinatorResident(state, groupRun, "Original assignment", new AbortController().signal)).rejects.toBe(stop);
      const original = database.latestGroupLeaderLaunch(state.id, groupRun.id, "main", 1)!;
      const current = coordinator.getWorkflowAdjustments(state).current, proposal = structuredClone(current.snapshot);
      proposal.agents.idea.instructions = "New unclaimed Worker instructions";
      expect((await coordinator.submitWorkflowAdjustment(state, { projectId: state.id, requestId: "unrelated-user-edit", base: current.version, proposal })).record.status).toBe("applied");
      expect(state.workflowRevision).toBe(2);
      await expect(internal.openGroupCoordinatorResident(state, groupRun, "Original assignment", new AbortController().signal)).rejects.toBe(stop);
      expect(database.latestGroupLeaderLaunch(state.id, groupRun.id, "main", 1)).toEqual(original);
      expect(database.eventsAfter(state.id, 0, 1000).filter(event => event.type === "group.leader.launch.started")).toHaveLength(1);
      expect(database.projectState(state.id).runtimeActivities).toEqual([]); expect(database.projectState(state.id).executions).toEqual([]);
    } finally { lane.mockRestore(); await coordinator.shutdown(); }
  });

  it.each([false, true].flatMap(scoped =>
    (["completed_turn", "missing_decision", "pause_failure", "opening", "failed_turn", "failed_turn_close_failure"] as const).map(mode => ({ mode, scoped }))))(
    "pauses Main's production resident at its actual boundary and preserves its Agent actions ($mode, scoped=$scoped)", async ({ mode, scoped }) => {
      const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-main-pause-native-"));
      temporaryRoots.push(root);
      const storage = new ProjectStorage(root, new EventHub()); await storage.initialize();
      const state = projectState("prj_92929292929292929292929292929292");
      state.orchestration = { ...state.orchestration,
        agents: [state.orchestration.agents.find((agent) => agent.name === "main")!],
        input: { source: "input", target: "main" }, routes: { main: [] },
        decisionPlans: { main: state.orchestration.decisionPlans.main! },
        termination: { ...state.orchestration.termination, agent: "main" } };
      if (scoped) state.orchestration = normalizeNewGitOrchestration(state.orchestration);
      state.agents = { main: { ...state.agents.main, sessionPersistence: true } };
      await storage.createProject(state);
      let releaseOpen!: () => void; const openGate = new Promise<void>(resolve => { releaseOpen = resolve; });
      let releaseTurn!: () => void; const turnGate = new Promise<void>(resolve => { releaseTurn = resolve; });
      let markStarted!: () => void; const started = new Promise<void>(resolve => { markStarted = resolve; });
      let opens = 0; let turns = 0; let closes = 0; let pauses = 0; let resumes = 0;
      let aborted = false; let rejectPause = mode === "pause_failure";
      const failedTurn = mode === "failed_turn" || mode === "failed_turn_close_failure";
      let rejectClose = mode === "failed_turn_close_failure";
      const memories: string[] = [];
      const invocationIds: string[] = [];
      let settledTool: { service: ControlActionService; capability: string } | undefined;
      const adapter = { async open(input: import("../../src/core/collaboration-runtime.js").CollaborationResidentOpenInput) {
        opens += 1;
        input.signal.addEventListener("abort", () => { aborted = true; });
        if (mode === "opening") { markStarted(); await openGate; }
        const lease = { session: { schemaVersion: 1 as const, harnessId: "codex" as const, adapterVersion: "test",
          nativeId: "same-paused-main-session", generation: 0, durable: true, createdAt: new Date().toISOString() },
          acknowledgedControlSeq: 0 };
        return { initialLease: lease, async submit(turn: { inputId: string; invocationId: string; prompt: string }) {
          turns += 1; invocationIds.push(turn.invocationId);
          const fresh = await input.turnRequestFactory!({ baseRequest: input.request, turn });
          if (turns === 1) {
            await fresh.request.onDurableSessionStarted?.(lease.session, lease.session.nativeId);
            markStarted(); await turnGate;
            if (failedTurn) throw new Error("Native turn failed and its process exited");
          } else {
            expect(fresh.request.resumeThreadId).toBe(lease.session.nativeId);
            expect(turn.prompt).toContain("finish_task for this original management task is already accepted");
          }
          const authority = await input.controlAuthorityFactory!({ request: fresh.request, turn });
          const service = new ControlActionService({ projectId: state.id, agent: "main", invocationId: turn.invocationId,
            stateVersion: authority.control.stateVersion, capability: authority.control.capability,
            capabilityHash: authority.control.capabilityHash, stagingPath: authority.control.stagingPath,
            revalidate: authority.revalidate });
          settledTool = { service, capability: authority.control.capability };
          const actions: ControlActionEnvelope[] = [];
          const call = async (action: ControlAction) => {
            actions.push(await service.stage(authority.control.capability, `pause-main-${turn.invocationId}-${actions.length}`, action));
          };
          // Pause waits for this already active Agent turn. Its own live MCP
          // calls must remain valid; the system must not fabricate its finish.
          if (turns === 1) await call({ tool: "finish_task", summary: "Main finished its original task",
            memory: "Agent-authored Main memory retained across Pause" });
          if (mode !== "missing_decision" || turns > 1) await call({ tool: "complete_project",
            rationale: "Main explicitly completes the user's no-artifact project" });
          return { handoff: "Main's original management result", controlActions: actions };
        }, async pause() {
          pauses += 1;
          if (failedTurn && !closes) throw new Error("Resident Harness lease cannot accept control while crashed");
          if (rejectPause) throw new Error("Main native pause not confirmed");
        },
        async resume() { resumes += 1; }, async probe() { return lease; }, async close() {
          if (rejectClose) throw new Error("Native close remains unconfirmed");
          closes += 1;
        } };
      } } as unknown as HarnessRuntimeResidentAdapter;
      const native = { reconcileResidentStartup: vi.fn(async () => ({ status: "none" })),
        residentRecoveryStrategy: () => "native-resume", cleanupResidentInterrupted: vi.fn(async () => undefined) } as unknown as HarnessRuntimeFacade;
      const coordinator = new CollaborationRuntimeCoordinator({ storage, serviceId: `main-pause-${mode}`, hostId: "host-test",
        gitFactory: options => ({ ...happyGitFake(options, [], true, false, memories),
          ...(scoped ? { async prepareAgentManagementWorkspace(agentId: string) {
            const directory = path.join(storage.projectDir(state.id), "git-worktrees", "agents", agentId);
            await fs.mkdir(directory, { recursive: true }); return directory;
          } } : {}) }),
        residentLauncher: createProductionCollaborationResidentLauncher(native, adapter) });
      if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
      await coordinator.initialize();
      try {
        await coordinator.createProject(state, { enabled: true, provider: "github" });
        await waitFor(() => opens > 0 || Boolean(state.lastError));
        expect(state.lastError).toBeUndefined(); await started;
        const pauseOutcome = coordinator.pauseProject(state).catch((error: unknown) => error);
        await vi.waitFor(async () => {
          const saved = await storage.loadState(state.id);
          expect(saved.status).toBe("pausing");
          expect(saved.pauseRequest?.requestedAt).toBeTruthy();
          expect(saved.pauseRequest?.settledAt).toBeUndefined();
        }, { timeout: 5_000, interval: 20 });
        expect(pauses).toBe(0); expect(aborted).toBe(false);
        releaseOpen(); releaseTurn();
        const outcome = await pauseOutcome;
        if (mode === "failed_turn_close_failure") {
          expect(outcome).toMatchObject({ message: "Native close remains unconfirmed" });
          expect((await storage.loadState(state.id)).pauseRequest?.settledAt).toBeUndefined();
          expect(state.status).toBe("pausing"); expect(closes).toBe(0);
          expect(opens).toBe(1); expect(turns).toBe(1); expect(aborted).toBe(false);
          return;
        }
        if (mode === "failed_turn") {
          expect(outcome).toBeUndefined();
          await waitFor(() => closes === 1);
          expect(state.status).toBe(hasUserWorkflowPause(state) ? "paused" : "retrying");
          expect(state.pauseRequest?.settledAt).toBeTruthy();
          expect((await storage.loadState(state.id)).pauseRequest).toEqual(state.pauseRequest);
          expect(aborted).toBe(false); expect(opens).toBe(1); expect(turns).toBe(1);
          expect(memories).toHaveLength(0);
          expect(coordinator.database().eventsAfter(state.id, 0, 2000)
            .filter(event => event.type === "main.route.response.committed")).toHaveLength(0);
          await vi.waitFor(() => expect(state.runtime?.activities).toEqual([]));
          return;
        }
        if (mode === "pause_failure") {
          expect(outcome).toMatchObject({ message: "Main native pause not confirmed" });
          expect((await storage.loadState(state.id)).pauseRequest?.settledAt).toBeUndefined();
          expect(state.status).toBe("pausing");
          rejectPause = false; await coordinator.pauseProject(state);
        } else expect(outcome).toBeUndefined();
        expect(state.status).toBe(hasUserWorkflowPause(state) ? "paused" : "retrying"); expect(state.pauseRequest?.settledAt).toBeTruthy();
        expect(turns).toBe(mode === "opening" ? 0 : 1);
        expect(memories).toHaveLength(mode === "opening" ? 0 : 1);
        expect(closes).toBe(0); expect(aborted).toBe(false);
        if (settledTool) await expect(settledTool.service.stage(settledTool.capability, "late-paused-main-finish",
          { tool: "finish_task", summary: "Main finished its original task",
            memory: "Agent-authored Main memory retained across Pause" })).rejects.toThrow("Main route authority was revoked");
        const beforeResume = coordinator.database().eventsAfter(state.id, 0, 2000);
        expect(beforeResume.filter(event => event.type === "main.route.response.committed")).toHaveLength(0);
        expect(beforeResume.filter(event => event.type === "main.route.mechanism_repair.requested")).toHaveLength(0);
        await coordinator.resumeProject(state);
        await waitFor(() => state.status === "completed" || Boolean(state.lastError), 10_000);
        expect(state.lastError).toBeUndefined(); expect(state.status).toBe("completed");
        expect(opens).toBe(1); expect(closes).toBe(1); expect(resumes).toBe(1);
        expect(pauses).toBe(mode === "pause_failure" ? 2 : 1); expect(aborted).toBe(false);
        expect(turns).toBe(mode === "missing_decision" ? 2 : 1);
        expect(new Set(invocationIds).size).toBe(turns);
        expect(memories).toEqual([expect.stringContaining("Agent-authored Main memory retained")]);
        const events = coordinator.database().eventsAfter(state.id, 0, 2000);
        expect(events.filter(event => event.type === "main.route.task_completion.committed")).toHaveLength(1);
        expect(events.filter(event => event.type === "main.route.response.committed")).toHaveLength(1);
      } finally { rejectClose = false; releaseOpen(); releaseTurn(); await coordinator.shutdown(); }
    }, 20_000);

  it.each(["before_launch", "preparation", "opening"] as const)(
    "keeps a legacy group coordinator inside the Pause boundary during %s", async mode => {
      const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-group-pause-opening-"));
      temporaryRoots.push(root);
      const storage = new ProjectStorage(root, new EventHub()); await storage.initialize();
      const state = projectState("prj_97979797979797979797979797979797");
      state.orchestration = { ...state.orchestration, schemaVersion: 2,
        collaborations: [{ id: "pause-team", displayName: "Pause team",
          memberAgentIds: ["idea", "execution"], renamePolicy: "editable" }],
        input: { source: "input", target: "pause-team" },
        decisionPlans: { main: state.orchestration.decisionPlans.main,
          "pause-team": "Coordinate the original group.", writing: state.orchestration.decisionPlans.writing,
          review: state.orchestration.decisionPlans.review },
        routes: { main: [{ target: "pause-team", kind: "weak" }, { target: "writing", kind: "weak" },
          { target: "review", kind: "weak" }], "pause-team": [{ target: "finish", kind: "strong" }],
          writing: [{ target: "main", kind: "strong" }],
          review: [{ target: "main", kind: "weak" }, { target: "finish", kind: "weak" }] } };
      await storage.createProject(state);
      let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; });
      let reached!: () => void; const boundary = new Promise<void>(resolve => { reached = resolve; });
      let opens = 0; let submits = 0; let pauses = 0; let resumes = 0; let settled = false;
      const originalInbox = storage.writeInbox.bind(storage);
      const inbox = vi.spyOn(storage, "writeInbox").mockImplementation(async (...args) => {
        if (mode === "preparation") { reached(); await gate; }
        return originalInbox(...args);
      });
      const coordinator = new CollaborationRuntimeCoordinator({ storage, serviceId: `group-pause-${mode}`, hostId: "host-test",
        gitFactory: options => {
          const git = happyGitFake(options, []);
          return { ...git, async beginGroup(...args) {
            if (mode === "before_launch") { reached(); await gate; }
            return git.beginGroup(...args);
          } };
        },
        residentLauncher: { async open(input) {
          expect(input.request.executionContext?.role).toBe("leader"); opens += 1;
          if (mode === "opening") { reached(); await gate; }
          const resident = blockingResident(input.signal);
          return { ...resident,
            async submit(turn) { submits += 1; return resident.submit(turn); },
            async pause() { pauses += 1; }, async resume() { resumes += 1; } };
        } } });
      if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
      await coordinator.initialize();
      let pauseOutcome: Promise<void> | undefined;
      try {
        await coordinator.createProject(state, { enabled: true, provider: "github" }); await boundary;
        pauseOutcome = coordinator.pauseProject(state).then(() => { settled = true; });
        await vi.waitFor(async () => expect((await storage.loadState(state.id)).pauseRequest?.requestedAt).toBeTruthy());
        if (mode === "before_launch") {
          await pauseOutcome; release();
          await new Promise(resolve => setTimeout(resolve, 150));
          expect(opens).toBe(0); expect(submits).toBe(0); expect(pauses).toBe(0);
        } else {
          await new Promise(resolve => setTimeout(resolve, 150));
          expect(settled).toBe(false); expect(pauses).toBe(0); expect(submits).toBe(0);
          release(); await pauseOutcome;
          expect(opens).toBe(1); expect(pauses).toBe(1); expect(submits).toBe(0);
        }
        const savedPause = structuredClone(state.pauseRequest);
        expect(savedPause?.settledAt).toBeTruthy(); expect(state.status).toBe(hasUserWorkflowPause(state) ? "paused" : "retrying");
        expect(coordinator.database().projectState(state.id).tasks).toHaveLength(0);
        await coordinator.resumeProject(state);
        await vi.waitFor(() => expect(submits).toBe(1));
        expect(opens).toBe(1); expect(resumes).toBe(mode === "before_launch" ? 0 : 1);
        expect(state.pauseRequest).toBeUndefined();
        expect(coordinator.database().eventsAfter(state.id, 0, 1000)
          .filter(event => event.type === "group.leader.launch.started")).toHaveLength(1);
      } finally {
        release(); await pauseOutcome?.catch(() => undefined); inbox.mockRestore(); await coordinator.shutdown();
      }
    }, 15_000);

  it.each((["before_launch", "opening"] as const).flatMap(mode => [false, true].map(formal => ({ mode, formal }))))(
    "keeps a scoped Leader management launch inside the Pause boundary during $mode (unified=$formal)", async ({ mode, formal }) => {
      const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-scoped-pause-opening-"));
      temporaryRoots.push(root);
      const storage = new ProjectStorage(root, new EventHub()); await storage.initialize();
      const state = projectState("prj_98989898989898989898989898989898");
      if (formal) state.formalStateProtocol = "project-state-v1";
      state.orchestration = { ...state.orchestration, schemaVersion: 3,
        input: { source: "input", target: "G" },
        collaborations: [{ id: "G", displayName: "G", memberAgentIds: [], renamePolicy: "editable" }],
        routes: { ...Object.fromEntries(state.orchestration.agents.map(agent => [agent.name, [{ kind: "strong" as const, target: "G" }]])),
          G: [{ kind: "strong", target: "finish" }] },
        termination: { ...state.orchestration.termination, agent: "G", decisionBy: "main" },
        scopedWorkflow: { schemaVersion: 1, rootAgentIds: state.orchestration.agents.map(agent => agent.name), groups: [{
          id: "G", leaderAgentId: "main", decisionBy: "main", allowLeaderReconfiguration: false,
          workflow: { nodes: [{ kind: "agent", nodeId: "G_idea", agentId: "idea" }],
            input: { source: "input", edges: [{ kind: "parallel", target: "G_idea" }] },
            routes: { G_idea: [{ kind: "strong", target: "finish" }] } }
        }] } };
      state.status = "queued"; state.phase = "queued";
      await storage.createProject(state);
      let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; });
      let reached!: () => void; const boundary = new Promise<void>(resolve => { reached = resolve; });
      let opens = 0; let submits = 0; let pauses = 0; let resumes = 0; let settled = false;
      const originalInbox = storage.writeInbox.bind(storage);
      const inbox = vi.spyOn(storage, "writeInbox").mockImplementation(async (...args) => {
        if (mode === "before_launch") { reached(); await gate; }
        return originalInbox(...args);
      });
      const coordinator = new CollaborationRuntimeCoordinator({ storage, serviceId: `scoped-pause-${mode}`, hostId: "host-test",
        gitFactory: options => {
          const base = happyGitFake(options, []);
          return { ...base,
            async observeRemoteRef(requestRepository: GitHubRepositoryFact, ref: string) {
              return { owner: requestRepository.owner, repository: requestRepository.name, ref,
                status: ref.startsWith("groups/") ? "missing" as const : "present" as const,
                ...(ref.startsWith("groups/") ? {} : { sha: "a".repeat(40) }), observedAt: new Date().toISOString() };
            },
            async createGroupFinalPullRequest() { throw new Error("Final group integration is outside this Pause boundary test"); },
            async mergeGroupFinalPullRequest() { throw new Error("Final group integration is outside this Pause boundary test"); },
            async reconcileGroupFinalPullRequest() { throw new Error("Final group integration is outside this Pause boundary test"); },
            async checkpointGroupCompletion() { throw new Error("Group completion is outside this Pause boundary test"); },
            async prepareAgentManagementWorkspace(agentId: string) {
              const directory = path.join(storage.projectDir(state.id), "git-worktrees", "agents", agentId);
              await fs.mkdir(directory, { recursive: true }); return directory;
            } };
        },
        residentLauncher: { async open(input) {
          expect(input.request.executionContext?.role).toBe("leader"); opens += 1;
          if (mode === "opening") { reached(); await gate; }
          const resident = blockingResident(input.signal);
          return { ...resident, async submit(turn) { submits += 1; return resident.submit(turn); },
            async pause() { pauses += 1; }, async resume() { resumes += 1; } };
        } } });
      if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
      await coordinator.initialize();
      let pauseOutcome: Promise<void> | undefined;
      try {
        const creation = coordinator.createProject(state, { enabled: true, provider: "github" });
        if (mode === "before_launch") {
          await Promise.race([boundary, new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`scoped pre-create boundary timeout phase=${state.phase} status=${state.status} error=${state.lastError ?? ""} opens=${opens}`)), 5_000))]);
        } else {
          await creation; await boundary;
        }
        pauseOutcome = coordinator.pauseProject(state).then(() => { settled = true; });
        await vi.waitFor(async () => expect((await storage.readStateSnapshot(state.id) as ProjectState).pauseRequest?.requestedAt).toBeTruthy());
        if (mode === "before_launch") {
          await Promise.race([pauseOutcome, new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`scoped pause timeout phase=${state.phase} status=${state.status} error=${state.lastError ?? ""} opens=${opens}`)), 5_000))]);
          release(); await creation;
          await new Promise(resolve => setTimeout(resolve, 150));
          expect(opens).toBe(0); expect(submits).toBe(0); expect(pauses).toBe(0);
        } else {
          await new Promise(resolve => setTimeout(resolve, 150));
          expect(settled).toBe(false); expect(pauses).toBe(0); expect(submits).toBe(0);
          release(); await pauseOutcome;
          expect(opens).toBe(1); expect(pauses).toBe(1); expect(submits).toBe(0);
        }
        expect(state.status).toBe(hasUserWorkflowPause(state) ? "paused" : "retrying"); expect(state.pauseRequest?.settledAt).toBeTruthy();
        const launchesWhilePaused = opens;
        await coordinator.resumeProject(state);
        await vi.waitFor(() => expect(submits).toBe(1));
        expect(opens).toBe(launchesWhilePaused + (mode === "before_launch" ? 1 : 0));
        expect(resumes).toBe(mode === "before_launch" ? 0 : 1);
        expect(state.pauseRequest).toBeUndefined();
        expect(Boolean(coordinator.database().projectStateDomain(state.id))).toBe(formal);
      } finally {
        release(); await pauseOutcome?.catch(() => undefined); inbox.mockRestore(); await coordinator.shutdown();
      }
    }, 15_000);

  it.each(["authority", "live_tools", "metrics"] as const)(
    "lets the exact active standalone Worker finish its tools during pending Pause (%s)", async boundary => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-worker-pause-tools-")); temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub()); await storage.initialize();
    const state = projectState("prj_94949494949494949494949494949494");
    state.orchestration = { ...state.orchestration, input: { source: "input", target: "idea" },
      routes: { ...state.orchestration.routes, idea: [{ target: "finish", kind: "strong" }] } };
    await storage.createProject(state);
    let ready!: () => void; const started = new Promise<void>(resolve => { ready = resolve; });
    let release!: () => void; const gate = new Promise<void>(resolve => { release = resolve; });
    let toolError: unknown; let calls = 0; let pauses = 0;
    let metricsChecked = false; let lateMetricsToolError: unknown;
    let savedControl: { service: ControlActionService; capability: string;
      execute: (envelope: ControlActionEnvelope) => Promise<unknown> } | undefined;
    const session = { schemaVersion: 1 as const, harnessId: "codex" as const, adapterVersion: "test",
      nativeId: "original-worker-pause-session", generation: 0, durable: true, createdAt: new Date().toISOString() };
    const adapter = { async open(input: import("../../src/core/collaboration-runtime.js").CollaborationResidentOpenInput) {
      const lease = { session, acknowledgedControlSeq: 0 };
      return { initialLease: lease, async submit(turn: { inputId: string; invocationId: string; prompt: string }) {
        const fresh = await input.turnRequestFactory!({ baseRequest: input.request, turn });
        await fresh.request.onDurableSessionStarted?.(session, session.nativeId);
        const prepare = async () => {
          const authority = await input.controlAuthorityFactory!({ request: fresh.request, turn });
          const service = new ControlActionService({ projectId: state.id, agent: "idea", invocationId: turn.invocationId,
            stateVersion: authority.control.stateVersion, capability: authority.control.capability,
            capabilityHash: authority.control.capabilityHash, stagingPath: authority.control.stagingPath,
            revalidate: authority.revalidate });
          return { service, capability: authority.control.capability,
            execute: (envelope: ControlActionEnvelope) => authority.execute!(envelope) };
        };
        if (boundary === "live_tools") savedControl = await prepare();
        ready(); await gate;
        try {
          savedControl ??= await prepare();
          const { service, capability } = savedControl;
          const actions = [await service.stage(capability, "active-worker-pause-push", {
            tool: "git_push", reason: "Original active Worker preserves its own committed files" })];
          expect(await savedControl.execute(actions[0]!)).toMatchObject({
            checkpoint: { commitSha: "b".repeat(40) }, remote: { status: "present", sha: "b".repeat(40) } });
          calls += 1;
          actions.push(await service.stage(capability, "active-worker-pause-finish", {
            tool: "finish_task", summary: "Original Worker finished its own task",
            memory: "Original Worker memory retained at the pending safe point" }));
          calls += 1;
          return { handoff: "Original Worker result retained across Pause", controlActions: actions };
        } catch (error) { toolError = error; throw error; }
      }, async pause() { pauses += 1; }, async resume() {}, async probe() { return lease; }, async close() {} };
    } } as unknown as HarnessRuntimeResidentAdapter;
    const native = { reconcileResidentStartup: vi.fn(async () => ({ status: "none" })),
      residentRecoveryStrategy: () => "native-resume", cleanupResidentInterrupted: vi.fn(async () => undefined) } as unknown as HarnessRuntimeFacade;
    const dispatcher = new ProductionCollaborationInvocationDispatcher(storage);
    if (boundary === "metrics") {
      const finish = dispatcher.finish.bind(dispatcher);
      vi.spyOn(dispatcher, "finish").mockImplementation(async (...args) => {
        try {
          await savedControl!.service.stage(savedControl!.capability, "late-worker-during-metrics", {
            tool: "git_push", reason: "A returned native turn must lose authority before metrics are persisted" });
        } catch (error) { lateMetricsToolError = error; }
        metricsChecked = true;
        await finish(...args);
      });
    }
    const coordinator = new CollaborationRuntimeCoordinator({ storage, serviceId: `worker-pause-${boundary}`, hostId: "host-test",
      invocationDispatcher: dispatcher,
      gitFactory: options => happyGitFake(options, []),
      residentLauncher: createProductionCollaborationResidentLauncher(native, adapter) });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    let pauseOutcome: Promise<unknown> | undefined;
    try {
      await coordinator.createProject(state, { enabled: true, provider: "github" }); await started;
      const originalSessions = structuredClone(state.agentSessions);
      pauseOutcome = coordinator.pauseProject(state).catch(error => error);
      await vi.waitFor(async () => expect((await storage.loadState(state.id)).status).toBe("pausing"));
      expect(pauses).toBe(0); release();
      const outcome = await pauseOutcome;
      expect(toolError).toBeUndefined(); expect(outcome).toBeUndefined(); expect(calls).toBe(2);
      if (boundary === "metrics") {
        expect(metricsChecked).toBe(true);
        expect(lateMetricsToolError).toBeInstanceOf(Error);
        expect((lateMetricsToolError as Error).message).toContain("Standalone control authority was revoked");
      }
      expect(state.status).toBe(hasUserWorkflowPause(state) ? "paused" : "retrying"); expect(state.pauseRequest?.settledAt).toBeTruthy(); expect(pauses).toBe(1);
      expect(state.agentSessions).toEqual(originalSessions);
      expect(coordinator.database().projectState(state.id).nodeRuns.some(node => node.status === "completed")).toBe(false);
      await expect(savedControl!.service.stage(savedControl!.capability, "late-worker-pause-push", {
        tool: "git_push", reason: "Stale capability after the original native turn returned" })).rejects.toThrow("Standalone control authority was revoked");
    } finally { release(); await pauseOutcome; await coordinator.shutdown(); }
  }, 15_000);

  it.each([false, true].flatMap(scoped => (["cancel", "cancel_during_pause", "shutdown"] as const).map(mode => ({ mode, scoped }))))(
    "closes Main's registered production native handle on $mode (scoped=$scoped)", async ({ mode, scoped }) => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-main-stop-native-")); temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub()); await storage.initialize();
    const state = projectState("prj_93939393939393939393939393939393");
    state.orchestration = { ...state.orchestration,
      agents: [state.orchestration.agents.find(agent => agent.name === "main")!],
      input: { source: "input", target: "main" }, routes: { main: [] },
      decisionPlans: { main: state.orchestration.decisionPlans.main! },
      termination: { ...state.orchestration.termination, agent: "main" } };
    if (scoped) state.orchestration = normalizeNewGitOrchestration(state.orchestration);
    state.agents = { main: state.agents.main }; await storage.createProject(state);
    let nativeStarted = false;
    let markStarted!: () => void; const started = new Promise<void>(resolve => {
      markStarted = () => { nativeStarted = true; resolve(); };
    });
    let releaseNative!: () => void; const nativeClosed = new Promise<void>(resolve => { releaseNative = resolve; });
    let physicalCloses = 0; let stopped = false;
    const adapter = { async open(input: import("../../src/core/collaboration-runtime.js").CollaborationResidentOpenInput) {
      const lease = { session: { schemaVersion: 1 as const, harnessId: "codex" as const, adapterVersion: "test",
        nativeId: "original-main-stop-session", generation: 0, durable: true, createdAt: new Date().toISOString() },
        acknowledgedControlSeq: 0 };
      return { initialLease: lease, async submit(turn: { inputId: string; invocationId: string; prompt: string }) {
        const fresh = await input.turnRequestFactory!({ baseRequest: input.request, turn });
        await fresh.request.onDurableSessionStarted?.(lease.session, lease.session.nativeId);
        markStarted(); await nativeClosed;
        throw new Error("Original native Main stopped without a fabricated result");
      }, async pause() {}, async resume() {}, async probe() { return lease; }, async close() {
        if (stopped) return;
        if (mode === "cancel_during_pause") {
          const stopping = await storage.loadState(state.id);
          expect(stopping.status).toBe("cancelling");
          expect(stopping.pauseRequest).toBeUndefined();
        }
        stopped = true; physicalCloses += 1; releaseNative();
      } };
    } } as unknown as HarnessRuntimeResidentAdapter;
    const native = { reconcileResidentStartup: vi.fn(async () => ({ status: "none" })),
      residentRecoveryStrategy: () => "native-resume", cleanupResidentInterrupted: vi.fn(async () => undefined) } as unknown as HarnessRuntimeFacade;
    const memories: string[] = [];
    const coordinator = new CollaborationRuntimeCoordinator({ storage, serviceId: `main-stop-${mode}`, hostId: "host-test",
      gitFactory: options => ({ ...happyGitFake(options, [], true, false, memories),
        ...(scoped ? { async prepareAgentManagementWorkspace(agentId: string) {
          const directory = path.join(storage.projectDir(state.id), "git-worktrees", "agents", agentId);
          await fs.mkdir(directory, { recursive: true }); return directory;
        } } : {}) }),
      residentLauncher: createProductionCollaborationResidentLauncher(native, adapter) });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    try {
      await coordinator.createProject(state, { enabled: true, provider: "github" });
      await waitFor(() => nativeStarted || Boolean(state.lastError));
      expect(state.lastError).toBeUndefined(); await started;
      const originalSessions = structuredClone(state.agentSessions);
      const originalSessionIds = structuredClone(state.agentSessionIds);
      expect(Object.values(originalSessionIds ?? {})).toContain("original-main-stop-session");
      if (mode === "cancel_during_pause") {
        const pause = coordinator.pauseProject(state).catch(error => error);
        await waitFor(() => state.status === "pausing");
        const stop = coordinator.cancelProject(state, { actor: "user", reason: "user_cancelled" });
        const stoppedWithoutAgentReturn = await Promise.race([
          nativeClosed.then(() => physicalCloses === 1), new Promise<false>(resolve => setTimeout(() => resolve(false), 2_000))
        ]);
        // Bound a broken lifecycle queue so this regression never leaves a
        // native fixture or Pause promise hanging after the assertion fails.
        if (!stoppedWithoutAgentReturn) releaseNative();
        await stop;
        expect(await pause).toMatchObject({ message: "Pause superseded by pending Stop; native stop still requires confirmation" });
        expect(stoppedWithoutAgentReturn).toBe(true);
      } else if (mode === "cancel") await coordinator.cancelProject(state, { actor: "user", reason: "user_cancelled" });
      else await coordinator.shutdown();
      expect(physicalCloses).toBe(1); expect(memories).toHaveLength(0);
      const saved = await storage.loadState(state.id);
      expect(saved.status).not.toBe("completed");
      expect(saved.agentSessionIds).toEqual(originalSessionIds);
      expect(saved.agentSessions).toEqual(originalSessions);
      expect(Object.keys(saved.taskCompletions ?? {})).toHaveLength(0);
      if (mode !== "shutdown") expect(saved.status).toBe(hasUserWorkflowPause(saved) ? "paused" : "retrying");
    } finally { releaseNative(); await coordinator.shutdown(); }
  }, 15_000);

  it.each(["missing_finish", "memory_failure", "missing_decision", "rejected_finish", "native_failure", "project_completion", "authoring_supplement", "historical_failure", "authoring_native_failure"] as const)(
    "keeps Main's actual production handle and original task while Agent repairs %s", async (mode) => {
      const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-main-finish-native-"));
      temporaryRoots.push(root);
      const storage = new ProjectStorage(root, new EventHub()); await storage.initialize();
      const state = projectState("prj_39393939393939393939393939393939");
      state.orchestration = { ...state.orchestration, agents: [state.orchestration.agents.find((item) => item.name === "main")!],
        input: { source: "input", target: "main" }, routes: { main: [] },
        termination: { ...state.orchestration.termination, agent: "main" } };
      const authoring = mode === "authoring_supplement" || mode === "authoring_native_failure";
      const nativeFailure = mode === "native_failure" || mode === "authoring_native_failure";
      if (authoring) state.orchestration = { ...state.orchestration,
        schemaVersion: 3, allowMainReconfiguration: true,
        scopedWorkflow: { schemaVersion: 1, rootAgentIds: ["main"], groups: [] } };
      state.agents = { main: { ...state.agents.main, sessionPersistence: false } };
      await storage.createProject(state);
      let turns = 0; let opens = 0; let closes = 0; let finishToolActive = false; let memoryAttempts = 0;
      let firstInputId = ""; let failedToolReturned = false;
      let originalProposalPath = "";
      let originalInboxPath = "";
      const memories: string[] = [];
      let oldAuthority: Awaited<ReturnType<NonNullable<import("../../src/core/collaboration-runtime.js").CollaborationResidentOpenInput["controlAuthorityFactory"]>>>;
      let oldEnvelope: ControlActionEnvelope;
      let coordinator!: CollaborationRuntimeCoordinator;
      const adapter = { async open(input: import("../../src/core/collaboration-runtime.js").CollaborationResidentOpenInput) {
        if (authoring) {
          // Exercise the same staged-input validator as the actual Harness.
          // A fake native handle must not hide a cross-epoch staging refusal.
          await validateStagedInvocationInputs({ ...input.inputs!, projectId: state.id,
            invocationId: input.request.invocationId, fixedAgentId: input.request.agent });
        }
        opens += 1;
        const submittedInputIds = new Set<string>();
        const lease = { session: { schemaVersion: 1 as const, harnessId: "codex" as const, adapterVersion: "test",
          nativeId: "retained-main-management-session", generation: 0, durable: true, createdAt: new Date().toISOString() },
          acknowledgedControlSeq: 0 };
        return { initialLease: lease, async submit(turn: { inputId: string; invocationId: string; prompt: string }) {
          expect(submittedInputIds.has(turn.inputId)).toBe(false); submittedInputIds.add(turn.inputId);
          turns += 1; firstInputId ||= turn.inputId;
          if (turns > 1 && !nativeFailure) expect(turn.inputId).toMatch(new RegExp(`^${firstInputId}-mechanism-repair-`));
          const fresh = await input.turnRequestFactory({ baseRequest: input.request, turn });
          const modelStart = Date.now() - 200;
          for (const [phase, offset, text] of [["started", 0, undefined], ["delta", 100, "abcdefgh"], ["completed", 200, undefined]] as const) {
            await fresh.request.onModelStreamEvent?.({ phase, requestId: `metrics-${turn.invocationId}-${turns}`,
              timestamp: new Date(modelStart + offset).toISOString(), streaming: true, deliveryMode: "native-stream", text });
          }
          if (turns === 1) await fresh.request.onDurableSessionStarted?.(lease.session, lease.session.nativeId);
          else expect(fresh.request.resumeThreadId).toBe(lease.session.nativeId);
          const authority = await input.controlAuthorityFactory!({ request: fresh.request, turn });
          if (authoring) {
            // Real adapters pin this discovery path for the native handle.
            // A missing-tool turn gets a fresh invocation/capability but must
            // still let this Agent edit its original logical task proposal.
            expect(input.inputs?.workflowAuthoringPath).toBeTruthy();
            expect(authority.control.workflowAuthoringPath).toBe(input.inputs!.workflowAuthoringPath);
            if (turns === 1) {
              originalProposalPath = input.inputs!.workflowAuthoringPath!;
              originalInboxPath = input.inputs!.inboxPath;
              const proposal = JSON.parse(await fs.readFile(originalProposalPath, "utf8"));
              proposal.agents.main.instructions += "\nUnfinished Agent-authored proposal edit.";
              await fs.writeFile(originalProposalPath, JSON.stringify(proposal));
            } else {
              expect(input.inputs!.workflowAuthoringPath).toBe(originalProposalPath);
              if (nativeFailure) expect(input.inputs!.inboxPath).not.toBe(originalInboxPath);
              expect(JSON.parse(await fs.readFile(originalProposalPath, "utf8")).agents.main.instructions)
                .toContain("Unfinished Agent-authored proposal edit.");
            }
            const note = path.join(path.dirname(input.inputs!.workflowAuthoringPath!), "agent-authoring-note.txt");
            if (turns === 1) await fs.writeFile(note, "Main's unfinished original proposal\n");
            else expect(await fs.readFile(note, "utf8")).toBe("Main's unfinished original proposal\n");
          }
          const service = new ControlActionService({ projectId: state.id, agent: "main", invocationId: turn.invocationId,
            stateVersion: authority.control.stateVersion, capability: authority.control.capability,
            capabilityHash: authority.control.capabilityHash, stagingPath: authority.control.stagingPath,
            revalidate: authority.revalidate });
          const actions: ControlActionEnvelope[] = [];
          const call = async (action: ControlAction) => {
            const envelope = await service.stage(authority.control.capability, `main-test-${turn.invocationId}-${actions.length}`, action);
            actions.push(envelope); return envelope;
          };
          const finish: ControlAction = { tool: "finish_task", summary: "Main finished its own management task",
            memory: "Main-authored memory: keep this original task and the chosen request." };
          const finishTask = async () => { finishToolActive = true; try { await call(finish); } finally { finishToolActive = false; } };
          const request: ControlAction = { tool: "request_user", message: "Agent asks the original user requirement",
            rationale: "Main chose to request an explicit user decision" };
          if (turns === 1) {
            oldAuthority = authority;
            if (mode === "historical_failure") {
              // The Agent repeats a previous error without invoking any
              // control tool. Only its next actual calls can supply facts.
              return { handoff: "apply_workflow rejected the proposal with an authoring authority error (remembered from a prior turn)" };
            }
            if (mode === "project_completion") {
              const complete: ControlAction = { tool: "complete_project", rationale: "Main explicitly decides the authorized no-artifact project is complete" };
              await expect(call(complete)).rejects.toThrow("finish_task for its own management task before complete_project");
              await finishTask(); await finishTask();
              await call(complete);
              return { handoff: "Main completed itself and then completed the project", controlActions: actions };
            }
            if (mode === "missing_decision" || mode === "authoring_supplement") await finishTask();
            else {
              if (mode === "memory_failure") {
                await expect(finishTask()).rejects.toThrow("Main Agent memory write failed inside finish_task");
                failedToolReturned = true;
              }
              oldEnvelope = await call(request);
              if (mode === "rejected_finish") {
                await expect(service.stage(authority.control.capability, oldEnvelope.callId, finish))
                  .rejects.toThrow("callId was already used for a different action");
                expect(memoryAttempts).toBe(0); expect(Object.keys(state.taskCompletions ?? {})).toHaveLength(0);
              }
              if (nativeFailure) throw new Error("Native Main response failed after its explicit choice");
            }
            return { handoff: "This Agent still has a missing mechanism action", controlActions: actions };
          }
          expect(turns).toBe(2);
          expect(state.userIntervention).toBeUndefined();
          if (mode === "missing_decision" || mode === "authoring_supplement" || mode === "historical_failure") {
            expect(turn.prompt).toContain("formal Main orchestration action");
            const tools = JSON.parse(turn.prompt.match(/Current authorized formal decision tools: (\[[^\n]*?\])/u)![1]!) as string[];
            expect(tools).toContain("request_user");
            expect(tools.includes("apply_workflow")).toBe(mode === "authoring_supplement");
            expect(turn.prompt).toContain("not current tool receipts");
            if (mode === "historical_failure") {
              expect(Object.keys(state.taskCompletions ?? {})).toHaveLength(0);
              expect(turn.prompt).toContain("Call finish_task");
              await finishTask();
            } else {
              expect(turn.prompt).toContain("finish_task for this original management task is already accepted");
            }
            await call(request);
          } else {
            expect(turn.prompt).toContain("finish_task");
            expect(memories).toHaveLength(0);
            if (mode === "memory_failure") expect(failedToolReturned).toBe(true);
            if (nativeFailure) {
              await expect(oldAuthority.revalidate({ ...oldEnvelope, callId: "stale-native-finish", action: finish }, []))
                .rejects.toThrow("stale route epoch");
            }
            await expect(call({ ...request, message: "Replace the already accepted request" }))
              .rejects.toThrow("accepted formal action cannot be replaced");
            await finishTask(); await finishTask();
          }
          return { handoff: "The same Main Agent completed its own task", controlActions: actions };
        }, async pause() {}, async resume() {}, async probe() { return lease; }, async close() { closes += 1; } };
      } } as unknown as HarnessRuntimeResidentAdapter;
      const native = { reconcileResidentStartup: vi.fn(async () => ({ status: "none" })),
        residentRecoveryStrategy: () => "native-resume", cleanupResidentInterrupted: vi.fn(async () => undefined) } as unknown as HarnessRuntimeFacade;
      coordinator = new CollaborationRuntimeCoordinator({ storage, serviceId: `main-finish-${mode}`, hostId: "host-test",
        invocationDispatcher: new ProductionCollaborationInvocationDispatcher(storage),
        gitFactory: (options) => {
          const git = happyGitFake(options, [], true, false, memories);
          return { ...git,
            ...(authoring ? { async prepareAgentManagementWorkspace(agentId: string) {
              const directory = path.join(storage.projectDir(state.id), "git-worktrees", "agents", agentId);
              await fs.mkdir(directory, { recursive: true });
              return directory;
            } } : {}),
            async commitManagementMemory(...args) {
            expect(finishToolActive).toBe(true); memoryAttempts += 1;
            if (mode === "memory_failure" && memoryAttempts === 1) throw new Error("Main Agent memory write failed inside finish_task");
            return git.commitManagementMemory!(...args);
          } };
        }, residentLauncher: createProductionCollaborationResidentLauncher(native, adapter) });
      if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
      await coordinator.initialize();
      try {
        await coordinator.createProject(state, { enabled: true, provider: "github" });
        await waitFor(() => state.status === "completed" || state.userIntervention?.status === "pending" || Boolean(state.lastError));
        const diagnostics = JSON.stringify(coordinator.database().eventsAfter(state.id, 0, 2000).filter((event) =>
          event.type.includes("failed") || event.type.includes("repair") || event.type.includes("attempt")).map((event) =>
          ({ type: event.type, payload: event.payload })));
        expect(state.lastError, diagnostics).toBeUndefined();
        expect(state.status).toBe(mode === "project_completion" ? "completed" : "retrying");
        if (mode !== "project_completion") expect(state.userIntervention?.message).toBe("Agent asks the original user requirement");
        expect(turns).toBe(mode === "project_completion" ? 1 : 2); expect(opens, diagnostics).toBe(nativeFailure ? 2 : 1); expect(closes).toBe(opens);
        expect(state.performance?.history).toHaveLength(turns);
        expect(state.performance?.aggregate?.invocations).toBe(nativeFailure ? turns - 1 : turns);
        expect(state.performance?.latest).toMatchObject({ firstTokenLatencyMs: 100, requestActive: false, status: "completed" });
        expect(memories).toHaveLength(1); expect(memories[0]).toContain("Main-authored memory: keep this original task");
        expect(memoryAttempts).toBe(mode === "memory_failure" ? 2 : 1);
        const events = coordinator.database().eventsAfter(state.id, 0, 2000);
        expect(events.filter((event) => event.type === "main.route.task_completion.committed")).toEqual([
          expect.objectContaining({ payload: expect.objectContaining({ inputId: firstInputId }) })
        ]);
        expect(Object.keys(state.taskCompletions ?? {})).toHaveLength(1);
        expect(events.filter((event) => event.type === "main.route_action.accepted")).toHaveLength(nativeFailure ? 2 : 1);
        expect(events.filter((event) => event.type === "main.route.response.committed")).toHaveLength(1);
        expect(events.filter((event) => event.type === "main.route.mechanism_repair.requested")).toHaveLength(nativeFailure || mode === "project_completion" ? 0 : 1);
        if (mode === "authoring_native_failure") {
          const attempts = events.filter(event => event.type === "main.route.attempt");
          expect(attempts).toHaveLength(2);
          expect(attempts[1]!.invocationId).not.toBe(attempts[0]!.invocationId);
          expect(attempts.map(event => event.payload.workflowAuthoringInvocationId))
            .toEqual([attempts[0]!.invocationId, attempts[0]!.invocationId]);
          expect(state.agents.main.instructions).not.toContain("Unfinished Agent-authored proposal edit.");
        }
      } finally { await coordinator.shutdown(); }
    }, 15_000);

  it.each([false, true])("accepts the original Main proposal through a real control callback after recovered epoch=%s", async recovered => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-main-pinned-apply-")); temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub()); await storage.initialize();
    const state = projectState("prj_39393939393939393939393939393940");
    state.orchestration = { ...state.orchestration, schemaVersion: 3, allowMainReconfiguration: true,
      agents: [state.orchestration.agents.find(agent => agent.name === "main")!],
      input: { source: "input", target: "main" }, routes: { main: [] },
      decisionPlans: { main: state.orchestration.decisionPlans.main! },
      scopedWorkflow: { schemaVersion: 1, rootAgentIds: ["main"], groups: [] },
      termination: { ...state.orchestration.termination, agent: "main" } };
    state.agents = { main: { ...state.agents.main, sessionPersistence: false } };
    await storage.createProject(state);
    const session = { schemaVersion: 1 as const, harnessId: "codex" as const, adapterVersion: "test", generation: 0,
      nativeId: "pinned-proposal-original-session", durable: true, createdAt: "2026-10-09T00:00:00.000Z" };
    let turns = 0; let originalProposal = ""; let originalInvocation = ""; let applied = false;
    const memories: string[] = [];
    const adapter = { async open(input: import("../../src/core/collaboration-runtime.js").CollaborationResidentOpenInput) {
      const lease = { session, acknowledgedControlSeq: 0 };
      return { initialLease: lease, async submit(turn: { inputId: string; invocationId: string; prompt: string }) {
        turns += 1;
        const fresh = await input.turnRequestFactory({ baseRequest: input.request, turn });
        if (turns === 1) await fresh.request.onDurableSessionStarted?.(session, session.nativeId);
        else expect(fresh.request.resumeThreadId).toBe(session.nativeId);
        const authority = await input.controlAuthorityFactory!({ request: fresh.request, turn });
        const service = new ControlActionService({ projectId: state.id, agent: "main", invocationId: turn.invocationId,
          stateVersion: authority.control.stateVersion, capability: authority.control.capability,
          capabilityHash: authority.control.capabilityHash, stagingPath: authority.control.stagingPath, revalidate: authority.revalidate });
        const actions: ControlActionEnvelope[] = [];
        const call = async (action: ControlAction) => { const envelope = await service.stage(authority.control.capability,
          `pinned-${turn.invocationId}-${actions.length}`, action); actions.push(envelope); };
        if (turns === 1) {
          originalProposal = input.inputs!.workflowAuthoringPath!; originalInvocation = turn.invocationId;
          const proposal = JSON.parse(await fs.readFile(originalProposal, "utf8"));
          proposal.agents.main.instructions += "\nExact retained Main edit, formally applied once.";
          await fs.writeFile(originalProposal, JSON.stringify(proposal));
          if (recovered) throw new Error("Main stopped with its unaccepted original proposal");
          await call({ tool: "finish_task", summary: "Finished original authoring task" });
          return { handoff: "Formal proposal still needs my apply tool", controlActions: actions };
        }
        if (turns === 2) {
          expect(turn.invocationId).not.toBe(originalInvocation);
          expect(authority.control.workflowAuthoringPath).toBe(originalProposal);
          if (recovered) await call({ tool: "finish_task", summary: "Finished original authoring task after recovery" });
          await call({ tool: "apply_workflow", path: "workflow.json", rationale: "Apply my preserved original proposal" });
          applied = true;
          return { handoff: "Main applied its exact retained proposal", controlActions: actions };
        }
        expect(turns).toBe(3);
        await call({ tool: "finish_task", summary: "Finished subsequent Main task" });
        await call({ tool: "request_user", message: "The accepted original edit is ready for the next user decision",
          rationale: "Main has applied and inspected its retained proposal" });
        return { handoff: "Await the user after the accepted workflow revision", controlActions: actions };
      }, async pause() {}, async resume() {}, async probe() { return lease; }, async close() {} };
    } } as unknown as HarnessRuntimeResidentAdapter;
    const native = { reconcileResidentStartup: vi.fn(async () => ({ status: "none" })), residentRecoveryStrategy: () => "native-resume",
      cleanupResidentInterrupted: vi.fn(async () => undefined) } as unknown as HarnessRuntimeFacade;
    const coordinator = new CollaborationRuntimeCoordinator({ storage, serviceId: "pinned-main-apply", hostId: "host-test",
      validateWorkflowConfiguration: async () => undefined,
      gitFactory: options => ({ ...happyGitFake(options, [], true, false, memories), async prepareAgentManagementWorkspace(agentId: string) {
        const workspace = path.join(storage.projectDir(state.id), "git-worktrees", "agents", agentId);
        await fs.mkdir(workspace, { recursive: true }); return workspace;
      } }), residentLauncher: createProductionCollaborationResidentLauncher(native, adapter) });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    try {
      await coordinator.createProject(state, { enabled: true, provider: "github" });
      await waitFor(() => Boolean(state.userIntervention) || Boolean(state.lastError));
      expect(state.lastError).toBeUndefined(); expect(applied).toBe(true);
      expect(state.workflowRevision).toBe(2);
      expect(state.agents.main.instructions).toContain("Exact retained Main edit, formally applied once.");
      const accepted = coordinator.database().eventsAfter(state.id, 0, 2000).filter(event => event.type === "main.route_action.accepted" &&
        (event.payload.action as ControlAction | undefined)?.tool === "apply_workflow");
      expect(accepted).toHaveLength(1);
      expect(JSON.stringify(accepted[0]!.payload)).toContain("Exact retained Main edit, formally applied once.");
      expect(JSON.parse(await fs.readFile(originalProposal, "utf8")).agents.main.instructions)
        .toContain("Exact retained Main edit, formally applied once.");
    } finally { await coordinator.shutdown(); }
  }, 15_000);

  it.each(["missing_finish", "missing_decision"] as const)(
    "bounds Main's production native repairs for %s and lets explicit Resume repair the original session", async (mode) => {
      const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-main-bounded-native-")); temporaryRoots.push(root);
      const storage = new ProjectStorage(root, new EventHub()); await storage.initialize();
      const state = projectState("prj_40404040404040404040404040404040");
      state.orchestration = { ...state.orchestration, agents: [state.orchestration.agents.find((item) => item.name === "main")!],
        input: { source: "input", target: "main" }, routes: { main: [] }, termination: { ...state.orchestration.termination, agent: "main" } };
      state.agents = { main: { ...state.agents.main, sessionPersistence: false } }; await storage.createProject(state);
      let turns = 0; let opens = 0; let closes = 0; const memories: string[] = [];
      let repairAfterResume = false;
      const native = { reconcileResidentStartup: vi.fn(async () => ({ status: "none" })),
        residentRecoveryStrategy: () => "native-resume", cleanupResidentInterrupted: vi.fn(async () => undefined) } as unknown as HarnessRuntimeFacade;
      const adapter = { async open(input: import("../../src/core/collaboration-runtime.js").CollaborationResidentOpenInput) {
        opens += 1;
        const lease = { session: { schemaVersion: 1 as const, harnessId: "codex" as const, adapterVersion: "test",
          nativeId: "bounded-main-session", generation: 0, durable: true, createdAt: new Date().toISOString() }, acknowledgedControlSeq: 0 };
        return { initialLease: lease, async submit(turn: { inputId: string; invocationId: string; prompt: string }) {
          turns += 1; const fresh = await input.turnRequestFactory({ baseRequest: input.request, turn });
          if (turns === 1) await fresh.request.onDurableSessionStarted?.(lease.session, lease.session.nativeId);
          else expect(fresh.request.resumeThreadId).toBe(lease.session.nativeId);
          if (repairAfterResume) {
            const authority = await input.controlAuthorityFactory!({ request: fresh.request, turn });
            const service = new ControlActionService({ projectId: state.id, agent: "main", invocationId: turn.invocationId,
              stateVersion: authority.control.stateVersion, capability: authority.control.capability,
              capabilityHash: authority.control.capabilityHash, stagingPath: authority.control.stagingPath, revalidate: authority.revalidate });
            const actions = [await service.stage(authority.control.capability, "resumed-main-finish", {
              tool: "finish_task", summary: "Finished my original task", memory: "Main's own resumed memory"
            })];
            if (mode === "missing_decision") actions.push(await service.stage(authority.control.capability, "resumed-main-choice", {
              tool: "request_user", message: "Main's resumed choice", rationale: "Agent chose after explicit Resume"
            }));
            return { handoff: "Agent repaired the original task after explicit Resume", controlActions: actions };
          }
          if (turns === 1 && mode === "missing_finish") {
            const authority = await input.controlAuthorityFactory!({ request: fresh.request, turn });
            const service = new ControlActionService({ projectId: state.id, agent: "main", invocationId: turn.invocationId,
              stateVersion: authority.control.stateVersion, capability: authority.control.capability,
              capabilityHash: authority.control.capabilityHash, stagingPath: authority.control.stagingPath, revalidate: authority.revalidate });
            const envelope = await service.stage(authority.control.capability, "held-main-user-choice",
              { tool: "request_user", message: "Main's retained choice", rationale: "Agent chose" });
            return { handoff: "Agent returned before finishing", controlActions: [envelope] };
          }
          return { handoff: "Still no required mechanism tools" };
        }, async pause() {}, async resume() {}, async probe() { return lease; }, async close() { closes += 1; } };
      } } as unknown as HarnessRuntimeResidentAdapter;
      const coordinator = new CollaborationRuntimeCoordinator({ storage, serviceId: `main-bounded-${mode}`, hostId: "host-test",
        gitFactory: (options) => happyGitFake(options, [], true, false, memories),
        residentLauncher: createProductionCollaborationResidentLauncher(native, adapter) });
      if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
      await coordinator.initialize();
      try {
        await coordinator.createProject(state, { enabled: true, provider: "github" });
        await waitFor(() => ["paused", "retrying"].includes(state.status));
        expect(turns, JSON.stringify({ lastError: state.lastError, events: coordinator.database().eventsAfter(state.id, 0, 2000)
          .filter((event) => event.type.includes("failed") || event.type.includes("repair")) })).toBe(3);
        expect(opens).toBe(1); expect(closes).toBe(1); expect(memories).toHaveLength(0);
        expect(state.userIntervention).toBeUndefined();
        expect(state.phase).toBe("collaboration:main-recovery-waiting");
        expect(coordinator.database().projectState(state.id).frozen).toBe(true);
        const events = coordinator.database().eventsAfter(state.id, 0, 2000);
        expect(events.filter((event) => event.type === "main.route.mechanism_repair.requested")).toHaveLength(2);
        expect(events.filter((event) => event.type === "main.route.response.committed")).toHaveLength(0);
        expect(events.filter((event) => event.type === "main.route.task_completion.committed")).toHaveLength(0);
        expect(coordinator.database().mainRouteControlRepairCount(state.id, state.nodeRuns![0]!.id)).toBe(2);
        expect(coordinator.database().projectState(state.id).runtimeActivities).toHaveLength(0);
        // Recovery retains the original scene and renews fast repairs after exact stop proof; dispatch remains deferred.
        await coordinator.recoverProject(state);
        expect(turns).toBe(3);
        expect(coordinator.database().mainRouteControlRepairCount(state.id, state.nodeRuns![0]!.id)).toBe(0);
        repairAfterResume = true;
        await coordinator.resumeProject(state);
        await waitFor(() => state.userIntervention?.status === "pending" || Boolean(state.lastError));
        expect(state.lastError).toBeUndefined();
        expect(turns).toBe(4); expect(opens).toBe(2); expect(closes).toBe(2);
        expect(memories).toEqual([expect.stringContaining("Main's own resumed memory")]);
        expect(state.userIntervention?.message).toBe(mode === "missing_finish" ? "Main's retained choice" : "Main's resumed choice");
        const resumed = coordinator.database().eventsAfter(state.id, 0, 2000);
        expect(resumed.filter(event => event.type === "main.route.mechanism_repair.requested")).toHaveLength(2);
        expect(resumed.filter(event => event.type === "main.route.recovered" && event.payload.mechanismRepairBudgetRenewed === true)).toHaveLength(1);
      } finally { await coordinator.shutdown(); }
    }, 15_000);

  it.each(["missing_finish", "memory_failure", "rejected_finish"] as const)(
    "retains an accepted Leader decision while the same Agent explicitly repairs %s", async (mode) => {
      const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-leader-finish-"));
      temporaryRoots.push(root);
      const storage = new ProjectStorage(root, new EventHub());
      await storage.initialize();
      const state = projectState("prj_37373737373737373737373737373737");
      state.agents.main.sessionPersistence = false;
      state.orchestration = { ...state.orchestration,
        collaborations: [{ id: "finish-team", displayName: "Finish team",
          memberAgentIds: ["idea", "execution"], renamePolicy: "editable" }],
        input: { source: "input", target: "finish-team" },
        routes: { ...state.orchestration.routes, "finish-team": [{ target: "finish", kind: "strong" }] } };
      await storage.createProject(state);
      let leaderTurns = 0;
      let leaderOpens = 0;
      let planInputId: string | undefined;
      let integrationRequested = false;
      let finishToolActive = false;
      let memoryAttempts = 0;
      let toolFailureReturned = false;
      const memoryContents: string[] = [];
      const coordinator = new CollaborationRuntimeCoordinator({ storage, serviceId: "leader-finish-test", hostId: "host-test",
        gitFactory: (options) => {
          const git = happyGitFake(options, [], true, false, memoryContents);
          return { ...git, async commitManagementMemory(...args) {
            expect(finishToolActive).toBe(true);
            memoryAttempts += 1;
            if (mode === "memory_failure" && memoryAttempts === 1) throw new Error("fixture memory save failed inside finish_task");
            return git.commitManagementMemory!(...args);
          } };
        },
        residentLauncher: { async open(input) {
          const context = input.request.executionContext!;
          if (context.role === "leader") leaderOpens += 1;
          return { async submit(turn) {
            if (context.role !== "leader") return agentFixtureDelivery(input, turn, { handoff: "Business Agent delivered" }, coordinator);
            leaderTurns += 1;
            planInputId ??= turn.inputId;
            const fresh = await input.turnRequestFactory({ baseRequest: input.request, turn });
            if (leaderTurns === 1) await fresh.request.onDurableSessionStarted?.({ schemaVersion: 1, harnessId: "codex",
              adapterVersion: "1", generation: 0, nativeId: "retained-leader-finish-session", durable: true,
              createdAt: new Date().toISOString() }, "retained-leader-finish-session");
            else expect(fresh.request.resumeThreadId).toBe("retained-leader-finish-session");
            const authority = await input.controlAuthorityFactory!({ request: fresh.request, turn });
            const service = new ControlActionService({ projectId: state.id, agent: input.request.agent,
              invocationId: turn.invocationId, stateVersion: authority.control.stateVersion,
              capability: authority.control.capability, capabilityHash: authority.control.capabilityHash,
              stagingPath: authority.control.stagingPath, revalidate: authority.revalidate });
            const envelopes: ControlActionEnvelope[] = [];
            const call = async (action: ControlAction) => {
              const envelope = await service.stage(authority.control.capability,
                `leader-test-${turn.invocationId}-${envelopes.length}`, action);
              envelopes.push(envelope);
            };
            const finish: ControlAction = { tool: "finish_task", summary: "Agent finished this coordination round",
              memory: "Agent-authored memory: retain the original task and its accepted decision." };
            const requestFinish = async () => {
              finishToolActive = true;
              try { await call(finish); } finally { finishToolActive = false; }
            };
            const assign: ControlAction = { tool: "assign_group_tasks", groupRunId: context.groupRunId!,
              coordinatorEpoch: context.coordinatorEpoch!, tasks: [{ taskId: "task-held-plan",
                assignment: "Original Agent-assigned work", assigneeAgentId: "idea" }] };
            if (leaderTurns === 1) {
              if (mode === "memory_failure") {
                await expect(requestFinish()).rejects.toThrow("fixture memory save failed inside finish_task");
                toolFailureReturned = true;
              }
              await call(assign);
              if (mode === "rejected_finish") {
                await expect(service.stage(authority.control.capability, envelopes[0]!.callId, finish))
                  .rejects.toThrow("callId was already used for a different action");
                expect(memoryAttempts).toBe(0);
                expect(Object.keys(state.taskCompletions ?? {})).toHaveLength(0);
              }
              return { handoff: "Accepted plan; my finish tool remains incomplete", controlActions: envelopes };
            }
            if (turn.inputId === planInputId || turn.inputId.startsWith(`${planInputId}-mechanism-repair-`)) {
              expect(leaderTurns).toBe(2);
              expect(turn.prompt).toContain("decision has already been accepted");
              expect(turn.prompt).toContain("finish_task");
              expect(coordinator.database().projectState(state.id).tasks).toHaveLength(0);
              expect(coordinator.database().projectState(state.id).executions).toHaveLength(0);
              expect(memoryContents).toHaveLength(0);
              if (mode === "memory_failure") expect(toolFailureReturned).toBe(true);
              await expect(call({ ...assign, tasks: [{ taskId: "task-held-plan", assignment: "Unauthorized replacement",
                assigneeAgentId: "execution" }] })).rejects.toThrow("accepted decision cannot be replaced");
              await requestFinish();
              await requestFinish(); // Explicit equivalent retry must not write memory twice.
              return { handoff: "Finished the held management plan", controlActions: envelopes };
            }
            if (!integrationRequested) {
              integrationRequested = true;
              await requestFinish();
              await call({ tool: "request_group_integration", groupRunId: context.groupRunId!,
                coordinatorEpoch: context.coordinatorEpoch!, integrationOwnerAgentId: "execution" });
            } else {
              const complete: ControlAction = { tool: "complete_group", groupRunId: context.groupRunId!,
                coordinatorEpoch: context.coordinatorEpoch!, output: "Explicit Leader completion" };
              await expect(call(complete)).rejects.toThrow("finish_task for its own management round before complete_group");
              await requestFinish();
              await call(complete);
            }
            return { handoff: "Formal management action", controlActions: envelopes };
          }, async pause() {}, async resume() {}, async close() {} };
        } }
      });
      if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
      await coordinator.initialize();
      try {
        await coordinator.createProject(state, { enabled: true, provider: "github" });
        await waitFor(() => state.status === "completed" || Boolean(state.lastError));
        expect(state.lastError).toBeUndefined();
        expect(state.status).toBe("completed");
        expect(leaderTurns).toBe(4);
        expect(leaderOpens).toBe(1);
        expect(memoryAttempts).toBe(mode === "memory_failure" ? 4 : 3);
        expect(memoryContents).toHaveLength(3);
        expect(memoryContents.every((item) => item.includes("Agent-authored memory: retain the original task"))).toBe(true);
        expect(state.tasks?.find((item) => item.id === "task-held-plan"))
          .toMatchObject({ assignment: "Original Agent-assigned work", assigneeAgentId: "idea", status: "succeeded" });
        const events = coordinator.database().eventsAfter(state.id, 0, 2000);
        expect(events.filter((item) => item.type === "group.control_action.accepted")).toHaveLength(3);
        expect(events.filter((item) => item.type === "group.task_completion.committed")).toHaveLength(3);
        expect(events.filter((item) => item.type === "group.control.round.completed")).toHaveLength(3);
      } finally { await coordinator.shutdown(); }
    }, 15_000);

  it("does not bypass the bounded finish_task budget with an already accepted Leader decision", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-leader-missing-finish-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_38383838383838383838383838383838");
    state.orchestration = { ...state.orchestration,
      collaborations: [{ id: "missing-finish-team", displayName: "Missing finish team",
        memberAgentIds: ["idea", "execution"], renamePolicy: "editable" }],
      input: { source: "input", target: "missing-finish-team" },
      routes: { ...state.orchestration.routes, "missing-finish-team": [{ target: "finish", kind: "strong" }] } };
    await storage.createProject(state);
    let nativeTurns = 0;
    const coordinator = new CollaborationRuntimeCoordinator({ storage, serviceId: "leader-missing-finish-test", hostId: "host-test",
      gitFactory: (options) => ({ ...happyGitFake(options, []),
        async commitManagementMemory() { throw new Error("System cannot save memory without finish_task"); } }),
      residentLauncher: { async open(input) {
        return { async submit(turn) {
          nativeTurns += 1;
          if (nativeTurns > 1) return { handoff: "I still did not call finish_task" };
          const authority = await input.controlAuthorityFactory!({ request: input.request, turn });
          const envelope: ControlActionEnvelope = { projectId: state.id, agent: input.request.agent,
            invocationId: turn.invocationId, callId: "accepted-without-finish", stateVersion: authority.control.stateVersion,
            capabilityHash: authority.control.capabilityHash, receivedAt: new Date().toISOString(), action: {
              tool: "assign_group_tasks", groupRunId: input.request.executionContext!.groupRunId!,
              coordinatorEpoch: input.request.executionContext!.coordinatorEpoch!,
              tasks: [{ taskId: "never-started-task", assignment: "Must wait for actual finish", assigneeAgentId: "idea" }] } };
          await authority.revalidate(envelope, []);
          return { handoff: "Accepted decision alone", controlActions: [envelope] };
        }, async pause() {}, async resume() {}, async close() {} };
      } }
    });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    try {
      await coordinator.createProject(state, { enabled: true, provider: "github" });
      await waitFor(() => ["paused", "retrying"].includes(state.status) && Boolean(state.lastError));
      expect(nativeTurns).toBe(3);
      expect(state.lastError).toContain("two retained-session mechanism repairs");
      const projection = coordinator.database().projectState(state.id);
      expect(projection.tasks).toHaveLength(0);
      expect(projection.executions).toHaveLength(0);
      expect(coordinator.database().eventsAfter(state.id, 0, 1000)
        .filter((item) => item.type === "group.task_completion.committed")).toHaveLength(0);
    } finally { await coordinator.shutdown(); }
  }, 15_000);

  it("bounds a Leader without a formal decision in the original session and escalates after two repairs", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-missing-leader-decision-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_36363636363636363636363636363636");
    state.agents.main.sessionPersistence = false;
    state.orchestration = { ...state.orchestration,
      collaborations: [{ id: "missing-decision-team", displayName: "Missing decision team",
        memberAgentIds: ["idea", "execution"], renamePolicy: "editable" }],
      input: { source: "input", target: "missing-decision-team" },
      routes: { ...state.orchestration.routes, "missing-decision-team": [{ target: "finish", kind: "strong" }] } };
    await storage.createProject(state);
    let nativeTurns = 0;
    let closed = 0;
    const inputIds: string[] = [];
    const coordinator = new CollaborationRuntimeCoordinator({ storage, serviceId: "missing-decision-test", hostId: "host-test",
      gitFactory: (options) => ({ ...happyGitFake(options, []),
        async commitManagementMemory() { throw new Error("System cannot write memory on a no-decision natural return"); } }),
      residentLauncher: { async open(input) {
        expect(input.request.executionContext?.role).toBe("leader");
        return { async submit(turn) {
          nativeTurns += 1;
          inputIds.push(turn.inputId);
          const fresh = await input.turnRequestFactory({ baseRequest: input.request, turn });
          if (nativeTurns === 1) await fresh.request.onDurableSessionStarted?.({ schemaVersion: 1, harnessId: "codex",
            adapterVersion: "1", generation: 0, nativeId: "unfinished-leader-session", durable: true,
            createdAt: new Date().toISOString() }, "unfinished-leader-session");
          else {
            expect(fresh.request.resumeThreadId).toBe("unfinished-leader-session");
            expect(turn.prompt).toContain("previous turn ended without a formal group control decision");
          }
          return { handoff: "I returned without a formal control action" };
        }, async pause() {}, async resume() {}, async close() { closed += 1; } };
      } }
    });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    try {
      await coordinator.createProject(state, { enabled: true, provider: "github" });
      await waitFor(() => ["paused", "retrying"].includes(state.status) && Boolean(state.lastError));
      expect(nativeTurns).toBe(3);
      expect(new Set(inputIds).size).toBe(3);
      expect(inputIds.slice(1).every((id) => id.startsWith(`${inputIds[0]}-mechanism-repair-`))).toBe(true);
      expect(closed).toBeGreaterThan(0);
      expect(state.lastError).toContain("two retained-session mechanism repairs");
      const projection = coordinator.database().projectState(state.id);
      expect(projection.executions).toHaveLength(0);
      expect(projection.tasks).toHaveLength(0);
      expect(coordinator.database().groupControlRepairCount(state.id, projection.groupRuns[0]!.id, "main")).toBe(2);
    } finally { await coordinator.shutdown(); }
  }, 15_000);

  it.each(["open", "conflicted", "unknown"] as const)(
    "retains stopped Agent work and its %s PR without a system commit, push or close", async (status) => {
      const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-observe-stop-"));
      temporaryRoots.push(root);
      const storage = new ProjectStorage(root, new EventHub());
      await storage.initialize();
      const state = projectState("prj_34343434343434343434343434343434");
      state.git = { enabled: true, status: "ready", provider: "github", repository: {
        owner: "fixture-owner", name: "retained-stop", private: true, defaultBranch: "main",
        htmlUrl: "https://github.example/retained-stop", localPath: path.join(storage.projectDir(state.id), "repository")
      } };
      await storage.createProject(state);
      const push = vi.fn(async () => { throw new Error("The system must not push stopped Agent work"); });
      const close = vi.fn(async () => { throw new Error("The system must not close the Agent PR"); });
      const create = vi.fn(async () => { throw new Error("The system must not create a replacement PR"); });
      const head = "b".repeat(40);
      const pull = pullFact(41, "retained-execution", "executions/retained-execution", "main", head, status);
      const coordinator = new CollaborationRuntimeCoordinator({
        storage, serviceId: "observe-stop-test", hostId: "host-test",
        gitFactory: (options) => ({ ...happyGitFake(options, []),
          checkpointAndPush: push, closePullRequest: close, createPullRequest: create,
          observeExecutionCommit: async (execution) => ({ projectId: state.id,
            executionId: execution.id, branch: execution.executionBranch, worktreePath: execution.worktreePath,
            head, commitSha: head, changed: true, retained: true, observedAt: state.createdAt }),
          observePullRequest: async () => pull })
      });
      if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
      await coordinator.initialize();
      try {
        const database = coordinator.database();
        database.createProject({ projectId: state.id, workflowRevision: 1,
          workflowSnapshot: state.orchestration, git: state.git!, workerCapacity: 1, managementCapacity: 1 });
        const repository = repositoryFact("retained-stop");
        database.prepareOperation(state.id, { id: "retained-repository", kind: "repository.create",
          payloadHash: "retained-repository", status: "prepared" });
        database.transitionOperation(state.id, { id: "retained-repository", payloadHash: "retained-repository",
          status: "observed", remoteFact: repository });
        database.transitionOperation(state.id, { id: "retained-repository", payloadHash: "retained-repository",
          status: "finalized", remoteFact: repository });
        const worktree = path.join(storage.projectDir(state.id), "git-worktrees", "retained-execution");
        await fs.mkdir(worktree, { recursive: true });
        const dirty = path.join(worktree, "unfinished.txt");
        await fs.writeFile(dirty, "uncommitted Agent work\n");
        database.activateNode({ projectId: state.id, nodeRunId: "retained-node",
          node: { kind: "agent", nodeId: "idea", agentId: "idea" }, activationRequestId: "retained-activation",
          inputSnapshotRef: "fixture:retained", activatedByAgentId: "main", workflowRevision: 1 });
        const execution = database.startStandaloneExecution({ projectId: state.id, nodeRunId: "retained-node",
          taskId: "retained-task", executionId: "retained-execution", agentId: "idea", assignment: "Retain unfinished work",
          executionBranch: "executions/retained-execution", worktreePath: worktree, invocationId: "inv_retained_stop" }).execution;
        database.observePullRequest({ projectId: state.id, executionId: execution.id, ownershipEpoch: 1,
          pullRequest: pull });
        database.requestExecutionStop({ projectId: state.id, executionId: execution.id, ownershipEpoch: 1,
          reason: "native_failure", requestId: "retained-stop" });
        state.operations = database.projectState(state.id).operations;
        const observeStop = coordinator as unknown as { prepareStoppedExecutionForTerminalTransition(
          project: ProjectState, execution: typeof execution, reason: string, transition: "handoff"
        ): Promise<Record<string, unknown>> };
        const evidence = await observeStop.prepareStoppedExecutionForTerminalTransition(state, execution, "native_failure", "handoff");
        expect(evidence).toMatchObject({ checkpointAttempted: false, checkpointObserved: true,
          retainedExecution: execution.id, retainedWorktreePath: worktree, pullRequestNumber: 41,
          pullRequestStatus: status, checkpointCommit: head });
        expect(await fs.readFile(dirty, "utf8")).toBe("uncommitted Agent work\n");
        expect(database.projectState(state.id).pullRequests[0]).toMatchObject({ id: pull.id, status, headSha: head });
        expect(push).not.toHaveBeenCalled();
        expect(close).not.toHaveBeenCalled();
        expect(create).not.toHaveBeenCalled();
      } finally { await coordinator.shutdown(); }
    }
  );

  it("keeps one v3 Agent directory across executions while v2 retains execution directories", async () => {
    const root = path.join(os.tmpdir(), "openfars-fixed-agent-path");
    const orchestration = cloneAgentOrchestrationTemplate();
    expect(executionWorktreePath(root, orchestration, "analyst", "execution-one"))
      .toBe(path.join(root, "git-worktrees", "execution-one"));
    const scoped = { ...orchestration, schemaVersion: 3 as const };
    expect(executionWorktreePath(root, scoped, "analyst", "execution-one"))
      .toBe(path.join(root, "git-worktrees", "agents", "analyst"));
    expect(executionWorktreePath(root, scoped, "analyst", "execution-two"))
      .toBe(path.join(root, "git-worktrees", "agents", "analyst"));
    expect(executionWorktreePath(root, scoped, "研究员甲", "execution-three"))
      .toBe(path.join(root, "git-worktrees", "agents", "研究员甲"));
    expect(() => executionWorktreePath(root, scoped, "../escape", "execution-three"))
      .toThrow(/unsafe/i);
  });

  it("selects fixed Agent worktrees for a v3 project Git facade", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-v3-worktree-mode-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_33333333333333333333333333333333");
    state.orchestration.schemaVersion = 3;
    state.orchestration.scopedWorkflow = {
      schemaVersion: 1,
      rootAgentIds: ["main", "execution"],
      groups: []
    };
    await storage.createProject(state);
    const gitFactory = vi.fn((options: CollaborationGitFactoryOptions) =>
      initializationFake(options, []));
    const coordinator = new CollaborationRuntimeCoordinator({
      storage,
      serviceId: "v3-worktree-mode-test",
      hostId: "host-test",
      gitFactory
    });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    await coordinator.createProject(state, { enabled: true, provider: "github" });
    expect(gitFactory).toHaveBeenCalledWith(expect.objectContaining({ worktreeMode: "agent" }));
    await coordinator.shutdown();
  });

  it.each([true, false])("uses the accepted workflow Input while preserving an original root preparation (retained: %s)", async retained => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-original-root-preparation-")); temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub()); await storage.initialize();
    const state = projectState("prj_43434343434343434343434343434343");
    state.orchestration = { ...state.orchestration, schemaVersion: 3, input: { source: "input", target: "G" },
      collaborations: [{ id: "G", displayName: "G", memberAgentIds: [], renamePolicy: "editable" }],
      routes: { ...Object.fromEntries(state.orchestration.agents.map(agent => [agent.name, [{ kind: "strong", target: "G" }]])), G: [{ kind: "strong", target: "finish" }] },
      termination: { ...state.orchestration.termination, agent: "G" },
      scopedWorkflow: { schemaVersion: 1, rootAgentIds: state.orchestration.agents.map(agent => agent.name), groups: [{ id: "G", leaderAgentId: "main",
        allowLeaderReconfiguration: false, workflow: { nodes: [{ kind: "agent", nodeId: "G_idea", agentId: "idea" }],
          input: { source: "input", edges: [{ kind: "parallel", target: "G_idea" }] }, routes: { G_idea: [{ kind: "strong", target: "finish" }] } } }] } };
    state.git = { enabled: true, status: "ready", provider: "github", repository: { owner: "fixture-owner", name: "original-preparation",
      htmlUrl: "https://github.example/original-preparation", private: true, defaultBranch: "main", localPath: path.join(root, "repository") } };
    state.status = "queued"; state.phase = "queued";
    await storage.createProject(state);
    const gitFactory = vi.fn(options => happyGitFake(options, []));
    const coordinator = new CollaborationRuntimeCoordinator({ storage, serviceId: "original-preparation-test", hostId: "host-test", gitFactory,
      residentLauncher: { async open() { throw new Error("No native turn may start in the selection check"); } } });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    try {
      const database = coordinator.database();
      database.createProject({ projectId: state.id, workflowRevision: 1, workflowSnapshot: state.orchestration, git: state.git, workerCapacity: 1 });
      database.initializeScopedConfiguration(state.id, { agents: state.agents, skillDefinitions: {}, mcpDefinitions: {} });
      const original = retained ? database.prepareScopedGroupActivation({ projectId: state.id, groupRunId: "original-run-G", groupId: "G",
        activationRequestId: "original-root-request", workflowRevision: 1,
        outer: { nodeRunId: "original-node-G", inputSnapshotRef: "original-input", optionalTask: "Original immutable assignment", activatedByAgentId: "main" } }) : undefined;
      const current = database.workflowAdjustmentCurrent(state.id), proposal = structuredClone(current.snapshot);
      proposal.orchestration.input.target = "main";
      database.submitUserWorkflowAdjustment({ projectId: state.id, requestId: "future-root-input", base: current.version, proposal });
      const publication = database.prepareUserWorkflowAdjustmentPublication(state.id, "future-root-input");
      expect(publication.ready).toBe(true); if (!publication.ready) throw new Error("Future project Input does not replace a retained original preparation");
      const accept = async () => {
        expect(database.publishUserWorkflowAdjustment(state.id, "future-root-input", publication.validationToken).status).toBe("applied");
        const projection = database.projectState(state.id);
        state.orchestration = projection.workflowSnapshot as ProjectState["orchestration"]; state.workflowRevision = projection.workflowRevision;
        state.agents = structuredClone(projection.scopedConfiguration!.agents);
      };
      if (retained) await accept();
      const stop = new Error("Selection observed before any Git or native dispatch");
      const activate = vi.fn(async () => { throw stop; });
      const internal = coordinator as unknown as { scopedRuntime(...args: unknown[]): { activate(...args: unknown[]): Promise<never> };
        runManagedProject(state: ProjectState, signal: AbortSignal): Promise<void>; applyWaitingWorkflowAdjustments(state: ProjectState): Promise<void>;
        runManagementNode(...args: unknown[]): Promise<never> };
      vi.spyOn(internal, "scopedRuntime").mockReturnValue({ activate });
      const management = vi.spyOn(internal, "runManagementNode").mockImplementation(async () => { throw stop; });
      if (!retained) vi.spyOn(internal, "applyWaitingWorkflowAdjustments").mockImplementation(accept);
      await expect(internal.runManagedProject(state, new AbortController().signal)).rejects.toBe(stop);
      if (original) { expect(activate).toHaveBeenCalledExactlyOnceWith(original.input); expect(management).not.toHaveBeenCalled(); }
      else {
        expect(activate).not.toHaveBeenCalled(); expect(management).toHaveBeenCalledOnce();
        expect(database.projectState(state.id).nodeRuns).toMatchObject([{ workflowRevision: 2, node: { kind: "agent", agentId: "main" },
          inputSnapshotRef: `project:${state.id}:requirement:cycle:1` }]);
        expect(database.scopedGroupActivationPreparations(state.id)).toEqual([]);
      }
      expect(gitFactory).not.toHaveBeenCalled();
      expect(database.projectState(state.id).scopedArrivals).toEqual([]); expect(database.projectState(state.id).scopedGroupRuns).toEqual([]);
    } finally { await coordinator.shutdown(); }
  });

  it("pauses an accountless legacy Git project instead of using ambient credentials", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-accountless-runtime-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_99999999999999999999999999999999");
    await storage.createProject(state);
    const gitFactory = vi.fn((options: CollaborationGitFactoryOptions) =>
      initializationFake(options, []));
    const coordinator = new CollaborationRuntimeCoordinator({
      storage,
      serviceId: "account-binding-test",
      hostId: "host-test",
      leaseDurationMs: 5_000,
      gitFactory,
      credentialResolverForAccount: () => async () => ({
        token: "fixture-credential",
        requestedScopes: ["repo"]
      })
    });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();

    await expect(coordinator.recoverProject(state)).resolves.toBe(true);
    expect(state).toMatchObject({
      status: "retrying",
      phase: "git:waiting_for_github",
      git: { status: "waiting_for_github" }
    });
    expect(state.lastError).toMatch(/尚未绑定 GitHub 账号/);
    expect(gitFactory).not.toHaveBeenCalled();
    await expect(coordinator.createProject(state, { enabled: true, provider: "github" }))
      .rejects.toBeInstanceOf(GitHubAuthorizationError);
    expect(gitFactory).not.toHaveBeenCalled();
    await coordinator.shutdown();
  });

  it.each([2, 3].flatMap((version) => ["collaboration:scoped-waiting", "collaboration:paused", "git:waiting_for_github"]
    .map((phase) => ({ version, phase }))))(
    "automatically recovers a saved v$version technical wait $phase without requiring explicit resume", async ({ version, phase }) => {
      const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-v3-durable-pause-"));
      temporaryRoots.push(root);
      const storage = new ProjectStorage(root, new EventHub());
      await storage.initialize();
      const state = projectState("prj_33333333333333333333333333333333");
      if (version === 3) state.orchestration = normalizeNewGitOrchestration(state.orchestration);
      state.status = "paused";
      state.phase = phase;
      state.lastError = "fixture requires an explicit recovery decision";
      state.git = {
        enabled: true, status: "ready", provider: "github",
        repository: {
          owner: "fixture-owner", name: "durable-pause",
          htmlUrl: "https://github.example/durable-pause", private: true,
          defaultBranch: "main", localPath: path.join(root, "repository")
        }
      };
      await storage.createProject(state);
      const gitFactory = vi.fn((options: CollaborationGitFactoryOptions) => happyGitFake(options, []));
      const coordinator = new CollaborationRuntimeCoordinator({
        storage, serviceId: "durable-pause-test", hostId: "host-test", gitFactory
      });
      if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
      await coordinator.initialize();
      const database = (coordinator as unknown as { database(): CollaborationStateDatabase }).database();
      database.createProject({
        projectId: state.id, workflowRevision: 1, workflowSnapshot: state.orchestration,
        git: state.git, workerCapacity: 1, managementCapacity: 1,
        requestId: "durable-pause-fixture"
      });
      try {
        await expect(coordinator.recoverProject(state)).resolves.toBe(true);
        await waitFor(() => state.status === "retrying");
        expect(state.workflowRecovery).toMatchObject({ pending: true });
        await vi.waitFor(async () => expect((await storage.loadState(state.id)).status).toBe("retrying"), { timeout: 5_000 });
        await waitFor(() => gitFactory.mock.calls.length > 0);
        expect(gitFactory).toHaveBeenCalledOnce();
      } finally {
        await coordinator.shutdown();
      }
    }
  );

  it.each([false, true].flatMap(live => [false, true].map(preserveRecoveryBudget => ({ live, preserveRecoveryBudget }))))(
    "authorizes scoped repair through public Resume only after manager stop (live: $live, preserve budget: $preserveRecoveryBudget)", async ({ live, preserveRecoveryBudget }) => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-scoped-resume-lifecycle-")); temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub()); await storage.initialize();
    const state = projectState("prj_41414141414141414141414141414141");
    state.orchestration = { ...state.orchestration, schemaVersion: 3,
      input: { source: "input", target: "G" }, routes: { main: [], G: [{ kind: "strong", target: "finish" }] },
      collaborations: [{ id: "G", displayName: "G", memberAgentIds: [], renamePolicy: "editable" }],
      scopedWorkflow: { schemaVersion: 1, rootAgentIds: ["main"], groups: [{ id: "G", leaderAgentId: "main",
        allowLeaderReconfiguration: false, workflow: { nodes: [{ kind: "agent", nodeId: "G_idea", agentId: "idea" }],
          input: { source: "input", edges: [{ kind: "parallel", target: "G_idea" }] },
          routes: { G_idea: [{ kind: "strong", target: "finish" }] } } }] } };
    state.status = "paused"; state.phase = "collaboration:scoped-failure";
    state.git = { enabled: true, status: "ready", provider: "github", repository: {
      owner: "fixture-owner", name: "scoped-resume", htmlUrl: "https://github.example/scoped-resume",
      private: true, defaultBranch: "main", localPath: path.join(root, "repository") } };
    await storage.createProject(state);
    const coordinator = new CollaborationRuntimeCoordinator({ storage, serviceId: "scoped-resume-test", hostId: "host-test",
      gitFactory: options => happyGitFake(options, []) });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    const database = coordinator.database();
    database.createProject({ projectId: state.id, workflowRevision: 1, workflowSnapshot: state.orchestration,
      git: state.git, workerCapacity: 1, managementCapacity: 1 });
    database.activateScopedGroup({ projectId: state.id, groupRunId: "run-G", groupId: "G", workflowRevision: 1,
      activationRequestId: "activate-G", baseCommit: "a".repeat(40),
      outer: { nodeRunId: "node-G", inputSnapshotRef: "project:requirement", activatedByAgentId: "main" } });
    const claim = database.claimScopedLeaderTurn({ projectId: state.id, groupRunId: "run-G", agentId: "main", invocationId: "inv_retained-manager",
      runtimePath: await storage.invocationRuntimePath(state.id, "inv_retained-manager") })!;
    database.markScopedLeaderOpened({ projectId: state.id, groupRunId: "run-G", agentId: "main", invocationId: claim.invocationId,
      coordinatorEpoch: claim.coordinatorEpoch });
    const repairScopeKey = createHash("sha256").update(JSON.stringify(["run-G", "main", "plan", null, false])).digest("hex");
    for (const attempt of [1, 2]) database.appendEvent({ projectId: state.id, agentId: "main", invocationId: claim.invocationId,
      coordinatorEpoch: claim.coordinatorEpoch, requestId: `retained-plan-repair:${attempt}`, type: "scoped.management.mechanism_repair.requested",
      payload: { groupRunId: "run-G", purpose: "plan", repairScopeKey, attempt, missing: ["finish_task", "formal plan control action"] } });
    database.recordScopedGroupIssue({ projectId: state.id, groupRunId: "run-G", kind: "plan", reason: "Retained plan did not finish" });
    const schedule = vi.spyOn(coordinator as unknown as { scheduleProjectAfterSettlingRun(...args: unknown[]): void }, "scheduleProjectAfterSettlingRun")
      .mockImplementation(() => undefined);
    try {
      if (!live) database.releaseScopedLeaderTurn({ projectId: state.id, groupRunId: "run-G", agentId: "main",
        invocationId: claim.invocationId, residentStopConfirmed: true });
      await coordinator.recoverProject(state);
      expect(database.scopedManagementRepairCount(state.id, repairScopeKey)).toBe(2);
      expect(schedule).not.toHaveBeenCalled();
      if (live) {
        await expect(coordinator.resumeProject(state, { preserveRecoveryBudget })).rejects.toThrow(/stopped manager|native stop/);
        expect(database.scopedManagementRepairCount(state.id, repairScopeKey)).toBe(2);
        expect(schedule).not.toHaveBeenCalled();
      } else {
        await coordinator.resumeProject(state, { preserveRecoveryBudget });
        expect(database.scopedManagementRepairCount(state.id, repairScopeKey)).toBe(preserveRecoveryBudget ? 2 : 0);
        expect(schedule).toHaveBeenCalledOnce();
        expect(database.scopedGroupPlan(state.id, "run-G")).toBeUndefined();
        expect(database.projectState(state.id).scopedExecutions).toEqual([]);
        const grants = database.eventsAfter(state.id, 0, 1000).filter(event => event.type === "scoped.management.recovery.resumed");
        expect(grants).toHaveLength(preserveRecoveryBudget ? 0 : 1);
        if (!preserveRecoveryBudget) expect(grants[0]).toMatchObject({ invocationId: claim.invocationId, coordinatorEpoch: claim.coordinatorEpoch,
          payload: { explicitUserResume: true, nodeRunId: "node-G", rootGroupRunId: "run-G" } });
        if (!preserveRecoveryBudget) await coordinator.resumeProject(state);
        expect(database.eventsAfter(state.id, 0, 1000).filter(event => event.type === "scoped.management.recovery.resumed")).toHaveLength(preserveRecoveryBudget ? 0 : 1);
        if (preserveRecoveryBudget) {
          state.status = "paused"; state.phase = "collaboration:main-recovery-waiting-user";
          database.freezeMainRouteFailure({ projectId: state.id, nodeRunId: "node-G", routeEpoch: claim.coordinatorEpoch,
            error: "Retained Main recovery is frozen; this option cannot renew it" });
          const frozen = database.projectState(state.id), saved = structuredClone(state);
          await expect(coordinator.resumeProject(state, { preserveRecoveryBudget: true })).rejects.toThrow(/nonfrozen paused scope/);
          expect(database.projectState(state.id)).toEqual(frozen); expect(state).toEqual(saved);
          expect(database.scopedManagementRepairCount(state.id, repairScopeKey)).toBe(2);
          expect(schedule).toHaveBeenCalledOnce();
        }
      }
    } finally {
      database.releaseScopedLeaderTurn({ projectId: state.id, groupRunId: "run-G", agentId: "main",
        invocationId: claim.invocationId, residentStopConfirmed: true });
      schedule.mockRestore(); await coordinator.shutdown();
    }
  });

  it.each([[2, false], [2, true], [3, false], [3, true]] as const)(
    "retains a pending or settled user Pause across writer restart in workflow v%s (settled: %s)", async (version, settled) => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-user-pause-restart-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub()); await storage.initialize();
    const state = projectState("prj_35353535353535353535353535353535");
    if (version === 3) state.orchestration = normalizeNewGitOrchestration(state.orchestration);
    state.status = "running"; state.phase = "collaboration:running";
    state.agentSessionIds = { idea: "original-pausing-native-session" };
    state.agentSessions = { idea: { schemaVersion: 1, harnessId: "codex", adapterVersion: "4", generation: 0,
      nativeId: "original-pausing-native-session", durable: true, createdAt: state.createdAt } };
    state.runCounts.idea = 7;
    state.pauseRequest = { requestedAt: "2026-10-02T23:59:00.000Z" };
    state.git = { enabled: true, status: "ready", provider: "github", repository: {
      owner: "fixture-owner", name: "pending-pause", htmlUrl: "https://github.example/pending-pause",
      private: true, defaultBranch: "main", localPath: path.join(root, "repository") } };
    await storage.createProject(state);
    const gitFactory = vi.fn((options: CollaborationGitFactoryOptions) => happyGitFake(options, []));
    const first = new CollaborationRuntimeCoordinator({ storage, serviceId: "pause-before-restart", hostId: "host-test", gitFactory });
    if (first instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(first);
    await first.initialize();
    (first as unknown as { database(): CollaborationStateDatabase }).database().createProject({
      projectId: state.id, workflowRevision: 1, workflowSnapshot: state.orchestration, git: state.git,
      workerCapacity: 1, managementCapacity: 1, requestId: "pending-pause-fixture" });
    if (settled) await first.pauseProject(state);
    await first.shutdown();
    const freshStorage = new ProjectStorage(root, new EventHub()); await freshStorage.initialize();
    const restored = await freshStorage.loadState(state.id);
    const restarted = new CollaborationRuntimeCoordinator({ storage: freshStorage,
      serviceId: "pause-after-restart", hostId: "host-test", gitFactory });
    if (restarted instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(restarted);
    await restarted.initialize();
    try {
      await expect(restarted.recoverProject(restored)).resolves.toBe(true);
      expect(restored).toMatchObject({ status: settled ? "paused" : "pausing",
        phase: settled ? "collaboration:user-paused" : "collaboration:user-pause-recovery-required",
        pauseRequest: state.pauseRequest, agentSessionIds: state.agentSessionIds, agentSessions: state.agentSessions,
        runCounts: state.runCounts });
      expect(restarted.projectReadModel(restored)).toMatchObject({ status: settled ? "paused" : "pausing",
        runtime: { status: settled ? "paused" : "pausing", activities: [] } });
      expect((await freshStorage.loadState(state.id)).pauseRequest).toEqual(state.pauseRequest);
      expect(gitFactory).not.toHaveBeenCalled();
      // No fabricated native stop or safe-point receipt during startup.
      expect(Boolean(restored.pauseRequest!.settledAt)).toBe(settled);
      if (!settled) {
        await expect(restarted.pauseProject(restored)).rejects.toThrow(/original native safe-point proof/);
        expect((await freshStorage.loadState(state.id)).pauseRequest?.settledAt).toBeUndefined();
        expect(gitFactory).not.toHaveBeenCalled();
      }
      await restarted.resumeProject(restored);
      await waitFor(() => restored.phase === "collaboration:resident-launcher-required");
      expect(restored.pauseRequest).toBeUndefined();
      expect((await freshStorage.loadState(state.id)).pauseRequest).toBeUndefined();
      expect(restored.agentSessionIds).toEqual(state.agentSessionIds);
      expect(gitFactory).toHaveBeenCalledOnce();
    } finally { await restarted.shutdown(); }
  });

  it("keeps the saved user Pause after the exact writer is killed during pending publication", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-pause-writer-crash-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub()); await storage.initialize();
    const state = projectState("prj_36363636363636363636363636363636");
    state.status = "running"; state.phase = "collaboration:running";
    state.agentSessionIds = { idea: "native-before-writer-crash" };
    state.git = { enabled: true, status: "ready", provider: "github", repository: {
      owner: "fixture-owner", name: "writer-crash", htmlUrl: "https://github.example/writer-crash",
      private: true, defaultBranch: "main", localPath: path.join(root, "repository") } };
    await storage.createProject(state);
    const seed = new CollaborationRuntimeCoordinator({ storage, serviceId: "pause-crash-seed", hostId: "host-test" });
    await seed.initialize();
    (seed as unknown as { database(): CollaborationStateDatabase }).database().createProject({
      projectId: state.id, workflowRevision: 1, workflowSnapshot: state.orchestration, git: state.git,
      workerCapacity: 1, managementCapacity: 1, requestId: "pause-crash-fixture" });
    await seed.shutdown();
    const child = spawn(process.execPath, ["--import", "tsx", "tests/main-core/helpers/pause-writer-crash.ts", root, state.id],
      { cwd: process.cwd(), stdio: ["ignore", "ignore", "pipe", "ipc"] });
    let stderr = ""; child.stderr!.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });
    const exit = new Promise<{ code: number | null; signal: string | null }>((resolve) =>
      child.once("close", (code, signal) => resolve({ code, signal })));
    let restarted: CollaborationRuntimeCoordinator | undefined;
    try {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error(`Pause writer did not reach publication: ${stderr}`)), 10_000);
        const done = (error?: Error) => { clearTimeout(timeout); error ? reject(error) : resolve(); };
        child.once("error", done);
        child.once("exit", () => done(new Error(`Pause writer exited before publication: ${stderr}`)));
        child.once("message", (message) => {
          const receipt = message as { kind?: string; projectId?: string };
          done(receipt.kind === "pause-publication-held" && receipt.projectId === state.id
            ? undefined : new Error("Pause writer returned another publication receipt"));
        });
      });
      const held = await storage.loadState(state.id);
      expect(held).toMatchObject({ status: "pausing", phase: "collaboration:user-pausing",
        pauseRequest: { requestedAt: expect.any(String) }, agentSessionIds: state.agentSessionIds });
      expect(held.pauseRequest?.settledAt).toBeUndefined();
      expect(child.kill("SIGKILL")).toBe(true);
      expect(await exit).toEqual({ code: null, signal: "SIGKILL" });
      // The actual old writer exited. Let its 1s lease expire rather than
      // modifying the journal, lease row or recorded user request in SQLite.
      await new Promise((resolve) => setTimeout(resolve, 1_050));
      const freshStorage = new ProjectStorage(root, new EventHub()); await freshStorage.initialize();
      const restored = await freshStorage.loadState(state.id);
      const gitFactory = vi.fn();
      restarted = new CollaborationRuntimeCoordinator({ storage: freshStorage, serviceId: "pause-crash-recovered",
        hostId: "host-test", gitFactory });
      if (restarted instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(restarted);
      await restarted.initialize();
      await expect(restarted.recoverProject(restored)).resolves.toBe(true);
      expect(restarted.projectReadModel(restored)).toMatchObject({ status: "pausing",
        phase: "collaboration:user-pause-recovery-required", pauseRequest: held.pauseRequest,
        agentSessionIds: held.agentSessionIds });
      expect(gitFactory).not.toHaveBeenCalled();
      expect((await freshStorage.loadState(state.id)).pauseRequest).toEqual(held.pauseRequest);
    } finally {
      if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
      await exit;
      await restarted?.shutdown();
    }
  }, 15_000);

  it("withdraws the saved Pause when explicit Resume retries unfinished Git initialization", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-paused-init-resume-")); temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub()); await storage.initialize();
    const state = projectState("prj_37373737373737373737373737373737");
    state.status = "pausing"; state.phase = "collaboration:user-pausing";
    state.pauseRequest = { requestedAt: state.createdAt };
    state.git = { enabled: true, status: "failed", provider: "github",
      initialization: { operationId: `git-init-${state.id}`, attempt: 1, completedSteps: [] } };
    await storage.createProject(state);
    const gitFactory = vi.fn((options: CollaborationGitFactoryOptions) => happyGitFake(options, []));
    const coordinator = new CollaborationRuntimeCoordinator({ storage, serviceId: "paused-init-resume",
      hostId: "host-test", gitFactory });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    (coordinator as unknown as { database(): CollaborationStateDatabase }).database().createProject({
      projectId: state.id, workflowRevision: 1, workflowSnapshot: state.orchestration, git: state.git,
      workerCapacity: 1, managementCapacity: 1, requestId: "paused-init-resume-fixture" });
    try {
      await coordinator.recoverProject(state);
      expect(gitFactory).not.toHaveBeenCalled();
      expect(state.status).toBe("pausing");
      await coordinator.resumeProject(state);
      await waitFor(() => state.phase === "collaboration:resident-launcher-required");
      expect(state.git?.status).toBe("ready");
      expect((await storage.loadState(state.id)).pauseRequest).toBeUndefined();
      expect(gitFactory).toHaveBeenCalledOnce();
    } finally { await coordinator.shutdown(); }
  });

  it("durably retains the original failed initialization cause with redacted diagnostics", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-initialization-cause-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    await storage.createProject(state);
    const coordinator = new CollaborationRuntimeCoordinator({
      storage, serviceId: "initialization-cause-test", hostId: "host-test",
      gitFactory: (options) => ({
        ...happyGitFake(options, []),
        async initialize(request): Promise<GitInitializationResult> {
          const failed: ProjectGitState = { enabled: true, status: "failed", provider: "github",
            initialization: { operationId: request.operationId, attempt: request.attempt,
              completedSteps: ["repository.reconciled", "local.main.initialized"],
              error: "GITHUB_RESULT_UNCERTAIN: Initial push has not been confirmed" } };
          await options.operationStore.checkpointInitialization({ projectId: request.projectId,
            operationId: request.operationId, attempt: request.attempt, state: failed });
          return { state: failed, failure: new GitHubUncertainResultError(request.operationId,
            "Initial push has not been confirmed", { cause: new GitCommandError(128,
              "Git command failed with exit code 128", { command: "push" },
              { cause: new Error("fatal: TLS connection reset\nCookie: fixture_session=private-diagnostic-value") }) }) };
        }
      })
    });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    try {
      await coordinator.createProject(state, { enabled: true, provider: "github" });
      expect(state).toMatchObject({ status: "retrying", phase: "git:failed", nodeRuns: [] });
      const failure = state.failureAttempts?.find(item => item.operation === "initialization");
      expect(failure).toMatchObject({ causeClass: "GitHubUncertainResultError",
        errorCode: "GITHUB_RESULT_UNCERTAIN", metadata: { operationId: `git-init-${state.id}`,
          causeChain: [
            { causeClass: "GitHubUncertainResultError", redactedMessage: "Initial push has not been confirmed" },
            { causeClass: "GitCommandError", redactedMessage: "Git command failed with exit code 128" },
            { causeClass: "Error", redactedMessage: expect.stringContaining("fatal: TLS connection reset") }
          ] } });
      expect(JSON.stringify(failure)).toContain("[REDACTED]");
      expect(JSON.stringify(failure)).not.toContain("private-diagnostic-value");
      expect((await storage.loadState(state.id)).failureAttempts).toEqual(state.failureAttempts);
    } finally { await coordinator.shutdown(); }
  });

  it("fails closed, retries the same initialization operation, and mirrors events once", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-collaboration-runtime-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    await storage.createProject(state);
    const calls: Array<{ operationId: string; attempt: number; repositoryName: string }> = [];
    let coordinator!: CollaborationRuntimeCoordinator;
    coordinator = new CollaborationRuntimeCoordinator({
      storage,
      serviceId: "runtime-test",
      hostId: "host-test",
      leaseDurationMs: 5_000,
      gitFactory: (options) => initializationFake(options, calls)
    });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();

    await coordinator.createProject(state, { enabled: true, provider: "github" });
    expect(state).toMatchObject({
      status: "retrying",
      phase: "git:waiting_for_github",
      git: {
        status: "waiting_for_github",
        capacity: { retainedWorktreeCount: 0, warningThreshold: 100 }
      }
    });
    expect(state.nodeRuns).toEqual([]);
    expect(state.failureAttempts).toEqual([
      expect.objectContaining({
        attemptId: `git-initialization:git-init-${state.id}:1`,
        scope: "git",
        operation: "initialization",
        status: "failed",
        errorCode: "GITHUB_WAITING_FOR_AUTHORIZATION",
        retryable: true
      })
    ]);
    expect(calls[0]).toMatchObject({
      operationId: `git-init-${state.id}`,
      attempt: 1,
      repositoryName: `unsafe-title-${"a".repeat(10)}`
    });

    // The existing UI exposes Resume for a paused init; it must invoke the
    // same idempotent retry path rather than publish a fake queued phase.
    await coordinator.resumeProject(state);
    await waitFor(() => state.phase === "collaboration:resident-launcher-required");
    expect(calls).toHaveLength(2);
    expect(calls[1]).toMatchObject({ operationId: calls[0]!.operationId, attempt: 2 });
    expect(state.nodeRuns).toEqual([]);
    expect(state.queuedAgent).toBeUndefined();
    expect(state.activeAgentExecution).toBeUndefined();
    const retryTimeline = state.gitRetryScheduling?.at(-1);
    expect(retryTimeline).toMatchObject({
      operationId: calls[0]!.operationId,
      attempt: 2,
      retryAcceptedAt: { projectId: state.id },
      gitReadyPersistedAt: { waitingFor: { kind: "scheduler" } },
      priorRunSettledAt: { waitingFor: { kind: "scheduler" } },
      scheduleEnqueuedAt: { waitingFor: { kind: "main-resident" } }
    });
    expect(
      Date.parse(retryTimeline!.scheduleEnqueuedAt!.at) -
      Date.parse(retryTimeline!.gitReadyPersistedAt!.at)
    ).toBeLessThanOrEqual(5_000);
    expect(state.failureAttempts?.filter((attempt) =>
      attempt.scope === "git" && attempt.operation === "initialization"
    )).toEqual([
      expect.objectContaining({ status: "failed" }),
      expect.objectContaining({ status: "succeeded", errorCode: null, retryable: false })
    ]);
    expect(state.failureSummary?.operations).toEqual(expect.arrayContaining([
      expect.objectContaining({
        scope: "git",
        operation: "initialization",
        status: "succeeded",
        attemptCount: 2,
        failureCount: 1
      })
    ]));
    const beforeRestart = await storage.readEvents(state.id, 0, 1_000);
    const mirrored = beforeRestart.filter((event) => event.eventId?.startsWith("evt_git_init_"));
    expect(mirrored.length).toBeGreaterThanOrEqual(2);
    expect(new Set(mirrored.map((event) => event.eventId)).size).toBe(mirrored.length);
    expect(mirrored.every((event) => event.type === "git.initialization.updated")).toBe(true);
    const lastCollaborationSeq = state.collaboration?.eventSeq;

    await coordinator.shutdown();
    const restartedStorage = new ProjectStorage(root, new EventHub());
    await restartedStorage.initialize();
    const restartedState = await restartedStorage.loadState(state.id);
    const restarted = new CollaborationRuntimeCoordinator({
      storage: restartedStorage,
      serviceId: "runtime-test",
      hostId: "host-test",
      leaseDurationMs: 5_000,
      gitFactory: (options) => initializationFake(options, calls)
    });
    if (restarted instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(restarted);
    await restarted.initialize();
    expect(await restarted.recoverProject(restartedState)).toBe(true);
    if (["paused", "retrying"].includes(restartedState.status)) await restarted.resumeProject(restartedState);
    await waitFor(() => (restartedState.collaboration?.eventSeq ?? 0) > (lastCollaborationSeq ?? 0));
    await waitFor(() => restartedState.phase === "collaboration:resident-launcher-required");
    expect(restartedState.collaboration?.eventSeq).toBeGreaterThan(lastCollaborationSeq ?? 0);
    expect(restartedState.failureAttempts?.filter((attempt) =>
      attempt.scope === "git" && attempt.operation === "initialization"
    )).toEqual(state.failureAttempts?.filter((attempt) =>
      attempt.scope === "git" && attempt.operation === "initialization"
    ));
    const afterRestart = await restartedStorage.readEvents(state.id, 0, 1_000);
    expect(afterRestart.slice(0, beforeRestart.length).map((event) => event.eventId)).toEqual(
      beforeRestart.map((event) => event.eventId)
    );
    expect(afterRestart.slice(beforeRestart.length)).toEqual([
      expect.objectContaining({
        type: "failure.attempt.recorded",
        data: expect.objectContaining({
          scope: "resident",
          operation: "launcher.available",
          status: "failed"
        })
      })
    ]);
    await restarted.shutdown();
  });

  it("reschedules an accepted Git retry after a nine-minute prior-run fence settles", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-git-retry-fence-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
    await storage.createProject(state);
    const clock = { value: Date.parse("2026-09-22T00:00:00.000Z") };
    const originalSaveState = storage.saveState.bind(storage);
    let releasePriorRun!: () => void;
    const priorRunGate = new Promise<void>((resolve) => { releasePriorRun = resolve; });
    let priorRunBlocked!: () => void;
    const priorRunIsBlocked = new Promise<void>((resolve) => { priorRunBlocked = resolve; });
    let blockedSaveReturned!: () => void;
    const blockedSaveDidReturn = new Promise<void>((resolve) => { blockedSaveReturned = resolve; });
    let blocked = false;
    const saveSpy = vi.spyOn(storage, "saveState").mockImplementation(async (current) => {
      await originalSaveState(current);
      if (!blocked && current.phase === "git:waiting_for_github") {
        blocked = true;
        priorRunBlocked();
        await priorRunGate;
        blockedSaveReturned();
      }
    });
    let sessionBeginCount = 0;
    const coordinator = new CollaborationRuntimeCoordinator({
      storage,
      serviceId: "git-retry-fence-test",
      hostId: "host-test",
      leaseDurationMs: 60 * 60_000,
      now: () => clock.value,
      gitFactory: (options) => {
        const base = happyGitFake(options, []);
        return {
          ...base,
          async sessionBegin(execution, ownershipEpoch, input) {
            sessionBeginCount += 1;
            if (sessionBeginCount === 1) {
              throw new GitHubAuthorizationError(401, "fixture authorization expired");
            }
            return base.sessionBegin(execution, ownershipEpoch, input);
          }
        };
      },
      residentLauncher: {
        async open() {
          return {
            async submit() { return { handoff: "fixture delivery" }; },
            async pause() {},
            async resume() {},
            async close() {}
          };
        }
      }
    });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    await coordinator.createProject(state, { enabled: true, provider: "github" });
    await priorRunIsBlocked;

    await coordinator.retryInitialization(state);
    const timeline = state.gitRetryScheduling?.at(-1);
    expect(timeline).toMatchObject({
      attempt: 2,
      retryAcceptedAt: { projectId: state.id },
      gitReadyPersistedAt: {
        waitingFor: {
          kind: "prior-project-run",
          reason: expect.stringContaining("scheduler fence"),
          deadlineAt: "2026-09-22T00:00:05.000Z"
        }
      }
    });
    expect(timeline?.priorRunSettledAt).toBeUndefined();
    expect(timeline?.scheduleEnqueuedAt).toBeUndefined();

    clock.value += 9 * 60_000;
    expect(clock.value - Date.parse(timeline!.gitReadyPersistedAt!.at)).toBe(9 * 60_000);
    releasePriorRun();
    await blockedSaveDidReturn;
    await waitFor(() => state.gitRetryScheduling?.at(-1)?.scheduleEnqueuedAt !== undefined);
    const completedTimeline = state.gitRetryScheduling!.at(-1)!;
    expect(completedTimeline).toMatchObject({
      priorRunSettledAt: { waitingFor: { kind: "scheduler" } },
      scheduleEnqueuedAt: { waitingFor: { kind: "main-resident" } }
    });
    expect(
      Date.parse(completedTimeline.priorRunSettledAt!.at) -
      Date.parse(completedTimeline.gitReadyPersistedAt!.at)
    ).toBe(9 * 60_000);
    expect(
      Date.parse(completedTimeline.scheduleEnqueuedAt!.at) -
      Date.parse(completedTimeline.priorRunSettledAt!.at)
    ).toBeLessThanOrEqual(5_000);

    await coordinator.shutdown();
    saveSpy.mockRestore();
  });

  it("records the Main resident-open boundary for a no-fence Git retry", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-git-retry-main-open-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_cccccccccccccccccccccccccccccccc");
    const main = state.orchestration.agents.find((agent) => agent.name === "main")!;
    state.orchestration = {
      ...state.orchestration,
      agents: [main],
      collaborations: [],
      input: { source: "input", target: "main" },
      routes: { main: [{ target: "finish", kind: "weak" }] },
      decisionPlans: { main: "Finish after the retry." },
      termination: { agent: "main", condition: "Main confirms completion" }
    };
    state.agents = { main: state.agents.main! };
    state.runCounts = { main: 0 };
    state.tokenUsage.byAgent = { main: state.tokenUsage.byAgent.main! };
    await storage.createProject(state);
    const coordinator = new CollaborationRuntimeCoordinator({
      storage,
      serviceId: "git-retry-main-open-test",
      hostId: "host-test",
      leaseDurationMs: 5_000,
      gitFactory: (options) => initializationFake(options, []),
      residentLauncher: {
        async open() {
          throw new Error("Main routing uses decideRoute in this fixture");
        },
        async decideRoute(input) {
          await input.open.onOpened?.();
          return {
            targetNodeId: "finish",
            decisionRequestId: "finish-after-main-open",
            output: "Main opened after retry"
          };
        }
      }
    });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    await coordinator.createProject(state, { enabled: true, provider: "github" });
    await coordinator.retryInitialization(state);
    await waitFor(() => state.gitRetryScheduling?.at(-1)?.mainResidentOpenedAt !== undefined);

    const timeline = state.gitRetryScheduling!.at(-1)!;
    expect(timeline).toMatchObject({
      retryAcceptedAt: { projectId: state.id },
      gitReadyPersistedAt: { waitingFor: { kind: "scheduler" } },
      priorRunSettledAt: { waitingFor: { kind: "scheduler" } },
      scheduleEnqueuedAt: { waitingFor: { kind: "main-resident" } },
      mainResidentOpenedAt: {
        invocationId: expect.stringMatching(/^inv_/),
        epoch: 1,
        epochKind: "coordinator",
        waitingFor: { kind: "none" }
      }
    });
    expect(
      Date.parse(timeline.scheduleEnqueuedAt!.at) -
      Date.parse(timeline.gitReadyPersistedAt!.at)
    ).toBeLessThanOrEqual(5_000);
    await coordinator.shutdown();
  });

  it("derives bounded GitHub-safe repository names from title and project id", () => {
    const name = safeRepositoryName(
      "  ../危险 Project 🔬 with spaces and a very very long title ".repeat(5),
      "prj_0123456789abcdef0123456789abcdef"
    );
    expect(name).toMatch(/^[a-z0-9][a-z0-9._-]*[a-z0-9]$/);
    expect(name).toMatch(/-6789abcdef$/);
    expect(name.length).toBeLessThanOrEqual(100);
    expect(name).not.toContain("..");
  });

  it("inherits artifact intent only from prior epochs of the same execution", () => {
    const event = (
      executionId: string,
      ownershipEpoch: number,
      marker: string,
      seq: number
    ): CollaborationEvent => ({
      eventId: `event-${marker}`,
      seq,
      projectId: "prj_artifact_lineage",
      executionId,
      ownershipEpoch,
      ts: new Date().toISOString(),
      type: "artifact.publication.staged",
      payload: { marker }
    });
    const inherited = inheritedArtifactPublicationIntents([
      event("execution-one", 1, "prior", 1),
      event("execution-one", 2, "current", 2),
      event("execution-one", 3, "future", 3),
      event("execution-two", 1, "other", 4)
    ], { id: "execution-one", ownershipEpoch: 2 });
    expect(inherited.map((item) => item.payload.marker)).toEqual([
      "prior",
      "current"
    ]);
  });

  it("replays explicit publication corrections only within the same execution lineage", () => {
    const event = (seq: number, executionId: string, ownershipEpoch: number, artifactPath: string,
      replacesPath?: string): CollaborationEvent => ({ seq, eventId: `publication-${seq}`,
        projectId: "prj_publication_correction", ts: new Date().toISOString(), executionId, ownershipEpoch,
        type: "artifact.publication.staged", payload: { path: artifactPath, ...(replacesPath ? { replacesPath } : {}) } });
    const events = [event(1, "owner", 1, "agent-memory/idea/Memory.md"),
      event(2, "owner", 1, "VERIFICATION.md"),
      event(3, "other", 2, "other.md", "agent-memory/idea/Memory.md"),
      event(4, "owner", 3, "future.md", "agent-memory/idea/Memory.md")];
    expect(inheritedArtifactPublicationIntents(events, { id: "owner", ownershipEpoch: 2 })
      .map((item) => item.payload.path)).toEqual(["agent-memory/idea/Memory.md", "VERIFICATION.md"]);
    events.push(event(5, "owner", 2, "VERIFICATION.md", "agent-memory/idea/Memory.md"));
    expect(inheritedArtifactPublicationIntents(events, { id: "owner", ownershipEpoch: 2 })
      .map((item) => item.payload.path)).toEqual(["VERIFICATION.md", "VERIFICATION.md"]);
  });

  it.each(["before-merge", "after-merge", "after-sync-failure"] as const)("records independent standalone B without replacing accepted A when queried %s", async phase => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-history-query-")); temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub()); await storage.initialize();
    const state = projectState("prj_73737373737373737373737373737373");
    state.orchestration.routes.idea = [{ target: "finish", kind: "strong" }];
    await storage.createProject(state);
    const order: string[] = [], observedResults: unknown[] = [];
    let currentPull: GitHubPullRequestFact | undefined;
    let originalPull: GitHubPullRequestFact | undefined;
    let currentHead = "b".repeat(40);
    let coordinator!: CollaborationRuntimeCoordinator;
    // The fake provider uses virtual commits. Keep the real storage binding
    // predicate, then resolve fixture bytes without pretending they are Git objects.
    vi.spyOn(storage, "validateGitArtifactRecord").mockImplementation(async (verification, record) => {
      const binding = (storage as unknown as {
        trustedGitArtifactBinding(state: ProjectState, record: ArtifactRecord): unknown;
      }).trustedGitArtifactBinding(verification, record);
      expect(binding, "current accepted PR must still authorize its exact artifact head").toBeDefined();
      expect(record.gitSource?.commitSha).toBe("c".repeat(40));
      const owner = verification.executions!.find(item => item.id === record.gitSource?.executionId)!;
      return storage.resolveExecutionArtifactCandidate(state.id, owner, record.path);
    });
    coordinator = new CollaborationRuntimeCoordinator({ storage, serviceId: "history-query", hostId: "host-test",
      leaseDurationMs: 5_000, gitFactory: options => {
        const git = happyGitFake(options, order);
        const create = git.createPullRequest.bind(git), push = git.checkpointAndPush.bind(git);
        if (phase === "after-sync-failure") {
          const merge = git.mergePullRequest.bind(git), observe = git.observePullRequest!.bind(git);
          const synchronize = git.reconcileMergedPullRequest!.bind(git);
          let failed = false;
          git.mergePullRequest = async request => {
            const result = await merge(request);
            if (!failed && request.expectedHead === "c".repeat(40)) {
              failed = true;
              throw new Error("fixture TLS fetch failed after the second PR merged remotely");
            }
            return result;
          };
          git.observePullRequest = async request => {
            const { localSynchronization: _sync, ...providerFact } = await observe(request) as SynchronizedPullRequestFact;
            return providerFact;
          };
          git.reconcileMergedPullRequest = async request => {
            await coordinator.database().operationsForProject(state.id).assertExecutionOwnership({ projectId: state.id,
              executionId: request.execution.id, ownershipEpoch: request.ownershipEpoch,
              expectedBranch: request.execution.executionBranch, operation: "provider.reconcile_merged",
              providerNumber: request.providerNumber, expectedHeadSha: request.expectedHead,
              expectedBase: request.expectedBase, expectedMergeCommitSha: request.expectedMergeCommitSha });
            const result = await synchronize(request);
            coordinator.database().recordMergedSynchronization({ projectId: state.id, executionId: request.execution.id,
              ownershipEpoch: request.ownershipEpoch, providerNumber: request.providerNumber,
              expectedHead: request.expectedHead, expectedBase: request.expectedBase,
              expectedMergeCommitSha: result.mergeCommitSha!, synchronization: result.localSynchronization });
            return result;
          };
        }
        git.createPullRequest = async request => { currentPull = await create(request); return currentPull; };
        git.checkpointAndPush = async request => {
          const result = await push(request);
          return { ...result, checkpoint: { ...result.checkpoint, head: currentHead, commitSha: currentHead },
            ...(result.remote ? { remote: { ...result.remote, sha: currentHead } } : {}) };
        };
        git.observeExecutionWorktree = async execution => ({ projectId: state.id, executionId: execution.id,
          ownershipEpoch: execution.ownershipEpoch, branch: execution.executionBranch, worktreePath: execution.worktreePath,
          head: currentHead, retained: true, observedAt: new Date().toISOString(), pendingPaths: [] });
        return git;
      }, residentLauncher: {
        async open(input) {
          return { async submit(turn) {
            expect(turn.inputId).not.toMatch(/^agent-(delivery|publication)-repair:/);
            await fs.writeFile(path.join(input.request.workspacePath, "VERIFICATION.md"), "Current delivery B\n");
            const authority = await input.controlAuthorityFactory!({ request: input.request, turn });
            const actions: ControlActionEnvelope[] = [];
            const call = async (action: ControlAction, callId = `history-query-${actions.length}`) => {
              const envelope: ControlActionEnvelope = { projectId: state.id, agent: "idea", invocationId: turn.invocationId,
                callId, stateVersion: authority.control.stateVersion,
                capabilityHash: authority.control.capabilityHash, receivedAt: new Date().toISOString(), action };
              await authority.revalidate(envelope, actions); actions.push(envelope);
              const result = action.tool === "finish_task" || action.tool === "publish_artifact" ? undefined : await authority.execute!(envelope);
              observedResults.push(result); return result;
            };
            const queryHistory = async () => {
              const old = await call({ tool: "github_get_pr", providerNumber: originalPull!.providerNumber }) as GitHubPullRequestFact;
              expect(old).toMatchObject({ id: originalPull!.id, headSha: "b".repeat(40), status: "merged" });
              // A keeps its original identity; B is a separately registered delivery.
              const projection = coordinator.database().projectState(state.id);
              expect(projection.pullRequests).toEqual([
                expect.objectContaining({ id: originalPull!.id, headSha: "b".repeat(40), status: "merged" })
              ]);
              expect(projection.additionalPullRequests).toEqual([
                expect.objectContaining({ id: currentPull!.id, headSha: "c".repeat(40),
                  status: phase === "before-merge" ? "open" : "merged", ownershipEpoch: 1,
                  originalPullRequestId: originalPull!.id })
              ]);
            };
            await call({ tool: "git_push", reason: "Agent publishes A" });
            originalPull = await call({ tool: "github_create_pr", base: "main", title: "Original A", body: "Original delivery" }) as GitHubPullRequestFact;
            await call({ tool: "github_merge_pr", providerNumber: originalPull.providerNumber, reason: "Agent integrates A" });
            currentHead = "c".repeat(40);
            await call({ tool: "git_push", reason: "Agent publishes independently committed B" });
            expect(coordinator.database().latestAgentGitFacts(state.id, input.request.executionContext!.executionId!, 1)?.merged).toBeUndefined();
            await call({ tool: "github_create_pr", base: "main", title: "Current B", body: "Current delivery" });
            if (phase === "before-merge") await queryHistory();
            const mergeB: ControlAction = { tool: "github_merge_pr", providerNumber: currentPull!.providerNumber, reason: "Agent integrates B" };
            if (phase === "after-sync-failure") {
              await expect(call(mergeB, "merge-current-b")).rejects.toThrow("TLS fetch failed");
              await call({ tool: "github_get_pr", providerNumber: currentPull!.providerNumber });
              await call(mergeB, "merge-current-b");
            } else await call(mergeB);
            if (phase !== "before-merge") await queryHistory();
            await call({ tool: "publish_artifact", path: "VERIFICATION.md", title: "Current B evidence", kind: "report", description: "Agent-chosen B file" });
            await call({ tool: "finish_task", summary: "Current B delivered; historical A query returned truthfully" });
            return { handoff: "Current B delivered", controlActions: actions };
          }, async pause() {}, async resume() {}, async close() {} };
        }, async decideRoute(input) { return agentFixtureMainDecision(input, { targetNodeId: "finish",
          decisionRequestId: "history-query-final", output: "Main verified current B" }); }
      } });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    try {
      await coordinator.createProject(state, { enabled: true, provider: "github" });
      await waitFor(() => state.status === "completed" || ["paused", "retrying"].includes(state.status));
      expect(state.status, state.lastError).toBe("completed");
      expect(state.artifacts).toEqual([expect.objectContaining({ path: "VERIFICATION.md",
        gitSource: expect.objectContaining({ commitSha: "c".repeat(40), pullRequestId: currentPull!.id }) })]);
      const facts = coordinator.database().latestAgentGitFacts(state.id, state.executions![0].id, 1)!;
      expect(facts.pushedHeadSha).toBe("c".repeat(40)); expect(facts.merged?.headSha).toBe("c".repeat(40));
      expect(observedResults).toContainEqual(expect.objectContaining({ id: originalPull!.id, headSha: "b".repeat(40) }));
      expect(order.filter(item => item === "merge:idea")).toHaveLength(2);
      expect(coordinator.database().eventsAfter(state.id, 0, 10_000).filter(item => item.type === "execution.mechanism_repair.requested")).toHaveLength(0);
    } finally { await coordinator.shutdown(); }
  });

  it.each([true, false])("keeps a rejected publication pending until its original Agent explicitly corrects it: %s", async (correct) => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-publication-repair-")); temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub()); await storage.initialize();
    const state = projectState("prj_78787878787878787878787878787878");
    state.agents.idea.sessionPersistence = false;
    state.orchestration.routes.idea = [{ target: "finish", kind: "strong" }];
    await storage.createProject(state);
    const order: string[] = []; let opens = 0; let repairTurns = 0;
    const invalidPath = "agent-memory/idea/Memory.md";
    vi.spyOn(storage, "validateGitArtifactRecord").mockImplementation(async (verification, record) => {
      if (record.path === invalidPath || record.path === "missing-from-commit.md") {
        throw Object.assign(new Error("Git artifact is not a regular file in its accepted commit"), { code: "ENOENT" });
      }
      expect(record.path).toBe("VERIFICATION.md"); expect(record.gitSource?.commitSha).toBe("b".repeat(40));
      const owner = verification.executions!.find((execution) => execution.id === record.gitSource?.executionId)!;
      return storage.resolveExecutionArtifactCandidate(state.id, owner, record.path);
    });
    let coordinator!: CollaborationRuntimeCoordinator;
    coordinator = new CollaborationRuntimeCoordinator({ storage, serviceId: "publication-repair", hostId: "host-test",
      leaseDurationMs: 5_000, harnessRecoveryDelayMs: () => 60_000, gitFactory: (options) => happyGitFake(options, order), residentLauncher: {
        async open(input) {
          opens += 1;
          return { async submit(turn) {
            const executionId = input.request.executionContext!.executionId!;
            if (turn.inputId.startsWith("agent-publication-repair:")) {
              repairTurns += 1;
              expect(turn.prompt).toContain(invalidPath); expect(turn.prompt).toContain("replacesPath=");
              expect(turn.prompt).toContain("retained session");
              if (!correct) return { threadId: "original-worker-session", handoff: "Unable to correct the publication" };
              const fresh = await input.turnRequestFactory({ baseRequest: input.request, turn });
              expect(fresh.request.resumeThreadId).toBe("original-worker-session");
              const authority = await input.controlAuthorityFactory!({ request: fresh.request, turn });
              const service = new ControlActionService({ projectId: state.id, agent: "idea", invocationId: turn.invocationId,
                stateVersion: authority.control.stateVersion, capability: authority.control.capability,
                capabilityHash: authority.control.capabilityHash, stagingPath: authority.control.stagingPath,
                revalidate: authority.revalidate });
              const publish: ControlAction = { tool: "publish_artifact", path: "VERIFICATION.md",
                title: "Correct report", kind: "report", description: "Agent-selected committed evidence", replacesPath: invalidPath };
              await expect(service.stage(authority.control.capability, "foreign", { ...publish, replacesPath: "someone-else.md" }))
                .rejects.toThrow("does not belong to this execution");
              await expect(service.stage(authority.control.capability, "internal", { ...publish, path: invalidPath }))
                .rejects.toThrow("Internal Agent memory");
              await fs.writeFile(path.join(input.request.workspacePath, "missing-from-commit.md"), "mutable only");
              await expect(service.stage(authority.control.capability, "uncommitted", { ...publish, path: "missing-from-commit.md" }))
                .rejects.toThrow();
              const envelope = await service.stage(authority.control.capability, "correct-publication", publish);
              const repeated = await service.stage(authority.control.capability, "repeat-correction", publish);
              expect(repeated).toEqual(envelope);
              return { threadId: "original-worker-session", handoff: "I corrected my pending publication", controlActions: [envelope] };
            }
            await fs.writeFile(path.join(input.request.workspacePath, "VERIFICATION.md"), "Committed verification evidence");
            const fresh = await input.turnRequestFactory({ baseRequest: input.request, turn });
            await fresh.request.onDurableSessionStarted?.({ schemaVersion: 1, harnessId: "codex", adapterVersion: "test",
              nativeId: "original-worker-session", generation: 0, durable: true, createdAt: new Date().toISOString() }, "original-worker-session");
            // Reproduce the legacy accepted intent plus a later good intent.
            // The later file alone must not let the system discard the first.
            for (const artifactPath of [invalidPath, "VERIFICATION.md"]) coordinator.database().appendEvent({
              projectId: state.id, executionId, ownershipEpoch: 1, agentId: "idea", invocationId: turn.invocationId,
              requestId: `legacy-publication:${artifactPath}`, type: "artifact.publication.staged",
              payload: { path: artifactPath, title: "Legacy publication", kind: "report", description: "Original Agent request" } });
            return agentFixtureDelivery(input, turn, { threadId: "original-worker-session", handoff: "Original work complete" }, coordinator);
          }, async pause() {}, async resume() {}, async close() {} };
        }, async decideRoute(input) { return agentFixtureMainDecision(input, {
          targetNodeId: "finish", decisionRequestId: "main-accepts-publication", output: "Main accepts the Agent's corrected report" }); }
      } });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    try {
      await coordinator.createProject(state, { enabled: true, provider: "github" });
      await waitFor(() => state.status === "completed" || ["paused", "retrying"].includes(state.status));
      expect(opens).toBe(1); expect(repairTurns).toBe(correct ? 1 : 2);
      expect(order.filter((item) => item === "merge:idea")).toHaveLength(1);
      if (correct) {
        expect(state.status, state.lastError).toBe("completed");
        expect(state.artifacts).toHaveLength(1); expect(state.artifacts![0].path).toBe("VERIFICATION.md");
      } else {
        expect(state.status).toBe(hasUserWorkflowPause(state) ? "paused" : "retrying"); expect(state.lastError).toContain(invalidPath);
        expect(state.artifacts ?? []).toHaveLength(0);
        expect(state.executions![0].status).toBe("merged");
      }
      const events = coordinator.database().eventsAfter(state.id, 0, 10_000);
      expect(events.find((event) => event.payload.path === invalidPath && event.type === "artifact.publication.staged"))
        .toBeDefined();
      expect(events.filter((event) => event.payload.replacesPath === invalidPath)).toHaveLength(correct ? 1 : 0);
    } finally { await coordinator.shutdown(); }
  });

  it("finds the mirrored collaboration cursor across more than 125k file events", () => {
    const events = Array.from({ length: 130_005 }, (_, index) => ({
      data: { collaborationSeq: index + 1 }
    }));
    events.push({ data: { collaborationSeq: Number.NaN } });
    expect(maximumMirroredCollaborationSeq(events, 17)).toBe(130_005);
  });

  it("keeps the current round, peer work, and dependency facts after fifty historical tasks", () => {
    const historical = Array.from({ length: 50 }, (_, index) => ({
      id: `task-old-${String(index).padStart(2, "0")}`,
      nodeRunId: "node-long-running-group",
      groupRunId: "group-long-running",
      assignment: `Historical assignment ${index}`,
      assigneeAgentId: index % 2 === 0 ? "idea" : "execution",
      dependencyTaskIds: [],
      queueOrdinal: index + 1,
      status: "succeeded" as const
    }));
    const tasks = [
      ...historical,
      {
        id: "task-current-round",
        nodeRunId: "node-long-running-group",
        groupRunId: "group-long-running",
        assignment: "Current delivery",
        assigneeAgentId: "idea",
        dependencyTaskIds: ["task-old-00"],
        queueOrdinal: 51,
        status: "working" as const
      },
      {
        id: "task-current-peer",
        nodeRunId: "node-long-running-group",
        groupRunId: "group-long-running",
        assignment: "Current peer delivery",
        assigneeAgentId: "execution",
        dependencyTaskIds: [],
        queueOrdinal: 52,
        status: "assigned" as const
      }
    ];

    const selected = groupAssignmentContextTasks(tasks, "task-current-round");
    expect(selected).toHaveLength(50);
    expect(selected.map((task) => task.id)).toEqual(expect.arrayContaining([
      "task-old-00",
      "task-current-round",
      "task-current-peer"
    ]));
    expect(selected.map((task) => task.id)).not.toContain("task-old-01");
    expect(selected.at(-1)?.id).toBe("task-current-peer");

    const fullCurrentBatch = Array.from({ length: 50 }, (_, index) => ({
      id: `task-live-${String(index).padStart(2, "0")}`,
      nodeRunId: "node-full-current-batch",
      groupRunId: "group-full-current-batch",
      assignment: `Live peer assignment ${index}`,
      assigneeAgentId: index % 2 === 0 ? "idea" : "execution",
      dependencyTaskIds: index === 0 ? ["task-prior-dependency"] : [],
      queueOrdinal: index + 2,
      status: index === 0 ? "working" as const : "assigned" as const
    }));
    const selectedFullBatch = groupAssignmentContextTasks([
      {
        id: "task-prior-dependency",
        nodeRunId: "node-full-current-batch",
        groupRunId: "group-full-current-batch",
        assignment: "Prior completed dependency",
        assigneeAgentId: "idea",
        dependencyTaskIds: [],
        queueOrdinal: 1,
        status: "succeeded" as const
      },
      ...fullCurrentBatch
    ], "task-live-00");
    expect(selectedFullBatch).toHaveLength(50);
    expect(selectedFullBatch.map((task) => task.id)).not.toContain("task-prior-dependency");
    expect(selectedFullBatch.map((task) => task.id)).toEqual(
      fullCurrentBatch.map((task) => task.id)
    );
  });

  it("keeps the current coordinator's management memory ahead of global bounds", () => {
    const commitSha = "9".repeat(40);
    const entries = Array.from({ length: 40 }, (_, index) => ({
      agentId: `agent-${String(index).padStart(2, "0")}`,
      path: `agent-memory/agent-${String(index).padStart(2, "0")}/Memory.md`,
      content: `OTHER-${index}-` + "x".repeat(2_100)
    }));
    entries.push({
      agentId: "zz-current-coordinator",
      path: "agent-memory/zz-current-coordinator/Memory.md",
      content: "CURRENT-COORDINATOR-MEMORY-" + "y".repeat(2_100)
    });
    const document = managementMemoryDocument("project-many-memories", {
      branch: "management/memory",
      commitSha,
      provenance: `OpenFARS management memory snapshot from management/memory@${commitSha}`,
      entries,
      observedAt: new Date().toISOString()
    }, "zz-current-coordinator");
    expect(document).toContain("CURRENT-COORDINATOR-MEMORY");
    expect(document).toContain(
      `management/memory@${commitSha}:agent-memory/zz-current-coordinator/Memory.md`
    );
    expect(document.indexOf("zz-current-coordinator")).toBeLessThan(
      document.indexOf("agent-00")
    );
    expect(document).not.toContain("OTHER-31-");
    expect(document.length).toBeLessThan(25_000);
  });

  it.each([[1, false], [2, false], [1, true], [2, true]] as const)("publishes an integrity-checkable root artifact from its original intent (epoch %s, additional %s)", async (epoch, additional) => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-artifact-epoch-recovery-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_20202020202020202020202020202020");
    await storage.createProject(state);
    const projectRoot = storage.projectDir(state.id);
    const repositoryPath = path.join(projectRoot, "repository");
    const executionId = "execution-artifact-recovery";
    const nodeRunId = "node-artifact-recovery";
    const taskId = "task-artifact-recovery";
    const worktreePath = path.join(projectRoot, "git-worktrees", executionId);
    await fs.mkdir(path.dirname(worktreePath), { recursive: true });
    await gitCommand(projectRoot, ["init", "-b", "main", "repository"]);
    await gitCommand(repositoryPath, ["config", "user.name", "OpenFARS Test"]);
    await gitCommand(repositoryPath, ["config", "user.email", "openfars@example.invalid"]);
    await fs.writeFile(path.join(repositoryPath, "README.md"), "# Fixture\n");
    await gitCommand(repositoryPath, ["add", "README.md"]);
    await gitCommand(repositoryPath, ["commit", "-m", "initial"]);
    await gitCommand(repositoryPath, [
      "worktree",
      "add",
      "-b",
      `executions/${executionId}`,
      worktreePath
    ]);
    await fs.writeFile(path.join(worktreePath, "accepted.md"), "# Accepted after recovery\n");
    await gitCommand(worktreePath, ["add", "accepted.md"]);
    await gitCommand(worktreePath, ["commit", "-m", "accepted artifact"]);
    const commitSha = await gitCommand(worktreePath, ["rev-parse", "HEAD"]);
    state.git = {
      enabled: true,
      status: "ready",
      provider: "github",
      repository: {
        owner: "fixture-owner",
        name: "artifact-epoch-recovery",
        htmlUrl: "https://github.example/artifact-epoch-recovery",
        private: true,
        defaultBranch: "main",
        localPath: repositoryPath
      }
    };
    await storage.saveState(state);

    const databasePath = path.join(path.dirname(storage.projectsDir()), "collaboration-state.sqlite");
    const database = CollaborationStateDatabase.open({
      databasePath,
      serviceId: "artifact-epoch-recovery-test",
      hostId: "host-test",
      topology: "single-host",
      leaseDurationMs: 5_000
    });
    database.createProject({
      projectId: state.id,
      workflowRevision: 1,
      workflowSnapshot: state.orchestration,
      git: state.git,
      workerCapacity: 1,
      managementCapacity: 1,
      requestId: `create-${state.id}`
    });
    database.activateNode({
      projectId: state.id,
      nodeRunId,
      node: { kind: "agent", nodeId: "idea", agentId: "idea" },
      activationRequestId: "activate-artifact-recovery",
      inputSnapshotRef: "fixture:artifact-recovery",
      optionalTask: "Produce one accepted artifact",
      activatedByAgentId: "main",
      workflowRevision: 1,
      requestId: "activate-artifact-recovery"
    });
    database.startStandaloneExecution({
      projectId: state.id,
      nodeRunId,
      taskId,
      executionId,
      agentId: "idea",
      assignment: "Produce one accepted artifact",
      executionBranch: `executions/${executionId}`,
      worktreePath,
      invocationId: "inv_artifact_epoch_one",
      requestId: "start-artifact-recovery"
    });
    database.appendEvent({
      projectId: state.id,
      requestId: "artifact-intent-epoch-one",
      workflowRevision: 1,
      nodeId: "idea",
      nodeRunId,
      agentId: "idea",
      taskId,
      executionId,
      invocationId: "inv_artifact_epoch_one",
      ownershipEpoch: 1,
      type: "artifact.publication.staged",
      payload: {
        path: "accepted.md",
        title: "Recovered accepted artifact",
        kind: "document",
        description: "Publication intent survived stop confirmation",
        callId: "publish-before-restart"
      }
    });
    let recovered = database.projectState(state.id).executions.find(item => item.id === executionId)!;
    if (epoch === 2) {
      database.requestExecutionStop({
        projectId: state.id,
        executionId,
        ownershipEpoch: 1,
        reason: "service_restart_reconcile",
        requestId: "stop-artifact-recovery"
      });
      database.confirmExecutionStopped({
        projectId: state.id,
        executionId,
        ownershipEpoch: 1,
        stopped: true,
        evidence: { source: "fixture" },
        requestId: "confirm-artifact-recovery"
      });
      recovered = database.recoverStandaloneExecution({
        projectId: state.id,
        executionId,
        predecessorOwnershipEpoch: 1,
        invocationId: "inv_artifact_epoch_two",
        requestId: "recover-artifact-execution"
      }).execution;
    }
    expect(recovered.ownershipEpoch).toBe(epoch);
    database.observePullRequest({
      projectId: state.id,
      executionId,
      ownershipEpoch: epoch,
      requestId: "merge-artifact-recovery",
      pullRequest: {
        id: "pull-artifact-recovery",
        providerNumber: 20,
        htmlUrl: "https://github.example/pulls/20",
        head: `executions/${executionId}`,
        base: "main",
        ownerExecutionId: executionId,
        status: "merged",
        headSha: commitSha,
        mergeCommitSha: commitSha,
        observedAt: new Date().toISOString()
      }
    });
    const projection = database.projectState(state.id);
    const mergedPull = projection.pullRequests.find(
      (item) => item.ownerExecutionId === executionId
    )!;
    database.relinquishWriterLease();
    database.close();
    state.workflowRevision = projection.workflowRevision;
    state.orchestration = structuredClone(
      projection.workflowSnapshot as ProjectState["orchestration"]
    );
    state.nodeRuns = structuredClone(projection.nodeRuns);
    state.executions = structuredClone(projection.executions);
    state.pullRequests = structuredClone(projection.pullRequests);

    const coordinator = new CollaborationRuntimeCoordinator({
      storage,
      databasePath,
      serviceId: "artifact-epoch-recovery-test",
      hostId: "host-test",
      leaseDurationMs: 5_000
    });
    const mutableCandidate = vi.spyOn(storage, "resolveExecutionArtifactCandidate")
      .mockRejectedValue(new Error("merged artifact publication must not read the worktree"));
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    const internal = coordinator as unknown as {
      commitMergedExecutionArtifacts(
        current: ProjectState,
        execution: typeof recovered,
        pull: typeof mergedPull
      ): Promise<void>;
    };
    await internal.commitMergedExecutionArtifacts(state, recovered, mergedPull);
    await internal.commitMergedExecutionArtifacts(state, recovered, mergedPull);

    expect(state.artifacts).toEqual([
      expect.objectContaining({
        id: expect.stringMatching(/^artifact_[a-f0-9]{64}$/),
        invocationId: "inv_artifact_epoch_one",
        sha256: createHash("sha256").update("# Accepted after recovery\n").digest("hex"),
        gitSource: {
          executionId,
          ownershipEpoch: epoch,
          worktreePath,
          commitSha,
          pullRequestId: "pull-artifact-recovery",
          acceptedBase: "main"
        }
      })
    ]);
    expect(mutableCandidate).not.toHaveBeenCalled();
    expect((await storage.readEvents(state.id, 0, 10_000)).filter((event) =>
      event.type === "artifact.published"
    )).toHaveLength(1);
    expect((await storage.readWorkspaceArtifact(state.id, "idea", "accepted.md"))
      .content.toString("utf8")).toBe("# Accepted after recovery\n");
    await storage.saveState(state);
    await fs.writeFile(path.join(worktreePath, "accepted.md"), "mutable checkout changed after publication\n");
    const published = await storage.resolvePublishedArtifactRecord(state.id, state.artifacts![0]!);
    expect((await fs.readFile(published.sourcePath)).toString("utf8")).toBe("# Accepted after recovery\n");
    const originalArtifact = state.artifacts![0]!;
    if (additional) {
      await fs.writeFile(path.join(worktreePath, "accepted.md"), "# Independent exact B\n");
      await gitCommand(worktreePath, ["add", "accepted.md"]);
      await gitCommand(worktreePath, ["commit", "-m", "independent B"]);
      const b = await gitCommand(worktreePath, ["rev-parse", "HEAD"]);
      const extra = { ...mergedPull, id: "independent-b", providerNumber: 21, headSha: b, mergeCommitSha: b,
        observedAt: new Date().toISOString() };
      coordinator.database().appendEvent({ projectId: state.id, executionId, ownershipEpoch: epoch,
        invocationId: "original-agent-b", type: "execution.agent_git.fact",
        payload: { facts: { pushedHeadSha: b, pullRequest: extra } } });
      coordinator.database().observeStandaloneDeliveryPullRequest({ projectId: state.id, executionId,
        ownershipEpoch: epoch, pullRequest: extra });
      await internal.commitMergedExecutionArtifacts(state, recovered, extra);
      state.additionalPullRequests = structuredClone(coordinator.database().projectState(state.id).additionalPullRequests);
      await storage.saveState(state);
      expect(state.artifacts).toHaveLength(2);
      const current = state.artifacts!.find(item => item.gitSource?.commitSha === b)!;
      for (const [record, text] of [[originalArtifact, "# Accepted after recovery\n"], [current, "# Independent exact B\n"]] as const) {
        const exact = await storage.resolvePublishedArtifactRecord(state.id, record);
        expect((await fs.readFile(exact.sourcePath)).toString("utf8")).toBe(text);
      }
      expect(coordinator.database().projectState(state.id).pullRequests).toEqual([mergedPull]);
      await expect(storage.validateGitArtifactRecord(state, { ...current,
        gitSource: { ...current.gitSource!, ownershipEpoch: epoch + 1 } })).rejects.toThrow(/accepted execution/);
      // The integrity and historical-compatibility checks below still target A.
      state.artifacts = [originalArtifact];
    }
    const legacy = { ...state.artifacts![0]! };
    delete legacy.sha256;
    state.artifacts = [legacy];
    await storage.saveState(state);
    await internal.commitMergedExecutionArtifacts(state, recovered, mergedPull);
    expect(state.artifacts).toEqual([legacy]);
    // Older accepted Git publications keep their commit/blob identity even
    // without the additional SHA-256 field; reading never rewrites history.
    const historical = await storage.resolvePublishedArtifactRecord(state.id, legacy);
    expect((await fs.readFile(historical.sourcePath)).toString("utf8")).toBe("# Accepted after recovery\n");
    expect((await storage.loadState(state.id)).artifacts).toEqual([legacy]);
    await expect(storage.resolvePublishedArtifactRecord(state.id, { ...legacy, sha256: "0".repeat(64) }))
      .rejects.toThrow("changed after publication");
    await expect(storage.resolvePublishedArtifactRecord(state.id, { ...legacy, sha256: originalArtifact.sha256, size: legacy.size + 1 }))
      .rejects.toThrow("changed after publication");
    // Same-length cache tampering must still fail the accepted Git object check.
    await fs.chmod(historical.sourcePath, 0o600);
    await fs.writeFile(historical.sourcePath, "! Accepted after recovery\n");
    await expect(storage.resolvePublishedArtifactRecord(state.id, legacy))
      .rejects.toThrow("does not match its accepted object id");
    await coordinator.shutdown();
  });

  it("builds an exact closing invocation without discovering or materializing business resources", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-closing-builder-")); temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub()); await storage.initialize();
    const state = projectState("prj_25252525252525252525252525252526"); await storage.createProject(state);
    state.orchestration = { ...state.orchestration, schemaVersion: 3 } as never;
    state.agents.idea = { ...state.agents.idea, permission: "yolo", skills: ["project:unavailable"], autoSkills: ["/missing/SKILL.md"],
      mcpServers: [{ name: "unavailable", project: "unavailable" }], experimentMcp: true, webSearch: true };
    state.agentSessionIds = { idea: "retained-original" };
    const before = structuredClone(state), catalog = new SkillCatalog([]);
    const list = vi.spyOn(catalog, "list").mockRejectedValue(new Error("Business catalog must not be read"));
    const builder = new ProductionCollaborationExecutionInputBuilder(storage, catalog);
    const worktreeClosing = { kind: "bound-report-memory" as const, reportHeadSha: "a".repeat(40), paths: ["agent-memory/idea/Memory.md"],
      executionId: "old-execution", ownershipEpoch: 2, grantInvocationId: "original-leader", grantCallId: "close" };
    const request = await builder.build({ state, agentId: "idea", assignment: "Close my exact original Memory", invocationId: "inv_closing",
      inboxPath: path.join(root, "Inbox.md"), projectPath: storage.projectDir(state.id), worktreePath: path.join(root, "original-worktree"),
      runtimePath: path.join(root, "runtime"), worktreeClosing,
      executionContext: { role: "delivery", nodeRunId: "old-node", groupRunId: "old-group", executionId: "old-execution", ownershipEpoch: 2,
        executionWorktree: path.join(root, "original-worktree") } });
    expect(list).not.toHaveBeenCalled();
    expect(request).toMatchObject({ permission: "workspace", skillPaths: [], autoSkillPaths: [], availableSkillPaths: [],
      worktreeClosing, sessionContinuity: "strict", resumeThreadId: "retained-original" });
    expect(request.worktreeClosing).not.toBe(worktreeClosing);
    expect(request.worktreeClosing!.paths).not.toBe(worktreeClosing.paths);
    expect(request.toolCatalog).toBeUndefined();
    expect(state).toEqual(before);
  });

  it("provides Main discovery and applies chosen Worker resources without granting the whole directory", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-main-tool-directory-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_25252525252525252525252525252525");
    state.orchestration.allowMainReconfiguration = true;
    state.agents.main = { ...state.agents.main, skills: [], autoSkills: [], mcpServers: [] };
    state.agents.idea = { ...state.agents.idea, skills: [], autoSkills: [], mcpServers: [], permission: "workspace" };
    state.skillDefinitions = { check: { files: { "SKILL.md": "---\nname: check\ndescription: Verify fixed result\n---\nCheck the accepted evidence." } } };
    state.mcpDefinitions = { verify: { entrypoint: "server.js", files: { "server.js": "source-not-directory-metadata" }, envFrom: { TOKEN: "HOST_ONLY_SECRET" } } };
    await storage.createProject(state);
    const builder = new ProductionCollaborationExecutionInputBuilder(storage, new SkillCatalog([]));
    const common = { state, assignment: "Choose the appropriate resources", invocationId: "inv-directory", inboxPath: path.join(root, "Inbox.md"),
      projectPath: storage.projectDir(state.id), worktreePath: path.join(root, "workspace"), runtimePath: path.join(root, "runtime") };
    const main = await builder.build({ ...common, agentId: "main", executionContext: { nodeRunId: "root-main", role: "leader", coordinatorEpoch: 1 } });
    expect(main.toolCatalog?.skills).toEqual([expect.objectContaining({ reference: "project:check" })]);
    expect(main.toolCatalog?.mcps).toContainEqual(expect.objectContaining({ selection: { name: "verify", project: "verify" } }));
    expect(JSON.stringify(main.toolCatalog)).not.toContain("HOST_ONLY_SECRET");
    expect(main.skillPaths).toEqual([]);
    expect(main.project.agents.main.mcpServers).toEqual([]);
    const workerContext = { nodeRunId: "worker", taskId: "task", executionId: "execution", role: "delivery" as const, ownershipEpoch: 1, executionWorktree: common.worktreePath };
    const unselected = await builder.build({ ...common, agentId: "idea", executionContext: workerContext });
    expect(unselected.toolCatalog).toBeUndefined();
    expect(unselected.skillPaths).toEqual([]);
    state.agents.idea.skills = [main.toolCatalog!.skills[0]!.reference];
    state.agents.idea.mcpServers = [main.toolCatalog!.mcps.find(item => item.source === "project")!.selection];
    state.agents.idea.experimentMcp = main.toolCatalog!.experiments.selection.experimentMcp;
    const selected = await builder.build({ ...common, agentId: "idea", executionContext: workerContext });
    expect(selected.toolCatalog).toBeUndefined();
    expect(selected.permission).toBe("workspace");
    expect(selected.project.agents.idea).toMatchObject({ skills: ["project:check"], mcpServers: [{ name: "verify", project: "verify" }], experimentMcp: true });
    expect(await fs.readFile(selected.skillPaths[0]!, "utf8")).toContain("Check the accepted evidence.");
    state.orchestration.allowMainReconfiguration = false;
    expect((await builder.build({ ...common, agentId: "main", executionContext: { nodeRunId: "root-main", role: "leader", coordinatorEpoch: 1 } })).toolCatalog).toBeUndefined();
  });

  it("isolates durable sessions by collaboration role and ownership scope", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-collaboration-sessions-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_13131313131313131313131313131313");
    const fixedSkill = path.join(root, "configured-skills", "fixed", "SKILL.md");
    const automaticSkill = path.join(root, "configured-skills", "automatic", "SKILL.md");
    await Promise.all([
      fs.mkdir(path.dirname(fixedSkill), { recursive: true }),
      fs.mkdir(path.dirname(automaticSkill), { recursive: true })
    ]);
    await Promise.all([
      fs.writeFile(fixedSkill, "# Fixed coordination skill\n"),
      fs.writeFile(automaticSkill, "# Automatic coordination skill\n")
    ]);
    state.agents.idea = {
      ...state.agents.idea,
      skills: [fixedSkill],
      autoSkills: [automaticSkill],
      permission: "yolo"
    };
    state.agentSessionIds = {
      idea: "legacy-must-not-leak",
      "idea::collaboration:delivery:execution-one": "delivery-session",
      "idea::collaboration:leader:group-one": "leader-session"
    };
    await storage.createProject(state);
    const builder = new ProductionCollaborationExecutionInputBuilder(
      storage,
      new SkillCatalog([])
    );
    const common = {
      state,
      agentId: "idea",
      assignment: "scoped turn",
      invocationId: "inv-scoped",
      inboxPath: path.join(root, "Inbox.md"),
      projectPath: storage.projectDir(state.id),
      worktreePath: path.join(root, "workspace"),
      runtimePath: path.join(root, "runtime")
    };
    const delivery = await builder.build({
      ...common,
      executionContext: {
        nodeRunId: "node-one",
        taskId: "task-one",
        executionId: "execution-one",
        role: "delivery",
        ownershipEpoch: 1,
        executionWorktree: common.worktreePath
      }
    });
    const leader = await builder.build({
      ...common,
      executionContext: {
        nodeRunId: "node-group",
        groupRunId: "group-one",
        role: "leader",
        coordinatorEpoch: 1
      }
    });
    const nextDelivery = await builder.build({
      ...common,
      executionContext: {
        nodeRunId: "node-two",
        taskId: "task-two",
        executionId: "execution-two",
        role: "delivery",
        ownershipEpoch: 1,
        executionWorktree: common.worktreePath
      }
    });
    expect(delivery).toMatchObject({ permission: "yolo", resumeThreadId: "delivery-session" });
    expect(leader).toMatchObject({
      permission: "workspace",
      resumeThreadId: "leader-session",
      skillPaths: [fixedSkill],
      autoSkillPaths: [automaticSkill]
    });
    expect(nextDelivery.resumeThreadId).toBeUndefined();

    state.orchestration.schemaVersion = 3;
    await expect(builder.build({
      ...common,
      executionContext: delivery.executionContext!
    })).rejects.toThrow(/legacy scope-specific sessions/);
    state.agentSessionIds = { idea: "one-agent-session" };
    const scopedDelivery = await builder.build({
      ...common,
      executionContext: delivery.executionContext!
    });
    const scopedLeader = await builder.build({
      ...common,
      executionContext: leader.executionContext!
    });
    expect(scopedDelivery).toMatchObject({
      sessionContinuity: "strict", resumeThreadId: "one-agent-session"
    });
    expect(scopedLeader).toMatchObject({
      sessionContinuity: "strict", resumeThreadId: "one-agent-session"
    });
  });

  it.each([2, 3].flatMap(version => (["prepared", "received", "lost-publication", "long"] as const)
    .map(mode => ({ version, mode }))))("confirms root Main input only from exact native reception (v$version, $mode)", async ({ version, mode }) => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-root-main-input-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub()); await storage.initialize();
    const state = projectState("prj_16161616161616161616161616161616");
    state.orchestration = { ...state.orchestration, input: { source: "input", target: "main" },
      agents: state.orchestration.agents.filter(agent => agent.name === "main"),
      decisionPlans: { main: state.orchestration.decisionPlans.main! },
      routes: { main: [{ target: "finish", kind: "strong" }] },
      termination: { ...state.orchestration.termination, agent: "main", condition: "Main confirms completion" } };
    if (version === 3) state.orchestration = normalizeNewGitOrchestration(state.orchestration);
    state.agents = { main: state.agents.main };
    const message = mode === "long" ? `Original requirement ${"retain the original task. ".repeat(220)} Full original ending.`
      : "Keep the original checker and task; this is an engineering clarification.";
    state.userInputs.push({ id: "input-root-main", message, mode: "wait", status: "pending",
      createdAt: state.createdAt, targetMainInvocation: 1 });
    await storage.createProject(state);
    let receivedInvocation: string | undefined;
    const coordinator = new CollaborationRuntimeCoordinator({ storage, serviceId: "root-main-input", hostId: "host-test",
      leaseDurationMs: 5_000, gitFactory: options => ({ ...happyGitFake(options, []),
        async prepareAgentManagementWorkspace(agentId: string) {
          const directory = path.join(storage.projectDir(state.id), "git-worktrees", "agents", agentId);
          await fs.mkdir(directory, { recursive: true }); return directory;
        } }), residentLauncher: {
        async open() { throw new Error("Root Main must use its management turn"); },
        async decideRoute(input) {
          expect(input.turn.prompt).toContain(message);
          expect(await fs.readFile(input.open.inputs!.inboxPath, "utf8")).toContain(message);
          if (mode === "long") {
            const boundInput = `来源：user\n内容：${message}`;
            expect(input.turn.prompt).toContain(boundInput);
            expect(await fs.readFile(input.open.inputs!.inboxPath, "utf8")).toContain(boundInput);
          }
          const runtime = await input.open.turnRequestFactory({ baseRequest: input.open.request, turn: input.turn });
          const session = { schemaVersion: 1 as const, harnessId: state.agents.main.harness!, adapterVersion: "fixture-v1",
            nativeId: "root-main-native", generation: 0, durable: true, createdAt: state.createdAt };
          const observe = runtime.request.onNativeUserInput!;
          const event = { kind: "user.message", invocationId: input.turn.invocationId, harnessId: session.harnessId,
            eventId: "root-main-user", sourceType: "item.completed", message: input.turn.prompt };
          await observe(event, session); // A prepared request has no trusted opened Session.
          expect(state.userInputs[0].status).toBe("pending");
          await input.open.request.onResidentNativeOpened?.({ runtimePath: input.open.executionRuntimePath, session });
          expect(coordinator.database().latestAgentNativeSessionBinding(state.id, "main")?.invocationId).toBe(input.turn.invocationId);
          await observe(event);
          await observe({ ...event, invocationId: "another-turn" }, session);
          await observe({ ...event, harnessId: "wrong-harness" }, session);
          await observe(event, { ...session, generation: 1 });
          await observe({ ...event, message }, session); // The stable queued-input identity is missing.
          await observe({ ...event, message: input.turn.prompt.split(message).join(message.slice(0, -1)) }, session);
          expect(state.userInputs[0].status).toBe("pending");
          if (mode !== "prepared") {
            const save = mode === "lost-publication" ? vi.spyOn(storage, "saveState").mockRejectedValueOnce(new Error("Controlled input file publication loss")) : undefined;
            if (save) {
              await expect(observe(event, session)).rejects.toThrow("Controlled input file publication loss");
              save.mockRestore();
              expect(coordinator.database().eventsAfter(state.id, 0, 1000).filter(e => e.type === "user.input.delivered")).toHaveLength(1);
              state.userInputs[0] = { ...state.userInputs[0], status: "pending", deliveredAt: undefined, deliveredInvocationId: undefined };
              expect(JSON.parse(await fs.readFile(path.join(storage.projectDir(state.id), "state.json"), "utf8")).userInputs[0].status).toBe("pending");
            } else {
              await observe(event, session);
              await observe({ ...event, eventId: "duplicate-root-main-user" }, session);
              expect(state.userInputs[0]).toMatchObject({ status: "delivered", deliveredInvocationId: input.turn.invocationId });
              // Reception is independent of Main completing its formal decision.
              expect(state.mainInvocationSeq).toBe(0);
              expect(coordinator.database().eventsAfter(state.id, 0, 1000).some(e => e.type === "main.route.response.committed")).toBe(false);
            }
            receivedInvocation = input.turn.invocationId;
          }
          return agentFixtureMainDecision(input, { targetNodeId: "finish", decisionRequestId: "root-main-finish", output: "Main verified completion" });
        }
      } });
    try {
      if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
      await coordinator.initialize(); await coordinator.createProject(state, { enabled: true, provider: "github" });
      await waitFor(() => state.status === "completed" || Boolean(state.lastError));
      expect(state.lastError).toBeFalsy();
      expect(state.status).toBe("completed");
      expect(state.mainInvocationSeq).toBe(1);
      expect(state.userInputs[0].status).toBe(mode === "prepared" ? "pending" : "delivered");
      expect(state.userInputs[0].deliveredInvocationId).toBe(receivedInvocation);
      const receipts = coordinator.database().eventsAfter(state.id, 0, 1000).filter(e => e.type === "user.input.delivered");
      expect(receipts).toHaveLength(mode === "prepared" ? 0 : 1);
      expect(JSON.parse(await fs.readFile(path.join(storage.projectDir(state.id), "state.json"), "utf8")).userInputs[0].status)
        .toBe(mode === "prepared" ? "pending" : "delivered");
    } finally { await coordinator.shutdown(); }
  });

  it("handles a fenced Main intervention response and completed-project input reopen without legacy work", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-collaboration-user-main-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_14141414141414141414141414141414");
    state.orchestration = {
      ...state.orchestration,
      input: { source: "input", target: "main" },
      routes: { ...state.orchestration.routes, main: [{ target: "finish", kind: "strong" }] },
      termination: { agent: "main", condition: "Main confirms completion" },
      allowUserIntervention: true
    };
    await storage.createProject(state);
    const order: string[] = [];
    const prompts: string[] = [];
    let decisions = 0;
    const coordinator = new CollaborationRuntimeCoordinator({
      storage,
      serviceId: "user-main-test",
      hostId: "host-test",
      leaseDurationMs: 5_000,
      gitFactory: (options) => happyGitFake(options, order),
      residentLauncher: {
        async open() { throw new Error("Main management must not open a delivery resident"); },
        async decideRoute(input) {
          decisions += 1;
          prompts.push(input.turn.prompt);
          if (decisions === 3) {
            const runtime = await input.open.turnRequestFactory({ baseRequest: input.open.request, turn: input.turn });
            const session = { schemaVersion: 1 as const, harnessId: state.agents.main.harness!, adapterVersion: "fixture-v1",
              nativeId: "reopened-main-native", generation: 0, durable: true, createdAt: state.createdAt };
            await input.open.request.onResidentNativeOpened?.({ runtimePath: input.open.executionRuntimePath, session });
            await runtime.request.onNativeUserInput?.({ kind: "user.message", invocationId: input.turn.invocationId,
              harnessId: session.harnessId, eventId: "reopened-main-user", sourceType: "item.completed", message: input.turn.prompt }, session);
          }
          if (decisions === 1) {
            return agentFixtureMainDecision(input, {
              targetNodeId: "user",
              decisionRequestId: "request-user-call",
              output: "Need one clarification",
              intervention: {
                tool: "request_user",
                message: "Which audience should the result target?",
                rationale: "The requested audience is ambiguous"
              }
            });
          }
          return agentFixtureMainDecision(input, {
            targetNodeId: "finish",
            decisionRequestId: `finish-call-${decisions}`,
            output: decisions === 2
              ? "Completed for the scientific audience"
              : "Completed reopened requirement"
          });
        }
      }
    });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    await coordinator.createProject(state, { enabled: true, provider: "github" });
    await waitFor(() => state.phase === "user-intervention-required");
    expect(state.userIntervention).toMatchObject({ status: "pending", requestedBy: "main" });
    expect(state.executions).toEqual([]);
    await coordinator.respondToUserIntervention(state, { message: "Scientific reviewers" });
    await waitFor(() => state.status === "completed");
    expect(prompts[1]).toContain("Scientific reviewers");
    expect(state.nodeRuns).toHaveLength(1);
    expect(state.pullRequests).toEqual([]);

    await coordinator.addProjectUserInput(state, {
      message: "Also provide a concise reproducibility note",
      mode: "wait",
      requestId: "reopen-one"
    });
    await coordinator.addProjectUserInput(state, {
      message: "Also provide a concise reproducibility note",
      mode: "wait",
      requestId: "reopen-one"
    });
    await waitFor(() => state.status === "completed" && state.cycle === 2);
    expect(decisions).toBe(3);
    expect(prompts[2]).toContain("Also provide a concise reproducibility note");
    expect(prompts[2]).not.toContain(state.requirement);
    expect(prompts[2].split("Also provide a concise reproducibility note")).toHaveLength(2);
    expect(state.userInputs).toEqual([
      expect.objectContaining({ requestId: "reopen-one", status: "delivered" })
    ]);
    expect(state.nodeRuns).toHaveLength(2);
    expect(state.executions).toEqual([]);
    expect(Object.keys(state.taskCompletions ?? {})).toHaveLength(3);
    const completionEvents = coordinator.database().eventsAfter(state.id, 0, 1_000);
    expect(completionEvents.filter((event) => event.type === "main.route.task_completion.committed")).toHaveLength(3);
    expect(completionEvents.some((event) => event.type === "main.management_memory.committed")).toBe(false);
    await coordinator.shutdown();
  });

  it.each(["structured", "legacy"] as const)("rechecks a late original %s Session at the real root Main publication boundary", async kind => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-main-late-session-")); temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub()); await storage.initialize();
    const state = projectState("prj_15151515151515151515151515151522");
    state.orchestration = { ...state.orchestration, agents: state.orchestration.agents.filter(agent => agent.name === "main"),
      collaborations: [], input: { source: "input", target: "main" }, routes: { main: [] },
      decisionPlans: { main: "Preserve the original Main authority" },
      termination: { ...state.orchestration.termination, agent: "main", condition: "Main confirms completion" }, allowMainReconfiguration: true };
    state.agents = { main: { ...state.agents.main, harness: "codex" } }; state.runCounts = { main: 0 }; state.executionCounts = { main: 0 };
    await storage.createProject(state);
    let decisions = 0, key = "", requestId = "", release!: () => void;
    const nextTurn = new Promise<void>(resolve => { release = resolve; });
    const original = { schemaVersion: 1 as const, harnessId: "codex", adapterVersion: "test", nativeId: "late-original-main", generation: 0, durable: true, createdAt: state.createdAt };
    const coordinator = new CollaborationRuntimeCoordinator({ storage, serviceId: "main-late-session", hostId: "test", leaseDurationMs: 5_000,
      validateWorkflowConfiguration: async () => undefined, gitFactory: options => happyGitFake(options, []), residentLauncher: {
        async open() { throw new Error("Main stays a management invocation"); },
        async decideRoute(input) {
          decisions += 1;
          if (decisions === 1) {
            const workflowPath = path.join(input.open.inputs!.workspacePath, "workflow.json"), document = mainAgentOrchestrationDocument(state.id, state.orchestration, state.agents, {}, {}, JSON.parse(await fs.readFile(workflowPath, "utf8")).baseVersion);
            document.agents.main.harness = "claude-code"; await fs.writeFile(workflowPath, JSON.stringify(document));
            const decision = await agentFixtureMainDecision(input, { targetNodeId: "__apply_workflow__", decisionRequestId: "late-session-proposal",
              output: "Original Main task completed independently", decisionAction: { tool: "apply_workflow", path: "workflow.json", rationale: "Exact live proposal" } });
            requestId = coordinator.database().workflowAdjustments(state.id)[0].requestId;
            key = collaborationSessionKey("main", input.open.request.executionContext);
            if (kind === "structured") state.agentSessions = { ...state.agentSessions, [key]: original };
            else state.agentSessionIds = { ...state.agentSessionIds, [key]: original.nativeId };
            return decision;
          }
          expect(input.output).not.toContain('"status":"applied"');
          await nextTurn;
          return agentFixtureMainDecision(input, { targetNodeId: "finish", decisionRequestId: "complete-original-main",
            decisionAction: { tool: "complete_project", rationale: "Finish the independently authorized original plan" } });
        }
      } });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    try {
      await coordinator.createProject(state, { enabled: true, provider: "github" });
      await waitFor(() => Boolean(requestId && coordinator.database().workflowAdjustment(state.id, requestId)?.waitingReason?.includes("Harness")) || Boolean(state.lastError));
      expect(state.lastError).toBeUndefined();
      const database = coordinator.database(), record = database.workflowAdjustment(state.id, requestId)!;
      expect(record).toMatchObject({ status: "pending", proposal: { agents: { main: { harness: "claude-code" } } } });
      expect(state.workflowRevision).toBe(1); expect(state.agents.main.harness).toBe("codex"); expect(state.pauseRequest).toBeUndefined();
      database.withdrawWorkflowAdjustment({ projectId: state.id, requestId, operationId: "withdraw-incompatible-original", note: "Keep the original Session" });
      release(); await waitFor(() => state.status === "completed");
      expect(kind === "structured" ? state.agentSessions?.[key] : state.agentSessionIds?.[key]).toEqual(kind === "structured" ? original : original.nativeId);
      expect(database.eventsAfter(state.id, 0, 10_000).some(event => event.type === "workflow.revision.created")).toBe(false);
      expect(database.workflowAdjustment(state.id, requestId)!.status).toBe("withdrawn");
    } finally { release(); await coordinator.shutdown(); }
  });

  it.each([undefined, "Preserve my original task constraints"])(
    "consumes a withdrawal after Main's live tool receipt without recording a false workflow publication (note=%s)", async note => {
      const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-main-workflow-withdrawal-")); temporaryRoots.push(root);
      const storage = new ProjectStorage(root, new EventHub()); await storage.initialize();
      const state = projectState("prj_15151515151515151515151515151519");
      state.orchestration = { ...state.orchestration, agents: state.orchestration.agents.filter(agent => agent.name === "main"),
        collaborations: [], input: { source: "input", target: "main" }, routes: { main: [] },
        decisionPlans: { main: "Original plan must remain authoritative" },
        termination: { ...state.orchestration.termination, agent: "main", condition: "Main confirms completion" }, allowMainReconfiguration: true };
      state.agents = { main: state.agents.main }; state.runCounts = { main: 0 }; state.executionCounts = { main: 0 };
      await storage.createProject(state);
      let decisions = 0, originalAccepted: CollaborationEvent | undefined, originalFinish: CollaborationEvent | undefined;
      const coordinator = new CollaborationRuntimeCoordinator({ storage, serviceId: "main-withdrawal", hostId: "test", leaseDurationMs: 5_000,
        gitFactory: options => happyGitFake(options, []), residentLauncher: {
          async open() { throw new Error("Main stays a management invocation"); },
          async decideRoute(input) {
            decisions += 1;
            expect(input.state.workflowRevision).toBe(1);
            expect(input.state.orchestration.decisionPlans.main).toBe("Original plan must remain authoritative");
            if (decisions === 1) {
              const workflowPath = path.join(input.open.inputs!.workspacePath, "workflow.json");
              const document = JSON.parse(await fs.readFile(workflowPath, "utf8")); document.orchestration.decisionPlans.main = "Withdraw this exact proposal";
              await fs.writeFile(workflowPath, JSON.stringify(document));
              const decision = await agentFixtureMainDecision(input, { targetNodeId: "__apply_workflow__", decisionRequestId: "withdraw-this-tool",
                output: "Main's original proposal receipt", decisionAction: { tool: "apply_workflow", path: "workflow.json", rationale: "Main's actual public reason" } });
              const database = coordinator.database();
              const record = database.workflowAdjustments(state.id)[0]; expect(record.status).toBe("pending");
              originalAccepted = database.eventByRequestId(state.id, record.requestId);
              originalFinish = database.eventsAfter(state.id, 0, 10_000).find(event => event.type === "main.route.task_completion.committed");
              expect(originalFinish).toBeDefined();
              expect(database.withdrawWorkflowAdjustment({ projectId: state.id, requestId: record.requestId, operationId: "withdraw-original-main",
                ...(note === undefined ? {} : { note }) }).withdrawn).toBe(true);
              return decision;
            }
            expect(decisions).toBe(2);
            expect(input.output).toContain('"status":"withdrawn"');
            expect(input.output).not.toContain('"status":"applied"');
            if (note) expect(input.output).toContain(note);
            return agentFixtureMainDecision(input, { targetNodeId: "finish", decisionRequestId: "complete-original-plan",
              decisionAction: { tool: "complete_project", rationale: "Main independently completed the next legal management task" } });
          }
        } });
      if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
      await coordinator.initialize();
      try {
        await coordinator.createProject(state, { enabled: true, provider: "github" });
        await waitFor(() => state.status === "completed");
        const database = coordinator.database(), events = database.eventsAfter(state.id, 0, 10_000);
        expect(decisions).toBe(2); expect(state.workflowRevision).toBe(1);
        expect(database.workflowAdjustments(state.id)[0].status).toBe("withdrawn");
        expect(events.find(event => event.eventId === originalAccepted?.eventId)).toEqual(originalAccepted);
        expect(events.find(event => event.eventId === originalFinish?.eventId)).toEqual(originalFinish);
        expect(events.some(event => event.type === "workflow.revision.created")).toBe(false);
        expect(events.some(event => event.type === "main.workflow_projection.committed" && event.payload.effect === "workflow_projection")).toBe(false);
        expect(events.find(event => event.type === "main.route.response.committed")?.payload.workflowAdjustment).toMatchObject({ status: "withdrawn", workflowRevision: 1 });
      } finally { await coordinator.shutdown(); }
    }
  );

  it.each([undefined, "Preserve my original task constraints"])(
    "transports the committed Main withdrawal after a lost local response (note=%s)", async note => {
      const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-main-workflow-withdrawal-")); temporaryRoots.push(root);
      const storage = new ProjectStorage(root, new EventHub()); await storage.initialize();
      const state = projectState("prj_15151515151515151515151515151527");
      state.orchestration = { ...state.orchestration, agents: state.orchestration.agents.filter(agent => agent.name === "main"),
        collaborations: [], input: { source: "input", target: "main" }, routes: { main: [] },
        decisionPlans: { main: "Original plan must remain authoritative" },
        termination: { ...state.orchestration.termination, agent: "main", condition: "Main confirms completion" }, allowMainReconfiguration: true };
      state.agents = { main: state.agents.main }; state.runCounts = { main: 0 }; state.executionCounts = { main: 0 };
      await storage.createProject(state);
      let injected = false;
      let decisions = 0, originalAccepted: CollaborationEvent | undefined, originalFinish: CollaborationEvent | undefined;
      const coordinator = new CollaborationRuntimeCoordinator({ storage, serviceId: "main-withdrawal-replay", hostId: "test", leaseDurationMs: 5_000,
        gitFactory: options => happyGitFake(options, []), residentLauncher: {
          async open() { throw new Error("Main stays a management invocation"); },
          async observeMainRouteRecovery() { return { stopped: true, evidence: { fixtureNativeWasClosed: true } }; },
          async decideRoute(input) {
            decisions += 1;
            expect(input.state.workflowRevision).toBe(1);
            expect(input.state.orchestration.decisionPlans.main).toBe("Original plan must remain authoritative");
            if (decisions === 1) {
              const workflowPath = path.join(input.open.inputs!.workspacePath, "workflow.json");
              const document = JSON.parse(await fs.readFile(workflowPath, "utf8")); document.orchestration.decisionPlans.main = "Withdraw this exact proposal";
              await fs.writeFile(workflowPath, JSON.stringify(document));
              const decision = await agentFixtureMainDecision(input, { targetNodeId: "__apply_workflow__", decisionRequestId: "withdraw-this-tool",
                output: "Main's original proposal receipt", decisionAction: { tool: "apply_workflow", path: "workflow.json", rationale: "Main's actual public reason" } });
              const database = coordinator.database();
              const record = database.workflowAdjustments(state.id)[0]; expect(record.status).toBe("pending");
              originalAccepted = database.eventByRequestId(state.id, record.requestId);
              originalFinish = database.eventsAfter(state.id, 0, 10_000).find(event => event.type === "main.route.task_completion.committed");
              expect(originalFinish).toBeDefined();
              expect(database.withdrawWorkflowAdjustment({ projectId: state.id, requestId: record.requestId, operationId: "withdraw-original-main",
                ...(note === undefined ? {} : { note }) }).withdrawn).toBe(true);
              const append = database.appendEvent.bind(database);
              vi.spyOn(database, "appendEvent").mockImplementation(event => {
                const result = append(event);
                if (!injected && event.type === "main.route.response.committed") {
                  injected = true; throw new Error("fixture lost local response after the immutable Main response commit");
                }
                return result;
              });
              return decision;
            }
            expect(decisions).toBe(2);
            expect(input.output).toContain('"status":"withdrawn"');
            expect(input.output).not.toContain('"status":"applied"');
            if (note) expect(input.output).toContain(note);
            return agentFixtureMainDecision(input, { targetNodeId: "finish", decisionRequestId: "complete-original-plan",
              decisionAction: { tool: "complete_project", rationale: "Main independently completed the next legal management task" } });
          }
        } });
      if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
      await coordinator.initialize();
      try {
        await coordinator.createProject(state, { enabled: true, provider: "github" });
        await waitFor(() => injected && ["retrying", "completed"].includes(state.status));
        if (state.status !== "completed") await coordinator.resumeProject(state);
        await waitFor(() => state.status === "completed").catch(error => { throw new Error(JSON.stringify({
          status: state.status, phase: state.phase, lastError: state.lastError, decisions,
          failures: coordinator.database().eventsAfter(state.id, 0, 10_000).filter(e => e.type === "failure.attempt.recorded").map(e => e.payload.redactedMessage)
        }), { cause: error }); });
        const database = coordinator.database(), events = database.eventsAfter(state.id, 0, 10_000);
        expect(injected).toBe(true); expect(state.mainInvocationSeq).toBe(2);
        expect(decisions).toBe(2); expect(state.workflowRevision).toBe(1);
        expect(database.workflowAdjustments(state.id)[0].status).toBe("withdrawn");
        expect(events.find(event => event.eventId === originalAccepted?.eventId)).toEqual(originalAccepted);
        expect(events.find(event => event.eventId === originalFinish?.eventId)).toEqual(originalFinish);
        expect(events.some(event => event.type === "workflow.revision.created")).toBe(false);
        expect(events.some(event => event.type === "main.workflow_projection.committed" && event.payload.effect === "workflow_projection")).toBe(false);
        expect(events.find(event => event.type === "main.route.response.committed")?.payload.workflowAdjustment).toMatchObject({ status: "withdrawn", workflowRevision: 1 });
      } finally { await coordinator.shutdown(); }
    }, 15_000
  );

  it.each([false, true].flatMap(initialized => (["configuration", "workflow"] as const).map(changed => ({ initialized, changed }))))(
    "rejects a root proposal whose base changes during async validation ($changed, initialized=$initialized)", async ({ changed, initialized }) => {
      const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-main-async-base-")); temporaryRoots.push(root);
      const storage = new ProjectStorage(root, new EventHub()); await storage.initialize();
      const state = projectState("prj_15151515151515151515151515151521");
      state.orchestration = { ...state.orchestration, agents: state.orchestration.agents.filter(agent => agent.name === "main"),
        collaborations: [], input: { source: "input", target: "main" }, routes: { main: [] },
        decisionPlans: { main: "Original authority" },
        termination: { ...state.orchestration.termination, agent: "main", condition: "Main confirms completion" }, allowMainReconfiguration: true };
      state.agents = { main: state.agents.main }; state.runCounts = { main: 0 }; state.executionCounts = { main: 0 };
      await storage.createProject(state);
      let decisions = 0, validations = 0, rejected: unknown, draftPath = "", originalDraft = "", ownFinish: CollaborationEvent | undefined;
      const coordinator = new CollaborationRuntimeCoordinator({ storage, serviceId: "main-async-base", hostId: "test", leaseDurationMs: 5_000,
        gitFactory: options => happyGitFake(options, []),
        validateWorkflowConfiguration: async (_state, proposal) => {
          validations += 1;
          if (validations > 1) {
            expect(changed).toBe("configuration");
            expect(proposal.agents.main.instructions).toBe("New configuration authority from another accepted change");
            return;
          }
          // Controlled authority change across the real async validator yield.
          // It is not a claim of a real user application or external provider.
          await Promise.resolve();
          const database = coordinator.database();
          ownFinish = database.eventsAfter(state.id, 0, 10_000).find(event => event.type === "main.route.task_completion.committed");
          expect(ownFinish).toBeDefined();
          database.initializeScopedConfiguration(state.id, { agents: state.agents, skillDefinitions: {}, mcpDefinitions: {} });
          if (changed === "configuration") {
            const configuration = credentialFreeAgentConfiguration(database.scopedConfiguration(state.id)!);
            configuration.agents.main.instructions = "New configuration authority from another accepted change";
            database.appendEvent({ projectId: state.id, requestId: "configuration-during-validator", type: "scoped.configuration.applied", payload: { configuration } });
          } else {
            const orchestration = structuredClone(state.orchestration); orchestration.decisionPlans.main = "New workflow authority from another accepted change";
            database.saveWorkflowRevision({ projectId: state.id, workflowRevision: 2, snapshot: orchestration, affectedGroupIds: [], requestId: "workflow-during-validator" });
          }
        }, residentLauncher: {
          async open() { throw new Error("Main remains a management invocation"); },
          async decideRoute(input) {
            decisions += 1;
            if (decisions === 1) {
              if (initialized) coordinator.database().initializeScopedConfiguration(state.id, { agents: state.agents, skillDefinitions: {}, mcpDefinitions: {} });
              draftPath = path.join(input.open.inputs!.workspacePath, "workflow.json");
              const proposal = mainAgentOrchestrationDocument(state.id, state.orchestration, state.agents, {}, {}, JSON.parse(await fs.readFile(draftPath, "utf8")).baseVersion);
              proposal.agents.main.instructions = "Old draft must not replace newer authority";
              originalDraft = JSON.stringify(proposal); await fs.writeFile(draftPath, originalDraft);
              try {
                return await agentFixtureMainDecision(input, { targetNodeId: "__apply_workflow__", decisionRequestId: "stale-root-tool",
                  output: "Original task completed independently", decisionAction: { tool: "apply_workflow", path: "workflow.json", rationale: "Original proposal's public reason" } });
              } catch (error) { rejected = error; }
            }
            // Explicit simulated Agent decision after rejection; production
            // does not choose a fallback, rebase or reconstruct this proposal.
            return agentFixtureMainDecision(input, { targetNodeId: "finish", decisionRequestId: "ask-after-stale",
              output: "Original task completed independently", intervention: { tool: "request_user", message: "Review the newer configuration before I resubmit", rationale: "My original proposal became stale" } });
          }
        } });
      if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
      await coordinator.initialize();
      try {
        await coordinator.createProject(state, { enabled: true, provider: "github" });
        await waitFor(() => Boolean(state.userIntervention) || Boolean(state.lastError));
        expect(rejected).toBeInstanceOf(Error);
        expect((rejected as Error).message).toMatch(changed === "configuration" ? /base.*stale/i : /immutable workflow prestate/i);
        expect(state.lastError).toBeUndefined(); expect(decisions).toBe(1); expect(validations).toBe(changed === "configuration" ? 2 : 1);
        const database = coordinator.database(), events = database.eventsAfter(state.id, 0, 10_000);
        expect(database.workflowAdjustments(state.id)).toEqual([]);
        expect(database.projectState(state.id).workflowRevision).toBe(changed === "workflow" ? 2 : 1);
        if (changed === "workflow") expect(database.projectState(state.id).workflowSnapshot).toMatchObject({ decisionPlans: { main: "New workflow authority from another accepted change" } });
        else {
          expect(database.scopedConfiguration(state.id)?.agents.main.instructions).toBe("New configuration authority from another accepted change");
          expect(state.agents.main.instructions).toBe("New configuration authority from another accepted change");
        }
        expect(events.find(event => event.eventId === ownFinish?.eventId)).toEqual(ownFinish);
        expect(events.some(event => event.type === "main.route_action.accepted" && (event.payload.action as ControlAction)?.tool === "apply_workflow")).toBe(false);
        expect(events.some(event => event.type === "main.workflow_projection.committed")).toBe(false);
        expect(await fs.readFile(draftPath, "utf8")).toBe(originalDraft);
      } finally { await coordinator.shutdown(); }
    });

  it.each(["missing", "stale", "version-cycle"] as const)("gives an outer Main node full management tools and reconciles a %s original draft before apply_workflow", async staleKind => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-collaboration-main-node-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_15151515151515151515151515151515");
    const mainDefinition = state.orchestration.agents.find((item) => item.name === "main")!;
    state.orchestration = {
      ...state.orchestration,
      agents: [mainDefinition],
      collaborations: [],
      input: { source: "input", target: "main" },
      routes: { main: [] },
      decisionPlans: { main: "Assess and complete the project." },
      termination: {
        ...state.orchestration.termination,
        agent: "main",
        condition: "Main confirms completion"
      },
      allowMainReconfiguration: true
    };
    state.agents = { main: state.agents.main };
    state.runCounts = { main: 0 };
    state.executionCounts = { main: 0 };
    await storage.createProject(state);
    const order: string[] = [];
    const scopes: unknown[] = [];
    const authoritativeRevisions: number[] = [];
    let decisions = 0;
    const coordinator = new CollaborationRuntimeCoordinator({
      storage,
      serviceId: "main-node-test",
      hostId: "host-test",
      leaseDurationMs: 5_000,
      gitFactory: (options) => happyGitFake(options, order),
      residentLauncher: {
        async open() { throw new Error("Main management must not open a delivery resident"); },
        async decideRoute(input) {
          decisions += 1;
          scopes.push(structuredClone(input.open.controlScope));
          const canonicalWorkflowDirectory = path.join(
            storage.projectDir(state.id),
            "workflow"
          );
          const workspaceWorkflowDirectory = path.join(
            input.open.inputs!.workspacePath,
            "workflow"
          );
          expect(await fs.realpath(workspaceWorkflowDirectory))
            .toBe(await fs.realpath(canonicalWorkflowDirectory));
          const definition = JSON.parse(await fs.readFile(
            path.join(workspaceWorkflowDirectory, "definition.json"),
            "utf8"
          )) as {
            projectId: string;
            workflowRevision: number;
            workflow: ProjectState["orchestration"];
          };
          const currentState = JSON.parse(await fs.readFile(
            path.join(workspaceWorkflowDirectory, "current-state.json"),
            "utf8"
          )) as {
            projectId: string;
            workflowRevision: number;
            stateRevision: number;
            currentNode: { invocationId: string; epoch: number };
          };
          expect(definition).toMatchObject({
            projectId: state.id,
            workflowRevision: decisions === 1 ? 1 : staleKind === "version-cycle" ? 4 : 2,
            workflow: { decisionPlans: { main: decisions === 1
              ? "Assess and complete the project."
              : "Use the committed revised Main plan." } }
          });
          expect(currentState).toMatchObject({
            projectId: state.id,
            workflowRevision: definition.workflowRevision,
            currentNode: {
              invocationId: input.turn.invocationId,
              epoch: (input.open.controlScope as { coordinatorEpoch: number }).coordinatorEpoch
            }
          });
          expect(currentState.stateRevision).toBeGreaterThan(0);
          expect(JSON.stringify({ definition, currentState }))
            .not.toMatch(/"(?:apiKey|authorization|oauthToken|gatewaySecret)"|gh[pousr]_|github_pat_/i);
          expect((await fs.stat(path.join(
            workspaceWorkflowDirectory,
            "definition.json"
          ))).mode & (process.platform === "win32" ? 0o222 : 0o777)).toBe(process.platform === "win32" ? 0 : 0o400);
          expect(await fs.readFile(input.open.inputs!.memoryPath, "utf8"))
            .toContain("this turn's Workflow overview");
          authoritativeRevisions.push(definition.workflowRevision);
          const turnRuntime = await input.open.turnRequestFactory({
            baseRequest: input.open.request,
            turn: input.turn
          });
          expect(turnRuntime.request.executionContext).toMatchObject({
            nodeRunId: expect.any(String),
            routeScopeId: expect.stringContaining("main-route-"),
            role: "leader",
            coordinatorEpoch: expect.any(Number)
          });
          expect(turnRuntime.request.executionContext).not.toHaveProperty("groupRunId");
          for (const providerRequest of [1, 2]) {
            await turnRuntime.request.onTokenUsage?.({
              usageId: `usage-${input.turn.invocationId}-${providerRequest}`,
              protocol: "responses",
              model: "fixture-model",
              inputTokens: 2,
              cachedInputTokens: 0,
              outputTokens: 1,
              totalTokens: 3
            });
          }
          if (decisions === 1) {
            await turnRuntime.request.onTokenUsagePersistenceFailure?.({
              usageId: `usage-failed-${input.turn.invocationId}`,
              protocol: "responses",
              model: "fixture-model",
              error: "fixture durable accounting outage"
            });
          }
          if (decisions === 1) {
            const workflowPath = path.join(input.open.inputs!.workspacePath, "workflow.json");
            const document = JSON.parse(await fs.readFile(workflowPath, "utf8")) as {
              orchestration: ProjectState["orchestration"];
              baseVersion?: { revision: number; hash: string };
            };
            document.orchestration.decisionPlans.main = "Use the committed revised Main plan.";
            await fs.writeFile(workflowPath, `${JSON.stringify(document, null, 2)}\n`);
            const authority = await input.open.controlAuthorityFactory!({
              request: input.open.request,
              turn: input.turn
            });
            const envelopeBase = {
              projectId: state.id,
              agent: "main" as const,
              invocationId: input.turn.invocationId,
              stateVersion: authority.control.stateVersion,
              capabilityHash: authority.control.capabilityHash,
              receivedAt: new Date().toISOString()
            };
            await expect(authority.revalidate({
              ...envelopeBase,
              callId: "reject-main-management-artifact",
              action: {
                tool: "publish_artifact",
                path: "workflow.json",
                title: "Management workflow",
                kind: "configuration",
                description: "Must never escape the PR gate"
              }
            }, [])).rejects.toThrow(/not merged business artifacts/);
            const action = {
              tool: "apply_workflow" as const,
              path: "workflow.json",
              rationale: "Use the revised Main plan"
            };
            expect(document.baseVersion).toMatchObject({ revision: 1, hash: expect.any(String) });
            if (staleKind === "missing") delete document.baseVersion;
            else if (staleKind === "stale") document.baseVersion = { ...document.baseVersion!, revision: 0 };
            else {
              const database = coordinator.database();
              database.initializeScopedConfiguration(state.id, { agents: state.agents, skillDefinitions: {}, mcpDefinitions: {} });
              const original = database.workflowAdjustmentCurrent(state.id);
              const intermediate = structuredClone(original.snapshot.orchestration);
              intermediate.decisionPlans.main = "Intermediate accepted Main plan";
              database.saveWorkflowRevision({ projectId: state.id, workflowRevision: 2, snapshot: intermediate, affectedGroupIds: [] });
              database.saveWorkflowRevision({ projectId: state.id, workflowRevision: 3, snapshot: original.snapshot.orchestration, affectedGroupIds: [] });
              expect(database.workflowAdjustmentCurrent(state.id).version).toEqual({ ...original.version, revision: 3 });
            }
            const originalDraft = `${JSON.stringify(document, null, 2)}\n`;
            await fs.writeFile(workflowPath, originalDraft);
            await expect(authority.revalidate({ ...envelopeBase, callId: "reject-original-stale-draft", action }, []))
              .rejects.toThrow(/original configuration version/);
            expect(await fs.readFile(workflowPath, "utf8")).toBe(originalDraft);
            const current = JSON.parse(await fs.readFile(path.join(input.open.inputs!.workspacePath, ".scienceevolve", "workflow-current.json"), "utf8"));
            expect(current.baseVersion).toMatchObject({ revision: staleKind === "version-cycle" ? 3 : 1, hash: expect.any(String) });
            expect(current.orchestration.decisionPlans.main).toBe("Assess and complete the project.");
            current.orchestration.decisionPlans.main = "Use the committed revised Main plan.";
            await fs.writeFile(workflowPath, `${JSON.stringify(current, null, 2)}\n`);
            return agentFixtureMainDecision(input, {
              targetNodeId: "__apply_workflow__",
              decisionRequestId: "apply-main-workflow",
              output: "Workflow revision committed",
              decisionAction: action
            });
          }
          return agentFixtureMainDecision(input, {
            targetNodeId: "finish",
            decisionRequestId: "complete-after-workflow",
            output: "Completed under the revised workflow",
            decisionAction: {
              tool: "complete_project" as const,
              rationale: "The revised one-node workflow is complete"
            }
          });
        }
      }
    });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    await coordinator.createProject(state, { enabled: true, provider: "github" });
    await waitFor(() => state.status === "completed").catch((error: unknown) => {
      throw new Error(
        `Main workflow reconfiguration did not complete: ${JSON.stringify({
          status: state.status,
          phase: state.phase,
          lastError: state.lastError,
          decisions,
          workflowRevision: state.workflowRevision,
          activeNodeRunId: state.activeNodeRunId,
          nodeRuns: state.nodeRuns
        })}`,
        { cause: error }
      );
    });
    expect(decisions).toBe(2);
    expect(authoritativeRevisions).toEqual([1, staleKind === "version-cycle" ? 4 : 2]);
    expect(scopes).toEqual([
      expect.objectContaining({
        role: "main-node",
        routeScopeId: expect.stringContaining("main-route-"),
        allowWorkflowReconfiguration: true,
        canComplete: true
      }),
      expect.objectContaining({
        role: "main-node",
        routeScopeId: expect.stringContaining("main-route-"),
        canComplete: true
      })
    ]);
    expect(scopes.every((scope) => !(scope as Record<string, unknown>).groupRunId)).toBe(true);
    expect(state.workflowRevision).toBe(staleKind === "version-cycle" ? 4 : 2);
    expect(state.orchestration.decisionPlans.main).toBe("Use the committed revised Main plan.");
    expect(state.nodeRuns).toHaveLength(2);
    expect(state.nodeRuns?.every((item) => item.status === "completed")).toBe(true);
    expect(state.executions).toEqual([]);
    const collaboration = coordinator.database().projectState(state.id);
    const mainEvents = coordinator.database().eventsAfter(state.id, 0, 1_000);
    const ownCompletion = mainEvents.filter((event) => event.type === "main.route.task_completion.committed");
    expect(ownCompletion).toHaveLength(2);
    expect(ownCompletion[0]!.seq).toBeLessThan(mainEvents.find((event) => event.type === "main.route_action.accepted")!.seq);
    expect(mainEvents.some((event) => event.type === "main.management_memory.committed")).toBe(false);
    expect(collaboration.groupRuns).toEqual([]);
    expect(collaboration.usage).toHaveLength(4);
    expect(collaboration.usage.every((usage) => usage.groupRunId === undefined)).toBe(true);
    expect(new Set(collaboration.usage.map((usage) => usage.invocationId)).size).toBe(2);
    const usageFailure = coordinator.database().eventsAfter(state.id, 0, 1_000)
      .find((event) => event.type === "usage.persistence.failed");
    expect(usageFailure).toMatchObject({
      type: "usage.persistence.failed",
      payload: expect.objectContaining({
        usageId: expect.stringContaining("usage-failed-"),
        routeScopeId: expect.stringContaining("main-route-"),
        error: "fixture durable accounting outage"
      })
    });
    expect(usageFailure).not.toHaveProperty("groupRunId");
    expect(collaboration.failureAttempts).toEqual(expect.arrayContaining([
      expect.objectContaining({
        scope: "usage",
        operation: expect.stringContaining("persistence:usage-failed-"),
        status: "failed",
        errorCode: "USAGE_PERSISTENCE_FAILED",
        retryable: true,
        redactedMessage: "fixture durable accounting outage"
      })
    ]));
    expect(collaboration.failureSummary.unresolvedFailures).toBeGreaterThanOrEqual(1);
    expect((await storage.readEvents(state.id, 0, 1_000)).some((event) =>
      event.type === "usage.persistence.failed" &&
      event.level === "error" &&
      event.data?.sourceType === "usage.persistence.failed"
    )).toBe(true);
    expect(state.tokenUsage).toMatchObject({
      inputTokens: 8,
      outputTokens: 4,
      totalTokens: 12,
      invocations: 4,
      byAgent: {
        main: {
          inputTokens: 8,
          outputTokens: 4,
          totalTokens: 12,
          invocations: 4
        }
      }
    });
    await coordinator.shutdown();
  }, 15_000);

  it("exposes complete_project when canonical Main has no explicit finish edge", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-collaboration-main-terminal-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_15151515151515151515151515151515");
    state.orchestration = {
      ...state.orchestration,
      agents: [{ name: "main", template: "main" }],
      input: { source: "input", target: "main" },
      routes: { main: [] },
      termination: { agent: "main", condition: "Main confirms completion" }
    };
    state.agents = { main: state.agents.main };
    state.runCounts = { main: 0 };
    state.tokenUsage.byAgent = { main: state.tokenUsage.byAgent.main! };
    await storage.createProject(state);
    let observedCandidates: readonly string[] = [];
    const coordinator = new CollaborationRuntimeCoordinator({
      storage,
      serviceId: "main-terminal-test",
      hostId: "host-test",
      leaseDurationMs: 5_000,
      gitFactory: (options) => happyGitFake(options, []),
      residentLauncher: {
        async open() { throw new Error("System Main must remain management-only"); },
        async decideRoute(input) {
          observedCandidates = input.candidates;
          return agentFixtureMainDecision(input, {
            targetNodeId: "finish",
            decisionRequestId: "main-complete-no-edge",
            output: "Main verified the terminal condition"
          });
        }
      }
    });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    await coordinator.createProject(state, { enabled: true, provider: "github" });
    await waitFor(() => state.status === "completed");
    expect(observedCandidates).toEqual(["finish"]);
    expect(state.executions).toEqual([]);
    expect(state.pullRequests).toEqual([]);
    await coordinator.shutdown();
  });

  it.each([false, true].flatMap(finished => [false, true].map(withSeed => ({ finished, withSeed }))))(
    "reuses Main's confirmed recovery after restart without refreezing its accepted decision (finished=$finished, seed=$withSeed)",
    async ({ finished, withSeed }) => {
      const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-main-recovered-choice-")); temporaryRoots.push(root);
      const storage = new ProjectStorage(root, new EventHub()); await storage.initialize();
      const state = projectState("prj_98989898989898989898989898989898");
      state.orchestration = { ...state.orchestration,
        agents: state.orchestration.agents.filter(agent => ["main", "idea"].includes(agent.name)),
        input: { source: "input", target: "main" },
        routes: { main: [{ target: "idea", kind: "weak" }], idea: [{ target: "finish", kind: "strong" }] },
        decisionPlans: { main: "Delegate the original task.", idea: "Deliver the original task." },
        termination: { ...state.orchestration.termination, agent: "idea" } };
      state.agents = { main: state.agents.main, idea: state.agents.idea };
      await storage.createProject(state);
      const session = { schemaVersion: 1 as const, harnessId: "codex" as const, adapterVersion: "test", generation: 0,
        nativeId: "original-recovered-main-choice", durable: true, createdAt: "2026-10-09T00:00:00.000Z" };
      let allowStop = false; let turns = 0; let workerOpens = 0; let stopObservations = 0;
      const sessions: string[] = []; const directories: string[] = [];
      const launcher: CollaborationResidentLauncher = {
        async open(input) { workerOpens += 1; expect(input.request.agent).toBe("idea"); return blockingResident(input.signal); },
        async decideRoute(input) {
          turns += 1; directories.push(input.open.request.workspacePath);
          const fresh = await input.open.turnRequestFactory({ baseRequest: input.open.request, turn: input.turn });
          if (turns === 1) await fresh.request.onDurableSessionStarted?.(session, session.nativeId);
          else expect(fresh.request.resumeThreadId).toBe(session.nativeId);
          sessions.push(fresh.request.resumeThreadId ?? session.nativeId);
          const authority = await input.open.controlAuthorityFactory!({ request: fresh.request, turn: input.turn });
          const service = new ControlActionService({ projectId: state.id, agent: "main", invocationId: input.turn.invocationId,
            stateVersion: authority.control.stateVersion, capability: authority.control.capability,
            capabilityHash: authority.control.capabilityHash, stagingPath: authority.control.stagingPath, revalidate: authority.revalidate });
          if (turns === 1) {
            await service.stage(authority.control.capability, "original-main-route",
              { tool: "route_to_agent", target: "idea", assignment: "Preserve this exact Agent-selected task" });
          }
          if (finished || turns > 1) await service.stage(authority.control.capability, `main-finish-${turns}`,
            { tool: "finish_task", summary: "Main finished its original management task" });
          if (turns === 1) throw new Error("Original Main response was lost after its live tools");
          return { targetNodeId: "idea", decisionRequestId: "original-main-route" };
        },
        async observeMainRouteRecovery(input) {
          stopObservations += 1; expect(input.routeEpoch).toBe(1);
          return { stopped: allowStop, evidence: { originalMainStopped: allowStop },
            ...(allowStop && withSeed ? { recovery: createResidentRecoveryProofSeed({ projectId: state.id,
              sourceNodeRunId: input.sourceNodeRunId, scope: "main-route", scopeId: input.routeScopeId,
              agentId: "main", stoppedEpoch: 1, oldSession: session, observedAt: "2026-10-09T01:00:00.000Z",
              evidence: { processGroupAbsent: true, priorOwnershipEpoch: 1 } }) } : {}) };
        }
      };
      const options = { storage, serviceId: "retained-main-choice", hostId: "test",
        harnessRecoveryDelayMs: () => 60_000, gitFactory: (input: CollaborationGitFactoryOptions) => happyGitFake(input, []), residentLauncher: launcher };
      const first = new CollaborationRuntimeCoordinator(options); await first.initialize();
      let prefix: CollaborationEvent[];
      try {
        await first.createProject(state, { enabled: true, provider: "github" });
        await waitFor(() => ["paused", "retrying"].includes(state.status));
        expect(turns).toBe(1); expect(workerOpens).toBe(0);
        prefix = first.database().eventsAfter(state.id, 0, 2000);
        expect(prefix.filter(event => event.type === "main.route.failed.frozen")).toHaveLength(1);
        expect(prefix.filter(event => event.type === "main.route_action.accepted")).toHaveLength(1);
      } finally { await first.shutdown(); }
      const restarted = new CollaborationRuntimeCoordinator(options); await restarted.initialize();
      const restored = await storage.loadState(state.id);
      try {
        await restarted.recoverProject(restored);
        expect(turns).toBe(1); expect(workerOpens).toBe(0); expect(restored.status).toBe(hasUserWorkflowPause(restored) ? "paused" : "retrying");
        allowStop = true; await restarted.resumeProject(restored);
        await waitFor(() => workerOpens > 0 || restored.status === "paused");
        expect(restored.lastError).toBeUndefined(); expect(workerOpens).toBe(1);
        expect(turns, "Only the unfinished original Main turn is continued").toBe(finished ? 1 : 2);
        expect(stopObservations, "Initial failure, restart recovery and explicit Resume each probe the same old epoch").toBe(3);
        expect(new Set(sessions).size).toBe(1); expect(new Set(directories).size).toBe(1);
        const events = restarted.database().eventsAfter(state.id, 0, 2000);
        expect(events.slice(0, prefix!.length)).toEqual(prefix!);
        expect(events.filter(event => event.type === "main.route.failed.frozen")).toHaveLength(1);
        expect(events.filter(event => event.type === "main.route.recovered")).toHaveLength(1);
        expect(events.filter(event => event.type === "main.route.mechanism_repair.requested")).toHaveLength(0);
        expect(events.filter(event => event.type === "main.route.response.committed")).toHaveLength(1);
        expect(events.filter(event => event.type === "main.route.task_completion.committed")).toHaveLength(1);
        expect(restarted.database().projectState(state.id).tasks[0]?.assignment).toBe("Preserve this exact Agent-selected task");
      } finally { await restarted.shutdown(); }
    }, 15_000);

  it("consumes Main's accepted completion after a lost response only with an exact stop proof", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-main-accepted-action-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_15151515151515151515151515151516");
    state.orchestration = {
      ...state.orchestration,
      agents: [{ name: "main", template: "main" }],
      input: { source: "input", target: "main" },
      routes: { main: [] },
      termination: { agent: "main", condition: "Main confirms completion" }
    };
    state.agents = { main: state.agents.main };
    state.runCounts = { main: 0 };
    state.tokenUsage.byAgent = { main: state.tokenUsage.byAgent.main! };
    await storage.createProject(state);
    let modelTurns = 0;
    let managementAttempts = 0;
    let stopObservations = 0;
    const gitFactory = (options: CollaborationGitFactoryOptions): CollaborationGitRuntime => {
      const git = happyGitFake(options, []);
      const commitManagementMemory = git.commitManagementMemory!.bind(git);
      return {
        ...git,
        async commitManagementMemory(...args) {
          managementAttempts += 1;
          return commitManagementMemory(...args);
        }
      };
    };
    const residentLauncher: CollaborationResidentLauncher = {
      async open() { throw new Error("System Main must remain management-only"); },
      async decideRoute(input) {
        modelTurns += 1;
        const fresh = await input.open.turnRequestFactory({
          baseRequest: input.open.request,
          turn: input.turn
        });
        expect(fresh.request.executionContext?.executionId).toBeUndefined();
        const action: Extract<ControlAction, { tool: "complete_project" }> = {
          tool: "complete_project",
          rationale: "The terminal requirement is satisfied"
        };
        const decision = await agentFixtureMainDecision(input, {
          decisionRecorded: true, targetNodeId: "finish", decisionRequestId: "accepted-main-complete",
          output: action.rationale, decisionAction: action
        });
        if (modelTurns === 1) {
          throw new Error("fixture lost the model response after staging the tool call");
        }
        return decision;
      },
      async observeMainRouteRecovery(input) {
        stopObservations += 1;
        expect(input.routeEpoch).toBe(1);
        return {
          stopped: true,
          evidence: { exactAcceptedRouteEpoch: input.routeEpoch }
        };
      }
    };
    const first = new CollaborationRuntimeCoordinator({
      storage,
      serviceId: "main-accepted-action-first",
      hostId: "host-test",
      leaseDurationMs: 5_000,
      gitFactory,
      residentLauncher
    });
    if (first instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(first);
    await first.initialize();
    await first.createProject(state, { enabled: true, provider: "github" });
    await waitFor(() => state.status === "completed");
    expect(modelTurns).toBe(1);
    expect(managementAttempts).toBe(1);
    expect(stopObservations).toBe(1);
    expect(state.nodeRuns).toEqual([
      expect.objectContaining({ status: "completed" })
    ]);
    const events = (first as unknown as {
      database(): CollaborationStateDatabase;
    }).database().eventsAfter(state.id, 0, 1_000);
    expect(events.filter((event) => event.type === "main.route_action.accepted")).toHaveLength(1);
    expect(events.filter((event) => event.type === "main.route.task_completion.committed")).toHaveLength(1);
    expect(events.filter((event) => event.type === "main.route.attempt")).toHaveLength(1);
    expect(events.filter((event) => event.type === "main.route.recovered")).toHaveLength(1);
    await first.shutdown();
  }, 15_000);

  it.each([false, true])(
    "retains the Leader's original session and workspace when an interrupted assignment resumes (legacy launch: %s)", async (legacyLaunch) => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-group-accepted-rebind-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_15151515151515151515151515151517");
    state.agents.main = { ...state.agents.main, sessionPersistence: false };
    state.orchestration = {
      ...state.orchestration,
      collaborations: [{
        id: "accepted-team",
        displayName: "Accepted action team",
        memberAgentIds: ["idea", "execution"],
        renamePolicy: "editable"
      }],
      input: { source: "input", target: "accepted-team" },
      routes: {
        ...state.orchestration.routes,
        "accepted-team": [{ target: "finish", kind: "strong" }]
      }
    };
    await storage.createProject(state);
    const order: string[] = [];
    const managementContents: string[] = [];
    const leaderDirectories: string[] = [];
    const leaderSessions: string[] = [];
    const leaderSnapshots: Array<{ path: string; content: string }> = [];
    let activeCoordinator!: CollaborationRuntimeCoordinator;
    let acceptedSource!: () => void;
    const sourceAccepted = new Promise<void>((resolve) => { acceptedSource = resolve; });
    let sourceAssignmentTurns = 0;
    let recoveredLeaderTurns = 0;
    let leaderStopProofs = 0;
    const residentLauncher: CollaborationResidentLauncher = {
      async open(input) {
        const context = input.request.executionContext!;
        if (context.role !== "leader") {
          return {
            async submit(turn) {
              return agentFixtureDelivery(input, turn,
                { handoff: `${input.request.agent} completed recovered delivery` }, activeCoordinator);
            },
            async pause() {},
            async resume() {},
            async close() {}
          };
        }
        leaderDirectories.push(input.request.workspacePath);
        leaderSnapshots.push({ path: input.inputs!.memoryPath,
          content: await fs.readFile(input.inputs!.memoryPath, "utf8") });
        let recoveredTurn = 0;
        return {
          async submit(turn) {
            const fresh = await input.turnRequestFactory({
              baseRequest: input.request,
              turn
            });
            const authority = await input.controlAuthorityFactory!({
              request: fresh.request,
              turn
            });
            if (context.coordinatorEpoch === 1) {
              sourceAssignmentTurns += 1;
              await fresh.request.onDurableSessionStarted?.({ schemaVersion: 1, harnessId: "codex",
                adapterVersion: "fixture", generation: 0, nativeId: "interrupted-leader-session",
                durable: true, createdAt: new Date().toISOString() }, "interrupted-leader-session");
              leaderSessions.push("interrupted-leader-session");
              await fs.writeFile(path.join(fresh.request.workspacePath, "pending-leader-note.txt"),
                "Leader-authored unfinished coordination note");
              const action: ControlAction = {
                tool: "assign_group_tasks",
                groupRunId: context.groupRunId,
                coordinatorEpoch: 1,
                tasks: [{
                  taskId: "accepted-task",
                  assignment: "Deliver the accepted task exactly once",
                  assigneeAgentId: "idea"
                }]
              };
              await authority.revalidate({
                projectId: state.id,
                agent: fresh.request.agent,
                invocationId: turn.invocationId,
                callId: "accepted-assignment-call",
                stateVersion: authority.control.stateVersion,
                capabilityHash: authority.control.capabilityHash,
                receivedAt: new Date().toISOString(),
                action
              }, []);
              acceptedSource();
              await new Promise<void>((_resolve, reject) => {
                const abort = () => reject(new Error("fixture service stopped after tool acceptance"));
                if (input.signal.aborted) abort();
                else input.signal.addEventListener("abort", abort, { once: true });
              });
              throw new Error("unreachable accepted source turn");
            }
            recoveredTurn += 1;
            recoveredLeaderTurns += 1;
            expect(fresh.request.resumeThreadId).toBe("interrupted-leader-session");
            leaderSessions.push(fresh.request.resumeThreadId!);
            expect(fresh.request.workspacePath).toBe(leaderDirectories[0]);
            expect(await fs.readFile(path.join(fresh.request.workspacePath, "pending-leader-note.txt"), "utf8"))
              .toBe("Leader-authored unfinished coordination note");
            const action: ControlAction = recoveredTurn === 1 ? {
              tool: "assign_group_tasks",
              groupRunId: context.groupRunId,
              coordinatorEpoch: context.coordinatorEpoch,
              tasks: [{
                taskId: "accepted-task",
                assignment: "Deliver the accepted task exactly once",
                assigneeAgentId: "idea"
              }]
            } : recoveredTurn === 2 ? {
              tool: "request_group_integration",
              groupRunId: context.groupRunId,
              coordinatorEpoch: context.coordinatorEpoch,
              integrationOwnerAgentId: "idea"
            } : {
              tool: "complete_group",
              groupRunId: context.groupRunId,
              coordinatorEpoch: context.coordinatorEpoch,
              output: "Recovered accepted action completed the group"
            };
            const envelope = {
              projectId: state.id,
              agent: fresh.request.agent,
              invocationId: turn.invocationId,
              callId: `recovered-group-call-${recoveredTurn}`,
              stateVersion: authority.control.stateVersion,
              capabilityHash: authority.control.capabilityHash,
              receivedAt: new Date().toISOString(),
              action
            };

            return agentFixtureLeaderResult(input, turn, {
              handoff: `Recovered group action ${action.tool}`,
              controlActions: [envelope]
            });
          },
          async pause() {},
          async resume() {},
          async close() {}
        };
      },
      async stopLeaderForRecovery(input) {
        leaderStopProofs += 1;
        expect(input.groupRun.coordinatorEpoch).toBe(1);
        return {
          stopped: true,
          evidence: { exactCoordinatorEpoch: input.groupRun.coordinatorEpoch }
        };
      }
    };
    const first = new CollaborationRuntimeCoordinator({
      storage,
      serviceId: "group-accepted-rebind-first",
      hostId: "host-test",
      leaseDurationMs: 5_000,
      gitFactory: (options) => happyGitFake(options, order, true, false, managementContents),
      residentLauncher
    });
    activeCoordinator = first;
    if (first instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(first);
    await first.initialize();
    if (legacyLaunch) {
      const appendEvent = first.database().appendEvent.bind(first.database());
      vi.spyOn(first.database(), "appendEvent").mockImplementation((event) => {
        if (event.type !== "group.leader.launch.started") return appendEvent(event);
        // Older durable launch facts predate the workspace anchor. Persist
        // them through the same fenced S operation, without changing history.
        const { managementWorkspaceName: _anchor, ...payload } = event.payload ?? {};
        return appendEvent({ ...event, payload });
      });
    }
    try {
      await first.createProject(state, { enabled: true, provider: "github" });
      await sourceAccepted;
      // The lightweight Git fake returns repository initialization facts but
      // does not journal repository.create itself. Persist the same finalized
      // authority a production facade leaves for the fresh coordinator.
      const sourceDatabase = (first as unknown as {
        database(): CollaborationStateDatabase;
      }).database();
      const repository = repositoryFact("accepted-group-rebind");
      sourceDatabase.prepareOperation(state.id, {
        id: "operation-repository-accepted-group-rebind",
        kind: "repository.create",
        payloadHash: "repository-accepted-group-rebind",
        status: "prepared"
      });
      sourceDatabase.transitionOperation(state.id, {
        id: "operation-repository-accepted-group-rebind",
        payloadHash: "repository-accepted-group-rebind",
        status: "observed",
        remoteFact: repository
      });
      sourceDatabase.transitionOperation(state.id, {
        id: "operation-repository-accepted-group-rebind",
        payloadHash: "repository-accepted-group-rebind",
        status: "finalized",
        remoteFact: repository
      });
    } finally { await first.shutdown(); }

    const restartedStorage = new ProjectStorage(root, new EventHub());
    await restartedStorage.initialize();
    const restartedState = structuredClone(state);
    const restarted = new CollaborationRuntimeCoordinator({
      storage: restartedStorage,
      serviceId: "group-accepted-rebind-second",
      hostId: "host-test",
      leaseDurationMs: 5_000,
      gitFactory: (options) => happyGitFake(options, order, true, false, managementContents),
      residentLauncher
    });
    activeCoordinator = restarted;
    if (restarted instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(restarted);
    await restarted.initialize();
    try {
      expect(await restarted.recoverProject(restartedState)).toBe(true);
      await waitFor(() => leaderDirectories.length === 2 || restartedState.status === "paused");
      expect(leaderDirectories).toEqual([leaderDirectories[0], leaderDirectories[0]]);
      await waitFor(() => restartedState.status === "completed");

      expect(sourceAssignmentTurns).toBe(1);
      // The epoch-1 action never crossed the successful-turn commit boundary,
      // so epoch 2 records the assignment before integration and completion.
      expect(recoveredLeaderTurns).toBe(3);
      expect(leaderStopProofs).toBe(1);
      expect(restartedState.groupRuns?.[0]).toMatchObject({
        status: "completed",
        coordinatorEpoch: 2,
        output: "Recovered accepted action completed the group"
      });
      expect(restartedState.tasks?.filter((task) => task.id === "accepted-task"))
        .toHaveLength(1);
      expect(restartedState.executions?.filter((execution) =>
        execution.taskId === "accepted-task"
      )).toHaveLength(1);
      const events = (restarted as unknown as {
        database(): CollaborationStateDatabase;
      }).database().eventsAfter(state.id, 0, 10_000);
      const acceptedAssignments = events.filter((event) =>
        event.type === "group.control_action.accepted" &&
        (event.payload.action as { tool?: unknown } | undefined)?.tool === "assign_group_tasks"
      );
      expect(acceptedAssignments).toHaveLength(1);
      expect(acceptedAssignments.map((event) => event.coordinatorEpoch)).toEqual([2]);
      expect(acceptedAssignments.map((event) => event.payload.callId))
        .toEqual(["recovered-group-call-1"]);
      expect(events.filter((event) => event.type === "group.tasks.assigned")).toHaveLength(1);
      expect(events.filter((event) => event.type === "group.task_completion.committed").map((event) =>
        event.coordinatorEpoch)).toEqual([2, 2, 2]);
      const launches = events.filter((event) => event.type === "group.leader.launch.started");
      expect(launches).toHaveLength(2);
      expect(launches[0]!.payload.managementWorkspaceName)
        .toBe(legacyLaunch ? undefined : path.basename(leaderDirectories[0]!));
      expect(launches[1]!.payload.managementWorkspaceName).toBe(path.basename(leaderDirectories[0]!));
      expect(events).toEqual(expect.arrayContaining([
        expect.objectContaining({ type: "coordinator.stop_confirmed", coordinatorEpoch: 1 }),
        expect.objectContaining({ type: "group.coordinator.recovered", coordinatorEpoch: 2 })
      ]));
      expect(managementContents).toHaveLength(3);
      expect(leaderDirectories).toHaveLength(2);
      expect(new Set(leaderDirectories).size).toBe(1);
      expect(leaderSessions).toEqual(Array(4).fill("interrupted-leader-session"));
      expect(leaderSnapshots).toHaveLength(2);
      expect(leaderSnapshots[1]!.path).not.toBe(leaderSnapshots[0]!.path);
      expect(await fs.readFile(leaderSnapshots[0]!.path, "utf8")).toBe(leaderSnapshots[0]!.content);
    } finally { await restarted.shutdown(); }
  }, 15_000);

  it.each([false, true])(
    "preserves Main's accepted display through explicit memory repair and restart (repeat selection: %s)", async (repeatSelection) => {
      const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-main-display-accepted-")); temporaryRoots.push(root);
      const storage = new ProjectStorage(root, new EventHub()); await storage.initialize();
      const state = projectState("prj_15151515151515151515151515151517");
      state.orchestration = { ...state.orchestration,
        agents: [state.orchestration.agents.find((item) => item.name === "main")!], collaborations: [],
        input: { source: "input", target: "main" }, routes: { main: [] },
        decisionPlans: { main: "Select the trusted report and complete." },
        allowMainReconfiguration: true,
        termination: { ...state.orchestration.termination, agent: "main", condition: "Main confirms completion" } };
      state.agents = { main: { ...state.agents.main, sessionPersistence: false } };
      state.runCounts = { main: 0 }; state.executionCounts = { main: 0 };
      state.artifacts = [{ id: "main:report.md", agent: "main", invocationId: "inv_review_accepted",
        path: "report.md", title: "Trusted report", kind: "document", description: "Merged review evidence",
        size: 24, mediaType: "text/markdown", updatedAt: new Date().toISOString(),
        gitSource: { executionId: "execution-review-accepted", ownershipEpoch: 1,
          worktreePath: path.join(root, "retained-review"), commitSha: "d".repeat(40),
          pullRequestId: "pull-review-accepted", acceptedBase: "main" } }];
      await storage.createProject(state);
      const artifactLookups: unknown[] = [];
      const bindArtifactResolver = (target: ProjectStorage) => vi.spyOn(target, "resolveWorkspaceArtifact")
        .mockImplementation(async (_projectId, _agent, _path, binding) => {
          artifactLookups.push(binding);
          return { sourcePath: path.join(root, "immutable", "report.md"), relativePath: "report.md",
            size: 24, mediaType: "text/markdown", mtimeMs: 0 };
        });
      bindArtifactResolver(storage);
      let modelTurns = 0; let opens = 0; let closes = 0; let managementAttempts = 0;
      let finishToolActive = false; let allowStopProof = false; let toolFailureReturned = false;
      const memories: string[] = []; const sessions: string[] = []; const directories: string[] = [];
      const snapshots: Array<{ path: string; content: string }> = [];
      let unfinishedProposal = "";
      const adapter = { async open(input: import("../../src/core/collaboration-runtime.js").CollaborationResidentOpenInput) {
        opens += 1; directories.push(input.request.workspacePath);
        snapshots.push({ path: input.inputs!.memoryPath, content: await fs.readFile(input.inputs!.memoryPath, "utf8") });
        const lease = { session: { schemaVersion: 1 as const, harnessId: "codex" as const, adapterVersion: "fixture",
          nativeId: "main-display-retained-session", generation: 0, durable: true, createdAt: new Date().toISOString() },
          acknowledgedControlSeq: 0 };
        return { initialLease: lease, async submit(turn: { inputId: string; invocationId: string; prompt: string }) {
          modelTurns += 1;
          const fresh = await input.turnRequestFactory({ baseRequest: input.request, turn });
          if (modelTurns === 1) await fresh.request.onDurableSessionStarted?.(lease.session, lease.session.nativeId);
          else expect(fresh.request.resumeThreadId).toBe(lease.session.nativeId);
          sessions.push(fresh.request.resumeThreadId ?? lease.session.nativeId);
          const authority = await input.controlAuthorityFactory!({ request: fresh.request, turn });
          const service = new ControlActionService({ projectId: state.id, agent: "main", invocationId: turn.invocationId,
            stateVersion: authority.control.stateVersion, capability: authority.control.capability,
            capabilityHash: authority.control.capabilityHash, stagingPath: authority.control.stagingPath,
            revalidate: authority.revalidate });
          const actions: ControlActionEnvelope[] = [];
          const call = async (action: ControlAction) => {
            const envelope = await service.stage(authority.control.capability, `display-${turn.invocationId}-${actions.length}`, action);
            actions.push(envelope); return envelope;
          };
          const select: Extract<ControlAction, { tool: "select_display" }> = { tool: "select_display",
            primary: { agent: "main", path: "report.md", title: "Trusted report" }, items: [] };
          const finish = async () => {
            finishToolActive = true;
            try { await call({ tool: "finish_task", summary: "Main verified its selected report",
              memory: "Main explicitly keeps the accepted report version and completes this coordination task." }); }
            finally { finishToolActive = false; }
          };
          const complete: ControlAction = { tool: "complete_project", rationale: "The accepted report satisfies the request" };
          if (modelTurns === 1) {
            const proposalPath = path.join(fresh.request.workspacePath, "workflow.json");
            const proposal = JSON.parse(await fs.readFile(proposalPath, "utf8"));
            proposal.orchestration.decisionPlans.main = "Agent's unsubmitted proposal must survive this native failure.";
            unfinishedProposal = `${JSON.stringify(proposal, null, 2)}\n`;
            await fs.writeFile(proposalPath, unfinishedProposal);
            await fs.writeFile(path.join(fresh.request.workspacePath, "pending-main-note.txt"), "Agent-authored uncommitted note");
            await call(select);
            await expect(finish()).rejects.toThrow("fixture display memory write failed"); toolFailureReturned = true;
            throw new Error("fixture native response lost after Main received its memory tool failure");
          }
          expect(modelTurns).toBe(2); expect(toolFailureReturned).toBe(true);
          expect(await fs.readFile(path.join(fresh.request.workspacePath, "workflow.json"), "utf8")).toBe(unfinishedProposal);
          expect(await fs.readFile(path.join(fresh.request.workspacePath, "pending-main-note.txt"), "utf8"))
            .toBe("Agent-authored uncommitted note");
          await expect(call({ ...select, primary: { ...select.primary, title: "Replace the accepted display" } }))
            .rejects.toThrow("accepted formal action cannot be replaced");
          if (repeatSelection) await call(select);
          await expect(call(complete)).rejects.toThrow("finish_task for its own management task before complete_project");
          await finish(); await finish();
          await call(complete);
          return { handoff: "Main explicitly repaired its own memory and completed the project", controlActions: actions };
        }, async pause() {}, async resume() {}, async probe() { return lease; }, async close() { closes += 1; } };
      } } as unknown as HarnessRuntimeResidentAdapter;
      const native = { reconcileResidentStartup: vi.fn(async () => ({ status: "none" })),
        residentRecoveryStrategy: () => "native-resume", cleanupResidentInterrupted: vi.fn(async () => undefined) } as unknown as HarnessRuntimeFacade;
      const production = createProductionCollaborationResidentLauncher(native, adapter);
      const residentLauncher: CollaborationResidentLauncher = { ...production, async observeMainRouteRecovery(input) {
        return { stopped: allowStopProof, evidence: { acceptedDisplayRouteEpoch: input.routeEpoch, actualHandlesClosed: closes } };
      } };
      const gitFactory = (options: CollaborationGitFactoryOptions): CollaborationGitRuntime => {
        const git = happyGitFake(options, [], true, false, memories);
        return { ...git, async commitManagementMemory(...args) {
          expect(finishToolActive).toBe(true); managementAttempts += 1;
          if (managementAttempts === 1) throw new Error("fixture display memory write failed");
          return git.commitManagementMemory!(...args);
        } };
      };
      const first = new CollaborationRuntimeCoordinator({ storage, serviceId: "main-display-first", hostId: "host-test",
        leaseDurationMs: 5_000, harnessRecoveryDelayMs: () => 60_000, gitFactory, residentLauncher });
      if (first instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(first);
      await first.initialize();
      try {
        await first.createProject(state, { enabled: true, provider: "github" });
        await waitFor(() => ["paused", "retrying"].includes(state.status));
        expect(modelTurns).toBe(1); expect(managementAttempts).toBe(1); expect(memories).toHaveLength(0);
        expect(state.display).toBeUndefined();
        const facts = first.database().eventsAfter(state.id, 0, 10_000);
        expect(facts.filter((event) => event.type === "main.route_action.accepted")).toHaveLength(1);
        expect(facts.some((event) => event.type === "main.route.task_completion.committed")).toBe(false);
        // A newer publication appears while the old native writer is stopped;
        // its path must not silently replace the already accepted report SHA.
        state.artifacts!.push({ ...state.artifacts![0]!, id: "main:report.md:newer", invocationId: "inv_review_newer",
          title: "Newer report at the same path", updatedAt: new Date(Date.now() + 1_000).toISOString(),
          gitSource: { ...state.artifacts![0]!.gitSource!, executionId: "execution-review-newer",
            commitSha: "e".repeat(40), pullRequestId: "pull-review-newer" } });
        await storage.saveState(state);
      } finally { await first.shutdown(); }
      allowStopProof = true;
      const restartedStorage = new ProjectStorage(root, new EventHub()); await restartedStorage.initialize();
      bindArtifactResolver(restartedStorage);
      const restartedState = await restartedStorage.loadState(state.id);
      const restarted = new CollaborationRuntimeCoordinator({ storage: restartedStorage, serviceId: "main-display-second",
        hostId: "host-test", leaseDurationMs: 5_000, gitFactory, residentLauncher });
      if (restarted instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(restarted);
      await restarted.initialize();
      try {
        expect(await restarted.recoverProject(restartedState)).toBe(true);
        expect(["retrying", "queued", "running"]).toContain(restartedState.status);
        expect(hasUserWorkflowPause(restartedState)).toBe(false);
        expect(modelTurns).toBe(1);
        await restarted.resumeProject(restartedState);
        await waitFor(() => restartedState.status === "completed" || ["paused", "retrying"].includes(restartedState.status));
        expect(restartedState.lastError).toBeUndefined(); expect(restartedState.status).toBe("completed");
        expect(modelTurns).toBe(2); expect(opens).toBe(2); expect(closes).toBe(2);
        expect(new Set(sessions).size).toBe(1); expect(new Set(directories).size).toBe(1);
        expect(snapshots[0]!.path).not.toBe(snapshots[1]!.path);
        expect(await fs.readFile(snapshots[0]!.path, "utf8")).toBe(snapshots[0]!.content);
        expect(restartedState.orchestration.decisionPlans.main).toBe("Select the trusted report and complete.");
        expect(restartedState.workflowRevision).toBe(1);
        expect(managementAttempts).toBe(2); expect(memories).toHaveLength(1);
        expect(memories[0]).toContain("Main explicitly keeps the accepted report version");
        expect(restartedState.display).toEqual({ primary: { agent: "main", path: "report.md", title: "Trusted report",
          artifactId: "main:report.md", commitSha: "d".repeat(40) }, items: [] });
        expect(artifactLookups.length).toBeGreaterThan(0);
        expect(artifactLookups.every((binding) => (binding as { commitSha: string }).commitSha === "d".repeat(40))).toBe(true);
        const facts = restarted.database().eventsAfter(state.id, 0, 10_000);
        expect(facts.filter((event) => event.type === "main.route_action.accepted")).toHaveLength(3);
        expect(facts.filter((event) => event.type === "main.route.task_completion.committed")).toHaveLength(1);
        expect(facts.some((event) => event.type === "main.management_memory.committed")).toBe(false);
        expect((await restartedStorage.readEvents(state.id, 0, 10_000)).filter((event) =>
          event.data?.sourceType === "display.selected")).toHaveLength(1);
      } finally { await restarted.shutdown(); }
    }, 15_000);

  it.each(["sqlite-to-file", "file-to-response"] as const)(
    "rolls an accepted apply_workflow forward after the %s crash boundary",
    async (crashBoundary) => {
      const root = await fs.mkdtemp(path.join(os.tmpdir(), `openfars-main-workflow-${crashBoundary}-`));
      temporaryRoots.push(root);
      const storage = new ProjectStorage(root, new EventHub());
      await storage.initialize();
      const state = projectState("prj_15151515151515151515151515151518");
      const mainDefinition = state.orchestration.agents.find((item) => item.name === "main")!;
      state.orchestration = {
        ...state.orchestration,
        agents: [mainDefinition],
        collaborations: [],
        input: { source: "input", target: "main" },
        routes: { main: [] },
        decisionPlans: { main: "Commit one safe workflow revision." },
        termination: {
          ...state.orchestration.termination,
          agent: "main",
          condition: "Main confirms completion"
        },
        allowMainReconfiguration: true
      };
      const gatewaySnapshot = {
        id: "gwy_15151515151515151515151515151518",
        name: "Accepted workflow gateway",
        url: "https://gateway.example.test/v1",
        apiKey: "must-never-enter-collaboration-sqlite",
        models: [state.agents.main.model],
        defaultModel: state.agents.main.model,
        protocol: "responses" as const,
        nativeProtocol: "responses" as const,
        routeMode: "direct" as const
      };
      state.agents = {
        main: {
          ...state.agents.main,
          gatewayId: gatewaySnapshot.id,
          gatewaySnapshot
        }
      };
      state.runCounts = { main: 0 };
      state.executionCounts = { main: 0 };
      await storage.createProject(state);
      const initialFileState = structuredClone(state);

      const modelNodeRuns: string[] = [];
      let managementAttempts = 0;
      let faultInjected = false;
      const gitFactory = (options: CollaborationGitFactoryOptions): CollaborationGitRuntime => {
        const git = happyGitFake(options, []);
        const commitManagementMemory = git.commitManagementMemory!.bind(git);
        return {
          ...git,
          async commitManagementMemory(...args) {
            managementAttempts += 1;
            return commitManagementMemory(...args);
          }
        };
      };
      const residentLauncher: CollaborationResidentLauncher = {
        async open() { throw new Error("System Main must remain management-only"); },
        async observeMainRouteRecovery(input) {
          return {
            stopped: true,
            evidence: {
              acceptedWorkflowRouteEpoch: input.routeEpoch,
              crashBoundary
            }
          };
        },
        async decideRoute(input) {
          modelNodeRuns.push(input.sourceNodeRunId);
          if (modelNodeRuns.length === 1) {
            const workflowPath = path.join(input.open.inputs!.workspacePath, "workflow.json");
            const document = JSON.parse(await fs.readFile(workflowPath, "utf8")) as {
              orchestration: ProjectState["orchestration"];
            };
            document.orchestration.decisionPlans.main =
              `Recovered exact accepted revision: ${crashBoundary}`;
            await fs.writeFile(workflowPath, `${JSON.stringify(document, null, 2)}\n`);
            const action: Extract<ControlAction, { tool: "apply_workflow" }> = {
              tool: "apply_workflow", path: "workflow.json", rationale: `Exercise ${crashBoundary} recovery`
            };
            const decision = await agentFixtureMainDecision(input, {
              decisionRecorded: true, targetNodeId: "__apply_workflow__", decisionRequestId: `apply-${crashBoundary}`,
              output: action.rationale, decisionAction: action
            });
            const database = first.database();
            if (crashBoundary === "sqlite-to-file") {
              const apply = database.rollForwardAcceptedMainWorkflow.bind(database);
              vi.spyOn(database, "rollForwardAcceptedMainWorkflow").mockImplementationOnce((request) => {
                const committed = apply(request);
                expect(committed).toMatchObject({ replay: false, workflowRevision: 2 });
                faultInjected = true;
                throw new Error("fixture crashed after S workflow revision and before file projection");
              });
            } else {
              const append = database.appendEvent.bind(database);
              vi.spyOn(database, "appendEvent").mockImplementation((event) => {
                if (!faultInjected && event.type === "main.route.response.committed") {
                  faultInjected = true;
                  throw new Error("fixture crashed after workflow file projection and before Main response receipt");
                }
                return append(event);
              });
            }
            return decision;
          }
          return agentFixtureMainDecision(input, {
            decisionRecorded: true,
            targetNodeId: "finish",
            decisionRequestId: `complete-${crashBoundary}`,
            output: "Completed under the recovered workflow revision",
            decisionAction: {
              tool: "complete_project" as const,
              rationale: "Recovered workflow is active"
            }
          });
        }
      };
      const first = new CollaborationRuntimeCoordinator({
        storage,
        serviceId: `main-workflow-${crashBoundary}-first`,
        hostId: "host-test",
        leaseDurationMs: 5_000,
        gitFactory,
        residentLauncher
      });
      if (first instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(first);
      await first.initialize();
      let originalNodeRunId = "";
      try {
        await first.createProject(state, { enabled: true, provider: "github" });
        await waitFor(() => ["paused", "retrying"].includes(state.status));
        expect(faultInjected).toBe(true);
        originalNodeRunId = modelNodeRuns[0]!;
        expect(modelNodeRuns).toEqual([originalNodeRunId]);
        const databaseBeforeRestart = (first as unknown as {
          database(): CollaborationStateDatabase;
        }).database();
        expect(databaseBeforeRestart.projectState(state.id).workflowRevision).toBe(2);
        const acceptedBeforeRestart = databaseBeforeRestart.eventsAfter(state.id, 0, 10_000)
          .find((event) => event.type === "main.route_action.accepted");
        expect(acceptedBeforeRestart?.payload).toMatchObject({
          sequence: 0,
          workflowProposal: {
            prestateWorkflowRevision: 1,
            targetWorkflowRevision: 2,
            affectedGroupIds: []
          }
        });
        expect(JSON.stringify(acceptedBeforeRestart?.payload)).not.toContain(gatewaySnapshot.apiKey);
      } finally { await first.shutdown(); }

      if (crashBoundary === "sqlite-to-file") {
        // Model the hard-stop boundary precisely: S committed revision 2,
        // while the credential-bearing file projection is still revision 1.
        await fs.writeFile(
          path.join(storage.projectDir(state.id), "state.json"),
          `${JSON.stringify(initialFileState, null, 2)}\n`
        );
      }

      const restartedStorage = new ProjectStorage(root, new EventHub());
      await restartedStorage.initialize();
      const restartedState = await restartedStorage.loadState(state.id);
      expect(restartedState.workflowRevision).toBe(
        crashBoundary === "sqlite-to-file" ? 1 : 2
      );
      const restarted = new CollaborationRuntimeCoordinator({
        storage: restartedStorage,
        serviceId: `main-workflow-${crashBoundary}-second`,
        hostId: "host-test",
        leaseDurationMs: 5_000,
        gitFactory,
        residentLauncher
      });
      if (restarted instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(restarted);
      await restarted.initialize();
      try {
        expect(await restarted.recoverProject(restartedState)).toBe(true);
        if (["paused", "retrying"].includes(restartedState.status)) await restarted.resumeProject(restartedState);
        await waitFor(() => restartedState.status === "completed").catch((error: unknown) => {
          throw new Error(JSON.stringify({
            status: restartedState.status,
            phase: restartedState.phase,
            lastError: restartedState.lastError,
            workflowRevision: restartedState.workflowRevision,
            modelNodeRuns,
            managementAttempts,
            nodeRuns: restartedState.nodeRuns
          }), { cause: error });
        });

        expect(modelNodeRuns.filter((nodeRunId) => nodeRunId === originalNodeRunId))
          .toHaveLength(1);
        expect(modelNodeRuns).toHaveLength(2);
        expect(restartedState.workflowRevision).toBe(2);
        expect(restartedState.orchestration.decisionPlans.main)
          .toBe(`Recovered exact accepted revision: ${crashBoundary}`);
        expect(restartedState.agents.main).toMatchObject({
          model: state.agents.main.model,
          gatewayId: gatewaySnapshot.id,
          gatewaySnapshot
        });
        const database = (restarted as unknown as {
          database(): CollaborationStateDatabase;
        }).database();
        expect(database.eventsAfter(state.id, 0, 10_000).filter((event) =>
          event.type === "workflow.revision.created"
        )).toHaveLength(1);
        expect(database.eventsAfter(state.id, 0, 10_000).filter((event) =>
          event.type === "main.route_action.accepted"
        )).toHaveLength(2);
        const facts = database.eventsAfter(state.id, 0, 10_000);
        expect(facts.filter((event) => event.type === "main.route.task_completion.committed")).toHaveLength(2);
        expect(facts.some((event) => event.type === "main.management_memory.committed")).toBe(false);
        const firstCompletion = facts.find((event) => event.type === "main.route.task_completion.committed")!;
        const workflowCommit = facts.find((event) => event.type === "workflow.revision.created")!;
        expect(firstCompletion.seq).toBeLessThan(workflowCommit.seq);
        expect(managementAttempts).toBe(2);
      } finally { await restarted.shutdown(); }
    }
  );



  it.each(["normal", "same-native-metadata-loss", "different-native", "different-adapter"] as const)(
    "freezes a failed independent Main, proves stop, and retains its native identity: %s", async (mode) => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-main-route-recovery-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_16161616161616161616161616161616");
    state.orchestration = {
      ...state.orchestration,
      agents: [{ name: "main", template: "main" }],
      input: { source: "input", target: "main" },
      routes: { main: [] },
      termination: { agent: "main", condition: "Main confirms completion" }
    };
    state.agents = {
      main: { ...state.agents.main, harness: "dsh" }
    };
    const originalSession = { schemaVersion: 1 as const, harnessId: "dsh" as const,
      adapterVersion: "fixture-v1", generation: 1, nativeId: "main-route-session-before-crash",
      durable: true, createdAt: "2026-09-26T00:00:00.000Z" };
    const corruptedSession = { ...originalSession, generation: 0,
      adapterVersion: mode === "different-adapter" ? "fixture-v2" : originalSession.adapterVersion,
      nativeId: mode === "different-native" ? "legitimately-replaced-native-session" : originalSession.nativeId,
      createdAt: "2026-09-27T00:00:00.000Z" };
    const rootSession = { ...originalSession, nativeId: "unrelated-root-main-session", generation: 8 };
    state.agentSessions = { main: rootSession };
    state.agentSessionIds = { main: rootSession.nativeId };
    state.runCounts = { main: 0 };
    state.tokenUsage.byAgent = { main: state.tokenUsage.byAgent.main! };
    await storage.createProject(state);
    let decisions = 0;
    let stopObservations = 0;
    const nativePreparedSessions: Array<NonNullable<ProjectState["agentSessions"]>[string]> = [];
    const storedSessionsBeforeNativeOpen: typeof nativePreparedSessions = [];
    let recoveredSessionKey = "";
    const durableTurns: Array<unknown> = [];
    const leakedRuntimeCredential = "github_pat_1234567890abcdefghij";
    const coordinator = new CollaborationRuntimeCoordinator({
      storage,
      serviceId: "main-route-recovery-test",
      hostId: "host-test",
      leaseDurationMs: 5_000,
      gitFactory: (options) => happyGitFake(options, []),
      residentLauncher: {
        async open() { throw new Error("System Main must remain management-only"); },
        async decideRoute(input) {
          decisions += 1;
          const context = input.open.request.executionContext!;
          const key = `main::collaboration:leader:${"routeScopeId" in context ? context.routeScopeId : ""}`;
          if (decisions === 1 && mode !== "normal") {
            // Reproduce the old Harness's real publication path: it kept the
            // native ID but reconstructed generation/createdAt before dying.
            await input.open.request.onDurableSessionStarted?.(corruptedSession, corruptedSession.nativeId);
          }
          if (decisions === 2 && mode !== "normal") {
            recoveredSessionKey = key;
            const prepared = input.open.request.project.agentSessions![key]!;
            nativePreparedSessions.push(structuredClone(prepared));
            storedSessionsBeforeNativeOpen.push(structuredClone(state.agentSessions![key]!));
            expect(input.open.request.project.agentSessions?.main).toEqual(rootSession);
            // A successful native open, rather than preparing a request,
            // commits the descriptor through the existing callback.
            await input.open.request.onDurableSessionStarted?.(prepared, prepared.nativeId);
          }
          const fresh = await input.open.turnRequestFactory({
            baseRequest: input.open.request,
            turn: input.turn
          });
          durableTurns.push(fresh.durableRehydrate);
          if (decisions === 1) {
            throw new Error(
              `fixture independent Main crashed Authorization: Bearer ${leakedRuntimeCredential} ${"x".repeat(2_000)}`
            );
          }
          return agentFixtureMainDecision(input, {
            targetNodeId: "finish",
            decisionRequestId: "main-recovered-complete",
            output: "Recovered Main verified completion"
          });
        },
        async observeMainRouteRecovery(input) {
          stopObservations += 1;
          expect(input).toMatchObject({
            sourceNodeRunId: expect.any(String),
            routeEpoch: 1
          });
          const transcript = JSON.stringify({
            routeScopeId: input.routeScopeId,
            routeEpoch: input.routeEpoch,
            committedOutput: "none"
          });
          const evidence = { stopped: true, scope: input.routeScopeId };
          return {
            stopped: true,
            evidence,
            recovery: createResidentRecoveryProofSeed({
              scope: "main-route",
              projectId: state.id,
              sourceNodeRunId: input.sourceNodeRunId,
              scopeId: input.routeScopeId,
              agentId: "main",
              stoppedEpoch: input.routeEpoch,
              oldSession: originalSession,
              observedAt: "2026-09-26T00:01:00.000Z",
              evidence,
              durableRehydrate: {
                sourceDigest: createHash("sha256").update(transcript).digest("hex"),
                lastBusinessTurn: 1,
                lastInputId: `input-main-route-${input.sourceNodeRunId}-1`,
                transcript
              }
            })
          };
        }
      }
    });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    await coordinator.createProject(state, { enabled: true, provider: "github" });
    await waitFor(() => state.status === "completed");

    expect(decisions).toBe(2);
    expect(stopObservations).toBe(1);
    expect(state.agentSessions?.main).toEqual(rootSession);
    if (mode !== "normal") {
      const expected = mode === "same-native-metadata-loss" ? originalSession : corruptedSession;
      expect(nativePreparedSessions).toEqual([expected]);
      expect(storedSessionsBeforeNativeOpen).toEqual([corruptedSession]);
      expect(state.agentSessions?.[recoveredSessionKey]).toEqual(expected);
    }
    expect(durableTurns).toEqual([
      undefined,
      expect.objectContaining({
        sourceDigest: expect.stringMatching(/^[a-f0-9]{64}$/),
        lastBusinessTurn: 1,
        lastInputId: expect.stringContaining("input-main-route-")
      })
    ]);
    expect(state.collaboration).toMatchObject({ frozen: false });
    expect(state.nodeRuns).toEqual([
      expect.objectContaining({ status: "completed" })
    ]);
    const events = await storage.readEvents(state.id, 0, 1_000);
    expect(events.some((event) =>
      event.data?.sourceType === "main.route.failed.frozen")).toBe(true);
    expect(events.some((event) =>
      event.data?.sourceType === "main.route.recovered")).toBe(true);
    const serializedDurableState = JSON.stringify({
      state,
      collaboration: coordinator.database().projectState(state.id),
      events
    });
    expect(serializedDurableState).not.toContain(leakedRuntimeCredential);
    expect(serializedDurableState).toContain("[REDACTED]");
    const frozenEvent = coordinator.database().eventsAfter(state.id, 0, 1_000)
      .find((event) => event.type === "main.route.failed.frozen");
    expect(String(frozenEvent?.payload.error ?? "").length).toBeLessThanOrEqual(1_000);
    const recoveryEvents = coordinator.database().eventsAfter(state.id, 0, 1_000)
      .filter((event) => event.type.startsWith("resident.recovery."));
    expect(recoveryEvents.map((event) => event.type)).toEqual([
      "resident.recovery.observed",
      "resident.recovery.proof.created",
      "resident.recovery.proof.consumed"
    ]);
    expect(recoveryEvents[1]).toMatchObject({
      nodeRunId: state.nodeRuns?.[0]?.id,
      payload: {
        proof: {
          scope: "main-route",
          routeEpoch: 2,
          newInvocationId: expect.any(String),
          inputId: expect.stringContaining("-2"),
          oldSession: { nativeId: "main-route-session-before-crash" }
        }
      }
    });
    await coordinator.shutdown();
  });

  it.each([false, true])("reads original native identity without reauthorizing a consumed=%s proof", async (consumed) => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-recorded-session-"));
    temporaryRoots.push(root);
    const state = projectState("prj_16161616161616161616161616161618");
    let now = Date.parse("2026-09-27T00:03:00.000Z");
    const options = { databasePath: path.join(root, "collaboration.sqlite"), serviceId: "recorded-session-test",
      instanceId: "recorded-session-instance", hostId: "host-test", topology: "single-host" as const,
      leaseDurationMs: 1_000, now: () => now };
    let database = CollaborationStateDatabase.open(options);
    try {
      database.createProject({ projectId: state.id, workflowRevision: 1, workflowSnapshot: state.orchestration,
        git: { enabled: false, status: "disabled" }, workerCapacity: 2, managementCapacity: 1 });
      database.activateNode({ projectId: state.id, nodeRunId: "recorded-node",
        node: { kind: "agent", nodeId: "execution", agentId: "execution" },
        activationRequestId: "activate-recorded-node", inputSnapshotRef: `project:${state.id}:requirement`,
        optionalTask: "Retain the exact original native Session", activatedByAgentId: "main", workflowRevision: 1 });
      const source = { schemaVersion: 1 as const, harnessId: "dsh" as const, adapterVersion: "fixture-v1",
        generation: 3, nativeId: "recorded-native-session", durable: true, createdAt: "2026-09-26T00:00:00.000Z" };
      const seedInput = { scope: "member" as const, projectId: state.id, sourceNodeRunId: "recorded-node",
        scopeId: "recorded-execution", agentId: "execution", stoppedEpoch: 3, oldSession: source,
        observedAt: "2026-09-26T00:01:00.000Z", evidence: { processGroupAbsent: true } };
      // An earlier same-native record for another scope cannot supply this binding.
      database.recordResidentRecoverySeed(createResidentRecoveryProofSeed({ ...seedInput, scopeId: "unrelated-execution" }));
      const seed = createResidentRecoveryProofSeed(seedInput);
      database.recordResidentRecoverySeed(seed);
      database.recordResidentRecoverySeed(createResidentRecoveryProofSeed({ ...seedInput, stoppedEpoch: 4,
        oldSession: { ...source, generation: 0, createdAt: "2026-09-27T00:00:00.000Z" },
        observedAt: "2026-09-27T00:01:00.000Z" }));
      if (consumed) {
        const proof = bindResidentRecoveryProof({ seed, newInvocationId: "recorded-next-invocation", routeEpoch: 4,
          inputId: "recorded-next-input", createdAt: "2026-09-26T00:02:00.000Z" });
        database.recordResidentRecoveryProof(proof);
        database.consumeResidentRecoveryProof({ ...proof });
      }
      database.close();
      now += 1_001;
      database = CollaborationStateDatabase.open({ ...options, instanceId: "recorded-session-next-instance" });
      expect(database.writerLease().epoch).toBe(2);
      const events = database.eventsAfter(state.id, 0, 100);
      const lookup = { projectId: state.id, sourceNodeRunId: seed.sourceNodeRunId, scope: seed.scope,
        scopeId: seed.scopeId, agentId: seed.agentId, nativeId: source.nativeId, throughEpoch: 5 };
      const recovered = database.recordedResidentSession(lookup);
      expect(recovered).toEqual(source);
      recovered!.generation = 99;
      expect(database.recordedResidentSession(lookup)).toEqual(source);
      for (const mismatch of [{ projectId: "another-project" }, { sourceNodeRunId: "another-node" },
        { scope: "group-leader" as const }, { scopeId: "another-execution" }, { agentId: "another-agent" },
        { nativeId: "replacement-native-session" }, { throughEpoch: 2 }]) {
        expect(database.recordedResidentSession({ ...lookup, ...mismatch })).toBeUndefined();
      }
      expect(database.eventsAfter(state.id, 0, 100)).toEqual(events);
      if (consumed) {
        expect(database.residentRecoveryProofForSeed(state.id, seed.seedId)).toBeUndefined();
        expect(database.residentRecoverySeed({ projectId: state.id, scope: seed.scope,
          scopeId: seed.scopeId, stoppedEpoch: 3 })).toBeUndefined();
      }
    } finally { database.close(); }
  });

  it.each(["stale", "current", "reserved", "bound", "wrong_invocation", "wrong_input"] as const)(
    "selects only the current Main recovery or its exact reserved target (%s)", async mode => {
      const NOW = "2026-10-09T12:10:00.000Z";
      const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-main-seed-lineage-")); temporaryRoots.push(root);
      const database = CollaborationStateDatabase.open({ databasePath: path.join(root, "state.sqlite"),
        serviceId: "main-seed-lineage", instanceId: "first", hostId: "host-test", topology: "single-host" });
      try {
        const state = projectState("prj_16161616161616161616161616161619");
        database.createProject({ projectId: state.id, workflowRevision: 1, workflowSnapshot: state.orchestration,
          git: { enabled: false, status: "disabled" }, workerCapacity: 2, managementCapacity: 1 });
        database.activateNode({ projectId: state.id, nodeRunId: "lineage-node",
          node: { kind: "agent", nodeId: "main", agentId: "main" }, activationRequestId: "lineage-activate",
          inputSnapshotRef: "lineage-input", activatedByAgentId: "main", workflowRevision: 1 });
        const scopeId = "main-route-lineage-node";
        const observe = (epoch: number) => createResidentRecoveryProofSeed({ projectId: state.id,
          sourceNodeRunId: "lineage-node", scope: "main-route", scopeId, agentId: "main", stoppedEpoch: epoch,
          oldSession: { schemaVersion: 1, harnessId: "codex", adapterVersion: "test", generation: 0,
            nativeId: "original-lineage-session", durable: true, createdAt: NOW }, observedAt: NOW,
          evidence: { processGroupAbsent: true, priorOwnershipEpoch: epoch } });
        const first = observe(11); database.recordResidentRecoverySeed(first);
        const consumed = observe(12); database.recordResidentRecoverySeed(consumed);
        const consumedProof = bindResidentRecoveryProof({ seed: consumed, routeEpoch: 13,
          newInvocationId: "inv_" + "c".repeat(32), inputId: "lineage-input-13", createdAt: NOW });
        database.recordResidentRecoveryProof(consumedProof); database.consumeResidentRecoveryProof(consumedProof);
        const reservedInvocation = `inv_${createHash("sha256").update(`main-route-recovery:${first.seedId}`).digest("hex").slice(0, 32)}`;
        const reserved = ["reserved", "bound", "wrong_invocation", "wrong_input"].includes(mode);
        const epoch = reserved ? 12 : 13;
        if (mode === "bound" || mode.startsWith("wrong_")) database.recordResidentRecoveryProof(bindResidentRecoveryProof({
          seed: first, routeEpoch: 12, newInvocationId: reservedInvocation, inputId: "original-reserved-input", createdAt: NOW }));
        database.appendEvent({ projectId: state.id, nodeRunId: "lineage-node", agentId: "main",
          requestId: "latest-lineage-attempt", type: "main.route.attempt", coordinatorEpoch: epoch,
          invocationId: reserved && mode !== "wrong_invocation" ? reservedInvocation : "inv_" + "d".repeat(32),
          payload: { inputId: mode === "wrong_input" ? "changed-input" : "original-reserved-input" } });
        const current = observe(13);
        if (mode === "current") database.recordResidentRecoverySeed(current);
        const before = database.eventsAfter(state.id, 0, 1000);
        const selected = database.residentRecoverySeed({ projectId: state.id, scope: "main-route", scopeId, sourceNodeRunId: "lineage-node" });
        expect(selected).toEqual(mode === "current" ? current : reserved && !mode.startsWith("wrong_") ? first : undefined);
        expect(database.residentRecoverySeed({ projectId: state.id, scope: "main-route", scopeId, sourceNodeRunId: "other-node" })).toBeUndefined();
        expect(database.eventsAfter(state.id, 0, 1000)).toEqual(before);
        expect(database.residentRecoveryProofForSeed(state.id, consumed.seedId)).toBeUndefined();
      } finally { database.close(); }
    });

  it.each(["stale", "unconfirmed", "user_pause", "reserved", "bound", "changed_input"] as const)(
    "continues the original Main session without reviving old seeds across recovery (%s)", async mode => {
      const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-main-current-recovery-")); temporaryRoots.push(root);
      const storage = new ProjectStorage(root, new EventHub()); await storage.initialize();
      const state = projectState("prj_16161616161616161616161616161620");
      state.orchestration = { ...state.orchestration, agents: [{ name: "main", template: "main" }],
        input: { source: "input", target: "main" }, routes: { main: [] }, allowMainReconfiguration: true,
        decisionPlans: { main: state.orchestration.decisionPlans.main! },
        termination: { agent: "main", decisionBy: "main", automatic: false, condition: "Main confirms completion" } };
      state.agents = { main: { ...state.agents.main, sessionPersistence: false } };
      state.git = { enabled: true, status: "ready", provider: "github", repository: { owner: "fixture-owner",
        name: "current-main-recovery", htmlUrl: "https://github.example/current-main-recovery", private: true,
        defaultBranch: "main", localPath: path.join(root, "repository") } };
      state.status = "running";
      const nodeRunId = "current-main-node", scopeId = `main-route-${nodeRunId}`;
      const session = { schemaVersion: 1 as const, harnessId: "codex" as const, adapterVersion: "test", generation: 0,
        nativeId: "original-current-main-session", durable: true, createdAt: "2026-10-09T00:00:00.000Z" };
      const sessionKey = `main::collaboration:leader:${scopeId}`;
      state.agentSessions = { [sessionKey]: session };
      state.agentSessionIds = { [sessionKey]: session.nativeId };
      const observation = (epoch: number) => createResidentRecoveryProofSeed({ projectId: state.id, sourceNodeRunId: nodeRunId,
        scope: "main-route", scopeId, agentId: "main", stoppedEpoch: epoch, oldSession: session,
        observedAt: "2026-10-09T01:00:00.000Z", evidence: { processGroupAbsent: true, priorOwnershipEpoch: epoch } });
      const epochs: number[] = []; const decisions: Array<{ invocationId: string; inputId: string }> = [];
      const reserved = ["reserved", "bound", "changed_input"].includes(mode);
      let firstReservation = reserved;
      let reservationReady = false;
      let proposalPath: string | undefined; let retainedDraft: string | undefined;
      const makeCoordinator = () => new CollaborationRuntimeCoordinator({ storage, databasePath: path.join(root, "state.sqlite"),
        serviceId: "current-main-test", hostId: "host-test", gitFactory: options => happyGitFake(options, []),
        residentLauncher: {
          async open() { throw new Error("Main stays management-only"); },
          async observeMainRouteRecovery(input) {
            epochs.push(input.routeEpoch);
            return mode === "unconfirmed" ? { stopped: false, evidence: {} }
              : { stopped: true, evidence: { processGroupAbsent: true }, recovery: observation(input.routeEpoch) };
          },
          async decideRoute(input) {
            decisions.push({ invocationId: input.turn.invocationId, inputId: input.turn.inputId });
            if (firstReservation) {
              firstReservation = false;
              proposalPath = input.open.inputs?.workflowAuthoringPath ?? path.join(input.open.request.workspacePath, "workflow.json");
              expect(proposalPath).toBeTruthy();
              retainedDraft = (await fs.readFile(proposalPath!, "utf8")) + "\n ";
              await fs.writeFile(proposalPath!, retainedDraft);
              if (mode === "bound") coordinator.database().recordResidentRecoveryProof(bindResidentRecoveryProof({
                seed: observation(11), newInvocationId: input.turn.invocationId, routeEpoch: 12,
                inputId: input.turn.inputId, createdAt: "2026-10-09T02:00:00.000Z" }));
              // Simulate process/service loss after reservation, before the
              // native input factory can bind or consume its recovery proof.
              await new Promise<void>((_resolve, reject) => {
                input.signal.addEventListener("abort", () => reject(new Error("Service stopped before native input binding")), { once: true });
                reservationReady = true;
              });
              throw new Error("unreachable");
            }
            if (reserved) {
              expect(decisions[1]).toEqual(decisions[0]);
              expect(input.open.inputs?.workflowAuthoringPath ?? path.join(input.open.request.workspacePath, "workflow.json")).toBe(proposalPath);
              expect(await fs.readFile(proposalPath!, "utf8")).toBe(retainedDraft);
            }
            const fresh = await input.open.turnRequestFactory({ baseRequest: input.open.request, turn: input.turn });
            expect(fresh.request.resumeThreadId).toBe(session.nativeId);
            return agentFixtureMainDecision(input, { targetNodeId: "finish", decisionRequestId: "original-main-done", output: "Original Main completed" });
          }
        } });
      let coordinator = makeCoordinator(); await coordinator.initialize();
      const database = coordinator.database();
      database.createProject({ projectId: state.id, workflowRevision: 1, workflowSnapshot: state.orchestration,
        git: state.git, workerCapacity: 2, managementCapacity: 1 });
      database.activateNode({ projectId: state.id, nodeRunId, node: { kind: "agent", nodeId: "main", agentId: "main" },
        activationRequestId: "current-main-activate", inputSnapshotRef: "current-main-input",
        optionalTask: "Continue the original Main task", activatedByAgentId: "main", workflowRevision: 1 });
      database.recordResidentRecoverySeed(observation(11));
      if (!reserved) {
        const consumedSeed = observation(12); database.recordResidentRecoverySeed(consumedSeed);
        const proof = bindResidentRecoveryProof({ seed: consumedSeed, newInvocationId: "inv_" + "d".repeat(32),
          routeEpoch: 13, inputId: "current-main-input-13", createdAt: "2026-10-09T02:00:00.000Z" });
        database.recordResidentRecoveryProof(proof); database.consumeResidentRecoveryProof(proof);
      }
      database.appendEvent({ projectId: state.id, nodeRunId, agentId: "main", invocationId: "inv_" + "d".repeat(32),
        coordinatorEpoch: reserved ? 11 : 13, requestId: "current-main-attempt", type: "main.route.attempt",
        payload: { inputId: reserved ? "current-main-input-11" : "current-main-input-13" } });
      if (mode === "user_pause") state.pauseRequest = { requestedAt: "2026-10-09T03:00:00.000Z", settledAt: "2026-10-09T03:00:01.000Z" };
      await storage.createProject(state);
      try {
        await coordinator.recoverProject(state);
        if (reserved) {
          await waitFor(() => reservationReady || state.status === "paused");
          expect(state.lastError).toBeUndefined();
          await coordinator.shutdown();
          if (mode === "changed_input") {
            const saved = await storage.loadState(state.id);
            saved.userInputs.push({ id: "changed-recovery-input", message: "An additional user constraint", status: "pending",
              createdAt: "2026-10-09T04:00:00.000Z" });
            Object.assign(state, saved);
          }
          coordinator = makeCoordinator(); await coordinator.initialize();
          await coordinator.recoverProject(state);
          if (["paused", "retrying"].includes(state.status)) await coordinator.resumeProject(state);
        }
        await waitFor(() => state.status === "completed" || ["paused", "retrying"].includes(state.status));
        const events = coordinator.database().eventsAfter(state.id, 0, 2000);
        if (mode === "unconfirmed" || mode === "user_pause" || mode === "changed_input") {
          expect(state.status).toBe(hasUserWorkflowPause(state) ? "paused" : "retrying");
          expect(decisions).toHaveLength(mode === "changed_input" ? 1 : 0);
          if (mode === "changed_input") {
            expect(state.lastError).toContain("Reserved Main recovery input changed");
            expect(events.some(event => event.type === "failure.attempt.recorded" &&
              event.payload.errorCode === "MAIN_ROUTE_RECOVERY_REQUIRED")).toBe(true);
          }
        } else {
          expect(state.status, state.lastError).toBe("completed");
          expect(decisions).toHaveLength(reserved ? 2 : 1);
          expect(events.filter(event => event.type === "main.route.attempt").map(event => event.coordinatorEpoch))
            .toEqual(reserved ? [11, 12] : [13, 14]);
          expect(events.filter(event => event.type === "resident.recovery.proof.consumed" &&
            event.payload.seedId === observation(reserved ? 11 : 13).seedId)).toHaveLength(1);
        }
        expect(epochs).toEqual(reserved || mode === "user_pause" ? [] : [13]);
        expect(events.find(event => event.type === "resident.recovery.observed" &&
          (event.payload.seed as { seedId?: string })?.seedId === observation(11).seedId)).toBeTruthy();
      } finally { await coordinator.shutdown(); }
    }, 20_000);

  it("persists one recovery proof and rejects replay plus cross-input or cross-epoch use", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-recovery-proof-"));
    temporaryRoots.push(root);
    const state = projectState("prj_16161616161616161616161616161617");
    const database = CollaborationStateDatabase.open({
      databasePath: path.join(root, "collaboration.sqlite"),
      serviceId: "recovery-proof-test",
      instanceId: "recovery-proof-test-instance",
      hostId: "host-test",
      topology: "single-host"
    });
    database.createProject({
      projectId: state.id,
      workflowRevision: 1,
      workflowSnapshot: state.orchestration,
      git: { enabled: false, status: "disabled" },
      workerCapacity: 2,
      managementCapacity: 1
    });
    database.activateNode({
      projectId: state.id,
      nodeRunId: "proof-node",
      node: { kind: "agent", nodeId: "execution", agentId: "execution" },
      activationRequestId: "activate-proof-node",
      inputSnapshotRef: `project:${state.id}:requirement`,
      optionalTask: "Prove exact resident recovery binding",
      activatedByAgentId: "main",
      workflowRevision: 1
    });
    const transcript = "durable transcript before the crash";
    const seed = createResidentRecoveryProofSeed({
      scope: "member",
      projectId: state.id,
      sourceNodeRunId: "proof-node",
      scopeId: "proof-execution",
      agentId: "execution",
      stoppedEpoch: 7,
      oldSession: {
        schemaVersion: 1,
        harnessId: "dsh",
        adapterVersion: "fixture-v1",
        generation: 3,
        nativeId: "proof-old-session",
        durable: true,
        createdAt: "2026-09-26T01:00:00.000Z"
      },
      observedAt: "2026-09-26T01:01:00.000Z",
      evidence: { processGroupAbsent: true },
      durableRehydrate: {
        sourceDigest: createHash("sha256").update(transcript).digest("hex"),
        lastBusinessTurn: 9,
        lastInputId: "proof-old-input",
        transcript
      }
    });
    expect(database.recordResidentRecoverySeed(seed).replay).toBe(false);
    expect(database.recordResidentRecoverySeed(seed).replay).toBe(true);
    const proof = bindResidentRecoveryProof({
      seed,
      newInvocationId: "proof-next-invocation",
      routeEpoch: 8,
      inputId: "proof-next-input",
      createdAt: "2026-09-26T01:02:00.000Z"
    });
    expect(database.recordResidentRecoveryProof(proof).replay).toBe(false);
    expect(database.recordResidentRecoveryProof(proof).replay).toBe(true);
    expect(() => assertResidentRecoveryProof({
      ...proof,
      createdAt: "2026-09-26T01:03:00.000Z"
    })).toThrow("identity is invalid");
    expect(() => assertResidentRecoveryProof({
      ...proof,
      stopObservation: {
        ...proof.stopObservation,
        evidence: { processGroupAbsent: false }
      }
    })).toThrow("seed identity is invalid");
    expect(() => bindResidentRecoveryProof({
      seed,
      newInvocationId: "proof-next-invocation",
      routeEpoch: 9,
      inputId: "proof-next-input",
      createdAt: "2026-09-26T01:02:00.000Z"
    })).toThrow("next fenced epoch");
    expect(() => database.consumeResidentRecoveryProof({
      projectId: state.id,
      proofId: proof.proofId,
      seedId: proof.seedId,
      sourceNodeRunId: proof.sourceNodeRunId,
      scopeId: proof.scopeId,
      agentId: proof.agentId,
      newInvocationId: proof.newInvocationId,
      routeEpoch: proof.routeEpoch,
      inputId: "another-input"
    })).toThrow("does not match this turn");
    expect(database.residentRecoveryProofForSeed(state.id, seed.seedId)).toEqual(proof);
    expect(database.consumeResidentRecoveryProof({
      projectId: state.id,
      proofId: proof.proofId,
      seedId: proof.seedId,
      sourceNodeRunId: proof.sourceNodeRunId,
      scopeId: proof.scopeId,
      agentId: proof.agentId,
      newInvocationId: proof.newInvocationId,
      routeEpoch: proof.routeEpoch,
      inputId: proof.inputId
    }).proof).toEqual(proof);
    expect(() => database.consumeResidentRecoveryProof({
      projectId: state.id,
      proofId: proof.proofId,
      seedId: proof.seedId,
      sourceNodeRunId: proof.sourceNodeRunId,
      scopeId: proof.scopeId,
      agentId: proof.agentId,
      newInvocationId: proof.newInvocationId,
      routeEpoch: proof.routeEpoch,
      inputId: proof.inputId
    })).toThrow("already consumed");
    expect(database.residentRecoverySeed({
      projectId: state.id,
      scope: "member",
      scopeId: "proof-execution"
    })).toBeUndefined();
    database.relinquishWriterLease();
    database.close();
  });

  it("continues automatic independent Main recovery beyond the fast retry limit", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-main-route-bounded-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_17171717171717171717171717171717");
    state.orchestration = {
      ...state.orchestration,
      agents: [{ name: "main", template: "main" }],
      input: { source: "input", target: "main" },
      routes: { main: [] },
      termination: { agent: "main", condition: "Main confirms completion" }
    };
    state.agents = { main: state.agents.main };
    state.runCounts = { main: 0 };
    state.tokenUsage.byAgent = { main: state.tokenUsage.byAgent.main! };
    await storage.createProject(state);
    let decisions = 0;
    let stopObservations = 0;
    const coordinator = new CollaborationRuntimeCoordinator({
      storage,
      serviceId: "main-route-bounded-test",
      hostId: "host-test",
      leaseDurationMs: 5_000,
      harnessRecoveryDelayMs: () => 10,
      gitFactory: (options) => happyGitFake(options, []),
      residentLauncher: {
        async open() { throw new Error("System Main must remain management-only"); },
        async decideRoute() {
          decisions += 1;
          throw new Error(`fixture Main crash ${decisions}`);
        },
        async observeMainRouteRecovery() {
          stopObservations += 1;
          return { stopped: true, evidence: { stopped: true } };
        }
      }
    });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    await coordinator.createProject(state, { enabled: true, provider: "github" });
    await waitFor(() => decisions >= 4 && state.status === "retrying");
    expect(stopObservations).toBeGreaterThanOrEqual(3);
    expect(state.workflowRecovery?.pending).toBe(true);
    expect(state.userIntervention).toBeUndefined();
    await coordinator.shutdown();
  });

  it("publishes one immutable workflow revision and treats an identical retry as a no-op", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-workflow-revision-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_99999999999999999999999999999999");
    await storage.createProject(state);
    const coordinator = new CollaborationRuntimeCoordinator({
      storage,
      serviceId: "workflow-revision-test",
      hostId: "host-test",
      leaseDurationMs: 5_000,
      gitFactory: (options) => initializationFake(options, [])
    });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    await coordinator.createProject(state, { enabled: true, provider: "github" });
    const orchestration = structuredClone(state.orchestration);
    orchestration.resultFormat = {
      presets: ["论文"],
      custom: "Revision two"
    };

    await expect(coordinator.saveWorkflowRevision(state, {
      orchestration,
      affectedGroupIds: [],
      requestId: "workflow-edit-retry"
    })).resolves.toBe(2);
    expect(state.workflowRevision).toBe(2);
    expect(state.orchestration.resultFormat?.custom).toBe("Revision two");
    await expect(coordinator.saveWorkflowRevision(state, {
      orchestration,
      affectedGroupIds: [],
      requestId: "workflow-edit-retry"
    })).resolves.toBe(2);
    expect(state.workflowRevision).toBe(2);
    const events = await storage.readEvents(state.id, 0, 1_000);
    expect(events.filter(
      (event) => event.data?.sourceType === "workflow.revision.created"
    )).toHaveLength(1);
    await coordinator.shutdown();
  });

  it("reconciles credential-bearing Agent configs after a workflow projection crash", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-workflow-projection-crash-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_19191919191919191919191919191919");
    const gatewaySnapshot = {
      id: "gwy_19191919191919191919191919191919",
      name: "Recovery gateway",
      url: "https://gateway.example.test/v1",
      apiKey: "server-only-recovery-secret",
      models: [state.agents.main.model],
      defaultModel: state.agents.main.model,
      protocol: "responses" as const,
      nativeProtocol: "responses" as const,
      routeMode: "direct" as const
    };
    state.agents.main.gatewayId = gatewaySnapshot.id;
    state.agents.main.gatewaySnapshot = gatewaySnapshot;
    state.agents.main.instructions = "Preserve this complete Main configuration.";
    state.agents.idea.instructions = "Preserve the surviving idea configuration.";
    await storage.createProject(state);
    const coordinator = new CollaborationRuntimeCoordinator({
      storage,
      serviceId: "workflow-projection-crash-test",
      hostId: "host-test",
      leaseDurationMs: 5_000,
      gitFactory: (options) => happyGitFake(options, [])
    });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    await coordinator.createProject(state, { enabled: true, provider: "github" });
    await waitFor(() => state.phase === "collaboration:resident-launcher-required");

    const revised = structuredClone(state.orchestration);
    revised.agents = revised.agents
      .filter((definition) => definition.name !== "review")
      .concat({ name: "synthesis", template: "writing" });
    revised.routes.main = (revised.routes.main ?? [])
      .filter((edge) => edge.target !== "review")
      .concat({ target: "synthesis", kind: "weak" });
    delete revised.routes.review;
    revised.routes.synthesis = [
      { target: "main", kind: "weak" },
      { target: "finish", kind: "weak" }
    ];
    delete revised.decisionPlans.review;
    revised.decisionPlans.synthesis = "Synthesize the accepted evidence.";
    revised.termination = {
      ...revised.termination,
      agent: "synthesis",
      condition: "Synthesis is accepted by Main."
    };
    if (revised.canvas) delete revised.canvas.nodes.review;

    const append = vi.spyOn(storage, "appendEvent");
    append.mockRejectedValueOnce(new Error("fixture state projection write failed"));
    await expect(coordinator.saveWorkflowRevision(state, {
      orchestration: revised,
      affectedGroupIds: [],
      requestId: "workflow-projection-crash"
    })).rejects.toThrow(/projection write failed/);
    append.mockRestore();
    await coordinator.shutdown();

    const restartedStorage = new ProjectStorage(root, new EventHub());
    await restartedStorage.initialize();
    const restartedState = await restartedStorage.loadState(state.id);
    expect(restartedState.workflowRevision).toBe(1);
    expect(restartedState.agents.review).toBeDefined();
    expect(restartedState.agents.synthesis).toBeUndefined();
    const restarted = new CollaborationRuntimeCoordinator({
      storage: restartedStorage,
      serviceId: "workflow-projection-crash-test",
      hostId: "host-test",
      leaseDurationMs: 5_000,
      gitFactory: (options) => happyGitFake(options, [])
    });
    if (restarted instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(restarted);
    await restarted.initialize();
    expect(await restarted.recoverProject(restartedState)).toBe(true);
    await waitFor(() => restartedState.phase === "collaboration:resident-launcher-required");

    expect(restartedState.workflowRevision).toBe(2);
    expect(restartedState.orchestration.agents.map(({ name }) => name)).toContain("synthesis");
    expect(restartedState.orchestration.agents.map(({ name }) => name)).not.toContain("review");
    expect(restartedState.agents.review).toBeUndefined();
    expect(restartedState.agents.main).toMatchObject({
      instructions: "Preserve this complete Main configuration.",
      gatewayId: gatewaySnapshot.id,
      gatewaySnapshot
    });
    expect(restartedState.agents.idea.instructions)
      .toBe("Preserve the surviving idea configuration.");
    expect(restartedState.agents.synthesis).toMatchObject({
      model: restartedState.agents.main.model,
      harness: restartedState.agents.main.harness,
      gatewayId: gatewaySnapshot.id,
      gatewaySnapshot
    });
    await restarted.shutdown();
  });

  it.each(["clean", "blocked", "shutdown"] as const)("gates ordinary delivery on the original Agent's pending files (%s)", async (mode) => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-ordinary-closing-")); temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub()); await storage.initialize();
    const state = projectState("prj_12121212121212121212121212121212");
    state.agents.idea.sessionPersistence = false;
    state.orchestration.input = { source: "input", target: "idea" };
    state.orchestration.routes = { idea: [{ target: "review", kind: "strong" }], review: [{ target: "finish", kind: "strong" }] };
    await storage.createProject(state);
    const order: string[] = [], opens: string[] = [];
    let pending = false, injected = false, repairs = 0;
    const file = "pending-owned-note.txt";
    const coordinator = new CollaborationRuntimeCoordinator({ storage, serviceId: "ordinary-closing-test", hostId: "host-test",
      harnessRecoveryDelayMs: () => 60_000, gitFactory: (options) => {
        const base = happyGitFake(options, order);
        return { ...base, async observeExecutionWorktree(owner, epoch, signal) {
          return { ...await base.observeExecutionWorktree!(owner, epoch, signal),
            pendingPaths: owner.agentId === "idea" && pending ? [file] : [] };
        } };
      },
      residentLauncher: { async stopForRecovery() { return { stopped: true, evidence: { processGroupAbsent: true } }; },
        async open(input) {
          opens.push(input.request.agent);
          if (input.request.agent === "review") expect(pending).toBe(false);
          return { async submit(turn) {
            if (input.request.agent !== "idea") return agentFixtureDelivery(input, turn, { handoff: "Reviewed delivery" }, coordinator);
            const fresh = await input.turnRequestFactory({ baseRequest: input.request, turn });
            if (!injected) {
              await fresh.request.onDurableSessionStarted!({ schemaVersion: 1, harnessId: "codex", adapterVersion: "1", generation: 0,
                nativeId: "ordinary-closing-session", durable: true, createdAt: new Date().toISOString() }, "ordinary-closing-session");
              const result = await agentFixtureDelivery(input, turn, { handoff: "Original result delivered" }, coordinator);
              if (mode !== "shutdown") {
                await fs.writeFile(path.join(input.request.workspacePath, file), "My disposable diagnostic after delivery");
                pending = injected = true;
              }
              return result;
            }
            repairs += 1;
            expect(fresh.request.resumeThreadId).toBe("ordinary-closing-session");
            expect(turn.prompt).toContain(file);
            expect(opens).not.toContain("review");
            const execution = coordinator.database().projectState(state.id).executions.find((e) => e.id === input.request.executionContext!.executionId)!;
            expect(execution.status).not.toBe("succeeded");
            expect(await fs.readFile(path.join(input.request.workspacePath, file), "utf8")).toContain("diagnostic");
            if (mode !== "blocked") { await fs.rm(path.join(input.request.workspacePath, file)); pending = false; }
            if (mode === "shutdown") {
              const proof = await agentFixtureRequests(input, turn, [{ tool: "github_get_pr" }, { tool: "github_merge_pr" },
                { tool: "finish_task", summary: "Original stopped task is now closed" }]);
              return { handoff: "Removed my diagnostic and verified original delivery", controlActions: proof.envelopes };
            }
            return { handoff: mode === "blocked" ? "Cannot close this file" : "Removed my own diagnostic; retained delivery is sufficient" };
          }, async pause() {}, async resume() {}, async close() {
            if (input.request.agent === "idea" && mode === "shutdown" && !injected) {
              await fs.writeFile(path.join(input.request.workspacePath, file), "My diagnostic during native shutdown");
              pending = injected = true;
            }
          } };
        }
      }
    });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    try {
      await coordinator.createProject(state, { enabled: true, provider: "github" });
      await waitFor(() => ["completed", "paused", "retrying"].includes(state.status));
      if (mode === "clean") { expect(state.status, state.lastError).toBe("completed"); expect(repairs).toBe(1); }
      else {
        expect(state.status).toBe(hasUserWorkflowPause(state) ? "paused" : "retrying"); expect(state.lastError).toContain(file);
        expect(opens).not.toContain("review");
        expect(coordinator.database().projectState(state.id).executions.some((e) => e.status === "succeeded")).toBe(false);
        expect(repairs).toBe(mode === "blocked" ? 2 : 0);
      }
      expect(order.filter((entry) => entry === "merge:idea")).toHaveLength(1);
      expect(order.filter((entry) => entry === "push-checkpoint:idea")).toHaveLength(1);
      if (mode === "shutdown") {
        const original = coordinator.database().projectState(state.id).executions.find((e) => e.agentId === "idea")!;
        await coordinator.resumeProject(state);
        await waitFor(() => state.status === "completed" || repairs > 0 && state.status === "retrying");
        expect(state.status, state.lastError).toBe("completed");
        expect(repairs).toBe(1);
        const recovered = coordinator.database().projectState(state.id).executions.find((e) => e.agentId === "idea")!;
        expect(recovered.id).toBe(original.id);
        expect(recovered.executionBranch).toBe(original.executionBranch);
        expect(opens).toEqual(["idea", "idea", "review"]);
        expect(order.filter((entry) => entry === "push-checkpoint:idea")).toHaveLength(1);
        expect(order.filter((entry) => entry === "pr:idea")).toHaveLength(1);
        expect(order.filter((entry) => entry === "merge:idea")).toHaveLength(1);
      }
    } finally { await coordinator.shutdown(); }
  }, 15_000);

  it("gates ordinary work on its PR and runs downstream Main as management-only without a PR", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-collaboration-pr-gate-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
    await storage.createProject(state);
    const order: string[] = [];
    const launches: AgentRunRequest[] = [];
    let reviewInbox = "";
    vi.spyOn(storage, "validateGitArtifactRecord").mockImplementation(
      async (verificationState, record) => {
        const execution = verificationState.executions?.find(
          (item) => item.id === record.gitSource?.executionId
        );
        if (!execution) throw new Error("fixture execution is missing");
        return storage.resolveExecutionArtifactCandidate(state.id, execution, record.path);
      }
    );
    const coordinator = new CollaborationRuntimeCoordinator({
      storage,
      serviceId: "pr-gate-test",
      hostId: "host-test",
      leaseDurationMs: 5_000,
      gitFactory: (options) => ({
        ...happyGitFake(options, order),
        async managementMemorySnapshot() {
          return {
            branch: "management/memory" as const,
            commitSha: "8".repeat(40),
            provenance: `OpenFARS management memory snapshot from management/memory@${"8".repeat(40)}`,
            entries: [
              {
                agentId: "review",
                path: "agent-memory/review/Memory.md",
                content: "REVIEW-OWN-MANAGEMENT-CONTEXT"
              },
              {
                agentId: "another-agent",
                path: "agent-memory/another-agent/Memory.md",
                content: "OTHER-AGENT-MANAGEMENT-MUST-NOT-ENTER-DELIVERY"
              }
            ],
            observedAt: new Date().toISOString()
          };
        }
      }),
      residentLauncher: {
        async open(input) {
          launches.push(input.request);
          if (input.request.agent === "review") {
            reviewInbox = await fs.readFile(input.request.inboxPath, "utf8");
          }
          expect(input.request.workspacePath).toBe(input.request.executionContext?.executionWorktree);
          expect(input.request.workspacePath).toContain(`${path.sep}git-worktrees${path.sep}`);
          return {
            async submit(turn) {
              expect(coordinator.laneAvailability(state.id)
                .find((lane) => lane.lane === "worker")?.occupied).toBe(1);
              order.push(`model:${input.request.agent}`);
              const reportPath = `${input.request.agent}-report.md`;
              await fs.writeFile(
                path.join(input.request.workspacePath, reportPath),
                `# Merged ${input.request.agent} evidence\n`
              );
              const authority = await input.controlAuthorityFactory!({
                request: input.request,
                turn
              });
              const envelope: ControlActionEnvelope = {
                projectId: state.id,
                agent: input.request.agent,
                invocationId: turn.invocationId,
                // A model may reuse a local call id in another execution. The
                // durable idempotency key must remain execution/epoch scoped.
                callId: "publish-shared-call",
                stateVersion: authority.control.stateVersion,
                capabilityHash: authority.control.capabilityHash,
                receivedAt: new Date().toISOString(),
                action: {
                  tool: "publish_artifact",
                  path: reportPath,
                  title: `${input.request.agent} evidence`,
                  kind: "document",
                  description: "Evidence accepted through the execution PR"
                }
              };
              await authority.revalidate(envelope, []);
              return agentFixtureDelivery(input, turn, {
                handoff: `${input.request.agent} delivered evidence`,
                controlActions: [envelope]
              }, coordinator);
            },
            async pause() {},
            async resume() {},
            async close() { order.push(`close:${input.request.agent}`); }
          };
        },
        async decideRoute(input) {
          expect(input.open.request.agent).toBe("main");
          expect(input.open.request.executionContext?.role).toBe("leader");
          expect(input.open.request.permission).toBe("workspace");
          expect(input.open.request.executionContext?.executionId).toBeUndefined();
          return input.candidates.includes("finish")
            ? agentFixtureMainDecision(input, {
                targetNodeId: "finish",
                decisionRequestId: "main-management-finish",
                output: "Main accepted the reviewed evidence"
              })
            : agentFixtureMainDecision(input, {
                targetNodeId: "review",
                decisionRequestId: "main-management-review",
                output: "Main transformed the idea evidence for review"
              });
        }
      }
    });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    await coordinator.createProject(state, { enabled: true, provider: "github" });
    await waitFor(() => state.status === "completed" || ["paused", "retrying"].includes(state.status));
    if (state.status !== "completed") {
      await coordinator.shutdown();
      throw new Error(JSON.stringify({ status: state.status, phase: state.phase, error: state.lastError,
        launches: launches.map((request) => request.agent), order }));
    }

    expect(launches.map((request) => request.agent)).toEqual(["idea", "review"]);
    expect(order.indexOf("merge:idea")).toBeGreaterThan(order.indexOf("model:idea"));
    expect(state.nodeRuns?.find((node) => node.node.nodeId === "idea")?.status).toBe("completed");
    expect(state.nodeRuns?.find((node) => node.node.nodeId === "main")?.status).toBe("completed");
    expect(state.nodeRuns?.find((node) => node.node.nodeId === "main")?.output)
      .toBe("Main transformed the idea evidence for review");
    expect(reviewInbox).toContain("Main transformed the idea evidence for review");
    expect(reviewInbox).not.toContain("REVIEW-OWN-MANAGEMENT-CONTEXT");
    expect(reviewInbox).not.toContain(`management/memory@${"8".repeat(40)}`);
    expect(reviewInbox).not.toContain("OTHER-AGENT-MANAGEMENT-MUST-NOT-ENTER-DELIVERY");
    expect(reviewInbox).not.toContain("idea delivered evidence");
    expect(state.executions?.filter((execution) => execution.status === "succeeded")).toHaveLength(2);
    expect(state.executions?.some((execution) => execution.agentId === "main")).toBe(false);
    expect(state.pullRequests?.every((pull) => pull.status === "merged")).toBe(true);
    expect(state.pullRequests).toHaveLength(2);
    expect(state.artifacts).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: expect.stringMatching(/^artifact_[a-f0-9]{64}$/),
        path: "idea-report.md",
        gitSource: expect.objectContaining({
          executionId: state.executions?.find((item) => item.agentId === "idea")?.id,
          ownershipEpoch: 1,
          commitSha: "b".repeat(40),
          acceptedBase: "main"
        })
      }),
      expect.objectContaining({
        id: expect.stringMatching(/^artifact_[a-f0-9]{64}$/),
        path: "review-report.md",
        gitSource: expect.objectContaining({
          executionId: state.executions?.find((item) => item.agentId === "review")?.id,
          ownershipEpoch: 1,
          commitSha: "c".repeat(40),
          acceptedBase: "main"
        })
      })
    ]));
    expect(state.artifacts).toHaveLength(2);
    const stagedPublications = (await storage.readEvents(state.id, 0, 10_000))
      .filter((event) => event.data?.sourceType === "artifact.publication.staged");
    expect(stagedPublications).toHaveLength(2);
    expect(new Set(stagedPublications.map((event) => event.requestId)).size).toBe(2);
    expect(state.collaboration?.routeOutbox).toEqual([
      expect.objectContaining({ targetNodeId: "main", status: "delivered", deliveryAttempts: 1 }),
      expect.objectContaining({ targetNodeId: "review", status: "delivered", deliveryAttempts: 1 }),
      expect.objectContaining({ targetNodeId: "finish", status: "delivered", deliveryAttempts: 1 })
    ]);
    await coordinator.shutdown();
  });

  it.each(["user_cancelled", "shutdown"] as const)("resumes the same pre-PR group owners after formal bulk Stop %s without a handoff", async (reason) => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-bulk-stop-original-owners-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub()); await storage.initialize();
    const state = projectState("prj_ddddddddddddddddddddddddddddddda");
    state.git = { enabled: true, status: "ready", provider: "github",
      repository: { owner: "fixture-owner", name: "bulk-stop", htmlUrl: "https://github.example/bulk-stop",
        private: true, defaultBranch: "main", localPath: path.join(root, "repository") } };
    state.status = "running";
    state.orchestration = { ...state.orchestration,
      collaborations: [{ id: "bulk-team", displayName: "Bulk Stop team", memberAgentIds: ["idea", "execution"], renamePolicy: "editable" }],
      input: { source: "input", target: "bulk-team" },
      routes: { ...state.orchestration.routes, "bulk-team": [{ target: "finish", kind: "strong" }] } };
    await storage.createProject(state);
    const order: string[] = [], opened: Array<{ id?: string; agent: string; epoch?: number; cwd: string }> = [];
    const managementPrompts: string[] = [];
    const coordinator = new CollaborationRuntimeCoordinator({ storage, serviceId: "bulk-stop-original-owner-test",
      hostId: "host-test", leaseDurationMs: 5_000, gitFactory: options => happyGitFake(options, order),
      residentLauncher: {
        async stopLeaderForRecovery() { return { stopped: true, evidence: { processGroupAbsent: true } }; },
        async stopForRecovery() { return { stopped: true, evidence: { processGroupAbsent: true, sessionNotPreviouslyCommitted: true } }; },
        async open(input) {
          const context = input.request.executionContext!;
          if (context.role !== "leader") opened.push({ id: context.executionId, agent: input.request.agent,
            epoch: context.ownershipEpoch, cwd: input.request.workspacePath });
          return { async pause() {}, async resume() {}, async close() {}, async submit(turn) {
            if (context.role !== "leader") return agentFixtureDelivery(input, turn, { handoff: `${input.request.agent} resumed its original task` }, coordinator);
            managementPrompts.push(turn.prompt);
            const group = coordinator.database().projectState(state.id).groupRuns.find(entry => entry.id === context.groupRunId)!;
            const action: ControlAction = group.status === "running"
              ? { tool: "request_group_integration", groupRunId: context.groupRunId!, coordinatorEpoch: context.coordinatorEpoch!, integrationOwnerAgentId: "idea" }
              : { tool: "complete_group", groupRunId: context.groupRunId!, coordinatorEpoch: context.coordinatorEpoch!, output: "Original tasks delivered after Stop/Resume" };
            const fresh = await input.turnRequestFactory({ baseRequest: input.request, turn });
            const authority = await input.controlAuthorityFactory!({ request: fresh.request, turn });
            const envelope: ControlActionEnvelope = { projectId: state.id, agent: fresh.request.agent, invocationId: turn.invocationId,
              callId: `bulk-leader-${turn.invocationId}`, stateVersion: authority.control.stateVersion,
              capabilityHash: authority.control.capabilityHash, receivedAt: new Date().toISOString(), action };
            return agentFixtureLeaderResult(input, turn, { handoff: "Original group completed", controlActions: [envelope] });
          } };
        }
      } });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    const database = coordinator.database();
    database.createProject({ projectId: state.id, workflowRevision: 1, workflowSnapshot: state.orchestration,
      git: state.git, workerCapacity: 2, managementCapacity: 1 });
    const repository = repositoryFact("bulk-stop");
    database.prepareOperation(state.id, { id: "bulk-repository", kind: "repository.create", payloadHash: "bulk-repository", status: "prepared" });
    database.transitionOperation(state.id, { id: "bulk-repository", payloadHash: "bulk-repository", status: "observed", remoteFact: repository });
    database.transitionOperation(state.id, { id: "bulk-repository", payloadHash: "bulk-repository", status: "finalized", remoteFact: repository });
    const activation = database.activateGroup({ projectId: state.id, nodeRunId: "bulk-node", groupRunId: "bulk-group",
      nodeId: "bulk-team", groupId: "bulk-team", activationRequestId: "activate-bulk", inputSnapshotRef: `project:${state.id}:requirement`,
      optionalTask: "Keep original work", memberAgentIds: ["idea", "execution"], origin: { kind: "project-input" },
      baseCommit: "a".repeat(40), groupBranch: "groups/bulk-group", workflowRevision: 1 });
    database.assignTasks({ projectId: state.id, groupRunId: activation.groupRun.id, actorAgentId: activation.groupRun.leaderAgentId,
      coordinatorEpoch: 1, tasks: ["idea", "execution"].map(agent => ({ id: `bulk-${agent}`, assignment: `Original ${agent} instructions`, assigneeAgentId: agent })) });
    const originals = ["idea", "execution"].map(agent => database.claimNextTask({ projectId: state.id,
      groupRunId: activation.groupRun.id, agentId: agent, executionId: `bulk-original-${agent}`, executionBranch: `executions/bulk-original-${agent}`,
      worktreePath: path.join(storage.projectDir(state.id), "git-worktrees", `bulk-original-${agent}`),
      invocationId: `inv_${agent === "idea" ? "1" : "2"}`.padEnd(36, "0"), residentLaunchProtocol: "trusted-supervisor-v1" })!);
    try {
      await coordinator.cancelProject(state, { actor: reason === "shutdown" ? "system" : "user", reason });
      expect(state).toMatchObject({ status: "paused", phase: "collaboration:user-cancelled" });
      expect(opened).toEqual([]);
      const stopped = database.projectState(state.id);
      expect(stopped.executions.every(execution => execution.status === "stopped")).toBe(true);
      expect(database.eventsAfter(state.id, 0).filter(event => event.type === "execution.stop_requested")).toEqual([]);
      await coordinator.resumeProject(state);
      await waitFor(() => state.status === "completed" || ["paused", "retrying"].includes(state.status), 15_000);
      expect(state.lastError, JSON.stringify({ opened, managementPrompts, tasks: state.tasks, executions: state.executions, order })).toBeUndefined();
      expect(state.status).toBe("completed");
      const after = database.projectState(state.id);
      for (const original of originals) {
        expect(after.executions.find(execution => execution.id === original.execution.id)).toMatchObject({
          agentId: original.execution.agentId, taskId: original.task.id, ownershipEpoch: 2, status: "succeeded",
          executionBranch: original.execution.executionBranch, worktreePath: original.execution.worktreePath });
        expect(opened.filter(turn => turn.id === original.execution.id)).toEqual([{ id: original.execution.id,
          agent: original.execution.agentId, epoch: 2, cwd: original.execution.worktreePath }]);
      }
      const events = database.eventsAfter(state.id, 0, 10_000);
      expect(events.filter(event => event.type === "execution.recovered" && originals.some(original => original.execution.id === event.executionId))).toHaveLength(2);
      expect(events.some(event => event.type === "execution.handed_off")).toBe(false);
      expect(managementPrompts.some(prompt => prompt.includes("Arrange the continuation now"))).toBe(false);
      expect(after.executions.filter(execution => execution.purpose === "delivery")).toHaveLength(2);
      expect(after.tasks.filter(task => originals.some(original => original.task.id === task.id)).map(task => task.assignment))
        .toEqual(stopped.tasks.map(task => task.assignment));
    } finally { await coordinator.shutdown(); }
  }, 20_000);

  it.each([false, true])("keeps retries of one Stop stable and a later Stop distinct from legacy=%s history", async (legacy) => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-repeat-group-stop-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub()); await storage.initialize();
    const state = projectState("prj_cccccccccccccccccccccccccccccccd");
    state.git = { enabled: true, status: "ready", provider: "github",
      capacity: { retainedWorktreeCount: 0, warningThreshold: 100 },
      repository: { owner: "fixture-owner", name: "repeat-stop", htmlUrl: "https://github.example/repeat-stop",
        private: true, defaultBranch: "main", localPath: path.join(root, "repository") } };
    state.status = "running";
    state.orchestration = { ...state.orchestration,
      collaborations: [{ id: "stop-team", displayName: "Stop team", memberAgentIds: ["idea", "execution"], renamePolicy: "editable" }],
      input: { source: "input", target: "stop-team" },
      routes: { ...state.orchestration.routes, "stop-team": [{ target: "finish", kind: "strong" }] } };
    state.agentSessions = { main: { schemaVersion: 1, harnessId: "codex", adapterVersion: "fixture",
      nativeId: "original-stop-session", generation: 2, durable: true, createdAt: "2026-09-27T00:00:00.000Z" } };
    state.agentSessionIds = { main: "original-stop-session" };
    await storage.createProject(state);
    const retained = structuredClone({ sessions: state.agentSessions, ids: state.agentSessionIds, git: state.git });
    let stopObservations = 0;
    const gitCalls: string[] = [];
    const coordinator = new CollaborationRuntimeCoordinator({ storage, serviceId: "repeat-stop-test",
      hostId: "host-test", leaseDurationMs: 5_000, gitFactory: (options) => happyGitFake(options, gitCalls),
      residentLauncher: { async open() { throw new Error("Stop does not open an Agent"); },
        async stopLeaderForRecovery() { stopObservations += 1; return { stopped: stopObservations > 1,
          evidence: { processGroupAbsent: stopObservations > 1 } }; } } });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    // Only the lifecycle is under test; Resume's normal business scheduling
    // is held so a second Stop examines the same retained group scene.
    const scheduling = vi.spyOn(coordinator as unknown as { scheduleProject(state: ProjectState): boolean }, "scheduleProject")
      .mockReturnValue(false);
    const database = coordinator.database();
    database.createProject({ projectId: state.id, workflowRevision: 1, workflowSnapshot: state.orchestration,
      git: state.git, workerCapacity: 2, managementCapacity: 1 });
    database.activateGroup({ projectId: state.id, nodeRunId: "repeat-stop-node", groupRunId: "repeat-stop-group",
      nodeId: "stop-team", groupId: "stop-team", activationRequestId: "activate-repeat-stop",
      inputSnapshotRef: `project:${state.id}:requirement`, optionalTask: "Preserve original work",
      memberAgentIds: ["idea", "execution"], origin: { kind: "project-input" },
      baseCommit: "a".repeat(40), groupBranch: "groups/repeat-stop-group", workflowRevision: 1 });
    const realRequest = database.requestGroupCancellation.bind(database);
    const legacyRequest = legacy ? vi.spyOn(database, "requestGroupCancellation").mockImplementation((input) =>
      realRequest({ ...input, requestId: `cancel-${state.id}` })) : undefined;
    try {
      await expect(coordinator.cancelProject(state, { actor: "user", reason: "user_cancelled" }))
        .rejects.toThrow("Cancellation awaits leader stop proof");
      const firstIntent = database.resumableProjectCancellationIntent(state.id)!;
      await expect(coordinator.resumeProject(state)).rejects.toThrow("before native stop is confirmed");
      await coordinator.cancelProject(state, { actor: "user", reason: "user_cancelled" });
      expect(database.resumableProjectCancellationIntent(state.id)!.seq).toBe(firstIntent.seq);
      expect(database.eventsAfter(state.id, 0, 100).filter((event) => event.type === "group.cancellation.requested")).toHaveLength(1);
      expect(state.status).toBe(hasUserWorkflowPause(state) ? "paused" : "retrying");
      legacyRequest?.mockRestore();
      await coordinator.resumeProject(state);
      expect(database.resumableProjectCancellationIntent(state.id)).toBeUndefined();
      await coordinator.cancelProject(state, { actor: "system", reason: "shutdown" });
      const secondIntent = database.resumableProjectCancellationIntent(state.id)!;
      expect(secondIntent.seq).toBeGreaterThan(firstIntent.seq);
      const groupStops = database.eventsAfter(state.id, 0, 100).filter((event) => event.type === "group.cancellation.requested");
      expect(groupStops).toHaveLength(2);
      expect(new Set(groupStops.map((event) => event.requestId)).size).toBe(2);
      expect(groupStops[1]!.requestId).toBe(`group-stop:${state.id}:repeat-stop-group:${secondIntent.seq}`);
      expect(groupStops.map((event) => event.payload.reason)).toEqual(["user_cancelled", "shutdown"]);
      expect(state).toMatchObject({ status: "paused", phase: "collaboration:user-cancelled" });
      expect(stopObservations).toBe(2);
      expect({ sessions: state.agentSessions, ids: state.agentSessionIds, git: state.git }).toEqual(retained);
      expect(gitCalls).toEqual([]);
    } finally { legacyRequest?.mockRestore(); scheduling.mockRestore(); await coordinator.shutdown(); }
  });

  it("retains an unresolved PR and the same execution through a stop-confirmed user pause", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-collaboration-waiting-pr-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_cccccccccccccccccccccccccccccccc");
    await storage.createProject(state);
    const order: string[] = [];
    let closed = 0;
    const coordinator = new CollaborationRuntimeCoordinator({
      storage,
      serviceId: "waiting-pr-test",
      hostId: "host-test",
      leaseDurationMs: 5_000,
      gitFactory: (options) => happyGitFake(options, order, false),
      residentLauncher: {
        async open(input) {
          return {
            async submit(turn) { return agentFixtureDelivery(input, turn, { handoff: "await review" }, coordinator); },
            async pause() {},
            async resume() {},
            async close() { closed += 1; }
          };
        }
      }
    });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    await coordinator.createProject(state, { enabled: true, provider: "github" });
    await waitFor(() =>
      state.phase === "collaboration:recovering" && state.executions?.[0]?.status === "pr_open"
    );
    expect(state.executions?.[0]?.status).toBe("pr_open");
    expect(coordinator.laneAvailability(state.id)
      .find((lane) => lane.lane === "worker")?.occupied).toBe(1);
    expect(closed).toBe(0);
    const staleResumeState = structuredClone(state);
    const priorExecution = structuredClone(state.executions![0]);
    const priorPull = structuredClone(state.pullRequests![0]);
    await coordinator.cancelProject(state, { actor: "user", reason: "user_cancelled" });
    expect(closed).toBe(1);
    expect(state).toMatchObject({ status: "paused", phase: "collaboration:user-cancelled" });
    expect(state.nodeRuns?.[0]?.status).toBe("running");
    expect(state.executions![0]).toMatchObject({ id: priorExecution.id, executionBranch: priorExecution.executionBranch,
      worktreePath: priorExecution.worktreePath, status: "stopped" });
    expect(coordinator.database().eventsAfter(state.id, 0, 10_000).some((event) =>
      event.executionId === priorExecution.id && event.type === "execution.stop_confirmed")).toBe(true);
    expect(state.pullRequests![0]).toEqual(priorPull);
    expect(coordinator.laneAvailability(state.id)
      .find((lane) => lane.lane === "worker")?.occupied).toBe(0);
    const executionCount = state.executions?.length;
    await expect(coordinator.resumeProject(staleResumeState)).resolves.toBeUndefined();
    expect(coordinator.database().projectCancellationIntent(state.id)).toBeUndefined();
    expect((await storage.loadState(state.id)).status).toBe("queued");
    expect(state.executions).toHaveLength(executionCount ?? 0);
    await coordinator.shutdown();
  });

  it("does not fabricate stop evidence or settle cancellation when resident close fails", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-collaboration-cancel-proof-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_33333333333333333333333333333333");
    await storage.createProject(state);
    const order: string[] = [];
    let closeCalls = 0;
    const coordinator = new CollaborationRuntimeCoordinator({
      storage,
      serviceId: "cancel-proof-test",
      hostId: "host-test",
      leaseDurationMs: 5_000,
      gitFactory: (options) => happyGitFake(options, order, false),
      residentLauncher: {
        async open(input) {
          return {
            async submit(turn) { return agentFixtureDelivery(input, turn, { handoff: "await review" }, coordinator); },
            async pause() {},
            async resume() {},
            async close() {
              closeCalls += 1;
              if (closeCalls === 1) throw new Error("fixture PGID still alive");
            }
          };
        }
      }
    });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    await coordinator.createProject(state, { enabled: true, provider: "github" });
    await waitFor(() => state.executions?.[0]?.status === "pr_open");

    await expect(coordinator.cancelProject(state, {
      actor: "user",
      reason: "user_cancelled"
    })).rejects.toThrow();
    expect(state.status).not.toBe("cancelled");
    expect(state.executions?.[0]?.status).toBe("stop_requested");
    expect(deriveProjectRuntimeProjection(coordinator.database().projectState(state.id), {
      status: "paused", phase: "collaboration:user-cancelled"
    }).status).toBe("cancelling");
    expect(state.pullRequests?.[0]?.status).toBe("open");
    expect(coordinator.laneAvailability(state.id)
      .find((lane) => lane.lane === "worker")?.occupied).toBe(1);
    await expect(coordinator.resumeProject(state)).rejects.toThrow(/before native stop is confirmed/);
    await storage.saveState({ ...state, status: "paused", phase: "collaboration:user-cancelled" });
    // A stale file cannot authorize Resume while S still awaits physical Stop.
    await expect(coordinator.resumeProject(state)).rejects.toThrow(/before native stop is confirmed/);
    // A failed stop proof leaves durable cancellation state in place, but the
    // in-memory reentrancy guard must not swallow an explicit retry.
    await coordinator.cancelProject(state, {
      actor: "user",
      reason: "user_cancelled"
    });
    expect(closeCalls).toBe(2);
    expect(state).toMatchObject({ status: "paused", phase: "collaboration:user-cancelled" });
    expect(deriveProjectRuntimeProjection(coordinator.database().projectState(state.id), {
      status: "cancelling", phase: "collaboration:cancelling"
    })).toMatchObject({ status: "paused", phase: "collaboration:user-cancelled" });
    expect(state.pullRequests?.[0]?.status).toBe("open");
    expect(coordinator.laneAvailability(state.id)
      .find((lane) => lane.lane === "worker")?.occupied).toBe(0);
    await coordinator.shutdown();
  });

  it("settles orphan cancellation only after a later confirmed recovery stop", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-cancel-recovery-proof-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_dededededededededededededededede");
    state.git = {
      enabled: true,
      status: "ready",
      provider: "github",
      repository: {
        owner: "fixture-owner",
        name: "cancel-recovery-proof",
        htmlUrl: "https://github.example/cancel-recovery-proof",
        private: true,
        defaultBranch: "main",
        localPath: path.join(root, "repository")
      }
    };
    state.status = "cancelling";
    state.phase = "collaboration:cancelling";
    state.cancelledBy = "user";
    state.cancelReason = "user_cancelled";
    state.cancellationRequestedAt = new Date().toISOString();
    await storage.createProject(state);

    const databasePath = path.join(root, "collaboration.sqlite");
    const seed = CollaborationStateDatabase.open({
      databasePath,
      serviceId: "cancel-recovery-seed",
      instanceId: "cancel-recovery-seed-instance",
      hostId: "host-test",
      topology: "single-host"
    });
    seed.createProject({
      projectId: state.id,
      workflowRevision: 1,
      workflowSnapshot: state.orchestration,
      git: state.git,
      workerCapacity: 2,
      managementCapacity: 1
    });
    const repository = repositoryFact("cancel-recovery-proof");
    seed.prepareOperation(state.id, {
      id: "operation-repository-cancel-recovery",
      kind: "repository.create",
      payloadHash: "repository-cancel-recovery",
      status: "prepared"
    });
    seed.transitionOperation(state.id, {
      id: "operation-repository-cancel-recovery",
      payloadHash: "repository-cancel-recovery",
      status: "observed",
      remoteFact: repository
    });
    seed.transitionOperation(state.id, {
      id: "operation-repository-cancel-recovery",
      payloadHash: "repository-cancel-recovery",
      status: "finalized",
      remoteFact: repository
    });
    seed.activateNode({
      projectId: state.id,
      nodeRunId: "cancel-recovery-node",
      node: { kind: "agent", nodeId: "idea", agentId: "idea" },
      activationRequestId: "activate-cancel-recovery",
      inputSnapshotRef: `project:${state.id}:requirement`,
      optionalTask: "Retain work until cancellation is stop-confirmed",
      activatedByAgentId: "main",
      workflowRevision: 1
    });
    seed.startStandaloneExecution({
      projectId: state.id,
      nodeRunId: "cancel-recovery-node",
      taskId: "cancel-recovery-task",
      executionId: "cancel-recovery-execution",
      agentId: "idea",
      assignment: "Retain work until cancellation is stop-confirmed",
      executionBranch: "executions/cancel-recovery-execution",
      worktreePath: path.join(
        root,
        "projects",
        state.id,
        "git-worktrees",
        "cancel-recovery-execution"
      ),
      invocationId: `inv_${"d".repeat(32)}`
    });
    seed.relinquishWriterLease();
    seed.close();

    let stopObservations = 0;
    const coordinator = new CollaborationRuntimeCoordinator({
      storage,
      databasePath,
      serviceId: "cancel-recovery-service",
      hostId: "host-test",
      gitFactory: (options) => happyGitFake(options, []),
      residentLauncher: {
        async stopForRecovery(input) {
          stopObservations += 1;
          expect(input.execution).toMatchObject({
            id: "cancel-recovery-execution",
            ownershipEpoch: 1
          });
          return stopObservations === 1
            ? { stopped: false, evidence: { processStillPresent: true } }
            : { stopped: true, evidence: { processGroupAbsent: true } };
        },
        async open() {
          throw new Error("Cancellation recovery must not open a successor resident");
        }
      }
    });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();

    await expect(coordinator.recoverProject(state)).rejects.toThrow(
      "Cancellation awaits stop proof for execution cancel-recovery-execution"
    );
    expect(state.status).toBe("cancelling");
    expect(state.executions).toEqual([
      expect.objectContaining({
        id: "cancel-recovery-execution",
        ownershipEpoch: 1,
        status: "stop_requested"
      })
    ]);

    expect(await coordinator.recoverProject(state)).toBe(true);
    expect(stopObservations).toBe(2);
    expect(state).toMatchObject({ status: "paused", phase: "collaboration:user-cancelled" });
    expect(coordinator.database().resumableProjectCancellationIntent(state.id)).toBeDefined();
    expect(deriveProjectRuntimeProjection(coordinator.database().projectState(state.id))).toMatchObject({
      status: "paused", phase: "collaboration:user-cancelled"
    });
    expect(state.executions).toEqual([
      expect.objectContaining({
        id: "cancel-recovery-execution",
        ownershipEpoch: 1,
        status: "stopped"
      })
    ]);
    await coordinator.shutdown();
  });

  it("preserves uncertain Git operations and remote PR truth while stop-confirming a restarted user pause", async () => {
    for (const remoteStatus of ["open", "merged"] as const) {
      const root = await fs.mkdtemp(path.join(os.tmpdir(), `openfars-cancel-lost-pr-${remoteStatus}-`));
      temporaryRoots.push(root);
      const storage = new ProjectStorage(root, new EventHub());
      await storage.initialize();
      const state = projectState(remoteStatus === "open"
        ? "prj_10101010101010101010101010101010"
        : "prj_20202020202020202020202020202020");
      state.git = {
        enabled: true,
        status: "ready",
        provider: "github",
        repository: {
          owner: "fixture-owner",
          name: `cancel-lost-${remoteStatus}`,
          htmlUrl: `https://github.example/cancel-lost-${remoteStatus}`,
          private: true,
          defaultBranch: "main",
          localPath: path.join(root, "repository")
        },
        initialization: {
          operationId: `git-init-${state.id}`,
          attempt: 1,
          completedSteps: ["github.authorized", "remote.main.observed"]
        }
      };
      state.status = "cancelling";
      state.phase = "collaboration:cancelling";
      state.cancellationRequestedAt = new Date().toISOString();
      state.cancelledBy = "user";
      state.cancelReason = "user_cancelled";
      state.orchestration = {
        ...state.orchestration,
        input: { source: "input", target: "idea" },
        routes: { ...state.orchestration.routes, idea: [{ target: "finish", kind: "strong" }] }
      };
      await storage.createProject(state);
      const databasePath = path.join(root, "collaboration.sqlite");
      const seed = CollaborationStateDatabase.open({
        databasePath,
        serviceId: `cancel-lost-seed-${remoteStatus}`,
        instanceId: `cancel-lost-seed-instance-${remoteStatus}`,
        hostId: "host-test",
        topology: "single-host"
      });
      seed.createProject({
        projectId: state.id,
        workflowRevision: 1,
        workflowSnapshot: state.orchestration,
        git: state.git,
        workerCapacity: 1,
        managementCapacity: 1
      });
      const repository = repositoryFact(`cancel-lost-${remoteStatus}`);
      seed.prepareOperation(state.id, {
        id: `repository-cancel-lost-${remoteStatus}`,
        kind: "repository.create",
        payloadHash: `repository-cancel-lost-${remoteStatus}`,
        status: "prepared"
      });
      seed.transitionOperation(state.id, {
        id: `repository-cancel-lost-${remoteStatus}`,
        payloadHash: `repository-cancel-lost-${remoteStatus}`,
        status: "observed",
        remoteFact: repository
      });
      seed.transitionOperation(state.id, {
        id: `repository-cancel-lost-${remoteStatus}`,
        payloadHash: `repository-cancel-lost-${remoteStatus}`,
        status: "finalized",
        remoteFact: repository
      });
      const nodeRunId = `cancel-lost-node-${remoteStatus}`;
      const executionId = `cancel-lost-execution-${remoteStatus}`;
      seed.activateNode({
        projectId: state.id,
        nodeRunId,
        node: { kind: "agent", nodeId: "idea", agentId: "idea" },
        activationRequestId: `activate-cancel-lost-${remoteStatus}`,
        inputSnapshotRef: `project:${state.id}:requirement`,
        optionalTask: "Cancel the lost-response pull",
        activatedByAgentId: "main",
        workflowRevision: 1
      });
      seed.startStandaloneExecution({
        projectId: state.id,
        nodeRunId,
        taskId: `cancel-lost-task-${remoteStatus}`,
        executionId,
        agentId: "idea",
        assignment: "Cancel the lost-response pull",
        executionBranch: `executions/${executionId}`,
        worktreePath: path.join(storage.projectDir(state.id), "git-worktrees", executionId),
        invocationId: `inv_${(remoteStatus === "open" ? "1" : "2").repeat(32)}`
      });
      seed.prepareOperation(state.id, {
        id: `pull-${executionId}`,
        kind: "pull.create",
        payloadHash: `lost-pull-${remoteStatus}`,
        status: "prepared",
        ownerExecutionId: executionId,
        ownershipEpoch: 1,
        expectedHead: "b".repeat(40),
        expectedBase: "main"
      });
      seed.relinquishWriterLease();
      seed.close();

      let remotePull: GitHubPullRequestFact = {
        ...pullFact(80 + (remoteStatus === "open" ? 1 : 2), executionId,
          `executions/${executionId}`, "main", "b".repeat(40), remoteStatus),
        ...(remoteStatus === "merged" ? { mergeCommitSha: "d".repeat(40) } : {})
      };
      let discoveries = 0;
      let closes = 0;
      let opens = 0;
      const coordinator = new CollaborationRuntimeCoordinator({
        storage,
        databasePath,
        serviceId: `cancel-lost-runtime-${remoteStatus}`,
        hostId: "host-test",
        gitFactory: (options) => {
          const base = happyGitFake(options, []);
          return {
            ...base,
            async observePullRequestForExecution() {
              discoveries += 1;
              return structuredClone(remotePull);
            },
            async observePullRequest() {
              return structuredClone(remotePull);
            },
            async closePullRequest() {
              closes += 1;
              remotePull = { ...remotePull, status: "closed", observedAt: new Date().toISOString() };
              return structuredClone(remotePull);
            }
          };
        },
        residentLauncher: {
          async stopForRecovery() {
            return { stopped: true, evidence: { processGroupAbsent: true } };
          },
          async open() {
            opens += 1;
            throw new Error("cancellation must not open a resident");
          }
        }
      });
      if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
      await coordinator.initialize();
      expect(await coordinator.recoverProject(state)).toBe(true);
      expect(state).toMatchObject({ status: "paused", phase: "collaboration:user-cancelled" });
      expect(coordinator.database().resumableProjectCancellationIntent(state.id)).toBeDefined();
      expect(discoveries).toBe(0);
      expect(closes).toBe(0);
      expect(opens).toBe(0);
      expect(remotePull.status).toBe(remoteStatus);
      expect(state.pullRequests).toEqual([]);
      await coordinator.shutdown();

      const inspection = CollaborationStateDatabase.open({
        databasePath,
        serviceId: `cancel-lost-inspection-${remoteStatus}`,
        instanceId: `cancel-lost-inspection-instance-${remoteStatus}`,
        hostId: "host-test",
        topology: "single-host"
      });
      const events = inspection.eventsAfter(state.id, 0, 100_000);
      const observedIndex = events.findIndex((event) =>
        event.executionId === executionId && event.type.startsWith("pull_request.")
      );
      const terminalIndex = events.findIndex((event) =>
        event.executionId === executionId && event.type === "execution.terminal_stop.prepared"
      );
      const stoppedIndex = events.findIndex((event) =>
        event.executionId === executionId && event.type === "execution.stop_confirmed"
      );
      expect(observedIndex).toBe(-1);
      expect(terminalIndex).toBe(-1);
      expect(stoppedIndex).toBeGreaterThanOrEqual(0);
      expect(inspection.projectState(state.id).operations.find((operation) => operation.id === `pull-${executionId}`)?.status).toBe("prepared");
      inspection.relinquishWriterLease();
      inspection.close();
    }
  });

  it("repairs a conflicted standalone PR in the same resident and ownership epoch", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-collaboration-conflict-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_ffffffffffffffffffffffffffffffff");
    state.orchestration = {
      ...state.orchestration,
      routes: { ...state.orchestration.routes, idea: [{ target: "finish", kind: "strong" }] }
    };
    await storage.createProject(state);
    const order: string[] = [];
    let opens = 0;
    let submits = 0;
    let closes = 0;
    const coordinator = new CollaborationRuntimeCoordinator({
      storage,
      serviceId: "conflict-test",
      hostId: "host-test",
      leaseDurationMs: 5_000,
      gitFactory: (options) => happyGitFake(options, order, true, true),
      residentLauncher: {
        async open(input) {
          opens += 1;
          return {
            async submit(turn) {
              submits += 1;
              return agentFixtureDelivery(input, turn, { handoff: "conflict repaired by the original Agent" }, coordinator,
                async (preparation: any) => {
                  expect(preparation).toMatchObject({ status: "conflicted", conflictPaths: ["conflicted.txt"] });
                  await fs.writeFile(path.join(input.request.workspacePath, "conflicted.txt"), "Resolved by the original Agent\n");
                });
            },
            async pause() {},
            async resume() {},
            async close() { closes += 1; }
          };
        }
      }
    });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    await coordinator.createProject(state, { enabled: true, provider: "github" });
    await waitFor(() => state.status === "completed");

    expect(opens).toBe(1);
    expect(submits).toBe(1);
    expect(closes).toBe(1);
    expect(order).toContain("prepare-conflict:idea");
    expect(order.filter((item) => item === "push-checkpoint:idea")).toHaveLength(2);
    expect(state.pullRequests).toHaveLength(1);
    expect(order.filter((item) => item === "merge:idea")).toHaveLength(2);
    expect(state.executions?.[0]).toMatchObject({ status: "succeeded", ownershipEpoch: 1 });
    await coordinator.shutdown();
  });

  it("records not_committed and refuses to create a PR when the Harness leaves HEAD unchanged", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-not-committed-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_56565656565656565656565656565656");
    state.orchestration = {
      ...state.orchestration,
      routes: { ...state.orchestration.routes, idea: [{ target: "finish", kind: "strong" }] }
    };
    await storage.createProject(state);
    let pullRequests = 0;
    const repairPrompts: string[] = [];
    const coordinator = new CollaborationRuntimeCoordinator({
      storage,
      serviceId: "not-committed-test",
      hostId: "host-test",
      leaseDurationMs: 5_000,
      gitFactory: (options) => {
        const base = happyGitFake(options, []);
        return {
          ...base,
          async checkpointAndPush(request) {
            return {
              checkpoint: {
                projectId: path.basename(options.projectRoot),
                executionId: request.execution.id,
                ownershipEpoch: request.execution.ownershipEpoch,
                branch: request.execution.executionBranch,
                worktreePath: request.execution.worktreePath,
                head: "a".repeat(40),
                commitSha: "a".repeat(40),
                changed: false,
                retained: true,
                observedAt: new Date().toISOString()
              }
            };
          },
          async createPullRequest(request) {
            pullRequests += 1;
            return base.createPullRequest(request);
          }
        };
      },
      residentLauncher: {
        async open(input) {
          return {
            async submit(turn) {
              if (turn.prompt.includes("Missing formal mechanism actions:")) repairPrompts.push(turn.prompt);
              const requested = await agentFixtureRequests(input, turn, [
                { tool: "git_push", reason: "Inspect the actual push result" }
              ]);
              expect(requested.results[0]).toMatchObject({ status: "not_committed", checkpoint: { changed: false } });
              return { handoff: "worktree changed but was not committed", controlActions: requested.envelopes };
            },
            async pause() {},
            async resume() {},
            async close() {}
          };
        }
      }
    });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    await coordinator.createProject(state, { enabled: true, provider: "github" });
    await waitFor(() => ["paused", "retrying"].includes(state.status) && state.phase === "collaboration:recovering");

    expect(state.lastError).toContain("not_committed");
    expect(repairPrompts).toHaveLength(2);
    for (const prompt of repairPrompts) {
      expect(prompt).toContain("git_stage and git_commit are provided by the filesystem-authority MCP");
      expect(prompt).toContain("existing tool discovery within current permissions");
      expect(prompt).toContain("does not prove Git success");
    }
    expect(pullRequests).toBe(0);
    expect(state.pullRequests ?? []).toHaveLength(0);
    expect(coordinator.database().eventsAfter(state.id, 0, 10_000).some((event) =>
      event.type === "execution.git_stage.persisted" && event.payload.stage === "not_committed"
    )).toBe(true);
    await coordinator.shutdown();
  });

  it("does not terminalize or route a merged standalone execution until resident stop is confirmed", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-collaboration-close-gate-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_12121212121212121212121212121212");
    state.orchestration = {
      ...state.orchestration,
      routes: { ...state.orchestration.routes, idea: [{ target: "finish", kind: "strong" }] }
    };
    await storage.createProject(state);
    const order: string[] = [];
    let submits = 0;
    let closes = 0;
    const coordinator = new CollaborationRuntimeCoordinator({
      storage,
      serviceId: "close-gate-test",
      hostId: "host-test",
      leaseDurationMs: 5_000,
      gitFactory: (options) => happyGitFake(options, order),
      residentLauncher: {
        async open(input) {
          return {
            async submit(turn) {
              submits += 1;
              return agentFixtureDelivery(input, turn, { handoff: "merged but process must stop" }, coordinator);
            },
            async pause() {},
            async resume() {},
            async close() {
              closes += 1;
              if (closes === 1) throw new Error("fixture process remains alive");
            }
          };
        }
      }
    });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    await coordinator.createProject(state, { enabled: true, provider: "github" });
    await waitFor(() => ["paused", "retrying"].includes(state.status) && closes === 1);

    expect(state.executions?.[0]?.status).not.toBe("succeeded");
    expect(state.nodeRuns?.[0]?.status).not.toBe("completed");
    expect(state.collaboration?.routeOutbox).toEqual([]);
    await coordinator.resumeProject(state);
    await waitFor(() => state.status === "completed" || Boolean(state.lastError));
    expect(state.lastError).toBeUndefined();

    expect(submits).toBe(1);
    expect(closes).toBe(2);
    expect(order.filter((item) => item === "pr:idea")).toHaveLength(1);
    expect(state.executions?.[0]).toMatchObject({ status: "succeeded", ownershipEpoch: 1 });
    expect(state.collaboration?.routeOutbox).toEqual([
      expect.objectContaining({ targetNodeId: "finish", status: "delivered" })
    ]);
    await coordinator.shutdown();
  });

  it("preserves an ordinary Agent-owned weak route through its fenced resident action", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-collaboration-agent-route-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_11111111111111111111111111111111");
    state.agents.idea.decisionBy = "agent";
    state.orchestration = {
      ...state.orchestration,
      routes: {
        ...state.orchestration.routes,
        idea: [
          { target: "execution", kind: "weak" },
          { target: "writing", kind: "weak" }
        ]
      }
    };
    await storage.createProject(state);
    const order: string[] = [];
    const coordinator = new CollaborationRuntimeCoordinator({
      storage,
      serviceId: "agent-route-test",
      hostId: "host-test",
      leaseDurationMs: 5_000,
      gitFactory: (options) => happyGitFake(options, order),
      residentLauncher: {
        async open(input) {
          return {
            async submit(turn) {
              if (input.request.agent !== "idea") {
                return agentFixtureDelivery(input, turn, { handoff: `${input.request.agent} output` }, coordinator);
              }
              expect(input.controlAuthorityFactory).toBeTypeOf("function");
              const fresh = await input.turnRequestFactory({ baseRequest: input.request, turn });
              const authority = await input.controlAuthorityFactory!({ request: fresh.request, turn });
              const envelope = {
                projectId: state.id,
                agent: "idea" as const,
                invocationId: turn.invocationId,
                callId: `route-${turn.invocationId}`,
                stateVersion: authority.control.stateVersion,
                capabilityHash: authority.control.capabilityHash,
                receivedAt: new Date().toISOString(),
                action: {
                  tool: "route_to_agent" as const,
                  target: "writing",
                  rationale: "Writing is the correct next specialist"
                }
              };
              await authority.revalidate(envelope, []);
              return agentFixtureDelivery(input, turn, { handoff: "idea output", controlActions: [envelope] }, coordinator);
            },
            async pause() {},
            async resume() {},
            async close() {}
          };
        }
      }
    });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    await coordinator.createProject(state, { enabled: true, provider: "github" });
    await waitFor(() => state.phase === "collaboration:main-route-required");

    expect(state.nodeRuns?.some((node) => node.node.nodeId === "writing")).toBe(true);
    expect(state.nodeRuns?.some((node) => node.node.nodeId === "execution")).toBe(false);
    expect(state.collaboration?.routeOutbox[0]).toMatchObject({
      targetNodeId: "writing",
      decisionKind: "weak",
      status: "delivered"
    });
    const routeEvent = (await storage.readEvents(state.id, 0, 1_000))
      .find((event) => event.data?.sourceType === "execution.route.selected");
    expect(routeEvent?.data).toMatchObject({ targetNodeId: "writing" });
    await coordinator.shutdown();
  });

  it.each([false, true])("keeps fixed Main-to-group scope protected with a project directory alias %s", async (withAlias) => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-main-direct-group-"));
    temporaryRoots.push(root);
    let storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_41414141414141414141414141414141");
    state.orchestration = {
      ...state.orchestration,
      collaborations: [{
        id: "main-direct-team",
        memberAgentIds: ["idea", "execution"]
      }],
      input: { source: "input", target: "main" },
      routes: {
        ...state.orchestration.routes,
        main: [{ target: "main-direct-team", kind: "strong" }],
        "main-direct-team": [{ target: "finish", kind: "strong" }]
      }
    };
    await storage.createProject(state);
    const physicalProjectDirectory = storage.projectDir(state.id);
    if (withAlias) {
      const originalData = `${root}-original`;
      temporaryRoots.push(originalData);
      await fs.symlink(root, originalData, process.platform === "win32" ? "junction" : "dir");
      storage = new ProjectStorage(root, new EventHub(), { projectDirectoryAliases: {
        [state.id]: path.join(originalData, "projects", state.id)
      } });
      await storage.initialize();
    }
    const coordinator = new CollaborationRuntimeCoordinator({
      storage,
      serviceId: "main-direct-group-test",
      hostId: "host-test",
      leaseDurationMs: 5_000,
      gitFactory: (options) => happyGitFake(options, []),
      residentLauncher: {
        async open(input) {
          expect(input.request.executionContext?.role).toBe("leader");
          expect(input.request.agent).toBe("main");
          return blockingResident(input.signal);
        },
        async decideRoute(input) {
          expect(input.sourceAgentId).toBe("main");
          expect(input.open.filesystemAuthorityInput.protectedRoots).toEqual(
            [...new Set([physicalProjectDirectory, storage.projectDir(state.id)])].flatMap((projectRoot) =>
              ["state.json", "events.jsonl", "messages", "runtime", "repository"].map((name) => path.join(projectRoot, name)))
          );
          const worktreeRoot = input.open.filesystemAuthorityInput.projectWorktreeRoot;
          const worktreeRootInfo = await fs.lstat(worktreeRoot);
          expect(worktreeRootInfo.isDirectory()).toBe(true);
          expect(worktreeRootInfo.isSymbolicLink()).toBe(false);
          expect(worktreeRoot).toBe(
            await fs.realpath(path.join(storage.projectDir(state.id), "git-worktrees"))
          );
          return agentFixtureMainDecision(input, {
            targetNodeId: "main-direct-team",
            decisionRequestId: "main-direct-team-decision"
          });
        }
      }
    });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    await coordinator.createProject(state, { enabled: true, provider: "github" });
    await waitFor(() => state.groupRuns?.length === 1 || Boolean(state.lastError));
    if (withAlias) {
      // Directory identity alone does not authorize traversing symlinks in
      // native inputs. A deployment must retain the original path with a
      // real directory bind; do not weaken the existing staging boundary.
      expect(state.lastError).toMatch(/snapshot traverses an untrusted directory/);
      expect(state.groupRuns ?? []).toHaveLength(0);
      await coordinator.shutdown();
      return;
    }
    expect(state.lastError).toBeUndefined();

    const group = state.groupRuns![0]!;
    const node = state.nodeRuns?.find((entry) => entry.id === group.nodeRunId);
    expect(group.leaderAgentId).toBe("main");
    expect(node).toMatchObject({
      activatedByAgentId: "main",
      sourceNodeRunId: expect.any(String)
    });
    expect(node?.sourceAgentId).toBeUndefined();
    expect(await groupActivationOriginEvent(storage, state.id, "main-direct-team"))
      .toMatchObject({ kind: "main-direct", sourceNodeRunId: node?.sourceNodeRunId });
    expect(state.collaboration?.routeOutbox[0]).toMatchObject({
      decisionKind: "fixed",
      status: "delivered",
      targetNodeId: "main-direct-team"
    });
    await coordinator.shutdown();
  });

  it("keeps an ordinary source while Main selects its weak route into a group", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-main-selected-group-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_42424242424242424242424242424242");
    state.agents.idea.decisionBy = "main";
    state.orchestration = {
      ...state.orchestration,
      collaborations: [{
        id: "main-selected-team",
        memberAgentIds: ["execution", "review"]
      }],
      routes: {
        ...state.orchestration.routes,
        idea: [
          { target: "main-selected-team", kind: "weak" },
          { target: "writing", kind: "weak" }
        ],
        "main-selected-team": [{ target: "finish", kind: "strong" }]
      }
    };
    await storage.createProject(state);
    const coordinator = new CollaborationRuntimeCoordinator({
      storage,
      serviceId: "main-selected-group-test",
      hostId: "host-test",
      leaseDurationMs: 5_000,
      gitFactory: (options) => happyGitFake(options, []),
      residentLauncher: {
        async open(input) {
          if (input.request.executionContext?.role === "leader") {
            expect(input.request.agent).toBe("main");
            return {
              async submit(turn) {
                const fresh = await input.turnRequestFactory({ baseRequest: input.request, turn });
                const authority = await input.controlAuthorityFactory!({
                  request: fresh.request,
                  turn
                });
                const action = {
                  tool: "assign_group_tasks" as const,
                  groupRunId: input.request.executionContext!.groupRunId!,
                  coordinatorEpoch: input.request.executionContext!.coordinatorEpoch!,
                  tasks: [{
                    taskId: "task-taskless-main-selected",
                    assignment: "Implement the work derived from the shared current state.",
                    assigneeAgentId: "execution"
                  }]
                };
                const envelope = {
                  projectId: state.id,
                  agent: "main" as const,
                  invocationId: turn.invocationId,
                  callId: "assign-taskless-main-selected",
                  stateVersion: authority.control.stateVersion,
                  capabilityHash: authority.control.capabilityHash,
                  receivedAt: new Date().toISOString(),
                  action
                };

                return agentFixtureLeaderResult(input, turn, { handoff: "Leader assigned the first delivery batch", controlActions: [envelope] });
              },
              async pause() {},
              async resume() {},
              async close() {}
            };
          }
          if (input.request.agent !== "idea") return blockingResident(input.signal);
          return {
            async submit(turn) { return agentFixtureDelivery(input, turn, { handoff: "ordinary source result" }, coordinator); },
            async pause() {},
            async resume() {},
            async close() {}
          };
        },
        async decideRoute(input) {
          expect(input.sourceAgentId).toBe("idea");
          const authority = await input.open.controlAuthorityFactory!({
            request: input.open.request,
            turn: input.turn
          });
          expect(authority.control.tasklessRouteTargets).toEqual(["main-selected-team"]);
          const action = {
            tool: "route_to_agent" as const,
            target: "main-selected-team"
          };
          return agentFixtureMainDecision(input, {
            targetNodeId: "main-selected-team",
            decisionRequestId: "main-selected-team-decision",
            decisionAction: action
          });
        }
      }
    });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    await coordinator.createProject(state, { enabled: true, provider: "github" });
    await waitFor(() => state.groupRuns?.length === 1);
    await waitFor(() => state.tasks?.some((task) =>
      task.id === "task-taskless-main-selected"));

    const group = state.groupRuns![0]!;
    const node = state.nodeRuns?.find((entry) => entry.id === group.nodeRunId);
    expect(state.agents.idea.decisionBy).toBe("main");
    expect(group.leaderAgentId).toBe("main");
    expect(node).toMatchObject({
      sourceAgentId: "idea",
      activatedByAgentId: "main"
    });
    expect(await groupActivationOriginEvent(storage, state.id, "main-selected-team"))
      .toMatchObject({
        kind: "main-selection",
        sourceNodeRunId: node?.sourceNodeRunId,
        sourceAgentId: "idea"
      });
    expect(state.collaboration?.routeOutbox[0]).toMatchObject({
      decisionKind: "weak",
      selectedByAgentId: "main",
      decisionRequestId: "main-selected-team-decision",
      status: "delivered"
    });
    expect(state.tasks).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "task-taskless-main-selected",
        assignment: "Implement the work derived from the shared current state."
      })
    ]));
    await coordinator.shutdown();
  });

  it("keeps an ordinary self-selected weak route autonomous when it activates a group", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-autonomous-group-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_43434343434343434343434343434343");
    state.agents.idea.decisionBy = "agent";
    state.orchestration = {
      ...state.orchestration,
      collaborations: [{
        id: "autonomous-team",
        memberAgentIds: ["execution", "review"]
      }],
      routes: {
        ...state.orchestration.routes,
        idea: [
          { target: "autonomous-team", kind: "weak" },
          { target: "writing", kind: "weak" }
        ],
        "autonomous-team": [{ target: "finish", kind: "strong" }]
      }
    };
    await storage.createProject(state);
    const coordinator = new CollaborationRuntimeCoordinator({
      storage,
      serviceId: "autonomous-group-test",
      hostId: "host-test",
      leaseDurationMs: 5_000,
      gitFactory: (options) => happyGitFake(options, []),
      residentLauncher: {
        async open(input) {
          if (input.request.executionContext?.role === "leader") {
            expect(input.request.agent).toBe("idea");
            return blockingResident(input.signal);
          }
          return {
            async submit(turn) {
              const fresh = await input.turnRequestFactory({ baseRequest: input.request, turn });
              const authority = await input.controlAuthorityFactory!({
                request: fresh.request,
                turn
              });
              const envelope = {
                projectId: state.id,
                agent: "idea" as const,
                invocationId: turn.invocationId,
                callId: "ordinary-autonomous-team-decision",
                stateVersion: authority.control.stateVersion,
                capabilityHash: authority.control.capabilityHash,
                receivedAt: new Date().toISOString(),
                action: {
                  tool: "route_to_agent" as const,
                  target: "autonomous-team",
                  rationale: "The ordinary Agent owns this configured weak decision"
                }
              };
              await authority.revalidate(envelope, []);
              return agentFixtureDelivery(input, turn, { handoff: "ordinary autonomous result", controlActions: [envelope] }, coordinator);
            },
            async pause() {},
            async resume() {},
            async close() {}
          };
        },
        async decideRoute() {
          throw new Error("Main must not replace an ordinary Agent-owned route decision");
        }
      }
    });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    await coordinator.createProject(state, { enabled: true, provider: "github" });
    await waitFor(() => state.groupRuns?.length === 1);

    const group = state.groupRuns![0]!;
    const node = state.nodeRuns?.find((entry) => entry.id === group.nodeRunId);
    expect(state.agents.idea.decisionBy).toBe("agent");
    expect(group.leaderAgentId).toBe("idea");
    expect(node).toMatchObject({ sourceAgentId: "idea", activatedByAgentId: "idea" });
    expect(await groupActivationOriginEvent(storage, state.id, "autonomous-team"))
      .toMatchObject({
        kind: "agent-route",
        sourceAgentId: "idea",
        sourceNodeRunId: node?.sourceNodeRunId,
        route: "autonomous"
      });
    expect(state.collaboration?.routeOutbox[0]).toMatchObject({
      decisionKind: "weak",
      selectedByAgentId: "idea",
      decisionRequestId: "ordinary-autonomous-team-decision",
      status: "delivered"
    });
    await coordinator.shutdown();
  });

  it("replays a pending Main-selected route after restart with the same group origin", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-route-origin-restart-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_44444444444444444444444444444444");
    state.agents.idea.decisionBy = "main";
    state.orchestration = {
      ...state.orchestration,
      collaborations: [{
        id: "restart-selected-team",
        memberAgentIds: ["execution", "review"]
      }],
      routes: {
        ...state.orchestration.routes,
        idea: [
          { target: "restart-selected-team", kind: "weak" },
          { target: "writing", kind: "weak" }
        ],
        "restart-selected-team": [{ target: "finish", kind: "strong" }]
      }
    };
    const databasePath = path.join(root, "route-origin.sqlite");
    const readyGit: ProjectGitState = {
      enabled: true,
      status: "ready",
      provider: "github",
      repository: {
        owner: "fixture-owner",
        name: "route-origin-restart",
        htmlUrl: "https://github.example/route-origin-restart",
        private: true,
        defaultBranch: "main",
        localPath: path.join(root, "repository")
      },
      initialization: {
        operationId: `git-init-${state.id}`,
        attempt: 1,
        completedSteps: ["github.authorized", "remote.main.observed"]
      }
    };
    state.git = readyGit;
    state.status = "queued";
    state.phase = "collaboration:ready";
    await storage.createProject(state);

    const seed = CollaborationStateDatabase.open({
      databasePath,
      serviceId: "route-origin-seed",
      hostId: "host-test",
      topology: "single-host"
    });
    seed.createProject({
      projectId: state.id,
      workflowRevision: 1,
      workflowSnapshot: state.orchestration,
      git: readyGit,
      workerCapacity: 2,
      managementCapacity: 1
    });
    const seededRepository = repositoryFact("route-origin-restart");
    seed.prepareOperation(state.id, {
      id: "repository-route-origin-restart",
      kind: "repository.create",
      payloadHash: "repository-route-origin-restart",
      status: "prepared"
    });
    seed.transitionOperation(state.id, {
      id: "repository-route-origin-restart",
      payloadHash: "repository-route-origin-restart",
      status: "observed",
      remoteFact: seededRepository
    });
    seed.transitionOperation(state.id, {
      id: "repository-route-origin-restart",
      payloadHash: "repository-route-origin-restart",
      status: "finalized",
      remoteFact: seededRepository
    });
    seed.activateNode({
      projectId: state.id,
      nodeRunId: "restart-source-node",
      node: { kind: "agent", nodeId: "idea", agentId: "idea" },
      activationRequestId: "restart-source-activation",
      inputSnapshotRef: `project:${state.id}:requirement`,
      optionalTask: "Create the upstream result",
      activatedByAgentId: "main",
      workflowRevision: 1
    });
    seed.startStandaloneExecution({
      projectId: state.id,
      nodeRunId: "restart-source-node",
      taskId: "restart-source-task",
      executionId: "restart-source-execution",
      agentId: "idea",
      assignment: "Create the upstream result",
      executionBranch: "executions/restart-source-execution",
      worktreePath: path.join(root, "restart-source-worktree")
    });
    seed.observePullRequest({
      projectId: state.id,
      executionId: "restart-source-execution",
      ownershipEpoch: 1,
      pullRequest: {
        ...pullFact(
          1,
          "restart-source-execution",
          "executions/restart-source-execution",
          "main",
          "b".repeat(40),
          "merged"
        ),
        mergeCommitSha: "d".repeat(40)
      }
    });
    seed.completeExecution({
      projectId: state.id,
      executionId: "restart-source-execution",
      ownershipEpoch: 1,
      output: "Persisted upstream result"
    });
    seed.completeStandaloneNode({
      projectId: state.id,
      nodeRunId: "restart-source-node",
      executionId: "restart-source-execution",
      ownershipEpoch: 1,
      output: "Persisted upstream result",
      routeEmissionId: "restart-pending-route",
      route: {
        kind: "weak",
        targetNodeId: "restart-selected-team",
        selectedByAgentId: "main",
        decisionRequestId: "restart-main-selection"
      }
    });
    expect(seed.pendingRoutes(state.id)).toEqual([
      expect.objectContaining({
        selectedByAgentId: "main",
        decisionRequestId: "restart-main-selection"
      })
    ]);
    seed.relinquishWriterLease();
    seed.close();

    let opens = 0;
    const coordinator = new CollaborationRuntimeCoordinator({
      storage,
      databasePath,
      serviceId: "route-origin-restart",
      hostId: "host-test",
      leaseDurationMs: 5_000,
      gitFactory: (options) => happyGitFake(options, []),
      residentLauncher: {
        async open(input) {
          opens += 1;
          expect(input.request.executionContext?.role).toBe("leader");
          expect(input.request.agent).toBe("main");
          return blockingResident(input.signal);
        }
      }
    });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    expect(await coordinator.recoverProject(state)).toBe(true);
    await waitFor(() => opens === 1 || Boolean(state.lastError));
    expect(state.lastError).toBeUndefined();

    const group = state.groupRuns![0]!;
    const node = state.nodeRuns?.find((entry) => entry.id === group.nodeRunId);
    expect(opens).toBe(1);
    expect(group.leaderAgentId).toBe("main");
    expect(node).toMatchObject({ sourceAgentId: "idea", activatedByAgentId: "main" });
    expect(await groupActivationOriginEvent(storage, state.id, "restart-selected-team"))
      .toMatchObject({
        kind: "main-selection",
        sourceNodeRunId: "restart-source-node",
        sourceAgentId: "idea"
      });
    expect(state.collaboration?.routeOutbox).toEqual([
      expect.objectContaining({
        routeEmissionId: "restart-pending-route",
        status: "delivered",
        selectedByAgentId: "main",
        decisionRequestId: "restart-main-selection"
      })
    ]);
    await coordinator.shutdown();
  });

  it.each(["member", "scoped-root", "scoped-group"].flatMap(mode => ["resume", "shutdown"].map(transition => ({ mode, transition }))))(
    "settles Pause during an unfinished experiment wait and gates its original continuation ($mode/$transition)", async ({ mode, transition }) => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-collaboration-experiment-pause-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub()); await storage.initialize();
    const state = projectState("prj_eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeea");
    state.orchestration = { ...state.orchestration,
      routes: { ...state.orchestration.routes, idea: [{ target: "finish", kind: "strong" }] },
      ...(mode !== "member" ? { schemaVersion: 3, scopedWorkflow: { schemaVersion: 1,
        rootAgentIds: state.orchestration.agents.map(agent => agent.name), groups: [] } } : {}) };
    if (mode === "scoped-group") state.orchestration = { ...state.orchestration,
      input: { source: "input", target: "G" }, routes: { main: [], G: [{ kind: "strong", target: "finish" }] },
      collaborations: [{ id: "G", displayName: "G", memberAgentIds: [], renamePolicy: "editable" }],
      scopedWorkflow: { schemaVersion: 1, rootAgentIds: ["main"], groups: [{ id: "G", leaderAgentId: "main",
        allowLeaderReconfiguration: false, workflow: { nodes: [{ kind: "agent", nodeId: "G_idea", agentId: "idea" }],
          input: { source: "input", edges: [{ kind: "parallel", target: "G_idea" }] },
          routes: { G_idea: [{ kind: "strong", target: "finish" }] } } }] } };
    state.agents.idea.experimentMcp = true;
    await storage.createProject(state);
    let releaseResults!: () => void;
    const resultsReady = new Promise<void>(resolve => { releaseResults = resolve; });
    let waiting = false, continued = false, closed = false, submissions = 0, pauses = 0, resumes = 0;
    const order: string[] = [];
    const groupRefs = new Set<string>();
    const coordinator = new CollaborationRuntimeCoordinator({ storage, serviceId: "experiment-pause-test", hostId: "host-test",
      gitFactory: options => {
        const git = happyGitFake(options, order);
        return { ...git,
        async beginGroup(request) {
          const result = await git.beginGroup(request);
          groupRefs.add(result.group.branch);
          return result;
        },
        async observeRemoteRef(repository, ref) {
          const exists = !ref.startsWith("groups/") || groupRefs.has(ref);
          return { owner: repository.owner, repository: repository.name, ref,
            status: exists ? "present" as const : "missing" as const,
            ...(exists ? { sha: "a".repeat(40) } : {}), observedAt: new Date().toISOString() };
        },
        async createGroupFinalPullRequest() { throw new Error("Group integration is outside this wait boundary"); },
        async mergeGroupFinalPullRequest() { throw new Error("Group integration is outside this wait boundary"); },
        async reconcileGroupFinalPullRequest() { throw new Error("Group integration is outside this wait boundary"); },
        async checkpointGroupCompletion() { throw new Error("Group completion is outside this wait boundary"); },
        async prepareAgentManagementWorkspace(agentId) { const workspace = path.join(storage.projectDir(state.id), "git-worktrees", "agents", agentId);
          await fs.mkdir(workspace, { recursive: true }); return workspace; } };
      }, residentLauncher: {
        async open(input) {
          await input.onOpened?.();
          if (input.controlScope?.role === "scoped-leader") return {
            async submit(turn) {
              const scope = input.controlScope!;
              if (scope.role !== "scoped-leader") throw new Error("Expected the original scoped Leader");
              const authority = await input.controlAuthorityFactory!({ request: input.request, turn });
              const actions: ControlActionEnvelope[] = [];
              for (const action of [{ tool: "finish_task", summary: "Leader finished the original plan" },
                { tool: "assign_group_tasks", groupRunId: scope.groupRunId, coordinatorEpoch: scope.coordinatorEpoch,
                  tasks: scope.memberNodeIds.map(taskId => ({ taskId, assignment: "Wait for both original experiments" })) }] as ControlAction[]) {
                const envelope: ControlActionEnvelope = { projectId: state.id, agent: input.request.agent,
                  invocationId: turn.invocationId, callId: `wait-plan-${actions.length}`, receivedAt: new Date().toISOString(),
                  stateVersion: authority.control.stateVersion, capabilityHash: authority.control.capabilityHash, action };
                await authority.revalidate(envelope, actions); actions.push(envelope);
              }
              return { handoff: "Original scoped plan", controlActions: actions };
            }, async pause() {}, async resume() {}, async close() {}
          };
          return {
          async submit(turn) {
            submissions += 1;
            // This is the real broker callback boundary: the physical model
            // returned a pending handoff; the logical task still awaits two
            // remote results and must keep its original execution/FIFO.
            await input.request.onExperimentWait?.(true); waiting = true;
            await Promise.race([resultsReady, new Promise<void>(resolve => input.signal.addEventListener("abort", () => resolve(), { once: true }))]);
            input.signal.throwIfAborted();
            await input.request.onExperimentWait?.(false); continued = true;
            if (mode === "scoped-group") {
              // Observe the original physical continuation before any report
              // or final integration; those are independent Git contracts.
              await new Promise<void>(resolve => input.signal.addEventListener("abort", () => resolve(), { once: true }));
              input.signal.throwIfAborted();
            }
            return agentFixtureDelivery(input, turn, { handoff: "Original task checked both remote results" }, coordinator);
          },
          async pause() { pauses += 1; }, async resume() { resumes += 1; }, async close() { closed = true; }
        }; }
      } });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    let pause: Promise<void> | undefined;
    try {
      await coordinator.createProject(state, { enabled: true, provider: "github" });
      await waitFor(() => waiting || Boolean(state.lastError));
      expect(state.lastError).toBeUndefined();
      expect(waiting).toBe(true);
      const before = coordinator.database().projectState(state.id);
      const execution = (mode === "scoped-group" ? before.scopedExecutions : before.executions).find(execution => execution.agentId === "idea")!;
      expect(execution).toBeTruthy();
      pause = coordinator.pauseProject(state);
      // No remote result is released. A physical-idle experiment wait must
      // already let Pause settle instead of waiting for scientific completion.
      await vi.waitFor(() => expect(pauses).toBe(1), { timeout: 750, interval: 10 });
      await pause;
      expect(state.pauseRequest?.settledAt).toBeTruthy();
      expect(state.status).toBe(hasUserWorkflowPause(state) ? "paused" : "retrying");
      expect(continued).toBe(false); expect(closed).toBe(false);
      const held = coordinator.database().projectState(state.id);
      expect((mode === "scoped-group" ? held.scopedExecutions : held.executions).find(item => item.id === execution.id)).toEqual(execution);
      expect(held.tasks).toEqual(before.tasks);
      expect(held.scopedArrivals).toEqual(before.scopedArrivals);
      expect(held.routeOutbox).toEqual(before.routeOutbox);
      expect(held.scopedAgentReports ?? []).toEqual([]);
      expect(order.some(item => item.startsWith("push"))).toBe(false);
      if (transition === "shutdown") {
        await coordinator.shutdown();
        expect(continued).toBe(false); expect(submissions).toBe(1); expect(resumes).toBe(0);
        expect(order.some(item => item.startsWith("push"))).toBe(false);
        return;
      }
      releaseResults();
      // The pending result may become ready during Pause. It must not start
      // the next physical model turn or release this logical task.
      await new Promise(resolve => setTimeout(resolve, 25));
      expect(continued).toBe(false); expect(submissions).toBe(1);
      await coordinator.resumeProject(state);
      if (mode === "scoped-group") {
        await waitFor(() => continued);
        expect(coordinator.database().projectState(state.id).scopedExecutions.find(item => item.id === execution.id)).toEqual(execution);
        expect(submissions).toBe(1); expect(resumes).toBe(1);
        expect(coordinator.database().projectState(state.id).scopedAgentReports).toEqual([]);
        return;
      }
      await waitFor(() => state.status === "completed" || Boolean(state.lastError), 10_000);
      expect(state.lastError).toBeUndefined(); expect(state.status).toBe("completed");
      expect(continued).toBe(true); expect(submissions).toBe(1); expect(resumes).toBe(1);
      expect(coordinator.database().projectState(state.id).executions.find(item => item.id === execution.id))
        .toMatchObject({ ownershipEpoch: execution.ownershipEpoch, taskId: execution.taskId, status: "succeeded" });
    } finally {
      releaseResults(); await coordinator.shutdown(); await pause?.catch(() => undefined);
    }
  }, 15_000);

  it.each([false, true].flatMap(pauseError => (["resume", "shutdown"] as const).map(transition => ({ pauseError, transition }))))(
    "preserves the actual output at a safe Pause boundary before $transition (pause error: $pauseError)", async ({ pauseError, transition }) => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-collaboration-pause-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee");
    state.orchestration = {
      ...state.orchestration,
      routes: { ...state.orchestration.routes, idea: [{ target: "finish", kind: "strong" }] }
    };
    await storage.createProject(state);
    const order: string[] = [];
    let releaseTurn!: () => void;
    const turnReleased = new Promise<void>((resolve) => { releaseTurn = resolve; });
    let markStarted!: () => void;
    const turnStarted = new Promise<void>((resolve) => { markStarted = resolve; });
    let pauseCalls = 0;
    let resumeCalls = 0;
    let lifetimeAborted = false;
    let rejectPause = pauseError;
    const coordinator = new CollaborationRuntimeCoordinator({
      storage,
      serviceId: "pause-test",
      hostId: "host-test",
      leaseDurationMs: 5_000,
      gitFactory: (options) => happyGitFake(options, order),
      residentLauncher: {
        async open(input) {
          input.signal.addEventListener("abort", () => { lifetimeAborted = true; });
          return {
            async submit(turn) {
              markStarted();
              await turnReleased;
              if (!turn.prompt.includes("Missing formal mechanism actions:")) return { handoff: "safe-point output" };
              return agentFixtureDelivery(input, turn, { handoff: "safe-point output" }, coordinator);
            },
            async pause() { pauseCalls += 1; if (rejectPause) throw new Error("Native pause not confirmed"); },
            async resume() { resumeCalls += 1; },
            async close() {}
          };
        }
      }
    });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    try {
      await coordinator.createProject(state, { enabled: true, provider: "github" });
      await turnStarted;
      const pause = coordinator.pauseProject(state);
      const pauseOutcome = pause.catch((error: unknown) => error);
      // The intent must be durable before the native turn is released. Wait
      // for that actual boundary; a fixed 20 ms assumes idle filesystem/CPU.
      let requested!: ProjectState;
      await vi.waitFor(async () => {
        requested = await storage.loadState(state.id);
        expect(requested.status).toBe("pausing");
      }, { timeout: 5_000, interval: 20 });
      expect(pauseCalls).toBe(0);
      expect(lifetimeAborted).toBe(false);
      expect(requested.status).toBe("pausing");
      expect(requested.pauseRequest?.requestedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(requested.pauseRequest?.settledAt).toBeUndefined();
      expect(coordinator.projectReadModel(state)).toMatchObject({ status: "pausing", runtime: { status: "pausing" } });
      releaseTurn();
      const outcome = await pauseOutcome;
      if (pauseError) {
        expect(outcome).toMatchObject({ message: "Native pause not confirmed" });
        expect((await storage.loadState(state.id)).pauseRequest?.settledAt).toBeUndefined();
        expect(coordinator.projectReadModel(state).status).toBe("pausing");
        expect(lifetimeAborted).toBe(false);
        rejectPause = false;
        await coordinator.pauseProject(state);
      } else expect(outcome).toBeUndefined();
      expect(state.status).toBe(hasUserWorkflowPause(state) ? "paused" : "retrying");
      expect(state.pauseRequest?.requestedAt).toBe(requested.pauseRequest?.requestedAt);
      expect(state.pauseRequest?.settledAt).toBeTruthy();
      expect(pauseCalls).toBe(pauseError ? 2 : 1);
      expect(order.some((item) => item.startsWith("push"))).toBe(false);
      const inspection = new DatabaseSync(path.join(path.dirname(storage.projectsDir()), "collaboration-state.sqlite"), { readOnly: true });
      try {
        expect(inspection.prepare("SELECT output FROM member_executions WHERE project_id = ? AND output = ?")
          .all(state.id, "safe-point output")).toHaveLength(1);
        expect(inspection.prepare("SELECT 1 FROM project_events WHERE project_id = ? AND event_type = 'execution.git_stage.persisted' AND json_extract(payload_json, '$.stage') = 'model_output_persisted'")
          .all(state.id)).toHaveLength(1);
      } finally { inspection.close(); }
      if (transition === "shutdown") {
        await coordinator.shutdown();
        const stoppedInspection = new DatabaseSync(path.join(path.dirname(storage.projectsDir()), "collaboration-state.sqlite"), { readOnly: true });
        try {
          expect(stoppedInspection.prepare("SELECT output FROM member_executions WHERE project_id = ? AND output = ?")
            .all(state.id, "safe-point output")).toHaveLength(1);
          expect(stoppedInspection.prepare("SELECT 1 FROM project_events WHERE project_id = ? AND event_type = 'execution.git_stage.persisted' AND json_extract(payload_json, '$.stage') = 'model_output_persisted'")
            .all(state.id)).toHaveLength(1);
        } finally { stoppedInspection.close(); }
        expect((await storage.loadState(state.id)).status).not.toBe("completed");
        expect(order.some(item => item.startsWith("push"))).toBe(false);
        expect(resumeCalls).toBe(0);
        return;
      }
      await coordinator.resumeProject(state);
      await waitFor(() => state.status === "completed", 15_000);
      expect(resumeCalls).toBe(1);
      expect(lifetimeAborted).toBe(false);
      expect(state.pauseRequest).toBeUndefined();
    } finally { releaseTurn(); await coordinator.shutdown(); }
  });

  it("runs group deliveries concurrently and gates group completion on the final PR to main", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-collaboration-group-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_dddddddddddddddddddddddddddddddd");
    state.orchestration = {
      ...state.orchestration,
      collaborations: [{
        id: "research-team",
        displayName: "Research team",
        memberAgentIds: ["idea", "execution"],
        renamePolicy: "editable"
      }],
      input: { source: "input", target: "research-team" },
      routes: {
        ...state.orchestration.routes,
        "research-team": [
          { target: "finish", kind: "weak" },
          { target: "main", kind: "weak" }
        ]
      }
    };
    await storage.createProject(state);
    const order: string[] = [];
    let activeDeliveries = 0;
    let maxDeliveries = 0;
    let firstDeliveryStarts = 0;
    let releaseFirstDeliveries!: () => void;
    const firstDeliveriesReady = new Promise<void>((resolve) => { releaseFirstDeliveries = resolve; });
    let totalLeaderSubmits = 0;
    let routeDecisions = 0;
    let mainRouteStopObservations = 0;
    let activeMainResidents = 0;
    let maxActiveMainResidents = 0;
    let leaderCloseCalls = 0;
    let memberCloseFailures = 0;
    const managementContents: string[] = [];
    const coordinator = new CollaborationRuntimeCoordinator({
      storage,
      serviceId: "group-test",
      hostId: "host-test",
      leaseDurationMs: 5_000,
      gitFactory: (options) => happyGitFake(options, order, true, false, managementContents),
      residentLauncher: {
        async open(input) {
          const context = input.request.executionContext!;
          let leaderTurn = 0;
          let closed = false;
          if (context.role === "leader") {
            // Default Main is yolo for ordinary work, but management residents
            // must always receive the restricted compiled permission.
            expect(state.agents.main.permission).toBe("yolo");
            expect(input.request.permission).toBe("workspace");
            if (input.request.agent === "main") {
              activeMainResidents += 1;
              maxActiveMainResidents = Math.max(maxActiveMainResidents, activeMainResidents);
            }
          } else {
            expect(input.filesystemAuthorityInput.projectWorktrees)
              .toContain(context.executionWorktree);
            expect(input.filesystemAuthorityInput.projectWorktrees?.every((worktree) =>
              worktree.startsWith(path.join(storage.projectDir(state.id), "git-worktrees") + path.sep)
            )).toBe(true);
          }
          return {
            async submit(turn) {
              if (context.role === "leader") {
                const liveProject = coordinator.projectReadModel(state);
                expect(liveProject).toMatchObject({
                  status: "running",
                  phase: "model:running",
                  currentAgent: input.request.agent,
                  activeInvocationId: turn.invocationId,
                  runtime: {
                    status: "running",
                    phase: "model:running",
                    currentAgent: input.request.agent,
                    activeInvocationId: turn.invocationId
                  }
                });
                expect(storage.hub.liveSnapshot(state.id).runtime).toMatchObject({
                  stateRevision: liveProject.runtime?.stateRevision,
                  activeInvocationId: turn.invocationId,
                  activityStartedAt: expect.any(String)
                });
                expect(input.inputs?.workspacePath).toContain("management-workspace");
                expect(input.inputs?.workspacePath).toContain(`${path.sep}runtime${path.sep}`);
                expect(input.controlAuthorityFactory).toBeTypeOf("function");
                leaderTurn += 1;
                totalLeaderSubmits += 1;
                const action = leaderTurn === 1
                  ? {
                      tool: "assign_group_tasks" as const,
                      groupRunId: context.groupRunId,
                      coordinatorEpoch: context.coordinatorEpoch,
                      tasks: [
                        { taskId: "task-idea", assignment: "Develop the idea", assigneeAgentId: "idea" },
                        { taskId: "task-execution", assignment: "Execute the analysis", assigneeAgentId: "execution" },
                        {
                          taskId: "task-idea-followup",
                          assignment: "Refine after the first idea task",
                          assigneeAgentId: "idea",
                          dependencyTaskIds: ["task-idea"]
                        }
                      ]
                    }
                  : leaderTurn === 2 ? {
                      tool: "assign_group_tasks" as const,
                      groupRunId: context.groupRunId,
                      coordinatorEpoch: context.coordinatorEpoch,
                      tasks: [
                        { taskId: "task-extra-round", assignment: "Run the additional evidence round", assigneeAgentId: "execution" }
                      ]
                    }
                  : leaderTurn === 3 ? {
                      tool: "request_group_integration" as const,
                      groupRunId: context.groupRunId,
                      coordinatorEpoch: context.coordinatorEpoch,
                      integrationOwnerAgentId: "execution"
                    } : {
                      tool: "complete_group" as const,
                      groupRunId: context.groupRunId,
                      coordinatorEpoch: context.coordinatorEpoch,
                      output: "Integrated group result"
                    };
                const turnRuntime = await input.turnRequestFactory({
                  baseRequest: input.request,
                  turn
                });
                const authority = await input.controlAuthorityFactory!({
                  request: turnRuntime.request,
                  turn
                });
                let controlService: ControlActionService | undefined;
                if (leaderTurn === 1 && action.tool === "assign_group_tasks") {
                  controlService = new ControlActionService({
                    projectId: state.id,
                    agent: turnRuntime.request.agent,
                    invocationId: turn.invocationId,
                    stateVersion: authority.control.stateVersion,
                    capability: authority.control.capability,
                    ...(authority.control.capabilityHash
                      ? { capabilityHash: authority.control.capabilityHash }
                      : {}),
                    ...(authority.control.expiresAt
                      ? { expiresAt: authority.control.expiresAt }
                      : {}),
                    stagingPath: authority.control.stagingPath,
                    revalidate: authority.revalidate,
                    onRejected: authority.onRejected
                  });
                  let semanticError: unknown;
                  try {
                    await controlService.stage(
                      authority.control.capability,
                      "invalid-member-first",
                      {
                        tool: "assign_group_tasks",
                        groupRunId: context.groupRunId,
                        coordinatorEpoch: context.coordinatorEpoch,
                        tasks: [{
                          taskId: "task-invalid-member",
                          assignment: "This must fail before staging.",
                          assigneeAgentId: "removed-member"
                        }]
                      }
                    );
                  } catch (error) {
                    semanticError = error;
                  }
                  expect(semanticError).toBeInstanceOf(ControlActionRejectedError);
                  const rejection = (semanticError as ControlActionRejectedError).rejection;
                  expect(rejection).toMatchObject({
                    code: "INVALID_STATE_TRANSITION",
                    invalidField: "tasks[0].assigneeAgentId",
                    authoritativeFiles: {
                      definition: "workflow/definition.json",
                      currentState: "workflow/current-state.json"
                    }
                  });
                  await expect(fs.access(authority.control.stagingPath))
                    .rejects.toMatchObject({ code: "ENOENT" });
                  expect(state.status).not.toBe("paused");

                  const workflowRoot = path.join(
                    input.inputs!.workspacePath,
                    "workflow"
                  );
                  const definition = JSON.parse(await fs.readFile(
                    path.join(workflowRoot, "definition.json"),
                    "utf8"
                  )) as { workflowRevision: number };
                  const currentState = JSON.parse(await fs.readFile(
                    path.join(workflowRoot, "current-state.json"),
                    "utf8"
                  )) as {
                    stateRevision: number;
                    workflowRevision: number;
                    currentGroup: { memberAgentIds: string[] };
                  };
                  expect(currentState.stateRevision).toBe(rejection.currentRevision);
                  expect(definition.workflowRevision).toBe(rejection.workflowRevision);
                  expect(currentState.currentGroup.memberAgentIds)
                    .toEqual(expect.arrayContaining(["idea", "execution"]));
                }
                // Gateway completion usage can commit before the native
                // control frame. It must not stale a still-current epoch.
                await turnRuntime.request.onTokenUsage?.({
                  usageId: `usage-${turn.invocationId}`,
                  protocol: "responses",
                  model: "fixture-model",
                  inputTokens: 1,
                  cachedInputTokens: 0,
                  outputTokens: 1,
                  totalTokens: 2
                });
                const envelope: ControlActionEnvelope = controlService
                  ? await controlService.stage(
                      authority.control.capability,
                      `call-${turn.invocationId}`,
                      action
                    )
                  : {
                      projectId: state.id,
                      agent: turnRuntime.request.agent,
                      invocationId: turn.invocationId,
                      callId: `call-${turn.invocationId}`,
                      stateVersion: authority.control.stateVersion,
                      capabilityHash: authority.control.capabilityHash,
                      receivedAt: new Date().toISOString(),
                      action
                    };
                return agentFixtureLeaderResult(input, turn, {
                  handoff: leaderTurn <= 2 ? "Tasks assigned" :
                    leaderTurn === 3 ? "Integration requested" : "Integrated group result",
                  controlActions: [envelope]
                });
              }
              activeDeliveries += 1;
              maxDeliveries = Math.max(maxDeliveries, activeDeliveries);
              // Observe actual overlap without depending on checkout latency.
              if (firstDeliveryStarts < 2) {
                firstDeliveryStarts += 1;
                if (firstDeliveryStarts === 2) releaseFirstDeliveries();
                await firstDeliveriesReady;
              }
              activeDeliveries -= 1;
              return agentFixtureDelivery(input, turn, { handoff: `${input.request.agent} group output` }, coordinator);
            },
            async pause() {},
            async resume() {},
            async close() {
              if (closed) return;
              if (context.role === "leader") {
                leaderCloseCalls += 1;
                if (leaderCloseCalls === 1) {
                  throw new Error("fixture leader PGID still alive");
                }
              } else if (input.request.agent === "idea" && memberCloseFailures === 0) {
                memberCloseFailures += 1;
                throw new Error("fixture member PGID still alive");
              }
              closed = true;
              if (context.role === "leader" && input.request.agent === "main") {
                activeMainResidents -= 1;
              }
            }
          };
        },
        async decideRoute(input) {
          expect(activeMainResidents).toBe(0);
          routeDecisions += 1;
          if (routeDecisions === 1) {
            throw new Error("fixture crash after durable group completion decision");
          }
          return agentFixtureMainDecision(input, { targetNodeId: "finish", decisionRequestId: "decision-after-restart",
            output: "Main explicitly verified the integrated group and selected Finish (decision-after-restart)" });
        },
        async observeMainRouteRecovery() {
          mainRouteStopObservations += 1;
          return {
            stopped: mainRouteStopObservations >= 2,
            evidence: { observation: mainRouteStopObservations }
          };
        }
      }
    });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    try {
      await coordinator.createProject(state, { enabled: true, provider: "github" });
      await waitFor(() => ["paused", "retrying"].includes(state.status) && memberCloseFailures === 1);
      expect(state.groupRuns?.[0]?.leaderDecision).toBeUndefined();
      expect(state.collaboration?.routeOutbox).toEqual([]);
      await coordinator.resumeProject(state);
      await waitFor(() => ["paused", "retrying"].includes(state.status) &&
        state.groupRuns?.[0]?.leaderDecision === "complete");
      expect(totalLeaderSubmits).toBe(4);
      expect(routeDecisions).toBe(0);
      expect(state.groupRuns?.[0]?.status).not.toBe("completed");
      expect(state.collaboration?.routeOutbox).toEqual([]);
      await coordinator.resumeProject(state);
      await waitFor(() => ["paused", "retrying"].includes(state.status) && routeDecisions === 1);
      // The first successful stop-confirm reaches Main routing, whose fixture
      // then crashes. A second Resume consumes the same durable complete_group
      // decision without resubmitting it.
      await coordinator.resumeProject(state);
      await waitFor(() => state.status === "completed");

      // Recovery consumes the persisted complete_group decision. It only
      // retries independent route selection and never resubmits the leader's
      // terminal management turn.
      expect(routeDecisions).toBe(2);
      expect(mainRouteStopObservations).toBe(2);
      expect(leaderCloseCalls).toBeGreaterThanOrEqual(2);
      expect(maxActiveMainResidents).toBe(1);
      expect(totalLeaderSubmits).toBe(4);
      expect(maxDeliveries).toBe(2);
      expect(state.groupRuns?.[0]).toMatchObject({
        status: "completed",
        leaderAgentId: "main",
        output: "Integrated group result"
      });
      expect(state.executions?.filter((execution) => execution.purpose === "delivery" &&
        execution.status === "succeeded")).toHaveLength(4);
      const final = state.executions?.find((execution) => execution.purpose === "final-integration");
      expect(final).toMatchObject({ status: "succeeded" });
      expect(final?.agentId).not.toBe("main");
      const finalPull = state.pullRequests?.find((pull) => pull.ownerExecutionId === final?.id);
      expect(finalPull).toMatchObject({ base: "main", status: "merged" });
      expect(state.collaboration?.routeOutbox).toEqual([
        expect.objectContaining({
          targetNodeId: "finish",
          status: "delivered",
          deliveryAttempts: 1,
          decisionKind: "weak"
        })
      ]);
      expect(state.executions?.some((execution) => execution.agentId === "main")).toBe(false);
      const leaderUsageInvocations = state.collaboration?.usage
        .filter((usage) => usage.agentId === "main")
        .map((usage) => usage.invocationId);
      expect(leaderUsageInvocations).toHaveLength(4);
      expect(new Set(leaderUsageInvocations).size).toBe(4);
      // Event reads return the committed prefix captured at their start.
      // Compare the projection counter inside the same stable boundary,
      // rather than with a counter advanced by a later publication.
      const { mirrored, mirroredSeq } = await storage.withStableProjectSnapshot(state.id, async () => ({
        mirrored: (await storage.readEvents(state.id, 0, 10_000))
          .filter((event) => typeof event.data?.collaborationSeq === "number"),
        mirroredSeq: state.collaboration?.eventSeq
      }));
      expect(new Set(mirrored.map((event) => event.eventId)).size).toBe(mirrored.length);
      expect(new Set(mirrored.map((event) => event.data?.collaborationSeq)).size)
        .toBe(mirrored.length);
      expect(state.tasks?.every((task) => task.status === "succeeded")).toBe(true);
      expect(mirroredSeq).toBe(
        Math.max(...mirrored.map((event) => Number(event.data?.collaborationSeq)))
      );
      expect(managementContents.some((content) =>
        content.includes("# Main management memory") &&
        content.includes("decision-after-restart")
      )).toBe(true);
    } finally { releaseFirstDeliveries(); await coordinator.shutdown(); }
  }, 15_000);

  it("keeps an agent-led group management-only and activates a strong downstream group under Main after final integration", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-collaboration-group-chain-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_66666666666666666666666666666666");
    state.orchestration.agents.push({ name: "quality", template: "review" });
    state.agents.quality = structuredClone(state.agents.review!);
    state.runCounts.quality = 0;
    state.tokenUsage.byAgent.quality = {
      inputTokens: 0,
      cachedInputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      invocations: 0
    };
    state.orchestration = {
      ...state.orchestration,
      collaborations: [
        {
          id: "delivery-team",
          displayName: "Delivery team",
          memberAgentIds: ["execution", "writing"],
          renamePolicy: "editable"
        },
        {
          id: "review-team",
          displayName: "Review team",
          memberAgentIds: ["review", "quality"],
          renamePolicy: "editable"
        }
      ],
      routes: {
        ...state.orchestration.routes,
        idea: [{ target: "delivery-team", kind: "strong" }],
        "delivery-team": [{ target: "review-team", kind: "strong" }],
        "review-team": [{ target: "finish", kind: "strong" }]
      }
    };
    await storage.createProject(state);
    const order: string[] = [];
    const leaderOpens: Array<{ groupRunId: string; agentId: string }> = [];
    const leaderMemories: string[] = [];
    const memberInboxes: string[] = [];
    const committedManagementContents: string[] = [];
    const coordinator = new CollaborationRuntimeCoordinator({
      storage,
      serviceId: "group-chain-test",
      hostId: "host-test",
      leaseDurationMs: 5_000,
      gitFactory: (options) => happyGitFake(
        options,
        order,
        true,
        false,
        committedManagementContents
      ),
      residentLauncher: {
        async open(input) {
          const context = input.request.executionContext!;
          let leaderTurn = 0;
          if (context.role === "leader") {
            leaderOpens.push({
              groupRunId: context.groupRunId!,
              agentId: input.request.agent
            });
            expect(input.request.workspacePath).toContain("management-workspace");
            leaderMemories.push(await fs.readFile(input.inputs!.memoryPath, "utf8"));
          }
          return {
            async submit(turn) {
              if (context.role !== "leader") {
                memberInboxes.push(await fs.readFile(input.request.inboxPath, "utf8"));
                const memoryDirectory = path.join(
                  input.request.workspacePath,
                  "agent-memory",
                  input.request.agent
                );
                await fs.mkdir(memoryDirectory, { recursive: true });
                const completionMemory = `# ${input.request.agent} memory\n\nDurable delivery evidence.\n`;
                await fs.writeFile(path.join(memoryDirectory, "Memory.md"), completionMemory, "utf8");
                return agentFixtureDelivery(input, turn,
                  { handoff: `${input.request.agent} completed delivery` }, coordinator, undefined, completionMemory);
              }
              leaderTurn += 1;
              const firstGroup = input.request.agent === "idea";
              const action: ControlAction = leaderTurn === 1 ? {
                tool: "assign_group_tasks",
                groupRunId: context.groupRunId,
                coordinatorEpoch: context.coordinatorEpoch,
                tasks: firstGroup ? [
                  {
                    taskId: "task-deliver",
                    assignment: "Deliver the result with bounded coordination context",
                    assigneeAgentId: "execution"
                  },
                  {
                    taskId: "task-write",
                    assignment: "Write supporting evidence",
                    assigneeAgentId: "writing"
                  }
                ] : [
                  {
                    taskId: "task-review",
                    assignment: "Review the integrated result",
                    assigneeAgentId: "review"
                  },
                  {
                    taskId: "task-quality",
                    assignment: "Validate quality gates",
                    assigneeAgentId: "quality"
                  }
                ]
              } : leaderTurn === 2 ? {
                tool: "request_group_integration",
                groupRunId: context.groupRunId,
                coordinatorEpoch: context.coordinatorEpoch,
                integrationOwnerAgentId: firstGroup ? "writing" : "quality"
              } : {
                tool: "complete_group",
                groupRunId: context.groupRunId,
                coordinatorEpoch: context.coordinatorEpoch,
                output: firstGroup ? "Delivery group output" : "Review group output"
              };
              const fresh = await input.turnRequestFactory({ baseRequest: input.request, turn });
              const authority = await input.controlAuthorityFactory!({ request: fresh.request, turn });
              const envelope = {
                projectId: state.id,
                agent: fresh.request.agent,
                invocationId: turn.invocationId,
                callId: `call-${turn.invocationId}`,
                stateVersion: authority.control.stateVersion,
                capabilityHash: authority.control.capabilityHash,
                receivedAt: new Date().toISOString(),
                action
              };

              return agentFixtureLeaderResult(input, turn, {
                handoff: leaderTurn === 1
                  ? "management action\n-----BEGIN PRIVATE KEY-----\nfixture-private-material\n-----END PRIVATE KEY-----"
                  : "management action",
                controlActions: [envelope]
              });
            },
            async pause() {},
            async resume() {},
            async close() {}
          };
        }
      }
    });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    try {
      await coordinator.createProject(state, { enabled: true, provider: "github" });
      await waitFor(() => state.status === "completed", 15_000);

      const groupForNode = (nodeId: string) => state.groupRuns?.find((group) =>
        state.nodeRuns?.find((nodeRun) => nodeRun.id === group.nodeRunId)?.node.nodeId === nodeId
      );
      const deliveryGroup = groupForNode("delivery-team");
      const reviewGroup = groupForNode("review-team");
      expect(deliveryGroup).toMatchObject({ status: "completed", leaderAgentId: "idea" });
      expect(reviewGroup).toMatchObject({ status: "completed", leaderAgentId: "main" });
      const deliveryNode = state.nodeRuns?.find((node) => node.id === deliveryGroup?.nodeRunId);
      const reviewNode = state.nodeRuns?.find((node) => node.id === reviewGroup?.nodeRunId);
      expect(deliveryNode).toMatchObject({ sourceAgentId: "idea", activatedByAgentId: "idea" });
      expect(reviewNode).toMatchObject({
        sourceNodeRunId: deliveryGroup?.nodeRunId,
        activatedByAgentId: "main"
      });
      expect(reviewNode?.sourceAgentId).toBeUndefined();
      expect(await groupActivationOriginEvent(storage, state.id, "delivery-team"))
        .toMatchObject({ kind: "agent-route", sourceAgentId: "idea", route: "strong" });
      expect(await groupActivationOriginEvent(storage, state.id, "review-team"))
        .toMatchObject({
          kind: "group-route",
          sourceNodeRunId: deliveryGroup?.nodeRunId,
          sourceGroupRunId: deliveryGroup?.id,
          route: "fixed"
        });
      expect(leaderOpens).toEqual([
        { groupRunId: deliveryGroup?.id, agentId: "idea" },
        { groupRunId: reviewGroup?.id, agentId: "main" }
      ]);
      expect(leaderMemories[0]).toContain("No prior management-memory snapshot");
      expect(leaderMemories[1]).toContain("Coordinator: idea");
      expect(leaderMemories[1]).not.toContain("fixture-external-secret");
      expect(leaderMemories[1]).not.toContain("fixture-external-private-material");
      expect(leaderMemories[1]).toContain("[REDACTED");
      expect(leaderMemories[1]!.length).toBeLessThan(20_000);
      expect(committedManagementContents.length).toBeGreaterThanOrEqual(6);
      expect(committedManagementContents.join("\n")).not.toContain("fixture-private-material");
      expect(memberInboxes.some(inbox => inbox.includes("Deliver the result with bounded coordination context"))).toBe(true);
      expect(memberInboxes.some(inbox => inbox.includes("Write supporting evidence"))).toBe(true);
      expect(memberInboxes.every(inbox => !inbox.includes("## Shared group task state"))).toBe(true);
      expect(state.executions?.some((execution) =>
        execution.groupRunId === deliveryGroup?.id && execution.agentId === "idea"
      )).toBe(false);
      expect(state.executions?.some((execution) =>
        execution.groupRunId === reviewGroup?.id && execution.agentId === "main"
      )).toBe(false);
      const deliveryFinalMerge = order.indexOf(
        `merge-group:${deliveryGroup?.id}:final-integration`
      );
      const reviewActivation = order.indexOf(`group:${reviewGroup?.id}`);
      expect(deliveryFinalMerge).toBeGreaterThanOrEqual(0);
      expect(reviewActivation).toBeGreaterThan(deliveryFinalMerge);
      expect(order.some((entry) => entry.startsWith("business-memory:"))).toBe(false);
      const recoveryMemoryAgents = coordinator.database().eventsAfter(state.id, 0, 100_000)
        .filter((event) => event.type === "execution.recovery_memory.snapshotted")
        .map((event) => event.agentId);
      expect(recoveryMemoryAgents).toEqual([]);
      const deliveries = state.executions!.filter((execution) => execution.groupRunId === deliveryGroup!.id);
      expect(deliveries).toHaveLength(3);
      for (const execution of deliveries) {
        const memory = `# ${execution.agentId} memory\n\nDurable delivery evidence.\n`;
        const completion = state.taskCompletions![execution.id]!;
        // Legacy v2 forwards its handoff through the existing S execution
        // output. The file handoff receipt is used by other runtime paths;
        // this fixture must not introduce a second handoff pipeline.
        expect(completion).toMatchObject({ agent: execution.agentId, status: "requested", memory,
          invocationId: execution.invocationId });
        expect(await fs.readFile(completion.memoryPath!, "utf8")).toContain(memory.trim());
        if (execution.purpose === "delivery") expect(completion.memoryPath).toBe(path.join(execution.worktreePath, "agent-memory", execution.agentId, "Memory.md"));
        expect(execution.output).toContain(`${execution.agentId} completed delivery`);
      }
      expect(order.indexOf(`release-group:${deliveryGroup?.id}`))
        .toBeLessThan(reviewActivation);
      expect(state.collaboration?.routeOutbox.filter((route) => route.status === "delivered"))
        .toHaveLength(3);
    } finally { await coordinator.shutdown(); }
  }, 15_000);

  it("stop-confirms a failed pre-PR member and executes the Leader-authorized handoff at a fresh ownership epoch", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-collaboration-handoff-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_22222222222222222222222222222222");
    state.orchestration = {
      ...state.orchestration,
      collaborations: [{
        id: "handoff-team",
        displayName: "Handoff team",
        memberAgentIds: ["idea", "execution"],
        renamePolicy: "editable"
      }],
      input: { source: "input", target: "handoff-team" },
      routes: { ...state.orchestration.routes, "handoff-team": [{ target: "finish", kind: "strong" }] }
    };
    await storage.createProject(state);
    const order: string[] = [];
    let leaderTurn = 0;
    let ideaClosed = 0;
    let ideaTurns = 0;
    const successorInboxes: string[] = [];
    const coordinator = new CollaborationRuntimeCoordinator({
      storage,
      serviceId: "handoff-test",
      hostId: "host-test",
      leaseDurationMs: 5_000,
      gitFactory: (options) => happyGitFake(options, order, true, true),
      residentLauncher: {
        async open(input) {
          const context = input.request.executionContext!;
          if (context.role !== "leader" && input.request.agent === "execution") {
            successorInboxes.push(await fs.readFile(input.request.inboxPath, "utf8"));
          }
          return {
            async submit(turn) {
              if (context.role === "leader") {
                leaderTurn += 1;
                const action: ControlAction = leaderTurn === 1 ? {
                  tool: "assign_group_tasks",
                  groupRunId: context.groupRunId,
                  coordinatorEpoch: context.coordinatorEpoch,
                  tasks: [{ taskId: "task-handoff", assignment: "Recover this task", assigneeAgentId: "idea" }]
                } : leaderTurn === 2 ? {
                  tool: "assign_group_tasks",
                  groupRunId: context.groupRunId,
                  coordinatorEpoch: context.coordinatorEpoch,
                  tasks: [{ taskId: "task-handoff", assignment: "Recover this task", assigneeAgentId: "execution" }]
                } : leaderTurn === 3 ? {
                  tool: "request_group_integration",
                  groupRunId: context.groupRunId,
                  coordinatorEpoch: context.coordinatorEpoch,
                  integrationOwnerAgentId: "execution"
                } : {
                  tool: "complete_group",
                  groupRunId: context.groupRunId,
                  coordinatorEpoch: context.coordinatorEpoch,
                  output: "Recovered group output"
                };
                const fresh = await input.turnRequestFactory({ baseRequest: input.request, turn });
                const authority = await input.controlAuthorityFactory!({ request: fresh.request, turn });
                const envelope = {
                  projectId: state.id,
                  agent: fresh.request.agent,
                  invocationId: turn.invocationId,
                  callId: `call-${turn.invocationId}`,
                  stateVersion: authority.control.stateVersion,
                  capabilityHash: authority.control.capabilityHash,
                  receivedAt: new Date().toISOString(),
                  action
                };

                return agentFixtureLeaderResult(input, turn, { handoff: "leader action", controlActions: [envelope] });
              }
              if (input.request.agent === "idea") {
                ideaTurns += 1;
                if (ideaTurns === 1) {
                  await agentFixtureRequests(input, turn, [{ tool: "git_push", reason: "Preserve the original Agent's commit" }]);
                  return { handoff: "retained predecessor model output" };
                }
                throw new Error("fixture member crash before PR creation");
              }
              return agentFixtureDelivery(input, turn, { handoff: "execution recovered delivery" }, coordinator);
            },
            async pause() {},
            async resume() {},
            async close() {
              if (input.request.agent === "idea") ideaClosed += 1;
            }
          };
        }
      }
    });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    try {
      await coordinator.createProject(state, { enabled: true, provider: "github" });
      await waitFor(() => state.status === "completed");

      expect(ideaClosed).toBe(1);
      const predecessor = state.executions?.find((execution) => execution.agentId === "idea");
      const successor = state.executions?.find((execution) =>
        execution.predecessorExecutionId === predecessor?.id
      );
      expect(predecessor).toMatchObject({ status: "superseded", ownershipEpoch: 1 });
      expect(successor).toMatchObject({
        agentId: "execution",
        status: "succeeded",
        ownershipEpoch: 2,
        predecessorExecutionId: predecessor?.id
      });
      expect(state.pullRequests?.find((pull) => pull.ownerExecutionId === predecessor?.id)).toBeUndefined();
      expect(order.filter((entry) => entry.startsWith("close-pr:"))).toEqual([]);
      expect(state.taskCompletions?.[predecessor!.id]).toBeUndefined();
      expect(state.taskCompletions?.[successor!.id]).toMatchObject({ agent: "execution" });
      expect(ideaTurns).toBe(2);
      expect(successorInboxes.every(inbox => !inbox.includes("## Retained predecessor provenance"))).toBe(true);
      expect(successorInboxes.some(inbox => inbox.includes("来源："))).toBe(true);
      expect(predecessor?.failureReason).toContain("fixture member crash before PR creation");
      expect(state.groupRuns?.[0]).toMatchObject({ status: "completed" });
    } finally { await coordinator.shutdown(); }
  });

  it("lets the Leader resume the original retained PR owner after actual stop proof", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-retained-pull-failure-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_23232323232323232323232323232323");
    state.agents.idea.sessionPersistence = false;
    state.orchestration = {
      ...state.orchestration,
      collaborations: [{
        id: "retained-pull-team",
        displayName: "Retained pull team",
        memberAgentIds: ["idea", "execution"],
        renamePolicy: "editable"
      }],
      input: { source: "input", target: "retained-pull-team" },
      routes: {
        ...state.orchestration.routes,
        "retained-pull-team": [{ target: "finish", kind: "strong" }]
      }
    };
    await storage.createProject(state);
    const order: string[] = [];
    let mergeMode: "retain" | "fail" | "merge" = "retain";
    let leaderTurn = 0;
    let failedMergeCalls = 0;
    const workerSubmits = new Map<string, number>();
    const workerRequests: AgentRunRequest[] = [];
    let originalExecutionId: string | undefined;
    let originalPullNumber: number | undefined;
    let originalCloseConfirmed = false;
    let leaderObservedStopProof = false;
    let explicitFailureObserved = false;
    let originalCreateCalls = 0;
    let originalPushCalls = 0;
    const coordinator = new CollaborationRuntimeCoordinator({
      storage,
      serviceId: "retained-pull-failure-test",
      hostId: "host-test",
      gitFactory: (options) => {
        const git = happyGitFake(options, order);
        const observePullRequest = git.observePullRequest.bind(git);
        const mergePullRequest = git.mergePullRequest.bind(git);
        const createPullRequest = git.createPullRequest.bind(git);
        const checkpointAndPush = git.checkpointAndPush.bind(git);
        return {
          ...git,
          async createPullRequest(request) {
            if (request.execution.agentId === "idea") originalCreateCalls += 1;
            return createPullRequest(request);
          },
          async checkpointAndPush(request) {
            if (request.execution.agentId === "idea") originalPushCalls += 1;
            return checkpointAndPush(request);
          },
          async closePullRequest() { throw new Error("System must preserve the original Agent PR"); },
          async mergePullRequest(request) {
            if (mergeMode === "retain") {
              mergeMode = "fail";
              const pull = await observePullRequest({
                repository: request.repository,
                providerNumber: request.providerNumber,
                ownerExecutionId: request.execution.id,
                signal: request.signal
              });
              if (!pull) throw new Error("fixture retained pull disappeared");
              return { ...pull, status: "open" as const };
            }
            if (mergeMode === "fail") {
              mergeMode = "merge";
              failedMergeCalls += 1;
              throw new Error("fixture retained provider merge failed");
            }
            return mergePullRequest(request);
          }
        };
      },
      residentLauncher: {
        async open(input) {
          const context = input.request.executionContext!;
          return {
            async submit(turn) {
              if (context.role === "leader") {
                leaderTurn += 1;
                if (leaderTurn === 2) {
                  const stopped = coordinator.database().projectState(state.id).executions.find((item) => item.id === originalExecutionId);
                  expect(stopped).toMatchObject({ status: "stopped", ownershipEpoch: 1 });
                  expect(coordinator.database().eventsAfter(state.id, 0, 1000).some((event) =>
                    event.type === "execution.stop_confirmed" && event.executionId === originalExecutionId && event.ownershipEpoch === 1)).toBe(true);
                  expect(originalCloseConfirmed).toBe(true);
                  expect(explicitFailureObserved).toBe(true);
                  expect(turn.prompt).toContain(`existing PR #${originalPullNumber}`);
                  leaderObservedStopProof = true;
                }
                const pending = state.tasks?.find((task) => task.status === "continuation_pending");
                const action: ControlAction = leaderTurn === 1 ? {
                  tool: "assign_group_tasks",
                  groupRunId: context.groupRunId!,
                  coordinatorEpoch: context.coordinatorEpoch!,
                  tasks: [{
                    taskId: "task-retained-pull",
                    assignment: "Deliver through a retained pull",
                    assigneeAgentId: "idea"
                  }]
                } : leaderTurn === 2 ? {
                  tool: "assign_group_tasks",
                  groupRunId: context.groupRunId!,
                  coordinatorEpoch: context.coordinatorEpoch!,
                  tasks: [{
                    taskId: pending?.id ?? "missing-continuation",
                    assignment: "Inspect the retained provider result and finish the original delivery",
                    assigneeAgentId: "idea"
                  }]
                } : leaderTurn === 3 ? {
                  tool: "request_group_integration",
                  groupRunId: context.groupRunId!,
                  coordinatorEpoch: context.coordinatorEpoch!,
                  integrationOwnerAgentId: "execution"
                } : {
                  tool: "complete_group",
                  groupRunId: context.groupRunId!,
                  coordinatorEpoch: context.coordinatorEpoch!,
                  output: "Retained pull recovery completed"
                };
                const fresh = await input.turnRequestFactory({ baseRequest: input.request, turn });
                const authority = await input.controlAuthorityFactory!({ request: fresh.request, turn });
                const envelope = {
                  projectId: state.id,
                  agent: fresh.request.agent,
                  invocationId: turn.invocationId,
                  callId: `call-${turn.invocationId}`,
                  stateVersion: authority.control.stateVersion,
                  capabilityHash: authority.control.capabilityHash,
                  receivedAt: new Date().toISOString(),
                  action
                };


                return agentFixtureLeaderResult(input, turn, { handoff: "leader action", controlActions: [envelope] });
              }
              const executionId = context.executionId!;
              workerSubmits.set(executionId, (workerSubmits.get(executionId) ?? 0) + 1);
              if (input.request.agent !== "idea") return agentFixtureDelivery(input, turn,
                { handoff: `output from ${executionId}` }, coordinator);
              originalExecutionId ??= executionId;
              const fresh = await input.turnRequestFactory({ baseRequest: input.request, turn });
              workerRequests.push(fresh.request);
              if (workerRequests.length === 1) {
                await fresh.request.onDurableSessionStarted?.({ schemaVersion: 1, harnessId: "codex",
                  adapterVersion: "1", generation: 0, nativeId: "original-retained-session", durable: true,
                  createdAt: new Date().toISOString() }, "original-retained-session");
                const result = await agentFixtureDelivery(input, turn, { handoff: "Original delivery with an open PR" }, coordinator);
                originalPullNumber = coordinator.database().projectState(state.id).pullRequests.find((item) => item.ownerExecutionId === executionId)?.providerNumber;
                return result;
              }
              expect(fresh.request.resumeThreadId).toBe("original-retained-session");
              if (workerRequests.length === 2) {
                try {
                  await agentFixtureRequests(input, turn, [{ tool: "github_merge_pr", providerNumber: originalPullNumber,
                    reason: "Original Agent explicitly retries its open PR" }]);
                } catch (error) {
                  expect(String(error)).toContain("fixture retained provider merge failed");
                  explicitFailureObserved = true;
                  throw error;
                }
                throw new Error("Fixture provider failure was not returned to its original Agent");
              }
              expect(leaderObservedStopProof).toBe(true);
              expect(context.ownershipEpoch).toBe(2);
              expect(turn.prompt).toContain("Inspect the retained provider result");
              const requests = await agentFixtureRequests(input, turn, [{ tool: "github_get_pr", providerNumber: originalPullNumber },
                { tool: "github_merge_pr", providerNumber: originalPullNumber, reason: "Original Agent continues after Leader coordination" },
                { tool: "finish_task", summary: "Original delivery completed" }]);
              expect(requests.results[0]).toMatchObject({ providerNumber: originalPullNumber, status: "open", ownerExecutionId: executionId });
              expect(requests.results[1]).toMatchObject({ providerNumber: originalPullNumber, status: "merged", ownerExecutionId: executionId });
              return { handoff: "Original delivery completed", controlActions: requests.envelopes };
            },
            async pause() {},
            async resume() {},
            async close() { if (input.request.agent === "idea" && context.ownershipEpoch === 1) originalCloseConfirmed = true; }
          };
        }
      }
    });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    await coordinator.createProject(state, { enabled: true, provider: "github" });
    await waitFor(() => state.status === "completed" || Boolean(state.lastError));
    await coordinator.shutdown();
    const predecessor = state.executions?.find((execution) => execution.agentId === "idea");
    if (!predecessor) throw new Error("fixture retained predecessor missing");
    expect(state.lastError, JSON.stringify({ tasks: state.tasks, executions: state.executions,
      requests: workerRequests.map((item) => ({ agent: item.agent, epoch: item.executionContext?.ownershipEpoch })) })).toBeUndefined();
    expect(state.status).toBe("completed");
    expect(failedMergeCalls).toBe(1);
    expect(workerSubmits.get(predecessor.id)).toBe(3);
    expect(originalCreateCalls).toBe(1);
    expect(originalPushCalls).toBe(1);
    expect(state.executions?.find((execution) => execution.id === predecessor.id))
      .toMatchObject({ status: "succeeded", ownershipEpoch: 2 });
    expect(state.pullRequests?.find((pull) => pull.ownerExecutionId === predecessor.id))
      .toMatchObject({ status: "merged", providerNumber: originalPullNumber });
    expect(state.executions?.some((execution) =>
      execution.predecessorExecutionId === predecessor.id && execution.agentId === "execution"
    )).toBe(false);
    expect(workerRequests.map((request) => request.workspacePath)).toEqual([predecessor.worktreePath, predecessor.worktreePath, predecessor.worktreePath]);
    expect(workerRequests.map((request) => request.executionContext?.ownershipEpoch)).toEqual([1, 1, 2]);
  }, 15_000);

  it("repairs failed final integration through group before a fresh canonical PR to main", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-final-repair-topology-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_24242424242424242424242424242424");
    state.orchestration = {
      ...state.orchestration,
      collaborations: [{
        id: "final-repair-team",
        displayName: "Final repair team",
        memberAgentIds: ["idea", "execution", "writing"],
        renamePolicy: "editable"
      }],
      input: { source: "input", target: "final-repair-team" },
      routes: {
        ...state.orchestration.routes,
        "final-repair-team": [{ target: "finish", kind: "strong" }]
      }
    };
    state.agents.idea = { ...state.agents.idea, sessionPersistence: false };
    await storage.createProject(state);
    const order: string[] = [];
    const openedPulls: Array<{
      executionId: string;
      branch: string;
      base: string;
      purpose: "delivery" | "final-integration";
    }> = [];
    const sessionBegins: Array<{ executionId: string; branch: string }> = [];
    const workerSubmits: Array<{ executionId: string; prompt: string }> = [];
    let leaderTurn = 0;
    let failedCanonicalId: string | undefined;
    let continuationTaskId: string | undefined;
    let lostRepairMergeResponse = false;
    let repairExecutionId: string | undefined;
    let repairImplementations = 0;
    let originalRepairCwd: string | undefined;
    const mergeRequests: string[] = [];
    const coordinator = new CollaborationRuntimeCoordinator({
      storage,
      serviceId: "final-repair-topology-test",
      hostId: "host-test",
      leaseDurationMs: 5_000,
      gitFactory: (options) => {
        const git = happyGitFake(options, order, true, (execution) => {
          if (execution.purpose !== "final-integration" ||
            !execution.executionBranch.startsWith("groups/")) return false;
          failedCanonicalId ??= execution.id;
          return execution.id === failedCanonicalId;
        });
        const sessionBegin = git.sessionBegin.bind(git);
        const createPullRequest = git.createPullRequest.bind(git);
        const mergePullRequest = git.mergePullRequest.bind(git);
        return {
          ...git,
          async sessionBegin(execution, epoch, input, signal) {
            sessionBegins.push({ executionId: execution.id, branch: execution.executionBranch });
            order.push(`session:${execution.id}:${execution.executionBranch}`);
            return sessionBegin(execution, epoch, input, signal);
          },
          async createPullRequest(request) {
            openedPulls.push({
              executionId: request.execution.id,
              branch: request.execution.executionBranch,
              base: request.base,
              purpose: request.execution.purpose
            });
            return createPullRequest(request);
          },
          async mergePullRequest(request) {
            mergeRequests.push(request.execution.id);
            const merged = await mergePullRequest(request);
            if (!lostRepairMergeResponse &&
              request.execution.purpose === "final-integration" &&
              request.execution.executionBranch.startsWith("executions/")) {
              lostRepairMergeResponse = true;
              repairExecutionId = request.execution.id;
              throw new Error("fixture lost the merged repair response");
            }
            return merged;
          }
        };
      },
      residentLauncher: {
        async open(input) {
          const context = input.request.executionContext!;
          return {
            async submit(turn) {
              if (context.role === "leader") {
                leaderTurn += 1;
                let action: ControlAction;
                if (leaderTurn === 1) {
                  action = {
                    tool: "assign_group_tasks",
                    groupRunId: context.groupRunId!,
                    coordinatorEpoch: context.coordinatorEpoch!,
                    tasks: [{
                      taskId: "task-final-repair-seed",
                      assignment: "Seed the group branch",
                      assigneeAgentId: "idea"
                    }]
                  };
                } else if (leaderTurn === 2) {
                  action = {
                    tool: "request_group_integration",
                    groupRunId: context.groupRunId!,
                    coordinatorEpoch: context.coordinatorEpoch!,
                    integrationOwnerAgentId: "execution"
                  };
                } else if (leaderTurn === 3) {
                  const pending = state.tasks?.find((task) =>
                    task.status === "continuation_pending"
                  );
                  if (!pending) throw new Error("fixture final continuation task was not published");
                  continuationTaskId = pending.id;
                  action = {
                    tool: "assign_group_tasks",
                    groupRunId: context.groupRunId!,
                    coordinatorEpoch: context.coordinatorEpoch!,
                    tasks: [{
                      taskId: pending.id,
                      assignment: pending.assignment,
                      assigneeAgentId: "idea"
                    }]
                  };
                } else if (leaderTurn === 4 || leaderTurn === 5) {
                  if (!continuationTaskId) {
                    throw new Error("fixture merged repair task id was not retained");
                  }
                  action = {
                    tool: "assign_group_tasks",
                    groupRunId: context.groupRunId!,
                    coordinatorEpoch: context.coordinatorEpoch!,
                    tasks: [{
                      taskId: continuationTaskId,
                      assignment: leaderTurn === 4 ? "Resume the original repair and inspect its lost merge response"
                        : "Publish the repaired group branch to main",
                      assigneeAgentId: leaderTurn === 4 ? "idea" : "writing"
                    }]
                  };
                } else {
                  action = {
                    tool: "complete_group",
                    groupRunId: context.groupRunId!,
                    coordinatorEpoch: context.coordinatorEpoch!,
                    output: "Canonical final integration completed"
                  };
                }
                const fresh = await input.turnRequestFactory({ baseRequest: input.request, turn });
                const authority = await input.controlAuthorityFactory!({ request: fresh.request, turn });
                const envelope = {
                  projectId: state.id,
                  agent: fresh.request.agent,
                  invocationId: turn.invocationId,
                  callId: `call-${turn.invocationId}`,
                  stateVersion: authority.control.stateVersion,
                  capabilityHash: authority.control.capabilityHash,
                  receivedAt: new Date().toISOString(),
                  action
                };

                return agentFixtureLeaderResult(input, turn, { handoff: "leader action", controlActions: [envelope] });
              }
              workerSubmits.push({
                executionId: context.executionId!,
                prompt: turn.prompt
              });
              const owned = coordinator.database().projectState(state.id).executions.find((execution) => execution.id === context.executionId)!;
              if (owned.id === failedCanonicalId) {
                expect(coordinator.database().projectState(state.id).pullRequests.find((pull) => pull.ownerExecutionId === owned.id))
                  .toMatchObject({ status: "closed" });
                throw new Error("fixture canonical Agent channel failed after it closed its own conflicting PR and reported it");
              }
              const repair = owned.purpose === "final-integration" && owned.executionBranch.startsWith("executions/");
              const fresh = await input.turnRequestFactory({ baseRequest: input.request, turn });
              if (repair && owned.id !== repairExecutionId) {
                repairImplementations += 1;
                originalRepairCwd = input.request.workspacePath;
                await fresh.request.onDurableSessionStarted!({ schemaVersion: 1,
                  harnessId: state.agents.idea.harness!, adapterVersion: "test", nativeId: "original-final-repair-session",
                  generation: 1, durable: true, createdAt: new Date().toISOString() }, "original-final-repair-session");
                await fs.writeFile(path.join(input.request.workspacePath, "original-repair.txt"), "Agent's original repaired business result");
              } else if (repair) {
                expect(fresh.request.resumeThreadId).toBe("original-final-repair-session");
                expect(input.request.workspacePath).toBe(originalRepairCwd);
                expect(await fs.readFile(path.join(input.request.workspacePath, "original-repair.txt"), "utf8"))
                  .toBe("Agent's original repaired business result");
              }
              return agentFixtureDelivery(input, turn, { handoff: owned.purpose === "delivery" ? "delivery seeded"
                : repair ? "repair branch output" : "canonical group publication" }, coordinator, undefined, undefined,
                { retainedPull: repair && owned.id === repairExecutionId, closeConflictedPull: !repair });
            },
            async pause() {},
            async resume() {},
            async close() { if (context.executionId) order.push(`native-close:${context.executionId}:${context.ownershipEpoch}`); }
          };
        }
      }
    });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    try {
      await coordinator.createProject(state, { enabled: true, provider: "github" });
      await waitFor(() => state.status === "completed" || Boolean(state.lastError));
      expect(state.lastError, JSON.stringify({ leaderTurn, repairImplementations, executions: state.executions,
        nativeSessions: state.agentSessionIds })).toBeUndefined();

      const group = state.groupRuns?.[0];
      const finals = state.executions?.filter((execution) =>
        execution.purpose === "final-integration"
      ).sort((left, right) => left.ownershipEpoch - right.ownershipEpoch) ?? [];
      expect(finals).toHaveLength(3);
      const [failed, repair, canonical] = finals;
      expect(failed).toMatchObject({
        id: failedCanonicalId,
        ownershipEpoch: 1,
        status: "superseded",
        executionBranch: group?.groupBranch
      });
      expect(repair).toMatchObject({
        ownershipEpoch: 3,
        status: "succeeded",
        predecessorExecutionId: failed?.id,
        executionBranch: expect.stringMatching(/^executions\//)
      });
      expect(canonical).toMatchObject({
        ownershipEpoch: 4,
        status: "succeeded",
        agentId: "writing",
        predecessorExecutionId: repair?.id,
        executionBranch: group?.groupBranch
      });
      expect(group).toMatchObject({
        status: "completed",
        integrationOwnerExecutionId: canonical?.id,
        finalPullRequestId: expect.any(String)
      });
      const finalPulls = openedPulls.filter((pull) => pull.purpose === "final-integration");
      expect(finalPulls.map((pull) => ({ branch: pull.branch, base: pull.base }))).toEqual([
        { branch: group?.groupBranch, base: "main" },
        { branch: repair?.executionBranch, base: group?.groupBranch },
        { branch: group?.groupBranch, base: "main" }
      ]);
      expect(state.pullRequests?.find((pull) => pull.ownerExecutionId === failed?.id))
        .toMatchObject({ status: "closed", base: "main" });
      expect(state.pullRequests?.find((pull) => pull.ownerExecutionId === repair?.id))
        .toMatchObject({ status: "merged", base: group?.groupBranch });
      expect(state.pullRequests?.find((pull) => pull.ownerExecutionId === canonical?.id))
        .toMatchObject({ status: "merged", base: "main", id: group?.finalPullRequestId });
      expect(workerSubmits.filter((turn) => turn.executionId === canonical?.id)).toHaveLength(1);
      expect(workerSubmits.filter((turn) => turn.executionId === repair?.id)).toHaveLength(2);
      expect(repairImplementations).toBe(1);
      expect(state.taskCompletions?.[repair!.id]).toMatchObject({ agent: "idea", summary: "repair branch output" });
      expect(state.taskCompletions?.[canonical!.id]).toMatchObject({ agent: "writing", summary: "canonical group publication" });
      expect(mergeRequests.filter((executionId) => executionId === repair?.id)).toHaveLength(1);
      expect(order.filter((step) => step === "close-pr:execution")).toHaveLength(1);
      expect(order.indexOf(`native-close:${failed!.id}:1`)).toBeLessThan(order.indexOf(`session:${repair!.id}:${repair!.executionBranch}`));
      expect(sessionBegins).toContainEqual({
        executionId: canonical?.id,
        branch: group?.groupBranch
      });
      expect(order.indexOf(`release-failed-group:${group?.id}`)).toBeLessThan(
        order.indexOf(`session:${canonical?.id}:${group?.groupBranch}`)
      );
    } finally { await coordinator.shutdown(); }
  }, 15_000);

  it("persists the group Agent output before its authorization failure and wakes that original Agent to finish", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-collaboration-group-auth-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_23232323232323232323232323232323");
    const databasePath = path.join(root, "collaboration-state.sqlite");
    state.orchestration = {
      ...state.orchestration,
      collaborations: [{
        id: "authorization-team",
        displayName: "Authorization team",
        memberAgentIds: ["idea", "execution"],
        renamePolicy: "editable"
      }],
      input: { source: "input", target: "authorization-team" },
      routes: {
        ...state.orchestration.routes,
        "authorization-team": [{ target: "finish", kind: "strong" }]
      }
    };
    state.agents.idea = { ...state.agents.idea, sessionPersistence: false };
    await storage.createProject(state);
    const order: string[] = [];
    const deliveryBodies: string[] = [];
    let rejectAuthorization = true;
    let leaderTurn = 0;
    let ideaModelTurns = 0;
    let executionStops = 0;
    let businessImplementations = 0;
    let authorizationReturnedToAgent = false;
    let originalCwd: string | undefined;
    let activeCoordinator!: CollaborationRuntimeCoordinator;
    const gitFactory = (options: CollaborationGitFactoryOptions): CollaborationGitRuntime => {
        const git = happyGitFake(options, order);
        const checkpointAndPush = git.checkpointAndPush.bind(git);
        const createPullRequest = git.createPullRequest.bind(git);
        return {
          ...git,
          async checkpointAndPush(request) {
            if (request.execution.agentId === "idea" &&
              request.execution.purpose === "delivery" && rejectAuthorization) {
              rejectAuthorization = false;
              throw new GitHubAuthorizationError(401, "fixture push authorization expired");
            }
            return checkpointAndPush(request);
          },
          async createPullRequest(request) {
            if (request.execution.agentId === "idea" && request.execution.purpose === "delivery") {
              deliveryBodies.push(request.body);
            }
            return createPullRequest(request);
          }
        };
      };
    const residentLauncher: CollaborationResidentLauncher = {
        async stopLeaderForRecovery() {
          return { stopped: true, evidence: { processGroupAbsent: true } };
        },
        async stopForRecovery() {
          executionStops += 1;
          return { stopped: true, evidence: { processGroupAbsent: true } };
        },
        async open(input) {
          const context = input.request.executionContext!;
          return {
            async submit(turn) {
              if (context.role === "leader") {
                leaderTurn += 1;
                const action: ControlAction = leaderTurn === 1 ? {
                  tool: "assign_group_tasks",
                  groupRunId: context.groupRunId,
                  coordinatorEpoch: context.coordinatorEpoch,
                  tasks: [{
                    taskId: "task-authorization",
                    assignment: "Produce the durable authorization output",
                    assigneeAgentId: "idea"
                  }]
                } : leaderTurn === 2 ? {
                  tool: "request_group_integration",
                  groupRunId: context.groupRunId,
                  coordinatorEpoch: context.coordinatorEpoch,
                  integrationOwnerAgentId: "execution"
                } : {
                  tool: "complete_group",
                  groupRunId: context.groupRunId,
                  coordinatorEpoch: context.coordinatorEpoch,
                  output: "Authorization recovery completed"
                };
                const fresh = await input.turnRequestFactory({ baseRequest: input.request, turn });
                const authority = await input.controlAuthorityFactory!({ request: fresh.request, turn });
                const envelope = {
                  projectId: state.id,
                  agent: fresh.request.agent,
                  invocationId: turn.invocationId,
                  callId: `call-${turn.invocationId}`,
                  stateVersion: authority.control.stateVersion,
                  capabilityHash: authority.control.capabilityHash,
                  receivedAt: new Date().toISOString(),
                  action
                };

                return agentFixtureLeaderResult(input, turn, { handoff: "leader action", controlActions: [envelope] });
              }
              if (input.request.agent === "idea") {
                ideaModelTurns += 1;
                const fresh = await input.turnRequestFactory({ baseRequest: input.request, turn });
                if (ideaModelTurns === 1) {
                  businessImplementations += 1;
                  originalCwd = fresh.request.workspacePath;
                  await fs.mkdir(originalCwd, { recursive: true });
                  await fs.writeFile(path.join(originalCwd, "authorization-business.md"), "Completed business work before authorization loss");
                  await fresh.request.onDurableSessionStarted?.({ schemaVersion: 1, harnessId: "codex",
                    adapterVersion: "1", generation: 0, nativeId: "group-authorization-original-session", durable: true,
                    createdAt: new Date().toISOString() }, "group-authorization-original-session");
                  return { handoff: "EXACT AUTHORIZATION-SAFE MODEL OUTPUT" };
                }
                expect(fresh.request.resumeThreadId).toBe("group-authorization-original-session");
                expect(fresh.request.workspacePath).toBe(originalCwd);
                expect(await fs.readFile(path.join(originalCwd!, "authorization-business.md"), "utf8"))
                  .toBe("Completed business work before authorization loss");
                if (ideaModelTurns === 2) {
                  try {
                    await agentFixtureRequests(input, turn, [{ tool: "git_push", reason: "Original Agent explicitly publishes its completed business work" }]);
                  } catch (error) {
                    expect(error).toBeInstanceOf(GitHubAuthorizationError);
                    expect(String(error)).toContain("fixture push authorization expired");
                    authorizationReturnedToAgent = true;
                    // Controlled native fault after the actual tool rejection
                    // reaches this Agent; not a script in runtime's exit hook.
                    throw error;
                  }
                  throw new Error("Authorization failure was not returned to the Agent");
                }
                return agentFixtureDelivery(input, turn, { handoff: "EXACT AUTHORIZATION-SAFE MODEL OUTPUT" }, activeCoordinator);
              }
              return agentFixtureDelivery(input, turn, { handoff: "final integration output" }, activeCoordinator);
            },
            async pause() {},
            async resume() {},
            async close() {}
          };
        }
      };
    const coordinator = new CollaborationRuntimeCoordinator({
      storage,
      databasePath,
      serviceId: "group-auth-test",
      hostId: "host-test",
      leaseDurationMs: 5_000,
      gitFactory,
      residentLauncher
    });
    activeCoordinator = coordinator;
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    await coordinator.createProject(state, { enabled: true, provider: "github" });
    await waitFor(() => state.phase === "git:waiting_for_github");
    expect(state.executions?.find((execution) => execution.agentId === "idea")).toMatchObject({
      status: "waiting_authorization",
      waitReason: "EXACT AUTHORIZATION-SAFE MODEL OUTPUT"
    });
    expect(ideaModelTurns).toBe(2);
    await coordinator.shutdown();

    const waitingInspection = CollaborationStateDatabase.open({
      databasePath,
      serviceId: "group-auth-waiting-inspection",
      instanceId: "group-auth-waiting-inspection-instance",
      hostId: "host-test",
      topology: "single-host"
    });
    const waitingProjection = waitingInspection.projectState(state.id);
    expect(waitingProjection.git.status).toBe("waiting_for_github");
    const waitingInitializationOperation = waitingProjection.git.initialization?.operationId;
    const waitingExecution = waitingProjection.executions.find((execution) =>
      execution.agentId === "idea" && execution.purpose === "delivery"
    )!;
    expect(waitingExecution).toMatchObject({
      ownershipEpoch: 1,
      status: "waiting_authorization",
      waitReason: "EXACT AUTHORIZATION-SAFE MODEL OUTPUT"
    });
    const waitingWorktree = waitingExecution.worktreePath;
    waitingInspection.relinquishWriterLease();
    waitingInspection.close();

    const restartedStorage = new ProjectStorage(root, new EventHub());
    await restartedStorage.initialize();
    const restartedState = structuredClone(state);
    const restarted = new CollaborationRuntimeCoordinator({
      storage: restartedStorage,
      databasePath,
      serviceId: "group-auth-restarted",
      hostId: "host-test",
      leaseDurationMs: 5_000,
      gitFactory,
      residentLauncher
    });
    activeCoordinator = restarted;
    if (restarted instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(restarted);
    await restarted.initialize();
    expect(await restarted.recoverProject(restartedState)).toBe(true);
    expect(restartedState).toMatchObject({
      status: "retrying",
      phase: "git:waiting_for_github",
      git: { status: "waiting_for_github" }
    });
    expect(ideaModelTurns).toBe(2);

    await restarted.resumeProject(restartedState);
    await waitFor(() => restartedState.status === "completed");
    expect(ideaModelTurns).toBe(3);
    expect(businessImplementations).toBe(1);
    expect(authorizationReturnedToAgent).toBe(true);
    expect(executionStops).toBeGreaterThanOrEqual(1);
    expect(deliveryBodies).toHaveLength(1);
    expect(deliveryBodies[0]).toBe("EXACT AUTHORIZATION-SAFE MODEL OUTPUT");
    const resumedExecution = restartedState.executions?.find((execution) =>
      execution.id === waitingExecution.id
    );
    expect(resumedExecution).toMatchObject({
      ownershipEpoch: 2,
      worktreePath: waitingWorktree,
      output: "EXACT AUTHORIZATION-SAFE MODEL OUTPUT",
      status: "succeeded"
    });
    expect(restartedState.git?.initialization?.operationId)
      .toBe(waitingInitializationOperation);
    const outputHash = createHash("sha256")
      .update("EXACT AUTHORIZATION-SAFE MODEL OUTPUT")
      .digest("hex");
    await restarted.shutdown();
    const finalInspection = CollaborationStateDatabase.open({
      databasePath,
      serviceId: "group-auth-final-inspection",
      instanceId: "group-auth-final-inspection-instance",
      hostId: "host-test",
      topology: "single-host"
    });
    expect(finalInspection.eventsAfter(state.id, 0, 100_000).some((event) =>
      event.type === "execution.git_stage.persisted" &&
      event.executionId === waitingExecution.id &&
      event.ownershipEpoch === 1 &&
      event.payload.stage === "model_output_persisted" &&
      event.payload.outputSha256 === outputHash
    )).toBe(true);
    expect(finalInspection.projectState(state.id).executions.filter((execution) =>
      execution.id === waitingExecution.id
    )).toHaveLength(1);
    finalInspection.relinquishWriterLease();
    finalInspection.close();
  });

  it("restarts standalone authorization recovery from the exact persisted output", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-standalone-auth-restart-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const databasePath = path.join(root, "collaboration-state.sqlite");
    const state = projectState("prj_24242424242424242424242424242424");
    state.orchestration = {
      ...state.orchestration,
      input: { source: "input", target: "idea" },
      routes: { ...state.orchestration.routes, idea: [{ target: "finish", kind: "strong" }] }
    };
    state.agents.idea = { ...state.agents.idea, sessionPersistence: false };
    await storage.createProject(state);
    const exactOutput = "EXACT STANDALONE AUTHORIZATION OUTPUT";
    const bodies: string[] = [];
    let rejectCheckpointAuthorization = true;
    const checkpointOperations: string[] = [];
    let modelTurns = 0;
    let stopCalls = 0;
    let businessImplementations = 0;
    let authorizationReturnedToAgent = false;
    let originalCwd: string | undefined;
    let activeCoordinator!: CollaborationRuntimeCoordinator;
    const gitFactory = (options: CollaborationGitFactoryOptions): CollaborationGitRuntime => {
      const base = happyGitFake(options, []);
      const checkpointAndPush = base.checkpointAndPush.bind(base);
      const createPullRequest = base.createPullRequest.bind(base);
      return {
        ...base,
        async checkpointAndPush(request) {
          checkpointOperations.push(request.operationId);
          if (request.execution.agentId === "idea" && rejectCheckpointAuthorization) {
            rejectCheckpointAuthorization = false;
            throw new GitHubAuthorizationError(401, "fixture push authorization expired");
          }
          return checkpointAndPush(request);
        },
        async observePullRequestForExecution() {
          return undefined;
        },
        async createPullRequest(request) {
          if (request.execution.agentId === "idea") bodies.push(request.body);
          return createPullRequest(request);
        }
      };
    };
    const residentLauncher: CollaborationResidentLauncher = {
      async stopForRecovery() {
        stopCalls += 1;
        return { stopped: true, evidence: { processGroupAbsent: true } };
      },
      async open(input) {
        return {
          async submit(turn) {
            modelTurns += 1;
            const fresh = await input.turnRequestFactory({ baseRequest: input.request, turn });
            const memoryPath = path.join(fresh.request.workspacePath, "agent-memory", "idea", "Memory.md");
            if (modelTurns === 1) {
              businessImplementations += 1;
              originalCwd = fresh.request.workspacePath;
              await fs.mkdir(path.dirname(memoryPath), { recursive: true });
              await fs.writeFile(memoryPath, "durable standalone file change\n", "utf8");
              await fresh.request.onDurableSessionStarted?.({ schemaVersion: 1, harnessId: "codex",
                adapterVersion: "1", generation: 0, nativeId: "standalone-authorization-original-session", durable: true,
                createdAt: new Date().toISOString() }, "standalone-authorization-original-session");
              return { handoff: exactOutput };
            }
            expect(fresh.request.resumeThreadId).toBe("standalone-authorization-original-session");
            expect(fresh.request.workspacePath).toBe(originalCwd);
            expect(await fs.readFile(memoryPath, "utf8")).toBe("durable standalone file change\n");
            if (modelTurns === 2) {
              try {
                await agentFixtureRequests(input, turn, [{ tool: "git_push", reason: "Original Agent explicitly publishes its durable file change" }]);
              } catch (error) {
                expect(error).toBeInstanceOf(GitHubAuthorizationError);
                expect(String(error)).toContain("fixture push authorization expired");
                authorizationReturnedToAgent = true;
                throw error;
              }
              throw new Error("Authorization failure was not returned to the Agent");
            }
            return agentFixtureDelivery(input, turn, { handoff: exactOutput }, activeCoordinator);
          },
          async pause() {},
          async resume() {},
          async close() {}
        };
      }
    };
    const first = new CollaborationRuntimeCoordinator({
      storage,
      databasePath,
      serviceId: "standalone-auth-first",
      hostId: "host-test",
      gitFactory,
      residentLauncher
    });
    activeCoordinator = first;
    if (first instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(first);
    await first.initialize();
    await first.createProject(state, { enabled: true, provider: "github" });
    await waitFor(() => state.phase === "git:waiting_for_github");
    expect(modelTurns).toBe(2);
    expect(checkpointOperations).toHaveLength(1);
    const waiting = state.executions?.find((execution) => execution.agentId === "idea")!;
    expect(waiting).toMatchObject({
      ownershipEpoch: 1,
      status: "waiting_authorization",
      waitReason: exactOutput
    });
    const originalWorktree = waiting.worktreePath;
    const initializationOperation = state.git?.initialization?.operationId;
    await first.shutdown();

    const waitingInspection = CollaborationStateDatabase.open({
      databasePath,
      serviceId: "standalone-auth-waiting-inspection",
      instanceId: "standalone-auth-waiting-inspection-instance",
      hostId: "host-test",
      topology: "single-host"
    });
    expect(waitingInspection.projectState(state.id).git.status).toBe("waiting_for_github");
    const outputHash = createHash("sha256").update(exactOutput).digest("hex");
    expect(waitingInspection.eventsAfter(state.id, 0, 100_000).some((event) =>
      event.executionId === waiting.id &&
      event.ownershipEpoch === 1 &&
      event.type === "execution.git_stage.persisted" &&
      event.payload.stage === "model_output_persisted" &&
      event.payload.outputSha256 === outputHash
    )).toBe(true);
    waitingInspection.relinquishWriterLease();
    waitingInspection.close();

    const restartedStorage = new ProjectStorage(root, new EventHub());
    await restartedStorage.initialize();
    const restartedState = structuredClone(state);
    const second = new CollaborationRuntimeCoordinator({
      storage: restartedStorage,
      databasePath,
      serviceId: "standalone-auth-second",
      hostId: "host-test",
      gitFactory,
      residentLauncher
    });
    activeCoordinator = second;
    if (second instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(second);
    await second.initialize();
    expect(await second.recoverProject(restartedState)).toBe(true);
    expect(restartedState.phase).toBe("git:waiting_for_github");
    expect(modelTurns).toBe(2);
    await second.resumeProject(restartedState);
    await waitFor(() => restartedState.status === "completed");
    expect(modelTurns).toBe(3);
    expect(businessImplementations).toBe(1);
    expect(authorizationReturnedToAgent).toBe(true);
    expect(checkpointOperations).toHaveLength(2);
    expect(stopCalls).toBe(1);
    expect(bodies).toHaveLength(1);
    expect(bodies[0]).toBe(exactOutput);
    expect(restartedState.executions?.find((execution) => execution.id === waiting.id))
      .toMatchObject({
        id: waiting.id,
        ownershipEpoch: 2,
        worktreePath: originalWorktree,
        output: exactOutput,
        status: "succeeded"
      });
    expect(restartedState.git?.initialization?.operationId).toBe(initializationOperation);
    await second.shutdown();
  });

  it.each(["settled", "pause_save_in_flight", "duplicate_resume"] as const)("resumes all-member coordination without selecting a business successor before the Leader decision (%s)", async timing => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-collaboration-all-failed-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const save = storage.saveState.bind(storage);
    let pausedWriteHeld = false;
    let releasePausedWrite!: () => void;
    const pausedWriteGate = new Promise<void>(resolve => { releasePausedWrite = resolve; });
    storage.saveState = async current => {
      await save(current);
      if (timing !== "settled" && current.status === "retrying" &&
        current.phase === "collaboration:all-members-failed" && !pausedWriteHeld) {
        pausedWriteHeld = true;
        await pausedWriteGate;
      }
    };
    const state = projectState("prj_44444444444444444444444444444444");
    state.orchestration = {
      ...state.orchestration,
      collaborations: [{
        id: "recovery-team",
        displayName: "Recovery team",
        memberAgentIds: ["idea", "execution"],
        renamePolicy: "editable"
      }],
      input: { source: "input", target: "recovery-team" },
      routes: { ...state.orchestration.routes, "recovery-team": [{ target: "finish", kind: "strong" }] }
    };
    state.agents.idea = { ...state.agents.idea, sessionPersistence: false };
    await storage.createProject(state);
    const order: string[] = [];
    let leaderTurn = 0;
    let ideaTurns = 0;
    const failedOnce = new Set<string>();
    const businessOpens: string[] = [];
    let originalIdeaExecutionId: string | undefined;
    let originalIdeaCwd: string | undefined;
    let waitingForLeaderDecision = false;
    let releaseLeaderDecision!: () => void;
    const leaderDecisionGate = new Promise<void>((resolve) => { releaseLeaderDecision = resolve; });
    const coordinator = new CollaborationRuntimeCoordinator({
      storage,
      serviceId: "all-failed-test",
      hostId: "host-test",
      leaseDurationMs: 5_000,
      harnessRecoveryDelayMs: () => 60_000, gitFactory: (options) => happyGitFake(options, order),
      residentLauncher: {
        async open(input) {
          const context = input.request.executionContext!;
          if (context.role !== "leader") businessOpens.push(context.executionId!);
          return {
            async submit(turn) {
              if (context.role === "leader") {
                leaderTurn += 1;
                if (leaderTurn === 2) {
                  waitingForLeaderDecision = true;
                  await leaderDecisionGate;
                }
                const action: ControlAction = leaderTurn === 1 ? {
                  tool: "assign_group_tasks",
                  groupRunId: context.groupRunId,
                  coordinatorEpoch: context.coordinatorEpoch,
                  tasks: [
                    { taskId: "task-recover-idea", assignment: "Retry idea safely", assigneeAgentId: "idea" },
                    { taskId: "task-recover-execution", assignment: "Retry execution safely", assigneeAgentId: "execution" }
                  ]
                } : leaderTurn === 2 ? {
                  tool: "assign_group_tasks",
                  groupRunId: context.groupRunId,
                  coordinatorEpoch: context.coordinatorEpoch,
                  tasks: [{ taskId: "task-recover-idea", assignment: "Continue the stop-confirmed idea task", assigneeAgentId: "idea" }]
                } : leaderTurn === 3 ? {
                  tool: "assign_group_tasks",
                  groupRunId: context.groupRunId,
                  coordinatorEpoch: context.coordinatorEpoch,
                  tasks: [{ taskId: "task-recover-execution", assignment: "Continue the stop-confirmed execution task", assigneeAgentId: "idea" }]
                } : leaderTurn === 4 ? {
                  tool: "request_group_integration",
                  groupRunId: context.groupRunId,
                  coordinatorEpoch: context.coordinatorEpoch,
                  integrationOwnerAgentId: "idea"
                } : {
                  tool: "complete_group",
                  groupRunId: context.groupRunId,
                  coordinatorEpoch: context.coordinatorEpoch,
                  output: "Recovered after all-member failure"
                };
                const fresh = await input.turnRequestFactory({ baseRequest: input.request, turn });
                const authority = await input.controlAuthorityFactory!({ request: fresh.request, turn });
                const envelope = {
                  projectId: state.id,
                  agent: fresh.request.agent,
                  invocationId: turn.invocationId,
                  callId: `call-${turn.invocationId}`,
                  stateVersion: authority.control.stateVersion,
                  capabilityHash: authority.control.capabilityHash,
                  receivedAt: new Date().toISOString(),
                  action
                };

                return agentFixtureLeaderResult(input, turn, { handoff: "leader action", controlActions: [envelope] });
              }
              if (input.request.agent === "idea") ideaTurns += 1;
              if (!failedOnce.has(input.request.agent)) {
                if (input.request.agent === "idea") {
                  originalIdeaExecutionId = context.executionId!;
                  const fresh = await input.turnRequestFactory({ baseRequest: input.request, turn });
                  originalIdeaCwd = fresh.request.workspacePath;
                  await fs.mkdir(originalIdeaCwd, { recursive: true });
                  await fs.writeFile(path.join(originalIdeaCwd, "retained-agent-note.md"), "Original Agent's uncommitted decision note");
                  await fresh.request.onDurableSessionStarted?.({ schemaVersion: 1, harnessId: "codex",
                    adapterVersion: "1", generation: 0, nativeId: "all-member-original-idea-session", durable: true,
                    createdAt: new Date().toISOString() }, "all-member-original-idea-session");
                }
                failedOnce.add(input.request.agent);
                throw new Error(`fixture ${input.request.agent} crashed`);
              }
              if (context.executionId === originalIdeaExecutionId) {
                const fresh = await input.turnRequestFactory({ baseRequest: input.request, turn });
                expect(fresh.request.resumeThreadId).toBe("all-member-original-idea-session");
                expect(fresh.request.workspacePath).toBe(originalIdeaCwd);
                expect(await fs.readFile(path.join(originalIdeaCwd!, "retained-agent-note.md"), "utf8"))
                  .toBe("Original Agent's uncommitted decision note");
              }
              return agentFixtureDelivery(input, turn, { handoff: `${input.request.agent} recovered output` }, coordinator);
            },
            async pause() {},
            async resume() {},
            async close() {}
          };
        }
      }
    });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    try {
      await coordinator.createProject(state, { enabled: true, provider: "github" });
      try {
        await waitFor(() => ["paused", "retrying"].includes(state.status));
      } catch (error) {
        throw new Error(`All-member failure did not reach coordination: ${JSON.stringify({
          status: state.status, phase: state.phase, lastError: state.lastError,
          leaderTurn, tasks: state.tasks, executions: state.executions, groupRuns: state.groupRuns
        })}`, { cause: error });
      }
      expect(state.phase).toBe("collaboration:all-members-failed");
      expect(state.groupRuns?.[0]).toMatchObject({ status: "paused", pauseReason: "all_members_failed" });
      if (timing !== "settled") await waitFor(() => pausedWriteHeld);

      const pausedOwners = structuredClone(state.executions);
      const pausedTasks = structuredClone(state.tasks);
      const gitBeforeResume = [...order];
      const opensBeforeResume = [...businessOpens];
      if (timing !== "settled") expect(pausedWriteHeld).toBe(true);
      await coordinator.resumeProject(state);
      if (timing === "duplicate_resume") await coordinator.resumeProject(state);
      // Resume is durably accepted while the old faulting scheduler still
      // owns its run. Release that exact old save, without timing sleeps.
      releasePausedWrite();
      try {
        await waitFor(() => waitingForLeaderDecision);
      } catch (error) {
        throw new Error(`Resumed all-member failure did not reach its Leader: ${JSON.stringify({
          status: state.status, phase: state.phase, lastError: state.lastError, leaderTurn,
          tasks: state.tasks, executions: state.executions, groupRuns: state.groupRuns,
          latestEvents: coordinator.database().eventsAfter(state.id, 0, 2000).slice(-15)
        })}`, { cause: error });
      }
      expect(state.executions).toEqual(pausedOwners);
      expect(leaderTurn).toBe(2);
      expect(coordinator.database().eventsAfter(state.id, 0, 2000).filter(event =>
        event.type === "group.all_members_coordination.resumed")).toHaveLength(1);
      expect(coordinator.database().eventsAfter(state.id, 0, 2000).some(event =>
        event.type === "failure.attempt.recorded" && /scheduler made no progress/.test(String(event.payload.redactedMessage)))).toBe(false);
      expect(state.tasks).toEqual(pausedTasks);
      expect(businessOpens).toEqual(opensBeforeResume);
      expect(order.filter((item) => /push|create-pr|merge/.test(item))).toEqual(
        gitBeforeResume.filter((item) => /push|create-pr|merge/.test(item))
      );
      releaseLeaderDecision();
      await waitFor(() => state.status === "completed" || leaderTurn >= 2 && state.status === "retrying");
      expect(state.status, JSON.stringify({ lastError: state.lastError, phase: state.phase, leaderTurn,
        tasks: state.tasks, executions: state.executions, groupRuns: state.groupRuns })).toBe("completed");
      const successor = state.executions?.find((execution) => execution.ownershipEpoch === 2 && execution.predecessorExecutionId);
      expect(successor).toMatchObject({
        agentId: "idea",
        status: "succeeded",
        predecessorExecutionId: expect.any(String)
      });
      const originalIdea = pausedOwners!.find((execution) => execution.agentId === "idea")!;
      expect(state.executions?.find((execution) => execution.id === originalIdea.id)).toMatchObject({
        id: originalIdea.id, taskId: originalIdea.taskId, agentId: "idea", ownershipEpoch: 2,
        worktreePath: originalIdea.worktreePath, executionBranch: originalIdea.executionBranch, status: "succeeded"
      });
      expect(leaderTurn).toBe(5);
      expect(ideaTurns).toBe(4); // one failed turn, two Leader-assigned continuations, final integration
      expect(state.tasks?.every((task) => task.status === "succeeded")).toBe(true);
    } finally { releasePausedWrite(); releaseLeaderDecision(); await coordinator.shutdown(); }
  }, 30_000);

  it("closes a failed non-Main leader and continues under a fresh Main coordinator epoch", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-collaboration-leader-substitute-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_55555555555555555555555555555555");
    state.orchestration = {
      ...state.orchestration,
      collaborations: [{
        id: "agent-led-team",
        displayName: "Agent led team",
        memberAgentIds: ["execution", "writing"],
        renamePolicy: "editable"
      }],
      routes: {
        ...state.orchestration.routes,
        idea: [{ target: "agent-led-team", kind: "strong" }],
        "agent-led-team": [{ target: "finish", kind: "strong" }]
      }
    };
    await storage.createProject(state);
    const order: string[] = [];
    const leaderAgents: string[] = [];
    let failedLeaderClosed = 0;
    let mainLeaderTurn = 0;
    const coordinator = new CollaborationRuntimeCoordinator({
      storage,
      serviceId: "leader-substitute-test",
      hostId: "host-test",
      leaseDurationMs: 5_000,
      gitFactory: (options) => happyGitFake(options, order),
      residentLauncher: {
        async open(input) {
          const context = input.request.executionContext!;
          if (context.role === "leader") {
            if (input.request.agent === "main") expect(failedLeaderClosed).toBe(1);
            leaderAgents.push(input.request.agent);
          }
          return {
            async submit(turn) {
              if (context.role !== "leader") return agentFixtureDelivery(input, turn, { handoff: `${input.request.agent} output` }, coordinator);
              if (input.request.agent !== "main") throw new Error("fixture leader crashed");
              mainLeaderTurn += 1;
              const action: ControlAction = mainLeaderTurn === 1 ? {
                tool: "assign_group_tasks",
                groupRunId: context.groupRunId,
                coordinatorEpoch: context.coordinatorEpoch,
                tasks: [{ taskId: "task-substitute", assignment: "Continue under Main", assigneeAgentId: "execution" }]
              } : mainLeaderTurn === 2 ? {
                tool: "request_group_integration",
                groupRunId: context.groupRunId,
                coordinatorEpoch: context.coordinatorEpoch,
                integrationOwnerAgentId: "execution"
              } : {
                tool: "complete_group",
                groupRunId: context.groupRunId,
                coordinatorEpoch: context.coordinatorEpoch,
                output: "Main substitution completed"
              };
              const fresh = await input.turnRequestFactory({ baseRequest: input.request, turn });
              const authority = await input.controlAuthorityFactory!({ request: fresh.request, turn });
              const envelope = {
                projectId: state.id,
                agent: fresh.request.agent,
                invocationId: turn.invocationId,
                callId: `call-${turn.invocationId}`,
                stateVersion: authority.control.stateVersion,
                capabilityHash: authority.control.capabilityHash,
                receivedAt: new Date().toISOString(),
                action
              };

              return agentFixtureLeaderResult(input, turn, { handoff: "Main management action", controlActions: [envelope] });
            },
            async pause() {},
            async resume() {},
            async close() {
              if (context.role === "leader" && input.request.agent !== "main") {
                failedLeaderClosed += 1;
              }
            }
          };
        }
      }
    });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    try {
      await coordinator.createProject(state, { enabled: true, provider: "github" });
      await waitFor(() => state.status === "completed");

      expect(leaderAgents).toEqual(["idea", "main"]);
      expect(failedLeaderClosed).toBe(1);
      expect(state.groupRuns?.[0]).toMatchObject({
        leaderAgentId: "idea",
        actingCoordinatorId: "main",
        coordinatorEpoch: 2,
        status: "completed"
      });
    } finally { await coordinator.shutdown(); }
  });

  it("resumes a canonical publish without rerunning an already-merged last-member repair", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-final-repair-all-failed-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_34343434343434343434343434343434");
    state.orchestration = {
      ...state.orchestration,
      collaborations: [{
        id: "final-repair-all-failed-team",
        displayName: "Final repair all failed team",
        memberAgentIds: ["idea", "execution"],
        renamePolicy: "editable"
      }],
      input: { source: "input", target: "final-repair-all-failed-team" },
      routes: {
        ...state.orchestration.routes,
        "final-repair-all-failed-team": [{ target: "finish", kind: "strong" }]
      }
    };
    state.agents.idea = { ...state.agents.idea, sessionPersistence: false };
    await storage.createProject(state);
    let leaderTurn = 0;
    let failedCanonicalId: string | undefined;
    let lostRepairMerge = false;
    let repairExecutionId: string | undefined;
    let continuationTaskId: string | undefined;
    let repairImplementations = 0;
    let originalRepairCwd: string | undefined;
    let canonicalExecutionId: string | undefined;
    let originalCanonicalCwd: string | undefined;
    let canonicalInterrupted = false;
    let canonicalChoiceEntered = false;
    let releaseCanonicalChoice!: () => void;
    const canonicalChoice = new Promise<void>((resolve) => { releaseCanonicalChoice = resolve; });
    const order: string[] = [];
    const mergeRequests: string[] = [];
    const openedPulls: Array<{ executionId: string; branch: string; base: string }> = [];
    const workerSubmits = new Map<string, number>();
    const coordinator = new CollaborationRuntimeCoordinator({
      storage,
      serviceId: "final-repair-all-failed-test",
      hostId: "host-test",
      gitFactory: (options) => {
        const git = happyGitFake(options, order, true, (execution) => {
          if (execution.purpose !== "final-integration" ||
            !execution.executionBranch.startsWith("groups/")) return false;
          failedCanonicalId ??= execution.id;
          return execution.id === failedCanonicalId;
        });
        const mergePullRequest = git.mergePullRequest.bind(git);
        const createPullRequest = git.createPullRequest.bind(git);
        return {
          ...git,
          async createPullRequest(request) {
            openedPulls.push({ executionId: request.execution.id, branch: request.execution.executionBranch, base: request.base });
            return createPullRequest(request);
          },
          async mergePullRequest(request) {
            mergeRequests.push(request.execution.id);
            const merged = await mergePullRequest(request);
            if (!lostRepairMerge &&
              request.execution.purpose === "final-integration" &&
              request.execution.executionBranch.startsWith("executions/")) {
              lostRepairMerge = true;
              repairExecutionId = request.execution.id;
              throw new Error("fixture lost the last-member repair merge response");
            }
            return merged;
          }
        };
      },
      residentLauncher: {
        async open(input) {
          const context = input.request.executionContext!;
          return {
            async submit(turn) {
              if (context.role === "leader") {
                leaderTurn += 1;
                let action: ControlAction;
                if (leaderTurn === 1) {
                  action = {
                    tool: "assign_group_tasks",
                    groupRunId: context.groupRunId!,
                    coordinatorEpoch: context.coordinatorEpoch!,
                    tasks: [{
                      taskId: "task-final-all-failed-seed",
                      assignment: "Seed the retained group branch",
                      assigneeAgentId: "idea"
                    }]
                  };
                } else if (leaderTurn === 2) {
                  action = {
                    tool: "request_group_integration",
                    groupRunId: context.groupRunId!,
                    coordinatorEpoch: context.coordinatorEpoch!,
                    integrationOwnerAgentId: "execution"
                  };
                } else if (leaderTurn === 3) {
                  const pending = state.tasks?.find((task) =>
                    task.status === "continuation_pending"
                  );
                  if (!pending) throw new Error("fixture final continuation was not published");
                  continuationTaskId = pending.id;
                  action = {
                    tool: "assign_group_tasks",
                    groupRunId: context.groupRunId!,
                    coordinatorEpoch: context.coordinatorEpoch!,
                    tasks: [{
                      taskId: pending.id,
                      assignment: pending.assignment,
                      assigneeAgentId: "idea"
                    }]
                  };
                } else if (leaderTurn === 4 || leaderTurn === 5 || leaderTurn === 6) {
                  if (!continuationTaskId) throw new Error("fixture original repair task was not retained");
                  if (leaderTurn === 6) { canonicalChoiceEntered = true; await canonicalChoice; }
                  action = { tool: "assign_group_tasks", groupRunId: context.groupRunId!,
                    coordinatorEpoch: context.coordinatorEpoch!, tasks: [{ taskId: continuationTaskId,
                      assignment: leaderTurn === 4 ? "Resume the original repair and inspect its lost merge response"
                        : leaderTurn === 5 ? "Publish the already repaired group branch to main"
                          : "Resume the original canonical publisher without rerunning the merged repair",
                      assigneeAgentId: "idea" }] };
                } else {
                  action = {
                    tool: "complete_group",
                    groupRunId: context.groupRunId!,
                    coordinatorEpoch: context.coordinatorEpoch!,
                    output: "Recovered canonical publish completed"
                  };
                }
                const fresh = await input.turnRequestFactory({ baseRequest: input.request, turn });
                const authority = await input.controlAuthorityFactory!({ request: fresh.request, turn });
                const envelope = {
                  projectId: state.id,
                  agent: fresh.request.agent,
                  invocationId: turn.invocationId,
                  callId: `call-${turn.invocationId}`,
                  stateVersion: authority.control.stateVersion,
                  capabilityHash: authority.control.capabilityHash,
                  receivedAt: new Date().toISOString(),
                  action
                };

                return agentFixtureLeaderResult(input, turn, { handoff: "leader action", controlActions: [envelope] });
              }
              const executionId = context.executionId!;
              workerSubmits.set(executionId, (workerSubmits.get(executionId) ?? 0) + 1);
              if (executionId === failedCanonicalId) {
                expect(coordinator.database().projectState(state.id).pullRequests.find((pull) => pull.ownerExecutionId === executionId))
                  .toMatchObject({ status: "closed" });
                throw new Error("fixture initial canonical Agent channel failed after explicitly closing its PR and reporting the conflict");
              }
              const owned = coordinator.database().projectState(state.id).executions.find((execution) => execution.id === executionId)!;
              const repair = owned.purpose === "final-integration" && owned.executionBranch.startsWith("executions/");
              const fresh = await input.turnRequestFactory({ baseRequest: input.request, turn });
              if (owned.purpose === "final-integration" && owned.executionBranch.startsWith("groups/") &&
                owned.predecessorExecutionId === repairExecutionId && repairExecutionId) {
                canonicalExecutionId ??= owned.id;
                if (!canonicalInterrupted) {
                  canonicalInterrupted = true;
                  originalCanonicalCwd = input.request.workspacePath;
                  await fresh.request.onDurableSessionStarted!({ schemaVersion: 1, harnessId: state.agents.idea.harness!,
                    adapterVersion: "test", nativeId: "original-canonical-publish-session", generation: 1, durable: true,
                    createdAt: new Date().toISOString() }, "original-canonical-publish-session");
                  await fs.writeFile(path.join(input.request.workspacePath, "canonical-publish-note.txt"), "Publish the existing repaired group; do not implement it again");
                  throw new Error("fixture canonical Agent channel failed before publishing its PR");
                }
                expect(owned.id).toBe(canonicalExecutionId);
                expect(fresh.request.resumeThreadId).toBe("original-canonical-publish-session");
                expect(input.request.workspacePath).toBe(originalCanonicalCwd);
                expect(await fs.readFile(path.join(input.request.workspacePath, "canonical-publish-note.txt"), "utf8"))
                  .toBe("Publish the existing repaired group; do not implement it again");
              }
              if (repair && owned.id !== repairExecutionId) {
                repairImplementations += 1;
                originalRepairCwd = input.request.workspacePath;
                await fresh.request.onDurableSessionStarted!({ schemaVersion: 1, harnessId: state.agents.idea.harness!,
                  adapterVersion: "test", nativeId: "original-last-member-repair-session", generation: 1, durable: true,
                  createdAt: new Date().toISOString() }, "original-last-member-repair-session");
                await fs.writeFile(path.join(input.request.workspacePath, "original-last-repair.txt"), "Agent repaired this business result once");
              } else if (repair) {
                expect(fresh.request.resumeThreadId).toBe("original-last-member-repair-session");
                expect(input.request.workspacePath).toBe(originalRepairCwd);
                expect(await fs.readFile(path.join(input.request.workspacePath, "original-last-repair.txt"), "utf8"))
                  .toBe("Agent repaired this business result once");
              }
              return agentFixtureDelivery(input, turn, { handoff: `output from ${executionId}` }, coordinator,
                undefined, undefined, { retainedPull: repair && owned.id === repairExecutionId, closeConflictedPull: !repair });
            },
            async pause() {},
            async resume() {},
            async close() {}
          };
        }
      }
    });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    try {
      await coordinator.createProject(state, { enabled: true, provider: "github" });
      await waitFor(() =>
        ["paused", "retrying"].includes(state.status) && state.phase === "collaboration:all-members-failed"
      );
      expect(repairExecutionId).toBeDefined();
      expect(state.executions?.find((execution) => execution.id === repairExecutionId)).toMatchObject({
        status: "succeeded", ownershipEpoch: 3, agentId: "idea"
      });
      expect(state.taskCompletions?.[repairExecutionId!]).toMatchObject({ agent: "idea" });
      expect(state.executions?.find((execution) => execution.id === canonicalExecutionId)).toMatchObject({
        status: "stopped", ownershipEpoch: 4, predecessorExecutionId: repairExecutionId, agentId: "idea"
      });
      expect(repairImplementations).toBe(1);
      expect(mergeRequests.filter((owner) => owner === repairExecutionId)).toHaveLength(1);
      expect(openedPulls.filter((pull) => pull.executionId === repairExecutionId)).toHaveLength(1);
      const retainedExecutions = structuredClone(coordinator.database().projectState(state.id).executions);
      const repairSubmits = workerSubmits.get(repairExecutionId!) ?? 0;
      expect(repairSubmits).toBe(2);
      await coordinator.resumeProject(state);
      await waitFor(() => canonicalChoiceEntered || Boolean(state.lastError));
      expect(state.lastError).toBeUndefined();
      expect(coordinator.database().projectState(state.id).executions).toEqual(retainedExecutions);
      expect(workerSubmits.get(repairExecutionId!) ?? 0).toBe(repairSubmits);
      expect(openedPulls.filter((pull) => pull.base === "main")).toHaveLength(1);
      releaseCanonicalChoice();
      await waitFor(() => state.status === "completed" || Boolean(state.lastError));
      expect(state.lastError).toBeUndefined();
      expect(workerSubmits.get(repairExecutionId!) ?? 0).toBe(repairSubmits);
      const canonical = state.executions?.find((execution) =>
        execution.predecessorExecutionId === repairExecutionId &&
        execution.executionBranch === state.groupRuns?.[0]?.groupBranch
      );
      expect(canonical).toMatchObject({ id: canonicalExecutionId, status: "succeeded", agentId: "idea", ownershipEpoch: 5 });
      expect(workerSubmits.get(canonical!.id)).toBe(2);
      expect(openedPulls.filter((pull) => pull.base === "main")).toHaveLength(2);
      expect(order.filter((step) => step === "close-pr:execution")).toHaveLength(1);
      expect(state.groupRuns?.[0]).toMatchObject({
        status: "completed",
        integrationOwnerExecutionId: canonical?.id
      });
    } finally { releaseCanonicalChoice(); await coordinator.shutdown(); }
  }, 15_000);

  it("refreshes remote main after frozen Main recovery before routing a group", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-restart-main-head-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_abababababababababababababababab");
    state.git = {
      enabled: true,
      status: "ready",
      provider: "github",
      repository: {
        owner: "fixture-owner",
        name: "restart-main-head",
        htmlUrl: "https://github.example/restart-main-head",
        private: true,
        defaultBranch: "main",
        localPath: path.join(root, "repository")
      }
    };
    state.status = "paused";
    state.phase = "collaboration:main-recovery-retryable";
    state.orchestration = {
      ...state.orchestration,
      collaborations: [{
        id: "head-team",
        displayName: "Head team",
        memberAgentIds: ["idea", "execution"],
        renamePolicy: "editable"
      }],
      input: { source: "input", target: "main" },
      routes: {
        ...state.orchestration.routes,
        main: [{ target: "head-team", kind: "strong" }],
        "head-team": [{ target: "finish", kind: "strong" }]
      }
    };
    await storage.createProject(state);
    const databasePath = path.join(root, "collaboration.sqlite");
    const seed = CollaborationStateDatabase.open({
      databasePath,
      serviceId: "restart-main-head-seed",
      instanceId: "restart-main-head-seed-instance",
      hostId: "host-test",
      topology: "single-host"
    });
    seed.createProject({
      projectId: state.id,
      workflowRevision: 1,
      workflowSnapshot: state.orchestration,
      git: state.git,
      workerCapacity: 2,
      managementCapacity: 1
    });
    const repository = repositoryFact("restart-main-head");
    seed.prepareOperation(state.id, {
      id: "operation-repository-restart-main-head",
      kind: "repository.create",
      payloadHash: "repository-restart-main-head",
      status: "prepared"
    });
    seed.transitionOperation(state.id, {
      id: "operation-repository-restart-main-head",
      payloadHash: "repository-restart-main-head",
      status: "observed",
      remoteFact: repository
    });
    seed.transitionOperation(state.id, {
      id: "operation-repository-restart-main-head",
      payloadHash: "repository-restart-main-head",
      status: "finalized",
      remoteFact: repository
    });
    seed.prepareOperation(state.id, {
      id: "initial-main-push",
      kind: "git.push",
      payloadHash: "initial-main-push",
      status: "prepared",
      expectedHead: "a".repeat(40),
      expectedBase: "main"
    });
    seed.transitionOperation(state.id, {
      id: "initial-main-push",
      payloadHash: "initial-main-push",
      status: "observed",
      remoteFact: {
        owner: repository.owner,
        repository: repository.name,
        ref: "main",
        status: "present",
        sha: "a".repeat(40),
        observedAt: new Date().toISOString()
      }
    });
    seed.transitionOperation(state.id, {
      id: "initial-main-push",
      payloadHash: "initial-main-push",
      status: "finalized",
      remoteFact: {
        owner: repository.owner,
        repository: repository.name,
        ref: "main",
        status: "present",
        sha: "a".repeat(40),
        observedAt: new Date().toISOString()
      }
    });
    const frozenMainActivationId = `input-${state.id}`;
    const frozenMainNodeRunId = `node-${createHash("sha256")
      .update(frozenMainActivationId)
      .digest("hex")
      .slice(0, 32)}`;
    seed.activateNode({
      projectId: state.id,
      nodeRunId: frozenMainNodeRunId,
      node: { kind: "agent", nodeId: "main", agentId: "main" },
      activationRequestId: frozenMainActivationId,
      inputSnapshotRef: `project:${state.id}:requirement:cycle:1`,
      optionalTask: state.requirement,
      activatedByAgentId: "main",
      workflowRevision: 1
    });
    seed.freezeMainRouteFailure({
      projectId: state.id,
      nodeRunId: frozenMainNodeRunId,
      routeEpoch: 1,
      error: "fixture Main process disappeared before routing",
      requestId: "freeze-restart-main-route"
    });
    seed.relinquishWriterLease();
    seed.close();

    const observedMain = "f".repeat(40);
    const groupBases: string[] = [];
    let leaderTurn = 0;
    let mainStopObservations = 0;
    const coordinator = new CollaborationRuntimeCoordinator({
      storage,
      databasePath,
      serviceId: "restart-main-head-service",
      hostId: "host-test",
      gitFactory: (options) => {
        const base = happyGitFake(options, []);
        return {
          ...base,
          async observeRemoteRef(requestRepository, ref) {
            return {
              owner: requestRepository.owner,
              repository: requestRepository.name,
              ref,
              status: "present" as const,
              sha: observedMain,
              observedAt: new Date().toISOString()
            };
          },
          async beginGroup(request) {
            groupBases.push(request.baseCommit);
            return base.beginGroup!(request);
          }
        };
      },
      residentLauncher: {
        async observeMainRouteRecovery() {
          mainStopObservations += 1;
          return { stopped: true, evidence: { processGroupAbsent: true } };
        },
        async decideRoute(input) {
          return agentFixtureMainDecision(input, {
            targetNodeId: "head-team", decisionRequestId: "route-after-frozen-main-recovery",
            output: "Route the recovered project from the latest remote main"
          });
        },
        async open(input) {
          const context = input.request.executionContext!;
          return {
            async submit(turn) {
              if (context.role !== "leader") return agentFixtureDelivery(input, turn, { handoff: "post-restart delivery" }, coordinator);
              leaderTurn += 1;
              const action: ControlAction = leaderTurn === 1 ? {
                tool: "assign_group_tasks",
                groupRunId: context.groupRunId!,
                coordinatorEpoch: context.coordinatorEpoch!,
                tasks: [{
                  taskId: "post-restart-task",
                  assignment: "Deliver from the latest main",
                  assigneeAgentId: "execution"
                }]
              } : leaderTurn === 2 ? {
                tool: "request_group_integration",
                groupRunId: context.groupRunId!,
                coordinatorEpoch: context.coordinatorEpoch!,
                integrationOwnerAgentId: "execution"
              } : {
                tool: "complete_group",
                groupRunId: context.groupRunId!,
                coordinatorEpoch: context.coordinatorEpoch!,
                output: "Latest-main group completed"
              };
              const fresh = await input.turnRequestFactory({ baseRequest: input.request, turn });
              const authority = await input.controlAuthorityFactory!({ request: fresh.request, turn });
              const envelope = {
                projectId: state.id,
                agent: fresh.request.agent,
                invocationId: turn.invocationId,
                callId: `call-${turn.invocationId}`,
                stateVersion: authority.control.stateVersion,
                capabilityHash: authority.control.capabilityHash,
                receivedAt: new Date().toISOString(),
                action
              };

              return agentFixtureLeaderResult(input, turn, { handoff: "leader action", controlActions: [envelope] });
            },
            async pause() {},
            async resume() {},
            async close() {}
          };
        }
      }
    });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    try {
    expect(await coordinator.recoverProject(state)).toBe(true);
    if (["paused", "retrying"].includes(state.status)) await coordinator.resumeProject(state);
    await waitFor(() => state.status === "completed" || state.status === "retrying" && Boolean(state.lastError));
    expect(state.lastError).toBeUndefined();
    expect(state).toMatchObject({ status: "completed", phase: "completed" });

    expect(groupBases).toEqual([observedMain]);
    expect(mainStopObservations).toBe(1);
    expect(state.groupRuns?.[0]).toMatchObject({
      baseCommit: observedMain,
      status: "completed"
    });
    } finally { await coordinator.shutdown(); }
  });

  it("retries an unconfirmed standalone restart stop and advances only after confirmed proof", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-standalone-restart-pr-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_88888888888888888888888888888888");
    state.git = {
      enabled: true,
      status: "ready",
      provider: "github",
      repository: {
        owner: "fixture-owner",
        name: "standalone-restart",
        htmlUrl: "https://github.example/standalone-restart",
        private: true,
        defaultBranch: "main",
        localPath: path.join(root, "repository")
      }
    };
    state.status = "running";
    state.phase = "idea:collaborating";
    state.orchestration = {
      ...state.orchestration,
      input: { source: "input", target: "idea" },
      routes: { ...state.orchestration.routes, idea: [{ target: "finish", kind: "strong" }] }
    };
    await storage.createProject(state);
    const databasePath = path.join(root, "collaboration.sqlite");
    const seed = CollaborationStateDatabase.open({
      databasePath,
      serviceId: "standalone-restart-seed",
      instanceId: "standalone-restart-seed-instance",
      hostId: "host-test",
      topology: "single-host"
    });
    seed.createProject({
      projectId: state.id,
      workflowRevision: 1,
      workflowSnapshot: state.orchestration,
      git: state.git,
      workerCapacity: 2,
      managementCapacity: 1
    });
    const repository = repositoryFact("standalone-restart");
    seed.prepareOperation(state.id, {
      id: "operation-repository-standalone-restart",
      kind: "repository.create",
      payloadHash: "repository-standalone-restart",
      status: "prepared"
    });
    seed.transitionOperation(state.id, {
      id: "operation-repository-standalone-restart",
      payloadHash: "repository-standalone-restart",
      status: "observed",
      remoteFact: repository
    });
    seed.transitionOperation(state.id, {
      id: "operation-repository-standalone-restart",
      payloadHash: "repository-standalone-restart",
      status: "finalized",
      remoteFact: repository
    });
    seed.activateNode({
      projectId: state.id,
      nodeRunId: "standalone-restart-node",
      node: { kind: "agent", nodeId: "idea", agentId: "idea" },
      activationRequestId: "activate-standalone-restart",
      inputSnapshotRef: `project:${state.id}:requirement`,
      optionalTask: "Recover the already-open pull request",
      activatedByAgentId: "main",
      workflowRevision: 1
    });
    seed.startStandaloneExecution({
      projectId: state.id,
      nodeRunId: "standalone-restart-node",
      taskId: "standalone-restart-task",
      executionId: "standalone-restart-execution",
      agentId: "idea",
      assignment: "Recover the already-open pull request",
      executionBranch: "executions/standalone-restart-execution",
      worktreePath: path.join(
        root,
        "projects",
        state.id,
        "git-worktrees",
        "standalone-restart-execution"
      ),
      invocationId: `inv_${"8".repeat(32)}`
    });
    seed.prepareOperation(state.id, {
      id: "pull-standalone-restart-execution",
      kind: "pull.create",
      payloadHash: "lost-pull-create-response",
      status: "prepared",
      ownerExecutionId: "standalone-restart-execution",
      ownershipEpoch: 1,
      expectedHead: "b".repeat(40),
      expectedBase: "main"
    });
    seed.relinquishWriterLease();
    seed.close();

    let remotePull = { ...pullFact(
      73,
      "standalone-restart-execution",
      "executions/standalone-restart-execution",
      "main",
      "b".repeat(40),
      "open"
    ), owner: repository.owner, repository: repository.name };
    let discoveries = 0;
    let submits = 0;
    let closes = 0;
    const stoppedEpochs: number[] = [];
    const openedEpochs: number[] = [];
    const mergeRequests: Array<{ operationId: string; ownershipEpoch: number }> = [];
    const coordinator = new CollaborationRuntimeCoordinator({
      storage,
      databasePath,
      serviceId: "standalone-restart-service",
      hostId: "host-test",
      gitFactory: (options) => {
        const base = happyGitFake(options, []);
        return {
          ...base,
          async observeRemoteRef(requestRepository, ref) {
            return {
              owner: requestRepository.owner,
              repository: requestRepository.name,
              ref,
              status: "present" as const,
              sha: "a".repeat(40),
              observedAt: new Date().toISOString()
            };
          },
          async observePullRequestForExecution() {
            discoveries += 1;
            return structuredClone(remotePull);
          },
          async observePullRequest() {
            return structuredClone(remotePull);
          },
          async sessionBegin(execution, epoch, input, signal) {
            openedEpochs.push(epoch);
            return base.sessionBegin(execution, epoch, input, signal);
          },
          async checkpointAndPush() {
            throw new Error("checkpoint must not run after a discovered PR");
          },
          async createPullRequest() {
            throw new Error("PR create must not repeat after a discovered PR");
          },
          async mergePullRequest(request) {
            mergeRequests.push({
              operationId: request.operationId,
              ownershipEpoch: request.ownershipEpoch
            });
            remotePull = {
              ...remotePull,
              status: "merged",
              mergeCommitSha: "d".repeat(40),
              observedAt: new Date().toISOString()
            };
            return {
              ...structuredClone(remotePull),
              localSynchronization: {
                projectId: state.id,
                operationId: request.operationId,
                targetBranch: "main" as const,
                temporaryRef: "refs/openfars/restart/main",
                expectedSourceHead: request.expectedHead,
                mergeCommitSha: "d".repeat(40),
                remoteHead: "d".repeat(40),
                localHeadBefore: "a".repeat(40),
                localHeadAfter: "d".repeat(40),
                status: "synchronized" as const,
                observedAt: new Date().toISOString()
              }
            };
          }
        };
      },
      residentLauncher: {
        async stopForRecovery(input) {
          stoppedEpochs.push(input.execution.ownershipEpoch);
          return stoppedEpochs.length === 1
            ? { stopped: false, evidence: { processStillPresent: true } }
            : { stopped: true, evidence: { processGroupAbsent: true } };
        },
        async open(input) {
          openedEpochs.push(input.request.executionContext!.ownershipEpoch!);
          return {
            async submit(turn) {
              submits += 1;
              const requested = await agentFixtureRequests(input, turn, [
                { tool: "github_get_pr", providerNumber: 73 },
                { tool: "github_merge_pr", providerNumber: 73, reason: "Integrate my retained PR after confirmed recovery" },
                { tool: "finish_task", summary: "Original Agent finished its retained standalone delivery" }
              ]);
              expect(requested.results[0]).toMatchObject({ providerNumber: 73, status: "open" });
              expect(requested.results[1]).toMatchObject({ providerNumber: 73, status: "merged" });
              return { handoff: "Original Agent verified and completed its retained PR", controlActions: requested.envelopes };
            },
            async pause() {},
            async resume() {},
            async close() { closes += 1; }
          };
        }
      }
    });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    try {
      expect(await coordinator.recoverProject(state)).toBe(true);
      if (state.status === "paused") {
        expect(stoppedEpochs).toEqual([]);
        await coordinator.resumeProject(state);
      }
      await waitFor(() => state.phase === "collaboration:resident-stopped");
      expect(openedEpochs).toEqual([]);
      expect(state.executions?.find((execution) => execution.id === "standalone-restart-execution"))
        .toMatchObject({ ownershipEpoch: 1 });

      expect(await coordinator.recoverProject(state)).toBe(true);
      expect(stoppedEpochs).toEqual([1]);
      await coordinator.resumeProject(state);
      await waitFor(() => submits > 0 && ["completed", "paused", "retrying"].includes(state.status));
      expect(state.status, JSON.stringify({ lastError: state.lastError, submits, stoppedEpochs, openedEpochs }))
        .toBe("completed");
      expect(state.lastError).toBeUndefined();

      expect(discoveries).toBe(1);
      expect(submits).toBe(1);
      expect(closes).toBe(1);
      expect(stoppedEpochs).toEqual([1, 1]);
      expect(openedEpochs).toEqual([2, 2]);
      expect(mergeRequests).toEqual([{
        operationId: expect.stringMatching(/^agent-git-standalone-restart-execution-epoch-2-.*-merge$/),
        ownershipEpoch: 2
      }]);
      expect(state.taskCompletions?.["standalone-restart-execution"])
        .toMatchObject({ agent: "idea", summary: "Original Agent finished its retained standalone delivery" });
      expect(state.executions).toEqual([
        expect.objectContaining({
          id: "standalone-restart-execution",
          ownershipEpoch: 2,
          status: "succeeded"
        })
      ]);
      await waitFor(() => state.failureAttempts?.some((attempt) =>
        attempt.operation === "standalone.recovery:standalone-restart-execution"
        && attempt.status === "succeeded"
        && attempt.ownershipEpoch === 2
      ) === true);
      expect(state.failureAttempts).toEqual(expect.arrayContaining([
        expect.objectContaining({
          scope: "resident",
          operation: "standalone.recovery:standalone-restart-execution",
          status: "succeeded",
          ownershipEpoch: 2,
          metadata: { predecessorOwnershipEpoch: 1 }
        })
      ]));
    } finally { await coordinator.shutdown(); }
    expect(state.status).toBe("completed");
  });

  it("fences a second standalone restart after crashing across planned and actual launch boundaries", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-standalone-double-launch-crash-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_89898989898989898989898989898989");
    state.git = {
      enabled: true,
      status: "ready",
      provider: "github",
      repository: {
        owner: "fixture-owner",
        name: "standalone-double-launch-crash",
        htmlUrl: "https://github.example/standalone-double-launch-crash",
        private: true,
        defaultBranch: "main",
        localPath: path.join(root, "repository")
      }
    };
    state.status = "running";
    state.phase = "idea:collaborating";
    state.orchestration = {
      ...state.orchestration,
      input: { source: "input", target: "idea" },
      routes: { ...state.orchestration.routes, idea: [{ target: "finish", kind: "strong" }] }
    };
    await storage.createProject(state);
    const databasePath = path.join(root, "collaboration.sqlite");
    const seed = CollaborationStateDatabase.open({
      databasePath,
      serviceId: "standalone-double-launch-seed",
      instanceId: "standalone-double-launch-seed-instance",
      hostId: "host-test",
      topology: "single-host"
    });
    seed.createProject({
      projectId: state.id,
      workflowRevision: 1,
      workflowSnapshot: state.orchestration,
      git: state.git,
      workerCapacity: 2,
      managementCapacity: 1
    });
    const repository = repositoryFact("standalone-double-launch-crash");
    seed.prepareOperation(state.id, {
      id: "operation-repository-standalone-double-launch",
      kind: "repository.create",
      payloadHash: "repository-standalone-double-launch",
      status: "prepared"
    });
    seed.transitionOperation(state.id, {
      id: "operation-repository-standalone-double-launch",
      payloadHash: "repository-standalone-double-launch",
      status: "observed",
      remoteFact: repository
    });
    seed.transitionOperation(state.id, {
      id: "operation-repository-standalone-double-launch",
      payloadHash: "repository-standalone-double-launch",
      status: "finalized",
      remoteFact: repository
    });
    seed.activateNode({
      projectId: state.id,
      nodeRunId: "standalone-double-launch-node",
      node: { kind: "agent", nodeId: "idea", agentId: "idea" },
      activationRequestId: "activate-standalone-double-launch",
      inputSnapshotRef: `project:${state.id}:requirement`,
      optionalTask: "Crash across both launch boundaries",
      activatedByAgentId: "main",
      workflowRevision: 1
    });
    const invocationId = `inv_${"9".repeat(32)}`;
    seed.startStandaloneExecution({
      projectId: state.id,
      nodeRunId: "standalone-double-launch-node",
      taskId: "standalone-double-launch-task",
      executionId: "standalone-double-launch-execution",
      agentId: "idea",
      assignment: "Crash across both launch boundaries",
      executionBranch: "executions/standalone-double-launch-execution",
      worktreePath: path.join(
        storage.projectDir(state.id),
        "git-worktrees",
        "standalone-double-launch-execution"
      ),
      invocationId,
      residentLaunchProtocol: "trusted-supervisor-v1"
    });
    seed.relinquishWriterLease();
    seed.close();

    let opens = 0;
    let stops = 0;
    const first = new CollaborationRuntimeCoordinator({
      storage,
      databasePath,
      serviceId: "standalone-double-launch-first",
      hostId: "host-test",
      gitFactory: (options) => happyGitFake(options, []),
      residentLauncher: {
        async stopForRecovery() {
          stops += 1;
          throw new Error("planned-only execution must not be stop-reconciled");
        },
        async open() {
          opens += 1;
          throw new Error("fixture crash after actual launch marker");
        }
      }
    });
    if (first instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(first);
    await first.initialize();
    expect(await first.recoverProject(state)).toBe(true);
    if (state.status === "paused") {
      expect(opens).toBe(0);
      await first.resumeProject(state);
    }
    await waitFor(() => opens === 1);
    expect(stops).toBe(0);
    const firstDatabase = (first as unknown as {
      database(): CollaborationStateDatabase;
    }).database();
    const actualLaunches = firstDatabase.eventsAfter(state.id, 0, 10_000).filter((event) =>
      event.type === "execution.launch.started" &&
      event.executionId === "standalone-double-launch-execution" &&
      event.ownershipEpoch === 1
    );
    expect(actualLaunches).toHaveLength(1);
    await first.shutdown();

    const restartedStorage = new ProjectStorage(root, new EventHub());
    await restartedStorage.initialize();
    const restartedState = await restartedStorage.loadState(state.id);
    const second = new CollaborationRuntimeCoordinator({
      storage: restartedStorage,
      databasePath,
      serviceId: "standalone-double-launch-second",
      hostId: "host-test",
      gitFactory: (options) => happyGitFake(options, []),
      residentLauncher: {
        async stopForRecovery() {
          stops += 1;
          throw new Error("fixture stops after proving cleanup precedes reopen");
        },
        async open() {
          opens += 1;
          throw new Error("a second resident must not open before stop proof");
        }
      }
    });
    if (second instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(second);
    await second.initialize();
    expect(await second.recoverProject(restartedState)).toBe(true);
    expect(stops).toBe(0);
    await second.resumeProject(restartedState);
    await waitFor(() => stops === 1);
    expect(opens).toBe(1);
    const secondDatabase = (second as unknown as {
      database(): CollaborationStateDatabase;
    }).database();
    expect(secondDatabase.projectState(state.id).executions).toEqual([
      expect.objectContaining({
        id: "standalone-double-launch-execution",
        ownershipEpoch: 1,
        status: "stop_requested"
      })
    ]);
    await second.shutdown();
  });

  it("does not mistake an actual standalone launch beyond 100k events for an unlaunched plan", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-exact-launch-window-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_91919191919191919191919191919191");
    state.status = "running";
    state.phase = "collaboration:running";
    state.git = {
      enabled: true,
      status: "ready",
      provider: "github",
      repository: {
        owner: "fixture-owner",
        name: "exact-launch-window",
        htmlUrl: "https://github.example/exact-launch-window",
        private: true,
        defaultBranch: "main",
        localPath: path.join(root, "repository")
      }
    };
    await storage.createProject(state);

    const databasePath = path.join(root, "collaboration.sqlite");
    const seed = CollaborationStateDatabase.open({
      databasePath,
      serviceId: "exact-launch-seed",
      instanceId: "exact-launch-seed-instance",
      hostId: "host-test",
      topology: "single-host"
    });
    seed.createProject({
      projectId: state.id,
      workflowRevision: 1,
      workflowSnapshot: state.orchestration,
      git: state.git,
      workerCapacity: 2,
      managementCapacity: 1
    });
    const repository = repositoryFact("exact-launch-window");
    seed.prepareOperation(state.id, { id: "operation-repository-exact-launch-window",
      kind: "repository.create", payloadHash: "repository-exact-launch-window", status: "prepared" });
    for (const status of ["observed", "finalized"] as const) {
      seed.transitionOperation(state.id, { id: "operation-repository-exact-launch-window",
        payloadHash: "repository-exact-launch-window", status, remoteFact: repository });
    }
    seed.activateNode({
      projectId: state.id,
      nodeRunId: "exact-launch-node",
      node: { kind: "agent", nodeId: "idea", agentId: "idea" },
      activationRequestId: "activate-exact-launch",
      inputSnapshotRef: `project:${state.id}:requirement`,
      optionalTask: "Recover the exact launched writer",
      activatedByAgentId: "main",
      workflowRevision: 1
    });
    const invocationId = `inv_${"9".repeat(32)}`;
    const worktreePath = path.join(
      root,
      "projects",
      state.id,
      "git-worktrees",
      "exact-launch-execution"
    );
    const execution = seed.startStandaloneExecution({
      projectId: state.id,
      nodeRunId: "exact-launch-node",
      taskId: "exact-launch-task",
      executionId: "exact-launch-execution",
      agentId: "idea",
      assignment: "Recover the exact launched writer",
      executionBranch: "executions/exact-launch-execution",
      worktreePath,
      invocationId,
      residentLaunchProtocol: "trusted-supervisor-v1"
    }).execution;
    padRuntimeProjectEventsPastLegacyWindow(databasePath, state.id);
    const runtimePath = await storage.invocationRuntimePath(state.id, invocationId);
    const launched = seed.appendEvent({
      projectId: state.id,
      requestId: `execution-launch-${execution.id}-${execution.ownershipEpoch}`,
      workflowRevision: 1,
      nodeRunId: execution.nodeRunId,
      agentId: execution.agentId,
      taskId: execution.taskId,
      executionId: execution.id,
      invocationId,
      ownershipEpoch: execution.ownershipEpoch,
      type: "execution.launch.started",
      payload: {
        worktreePath,
        runtimePath,
        residentLaunchProtocol: "trusted-supervisor-v1"
      }
    }).event;
    expect(launched.seq).toBeGreaterThan(100_000);
    state.collaboration = {
      stateRevision: seed.projectState(state.id).stateRevision,
      frozen: false,
      eventSeq: launched.seq,
      routeOutbox: [],
      usage: []
    };
    await storage.saveState(state);
    seed.relinquishWriterLease();
    seed.close();

    const stopProtocols: Array<string | undefined> = [];
    let opens = 0;
    const coordinator = new CollaborationRuntimeCoordinator({
      storage,
      databasePath,
      serviceId: "exact-launch-runtime",
      hostId: "host-test",
      gitFactory: (options) => happyGitFake(options, []),
      residentLauncher: {
        async stopForRecovery(input) {
          stopProtocols.push(input.residentLaunchProtocol);
          return { stopped: false, evidence: { processStillPresent: true } };
        },
        async open() {
          opens += 1;
          throw new Error("an existing launched writer must be stopped before reopen");
        }
      }
    });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    try {
      expect(await coordinator.recoverProject(state)).toBe(true);
      try {
        await waitFor(() => state.phase === "collaboration:resident-stopped");
      } catch (error) {
        throw new Error(JSON.stringify({ phase: state.phase, status: state.status, lastError: state.lastError,
          stopProtocols, opens, executions: state.executions, runtime: state.runtime }), { cause: error });
      }
      expect(stopProtocols).toEqual(["trusted-supervisor-v1"]);
      expect(opens).toBe(0);
      expect(coordinator.database().projectState(state.id).executions).toEqual([expect.objectContaining({ id: execution.id,
        ownershipEpoch: 1, status: "stop_requested" })]);
      expect(coordinator.projectReadModel(state)).toMatchObject({ status: "retrying",
        phase: "collaboration:resident-stopped", runtime: { status: "retrying", phase: "collaboration:resident-stopped" } });
    } finally { await coordinator.shutdown(); }
  }, 15_000);

  it("does not let planned provenance mask a malformed actual standalone launch", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-malformed-actual-launch-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_89898989898989898989898989898980");
    state.git = {
      enabled: true,
      status: "ready",
      provider: "github",
      repository: {
        owner: "fixture-owner",
        name: "malformed-actual-launch",
        htmlUrl: "https://github.example/malformed-actual-launch",
        private: true,
        defaultBranch: "main",
        localPath: path.join(root, "repository")
      }
    };
    state.status = "running";
    state.phase = "idea:collaborating";
    state.orchestration = {
      ...state.orchestration,
      input: { source: "input", target: "idea" },
      routes: { ...state.orchestration.routes, idea: [{ target: "finish", kind: "strong" }] }
    };
    await storage.createProject(state);
    const databasePath = path.join(root, "collaboration.sqlite");
    const seed = CollaborationStateDatabase.open({
      databasePath,
      serviceId: "malformed-actual-seed",
      instanceId: "malformed-actual-seed-instance",
      hostId: "host-test",
      topology: "single-host"
    });
    seed.createProject({
      projectId: state.id,
      workflowRevision: 1,
      workflowSnapshot: state.orchestration,
      git: state.git,
      workerCapacity: 2,
      managementCapacity: 1
    });
    const repository = repositoryFact("malformed-actual-launch");
    seed.prepareOperation(state.id, {
      id: "operation-repository-malformed-actual",
      kind: "repository.create",
      payloadHash: "repository-malformed-actual",
      status: "prepared"
    });
    seed.transitionOperation(state.id, {
      id: "operation-repository-malformed-actual",
      payloadHash: "repository-malformed-actual",
      status: "observed",
      remoteFact: repository
    });
    seed.transitionOperation(state.id, {
      id: "operation-repository-malformed-actual",
      payloadHash: "repository-malformed-actual",
      status: "finalized",
      remoteFact: repository
    });
    seed.activateNode({
      projectId: state.id,
      nodeRunId: "malformed-actual-node",
      node: { kind: "agent", nodeId: "idea", agentId: "idea" },
      activationRequestId: "activate-malformed-actual",
      inputSnapshotRef: `project:${state.id}:requirement`,
      optionalTask: "Reject malformed actual launch provenance",
      activatedByAgentId: "main",
      workflowRevision: 1
    });
    const worktreePath = path.join(
      storage.projectDir(state.id),
      "git-worktrees",
      "malformed-actual-execution"
    );
    const execution = seed.startStandaloneExecution({
      projectId: state.id,
      nodeRunId: "malformed-actual-node",
      taskId: "malformed-actual-task",
      executionId: "malformed-actual-execution",
      agentId: "idea",
      assignment: "Reject malformed actual launch provenance",
      executionBranch: "executions/malformed-actual-execution",
      worktreePath,
      invocationId: `inv_${"8".repeat(32)}`,
      residentLaunchProtocol: "trusted-supervisor-v1"
    }).execution;
    seed.appendEvent({
      projectId: state.id,
      requestId: "malformed-actual-launch-event",
      workflowRevision: 1,
      nodeRunId: execution.nodeRunId,
      agentId: execution.agentId,
      taskId: execution.taskId,
      executionId: execution.id,
      invocationId: `inv_${"7".repeat(32)}`,
      ownershipEpoch: execution.ownershipEpoch,
      type: "execution.launch.started",
      payload: {
        worktreePath,
        runtimePath: path.join(storage.projectDir(state.id), "runtime", "wrong-invocation"),
        residentLaunchProtocol: "trusted-supervisor-v1"
      }
    });
    seed.relinquishWriterLease();
    seed.close();

    let stopProtocol: "trusted-supervisor-v1" | undefined = "trusted-supervisor-v1";
    let opens = 0;
    const coordinator = new CollaborationRuntimeCoordinator({
      storage,
      databasePath,
      serviceId: "malformed-actual-runtime",
      hostId: "host-test",
      gitFactory: (options) => happyGitFake(options, []),
      residentLauncher: {
        async stopForRecovery(input) {
          stopProtocol = input.residentLaunchProtocol;
          throw new Error("fixture observed fail-closed malformed launch");
        },
        async open() {
          opens += 1;
          throw new Error("malformed actual launch must not reopen");
        }
      }
    });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    expect(await coordinator.recoverProject(state)).toBe(true);
    await waitFor(() => state.lastError === "fixture observed fail-closed malformed launch");
    expect(stopProtocol).toBeUndefined();
    expect(opens).toBe(0);
    await coordinator.shutdown();
  });

  it("recovers independent Main using the exact latest route attempt beyond 100k events", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-exact-main-route-window-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_92929292929292929292929292929292");
    state.git = {
      enabled: true,
      status: "ready",
      provider: "github",
      repository: {
        owner: "fixture-owner",
        name: "exact-main-route-window",
        htmlUrl: "https://github.example/exact-main-route-window",
        private: true,
        defaultBranch: "main",
        localPath: path.join(root, "repository")
      }
    };
    await storage.createProject(state);

    const databasePath = path.join(root, "collaboration.sqlite");
    const seed = CollaborationStateDatabase.open({
      databasePath,
      serviceId: "exact-main-route-seed",
      instanceId: "exact-main-route-seed-instance",
      hostId: "host-test",
      topology: "single-host"
    });
    seed.createProject({
      projectId: state.id,
      workflowRevision: 1,
      workflowSnapshot: state.orchestration,
      git: state.git,
      workerCapacity: 2,
      managementCapacity: 1
    });
    seed.activateNode({
      projectId: state.id,
      nodeRunId: "exact-main-route-node",
      node: { kind: "agent", nodeId: "main", agentId: "main" },
      activationRequestId: "activate-exact-main-route",
      inputSnapshotRef: `project:${state.id}:requirement`,
      optionalTask: "Recover the exact Main route epoch",
      activatedByAgentId: "main",
      workflowRevision: 1
    });
    padRuntimeProjectEventsPastLegacyWindow(databasePath, state.id);
    const attempt = seed.appendEvent({
      projectId: state.id,
      requestId: "exact-main-route-attempt-19",
      workflowRevision: 1,
      nodeRunId: "exact-main-route-node",
      agentId: "main",
      invocationId: `inv_${"8".repeat(32)}`,
      coordinatorEpoch: 19,
      type: "main.route.attempt",
      payload: { sourceAgentId: "idea", candidates: ["finish"], attempt: 19 }
    }).event;
    seed.freezeMainRouteFailure({
      projectId: state.id,
      nodeRunId: "exact-main-route-node",
      routeEpoch: 19,
      error: "fixture route crash",
      requestId: "freeze-exact-main-route-19"
    });
    const lastSeq = seed.eventsAfter(state.id, attempt.seq, 10).at(-1)?.seq ?? attempt.seq;
    state.collaboration = {
      stateRevision: seed.projectState(state.id).stateRevision,
      frozen: true,
      freezeReason: "main_route_failed",
      eventSeq: lastSeq,
      routeOutbox: [],
      usage: []
    };
    await storage.saveState(state);
    seed.relinquishWriterLease();
    seed.close();

    const observedEpochs: number[] = [];
    const coordinator = new CollaborationRuntimeCoordinator({
      storage,
      databasePath,
      serviceId: "exact-main-route-runtime",
      hostId: "host-test",
      gitFactory: (options) => happyGitFake(options, []),
      residentLauncher: {
        async open() {
          throw new Error("frozen Main must not open before stop proof");
        },
        async observeMainRouteRecovery(input) {
          observedEpochs.push(input.routeEpoch);
          return { stopped: false, evidence: {} };
        }
      }
    });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    expect(await coordinator.recoverProject(state)).toBe(true);
    expect(observedEpochs).toEqual([19]);
    await coordinator.resumeProject(state);
    expect(observedEpochs).toEqual([19, 19]);
    expect(state.status).toBe(hasUserWorkflowPause(state) ? "paused" : "retrying");
    expect(state.phase).toBe("collaboration:main-recovery-retryable");
    await coordinator.shutdown();
  }, 30_000);

  it("reopens exact pre-PR group owners on a fresh restart before a real failure hands off to the survivor", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-group-restart-no-pr-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_29292929292929292929292929292929");
    state.git = {
      enabled: true,
      status: "ready",
      provider: "github",
      repository: {
        owner: "fixture-owner",
        name: "restart-no-pr",
        htmlUrl: "https://github.example/restart-no-pr",
        private: true,
        defaultBranch: "main",
        localPath: path.join(root, "repository")
      }
    };
    state.status = "running";
    state.phase = "restart-no-pr-team:working";
    state.orchestration = {
      ...state.orchestration,
      collaborations: [{
        id: "restart-no-pr-team",
        displayName: "Restart no PR team",
        memberAgentIds: ["idea", "execution"],
        renamePolicy: "editable"
      }],
      input: { source: "input", target: "restart-no-pr-team" },
      routes: {
        ...state.orchestration.routes,
        "restart-no-pr-team": [{ target: "finish", kind: "strong" }]
      }
    };
    await storage.createProject(state);
    const databasePath = path.join(root, "collaboration.sqlite");
    const seed = CollaborationStateDatabase.open({
      databasePath,
      serviceId: "restart-no-pr-seed",
      instanceId: "restart-no-pr-seed-instance",
      hostId: "host-test",
      topology: "single-host"
    });
    seed.createProject({
      projectId: state.id,
      workflowRevision: 1,
      workflowSnapshot: state.orchestration,
      git: state.git,
      workerCapacity: 2,
      managementCapacity: 1
    });
    const repository = repositoryFact("restart-no-pr");
    seed.prepareOperation(state.id, {
      id: "operation-repository-restart-no-pr",
      kind: "repository.create",
      payloadHash: "repository-restart-no-pr",
      status: "prepared"
    });
    seed.transitionOperation(state.id, {
      id: "operation-repository-restart-no-pr",
      payloadHash: "repository-restart-no-pr",
      status: "observed",
      remoteFact: repository
    });
    seed.transitionOperation(state.id, {
      id: "operation-repository-restart-no-pr",
      payloadHash: "repository-restart-no-pr",
      status: "finalized",
      remoteFact: repository
    });
    const activation = seed.activateGroup({
      projectId: state.id,
      nodeRunId: "restart-no-pr-node",
      groupRunId: "restart-no-pr-run",
      nodeId: "restart-no-pr-team",
      groupId: "restart-no-pr-team",
      activationRequestId: "activate-restart-no-pr",
      inputSnapshotRef: `project:${state.id}:requirement`,
      optionalTask: "Recover both interrupted deliveries",
      memberAgentIds: ["idea", "execution"],
      origin: { kind: "project-input" },
      baseCommit: "a".repeat(40),
      groupBranch: "groups/restart-no-pr-run",
      workflowRevision: 1
    });
    seed.assignTasks({
      projectId: state.id,
      groupRunId: activation.groupRun.id,
      actorAgentId: activation.groupRun.leaderAgentId,
      coordinatorEpoch: activation.groupRun.coordinatorEpoch,
      tasks: [
        { id: "restart-no-pr-task-idea", assignment: "Recover idea", assigneeAgentId: "idea" },
        {
          id: "restart-no-pr-task-execution",
          assignment: "Recover execution",
          assigneeAgentId: "execution"
        }
      ]
    });
    const originals = [
      seed.claimNextTask({
        projectId: state.id,
        groupRunId: activation.groupRun.id,
        agentId: "idea",
        executionId: "restart-no-pr-idea",
        executionBranch: "executions/restart-no-pr-idea",
        worktreePath: path.join(
          storage.projectDir(state.id),
          "git-worktrees",
          "restart-no-pr-idea"
        ),
        invocationId: `inv_${"1".repeat(32)}`
      }),
      seed.claimNextTask({
        projectId: state.id,
        groupRunId: activation.groupRun.id,
        agentId: "execution",
        executionId: "restart-no-pr-execution",
        executionBranch: "executions/restart-no-pr-execution",
        worktreePath: path.join(
          storage.projectDir(state.id),
          "git-worktrees",
          "restart-no-pr-execution"
        ),
        invocationId: `inv_${"2".repeat(32)}`
      })
    ];
    if (!originals[0] || !originals[1]) {
      throw new Error("failed to seed both pre-PR restart executions");
    }
    for (const claimed of originals) {
      seed.transitionExecutionStatus({
        projectId: state.id,
        executionId: claimed.execution.id,
        ownershipEpoch: claimed.execution.ownershipEpoch,
        status: "working",
        invocationId: claimed.execution.invocationId
      });
    }
    const originalFacts = new Map(originals.map(({ execution }) => [execution.id, {
      agentId: execution.agentId,
      branch: execution.executionBranch,
      worktreePath: execution.worktreePath
    }]));
    seed.relinquishWriterLease();
    seed.close();

    let firstTurnStartedResolve!: () => void;
    const firstTurnStarted = new Promise<void>((resolve) => {
      firstTurnStartedResolve = resolve;
    });
    let releaseFirstTurn!: () => void;
    const firstTurnGate = new Promise<void>((resolve) => {
      releaseFirstTurn = resolve;
    });
    let firstRecoveredExecutionId: string | undefined;
    let failedAgentId: string | undefined;
    const stoppedExecutionIds: string[] = [];
    const sessionBegins: Array<{
      id: string;
      epoch: number;
      branch: string;
      worktreePath: string;
    }> = [];
    const gitOrder: string[] = [];
    const coordinator = new CollaborationRuntimeCoordinator({
      storage,
      databasePath,
      serviceId: "restart-no-pr-runtime",
      hostId: "host-test",
      gitFactory: (options) => {
        const git = happyGitFake(options, gitOrder);
        const sessionBegin = git.sessionBegin.bind(git);
        return {
          ...git,
          async observeRemoteRef(repository, ref) {
            return {
              owner: repository.owner,
              repository: repository.name,
              ref,
              status: "present" as const,
              sha: "a".repeat(40),
              observedAt: new Date().toISOString()
            };
          },
          async sessionBegin(execution, epoch, purpose, signal) {
            sessionBegins.push({
              id: execution.id,
              epoch,
              branch: execution.executionBranch,
              worktreePath: execution.worktreePath
            });
            return sessionBegin(execution, epoch, purpose, signal);
          }
        };
      },
      residentLauncher: {
        async stopLeaderForRecovery() {
          return { stopped: true, evidence: { processGroupAbsent: true } };
        },
        async stopForRecovery(input) {
          stoppedExecutionIds.push(input.execution.id);
          return {
            stopped: true,
            evidence: { processGroupAbsent: true }
          };
        },
        async open(input) {
          const context = input.request.executionContext!;
          return {
            async submit(turn) {
              if (context.role !== "leader") {
                if (!firstRecoveredExecutionId) {
                  firstRecoveredExecutionId = context.executionId!;
                  failedAgentId = input.request.agent;
                  firstTurnStartedResolve();
                  await firstTurnGate;
                  throw new Error("fixture first exact restart owner failed for real");
                }
                return agentFixtureDelivery(input, turn, { handoff: `recovered output from ${input.request.agent}` }, coordinator);
              }
              let action: ControlAction;
              if (turn.prompt.includes("Arrange the continuation now")) {
                const pending = state.tasks?.find((task) =>
                  task.status === "continuation_pending"
                );
                const survivor = ["idea", "execution"].find((agentId) =>
                  agentId !== failedAgentId
                );
                if (!pending || !survivor) {
                  throw new Error("fixture survivor handoff inputs are unavailable");
                }
                action = {
                  tool: "assign_group_tasks",
                  groupRunId: context.groupRunId!,
                  coordinatorEpoch: context.coordinatorEpoch!,
                  tasks: [{
                    taskId: pending.id,
                    assignment: pending.assignment,
                    assigneeAgentId: survivor
                  }]
                };
              } else if (turn.inputId.includes("-post-delivery-")) {
                const survivor = ["idea", "execution"].find((agentId) =>
                  agentId !== failedAgentId
                );
                if (!survivor) throw new Error("fixture survivor is unavailable");
                action = {
                  tool: "request_group_integration",
                  groupRunId: context.groupRunId!,
                  coordinatorEpoch: context.coordinatorEpoch!,
                  integrationOwnerAgentId: survivor
                };
              } else {
                action = {
                  tool: "complete_group",
                  groupRunId: context.groupRunId!,
                  coordinatorEpoch: context.coordinatorEpoch!,
                  output: "Both restart chains recovered without a false all-member pause"
                };
              }
              const fresh = await input.turnRequestFactory({ baseRequest: input.request, turn });
              const authority = await input.controlAuthorityFactory!({
                request: fresh.request,
                turn
              });
              const envelope = {
                projectId: state.id,
                agent: fresh.request.agent,
                invocationId: turn.invocationId,
                callId: `call-${turn.invocationId}`,
                stateVersion: authority.control.stateVersion,
                capabilityHash: authority.control.capabilityHash,
                receivedAt: new Date().toISOString(),
                action
              };

              return agentFixtureLeaderResult(input, turn, { handoff: "restart recovery management action", controlActions: [envelope] });
            },
            async pause() {},
            async resume() {},
            async close() {}
          };
        }
      }
    });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    try {
    expect(await coordinator.recoverProject(state)).toBe(true);
    await firstTurnStarted;

    const database = (coordinator as unknown as {
      database(): CollaborationStateDatabase;
    }).database();
    const midRecovery = database.projectState(state.id);
    expect(stoppedExecutionIds.sort()).toEqual([
      "restart-no-pr-execution",
      "restart-no-pr-idea"
    ]);
    expect(database.eligibleDeliveryMembers(state.id, activation.groupRun.id).sort()).toEqual([
      "execution",
      "idea"
    ]);
    expect(midRecovery.executions).toHaveLength(2);
    expect(midRecovery.executions.every((execution) =>
      originalFacts.has(execution.id) && !execution.predecessorExecutionId
    )).toBe(true);
    const exactReopened = midRecovery.executions.find((execution) =>
      execution.id === firstRecoveredExecutionId
    );
    const exactOriginal = originalFacts.get(firstRecoveredExecutionId!);
    expect(exactReopened).toMatchObject({
      id: firstRecoveredExecutionId,
      ownershipEpoch: 2,
      status: "working",
      executionBranch: exactOriginal?.branch,
      worktreePath: exactOriginal?.worktreePath
    });
    expect(sessionBegins[0]).toEqual({
      id: firstRecoveredExecutionId,
      epoch: 2,
      branch: exactOriginal?.branch,
      worktreePath: exactOriginal?.worktreePath
    });
    expect(database.latestExecutionStopRequest(
      state.id,
      firstRecoveredExecutionId!,
      1
    )?.payload.reason).toBe("service_restart_reconcile");
    const midTail = database.eventsAfter(state.id, 0, 10_000);
    expect(midTail.filter((event) =>
      event.type === "execution.restart_eligibility.restored"
    )).toHaveLength(2);
    expect(midTail.some((event) => event.type === "group.paused.all_members_failed")).toBe(false);

    releaseFirstTurn();
    await waitFor(() => state.status === "completed" || ["paused", "retrying"].includes(state.status) ||
      Boolean(state.lastError), 15_000);
    expect(state.lastError).toBeUndefined();
    expect(state.status).toBe("completed");
    expect(state.phase).toBe("completed");
    const completed = database.projectState(state.id);
    const survivor = ["idea", "execution"].find((agentId) => agentId !== failedAgentId);
    expect(completed.executions.find((execution) =>
      execution.predecessorExecutionId === firstRecoveredExecutionId
    )).toMatchObject({ agentId: survivor, status: "succeeded" });
    for (const [executionId, fact] of originalFacts) {
      expect(completed.executions.find((execution) => execution.id === executionId)).toMatchObject({
        executionBranch: fact.branch,
        worktreePath: fact.worktreePath,
        ownershipEpoch: 2
      });
    }
    const completedTail = database.eventsAfter(state.id, 0, 20_000);
    expect(completedTail.filter((event) =>
      event.type === "execution.recovered" &&
      event.payload.recoveryMode === "restart_no_remote"
    )).toHaveLength(2);
    expect(completedTail.some((event) => event.type === "group.paused.all_members_failed")).toBe(false);
    } finally { releaseFirstTurn(); await coordinator.shutdown(); }
  }, 30_000);

  it("keeps a durable all-member pause authoritative over a stale running file on restart", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-restart-durable-pause-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_30303030303030303030303030303030");
    state.git = {
      enabled: true,
      status: "ready",
      provider: "github",
      repository: {
        owner: "fixture-owner",
        name: "restart-durable-pause",
        htmlUrl: "https://github.example/restart-durable-pause",
        private: true,
        defaultBranch: "main",
        localPath: path.join(root, "repository")
      }
    };
    state.status = "running";
    state.phase = "restart-durable-pause-team:working";
    state.orchestration = {
      ...state.orchestration,
      collaborations: [{
        id: "restart-durable-pause-team",
        displayName: "Restart durable pause team",
        memberAgentIds: ["idea", "execution"],
        renamePolicy: "editable"
      }],
      input: { source: "input", target: "restart-durable-pause-team" },
      decisionPlans: {
        main: state.orchestration.decisionPlans.main,
        "restart-durable-pause-team": "Coordinate the durable pause group.",
        writing: state.orchestration.decisionPlans.writing,
        review: state.orchestration.decisionPlans.review
      },
      routes: {
        main: [
          { target: "restart-durable-pause-team", kind: "weak" },
          { target: "writing", kind: "weak" },
          { target: "review", kind: "weak" }
        ],
        "restart-durable-pause-team": [{ target: "finish", kind: "strong" }],
        writing: [{ target: "main", kind: "strong" }],
        review: [
          { target: "main", kind: "weak" },
          { target: "finish", kind: "weak" }
        ]
      }
    };
    await storage.createProject(state);
    const databasePath = path.join(root, "collaboration.sqlite");
    const seed = CollaborationStateDatabase.open({
      databasePath,
      serviceId: "restart-durable-pause-seed",
      instanceId: "restart-durable-pause-seed-instance",
      hostId: "host-test",
      topology: "single-host"
    });
    seed.createProject({
      projectId: state.id,
      workflowRevision: 1,
      workflowSnapshot: state.orchestration,
      git: state.git,
      workerCapacity: 2,
      managementCapacity: 1
    });
    const activation = seed.activateGroup({
      projectId: state.id,
      nodeRunId: "restart-durable-pause-node",
      groupRunId: "restart-durable-pause-run",
      nodeId: "restart-durable-pause-team",
      groupId: "restart-durable-pause-team",
      activationRequestId: "activate-restart-durable-pause",
      inputSnapshotRef: `project:${state.id}:requirement`,
      memberAgentIds: ["idea", "execution"],
      origin: { kind: "project-input" },
      baseCommit: "a".repeat(40),
      groupBranch: "groups/restart-durable-pause-run",
      workflowRevision: 1
    });
    seed.assignTasks({
      projectId: state.id,
      groupRunId: activation.groupRun.id,
      actorAgentId: activation.groupRun.leaderAgentId,
      coordinatorEpoch: activation.groupRun.coordinatorEpoch,
      tasks: [
        { id: "restart-durable-pause-idea", assignment: "Failed idea", assigneeAgentId: "idea" },
        {
          id: "restart-durable-pause-execution",
          assignment: "Failed execution",
          assigneeAgentId: "execution"
        }
      ]
    });
    for (const agentId of ["idea", "execution"]) {
      seed.excludeFailedMember({
        projectId: state.id,
        groupRunId: activation.groupRun.id,
        agentId,
        actorAgentId: activation.groupRun.leaderAgentId,
        coordinatorEpoch: activation.groupRun.coordinatorEpoch,
        reason: "fixture exhausted member"
      });
    }
    seed.pauseAllMembersFailed({
      projectId: state.id,
      groupRunId: activation.groupRun.id,
      actorAgentId: activation.groupRun.leaderAgentId,
      coordinatorEpoch: activation.groupRun.coordinatorEpoch,
      requestId: "pause-restart-durable-all-members"
    });
    expect(seed.projectState(state.id).groupRuns[0]).toMatchObject({
      status: "paused",
      pauseReason: "all_members_failed",
      coordinatorEpoch: 1
    });
    seed.relinquishWriterLease();
    seed.close();

    const restartedStorage = new ProjectStorage(root, new EventHub());
    await restartedStorage.initialize();
    const restartedState = await restartedStorage.loadState(state.id);
    expect(restartedState).toMatchObject({
      status: "running",
      phase: "restart-durable-pause-team:working"
    });
    let beginGroups = 0;
    let residentOpens = 0;
    let leaderStops = 0;
    let workerStops = 0;
    const coordinator = new CollaborationRuntimeCoordinator({
      storage: restartedStorage,
      databasePath,
      serviceId: "restart-durable-pause-runtime",
      hostId: "host-test",
      gitFactory: (options) => {
        const git = happyGitFake(options, []);
        return {
          ...git,
          async beginGroup(request) {
            beginGroups += 1;
            return git.beginGroup!(request);
          }
        };
      },
      residentLauncher: {
        async stopLeaderForRecovery() {
          leaderStops += 1;
          return { stopped: true, evidence: { processGroupAbsent: true } };
        },
        async stopForRecovery() {
          workerStops += 1;
          return { stopped: true, evidence: { processGroupAbsent: true } };
        },
        async open() {
          residentOpens += 1;
          throw new Error("durable pause must not open a resident");
        }
      }
    });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    expect(await coordinator.recoverProject(restartedState)).toBe(true);
    expect(restartedState).toMatchObject({
      status: "retrying",
      phase: "collaboration:all-members-failed"
    });
    expect(restartedState.lastError).toBeUndefined();
    expect(restartedState.groupRuns?.[0]).toMatchObject({
      status: "paused",
      pauseReason: "all_members_failed",
      coordinatorEpoch: 1
    });
    expect({ beginGroups, residentOpens, leaderStops, workerStops }).toEqual({
      beginGroups: 0,
      residentOpens: 0,
      leaderStops: 0,
      workerStops: 0
    });
    await coordinator.shutdown();
  });

  it("continues only durable cancellation when the file still says running after restart", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-restart-cancel-intent-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_31313131313131313131313131313131");
    state.git = {
      enabled: true,
      status: "ready",
      provider: "github",
      repository: {
        owner: "fixture-owner",
        name: "restart-cancel-intent",
        htmlUrl: "https://github.example/restart-cancel-intent",
        private: true,
        defaultBranch: "main",
        localPath: path.join(root, "repository")
      }
    };
    state.status = "running";
    state.phase = "restart-cancel-intent-team:working";
    state.orchestration = {
      ...state.orchestration,
      collaborations: [{
        id: "restart-cancel-intent-team",
        displayName: "Restart cancellation team",
        memberAgentIds: ["idea", "execution"],
        renamePolicy: "editable"
      }],
      input: { source: "input", target: "restart-cancel-intent-team" },
      decisionPlans: {
        main: state.orchestration.decisionPlans.main,
        "restart-cancel-intent-team": "Coordinate the cancellation group.",
        writing: state.orchestration.decisionPlans.writing,
        review: state.orchestration.decisionPlans.review
      },
      routes: {
        main: [
          { target: "restart-cancel-intent-team", kind: "weak" },
          { target: "writing", kind: "weak" },
          { target: "review", kind: "weak" }
        ],
        "restart-cancel-intent-team": [{ target: "finish", kind: "strong" }],
        writing: [{ target: "main", kind: "strong" }],
        review: [
          { target: "main", kind: "weak" },
          { target: "finish", kind: "weak" }
        ]
      }
    };
    await storage.createProject(state);
    const databasePath = path.join(root, "collaboration.sqlite");
    const seed = CollaborationStateDatabase.open({
      databasePath,
      serviceId: "restart-cancel-intent-seed",
      instanceId: "restart-cancel-intent-seed-instance",
      hostId: "host-test",
      topology: "single-host"
    });
    seed.createProject({
      projectId: state.id,
      workflowRevision: 1,
      workflowSnapshot: state.orchestration,
      git: state.git,
      workerCapacity: 2,
      managementCapacity: 1
    });
    const repository = repositoryFact("restart-cancel-intent");
    seed.prepareOperation(state.id, {
      id: "operation-repository-restart-cancel-intent",
      kind: "repository.create",
      payloadHash: "repository-restart-cancel-intent",
      status: "prepared"
    });
    seed.transitionOperation(state.id, {
      id: "operation-repository-restart-cancel-intent",
      payloadHash: "repository-restart-cancel-intent",
      status: "observed",
      remoteFact: repository
    });
    seed.transitionOperation(state.id, {
      id: "operation-repository-restart-cancel-intent",
      payloadHash: "repository-restart-cancel-intent",
      status: "finalized",
      remoteFact: repository
    });
    const activation = seed.activateGroup({
      projectId: state.id,
      nodeRunId: "restart-cancel-intent-node",
      groupRunId: "restart-cancel-intent-run",
      nodeId: "restart-cancel-intent-team",
      groupId: "restart-cancel-intent-team",
      activationRequestId: "activate-restart-cancel-intent",
      inputSnapshotRef: `project:${state.id}:requirement`,
      memberAgentIds: ["idea", "execution"],
      origin: { kind: "project-input" },
      baseCommit: "a".repeat(40),
      groupBranch: "groups/restart-cancel-intent-run",
      workflowRevision: 1
    });
    seed.assignTasks({
      projectId: state.id,
      groupRunId: activation.groupRun.id,
      actorAgentId: activation.groupRun.leaderAgentId,
      coordinatorEpoch: activation.groupRun.coordinatorEpoch,
      tasks: [{
        id: "restart-cancel-intent-task",
        assignment: "This writer must only be cancelled",
        assigneeAgentId: "idea"
      }]
    });
    const claimed = seed.claimNextTask({
      projectId: state.id,
      groupRunId: activation.groupRun.id,
      agentId: "idea",
      executionId: "restart-cancel-intent-execution",
      executionBranch: "executions/restart-cancel-intent-execution",
      worktreePath: path.join(
        storage.projectDir(state.id),
        "git-worktrees",
        "restart-cancel-intent-execution"
      ),
      invocationId: `inv_${"3".repeat(32)}`
    });
    if (!claimed) throw new Error("failed to seed cancellation writer");
    seed.transitionExecutionStatus({
      projectId: state.id,
      executionId: claimed.execution.id,
      ownershipEpoch: claimed.execution.ownershipEpoch,
      status: "working",
      invocationId: claimed.execution.invocationId
    });
    padRuntimeProjectEventsPastLegacyWindow(databasePath, state.id, 100_050);
    const fillerLastSeq = seed.eventsAfter(state.id, 100_000, 1_000).at(-1)?.seq;
    if (!fillerLastSeq) throw new Error("failed to seed large leader launch history");
    const leaderInvocationId = `inv_${createHash("sha256")
      .update(`group-leader:${state.id}:${activation.groupRun.id}:1`)
      .digest("hex")
      .slice(0, 32)}`;
    const leaderRuntimePath = path.join(
      storage.projectDir(state.id),
      "runtime",
      "collaboration-leaders",
      createHash("sha256").update(activation.groupRun.id).digest("hex").slice(0, 24)
    );
    const leaderLaunch = seed.appendEvent({
      projectId: state.id,
      nodeRunId: activation.groupRun.nodeRunId,
      groupRunId: activation.groupRun.id,
      agentId: activation.groupRun.actingCoordinatorId ?? activation.groupRun.leaderAgentId,
      invocationId: leaderInvocationId,
      coordinatorEpoch: activation.groupRun.coordinatorEpoch,
      type: "group.leader.launch.started",
      payload: {
        residentLaunchProtocol: "trusted-supervisor-v1",
        invocationId: leaderInvocationId,
        runtimePath: leaderRuntimePath
      }
    }).event;
    expect(seed.eventsAfter(state.id, 0, 100_000).some((event) =>
      event.type === "group.leader.launch.started"
    )).toBe(false);
    seed.appendEvent({
      projectId: state.id,
      requestId: `cancel-intent-${state.id}`,
      workflowRevision: 1,
      agentId: "main",
      type: "project.cancellation.requested",
      payload: { actor: "user", reason: "user_cancelled" }
    });
    seed.requestGroupCancellation({
      projectId: state.id,
      groupRunId: activation.groupRun.id,
      actorAgentId: "main",
      reason: "user_cancelled",
      requestId: `cancel-${state.id}`
    });
    expect(seed.projectState(state.id)).toMatchObject({
      activeNodeRunId: activation.groupRun.nodeRunId,
      groupRuns: [expect.objectContaining({
        status: "paused",
        pauseReason: "cancellation_pending",
        cancellationRequested: true,
        coordinatorEpoch: 1
      })],
      executions: [expect.objectContaining({ status: "stop_requested", ownershipEpoch: 1 })]
    });
    const seededProjection = seed.projectState(state.id);
    state.collaboration = {
      stateRevision: seededProjection.stateRevision,
      frozen: seededProjection.frozen,
      ...(seededProjection.freezeReason ? { freezeReason: seededProjection.freezeReason } : {}),
      eventSeq: fillerLastSeq,
      routeOutbox: structuredClone(seededProjection.routeOutbox),
      usage: structuredClone(seededProjection.usage)
    };
    await storage.saveState(state);
    seed.relinquishWriterLease();
    seed.close();

    const restartedStorage = new ProjectStorage(root, new EventHub());
    await restartedStorage.initialize();
    const restartedState = await restartedStorage.loadState(state.id);
    expect(restartedState.status).toBe("running");
    let beginGroups = 0;
    let residentOpens = 0;
    let leaderStops = 0;
    let workerStops = 0;
    const leaderStopProtocols: Array<"trusted-supervisor-v1" | undefined> = [];
    const coordinator = new CollaborationRuntimeCoordinator({
      storage: restartedStorage,
      databasePath,
      serviceId: "restart-cancel-intent-runtime",
      hostId: "host-test",
      gitFactory: (options) => {
        const git = happyGitFake(options, []);
        return {
          ...git,
          async beginGroup(request) {
            beginGroups += 1;
            return git.beginGroup!(request);
          }
        };
      },
      residentLauncher: {
        async stopLeaderForRecovery(input) {
          leaderStops += 1;
          leaderStopProtocols.push(input.residentLaunchProtocol);
          return { stopped: true, evidence: { processGroupAbsent: true } };
        },
        async stopForRecovery() {
          workerStops += 1;
          return { stopped: true, evidence: { processGroupAbsent: true } };
        },
        async open() {
          residentOpens += 1;
          throw new Error("durable cancellation must not launch a resident");
        }
      }
    });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    expect(await coordinator.recoverProject(restartedState)).toBe(true);
    expect(restartedState).toMatchObject({ status: "paused", phase: "collaboration:user-cancelled" });
    const database = (coordinator as unknown as {
      database(): CollaborationStateDatabase;
    }).database();
    const cancelled = database.projectState(state.id);
    // HTTP/SSE use this projection, rather than the file envelope. A Stop
    // that proved the original native writers stopped must remain resumable
    // even if that envelope was stale or the service has restarted.
    expect(deriveProjectRuntimeProjection(cancelled, {
      status: "running", phase: "restart-cancel-intent-team:working"
    })).toMatchObject({ status: "paused", phase: "collaboration:user-cancelled" });
    expect(cancelled.activeNodeRunId).toBe(activation.groupRun.nodeRunId);
    expect(cancelled.groupRuns[0]).toMatchObject({
      status: "paused",
      coordinatorEpoch: 1,
      cancellationRequested: true
    });
    expect(cancelled.executions[0]).toMatchObject({
      id: claimed.execution.id,
      ownershipEpoch: 1,
      status: "stopped"
    });
    expect(cancelled.routeOutbox).toEqual([]);
    expect(database.eventsAfter(state.id, leaderLaunch.seq, 10_000).some((event) =>
      event.type === "execution.launch.started" ||
      event.type === "group.leader.launch.started" ||
      event.type === "route.emitted"
    )).toBe(false);
    expect(leaderStopProtocols).toEqual(["trusted-supervisor-v1"]);
    expect({ beginGroups, residentOpens, leaderStops, workerStops }).toEqual({
      beginGroups: 0,
      residentOpens: 0,
      leaderStops: 1,
      workerStops: 1
    });
    await coordinator.shutdown();
  }, 40_000);

  it("returns a merged group PR to its original Agent and requires finish_task before publication", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-group-restart-pr-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_99999999999999999999999999999999");
    state.git = {
      enabled: true,
      status: "ready",
      provider: "github",
      repository: {
        owner: "fixture-owner",
        name: "group-restart",
        htmlUrl: "https://github.example/group-restart",
        private: true,
        defaultBranch: "main",
        localPath: path.join(root, "repository")
      }
    };
    state.status = "running";
    state.phase = "restart-team:coordinating";
    state.orchestration = {
      ...state.orchestration,
      collaborations: [{
        id: "restart-team",
        displayName: "Restart team",
        memberAgentIds: ["idea", "execution"],
        renamePolicy: "editable"
      }],
      input: { source: "input", target: "restart-team" },
      routes: { ...state.orchestration.routes, "restart-team": [{ target: "finish", kind: "strong" }] }
    };
    await storage.createProject(state);
    const databasePath = path.join(root, "collaboration.sqlite");
    const seed = CollaborationStateDatabase.open({
      databasePath,
      serviceId: "group-restart-seed",
      instanceId: "group-restart-seed-instance",
      hostId: "host-test",
      topology: "single-host"
    });
    seed.createProject({
      projectId: state.id,
      workflowRevision: 1,
      workflowSnapshot: state.orchestration,
      git: state.git,
      workerCapacity: 2,
      managementCapacity: 1
    });
    const repository = repositoryFact("group-restart");
    seed.prepareOperation(state.id, {
      id: "operation-repository-group-restart",
      kind: "repository.create",
      payloadHash: "repository-group-restart",
      status: "prepared"
    });
    seed.transitionOperation(state.id, {
      id: "operation-repository-group-restart",
      payloadHash: "repository-group-restart",
      status: "observed",
      remoteFact: repository
    });
    seed.transitionOperation(state.id, {
      id: "operation-repository-group-restart",
      payloadHash: "repository-group-restart",
      status: "finalized",
      remoteFact: repository
    });
    const activation = seed.activateGroup({
      projectId: state.id,
      nodeRunId: "group-restart-node",
      groupRunId: "group-restart-run",
      nodeId: "restart-team",
      groupId: "restart-team",
      activationRequestId: "activate-group-restart",
      inputSnapshotRef: `project:${state.id}:requirement`,
      optionalTask: "Finish the retained group PR",
      memberAgentIds: ["idea", "execution"],
      origin: { kind: "project-input" },
      baseCommit: "a".repeat(40),
      groupBranch: "groups/group-restart-run",
      workflowRevision: 1
    });
    seed.assignTasks({
      projectId: state.id,
      groupRunId: "group-restart-run",
      actorAgentId: activation.groupRun.leaderAgentId,
      coordinatorEpoch: 1,
      tasks: [{
        id: "group-restart-delivery-task",
        assignment: "Seed an already-merged delivery",
        assigneeAgentId: "execution"
      }]
    });
    const delivery = seed.claimNextTask({
      projectId: state.id,
      groupRunId: "group-restart-run",
      agentId: "execution",
      executionId: "group-restart-delivery",
      executionBranch: "executions/group-restart-delivery",
      worktreePath: path.join(storage.projectDir(state.id), "git-worktrees", "group-restart-delivery"),
      invocationId: `inv_${"7".repeat(32)}`
    });
    if (!delivery) throw new Error("failed to seed delivery execution");
    seed.observePullRequest({
      projectId: state.id,
      executionId: delivery.execution.id,
      ownershipEpoch: 1,
      pullRequest: {
        ...pullFact(
          80,
          delivery.execution.id,
          delivery.execution.executionBranch,
          "groups/group-restart-run",
          "b".repeat(40),
          "merged"
        ),
        mergeCommitSha: "c".repeat(40)
      }
    });
    seed.completeExecution({
      projectId: state.id,
      executionId: delivery.execution.id,
      ownershipEpoch: 1,
      output: "Seed delivery merged"
    });
    const final = seed.startFinalIntegration({
      projectId: state.id,
      groupRunId: "group-restart-run",
      actorAgentId: activation.groupRun.leaderAgentId,
      coordinatorEpoch: 1,
      ownerAgentId: "execution",
      taskId: "group-restart-final-task",
      executionId: "group-restart-final",
      assignment: "Finish the retained final PR",
      executionBranch: "groups/group-restart-run",
      worktreePath: path.join(storage.projectDir(state.id), "git-worktrees", "group-restart-final")
    });
    seed.transitionExecutionStatus({
      projectId: state.id,
      executionId: final.execution.id,
      ownershipEpoch: 1,
      status: "working",
      invocationId: `inv_${"9".repeat(32)}`
    });
    seed.appendEvent({
      projectId: state.id,
      requestId: "stage-restart-merged-artifact",
      workflowRevision: 1,
      nodeRunId: final.execution.nodeRunId,
      groupRunId: final.execution.groupRunId,
      agentId: final.execution.agentId,
      taskId: final.execution.taskId,
      executionId: final.execution.id,
      invocationId: `inv_${"9".repeat(32)}`,
      ownershipEpoch: 1,
      type: "artifact.publication.staged",
      payload: {
        path: "recovered-final.md",
        title: "Recovered final evidence",
        kind: "document",
        description: "Published from the authoritative merged commit",
        callId: "publish-restart-merged-artifact"
      }
    });
    seed.prepareOperation(state.id, {
      id: "pull-group-restart-final",
      kind: "pull.create",
      payloadHash: "lost-final-pull-create-response",
      status: "prepared",
      ownerExecutionId: final.execution.id,
      ownershipEpoch: 1,
      expectedHead: "c".repeat(40),
      expectedBase: "main"
    });
    seed.prepareOperation(state.id, {
      id: "merge-group-restart-final",
      kind: "pull.merge",
      payloadHash: "lost-final-merge-response",
      status: "prepared",
      ownerExecutionId: final.execution.id,
      ownershipEpoch: 1,
      expectedHead: "c".repeat(40),
      expectedBase: "main"
    });
    seed.relinquishWriterLease();
    seed.close();

    let remotePull: GitHubPullRequestFact = {
      ...pullFact(
        81,
        final.execution.id,
        final.execution.executionBranch,
        "main",
        "c".repeat(40),
        "merged"
      ),
      mergeCommitSha: "d".repeat(40), repository: "group-restart"
    };
    const stoppedWorkerEpochs: number[] = [];
    const openedWorkerEpochs: number[] = [];
    const mergeOperations: string[] = [];
    const recoveryOrder: string[] = [];
    let workerSubmits = 0;
    let leaderSubmits = 0;
    const artifactValidationStatuses: string[] = [];
    const recoveredFinalContent = "# Recovered final integration.\n";
    await fs.mkdir(path.join(root, "immutable"), { recursive: true });
    await fs.writeFile(path.join(root, "immutable", "recovered-final.md"), recoveredFinalContent);
    const workspaceCandidate = vi.spyOn(storage, "resolveExecutionArtifactCandidate")
      .mockRejectedValue(new Error("stop-confirmed publication must not read the worktree"));
    const immutableArtifact = vi.spyOn(storage, "validateGitArtifactRecord")
      .mockImplementation(async (verificationState, record) => {
        const verifiedExecution = verificationState.executions?.find((execution) =>
          execution.id === final.execution.id
        );
        if (!verifiedExecution) throw new Error("artifact validation lost its execution");
        artifactValidationStatuses.push(verifiedExecution.status);
        expect(verifiedExecution.ownershipEpoch).toBe(2);
        expect(record).toMatchObject({
          path: "recovered-final.md",
          gitSource: {
            executionId: final.execution.id,
            ownershipEpoch: 2,
            commitSha: "c".repeat(40),
            pullRequestId: "pull-81",
            acceptedBase: "main"
          }
        });
        return {
          sourcePath: path.join(root, "immutable", "recovered-final.md"),
          relativePath: "recovered-final.md",
          size: Buffer.byteLength(recoveredFinalContent),
          mediaType: "text/markdown",
          mtimeMs: 0
        };
      });
    const coordinator = new CollaborationRuntimeCoordinator({
      storage,
      databasePath,
      serviceId: "group-restart-service",
      hostId: "host-test",
      gitFactory: (options) => {
        const base = happyGitFake(options, []);
        return {
          ...base,
          async observeRemoteRef(requestRepository, ref) {
            return {
              owner: requestRepository.owner,
              repository: requestRepository.name,
              ref,
              status: "present" as const,
              sha: ref === "main" ? "a".repeat(40) : "c".repeat(40),
              observedAt: new Date().toISOString()
            };
          },
          async observePullRequestForExecution() {
            recoveryOrder.push("observe-member-pr");
            return structuredClone(remotePull);
          },
          async observePullRequest() {
            recoveryOrder.push("observe-known-pr");
            return structuredClone(remotePull);
          },
          async sessionBegin(execution, epoch, input, signal) {
            recoveryOrder.push(`begin-member-${epoch}`);
            openedWorkerEpochs.push(epoch);
            return base.sessionBegin(execution, epoch, input, signal);
          },
          async checkpointAndPush() {
            throw new Error("group restart must not checkpoint before reconciling the final PR");
          },
          async createPullRequest() {
            throw new Error("group restart must not create a second final PR");
          },
          async reconcileMergedPullRequest(request) {
            mergeOperations.push(request.operationId);
            remotePull = {
              ...remotePull,
              status: "merged",
              mergeCommitSha: "d".repeat(40),
              observedAt: new Date().toISOString()
            };
            return {
              ...structuredClone(remotePull),
              localSynchronization: {
                projectId: state.id,
                operationId: request.operationId,
                targetBranch: "main" as const,
                temporaryRef: "refs/openfars/restart/group-final",
                expectedSourceHead: request.expectedHead,
                mergeCommitSha: "d".repeat(40),
                remoteHead: "d".repeat(40),
                localHeadBefore: "a".repeat(40),
                localHeadAfter: "d".repeat(40),
                status: "synchronized" as const,
                observedAt: new Date().toISOString()
              }
            };
          }
        };
      },
      residentLauncher: {
        async stopLeaderForRecovery() {
          recoveryOrder.push("stop-leader");
          return { stopped: true, evidence: { processGroupAbsent: true } };
        },
        async stopForRecovery(input) {
          stoppedWorkerEpochs.push(input.execution.ownershipEpoch);
          const stopped = stoppedWorkerEpochs.length > 1;
          recoveryOrder.push(stopped ? "stop-member-confirmed" : "stop-member-unconfirmed");
          return stopped
            ? { stopped: true, evidence: { processGroupAbsent: true } }
            : { stopped: false, evidence: { processStillPresent: true } };
        },
        async open(input) {
          const context = input.request.executionContext!;
          recoveryOrder.push(
            context.role === "leader"
              ? `open-leader-${context.coordinatorEpoch}`
              : `open-member-${context.ownershipEpoch}`
          );
          return {
            async submit(turn) {
              if (context.role !== "leader") {
                workerSubmits += 1;
                expect(context.executionId).toBe(final.execution.id);
                expect(input.request.workspacePath).toBe(final.execution.worktreePath);
                if (workerSubmits === 1) {
                  expect(turn.prompt).toContain('"providerNumber":81');
                  const requests = await agentFixtureRequests(input, turn, [
                    { tool: "github_get_pr", providerNumber: 81 },
                    { tool: "github_merge_pr", providerNumber: 81, reason: "Recover the actual merged result" }
                  ]);
                  expect(requests.results[0]).toMatchObject({ status: "merged", providerNumber: 81 });
                  expect(state.status).not.toBe("completed");
                  return { handoff: "Merged result observed; formal finish still missing", controlActions: requests.envelopes };
                }
                expect(turn.prompt).toContain("finish_task");
                const requests = await agentFixtureRequests(input, turn, [
                  { tool: "finish_task", summary: "Accepted the retained merged delivery" }
                ]);
                return { handoff: "Finished the retained delivery", controlActions: requests.envelopes };
              }
              leaderSubmits += 1;
              const fresh = await input.turnRequestFactory({ baseRequest: input.request, turn });
              const authority = await input.controlAuthorityFactory!({ request: fresh.request, turn });
              const action: ControlAction = {
                tool: "complete_group",
                groupRunId: context.groupRunId!,
                coordinatorEpoch: context.coordinatorEpoch!,
                output: "Recovered final PR merged"
              };
              const envelope = {
                projectId: state.id,
                agent: fresh.request.agent,
                invocationId: turn.invocationId,
                callId: `call-${turn.invocationId}`,
                stateVersion: authority.control.stateVersion,
                capabilityHash: authority.control.capabilityHash,
                receivedAt: new Date().toISOString(),
                action
              };

              return agentFixtureLeaderResult(input, turn, { handoff: "Recovered group completion", controlActions: [envelope] });
            },
            async pause() {},
            async resume() {},
            async close() {}
          };
        }
      }
    });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    expect(await coordinator.recoverProject(state)).toBe(true);
    if (["paused", "retrying"].includes(state.status)) await coordinator.resumeProject(state);
    await waitFor(() => state.phase === "collaboration:recovering");
    expect(recoveryOrder).toEqual([
      "stop-leader",
      "observe-member-pr",
      "stop-member-unconfirmed"
    ]);
    expect(recoveryOrder.some((item) => item.startsWith("open-"))).toBe(false);
    expect(state.groupRuns?.[0]).toMatchObject({ coordinatorEpoch: 1 });
    expect(state.executions?.find((execution) => execution.id === "group-restart-final"))
      .toMatchObject({ ownershipEpoch: 1 });

    expect(await coordinator.recoverProject(state)).toBe(true);
    if (["paused", "retrying"].includes(state.status)) await coordinator.resumeProject(state);
    await waitFor(() => state.status === "completed");

    expect(stoppedWorkerEpochs).toEqual([1, 1]);
    expect(recoveryOrder.slice(0, 6)).toEqual([
      "stop-leader",
      "observe-member-pr",
      "stop-member-unconfirmed",
      "observe-known-pr",
      "stop-member-confirmed",
      "open-leader-2"
    ]);
    // The Agent sees the existing merged result, then supplies the missing
    // receipt in the same retained handle. No duplicate push/PR/merge occurs.
    expect(openedWorkerEpochs).toEqual([2]);
    expect(workerSubmits).toBe(2);
    expect(leaderSubmits).toBe(1);
    expect(mergeOperations).toHaveLength(1);
    expect(mergeOperations[0]).toMatch(/^reconcile-merged-group-restart-final-epoch-2-/u);
    expect(workspaceCandidate).not.toHaveBeenCalled();
    expect(immutableArtifact).toHaveBeenCalledTimes(1);
    expect(artifactValidationStatuses).toEqual(["merged"]);
    expect(state.executions?.find((execution) => execution.id === "group-restart-final"))
      .toMatchObject({ ownershipEpoch: 2, status: "succeeded" });
    expect(state.executions?.filter((execution) =>
      execution.predecessorExecutionId === "group-restart-final"
    )).toEqual([]);
    expect(state.groupRuns?.[0]).toMatchObject({
      status: "completed",
      output: "Recovered final PR merged"
    });
    expect(state.artifacts).toEqual([
      expect.objectContaining({
        id: expect.stringMatching(/^artifact_[a-f0-9]{64}$/),
        path: "recovered-final.md",
        size: 31,
        sha256: createHash("sha256").update(recoveredFinalContent).digest("hex"),
        mediaType: "text/markdown",
        gitSource: {
          executionId: final.execution.id,
          ownershipEpoch: 2,
          worktreePath: final.execution.worktreePath,
          commitSha: "c".repeat(40),
          pullRequestId: "pull-81",
          acceptedBase: "main"
        }
      })
    ]);
    const completedExecution = state.executions?.find((execution) =>
      execution.id === final.execution.id
    );
    const acceptedPull = state.pullRequests?.find((pull) =>
      pull.ownerExecutionId === final.execution.id
    );
    if (!completedExecution || !acceptedPull) {
      throw new Error("fixture lost its completed execution or accepted pull");
    }
    const internal = coordinator as unknown as {
      commitMergedExecutionArtifacts(
        current: ProjectState,
        execution: typeof completedExecution,
        pull: typeof acceptedPull
      ): Promise<void>;
    };
    await internal.commitMergedExecutionArtifacts(state, completedExecution, acceptedPull);
    const publicationEvents = (await storage.readEvents(state.id, 0, 10_000))
      .filter((event) => event.type === "artifact.published");
    expect(publicationEvents).toHaveLength(1);
    expect(workspaceCandidate).not.toHaveBeenCalled();
    expect(immutableArtifact).toHaveBeenCalledTimes(2);
    expect(artifactValidationStatuses).toEqual(["merged", "succeeded"]);
    await coordinator.shutdown();
  });

  it("does not advance or open a recovered leader when a member stop remains unconfirmed", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-group-restart-stop-fence-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_fefefefefefefefefefefefefefefefe");
    state.git = {
      enabled: true,
      status: "ready",
      provider: "github",
      repository: {
        owner: "fixture-owner",
        name: "group-restart-stop-fence",
        htmlUrl: "https://github.example/group-restart-stop-fence",
        private: true,
        defaultBranch: "main",
        localPath: path.join(root, "repository")
      }
    };
    state.status = "running";
    state.phase = "stop-fence-team:coordinating";
    state.orchestration = {
      ...state.orchestration,
      collaborations: [{
        id: "stop-fence-team",
        displayName: "Stop fence team",
        memberAgentIds: ["idea", "execution"],
        renamePolicy: "editable"
      }],
      input: { source: "input", target: "stop-fence-team" },
      routes: {
        ...state.orchestration.routes,
        "stop-fence-team": [{ target: "finish", kind: "strong" }]
      }
    };
    await storage.createProject(state);
    const databasePath = path.join(root, "collaboration.sqlite");
    const seed = CollaborationStateDatabase.open({
      databasePath,
      serviceId: "group-stop-fence-seed",
      instanceId: "group-stop-fence-seed-instance",
      hostId: "host-test",
      topology: "single-host"
    });
    seed.createProject({
      projectId: state.id,
      workflowRevision: 1,
      workflowSnapshot: state.orchestration,
      git: state.git,
      workerCapacity: 2,
      managementCapacity: 1
    });
    const repository = repositoryFact("group-restart-stop-fence");
    seed.prepareOperation(state.id, {
      id: "operation-repository-group-stop-fence",
      kind: "repository.create",
      payloadHash: "repository-group-stop-fence",
      status: "prepared"
    });
    seed.transitionOperation(state.id, {
      id: "operation-repository-group-stop-fence",
      payloadHash: "repository-group-stop-fence",
      status: "observed",
      remoteFact: repository
    });
    seed.transitionOperation(state.id, {
      id: "operation-repository-group-stop-fence",
      payloadHash: "repository-group-stop-fence",
      status: "finalized",
      remoteFact: repository
    });
    const activation = seed.activateGroup({
      projectId: state.id,
      nodeRunId: "group-stop-fence-node",
      groupRunId: "group-stop-fence-run",
      nodeId: "stop-fence-team",
      groupId: "stop-fence-team",
      activationRequestId: "activate-group-stop-fence",
      inputSnapshotRef: `project:${state.id}:requirement`,
      optionalTask: "Keep the previous member fenced",
      memberAgentIds: ["idea", "execution"],
      origin: { kind: "project-input" },
      baseCommit: "a".repeat(40),
      groupBranch: "groups/group-stop-fence-run",
      workflowRevision: 1
    });
    seed.assignTasks({
      projectId: state.id,
      groupRunId: activation.groupRun.id,
      actorAgentId: activation.groupRun.leaderAgentId,
      coordinatorEpoch: 1,
      tasks: [{
        id: "group-stop-fence-task",
        assignment: "Writer whose stop cannot be proven",
        assigneeAgentId: "execution"
      }]
    });
    const claimed = seed.claimNextTask({
      projectId: state.id,
      groupRunId: activation.groupRun.id,
      agentId: "execution",
      executionId: "group-stop-fence-execution",
      executionBranch: "executions/group-stop-fence-execution",
      worktreePath: path.join(
        storage.projectDir(state.id),
        "git-worktrees",
        "group-stop-fence-execution"
      ),
      invocationId: `inv_${"e".repeat(32)}`
    });
    if (!claimed) throw new Error("failed to seed stop-fence execution");
    seed.relinquishWriterLease();
    seed.close();

    const recoveryOrder: string[] = [];
    let leaderOpens = 0;
    const coordinator = new CollaborationRuntimeCoordinator({
      storage,
      databasePath,
      serviceId: "group-stop-fence-service",
      hostId: "host-test",
      gitFactory: (options) => happyGitFake(options, []),
      residentLauncher: {
        async stopLeaderForRecovery() {
          recoveryOrder.push("stop-leader");
          return { stopped: true, evidence: { processGroupAbsent: true } };
        },
        async stopForRecovery() {
          recoveryOrder.push("stop-member-unconfirmed");
          return { stopped: false, evidence: { processStillPresent: true } };
        },
        async open(input) {
          if (input.request.executionContext?.role === "leader") leaderOpens += 1;
          recoveryOrder.push(`open-${input.request.executionContext?.role ?? "unknown"}`);
          return {
            async submit() { return { handoff: "must never run" }; },
            async pause() {},
            async resume() {},
            async close() {}
          };
        }
      }
    });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    expect(await coordinator.recoverProject(state)).toBe(true);
    await waitFor(() => state.phase === "collaboration:recovering");
    await coordinator.shutdown();

    expect(recoveryOrder).toEqual(["stop-leader", "stop-member-unconfirmed"]);
    expect(leaderOpens).toBe(0);
    expect(state.lastError).toContain("not stop-confirmed");
    expect(state.groupRuns?.[0]).toMatchObject({
      id: "group-stop-fence-run",
      coordinatorEpoch: 1
    });
    expect(state.executions?.find((execution) => execution.id === claimed.execution.id))
      .toMatchObject({ ownershipEpoch: 1 });
  });

  it("fences a leader across planned and actual launch crashes before reopening", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-leader-double-launch-crash-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_77777777777777777777777777777770");
    state.git = {
      enabled: true,
      status: "ready",
      provider: "github",
      repository: {
        owner: "fixture-owner",
        name: "leader-double-launch-crash",
        htmlUrl: "https://github.example/leader-double-launch-crash",
        private: true,
        defaultBranch: "main",
        localPath: path.join(root, "repository")
      }
    };
    state.status = "running";
    state.phase = "leader-boundary-team:coordinating";
    state.orchestration = {
      ...state.orchestration,
      collaborations: [{
        id: "leader-boundary-team",
        displayName: "Leader boundary team",
        memberAgentIds: ["idea", "execution"],
        renamePolicy: "editable"
      }],
      input: { source: "input", target: "leader-boundary-team" },
      routes: {
        ...state.orchestration.routes,
        "leader-boundary-team": [{ target: "finish", kind: "strong" }]
      }
    };
    await storage.createProject(state);
    const databasePath = path.join(root, "collaboration.sqlite");
    const seed = CollaborationStateDatabase.open({
      databasePath,
      serviceId: "leader-boundary-seed",
      instanceId: "leader-boundary-seed-instance",
      hostId: "host-test",
      topology: "single-host"
    });
    seed.createProject({
      projectId: state.id,
      workflowRevision: 1,
      workflowSnapshot: state.orchestration,
      git: state.git,
      workerCapacity: 2,
      managementCapacity: 1
    });
    const repository = repositoryFact("leader-double-launch-crash");
    seed.prepareOperation(state.id, {
      id: "operation-repository-leader-boundary",
      kind: "repository.create",
      payloadHash: "repository-leader-boundary",
      status: "prepared"
    });
    seed.transitionOperation(state.id, {
      id: "operation-repository-leader-boundary",
      payloadHash: "repository-leader-boundary",
      status: "observed",
      remoteFact: repository
    });
    seed.transitionOperation(state.id, {
      id: "operation-repository-leader-boundary",
      payloadHash: "repository-leader-boundary",
      status: "finalized",
      remoteFact: repository
    });
    const groupRunId = "group-run-leader-boundary";
    const leaderInvocationId = `inv_${createHash("sha256")
      .update(`group-leader:${state.id}:${groupRunId}:1`)
      .digest("hex")
      .slice(0, 32)}`;
    const leaderRuntimePath = path.join(
      storage.projectDir(state.id),
      "runtime",
      "collaboration-leaders",
      createHash("sha256").update(groupRunId).digest("hex").slice(0, 24)
    );
    seed.activateGroup({
      projectId: state.id,
      nodeRunId: "node-run-leader-boundary",
      groupRunId,
      nodeId: "leader-boundary-team",
      groupId: "leader-boundary-team",
      activationRequestId: "activate-leader-boundary",
      inputSnapshotRef: `project:${state.id}:requirement`,
      optionalTask: "Crash across leader launch boundaries",
      memberAgentIds: ["idea", "execution"],
      origin: { kind: "project-input" },
      baseCommit: "a".repeat(40),
      groupBranch: `groups/${groupRunId}`,
      workflowRevision: 1,
      residentLaunchProtocol: "trusted-supervisor-v1",
      leaderInvocationId,
      leaderRuntimePath
    });
    seed.relinquishWriterLease();
    seed.close();

    const stops: Array<{
      epoch: number;
      protocol: "trusted-supervisor-v1" | undefined;
    }> = [];
    const openedEpochs: number[] = [];
    const first = new CollaborationRuntimeCoordinator({
      storage,
      databasePath,
      serviceId: "leader-boundary-first",
      hostId: "host-test",
      gitFactory: (options) => happyGitFake(options, []),
      residentLauncher: {
        async stopLeaderForRecovery(input) {
          stops.push({
            epoch: input.groupRun.coordinatorEpoch,
            protocol: input.residentLaunchProtocol
          });
          return { stopped: true, evidence: { processGroupAbsent: true } };
        },
        async open(input) {
          const epoch = input.request.executionContext!.coordinatorEpoch!;
          openedEpochs.push(epoch);
          throw new Error("fixture crash after actual leader launch marker");
        }
      }
    });
    if (first instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(first);
    await first.initialize();
    expect(await first.recoverProject(state)).toBe(true);
    if (["paused", "retrying"].includes(state.status)) await first.resumeProject(state);
    await waitFor(() => state.lastError === "fixture crash after actual leader launch marker");
    expect(stops).toEqual([{ epoch: 1, protocol: "trusted-supervisor-v1" }]);
    expect(openedEpochs).toEqual([2]);
    const firstDatabase = (first as unknown as {
      database(): CollaborationStateDatabase;
    }).database();
    expect(firstDatabase.eventsAfter(state.id, 0, 10_000).filter((event) =>
      event.type === "group.leader.launch.started" &&
      event.groupRunId === groupRunId &&
      event.coordinatorEpoch === 2
    )).toHaveLength(1);
    await first.shutdown();

    const restartedStorage = new ProjectStorage(root, new EventHub());
    await restartedStorage.initialize();
    // The collaboration database is the recovery authority under test. Keep
    // the same public state object, as the compact fixture intentionally omits
    // unrelated current-Main persistence fields required by loadState().
    const restartedState = state;
    const second = new CollaborationRuntimeCoordinator({
      storage: restartedStorage,
      databasePath,
      serviceId: "leader-boundary-second",
      hostId: "host-test",
      gitFactory: (options) => happyGitFake(options, []),
      residentLauncher: {
        async stopLeaderForRecovery(input) {
          stops.push({
            epoch: input.groupRun.coordinatorEpoch,
            protocol: input.residentLaunchProtocol
          });
          throw new Error("fixture observed second leader stop fence");
        },
        async open(input) {
          openedEpochs.push(input.request.executionContext!.coordinatorEpoch!);
          throw new Error("a second leader must not open before stop proof");
        }
      }
    });
    if (second instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(second);
    await second.initialize();
    expect(await second.recoverProject(restartedState)).toBe(true);
    if (["paused", "retrying"].includes(restartedState.status)) await second.resumeProject(restartedState);
    await waitFor(() => stops.length === 2);
    expect(stops).toEqual([
      { epoch: 1, protocol: "trusted-supervisor-v1" },
      { epoch: 2, protocol: "trusted-supervisor-v1" }
    ]);
    expect(openedEpochs).toEqual([2]);
    await second.shutdown();
  }, 10_000);

  it("stop-confirms a lost leader and reopens full management authority at a fresh epoch", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-collaboration-leader-restart-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_77777777777777777777777777777777");
    state.git = {
      enabled: true,
      status: "ready",
      provider: "github",
      repository: {
        owner: "fixture-owner",
        name: "leader-restart",
        htmlUrl: "https://github.example/leader-restart",
        private: true,
        defaultBranch: "main",
        localPath: path.join(root, "repository")
      }
    };
    state.orchestration = {
      ...state.orchestration,
      collaborations: [{
        id: "restart-team",
        displayName: "Restart team",
        memberAgentIds: ["idea", "execution"],
        renamePolicy: "editable"
      }],
      input: { source: "input", target: "restart-team" },
      routes: { ...state.orchestration.routes, "restart-team": [{ target: "finish", kind: "strong" }] }
    };
    await storage.createProject(state);
    const databasePath = path.join(root, "collaboration.sqlite");
    const seed = CollaborationStateDatabase.open({
      databasePath,
      serviceId: "seed-service",
      instanceId: "seed-instance",
      hostId: "host-test",
      topology: "single-host"
    });
    seed.createProject({
      projectId: state.id,
      workflowRevision: 1,
      workflowSnapshot: state.orchestration,
      git: state.git,
      workerCapacity: 2,
      managementCapacity: 1
    });
    const repository = repositoryFact("leader-restart");
    seed.prepareOperation(state.id, {
      id: "operation-repository-leader-restart",
      kind: "repository.create",
      payloadHash: "repository-leader-restart",
      status: "prepared"
    });
    seed.transitionOperation(state.id, {
      id: "operation-repository-leader-restart",
      payloadHash: "repository-leader-restart",
      status: "observed",
      remoteFact: repository
    });
    seed.transitionOperation(state.id, {
      id: "operation-repository-leader-restart",
      payloadHash: "repository-leader-restart",
      status: "finalized",
      remoteFact: repository
    });
    seed.activateGroup({
      projectId: state.id,
      nodeRunId: "node-run-leader-restart",
      groupRunId: "group-run-leader-restart",
      nodeId: "restart-team",
      groupId: "restart-team",
      activationRequestId: "activate-leader-restart",
      inputSnapshotRef: `project:${state.id}:requirement`,
      memberAgentIds: ["idea", "execution"],
      origin: { kind: "project-input" },
      baseCommit: "a".repeat(40),
      groupBranch: "groups/group-run-leader-restart",
      workflowRevision: 1
    });
    seed.relinquishWriterLease();
    seed.close();

    let stoppedEpoch = 0;
    const openedEpochs: number[] = [];
    let leaderTurn = 0;
    const coordinator = new CollaborationRuntimeCoordinator({
      storage,
      databasePath,
      serviceId: "restart-service",
      hostId: "host-test",
      gitFactory: (options) => happyGitFake(options, []),
      residentLauncher: {
        async stopLeaderForRecovery(input) {
          stoppedEpoch = input.groupRun.coordinatorEpoch;
          return {
            stopped: true,
            evidence: { processGroupAbsent: true }
          };
        },
        async open(input) {
          const context = input.request.executionContext!;
          if (context.role === "leader") openedEpochs.push(context.coordinatorEpoch!);
          return {
            async submit(turn) {
              if (context.role !== "leader") return agentFixtureDelivery(input, turn, { handoff: "recovered delivery" }, coordinator);
              leaderTurn += 1;
              const action: ControlAction = leaderTurn === 1 ? {
                tool: "assign_group_tasks",
                groupRunId: context.groupRunId!,
                coordinatorEpoch: context.coordinatorEpoch!,
                tasks: [{ taskId: "task-after-restart", assignment: "Deliver after restart", assigneeAgentId: "idea" }]
              } : leaderTurn === 2 ? {
                tool: "request_group_integration",
                groupRunId: context.groupRunId!,
                coordinatorEpoch: context.coordinatorEpoch!,
                integrationOwnerAgentId: "execution"
              } : {
                tool: "complete_group",
                groupRunId: context.groupRunId!,
                coordinatorEpoch: context.coordinatorEpoch!,
                output: "Recovered leader result"
              };
              return agentFixtureLeaderResult(input, turn, {
                handoff: "recovered leader action",
                controlActions: [{
                  projectId: state.id,
                  agent: input.request.agent,
                  invocationId: turn.invocationId,
                  callId: `call-${turn.invocationId}`,
                  stateVersion: 1,
                  capabilityHash: "fixture-capability",
                  receivedAt: new Date().toISOString(),
                  action
                }]
              });
            },
            async pause() {},
            async resume() {},
            async close() {}
          };
        }
      }
    });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    try {
      expect(await coordinator.recoverProject(state)).toBe(true);
      if (["paused", "retrying"].includes(state.status)) await coordinator.resumeProject(state);
      await waitFor(() => state.status === "completed");

      expect(stoppedEpoch).toBe(1);
      expect(openedEpochs).toEqual([2]);
      expect(state.groupRuns?.[0]).toMatchObject({
        coordinatorEpoch: 2,
        status: "completed",
        output: "Recovered leader result"
      });
    } finally { await coordinator.shutdown(); }
  });

  it("does not recover a frozen Main from self-authored expected facts", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-collaboration-main-freeze-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = projectState("prj_66666666666666666666666666666666");
    state.orchestration = {
      ...state.orchestration,
      collaborations: [{
        id: "main-led-team",
        displayName: "Main led team",
        memberAgentIds: ["idea", "execution"],
        renamePolicy: "editable"
      }],
      input: { source: "input", target: "main-led-team" },
      routes: { ...state.orchestration.routes, "main-led-team": [{ target: "finish", kind: "strong" }] }
    };
    await storage.createProject(state);
    const order: string[] = [];
    let observations = 0;
    const coordinator = new CollaborationRuntimeCoordinator({
      storage,
      serviceId: "main-freeze-test",
      hostId: "host-test",
      leaseDurationMs: 5_000,
      gitFactory: (options) => happyGitFake(options, order),
      residentLauncher: {
        async open(input) {
          return {
            async submit() {
              if (input.request.executionContext?.role === "leader") {
                throw new Error("fixture Main crash");
              }
              return { handoff: "delivery" };
            },
            async pause() {},
            async resume() {},
            async close() {}
          };
        },
        async observeMainRecovery() {
          observations += 1;
          return { stopped: false, evidence: {} };
        }
      }
    });
    if (coordinator instanceof CollaborationRuntimeCoordinator) liveCoordinators.push(coordinator);
    await coordinator.initialize();
    await coordinator.createProject(state, { enabled: true, provider: "github" });
    await waitFor(() => state.collaboration?.frozen === true && state.status === "retrying");

    await coordinator.resumeProject(state);
    expect(observations).toBe(1);
    expect(state.status).toBe(hasUserWorkflowPause(state) ? "paused" : "retrying");
    expect(state.phase).toBe("collaboration:main-recovery-retryable");
    expect(state.collaboration?.frozen).toBe(true);
    await coordinator.shutdown();
  });
});

function initializationFake(
  options: CollaborationGitFactoryOptions,
  calls: Array<{ operationId: string; attempt: number; repositoryName: string }>
): CollaborationGitRuntime {
  return {
    async initialize(request): Promise<GitInitializationResult> {
      calls.push({
        operationId: request.operationId,
        attempt: request.attempt,
        repositoryName: request.repositoryName
      });
      const ready = request.attempt > 1;
      const state: ProjectGitState = {
        enabled: true,
        status: ready ? "ready" : "waiting_for_github",
        provider: "github",
        ...(ready ? {
          repository: {
            owner: "fixture-owner",
            name: request.repositoryName,
            htmlUrl: `https://github.example/${request.repositoryName}`,
            private: true,
            defaultBranch: "main",
            localPath: path.join(options.projectRoot, "repository")
          }
        } : {}),
        initialization: {
          operationId: request.operationId,
          attempt: request.attempt,
          completedSteps: ready ? ["github.authorized", "remote.main.observed"] : [],
          ...(!ready ? { error: "GITHUB_AUTHORIZATION_REQUIRED: fixture" } : {})
        }
      };
      await options.operationStore.checkpointInitialization({
        projectId: request.projectId,
        operationId: request.operationId,
        attempt: request.attempt,
        state
      });
      return {
        state,
        ...(ready ? {
          repository: {
            provider: "github",
            providerId: 1,
            owner: "fixture-owner",
            name: request.repositoryName,
            htmlUrl: `https://github.example/${request.repositoryName}`,
            cloneUrl: `https://github.example/${request.repositoryName}.git`,
            private: true,
            defaultBranch: "main",
            observedAt: new Date().toISOString()
          },
          localRepository: {
            projectId: request.projectId,
            repositoryPath: path.join(options.projectRoot, "repository"),
            branch: "main",
            head: "a".repeat(40),
            observedAt: new Date().toISOString()
          }
        } : {})
      };
    },
    sessionBegin: async () => { throw new Error("not used"); },
    checkpointAndPush: async () => { throw new Error("not used"); },
    createPullRequest: async () => { throw new Error("not used"); },
    observePullRequest: async () => { throw new Error("not used"); },
    mergePullRequest: async () => { throw new Error("not used"); },
    closePullRequest: async () => { throw new Error("not used"); }
  };
}

function projectState(id: string): ProjectState {
  const now = new Date().toISOString();
  const zero = {
    inputTokens: 0,
    cachedInputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    invocations: 0
  };
  const orchestration = cloneAgentOrchestrationTemplate();
  const operationId = `git-init-${id}`;
  return {
    id,
    title: "Unsafe / Title 🔬",
    requirement: "Produce a tested result.",
    status: "paused",
    phase: "git:initializing",
    createdAt: now,
    updatedAt: now,
    turn: 0,
    cycle: 1,
    eventSeq: 0,
    consecutiveFailures: 0,
    completionGeneration: 0,
    controlProtocol: "natural-language-tools-v1",
    runCounts: Object.fromEntries(orchestration.agents.map(({ name }) => [name, 0])),
    mainInvocationSeq: 0,
    agents: structuredClone(defaultAgentConfigs),
    orchestration,
    userInputs: [],
    tokenUsage: {
      ...zero,
      byAgent: Object.fromEntries(orchestration.agents.map(({ name }) => [name, { ...zero }]))
    },
    computeUsage: emptyProjectComputeUsage(),
    git: {
      enabled: true,
      status: "authorizing",
      provider: "github",
      initialization: { operationId, attempt: 1, completedSteps: [] }
    },
    workflowRevision: 1
  };
}

function padRuntimeProjectEventsPastLegacyWindow(
  databasePath: string,
  projectId: string,
  count = 100_001
): void {
  const raw = new DatabaseSync(databasePath);
  raw.exec("PRAGMA busy_timeout=5000");
  try {
    raw.exec("BEGIN IMMEDIATE");
    const head = raw.prepare(`
      SELECT next_event_seq FROM project_heads WHERE project_id = ?
    `).get(projectId) as { next_event_seq: number } | undefined;
    if (!head) throw new Error(`Missing project head ${projectId}`);
    const firstSeq = Number(head.next_event_seq);
    raw.prepare(`
      WITH RECURSIVE padding(offset) AS (
        VALUES(0)
        UNION ALL
        SELECT offset + 1 FROM padding WHERE offset + 1 < ?
      )
      INSERT INTO project_events(
        project_id, seq, event_id, workflow_revision, occurred_at,
        event_type, payload_json
      )
      SELECT ?, ? + offset, 'evt_runtime_exact_padding_' || (? + offset), 1,
        '2026-09-22T00:00:00.000Z', 'fixture.exact_query_padding', '{}'
      FROM padding
    `).run(count, projectId, firstSeq, firstSeq);
    raw.prepare(`
      UPDATE project_heads SET next_event_seq = ? WHERE project_id = ?
    `).run(firstSeq + count, projectId);
    raw.exec("COMMIT");
  } catch (error) {
    try {
      raw.exec("ROLLBACK");
    } catch {
      // Preserve the original fixture failure.
    }
    throw error;
  } finally {
    raw.close();
  }
}

function happyGitFake(
  options: CollaborationGitFactoryOptions,
  order: string[],
  merge = true,
  conflictOnce: boolean | ((execution: {
    id: string;
    purpose: "delivery" | "final-integration";
    executionBranch: string;
    groupRunId?: string;
  }) => boolean) = false,
  committedManagementContents?: string[]
): CollaborationGitRuntime {
  let pullNumber = 0;
  const pulls = new Map<number, GitHubPullRequestFact>();
  const conflicts = new Set<string>();
  const managementEntries = new Map<string, string>();
  const managementOperations = new Map<string, {
    branch: "management/memory";
    commitSha: string;
    provenance: string;
    entries: Array<{ agentId: string; path: string; content: string }>;
    observedAt: string;
  }>();
  let managementSequence = 0;
  return {
    async initialize(request) {
      const state: ProjectGitState = {
        enabled: true,
        status: "ready",
        provider: "github",
        repository: {
          owner: "fixture-owner",
          name: request.repositoryName,
          htmlUrl: `https://github.example/${request.repositoryName}`,
          private: true,
          defaultBranch: "main",
          localPath: path.join(options.projectRoot, "repository")
        },
        initialization: {
          operationId: request.operationId,
          attempt: request.attempt,
          completedSteps: ["github.authorized", "remote.main.observed"]
        }
      };
      await options.operationStore.checkpointInitialization({
        projectId: request.projectId,
        operationId: request.operationId,
        attempt: request.attempt,
        state
      });
      return {
        state,
        repository: repositoryFact(request.repositoryName),
        localRepository: {
          projectId: request.projectId,
          repositoryPath: path.join(options.projectRoot, "repository"),
          branch: "main",
          head: "a".repeat(40),
          observedAt: new Date().toISOString()
        }
      };
    },
    async beginGroup(request) {
      order.push(`group:${request.groupRunId}`);
      return {
        group: {
          groupRunId: request.groupRunId,
          branch: `groups/${request.groupRunId}`,
          baseCommit: request.baseCommit
        },
        remote: {
          owner: request.repository.owner,
          repository: request.repository.name,
          ref: `groups/${request.groupRunId}`,
          status: "present" as const,
          sha: request.baseCommit,
          observedAt: new Date().toISOString()
        }
      };
    },
    async sessionBegin(execution) {
      await fs.mkdir(execution.worktreePath, { recursive: true });
      order.push(`worktree:${execution.agentId}`);
      return {
        projectId: path.basename(options.projectRoot),
        executionId: execution.id,
        ownershipEpoch: execution.ownershipEpoch,
        branch: execution.executionBranch,
        worktreePath: execution.worktreePath,
        head: "a".repeat(40),
        retained: true,
        observedAt: new Date().toISOString()
      };
    },
    async observeRetainedExecution(execution) {
      return {
        projectId: path.basename(options.projectRoot),
        executionId: execution.id,
        ownershipEpoch: execution.ownershipEpoch,
        branch: execution.executionBranch,
        worktreePath: execution.worktreePath,
        head: "a".repeat(40),
        retained: true,
        observedAt: new Date().toISOString()
      };
    },
    async observeExecutionCommit(execution) {
      const sha = execution.agentId === "idea" ? "b".repeat(40) : "c".repeat(40);
      return {
        projectId: path.basename(options.projectRoot),
        executionId: execution.id,
        ownershipEpoch: execution.ownershipEpoch,
        branch: execution.executionBranch,
        worktreePath: execution.worktreePath,
        head: sha,
        commitSha: sha,
        changed: true,
        retained: true,
        observedAt: new Date().toISOString()
      };
    },
    async observeExecutionWorktree(execution) {
      return { projectId: path.basename(options.projectRoot), executionId: execution.id,
        ownershipEpoch: execution.ownershipEpoch, branch: execution.executionBranch,
        worktreePath: execution.worktreePath, head: execution.agentId === "idea" ? "b".repeat(40) : "c".repeat(40),
        retained: true, observedAt: new Date().toISOString(), pendingPaths: [] };
    },
    async managementMemorySnapshot() {
      const snapshot = [...managementOperations.values()].at(-1);
      if (!snapshot) throw new Error("Required Git ref is missing: refs/heads/management/memory");
      const cloned = structuredClone(snapshot);
      cloned.entries.push({
        agentId: "external-writer",
        path: "agent-memory/external-writer/Memory.md",
        content: [
          "token=fixture-external-secret",
          "-----BEGIN PRIVATE KEY-----",
          "fixture-external-private-material",
          "-----END PRIVATE KEY-----",
          "x".repeat(50_000)
        ].join("\n")
      });
      return cloned;
    },
    async commitManagementMemory(agentId, operationId, content) {
      const replay = managementOperations.get(operationId);
      if (replay) return structuredClone(replay);
      managementEntries.set(agentId, content);
      committedManagementContents?.push(content);
      managementSequence += 1;
      const commitSha = managementSequence.toString(16).padStart(40, "0");
      const snapshot = {
        branch: "management/memory" as const,
        commitSha,
        provenance: `OpenFARS management memory snapshot from management/memory@${commitSha}`,
        entries: [...managementEntries.entries()].sort(([left], [right]) =>
          left.localeCompare(right)).map(([entryAgentId, entryContent]) => ({
            agentId: entryAgentId,
            path: `agent-memory/${entryAgentId}/Memory.md`,
            content: entryContent
          })),
        observedAt: new Date().toISOString()
      };
      managementOperations.set(operationId, snapshot);
      order.push(`management-memory:${agentId}`);
      return structuredClone(snapshot);
    },
    async releaseFinalIntegrationWorktree(execution) {
      order.push(`release-group:${execution.groupRunId}`);
      return "a".repeat(40);
    },
    async releaseFailedFinalIntegrationWorktree(execution) {
      order.push(`release-failed-group:${execution.groupRunId}`);
      return "a".repeat(40);
    },
    async checkpointAndPush(request) {
      order.push(`push-${request.checkpointKind}:${request.execution.agentId}`);
      const sha = request.checkpointKind === "conflict-resolution"
        ? "e".repeat(40)
        : request.execution.agentId === "idea" ? "b".repeat(40) : "c".repeat(40);
      return {
        checkpoint: {
          projectId: path.basename(options.projectRoot),
          executionId: request.execution.id,
          ownershipEpoch: request.execution.ownershipEpoch,
          branch: request.execution.executionBranch,
          worktreePath: request.execution.worktreePath,
          head: sha,
          retained: true,
          observedAt: new Date().toISOString(),
          commitSha: sha,
          changed: true
        },
        remote: {
          owner: "fixture-owner",
          repository: request.repository.name,
          ref: request.execution.executionBranch,
          sha,
          status: "present",
          observedAt: new Date().toISOString()
        }
      };
    },
    async createPullRequest(request) {
      const retained = [...pulls.values()].find((pull) => pull.ownerExecutionId === request.execution.id &&
        pull.head === request.execution.executionBranch && pull.base === request.base &&
        !["merged", "closed"].includes(pull.status));
      const number = retained?.providerNumber ?? ++pullNumber;
      const fact = { ...pullFact(number, request.execution.id, request.execution.executionBranch,
        request.base, request.expectedHead, "open"), repository: request.repository.name };
      pulls.set(number, fact);
      order.push(`pr:${request.execution.agentId}`);
      return fact;
    },
    async observePullRequestForExecution(request) {
      return [...pulls.values()].find((pull) => pull.ownerExecutionId === request.execution.id &&
        pull.head === request.execution.executionBranch && pull.base === request.expectedBase);
    },
    async refreshRecoveryBase(repository, _execution, _epoch, ref) {
      return { owner: repository.owner, repository: repository.name, ref, status: "present", sha: "d".repeat(40),
        observedAt: new Date().toISOString() };
    },
    async observePullRequest(request) {
      const fact = pulls.get(request.providerNumber);
      if (!fact) throw new Error("fixture pull missing");
      return fact;
    },
    async mergePullRequest(request) {
      const prior = pulls.get(request.providerNumber);
      if (!prior) throw new Error("fixture pull missing");
      const shouldConflict = typeof conflictOnce === "function"
        ? conflictOnce(request.execution)
        : conflictOnce;
      const conflictsNow = shouldConflict && !conflicts.has(request.execution.id);
      if (conflictsNow) conflicts.add(request.execution.id);
      const merged = {
        ...prior,
        headSha: request.expectedHead,
        status: conflictsNow ? "conflicted" as const : merge ? "merged" as const : "open" as const,
        ...(!conflictsNow && merge ? { mergeCommitSha: "d".repeat(40) } : {}),
        ...(!conflictsNow && merge ? {
          localSynchronization: {
            projectId: path.basename(options.projectRoot),
            operationId: request.operationId,
            targetBranch: request.expectedBase as "main" | `groups/${string}`,
            temporaryRef: `refs/openfars/reconciled/${request.operationId}`,
            expectedSourceHead: request.expectedHead,
            mergeCommitSha: "d".repeat(40),
            remoteHead: "d".repeat(40),
            localHeadBefore: "a".repeat(40),
            localHeadAfter: "d".repeat(40),
            status: "synchronized" as const,
            observedAt: new Date().toISOString()
          }
        } : {}),
        observedAt: new Date().toISOString()
      };
      pulls.set(request.providerNumber, merged);
      order.push(`merge:${request.execution.agentId}`);
      if (request.execution.groupRunId) {
        order.push(`merge-group:${request.execution.groupRunId}:${request.execution.purpose}`);
      }
      return merged;
    },
    async reconcileMergedPullRequest(request) {
      const prior = pulls.get(request.providerNumber);
      if (!prior || prior.status !== "merged" || prior.headSha !== request.expectedHead ||
        prior.base !== request.expectedBase || !prior.mergeCommitSha) {
        throw new Error("fixture merged pull is not exact");
      }
      return {
        ...prior,
        localSynchronization: {
          projectId: path.basename(options.projectRoot),
          operationId: request.operationId,
          targetBranch: request.expectedBase as "main" | `groups/${string}`,
          temporaryRef: `refs/openfars/reconciled/${request.operationId}`,
          expectedSourceHead: request.expectedHead,
          mergeCommitSha: prior.mergeCommitSha,
          remoteHead: prior.mergeCommitSha,
          localHeadBefore: "a".repeat(40),
          localHeadAfter: prior.mergeCommitSha,
          status: "synchronized" as const,
          observedAt: new Date().toISOString()
        }
      };
    },
    async prepareConflictResolution(execution) {
      order.push(`prepare-conflict:${execution.agentId}`);
      return {
        projectId: path.basename(options.projectRoot),
        executionId: execution.id,
        executionBranch: execution.executionBranch,
        sourceBranch: "main",
        sourceHead: "a".repeat(40),
        status: "conflicted" as const,
        conflictPaths: ["conflicted.txt"],
        observedAt: new Date().toISOString()
      };
    },
    async closePullRequest(request) {
      const prior = pulls.get(request.providerNumber);
      if (!prior) throw new Error("fixture pull missing");
      const closed = {
        ...prior,
        status: "closed" as const,
        observedAt: new Date().toISOString()
      };
      pulls.set(request.providerNumber, closed);
      order.push(`close-pr:${request.execution.agentId}`);
      return closed;
    }
  };
}

function controlEnvelope(
  projectId: string,
  agent: string,
  invocationId: string,
  action: ControlAction
) {
  return {
    projectId,
    agent,
    invocationId,
    callId: `call-${invocationId}`,
    stateVersion: 1,
    receivedAt: new Date().toISOString(),
    action
  };
}

function repositoryFact(name: string) {
  return {
    provider: "github" as const,
    providerId: 1,
    owner: "fixture-owner",
    name,
    htmlUrl: `https://github.example/${name}`,
    cloneUrl: `https://github.example/${name}.git`,
    private: true as const,
    defaultBranch: "main" as const,
    observedAt: new Date().toISOString()
  };
}

function pullFact(
  providerNumber: number,
  executionId: string,
  head: string,
  base: string,
  headSha: string,
  status: GitHubPullRequestFact["status"]
): GitHubPullRequestFact {
  return {
    id: `pull-${providerNumber}`,
    providerNumber,
    owner: "fixture-owner",
    repository: "fixture",
    htmlUrl: `https://github.example/pulls/${providerNumber}`,
    head,
    headSha,
    base,
    ownerExecutionId: executionId,
    status,
    mergeable: true,
    checks: [],
    observedAt: new Date().toISOString()
  };
}

async function gitCommand(cwd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile("git", args, { cwd, encoding: "utf8" }, (error, stdout, stderr) => {
      if (error) reject(new Error(stderr || error.message));
      else resolve(stdout.trim());
    });
  });
}

async function waitFor(predicate: () => boolean, timeoutMs = 5_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error("Timed out waiting for collaboration runtime");
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
}

function blockingResident(
  signal: AbortSignal
): Awaited<ReturnType<CollaborationResidentLauncher["open"]>> {
  return {
    async submit() {
      return new Promise<never>((_resolve, reject) => {
        const aborted = () => reject(new Error("fixture resident stopped"));
        if (signal.aborted) {
          aborted();
          return;
        }
        signal.addEventListener("abort", aborted, { once: true });
      });
    },
    async pause() {},
    async resume() {},
    async close() {}
  };
}

async function groupActivationOriginEvent(
  storage: ProjectStorage,
  projectId: string,
  nodeId: string
): Promise<Record<string, unknown> | undefined> {
  const event = (await storage.readEvents(projectId, 0, 10_000)).find((entry) =>
    entry.nodeId === nodeId && entry.data?.sourceType === "group.activated"
  );
  return event?.data?.origin as Record<string, unknown> | undefined;
}
