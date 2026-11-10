import { StringDecoder } from "node:string_decoder";
import { redactTrace } from "../utils.js";
import type { AgentActivitySignal, TraceSink } from "../types.js";
import type {
  HarnessDescriptor,
  HarnessEvent
} from "./contracts.js";
import { HarnessEventStreamError } from "./errors.js";
import {
  ASSISTANT_DISPLAY_CHARACTER_LIMIT,
  truncateUnicodePrefix
} from "../content-limits.js";

export const TOOL_RESULT_PREVIEW_LIMIT = 40_000;
export const ASSISTANT_MESSAGE_LIMIT = ASSISTANT_DISPLAY_CHARACTER_LIMIT;

const CANONICAL_ROOT_FIELDS = new Set([
  "schemaVersion",
  "eventId",
  "seq",
  "timestamp",
  "invocationId",
  "harnessId",
  "kind",
  "phase",
  "attempt",
  "itemId",
  "parentItemId",
  "sourceType",
  "message",
  "messageTruncated",
  "tool",
  "usage",
  "diagnostic"
]);
const CANONICAL_TOOL_FIELDS = new Set([
  "callId",
  "name",
  "server",
  "toolType",
  "status",
  "input",
  "outputPreview",
  "truncated",
  "isError",
  "durationMs"
]);
const CANONICAL_USAGE_FIELDS = new Set([
  "protocol",
  "model",
  "inputTokens",
  "cachedInputTokens",
  "outputTokens",
  "totalTokens"
]);
const CANONICAL_DIAGNOSTIC_FIELDS = new Set(["source", "level", "message"]);
const CANONICAL_KINDS = new Set<HarnessEvent["kind"]>([
  "lifecycle",
  "assistant.delta",
  "assistant.message",
  "reasoning.summary",
  "user.message",
  "tool.started",
  "tool.updated",
  "tool.completed",
  "tool.failed",
  "usage",
  "activity",
  "diagnostic"
]);
const TOOL_TYPES = new Set(["shell", "mcp", "file", "web", "collaboration", "other"]);
const DIAGNOSTIC_SOURCES = new Set(["proxy", "cli", "adapter"]);
const DIAGNOSTIC_LEVELS = new Set(["info", "warning", "error"]);
const IDENTIFIER_LIMIT = 512;
const SOURCE_TYPE_LIMIT = 512;
const TOOL_NAME_LIMIT = 512;

export interface OfficialEventBridgeOptions {
  descriptor: HarnessDescriptor;
  invocationId: string;
  mapEvent: OfficialEventMapper;
  onEvent: (event: HarnessEvent) => Promise<void> | void;
  /** Receives the redacted, unabridged terminal Assistant body for handoff storage. */
  onFullAssistantMessage?: (message: string) => Promise<void> | void;
  /** Receives the same official user event with its complete redacted body.
   * This private transport observation does not enlarge the display event. */
  onNativeUserInput?: (event: HarnessEvent) => Promise<void> | void;
  /** Retained for Adapter API compatibility; unmapped frames are not activity. */
  onActivity?: (activity: AgentActivitySignal) => void;
  /**
   * Synchronous fatal notification for streaming users that own a live
   * native process. The callback must only initiate shutdown; `finish()` (or
   * the rejected direct `accept()`) remains the authoritative error surface.
   */
  onFatal?: (error: HarnessEventStreamError) => Promise<void> | void;
}

export type HarnessEventDraft = Omit<HarnessEvent,
  "schemaVersion" | "eventId" | "seq" | "timestamp" | "invocationId" | "harnessId" | "phase">;

/** Adapter-owned shallow mapping from one official native event envelope. */
export type OfficialEventMapper = (
  event: Record<string, unknown>
) => HarnessEventDraft[];

/** Harness-neutral strict NDJSON framing and canonical envelope sequencing. */
export class OfficialEventBridge {
  private decoder = new StringDecoder("utf8");
  private pending = "";
  private seq = 0;
  private tail: Promise<void> = Promise.resolve();
  private fatalError: HarnessEventStreamError | undefined;
  private readonly seenTerminalEvents = new Set<string>();
  private readonly openToolStarts = new Map<string, NonNullable<HarnessEventDraft["tool"]>>();

  constructor(private readonly options: OfficialEventBridgeOptions) {}

  feed(chunk: Buffer | string): void {
    if (this.fatalError) return;
    this.pending += typeof chunk === "string" ? chunk : this.decoder.write(chunk);
    this.flushLines(false);
  }

  async finish(): Promise<void> {
    await this.finishSegment();
  }

  /** Close one native process stream while preserving canonical sequencing. */
  async finishSegment(): Promise<void> {
    if (this.fatalError) throw this.fatalError;
    this.pending += this.decoder.end();
    this.decoder = new StringDecoder("utf8");
    this.flushLines(true);
    await this.tail;
    if (this.fatalError) throw this.fatalError;
  }

  /** Surface a failure already observed by streaming `feed()` without ending the decoder. */
  assertHealthy(): void {
    if (this.fatalError) throw this.fatalError;
  }

  /** Wait for all complete frames received so far without closing the stream. */
  async drain(): Promise<void> {
    await this.tail;
    this.assertHealthy();
  }

  async accept(value: unknown): Promise<void> {
    try {
      if (this.fatalError) throw this.fatalError;
      if (!isEventRecord(value)) {
        throw new HarnessEventStreamError(
          this.options.descriptor.id,
          "Official event frame must be a JSON object"
        );
      }
      let mapped: HarnessEventDraft[];
      try {
        mapped = this.options.mapEvent(value);
      } catch (error) {
        throw new HarnessEventStreamError(
          this.options.descriptor.id,
          "Unable to map an official event frame",
          { cause: error }
        );
      }
      // Unmapped frames remain available to native diagnostics, but do not
      // prove model or tool progress and therefore never refresh watchdogs.
      for (const rawDraft of mapped) {
        if (rawDraft.kind === "assistant.message" && typeof rawDraft.message === "string") {
          await this.options.onFullAssistantMessage?.(safeEventText(rawDraft.message));
        }
        let draft = sanitizeDraft(rawDraft);
        const semanticKey = terminalSemanticKey(draft);
        if (semanticKey && this.seenTerminalEvents.has(semanticKey)) {
          const tool = draft.tool;
          const started = tool && this.openToolStarts.get(tool.callId);
          // Retain the first complete input when an open tool call publishes
          // its arguments after its start so result receipts can bind it.
          if (draft.kind !== "tool.started" || !tool || !started ||
            started.input !== undefined || tool.input === undefined ||
            started.name !== tool.name || started.server !== tool.server || started.toolType !== tool.toolType) continue;
          draft = { ...draft, kind: "tool.updated", tool: { ...tool, status: "updated" } };
          this.openToolStarts.set(tool.callId, draft.tool!);
        }
        if (semanticKey) this.seenTerminalEvents.add(semanticKey);
        if (draft.kind === "tool.started" && draft.tool) this.openToolStarts.set(draft.tool.callId, draft.tool);
        if ((draft.kind === "tool.completed" || draft.kind === "tool.failed") && draft.tool)
          this.openToolStarts.delete(draft.tool.callId);
        const event = validateCanonicalHarnessEvent({
          ...draft,
          schemaVersion: 1,
          eventId: `${this.options.invocationId}:${this.options.descriptor.id}:${this.seq}`,
          seq: this.seq++,
          timestamp: eventTimestamp(value),
          invocationId: this.options.invocationId,
          harnessId: this.options.descriptor.id,
          phase: phaseForKind(draft.kind)
        }, this.options.descriptor);
        try {
          if (event.kind === "user.message" && typeof rawDraft.message === "string") {
            await this.options.onNativeUserInput?.({ ...event, message: safeEventText(rawDraft.message) });
          }
          await this.options.onEvent(event);
        } catch (error) {
          throw new HarnessEventStreamError(
            this.options.descriptor.id,
            "Unable to publish a canonical Harness event",
            { cause: error }
          );
        }
      }
    } catch (error) {
      throw this.recordFatal(streamFailure(
        this.options.descriptor.id,
        error,
        "Unable to consume an official event frame"
      ));
    }
  }

  private flushLines(includeTail: boolean): void {
    const lines = this.pending.split(/\r?\n/);
    const tail = lines.pop() ?? "";
    this.pending = includeTail ? "" : tail;
    for (const line of lines) this.queueLine(line);
    if (includeTail && tail.trim()) this.queueLine(tail);
  }

  private queueLine(line: string): void {
    if (!line.trim()) return;
    this.tail = this.tail.then(async () => {
      if (this.fatalError) throw this.fatalError;
      let value: unknown;
      try {
        value = JSON.parse(line);
      } catch (error) {
        throw new HarnessEventStreamError(
          this.options.descriptor.id,
          "Invalid official JSON event",
          { cause: error }
        );
      }
      await this.accept(value);
    }).catch((error: unknown) => {
      throw this.recordFatal(streamFailure(
        this.options.descriptor.id,
        error,
        "Unable to consume the official event stream"
      ));
    });
    // Streaming callers intentionally do not await `feed()`. Attach a
    // rejection observer immediately so a malformed early frame cannot become
    // an unhandled rejection while the owning Adapter is terminating its CLI.
    void this.tail.catch(() => undefined);
  }

  private recordFatal(error: HarnessEventStreamError): HarnessEventStreamError {
    if (this.fatalError) return this.fatalError;
    this.fatalError = error;
    try {
      const notification = this.options.onFatal?.(error);
      void Promise.resolve(notification).catch(() => undefined);
    } catch {
      // Shutdown callbacks are notifications only. Their failure must not
      // replace the authoritative, sanitized event-stream error.
    }
    return error;
  }
}

function streamFailure(
  harnessId: string,
  error: unknown,
  fallbackMessage: string
): HarnessEventStreamError {
  return error instanceof HarnessEventStreamError
    ? error
    : new HarnessEventStreamError(harnessId, fallbackMessage, {
        cause: error instanceof Error ? error : undefined
      });
}

export async function emitCanonicalTrace(event: HarnessEvent, onTrace: TraceSink): Promise<void> {
  const data = { canonicalEvent: event, schemaVersion: event.schemaVersion, harness: event.harnessId };
  if (event.kind === "diagnostic") {
    await onTrace(event.diagnostic?.level === "error" ? "stderr" : "status", event.diagnostic?.message ?? "Harness diagnostic", {
      ...data,
      diagnostic: true,
      diagnosticSource: event.diagnostic?.source ?? "adapter"
    });
    return;
  }
  if (event.kind.startsWith("tool.")) {
    await onTrace("tool", event.message ?? event.tool?.name ?? "Tool", data);
    return;
  }
  if (event.kind === "assistant.delta" || event.kind === "assistant.message") {
    await onTrace("message", event.message ?? "", data);
    return;
  }
  if (event.kind === "reasoning.summary") {
    if (event.message?.trim() || (event.phase === "delta" && event.message?.length)) await onTrace("message", event.message!, data);
    return;
  }
  if (event.kind === "activity") {
    await onTrace("status", "", data);
    return;
  }
  if (event.kind === "usage") {
    await onTrace("status", "Harness usage event", { ...data, diagnostic: true });
    return;
  }
  if (event.kind === "lifecycle") {
    await onTrace("status", event.message ?? event.sourceType ?? "Harness lifecycle", { ...data, diagnostic: true });
  }
}

export function diagnosticEvent(
  sourceType: string,
  message: string,
  level: "info" | "warning" | "error"
): HarnessEventDraft {
  const safeMessage = safeEventText(message) || sourceType;
  return {
    kind: "diagnostic",
    sourceType,
    message: safeMessage,
    diagnostic: { source: "cli", level, message: safeMessage }
  };
}

export function normalizedUsage(
  value: unknown,
  protocol: "responses" | "chat-completions" | "anthropic-messages"
) {
  const usage = eventRecord(value);
  if (!usage) return undefined;
  const inputTokens = numberValue(usage.input_tokens ?? usage.inputTokens ?? usage.input) ?? 0;
  const cachedInputTokens = numberValue(
    usage.cached_input_tokens ?? usage.cache_read_input_tokens ?? usage.cacheReadTokens ?? usage.cacheRead
  ) ?? 0;
  const outputTokens = numberValue(usage.output_tokens ?? usage.outputTokens ?? usage.output) ?? 0;
  const totalTokens = numberValue(usage.total_tokens ?? usage.totalTokens) ?? inputTokens + outputTokens;
  if (inputTokens === 0 && cachedInputTokens === 0 && outputTokens === 0 && totalTokens === 0) return undefined;
  return { protocol, model: eventString(usage.model) ?? "unknown", inputTokens, cachedInputTokens, outputTokens, totalTokens };
}

export function boundedPreview(value: unknown): { text: string; truncated: boolean } {
  const raw = typeof value === "string" ? value : stableEventValue(value);
  const safe = redactTrace(raw);
  return safe.length > TOOL_RESULT_PREVIEW_LIMIT
    ? { text: safe.slice(0, TOOL_RESULT_PREVIEW_LIMIT), truncated: true }
    : { text: safe, truncated: false };
}

/**
 * Validate the single public ingress shape shared by every Harness Adapter.
 *
 * Adapter-specific native parsing belongs in the Adapter mapper. This guard
 * only accepts a complete canonical envelope, removes body-bearing activity
 * metadata, and returns a fresh JSON-safe object whose display payloads have
 * passed through the common redaction and size limits.
 */
export function validateCanonicalHarnessEvent(
  value: unknown,
  descriptor: HarnessDescriptor
): HarnessEvent {
  try {
    return validateCanonicalHarnessEventUnsafe(value, descriptor);
  } catch (error) {
    if (error instanceof HarnessEventStreamError) throw error;
    throw new HarnessEventStreamError(
      descriptor.id,
      "Invalid canonical Harness event"
    );
  }
}

function validateCanonicalHarnessEventUnsafe(
  value: unknown,
  descriptor: HarnessDescriptor
): HarnessEvent {
  const event = canonicalRecord(value, "event");
  assertAllowedFields(event, CANONICAL_ROOT_FIELDS, "event");
  if (event.schemaVersion !== 1) throw new Error("Invalid event schemaVersion");

  const eventId = canonicalIdentifier(event.eventId, "eventId");
  const invocationId = canonicalIdentifier(event.invocationId, "invocationId");
  const harnessId = canonicalIdentifier(event.harnessId, "harnessId");
  if (harnessId !== descriptor.id) throw new Error("Event Harness identity does not match its descriptor");
  if (!Number.isSafeInteger(event.seq) || (event.seq as number) < 0) {
    throw new Error("Invalid event sequence");
  }
  if (typeof event.timestamp !== "string" || !event.timestamp.trim() || event.timestamp.length > 64) {
    throw new Error("Invalid event timestamp");
  }
  const timestampMs = Date.parse(event.timestamp);
  if (!Number.isFinite(timestampMs)) throw new Error("Invalid event timestamp");
  const canonicalTimestamp = new Date(timestampMs).toISOString();
  if (event.timestamp !== canonicalTimestamp) throw new Error("Invalid event timestamp");

  if (typeof event.kind !== "string" ||
    !CANONICAL_KINDS.has(event.kind as HarnessEvent["kind"])) {
    throw new Error("Invalid event kind");
  }
  const kind = event.kind as HarnessEvent["kind"];
  const expectedPhase = kind === "reasoning.summary" && event.phase === "delta" ? "delta" : phaseForKind(kind);
  if (event.phase !== expectedPhase) throw new Error("Invalid event phase");

  const envelope: HarnessEvent = {
    schemaVersion: 1,
    eventId,
    seq: event.seq as number,
    timestamp: canonicalTimestamp,
    invocationId,
    harnessId,
    kind,
    phase: expectedPhase
  };
  if (event.attempt !== undefined) {
    if (!Number.isSafeInteger(event.attempt) || (event.attempt as number) < 0) {
      throw new Error("Invalid event attempt");
    }
    envelope.attempt = event.attempt as number;
  }

  // Activity is deliberately body-free. Known optional body fields are
  // discarded, while unknown fields have already failed the root allowlist.
  if (kind === "activity") return envelope;

  if (event.itemId !== undefined) {
    envelope.itemId = canonicalIdentifier(event.itemId, "itemId");
  }
  if (event.parentItemId !== undefined) {
    envelope.parentItemId = canonicalIdentifier(event.parentItemId, "parentItemId");
  }
  if (event.sourceType !== undefined) {
    const sourceType = canonicalLabel(event.sourceType, "sourceType", SOURCE_TYPE_LIMIT);
    if (/reasoning|thinking/i.test(sourceType) &&
      !(kind === "reasoning.summary" && /reasoning[._/]summary/i.test(sourceType))) {
      throw new Error("Hidden reasoning cannot use a canonical body channel");
    }
    envelope.sourceType = sourceType;
  }
  if (event.message !== undefined) {
    const boundedMessage = boundedCanonicalText(
      event.message,
      "message",
      kind === "assistant.delta" || kind === "assistant.message"
        ? ASSISTANT_MESSAGE_LIMIT
        : TOOL_RESULT_PREVIEW_LIMIT
    );
    envelope.message = boundedMessage.text;
    if (
      (kind === "assistant.delta" || kind === "assistant.message") &&
      boundedMessage.truncated
    ) {
      envelope.messageTruncated = true;
    }
  }
  if (event.messageTruncated === true) envelope.messageTruncated = true;

  const isToolKind = kind.startsWith("tool.");
  if (isToolKind) {
    if (event.usage !== undefined || event.diagnostic !== undefined) {
      throw new Error("Tool event has an incompatible payload");
    }
    envelope.tool = validateCanonicalTool(event.tool, kind);
    return envelope;
  }
  if (kind === "usage") {
    if (event.tool !== undefined || event.diagnostic !== undefined) {
      throw new Error("Usage event has an incompatible payload");
    }
    envelope.usage = validateCanonicalUsage(event.usage, descriptor);
    return envelope;
  }
  if (kind === "diagnostic") {
    if (event.tool !== undefined || event.usage !== undefined) {
      throw new Error("Diagnostic event has an incompatible payload");
    }
    envelope.diagnostic = validateCanonicalDiagnostic(event.diagnostic);
    return envelope;
  }
  if (event.tool !== undefined || event.usage !== undefined || event.diagnostic !== undefined) {
    throw new Error("Event kind has an incompatible payload");
  }
  if ((kind === "assistant.delta" || kind === "assistant.message" || kind === "reasoning.summary" || kind === "user.message") &&
    envelope.message === undefined) {
    throw new Error(kind === "user.message" ? "User event is missing its message" : "Assistant event is missing its message");
  }
  return envelope;
}

function validateCanonicalTool(
  value: unknown,
  kind: HarnessEvent["kind"]
): NonNullable<HarnessEvent["tool"]> {
  const tool = canonicalRecord(value, "tool");
  assertAllowedFields(tool, CANONICAL_TOOL_FIELDS, "tool");
  const expectedStatus = kind.slice("tool.".length) as NonNullable<HarnessEvent["tool"]>["status"];
  if (tool.status !== expectedStatus) throw new Error("Tool status does not match its event kind");

  const safe: NonNullable<HarnessEvent["tool"]> = {
    callId: canonicalIdentifier(tool.callId, "tool.callId"),
    name: canonicalLabel(tool.name, "tool.name", TOOL_NAME_LIMIT),
    status: expectedStatus
  };
  if (tool.toolType !== undefined) {
    if (typeof tool.toolType !== "string" || !TOOL_TYPES.has(tool.toolType)) {
      throw new Error("Invalid tool type");
    }
    safe.toolType = tool.toolType as NonNullable<HarnessEvent["tool"]>["toolType"];
  }
  if (tool.server !== undefined) {
    if (safe.toolType !== "mcp") throw new Error("Only native MCP events carry a server identity");
    safe.server = canonicalLabel(tool.server, "tool.server", TOOL_NAME_LIMIT);
  }

  let payloadTruncated = false;
  if (tool.input !== undefined) {
    const input = boundedPreview(tool.input);
    safe.input = input.text;
    payloadTruncated ||= input.truncated;
  }
  if (tool.outputPreview !== undefined) {
    if (typeof tool.outputPreview !== "string") throw new Error("Invalid tool output preview");
    const output = boundedPreview(tool.outputPreview);
    safe.outputPreview = output.text;
    payloadTruncated ||= output.truncated;
  }
  if (tool.truncated !== undefined && typeof tool.truncated !== "boolean") {
    throw new Error("Invalid tool truncation flag");
  }
  if (tool.isError !== undefined && typeof tool.isError !== "boolean") {
    throw new Error("Invalid tool error flag");
  }
  if (tool.durationMs !== undefined) {
    if (!Number.isSafeInteger(tool.durationMs) || (tool.durationMs as number) < 0) {
      throw new Error("Invalid tool duration");
    }
    safe.durationMs = tool.durationMs as number;
  }
  if (expectedStatus === "failed" && tool.isError === false) {
    throw new Error("Failed tool event cannot be marked as successful");
  }
  if (expectedStatus !== "failed" && tool.isError === true) {
    throw new Error("Non-failed tool event cannot be marked as an error");
  }
  if (tool.isError !== undefined) safe.isError = tool.isError;
  if (tool.truncated === true || payloadTruncated) safe.truncated = true;
  return safe;
}

function validateCanonicalUsage(
  value: unknown,
  descriptor: HarnessDescriptor
): NonNullable<HarnessEvent["usage"]> {
  const usage = canonicalRecord(value, "usage");
  assertAllowedFields(usage, CANONICAL_USAGE_FIELDS, "usage");
  if (usage.protocol !== descriptor.nativeProtocol) {
    throw new Error("Usage protocol does not match its Harness descriptor");
  }
  return {
    protocol: descriptor.nativeProtocol,
    model: canonicalLabel(usage.model, "usage.model", IDENTIFIER_LIMIT),
    inputTokens: canonicalTokenCount(usage.inputTokens, "inputTokens"),
    cachedInputTokens: canonicalTokenCount(usage.cachedInputTokens, "cachedInputTokens"),
    outputTokens: canonicalTokenCount(usage.outputTokens, "outputTokens"),
    totalTokens: canonicalTokenCount(usage.totalTokens, "totalTokens")
  };
}

function validateCanonicalDiagnostic(
  value: unknown
): NonNullable<HarnessEvent["diagnostic"]> {
  const diagnostic = canonicalRecord(value, "diagnostic");
  assertAllowedFields(diagnostic, CANONICAL_DIAGNOSTIC_FIELDS, "diagnostic");
  if (typeof diagnostic.source !== "string" || !DIAGNOSTIC_SOURCES.has(diagnostic.source)) {
    throw new Error("Invalid diagnostic source");
  }
  if (typeof diagnostic.level !== "string" || !DIAGNOSTIC_LEVELS.has(diagnostic.level)) {
    throw new Error("Invalid diagnostic level");
  }
  return {
    source: diagnostic.source as NonNullable<HarnessEvent["diagnostic"]>["source"],
    level: diagnostic.level as NonNullable<HarnessEvent["diagnostic"]>["level"],
    message: boundedCanonicalText(diagnostic.message, "diagnostic.message").text
  };
}

function canonicalRecord(value: unknown, field: string): Record<string, unknown> {
  if (!isEventRecord(value)) throw new Error(`${field} must be an object`);
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new Error(`${field} must be a plain object`);
  }
  return value;
}

function assertAllowedFields(
  value: Record<string, unknown>,
  allowed: ReadonlySet<string>,
  field: string
): void {
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== "string" || !allowed.has(key)) {
      throw new Error(`${field} contains an unknown field`);
    }
  }
}

function canonicalIdentifier(value: unknown, field: string): string {
  if (typeof value !== "string" || value.length === 0 || value.length > IDENTIFIER_LIMIT ||
    /[\s\u0000-\u001f\u007f]/.test(value) || redactTrace(value) !== value) {
    throw new Error(`Invalid ${field}`);
  }
  return value;
}

function canonicalLabel(value: unknown, field: string, limit: number): string {
  if (typeof value !== "string" || value.length === 0 || value.length > limit ||
    /[\u0000-\u001f\u007f]/.test(value)) {
    throw new Error(`Invalid ${field}`);
  }
  return redactTrace(value);
}

function boundedCanonicalText(
  value: unknown,
  field: string,
  limit = TOOL_RESULT_PREVIEW_LIMIT
): { text: string; truncated: boolean } {
  if (typeof value !== "string") throw new Error(`Invalid ${field}`);
  const safe = redactTrace(value);
  return safe.length > limit
    ? { text: truncateUnicodePrefix(safe, limit), truncated: true }
    : { text: safe, truncated: false };
}

function canonicalTokenCount(value: unknown, field: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) {
    throw new Error(`Invalid usage ${field}`);
  }
  return value as number;
}

function sanitizeDraft(draft: HarnessEventDraft): HarnessEventDraft {
  // Activity is an internal heartbeat only. Even if an Adapter accidentally
  // attaches a native reasoning payload, never let that payload cross the
  // canonical boundary where it could be persisted by an event consumer.
  if (draft.kind === "activity") return { kind: "activity" };
  const tool = draft.tool;
  const input = tool?.input === undefined ? undefined : boundedPreview(tool.input);
  const output = tool?.outputPreview === undefined
    ? undefined
    : boundedPreview(tool.outputPreview);
  const diagnostic = draft.diagnostic
    ? {
        ...draft.diagnostic,
        message: safeEventText(draft.diagnostic.message)
      }
    : undefined;
  return {
    ...draft,
    ...(draft.message === undefined ? {} : { message: safeEventText(draft.message) }),
    ...(draft.sourceType === undefined ? {} : { sourceType: safeEventText(draft.sourceType) }),
    ...(tool ? {
      tool: {
        ...tool,
        ...(input ? { input: input.text } : {}),
        ...(output ? {
          outputPreview: output.text,
          truncated: tool.truncated === true || output.truncated
        } : {})
      }
    } : {}),
    ...(diagnostic ? { diagnostic } : {})
  };
}

function phaseForKind(kind: HarnessEvent["kind"]): HarnessEvent["phase"] {
  if (kind === "tool.started" || kind === "lifecycle") return "started";
  if (kind === "assistant.delta" || kind === "tool.updated" || kind === "activity") return "delta";
  if (kind === "tool.failed") return "failed";
  return "completed";
}

function terminalSemanticKey(draft: HarnessEventDraft): string | undefined {
  if (draft.kind === "tool.started" || draft.kind === "tool.completed" || draft.kind === "tool.failed") {
    return [
      draft.kind,
      draft.tool?.callId ?? "",
      draft.tool?.outputPreview ?? "",
      draft.tool?.isError === true ? "error" : "ok"
    ].join(":");
  }
  return undefined;
}

export function contentText(value: unknown): string {
  if (typeof value === "string") return safeEventText(value);
  return eventArray(value).map((entry) => {
    const block = eventRecord(entry);
    if (!block || (block.type !== "text" && block.type !== "output_text")) return "";
    return safeEventText(block.text);
  }).filter(Boolean).join("\n");
}

function eventTimestamp(event: Record<string, unknown>): string {
  const value = event.timestamp ?? eventRecord(eventRecord(event.params)?.event)?.time;
  if (typeof value === "number" && Number.isFinite(value)) return new Date(value).toISOString();
  if (typeof value === "string" && !Number.isNaN(Date.parse(value))) return new Date(value).toISOString();
  return new Date().toISOString();
}

export function safeEventText(value: unknown): string {
  return typeof value === "string" ? redactTrace(value) : "";
}

export function stableEventValue(value: unknown): string {
  try { return JSON.stringify(value); } catch { return String(value); }
}

export function isEventRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function eventRecord(value: unknown): Record<string, unknown> | undefined {
  return isEventRecord(value) ? value : undefined;
}

export function eventArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function eventString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}
