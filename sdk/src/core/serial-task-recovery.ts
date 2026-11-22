import type { AgentName, ProjectState } from "./types.js";
import { sessionRecoveryNote } from "./internal/shared/session-recovery.js";
import { redactTrace } from "./utils.js";

/** Recovery facts belong to this task's previous invocation, not to the role's older work. */
export function serialTaskRecoveryMessage(state: ProjectState, agent: AgentName, previousInvocationId?: string): string | undefined {
  const execution = state.activeAgentExecution;
  if (!previousInvocationId || execution?.agent !== agent) return undefined;
  const failure = state.agentFailureHistory?.[agent]?.filter(record => record.invocationId === previousInvocationId).at(-1);
  const controlFailure = execution.terminalControlRecovery;
  if (!failure && !controlFailure) return undefined;
  const checkpoints = (state.workspaceCheckpoints ?? []).filter(checkpoint => checkpoint.agent === agent && checkpoint.invocationId === previousInvocationId);
  const error = redactTrace(failure?.error ?? controlFailure!.reason).slice(0, 4_000);
  return [
    `Retained original task: ${execution.id}; Agent: ${agent}; previous invocation: ${previousInvocationId}.`,
    `Previous failure or unfinished control: ${error}`,
    failure?.errorCode ? `Failure classification: ${failure.errorCode}; source: ${failure.errorSource ?? failure.errorType}.` : undefined,
    failure ? `Saved failure trace (project-relative): ${failure.tracePath}.` : undefined,
    ...checkpoints.map(checkpoint => `Saved workspace index (project-relative): checkpoints/${checkpoint.id}.json; ${checkpoint.fileCount} indexed files; status=${checkpoint.status}; incomplete=${checkpoint.incomplete}. Indexed output is unverified, not task acceptance.`),
    controlFailure ? `Unfinished control recorded at ${controlFailure.invocationId}: ${redactTrace(controlFailure.reason).slice(0, 4_000)}. Original-task terminal correction allowance used: ${controlFailure.attempts}/1. A finish_task receipt does not choose the next responsibility or complete the project. Record an authorized routing decision if one is ready; otherwise report the concrete blocker. No new automatic correction allowance is created by resuming this task.` : undefined,
    sessionRecoveryNote(error),
    "Continue the original assignment in the direct messages below; no new research scope is granted. Return a nonempty natural-language handoff describing actual completed work, evidence paths, unresolved operations and remaining responsibility. A plan or a blank final response is not a completed handoff."
  ].filter((line): line is string => Boolean(line)).join("\n");
}
