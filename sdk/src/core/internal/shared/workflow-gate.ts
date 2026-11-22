import { z } from "zod";

const id = z.string().trim().min(1).max(64).regex(/^[\p{L}\p{N}][\p{L}\p{N}_-]*$/u);
const value = z.union([z.string(), z.number().finite(), z.boolean(), z.null()]);
const predicate = z.object({
  path: z.array(z.union([z.string().min(1).max(128), z.number().int().nonnegative()])).max(20),
  operator: z.enum(["eq", "ne", "lt", "lte", "gt", "gte", "in", "contains"]),
  value: z.union([value, z.array(value).max(100)])
}).strict();
export const workflowGateSchema = z.object({
  id, name: z.string().trim().min(1).max(160), groupId: id.optional(),
  verifier: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("code"), interpreter: z.enum(["python3", "node", "bash"]),
      code: z.string().min(1).max(64_000), output: z.enum(["json", "text"]) }).strict(),
    z.object({ kind: z.literal("agent"), agentId: id, instructions: z.string().trim().min(1).max(16_000) }).strict()
  ]),
  decisionAgentId: id.optional(),
  rules: z.array(z.object({ target: id, all: z.array(predicate).min(1).max(20) }).strict()).min(1).max(100).optional()
}).strict();
export type WorkflowGate = z.infer<typeof workflowGateSchema>;
export type GatePredicate = z.infer<typeof predicate>;

/** Missing metrics and type errors are contract errors, never a negative score. */
export function gatePredicateMatches(result: unknown, rule: GatePredicate): boolean {
  let actual = result;
  for (const key of rule.path) {
    if (actual === null || typeof actual !== "object" || !Object.hasOwn(actual, key))
      throw new Error(`Gate output is missing required field ${JSON.stringify(rule.path)}`);
    actual = (actual as Record<string | number, unknown>)[key];
  }
  const expected = rule.value;
  if (["lt", "lte", "gt", "gte"].includes(rule.operator)) {
    if (typeof actual !== "number" || !Number.isFinite(actual) || typeof expected !== "number")
      throw new Error(`Gate numeric rule requires a finite number at ${JSON.stringify(rule.path)}`);
    if (rule.operator === "lt") return actual < expected;
    if (rule.operator === "lte") return actual <= expected;
    if (rule.operator === "gt") return actual > expected;
    return actual >= expected;
  }
  if (rule.operator === "in") {
    if (!Array.isArray(expected) || actual !== null && !["string", "number", "boolean"].includes(typeof actual))
      throw new Error("Gate in rule requires a scalar output and an array of alternatives");
    return expected.some(item => item === actual);
  }
  if (rule.operator === "contains") {
    if (typeof actual !== "string" || typeof expected !== "string") throw new Error("Gate contains rule requires text");
    return actual.includes(expected);
  }
  if (Array.isArray(expected) || actual !== null && !["string", "number", "boolean"].includes(typeof actual) ||
    typeof actual !== typeof expected || (actual === null) !== (expected === null))
    throw new Error(`Gate equality rule has incompatible types at ${JSON.stringify(rule.path)}`);
  return rule.operator === "eq" ? actual === expected : actual !== expected;
}

export function gateMatchingTargets(gate: WorkflowGate, targets: readonly string[], result: unknown): string[] {
  if (!targets.length || new Set(targets).size !== targets.length) throw new Error(`Gate ${gate.id} requires distinct outgoing paths`);
  if (!gate.rules) return [...targets];
  if (gate.rules.some(rule => !targets.includes(rule.target)) || targets.some(target => !gate.rules!.some(rule => rule.target === target)))
    throw new Error(`Gate ${gate.id} hard rules must cover exactly its configured outgoing paths`);
  // Evaluate every predicate even when another predicate is false: missing
  // required metrics cannot be hidden by boolean short-circuiting.
  const matches = gate.rules.filter(rule => rule.all.map(test => gatePredicateMatches(result, test)).every(Boolean)).map(rule => rule.target);
  if (!matches.length) throw new Error(`Gate ${gate.id}: no outgoing path matches the actual result`);
  return [...new Set(matches)];
}

export function workflowGateConfigurationErrors(template: {
  agents: { name: string }[]; gates?: WorkflowGate[]; collaborations?: { id: string }[];
  input: { target: string }; routes: Record<string, { target: string }[]>; loops?: { from: string }[];
  scopedWorkflow?: { groups: { id: string; parentGroupId?: string; leaderAgentId: string; workflow: {
    nodes: { kind: string; nodeId: string; gateId?: string }[]; loops?: { from: string }[]; input: { edges: { target: string }[] }; routes: Record<string, { target: string }[]>
  } }[] }
}): string[] {
  const issues: string[] = [], agents = new Set(template.agents.map(agent => agent.name));
  const ids = new Set([...agents, ...(template.collaborations ?? []).map(group => group.id)]);
  const gates = template.gates ?? [];
  for (const gate of gates) {
    if (ids.has(gate.id)) issues.push(`Gate ${gate.id} must have a unique Workflow node ID`);
    ids.add(gate.id);
    const group = gate.groupId ? template.scopedWorkflow?.groups.find(group => group.id === gate.groupId) : undefined;
    if (gate.groupId && !group) issues.push(`Gate ${gate.id} references missing scoped group ${gate.groupId}`);
    if (group && group.workflow.nodes.filter(node => node.kind === "gate" && node.nodeId === gate.id && node.gateId === gate.id).length !== 1)
      issues.push(`Gate ${gate.id} must occur exactly once in its configured group`);
    const executor = gate.verifier.kind === "agent" ? gate.verifier.agentId : undefined;
    for (const agentId of [executor, gate.decisionAgentId].filter((id): id is string => Boolean(id))) {
      if (!agents.has(agentId)) issues.push(`Gate ${gate.id} references missing Agent ${agentId}`);
      let ancestor = group;
      const visited = new Set<string>();
      while (ancestor && !visited.has(ancestor.id)) {
        visited.add(ancestor.id);
        if (agentId === "main" || agentId === ancestor.leaderAgentId) {
          issues.push(`Gate ${gate.id} cannot use its management-only group Leader as a business checker`);
          break;
        }
        ancestor = template.scopedWorkflow?.groups.find(item => item.id === ancestor!.parentGroupId);
      }
    }
    const routes = group?.workflow.routes ?? template.routes;
    if ((group?.workflow.loops ?? template.loops ?? []).some(loop => loop.from === gate.id))
      issues.push(`Gate ${gate.id} may be inside a Loop, but cannot also own its iteration-limit exit`);
    if (gate.verifier.kind === "code" && gates.some(source => source.verifier.kind === "code" && (routes[source.id] ?? []).some(edge => edge.target === gate.id)))
      issues.push(`Code Gate ${gate.id} requires an Agent task between consecutive code Gates`);
    const targets = routes[gate.id]?.map(edge => edge.target) ?? [];
    if (!targets.length) issues.push(`Gate ${gate.id} requires an outgoing path`);
    if (gate.rules && (gate.rules.some(rule => !targets.includes(rule.target)) || targets.some(target => !gate.rules!.some(rule => rule.target === target))))
      issues.push(`Gate ${gate.id} hard rules must cover exactly its outgoing paths`);
    if (gate.verifier.kind === "code" && (group ? group.workflow.input.edges.some(edge => edge.target === gate.id) : template.input.target === gate.id))
      issues.push(`Code Gate ${gate.id} requires an actual predecessor Agent; Input cannot execute code`);
  }
  for (const group of template.scopedWorkflow?.groups ?? []) for (const node of group.workflow.nodes) {
    if (node.kind === "gate" && !gates.some(gate => gate.id === node.gateId && gate.id === node.nodeId && gate.groupId === group.id))
      issues.push(`Scoped Gate ${node.nodeId} has no matching Gate definition`);
  }
  return issues;
}

export interface GateOrigin {
  projectId: string;
  executionId?: string;
  sourceRunId: string;
  nodeId: string;
  agentId?: string;
  invocationId?: string;
  workspacePath?: string;
  workflowRevision: number;
  scopeId?: string;
  input: unknown;
}
export interface GateRun {
  id: string;
  version: number;
  gate: WorkflowGate;
  targets: string[];
  configurationHash: string;
  inputHash: string;
  origin: GateOrigin;
  status: "prepared" | "running" | "result" | "selected" | "delivered" | "error";
  executorAgentId: string;
  decisionAgentId: string;
  checkerInvocationId?: string;
  command?: string;
  result?: unknown;
  evidence?: { invocationId: string; callId: string; eventId: string; harnessId?: string; outputHash?: string };
  selectedTarget?: string;
  selectedByInvocationId?: string;
  deliveredTo?: { executionId?: string; invocationId?: string; agentId?: string; nodeRunId?: string; arrivalRequestId?: string; terminal?: true };
  error?: string;
  createdAt: string;
  updatedAt: string;
}
