import type { AgentGitDeliveryStatus } from "./agent-git-delivery.js";

const gitTools = new Set(["git_push", "git_get_operation", "git_reconcile_push", "github_create_pr",
  "github_get_pr", "github_merge_pr", "github_update_pr", "github_close_pr", "git_prepare_conflict"]);

/** A successful MCP query is not a successful push or a completed task. */
export function agentGitResultSummary(tool: string, result: unknown) {
  if (!gitTools.has(tool)) return undefined;
  const value = result && typeof result === "object" ? result as Record<string, unknown> : {};
  const delivery = value.gitDelivery as AgentGitDeliveryStatus | undefined;
  const status = typeof value.status === "string" ? value.status : "unknown";
  const outcome = tool === "github_merge_pr" && status === "merged" && !value.localSynchronization
    ? "remote_success_local_pending" : status;
  const operation = value.operation as { id?: unknown } | undefined;
  const checkpoint = value.checkpoint as { operationMarker?: unknown } | undefined;
  const operationId = value.operationId ?? operation?.id ?? checkpoint?.operationMarker;
  return { tool, outcome, completesTask: false,
    ...(typeof operationId === "string" ? { operationId } : {}),
    ...(delivery ? { gitDeliveryReady: delivery.ready, missingActions: delivery.missingActions,
      unresolvedOperations: delivery.unresolvedOperations,
      nextActions: delivery.unresolvedOperations.map(operation => operation.nextAction) } : {}),
    ...(tool === "git_get_operation" ? { observationOnly: true } : {}) };
}

export function agentGitResultText(tool: string, result: unknown): string {
  const summary = agentGitResultSummary(tool, result);
  if (!summary) return "";
  return `Git result: ${summary.outcome}. ` +
    (summary.gitDeliveryReady === undefined ? "Git delivery readiness has not been established by this response. "
      : `Git delivery ready at this observation: ${summary.gitDeliveryReady}. `) +
    (summary.missingActions?.length ? `Still required: ${summary.missingActions.join("; ")}. ` : "") +
    "This tool response does not complete the task. " +
    (summary.observationOnly ? "This journal query does not reconcile or finalize an operation. " : "") +
    (summary.nextActions?.length ? `Available original-operation observations: ${JSON.stringify(summary.nextActions)}. ` : "");
}
