import { z } from "zod";
import type { AgentId, NodeRef, WorkflowCanvasLayout, WorkflowEdgeMap, WorkflowLoop } from "./types.js";
import { validateWorkflowLoops, workflowLoopMembers } from "./internal/shared/workflow-loop-validation.js";

/** The group Input is the only source of parallel edges. Routes deliberately
 * retain the existing strong/weak vocabulary. A group is also a routable node
 * in its parent scope; its children never become parent-scope route targets. */
export interface ScopedWorkflow {
  nodes: NodeRef[];
  input: { source: "input"; edges: Array<{ target: string; kind: "parallel" }> };
  routes: WorkflowEdgeMap;
  loops?: WorkflowLoop[];
  canvas?: WorkflowCanvasLayout;
}

export interface ScopedCollaboration {
  id: string;
  parentGroupId?: string;
  leaderAgentId: AgentId;
  /** Who selects weak edges after this group completes in its parent graph.
   * Older contracts omitted this field and retain the historical Main route. */
  decisionBy?: "main" | "agent";
  allowLeaderReconfiguration: boolean;
  workflow: ScopedWorkflow;
}

export interface ScopedWorkflowContract {
  schemaVersion: 1;
  /** Explicit root references: upgrading an old group must not expose its
   * formerly hidden members as new outer routes. */
  rootAgentIds: AgentId[];
  groups: ScopedCollaboration[];
}

const id = z.string().trim().min(1).max(64).regex(/^[\p{L}\p{N}][\p{L}\p{N}_-]*$/u);
const node = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("agent"), nodeId: id, agentId: id }).strict(),
  z.object({ kind: z.literal("collaboration"), nodeId: id, groupId: id }).strict(),
  z.object({ kind: z.literal("gate"), nodeId: id, gateId: id }).strict()
]);
const route = z.object({ target: z.union([id, z.literal("finish")]), kind: z.enum(["strong", "weak"]) }).strict();
const canvas = z.object({
  schemaVersion: z.literal(1),
  nodes: z.record(z.string(), z.object({ x: z.number().finite(), y: z.number().finite() }).strict()),
  edges: z.record(z.string(), z.object({
    sourcePort: z.enum(["top", "right", "bottom", "left"]),
    targetPort: z.enum(["top", "right", "bottom", "left"]),
    sourcePortPinned: z.boolean(),
    targetPortPinned: z.boolean()
  }).strict()),
  viewport: z.object({ x: z.number().finite(), y: z.number().finite(), zoom: z.number().finite().positive() }).strict(),
  layoutMode: z.enum(["free", "layered"]),
  connections: z.object({ input: z.boolean(), termination: z.boolean() }).strict().optional()
}).strict();
const workflow = z.object({
  nodes: z.array(node),
  input: z.object({
    source: z.literal("input"),
    edges: z.array(z.object({ target: id, kind: z.literal("parallel") }).strict())
  }).strict(),
  routes: z.record(id, z.array(route)),
  loops: z.array(z.object({
    id,
    from: id,
    to: id,
    maxIterations: z.number().int().min(1).max(1_000_000),
    exitTo: id
  }).strict()).max(50).optional(),
  canvas: canvas.optional()
}).strict();
const group = z.object({
  id,
  parentGroupId: id.optional(),
  leaderAgentId: id,
  // Omitted legacy groups are interpreted as Main-owned at every runtime
  // boundary; keeping the field optional preserves lossless old snapshots.
  decisionBy: z.enum(["main", "agent"]).optional(),
  allowLeaderReconfiguration: z.boolean(),
  workflow
}).strict();
export const scopedWorkflowContractSchema = z.object({
  schemaVersion: z.literal(1),
  rootAgentIds: z.array(id).min(1),
  groups: z.array(group).max(25)
}).strict();

/** Validate a scoped definition independently of persistence/runtime state.
 * The caller supplies the project's Agent identities, not graph-node IDs. */
export function validateScopedWorkflowContract(
  value: unknown,
  agentIds: ReadonlySet<string>,
  options: { strict?: boolean } = {}
): ScopedWorkflowContract {
  const contract = scopedWorkflowContractSchema.parse(value);
  const strict = options.strict !== false;
  const issues: string[] = [];
  if (contract.rootAgentIds[0] !== "main" || contract.rootAgentIds.filter((agentId) => agentId === "main").length !== 1) {
    issues.push("根图必须以唯一 main Agent 开始");
  }
  if (new Set(contract.rootAgentIds).size !== contract.rootAgentIds.length) issues.push("根图不能重复引用同一个 Agent 节点");
  for (const agentId of contract.rootAgentIds) {
    if (!agentIds.has(agentId)) issues.push(`根图 Agent ${agentId} 不存在`);
  }
  const groups = new Map<string, (typeof contract.groups)[number]>();
  const nodeOwners = new Map<string, string>();
  for (const entry of contract.groups) {
    if (groups.has(entry.id)) issues.push(`协作组 ${entry.id} 重复`);
    groups.set(entry.id, entry);
    if (!agentIds.has(entry.leaderAgentId)) issues.push(`协作组 ${entry.id} 的 Leader 不存在`);
    if (entry.parentGroupId === entry.id) issues.push(`协作组 ${entry.id} 不能包含自身`);
    for (const ref of entry.workflow.nodes) {
      if (contract.rootAgentIds.includes(ref.nodeId) || contract.groups.some((group) => !group.parentGroupId && group.id === ref.nodeId)) {
        issues.push(`图节点 ${ref.nodeId} 与根图节点身份冲突`);
      }
      const owner = nodeOwners.get(ref.nodeId);
      if (owner) issues.push(`图节点 ${ref.nodeId} 在 ${owner} 和 ${entry.id} 中重复`);
      nodeOwners.set(ref.nodeId, entry.id);
      if (ref.kind === "agent" && !agentIds.has(ref.agentId)) issues.push(`图节点 ${ref.nodeId} 引用了不存在的 Agent`);
      if (ref.kind === "agent" && ref.agentId === "main") issues.push(`Main 不能作为 ${entry.id} 的业务节点`);
    }
  }
  for (const entry of contract.groups) {
    const parent = entry.parentGroupId ? groups.get(entry.parentGroupId) : undefined;
    if (entry.parentGroupId && !parent) issues.push(`协作组 ${entry.id} 的父组不存在`);
    const references = parent?.workflow.nodes.filter((ref) => ref.kind === "collaboration" && ref.groupId === entry.id) ?? [];
    if (parent && references.length !== 1) issues.push(`子协作组 ${entry.id} 必须在父组中恰好有一个节点引用`);
    const ancestry = new Set([entry.id]);
    let cursor = parent;
    while (cursor) {
      if (ancestry.has(cursor.id)) {
        issues.push(`协作组 ${entry.id} 形成包含环`);
        break;
      }
      ancestry.add(cursor.id);
      cursor = cursor.parentGroupId ? groups.get(cursor.parentGroupId) : undefined;
    }
    const directNodes = new Map(entry.workflow.nodes.map((ref) => [ref.nodeId, ref]));
    if (strict && entry.workflow.input.edges.length === 0) issues.push(`${entry.id} 的 Input 至少需要一条并行入口边`);
    const inputTargets = new Set<string>();
    for (const edge of entry.workflow.input.edges) {
      if (!directNodes.has(edge.target)) issues.push(`${entry.id} 的并行入口 ${edge.target} 不属于本组`);
      if (inputTargets.has(edge.target)) issues.push(`${entry.id} 的并行入口 ${edge.target} 重复`);
      inputTargets.add(edge.target);
    }
    for (const ref of entry.workflow.nodes) {
      if (ref.kind === "collaboration") {
        const child = groups.get(ref.groupId);
        if (!child || child.parentGroupId !== entry.id) issues.push(`${entry.id} 的子组节点 ${ref.nodeId} 不属于本组`);
      }
      if (strict && (entry.workflow.routes[ref.nodeId]?.length ?? 0) === 0) {
        issues.push(`${entry.id} 的图节点 ${ref.nodeId} 缺少出边`);
      }
    }
    if (strict && !Object.values(entry.workflow.routes).some((edges) => edges.some((edge) => edge.target === "finish"))) {
      issues.push(`${entry.id} 的路径必须至少有一条通向 Finish 的边`);
    }
    for (const [source, edges] of Object.entries(entry.workflow.routes)) {
      if (!directNodes.has(source)) issues.push(`${entry.id} 的路由源 ${source} 不属于本组`);
      const strong = edges.filter((edge) => edge.kind === "strong");
      if (strong.length > 1 || (strong.length === 1 && edges.length > 1)) issues.push(`${entry.id} 的 ${source} 强边必须为唯一出边`);
      const targets = new Set<string>();
      for (const edge of edges) {
        if (edge.target !== "finish" && !directNodes.has(edge.target)) issues.push(`${entry.id} 的出边目标 ${edge.target} 不属于本组`);
        if (edge.target === source) issues.push(`${entry.id} 的 ${source} 不能直接指向自身`);
        if (targets.has(edge.target)) issues.push(`${entry.id} 的 ${source} 存在重复出边`);
        targets.add(edge.target);
      }
    }
    if (strict) {
      const reachable = new Set<string>();
      const pending = entry.workflow.input.edges.map((edge) => edge.target);
      while (pending.length) {
        const nodeId = pending.pop()!;
        if (!directNodes.has(nodeId) || reachable.has(nodeId)) continue;
        reachable.add(nodeId);
        for (const edge of [...(entry.workflow.routes[nodeId] ?? []), ...(entry.workflow.loops ?? [])
          .filter((loop) => loop.from === nodeId).map((loop) => ({ target: loop.exitTo }))]) {
          if (edge.target !== "finish") pending.push(edge.target);
        }
      }
      for (const nodeId of directNodes.keys()) {
        if (!reachable.has(nodeId)) issues.push(`${entry.id} 的图节点 ${nodeId} 无法从 Input 到达`);
      }

      const canFinish = new Set<string>();
      const predecessors = new Map<string, string[]>();
      for (const [source, edges] of Object.entries(entry.workflow.routes)) {
        for (const edge of [...edges, ...(entry.workflow.loops ?? [])
          .filter((loop) => loop.from === source).map((loop) => ({ target: loop.exitTo }))]) {
          if (edge.target === "finish") {
            canFinish.add(source);
          } else {
            const sources = predecessors.get(edge.target) ?? [];
            sources.push(source);
            predecessors.set(edge.target, sources);
          }
        }
      }
      const finishQueue = [...canFinish];
      while (finishQueue.length) {
        const nodeId = finishQueue.pop()!;
        for (const source of predecessors.get(nodeId) ?? []) {
          if (canFinish.has(source)) continue;
          canFinish.add(source);
          finishQueue.push(source);
        }
      }
      for (const nodeId of reachable) {
        if (!canFinish.has(nodeId)) issues.push(`${entry.id} 的图节点 ${nodeId} 没有通向 Finish 的路径`);
      }
    }
    for (const loop of entry.workflow.loops ?? []) {
      if (![loop.from, loop.to, loop.exitTo].every((nodeId) => directNodes.has(nodeId))) issues.push(`${entry.id} 的 Loop 不能跨越组范围`);
      if (workflowLoopMembers(entry.workflow, loop).some((nodeId) => directNodes.get(nodeId)?.kind === "collaboration")) {
        issues.push(`${entry.id} 的 Loop 支持 Agent 与 Gate，不能把子协作组当作 Loop Worker`);
      }
    }
    for (const issue of validateWorkflowLoops({
      agents: entry.workflow.nodes.map((ref) => ({ name: ref.nodeId })),
      routes: entry.workflow.routes,
      loops: entry.workflow.loops,
      termination: { agent: "finish" }
    })) issues.push(`${entry.id} 的 Loop ${issue.loopId}：${issue.message}`);
    // The Leader is management-only throughout its own scope, including
    // descendants. Other scopes may still reference the same Agent identity.
    for (const descendant of contract.groups) {
      let current: typeof descendant | undefined = descendant;
      const seen = new Set<string>();
      while (current && !seen.has(current.id)) {
        seen.add(current.id);
        if (current.id === entry.id) {
          if (descendant.workflow.nodes.some((ref) => ref.kind === "agent" && ref.agentId === entry.leaderAgentId)) {
            issues.push(`${entry.id} 的 Leader 不能兼任本组业务节点`);
          }
          break;
        }
        current = current.parentGroupId ? groups.get(current.parentGroupId) : undefined;
      }
    }
  }
  if (issues.length) throw new ScopedWorkflowContractError(issues);
  return contract;
}

export class ScopedWorkflowContractError extends Error {
  constructor(readonly issues: string[]) {
    super(issues.join("；"));
    this.name = "ScopedWorkflowContractError";
  }
}
