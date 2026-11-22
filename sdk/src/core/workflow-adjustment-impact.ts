import { isDeepStrictEqual } from "node:util";
import type { NodeRef, WorkflowEdgeMap, WorkflowLoop } from "./types.js";
import { workflowLoopMembers } from "./internal/shared/workflow-loop-validation.js";
import type { WorkflowAdjustmentSubmission } from "./workflow-adjustments.js";

/** Scope comes from the two immutable submitted snapshots. Canvas positions
 * and newly added unused resources do not change an existing invocation. */
export function workflowAdjustmentRuntimeImpact(request: WorkflowAdjustmentSubmission) {
  const before = request.baseSnapshot, after = request.proposal;
  const oldGraph = before.orchestration, newGraph = after.orchestration;
  const agentIds = new Set([...Object.keys(before.agents), ...Object.keys(after.agents)]
    .filter(id => !isDeepStrictEqual(before.agents[id], after.agents[id]) ||
      !isDeepStrictEqual(oldGraph.agents.find(agent => agent.name === id), newGraph.agents.find(agent => agent.name === id))));
  if (["allowUserIntervention", "allowMainReconfiguration", "termination", "resultFormat"].some(key =>
    !isDeepStrictEqual(oldGraph[key as keyof typeof oldGraph], newGraph[key as keyof typeof newGraph]))) agentIds.add("main");
  const oldGroups = new Map(oldGraph.scopedWorkflow?.groups.map(group => [group.id, group]));
  const newGroups = new Map(newGraph.scopedWorkflow?.groups.map(group => [group.id, group]));
  const groupOwnershipChanged = (id: string) => {
    const previous = oldGroups.get(id), next = newGroups.get(id);
    const identity = (group: typeof previous) => group && { parentGroupId: group.parentGroupId,
      leaderAgentId: group.leaderAgentId, decisionBy: group.decisionBy ?? "main" };
    return !isDeepStrictEqual(identity(previous), identity(next));
  };
  const groupChanged = (id: string) => {
    const semantic = (group: ReturnType<typeof oldGroups.get>) => {
      if (!group) return group;
      const { canvas: _canvas, ...workflow } = group.workflow;
      const { allowLeaderReconfiguration: _metadata, ...definition } = group;
      return { ...definition, workflow };
    };
    return !isDeepStrictEqual(semantic(oldGroups.get(id)), semantic(newGroups.get(id))) ||
      !isDeepStrictEqual(oldGraph.collaborations?.find(group => group.id === id), newGraph.collaborations?.find(group => group.id === id)) ||
      !isDeepStrictEqual(oldGraph.routes[id], newGraph.routes[id]) || !isDeepStrictEqual(oldGraph.decisionPlans[id], newGraph.decisionPlans[id]);
  };
  const loopBindings = (routes: WorkflowEdgeMap, loops: WorkflowLoop[] | undefined, nodeId: string, activeLoopIds: string[]) =>
    (loops ?? []).filter(loop => activeLoopIds.includes(loop.id) || workflowLoopMembers({ routes }, loop).includes(nodeId) || loop.exitTo === nodeId)
      .map(loop => { const members = workflowLoopMembers({ routes }, loop);
        return { loop, members, routes: Object.fromEntries(members.map(id => [id, routes[id]])) }; });
  const scopedNodeChanged = (groupId: string, nodeId: string, activeLoopIds: string[] = []) => {
    const previous = oldGroups.get(groupId)?.workflow, next = newGroups.get(groupId)?.workflow;
    if (!previous || !next || groupOwnershipChanged(groupId)) return true;
    return !isDeepStrictEqual(oldGraph.gates?.find(gate => gate.id === nodeId), newGraph.gates?.find(gate => gate.id === nodeId)) ||
      !isDeepStrictEqual(previous.nodes.find(node => node.nodeId === nodeId), next.nodes.find(node => node.nodeId === nodeId)) ||
      !isDeepStrictEqual(previous.routes[nodeId], next.routes[nodeId]) ||
      !isDeepStrictEqual(loopBindings(previous.routes, previous.loops, nodeId, activeLoopIds), loopBindings(next.routes, next.loops, nodeId, activeLoopIds));
  };
  const rootNodeChanged = (node: NodeRef) => {
    if (node.kind === "agent" && agentIds.has(node.agentId)) return true;
    if (node.kind === "gate" && !isDeepStrictEqual(oldGraph.gates?.find(gate => gate.id === node.gateId), newGraph.gates?.find(gate => gate.id === node.gateId))) return true;
    if (node.kind === "collaboration" && groupOwnershipChanged(node.groupId)) return true;
    if (node.kind === "collaboration" && !isDeepStrictEqual(oldGraph.collaborations?.find(group => group.id === node.groupId),
      newGraph.collaborations?.find(group => group.id === node.groupId))) return true;
    if (node.kind === "agent" && !isDeepStrictEqual(oldGraph.scopedWorkflow?.rootAgentIds.includes(node.agentId),
      newGraph.scopedWorkflow?.rootAgentIds.includes(node.agentId))) return true;
    return !isDeepStrictEqual(oldGraph.routes[node.nodeId], newGraph.routes[node.nodeId]) ||
      !isDeepStrictEqual(oldGraph.decisionPlans[node.nodeId], newGraph.decisionPlans[node.nodeId]) ||
      !isDeepStrictEqual(loopBindings(oldGraph.routes, oldGraph.loops, node.nodeId, []), loopBindings(newGraph.routes, newGraph.loops, node.nodeId, []));
  };
  return { agentIds, groupChanged, groupOwnershipChanged, scopedNodeChanged, rootNodeChanged };
}
