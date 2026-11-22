import { workflowOuterNodeRefs } from "./agent-orchestration.js";
import type { AgentOrchestrationTemplate, ProjectState } from "./types.js";

/** Estimate position in the outer workflow, without counting calls or loop iterations. */
export function workflowProgressPercent(state: ProjectState): number {
  if (state.status === "completed") return 100;

  const template = state.orchestration;
  const nodes = workflowOuterNodeRefs(template);
  const forward = new Map(nodes.map(({ nodeId }) => [nodeId, new Set<string>()]));
  forward.set("finish", new Set());
  const reverse = new Map([...forward.keys()].map((nodeId) => [nodeId, new Set<string>()]));
  const addEdge = (source: string, target: string) => {
    if (!forward.has(source) || !forward.has(target)) return;
    forward.get(source)!.add(target);
    reverse.get(target)!.add(source);
  };
  for (const { nodeId } of nodes) {
    for (const edge of template.routes[nodeId] ?? []) addEdge(nodeId, edge.target);
  }
  // Loop exits are scheduler transitions and may be absent from the drawn routes.
  for (const loop of template.loops ?? []) {
    addEdge(loop.from, loop.to);
    addEdge(loop.from, loop.exitTo);
  }
  // Main-owned termination can complete without a literal finish edge.
  addEdge(template.termination.agent, "finish");

  const activeRun = state.nodeRuns?.find((run) => run.id === state.activeNodeRunId);
  const agent = state.currentAgent ?? state.queuedAgent;
  const current = activeRun?.node.nodeId ??
    (agent ? outerNodeForAgent(template, agent) : undefined) ??
    state.nodeRuns?.at(-1)?.node.nodeId ?? template.input.target;
  const travelled = distancesFrom(template.input.target, forward).get(current);
  const remaining = distancesFrom("finish", reverse).get(current);
  if (travelled === undefined || remaining === undefined || remaining === 0) return 0;

  // Both distances use the current node, so a longer branch still has meaningful progress.
  return Math.min(99, Math.round(1000 * travelled / (travelled + remaining)) / 10);
}

function distancesFrom(start: string, graph: Map<string, Set<string>>): Map<string, number> {
  if (!graph.has(start)) return new Map();
  const distances = new Map([[start, 0]]);
  const queue = [start];
  for (let index = 0; index < queue.length; index += 1) {
    const source = queue[index]!;
    for (const target of graph.get(source) ?? []) {
      if (distances.has(target)) continue;
      distances.set(target, distances.get(source)! + 1);
      queue.push(target);
    }
  }
  return distances;
}

/** Nested members share the position of their outer collaboration node. */
function outerNodeForAgent(template: AgentOrchestrationTemplate, agentId: string): string | undefined {
  const scopedGroups = new Map(template.scopedWorkflow?.groups.map((group) => [group.id, group]) ?? []);
  const visited = new Set<string>();
  const containsAgent = (groupId: string): boolean => {
    if (visited.has(groupId)) return false;
    visited.add(groupId);
    const group = scopedGroups.get(groupId);
    if (!group) return false;
    return group.workflow.nodes.some((node) => node.kind === "agent"
      ? node.agentId === agentId : node.kind === "collaboration" && containsAgent(node.groupId));
  };
  return workflowOuterNodeRefs(template).find((node) => {
    if (node.kind === "agent") return node.agentId === agentId;
    if (node.kind === "gate") return false;
    return template.schemaVersion === 3 && template.scopedWorkflow
      ? containsAgent(node.groupId)
      : template.collaborations?.some((group) =>
          group.id === node.groupId && group.memberAgentIds.includes(agentId));
  })?.nodeId;
}
