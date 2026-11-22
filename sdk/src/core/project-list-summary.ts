import type { ProjectView } from "./types.js";

/** Display facts for cards and the repository library; details stay on GET /:id. */
export function projectListSummary(project: Omit<ProjectView, "collaboration"> & { collaboration?: { stateRevision?: number } }) {
  const usage = project.tokenUsage;
  return {
    id: project.id, title: project.title, requirement: project.requirement,
    status: project.status, phase: project.phase, cycle: project.cycle, turn: project.turn,
    createdAt: project.createdAt, updatedAt: project.updatedAt, archivedAt: project.archivedAt,
    currentAgent: project.currentAgent, queuedAgent: project.queuedAgent,
    activeInvocationId: project.activeInvocationId, runtime: project.runtime,
    collaboration: project.collaboration?.stateRevision === undefined ? undefined : { stateRevision: project.collaboration.stateRevision },
    queueDepth: project.queueDepth, queuePosition: project.queuePosition,
    overallProgress: project.overallProgress, agentProgress: project.agentProgress,
    orchestration: project.orchestration, userIntervention: project.userIntervention,
    git: project.git, pullRequests: project.pullRequests,
    tokenUsage: usage ? {
      inputTokens: usage.inputTokens, cachedInputTokens: usage.cachedInputTokens,
      outputTokens: usage.outputTokens, totalTokens: usage.totalTokens,
      invocations: usage.invocations, byAgent: {}
    } : undefined
  };
}

export type ProjectListItem = ReturnType<typeof projectListSummary>;
