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

/** Shallow mapping of Pi's official JSON-mode events. */
export const mapPiOfficialEvent: OfficialEventMapper = (event) => {
  const type = eventString(event.type) ?? "unknown";
  if (type === "session" || type === "agent_start" || type === "agent_end" ||
    type === "turn_start" || type === "turn_end") {
    return [{ kind: "lifecycle", sourceType: type, message: type }];
  }
  if (type === "tool_execution_start" || type === "tool_execution_update" ||
    type === "tool_execution_end") {
    const status = type === "tool_execution_start"
      ? "started"
      : type === "tool_execution_update"
        ? "updated"
        : event.isError === true ? "failed" : "completed";
    const output = event.result ?? event.partialResult;
    const outputContent = eventRecord(output)?.content ?? output;
    const outputText = contentText(outputContent);
    const bounded = output === undefined
      ? undefined
      : boundedPreview(outputText || output);
    const name = eventString(event.toolName) ?? "tool";
    const callId = requiredCallId(event.toolCallId);
    return [{
      ...(status === "completed" && bounded?.truncated ? nativeUserNoticeFromResult(output) : {}),
      kind: `tool.${status}` as HarnessEventKind,
      sourceType: type,
      message: name,
      tool: {
        callId,
        name,
        toolType: "other",
        status,
        ...(event.args !== undefined ? { input: event.args } : {}),
        ...(bounded ? { outputPreview: bounded.text, truncated: bounded.truncated } : {}),
        ...(status === "failed" ? { isError: true } : {})
      }
    }];
  }
  if (type === "message_update") {
    const update = eventRecord(event.assistantMessageEvent);
    if (update?.type !== "text_delta") {
      return update?.type?.toString().includes("thinking")
        ? [{ kind: "activity", sourceType: type }]
        : [];
    }
    const message = safeEventText(update.delta);
    return message ? [{ kind: "assistant.delta", sourceType: type, message }] : [];
  }
  if (type === "message_end") {
    const message = eventRecord(event.message);
    if (message?.role === "user") {
      const text = contentText(message.content);
      return text ? [{ kind: "user.message", sourceType: type, message: text }] : [];
    }
    if (message?.role !== "assistant") return [];
    const text = contentText(message.content);
    const usage = normalizedUsage(message.usage, "chat-completions");
    return [
      ...(text ? [{ kind: "assistant.message" as const, sourceType: type, message: text }] : []),
      ...(usage ? [{ kind: "usage" as const, sourceType: type, usage }] : [])
    ];
  }
  if (type === "auto_retry_start" || type === "compaction_start") {
    return [diagnosticEvent(type, safeEventText(event.errorMessage) || type, "warning")];
  }
  return [];
};

function requiredCallId(value: unknown): string {
  const callId = eventString(value)?.trim();
  if (!callId) throw new Error("Pi official tool event is missing toolCallId");
  return callId;
}
