import { describe, expect, it } from "vitest";
import { HarnessRuntimeError, ProtocolRecoveryExhaustedError, ProtocolToolArgumentsError,
  formatHarnessError, harnessRecoveryDelayMs, proxyFailureError, transientHarnessFailure } from "../../src/core/harness-runtime/errors.js";

describe("shared Harness transport recovery", () => {
  it("preserves the original parsing cause behind a recovery failure without credentials or cyclic causes", () => {
    const original = new Error("Invalid JSON at position 5564; Authorization: Bearer private-token");
    const recovery = new HarnessRuntimeError("SESSION_RESUME_FAILED", "Original Session recovery failed", {}, { cause: original });
    original.cause = recovery;
    const message = formatHarnessError(recovery);
    expect(message).toContain("Original Session recovery failed");
    expect(message).toContain("Invalid JSON at position 5564");
    expect(message).not.toContain("private-token");
    expect(message.match(/Original Session recovery failed/g)).toHaveLength(1);
  });

  it("includes the typed parser feedback when a final recovery error wraps a protocol failure", () => {
    const parsing = new ProtocolToolArgumentsError("pi", { protocolMessage: "Unterminated string at position 5564" });
    const final = new HarnessRuntimeError("SESSION_RESUME_FAILED", "Session continuation failed", {}, { cause: parsing });
    expect(formatHarnessError(final)).toContain("Session continuation failed");
    expect(formatHarnessError(final)).toContain("Unterminated string at position 5564");
  });

  it.each(["codex", "pi", "dsh"])("preserves typed provider failures for %s without relying on native error text", harnessId => {
    const failure = proxyFailureError({ code: "MODEL_PROVIDER_FAILED", message: "upstream temporarily unavailable",
      httpStatus: 503, sourceProtocol: "responses", targetProtocol: "chat-completions", model: "neutral-model" }, harnessId,
    new Error("Native driver terminal failure"));
    expect(failure).toMatchObject({ code: "MODEL_PROVIDER_FAILED", retryable: true, source: "gateway",
      details: { harnessId, httpStatus: 503 } });
    expect(transientHarnessFailure(new Error("Scoped task wrapper", { cause: failure }))).toBe(failure);
  });

  it.each(["MODEL_AUTHENTICATION_FAILED", "MODEL_REQUEST_INVALID"] as const)("keeps %s outside automatic transport recovery", code => {
    const failure = proxyFailureError({ code, message: "Permanent provider request error", httpStatus: 401,
      sourceProtocol: "responses", targetProtocol: "responses", model: "neutral-model" }, "codex");
    expect(failure.retryable).toBe(false);
    expect(transientHarnessFailure(failure)).toBeUndefined();
  });

  it("does not convert an authority contract failure or an untyped message into a gateway retry", () => {
    const failure = new HarnessRuntimeError("HARNESS_CONTRACT_VIOLATION", "Unexpected native authority",
      {}, { cause: new ProtocolToolArgumentsError("pi") });
    expect(transientHarnessFailure(failure)).toBeUndefined();
    expect(transientHarnessFailure(new Error("502 Bad Gateway: invalid JSON tool arguments"))).toBeUndefined();
  });

  it("honors exhausted protocol correction while retaining bounded transport backoff", () => {
    expect(transientHarnessFailure(new ProtocolRecoveryExhaustedError("dsh", {}, { cause: new ProtocolToolArgumentsError("dsh") }))).toBeUndefined();
    expect([1, 2, 3, 7, 100_000].map(harnessRecoveryDelayMs)).toEqual([1_000, 2_000, 4_000, 60_000, 60_000]);
  });
});
