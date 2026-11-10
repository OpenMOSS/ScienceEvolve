import type { AgentProtocol } from "./agent-runtime.js";
import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { redactTrace } from "./utils.js";
import { configuredModelContextWindow, modelAutoCompactTokenLimit } from "./model-context.js";
import { injectionTokenEstimate, type InjectionBudget } from "./context-injection-budget.js";
import {
  validateGatewayNetworkTarget,
  validatePublicWebNetworkTarget
} from "./gateway-security.js";
import { requiredToolChoiceRejected, specifiedToolChoiceFallback } from "./gateway-tool-choice.js";
import type {
  AgentActivitySignal,
  GatewayUsagePersistenceFailure,
  GatewayModelStreamEvent,
  GatewayUnknownTokenUsage,
  GatewayUsageReport
} from "./types.js";
import { normalizeGatewayTokenUsage } from "./internal/shared/token-usage-ledger.js";
import { contextLimitError, nativeContextLimitMessage } from "./context-limit.js";
import {
  applyGatewayReasoning,
  type ResolvedGatewayReasoning
} from "./gateway-reasoning.js";

export type { AgentProtocol } from "./agent-runtime.js";
export { normalizeGatewayTokenUsage } from "./internal/shared/token-usage-ledger.js";

/** Bump whenever route conversion semantics invalidate a cached smoke probe. */
export const PROTOCOL_ROUTER_COMPATIBILITY_VERSION = "13";

export type NormalizedRole = "system" | "developer" | "user" | "assistant" | "tool";

export interface NormalizedToolCall {
  id: string;
  name: string;
  arguments: string;
}

export interface NormalizedMessage {
  role: NormalizedRole;
  content: string;
  name?: string;
  toolCallId?: string;
  toolCalls?: NormalizedToolCall[];
}

export interface ProtocolTool {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
  /** Preserve source validation intent; omitted portable schemas may have optional fields. */
  strict?: boolean;
  /** Original Responses namespace identity before portable-name flattening. */
  sourceNamespace?: string;
  /** Original function name inside sourceNamespace. */
  sourceName?: string;
  /** Codex's client-executed discovery tool, carried as a portable function. */
  sourceType?: "tool_search";
}

export interface ProtocolRequest {
  model: string;
  messages: NormalizedMessage[];
  tools?: ProtocolTool[];
  /** A named tool explicitly required by the source request. */
  requiredToolName?: string;
  /** Require a tool call while allowing the provider to choose among tools. */
  requireTool?: boolean;
  stream?: boolean;
  maxOutputTokens?: number;
  /** Preserve the source Chat field when the target is also Chat Completions. */
  chatMaxOutputField?: "max_completion_tokens";
  temperature?: number;
  /** Server-resolved model option; never copied from an untrusted native request. */
  gatewayReasoning?: ResolvedGatewayReasoning;
}

export interface RoutedRequest {
  protocol: AgentProtocol;
  endpointSuffix: "responses" | "chat/completions" | "messages";
  headers: Record<string, string>;
  body: Record<string, unknown>;
}

export interface NormalizedStreamEvent {
  type: "text_delta" | "reasoning_delta" | "tool_call_delta" | "completed" | "error" | "unknown";
  text?: string;
  toolName?: string;
  toolCallId?: string;
  /** Provider item identifier (distinct from a function call id in Responses). */
  toolItemId?: string;
  /** Provider-local tool position, useful when later chunks omit the id. */
  toolIndex?: number;
  argumentsDelta?: string;
  /** True for a provider's per-tool final/done event. */
  toolCallFinal?: boolean;
  /** Provider usage is carried on a terminal stream event when available. */
  usage?: Record<string, unknown>;
  /** Provider stop reason, retained when converting terminal events. */
  stopReason?: string;
  error?: string;
  raw?: unknown;
}

export class ProtocolRouteError extends Error {
  constructor(message: string, readonly source: "router" | "gateway" | "provider" = "router") {
    super(message);
    this.name = "ProtocolRouteError";
  }
}

export interface ProtocolToolArgumentsValidation {
  valid: boolean;
  normalized?: string;
  reason?: string;
}

/** A provider/tool-call protocol failure retained by one invocation-local proxy. */
export interface ProtocolProxyFailure {
  code: "PROTOCOL_TOOL_ARGUMENTS_INVALID" | "MODEL_PROVIDER_FAILED" | "MODEL_CONTEXT_LIMIT_EXCEEDED" |
    "MODEL_AUTHENTICATION_FAILED" | "MODEL_REQUEST_INVALID" | "CONTEXT_INJECTION_LIMIT_EXCEEDED";
  httpStatus?: number;
  requestedTokens?: number;
  limitTokens?: number;
  message: string;
  toolName?: string;
  toolIndex?: number;
  sourceProtocol: AgentProtocol;
  targetProtocol: AgentProtocol;
  model: string;
}

export function routeProtocolRequest(
  request: ProtocolRequest,
  protocol: AgentProtocol,
  apiKey?: string
): RoutedRequest {
  const soleRequiredTool = request.requiredToolName !== undefined &&
    request.tools?.length === 1 &&
    request.tools[0]?.name === request.requiredToolName;
  const headers: Record<string, string> = {
    Accept: request.stream ? "text/event-stream, application/json" : "application/json",
    "Content-Type": "application/json",
    ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
  };
  if (protocol === "responses") {
    return {
      protocol,
      endpointSuffix: "responses",
      headers,
      body: applyGatewayReasoning({
        model: request.model,
        input: responsesInput(request.messages),
        // Responses defaults to strict schema normalization. Portable MCP/Chat
        // schemas retain optional fields, so make their existing intent explicit.
        ...(request.tools?.length ? { tools: request.tools.map((tool) => ({ type: "function", name: tool.name, description: tool.description, parameters: tool.inputSchema, strict: tool.strict ?? false })) } : {}),
        ...(request.requiredToolName
          ? { tool_choice: { type: "function", name: request.requiredToolName } }
          : request.requireTool ? { tool_choice: "required" } : {}),
        ...(request.stream !== undefined ? { stream: request.stream } : {}),
        ...(request.maxOutputTokens !== undefined ? { max_output_tokens: request.maxOutputTokens } : {}),
        ...(request.temperature !== undefined ? { temperature: request.temperature } : {})
      }, request.gatewayReasoning)
    };
  }
  if (protocol === "chat-completions") {
    return {
      protocol,
      endpointSuffix: "chat/completions",
      headers,
      body: applyGatewayReasoning({
        model: request.model,
        messages: chatMessages(request.messages),
        ...(request.tools?.length ? { tools: request.tools.map((tool) => ({ type: "function", function: { name: tool.name, description: tool.description, parameters: tool.inputSchema, ...(tool.strict !== undefined ? { strict: tool.strict } : {}) } })) } : {}),
        ...(request.requiredToolName
          ? { tool_choice: soleRequiredTool
            ? "required"
            : { type: "function", function: { name: request.requiredToolName } } }
          : request.requireTool ? { tool_choice: "required" } : {}),
        ...(request.stream !== undefined ? { stream: request.stream } : {}),
        ...(request.stream === true ? { stream_options: { include_usage: true } } : {}),
        ...(request.maxOutputTokens !== undefined
          ? { [request.chatMaxOutputField ?? "max_tokens"]: request.maxOutputTokens }
          : {}),
        ...(request.temperature !== undefined ? { temperature: request.temperature } : {})
      }, request.gatewayReasoning)
    };
  }
  headers["x-api-key"] = apiKey ?? "";
  // A number of OpenAI-compatible gateways (including the configured SII
  // endpoint) authenticate Anthropic-shaped requests with Bearer rather than
  // the standard x-api-key header.  Sending both is harmless for compliant
  // Anthropic servers and lets the selected gateway decide which one it uses.
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  headers["anthropic-version"] = "2023-06-01";
  return {
    protocol,
    endpointSuffix: "messages",
    headers,
    body: applyGatewayReasoning({
      model: request.model,
      system: request.messages.filter((message) => message.role === "system" || message.role === "developer").map((message) => message.content).join("\n\n") || undefined,
      messages: anthropicMessages(request.messages),
      ...(request.tools?.length ? { tools: request.tools.map((tool) => ({ name: tool.name, description: tool.description, input_schema: tool.inputSchema })) } : {}),
      ...(request.requiredToolName
        ? { tool_choice: { type: "tool", name: request.requiredToolName } }
        : request.requireTool ? { tool_choice: { type: "any" } } : {}),
      ...(request.stream !== undefined ? { stream: request.stream } : {}),
      max_tokens: request.maxOutputTokens ?? 1_024,
      ...(request.temperature !== undefined ? { temperature: request.temperature } : {})
    }, request.gatewayReasoning)
  };
}

function responsesInput(messages: NormalizedMessage[]): Array<Record<string, unknown>> {
  const items: Array<Record<string, unknown>> = [];
  for (const message of messages) {
    if (message.role === "tool") {
      items.push({ type: "function_call_output", call_id: message.toolCallId ?? "tool_call", output: message.content });
      continue;
    }
    if (message.toolCalls?.length) {
      for (const call of message.toolCalls) {
        items.push({ type: "function_call", call_id: call.id, name: call.name, arguments: call.arguments });
      }
      if (message.content) items.push({ role: message.role, content: message.content });
      continue;
    }
    items.push({ role: message.role, content: message.content });
  }
  return items;
}

function chatMessages(messages: NormalizedMessage[]): Array<Record<string, unknown>> {
  const converted = messages.map((message) => ({
    // Some OpenAI-compatible gateways reject the newer `developer` role.
    // System messages carry
    // the same instruction semantics and are accepted by both old and new
    // Chat Completions implementations.
    role: message.role === "developer" ? "system" : message.role,
    content: message.content,
    ...(message.name ? { name: message.name } : {}),
    ...(message.toolCallId ? { tool_call_id: message.toolCallId } : {}),
    ...(message.toolCalls?.length ? {
      tool_calls: message.toolCalls.map((call) => ({
        id: call.id,
        type: "function",
        function: { name: call.name, arguments: call.arguments }
      }))
    } : {})
  }));

  // Chat Completions providers generally require every system message to
  // precede the first user/assistant/tool message.  Responses requests can
  // legally carry instructions interleaved with the input history, and the
  // Codex adapter uses that shape when a durable thread is resumed.  Keep the
  // instruction text (and its relative order) but move it to one leading
  // system message so conservative gateways do not reject the request with
  // "System message must be at the beginning".
  const systemContent = converted
    .filter((message) => message.role === "system")
    .map((message) => typeof message.content === "string" ? message.content : "")
    .filter(Boolean)
    .join("\n\n");
  const nonSystem = converted.filter((message) => message.role !== "system");
  return systemContent
    ? [{ role: "system", content: systemContent }, ...nonSystem]
    : nonSystem;
}

function anthropicMessages(messages: NormalizedMessage[]): Array<Record<string, unknown>> {
  return messages
    .filter((message) => message.role !== "system" && message.role !== "developer")
    .map((message) => {
      if (message.role === "tool") {
        return {
          role: "user",
          content: [{ type: "tool_result", tool_use_id: message.toolCallId ?? "tool_call", content: message.content }]
        };
      }
      const content: Array<Record<string, unknown>> = [];
      if (message.content) content.push({ type: "text", text: message.content });
      for (const call of message.toolCalls ?? []) {
        content.push({ type: "tool_use", id: call.id, name: call.name, input: safeJson(call.arguments) ?? {} });
      }
      return { role: message.role === "assistant" ? "assistant" : "user", content };
    });
}

/** Convert the common subset of provider SSE/JSON events into one stream shape. */
function normalizeProtocolStreamEventSingle(protocol: AgentProtocol, value: unknown): NormalizedStreamEvent {
  if (value === "[DONE]") return { type: "completed", raw: value };
  if (!value || typeof value !== "object") return { type: "unknown", raw: value };
  const record = value as Record<string, unknown>;
  if (protocol === "responses") {
    const type = typeof record.type === "string" ? record.type : "";
    if (type.toLowerCase().includes("reasoning") || type.toLowerCase().includes("thinking")) {
      return {
        type: "reasoning_delta",
        text: typeof record.delta === "string"
          ? record.delta
          : typeof record.text === "string" ? record.text : undefined,
        raw: value
      };
    }
    if (type.includes("output_text.delta") || type.endsWith("text.delta")) return { type: "text_delta", text: typeof record.delta === "string" ? record.delta : typeof record.text === "string" ? record.text : "", raw: value };
    if (type === "response.output_item.added" && record.item && typeof record.item === "object") {
      const item = record.item as Record<string, unknown>;
      if (item.type === "function_call") return {
        type: "tool_call_delta",
        toolCallId: typeof item.call_id === "string" ? item.call_id : typeof item.id === "string" ? item.id : undefined,
        toolItemId: typeof item.id === "string" ? item.id : typeof item.call_id === "string" ? item.call_id : undefined,
        toolName: typeof item.name === "string" ? item.name : undefined,
        toolIndex: numberValue(record.output_index) ?? numberValue(record.index),
        argumentsDelta: typeof item.arguments === "string"
          ? item.arguments
          : item.arguments !== undefined ? JSON.stringify(item.arguments) : "",
        raw: value
      };
    }
    if (type === "response.output_item.done" && record.item && typeof record.item === "object") {
      const item = record.item as Record<string, unknown>;
      if (item.type === "function_call") return {
        type: "tool_call_delta",
        toolCallId: typeof item.call_id === "string" ? item.call_id : typeof item.id === "string" ? item.id : undefined,
        toolItemId: typeof item.id === "string" ? item.id : typeof item.call_id === "string" ? item.call_id : undefined,
        toolName: typeof item.name === "string" ? item.name : undefined,
        toolIndex: numberValue(record.output_index) ?? numberValue(record.index),
        argumentsDelta: typeof item.arguments === "string" ? item.arguments : JSON.stringify(item.arguments ?? {}),
        toolCallFinal: true
      };
    }
    if (type.includes("function_call_arguments")) return {
      type: "tool_call_delta",
      // Responses argument events normally carry the output item id, not the
      // function call id used by later tool results. Keep those identities
      // separate so a route to Chat/Anthropic does not silently rewrite the
      // call id after `response.output_item.added` established it.
      toolCallId: typeof record.call_id === "string" ? record.call_id : undefined,
      toolItemId: typeof record.item_id === "string" ? record.item_id : undefined,
      toolName: typeof record.name === "string" ? record.name : undefined,
      toolIndex: numberValue(record.output_index) ?? numberValue(record.index),
      argumentsDelta: typeof record.delta === "string"
        ? record.delta
        : typeof record.arguments === "string" ? record.arguments : "",
      toolCallFinal: type.endsWith(".done"),
      raw: value
    };
    if (type === "response.failed" || type === "response.error") {
      const response = record.response && typeof record.response === "object" ? record.response as Record<string, unknown> : {};
      const error = record.error && typeof record.error === "object"
        ? record.error as Record<string, unknown>
        : response.error && typeof response.error === "object"
          ? response.error as Record<string, unknown>
          : {};
      const detail = typeof record.error === "string"
        ? record.error
        : typeof response.error === "string"
          ? response.error
          : typeof error.message === "string" ? error.message : "Responses provider reported a failed response";
      return { type: "error", error: detail, raw: value };
    }
    if (type === "response.completed" || type === "response.done" || type === "response.incomplete" || type.endsWith("completed")) {
      const response = record.response && typeof record.response === "object" ? record.response as Record<string, unknown> : {};
      const status = typeof response.status === "string" ? response.status : undefined;
      const incomplete = response.incomplete_details && typeof response.incomplete_details === "object"
        ? response.incomplete_details as Record<string, unknown>
        : {};
      return {
        type: "completed",
        stopReason: typeof incomplete.reason === "string"
          ? incomplete.reason
          : type === "response.incomplete"
            ? "incomplete"
            : status && status !== "completed" ? status : undefined,
        usage: optionalObjectValue(response.usage ?? record.usage),
        raw: value
      };
    }
  } else if (protocol === "chat-completions") {
    const choices = Array.isArray(record.choices) ? record.choices : [];
    const choice = choices[0] && typeof choices[0] === "object" ? choices[0] as Record<string, unknown> : undefined;
    const delta = choice?.delta ?? choice?.message;
    if (delta && typeof delta === "object") {
      const deltaRecord = delta as Record<string, unknown>;
      const text = typeof deltaRecord.content === "string"
        ? deltaRecord.content
        : Array.isArray(deltaRecord.content)
          ? contentText(deltaRecord.content)
          : undefined;
      const reasoning = chatReasoningText(deltaRecord);
      const toolCalls = Array.isArray(deltaRecord.tool_calls) ? deltaRecord.tool_calls as unknown[] : [];
      const tool = toolCalls[0] && typeof toolCalls[0] === "object" ? toolCalls[0] as Record<string, unknown> : undefined;
      const fn = tool?.function && typeof tool.function === "object" ? tool.function as Record<string, unknown> : undefined;
      // Some compatible gateways emit a complete JSON object in a stream
      // chunk. Preserve it without adding bytes to name-only chunks.
      const argumentsDelta = typeof fn?.arguments === "string"
        ? fn.arguments
        : fn?.arguments && typeof fn.arguments === "object"
          ? JSON.stringify(fn.arguments)
          : "";
      if (tool || text || reasoning) return tool
        ? { type: "tool_call_delta", toolCallId: typeof tool.id === "string" ? tool.id : undefined, toolItemId: typeof tool.id === "string" ? tool.id : undefined, toolName: typeof fn?.name === "string" ? fn.name : undefined, toolIndex: numberValue(tool?.index) ?? numberValue(record.index), argumentsDelta, raw: value }
        : text
          ? { type: "text_delta", text, raw: value }
          : { type: "reasoning_delta", text: reasoning, raw: value };
    }
    const finish = choice?.finish_reason;
    const usage = optionalObjectValue(record.usage);
    if ((typeof finish === "string" && finish.length > 0) || (usage && Object.keys(usage).length > 0)) {
      return { type: "completed", stopReason: typeof finish === "string" ? finish : undefined, usage, raw: value };
    }
  } else {
    const type = typeof record.type === "string" ? record.type : "";
    if (type === "content_block_start" && record.content_block && typeof record.content_block === "object") {
      const block = record.content_block as Record<string, unknown>;
      if (block.type === "thinking" || block.type === "redacted_thinking") {
        return { type: "reasoning_delta", raw: value };
      }
      if (block.type === "tool_use") return {
        type: "tool_call_delta",
        toolCallId: typeof block.id === "string" ? block.id : undefined,
        toolItemId: typeof block.id === "string" ? block.id : undefined,
        toolName: typeof block.name === "string" ? block.name : undefined,
        toolIndex: numberValue(record.index),
        argumentsDelta: "",
        raw: value
      };
    }
    if (type === "content_block_delta" && record.delta && typeof record.delta === "object") {
      const delta = record.delta as Record<string, unknown>;
      if (delta.type === "text_delta") return { type: "text_delta", text: typeof delta.text === "string" ? delta.text : "", raw: value };
      if (delta.type === "thinking_delta" || delta.type === "signature_delta") {
        return {
          type: "reasoning_delta",
          text: typeof delta.thinking === "string"
            ? delta.thinking
            : typeof delta.text === "string" ? delta.text : undefined,
          raw: value
        };
      }
      if (delta.type === "input_json_delta") return { type: "tool_call_delta", toolIndex: numberValue(record.index), argumentsDelta: typeof delta.partial_json === "string" ? delta.partial_json : "", raw: value };
    }
    if (type === "message_stop" || type === "message_delta" && record.delta && typeof record.delta === "object" && typeof (record.delta as Record<string, unknown>).stop_reason === "string") {
      const delta = record.delta && typeof record.delta === "object" ? record.delta as Record<string, unknown> : {};
      return { type: "completed", stopReason: typeof delta.stop_reason === "string" ? delta.stop_reason : undefined, usage: optionalObjectValue(record.usage ?? delta.usage), raw: value };
    }
    if (type === "message_start" && record.message && typeof record.message === "object") {
      const message = record.message as Record<string, unknown>;
      return { type: "unknown", usage: optionalObjectValue(message.usage), raw: value };
    }
  }
  if (record.error !== undefined) {
    const detail = typeof record.error === "string"
      ? record.error
      : record.error && typeof record.error === "object" && typeof (record.error as Record<string, unknown>).message === "string"
        ? String((record.error as Record<string, unknown>).message)
        : "provider stream failed";
    return { type: "error", error: detail, raw: value };
  }
  return { type: "unknown", raw: value };
}

function chatReasoningText(delta: Record<string, unknown>): string | undefined {
  for (const key of ["reasoning_content", "reasoning", "thinking", "thinking_content"]) {
    const value = delta[key];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return undefined;
}

/**
 * Normalize one provider frame into all meaningful common events.  Chat
 * Completions permits several tool calls (and text plus tool deltas) in the
 * same SSE chunk; the public single-event helper remains backwards compatible
 * while the proxy/probe paths consume the complete list.
 */
export function normalizeProtocolStreamEvents(protocol: AgentProtocol, value: unknown): NormalizedStreamEvent[] {
  if (protocol !== "chat-completions" || !value || typeof value !== "object") {
    return [normalizeProtocolStreamEventSingle(protocol, value)];
  }
  const record = value as Record<string, unknown>;
  const choices = Array.isArray(record.choices) ? record.choices : [];
  const choice = choices[0] && typeof choices[0] === "object" ? choices[0] as Record<string, unknown> : undefined;
  const delta = choice?.delta ?? choice?.message;
  if (!delta || typeof delta !== "object") return [normalizeProtocolStreamEventSingle(protocol, value)];
  const deltaRecord = delta as Record<string, unknown>;
  const toolCalls = Array.isArray(deltaRecord.tool_calls) ? deltaRecord.tool_calls : [];
  const reasoning = chatReasoningText(deltaRecord);
  if (toolCalls.length === 0 && !reasoning) return [normalizeProtocolStreamEventSingle(protocol, value)];
  const events: NormalizedStreamEvent[] = [];
  const text = typeof deltaRecord.content === "string"
    ? deltaRecord.content
    : Array.isArray(deltaRecord.content) ? contentText(deltaRecord.content) : "";
  if (text) {
    const textChoice = { ...choice, delta: { ...deltaRecord, tool_calls: undefined } };
    events.push(normalizeProtocolStreamEventSingle(protocol, { ...record, choices: [textChoice] }));
  }
  if (reasoning) events.push({ type: "reasoning_delta", text: reasoning, raw: value });
  for (const tool of toolCalls) {
    const toolChoice = {
      ...choice,
      delta: { ...deltaRecord, content: undefined, tool_calls: [tool] },
      finish_reason: null
    };
    events.push(normalizeProtocolStreamEventSingle(protocol, { ...record, choices: [toolChoice] }));
  }
  const finishReason = choice?.finish_reason;
  const usage = optionalObjectValue(record.usage);
  if ((typeof finishReason === "string" && finishReason.length > 0) || (usage && Object.keys(usage).length > 0)) {
    events.push(normalizeProtocolStreamEventSingle(protocol, {
      ...record,
      choices: [{ ...choice, delta: {}, finish_reason: finishReason }]
    }));
  }
  return events.length ? events : [normalizeProtocolStreamEventSingle(protocol, value)];
}

export function normalizeProtocolStreamEvent(protocol: AgentProtocol, value: unknown): NormalizedStreamEvent {
  return normalizeProtocolStreamEvents(protocol, value)[0] ?? { type: "unknown", raw: value };
}

export function mapProtocolError(protocol: AgentProtocol, status: number, body: unknown): ProtocolRouteError {
  const detail = body && typeof body === "object" && "error" in body
    ? (body as { error?: unknown }).error
    : body;
  const text = typeof detail === "string" ? detail : detail && typeof detail === "object" && "message" in detail ? String((detail as { message: unknown }).message) : "provider request failed";
  return new ProtocolRouteError(`${protocol} gateway error (${status}): ${redactTrace(text).slice(0, 500)}`, "gateway");
}

function protocolErrorDetail(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  if (record.type !== "error" && record.error === undefined) return undefined;
  const detail = typeof record.error === "string"
    ? record.error
    : record.error && typeof record.error === "object" && typeof (record.error as Record<string, unknown>).message === "string"
      ? String((record.error as Record<string, unknown>).message)
      : record.message;
  return typeof detail === "string" ? redactTrace(detail).slice(0, 500) : "provider returned an error payload";
}

/** Validate only the JSON envelope; tool semantics remain owned by the CLI. */
export function validateToolArguments(
  raw: string,
  fallbackName?: string
): ProtocolToolArgumentsValidation {
  const normalized = normalizeToolArguments(raw, fallbackName);
  try {
    const parsed = JSON.parse(normalized) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {
        valid: false,
        reason: "tool arguments must be a JSON object"
      };
    }
    return { valid: true, normalized: JSON.stringify(parsed) };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "invalid JSON";
    return { valid: false, reason: redactTrace(reason).slice(0, 300) };
  }
}

function invalidToolArguments(
  tool: { name?: string; arguments: string },
  context: { sourceProtocol: AgentProtocol; targetProtocol: AgentProtocol; model: string; toolIndex?: number }
): ProtocolProxyFailure | undefined {
  const validation = validateToolArguments(tool.arguments, tool.name);
  if (validation.valid) return undefined;
  const toolName = tool.name?.trim() || "tool";
  return {
    code: "PROTOCOL_TOOL_ARGUMENTS_INVALID",
    message: `Gateway returned invalid JSON tool arguments for ${toolName}: ${validation.reason ?? "invalid JSON"}`,
    toolName,
    ...(context.toolIndex !== undefined ? { toolIndex: context.toolIndex } : {}),
    sourceProtocol: context.sourceProtocol,
    targetProtocol: context.targetProtocol,
    model: context.model
  };
}

function firstInvalidToolCall(
  messages: NormalizedMessage[],
  context: { sourceProtocol: AgentProtocol; targetProtocol: AgentProtocol; model: string }
): ProtocolProxyFailure | undefined {
  for (const message of messages) {
    for (const [toolIndex, tool] of (message.toolCalls ?? []).entries()) {
      const failure = invalidToolArguments(tool, { ...context, toolIndex });
      if (failure) return failure;
    }
  }
  return undefined;
}

/** Preserve malformed historical calls as Agent feedback without inventing
 * execution receipts. The original native history remains authoritative. */
function historicalToolArgumentFeedback(messages: NormalizedMessage[]): { messages: NormalizedMessage[]; count: number } {
  const calls = messages.flatMap(message => message.toolCalls ?? []);
  const counts = new Map<string, number>();
  for (const call of calls) counts.set(call.id, (counts.get(call.id) ?? 0) + 1);
  const results = new Map<string, string[]>();
  for (const message of messages) if (message.role === "tool" && message.toolCallId) {
    const existing = results.get(message.toolCallId);
    if (existing) existing.push(message.content);
    else results.set(message.toolCallId, [message.content]);
  }
  const recovered = new Set(calls.filter(call => counts.get(call.id) === 1 &&
    !validateToolArguments(call.arguments, call.name).valid).map(call => call.id));
  if (!recovered.size) return { messages, count: 0 };
  return { count: recovered.size, messages: messages.flatMap(message => {
    if (message.role === "tool" && message.toolCallId && recovered.has(message.toolCallId)) return [];
    const invalid = (message.toolCalls ?? []).filter(call => recovered.has(call.id));
    if (!invalid.length) return [message];
    const diagnostics = invalid.map(call => [
      `Historical tool argument error for ${call.name} (call_id=${call.id}).`,
      `Original arguments: ${JSON.stringify(call.arguments)}`,
      results.has(call.id) ? `Recorded tool result: ${JSON.stringify(results.get(call.id))}`
        : "No native tool result was recorded. Execution outcome is unknown; inspect actual durable effects before retrying.",
      "Use this recorded error to generate a corrected tool call. Inspect current formal state and actual effects before repeating a mutation."
    ].join("\n"));
    return [{ ...message, content: [message.content, ...diagnostics].filter(Boolean).join("\n\n"),
      toolCalls: message.toolCalls?.filter(call => !recovered.has(call.id)) }];
  }) };
}

function firstInvalidNormalizedToolCall(
  toolCalls: Array<{ name: string; arguments: string }>,
  context: { sourceProtocol: AgentProtocol; targetProtocol: AgentProtocol; model: string;
    sourceTools?: ProtocolTool[]; onNativeError?: (failure: ProtocolProxyFailure) => void }
): ProtocolProxyFailure | undefined {
  for (const [toolIndex, tool] of toolCalls.entries()) {
    const failure = invalidToolArguments(tool, { ...context, toolIndex });
    if (!failure) continue;
    if (context.sourceProtocol !== "anthropic-messages" &&
        !isClientToolSearch(tool.name, context.sourceTools)) {
      context.onNativeError?.(failure);
      continue;
    }
    return failure;
  }
  return undefined;
}

/**
 * Invocation-local HTTP protocol bridge.  A child harness only receives a
 * random loopback bearer token; the selected gateway key remains in this
 * server process and is used for the upstream request.  The bridge is kept
 * deliberately small and invocation-local so a cancelled child request can
 * abort the corresponding upstream fetch without sharing credentials.
 */
export type GatewayModelFetch = (url: string, init: RequestInit) => Promise<Response>;

export interface ProtocolProxyOptions {
  /** Only this turn's application injection, not the native conversation.
   * Actual model-facing tool definitions are added at the provider boundary. */
  getContextInjectionBudget?: () => InjectionBudget | undefined;
  /** Server-owned invocation transport seam for isolated acceptance faults.
   * Applies only to model POSTs; normal retry/fallback remains below. */
  modelFetch?: GatewayModelFetch;
  sourceProtocol: AgentProtocol;
  targetProtocol: AgentProtocol;
  gatewayUrl: string;
  gatewayApiKey: string;
  /** Invocation-selected model used for the local Web Search MCP capability. */
  webSearchModel?: string;
  /** Server-authoritative UI policy; a route token alone never enables Web Search. */
  webSearchEnabled?: boolean;
  /** Saved per-model capacity from the selected Gateway snapshot. */
  modelContextWindows?: Record<string, number>;
  /** Exact server-resolved reasoning option applied after protocol conversion. */
  gatewayReasoning?: ResolvedGatewayReasoning;
  /** Optional provider model to send upstream when the source client needs a known catalog alias. */
  upstreamModel?: string;
  /**
   * Route a native request through the loopback bridge even when both sides
   * use the same wire protocol. This is useful for clients whose OpenAI SDK
   * emits provider-specific optional fields that the selected gateway does
   * not accept; the bridge normalizes the request to the conservative common
   * subset before forwarding it.
   */
  force?: boolean;
  /** Optional redacted lifecycle sink for the owning invocation. */
  onTrace?: (
    kind: "status" | "error",
    message: string,
    data?: Record<string, unknown>
  ) => void | Promise<void>;
  /** Refresh the owning orchestration idle timer only when the upstream
   * provider actually makes progress. Local proxy preludes and keep-alives do
   * not count as model activity. */
  onActivity?: (activity: AgentActivitySignal) => void;
  /** Durable accounting sink for one completed upstream model request. */
  onUsage?: (usage: GatewayUsageReport) => void | Promise<void>;
  /** Structured sink used when the durable accounting callback rejects. */
  onUsagePersistenceFailure?: (
    failure: GatewayUsagePersistenceFailure
  ) => void | Promise<void>;
  /** Neutral provider-boundary telemetry for real request/output progress. */
  onModelStreamEvent?: (event: GatewayModelStreamEvent) => void | Promise<void>;
  /** User-visible Assistant text tap for terminal-only native clients. */
  onVisibleAssistantDelta?: (text: string) => void | Promise<void>;
  /** Opt-in display tap for explicit public summary events, never raw reasoning. */
  onVisibleReasoningSummaryDelta?: (text: string, itemId: string) => void | Promise<void>;
  /** Optional single-tool force used only by deterministic protocol probes. */
  requiredToolName?: string;
  /** Capability-derived delivery policy for this exact Gateway route. */
  deliveryMode?: "native-stream" | "buffered-json";
  /** Invocation-local response promises shared by native recovery
   * processes. The cache contains provider bodies, never credentials. */
  bufferedResponseCache?: Map<string, Promise<BufferedProtocolResponse>>;
  /** Outer Agent-invocation lifetime. A child client disconnect must not
   * cancel cached provider work, but cancelling the whole invocation must. */
  invocationSignal?: AbortSignal;
  /** Inactivity deadline for one upstream request; provider stream activity resets it. */
  timeoutMs?: number;
  /** Injectable only for loopback tests; production validates DNS itself. */
  validateGatewayTarget?: (url: string) => Promise<unknown>;
}

export interface BufferedProtocolResponse {
  status: number;
  ok: boolean;
  contentType: string;
  bodyText: string;
  /** Identity of the actual final provider attempt (not a replaying client). */
  usageId: string;
}

export interface ProtocolProxy {
  readonly baseUrl: string;
  readonly token: string;
  close(): Promise<void>;
  /** Read the first protocol failure observed by this invocation-local proxy. */
  getFailure?(): ProtocolProxyFailure | undefined;
  /** Clear a consumed failure before a same-Harness replacement Session retry. */
  resetFailure?(): void;
}

interface NormalizedResponse {
  id: string;
  model: string;
  text: string;
  toolCalls: Array<{ id: string; name: string; arguments: string }>;
  usage?: Record<string, unknown>;
  stopReason?: string;
}

function estimatedNormalizedOutputTokens(response: NormalizedResponse): number {
  const content = [
    response.text,
    ...response.toolCalls.flatMap((call) => [call.name, call.arguments])
  ].join("");
  const characters = Array.from(content).length;
  return characters > 0 ? Math.max(1, Math.ceil(characters / 4)) : 0;
}

interface ProxyState {
  options: ProtocolProxyOptions;
  token: string;
  server: Server;
  timeoutMs: number;
  /** Learned only for this invocation after a stream fails before model output. */
  bufferedDelivery?: boolean;
  /** A probe-only sentinel choice is applied exactly once. */
  requiredToolIssued: boolean;
  providerRequestSequence: number;
  providerSuccessSequence: number;
  usageReportStatus: Map<string, "known" | "unknown">;
  /** Invocation-local, bounded deduplication of diagnostic schema snapshots. */
  tracedToolDefinitionDigests: Set<string>;
  providerFailure?: {
    sequence: number;
    failure: ProtocolProxyFailure;
  };
  failure?: ProtocolProxyFailure;
  failureSequence?: number;
}

function outgoingToolDiagnostics(state: ProxyState, tools: unknown, names: string[]): Record<string, unknown> {
  if (!state.options.onTrace) return {};
  // Read only the actual converted tool field. Never retain request headers,
  // messages, arguments, results, or gateway credentials in this diagnostic.
  const original = JSON.stringify(tools ?? []);
  const redacted = redactTrace(original);
  const digest = createHash("sha256").update(redacted).digest("hex");
  const bytes = Buffer.byteLength(redacted);
  const omitted = state.tracedToolDefinitionDigests.has(digest) ? "already_traced"
    : bytes > 128 * 1024 ? "size_limit"
    : state.tracedToolDefinitionDigests.size >= 16 ? "snapshot_limit" : undefined;
  if (!omitted) state.tracedToolDefinitionDigests.add(digest);
  return {
    toolNames: JSON.parse(redactTrace(JSON.stringify(names))) as string[],
    toolDefinitionDigest: digest,
    toolDefinitionBytes: bytes,
    toolDefinitionsRedacted: original !== redacted,
    ...(omitted ? { toolDefinitionsOmittedReason: omitted } : { toolDefinitions: JSON.parse(redacted) })
  };
}

function notifyProxyActivity(state: ProxyState, activity: AgentActivitySignal): void {
  try {
    state.options.onActivity?.(activity);
  } catch {
    // Activity accounting must never change proxy behavior.
  }
}

interface ActivityDeadline {
  touch(): void;
  clear(): void;
}

function createActivityDeadline(timeoutMs: number, onTimeout: () => void): ActivityDeadline {
  let timer: NodeJS.Timeout | undefined;
  const arm = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(onTimeout, timeoutMs);
    timer.unref();
  };
  arm();
  return {
    touch: arm,
    clear: () => {
      if (timer) clearTimeout(timer);
      timer = undefined;
    }
  };
}

async function notifyModelStream(
  state: ProxyState,
  event: GatewayModelStreamEvent
): Promise<void> {
  try {
    await state.options.onModelStreamEvent?.(event);
  } catch {
    // Performance telemetry must never alter the provider request lifecycle.
  }
}

function markProtocolFailure(
  state: ProxyState,
  failure: ProtocolProxyFailure,
  trace?: (
    kind: "status" | "error",
    message: string,
    data?: Record<string, unknown>
  ) => void,
  sequence = state.providerRequestSequence
): void {
  if ((state.failureSequence ?? 0) <= sequence) {
    state.failure = failure;
    state.failureSequence = sequence;
  }
  trace?.("error", "Protocol proxy rejected malformed tool arguments", {
    errorCode: failure.code,
    toolName: failure.toolName,
    toolIndex: failure.toolIndex,
    sourceProtocol: failure.sourceProtocol,
    targetProtocol: failure.targetProtocol,
    model: failure.model
  });
}

function markProviderFailure(
  state: ProxyState,
  sequence: number,
  model: string,
  error: unknown
): void {
  if ((state.providerFailure?.sequence ?? 0) > sequence) return;
  let detail = error instanceof Error ? error.message : String(error);
  for (const secret of [state.options.gatewayApiKey, state.token]) {
    if (secret) detail = detail.split(secret).join("[REDACTED]");
  }
  state.providerFailure = {
    sequence,
    failure: {
      code: "MODEL_PROVIDER_FAILED",
      message: `Gateway request failed: ${redactTrace(detail).slice(0, 1_000)}`,
      sourceProtocol: state.options.sourceProtocol,
      targetProtocol: state.options.targetProtocol,
      model
    }
  };
}

function latestProxyFailure(state: ProxyState): ProtocolProxyFailure | undefined {
  if (state.failure && (state.failureSequence ?? 0) > state.providerSuccessSequence &&
    (state.failureSequence ?? 0) >= (state.providerFailure?.sequence ?? 0)) return state.failure;
  if (
    state.providerFailure &&
    state.providerFailure.sequence > state.providerSuccessSequence
  ) {
    return state.providerFailure.failure;
  }
  return undefined;
}

function gatewayErrorMessage(state: ProxyState, sequence: number, model: string, status: number, body: unknown): string {
  const original = mapProtocolError(state.options.targetProtocol, status, body).message;
  const limit = (status === 400 || status === 413 || status === 200) ? contextLimitError(body) : undefined;
  if (!limit) {
    if ((state.providerFailure?.sequence ?? 0) <= sequence) state.providerFailure = {
      sequence,
      failure: { code: status === 401 || status === 403 ? "MODEL_AUTHENTICATION_FAILED"
        : status >= 400 && status < 500 && status !== 408 && status !== 429 ? "MODEL_REQUEST_INVALID"
        : "MODEL_PROVIDER_FAILED", httpStatus: status, message: original,
        sourceProtocol: state.options.sourceProtocol, targetProtocol: state.options.targetProtocol, model }
    };
    return original;
  }
  // Unlike malformed tool history, a context error must not quarantine later
  // requests: the CLI needs the same route to perform native compaction.
  if ((state.providerFailure?.sequence ?? 0) <= sequence) {
    state.providerFailure = {
      sequence,
      failure: {
        code: "MODEL_CONTEXT_LIMIT_EXCEEDED",
        message: original,
        ...limit,
        sourceProtocol: state.options.sourceProtocol,
        targetProtocol: state.options.targetProtocol,
        model
      }
    };
  }
  return `${nativeContextLimitMessage(limit)}. ${original}`;
}

/** Start a loopback bridge and return the URL to put in a harness config. */
export async function startProtocolProxy(options: ProtocolProxyOptions): Promise<ProtocolProxy> {
  if (options.sourceProtocol === options.targetProtocol && !options.force) {
    throw new Error("A protocol proxy is only needed for a protocol mismatch");
  }
  await (options.validateGatewayTarget ?? validateGatewayNetworkTarget)(options.gatewayUrl);
  const token = randomUUID().replaceAll("-", "");
  const timeoutMs = Math.max(1, Math.min(options.timeoutMs ?? 20 * 60_000, 60 * 60_000));
  let state!: ProxyState;
  const server = createServer((request, response) => {
    void handleProxyRequest(request, response, state);
  });
  state = {
    options,
    token,
    server,
    timeoutMs,
    requiredToolIssued: false,
    providerRequestSequence: 0,
    providerSuccessSequence: 0,
    usageReportStatus: new Map(),
    tracedToolDefinitionDigests: new Set()
  };
  await new Promise<void>((resolve, reject) => {
    const onError = (error: Error) => {
      server.off("listening", onListening);
      reject(error);
    };
    const onListening = () => {
      server.off("error", onError);
      resolve();
    };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(0, "127.0.0.1");
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    await closeHttpServer(server);
    throw new Error("protocol proxy did not receive a loopback address");
  }
  return {
    baseUrl: `http://127.0.0.1:${address.port}/v1`,
    token,
    close: () => closeHttpServer(server),
    getFailure: () => latestProxyFailure(state),
    resetFailure: () => {
      state.failure = undefined;
      state.failureSequence = undefined;
      state.providerFailure = undefined;
      state.providerSuccessSequence = state.providerRequestSequence;
    }
  };
}

const WEB_SEARCH_TOOL = {
  name: "web_search",
  description: "Search the public web and return cited sources.",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", minLength: 1, maxLength: 2_000 },
      maxResults: { type: "integer", minimum: 1, maximum: 10, default: 5 }
    },
    required: ["query"],
    additionalProperties: false
  }
} as const;

const WEB_FETCH_TOOL = {
  name: "web_fetch",
  description: "Fetch a public HTTPS page and return bounded readable text.",
  inputSchema: {
    type: "object",
    properties: {
      url: { type: "string", minLength: 1, maxLength: 8_192 },
      maxChars: { type: "integer", minimum: 1_000, maximum: 50_000, default: 20_000 }
    },
    required: ["url"],
    additionalProperties: false
  }
} as const;

async function handleWebMcpRequest(
  request: IncomingMessage,
  response: ServerResponse,
  state: ProxyState
): Promise<void> {
  if (state.options.webSearchEnabled !== true) {
    response.writeHead(404, { "content-type": "text/plain", "cache-control": "no-store" });
    response.end("Web Search is disabled for this invocation");
    return;
  }
  if (request.method !== "POST") {
    response.writeHead(405, { allow: "POST" });
    response.end("method not allowed");
    return;
  }
  if (!authorizedProxyRequest(request, state.options.sourceProtocol, state.token)) {
    writeJsonError(response, 401, "Web MCP credential is invalid", state.options.sourceProtocol);
    return;
  }
  const raw = await readBody(request, 256 * 1024).catch(() => undefined);
  if (raw === undefined) {
    writeJsonError(response, 400, "invalid Web MCP request", state.options.sourceProtocol);
    return;
  }
  let message: Record<string, unknown>;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    message = parsed as Record<string, unknown>;
  } catch {
    writeJsonError(response, 400, "invalid Web MCP JSON", state.options.sourceProtocol);
    return;
  }
  const id = message.id;
  const method = typeof message.method === "string" ? message.method : "";
  if (id === undefined || id === null) {
    response.writeHead(202);
    response.end();
    return;
  }
  const reply = (result: unknown): void => {
    response.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
    response.end(JSON.stringify({ jsonrpc: "2.0", id, result }));
  };
  if (method === "initialize") {
    reply({
      protocolVersion: "2025-06-18",
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: "openfars-web", version: "1" }
    });
    return;
  }
  if (method === "tools/list") {
    reply({ tools: [WEB_SEARCH_TOOL, WEB_FETCH_TOOL].map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema
    })) });
    return;
  }
  if (method !== "tools/call") {
    response.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
    response.end(JSON.stringify({
      jsonrpc: "2.0",
      id,
      error: { code: -32601, message: "Web MCP method is not available" }
    }));
    return;
  }
  const params = objectValue(message.params);
  const toolName = typeof params.name === "string" ? params.name : "";
  const args = objectValue(params.arguments);
  try {
    const result = toolName === WEB_SEARCH_TOOL.name
      ? await gatewayWebSearch(state, args)
      : toolName === WEB_FETCH_TOOL.name
        ? await publicWebFetch(args, state.options.invocationSignal)
        : (() => { throw new Error("Unknown Web MCP tool"); })();
    reply({
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      isError: false
    });
  } catch (error) {
    reply({
      content: [{
        type: "text",
        text: redactTrace(error instanceof Error ? error.message : "Web tool failed").slice(0, 2_000)
      }],
      isError: true
    });
  }
}

async function gatewayWebSearch(
  state: ProxyState,
  args: Record<string, unknown>
): Promise<{ query: string; content: string; sources: Array<{ url: string; title?: string }> }> {
  const query = typeof args.query === "string" ? args.query.trim() : "";
  if (!query || query.length > 2_000) throw new Error("web_search requires a query of at most 2000 characters");
  const requestedMax = typeof args.maxResults === "number" && Number.isInteger(args.maxResults)
    ? args.maxResults
    : 5;
  const maxResults = Math.max(1, Math.min(10, requestedMax));
  const model = state.options.webSearchModel?.trim();
  if (!model) throw new Error("Web Search has no invocation model");
  const controller = new AbortController();
  const abort = () => controller.abort();
  state.options.invocationSignal?.addEventListener("abort", abort, { once: true });
  const deadline = setTimeout(() => controller.abort(), Math.min(state.timeoutMs, 120_000));
  deadline.unref();
  let usageId = `usage_web_${randomUUID().replaceAll("-", "")}`;
  let responseReceived = false;
  try {
    const routed = nativeWebSearchRequest(
      state.options.targetProtocol,
      model,
      query,
      state.options.gatewayApiKey,
      state.options.gatewayReasoning
    );
    const upstream = await fetchWithRetry(
      joinEndpoint(state.options.gatewayUrl, routed.endpointSuffix),
      {
        method: "POST",
        headers: routed.headers,
        body: JSON.stringify(routed.body),
        redirect: "error",
        signal: controller.signal
      },
      controller.signal,
      async () => {
        await reportGatewayTokenUsage(
          state,
          usageId,
          model,
          undefined,
          undefined,
          { reason: "retry-abandoned", processingState: "indeterminate" }
        );
        usageId = `usage_web_${randomUUID().replaceAll("-", "")}`;
      }
    );
    responseReceived = true;
    const raw = await boundedResponseText(upstream, 4 * 1024 * 1024);
    if (!upstream.ok) {
      const body = safeJson(raw) ?? raw;
      throw mapProtocolError(state.options.targetProtocol, upstream.status, body);
    }
    const body = safeJson(raw);
    if (!body || typeof body !== "object") throw new Error("Web Search provider returned invalid JSON");
    const normalized = extractNormalizedResponse(body, state.options.targetProtocol, model);
    await reportGatewayTokenUsage(
      state,
      usageId,
      model,
      normalized.usage
    );
    const sources = collectWebSources(body).slice(0, maxResults);
    if (!normalized.text.trim() && sources.length === 0) {
      throw new Error("The selected Gateway/model returned no Web Search results");
    }
    notifyProxyActivity(state, {
      kind: "model",
      phase: "completed",
      source: "gateway"
    });
    return {
      query,
      content: normalized.text.trim().slice(0, 20_000),
      sources
    };
  } catch (error) {
    await reportGatewayTokenUsage(
      state,
      usageId,
      model,
      undefined,
      undefined,
      {
        reason: responseReceived
          ? "provider-error-response-missing-usage"
          : "transport-outcome-unknown",
        processingState: responseReceived ? "processed" : "indeterminate"
      }
    );
    throw error;
  } finally {
    clearTimeout(deadline);
    state.options.invocationSignal?.removeEventListener("abort", abort);
  }
}

export function nativeWebSearchRequest(
  protocol: AgentProtocol,
  model: string,
  query: string,
  apiKey: string,
  reasoning?: ResolvedGatewayReasoning
): RoutedRequest {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`
  };
  if (protocol === "responses") {
    return {
      protocol,
      endpointSuffix: "responses",
      headers,
      body: applyGatewayReasoning({
        model,
        input: `Search the web for the following query and return a concise cited summary:\n${query}`,
        tools: [{ type: "web_search" }],
        max_output_tokens: 4096,
        stream: false
      }, reasoning)
    };
  }
  if (protocol === "anthropic-messages") {
    headers["x-api-key"] = apiKey;
    headers["anthropic-version"] = "2023-06-01";
    return {
      protocol,
      endpointSuffix: "messages",
      headers,
      body: applyGatewayReasoning({
        model,
        max_tokens: 4096,
        messages: [{ role: "user", content: `Search the web for the following query and return a concise cited summary:\n${query}` }],
        tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 5 }]
      }, reasoning)
    };
  }
  return {
    protocol,
    endpointSuffix: "chat/completions",
    headers,
    body: applyGatewayReasoning({
      model,
      messages: [{ role: "user", content: `Search the web for the following query and return a concise cited summary:\n${query}` }],
      web_search_options: { search_context_size: "medium" },
      max_tokens: 4096,
      stream: false
    }, reasoning)
  };
}

function collectWebSources(value: unknown): Array<{ url: string; title?: string }> {
  const byUrl = new Map<string, { url: string; title?: string }>();
  const visit = (item: unknown): void => {
    if (Array.isArray(item)) {
      for (const child of item) visit(child);
      return;
    }
    if (!item || typeof item !== "object") return;
    const row = item as Record<string, unknown>;
    const citation = row.url_citation && typeof row.url_citation === "object"
      ? row.url_citation as Record<string, unknown>
      : row;
    const url = typeof citation.url === "string" ? citation.url : "";
    if (/^https?:\/\//i.test(url) && !byUrl.has(url)) {
      const title = typeof citation.title === "string" && citation.title.trim()
        ? citation.title.trim().slice(0, 500)
        : undefined;
      byUrl.set(url, { url, ...(title ? { title } : {}) });
    }
    for (const child of Object.values(row)) visit(child);
  };
  visit(value);
  return [...byUrl.values()];
}

async function publicWebFetch(
  args: Record<string, unknown>,
  invocationSignal?: AbortSignal
): Promise<{ url: string; contentType: string; text: string; truncated: boolean }> {
  const rawUrl = typeof args.url === "string" ? args.url.trim() : "";
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("web_fetch requires a valid HTTPS URL");
  }
  await validatePublicHttpsUrl(parsed);
  const requestedMax = typeof args.maxChars === "number" && Number.isInteger(args.maxChars)
    ? args.maxChars
    : 20_000;
  const maxChars = Math.max(1_000, Math.min(50_000, requestedMax));
  const { response, finalUrl } = await fetchPublicHttps(parsed, invocationSignal);
  if (!response.ok) throw new Error(`web_fetch received HTTP ${response.status}`);
  const contentType = (response.headers.get("content-type") ?? "application/octet-stream").split(";", 1)[0]!.trim();
  if (!/^(?:text\/|application\/(?:json|xml|xhtml\+xml)$)/i.test(contentType)) {
    throw new Error(`web_fetch does not return binary content (${contentType})`);
  }
  const source = await boundedResponseText(response, 1024 * 1024);
  const readable = /html|xhtml/i.test(contentType) ? htmlToReadableText(source) : source;
  return {
    url: finalUrl.toString(),
    contentType,
    text: readable.slice(0, maxChars),
    truncated: readable.length > maxChars
  };
}

async function fetchPublicHttps(
  initialUrl: URL,
  signal?: AbortSignal
): Promise<{ response: Response; finalUrl: URL }> {
  let current = initialUrl;
  for (let redirect = 0; redirect <= 5; redirect += 1) {
    const response = await fetch(current, {
      headers: { Accept: "text/html, text/plain, application/json, application/xml;q=0.9" },
      redirect: "manual",
      signal
    });
    if (response.status < 300 || response.status >= 400) {
      return { response, finalUrl: current };
    }
    const location = response.headers.get("location");
    if (!location) throw new Error(`web_fetch redirect ${response.status} has no Location header`);
    if (redirect === 5) throw new Error("web_fetch exceeded the redirect limit");
    current = new URL(location, current);
    await validatePublicHttpsUrl(current);
  }
  throw new Error("web_fetch exceeded the redirect limit");
}

async function validatePublicHttpsUrl(parsed: URL): Promise<void> {
  if (parsed.protocol !== "https:" || parsed.username || parsed.password || (parsed.port && parsed.port !== "443")) {
    throw new Error("web_fetch only permits credential-free HTTPS URLs on port 443");
  }
  const validationUrl = new URL(parsed);
  validationUrl.search = "";
  validationUrl.hash = "";
  await validatePublicWebNetworkTarget(validationUrl.toString());
}

function htmlToReadableText(value: string): string {
  return value
    .replace(/<(?:script|style|noscript)\b[^>]*>[\s\S]*?<\/(?:script|style|noscript)>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

async function boundedResponseText(response: Response, maxBytes: number): Promise<string> {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => undefined);
        throw new Error(`Web response exceeds the ${maxBytes}-byte limit`);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString("utf8");
}

async function handleProxyRequest(
  request: IncomingMessage,
  response: ServerResponse,
  state: ProxyState
): Promise<void> {
  const trace = (
    kind: "status" | "error",
    message: string,
    data?: Record<string, unknown>
  ): void => {
    try {
      const result = state.options.onTrace?.(kind, message, data);
      if (result && typeof (result as Promise<void>).catch === "function") {
        void (result as Promise<void>).catch(() => undefined);
      }
    } catch {
      // Tracing must never change proxy behavior.
    }
  };
  if (request.method === "GET" && request.url === "/health") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ status: "ok" }));
    return;
  }
  const requestPath = ((request.url ?? "").split("?", 1)[0] ?? "").replace(/\/+$/, "");
  if (requestPath.endsWith("/web-mcp")) {
    await handleWebMcpRequest(request, response, state);
    return;
  }
  const expectedSourceSuffix = state.options.sourceProtocol === "responses"
    ? "responses"
    : state.options.sourceProtocol === "chat-completions"
      ? "chat/completions"
      : "messages";
  // Codex refreshes model metadata before its first turn. Proxy this
  // read-only request too; a 405 fallback leaves the CLI with incomplete
  // metadata and can change its tool behavior.
  if (request.method === "GET" && requestPath.endsWith("/models")) {
    if (!authorizedProxyRequest(request, state.options.sourceProtocol, state.token)) {
      writeJsonError(response, 401, "protocol proxy credential is invalid", state.options.sourceProtocol);
      return;
    }
    const controller = new AbortController();
    const abort = () => controller.abort();
    const abortIfClientDisconnected = () => {
      if (!response.writableEnded) controller.abort();
    };
    request.once("aborted", abort);
    response.once("close", abortIfClientDisconnected);
    const deadline = createActivityDeadline(state.timeoutMs, () => controller.abort());
    const touchActivity = () => deadline.touch();
    try {
      const upstream = await fetchWithRetry(
        joinEndpoint(state.options.gatewayUrl, "models"),
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${state.options.gatewayApiKey}`
          },
          redirect: "error",
          signal: controller.signal
        },
        controller.signal
      );
      touchActivity();
      const rawBody = await upstream.text();
      touchActivity();
      const body = codexModelsResponse(rawBody, state.options.modelContextWindows);
      response.writeHead(upstream.status, {
        "content-type": upstream.headers.get("content-type") ?? "application/json"
      });
      response.end(body);
    } catch (error) {
      if (controller.signal.aborted && !response.headersSent) {
        writeJsonError(response, 504, "protocol proxy model request was cancelled or timed out", state.options.sourceProtocol);
      } else if (!response.headersSent) {
        writeJsonError(response, 502, error instanceof Error ? redactTrace(error.message) : "protocol proxy upstream failure", state.options.sourceProtocol);
      } else {
        response.destroy();
      }
    } finally {
      deadline.clear();
      request.off("aborted", abort);
      response.off("close", abortIfClientDisconnected);
    }
    return;
  }
  if (request.method !== "POST") {
    response.writeHead(405, { allow: "POST" });
    response.end("method not allowed");
    return;
  }
  if (!requestPath.endsWith(`/${expectedSourceSuffix}`)) {
    writeJsonError(response, 404, "protocol proxy endpoint is not available", state.options.sourceProtocol);
    return;
  }
  if (!authorizedProxyRequest(request, state.options.sourceProtocol, state.token)) {
    writeJsonError(response, 401, "protocol proxy credential is invalid", state.options.sourceProtocol);
    return;
  }
  const raw = await readBody(request, 8 * 1024 * 1024).catch((error) => {
    writeJsonError(response, 400, error instanceof Error ? redactTrace(error.message) : "invalid request body", state.options.sourceProtocol);
    return undefined;
  });
  if (raw === undefined) return;
  let sourceBody: Record<string, unknown>;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("request body must be an object");
    sourceBody = parsed as Record<string, unknown>;
  } catch (error) {
    writeJsonError(response, 400, error instanceof Error ? redactTrace(error.message) : "invalid JSON body", state.options.sourceProtocol);
    return;
  }
  const requestModel = typeof sourceBody.model === "string" ? sourceBody.model : "";
  if (!requestModel) {
    writeJsonError(response, 400, "model is required", state.options.sourceProtocol);
    return;
  }
  const providerRequestSequence = ++state.providerRequestSequence;
  let usageId = `usage_${randomUUID().replaceAll("-", "")}`;
  const normalized = normalizeIncomingRequest(sourceBody, state.options.sourceProtocol);
  const injected = state.options.getContextInjectionBudget?.();
  const historicalFeedback = historicalToolArgumentFeedback(normalized.messages);
  normalized.messages = historicalFeedback.messages;
  if (historicalFeedback.count) trace("status", "Protocol proxy preserved historical tool argument feedback for Agent correction", {
    count: historicalFeedback.count, automaticRecovery: true, sourceProtocol: state.options.sourceProtocol,
    targetProtocol: state.options.targetProtocol, model: requestModel
  });
  const invalidHistory = firstInvalidToolCall(normalized.messages, {
    sourceProtocol: state.options.sourceProtocol,
    targetProtocol: state.options.targetProtocol,
    model: requestModel
  });
  if (invalidHistory) {
    markProtocolFailure(state, invalidHistory, trace, providerRequestSequence);
    writeProtocolFailureResponse(
      response,
      state.options.sourceProtocol,
      requestModel,
      sourceBody.stream === true,
      invalidHistory.message
    );
    return;
  }
  // Native retries retain their route. Ambiguous call identities are rejected
  // above; ordinary parsing feedback does not block a subsequent model turn.
  if (state.failure && (state.failureSequence ?? 0) > state.providerSuccessSequence) {
    trace("status", "Protocol proxy is retrying valid input after a rejected tool response", {
      errorCode: state.failure.code, sourceProtocol: state.options.sourceProtocol,
      targetProtocol: state.options.targetProtocol, model: requestModel, automaticRecovery: true
    });
  }
  const configuredRequiredToolName = resolveRequiredToolName(
    state.options.requiredToolName,
    normalized.tools ?? []
  );
  const validateProviderTools = (toolCalls: Array<{ name: string; arguments: string }>) =>
    firstInvalidNormalizedToolCall(toolCalls, {
      sourceProtocol: state.options.sourceProtocol,
      targetProtocol: state.options.targetProtocol,
      model: requestModel,
      sourceTools: normalized.tools,
      onNativeError: (failure) => trace("status", "Tool argument error delivered to the native Harness for Agent correction", {
        diagnostic: true, diagnosticKind: "proxy.tool.arguments", errorCode: failure.code,
        toolName: failure.toolName, toolIndex: failure.toolIndex, protocolMessage: failure.message,
        sourceProtocol: failure.sourceProtocol, targetProtocol: failure.targetProtocol, nativeCorrection: true
      })
    });
  // A probe sentinel is a one-shot protocol check, not a workflow policy.
  // Native Harness tool_choice remains part of `normalized` and is converted
  // transparently on every request.
  const requiredToolName = state.requiredToolIssued
    ? undefined
    : configuredRequiredToolName;
  const routedTools = normalized.tools;
  const routed = routeProtocolRequest(
    {
      ...normalized,
      model: state.options.upstreamModel ?? normalized.model,
      ...(routedTools ? { tools: routedTools } : {}),
      ...(requiredToolName ? { requiredToolName } : {}),
      ...(state.options.gatewayReasoning
        ? { gatewayReasoning: state.options.gatewayReasoning }
        : {})
    },
    state.options.targetProtocol,
    state.options.gatewayApiKey
  );
  let bufferedDelivery =
    (state.options.deliveryMode === "buffered-json" || state.bufferedDelivery === true) && normalized.stream === true;
  let bufferedAnthropic = bufferedDelivery &&
    state.options.sourceProtocol === "anthropic-messages";
  let bufferedChat = bufferedDelivery &&
    state.options.sourceProtocol === "chat-completions";
  let bufferedResponses = bufferedDelivery &&
    state.options.sourceProtocol === "responses";
  const upstreamBody = bufferedDelivery
    ? withoutStreamingUsageOptions(routed.body)
    : routed.body;
  const definitionTokens = injected ? injectionTokenEstimate(JSON.stringify(upstreamBody.tools ?? [])) : 0;
  if (injected && injected.estimatedTokens + definitionTokens > injected.limitTokens) {
    const failure: ProtocolProxyFailure = { code: "CONTEXT_INJECTION_LIMIT_EXCEEDED", httpStatus: 400,
      requestedTokens: injected.estimatedTokens + definitionTokens, limitTokens: injected.limitTokens,
      message: "System context injection plus actual tool definitions exceeds half of this model's context window. Reduce optional injected context or the selected tool definitions; do not resend the same oversized input.",
      sourceProtocol: state.options.sourceProtocol, targetProtocol: state.options.targetProtocol, model: requestModel };
    markProtocolFailure(state, failure, trace, providerRequestSequence);
    writeProtocolFailureResponse(response, state.options.sourceProtocol, requestModel, sourceBody.stream === true, failure.message);
    return;
  }
  const expectedSentinelToolName = requiredToolName;
  const wantsStream = normalized.stream === true;
  const rotateProviderUsageId = async (retryReason: string): Promise<void> => {
    const abandonedUsageId = usageId;
    await reportGatewayTokenUsage(
      state,
      abandonedUsageId,
      requestModel,
      undefined,
      trace,
      { reason: "retry-abandoned", processingState: "indeterminate" }
    );
    usageId = `usage_${randomUUID().replaceAll("-", "")}`;
    trace("status", "Protocol proxy started a distinct provider retry", {
      previousUsageId: abandonedUsageId,
      usageId,
      retryReason,
      model: requestModel
    });
    await notifyModelStream(state, {
      phase: "started",
      requestId: usageId,
      timestamp: new Date().toISOString(),
      streaming: wantsStream && !bufferedDelivery,
      deliveryMode: bufferedDelivery ? "buffered-json" : "native-stream"
    });
  };
  trace("status", "Protocol proxy forwarded request", {
    requestId: usageId,
    sourceProtocol: state.options.sourceProtocol,
    targetProtocol: state.options.targetProtocol,
    model: requestModel,
    ...(state.options.upstreamModel ? { upstreamModel: state.options.upstreamModel } : {}),
    stream: normalized.stream === true,
    toolCount: routedTools?.length ?? 0,
    ...(injected ? { contextInjection: { ...injected, toolDefinitionTokens: definitionTokens,
      totalEstimatedTokens: injected.estimatedTokens + definitionTokens } } : {}),
    ...outgoingToolDiagnostics(state, upstreamBody.tools, (routedTools ?? []).map(tool => tool.name)),
    ...(requiredToolName ? { requiredToolName } : {}),
    deliveryMode: bufferedDelivery ? "buffered-json" : "native-stream",
    ...(state.options.gatewayReasoning ? {
      reasoningParameter: state.options.gatewayReasoning.parameter,
      reasoningValue: state.options.gatewayReasoning.value,
      reasoningOptionId: state.options.gatewayReasoning.optionId,
      reasoningFingerprint: state.options.gatewayReasoning.fingerprint
    } : { reasoningMode: "provider-default" })
  });
  const controller = new AbortController();
  const abortForInvocation = () => controller.abort();
  if (state.options.invocationSignal?.aborted) controller.abort();
  else state.options.invocationSignal?.addEventListener(
    "abort",
    abortForInvocation,
    { once: true }
  );
  const requestStartedAt = Date.now();
  let clientDisconnected = false;
  let timedOut = false;
  let receivedProviderFrame = false;
  let lastProviderActivityAt: number | undefined;
  let lastSubstantiveActivityAt: number | undefined;
  let modelRequestCompleted = false;
  const abort = () => {
    clientDisconnected = true;
    trace("status", "Protocol proxy client request aborted", {
      sourceProtocol: state.options.sourceProtocol,
      targetProtocol: state.options.targetProtocol,
      model: requestModel
    });
    controller.abort();
  };
  const abortIfClientDisconnected = () => {
    if (!response.writableEnded) {
      clientDisconnected = true;
      trace("status", "Protocol proxy client response closed", {
        sourceProtocol: state.options.sourceProtocol,
        targetProtocol: state.options.targetProtocol,
        model: requestModel
      });
      controller.abort();
    }
  };
  request.once("aborted", abort);
  response.once("close", abortIfClientDisconnected);
  const deadline = createActivityDeadline(state.timeoutMs, () => {
    timedOut = true;
    controller.abort();
  });
  const touchActivity = () => {
    lastProviderActivityAt = Date.now();
    deadline.touch();
  };
  const diagnosticData = (
    diagnosticKind: string,
    failureCode: string,
    abortSource: "proxy-timeout" | "client" | "invocation" | "provider" | "none"
  ): Record<string, unknown> => ({
    diagnosticKind,
    failureCode,
    requestId: usageId,
    sourceProtocol: state.options.sourceProtocol,
    targetProtocol: state.options.targetProtocol,
    model: requestModel,
    abortSource,
    timedOut,
    ...(timedOut ? { deadlineType: "provider-transport-idle", timeoutMs: state.timeoutMs } : {}),
    elapsedMs: Math.max(0, Date.now() - requestStartedAt),
    receivedProviderFrame,
    ...(lastProviderActivityAt
      ? { lastProviderActivityAt: new Date(lastProviderActivityAt).toISOString() }
      : {}),
    ...(lastSubstantiveActivityAt
      ? { lastSubstantiveActivityAt: new Date(lastSubstantiveActivityAt).toISOString() }
      : {}),
    activitySource: lastSubstantiveActivityAt ? "gateway" : undefined,
    providerCompleted: modelRequestCompleted
  });
  let bufferedAnthropicMessageId: string | undefined;
  let bufferedChatCompletionId: string | undefined;
  let bufferedProtocolHeartbeat: NodeJS.Timeout | undefined;
  let providerRequestSent = false;
  let receivedProviderResponse = false;
  let providerReturnedError = false;
  let usageManagedByBufferedCache = false;
  let completedEstimatedOutputTokens = 0;
  // Some native clients expect their stream to begin promptly even when the
  // route capability requires an atomic JSON response. Flush a
  // valid message prelude and lightweight SSE comments immediately, then
  // append the buffered answer once the gateway responds.  This keeps the
  // client connection alive without exposing provider/tool data early.
  if (wantsStream && bufferedAnthropic) {
    bufferedAnthropicMessageId = `msg_${randomUUID().replaceAll("-", "")}`;
    response.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      connection: "keep-alive"
    });
    response.write(formatStreamFrame("anthropic-messages", {
      type: "message_start",
      message: {
        id: bufferedAnthropicMessageId,
        type: "message",
        role: "assistant",
        model: requestModel,
        content: [],
        stop_reason: null,
        stop_sequence: null,
        usage: {}
      }
    }));
    // The buffered answer appends to this text block and closes it once.
    response.write(formatStreamFrame("anthropic-messages", {
      type: "content_block_start",
      index: 0,
      content_block: { type: "text", text: "" }
    }));
    response.write(formatStreamFrame("anthropic-messages", { type: "ping" }));
    trace("status", "Protocol proxy flushed buffered Anthropic prelude", {
      sourceProtocol: state.options.sourceProtocol,
      targetProtocol: state.options.targetProtocol,
      model: requestModel
    });
    bufferedProtocolHeartbeat = setInterval(() => {
      if (!response.writableEnded && !response.destroyed && !controller.signal.aborted) {
        response.write(formatStreamFrame("anthropic-messages", { type: "ping" }));
      }
    }, 250);
  } else if (wantsStream && bufferedChat) {
    bufferedChatCompletionId = `chatcmpl_${randomUUID().replaceAll("-", "")}`;
    response.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      connection: "keep-alive"
    });
    response.write(formatStreamFrame("chat-completions", {
      id: bufferedChatCompletionId,
      object: "chat.completion.chunk",
      model: requestModel,
      choices: [{ index: 0, delta: { role: "assistant" }, finish_reason: null }]
    }));
    response.write(": ping\n\n");
    trace("status", "Protocol proxy flushed buffered Chat prelude", {
      sourceProtocol: state.options.sourceProtocol,
      targetProtocol: state.options.targetProtocol,
      model: requestModel
    });
    bufferedProtocolHeartbeat = setInterval(() => {
      if (!response.writableEnded && !response.destroyed && !controller.signal.aborted) {
        response.write(": ping\n\n");
      }
    }, 250);
  }
  await notifyModelStream(state, {
    phase: "started",
    requestId: usageId,
    timestamp: new Date().toISOString(),
    streaming: wantsStream && !bufferedDelivery,
    deliveryMode: bufferedDelivery ? "buffered-json" : "native-stream"
  });
  try {
    if (bufferedAnthropic && state.options.bufferedResponseCache) {
      // Keep the pending provider response within this invocation so a native
      // recovery process can receive it without repeating completed work.
      const semanticKey = "undelivered-agent-response";
      usageManagedByBufferedCache = true;
      const cached = await cachedBufferedProtocolResponse(
        state,
        routed,
        upstreamBody,
        usageId,
        requestModel,
        semanticKey
      );
      usageId = cached.usageId;
      receivedProviderResponse = true;
      lastProviderActivityAt = Date.now();
      receivedProviderFrame = safeJson(cached.bodyText) !== undefined;
      trace("status", "Protocol proxy received buffered upstream response", {
        sourceProtocol: state.options.sourceProtocol,
        targetProtocol: state.options.targetProtocol,
        model: requestModel,
        status: cached.status,
        contentType: cached.contentType
      });
      const body = safeJson(cached.bodyText);
      if (!cached.ok || protocolErrorDetail(body)) {
        const errorBody = body ?? {
          error: { message: cached.bodyText.slice(0, 4_000) || "provider request failed" }
        };
        const message = gatewayErrorMessage(state, providerRequestSequence, requestModel, cached.status, errorBody);
        evictBufferedProtocolResponse(state, routed, upstreamBody, semanticKey);
        if (!clientDisconnected) writeAnthropicStreamError(response, message);
        return;
      }
      if (body === undefined) {
        throw new ProtocolRouteError("upstream returned invalid JSON", "provider");
      }
      const normalizedResponse = extractNormalizedResponse(
        body,
        state.options.targetProtocol,
        requestModel
      );
      completedEstimatedOutputTokens = estimatedNormalizedOutputTokens(normalizedResponse);
      const invalidResponse = validateProviderTools(normalizedResponse.toolCalls);
      if (invalidResponse) {
        evictBufferedProtocolResponse(state, routed, upstreamBody, semanticKey);
        markProtocolFailure(state, invalidResponse, trace, providerRequestSequence);
        if (!clientDisconnected) {
          writeProtocolFailureResponse(
            response,
            state.options.sourceProtocol,
            requestModel,
            true,
            invalidResponse.message
          );
        }
        return;
      }
      const returnedToolNames = normalizedResponse.toolCalls.map((call) => call.name);
      const sentinelToolSatisfied = responseIncludesTool(
        expectedSentinelToolName,
        returnedToolNames
      );
      if (semanticKey && expectedSentinelToolName &&
        !sentinelToolSatisfied && returnedToolNames.length === 0) {
        // A probe that omits its sentinel must not poison the response cache.
        evictBufferedProtocolResponse(
          state,
          routed,
          upstreamBody,
          semanticKey
        );
        trace("status", "Protocol proxy discarded a buffered probe response that omitted its sentinel tool", {
          sourceProtocol: state.options.sourceProtocol,
          targetProtocol: state.options.targetProtocol,
          model: requestModel,
          requiredToolName: expectedSentinelToolName
        });
      }
      await streamBufferedAnthropicResponse(
        body,
        response,
        state.options.targetProtocol,
        requestModel,
        controller.signal,
        bufferedAnthropicMessageId,
        (message, data) => trace("status", message, data)
      );
      modelRequestCompleted = !controller.signal.aborted;
      if (!controller.signal.aborted) {
        // Retain only responses whose client disappeared before delivery.
        // Successful delivery advances the serial model/tool state, so the
        // next request must allocate a new response stage. In particular,
        // this prevents a completed append action from being replayed.
        evictBufferedProtocolResponse(
          state,
          routed,
          upstreamBody,
          semanticKey
        );
        trace("status", "Protocol proxy released the delivered Agent response", {
          sourceProtocol: state.options.sourceProtocol,
          targetProtocol: state.options.targetProtocol,
          model: requestModel,
          returnedToolNames
        });
      }
      if (expectedSentinelToolName && !sentinelToolSatisfied &&
        returnedToolNames.length > 0 && !controller.signal.aborted) {
        trace("status", "Protocol proxy kept the probe sentinel pending after another tool response", {
          sourceProtocol: state.options.sourceProtocol,
          targetProtocol: state.options.targetProtocol,
          model: requestModel,
          returnedToolNames,
          requiredToolName: expectedSentinelToolName
        });
      }
      if (
        expectedSentinelToolName &&
        sentinelToolSatisfied &&
        !controller.signal.aborted
      ) {
        state.requiredToolIssued = true;
      }
      return;
    }
    let returnedToolNames: string[] = [];
    let completedProviderResponse = false;
    providerRequestSent = true;
    const fetchUpstream = (body: Record<string, unknown>, signal: AbortSignal) => fetchWithRetry(
      joinEndpoint(state.options.gatewayUrl, routed.endpointSuffix),
      {
        method: "POST",
        headers: routed.headers,
        body: JSON.stringify(body),
        redirect: "error",
        signal
      },
      signal,
      rotateProviderUsageId,
      state.options.modelFetch
    );
    const prepared = wantsStream && !bufferedDelivery
      ? await recoverInitialProviderStream(state, fetchUpstream, upstreamBody, controller.signal,
          requestStartedAt, rotateProviderUsageId, () => {
            if (response.writableEnded || response.destroyed) return;
            if (!response.headersSent) response.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache" });
            response.write(": waiting for provider output\n\n");
          }, (message, data) => trace("status", message, data))
      : { response: await fetchUpstream(upstreamBody, controller.signal), buffered: bufferedDelivery };
    const upstream = prepared.response;
    bufferedDelivery = prepared.buffered;
    bufferedAnthropic = bufferedDelivery && state.options.sourceProtocol === "anthropic-messages";
    bufferedChat = bufferedDelivery && state.options.sourceProtocol === "chat-completions";
    bufferedResponses = bufferedDelivery && state.options.sourceProtocol === "responses";
    receivedProviderResponse = true;
    touchActivity();
    trace("status", "Protocol proxy received upstream response", {
      sourceProtocol: state.options.sourceProtocol,
      targetProtocol: state.options.targetProtocol,
      model: requestModel,
      status: upstream.status,
      contentType: upstream.headers.get("content-type") ?? ""
    });
    if (!upstream.ok) {
      providerReturnedError = true;
      const text = (await upstream.text()).slice(0, 4_000);
      touchActivity();
      receivedProviderFrame = Boolean(text);
      const body = safeJson(text) ?? { error: { message: text || "provider request failed" } };
      const mapped = { message: gatewayErrorMessage(state, providerRequestSequence, requestModel, upstream.status, body) };
      trace("error", "Protocol proxy received a provider HTTP error", {
        ...diagnosticData("proxy.provider.http_error", "MODEL_PROVIDER_HTTP_ERROR", "provider"),
        httpStatus: upstream.status,
        providerErrorCode: state.providerFailure?.failure.code,
        ...(contextLimitError(body) ?? {})
      });
      if (bufferedAnthropicMessageId) {
        writeAnthropicStreamError(response, mapped.message);
      } else if (bufferedChatCompletionId) {
        writeChatStreamError(response, bufferedChatCompletionId, requestModel, mapped.message);
      } else if (bufferedResponses) {
        writeProtocolFailureResponse(
          response,
          state.options.sourceProtocol,
          requestModel,
          true,
          mapped.message
        );
      } else {
        writeJsonError(response, upstream.status, mapped.message, state.options.sourceProtocol, wantsStream);
      }
      return;
    }
    if (wantsStream) {
      if (bufferedAnthropic) {
        const bufferedBody = await upstream.json() as unknown;
        touchActivity();
        receivedProviderFrame = true;
        if (protocolErrorDetail(bufferedBody)) {
          providerReturnedError = true;
          writeAnthropicStreamError(response, gatewayErrorMessage(state, providerRequestSequence, requestModel, 200, bufferedBody));
          return;
        }
        const normalizedResponse = extractNormalizedResponse(
          bufferedBody,
          state.options.targetProtocol,
          requestModel
        );
        completedEstimatedOutputTokens = estimatedNormalizedOutputTokens(normalizedResponse);
        const invalidResponse = validateProviderTools(normalizedResponse.toolCalls);
        if (invalidResponse) {
          markProtocolFailure(state, invalidResponse, trace, providerRequestSequence);
          writeProtocolFailureResponse(
            response,
            state.options.sourceProtocol,
            requestModel,
            true,
            invalidResponse.message
          );
          return;
        }
        returnedToolNames = normalizedResponse.toolCalls.map((call) => call.name);
        await reportGatewayTokenUsage(
          state,
          usageId,
          requestModel,
          normalizedResponse.usage,
          trace
        );
        await streamBufferedAnthropicResponse(
          bufferedBody,
          response,
          state.options.targetProtocol,
          requestModel,
          controller.signal,
          bufferedAnthropicMessageId,
          (message, data) => trace("status", message, data)
        );
        completedProviderResponse = !controller.signal.aborted;
      } else if (bufferedChat) {
        const bufferedBody = await upstream.json() as unknown;
        touchActivity();
        receivedProviderFrame = true;
        if (protocolErrorDetail(bufferedBody)) {
          providerReturnedError = true;
          writeChatStreamError(response, bufferedChatCompletionId!, requestModel,
            gatewayErrorMessage(state, providerRequestSequence, requestModel, 200, bufferedBody));
          return;
        }
        const normalizedResponse = extractNormalizedResponse(
          bufferedBody,
          state.options.targetProtocol,
          requestModel
        );
        completedEstimatedOutputTokens = estimatedNormalizedOutputTokens(normalizedResponse);
        const invalidResponse = validateProviderTools(normalizedResponse.toolCalls);
        if (invalidResponse) {
          markProtocolFailure(state, invalidResponse, trace, providerRequestSequence);
          writeProtocolFailureResponse(
            response,
            state.options.sourceProtocol,
            requestModel,
            true,
            invalidResponse.message
          );
          return;
        }
        returnedToolNames = normalizedResponse.toolCalls.map((call) => call.name);
        await reportGatewayTokenUsage(
          state,
          usageId,
          requestModel,
          normalizedResponse.usage,
          trace
        );
        await streamBufferedChatResponse(
          bufferedBody,
          response,
          state.options.targetProtocol,
          requestModel,
          controller.signal,
          bufferedChatCompletionId,
          (message, data) => trace("status", message, data)
        );
        completedProviderResponse = !controller.signal.aborted;
      } else if (bufferedResponses) {
        const bufferedBody = await upstream.json() as unknown;
        touchActivity();
        receivedProviderFrame = true;
        if (protocolErrorDetail(bufferedBody)) {
          providerReturnedError = true;
          writeProtocolFailureResponse(response, state.options.sourceProtocol, requestModel, true,
            gatewayErrorMessage(state, providerRequestSequence, requestModel, 200, bufferedBody));
          return;
        }
        const normalizedResponse = extractNormalizedResponse(
          bufferedBody,
          state.options.targetProtocol,
          requestModel
        );
        completedEstimatedOutputTokens = estimatedNormalizedOutputTokens(normalizedResponse);
        const invalidResponse = validateProviderTools(normalizedResponse.toolCalls);
        if (invalidResponse) {
          markProtocolFailure(state, invalidResponse, trace, providerRequestSequence);
          writeProtocolFailureResponse(
            response,
            state.options.sourceProtocol,
            requestModel,
            true,
            invalidResponse.message
          );
          return;
        }
        returnedToolNames = normalizedResponse.toolCalls.map((call) => call.name);
        await reportGatewayTokenUsage(
          state,
          usageId,
          requestModel,
          normalizedResponse.usage,
          trace
        );
        await streamBufferedResponsesResponse(
          bufferedBody,
          response,
          state.options.targetProtocol,
          requestModel,
          controller.signal,
          normalized.tools,
          (message, data) => trace("status", message, data)
        );
        completedProviderResponse = !controller.signal.aborted;
      } else {
        const streamResult = await streamProxyResponse(
          upstream,
          response,
          state.options.targetProtocol,
          state.options.sourceProtocol,
          requestModel,
          controller.signal,
          (message, data) => trace("status", message, data),
          (usage) => reportGatewayTokenUsage(
            state,
            usageId,
            requestModel,
            usage,
            trace
          ),
          () => {
            receivedProviderFrame = true;
            touchActivity();
          },
          normalized.tools,
          (failure) => markProtocolFailure(state, failure, trace, providerRequestSequence),
          async (kind, text) => {
            lastSubstantiveActivityAt = Date.now();
            notifyProxyActivity(state, {
              kind: "model",
              phase: "delta",
              source: "gateway",
              deltaKind: kind
            });
            await notifyModelStream(state, {
              phase: "delta",
              requestId: usageId,
              timestamp: new Date().toISOString(),
              streaming: true,
              deliveryMode: "native-stream",
              deltaKind: kind,
              text
            });
            // A proxy-visible terminal client may issue auxiliary model calls
            // (for example title/compaction requests) through the same local
            // route. Workflow turns advertise tools; auxiliary calls do not.
            // Keep this capability/content based and independent of Harness,
            // provider, or model identity.
            if (kind === "visible-text" && (normalized.tools?.length ?? 0) > 0) {
              try {
                await state.options.onVisibleAssistantDelta?.(text);
              } catch {
                // The native client remains authoritative if the display tap closes.
              }
            }
          },
          Math.min(15_000, Math.max(100, Math.floor(state.timeoutMs / 4))),
          (body) => {
            const message = gatewayErrorMessage(state, providerRequestSequence, requestModel, 200, body);
            const safeMessage = redactTrace(message
              .replaceAll(state.options.gatewayApiKey, "[REDACTED]")
              .replaceAll(state.token, "[REDACTED]")).slice(0, 1_000);
            trace("error", "Protocol proxy received a provider stream error", {
              ...diagnosticData("proxy.provider.stream_error", "MODEL_PROVIDER_STREAM_ERROR", "provider"),
              error: safeMessage
            });
            return message;
          },
          (text, itemId) => (normalized.tools?.length ?? 0) > 0
            ? state.options.onVisibleReasoningSummaryDelta?.(text, `${usageId}:${itemId}`)
            : undefined
        );
        returnedToolNames = streamResult.toolNames;
        completedProviderResponse = streamResult.completed;
      }
    } else {
      const body = await upstream.json() as unknown;
      touchActivity();
      receivedProviderFrame = true;
      const providerError = protocolErrorDetail(body);
      if (providerError) {
        providerReturnedError = true;
        const message = gatewayErrorMessage(state, providerRequestSequence, requestModel, 200, body);
        writeJsonError(response, contextLimitError(body) ? 400 : 502, message, state.options.sourceProtocol, wantsStream);
        return;
      }
      const normalizedResponse = extractNormalizedResponse(
        body,
        state.options.targetProtocol,
        requestModel
      );
      completedEstimatedOutputTokens = estimatedNormalizedOutputTokens(normalizedResponse);
      const invalidResponse = validateProviderTools(normalizedResponse.toolCalls);
      if (invalidResponse) {
        markProtocolFailure(state, invalidResponse, trace, providerRequestSequence);
        writeProtocolFailureResponse(
          response,
          state.options.sourceProtocol,
          requestModel,
          false,
          invalidResponse.message
        );
        return;
      }
      returnedToolNames = normalizedResponse.toolCalls.map((call) => call.name);
      await reportGatewayTokenUsage(
        state,
        usageId,
        requestModel,
        normalizedResponse.usage,
        trace
      );
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify(convertProtocolResponse(
        body,
        state.options.targetProtocol,
        state.options.sourceProtocol,
        requestModel,
        normalized.tools
      )));
      completedProviderResponse = true;
    }
    modelRequestCompleted ||= completedProviderResponse;
    if (
      expectedSentinelToolName &&
      completedProviderResponse &&
      !controller.signal.aborted
    ) {
      if (responseIncludesTool(expectedSentinelToolName, returnedToolNames)) {
        state.requiredToolIssued = true;
      } else {
        trace("status", returnedToolNames.length
          ? "Protocol proxy kept the probe sentinel pending after another tool response"
          : "Protocol proxy kept the probe sentinel pending after a response without it", {
          sourceProtocol: state.options.sourceProtocol,
          targetProtocol: state.options.targetProtocol,
          model: requestModel,
          returnedToolNames,
          requiredToolName: expectedSentinelToolName
        });
      }
    }
  } catch (error) {
    if (state.options.invocationSignal?.aborted) {
      trace("status", "Protocol proxy request cancelled with its invocation", {
        ...diagnosticData("proxy.request.cancelled", "INVOCATION_CANCELLED", "invocation"),
        error: error instanceof Error ? redactTrace(error.message).slice(0, 500) : "invocation cancelled"
      });
      if (!response.writableEnded && !response.destroyed) response.end();
      return;
    }
    const cancelledAfterClientDisconnect =
      clientDisconnected && controller.signal.aborted && !timedOut;
    trace(
      cancelledAfterClientDisconnect ? "status" : "error",
      cancelledAfterClientDisconnect
        ? "Protocol proxy upstream request cancelled after client disconnected"
        : "Protocol proxy upstream request failed",
      {
        ...diagnosticData(
          cancelledAfterClientDisconnect
            ? "proxy.client.disconnected"
            : timedOut
              ? "proxy.upstream.timeout"
              : "proxy.upstream.failed",
          cancelledAfterClientDisconnect
            ? "CLIENT_DISCONNECTED"
            : timedOut
              ? "PROVIDER_TRANSPORT_IDLE_TIMEOUT"
              : "MODEL_PROVIDER_FAILED",
          cancelledAfterClientDisconnect ? "client" : timedOut ? "proxy-timeout" : "provider"
        ),
        error: error instanceof Error ? redactTrace(error.message).slice(0, 500) : "unknown proxy error"
      }
    );
    if (cancelledAfterClientDisconnect) {
      return;
    }
    markProviderFailure(state, providerRequestSequence, requestModel, error);
    if ((bufferedAnthropicMessageId || bufferedChatCompletionId) && !controller.signal.aborted && response.headersSent) {
      const message = error instanceof Error
        ? redactTrace(error.message)
        : "protocol proxy upstream failure";
      if (bufferedAnthropicMessageId) writeAnthropicStreamError(response, message);
      else writeChatStreamError(response, bufferedChatCompletionId!, requestModel, message);
    } else if (wantsStream && (!controller.signal.aborted || timedOut)) {
      writeProtocolFailureResponse(
        response,
        state.options.sourceProtocol,
        requestModel,
        true,
        error instanceof Error ? redactTrace(error.message) : "protocol proxy upstream failure"
      );
    } else if (controller.signal.aborted && !response.headersSent) {
      writeJsonError(response, 504, "protocol proxy request was cancelled or timed out", state.options.sourceProtocol);
    } else if (!response.headersSent) {
      writeJsonError(response, 502, error instanceof Error ? redactTrace(error.message) : "protocol proxy upstream failure", state.options.sourceProtocol);
    } else {
      response.destroy();
    }
  } finally {
    if (providerRequestSent && !usageManagedByBufferedCache) {
      const streamIncomplete = wantsStream && !modelRequestCompleted;
      const unknownSettlement = !receivedProviderResponse
        ? {
            reason: "transport-outcome-unknown" as const,
            processingState: "indeterminate" as const
          }
        : providerReturnedError
          ? {
              reason: "provider-error-response-missing-usage" as const,
              processingState: "processed" as const
            }
          : streamIncomplete
            ? {
                reason: "stream-interrupted" as const,
                processingState: "indeterminate" as const
              }
            : {
                reason: "provider-response-missing-usage" as const,
                processingState: "processed" as const
              };
      await reportGatewayTokenUsage(
        state,
        usageId,
        requestModel,
        undefined,
        trace,
        unknownSettlement
      );
    }
    if (modelRequestCompleted) {
      lastSubstantiveActivityAt = Date.now();
      notifyProxyActivity(state, {
        kind: "model",
        phase: "completed",
        source: "gateway"
      });
      state.providerSuccessSequence = Math.max(
        state.providerSuccessSequence,
        providerRequestSequence
      );
      await notifyModelStream(state, {
        phase: "completed",
        requestId: usageId,
        timestamp: new Date().toISOString(),
        streaming: wantsStream && !bufferedDelivery,
        deliveryMode: bufferedDelivery ? "buffered-json" : "native-stream",
        ...(completedEstimatedOutputTokens > 0
          ? { estimatedOutputTokens: completedEstimatedOutputTokens }
          : {})
      });
    }
    if (bufferedProtocolHeartbeat) clearInterval(bufferedProtocolHeartbeat);
    deadline.clear();
    request.off("aborted", abort);
    response.off("close", abortIfClientDisconnected);
    state.options.invocationSignal?.removeEventListener(
      "abort",
      abortForInvocation
    );
  }
}

/**
 * Codex's model manager consumes its own `{ models: [...] }` catalog rather
 * than the OpenAI inference API's `{ object: "list", data: [...] }` shape.
 * Most compatible gateways expose only the latter. Preserve native catalog
 * fields while applying the saved model window, and enrich ordinary OpenAI
 * model rows without guessing a larger minimum window.
 */
export function codexModelsResponse(rawBody: string, modelContextWindows?: Record<string, number>): string {
  const parsed = safeJson(rawBody);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return rawBody;
  const record = parsed as Record<string, unknown>;
  if (Array.isArray(record.models)) {
    // Native Codex catalogs can carry more fields than the bridge knows about.
    // Change only saved models' context metadata and preserve the rest verbatim.
    if (!modelContextWindows || Object.keys(modelContextWindows).length === 0) return rawBody;
    return JSON.stringify({
      ...record,
      models: record.models.map((item) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) return item;
        const model = item as Record<string, unknown>;
        const slug = typeof model.slug === "string" ? model.slug : "";
        if (!Object.hasOwn(modelContextWindows, slug)) return item;
        const contextWindow = configuredModelContextWindow(modelContextWindows[slug]);
        return {
          ...model,
          context_window: contextWindow,
          max_context_window: contextWindow,
          auto_compact_token_limit: modelAutoCompactTokenLimit(contextWindow)
        };
      })
    });
  }
  if (!Array.isArray(record.data)) return rawBody;
  const instructionTemplate = "You are Codex, a coding agent.";
  const models = record.data.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const source = item as Record<string, unknown>;
    const slug = typeof source.id === "string" ? source.id : "";
    if (!slug) return [];
    const contextWindow = modelContextWindows && Object.hasOwn(modelContextWindows, slug)
      ? configuredModelContextWindow(modelContextWindows[slug])
      : configuredModelContextWindow(source.max_model_len);
    return [{
      slug,
      display_name: slug,
      description: typeof source.owned_by === "string" ? `Provider model (${source.owned_by})` : null,
      default_reasoning_level: null,
      supported_reasoning_levels: [],
      shell_type: "unified_exec",
      visibility: "list",
      supported_in_api: true,
      priority: 0,
      additional_speed_tiers: [],
      service_tiers: [],
      default_service_tier: null,
      available_access_programs: null,
      availability_nux: null,
      upgrade: null,
      model_messages: { instructions_template: instructionTemplate },
      include_skills_usage_instructions: false,
      include_plugin_usage_instructions: false,
      include_apps_usage_instructions: false,
      supports_reasoning_summary_parameter: false,
      default_reasoning_summary: "auto",
      support_verbosity: false,
      default_verbosity: null,
      apply_patch_tool_type: null,
      web_search_tool_type: "text",
      truncation_policy: { mode: "bytes", limit: 10_000 },
      supports_image_detail_original: false,
      context_window: contextWindow,
      max_context_window: contextWindow,
      auto_compact_token_limit: modelAutoCompactTokenLimit(contextWindow),
      comp_hash: null,
      effective_context_window_percent: 95,
      experimental_supported_tools: [],
      input_modalities: ["text"],
      supports_search_tool: false,
      supports_experimental_context: false,
      use_responses_lite: false,
      node_repl_auto_review_required: false,
      node_repl_disabled: true,
      auto_review_model_override: null,
      model_specialty: null,
      tool_mode: null,
      multi_agent_version: null,
      multi_agent_reasoning_effort: null,
      // Older Codex clients require this legacy field even when the nested
      // model_messages template is present.
      base_instructions: instructionTemplate
    }];
  });
  return JSON.stringify({ models });
}

function authorizedProxyRequest(request: IncomingMessage, protocol: AgentProtocol, token: string): boolean {
  const expected = Buffer.from(token, "utf8");
  const supplied = protocol === "anthropic-messages"
    ? [
        String(request.headers["x-api-key"] ?? ""),
        String(request.headers.authorization ?? "").replace(/^Bearer\s+/i, "")
      ]
    : [String(request.headers.authorization ?? "").replace(/^Bearer\s+/i, "")];
  return supplied.some((value) => {
    const actual = Buffer.from(value, "utf8");
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  });
}

export function normalizeIncomingRequest(body: Record<string, unknown>, protocol: AgentProtocol): ProtocolRequest {
  const model = typeof body.model === "string" ? body.model : "";
  const stream = body.stream === true;
  const maxOutputTokens = protocol === "chat-completions"
    ? numberValue(body.max_completion_tokens) ?? numberValue(body.max_tokens)
    : numberValue(body.max_output_tokens) ?? numberValue(body.max_tokens);
  const temperature = numberValue(body.temperature);
  if (protocol === "responses") {
    const messages: NormalizedMessage[] = [];
    const loadedTools: unknown[] = [];
    const instructions = contentText(body.instructions);
    if (instructions) messages.push({ role: "developer", content: instructions });
    const input = body.input;
    if (typeof input === "string") messages.push({ role: "user", content: input });
    else if (Array.isArray(input)) {
      for (const item of input) {
        if (typeof item === "string") messages.push({ role: "user", content: item });
        else if (item && typeof item === "object") {
          const record = item as Record<string, unknown>;
          if (record.type === "function_call") {
            const sourceName = typeof record.name === "string" ? record.name : "tool";
            const sourceNamespace = typeof record.namespace === "string" && record.namespace.trim()
              ? record.namespace.trim()
              : undefined;
            const portableName = sourceNamespace
              ? `${sourceNamespace}__${sourceName}`
              : sourceName;
            messages.push({
              role: "assistant",
              content: "",
              toolCalls: [{
                id: typeof record.call_id === "string" ? record.call_id : `call_${randomUUID()}`,
                name: portableName,
                arguments: normalizeToolArguments(
                  typeof record.arguments === "string" ? record.arguments : JSON.stringify(record.arguments ?? {}),
                  portableName
                )
              }]
            });
            continue;
          }
          if (record.type === "function_call_output") {
            messages.push({
              role: "tool",
              toolCallId: typeof record.call_id === "string" ? record.call_id : undefined,
              content: contentText(record.output)
            });
            continue;
          }
          if (record.type === "tool_search_call" && record.execution === "client") {
            messages.push({
              role: "assistant",
              content: "",
              toolCalls: [{
                id: typeof record.call_id === "string" ? record.call_id : `call_${randomUUID()}`,
                name: "tool_search",
                arguments: JSON.stringify(record.arguments ?? {})
              }]
            });
            continue;
          }
          if (record.type === "tool_search_output" && record.execution === "client") {
            if (Array.isArray(record.tools)) loadedTools.push(...record.tools);
            messages.push({
              role: "tool",
              toolCallId: typeof record.call_id === "string" ? record.call_id : undefined,
              content: JSON.stringify({ tools: record.tools ?? [] })
            });
            continue;
          }
          const role = normalizedRole(record.role);
          const parts = responseContentParts(record.content);
          messages.push({
            role,
            content: parts.text,
            ...(parts.toolCalls.length ? { toolCalls: parts.toolCalls } : {})
          });
        }
      }
    }
    return {
      model,
      messages,
      // Codex sends loaded MCP declarations in client tool-search history,
      // rather than repeating them in the top-level tools list.
      tools: [...new Map([
        ...responseTools(body.tools),
        ...responseTools(loadedTools)
      ].map((tool) => [tool.name, tool])).values()],
      requiredToolName: requiredToolName(body.tool_choice, protocol),
      ...(body.tool_choice === "required" ? { requireTool: true } : {}),
      stream,
      maxOutputTokens,
      temperature
    };
  }
  if (protocol === "chat-completions") {
    const messages = Array.isArray(body.messages) ? body.messages.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const record = item as Record<string, unknown>;
      const toolCalls = Array.isArray(record.tool_calls) ? record.tool_calls.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const call = item as Record<string, unknown>;
        const fn = call.function && typeof call.function === "object" ? call.function as Record<string, unknown> : {};
        return [{
          id: typeof call.id === "string" ? call.id : `call_${randomUUID()}`,
          name: typeof fn.name === "string" ? fn.name : "tool",
          arguments: normalizeToolArguments(
            typeof fn.arguments === "string" ? fn.arguments : JSON.stringify(fn.arguments ?? {}),
            typeof fn.name === "string" ? fn.name : undefined
          )
        }];
      }) : undefined;
      return [{
        role: normalizedRole(record.role),
        content: contentText(record.content),
        ...(typeof record.name === "string" ? { name: record.name } : {}),
        ...(typeof record.tool_call_id === "string" ? { toolCallId: record.tool_call_id } : {}),
        ...(toolCalls?.length ? { toolCalls } : {})
      } satisfies NormalizedMessage];
    }) : [];
    return {
      model,
      messages,
      tools: chatTools(body.tools),
      requiredToolName: requiredToolName(body.tool_choice, protocol),
      ...(body.tool_choice === "required" ? { requireTool: true } : {}),
      stream,
      maxOutputTokens,
      ...(numberValue(body.max_completion_tokens) !== undefined
        ? { chatMaxOutputField: "max_completion_tokens" as const }
        : {}),
      temperature
    };
  }
  const messages: NormalizedMessage[] = [];
  const system = contentText(body.system);
  if (system) messages.push({ role: "system", content: system });
  if (Array.isArray(body.messages)) {
    for (const item of body.messages) {
      if (!item || typeof item !== "object") continue;
      const record = item as Record<string, unknown>;
      const parts = anthropicContentParts(record.content);
      if (parts.toolResults.length) {
        for (const result of parts.toolResults) messages.push({ role: "tool", toolCallId: result.id, content: result.content });
      }
      if (parts.text || parts.toolCalls.length || !parts.toolResults.length) {
        messages.push({
          role: record.role === "assistant" ? "assistant" : "user",
          content: parts.text,
          ...(parts.toolCalls.length ? { toolCalls: parts.toolCalls } : {})
        });
      }
    }
  }
  return {
    model,
    messages,
    tools: anthropicTools(body.tools),
    requiredToolName: requiredToolName(body.tool_choice, protocol),
    ...(body.tool_choice && typeof body.tool_choice === "object" &&
      (body.tool_choice as Record<string, unknown>).type === "any" ? { requireTool: true } : {}),
    stream,
    maxOutputTokens,
    temperature
  };
}

function requiredToolName(value: unknown, protocol: AgentProtocol): string | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  if (protocol === "chat-completions") {
    const fn = record.function && typeof record.function === "object"
      ? record.function as Record<string, unknown>
      : undefined;
    return typeof fn?.name === "string" && fn.name.trim() ? fn.name.trim() : undefined;
  }
  return typeof record.name === "string" && record.name.trim()
    ? record.name.trim()
    : undefined;
}

function resolveRequiredToolName(
  requested: string | undefined,
  tools: ProtocolTool[]
): string | undefined {
  if (!requested || tools.length === 0) return undefined;
  const exact = tools.find((tool) => tool.name === requested);
  if (exact) return exact.name;
  const suffix = `__${requested}`;
  return tools.find((tool) => tool.name.endsWith(suffix))?.name;
}

function responseIncludesTool(
  requiredToolName: string | undefined,
  returnedToolNames: string[]
): boolean {
  if (!requiredToolName) return true;
  return returnedToolNames.some((returned) =>
    returned === requiredToolName ||
    returned.endsWith(`__${requiredToolName}`) ||
    requiredToolName.endsWith(`__${returned}`)
  );
}

function responseTools(value: unknown): ProtocolTool[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;
    if (record.type === "tool_search" && record.execution === "client") {
      return [{
        name: "tool_search",
        description: typeof record.description === "string" ? record.description : undefined,
        inputSchema: objectValue(record.parameters),
        sourceType: "tool_search" as const
      }];
    }
    if (record.type === "function" && typeof record.name === "string") return [{ name: record.name, description: typeof record.description === "string" ? record.description : undefined, inputSchema: objectValue(record.parameters), ...(typeof record.strict === "boolean" ? { strict: record.strict } : {}) }];
    // Some Responses-compatible gateways wrap the function declaration one
    // level deeper (the same shape used by Chat Completions).
    if (record.type === "function" && record.function && typeof record.function === "object") {
      const fn = record.function as Record<string, unknown>;
      if (typeof fn.name === "string") return [{ name: fn.name, description: typeof fn.description === "string" ? fn.description : undefined, inputSchema: objectValue(fn.parameters), ...(typeof fn.strict === "boolean" ? { strict: fn.strict } : {}) }];
    }
    // Current Codex Responses clients group MCP tools in a namespace instead
    // of advertising every MCP tool as a top-level function. Chat Completions
    // and Anthropic have no namespace shape, so flatten each nested tool for
    // the portable request while retaining the exact identity needed to
    // reconstruct a Responses function_call on the return path.
    if (
      record.type === "namespace" &&
      typeof record.name === "string" &&
      record.name.trim() &&
      Array.isArray(record.tools)
    ) {
      const namespace = record.name.trim();
      return record.tools.flatMap((item) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) return [];
        const tool = item as Record<string, unknown>;
        if (tool.type !== "function" || typeof tool.name !== "string" || !tool.name.trim()) return [];
        return [{
          name: `${namespace}__${tool.name.trim()}`,
          description: typeof tool.description === "string" ? tool.description : undefined,
          inputSchema: objectValue(tool.parameters),
          ...(typeof tool.strict === "boolean" ? { strict: tool.strict } : {}),
          sourceNamespace: namespace,
          sourceName: tool.name.trim()
        }];
      });
    }
    return [];
  });
}

function responsesFunctionCallIdentity(
  portableName: string,
  sourceTools: ProtocolTool[] | undefined
): { name: string; namespace?: string } {
  const sourceTool = sourceTools?.find((tool) => tool.name === portableName);
  if (sourceTool?.sourceNamespace && sourceTool.sourceName) {
    return {
      name: sourceTool.sourceName,
      namespace: sourceTool.sourceNamespace
    };
  }
  return { name: portableName };
}

function isClientToolSearch(name: string, sourceTools: ProtocolTool[] | undefined): boolean {
  return name === "tool_search" && sourceTools?.some((tool) =>
    tool.name === name && tool.sourceType === "tool_search"
  ) === true;
}

function clientToolSearchItem(callId: string, argumentsValue: string, itemId?: string): Record<string, unknown> {
  return {
    ...(itemId ? { id: itemId } : {}),
    type: "tool_search_call",
    execution: "client",
    call_id: callId,
    status: "completed",
    arguments: safeJson(argumentsValue) ?? {}
  };
}

function chatTools(value: unknown): ProtocolTool[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const functionValue = item && typeof item === "object" ? (item as Record<string, unknown>).function : undefined;
    if (!functionValue || typeof functionValue !== "object") return [];
    const record = functionValue as Record<string, unknown>;
    return typeof record.name === "string" ? [{ name: record.name, description: typeof record.description === "string" ? record.description : undefined, inputSchema: objectValue(record.parameters), ...(typeof record.strict === "boolean" ? { strict: record.strict } : {}) }] : [];
  });
}

function anthropicTools(value: unknown): ProtocolTool[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const record = item as Record<string, unknown>;
    return typeof record.name === "string" ? [{ name: record.name, description: typeof record.description === "string" ? record.description : undefined, inputSchema: objectValue(record.input_schema) }] : [];
  });
}

function normalizedRole(value: unknown): NormalizedRole {
  return value === "system" || value === "developer" || value === "assistant" || value === "tool"
    ? value
    : "user";
}

function anthropicContentParts(value: unknown): {
  text: string;
  toolCalls: NormalizedToolCall[];
  toolResults: Array<{ id: string; content: string }>;
} {
  if (typeof value === "string") return { text: value, toolCalls: [], toolResults: [] };
  const text: string[] = [];
  const toolCalls: NormalizedToolCall[] = [];
  const toolResults: Array<{ id: string; content: string }> = [];
  for (const item of Array.isArray(value) ? value : []) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    if (record.type === "text" && typeof record.text === "string") text.push(record.text);
    if (record.type === "tool_use") {
      toolCalls.push({
        id: typeof record.id === "string" ? record.id : `call_${randomUUID()}`,
        name: typeof record.name === "string" ? record.name : "tool",
        arguments: JSON.stringify(record.input ?? {})
      });
    }
    if (record.type === "tool_result") {
      toolResults.push({
        id: typeof record.tool_use_id === "string" ? record.tool_use_id : `tool_${randomUUID()}`,
        content: contentText(record.content)
      });
    }
  }
  return { text: text.join("\n"), toolCalls, toolResults };
}

/** Responses `message.content` uses input_text/output_text blocks rather than
 * the Anthropic `text` block name.  Normalize both forms and retain any
 * function/tool blocks a compatible gateway embeds in a message item. */
function responseContentParts(value: unknown): {
  text: string;
  toolCalls: NormalizedToolCall[];
} {
  if (typeof value === "string") return { text: value, toolCalls: [] };
  const text: string[] = [];
  const toolCalls: NormalizedToolCall[] = [];
  for (const item of Array.isArray(value) ? value : []) {
    if (typeof item === "string") {
      text.push(item);
      continue;
    }
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    if (["text", "input_text", "output_text"].includes(String(record.type)) && typeof record.text === "string") {
      text.push(record.text);
    }
    if (record.type === "function_call" || record.type === "tool_use") {
      toolCalls.push({
        id: typeof record.call_id === "string" ? record.call_id : typeof record.id === "string" ? record.id : `call_${randomUUID()}`,
        name: typeof record.name === "string" ? record.name : "tool",
        arguments: normalizeToolArguments(
          typeof record.arguments === "string" ? record.arguments : JSON.stringify(record.input ?? {}),
          typeof record.name === "string" ? record.name : undefined
        )
      });
    }
  }
  return { text: text.join("\n"), toolCalls };
}

function contentText(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map((item) => {
    if (typeof item === "string") return item;
    if (item && typeof item === "object") {
      const record = item as Record<string, unknown>;
      if (typeof record.text === "string") return record.text;
      if (typeof record.content === "string") return record.content;
      if (record.content !== undefined) return contentText(record.content);
    }
    return "";
  }).filter(Boolean).join("\n");
  if (value == null) return "";
  if (typeof value === "object") {
    try { return JSON.stringify(value); } catch { return ""; }
  }
  return String(value);
}

/**
 * Some compatible endpoints put a legacy XML tool template in the
 * function-call arguments field instead of JSON. Harnesses consume the
 * protocol's JSON contract, so
 * normalize that template at the bridge boundary.  Ordinary JSON is returned
 * unchanged (apart from whitespace normalization); unknown text is preserved
 * so the caller can surface a useful provider error rather than silently
 * inventing arguments.
 */
export function normalizeToolArguments(raw: string, fallbackName?: string): string {
  const text = raw.trim();
  if (!text) return "{}";
  try {
    const parsed = JSON.parse(text) as unknown;
    if (parsed && typeof parsed === "object") return JSON.stringify(parsed);
  } catch {
    // Try the legacy XML form below.
  }
  if (!/<(?:tool_call|function(?:=|>))/i.test(text)) return raw;
  const functionMatch = text.match(/<function\s*=\s*([^>\s]+)\s*>/i);
  const functionName = functionMatch?.[1]?.trim() || fallbackName;
  const result: Record<string, unknown> = {};
  const parameterPattern = /<parameter\s*=\s*([^>\s]+)\s*>([\s\S]*?)<\/parameter\s*>/gi;
  let parameter: RegExpExecArray | null;
  while ((parameter = parameterPattern.exec(text))) {
    const key = parameter[1]?.trim();
    if (!key) continue;
    const value = parameter[2]?.trim() ?? "";
    try {
      result[key] = JSON.parse(value);
    } catch {
      result[key] = value;
    }
  }
  // A few templates use `<function=name>{...}</function>` without parameter
  // tags. Preserve that object when present.
  if (!Object.keys(result).length && functionMatch) {
    const tail = text.slice((functionMatch.index ?? 0) + functionMatch[0].length);
    const objectMatch = tail.match(/(\{[\s\S]*?\})/);
    if (objectMatch) {
      try {
        const parsed = JSON.parse(objectMatch[1]!) as unknown;
        if (parsed && typeof parsed === "object") return JSON.stringify(parsed);
      } catch {
        // Fall through to an empty object rather than emitting XML.
      }
    }
  }
  // The function name is carried by the surrounding protocol field; only the
  // parameter object belongs in `arguments`.
  void functionName;
  return JSON.stringify(result);
}

function isLegacyToolMarkup(value: string): boolean {
  return /<\s*(?:tool_call|function(?:=|>))/i.test(value);
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : { type: "object", properties: {} };
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function joinEndpoint(base: string, suffix: string): string {
  return `${base.replace(/\/+$/, "")}/${suffix}`;
}

function withoutStreamingUsageOptions(
  body: Record<string, unknown>
): Record<string, unknown> {
  const { stream_options: _streamOptions, ...rest } = body;
  return { ...rest, stream: false };
}

/** Hold transport-only frames until real model output or an explicit terminal event. */
async function initialProviderStream(response: Response, protocol: AgentProtocol, signal: AbortSignal): Promise<Response> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Provider stream has no response body");
  const chunks: Uint8Array[] = [];
  const decoder = new TextDecoder();
  let buffer = "";
  let bytes = 0;
  let rejectAbort!: (reason: unknown) => void;
  const aborted = new Promise<never>((_resolve, reject) => { rejectAbort = reject; });
  const abort = () => rejectAbort(signal.reason ?? new Error("Provider stream cancelled"));
  signal.addEventListener("abort", abort, { once: true });
  try {
    signal.throwIfAborted();
    while (true) {
      const next = await Promise.race([reader.read(), aborted]);
      if (next.value) { chunks.push(next.value); bytes += next.value.byteLength; }
      if (bytes > 8 * 1024 * 1024) throw new Error("Provider stream exceeded 8 MiB before its first model event");
      buffer += decoder.decode(next.value ?? new Uint8Array(), { stream: !next.done });
      const events = splitSseEvents(next.done && buffer.trim() ? `${buffer}\n\n` : buffer);
      buffer = events.rest;
      const ready = events.events.some(event => {
        const parsed = event.data.trim() === "[DONE]" ? "[DONE]" : safeJson(event.data);
        return parsed !== undefined && normalizeProtocolStreamEvents(protocol, parsed).some(value =>
          value.type === "completed" || value.type === "error" || value.type === "tool_call_delta" ||
          (value.type === "text_delta" || value.type === "reasoning_delta") && Boolean(value.text));
      });
      if (ready) {
        return new Response(new ReadableStream<Uint8Array>({
          start(controller) { for (const chunk of chunks) controller.enqueue(chunk); chunks.length = 0; },
          async pull(controller) {
            try {
              const chunk = await reader.read();
              if (chunk.done) { reader.releaseLock(); controller.close(); }
              else controller.enqueue(chunk.value);
            } catch (error) { reader.releaseLock(); controller.error(error); }
          },
          async cancel(reason) { try { await reader.cancel(reason); } finally { reader.releaseLock(); } }
        }), { status: response.status, headers: response.headers });
      }
      if (next.done) throw new Error("Provider stream ended before model output or a terminal event");
    }
  } catch (error) {
    await reader.cancel(error).catch(() => undefined);
    reader.releaseLock();
    throw error;
  } finally {
    signal.removeEventListener("abort", abort);
  }
}

/** Reserve two thirds of the request budget for one recovery, without replaying model output. */
async function recoverInitialProviderStream(
  state: ProxyState,
  fetchUpstream: (body: Record<string, unknown>, signal: AbortSignal) => Promise<Response>,
  body: Record<string, unknown>,
  signal: AbortSignal,
  startedAt: number,
  beforeRetry: (reason: string) => Promise<void>,
  pending: () => void,
  trace: (message: string, data: Record<string, unknown>) => void
): Promise<{ response: Response; buffered: boolean }> {
  const first = new AbortController();
  const firstOutputMs = Math.max(1, Math.floor(state.timeoutMs / 3));
  const firstTimer = setTimeout(() => first.abort(new Error("Provider stream first-output deadline exceeded")), firstOutputMs);
  const heartbeat = setInterval(pending, Math.min(15_000, Math.max(100, Math.floor(firstOutputMs / 2))));
  heartbeat.unref();
  let streamError: unknown;
  const budgetDeadline = startedAt + Math.floor(state.timeoutMs * 0.95);
  try {
    const attemptSignal = AbortSignal.any([signal, first.signal]);
    const response = await fetchUpstream(body, attemptSignal);
    if (!response.ok) return { response, buffered: false };
    if ((response.headers.get("content-type") ?? "").includes("application/json")) {
      state.bufferedDelivery = true;
      return { response, buffered: true };
    }
    return { response: await initialProviderStream(response, state.options.targetProtocol, attemptSignal), buffered: false };
  } catch (error) {
    signal.throwIfAborted();
    streamError = error;
  } finally {
    clearTimeout(firstTimer);
    clearInterval(heartbeat);
  }
  state.bufferedDelivery = true;
  const remainingMs = Math.max(0, budgetDeadline - Date.now());
  if (!remainingMs) throw streamError;
  trace("Provider stream failed before output; recovering once with a buffered response", {
    diagnostic: true, diagnosticKind: "proxy.transport.recovery", deliveryMode: "buffered-json",
    firstOutputMs, remainingMs, totalBudgetMs: state.timeoutMs,
    streamError: redactTrace(streamError instanceof Error ? streamError.message : String(streamError))
  });
  await beforeRetry("stream-before-output");
  const recovery = new AbortController();
  const recoveryTimer = setTimeout(() => recovery.abort(new Error("Buffered recovery exhausted the shared request budget")),
    Math.max(1, budgetDeadline - Date.now()));
  const recoveryHeartbeat = setInterval(pending, Math.min(15_000, Math.max(100, Math.floor(remainingMs / 4))));
  recoveryHeartbeat.unref();
  try {
    const response = await fetchUpstream(withoutStreamingUsageOptions(body), AbortSignal.any([signal, recovery.signal]));
    const text = await response.text();
    return { response: new Response(text || null, { status: response.status, headers: response.headers }), buffered: true };
  } catch (error) {
    signal.throwIfAborted();
    throw new Error(`Stream failed before output: ${redactTrace(streamError instanceof Error ? streamError.message : String(streamError))}; buffered recovery failed: ${redactTrace(error instanceof Error ? error.message : String(error))}`, { cause: error });
  } finally {
    clearTimeout(recoveryTimer);
    clearInterval(recoveryHeartbeat);
  }
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  signal: AbortSignal,
  beforeRetry?: (reason: string) => Promise<void> | void,
  transport: GatewayModelFetch = fetch
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await transport(url, init);
      if (attempt === 0 && isRetryableGatewayStatus(response.status) && !signal.aborted) {
        // Do not leave a failed response body attached while the second
        // request is in flight (important for keep-alive gateway sockets).
        await response.body?.cancel().catch(() => {});
        await beforeRetry?.(`http-${response.status}`);
        await retryDelay(signal);
        continue;
      }
      if ((response.status === 400 || response.status === 422) && !signal.aborted) {
        const fallbackBody = specifiedToolChoiceFallback(url, init.body);
        if (fallbackBody && requiredToolChoiceRejected(response.status, await response.clone().text())) {
          await response.body?.cancel().catch(() => {});
          await beforeRetry?.("required-tool-choice-fallback");
          return fetchWithRetry(url, { ...init, body: fallbackBody }, signal, beforeRetry, transport);
        }
      }
      return response;
    } catch (error) {
      lastError = error;
      if (signal.aborted || attempt === 1) throw error;
      await beforeRetry?.("transport-error");
      await retryDelay(signal, error);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("upstream request failed");
}

async function cachedBufferedProtocolResponse(
  state: ProxyState,
  routed: RoutedRequest,
  body: Record<string, unknown>,
  usageId: string,
  model: string,
  semanticKey?: string
): Promise<BufferedProtocolResponse> {
  const cache = state.options.bufferedResponseCache;
  if (!cache) throw new Error("buffered response cache is unavailable");
  const serializedBody = JSON.stringify(body);
  // The cache is already scoped to one invocation/gateway. Hash only the
  // endpoint and normalized provider body, deliberately excluding headers so
  // an API credential can never become cache data or diagnostic metadata.
  // Native recovery may change the session prelude while awaiting the same
  // invocation-local response. Other requests use an exact body key.
  const key = bufferedProtocolResponseKey(routed, body, semanticKey);
  const existing = cache.get(key);
  if (existing) return existing;

  let providerUsageId = usageId;

  const controller = new AbortController();
  const abortForInvocation = () => controller.abort();
  if (state.options.invocationSignal?.aborted) controller.abort();
  else state.options.invocationSignal?.addEventListener(
    "abort",
    abortForInvocation,
    { once: true }
  );
  const deadline = createActivityDeadline(state.timeoutMs, () => controller.abort());
  const touchActivity = () => deadline.touch();
  const created = fetchWithRetry(
    joinEndpoint(state.options.gatewayUrl, routed.endpointSuffix),
    {
      method: "POST",
      headers: routed.headers,
      body: serializedBody,
      redirect: "error",
      signal: controller.signal
    },
    controller.signal,
    async () => {
      await reportGatewayTokenUsage(
        state,
        providerUsageId,
        model,
        undefined,
        undefined,
        { reason: "retry-abandoned", processingState: "indeterminate" }
      );
      providerUsageId = `usage_${randomUUID().replaceAll("-", "")}`;
    },
    state.options.modelFetch
  ).then(async (response) => {
    touchActivity();
    const bodyText = await response.text();
    touchActivity();
    const buffered = {
      status: response.status,
      ok: response.ok,
      contentType: response.headers.get("content-type") ?? "",
      bodyText,
      usageId: providerUsageId
    };
    const parsed = buffered.ok ? safeJson(buffered.bodyText) : undefined;
    const rawUsage = parsed === undefined
      ? undefined
      : extractNormalizedResponse(
          parsed,
          state.options.targetProtocol,
          model
        ).usage;
    await reportGatewayTokenUsage(
      state,
      providerUsageId,
      model,
      rawUsage,
      undefined,
      {
        reason: buffered.ok
          ? "provider-response-missing-usage"
          : "provider-error-response-missing-usage",
        processingState: "processed"
      }
    );
    return buffered;
  }).catch(async (error) => {
    await reportGatewayTokenUsage(
      state,
      providerUsageId,
      model,
      undefined,
      undefined,
      { reason: "transport-outcome-unknown", processingState: "indeterminate" }
    );
    throw error;
  }).finally(() => {
    deadline.clear();
    state.options.invocationSignal?.removeEventListener(
      "abort",
      abortForInvocation
    );
  });
  cache.set(key, created);
  // A transport failure is retryable by the next native process. HTTP
  // responses remain cached because fetchWithRetry has already exhausted the
  // bounded gateway retry policy.
  void created.catch(() => {
    if (cache.get(key) === created) cache.delete(key);
  });
  return created;
}

function evictBufferedProtocolResponse(
  state: ProxyState,
  routed: RoutedRequest,
  body: Record<string, unknown>,
  semanticKey: string
): void {
  state.options.bufferedResponseCache?.delete(
    bufferedProtocolResponseKey(routed, body, semanticKey)
  );
}

function bufferedProtocolResponseKey(
  routed: RoutedRequest,
  body: Record<string, unknown>,
  semanticKey?: string
): string {
  const cacheMaterial = semanticKey
    ? `semantic\n${routed.endpointSuffix}\n${String(body.model ?? "")}\n${semanticKey}`
    : `exact\n${routed.endpointSuffix}\n${JSON.stringify(body)}`;
  return createHash("sha256").update(cacheMaterial).digest("hex");
}

function isRetryableGatewayStatus(status: number): boolean {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

function retryDelay(signal: AbortSignal, reason: unknown = new Error("upstream request failed")): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(reason);
      return;
    }
    const onAbort = () => { clearTimeout(timer); reject(reason); };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, 100);
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

/** Re-emit one buffered Chat response as a valid Anthropic SSE lifecycle. */
async function streamBufferedAnthropicResponse(
  value: unknown,
  response: ServerResponse,
  target: AgentProtocol,
  model: string,
  signal: AbortSignal,
  prestartedMessageId?: string,
  trace?: (message: string, data?: Record<string, unknown>) => void
): Promise<void> {
  if (signal.aborted) {
    if (!response.writableEnded && !response.destroyed) response.end();
    return;
  }
  const providerError = protocolErrorDetail(value);
  if (providerError) throw new ProtocolRouteError(`上游网关返回错误：${providerError}`, "gateway");
  const normalized = extractNormalizedResponse(value, target, model);
  if (!response.headersSent) {
    response.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      connection: "keep-alive"
    });
  }
  const messageId = prestartedMessageId ?? `msg_${randomUUID().replaceAll("-", "")}`;
  const write = (items: Record<string, unknown>[]) => {
    for (const item of items) {
      if (!response.writableEnded && !response.destroyed) {
        response.write(formatStreamFrame("anthropic-messages", item));
      }
    }
  };
  if (!prestartedMessageId) {
    write([{
      type: "message_start",
      message: {
        id: messageId,
        type: "message",
        role: "assistant",
        model,
        content: [],
        stop_reason: null,
        stop_sequence: null,
        usage: normalized.usage ?? {}
      }
    }]);
  }
  let blockIndex = 0;
  if (prestartedMessageId) {
    if (normalized.text) {
      write([{ type: "content_block_delta", index: blockIndex, delta: { type: "text_delta", text: normalized.text } }]);
    }
    write([{ type: "content_block_stop", index: blockIndex }]);
    blockIndex += 1;
  } else if (normalized.text) {
    write([
      { type: "content_block_start", index: blockIndex, content_block: { type: "text", text: "" } },
      { type: "content_block_delta", index: blockIndex, delta: { type: "text_delta", text: normalized.text } },
      { type: "content_block_stop", index: blockIndex }
    ]);
    blockIndex += 1;
  }
  for (const call of normalized.toolCalls) {
    if (signal.aborted) {
      if (!response.writableEnded && !response.destroyed) response.end();
      return;
    }
    const argumentsValue = normalizeToolArguments(call.arguments, call.name);
    write([
      {
        type: "content_block_start",
        index: blockIndex,
        content_block: { type: "tool_use", id: call.id, name: call.name, input: {} }
      },
      {
        type: "content_block_delta",
        index: blockIndex,
        delta: { type: "input_json_delta", partial_json: argumentsValue }
      },
      { type: "content_block_stop", index: blockIndex }
    ]);
    blockIndex += 1;
  }
  write([
    {
      type: "message_delta",
      delta: {
        stop_reason: mapStopReason(
          normalized.toolCalls.length ? "tool_use" : normalized.stopReason,
          "anthropic-messages"
        ),
        stop_sequence: null
      },
      ...(normalized.usage ? { usage: usageForProtocol(normalized.usage, target, "anthropic-messages") } : {})
    },
    { type: "message_stop" }
  ]);
  response.end();
  trace?.("Protocol proxy emitted buffered Anthropic response", {
    model,
    textCharacters: normalized.text.length,
    toolCount: normalized.toolCalls.length,
    buffered: true
  });
}

/** Re-emit one complete Chat response as conservative Chat SSE. Holding
 * tool arguments until the JSON body is complete lets normalizeToolArguments
 * repair provider-specific legacy markup before a harness sees any fragment. */
async function streamBufferedChatResponse(
  value: unknown,
  response: ServerResponse,
  target: AgentProtocol,
  model: string,
  signal: AbortSignal,
  streamId = `chatcmpl_${randomUUID().replaceAll("-", "")}`,
  trace?: (message: string, data?: Record<string, unknown>) => void
): Promise<void> {
  if (signal.aborted) {
    if (!response.writableEnded && !response.destroyed) response.end();
    return;
  }
  const providerError = protocolErrorDetail(value);
  if (providerError) throw new ProtocolRouteError(`上游网关返回错误：${providerError}`, "gateway");
  const normalized = extractNormalizedResponse(value, target, model);
  if (!response.headersSent) {
    response.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      connection: "keep-alive"
    });
  }
  const write = (item: Record<string, unknown>) => {
    if (!response.writableEnded && !response.destroyed) {
      response.write(formatStreamFrame("chat-completions", item));
    }
  };
  if (normalized.text) {
    write({
      id: streamId,
      object: "chat.completion.chunk",
      model,
      choices: [{ index: 0, delta: { content: normalized.text }, finish_reason: null }]
    });
  }
  normalized.toolCalls.forEach((call, index) => {
    write({
      id: streamId,
      object: "chat.completion.chunk",
      model,
      choices: [{
        index: 0,
        delta: {
          tool_calls: [{
            index,
            id: call.id,
            type: "function",
            function: {
              name: call.name,
              arguments: normalizeToolArguments(call.arguments, call.name)
            }
          }]
        },
        finish_reason: null
      }]
    });
  });
  for (const item of terminalStreamEvents(
    "chat-completions",
    target,
    model,
    normalized.usage,
    normalized.toolCalls.length ? "tool_calls" : normalized.stopReason,
    streamId
  )) write(item);
  if (!response.writableEnded && !response.destroyed) {
    response.write("data: [DONE]\n\n");
    response.end();
  }
  trace?.("Protocol proxy emitted buffered Chat response", {
    model,
    textCharacters: normalized.text.length,
    toolCount: normalized.toolCalls.length,
    buffered: true
  });
}

/** Re-emit one complete response as a valid Responses SSE lifecycle. */
async function streamBufferedResponsesResponse(
  value: unknown,
  response: ServerResponse,
  target: AgentProtocol,
  model: string,
  signal: AbortSignal,
  sourceTools?: ProtocolTool[],
  trace?: (message: string, data?: Record<string, unknown>) => void
): Promise<void> {
  if (signal.aborted) {
    if (!response.writableEnded && !response.destroyed) response.end();
    return;
  }
  const providerError = protocolErrorDetail(value);
  if (providerError) {
    throw new ProtocolRouteError(`上游网关返回错误：${providerError}`, "gateway");
  }
  const normalized = extractNormalizedResponse(value, target, model);
  const responseId = normalized.id.startsWith("resp_")
    ? normalized.id
    : `resp_${randomUUID().replaceAll("-", "")}`;
  if (!response.headersSent) {
    response.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      connection: "keep-alive"
    });
  }
  const write = (item: Record<string, unknown>) => {
    if (!response.writableEnded && !response.destroyed) {
      response.write(formatStreamFrame("responses", item));
    }
  };
  write({
    type: "response.created",
    response: {
      id: responseId,
      object: "response",
      status: "in_progress",
      model,
      output: []
    }
  });
  let outputIndex = 0;
  if (normalized.text) {
    const itemId = `msg_${randomUUID().replaceAll("-", "")}`;
    write({
      type: "response.output_item.added",
      output_index: outputIndex,
      item: { id: itemId, type: "message", role: "assistant", status: "in_progress", content: [] }
    });
    write({
      type: "response.content_part.added",
      item_id: itemId,
      output_index: outputIndex,
      content_index: 0,
      part: { type: "output_text", text: "", annotations: [] }
    });
    // Buffered mode emits the complete text once; it never simulates token cadence.
    write({
      type: "response.output_text.delta",
      item_id: itemId,
      output_index: outputIndex,
      content_index: 0,
      delta: normalized.text
    });
    write({
      type: "response.output_text.done",
      item_id: itemId,
      output_index: outputIndex,
      content_index: 0,
      text: normalized.text
    });
    write({
      type: "response.content_part.done",
      item_id: itemId,
      output_index: outputIndex,
      content_index: 0,
      part: { type: "output_text", text: normalized.text, annotations: [] }
    });
    write({
      type: "response.output_item.done",
      output_index: outputIndex,
      item: {
        id: itemId,
        type: "message",
        role: "assistant",
        status: "completed",
        content: [{ type: "output_text", text: normalized.text, annotations: [] }]
      }
    });
    outputIndex += 1;
  }
  for (const call of normalized.toolCalls) {
    const itemId = `fc_${randomUUID().replaceAll("-", "")}`;
    if (isClientToolSearch(call.name, sourceTools)) {
      write({
        type: "response.output_item.added",
        output_index: outputIndex,
        item: { ...clientToolSearchItem(call.id, call.arguments, itemId), status: "in_progress" }
      });
      write({
        type: "response.output_item.done",
        output_index: outputIndex,
        item: clientToolSearchItem(call.id, call.arguments, itemId)
      });
      outputIndex += 1;
      continue;
    }
    const identity = responsesFunctionCallIdentity(call.name, sourceTools);
    const argumentsValue = normalizeToolArguments(call.arguments, call.name);
    write({
      type: "response.output_item.added",
      output_index: outputIndex,
      item: {
        id: itemId,
        type: "function_call",
        call_id: call.id,
        ...identity,
        arguments: "",
        status: "in_progress"
      }
    });
    write({
      type: "response.function_call_arguments.delta",
      item_id: itemId,
      output_index: outputIndex,
      delta: argumentsValue
    });
    write({
      type: "response.function_call_arguments.done",
      item_id: itemId,
      output_index: outputIndex,
      arguments: argumentsValue
    });
    write({
      type: "response.output_item.done",
      output_index: outputIndex,
      item: {
        id: itemId,
        type: "function_call",
        call_id: call.id,
        ...identity,
        arguments: argumentsValue,
        status: "completed"
      }
    });
    outputIndex += 1;
  }
  for (const item of terminalStreamEvents(
    "responses",
    target,
    model,
    normalized.usage,
    normalized.toolCalls.length ? "tool_calls" : normalized.stopReason,
    responseId
  )) write(item);
  response.end();
  trace?.("Protocol proxy emitted buffered Responses response", {
    model,
    textCharacters: normalized.text.length,
    toolCount: normalized.toolCalls.length,
    buffered: true
  });
}

function writeProtocolFailureResponse(
  response: ServerResponse,
  source: AgentProtocol,
  model: string,
  stream: boolean,
  message: string
): void {
  if (!stream) {
    writeJsonError(response, 502, message, source);
    return;
  }
  if (source === "anthropic-messages") {
    writeAnthropicStreamError(response, message);
    return;
  }
  if (source === "chat-completions") {
    writeChatStreamError(response, `chatcmpl_${randomUUID().replaceAll("-", "")}`, model, message);
    return;
  }
  if (response.writableEnded || response.destroyed) return;
  if (!response.headersSent) {
    response.writeHead(contextLimitError(message) ? 200 : 502, { "content-type": "text/event-stream" });
  }
  response.write(formatStreamFrame("responses", contextLimitError(message) ? responsesContextLimitEvent(message) : {
    type: "error",
    error: { type: "api_error", message: redactTrace(message).slice(0, 1_000) }
  }));
  response.end();
}

function writeAnthropicStreamError(response: ServerResponse, message: string): void {
  if (response.writableEnded || response.destroyed) return;
  if (!response.headersSent) {
    response.writeHead(502, { "content-type": "text/event-stream" });
  }
  response.write(formatStreamFrame("anthropic-messages", {
    type: "error",
    error: { type: contextLimitError(message) ? "invalid_request_error" : "api_error", message: redactTrace(message).slice(0, 1_000) }
  }));
  response.write(formatStreamFrame("anthropic-messages", { type: "message_stop" }));
  response.end();
}

function writeChatStreamError(
  response: ServerResponse,
  streamId: string,
  model: string,
  message: string
): void {
  if (response.writableEnded || response.destroyed) return;
  if (!response.headersSent) {
    response.writeHead(502, { "content-type": "text/event-stream" });
  }
  response.write(formatStreamFrame("chat-completions", {
    id: streamId,
    object: "chat.completion.chunk",
    model,
    error: { message: redactTrace(message).slice(0, 1_000), type: "api_error" },
    choices: []
  }));
  response.write("data: [DONE]\n\n");
  response.end();
}

interface StreamProxyResult {
  toolNames: string[];
  completed: boolean;
}

async function streamProxyResponse(
  upstream: Response,
  response: ServerResponse,
  target: AgentProtocol,
  source: AgentProtocol,
  model: string,
  signal: AbortSignal,
  trace?: (message: string, data?: Record<string, unknown>) => void,
  beforeComplete?: (usage: Record<string, unknown> | undefined) => Promise<void>,
  onActivity?: () => void,
  sourceTools?: ProtocolTool[],
  onProtocolFailure?: (failure: ProtocolProxyFailure) => void,
  onModelDelta?: (
    kind: "visible-text" | "reasoning" | "tool-arguments",
    text: string
  ) => Promise<void>,
  downstreamHeartbeatMs = 15_000,
  onProviderError?: (body: unknown) => string,
  onPublicSummary?: (text: string, itemId: string) => void | Promise<void>
): Promise<StreamProxyResult> {
  const observePublicSummary = async (value: unknown) => {
    if (target !== "responses" || !value || typeof value !== "object") return;
    const event = value as Record<string, unknown>;
    if (event.type !== "response.reasoning_summary_text.delta" || typeof event.delta !== "string" || !event.delta) return;
    try {
      await onPublicSummary?.(event.delta, `${event.item_id ?? event.output_index ?? "summary"}:${event.summary_index ?? 0}`);
    } catch {
      // A closed display tap must not interrupt the native tool loop.
    }
  };
  response.writeHead(200, {
    "content-type": "text/event-stream",
    "cache-control": "no-cache",
    connection: "keep-alive"
  });
  const sourceResponseId = `resp_${randomUUID().replaceAll("-", "")}`;
  const sourceChatCompletionId = `chatcmpl_${randomUUID().replaceAll("-", "")}`;
  const anthropicMessageId = `msg_${randomUUID().replaceAll("-", "")}`;
  let lastDownstreamWriteAt = Date.now();
  const writeFrames = (items: Record<string, unknown>[]) => {
    for (const item of items) {
      if (!response.writableEnded && !response.destroyed) {
        response.write(formatStreamFrame(source, item));
        lastDownstreamWriteAt = Date.now();
      }
    }
  };
  if (source === "responses") {
    writeFrames([{
      type: "response.created",
      response: {
        id: sourceResponseId,
        object: "response",
        status: "in_progress",
        model,
        output: []
      }
    }]);
  } else if (source === "chat-completions") {
    writeFrames([{
      id: sourceChatCompletionId,
      object: "chat.completion.chunk",
      model,
      choices: [{ index: 0, delta: { role: "assistant" }, finish_reason: null }]
    }]);
  }
  const reader = upstream.body?.getReader();
  if (!reader) {
    writeFrames(convertStreamEvent({ type: "error", error: "上游流缺少响应体" }, source, model));
    response.end();
    return { toolNames: [], completed: false };
  }
  // Keep the native client transport alive while a provider is doing hidden
  // reasoning or is otherwise temporarily unable to produce a source-visible
  // event. These frames carry no model content and never count as activity for
  // the owning workflow deadline.
  const downstreamHeartbeat = setInterval(() => {
    if (response.writableEnded || response.destroyed || signal.aborted) return;
    if (Date.now() - lastDownstreamWriteAt < downstreamHeartbeatMs) return;
    if (source === "responses") {
      writeFrames([{
        type: "response.in_progress",
        response: {
          id: sourceResponseId,
          object: "response",
          status: "in_progress",
          model,
          output: []
        }
      }]);
    } else if (source === "chat-completions") {
      writeFrames([{
        id: sourceChatCompletionId,
        object: "chat.completion.chunk",
        model,
        choices: [{ index: 0, delta: {}, finish_reason: null }]
      }]);
    } else {
      writeFrames([{ type: "ping" }]);
    }
  }, downstreamHeartbeatMs);
  downstreamHeartbeat.unref();
  const decoder = new TextDecoder();
  let buffer = "";
  let sawProviderFrame = false;
  let providerCompleted = false;
  let completionUsage: Record<string, unknown> | undefined;
  let completionStopReason: string | undefined;
  let streamFailed = false;
  let providerFrameCount = 0;
  const normalizedEventKinds: string[] = [];
  const observedToolNames = new Set<string>();
  let anthropicMessageStarted = false;
  let anthropicBlockStarted = false;
  let anthropicBlockIndex = 0;
  let anthropicBlockKind: "text" | "tool" | undefined;
  let anthropicToolCallId: string | undefined;
  let anthropicToolName: string | undefined;
  const responseToolCallIds = new Set<string>();
  const sourceToolCallIds = new Map<number, string>();
  const sourceToolItemIds = new Map<number, string>();
  const sourceToolNames = new Map<number, string>();
  const sourceToolArguments = new Map<number, string>();
  const sourceToolFinals = new Set<number>();
  // Responses tool_search needs an object input, so hold those frames until
  // JSON validation. Ordinary function calls keep their native argument text.
  const bufferedToolSearchFrames: Record<string, unknown>[] = [];
  const responseToolOutputIndices = new Map<number, number>();
  let nextResponseOutputIndex = 0;
  let responseTextItemId: string | undefined;
  let responseTextOutputIndex: number | undefined;
  let responseTextStarted = false;
  let responseText = "";
  const closeAnthropicBlock = () => {
    if (source !== "anthropic-messages" || !anthropicBlockStarted) return;
    writeFrames([{ type: "content_block_stop", index: anthropicBlockIndex }]);
    anthropicBlockIndex += 1;
    anthropicBlockStarted = false;
    anthropicBlockKind = undefined;
    anthropicToolCallId = undefined;
    anthropicToolName = undefined;
  };
  const ensureAnthropicBlock = (event: NormalizedStreamEvent) => {
    if (source !== "anthropic-messages") return;
    if (!anthropicMessageStarted) {
      writeFrames([{
        type: "message_start",
        message: {
          id: anthropicMessageId,
          type: "message",
          role: "assistant",
          model,
          content: [],
          stop_reason: null,
          stop_sequence: null,
          usage: {}
        }
      }]);
      anthropicMessageStarted = true;
    }
    if (event.type !== "text_delta" && event.type !== "tool_call_delta") return;
    const nextKind = event.type === "tool_call_delta" ? "tool" : "text";
    const nextToolId = event.toolCallId;
    const nextToolName = event.toolName;
    if (anthropicBlockStarted && (
      anthropicBlockKind !== nextKind ||
      nextKind === "tool" && (
        (nextToolId && anthropicToolCallId && nextToolId !== anthropicToolCallId) ||
        (nextToolName && anthropicToolName && nextToolName !== anthropicToolName)
      )
    )) closeAnthropicBlock();
    if (anthropicBlockStarted) return;
    anthropicBlockKind = nextKind;
    anthropicToolCallId = nextToolId ?? `call_${randomUUID().replaceAll("-", "")}`;
    anthropicToolName = nextToolName ?? "tool";
    writeFrames([{
      type: "content_block_start",
      index: anthropicBlockIndex,
      content_block: anthropicBlockKind === "tool"
        ? { type: "tool_use", id: anthropicToolCallId, name: anthropicToolName, input: {} }
        : { type: "text", text: "" }
    }]);
    anthropicBlockStarted = true;
  };
  const convertForSource = (event: NormalizedStreamEvent): Record<string, unknown>[] => {
    if (event.type === "text_delta" && source === "responses") {
      const frames: Record<string, unknown>[] = [];
      if (!responseTextStarted) {
        responseTextStarted = true;
        responseTextItemId = `msg_${randomUUID().replaceAll("-", "")}`;
        responseTextOutputIndex = nextResponseOutputIndex++;
        frames.push({
          type: "response.output_item.added",
          output_index: responseTextOutputIndex,
          item: {
            id: responseTextItemId,
            type: "message",
            role: "assistant",
            status: "in_progress",
            content: []
          }
        });
        frames.push({
          type: "response.content_part.added",
          item_id: responseTextItemId,
          output_index: responseTextOutputIndex,
          content_index: 0,
          part: { type: "output_text", text: "", annotations: [] }
        });
      }
      const delta = event.text ?? "";
      responseText += delta;
      frames.push({
        type: "response.output_text.delta",
        item_id: responseTextItemId,
        output_index: responseTextOutputIndex,
        content_index: 0,
        delta
      });
      return frames;
    }
    if (event.type === "tool_call_delta" && source === "responses") {
      const key = event.toolIndex ?? 0;
      const discoveredName = event.toolName ?? sourceToolNames.get(key);
      if (discoveredName && isClientToolSearch(discoveredName, sourceTools)) {
        const id = event.toolCallId ?? sourceToolCallIds.get(key) ?? `call_${randomUUID().replaceAll("-", "")}`;
        const itemId = event.toolItemId ?? sourceToolItemIds.get(key) ?? `ts_${randomUUID().replaceAll("-", "")}`;
        const outputIndex = responseToolOutputIndices.get(key) ?? (() => {
          const allocated = nextResponseOutputIndex++;
          responseToolOutputIndices.set(key, allocated);
          return allocated;
        })();
        sourceToolCallIds.set(key, id);
        sourceToolItemIds.set(key, itemId);
        sourceToolNames.set(key, discoveredName);
        const previous = sourceToolArguments.get(key) ?? "";
        const incoming = event.argumentsDelta ?? "";
        sourceToolArguments.set(key, event.toolCallFinal
          ? incoming || previous
          : `${previous}${incoming}`);
        const frames: Record<string, unknown>[] = [];
        if (!responseToolCallIds.has(itemId)) {
          responseToolCallIds.add(itemId);
          frames.push({
            type: "response.output_item.added",
            output_index: outputIndex,
            item: { ...clientToolSearchItem(id, "{}", itemId), status: "in_progress" }
          });
        }
        if (event.toolCallFinal && !sourceToolFinals.has(key)) {
          sourceToolFinals.add(key);
          frames.push({
            type: "response.output_item.done",
            output_index: outputIndex,
            item: clientToolSearchItem(id, sourceToolArguments.get(key) ?? "{}", itemId)
          });
        }
        return frames;
      }
      const id = event.toolCallId ?? sourceToolCallIds.get(key) ?? `call_${randomUUID().replaceAll("-", "")}`;
      const itemId = event.toolItemId ?? sourceToolItemIds.get(key) ?? `fc_${randomUUID().replaceAll("-", "")}`;
      const outputIndex = responseToolOutputIndices.get(key) ?? (() => {
        const allocated = nextResponseOutputIndex++;
        responseToolOutputIndices.set(key, allocated);
        return allocated;
      })();
      sourceToolCallIds.set(key, id);
      sourceToolItemIds.set(key, itemId);
      if (event.toolName) sourceToolNames.set(key, event.toolName);
      const previousArguments = sourceToolArguments.get(key) ?? "";
      const incomingArguments = event.argumentsDelta ?? "";
      let delta = incomingArguments;
      const accumulatedArguments = event.toolCallFinal
        ? incomingArguments || previousArguments
        : `${previousArguments}${incomingArguments}`;
      const legacyMarkup = isLegacyToolMarkup(accumulatedArguments);
      if (legacyMarkup && !event.toolCallFinal) {
        // Hold legacy XML until the provider has emitted the complete call;
        // forwarding fragments would make a Responses client attempt to parse
        // them as JSON before the bridge can normalize them.
        sourceToolArguments.set(key, accumulatedArguments);
        delta = "";
      } else if (legacyMarkup) {
        const normalizedArguments = normalizeToolArguments(
          accumulatedArguments,
          event.toolName ?? sourceToolNames.get(key)
        );
        sourceToolArguments.set(key, normalizedArguments);
        delta = normalizedArguments;
      } else if (event.toolCallFinal) {
        delta = previousArguments
          ? incomingArguments.startsWith(previousArguments) ? incomingArguments.slice(previousArguments.length) : ""
          : incomingArguments;
        sourceToolArguments.set(key, incomingArguments || previousArguments);
      } else if (incomingArguments) {
        sourceToolArguments.set(key, `${previousArguments}${incomingArguments}`);
      }
      const frames: Record<string, unknown>[] = [];
      if (!responseToolCallIds.has(itemId)) {
        responseToolCallIds.add(itemId);
        const identity = responsesFunctionCallIdentity(event.toolName ?? "tool", sourceTools);
        frames.push({
          type: "response.output_item.added",
          output_index: outputIndex,
          item: { id: itemId, type: "function_call", call_id: id, ...identity, arguments: "" }
        });
      }
      if (delta) frames.push({ type: "response.function_call_arguments.delta", item_id: itemId, output_index: outputIndex, delta });
      if (event.toolCallFinal && !sourceToolFinals.has(key)) {
        sourceToolFinals.add(key);
        const argumentsValue = normalizeToolArguments(
          sourceToolArguments.get(key) ?? "",
          event.toolName ?? sourceToolNames.get(key)
        );
        sourceToolArguments.set(key, argumentsValue);
        const identity = responsesFunctionCallIdentity(
          event.toolName ?? sourceToolNames.get(key) ?? "tool",
          sourceTools
        );
        frames.push({ type: "response.function_call_arguments.done", item_id: itemId, output_index: outputIndex, arguments: argumentsValue });
        frames.push({
          type: "response.output_item.done",
          output_index: outputIndex,
          item: { id: itemId, type: "function_call", call_id: id, ...identity, arguments: argumentsValue }
        });
      }
      return frames;
    }
    if (event.type === "tool_call_delta" && source === "anthropic-messages") {
      const key = event.toolIndex ?? anthropicBlockIndex;
      const previousArguments = sourceToolArguments.get(key) ?? "";
      const incomingArguments = event.argumentsDelta ?? "";
      let delta = incomingArguments;
      if (event.toolCallFinal) {
        delta = previousArguments
          ? incomingArguments.startsWith(previousArguments) ? incomingArguments.slice(previousArguments.length) : ""
          : incomingArguments;
        sourceToolArguments.set(key, incomingArguments || previousArguments);
      } else if (incomingArguments) {
        sourceToolArguments.set(key, `${previousArguments}${incomingArguments}`);
      }
      return delta ? [{ type: "content_block_delta", index: anthropicBlockIndex, delta: { type: "input_json_delta", partial_json: delta } }] : [];
    }
    if (event.type === "tool_call_delta" && source === "chat-completions") {
      const key = event.toolIndex ?? 0;
      const id = event.toolCallId ?? sourceToolCallIds.get(key);
      if (id) sourceToolCallIds.set(key, id);
      const name = event.toolName ?? sourceToolNames.get(key);
      if (name) sourceToolNames.set(key, name);
      const previousArguments = sourceToolArguments.get(key) ?? "";
      const incomingArguments = event.argumentsDelta ?? "";
      let delta = incomingArguments;
      if (event.toolCallFinal) {
        delta = previousArguments
          ? incomingArguments.startsWith(previousArguments) ? incomingArguments.slice(previousArguments.length) : ""
          : incomingArguments;
        sourceToolArguments.set(key, incomingArguments || previousArguments);
      } else if (incomingArguments) {
        sourceToolArguments.set(key, `${previousArguments}${incomingArguments}`);
      }
      return [{ id: sourceChatCompletionId, object: "chat.completion.chunk", model, choices: [{ index: 0, delta: { tool_calls: [{ index: key, ...(id ? { id } : {}), type: "function", function: { ...(name ? { name } : {}), arguments: delta } }] }, finish_reason: null }] }];
    }
    return convertStreamEvent(event, source, model, target);
  };
  try {
    while (!signal.aborted) {
      const next = await reader.read();
      buffer += decoder.decode(next.value ?? new Uint8Array(), { stream: !next.done });
      const events = splitSseEvents(buffer);
      buffer = events.rest;
      for (const event of events.events) {
        const parsed = event.data.trim() === "[DONE]" ? "[DONE]" : safeJson(event.data);
        if (parsed === undefined) continue;
        sawProviderFrame = true;
        providerFrameCount += 1;
        onActivity?.();
        await observePublicSummary(parsed);
        for (const normalized of normalizeProtocolStreamEvents(target, parsed)) {
          if (normalized.type === "error" && onProviderError) normalized.error = onProviderError(parsed);
          const observedDelta = modelOutputDelta(normalized);
          if (observedDelta) {
            await onModelDelta?.(observedDelta.kind, observedDelta.text);
          }
          if (normalizedEventKinds.length < 80) {
            normalizedEventKinds.push(`${normalized.type}${normalized.toolName ? `:${normalized.toolName}` : ""}${normalized.text ? `:${normalized.text.length}` : ""}`);
          }
          if (normalized.type === "completed") providerCompleted = true;
          if (normalized.type === "tool_call_delta" && normalized.toolName) {
            observedToolNames.add(normalized.toolName);
          }
          if (normalized.usage && Object.keys(normalized.usage).length) {
            completionUsage = mergeUsageRecords(completionUsage, normalized.usage);
          }
          if (normalized.stopReason) completionStopReason = normalized.stopReason;
          const anthropicToolKey = source === "anthropic-messages" &&
            normalized.type === "tool_call_delta"
            ? normalized.toolIndex ?? anthropicBlockIndex
            : undefined;
          // Responses providers may emit both
          // `response.function_call_arguments.done` and a later
          // `response.output_item.done` for the same output index. Anthropic
          // content blocks cannot be reopened after they were closed, so the
          // second terminal frame must not create a duplicate tool_use block.
          if (
            anthropicToolKey !== undefined &&
            normalized.toolCallFinal &&
            sourceToolFinals.has(anthropicToolKey)
          ) continue;
          ensureAnthropicBlock(normalized);
          // Completion is synthesized once below so usage and stop reason from
          // the provider's terminal frame can be folded into one source-native
          // event. Keep convertStreamEvent's standalone behavior for callers
          // that use it directly.
          const converted = normalized.type === "completed"
            ? []
            : convertForSource(normalized);
          if (converted.length) {
            if (source === "responses" && normalized.type === "tool_call_delta" &&
                isClientToolSearch(sourceToolNames.get(normalized.toolIndex ?? 0) ?? "", sourceTools)) {
              bufferedToolSearchFrames.push(...converted);
            } else {
              writeFrames(converted);
            }
          }
          if (anthropicToolKey !== undefined && normalized.toolCallFinal) {
            sourceToolFinals.add(anthropicToolKey);
          }
          if (normalized.type === "error") streamFailed = true;
        }
      }
      if (next.done) break;
    }
    // Providers occasionally omit the final blank line. Process one complete
    // JSON data frame left in the decoder buffer before synthesizing a
    // terminal event.
    if (buffer.trim()) {
      const dataLines = buffer.split(/\r?\n/).filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trim());
      const rawData = dataLines.join("\n").trim();
      const parsed = rawData === "[DONE]" ? "[DONE]" : safeJson(rawData || buffer.trim());
      if (parsed !== undefined) {
        sawProviderFrame = true;
        providerFrameCount += 1;
        onActivity?.();
        await observePublicSummary(parsed);
        for (const normalized of normalizeProtocolStreamEvents(target, parsed)) {
          if (normalized.type === "error" && onProviderError) normalized.error = onProviderError(parsed);
          const observedDelta = modelOutputDelta(normalized);
          if (observedDelta) {
            await onModelDelta?.(observedDelta.kind, observedDelta.text);
          }
          if (normalized.type === "completed") providerCompleted = true;
          if (normalized.type === "tool_call_delta" && normalized.toolName) {
            observedToolNames.add(normalized.toolName);
          }
          if (normalized.usage && Object.keys(normalized.usage).length) {
            completionUsage = mergeUsageRecords(completionUsage, normalized.usage);
          }
          if (normalized.stopReason) completionStopReason = normalized.stopReason;
          const anthropicToolKey = source === "anthropic-messages" &&
            normalized.type === "tool_call_delta"
            ? normalized.toolIndex ?? anthropicBlockIndex
            : undefined;
          if (
            anthropicToolKey !== undefined &&
            normalized.toolCallFinal &&
            sourceToolFinals.has(anthropicToolKey)
          ) continue;
          ensureAnthropicBlock(normalized);
          const converted = normalized.type === "completed"
            ? []
            : convertForSource(normalized);
          if (source === "responses" && normalized.type === "tool_call_delta" &&
              isClientToolSearch(sourceToolNames.get(normalized.toolIndex ?? 0) ?? "", sourceTools)) {
            bufferedToolSearchFrames.push(...converted);
          } else {
            writeFrames(converted);
          }
          if (anthropicToolKey !== undefined && normalized.toolCallFinal) {
            sourceToolFinals.add(anthropicToolKey);
          }
          if (normalized.type === "error") streamFailed = true;
        }
      }
    }
    // A JSON body sent in response to a stream request is deliberately not
    // treated as a successful stream. The missing terminal event is surfaced
    // below as a source-native error instead of silently manufacturing a
    // successful turn.
  } finally {
    clearInterval(downstreamHeartbeat);
    reader.releaseLock();
    trace?.("Protocol proxy stream finished", {
      sourceProtocol: source,
      targetProtocol: target,
      model,
      providerFrameCount,
      sawProviderFrame,
      providerCompleted,
      streamFailed,
      aborted: signal.aborted,
      eventKinds: normalizedEventKinds
    });
  }
  if (signal.aborted) {
    // The client cancellation/timeout owns the response at this point. Do
    // not append a synthetic success terminal frame after the upstream fetch
    // has been aborted.
    if (!response.writableEnded && !response.destroyed) response.end();
    return { toolNames: [...observedToolNames], completed: false };
  }
  for (const [toolIndex, argumentsValue] of sourceToolArguments.entries()) {
    const failure = invalidToolArguments(
      {
        name: sourceToolNames.get(toolIndex),
        arguments: argumentsValue
      },
      {
        sourceProtocol: source,
        targetProtocol: target,
        model,
        toolIndex
      }
    );
    if (failure) {
      if (source !== "anthropic-messages" &&
          !isClientToolSearch(sourceToolNames.get(toolIndex) ?? "", sourceTools)) {
        trace?.("Tool argument error delivered to the native Harness for Agent correction", {
          diagnostic: true, diagnosticKind: "proxy.tool.arguments", errorCode: failure.code,
          toolName: failure.toolName, toolIndex: failure.toolIndex, protocolMessage: failure.message,
          sourceProtocol: source, targetProtocol: target, nativeCorrection: true
        });
        continue;
      }
      onProtocolFailure?.(failure);
      writeProtocolFailureResponse(response, source, model, true, failure.message);
      return { toolNames: [...observedToolNames], completed: false };
    }
  }
  if (bufferedToolSearchFrames.length) {
    writeFrames(bufferedToolSearchFrames);
  }
  if (source === "anthropic-messages") {
    if (!anthropicMessageStarted) {
      writeFrames([{
        type: "message_start",
        message: {
          id: anthropicMessageId,
          type: "message",
          role: "assistant",
          model,
          content: [],
          stop_reason: null,
          stop_sequence: null,
          usage: {}
        }
      }]);
      anthropicMessageStarted = true;
    }
    closeAnthropicBlock();
  }
  if (!streamFailed && providerCompleted && source === "responses" && responseTextStarted && responseTextItemId !== undefined && responseTextOutputIndex !== undefined) {
    // Responses clients (including Codex) require the message item/content
    // part lifecycle before accepting output_text deltas. Close that item
    // explicitly before the response-level terminal event.
    writeFrames([
      {
        type: "response.output_text.done",
        item_id: responseTextItemId,
        output_index: responseTextOutputIndex,
        content_index: 0,
        text: responseText
      },
      {
        type: "response.content_part.done",
        item_id: responseTextItemId,
        output_index: responseTextOutputIndex,
        content_index: 0,
        part: { type: "output_text", text: responseText, annotations: [] }
      },
      {
        type: "response.output_item.done",
        output_index: responseTextOutputIndex,
        item: {
          id: responseTextItemId,
          type: "message",
          role: "assistant",
          status: "completed",
          content: [{ type: "output_text", text: responseText, annotations: [] }
          ]
        }
      }
    ]);
  }
  if (!streamFailed && providerCompleted && source === "responses") {
    // Chat/Anthropic providers signal tool completion through their overall
    // terminal frame rather than a Responses per-item `done` event. Close
    // every still-open Responses function call before the response terminal.
    for (const [key, id] of sourceToolCallIds) {
      if (sourceToolFinals.has(key)) continue;
      const itemId = sourceToolItemIds.get(key) ?? id;
      const outputIndex = responseToolOutputIndices.get(key) ?? nextResponseOutputIndex++;
      responseToolOutputIndices.set(key, outputIndex);
      const argumentsValue = normalizeToolArguments(
        sourceToolArguments.get(key) ?? "",
        sourceToolNames.get(key)
      );
      const identity = responsesFunctionCallIdentity(
        sourceToolNames.get(key) ?? "tool",
        sourceTools
      );
      sourceToolArguments.set(key, argumentsValue);
      sourceToolFinals.add(key);
      if (isClientToolSearch(sourceToolNames.get(key) ?? "", sourceTools)) {
        writeFrames([{
          type: "response.output_item.done",
          output_index: outputIndex,
          item: clientToolSearchItem(id, argumentsValue, itemId)
        }]);
        continue;
      }
      writeFrames([
        { type: "response.function_call_arguments.done", item_id: itemId, output_index: outputIndex, arguments: argumentsValue },
        {
          type: "response.output_item.done",
          output_index: outputIndex,
          item: { id: itemId, type: "function_call", call_id: id, ...identity, arguments: argumentsValue }
        }
      ]);
    }
  }
  // A provider must explicitly terminate a stream. Returning a synthetic
  // success for an EOF/error would make a broken gateway look compatible and
  // can strand tool calls in the child harness. Emit a source-native error so
  // the caller can retry or report the provider failure.
  if (!providerCompleted && !streamFailed) {
    streamFailed = true;
    writeFrames(convertStreamEvent({ type: "error", error: "上游流在终止事件前结束" }, source, model));
  }
  const hasCompletionUsage = Boolean(
    completionUsage && Object.keys(completionUsage).length > 0
  );
  // Preserve exact usage even if a later frame breaks the stream. The outer
  // settlement will then keep this known record instead of replacing it with
  // an indeterminate one.
  if (streamFailed && hasCompletionUsage) {
    await beforeComplete?.(completionUsage);
  }
  if (!streamFailed) {
    const terminalReason = completionStopReason ?? (sourceToolArguments.size ? "tool_calls" : undefined);
    await beforeComplete?.(completionUsage);
    writeFrames(terminalStreamEvents(source, target, model, completionUsage, terminalReason, source === "responses" ? sourceResponseId : source === "chat-completions" ? sourceChatCompletionId : undefined));
  }
  if (source === "chat-completions" && !streamFailed && !response.writableEnded && !response.destroyed) response.write("data: [DONE]\n\n");
  response.end();
  return {
    toolNames: [...observedToolNames],
    completed: providerCompleted && !streamFailed
  };
}

function modelOutputDelta(
  event: NormalizedStreamEvent
): { kind: "visible-text" | "reasoning" | "tool-arguments"; text: string } | undefined {
  if (event.type === "text_delta" && event.text) {
    return { kind: "visible-text", text: event.text };
  }
  if (event.type === "tool_call_delta" && event.argumentsDelta) {
    return { kind: "tool-arguments", text: event.argumentsDelta };
  }
  if (event.type === "reasoning_delta" && event.text) {
    return { kind: "reasoning", text: event.text };
  }
  const raw = event.raw && typeof event.raw === "object" && !Array.isArray(event.raw)
    ? event.raw as Record<string, unknown>
    : undefined;
  const type = typeof raw?.type === "string" ? raw.type.toLowerCase() : "";
  if (!type.includes("reasoning") && !type.includes("thinking")) return undefined;
  const delta = typeof raw?.delta === "string"
    ? raw.delta
    : typeof raw?.text === "string"
      ? raw.text
      : undefined;
  return delta ? { kind: "reasoning", text: delta } : undefined;
}

function formatStreamFrame(source: AgentProtocol, item: Record<string, unknown>): string {
  const data = JSON.stringify(item);
  return source === "anthropic-messages"
    ? `event: ${typeof item.type === "string" ? item.type : "message"}\ndata: ${data}\n\n`
    : `data: ${data}\n\n`;
}

function splitSseEvents(value: string): { events: Array<{ data: string }>; rest: string } {
  const chunks = value.split(/\r?\n\r?\n/);
  const rest = chunks.pop() ?? "";
  const events = chunks.flatMap((chunk) => {
    const data = chunk.split(/\r?\n/).filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trim()).join("\n");
    return data ? [{ data }] : [];
  });
  return { events, rest };
}

export function convertStreamEvent(event: NormalizedStreamEvent, source: AgentProtocol, model: string, target?: AgentProtocol): Record<string, unknown>[] {
  if (event.type === "reasoning_delta" && source === "chat-completions" && (target ?? source) === "chat-completions" && event.text) {
    // Native Chat clients use reasoning chunks to keep their stream idle timers alive.
    return [{ id: `chatcmpl_${randomUUID()}`, object: "chat.completion.chunk", model, choices: [{ index: 0, delta: { reasoning_content: event.text }, finish_reason: null }] }];
  }
  if (event.type === "text_delta") {
    if (source === "responses") return [{ type: "response.output_text.delta", delta: event.text ?? "" }];
    if (source === "chat-completions") return [{ id: `chatcmpl_${randomUUID()}`, object: "chat.completion.chunk", model, choices: [{ index: 0, delta: { content: event.text ?? "" }, finish_reason: null }] }];
    return [{ type: "content_block_delta", index: 0, delta: { type: "text_delta", text: event.text ?? "" } }];
  }
  if (event.type === "tool_call_delta") {
    if (source === "responses") return [{ type: "response.function_call_arguments.delta", item_id: event.toolCallId ?? `call_${randomUUID()}`, delta: event.argumentsDelta ?? "" }];
    if (source === "chat-completions") return [{ id: `chatcmpl_${randomUUID()}`, object: "chat.completion.chunk", model, choices: [{ index: 0, delta: { tool_calls: [{ index: event.toolIndex ?? 0, ...(event.toolCallId ? { id: event.toolCallId } : {}), type: "function", function: { ...(event.toolName ? { name: event.toolName } : {}), arguments: event.argumentsDelta ?? "" } }] }, finish_reason: null }] }];
    return [{ type: "content_block_delta", index: 0, delta: { type: "input_json_delta", partial_json: event.argumentsDelta ?? "" } }];
  }
  if (event.type === "error" && source === "responses" && contextLimitError(event.error))
    return [responsesContextLimitEvent(event.error ?? "Model context window exceeded")];
  if (event.type === "error") return [{ type: "error", error: {
    ...(source === "anthropic-messages" && contextLimitError(event.error) ? { type: "invalid_request_error" } : {}),
    message: event.error ?? "provider stream failed"
  } }];
  if (event.type === "completed") return terminalStreamEvents(source, target ?? source, model, event.usage, event.stopReason);
  return [];
}

function usageNumber(usage: Record<string, unknown> | undefined, keys: string[]): number | undefined {
  if (!usage) return undefined;
  for (const key of keys) {
    const value = usage[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return undefined;
}

function mergeUsageRecords(
  previous: Record<string, unknown> | undefined,
  incoming: Record<string, unknown>
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...(previous ?? {}) };
  for (const [key, value] of Object.entries(incoming)) {
    const existing = merged[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      merged[key] = typeof existing === "number" && Number.isFinite(existing)
        ? Math.max(existing, value)
        : value;
    } else if (
      value && typeof value === "object" && !Array.isArray(value) &&
      existing && typeof existing === "object" && !Array.isArray(existing)
    ) {
      merged[key] = mergeUsageRecords(
        existing as Record<string, unknown>,
        value as Record<string, unknown>
      );
    } else {
      merged[key] = value;
    }
  }
  return merged;
}

function usageRecordTotal(value: unknown): number {
  if (!value || typeof value !== "object" || Array.isArray(value)) return 0;
  return Object.values(value as Record<string, unknown>).reduce<number>(
    (sum, item) => sum + (typeof item === "number" && Number.isFinite(item)
      ? Math.max(0, Math.floor(item))
      : 0),
    0
  );
}

async function reportGatewayTokenUsage(
  state: ProxyState,
  usageId: string,
  model: string,
  rawUsage: Record<string, unknown> | undefined,
  trace?: (
    kind: "status" | "error",
    message: string,
    data?: Record<string, unknown>
  ) => void,
  unknown: {
    reason?: GatewayUnknownTokenUsage["reason"];
    processingState?: GatewayUnknownTokenUsage["processingState"];
  } = {}
): Promise<void> {
  if (!state.options.onUsage) return;
  const knownUsage = normalizeGatewayTokenUsage(
    usageId,
    state.options.targetProtocol,
    model,
    rawUsage
  );
  const previousStatus = state.usageReportStatus.get(usageId);
  if (previousStatus === "known" || previousStatus === "unknown" && !knownUsage) {
    return;
  }
  const unknownUsage: GatewayUnknownTokenUsage | undefined = knownUsage ? undefined : {
    usageId,
    protocol: state.options.targetProtocol,
    model,
    status: "unknown",
    reason: unknown.reason ?? "provider-response-missing-usage",
    processingState: unknown.processingState ?? "processed"
  };
  const usage: GatewayUsageReport = knownUsage ?? unknownUsage!;
  if (!knownUsage) {
    trace?.("status", "Protocol proxy completed without gateway token usage", {
      sourceProtocol: state.options.sourceProtocol,
      targetProtocol: state.options.targetProtocol,
      model,
      usageId,
      usageStatus: "unknown",
      reason: unknownUsage!.reason,
      processingState: unknownUsage!.processingState
    });
  }
  try {
    await state.options.onUsage(usage);
    state.usageReportStatus.set(usageId, knownUsage ? "known" : "unknown");
  } catch (error) {
    const failure: GatewayUsagePersistenceFailure = {
      usageId,
      protocol: state.options.targetProtocol,
      model,
      error: error instanceof Error
        ? redactTrace(error.message).slice(0, 500)
        : "unknown accounting error"
    };
    trace?.("error", "Protocol proxy could not persist gateway token usage", {
      sourceProtocol: state.options.sourceProtocol,
      targetProtocol: state.options.targetProtocol,
      model,
      usageId,
      error: failure.error
    });
    try {
      await state.options.onUsagePersistenceFailure?.(failure);
    } catch (reportError) {
      trace?.("error", "Protocol proxy could not publish token usage persistence failure", {
        sourceProtocol: state.options.sourceProtocol,
        targetProtocol: state.options.targetProtocol,
        model,
        usageId,
        error: reportError instanceof Error
          ? redactTrace(reportError.message).slice(0, 500)
          : "unknown failure reporting error"
      });
    }
  }
}

/** Translate token usage using the source protocol's cache accounting rules. */
function usageForProtocol(
  usage: Record<string, unknown> | undefined,
  from: AgentProtocol,
  to: AgentProtocol
): Record<string, unknown> | undefined {
  if (!usage) return undefined;
  const input = usageNumber(usage, ["input_tokens", "prompt_tokens", "inputTokens"]);
  const output = usageNumber(usage, ["output_tokens", "completion_tokens", "outputTokens"]);
  const cached = usageNumber(usage, ["cache_read_input_tokens", "cached_input_tokens", "cached_tokens", "cacheReadInputTokens"])
    ?? usageNumber(optionalObjectValue(usage.input_tokens_details), ["cached_tokens"])
    ?? usageNumber(optionalObjectValue(usage.prompt_tokens_details), ["cached_tokens"]);
  const cacheCreation = from === "anthropic-messages"
    ? usageNumber(usage, ["cache_creation_input_tokens", "cacheCreationInputTokens"]) ??
      (usage.cache_creation === undefined ? undefined : usageRecordTotal(usage.cache_creation))
    : undefined;
  // Anthropic reports cache reads and writes in addition to input_tokens.
  // Responses and Chat count cached input inside their input total.
  const physicalInput = input === undefined && cached === undefined && cacheCreation === undefined
    ? undefined
    : from === "anthropic-messages"
      ? (input ?? 0) + (cached ?? 0) + (cacheCreation ?? 0)
      : input ?? 0;
  const outputInput = physicalInput === undefined ? undefined
    : to === "anthropic-messages"
      ? Math.max(0, physicalInput - (cached ?? 0) - (cacheCreation ?? 0))
      : physicalInput;
  const reportedTotal = usageNumber(usage, ["total_tokens", "totalTokens"]);
  const computedTotal = physicalInput === undefined && output === undefined
    ? undefined : (physicalInput ?? 0) + (output ?? 0);
  const total = reportedTotal === undefined && computedTotal === undefined
    ? undefined : Math.max(reportedTotal ?? 0, computedTotal ?? 0);
  const result: Record<string, unknown> = { ...usage };
  for (const key of [
    "input_tokens", "prompt_tokens", "inputTokens", "output_tokens", "completion_tokens", "outputTokens",
    "total_tokens", "totalTokens", "cache_read_input_tokens", "cached_input_tokens", "cached_tokens",
    "cacheReadInputTokens", "cache_creation_input_tokens", "cacheCreationInputTokens",
    "input_tokens_details", "prompt_tokens_details", "cache_creation"
  ]) delete result[key];
  if (to === "responses") {
    if (outputInput !== undefined) result.input_tokens = outputInput;
    if (output !== undefined) result.output_tokens = output;
    if (total !== undefined) result.total_tokens = total;
    if (cached !== undefined) result.input_tokens_details = { cached_tokens: cached };
  } else if (to === "chat-completions") {
    if (outputInput !== undefined) result.prompt_tokens = outputInput;
    if (output !== undefined) result.completion_tokens = output;
    if (total !== undefined) result.total_tokens = total;
    if (cached !== undefined) result.prompt_tokens_details = { cached_tokens: cached };
  } else {
    if (outputInput !== undefined) result.input_tokens = outputInput;
    if (output !== undefined) result.output_tokens = output;
    if (cached !== undefined) result.cache_read_input_tokens = cached;
    if (cacheCreation !== undefined) result.cache_creation_input_tokens = cacheCreation;
    if (total !== undefined) result.total_tokens = total;
  }
  return result;
}

function mapStopReason(reason: string | undefined, target: AgentProtocol): string {
  const normalized = reason?.trim().toLowerCase();
  if (target === "chat-completions") {
    if (normalized === "tool_use" || normalized === "tool_calls" || normalized === "function_call") return "tool_calls";
    if (normalized === "length" || normalized === "max_tokens" || normalized === "max_output_tokens" || normalized === "incomplete") return "length";
    if (normalized === "content_filter") return "content_filter";
    return "stop";
  }
  if (target === "anthropic-messages") {
    if (normalized === "tool_use" || normalized === "tool_calls" || normalized === "function_call") return "tool_use";
    if (normalized === "length" || normalized === "max_tokens" || normalized === "max_output_tokens" || normalized === "incomplete") return "max_tokens";
    if (normalized === "stop_sequence") return "stop_sequence";
    return "end_turn";
  }
  return reason && reason !== "stop" && reason !== "end_turn" ? reason : "completed";
}

/**
 * Tool/function stops are successful provider terminations, not incomplete
 * Responses.  A Responses gateway commonly reports a function call with a
 * `completed` response while Chat/Anthropic use `tool_calls`/`tool_use` as the
 * finish reason.  Keep the incomplete status reserved for an actual budget,
 * policy, cancellation, or provider failure stop.
 */
function isIncompleteStopReason(reason: string | undefined): boolean {
  if (!reason) return false;
  const normalized = reason.trim().toLowerCase();
  if (normalized === "completed" || normalized === "stop" || normalized === "end_turn" ||
    normalized === "tool_calls" || normalized === "tool_use" || normalized === "function_call" ||
    normalized === "function_call_output" || normalized === "success") return false;
  return true;
}

function terminalStreamEvents(
  source: AgentProtocol,
  target: AgentProtocol,
  model: string,
  usage?: Record<string, unknown>,
  stopReason?: string,
  streamId?: string
): Record<string, unknown>[] {
  const mappedUsage = usageForProtocol(usage, target, source);
  if (source === "responses") {
    const incomplete = isIncompleteStopReason(stopReason);
    return [{
      type: incomplete ? "response.incomplete" : "response.completed",
      response: {
        id: streamId ?? `resp_${randomUUID().replaceAll("-", "")}`,
        object: "response",
        status: incomplete ? "incomplete" : "completed",
        model,
        ...(incomplete ? { incomplete_details: { reason: stopReason } } : {}),
        ...(mappedUsage ? { usage: mappedUsage } : {})
      }
    }];
  }
  if (source === "chat-completions") return [{ id: streamId ?? `chatcmpl_${randomUUID().replaceAll("-", "")}`, object: "chat.completion.chunk", model, choices: [{ index: 0, delta: {}, finish_reason: mapStopReason(stopReason, source) }], ...(mappedUsage ? { usage: mappedUsage } : {}) }];
  return [{ type: "message_delta", delta: { stop_reason: mapStopReason(stopReason, source), stop_sequence: null }, ...(mappedUsage ? { usage: mappedUsage } : {}) }, { type: "message_stop" }];
}

export function convertProtocolResponse(
  value: unknown,
  target: AgentProtocol,
  source: AgentProtocol,
  fallbackModel: string,
  sourceTools?: ProtocolTool[]
): Record<string, unknown> {
  const normalized = extractNormalizedResponse(value, target, fallbackModel);
  const mappedUsage = usageForProtocol(normalized.usage, target, source);
  const mappedStopReason = mapStopReason(normalized.stopReason, source);
  if (source === "responses") {
    const output: Record<string, unknown>[] = [];
    if (normalized.text) output.push({ type: "message", role: "assistant", content: [{ type: "output_text", text: normalized.text }] });
    for (const call of normalized.toolCalls) {
      output.push(isClientToolSearch(call.name, sourceTools)
        ? clientToolSearchItem(call.id, call.arguments)
        : {
            type: "function_call",
            call_id: call.id,
            ...responsesFunctionCallIdentity(call.name, sourceTools),
            arguments: call.arguments
          });
    }
    const incomplete = isIncompleteStopReason(normalized.stopReason);
    return { id: normalized.id, object: "response", model: normalized.model, status: incomplete ? "incomplete" : "completed", output, output_text: normalized.text, ...(incomplete ? { incomplete_details: { reason: normalized.stopReason } } : {}), ...(mappedUsage ? { usage: mappedUsage } : {}) };
  }
  if (source === "chat-completions") {
    const message: Record<string, unknown> = { role: "assistant", content: normalized.text || null };
    if (normalized.toolCalls.length) message.tool_calls = normalized.toolCalls.map((call) => ({ id: call.id, type: "function", function: { name: call.name, arguments: call.arguments } }));
    return { id: normalized.id, object: "chat.completion", model: normalized.model, choices: [{ index: 0, message, finish_reason: normalized.toolCalls.length ? "tool_calls" : mappedStopReason }], ...(mappedUsage ? { usage: mappedUsage } : {}) };
  }
  return {
    id: normalized.id,
    type: "message",
    role: "assistant",
    model: normalized.model,
    content: [ ...(normalized.text ? [{ type: "text", text: normalized.text }] : []), ...normalized.toolCalls.map((call) => ({ type: "tool_use", id: call.id, name: call.name, input: safeJson(call.arguments) ?? {} })) ],
    stop_reason: normalized.toolCalls.length ? "tool_use" : mappedStopReason,
    ...(mappedUsage ? { usage: mappedUsage } : {})
  };
}

function extractNormalizedResponse(value: unknown, protocol: AgentProtocol, fallbackModel: string): NormalizedResponse {
  const record = objectValue(value);
  if (protocol === "responses") {
    const output = Array.isArray(record.output) ? record.output : [];
    const textParts: string[] = [];
    const toolCalls: NormalizedResponse["toolCalls"] = [];
    for (const item of output) {
      if (!item || typeof item !== "object") continue;
      const row = item as Record<string, unknown>;
      if (row.type === "message" && Array.isArray(row.content)) textParts.push(contentText(row.content));
      if (row.type === "function_call") toolCalls.push({ id: typeof row.call_id === "string" ? row.call_id : `call_${randomUUID()}`, name: typeof row.name === "string" ? row.name : "tool", arguments: normalizeToolArguments(typeof row.arguments === "string" ? row.arguments : JSON.stringify(row.arguments ?? {}), typeof row.name === "string" ? row.name : undefined) });
    }
    if (typeof record.output_text === "string") textParts.push(record.output_text);
    const incomplete = optionalObjectValue(record.incomplete_details);
    return { id: typeof record.id === "string" ? record.id : `resp_${randomUUID()}`, model: typeof record.model === "string" ? record.model : fallbackModel, text: [...new Set(textParts.filter(Boolean))].join("\n"), toolCalls, usage: optionalObjectValue(record.usage), stopReason: typeof incomplete?.reason === "string" ? incomplete.reason : typeof record.status === "string" && record.status !== "completed" ? record.status : undefined };
  }
  if (protocol === "chat-completions") {
    const choice = Array.isArray(record.choices) && record.choices[0] && typeof record.choices[0] === "object" ? record.choices[0] as Record<string, unknown> : {};
    const message = objectValue(choice.message);
    const toolCalls = Array.isArray(message.tool_calls) ? message.tool_calls.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const row = item as Record<string, unknown>;
      const fn = objectValue(row.function);
      return [{ id: typeof row.id === "string" ? row.id : `call_${randomUUID()}`, name: typeof fn.name === "string" ? fn.name : "tool", arguments: normalizeToolArguments(typeof fn.arguments === "string" ? fn.arguments : JSON.stringify(fn.arguments ?? {}), typeof fn.name === "string" ? fn.name : undefined) }];
    }) : [];
    return { id: typeof record.id === "string" ? record.id : `chatcmpl_${randomUUID()}`, model: typeof record.model === "string" ? record.model : fallbackModel, text: contentText(message.content), toolCalls, usage: optionalObjectValue(record.usage), stopReason: typeof choice.finish_reason === "string" ? choice.finish_reason : undefined };
  }
  const content = Array.isArray(record.content) ? record.content : [];
  const textParts: string[] = [];
  const toolCalls: NormalizedResponse["toolCalls"] = [];
  for (const item of content) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    if (row.type === "text" && typeof row.text === "string") textParts.push(row.text);
    if (row.type === "tool_use") toolCalls.push({ id: typeof row.id === "string" ? row.id : `call_${randomUUID()}`, name: typeof row.name === "string" ? row.name : "tool", arguments: normalizeToolArguments(JSON.stringify(row.input ?? {}), typeof row.name === "string" ? row.name : undefined) });
  }
  return { id: typeof record.id === "string" ? record.id : `msg_${randomUUID()}`, model: typeof record.model === "string" ? record.model : fallbackModel, text: textParts.join("\n"), toolCalls, usage: optionalObjectValue(record.usage), stopReason: typeof record.stop_reason === "string" ? record.stop_reason : undefined };
}

function safeJson(value: string): any {
  try { return JSON.parse(value); } catch { return undefined; }
}

function optionalObjectValue(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function responsesContextLimitEvent(message: string): Record<string, unknown> {
  return { type: "response.failed", response: { id: `resp_${randomUUID().replaceAll("-", "")}`, status: "failed",
    error: { code: "context_length_exceeded", message: redactTrace(message).slice(0, 1_000) } } };
}

function writeJsonError(response: ServerResponse, status: number, message: string, protocol?: AgentProtocol, stream = false): void {
  if (protocol === "responses" && stream && contextLimitError(message)) {
    writeProtocolFailureResponse(response, protocol, "", true, message);
    return;
  }
  response.writeHead(status, { "content-type": "application/json" });
  if (protocol === "anthropic-messages") response.end(JSON.stringify({ type: "error", error: { type: contextLimitError(message) ? "invalid_request_error" : "api_error", message } }));
  else response.end(JSON.stringify({ error: { message, type: contextLimitError(message) ? "invalid_request_error" : "api_error",
    ...(contextLimitError(message) ? { code: "context_length_exceeded" } : {}) } }));
}

async function readBody(request: IncomingMessage, maxBytes: number): Promise<string> {
  const chunks: Buffer[] = [];
  let length = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
    length += buffer.length;
    if (length > maxBytes) throw new Error("request body is too large");
    chunks.push(buffer);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function closeHttpServer(server: Server): Promise<void> {
  return new Promise((resolve) => {
    if (!server.listening) { resolve(); return; }
    server.close(() => resolve());
  });
}
