/** Browser/server evidence contract; it has no runtime or storage dependency. */
export interface FailureAttemptEvidence {
  attemptId: string;
  projectId: string;
  scope: "git" | "resident" | "tool" | "control" | "usage" | "scheduler";
  operation: string;
  status: "failed" | "succeeded";
  agentId?: string;
  groupRunId?: string;
  nodeRunId?: string;
  coordinatorEpoch?: number;
  executionId?: string;
  ownershipEpoch?: number;
  taskId?: string;
  invocationId?: string;
  startedAt: string;
  finishedAt: string;
  metadata: Readonly<Record<string, unknown>>;
}

/** A shared tool name is not proof that two calls concern the same work. */
export function failureAttemptKey(attempt: Pick<FailureAttemptEvidence, "attemptId" | "projectId" | "scope" | "operation" | "metadata"> & Partial<FailureAttemptEvidence>): string {
  const owner = attempt.executionId ? ["execution", attempt.executionId, attempt.ownershipEpoch ?? null]
    : attempt.taskId ? ["task", attempt.taskId]
    : attempt.nodeRunId ? ["node", attempt.nodeRunId, attempt.coordinatorEpoch ?? null]
    : attempt.invocationId ? ["invocation", attempt.invocationId]
    : typeof attempt.metadata.operationId === "string" ? ["operation", attempt.metadata.operationId]
    : ["unbound-attempt", attempt.attemptId];
  return JSON.stringify([attempt.projectId, attempt.scope, attempt.operation, attempt.agentId ?? null,
    attempt.groupRunId ?? null, owner, attempt.metadata.operationId ?? null, attempt.metadata.callId ?? null]);
}

/** Input order is the saved event order. Missing provenance stays unconfirmed. */
export function failureAttemptHistory<T extends FailureAttemptEvidence>(attempts: readonly T[]) {
  const keys = new Map<string, string>();
  const resolved = new Set<string>();
  const groups = new Map<string, T[]>();
  const byId = new Map<string, T>();
  for (const attempt of attempts) {
    const original = typeof attempt.metadata.resolvedAttemptId === "string"
      ? byId.get(attempt.metadata.resolvedAttemptId) : undefined;
    const referencesFailure = attempt.status === "succeeded" && original?.status === "failed" &&
      original.projectId === attempt.projectId && original.scope === attempt.scope && original.operation === attempt.operation;
    const key = referencesFailure ? keys.get(original.attemptId)! : failureAttemptKey(attempt);
    const group = groups.get(key) ?? [];
    if (attempt.status === "succeeded") {
      for (const previous of group) if (previous.status === "failed") resolved.add(previous.attemptId);
    }
    group.push(attempt);
    groups.set(key, group);
    keys.set(attempt.attemptId, key);
    byId.set(attempt.attemptId, attempt);
  }
  return { keys, resolved, groups };
}

/** This summarizes historical evidence, not the project's current health. */
export function summarizeFailureAttempts<T extends FailureAttemptEvidence>(attempts: readonly T[]) {
  const { groups } = failureAttemptHistory(attempts);
  const operations = [...groups.values()].map(group => {
    const latest = group.at(-1)!;
    const failure = [...group].reverse().find(attempt => attempt.status === "failed");
    const success = [...group].reverse().find(attempt => attempt.status === "succeeded");
    return { scope: latest.scope, operation: latest.operation, status: latest.status, attemptId: latest.attemptId,
      attemptCount: group.length, failureCount: group.filter(attempt => attempt.status === "failed").length,
      startedAt: latest.startedAt, finishedAt: latest.finishedAt,
      ...(failure ? { lastFailureAt: failure.finishedAt } : {}), ...(success ? { lastSuccessAt: success.finishedAt } : {}) };
  }).sort((left, right) => left.finishedAt.localeCompare(right.finishedAt) || left.scope.localeCompare(right.scope) ||
    left.operation.localeCompare(right.operation) || left.attemptId.localeCompare(right.attemptId));
  const unresolvedFailures = operations.filter(operation => operation.status === "failed").length;
  const latestFailure = [...attempts].reverse().find(attempt => attempt.status === "failed");
  const failedAttempts = attempts.filter(attempt => attempt.status === "failed").length;
  return { currentStatus: unresolvedFailures ? "failed" as const : "healthy" as const, totalAttempts: attempts.length,
    failedAttempts, succeededAttempts: attempts.length - failedAttempts, unresolvedFailures,
    ...(attempts.length ? { latestAttempt: structuredClone(attempts.at(-1)!) } : {}),
    ...(latestFailure ? { latestFailure: structuredClone(latestFailure) } : {}), operations };
}
