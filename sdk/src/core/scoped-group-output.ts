import type { WorkflowDirectMessage } from "./workflow-input.js";
import type { CredentialFreeProjectStateProjection, ScopedArrivalRecord } from "./collaboration-state/contracts.js";

/** sourceRunId names the predecessor arrival, not its execution or child run. */
export function scopedPredecessorOutput(projection: CredentialFreeProjectStateProjection, arrival: ScopedArrivalRecord): string | undefined {
  const source = projection.scopedArrivals?.find((item) => item.requestId === arrival.sourceRunId && item.groupRunId === arrival.groupRunId);
  if (!source) return undefined;
  if (source.status === "skipped") return `Explicitly skipped (not successful work): ${source.targetNodeId}/${source.requestId}`;
  if (source.status !== "completed") return undefined;
  if (source.targetKind === "agent") {
    const execution = projection.scopedExecutions?.find((item) => item.arrivalRequestId === source.requestId && item.groupRunId === source.groupRunId && item.status === "completed");
    if (!execution) return undefined;
    const report = projection.scopedAgentReports?.find((report) => report.executionId === execution.id && report.ownershipEpoch === execution.ownershipEpoch);
    return report ? availableReport(projection, report.output, execution) : undefined;
  }
  const child = projection.scopedGroupRuns?.find((group) => group.parentArrivalRequestId === source.requestId && group.parentGroupRunId === source.groupRunId && group.status === "completed");
  return child ? scopedGroupOutput(projection, child.id) : undefined;
}

/** Completed task reports and their actual Git delivery facts travel together. */
export function scopedGroupOutput(projection: CredentialFreeProjectStateProjection, groupRunId: string): string {
  const groups = new Set([groupRunId]);
  for (;;) {
    const children = (projection.scopedGroupRuns ?? []).filter((group) => group.parentGroupRunId && groups.has(group.parentGroupRunId) && !groups.has(group.id));
    if (!children.length) break;
    children.forEach((group) => groups.add(group.id));
  }
  const owners = new Map((projection.scopedExecutions ?? []).filter((execution) => groups.has(execution.groupRunId) && execution.status === "completed")
    .map((execution) => [execution.id, execution.ownershipEpoch]));
  const reports = (projection.scopedAgentReports ?? []).filter((report) => owners.get(report.executionId) === report.ownershipEpoch);
  const skips = (projection.scopedArrivals ?? []).filter((arrival) => groups.has(arrival.groupRunId) && arrival.status === "skipped");
  return [reports.map(report => availableReport(projection, report.output, projection.scopedExecutions!.find(item => item.id === report.executionId)!)).filter(Boolean).join("\n\n"),
    skips.length ? `Explicitly skipped (not successful work): ${skips.map((arrival) => `${arrival.targetNodeId}/${arrival.requestId}`).join(", ")}` : ""]
    .filter(Boolean).join("\n\n") || "Necessary paths reached Finish; no business report was supplied.";
}

function availableReport(projection: CredentialFreeProjectStateProjection, output: string,
  execution: NonNullable<CredentialFreeProjectStateProjection["scopedExecutions"]>[number]): string {
  const merge = projection.scopedAgentMerges?.find(item => item.executionId === execution.id);
  return merge ? output : `${output}\n\nSource: ${execution.agentId}, task ${execution.id}, directory ${execution.worktreePath}. No merged delivery has been confirmed. Materials may be uncommitted or unavailable after directory cleanup; use the existing files according to the current task.`;
}

/** All completed, relevant predecessors in this scheduling batch. Readiness
 * and arrivals are untouched; message selection never creates a dependency. */
export function scopedPredecessorMessages(projection: CredentialFreeProjectStateProjection,
  arrival: ScopedArrivalRecord, routes: Record<string, Array<{ target: string; kind: string }>>): WorkflowDirectMessage[] {
  const candidates = (projection.scopedArrivals ?? []).filter(source =>
    source.groupRunId === arrival.groupRunId && source.status === "completed" &&
    (source.requestId === arrival.sourceRunId ||
      (routes[source.targetNodeId] ?? []).some(edge => edge.kind === "strong" && edge.target === arrival.targetNodeId) &&
      JSON.stringify(source.pathContext?.loops ?? {}) === JSON.stringify(arrival.pathContext?.loops ?? {})));
  return candidates.flatMap(source => {
    const body = scopedPredecessorOutput(projection, { ...arrival, sourceRunId: source.requestId });
    return body === undefined ? [] : [{ sender: source.agentId ?? source.targetNodeId, body }];
  });
}
