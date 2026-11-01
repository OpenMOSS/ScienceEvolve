import type { HarnessId, HarnessPurpose } from "./contracts.js";
import type { ProtocolProxyFailure } from "../protocol-router.js";
import { redactTrace } from "../utils.js";
import {
  AgentApiError,
  AgentAuthenticationError,
  AgentInterruptedError,
  AgentRequestConfigurationError,
  AgentTimeoutError
} from "../agent-errors.js";

export type HarnessRuntimeErrorCode =
  | "HARNESS_NOT_FOUND"
  | "HARNESS_UNAVAILABLE"
  | "HARNESS_CAPABILITY_UNSUPPORTED"
  | "HARNESS_CONFIGURATION_INVALID"
  | "HARNESS_EVENT_STREAM_FAILED"
  | "HARNESS_PROCESS_EXITED"
  | "HARNESS_CONTRACT_VIOLATION"
  | "INVOCATION_ATTEMPT_BUDGET_EXHAUSTED"
  | "SESSION_RESUME_FAILED"
  | "INVOCATION_INPUT_STAGING_FAILED"
  | "CONTEXT_INJECTION_LIMIT_EXCEEDED"
  | "PERMISSION_PROMPT_INJECTION_FAILED"
  | "MODEL_AUTHENTICATION_FAILED"
  | "MODEL_PROVIDER_FAILED"
  | "MODEL_CONTEXT_LIMIT_EXCEEDED"
  | "PROTOCOL_TOOL_ARGUMENTS_INVALID"
  | "PROTOCOL_RECOVERY_EXHAUSTED"
  | "PROTOCOL_ROUTE_FAILED"
  | "INVOCATION_TIMED_OUT"
  | "TOOL_EXECUTION_TIMED_OUT"
  | "INVOCATION_INTERRUPTED";

export type HarnessRuntimeErrorSource =
  | "registry"
  | "adapter"
  | "process"
  | "inputs"
  | "policy"
  | "gateway"
  | "runtime";

export interface HarnessRuntimeErrorOptions extends ErrorOptions {
  retryable?: boolean;
  source?: HarnessRuntimeErrorSource;
  diagnosticRef?: string;
}

export class HarnessRuntimeError extends Error {
  readonly retryable: boolean;
  readonly source: HarnessRuntimeErrorSource;
  readonly safeMessage: string;
  readonly exitCode?: number | null;
  readonly signal?: NodeJS.Signals | null;
  readonly harnessId?: HarnessId;
  readonly diagnosticRef?: string;

  constructor(
    readonly code: HarnessRuntimeErrorCode,
    message: string,
    readonly details: Record<string, unknown> = {},
    options: HarnessRuntimeErrorOptions = {}
  ) {
    super(message, options);
    this.name = "HarnessRuntimeError";
    this.safeMessage = message;
    this.retryable = options.retryable ?? defaultRetryable(code);
    this.source = options.source ?? defaultSource(code);
    this.exitCode = typeof details.exitCode === "number" || details.exitCode === null
      ? details.exitCode as number | null
      : undefined;
    this.signal = typeof details.signal === "string" || details.signal === null
      ? details.signal as NodeJS.Signals | null
      : undefined;
    this.harnessId = typeof details.harnessId === "string" ? details.harnessId : undefined;
    this.diagnosticRef = options.diagnosticRef;
  }
}

/** Trusted driver evidence: no native input/codec write was attempted. It is
 * safe to revoke this turn while retaining its idle process and session. */
export class ResidentInputPreparationError extends Error {
  constructor(cause: unknown) {
    super("Resident input preparation failed before native submission", { cause });
    this.name = "ResidentInputPreparationError";
  }
}

/** The selected gateway emitted a tool-call argument that is not valid JSON. */
export class ProtocolToolArgumentsError extends HarnessRuntimeError {
  constructor(
    harnessId: HarnessId,
    details: Record<string, unknown> = {},
    options: HarnessRuntimeErrorOptions = {}
  ) {
    super(
      "PROTOCOL_TOOL_ARGUMENTS_INVALID",
      "Gateway returned invalid JSON tool arguments",
      { harnessId, ...details },
      { ...options, source: "gateway", retryable: options.retryable ?? true }
    );
    this.name = "ProtocolToolArgumentsError";
  }
}

/** The bounded correction attempt also failed with the same protocol error. */
export class ProtocolRecoveryExhaustedError extends HarnessRuntimeError {
  constructor(
    harnessId: HarnessId,
    details: Record<string, unknown> = {},
    options: HarnessRuntimeErrorOptions = {}
  ) {
    super(
      "PROTOCOL_RECOVERY_EXHAUSTED",
      "Gateway continued to return invalid JSON tool arguments after one automatic Session recovery" +
        (typeof details.protocolMessage === "string" ? `: ${redactTrace(details.protocolMessage).slice(0, 500)}` : ""),
      { harnessId, ...details, recoveryAttempted: true },
      { ...options, source: "gateway", retryable: false }
    );
    this.name = "ProtocolRecoveryExhaustedError";
  }
}

export function isProtocolToolArgumentsFailure(error: unknown): error is ProtocolToolArgumentsError {
  return error instanceof ProtocolToolArgumentsError ||
    (error instanceof HarnessRuntimeError && error.code === "PROTOCOL_TOOL_ARGUMENTS_INVALID");
}

export function isProtocolRecoveryExhausted(error: unknown): boolean {
  return error instanceof ProtocolRecoveryExhaustedError ||
    (error instanceof HarnessRuntimeError && error.code === "PROTOCOL_RECOVERY_EXHAUSTED");
}

/** Only the trusted driver can issue this after native completion, authority
 * revocation, and an idle protocol barrier. It never certifies task success. */
export class ResidentTurnRetryableError extends HarnessRuntimeError {
  constructor(error: HarnessRuntimeError) {
    super(error.code, error.safeMessage, { ...error.details, nativeTurnIdle: true }, {
      source: error.source, retryable: true, cause: error
    });
    this.name = "ResidentTurnRetryableError";
  }
}

export function transientHarnessFailure(error: unknown): HarnessRuntimeError | undefined {
  const seen = new Set<unknown>();
  for (let current = error; current && !seen.has(current);) {
    seen.add(current);
    if (current instanceof HarnessRuntimeError) {
      if (current.retryable && [
        "MODEL_PROVIDER_FAILED", "PROTOCOL_TOOL_ARGUMENTS_INVALID",
        "PROTOCOL_ROUTE_FAILED", "INVOCATION_TIMED_OUT"
      ].includes(current.code)) return current;
      // An explicit permanent error must not acquire retry permission from a
      // stale nested provider error.
      if (!current.retryable) return undefined;
    }
    current = current instanceof Error ? current.cause : undefined;
  }
  return undefined;
}

export function harnessRecoveryDelayMs(attempt: number): number {
  return Math.min(60_000, 1_000 * 2 ** Math.min(6, Math.max(0, attempt - 1)));
}

/** Preserve the proxy's typed failure across every native Harness codec. */
export function proxyFailureError(failure: ProtocolProxyFailure, harnessId: string, cause?: unknown): HarnessRuntimeError {
  const details = { harnessId, protocolMessage: failure.message, sourceProtocol: failure.sourceProtocol,
    targetProtocol: failure.targetProtocol, model: failure.model, httpStatus: failure.httpStatus,
    toolName: failure.toolName, toolIndex: failure.toolIndex };
  const options = { source: "gateway" as const, cause: cause instanceof Error ? cause : undefined };
  if (failure.code === "PROTOCOL_TOOL_ARGUMENTS_INVALID") return new ProtocolToolArgumentsError(harnessId, details, options);
  if (failure.code === "CONTEXT_INJECTION_LIMIT_EXCEEDED") return new HarnessRuntimeError(failure.code,
    failure.message, { ...details, requestedTokens: failure.requestedTokens, limitTokens: failure.limitTokens }, { ...options, source: "inputs", retryable: false });
  if (failure.code === "MODEL_CONTEXT_LIMIT_EXCEEDED") return new HarnessRuntimeError(failure.code,
    "Model context window exceeded; native compaction did not recover the request",
    { ...details, requestedTokens: failure.requestedTokens, limitTokens: failure.limitTokens }, { ...options, retryable: false });
  if (failure.code === "MODEL_REQUEST_INVALID") return new HarnessRuntimeError("HARNESS_CONFIGURATION_INVALID",
    "Model provider rejected the request configuration", details, { ...options, retryable: false });
  return new HarnessRuntimeError(failure.code, failure.code === "MODEL_AUTHENTICATION_FAILED"
    ? "Model provider authentication failed" : "Model provider request failed", details,
    { ...options, retryable: failure.code === "MODEL_PROVIDER_FAILED" });
}

export class UnknownHarnessError extends HarnessRuntimeError {
  constructor(harnessId: HarnessId) {
    super("HARNESS_NOT_FOUND", `Unknown harness: ${harnessId}`, { harnessId }, {
      source: "registry"
    });
    this.name = "UnknownHarnessError";
  }
}

export class HarnessPurposeUnsupportedError extends HarnessRuntimeError {
  constructor(harnessId: HarnessId, purpose: HarnessPurpose) {
    super(
      "HARNESS_CAPABILITY_UNSUPPORTED",
      `Harness ${harnessId} does not support purpose ${purpose}`,
      { harnessId, purpose },
      { source: "registry" }
    );
    this.name = "HarnessPurposeUnsupportedError";
  }
}

export class HarnessEventStreamError extends HarnessRuntimeError {
  constructor(harnessId: HarnessId, message: string, options?: ErrorOptions) {
    super("HARNESS_EVENT_STREAM_FAILED", message, { harnessId }, {
      ...options,
      source: "adapter"
    });
    this.name = "HarnessEventStreamError";
  }
}

export class SessionResumeError extends HarnessRuntimeError {
  constructor(harnessId: HarnessId, nativeId: string, options?: ErrorOptions) {
    super(
      "SESSION_RESUME_FAILED",
      `Unable to resume the ${harnessId} session`,
      { harnessId },
      { ...options, source: "adapter" }
    );
    // Keep the native identity out of the public safe message/details. Some
    // Harnesses use an absolute artifact path as their native Session ID.
    void nativeId;
    this.name = "SessionResumeError";
  }
}

export function isSessionResumeFailure(error: unknown): boolean {
  return error instanceof SessionResumeError ||
    (error instanceof HarnessRuntimeError && error.code === "SESSION_RESUME_FAILED");
}

/** Convert every native/legacy driver failure at the Facade boundary. */
export function normalizeHarnessRuntimeError(
  error: unknown,
  harnessId: HarnessId
): HarnessRuntimeError {
  if (error instanceof HarnessRuntimeError) return error;
  const cause = error instanceof Error ? error : new Error(String(error));
  if (error instanceof AgentInterruptedError) {
    return new HarnessRuntimeError(
      "INVOCATION_INTERRUPTED",
      "Harness invocation was interrupted",
      { harnessId },
      { source: "process", cause }
    );
  }
  if (error instanceof AgentTimeoutError) {
    return new HarnessRuntimeError(
      "INVOCATION_TIMED_OUT",
      "Harness invocation exceeded its activity deadline",
      { harnessId },
      { source: "process", cause }
    );
  }
  if (error instanceof AgentAuthenticationError ||
    (error instanceof AgentApiError && error.kind === "authentication")) {
    return new HarnessRuntimeError(
      "MODEL_AUTHENTICATION_FAILED",
      "Model provider authentication failed",
      { harnessId },
      { source: "gateway", cause }
    );
  }
  if (error instanceof AgentApiError) {
    return new HarnessRuntimeError(
      "MODEL_PROVIDER_FAILED",
      "Model provider request failed",
      { harnessId },
      { source: "gateway", cause }
    );
  }
  if (error instanceof AgentRequestConfigurationError) {
    return new HarnessRuntimeError(
      "HARNESS_CONFIGURATION_INVALID",
      "Harness invocation configuration is invalid",
      { harnessId },
      { source: "adapter", cause }
    );
  }
  return new HarnessRuntimeError(
    "HARNESS_CONTRACT_VIOLATION",
    "Harness Adapter failed outside the stable runtime error contract",
    { harnessId },
    { source: "adapter", cause }
  );
}

function defaultRetryable(code: HarnessRuntimeErrorCode): boolean {
  return [
    "HARNESS_PROCESS_EXITED",
    "SESSION_RESUME_FAILED",
    "MODEL_PROVIDER_FAILED",
    "PROTOCOL_TOOL_ARGUMENTS_INVALID",
    "PROTOCOL_ROUTE_FAILED",
    "INVOCATION_TIMED_OUT",
    "TOOL_EXECUTION_TIMED_OUT"
  ].includes(code);
}

function defaultSource(code: HarnessRuntimeErrorCode): HarnessRuntimeErrorSource {
  if (code === "MODEL_CONTEXT_LIMIT_EXCEEDED") return "gateway";
  if (code === "INVOCATION_ATTEMPT_BUDGET_EXHAUSTED") return "runtime";
  if (code === "HARNESS_NOT_FOUND" || code === "HARNESS_CAPABILITY_UNSUPPORTED" ||
    code === "HARNESS_UNAVAILABLE" || code === "HARNESS_CONFIGURATION_INVALID") return "registry";
  if (code === "INVOCATION_INPUT_STAGING_FAILED") return "inputs";
  if (code === "PERMISSION_PROMPT_INJECTION_FAILED") return "policy";
  if (code === "PROTOCOL_ROUTE_FAILED" || code === "PROTOCOL_TOOL_ARGUMENTS_INVALID" || code === "PROTOCOL_RECOVERY_EXHAUSTED") return "gateway";
  if (code === "HARNESS_PROCESS_EXITED" || code === "INVOCATION_INTERRUPTED" ||
    code === "INVOCATION_TIMED_OUT" || code === "TOOL_EXECUTION_TIMED_OUT") return "process";
  return "adapter";
}
