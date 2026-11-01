import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { AgentRunResult } from "../../types.js";
import { CodexRunner } from "../../codex-runner.js";
import type {
  HarnessAdapter,
  HarnessAdapterContext,
  HarnessAdapterRequest,
  InvocationInputs,
  SessionRef
} from "../contracts.js";
import {
  HarnessRuntimeError,
  SessionResumeError
} from "../errors.js";
import { OfficialEventBridge } from "../official-event-bridge.js";
import type { OfficialEventMapper } from "../official-event-bridge.js";
import { BUILTIN_HARNESS_DESCRIPTORS } from "../registry.js";
import { AdapterBase, type AdapterRuntimeOptions } from "./adapter-utils.js";
import { mapCodexOfficialEvent } from "./codex-event-mapper.js";
import { readCodexNativeNotification } from "./codex-native-input-history.js";

const descriptor = BUILTIN_HARNESS_DESCRIPTORS.find((item) => item.id === "codex")!;

/** Codex is a normal Registry Adapter; its mature CLI driver remains reusable. */
export class CodexAdapter extends AdapterBase implements HarnessAdapter {
  readonly readNativeNotification = readCodexNativeNotification;
  readonly resident = {
    protocol: "codex-app-server",
    recoveryStrategy: "native-session-resume",
    createOfficialEventMapper: codexResidentOfficialEventMapper
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
    // Codex owns the final thread UUID and reports it in thread.started.
    return this.session(`pending:${randomUUID()}`, generation, durable);
  }

  sessionFromLegacyId(value: string, generation: number, durable: boolean): SessionRef | undefined {
    return this.validateNativeSession(value)
      ? this.session(value, generation, durable)
      : undefined;
  }

  sessionToLegacyId(session: SessionRef): string {
    return session.nativeId;
  }

  validateNativeSession(nativeId: string): boolean {
    const normalized = nativeId.trim();
    return normalized.length > 0 &&
      normalized === nativeId &&
      !nativeId.includes("\0") &&
      !nativeId.startsWith("pending:");
  }

  async run(context: HarnessAdapterContext): Promise<AgentRunResult> {
    const executable = await this.resolveExecutable();
    if (!executable) {
      throw new HarnessRuntimeError(
        "HARNESS_UNAVAILABLE",
        `Unable to find the ${this.descriptor.label} executable`,
        { harnessId: this.descriptor.id },
        { source: "adapter" }
      );
    }
    const runner = new CodexRunner(
      executable,
      {
        ...this.options,
        harnessId: descriptor.id,
        skillsAlreadyStaged: true,
        workflowPromptPrepared: true,
        ...("nativeCodexProfileHome" in context.route
          ? { nativeCodexProfileHome: context.route.nativeCodexProfileHome } : {})
      },
      context.processHost,
      context.spec.session!
    );
    const { request, spec, route } = context;
    const sourceConfig = request.project.agents[request.agent];
    if (!sourceConfig) {
      throw new HarnessRuntimeError(
        "HARNESS_CONTRACT_VIOLATION",
        "Codex invocation is missing its selected Agent configuration",
        { harnessId: this.descriptor.id },
        { source: "runtime" }
      );
    }
    const sourceGateway = sourceConfig.gatewaySnapshot;
    if (!sourceGateway && !("nativeCodexProfileHome" in route)) throw new Error("Codex requires a validated model route");
    const explainerPrompt = spec.prompt;
    const routedConfig = {
      ...sourceConfig,
      instructions: explainerPrompt,
      mcpServers: [...spec.policy.mcpServers],
      webSearch: spec.policy.webSearch,
      gatewaySnapshot: "nativeCodexProfileHome" in route ? undefined : {
        ...sourceGateway!,
        url: route.baseUrl,
        apiKey: route.token,
        protocol: "responses" as const,
        nativeProtocol: "responses" as const,
        routeMode: "direct" as const
      }
    };
    let nativeThreadId: string | undefined;
    const bridge = new OfficialEventBridge({
      descriptor: this.descriptor,
      invocationId: spec.invocationId,
      mapEvent: mapCodexOfficialEvent,
      onActivity: request.onModelActivity,
      onEvent: context.onEvent,
      onNativeUserInput: context.onNativeUserInput
    });
    const adaptedRequest = {
      ...request,
      project: {
        ...request.project,
        agents: { ...request.project.agents, [request.agent]: routedConfig }
      },
      inboxPath: spec.inputs.inboxPath,
      projectPath: spec.inputs.projectPath,
      workspacePath: spec.inputs.workspacePath,
      runtimePath: spec.inputs.runtimePath,
      skillPaths: [...spec.policy.skillPaths],
      autoSkillPaths: [...spec.policy.autoSkillPaths],
      // The common staging layer is authoritative. Do not expose the original
      // library paths to Codex as disabled configuration entries: even a
      // disabled row leaks a host path outside the Agent workspace.
      availableSkillPaths: [],
      ...(spec.session?.resumedAt
        ? { resumeThreadId: spec.session.nativeId }
        : { resumeThreadId: undefined }),
      onThreadStarted: async (threadId) => {
        nativeThreadId = threadId;
        const officialSession: SessionRef = {
          ...spec.session!,
          nativeId: threadId
        };
        // Codex allocates its durable thread inside the native process.  Make
        // that validated identity durable as soon as thread.started arrives;
        // waiting for turn completion would lose the resumable thread on a
        // service restart or mid-turn interruption.
        await context.onSessionStarted?.(officialSession);
      },
      onOfficialHarnessEvent: (event) => bridge.accept(event),
      ...(context.prepareNativeInput ? { prepareNativeInput: context.prepareNativeInput } : {}),
      // OfficialEventBridge owns one activity notification per native frame.
      // The legacy Codex driver must not refresh the watchdog a second time.
      onModelActivity: undefined,
      // Gateway usage is recorded once by the invocation-local proxy.
      onTokenUsage: undefined
    } satisfies Parameters<CodexRunner["run"]>[0];
    const result: AgentRunResult = await runner.run(adaptedRequest, (kind, message, data) => {
      // Canonical assistant/tool events come from the official JSONL tap.
      // Keep only CLI diagnostics/lifecycle from the legacy driver.
      if (kind === "message" || kind === "tool") return;
      return context.onTrace(kind, message, {
        ...(data ?? {}),
        diagnostic: true,
        diagnosticSource: "cli",
        harness: this.descriptor.id
      });
    }, context.signal);
    await bridge.finish();
    const officialThreadId = nativeThreadId ?? result.threadId;
    if (spec.durableSession) {
      if (!officialThreadId || !this.validateNativeSession(officialThreadId)) {
        if (spec.session?.resumedAt) {
          throw new SessionResumeError(
            this.descriptor.id,
            spec.session.nativeId,
            {
              cause: new Error(
                "Codex completed a resumed durable invocation without a valid official thread identity"
              )
            }
          );
        }
        throw new HarnessRuntimeError(
          "HARNESS_CONTRACT_VIOLATION",
          "Codex completed a new durable invocation without a valid official thread identity",
          { harnessId: this.descriptor.id },
          { source: "adapter" }
        );
      }
      if (
        spec.session?.resumedAt &&
        officialThreadId !== spec.session.nativeId
      ) {
        throw new SessionResumeError(
          this.descriptor.id,
          spec.session.nativeId,
          {
            cause: new Error(
              `Codex official thread identity changed to ${officialThreadId}`
            )
          }
        );
      }
    }
    return { ...result, threadId: officialThreadId };
  }

  async cleanupInterrupted(_invocationId: string, runtimePath: string): Promise<void> {
    // The Facade has already asked CommonProcessHost to kill the invocation.
    // This Adapter hook owns only its runtime-local home cleanup.
    await fs.rm(path.join(runtimePath, "home"), { recursive: true, force: true });
  }
}

function codexResidentOfficialEventMapper(): OfficialEventMapper {
  return (frame) => {
    if (typeof frame.method !== "string") return [];
    const params = plainRecord(frame.params) ?? {};
    const turn = plainRecord(params.turn);
    return mapCodexOfficialEvent({
      ...params,
      type: frame.method.replaceAll("/", "."),
      ...(turn?.usage !== undefined && params.usage === undefined
        ? { usage: turn.usage }
        : {})
    });
  };
}

function plainRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}
