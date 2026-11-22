export interface WorkflowLoopShape {
  id: string;
  from: string;
  to: string;
  maxIterations: number;
  exitTo: string;
}

export interface WorkflowLoopTopology {
  agents: readonly { name: string }[];
  gates?: readonly { id: string; groupId?: string }[];
  routes: Readonly<Record<string, readonly { target: string; kind: "strong" | "weak" }[]>>;
  loops?: readonly WorkflowLoopShape[];
  termination: { agent: string };
}

export interface WorkflowLoopValidationIssue {
  index: number;
  loopId: string;
  message: string;
}

/** Return the proven deterministic Worker path, including both endpoints. */
export function workflowLoopMembers(
  topology: Pick<WorkflowLoopTopology, "routes">,
  loop: Pick<WorkflowLoopShape, "from" | "to">
): string[] {
  const visited = new Set<string>();
  let name = loop.to;
  while (name !== "main" && name !== "finish" && !visited.has(name)) {
    visited.add(name);
    if (name === loop.from) break;
    const next = topology.routes[name] ?? [];
    if (next.length !== 1 || next[0]?.kind !== "strong") break;
    name = next[0].target;
  }
  return [...visited];
}

/**
 * The single topology rule used by both the server schema and the Web canvas.
 * Web results are immediate feedback only; persisted input is parsed again by
 * the authoritative server schema.
 */
export function validateWorkflowLoops(
  topology: WorkflowLoopTopology
): WorkflowLoopValidationIssue[] {
  const issues: WorkflowLoopValidationIssue[] = [];
  const configuredNames = new Set([...topology.agents.map((entry) => entry.name), ...(topology.gates ?? []).filter(gate => !gate.groupId).map(gate => gate.id)]);
  const loopIds = new Set<string>();
  const loopSources = new Set<string>();
  const loopEntries = new Set<string>();
  const claimedMembers = new Set<string>();

  for (const [index, loop] of (topology.loops ?? []).entries()) {
    const invalid = (message: string) => issues.push({ index, loopId: loop.id, message });
    if (!/^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/.test(loop.id)) invalid("Loop ID must start with a letter and contain only letters, numbers, _ or -");
    if (!Number.isInteger(loop.maxIterations) || loop.maxIterations < 1 || loop.maxIterations > 1_000_000) {
      invalid("Loop maxIterations must be an integer between 1 and 1000000");
    }
    if (loopIds.has(loop.id)) invalid("Loop IDs must be unique");
    if (loopSources.has(loop.from)) invalid("Only one loop may control an Agent's outgoing edge");
    if (loopEntries.has(loop.to)) invalid("Loop group entries must be unique");
    loopIds.add(loop.id);
    loopSources.add(loop.from);
    loopEntries.add(loop.to);
    if (![loop.from, loop.to, loop.exitTo].every((name) => configuredNames.has(name))) {
      invalid("Loop targets must reference configured Agents");
    }
    if (loop.from === "main" || loop.to === "main") invalid("Loop edges must connect ordinary Agents");
    if (loop.from === topology.termination.agent) invalid("A loop boundary cannot also be the termination Agent");
    if (loop.exitTo === loop.from || loop.exitTo === loop.to) invalid("Loop exit must differ from its edge endpoints");
    const edges = topology.routes[loop.from] ?? [];
    if (edges.length !== 1 || edges[0]?.kind !== "strong" || edges[0]?.target !== loop.to) {
      invalid("Loop from -> to must be the source Agent's sole strong route");
    }

    const visited = new Set<string>();
    let name = loop.to;
    while (name !== "main" && name !== "finish" && !visited.has(name)) {
      visited.add(name);
      if (name === loop.from) break;
      const next = topology.routes[name] ?? [];
      if (next.length !== 1 || next[0]?.kind !== "strong") {
        invalid("Loop group members must have a sole strong route");
        break;
      }
      name = next[0].target;
    }
    if (!visited.has(loop.from)) invalid("Loop to must have a route back to from without Main");
    if (visited.has(loop.exitTo)) invalid("Loop exit must be outside its cycle's reachable Workers");
    for (const member of visited) {
      if (claimedMembers.has(member)) invalid("Loop groups cannot share Agents");
      claimedMembers.add(member);
    }
  }

  return issues;
}
