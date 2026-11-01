import { configuredModelContextWindow } from "./model-context.js";
import { HarnessRuntimeError } from "./harness-runtime/errors.js";
import type { InvocationInputs } from "./harness-runtime/contracts.js";

/** Conservative admission estimate for byte-fallback tokenizers. Include
 * Unicode normalization expansion too (e.g. compatibility ligatures), plus
 * framing. Never use characters/4 for admission, especially for Chinese/JSON.
 * This is an upper estimate, not a provider-reported usage count. */
export function injectionTokenEstimate(text: string): number {
  return Math.max(Buffer.byteLength(text, "utf8"), Buffer.byteLength(text.normalize("NFKD"), "utf8")) + (text ? 32 : 0);
}

export interface ContextReplacement {
  text: string;
  /** Successively coarser views. Every view must retain complete read paths. */
  alternatives: readonly string[];
}

export interface InjectionBudget {
  contextWindow: number;
  limitTokens: number;
  estimatedTokens: number;
  estimator: "utf8-byte-upper-bound-with-framing";
}

export function injectionBudget(prompt: string, window: unknown, extra = ""): InjectionBudget {
  const contextWindow = configuredModelContextWindow(window);
  return { contextWindow, limitTokens: Math.floor(contextWindow / 2),
    estimatedTokens: injectionTokenEstimate(prompt) + injectionTokenEstimate(extra) + 512,
    estimator: "utf8-byte-upper-bound-with-framing" };
}

export function assertInjectionBudget(prompt: string, window: unknown, extra = ""): InjectionBudget {
  const budget = injectionBudget(prompt, window, extra);
  if (budget.estimatedTokens > budget.limitTokens) {
    throw new HarnessRuntimeError("CONTEXT_INJECTION_LIMIT_EXCEEDED",
      "System input exceeds half of the selected model's context window; preserve the current task and reduce optional context before retrying.",
      { ...budget, promptBytes: Buffer.byteLength(prompt), overheadBytes: Buffer.byteLength(extra) },
      { source: "inputs", retryable: false });
  }
  return budget;
}

/** Only explicitly designated background views may be coarsened. Never slice
 * an assembled prompt: current tasks, corrections and permissions are exact. */
export function fitContextInjection(prompt: string, window: unknown, replacements: readonly ContextReplacement[] = [], extra = ""):
  { prompt: string; budget: InjectionBudget } {
  let result = prompt;
  const contextWindow = configuredModelContextWindow(window);
  // Coarsen optional views early to leave room for native-discovered tools.
  // Actual definitions are still counted and enforced by the gateway.
  const target = Math.max(0, Math.floor(contextWindow / 2) - Math.min(8192, Math.floor(contextWindow / 10)));
  for (const replacement of replacements) {
    let previous = replacement.text;
    for (const alternative of replacement.alternatives) {
      if (injectionBudget(result, window, extra).estimatedTokens <= target) break;
      if (!previous || !result.includes(previous) || injectionTokenEstimate(alternative) >= injectionTokenEstimate(previous)) continue;
      result = result.split(previous).join(alternative);
      previous = alternative;
    }
  }
  return { prompt: result, budget: assertInjectionBudget(result, window, extra) };
}

export function agentContextWindow(config: { model: string; gatewaySnapshot?: { modelContextWindows?: Record<string, number> } }): number {
  return configuredModelContextWindow(config.gatewaySnapshot?.modelContextWindows?.[config.model]);
}

/** Only call for the Storage-produced context, never for user/task text. */
export function legacyContextBackground(context: string): ContextReplacement[] {
  const section = context.match(/<project-context-index>[\s\S]*?<\/project-context-index>/)?.[0];
  const reference = section?.match(/Context index: ([^\r\n]+)/)?.[1];
  return section && reference ? [{ text: section,
    alternatives: [`<project-context-index>Complete expandable project history index: ${reference}. All original records remain readable.</project-context-index>`] }] : [];
}

export function contextReplacements(inputs: InvocationInputs): ContextReplacement[] {
  return [
    ...(inputs.contextBackgrounds ?? []),
    ...(inputs.additionalContextIndexes ?? []).map(index => ({ text: index.preview, alternatives: [index.compactPreview, index.minimalPreview] })),
    ...(inputs.contextIndex ? [{ text: inputs.contextIndex.preview, alternatives: [inputs.contextIndex.compactPreview, inputs.contextIndex.minimalPreview] }] : []),
    ...(inputs.workflowContext?.compactPreview ? [{ text: inputs.workflowContext.preview, alternatives: [inputs.workflowContext.compactPreview] }] : [])
  ];
}
