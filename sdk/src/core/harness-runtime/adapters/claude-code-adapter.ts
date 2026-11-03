import { claudeNativeToolApprovals } from "./claude-native-policy.js";
import { selectedSkillInstructions } from "../selected-skills.js";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { AgentRunResult } from "../../types.js";
import type {
  HarnessAdapter,
  HarnessAdapterContext,
  HarnessAdapterRequest,
  InvocationInputs,
  InvocationRecoveryEvidence,
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
import { modelFacingMcpNamespaceWildcard } from "../tool-catalog.js";
import {
  AdapterBase,
  adapterResult,
  gatewayModelContextWindow,
  harnessExecutableLaunch,
  prepareAdapterRuntime,
  settleAdapterCleanup,
  writeAdapterLogs,
  type AdapterMcpRow,
  type AdapterRuntimeOptions
} from "./adapter-utils.js";
import { mapClaudeCodeOfficialEvent } from "./claude-code-event-mapper.js";
import { READ_PUBLISHED_ARTIFACT_TOOL } from "../../published-artifact-access.js";

const descriptor = BUILTIN_HARNESS_DESCRIPTORS.find((item) => item.id === "claude-code")!;
// Explainer prompts intentionally ask Claude Code to inspect the read-only
// snapshot before answering. A single turn lets it issue Read, but terminates
// the process before the follow-up answer can be produced.
const EXPLAINER_MAX_TURNS = 8;

export class ClaudeCodeAdapter extends AdapterBase implements HarnessAdapter {
  readonly requiresInlineInbox = true;
  readonly resident = {
    protocol: "claude-stream-json",
    recoveryStrategy: "native-session-resume",
    createOfficialEventMapper: () => mapClaudeCodeOfficialEvent
  } as const;

  constructor(options: AdapterRuntimeOptions = {}) {
    super(descriptor, options);
  }

  createSession(
    _request: HarnessAdapterRequest,
    _inputs: InvocationInputs,
    generation: number,
    durable: boolean
  ): SessionRef {
    return this.session(randomUUID(), generation, durable);
  }

  sessionFromLegacyId(value: string, generation: number, durable: boolean): SessionRef | undefined {
    if (!value.startsWith("claude:")) return undefined;
    const nativeId = value.slice("claude:".length);
    return this.validateNativeSession(nativeId)
      ? this.session(nativeId, generation, durable)
      : undefined;
  }

  sessionToLegacyId(session: SessionRef): string {
    return `claude:${session.nativeId}`;
  }

  validateNativeSession(nativeId: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(nativeId);
  }

  async run(context: HarnessAdapterContext): Promise<AgentRunResult> {
    if ("nativeCodexProfileHome" in context.route) throw new Error("Claude Code requires a Gateway route");
    const executable = await this.resolveExecutable();
    if (!executable) {
      throw new HarnessRuntimeError(
        "HARNESS_UNAVAILABLE",
        "Unable to find the Claude Code executable",
        { harnessId: this.descriptor.id },
        { source: "adapter" }
      );
    }
    const { request, spec } = context;
    const session = spec.session;
    if (!session) {
      throw new HarnessRuntimeError(
        "HARNESS_CONTRACT_VIOLATION",
        "Claude Code requires an invocation SessionRef",
        { harnessId: this.descriptor.id },
        { source: "adapter" }
      );
    }
    const runtime = await prepareAdapterRuntime(context, this.descriptor, this.options, {
      ANTHROPIC_MODEL: spec.model,
      ANTHROPIC_SMALL_FAST_MODEL: spec.model,
      // Let the native CLI summarize its own history, including cached input.
      // Leave room for the next inbox/tool result and the compaction request.
      CLAUDE_CODE_AUTO_COMPACT_WINDOW: String(Math.max(1, Math.floor(gatewayModelContextWindow(request, spec.model) * 0.8))),
      CLAUDE_CODE_MAX_CONTEXT_TOKENS: String(gatewayModelContextWindow(request, spec.model))
    }, {
      // The common host owns provider credentials. Claude Code accepts the
      // invocation-scoped auth token, so do not duplicate it under an
      // Adapter-declared API_KEY that would bypass the route contract.
      ANTHROPIC_AUTH_TOKEN: context.route.token,
      ANTHROPIC_BASE_URL: context.route.baseUrl.replace(/\/v1$/, "")
    });
    const mcpPath = path.join(spec.inputs.runtimePath, "claude-mcp.json");
    const modelMapping = JSON.stringify({
      modelOverrides: { "claude-sonnet-4-5": spec.model }
    });
    const explainer = spec.purpose === "explainer";
    const resumed = Boolean(session.resumedAt);
    const nativeInputReceipt = Boolean(request.siiMcp || context.prepareNativeInput);
    const args = [
      "--print",
      "--verbose",
      "--output-format", "stream-json",
      "--include-partial-messages",
      ...(nativeInputReceipt ? ["--input-format", "stream-json", "--replay-user-messages"] : []),
      "--bare",
      "--disable-slash-commands",
      "--setting-sources", "",
      "--append-system-prompt", selectedSkillInstructions([...spec.policy.skillPaths, ...spec.policy.autoSkillPaths]),
      "--tools", "default",
    "--allowedTools", ...claudeNativeToolApprovals(runtime.mcpRows.map(row => row.namespace)),
      "--strict-mcp-config",
      "--mcp-config", mcpPath,
      "--settings", modelMapping,
      "--permission-mode", "dontAsk",
      "--model", spec.model,
      ...(explainer ? ["--max-turns", String(EXPLAINER_MAX_TURNS)] : []),
      ...(resumed
        ? ["--resume", session.nativeId]
        : ["--session-id", session.nativeId])
    ];

    let handoff: string | undefined;
    let attemptOfficialSessionId: string | undefined;
    let activeProcess: ManagedProcess | undefined;
    const bridge = new OfficialEventBridge({
      descriptor: this.descriptor,
      invocationId: spec.invocationId,
      mapEvent: (event) => {
        if (Object.hasOwn(event, "session_id")) {
          const rawCandidate = typeof event.session_id === "string"
            ? event.session_id
            : "";
          const candidate = rawCandidate.trim();
          if (candidate !== rawCandidate || !this.validateNativeSession(candidate) ||
            (attemptOfficialSessionId !== undefined &&
              attemptOfficialSessionId !== candidate) ||
            candidate !== session.nativeId) {
            throw claudeSessionIdentityError(
              session,
              resumed,
              "Claude Code official stream Session identity did not match the current native attempt"
            );
          }
          attemptOfficialSessionId = candidate;
        }
        const mapped = mapClaudeCodeOfficialEvent(event);
        if (mapped.length > 0 && !attemptOfficialSessionId) {
          throw claudeSessionIdentityError(
            session,
            resumed,
            "Claude Code official stream emitted work before confirming its Session identity"
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
      onFatal: () => activeProcess?.terminate()
    });
    let stdout = "";
    let stderr = "";
    let prompt = spec.prompt;
    let attemptEvidence: InvocationRecoveryEvidence = { kind: "adapter-dispatch" };
    let invocationFailed = false;
    try {
      await fs.writeFile(
        mcpPath,
        `${JSON.stringify(claudeMcpConfig(runtime.mcpRows), null, 2)}\n`,
        { encoding: "utf8", mode: 0o600 }
      );
      for (;;) {
        // Native process recovery reuses one SessionRef, but every fresh
        // process stream must independently prove that identity before work.
        attemptOfficialSessionId = undefined;
        const nativePrompt = context.prepareNativeInput ? await context.prepareNativeInput(prompt) : prompt;
        const currentProcess = context.processHost.start({
          ...harnessExecutableLaunch(executable, args),
          cwd: spec.inputs.workspacePath,
          env: runtime.environment,
          stdin: nativeInputReceipt ? claudeNativeUserInput(nativePrompt, session.nativeId) : nativePrompt,
          eventFormat: "stream-json",
          session,
          rawLogLimitBytes: DEFAULT_RAW_LOG_LIMIT_BYTES,
          recoveryEvidence: attemptEvidence,
          adapterEnvironmentKeys: [
            "ANTHROPIC_MODEL",
            "ANTHROPIC_SMALL_FAST_MODEL",
            "CLAUDE_CODE_AUTO_COMPACT_WINDOW",
            "CLAUDE_CODE_MAX_CONTEXT_TOKENS"
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
        activeProcess = currentProcess;
        await currentProcess.write(nativeInputReceipt ? claudeNativeUserInput(nativePrompt, session.nativeId) : nativePrompt);
        await currentProcess.end();
        const exit = await currentProcess.completed;
        activeProcess = undefined;
        await bridge.finishSegment();
        if (!attemptOfficialSessionId) {
          throw claudeSessionIdentityError(
            session,
            resumed,
            "Claude Code native attempt did not provide a valid Session identity"
          );
        }
        stdout = boundedUtf8Suffix(`${stdout}${exit.stdout}`, DEFAULT_RAW_LOG_LIMIT_BYTES);
        const recoverableSignal = exit.code === null && exit.signal === "SIGKILL";
        const recoveryEvidence: InvocationRecoveryEvidence | undefined = recoverableSignal
          ? { kind: "process-signal" }
          : undefined;
        if (exit.code === 0) break;
        if (recoveryEvidence) {
          if (request.control) {
            await fs.rm(request.control.stagingPath, { force: true });
          }
          const attempt = context.recoveryBudget.attemptsStarted;
          const nextAttempt = attempt + 1;
          await context.onTrace("status", "Claude Code process will resume the same invocation session", {
            harness: this.descriptor.id,
            diagnostic: true,
            diagnosticSource: "adapter",
            attempt,
            nextAttempt,
            recoveryEvidence: recoveryEvidence.kind,
            sessionId: session.nativeId
          });
          prompt = [
            `This is process-recovery attempt ${nextAttempt} for the same OpenFARS invocation.`,
            "Resume the existing session and continue only the still-missing work.",
            "Do not repeat a completed append, artifact publication, or control action.",
            "Read the invocation Inbox and Memory paths already supplied when context is needed.",
            request.kind === "main"
              ? "Continue the unfinished coordination work with the full available tool set, record an orchestration decision when ready, and finish the native turn naturally."
              : "Finish the assignment and return a concise handoff."
          ].join("\n\n");
          const sessionArgumentIndex = Math.max(
            args.indexOf("--resume"),
            args.indexOf("--session-id")
          );
          if (sessionArgumentIndex >= 0) {
            args.splice(sessionArgumentIndex, 2, "--resume", session.nativeId);
          }
          handoff = undefined;
          attemptEvidence = recoveryEvidence;
          continue;
        }
        if (exit.code !== 0) {
          throw new HarnessRuntimeError(
            "HARNESS_PROCESS_EXITED",
            `claude-code exited with code ${exit.code ?? "null"}${exit.signal ? ` (${exit.signal})` : ""}`,
            {
              harnessId: this.descriptor.id,
              exitCode: exit.code,
              signal: exit.signal
            }
          );
        }
        break;
      }
      await bridge.finish();
      return await adapterResult(request, session, handoff);
    } catch (error) {
      invocationFailed = true;
      const identityError = error instanceof Error &&
        (error.cause instanceof SessionResumeError ||
          error.cause instanceof ClaudeSessionIdentityContractError)
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
          ...(activeProcess ? [{
            phase: "process-terminate",
            cleanup: () => {
              if (activeProcess!.child.exitCode === null &&
                activeProcess!.child.signalCode === null) {
                activeProcess!.terminate();
              }
            }
          }, {
            phase: "process-wait",
            cleanup: async () => {
              await activeProcess!.completed;
            }
          }] : []),
          {
            phase: "write-adapter-logs",
            cleanup: () => writeAdapterLogs(spec.inputs, this.descriptor.id, stdout, stderr)
          },
          {
            phase: "remove-runtime-credential",
            cleanup: async () => {
              // This file can contain fixed MCP bearer tokens. Keep it only for
              // the native process lifetime, while retaining redacted diagnostics.
              await fs.rm(mcpPath, { force: true });
            }
          }
        ]
      });
    }
  }

  async cleanupInterrupted(_invocationId: string, runtimePath: string): Promise<void> {
    // The common ProcessHost terminates the invocation before this hook runs.
    // Remove only Claude Code's fixed invocation-local MCP credential file.
    await fs.rm(path.join(runtimePath, "claude-mcp.json"), { force: true });
  }
}

function claudeNativeUserInput(prompt: string, sessionId: string): string {
  return JSON.stringify({ type: "user", session_id: sessionId,
    message: { role: "user", content: [{ type: "text", text: prompt }] } }) + "\n";
}

function claudeSessionIdentityError(
  session: SessionRef,
  resumed: boolean,
  reason: string
): HarnessRuntimeError {
  if (resumed) {
    return new SessionResumeError(session.harnessId, session.nativeId, {
      cause: new Error(reason)
    });
  }
  return new ClaudeSessionIdentityContractError(session.harnessId, reason);
}

class ClaudeSessionIdentityContractError extends HarnessRuntimeError {
  constructor(harnessId: string, message: string) {
    super(
      "HARNESS_CONTRACT_VIOLATION",
      message,
      { harnessId },
      { source: "adapter" }
    );
    this.name = "ClaudeSessionIdentityContractError";
  }
}

function claudeMcpConfig(rows: readonly AdapterMcpRow[]): Record<string, unknown> {
  return {
    mcpServers: Object.fromEntries(rows.map((row) => [row.name,
      row.transport === "stdio"
        ? {
            type: "stdio",
            command: row.command,
            args: row.args,
            ...(row.env ? { env: row.env } : {})
          }
        : {
            type: "http",
            url: row.url,
            ...(row.headers ? { headers: row.headers } : {})
          }
    ]))
  };
}
