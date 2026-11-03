import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import type {
  AgentId,
  ExecutionId,
  GroupRunId,
  OperationId,
  OperationRecord
} from "../types.js";
import { containsCredentialMaterial, sha256 } from "../utils.js";
import { ExecFileGitCommandRunner } from "./command-runner.js";
import type {
  CollaborationGitOperationStore,
  GitCommandResult,
  GitCommandRunner,
  GitExecutionAuthority,
  GitProjectBinding,
  GroupBranchBinding,
  LocalCheckpointFact,
  LocalMergeFact,
  LocalRepositoryFact,
  LocalWorktreeFact,
  LocalDeliveryPreparationFact,
  LocalWorktreeStatusFact,
  RestrictedWorktreeClosingScope,
  RestrictedWorktreeClosingFact,
  RestrictedWorktreeClosingTargetFact,
  ManagementMemorySnapshot,
  OwnerResolutionFact,
  RemoteMergeSyncFact
} from "./contracts.js";
import {
  CollaborationGitError,
  GitInputError,
  GitOwnershipStaleError,
  GitPathViolationError,
  OperationStoreViolationError
} from "./errors.js";
import { finalizeOperation, prepareOperation } from "./operation.js";
import { inspectGit, type GitInspectionRequest } from "./inspection.js";
import { revertGit, type GitRevertRequest, type HistoricalPullSource } from "./revert.js";
import { assertRestrictedClosingFiles, restrictedClosingDiffCandidatePaths, restrictedClosingDiffPaths, restrictedClosingPaths } from "./restricted-worktree-closing.js";

const MAIN_BRANCH = "main" as const;
const MANAGEMENT_BRANCH = "management/memory" as const;
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,159}$/;
const SAFE_AGENT_ID = /^(?:[A-Za-z0-9][A-Za-z0-9._-]{0,159}|[\p{L}\p{N}][\p{L}\p{N}_-]{0,63})$/u;
const SAFE_SHA = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/;
const MAX_MEMORY_BYTES = 2 * 1024 * 1024;
const SERVICE_IDENTITY = {
  GIT_AUTHOR_NAME: "OpenFARS Git Service",
  GIT_AUTHOR_EMAIL: "openfars@localhost",
  GIT_COMMITTER_NAME: "OpenFARS Git Service",
  GIT_COMMITTER_EMAIL: "openfars@localhost"
} as const;
const LEGACY_OPENFARS_LOCAL_EXCLUDES = [
  "/.scienceevolve/",
  "/.agents/",
  "/Memory.md",
  "/messages/",
  "/runtime/",
  "/workflow",
  "/agent-memory/"
] as const;

export interface LocalGitServiceOptions extends GitProjectBinding {
  operationStore: CollaborationGitOperationStore;
  /** v3 scopes retain one checkout per Agent; v2 keeps one per execution. */
  worktreeMode?: "execution" | "agent";
  runner?: GitCommandRunner;
  /** Host-owned immutable source tree; no refs, commits or user repository mutations. */
  initialTree?: (input: { repositoryPath: string; signal?: AbortSignal }) => Promise<{ tree: string; fingerprint: string } | undefined>;
  now?: () => string;
  allowedRemoteHosts?: readonly string[];
  /** Test-only escape hatch for a local bare remote; false in production. */
  allowLocalRemotes?: boolean;
}

export interface DeliveryBase {
  kind: "main" | "group" | "commit";
  groupRunId?: GroupRunId;
  commitSha?: string;
}

export interface ExecutionPaths {
  executionWorktree: string;
  ownedMemoryPath: string;
  executionBranch: string;
}

export interface CheckedOutMergeTargetAuthority {
  execution: GitExecutionAuthority;
  ownershipEpoch: number;
}

export interface SynchronizeMergedPullRequestInput {
  operationId: OperationId;
  targetBranch: string;
  expectedSourceHead: string;
  expectedMergeCommit: string;
  expectedRemoteHead: string;
  checkedOutTarget?: CheckedOutMergeTargetAuthority;
  signal?: AbortSignal;
}

function safeId(value: string, field: string): string {
  if (!SAFE_ID.test(value)) throw new GitInputError(`${field} is unsafe`, { field });
  return value;
}

/** Accept current Unicode Agent names and already-persisted ASCII identities. */
export function safeAgentId(value: string): string {
  if (!SAFE_AGENT_ID.test(value)) throw new GitInputError("agentId is unsafe", { field: "agentId" });
  return value;
}

function safeRefComponent(value: string, field: string): string {
  const safe = safeId(value, field);
  if (safe.includes("..") || safe.endsWith(".") || safe.toLowerCase().endsWith(".lock")) {
    throw new GitInputError(`${field} is unsafe for a Git ref`, { field });
  }
  return safe;
}

function safeSha(value: string, field: string): string {
  const normalized = value.toLowerCase();
  if (!SAFE_SHA.test(normalized)) {
    throw new GitInputError(`${field} must be a complete commit SHA`, { field });
  }
  return normalized;
}

function isWithin(candidate: string, root: string): boolean {
  const relative = path.relative(root, candidate);
  return relative === "" || (
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}

function oneLine(value: string, fallback: string): string {
  const normalized = value.replace(/[\r\n\0]+/g, " ").trim().slice(0, 200);
  return normalized || fallback;
}

function assertMemoryContent(content: string): void {
  const bytes = Buffer.byteLength(content, "utf8");
  if (bytes === 0 || bytes > MAX_MEMORY_BYTES || content.includes("\0")) {
    throw new GitInputError("Memory content is empty, too large, or contains NUL bytes");
  }
  if (containsCredentialMaterial(content)) {
    throw new GitInputError("Memory content appears to contain a credential");
  }
}

function factRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

/**
 * Trusted, fixed-operation local Git service. Its repository is always the
 * bare `<project>/repository`; Agent worktrees are always retained under
 * `<project>/git-worktrees/<executionId>` in v2, or the fixed
 * `<project>/git-worktrees/agents/<agentId>` in v3.
 */
export class LocalCollaborationGitService {
  readonly projectId: string;
  readonly projectRoot: string;
  readonly repositoryPath: string;
  readonly worktreeRoot: string;

  private readonly operationStore: CollaborationGitOperationStore;
  private readonly runner: GitCommandRunner;
  private readonly initialTree: LocalGitServiceOptions["initialTree"];
  private readonly now: () => string;
  private readonly allowedRemoteHosts: Set<string>;
  private readonly allowLocalRemotes: boolean;
  private readonly worktreeMode: "execution" | "agent";
  private worktreeConfigurationTail: Promise<void> = Promise.resolve();
  private readonly revertTails = new Map<string, Promise<void>>();

  constructor(options: LocalGitServiceOptions) {
    this.projectId = safeId(options.projectId, "projectId");
    if (!path.isAbsolute(options.projectRoot)) {
      throw new GitPathViolationError("Project root must be absolute");
    }
    this.projectRoot = path.resolve(options.projectRoot);
    if (path.basename(this.projectRoot) !== this.projectId) {
      throw new GitPathViolationError("Project root basename must equal projectId");
    }
    this.repositoryPath = path.join(this.projectRoot, "repository");
    this.worktreeRoot = path.join(this.projectRoot, "git-worktrees");
    this.operationStore = options.operationStore;
    this.runner = options.runner ?? new ExecFileGitCommandRunner();
    this.initialTree = options.initialTree;
    this.now = options.now ?? (() => new Date().toISOString());
    this.allowedRemoteHosts = new Set(
      (options.allowedRemoteHosts ?? ["github.com"]).map((host) => host.toLowerCase())
    );
    this.allowLocalRemotes = options.allowLocalRemotes === true;
    this.worktreeMode = options.worktreeMode ?? "execution";
  }

  groupBranch(groupRunId: GroupRunId): string {
    return `groups/${safeRefComponent(groupRunId, "groupRunId")}`;
  }

  deliveryBranch(executionId: ExecutionId): string {
    return `executions/${safeRefComponent(executionId, "executionId")}`;
  }

  canonicalWorktree(executionId: ExecutionId): string {
    return path.join(this.worktreeRoot, safeId(executionId, "executionId"));
  }

  canonicalAgentWorktree(agentId: AgentId): string {
    return path.join(this.worktreeRoot, "agents", safeAgentId(agentId));
  }

  /** Management never checks out a business branch or resets an Agent's
   * retained work. The coordinator must hold that identity's management slot. */
  async prepareAgentManagementWorkspace(agentId: AgentId, signal?: AbortSignal): Promise<string> {
    if (this.worktreeMode !== "agent") throw new GitInputError("Fixed management workspace requires Agent worktree mode");
    const workspace = this.canonicalAgentWorktree(agentId);
    await this.assertBareRepository();
    await this.ensureWorktreeConfiguration(signal);
    await this.ensureOpenFarsLocalExcludes();
    for (const directory of [this.worktreeRoot, path.dirname(workspace)]) {
      await fs.mkdir(directory, { recursive: true, mode: 0o700 });
      await this.assertDirectoryNotSymlink(directory, "management worktree root");
    }
    if (!(await this.pathExists(workspace))) {
      const branch = agentId === "main" ? MAIN_BRANCH : `management/agents/${sha256(agentId)}`;
      const existing = await this.refHead(`refs/heads/${branch}`, signal);
      if (agentId !== "main" && existing) throw new GitInputError("Management branch exists without its retained Agent checkout");
      await this.command(this.repositoryPath, existing
        ? ["worktree", "add", "--", workspace, branch]
        : ["worktree", "add", "-b", branch, "--", workspace, MAIN_BRANCH], signal);
      await this.command(workspace, ["config", "--worktree", "core.bare", "false"], signal);
    }
    await this.assertDirectoryNotSymlink(workspace, "Agent management workspace");
    const common = (await this.command(workspace, ["rev-parse", "--git-common-dir"], signal)).stdout.trim();
    if (await fs.realpath(path.resolve(workspace, common)) !== await fs.realpath(this.repositoryPath) ||
      await fs.realpath(workspace) !== workspace) {
      throw new GitPathViolationError("Management workspace is not this project's canonical Agent checkout");
    }
    if (agentId === "main" && (await this.command(workspace,
      ["symbolic-ref", "--quiet", "--short", "HEAD"], signal)).stdout.trim() !== MAIN_BRANCH) {
      throw new GitInputError("Main management workspace must remain on main");
    }
    return workspace;
  }

  private worktreeFor(execution: GitExecutionAuthority): string {
    return this.worktreeMode === "agent"
      ? this.canonicalAgentWorktree(execution.agentId)
      : this.canonicalWorktree(execution.id);
  }

  reconciliationRef(operationId: OperationId): string {
    return `refs/openfars/reconciled/${safeRefComponent(operationId, "operationId")}`;
  }

  executionBaseRef(executionId: ExecutionId): string {
    return `refs/openfars/execution-bases/${safeRefComponent(executionId, "executionId")}`;
  }

  async initializeMain(
    input: {
      title: string;
      operationId: OperationId;
      signal?: AbortSignal;
    }
  ): Promise<LocalRepositoryFact> {
    safeId(input.operationId, "operationId");
    await this.ensureProjectRoot();
    const repositoryExists = await this.pathExists(this.repositoryPath);
    if (!repositoryExists) {
      await this.command(
        this.projectRoot,
        ["init", "--bare", "--initial-branch=main", "--", "repository"],
        input.signal
      );
    }
    await this.assertBareRepository();
    await this.ensureOpenFarsLocalExcludes();
    await this.ensureWorktreeConfiguration(input.signal);

    const seed = await this.initialTree?.({ repositoryPath: this.repositoryPath, signal: input.signal });
    if (seed) {
      safeSha(seed.tree, "initial source tree");
      if (!/^[0-9a-f]{64}$/.test(seed.fingerprint) ||
        (await this.command(this.repositoryPath, ["cat-file", "-t", seed.tree], input.signal)).stdout.trim() !== "tree") {
        throw new GitInputError("Invalid host initial source tree");
      }
    }
    const sourceMarker = seed ? `OpenFARS-Source: ${seed.fingerprint}` : undefined;
    const existing = await this.refHead("refs/heads/main", input.signal);
    if (existing) {
      const marker = await this.commitMessage(existing, input.signal);
      const lines = marker.split(/\r?\n/);
      if (!lines.includes(`OpenFARS-Operation: ${input.operationId}`) ||
        (sourceMarker ? !lines.includes(sourceMarker) : lines.some((line) => line.startsWith("OpenFARS-Source: "))) ||
        (seed && (await this.command(this.repositoryPath, ["rev-parse", `${existing}^{tree}`], input.signal)).stdout.trim() !== seed.tree)) {
        throw new GitInputError(
          "Existing main branch was not created by this initialization operation"
        );
      }
      return this.repositoryFact(existing);
    }

    const title = oneLine(input.title, this.projectId);
    const readme = `# ${title}\n\nInitialized by OpenFARS collaboration Git service.\n`;
    const gitignore = "# All project workspace files are versioned.\n";
    const tree = seed?.tree ?? await (async () => {
      const readmeBlob = await this.hashBlob(readme, input.signal);
      const ignoreBlob = await this.hashBlob(gitignore, input.signal);
      return this.mktree([
        `100644 blob ${ignoreBlob}\t.gitignore`,
        `100644 blob ${readmeBlob}\tREADME.md`
      ], input.signal);
    })();
    const commit = await this.commitTree(
      tree,
      [],
      `Initialize ${title}\n\nOpenFARS-Operation: ${input.operationId}${sourceMarker ? `\n${sourceMarker}` : ""}`,
      input.signal
    );
    await this.command(
      this.repositoryPath,
      ["update-ref", "refs/heads/main", commit, "0000000000000000000000000000000000000000"],
      input.signal
    );
    return this.repositoryFact(commit);
  }

  async configureOrigin(remoteUrl: string, signal?: AbortSignal): Promise<void> {
    await this.assertBareRepository();
    const validated = this.validateRemoteUrl(remoteUrl);
    const observed = await this.command(
      this.repositoryPath,
      ["remote", "get-url", "origin"],
      signal,
      [0, 2]
    );
    if (observed.code === 0) {
      if (observed.stdout.trim() !== validated) {
        throw new GitInputError("Existing origin does not match the authorized repository");
      }
      return;
    }
    await this.command(
      this.repositoryPath,
      ["remote", "add", "origin", validated],
      signal
    );
  }

  async pushMain(signal?: AbortSignal): Promise<string> {
    return this.pushFixedBranch(MAIN_BRANCH, signal);
  }

  async pushGroup(groupRunId: GroupRunId, signal?: AbortSignal): Promise<string> {
    return this.pushFixedBranch(this.groupBranch(groupRunId), signal);
  }

  async pushExecution(
    execution: GitExecutionAuthority,
    expectedOwnershipEpoch: number,
    signal?: AbortSignal,
    expectedHead?: string
  ): Promise<string> {
    const branch = this.deliveryBranch(execution.id);
    await this.assertAuthority(execution, expectedOwnershipEpoch, branch, "checkpoint");
    if (execution.restrictedClosing) {
      const closing = await this.observeRestrictedWorktreeClosing(execution, expectedOwnershipEpoch, execution.restrictedClosing.scope, signal);
      if (!expectedHead || closing.head !== safeSha(expectedHead, "closing publication head") || closing.pendingPaths.length) throw new GitInputError("Closing publication requires its exact clean checkpoint");
      await this.command(this.repositoryPath,
        ["push", "--porcelain", "origin", `${closing.head}:refs/heads/${branch}`], signal,
        [0], undefined, undefined, false, async () => {
          await this.assertAuthority(execution, expectedOwnershipEpoch, branch, "checkpoint");
          const current = await this.observeRestrictedWorktreeClosing(execution, expectedOwnershipEpoch, execution.restrictedClosing!.scope, signal);
          if (current.head !== closing.head || current.pendingPaths.length) throw new GitInputError("Closing checkpoint moved before publication");
        });
      return closing.head;
    }
    return this.pushFixedBranch(branch, signal,
      () => this.assertAuthority(execution, expectedOwnershipEpoch, branch, "checkpoint"));
  }

  /** Re-send only an original journal's immutable commit at the Agent's
   * explicit request. Do not checkpoint dirty work or resolve a moved head. */
  async pushRetainedExecution(
    execution: GitExecutionAuthority,
    expectedOwnershipEpoch: number,
    operationId: OperationId,
    expectedHead: string,
    signal?: AbortSignal
  ): Promise<string> {
    const branch = this.expectedExecutionBranch(execution);
    const head = safeSha(expectedHead, "expectedHead");
    await this.assertAuthority(execution, expectedOwnershipEpoch, branch, "provider.mutate");
    const original = await this.operationStore.recordedOperation?.(operationId);
    if (original?.kind !== "git.push" || original.ownerExecutionId !== execution.id ||
      original.ownershipEpoch !== expectedOwnershipEpoch || original.expectedBase !== branch ||
      original.expectedHead !== head || !["prepared", "observed", "uncertain"].includes(original.status)) {
      throw new GitInputError("Retained push requires its exact unfinished owned operation");
    }
    const worktree = await this.observeWorktree(execution, branch, signal);
    if (worktree.head !== head) throw new GitInputError("Retained push worktree moved from its original recorded head");
    const closingGuard = async () => {
      if (!execution.restrictedClosing) return;
      const fact = await this.observeRestrictedWorktreeClosing(execution, expectedOwnershipEpoch, execution.restrictedClosing.scope, signal);
      if (fact.head !== head || fact.pendingPaths.length) throw new GitInputError("Retained closing push requires its exact clean checkpoint");
    };
    await closingGuard();
    await this.assertAuthority(execution, expectedOwnershipEpoch, branch, "provider.mutate");
    // The exact SHA refspec cannot accidentally publish a different commit
    // if another native Git command moves the local ref during this await.
    await this.command(this.repositoryPath, ["push", "--porcelain", "origin", `${head}:refs/heads/${branch}`], signal,
      [0], undefined, undefined, false, async () => {
        await this.assertAuthority(execution, expectedOwnershipEpoch, branch, "provider.mutate");
        await closingGuard();
        const retained = await this.operationStore.recordedOperation?.(operationId);
        if (retained?.payloadHash !== original.payloadHash || retained.expectedHead !== head ||
          !["prepared", "observed", "uncertain"].includes(retained.status))
          throw new GitInputError("Retained push authorization changed during credential resolution");
      });
    return head;
  }

  /** Read-only guard used before an ordinary non-force remote branch advance. */
  async canFastForward(
    remoteHead: string,
    localHead: string,
    signal?: AbortSignal
  ): Promise<boolean> {
    await this.assertBareRepository();
    const ancestor = safeSha(remoteHead, "remoteHead");
    const descendant = safeSha(localHead, "localHead");
    await this.assertCommitExists(ancestor, signal);
    await this.assertCommitExists(descendant, signal);
    return this.isAncestor(ancestor, descendant, signal);
  }

  /**
   * Fail-closed preflight for a provider merge. A group branch checked out by
   * a retained final-integration execution is frozen unless S explicitly
   * supplies that execution's current epoch for a repair-PR fast-forward.
   */
  async assertRemoteMergeTargetAvailable(
    targetBranch: string,
    checkedOutTarget?: CheckedOutMergeTargetAuthority,
    signal?: AbortSignal
  ): Promise<void> {
    await this.assertBareRepository();
    const branch = this.remoteMergeTarget(targetBranch);
    const checkedOutPath = await this.checkedOutWorktree(branch, signal);
    if (!checkedOutPath) return;
    await this.assertCheckedOutTargetAuthority(
      branch,
      checkedOutPath,
      checkedOutTarget,
      signal
    );
  }

  /**
   * A final-integration checkout intentionally freezes its group branch while
   * its PR is unresolved. Once S has made the group terminal, detach that
   * clean retained worktree so future provider reconciliation is no longer
   * blocked while every historical commit remains addressable.
   */
  async releaseFinalIntegrationWorktree(
    execution: GitExecutionAuthority,
    expectedOwnershipEpoch: number,
    signal?: AbortSignal
  ): Promise<string> {
    if (execution.purpose !== "final-integration" || !execution.groupRunId) {
      throw new GitInputError("Only a final-integration execution may release a group checkout");
    }
    const branch = this.expectedExecutionBranch(execution);
    await this.assertAuthority(
      execution,
      expectedOwnershipEpoch,
      branch,
      "retained.observe"
    );
    const head = await this.requiredRefHead(`refs/heads/${branch}`, signal);
    const checkedOut = await this.checkedOutWorktree(branch, signal);
    if (!checkedOut) return head;
    const [actualPath, expectedPath] = await Promise.all([
      fs.realpath(checkedOut),
      fs.realpath(this.worktreeFor(execution))
    ]);
    if (actualPath !== expectedPath) {
      throw new GitPathViolationError("Final-integration branch is checked out by another worktree");
    }
    if (await this.worktreeHead(actualPath, signal) !== head) {
      throw new GitInputError("Final-integration worktree is not at the retained group head");
    }
    const status = await this.command(actualPath, ["status", "--porcelain"], signal);
    if (status.stdout.trim()) {
      throw new GitInputError("Final-integration worktree is dirty and cannot be released");
    }
    await this.command(actualPath, ["update-ref", "--no-deref", "HEAD", head], signal);
    if (await this.checkedOutWorktree(branch, signal)) {
      throw new OperationStoreViolationError("Final-integration group checkout remained frozen");
    }
    return head;
  }

  /**
   * Stop-confirmed failure handoff variant. Dirty files, index entries, and
   * conflict state remain in the detached predecessor worktree as evidence;
   * only the named branch checkout is released for the fresh repair owner.
   */
  async releaseFailedFinalIntegrationWorktree(
    execution: GitExecutionAuthority,
    expectedOwnershipEpoch: number,
    signal?: AbortSignal
  ): Promise<string> {
    if (execution.purpose !== "final-integration" || !execution.groupRunId) {
      throw new GitInputError("Only a failed final-integration execution may release its checkout");
    }
    const branch = this.expectedExecutionBranch(execution);
    await this.assertAuthority(
      execution,
      expectedOwnershipEpoch,
      branch,
      "retained.observe"
    );
    const head = await this.requiredRefHead(`refs/heads/${branch}`, signal);
    const checkedOut = await this.checkedOutWorktree(branch, signal);
    if (!checkedOut) return head;
    const [actualPath, expectedPath] = await Promise.all([
      fs.realpath(checkedOut),
      fs.realpath(this.worktreeFor(execution))
    ]);
    if (actualPath !== expectedPath) {
      throw new GitPathViolationError("Failed final-integration branch is checked out elsewhere");
    }
    if (await this.worktreeHead(actualPath, signal) !== head) {
      throw new GitInputError("Failed final-integration worktree moved beyond its retained branch head");
    }
    await this.command(actualPath, ["update-ref", "--no-deref", "HEAD", head], signal);
    if (await this.checkedOutWorktree(branch, signal)) {
      throw new OperationStoreViolationError("Failed final-integration checkout remained frozen");
    }
    return head;
  }

  /**
   * Import the provider-observed base ref through an operation-specific ref,
   * prove that it contains the exact PR head and merge commit, then advance the
   * local base with CAS. This never manufactures a local substitute merge SHA.
   */
  async synchronizeMergedPullRequest(
    input: SynchronizeMergedPullRequestInput
  ): Promise<RemoteMergeSyncFact> {
    await this.assertBareRepository();
    const operationId = safeRefComponent(input.operationId, "operationId");
    const targetBranch = this.remoteMergeTarget(input.targetBranch);
    const expectedSourceHead = safeSha(input.expectedSourceHead, "expectedSourceHead");
    const mergeCommitSha = safeSha(input.expectedMergeCommit, "expectedMergeCommit");
    const expectedRemoteHead = safeSha(input.expectedRemoteHead, "expectedRemoteHead");
    const temporaryRef = this.reconciliationRef(operationId);
    const checkedOutPath = await this.checkedOutWorktree(targetBranch, input.signal);
    if (checkedOutPath) {
      await this.assertCheckedOutTargetAuthority(
        targetBranch,
        checkedOutPath,
        input.checkedOutTarget,
        input.signal
      );
    }

    await this.command(
      this.repositoryPath,
      [
        "fetch",
        "--no-tags",
        "--no-write-fetch-head",
        "origin",
        `refs/heads/${targetBranch}:${temporaryRef}`
      ],
      input.signal
    );
    const fetchedHead = await this.requiredRefHead(temporaryRef, input.signal);
    if (fetchedHead !== expectedRemoteHead) {
      throw new GitInputError("Fetched merge target does not match the observed remote head");
    }
    await this.assertCommitExists(expectedSourceHead, input.signal);
    try {
      await this.assertCommitExists(mergeCommitSha, input.signal);
    } catch (error) {
      if (error instanceof CollaborationGitError) {
        throw new GitInputError(
          "Observed remote target does not contain the exact merge commit"
        );
      }
      throw error;
    }
    if (!(await this.isAncestor(expectedSourceHead, mergeCommitSha, input.signal))) {
      throw new GitInputError("Observed merge commit does not contain the expected PR head");
    }
    if (!(await this.isAncestor(mergeCommitSha, fetchedHead, input.signal))) {
      throw new GitInputError("Observed remote target does not contain the exact merge commit");
    }

    const localHead = await this.requiredRefHead(
      `refs/heads/${targetBranch}`,
      input.signal
    );
    if (!(await this.isAncestor(localHead, fetchedHead, input.signal))) {
      throw new GitInputError("Remote merge target diverged from the retained local target");
    }
    if (localHead === fetchedHead) {
      return {
        projectId: this.projectId,
        operationId,
        targetBranch,
        temporaryRef,
        expectedSourceHead,
        mergeCommitSha,
        remoteHead: fetchedHead,
        localHeadBefore: localHead,
        localHeadAfter: localHead,
        status: "already_synchronized",
        observedAt: this.now()
      };
    }

    if (checkedOutPath) {
      await this.command(
        checkedOutPath,
        ["merge", "--ff-only", fetchedHead],
        input.signal
      );
    } else {
      await this.command(
        this.repositoryPath,
        ["update-ref", `refs/heads/${targetBranch}`, fetchedHead, localHead],
        input.signal
      );
    }
    const updated = await this.requiredRefHead(
      `refs/heads/${targetBranch}`,
      input.signal
    );
    if (updated !== fetchedHead) {
      throw new OperationStoreViolationError("Local merge target did not reach the observed remote head");
    }
    return {
      projectId: this.projectId,
      operationId,
      targetBranch,
      temporaryRef,
      expectedSourceHead,
      mergeCommitSha,
      remoteHead: fetchedHead,
      localHeadBefore: localHead,
      localHeadAfter: updated,
      status: "synchronized",
      observedAt: this.now()
    };
  }

  async createGroupBranch(
    groupRunId: GroupRunId,
    baseCommit: string,
    signal?: AbortSignal,
    integrationTarget?: string
  ): Promise<GroupBranchBinding> {
    await this.assertBareRepository();
    const branch = this.groupBranch(groupRunId);
    const base = safeSha(baseCommit, "baseCommit");
    await this.assertCommitExists(base, signal);
    const existing = await this.refHead(`refs/heads/${branch}`, signal);
    if (existing && existing !== base && !(await this.isAncestor(base, existing, signal))) {
      throw new GitInputError("Existing group branch diverged from its activation base");
    }
    if (!existing) {
      if (integrationTarget) {
        const target = this.remoteMergeTarget(integrationTarget);
        const targetHead = await this.requiredRefHead(`refs/heads/${target}`, signal);
        if (targetHead !== base) {
          throw new GitInputError("Group activation base is not the current local integration target head");
        }
      }
      await this.command(
        this.repositoryPath,
        ["update-ref", `refs/heads/${branch}`, base, "0000000000000000000000000000000000000000"],
        signal
      );
    }
    return { groupRunId, branch, baseCommit: base };
  }

  async pathsForExecution(
    execution: GitExecutionAuthority,
    expectedOwnershipEpoch: number
  ): Promise<ExecutionPaths> {
    const branch = this.expectedExecutionBranch(execution);
    await this.assertAuthority(
      execution,
      expectedOwnershipEpoch,
      branch,
      "retained.observe"
    );
    const memoryAgent = safeAgentId(execution.agentId);
    return {
      executionWorktree: this.worktreeFor(execution),
      ownedMemoryPath: path.join(
        this.worktreeFor(execution),
        "agent-memory",
        memoryAgent,
        "Memory.md"
      ),
      executionBranch: branch
    };
  }

  async createDeliveryWorktree(
    execution: GitExecutionAuthority,
    expectedOwnershipEpoch: number,
    base: DeliveryBase,
    signal?: AbortSignal
  ): Promise<LocalWorktreeFact> {
    if (execution.purpose !== "delivery") {
      throw new GitInputError("Only a delivery execution receives an execution branch");
    }
    const branch = this.deliveryBranch(execution.id);
    await this.assertAuthority(
      execution,
      expectedOwnershipEpoch,
      branch,
      "worktree.create"
    );
    const baseRef = this.deliveryBaseRef(base);
    await this.assertRefOrCommitExists(baseRef, signal);
    return this.ensureWorktree(execution, branch, baseRef, true, signal);
  }

  async createFinalIntegrationWorktree(
    execution: GitExecutionAuthority,
    expectedOwnershipEpoch: number,
    groupRunId: GroupRunId,
    signal?: AbortSignal
  ): Promise<LocalWorktreeFact> {
    if (execution.purpose !== "final-integration") {
      throw new GitInputError("Final integration worktree requires final-integration purpose");
    }
    if (execution.groupRunId !== groupRunId) {
      throw new GitInputError("Final integration execution belongs to another group run");
    }
    const groupBranch = this.groupBranch(groupRunId);
    const branch = this.expectedExecutionBranch(execution);
    await this.assertAuthority(
      execution,
      expectedOwnershipEpoch,
      branch,
      "worktree.create"
    );
    await this.assertRefOrCommitExists(groupBranch, signal);
    return this.ensureWorktree(
      execution,
      branch,
      groupBranch,
      branch !== groupBranch,
      signal
    );
  }

  async observeDeliveryPreparation(execution: GitExecutionAuthority, expectedOwnershipEpoch: number,
    signal?: AbortSignal): Promise<LocalDeliveryPreparationFact> {
    if (execution.purpose !== "delivery") throw new GitInputError("Preparation observation requires a delivery execution");
    const branch = this.expectedExecutionBranch(execution), worktreePath = this.worktreeFor(execution);
    await this.assertAuthority(execution, expectedOwnershipEpoch, branch, "retained.observe");
    await this.assertBareRepository();
    const head = await this.refHead(`refs/heads/${branch}`, signal);
    const activationBase = await this.refHead(this.executionBaseRef(execution.id), signal);
    await this.assertAuthority(execution, expectedOwnershipEpoch, branch, "retained.observe");
    if (head !== await this.refHead(`refs/heads/${branch}`, signal) ||
      activationBase !== await this.refHead(this.executionBaseRef(execution.id), signal)) {
      throw new GitInputError("Delivery preparation refs changed during observation");
    }
    return { projectId: this.projectId, executionId: execution.id, ownershipEpoch: expectedOwnershipEpoch,
      branch, worktreePath, ...(head ? { head } : {}), ...(activationBase ? { activationBase } : {}), observedAt: this.now() };
  }

  async observeRetainedExecution(
    execution: GitExecutionAuthority,
    expectedOwnershipEpoch: number,
    signal?: AbortSignal
  ): Promise<LocalWorktreeFact> {
    const branch = this.expectedExecutionBranch(execution);
    await this.assertAuthority(
      execution,
      expectedOwnershipEpoch,
      branch,
      "retained.observe"
    );
    return this.observeWorktree(execution, branch, signal);
  }

  /** Read the owning checkout without refreshing its index or choosing what
   * to keep. The Agent closes its own files; this never stages or deletes. */
  async observeExecutionWorktree(execution: GitExecutionAuthority, expectedOwnershipEpoch: number,
    signal?: AbortSignal): Promise<LocalWorktreeStatusFact> {
    const observed = await this.observeRetainedExecution(execution, expectedOwnershipEpoch, signal);
    const status = await this.runner.run({ cwd: observed.worktreePath,
      args: ["status", "--porcelain=v1", "-z", "--untracked-files=all", "--ignored=traditional", "--ignore-submodules=none"],
      signal, acceptedExitCodes: [0], environment: { GIT_OPTIONAL_LOCKS: "0" }, completeOutput: true,
      beforeSpawn: () => this.assertAuthority(execution, expectedOwnershipEpoch, observed.branch, "retained.observe") });
    if (status.stdout && !status.stdout.endsWith("\0")) {
      throw new GitInputError("Incomplete Git worktree status");
    }
    const entries = status.stdout.split("\0"), pendingPaths: string[] = [];
    for (let index = 0; index < entries.length; index += 1) {
      const entry = entries[index];
      if (!entry) continue;
      if (entry.length < 4 || entry[2] !== " ") throw new GitInputError("Invalid Git worktree status");
      pendingPaths.push(entry.slice(3));
      // -z returns a separate original path after a rename/copy destination.
      if (/[RC]/.test(entry.slice(0, 2))) {
        if (!entries[++index]) throw new GitInputError("Incomplete Git rename status");
        pendingPaths.push(entries[index]);
      }
    }
    await this.assertAuthority(execution, expectedOwnershipEpoch, observed.branch, "retained.observe");
    const after = await this.observeWorktree(execution, observed.branch, signal);
    if (after.head !== observed.head) throw new GitInputError("Execution head moved during closing observation");
    return { ...after, pendingPaths: [...new Set(pendingPaths)] };
  }

  async inspectExecution(execution: GitExecutionAuthority, epoch: number, directBase: string,
    request: GitInspectionRequest, signal?: AbortSignal) {
    if (execution.restrictedClosing || execution.purpose !== "delivery") throw new GitInputError("History tools require a current business task");
    const branch = this.expectedExecutionBranch(execution);
    const verify = () => this.assertAuthority(execution, epoch, branch, "provider.mutate");
    await verify();
    const before = await this.observeWorktree(execution, branch, signal);
    const base = this.remoteMergeTarget(directBase);
    const directBaseHead = await this.requiredRefHead(`refs/heads/${base}`, signal);
    const activationBase = await this.refHead(this.executionBaseRef(execution.id), signal);
    const result = await inspectGit({ request, head: before.head, agentId: execution.agentId,
      projectId: this.projectId, executionId: execution.id, branch, directBase: base, directBaseHead, activationBase,
      run: async (args, acceptedExitCodes = [0]) => {
        await verify();
        return this.runner.run({ cwd: before.worktreePath, args, signal, acceptedExitCodes,
          environment: { GIT_OPTIONAL_LOCKS: "0" }, completeOutput: true, beforeSpawn: verify });
      } });
    await verify();
    if ((await this.observeWorktree(execution, branch, signal)).head !== before.head ||
      await this.requiredRefHead(`refs/heads/${base}`, signal) !== directBaseHead) throw new GitInputError("Git refs changed during inspection; read again");
    return result;
  }

  async revertExecution(execution: GitExecutionAuthority, epoch: number, request: GitRevertRequest,
    attemptId: string, source?: HistoricalPullSource, signal?: AbortSignal, directBase = "main") {
    if (execution.purpose !== "delivery" || execution.restrictedClosing) throw new GitInputError("Revert requires a current business task; completed/closing/final tasks cannot be revived");
    const worktree = this.worktreeFor(execution);
    const previous = this.revertTails.get(worktree) ?? Promise.resolve();
    const operation = previous.then(async () => {
      const branch = this.expectedExecutionBranch(execution);
      const verify = async () => {
        signal?.throwIfAborted();
        await this.assertAuthority(execution, epoch, branch, "checkpoint");
        await this.observeWorktree(execution, branch, signal);
      };
      await verify();
      const activationBase = await this.requiredRefHead(this.executionBaseRef(execution.id), signal);
      const directBaseHead = await this.requiredRefHead(`refs/heads/${this.remoteMergeTarget(directBase)}`, signal);
      const gitDirectory = path.normalize((await this.command(worktree, ["rev-parse", "--absolute-git-dir"], signal)).stdout.trim());
      if (!isWithin(gitDirectory, this.repositoryPath) || await fs.realpath(gitDirectory) !== gitDirectory) throw new GitPathViolationError("Revert metadata escaped the bound repository");
      return revertGit({ projectId: this.projectId, execution, activationBase, directBaseHead,
        markerPath: path.join(gitDirectory, "openfars-revert.json"), store: this.operationStore, request, attemptId, source, verify,
        run: async (args, mutation = false, acceptedExitCodes = [0], expectedHead) => {
          await verify();
          return this.runner.run({ cwd: worktree, args, signal, acceptedExitCodes,
            ...(!mutation ? { completeOutput: true, environment: { GIT_OPTIONAL_LOCKS: "0" } } : {}),
            beforeSpawn: async () => {
              await verify();
              if (mutation && (!expectedHead || await this.worktreeHead(worktree, signal) !== expectedHead)) throw new GitInputError("Revert actual HEAD changed before its exact mutation");
            } });
        } });
    });
    const tail = operation.then(() => undefined, () => undefined);
    this.revertTails.set(worktree, tail);
    try { return await operation; }
    finally { if (this.revertTails.get(worktree) === tail) this.revertTails.delete(worktree); }
  }

  private async assertRestrictedClosingGitBoundary(worktreePath: string, signal?: AbortSignal): Promise<void> {
    // An in-progress Git operation is not a clean closing boundary, even
    // if its index happens to contain no conflicts at this instant.
    for (const marker of ["MERGE_HEAD", "CHERRY_PICK_HEAD", "REVERT_HEAD", "BISECT_LOG", "rebase-apply", "rebase-merge", "sequencer", "index.lock"]) {
      const location = (await this.command(worktreePath,
        ["rev-parse", "--path-format=absolute", "--git-path", marker], signal)).stdout.trim();
      if (!isWithin(location, this.repositoryPath)) throw new GitPathViolationError("Closing Git state escaped the project repository");
      if (await this.pathExists(location)) throw new GitInputError("Restricted closing cannot continue an unfinished Git operation");
    }
    if ((await this.command(worktreePath, ["ls-files", "--unmerged", "-z"], signal,
      [0], undefined, { GIT_OPTIONAL_LOCKS: "0" })).stdout) throw new GitInputError("Restricted closing cannot contain unresolved index conflicts");
  }

  /** Discover only actual pending/A-to-head paths of a retained original
   * checkout. This cannot infer authorship, grant a capability or write Git. */
  async identifyRestrictedWorktreeClosing(execution: GitExecutionAuthority, expectedOwnershipEpoch: number,
    original: Pick<RestrictedWorktreeClosingScope, "kind" | "reportHeadSha">, signal?: AbortSignal): Promise<RestrictedWorktreeClosingFact | undefined> {
    if (!["completed-leftovers", "bound-report-memory"].includes(original.kind) || !/^[0-9a-f]{40}$/i.test(original.reportHeadSha)) {
      throw new GitInputError("Closing discovery requires its exact original kind and immutable report head");
    }
    const before = await this.observeExecutionWorktree(execution, expectedOwnershipEpoch, signal);
    await this.assertRestrictedClosingGitBoundary(before.worktreePath, signal);
    await this.assertCommitExists(original.reportHeadSha, signal);
    if (original.reportHeadSha !== before.head && !(await this.isAncestor(original.reportHeadSha, before.head, signal))) {
      throw new GitInputError("Closing discovery head is not descended from the immutable business report");
    }
    const raw = await this.command(this.repositoryPath,
      ["diff-tree", "--no-commit-id", "-r", "--raw", "-z", "--no-renames", original.reportHeadSha, before.head, "--"], signal);
    if (raw.stdout.length >= 16_000) throw new GitInputError("Closing discovery diff exceeds the trusted complete observation limit");
    const paths = [...new Set([...before.pendingPaths, ...restrictedClosingDiffCandidatePaths(raw.stdout)])].sort();
    if (!paths.length) {
      if (before.head !== original.reportHeadSha) throw new GitInputError("Closing head changed without identifiable file changes; direct-Leader coordination is required");
      const after = await this.observeExecutionWorktree(execution, expectedOwnershipEpoch, signal);
      if (before.head !== after.head || after.pendingPaths.length) throw new GitInputError("Execution changed during closing discovery");
      await this.assertRestrictedClosingGitBoundary(after.worktreePath, signal);
      return undefined;
    }
    const observed = await this.observeRestrictedWorktreeClosing(execution, expectedOwnershipEpoch, { ...original, paths }, signal);
    if (observed.head !== before.head || JSON.stringify([...observed.pendingPaths].sort()) !== JSON.stringify([...before.pendingPaths].sort())) {
      throw new GitInputError("Execution changed during closing discovery");
    }
    return observed;
  }

  /** Verify a prospective closing delivery without reopening the original
   * business owner or changing its report, index, files, refs or Git journal.
   * The manager grant/native lifecycle are separate mandatory fences. */
  async observeRestrictedWorktreeClosing(execution: GitExecutionAuthority, expectedOwnershipEpoch: number,
    scope: RestrictedWorktreeClosingScope, signal?: AbortSignal): Promise<RestrictedWorktreeClosingFact> {
    const files = restrictedClosingPaths(execution, scope);
    const before = await this.observeExecutionWorktree(execution, expectedOwnershipEpoch, signal);
    await this.assertCommitExists(scope.reportHeadSha, signal);
    if (scope.reportHeadSha !== before.head && !(await this.isAncestor(scope.reportHeadSha, before.head, signal))) {
      throw new GitInputError("Closing head is not descended from the immutable business report");
    }
    const inspect = async () => {
      await this.assertRestrictedClosingGitBoundary(before.worktreePath, signal);
      await assertRestrictedClosingFiles(before.worktreePath, files);
      const raw = await this.command(this.repositoryPath,
        ["diff-tree", "--no-commit-id", "-r", "--raw", "-z", "--no-renames", scope.reportHeadSha, before.head, "--"], signal);
      if (raw.stdout.length >= 16_000) throw new GitInputError("Restricted closing diff exceeds the trusted complete observation limit");
      return restrictedClosingDiffPaths(raw.stdout, files);
    };
    const committedPaths = await inspect();
    const after = await this.observeExecutionWorktree(execution, expectedOwnershipEpoch, signal);
    if (before.head !== after.head || JSON.stringify([...before.pendingPaths].sort()) !== JSON.stringify([...after.pendingPaths].sort())) {
      throw new GitInputError("Execution changed during restricted closing observation");
    }
    if (after.pendingPaths.some(file => !files.includes(file))) {
      throw new GitPathViolationError("Closing worktree contains pending files outside the manager-authorized manifest");
    }
    // Recheck path types and operation markers after the status read. Native
    // stop and the per-operation broker fence still govern subsequent writes.
    await inspect();
    const final = await this.observeExecutionWorktree(execution, expectedOwnershipEpoch, signal);
    if (after.head !== final.head || JSON.stringify([...after.pendingPaths].sort()) !== JSON.stringify([...final.pendingPaths].sort())) {
      throw new GitInputError("Execution changed during restricted closing observation");
    }
    await this.assertAuthority(execution, expectedOwnershipEpoch, after.branch, "retained.observe");
    return { ...final, kind: scope.kind, reportHeadSha: scope.reportHeadSha, authorizedPaths: files,
      committedPaths, deliveryRequired: final.head !== scope.reportHeadSha };
  }

  async observeRestrictedWorktreeClosingTarget(execution: GitExecutionAuthority, ownershipEpoch: number,
    target: string, expectedRemoteHead: string, requiredHeads: readonly string[], signal?: AbortSignal
  ): Promise<Omit<RestrictedWorktreeClosingTargetFact, "owner" | "repository">> {
    const branch = this.expectedExecutionBranch(execution), targetBranch = this.remoteMergeTarget(target);
    if (!/^[a-f0-9]{40}$/i.test(expectedRemoteHead) || !requiredHeads.length || requiredHeads.length > 4 ||
      requiredHeads.some(head => !/^[a-f0-9]{40}$/i.test(head))) throw new GitInputError("Closing target requires exact delivery commit identities");
    await this.assertAuthority(execution, ownershipEpoch, branch, "retained.observe");
    const localHead = await this.requiredRefHead(`refs/heads/${targetBranch}`, signal);
    if (localHead !== expectedRemoteHead) throw new GitInputError("Closing target local branch differs from its actual remote head");
    const includedHeads = [...new Set(requiredHeads)].sort();
    for (const head of includedHeads) {
      await this.assertCommitExists(head, signal);
      if (head !== localHead && !(await this.isAncestor(head, localHead, signal))) {
        throw new GitInputError("Closing target does not contain every exact A/B delivery commit");
      }
    }
    await this.assertAuthority(execution, ownershipEpoch, branch, "retained.observe");
    if (await this.requiredRefHead(`refs/heads/${targetBranch}`, signal) !== localHead) throw new GitInputError("Closing target changed during observation");
    return { projectId: this.projectId, executionId: execution.id, ownershipEpoch, targetBranch, localHead,
      remoteHead: expectedRemoteHead, includedHeads, observedAt: this.now() };
  }

  /** Restore the immutable activation-base marker for a retained execution.
   *
   * A retry may retain a branch and checkout after the marker ref was lost
   * during recovery. Only durable prior turn bases supplied by the caller may
   * recreate it; each candidate must be an ancestor of the retained branch.
   * The ref is created with a zero-old-value CAS and is never moved when it
   * already exists.
   */
  async restoreRetainedExecutionBase(
    execution: GitExecutionAuthority,
    expectedOwnershipEpoch: number,
    baseCandidates: readonly string[],
    signal?: AbortSignal
  ): Promise<string> {
    const branch = this.expectedExecutionBranch(execution);
    await this.assertAuthority(
      execution,
      expectedOwnershipEpoch,
      branch,
      "retained.observe"
    );
    const observed = await this.observeWorktree(execution, branch, signal);
    const ref = this.executionBaseRef(execution.id);
    const existing = await this.refHead(ref, signal);
    if (existing) {
      if (existing !== observed.head && !(await this.isAncestor(existing, observed.head, signal))) {
        throw new GitInputError("Retained execution diverged from its recorded activation base");
      }
      return existing;
    }

    const candidates = [...new Set(baseCandidates.map((candidate) => safeSha(candidate, "execution base")))];
    const valid: string[] = [];
    for (const candidate of candidates) {
      await this.assertCommitExists(candidate, signal);
      if (candidate === observed.head || await this.isAncestor(candidate, observed.head, signal)) valid.push(candidate);
    }
    // Prefer the oldest strict ancestor so an already-created business commit
    // remains publishable on a retained retry. An equal HEAD is only a
    // fallback for a retained checkout whose earlier native turn never opened.
    const candidate = valid.find((value) => value !== observed.head) ?? valid.find((value) => value === observed.head);
    if (!candidate) throw new GitInputError("Retained execution has no authoritative activation base");
    await this.ensureExecutionBaseRef(execution.id, candidate, signal);
    const restored = await this.requiredRefHead(ref, signal);
    if (restored !== candidate) throw new OperationStoreViolationError("Retained execution base changed during recovery");
    return restored;
  }

  async checkpointExecution(
    execution: GitExecutionAuthority,
    expectedOwnershipEpoch: number,
    options: {
      kind: "checkpoint" | "report" | "conflict-resolution";
      operationMarker?: OperationId;
      taskId?: string;
      taskTitle?: string;
      reason?: string;
      signal?: AbortSignal;
    }
  ): Promise<LocalCheckpointFact> {
    const branch = this.expectedExecutionBranch(execution);
    await this.assertAuthority(
      execution,
      expectedOwnershipEpoch,
      branch,
      "checkpoint"
    );
    const observed = await this.observeWorktree(execution, branch, options.signal);
    if (execution.restrictedClosing) return this.checkpointRestrictedClosing(execution, expectedOwnershipEpoch, options);
    const base = await this.requiredRefHead(
      this.executionBaseRef(execution.id),
      options.signal
    );
    if (observed.head !== base && !(await this.isAncestor(base, observed.head, options.signal))) {
      throw new GitInputError(
        "Harness commit history no longer descends from the execution base"
      );
    }
    return {
      ...observed,
      commitSha: observed.head,
      changed: observed.head !== base,
      ...(options.operationMarker ? { operationMarker: options.operationMarker } : {}),
      observedAt: this.now()
    };
  }

  /** Only an explicit closing Agent's git_push reaches this checkpoint. The
   * immutable tree is checked before a commit can advance the original ref;
   * concurrent index changes cannot be silently included by `git commit`. */
  private async checkpointRestrictedClosing(execution: GitExecutionAuthority, epoch: number,
    options: Parameters<LocalCollaborationGitService["checkpointExecution"]>[2]): Promise<LocalCheckpointFact> {
    const scope = execution.restrictedClosing!.scope, signal = options.signal;
    if (!this.operationStore.recordRestrictedClosingCheckpoint) throw new GitInputError("Closing checkpoint requires its invocation-bound durable journal");
    if (options.kind !== "checkpoint" || !options.reason?.trim() || options.reason.length > 8192 ||
      containsCredentialMaterial(options.reason)) throw new GitInputError("Closing checkpoint requires the Agent's explicit commit reason");
    const before = await this.observeRestrictedWorktreeClosing(execution, epoch, scope, signal);
    const guard = async () => {
      await this.assertAuthority(execution, epoch, before.branch, "checkpoint");
      const current = await this.observeRestrictedWorktreeClosing(execution, epoch, scope, signal);
      if (current.head !== before.head) throw new GitInputError("Closing head moved before checkpoint");
      for (let offset = 0; offset < before.pendingPaths.length; offset += 50) {
        const attributes = await this.command(before.worktreePath,
          ["check-attr", "-z", "filter", "--", ...before.pendingPaths.slice(offset, offset + 50)], signal);
        const fields = attributes.stdout.split("\0");
        if (attributes.stdout.length >= 16_000 || fields.pop() !== "" || fields.length % 3 ||
          fields.some((field, index) => index % 3 === 1 && field !== "filter" ||
            index % 3 === 2 && !["unspecified", "unset"].includes(field))) {
          throw new GitInputError("Restricted closing cannot run a checkout's external Git filter");
        }
      }
    };
    // Literal pathspecs include deletion, but never directories or everything
    // in the checkout. The manifest and actual index are checked again below.
    for (let offset = 0; offset < before.pendingPaths.length; offset += 50) {
      await this.command(before.worktreePath,
        ["add", "--all", "--", ...before.pendingPaths.slice(offset, offset + 50).map(file => `:(literal)${file}`)],
        signal, [0], undefined, undefined, false, guard);
    }
    await guard();
    const tree = safeSha((await this.command(before.worktreePath, ["write-tree"], signal)).stdout.trim(), "closing tree");
    const inspectTree = async (head: string) => {
      const raw = await this.command(this.repositoryPath,
        ["diff-tree", "--no-commit-id", "-r", "--raw", "-z", "--no-renames", scope.reportHeadSha, head, "--"], signal);
      if (raw.stdout.length >= 16_000) throw new GitInputError("Restricted closing diff exceeds the complete observation limit");
      restrictedClosingDiffPaths(raw.stdout, restrictedClosingPaths(execution, scope));
    };
    await inspectTree(tree);
    const oldTree = (await this.command(before.worktreePath, ["rev-parse", "HEAD^{tree}"], signal)).stdout.trim();
    let head = before.head;
    if (tree !== oldTree) {
      const name = `OpenFARS Agent ${safeAgentId(execution.agentId)}`;
      const email = `openfars-agent+${sha256(execution.agentId).slice(0, 16)}@localhost`;
      head = safeSha((await this.command(this.repositoryPath,
        ["commit-tree", tree, "-p", before.head, "-F", "-"], signal, [0], `${options.reason.trim()}\n`,
        { GIT_AUTHOR_NAME: name, GIT_AUTHOR_EMAIL: email, GIT_COMMITTER_NAME: name, GIT_COMMITTER_EMAIL: email },
        false, guard)).stdout.trim(), "closing commit");
      await inspectTree(head);
      await this.command(this.repositoryPath, ["update-ref", `refs/heads/${before.branch}`, head, before.head],
        signal, [0], undefined, undefined, false, guard);
    }
    await this.assertAuthority(execution, epoch, before.branch, "checkpoint");
    const after = await this.observeRestrictedWorktreeClosing(execution, epoch, scope, signal);
    if (after.head !== head || after.pendingPaths.length) throw new GitInputError("Closing checkpoint changed or remains dirty; cannot publish");
    await this.operationStore.recordRestrictedClosingCheckpoint({ projectId: this.projectId, executionId: execution.id,
      ownershipEpoch: epoch, restrictedClosing: execution.restrictedClosing!, observation: after });
    return { ...after, commitSha: head, changed: head !== scope.reportHeadSha,
      ...(options.operationMarker ? { operationMarker: options.operationMarker } : {}) };
  }

  async prepareOwnerResolution(
    execution: GitExecutionAuthority,
    expectedOwnershipEpoch: number,
    source:
      | { kind: "main"; expectedHead: string }
      | { kind: "group"; groupRunId: GroupRunId; expectedHead: string },
    signal?: AbortSignal
  ): Promise<OwnerResolutionFact> {
    const branch = this.expectedExecutionBranch(execution);
    await this.assertAuthority(
      execution,
      expectedOwnershipEpoch,
      branch,
      "merge.prepare"
    );
    const worktree = this.worktreeFor(execution);
    await this.observeWorktree(execution, branch, signal);
    const status = await this.command(worktree, ["status", "--porcelain=v1"], signal);
    if (status.stdout.trim()) {
      throw new GitInputError("Execution worktree must be clean before conflict preparation");
    }
    const sourceBranch = source.kind === "main"
      ? MAIN_BRANCH
      : this.groupBranch(source.groupRunId);
    const expectedSourceHead = safeSha(source.expectedHead, "expectedHead");
    const sourceHead = await this.requiredRefHead(`refs/heads/${sourceBranch}`, signal);
    if (sourceHead !== expectedSourceHead) {
      throw new GitInputError("Conflict source moved from its expected head");
    }
    const currentHead = await this.worktreeHead(worktree, signal);
    if (await this.isAncestor(sourceHead, currentHead, signal)) {
      return {
        projectId: this.projectId,
        executionId: execution.id,
        executionBranch: branch,
        sourceBranch,
        sourceHead,
        status: "already_contained",
        conflictPaths: [],
        observedAt: this.now()
      };
    }
    const merged = await this.command(
      worktree,
      ["merge", "--no-commit", "--no-ff", sourceHead],
      signal,
      [0, 1]
    );
    const conflicts = merged.code === 1
      ? await this.unmergedPaths(worktree, signal)
      : [];
    return {
      projectId: this.projectId,
      executionId: execution.id,
      executionBranch: branch,
      sourceBranch,
      sourceHead,
      status: conflicts.length > 0 ? "conflicted" : "ready_to_commit",
      conflictPaths: conflicts,
      observedAt: this.now()
    };
  }

  async integrateExecutionIntoGroup(
    execution: GitExecutionAuthority,
    expectedOwnershipEpoch: number,
    groupRunId: GroupRunId,
    expectedSourceHead: string,
    expectedTargetHead: string,
    signal?: AbortSignal
  ): Promise<LocalMergeFact> {
    const source = this.deliveryBranch(execution.id);
    await this.assertAuthority(
      execution,
      expectedOwnershipEpoch,
      source,
      "merge.integrate"
    );
    return this.integrateRefs(
      source,
      this.groupBranch(groupRunId),
      expectedSourceHead,
      expectedTargetHead,
      signal
    );
  }

  async integrateExecutionIntoMain(
    execution: GitExecutionAuthority,
    expectedOwnershipEpoch: number,
    expectedSourceHead: string,
    expectedMainHead: string,
    signal?: AbortSignal
  ): Promise<LocalMergeFact> {
    const source = this.deliveryBranch(execution.id);
    await this.assertAuthority(
      execution,
      expectedOwnershipEpoch,
      source,
      "merge.integrate"
    );
    return this.integrateRefs(
      source,
      MAIN_BRANCH,
      expectedSourceHead,
      expectedMainHead,
      signal
    );
  }

  async integrateGroupIntoMain(
    execution: GitExecutionAuthority,
    expectedOwnershipEpoch: number,
    groupRunId: GroupRunId,
    expectedGroupHead: string,
    expectedMainHead: string,
    signal?: AbortSignal
  ): Promise<LocalMergeFact> {
    if (execution.purpose !== "final-integration" || execution.groupRunId !== groupRunId) {
      throw new GitInputError("Only the member-owned final integration execution may integrate a group");
    }
    const branch = this.expectedExecutionBranch(execution);
    await this.assertAuthority(
      execution,
      expectedOwnershipEpoch,
      branch,
      "merge.integrate"
    );
    return this.integrateRefs(
      branch,
      MAIN_BRANCH,
      expectedGroupHead,
      expectedMainHead,
      signal
    );
  }

  /** Isolated index/CAS: no Agent checkout, business task or fabricated report. */
  async commitGroupCompletion(groupRunId: GroupRunId, operationId: OperationId, expectedHead: string,
    content: string, signal?: AbortSignal): Promise<string> {
    safeId(operationId, "operationId");
    assertMemoryContent(content);
    await this.assertBareRepository();
    const branch = this.groupBranch(groupRunId);
    const relativePath = `workflow-results/${safeRefComponent(groupRunId, "groupRunId")}.json`;
    const ref = `refs/heads/${branch}`;
    await this.assertRemoteMergeTargetAvailable(branch, undefined, signal);
    const prior = await this.findCommitByMarker(branch, operationId, signal);
    if (prior) {
      if (expectedHead !== prior && expectedHead !== await this.commitParent(prior, signal)) throw new GitInputError("Completion retry changed its canonical head");
      const retained = await this.command(this.repositoryPath, ["rev-parse", `${prior}:${relativePath}`], signal);
      if (retained.stdout.trim() !== await this.hashBlob(content, signal) || await this.requiredRefHead(ref, signal) !== prior) throw new GitInputError("Completion retry changed its retained facts");
      return prior;
    }
    safeSha(expectedHead, "expected group head");
    if (await this.requiredRefHead(ref, signal) !== expectedHead) throw new GitInputError("Group moved before completion checkpoint");
    const indexPath = path.join(this.repositoryPath, `openfars-management-${operationId}-${randomUUID()}.index`);
    const environment = { GIT_INDEX_FILE: indexPath, ...SERVICE_IDENTITY };
    try {
      await this.command(this.repositoryPath, ["read-tree", expectedHead], signal, [0], undefined, environment);
      const blob = await this.hashBlob(content, signal);
      await this.command(this.repositoryPath, ["update-index", "--add", "--cacheinfo", `100644,${blob},${relativePath}`], signal, [0], undefined, environment);
      const tree = (await this.command(this.repositoryPath, ["write-tree"], signal, [0], undefined, environment)).stdout.trim();
      const commit = await this.commitTree(safeSha(tree, "completion tree"), [expectedHead],
        `Record group completion ${groupRunId}\n\nOpenFARS-Runtime: group-finish-receipt\nOpenFARS-Operation: ${operationId}`, signal);
      // Recheck live S authority after object creation, before advancing the ref.
      const authority = await this.operationStore.scopedGroupCompletionReport?.(this.projectId, groupRunId);
      if (!authority || authority.branch !== branch || authority.content !== content) throw new GitInputError("Completion authority was revoked or changed");
      await this.command(this.repositoryPath, ["update-ref", ref, commit, expectedHead], signal);
      return commit;
    } finally { await fs.rm(indexPath, { force: true }).catch(() => undefined); }
  }

  async commitManagementMemory(
    agentId: AgentId,
    operationId: OperationId,
    content: string,
    options: { expectedHead?: string; signal?: AbortSignal } = {}
  ): Promise<ManagementMemorySnapshot> {
    assertMemoryContent(content);
    await this.assertBareRepository();
    const memoryAgent = safeAgentId(agentId);
    const relativePath = `agent-memory/${memoryAgent}/Memory.md`;
    const requestedExpectedHead = options.expectedHead
      ? safeSha(options.expectedHead, "expectedHead")
      : undefined;
    const priorCommit = await this.findCommitByMarker(
      MANAGEMENT_BRANCH,
      operationId,
      options.signal
    );
    const operationParent = priorCommit
      ? await this.commitParent(priorCommit, options.signal)
      : undefined;
    if (priorCommit && requestedExpectedHead &&
      requestedExpectedHead !== priorCommit &&
      requestedExpectedHead !== operationParent &&
      !(await this.isAncestor(priorCommit, requestedExpectedHead, options.signal))) {
      throw new GitInputError("Management-memory retry does not match its retained commit");
    }
    const expectedHead = priorCommit ? operationParent : requestedExpectedHead;
    const prepared = await prepareOperation(
      this.operationStore,
      {
        id: operationId,
        kind: "memory.commit",
        ...(expectedHead ? { expectedHead } : {})
      },
      {
        projectId: this.projectId,
        branch: MANAGEMENT_BRANCH,
        agentId: memoryAgent,
        path: relativePath,
        contentSha256: sha256(content),
        expectedHead
      }
    );
    const replayedCommit = this.managementCommitFromOperation(prepared);
    if (replayedCommit) {
      return this.readManagementSnapshot(options.signal, replayedCommit);
    }
    if (priorCommit) {
      const fact = await this.readManagementSnapshot(options.signal, priorCommit);
      const safeFact = this.managementOperationFact(fact);
      await finalizeOperation(this.operationStore, prepared, safeFact);
      return fact;
    }

    const oldHead = await this.refHead(
      `refs/heads/${MANAGEMENT_BRANCH}`,
      options.signal
    );
    if (oldHead !== expectedHead) {
      throw new GitInputError("Management branch moved from its expected head");
    }

    const indexPath = path.join(
      this.repositoryPath,
      `openfars-management-${safeId(operationId, "operationId")}-${randomUUID()}.index`
    );
    const environment = { GIT_INDEX_FILE: indexPath, ...SERVICE_IDENTITY };
    try {
      if (oldHead) {
        await this.command(
          this.repositoryPath,
          ["read-tree", oldHead],
          options.signal,
          [0],
          undefined,
          environment
        );
      } else {
        await this.command(
          this.repositoryPath,
          ["read-tree", "--empty"],
          options.signal,
          [0],
          undefined,
          environment
        );
      }
      const blob = await this.hashBlob(content, options.signal);
      await this.command(
        this.repositoryPath,
        ["update-index", "--add", "--cacheinfo", `100644,${blob},${relativePath}`],
        options.signal,
        [0],
        undefined,
        environment
      );
      const tree = (await this.command(
        this.repositoryPath,
        ["write-tree"],
        options.signal,
        [0],
        undefined,
        environment
      )).stdout.trim();
      safeSha(tree, "management tree");
      const commit = await this.commitTree(
        tree,
        oldHead ? [oldHead] : [],
        `Update management memory for ${memoryAgent}\n\nOpenFARS-Operation: ${operationId}`,
        options.signal
      );
      await this.command(
        this.repositoryPath,
        [
          "update-ref",
          `refs/heads/${MANAGEMENT_BRANCH}`,
          commit,
          oldHead ?? "0000000000000000000000000000000000000000"
        ],
        options.signal
      );
    } finally {
      await fs.rm(indexPath, { force: true }).catch(() => undefined);
    }
    const fact = await this.readManagementSnapshot(options.signal);
    const safeFact = this.managementOperationFact(fact);
    await finalizeOperation(this.operationStore, prepared, safeFact);
    return fact;
  }

  async readManagementSnapshot(
    signal?: AbortSignal,
    expectedCommit?: string
  ): Promise<ManagementMemorySnapshot> {
    await this.assertBareRepository();
    const head = await this.requiredRefHead(`refs/heads/${MANAGEMENT_BRANCH}`, signal);
    const commit = expectedCommit
      ? safeSha(expectedCommit, "expected management commit")
      : head;
    if (expectedCommit && !(await this.isAncestor(commit, head, signal))) {
      throw new GitInputError("Expected management memory commit is not retained in its branch");
    }
    const listing = await this.command(
      this.repositoryPath,
      ["ls-tree", "-r", "-z", "--name-only", commit, "--", "agent-memory"],
      signal
    );
    const entries = [];
    for (const relativePath of listing.stdout.split("\0").filter(Boolean).sort()) {
      const match = relativePath.match(/^agent-memory\/([^/]+)\/Memory\.md$/u);
      if (!match?.[1] || !SAFE_AGENT_ID.test(match[1])) {
        throw new GitPathViolationError("Management branch contains a forbidden path");
      }
      const content = (await this.command(
        this.repositoryPath,
        ["show", `${commit}:${relativePath}`],
        signal
      )).stdout;
      assertMemoryContent(content);
      entries.push({ agentId: match[1], path: relativePath, content });
    }
    return {
      branch: MANAGEMENT_BRANCH,
      commitSha: commit,
      provenance: `OpenFARS management memory snapshot from ${MANAGEMENT_BRANCH}@${commit}`,
      entries,
      observedAt: this.now()
    };
  }

  private deliveryBaseRef(base: DeliveryBase): string {
    if (base.kind === "main") return MAIN_BRANCH;
    if (base.kind === "group") {
      if (!base.groupRunId) throw new GitInputError("groupRunId is required for a group base");
      return this.groupBranch(base.groupRunId);
    }
    if (!base.commitSha) throw new GitInputError("commitSha is required for a commit base");
    return safeSha(base.commitSha, "commitSha");
  }

  private expectedExecutionBranch(execution: GitExecutionAuthority): string {
    let expected: string;
    if (execution.purpose === "final-integration") {
      if (!execution.groupRunId) {
        throw new GitInputError("Final integration requires groupRunId");
      }
      const groupBranch = this.groupBranch(execution.groupRunId);
      const repairBranch = this.deliveryBranch(execution.id);
      if (execution.executionBranch !== groupBranch &&
        execution.executionBranch !== repairBranch) {
        throw new GitInputError("Final integration branch is neither the group branch nor its fenced repair branch");
      }
      expected = execution.executionBranch;
    } else {
      expected = this.deliveryBranch(execution.id);
    }
    if (execution.executionBranch !== expected) {
      throw new GitInputError("Execution branch does not match the fixed branch convention");
    }
    return expected;
  }

  private remoteMergeTarget(value: string): "main" | `groups/${string}` {
    if (value === MAIN_BRANCH) return MAIN_BRANCH;
    const match = value.match(/^groups\/([A-Za-z0-9][A-Za-z0-9._-]{0,159})$/);
    if (!match?.[1] || this.groupBranch(match[1]) !== value) {
      throw new GitInputError("Pull request base is outside the fixed merge-target namespace");
    }
    return value as `groups/${string}`;
  }

  private async checkedOutWorktree(
    branch: string,
    signal?: AbortSignal
  ): Promise<string | undefined> {
    const result = await this.command(
      this.repositoryPath,
      ["worktree", "list", "--porcelain"],
      signal
    );
    let currentPath: string | undefined;
    for (const field of result.stdout.split(/\r?\n/)) {
      if (!field) { currentPath = undefined; continue; }
      if (field.startsWith("worktree ")) {
        currentPath = field.slice("worktree ".length);
      } else if (field === `branch refs/heads/${branch}`) {
        return currentPath;
      }
    }
    return undefined;
  }

  private async assertCheckedOutTargetAuthority(
    branch: string,
    checkedOutPath: string,
    authority: CheckedOutMergeTargetAuthority | undefined,
    signal?: AbortSignal
  ): Promise<void> {
    // Trusted PR synchronization may fast-forward the permanent, read-only
    // Main checkout, but must never discard uncommitted or foreign work.
    if (this.worktreeMode === "agent" && branch === MAIN_BRANCH &&
      path.resolve(checkedOutPath) === this.canonicalAgentWorktree("main") && !authority) {
      await this.prepareAgentManagementWorkspace("main", signal);
      const pending = (await this.command(checkedOutPath, ["status", "--porcelain=v1", "--untracked-files=all"], signal)).stdout.trimEnd();
      if (pending.trim()) {
        const entries = pending.split(/\r?\n/).slice(0, 100).map(line => line.slice(0, 1024));
        throw new GitInputError(`Main management worktree must be clean before synchronization. Main must review and preserve its pending files before retrying this merge. Pending entries:\n${entries.join("\n")}`, {
          blocker: "TARGET_WORKTREE_DIRTY", targetBranch: MAIN_BRANCH, targetAgentId: "main", pendingEntries: entries,
          recovery: "Return this blocker to Main to handle its own uncommitted files; retain the original PR and do not discard files or repeat the merge unchanged."
        });
      }
      return;
    }
    if (!authority) {
      throw new GitInputError(
        "Merge target is frozen while its final-integration worktree is retained"
      );
    }
    const { execution, ownershipEpoch } = authority;
    if (
      execution.purpose !== "final-integration" ||
      !execution.groupRunId ||
      this.groupBranch(execution.groupRunId) !== branch ||
      this.worktreeFor(execution) !== path.resolve(checkedOutPath)
    ) {
      throw new GitInputError("Checked-out merge target authority does not match its worktree");
    }
    await this.assertAuthority(execution, ownershipEpoch, branch, "merge.integrate");
    const status = await this.command(
      checkedOutPath,
      ["status", "--porcelain=v1"],
      signal
    );
    if (status.stdout.trim()) {
      throw new GitInputError("Checked-out merge target worktree must be clean before synchronization");
    }
  }

  private async assertAuthority(
    execution: GitExecutionAuthority,
    expectedOwnershipEpoch: number,
    branch: string,
    operation: Parameters<CollaborationGitOperationStore["assertExecutionOwnership"]>[0]["operation"]
  ): Promise<void> {
    safeId(execution.id, "executionId");
    safeAgentId(execution.agentId);
    if (execution.restrictedClosing) {
      const closing = execution.restrictedClosing;
      restrictedClosingPaths(execution, closing.scope);
      if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,255}$/.test(closing.invocationId) || !/^[a-f0-9]{64}$/.test(closing.capabilityHash) ||
        !["retained.observe", "checkpoint", "provider.mutate", "provider.close_terminal", "provider.reconcile_merged"].includes(operation)) {
        throw new GitInputError("Restricted closing does not grant general business Git authority");
      }
    }
    if (!Number.isSafeInteger(expectedOwnershipEpoch) || expectedOwnershipEpoch < 1) {
      throw new GitInputError("ownershipEpoch must be a positive safe integer");
    }
    if (execution.ownershipEpoch !== expectedOwnershipEpoch) {
      throw new GitOwnershipStaleError(execution.id, expectedOwnershipEpoch);
    }
    const expectedWorktree = this.worktreeFor(execution);
    if (path.resolve(execution.worktreePath) !== expectedWorktree) {
      throw new GitPathViolationError("Execution worktree does not match its fixed project path");
    }
    if (execution.executionBranch !== branch) {
      throw new GitInputError("Execution does not own the requested branch");
    }
    try {
      await this.operationStore.assertExecutionOwnership({
        projectId: this.projectId,
        executionId: execution.id,
        ownershipEpoch: expectedOwnershipEpoch,
        expectedBranch: branch,
        operation,
        ...(execution.restrictedClosing ? { restrictedClosing: execution.restrictedClosing } : {})
      });
    } catch (error) {
      if (error instanceof CollaborationGitError) throw error;
      throw new GitOwnershipStaleError(
        execution.id,
        expectedOwnershipEpoch,
        { cause: error }
      );
    }
  }

  private async ensureWorktree(
    execution: GitExecutionAuthority,
    branch: string,
    baseRef: string,
    createBranch: boolean,
    signal?: AbortSignal
  ): Promise<LocalWorktreeFact> {
    await this.assertBareRepository();
    await this.ensureWorktreeConfiguration(signal);
    await fs.mkdir(this.worktreeRoot, { recursive: true, mode: 0o700 });
    await this.assertDirectoryNotSymlink(this.worktreeRoot, "worktree root");
    await this.ensureOpenFarsLocalExcludes();
    const worktreePath = this.worktreeFor(execution);
    if (this.worktreeMode === "agent") {
      const agentRoot = path.dirname(worktreePath);
      await fs.mkdir(agentRoot, { recursive: true, mode: 0o700 });
      await this.assertDirectoryNotSymlink(agentRoot, "Agent worktree root");
    }
    if (await this.pathExists(worktreePath)) {
      if (this.worktreeMode === "agent") {
        await this.assertDirectoryNotSymlink(worktreePath, "Agent worktree");
        const currentBranch = (await this.command(
          worktreePath, ["symbolic-ref", "--quiet", "--short", "HEAD"], signal, [0, 1]
        )).stdout.trim();
        if (currentBranch !== branch) {
          const status = await this.command(
            worktreePath, ["status", "--porcelain=v1", "--untracked-files=all"], signal
          );
          if (status.stdout.trim()) {
            throw new GitInputError("Agent worktree is dirty; branch switch would risk unfinished work");
          }
          const baseSha = (await this.command(
            this.repositoryPath, ["rev-parse", "--verify", `${baseRef}^{commit}`], signal
          )).stdout.trim();
          const existingBranch = await this.refHead(`refs/heads/${branch}`, signal);
          if (!createBranch && !existingBranch) {
            throw new GitInputError("Final integration group branch does not exist");
          }
          if (createBranch && existingBranch) {
            const recordedBase = await this.refHead(this.executionBaseRef(execution.id), signal);
            if (!recordedBase && existingBranch !== baseSha) {
              throw new GitInputError("Existing execution branch has no verified activation base");
            }
            if (recordedBase && !(await this.isAncestor(recordedBase, existingBranch, signal))) {
              throw new GitInputError("Existing execution branch diverged from its recorded activation base");
            }
          }
          await this.command(
            worktreePath,
            existingBranch
              ? ["switch", branch]
              : ["switch", "-c", branch, baseSha],
            signal
          );
        }
      }
      const observed = await this.observeWorktree(execution, branch, signal);
      await this.ensureExecutionBaseRef(execution.id, observed.head, signal);
      await this.configureExecutionIdentity(worktreePath, execution, signal);
      return observed;
    }
    const existingBranch = await this.refHead(`refs/heads/${branch}`, signal);
    if (createBranch && existingBranch) {
      const baseSha = (await this.command(
        this.repositoryPath, ["rev-parse", "--verify", `${baseRef}^{commit}`], signal
      )).stdout.trim();
      const recordedBase = await this.refHead(this.executionBaseRef(execution.id), signal);
      if (recordedBase && !(await this.isAncestor(recordedBase, existingBranch, signal))) {
        throw new GitInputError("Existing execution branch diverged from its recorded activation base");
      }
      if (!recordedBase && existingBranch !== baseSha) {
        throw new GitInputError("Existing execution branch has no verified activation base");
      }
      // A preparation may have created the branch before its checkout was
      // attached. Reuse that exact branch only after validating its durable
      // base; `worktree add` attaches it without resetting its history.
      await this.command(
        this.repositoryPath,
        ["worktree", "add", "--", worktreePath, branch],
        signal
      );
    } else {
      if (!createBranch && !existingBranch) {
        throw new GitInputError("Final integration group branch does not exist");
      }
      await this.command(
        this.repositoryPath,
        createBranch
          ? ["worktree", "add", "-b", branch, "--", worktreePath, baseRef]
          : ["worktree", "add", "--", worktreePath, branch],
        signal
      );
    }
    const observed = await this.observeWorktree(execution, branch, signal);
    await this.ensureExecutionBaseRef(execution.id, observed.head, signal);
    await this.configureExecutionIdentity(worktreePath, execution, signal);
    return observed;
  }

  private async observeWorktree(
    execution: GitExecutionAuthority,
    branch: string,
    signal?: AbortSignal
  ): Promise<LocalWorktreeFact> {
    const worktreePath = this.worktreeFor(execution);
    await this.assertDirectoryNotSymlink(worktreePath, "execution worktree");
    const realWorktree = await fs.realpath(worktreePath);
    const realRoot = await fs.realpath(this.worktreeRoot);
    if (realWorktree !== worktreePath || !isWithin(realWorktree, realRoot)) {
      throw new GitPathViolationError("Execution worktree escaped its fixed root");
    }
    const observedBranch = (await this.command(
      worktreePath,
      ["symbolic-ref", "--short", "HEAD"],
      signal
    )).stdout.trim();
    if (observedBranch !== branch) {
      throw new GitPathViolationError("Execution worktree is attached to another branch");
    }
    const head = await this.worktreeHead(worktreePath, signal);
    return {
      projectId: this.projectId,
      executionId: execution.id,
      ownershipEpoch: execution.ownershipEpoch,
      branch,
      worktreePath,
      head,
      retained: true,
      observedAt: this.now()
    };
  }

  private async integrateRefs(
    sourceBranch: string,
    targetBranch: string,
    expectedSourceHead: string,
    expectedTargetHead: string,
    signal?: AbortSignal
  ): Promise<LocalMergeFact> {
    await this.assertBareRepository();
    const sourceHead = await this.requiredRefHead(`refs/heads/${sourceBranch}`, signal);
    const targetHead = await this.requiredRefHead(`refs/heads/${targetBranch}`, signal);
    if (sourceHead !== safeSha(expectedSourceHead, "expectedSourceHead")) {
      throw new GitInputError("Source branch moved from its expected head");
    }
    if (targetHead !== safeSha(expectedTargetHead, "expectedTargetHead")) {
      throw new GitInputError("Target branch moved from its expected head");
    }
    if (await this.isAncestor(sourceHead, targetHead, signal)) {
      return this.mergeFact(
        sourceBranch,
        targetBranch,
        sourceHead,
        targetHead,
        targetHead,
        "already_integrated",
        []
      );
    }
    if (await this.isAncestor(targetHead, sourceHead, signal)) {
      return this.mergeFact(
        sourceBranch,
        targetBranch,
        sourceHead,
        targetHead,
        targetHead,
        "mergeable",
        []
      );
    }
    const conflicts = await this.previewMergeConflicts(targetHead, sourceHead, signal);
    if (conflicts.length) {
      return this.mergeFact(
        sourceBranch,
        targetBranch,
        sourceHead,
        targetHead,
        targetHead,
        "conflicted",
        conflicts
      );
    }
    return this.mergeFact(
      sourceBranch,
      targetBranch,
      sourceHead,
      targetHead,
      targetHead,
      "mergeable",
      []
    );
  }

  /** A detached, throwaway checkout performs the same merge as the provider
   * without advancing either owned ref. Git 2.34 lacks merge-tree --write-tree. */
  private async previewMergeConflicts(
    targetHead: string,
    sourceHead: string,
    signal?: AbortSignal
  ): Promise<string[]> {
    await this.ensureWorktreeConfiguration(signal);
    const previewRoot = path.join(this.projectRoot, "merge-previews");
    await fs.mkdir(previewRoot, { recursive: true, mode: 0o700 });
    await this.assertDirectoryNotSymlink(previewRoot, "merge preview root");
    const temporary = await fs.mkdtemp(path.join(previewRoot, "preview-"));
    const checkout = path.join(temporary, "checkout");
    let attached = false;
    try {
      await this.command(this.repositoryPath, ["worktree", "add", "--detach", checkout, targetHead], signal);
      attached = true;
      await this.command(checkout, ["config", "--worktree", "core.bare", "false"], signal);
      const merge = await this.command(checkout, ["merge", "--no-commit", "--no-ff", sourceHead], signal, [0, 1], undefined, SERVICE_IDENTITY);
      if (merge.code === 1) {
        const conflicts = await this.unmergedPaths(checkout, signal);
        if (!conflicts.length) throw new CollaborationGitError("GIT_COMMAND_FAILED", "Merge preview failed without unmerged paths", true);
        return conflicts;
      }
      safeSha((await this.command(checkout, ["write-tree"], signal)).stdout.trim(), "merge tree");
      return [];
    } finally {
      if (attached) await this.command(this.repositoryPath, ["worktree", "remove", "--force", checkout], undefined, [0], undefined, undefined, true);
      await fs.rm(temporary, { recursive: true, force: true });
    }
  }

  private mergeFact(
    sourceBranch: string,
    targetBranch: string,
    sourceHead: string,
    targetHeadBefore: string,
    targetHeadAfter: string,
    status: LocalMergeFact["status"],
    conflicts: string[]
  ): LocalMergeFact {
    return {
      projectId: this.projectId,
      sourceBranch,
      targetBranch,
      sourceHead,
      targetHeadBefore,
      targetHeadAfter,
      status,
      conflictPaths: conflicts,
      observedAt: this.now()
    };
  }

  private async unmergedPaths(worktree: string, signal?: AbortSignal): Promise<string[]> {
    const result = await this.command(worktree, ["ls-files", "-u"], signal);
    return [...new Set(
      result.stdout.split(/\r?\n/)
        .map((line) => line.split("\t")[1])
        .filter((item): item is string => Boolean(item))
    )].sort();
  }

  private async isAncestor(
    ancestor: string,
    descendant: string,
    signal?: AbortSignal
  ): Promise<boolean> {
    const result = await this.command(
      this.repositoryPath,
      ["merge-base", "--is-ancestor", ancestor, descendant],
      signal,
      [0, 1]
    );
    return result.code === 0;
  }

  private async pushFixedBranch(branch: string, signal?: AbortSignal, beforeSpawn?: () => Promise<void>): Promise<string> {
    await this.assertBareRepository();
    const head = await this.requiredRefHead(`refs/heads/${branch}`, signal);
    await this.command(
      this.repositoryPath,
      ["push", "--porcelain", "origin", `refs/heads/${branch}:refs/heads/${branch}`],
      signal, [0], undefined, undefined, false, async () => {
        await beforeSpawn?.();
        if (await this.requiredRefHead(`refs/heads/${branch}`, signal) !== head)
          throw new GitInputError("Push branch moved during credential resolution");
      }
    );
    return head;
  }

  private validateRemoteUrl(remoteUrl: string): string {
    if (
      remoteUrl.includes("\0") ||
      remoteUrl.includes("\n") ||
      remoteUrl.includes("\r") ||
      remoteUrl.length > 4_096
    ) {
      throw new GitInputError("Remote URL is unsafe");
    }
    if (path.isAbsolute(remoteUrl)) {
      if (!this.allowLocalRemotes) {
        throw new GitInputError("Local Git remotes are disabled");
      }
      return path.resolve(remoteUrl);
    }
    let parsed: URL;
    try {
      parsed = new URL(remoteUrl);
    } catch (error) {
      throw new GitInputError("Remote URL is invalid", { cause: String(error) });
    }
    if (
      parsed.protocol !== "https:" ||
      parsed.username ||
      parsed.password ||
      !this.allowedRemoteHosts.has(parsed.hostname.toLowerCase())
    ) {
      throw new GitInputError("Remote URL must be credential-free HTTPS on an allowed host");
    }
    return parsed.toString();
  }

  private async ensureProjectRoot(): Promise<void> {
    await fs.mkdir(this.projectRoot, { recursive: true, mode: 0o700 });
    await this.assertDirectoryNotSymlink(this.projectRoot, "project root");
    const real = await fs.realpath(this.projectRoot);
    if (real !== this.projectRoot) {
      throw new GitPathViolationError("Project root must be canonical");
    }
  }

  private async assertBareRepository(): Promise<void> {
    await this.ensureProjectRoot();
    await this.assertDirectoryNotSymlink(this.repositoryPath, "repository");
    const observed = (await this.command(
      this.repositoryPath,
      ["rev-parse", "--is-bare-repository"]
    )).stdout.trim();
    if (observed !== "true") {
      throw new GitPathViolationError("Project repository must be bare");
    }
  }

  private async ensureOpenFarsLocalExcludes(): Promise<void> {
    await this.relocateLegacyServiceInputs();
    const infoDirectory = path.join(this.repositoryPath, "info");
    await this.assertDirectoryNotSymlink(infoDirectory, "repository info directory");
    const excludePath = path.join(infoDirectory, "exclude");
    let existing = "";
    try {
      const info = await fs.lstat(excludePath);
      if (!info.isFile() || info.isSymbolicLink()) {
        throw new GitPathViolationError("Repository local exclude must be a regular file");
      }
      existing = await fs.readFile(excludePath, "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    const retainedLines = existing.split(/\r?\n/).filter((line) =>
      !(LEGACY_OPENFARS_LOCAL_EXCLUDES as readonly string[]).includes(line.trim()));
    const normalizedExisting = retainedLines.join("\n");
    if (normalizedExisting === existing) return;
    await fs.writeFile(excludePath, normalizedExisting, { encoding: "utf8", mode: 0o600 });
  }

  /** Upgrade service-owned snapshots before removing old Git exclusions.
   * Project files, including user-created hidden files, stay in the worktree. */
  private async relocateLegacyServiceInputs(): Promise<void> {
    if (!(await this.pathExists(this.worktreeRoot))) return;
    const candidates: string[] = [];
    for (const entry of await fs.readdir(this.worktreeRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const root = path.join(this.worktreeRoot, entry.name);
      if (await this.pathExists(path.join(root, ".git"))) candidates.push(root);
      else for (const child of await fs.readdir(root, { withFileTypes: true })) {
        if (child.isDirectory() && await this.pathExists(path.join(root, child.name, ".git"))) candidates.push(path.join(root, child.name));
      }
    }
    for (const worktree of candidates) {
      await this.assertDirectoryNotSymlink(worktree, "legacy input worktree");
      const agent = path.basename(worktree);
      const move = async (source: string, target: string) => {
        if (!(await this.pathExists(source)) || await this.pathExists(target)) return;
        // Never relocate a file that was deliberately committed by an Agent.
        const tracked = await this.command(worktree, ["ls-files", "--", path.relative(worktree, source)]);
        if (tracked.stdout.trim()) return;
        await fs.mkdir(path.dirname(target), { recursive: true, mode: 0o700 });
        if (await fs.realpath(path.dirname(target)) !== path.dirname(target)) throw new GitPathViolationError("Service input archive is not canonical");
        await fs.rename(source, target);
      };
      const management = path.join(worktree, ".scienceevolve", "management");
      if (await this.pathExists(management)) {
        await this.assertDirectoryNotSymlink(management, "legacy management inputs");
        for (const entry of await fs.readdir(management, { withFileTypes: true })) {
          if (entry.isDirectory()) await move(path.join(management, entry.name), path.join(this.projectRoot, "agent-inputs", agent, "management", entry.name));
        }
      }
      if (await this.pathExists(path.join(worktree, ".agents", ".scienceevolve-managed-skills.json"))) {
        await move(path.join(worktree, ".agents"), path.join(this.projectRoot, "agent-inputs", agent, "legacy-skills"));
      }
      await move(path.join(worktree, ".scienceevolve", "skills"), path.join(this.projectRoot, "agent-inputs", agent, "legacy-skill-cache"));
      await move(path.join(worktree, ".scienceevolve", "workflow-current.json"), path.join(this.projectRoot, "agent-inputs", agent, "legacy-workflow-current.json"));
      await move(path.join(worktree, ".scienceevolve", "nature-figure.json"), path.join(this.projectRoot, "runtime", "legacy-agent-files", agent, "nature-figure.json"));
      const workflow = path.join(worktree, "workflow");
      const info = await fs.lstat(workflow).catch(() => undefined);
      if (info?.isSymbolicLink() && await fs.realpath(workflow).catch(() => "") === path.join(this.projectRoot, "workflow"))
        await move(workflow, path.join(this.projectRoot, "agent-inputs", agent, "legacy-workflow-link"));
    }
  }

  private async ensureExecutionBaseRef(
    executionId: ExecutionId,
    head: string,
    signal?: AbortSignal
  ): Promise<void> {
    const ref = this.executionBaseRef(executionId);
    const existing = await this.refHead(ref, signal);
    if (existing) return;
    try {
      await this.command(
        this.repositoryPath,
        ["update-ref", ref, safeSha(head, "execution base"), "0000000000000000000000000000000000000000"],
        signal
      );
    } catch (error) {
      const raced = await this.refHead(ref, signal);
      if (!raced) throw error;
    }
  }

  /** Repository preparation is infrastructure only. Agents keep their refs,
   * commits, staging and unfinished work, and choose all business/Git actions.
   * Migrate the bare root setting before enabling per-worktree config so old
   * linked checkouts do not inherit core.bare=true from the common config. */
  private ensureWorktreeConfiguration(signal?: AbortSignal): Promise<void> {
    const prepared = this.worktreeConfigurationTail.catch(() => undefined).then(async () => {
      signal?.throwIfAborted();
      await this.assertBareRepository();
      const current = await this.command(this.repositoryPath,
        ["config", "--local", "--bool", "--get", "extensions.worktreeConfig"], signal, [0, 1]);
      if (current.code === 0 && current.stdout.trim() === "true") return;
      for (const name of ["config", "config.worktree"]) {
        const file = path.join(this.repositoryPath, name);
        const info = await fs.lstat(file).catch((error: NodeJS.ErrnoException) => {
          if (error.code === "ENOENT" && name === "config.worktree") return undefined;
          throw error;
        });
        if (info && (!info.isFile() || info.isSymbolicLink() || info.nlink !== 1 || await fs.realpath(file) !== file)) {
          throw new GitPathViolationError("Repository worktree configuration must be a pinned regular file");
        }
      }
      await this.command(this.repositoryPath, ["config", "--file", "config.worktree", "core.bare", "true"], signal);
      await this.command(this.repositoryPath, ["config", "--local", "--unset", "core.bare"], signal, [0, 5]);
      await this.command(this.repositoryPath, ["config", "extensions.worktreeConfig", "true"], signal);
      await this.assertBareRepository();
    });
    // Serialize shared infrastructure config, not Agent business operations.
    // A failed/cancelled preparation does not poison the next authorized call.
    this.worktreeConfigurationTail = prepared.catch(() => undefined);
    return prepared;
  }

  private async configureExecutionIdentity(
    worktreePath: string,
    execution: GitExecutionAuthority,
    signal?: AbortSignal
  ): Promise<void> {
    const agentId = safeAgentId(execution.agentId);
    const settings = [
      ["core.bare", "false"],
      ["user.name", `OpenFARS Agent ${agentId}`],
      ["user.email", `openfars-agent+${sha256(agentId).slice(0, 16)}@localhost`],
      ["user.useConfigOnly", "true"],
      ["commit.gpgSign", "false"],
      ["core.hooksPath", "/dev/null"]
    ] as const;
    for (const [key, value] of settings) {
      await this.command(worktreePath, ["config", "--worktree", key, value], signal);
    }
  }

  private async assertDirectoryNotSymlink(candidate: string, label: string): Promise<void> {
    let stat;
    try {
      stat = await fs.lstat(candidate);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw new GitPathViolationError(`${label} does not exist`);
      }
      throw error;
    }
    if (!stat.isDirectory() || stat.isSymbolicLink()) {
      throw new GitPathViolationError(`${label} must be a real directory`);
    }
  }

  private async pathExists(candidate: string): Promise<boolean> {
    try {
      await fs.lstat(candidate);
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
      throw error;
    }
  }

  private async assertCommitExists(commit: string, signal?: AbortSignal): Promise<void> {
    const result = await this.command(
      this.repositoryPath,
      ["cat-file", "-e", `${commit}^{commit}`],
      signal,
      [0, 1, 128]
    );
    if (result.code !== 0) throw new GitInputError("Commit does not exist in the project repository");
  }

  private async assertRefOrCommitExists(value: string, signal?: AbortSignal): Promise<void> {
    if (SAFE_SHA.test(value)) {
      await this.assertCommitExists(value, signal);
      return;
    }
    await this.requiredRefHead(`refs/heads/${value}`, signal);
  }

  private async refHead(ref: string, signal?: AbortSignal): Promise<string | undefined> {
    const result = await this.command(
      this.repositoryPath,
      ["rev-parse", "--verify", "--quiet", `${ref}^{commit}`],
      signal,
      [0, 1]
    );
    if (result.code !== 0) return undefined;
    return safeSha(result.stdout.trim(), "ref head");
  }

  private async requiredRefHead(ref: string, signal?: AbortSignal): Promise<string> {
    const head = await this.refHead(ref, signal);
    if (!head) throw new GitInputError(`Required Git ref is missing: ${ref}`);
    return head;
  }

  private async worktreeHead(worktree: string, signal?: AbortSignal): Promise<string> {
    return safeSha(
      (await this.command(worktree, ["rev-parse", "HEAD^{commit}"], signal)).stdout.trim(),
      "worktree head"
    );
  }

  private async commitMessage(commit: string, signal?: AbortSignal): Promise<string> {
    return (await this.command(
      this.repositoryPath,
      ["show", "-s", "--format=%B", commit],
      signal
    )).stdout;
  }

  private async findCommitByMarker(
    branch: string,
    operationId: OperationId,
    signal?: AbortSignal
  ): Promise<string | undefined> {
    safeId(operationId, "operationId");
    const head = await this.refHead(`refs/heads/${branch}`, signal);
    if (!head) return undefined;
    const log = await this.command(
      this.repositoryPath,
      ["log", "-50", "--format=%H%x09%B%x00", head],
      signal
    );
    const marker = `OpenFARS-Operation: ${operationId}`;
    for (const entry of log.stdout.split("\0")) {
      const separator = entry.indexOf("\t");
      if (separator < 0 || !entry.includes(marker)) continue;
      const candidate = entry.slice(0, separator).trim();
      if (SAFE_SHA.test(candidate)) return candidate;
    }
    return undefined;
  }

  private async commitParent(
    commit: string,
    signal?: AbortSignal
  ): Promise<string | undefined> {
    const result = await this.command(
      this.repositoryPath,
      ["rev-parse", "--verify", "--quiet", `${safeSha(commit, "commit")}^`],
      signal,
      [0, 1, 128]
    );
    return result.code === 0
      ? safeSha(result.stdout.trim(), "commit parent")
      : undefined;
  }

  private async hashBlob(content: string, signal?: AbortSignal): Promise<string> {
    return safeSha(
      (await this.command(
        this.repositoryPath,
        ["hash-object", "-w", "--stdin"],
        signal,
        [0],
        content
      )).stdout.trim(),
      "blob"
    );
  }

  private async mktree(lines: string[], signal?: AbortSignal): Promise<string> {
    return safeSha(
      (await this.command(
        this.repositoryPath,
        ["mktree"],
        signal,
        [0],
        `${lines.join("\n")}\n`
      )).stdout.trim(),
      "tree"
    );
  }

  private async commitTree(
    tree: string,
    parents: string[],
    message: string,
    signal?: AbortSignal,
    identity: Readonly<Record<string, string>> = SERVICE_IDENTITY
  ): Promise<string> {
    const args = ["commit-tree", tree];
    for (const parent of parents) args.push("-p", safeSha(parent, "parent"));
    args.push("-F", "-");
    return safeSha(
      (await this.command(
        this.repositoryPath,
        args,
        signal,
        [0],
        `${message}\n`,
        identity
      )).stdout.trim(),
      "commit"
    );
  }

  private repositoryFact(head: string): LocalRepositoryFact {
    return {
      projectId: this.projectId,
      repositoryPath: this.repositoryPath,
      branch: MAIN_BRANCH,
      head,
      observedAt: this.now()
    };
  }

  private managementCommitFromOperation(
    operation: OperationRecord
  ): string | undefined {
    if (operation.status !== "finalized") return undefined;
    const fact = factRecord(operation.remoteFact);
    if (
      fact?.branch !== MANAGEMENT_BRANCH ||
      typeof fact.commitSha !== "string" ||
      typeof fact.observedAt !== "string"
    ) {
      throw new OperationStoreViolationError("Finalized management-memory fact is malformed");
    }
    return safeSha(fact.commitSha, "management commit");
  }

  private managementOperationFact(
    snapshot: ManagementMemorySnapshot
  ): Record<string, unknown> {
    return {
      branch: MANAGEMENT_BRANCH,
      commitSha: snapshot.commitSha,
      entryAgentIds: snapshot.entries.map((entry) => entry.agentId).sort(),
      observedAt: snapshot.observedAt
    };
  }

  private command(
    cwd: string,
    args: readonly string[],
    signal?: AbortSignal,
    acceptedExitCodes: readonly number[] = [0],
    stdin?: string,
    environment?: Readonly<Record<string, string>>,
    previewCleanup = false,
    beforeSpawn?: () => Promise<void>
  ): Promise<GitCommandResult> {
    return this.runner.run({
      cwd,
      args,
      ...(signal ? { signal } : {}),
      ...(stdin !== undefined ? { stdin } : {}),
      ...(environment ? { environment } : {}),
      ...(previewCleanup ? { previewCleanup: true } : {}),
      ...(beforeSpawn ? { beforeSpawn } : {}),
      acceptedExitCodes
    });
  }
}
