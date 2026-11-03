import { createHash } from "node:crypto";
import { applyGatewayReasoning, type GatewayReasoningDetection, type GatewayReasoningParameterPath,
  type GatewayModelReasoningConfig, type ResolvedGatewayReasoning } from "./gateway-reasoning.js";
import { redactTrace } from "./utils.js";

interface Target { url: string; apiKey: string; protocol: "responses" | "chat-completions" | "anthropic-messages" }
const INVALID = "__scienceevolve_invalid_reasoning_value__";
const VALUES = ["low", "medium", "high", "xhigh", "max"];

export function gatewayReasoningDiscoveryFingerprint(target: Target, model: string): string {
  return createHash("sha256").update(JSON.stringify([target.url, target.apiKey, target.protocol, model])).digest("hex");
}

/** Only explicit connection tests call this. A successful unknown-field request
 * is deliberately insufficient: many compatible providers silently ignore it. */
export async function discoverGatewayReasoning(target: Target, model: string,
  options: { fetch: typeof fetch; timeoutMs: number; signal?: AbortSignal; now?: () => number }): Promise<GatewayReasoningDetection> {
  const now = options.now ?? Date.now;
  const safe = (text: string) => redactTrace(text.replaceAll(target.apiKey, "[REDACTED]"));
  const result: GatewayReasoningDetection = { status: "unconfirmed", checkedAt: new Date(now()).toISOString(),
    fingerprint: gatewayReasoningDiscoveryFingerprint(target, model),
    message: "网关未提供可确认的参数校验证据（可能忽略参数或不支持所探测字段），使用模型服务端默认值，可手动配置", attempts: [] };
  const controller = new AbortController();
  const abort = () => controller.abort();
  options.signal?.throwIfAborted();
  options.signal?.addEventListener("abort", abort, { once: true });
  const deadline = setTimeout(abort, Math.min(45_000, Math.max(500, options.timeoutMs * 3)));
  const paths: GatewayReasoningParameterPath[] = target.protocol === "responses" ? ["reasoning.effort", "reasoning_effort"]
    : target.protocol === "anthropic-messages" ? ["output_config.effort", "thinking.effort"]
      : ["reasoning_effort", "chat_template_kwargs.reasoning_effort", "reasoning.effort"];
  const suffix = target.protocol === "responses" ? "responses" : target.protocol === "anthropic-messages" ? "messages" : "chat/completions";
  const prompt = "Compute 17 times 19. Reply with the result only.";
  const base: Record<string, unknown> = target.protocol === "responses" ? { model, input: prompt, max_output_tokens: 256, stream: false }
    : { model, messages: [{ role: "user", content: prompt }], max_tokens: 256, stream: false };
  const headers = { "content-type": "application/json", authorization: `Bearer ${target.apiKey}`,
    ...(target.protocol === "anthropic-messages" ? { "x-api-key": target.apiKey, "anthropic-version": "2023-06-01" } : {}) };
  const send = async (parameter?: GatewayReasoningParameterPath, value?: string) => {
    controller.signal.throwIfAborted();
    const requestSignal = AbortSignal.any([controller.signal, AbortSignal.timeout(Math.max(500, Math.min(15_000, options.timeoutMs)))]);
    const reasoning = parameter ? { parameter, value } as ResolvedGatewayReasoning : undefined;
    const response = await options.fetch(`${target.url.replace(/\/+$/, "")}/${suffix}`, {
      method: "POST", headers, redirect: "error", signal: requestSignal,
      body: JSON.stringify(applyGatewayReasoning(base, reasoning)) });
    const text = (await response.text()).slice(0, 32_000);
    let body: unknown;
    try { body = JSON.parse(text); } catch { body = undefined; }
    const error = body && typeof body === "object" ? (body as { error?: unknown }).error : undefined;
    const record = body && typeof body === "object" ? body as Record<string, unknown> : {};
    const accepted = response.ok && !error && (Array.isArray(record.choices) || Array.isArray(record.output) ||
      Array.isArray(record.content) || typeof record.output_text === "string");
    if (parameter) result.attempts.push({ parameter, value: value!, httpStatus: response.status,
      outcome: accepted ? "accepted" : safe(text).slice(0, 500) || `HTTP ${response.status}` });
    if ([401, 403, 404, 408, 429].includes(response.status) || response.status >= 500)
      throw new Error(`思考参数探测 HTTP ${response.status}：${safe(text).slice(0, 300)}`);
    return { accepted, status: response.status, text, body };
  };
  try {
    const baseline = await send();
    if (!baseline.accepted) throw new Error(`基础模型请求失败，无法判断思考参数：HTTP ${baseline.status} ${safe(baseline.text).slice(0, 300)}`);
    for (const parameter of paths) {
      const invalid = await send(parameter, INVALID);
      if (invalid.accepted) { result.attempts.at(-1)!.outcome = "invalid-value-accepted; parameter support unconfirmed"; continue; }
      const validation = invalid.text.toLowerCase();
      const names = parameter.split(".");
      const relevant = names.every(name => validation.includes(name)) || validation.includes(parameter);
      // Unsupported/unknown fields are not evidence of a supported effort enum.
      if (!relevant || /unknown (?:field|parameter)|unrecognized|extra_forbidden|extra inputs|not permitted|unsupported parameter/.test(validation) ||
        !/invalid|valid|literal|enum|one of|must be|should be|supported.*(?:value|effort)/.test(validation)) continue;
      const advertised = VALUES.filter(value => new RegExp(`["'\\x60]${value}["'\\x60]`, "i").test(invalid.text));
      const candidates = advertised.length ? advertised : ["high", "medium", "low"];
      const supported: string[] = [];
      for (const value of candidates) {
        const probe = await send(parameter, value);
        if (probe.accepted) supported.push(value);
      }
      if (!supported.length) continue;
      const defaultValue = supported.includes("high") ? "high" : supported.includes("medium") ? "medium" : supported.at(-1)!;
      const config: GatewayModelReasoningConfig = { parameter, defaultOptionId: defaultValue,
        options: supported.map(value => ({ id: value, label: value, value })) };
      result.status = "verified"; result.config = config;
      result.message = `参数已校验：${parameter}；默认 ${defaultValue}。这证明参数被校验并接受，不单独证明模型实际思考量。`;
      return result;
    }
    return result;
  } catch (error) {
    options.signal?.throwIfAborted();
    result.status = "failed";
    result.message = safe(controller.signal.aborted ? "思考参数探测超过总时限；未更改模型默认行为" : error instanceof Error ? error.message : String(error)).slice(0, 500);
    return result;
  } finally {
    clearTimeout(deadline);
    options.signal?.removeEventListener("abort", abort);
  }
}
