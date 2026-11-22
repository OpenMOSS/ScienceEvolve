import {
  boundedPreview,
  nativeUserNoticeFromResult,
  contentText,
  diagnosticEvent,
  eventArray,
  eventRecord,
  eventString,
  normalizedUsage,
  safeEventText,
  type OfficialEventMapper
} from "../official-event-bridge.js";

/** Build a shallow mapper for the selected DSH SDK session. */
export function dshOfficialEventMapper(expectedSessionId: string): OfficialEventMapper {
  const toolNames = new Map<string, string>();
  return (frame) => {
    if (frame.method === "session.status") {
      const params = eventRecord(frame.params);
      if (params?.sessionId !== expectedSessionId) return [];
      return [{
        kind: "lifecycle",
        sourceType: "session.status",
        message: eventString(params.status) ?? "status"
      }];
    }
    if (frame.method !== "session.event") return [];
    const params = eventRecord(frame.params);
    if (params?.sessionId !== expectedSessionId) return [];
    const event = eventRecord(params.event);
    if (!event) throw new Error("DSH official session event is missing its event envelope");
    const nativeSeq = requiredNativeSeq(event.seq);
    const itemId = `dsh:${expectedSessionId}:${nativeSeq}`;
    const data = eventRecord(event?.data);
    const type = eventString(event?.type) ?? "session.event";
    if (!data) throw new Error("DSH official session event is missing its data envelope");
    // Native compaction edits the retained Session surface. Never map its
    // replacement messages to another live tool/result, usage or user input.
    if (eventRecord(event.surfaceOp)?.op === "replace") return [];

    if (type === "user/message") {
      // A prompt RPC response only queues input. This is the normal Session
      // surface event after native consumption, excluding replacement summaries.
      if (event.surfaceOp !== "append" || eventRecord(data.source)?.kind !== "user") return [];
      const message = contentText(data.content);
      return message ? [{ kind: "user.message", sourceType: type, itemId, message }] : [];
    }
    if (type === "turn/start" || type === "turn/end" ||
      type === "step/start" || type === "step/end") {
      return [{ kind: "lifecycle", sourceType: type, itemId, message: type }];
    }
    if (type === "assistant/chunk") {
      const chunk = eventRecord(data.chunk);
      if (chunk?.type === "text-delta" || chunk?.type === "text_delta") {
        const message = safeEventText(chunk.delta ?? chunk.text);
        return message ? [{ kind: "assistant.delta", sourceType: type, itemId, message }] : [];
      }
      return [{ kind: "activity", sourceType: type, itemId }];
    }
    if (type === "tool/call") {
      const name = eventString(data.name) ?? "tool";
      const callId = requiredCallId(data.callId, "tool/call.data.callId");
      toolNames.set(callId, name);
      return [{
        kind: "tool.started",
        sourceType: type,
        itemId,
        message: name,
        tool: {
          callId,
          name,
          toolType: "other",
          status: "started",
          ...(data.arguments !== undefined ? { input: data.arguments } : {})
        }
      }];
    }
    if (type === "tool/result") {
      const message = eventRecord(data.message);
      const source = eventRecord(message?.source);
      const resultBlock = eventArray(message?.content)
        .map((value) => eventRecord(value))
        .find((value) => value?.type === "tool-result");
      const failed = Boolean(data.error) || resultBlock?.isError === true || message?.isError === true;
      const output = resultBlock?.content ?? message?.content ?? data.error ?? "";
      const bounded = boundedPreview(contentText(output) || output);
      const candidates = toolResultCallIdCandidates(source, resultBlock, message, data);
      const fallbackCallId = requiredCallId(
        candidates[0]?.callId,
        "tool/result.data.message.source.callId"
      );
      // DSH has used more than one call-ID field across SDK revisions. Prefer
      // the candidate that matches a currently active call instead of blindly
      // trusting field order; this keeps a conflicting fallback field from
      // manufacturing an orphan completion.
      const activeCandidates = candidates.filter(({ callId }) => toolNames.has(callId));
      const selected = activeCandidates[0] ?? candidates[0];
      const callId = selected?.callId ?? fallbackCallId;
      const name = toolNames.get(callId) ?? eventString(message?.toolName) ?? "tool";
      toolNames.delete(callId);
      const conflictingIds = new Set(candidates.map((candidate) => candidate.callId)).size > 1;
      const candidateFields = candidates.map((candidate) => candidate.field).join(", ");
      const conflictDiagnostic = conflictingIds
        ? [{
            ...diagnosticEvent(
              "tool/result.call_id_conflict",
              activeCandidates.length > 0
                ? `DSH tool result call ID fields disagreed at native sequence ${nativeSeq} (${candidateFields}); matched an active tool call`
                : `DSH tool result call ID fields disagreed at native sequence ${nativeSeq} (${candidateFields}); no active tool call matched`,
              "warning"
            ),
            itemId
          }]
        : [];
      return [...conflictDiagnostic, {
        ...(!failed && bounded.truncated && !conflictingIds ? nativeUserNoticeFromResult(output) : {}),
        kind: failed ? "tool.failed" : "tool.completed",
        sourceType: type,
        itemId,
        message: name,
        tool: {
          callId,
          name,
          toolType: "other",
          status: failed ? "failed" : "completed",
          outputPreview: bounded.text,
          truncated: bounded.truncated,
          ...(failed ? { isError: true } : {})
        }
      }];
    }
    if (type === "assistant/message") {
      const message = eventRecord(data.message);
      const text = contentText(message?.content);
      const usage = normalizedUsage(data.usage, "chat-completions");
      return [
        ...(text ? [{ kind: "assistant.message" as const, sourceType: type, itemId, message: text }] : []),
        ...(usage ? [{ kind: "usage" as const, sourceType: type, itemId, usage }] : [])
      ];
    }
    return [];
  };
}

function toolResultCallIdCandidates(
  source: Record<string, unknown> | undefined,
  resultBlock: Record<string, unknown> | undefined,
  message: Record<string, unknown> | undefined,
  data: Record<string, unknown>
): Array<{ field: string; callId: string }> {
  const values: Array<[string, unknown]> = [
    ["message.source.callId", source?.callId],
    ["message.content.toolCallId", resultBlock?.toolCallId],
    ["message.toolCallId", message?.toolCallId],
    ["data.callId", data.callId]
  ];
  const seen = new Set<string>();
  const candidates: Array<{ field: string; callId: string }> = [];
  for (const [field, value] of values) {
    const callId = eventString(value)?.trim();
    if (!callId || seen.has(callId)) continue;
    seen.add(callId);
    candidates.push({ field, callId });
  }
  return candidates;
}

function requiredNativeSeq(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new Error("DSH official session event is missing its native sequence");
  }
  return value as number;
}

function requiredCallId(value: unknown, field: string): string {
  const callId = eventString(value)?.trim();
  if (!callId) throw new Error(`DSH official tool event is missing ${field}`);
  return callId;
}
