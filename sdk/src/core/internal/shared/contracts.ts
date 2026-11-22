export type MainControlMode = "autonomous" | "weak-branch";

export type MainWakeReason =
  | "initial"
  | "deterministic-route"
  | "weak-branch"
  | "termination"
  | "exception"
  | "route-missing"
  | "user"
  | "workflow-reconfigured"
  | "workflow-reconfiguration-rejected"
  | "loop-limit";

export interface WorkflowLoop {
  id: string;
  from: string;
  to: string;
  maxIterations: number;
  exitTo: string;
}

export interface MainCapabilityInput {
  wakeReason: MainWakeReason;
  configuredAgents: readonly string[];
  candidateAgents?: readonly string[];
  allowAnyAgent?: boolean;
  allowMainReconfiguration: boolean;
  allowUserIntervention: boolean;
  completionEligible: boolean;
}

export interface MainCapabilitySnapshot {
  schemaVersion: 1;
  controlMode: MainControlMode;
  routeCandidates: string[];
  canReconfigure: boolean;
  canComplete: boolean;
  canRequestUser: boolean;
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

/**
 * Produce the one authoritative capability snapshot for a Main invocation.
 * Prompt construction, control schemas, action validation and persistence must
 * consume this snapshot instead of inferring permissions independently.
 */
export function deriveMainCapabilities(input: MainCapabilityInput): MainCapabilitySnapshot {
  const ordinaryAgents = unique(input.configuredAgents).filter((agent) => agent !== "main" && agent !== "finish");
  const requestedCandidates = unique(input.candidateAgents ?? []).filter(
    (candidate) => candidate === "main" || candidate === "finish" || ordinaryAgents.includes(candidate)
  );
  const restrictedWake = input.wakeReason === "weak-branch" || input.wakeReason === "route-missing";
  const controlMode: MainControlMode = restrictedWake && input.allowAnyAgent !== true && requestedCandidates.length >= 2
    ? "weak-branch"
    : "autonomous";
  const routeCandidates = controlMode === "weak-branch" ? requestedCandidates : ordinaryAgents;

  return {
    schemaVersion: 1,
    controlMode,
    routeCandidates,
    canReconfigure: input.allowMainReconfiguration,
    canComplete: controlMode === "autonomous" && input.completionEligible,
    canRequestUser: controlMode === "autonomous" && input.allowUserIntervention
  };
}

export const SHARED_RUNTIME_EVENT_NAMES = [
  "workflow.loop.batch.started",
  "workflow.loop.iteration",
  "workflow.loop.exhausted",
  "workflow.reconfigured"
] as const;

export type SharedRuntimeEventName = (typeof SHARED_RUNTIME_EVENT_NAMES)[number];
