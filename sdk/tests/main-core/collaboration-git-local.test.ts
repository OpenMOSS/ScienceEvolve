import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import type { OperationRecord, ProjectGitState } from "../../src/core/types.js";
import {
  ExecFileGitCommandRunner,
  GitInputError,
  GitOwnershipStaleError,
  LocalCollaborationGitService,
  OperationPayloadMismatchError,
  redactGitDiagnostic,
  type CollaborationGitOperationStore,
  type ExecutionOwnershipAssertion,
  type GitCommandRequest,
  type GitCommandResult,
  type GitCommandRunner,
  type GitExecutionAuthority,
  type InitializationCheckpoint,
  type OperationTransition
} from "../../src/core/collaboration-git/index.js";
import { prepareInvocationInputs } from "../../src/core/harness-runtime/invocation-inputs.js";
import { mergedTreeFromBareRepo } from "./helpers/merged-tree.js";
import { prepareOperation } from "../../src/core/collaboration-git/operation.js";

const execFileAsync = promisify(execFile);
const roots: string[] = [];

class ResidualWorkerStageRunner implements GitCommandRunner {
  private readonly delegate = new ExecFileGitCommandRunner();
  private armedPath?: string;
  raced = false;

  arm(relativePath: string): void {
    this.armedPath = relativePath;
  }

  async run(request: GitCommandRequest): Promise<GitCommandResult> {
    if (
      this.armedPath &&
      !this.raced &&
      request.args[0] === "add" &&
      request.environment?.GIT_INDEX_FILE
    ) {
      this.raced = true;
      await execFileAsync(
        "git",
        ["-c", "core.hooksPath=/dev/null", "add", "-f", "--", this.armedPath],
        { cwd: request.cwd, encoding: "utf8" }
      );
    }
    return this.delegate.run(request);
  }
}

class IgnoreRemovalDuringCheckpointRunner implements GitCommandRunner {
  private readonly delegate = new ExecFileGitCommandRunner();
  armed = false;
  raced = false;

  async run(request: GitCommandRequest): Promise<GitCommandResult> {
    if (
      this.armed &&
      !this.raced &&
      request.args[0] === "add" &&
      request.environment?.GIT_INDEX_FILE
    ) {
      this.raced = true;
      await fs.writeFile(path.join(request.cwd, ".gitignore"), "node_modules/\n", "utf8");
    }
    return this.delegate.run(request);
  }
}

class MemoryOperationStore implements CollaborationGitOperationStore {
  readonly records = new Map<string, OperationRecord>();
  readonly authorities = new Map<string, { epoch: number; branch: string }>();
  readonly initialization: InitializationCheckpoint[] = [];

  async recordedOperation(operationId: string): Promise<OperationRecord | undefined> {
    const record = this.records.get(operationId);
    return record ? structuredClone(record) : undefined;
  }

  async activeRevertOperation(executionId: string): Promise<OperationRecord | undefined> {
    return [...this.records.values()].find(record => record.kind === "git.revert" && record.ownerExecutionId === executionId &&
      ["prepared", "observed", "uncertain"].includes(record.status));
  }

  async prepare(record: OperationRecord): Promise<OperationRecord> {
    const existing = this.records.get(record.id);
    if (existing) {
      if (
        existing.payloadHash !== record.payloadHash ||
        existing.kind !== record.kind ||
        existing.ownerExecutionId !== record.ownerExecutionId ||
        existing.ownershipEpoch !== record.ownershipEpoch ||
        existing.expectedHead !== record.expectedHead ||
        existing.expectedBase !== record.expectedBase
      ) {
        throw new OperationPayloadMismatchError(record.id);
      }
      return structuredClone(existing);
    }
    this.records.set(record.id, structuredClone(record));
    return structuredClone(record);
  }

  async transition(input: OperationTransition): Promise<OperationRecord> {
    const existing = this.records.get(input.id);
    if (!existing || existing.payloadHash !== input.payloadHash) {
      throw new OperationPayloadMismatchError(input.id);
    }
    const next: OperationRecord = {
      ...existing,
      status: input.status,
      ...(input.remoteFact ? { remoteFact: structuredClone(input.remoteFact) } : {})
    };
    this.records.set(input.id, next);
    return structuredClone(next);
  }

  async assertExecutionOwnership(input: ExecutionOwnershipAssertion): Promise<void> {
    const current = this.authorities.get(input.executionId);
    if (
      !current ||
      current.epoch !== input.ownershipEpoch ||
      current.branch !== input.expectedBranch
    ) {
      throw new Error("stale execution authority");
    }
  }

  async checkpointInitialization(input: InitializationCheckpoint): Promise<void> {
    this.initialization.push(structuredClone(input));
  }
}

async function fixture(runner?: GitCommandRunner, worktreeMode?: "execution" | "agent") {
  const scratch = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-git-local-"));
  roots.push(scratch);
  const projectId = "project-git-test";
  const projectRoot = path.join(scratch, projectId);
  await fs.mkdir(projectRoot, { recursive: true });
  const store = new MemoryOperationStore();
  const service = new LocalCollaborationGitService({
    projectId,
    projectRoot,
    operationStore: store,
    ...(worktreeMode ? { worktreeMode } : {}),
    ...(runner ? { runner } : {}),
    allowLocalRemotes: true,
    now: () => "2026-09-22T00:00:00.000Z"
  });
  const main = await service.initializeMain({
    title: "Git collaboration fixture",
    operationId: "op-init"
  });
  await git(service.repositoryPath, ["config", "core.autocrlf", "false"]);
  return { scratch, projectId, projectRoot, store, service, main };
}

function execution(
  service: LocalCollaborationGitService,
  store: MemoryOperationStore,
  id: string,
  agentId: string,
  epoch = 1,
  purpose: GitExecutionAuthority["purpose"] = "delivery",
  groupRunId = "group-1"
): GitExecutionAuthority {
  const branch = purpose === "final-integration"
    ? service.groupBranch(groupRunId)
    : service.deliveryBranch(id);
  store.authorities.set(id, { epoch, branch });
  return {
    id,
    agentId,
    groupRunId,
    purpose,
    ownershipEpoch: epoch,
    executionBranch: branch,
    worktreePath: service.canonicalWorktree(id)
  };
}

async function git(cwd: string, args: string[]): Promise<string> {
  const result = await execFileAsync("git", ["-c", "core.hooksPath=/dev/null", ...args], {
    cwd,
    encoding: "utf8"
  });
  return result.stdout.trim();
}

async function harnessCommit(
  worktree: string,
  message: string,
  paths: string[] = ["."]
): Promise<string> {
  await git(worktree, ["add", "--", ...paths]);
  await git(worktree, [
    "-c", "user.name=Harness Agent",
    "-c", "user.email=harness@example.test",
    "commit", "-m", message
  ]);
  return git(worktree, ["rev-parse", "HEAD"]);
}

async function attachRemote(
  scratch: string,
  service: LocalCollaborationGitService
): Promise<string> {
  const remote = path.join(scratch, `remote-${randomUUID()}.git`);
  await execFileAsync(
    "git",
    ["init", "--bare", "--initial-branch=main", remote],
    { encoding: "utf8" }
  );
  await service.configureOrigin(remote);
  await service.pushMain();
  return remote;
}

async function providerMergeAndSynchronize(input: {
  service: LocalCollaborationGitService;
  remote: string;
  operationId: string;
  sourceBranch: string;
  targetBranch: string;
  checkedOutTarget?: {
    execution: GitExecutionAuthority;
    ownershipEpoch: number;
  };
  remoteHeadMode?: "merge" | "fast-forward" | "diverged";
}) {
  const target = await git(input.remote, ["rev-parse", `refs/heads/${input.targetBranch}`]);
  const source = await git(input.remote, ["rev-parse", `refs/heads/${input.sourceBranch}`]);
  const tree = await mergedTreeFromBareRepo(input.remote, target, source);
  const merged = await execFileAsync(
    "git",
    [
      "-c",
      "core.hooksPath=/dev/null",
      "commit-tree",
      tree,
      "-p",
      target,
      "-p",
      source,
      "-m",
      `Provider merge ${input.operationId}`
    ],
    {
      cwd: input.remote,
      encoding: "utf8",
      env: {
        ...process.env,
        GIT_AUTHOR_NAME: "Fake Provider",
        GIT_AUTHOR_EMAIL: "provider@localhost",
        GIT_COMMITTER_NAME: "Fake Provider",
        GIT_COMMITTER_EMAIL: "provider@localhost"
      }
    }
  );
  const mergeCommit = merged.stdout.trim();
  await git(input.remote, [
    "update-ref",
    `refs/heads/${input.targetBranch}`,
    mergeCommit,
    target
  ]);
  let remoteHead = mergeCommit;
  if (input.remoteHeadMode && input.remoteHeadMode !== "merge") {
    const parent = input.remoteHeadMode === "fast-forward" ? mergeCommit : target;
    const parentTree = await git(input.remote, ["rev-parse", `${parent}^{tree}`]);
    const advanced = await execFileAsync(
      "git",
      [
        "-c",
        "core.hooksPath=/dev/null",
        "commit-tree",
        parentTree,
        "-p",
        parent,
        "-m",
        `External ${input.remoteHeadMode} after ${input.operationId}`
      ],
      {
        cwd: input.remote,
        encoding: "utf8",
        env: {
          ...process.env,
          GIT_AUTHOR_NAME: "External Writer",
          GIT_AUTHOR_EMAIL: "external@localhost",
          GIT_COMMITTER_NAME: "External Writer",
          GIT_COMMITTER_EMAIL: "external@localhost"
        }
      }
    );
    remoteHead = advanced.stdout.trim();
    await git(input.remote, [
      "update-ref",
      `refs/heads/${input.targetBranch}`,
      remoteHead,
      mergeCommit
    ]);
  }
  return input.service.synchronizeMergedPullRequest({
    operationId: input.operationId,
    targetBranch: input.targetBranch,
    expectedSourceHead: source,
    expectedMergeCommit: mergeCommit,
    expectedRemoteHead: remoteHead,
    ...(input.checkedOutTarget ? { checkedOutTarget: input.checkedOutTarget } : {})
  });
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 })));
});

describe("LocalCollaborationGitService", () => {
  it("cleans only a stopped task's pending Git paths and reuses its Agent directory without creating a commit", async () => {
    const { service, store } = await fixture(undefined, "agent");
    const original = execution(service, store, "exec-clean-original", "one");
    const other = execution(service, store, "exec-clean-other", "two");
    original.worktreePath = service.canonicalAgentWorktree("one");
    other.worktreePath = service.canonicalAgentWorktree("two");
    await service.createDeliveryWorktree(original, 1, { kind: "main" });
    await service.createDeliveryWorktree(other, 1, { kind: "main" });
    const head = await git(original.worktreePath, ["rev-parse", "HEAD"]);
    await fs.writeFile(path.join(original.worktreePath, "README.md"), "Uncommitted change");
    await fs.writeFile(path.join(original.worktreePath, "staged.txt"), "Staged change");
    await git(original.worktreePath, ["add", "staged.txt"]);
    await fs.mkdir(path.join(original.worktreePath, "temporary"));
    await fs.writeFile(path.join(original.worktreePath, "temporary", "result.txt"), "Untracked result");
    await fs.writeFile(path.join(other.worktreePath, "other-task.txt"), "Other task remains available");
    const cleaned = await service.clearExecutionWorktree(original, 1, true);
    expect(cleaned.cleanedPaths).toEqual(expect.arrayContaining(["README.md", "staged.txt", "temporary/result.txt"]));
    expect(cleaned.pendingPaths).toEqual([]);
    expect(await git(original.worktreePath, ["rev-parse", "HEAD"])).toBe(head);
    expect(await fs.readFile(path.join(other.worktreePath, "other-task.txt"), "utf8")).toBe("Other task remains available");
    const next = execution(service, store, "exec-clean-next", "one");
    next.worktreePath = original.worktreePath;
    const prepared = await service.createDeliveryWorktree(next, 1, { kind: "main" });
    expect(prepared.worktreePath).toBe(original.worktreePath);
    expect(prepared.branch).toBe(next.executionBranch);
    expect(await git(next.worktreePath, ["status", "--porcelain"])).toBe("");
  });

  it("previews and reverts one current-task commit once, preserving history and unrelated files after a lost journal response", async () => {
    const commands: string[] = [];
    const delegate = new ExecFileGitCommandRunner();
    const runner: GitCommandRunner = { run: request => { commands.push(request.args[0]!); return delegate.run(request); } };
    const { service, store } = await fixture(runner);
    const owner = execution(service, store, "revert-current", "worker");
    await service.createDeliveryWorktree(owner, 1, { kind: "main" });
    await fs.writeFile(path.join(owner.worktreePath, "bad.txt"), "bad result\n");
    const target = await harnessCommit(owner.worktreePath, "Business result to retract");
    await fs.writeFile(path.join(owner.worktreePath, "keep.txt"), "independent result\n");
    const beforeHead = await harnessCommit(owner.worktreePath, "Independent result");
    await fs.writeFile(path.join(owner.worktreePath, "untracked.txt"), "keep untracked\n");
    const operationId = `git-revert-${"a".repeat(64)}`;
    const preview = await service.revertExecution(owner, 1, { tool: "git_revert", mode: "preview", target, expectedHead: beforeHead }, operationId);
    expect(preview).toMatchObject({ status: "preview", files: ["bad.txt"], applicability: "not_executed" });
    expect(await git(owner.worktreePath, ["rev-parse", "HEAD"])).toBe(beforeHead);
    expect(store.records.has(operationId)).toBe(false);
    const transition = store.transition.bind(store);
    let lost = false;
    store.transition = async input => {
      if (!lost && input.remoteFact?.status === "committed") { lost = true; throw new Error("lost journal response"); }
      return transition(input);
    };
    const apply = { tool: "git_revert", mode: "apply", target, expectedHead: beforeHead } as const;
    await expect(service.revertExecution(owner, 1, apply, operationId)).rejects.toThrow("lost journal response");
    const afterHead = await git(owner.worktreePath, ["rev-parse", "HEAD"]);
    expect(afterHead).not.toBe(beforeHead);
    const mutationCounts = ["revert", "commit-tree", "update-ref"].map(command => commands.filter(value => value === command).length);
    const [first, duplicate] = await Promise.all([service.revertExecution(owner, 1, apply, operationId), service.revertExecution(owner, 1, apply, operationId)]);
    expect(first).toMatchObject({ status: "committed", beforeHead, afterHead });
    expect(duplicate).toMatchObject({ status: "committed", afterHead });
    expect(["revert", "commit-tree", "update-ref"].map(command => commands.filter(value => value === command).length)).toEqual(mutationCounts);
    expect(await git(owner.worktreePath, ["rev-parse", `${afterHead}^`])).toBe(beforeHead);
    expect(await git(owner.worktreePath, ["show", `${target}:bad.txt`])).toBe("bad result");
    await expect(fs.stat(path.join(owner.worktreePath, "bad.txt"))).rejects.toMatchObject({ code: "ENOENT" });
    expect(await fs.readFile(path.join(owner.worktreePath, "keep.txt"), "utf8")).toBe("independent result\n");
    expect(await fs.readFile(path.join(owner.worktreePath, "untracked.txt"), "utf8")).toBe("keep untracked\n");
    expect(store.records.get(operationId)?.status).toBe("finalized");
  });

  it.each(["continue", "abort"] as const)("returns a real revert conflict and lets only an explicit %s settle its exact paths", async mode => {
    const { service, store } = await fixture();
    const owner = execution(service, store, `revert-${mode}`, "worker");
    await service.createDeliveryWorktree(owner, 1, { kind: "main" });
    await fs.writeFile(path.join(owner.worktreePath, "result.txt"), "one\n");
    await fs.writeFile(path.join(owner.worktreePath, "keep.txt"), "original unrelated\n");
    await harnessCommit(owner.worktreePath, "Original inputs");
    await fs.writeFile(path.join(owner.worktreePath, "result.txt"), "two\n");
    const target = await harnessCommit(owner.worktreePath, "Selected result");
    await fs.writeFile(path.join(owner.worktreePath, "result.txt"), "three\n");
    const beforeHead = await harnessCommit(owner.worktreePath, "Later result");
    const operationId = `git-revert-${"b".repeat(64)}`;
    const result = await service.revertExecution(owner, 1, { tool: "git_revert", mode: "apply", target, expectedHead: beforeHead }, operationId);
    expect(result).toMatchObject({ status: "conflicted", conflictPaths: ["result.txt"], currentHead: beforeHead });
    expect(await git(owner.worktreePath, ["rev-parse", "REVERT_HEAD"])).toBe(target);
    await fs.writeFile(path.join(owner.worktreePath, "keep.txt"), "retain unrelated change\n");
    await fs.writeFile(path.join(owner.worktreePath, "untracked.txt"), "retain untracked\n");
    const attemptId = `git-revert-${"c".repeat(64)}`;
    if (mode === "continue") {
      await expect(service.revertExecution(owner, 1, { tool: "git_revert", mode, operationId, expectedHead: beforeHead }, attemptId)).rejects.toThrow("Resolve and stage");
      await fs.writeFile(path.join(owner.worktreePath, "result.txt"), "one\n");
      await git(owner.worktreePath, ["add", "result.txt"]);
    }
    const settled = await service.revertExecution(owner, 1, { tool: "git_revert", mode, operationId, expectedHead: beforeHead }, `git-revert-${"d".repeat(64)}`);
    expect(settled).toMatchObject({ status: mode === "continue" ? "committed" : "aborted", beforeHead });
    expect(await fs.readFile(path.join(owner.worktreePath, "result.txt"), "utf8")).toBe(mode === "continue" ? "one\n" : "three\n");
    expect(await fs.readFile(path.join(owner.worktreePath, "keep.txt"), "utf8")).toBe("retain unrelated change\n");
    expect(await fs.readFile(path.join(owner.worktreePath, "untracked.txt"), "utf8")).toBe("retain untracked\n");
    expect(await git(owner.worktreePath, ["status", "--porcelain"])).not.toContain("UU");
    if (mode === "continue") expect(await git(owner.worktreePath, ["diff", "--name-only", beforeHead, "HEAD"])).toBe("result.txt");
    else expect(await git(owner.worktreePath, ["rev-parse", "HEAD"])).toBe(beforeHead);
  });

  it("aborts a revert refused by an existing untracked path without restoring or deleting that unrelated file", async () => {
    const { service, store } = await fixture();
    const owner = execution(service, store, "revert-collision", "worker");
    await service.createDeliveryWorktree(owner, 1, { kind: "main" });
    const file = path.join(owner.worktreePath, "result.txt");
    await fs.writeFile(file, "original committed result\n");
    await harnessCommit(owner.worktreePath, "Original result");
    await git(owner.worktreePath, ["rm", "result.txt"]);
    const target = await harnessCommit(owner.worktreePath, "Selected deletion");
    await fs.writeFile(file, "preexisting untracked notes\n");
    const operationId = `git-revert-${"8".repeat(64)}`;
    const applied = await service.revertExecution(owner, 1, { tool: "git_revert", mode: "apply", target, expectedHead: target }, operationId);
    expect(applied).toMatchObject({ status: "outcome_unknown", commandResult: { code: 128 } });
    const aborted = await service.revertExecution(owner, 1, { tool: "git_revert", mode: "abort", operationId, expectedHead: target }, `git-revert-${"7".repeat(64)}`);
    expect(aborted).toMatchObject({ status: "aborted", restoredFiles: [], retainedUntrackedPaths: ["result.txt"], afterHead: target });
    expect(await fs.readFile(file, "utf8")).toBe("preexisting untracked notes\n");
    expect(await git(owner.worktreePath, ["diff", "--cached", "--name-only"])).toBe("");
    expect(await git(owner.worktreePath, ["rev-parse", "HEAD"])).toBe(target);
    expect(store.records.get(operationId)?.status).toBe("failed");
  });

  it("reverts a verified merged source only in a new repair task and honors an explicitly selected second mainline parent", async () => {
    const { service, store, main } = await fixture();
    const original = execution(service, store, "original-source", "worker");
    await service.createDeliveryWorktree(original, 1, { kind: "main" });
    await fs.writeFile(path.join(original.worktreePath, "bad.txt"), "retract this\n");
    const sourceHead = await harnessCommit(original.worktreePath, "Original PR result");
    const baseline = execution(service, store, "target-baseline", "other");
    await service.createDeliveryWorktree(baseline, 1, { kind: "main" });
    await fs.writeFile(path.join(baseline.worktreePath, "keep.txt"), "keep this\n");
    const baseHead = await harnessCommit(baseline.worktreePath, "Direct target result");
    await git(original.worktreePath, ["merge", "--no-ff", baseHead, "-m", "Merge with explicit reversed parent order"]);
    const mergeCommitSha = await git(original.worktreePath, ["rev-parse", "HEAD"]);
    expect(await git(original.worktreePath, ["show", "-s", "--format=%P", mergeCommitSha])).toBe(`${sourceHead} ${baseHead}`);
    await service.createGroupBranch("repair-base", mergeCommitSha);
    store.authorities.delete(original.id);
    const repair = execution(service, store, "new-repair", "worker");
    await service.createDeliveryWorktree(repair, 1, { kind: "group", groupRunId: "repair-base" });
    const operationId = `git-revert-${"e".repeat(64)}`;
    const source = { sourceOperationId: "original-merge", providerNumber: 7, ownerExecutionId: original.id,
      headSha: sourceHead, base: "groups/repair-base", mergeCommitSha };
    const action = { tool: "git_revert", mode: "apply", target: mergeCommitSha, expectedHead: mergeCommitSha,
      sourceOperationId: source.sourceOperationId, mainline: 2 } as const;
    await expect(service.revertExecution(repair, 1, { ...action, mainline: 1 }, operationId, source)).rejects.toThrow("source does not authorize");
    await expect(service.revertExecution(repair, 1, { tool: "git_revert", mode: "apply", target: main.head, expectedHead: mergeCommitSha }, operationId)).rejects.toThrow();
    const result = await service.revertExecution(repair, 1, action, operationId, source);
    expect(result).toMatchObject({ status: "committed", beforeHead: mergeCommitSha });
    await expect(fs.stat(path.join(repair.worktreePath, "bad.txt"))).rejects.toMatchObject({ code: "ENOENT" });
    expect(await fs.readFile(path.join(repair.worktreePath, "keep.txt"), "utf8")).toBe("keep this\n");
    expect(await git(repair.worktreePath, ["show", `${sourceHead}:bad.txt`])).toBe("retract this");
    await expect(service.revertExecution(original, 1, action, operationId, source)).rejects.toThrow(GitOwnershipStaleError);
  });
  it("rejects imported predecessor commits as current-task targets and preserves a concurrent later stage outside the revert commit", async () => {
    const delegate = new ExecFileGitCommandRunner();
    let race: (() => Promise<void>) | undefined;
    const runner: GitCommandRunner = { run: async request => {
      if (request.args[0] === "commit-tree" && race) { const stage = race; race = undefined; await stage(); }
      return delegate.run(request);
    } };
    const { service, store } = await fixture(runner);
    const own = execution(service, store, "task-owner", "worker");
    const other = execution(service, store, "foreign-history", "other");
    await service.createDeliveryWorktree(own, 1, { kind: "main" });
    await service.createDeliveryWorktree(other, 1, { kind: "main" });
    await fs.writeFile(path.join(own.worktreePath, "result.txt"), "own original\n");
    await fs.writeFile(path.join(own.worktreePath, "later-stage.txt"), "original independent\n");
    await harnessCommit(own.worktreePath, "Own first result");
    await fs.writeFile(path.join(other.worktreePath, "foreign.txt"), "foreign predecessor\n");
    const foreignHead = await harnessCommit(other.worktreePath, "Other task result");
    await git(own.worktreePath, ["merge", "--no-ff", foreignHead, "-m", "Explicit baseline import"]);
    const importedHead = await git(own.worktreePath, ["rev-parse", "HEAD"]);
    await expect(service.revertExecution(own, 1, { tool: "git_revert", mode: "apply", target: foreignHead, expectedHead: importedHead },
      `git-revert-${"f".repeat(64)}`)).rejects.toThrow("commit from this task");
    expect(await git(own.worktreePath, ["rev-parse", "HEAD"])).toBe(importedHead);
    await fs.writeFile(path.join(own.worktreePath, "result.txt"), "own selected change\n");
    const target = await harnessCommit(own.worktreePath, "Own selected result", ["result.txt"]);
    race = async () => {
      await fs.writeFile(path.join(own.worktreePath, "later-stage.txt"), "keep concurrently staged change\n");
      await git(own.worktreePath, ["add", "later-stage.txt"]);
    };
    const reverted = await service.revertExecution(own, 1, { tool: "git_revert", mode: "apply", target, expectedHead: target }, `git-revert-${"9".repeat(64)}`);
    expect(reverted.status).toBe("committed");
    expect(await git(own.worktreePath, ["diff", "--name-only", target, "HEAD"])).toBe("result.txt");
    expect(await git(own.worktreePath, ["diff", "--cached", "--name-only"])).toBe("later-stage.txt");
    expect(await fs.readFile(path.join(own.worktreePath, "later-stage.txt"), "utf8")).toBe("keep concurrently staged change\n");
    expect(await fs.readFile(path.join(own.worktreePath, "foreign.txt"), "utf8")).toBe("foreign predecessor\n");
  });

  it("inspects stable real history and separately pages workspace, staged and revision differences without writes", async () => {
    const { service, store, main } = await fixture();
    const owner = execution(service, store, "inspect-1", "worker");
    await service.createDeliveryWorktree(owner, 1, { kind: "main" });
    await fs.writeFile(path.join(owner.worktreePath, "result.txt"), "原始结果\n");
    const first = await harnessCommit(owner.worktreePath, "First business result");
    await fs.writeFile(path.join(owner.worktreePath, "result.txt"), "第二次结果\n");
    const second = await harnessCommit(owner.worktreePath, "Second business result");
    const inspect = (request: Parameters<typeof service.inspectExecution>[3]) => service.inspectExecution(owner, 1, "main", request);
    const log = await inspect({ tool: "git_log", limit: 1 });
    expect(log).toMatchObject({ revision: second, nextOffset: 1, eof: false,
      commits: [{ sha: second, parents: [first], subject: "Second business result" }] });
    const older = await inspect({ tool: "git_log", revision: second, offset: 1, limit: 1 });
    expect(older).toMatchObject({ commits: [{ sha: first, parents: [main.head] }] });
    const shown = await inspect({ tool: "git_show", commit: second });
    expect(shown).toMatchObject({ commit: second, parents: [first], files: ["result.txt"], eof: true });
    expect(shown).toHaveProperty("content", expect.stringContaining("第二次结果"));
    await fs.writeFile(path.join(owner.worktreePath, "result.txt"), "已暂存\n");
    await git(owner.worktreePath, ["add", "result.txt"]);
    await fs.writeFile(path.join(owner.worktreePath, "result.txt"), "未暂存\n");
    const staged = await inspect({ tool: "git_diff", mode: "staged" });
    const workspace = await inspect({ tool: "git_diff", mode: "workspace" });
    expect(staged).toHaveProperty("content", expect.stringContaining("+已暂存"));
    expect(workspace).toHaveProperty("content", expect.stringContaining("+未暂存"));
    const beforeStatus = await git(owner.worktreePath, ["status", "--porcelain"]);
    const beforeIndex = await git(owner.worktreePath, ["write-tree"]);
    let page = await inspect({ tool: "git_diff", mode: "revisions", from: first, to: second, maxBytes: 7 });
    if (!("content" in page)) throw new Error("Missing patch page");
    let patch = page.content;
    while (!page.eof) {
      page = await inspect({ tool: "git_diff", mode: "revisions", from: first, to: second,
        offset: page.nextOffset, maxBytes: 7, expectedVersion: page.version });
      if (!("content" in page)) throw new Error("Missing patch continuation");
      patch += page.content;
    }
    expect(patch).toContain("第二次结果");
    expect(patch).not.toContain("�");
    expect(await git(owner.worktreePath, ["status", "--porcelain"])).toBe(beforeStatus);
    expect(await git(owner.worktreePath, ["write-tree"])).toBe(beforeIndex);
    expect(await git(owner.worktreePath, ["rev-parse", "HEAD"])).toBe(second);
    await expect(inspect({ tool: "git_diff", mode: "workspace", expectedVersion: "0".repeat(64) })).rejects.toThrow("version changed");
    await expect(inspect({ tool: "git_diff", mode: "workspace", expectedHead: first })).rejects.toThrow("HEAD changed");
    await expect(inspect({ tool: "git_show", commit: "HEAD~1" })).rejects.toThrow("complete commit SHA");
    store.authorities.set(owner.id, { epoch: 2, branch: owner.executionBranch });
    await expect(inspect({ tool: "git_log" })).rejects.toThrow(GitOwnershipStaleError);
  });
  it.each(["execution", "agent"] as const)("prepares a legacy %s repository without changing retained worktrees or business refs", async (mode) => {
    const { service, store, projectId, projectRoot } = await fixture(undefined, mode);
    const first = execution(service, store, "exec-legacy-first", "first");
    const sibling = execution(service, store, "exec-legacy-sibling", "sibling");
    if (mode === "agent") {
      first.worktreePath = service.canonicalAgentWorktree(first.agentId);
      sibling.worktreePath = service.canonicalAgentWorktree(sibling.agentId);
    }
    await service.createDeliveryWorktree(first, 1, { kind: "main" });
    await service.createDeliveryWorktree(sibling, 1, { kind: "main" });
    await fs.writeFile(path.join(first.worktreePath, "unfinished.txt"), "Keep my unfinished work\n");
    await fs.writeFile(path.join(sibling.worktreePath, "staged.txt"), "Keep the other Agent's staged work\n");
    await git(sibling.worktreePath, ["add", "staged.txt"]);
    const staged = await git(sibling.worktreePath, ["diff", "--cached"]);
    const refs = await git(service.repositoryPath, ["show-ref"]);
    const identities = { first: await git(first.worktreePath, ["rev-parse", "HEAD"]), sibling: await git(sibling.worktreePath, ["rev-parse", "HEAD"]) };
    await git(service.repositoryPath, ["config", "--unset", "extensions.worktreeConfig"]);
    for (const name of await fs.readdir(path.join(service.repositoryPath, "worktrees"))) {
      await fs.rm(path.join(service.repositoryPath, "worktrees", name, "config.worktree"), { force: true });
    }
    const resumed = new LocalCollaborationGitService({ projectId, projectRoot, operationStore: store, worktreeMode: mode, allowLocalRemotes: true });
    expect(await resumed.createDeliveryWorktree(first, 1, { kind: "main" })).toMatchObject({ worktreePath: first.worktreePath, head: identities.first });
    expect(await git(service.repositoryPath, ["config", "--get", "extensions.worktreeConfig"])).toBe("true");
    expect(await git(service.repositoryPath, ["rev-parse", "--is-bare-repository"])).toBe("true");
    expect(await git(sibling.worktreePath, ["rev-parse", "--is-bare-repository"])).toBe("false");
    expect(await git(sibling.worktreePath, ["diff", "--cached"])).toBe(staged);
    expect(await fs.readFile(path.join(first.worktreePath, "unfinished.txt"), "utf8")).toBe("Keep my unfinished work\n");
    expect(await git(service.repositoryPath, ["show-ref"])).toBe(refs);
    expect(await git(sibling.worktreePath, ["rev-parse", "HEAD"])).toBe(identities.sibling);
    expect(await resumed.createDeliveryWorktree(sibling, 1, { kind: "main" })).toMatchObject({ worktreePath: sibling.worktreePath, head: identities.sibling });
  });

  it("prepares management on a legacy bare repository before using per-worktree configuration", async () => {
    const { service } = await fixture(undefined, "agent");
    await git(service.repositoryPath, ["config", "--unset", "extensions.worktreeConfig"]);
    const management = await service.prepareAgentManagementWorkspace("main");
    expect(await git(management, ["rev-parse", "--is-bare-repository"])).toBe("false");
    expect(await git(management, ["branch", "--show-current"])).toBe("main");
    expect(await git(service.repositoryPath, ["rev-parse", "--is-bare-repository"])).toBe("true");
  });

  it("continues the exact repository preparation after an interrupted migration without losing staged work", async () => {
    const delegate = new ExecFileGitCommandRunner();
    let failEnable = false;
    const runner: GitCommandRunner = { run: async (request) => {
      if (failEnable && request.args.join(" ") === "config extensions.worktreeConfig true") {
        failEnable = false; throw new Error("Stopped before enabling worktree config");
      }
      return delegate.run(request);
    } };
    const { service, store } = await fixture(runner);
    const owner = execution(service, store, "exec-interrupted-config", "original");
    await service.createDeliveryWorktree(owner, 1, { kind: "main" });
    await fs.writeFile(path.join(owner.worktreePath, "staged.txt"), "Original stage\n");
    await git(owner.worktreePath, ["add", "staged.txt"]);
    const staged = await git(owner.worktreePath, ["diff", "--cached"]);
    const refs = await git(service.repositoryPath, ["show-ref"]);
    await git(service.repositoryPath, ["config", "--unset", "extensions.worktreeConfig"]);
    failEnable = true;
    await expect(service.createDeliveryWorktree(owner, 1, { kind: "main" })).rejects.toThrow("Stopped before enabling worktree config");
    expect(await git(service.repositoryPath, ["rev-parse", "--is-bare-repository"])).toBe("true");
    expect(await git(owner.worktreePath, ["rev-parse", "--is-bare-repository"])).toBe("false");
    await expect(service.createDeliveryWorktree(owner, 1, { kind: "main" })).resolves.toMatchObject({ worktreePath: owner.worktreePath });
    expect(await git(owner.worktreePath, ["diff", "--cached"])).toBe(staged);
    expect(await git(service.repositoryPath, ["show-ref"])).toBe(refs);
  });

  it.for(["symlink", "hardlink"] as const)("rejects a %s in legacy root worktree configuration before changing shared settings", async (kind, context) => {
    const { service, store, scratch } = await fixture();
    await git(service.repositoryPath, ["config", "--unset", "extensions.worktreeConfig"]);
    const target = path.join(service.repositoryPath, "config.worktree");
    await fs.rm(target, { force: true });
    const outside = path.join(scratch, "external-config");
    await fs.writeFile(outside, "[core]\n bare = false\n");
    if (kind === "symlink") {
      try { await fs.symlink(outside, target); } catch (error) {
        if (process.platform === "win32" && (error as NodeJS.ErrnoException).code === "EPERM") { context.skip(); return; }
        throw error;
      }
    } else await fs.link(outside, target);
    const commonBefore = await fs.readFile(path.join(service.repositoryPath, "config"));
    const owner = execution(service, store, `exec-${kind}-config`, "original");
    await expect(service.createDeliveryWorktree(owner, 1, { kind: "main" })).rejects.toThrow(/pinned regular file/);
    expect(await fs.readFile(outside, "utf8")).toBe("[core]\n bare = false\n");
    expect(await fs.readFile(path.join(service.repositoryPath, "config"))).toEqual(commonBefore);
  });

  it.each(["unchanged", "head_race", "remote_ahead"] as const)(
    "sends only the recorded commit to an actual local bare remote (%s)", async (mode) => {
      const delegate = new ExecFileGitCommandRunner();
      let race: { branch: string; head: string } | undefined;
      const pushed: string[] = [];
      const runner: GitCommandRunner = { run: async (request) => {
        if (request.args[0] === "push") {
          pushed.push(request.args.at(-1)!);
          if (race) { await git(request.cwd, ["update-ref", `refs/heads/${race.branch}`, race.head]); race = undefined; }
        }
        return delegate.run(request);
      } };
      const { scratch, service, store } = await fixture(runner);
      const remote = await attachRemote(scratch, service);
      const owner = execution(service, store, "original-push-owner", "worker");
      await service.createDeliveryWorktree(owner, 1, { kind: "main" });
      await fs.writeFile(path.join(owner.worktreePath, "result.txt"), "Original result\n");
      const head = await harnessCommit(owner.worktreePath, "feat: original result", ["result.txt"]);
      const record = await prepareOperation(store, { id: "legacy-original-push", kind: "git.push", ownerExecutionId: owner.id,
        ownershipEpoch: 1, expectedBase: owner.executionBranch, expectedHead: head }, { head });
      await store.transition({ id: record.id, payloadHash: record.payloadHash, status: "uncertain" });
      const original = await store.recordedOperation(record.id);
      let later: string | undefined;
      if (mode !== "unchanged") {
        await fs.writeFile(path.join(owner.worktreePath, "later.txt"), "Later commit\n");
        later = await harnessCommit(owner.worktreePath, "feat: later commit", ["later.txt"]);
        if (mode === "remote_ahead") await git(service.repositoryPath, ["push", remote, `${later}:refs/heads/${owner.executionBranch}`]);
        await git(owner.worktreePath, ["reset", "--hard", head]);
      }
      await fs.writeFile(path.join(owner.worktreePath, "unfinished.txt"), "Retain my dirty note\n");
      if (mode === "head_race") race = { branch: owner.executionBranch, head: later! };
      const retry = service.pushRetainedExecution(owner, 1, record.id, head);
      if (mode === "remote_ahead") await expect(retry).rejects.toThrow();
      else expect(await retry).toBe(head);
      expect(pushed.at(-1)).toBe(`${head}:refs/heads/${owner.executionBranch}`);
      expect(await git(remote, ["rev-parse", `refs/heads/${owner.executionBranch}`])).toBe(mode === "remote_ahead" ? later : head);
      expect(await git(owner.worktreePath, ["rev-parse", "HEAD"])).toBe(mode === "head_race" ? later : head);
      expect(await fs.readFile(path.join(owner.worktreePath, "unfinished.txt"), "utf8")).toBe("Retain my dirty note\n");
      expect(await store.recordedOperation(record.id)).toEqual(original);
      expect([...store.records.keys()].filter((key) => key !== record.id)).toEqual([]);
    });

  it("reuses one clean Agent worktree for distinct execution branches without moving the old ref", async () => {
    const { service, store, main } = await fixture(undefined, "agent");
    const agentId = "analyst";
    const worktreePath = service.canonicalAgentWorktree(agentId);
    const first = { ...execution(service, store, "exec-first", agentId), worktreePath };
    const firstWorktree = await service.createDeliveryWorktree(first, 1, { kind: "main" });
    expect(firstWorktree.worktreePath).toBe(worktreePath);
    await fs.writeFile(path.join(worktreePath, "result.txt"), "first result\n", "utf8");
    const firstHead = await harnessCommit(worktreePath, "First Agent result", ["result.txt"]);

    const second = { ...execution(service, store, "exec-second", agentId), worktreePath };
    const secondWorktree = await service.createDeliveryWorktree(second, 1, { kind: "main" });
    expect(secondWorktree.worktreePath).toBe(worktreePath);
    expect(secondWorktree.head).toBe(main.head);
    expect(await git(worktreePath, ["branch", "--show-current"])).toBe(second.executionBranch);
    expect(await git(service.repositoryPath, ["rev-parse", `refs/heads/${first.executionBranch}`])).toBe(firstHead);
    expect(await fs.stat(path.join(worktreePath, "result.txt")).then(() => true, () => false)).toBe(false);
    expect(await service.createDeliveryWorktree(second, 1, { kind: "main" }))
      .toMatchObject({ worktreePath, head: main.head });

    await fs.writeFile(path.join(worktreePath, "unfinished.txt"), "do not overwrite\n", "utf8");
    const third = { ...execution(service, store, "exec-third", agentId), worktreePath };
    await expect(service.createDeliveryWorktree(third, 1, { kind: "main" }))
      .rejects.toThrow(/dirty/);
    expect(await git(worktreePath, ["branch", "--show-current"])).toBe(second.executionBranch);
    expect(await fs.readFile(path.join(worktreePath, "unfinished.txt"), "utf8"))
      .toBe("do not overwrite\n");
  });

  it("keeps separate Agents isolated and reuses one Agent folder after final integration release", async () => {
    const { service, store, main } = await fixture(undefined, "agent");
    await service.createGroupBranch("group-fixed", main.head);
    const firstPath = service.canonicalAgentWorktree("member-a");
    const first = { ...execution(service, store, "exec-a-first", "member-a", 1, "delivery", "group-fixed"),
      worktreePath: firstPath };
    await service.createDeliveryWorktree(first, 1, { kind: "group", groupRunId: "group-fixed" });
    await fs.writeFile(path.join(firstPath, "member-a.txt"), "A\n", "utf8");
    const firstHead = await harnessCommit(firstPath, "Member A delivery", ["member-a.txt"]);

    const secondPath = service.canonicalAgentWorktree("member-b");
    const second = { ...execution(service, store, "exec-b-first", "member-b", 1, "delivery", "group-fixed"),
      worktreePath: secondPath };
    await service.createDeliveryWorktree(second, 1, { kind: "group", groupRunId: "group-fixed" });
    expect(secondPath).not.toBe(firstPath);
    expect(await git(secondPath, ["branch", "--show-current"])).toBe(second.executionBranch);

    const final = { ...execution(service, store, "exec-a-final", "member-a", 1, "final-integration", "group-fixed"),
      worktreePath: firstPath };
    await service.createFinalIntegrationWorktree(final, 1, "group-fixed");
    expect(await git(firstPath, ["branch", "--show-current"])).toBe(service.groupBranch("group-fixed"));
    await service.releaseFinalIntegrationWorktree(final, 1);
    expect(await git(firstPath, ["rev-parse", "--abbrev-ref", "HEAD"])).toBe("HEAD");

    const next = { ...execution(service, store, "exec-a-next", "member-a"), worktreePath: firstPath };
    await service.createDeliveryWorktree(next, 1, { kind: "main" });
    expect(await git(firstPath, ["branch", "--show-current"])).toBe(next.executionBranch);
    expect(await git(service.repositoryPath, ["rev-parse", `refs/heads/${first.executionBranch}`])).toBe(firstHead);
    expect(await git(secondPath, ["branch", "--show-current"])).toBe(second.executionBranch);
  });

  it("uses a legal Unicode Agent identity consistently for its fixed folder and memory", async () => {
    const { service, store } = await fixture(undefined, "agent");
    const agentId = "研究员甲";
    const worktreePath = service.canonicalAgentWorktree(agentId);
    const delivery = { ...execution(service, store, "exec-unicode", agentId), worktreePath };
    await service.createDeliveryWorktree(delivery, 1, { kind: "main" });
    expect(await git(worktreePath, ["config", "--worktree", "user.name"]))
      .toBe(`OpenFARS Agent ${agentId}`);
    const memory = await service.commitManagementMemory(agentId, "op-unicode-memory", "# Memory\n\nA safe note.\n");
    expect(memory.entries.map((entry) => entry.agentId)).toContain(agentId);
    expect(await git(service.repositoryPath, ["show", `management/memory:agent-memory/${agentId}/Memory.md`]))
      .toBe("# Memory\n\nA safe note.");
    expect(() => service.canonicalAgentWorktree("../escape")).toThrow(/unsafe/i);
  });

  it("reuses the fixed Agent checkout and retained branch refs after a Git service restart", async () => {
    const { service, store, main, projectId, projectRoot } = await fixture(undefined, "agent");
    const agentId = "analyst";
    const worktreePath = service.canonicalAgentWorktree(agentId);
    const first = { ...execution(service, store, "exec-before-restart", agentId), worktreePath };
    await service.createDeliveryWorktree(first, 1, { kind: "main" });
    await fs.writeFile(path.join(worktreePath, "before.txt"), "persisted\n", "utf8");
    const firstHead = await harnessCommit(worktreePath, "Before restart", ["before.txt"]);

    const restarted = new LocalCollaborationGitService({
      projectId,
      projectRoot,
      operationStore: store,
      worktreeMode: "agent",
      allowLocalRemotes: true,
      now: () => "2026-09-22T00:00:00.000Z"
    });
    const second = { ...execution(restarted, store, "exec-after-restart", agentId), worktreePath };
    const opened = await restarted.createDeliveryWorktree(second, 1, { kind: "main" });
    expect(opened).toMatchObject({ worktreePath, head: main.head });
    expect(await git(worktreePath, ["branch", "--show-current"])).toBe(second.executionBranch);
    expect(await git(restarted.repositoryPath, ["rev-parse", `refs/heads/${first.executionBranch}`]))
      .toBe(firstHead);

    const resumed = await restarted.createDeliveryWorktree(first, 1, { kind: "main" });
    expect(resumed).toMatchObject({ worktreePath, head: firstHead });
    expect(await fs.readFile(path.join(worktreePath, "before.txt"), "utf8")).toBe("persisted\n");
  });

  it("reattaches an execution branch left behind by a failed initial preparation", async () => {
    const { service, store, main } = await fixture();
    const owner = execution(service, store, "exec-preparation-retry", "worker");
    const branch = owner.executionBranch;
    await git(service.repositoryPath, ["branch", branch, main.head]);

    const attached = await service.createDeliveryWorktree(owner, 1, { kind: "main" });
    expect(attached).toMatchObject({ worktreePath: owner.worktreePath, branch, head: main.head });
    expect(await git(owner.worktreePath, ["branch", "--show-current"])).toBe(branch);
  });

  it("rejects an unattached execution branch whose head is not its verified preparation base", async () => {
    const { service, store, main } = await fixture();
    const owner = execution(service, store, "exec-preparation-diverged", "worker");
    const later = await git(service.repositoryPath, ["-c", "user.name=Fixture", "-c", "user.email=fixture@example.test",
      "commit-tree", main.head + "^{tree}", "-p", main.head, "-m", "diverged"]);
    await git(service.repositoryPath, ["branch", owner.executionBranch, later]);

    await expect(service.createDeliveryWorktree(owner, 1, { kind: "main" }))
      .rejects.toThrow(/verified activation base/);
    expect(await fs.stat(owner.worktreePath).then(() => true, () => false)).toBe(false);
  });

  it("bases a child group only on its direct parent's current local branch", async () => {
    const { service, main } = await fixture();
    const parent = await service.createGroupBranch("parent", main.head);
    await expect(service.createGroupBranch("child", main.head, undefined, parent.branch)).resolves.toMatchObject({
      branch: "groups/child",
      baseCommit: main.head
    });
    await expect(service.createGroupBranch("missing-parent", main.head, undefined, "groups/missing"))
      .rejects.toThrow(/Required Git ref is missing/);
    await expect(service.createGroupBranch("invalid-target", main.head, undefined, "executions/worker"))
      .rejects.toThrow(/fixed merge-target namespace/);
  });

  it("retains the same checkout for Main and for a business Agent's management turns without resetting dirty evidence", async () => {
    const { service, store } = await fixture(undefined, "agent");
    const main = await service.prepareAgentManagementWorkspace("main");
    expect(main).toBe(service.canonicalAgentWorktree("main"));
    expect(await git(main, ["branch", "--show-current"])).toBe("main");
    const agent = await service.prepareAgentManagementWorkspace("analyst");
    const member = { ...execution(service, store, "exec-management-switch", "analyst"), worktreePath: agent };
    await service.createDeliveryWorktree(member, 1, { kind: "main" });
    await fs.writeFile(path.join(agent, "unfinished.txt"), "retained evidence\n");
    expect(await service.prepareAgentManagementWorkspace("analyst")).toBe(agent);
    expect(await git(agent, ["branch", "--show-current"])).toBe(member.executionBranch);
    expect(await fs.readFile(path.join(agent, "unfinished.txt"), "utf8")).toBe("retained evidence\n");
    expect(await service.prepareAgentManagementWorkspace("main")).toBe(main);
    expect(await git(main, ["branch", "--show-current"])).toBe("main");
  });

  it("reports Main's exact pending entries and owner before a remote merge, preserving all work", async () => {
    const { service } = await fixture(undefined, "agent");
    const main = await service.prepareAgentManagementWorkspace("main");
    await fs.writeFile(path.join(main, "final-manifest.json"), "retained process evidence\n");
    const before = await git(main, ["status", "--porcelain=v1"]);
    const error = await service.assertRemoteMergeTargetAvailable("main").catch(error => error);
    expect(error).toBeInstanceOf(GitInputError);
    expect(error).toMatchObject({ publicData: { blocker: "TARGET_WORKTREE_DIRTY", targetAgentId: "main", targetBranch: "main",
      pendingEntries: ["?? final-manifest.json"] } });
    expect(error.message).toContain("final-manifest.json");
    expect(await git(main, ["status", "--porcelain=v1"])).toBe(before);
    expect(await fs.readFile(path.join(main, "final-manifest.json"), "utf8")).toBe("retained process evidence\n");
  });

  it("rejects an unregistered foreign or symlinked management checkout", async () => {
    const { service } = await fixture(undefined, "agent");
    const checkout = await service.prepareAgentManagementWorkspace("analyst");
    await fs.rename(checkout, `${checkout}-original`);
    await fs.symlink(`${checkout}-original`, checkout, process.platform === "win32" ? "junction" : "dir");
    await expect(service.prepareAgentManagementWorkspace("analyst")).rejects.toThrow(/real directory|symbolic|symlink/i);
  });

  it("relocates the legacy service workflow mount while retaining uncommitted business files", async () => {
    const { service } = await fixture(undefined, "agent");
    const workspace = await service.prepareAgentManagementWorkspace("main");
    const workflow = path.join(service.projectRoot, "workflow");
    await fs.mkdir(workflow, { recursive: true });
    await fs.symlink(workflow, path.join(workspace, "workflow"), process.platform === "win32" ? "junction" : "dir");
    await service.prepareAgentManagementWorkspace("main");
    expect(await fs.realpath(path.join(service.projectRoot, "agent-inputs", "main", "legacy-workflow-link"))).toBe(workflow);
    expect(await git(workspace, ["status", "--porcelain=v1", "--untracked-files=all"])).toBe("");
    await fs.writeFile(path.join(workspace, "unfinished.txt"), "retained business work\n");
    expect(await git(workspace, ["status", "--porcelain=v1", "--untracked-files=all"]))
      .toBe("?? unfinished.txt");
  });

  it("reopens a retained group branch that advanced from its activation base", async () => {
    const { service, main } = await fixture();
    const groupRunId = "group-restart";
    const branch = service.groupBranch(groupRunId);
    await service.createGroupBranch(groupRunId, main.head);
    const tree = await git(main.repositoryPath, ["rev-parse", `${main.head}^{tree}`]);
    const advancedResult = await execFileAsync(
      "git",
      [
        "-c",
        "core.hooksPath=/dev/null",
        "commit-tree",
        tree,
        "-p",
        main.head,
        "-m",
        "Advance retained group"
      ],
      {
        cwd: main.repositoryPath,
        encoding: "utf8",
        env: {
          ...process.env,
          GIT_AUTHOR_NAME: "OpenFARS Test",
          GIT_AUTHOR_EMAIL: "test@localhost",
          GIT_COMMITTER_NAME: "OpenFARS Test",
          GIT_COMMITTER_EMAIL: "test@localhost"
        }
      }
    );
    const advanced = advancedResult.stdout.trim();
    await git(main.repositoryPath, [
      "update-ref",
      `refs/heads/${branch}`,
      advanced,
      main.head
    ]);

    await expect(service.createGroupBranch(groupRunId, main.head)).resolves.toEqual({
      groupRunId,
      branch,
      baseCommit: main.head
    });
    expect(await git(main.repositoryPath, ["rev-parse", `refs/heads/${branch}`])).toBe(advanced);
  });

  it("keeps parallel member worktrees isolated and makes the owner resolve a same-line conflict", async () => {
    const { scratch, service, store, main } = await fixture();
    const remote = await attachRemote(scratch, service);
    const group = await service.createGroupBranch("group-1", main.head);
    await service.pushGroup("group-1");
    const a = execution(service, store, "exec-a", "analyst-a");
    const b = execution(service, store, "exec-b", "analyst-b");
    await Promise.all([
      service.createDeliveryWorktree(a, 1, { kind: "group", groupRunId: "group-1" }),
      service.createDeliveryWorktree(b, 1, { kind: "group", groupRunId: "group-1" })
    ]);
    await Promise.all([
      fs.writeFile(path.join(a.worktreePath, "README.md"), "# A result\n", "utf8"),
      fs.writeFile(path.join(b.worktreePath, "README.md"), "# B result\n", "utf8")
    ]);
    const aMessage = [
      "[analyst-a] 完成任务：验证并行证据",
      "",
      "OpenFARS-Agent: analyst-a",
      "OpenFARS-Agent-Role: delivery",
      "OpenFARS-Execution: exec-a",
      "OpenFARS-Task: task-a",
      "OpenFARS-Group: group-1",
      "OpenFARS-Reason: 完成验证并自检"
    ].join("\n");
    await Promise.all([
      harnessCommit(a.worktreePath, aMessage, ["README.md"]),
      harnessCommit(b.worktreePath, "Harness B delivery", ["README.md"])
    ]);
    const [aCommit, bCommit] = await Promise.all([
      service.checkpointExecution(a, 1, {
        kind: "report",
        operationMarker: "op-a",
        taskId: "task-a",
        taskTitle: "验证并行证据",
        reason: "完成验证并自检"
      }),
      service.checkpointExecution(b, 1, { kind: "report", operationMarker: "op-b" })
    ]);
    const aCommitIdentity = await git(service.repositoryPath, [
      "show",
      "-s",
      "--format=%an%n%ae%n%cn%n%B",
      aCommit.commitSha
    ]);
    expect(aCommitIdentity).toContain("Harness Agent\n");
    expect(aCommitIdentity).toContain("harness@example.test\n");
    expect(aCommitIdentity).toContain("[analyst-a] 完成任务：验证并行证据");
    expect(aCommitIdentity).toContain("OpenFARS-Agent: analyst-a");
    expect(aCommitIdentity).toContain("OpenFARS-Agent-Role: delivery");
    expect(aCommitIdentity).toContain("OpenFARS-Execution: exec-a");
    expect(aCommitIdentity).toContain("OpenFARS-Task: task-a");
    expect(aCommitIdentity).toContain("OpenFARS-Group: group-1");
    expect(aCommitIdentity).toContain("OpenFARS-Reason: 完成验证并自检");
    expect(aCommit.changed).toBe(true);
    expect(aCommit.commitSha).toBe(await git(a.worktreePath, ["rev-parse", "HEAD"]));
    await Promise.all([
      service.pushExecution(a, 1),
      service.pushExecution(b, 1)
    ]);

    const first = await service.integrateExecutionIntoGroup(
      a,
      1,
      "group-1",
      aCommit.commitSha,
      group.baseCommit
    );
    expect(first.status).toBe("mergeable");
    const firstSynchronized = await providerMergeAndSynchronize({
      service,
      remote,
      operationId: "merge-a-group",
      sourceBranch: a.executionBranch,
      targetBranch: group.branch
    });
    expect(firstSynchronized.status).toBe("synchronized");
    const conflict = await service.integrateExecutionIntoGroup(
      b,
      1,
      "group-1",
      bCommit.commitSha,
      firstSynchronized.localHeadAfter
    );
    expect(conflict.status).toBe("conflicted");
    expect(conflict.conflictPaths).toContain("README.md");

    const ownerResolution = await service.prepareOwnerResolution(
      b,
      1,
      {
        kind: "group",
        groupRunId: "group-1",
        expectedHead: firstSynchronized.localHeadAfter
      }
    );
    expect(ownerResolution.status).toBe("conflicted");
    expect(ownerResolution.conflictPaths).toEqual(["README.md"]);
    await fs.writeFile(
      path.join(b.worktreePath, "README.md"),
      "# Combined result\n\n- A result\n- B result\n",
      "utf8"
    );
    await harnessCommit(b.worktreePath, "Resolve README conflict", ["README.md"]);
    const resolved = await service.checkpointExecution(b, 1, {
      kind: "conflict-resolution",
      operationMarker: "op-b-resolution"
    });
    expect(await git(service.repositoryPath, ["rev-parse", `${resolved.commitSha}^1`]))
      .toBe(bCommit.commitSha);
    expect(await git(service.repositoryPath, ["rev-parse", `${resolved.commitSha}^2`]))
      .toBe(firstSynchronized.localHeadAfter);
    await expect(execFileAsync(
      "git",
      ["rev-parse", "--verify", "--quiet", "MERGE_HEAD"],
      { cwd: b.worktreePath, encoding: "utf8" }
    )).rejects.toThrow();
    await expect(execFileAsync(
      "git",
      ["rev-parse", "--verify", "--quiet", "AUTO_MERGE"],
      { cwd: b.worktreePath, encoding: "utf8" }
    )).rejects.toThrow();
    expect(await git(b.worktreePath, ["status", "--short", "--untracked-files=all"]))
      .toBe("");
    await service.pushExecution(b, 1);
    const integrated = await service.integrateExecutionIntoGroup(
      b,
      1,
      "group-1",
      resolved.commitSha,
      firstSynchronized.localHeadAfter
    );
    expect(integrated.status).toBe("mergeable");
    const integratedSync = await providerMergeAndSynchronize({
      service,
      remote,
      operationId: "merge-b-group",
      sourceBranch: b.executionBranch,
      targetBranch: group.branch
    });
    const replay = await service.integrateExecutionIntoGroup(
      b,
      1,
      "group-1",
      resolved.commitSha,
      integratedSync.localHeadAfter
    );
    expect(replay.status).toBe("already_integrated");
    expect(await git(service.repositoryPath, ["show", `${integratedSync.localHeadAfter}:README.md`]))
      .toContain("A result");
    expect(await git(service.repositoryPath, ["show", `${integratedSync.localHeadAfter}:README.md`]))
      .toContain("B result");
  }, 30_000);

  it("retains cancelled evidence, bases a successor on it, and fences the predecessor epoch", async () => {
    const { service, store, main } = await fixture();
    await service.createGroupBranch("group-1", main.head);
    const predecessor = execution(service, store, "exec-old", "writer-a");
    await service.createDeliveryWorktree(
      predecessor,
      1,
      { kind: "group", groupRunId: "group-1" }
    );
    await fs.writeFile(path.join(predecessor.worktreePath, "partial.md"), "retained evidence\n", "utf8");
    await harnessCommit(predecessor.worktreePath, "Retain partial evidence", ["partial.md"]);
    const partial = await service.checkpointExecution(predecessor, 1, {
      kind: "checkpoint",
      operationMarker: "op-partial"
    });
    const retained = await service.observeRetainedExecution(predecessor, 1);
    expect(retained.retained).toBe(true);
    expect(await fs.readFile(path.join(retained.worktreePath, "partial.md"), "utf8"))
      .toBe("retained evidence\n");

    store.authorities.set(predecessor.id, {
      epoch: 2,
      branch: predecessor.executionBranch
    });
    await expect(service.checkpointExecution(predecessor, 1, { kind: "checkpoint" }))
      .rejects.toBeInstanceOf(GitOwnershipStaleError);

    const successor = execution(service, store, "exec-successor", "writer-b", 2);
    await service.createDeliveryWorktree(
      successor,
      2,
      { kind: "commit", commitSha: partial.commitSha }
    );
    expect(await fs.readFile(path.join(successor.worktreePath, "partial.md"), "utf8"))
      .toBe("retained evidence\n");
    expect(await fs.stat(predecessor.worktreePath)).toMatchObject({});
  });

  it("restores a missing retained execution base before checkpointing and pushing its existing commit", async () => {
    const { scratch, service, store, main } = await fixture();
    const remote = await attachRemote(scratch, service);
    const owner = execution(service, store, "exec-missing-base", "writer");
    await service.createDeliveryWorktree(owner, 1, { kind: "main" });
    await fs.writeFile(path.join(owner.worktreePath, "retained-result.txt"), "retained result\n", "utf8");
    const authored = await harnessCommit(owner.worktreePath, "Retained business result", ["retained-result.txt"]);

    await git(service.repositoryPath, ["update-ref", "-d", service.executionBaseRef(owner.id)]);
    await expect(service.checkpointExecution(owner, 1, { kind: "report" }))
      .rejects.toThrow("Required Git ref is missing");

    expect(await service.restoreRetainedExecutionBase(owner, 1, [main.head])).toBe(main.head);
    const checkpoint = await service.checkpointExecution(owner, 1, { kind: "report" });
    expect(checkpoint).toMatchObject({ commitSha: authored, changed: true });
    expect(await service.pushExecution(owner, 1)).toBe(authored);
    expect(await git(remote, ["rev-parse", `refs/heads/${owner.executionBranch}`])).toBe(authored);
  });

  it.each(["missing", "existing", "no_base", "unrelated_base", "concurrent", "stale_owner", "wrong_branch"] as const)(
    "restores only missing trusted metadata and preserves retained work (%s)", async mode => {
      const { service, store, main } = await fixture();
      const owner = execution(service, store, "retained-base-guard", "writer");
      await service.createDeliveryWorktree(owner, 1, { kind: "main" });
      await fs.writeFile(path.join(owner.worktreePath, "result.txt"), "Agent authored result\n");
      const head = await harnessCommit(owner.worktreePath, "Original result", ["result.txt"]);
      await fs.writeFile(path.join(owner.worktreePath, "unfinished.txt"), "Keep original memory and files\n");
      const before = await git(owner.worktreePath, ["status", "--porcelain"]);
      const ref = service.executionBaseRef(owner.id);
      if (mode !== "existing") await git(service.repositoryPath, ["update-ref", "-d", ref]);
      let candidates = mode === "no_base" || mode === "existing" ? [] : [main.head];
      if (mode === "unrelated_base") candidates = [await git(service.repositoryPath,
        ["-c", "user.name=Fixture", "-c", "user.email=fixture@example.test", "commit-tree",
          await git(service.repositoryPath, ["rev-parse", `${head}^{tree}`]), "-p", head, "-m", "Not an ancestor"] )];
      if (mode === "stale_owner") store.authorities.set(owner.id, { epoch: 2, branch: owner.executionBranch });
      if (mode === "wrong_branch") owner.executionBranch = "executions/another-task";
      if (["no_base", "unrelated_base", "stale_owner", "wrong_branch"].includes(mode)) {
        await expect(service.restoreRetainedExecutionBase(owner, 1, candidates)).rejects.toThrow();
        await expect(git(service.repositoryPath, ["rev-parse", "--verify", ref])).rejects.toThrow();
      } else {
        const results = await Promise.all(Array.from({ length: mode === "concurrent" ? 2 : 1 }, () =>
          service.restoreRetainedExecutionBase(owner, 1, candidates)));
        expect(results).toEqual(mode === "concurrent" ? [main.head, main.head] : [main.head]);
        expect(await service.restoreRetainedExecutionBase(owner, 1, [head])).toBe(main.head);
        expect(await git(service.repositoryPath, ["rev-parse", ref])).toBe(main.head);
      }
      expect(await git(owner.worktreePath, ["rev-parse", "HEAD"])).toBe(head);
      expect(await git(owner.worktreePath, ["symbolic-ref", "--short", "HEAD"])).toBe(service.deliveryBranch(owner.id));
      expect(await git(owner.worktreePath, ["status", "--porcelain"])).toBe(before);
      expect(await fs.readFile(path.join(owner.worktreePath, "unfinished.txt"), "utf8")).toBe("Keep original memory and files\n");
    });

  it("requires a member-owned repair branch for a final main/group conflict", async () => {
    const { scratch, service, store, main } = await fixture();
    const remote = await attachRemote(scratch, service);
    await service.createGroupBranch("group-final", main.head);
    await service.pushGroup("group-final");
    const groupMember = execution(service, store, "exec-group", "member-a", 1, "delivery", "group-final");
    await service.createDeliveryWorktree(
      groupMember,
      1,
      { kind: "group", groupRunId: "group-final" }
    );
    await fs.writeFile(path.join(groupMember.worktreePath, "README.md"), "# Group version\n", "utf8");
    await harnessCommit(groupMember.worktreePath, "Group member change", ["README.md"]);
    const groupCommit = await service.checkpointExecution(groupMember, 1, {
      kind: "report",
      operationMarker: "op-group-change"
    });
    await service.pushExecution(groupMember, 1);
    const groupMerged = await service.integrateExecutionIntoGroup(
      groupMember,
      1,
      "group-final",
      groupCommit.commitSha,
      main.head
    );
    expect(groupMerged.status).toBe("mergeable");
    const groupSynchronized = await providerMergeAndSynchronize({
      service,
      remote,
      operationId: "member-pr-to-group",
      sourceBranch: groupMember.executionBranch,
      targetBranch: service.groupBranch("group-final")
    });

    const ordinary = execution(service, store, "exec-main", "ordinary-agent", 1, "delivery", "group-final");
    await service.createDeliveryWorktree(ordinary, 1, { kind: "main" });
    await fs.writeFile(path.join(ordinary.worktreePath, "README.md"), "# Main version\n", "utf8");
    await harnessCommit(ordinary.worktreePath, "Main branch change", ["README.md"]);
    const mainCommit = await service.checkpointExecution(ordinary, 1, {
      kind: "report",
      operationMarker: "op-main-change"
    });
    await service.pushExecution(ordinary, 1);
    const mainMerged = await service.integrateExecutionIntoMain(
      ordinary,
      1,
      mainCommit.commitSha,
      main.head
    );
    expect(mainMerged.status).toBe("mergeable");
    const mainSynchronized = await providerMergeAndSynchronize({
      service,
      remote,
      operationId: "independent-pr-to-main",
      sourceBranch: ordinary.executionBranch,
      targetBranch: "main"
    });

    const finalOwner = execution(
      service,
      store,
      "exec-final",
      "member-a",
      1,
      "final-integration",
      "group-final"
    );
    await service.createFinalIntegrationWorktree(
      finalOwner,
      1,
      "group-final"
    );
    const finalConflict = await service.integrateGroupIntoMain(
      finalOwner,
      1,
      "group-final",
      groupSynchronized.localHeadAfter,
      mainSynchronized.localHeadAfter
    );
    expect(finalConflict.status).toBe("conflicted");

    const repair = execution(service, store, "exec-repair", "member-a", 2, "delivery", "group-final");
    await service.createDeliveryWorktree(
      repair,
      2,
      { kind: "group", groupRunId: "group-final" }
    );
    const prepared = await service.prepareOwnerResolution(
      repair,
      2,
      { kind: "main", expectedHead: mainSynchronized.localHeadAfter }
    );
    expect(prepared.status).toBe("conflicted");
    await fs.writeFile(
      path.join(repair.worktreePath, "README.md"),
      "# Integrated main and group\n",
      "utf8"
    );
    await harnessCommit(repair.worktreePath, "Resolve final integration conflict", ["README.md"]);
    const repairCommit = await service.checkpointExecution(repair, 2, {
      kind: "conflict-resolution",
      operationMarker: "op-final-repair"
    });
    await service.pushExecution(repair, 2);
    const repairedGroup = await service.integrateExecutionIntoGroup(
      repair,
      2,
      "group-final",
      repairCommit.commitSha,
      groupSynchronized.localHeadAfter
    );
    expect(repairedGroup.status).toBe("mergeable");
    await expect(service.assertRemoteMergeTargetAvailable(
      service.groupBranch("group-final")
    )).rejects.toThrow("frozen");
    await expect(service.assertRemoteMergeTargetAvailable(
      service.groupBranch("group-final"),
      { execution: finalOwner, ownershipEpoch: 1 }
    )).resolves.toBeUndefined();
    const repairedGroupSync = await providerMergeAndSynchronize({
      service,
      remote,
      operationId: "repair-pr-to-group",
      sourceBranch: repair.executionBranch,
      targetBranch: service.groupBranch("group-final"),
      checkedOutTarget: { execution: finalOwner, ownershipEpoch: 1 }
    });
    const completed = await service.integrateGroupIntoMain(
      finalOwner,
      1,
      "group-final",
      repairedGroupSync.localHeadAfter,
      mainSynchronized.localHeadAfter
    );
    expect(completed.status).toBe("mergeable");
    await service.pushGroup("group-final");
    const completedSync = await providerMergeAndSynchronize({
      service,
      remote,
      operationId: "final-group-pr-to-main",
      sourceBranch: service.groupBranch("group-final"),
      targetBranch: "main"
    });
    expect(completedSync.status).toBe("synchronized");
    const historicalGroupHead = await git(
      service.repositoryPath,
      ["rev-parse", `refs/heads/${service.groupBranch("group-final")}`]
    );
    const historicalReadme = await git(
      service.repositoryPath,
      ["show", `${historicalGroupHead}:README.md`]
    );
    const failedEvidencePath = path.join(finalOwner.worktreePath, "failed-final-evidence.txt");
    await fs.writeFile(failedEvidencePath, "staged evidence\n", "utf8");
    await git(finalOwner.worktreePath, ["add", "failed-final-evidence.txt"]);
    await fs.appendFile(failedEvidencePath, "unstaged conflict evidence\n", "utf8");
    expect(await git(finalOwner.worktreePath, ["status", "--porcelain"]))
      .toContain("AM failed-final-evidence.txt");
    await service.releaseFailedFinalIntegrationWorktree(finalOwner, 1);
    expect(await git(finalOwner.worktreePath, ["rev-parse", "--abbrev-ref", "HEAD"]))
      .toBe("HEAD");
    expect(await fs.readFile(failedEvidencePath, "utf8"))
      .toBe("staged evidence\nunstaged conflict evidence\n");
    expect(await git(finalOwner.worktreePath, ["status", "--porcelain"]))
      .toContain("AM failed-final-evidence.txt");
    await expect(service.assertRemoteMergeTargetAvailable(
      service.groupBranch("group-final")
    )).resolves.toBeUndefined();
    expect(await git(
      service.repositoryPath,
      ["show", `${historicalGroupHead}:README.md`]
    )).toBe(historicalReadme);

    // A stop-confirmed final owner is retained detached. Its successor gets a
    // fresh final-repair branch/worktree rather than attempting to check out
    // the still-preserved group branch a second time.
    const successorSeed = execution(
      service,
      store,
      "exec-final-successor",
      "member-b",
      2,
      "final-integration",
      "group-final"
    );
    const finalSuccessor: GitExecutionAuthority = {
      ...successorSeed,
      executionBranch: service.deliveryBranch(successorSeed.id)
    };
    store.authorities.set(finalSuccessor.id, {
      epoch: 2,
      branch: finalSuccessor.executionBranch
    });
    const successorWorktree = await service.createFinalIntegrationWorktree(
      finalSuccessor,
      2,
      "group-final"
    );
    expect(successorWorktree.branch).toBe(`executions/${finalSuccessor.id}`);
    expect(await git(finalSuccessor.worktreePath, ["rev-parse", "--abbrev-ref", "HEAD"]))
      .toBe(finalSuccessor.executionBranch);
    await fs.writeFile(
      path.join(finalSuccessor.worktreePath, "handoff-proof.md"),
      "continued from retained final integration evidence\n",
      "utf8"
    );
    await harnessCommit(finalSuccessor.worktreePath, "Continue final integration", ["handoff-proof.md"]);
    const successorCheckpoint = await service.checkpointExecution(finalSuccessor, 2, {
      kind: "checkpoint",
      operationMarker: "op-final-successor"
    });
    expect(await service.pushExecution(finalSuccessor, 2))
      .toBe(successorCheckpoint.commitSha);
    const successorMergedIntoGroup = await providerMergeAndSynchronize({
      service,
      remote,
      operationId: "final-successor-pr-to-group",
      sourceBranch: finalSuccessor.executionBranch,
      targetBranch: service.groupBranch("group-final")
    });
    expect(successorMergedIntoGroup.status).toBe("synchronized");

    // The repair execution never owns a direct PR to main. Once its branch is
    // merged into the canonical group branch, a fresh canonical execution can
    // really check that branch out in a new worktree because the failed owner
    // was detached without deleting its evidence.
    const canonicalRetry = execution(
      service,
      store,
      "exec-final-canonical-retry",
      "member-b",
      3,
      "final-integration",
      "group-final"
    );
    const canonicalWorktree = await service.createFinalIntegrationWorktree(
      canonicalRetry,
      3,
      "group-final"
    );
    expect(canonicalWorktree.branch).toBe(service.groupBranch("group-final"));
    expect(canonicalWorktree.worktreePath).toBe(canonicalRetry.worktreePath);
    expect(await git(canonicalRetry.worktreePath, ["rev-parse", "--abbrev-ref", "HEAD"]))
      .toBe(service.groupBranch("group-final"));
    expect(await fs.readFile(
      path.join(canonicalRetry.worktreePath, "handoff-proof.md"),
      "utf8"
    )).toContain("continued from retained final integration evidence");
    expect(await fs.stat(finalOwner.worktreePath)).toMatchObject({});
  }, 60_000);

  it("observes pending closing files without changing the index, checkout, branch or records", async () => {
    const { service, store } = await fixture(undefined, "agent");
    const owner = execution(service, store, "closing", "worker");
    owner.worktreePath = service.canonicalAgentWorktree("worker");
    await service.createDeliveryWorktree(owner, 1, { kind: "main" });
    await fs.writeFile(path.join(owner.worktreePath, "old.txt"), "original");
    await harnessCommit(owner.worktreePath, "Agent business", ["old.txt"]);
    await git(owner.worktreePath, ["mv", "old.txt", "new name.txt"]);
    await fs.mkdir(path.join(owner.worktreePath, "agent-memory", "worker"), { recursive: true });
    await fs.writeFile(path.join(owner.worktreePath, "agent-memory", "worker", "Memory.md"), "Agent work record");
    const diagnosticName = process.platform === "win32" ? "诊断 file.txt" : "line\nbreak.txt";
    await fs.writeFile(path.join(owner.worktreePath, diagnosticName), "owned diagnostic");
    await fs.mkdir(path.join(owner.worktreePath, ".scienceevolve"), { recursive: true });
    await fs.writeFile(path.join(owner.worktreePath, ".scienceevolve", "runtime.json"), "{}");
    const indexPath = await git(owner.worktreePath, ["rev-parse", "--git-path", "index"]);
    const before = await fs.readFile(path.resolve(owner.worktreePath, indexPath));
    const head = await git(owner.worktreePath, ["rev-parse", "HEAD"]);
    const observed = await service.observeExecutionWorktree(owner, 1);
    expect(observed.head).toBe(head);
    expect(observed.pendingPaths.sort()).toEqual([".scienceevolve/runtime.json", "agent-memory/worker/Memory.md", diagnosticName, "new name.txt", "old.txt"].sort());
    expect(await fs.readFile(path.resolve(owner.worktreePath, indexPath))).toEqual(before);
    expect(await git(owner.worktreePath, ["rev-parse", "HEAD"])).toBe(head);
    expect(await fs.readFile(path.join(owner.worktreePath, "agent-memory/worker/Memory.md"), "utf8")).toBe("Agent work record");
    await expect(service.observeExecutionWorktree({ ...owner, executionBranch: "executions/foreign" }, 1)).rejects.toThrow();
    await expect(service.observeExecutionWorktree(owner, 2)).rejects.toThrow();
  });

  it("observes every pending project file when Git status exceeds the diagnostic output limit", async () => {
    const { service, store } = await fixture(undefined, "agent");
    const owner = execution(service, store, "large-closing", "worker");
    owner.worktreePath = service.canonicalAgentWorktree("worker");
    await service.createDeliveryWorktree(owner, 1, { kind: "main" });
    const names = Array.from({ length: 350 }, (_, index) => `research-${String(index).padStart(4, "0")}-${"x".repeat(80)}.txt`);
    await Promise.all(names.map(name => fs.writeFile(path.join(owner.worktreePath, name), "Agent evidence\n")));
    const observed = await service.observeExecutionWorktree(owner, 1);
    expect(observed.pendingPaths.sort()).toEqual(names.sort());
    expect(await git(owner.worktreePath, ["diff", "--cached", "--name-only"])).toBe("");
  });

  it("observes Harness commits and lets the Agent include its work record", async () => {
    const { scratch, service, store, main } = await fixture();
    const report = execution(service, store, "exec-report", "researcher");
    await service.createDeliveryWorktree(report, 1, { kind: "main" });
    await Promise.all([
      fs.writeFile(path.join(report.worktreePath, "report.md"), "# Real report\n", "utf8"),
      fs.mkdir(path.join(report.worktreePath, ".agents"), { recursive: true }),
      fs.mkdir(path.join(report.worktreePath, "agent-memory", "researcher"), { recursive: true })
    ]);
    await Promise.all([
      fs.writeFile(path.join(report.worktreePath, ".agents", "runtime.json"), "{}\n"),
      fs.writeFile(
        path.join(report.worktreePath, "agent-memory", "researcher", "Memory.md"),
        "# Memory\n\nVerified dataset provenance.\n"
      )
    ]);

    const uncommitted = await service.checkpointExecution(report, 1, { kind: "report" });
    expect(uncommitted).toMatchObject({ commitSha: main.head, changed: false });
    expect(await git(report.worktreePath, ["status", "--short", "--untracked-files=all"]))
      .toContain("?? report.md");
    expect(await git(report.worktreePath, ["status", "--short", "--untracked-files=all"]))
      .toContain("?? agent-memory/researcher/Memory.md");
    await expect(git(report.worktreePath, ["check-ignore", ".agents/runtime.json"]))
      .rejects.toThrow();
    await expect(git(report.worktreePath, ["check-ignore", "agent-memory/researcher/Memory.md"]))
      .rejects.toThrow();

    await git(report.worktreePath, ["add", "--", "report.md"]);
    await git(report.worktreePath, [
      "commit",
      "-m",
      "Harness-authored report\n\nAgent: researcher\nExecution: exec-report"
    ]);
    const authored = await git(report.worktreePath, ["rev-parse", "HEAD"]);
    const observed = await service.checkpointExecution(report, 1, { kind: "report" });
    expect(observed).toMatchObject({ commitSha: authored, changed: true });
    expect(await git(report.worktreePath, ["show", "-s", "--format=%an", authored]))
      .toBe("OpenFARS Agent researcher");
    expect(await git(service.repositoryPath, ["show", `${observed.commitSha}:report.md`]))
      .toBe("# Real report");
    await expect(git(
      service.repositoryPath,
      ["show", `${observed.commitSha}:agent-memory/researcher/Memory.md`]
    )).rejects.toThrow();
    await harnessCommit(report.worktreePath, "Record verified report facts", ["agent-memory/researcher/Memory.md"]);
    const withMemory = await service.checkpointExecution(report, 1, { kind: "report" });
    expect(await git(service.repositoryPath, ["show", `${withMemory.commitSha}:agent-memory/researcher/Memory.md`]))
      .toBe("# Memory\n\nVerified dataset provenance.");
    const managementA = await service.commitManagementMemory(
      "main",
      "op-management-a",
      "# Main management memory\n\nAssigned task A.\n"
    );
    const managementB = await service.commitManagementMemory(
      "leader-b",
      "op-management-b",
      "# Leader management memory\n\nIntegrated task B.\n",
      { expectedHead: managementA.commitSha }
    );
    expect(managementB.entries.map((entry) => entry.agentId)).toEqual(["leader-b", "main"]);
    expect(managementB.provenance).toContain("management/memory@");
    const managementReplay = await service.commitManagementMemory(
      "leader-b",
      "op-management-b",
      "# Leader management memory\n\nIntegrated task B.\n",
      { expectedHead: managementB.commitSha }
    );
    expect(managementReplay.commitSha).toBe(managementB.commitSha);
    await expect(git(service.repositoryPath, ["show", `${main.head}:agent-memory/main/Memory.md`]))
      .rejects.toThrow();
    await expect(execFileAsync(
      "git",
      ["merge-base", "--is-ancestor", managementB.commitSha, main.head],
      { cwd: service.repositoryPath, encoding: "utf8" }
    )).rejects.toThrow();

    const remote = await attachRemote(scratch, service);
    await service.pushExecution(report, 1);
    const synchronized = await providerMergeAndSynchronize({
      service,
      remote,
      operationId: "report-memory-pr-to-main",
      sourceBranch: report.executionBranch,
      targetBranch: "main"
    });
    const downstream = execution(service, store, "exec-downstream", "reviewer");
    await service.createDeliveryWorktree(downstream, 1, { kind: "main" });
    await expect(fs.readFile(path.join(
      downstream.worktreePath,
      "agent-memory",
      "researcher",
      "Memory.md"
    ), "utf8")).resolves.toContain("Verified dataset provenance.");
    expect(synchronized.localHeadAfter).toBe(await git(
      service.repositoryPath,
      ["rev-parse", "refs/heads/main"]
    ));
  });

  it("rejects credential variants before management memory becomes durable", async () => {
    const { service } = await fixture();
    const credentialBearingMemory = [
      "# Memory\n\nOpenAI-API-Key=key-value-that-must-not-persist\n",
      "# Memory\n\nProxy_Authorization: Basic YWxhZGRpbjpvcGVuIHNlc2FtZQ==\n",
      "# Memory\n\nAuthorization: Bearer bearer-value-that-must-not-persist\n",
      "# Memory\n\nghp_1234567890abcdefghij\n",
      "# Memory\n\ngithub_pat_1234567890abcdefghij\n",
      "# Memory\n\nsk-1234567890abcdefghijklmnop\n",
      "# Memory\n\nhttps://alice:swordfish@example.test/private.git\n",
      [
        "# Memory",
        "",
        "-----BEGIN OPENSSH PRIVATE KEY-----",
        "PRIVATE-KEY-MATERIAL",
        "-----END OPENSSH PRIVATE KEY-----",
        ""
      ].join("\n")
    ];
    for (const [index, content] of credentialBearingMemory.entries()) {
      await expect(service.commitManagementMemory(
        "main",
        `op-secret-memory-${index}`,
        content
      )).rejects.toBeInstanceOf(GitInputError);
    }
    await expect(service.readManagementSnapshot()).rejects.toThrow(
      "Required Git ref is missing"
    );
  });

  it("keeps server-owned Inbox material outside checkpoints while exposing Agent memory", async () => {
    const { projectId, projectRoot, service, store } = await fixture();
    const delivery = execution(service, store, "exec-private-inbox", "researcher");
    await service.createDeliveryWorktree(delivery, 1, { kind: "main" });
    const invocationId = "inv_private_inbox";
    const runtimePath = path.join(projectRoot, "runtime", invocationId);
    const inboxPath = path.join(
      projectRoot,
      "messages",
      `0001_${invocationId}_to_researcher.md`
    );
    const secretMarker = "SERVER_ONLY_INBOX_MARKER_9f85f41a";
    await Promise.all([
      fs.mkdir(runtimePath, { recursive: true }),
      fs.mkdir(path.dirname(inboxPath), { recursive: true })
    ]);
    await fs.writeFile(inboxPath, `${secretMarker}\n`);
    const inputs = await prepareInvocationInputs({
      project: { id: projectId, git: { enabled: true } },
      agent: "researcher",
      invocationId,
      projectPath: projectRoot,
      workspacePath: delivery.worktreePath,
      inboxPath,
      runtimePath,
      executionContext: {
        nodeRunId: "node-private-inbox",
        taskId: "task-private-inbox",
        executionId: delivery.id,
        role: "delivery",
        ownershipEpoch: 1,
        executionWorktree: delivery.worktreePath
      }
    } as Parameters<typeof prepareInvocationInputs>[0]);
    expect(inputs.inboxPath.startsWith(delivery.worktreePath)).toBe(false);

    await fs.writeFile(path.join(delivery.worktreePath, "report.md"), "# Safe report\n");
    const transientPath = path.dirname(inputs.inboxPath);
    await fs.mkdir(transientPath, { recursive: true });
    await Promise.all([
      fs.writeFile(path.join(transientPath, "must-not-commit.md"), `${secretMarker}\n`),
      fs.writeFile(
        path.join(runtimePath, "openfars-management-checkpoint-stale.index"),
        "stale private index\n"
      ),
      fs.writeFile(
        path.join(runtimePath, "openfars-management-checkpoint-stale.index.lock"),
        "stale private index lock\n"
      )
    ]);
    const untouched = await service.checkpointExecution(delivery, 1, { kind: "report" });
    expect(untouched.changed).toBe(false);
    await harnessCommit(delivery.worktreePath, "Commit only the safe report", ["report.md"]);
    const checkpoint = await service.checkpointExecution(delivery, 1, { kind: "report" });
    const tree = await git(service.repositoryPath, [
      "ls-tree",
      "-r",
      "--name-only",
      checkpoint.commitSha
    ]);
    expect(tree).toContain("report.md");
    expect(tree).not.toContain(".scienceevolve");
    expect(tree).not.toContain("openfars-management-checkpoint-");
    const status = await git(delivery.worktreePath, ["status", "--short", "--untracked-files=all"]);
    expect(status).toContain("?? agent-memory/researcher/Memory.md");
    expect(status).not.toContain("must-not-commit.md");
    await expect(execFileAsync(
      "git",
      ["grep", "-F", secretMarker, checkpoint.commitSha],
      { cwd: service.repositoryPath, encoding: "utf8" }
    )).rejects.toThrow();
    await fs.writeFile(path.join(delivery.worktreePath, ".gitignore"), "node_modules/\n");
    expect(await service.checkpointExecution(delivery, 1, { kind: "checkpoint" }))
      .toMatchObject({ commitSha: checkpoint.commitSha, changed: true });
    expect(await git(delivery.worktreePath, ["ls-files", "--", ".scienceevolve"]))
      .toBe("");
    await fs.writeFile(path.join(delivery.worktreePath, ".gitignore"), ".scienceevolve/\nnode_modules/\n");
    await fs.mkdir(path.join(delivery.worktreePath, ".scienceevolve"), { recursive: true });
    await fs.writeFile(path.join(delivery.worktreePath, ".scienceevolve", "project-configuration.json"), "{}\n");
    await git(delivery.worktreePath, [
      "add",
      "-f",
      ".scienceevolve/project-configuration.json"
    ]);
    await git(delivery.worktreePath, [
      "-c", "user.name=Harness Agent",
      "-c", "user.email=harness@example.test",
      "commit", "-m", "Commit project configuration including hidden files"
    ]);
    expect(await service.checkpointExecution(delivery, 1, { kind: "checkpoint" })).toMatchObject({ changed: true });
  });

  it("never runs git add while observing a Harness-authored commit", async () => {
    const runner = new ResidualWorkerStageRunner();
    const { service, store } = await fixture(runner);
    const delivery = execution(service, store, "exec-raced-inbox", "researcher");
    await service.createDeliveryWorktree(delivery, 1, { kind: "main" });
    const transientRelative = ".scienceevolve/inbox/raced-secret.md";
    await fs.mkdir(path.join(delivery.worktreePath, ".scienceevolve", "inbox"), {
      recursive: true
    });
    await Promise.all([
      fs.writeFile(path.join(delivery.worktreePath, "safe-raced-report.md"), "safe\n"),
      fs.writeFile(path.join(delivery.worktreePath, transientRelative), "raced-secret\n")
    ]);
    runner.arm(transientRelative);
    await harnessCommit(delivery.worktreePath, "Harness chose the safe report", ["safe-raced-report.md"]);

    const checkpoint = await service.checkpointExecution(delivery, 1, {
      kind: "report",
      operationMarker: "op-raced-private-index"
    });
    expect(runner.raced).toBe(false);
    const tree = await git(service.repositoryPath, [
      "ls-tree",
      "-r",
      "--name-only",
      checkpoint.commitSha
    ]);
    expect(tree).toContain("safe-raced-report.md");
    expect(tree).not.toContain(".scienceevolve");
    expect(tree).not.toContain("openfars-management-checkpoint-");
    expect(await git(delivery.worktreePath, ["status", "--short", "--untracked-files=all"]))
      .toContain(`?? ${transientRelative}`);
  });

  it("keeps local excludes intact because observation does not rewrite .gitignore", async () => {
    const runner = new IgnoreRemovalDuringCheckpointRunner();
    const { service, store } = await fixture(runner);
    const delivery = execution(service, store, "exec-raced-ignore", "researcher");
    await service.createDeliveryWorktree(delivery, 1, { kind: "main" });
    const transientRelative = ".scienceevolve/inbox/unhashed-secret.md";
    const secretMarker = `UNHASHED_SERVER_SECRET_${randomUUID()}`;
    await fs.mkdir(path.join(delivery.worktreePath, ".scienceevolve", "inbox"), {
      recursive: true
    });
    await Promise.all([
      fs.writeFile(path.join(delivery.worktreePath, "safe-ignore-race.md"), "safe\n"),
      fs.writeFile(path.join(delivery.worktreePath, transientRelative), `${secretMarker}\n`)
    ]);
    const transientBlob = await git(delivery.worktreePath, [
      "hash-object",
      transientRelative
    ]);
    runner.armed = true;
    await harnessCommit(delivery.worktreePath, "Harness chose safe content", ["safe-ignore-race.md"]);

    const checkpoint = await service.checkpointExecution(delivery, 1, {
      kind: "report",
      operationMarker: "op-raced-ignore"
    });
    expect(runner.raced).toBe(false);
    const tree = await git(service.repositoryPath, [
      "ls-tree",
      "-r",
      "--name-only",
      checkpoint.commitSha
    ]);
    expect(tree).toContain("safe-ignore-race.md");
    expect(tree).not.toContain(".scienceevolve");
    await expect(execFileAsync(
      "git",
      ["cat-file", "-e", transientBlob],
      { cwd: service.repositoryPath, encoding: "utf8" }
    )).rejects.toThrow();
  });

  it("does not inspect or commit an ignored transient symlink while observing HEAD", async () => {
    const { scratch, service, store } = await fixture();
    const delivery = execution(service, store, "exec-symlinked-inbox", "researcher");
    await service.createDeliveryWorktree(delivery, 1, { kind: "main" });
    const escaped = path.join(scratch, "escaped-transient");
    await fs.mkdir(escaped);
    await fs.symlink(escaped, path.join(delivery.worktreePath, ".scienceevolve"), process.platform === "win32" ? "junction" : "dir");
    await fs.writeFile(path.join(delivery.worktreePath, "safe-before-symlink.md"), "safe\n");
    const authored = await harnessCommit(
      delivery.worktreePath,
      "Harness safe commit with ignored runtime symlink",
      ["safe-before-symlink.md"]
    );

    await expect(service.checkpointExecution(delivery, 1, { kind: "report" }))
      .resolves.toMatchObject({ commitSha: authored, changed: true });
    expect(await git(delivery.worktreePath, ["ls-files", "--", ".scienceevolve"]))
      .toBe("");
  });

  it("retries initialization and ordinary pushes in place without force or cleanup", async () => {
    const { scratch, service, main } = await fixture();
    const repeated = await service.initializeMain({
      title: "Git collaboration fixture",
      operationId: "op-init"
    });
    expect(repeated.head).toBe(main.head);
    const remote = path.join(scratch, "remote.git");
    await execFileAsync(
      "git",
      ["init", "--bare", "--initial-branch=main", remote],
      { encoding: "utf8" }
    );
    await service.configureOrigin(remote);
    await service.configureOrigin(remote);
    expect(await service.pushMain()).toBe(main.head);
    expect(await service.pushMain()).toBe(main.head);
    expect(await git(remote, ["rev-parse", "refs/heads/main"])).toBe(main.head);
  });

  it("accepts a post-merge remote fast-forward and rejects a rewritten target", async () => {
    const { scratch, service, store } = await fixture();
    const remote = await attachRemote(scratch, service);
    const first = execution(service, store, "exec-remote-ff", "writer-ff");
    await service.createDeliveryWorktree(first, 1, { kind: "main" });
    await fs.writeFile(path.join(first.worktreePath, "fast-forward.md"), "included\n", "utf8");
    await harnessCommit(first.worktreePath, "Fast-forward delivery", ["fast-forward.md"]);
    await service.checkpointExecution(first, 1, {
      kind: "report",
      operationMarker: "op-remote-ff"
    });
    await service.pushExecution(first, 1);
    const advanced = await providerMergeAndSynchronize({
      service,
      remote,
      operationId: "remote-advanced-after-merge",
      sourceBranch: first.executionBranch,
      targetBranch: "main",
      remoteHeadMode: "fast-forward"
    });
    expect(advanced.status).toBe("synchronized");
    expect(advanced.remoteHead).not.toBe(advanced.mergeCommitSha);
    expect(await git(service.repositoryPath, [
      "merge-base",
      "--is-ancestor",
      advanced.mergeCommitSha,
      advanced.remoteHead
    ])).toBe("");

    const second = execution(service, store, "exec-remote-diverged", "writer-diverged");
    await service.createDeliveryWorktree(second, 1, { kind: "main" });
    await fs.writeFile(path.join(second.worktreePath, "diverged.md"), "must not land\n", "utf8");
    await harnessCommit(second.worktreePath, "Diverged delivery", ["diverged.md"]);
    await service.checkpointExecution(second, 1, {
      kind: "report",
      operationMarker: "op-remote-diverged"
    });
    await service.pushExecution(second, 1);
    await expect(providerMergeAndSynchronize({
      service,
      remote,
      operationId: "remote-rewritten-after-merge",
      sourceBranch: second.executionBranch,
      targetBranch: "main",
      remoteHeadMode: "diverged"
    })).rejects.toThrow("does not contain the exact merge commit");
    expect(await git(service.repositoryPath, ["rev-parse", "refs/heads/main"]))
      .toBe(advanced.localHeadAfter);
  });

  it("rejects unsafe identities, paths, destructive argv and credential-bearing diagnostics", async () => {
    const { service, store } = await fixture();
    expect(() => service.deliveryBranch("../escape")).toThrow(GitInputError);
    expect(() => service.deliveryBranch("unsafe..ref")).toThrow(GitInputError);
    expect(() => service.deliveryBranch("unsafe.lock")).toThrow(GitInputError);
    const invalid = execution(service, store, "exec-safe", "agent-safe");
    invalid.worktreePath = path.join(service.projectRoot, "outside");
    await expect(service.createDeliveryWorktree(invalid, 1, { kind: "main" }))
      .rejects.toThrow("fixed project path");

    const runner = new ExecFileGitCommandRunner();
    await expect(runner.run({
      cwd: service.projectRoot,
      args: ["push", "--force", "origin", "main"]
    })).rejects.toThrow("forbidden");
    await expect(runner.run({
      cwd: service.repositoryPath,
      args: ["worktree", "remove", "--force", path.join(service.projectRoot, "git-worktrees", "exec-safe")]
    })).rejects.toThrow("forbidden");
    await expect(runner.run({
      cwd: service.repositoryPath,
      args: ["worktree", "remove", "--force", path.join(service.projectRoot, "git-worktrees", "exec-safe")],
      previewCleanup: true
    })).rejects.toThrow("forbidden");
    await expect(runner.run({
      cwd: service.projectRoot,
      args: ["-c", "alias.escape=!sh", "escape"]
    })).rejects.toThrow("allowlist");
    await expect(runner.run({
      cwd: service.projectRoot,
      args: ["switch", "--discard-changes", "main"]
    })).rejects.toThrow("owned branch");
    await expect(runner.run({
      cwd: service.projectRoot,
      args: ["switch", "executions/unsafe..ref"]
    })).rejects.toThrow("owned branch");
    await expect(runner.run({
      cwd: service.projectRoot,
      args: ["status", "--porcelain=v1"],
      environment: { GIT_CONFIG_COUNT: "1" }
    })).rejects.toThrow("environment key");
    const secret = "ghp_SUPERSECRETTOKEN123456";
    expect(redactGitDiagnostic(
      `fatal https://${secret}@github.com/x/y?access_token=${secret} Bearer ${secret}`
    )).not.toContain(secret);
  });
});
