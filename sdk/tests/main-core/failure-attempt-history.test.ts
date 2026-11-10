import { describe, expect, it } from "vitest";
import { failureAttemptHistory, summarizeFailureAttempts, type FailureAttemptEvidence } from "../../src/core/internal/shared/failure-attempt-history.js";

function attempt(id: string, values: Partial<FailureAttemptEvidence> = {}): FailureAttemptEvidence {
  return { attemptId: id, projectId: "project", scope: "control", operation: "publish_artifact", status: "failed",
    agentId: "writer", executionId: "execution-a", ownershipEpoch: 1,
    startedAt: "2026-11-09T00:00:00Z", finishedAt: "2026-11-09T00:00:01Z", metadata: {}, ...values };
}

describe("failure evidence linkage", () => {
  it("keeps failures unconfirmed when another task or ownership epoch succeeds with the same tool", () => {
    const attempts = [attempt("old"), attempt("other-task", { executionId: "execution-b", status: "succeeded" }),
      attempt("new-epoch", { ownershipEpoch: 2, status: "succeeded" })];
    expect(summarizeFailureAttempts(attempts)).toMatchObject({ failedAttempts: 1, succeededAttempts: 2, unresolvedFailures: 1 });
    expect(failureAttemptHistory(attempts).resolved.size).toBe(0);
  });

  it("links an exact operation's later success across physical invocations and preserves its failures", () => {
    const attempts = [attempt("first", { invocationId: "native-a" }),
      attempt("second", { invocationId: "native-b", status: "succeeded" })];
    expect(summarizeFailureAttempts(attempts)).toMatchObject({ failedAttempts: 1, succeededAttempts: 1, unresolvedFailures: 0 });
    expect(failureAttemptHistory(attempts).resolved.has("first")).toBe(true);
  });

  it("does not infer recovery for a different call or for records lacking original ownership", () => {
    const attempts = [attempt("first", { metadata: { callId: "file-a" } }),
      attempt("other-file", { status: "succeeded", metadata: { callId: "file-b" } }),
      attempt("unbound", { executionId: undefined, agentId: undefined }),
      attempt("unbound-success", { executionId: undefined, agentId: undefined, status: "succeeded" })];
    expect(summarizeFailureAttempts(attempts).unresolvedFailures).toBe(2);
    expect(failureAttemptHistory(attempts).resolved.size).toBe(0);
  });

  it("accepts an explicit original failure reference without resolving unrelated or later failures", () => {
    const attempts = [attempt("first", { metadata: { callId: "old" } }), attempt("unrelated", { executionId: "execution-b" }),
      attempt("recovery", { invocationId: "native-recovery", metadata: { resolvedAttemptId: "first", callId: "new" }, status: "succeeded" }),
      attempt("later", { metadata: { callId: "old" } })];
    const history = failureAttemptHistory(attempts);
    expect([...history.resolved]).toEqual(["first"]);
    expect(summarizeFailureAttempts(attempts).unresolvedFailures).toBe(2);
    expect(attempts.filter(item => item.status === "failed")).toHaveLength(3);
  });
});
