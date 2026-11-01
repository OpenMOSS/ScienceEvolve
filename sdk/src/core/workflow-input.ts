import type { ProjectState, ProjectUserInput } from "./types.js";

/** Current communications are never context previews or summaries. */
export interface WorkflowDirectMessage {
  sender: string;
  body: string;
  sourcePath?: string;
}

export interface MinimalWorkflowInput {
  projectEntry: string;
  messages: WorkflowDirectMessage[];
}

export function workflowMessagesText(messages: readonly WorkflowDirectMessage[]): string {
  return messages.map(message => `来源：${message.sender}\n内容：${message.body}`).join("\n\n");
}

export function minimalWorkflowInput(input: MinimalWorkflowInput): string {
  return `项目入口：${input.projectEntry}\n\n本轮直接消息：\n${workflowMessagesText(input.messages)}`;
}

/** Resolve from authoritative fields, never split an old assembled Markdown. */
export function serialWorkflowMessages(state: ProjectState, agent: string,
  userInputs: readonly ProjectUserInput[] = []): WorkflowDirectMessage[] {
  const messages: WorkflowDirectMessage[] = [];
  const pending = agent === "main" ? state.pendingMainDecision : undefined;
  const assignment = state.latestAssignment?.target === agent ? state.latestAssignment : undefined;
  const resumedByUser = agent === "main" && userInputs.length > 0 && (state.runCounts.main ?? 0) > 0;
  if (pending) {
    if (state.latestHandoff?.invocationId === pending.sourceInvocationId)
      messages.push({ sender: pending.sourceAgent, body: state.latestHandoff.body ?? state.latestHandoff.markdown });
    if (pending.diagnostic) messages.push({ sender: "OpenFARS", body: pending.diagnostic });
  } else if (assignment) {
    messages.push({ sender: "main", body: [assignment.message,
      ...(assignment.successCriteria?.length ? ["验收要求：", ...assignment.successCriteria] : [])].join("\n\n") });
  } else if (state.latestHandoff &&
    (state.orchestration.routes[state.latestHandoff.agent] ?? []).some(edge => edge.target === agent)) {
    messages.push({ sender: state.latestHandoff.agent, body: state.latestHandoff.body ?? state.latestHandoff.markdown });
  } else if (!resumedByUser) {
    messages.push({ sender: "user", body: state.requirement });
    if (state.inputDescription) messages.push({ sender: "user", body: state.inputDescription });
  }
  if (agent === "main") {
    messages.push(...userInputs.map(input => ({ sender: "user", body: input.message })));
    if (state.userIntervention?.status === "answered" && state.userIntervention.response !== undefined)
      messages.push({ sender: "user", body: state.userIntervention.response });
  }
  return messages;
}
