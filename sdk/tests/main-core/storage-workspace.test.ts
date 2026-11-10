import { afterEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import { execFile } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { zstdCompressSync } from "node:zlib";
import { EventHub } from "../../src/core/event-hub.js";
import { EventLogIndex } from "../../src/core/event-log-index.js";
import { ProjectFileBrowser } from "../../src/core/project-file-browser.js";
import { assertDshSessionArtifact, dshSessionArtifactPath } from "../../src/core/harness-runtime/adapters/dsh-adapter.js";
import {
  IncompatibleProjectStateError,
  ProjectStorage
} from "../../src/core/storage.js";
import { emptyProjectComputeUsage } from "../../src/core/inspire-compute-usage.js";
import { cloneAgentOrchestrationTemplate } from "../../src/core/agent-orchestration.js";
import type { ControlActionEnvelope, ProjectState } from "../../src/core/types.js";
import { mediaTypeFor } from "../../src/core/utils.js";
import { defaultAgentConfigs, normalizeAgentOrchestrationTemplate, normalizeNewGitOrchestration } from "../../src/core/validation.js";

const temporaryRoots: string[] = [];

async function git(cwd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile("git", args, { cwd, encoding: "utf8" }, (error, stdout, stderr) => {
      if (error) reject(new Error(stderr || error.message));
      else resolve(stdout.trim());
    });
  });
}

function minimalState(id: string): ProjectState {
  const zero = {
    inputTokens: 0,
    cachedInputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    invocations: 0
  };
  const now = new Date().toISOString();
  return {
    id,
    title: "Workspace artifact test",
    requirement: "Keep direct workspace artifacts visible.",
    status: "running",
    phase: "idea:running",
    createdAt: now,
    updatedAt: now,
    currentAgent: "idea",
    activeInvocationId: "inv_workspace_test",
    turn: 0,
    cycle: 1,
    eventSeq: 0,
    consecutiveFailures: 0,
    completionGeneration: 0,
    controlProtocol: "natural-language-tools-v1",
    runCounts: { idea: 0, main: 0, execution: 0, writing: 0, review: 0 },
    mainInvocationSeq: 0,
    agents: structuredClone(defaultAgentConfigs),
    orchestration: cloneAgentOrchestrationTemplate(),
    userInputs: [],
    tokenUsage: {
      ...zero,
      byAgent: {
        idea: { ...zero },
        main: { ...zero },
        execution: { ...zero },
        writing: { ...zero },
        review: { ...zero }
      }
    },
    computeUsage: emptyProjectComputeUsage()
  };
}

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((root) =>
      fs.rm(root, { recursive: true, force: true })
    )
  );
});

describe("ProjectStorage project workspace", () => {
  it("shares concurrent artifact catalog scans without caching stale completed reads", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-artifact-read-")); temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    const state = minimalState("prj_11111111111111111111111111111111");
    const load = vi.spyOn(storage, "loadState").mockResolvedValue(state);
    let complete!: (value: []) => void;
    const catalog = vi.spyOn(ProjectFileBrowser.prototype, "catalog")
      .mockImplementationOnce(() => new Promise(resolve => { complete = resolve; })).mockResolvedValue([]);
    try {
      const summary = storage.listArtifactSummary(state.id, { scope: "project" });
      const page = storage.listArtifactPage(state.id, { scope: "project" });
      await vi.waitFor(() => expect(catalog).toHaveBeenCalledTimes(1));
      complete([]);
      expect((await summary).total).toBe(0);
      expect((await page).artifacts).toEqual([]);
      await storage.listArtifactSummary(state.id, { scope: "project" });
      expect(catalog).toHaveBeenCalledTimes(2);
    } finally { load.mockRestore(); catalog.mockRestore(); }
  });

  it("preserves an explicitly mapped original project directory and exact native history after relocation", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-storage-directory-alias-")); temporaryRoots.push(root);
    const originalData = path.join(root, "original-data");
    const relocatedData = path.join(root, "relocated-data");
    const state = minimalState("prj_99999999999999999999999999999999");
    state.status = "paused";
    state.agentSessions = { main: { schemaVersion: 1, harnessId: "dsh", adapterVersion: "1", generation: 0,
      nativeId: "original-native-history", durable: true, createdAt: "2026-09-30T00:00:00.000Z" } };
    const original = new ProjectStorage(originalData, new EventHub());
    await original.createProject(state);
    const originalProject = original.projectDir(state.id);
    const workspace = path.join(originalProject, "runtime", "retained-turn", "management-workspace-original-invocation");
    const home = path.join(originalProject, "runtime", "retained-turn", "dsh-home");
    const artifact = dshSessionArtifactPath(home, workspace, "original-native-history");
    const bytes = Buffer.concat([
      zstdCompressSync(Buffer.from(JSON.stringify({ type: "session", version: 1, createdAt: 1,
        id: "original-native-history", cwd: workspace }) + "\n")),
      zstdCompressSync(Buffer.from(JSON.stringify({ type: "message", content: "original decision" }) + "\n"))
    ]);
    await fs.mkdir(workspace, { recursive: true });
    await fs.mkdir(path.dirname(artifact), { recursive: true });
    await fs.writeFile(artifact, bytes);
    const stateBytes = await fs.readFile(path.join(originalProject, "state.json"));
    await fs.rename(originalData, relocatedData);
    // An ancestor alias emulates a deployment bind while the project leaf and
    // native session files remain real directories; no header is rewritten.
    await fs.symlink(relocatedData, originalData, "dir");
    const aliases = { [state.id]: originalProject };
    const storage = new ProjectStorage(relocatedData, new EventHub(), { projectDirectoryAliases: aliases });
    await storage.initialize();
    expect(storage.projectDir(state.id)).toBe(originalProject);
    expect(storage.projectDirectoryPaths(state.id)).toEqual([path.join(relocatedData, "projects", state.id), originalProject]);
    expect(await storage.loadState(state.id)).toMatchObject({ status: "paused", agentSessions: state.agentSessions });
    expect((await storage.listStates()).map(item => item.id)).toEqual([state.id]);
    const expectation = { artifactPath: artifact, expectedSessionId: "original-native-history", expectedWorkspacePath: workspace,
      sessionRoot: path.join(home, "sessions") };
    await expect(assertDshSessionArtifact(expectation))
      .resolves.toBeUndefined();
    await expect(assertDshSessionArtifact({ ...expectation,
      expectedWorkspacePath: workspace.replace(originalData, relocatedData) }))
      .rejects.toThrow(/different workspace/);
    const restarted = new ProjectStorage(relocatedData, new EventHub(), { projectDirectoryAliases: aliases });
    await restarted.initialize();
    expect(restarted.projectDir(state.id)).toBe(originalProject);
    expect(await fs.readFile(artifact)).toEqual(bytes);
    expect(await fs.readFile(path.join(originalProject, "state.json"))).toEqual(stateBytes);
    const unaffected = "prj_88888888888888888888888888888888";
    await restarted.createProject(minimalState(unaffected));
    expect(restarted.projectDir(unaffected)).toBe(path.join(relocatedData, "projects", unaffected));
  });

  it("refuses an explicit project alias to a different physical directory even when state and session IDs match", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-storage-directory-alias-invalid-")); temporaryRoots.push(root);
    const data = path.join(root, "data");
    const state = minimalState("prj_99999999999999999999999999999999");
    const source = new ProjectStorage(data, new EventHub());
    await source.createProject(state);
    const replacement = path.join(root, "other-projects", state.id);
    await fs.cp(source.projectDir(state.id), replacement, { recursive: true });
    const storage = new ProjectStorage(data, new EventHub(), { projectDirectoryAliases: { [state.id]: replacement } });
    await expect(storage.initialize()).rejects.toThrow(/same physical project directory/);
    expect(() => storage.projectDir(state.id)).toThrow(/not verified/);
    await expect(storage.loadState(state.id)).rejects.toThrow(/not verified/);
    expect(await source.loadState(state.id)).toMatchObject({ id: state.id });
  });

  it("refuses a project alias that changes after verification without falling back or replacing sessions", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-storage-directory-alias-swapped-")); temporaryRoots.push(root);
    const data = path.join(root, "data");
    const originalData = path.join(root, "original-data");
    const state = minimalState("prj_99999999999999999999999999999999");
    const source = new ProjectStorage(data, new EventHub());
    await source.createProject(state);
    await fs.symlink(data, originalData, "dir");
    const originalProject = path.join(originalData, "projects", state.id);
    const storage = new ProjectStorage(data, new EventHub(), { projectDirectoryAliases: { [state.id]: originalProject } });
    await storage.initialize();
    const replacement = path.join(root, "replacement");
    await fs.cp(data, replacement, { recursive: true });
    await fs.unlink(originalData);
    await fs.symlink(replacement, originalData, "dir");
    expect(() => storage.projectDir(state.id)).toThrow(/same physical project directory/);
    await expect(storage.loadState(state.id)).rejects.toThrow(/same physical project directory/);
    await expect(storage.initialize()).rejects.toThrow(/same physical project directory/);
    expect(() => storage.projectDir(state.id)).toThrow(/not verified/);
    expect(await source.loadState(state.id)).toMatchObject({ id: state.id });
  });

  it.each(["missing", "unregistered", "wrong-project-id", "symlink"] as const)
    ("refuses a %s mapped project before accessing any native history", async (invalid) => {
      const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-storage-directory-alias-registration-")); temporaryRoots.push(root);
      const data = path.join(root, "data");
      const state = minimalState("prj_99999999999999999999999999999999");
      const source = new ProjectStorage(data, new EventHub());
      await source.createProject(state);
      const originalData = path.join(root, "original-data");
      const originalProject = path.join(originalData, "projects", state.id);
      if (invalid === "symlink") {
        await fs.mkdir(path.dirname(originalProject), { recursive: true });
        await fs.symlink(source.projectDir(state.id), originalProject, "dir");
      } else if (invalid !== "missing") {
        await fs.symlink(data, originalData, "dir");
        const file = path.join(source.projectDir(state.id), "state.json");
        if (invalid === "unregistered") await fs.unlink(file);
        else await fs.writeFile(file, JSON.stringify({ ...state, id: "prj_88888888888888888888888888888888" }));
      }
      const storage = new ProjectStorage(data, new EventHub(), { projectDirectoryAliases: { [state.id]: originalProject } });
      await expect(storage.initialize()).rejects.toThrow();
      expect(() => storage.projectDir(state.id)).toThrow(/not verified/);
    });

  it.each([false, true])("reloads a v3 Git project with nested groups %s without replacing its sessions", async (nested) => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-storage-v3-")); temporaryRoots.push(root);
    const state = minimalState("prj_77777777777777777777777777777777");
    state.git = { enabled: true, status: "ready" };
    state.orchestration = normalizeNewGitOrchestration(state.orchestration);
    if (nested) {
      const strong = (target: string) => [{ target, kind: "strong" as const }];
      state.orchestration = normalizeAgentOrchestrationTemplate({ ...state.orchestration,
        input: { source: "input", target: "main" },
        collaborations: ["G", "H"].map(id => ({ id, displayName: id, memberAgentIds: ["idea", "execution"], renamePolicy: "editable" })),
        scopedWorkflow: { schemaVersion: 1, rootAgentIds: ["main", "writing", "review"], groups: [
          { id: "G", leaderAgentId: "main", allowLeaderReconfiguration: true,
            workflow: { nodes: [{ kind: "collaboration", nodeId: "child_h", groupId: "H" }],
              input: { source: "input", edges: [{ target: "child_h", kind: "parallel" }] }, routes: { child_h: strong("finish") } } },
          { id: "H", parentGroupId: "G", leaderAgentId: "main", allowLeaderReconfiguration: false,
            workflow: { nodes: [{ kind: "agent", nodeId: "idea_in", agentId: "idea" }, { kind: "agent", nodeId: "execution_in", agentId: "execution" }],
              input: { source: "input", edges: [{ target: "idea_in", kind: "parallel" }] },
              routes: { idea_in: strong("execution_in"), execution_in: strong("finish") } } }
        ] },
        routes: { main: [{ target: "writing", kind: "weak" }, { target: "G", kind: "weak" }, { target: "review", kind: "weak" }],
          writing: strong("G"), G: strong("review"), review: strong("finish") },
        decisionPlans: { main: "start", writing: "contract", G: "nested work", review: "verify" }
      });
    }
    state.agentSessions = { idea: { schemaVersion: 1, harnessId: "codex", adapterVersion: "4", generation: 0,
      nativeId: "stable-idea-session", durable: true, createdAt: "2026-09-30T00:00:00.000Z" } };
    await new ProjectStorage(root, new EventHub()).createProject(state);
    const reloaded = new ProjectStorage(root, new EventHub());
    expect(await reloaded.loadState(state.id)).toMatchObject({ id: state.id, orchestration: state.orchestration, agentSessions: state.agentSessions });
    expect((await reloaded.listStates()).map(item => item.id)).toEqual([state.id]);
  });

  it("reloads a v3 Agent shared by root and two groups with its original session", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-storage-shared-v3-")); temporaryRoots.push(root);
    const state = minimalState("prj_77777777777777777777777777777777");
    state.git = { enabled: true, status: "ready" };
    const strong = (target: string) => [{ target, kind: "strong" as const }];
    state.orchestration = normalizeAgentOrchestrationTemplate({ ...normalizeNewGitOrchestration(state.orchestration),
      input: { source: "input", target: "main" },
      collaborations: ["G", "H"].map(id => ({ id, displayName: id, memberAgentIds: ["idea", "execution"], renamePolicy: "editable" })),
      scopedWorkflow: { schemaVersion: 1, rootAgentIds: ["main", "idea", "writing", "review"], groups: ["G", "H"].map(id => ({
        id, leaderAgentId: "main", allowLeaderReconfiguration: false,
        workflow: { nodes: [{ kind: "agent", nodeId: `${id}_idea`, agentId: "idea" }, { kind: "agent", nodeId: `${id}_execution`, agentId: "execution" }],
          input: { source: "input", edges: [{ target: `${id}_idea`, kind: "parallel" }] },
          routes: { [`${id}_idea`]: strong(`${id}_execution`), [`${id}_execution`]: strong("finish") } }
      })) },
      routes: { main: [], idea: strong("G"), G: strong("H"), H: strong("writing"), writing: strong("review"), review: strong("finish") },
      decisionPlans: { main: "start", idea: "shared methods", G: "observations", H: "models", writing: "combine", review: "verify" }
    });
    state.agentSessions = { idea: { schemaVersion: 1, harnessId: "codex", adapterVersion: "4", generation: 0,
      nativeId: "stable-shared-session", durable: true, createdAt: "2026-09-30T00:00:00.000Z" } };
    await new ProjectStorage(root, new EventHub()).createProject(state);
    const reloaded = new ProjectStorage(root, new EventHub());
    expect(await reloaded.loadState(state.id)).toMatchObject({ orchestration: state.orchestration, agentSessions: state.agentSessions });
    expect((await reloaded.listStates()).map(item => item.id)).toEqual([state.id]);
  });

  it("rejects malformed v3 topology and Git-off state on reload", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-storage-v3-invalid-")); temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    const state = minimalState("prj_66666666666666666666666666666666");
    state.orchestration = normalizeNewGitOrchestration(state.orchestration);
    await storage.createProject(state);
    await expect(storage.tryLoadState(state.id)).resolves.toBeUndefined();
    state.git = { enabled: true, status: "ready" };
    state.orchestration.scopedWorkflow!.rootAgentIds.push("unknown-agent");
    await storage.saveState(state);
    await expect(storage.tryLoadState(state.id)).resolves.toBeUndefined();
  });

  it("retains a deadline cancellation cause when rolling back an invocation commit", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "checkpoint-rollback-")); temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    const state = minimalState("prj_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    await storage.createProject(state);
    await storage.beginInvocationCommit(state, "inv_workspace_test");
    state.status = "cancelling";
    state.phase = "cancelling";
    state.cancelledBy = "deadline-monitor";
    state.cancelReason = "arm_timeout";
    state.cancellationRequestedAt = "2026-09-22T00:00:00.000Z";
    await storage.rollbackInvocationCommit(state, "inv_workspace_test");
    expect(await storage.loadState(state.id)).toMatchObject({ status: "cancelling", cancelledBy: "deadline-monitor", cancelReason: "arm_timeout", cancellationRequestedAt: "2026-09-22T00:00:00.000Z" });
  });

  it.each([false, true])("workflow continuity: retries the original failed storage journal while preserving user pause (%s)", async userPaused => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "workflow-storage-recovery-")); temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    const state = minimalState("prj_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    state.agentSessions = { idea: { schemaVersion: 1, harnessId: "codex", adapterVersion: "fixture",
      nativeId: "original-research-session", generation: 0, durable: true, createdAt: state.createdAt } };
    await storage.createProject(state);
    await storage.beginInvocationCommit(state, "inv_workspace_test");
    await expect(storage.retryFailedInvocationRecovery(state)).rejects.toThrow("has not reached its failed recovery boundary");
    expect(storage.hasActiveInvocationCommit(state.id)).toBe(true);
    state.turn = 99;
    state.requirement = "Incomplete write must be rolled back";
    await storage.saveState(state);
    storage.markInvocationRecoveryRequired(state.id, new Error("Temporary disk error during rollback"));
    if (userPaused) {
      state.status = "paused"; state.phase = "paused";
      state.pauseRequest = { requestedAt: state.createdAt, settledAt: state.updatedAt };
    } else {
      state.status = "retrying"; state.phase = "storage-recovery-required";
    }
    const pauseRequest = structuredClone(state.pauseRequest);
    expect(await storage.retryFailedInvocationRecovery(state)).toBe(true);
    expect(storage.hasActiveInvocationCommit(state.id)).toBe(false);
    expect(state).toMatchObject({ turn: 0, requirement: "Keep direct workspace artifacts visible.",
      activeInvocationId: "inv_workspace_test", agentSessions: { idea: { nativeId: "original-research-session" } } });
    if (userPaused) {
      expect(state).toMatchObject({ status: "paused", phase: "paused", pauseRequest });
      expect(await storage.loadState(state.id)).toMatchObject({ status: "paused", pauseRequest });
    }
    expect(await storage.retryFailedInvocationRecovery(state)).toBe(false);
  });

  it("persists task completion as requested, accepts it once handoff is saved, and reuses the record", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-task-completion-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    const state = minimalState("prj_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    await storage.createProject(state);
    const envelope: ControlActionEnvelope = {
      projectId: state.id,
      agent: "execution",
      invocationId: "inv_completion",
      callId: "finish-1",
      stateVersion: 0,
      receivedAt: "2026-10-01T00:00:00.000Z",
      action: {
        tool: "finish_task",
        summary: "The execution task is complete.",
        memory: "Keep the verified execution result available to the next task."
      }
    };

    const requested = await storage.requestTaskCompletion(state, "task-execution", envelope);
    expect(requested).toMatchObject({ taskId: "task-execution", status: "requested", agent: "execution" });
    expect(await storage.loadState(state.id)).toMatchObject({
      taskCompletions: { "task-execution": { status: "requested" } }
    });

    const handoffPath = await storage.writeHandoff(
      state,
      "execution",
      "inv_completion",
      "# Execution handoff\n\nVerified result."
    );
    const accepted = await storage.requestTaskCompletion(state, "task-execution", envelope);
    expect(accepted).toMatchObject({
      taskId: "task-execution",
      status: "accepted",
      handoffPath,
      memory: "Keep the verified execution result available to the next task."
    });
    expect(await storage.loadState(state.id)).toMatchObject({
      taskCompletions: { "task-execution": { status: "accepted", handoffPath } }
    });
    expect(await storage.writeHandoff(state, "execution", "inv_completion", "ignored duplicate"))
      .toBe(handoffPath);
    expect((await fs.readdir(path.join(storage.projectDir(state.id), "messages")))
      .filter((name) => name.endsWith("_handoff.md"))).toHaveLength(1);
  });

  it("records completion and recovery without changing the Agent's committed Memory", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-task-memory-")); temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    const state = minimalState("prj_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab");
    await storage.createProject(state);
    const worktree = path.join(storage.projectDir(state.id), "git-worktrees", "agents", "execution");
    await fs.mkdir(path.join(worktree, "agent-memory", "execution"), { recursive: true });
    await git(worktree, ["init", "--quiet"]);
    const memory = path.join(worktree, "agent-memory", "execution", "Memory.md");
    await fs.writeFile(memory, "# Existing verified facts\n");
    await git(worktree, ["add", "."]);
    await git(worktree, ["-c", "user.name=Test", "-c", "user.email=test@example.test", "commit", "--quiet", "-m", "Initial memory"]);
    const envelope: ControlActionEnvelope = { projectId: state.id, agent: "execution", invocationId: "inv_memory_first",
      callId: "finish-memory", stateVersion: 1, receivedAt: "2026-10-16T00:00:00.000Z",
      action: { tool: "finish_task", memory: "Selected an explicit research scope and recorded the missing inputs." } };
    const head = await git(worktree, ["rev-parse", "HEAD"]);
    const receipt = await storage.requestTaskCompletion(state, "task-first", envelope);
    expect(receipt).toMatchObject({ memory: "Selected an explicit research scope and recorded the missing inputs." });
    expect(receipt.memoryPath).toBeUndefined();
    await storage.requestTaskCompletion(state, "task-first", { ...envelope, invocationId: "inv_memory_resume" });
    expect(await git(worktree, ["status", "--porcelain"])).toBe("");
    await storage.requestTaskCompletion(state, "task-second", { ...envelope, invocationId: "inv_memory_second",
      action: { tool: "finish_task" } });
    expect(await git(worktree, ["status", "--porcelain"])).toBe("");
    expect(await git(worktree, ["rev-parse", "HEAD"])).toBe(head);
    expect(await fs.readFile(memory, "utf8")).toBe("# Existing verified facts\n");
    expect(state.taskCompletions?.["task-first"]).toEqual(receipt);
    expect(state.taskCompletions?.["task-second"]).toMatchObject({ status: "requested" });
  });

  it("records a Chinese manager's completion without writing a workspace Memory file", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-chinese-manager-memory-")); temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    const state = minimalState("prj_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaab"); await storage.createProject(state);
    const envelope: ControlActionEnvelope = { projectId: state.id, agent: "观测总师", invocationId: "inv_chinese_manager",
      callId: "finish-manager", stateVersion: 1, receivedAt: new Date().toISOString(),
      action: { tool: "finish_task", summary: "核对已合并交付", memory: "保留原任务及已确认的合并结果。" } };
    const receipt = await storage.requestTaskCompletion(state, "management:group:inv_chinese_manager", envelope);
    expect(receipt.agent).toBe("观测总师");
    expect(receipt.memory).toBe("保留原任务及已确认的合并结果。");
    expect(receipt.memoryPath).toBeUndefined();
    await expect(fs.access(path.join(storage.projectDir(state.id), "workspaces", "agent-memory", "观测总师", "Memory.md")))
      .rejects.toMatchObject({ code: "ENOENT" });
    expect(await storage.requestTaskCompletion(state, receipt.taskId, envelope)).toEqual(receipt);
    for (const invalid of ["../观测总师", "观测/总师", "观测\\总师"]) {
      await expect(storage.saveRoleMemorySnapshot(state.id, invalid, "unsafe")).rejects.toThrow("invalid or too large");
    }
  });

  it("records completion independently of an unavailable Memory target and rejects an explicit unsafe Memory write", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-task-completion-failure-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    const state = minimalState("prj_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
    await storage.createProject(state);
    const memoryDirectory = path.join(storage.projectDir(state.id), "workspaces", "agent-memory", "execution");
    await fs.mkdir(memoryDirectory, { recursive: true });
    await fs.symlink(path.join(root, "outside-memory.md"), path.join(memoryDirectory, "Memory.md"));
    const envelope: ControlActionEnvelope = {
      projectId: state.id,
      agent: "execution",
      invocationId: "inv_memory_failure",
      callId: "finish-failure",
      stateVersion: 0,
      receivedAt: new Date().toISOString(),
      action: { tool: "finish_task", memory: "Receipt content only." }
    };

    await expect(storage.requestTaskCompletion(state, "task-memory-failure", envelope))
      .resolves.toMatchObject({ status: "requested", memory: "Receipt content only." });
    await expect(storage.saveRoleMemorySnapshot(state.id, "execution", "Explicit write"))
      .rejects.toThrow("memory snapshot target is not a regular file");
    expect((await storage.loadState(state.id)).taskCompletions?.["task-memory-failure"]).toMatchObject({ status: "requested" });
    await expect(fs.access(path.join(root, "outside-memory.md")))
      .rejects.toMatchObject({ code: "ENOENT" });
  });

  it("lists changed evidence on resume without injecting handoff or artifact bodies", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-context-delta-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    const state = minimalState("prj_88888888888888888888888888888888");
    await storage.createProject(state);
    const workspace = await storage.roleWorkspace(state.id, "execution", "inv_old");
    for (const name of ["old", "new"]) {
      const content = `${name}-artifact-evidence\n${"evidence\n".repeat(1000)}`;
      await fs.writeFile(path.join(workspace, `${name}.md`), content);
      state.artifacts = [...(state.artifacts ?? []), {
        id: `art_${name}`, agent: "execution", invocationId: `inv_${name}`, path: `${name}.md`,
        title: name, kind: "report", description: name, size: Buffer.byteLength(content),
        mediaType: "text/markdown",
        sha256: createHash("sha256").update(content).digest("hex"),
        updatedAt: state.updatedAt
      }];
    }
    await storage.writeHandoff(state, "execution", "inv_old", "old-handoff-evidence");
    await storage.appendEvent(state, { type: "handoff.saved", agent: "execution", message: "old", data: { invocationId: "inv_old" } });
    const cursor = state.eventSeq;
    state.turn++;
    await storage.writeHandoff(state, "execution", "inv_new", "new-handoff-evidence");
    await storage.appendEvent(state, { type: "handoff.saved", agent: "execution", message: "new", data: { invocationId: "inv_new" } });
    const delta = await storage.buildContextIndex(state, cursor, false, true);
    expect(delta).not.toContain("old-artifact-evidence");
    expect(delta).not.toContain("old-handoff-evidence");
    expect(delta).not.toContain("new-artifact-evidence");
    expect(delta).not.toContain("new-handoff-evidence");
    expect(delta).toContain('"path":"old.md"');
    expect(delta).toContain("inv_old_handoff.md");
    expect(delta).toContain("scienceevolve_read_published_artifact");
    expect(delta).toContain("Large bodies support bounded reads");
    expect(delta.length).toBeLessThan(6000);
    expect((await storage.buildContextIndex(state, cursor, true, true))).not.toContain("old-artifact-evidence");
    expect(await fs.readFile(path.join(workspace, "new.md"), "utf8")).toBe(`new-artifact-evidence\n${"evidence\n".repeat(1000)}`);
  });

  it("keeps every handoff, artifact and event discoverable through complete indexes while coarsening the default view", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-complete-context-index-")); temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    const state = minimalState(`prj_${"b".repeat(32)}`); await storage.createProject(state);
    const handoffs: string[] = [], events: Array<{ seq: number; type: string }> = [];
    state.artifacts = [];
    for (let index = 0; index < 65; index++) {
      state.turn = index;
      handoffs.push(await storage.writeHandoff(state, "execution", `inv_catalog_${index}`, `PRIVATE_HANDOFF_BODY_${index}`));
      events.push(await storage.appendEvent(state, { type: "handoff.saved", agent: "execution", message: `PRIVATE_EVENT_BODY_${index}` }));
      state.artifacts.push({ id: `art_complete_${index}`, agent: "execution", invocationId: `inv_catalog_${index}`,
        path: `result-${index}.md`, title: "PRIVATE_ARTIFACT_TITLE", kind: "report", description: "PRIVATE_ARTIFACT_DESCRIPTION",
        size: 1000, updatedAt: state.updatedAt });
    }
    const context = await storage.buildContextIndex(state, 0, true, true);
    const catalog = JSON.parse(await fs.readFile(context.match(/Context index: (.+)/)![1], "utf8"));
    const lists = new Map<string, any>();
    for (const source of catalog.entries) lists.set(source.key, JSON.parse(await fs.readFile(path.join(catalog.baseDirectory, source.list.path), "utf8")));
    const handoffIndex = lists.get("project.history.handoffs"), eventIndex = lists.get("project.history.events"), artifactIndex = lists.get("project.published-artifacts");
    expect(handoffIndex.nextPage).toBeUndefined(); expect(handoffIndex.entries).toHaveLength(65);
    for (const handoff of handoffs) expect(handoffIndex.entries.some((entry: any) => entry.id === path.basename(handoff))).toBe(true);
    for (const event of events) expect(eventIndex.entries.some((entry: any) => entry.name === `#${event.seq} ${event.type}`)).toBe(true);
    for (const artifact of state.artifacts) expect(artifactIndex.entries.some((entry: any) => entry.id === artifact.id && entry.path === artifact.path)).toBe(true);
    expect(context).not.toContain(`"id":"${path.basename(handoffs[0])}"`);
    expect(context).not.toContain("PRIVATE_"); expect(context).not.toContain("showing the latest");
  });

  it("keeps artifact bodies out of context and detects changed bytes on explicit published-artifact reads", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-context-integrity-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    const state = minimalState("prj_66666666666666666666666666666666");
    await storage.createProject(state);
    const workspace = await storage.roleWorkspace(
      state.id,
      "execution",
      "inv_integrity_source"
    );
    const published = "authoritative published bytes\n";
    await fs.writeFile(path.join(workspace, "report.md"), published, "utf8");
    state.artifacts = [{
      id: "art_integrity",
      agent: "execution",
      invocationId: "inv_integrity_source",
      path: "report.md",
      title: "Integrity report",
      kind: "report",
      description: "Publication integrity fixture",
      size: Buffer.byteLength(published),
      mediaType: "text/markdown",
      sha256: createHash("sha256").update(published).digest("hex"),
      updatedAt: state.updatedAt
    }];
    await fs.writeFile(
      path.join(workspace, "report.md"),
      "mutated workspace bytes must not be previewed\n",
      "utf8"
    );

    const context = await storage.buildContextIndex(state, undefined, true, true);

    expect(context).toContain("art_integrity");
    await expect(storage.resolvePublishedArtifactRecord(state.id, state.artifacts![0])).rejects.toThrow("Published artifact changed after publication: art_integrity");
    expect(context).not.toContain("mutated workspace bytes must not be previewed");
  });

  it("authorizes hash-bound publications and leaves legacy records unverified", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolvetifact-manifest-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const state = minimalState("prj_77777777777777777777777777777777");
    await storage.createProject(state);
    const workspace = await storage.roleWorkspace(
      state.id,
      "execution",
      "inv_manifest_source"
    );
    state.artifacts = [];
    for (let index = 0; index < 13; index += 1) {
      const content = `published artifact ${index}\n`;
      await fs.writeFile(path.join(workspace, `published-${index}.md`), content, "utf8");
      state.artifacts.push({
        id: `art_manifest_${index}`,
        agent: "execution",
        invocationId: "inv_manifest_source",
        path: `published-${index}.md`,
        title: `Published ${index}`,
        kind: "document",
        description: `Catalog entry ${index}`,
        size: Buffer.byteLength(content),
        ...(index === 0
          ? {}
          : { sha256: createHash("sha256").update(content).digest("hex") }),
        updatedAt: state.updatedAt
      });
    }
    const runtimePath = await storage.invocationRuntimePath(
      state.id,
      "inv_manifest_consumer"
    );
    const manifestPath = await storage.writePublishedArtifactAccessManifest(
      state,
      "inv_manifest_consumer",
      runtimePath
    );
    const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8")) as {
      projectId: string;
      invocationId: string;
      artifacts: Array<{ id: string; sha256: string; sourcePath: string }>;
    };

    expect(manifest).toMatchObject({
      projectId: state.id,
      invocationId: "inv_manifest_consumer"
    });
    expect(manifest.artifacts).toHaveLength(12);
    expect(manifest.artifacts.map((artifact) => artifact.id)).toEqual(
      Array.from({ length: 12 }, (_, index) => `art_manifest_${index + 1}`)
    );
    expect(manifest.artifacts.every((artifact) => /^[a-f0-9]{64}$/.test(artifact.sha256))).toBe(true);
    expect(manifest.artifacts.every((artifact) =>
      artifact.sourcePath.startsWith(path.join(runtimePath, "published-artifacts") + path.sep)
    )).toBe(true);
    expect(manifest.artifacts.every((artifact) =>
      !artifact.sourcePath.includes(`${path.sep}workspaces${path.sep}`)
    )).toBe(true);
    expect(state.artifacts[0].sha256).toBeUndefined();
    await expect(storage.resolvePublishedArtifactRecord(
      state.id,
      state.artifacts[0]
    )).rejects.toThrow("has no integrity identity and must be republished");
    expect(state.artifacts.slice(1).every((artifact) => artifact.sha256 ===
      manifest.artifacts.find((entry) => entry.id === artifact.id)?.sha256)).toBe(true);
    expect((await fs.stat(manifestPath)).mode & 0o777).toBe(0o600);
  });

  it("permanently deletes the complete project directory", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-storage-delete-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    const state = minimalState("prj_99999999999999999999999999999999");
    state.status = "cancelled";
    state.phase = "cancelled";
    state.currentAgent = undefined;
    state.activeInvocationId = undefined;
    state.archivedAt = "2026-09-19T00:00:00.000Z";
    await storage.createProject(state);
    const projectDir = path.join(root, "projects", state.id);
    await fs.mkdir(path.join(projectDir, "workspaces", "idea", "shared"), { recursive: true });
    await fs.writeFile(
      path.join(projectDir, "workspaces", "idea", "shared", "raw-data.csv"),
      "a,b\n1,2\n"
    );
    await fs.writeFile(path.join(projectDir, "runtime", "native-session.json"), "{}\n");

    await storage.deleteProject(state.id);

    await expect(fs.access(projectDir)).rejects.toMatchObject({ code: "ENOENT" });
    await expect(storage.tryLoadState(state.id)).resolves.toBeUndefined();
  });

  it.each(["events", "bootstrap", "history"] as const)("keeps %s behind the invocation rollback barrier", async (kind) => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-event-rollback-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    const state = minimalState("prj_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    await storage.createProject(state);
    const first = await storage.appendEvent(state, { type: "project.created", message: "committed seed" });
    await storage.beginInvocationCommit(state, "inv_event_rollback");
    await storage.appendEvent(state, { type: "agent.trace", message: "must roll back" });
    let returned = false;
    const read = (kind === "events" ? storage.readEvents(state.id)
      : kind === "bootstrap" ? storage.readEventBootstrap(state.id).then(page => page.events)
      : storage.readEventHistory(state.id, Number.MAX_SAFE_INTEGER).then(page => page.events))
      .then(events => { returned = true; return events; });
    await new Promise<void>(resolve => setImmediate(resolve));
    const returnedBeforeRollback = returned;
    await storage.rollbackInvocationCommit(state, "inv_event_rollback");
    expect(await read).toEqual([first]);
    expect(returnedBeforeRollback).toBe(false);
    expect(state.eventSeq).toBe(1);
  });

  it.each(["events", "bootstrap", "history"] as const)("returns a committed %s prefix while trace events keep appending", async (kind) => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-event-prefix-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    const state = minimalState("prj_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    await storage.createProject(state);
    const first = await storage.appendEvent(state, { type: "project.created", message: "committed seed" });
    const eventsPath = path.join(storage.projectDir(state.id), "events.jsonl");
    const readFile = fs.readFile.bind(fs), replay = storage.replayEvents.bind(storage);
    const page = EventLogIndex.prototype.page;
    let appended = 0;
    const appendDuringRead = async () => {
      // A reader that discards its whole snapshot on every append never
      // returns under a live token/heartbeat stream. Bound that old loop so
      // this regression fails deterministically instead of hanging the suite.
      if (++appended > 2) throw new Error("Event reader starved by later trace appends");
      await storage.appendEvent(state, { type: "agent.trace", message: `later heartbeat ${appended}` });
    };
    vi.spyOn(fs, "readFile").mockImplementation(async (...args) => {
      const result = await readFile(...args);
      if (args[0] === eventsPath) await appendDuringRead();
      return result;
    });
    vi.spyOn(storage, "replayEvents").mockImplementation((id, after, visit, signal) => {
      let injected = false;
      return replay(id, after, async event => {
        if (!injected) { injected = true; await appendDuringRead(); }
        return visit(event);
      }, signal);
    });
    if (kind !== "events") vi.spyOn(EventLogIndex.prototype, "page").mockImplementation(async function(this: EventLogIndex, ...args) {
      await appendDuringRead();
      return page.apply(this, args);
    });
    try {
      const events = kind === "events" ? await storage.readEvents(state.id)
        : kind === "bootstrap" ? (await storage.readEventBootstrap(state.id)).events
        : (await storage.readEventHistory(state.id, Number.MAX_SAFE_INTEGER)).events;
      expect(events).toEqual([first]);
      expect(appended).toBe(1);
      expect(state.eventSeq).toBe(2);
    } finally { vi.restoreAllMocks(); }
  });

  it("bounds the initial business timeline while retaining every original event for cursor history", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-bounded-history-")); temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub()), state = minimalState("prj_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    await storage.createProject(state);
    for (let offset = 0; offset < 400; offset += 100) await storage.appendEvents(state,
      Array.from({ length: 100 }, (_, index) => ({ type: "handoff.saved" as const, message: `Original handoff ${offset + index}` })));
    const snapshot = await storage.readEventBootstrap(state.id, 20);
    expect(snapshot.events).toHaveLength(20); expect(snapshot.timelineEvents).toHaveLength(200);
    expect(snapshot.totalEvents).toBe(400); expect(snapshot.lastSeq).toBe(400);
    expect(snapshot.timelineHasMore).toBe(true);
    const timeline = await storage.readTimelineHistory(state.id, snapshot.timelineEvents[0]!.seq, 200);
    expect(timeline.events).toHaveLength(200); expect(timeline.hasMore).toBe(false);
    expect(timeline.events[0]?.seq).toBe(1); expect(timeline.events.at(-1)?.seq).toBe(200);
    expect(timeline.events.every(event => event.message === "")).toBe(true);
    const older = await storage.readEventHistory(state.id, 201, 200);
    expect(older.events).toHaveLength(200); expect(older.events[0]?.message).toBe("Original handoff 0");
    expect(older.events.at(-1)?.seq).toBe(200); expect(older.hasMore).toBe(false);
    expect(await storage.readEvents(state.id)).toHaveLength(400);
  });

  it("reads committed events during later project writes without exposing an unfinished log append", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-inflight-event-prefix-")); temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub()), state = minimalState("prj_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    await storage.createProject(state);
    const first = await storage.appendEvent(state, { type: "project.created", message: "committed seed" });
    const releaseMutation = storage.reserveProjectMutation(state.id);
    const appendFile = fs.appendFile.bind(fs);
    let releaseAppend!: () => void, entered = false;
    const gate = new Promise<void>(resolve => { releaseAppend = resolve; });
    vi.spyOn(fs, "appendFile").mockImplementation(async (...args) => {
      if (args[0] === path.join(storage.projectDir(state.id), "timeline.md")) { entered = true; await gate; }
      return appendFile(...args);
    });
    const append = storage.appendEvent(state, { type: "agent.trace", message: "unfinished append" });
    try {
      await vi.waitFor(() => expect(entered).toBe(true));
      const reads = await Promise.all([storage.readEventBootstrap(state.id, 200), storage.readEventHistory(state.id, 3, 200)]);
      expect(reads[0].events).toEqual([first]); expect(reads[0].totalEvents).toBe(1);
      expect(reads[1].events).toEqual([first]);
      expect(storage.hasActiveProjectMutation(state.id)).toBe(true);
      releaseAppend(); await append;
      expect((await storage.readEventBootstrap(state.id, 200)).events.map(event => event.message)).toEqual(["committed seed", "unfinished append"]);
      expect(storage.hasActiveProjectMutation(state.id)).toBe(true);
    } finally { releaseAppend(); releaseMutation(); await append; vi.restoreAllMocks(); }
  });

  it("keeps original output and dispatch fields in bootstrap history after traces leave the recent window", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-preview-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    const state = minimalState("prj_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    await storage.createProject(state);
    const excerpt = "# Agent 原文\n" + "结论".repeat(490);
    await storage.appendEvent(state, { type: "handoff.saved", agent: "idea", message: "saved", data: { invocationId: "inv_first", excerpt } });
    await storage.appendEvent(state, { type: "main.assignment.committed", agent: "main", message: "assigned", data: { invocationId: "inv_main", nextAgent: "writing", message: "撰写论文", rationale: "实验已完成" } });
    await storage.appendEvent(state, { type: "workflow.reconfigured", agent: "main", message: "workflow changed", data: { invocationId: "inv_workflow", addedAgents: ["analyst"], removedAgents: ["review"], changedAgents: [], agentCount: 5 } });
    await storage.appendEvent(state, { type: "agent.trace", agent: "writing", message: "noisy trace" });
    const bootstrap = await storage.readEventBootstrap(state.id, 1);
    expect(bootstrap.events).toHaveLength(1);
    expect(bootstrap.timelineEvents.find((event) => event.type === "handoff.saved")?.data?.excerpt).toBe(excerpt);
    expect(bootstrap.timelineEvents.find((event) => event.type === "main.assignment.committed")?.data).toMatchObject({ nextAgent: "writing", message: "撰写论文", rationale: "实验已完成" });
    expect(bootstrap.timelineEvents.find((event) => event.type === "workflow.reconfigured")?.data).toMatchObject({ addedAgents: ["analyst"], removedAgents: ["review"], changedAgents: [], agentCount: 5 });
    expect(bootstrap.timelineEvents.some((event) => event.type === "agent.trace")).toBe(false);
  });

  it("retains actual collaboration calls and compact scope identities after their events leave the recent window", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-call-history-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    const state = minimalState("prj_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    await storage.createProject(state);
    await storage.appendEvent(state, { type: "workflow.node.updated", agentId: "main", invocationId: "inv_leader",
      message: "native management opened", data: { sourceType: "agent.native_binding.opened", binding: {
        agentId: "main", invocationId: "inv_leader", session: { nativeId: "not-needed-in-summary" },
        worktreePath: "/private/unused", executionContext: { role: "leader", groupRunId: "group-a", coordinatorEpoch: 1, executionWorktree: "/private/unused" }
      } } });
    await storage.appendEvent(state, { type: "collaboration.execution.started", agentId: "execution", invocationId: "inv_member", executionId: "execution-a",
      message: "member opened", data: { sourceType: "scoped.agent.native_opened", executionId: "execution-a", groupRunId: "group-a", ownershipEpoch: 1 } });
    await storage.appendEvent(state, { type: "collaboration.execution.started", agentId: "execution", invocationId: "inv_final",
      message: "final integration", data: { sourceType: "scoped.final.native.opened", executionId: "group-final-group-a", groupRunId: "group-a" } });
    await storage.appendEvent(state, { type: "workflow.node.updated", message: "usage metadata", data: { sourceType: "usage.recorded", totalTokens: 42 } });
    await storage.appendEvent(state, { type: "agent.trace", message: "large latest trace" });
    const bootstrap = await storage.readEventBootstrap(state.id, 1);
    expect(bootstrap.events).toHaveLength(1);
    expect(bootstrap.timelineEvents.map(event => event.invocationId)).toEqual(["inv_leader", "inv_member", "inv_final"]);
    expect(bootstrap.timelineEvents[0].data).toMatchObject({ sourceType: "agent.native_binding.opened", agentId: "main", invocationId: "inv_leader",
      executionContext: { role: "leader", groupRunId: "group-a", coordinatorEpoch: 1 } });
    expect(JSON.stringify(bootstrap.timelineEvents)).not.toContain("not-needed-in-summary");
    expect(JSON.stringify(bootstrap.timelineEvents)).not.toContain("/private/unused");
    expect(bootstrap.timelineEvents[1].data).toMatchObject({ groupRunId: "group-a", ownershipEpoch: 1 });
    expect(bootstrap.timelineEvents.every(event => event.message === "")).toBe(true);
  });

  it("preserves a structurally valid SessionRef for an unregistered historical Harness", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-storage-session-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    const state = minimalState("prj_dddddddddddddddddddddddddddddddd");
    state.agentSessions = {
      main: {
        schemaVersion: 1,
        harnessId: "retired-harness.v2",
        adapterVersion: "legacy-7",
        generation: 6,
        nativeId: "historical-native-id",
        durable: true,
        createdAt: "2025-01-01T00:00:00.000Z",
        resumedAt: "2025-01-02T00:00:00Z"
      }
    };
    const projectDir = path.join(root, "projects", state.id);
    await fs.mkdir(projectDir, { recursive: true });
    await fs.writeFile(
      path.join(projectDir, "state.json"),
      `${JSON.stringify(state)}\n`,
      "utf8"
    );

    const loaded = await storage.loadState(state.id);
    expect(loaded.agentSessions?.main).toEqual(state.agentSessions!.main);
  });

  it("rejects a ProjectState containing a malformed persisted SessionRef", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-storage-session-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    const state = minimalState("prj_eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee") as unknown as Record<string, unknown>;
    state.agentSessions = {
      main: {
        schemaVersion: 1,
        harnessId: "codex",
        adapterVersion: "1",
        generation: 0,
        nativeId: { unexpected: "object" },
        durable: true,
        createdAt: "2025-01-01T00:00:00.000Z"
      }
    };
    const projectDir = path.join(root, "projects", state.id as string);
    await fs.mkdir(projectDir, { recursive: true });
    await fs.writeFile(
      path.join(projectDir, "state.json"),
      `${JSON.stringify(state)}\n`,
      "utf8"
    );

    await expect(storage.loadState(state.id as string)).rejects.toBeInstanceOf(
      IncompatibleProjectStateError
    );
    await expect(storage.tryLoadState(state.id as string)).resolves.toBeUndefined();
  });

  it("hides incompatible hidden-Controller projects without blocking current projects", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-storage-main-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    const current = minimalState("prj_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    await storage.createProject(current);

    const legacyId = "prj_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
    const legacy = structuredClone(minimalState(legacyId)) as unknown as Record<string, unknown>;
    const legacyAgents = legacy.agents as Record<string, unknown>;
    legacyAgents.__system_controller__ = structuredClone(legacyAgents.main);
    const legacyOrchestration = legacy.orchestration as {
      termination: { decisionBy: string };
    };
    legacyOrchestration.termination.decisionBy = "controller";
    const legacyDir = path.join(root, "projects", legacyId);
    await fs.mkdir(legacyDir, { recursive: true });
    await fs.writeFile(
      path.join(legacyDir, "state.json"),
      `${JSON.stringify(legacy)}\n`,
      "utf8"
    );

    expect(await storage.tryLoadState(legacyId)).toBeUndefined();
    expect((await storage.listStates()).map((state) => state.id)).toEqual([current.id]);
  });

  it("hides project states using the removed Main natural-language fields", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-storage-main-output-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    const legacy = structuredClone(minimalState("prj_cccccccccccccccccccccccccccccccc")) as unknown as Record<string, unknown>;
    legacy.lastMainDecision = {
      assessment: "legacy",
      nextAgent: "idea",
      task: "removed field",
      rationale: "legacy",
      successCriteria: ["legacy"],
      display: null
    };
    const legacyDir = path.join(root, "projects", "prj_cccccccccccccccccccccccccccccccc");
    await fs.mkdir(legacyDir, { recursive: true });
    await fs.writeFile(path.join(legacyDir, "state.json"), `${JSON.stringify(legacy)}\n`, "utf8");

    expect(await storage.tryLoadState("prj_cccccccccccccccccccccccccccccccc")).toBeUndefined();
  });

  it.each([
    ["figure.png", "image/png"],
    ["figure.gif", "image/gif"],
    ["figure.webp", "image/webp"],
    ["sound.mp3", "audio/mpeg"],
    ["sound.wav", "audio/wav"],
    ["recording.ogg", "audio/ogg"],
    ["clip.mp4", "video/mp4"],
    ["clip.webm", "video/webm"],
    ["document.pdf", "application/pdf"]
    , ["diagram.svg", "image/svg+xml"]
  ])("maps %s to %s for browser-compatible workspace display", (filePath, expected) => {
    expect(mediaTypeFor(filePath)).toBe(expected);
  });

  it("gives every Agent one persistent project workspace", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-workspace-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();

    const projectId = "prj_11111111111111111111111111111111";
    const workspaces = await Promise.all([
      storage.roleWorkspace(projectId, "main", "inv_main_session"),
      storage.roleWorkspace(projectId, "execution", "inv_execution_session"),
      storage.roleWorkspace(projectId, "review", "inv_review_session")
    ]);

    const expected = path.join(root, "projects", projectId, "workspaces");
    expect(new Set(workspaces)).toEqual(new Set([expected]));
    expect((await fs.lstat(expected)).isDirectory()).toBe(true);
    expect(await fs.readFile(path.join(expected, "Memory.md"), "utf8")).toContain(
      "# Project Memory"
    );
    expect((await fs.stat(path.join(expected, "Memory.md"))).mode & 0o777).toBe(
      0o600
    );

    await fs.writeFile(path.join(workspaces[1]!, "evidence.txt"), "shared evidence\n");
    expect(await fs.readFile(path.join(workspaces[2]!, "evidence.txt"), "utf8")).toBe(
      "shared evidence\n"
    );
    await fs.appendFile(path.join(expected, "Memory.md"), "\nreview: verified evidence\n");

    const reopened = new ProjectStorage(root, new EventHub());
    expect(await reopened.roleWorkspace(projectId, "new-agent", "inv_reopened")).toBe(expected);
    expect(await fs.readFile(path.join(expected, "Memory.md"), "utf8")).toContain(
      "review: verified evidence"
    );
  });

  it("preserves legacy role directories without merging or overwriting them", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-workspace-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const projectId = "prj_22222222222222222222222222222222";
    const workspace = path.join(root, "projects", projectId, "workspaces");
    const writerLegacy = path.join(workspace, "writer", "shared");
    const reviewLegacy = path.join(workspace, "review", "shared");
    await Promise.all([
      fs.mkdir(writerLegacy, { recursive: true }),
      fs.mkdir(reviewLegacy, { recursive: true })
    ]);
    await Promise.all([
      fs.writeFile(path.join(writerLegacy, "old.md"), "writer legacy\n"),
      fs.writeFile(path.join(reviewLegacy, "old.md"), "review legacy\n")
    ]);

    expect(await storage.roleWorkspace(projectId, "writer", "inv_writer")).toBe(workspace);
    expect(await fs.readFile(path.join(writerLegacy, "old.md"), "utf8")).toBe("writer legacy\n");
    expect(await fs.readFile(path.join(reviewLegacy, "old.md"), "utf8")).toBe("review legacy\n");
    expect(
      (await storage.readWorkspaceArtifact(projectId, "writer", "old.md")).content.toString()
    ).toBe("writer legacy\n");
    expect(
      (await storage.readWorkspaceArtifact(
        projectId,
        "review",
        "workspaces/writer/shared/old.md"
      )).content.toString()
    ).toBe("writer legacy\n");

    await fs.writeFile(path.join(workspace, "old.md"), "new shared root\n");
    expect(
      (await storage.readWorkspaceArtifact(projectId, "writer", "old.md")).content.toString()
    ).toBe("new shared root\n");
    expect(await fs.readFile(path.join(writerLegacy, "old.md"), "utf8")).toBe("writer legacy\n");
  });

  it("does not follow a project Memory.md symlink outside the workspace", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-workspace-memory-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const projectId = "prj_23232323232323232323232323232323";
    const workspace = path.join(root, "projects", projectId, "workspaces");
    const outside = path.join(root, "outside-memory.md");
    await fs.mkdir(workspace, { recursive: true });
    await fs.writeFile(outside, "must remain unchanged\n", { mode: 0o644 });
    await fs.symlink(outside, path.join(workspace, "Memory.md"));

    await expect(
      storage.roleWorkspace(projectId, "main", "inv_memory_symlink")
    ).rejects.toThrow("Invalid Project memory path");
    expect(await fs.readFile(outside, "utf8")).toBe("must remain unchanged\n");
    expect((await fs.stat(outside)).mode & 0o777).toBe(0o644);

    await fs.unlink(path.join(workspace, "Memory.md"));
    const inside = path.join(workspace, "notes.md");
    await fs.writeFile(inside, "not project memory\n", { mode: 0o644 });
    await fs.symlink(inside, path.join(workspace, "Memory.md"));
    await expect(
      storage.roleWorkspace(projectId, "main", "inv_internal_memory_symlink")
    ).rejects.toThrow("Project memory must be a regular non-symlink file");
    expect((await fs.stat(inside)).mode & 0o777).toBe(0o644);
  });

  it("indexes the common workspace once and attributes only registered files", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-workspace-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    await storage.initialize();
    const projectId = "prj_44444444444444444444444444444444";
    const state = minimalState(projectId);
    await storage.createProject(state);
    const workspace = await storage.roleWorkspace(projectId, "idea", "inv_workspace_test");
    await fs.writeFile(
      path.join(workspace, "proposal.md"),
      "# Direct proposal\n",
      "utf8"
    );
    await fs.mkdir(path.join(workspace, "results"), { recursive: true });
    await fs.writeFile(
      path.join(workspace, "results", "metrics.json"),
      '{"accuracy":0.9}\n',
      "utf8"
    );
    await fs.writeFile(path.join(workspace, ".env"), "SECRET=hidden\n", "utf8");
    const proposal = "# Direct proposal\n";
    state.artifacts = [{
      id: "idea:proposal.md",
      agent: "idea",
      invocationId: "inv_workspace_test",
      path: "proposal.md",
      title: "Proposal",
      kind: "report",
      description: "Registered proposal",
      size: Buffer.byteLength(proposal),
      mediaType: "text/markdown",
      sha256: createHash("sha256").update(proposal).digest("hex"),
      updatedAt: state.updatedAt
    }];
    await storage.saveState(state);

    const page = await storage.listArtifactPage(projectId, {
      limit: 100
    });
    expect(page.artifacts.map((artifact) => artifact.path).sort()).toEqual([
      "Memory.md",
      "proposal.md",
      "results/metrics.json"
    ]);
    expect(page.artifacts.find((artifact) => artifact.path === "proposal.md")).toMatchObject({
      path: "proposal.md",
      producer: "idea",
      origin: "workspace"
    });

    const summary = await storage.listArtifactSummary(projectId);
    expect(summary.total).toBe(3);
    expect(summary.groups).toEqual({ idea: 1, shared: 2 });
    expect((await storage.listArtifactPage(projectId, {
      agent: "idea",
      limit: 100
    })).artifacts.map((artifact) => artifact.path)).toEqual(["proposal.md"]);
    const searchPage = await storage.listArtifactPage(projectId, {
      agent: "shared",
      query: "results/METRICS",
      limit: 100
    });
    expect(searchPage.artifacts.map((artifact) => artifact.path)).toEqual([
      "results/metrics.json"
    ]);
    const rootDirectory = await storage.listArtifactDirectory(
      projectId,
      "idea",
      "",
      { limit: 2 }
    );
    expect(rootDirectory).toMatchObject({
      agent: "idea",
      directory: "",
      offset: 0,
      limit: 2,
      total: 4,
      hasMore: true
    });
    expect(rootDirectory.entries.map((entry) => [entry.type, entry.path])).toEqual([
      ["directory", "results"],
      ["directory", "user_inputs"]
    ]);
    const rootFiles = await storage.listArtifactDirectory(
      projectId,
      "idea",
      "",
      { offset: 2, limit: 2 }
    );
    expect(rootFiles.entries.map((entry) => [entry.type, entry.path])).toEqual([
      ["file", "Memory.md"],
      ["file", "proposal.md"]
    ]);
    const resultsDirectory = await storage.listArtifactDirectory(
      projectId,
      "idea",
      "results"
    );
    expect(resultsDirectory).toMatchObject({
      directory: "results",
      parent: "",
      total: 1,
      hasMore: false
    });
    expect(resultsDirectory.entries).toEqual([
      expect.objectContaining({
        type: "file",
        path: "results/metrics.json",
        producer: "shared",
        origin: "workspace"
      })
    ]);
    await expect(
      storage.listArtifactDirectory(projectId, "idea", ".scienceevolve")
    ).rejects.toMatchObject({ code: "ENOENT" });
    await expect(
      storage.listArtifactDirectory(projectId, "idea", "../execution")
    ).rejects.toThrow("Path traversal");
    const read = await storage.readWorkspaceArtifact(projectId, "idea", "proposal.md");
    expect(read.content.toString("utf8")).toBe("# Direct proposal\n");
    await expect(
      storage.readWorkspaceArtifact(projectId, "idea", ".env")
    ).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("resolves display paths from workspace-relative, project-relative, and absolute forms", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-display-paths-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    const projectId = "prj_55555555555555555555555555555555";
    await storage.createProject(minimalState(projectId));
    const workspace = await storage.roleWorkspace(projectId, "writing", "inv_display_test");
    const manuscript = path.join(workspace, "paper.tex");
    await fs.writeFile(manuscript, "\\section{Test}\n", "utf8");
    const legacyControlName = "legacy\r\nreport.md";
    await fs.writeFile(path.join(workspace, legacyControlName), "legacy path\n", "utf8");

    const requests = [
      "paper.tex",
      "workspaces/paper.tex",
      manuscript
    ];
    for (const request of requests) {
      const resolved = await storage.resolveWorkspaceArtifact(
        projectId,
        "writing",
        request
      );
      expect(resolved.relativePath).toBe("paper.tex");
      expect(resolved.sourcePath).toBe(manuscript);
    }
    const legacyControl = await storage.resolveWorkspaceArtifact(
      projectId,
      "writing",
      legacyControlName
    );
    expect(legacyControl.relativePath).toBe(legacyControlName);
    await expect(
      storage.resolveWorkspaceArtifact(projectId, "writing", path.join(root, "outside.txt"))
    ).rejects.toThrow();
  });

  it("limits the context index to project and common workspace-root paths", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-workspace-"));
    temporaryRoots.push(root);
    const storage = new ProjectStorage(root, new EventHub());
    const projectId = "prj_33333333333333333333333333333333";
    const now = new Date().toISOString();
    const state: ProjectState = {
      id: projectId,
      title: "Writing evidence visibility",
      requirement: "Write a paper from every completed execution result.",
      status: "running",
      phase: "writing:running",
      createdAt: now,
      updatedAt: now,
      currentAgent: "writing",
      activeInvocationId: "inv_writing",
      turn: 2,
      cycle: 1,
      eventSeq: 0,
      consecutiveFailures: 0,
      completionGeneration: 0,
      controlProtocol: "natural-language-tools-v1",
      runCounts: { idea: 1, main: 1, execution: 1, writing: 0, review: 0 },
      mainInvocationSeq: 1,
      agents: structuredClone(defaultAgentConfigs),
      orchestration: cloneAgentOrchestrationTemplate(),
      userInputs: [],
      tokenUsage: {
        inputTokens: 0,
        cachedInputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        invocations: 0,
        byAgent: {
          idea: { inputTokens: 0, cachedInputTokens: 0, outputTokens: 0, totalTokens: 0, invocations: 0 },
          main: { inputTokens: 0, cachedInputTokens: 0, outputTokens: 0, totalTokens: 0, invocations: 0 },
          execution: { inputTokens: 0, cachedInputTokens: 0, outputTokens: 0, totalTokens: 0, invocations: 0 },
          writing: { inputTokens: 0, cachedInputTokens: 0, outputTokens: 0, totalTokens: 0, invocations: 0 },
          review: { inputTokens: 0, cachedInputTokens: 0, outputTokens: 0, totalTokens: 0, invocations: 0 }
        }
      },
      computeUsage: emptyProjectComputeUsage()
    };
    await storage.createProject(state);
    const executionWorkspace = await storage.roleWorkspace(
      projectId,
      "execution",
      "inv_execution"
    );
    await fs.writeFile(
      path.join(executionWorkspace, "complete-results.json"),
      '{"metric":0.91}\n',
      "utf8"
    );
    await storage.writeInbox(
      state,
      "execution",
      "inv_execution",
      "# Execution assignment"
    );
    await storage.writeHandoff(
      state,
      "execution",
      "inv_execution",
      "# Execution handoff"
    );
    await storage.appendTrace(
      state,
      "execution",
      "inv_execution",
      "tool",
      "inspire job completed"
    );
    await fs.mkdir(path.join(executionWorkspace, "research"), { recursive: true });
    await fs.writeFile(
      path.join(executionWorkspace, "research", "results.md"),
      "# Results\n\nAccuracy: 0.91",
      "utf8"
    );

    const context = await storage.buildContextIndex(state);
    const projectPath = path.join(root, "projects", projectId);
    expect(context).toContain(`- Project path: \`${projectPath}\``);
    expect(context).toContain(
      `- Workspace path: \`${path.join(projectPath, "workspaces")}\``
    );
    expect(context).toContain("messages/0002_execution_inv_execution_handoff.md");
  });
});
