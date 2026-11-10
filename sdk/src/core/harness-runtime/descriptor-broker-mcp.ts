#!/usr/bin/env node
// @ts-nocheck -- standalone byte-pinned subprocess; runtime validation is deliberate.
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { constants, promises as fs } from "node:fs";
import path from "node:path";
import readline from "node:readline";

const EXPECTED_HELPER_SHA256 = "98d3cfcd2952fc07e8da25419030f1695796497bde6c2e28360562082dd92c8f";
const EXPECTED_WINDOWS_HELPER_SHA256 = "2db9f05100aa658cd1fd813097526c4f9dc286732da6e762cbf73b7c530cbc32";
const expectedHelperSha256 = process.platform === "win32" ? EXPECTED_WINDOWS_HELPER_SHA256 : EXPECTED_HELPER_SHA256;
const NO_FOLLOW = typeof constants.O_NOFOLLOW === "number" ? constants.O_NOFOLLOW : 0;
const configPath = process.argv[2];
if (!configPath) throw new Error("descriptor broker MCP config is required");

async function privateJson(file) {
  const handle = await fs.open(file, constants.O_RDONLY | NO_FOLLOW);
  try {
    const info = await handle.stat();
    if (!info.isFile() || info.nlink !== 1 || (process.platform !== "win32" && (info.mode & 0o022) !== 0) || info.size > 64 * 1024) {
      throw new Error("descriptor broker MCP config is not a private regular file");
    }
    return JSON.parse(await handle.readFile("utf8"));
  } finally {
    await handle.close();
  }
}

const config = await privateJson(configPath);
if (config.toolMode !== undefined && config.toolMode !== "git") throw new Error("Unsupported platform tool mode");
const gitOnly = config.toolMode === "git";
if (config.schemaVersion !== 1 || !Array.isArray(config.roots) ||
  typeof config.helperPath !== "string" || typeof config.pythonExecutable !== "string" ||
  typeof config.gitExecutable !== "string" ||
  !["none", "execution", "project-service"].includes(config.gitCapability) ||
  typeof config.executionWorktree !== "string" ||
  typeof config.executionMemoryPath !== "string") {
  throw new Error("descriptor broker MCP config is malformed");
}
const closingFiles = config.roots.some(root => root.writeFiles !== undefined);
if (closingFiles && (config.gitCapability !== "none" || config.roots.some(root => root.write && root.writeFiles === undefined))) {
  throw new Error("exact closing files cannot receive unrestricted filesystem or broker Git authority");
}
const helper = await fs.readFile(config.helperPath);
if (createHash("sha256").update(helper).digest("hex") !== expectedHelperSha256 ||
  config.helperSha256 !== expectedHelperSha256) {
  throw new Error("descriptor broker helper digest is invalid");
}

const broker = spawn(config.pythonExecutable, ["-I", "-B", config.helperPath], {
  stdio: ["pipe", "pipe", "pipe"],
  env: { LANG: "C.UTF-8", LC_ALL: "C.UTF-8" },
  windowsHide: true
});
const pending = new Map();
let brokerId = 0;
let stderr = "";
broker.stderr.setEncoding("utf8");
broker.stderr.on("data", (chunk) => { stderr = `${stderr}${chunk}`.slice(-4096); });
readline.createInterface({ input: broker.stdout, crlfDelay: Infinity }).on("line", (line) => {
  let message;
  try { message = JSON.parse(line); } catch { broker.kill("SIGKILL"); return; }
  const waiter = pending.get(message.id);
  if (!waiter) { broker.kill("SIGKILL"); return; }
  pending.delete(message.id);
  if (message.ok === true && message.result) waiter.resolve(message.result);
  else waiter.reject(Object.assign(new Error(message?.error?.message || "descriptor broker refused operation"), {
    brokerErrorType: typeof message?.error?.type === "string" ? message.error.type : undefined
  }));
});
broker.once("close", () => {
  for (const waiter of pending.values()) waiter.reject(new Error(stderr || "descriptor broker exited"));
  pending.clear();
});

async function brokerRequest(value) {
  const id = `mcp-${++brokerId}`;
  const result = new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
  broker.stdin.write(`${JSON.stringify({ ...value, id })}\n`);
  return result;
}

await brokerRequest({ action: "initialize", roots: config.roots });

const gitEnabled = config.gitCapability !== "none";
if (config.directBase !== undefined && (typeof config.directBase !== "string" ||
  !/^(?:main|groups\/[A-Za-z0-9][A-Za-z0-9._-]{0,159})$/.test(config.directBase) ||
  config.directBase.includes("..") || config.directBase.endsWith(".") || config.directBase.toLowerCase().endsWith(".lock"))) {
  throw new Error("descriptor broker direct Git base is invalid");
}
let gitWorktree;
if (gitEnabled) {
  if (!path.isAbsolute(config.executionWorktree)) {
    throw new Error("descriptor broker Git worktree is invalid");
  }
  const [worktreeInfo, executableInfo] = await Promise.all([
    fs.lstat(config.executionWorktree),
    fs.lstat(config.gitExecutable)
  ]);
  if (!worktreeInfo.isDirectory() || worktreeInfo.isSymbolicLink() ||
    !executableInfo.isFile() || executableInfo.isSymbolicLink() ||
    (process.platform !== "win32" && (executableInfo.mode & 0o022) !== 0)) {
    throw new Error("descriptor broker Git authority is invalid");
  }
  gitWorktree = await fs.realpath(config.executionWorktree);
  if (gitWorktree !== config.executionWorktree) {
    throw new Error("descriptor broker Git worktree must be canonical");
  }
}

const RESERVED_GIT_TOP_LEVEL = new Set([
  ".git"
]);
const MAX_GIT_OUTPUT_BYTES = 1024 * 1024;

function gitPath(value) {
  const candidate = text(value, "path");
  if (candidate.includes("\\") || path.posix.isAbsolute(candidate) ||
    candidate.endsWith("/") ||
    path.posix.normalize(candidate) !== candidate || candidate.startsWith("../")) {
    throw new Error("Git path must be an explicit normalized worktree-relative path");
  }
  const topLevel = candidate.split("/", 1)[0];
  if (RESERVED_GIT_TOP_LEVEL.has(topLevel)) {
    throw new Error("Git path is reserved for OpenFARS runtime or recovery state");
  }
  if (candidate.split("/").some(part => part.toLowerCase() === ".git")) throw new Error("Git metadata is not a workspace file");
  return candidate;
}

function gitPaths(values) {
  if (!Array.isArray(values) || values.length < 1 || values.length > 1024) {
    throw new Error("paths must contain between 1 and 1024 explicit paths");
  }
  return [...new Set(values.map(gitPath))];
}

async function runGit(args, acceptedExitCodes = [0]) {
  if (!gitEnabled || !gitWorktree) throw new Error("Git authority is unavailable");
  return new Promise((resolve, reject) => {
    const child = spawn(
      config.gitExecutable,
      ["-c", "core.hooksPath=/dev/null", "-c", "commit.gpgSign=false", ...args],
      {
        cwd: gitWorktree,
        stdio: ["ignore", "pipe", "pipe"],
        env: {
          HOME: "/nonexistent",
          LANG: "C.UTF-8",
          LC_ALL: "C.UTF-8",
          GIT_TERMINAL_PROMPT: "0",
          GIT_OPTIONAL_LOCKS: "0"
        },
        windowsHide: true
      }
    );
    let stdout = "";
    let stderr = "";
    let overflow = false;
    const append = (target, chunk) => {
      const next = `${target}${chunk}`;
      if (Buffer.byteLength(next, "utf8") > MAX_GIT_OUTPUT_BYTES) {
        overflow = true;
        child.kill("SIGKILL");
      }
      return next.slice(0, MAX_GIT_OUTPUT_BYTES);
    };
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { stdout = append(stdout, chunk); });
    child.stderr.on("data", (chunk) => { stderr = append(stderr, chunk); });
    child.once("error", reject);
    child.once("close", (code, signal) => {
      if (overflow) {
        reject(new Error("Git output exceeded its bounded limit"));
      } else if (!acceptedExitCodes.includes(code)) {
        reject(new Error((stderr || stdout || `Git exited ${code ?? signal}`).trim()));
      } else {
        resolve({ stdout, stderr, code });
      }
    });
  });
}

async function stagedGitPaths() {
  const result = await runGit(["diff", "--cached", "--name-only", "-z", "--"]);
  return result.stdout.split("\0").filter(Boolean);
}

async function structuredGitStatus() {
  const readHead = async () => {
    const result = await runGit(["rev-parse", "--verify", "--quiet", "HEAD"], [0, 1, 128]);
    return result.code === 0 ? result.stdout.trim() : null;
  };
  const head = await readHead();
  const branch = (await runGit(["symbolic-ref", "--short", "HEAD"])).stdout.trim();
  const status = (await runGit(["status", "--short", "--branch", "--untracked-files=all", "--ignored=traditional"])).stdout;
  const fields = (await runGit(["status", "--porcelain=v1", "-z", "--untracked-files=all", "--ignored=traditional"])).stdout.split("\0");
  const entries = [];
  for (let i = 0; i < fields.length; i++) {
    const field = fields[i]; if (!field) continue;
    if (field.length < 4 || field[2] !== " ") throw new Error("Invalid Git status record");
    const index = field[0], worktree = field[1], file = field.slice(3);
    const entry = { path: file, index, worktree, untracked: index === "?" && worktree === "?", ignored: index === "!" && worktree === "!",
      conflicted: index === "U" || worktree === "U" || ["AA", "DD"].includes(index + worktree) };
    if (/[RC]/.test(index + worktree)) { entry.originalPath = fields[++i]; if (!entry.originalPath) throw new Error("Incomplete Git rename status"); }
    entries.push(entry);
  }
  const operations = [];
  for (const [ref, kind] of [["REVERT_HEAD", "revert"], ["MERGE_HEAD", "merge"], ["CHERRY_PICK_HEAD", "cherry-pick"]]) {
    const observed = await runGit(["rev-parse", "--verify", "--quiet", ref], [0, 1, 128]);
    if (observed.code === 0) operations.push({ kind, target: observed.stdout.trim() });
  }
  const markerPath = (await runGit(["rev-parse", "--git-path", "openfars-revert.json"])).stdout.trim();
  let markerHandle;
  try { markerHandle = await fs.open(path.resolve(gitWorktree, markerPath), constants.O_RDONLY | NO_FOLLOW); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
  if (markerHandle) {
    try {
      const info = await markerHandle.stat();
      if (!info.isFile() || info.nlink !== 1 || info.size > 1024 * 1024) throw new Error("Invalid local revert metadata");
      const marker = JSON.parse(await markerHandle.readFile("utf8"));
      if (marker.schemaVersion !== 1 || marker.branch !== branch || !/^git-revert-[a-f0-9]{64}$/.test(marker.operationId)) throw new Error("Local revert metadata differs from this branch");
      const native = operations.find(operation => operation.kind === "revert");
      if (native && native.target !== marker.request.target) throw new Error("Native revert target differs from the operation binding");
      if (native) native.operationId = marker.operationId;
      else operations.push({ kind: "revert", operationId: marker.operationId, target: marker.request.target, nativeConflict: false });
    } finally { await markerHandle.close(); }
  }
  let directBaseHead;
  if (config.directBase) {
    const base = await runGit(["rev-parse", "--verify", "--quiet", `refs/heads/${config.directBase}`], [0, 1, 128]);
    if (base.code === 0) directBaseHead = base.stdout.trim();
  }
  if (await readHead() !== head) throw new Error("Git HEAD changed during status; read again");
  return { status, branch, head, unborn: head === null, directBase: config.directBase ?? null, directBaseHead: directBaseHead ?? null,
    directBaseSource: config.directBase ? "trusted-invocation" : "unavailable-in-legacy-binding", entries,
    staged: entries.filter(entry => !entry.untracked && entry.index !== " "),
    unstaged: entries.filter(entry => !entry.untracked && entry.worktree !== " "),
    untracked: entries.filter(entry => entry.untracked), conflicts: entries.filter(entry => entry.conflicted),
    operations, currentOperation: operations[0] ?? null };
}

/** Read-only Shell commands run real host utilities with an inherited opened
 * descriptor. No command string, redirection, hooks or arbitrary flags execute. */
async function readShell(args) {
  if (!config.readShell || process.platform !== "linux") throw new Error("Read Shell is unavailable for this invocation");
  if (!["ls", "cat", "rg"].includes(args.command)) throw new Error("Shell supports ls, cat and rg only");
  const command = config.readShellExecutables?.[args.command];
  if (!command) throw new Error(`Read Shell utility ${args.command} is not installed`);
  const candidate = path.resolve(config.executionWorktree || config.roots[0].path, text(args.path, "path"));
  const real = await fs.realpath(candidate);
  const authorized = target => config.roots.some(root => {
    const relative = path.relative(root.path, target);
    return relative === "" || relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
  });
  if (!authorized(real)) throw new Error("Read Shell path is outside authorized read roots");
  const handle = await fs.open(real, constants.O_RDONLY | NO_FOLLOW | constants.O_NONBLOCK);
  try {
    const actual = await fs.realpath(`/proc/self/fd/${handle.fd}`);
    if (!authorized(actual)) throw new Error("Read Shell target changed outside authorized roots");
    const info = await handle.stat();
    if (args.command === "ls" && !info.isDirectory() || args.command === "cat" && !info.isFile() ||
      args.command === "rg" && !info.isDirectory() && !info.isFile()) throw new Error("Invalid Shell target type");
    const target = `/proc/self/fd/3${info.isDirectory() ? "/" : ""}`;
    const argv = args.command === "ls" ? ["-la", "--", target]
      : args.command === "cat" ? ["--", target]
      : ["--no-config", "--hidden", "--color", "never", "-n", "--glob", "!.git/**", "-e", text(args.pattern, "pattern"), "--", target];
    return await new Promise((resolve, reject) => {
      const child = spawn(command, argv, { shell: false, stdio: ["ignore", "pipe", "pipe", handle.fd],
        env: { LANG: "C.UTF-8", LC_ALL: "C.UTF-8" } });
      let stdout = "", stderr = "", truncated = false;
      const timer = setTimeout(() => child.kill("SIGKILL"), 15_000);
      child.stdout.setEncoding("utf8"); child.stderr.setEncoding("utf8");
      child.stdout.on("data", chunk => {
        stdout += chunk;
        if (Buffer.byteLength(stdout) > 1024 * 1024) { truncated = true; stdout = stdout.slice(0, 1024 * 1024); child.kill("SIGKILL"); }
      });
      child.stderr.on("data", chunk => { stderr = (stderr + chunk).slice(0, 8192); });
      child.once("error", error => { clearTimeout(timer); reject(error); });
      child.once("close", (exitCode, signal) => {
        clearTimeout(timer);
        resolve({ command: args.command, path: actual, stdout, stderr, exitCode, signal, truncated });
      });
    });
  } finally { await handle.close(); }
}

const tools = [
  {
    name: "read_file",
    description: "Read an authorized regular file. With offset, return one bounded byte page and nextOffset/eof/version; without offset, require the whole file to fit maxBytes. Use paging for large Inbox/current-state files. expectedVersion optionally requires an unchanged snapshot. UTF-8 pages preserve character boundaries; base64 reads arbitrary bytes losslessly.",
    inputSchema: {
      type: "object", additionalProperties: false, required: ["rootId", "path"],
      properties: {
        rootId: { type: "string" }, path: { type: "string" },
        maxBytes: { type: "integer", minimum: 1, maximum: 4194304 },
        offset: { type: "integer", minimum: 0 },
        expectedVersion: { anyOf: [{ type: "string", pattern: "^[a-f0-9]{64}$" }, { enum: ["", "None", "none", "null", "undefined", null] }], description: "Optional: omit on the first read or for a live file. Null, empty string and the null placeholders None/none/null/undefined mean no version constraint. A concrete version must be the exact 64-character version returned by a successful paged read; also supply offset." },
        encoding: { enum: ["utf8", "base64"] }
      }
    }
  },
  {
    name: "write_file",
    description: "Atomically replace a regular file beneath an opaque writable root.",
    inputSchema: {
      type: "object", additionalProperties: false, required: ["rootId", "path", "content"],
      properties: {
        rootId: { type: "string" }, path: { type: "string" },
        content: { type: "string", maxLength: 67108864 },
        encoding: { enum: ["utf8", "base64"] }
      }
    }
  },
  {
    name: "list_directory",
    description: "List one bounded directory page beneath an opaque authorized root. Omit path, use an empty path, or use '.' to list that root itself; nested paths must be normalized relative paths.",
    inputSchema: {
      type: "object", additionalProperties: false, required: ["rootId"],
      properties: {
        rootId: { type: "string" }, path: { type: "string" },
        offset: { type: "integer", minimum: 0 },
        limit: { type: "integer", minimum: 1, maximum: 1000 }
      }
    }
  },
  {
    name: "make_directory",
    description: "Create a directory path beneath an opaque writable root without following links.",
    inputSchema: {
      type: "object", additionalProperties: false, required: ["rootId", "path"],
      properties: { rootId: { type: "string" }, path: { type: "string" } }
    }
  },
  {
    name: "authority_matrix",
    description: "Report opaque read/write root capabilities without revealing paths.",
    inputSchema: { type: "object", additionalProperties: false, properties: {} }
  }
];

if (config.readShell && process.platform === "linux") tools.push({
  name: "shell",
  description: "Read-only Shell: run real ls, cat or rg from the project entry or an authorized absolute path. command is ls/cat/rg; path is a directory for ls, a regular file for cat, or a file/directory for rg; pattern is required for rg. No writes, pipes, redirection or arbitrary flags. Outputs over 1 MiB are explicitly marked truncated; narrow the path/pattern to read the rest.",
  inputSchema: { type: "object", additionalProperties: false, required: ["command", "path"],
    properties: { command: { enum: ["ls", "cat", "rg"] }, path: { type: "string" }, pattern: { type: "string", maxLength: 4000 } } }
});

if (closingFiles) {
  tools.push({
    name: "remove_file",
    description: "Remove one unaliased regular file explicitly listed in this invocation's closing manifest. No directories, links or other paths. The Agent decides whether an authorized leftover is temporary and should be removed.",
    inputSchema: {
      type: "object", additionalProperties: false, required: ["rootId", "path"],
      properties: { rootId: { type: "string" }, path: { type: "string" } }
    }
  });
}

if (gitEnabled) {
  tools.push(
    {
      name: "git_status",
      description: "Inspect the Harness-owned execution worktree without changing it. Returns the original status text plus actual branch/head, trusted direct base, staged/unstaged/untracked/conflicted entries and current Git operation including an exact revert operationId when locally bound.",
      inputSchema: { type: "object", additionalProperties: false, properties: {} }
    },
    {
      name: "git_stage",
      description: "Stage project files in your assigned Git worktree, including Memory, hidden files, configuration and files matched by ignore rules. Use paths=[\".\"] to include the entire project workspace. Git metadata and paths outside this worktree remain inaccessible.",
      inputSchema: {
        type: "object", additionalProperties: false, required: ["paths"],
        properties: {
          paths: {
            type: "array", minItems: 1, maxItems: 1024, uniqueItems: true,
            items: { type: "string", minLength: 1, maxLength: 4096 }
          }
        }
      }
    },
    {
      name: "git_unstage",
      description: "Remove only the listed paths from the staging area without changing worktree files.",
      inputSchema: {
        type: "object", additionalProperties: false, required: ["paths"],
        properties: {
          paths: {
            type: "array", minItems: 1, maxItems: 1024, uniqueItems: true,
            items: { type: "string", minLength: 1, maxLength: 4096 }
          }
        }
      }
    },
    {
      name: "git_commit",
      description: "Create one Harness-authored commit from the already staged business paths.",
      inputSchema: {
        type: "object", additionalProperties: false, required: ["message"],
        properties: { message: { type: "string", minLength: 1, maxLength: 10000 } }
      }
    }
  );
}

function rpcResult(id, result) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id, result })}\n`);
}
function rpcError(id, code, message) {
  process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } })}\n`);
}
function text(value, label) {
  if (typeof value !== "string" || !value || value.includes("\0")) throw new Error(`${label} is invalid`);
  return value;
}

async function handle(request) {
  if (request.id === undefined || typeof request.method !== "string") return;
  if (request.method === "initialize") {
    rpcResult(request.id, {
      protocolVersion: "2025-06-18",
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: gitOnly ? "openfars-git" : "openfars-descriptor-filesystem", version: "1" }
    });
    return;
  }
  if (request.method === "tools/list") {
    // Advertise the authority actually allocated for this invocation. A
    // retained receipt turn may read its old memory but has no writable root.
    const exposed = gitOnly ? tools.filter(tool => tool.name.startsWith("git_")) : closingFiles ? tools.filter(tool => tool.name !== "make_directory")
      : config.roots.some((root) => root.write) ? tools
      : tools.filter((tool) => !["write_file", "make_directory"].includes(tool.name));
    rpcResult(request.id, { tools: exposed }); return;
  }
  if (request.method !== "tools/call") { rpcError(request.id, -32601, "Unsupported method"); return; }
  const params = request.params && typeof request.params === "object" ? request.params : {};
  const args = params.arguments && typeof params.arguments === "object" ? params.arguments : {};
  try {
    if (gitOnly && !tools.some(tool => tool.name === params.name && tool.name.startsWith("git_"))) throw Object.assign(new Error(`Unknown platform Git tool: ${params.name}`), { code: "TOOL_NOT_AVAILABLE", invalidField: "name" });
    let result;
    if (params.name === "shell") {
      result = await readShell(args);
    } else if (params.name === "read_file") {
      const rootId = text(args.rootId, "rootId"), relativePath = text(args.path, "path");
      if (!config.roots.some(root => root.id === rootId)) throw Object.assign(new Error("unknown opaque root id. Call authority_matrix and copy a current rootId; skill aliases and MCP server names are not root IDs."),
        { code: "FILESYSTEM_ROOT_UNKNOWN", invalidField: "rootId", nextCall: { tool: "authority_matrix", arguments: {} } });
      if (args.offset !== undefined && (!Number.isSafeInteger(args.offset) || args.offset < 0)) throw Object.assign(new Error("offset must be a nonnegative safe integer. Omit it for a bounded whole-file read, or use offset=0 then copy the returned nextOffset."), { invalidField: "offset" });
      if (args.maxBytes !== undefined && (!Number.isSafeInteger(args.maxBytes) || args.maxBytes < 1 || args.maxBytes > 4194304)) throw Object.assign(new Error("maxBytes must be an integer between 1 and 4194304. For a large file, use offset=0 and maxBytes=65536, then copy nextOffset."), { invalidField: "maxBytes" });
      // Optional fields can arrive as empty placeholders. They request no
      // snapshot constraint; a concrete version must still be exact and is
      // never discarded or replaced after a failed consistency check.
      const expectedVersion = args.expectedVersion === null || ["", "None", "none", "null", "undefined"].includes(args.expectedVersion) ? undefined : args.expectedVersion;
      if (expectedVersion !== undefined && (args.offset === undefined || typeof expectedVersion !== "string" || !/^[a-f0-9]{64}$/.test(expectedVersion))) throw Object.assign(new Error("expectedVersion requires a valid paged read. Omit expectedVersion to read the current file, or supply offset and copy the exact 64-character version returned by a successful paged read. A guessed hash or non-version value cannot pin a snapshot."),
        { invalidField: "expectedVersion", nextCall: { tool: "read_file", arguments: { rootId, path: relativePath, offset: args.offset ?? 0, maxBytes: args.maxBytes ?? 65536,
          ...(typeof expectedVersion === "string" && /^[a-f0-9]{64}$/.test(expectedVersion) ? { expectedVersion } : {}),
          ...(args.encoding ? { encoding: args.encoding } : {}) } } });
      if (args.encoding !== undefined && !["utf8", "base64"].includes(args.encoding)) throw new Error("encoding is invalid");
      result = await brokerRequest({
        action: "read", rootId,
        relativePath,
        maxBytes: args.maxBytes ?? (args.offset === undefined ? 4 * 1024 * 1024 : 65536),
        ...(args.offset === undefined ? {} : { offset: args.offset }),
        ...(expectedVersion === undefined ? {} : { expectedVersion })
      });
      let bytes = Buffer.from(result.contentBase64, "base64");
      if (args.encoding === "base64") {
        result = { ...result, content: result.contentBase64, encoding: "base64", contentBase64: undefined };
      } else {
        let content;
        if (args.offset !== undefined) {
          // A byte limit may cut a UTF-8 character. Consume only complete
          // characters so the next page starts at the correct byte boundary.
          const decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
          for (let trim = 0; trim <= (result.eof ? 0 : Math.min(3, bytes.length - 1)); trim++) {
            try { content = decoder.decode(bytes.subarray(0, bytes.length - trim)); bytes = bytes.subarray(0, bytes.length - trim); break; } catch { /* try a complete trailing character */ }
          }
          if (content === undefined) throw new Error("Read page is not complete UTF-8; increase maxBytes, use a returned nextOffset, or select encoding=base64");
          result = { ...result, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex"),
            nextOffset: args.offset + bytes.length, eof: args.offset + bytes.length === result.totalBytes };
        } else content = bytes.toString("utf8");
        result = { ...result, content, encoding: "utf8", contentBase64: undefined };
      }
    } else if (params.name === "write_file") {
      if (typeof args.content !== "string") throw new Error("content is invalid");
      const content = args.content;
      const bytes = Buffer.from(content, args.encoding === "base64" ? "base64" : "utf8");
      result = await brokerRequest({
        action: "write", rootId: text(args.rootId, "rootId"),
        relativePath: text(args.path, "path"), contentBase64: bytes.toString("base64")
      });
    } else if (params.name === "list_directory") {
      if (args.path !== undefined && typeof args.path !== "string") {
        throw new Error("path is invalid");
      }
      result = await brokerRequest({
        action: "list", rootId: text(args.rootId, "rootId"),
        relativePath: args.path === "." ? "" : args.path ?? "",
        offset: Number.isSafeInteger(args.offset) ? args.offset : 0,
        limit: Number.isSafeInteger(args.limit) ? args.limit : 200
      });
    } else if (params.name === "make_directory") {
      result = await brokerRequest({
        action: "mkdir", rootId: text(args.rootId, "rootId"),
        relativePath: text(args.path, "path")
      });
    } else if (params.name === "remove_file") {
      if (!closingFiles) throw new Error("file removal requires an explicit closing manifest");
      result = await brokerRequest({
        action: "remove", rootId: text(args.rootId, "rootId"),
        relativePath: text(args.path, "path")
      });
    } else if (params.name === "authority_matrix") {
      result = await brokerRequest({ action: "matrix" });
    } else if (params.name === "git_status") {
      result = await structuredGitStatus();
    } else if (params.name === "git_stage") {
      const paths = gitPaths(args.paths);
      await runGit(["add", "-A", "-f", "--", ...paths]);
      result = { staged: await stagedGitPaths() };
    } else if (params.name === "git_unstage") {
      const paths = gitPaths(args.paths);
      await runGit(["reset", "--quiet", "HEAD", "--", ...paths]);
      result = { staged: await stagedGitPaths() };
    } else if (params.name === "git_commit") {
      const message = text(args.message, "message");
      if (message.length > 10_000) throw new Error("message is too large");
      const staged = await stagedGitPaths();
      if (staged.length === 0) throw new Error("No business paths are staged for commit");
      staged.forEach(gitPath);
      await runGit(["commit", "--no-gpg-sign", "-m", message]);
      const head = await runGit(["rev-parse", "HEAD"]);
      result = { commitSha: head.stdout.trim(), stagedPaths: staged };
    } else {
      throw new Error("unknown filesystem authority tool");
    }
    const failed = params.name === "shell" && (result.signal !== null || result.exitCode !== 0 && !(args.command === "rg" && result.exitCode === 1));
    rpcResult(request.id, { ...(failed ? { isError: true } : {}), content: [{ type: "text", text: JSON.stringify(result) }], structuredContent: result });
  } catch (error) {
    const missing = error?.brokerErrorType === "FileNotFoundError";
    const detail = { code: error?.code || (missing ? "FILESYSTEM_PATH_NOT_FOUND" : error?.invalidField ? "FILESYSTEM_ARGUMENT_INVALID" : "FILESYSTEM_OPERATION_REJECTED"),
      message: error instanceof Error ? error.message : String(error),
      ...(error?.invalidField ? { invalidField: error.invalidField } : {}),
      ...(error?.nextCall ? { nextCall: error.nextCall } : missing && params.name === "read_file" ? {
        nextCall: { tool: "list_directory", arguments: { rootId: args.rootId, path: ".", offset: 0, limit: 100 } },
        requestedParent: path.posix.dirname(args.path),
        hint: "Inspect the authorized root and walk existing directories using exact file references. The guessed parent may also be missing; do not repeat invented skill paths, root IDs or task-message locations."
      } : {}) };
    rpcResult(request.id, {
      isError: true,
      structuredContent: { error: detail },
      content: [{ type: "text", text: JSON.stringify({ error: detail }) }]
    });
  }
}

const input = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
let tail = Promise.resolve();
input.on("line", (line) => {
  tail = tail.then(async () => {
    try { await handle(JSON.parse(line)); }
    catch (error) { process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); }
  });
});
await new Promise((resolve) => input.once("close", resolve));
await tail;
await brokerRequest({ action: "close" }).catch(() => undefined);
broker.stdin.end();
await new Promise((resolve) => {
  if (broker.exitCode !== null || broker.signalCode !== null) resolve();
  else broker.once("close", resolve);
});
