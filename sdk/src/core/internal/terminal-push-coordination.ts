import type { TerminalPushCoordinationScope } from "../types.js";

export function isTerminalPushCoordinationScope(value: unknown): value is TerminalPushCoordinationScope {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return Object.keys(record).length === 5 && typeof record.incidentId === "string" &&
    record.incidentId.trim() === record.incidentId && record.incidentId.length > 0 && record.incidentId.length <= 1024 &&
    !record.incidentId.includes("\0") && Number.isSafeInteger(record.coordinatorEpoch) && Number(record.coordinatorEpoch) >= 1 &&
    Number.isSafeInteger(record.level) && Number(record.level) >= 0 && (record.role === "leader" || record.role === "main") &&
    typeof record.canRequestUser === "boolean" && (record.role === "main" || record.canRequestUser === false);
}

/** The system supplies the original hierarchy and reliable
 * lifecycle. The Agent chooses retry/escalation/user help and writes its own
 * finish/memory; the system must never substitute a business or Git decision. */
export function assertTerminalPushCoordinationControl(context: {
  terminalPushCoordination?: unknown; terminalPushObservation?: unknown;
  kind: string; agent: string; stateVersion: number; candidates: readonly string[]; decisionBy: string;
  allowAgentGitActions?: boolean; allowUserIntervention: boolean; canComplete: boolean; requireBridge?: boolean;
  collaboration?: unknown; mainCapabilities?: unknown; canonicalFinalIntegration?: boolean; scopedAgentRouting?: boolean;
  allowFinishRoute?: boolean; allowWorkflowReconfiguration?: boolean; allowAgentOrchestrationReconfiguration?: boolean;
  workflowAuthoringPath?: string; tasklessRouteTargets?: readonly string[];
}): void {
  if (context.terminalPushCoordination === undefined) return;
  const scope = context.terminalPushCoordination;
  if (!isTerminalPushCoordinationScope(context.terminalPushCoordination)) throw new Error("Invalid retained terminalPushCoordination scope");
}
