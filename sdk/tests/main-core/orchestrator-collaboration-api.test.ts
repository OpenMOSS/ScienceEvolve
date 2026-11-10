import { afterEach, describe, expect, it, vi } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { EventHub } from "../../src/core/event-hub.js";
import { Orchestrator } from "../../src/core/orchestrator.js";
import { SkillCatalog } from "../../src/core/skill-catalog.js";
import { ProjectStorage } from "../../src/core/storage.js";
import { defaultDecisionPlan } from "../../src/core/agent-orchestration.js";
import type { CollaborationRuntimeLifecycle } from "../../src/core/collaboration-runtime.js";
import type {
  AgentRunner,
  CollaborationRuntimeUserInteractionLifecycle,
  ProjectState
} from "../../src/core/types.js";
import { harnessCatalogRegistry, toPublicHarnessDescriptor } from "../../src/core/harness-runtime/registry.js";
import type { GitHubAccountStore } from "../../src/core/github-accounts.js";

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true })));
});

type FakeLifecycle = CollaborationRuntimeLifecycle & CollaborationRuntimeUserInteractionLifecycle;

class LegacyRunnerSpy implements AgentRunner {
  readonly calls: unknown[] = [];

  async harnessCatalog() {
    return harnessCatalogRegistry.list().map((descriptor) =>
      toPublicHarnessDescriptor(descriptor, { available: true })
    );
  }

  async run(request: Parameters<AgentRunner["run"]>[0]): Promise<never> {
    this.calls.push(request);
    throw new Error("Git collaboration reached the legacy runner");
  }
}

async function fixture(
  initializeState: (state: ProjectState) => void,
  handlers: Pick<FakeLifecycle, "addProjectUserInput" | "respondToUserIntervention">,
  options: {
    githubAccounts?: GitHubAccountStore;
    git?: {
      enabled: true;
      provider?: "github";
      accountId?: string;
      repositoryName?: string;
      repositoryVisibility?: "private" | "public";
    };
  } = {}
) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-git-api-"));
  temporaryRoots.push(root);
  const runner = new LegacyRunnerSpy();
  const lifecycle: FakeLifecycle = {
    initialize: vi.fn(async () => undefined),
    recoverProject: vi.fn(async () => true),
    createProject: vi.fn(async (state) => initializeState(state)),
    assertWorkflowRevisionEditable: vi.fn(),
    saveWorkflowRevision: vi.fn(async (state) => state.workflowRevision ?? 1),
    retryInitialization: vi.fn(async () => undefined),
    pauseProject: vi.fn(async () => undefined),
    resumeProject: vi.fn(async () => undefined),
    cancelProject: vi.fn(async () => undefined),
    shutdown: vi.fn(async () => undefined),
    ...handlers
  };
  const orchestrator = new Orchestrator(
    new ProjectStorage(root, new EventHub()),
    new SkillCatalog([]),
    runner,
    { retryBaseMs: 1, retryMaxMs: 1 },
    undefined,
    lifecycle,
    options.githubAccounts
  );
  await orchestrator.initialize();
  const project = await orchestrator.createProject({
    title: "Git API delegation",
    requirement: "Keep Git collaboration off the legacy loop.",
    git: options.git ?? { enabled: true },
    agents: { main: { model: "test-model", skills: [], autoSkills: [] } },
    orchestration: {
      agents: [{ name: "main", template: "main" }],
      input: { source: "input", target: "main" },
      routes: { main: [] },
      decisionPlans: { main: defaultDecisionPlan("main") },
      allowUserIntervention: true,
      termination: {
        agent: "main",
        condition: "The requested result is complete.",
        decisionBy: "main",
        automatic: false
      },
      resultFormat: { presets: [], custom: "" }
    }
  });
  return { lifecycle, orchestrator, project, runner };
}

describe("Git collaboration public API delegation", () => {
  it("includes project-owned parallel calls in the overview queue without entering the shared scheduler", async () => {
    const f = await fixture(() => undefined, { addProjectUserInput: vi.fn(), respondToUserIntervention: vi.fn() });
    f.lifecycle.queueReadModel = vi.fn(state => ({
      state: { ...state, status: "running", runtime: { stateRevision: 1, status: "running", phase: "collaboration:running", executionCount: 2,
        activities: ["alice", "bob"].map(agentId => ({ activityId: agentId, projectId: state.id, kind: "resident", phase: "resident:running",
          invocationId: agentId, agentId, nodeRunId: "node", executionId: `exec-${agentId}`, writerLeaseEpoch: 1, leaseState: "current", startedAt: state.updatedAt })) } },
      capacities: { main: 1, worker: 2 }, occupied: { main: 0, worker: 2 }
    }));
    try {
      const queue = await f.orchestrator.getQueueSnapshot();
      expect(f.lifecycle.queueReadModel).toHaveBeenCalledWith(expect.objectContaining({ id: f.project.id }));
      expect(queue.worker.activeProjectIds).toEqual([f.project.id]);
      expect(queue.worker.activeTasks?.map(task => task.agentId)).toEqual(["alice", "bob"]);
      expect(queue.worker.pools).toContainEqual(expect.objectContaining({ scope: "project", projectId: f.project.id, capacity: 2 }));
      expect(f.runner.calls).toEqual([]);
    } finally { await f.orchestrator.shutdown(); }
  });

  it("creates new Git projects with scoped Agent-stable identities before entering the trusted coordinator", async () => {
    const f = await fixture(() => undefined, { addProjectUserInput: vi.fn(), respondToUserIntervention: vi.fn() });
    const state = f.lifecycle.createProject.mock.calls[0]?.[0];
    expect(state?.orchestration.schemaVersion).toBe(3);
    expect(state?.orchestration.scopedWorkflow).toEqual({ schemaVersion: 1, rootAgentIds: ["main"], groups: [] });
    expect(state?.agentSessionIds).toEqual({}); expect(f.runner.calls).toEqual([]);
    await f.orchestrator.shutdown();
  });
  it("pins the selected GitHub identity and requested repository name before runtime initialization", async () => {
    const accountId = "gha_11111111111111111111111111111111";
    const requireReady = vi.fn(async () => ({
      id: accountId,
      login: "alice",
      providerUserId: 7,
      avatarUrl: "https://avatars.githubusercontent.com/u/7?v=4",
      status: "ready" as const,
      scopes: ["repo"],
      isDefault: true,
      createdAt: "2026-09-24T00:00:00.000Z",
      updatedAt: "2026-09-24T00:00:00.000Z"
    }));
    const githubAccounts = { requireReady } as unknown as GitHubAccountStore;
    const { lifecycle, orchestrator, project } = await fixture(
      () => undefined,
      {
        addProjectUserInput: vi.fn(async () => undefined),
        respondToUserIntervention: vi.fn(async () => undefined)
      },
      {
        githubAccounts,
        git: {
          enabled: true,
          provider: "github",
          accountId,
          repositoryName: "selected-repository",
          repositoryVisibility: "public"
        }
      }
    );

    expect(requireReady).toHaveBeenCalledWith(accountId);
    expect(project.git).toMatchObject({
      enabled: true,
      requestedRepositoryName: "selected-repository",
      requestedRepositoryVisibility: "public",
      account: {
        id: accountId,
        login: "alice",
        providerUserId: 7
      }
    });
    expect(lifecycle.createProject).toHaveBeenCalledWith(
      expect.objectContaining({
        git: expect.objectContaining({ account: expect.objectContaining({ id: accountId }) })
      }),
      expect.objectContaining({
        accountId,
        repositoryName: "selected-repository",
        repositoryVisibility: "public"
      })
    );
    await orchestrator.shutdown();
  });

  it("delegates input for a running project without starting the legacy runner", async () => {
    const addProjectUserInput = vi.fn(async (state: ProjectState) => {
      state.phase = "collaboration:user-input-accepted";
    });
    const response = vi.fn(async () => undefined);
    const { lifecycle, orchestrator, project, runner } = await fixture(
      (state) => {
        state.git!.status = "ready";
        state.status = "running";
        state.phase = "collaboration:running";
      },
      { addProjectUserInput, respondToUserIntervention: response }
    );

    const updated = await orchestrator.addProjectUserInput(
      project.id,
      "  include the new evidence  ",
      "interrupt",
      "  request-1  "
    );

    expect(lifecycle.addProjectUserInput).toHaveBeenCalledWith(
      expect.objectContaining({ id: project.id, status: "running" }),
      { message: "include the new evidence", mode: "interrupt", requestId: "request-1" }
    );
    expect(updated.phase).toBe("collaboration:user-input-accepted");
    expect(runner.calls).toHaveLength(0);
    await orchestrator.shutdown();
  });

  it("delegates a user response without starting the legacy runner", async () => {
    const respondToUserIntervention = vi.fn(async (state: ProjectState, input: { message: string }) => {
      expect(state.userIntervention?.status).toBe("pending");
      state.userIntervention = {
        ...state.userIntervention!,
        status: "answered",
        response: input.message
      };
      state.status = "running";
      state.phase = "collaboration:running";
    });
    const { orchestrator, project, runner } = await fixture(
      (state) => {
        state.git!.status = "ready";
        state.status = "paused";
        state.phase = "user-intervention-required";
        state.userIntervention = {
          id: "question-1",
          status: "pending",
          requestedAt: new Date().toISOString(),
          message: "Choose a dataset",
          rationale: "The source is ambiguous",
          successCriteria: [],
          requestedBy: "main",
          requestedInvocationId: "inv-question",
          requestKind: "main"
        };
      },
      { addProjectUserInput: vi.fn(async () => undefined), respondToUserIntervention }
    );

    const updated = await orchestrator.respondToUserIntervention(project.id, "  use dataset A  ");

    expect(respondToUserIntervention).toHaveBeenCalledWith(
      expect.objectContaining({ id: project.id }),
      { message: "use dataset A" }
    );
    expect(updated.userIntervention).toMatchObject({ status: "answered", response: "use dataset A" });
    expect(runner.calls).toHaveLength(0);
    await orchestrator.shutdown();
  });

  it("delegates completed-project reopen atomically without starting the legacy runner", async () => {
    const addProjectUserInput = vi.fn(async (state: ProjectState) => {
      expect(state.status).toBe("completed");
      state.status = "queued";
      state.phase = "collaboration:reopened";
      state.completedAt = undefined;
      state.cycle += 1;
      state.completionGeneration += 1;
    });
    const { orchestrator, project, runner } = await fixture(
      (state) => {
        state.git!.status = "ready";
        state.status = "completed";
        state.phase = "completed";
        state.completedAt = new Date().toISOString();
      },
      { addProjectUserInput, respondToUserIntervention: vi.fn(async () => undefined) }
    );

    const reopened = await orchestrator.addProjectUserInput(project.id, "Continue with a new requirement.");

    expect(addProjectUserInput).toHaveBeenCalledOnce();
    expect(reopened).toMatchObject({
      status: "queued",
      phase: "collaboration:reopened",
      cycle: 2,
      completionGeneration: 1
    });
    expect(runner.calls).toHaveLength(0);
    await orchestrator.shutdown();
  });
});
