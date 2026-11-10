import { readFile } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";
import type { AgentRunRequest } from "../../src/core/types.js";
import type {
  HarnessEvent,
  InvocationInputs
} from "../../src/core/harness-runtime/contracts.js";
import {
  ASSISTANT_MESSAGE_LIMIT,
  emitCanonicalTrace,
  OfficialEventBridge,
  TOOL_RESULT_PREVIEW_LIMIT,
  validateCanonicalHarnessEvent
} from "../../src/core/harness-runtime/official-event-bridge.js";
import { BUILTIN_HARNESS_DESCRIPTORS } from "../../src/core/harness-runtime/registry.js";
import { mapCodexOfficialEvent } from "../../src/core/harness-runtime/adapters/codex-event-mapper.js";
import { mapPiOfficialEvent } from "../../src/core/harness-runtime/adapters/pi-event-mapper.js";
import { dshOfficialEventMapper } from "../../src/core/harness-runtime/adapters/dsh-event-mapper.js";
import { CodexAdapter } from "../../src/core/harness-runtime/adapters/codex-adapter.js";
import { PiAdapter } from "../../src/core/harness-runtime/adapters/pi-adapter.js";
import { DshAdapter } from "../../src/core/harness-runtime/adapters/dsh-adapter.js";
import type { HarnessAdapter } from "../../src/core/harness-runtime/contracts.js";
import { exerciseAdapterContract } from "./harness-runtime-contract.js";

const fixtureMappers = {
  codex: mapCodexOfficialEvent,
  pi: mapPiOfficialEvent,
  dsh: dshOfficialEventMapper("fixture-session")
} as const;

const actualAdapters: HarnessAdapter[] = [
  new CodexAdapter({ harnessExecutables: { codex: (process.platform === "win32" ? process.execPath : "/bin/true") } }),
  new PiAdapter({ harnessExecutables: { pi: (process.platform === "win32" ? process.execPath : "/bin/true") } }),
  new DshAdapter({ harnessExecutables: { dsh: (process.platform === "win32" ? process.execPath : "/bin/true") } })
];

const sessionInputs: InvocationInputs = {
  projectPath: "/fixture/project",
  workspacePath: "/fixture/project/workspaces",
  inboxPath: "/fixture/project/workspaces/.scienceevolve/inbox/inv-fixture.md",
  memoryPath: "/fixture/project/workspaces/Memory.md",
  runtimePath: "/fixture/project/runtime/inv-fixture",
  inboxSha256: "fixture"
};

const sessionRequest = {
  project: { id: "prj_fixture" },
  projectPath: sessionInputs.projectPath,
  workspacePath: sessionInputs.workspacePath,
  runtimePath: sessionInputs.runtimePath,
  inboxPath: sessionInputs.inboxPath,
  invocationId: "inv-fixture",
  agent: "main",
  kind: "main"
} as AgentRunRequest;

const validNativeSessionIds: Record<string, string> = {
  codex: "00000000-0000-4000-8000-000000000001",
  pi: "/fixture/project/runtime/harness-sessions/main/pi/sessions/session-7.jsonl",
  dsh: "prj_fixture-main-g7-fixture"
};

const canonicalDescriptor = BUILTIN_HARNESS_DESCRIPTORS.find((item) => item.id === "codex")!;

function canonicalEvent(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 1,
    eventId: "event-1",
    seq: 0,
    timestamp: "2026-09-16T00:00:00.000Z",
    invocationId: "inv-fixture",
    harnessId: canonicalDescriptor.id,
    kind: "lifecycle",
    phase: "started",
    ...overrides
  };
}

function canonicalFailure(value: unknown): unknown {
  try {
    validateCanonicalHarnessEvent(value, canonicalDescriptor);
  } catch (error) {
    return error;
  }
  throw new Error("Expected canonical event validation to fail");
}

async function officialFixtureEvents(harnessId: keyof typeof fixtureMappers): Promise<HarnessEvent[]> {
  const descriptor = BUILTIN_HARNESS_DESCRIPTORS.find((item) => item.id === harnessId)!;
  const events: HarnessEvent[] = [];
  const bridge = new OfficialEventBridge({
    descriptor,
    invocationId: "inv_fixture",
    mapEvent: fixtureMappers[harnessId],
    onEvent: (event) => events.push(event)
  });
  const fixture = await readFile(new URL(`./fixtures/harness-events/${harnessId}.jsonl`, import.meta.url));
  bridge.feed(fixture.subarray(0, 17));
  bridge.feed(fixture.subarray(17));
  await bridge.finish();
  return events;
}

describe("OfficialEventBridge", () => {
  it("persists only provided visible summaries and body-free activity through the trace sink", async () => {
    const onTrace = vi.fn();
    const summary = validateCanonicalHarnessEvent(canonicalEvent({ kind: "reasoning.summary", phase: "completed", message: "Check the evidence." }), canonicalDescriptor);
    await emitCanonicalTrace(summary, onTrace);
    expect(onTrace).toHaveBeenLastCalledWith("message", "Check the evidence.", expect.objectContaining({ canonicalEvent: summary }));
    await emitCanonicalTrace({ ...summary, message: " " }, onTrace);
    expect(onTrace).toHaveBeenCalledOnce();
    const activity = validateCanonicalHarnessEvent(canonicalEvent({ kind: "activity", phase: "delta", message: "private" }), canonicalDescriptor);
    await emitCanonicalTrace(activity, onTrace);
    expect(onTrace).toHaveBeenLastCalledWith("status", "", expect.objectContaining({ canonicalEvent: activity }));
    expect(JSON.stringify(activity)).not.toContain("private");
  });
  it.each(["codex", "pi", "dsh"])(
    "maps %s official events to the same tool lifecycle",
    async (harnessId) => {
      // Deliberately split UTF-8/event framing across arbitrary chunks.
      const events = await officialFixtureEvents(harnessId as keyof typeof fixtureMappers);

      expect(events.some((event) => event.kind === "tool.started")).toBe(true);
      expect(events.some((event) => event.kind === "tool.completed")).toBe(true);
      expect(events.some((event) => event.kind === "assistant.message")).toBe(true);
      expect(events.every((event, index) => event.seq === index)).toBe(true);
      expect(JSON.stringify(events)).not.toMatch(/hidden reasoning|chain-of-thought/i);
      expect(new Set(events.map((event) => event.eventId)).size).toBe(events.length);
      expect(events.filter((event) => event.kind === "usage")).toEqual([
        expect.objectContaining({
          usage: expect.objectContaining({
            inputTokens: 12,
            cachedInputTokens: 2,
            outputTokens: 4,
            totalTokens: 16
          })
        })
      ]);
      if (harnessId === "pi") {
        expect(events.some((event) =>
          event.kind === "tool.updated" && event.tool?.callId === "tool-1"
        )).toBe(true);
      }
      if (harnessId === "dsh") {
        expect(events.find((event) => event.kind === "tool.started")).toMatchObject({
          itemId: "dsh:fixture-session:1"
        });
        expect(events.find((event) => event.kind === "assistant.message")).toMatchObject({
          itemId: "dsh:fixture-session:3"
        });
      }
    }
  );

  it.each([
    ["codex", {
      type: "item.completed",
      item: { id: "reasoning-1", type: "reasoning", text: "CODEX_RAW_REASONING" }
    }],
    ["pi", {
      type: "message_update",
      assistantMessageEvent: { type: "thinking_delta", delta: "PI_RAW_REASONING" }
    }],
    ["dsh", {
      jsonrpc: "2.0",
      method: "session.event",
      params: {
        sessionId: "fixture-session",
        event: {
          type: "assistant/chunk",
          seq: 0,
          time: 946684800000,
          data: { chunk: { type: "reasoning-delta", delta: "DSH_RAW_REASONING" } }
        }
      }
    }]
  ] as const)("maps %s hidden reasoning to a body-free activity heartbeat", async (harnessId, frame) => {
    const descriptor = BUILTIN_HARNESS_DESCRIPTORS.find((item) => item.id === harnessId)!;
    const events: HarnessEvent[] = [];
    const bridge = new OfficialEventBridge({
      descriptor,
      invocationId: `inv_hidden_${harnessId}`,
      mapEvent: fixtureMappers[harnessId],
      onEvent: (event) => events.push(event)
    });

    await bridge.accept(frame);

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ kind: "activity", phase: "delta" });
    expect(events[0]).not.toHaveProperty("message");
    expect(JSON.stringify(events)).not.toMatch(/RAW_REASONING/);
  });

  it("maps Codex metadata fallback items as diagnostics, not orphan tool completions", async () => {
    const descriptor = BUILTIN_HARNESS_DESCRIPTORS.find((item) => item.id === "codex")!;
    const events: HarnessEvent[] = [];
    const bridge = new OfficialEventBridge({
      descriptor,
      invocationId: "inv_codex_metadata",
      mapEvent: mapCodexOfficialEvent,
      onEvent: (event) => events.push(event)
    });

    await bridge.accept({
      type: "item.completed",
      item: {
        id: "item-0",
        type: "error",
        message: "Model metadata is unavailable; using fallback metadata"
      }
    });

    expect(events).toEqual([
      expect.objectContaining({
        kind: "diagnostic",
        phase: "completed",
        diagnostic: expect.objectContaining({ level: "warning" })
      })
    ]);
    expect(events[0]?.tool).toBeUndefined();
  });

  it("preserves the native Codex MCP tool name and arguments", async () => {
    const descriptor = BUILTIN_HARNESS_DESCRIPTORS.find((item) => item.id === "codex")!;
    const events: HarnessEvent[] = [];
    const bridge = new OfficialEventBridge({
      descriptor,
      invocationId: "inv_codex_mcp",
      mapEvent: mapCodexOfficialEvent,
      onEvent: (event) => events.push(event)
    });
    const argumentsValue = { callId: "complete-1", rationale: "done" };

    await bridge.accept({
      type: "item.started",
      item: {
        id: "item-mcp",
        type: "mcp_tool_call",
        server: "scienceevolve-orchestration-control",
        tool: "complete_project",
        arguments: argumentsValue,
        status: "in_progress"
      }
    });
    await bridge.accept({
      type: "item.completed",
      item: {
        id: "item-mcp",
        type: "mcp_tool_call",
        server: "scienceevolve-orchestration-control",
        tool: "complete_project",
        arguments: argumentsValue,
        result: {
          content: [{ type: "text", text: "Action complete_project staged" }]
        },
        status: "completed"
      }
    });

    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({
      kind: "tool.started",
      message: "complete_project",
      tool: {
        callId: "item-mcp",
        name: "complete_project",
        toolType: "mcp",
        status: "started",
        input: JSON.stringify(argumentsValue)
      }
    });
    expect(events[1]).toMatchObject({
      kind: "tool.completed",
      message: "complete_project",
      tool: {
        callId: "item-mcp",
        name: "complete_project",
        toolType: "mcp",
        status: "completed",
        outputPreview: expect.stringContaining("Action complete_project staged")
      }
    });
  });

  it("retains the final app-server agentMessage as the normal handoff", async () => {
    const events: HarnessEvent[] = [];
    const handoffs: string[] = [];
    const bridge = new OfficialEventBridge({
      descriptor: canonicalDescriptor, invocationId: "inv_codex_resident",
      mapEvent: new CodexAdapter({ harnessExecutables: { codex: (process.platform === "win32" ? process.execPath : "/bin/true") } }).resident.createOfficialEventMapper(),
      onEvent: event => { events.push(event); },
      onFullAssistantMessage: message => { handoffs.push(message); }
    });
    for (const [method, text] of [["item/started", "partial"], ["item/completed", "Actual final handoff"]]) {
      await bridge.accept({ method, params: { threadId: "thread", turnId: "turn",
        item: { type: "agentMessage", id: "message-1", text, phase: "final_answer" } } });
    }
    expect(events).toEqual([expect.objectContaining({
      kind: "assistant.message", itemId: "message-1", message: "Actual final handoff"
    })]);
    expect(handoffs).toEqual(["Actual final handoff"]);
  });

  it("does not classify app-server userMessage as an executed tool", async () => {
    const events = mapCodexOfficialEvent({ type: "item.completed",
      item: { type: "userMessage", id: "user-1", clientId: "input-1",
        content: [{ type: "text", text: "Normal input" }] } });
    expect(events.every(event => !event.kind.startsWith("tool."))).toBe(true);
  });

  it.each(["codex", "pi", "dsh"] as const)("retains %s actual normal input separately from queued acknowledgements", async harness => {
    const message = "Final result for the original call. ".repeat(1_500) +
      "Authorization: Bearer private-native-input-secret\noriginal-result-tail-sentinel";
    const frame = harness === "codex"
      ? { type: "item.completed", item: { type: "userMessage", id: "native-user", content: [{ type: "text", text: message }] } }
      : harness === "pi"
        ? { type: "message_end", message: { role: "user", content: [{ type: "text", text: message }] } }
        : { method: "session.event", params: { sessionId: "fixture-session", event: { type: "user/message", seq: 7,
            surfaceOp: "append", data: { id: "native-user", role: "user", source: { kind: "user" }, content: [{ type: "text", text: message }] } } } };
    const events: HarnessEvent[] = [];
    const nativeInputs: HarnessEvent[] = [];
    const bridge = new OfficialEventBridge({ descriptor: BUILTIN_HARNESS_DESCRIPTORS.find(row => row.id === harness)!,
      invocationId: "input-turn", mapEvent: fixtureMappers[harness], onEvent: event => { events.push(event); },
      onNativeUserInput: event => { nativeInputs.push(event); } });
    await bridge.accept(frame);
    expect(events).toEqual([expect.objectContaining({ kind: "user.message", phase: "completed" })]);
    expect(events[0].message).toHaveLength(TOOL_RESULT_PREVIEW_LIMIT);
    expect(nativeInputs).toEqual([expect.objectContaining({ kind: "user.message", eventId: events[0].eventId })]);
    expect(nativeInputs[0].message).toContain("original-result-tail-sentinel");
    expect(nativeInputs[0].message).toContain("[REDACTED]");
    expect(nativeInputs[0].message).not.toContain("private-native-input-secret");
  });

  it("does not manufacture normal input from protocol admission, partial input or DSH replacement summaries", () => {
    expect(mapCodexOfficialEvent({ type: "item.started", item: { type: "userMessage", id: "partial", content: [{ type: "text", text: "queued" }] } })).toEqual([]);
    expect(mapPiOfficialEvent({ type: "response", command: "prompt", success: true })).toEqual([]);
    expect(mapPiOfficialEvent({ type: "message_start", message: { role: "user", content: "partial" } })).toEqual([]);
    const dsh = dshOfficialEventMapper("fixture-session");
    expect(dsh({ jsonrpc: "2.0", id: 1, result: { messageId: "queued" } })).toEqual([]);
    expect(dsh({ method: "session.event", params: { sessionId: "fixture-session", event: { type: "user/message", seq: 1,
      surfaceOp: "replace", data: { source: { kind: "user" }, content: [{ type: "text", text: "summary" }] } } } })).toEqual([]);
    expect(dsh({ method: "session.event", params: { sessionId: "foreign-session", event: { type: "user/message", seq: 2,
      surfaceOp: "append", data: { source: { kind: "user" }, content: [{ type: "text", text: "foreign" }] } } } })).toEqual([]);
  });

  it("preserves app-server MCP server identity and real failure output", async () => {
    const events: HarnessEvent[] = [];
    const bridge = new OfficialEventBridge({
      descriptor: canonicalDescriptor, invocationId: "inv_codex_resident_mcp",
      mapEvent: new CodexAdapter({ harnessExecutables: { codex: (process.platform === "win32" ? process.execPath : "/bin/true") } }).resident.createOfficialEventMapper(),
      onEvent: event => { events.push(event); }
    });
    await bridge.accept({ method: "item/completed", params: { threadId: "thread", turnId: "turn",
      item: { type: "mcpToolCall", id: "mcp-1", server: "openfars-resident-control",
        tool: "apply_workflow", arguments: { callId: "apply-1" }, status: "failed",
        result: null, error: { message: "Original rejection" } } } });
    expect(events).toEqual([expect.objectContaining({ kind: "tool.failed", tool: expect.objectContaining({
      callId: "mcp-1", name: "apply_workflow", server: "openfars-resident-control", toolType: "mcp",
      input: JSON.stringify({ callId: "apply-1" }), outputPreview: expect.stringContaining("Original rejection")
    }) })]);
  });

  it.each([true, false])("preserves the actual Codex resident error message (willRetry: %s)", async willRetry => {
    const events: HarnessEvent[] = [];
    const bridge = new OfficialEventBridge({
      descriptor: canonicalDescriptor, invocationId: "inv_codex_resident_error",
      mapEvent: new CodexAdapter().resident.createOfficialEventMapper(),
      onEvent: event => { events.push(event); }
    });
    await bridge.accept({ method: "error", params: {
      threadId: "thread", turnId: "turn", willRetry,
      error: { message: "Provider stream ended before the terminal event. Authorization: Bearer private-diagnostic-token",
        additionalDetails: "PRIVATE_ADDITIONAL_DETAILS", arbitrary: "PRIVATE_ERROR_FIELD" }
    } });
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ kind: "diagnostic", sourceType: "error", phase: "completed",
      message: expect.stringContaining("Provider stream ended before the terminal event."),
      diagnostic: { source: "cli", level: "error", message: expect.stringContaining("Provider stream ended before the terminal event.") }
    });
    expect(events[0]?.message).toContain("[REDACTED]");
    expect(JSON.stringify(events)).not.toMatch(/private-diagnostic-token|PRIVATE_ADDITIONAL_DETAILS|PRIVATE_ERROR_FIELD/);
    expect(events[0]?.tool).toBeUndefined();
  });

  it.each([
    { type: "turn.failed", error: { message: "Original structured rejection", ignored: "PRIVATE_ERROR_FIELD" } },
    { type: "error", error: "Original string rejection" },
    { type: "error", message: "Original top-level rejection", error: { message: "Secondary rejection" } }
  ])("preserves Codex exec diagnostics: $type", frame => {
    const expectedMessage = typeof frame.message === "string" ? frame.message
      : typeof frame.error === "string" ? frame.error : frame.error.message;
    expect(mapCodexOfficialEvent(frame)).toEqual([{ kind: "diagnostic", sourceType: frame.type,
      message: expectedMessage, diagnostic: { source: "cli", level: "error", message: expectedMessage } }]);
  });

  it.each(actualAdapters.map((adapter) => [adapter.descriptor.id, adapter] as const))(
    "%s satisfies the shared Adapter contract against its official fixture",
    async (harnessId, adapter) => {
      await exerciseAdapterContract({
        adapter,
        probe: { model: "fixture-model", reasoningEffort: "low" },
        sessionRequest,
        sessionInputs,
        validNativeSessionId: validNativeSessionIds[harnessId]!,
        expectedToolOutput: "fixture-sentinel",
        runOfficialFixture: () => officialFixtureEvents(
          harnessId as keyof typeof fixtureMappers
        )
      });
    }
  );

  it.each([
    ["codex", {
      type: "item.completed",
      item: {
        id: "tool-large",
        type: "command_execution",
        name: "read",
        aggregated_output: "x".repeat(TOOL_RESULT_PREVIEW_LIMIT + 50),
        exit_code: 0
      }
    }],
    ["pi", {
      type: "tool_execution_end",
      toolCallId: "tool-large",
      toolName: "read",
      result: "x".repeat(TOOL_RESULT_PREVIEW_LIMIT + 50),
      isError: false
    }],
    ["dsh", {
      method: "session.event",
      params: {
        sessionId: "fixture-session",
        event: { type: "tool/result", seq: 0, time: 946684800000, data: { message: {
          toolCallId: "tool-large",
          toolName: "read",
          content: "x".repeat(TOOL_RESULT_PREVIEW_LIMIT + 50),
          isError: false
        } } }
      }
    }]
  ] as const)("truncates a %s tool result preview at the canonical limit", async (harnessId, frame) => {
    const events: HarnessEvent[] = [];
    const descriptor = BUILTIN_HARNESS_DESCRIPTORS.find((item) => item.id === harnessId)!;
    const bridge = new OfficialEventBridge({
      descriptor,
      invocationId: "inv",
      mapEvent: fixtureMappers[harnessId],
      onEvent: (event) => events.push(event)
    });
    await bridge.accept(frame);
    expect(events[0]?.tool?.outputPreview).toHaveLength(TOOL_RESULT_PREVIEW_LIMIT);
    expect(events[0]?.tool?.truncated).toBe(true);
  });

  it.each([
    ["codex", {
      type: "item.completed",
      item: { id: "tool-failed", type: "command_execution", exit_code: 1, status: "failed" }
    }],
    ["pi", {
      type: "tool_execution_end",
      toolCallId: "tool-failed",
      toolName: "read",
      result: "failed",
      isError: true
    }],
    ["dsh", {
      method: "session.event",
      params: {
        sessionId: "fixture-session",
        event: { type: "tool/result", seq: 0, time: 946684800000, data: { message: {
          toolCallId: "tool-failed",
          toolName: "read",
          content: "failed",
          isError: true
        } } }
      }
    }]
  ] as const)("maps a %s official tool failure without inferring success", async (harnessId, frame) => {
    const events: HarnessEvent[] = [];
    const descriptor = BUILTIN_HARNESS_DESCRIPTORS.find((item) => item.id === harnessId)!;
    const bridge = new OfficialEventBridge({
      descriptor,
      invocationId: "inv_failed",
      mapEvent: fixtureMappers[harnessId],
      onEvent: (event) => events.push(event)
    });

    await bridge.accept(frame);

    expect(events).toEqual([
      expect.objectContaining({
        kind: "tool.failed",
        phase: "failed",
        tool: expect.objectContaining({
          callId: "tool-failed",
          status: "failed",
          isError: true
        })
      })
    ]);
  });

  it("fails closed on malformed official JSON instead of inventing text events", async () => {
    const descriptor = BUILTIN_HARNESS_DESCRIPTORS.find((item) => item.id === "pi")!;
    const events: HarnessEvent[] = [];
    const onFatal = vi.fn();
    const bridge = new OfficialEventBridge({
      descriptor,
      invocationId: "inv",
      mapEvent: mapPiOfficialEvent,
      onEvent: (event) => events.push(event),
      onFatal
    });
    bridge.feed(`${JSON.stringify({ type: "session", id: "fixture" })}\n`);
    bridge.feed('{"authorization":"Bearer sk-private-value" broken}\n');
    bridge.feed(`${JSON.stringify({
      type: "message_end",
      message: { role: "assistant", content: [{ type: "text", text: "must-not-emit" }] }
    })}\n`);
    const failure = await bridge.finish().catch((error: unknown) => error);
    expect(failure).toMatchObject({
      code: "HARNESS_EVENT_STREAM_FAILED",
      safeMessage: "Invalid official JSON event",
      cause: expect.any(SyntaxError)
    });
    expect((failure as Error).message).not.toMatch(/private|Bearer|authorization/);
    expect(onFatal).toHaveBeenCalledOnce();
    expect(onFatal).toHaveBeenCalledWith(failure);
    expect(events).toHaveLength(1);
    expect(JSON.stringify(events)).not.toContain("must-not-emit");
  });

  it("signals an event-consumer failure immediately and stops later canonical events", async () => {
    const descriptor = BUILTIN_HARNESS_DESCRIPTORS.find((item) => item.id === "pi")!;
    const events: HarnessEvent[] = [];
    let resolveFatal!: (error: unknown) => void;
    const fatalSignal = new Promise<unknown>((resolve) => { resolveFatal = resolve; });
    const onFatal = vi.fn((error: unknown) => resolveFatal(error));
    const bridge = new OfficialEventBridge({
      descriptor,
      invocationId: "inv_consumer_failure",
      mapEvent: mapPiOfficialEvent,
      onFatal,
      onEvent: (event) => {
        events.push(event);
        throw new Error("fixture event sink rejected");
      }
    });

    bridge.feed(`${JSON.stringify({ type: "session", id: "fixture" })}\n`);
    bridge.feed(`${JSON.stringify({ type: "agent_start" })}\n`);
    const signaledFailure = await fatalSignal;
    const failure = await bridge.finish().catch((error: unknown) => error);

    expect(signaledFailure).toBe(failure);
    expect(failure).toMatchObject({
      code: "HARNESS_EVENT_STREAM_FAILED",
      safeMessage: "Unable to publish a canonical Harness event"
    });
    expect(onFatal).toHaveBeenCalledOnce();
    expect(events).toHaveLength(1);
  });

  it("classifies an Adapter mapper failure as a damaged official event stream", async () => {
    const descriptor = BUILTIN_HARNESS_DESCRIPTORS.find((item) => item.id === "pi")!;
    const bridge = new OfficialEventBridge({
      descriptor,
      invocationId: "inv_mapper_failure",
      mapEvent: () => { throw new Error("synthetic mapper failure"); },
      onEvent: () => undefined
    });

    const failure = await bridge.accept({ type: "fixture" }).catch((error: unknown) => error);
    expect(failure).toMatchObject({
      code: "HARNESS_EVENT_STREAM_FAILED",
      source: "adapter",
      harnessId: "pi",
      safeMessage: "Unable to map an official event frame",
      cause: expect.objectContaining({ message: "synthetic mapper failure" })
    });
    expect((failure as Error).message).not.toContain("synthetic mapper failure");
  });

  it("fails closed when a DSH session event omits its official native sequence", async () => {
    const descriptor = BUILTIN_HARNESS_DESCRIPTORS.find((item) => item.id === "dsh")!;
    const bridge = new OfficialEventBridge({
      descriptor,
      invocationId: "inv_dsh_missing_seq",
      mapEvent: dshOfficialEventMapper("fixture-session"),
      onEvent: () => undefined
    });

    const failure = await bridge.accept({
      jsonrpc: "2.0",
      method: "session.event",
      params: {
        sessionId: "fixture-session",
        event: { type: "turn/start", time: 946684800000, data: { turn: 1 } }
      }
    }).catch((error: unknown) => error);

    expect(failure).toMatchObject({
      code: "HARNESS_EVENT_STREAM_FAILED",
      safeMessage: "Unable to map an official event frame",
      harnessId: "dsh"
    });
  });

  it("matches a DSH tool result to an active call when its call-ID fields disagree", async () => {
    const descriptor = BUILTIN_HARNESS_DESCRIPTORS.find((item) => item.id === "dsh")!;
    const events: HarnessEvent[] = [];
    const bridge = new OfficialEventBridge({
      descriptor,
      invocationId: "inv_dsh_call_id_conflict",
      mapEvent: dshOfficialEventMapper("conflict-session"),
      onEvent: (event) => events.push(event)
    });

    await bridge.accept({
      jsonrpc: "2.0",
      method: "session.event",
      params: {
        sessionId: "conflict-session",
        event: {
          type: "tool/call",
          seq: 0,
          time: 946684800000,
          data: { callId: "active-call", name: "read", arguments: { path: "sentinel.txt" } }
        }
      }
    });
    await bridge.accept({
      jsonrpc: "2.0",
      method: "session.event",
      params: {
        sessionId: "conflict-session",
        event: {
          type: "tool/result",
          seq: 1,
          time: 946684800001,
          data: {
            message: {
              source: { kind: "tool", callId: "stale-call" },
              content: [{
                type: "tool-result",
                toolCallId: "active-call",
                content: [{ type: "text", text: "fixture-sentinel" }]
              }]
            }
          }
        }
      }
    });

    expect(events.map((event) => event.kind)).toEqual([
      "tool.started",
      "diagnostic",
      "tool.completed"
    ]);
    expect(events[1]).toMatchObject({
      sourceType: "tool/result.call_id_conflict",
      itemId: "dsh:conflict-session:1",
      diagnostic: expect.objectContaining({ level: "warning" })
    });
    expect(events[2]).toMatchObject({
      kind: "tool.completed",
      tool: expect.objectContaining({
        callId: "active-call",
        outputPreview: "fixture-sentinel"
      })
    });
  });

  it.each([
    ["codex started", "codex", {
      type: "item.started",
      item: { type: "command_execution", command: "read sentinel.txt" }
    }],
    ["codex completed", "codex", {
      type: "item.completed",
      item: { type: "command_execution", aggregated_output: "fixture-sentinel", exit_code: 0 }
    }],
    ["pi started", "pi", {
      type: "tool_execution_start",
      toolName: "read",
      args: { path: "sentinel.txt" }
    }],
    ["pi completed", "pi", {
      type: "tool_execution_end",
      toolName: "read",
      result: "fixture-sentinel",
      isError: false
    }],
    ["dsh started", "dsh", {
      method: "session.event",
      params: {
        sessionId: "fixture-session",
        event: {
          type: "tool/call",
          seq: 0,
          time: 946684800000,
          data: { name: "read", arguments: { path: "sentinel.txt" } }
        }
      }
    }],
    ["dsh completed", "dsh", {
      method: "session.event",
      params: {
        sessionId: "fixture-session",
        event: { type: "tool/result", seq: 0, time: 946684800000, data: { message: {
          toolName: "read",
          content: "fixture-sentinel",
          isError: false
        } } }
      }
    }]
  ] as const)("fails closed when the %s event lacks the official call ID", async (
    _label,
    harnessId,
    frame
  ) => {
    const events: HarnessEvent[] = [];
    const descriptor = BUILTIN_HARNESS_DESCRIPTORS.find((item) => item.id === harnessId)!;
    const bridge = new OfficialEventBridge({
      descriptor,
      invocationId: "inv_missing_call_id",
      mapEvent: fixtureMappers[harnessId],
      onEvent: (event) => events.push(event)
    });

    const failure = await bridge.accept(frame).catch((error: unknown) => error);

    expect(failure).toMatchObject({
      code: "HARNESS_EVENT_STREAM_FAILED",
      safeMessage: "Unable to map an official event frame",
      harnessId
    });
    expect(events).toEqual([]);
  });

  it("does not treat unmapped official frames as substantive activity", async () => {
    const descriptor = BUILTIN_HARNESS_DESCRIPTORS.find((item) => item.id === "pi")!;
    const events: HarnessEvent[] = [];
    const onActivity = vi.fn();
    const bridge = new OfficialEventBridge({
      descriptor,
      invocationId: "inv_safe",
      onActivity,
      mapEvent: (event) => event.type === "tool"
        ? [{
            kind: "tool.completed",
            tool: {
              callId: "tool-safe",
              name: "fixture",
              status: "completed",
              input: { apiKey: "sk-fixture-secret-value" },
              outputPreview: "Authorization: Bearer fixture-secret-token"
            }
          }]
        : [],
      onEvent: (event) => events.push(event)
    });

    await bridge.accept({ type: "provider_bookkeeping" });
    expect(onActivity).not.toHaveBeenCalled();
    await bridge.accept({ type: "tool" });

    expect(onActivity).not.toHaveBeenCalled();
    expect(events[0]).toMatchObject({ phase: "completed" });
    expect(JSON.stringify(events)).toContain("[REDACTED]");
    expect(JSON.stringify(events)).not.toMatch(/fixture-secret/);
  });

  it("reduces hidden-reasoning drafts to body-free activity heartbeats", async () => {
    const descriptor = BUILTIN_HARNESS_DESCRIPTORS.find((item) => item.id === "codex")!;
    const events: HarnessEvent[] = [];
    const bridge = new OfficialEventBridge({
      descriptor,
      invocationId: "inv_hidden_reasoning",
      mapEvent: () => [{
        kind: "activity",
        sourceType: "reasoning.delta",
        message: "RAW_HIDDEN_REASONING_MUST_NOT_PERSIST"
      }],
      onEvent: (event) => events.push(event)
    });

    await bridge.accept({ type: "reasoning.delta", text: "native hidden payload" });

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ kind: "activity", phase: "delta" });
    expect(events[0]).not.toHaveProperty("message");
    expect(events[0]).not.toHaveProperty("sourceType");
    expect(JSON.stringify(events)).not.toContain("RAW_HIDDEN_REASONING_MUST_NOT_PERSIST");
    expect(JSON.stringify(events)).not.toContain("native hidden payload");
  });

  it("maps only an explicitly published Codex summary while keeping other reasoning fields private", async () => {
    const events: HarnessEvent[] = [];
    const bridge = new OfficialEventBridge({ descriptor: canonicalDescriptor, invocationId: "summary-test",
      mapEvent: mapCodexOfficialEvent, onEvent: event => { events.push(event); } });
    await bridge.accept({ type: "item.completed", item: { type: "reasoning", id: "public-summary",
      text: "RAW_PRIVATE_THOUGHT", encrypted_content: "PRIVATE_CIPHER", summary: [{ type: "summary_text", text: "Inspect the current draft before editing." }] } });
    expect(events).toEqual([expect.objectContaining({ kind: "reasoning.summary", itemId: "public-summary", message: "Inspect the current draft before editing." })]);
    expect(JSON.stringify(events)).not.toMatch(/RAW_PRIVATE_THOUGHT|PRIVATE_CIPHER/);
  });

  it("rejects unknown root fields and hidden-reasoning body channels", () => {
    for (const value of [
      canonicalEvent({ reasoning: "RAW_PRIVATE_REASONING" }),
      canonicalEvent({
        kind: "assistant.message",
        phase: "completed",
        sourceType: "thinking_delta",
        message: "RAW_PRIVATE_REASONING"
      })
    ]) {
      const failure = canonicalFailure(value);
      expect(failure).toMatchObject({
        code: "HARNESS_EVENT_STREAM_FAILED",
        harnessId: "codex",
        safeMessage: "Invalid canonical Harness event"
      });
      expect((failure as Error).message).not.toContain("RAW_PRIVATE_REASONING");
    }
  });

  it("reduces externally supplied activity to a body-free canonical heartbeat", () => {
    const event = validateCanonicalHarnessEvent(canonicalEvent({
      kind: "activity",
      phase: "delta",
      itemId: "reasoning-item",
      sourceType: "thinking_delta",
      message: "RAW_PRIVATE_REASONING",
      tool: { arbitrary: "RAW_PRIVATE_REASONING" },
      usage: { arbitrary: "RAW_PRIVATE_REASONING" },
      diagnostic: { arbitrary: "RAW_PRIVATE_REASONING" }
    }), canonicalDescriptor);

    expect(event).toEqual({
      schemaVersion: 1,
      eventId: "event-1",
      seq: 0,
      timestamp: "2026-09-16T00:00:00.000Z",
      invocationId: "inv-fixture",
      harnessId: "codex",
      kind: "activity",
      phase: "delta"
    });
    expect(JSON.stringify(event)).not.toContain("RAW_PRIVATE_REASONING");
  });

  it("redacts and truncates both tool input and output at the canonical ingress", () => {
    const event = validateCanonicalHarnessEvent(canonicalEvent({
      kind: "tool.completed",
      phase: "completed",
      tool: {
        callId: "call-1",
        name: "read",
        status: "completed",
        input: {
          password: "fixture-password-secret",
          content: "i".repeat(TOOL_RESULT_PREVIEW_LIMIT + 100)
        },
        outputPreview: `Authorization: Bearer fixture-secret-token-value ${"o".repeat(TOOL_RESULT_PREVIEW_LIMIT + 100)}`
      }
    }), canonicalDescriptor);

    expect(typeof event.tool?.input).toBe("string");
    expect((event.tool?.input as string).length).toBeLessThanOrEqual(TOOL_RESULT_PREVIEW_LIMIT);
    expect(event.tool?.outputPreview).toHaveLength(TOOL_RESULT_PREVIEW_LIMIT);
    expect(event.tool?.truncated).toBe(true);
    expect(JSON.stringify(event)).toContain("[REDACTED]");
    expect(JSON.stringify(event)).not.toMatch(/fixture-password-secret|fixture-secret-token-value/);
  });

  it("caps the displayed Assistant body while preserving the redacted full handoff", async () => {
    const body = `${"x".repeat(ASSISTANT_MESSAGE_LIMIT + 100)} api_key=fixture-secret-value`;
    const fullMessages: string[] = [];
    const events: HarnessEvent[] = [];
    const bridge = new OfficialEventBridge({
      descriptor: canonicalDescriptor,
      invocationId: "inv_large_assistant",
      mapEvent: () => [{ kind: "assistant.message", message: body }],
      onFullAssistantMessage: (message) => fullMessages.push(message),
      onEvent: (event) => events.push(event)
    });

    await bridge.accept({ type: "terminal-message" });

    expect(events).toEqual([
      expect.objectContaining({
        kind: "assistant.message",
        messageTruncated: true,
        message: expect.any(String)
      })
    ]);
    expect(events[0]?.message).toHaveLength(ASSISTANT_MESSAGE_LIMIT);
    expect(fullMessages[0]!.length).toBeGreaterThan(ASSISTANT_MESSAGE_LIMIT);
    expect(fullMessages[0]).toContain("[REDACTED]");
    expect(fullMessages[0]).not.toContain("fixture-secret-value");
  });

  it("accepts only descriptor-native usage with non-negative safe integer counters", () => {
    const valid = canonicalEvent({
      kind: "usage",
      phase: "completed",
      usage: {
        protocol: "responses",
        model: "fixture-model",
        inputTokens: 12,
        cachedInputTokens: 2,
        outputTokens: 4,
        totalTokens: 16
      }
    });
    expect(validateCanonicalHarnessEvent(valid, canonicalDescriptor).usage).toEqual({
      protocol: "responses",
      model: "fixture-model",
      inputTokens: 12,
      cachedInputTokens: 2,
      outputTokens: 4,
      totalTokens: 16
    });

    for (const usage of [
      { ...(valid.usage as object), protocol: "chat-completions" },
      { ...(valid.usage as object), outputTokens: -1 },
      { ...(valid.usage as object), totalTokens: Number.MAX_SAFE_INTEGER + 1 },
      { ...(valid.usage as object), hidden: "not-allowed" }
    ]) {
      expect(canonicalFailure({ ...valid, usage })).toMatchObject({
        code: "HARNESS_EVENT_STREAM_FAILED"
      });
    }
  });

  it("rejects malformed envelopes, nested fields, and tool status mismatches", () => {
    const invalidEvents = [
      canonicalEvent({ schemaVersion: 2 }),
      canonicalEvent({ timestamp: "not-a-timestamp" }),
      canonicalEvent({ phase: "completed" }),
      canonicalEvent({ kind: "reasoning", phase: "delta" }),
      canonicalEvent({ eventId: `event-${"x".repeat(513)}` }),
      canonicalEvent({
        kind: "tool.started",
        phase: "started",
        tool: { callId: "call-1", name: "read", status: "completed" }
      }),
      canonicalEvent({
        kind: "tool.completed",
        phase: "completed",
        tool: {
          callId: "call-1",
          name: "read",
          status: "completed",
          reasoning: "not-allowed"
        }
      }),
      canonicalEvent({
        kind: "diagnostic",
        phase: "completed",
        diagnostic: { source: "native", level: "debug", message: "invalid" }
      })
    ];

    for (const event of invalidEvents) {
      expect(canonicalFailure(event)).toMatchObject({
        code: "HARNESS_EVENT_STREAM_FAILED"
      });
    }
  });
});
