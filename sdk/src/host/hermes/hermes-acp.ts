import type { SessionRef, ResidentProtocolObservation } from "../../core/harness-runtime/contracts.js";
import type { ResidentProtocolCodec, ResidentProtocolConnection } from "../../core/harness-runtime/resident-native-driver.js";
import { HarnessRuntimeError, SessionResumeError } from "../../core/harness-runtime/errors.js";
import { boundedPreview, type OfficialEventMapper, type HarnessEventDraft } from "../../core/harness-runtime/official-event-bridge.js";
import type { AdapterMcpRow } from "../../core/harness-runtime/adapters/adapter-utils.js";

type Frame = Readonly<Record<string, unknown>>;
const metadataUpdates = new Set(["available_commands_update", "usage_update", "session_info_update", "current_mode_update", "config_option_update"]);
export const hermesRecord = (v: unknown): Record<string, unknown> | undefined =>
  v !== null && typeof v === "object" && !Array.isArray(v) ? v as Record<string, unknown> : undefined;
const str = (v: unknown): string | undefined => typeof v === "string" && v.length > 0 ? v : undefined;
function failure(message: string): HarnessRuntimeError {
  return new HarnessRuntimeError("HARNESS_CONTRACT_VIOLATION", `Hermes ACP: ${message}`, { harnessId: "hermes" }, { source: "adapter" });
}
async function initializationDeadline<T>(start: () => Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([start(), new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => reject(failure("initialization timed out (60000ms)")), 60_000);
    })]);
  } finally { clearTimeout(timer); }
}
export function validHermesSessionId(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{0,511}$/.test(value) && !value.startsWith("pending:");
}
export function hermesMcpServers(rows: readonly AdapterMcpRow[]): Record<string, unknown>[] {
  return rows.map(row => row.transport === "stdio"
    ? { name: row.namespace, command: row.command, args: row.args,
        env: Object.entries(row.env ?? {}).map(([name, value]) => ({ name, value })) }
    : { type: "http", name: row.namespace, url: row.url,
        headers: Object.entries(row.headers ?? {}).map(([name, value]) => ({ name, value })) });
}
function updateFor(frame: Frame, sessionId?: string): Record<string, unknown> | undefined {
  if (frame.method !== "session/update") return undefined;
  const params = hermesRecord(frame.params);
  if (!str(params?.sessionId) || (sessionId && params!.sessionId !== sessionId)) throw failure("foreign or missing session identity");
  const update = hermesRecord(params!.update);
  if (!str(update?.sessionUpdate)) throw failure("missing session update discriminator");
  return update;
}
function contentText(content: unknown): string {
  const value = hermesRecord(content);
  return value?.type === "text" && typeof value.text === "string" ? value.text : "";
}
function toolText(content: unknown): string {
  return Array.isArray(content) ? content.map(item => {
    const block = hermesRecord(item);
    return block?.type === "content" ? contentText(block.content) : "";
  }).filter(Boolean).join("\n") : "";
}
function usageOf(value: unknown) {
  const u = hermesRecord(value);
  if (!u) return undefined;
  const fields = { inputTokens: u.inputTokens, outputTokens: u.outputTokens,
    totalTokens: u.totalTokens, cachedInputTokens: u.cachedReadTokens };
  const numeric: Record<string, number> = {};
  for (const [key, n] of Object.entries(fields)) {
    if (n === undefined || n === null) continue;
    if (typeof n !== "number" || !Number.isSafeInteger(n) || n < 0) throw failure("invalid token usage");
    numeric[key] = n;
  }
  return Object.values(numeric).some(n => n > 0) ? { protocol: "chat-completions" as const, model: "unknown",
    inputTokens: numeric.inputTokens ?? 0, outputTokens: numeric.outputTokens ?? 0,
    totalTokens: numeric.totalTokens ?? ((numeric.inputTokens ?? 0) + (numeric.outputTokens ?? 0)),
    cachedInputTokens: numeric.cachedInputTokens ?? 0 } : undefined;
}

/** ACP uses stable toolCallId, not a tool-name FIFO in the SDK. */
export function hermesOfficialEventMapper(): OfficialEventMapper {
  const tools = new Map<string, { name: string; input?: unknown }>();
  const terminal = new Set<string>();
  const messages = new Map<string, string>();
  let sessionId: string | undefined;
  return frame => {
    const params = hermesRecord(frame.params);
    if (frame.method === "session/update") {
      sessionId ??= str(params?.sessionId);
      const u = updateFor(frame, sessionId)!;
      const type = String(u.sessionUpdate);
      if (type === "agent_message_chunk") {
        const text = contentText(u.content);
        if (!text) return [];
        const id = str(u.messageId) ?? "reply";
        messages.set(id, (messages.get(id) ?? "") + text);
        return [{ kind: "assistant.delta", sourceType: type, itemId: id, message: text }];
      }
      if (type === "agent_thought_chunk") return [{ kind: "activity", sourceType: type }];
      if (type === "tool_call" || type === "tool_call_update") {
        const callId = str(u.toolCallId);
        if (!callId) throw failure("tool event missing toolCallId");
        if (terminal.has(callId)) throw failure("tool event after terminal result");
        if (type === "tool_call") {
          if (tools.has(callId)) throw failure("duplicate tool start");
          const title = str(u.title);
          if (!title) throw failure("tool start missing title");
          tools.set(callId, { name: title.split(": ")[0]!, ...(u.rawInput !== undefined ? { input: u.rawInput } : {}) });
        }
        const tool = tools.get(callId);
        if (!tool) throw failure("unpaired tool result");
        const status = u.status === "failed" ? "failed" : u.status === "completed" ? "completed"
          : type === "tool_call" ? "started" : "updated";
        const raw = u.rawOutput;
        const display = toolText(u.content);
        const preview = raw !== undefined && raw !== null ? boundedPreview(raw) : display ? boundedPreview(display) : undefined;
        if (status === "completed" || status === "failed") { tools.delete(callId); terminal.add(callId); }
        return [{ kind: `tool.${status}`, sourceType: type, tool: {
          callId, name: tool.name, status, toolType: tool.name.startsWith("mcp_") ? "mcp" : "other",
          ...(tool.input !== undefined ? { input: tool.input } : {}),
          ...(preview ? { outputPreview: preview.text, truncated: preview.truncated || raw === undefined || raw === null } : {}),
          ...(status === "failed" ? { isError: true } : {})
        } }];
      }
      return [];
    }
    // This is the actual correlated prompt response, forwarded by the codec only.
    const result = hermesRecord(frame.result);
    if (result?.stopReason !== undefined) {
      if (tools.size) throw failure("prompt ended with unfinished tool calls");
      const events: HarnessEventDraft[] = [];
      for (const [itemId, message] of messages) events.push({ kind: "assistant.message", sourceType: "session/prompt", itemId, message });
      messages.clear(); terminal.clear();
      const usage = usageOf(result.usage);
      if (usage) events.push({ kind: "usage", sourceType: "session/prompt", usage });
      return events;
    }
    return [];
  };
}

export interface HermesAcpOptions {
  cwd: string;
  model: string;
  mcpRows: readonly AdapterMcpRow[];
  allowNativeTools: boolean;
  /** A persisted nonempty session must replay history; never silently replace memory. */
  requireHistory?: boolean;
  promptPreamble?: string;
}

/** Native ACP codec shared by ordinary and resident invocations. No workflow decisions. */
export function hermesAcpCodec(options: HermesAcpOptions): ResidentProtocolCodec {
  let activeSession: string | undefined;
  let completed = false;
  async function rpc(connection: ResidentProtocolConnection, method: string, params: Record<string, unknown>, replay = false) {
    const id = connection.requestId();
    await connection.send({ jsonrpc: "2.0", id, method, params });
    let history = 0;
    for (;;) {
      const frame = await connection.next(() => true, `Hermes ${method}`);
      if (frame.id === id && frame.method === undefined) {
        const result = hermesRecord(frame.result);
        if (frame.error != null || !result) throw failure(`${method} failed`);
        if (replay && options.requireHistory && history === 0) throw failure("native load returned no persisted history");
        return result;
      }
      const u = updateFor(frame, activeSession);
      if (!u || frame.id !== undefined) throw failure(`unexpected frame during ${method}`);
      if (replay) { if (u.sessionUpdate === "user_message_chunk" || u.sessionUpdate === "agent_message_chunk") history++; }
      else if (!metadataUpdates.has(String(u.sessionUpdate))) throw failure(`business event during ${method}`);
      // History is deliberately not emitted as new tools, text, usage or activity.
    }
  }
  return {
    protocol: "hermes-acp-json-rpc",
    allocatesNativeSessionId: true,
    recoveryStrategy: "native-session-resume",
    observe(frame): ResidentProtocolObservation | undefined {
      const u = updateFor(frame, activeSession);
      if (!u) return undefined;
      const type = u.sessionUpdate;
      if (type === "agent_message_chunk" || type === "agent_thought_chunk") return { activities: [{ kind: "model", phase: "delta" }] };
      if (type === "tool_call" || type === "tool_call_update") {
        const callId = str(u.toolCallId);
        if (!callId) return undefined;
        return { activities: [{ kind: "tool", phase: u.status === "completed" || u.status === "failed" ? u.status
          : type === "tool_call" ? "started" : "updated", callId, ...(str(u.title) ? { name: String(u.title) } : {}) }] };
      }
      return undefined;
    },
    completionTail: {
      isComplete: () => completed,
      accept: (frame, session) => {
        const u = updateFor(frame, session.nativeId);
        return frame.id === undefined && !!u && metadataUpdates.has(String(u.sessionUpdate));
      }
    },
    initialize: (connection, session) => initializationDeadline(async () => {
      const info = await rpc(connection, "initialize", { protocolVersion: 1,
        clientInfo: { name: "scienceevolve-sdk", version: "0.1.1" },
        clientCapabilities: { fs: { readTextFile: false, writeTextFile: false }, terminal: false } });
      if (info.protocolVersion !== 1 || hermesRecord(info.agentInfo)?.name !== "hermes-agent") throw failure("unsupported agent/protocol identity");
      const params = { cwd: options.cwd, mcpServers: hermesMcpServers(options.mcpRows) };
      let initialized = session;
      if (session.resumedAt) {
        if (hermesRecord(info.agentCapabilities)?.loadSession !== true) throw new SessionResumeError("hermes", session.nativeId);
        activeSession = session.nativeId;
        try { await rpc(connection, "session/load", { ...params, sessionId: activeSession }, true); }
        catch (cause) { throw new SessionResumeError("hermes", session.nativeId, { cause: cause instanceof Error ? cause : undefined }); }
      } else {
        const created = await rpc(connection, "session/new", params);
        const nativeId = str(created.sessionId);
        if (!nativeId || !validHermesSessionId(nativeId)) throw failure("invalid newly allocated session");
        initialized = { ...session, nativeId }; activeSession = nativeId;
      }
      await rpc(connection, "session/set_mode", { sessionId: activeSession, modeId: options.allowNativeTools ? "dont_ask" : "default" });
      return initialized;
    }),
    async settleIdle(connection, session) {
      await connection.consumeInitializationNotifications(frame => {
        const u = updateFor(frame, session.nativeId);
        return frame.id === undefined && !!u && metadataUpdates.has(String(u.sessionUpdate));
      }, "Hermes metadata");
    },
    async submit(connection, session, turn) {
      completed = false;
      if (session.nativeId !== activeSession) throw failure("session changed before prompt");
      const id = connection.requestId();
      // Leading slash commands are native UI controls, not SDK workflow prompts.
      await connection.send({ jsonrpc: "2.0", id, method: "session/prompt", params: {
        sessionId: session.nativeId, prompt: [{ type: "text", text: [options.promptPreamble,
          turn.prompt.startsWith("/") ? `Research task:\n${turn.prompt}` : turn.prompt].filter(Boolean).join("\n\n") }]
      } });
      const messages = new Map<string, string>();
      for (;;) {
        const frame = await connection.next(() => true, "Hermes prompt");
        if (frame.id === id && frame.method === undefined) {
          const result = hermesRecord(frame.result);
          if (frame.error != null || result?.stopReason !== "end_turn") throw failure("prompt did not complete successfully");
          await connection.notify(frame, turn);
          const handoff = [...messages.values()].at(-1)?.trim();
          if (!handoff) throw failure("missing assistant handoff");
          completed = true;
          return { handoff, threadId: session.nativeId };
        }
        if (frame.method === "session/request_permission" && frame.id !== undefined) {
          const p = hermesRecord(frame.params);
          if (p?.sessionId !== session.nativeId) throw failure("foreign permission request");
          const choices = Array.isArray(p.options) ? p.options.map(hermesRecord) : [];
          const choice = choices.find(o => o?.kind === (options.allowNativeTools ? "allow_once" : "reject_once"));
          await connection.send({ jsonrpc: "2.0", id: frame.id, result: { outcome: choice?.optionId
            ? { outcome: "selected", optionId: choice.optionId } : { outcome: "cancelled" } } });
          continue;
        }
        if (frame.id !== undefined) {
          // Do not implement a second filesystem/terminal authority in the ACP client.
          if (typeof frame.method === "string") {
            await connection.send({ jsonrpc: "2.0", id: frame.id, error: { code: -32601, message: "Client capability not provided" } });
            continue;
          }
          throw failure("uncorrelated response");
        }
        const u = updateFor(frame, session.nativeId);
        if (!u) throw failure("unexpected protocol notification");
        if (u.sessionUpdate === "agent_message_chunk") {
          const key = str(u.messageId) ?? "reply";
          messages.set(key, (messages.get(key) ?? "") + contentText(u.content));
        }
        if (u.sessionUpdate === "user_message_chunk") throw failure("unsolicited user turn");
        await connection.notify(frame, turn);
      }
    },
    async close() { /* ACP lifetime is stdio EOF; ProcessHost owns process-tree cleanup. */ }
  };
}
