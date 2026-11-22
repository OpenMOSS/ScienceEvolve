import type { HarnessEventKind } from "../contracts.js";
import {
  boundedPreview,
  nativeUserNoticeFromResult,
  contentText,
  diagnosticEvent,
  eventRecord,
  eventString,
  normalizedUsage,
  safeEventText,
  type OfficialEventMapper
} from "../official-event-bridge.js";

/** Shallow mapping of official exec JSON and resident app-server items. */
export const mapCodexOfficialEvent: OfficialEventMapper = (event) => {
  const type = eventString(event.type) ?? "unknown";
  const item = eventRecord(event.item);
  if (type === "thread.started" || type === "turn.started" || type === "turn.completed") {
    const usage = type === "turn.completed"
      ? normalizedUsage(event.usage, "responses")
      : undefined;
    return [{
      kind: usage ? "usage" : "lifecycle",
      sourceType: type,
      message: type,
      ...(usage ? { usage } : {})
    }];
  }
  if (type === "item.started" || type === "item.updated" || type === "item.completed") {
    if (item?.type === "reasoning") {
      // Only an explicit public summary is displayable. Native `text`,
      // content and encrypted reasoning remain private activity signals.
      const summary = typeof item.summary === "string" ? item.summary : Array.isArray(item.summary)
        ? item.summary.flatMap(part => {
          const record = eventRecord(part);
          return record?.type === "summary_text" && typeof record.text === "string" ? [record.text] : [];
        }).join("\n\n") : "";
      return summary ? [{ kind: "reasoning.summary", sourceType: "codex.reasoning.summary",
        itemId: requiredCallId(item.id), message: safeEventText(summary) }] : [{ kind: "activity", sourceType: type }];
    }
    if (item?.type === "error") {
      return [diagnosticEvent(
        type,
        safeEventText(item.message) || "Codex reported an item diagnostic",
        item.status === "failed" || item.is_error === true ? "error" : "warning"
      )];
    }
    if (item?.type === "agent_message" || item?.type === "agentMessage") {
      // app-server emits the same message item before its final text exists.
      // Only its completed body is a handoff; a started partial must not
      // suppress the final message through terminal event deduplication.
      if (type !== "item.completed") return [];
      const message = safeEventText(item.text);
      const itemId = eventString(item.id);
      return message ? [{
        kind: "assistant.message",
        sourceType: type,
        ...(itemId ? { itemId } : {}),
        message
      }] : [];
    }
    if (item?.type === "userMessage" || item?.type === "user_message") {
      if (type !== "item.completed") return [];
      const message = contentText(item.content);
      return message ? [{ kind: "user.message", sourceType: type, itemId: requiredCallId(item.id), message }] : [];
    }
    if (!item) return [];
    const callId = requiredCallId(item.id);
    const name = eventString(item.name) ?? eventString(item.tool_name) ?? eventString(item.tool) ??
      eventString(item.type) ?? "tool";
    const exitCode = item.exit_code ?? item.exitCode;
    const failed = item.status === "failed" || item.is_error === true || eventRecord(item.result)?.isError === true ||
      (typeof exitCode === "number" && exitCode !== 0);
    const status = type === "item.started"
      ? "started"
      : type === "item.updated"
        ? "updated"
        : failed ? "failed" : "completed";
    const output = item.aggregated_output ?? item.aggregatedOutput ?? item.output ?? item.result ?? item.error;
    const input = item.command ?? item.arguments ?? item.input;
    const bounded = output === undefined ? undefined : boundedPreview(output);
    return [{
      ...(status === "completed" && bounded?.truncated && codexToolType(eventString(item.type)) === "mcp" ? nativeUserNoticeFromResult(output) : {}),
      kind: `tool.${status}` as HarnessEventKind,
      sourceType: type,
      message: name,
      tool: {
        callId,
        name,
        toolType: codexToolType(eventString(item.type)),
        ...((item.type === "mcpToolCall" || item.type === "mcp_tool_call") && eventString(item.server)
          ? { server: eventString(item.server)! } : {}),
        status,
        ...(input !== undefined ? { input } : {}),
        ...(bounded ? { outputPreview: bounded.text, truncated: bounded.truncated } : {}),
        ...(status === "failed" ? { isError: true } : {})
      }
    }];
  }
  if (type === "error" || type === "turn.failed") {
    return [diagnosticEvent(
      type,
      safeEventText(event.message) || safeEventText(eventRecord(event.error)?.message) ||
        safeEventText(event.error) || type,
      "error"
    )];
  }
  return [];
};

function requiredCallId(value: unknown): string {
  const callId = eventString(value)?.trim();
  if (!callId) throw new Error("Codex official tool event is missing item.id");
  return callId;
}

function codexToolType(value: string | undefined) {
  if (value === "command_execution" || value === "commandExecution") return "shell" as const;
  if (value === "mcp_tool_call" || value === "mcpToolCall") return "mcp" as const;
  if (value === "file_change" || value === "fileChange") return "file" as const;
  if (value === "web_search" || value === "webSearch") return "web" as const;
  if (value === "collab_tool_call" || value === "collabAgentToolCall") return "collaboration" as const;
  return "other" as const;
}
