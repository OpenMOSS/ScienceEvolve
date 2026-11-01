import { SLEEP_TOOL_TIMEOUT_SEC } from "./sleep-tool-contract.js";
import { isExplainerMcp } from "./internal/shared/explainer-tools.js";
import { createWriteStream, promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";
import { once } from "node:events";
import { StringDecoder } from "node:string_decoder";
import type {
  AgentActivitySignal,
  AgentConfig,
  AgentMcpServer,
  AgentRunRequest,
  AgentRunResult,
  AgentPermission,
  TraceSink
} from "./types.js";
import { redactTrace } from "./utils.js";
import { configuredModelContextWindow, modelAutoCompactTokenLimit } from "./model-context.js";
import { loadCodexProviderSettings } from "./codex-provider-config.js";
import { prepareCodexGatewayModelCatalog } from "./codex-gateway-model-catalog.js";
import { nativeSessionHome } from "./harness-runtime/native-input-history.js";
import {
  FIXED_MCP_TOKEN_ENV_VAR,
  fixedMcpToken,
  isFixedMcpServer,
  resolvedMcpServers
} from "./mcp-directory.js";
import type {
  HarnessAdapterRequest,
  SessionRef
} from "./harness-runtime/contracts.js";

type CodexDriverRequest = HarnessAdapterRequest & Pick<
  AgentRunRequest,
  "onOfficialHarnessEvent" | "onThreadStarted" | "onTokenUsage"
> & { prepareNativeInput?: (prompt: string) => Promise<string> };
import {
  buildInvocationEnvironment,
  harnessExecutableLaunch,
  type InvocationProcessHost,
  writeStreamWithBackpressure
} from "./harness-runtime/process-host.js";
import {
  agentEnvironment,
  natureFigureWorkspaceConfigPath,
  readControlActions,
  resolveOrchestrationControlMcpCommand,
  resolveWorkspaceMcpCommand,
  resolveSleepMcpCommand,
  type HarnessHostOptions
} from "./harness-runtime/runtime-support.js";
import {
  PUBLISHED_ARTIFACT_MANIFEST_ENV,
  PUBLISHED_ARTIFACT_MANIFEST_FILENAME
} from "./published-artifact-access.js";
import {
  AgentApiError,
  AgentAuthenticationError,
  AgentInterruptedError,
  AgentRequestConfigurationError
} from "./agent-errors.js";
import {
  HarnessEventStreamError,
  HarnessRuntimeError,
  SessionResumeError
} from "./harness-runtime/errors.js";
import { stageSelectedSkills } from "./harness-runtime/skill-staging.js";
import { deriveInvocationSessionPolicy } from "./internal/shared/invocation-session-policy.js";

export {
  AgentApiError,
  AgentAuthenticationError,
  AgentInterruptedError,
  AgentRequestConfigurationError,
  AgentTimeoutError
} from "./agent-errors.js";
export type { AgentApiErrorKind } from "./agent-errors.js";

const MAX_TRACE_MESSAGE_LENGTH = 20_000;
const MAX_RAW_TRACE_BYTES = 64 * 1024 * 1024;
const MAX_STDERR_CHARACTERS = 4 * 1024 * 1024;
const ORCHESTRATION_CONTROL_MCP_ENV_VARS = [
  "SCIENCEEVOLVE_CONTROL_CONTEXT",
  "SCIENCEEVOLVE_CONTROL_CAPABILITY"
] as const;

function truncateTrace(value: string): string {
  if (value.length <= MAX_TRACE_MESSAGE_LENGTH) return value;
  return `${value.slice(0, MAX_TRACE_MESSAGE_LENGTH)}\n[trace truncated]`;
}

export interface CodexRunnerOptions extends HarnessHostOptions {
  /** External directories are accepted only from the trusted host registry. */
  resolveProjectWorkspace?: (projectId: string) => Promise<string | undefined>;
  /** Adapter identity supplied by the Registry wrapper. */
  harnessId: string;
  /** The Facade has already copied selected Skills into the Agent-scoped cache. */
  skillsAlreadyStaged?: boolean;
  workflowPromptPrepared?: boolean;
  /** Resolved by trusted host authority, never read from an Agent prompt/config path. */
  nativeCodexProfileHome?: string;
  /** Invocation-local protocol proxy inactivity deadline. */
  protocolProxyTimeoutMs?: number;
}

/** Codex-native CLI driver; production workflow/probe dispatch enters via CodexAdapter. */
export class CodexRunner {
  constructor(
    private readonly codexBin: string,
    private readonly options: CodexRunnerOptions,
    private readonly processHost: InvocationProcessHost,
    private readonly invocationSession: SessionRef
  ) {
    if (!path.isAbsolute(codexBin)) {
      throw new Error("Codex executable must be resolved to an absolute path");
    }
  }

  async run(
    request: CodexDriverRequest,
    onTrace: TraceSink,
    signal: AbortSignal
  ): Promise<AgentRunResult> {
    if (signal.aborted) {
      throw new AgentInterruptedError("Agent invocation was cancelled before start");
    }
    if (
      request.purpose !== undefined &&
      request.purpose !== "workflow" &&
      request.purpose !== "probe" &&
      request.purpose !== "explainer"
    ) {
      throw new AgentRequestConfigurationError(
        "CodexRunner received an unsupported invocation purpose"
      );
    }
    const kind = request.kind;
    const agentConfig = request.project.agents[request.agent];
    if (!agentConfig) {
      throw new AgentRequestConfigurationError(
        "Codex invocation is missing its selected Agent configuration"
      );
    }
    const harness = this.options.harnessId;
    const harnessExecutable = this.codexBin;
    const permission: AgentPermission = request.permission;
    const explainer = request.purpose === "explainer";
    if (explainer && (
      permission !== "workspace" || kind !== "worker" || request.control ||
      request.skillPaths.length > 0 || (request.autoSkillPaths?.length ?? 0) > 0 ||
      request.availableSkillPaths.length > 0 ||
      agentConfig.skills.length > 0 || agentConfig.autoSkills.length > 0 ||
      agentConfig.mcpServers.some(server => !isExplainerMcp(server)) || agentConfig.experimentMcp || agentConfig.webSearch ||
      !agentConfig.sessionPersistence
    )) {
      throw new AgentRequestConfigurationError(
        "Codex Project Explainer requires an isolated, tool-free read-only invocation"
      );
    }
    const canCompute = permission === "compute";
    const executionYolo = permission === "yolo";
    if (
      !path.isAbsolute(request.projectPath) ||
      path.basename(path.resolve(request.projectPath)) !== request.project.id
    ) {
      throw new Error("Agent project path does not match the project id");
    }
    const selectedWorkspace = await this.options.resolveProjectWorkspace?.(request.project.id);
    if (selectedWorkspace !== undefined && path.resolve(request.workspacePath) !== path.resolve(selectedWorkspace)) {
      throw new Error("Agent workspace does not match the trusted host binding");
    }
    if (selectedWorkspace === undefined && !pathIsWithin(request.workspacePath, request.projectPath)) {
      throw new Error("Agent workspace must be inside the current project root");
    }
    const [realProjectPath, realWorkspacePath] = await Promise.all([
      fs.realpath(request.projectPath),
      fs.realpath(request.workspacePath)
    ]);
    if (selectedWorkspace !== undefined && realWorkspacePath !== path.resolve(selectedWorkspace)) {
      throw new Error("Agent workspace binding changed before Codex launch");
    }
    if (selectedWorkspace === undefined && !pathIsWithin(realWorkspacePath, realProjectPath)) {
      throw new Error(
        "Agent workspace resolves outside the current project root"
      );
    }
    const effectiveSandbox = explainer
      ? "read-only"
      : executionYolo
      ? "danger-full-access"
      : "workspace-write";
    const configuredSkillPaths = [
      ...request.skillPaths,
      ...(request.autoSkillPaths ?? [])
    ];
    await fs.mkdir(request.runtimePath, { recursive: true });
    const isolatedHome = path.join(request.runtimePath, "home");
    const agentHome =
      canCompute || executionYolo ? hostUserHome() : isolatedHome;
    if (!canCompute && !executionYolo) {
      await fs.mkdir(isolatedHome, { recursive: true });
    }
    const natureFigureConfigPath =
      canCompute &&
      (await hasSelectedSkillDirectory(configuredSkillPaths, "nature-figure"))
        ? await prepareNatureFigureWorkspace(request.workspacePath)
        : undefined;
    const stagedSkillPaths = this.options.skillsAlreadyStaged
      ? configuredSkillPaths
      : await stageSelectedSkills(
          configuredSkillPaths,
          request.workspacePath,
          request.availableSkillPaths,
          request.agent
        );
    const nativeProfileHome = this.options.nativeCodexProfileHome;
    const providerSettings = nativeProfileHome
      ? { configOverrides: [], routeConfigOverrides: [], environmentKeys: [] }
      : await loadCodexProviderSettings(hostCodexHome());
    const providerConfigOverrides = agentConfig.gatewaySnapshot
      ? providerSettings.routeConfigOverrides
      : providerSettings.configOverrides;
    const providerEnvironmentKeys = agentConfig.gatewaySnapshot
      ? []
      : providerSettings.environmentKeys;
    const workspaceServer = explainer
      ? undefined
      : await resolveWorkspaceMcpCommand();
    const sleepServer = explainer ? undefined : await resolveSleepMcpCommand();
    const orchestrationControl = !explainer && request.control
      ? await resolveOrchestrationControlMcpCommand()
      : undefined;
    const configuredMcpServers = explainer ? agentConfig.mcpServers.filter(isExplainerMcp) : agentConfig.mcpServers;
    let gatewayModelCatalog: string | undefined;
    if (agentConfig.gatewaySnapshot && !explainer) {
      try {
        gatewayModelCatalog = await prepareCodexGatewayModelCatalog(
          harnessExecutable, agentConfig.model, request.runtimePath
        );
      } catch (error) {
        throw new HarnessRuntimeError(
          "HARNESS_CONFIGURATION_INVALID",
          "Codex could not prepare the selected model's gateway tool configuration",
          { harnessId: harness, model: agentConfig.model },
          { source: "adapter", cause: error instanceof Error ? error : undefined }
        );
      }
    }
    const hasFixedMcp = configuredMcpServers.some(isFixedMcpServer);
    const fixedToken = hasFixedMcp ? fixedMcpToken() : undefined;
    if (hasFixedMcp && !fixedToken) {
      throw new Error(
        `系统 MCP 已启用，但服务端环境变量 ${FIXED_MCP_TOKEN_ENV_VAR} 未配置`
      );
    }
    const skillConfig = [
      ...request.availableSkillPaths.map((skillPath) => ({
        path: skillPath,
        enabled: false
      })),
      ...stagedSkillPaths.map((skillPath) => ({
        path: skillPath,
        enabled: true
      }))
    ];
    const sessionPolicy = deriveInvocationSessionPolicy(
      kind,
      agentConfig.sessionPersistence
    );
    const persistentSession = sessionPolicy.durableSession;
    if (
      this.invocationSession.harnessId !== harness ||
      this.invocationSession.durable !== persistentSession ||
      (request.resumeThreadId !== undefined &&
        this.invocationSession.nativeId !== request.resumeThreadId)
    ) {
      throw new HarnessRuntimeError(
        "HARNESS_CONTRACT_VIOLATION",
        "Codex driver SessionRef does not match the Facade invocation",
        { harnessId: harness },
        { source: "adapter" }
      );
    }
    const resumeMain = persistentSession && Boolean(request.resumeThreadId);
    const execArgs = resumeMain
      ? [
          "exec",
          "resume",
          "--ignore-user-config",
          "--ignore-rules",
          "--skip-git-repo-check",
          "--json",
          request.resumeThreadId!,
          "-"
        ]
      : [
          "exec",
          ...(!persistentSession ? ["--ephemeral"] : []),
          "--ignore-user-config",
          "--ignore-rules",
          "--skip-git-repo-check",
          "--json",
          "--color",
          "never",
          "-"
        ];
    const args = [
      "--strict-config",
      ...(nativeProfileHome ? ["-c", 'model_provider="openai"'] : []),
      "--disable",
      "multi_agent",
      "--disable",
      "plugins",
      // A host Codex installation may expose connector/app MCP resources even
      // with user config ignored.  Workflow Agents must only see the
      // invocation-scoped workspace/control servers; app discovery otherwise
      // makes the model call external resources and can also trigger a
      // sandbox mount outside the project.
      "--disable",
      "apps",
      "--disable",
      "skill_search",
      ...(sessionPolicy.disableCodexGoals ? ["--disable", "goals"] : []),
      ...(explainer ? ["--disable", "shell_tool", "--disable", "browser_use"] : []),
      ...(executionYolo
        ? ["--dangerously-bypass-approvals-and-sandbox"]
        : ["-a", "never", "-s", effectiveSandbox]),
      ...(!executionYolo && !explainer
        ? ["-c", "sandbox_workspace_write.network_access=true"]
        : []),
      "-C",
      request.workspacePath,
      ...providerConfigOverrides.flatMap((override) => [
        "-c",
        override
      ]),
      ...(agentConfig.gatewaySnapshot
        ? codexGatewayConfigOverrides(
            agentConfig.gatewaySnapshot,
            this.options.protocolProxyTimeoutMs,
            agentConfig.model
          ).flatMap((override) => [
            "-c",
            override
          ])
        : []),
      ...(gatewayModelCatalog ? ["-c", `model_catalog_json=${JSON.stringify(gatewayModelCatalog)}`] : []),
      "-c",
      "skills.bundled.enabled=false",
      "-c",
      tomlSkillConfig(skillConfig),
      "-c",
      tomlMcpServersConfig(
        configuredMcpServers,
        workspaceServer ? {
          command: workspaceServer.command,
          args: workspaceServer.args,
          env: {
            SCIENCEEVOLVE_PROJECT_ID: request.project.id,
            SCIENCEEVOLVE_INVOCATION_ID: request.invocationId,
            SCIENCEEVOLVE_AGENT_NAME: request.agent,
            SCIENCEEVOLVE_APPEND_ROOT: request.workspacePath,
            [PUBLISHED_ARTIFACT_MANIFEST_ENV]: path.join(
              request.runtimePath,
              PUBLISHED_ARTIFACT_MANIFEST_FILENAME
            )
          }
        } : undefined,
        hasFixedMcp ? FIXED_MCP_TOKEN_ENV_VAR : undefined,
        orchestrationControl
          ? {
              command: orchestrationControl.command,
              args: orchestrationControl.args
            }
          : undefined,
        agentConfig.webSearch && agentConfig.gatewaySnapshot
          ? {
              url: `${agentConfig.gatewaySnapshot.url.replace(/\/$/, "")}/web-mcp`,
              tokenEnvVar: "SCIENCEEVOLVE_GATEWAY_API_KEY"
            }
          : undefined,
        request.siiMcp?.url,
        sleepServer
      ),
      ...(agentConfig.model ? ["-m", agentConfig.model] : []),
      ...(agentConfig.webSearch ? ["--search"] : []),
      ...execArgs
    ];

    await onTrace("status", `Starting Codex process for ${request.agent}`, {
      harness,
      protocol: agentConfig.gatewaySnapshot?.protocol ?? "responses",
      model: agentConfig.model || "default",
      sandbox: effectiveSandbox,
      yolo: executionYolo,
      reasoningFingerprint: agentConfig.gatewaySnapshot?.reasoning?.fingerprint,
      skills: [...request.skillPaths],
      autoSkills: [...(request.autoSkillPaths ?? [])],
      mcpServers: configuredMcpServers.map((server) => server.name),
      purpose: request.purpose ?? "workflow",
      sessionMode: persistentSession
        ? resumeMain
          ? "resume"
          : "new"
        : "ephemeral",
      ...(request.resumeThreadId
        ? { sessionId: request.resumeThreadId }
        : {})
    });
    if (canCompute || executionYolo) {
      await onTrace(
        "status",
        "Execution inherited the service user's HOME and may access the current project root",
        {
          home: agentHome,
          isolatedHome: false,
          inheritedEnvironment: true,
          authorizedProjectRoot: request.projectPath,
          roleWorkspace: request.workspacePath
        }
      );
    }

    const invocationEnvironment = buildInvocationEnvironment({
      common: agentEnvironment(
        agentHome,
        request.runtimePath,
        request.project.id,
        request.invocationId,
        request.agent,
        kind,
        permission,
        request.projectPath,
        request.workspacePath,
        this.options,
        providerEnvironmentKeys,
        natureFigureConfigPath,
        fixedToken,
        request.control,
        agentConfig.gatewaySnapshot,
        harness,
        agentConfig.gatewaySnapshot?.protocol ?? "responses"
      )
    });
    // Provider settings are projected as explicit CLI overrides above. When
    // an invocation-local route exists, only route-compatible preferences
    // (currently service tier) are inherited; the host provider table itself
    // is deliberately absent from argv. The child never needs the host Codex
    // home, which may contain unrelated sessions, MCP configuration, or
    // credentials.
    const isolatedCodexHome = nativeSessionHome(request.projectPath, request.agent, "codex");
    if (!nativeProfileHome) await fs.mkdir(isolatedCodexHome, { recursive: true, mode: 0o700 });
    invocationEnvironment.CODEX_HOME = nativeProfileHome ?? isolatedCodexHome;

    const rawTracePath = path.join(request.runtimePath, "codex-events.jsonl");
    const stderrPath = path.join(request.runtimePath, "stderr.log");
    const traceFile = createWriteStream(rawTracePath, {
      flags: "a",
      encoding: "utf8"
    });
    const stderrFile = createWriteStream(stderrPath, {
      flags: "a",
      encoding: "utf8"
    });

    try {
      const rawProcess = this.processHost.startRaw({
        ...harnessExecutableLaunch(harnessExecutable, args),
        cwd: request.workspacePath,
        env: invocationEnvironment,
        eventFormat: "jsonl",
        session: this.invocationSession,
        rawLogLimitBytes: MAX_RAW_TRACE_BYTES
      }, {
        rejectOnAbort: false,
        termination: {
          initialSignal: "SIGINT",
          terminateAfterMs: 10_000,
          killAfterMs: 15_000
        }
      });
      const child = rawProcess.child;
      const exitPromise = rawProcess.completed;
      let logStreamError: Error | undefined;
      const captureLogStreamError = (error: Error) => {
        logStreamError ??= error;
        rawProcess.forceTerminate();
      };
      traceFile.on("error", captureLogStreamError);
      stderrFile.on("error", captureLogStreamError);

    let cancellationRequested: boolean = signal.aborted;

    const abort = () => {
      cancellationRequested = true;
    };
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) abort();
    let exitObserved = false;

    let stderr = "";
    let threadId: string | undefined;
    let turnCompleted = false;
    let turnFailed = false;
    let failureEventDetails = "";
    let protocolError: Error | undefined;
    let lastAgentMessage: string | undefined;
    let rawTraceBytes = 0;
    let rawTraceTruncated = false;

    const rejectOfficialIdentity = (error: Error): void => {
      protocolError ??= error;
      // Identity is the trust boundary for a durable Codex invocation.  Do
      // not allow a mismatched resume to keep executing tools or emitting
      // canonical events while we wait for the process to exit naturally.
      rawProcess.forceTerminate();
    };

    const writeRawTrace = async (line: string) => {
      if (rawTraceTruncated) return;
      // Keep the bounded operational event log used by workload backfills,
      // but structurally remove hidden reasoning/thinking before disk I/O.
      const redactedLine = `${redactTrace(sanitizeCodexEventForLog(line))}\n`;
      const byteLength = Buffer.byteLength(redactedLine);
      if (rawTraceBytes + byteLength > MAX_RAW_TRACE_BYTES) {
        const marker = `${JSON.stringify({
          type: "scienceevolve.log_truncated",
          maxBytes: MAX_RAW_TRACE_BYTES
        })}\n`;
        if (
          rawTraceBytes + Buffer.byteLength(marker) <=
          MAX_RAW_TRACE_BYTES
        ) {
          await writeStreamWithBackpressure(traceFile, marker);
          rawTraceBytes += Buffer.byteLength(marker);
        }
        rawTraceTruncated = true;
        return;
      }
      await writeStreamWithBackpressure(traceFile, redactedLine);
      rawTraceBytes += byteLength;
    };

    const lineReader = readline.createInterface({
      input: child.stdout,
      crlfDelay: Infinity
    });
    const stdoutTask = (async () => {
      for await (const line of lineReader) {
        await writeRawTrace(line);
        let event: Record<string, unknown>;
        try {
          event = JSON.parse(line) as Record<string, unknown>;
        } catch (error) {
          protocolError = new HarnessEventStreamError(
            harness,
            "Invalid official JSON event",
            { cause: error instanceof Error ? error : undefined }
          );
          rawProcess.forceTerminate();
          await onTrace(
            "output",
            truncateTrace(`Codex protocol error: ${redactTrace(line)}`)
          );
          break;
        }
        if (event.type === "thread.started") {
          const reportedThreadId = typeof event.thread_id === "string"
            ? event.thread_id.trim()
            : "";
          if (!reportedThreadId || reportedThreadId.startsWith("pending:")) {
            rejectOfficialIdentity(request.resumeThreadId
              ? new SessionResumeError(harness, request.resumeThreadId, {
                  cause: new Error(
                    "Codex reported an invalid official thread identity while resuming"
                  )
                })
              : new HarnessRuntimeError(
                  "HARNESS_CONTRACT_VIOLATION",
                  "Codex reported an invalid official thread identity",
                  { harnessId: harness },
                  { source: "adapter" }
                ));
          } else if (threadId && threadId !== reportedThreadId) {
            rejectOfficialIdentity(request.resumeThreadId
              ? new SessionResumeError(harness, request.resumeThreadId, {
                  cause: new Error("Codex emitted inconsistent thread identities while resuming")
                })
              : new HarnessRuntimeError(
                  "HARNESS_CONTRACT_VIOLATION",
                  "Codex emitted inconsistent official thread identities",
                  { harnessId: harness },
                  { source: "adapter" }
                ));
          } else if (
            request.resumeThreadId &&
            request.resumeThreadId !== reportedThreadId
          ) {
            rejectOfficialIdentity(new SessionResumeError(
              harness,
              request.resumeThreadId,
              {
                cause: new Error(
                  `Codex resumed an unexpected thread: received ${reportedThreadId}`
                )
              }
            ));
          } else {
            threadId = reportedThreadId;
            await request.onThreadStarted?.(reportedThreadId);
          }
        }
        if (protocolError) break;

        if (
          persistentSession &&
          !threadId &&
          (event.type === "turn.started" ||
            event.type === "turn.completed" ||
            event.type === "item.started" ||
            event.type === "item.updated" ||
            event.type === "item.completed")
        ) {
          rejectOfficialIdentity(
            resumeMain && request.resumeThreadId
              ? new SessionResumeError(harness, request.resumeThreadId, {
                  cause: new Error(
                    "Codex emitted work events before confirming the resumed thread identity"
                  )
                })
              : new HarnessRuntimeError(
                  "HARNESS_CONTRACT_VIOLATION",
                  "Codex emitted work events before an official thread identity",
                  { harnessId: harness },
                  { source: "adapter" }
                )
          );
          break;
        }

        // Only validated official frames cross into the canonical bridge.
        await request.onOfficialHarnessEvent?.(event);
        if (event.type === "turn.completed") {
          turnCompleted = true;
        }
        if (event.type === "error" || event.type === "turn.failed") {
          failureEventDetails = `${failureEventDetails}${failureEventDetails ? "\n" : ""}${JSON.stringify(event)}`.slice(
            -30_000
          );
        }
        if (event.type === "turn.failed") {
          turnFailed = true;
        }
        const activity = codexActivitySignal(event);
        if (activity) request.onModelActivity?.(activity);
        const item =
          event.item && typeof event.item === "object"
            ? (event.item as Record<string, unknown>)
            : undefined;
        if (
          event.type === "item.completed" &&
          item?.type === "agent_message" &&
          typeof item.text === "string"
        ) {
          lastAgentMessage = item.text;
        }
        const trace = describeCodexEvent(event, {
          usageScope: persistentSession ? "thread" : "turn",
          threadId
        });
        if (trace) {
          await onTrace(
            trace.kind,
            truncateTrace(redactTrace(trace.message)),
            trace.data
          );
        }
      }
    })();

    const stderrTask = (async () => {
      let pending = "";
      let capturedCharacters = 0;
      let captureTruncated = false;
      const decoder = new StringDecoder("utf8");
      const flushLine = async (line: string) => {
        const text = redactTrace(line);
        await writeStreamWithBackpressure(stderrFile, `${text}\n`);
        stderr = `${stderr}${text}\n`.slice(-30_000);
        if (text) {
          await onTrace("stderr", truncateTrace(text));
        }
      };
      const capture = async (raw: string) => {
        const remaining = MAX_STDERR_CHARACTERS - capturedCharacters;
        if (remaining <= 0) {
          captureTruncated = true;
          return;
        }
        const captured = raw.slice(0, remaining);
        capturedCharacters += captured.length;
        if (captured.length < raw.length) captureTruncated = true;
        pending += captured;

        let newlineIndex = pending.indexOf("\n");
        while (newlineIndex >= 0) {
          const line = pending.slice(0, newlineIndex).replace(/\r$/, "");
          pending = pending.slice(newlineIndex + 1);
          await flushLine(line);
          newlineIndex = pending.indexOf("\n");
        }
      };

      for await (const chunk of child.stderr) {
        await capture(decoder.write(chunk as Buffer));
      }
      await capture(decoder.end());
      if (pending) await flushLine(pending);
      if (captureTruncated) {
        await flushLine(
          `[stderr capture truncated after ${MAX_STDERR_CHARACTERS} characters]`
        );
      }
    })();

    let outputError: Error | undefined;
    const outputTasks = Promise.all([stdoutTask, stderrTask]).catch((error) => {
      outputError = error as Error;
      rawProcess.forceTerminate();
    });

    try {
      if (!signal.aborted) {
        const configuredMandate = agentConfig.instructions.trim();
        const nativePrompt = explainer || this.options.workflowPromptPrepared
          ? `${configuredMandate}\n`
          : `${configuredMandate}\n\n项目入口：${request.projectPath}\n\n本轮直接消息：\n来源：OpenFARS\n内容：${await fs.readFile(request.inboxPath, "utf8")}\n`;
        const actualInput = request.prepareNativeInput ? await request.prepareNativeInput(nativePrompt) : nativePrompt;
        signal.throwIfAborted();
        child.stdin.end(actualInput);
      }
      const exit = await exitPromise;
      exitObserved = true;
      await outputTasks;
      traceFile.end();
      stderrFile.end();
      await Promise.all([finished(traceFile), finished(stderrFile)]);

      if (outputError) throw outputError;
      if (logStreamError) throw logStreamError;
      if (cancellationRequested || signal.aborted) {
        throw new AgentInterruptedError("Agent invocation was cancelled");
      }
      const failureDetails = `${failureEventDetails}\n${stderr}`;
      // Official stream failures and identity mismatches are authoritative
      // even when fail-fast termination also produces a non-zero exit.
      if (protocolError) throw protocolError;
      if (exit.code !== 0) {
        const message =
          `Codex exited with code ${exit.code ?? "null"}${exit.signal ? ` (${exit.signal})` : ""}${stderr ? `: ${stderr.trim()}` : ""}`;
        throw (
          classifiedAgentApiError(message, failureDetails) ??
          new HarnessRuntimeError(
            "HARNESS_PROCESS_EXITED",
            "Codex process exited before completing the invocation",
            { harnessId: harness, exitCode: exit.code, signal: exit.signal },
            { source: "process", cause: new Error(message) }
          )
        );
      }
      if (persistentSession && !threadId) {
        if (resumeMain && request.resumeThreadId) {
          throw new SessionResumeError(harness, request.resumeThreadId, {
            cause: new Error(
              "Codex completed a resumed durable invocation without thread.started"
            )
          });
        }
        throw new HarnessRuntimeError(
          "HARNESS_CONTRACT_VIOLATION",
          "Codex completed a new durable invocation without an official thread identity",
          { harnessId: harness },
          { source: "adapter" }
        );
      }
      if (turnFailed || !turnCompleted) {
        const message = turnFailed
          ? "Codex reported turn.failed"
          : `Codex exited without a turn.completed event${failureDetails.trim() ? `: ${redactTrace(failureDetails).trim().slice(-4_000)}` : ""}`;
        throw (
          classifiedAgentApiError(message, failureDetails) ??
          new HarnessRuntimeError(
            turnFailed ? "MODEL_PROVIDER_FAILED" : "HARNESS_CONTRACT_VIOLATION",
            turnFailed
              ? "Codex reported that the model turn failed"
              : "Codex exited without an official turn completion",
            { harnessId: harness },
            { source: turnFailed ? "gateway" : "adapter", cause: new Error(message) }
          )
        );
      }
      if (!lastAgentMessage) {
        throw new HarnessRuntimeError(
          "HARNESS_CONTRACT_VIOLATION",
          "Codex completed without a final agent message",
          { harnessId: harness },
          { source: "adapter" }
        );
      }

      const controlActions = request.control
        ? await readControlActions(request.control.stagingPath)
        : [];
      return {
        handoff: lastAgentMessage,
        ...(controlActions.length ? { controlActions } : {}),
        threadId
      };
      } finally {
        if (
          !exitObserved &&
          child.exitCode === null &&
          child.signalCode === null
        ) {
          rawProcess.forceTerminate();
          await Promise.race([exitPromise, delay(2_000)]);
        }
        signal.removeEventListener("abort", abort);
        lineReader.close();
        if (!traceFile.closed) traceFile.end();
        if (!stderrFile.closed) stderrFile.end();
      }
    } finally {
      if (!traceFile.closed && !traceFile.writableEnded) traceFile.end();
      if (!stderrFile.closed && !stderrFile.writableEnded) stderrFile.end();
    }
  }

}

async function finished(stream: NodeJS.WritableStream): Promise<void> {
  if (
    ("closed" in stream && stream.closed) ||
    ("writableFinished" in stream && stream.writableFinished)
  ) {
    return;
  }
  await once(stream, "finish");
}

export function codexGatewayConfigOverrides(
  gateway: NonNullable<AgentConfig["gatewaySnapshot"]>,
  protocolProxyTimeoutMs?: number,
  model = gateway.defaultModel
): string[] {
  const contextWindow = configuredModelContextWindow(gateway.modelContextWindows?.[model]);
  return [
    'model_provider="openfars_gateway"',
    `model_providers.openfars_gateway.name=${JSON.stringify(gateway.name)}`,
    `model_providers.openfars_gateway.base_url=${JSON.stringify(gateway.url)}`,
    'model_providers.openfars_gateway.wire_api="responses"',
    'model_providers.openfars_gateway.env_key="SCIENCEEVOLVE_GATEWAY_API_KEY"',
    `model_context_window=${contextWindow}`,
    `model_auto_compact_token_limit=${modelAutoCompactTokenLimit(contextWindow)}`,
    'model_auto_compact_token_limit_scope="total"',
    ...(protocolProxyTimeoutMs !== undefined
      ? [`model_providers.openfars_gateway.stream_idle_timeout_ms=${Math.max(
          1_000,
          Math.min(Math.floor(protocolProxyTimeoutMs), 60 * 60_000) + 30_000
        )}`]
      : [])
  ];
}

function hostUserHome(): string {
  return process.env.HOME || os.homedir();
}

function hostCodexHome(): string | undefined {
  return (
    process.env.CODEX_HOME ??
    (process.env.HOME ? path.join(process.env.HOME, ".codex") : undefined)
  );
}

function pathIsWithin(candidate: string, root: string): boolean {
  const relative = path.relative(path.resolve(root), path.resolve(candidate));
  return (
    relative === "" ||
    (!relative.startsWith(`..${path.sep}`) &&
      relative !== ".." &&
      !path.isAbsolute(relative))
  );
}

async function hasSelectedSkillDirectory(
  skillPaths: string[],
  directoryName: string
): Promise<boolean> {
  for (const skillPath of skillPaths) {
    const realPath = await fs.realpath(skillPath);
    if (path.basename(path.dirname(realPath)) === directoryName) return true;
  }
  return false;
}

async function prepareNatureFigureWorkspace(
  workspacePath: string
): Promise<string> {
  const configPath = natureFigureWorkspaceConfigPath(workspacePath);
  await fs.mkdir(path.dirname(configPath), { recursive: true });
  await fs.writeFile(configPath, '{\n  "backend": "python"\n}\n', {
    encoding: "utf8",
    mode: 0o600
  });
  return configPath;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function tomlSkillConfig(
  config: Array<{ path: string; enabled: boolean }>
): string {
  const entries = config.map(
    (item) =>
      `{ path = ${JSON.stringify(item.path)}, enabled = ${item.enabled ? "true" : "false"} }`
  );
  return `skills.config=[${entries.join(",")}]`;
}

/** Metadata indexes must not lose middle entries to the native MCP preview
 * budget. File detail reads retain their existing byte/authority limits. This
 * config changes output retention only; it never exposes another tool. */
export function codexIndexToolOutputConfig(names: readonly string[]): string {
  return names.length ? `, tools = { ${names.map(name => `${JSON.stringify(name)} = { output_token_limit = 1048576 }`).join(", ")} }` : "";
}

function tomlMcpServersConfig(
  servers: readonly AgentMcpServer[],
  control?: {
    command: string;
    args: string[];
    env: Record<string, string>;
  },
  fixedTokenEnvVar?: string,
  orchestrationControl?: { command: string; args: string[] },
  webSearch?: { url: string; tokenEnvVar: string },
  trustedSiiUrl?: string,
  sleepServer?: { command: string; args: string[] }
): string {
  const entries = resolvedMcpServers(servers).map(
    (server) => {
      const auth = isFixedMcpServer(server) && fixedTokenEnvVar
        ? `, bearer_token_env_var = ${JSON.stringify(fixedTokenEnvVar)}`
        : "";
      // These servers have already been selected for this Agent's capability policy.
      const approval = server.name === "scienceevolve-sii" && server.url === trustedSiiUrl
        || server.name !== "scienceevolve-sii"
        ? ', default_tools_approval_mode = "approve"' : "";
      const indexOutput = codexIndexToolOutputConfig(isExplainerMcp(server) ? ["get_context"] : []);
      return `${JSON.stringify(server.name)} = { url = ${JSON.stringify(server.url)}${auth}${approval}${indexOutput} }`;
    }
  );
  if (control) {
    const args = control.args.map((arg) => JSON.stringify(arg)).join(", ");
    const env = Object.entries(control.env)
      .map(([key, value]) => `${JSON.stringify(key)} = ${JSON.stringify(value)}`)
      .join(", ");
    entries.push(
      `${JSON.stringify("scienceevolve-workspace")} = { command = ${JSON.stringify(control.command)}, args = [${args}], default_tools_approval_mode = "approve", env = { ${env} }${codexIndexToolOutputConfig(["scienceevolve_read_file"])} }`
    );
  }
  if (orchestrationControl) {
    const args = orchestrationControl.args.map((arg) => JSON.stringify(arg)).join(", ");
    const envVars = ORCHESTRATION_CONTROL_MCP_ENV_VARS
      .map((name) => JSON.stringify(name))
      .join(", ");
    entries.push(
      `${JSON.stringify("scienceevolve-orchestration-control")} = { command = ${JSON.stringify(orchestrationControl.command)}, args = [${args}], default_tools_approval_mode = "approve", env_vars = [${envVars}]${codexIndexToolOutputConfig(["state_list"])} }`
    );
  }
  if (webSearch) {
    entries.push(
      `${JSON.stringify("openfars-web")} = { url = ${JSON.stringify(webSearch.url)}, bearer_token_env_var = ${JSON.stringify(webSearch.tokenEnvVar)}, default_tools_approval_mode = "approve" }`
    );
  }
  if (sleepServer) {
    entries.push(`${JSON.stringify("scienceevolve-sleep")} = { command = ${JSON.stringify(sleepServer.command)}, args = ${JSON.stringify(sleepServer.args)}, tool_timeout_sec = ${SLEEP_TOOL_TIMEOUT_SEC}, default_tools_approval_mode = "approve" }`);
  }
  return `mcp_servers={${entries.join(",")}}`;
}

interface DescribedTrace {
  kind: "status" | "message" | "tool" | "output";
  message: string;
  data?: Record<string, unknown>;
}

const AUTHENTICATION_ERROR_PATTERN =
  /(?:\b(?:401|403)\b|unauthori[sz]ed|forbidden|authentication\s+(?:failed|required)|invalid[_ -]?(?:api[_ -]?)?key|incorrect\s+api\s+key|missing\s+(?:an?\s+)?api\s+key|invalid[_ -]?bearer|credentials?\s+(?:are\s+)?invalid)/i;
const REQUEST_CONFIGURATION_ERROR_PATTERN =
  /(?:invalid_json_schema|invalid schema for response_format|response_format.{0,80}schema|text\.format\.schema)/i;
const MODEL_API_ERROR_PATTERN =
  /(?:\b429\b|\b5\d\d\b|rate[_ -]?limit|too many requests|service unavailable|temporarily unavailable|overloaded|upstream|connection (?:reset|refused|closed)|network error|request (?:failed|timed out)|gateway timeout|model provider|failed to send request|error sending request)/i;

function classifiedAgentApiError(
  summary: string,
  details: string
): AgentApiError | AgentRequestConfigurationError | undefined {
  const searchable = `${summary}\n${details}`;
  const safeDetails = redactTrace(searchable).trim().slice(-4_000);
  if (REQUEST_CONFIGURATION_ERROR_PATTERN.test(searchable)) {
    return new AgentRequestConfigurationError(
      safeDetails || "Codex rejected the structured-output schema"
    );
  }
  if (AUTHENTICATION_ERROR_PATTERN.test(searchable)) {
    return new AgentAuthenticationError(
      safeDetails || "Model API authentication failed"
    );
  }
  if (MODEL_API_ERROR_PATTERN.test(searchable)) {
    return new AgentApiError(
      "provider",
      safeDetails || "Model API request failed"
    );
  }
  return undefined;
}

function codexActivitySignal(
  event: Record<string, unknown>
): AgentActivitySignal | undefined {
  const eventType = typeof event.type === "string" ? event.type : "";
  const item =
    event.item && typeof event.item === "object"
      ? (event.item as Record<string, unknown>)
      : undefined;
  const itemType = typeof item?.type === "string" ? item.type : "";
  if (
    (itemType === "agent_message" || itemType === "reasoning") &&
    (eventType === "item.updated" || eventType === "item.completed") &&
    typeof item?.text === "string" && item.text.length > 0
  ) {
    return {
      kind: "model",
      phase: eventType === "item.completed" ? "completed" : "delta",
      source: "harness",
      ...(eventType === "item.updated"
        ? { deltaKind: itemType === "reasoning" ? "reasoning" as const : "visible-text" as const }
        : {})
    };
  }
  if (![
    "command_execution",
    "mcp_tool_call",
    "file_change",
    "web_search",
    "collab_tool_call"
  ].includes(itemType)) return undefined;
  const callId = typeof item?.id === "string" && item.id.trim()
    ? item.id
    : undefined;
  if (!callId) return undefined;
  const phase = eventType === "item.started"
    ? "started"
    : eventType === "item.updated"
      ? "updated"
      : eventType === "item.completed"
        ? "completed"
        : undefined;
  if (!phase) return undefined;
  return {
    kind: "tool",
    phase,
    source: "harness",
    callId,
    name: itemType
  };
}

export function describeCodexEvent(
  event: Record<string, unknown>,
  context: {
    usageScope: "thread" | "turn";
    threadId?: string;
  } = { usageScope: "turn" }
): DescribedTrace | undefined {
  const type = typeof event.type === "string" ? event.type : "event";
  if (type === "thread.started") {
    return {
      kind: "status",
      message: "Codex thread started",
      data:
        typeof event.thread_id === "string"
          ? { threadId: event.thread_id }
          : undefined
    };
  }
  if (type === "turn.started") {
    return { kind: "status", message: "Codex turn started" };
  }
  if (type === "turn.completed") {
    const usage =
      event.usage && typeof event.usage === "object"
        ? (event.usage as Record<string, unknown>)
        : undefined;
    return {
      kind: "status",
      message: "Codex turn completed",
      data: usage
        ? {
            ...usage,
            usageScope: context.usageScope,
            ...(context.threadId ? { threadId: context.threadId } : {})
          }
        : undefined
    };
  }
  if (type === "turn.failed") {
    return { kind: "output", message: "Codex turn failed" };
  }
  if (type === "error") {
    return {
      kind: "output",
      message:
        typeof event.message === "string" ? event.message : JSON.stringify(event)
    };
  }

  const item =
    event.item && typeof event.item === "object"
      ? (event.item as Record<string, unknown>)
      : undefined;
  if (!item) return undefined;
  const itemType = typeof item.type === "string" ? item.type : "item";

  if (itemType === "reasoning") {
    // Hidden reasoning is activity evidence, never a display or persistence
    // payload. The Adapter's canonical mapper follows the same rule.
    return {
      kind: "status",
      message: "Codex reasoning activity",
      data: {
        itemType,
        eventType: type,
        ...(typeof item.id === "string" ? { itemId: item.id } : {})
      }
    };
  }

  if (itemType === "agent_message") {
    const text =
      typeof item.text === "string"
        ? item.text
        : typeof item.message === "string"
          ? item.message
          : "";
    if (!text) return undefined;
    return {
      kind: "message",
      message: summarizeAgentMessage(text),
      data: {
        itemType,
        eventType: type,
        ...(typeof item.id === "string" ? { itemId: item.id } : {})
      }
    };
  }

  if (
    itemType === "command_execution" ||
    itemType === "mcp_tool_call" ||
    itemType === "file_change" ||
    itemType === "web_search" ||
    itemType === "collab_tool_call"
  ) {
    const command = describeToolItem(item, itemType);
    const status = typeof item.status === "string" ? item.status : type;
    return {
      kind: "tool",
      message: `${command} · ${status}`,
      data: {
        itemType,
        status,
        command,
        eventType: type,
        ...(typeof item.id === "string" ? { itemId: item.id } : {})
      }
    };
  }

  return {
    kind: "status",
    message: `${type}: ${itemType}`,
    data: { itemType }
  };
}

function sanitizeCodexEventForLog(line: string): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(line) as unknown;
  } catch {
    return JSON.stringify({ type: "scienceevolve.invalid_event", redacted: true });
  }
  return JSON.stringify(redactHiddenReasoningPayload(parsed));
}

function redactHiddenReasoningPayload(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactHiddenReasoningPayload(item));
  }
  if (!value || typeof value !== "object") return value;
  const record = value as Record<string, unknown>;
  const type = typeof record.type === "string" ? record.type : "";
  if (/(?:reasoning|thinking)/i.test(type)) {
    return {
      ...(type ? { type } : {}),
      ...(typeof record.id === "string" ? { id: record.id } : {}),
      ...(typeof record.status === "string" ? { status: record.status } : {}),
      redacted: true
    };
  }
  return Object.fromEntries(
    Object.entries(record).map(([key, item]) => [
      key,
      redactHiddenReasoningPayload(item)
    ])
  );
}

function summarizeAgentMessage(text: string): string {
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    for (const key of ["summary", "assessment", "markdown"]) {
      if (typeof parsed[key] === "string" && parsed[key].trim()) {
        return parsed[key].trim();
      }
    }
  } catch {
    // Plain agent messages are already suitable as progress summaries.
  }
  return text;
}

function describeToolItem(
  item: Record<string, unknown>,
  itemType: string
): string {
  if (typeof item.command === "string") return item.command;
  if (typeof item.name === "string") return item.name;
  if (typeof item.query === "string" && item.query.trim()) {
    return `搜索：${item.query.trim()}`;
  }
  const changes = Array.isArray(item.changes) ? item.changes : [];
  if (changes.length > 0) {
    const paths = changes
      .map((change) =>
        change && typeof change === "object" &&
        typeof (change as Record<string, unknown>).path === "string"
          ? String((change as Record<string, unknown>).path)
          : ""
      )
      .filter(Boolean);
    if (paths.length > 0) return paths.join(", ");
  }
  return itemType;
}
