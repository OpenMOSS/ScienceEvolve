import { createHash, randomUUID } from "node:crypto";
import { constants as fsConstants, promises as fs } from "node:fs";
import path from "node:path";
import type { AgentRunRequest } from "../types.js";
import { authoritativeWorkflowPaths } from "../orchestration-control-bridge.js";
import type { InvocationInputs } from "./contracts.js";
import { HarnessRuntimeError } from "./errors.js";
import { managementInputRoot } from "../management-input-paths.js";
import { MAIN_AGENT_ORCHESTRATION_CURRENT_FILE } from "../main-workflow-files.js";

export function isMainAssistanceTurn(request: Pick<AgentRunRequest, "agent" | "kind" | "executionContext"> & { project: { id: string } }): boolean {
  return request.agent === "main" && request.kind === "main" &&
    request.executionContext?.role === "leader" && request.executionContext.routeScopeId === `main-assistance-${request.project.id}`;
}

const SAFE_INVOCATION_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,159}$/;

/**
 * Validate server-owned paths and create the invocation-local readable Inbox.
 * Only the returned paths are passed to an Adapter; the authority path is not.
 */
export async function prepareInvocationInputs(
  request: Pick<AgentRunRequest,
    "project" | "agent" | "invocationId" | "projectPath" | "workspacePath" | "inboxPath" |
    "runtimePath" | "executionContext" | "terminalPushObservation" | "worktreeClosing" | "control">,
  /** Trusted SDK host binding; never supplied by workflow or Agent input. */
  resolveProjectWorkspace?: (projectId: string) => Promise<string | undefined>
): Promise<InvocationInputs> {
  try {
    if (!SAFE_INVOCATION_ID.test(request.invocationId)) {
      throw new Error("Invalid invocation id");
    }
    if (!path.isAbsolute(request.projectPath) ||
      path.basename(path.resolve(request.projectPath)) !== request.project.id) {
      throw new Error("Agent project path does not match the project id");
    }

    const [projectRoot, workspaceRoot, authorityInbox, runtimeRoot] = await Promise.all([
      fs.realpath(request.projectPath),
      fs.realpath(request.workspacePath),
      fs.realpath(request.inboxPath),
      fs.realpath(request.runtimePath)
    ]);
    const messagesRoot = await fs.realpath(path.join(projectRoot, "messages"));
    if (request.executionContext?.role === "leader") {
      throw new Error("Leader collaboration turns require a management-only staged workspace");
    }
    const collaborationWorktree = request.executionContext?.executionWorktree;
    if (collaborationWorktree && !path.isAbsolute(collaborationWorktree)) {
      throw new Error("Collaboration execution worktree must be absolute");
    }
    const selectedWorkspace = request.project.git?.enabled === true
      ? undefined : await resolveProjectWorkspace?.(request.project.id);
    const expectedWorkspace = await fs.realpath(
      (request.project.git?.enabled ? collaborationWorktree : selectedWorkspace) ?? path.join(projectRoot, "workspaces")
    );
    const legacyRoleWorkspace = request.project.git?.enabled !== true && request.project.orchestration?.schemaVersion !== 3
      ? path.join(projectRoot, "workspaces", request.agent, "shared")
      : undefined;
    if (workspaceRoot !== expectedWorkspace && workspaceRoot !== legacyRoleWorkspace) {
      throw new Error("Agent workspace does not match the selected project workspace");
    }
    if (!isWithin(authorityInbox, messagesRoot)) {
      throw new Error("Authority Inbox resolves outside the project messages directory");
    }
    const expectedRuntime = await fs.realpath(
      path.join(projectRoot, "runtime", request.invocationId)
    );
    if (runtimeRoot !== expectedRuntime) {
      throw new Error("Invocation runtime does not match the current invocation");
    }
    const authorityName = path.basename(authorityInbox);
    const expectedAuthoritySuffix = `_${request.invocationId}_to_${request.agent}.md`;
    if (!authorityName.endsWith(expectedAuthoritySuffix) ||
      !/^\d{4,}_/.test(authorityName)) {
      throw new Error("Authority Inbox does not match the current invocation and Agent");
    }

    await assertRegularNonSymlinkFile(request.inboxPath, "Authority Inbox");

    const gitBusinessMemory = Boolean(
      collaborationWorktree && request.project.git?.enabled === true
    );
    const memoryCandidate = gitBusinessMemory
      ? path.join(workspaceRoot, "agent-memory", request.agent, "Memory.md")
      : path.join(workspaceRoot, "Memory.md");
    if (gitBusinessMemory && !request.terminalPushObservation && !request.worktreeClosing) {
      const durableMemory = await durableRoleMemorySeed(projectRoot, request.agent);
      await seedExecutionMemory(workspaceRoot, request.agent, durableMemory);
      await mirrorProjectWorkspaceFiles(projectRoot, workspaceRoot);
    }
    const memoryPath = await fs.realpath(memoryCandidate);
    if (!isWithin(memoryPath, workspaceRoot)) {
      throw new Error("Project Memory resolves outside the workspace");
    }
    await assertRegularNonSymlinkFile(memoryCandidate, "Project Memory");

    const inboxBytes = await fs.readFile(authorityInbox);
    // Git-on delivery worktrees are business content. Stage the server-owned
    // Inbox under the invocation runtime so Harness Git staging cannot select it.
    const mirrorRoot = gitBusinessMemory ? runtimeRoot : workspaceRoot;
    const mirrorDirectory = gitBusinessMemory
      ? path.join(runtimeRoot, "staged-inputs", "inbox")
      : path.join(workspaceRoot, ".scienceevolve", "inbox");
    await ensurePrivateDirectory(mirrorDirectory, mirrorRoot);
    const mirrorPath = path.join(mirrorDirectory, `${request.invocationId}.md`);
    const temporaryPath = path.join(
      mirrorDirectory,
      `.${request.invocationId}.${process.pid}.${randomUUID()}.tmp`
    );
    try {
      await fs.writeFile(temporaryPath, inboxBytes, { flag: "wx", mode: 0o600 });
      await replaceInboxMirror(temporaryPath, mirrorPath, mirrorDirectory);
      // Read-only semantics discourage accidental mutation. It is not a
      // security boundary because a same-UID process can replace the file.
      await fs.chmod(mirrorPath, 0o400);
    } catch (error) {
      await fs.rm(temporaryPath, { force: true }).catch(() => undefined);
      throw error;
    }
    const realMirror = await fs.realpath(mirrorPath);
    if (!isWithin(realMirror, mirrorRoot)) {
      throw new Error("Staged Inbox resolves outside its server-owned input root");
    }
    const mirroredBytes = await fs.readFile(realMirror);
    if (!mirroredBytes.equals(inboxBytes)) {
      throw new Error("Staged Inbox does not match the server authority copy");
    }

    let workflowAuthoringPath: string | undefined;
    if (selectedWorkspace && request.control?.workflowAuthoringPath) {
      const expected = path.join(workspaceRoot, ".scienceevolve", "management", request.project.id, "proposal", "workflow.json");
      const candidate = request.control.workflowAuthoringPath;
      await assertRegularNonSymlinkFile(candidate, "Workflow proposal");
      if (path.resolve(candidate) !== expected || await fs.realpath(candidate) !== expected) {
        throw new Error("External workflow proposal escaped its bound project directory");
      }
      workflowAuthoringPath = expected;
    }
    return {
      projectPath: projectRoot,
      ...await publishedWorkflowInput(projectRoot),
      workspacePath: workspaceRoot,
      ...(workflowAuthoringPath ? { workflowAuthoringPath } : {}),
      userInputsPath: await prepareProjectUserInputsPath(projectRoot, selectedWorkspace),
      inboxPath: realMirror,
      memoryPath,
      runtimePath: runtimeRoot,
      inboxSha256: createHash("sha256").update(inboxBytes).digest("hex")
    };
  } catch (error) {
    if (error instanceof HarnessRuntimeError) throw error;
    throw new HarnessRuntimeError(
      "INVOCATION_INPUT_STAGING_FAILED",
      "Unable to validate or stage invocation inputs",
      { invocationId: request.invocationId },
      { cause: error }
    );
  }
}

/** Resolve the shared input folder without granting access to other project state. */
export async function prepareProjectUserInputsPath(projectRoot: string, selectedWorkspace?: string): Promise<string | undefined> {
  // Only a trusted host may select an external shared workspace; a business
  // Git worktree is never the source of project-wide original inputs.
  const workspace = selectedWorkspace ?? path.join(projectRoot, "workspaces");
  const directory = path.join(workspace, "user_inputs");
  const entry = await fs.lstat(directory).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return undefined;
    throw error;
  });
  if (!entry) return undefined;
  const workspaceEntry = await fs.lstat(workspace);
  const [realWorkspace, realInputs] = await Promise.all([fs.realpath(workspace), fs.realpath(directory)]);
  if (!workspaceEntry.isDirectory() || workspaceEntry.isSymbolicLink() ||
    !entry.isDirectory() || entry.isSymbolicLink() ||
    (selectedWorkspace === undefined ? !isWithin(realWorkspace, projectRoot) : selectedWorkspace !== realWorkspace) || !isWithin(realInputs, realWorkspace)) {
    throw new HarnessRuntimeError("INVOCATION_INPUT_STAGING_FAILED",
      "Project user_inputs must be a regular directory inside the shared workspace", {}, { source: "inputs" });
  }
  return realInputs;
}

/**
 * Trusted first-use staging for execution-local recovery memory. Existing
 * content is never overwritten; an absent file is created exclusively only
 * after each real parent directory has been pinned inside the worktree.
 */
export async function seedExecutionMemory(
  executionWorktree: string,
  agent: string,
  initialContent = ""
): Promise<string> {
  if (!agent || agent === "." || agent === ".." || path.basename(agent) !== agent ||
    agent.includes("\\") || agent.includes("\0")) {
    throw new Error("Agent name is not a safe memory path segment");
  }
  const workspaceRoot = await fs.realpath(executionWorktree);
  const memoryRoot = path.join(workspaceRoot, "agent-memory");
  const agentRoot = path.join(memoryRoot, agent);
  await ensurePinnedDirectory(memoryRoot, workspaceRoot);
  await ensurePinnedDirectory(agentRoot, workspaceRoot);
  const memoryPath = path.join(agentRoot, "Memory.md");
  let handle: Awaited<ReturnType<typeof fs.open>> | undefined;
  try {
    const noFollow = typeof fsConstants.O_NOFOLLOW === "number" ? fsConstants.O_NOFOLLOW : 0;
    handle = await fs.open(
      memoryPath,
      fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL | noFollow,
      0o600
    );
    if (initialContent) await handle.writeFile(initialContent, "utf8");
    await handle.sync();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
  } finally {
    await handle?.close();
  }
  await assertRegularNonSymlinkFile(memoryPath, "Agent Memory");
  const realMemory = await fs.realpath(memoryPath);
  if (!isWithin(realMemory, workspaceRoot)) {
    throw new Error("Agent Memory resolves outside the execution worktree");
  }
  await syncDirectory(agentRoot);
  return realMemory;
}

async function durableRoleMemorySeed(projectRoot: string, agent: string): Promise<string> {
  if (!agent || agent === "." || agent === ".." || path.basename(agent) !== agent ||
    agent.includes("\\") || agent.includes("\0")) {
    throw new Error("Agent name is not a safe memory path segment");
  }
  const current = path.join(projectRoot, "runtime", "memory-snapshots", "agent-memory", agent, "Memory.md");
  const candidate = await fs.lstat(current).then(() => current).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") throw error;
    return path.join(projectRoot, "workspaces", "agent-memory", agent, "Memory.md");
  });
  try {
    const [real, info] = await Promise.all([fs.realpath(candidate), fs.lstat(candidate)]);
    if (!info.isFile() || info.isSymbolicLink() || !isWithin(real, projectRoot)) {
      throw new Error("Durable Agent memory is not a trusted project file");
    }
    return await fs.readFile(real, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return "";
    throw error;
  }
}

/** Bring every regular shared project file into the versioned workspace.
 * Existing Agent files are retained; new uploads/hidden/binary inputs are
 * copied verbatim rather than left permanently outside Git delivery. */
export async function mirrorProjectWorkspaceFiles(projectRoot: string, worktree: string): Promise<void> {
  const source = path.join(projectRoot, "workspaces");
  const info = await fs.lstat(source).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") throw error;
    return undefined;
  });
  if (!info) return;
  if (!info.isDirectory() || info.isSymbolicLink() || await fs.realpath(source) !== source)
    throw new Error("Shared project workspace is not canonical");
  const root = await fs.realpath(worktree);
  // The caller has already bound this exact execution directory. Retained
  // installations may keep their registered worktree outside projectPath.
  if (root === source) return;
  const visit = async (from: string, to: string): Promise<void> => {
    for (const entry of await fs.readdir(from, { withFileTypes: true })) {
      if (entry.name.toLowerCase() === ".git") continue;
      const input = path.join(from, entry.name), target = path.join(to, entry.name);
      const existing = await fs.lstat(target).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== "ENOENT") throw error;
        return undefined;
      });
      if (entry.isDirectory()) {
        if (existing && (!existing.isDirectory() || existing.isSymbolicLink())) continue;
        if (!existing) await fs.mkdir(target, { mode: 0o700 });
        if (await fs.realpath(target) !== target) throw new Error("Git input directory is not canonical");
        await visit(input, target);
      } else if (entry.isFile() && !existing) {
        await fs.copyFile(input, target, fsConstants.COPYFILE_EXCL).catch((error: NodeJS.ErrnoException) => {
          if (error.code !== "EEXIST") throw error;
        });
      }
    }
  };
  await visit(source, root);
}

/**
 * Node's rename replaces a file on POSIX, but Windows rejects replacement of
 * an existing (especially read-only) destination with EPERM. Recovery stages
 * the same logical invocation again, so safely retire that disposable mirror
 * before installing the fully-written temporary copy. The authority Inbox in
 * the project's messages directory is never modified.
 */
async function replaceInboxMirror(
  temporaryPath: string,
  mirrorPath: string,
  mirrorDirectory: string
): Promise<void> {
  let existing: Awaited<ReturnType<typeof fs.lstat>> | undefined;
  try {
    existing = await fs.lstat(mirrorPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  if (existing) {
    if (existing.isSymbolicLink() || !existing.isFile()) {
      throw new Error("Staged Inbox destination must be a regular non-symlink file");
    }
    const [directoryRoot, existingPath] = await Promise.all([
      fs.realpath(mirrorDirectory),
      fs.realpath(mirrorPath)
    ]);
    if (!isWithin(existingPath, directoryRoot)) {
      throw new Error("Existing staged Inbox resolves outside its private directory");
    }
    await fs.chmod(mirrorPath, 0o600);
    await fs.rm(mirrorPath);
  }
  await fs.rename(temporaryPath, mirrorPath);
}

/**
 * Validate an already-staged, read-only purpose workspace. Unlike workflow
 * input preparation this does not create a second Inbox mirror: the caller's
 * snapshot is itself the invocation-local copy and has no authority over the
 * project's messages directory.
 */
export async function validateStagedInvocationInputs(input: {
  projectId: string;
  invocationId: string;
  projectPath: string;
  workspacePath: string;
  inboxPath: string;
  memoryPath: string;
  runtimePath: string;
  fixedAgentId?: string;
  projectWorkspace?: string;
  mainAssistance?: boolean;
  workflowAuthoringPath?: string;
  workflowCurrentPath?: string;
  workflowAuthoringInvocationId?: string;
}): Promise<InvocationInputs> {
  try {
    if (!SAFE_INVOCATION_ID.test(input.invocationId)) {
      throw new Error("Invalid invocation id");
    }
    if (input.workflowAuthoringInvocationId !== undefined &&
      (!input.workflowAuthoringPath || !SAFE_INVOCATION_ID.test(input.workflowAuthoringInvocationId))) {
      throw new Error("Invalid workflow proposal snapshot identity");
    }
    if (!path.isAbsolute(input.projectPath) ||
      path.basename(path.resolve(input.projectPath)) !== input.projectId) {
      throw new Error("Purpose project path does not match the project id");
    }
    const [projectRoot, workspaceRoot, inboxPath, memoryPath, runtimeRoot] =
      await Promise.all([
        fs.realpath(input.projectPath),
        fs.realpath(input.workspacePath),
        fs.realpath(input.inboxPath),
        fs.realpath(input.memoryPath),
        fs.realpath(input.runtimePath)
      ]);
    if (!isWithin(runtimeRoot, projectRoot)) {
      throw new Error("Purpose runtime resolves outside the project root");
    }
    if (input.fixedAgentId) {
      if (path.basename(input.fixedAgentId) !== input.fixedAgentId || input.fixedAgentId.includes("\\") ||
        workspaceRoot !== (input.projectWorkspace ?? path.join(projectRoot, "git-worktrees", "agents", input.fixedAgentId)) ||
        path.resolve(input.workspacePath) !== workspaceRoot || !isWithin(runtimeRoot, path.join(projectRoot, "runtime"))) {
        throw new Error("Management workspace must be the current Agent's fixed project directory");
      }
    } else if (input.mainAssistance) {
      const expected = path.join(projectRoot, "runtime", "main-assistance", "main-assistance-workspace");
      if (workspaceRoot !== expected || path.resolve(input.workspacePath) !== expected ||
        runtimeRoot !== path.join(projectRoot, "runtime", input.invocationId) ||
        !isWithin(inboxPath, path.join(expected, ".scienceevolve", "management", input.invocationId)) ||
        !isWithin(memoryPath, path.join(expected, ".scienceevolve", "management", input.invocationId))) {
        throw new Error("Main assistance inputs lost their exact retained workspace and invocation snapshot");
      }
    } else if (!isWithin(workspaceRoot, runtimeRoot)) {
      throw new Error("Purpose workspace resolves outside its invocation runtime");
    }
    if (!input.fixedAgentId && (!isWithin(inboxPath, workspaceRoot) || !isWithin(memoryPath, workspaceRoot))) {
      throw new Error("Purpose inputs resolve outside the staged workspace");
    }
    if (!path.basename(inboxPath).includes(input.invocationId)) {
      throw new Error("Purpose Inbox does not match the current invocation");
    }
    await Promise.all([
      assertRegularNonSymlinkFile(input.inboxPath, "Purpose Inbox"),
      assertRegularNonSymlinkFile(input.memoryPath, "Purpose Memory")
    ]);
    if (input.fixedAgentId) {
      const managementRoot = managementInputRoot(projectRoot, input.fixedAgentId, input.invocationId);
      const legacyRoot = path.join(workspaceRoot, ".scienceevolve", "management", input.invocationId);
      if (![managementRoot, legacyRoot].some(root => isWithin(inboxPath, root) && isWithin(memoryPath, root))) {
        throw new Error("Fixed management inputs must remain in this invocation's private snapshot");
      }
    }
    if (input.workflowAuthoringPath) {
      // Inbox/Memory belong to this physical invocation; the unfinished
      // proposal belongs to the logical task. Its exact prior snapshot is
      // bound by the coordinator, never selected by the Agent or searched
      // for business edits here.
      const original = input.workflowAuthoringInvocationId ?? input.invocationId;
      if (!input.fixedAgentId && !input.mainAssistance || input.mainAssistance && original !== input.invocationId)
        throw new Error("Workflow proposal requires its original authorized management invocation");
      const expected = path.join(managementInputRoot(projectRoot, input.fixedAgentId ?? "main", original), "proposal", "workflow.json");
      const legacy = path.join(workspaceRoot, ".scienceevolve", "management", original, "proposal", "workflow.json");
      await assertRegularNonSymlinkFile(input.workflowAuthoringPath, "Workflow proposal");
      const proposalPath = await fs.realpath(input.workflowAuthoringPath);
      if (!(proposalPath === expected || input.fixedAgentId && !input.mainAssistance && proposalPath === legacy) || proposalPath !== path.resolve(input.workflowAuthoringPath)) {
        throw new Error("Workflow authoring path escaped its bound logical-task proposal directory");
      }
      if (input.workflowCurrentPath) {
        await assertRegularNonSymlinkFile(input.workflowCurrentPath, "Current Workflow reference");
        const reference = path.join(path.dirname(path.dirname(proposalPath)), MAIN_AGENT_ORCHESTRATION_CURRENT_FILE);
        if (path.resolve(input.workflowCurrentPath) !== reference || await fs.realpath(input.workflowCurrentPath) !== reference) {
          throw new Error("Current Workflow reference escaped its bound logical-task snapshot");
        }
      }
    }

    const inboxBytes = await fs.readFile(inboxPath);
    return {
      projectPath: projectRoot,
      ...await publishedWorkflowInput(projectRoot),
      workspacePath: workspaceRoot,
      inboxPath,
      memoryPath,
      runtimePath: runtimeRoot,
      ...(input.workflowAuthoringPath ? { workflowAuthoringPath: input.workflowAuthoringPath,
        ...(input.workflowCurrentPath ? { workflowCurrentPath: input.workflowCurrentPath } : {}),
        workflowAuthoringInvocationId: input.workflowAuthoringInvocationId ?? input.invocationId } : {}),
      inboxSha256: createHash("sha256").update(inboxBytes).digest("hex")
    };
  } catch (error) {
    if (error instanceof HarnessRuntimeError) throw error;
    throw new HarnessRuntimeError(
      "INVOCATION_INPUT_STAGING_FAILED",
      "Unable to validate staged purpose inputs",
      { invocationId: input.invocationId },
      { source: "inputs", cause: error instanceof Error ? error : undefined }
    );
  }
}

/** Derive this grant only from the validated project, never an Agent path or workspace alias. */
async function publishedWorkflowInput(projectRoot: string): Promise<Pick<InvocationInputs, "workflowReadDirectory">> {
  const paths = authoritativeWorkflowPaths(projectRoot);
  let info;
  try { info = await fs.lstat(paths.directory); }
  catch (error) {
    // Legacy/non-workflow invocations may have no server publication.
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw error;
  }
  if (!info.isDirectory() || info.isSymbolicLink() || await fs.realpath(paths.directory) !== paths.directory) {
    throw new Error("Authoritative workflow read directory must be canonical within the current project");
  }
  await Promise.all([
    assertRegularNonSymlinkFile(paths.definition, "Authoritative workflow definition"),
    assertRegularNonSymlinkFile(paths.currentState, "Authoritative workflow current state")
  ]);
  return { workflowReadDirectory: paths.directory };
}

async function ensurePrivateDirectory(directory: string, workspaceRoot: string): Promise<void> {
  const root = await fs.realpath(workspaceRoot);
  const selected = path.resolve(directory);
  if (!isWithin(selected, root)) {
    throw new Error("Invocation Inbox directory resolves outside the workspace");
  }
  // Pin each parent before creating its child. A recursive mkdir would follow
  // an existing .scienceevolve junction and write outside the selected workspace
  // before the final boundary check could reject it.
  let current = root;
  for (const segment of path.relative(root, selected).split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    await ensurePinnedDirectory(current, root);
  }
  await fs.chmod(directory, 0o700);
}

async function ensurePinnedDirectory(directory: string, workspaceRoot: string): Promise<void> {
  try {
    await fs.mkdir(directory, { mode: 0o700 });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
  }
  const info = await fs.lstat(directory);
  if (!info.isDirectory() || info.isSymbolicLink()) {
    throw new Error("Agent Memory parent must be a real directory");
  }
  const realDirectory = await fs.realpath(directory);
  if (realDirectory !== path.resolve(directory) || !isWithin(realDirectory, workspaceRoot)) {
    throw new Error("Agent Memory parent resolves outside the execution worktree");
  }
}

async function syncDirectory(directory: string): Promise<void> {
  if (process.platform === "win32") return;
  const handle = await fs.open(directory, fsConstants.O_RDONLY | fsConstants.O_DIRECTORY);
  try { await handle.sync(); } finally { await handle.close(); }
}

async function assertRegularNonSymlinkFile(file: string, label: string): Promise<void> {
  const info = await fs.lstat(file);
  if (info.isSymbolicLink() || !info.isFile() || info.nlink !== 1) {
    throw new Error(`${label} must be an unaliased regular non-symlink file`);
  }
}

export function isWithin(candidate: string, root: string): boolean {
  const relative = path.relative(root, candidate);
  return relative === "" || (
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}
