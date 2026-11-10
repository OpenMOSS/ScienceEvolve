import type { AgentConfigMap, AgentOrchestrationTemplate, TimelineEvent } from "./types.js";

export interface WorkflowReplayConfigurationHistory {
  revisions: Array<{ revision: number; ts: string; orchestration: AgentOrchestrationTemplate }>;
  configurations: Array<{ revision: number; ts: string; collaborationSeq: number; agents: AgentConfigMap }>;
}

/** Only durable execution and configuration facts take part in the overview. */
export function isWorkflowReplayEvent(event: TimelineEvent): boolean {
  const type = (typeof event.data?.sourceType === "string" ? event.data.sourceType : event.type).replaceAll("_", ".");
  if (type === "agent.native.binding.opened" || type.startsWith("runtime.activity.")) return true;
  return /^(project\.(created|accepted|status|completed|paused|resumed|cancelled)|agent\.(execution\.|started|completed|failed|interrupted|queued|interrupting|run\.)|invocation\.(started|completed|failed)|retry\.scheduled|route\.|main\.assignment\.|workflow\.|node\.|group\.|execution\.|collaboration\.|scoped\.(group\.|agent\.|arrival\.|final\.|workflow\.|configuration\.|management\.)|user\.input\.(queued|delivered))/.test(type);
}

/** Keep identifiers and observed transitions; trace bodies and credentials are not playback data. */
export function compactWorkflowReplayEvent(event: TimelineEvent): TimelineEvent {
  const fields = ["sourceType", "collaborationSeq", "invocationId", "executionId", "agentId", "nodeId", "nodeRunId",
    "groupId", "groupRunId", "parentGroupRunId", "outerNodeRunId", "taskId", "routeScopeId", "ownershipEpoch",
    "sourceAgent", "sourceNodeId", "sourceRunId", "targetNodeId", "targetAgent", "target", "nextAgent",
    "arrivalRequestId", "status", "state", "outcome", "reason", "rationale", "cycle", "loopId", "batch",
    "iterations", "totalIterations", "maxIterations", "executionNumber", "candidateAgents", "decisionSourceAgent"];
  const data = Object.fromEntries(fields.flatMap(key => event.data?.[key] === undefined ? [] : [[key, event.data[key]]]));
  const binding = event.data?.binding as { agentId?: string; invocationId?: string; executionContext?: Record<string, unknown> } | undefined;
  for (const key of ["nodeRunId", "groupRunId", "executionId", "routeScopeId", "ownershipEpoch", "coordinatorEpoch"])
    if (binding?.executionContext?.[key] !== undefined) data[key] ??= binding.executionContext[key];
  if (binding?.agentId) data.agentId ??= binding.agentId;
  if (binding?.invocationId) data.invocationId ??= binding.invocationId;
  const route = event.data?.route as { kind?: string; activation?: { requestId?: string; targetNodeId?: string } } | undefined;
  if (route?.activation?.targetNodeId) {
    data.targetNodeId = route.activation.targetNodeId;
    if (route.activation.requestId) data.nextArrivalRequestId = route.activation.requestId;
  }
  const loop = event.data?.loop as { id?: string; exhausted?: boolean; batch?: number; iterations?: number; totalIterations?: number } | undefined;
  if (loop?.id) {
    data.loopId = loop.id;
    if (typeof loop.exhausted === "boolean") data.loopExhausted = loop.exhausted;
    for (const key of ["batch", "iterations", "totalIterations"] as const) if (typeof loop[key] === "number") data[key] = loop[key];
  }
  return { ...event, data };
}
