import type { TerminalPushObservationScope } from "../types.js";

export function isTerminalPushObservationScope(value: unknown): value is TerminalPushObservationScope {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return Object.keys(record).length === 1 && typeof record.operationId === "string" &&
    record.operationId.trim() === record.operationId && record.operationId.length > 0 &&
    record.operationId.length <= 1024 && !record.operationId.includes("\0");
}

/** Retain the original operation identity for the Agent's receipt inspection.
 * The context supplies facts without clipping configured tool capabilities. */
export function assertTerminalPushObservationControl(context: {
  terminalPushObservation?: unknown;
  terminalPushCoordination?: unknown;
  kind: string;
  candidates: readonly string[];
  decisionBy: string;
  allowAgentGitActions?: boolean;
  allowUserIntervention: boolean;
  canComplete: boolean;
  requireBridge?: boolean;
  collaboration?: unknown;
  mainCapabilities?: unknown;
  canonicalFinalIntegration?: boolean;
  scopedAgentRouting?: boolean;
  allowFinishRoute?: boolean;
  allowWorkflowReconfiguration?: boolean;
  allowAgentOrchestrationReconfiguration?: boolean;
  workflowAuthoringPath?: string;
  tasklessRouteTargets?: readonly string[];
}): void {
  if (context.terminalPushObservation === undefined) return;
  if (!isTerminalPushObservationScope(context.terminalPushObservation)) throw new Error("Invalid retained terminalPushObservation scope");
}
