import { createHash, randomUUID } from "node:crypto";
import { constants as fsConstants, promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { zstdDecompress } from "node:zlib";
import type { AgentRunResult } from "../../types.js";
import type {
  HarnessAdapter,
  HarnessAdapterContext,
  HarnessAdapterRequest,
  InvocationInputs,
  ProcessExit,
  SessionRef
} from "../contracts.js";
import {
  HarnessEventStreamError,
  HarnessRuntimeError,
  SessionResumeError
} from "../errors.js";
import { OfficialEventBridge } from "../official-event-bridge.js";
import type { OfficialEventMapper } from "../official-event-bridge.js";
import {
  boundedUtf8Suffix,
  DEFAULT_RAW_LOG_LIMIT_BYTES,
  type ManagedProcess
} from "../process-host.js";
import { BUILTIN_HARNESS_DESCRIPTORS } from "../registry.js";
import {
  AdapterBase,
  adapterResult,
  gatewayModelContextWindow,
  harnessExecutableLaunch,
  prepareAdapterRuntime,
  safeName,
  settleAdapterCleanup,
  writeAdapterLogs,
  type AdapterMcpRow,
  type AdapterRuntimeOptions
} from "./adapter-utils.js";
import { dshOfficialEventMapper } from "./dsh-event-mapper.js";
import { NATIVE_PROCESS_SUPPORT_ENV } from "../native-processes.js";

const descriptor = BUILTIN_HARNESS_DESCRIPTORS.find((item) => item.id === "dsh")!;
const DEFAULT_DSH_HANDSHAKE_TIMEOUT_MS = 60_000;
const DEFAULT_DSH_TURN_IDLE_TIMEOUT_MS = 20 * 60_000;
const DSH_SERVER_NAME = "deepseek-harness-sdk-runtime";
const ZSTD_MAGIC = 0xfd2fb528;
const MAX_DSH_HEADER_FRAME_BYTES = 256 * 1024;
const MAX_DSH_HEADER_PLAINTEXT_BYTES = 64 * 1024;

export class DshAdapter extends AdapterBase implements HarnessAdapter {
  readonly resident = {
    protocol: "dsh-sdk-json-rpc",
    // The trusted SDK plugin loads the original persisted Agent session.
    // Lifecycle recovery must preserve that memory rather than replace it
    // with a system-authored transcript, including legacy workflow projects.
    recoveryStrategy: "native-session-resume",
    createOfficialEventMapper: dshResidentOfficialEventMapper
  } as const;

  constructor(options: AdapterRuntimeOptions = {}) {
    super(descriptor, options);
  }

  createSession(
    request: HarnessAdapterRequest,
    _inputs: InvocationInputs,
    generation: number,
    durable: boolean
  ): SessionRef {
    return this.session(
      `${request.project.id}-${safeName(request.agent)}-g${generation}-${randomUUID()}`,
      generation,
      durable
    );
  }

  sessionFromLegacyId(value: string, generation: number, durable: boolean): SessionRef | undefined {
    if (!value.startsWith("dsh:")) return undefined;
    const nativeId = value.slice("dsh:".length);
    return nativeId ? this.session(nativeId, generation, durable) : undefined;
  }

  sessionToLegacyId(session: SessionRef): string {
    return `dsh:${session.nativeId}`;
  }

  validateNativeSession(nativeId: string): boolean {
    return /^[A-Za-z0-9][A-Za-z0-9._:-]{0,511}$/.test(nativeId);
  }

  async run(context: HarnessAdapterContext): Promise<AgentRunResult> {
    if ("nativeCodexProfileHome" in context.route) throw new Error("DSH requires a Gateway route");
    const executable = await this.resolveExecutable();
    if (!executable) {
      throw new HarnessRuntimeError(
        "HARNESS_UNAVAILABLE",
        "Unable to find the dsh executable",
        { harnessId: this.descriptor.id },
        { source: "adapter" }
      );
    }
    const { request, spec } = context;
    const explainer = spec.purpose === "explainer";
    const handshakeTimeoutMs = positiveTimeout(
      this.options.dshHandshakeTimeoutMs,
      DEFAULT_DSH_HANDSHAKE_TIMEOUT_MS
    );
    const turnIdleTimeoutMs = positiveTimeout(
      this.options.dshTurnIdleTimeoutMs,
      DEFAULT_DSH_TURN_IDLE_TIMEOUT_MS
    );
    const runtime = await prepareAdapterRuntime(context, this.descriptor, this.options, {
      SCIENCEEVOLVE_WEB_SEARCH_ENABLED: !explainer && spec.policy.webSearch ? "1" : "0",
      DSH_PERMISSION_MODE: "danger-full-access"
    });
    runtime.environment.DSH_HOME = runtime.home;
    await prepareDshSettings(
      runtime.home,
      context.route.baseUrl,
      spec.model,
      gatewayModelContextWindow(request, spec.model)
    );
    const sessionRoot = path.join(runtime.home, "sessions");
    const sessionArtifact = dshSessionArtifactPath(
      runtime.home,
      spec.inputs.workspacePath,
      spec.session!.nativeId
    );
    if (spec.session!.durable && spec.session!.resumedAt) {
      try {
        await assertDshSessionArtifact({
          artifactPath: await resolveDshSessionArtifactPath(sessionArtifact),
          sessionRoot,
          expectedSessionId: spec.session!.nativeId,
          expectedWorkspacePath: spec.inputs.workspacePath
        });
      } catch (error) {
        throw new SessionResumeError(this.descriptor.id, spec.session!.nativeId, {
          cause: error instanceof Error ? error : undefined
        });
      }
    }
    const patchPath = path.join(spec.inputs.runtimePath, "dsh-openfars.patch.yml");

    let handoff: string | undefined;
    let managed: ManagedProcess | undefined;
    let exit: ProcessExit | undefined;
    let stderr = "";
    let bridgeFailure: HarnessEventStreamError | undefined;
    let invocationFailed = false;
    const bridge = new OfficialEventBridge({
      descriptor: this.descriptor,
      invocationId: spec.invocationId,
      mapEvent: dshOfficialEventMapper(spec.session!.nativeId),
      onActivity: request.onModelActivity,
      onNativeUserInput: context.onNativeUserInput,
      onFullAssistantMessage: (message) => {
        handoff = message;
      },
      onEvent: async (event) => {
        await context.onEvent(event);
      },
      onFatal: (error) => {
        bridgeFailure = error;
        managed?.terminate();
      }
    });
    const observer = new DshRpcObserver(spec.session!.nativeId);

    try {
      const policyPatch = explainer
        ? dshExplainerPatch(spec.inputs.workspacePath) + dshSelectedSkillsPatch([]) + (runtime.mcpRows.length ? dshMcpPatch(runtime.mcpRows, false) : "")
        : dshSelectedSkillsPatch([...spec.policy.skillPaths, ...spec.policy.autoSkillPaths]) + dshMcpPatch(runtime.mcpRows, spec.policy.webSearch);
      await fs.writeFile(patchPath, policyPatch + (spec.session!.durable
        ? dshNativeSdkPatch(executable, spec.session!.nativeId)
        : ""), {
        encoding: "utf8",
        mode: 0o600
      });
      managed = context.processHost.start({
        ...harnessExecutableLaunch(executable, ["--profile", "sdk", "--patch", path.join(runtime.home, "gateway.patch.yml"), "--patch", patchPath]),
        cwd: spec.inputs.workspacePath,
        env: runtime.environment,
        eventFormat: "json-rpc",
        session: spec.session!,
        rawLogLimitBytes: DEFAULT_RAW_LOG_LIMIT_BYTES,
        adapterEnvironmentKeys: ["DSH_HOME", "SCIENCEEVOLVE_WEB_SEARCH_ENABLED", "DSH_PERMISSION_MODE"]
      }, {
        onStdout: (chunk) => {
          observer.feed(chunk);
          bridge.feed(chunk);
        },
        onStderr: (chunk) => {
          stderr = boundedUtf8Suffix(stderr + chunk, DEFAULT_RAW_LOG_LIMIT_BYTES);
          return context.onTrace("stderr", chunk, {
            harness: this.descriptor.id,
            diagnostic: true,
            diagnosticSource: "cli"
          });
        }
      });
      await managed.write(rpcRequest(1, "initialize", {
        cwd: spec.inputs.workspacePath,
        provider: "openfars",
        model: spec.model
      }));
      assertInitializeResponse(await observer.response(1, managed, context.signal, handshakeTimeoutMs));
      let requestId = 2;
      if (spec.session!.resumedAt) {
        try {
          await managed.write(rpcRequest(requestId, "session/resume", {
            sessionId: spec.session!.nativeId
          }));
          observer.acceptResume(await observer.response(requestId++, managed, context.signal, handshakeTimeoutMs));
        } catch (error) {
          throw new SessionResumeError(this.descriptor.id, spec.session!.nativeId, {
            cause: error instanceof Error ? error : undefined
          });
        }
      }
      observer.beginPrompt();
      const prompt = spec.prompt;
      const nativePrompt = context.prepareNativeInput ? await context.prepareNativeInput(prompt) : prompt;
      await managed.write(rpcRequest(requestId, "session/prompt", {
        sessionId: spec.session!.nativeId,
        contentBlocks: [{ type: "text", text: nativePrompt }]
      }));
      assertPromptResponse(await observer.response(requestId++, managed, context.signal, handshakeTimeoutMs));
      await observer.whenTurnIdle(managed, context.signal, turnIdleTimeoutMs);
      await managed.write(rpcRequest(requestId, "shutdown"));
      assertShutdownResponse(await observer.response(requestId, managed, context.signal, handshakeTimeoutMs));
      await managed.end();
      exit = await managed.completed;
      await bridge.finish();
      if (exit.code !== 0) {
        throw new HarnessRuntimeError(
          "HARNESS_PROCESS_EXITED",
          `dsh SDK runtime exited with code ${exit.code ?? "null"}${exit.signal ? ` (${exit.signal})` : ""}`,
          {
            harnessId: this.descriptor.id,
            exitCode: exit.code,
            signal: exit.signal
          }
        );
      }
      if (spec.session!.durable) {
        try {
          await assertDshSessionArtifact({
            artifactPath: await resolveDshSessionArtifactPath(sessionArtifact),
            sessionRoot,
            expectedSessionId: spec.session!.nativeId,
            expectedWorkspacePath: spec.inputs.workspacePath
          });
        } catch (error) {
          if (spec.session!.resumedAt) {
            throw new SessionResumeError(this.descriptor.id, spec.session!.nativeId, {
              cause: error instanceof Error ? error : undefined
            });
          }
          throw new HarnessRuntimeError(
            "HARNESS_CONTRACT_VIOLATION",
            "dsh completed a durable invocation without materializing its session artifact",
            {
              harnessId: this.descriptor.id,
              sessionGeneration: spec.session!.generation
            },
            {
              source: "adapter",
              cause: error instanceof Error ? error : undefined
            }
          );
        }
      }
      try {
        return await adapterResult(request, spec.session!, handoff);
      } catch (error) {
        // A process killed during a turn can leave a durable DSH session with
        // a valid artifact but no completed natural-language handoff. Treat
        // that as a resume failure so the Facade allocates a fresh Session
        // instead of retrying the same half-completed native turn forever.
        if (
          spec.session!.resumedAt &&
          error instanceof HarnessRuntimeError &&
          error.code === "HARNESS_CONTRACT_VIOLATION" &&
          error.details.reason === "missing-natural-language-handoff"
        ) {
          throw new SessionResumeError(this.descriptor.id, spec.session!.nativeId, {
            cause: error
          });
        }
        throw error;
      }
    } catch (error) {
      invocationFailed = true;
      // A feed() failure is asynchronous to the JSON-RPC waiter. Prefer the
      // canonical bridge failure over the secondary "process exited" symptom.
      if (!bridgeFailure) {
        await bridge.drain().catch((failure: unknown) => {
          if (failure instanceof HarnessEventStreamError) bridgeFailure = failure;
        });
      }
      if (bridgeFailure) throw bridgeFailure;
      if (/plugin tree failed to load/i.test(stderr) && /invalid config/i.test(stderr)) {
        throw new HarnessRuntimeError("HARNESS_CONFIGURATION_INVALID", "DSH 插件配置校验失败，Agent 未能启动。请检查 MCP 配置后继续；详细诊断见本次调用的 dsh-stderr.log。",
          { harnessId: this.descriptor.id, reason: "dsh-plugin-config-invalid" }, { source: "adapter", cause: error });
      }
      if (error instanceof DshSessionIdentityError) {
        throw dshSessionIdentityError(this.descriptor.id, spec.session!, error);
      }
      if (error instanceof DshRpcResponseError) {
        throw new HarnessRuntimeError(
          "HARNESS_CONTRACT_VIOLATION",
          "dsh SDK request failed",
          {
            harnessId: this.descriptor.id,
            requestId: error.requestId,
            rpcCode: error.code
          },
          { source: "adapter", cause: error }
        );
      }
      throw error;
    } finally {
      await settleAdapterCleanup({
        harnessId: this.descriptor.id,
        invocationFailed,
        onTrace: context.onTrace,
        steps: [
          ...(managed ? [{
            phase: "process-terminate",
            cleanup: () => {
              if (managed!.child.exitCode === null && managed!.child.signalCode === null) {
                managed!.terminate();
              }
            }
          }, {
            phase: "process-wait",
            cleanup: async () => {
              exit ??= await managed!.completed;
            }
          }] : []),
          {
            phase: "write-adapter-logs",
            cleanup: () => writeAdapterLogs(
              spec.inputs,
              this.descriptor.id,
              "",
              exit?.stderr ?? stderr
            )
          },
          {
            phase: "remove-runtime-credential",
            cleanup: async () => {
              // The patch may contain MCP authorization headers. It lives only
              // for this process and is removed after process quiescence.
              await fs.rm(patchPath, { force: true });
            }
          }
        ]
      });
    }
  }

  async cleanupInterrupted(_invocationId: string, runtimePath: string): Promise<void> {
    // The common ProcessHost terminates the invocation before this hook runs.
    // Remove only DSH's fixed, invocation-local credential-bearing patch.
    await fs.rm(path.join(runtimePath, "dsh-openfars.patch.yml"), { force: true });
  }
}

function dshResidentOfficialEventMapper(): OfficialEventMapper {
  let mapper: OfficialEventMapper | undefined;
  return (frame) => {
    if (!mapper) {
      const params = plainRecord(frame.params);
      const sessionId = typeof params?.sessionId === "string"
        ? params.sessionId
        : undefined;
      if (!sessionId) return [];
      mapper = dshOfficialEventMapper(sessionId);
    }
    return mapper(frame);
  };
}

function plainRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

/**
 * Mirrors the path derivation shipped by DSH's JSONL persistence backend.
 * The ordinary `sdk` profile layers over dsh-base, whose persistence root is
 * `$DSH_HOME/sessions` and whose default encoding is Zstandard.
 */
export function dshSessionArtifactPath(
  dshHome: string,
  cwd: string,
  sessionId: string
): string {
  return path.join(
    dshHome,
    "sessions",
    dshProjectKey(cwd),
    dshEncodeSegment(sessionId),
    "session.jsonl.zstd"
  );
}

/** Current DSH uses immutable session.vN generations; old releases use v0. */
export async function resolveDshSessionArtifactPath(legacyPath: string): Promise<string> {
  const directory = path.dirname(legacyPath);
  let info;
  try { info = await fs.lstat(directory); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return legacyPath; throw error; }
  if (!info.isDirectory() || info.isSymbolicLink() || await fs.realpath(directory) !== path.resolve(directory)) {
    throw new Error("DSH session generation directory is not a pinned real directory");
  }
  const names = await fs.readdir(directory);
  if (names.length > 1000) throw new Error("Too many DSH session generation files");
  const versions = names.flatMap(name => {
    const match = /^session\.v([1-9][0-9]*)\.jsonl\.zstd$/.exec(name);
    return match && Number.isSafeInteger(Number(match[1])) ? [{ name, version: Number(match[1]) }] : [];
  }).sort((a, b) => b.version - a.version);
  return versions.length ? path.join(directory, versions[0].name) : legacyPath;
}

function dshEncodeSegment(raw: string): string {
  if (raw.length === 0) throw new Error("cannot encode an empty DSH session ID");
  if (raw === ".") return "~002E";
  if (raw === "..") return "~002E~002E";
  let encoded = "";
  for (let index = 0; index < raw.length; index += 1) {
    const code = raw.charCodeAt(index);
    const character = String.fromCharCode(code);
    encoded += character !== "~" && /^[A-Za-z0-9._-]$/.test(character)
      ? character
      : `~${code.toString(16).toUpperCase().padStart(4, "0")}`;
  }
  return encoded;
}

function dshProjectKey(cwd: string): string {
  if (cwd.length === 0) throw new Error("cannot encode an empty DSH project path");
  let readable = "";
  let separatorRun = false;
  for (let index = 0; index < cwd.length; index += 1) {
    const code = cwd.charCodeAt(index);
    const character = String.fromCharCode(code);
    if (character === "/" || character === "\\" || character === ":") {
      if (!separatorRun) readable += "-";
      separatorRun = true;
    } else if (character !== "~" && /^[A-Za-z0-9._-]$/.test(character)) {
      readable += character;
      separatorRun = false;
    } else {
      readable += `~${code.toString(16).toUpperCase().padStart(4, "0")}`;
      separatorRun = false;
    }
  }
  const slug = readable.replace(/^-+/, "") || "root";
  return `--${slug.slice(0, 251)}--`;
}

interface DshSessionArtifactExpectation {
  artifactPath: string;
  sessionRoot: string;
  expectedSessionId: string;
  expectedWorkspacePath: string;
}

export async function assertDshSessionArtifact(
  expectation: DshSessionArtifactExpectation
): Promise<void> {
  const { artifactPath, sessionRoot, expectedSessionId, expectedWorkspacePath } = expectation;
  const root = await fs.lstat(sessionRoot).catch((error: unknown) => {
    throw new Error("DSH durable session root is missing", {
      cause: error instanceof Error ? error : undefined
    });
  });
  if (root.isSymbolicLink() || !root.isDirectory()) {
    throw new Error("DSH durable session root is not a regular non-symlink directory");
  }
  const relative = path.relative(path.resolve(sessionRoot), path.resolve(artifactPath));
  if (!relative || relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error("DSH durable session artifact is outside the selected session root");
  }
  let cursor = path.resolve(sessionRoot);
  const segments = relative.split(path.sep);
  for (const [index, segment] of segments.entries()) {
    cursor = path.join(cursor, segment);
    const entry = await fs.lstat(cursor).catch((error: unknown) => {
      throw new Error("DSH durable session artifact is missing", {
        cause: error instanceof Error ? error : undefined
      });
    });
    if (entry.isSymbolicLink()) {
      throw new Error("DSH durable session path contains a symbolic link");
    }
    const final = index === segments.length - 1;
    if (final ? !entry.isFile() : !entry.isDirectory()) {
      throw new Error(final
        ? "DSH durable session artifact is not a regular file"
        : "DSH durable session path contains a non-directory component");
    }
  }
  const [realRoot, realArtifact] = await Promise.all([
    fs.realpath(sessionRoot),
    fs.realpath(artifactPath)
  ]);
  const realRelative = path.relative(realRoot, realArtifact);
  if (!realRelative || realRelative === ".." || realRelative.startsWith(`..${path.sep}`) || path.isAbsolute(realRelative)) {
    throw new Error("DSH durable session artifact resolves outside the selected session root");
  }
  const artifact = await fs.lstat(realArtifact).catch((error: unknown) => {
    throw new Error("DSH durable session artifact is missing", {
      cause: error instanceof Error ? error : undefined
    });
  });
  if (!artifact.isFile() || artifact.size < 8) {
    throw new Error("DSH durable session artifact is empty or not a regular file");
  }
  const handle = await fs.open(artifactPath, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW);
  try {
    const opened = await handle.stat();
    if (!opened.isFile() || opened.dev !== artifact.dev || opened.ino !== artifact.ino) {
      throw new Error("DSH durable session artifact changed during identity validation");
    }
    const capacity = Math.min(artifact.size, MAX_DSH_HEADER_FRAME_BYTES + 1);
    const buffer = Buffer.alloc(capacity);
    const { bytesRead } = await handle.read(buffer, 0, capacity, 0);
    const prefix = buffer.subarray(0, bytesRead);
    const frameEnd = firstZstdFrameEnd(prefix);
    if (frameEnd === undefined) {
      throw new Error(bytesRead > MAX_DSH_HEADER_FRAME_BYTES
        ? "DSH durable session header frame exceeds the supported size"
        : "DSH durable session artifact has an incomplete Zstandard header frame");
    }
    const plaintext = await decompressDshHeader(prefix.subarray(0, frameEnd));
    if (plaintext.length === 0 || plaintext.length > MAX_DSH_HEADER_PLAINTEXT_BYTES ||
      plaintext.at(-1) !== 0x0a || plaintext.indexOf(0x0a) !== plaintext.length - 1) {
      throw new Error("DSH durable session artifact has an invalid header frame");
    }
    let header: Record<string, unknown>;
    try {
      header = JSON.parse(plaintext.subarray(0, -1).toString("utf8")) as Record<string, unknown>;
    } catch (error) {
      throw new Error("DSH durable session artifact header is not valid JSON", {
        cause: error instanceof Error ? error : undefined
      });
    }
    const physicalVersion = /^session\.v([1-9][0-9]*)\.jsonl\.zstd$/.exec(path.basename(artifactPath));
    if (physicalVersion && header.version !== Number(physicalVersion[1])) throw new Error("DSH session generation header disagrees with its filename");
    if (header.type !== "session" || !Number.isSafeInteger(header.version) ||
      (header.version as number) < 0 || !Number.isSafeInteger(header.createdAt) ||
      (header.createdAt as number) < 0) {
      throw new Error("DSH durable session artifact has an invalid session header");
    }
    if (header.id !== expectedSessionId) {
      throw new Error("DSH durable session artifact belongs to a different session");
    }
    if (typeof header.cwd !== "string" ||
      path.resolve(header.cwd) !== path.resolve(expectedWorkspacePath)) {
      throw new Error("DSH durable session artifact belongs to a different workspace");
    }
  } finally {
    await handle.close();
  }
}

function firstZstdFrameEnd(buffer: Buffer): number | undefined {
  if (buffer.length < 4) return undefined;
  if (buffer.readUInt32LE(0) !== ZSTD_MAGIC) {
    throw new Error("DSH durable session artifact has invalid Zstandard frame magic");
  }
  let offset = 4;
  if (offset >= buffer.length) return undefined;
  const descriptor = buffer.readUInt8(offset++);
  if ((descriptor & 0x18) !== 0) {
    throw new Error("DSH durable session artifact has an invalid Zstandard frame header");
  }
  const contentSizeFlag = descriptor >>> 6;
  const singleSegment = (descriptor & 0x20) !== 0;
  const checksum = (descriptor & 0x04) !== 0;
  const dictionaryFlag = descriptor & 0x03;
  const dictionaryBytes = dictionaryFlag === 3 ? 4 : dictionaryFlag;
  const contentSizeBytes = contentSizeFlag === 0
    ? (singleSegment ? 1 : 0)
    : (1 << contentSizeFlag);
  const remainingHeaderBytes = (singleSegment ? 0 : 1) + dictionaryBytes + contentSizeBytes;
  if (buffer.length - offset < remainingHeaderBytes) return undefined;
  offset += remainingHeaderBytes;
  for (;;) {
    if (buffer.length - offset < 3) return undefined;
    const blockHeader = buffer.readUIntLE(offset, 3);
    offset += 3;
    const finalBlock = (blockHeader & 1) !== 0;
    const blockType = (blockHeader >>> 1) & 3;
    const blockSize = blockHeader >>> 3;
    if (blockType === 3) {
      throw new Error("DSH durable session artifact has an invalid Zstandard block type");
    }
    const payloadBytes = blockType === 1 ? 1 : blockSize;
    if (buffer.length - offset < payloadBytes) return undefined;
    offset += payloadBytes;
    if (finalBlock) break;
  }
  if (checksum) {
    if (buffer.length - offset < 4) return undefined;
    offset += 4;
  }
  return offset;
}

function decompressDshHeader(frame: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    zstdDecompress(frame, { maxOutputLength: MAX_DSH_HEADER_PLAINTEXT_BYTES + 1 },
      (error, result) => error ? reject(error) : resolve(result));
  });
}

class DshRpcObserver {
  private pendingText = "";
  private promptStarted = false;
  private runningSeen = false;
  private expectedSessionSeen = false;
  private readonly childSessionIds = new Set<string>();
  private readonly lastNativeSeq = new Map<string, number>();
  private readonly responses = new Map<number, Deferred<Record<string, unknown>>>();
  private readonly settledResponses = new Set<number>();
  private idle = deferred<void>();
  private lastActivityAt = Date.now();

  constructor(private readonly sessionId: string) {}

  beginPrompt(): void {
    this.runningSeen = false;
    this.expectedSessionSeen = false;
    this.idle = deferred<void>();
    this.promptStarted = true;
    this.lastActivityAt = Date.now();
  }

  acceptResume(frame: Record<string, unknown>): void {
    const result = isRecord(frame.result) ? frame.result : undefined;
    const lastSequence = result?.lastSequence;
    const observedSequence = this.lastNativeSeq.get(this.sessionId);
    if (result?.sessionId !== this.sessionId || !Number.isSafeInteger(lastSequence) ||
      (lastSequence as number) < -1 ||
      (observedSequence !== undefined && observedSequence > (lastSequence as number))) {
      throw new DshSessionIdentityError("DSH native resume returned an invalid session or sequence");
    }
    this.lastNativeSeq.set(this.sessionId, lastSequence as number);
  }

  feed(chunk: string): void {
    this.pendingText += chunk;
    const lines = this.pendingText.split(/\r?\n/);
    this.pendingText = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      let parsed: unknown;
      try { parsed = JSON.parse(line); } catch { continue; }
      if (!isRecord(parsed)) {
        throw new HarnessEventStreamError(descriptor.id, "DSH official frame is not a JSON object");
      }
      const frame = parsed;
      if (this.promptStarted) this.lastActivityAt = Date.now();
      if ((frame.id !== undefined || frame.method !== undefined) && frame.jsonrpc !== "2.0") {
        throw new HarnessEventStreamError(descriptor.id, "DSH official frame has an invalid JSON-RPC version");
      }
      if (typeof frame.id === "number") {
        if (this.settledResponses.has(frame.id)) {
          throw new HarnessEventStreamError(descriptor.id, "DSH replayed a JSON-RPC response ID");
        }
        this.settledResponses.add(frame.id);
        const waiter = this.responses.get(frame.id) ?? deferred<Record<string, unknown>>();
        this.responses.set(frame.id, waiter);
        if (frame.error) waiter.reject(dshRpcError(frame.id, frame.error));
        else waiter.resolve(frame);
      }
      if (frame.method === "subagent.started") {
        const params = isRecord(frame.params) ? frame.params : {};
        const parentSessionId = validIdentity(params.parentSessionId);
        const childSessionId = validIdentity(params.childSessionId);
        if (!parentSessionId || !childSessionId ||
          (parentSessionId !== this.sessionId && !this.childSessionIds.has(parentSessionId))) {
          throw new DshSessionIdentityError("DSH reported an invalid subagent session relationship");
        }
        this.childSessionIds.add(childSessionId);
      }
      if (frame.method === "session.event") {
        const params = isRecord(frame.params) ? frame.params : {};
        const nativeSessionId = validIdentity(params.sessionId);
        if (!nativeSessionId) {
          throw new DshSessionIdentityError("DSH session event omitted its native session identity");
        }
        if (this.promptStarted && nativeSessionId !== this.sessionId &&
          !this.childSessionIds.has(nativeSessionId)) {
          throw new DshSessionIdentityError("DSH emitted an event for an unexpected native session");
        }
        const event = isRecord(params.event) ? params.event : undefined;
        const rawNativeSeq = event?.seq;
        if (!Number.isSafeInteger(rawNativeSeq) || (rawNativeSeq as number) < 0) {
          throw new HarnessEventStreamError(descriptor.id, "DSH official event has no valid native sequence");
        }
        const nativeSeq = rawNativeSeq as number;
        const previous = this.lastNativeSeq.get(nativeSessionId);
        if (previous !== undefined && nativeSeq !== previous + 1) {
          throw new HarnessEventStreamError(
            descriptor.id,
            nativeSeq <= previous
              ? "DSH official event sequence replayed or regressed"
              : "DSH official event sequence contains a gap"
          );
        }
        this.lastNativeSeq.set(nativeSessionId, nativeSeq);
        if (nativeSessionId === this.sessionId) this.expectedSessionSeen = true;
      }
      if (frame.method === "session.status") {
        const params = isRecord(frame.params) ? frame.params : {};
        const nativeSessionId = validIdentity(params.sessionId);
        if (!nativeSessionId) {
          throw new DshSessionIdentityError("DSH session status omitted its native session identity");
        }
        if (this.promptStarted && nativeSessionId !== this.sessionId &&
          !this.childSessionIds.has(nativeSessionId)) {
          throw new DshSessionIdentityError("DSH reported status for an unexpected native session");
        }
        if (nativeSessionId !== this.sessionId) continue;
        this.expectedSessionSeen = true;
        if (params.status !== "running" && params.status !== "idle") {
          throw new HarnessEventStreamError(descriptor.id, "DSH official status is invalid");
        }
        if (params.status === "running") this.runningSeen = true;
        if (params.status === "idle" && this.runningSeen) this.idle.resolve();
      }
    }
  }

  response(
    id: number,
    process: ManagedProcess,
    signal: AbortSignal,
    timeoutMs: number
  ): Promise<Record<string, unknown>> {
    const waiter = this.responses.get(id) ?? deferred<Record<string, unknown>>();
    this.responses.set(id, waiter);
    return raceProcess(waiter.promise, process, signal, `DSH JSON-RPC response ${id}`, timeoutMs);
  }

  whenTurnIdle(process: ManagedProcess, signal: AbortSignal, timeoutMs: number): Promise<void> {
    return raceProcess(
      this.idle.promise,
      process,
      signal,
      "DSH session idle",
      timeoutMs,
      () => this.lastActivityAt
    ).then(() => {
      if (!this.expectedSessionSeen) {
        throw new DshSessionIdentityError("DSH never confirmed the requested native session");
      }
    });
  }
}

class DshSessionIdentityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DshSessionIdentityError";
  }
}

class DshRpcResponseError extends Error {
  constructor(
    readonly requestId: number,
    readonly code: number | undefined,
    readonly data: unknown,
    message: string
  ) {
    super(message);
    this.name = "DshRpcResponseError";
  }
}

async function raceProcess<T>(
  awaited: Promise<T>,
  process: ManagedProcess,
  signal: AbortSignal,
  label: string,
  timeoutMs: number,
  activityAt?: () => number
): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_, reject) => {
    const startedAt = Date.now();
    const check = () => {
      const baseline = activityAt?.() ?? startedAt;
      const elapsed = Math.max(0, Date.now() - baseline);
      const remaining = timeoutMs - elapsed;
      if (remaining <= 0) {
        reject(new HarnessRuntimeError(
          "INVOCATION_TIMED_OUT",
          activityAt
            ? "dsh SDK runtime exceeded its inactivity deadline"
            : "dsh SDK runtime exceeded its response deadline",
          {
            harnessId: descriptor.id,
            operation: label,
            timeoutMs,
            ...(activityAt ? { timeoutMode: "inactivity" } : {})
          },
          { source: "process" }
        ));
        return;
      }
      timer = setTimeout(check, remaining);
      timer.unref();
    };
    check();
  });
  const exited = process.completed.then((result) => {
    throw new HarnessRuntimeError(
      "HARNESS_PROCESS_EXITED",
      "dsh SDK runtime exited before completing its protocol exchange",
      {
        harnessId: descriptor.id,
        operation: label,
        exitCode: result.code,
        signal: result.signal
      },
      { source: "process" }
    );
  });
  const aborted = new Promise<never>((_, reject) => {
    const interrupted = () => new HarnessRuntimeError(
      "INVOCATION_INTERRUPTED",
      "dsh invocation was cancelled",
      { harnessId: descriptor.id },
      { source: "process" }
    );
    if (signal.aborted) reject(interrupted());
    else signal.addEventListener("abort", () => reject(interrupted()), { once: true });
  });
  try {
    return await Promise.race([awaited, exited, timeout, aborted]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function positiveTimeout(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) && value !== undefined && value > 0
    ? Math.floor(value)
    : fallback;
}

interface Deferred<T> {
  promise: Promise<T>;
  resolve(value: T): void;
  reject(error: Error): void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

function rpcRequest(id: number, method: string, params?: Record<string, unknown>): string {
  return `${JSON.stringify({ jsonrpc: "2.0", id, method, ...(params ? { params } : {}) })}\n`;
}

function dshRpcError(requestId: number, value: unknown): DshRpcResponseError {
  const error = isRecord(value) ? value : {};
  return new DshRpcResponseError(
    requestId,
    typeof error.code === "number" ? error.code : undefined,
    error.data,
    typeof error.message === "string" ? error.message : "DSH JSON-RPC request failed"
  );
}

function assertInitializeResponse(frame: Record<string, unknown>): void {
  const result = isRecord(frame.result) ? frame.result : undefined;
  const serverInfo = result && isRecord(result.serverInfo) ? result.serverInfo : undefined;
  if (serverInfo?.name !== DSH_SERVER_NAME ||
    typeof serverInfo.version !== "string" || !serverInfo.version.trim()) {
    throw new HarnessRuntimeError(
      "HARNESS_CONTRACT_VIOLATION",
      "dsh returned an invalid SDK initialize response",
      { harnessId: descriptor.id },
      { source: "adapter" }
    );
  }
}

function assertPromptResponse(frame: Record<string, unknown>): void {
  // DSH 0.1.2's official SessionPromptResult exposes only messageId. Native
  // session identity is therefore proven by session.status/session.event and
  // by the persistence header, never inferred from assistant/tool text.
  const result = isRecord(frame.result) ? frame.result : undefined;
  if (!result || !validIdentity(result.messageId)) {
    throw new HarnessRuntimeError(
      "HARNESS_CONTRACT_VIOLATION",
      "dsh returned an invalid durable prompt receipt",
      { harnessId: descriptor.id },
      { source: "adapter" }
    );
  }
}

function assertShutdownResponse(frame: Record<string, unknown>): void {
  if (!isRecord(frame.result)) {
    throw new HarnessRuntimeError(
      "HARNESS_CONTRACT_VIOLATION",
      "dsh returned an invalid SDK shutdown response",
      { harnessId: descriptor.id },
      { source: "adapter" }
    );
  }
}

function dshSessionIdentityError(
  harnessId: string,
  session: SessionRef,
  cause: DshSessionIdentityError
): HarnessRuntimeError {
  if (session.resumedAt) {
    return new SessionResumeError(harnessId, session.nativeId, { cause });
  }
  return new HarnessRuntimeError(
    "HARNESS_CONTRACT_VIOLATION",
    "dsh did not confirm the requested native Session identity",
    { harnessId, sessionGeneration: session.generation },
    { source: "adapter", cause }
  );
}

function validIdentity(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const identity = value.trim();
  return identity && !/[\0\r\n]/.test(identity) ? identity : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export async function prepareDshSettings(
  home: string,
  baseUrl: string,
  model: string,
  contextWindow: number
): Promise<void> {
  const content = [
    "llm-pi-ai:", "  providers:", "    openfars:",
    "      displayName: OpenFARS selected gateway",
    "      apiKeyEnv: SCIENCEEVOLVE_GATEWAY_API_KEY",
    "      api: openai-completions",
    `      baseURL: ${JSON.stringify(baseUrl)}`,
    "      compat:",
    "        supportsReasoningEffort: false",
    "        supportsDeveloperRole: false",
    "      models:",
    `        - id: ${JSON.stringify(model)}`,
    `          name: ${JSON.stringify(model)}`,
    `          contextWindow: ${contextWindow}`,
    "agent-default-model:",
    "  provider: openfars",
    `  model: ${JSON.stringify(model)}`,
    ""
  ].join("\n");
  await fs.writeFile(path.join(home, "settings.yaml"), content, { encoding: "utf8", mode: 0o600 });
  // Current DSH persists model routes in the profile patch, not settings.yaml.
  // Keep the legacy file for older releases, but mount the selected route
  // explicitly in this invocation's private profile; credentials remain env refs.
  const patch = "- id: llm-pi-ai\n  config:\n" + content.split("agent-default-model:")[0]
    .split("\n").slice(1).filter(Boolean).map(line => `  ${line}`).join("\n") + "\n" +
    `- id: agent-default-model\n  config:\n    provider: openfars\n    model: ${JSON.stringify(model)}\n`;
  await fs.writeFile(path.join(home, "gateway.patch.yml"), patch, { encoding: "utf8", mode: 0o600 });
}

export function dshNativeSessionPatch(executable: string, sessionId: string): string {
  return dshNativeSdkPatch(executable, sessionId);
}

/** The same native Agent resume API serves ordinary and resident invocations. */
export function dshNativeSdkPatch(executable: string, sessionId: string): string {
  return [
    "- id: sdk-jsonrpc-server",
    "  disabled: true",
    "- insert:",
    "    - id: openfars-dsh-native-sdk",
    `      name: ${JSON.stringify(fileURLToPath(new URL("../dsh-sdk-resume-plugin.mjs", import.meta.url)))}`,
    "      inject: [sdkAppStartup, loader]",
    "      config:",
    `        runtimeExecutable: ${JSON.stringify(executable)}`,
    `        sessionId: ${JSON.stringify(sessionId)}`
  ].join("\n") + "\n";
}

/** The installed MCP plugin limits serverName to 32 ASCII word characters.
 * Preserve valid namespaces and hash normalized names to avoid collisions. */
export function dshMcpServerName(namespace: string): string {
  if (/^[A-Za-z0-9_-]{1,32}$/.test(namespace)) return namespace;
  const prefix = namespace.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 19) || "mcp";
  return `${prefix}_${createHash("sha256").update(namespace).digest("hex").slice(0, 12)}`;
}

export function dshMcpPatch(
  rows: readonly AdapterMcpRow[],
  _webSearch: boolean
): string {
  const entries = rows.map((row, index) => {
    const common = [
      `    - id: openfars-mcp-${index}`,
      "      name: '@deepseek-ai/dsh-mcp-client'",
      "      config:",
      `        serverName: ${JSON.stringify(dshMcpServerName(row.namespace))}`,
      `        transport: ${row.transport}`
    ];
    if (row.transport === "stdio") {
      common.push(
        `        command: ${JSON.stringify(row.command)}`,
        `        args: [${row.args.map((item) => JSON.stringify(item)).join(", ")}]`,
        "        failOnStartupError: true",
        "        env:",
        ...Object.entries({ ...row.env, [NATIVE_PROCESS_SUPPORT_ENV]: "1" }).map(([key, value]) => `          ${key}: ${JSON.stringify(value)}`)
      );
    } else {
      common.push(
        `        url: ${JSON.stringify(row.url)}`,
        "        failOnStartupError: true",
        ...(!row.headers ? [] : [
          "        headers:",
          ...Object.entries(row.headers).map(([key, value]) => `          ${key}: ${JSON.stringify(value)}`)
        ])
      );
    }
    return common.join("\n");
  });
  const webTool = [
    "- id: tool-web",
    "  config:",
    // OpenFARS exposes invocation-scoped web_search/web_fetch through the
    // authenticated MCP row. Disable DSH's separate DeepSeek-only provider so
    // the UI switch does not require a second, Harness-specific credential.
    "    search: false",
    "    fetch: false"
  ].join("\n");
  return [webTool, ...(entries.length ? [`- insert:\n${entries.join("\n\n")}`] : [])]
    .join("\n\n") + "\n";
}

// The SDK profile layers over dsh-base. Disable every model-facing tool row
// from that profile for Project Explainer; the prompt carries its evidence.
const DSH_EXPLAINER_TOOL_ROWS = [
  "tool-bash", "tool-pwsh", "tool-jobs", "tool-fs", "tool-fs-search",
  "tool-skill", "tool-subagent-control", "tool-subagent-list-agents",
  "tool-subagent", "tool-subagent-fork", "tool-workflow", "tool-todo",
  "tool-goal", "tool-ralph", "tool-str-replace-editor", "tool-web"
] as const;

export function dshExplainerPatch(workspacePath: string): string {
  return `- id: sandbox-policy\n  config:\n    mode: danger-full-access\n    workspaceRoot: ${JSON.stringify(workspacePath)}\n`;
}

/** Isolated native provider: scan only this Agent's staged, selected roots. */
export function dshSelectedSkillsPatch(paths: readonly string[]): string {
  const roots = [...new Set(paths.map(file => path.dirname(path.dirname(file))))];
  return `- id: skill-filesystem\n  config:\n    includeDefaultRoots: false\n    watch: false\n    customSkillDirs: ${JSON.stringify(roots)}\n- id: skill-badge\n  disabled: true\n`;
}
