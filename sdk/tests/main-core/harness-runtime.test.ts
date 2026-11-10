import { afterEach, describe, expect, it, vi } from "vitest";
import type { ChildProcessWithoutNullStreams } from "node:child_process";
import { promises as fs, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import type { AgentRunRequest, AgentRunResult, ControlActionEnvelope, ProjectState } from "../../src/core/types.js";
import type {
  HarnessAdapter,
  HarnessAdapterContext,
  HarnessAdapterRequest,
  HarnessDescriptor,
  HarnessEvent,
  InvocationInputs,
  LaunchPlan,
  SessionRef
} from "../../src/core/harness-runtime/contracts.js";
import { AgentApiError } from "../../src/core/agent-errors.js";
import { ProtocolToolArgumentsError, SessionResumeError } from "../../src/core/harness-runtime/errors.js";
import { HarnessRuntimeFacade } from "../../src/core/harness-runtime/runtime.js";
import type { ProtocolProxyOptions } from "../../src/core/protocol-router.js";
import { SiiExperimentService, assertSiiControlAction } from "../../src/core/sii-experiments.js";
import { readCodexNativeNotification } from "../../src/core/harness-runtime/adapters/codex-native-input-history.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import {
  agentEnvironment,
  type HarnessHostOptions
} from "../../src/core/harness-runtime/runtime-support.js";
import {
  buildInvocationEnvironment,
  CommonProcessHost
} from "../../src/core/harness-runtime/process-host.js";

const roots: string[] = [];

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true })));
});

const descriptor: HarnessDescriptor = {
  schemaVersion: 1,
  id: "fixture-harness",
  label: "Fixture Harness",
  adapterVersion: "7",
  nativeProtocol: "chat-completions",
  purposes: ["workflow", "explainer", "probe"],
  executableEnv: "FIXTURE_HARNESS_BIN",
  defaultCommand: "fixture-harness",
  default: true,
  notes: "contract fixture",
  explainerIsolation: "adapter-read-only-tools",
  capabilities: {
    structuredEvents: true,
    toolResults: true,
    durableSession: true,
    permissionPrompts: ["workspace", "compute", "yolo"],
    workspaceInputs: true,
    autoSkills: true,
    officialEvents: true,
    toolEvents: true,
    usageEvents: true,
    readOnlyExplainer: true,
    webSearch: true,
    skills: true,
    mcp: true
  }
};

class FixtureAdapter implements HarnessAdapter {
  readonly descriptor: HarnessDescriptor;
  readonly contexts: HarnessAdapterContext[] = [];
  readonly sessionRequests: HarnessAdapterRequest[] = [];
  readonly createdGenerations: number[] = [];
  failNextResume = false;
  resultThreadId?: string;

  constructor(descriptorOverride: HarnessDescriptor = descriptor) {
    this.descriptor = descriptorOverride;
  }

  async resolveExecutable() { return "/bin/true"; }
  async fingerprint() { return "fixture-fingerprint"; }
  validateNativeSession(nativeId: string) { return nativeId.startsWith("fixture-native-"); }
  sessionFromLegacyId(value: string, generation: number, durable: boolean) {
    return value.startsWith("fixture:")
      ? this.session(value.slice("fixture:".length), generation, durable)
      : undefined;
  }
  sessionToLegacyId(session: SessionRef) { return `fixture:${session.nativeId}`; }
  createSession(
    request: HarnessAdapterRequest,
    _inputs: InvocationInputs,
    generation: number,
    durable: boolean
  ) {
    this.sessionRequests.push(request);
    this.createdGenerations.push(generation);
    return this.session(`fixture-native-${generation}`, generation, durable);
  }
  async run(context: HarnessAdapterContext) {
    this.contexts.push(context);
    if (this.failNextResume && context.spec.session?.resumedAt) {
      this.failNextResume = false;
      await context.onEvent({
        schemaVersion: 1,
        eventId: "adapter-local:0",
        seq: 0,
        timestamp: "2026-09-16T00:00:00.000Z",
        invocationId: context.spec.invocationId,
        harnessId: this.descriptor.id,
        kind: "lifecycle",
        phase: "started",
        message: "resume attempted"
      });
      throw new SessionResumeError(this.descriptor.id, context.spec.session.nativeId);
    }
    const events: HarnessEvent[] = [
      {
        schemaVersion: 1,
        eventId: `${context.spec.invocationId}:0`,
        seq: 0,
        timestamp: "2026-09-16T00:00:00.000Z",
        invocationId: context.spec.invocationId,
        harnessId: this.descriptor.id,
        kind: "tool.started",
        phase: "started",
        tool: { callId: "read-1", name: "read", status: "started", input: { path: "Memory.md" } }
      },
      {
        schemaVersion: 1,
        eventId: `${context.spec.invocationId}:1`,
        seq: 1,
        timestamp: "2026-09-16T00:00:01.000Z",
        invocationId: context.spec.invocationId,
        harnessId: this.descriptor.id,
        kind: "tool.completed",
        phase: "completed",
        tool: { callId: "read-1", name: "read", status: "completed", outputPreview: "memory" }
      },
      {
        schemaVersion: 1,
        eventId: `${context.spec.invocationId}:2`,
        seq: 2,
        timestamp: "2026-09-16T00:00:02.000Z",
        invocationId: context.spec.invocationId,
        harnessId: this.descriptor.id,
        kind: "assistant.message",
        phase: "completed",
        message: "fixture handoff"
      }
    ];
    for (const event of events) await context.onEvent(event);
    return {
      handoff: "fixture handoff",
      threadId: this.resultThreadId ?? context.spec.session?.nativeId
    };
  }

  private session(nativeId: string, generation: number, durable: boolean): SessionRef {
    return {
      schemaVersion: 1,
      harnessId: this.descriptor.id,
      adapterVersion: this.descriptor.adapterVersion,
      generation,
      nativeId,
      durable,
      createdAt: "2026-09-16T00:00:00.000Z"
    };
  }
}

class SmokeFixtureAdapter extends FixtureAdapter {
  override async run(context: HarnessAdapterContext) {
    this.contexts.push(context);
    const sentinelPath = path.join(
      context.spec.inputs.workspacePath,
      "openfars-smoke-sentinel.txt"
    );
    const sentinel = (await fs.readFile(sentinelPath, "utf8")).trim();
    const base = {
      schemaVersion: 1 as const,
      timestamp: "2026-09-16T00:00:00.000Z",
      invocationId: context.spec.invocationId,
      harnessId: this.descriptor.id
    };
    await context.onEvent({
      ...base,
      eventId: "fixture-smoke:0",
      seq: 0,
      kind: "tool.started",
      phase: "started",
      tool: {
        callId: "read-smoke-sentinel",
        name: "read",
        status: "started",
        input: { path: sentinelPath }
      }
    });
    await context.onEvent({
      ...base,
      eventId: "fixture-smoke:1",
      seq: 1,
      kind: "tool.completed",
      phase: "completed",
      tool: {
        callId: "read-smoke-sentinel",
        name: "read",
        status: "completed",
        outputPreview: sentinel
      }
    });
    await context.onEvent({
      ...base,
      eventId: "fixture-smoke:2",
      seq: 2,
      kind: "assistant.message",
      phase: "completed",
      message: sentinel
    });
    return {
      handoff: sentinel,
      threadId: context.spec.session?.nativeId
    };
  }
}

class SegmentedFixtureAdapter extends FixtureAdapter {
  override async run(context: HarnessAdapterContext): Promise<AgentRunResult> {
    this.contexts.push(context);
    const base = {
      schemaVersion: 1 as const,
      timestamp: "2026-09-19T00:00:00.000Z",
      invocationId: context.spec.invocationId,
      harnessId: this.descriptor.id
    };
    const events: HarnessEvent[] = [{
      ...base,
      eventId: "segment:0",
      seq: 0,
      kind: "assistant.delta",
      phase: "delta",
      message: "same "
    }, {
      ...base,
      eventId: "segment:1",
      seq: 1,
      kind: "assistant.delta",
      phase: "delta",
      message: "text"
    }, {
      ...base,
      eventId: "segment:2",
      seq: 2,
      kind: "tool.started",
      phase: "started",
      tool: { callId: "read-segment", name: "read", status: "started" }
    }, {
      // Native CLIs may publish the authoritative full pre-tool message only
      // after the tool block has started.
      ...base,
      eventId: "segment:3",
      seq: 3,
      kind: "assistant.message",
      phase: "completed",
      message: "same text"
    }, {
      ...base,
      eventId: "segment:4",
      seq: 4,
      kind: "tool.completed",
      phase: "completed",
      tool: {
        callId: "read-segment",
        name: "read",
        status: "completed",
        outputPreview: "ok"
      }
    }, {
      // Identical content after the tool is still a distinct, valid segment.
      ...base,
      eventId: "segment:5",
      seq: 5,
      kind: "assistant.message",
      phase: "completed",
      message: "same text"
    }];
    for (const event of events) await context.onEvent(event);
    return { handoff: "same text", threadId: context.spec.session?.nativeId };
  }
}

class FailingFixtureAdapter extends FixtureAdapter {
  constructor(private readonly failure: unknown) {
    super();
  }

  override async run(context: HarnessAdapterContext): Promise<never> {
    this.contexts.push(context);
    throw this.failure;
  }
}

class LeakingProcessFixtureAdapter extends FixtureAdapter {
  child?: ChildProcessWithoutNullStreams;
  markerPath?: string;
  private processHost?: HarnessAdapterContext["processHost"];
  private launchPlan?: LaunchPlan;

  constructor(private readonly failure?: Error) {
    super();
  }

  override async run(context: HarnessAdapterContext) {
    this.contexts.push(context);
    const gateway = context.request.project.agents[context.request.agent]?.gatewaySnapshot;
    if (!gateway) throw new Error("fixture Gateway missing");
    this.markerPath = path.join(context.spec.inputs.runtimePath, "harness-process.json");
    const environment = buildInvocationEnvironment({
      common: agentEnvironment(
        context.spec.inputs.workspacePath,
        context.spec.inputs.runtimePath,
        context.request.project.id,
        context.spec.invocationId,
        context.request.agent,
        context.request.kind,
        context.request.permission,
        context.spec.inputs.projectPath,
        context.spec.inputs.workspacePath,
        {},
        [],
        undefined,
        undefined,
        context.request.control,
        gateway,
        this.descriptor.id,
        this.descriptor.nativeProtocol
      )
    });
    const launchPlan: LaunchPlan = {
      command: process.execPath,
      args: ["-e", "setInterval(() => undefined, 1_000)"],
      cwd: context.spec.inputs.workspacePath,
      env: environment,
      eventFormat: "jsonl",
      session: context.spec.session!,
      rawLogLimitBytes: 1_024
    };
    this.processHost = context.processHost;
    this.launchPlan = launchPlan;
    const raw = context.processHost.startRaw(launchPlan);
    this.child = raw.child;
    if (this.failure) throw this.failure;
    return {
      handoff: "an active native process must not escape the Facade",
      threadId: context.spec.session?.nativeId
    };
  }

  attemptLateLaunch(): void {
    if (!this.processHost || !this.launchPlan) throw new Error("fixture process lease missing");
    this.processHost.startRaw(this.launchPlan);
  }
}

class HostEnvironmentTamperingFixtureAdapter extends LeakingProcessFixtureAdapter {
  override async resolveExecutable() {
    process.env.PATH = [process.env.PATH, "/adapter-controlled-bin"]
      .filter(Boolean)
      .join(path.delimiter);
    return "/bin/true";
  }
}

class SwitchingSessionFixtureAdapter extends FixtureAdapter {
  override async run(context: HarnessAdapterContext) {
    await context.onSessionStarted?.({
      ...context.spec.session!,
      nativeId: "fixture-native-switched"
    });
    return super.run(context);
  }
}

class BrokenCreateSessionFixtureAdapter extends FixtureAdapter {
  override createSession(): SessionRef {
    throw new Error("raw createSession failure");
  }
}

class BrokenLegacySessionFixtureAdapter extends FixtureAdapter {
  override sessionFromLegacyId(): SessionRef | undefined {
    throw new Error("raw sessionFromLegacyId failure");
  }
}

class IgnoredInvalidEventAdapter extends FixtureAdapter {
  override async run(context: HarnessAdapterContext) {
    this.contexts.push(context);
    void context.onEvent({
      schemaVersion: 1,
      eventId: "invalid-event",
      seq: 0,
      timestamp: "2026-09-16T00:00:00.000Z",
      invocationId: context.spec.invocationId,
      harnessId: this.descriptor.id,
      kind: "assistant.message",
      phase: "delta",
      message: "must not cross the Facade"
    });
    return {
      handoff: "invalid event must fail the invocation",
      threadId: context.spec.session?.nativeId
    };
  }
}

class ConcurrentEventAdapter extends FixtureAdapter {
  override async run(context: HarnessAdapterContext) {
    this.contexts.push(context);
    const base = {
      schemaVersion: 1 as const,
      timestamp: "2026-09-16T00:00:00.000Z",
      invocationId: context.spec.invocationId,
      harnessId: this.descriptor.id
    };
    const calls = [
      context.onEvent({
        ...base,
        eventId: "concurrent-start",
        seq: 91,
        kind: "tool.started",
        phase: "started",
        tool: { callId: "concurrent-tool", name: "read", status: "started" }
      }),
      context.onEvent({
        ...base,
        eventId: "concurrent-complete",
        seq: 4,
        kind: "tool.completed",
        phase: "completed",
        tool: { callId: "concurrent-tool", name: "read", status: "completed", outputPreview: "done" }
      }),
      context.onEvent({
        ...base,
        eventId: "concurrent-handoff",
        seq: 1,
        kind: "assistant.message",
        phase: "completed",
        message: "concurrent handoff"
      }),
      // Exact duplicate IDs are dropped by the public ingress, regardless of
      // whether a custom Adapter uses OfficialEventBridge itself.
      context.onEvent({
        ...base,
        eventId: "concurrent-handoff",
        seq: 1,
        kind: "assistant.message",
        phase: "completed",
        message: "concurrent handoff"
      })
    ];
    await Promise.all(calls);
    return {
      handoff: "concurrent handoff",
      threadId: context.spec.session?.nativeId
    };
  }
}

class ExplicitModelActivityAdapter extends FixtureAdapter {
  override async run(context: HarnessAdapterContext) {
    this.contexts.push(context);
    await context.onEvent({
      schemaVersion: 1,
      eventId: "hidden-model-progress",
      seq: 0,
      timestamp: "2026-09-16T00:00:00.000Z",
      invocationId: context.spec.invocationId,
      harnessId: this.descriptor.id,
      kind: "activity",
      phase: "delta"
    });
    return {
      handoff: "explicit activity accepted",
      threadId: context.spec.session?.nativeId
    };
  }
}

class UnpairedToolAdapter extends FixtureAdapter {
  override async run(context: HarnessAdapterContext) {
    this.contexts.push(context);
    await context.onEvent({
      schemaVersion: 1,
      eventId: "unpaired-tool",
      seq: 0,
      timestamp: "2026-09-16T00:00:00.000Z",
      invocationId: context.spec.invocationId,
      harnessId: this.descriptor.id,
      kind: "tool.started",
      phase: "started",
      tool: { callId: "left-open", name: "read", status: "started" }
    });
    return {
      handoff: "unfinished tool telemetry must not discard a successful result",
      threadId: context.spec.session?.nativeId
    };
  }
}

class OrphanToolCompletionAdapter extends FixtureAdapter {
  override async run(context: HarnessAdapterContext) {
    this.contexts.push(context);
    await context.onEvent({
      schemaVersion: 1,
      eventId: "orphan-tool-completion",
      seq: 0,
      timestamp: "2026-09-16T00:00:00.000Z",
      invocationId: context.spec.invocationId,
      harnessId: this.descriptor.id,
      kind: "tool.completed",
      phase: "completed",
      sourceType: "tool/result",
      itemId: "native-session:41",
      tool: {
        callId: "missing-start",
        name: "read",
        status: "completed",
        outputPreview: "work was already completed"
      }
    });
    return {
      handoff: "orphan telemetry must not discard a successful result",
      threadId: context.spec.session?.nativeId
    };
  }
}

class DuplicateToolCompletionAdapter extends FixtureAdapter {
  override async run(context: HarnessAdapterContext) {
    this.contexts.push(context);
    const base = {
      schemaVersion: 1 as const,
      timestamp: "2026-09-16T00:00:00.000Z",
      invocationId: context.spec.invocationId,
      harnessId: this.descriptor.id
    };
    await context.onEvent({
      ...base,
      eventId: "duplicate-tool-start",
      seq: 0,
      kind: "tool.started",
      phase: "started",
      tool: { callId: "duplicate-result", name: "read", status: "started" }
    });
    await context.onEvent({
      ...base,
      eventId: "duplicate-tool-completion-1",
      seq: 1,
      kind: "tool.completed",
      phase: "completed",
      tool: {
        callId: "duplicate-result",
        name: "read",
        status: "completed",
        outputPreview: "first result"
      }
    });
    await context.onEvent({
      ...base,
      eventId: "duplicate-tool-completion-2",
      seq: 2,
      kind: "tool.completed",
      phase: "completed",
      tool: {
        callId: "duplicate-result",
        name: "read",
        status: "completed",
        outputPreview: "replayed result"
      }
    });
    return {
      handoff: "duplicate telemetry must be idempotent",
      threadId: context.spec.session?.nativeId
    };
  }
}

class OpenToolResumeFailureAdapter extends FixtureAdapter {
  override async run(context: HarnessAdapterContext) {
    if (!context.spec.session?.resumedAt || this.contexts.length > 0) return super.run(context);
    this.contexts.push(context);
    await context.onEvent({
      schemaVersion: 1,
      eventId: "resume-open-tool",
      seq: 0,
      timestamp: "2026-09-16T00:00:00.000Z",
      invocationId: context.spec.invocationId,
      harnessId: this.descriptor.id,
      kind: "tool.started",
      phase: "started",
      sourceType: "tool/call",
      itemId: "native-resume:7",
      tool: { callId: "old-attempt-tool", name: "read", status: "started" }
    });
    throw new SessionResumeError(this.descriptor.id, context.spec.session.nativeId);
  }
}

class EmptyResultAdapter extends FixtureAdapter {
  override async run(context: HarnessAdapterContext) {
    this.contexts.push(context);
    return { handoff: "   ", threadId: context.spec.session?.nativeId };
  }
}

class ExoticResultAdapter extends FixtureAdapter {
  override async run(context: HarnessAdapterContext): Promise<AgentRunResult> {
    this.contexts.push(context);
    const result = Object.create(null) as AgentRunResult;
    result.handoff = "prototype-less results must not cross the Adapter boundary";
    result.threadId = context.spec.session?.nativeId;
    return result;
  }
}

class InvalidControlEnvelopeAdapter extends FixtureAdapter {
  override async run(context: HarnessAdapterContext) {
    const result = await super.run(context);
    return {
      ...result,
      controlActions: [{
        projectId: "different-project",
        agent: context.request.agent,
        invocationId: context.request.invocationId,
        callId: "invalid-control",
        stateVersion: context.request.control?.stateVersion ?? 0,
        receivedAt: "2026-09-16T00:00:00.000Z",
        action: { tool: "complete_project" as const, rationale: "invalid authority" }
      }]
    };
  }
}

class InvalidSelectDisplayAdapter extends FixtureAdapter {
  override async run(context: HarnessAdapterContext) {
    const result = await super.run(context);
    return {
      ...result,
      controlActions: [{
        projectId: context.request.project.id,
        agent: context.request.agent,
        invocationId: context.request.invocationId,
        callId: "invalid-select-display",
        stateVersion: context.request.control?.stateVersion ?? 0,
        capabilityHash: context.request.control?.capabilityHash,
        expiresAt: context.request.control?.expiresAt,
        receivedAt: "2026-09-16T00:00:00.000Z",
        action: {
          tool: "select_display" as const,
          primary: {
            agent: context.request.agent,
            path: 42,
            title: "Malformed display item"
          }
        }
      }]
    } as unknown as AgentRunResult;
  }
}

class TamperingResumeAdapter extends FixtureAdapter {
  resumedInbox?: string;

  override async run(context: HarnessAdapterContext) {
    if (context.spec.session?.resumedAt && this.contexts.length === 0) {
      this.contexts.push(context);
      await fs.rm(context.spec.inputs.inboxPath);
      await fs.writeFile(context.spec.inputs.inboxPath, "tampered by failed attempt\n", "utf8");
      throw new SessionResumeError(this.descriptor.id, context.spec.session.nativeId);
    }
    this.resumedInbox = readFileSync(context.spec.inputs.inboxPath, "utf8");
    return super.run(context);
  }
}

async function request(
  root: string,
  overrides: Partial<AgentRunRequest> = {}
): Promise<AgentRunRequest> {
  const projectPath = path.join(root, "prj_fixture");
  const workspacePath = path.join(projectPath, "workspaces");
  const messagesPath = path.join(projectPath, "messages");
  const runtimePath = path.join(projectPath, "runtime", "inv_fixture");
  const inboxPath = path.join(messagesPath, "0001_inv_fixture_to_main.md");
  await Promise.all([
    fs.mkdir(workspacePath, { recursive: true }),
    fs.mkdir(messagesPath, { recursive: true }),
    fs.mkdir(runtimePath, { recursive: true })
  ]);
  await Promise.all([
    fs.writeFile(inboxPath, "authoritative inbox\n", "utf8"),
    fs.writeFile(path.join(workspacePath, "Memory.md"), "persistent memory\n", "utf8")
  ]);
  const project = {
    id: "prj_fixture",
    agents: {
      main: {
        model: "fixture-model",
        harness: descriptor.id,
        gatewayId: "gwy_fixture",
        gatewaySnapshot: {
          id: "gwy_fixture",
          name: "Fixture gateway",
          url: "https://gateway.example.test/v1",
          apiKey: "upstream-secret",
          models: ["fixture-model"],
          defaultModel: "fixture-model",
          protocol: "responses",
          nativeProtocol: descriptor.nativeProtocol,
          routeMode: "proxy"
        },
        skills: [],
        autoSkills: [],
        mcpServers: [],
        instructions: "Fixture mandate.",
        reasoningEffort: "high",
        permission: "workspace",
        webSearch: false,
        sessionPersistence: true,
        decisionBy: "main"
      }
    },
    agentSessionIds: {},
    agentSessions: {},
    agentSessionMeta: {}
  } as unknown as ProjectState;
  return {
    project,
    agent: "main",
    kind: "main",
    permission: "workspace",
    invocationId: "inv_fixture",
    inboxPath,
    projectPath,
    workspacePath,
    schemaPath: path.join(projectPath, "schema.json"),
    skillPaths: [],
    autoSkillPaths: [],
    availableSkillPaths: [],
    runtimePath,
    onModelActivity: vi.fn(),
    ...overrides
  };
}

function runtime(
  adapter: FixtureAdapter,
  close = vi.fn(async () => undefined),
  hostOptions: HarnessHostOptions = {}
) {
  const protocolProxyFactory = vi.fn(async () => ({
    baseUrl: "http://127.0.0.1:43199/v1",
    token: "invocation-token",
    close
  }));
  return {
    close,
    protocolProxyFactory,
    facade: new HarnessRuntimeFacade({
      ...hostOptions,
      adapters: [adapter],
      protocolProxyFactory
    })
  };
}

describe("HarnessRuntimeFacade", () => {
  it.each([true, false, "history", "history-no-hook", "full", "periodic"] as const)("yields an unfinished SII turn and requires actual notification receipt before returning its final task result (receipt: %s)", async nativeReceipt => {
    const nativeHistory = nativeReceipt === "history" || nativeReceipt === "history-no-hook";
    const hasReceipt = nativeReceipt !== false && nativeReceipt !== "history-no-hook";
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-sii-facade-")); roots.push(root);
    const runRequest = await request(root, { permission: "workspace", taskSessionId: "sii-task", kind: "worker", agent: "experimenter" });
    runRequest.project.agents.experimenter = { ...runRequest.project.agents.main!, experimentMcp: true };
    runRequest.inboxPath = runRequest.inboxPath.replace("_to_main.md", "_to_experimenter.md");
    await fs.rename(path.join(runRequest.projectPath, "messages", "0001_inv_fixture_to_main.md"), runRequest.inboxPath);
    const oldProject = runRequest.projectPath;
    const id = "prj_bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
    const projectPath = path.join(root, id);
    await fs.rename(oldProject, projectPath);
    for (const key of ["projectPath", "workspacePath", "runtimePath", "inboxPath", "schemaPath"] as const) runRequest[key] = runRequest[key].replace(oldProject, projectPath);
    runRequest.project.id = id;
    runRequest.project.orchestration = { schemaVersion: 1 } as ProjectState["orchestration"];
    let status = "job_running";
    const service = new SiiExperimentService({ projectsRoot: root, inspireBin: "unused", workspaceRoot: root,
      knowledgeRoot: root, refreshMs: 3_600_000, accountReader: async () => "test-account",
      runJson: async args => ({ success: true, data: args.includes("create") ? { name: "native-run" } : { job: { status } } }) });
    await service.start(); await service.refreshNow();
    const adapter = new FixtureAdapter(nativeHistory ? { ...descriptor, id: "codex" } : descriptor);
    const nativeId = "01a1220c-aaa6-78c1-b64b-de7b3ef8b27f";
    // A large current mandate still belongs in the native input. Its trace
    // preview must not acknowledge a notification beyond that preview.
    if (nativeReceipt === "full") runRequest.project.agents.experimenter!.instructions = "known-authoritative-context-".repeat(1800);
    if (nativeHistory) {
      if (nativeReceipt === "history") Object.assign(adapter, { readNativeNotification: readCodexNativeNotification });
      runRequest.project.agents.experimenter!.harness = "codex";
      await fs.appendFile(runRequest.inboxPath, "known-authoritative-context-".repeat(1800));
      vi.spyOn(adapter, "validateNativeSession").mockImplementation(value => value === nativeId);
      vi.spyOn(adapter, "createSession").mockImplementation((_request, _inputs, generation, durable) => {
        adapter.createdGenerations.push(generation);
        return { schemaVersion: 1, harnessId: "codex", adapterVersion: "7", generation, nativeId, durable, createdAt: "2026-10-09T19:03:37.899Z" };
      });
    }
    const invocations: HarnessAdapterContext[] = [];
    let experimentId: string;
    const officialIds: string[] = [];
    runRequest.onOfficialHarnessEvent = event => { officialIds.push(String(event.eventId)); };
    vi.spyOn(adapter, "run").mockImplementation(async context => {
      invocations.push(context);
      await context.onEvent({ schemaVersion: 1, eventId: "native:0", seq: 0, timestamp: new Date().toISOString(), invocationId: context.spec.invocationId,
        harnessId: context.spec.harnessId, kind: "assistant.message", phase: "completed", message: `native turn ${invocations.length}` });
      if (invocations.length === 1) {
        const client = new Client({ name: "native-agent", version: "1" });
        await client.connect(new StreamableHTTPClientTransport(new URL(context.request.siiMcp!.url)));
        try {
          const submission = await client.callTool({ name: "sii_submit_experiment", arguments: { request_id: "native-run", args: ["job", "create", "--name", "native-run", "--workspace", "space", "--project", "具有能动性的科学大模型"] } });
          expect(submission.isError, JSON.stringify(submission)).not.toBe(true);
          const experiment = (submission.structuredContent as { experiment: { id: string } }).experiment;
          experimentId = experiment.id;
          const deferred = await client.callTool({ name: "sii_defer_task", arguments: { experiment_ids: [experiment.id], context: "Read metrics and validate the result." } });
          expect(deferred.isError).not.toBe(true);
        } finally { await client.close(); }
        return { threadId: context.spec.session!.nativeId, handoff: "Task pending experiment; continue when notified." +
          (nativeReceipt === "full" ? "retained-scientific-handoff-".repeat(1800) : "") };
      }
      expect(context.spec.prompt).not.toContain("Read metrics and validate the result.");
      expect(context.spec.prompt).toContain("sii_get_task_context");
      const notesClient = new Client({ name: "native-agent", version: "1" });
      await notesClient.connect(new StreamableHTTPClientTransport(new URL(context.request.siiMcp!.url)));
      try {
        const notes = await notesClient.callTool({ name: "sii_get_task_context", arguments: { field: "context" } });
        expect(notes.structuredContent).toMatchObject({ content: "Read metrics and validate the result." });
      } finally { await notesClient.close(); }
      const periodicReview = nativeReceipt === "periodic" && invocations.length === 2;
      expect(context.spec.prompt).toContain(periodicReview ? "Periodic experiment review" : '"status":"succeeded"');
      expect(context.spec.session!.nativeId).toBe(invocations[0]!.spec.session!.nativeId);
      expect(context.spec.session!.generation).toBe(invocations[0]!.spec.session!.generation);
      expect(context.spec.session!.resumedAt).toBeDefined();
      if (nativeHistory) {
        const directory = path.join(projectPath, "runtime", "harness-sessions", "experimenter", "codex", "sessions", "2026", "10", "09");
        await fs.mkdir(directory, { recursive: true });
        await fs.writeFile(path.join(directory, `rollout-2026-10-09T19-03-37-${nativeId}.jsonl`), [
          { timestamp: "2026-10-09T19:03:37.899Z", type: "session_meta", payload: { id: nativeId, cwd: runRequest.workspacePath, source: "exec", cli_version: "0.153.4" } },
          { timestamp: "2026-10-09T19:03:38.899Z", type: "response_item", payload: { type: "message", role: "user", content: [{ type: "input_text", text: context.spec.prompt }] } }
        ].map(row => JSON.stringify(row) + "\n").join(""));
        if (hasReceipt) await expect(assertSiiControlAction(id, "experimenter", runRequest.invocationId, { tool: "finish_task" })).resolves.toBeUndefined();
        else await expect(assertSiiControlAction(id, "experimenter", runRequest.invocationId, { tool: "finish_task" })).rejects.toThrow("still needs experiment results");
      }
      if (nativeReceipt === true || nativeReceipt === "periodic") await context.onEvent({ schemaVersion: 1, eventId: "native-user:1", seq: 1, timestamp: new Date().toISOString(),
        invocationId: context.spec.invocationId, harnessId: context.spec.harnessId, kind: "user.message", phase: "completed", message: context.spec.prompt });
      if (nativeReceipt === "full") {
        const event: HarnessEvent = { schemaVersion: 1, eventId: "native-user:1", seq: 1, timestamp: new Date().toISOString(),
          invocationId: context.spec.invocationId, harnessId: context.spec.harnessId, kind: "user.message", phase: "completed", message: context.spec.prompt };
        await context.onNativeUserInput?.(event);
        await context.onEvent({ ...event, message: context.spec.prompt.slice(0, 40000) });
      }
      if (periodicReview) {
        await expect(assertSiiControlAction(id, "experimenter", runRequest.invocationId, { tool: "finish_task" })).rejects.toThrow("still needs experiment results");
        const client = new Client({ name: "native-agent", version: "1" });
        await client.connect(new StreamableHTTPClientTransport(new URL(context.request.siiMcp!.url)));
        try {
          const deferred = await client.callTool({ name: "sii_defer_task", arguments: {
            experiment_ids: [experimentId!], context: "Read metrics and validate the result.", check_interval_minutes: 15
          } });
          expect(deferred.isError, JSON.stringify(deferred)).not.toBe(true);
        } finally { await client.close(); }
        return { threadId: context.spec.session!.nativeId, handoff: "Metrics reviewed; keep waiting for the experiment." };
      }
      return { threadId: context.spec.session!.nativeId, handoff: "Measured results validated; task complete." };
    });
    const onExperimentWait = vi.fn(async (_waiting: boolean) => undefined);
    runRequest.onExperimentWait = onExperimentWait;
    const facade = new HarnessRuntimeFacade({ adapters: [adapter], siiExperiments: service,
      protocolProxyFactory: vi.fn(async () => ({ baseUrl: "http://127.0.0.1:43199/v1", token: "test-route", close: async () => undefined })) });
    let taskFinished = false;
    const running = facade.run(runRequest, vi.fn(), new AbortController().signal).then(result => { taskFinished = true; return result; });
    void running.catch(() => undefined);
    try {
      await Promise.race([vi.waitFor(() => expect(onExperimentWait).toHaveBeenCalledWith(true)), running.then(() => { throw new Error("Task returned before experiment wait"); })]);
      expect(taskFinished).toBe(false); expect(invocations).toHaveLength(1);
      await service.refreshNow(); expect(invocations).toHaveLength(1);
      if (nativeReceipt === "periodic") {
        await service.mutate(projectPath, doc => { doc.experiments[0]!.nextAgentCheckAt = Date.now() - 1; });
        await vi.waitFor(() => expect(onExperimentWait.mock.calls.map(args => args[0])).toEqual([true, false, true]));
        expect(invocations).toHaveLength(2);
        expect(taskFinished).toBe(false);
        const pending = await service.document(projectPath);
        expect(pending.waits[0]!.status).toBe("waiting");
        expect(pending.experiments[0]).toMatchObject({ status: "running", checkIntervalMinutes: 15 });
        expect(pending.experiments[0]!.acknowledged).not.toBe(true);
        expect(pending.experiments[0]!.nextAgentCheckAt).toBeGreaterThan(Date.now() + 14 * 60_000);
      }
      status = "job_succeeded";
      await service.mutate(projectPath, doc => { doc.experiments[0]!.nextCheckAt = 0; }); await service.refreshNow();
      if (hasReceipt) expect((await running).handoff).toBe("Measured results validated; task complete.");
      else await expect(running).rejects.toThrow("still needs experiment results");
      expect(invocations).toHaveLength(nativeReceipt === "periodic" ? 3 : 2); expect(adapter.createdGenerations).toEqual([0]);
      expect(officialIds).toHaveLength(nativeReceipt === "periodic" ? 5 : nativeReceipt === true || nativeReceipt === "full" ? 3 : 2); expect(new Set(officialIds).size).toBe(officialIds.length);
      expect(onExperimentWait.mock.calls.map(args => args[0])).toEqual(nativeReceipt === "periodic" ? [true, false, true, false] : [true, false]);
      const doc = await service.document(projectPath);
      if (hasReceipt) expect(doc.waits).toEqual([]);
      else { expect(doc.waits[0]!.status).toBe("ready"); expect(doc.experiments[0]!.acknowledged).not.toBe(true); }
      if (nativeReceipt === "history") expect(doc.experiments[0]!.notificationReceipt).toMatchObject({
        source: "native_session_history", session: { nativeId }, history: { byteOffset: expect.any(Number), sha256: expect.any(String), nativeTimestamp: "2026-10-09T19:03:38.899Z" } });
    } finally { await service.stop(); }
  });
  it.each(["scoped-leader", "scoped-main"] as const)
    ("accepts independent failed-arrival decisions from %s without accepting duplicate or global transitions", async (role) => {
      const root = await fs.mkdtemp(path.join(os.tmpdir(), "scoped-independent-results-")); roots.push(root);
      const base = await request(root);
      const control = { stagingPath: path.join(base.runtimePath, "actions.json"), capability: "original-capability",
        capabilityHash: "f".repeat(64), stateVersion: 7, candidates: [], decisionBy: "main" as const,
        allowUserIntervention: role === "scoped-main", canComplete: false, requireBridge: true,
        collaboration: { role, nodeRunId: "node-G", groupRunId: "run-G", coordinatorEpoch: 7,
          memberNodeIds: ["business"], routeCandidates: [], failedArrivalRequestIds: ["failed-a", "failed-b"], allowReconfiguration: false } };
      const envelope = (callId: string, action: ControlActionEnvelope["action"]): ControlActionEnvelope => ({
        projectId: base.project.id, agent: base.agent, invocationId: base.invocationId, callId,
        stateVersion: 7, capabilityHash: control.capabilityHash, receivedAt: "2026-09-23T00:00:00.000Z", action });
      const choice = (callId: string, arrivalRequestId: string) => envelope(callId, { tool: "coordinate_group_task",
        groupRunId: "run-G", coordinatorEpoch: 7, arrivalRequestId, operation: "retry", rationale: "Original Agent owns its repair" });
      const actions = [choice("a", "failed-a"), envelope("own-finish", { tool: "finish_task", memory: "Both original choices are retained" }), choice("b", "failed-b")];
      const returned = { handoff: "Two independent original Agents may continue after this manager stops", controlActions: actions };
      const facade = new HarnessRuntimeFacade({ adapters: [new FixtureAdapter()] });
      expect(facade.validateResidentTurnResult(returned, { ...base, control })).toEqual(returned);
      for (const rejected of [choice("duplicate", "failed-a"), choice("outside", "outside"),
        envelope("plan", { tool: "assign_group_tasks", groupRunId: "run-G", coordinatorEpoch: 7, tasks: [{ taskId: "business", assignment: "Alternative plan" }] }),
        envelope("request-user", { tool: "request_user", message: "Alternative global transition", rationale: "Another choice" })]) {
        expect(() => facade.validateResidentTurnResult({ ...returned, controlActions: [...actions, rejected] }, { ...base, control })).toThrow(/invalid orchestration control envelope/);
        expect(() => facade.validateResidentTurnResult({ ...returned, controlActions: [rejected, ...actions] }, { ...base, control })).toThrow(/invalid orchestration control envelope/);
      }
      const stale = structuredClone(actions); (stale[2]!.action as { coordinatorEpoch: number }).coordinatorEpoch = 6;
      expect(() => facade.validateResidentTurnResult({ ...returned, controlActions: stale }, { ...base, control })).toThrow(/invalid orchestration control envelope/);
    });

  it.each(["leader", "delivery", "scoped-leader", "scoped-main"] as const)
    ("accepts an Agent's own finish_task in the %s collaboration scope", async (role) => {
      const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-scoped-finish-result-")); roots.push(root);
      const facade = new HarnessRuntimeFacade({ adapters: [new FixtureAdapter()] });
      const base = await request(root);
      const control = { stagingPath: path.join(base.runtimePath, "actions.json"), capability: "finish-capability",
        capabilityHash: "f".repeat(64), stateVersion: 3, candidates: [], decisionBy: "main" as const,
        allowUserIntervention: role === "scoped-main", canComplete: false,
        collaboration: { role, nodeRunId: "node-run", groupRunId: "group-run", coordinatorEpoch: 3,
          memberNodeIds: ["business"], routeCandidates: [], failedArrivalRequestIds: ["failed-original"],
          allowReconfiguration: false, taskId: "delivery-task" }, requireBridge: true };
      const actions: ControlActionEnvelope[] = [{ projectId: base.project.id, agent: base.agent,
        invocationId: base.invocationId, callId: "own-finish", stateVersion: control.stateVersion,
        capabilityHash: control.capabilityHash, receivedAt: "2026-09-23T00:00:00.000Z",
        action: { tool: "finish_task", summary: "My current task has finished", memory: "My own retained decision" } }];
      const result = { handoff: "original Agent handoff", controlActions: actions };
      expect(facade.validateResidentTurnResult(result, { ...base, control })).toEqual(result);
      const foreign = structuredClone(result); foreign.controlActions[0]!.invocationId = "another-invocation";
      expect(() => facade.validateResidentTurnResult(foreign, { ...base, control })).toThrow(/invalid orchestration control envelope/);
      const forbidden = structuredClone(result); forbidden.controlActions[0]!.action = { tool: "git_push" };
      expect(() => facade.validateResidentTurnResult(forbidden, { ...base, control })).toThrow(/invalid orchestration control envelope/);
    });

  it.each(["scoped-leader", "scoped-main"] as const)
    ("accepts an explicit %s repairNodeId and own finish receipt at the shared result boundary", async (role) => {
      const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-scoped-repair-result-")); roots.push(root);
      const facade = new HarnessRuntimeFacade({ adapters: [new FixtureAdapter()] });
      const base = await request(root);
      const control = { stagingPath: path.join(base.runtimePath, "actions.json"), capability: "repair-capability",
        capabilityHash: "f".repeat(64), stateVersion: 3, candidates: [], decisionBy: "main" as const,
        allowUserIntervention: role === "scoped-main", canComplete: false,
        collaboration: { role, nodeRunId: "node-run", groupRunId: "group-run", coordinatorEpoch: 3,
          memberNodeIds: role === "scoped-main" ? [] : ["business"], routeCandidates: [],
          failedArrivalRequestIds: ["failed-original"], allowReconfiguration: false }, requireBridge: true };
      const envelope = (callId: string, action: ControlActionEnvelope["action"]): ControlActionEnvelope => ({
        projectId: base.project.id, agent: base.agent, invocationId: base.invocationId, callId,
        stateVersion: control.stateVersion, capabilityHash: control.capabilityHash,
        receivedAt: "2026-09-23T00:00:00.000Z", action
      });
      const coordination = { tool: "coordinate_group_task" as const, groupRunId: "group-run", coordinatorEpoch: 3,
        arrivalRequestId: "failed-original", operation: "retry" as const,
        rationale: "Original group final PR conflict needs its business Agent", repairNodeId: "business" };
      const result = { handoff: "Manager chose original final repair", controlActions: [envelope("repair", coordination),
        envelope("own-finish", { tool: "finish_task", memory: "Retain the actual repair choice" })] };
      expect(facade.validateResidentTurnResult(result, { ...base, control })).toEqual(result);
      expect(facade.validateResidentTurnResult({ handoff: result.handoff,
        controlActions: [envelope("repair-only", coordination)] }, { ...base, control })).toMatchObject({ controlActions: [{ action: coordination }] });
      for (const invalid of ["", " ", "x".repeat(257), "bad\u0000node"]) {
        expect(() => facade.validateResidentTurnResult({ handoff: result.handoff,
          controlActions: [envelope("invalid-repair", { ...coordination, repairNodeId: invalid })] }, { ...base, control }))
          .toThrow(/invalid orchestration control envelope/);
      }
      const stale = { ...coordination, coordinatorEpoch: 2 };
      expect(() => facade.validateResidentTurnResult({ handoff: result.handoff,
        controlActions: [envelope("stale-repair", stale)] }, { ...base, control })).toThrow(/invalid orchestration control envelope/);
    });

  it("validates v2 group task identities on the shared resident result boundary", async () => {
    const adapter = new FixtureAdapter();
    const facade = new HarnessRuntimeFacade({ adapters: [adapter] });
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-group-validation-"));
    roots.push(root);
    const base = await request(root, {
      invocationId: "inv_group_validation"
    });
    const control = {
      stagingPath: path.join(base.runtimePath, "actions.json"),
      capability: "group-validation-capability",
      capabilityHash: "f".repeat(64),
      stateVersion: 3,
      candidates: [],
      decisionBy: "main" as const,
      allowUserIntervention: false,
      canComplete: false,
      collaboration: {
        nodeRunId: "node-run",
        groupRunId: "group-run",
        role: "leader" as const,
        coordinatorEpoch: 3
      },
      requireBridge: true
    };
    const scoped = { ...base, control };
    const result = (tasks: Array<Record<string, unknown>>): AgentRunResult => ({
      handoff: "group tasks assigned",
      controlActions: [{
        projectId: scoped.project.id,
        agent: scoped.agent,
        invocationId: scoped.invocationId,
        callId: "assign-group",
        stateVersion: control.stateVersion,
        capabilityHash: control.capabilityHash,
        receivedAt: "2026-09-23T00:00:00.000Z",
        action: {
          tool: "assign_group_tasks",
          groupRunId: "group-run",
          coordinatorEpoch: 3,
          tasks
        }
      }]
    } as unknown as AgentRunResult);

    expect(facade.validateResidentTurnResult(result([{
      taskId: "task-a",
      assignment: "Implement the first slice",
      dependencyTaskIds: []
    }]), scoped)).toMatchObject({
      controlActions: [{ action: { tasks: [{ taskId: "task-a" }] } }]
    });
    expect(() => facade.validateResidentTurnResult(result([{
      assignment: "Missing stable identity"
    }]), scoped)).toThrow(/invalid orchestration control envelope/);
  });

  it("accepts native Explainer tools under the shared role policy", async () => {
    const adapter = new FixtureAdapter();
    const facade = new HarnessRuntimeFacade({
      adapters: [adapter],
      explainerSandboxMode: "danger-full-access",
      explainerSandboxVerified: false
    });

    expect(() => facade.assertExplainerAvailable(descriptor.id)).not.toThrow();
    const catalog = await facade.harnessCatalog();
    expect(catalog[0]!.purposes).toContain("explainer");
    expect(adapter.contexts).toHaveLength(0);
  });

  it("does not require role-specific read-only isolation for Explainer", () => {
    const hostDescriptor: HarnessDescriptor = {
      ...descriptor,
      id: "fixture-host-sandbox",
      defaultCommand: "fixture-host-sandbox",
      executableEnv: "FIXTURE_HOST_SANDBOX_BIN",
      explainerIsolation: "host-read-only-sandbox"
    };
    const adapter = new FixtureAdapter(hostDescriptor);
    const facade = new HarnessRuntimeFacade({ adapters: [adapter] });

    expect(() => facade.assertExplainerAvailable(hostDescriptor.id)).not.toThrow();
    expect(adapter.contexts).toHaveLength(0);
  });

  it("cleans up a purpose-specific Adapter without assuming workflow support", async () => {
    const explainerDescriptor: HarnessDescriptor = {
      ...descriptor,
      id: "fixture-explainer-only",
      defaultCommand: "fixture-explainer-only",
      executableEnv: "FIXTURE_EXPLAINER_ONLY_BIN",
      purposes: ["explainer"],
      default: true
    };
    const adapter = new FixtureAdapter(explainerDescriptor);
    const cleanupInterrupted = vi.fn(async () => undefined);
    Object.assign(adapter, { cleanupInterrupted });
    const facade = new HarnessRuntimeFacade({ adapters: [adapter] });
    const runtimePath = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-cleanup-purpose-"));
    roots.push(runtimePath);

    await facade.cleanupInterrupted("inv_cleanup", runtimePath);

    expect(cleanupInterrupted).toHaveBeenCalledWith("inv_cleanup", runtimePath);
  });

  it("attempts every interrupted cleanup, including after synchronous failures", async () => {
    const adapter = new FixtureAdapter();
    const cleanupInterrupted = vi.fn((): Promise<void> => {
      throw new Error("adapter cleanup raw detail");
    });
    Object.assign(adapter, { cleanupInterrupted });
    const laterDescriptor: HarnessDescriptor = {
      ...descriptor,
      id: "fixture-cleanup-later",
      label: "Fixture Cleanup Later",
      executableEnv: "FIXTURE_CLEANUP_LATER_BIN",
      defaultCommand: "fixture-cleanup-later",
      default: undefined
    };
    const laterAdapter = new FixtureAdapter(laterDescriptor);
    const laterCleanup = vi.fn(async () => undefined);
    Object.assign(laterAdapter, { cleanupInterrupted: laterCleanup });
    class FailingCleanupHost extends CommonProcessHost {
      override cleanupInterrupted(): Promise<void> {
        throw new Error("process cleanup raw detail");
      }
    }
    const facade = new HarnessRuntimeFacade({
      adapters: [adapter, laterAdapter],
      processHost: new FailingCleanupHost()
    });
    const runtimePath = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-cleanup-all-"));
    roots.push(runtimePath);

    await expect(facade.cleanupInterrupted("inv_cleanup_all", runtimePath)).rejects.toMatchObject({
      code: "HARNESS_CONTRACT_VIOLATION",
      source: "runtime",
      message: "Interrupted Harness cleanup did not complete",
      details: {
        cleanupPhases: ["process-host", `adapter:${descriptor.id}`]
      }
    });
    expect(cleanupInterrupted).toHaveBeenCalledOnce();
    expect(laterCleanup).toHaveBeenCalledOnce();
  });

  it("exposes only probe-capable Adapters to the Gateway smoke matrix", () => {
    const workflowDescriptor: HarnessDescriptor = {
      ...descriptor,
      purposes: ["workflow"],
      explainerIsolation: undefined,
      capabilities: { ...descriptor.capabilities, readOnlyExplainer: false }
    };
    const probeDescriptor: HarnessDescriptor = {
      ...workflowDescriptor,
      id: "fixture-probe-only",
      label: "Fixture Probe Only",
      default: undefined,
      defaultCommand: "fixture-probe-only",
      executableEnv: "FIXTURE_PROBE_ONLY_BIN",
      purposes: ["probe"]
    };
    const facade = new HarnessRuntimeFacade({
      adapters: [
        new FixtureAdapter(workflowDescriptor),
        new FixtureAdapter(probeDescriptor)
      ]
    });

    expect(facade.harnessIds()).toEqual([probeDescriptor.id]);
  });

  it("runs a fifth Adapter through shared inputs, policy, proxy, Session and canonical events", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-runtime-fixture-"));
    roots.push(root);
    const adapter = new FixtureAdapter();
    const { facade, protocolProxyFactory, close } = runtime(adapter);
    const official = vi.fn();
    const onDurableSessionStarted = vi.fn();
    const onSessionStarted = vi.fn();
    const onThreadStarted = vi.fn();
    const traces: Array<{ type: string; data?: Record<string, unknown> }> = [];
    const skillPath = path.join(root, "skill-library", "fixture-skill", "SKILL.md");
    await fs.mkdir(path.dirname(skillPath), { recursive: true });
    await fs.writeFile(skillPath, "# Fixture Skill\n", "utf8");
    const runRequest = await request(root, {
      onOfficialHarnessEvent: official,
      gatewayModelFetch: vi.fn(async () => new Response("fixture transport")),
      onDurableSessionStarted,
      onSessionStarted,
      onThreadStarted,
      skillPaths: [skillPath],
      availableSkillPaths: [skillPath]
    });

    const result = await facade.run(
      runRequest,
      (type, _message, data) => { traces.push({ type, data }); },
      new AbortController().signal
    );

    expect(result).toMatchObject({ handoff: "fixture handoff", threadId: "fixture:fixture-native-0" });
    expect(protocolProxyFactory).toHaveBeenCalledWith(expect.objectContaining({
      sourceProtocol: "chat-completions",
      targetProtocol: "responses",
      force: true,
      gatewayApiKey: "upstream-secret",
      modelFetch: runRequest.gatewayModelFetch,
      onActivity: runRequest.onModelActivity
    }));
    expect(close).toHaveBeenCalledOnce();
    expect(adapter.contexts).toHaveLength(1);
    const context = adapter.contexts[0]!;
    expect(context.route).toMatchObject({
      baseUrl: "http://127.0.0.1:43199/v1",
      token: "invocation-token"
    });
    expect(context.spec.inputs.inboxPath).not.toBe(runRequest.inboxPath);
    expect(await fs.readFile(context.spec.inputs.inboxPath, "utf8")).toBe("authoritative inbox\n");
    expect(context.spec.prompt).toContain("authoritative inbox\n");
    expect(context.spec.prompt).toContain(`项目入口：${context.spec.inputs.projectPath}`);
    expect(context.spec.prompt).not.toContain("Persistent project memory:");
    expect(context.spec.prompt).toContain("ScienceEvolve permission mode: workspace");
    expect(context.spec.policy.skillPaths).toHaveLength(1);
    expect(context.spec.policy.skillPaths[0]).toContain(
      `${path.sep}.scienceevolve${path.sep}agent-skills${path.sep}main${path.sep}skills${path.sep}fixture-skill${path.sep}SKILL.md`
    );
    expect(context.spec).not.toHaveProperty("shellProxy");
    expect(await fs.readdir(runRequest.runtimePath)).not.toContain("shell-direct.bash");
    expect(await fs.readFile(context.spec.policy.skillPaths[0]!, "utf8")).toContain("Fixture Skill");
    expect(context.spec.prompt).not.toContain(context.spec.policy.skillPaths[0]!);
    expect(Object.isFrozen(context.spec)).toBe(true);
    expect(Object.isFrozen(context.spec.session)).toBe(true);
    expect(context.recoveryBudget).not.toHaveProperty("startAttempt");
    expect(context.spec.prompt).not.toContain(skillPath);
    expect(context.request.inboxPath).toBe(context.spec.inputs.inboxPath);
    expect(context.request.schemaPath).toBe("");
    expect(context.request.skillPaths).toEqual([]);
    expect(Object.keys(context.request.project.agents)).toEqual(["main"]);
    expect(context.request.project.agents.main?.gatewaySnapshot).toMatchObject({
      url: "http://127.0.0.1:43199/v1",
      apiKey: "invocation-token",
      protocol: descriptor.nativeProtocol,
      nativeProtocol: descriptor.nativeProtocol,
      routeMode: "direct"
    });
    expect(JSON.stringify(context.request)).not.toContain("upstream-secret");
    expect(JSON.stringify(context.request)).not.toContain(runRequest.inboxPath);
    expect(adapter.sessionRequests).toHaveLength(1);
    expect(adapter.sessionRequests[0]?.inboxPath).toBe(context.spec.inputs.inboxPath);
    expect(adapter.sessionRequests[0]).not.toHaveProperty("onDurableSessionStarted");
    expect(adapter.sessionRequests[0]).not.toHaveProperty("onSessionStarted");
    expect(adapter.sessionRequests[0]).not.toHaveProperty("onThreadStarted");
    expect(adapter.sessionRequests[0]).not.toHaveProperty("onOfficialHarnessEvent");
    expect(adapter.sessionRequests[0]).not.toHaveProperty("onTokenUsage");
    expect(adapter.sessionRequests[0]).not.toHaveProperty("gatewayModelFetch");
    expect(context.request).not.toHaveProperty("onDurableSessionStarted");
    expect(context.request).not.toHaveProperty("onOfficialHarnessEvent");
    expect(context.request).not.toHaveProperty("onTokenUsage");
    expect(context.request).not.toHaveProperty("gatewayModelFetch");
    expect(adapter.sessionRequests[0]?.project.agents.main?.gatewaySnapshot).toMatchObject({
      url: "about:blank",
      apiKey: ""
    });
    expect(official).toHaveBeenCalledTimes(3);
    expect(traces.filter((trace) => trace.data?.canonicalEvent)).toHaveLength(3);
    expect(onDurableSessionStarted).toHaveBeenCalledOnce();
    expect(onDurableSessionStarted).toHaveBeenCalledWith(
      expect.objectContaining({
        harnessId: "fixture-harness",
        durable: true
      }),
      "fixture:fixture-native-0"
    );
    expect(onSessionStarted).not.toHaveBeenCalled();
    expect(onThreadStarted).not.toHaveBeenCalled();
  });

  it("assigns stable segment IDs across deltas and tools without deduplicating repeated text", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-runtime-segments-"));
    roots.push(root);
    const adapter = new SegmentedFixtureAdapter();
    const { facade } = runtime(adapter);
    const live: HarnessEvent[] = [];
    const traces: HarnessEvent[] = [];
    const runRequest = await request(root, {
      onLiveHarnessEvent: (event) => live.push(event)
    });

    await facade.run(
      runRequest,
      (_type, _message, data) => {
        if (data?.canonicalEvent) {
          traces.push(data.canonicalEvent as unknown as HarnessEvent);
        }
      },
      new AbortController().signal
    );

    const assistantEvents = live.filter((event) =>
      event.kind === "assistant.delta" || event.kind === "assistant.message"
    );
    expect(assistantEvents.slice(0, 3).map((event) => event.itemId))
      .toEqual(["assistant-0-0", "assistant-0-0", "assistant-0-0"]);
    expect(live.find((event) => event.kind === "tool.started")).toMatchObject({
      parentItemId: "assistant-0-0"
    });
    expect(assistantEvents.at(-1)).toMatchObject({
      kind: "assistant.message",
      itemId: "assistant-0-1",
      message: "same text"
    });
    expect(traces.filter((event) => event.kind === "assistant.message")).toEqual([
      expect.objectContaining({ itemId: "assistant-0-0", message: "same text" }),
      expect.objectContaining({ itemId: "assistant-0-1", message: "same text" })
    ]);
    expect(traces.some((event) => event.kind === "assistant.delta")).toBe(false);
  });

  it("kills and rejects a fifth Adapter that returns with an active native process", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-runtime-leaking-adapter-"));
    roots.push(root);
    const adapter = new LeakingProcessFixtureAdapter();
    const { facade, close } = runtime(adapter);

    await expect(facade.run(
      await request(root),
      () => undefined,
      new AbortController().signal
    )).rejects.toMatchObject({
      code: "HARNESS_CONTRACT_VIOLATION",
      source: "process",
      message: "Harness Adapter returned while its native process was still active"
    });

    expect(adapter.child).toBeDefined();
    expect(adapter.child!.exitCode !== null || adapter.child!.signalCode !== null).toBe(true);
    expect(adapter.markerPath).toBeDefined();
    await expect(fs.access(adapter.markerPath!)).rejects.toThrow();
    expect(() => adapter.attemptLateLaunch()).toThrow(/process lease has already been finalized/);
    expect(close).toHaveBeenCalledOnce();
  });

  it("preserves a fifth Adapter's primary error while quiescing its leaked native process", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-runtime-failing-leak-"));
    roots.push(root);
    const adapter = new LeakingProcessFixtureAdapter(
      new AgentApiError("provider", "raw provider detail")
    );
    const { facade, close } = runtime(adapter);
    const diagnostics: Array<{ message: string; data?: Record<string, unknown> }> = [];

    await expect(facade.run(
      await request(root),
      (_type, message, data) => { diagnostics.push({ message, data }); },
      new AbortController().signal
    )).rejects.toMatchObject({
      code: "MODEL_PROVIDER_FAILED",
      source: "gateway",
      message: "Model provider request failed"
    });

    expect(adapter.child).toBeDefined();
    expect(adapter.child!.exitCode !== null || adapter.child!.signalCode !== null).toBe(true);
    expect(adapter.markerPath).toBeDefined();
    await expect(fs.access(adapter.markerPath!)).rejects.toThrow();
    expect(diagnostics).toContainEqual({
      message: "Harness Adapter left an active native process after failing",
      data: expect.objectContaining({
        cleanupFailureSuppressed: true,
        errorCode: "HARNESS_CONTRACT_VIOLATION"
      })
    });
    expect(close).toHaveBeenCalledOnce();
  });

  it("rejects a fifth Adapter that rewrites Facade-captured host environment before launch", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-runtime-env-tamper-"));
    roots.push(root);
    const adapter = new HostEnvironmentTamperingFixtureAdapter();
    const { facade, close } = runtime(adapter);
    const previousPath = process.env.PATH;
    try {
      await expect(facade.run(
        await request(root),
        () => undefined,
        new AbortController().signal
      )).rejects.toMatchObject({
        code: "HARNESS_CONTRACT_VIOLATION",
        source: "process",
        message: "Harness launch environment has an invalid PATH"
      });
    } finally {
      if (previousPath === undefined) delete process.env.PATH;
      else process.env.PATH = previousPath;
    }

    expect(adapter.child).toBeUndefined();
    expect(close).toHaveBeenCalledOnce();
  });

  it("rejects an invalid canonical event even when the Adapter ignores its Promise", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-runtime-event-reject-"));
    roots.push(root);
    const { facade } = runtime(new IgnoredInvalidEventAdapter());

    await expect(facade.run(
      await request(root),
      () => undefined,
      new AbortController().signal
    )).rejects.toMatchObject({
      code: "HARNESS_EVENT_STREAM_FAILED",
      source: "adapter"
    });
  });

  it("preserves the original event storage failure through canonical event ingress", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-runtime-event-storage-failure-"));
    roots.push(root);
    const { facade, close } = runtime(new FixtureAdapter());
    const failure = Object.assign(new Error("disk I/O error"), { code: "ERR_SQLITE_ERROR", errcode: 778 });
    const runRequest = await request(root, { onOfficialHarnessEvent: () => { throw failure; } });
    const error = await facade.run(runRequest, () => undefined, new AbortController().signal).catch(error => error);
    expect(error).toMatchObject({ code: "HARNESS_EVENT_STREAM_FAILED", safeMessage: "Unable to publish a canonical Harness event" });
    expect(error.cause).toBe(failure);
    expect(close).toHaveBeenCalledOnce();
  });

  it("serializes concurrent Adapter events and de-duplicates an exact event ID", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-runtime-event-order-"));
    roots.push(root);
    const { facade } = runtime(new ConcurrentEventAdapter());
    const events: HarnessEvent[] = [];
    const runRequest = await request(root, {
      onOfficialHarnessEvent: (event) => {
        events.push(event as unknown as HarnessEvent);
      }
    });

    await expect(facade.run(
      runRequest,
      () => undefined,
      new AbortController().signal
    )).resolves.toMatchObject({ handoff: "concurrent handoff" });

    expect(events.map((event) => [event.seq, event.kind])).toEqual([
      [0, "tool.started"],
      [1, "tool.completed"],
      [2, "assistant.message"]
    ]);
    expect(runRequest.onModelActivity).toHaveBeenCalledTimes(3);
    expect((runRequest.onModelActivity as ReturnType<typeof vi.fn>).mock.calls.map(
      ([activity]) => activity
    )).toEqual([
      expect.objectContaining({ kind: "tool", phase: "started", callId: "concurrent-tool" }),
      expect.objectContaining({ kind: "tool", phase: "completed", callId: "concurrent-tool" }),
      expect.objectContaining({ kind: "model", phase: "completed" })
    ]);
  });

  it("treats an explicitly mapped body-free activity event as substantive model progress", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-runtime-model-activity-"));
    roots.push(root);
    const { facade } = runtime(new ExplicitModelActivityAdapter());
    const events: HarnessEvent[] = [];
    const runRequest = await request(root, {
      onOfficialHarnessEvent: (event) => {
        events.push(event as unknown as HarnessEvent);
      }
    });

    await expect(facade.run(
      runRequest,
      () => undefined,
      new AbortController().signal
    )).resolves.toMatchObject({ handoff: "explicit activity accepted" });

    expect(events).toEqual([
      expect.objectContaining({ kind: "activity", phase: "delta" })
    ]);
    expect(runRequest.onModelActivity).toHaveBeenCalledOnce();
    expect(runRequest.onModelActivity).toHaveBeenCalledWith({
      kind: "model",
      phase: "delta",
      source: "harness"
    });
  });

  it.each(["", "Evidence verified."])("carries optional visible summaries through live and durable research traces (%j)", async message => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-visible-summary-"));
    roots.push(root);
    const adapter = new FixtureAdapter();
    vi.spyOn(adapter, "run").mockImplementation(async context => {
      const base = { schemaVersion: 1 as const, timestamp: "2026-11-09T00:00:00.000Z",
        invocationId: context.spec.invocationId, harnessId: adapter.descriptor.id };
      await context.onEvent({ ...base, eventId: "public-summary", seq: 0, kind: "reasoning.summary", phase: "delta", itemId: "summary", message });
      await context.onEvent({ ...base, eventId: "model-activity", seq: 1, kind: "activity", phase: "delta" });
      return { handoff: "Actual task result", threadId: context.spec.session?.nativeId };
    });
    const { facade } = runtime(adapter);
    const live: HarnessEvent[] = [], history: HarnessEvent[] = [];
    const runRequest = await request(root, { onLiveHarnessEvent: event => { live.push(event); } });
    await expect(facade.run(runRequest, (_kind, _message, data) => {
      if (data?.canonicalEvent) history.push(data.canonicalEvent as unknown as HarnessEvent);
    }, new AbortController().signal)).resolves.toMatchObject({ handoff: "Actual task result" });
    expect(live.find(event => event.kind === "reasoning.summary")).toMatchObject({ message });
    expect(history.filter(event => event.kind === "reasoning.summary")).toHaveLength(message ? 1 : 0);
    expect(history.find(event => event.kind === "activity")).toMatchObject({ kind: "activity" });
    expect(runRequest.onModelActivity).toHaveBeenCalledTimes(message ? 2 : 1);
    expect(runRequest.onModelActivity).toHaveBeenNthCalledWith(1, { kind: "model", phase: "delta", source: "harness" });
    expect(history.some(event => event.kind === "assistant.message")).toBe(false);
  });

  it("preserves a successful Adapter result when a tool start has no completion", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-runtime-tool-open-"));
    roots.push(root);
    const { facade } = runtime(new UnpairedToolAdapter());
    const events: HarnessEvent[] = [];

    await expect(facade.run(
      await request(root, {
        onOfficialHarnessEvent: (event) => events.push(event as unknown as HarnessEvent)
      }),
      () => undefined,
      new AbortController().signal
    )).resolves.toMatchObject({
      handoff: "unfinished tool telemetry must not discard a successful result"
    });

    expect(events).toEqual([
      expect.objectContaining({ kind: "tool.started" }),
      expect.objectContaining({
        kind: "diagnostic",
        sourceType: "tool.lifecycle.stream_end",
        diagnostic: expect.objectContaining({ level: "warning" })
      })
    ]);
  });

  it("downgrades an orphan tool completion to a diagnostic event", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-runtime-tool-orphan-"));
    roots.push(root);
    const { facade } = runtime(new OrphanToolCompletionAdapter());
    const events: HarnessEvent[] = [];

    await expect(facade.run(
      await request(root, {
        onOfficialHarnessEvent: (event) => events.push(event as unknown as HarnessEvent)
      }),
      () => undefined,
      new AbortController().signal
    )).resolves.toMatchObject({
      handoff: "orphan telemetry must not discard a successful result"
    });

    expect(events).toEqual([
      expect.objectContaining({
        kind: "diagnostic",
        itemId: "native-session:41",
        sourceType: "tool.lifecycle.orphan_completion",
        message: expect.stringContaining("missing-start")
      })
    ]);
  });

  it("keeps the first tool completion and ignores a replayed completion", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-runtime-tool-duplicate-"));
    roots.push(root);
    const { facade } = runtime(new DuplicateToolCompletionAdapter());
    const events: HarnessEvent[] = [];

    await expect(facade.run(
      await request(root, {
        onOfficialHarnessEvent: (event) => events.push(event as unknown as HarnessEvent)
      }),
      () => undefined,
      new AbortController().signal
    )).resolves.toMatchObject({ handoff: "duplicate telemetry must be idempotent" });

    expect(events.map((event) => event.kind)).toEqual([
      "tool.started",
      "tool.completed",
      "diagnostic"
    ]);
    expect(events.at(-1)).toMatchObject({
      sourceType: "tool.lifecycle.duplicate_completion",
      diagnostic: expect.objectContaining({ level: "warning" })
    });
  });

  it("rejects an empty final handoff at the public Adapter result boundary", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-runtime-empty-result-"));
    roots.push(root);
    const { facade } = runtime(new EmptyResultAdapter());

    await expect(facade.run(
      await request(root),
      () => undefined,
      new AbortController().signal
    )).rejects.toMatchObject({
      code: "HARNESS_CONTRACT_VIOLATION",
      message: "Fixture Harness returned an invalid natural-language handoff",
      details: expect.objectContaining({ reason: "handoff is empty" })
    });
  });

  it("rejects a non-plain object at the public Adapter result boundary", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-runtime-exotic-result-"));
    roots.push(root);
    const { facade } = runtime(new ExoticResultAdapter());

    await expect(facade.run(
      await request(root),
      () => undefined,
      new AbortController().signal
    )).rejects.toMatchObject({
      code: "HARNESS_CONTRACT_VIOLATION",
      message: "Fixture Harness returned an invalid invocation result"
    });
  });

  it("rejects a control envelope that is not bound to this invocation", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-runtime-control-result-"));
    roots.push(root);
    const { facade } = runtime(new InvalidControlEnvelopeAdapter());
    const runRequest = await request(root);
    runRequest.control = {
      stagingPath: path.join(runRequest.runtimePath, "control-actions.json"),
      capability: "fixture-capability",
      stateVersion: 7,
      candidates: ["finish"],
      decisionBy: "main",
      allowUserIntervention: false,
      canComplete: true
    };

    await expect(facade.run(
      runRequest,
      () => undefined,
      new AbortController().signal
    )).rejects.toMatchObject({
      code: "HARNESS_CONTRACT_VIOLATION",
      message: "Fixture Harness returned an invalid orchestration control envelope"
    });
  });

  it("rejects malformed select_display items at the public Adapter result boundary", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-runtime-display-result-"));
    roots.push(root);
    const { facade } = runtime(new InvalidSelectDisplayAdapter());
    const runRequest = await request(root);
    runRequest.control = {
      stagingPath: path.join(runRequest.runtimePath, "control-actions.json"),
      capability: "fixture-capability",
      stateVersion: 7,
      candidates: ["finish"],
      decisionBy: "main",
      allowUserIntervention: false,
      canComplete: true
    };

    await expect(facade.run(
      runRequest,
      () => undefined,
      new AbortController().signal
    )).rejects.toMatchObject({
      code: "HARNESS_CONTRACT_VIOLATION",
      message: "Fixture Harness returned an invalid orchestration control envelope"
    });
  });

  it("rebuilds a tampered mirror before resuming the original Session", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-runtime-replacement-input-"));
    roots.push(root);
    const adapter = new TamperingResumeAdapter();
    const { facade } = runtime(adapter);
    const runRequest = await request(root);
    runRequest.project.agentSessions = {
      main: {
        schemaVersion: 1,
        harnessId: descriptor.id,
        adapterVersion: descriptor.adapterVersion,
        generation: 4,
        nativeId: "fixture-native-existing",
        durable: true,
        createdAt: "2026-09-16T00:00:00.000Z"
      }
    };
    runRequest.resumeThreadId = "fixture:fixture-native-existing";

    await facade.run(runRequest, () => undefined, new AbortController().signal);

    expect(adapter.resumedInbox).toBe("authoritative inbox\n");
    expect(await fs.readFile(runRequest.inboxPath, "utf8")).toBe("authoritative inbox\n");
    expect(adapter.contexts[0]?.request.resumeThreadId).toBe("fixture:fixture-native-existing");
    expect(adapter.contexts[1]?.request.resumeThreadId).toBe("fixture:fixture-native-existing");
    expect(adapter.createdGenerations).toEqual([]);
    expect(adapter.contexts[1]?.request.project.agentSessions?.main).toMatchObject({
      generation: 4,
      nativeId: "fixture-native-existing"
    });
  });

  it.runIf(process.platform !== "win32")("stages the shared Inspire wrapper before a fixture compute Adapter starts", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-runtime-compute-"));
    roots.push(root);
    const inspireBin = path.join(root, "fake-inspire.sh");
    await fs.writeFile(inspireBin, "#!/bin/sh\nexit 0\n", { mode: 0o700 });
    const adapter = new FixtureAdapter();
    const { facade } = runtime(adapter, vi.fn(async () => undefined), {
      inspireBin,
      inspireWorkspaceRoot: root
    });
    const runRequest = await request(root, { permission: "compute" });
    runRequest.project.agents.main!.permission = "compute";

    await facade.run(
      runRequest,
      () => undefined,
      new AbortController().signal
    );

    expect(adapter.contexts).toHaveLength(1);
    const runtimePath = adapter.contexts[0]!.spec.inputs.runtimePath;
    const wrapperPath = path.join(runtimePath, "bin", "inspire");
    const recorderPath = path.join(
      runtimePath,
      "bin",
      "scienceevolve-inspire-workload-recorder.mjs"
    );
    expect(await fs.readFile(wrapperPath, "utf8")).toContain(inspireBin);
    expect(await fs.readFile(recorderPath, "utf8")).toContain(
      "SCIENCEEVOLVE_INSPIRE_WORKLOAD_LEDGER"
    );
    expect((await fs.stat(wrapperPath)).mode & 0o777).toBe(0o700);
    expect((await fs.stat(recorderPath)).mode & 0o777).toBe(0o600);
  });

  it("rejects a compute workspace outside the configured Inspire root before Adapter dispatch", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-runtime-compute-root-"));
    roots.push(root);
    const inspireBin = path.join(root, "fake-inspire.sh");
    await fs.writeFile(inspireBin, "#!/bin/sh\nexit 0\n", { mode: 0o700 });
    const adapter = new FixtureAdapter();
    const { facade, protocolProxyFactory } = runtime(
      adapter,
      vi.fn(async () => undefined),
      {
        inspireBin,
        inspireWorkspaceRoot: path.join(root, "different-root")
      }
    );
    const runRequest = await request(root, { permission: "compute" });
    runRequest.project.agents.main!.permission = "compute";

    await expect(facade.run(
      runRequest,
      () => undefined,
      new AbortController().signal
    )).rejects.toThrow("Execution workspace must be under the configured Inspire qb-ilm root");
    expect(adapter.contexts).toHaveLength(0);
    expect(protocolProxyFactory).not.toHaveBeenCalled();
  });

  it("closes a newly opened Gateway route when its ready trace cannot be stored", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-runtime-route-trace-"));
    roots.push(root);
    const adapter = new FixtureAdapter();
    const close = vi.fn(async () => undefined);
    const { facade } = runtime(adapter, close);
    const runRequest = await request(root);

    await expect(facade.run(
      runRequest,
      (_kind, message) => {
        if (message === "Invocation gateway route ready") {
          throw new Error("trace storage unavailable");
        }
      },
      new AbortController().signal
    )).rejects.toMatchObject({
      code: "PROTOCOL_ROUTE_FAILED",
      source: "gateway",
      message: "Invocation Gateway route initialization could not be recorded"
    });

    expect(close).toHaveBeenCalledOnce();
    expect(adapter.contexts).toHaveLength(0);
  });

  it("retries a failed resume in the original Session without allocating a new generation", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-runtime-resume-"));
    roots.push(root);
    const adapter = new FixtureAdapter();
    adapter.failNextResume = true;
    const { facade } = runtime(adapter);
    const persisted: SessionRef = {
      schemaVersion: 1,
      harnessId: descriptor.id,
      adapterVersion: descriptor.adapterVersion,
      generation: 4,
      nativeId: "fixture-native-existing",
      durable: true,
      createdAt: "2026-09-16T00:00:00.000Z"
    };
    const runRequest = await request(root);
    runRequest.project.agentSessions = { main: persisted };
    const traces: string[] = [];
    const officialEvents: HarnessEvent[] = [];
    runRequest.onOfficialHarnessEvent = (event) => {
      officialEvents.push(event as unknown as HarnessEvent);
    };

    const result = await facade.run(
      runRequest,
      (_type, message) => { traces.push(message); },
      new AbortController().signal
    );

    expect(adapter.contexts).toHaveLength(2);
    expect(adapter.contexts[0]?.spec.session).toMatchObject({ generation: 4, resumedAt: expect.any(String) });
    expect(adapter.contexts[1]?.spec.session).toMatchObject({
      harnessId: descriptor.id,
      generation: 4,
      nativeId: "fixture-native-existing",
      resumedAt: expect.any(String)
    });
    expect(adapter.contexts[0]?.recoveryBudget).not.toHaveProperty("startAttempt");
    expect(adapter.contexts[1]?.recoveryBudget).not.toHaveProperty("startAttempt");
    expect(adapter.contexts[0]?.spec.prompt).not.toContain("Session continuation safety");
    expect(adapter.contexts[1]?.spec.prompt).toContain("Session continuation safety");
    expect(adapter.contexts[1]?.spec.prompt).toContain(
      "repeat only the unfinished part"
    );
    expect(adapter.contexts[0]?.processHost).not.toBe(
      adapter.contexts[1]?.processHost
    );
    expect(result.threadId).toBe("fixture:fixture-native-existing");
    expect(traces).toContain("Native session recovery retrying the original Session");
    expect(officialEvents.map((event) => event.seq)).toEqual([0, 1, 2, 3]);
    expect(officialEvents.map((event) => event.eventId)).toEqual([
      "inv_fixture:fixture-harness:0",
      "inv_fixture:fixture-harness:1",
      "inv_fixture:fixture-harness:2",
      "inv_fixture:fixture-harness:3"
    ]);
  });

  it("diagnoses an open tool before resetting a failed resume attempt", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-runtime-resume-open-tool-"));
    roots.push(root);
    const adapter = new OpenToolResumeFailureAdapter();
    const { facade } = runtime(adapter);
    const runRequest = await request(root);
    runRequest.project.agentSessions = {
      main: {
        schemaVersion: 1,
        harnessId: descriptor.id,
        adapterVersion: descriptor.adapterVersion,
        generation: 4,
        nativeId: "fixture-native-existing",
        durable: true,
        createdAt: "2026-09-16T00:00:00.000Z"
      }
    };
    const events: HarnessEvent[] = [];
    runRequest.onOfficialHarnessEvent = (event) => {
      events.push(event as unknown as HarnessEvent);
    };

    await expect(facade.run(
      runRequest,
      () => undefined,
      new AbortController().signal
    )).resolves.toMatchObject({ handoff: "fixture handoff" });

    expect(events.slice(0, 2)).toEqual([
      expect.objectContaining({
        kind: "tool.started",
        attempt: 0,
        itemId: "native-resume:7"
      }),
      expect.objectContaining({
        kind: "diagnostic",
        attempt: 0,
        sourceType: "tool.lifecycle.attempt_reset",
        message: expect.stringContaining("old-attempt-tool")
      })
    ]);
    expect(events.slice(2).every((event) => event.attempt === 1)).toBe(true);
  });

  it("resumes the original strict task Session after malformed gateway arguments and includes parser feedback", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-runtime-protocol-recovery-"));
    roots.push(root);
    const adapter = new FixtureAdapter();
    const close = vi.fn(async () => undefined);
    let failed = true;
    const resetFailure = vi.fn(() => { failed = false; });
    const protocolProxyFactory = vi.fn(async () => ({
      baseUrl: "http://127.0.0.1:43199/v1",
      token: "invocation-token",
      close,
      getFailure: () => failed ? {
        code: "PROTOCOL_TOOL_ARGUMENTS_INVALID" as const,
        message: "Gateway returned invalid JSON tool arguments for write: Unterminated string at position 5564 upstream-secret",
        toolName: "write",
        toolIndex: 0,
        sourceProtocol: "chat-completions" as const,
        targetProtocol: "responses" as const,
        model: "fixture-model"
      } : undefined,
      resetFailure
    }));
    const facade = new HarnessRuntimeFacade({
      adapters: [adapter],
      protocolProxyFactory
    });
    const traces: Array<{ message: string; data?: Record<string, unknown> }> = [];
    const result = await facade.run(
      await request(root, { taskSessionId: "task-original", sessionContinuity: "strict" }),
      (_kind, message, data) => { traces.push({ message, data }); },
      new AbortController().signal
    );

    expect(result.threadId).toBe("fixture:fixture-native-0");
    expect(adapter.contexts).toHaveLength(2);
    expect(adapter.contexts.map((context) => context.spec.invocationId)).toEqual([
      "inv_fixture",
      "inv_fixture"
    ]);
    expect(adapter.contexts.map((context) => context.spec.session?.generation)).toEqual([0, 0]);
    expect(adapter.contexts[1]?.request.resumeThreadId).toBe("fixture:fixture-native-0");
    expect(adapter.createdGenerations).toEqual([0]);
    expect(adapter.contexts[1]?.request.taskSessionId).toBe("task-original");
    expect(adapter.contexts[1]?.request.project.taskSessionRefs?.["task-original"]?.nativeId).toBe("fixture-native-0");
    expect(adapter.contexts[1]?.spec.prompt).toContain("Unterminated string at position 5564");
    expect(adapter.contexts[1]?.spec.prompt).not.toContain("upstream-secret");
    expect(adapter.contexts[1]?.spec.prompt).toContain(
      "the previous native Session emitted invalid JSON tool arguments"
    );
    expect(traces).toContainEqual({
      message: "Invalid tool arguments detected; retrying once in the original Session",
      data: expect.objectContaining({
        errorCode: "PROTOCOL_TOOL_ARGUMENTS_INVALID",
        automaticRecovery: true,
        recoveryLimit: 1,
        sessionGeneration: 0,
        recoveryStrategy: "native-session-resume"
      })
    });
    expect(traces.filter((trace) => {
      const canonical = trace.data?.canonicalEvent as HarnessEvent | undefined;
      return canonical?.kind === "assistant.message";
    })).toHaveLength(1);
    expect(traces.filter((trace) => {
      const canonical = trace.data?.canonicalEvent as HarnessEvent | undefined;
      return canonical?.attempt === 0;
    })).toHaveLength(0);
    expect(resetFailure).toHaveBeenCalledOnce();
    expect(close).toHaveBeenCalledOnce();
  });

  it.each([false, true])("recovers a context limit once and bounds further retries (exhausted=%s)", async (exhausted) => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-runtime-context-"));
    roots.push(root);
    const adapter = new FixtureAdapter();
    let failed = true;
    const resetFailure = vi.fn(() => { failed = exhausted; });
    const facade = new HarnessRuntimeFacade({
      adapters: [adapter],
      protocolProxyFactory: vi.fn(async () => ({
        baseUrl: "http://127.0.0.1:43199/v1", token: "fixture", close: async () => undefined,
        getFailure: () => failed ? {
          code: "MODEL_CONTEXT_LIMIT_EXCEEDED" as const,
          message: "Your request exceeded model token limit: 1048576 (requested: 1230139)",
          sourceProtocol: "chat-completions" as const, targetProtocol: "responses" as const,
          model: "fixture-model", requestedTokens: 1230139, limitTokens: 1048576
        } : undefined,
        resetFailure
      }))
    });
    const runRequest = await request(root);
    const currentTask = "original requirement\nCurrent correction: preserve accepted results and finish the missing decision.";
    await fs.writeFile(runRequest.inboxPath, currentTask);
    runRequest.contextSources = [{ key: "project.history", label: "Earlier evidence", kind: "history",
      records: [{ id: "earlier-evidence", status: "completed", output: "old evidence\n".repeat(5000) }] }];
    const promise = facade.run(runRequest, () => undefined, new AbortController().signal);
    if (exhausted) {
      await expect(promise).rejects.toMatchObject({
        code: "MODEL_CONTEXT_LIMIT_EXCEEDED", retryable: false,
        details: { recoveryAttempted: true, recoveryLimit: 1, requestedTokens: 1230139 }
      });
    } else {
      expect((await promise).threadId).toBe("fixture:fixture-native-0");
    }
    expect(adapter.createdGenerations).toEqual([0]);
    expect(adapter.contexts.map((context) => context.spec.invocationId)).toEqual(["inv_fixture", "inv_fixture"]);
    const recovered = adapter.contexts[1]!;
    expect(recovered.request.resumeThreadId).toBe("fixture:fixture-native-0");
    expect(recovered.spec.prompt).toContain("single context-limit recovery for the SAME invocation");
    expect(recovered.spec.prompt).toContain("Inspect existing deliverables and memory");
    expect(recovered.spec.prompt).toContain(currentTask);
    expect(recovered.spec.prompt).not.toContain("old evidence");
    expect(await fs.readFile(recovered.spec.inputs.inboxPath, "utf8")).toBe(currentTask);
    const contextRoot = path.dirname(recovered.spec.inputs.inboxPath);
    const catalog = JSON.parse(await fs.readFile(recovered.spec.inputs.contextIndex!.indexPath, "utf8"));
    const history = catalog.entries.find((entry: { key: string }) => entry.key === "project.history");
    const historyList = JSON.parse(await fs.readFile(path.join(contextRoot, history.list.path), "utf8"));
    expect(await fs.readFile(path.join(contextRoot, historyList.entries[0].detail.path), "utf8")).toContain("old evidence");
    expect(resetFailure).toHaveBeenCalledOnce();
  });

  it("retains staged decision receipts when resuming the original Session after a context limit", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-runtime-context-terminal-"));
    roots.push(root);
    const adapter = new FixtureAdapter();
    const runRequest = await request(root);
    runRequest.control = {
      stagingPath: path.join(runRequest.runtimePath, "control-actions.json"),
      capability: "fixture-capability", stateVersion: 7, candidates: ["finish"],
      decisionBy: "main", allowUserIntervention: false, canComplete: true
    };
    const actions = [{
      projectId: runRequest.project.id, agent: runRequest.agent, invocationId: runRequest.invocationId,
      callId: "finish-once", stateVersion: 7, receivedAt: "2026-09-22T00:00:00.000Z",
      action: { tool: "complete_project", rationale: "Work is already complete." }
    }];
    await fs.writeFile(runRequest.control.stagingPath, JSON.stringify(actions));
    const facade = new HarnessRuntimeFacade({
      adapters: [adapter], protocolProxyFactory: vi.fn(async () => ({
        baseUrl: "http://127.0.0.1:43199/v1", token: "fixture", close: async () => undefined,
        getFailure: () => ({
          code: "MODEL_CONTEXT_LIMIT_EXCEEDED" as const, message: "prompt is too long",
          sourceProtocol: "chat-completions" as const, targetProtocol: "responses" as const, model: "fixture-model"
        })
      }))
    });
    await expect(facade.run(
      runRequest,
      () => undefined,
      new AbortController().signal
    )).rejects.toMatchObject({
      code: "MODEL_CONTEXT_LIMIT_EXCEEDED",
      retryable: false,
      details: { recoveryAttempted: true, recoveryLimit: 1 }
    });
    expect(adapter.contexts).toHaveLength(2);
    expect(JSON.parse(await fs.readFile(runRequest.control.stagingPath, "utf8"))).toEqual(actions);
  });

  it("reports a retained provider transport failure as a retryable gateway error", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-runtime-provider-failure-"));
    roots.push(root);
    const adapter = new FixtureAdapter();
    const close = vi.fn(async () => undefined);
    const resetFailure = vi.fn();
    const facade = new HarnessRuntimeFacade({
      adapters: [adapter],
      protocolProxyFactory: vi.fn(async () => ({
        baseUrl: "http://127.0.0.1:43199/v1",
        token: "invocation-token",
        close,
        getFailure: () => ({
          code: "MODEL_PROVIDER_FAILED" as const,
          message: "Gateway request failed before a response was received",
          sourceProtocol: "chat-completions" as const,
          targetProtocol: "chat-completions" as const,
          model: "fixture-model"
        }),
        resetFailure
      }))
    });

    await expect(facade.run(
      await request(root),
      () => undefined,
      new AbortController().signal
    )).rejects.toMatchObject({
      code: "MODEL_PROVIDER_FAILED",
      source: "gateway",
      retryable: true,
      message: "Model provider request failed"
    });

    expect(adapter.contexts).toHaveLength(1);
    expect(resetFailure).not.toHaveBeenCalled();
    expect(close).toHaveBeenCalledOnce();
  });

  it("keeps a non-persistent Worker's malformed-argument replacement ephemeral", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-runtime-ephemeral-protocol-recovery-"));
    roots.push(root);
    const adapter = new FixtureAdapter();
    let failed = true;
    const resetFailure = vi.fn(() => { failed = false; });
    const facade = new HarnessRuntimeFacade({
      adapters: [adapter],
      protocolProxyFactory: vi.fn(async () => ({
        baseUrl: "http://127.0.0.1:43199/v1",
        token: "invocation-token",
        close: vi.fn(async () => undefined),
        getFailure: () => failed ? {
          code: "PROTOCOL_TOOL_ARGUMENTS_INVALID" as const,
          message: "Gateway returned invalid JSON tool arguments for write",
          toolName: "write",
          toolIndex: 0,
          sourceProtocol: "chat-completions" as const,
          targetProtocol: "responses" as const,
          model: "fixture-model"
        } : undefined,
        resetFailure
      }))
    });
    const runRequest = await request(root);
    const mainConfig = runRequest.project.agents.main!;
    runRequest.agent = "idea";
    runRequest.kind = "worker";
    runRequest.project.agents.idea = {
      ...mainConfig,
      sessionPersistence: false
    };
    const ideaWorkspace = path.join(runRequest.projectPath, "workspaces");
    const ideaInbox = path.join(
      runRequest.projectPath,
      "messages",
      `0002_${runRequest.invocationId}_to_idea.md`
    );
    await fs.mkdir(ideaWorkspace, { recursive: true });
    await Promise.all([
      fs.writeFile(path.join(ideaWorkspace, "Memory.md"), "persistent memory\n", "utf8"),
      fs.writeFile(ideaInbox, "authoritative worker inbox\n", "utf8")
    ]);
    runRequest.workspacePath = ideaWorkspace;
    runRequest.inboxPath = ideaInbox;

    const result = await facade.run(
      runRequest,
      () => undefined,
      new AbortController().signal
    );

    expect(result.threadId).toBeUndefined();
    expect(adapter.contexts).toHaveLength(2);
    expect(adapter.contexts.map((context) => context.spec.session)).toEqual([
      expect.objectContaining({ generation: 0, durable: false }),
      expect.objectContaining({ generation: 1, durable: false })
    ]);
    expect(adapter.contexts.map((context) => context.spec.durableSession)).toEqual([false, false]);
    expect(adapter.contexts[1]?.request.resumeThreadId).toBeUndefined();
    expect(resetFailure).toHaveBeenCalledOnce();
  });

  it("keeps the malformed-argument recovery available after an independent resume retry", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-runtime-resume-then-protocol-"));
    roots.push(root);
    const adapter = new FixtureAdapter();
    adapter.failNextResume = true;
    let resetCount = 0;
    const resetFailure = vi.fn(() => { resetCount += 1; });
    const protocolFailure = {
      code: "PROTOCOL_TOOL_ARGUMENTS_INVALID" as const,
      message: "Gateway returned invalid JSON tool arguments for write",
      toolName: "write",
      toolIndex: 0,
      sourceProtocol: "chat-completions" as const,
      targetProtocol: "responses" as const,
      model: "fixture-model"
    };
    const facade = new HarnessRuntimeFacade({
      adapters: [adapter],
      protocolProxyFactory: vi.fn(async () => ({
        baseUrl: "http://127.0.0.1:43199/v1",
        token: "invocation-token",
        close: vi.fn(async () => undefined),
        getFailure: () => adapter.contexts.length === 2 && resetCount === 1
          ? protocolFailure
          : undefined,
        resetFailure
      }))
    });
    const persisted: SessionRef = {
      schemaVersion: 1,
      harnessId: descriptor.id,
      adapterVersion: descriptor.adapterVersion,
      generation: 4,
      nativeId: "fixture-native-existing",
      durable: true,
      createdAt: "2026-09-16T00:00:00.000Z"
    };
    const runRequest = await request(root);
    runRequest.project.agentSessions = { main: persisted };
    const traces: string[] = [];

    const result = await facade.run(
      runRequest,
      (_kind, message) => { traces.push(message); },
      new AbortController().signal
    );

    expect(result.threadId).toBe("fixture:fixture-native-existing");
    expect(adapter.contexts.map((context) => context.spec.session?.generation)).toEqual([4, 4, 4]);
    expect(adapter.contexts.map((context) => context.spec.invocationId)).toEqual([
      "inv_fixture",
      "inv_fixture",
      "inv_fixture"
    ]);
    expect(adapter.createdGenerations).toEqual([]);
    expect(adapter.contexts[2]?.spec.prompt).toContain(
      "the previous native Session emitted invalid JSON tool arguments"
    );
    expect(traces).toContain("Native session recovery retrying the original Session");
    expect(traces).toContain("Invalid tool arguments detected; retrying once in the original Session");
    expect(resetFailure).toHaveBeenCalledTimes(2);
  });

  it("stops after the single malformed-tool-argument Session recovery", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-runtime-protocol-exhausted-"));
    roots.push(root);
    const adapter = new FixtureAdapter();
    const resetFailure = vi.fn();
    const facade = new HarnessRuntimeFacade({
      adapters: [adapter],
      protocolProxyFactory: vi.fn(async () => ({
        baseUrl: "http://127.0.0.1:43199/v1",
        token: "invocation-token",
        close: vi.fn(async () => undefined),
        getFailure: () => ({
          code: "PROTOCOL_TOOL_ARGUMENTS_INVALID" as const,
          message: "Gateway returned invalid JSON tool arguments for write",
          toolName: "write",
          toolIndex: 0,
          sourceProtocol: "chat-completions" as const,
          targetProtocol: "responses" as const,
          model: "fixture-model"
        }),
        resetFailure
      }))
    });

    await expect(facade.run(
      await request(root),
      () => undefined,
      new AbortController().signal
    )).rejects.toMatchObject({
      code: "PROTOCOL_RECOVERY_EXHAUSTED",
      source: "gateway",
      retryable: false,
      details: expect.objectContaining({
        recoveryAttempted: true,
        recoveryLimit: 1,
        toolName: "write"
      })
    });
    expect(adapter.contexts).toHaveLength(2);
    expect(adapter.createdGenerations).toEqual([0]);
    expect(resetFailure).toHaveBeenCalledOnce();
  });

  it("uses the official identity published after launch when recovering a strict task", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-runtime-pending-session-"));
    roots.push(root);
    const adapter = new FixtureAdapter();
    const originalCreate = adapter.createSession.bind(adapter);
    adapter.createSession = (...args) => ({ ...originalCreate(...args), nativeId: "pending-session" });
    const originalRun = adapter.run.bind(adapter);
    adapter.run = async context => {
      if (!context.spec.session?.resumedAt) {
        adapter.contexts.push(context);
        await context.onSessionStarted?.({ ...context.spec.session!, nativeId: "fixture-native-official" });
        throw new ProtocolToolArgumentsError(descriptor.id, { protocolMessage: "Unterminated string at position 42" });
      }
      return originalRun(context);
    };
    const { facade } = runtime(adapter);
    const sessions: string[] = [];
    const runRequest = await request(root, { taskSessionId: "task-original", sessionContinuity: "strict",
      onDurableSessionStarted: async session => { sessions.push(session.nativeId); } });
    expect((await facade.run(runRequest, () => undefined, new AbortController().signal)).threadId)
      .toBe("fixture:fixture-native-official");
    expect(sessions).toEqual(["fixture-native-official"]);
    expect(adapter.createdGenerations).toEqual([0]);
    expect(adapter.contexts[1]!.spec.session).toMatchObject({ nativeId: "fixture-native-official", generation: 0, resumedAt: expect.any(String) });
    expect(adapter.contexts[1]!.request.resumeThreadId).toBe("fixture:fixture-native-official");
  });

  it("bounds a failed original-Session resume without allocating a replacement or enabling scheduler retries", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-runtime-resume-exhausted-"));
    roots.push(root);
    const adapter = new FixtureAdapter();
    const originalRun = adapter.run.bind(adapter);
    adapter.run = async context => { adapter.failNextResume = true; return originalRun(context); };
    const { facade } = runtime(adapter);
    const persisted: SessionRef = { schemaVersion: 1, harnessId: descriptor.id, adapterVersion: descriptor.adapterVersion,
      generation: 4, nativeId: "fixture-native-existing", durable: true, createdAt: "2026-09-16T00:00:00.000Z" };
    const runRequest = await request(root, { taskSessionId: "task-original", sessionContinuity: "strict" });
    runRequest.project.taskSessionRefs = { "task-original": persisted };
    await expect(facade.run(runRequest, () => undefined, new AbortController().signal)).rejects.toMatchObject({
      code: "SESSION_RESUME_FAILED", retryable: false, details: { recoveryLimit: 1 }, cause: { code: "SESSION_RESUME_FAILED" }
    });
    expect(adapter.createdGenerations).toEqual([]);
    expect(adapter.contexts).toHaveLength(2);
    expect(adapter.contexts.every(context => context.spec.session?.nativeId === persisted.nativeId)).toBe(true);
    expect(runRequest.project.taskSessionRefs["task-original"]).toEqual(persisted);
  });

  it("fails closed for an unknown locked Harness without calling another Adapter", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-runtime-unknown-"));
    roots.push(root);
    const adapter = new FixtureAdapter();
    const { facade, protocolProxyFactory } = runtime(adapter);
    const runRequest = await request(root);
    runRequest.project.agents.main!.harness = "removed-harness";

    await expect(facade.run(
      runRequest,
      () => undefined,
      new AbortController().signal
    )).rejects.toMatchObject({ code: "HARNESS_NOT_FOUND" });
    expect(adapter.contexts).toHaveLength(0);
    expect(protocolProxyFactory).not.toHaveBeenCalled();
  });

  it("fails closed when the locked project snapshot has no Harness", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-runtime-missing-harness-"));
    roots.push(root);
    const adapter = new FixtureAdapter();
    const { facade, protocolProxyFactory } = runtime(adapter);
    const runRequest = await request(root);
    delete runRequest.project.agents.main!.harness;

    await expect(facade.run(
      runRequest,
      () => undefined,
      new AbortController().signal
    )).rejects.toMatchObject({
      code: "HARNESS_CONFIGURATION_INVALID",
      message: "Agent main has no locked Harness in the project snapshot"
    });
    expect(adapter.contexts).toHaveLength(0);
    expect(protocolProxyFactory).not.toHaveBeenCalled();
  });

  it("fails with a stable configuration error when the selected Agent is absent", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-runtime-missing-agent-"));
    roots.push(root);
    const adapter = new FixtureAdapter();
    const { facade, protocolProxyFactory } = runtime(adapter);
    const runRequest = await request(root);
    delete runRequest.project.agents.main;

    await expect(facade.run(
      runRequest,
      () => undefined,
      new AbortController().signal
    )).rejects.toMatchObject({
      code: "HARNESS_CONFIGURATION_INVALID",
      source: "runtime",
      message: "Agent main is missing from the project runtime snapshot"
    });
    expect(adapter.contexts).toHaveLength(0);
    expect(protocolProxyFactory).not.toHaveBeenCalled();
  });

  it("validates a fifth Adapter's returned native Session before persistence", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-runtime-invalid-session-"));
    roots.push(root);
    const adapter = new FixtureAdapter();
    adapter.resultThreadId = "not-a-fixture-session";
    const { facade } = runtime(adapter);
    const runRequest = await request(root);

    await expect(facade.run(
      runRequest,
      () => undefined,
      new AbortController().signal
    )).rejects.toMatchObject({
      code: "HARNESS_CONTRACT_VIOLATION",
      harnessId: descriptor.id
    });
  });

  it("normalizes a legacy provider failure at the Facade boundary", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-runtime-provider-error-"));
    roots.push(root);
    const adapter = new FailingFixtureAdapter(
      new AgentApiError("provider", "raw provider body with implementation details")
    );
    const { facade } = runtime(adapter);

    await expect(facade.run(
      await request(root),
      () => undefined,
      new AbortController().signal
    )).rejects.toMatchObject({
      code: "MODEL_PROVIDER_FAILED",
      source: "gateway",
      retryable: true,
      message: "Model provider request failed"
    });
  });

  it("rejects a second durable identity in the same Adapter generation", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-runtime-session-switch-"));
    roots.push(root);
    const adapter = new SwitchingSessionFixtureAdapter();
    const { facade } = runtime(adapter);

    await expect(facade.run(
      await request(root),
      () => undefined,
      new AbortController().signal
    )).rejects.toMatchObject({
      code: "HARNESS_CONTRACT_VIOLATION",
      message: "Fixture Harness changed its durable Session identity during one generation"
    });
  });

  it("normalizes createSession hook exceptions before opening a route", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-runtime-create-session-error-"));
    roots.push(root);
    const adapter = new BrokenCreateSessionFixtureAdapter();
    const { facade, protocolProxyFactory } = runtime(adapter);

    await expect(facade.run(
      await request(root),
      () => undefined,
      new AbortController().signal
    )).rejects.toMatchObject({
      code: "HARNESS_CONTRACT_VIOLATION",
      source: "adapter",
      retryable: false
    });
    expect(protocolProxyFactory).not.toHaveBeenCalled();
  });

  it("normalizes legacy Session codec exceptions before opening a route", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-runtime-legacy-session-error-"));
    roots.push(root);
    const adapter = new BrokenLegacySessionFixtureAdapter();
    const { facade, protocolProxyFactory } = runtime(adapter);
    const runRequest = await request(root);
    runRequest.project.agentSessionIds = { main: "fixture:native-old" };

    await expect(facade.run(
      runRequest,
      () => undefined,
      new AbortController().signal
    )).rejects.toMatchObject({
      code: "HARNESS_CONTRACT_VIOLATION",
      source: "adapter",
      retryable: false
    });
    expect(protocolProxyFactory).not.toHaveBeenCalled();
  });

  it("normalizes an unknown Adapter exception to a non-retryable contract error", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-runtime-unknown-error-"));
    roots.push(root);
    const adapter = new FailingFixtureAdapter(new Error("raw adapter implementation failure"));
    const { facade } = runtime(adapter);

    await expect(facade.run(
      await request(root),
      () => undefined,
      new AbortController().signal
    )).rejects.toMatchObject({
      code: "HARNESS_CONTRACT_VIOLATION",
      source: "adapter",
      retryable: false,
      message: "Harness Adapter failed outside the stable runtime error contract"
    });
  });

  it("preserves the primary Adapter error when Gateway cleanup also fails", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-runtime-double-failure-"));
    roots.push(root);
    const adapter = new FailingFixtureAdapter(new Error("primary adapter failure"));
    const close = vi.fn(async () => {
      throw new Error("secondary route cleanup failure");
    });
    const { facade } = runtime(adapter, close);
    const traces: string[] = [];

    await expect(facade.run(
      await request(root),
      (_kind, message) => { traces.push(message); },
      new AbortController().signal
    )).rejects.toMatchObject({
      code: "HARNESS_CONTRACT_VIOLATION",
      message: "Harness Adapter failed outside the stable runtime error contract"
    });
    expect(close).toHaveBeenCalledOnce();
    expect(traces).toContain(
      "Invocation Gateway route cleanup failed after the invocation had already failed"
    );
  });

  it("normalizes a Gateway cleanup failure after a successful Adapter result", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-runtime-close-failure-"));
    roots.push(root);
    const close = vi.fn(async () => {
      throw new Error("route cleanup failure");
    });
    const { facade } = runtime(new FixtureAdapter(), close);

    await expect(facade.run(
      await request(root),
      () => undefined,
      new AbortController().signal
    )).rejects.toMatchObject({
      code: "PROTOCOL_ROUTE_FAILED",
      source: "gateway",
      retryable: true,
      message: "Unable to close the invocation Gateway route"
    });
  });

  it("registers a fifth Adapter once without changing the built-in composition", () => {
    const fifthDescriptor: HarnessDescriptor = {
      ...descriptor,
      id: "fixture-five",
      label: "Fixture Five",
      executableEnv: "FIXTURE_FIVE_BIN",
      defaultCommand: "fixture-five",
      default: undefined
    };
    const facade = new HarnessRuntimeFacade({
      additionalAdapters: [new FixtureAdapter(fifthDescriptor)]
    });

    expect(facade.harnessIds()).toEqual([
      "dsh",
      "pi",
      "codex",
      "dsh",
      "fixture-five"
    ]);
    expect(facade.nativeProtocol("fixture-five")).toBe("chat-completions");
  });

  it("runs the public Adapter smoke path through a real staged sentinel read", async () => {
    const smokeDescriptor: HarnessDescriptor = {
      ...descriptor,
      id: "fixture-smoke",
      label: "Fixture Smoke",
      executableEnv: "FIXTURE_SMOKE_BIN",
      defaultCommand: "fixture-smoke"
    };
    const adapter = new SmokeFixtureAdapter(smokeDescriptor);
    const { facade, protocolProxyFactory, close } = runtime(adapter);
    const result = await facade.runSmoke({
      harness: smokeDescriptor.id,
      model: "fixture-model",
      gateway: {
        id: "gwy_00000000000000000000000000000000",
        name: "Fixture Gateway",
        url: "https://gateway.example.test/v1",
        apiKey: "upstream-secret",
        models: ["fixture-model"],
        defaultModel: "fixture-model",
        protocol: "responses",
        revision: 1
      }
    }, new AbortController().signal);

    expect(result).toMatchObject({
      adapterVersion: smokeDescriptor.adapterVersion,
      executableFingerprint: "fixture-fingerprint",
      cacheKey: expect.any(String)
    });
    expect(protocolProxyFactory).toHaveBeenCalledOnce();
    expect(protocolProxyFactory).toHaveBeenCalledWith(expect.objectContaining({
      requiredToolName: "scienceevolve_read_smoke_sentinel"
    }));
    expect(close).toHaveBeenCalledOnce();
    expect(adapter.contexts).toHaveLength(1);
    expect(adapter.contexts[0]?.spec.purpose).toBe("probe");
    expect(adapter.contexts[0]?.spec.inputs.workspacePath.endsWith(
      "workspaces"
    )).toBe(true);
    expect(adapter.contexts[0]?.request.inboxPath).toBe(
      adapter.contexts[0]?.spec.inputs.inboxPath
    );
    const sentinel = `OPENFARS_SMOKE_${result.cacheKey.slice(0, 12).toUpperCase()}`;
    expect(adapter.contexts[0]?.spec.prompt).not.toContain(sentinel);
    expect(adapter.contexts[0]?.spec.prompt).toContain("scienceevolve_read_smoke_sentinel");
    expect(adapter.contexts[0]?.spec.prompt).toContain("Do not call read_mcp_resource");
  });

  it("creates a different invocation mirror without trusting a modified older mirror", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-runtime-mirror-"));
    roots.push(root);
    const adapter = new FixtureAdapter();
    const { facade } = runtime(adapter);
    const first = await request(root);
    await facade.run(first, () => undefined, new AbortController().signal);
    const firstMirror = adapter.contexts[0]!.spec.inputs.inboxPath;
    await fs.chmod(firstMirror, 0o600);
    await fs.writeFile(firstMirror, "tampered\n", "utf8");

    const secondRuntime = path.join(first.projectPath, "runtime", "inv_second");
    const secondAuthority = path.join(
      first.projectPath,
      "messages",
      "0002_inv_second_to_main.md"
    );
    await fs.mkdir(secondRuntime, { recursive: true });
    await fs.writeFile(secondAuthority, "second authority\n", "utf8");
    const second = {
      ...first,
      invocationId: "inv_second",
      inboxPath: secondAuthority,
      runtimePath: secondRuntime
    };
    await facade.run(second, () => undefined, new AbortController().signal);
    const secondMirror = adapter.contexts[1]!.spec.inputs.inboxPath;
    expect(secondMirror).not.toBe(firstMirror);
    expect(await fs.readFile(secondMirror, "utf8")).toBe("second authority\n");
    expect(await fs.readFile(second.inboxPath, "utf8")).toBe("second authority\n");
  });

  it("fits Explainer quoted background against its selected window before native dispatch", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-explainer-budget-"));
    roots.push(root);
    const source = await request(root);
    const workspacePath = path.join(source.runtimePath, "workspaces");
    const inboxPath = path.join(workspacePath, `${source.invocationId}.md`);
    const memoryPath = path.join(workspacePath, "Memory.md");
    await fs.mkdir(workspacePath, { recursive: true });
    const output = "OLD_OUTPUT_BODY ".repeat(2000);
    await fs.writeFile(inboxPath, output);
    await fs.writeFile(memoryPath, "Independent summary task.");
    const adapter = new FixtureAdapter();
    let budget: ProtocolProxyOptions["getContextInjectionBudget"];
    let reasoning: ProtocolProxyOptions["gatewayReasoning"];
    const facade = new HarnessRuntimeFacade({ adapters: [adapter], protocolProxyFactory: async options => {
      budget = options.getContextInjectionBudget;
      reasoning = options.gatewayReasoning;
      return { baseUrl: "http://127.0.0.1:43199/v1", token: "fixture", close: async () => undefined };
    } });
    await facade.runExplainer({ invocationId: source.invocationId, projectId: source.project.id,
      projectPath: source.projectPath, workspacePath, runtimePath: source.runtimePath, inboxPath, memoryPath,
      harnessId: descriptor.id, gateway: { ...source.project.agents.main!.gatewaySnapshot!, modelContextWindows: { "fixture-model": 8192 },
        modelReasoning: { "fixture-model": { parameter: "reasoning.effort", defaultOptionId: "high", options: [{ id: "high", label: "High", value: "high" }] } } },
      model: "fixture-model", reasoningEffort: "low", prompt: `Summarize the actual saved results.\n${output}`,
      evidenceInPrompt: true, contextBackgrounds: [{ text: output, alternatives: [`Read selected output at ${inboxPath}.`] }],
      onTrace: () => undefined, onEvent: () => undefined }, new AbortController().signal);
    expect(adapter.contexts[0]!.spec.prompt).toContain("Summarize the actual saved results.");
    expect(adapter.contexts[0]!.spec.prompt).toContain(inboxPath);
    expect(adapter.contexts[0]!.spec.prompt).not.toContain("OLD_OUTPUT_BODY");
    expect(budget!()!.estimatedTokens).toBeLessThanOrEqual(4096);
    expect(reasoning).toMatchObject({ parameter: "reasoning.effort", optionId: "high", value: "high" });
    expect(await fs.readFile(inboxPath, "utf8")).toBe(output);
  });

  it.each(["proxy-visible-output", "native"] as const)("streams Explainer text before completion using %s", async assistantStreaming => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-explainer-stream-"));
    roots.push(root);
    const source = await request(root);
    const workspacePath = path.join(source.runtimePath, "workspaces");
    const inboxPath = path.join(workspacePath, ".scienceevolve", `${source.invocationId}.md`);
    const memoryPath = path.join(workspacePath, "Memory.md");
    await fs.mkdir(path.dirname(inboxPath), { recursive: true });
    await Promise.all([fs.copyFile(source.inboxPath, inboxPath), fs.copyFile(path.join(source.workspacePath, "Memory.md"), memoryPath)]);
    const adapter = new FixtureAdapter({ ...descriptor, capabilities: { ...descriptor.capabilities, assistantStreaming } });
    let onVisibleAssistantDelta: ProtocolProxyOptions["onVisibleAssistantDelta"];
    let onVisibleReasoningSummaryDelta: ProtocolProxyOptions["onVisibleReasoningSummaryDelta"];
    let release!: () => void;
    const paused = new Promise<void>(resolve => { release = resolve; });
    const close = vi.fn(async () => undefined);
    const facade = new HarnessRuntimeFacade({ adapters: [adapter], protocolProxyFactory: async options => {
      onVisibleAssistantDelta = options.onVisibleAssistantDelta;
      onVisibleReasoningSummaryDelta = options.onVisibleReasoningSummaryDelta;
      return { baseUrl: "http://127.0.0.1:43199/v1", token: "invocation-token", close };
    } });
    vi.spyOn(adapter, "run").mockImplementation(async context => {
      const base = { schemaVersion: 1 as const, timestamp: new Date().toISOString(),
        invocationId: context.spec.invocationId, harnessId: descriptor.id };
      if (assistantStreaming === "proxy-visible-output") {
        expect(onVisibleAssistantDelta).toBeTypeOf("function");
        await onVisibleAssistantDelta!("fixture ");
        await onVisibleAssistantDelta!("handoff");
      } else {
        expect(onVisibleAssistantDelta).toBeUndefined();
        await context.onEvent({ ...base, eventId: "native:0", seq: 0, kind: "assistant.delta", phase: "delta", message: "fixture " });
        await context.onEvent({ ...base, eventId: "native:1", seq: 1, kind: "assistant.delta", phase: "delta", message: "handoff" });
      }
      await paused;
      await onVisibleReasoningSummaryDelta!("Evidence verified.", "public-summary-1");
      await context.onEvent({ ...base, eventId: "native:2", seq: 2, kind: "assistant.message", phase: "completed", message: "fixture handoff" });
      return { handoff: "fixture handoff", threadId: context.spec.session!.nativeId };
    });
    const events: HarnessEvent[] = [];
    let completed = false;
    const pending = facade.runExplainer({
      invocationId: source.invocationId, projectId: source.project.id,
      projectPath: source.projectPath, workspacePath, runtimePath: source.runtimePath,
      inboxPath, memoryPath,
      harnessId: descriptor.id, gateway: source.project.agents.main!.gatewaySnapshot!,
      model: "fixture-model", reasoningEffort: "low", prompt: "Explain the evidence.",
      onTrace: () => undefined, onEvent: event => { events.push(event); }
    }, new AbortController().signal).then(result => { completed = true; return result; });
    void pending.catch(() => undefined);
    try {
      await vi.waitFor(() => expect(events.filter(event => event.kind === "assistant.delta")).toHaveLength(2));
      expect(completed).toBe(false);
      expect(events.map(event => event.message)).toEqual(["fixture ", "handoff"]);
      expect(new Set(events.map(event => event.eventId)).size).toBe(2);
      expect(events.map(event => event.itemId)).toEqual(["assistant-0-0", "assistant-0-0"]);
      expect(close).not.toHaveBeenCalled();
    } finally {
      release();
      await pending;
    }
    expect(events.at(-1)).toMatchObject({ kind: "assistant.message", itemId: "assistant-0-0", message: "fixture handoff" });
    expect(events.find(event => event.kind === "reasoning.summary")).toMatchObject({ itemId: "public-summary-1", message: "Evidence verified.", phase: "delta" });
    expect(new Set(events.map(event => event.eventId)).size).toBe(4);
    expect(close).toHaveBeenCalledOnce();
  });

  it("replaces a failed Explainer resume inside the selected Harness", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-runtime-explainer-resume-"));
    roots.push(root);
    const adapter = new FixtureAdapter();
    adapter.failNextResume = true;
    const { facade } = runtime(adapter);
    const source = await request(root);
    const explainerRuntime = path.join(source.projectPath, "runtime", "inv_explainer");
    const explainerWorkspace = path.join(explainerRuntime, "workspaces");
    const explainerInbox = path.join(
      explainerWorkspace,
      ".scienceevolve",
      "inv_explainer.md"
    );
    const explainerMemory = path.join(explainerWorkspace, "Memory.md");
    await fs.mkdir(path.dirname(explainerInbox), { recursive: true });
    await Promise.all([
      fs.writeFile(explainerInbox, "quoted explainer evidence\n", "utf8"),
      fs.writeFile(explainerMemory, "explainer memory\n", "utf8")
    ]);
    const traces: string[] = [];
    const result = await facade.runExplainer({
      invocationId: "inv_explainer",
      projectId: source.project.id,
      projectPath: source.projectPath,
      workspacePath: explainerWorkspace,
      runtimePath: explainerRuntime,
      inboxPath: explainerInbox,
      memoryPath: explainerMemory,
      harnessId: descriptor.id,
      gateway: {
        id: "gwy_fixture",
        name: "Fixture gateway",
        url: "https://gateway.example.test/v1",
        apiKey: "upstream-secret",
        models: ["fixture-model"],
        defaultModel: "fixture-model",
        protocol: "responses"
      },
      model: "fixture-model",
      reasoningEffort: "low",
      prompt: "Explain the fixture evidence without modifying it.",
      session: {
        schemaVersion: 1,
        harnessId: descriptor.id,
        adapterVersion: descriptor.adapterVersion,
        generation: 2,
        nativeId: "fixture-native-existing",
        durable: true,
        createdAt: "2026-09-16T00:00:00.000Z"
      },
      onTrace: (_kind, message) => { traces.push(message); },
      onEvent: () => undefined
    }, new AbortController().signal);

    expect(adapter.contexts).toHaveLength(2);
    expect(adapter.contexts[0]?.spec.session).toMatchObject({
      harnessId: descriptor.id,
      generation: 2,
      resumedAt: expect.any(String)
    });
    expect(adapter.contexts[1]?.spec.session).toMatchObject({
      harnessId: descriptor.id,
      generation: 3,
      nativeId: "fixture-native-3"
    });
    expect(result.session).toMatchObject({ harnessId: descriptor.id, generation: 3 });
    expect(traces).toContain(
      "Explainer native session failed; retrying with a same-Harness replacement"
    );
  });

  it.each([false, true])("gives the Explainer one-time malformed-tool-argument recovery and stops a poisoned attempt promptly (live failure: %s)", async liveFailure => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-runtime-explainer-protocol-"));
    roots.push(root);
    const adapter = new FixtureAdapter();
    let failed = true;
    const resetFailure = vi.fn(() => { failed = false; });
    let failProxy!: () => void;
    const originalRun = adapter.run.bind(adapter);
    adapter.run = async context => {
      const result = await originalRun(context);
      if (liveFailure && context.spec.session?.generation === 0) {
        const stopped = new Promise<never>((_resolve, reject) => {
          context.signal.addEventListener("abort", () => reject(new Error("Native attempt stopped")), { once: true });
        });
        failProxy();
        return stopped;
      }
      return result;
    };
    const facade = new HarnessRuntimeFacade({
      adapters: [adapter],
      protocolProxyFactory: vi.fn(async options => {
        failProxy = () => { void options.onTrace?.("error", "Protocol proxy rejected malformed tool arguments", { errorCode: "PROTOCOL_TOOL_ARGUMENTS_INVALID" }); };
        return ({
        baseUrl: "http://127.0.0.1:43199/v1",
        token: "invocation-token",
        close: vi.fn(async () => undefined),
        getFailure: () => failed ? {
          code: "PROTOCOL_TOOL_ARGUMENTS_INVALID" as const,
          message: "Gateway returned invalid JSON tool arguments for read",
          toolName: "read",
          sourceProtocol: "chat-completions" as const,
          targetProtocol: "responses" as const,
          model: "fixture-model"
        } : undefined,
        resetFailure
      }); })
    });
    const source = await request(root);
    const explainerRuntime = path.join(source.projectPath, "runtime", "inv_explainer_protocol");
    const explainerWorkspace = path.join(explainerRuntime, "workspaces");
    const explainerInbox = path.join(
      explainerWorkspace,
      ".scienceevolve",
      "inv_explainer_protocol.md"
    );
    const explainerMemory = path.join(explainerWorkspace, "Memory.md");
    await fs.mkdir(path.dirname(explainerInbox), { recursive: true });
    await Promise.all([
      fs.writeFile(explainerInbox, "quoted explainer evidence\n", "utf8"),
      fs.writeFile(explainerMemory, "explainer memory\n", "utf8")
    ]);
    const traces: string[] = [];

    const result = await facade.runExplainer({
      invocationId: "inv_explainer_protocol",
      projectId: source.project.id,
      projectPath: source.projectPath,
      workspacePath: explainerWorkspace,
      runtimePath: explainerRuntime,
      inboxPath: explainerInbox,
      memoryPath: explainerMemory,
      harnessId: descriptor.id,
      gateway: {
        id: "gwy_fixture",
        name: "Fixture gateway",
        url: "https://gateway.example.test/v1",
        apiKey: "upstream-secret",
        models: ["fixture-model"],
        defaultModel: "fixture-model",
        protocol: "responses"
      },
      model: "fixture-model",
      reasoningEffort: "low",
      prompt: "Explain the fixture evidence without modifying it.",
      onTrace: (_kind, message) => { traces.push(message); },
      onEvent: () => undefined
    }, new AbortController().signal);

    expect(adapter.contexts).toHaveLength(2);
    expect(adapter.contexts.map((context) => context.spec.session?.generation)).toEqual([0, 1]);
    expect(adapter.contexts[1]?.spec.prompt).toContain(
      "the previous native Session emitted invalid JSON tool arguments"
    );
    expect(result.session).toMatchObject({ harnessId: descriptor.id, generation: 1 });
    expect(traces).toContain(
      "Explainer received invalid tool arguments; retrying once with a same-Harness replacement Session"
    );
    expect(resetFailure).toHaveBeenCalledOnce();
    if (liveFailure) {
      expect(adapter.contexts[0]!.signal.aborted).toBe(true);
      expect(adapter.contexts[1]!.signal.aborted).toBe(false);
      expect(adapter.contexts[1]!.spec.prompt).toContain("call get_context");
    }
  });

  it("keeps the Explainer protocol recovery independent from its resume replacement", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-runtime-explainer-resume-protocol-"));
    roots.push(root);
    const adapter = new FixtureAdapter();
    adapter.failNextResume = true;
    let resetCount = 0;
    const resetFailure = vi.fn(() => { resetCount += 1; });
    const protocolFailure = {
      code: "PROTOCOL_TOOL_ARGUMENTS_INVALID" as const,
      message: "Gateway returned invalid JSON tool arguments for read",
      toolName: "read",
      sourceProtocol: "chat-completions" as const,
      targetProtocol: "responses" as const,
      model: "fixture-model"
    };
    const facade = new HarnessRuntimeFacade({
      adapters: [adapter],
      protocolProxyFactory: vi.fn(async () => ({
        baseUrl: "http://127.0.0.1:43199/v1",
        token: "invocation-token",
        close: vi.fn(async () => undefined),
        getFailure: () => adapter.contexts.length === 2 && resetCount === 1
          ? protocolFailure
          : undefined,
        resetFailure
      }))
    });
    const source = await request(root);
    const explainerRuntime = path.join(source.projectPath, "runtime", "inv_explainer_resume_protocol");
    const explainerWorkspace = path.join(explainerRuntime, "workspaces");
    const explainerInbox = path.join(
      explainerWorkspace,
      ".scienceevolve",
      "inv_explainer_resume_protocol.md"
    );
    const explainerMemory = path.join(explainerWorkspace, "Memory.md");
    await fs.mkdir(path.dirname(explainerInbox), { recursive: true });
    await Promise.all([
      fs.writeFile(explainerInbox, "quoted explainer evidence\n", "utf8"),
      fs.writeFile(explainerMemory, "explainer memory\n", "utf8")
    ]);
    const traces: string[] = [];

    const result = await facade.runExplainer({
      invocationId: "inv_explainer_resume_protocol",
      projectId: source.project.id,
      projectPath: source.projectPath,
      workspacePath: explainerWorkspace,
      runtimePath: explainerRuntime,
      inboxPath: explainerInbox,
      memoryPath: explainerMemory,
      harnessId: descriptor.id,
      gateway: {
        id: "gwy_fixture",
        name: "Fixture gateway",
        url: "https://gateway.example.test/v1",
        apiKey: "upstream-secret",
        models: ["fixture-model"],
        defaultModel: "fixture-model",
        protocol: "responses"
      },
      model: "fixture-model",
      reasoningEffort: "low",
      prompt: "Explain the fixture evidence without modifying it.",
      session: {
        schemaVersion: 1,
        harnessId: descriptor.id,
        adapterVersion: descriptor.adapterVersion,
        generation: 2,
        nativeId: "fixture-native-existing",
        durable: true,
        createdAt: "2026-09-16T00:00:00.000Z"
      },
      onTrace: (_kind, message) => { traces.push(message); },
      onEvent: () => undefined
    }, new AbortController().signal);

    expect(result.session).toMatchObject({ harnessId: descriptor.id, generation: 4 });
    expect(adapter.contexts.map((context) => context.spec.session?.generation)).toEqual([2, 3, 4]);
    expect(adapter.contexts.map((context) => context.spec.invocationId)).toEqual([
      "inv_explainer_resume_protocol",
      "inv_explainer_resume_protocol",
      "inv_explainer_resume_protocol"
    ]);
    expect(adapter.contexts[2]?.spec.prompt).toContain(
      "the previous native Session emitted invalid JSON tool arguments"
    );
    expect(traces).toContain("Explainer native session failed; retrying with a same-Harness replacement");
    expect(traces).toContain("Explainer received invalid tool arguments; retrying once with a same-Harness replacement Session");
    expect(resetFailure).toHaveBeenCalledTimes(2);
  });
});
