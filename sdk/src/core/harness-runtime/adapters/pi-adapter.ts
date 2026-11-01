import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { AgentRunResult } from "../../types.js";
import { FIXED_MCP_TOKEN_ENV_VAR } from "../../mcp-directory.js";
import type {
  HarnessAdapter,
  HarnessAdapterContext,
  HarnessAdapterRequest,
  InvocationInputs,
  ProcessExit,
  SessionRef
} from "../contracts.js";
import {
  HarnessRuntimeError,
  SessionResumeError
} from "../errors.js";
import { OfficialEventBridge } from "../official-event-bridge.js";
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
import { mapPiOfficialEvent } from "./pi-event-mapper.js";

const descriptor = BUILTIN_HARNESS_DESCRIPTORS.find((item) => item.id === "pi")!;

export class PiAdapter extends AdapterBase implements HarnessAdapter {
  readonly resident = {
    protocol: "pi-rpc",
    recoveryStrategy: "native-session-resume",
    createOfficialEventMapper: () => mapPiOfficialEvent
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
    const home = path.join(
      request.projectPath,
      "runtime",
      "harness-sessions",
      safeName(request.agent),
      "pi"
    );
    const nativeId = durable
      ? path.join(home, "sessions", `session-${generation}-${randomUUID()}.jsonl`)
      : `ephemeral:${request.invocationId}`;
    return this.session(nativeId, generation, durable);
  }

  sessionFromLegacyId(value: string, generation: number, durable: boolean): SessionRef | undefined {
    if (!value.startsWith("pi:")) return undefined;
    return this.session(value.slice("pi:".length), generation, durable);
  }

  sessionToLegacyId(session: SessionRef): string {
    return `pi:${session.nativeId}`;
  }

  validateNativeSession(nativeId: string): boolean {
    if (nativeId.startsWith("ephemeral:")) {
      return /^ephemeral:[^\0\r\n]+$/.test(nativeId);
    }
    return path.isAbsolute(nativeId) &&
      nativeId.endsWith(".jsonl") &&
      !/[\0\r\n]/.test(nativeId);
  }

  async run(context: HarnessAdapterContext): Promise<AgentRunResult> {
    if ("nativeCodexProfileHome" in context.route) throw new Error("Pi requires a Gateway route");
    const executable = await this.resolveExecutable();
    if (!executable) {
      throw new HarnessRuntimeError(
        "HARNESS_UNAVAILABLE",
        "Unable to find the pi executable",
        { harnessId: this.descriptor.id },
        { source: "adapter" }
      );
    }
    const { request, spec } = context;
    const runtime = await prepareAdapterRuntime(context, this.descriptor, this.options, {
      PI_CODING_AGENT_SESSION_DIR: path.join(
        request.projectPath,
        "runtime",
        "harness-sessions",
        safeName(request.agent),
        "pi",
        "sessions"
      ),
      SCIENCEEVOLVE_WEB_SEARCH_ENABLED: spec.policy.webSearch ? "1" : "0"
    });
    runtime.environment.PI_CODING_AGENT_DIR = runtime.home;
    runtime.environment.SCIENCEEVOLVE_PI_MCP_CONFIG = JSON.stringify(
      piMcpConfig(
        runtime.mcpRows,
        runtime.environment[FIXED_MCP_TOKEN_ENV_VAR],
        context.route.token
      )
    );
    await preparePiSettings(
      runtime.home,
      context.route.baseUrl,
      spec.model,
      gatewayModelContextWindow(request, spec.model)
    );
    const sessionRoot = path.join(runtime.home, "sessions");
    const resumedIdentity = spec.session?.durable && spec.session.resumedAt
      ? await readResumedPiSession(
          this.descriptor.id,
          spec.session.nativeId,
          sessionRoot,
          spec.inputs.workspacePath
        )
      : undefined;
    const explainer = spec.purpose === "explainer";
    const extension = explainer && !runtime.mcpRows.length ? undefined : await resolvePiExtension();
    const skills = [...new Set([...spec.policy.skillPaths, ...spec.policy.autoSkillPaths])];
    const prompt = spec.prompt;
    const args = [
      "--provider", "openfars",
      "--model", spec.model,
      "--mode", "json",
      "--print",
      ...(spec.session?.durable
        ? ["--session", spec.session.nativeId]
        : ["--no-session"]),
      "--no-extensions",
      ...(explainer
        ? [extension ? "--no-builtin-tools" : "--no-tools", "--no-skills", ...(extension ? ["--extension", extension] : [])]
        : ["--extension", extension!]),
      "--no-prompt-templates",
      "--no-context-files",
      ...(explainer ? [] : skills.flatMap((skill) => ["--skill", skill])),
      ...(context.prepareNativeInput ? [] : [prompt])
    ];
    let handoff: string | undefined;
    let officialSessionId: string | undefined;
    let managed: ManagedProcess | undefined;
    let exit: ProcessExit | undefined;
    let stderr = "";
    let invocationFailed = false;
    const bridge = new OfficialEventBridge({
      descriptor: this.descriptor,
      invocationId: spec.invocationId,
      mapEvent: (frame) => {
        if (frame.type === "session") {
          const rawSessionId = typeof frame.id === "string" ? frame.id : "";
          const sessionId = rawSessionId.trim();
          if (!sessionId || sessionId !== rawSessionId || /[\0\r\n]/.test(sessionId)) {
            throw sessionIdentityError(
              this.descriptor.id,
              spec.session!,
              "Pi official session event is missing a valid identity"
            );
          }
          if (officialSessionId && officialSessionId !== sessionId) {
            throw sessionIdentityError(
              this.descriptor.id,
              spec.session!,
              "Pi official session identity changed during one native attempt"
            );
          }
          if (resumedIdentity && resumedIdentity.id !== sessionId) {
            throw new SessionResumeError(this.descriptor.id, spec.session!.nativeId, {
              cause: new Error("Pi resumed a different native session identity")
            });
          }
          officialSessionId = sessionId;
        }
        const mapped = mapPiOfficialEvent(frame);
        if (mapped.length > 0 && !officialSessionId) {
          throw sessionIdentityError(
            this.descriptor.id,
            spec.session!,
            "Pi official stream emitted work before confirming its Session identity"
          );
        }
        return mapped;
      },
      onActivity: request.onModelActivity,
      onNativeUserInput: context.onNativeUserInput,
      onFullAssistantMessage: (message) => {
        handoff = message;
      },
      onEvent: async (event) => {
        await context.onEvent(event);
      },
      onFatal: () => managed?.terminate()
    });
    try {
      const nativePrompt = context.prepareNativeInput ? await context.prepareNativeInput(prompt) : undefined;
      managed = context.processHost.start({
        ...(nativePrompt !== undefined ? { stdin: nativePrompt } : {}),
        ...harnessExecutableLaunch(executable, args),
        cwd: spec.inputs.workspacePath,
        env: runtime.environment,
        eventFormat: "jsonl",
        session: spec.session!,
        rawLogLimitBytes: DEFAULT_RAW_LOG_LIMIT_BYTES,
        adapterEnvironmentKeys: [
          "PI_CODING_AGENT_SESSION_DIR",
          "PI_CODING_AGENT_DIR",
          "SCIENCEEVOLVE_WEB_SEARCH_ENABLED",
          "SCIENCEEVOLVE_PI_MCP_CONFIG"
        ]
      }, {
        onStdout: (chunk) => bridge.feed(chunk),
        onStderr: (chunk) => {
          stderr = boundedUtf8Suffix(stderr + chunk, DEFAULT_RAW_LOG_LIMIT_BYTES);
          return context.onTrace("stderr", chunk, {
            harness: this.descriptor.id,
            diagnostic: true,
            diagnosticSource: "cli"
          });
        }
      });
      await managed.end(nativePrompt);
      exit = await managed.completed;
      await bridge.finish();
      if (exit.code !== 0) {
        throw new HarnessRuntimeError(
          "HARNESS_PROCESS_EXITED",
          `pi exited with code ${exit.code ?? "null"}${exit.signal ? ` (${exit.signal})` : ""}`,
          {
            harnessId: this.descriptor.id,
            exitCode: exit.code,
            signal: exit.signal
          }
        );
      }
      if (!officialSessionId) {
        throw sessionIdentityError(
          this.descriptor.id,
          spec.session!,
          "Pi completed without an official session identity"
        );
      }
      if (resumedIdentity && resumedIdentity.id !== officialSessionId) {
        throw new SessionResumeError(this.descriptor.id, spec.session!.nativeId, {
          cause: new Error("Pi resumed a different native session identity")
        });
      }
      if (spec.session!.durable) {
        let persistedIdentity: PiSessionIdentity;
        try {
          persistedIdentity = await readPiSessionIdentity(
            spec.session!.nativeId,
            sessionRoot,
            spec.inputs.workspacePath
          );
        } catch (error) {
          throw sessionIdentityError(
            this.descriptor.id,
            spec.session!,
            "Pi did not persist a valid durable session",
            error
          );
        }
        if (persistedIdentity.id !== officialSessionId) {
          throw sessionIdentityError(
            this.descriptor.id,
            spec.session!,
            "Pi persisted session identity does not match its official event"
          );
        }
      }
      return await adapterResult(request, spec.session!, handoff);
    } catch (error) {
      invocationFailed = true;
      const identityError = error instanceof Error &&
        (error.cause instanceof SessionResumeError ||
          error.cause instanceof PiSessionIdentityContractError)
        ? error.cause
        : undefined;
      if (identityError) throw identityError;
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
          }
        ]
      });
    }
  }
}

const PI_MCP_INHERITED_ENV = new Set([
  "SCIENCEEVOLVE_PROJECT_ID",
  "SCIENCEEVOLVE_INVOCATION_ID",
  "SCIENCEEVOLVE_AGENT_NAME",
  "SCIENCEEVOLVE_APPEND_ROOT",
  "SCIENCEEVOLVE_CONTROL_CONTEXT",
  "SCIENCEEVOLVE_CONTROL_CAPABILITY",
  "SCIENCEEVOLVE_PUBLISHED_ARTIFACT_MANIFEST"
]);

/**
 * Pi receives only non-secret MCP metadata. Invocation authority and the fixed
 * MCP bearer stay in their dedicated, ProcessHost-validated environment keys
 * and are reattached by the extension at the last possible boundary.
 */
export function piMcpConfig(
  rows: readonly AdapterMcpRow[],
  fixedToken: string | undefined,
  routeToken?: string
): Array<Record<string, unknown>> {
  return rows.map((row) => {
    if (row.transport === "stdio") {
      const { env, ...definition } = row;
      const environmentKeys = Object.keys(env ?? {});
      if (environmentKeys.some((key) => !PI_MCP_INHERITED_ENV.has(key))) {
        throw new HarnessRuntimeError(
          "HARNESS_CONTRACT_VIOLATION",
          "Pi MCP bridge received an unsupported invocation environment key",
          { harnessId: descriptor.id },
          { source: "adapter" }
        );
      }
      return {
        ...definition,
        ...(environmentKeys.length ? { environmentKeys } : {})
      };
    }
    const { headers, ...definition } = row;
    if (!headers) return definition;
    const headerEntries = Object.entries(headers);
    const authorization = headerEntries.length === 1 &&
      headerEntries[0]?.[0] === "Authorization"
      ? headerEntries[0][1]
      : undefined;
    if (authorization === `Bearer ${fixedToken}` && fixedToken) {
      return { ...definition, fixedAuthorization: true };
    }
    if (authorization === `Bearer ${routeToken}` && routeToken && isLoopbackHttpUrl(row.url)) {
      return { ...definition, routeAuthorization: true };
    }
    throw new HarnessRuntimeError(
      "HARNESS_CONTRACT_VIOLATION",
      "Pi MCP bridge refused an unowned HTTP credential",
      { harnessId: descriptor.id },
      { source: "adapter" }
    );
  });
}

function isLoopbackHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" && url.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

interface PiSessionIdentity {
  id: string;
  cwd: string;
}

export async function readResumedPiSession(
  harnessId: string,
  sessionPath: string,
  sessionRoot: string,
  workspacePath: string
): Promise<PiSessionIdentity> {
  try {
    return await readPiSessionIdentity(sessionPath, sessionRoot, workspacePath);
  } catch (error) {
    throw new SessionResumeError(harnessId, sessionPath, {
      cause: error instanceof Error ? error : undefined
    });
  }
}

async function readPiSessionIdentity(
  sessionPath: string,
  sessionRoot: string,
  workspacePath: string
): Promise<PiSessionIdentity> {
  const metadata = await fs.lstat(sessionPath);
  if (metadata.isSymbolicLink() || !metadata.isFile()) {
    throw new Error("Pi session artifact must be a regular non-symlink file");
  }
  const [realRoot, realSession] = await Promise.all([
    fs.realpath(sessionRoot),
    fs.realpath(sessionPath)
  ]);
  const relative = path.relative(realRoot, realSession);
  if (!relative || relative.startsWith(`..${path.sep}`) || relative === ".." || path.isAbsolute(relative)) {
    throw new Error("Pi session artifact is outside the selected Agent session root");
  }
  const handle = await fs.open(realSession, "r");
  try {
    const buffer = Buffer.alloc(65_536);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    const prefix = buffer.subarray(0, bytesRead).toString("utf8");
    const newline = prefix.indexOf("\n");
    if (newline < 0 && bytesRead === buffer.length) {
      throw new Error("Pi session header exceeds the supported size");
    }
    const firstLine = (newline >= 0 ? prefix.slice(0, newline) : prefix).trim();
    const header = JSON.parse(firstLine) as Record<string, unknown>;
    const id = typeof header.id === "string" ? header.id.trim() : "";
    const cwd = typeof header.cwd === "string" ? header.cwd : "";
    if (header.type !== "session" || !id || /[\0\r\n]/.test(id)) {
      throw new Error("Pi session header has no valid native identity");
    }
    if (path.resolve(cwd) !== path.resolve(workspacePath)) {
      throw new Error("Pi session header belongs to a different workspace");
    }
    return { id, cwd };
  } finally {
    await handle.close();
  }
}

function sessionIdentityError(
  harnessId: string,
  session: SessionRef,
  message: string,
  cause?: unknown
): HarnessRuntimeError {
  if (session.resumedAt) {
    return new SessionResumeError(harnessId, session.nativeId, {
      cause: cause instanceof Error ? cause : new Error(message)
    });
  }
  return new PiSessionIdentityContractError(harnessId, message, cause);
}

class PiSessionIdentityContractError extends HarnessRuntimeError {
  constructor(harnessId: string, message: string, cause?: unknown) {
    super(
      "HARNESS_CONTRACT_VIOLATION",
      message,
      { harnessId },
      {
        source: "adapter",
        cause: cause instanceof Error ? cause : undefined
      }
    );
    this.name = "PiSessionIdentityContractError";
  }
}

export async function preparePiSettings(
  home: string,
  baseUrl: string,
  model: string,
  contextWindow: number
): Promise<void> {
  await fs.mkdir(path.join(home, "sessions"), { recursive: true, mode: 0o700 });
  const budgets = piContextBudgets(contextWindow);
  const document = {
    providers: {
      openfars: {
        baseUrl,
        api: "openai-completions",
        apiKey: "SCIENCEEVOLVE_GATEWAY_API_KEY",
        authHeader: true,
        compat: {
          supportsStore: false,
          supportsDeveloperRole: false,
          supportsReasoningEffort: false,
          supportsUsageInStreaming: false,
          supportsStrictMode: false,
          maxTokensField: "max_tokens"
        },
        models: [{
          id: model,
          name: model,
          reasoning: true,
          input: ["text"],
          contextWindow,
          maxTokens: budgets.maxTokens,
          cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }
        }]
      }
    }
  };
  await fs.writeFile(path.join(home, "models.json"), `${JSON.stringify(document, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600
  });
  const settingsPath = path.join(home, "settings.json");
  const previous = await fs.readFile(settingsPath, "utf8").then((raw) => JSON.parse(raw) as unknown).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return {};
    throw error;
  });
  if (!previous || typeof previous !== "object" || Array.isArray(previous)) {
    throw new Error("pi settings.json must contain an object");
  }
  const settings = previous as Record<string, unknown>;
  const existingCompaction = settings.compaction && typeof settings.compaction === "object" && !Array.isArray(settings.compaction)
    ? settings.compaction as Record<string, unknown>
    : {};
  await fs.writeFile(settingsPath, `${JSON.stringify({
    ...settings,
    compaction: {
      ...existingCompaction,
      enabled: true,
      reserveTokens: budgets.reserveTokens,
      keepRecentTokens: budgets.keepRecentTokens
    }
  }, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
}

/** Keep native pi's output request inside the room reserved for the next turn. */
export function piContextBudgets(contextWindow: number): {
  maxTokens: number;
  reserveTokens: number;
  keepRecentTokens: number;
} {
  const maxTokens = Math.max(1, Math.min(32_000, Math.floor(contextWindow * 0.2)));
  const nextTurnAllowance = Math.max(1, Math.min(8_192, Math.floor(contextWindow * 0.125)));
  const reserveTokens = Math.min(contextWindow, maxTokens + nextTurnAllowance);
  const keepRecentTokens = Math.max(1, Math.min(20_000, Math.floor((contextWindow - reserveTokens) * 0.5)));
  return { maxTokens, reserveTokens, keepRecentTokens };
}

async function resolvePiExtension(): Promise<string> {
  const sourceDirectory = path.dirname(fileURLToPath(import.meta.url));
  for (const candidate of [
    path.join(sourceDirectory, "pi-mcp-extension.js"),
    path.join(sourceDirectory, "pi-mcp-extension.ts")
  ]) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // Continue.
    }
  }
  throw new Error("OpenFARS pi MCP extension is missing");
}
