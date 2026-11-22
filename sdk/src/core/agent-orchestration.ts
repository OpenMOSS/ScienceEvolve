import type {
  AgentId,
  AgentName,
  AgentOrchestrationTemplateV2,
  AgentOrchestrationTemplate,
  NormalizedAgentOrchestrationTemplate,
  CollaborationNode,
  NodeRef,
  WorkflowEdge,
  WorkflowEdgeMap,
  WorkflowNodeId,
  WorkflowRouteTarget
} from "./types.js";
import { MAIN_AGENT_NAME } from "./types.js";

export const DEFAULT_AGENT_ORCHESTRATION_TEMPLATE: AgentOrchestrationTemplateV2 = {
  schemaVersion: 2,
  agents: [
    { name: MAIN_AGENT_NAME, template: "main" },
    { name: "idea", template: "idea" },
    { name: "execution", template: "execution" },
    { name: "writing", template: "writing" },
    { name: "review", template: "review" }
  ],
  collaborations: [],
  input: { source: "input", target: "idea" },
  routes: {
    main: [
      { target: "idea", kind: "weak" },
      { target: "execution", kind: "weak" },
      { target: "writing", kind: "weak" },
      { target: "review", kind: "weak" }
    ],
    idea: [{ target: "main", kind: "strong" }],
    execution: [{ target: "main", kind: "strong" }],
    writing: [{ target: "main", kind: "strong" }],
    review: [
      { target: "main", kind: "weak" },
      { target: "finish", kind: "weak" }
    ]
  },
  decisionPlans: Object.fromEntries(
    ["main", "idea", "execution", "writing", "review"].map((agent) => [
      agent,
      defaultDecisionPlan(agent)
    ])
  ),
  allowUserIntervention: true,
  allowMainReconfiguration: false,
  termination: {
    agent: "review",
    condition: "评审结果表明论文达到可接受的投稿标准，且没有未解决的关键问题",
    decisionBy: "main",
    automatic: false
  },
  resultFormat: { presets: ["论文"], custom: "" }
};

export function defaultDecisionPlan(agent: AgentName): string {
  return `结合 ${agent} Agent 刚完成的结果、用户需求、当前项目证据、未解决问题和终止条件，选择下一位最合适的 Agent；只有满足终止条件时才结束。`;
}

export function loopIterationCount(
  counts: Record<string, number> | undefined,
  id: string
): number {
  const value = counts && Object.hasOwn(counts, id) ? counts[id] : 0;
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`Invalid loop counter: ${id}`);
  }
  return value;
}

export function cloneAgentOrchestrationTemplate(
  value: AgentOrchestrationTemplate = DEFAULT_AGENT_ORCHESTRATION_TEMPLATE
): AgentOrchestrationTemplate {
  return structuredClone(value);
}

/**
 * Main is a system-owned fan-out node. Its outgoing edges are rebuilt from
 * the current child Agent list whenever a template crosses a persistence/API
 * boundary, so a client can never remove or retarget one of these edges.
 */
export function canonicalizeMainRoutes(
  template: AgentOrchestrationTemplate
): NormalizedAgentOrchestrationTemplate {
  const next = structuredClone(template) as NormalizedAgentOrchestrationTemplate;
  next.schemaVersion = template.schemaVersion === 3 ? 3 : 2;
  next.collaborations = structuredClone(template.collaborations ?? []);
  // Agent kind is derived from the fixed public name and is never persisted.
  next.agents = next.agents.map((definition) => ({
    name: definition.name,
    ...(definition.template ? { template: definition.template } : {}),
    ...(definition.description?.trim() ? { description: definition.description.trim().slice(0, 180) } : {})
  }));
  const main = next.agents.find((definition) => definition.name === MAIN_AGENT_NAME);
  if (!main) {
    next.agents.unshift({ name: MAIN_AGENT_NAME, template: "main" });
  } else {
    main.template = "main";
    next.agents = [
      main,
      ...next.agents.filter((definition) => definition !== main)
    ];
  }
  const children = workflowOuterNodeIds(next)
    .filter((name) => name !== MAIN_AGENT_NAME);
  next.routes ??= {};
  next.routes[MAIN_AGENT_NAME] = children.map((target) => ({
    target,
    kind: "weak" as const
  }));
  return next;
}

/** All Agent ids owned by collaboration nodes, independent of display order. */
export function collaborationMemberAgentIds(
  template: AgentOrchestrationTemplate
): Set<AgentId> {
  return new Set((template.collaborations ?? []).flatMap((group) => group.memberAgentIds));
}

/** Locate an Agent's collaboration. Valid templates return at most one. */
export function collaborationForAgent(
  template: AgentOrchestrationTemplate,
  agentId: AgentId
): CollaborationNode | undefined {
  return (template.collaborations ?? []).find((group) => group.memberAgentIds.includes(agentId));
}

/**
 * Derive the routable outer-node projection. A group occupies the position of
 * its first member in Agent registry order, so legacy ordering is stable and
 * replacing member cards with a group does not arbitrarily move topology.
 */
export function workflowOuterNodeRefs(
  template: AgentOrchestrationTemplate
): NodeRef[] {
  const gates: NodeRef[] = (template.gates ?? []).filter(gate => !gate.groupId).map(gate => ({ kind: "gate", nodeId: gate.id, gateId: gate.id }));
  if (template.schemaVersion === 3 && template.scopedWorkflow) {
    return [
      ...gates,
      ...template.scopedWorkflow.rootAgentIds.map((agentId) => ({
        kind: "agent" as const,
        nodeId: agentId,
        agentId
      })),
      ...template.scopedWorkflow.groups
        .filter((group) => !group.parentGroupId)
        .map((group) => ({ kind: "collaboration" as const, nodeId: group.id, groupId: group.id }))
    ];
  }
  const groups = template.collaborations ?? [];
  const groupByMember = new Map<AgentId, CollaborationNode>();
  for (const group of groups) {
    for (const member of group.memberAgentIds) groupByMember.set(member, group);
  }
  const emittedGroups = new Set<string>();
  const result: NodeRef[] = [];
  for (const definition of template.agents) {
    if (definition.name === MAIN_AGENT_NAME) {
      result.push({ kind: "agent", nodeId: definition.name, agentId: definition.name });
      continue;
    }
    const group = groupByMember.get(definition.name);
    if (!group) {
      result.push({ kind: "agent", nodeId: definition.name, agentId: definition.name });
      continue;
    }
    if (!emittedGroups.has(group.id)) {
      emittedGroups.add(group.id);
      result.push({ kind: "collaboration", nodeId: group.id, groupId: group.id });
    }
  }
  // Validation rejects unknown/empty membership, but appending here keeps the
  // selector total for diagnostics and draft consumers.
  for (const group of groups) {
    if (emittedGroups.has(group.id)) continue;
    emittedGroups.add(group.id);
    result.push({ kind: "collaboration", nodeId: group.id, groupId: group.id });
  }
  return [...result, ...gates];
}

export function workflowOuterNodeIds(
  template: AgentOrchestrationTemplate
): WorkflowNodeId[] {
  return workflowOuterNodeRefs(template).map((node) => node.nodeId);
}

export function workflowNodeRefFor(
  template: AgentOrchestrationTemplate,
  nodeId: WorkflowNodeId
): NodeRef | undefined {
  return workflowOuterNodeRefs(template).find((node) => node.nodeId === nodeId);
}

export function isConfiguredWorkflowNode(
  template: AgentOrchestrationTemplate,
  nodeId: WorkflowNodeId
): boolean {
  return workflowNodeRefFor(template, nodeId) !== undefined;
}

export function isCollaborationNode(
  template: AgentOrchestrationTemplate,
  nodeId: WorkflowNodeId
): boolean {
  return (template.collaborations ?? []).some((group) => group.id === nodeId);
}

/** Group activation may carry only current-state input; no placeholder task is required. */
export function workflowTargetAllowsTasklessActivation(
  template: AgentOrchestrationTemplate,
  nodeId: WorkflowNodeId
): boolean {
  return isCollaborationNode(template, nodeId);
}

/**
 * Derive the frozen leader rule from the actual activator and source node.
 * Project input, Main selection, and group-to-group routing all map to Main.
 */
export function deriveCollaborationLeaderAgentId(input: {
  sourceNode?: NodeRef;
  activatedByAgentId: AgentId;
}): AgentId {
  return input.sourceNode?.kind === "agent" &&
    input.sourceNode.agentId !== MAIN_AGENT_NAME &&
    input.activatedByAgentId === input.sourceNode.agentId
    ? input.sourceNode.agentId
    : MAIN_AGENT_NAME;
}

export function isValidCollaborationRoleOwner(
  template: AgentOrchestrationTemplate,
  input: {
    groupId: string;
    leaderAgentId: AgentId;
    agentId: AgentId;
    role: "leader" | "delivery" | "final-integration";
  }
): boolean {
  if (input.role === "leader") {
    const leader = workflowNodeRefFor(template, input.leaderAgentId);
    return leader?.kind === "agent" && input.agentId === input.leaderAgentId;
  }
  const group = (template.collaborations ?? []).find((entry) => entry.id === input.groupId);
  return Boolean(
    group &&
    input.agentId !== input.leaderAgentId &&
    group.memberAgentIds.includes(input.agentId)
  );
}

/** Fail closed before compiling a collaboration invocation capability. */
export function assertCollaborationRoleOwner(
  template: AgentOrchestrationTemplate,
  input: Parameters<typeof isValidCollaborationRoleOwner>[1]
): void {
  if (!isValidCollaborationRoleOwner(template, input)) {
    throw new Error(
      input.role === "leader"
        ? "Only the recorded leader may own the leader role"
        : "Delivery and final-integration work must be owned by a non-leader group member"
    );
  }
}

export function workflowRoutesFor(
  template: AgentOrchestrationTemplate
): WorkflowEdgeMap {
  return Object.fromEntries(
    workflowOuterNodeIds(template).map((nodeId) => [
      nodeId,
      (template.routes?.[nodeId] ?? []).map((edge) => ({ ...edge }))
    ])
  ) as WorkflowEdgeMap;
}

export function workflowRoutesForAgent(
  template: AgentOrchestrationTemplate,
  agent: WorkflowNodeId
): WorkflowEdge[] {
  return workflowRoutesFor(template)[agent] ?? [];
}

export function workflowAgentCandidates(
  template: AgentOrchestrationTemplate,
  agent: WorkflowNodeId
): WorkflowRouteTarget[] {
  return workflowRoutesForAgent(template, agent)
    .map((edge) => edge.target);
}

export function workflowRequiresMainChoice(
  template: AgentOrchestrationTemplate,
  agent: WorkflowNodeId,
  decisionBy: "main" | "agent" = "main"
): boolean {
  const edges = workflowRoutesForAgent(template, agent);
  return decisionBy === "main" && edges.length > 1 && edges.every((edge) => edge.kind === "weak");
}

/** Ordinary weak Worker candidates that may be selected by the Worker itself. */
export function workflowWorkerChoiceCandidates(
  template: AgentOrchestrationTemplate,
  agent: WorkflowNodeId
): WorkflowNodeId[] {
  return workflowRoutesForAgent(template, agent)
    .filter((edge) =>
      edge.kind === "weak" &&
      edge.target !== MAIN_AGENT_NAME &&
      edge.target !== "finish" &&
      isConfiguredWorkflowNode(template, edge.target)
    )
    .map((edge) => edge.target as WorkflowNodeId);
}

export function workflowDirectTarget(
  template: AgentOrchestrationTemplate,
  agent: WorkflowNodeId
): WorkflowRouteTarget | undefined {
  const edges = workflowRoutesForAgent(template, agent);
  return edges.length === 1 ? edges[0]?.target : undefined;
}

/** An automatic judge either completes explicitly or returns to its sole repair target. */
export function workflowAutomaticReturnTarget(
  template: AgentOrchestrationTemplate,
  agent: AgentName
): AgentName | undefined {
  if (
    agent === MAIN_AGENT_NAME ||
    !template.termination.automatic ||
    template.termination.agent !== agent
  ) {
    return undefined;
  }
  const edges = workflowRoutesForAgent(template, agent);
  if (
    edges.length !== 2 ||
    !edges.every((edge) => edge.kind === "weak") ||
    !edges.some((edge) => edge.target === "finish")
  ) {
    return undefined;
  }
  const target = edges.find((edge) => edge.target !== "finish")?.target;
  return target &&
    target !== MAIN_AGENT_NAME &&
    isConfiguredAgent(template, target)
    ? target
    : undefined;
}

export function isConfiguredAgent(
  template: AgentOrchestrationTemplate,
  name: AgentName
): boolean {
  return template.agents.some((entry) => entry.name === name);
}

export function agentKindFor(
  template: AgentOrchestrationTemplate,
  name: AgentName
): "main" | "worker" {
  if (name === MAIN_AGENT_NAME) return "main";
  const definition = template.agents.find((entry) => entry.name === name);
  if (!definition) throw new Error(`Unknown Agent name: ${name}`);
  return "worker";
}

export function firstMainAgentName(
  template: AgentOrchestrationTemplate
): AgentName | undefined {
  return template.agents.find((entry) => entry.name === MAIN_AGENT_NAME)?.name;
}

export function isMainAgent(template: AgentOrchestrationTemplate, name: AgentName): boolean {
  void template;
  return name === MAIN_AGENT_NAME;
}

/** Template labels are display/setup metadata only. */
export function agentTemplateFor(
  template: AgentOrchestrationTemplate,
  name: AgentName
): string {
  const definition = template.agents.find((entry) => entry.name === name);
  if (!definition) throw new Error(`Unknown Agent name: ${name}`);
  return definition.template ?? "general";
}
