import { describe, expect, it, vi } from "vitest";
import { hermesAcpCodec, hermesOfficialEventMapper, hermesMcpServers } from "../src/host/hermes/hermes-acp.js";
import type { ResidentProtocolConnection } from "../src/core/harness-runtime/resident-native-driver.js";
import type { SessionRef } from "../src/core/harness-runtime/contracts.js";
import type { ResidentTurn } from "../src/core/harness-runtime/resident-lease.js";
import { HarnessRegistry } from "../src/core/harness-runtime/registry.js";
import { HermesAdapter } from "../src/host/hermes/hermes-adapter.js";
import { OfficialEventBridge } from "../src/core/harness-runtime/official-event-bridge.js";

const session: SessionRef = { schemaVersion: 1, harnessId: "hermes", adapterVersion: "1", generation: 0,
  nativeId: "pending:fixture", durable: true, createdAt: "2026-10-08T00:00:00.000Z" };
const update = (body: Record<string, unknown>, sessionId = "native-session") => ({ jsonrpc: "2.0", method: "session/update", params: { sessionId, update: body } });
const text = (s: string, messageId = "reply") => update({ sessionUpdate: "agent_message_chunk", messageId, content: { type: "text", text: s } });
const started = (id = "call1") => update({ sessionUpdate: "tool_call", toolCallId: id, title: "mcp__workspace__read: file.txt", status: "in_progress", rawInput: { path: "file.txt" } });
const ended = (id = "call1") => update({ sessionUpdate: "tool_call_update", toolCallId: id, status: "completed", rawOutput: "sentinel" });
function fixture(options: { events?: Record<string, unknown>[]; stopReason?: string; loadResult?: unknown;
  replay?: Record<string, unknown>[]; allowNativeTools?: boolean; requireHistory?: boolean } = {}) {
  let id = 0;
  const frames: Record<string, unknown>[] = [], sent: Record<string, unknown>[] = [], notified: Record<string, unknown>[] = [];
  const connection: ResidentProtocolConnection = {
    requestId: () => ++id,
    async send(frame) {
      sent.push(frame);
      if (frame.method === "initialize") frames.push({ id: frame.id, result: { protocolVersion: 1, agentInfo: { name: "hermes-agent" }, agentCapabilities: { loadSession: true } } });
      if (frame.method === "session/new") frames.push({ id: frame.id, result: { sessionId: "native-session" } });
      if (frame.method === "session/load") frames.push(...(options.replay ?? []), { id: frame.id, result: options.loadResult === undefined ? {} : options.loadResult });
      if (frame.method === "session/set_mode") frames.push({ id: frame.id, result: {} });
      if (frame.method === "session/prompt") frames.push(...(options.events ?? [started(), ended(), text("Done")]),
        { id: frame.id, result: { stopReason: options.stopReason ?? "end_turn", usage: { inputTokens: 3, outputTokens: 2, totalTokens: 5 } } });
    },
    async next(predicate) { const frame = frames.shift(); if (!frame || !predicate(frame)) throw new Error("Missing fixture frame"); return frame; },
    async notify(frame) { notified.push(frame); },
    async consumeInitializationNotifications(predicate) { while (frames.length && predicate(frames[0]!)) frames.shift(); }
  };
  const codec = hermesAcpCodec({ cwd: process.cwd(), model: "fixture", mcpRows: [], allowNativeTools: options.allowNativeTools ?? false, requireHistory: options.requireHistory });
  return { codec, connection, sent, notified, frames };
}

describe("Hermes is a peer adapter using the common registry and native ACP contract", () => {
  it("bounds native initialization even when a live ACP process never responds", async () => {
    vi.useFakeTimers();
    try {
      const f = fixture();
      f.connection.next = async () => new Promise(() => {});
      const result = expect(f.codec.initialize(f.connection, session)).rejects.toThrow(/initialization timed out/);
      await vi.advanceTimersByTimeAsync(60_000);
      await result;
      expect(vi.getTimerCount()).toBe(0);
    } finally { vi.useRealTimers(); }
  });
  it("registers without changing the default Harness or closed workflow enums", () => {
    const registry = new HarnessRegistry(undefined, [new HermesAdapter()]);
    expect(registry.defaultHarnessId()).toBe("codex");
    expect(registry.adapter("hermes", "workflow").resident?.protocol).toBe("hermes-acp-json-rpc");
    expect(registry.adapterIds("probe")).toContain("hermes");
    expect(registry.descriptor("hermes").nativeProtocol).toBe("chat-completions");
  });
  it("uses exact per-server native MCP transport and headers", () => {
    expect(hermesMcpServers([{ name: "one", namespace: "one", transport: "stdio", command: "node", args: ["x"], env: { TEST: "value" } },
      { name: "two", namespace: "two", transport: "streamable-http", url: "http://localhost/mcp", headers: { Authorization: "Bearer fixture" } }]))
      .toEqual([{ name: "one", command: "node", args: ["x"], env: [{ name: "TEST", value: "value" }] },
        { type: "http", name: "two", url: "http://localhost/mcp", headers: [{ name: "Authorization", value: "Bearer fixture" }] }]);
  });
  it("allocates a real session, correlates prompt completion and retains the final handoff", async () => {
    const f = fixture(); const native = await f.codec.initialize(f.connection, session);
    expect(native).toEqual({ ...session, nativeId: "native-session" });
    expect(await f.codec.submit(f.connection, native, { prompt: "task" } as ResidentTurn)).toEqual({ handoff: "Done", threadId: "native-session" });
    expect(f.codec.completionTail.isComplete()).toBe(true);
    expect(f.sent.find(frame => frame.method === "initialize")?.params).toMatchObject({ clientCapabilities: { terminal: false, fs: { writeTextFile: false } } });
  });
  it("loads history without re-emitting old tool calls or usage", async () => {
    const f = fixture({ replay: [text("Old reply"), started(), ended()], requireHistory: true });
    await f.codec.initialize(f.connection, { ...session, nativeId: "native-session", resumedAt: "now" });
    expect(f.notified).toEqual([]);
    expect(f.sent.some(frame => frame.method === "session/resume")).toBe(false);
  });
  it.each([null, "invalid"])("rejects missing native load %j, never creates a replacement silently", async loadResult => {
    const f = fixture({ loadResult });
    await expect(f.codec.initialize(f.connection, { ...session, nativeId: "native-session", resumedAt: "now" })).rejects.toMatchObject({ code: "SESSION_RESUME_FAILED" });
    expect(f.sent.some(frame => frame.method === "session/new")).toBe(false);
  });
  it("rejects lost history from a supposedly successful native load", async () => {
    const f = fixture({ requireHistory: true });
    await expect(f.codec.initialize(f.connection, { ...session, nativeId: "native-session", resumedAt: "now" })).rejects.toMatchObject({ code: "SESSION_RESUME_FAILED" });
  });
  it.each(["cancelled", "refusal", "max_tokens"])("does not mark %s as a successful task", async stopReason => {
    const f = fixture({ stopReason }); const native = await f.codec.initialize(f.connection, session);
    await expect(f.codec.submit(f.connection, native, { prompt: "task" } as ResidentTurn)).rejects.toThrow(/did not complete/);
  });
  it("rejects another session's events", async () => {
    const f = fixture({ events: [update({ sessionUpdate: "agent_message_chunk" }, "foreign")] });
    const native = await f.codec.initialize(f.connection, session);
    await expect(f.codec.submit(f.connection, native, { prompt: "task" } as ResidentTurn)).rejects.toThrow(/foreign/);
  });
  it.each([false, true])("permission requests respect allowNativeTools=%s", async allowNativeTools => {
    const f = fixture({ allowNativeTools, events: [{ id: "approval", method: "session/request_permission", params: { sessionId: "native-session", options: [
      { kind: "allow_once", optionId: "yes" }, { kind: "reject_once", optionId: "no" }] } }, text("Done")] });
    const native = await f.codec.initialize(f.connection, session);
    await f.codec.submit(f.connection, native, { prompt: "task" } as ResidentTurn);
    expect(f.sent.find(frame => frame.id === "approval")).toMatchObject({ result: { outcome: { outcome: "selected", optionId: allowNativeTools ? "yes" : "no" } } });
  });
  it("metadata cannot keep a hung model alive, but reasoning and tools can", () => {
    const f = fixture();
    expect(f.codec.observe(update({ sessionUpdate: "usage_update", used: 42, size: 256000 }))).toBeUndefined();
    expect(f.codec.observe(update({ sessionUpdate: "agent_thought_chunk", content: { type: "text", text: "thinking" } })))
      .toEqual({ activities: [{ kind: "model", phase: "delta" }] });
    expect(f.codec.observe(started())).toMatchObject({ activities: [{ kind: "tool", phase: "started", callId: "call1" }] });
    expect(f.codec.observe(ended())).toMatchObject({ activities: [{ kind: "tool", phase: "completed", callId: "call1" }] });
  });
});

describe("Hermes official event mapping (not simulated success from assistant text)", () => {
  it("passes the same canonical ingress validator as every other adapter", async () => {
    const received: unknown[] = [];
    const bridge = new OfficialEventBridge({ descriptor: new HermesAdapter().descriptor, invocationId: "fixture",
      mapEvent: hermesOfficialEventMapper(), onEvent: event => { received.push(event); } });
    for (const frame of [started(), ended(), text("Done"), { result: { stopReason: "end_turn", usage: { inputTokens: 3, outputTokens: 2 } } }]) await bridge.accept(frame);
    await bridge.finish();
    expect(received).toHaveLength(5);
  });
  it("pairs concurrent same-name tools by native call ID", () => {
    const map = hermesOfficialEventMapper();
    map(started("first")); map(started("second"));
    expect(map(ended("second"))[0]?.tool).toMatchObject({ callId: "second", name: "mcp__workspace__read", outputPreview: "sentinel", truncated: false });
    expect(map(ended("first"))[0]?.tool?.callId).toBe("first");
  });
  it("does not misrepresent Hermes display content as unabridged raw output", () => {
    const map = hermesOfficialEventMapper(); map(started());
    expect(map(update({ sessionUpdate: "tool_call_update", toolCallId: "call1", status: "completed",
      content: [{ type: "content", content: { type: "text", text: "display" } }] }))[0]?.tool)
      .toMatchObject({ outputPreview: "display", truncated: true });
  });
  it.each([false, 0, ""])("retains falsy raw result %j", rawOutput => {
    const map = hermesOfficialEventMapper(); map(started());
    expect(map(update({ sessionUpdate: "tool_call_update", toolCallId: "call1", status: "completed", rawOutput }))[0]?.tool?.truncated).toBe(false);
  });
  it("rejects orphan, duplicate terminal and unfinished tool results", () => {
    const map = hermesOfficialEventMapper(); expect(() => map(ended())).toThrow(/unpaired/);
    map(started()); expect(() => map({ result: { stopReason: "end_turn" } })).toThrow(/unfinished/);
    map(ended()); expect(() => map(ended())).toThrow(/after terminal/);
  });
  it("separates final replies from reasoning, and maps token usage only from prompt receipt", () => {
    const map = hermesOfficialEventMapper();
    map(text("First", "1")); map(text("Final ", "2")); map(text("answer", "2"));
    expect(map(update({ sessionUpdate: "usage_update", size: 256000, used: 420 }))).toEqual([]);
    const final = map({ result: { stopReason: "end_turn", usage: { inputTokens: 10, outputTokens: 4, totalTokens: 14, cachedReadTokens: 3 } } });
    expect(final.filter(e => e.kind === "assistant.message").map(e => e.message)).toEqual(["First", "Final answer"]);
    expect(final.at(-1)?.usage).toMatchObject({ inputTokens: 10, outputTokens: 4, totalTokens: 14, cachedInputTokens: 3 });
  });
});
