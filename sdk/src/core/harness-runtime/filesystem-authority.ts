import { createHash, randomUUID } from "node:crypto";
import { constants as fsConstants, promises as fs } from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";
import type { AgentPermission } from "../types.js";
import { mainWorkflowCurrentReferencePath } from "../main-workflow-files.js";
import type { RestrictedWorktreeClosingScope } from "../collaboration-git/contracts.js";
import { assertRestrictedClosingFiles, restrictedClosingPaths } from "../collaboration-git/restricted-worktree-closing.js";
import {
  AUTHORITATIVE_WORKFLOW_DEFINITION_FILE,
  AUTHORITATIVE_WORKFLOW_CURRENT_STATE_FILE,
  AUTHORITATIVE_WORKFLOW_REFERENCES
} from "../orchestration-control-bridge.js";
import { HarnessRuntimeError } from "./errors.js";
import { isWithin } from "./invocation-inputs.js";
import { spawnTrustedUtility } from "./process-host.js";
import { syncDirectory } from "./directory-sync.js";
import { protectWindowsRuntimeFile, windowsExecutable } from "./windows-resident.js";
import type { InvocationInputs } from "./contracts.js";

export const DESCRIPTOR_BROKER_HELPER_SHA256 =
  "98d3cfcd2952fc07e8da25419030f1695796497bde6c2e28360562082dd92c8f";
export const DESCRIPTOR_BROKER_WINDOWS_SHA256 = "2db9f05100aa658cd1fd813097526c4f9dc286732da6e762cbf73b7c530cbc32";
export const DESCRIPTOR_BROKER_MCP_SHA256 =
  "fad45634f057cb1bae7818846f0facace49c5c91a21c1b355e45f625530de594";
export const DESCRIPTOR_BROKER_MCP_COMPILED_SHA256 =
  "9c4b16f0e35b2977c564811faa39ac7a7644b8165284b0634b03fbd92541e9db";

export type GitCapability = "none" | "execution" | "project-service";

export interface FilesystemRootBinding {
  id: string;
  path: string;
  write: boolean;
  /** Present only for a separately authorized closing turn. Never a prefix. */
  writeFiles?: readonly string[];
}

export interface FilesystemAuthority {
  serviceUserRoot: string;
  executionWorktree: string;
  ownedMemoryPath: string;
  readRoots: string[];
  writeRoots: string[];
  projectWorktreeRoot: string;
  protectedRoots: string[];
  gitCapability: GitCapability;
  directBase?: string;
  /** Opaque IDs are the only root selectors exposed by the broker tool. */
  rootBindings: ReadonlyArray<FilesystemRootBinding>;
  /** Native capabilities are available in every product role; forbidden is legacy broker compatibility only. */
  rawTools: "native" | "forbidden" | "trusted-yolo";
  readShell?: boolean;
}

export interface CompileFilesystemAuthorityRequest {
  /** Trusted caller must first bind the original owner's explicit closing grant. */
  restrictedWorktreeClosing?: { agentId: string; scope: RestrictedWorktreeClosingScope };
  /** Internal completed-task receipt turn: retain readable evidence only. */
  terminalPushObservation?: boolean;
  /** Coordination reads the evidence; its Agent writes finish/memory through MCP. */
  terminalPushCoordination?: boolean;
  permission: AgentPermission;
  role: "legacy" | "leader" | "delivery" | "final-integration";
  gitEnabled: boolean;
  directBase?: string;
  serviceUserRoot: string;
  executionWorktree?: string;
  ownedMemoryPath?: string;
  projectWorktreeRoot?: string;
  /** Every writable project worktree must be registered by trusted Git state. */
  projectWorktrees?: readonly string[];
  protectedRoots: readonly string[];
  /** Trusted staged input directories may live outside the service user's home. */
  inputReadRoots?: readonly string[];
  /** Server-staged proposal-only directory; never a business write root. */
  managementWriteRoot?: string;
}

export async function compileFilesystemAuthority(
  request: CompileFilesystemAuthorityRequest
): Promise<FilesystemAuthority> {
  if (request.role !== "leader" &&
    (!request.executionWorktree || !request.ownedMemoryPath)) {
    throw authorityError("Business filesystem authority requires an execution worktree and recovery memory");
  }
  const serviceUserRoot = await realDirectory(request.serviceUserRoot, "service-user root");
  const protectedRoots = await Promise.all(
    request.protectedRoots.map((item) => realExisting(item, "protected root"))
  );
  const executionWorktree = request.executionWorktree
    ? await realDirectory(request.executionWorktree, "execution worktree")
    : "";
  const ownedMemoryPath = request.ownedMemoryPath
    ? await realRegularFile(request.ownedMemoryPath, "owned memory")
    : "";
  const projectWorktreeRoot = request.projectWorktreeRoot
    ? await realDirectory(request.projectWorktreeRoot, "project worktree root")
    : "";
  const registeredWorktrees = await Promise.all(
    (request.projectWorktrees ?? []).map((item) => realDirectory(item, "registered project worktree"))
  );

  if (request.role !== "leader" && executionWorktree && protectedRoots.some((root) => pathsOverlap(executionWorktree, root))) {
    throw authorityError("Execution worktree overlaps a protected OpenFARS root");
  }
  if (ownedMemoryPath && !isWithin(ownedMemoryPath, executionWorktree)) {
    throw authorityError("Owned recovery memory is outside the execution worktree");
  }
  if (request.permission === "compute" && !request.terminalPushObservation && !request.restrictedWorktreeClosing) {
    if (!projectWorktreeRoot || !registeredWorktrees.length) {
      throw authorityError("Compute authority requires trusted project worktree registrations");
    }
    if (registeredWorktrees.some((root) => !isWithin(root, projectWorktreeRoot))) {
      throw authorityError("A compute write root is outside the current project's worktree root");
    }
  }

  let writeRoots: string[];
  let gitCapability: GitCapability;
  let writeFiles: readonly string[] | undefined;
  if (request.restrictedWorktreeClosing) {
    if (request.role !== "delivery" || !request.gitEnabled || request.managementWriteRoot ||
      request.terminalPushObservation || request.terminalPushCoordination ||
      ownedMemoryPath !== path.join(executionWorktree, "agent-memory", request.restrictedWorktreeClosing.agentId, "Memory.md")) {
      throw authorityError("Restricted closing requires its original delivery worktree and owned memory without other authority");
    }
    writeFiles = Object.freeze(restrictedClosingPaths(request.restrictedWorktreeClosing, request.restrictedWorktreeClosing.scope));
    await assertRestrictedClosingFiles(executionWorktree, writeFiles);
    writeRoots = [executionWorktree];
    // Necessary publication uses invocation-bound collaboration Git tools,
    // never the descriptor broker's independent staging/commit capability.
    gitCapability = "none";
  } else if (request.terminalPushCoordination) {
    if (request.role !== "leader" || request.managementWriteRoot || request.terminalPushObservation) {
      throw authorityError("Receipt coordination requires management read authority without workflow writes");
    }
    writeRoots = [];
    gitCapability = "none";
  } else if (request.terminalPushObservation) {
    if (request.role !== "delivery" || request.managementWriteRoot) {
      throw authorityError("Terminal push observation requires an original delivery worktree without management writes");
    }
    writeRoots = [];
    gitCapability = "none";
  } else if (request.role === "leader") {
    writeRoots = [];
    if (request.managementWriteRoot) {
      const proposalRoot = await realDirectory(request.managementWriteRoot, "management proposal root");
      const relative = executionWorktree && path.relative(executionWorktree, proposalRoot);
      const legacy = relative && /^\.scienceevolve\/management\/[A-Za-z0-9][A-Za-z0-9._-]{0,159}\/proposal$/.test(relative.split(path.sep).join("/"));
      const staged = (request.inputReadRoots ?? []).some(root =>
        isWithin(proposalRoot, path.dirname(root)) && /\/agent-inputs\/[^/]+\/management\/[A-Za-z0-9][A-Za-z0-9._-]{0,159}\/proposal$/.test(proposalRoot.split(path.sep).join("/")));
      if (!legacy && !staged) {
        throw authorityError("Leader write authority must be limited to its staged invocation proposal");
      }
      writeRoots = [proposalRoot];
    }
    gitCapability = "none";
  } else if (request.managementWriteRoot) {
    throw authorityError("Only a management turn may author workflow proposals");
  } else if (request.permission === "workspace") {
    writeRoots = [executionWorktree];
    gitCapability = request.gitEnabled ? "execution" : "none";
  } else if (request.permission === "compute") {
    writeRoots = uniquePaths([executionWorktree, ...registeredWorktrees]);
    gitCapability = request.gitEnabled ? "project-service" : "none";
  } else {
    writeRoots = [serviceUserRoot];
    gitCapability = request.gitEnabled ? "project-service" : "none";
  }

  if (request.permission !== "yolo" &&
    writeRoots.some((root) => protectedRoots.some((protectedRoot) =>
      pathsOverlap(root, protectedRoot)))) {
    throw authorityError("Non-yolo write authority overlaps protected OpenFARS state");
  }

  const inputReadRoots = await Promise.all(
    (request.inputReadRoots ?? []).map((item) => realDirectory(item, "staged input root"))
  );
  const readRoots = uniquePaths([serviceUserRoot, ...(executionWorktree ? [executionWorktree] : []), ...inputReadRoots]);
  const rootBindings = bindOpaqueRoots(readRoots, writeRoots, writeFiles);
  return Object.freeze({
    serviceUserRoot,
    readShell: !request.terminalPushObservation && !request.terminalPushCoordination && !request.restrictedWorktreeClosing,
    executionWorktree,
    ownedMemoryPath,
    readRoots,
    writeRoots,
    projectWorktreeRoot,
    protectedRoots: uniquePaths(protectedRoots),
    gitCapability,
    ...(request.directBase ? { directBase: request.directBase } : {}),
    rootBindings,
    rawTools: request.permission === "yolo" && !request.terminalPushObservation && !request.terminalPushCoordination && !request.restrictedWorktreeClosing ? "trusted-yolo" : "native"
  });
}

export function nativeInputReferences(inputs: Pick<InvocationInputs, "workspacePath" | "inboxPath" | "memoryPath" | "workflowAuthoringPath" | "workflowAuthoringInvocationId" | "workflowCurrentPath" | "workflowReadDirectory" | "workflowContext" | "contextIndex" | "userInputsPath">): string {
  return [
    `Workspace: ${inputs.workspacePath}`, `Inbox: ${inputs.inboxPath}`, `Memory: ${inputs.memoryPath}`,
    inputs.contextIndex ? `Context index: ${inputs.contextIndex.indexPath}` : "",
    inputs.userInputsPath ? `User-supplied files: ${inputs.userInputsPath}` : "",
    inputs.workflowReadDirectory ? `Canonical Workflow evidence: ${inputs.workflowReadDirectory}\nDefinition: ${path.join(inputs.workflowReadDirectory, "definition.json")}\nCurrent state: ${path.join(inputs.workflowReadDirectory, "current-state.json")}` : "",
    inputs.workflowCurrentPath ? `Current Workflow: ${inputs.workflowCurrentPath}` : "",
    inputs.workflowAuthoringPath ? `Workflow proposal: ${inputs.workflowAuthoringPath}\nCurrent accepted workflow: ${mainWorkflowCurrentReferencePath(inputs)}` : "",
    inputs.workflowContext ? `Agent / Skills / MCP details (read only what you need with native file tools): ${JSON.stringify({ definition: inputs.workflowContext.definitionPath, currentState: inputs.workflowContext.currentStatePath, details: inputs.workflowContext.agentsPath })}` : ""
  ].filter(Boolean).join("\n");
}

export function filesystemAuthorityPrompt(
  authority: FilesystemAuthority,
  inputs: Pick<InvocationInputs, "workspacePath" | "inboxPath" | "memoryPath" | "workflowAuthoringPath" | "workflowAuthoringInvocationId" | "workflowCurrentPath" | "workflowReadDirectory" | "workflowContext" | "contextIndex" | "userInputsPath">
): string {
  if (authority.rawTools !== "forbidden") return [
    "Use your native file, edit, search and Shell tools. Read context on demand; only Workflow-selected Skills are loaded.",
    nativeInputReferences(inputs),
    "Perform Git and PR operations through platform Git tools; edit conflict contents with native tools. Native subagents and loops stay inside this parent node."
  ].filter(Boolean).join("\n");
  const reference = (label: string, target: string, directory = false) => {
    const root = [...authority.rootBindings].filter((item) => isWithin(target, item.path))
      .sort((left, right) => right.path.length - left.path.length)[0];
    if (!root) return `${label}: ${target}`;
    const relative = path.relative(root.path, target).split(path.sep).join("/");
    return `${label}: rootId="${root.id}", ${directory ? "paths relative to this root" : `path="${relative}"`}; ${root.writeFiles ? "only the explicit closing files are writable" : root.write ? "read/write" : "read-only"}.`;
  };
  return [
    "Descriptor filesystem tool references for this invocation:",
    "The openfars-filesystem-authority MCP exposes callable tools. Read files with its exposed read_file tool using {\"rootId\":\"<listed rootId>\",\"path\":\"<listed relative path>\"}. Use the tool name as exposed by your current Harness, including its MCP namespace when present. These references are tool arguments, not MCP resources or root:// URIs; read_mcp_resource and resource listing do not read these files.",
    "For large files, read only the needed pages with read_file {rootId, path, offset:0, maxBytes:65536}, then use the returned nextOffset for another page. offset/maxBytes count bytes. expectedVersion is optional: omit it on the first read and for live current-state files; null and an empty string also mean no version constraint. To verify an unchanged snapshot between pages, copy the exact 64-character version returned by a successful paged read and include offset. A concrete version mismatch remains an error; read the current file explicitly if you need a newer snapshot. Omit offset only when you need a bounded whole-file read. Do not repeatedly lower maxBytes on a whole-file size refusal. Tool errors retain structured error.code, invalidField and nextCall when available in both JSON text and structured content. Correct an invalid argument, inspect authority_matrix for a root ID error, and inspect the referenced parent directory for a missing file; do not repeat a guessed path or hash.",
    reference("Current workspace", inputs.workspacePath, true),
    reference("Invocation Inbox", inputs.inboxPath),
    ...(inputs.contextIndex ? [reference("On-demand context index", inputs.contextIndex.indexPath),
      reference("On-demand context record paths (list.path and detail.path)", path.dirname(inputs.inboxPath), true),
      "Context record paths already include context-records/. Use the complete listed path with the Inbox directory's rootId; a bare hash filename does not refer to the context-records directory."
    ] : []),
    reference("Persistent memory", inputs.memoryPath),
    ...authority.rootBindings.filter(root => root.writeFiles).map(root =>
      `Restricted closing files: rootId="${root.id}", paths=${JSON.stringify(root.writeFiles)}. Only these exact files may be written or removed. Directories and all other paths remain read-only. Necessary Git delivery uses the separately authorized collaboration tools.`),
    ...(inputs.workflowReadDirectory ? [
      reference(`Authoritative workflow definition (${AUTHORITATIVE_WORKFLOW_REFERENCES.definition})`,
        path.join(inputs.workflowReadDirectory, AUTHORITATIVE_WORKFLOW_DEFINITION_FILE)),
      reference(`Authoritative workflow current state (${AUTHORITATIVE_WORKFLOW_REFERENCES.currentState})`,
        path.join(inputs.workflowReadDirectory, AUTHORITATIVE_WORKFLOW_CURRENT_STATE_FILE)),
      "Read the authoritative workflow with read_file using these exact rootId/path pairs; the workspace workflow symlink cannot be traversed by this tool."
    ] : []),
    ...(inputs.workflowContext ? [
      reference("Read-only Workflow definition", inputs.workflowContext.definitionPath),
      reference("Read-only Workflow runtime facts", inputs.workflowContext.currentStatePath),
      reference("Read-only Agent / Skills / MCP details", inputs.workflowContext.agentsPath)
    ] : []),
    ...(inputs.userInputsPath ? [reference("User-supplied files", inputs.userInputsPath, true)] : []),
    ...(inputs.workflowAuthoringPath ? [reference("Writable workflow proposal", inputs.workflowAuthoringPath)] : []),
    ...(inputs.workflowAuthoringPath ? [reference("Current accepted workflow authoring reference", mainWorkflowCurrentReferencePath(inputs))] : []),
    "Use these rootId/path pairs with the filesystem-authority MCP tools. Paths are relative to the selected root; do not prepend the workspace path."
  ].join("\n");
}

export interface BrokerReadResult {
  bytes: number;
  sha256: string;
  content: Buffer;
}

export interface BrokerReadPage extends BrokerReadResult {
  offset: number;
  nextOffset: number;
  totalBytes: number;
  eof: boolean;
  version: string;
}

export interface BrokerWriteResult {
  bytes: number;
  sha256: string;
}

export interface BrokerDirectoryEntry {
  name: string;
  type: "file" | "directory" | "symlink" | "other";
  bytes: number;
}

export interface BrokerDirectoryPage {
  entries: BrokerDirectoryEntry[];
  offset: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface PreparedFilesystemMcp {
  row: {
    name: string;
    namespace: string;
    transport: "stdio";
    command: string;
    args: string[];
    env?: Record<string, string>;
  };
  configPath: string;
  configSha256: string;
  authoritySha256: string;
  bridgePath: string;
  bridgeSha256: string;
  nodeExecutable: string;
  gitExecutable: string;
}

/**
 * Materialize the only trusted MCP row allowed to expose non-yolo writes.
 * Its private config lives outside every Agent-writable root and the bridge
 * re-verifies the pinned helper before retaining descriptor-relative roots.
 */
export async function prepareFilesystemAuthorityMcp(options: {
  authority: FilesystemAuthority;
  executionRuntimePath: string;
  pythonExecutable?: string;
  nodeExecutable?: string;
  gitExecutable?: string;
  helperPath?: string;
  bridgePath?: string;
  toolMode?: "git";
}): Promise<PreparedFilesystemMcp> {
  const runtimePath = await realDirectory(options.executionRuntimePath, "resident runtime");
  // Native tools are intentionally unsandboxed. Keep sealed binding/pin checks;
  // advisory task scopes cannot prove OS-level write isolation in this mode.
  const isolatedWriteRoots = options.toolMode === "git" && options.authority.rawTools !== "forbidden" ? [] : options.authority.writeRoots;
  if (isolatedWriteRoots.some((root) => isWithin(runtimePath, root))) {
    throw authorityError("Filesystem MCP config is inside Agent-writable authority");
  }
  const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));
  const helperPath = await verifyPinnedHelper(
    options.helperPath ?? path.join(moduleDirectory, process.platform === "win32" ? "descriptor-broker-windows.py" : "descriptor-broker-helper.py"),
    isolatedWriteRoots
  );
  const sourceBridge = path.join(moduleDirectory, "descriptor-broker-mcp.ts");
  const compiledBridge = path.join(moduleDirectory, "descriptor-broker-mcp.js");
  const selectedBridge = options.bridgePath ?? await existingCandidate([compiledBridge, sourceBridge]);
  const bridgeSha256 = selectedBridge.endsWith(".js")
    ? DESCRIPTOR_BROKER_MCP_COMPILED_SHA256
    : DESCRIPTOR_BROKER_MCP_SHA256;
  const bridgePath = await verifyPinnedExecutable(
    selectedBridge,
    bridgeSha256,
    isolatedWriteRoots,
    "descriptor broker MCP bridge"
  );
  const pythonExecutable = await realRegularFile(
    options.pythonExecutable ?? (process.platform === "win32" ? await windowsExecutable("python.exe") : "/usr/bin/python3"),
    "Python executable"
  );
  const nodeExecutable = await realRegularFile(
    options.nodeExecutable ?? process.execPath,
    "Node executable"
  );
  const gitExecutable = await verifyTrustedExecutable(
    options.gitExecutable ?? (process.platform === "win32" ? await windowsExecutable("git.exe") : "/usr/bin/git"),
    isolatedWriteRoots,
    "Git executable"
  );
  if (isolatedWriteRoots.some((root) =>
    isWithin(pythonExecutable, root) || isWithin(nodeExecutable, root) ||
    isWithin(gitExecutable, root))) {
    throw authorityError("Filesystem MCP executable is inside Agent-writable authority");
  }
  const authorityDocument = filesystemAuthorityDocument(options.authority);
  const authoritySha256 = digestJson(authorityDocument);
  const readShellExecutables: Record<string, string> = {};
  if (options.authority.readShell && process.platform === "linux") {
    for (const command of ["ls", "cat", "rg"]) {
      const candidates = [...new Set(["/usr/bin", "/bin", ...(process.env.PATH ?? "").split(path.delimiter)])].filter(Boolean);
      for (const directory of candidates) {
        try {
          readShellExecutables[command] = await verifyTrustedExecutable(path.join(directory, command), isolatedWriteRoots, `Read Shell ${command}`);
          break;
        } catch { /* Try the next installed utility; absence is reported by the tool. */ }
      }
    }
  }
  const document = {
    schemaVersion: 1,
    ...(options.toolMode ? { toolMode: options.toolMode } : {}),
    readShellExecutables,
    helperPath,
    helperSha256: process.platform === "win32" ? DESCRIPTOR_BROKER_WINDOWS_SHA256 : DESCRIPTOR_BROKER_HELPER_SHA256,
    pythonExecutable,
    gitExecutable,
    authoritySha256,
    ...authorityDocument
  };
  const encoded = `${JSON.stringify(document)}\n`;
  const configSha256 = createHash("sha256").update(encoded).digest("hex");
  const namespace = options.toolMode === "git" ? "openfars-git" : "openfars-filesystem-authority";
  const configPath = path.join(runtimePath, options.toolMode === "git" ? "platform-git-mcp.json" : "descriptor-filesystem-mcp.json");
  await atomicPrivateWrite(configPath, encoded);
  return Object.freeze({
    row: Object.freeze({
      name: namespace,
      namespace,
      transport: "stdio" as const,
      command: nodeExecutable,
      args: Object.freeze([bridgePath, configPath]) as unknown as string[]
    }),
    configPath,
    configSha256,
    authoritySha256,
    bridgePath,
    bridgeSha256,
    nodeExecutable,
    gitExecutable
  });
}

/** Git-only production binding. Generic files and Shell belong to the native Harness. */
export function prepareGitWorktreeMcp(options: Omit<Parameters<typeof prepareFilesystemAuthorityMcp>[0], "toolMode">): Promise<PreparedFilesystemMcp> {
  return prepareFilesystemAuthorityMcp({ ...options, toolMode: "git" });
}

export async function validatePreparedFilesystemMcp(
  prepared: PreparedFilesystemMcp,
  authority: FilesystemAuthority,
  executionRuntimePath: string
): Promise<void> {
  const runtimePath = await fs.realpath(executionRuntimePath);
  const isolatedWriteRoots = prepared.row.namespace === "openfars-git" && authority.rawTools !== "forbidden" ? [] : authority.writeRoots;
  const configPath = await realRegularFile(prepared.configPath, "filesystem MCP config");
  if (!isWithin(configPath, runtimePath) ||
    isolatedWriteRoots.some((root) => isWithin(configPath, root))) {
    throw authorityError("Filesystem MCP config is outside its trusted runtime boundary");
  }
  const bytes = await fs.readFile(configPath);
  if (createHash("sha256").update(bytes).digest("hex") !== prepared.configSha256) {
    throw authorityError("Filesystem MCP config digest changed after staging");
  }
  const document = JSON.parse(bytes.toString("utf8")) as Record<string, unknown>;
  const authoritySha256 = digestJson(filesystemAuthorityDocument(authority));
  if (prepared.authoritySha256 !== authoritySha256 ||
    document.authoritySha256 !== authoritySha256 ||
    prepared.row.namespace !== (document.toolMode === "git" ? "openfars-git" : "openfars-filesystem-authority") ||
    prepared.row.name !== prepared.row.namespace ||
    prepared.row.command !== prepared.nodeExecutable ||
    document.gitExecutable !== prepared.gitExecutable ||
    prepared.row.args.length !== 2 ||
    await fs.realpath(prepared.row.args[0]!) !== prepared.bridgePath ||
    await fs.realpath(prepared.row.args[1]!) !== configPath) {
    throw authorityError("Filesystem MCP row does not match trusted descriptor authority");
  }
  await verifyPinnedExecutable(
    prepared.bridgePath,
    prepared.bridgeSha256,
    isolatedWriteRoots,
    "descriptor broker MCP bridge"
  );
  await verifyTrustedExecutable(
    prepared.gitExecutable,
    isolatedWriteRoots,
    "Git executable"
  );
}

function filesystemAuthorityDocument(authority: FilesystemAuthority) {
  const executionMemoryPath = authority.executionWorktree && authority.ownedMemoryPath
    ? path.relative(authority.executionWorktree, authority.ownedMemoryPath).split(path.sep).join("/")
    : "";
  return {
    roots: authority.rootBindings.map((root) => ({
      id: root.id,
      path: root.path,
      write: root.write,
      ...(root.writeFiles ? { writeFiles: root.writeFiles } : {})
    })),
    readShell: authority.readShell === true,
    gitCapability: authority.gitCapability,
    ...(authority.directBase ? { directBase: authority.directBase } : {}),
    executionWorktree: authority.executionWorktree,
    executionMemoryPath
  };
}

async function verifyTrustedExecutable(
  executable: string,
  writeRoots: readonly string[],
  label: string
): Promise<string> {
  const real = await realRegularFile(executable, label);
  if (writeRoots.some((root) => isWithin(real, root))) {
    throw authorityError(`${label} is inside Agent-writable authority`);
  }
  const info = await fs.lstat(real);
  if (process.platform !== "win32" && (info.mode & 0o022) !== 0) {
    throw authorityError(`${label} is writable by an untrusted principal`);
  }
  return real;
}

async function verifyPinnedExecutable(
  executable: string,
  expectedDigest: string,
  writeRoots: readonly string[],
  label: string
): Promise<string> {
  if (!/^[a-f0-9]{64}$/.test(expectedDigest)) {
    throw authorityError(`${label} build digest is not pinned`);
  }
  const real = await realRegularFile(executable, label);
  if (writeRoots.some((root) => isWithin(real, root))) {
    throw authorityError(`${label} is inside Agent-writable authority`);
  }
  const info = await fs.lstat(real);
  // Node's Windows mode is synthesized from the read-only attribute; it does
  // not describe a DACL. The pinned digest remains mandatory on Windows.
  if (info.nlink !== 1 || (process.platform !== "win32" && (info.mode & 0o022) !== 0)) {
    throw authorityError(`${label} is not an immutable private file`);
  }
  const digest = createHash("sha256").update(await fs.readFile(real)).digest("hex");
  if (digest !== expectedDigest) throw authorityError(`${label} digest does not match the pinned build`);
  return real;
}

async function existingCandidate(candidates: readonly string[]): Promise<string> {
  for (const candidate of candidates) {
    try { await fs.access(candidate); return candidate; } catch { /* continue */ }
  }
  throw authorityError("Descriptor broker MCP bridge is missing");
}

function digestJson(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

async function atomicPrivateWrite(destination: string, content: string): Promise<void> {
  const directoryPath = path.dirname(destination);
  const temporary = path.join(directoryPath, `.${path.basename(destination)}.${randomUUID()}.tmp`);
  try {
    const handle = await fs.open(
      temporary,
      fsConstants.O_WRONLY | fsConstants.O_CREAT | fsConstants.O_EXCL |
        (typeof fsConstants.O_NOFOLLOW === "number" ? fsConstants.O_NOFOLLOW : 0),
      0o600
    );
    try { await handle.writeFile(content); await handle.sync(); } finally { await handle.close(); }
    if (process.platform === "win32") await protectWindowsRuntimeFile(temporary);
    const existing = await fs.lstat(destination).catch((error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") return undefined;
      throw error;
    });
    if (existing && (existing.isSymbolicLink() || !existing.isFile())) {
      throw authorityError("Filesystem MCP config destination is not a regular file");
    }
    await fs.rename(temporary, destination);
    await syncDirectory(directoryPath);
  } finally {
    await fs.rm(temporary, { force: true }).catch(() => undefined);
  }
}

interface BrokerResponse {
  id: string;
  ok: boolean;
  result?: Record<string, unknown>;
  error?: { type?: string; message?: string };
}

/**
 * Persistent helper process retains the pre-opened root descriptors. The
 * helper uses openat2(RESOLVE_BENEATH|NO_SYMLINKS|NO_MAGICLINKS|NO_XDEV), so
 * later pathname swaps, symlink aliases and mount crossings fail closed.
 */
export class DescriptorFilesystemBroker {
  readonly #child: ReturnType<typeof spawnTrustedUtility>;
  readonly #pending = new Map<string, {
    resolve: (value: Record<string, unknown>) => void;
    reject: (error: Error) => void;
  }>();
  #closed = false;
  #stderr = "";

  private constructor(child: ReturnType<typeof spawnTrustedUtility>) {
    this.#child = child;
    const lines = readline.createInterface({ input: child.stdout });
    lines.on("line", (line) => this.#accept(line));
    child.stderr.on("data", (chunk: Buffer) => {
      this.#stderr = `${this.#stderr}${chunk.toString("utf8")}`.slice(-16_384);
    });
    child.once("error", (error) => {
      this.#rejectPending("Descriptor broker failed to start", error);
    });
    child.stdin.on("error", (error) => {
      this.#rejectPending("Descriptor broker input closed unexpectedly", error);
    });
    child.once("close", () => {
      this.#closed = true;
      this.#rejectPending("Descriptor broker exited unexpectedly");
      lines.close();
    });
  }

  static async open(options: {
    authority: FilesystemAuthority;
    helperPath: string;
    pythonExecutable: string;
  }): Promise<DescriptorFilesystemBroker> {
    if (process.platform !== "linux" && process.platform !== "win32") {
      throw authorityError("Non-yolo filesystem authority requires a supported handle-relative broker");
    }
    const [helperPath, pythonExecutable] = await Promise.all([
      verifyPinnedHelper(options.helperPath, options.authority.writeRoots),
      realRegularFile(options.pythonExecutable, "Python executable")
    ]);
    const child = spawnTrustedUtility(
      pythonExecutable,
      ["-I", "-B", helperPath],
      { LANG: "C.UTF-8", LC_ALL: "C.UTF-8" }
    );
    const broker = new DescriptorFilesystemBroker(child);
    try {
      await broker.#request({
        action: "initialize",
        roots: options.authority.rootBindings.map((root) => ({
          id: root.id,
          path: root.path,
          write: root.write,
          ...(root.writeFiles ? { writeFiles: root.writeFiles } : {})
        }))
      });
      return broker;
    } catch (error) {
      await broker.#forceClose();
      throw error;
    }
  }

  async read(rootId: string, relativePath: string, maxBytes = 4 * 1024 * 1024): Promise<BrokerReadResult> {
    assertOpaquePath(rootId, relativePath);
    const result = await this.#request({ action: "read", rootId, relativePath, maxBytes });
    const encoded = typeof result.contentBase64 === "string" ? result.contentBase64 : "";
    const content = Buffer.from(encoded, "base64");
    const bytes = numberField(result.bytes, "read bytes");
    const sha256 = digestField(result.sha256);
    if (content.byteLength !== bytes || createHash("sha256").update(content).digest("hex") !== sha256) {
      throw authorityError("Descriptor broker returned inconsistent read evidence");
    }
    return { bytes, sha256, content };
  }

  async readPage(rootId: string, relativePath: string, offset = 0, maxBytes = 65536, expectedVersion?: string): Promise<BrokerReadPage> {
    assertOpaquePath(rootId, relativePath);
    if (!Number.isSafeInteger(offset) || offset < 0 || !Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > 4 * 1024 * 1024 ||
      (expectedVersion !== undefined && !/^[a-f0-9]{64}$/.test(expectedVersion))) {
      throw authorityError("Invalid descriptor broker read page");
    }
    const result = await this.#request({ action: "read", rootId, relativePath, offset, maxBytes,
      ...(expectedVersion === undefined ? {} : { expectedVersion }) });
    const content = Buffer.from(typeof result.contentBase64 === "string" ? result.contentBase64 : "", "base64");
    const bytes = numberField(result.bytes, "read bytes");
    const sha256 = digestField(result.sha256);
    const returnedOffset = numberField(result.offset, "read offset");
    const nextOffset = numberField(result.nextOffset, "read next offset");
    const totalBytes = numberField(result.totalBytes, "read total bytes");
    const version = digestField(result.version);
    if (returnedOffset !== offset || content.byteLength !== bytes || bytes > maxBytes || nextOffset !== offset + bytes ||
      nextOffset > totalBytes || typeof result.eof !== "boolean" || result.eof !== (nextOffset === totalBytes) ||
      createHash("sha256").update(content).digest("hex") !== sha256 || (expectedVersion !== undefined && version !== expectedVersion)) {
      throw authorityError("Descriptor broker returned inconsistent read-page evidence");
    }
    return { bytes, sha256, content, offset, nextOffset, totalBytes, eof: result.eof, version };
  }

  async writeAtomic(rootId: string, relativePath: string, content: Buffer): Promise<BrokerWriteResult> {
    assertOpaquePath(rootId, relativePath);
    if (content.byteLength > 64 * 1024 * 1024) {
      throw authorityError("Descriptor broker write exceeds the fixed limit");
    }
    const result = await this.#request({
      action: "write",
      rootId,
      relativePath,
      contentBase64: content.toString("base64")
    });
    const bytes = numberField(result.bytes, "write bytes");
    const sha256 = digestField(result.sha256);
    const expected = createHash("sha256").update(content).digest("hex");
    if (bytes !== content.byteLength || sha256 !== expected) {
      throw authorityError("Descriptor broker returned inconsistent write evidence");
    }
    return { bytes, sha256 };
  }

  /** File removal exists only for exact closing manifests, never general roots. */
  async removeFile(rootId: string, relativePath: string): Promise<{ removed: boolean }> {
    assertOpaquePath(rootId, relativePath);
    const result = await this.#request({ action: "remove", rootId, relativePath });
    if (typeof result.removed !== "boolean") throw authorityError("Descriptor broker returned invalid removal evidence");
    return { removed: result.removed };
  }

  async listDirectory(
    rootId: string,
    relativePath = "",
    offset = 0,
    limit = 200
  ): Promise<BrokerDirectoryPage> {
    assertOpaqueRoot(rootId);
    if (relativePath) assertOpaquePath(rootId, relativePath);
    if (!Number.isSafeInteger(offset) || offset < 0 ||
      !Number.isSafeInteger(limit) || limit < 1 || limit > 1000) {
      throw authorityError("Descriptor broker received an invalid directory page");
    }
    const result = await this.#request({
      action: "list", rootId, relativePath, offset, limit
    });
    if (!Array.isArray(result.entries)) {
      throw authorityError("Descriptor broker returned invalid directory entries");
    }
    const entries = result.entries.map((entry): BrokerDirectoryEntry => {
      if (!entry || typeof entry !== "object" ||
        typeof (entry as Record<string, unknown>).name !== "string" ||
        !["file", "directory", "symlink", "other"].includes(
          String((entry as Record<string, unknown>).type)
        )) {
        throw authorityError("Descriptor broker returned an invalid directory entry");
      }
      return {
        name: (entry as Record<string, unknown>).name as string,
        type: (entry as Record<string, unknown>).type as BrokerDirectoryEntry["type"],
        bytes: numberField((entry as Record<string, unknown>).bytes, "directory entry bytes")
      };
    });
    const returnedOffset = numberField(result.offset, "directory offset");
    const returnedLimit = numberField(result.limit, "directory limit");
    const total = numberField(result.total, "directory total");
    if (returnedOffset !== offset || returnedLimit !== limit || total < entries.length ||
      typeof result.hasMore !== "boolean") {
      throw authorityError("Descriptor broker returned inconsistent directory evidence");
    }
    return { entries, offset, limit, total, hasMore: result.hasMore };
  }

  async makeDirectory(rootId: string, relativePath: string): Promise<void> {
    assertOpaquePath(rootId, relativePath);
    const result = await this.#request({
      action: "mkdir", rootId, relativePath
    });
    if (result.created !== true || !Number.isSafeInteger(result.components) ||
      (result.components as number) < 1) {
      throw authorityError("Descriptor broker returned invalid directory creation evidence");
    }
  }

  async matrix(): Promise<Record<string, unknown>> {
    return this.#request({ action: "matrix" });
  }

  async close(): Promise<void> {
    if (this.#closed) return;
    await this.#request({ action: "close" }).catch(() => undefined);
    this.#child.stdin.end();
    await new Promise<void>((resolve) => {
      if (this.#child.exitCode !== null || this.#child.signalCode !== null) return resolve();
      this.#child.once("close", () => resolve());
    });
  }

  async #request(value: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (this.#closed) throw authorityError("Descriptor broker is closed");
    const id = randomUUID();
    const response = new Promise<Record<string, unknown>>((resolve, reject) => {
      this.#pending.set(id, { resolve, reject });
    });
    const line = `${JSON.stringify({ ...value, id })}\n`;
    if (!this.#child.stdin.write(line, "utf8")) {
      await new Promise<void>((resolve, reject) => {
        this.#child.stdin.once("drain", resolve);
        this.#child.stdin.once("error", reject);
      });
    }
    return response;
  }

  #accept(line: string): void {
    let response: BrokerResponse;
    try {
      response = JSON.parse(line) as BrokerResponse;
    } catch {
      for (const pending of this.#pending.values()) {
        pending.reject(authorityError("Descriptor broker emitted malformed JSON"));
      }
      this.#pending.clear();
      this.#child.kill("SIGKILL");
      return;
    }
    const pending = this.#pending.get(response.id);
    if (!pending) {
      this.#child.kill("SIGKILL");
      return;
    }
    this.#pending.delete(response.id);
    if (!response.ok || !response.result) {
      pending.reject(authorityError(
        `Descriptor broker refused the operation: ${response.error?.message ?? "unknown error"}`
      ));
      return;
    }
    pending.resolve(response.result);
  }

  #rejectPending(message: string, cause?: unknown): void {
    for (const pending of this.#pending.values()) {
      pending.reject(authorityError(message, cause));
    }
    this.#pending.clear();
  }

  async #forceClose(): Promise<void> {
    if (this.#child.exitCode !== null || this.#child.signalCode !== null) return;
    const closed = new Promise<void>((resolve) => this.#child.once("close", () => resolve()));
    this.#child.kill("SIGKILL");
    await closed;
  }
}

async function verifyPinnedHelper(helper: string, writeRoots: readonly string[]): Promise<string> {
  const real = await realRegularFile(helper, "descriptor broker helper");
  if (writeRoots.some((root) => isWithin(real, root))) {
    throw authorityError("Descriptor broker helper is inside Agent-writable authority");
  }
  const info = await fs.lstat(real);
  if (info.isSymbolicLink() || info.nlink !== 1 || (process.platform !== "win32" && (info.mode & 0o022) !== 0)) {
    throw authorityError("Descriptor broker helper is not an immutable private file");
  }
  const digest = createHash("sha256").update(await fs.readFile(real)).digest("hex");
  if (digest !== (process.platform === "win32" ? DESCRIPTOR_BROKER_WINDOWS_SHA256 : DESCRIPTOR_BROKER_HELPER_SHA256)) {
    throw authorityError("Descriptor broker helper digest does not match the pinned build");
  }
  return real;
}

function bindOpaqueRoots(
  readRoots: readonly string[],
  writeRoots: readonly string[],
  writeFiles?: readonly string[]
): ReadonlyArray<FilesystemRootBinding> {
  const rows = new Map<string, FilesystemRootBinding>();
  for (const root of readRoots) {
    rows.set(root, { id: opaqueRootId("read", root), path: root, write: false });
  }
  for (const root of writeRoots) {
    rows.set(root, { id: opaqueRootId("write", root), path: root, write: true, ...(writeFiles ? { writeFiles } : {}) });
  }
  return Object.freeze([...rows.values()].map(root => Object.freeze(root)));
}

function opaqueRootId(prefix: string, root: string): string {
  return `${prefix}-${createHash("sha256").update(root).digest("hex").slice(0, 16)}`;
}

function assertOpaquePath(rootId: string, relativePath: string): void {
  assertOpaqueRoot(rootId);
  if (!relativePath || relativePath.includes("\0") || path.isAbsolute(relativePath) ||
    relativePath.includes("\\") || relativePath.split("/").some((part) =>
      !part || part === "." || part === ".." || part === ".git")) {
    throw authorityError("Descriptor broker received an invalid opaque root or relative path");
  }
}

function assertOpaqueRoot(rootId: string): void {
  if (!/^(?:read|write)-[a-f0-9]{16}$/.test(rootId)) {
    throw authorityError("Descriptor broker received an invalid opaque root or relative path");
  }
}

async function realDirectory(value: string, label: string): Promise<string> {
  const real = await realExisting(value, label);
  if (!(await fs.stat(real)).isDirectory()) throw authorityError(`${label} must be a directory`);
  return real;
}

async function realRegularFile(value: string, label: string): Promise<string> {
  const real = await realExisting(value, label);
  const info = await fs.lstat(real);
  if (info.isSymbolicLink() || !info.isFile()) throw authorityError(`${label} must be a regular file`);
  return real;
}

async function realExisting(value: string, label: string): Promise<string> {
  if (!path.isAbsolute(value)) throw authorityError(`${label} must be absolute`);
  try {
    return await fs.realpath(value);
  } catch (error) {
    throw authorityError(`Unable to resolve ${label}`, error);
  }
}

function uniquePaths(values: readonly string[]): string[] {
  return [...new Set(values.map((item) => path.resolve(item)))];
}

function pathsOverlap(left: string, right: string): boolean {
  return isWithin(left, right) || isWithin(right, left);
}

function numberField(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw authorityError(`Descriptor broker returned invalid ${label}`);
  }
  return value as number;
}

function digestField(value: unknown): string {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/.test(value)) {
    throw authorityError("Descriptor broker returned an invalid digest");
  }
  return value;
}

function authorityError(message: string, cause?: unknown): HarnessRuntimeError {
  return new HarnessRuntimeError(
    "HARNESS_CONTRACT_VIOLATION",
    message,
    {},
    { source: "policy", cause: cause instanceof Error ? cause : undefined }
  );
}
