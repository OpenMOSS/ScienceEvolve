import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { AgentName } from "../types.js";

export interface StagedInvocationSkills {
  skillPaths: string[];
  autoSkillPaths: string[];
}

/**
 * Stage both fixed and automatic Skills through one common implementation.
 * Returned paths are always inside the project workspace. When an Agent is
 * supplied, its managed cache is isolated even though every Agent shares cwd.
 */
export async function stageInvocationSkills(
  skillPaths: readonly string[],
  autoSkillPaths: readonly string[],
  workspacePath: string,
  availableSkillPaths: readonly string[] = [...skillPaths, ...autoSkillPaths],
  agent?: AgentName
): Promise<StagedInvocationSkills> {
  if (
    agent !== undefined &&
    !/^[\p{L}\p{N}][\p{L}\p{N}_-]{0,63}$/u.test(agent)
  ) {
    throw new Error("Invalid Agent skill scope");
  }
  const fixedSources = [...new Set(skillPaths)];
  const fixedSet = new Set(fixedSources);
  const automaticSources = [...new Set(autoSkillPaths)]
    .filter((item) => !fixedSet.has(item));
  const selectedSources = [...fixedSources, ...automaticSources];
  for (const skillPath of selectedSources) {
    const directoryName = path.basename(path.dirname(skillPath));
    if (path.basename(skillPath) !== "SKILL.md" || !safeSkillDirectoryName(directoryName)) {
      throw new Error("Selected Skill must be a safe SKILL.md directory entry");
    }
  }
  for (const sourceDirectory of new Set(selectedSources.map((item) => path.dirname(item)))) {
    await assertSkillTreeHasNoSymbolicLinks(sourceDirectory);
  }
  let agentRoot: string;
  if (agent === undefined) {
    agentRoot = path.join(workspacePath, ".agents");
  } else {
    const internalRoot = path.join(workspacePath, ".scienceevolve");
    const cachesRoot = path.join(internalRoot, "agent-skills");
    await ensureWorkspaceDirectory(internalRoot, workspacePath);
    await ensureWorkspaceDirectory(cachesRoot, workspacePath);
    agentRoot = path.join(cachesRoot, agent);
  }
  const destinationRoot = path.join(agentRoot, "skills");
  const manifestPath = path.join(agentRoot, ".scienceevolve-managed-skills.json");
  await ensureWorkspaceDirectory(agentRoot, workspacePath);
  await ensureWorkspaceDirectory(destinationRoot, workspacePath);
  const selectedDirectoryNames = new Set(
    selectedSources.map((skillPath) => path.basename(path.dirname(skillPath)))
  );
  const managedDirectoryNames = new Set(await readManagedSkillDirectories(manifestPath));
  const catalogDirectoryNames = new Set(availableSkillPaths.map(skillPath => path.basename(path.dirname(skillPath))).filter(safeSkillDirectoryName));
  // Only inspect the workspace's existing entries. A new empty cache must not
  // resolve or attempt to delete every Skill installed in the global library.
  for (const { name: directoryName } of await fs.readdir(destinationRoot, { withFileTypes: true })) {
    if (selectedDirectoryNames.has(directoryName)) continue;
    if (!managedDirectoryNames.has(directoryName) && !catalogDirectoryNames.has(directoryName)) continue;
    await fs.rm(path.join(destinationRoot, directoryName), { recursive: true, force: true });
  }

  const stagedBySource = new Map<string, string>();
  const sourceByDirectory = new Map<string, string>();
  for (const selectedSkillPath of selectedSources) {
    const skillPath = await fs.realpath(selectedSkillPath);
    const sourceDirectory = path.dirname(skillPath);
    const directoryName = path.basename(sourceDirectory);
    const priorSource = sourceByDirectory.get(directoryName);
    if (priorSource && priorSource !== sourceDirectory) {
      throw new Error(`Selected skills have a directory-name collision: ${directoryName}`);
    }
    if (!priorSource) {
      sourceByDirectory.set(directoryName, sourceDirectory);
      const destination = path.join(destinationRoot, directoryName);
      const stagedDestination = path.join(
        destinationRoot,
        `.scienceevolve-stage-${directoryName}-${randomUUID()}`
      );
      try {
        await fs.cp(sourceDirectory, stagedDestination, {
          recursive: true,
          dereference: false,
          errorOnExist: true,
          force: false
        });
        // Re-check the isolated copy before exposing it at the stable path. If
        // the source changed during the copy, no symlink can enter a workspace.
        await assertSkillTreeHasNoSymbolicLinks(stagedDestination);
        await fs.rm(destination, { recursive: true, force: true });
        await fs.rename(stagedDestination, destination);
      } catch (error) {
        await fs.rm(stagedDestination, { recursive: true, force: true });
        throw error;
      }
    }
    stagedBySource.set(skillPath, path.join(destinationRoot, directoryName, "SKILL.md"));
  }
  await writeManagedSkillDirectories(manifestPath, [...selectedDirectoryNames]);
  return {
    skillPaths: fixedSources.map((item) => stagedBySource.get(item)!).filter(Boolean),
    autoSkillPaths: automaticSources.map((item) => stagedBySource.get(item)!).filter(Boolean)
  };
}

/** Compatibility helper for the direct CodexRunner test/API surface. */
export async function stageSelectedSkills(
  skillPaths: string[],
  workspacePath: string,
  availableSkillPaths: string[] = skillPaths,
  agent?: AgentName
): Promise<string[]> {
  return (await stageInvocationSkills(
    skillPaths,
    [],
    workspacePath,
    availableSkillPaths,
    agent
  )).skillPaths;
}

async function readManagedSkillDirectories(manifestPath: string): Promise<string[]> {
  try {
    const parsed = JSON.parse(await fs.readFile(manifestPath, "utf8")) as unknown;
    const directories = parsed && typeof parsed === "object"
      ? (parsed as { directories?: unknown }).directories
      : undefined;
    return Array.isArray(directories)
      ? directories.filter((value): value is string =>
          typeof value === "string" && safeSkillDirectoryName(value))
      : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT" || error instanceof SyntaxError) return [];
    throw error;
  }
}

async function writeManagedSkillDirectories(
  manifestPath: string,
  directories: string[]
): Promise<void> {
  const temporaryPath = `${manifestPath}.${randomUUID()}.tmp`;
  await fs.writeFile(
    temporaryPath,
    `${JSON.stringify({ directories: [...new Set(directories)].sort() }, null, 2)}\n`,
    { encoding: "utf8", mode: 0o600 }
  );
  await fs.rename(temporaryPath, manifestPath);
}

function safeSkillDirectoryName(value: string): boolean {
  return value.length > 0 && value !== "." && value !== ".." &&
    !value.includes("\0") && path.basename(value) === value;
}

async function assertSkillTreeHasNoSymbolicLinks(root: string): Promise<void> {
  const pending = [root];
  while (pending.length > 0) {
    const current = pending.pop()!;
    const currentInfo = await fs.lstat(current);
    if (currentInfo.isSymbolicLink()) {
      throw new Error("Selected Skill tree must not contain symbolic links");
    }
    if (!currentInfo.isDirectory()) continue;
    for (const entry of await fs.readdir(current)) {
      const entryPath = path.join(current, entry);
      const entryInfo = await fs.lstat(entryPath);
      if (entryInfo.isSymbolicLink()) {
        throw new Error("Selected Skill tree must not contain symbolic links");
      }
      if (entryInfo.isDirectory()) pending.push(entryPath);
    }
  }
}

async function ensureWorkspaceDirectory(directory: string, workspacePath: string): Promise<void> {
  await fs.mkdir(directory, { recursive: true, mode: 0o700 });
  const info = await fs.lstat(directory);
  if (!info.isDirectory() || info.isSymbolicLink()) {
    throw new Error("Skill staging directory must be a real directory");
  }
  const realDirectory = await fs.realpath(directory);
  const relative = path.relative(workspacePath, realDirectory);
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error("Skill staging directory resolves outside the project workspace");
  }
  await fs.chmod(directory, 0o700);
}
