/** Recognize provider context errors without confusing rate/output-token limits. */
export interface ContextLimit {
  requestedTokens?: number;
  limitTokens?: number;
}

export function contextLimitError(value: unknown): ContextLimit | undefined {
  const record = value && typeof value === "object" ? value as Record<string, unknown> : undefined;
  const response = record?.response && typeof record.response === "object" ? record.response as Record<string, unknown> : undefined;
  const detail = record?.error ?? response?.error ?? value;
  const error = detail && typeof detail === "object" ? detail as Record<string, unknown> : undefined;
  const message = typeof detail === "string" ? detail : typeof error?.message === "string" ? error.message : "";
  const code = error?.code ?? record?.code;
  if (code !== "context_length_exceeded" && !/prompt is too long|input is too long for requested model|exceeded model token limit|maximum context length|context (?:window|length|limit).*(?:exceed|exhaust)|exceed(?:s|ed)?.*context (?:window|length|limit)|input length and [`'"]?max_tokens[`'"]? exceed context limit/i.test(message)) return undefined;
  const kimi = /model token limit:\s*([\d,]+)\s*\(requested:\s*([\d,]+)/i.exec(message);
  const anthropic = /prompt is too long[^\d]*([\d,]+)\s*tokens?\s*>\s*([\d,]+)/i.exec(message);
  const openai = /maximum context length is\s*([\d,]+).*?requested\s*([\d,]+)/i.exec(message);
  const numeric = (text?: string): number | undefined => {
    const count = Number(text?.replaceAll(",", ""));
    return Number.isSafeInteger(count) && count > 0 ? count : undefined;
  };
  const limitTokens = numeric(kimi?.[1] ?? anthropic?.[2] ?? openai?.[1]);
  const requestedTokens = numeric(kimi?.[2] ?? anthropic?.[1] ?? openai?.[2]);
  return {
    ...(limitTokens !== undefined ? { limitTokens } : {}),
    ...(requestedTokens !== undefined ? { requestedTokens } : {})
  };
}

/** Normalize context-limit errors for native Harness recovery. */
export function nativeContextLimitMessage(limit: ContextLimit): string {
  return limit.requestedTokens && limit.limitTokens
    ? `prompt is too long: ${limit.requestedTokens} tokens > ${limit.limitTokens} maximum`
    : "prompt is too long: the model context window was exceeded";
}
