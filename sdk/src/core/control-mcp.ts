import { constants as fsConstants, promises as fs } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import readline from "node:readline";
import type {
  PublishedArtifactAccessEntry,
  PublishedArtifactAccessManifest
} from "./published-artifact-access.js";

// Keep this executable entry point free of runtime imports so Node can launch
// the source form with --experimental-strip-types. These wire constants are
// also exported by published-artifact-access.ts for the parent server.
const MAX_PUBLISHED_ARTIFACT_CHUNK_BYTES = 64 * 1024;
const PUBLISHED_ARTIFACT_MANIFEST_ENV =
  "SCIENCEEVOLVE_PUBLISHED_ARTIFACT_MANIFEST";
const READ_PUBLISHED_ARTIFACT_TOOL = "scienceevolve_read_published_artifact";
const PUBLISHED_ARTIFACT_SNAPSHOT_DIRECTORY = "published-artifacts";

type JsonRpcRequest = {
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
};

const appendRoot = process.env.SCIENCEEVOLVE_APPEND_ROOT;
const agentName = process.env.SCIENCEEVOLVE_AGENT_NAME;
const appendRecoveryGuard = process.env.SCIENCEEVOLVE_APPEND_RECOVERY_GUARD === "1";
const publishedArtifactManifestPath =
  process.env[PUBLISHED_ARTIFACT_MANIFEST_ENV];

const legacyFileTools = process.env.SCIENCEEVOLVE_LEGACY_FILE_TOOLS === "1";
const APPEND_FILE_TOOL = "scienceevolve_append_file";
const READ_INVOCATION_INPUT_TOOL = "scienceevolve_read_invocation_input";
const invocationId = process.env.SCIENCEEVOLVE_INVOCATION_ID;
const invocationInputAvailable = Boolean(appendRoot && agentName !== "probe" &&
  invocationId && /^[A-Za-z0-9][A-Za-z0-9._-]{0,159}$/.test(invocationId));
const READ_SMOKE_SENTINEL_TOOL = "scienceevolve_read_smoke_sentinel";
const SMOKE_SENTINEL_FILENAME = "openfars-smoke-sentinel.txt";
const MAX_SMOKE_SENTINEL_BYTES = 4_096;
const MAX_APPEND_CONTENT_LENGTH = 50_000;
const MAX_APPEND_PATH_LENGTH = 4_096;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

class RequestCancelledError extends Error {
  override name = "RequestCancelledError";
}


function response(id: JsonRpcRequest["id"], result: unknown): void {
  process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id, result })}\n`);
}

function error(id: JsonRpcRequest["id"], code: number, message: string): void {
  process.stdout.write(
    `${JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } })}\n`
  );
}

function normalizeAppendPath(input: string): string {
  const clean = input.replaceAll("\\", "/").trim();
  if (
    !clean ||
    clean.length > MAX_APPEND_PATH_LENGTH ||
    clean.includes("\0") ||
    path.posix.isAbsolute(clean)
  ) {
    throw new Error("path must be a non-empty relative workspace path");
  }
  const parts = clean.split("/");
  if (parts.some((part) => !part || part === "." || part === ".." || part.startsWith("."))) {
    throw new Error("path contains an invalid or hidden component");
  }
  const normalized = path.posix.normalize(clean);
  if (normalized === "." || normalized.startsWith("../") || normalized.includes("/../")) {
    throw new Error("path traversal is not allowed");
  }
  return normalized;
}

function pathIsWithin(candidate: string, root: string): boolean {
  const relative = path.relative(root, candidate);
  return (
    relative === "" ||
    (!relative.startsWith(`..${path.sep}`) &&
      relative !== ".." &&
      !path.isAbsolute(relative))
  );
}

let appendQueue: Promise<void> = Promise.resolve();

function assertNotCancelled(isCancelled: () => boolean): void {
  if (isCancelled()) throw new RequestCancelledError("Request cancelled");
}

async function appendFile(
  relativePath: string,
  content: string,
  isCancelled: () => boolean
): Promise<void> {
  assertNotCancelled(isCancelled);
  if (!appendRoot) {
    throw new Error("SCIENCEEVOLVE_APPEND_ROOT is required for file appends");
  }
  const normalizedPath = normalizeAppendPath(relativePath);
  const root = await fs.realpath(appendRoot);
  const candidate = path.resolve(root, normalizedPath);
  if (!pathIsWithin(candidate, root)) {
    throw new Error("path resolves outside the project workspace");
  }

  const parent = path.dirname(candidate);
  await fs.mkdir(parent, { recursive: true });
  const realParent = await fs.realpath(parent);
  if (!pathIsWithin(realParent, root)) {
    throw new Error("path parent resolves outside the project workspace");
  }
  let existingSize = 0;
  try {
    const existing = await fs.lstat(candidate);
    if (existing.isSymbolicLink() || !existing.isFile()) {
      throw new Error("append target must be a regular file");
    }
    existingSize = existing.size;
  } catch (caught) {
    if ((caught as NodeJS.ErrnoException).code !== "ENOENT") throw caught;
  }

  const isMemory = path.basename(candidate).toLowerCase() === "memory.md";
  if (existingSize > 0 && !isMemory) {
    if (appendRecoveryGuard) {
      throw new Error(
        "recovery guard refused to append an existing non-empty file; use an explicitly authorized versioned path"
      );
    }
    if (/^#\s+\S/m.test(content)) {
      const existingContent = await fs.readFile(candidate, "utf8");
      if (/^#\s+\S/m.test(existingContent)) {
        throw new Error(
          "refused to append a second Markdown H1 document to an existing file"
        );
      }
    }
  }

  // Cancellation is best-effort once the filesystem syscall begins. Check at
  // the final mutation boundary so a queued or preflight-cancelled request
  // cannot append any bytes.
  assertNotCancelled(isCancelled);
  await fs.appendFile(candidate, content, {
    encoding: "utf8",
    flag: "a",
    mode: 0o600
  });
}

function appendFileSerial(
  relativePath: string,
  content: string,
  isCancelled: () => boolean
): Promise<void> {
  const operation = appendQueue.then(() => appendFile(relativePath, content, isCancelled));
  appendQueue = operation.catch(() => {});
  return operation;
}

async function readSmokeSentinel(isCancelled: () => boolean): Promise<string> {
  assertNotCancelled(isCancelled);
  if (agentName !== "probe" || !appendRoot) {
    throw new Error("smoke sentinel reads are only available during a Harness probe");
  }
  const root = await fs.realpath(appendRoot);
  const candidate = path.join(root, SMOKE_SENTINEL_FILENAME);
  const stat = await fs.lstat(candidate);
  if (stat.isSymbolicLink() || !stat.isFile()) {
    throw new Error("smoke sentinel must be a regular file");
  }
  if (stat.size > MAX_SMOKE_SENTINEL_BYTES) {
    throw new Error("smoke sentinel is too large");
  }
  assertNotCancelled(isCancelled);
  return fs.readFile(candidate, "utf8");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function validPublishedArtifactEntry(
  value: unknown
): value is PublishedArtifactAccessEntry {
  if (!isRecord(value)) return false;
  return [
    "id",
    "agent",
    "path",
    "title",
    "kind",
    "description",
    "mediaType",
    "workspaceRoot",
    "sourcePath"
  ].every((key) => typeof value[key] === "string") &&
    typeof value.size === "number" &&
    Number.isSafeInteger(value.size) &&
    value.size >= 0 &&
    typeof value.sha256 === "string" &&
    SHA256_PATTERN.test(value.sha256);
}

async function loadPublishedArtifactManifest(): Promise<PublishedArtifactAccessManifest> {
  if (!publishedArtifactManifestPath || !path.isAbsolute(publishedArtifactManifestPath)) {
    throw new Error("published artifact manifest is unavailable");
  }
  if (path.basename(publishedArtifactManifestPath) !== "published-artifacts.json") {
    throw new Error("published artifact manifest path is invalid");
  }
  const manifestStat = await fs.lstat(publishedArtifactManifestPath);
  if (manifestStat.isSymbolicLink() || !manifestStat.isFile()) {
    throw new Error("published artifact manifest must be a regular file");
  }
  const parsed = JSON.parse(
    await fs.readFile(publishedArtifactManifestPath, "utf8")
  ) as unknown;
  if (
    !isRecord(parsed) ||
    parsed.schemaVersion !== 1 ||
    typeof parsed.projectId !== "string" ||
    typeof parsed.invocationId !== "string" ||
    typeof parsed.createdAt !== "string" ||
    !Array.isArray(parsed.artifacts) ||
    !parsed.artifacts.every(validPublishedArtifactEntry) ||
    typeof process.env.SCIENCEEVOLVE_PROJECT_ID !== "string" ||
    parsed.projectId !== process.env.SCIENCEEVOLVE_PROJECT_ID ||
    typeof process.env.SCIENCEEVOLVE_INVOCATION_ID !== "string" ||
    parsed.invocationId !== process.env.SCIENCEEVOLVE_INVOCATION_ID
  ) {
    throw new Error("published artifact manifest is invalid for this invocation");
  }
  return parsed as unknown as PublishedArtifactAccessManifest;
}

async function publishedArtifactToolAvailable(): Promise<boolean> {
  try {
    await loadPublishedArtifactManifest();
    return true;
  } catch {
    return false;
  }
}

function textualMediaType(mediaType: string): boolean {
  return mediaType.startsWith("text/") ||
    /^(?:application\/(?:json|ld\+json|xml|yaml|javascript|x-javascript))$/i.test(mediaType);
}

function nextUtf8Boundary(buffer: Buffer, proposedEnd: number): number {
  if (proposedEnd >= buffer.length) return buffer.length;
  let end = proposedEnd;
  while (end > 0 && (buffer[end]! & 0xc0) === 0x80) end -= 1;
  return end;
}

function isUtf8Boundary(buffer: Buffer, offset: number): boolean {
  return offset === 0 || offset === buffer.length ||
    (buffer[offset]! & 0xc0) !== 0x80;
}

// Exactly two server-staged inputs. This is not a general filesystem reader:
// no model-supplied path, other invocation, native profile or host directory.
async function readInvocationInput(input: "inbox" | "memory", offset: number, limit: number,
  isCancelled: () => boolean): Promise<Record<string, unknown>> {
  assertNotCancelled(isCancelled);
  if (!invocationInputAvailable) throw new Error("invocation inputs are unavailable");
  const root = await fs.realpath(appendRoot!);
  const parts = input === "inbox" ? [".scienceevolve", "inbox", `${invocationId}.md`] : ["Memory.md"];
  let candidate = root;
  for (const [index, part] of parts.entries()) {
    candidate = path.join(candidate, part);
    const stat = await fs.lstat(candidate);
    if (stat.isSymbolicLink() || (index < parts.length - 1 ? !stat.isDirectory() : !stat.isFile()) ||
        await fs.realpath(candidate) !== candidate) throw new Error("invocation input must not traverse links");
  }
  const declared = await fs.lstat(candidate);
  const file = await fs.open(candidate, fsConstants.O_RDONLY | (fsConstants.O_NOFOLLOW ?? 0));
  try {
    const before = await file.stat();
    if (!before.isFile() || before.nlink !== 1 || before.dev !== declared.dev || before.ino !== declared.ino ||
        before.size > 32 * 1024 * 1024 || offset > before.size) throw new Error("invalid invocation input identity or size");
    const buffer = Buffer.alloc(Math.min(limit + 4, before.size - offset));
    const { bytesRead } = await file.read(buffer, 0, buffer.length, offset);
    const bytes = buffer.subarray(0, bytesRead);
    if (!isUtf8Boundary(bytes, 0) || (bytes.length && (bytes[0]! & 0xc0) === 0x80)) throw new Error("offset must be a UTF-8 boundary");
    const end = nextUtf8Boundary(bytes, Math.min(limit, bytes.length));
    if (end === 0 && offset < before.size) throw new Error("limit must include a complete UTF-8 character");
    const after = await file.stat(), current = await fs.lstat(candidate);
    if (after.size !== before.size || after.mtimeMs !== before.mtimeMs || current.isSymbolicLink() ||
        current.dev !== before.dev || current.ino !== before.ino || current.nlink !== 1 ||
        await fs.realpath(candidate) !== candidate) throw new Error("invocation input changed during read");
    assertNotCancelled(isCancelled);
    return { input, invocationId, totalSize: before.size, offset, length: end, nextOffset: offset + end,
      hasMore: offset + end < before.size, encoding: "utf8", content: bytes.subarray(0, end).toString("utf8") };
  } finally { await file.close(); }
}

async function readPublishedArtifact(
  artifactId: string,
  offset: number,
  limit: number,
  isCancelled: () => boolean
): Promise<Record<string, unknown>> {
  assertNotCancelled(isCancelled);
  const manifest = await loadPublishedArtifactManifest();
  const artifact = manifest.artifacts.find((item) => item.id === artifactId);
  if (!artifact) {
    throw new Error("artifactId is not present in this project's published catalog");
  }
  const manifestRoot = await fs.realpath(path.dirname(publishedArtifactManifestPath!));
  const realRoot = await fs.realpath(
    path.join(manifestRoot, PUBLISHED_ARTIFACT_SNAPSHOT_DIRECTORY)
  );
  const declaredRoot = await fs.realpath(artifact.workspaceRoot);
  if (declaredRoot !== realRoot) {
    throw new Error("published artifact authority root is invalid");
  }
  const sourceStat = await fs.lstat(artifact.sourcePath);
  if (sourceStat.isSymbolicLink() || !sourceStat.isFile()) {
    throw new Error("published artifact snapshot is not a regular file");
  }
  const realSource = await fs.realpath(artifact.sourcePath);
  if (!pathIsWithin(realSource, realRoot)) {
    throw new Error("published artifact resolves outside its invocation snapshot");
  }
  const stat = await fs.lstat(realSource);
  if (!stat.isFile()) {
    throw new Error("published artifact snapshot is not a regular file");
  }
  const content = await fs.readFile(realSource);
  const sha256 = createHash("sha256").update(content).digest("hex");
  if (content.length !== artifact.size || sha256 !== artifact.sha256) {
    throw new Error(
      "published artifact changed after publication; ask its producer to publish a new version"
    );
  }
  if (offset > content.length) {
    throw new Error("offset is beyond the published artifact size");
  }
  if (textualMediaType(artifact.mediaType) && !isUtf8Boundary(content, offset)) {
    throw new Error("offset must point to a UTF-8 character boundary");
  }
  assertNotCancelled(isCancelled);
  const requestedEnd = Math.min(content.length, offset + limit);
  const end = textualMediaType(artifact.mediaType)
    ? nextUtf8Boundary(content, requestedEnd)
    : requestedEnd;
  if (end === offset && offset < content.length) {
    throw new Error("limit is too small to include one complete UTF-8 character");
  }
  const safeEnd = end;
  const chunk = content.subarray(offset, safeEnd);
  return {
    artifact: {
      id: artifact.id,
      producer: artifact.agent,
      path: artifact.path,
      title: artifact.title,
      kind: artifact.kind,
      description: artifact.description,
      mediaType: artifact.mediaType,
      sha256: artifact.sha256,
      registeredAt: artifact.registeredAt ?? null
    },
    totalSize: content.length,
    offset,
    length: chunk.length,
    nextOffset: safeEnd,
    hasMore: safeEnd < content.length,
    encoding: textualMediaType(artifact.mediaType) ? "utf8" : "base64",
    content: textualMediaType(artifact.mediaType)
      ? chunk.toString("utf8")
      : chunk.toString("base64")
  };
}

async function handle(
  request: JsonRpcRequest,
  isCancelled: () => boolean = () => false
): Promise<void> {
  if (request.id === undefined || !request.method) return;
  if (request.method === "initialize") {
    response(request.id, {
      protocolVersion: "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: { name: "scienceevolve-workspace", version: "1.0.0" }
    });
    return;
  }
  if (request.method === "tools/list") {
    const artifactReadAvailable = await publishedArtifactToolAvailable();
    const tools = [{
        name: APPEND_FILE_TOOL,
        annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
        description:
          "Append content verbatim to a file in the common project workspace. The path is relative to that workspace; existing content is never replaced. A second Markdown H1 document is rejected; recovery mode also rejects appending any existing non-empty file other than Memory.md.",
        inputSchema: {
          type: "object",
          additionalProperties: false,
          required: ["path", "content"],
          properties: {
            path: { type: "string", minLength: 1, maxLength: MAX_APPEND_PATH_LENGTH },
            content: { type: "string", minLength: 1, maxLength: MAX_APPEND_CONTENT_LENGTH }
          }
        }
      }, ...(artifactReadAvailable ? [{
      name: READ_PUBLISHED_ARTIFACT_TOOL,
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
      description:
        "Read one formally published artifact from the current project by its catalog artifactId. Reads are integrity-checked and chunked; unpublished files and filesystem paths are not accepted.",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["artifactId"],
        properties: {
          artifactId: { type: "string", minLength: 1, maxLength: 4_096 },
          offset: { type: "integer", minimum: 0, default: 0 },
          limit: {
            type: "integer",
            minimum: 1,
            maximum: MAX_PUBLISHED_ARTIFACT_CHUNK_BYTES,
            default: 16_384
          }
        }
      }
    }] : []), ...(invocationInputAvailable ? [{
      name: READ_INVOCATION_INPUT_TOOL,
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
      description: "Read this invocation's server-staged Inbox or persistent Memory.md in bounded UTF-8 chunks. No filesystem path is accepted; use nextOffset until hasMore=false.",
      inputSchema: { type: "object", additionalProperties: false, required: ["input"], properties: {
        input: { enum: ["inbox", "memory"] }, offset: { type: "integer", minimum: 0, default: 0 },
        limit: { type: "integer", minimum: 1, maximum: MAX_PUBLISHED_ARTIFACT_CHUNK_BYTES, default: 16_384 }
      } }
    }] : []), ...(agentName === "probe" ? [{
      name: READ_SMOKE_SENTINEL_TOOL,
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
      description:
        "Read the fixed OpenFARS Harness smoke sentinel. This no-argument, read-only tool is available only during a smoke probe.",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {}
      }
    }] : [])];
    response(request.id, { tools: tools.filter(tool => legacyFileTools || ![APPEND_FILE_TOOL, READ_INVOCATION_INPUT_TOOL].includes(tool.name)) });
    return;
  }
  if (request.method !== "tools/call") {
    error(request.id, -32601, `Unsupported method: ${request.method}`);
    return;
  }
  const params = request.params ?? {};
  const name = typeof params.name === "string" ? params.name : "";
  const args =
    params.arguments && typeof params.arguments === "object"
      ? (params.arguments as Record<string, unknown>)
      : {};
  if (!legacyFileTools && [APPEND_FILE_TOOL, READ_INVOCATION_INPUT_TOOL].includes(name)) { error(request.id, -32601, `Unknown tool: ${name}. Use native file tools.`); return; }
  if (name === READ_INVOCATION_INPUT_TOOL) {
    if (!invocationInputAvailable) { error(request.id, -32601, `Unknown tool: ${name}`); return; }
    const offset = args.offset ?? 0, limit = args.limit ?? 16_384;
    if (Object.keys(args).some((key) => !["input", "offset", "limit"].includes(key)) ||
        !["inbox", "memory"].includes(args.input as string) || !Number.isSafeInteger(offset) ||
        (offset as number) < 0 || !Number.isSafeInteger(limit) || (limit as number) < 1 ||
        (limit as number) > MAX_PUBLISHED_ARTIFACT_CHUNK_BYTES) {
      error(request.id, -32602, "input, offset, or limit is invalid"); return;
    }
    try {
      const result = await readInvocationInput(args.input as "inbox" | "memory", offset as number, limit as number, isCancelled);
      response(request.id, { content: [{ type: "text", text: JSON.stringify(result) }] });
    } catch (caught) {
      error(request.id, caught instanceof RequestCancelledError ? -32800 : -32000,
        caught instanceof RequestCancelledError ? "Request cancelled" : "Unable to read invocation input safely");
    }
    return;
  }
  if (name === READ_PUBLISHED_ARTIFACT_TOOL) {
    const artifactId = typeof args.artifactId === "string"
      ? args.artifactId.trim()
      : "";
    const offset = args.offset === undefined ? 0 : args.offset;
    const limit = args.limit === undefined ? 16_384 : args.limit;
    if (
      !artifactId ||
      artifactId.length > 4_096 ||
      !Number.isSafeInteger(offset) ||
      (offset as number) < 0 ||
      !Number.isSafeInteger(limit) ||
      (limit as number) < 1 ||
      (limit as number) > MAX_PUBLISHED_ARTIFACT_CHUNK_BYTES
    ) {
      error(request.id, -32602, "artifactId, offset, or limit is invalid");
      return;
    }
    try {
      const result = await readPublishedArtifact(
        artifactId,
        offset as number,
        limit as number,
        isCancelled
      );
      response(request.id, {
        content: [{ type: "text", text: JSON.stringify(result) }]
      });
    } catch (caught) {
      if (caught instanceof RequestCancelledError) {
        error(request.id, -32800, caught.message);
        return;
      }
      error(
        request.id,
        -32000,
        `Unable to read published artifact: ${caught instanceof Error ? caught.message : String(caught)}`
      );
    }
    return;
  }
  if (name === READ_SMOKE_SENTINEL_TOOL) {
    if (agentName !== "probe" || !appendRoot) {
      error(request.id, -32601, `Unknown tool: ${name}`);
      return;
    }
    if (Object.keys(args).length > 0) {
      error(request.id, -32602, `${READ_SMOKE_SENTINEL_TOOL} accepts no arguments`);
      return;
    }
    try {
      const content = await readSmokeSentinel(isCancelled);
      response(request.id, { content: [{ type: "text", text: content }] });
    } catch (caught) {
      if (caught instanceof RequestCancelledError) {
        error(request.id, -32800, caught.message);
        return;
      }
      error(request.id, -32000, `Unable to read smoke sentinel: ${String(caught)}`);
    }
    return;
  }
  if (name === APPEND_FILE_TOOL) {
    const relativePath = typeof args.path === "string" ? args.path : "";
    const content = typeof args.content === "string" ? args.content : "";
    if (!relativePath.trim()) {
      error(request.id, -32602, "path is required");
      return;
    }
    if (!content) {
      error(request.id, -32602, "content is required");
      return;
    }
    if (content.length > MAX_APPEND_CONTENT_LENGTH) {
      error(request.id, -32602, "content is too long");
      return;
    }
    try {
      normalizeAppendPath(relativePath);
    } catch (caught) {
      error(request.id, -32602, String(caught instanceof Error ? caught.message : caught));
      return;
    }
    try {
      assertNotCancelled(isCancelled);
      await appendFileSerial(relativePath, content, isCancelled);
    } catch (caught) {
      if (caught instanceof RequestCancelledError) {
        error(request.id, -32800, caught.message);
        return;
      }
      error(request.id, -32000, `Unable to append workspace file: ${String(caught)}`);
      return;
    }
    response(request.id, {
      content: [
        {
          type: "text",
          text: `Content was appended to ${normalizeAppendPath(relativePath)}.`
        }
      ]
    });
    return;
  }
    error(request.id, -32602, `Unknown tool: ${name}`);
}

const input = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
// Keep the stdio MCP server alive exactly while its parent keeps stdin open.
// Some Node/container combinations do not retain the event-loop reference for
// an idle piped stdin, so relying on resume() alone can exit before Codex sends
// the first JSON-RPC request.
const stdinKeepAlive = setInterval(() => {}, 60_000);
let requestQueue: Promise<void> = Promise.resolve();
const pendingRequestIds = new Set<string>();
const cancelledRequestIds = new Set<string>();

function requestKey(value: unknown): string | undefined {
  return typeof value === "string" || typeof value === "number"
    ? `${typeof value}:${String(value)}`
    : undefined;
}

input.on("line", (line) => {
  let request: JsonRpcRequest;
  try {
    request = JSON.parse(line) as JsonRpcRequest;
  } catch (caught) {
    requestQueue = requestQueue.then(() => {
      process.stderr.write(`${caught instanceof Error ? caught.message : String(caught)}\n`);
    });
    return;
  }
  if (request.method === "notifications/cancelled") {
    const key = requestKey(request.params?.requestId);
    if (key && pendingRequestIds.has(key)) cancelledRequestIds.add(key);
    return;
  }
  const key = requestKey(request.id);
  if (key) pendingRequestIds.add(key);
  requestQueue = requestQueue.then(async () => {
    try {
      await handle(request, () => Boolean(key && cancelledRequestIds.has(key)));
    } catch (caught) {
      process.stderr.write(`${caught instanceof Error ? caught.message : String(caught)}\n`);
    } finally {
      if (key) {
        pendingRequestIds.delete(key);
        cancelledRequestIds.delete(key);
      }
    }
  });
});
input.once("close", () => {
  void requestQueue.finally(() => clearInterval(stdinKeepAlive));
});
