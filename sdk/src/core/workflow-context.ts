import { createHash, randomUUID } from "node:crypto";
import { constants, promises as fs } from "node:fs";
import path from "node:path";
import { workflowOuterNodeRefs, workflowRoutesFor } from "./agent-orchestration.js";
import { authoritativeWorkflowPaths } from "./orchestration-control-bridge.js";
import type { SkillDescriptor } from "./skill-catalog.js";
import type { ScopedWorkflow } from "./scoped-workflow-contract.js";
import type { InvocationInputs } from "./harness-runtime/contracts.js";
import type { AgentConfig, AgentMcpServer, AgentRunRequest, AuthoritativeWorkflowFiles, NodeRef, ProjectState } from "./types.js";
import { redactTrace } from "./utils.js";
import { AgentContextSources, publishAgentContextIndex } from "./agent-context-index.js";
import type { ContextSummaryLookup } from "./context-index-organizer.js";

/** Trusted management identity, independent of the Agent's name/session. */
export interface WorkflowContextRequest {
  scope: "global" | "group";
  groupId?: string;
  groupRunId?: string;
  sourceNodeId?: string;
  purpose?: string;
  candidates?: string[];
  /** Legacy hosts replace the current Agent's MCP references with local URLs. */
  configuredMcpServers?: AgentMcpServer[];
}

export interface WorkflowContextSnapshot {
  scope: "global" | "group";
  groupId?: string;
  workflowRevision: number;
  stateRevision: number;
  configurationHash: string;
  preview: string;
  compactPreview?: string;
  definitionPath: string;
  currentStatePath: string;
  agentsPath: string;
}

type ContextInput = Pick<AgentRunRequest, "project" | "agent"> & Partial<Pick<AgentRunRequest,
  "kind" | "purpose" | "executionContext" | "control" | "workflowContext" | "availableSkills" |
  "terminalPushObservation" | "terminalPushCoordination" | "contextSources" | "terminalControlRepair" | "toolCatalog">>;

type JsonRecord = Record<string, unknown>;

/** Refresh for every native turn, including retained-session management repairs. */
export async function prepareWorkflowContext(request: ContextInput, inputs: InvocationInputs,
  authoritative?: AuthoritativeWorkflowFiles, options: { lookup?: ContextSummaryLookup } = {}): Promise<InvocationInputs> {
  const identity = contextIdentity(request);
  if (!identity) return prepareDetailIndex(request, inputs, options);
  request = { ...request, project: structuredClone(request.project) };
  const state = request.project;
  const orchestration = state.orchestration;
  const scoped = orchestration.scopedWorkflow?.groups.find(group => group.id === identity.groupId);
  const legacyRun = state.groupRuns?.find(group => group.id === identity.groupRunId);
  const legacy = orchestration.collaborations?.find(group => group.id === identity.groupId);
  if (identity.scope === "group" && !scoped && !legacy && !legacyRun) {
    throw new Error(`Workflow context cannot resolve current group ${identity.groupId ?? identity.groupRunId}`);
  }
  const nodes: NodeRef[] = identity.scope === "global" ? workflowOuterNodeRefs(orchestration)
    : scoped ? scoped.workflow.nodes
      : (legacyRun?.memberSnapshot ?? legacy?.memberAgentIds ?? []).map(agentId => ({ kind: "agent", nodeId: agentId, agentId }));
  const agentIds = new Set(identity.scope === "global" ? Object.keys(state.agents)
    : [request.agent, ...nodes.flatMap(node => node.kind === "agent" ? [node.agentId] : [])]);
  const agents = Object.fromEntries([...agentIds].flatMap(agentId => {
    const config = state.agents[agentId];
    if (!config) return [];
    return [[agentId, agentDetails(config, agentId === request.agent ? identity.configuredMcpServers : undefined)]];
  }));
  const skillNames = new Set(Object.values(agents).flatMap(config => [...config.skills, ...config.autoSkills]));
  const mcpNames = new Set(Object.values(agents).flatMap(config => config.mcpServers.flatMap(server => server.project ? [server.project] : [])));
  const skillDefinitions = Object.fromEntries(Object.entries(state.skillDefinitions ?? {})
    .filter(([name]) => identity.scope === "global" || skillNames.has(`project:${name}`)));
  const mcpDefinitions = Object.fromEntries(Object.entries(state.mcpDefinitions ?? {})
    .filter(([name]) => identity.scope === "global" || mcpNames.has(name)));
  const installed = await installedSkillDetails(skillNames, request.availableSkills ?? []);
  const installedSkills = installed.index;
  const workflowRevision = state.workflowRevision ?? 1;
  const requestStateRevision = state.collaboration?.stateRevision ?? state.eventSeq ?? 0;
  // Reuse the existing S projection/publication for provider facts. Runtime
  // state may advance within this configuration, but a different workflow
  // revision must never be combined with these Agent capabilities.
  const published = authoritative?.definition.workflowRevision === workflowRevision ? authoritative.currentState as unknown as JsonRecord
    : await publishedState(inputs.projectPath, state.id, workflowRevision, requestStateRevision);
  const stateRevision = typeof published?.stateRevision === "number" ? published.stateRevision : requestStateRevision;
  const metadata = { schemaVersion: 1, projectId: state.id, scope: identity.scope,
    ...(identity.scope === "group" ? { groupId: identity.groupId, groupRunId: identity.groupRunId } : {}),
    workflowRevision, stateRevision };
  const facts = published ?? projectFacts(state);
  const definition = identity.scope === "global"
    ? { ...metadata, workflow: orchestration }
    : { ...metadata, leaderAgentId: scoped?.leaderAgentId ?? legacyRun?.actingCoordinatorId ?? legacyRun?.leaderAgentId ?? request.agent,
        workflow: scoped ? { nodes: scoped.workflow.nodes, input: scoped.workflow.input, routes: scoped.workflow.routes,
          ...(scoped.workflow.loops ? { loops: scoped.workflow.loops } : {}) }
          : { nodes, input: { source: "input", edges: nodes.map(node => ({ target: node.nodeId, kind: "parallel" })) },
          routes: {} },
        agents: orchestration.agents.filter(agent => agentIds.has(agent.name)),
        childGroups: childGroups(state, nodes) };
  const currentState = identity.scope === "global" ? { ...facts, ...metadata }
    : { ...groupFacts(facts, state, identity.groupRunId, agentIds), ...metadata };
  const configuration = { agents, skillDefinitions, mcpDefinitions, installedSkills };
  const configurationHash = digest({ definition: { ...definition, stateRevision: undefined }, configuration });
  const details = { ...metadata, configurationHash, ...configuration };
  const snapshotHash = digest({ definition, currentState, details });
  const parent = path.dirname(inputs.inboxPath);
  const directory = path.join(parent, "workflow-context", snapshotHash);
  await pinnedDirectory(parent);
  await pinnedDirectory(path.dirname(directory));
  await pinnedDirectory(directory);
  for (const [relative, content] of Object.entries(installed.files)) {
    await pinnedDirectory(path.join(directory, "skills"));
    await pinnedDirectory(path.dirname(path.join(directory, relative)));
    await writeSnapshotText(path.join(directory, relative), redactTrace(content));
  }
  const definitionPath = path.join(directory, "definition.json");
  const currentStatePath = path.join(directory, "current-state.json");
  const agentsPath = path.join(directory, "agents.json");
  await writeSnapshot(definitionPath, { ...definition, configurationHash });
  await writeSnapshot(currentStatePath, { ...currentState, configurationHash });
  await writeSnapshot(agentsPath, details);
  const snapshot: WorkflowContextSnapshot = { scope: identity.scope,
    ...(identity.scope === "group" ? { groupId: identity.groupId } : {}),
    workflowRevision, stateRevision, configurationHash,
    definitionPath, currentStatePath, agentsPath,
    preview: preview(request, identity, nodes, agents, scoped?.workflow, metadata, configurationHash,
      { definitionPath, currentStatePath, agentsPath }) };
  snapshot.compactPreview = [
    `Current Workflow scope: ${identity.scope}; Agent=${request.agent}; group=${identity.groupId ?? identity.groupRunId ?? "root"}; revision=${workflowRevision}; state=${stateRevision}.`,
    `Legal route candidates (exact current IDs): ${JSON.stringify(routeCandidatesFor(request, identity))}.`,
    `Complete topology, current-state index and configuration remain available without pagination:\n${definitionPath}\n${currentStatePath}\n${agentsPath}`,
    "Read the relevant graph or Agent configuration through the context index. These references do not grant capabilities; the current task and actual tools/list determine this turn's authority."
  ].join("\n");
  const sources = new AgentContextSources();
  sources.list("workflow.agents", "Agent configuration details", Object.entries(agents).map(([agentId, config]) => ({ agentId, ...config })));
  sources.list("workflow.skill-definitions", "Project Skill definitions", Object.entries(skillDefinitions).map(([name, definition]) => ({ name, definition })));
  sources.list("workflow.mcp-definitions", "Project MCP definitions", Object.entries(mcpDefinitions).map(([name, definition]) => ({ name, definition })));
  sources.list("workflow.installed-skills", "Installed Skill file references", Object.entries(installedSkills).map(([id, detail]) => ({ id, ...detail,
    ...(detail.path ? { path: path.join(directory, detail.path) } : {}) })));
  sources.list("workflow.route-candidates", "Currently authorized route candidates", routeCandidatesFor(request, identity).map(id => ({ id })));
  sources.list("workflow.nodes", "Workflow nodes", nodes);
  sources.list("workflow.routes", "Workflow routes", Object.entries((definition.workflow as { routes?: unknown }).routes ?? {}).map(([nodeId, routes]) => ({ nodeId, routes })));
  sources.fields("workflow.state", "Current runtime records", currentState);
  return prepareDetailIndex({ ...request, contextSources: [...(request.contextSources ?? []), ...sources.sources] },
    { ...inputs, workflowContext: snapshot }, options);
}

async function prepareDetailIndex(request: ContextInput, inputs: InvocationInputs, options: { lookup?: ContextSummaryLookup }): Promise<InvocationInputs> {
  const sources = new AgentContextSources();
  if (request.project.artifacts?.length) sources.list("project.artifacts", "Published artifact catalog", request.project.artifacts);
  if (request.toolCatalog) sources.fields("agent-tool-catalog", "Available Agent Skill/MCP directory", request.toolCatalog as unknown as Record<string, unknown>);
  if (request.terminalControlRepair) sources.record("terminal-control-repair", "Previous handoff for the missing terminal action", request.terminalControlRepair.originalHandoff);
  const contextIndex = await publishAgentContextIndex(inputs.inboxPath, [...(request.contextSources ?? []), ...sources.sources], options);
  return contextIndex ? { ...inputs, contextIndex } : inputs;
}

function contextIdentity(request: ContextInput): WorkflowContextRequest | undefined {
  if (!request.project.orchestration?.agents || request.terminalPushObservation || request.terminalPushCoordination ||
    (request.purpose !== undefined && request.purpose !== "workflow")) return undefined;
  const context = request.executionContext;
  if (request.workflowContext) {
    if (request.workflowContext.scope === "global" || request.workflowContext.groupId) return request.workflowContext;
    const groupRunId = request.workflowContext.groupRunId ?? context?.groupRunId;
    return { ...request.workflowContext, groupRunId, groupId: groupIdFor(request.project, groupRunId, context?.nodeRunId) };
  }
  if (context?.role === "leader" && context.groupRunId) {
    if (request.control?.collaboration?.role === "scoped-main") {
      return { scope: "global", groupRunId: context.groupRunId };
    }
    const groupId = groupIdFor(request.project, context.groupRunId, context.nodeRunId);
    return { scope: "group", groupRunId: context.groupRunId, groupId };
  }
  if (context?.role === "leader" || (!context && request.kind === "main")) return { scope: "global" };
  return undefined;
}

function groupIdFor(state: ProjectState, groupRunId: string | undefined, nodeRunId: string | undefined): string | undefined {
  const scoped = state.scopedGroupRuns?.find(group => group.id === groupRunId);
  if (scoped) return scoped.groupId;
  const legacy = state.groupRuns?.find(group => group.id === groupRunId);
  const node = state.nodeRuns?.find(node => node.id === (nodeRunId ?? legacy?.nodeRunId))?.node;
  return node?.kind === "collaboration" ? node.groupId : undefined;
}

function agentDetails(config: AgentConfig, mcpServers = config.mcpServers ?? []) {
  return { model: config.model, harness: config.harness, instructions: config.instructions,
    skills: [...(config.skills ?? [])], autoSkills: [...(config.autoSkills ?? [])],
    mcpServers: mcpServers.map(server => ({ ...server })), webSearch: config.webSearch,
    permission: config.permission, decisionBy: config.decisionBy, sessionPersistence: config.sessionPersistence };
}

async function installedSkillDetails(selections: Set<string>, catalog: readonly SkillDescriptor[]) {
  const result: Record<string, { name?: string; path?: string; unavailable?: string }> = {};
  const files: Record<string, string> = {};
  for (const selection of selections) {
    if (selection.startsWith("project:")) continue;
    const exact = catalog.find(skill => skill.id === selection || skill.path === selection);
    const named = catalog.filter(skill => skill.name === selection);
    let skill: Pick<SkillDescriptor, "name" | "path"> | undefined = exact ?? (named.length === 1 ? named[0] : undefined);
    // Explicit Skill paths are also supported by SkillCatalog.resolveConfigured.
    // Resolve only the configured SKILL.md, never an arbitrary file selection.
    if (!skill && path.isAbsolute(selection)) {
      try {
        const source = path.basename(selection).toLowerCase() === "skill.md" ? selection : path.join(selection, "SKILL.md");
        skill = { path: await fs.realpath(source), name: path.basename(path.dirname(source)) };
      } catch { /* Keep an explicit unavailable record below. */ }
    }
    if (!skill) { result[selection] = { unavailable: "No matching installed Skill source in this invocation catalog." }; continue; }
    try {
      const handle = await fs.open(skill.path, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0) | (constants.O_NONBLOCK ?? 0));
      try {
        const stat = await handle.stat();
        if (!stat.isFile() || stat.size > 1_048_576) throw new Error("Skill source is not a bounded regular file");
        const content = await handle.readFile("utf8");
        const relative = `skills/${digest({ selection, content })}/SKILL.md`;
        result[selection] = { name: skill.name, path: relative };
        files[relative] = content;
      } finally { await handle.close(); }
    } catch { result[selection] = { name: skill.name, unavailable: "Installed Skill source is currently unreadable." }; }
  }
  return { index: result, files };
}

async function publishedState(projectPath: string, projectId: string, workflowRevision: number, stateRevision: number): Promise<JsonRecord | undefined> {
  const file = authoritativeWorkflowPaths(projectPath).currentState;
  try {
    const value = JSON.parse(await fs.readFile(file, "utf8")) as JsonRecord;
    return value.projectId === projectId && value.workflowRevision === workflowRevision && typeof value.stateRevision === "number" && value.stateRevision >= stateRevision ? value : undefined;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

function projectFacts(state: ProjectState): JsonRecord {
  return { status: state.status, phase: state.phase, frozen: state.collaboration?.frozen ?? false,
    ...(state.activeNodeRunId ? { activeNodeRunId: state.activeNodeRunId } : {}),
    nodeRuns: state.nodeRuns ?? [], groupRuns: state.groupRuns ?? [], tasks: state.tasks ?? [], executions: state.executions ?? [],
    scopedRuntime: { groupRuns: state.scopedGroupRuns ?? [], arrivals: state.scopedArrivals ?? [], executions: state.scopedExecutions ?? [],
      finalIntegrations: state.scopedFinalIntegrations ?? [], agentMerges: state.scopedAgentMerges ?? [],
      groupFinalMerges: state.scopedGroupFinalMerges ?? [], managementTurns: state.scopedManagementTurns ?? [],
      issues: state.scopedGroupIssues ?? [] } };
}

function groupFacts(facts: JsonRecord, state: ProjectState, groupRunId: string | undefined, agents: Set<string>): JsonRecord {
  const scopedRuntime = facts.scopedRuntime as JsonRecord | undefined;
  const scopedRuns = scopedRuntime?.groupRuns as Array<{ id: string; status: string }> | undefined;
  const legacyRuns = facts.groupRuns as Array<{ id: string; status: string }> | undefined;
  const currentGroup = facts.currentGroup as JsonRecord | undefined;
  const result: JsonRecord = { frozen: facts.frozen, status: scopedRuns?.find(group => group.id === groupRunId)?.status
    ?? legacyRuns?.find(group => group.id === groupRunId)?.status
    ?? (currentGroup && groupRunId && currentGroup.groupRunId === groupRunId ? currentGroup.rawStatus : undefined)
    ?? state.scopedGroupRuns?.find(group => group.id === groupRunId)?.status
    ?? state.groupRuns?.find(group => group.id === groupRunId)?.status ?? "unknown" };
  if (scopedRuntime) result.scopedRuntime = Object.fromEntries(Object.entries(scopedRuntime).map(([key, records]) => [key,
    Array.isArray(records) ? records.filter(record => groupRunId && (key === "groupRuns" ? record.id === groupRunId : record.groupRunId === groupRunId)) : []]));
  for (const key of ["groupRuns", "tasks", "executions"] as const) {
    const records = facts[key];
    if (Array.isArray(records)) result[key] = records.filter(record => groupRunId && (key === "groupRuns" ? record.id === groupRunId : record.groupRunId === groupRunId));
  }
  if (groupRunId && currentGroup?.groupRunId === groupRunId) result.currentGroup = currentGroup;
  if (groupRunId && Array.isArray(facts.members) && currentGroup?.groupRunId === groupRunId) {
    result.members = facts.members.filter(member => agents.has(member.agentId));
  }
  return result;
}

function childGroups(state: ProjectState, nodes: readonly NodeRef[]) {
  return nodes.flatMap(node => {
    if (node.kind !== "collaboration") return [];
    const group = state.orchestration.scopedWorkflow?.groups.find(group => group.id === node.groupId);
    return [{ nodeId: node.nodeId, groupId: node.groupId, leaderAgentId: group?.leaderAgentId,
      displayName: state.orchestration.collaborations?.find(group => group.id === node.groupId)?.displayName }];
  });
}

function routeCandidatesFor(request: ContextInput, identity: WorkflowContextRequest): string[] {
  const control = request.control;
  return control?.collaboration && "routeCandidates" in control.collaboration
    ? control.collaboration.routeCandidates : control?.candidates ?? identity.candidates
      ?? (identity.scope === "global" ? request.project.mainCapabilities?.routeCandidates : undefined) ?? [];
}

function preview(request: ContextInput, identity: WorkflowContextRequest, nodes: NodeRef[],
  agents: Record<string, ReturnType<typeof agentDetails>>, local: ScopedWorkflow | undefined,
  metadata: { workflowRevision: number; stateRevision: number }, configurationHash: string,
  paths: Pick<WorkflowContextSnapshot, "definitionPath" | "currentStatePath" | "agentsPath">): string {
  const state = request.project;
  const orchestration = state.orchestration;
  const control = request.control;
  const sourceArrivalRequestId = control?.collaboration && "sourceArrivalRequestId" in control.collaboration
    ? control.collaboration.sourceArrivalRequestId : undefined;
  const sourceArrival = state.scopedArrivals?.find(arrival => arrival.requestId === sourceArrivalRequestId);
  const sourceNodeId = identity.sourceNodeId ?? sourceArrival?.targetNodeId
    ?? (identity.scope === "global" ? state.pendingMainDecision?.sourceAgent : undefined)
    ?? state.nodeRuns?.find(node => node.id === request.executionContext?.nodeRunId)?.node.nodeId
    ?? (!request.executionContext && request.kind === "main" ? request.agent : "not specified");
  const candidates = routeCandidatesFor(request, identity);
  const routes = identity.scope === "global" ? workflowRoutesFor(orchestration) : local?.routes;
  const input = identity.scope === "global" ? [`input --input--> ${orchestration.input.target}`]
    : local?.input.edges.map(edge => `input --${edge.kind}--> ${edge.target}`) ?? [];
  const connections = [...input, ...Object.entries(routes ?? {}).flatMap(([source, edges]) =>
    edges.map(edge => `${source} --${edge.kind}--> ${edge.target}`))];
  const membership = (agentId: string) => {
    if (identity.scope === "group") return [
      ...(agentId === request.agent ? [`${identity.groupId ?? identity.groupRunId}:leader`] : []),
      ...nodes.flatMap(node => node.kind === "agent" && node.agentId === agentId ? [`${identity.groupId ?? identity.groupRunId}/${node.nodeId}`] : [])
    ].join(", ");
    return [
      ...nodes.flatMap(node => node.kind === "agent" && node.agentId === agentId ? [`root/${node.nodeId}`] : []),
      ...(orchestration.scopedWorkflow?.groups.flatMap(group => {
        const references = group.workflow.nodes.filter(node => node.kind === "agent" && node.agentId === agentId);
        return [...(group.leaderAgentId === agentId ? [`${group.id}:leader`] : []),
          ...(references.length === 1 ? [`${group.id}/${references[0].nodeId}`]
            : references.length ? [`${group.id}: ${references.length} node references (see definition.json)`] : [])];
      }) ?? orchestration.collaborations?.filter(group => group.memberAgentIds.includes(agentId)).map(group => `${group.id}/${agentId}`) ?? [])
    ].join(", ") || "configured; no graph reference";
  };
  const rows = Object.entries(agents).map(([agentId, config]) => {
    const description = orchestration.agents.find(agent => agent.name === agentId)?.description;
    const names = (values: string[]) => values.join(", ") || "none";
    return `| ${cell(agentId)} | ${cell(membership(agentId))} | ${cell(description ? brief(description, 180) : "Not configured; inspect instructions")} | ${cell(names(config.skills))} | ${cell(names(config.autoSkills))} | ${cell(names(config.mcpServers.map(server => server.name)))} | source=workflow.agents: ${JSON.stringify(agentId)} |`;
  });
  const groups = identity.scope === "global" ? orchestration.scopedWorkflow?.groups.map(group =>
    `- ${group.id}: parent=${group.parentGroupId ?? "root"}; leader=${group.leaderAgentId}; nodes=${group.workflow.nodes.length}; direct Agents=${[...new Set(group.workflow.nodes.flatMap(node => node.kind === "agent" ? [node.agentId] : []))].join(", ")}; child groups=${group.workflow.nodes.flatMap(node => node.kind === "collaboration" ? [node.groupId] : []).join(", ") || "none"}; local connections in definition.json`)
      ?? orchestration.collaborations?.map(group => `- ${group.id}: ${brief(group.displayName ?? group.id, 180)}; members=${group.memberAgentIds.join(", ")}`)
    : childGroups(state, nodes).map(group => `- ${group.nodeId}=>Group:${group.groupId}; leader=${group.leaderAgentId ?? "not specified"}; ${brief(group.displayName ?? "", 180)} (child interface only)`);
  const loops = identity.scope === "global" ? orchestration.loops : local?.loops;
  return redactTrace([
    `## ${identity.scope === "global" ? "Global" : "Current group"} Workflow overview`,
    `Configuration revision: ${metadata.workflowRevision}; state revision: ${metadata.stateRevision}; configuration hash: ${configurationHash}.`,
    `Current Agent: ${request.agent}; role: ${identity.scope === "global" ? "global Main" : "group Leader"}; scope: ${identity.scope === "global" ? "project" : identity.groupId ?? identity.groupRunId}; group run: ${identity.groupRunId ?? request.executionContext?.groupRunId ?? "none"}.`,
    `Decision source node: ${sourceNodeId}; purpose/wake reason: ${identity.purpose ?? (identity.scope === "global" ? state.pendingMainDecision?.reason : undefined) ?? "workflow management"}.`,
    `Legal route candidates for this turn (exact node IDs): ${JSON.stringify(candidates)}. An empty list grants no routing target; planning/control tools have their own scope.`,
    `Nodes (${nodes.length} total):\n${nodes.map(node => node.kind === "agent" ? `- ${node.nodeId} => Agent ${node.agentId}` : `- ${node.nodeId} => Group ${node.groupId}`).join("\n")}`,
    `Connections (${connections.length} total):\n${connections.join("\n") || "No fixed internal routes; use the current group planning contract."}`,
    groups?.length ? `Group interfaces and hierarchy:\n${groups.join("\n")}` : undefined,
    loops?.length ? `Loops:\n${loops.map(loop => `- ${loop.id}: ${loop.from} -> ${loop.to}; batch=${loop.maxIterations}; exit=${loop.exitTo}`).join("\n")}` : undefined,
    identity.scope === "global" ? `Project completion: terminal node=${orchestration.termination.agent}; condition=${brief(orchestration.termination.condition, 800)}; automatic=${orchestration.termination.automatic}.\nDelivery: ${brief(JSON.stringify(orchestration.resultFormat ?? {}), 500)}`
      : "Completion scope: finish ends a local path. Group completion still requires its current integration evidence and an accepted complete_group decision; it does not complete the project.",
    "Agent capability index (names only; full instructions and definitions are available on demand):",
    "| Agent ID | Scope / node mapping | Role summary | Skills | autoSkills | MCP services | Detail location |",
    "| --- | --- | --- | --- | --- | --- | --- |", ...rows,
    `Agent count: ${Object.keys(agents).length}; every Agent is listed above. Use source=workflow.agents in the context index for individual Agent details, and source=workflow.nodes or workflow.routes for graph details.`,
    "Skills and MCP columns describe the Agent's selected configuration. Invocation-bound filesystem, orchestration-control and SII tools are exposed separately by the current tools/list; 'none' here means no configured selection.",
    `Read-only detail sources for this turn:\n- Workflow definition: ${paths.definitionPath}\n- Current runtime facts: ${paths.currentStatePath}\n- Agent instructions, Skills and MCP configuration: ${paths.agentsPath}`,
    "Prefer the on-demand context index to open one Agent, project Skill definition, project MCP definition or installed Skill reference. Their source keys are workflow.agents, workflow.skill-definitions, workflow.mcp-definitions and workflow.installed-skills. The legacy complete agents.json is retained for compatibility; do not load it by default. Use each chosen file's rootId/path reference and bounded reads for large records.",
    identity.scope === "global" && orchestration.decisionPlans[sourceNodeId]
      ? `Current node decision guidance: ${brief(orchestration.decisionPlans[sourceNodeId], 600)}` : undefined,
    identity.scope === "group" ? "These detail views cover this group only. A child group is a node interface; its own Leader receives its internal graph. Do not infer parent/sibling workflows from this view." : undefined,
    "Use this overview, current position, legal candidates and evidence to decide. Read the relevant details when Skills/MCP names are insufficient, several candidates fit, dependencies are unclear, or the configuration revision/hash differs from memory. When the evidence is sufficient, decide directly without reloading unchanged details. Seeing an Agent in the index does not make it a legal route target. Only committed configuration describes active capabilities; an editable proposal is not the active configuration. Preserve your current session and use the current turn's role/scope."
  ].filter(Boolean).join("\n\n"));
}

function brief(value: string, length: number): string {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length <= length ? text : `${text.slice(0, length)}… (see details)`;
}
function cell(value: string): string { return value.replaceAll("|", "\\|").replace(/[\r\n]+/g, " "); }
function digest(value: unknown): string { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }

async function pinnedDirectory(directory: string): Promise<void> {
  try { await fs.mkdir(directory, { mode: 0o700 }); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error; }
  const stat = await fs.lstat(directory);
  if (!stat.isDirectory() || stat.isSymbolicLink() || await fs.realpath(directory) !== directory) {
    throw new Error("Workflow detail directory is not a pinned regular directory");
  }
}

async function writeSnapshot(file: string, value: unknown): Promise<void> {
  const content = `${redactTrace(JSON.stringify(value, null, 2))}\n`;
  await writeSnapshotText(file, content);
}

async function writeSnapshotText(file: string, content: string): Promise<void> {
  const stat = await fs.lstat(file).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return undefined;
    throw error;
  });
  if (stat) {
    if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1 || await fs.readFile(file, "utf8") !== content) {
      throw new Error("Existing Workflow detail snapshot does not match the trusted configuration");
    }
    return;
  }
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporary, content, { flag: "wx", mode: 0o400 });
    await fs.rename(temporary, file);
  } finally {
    await fs.rm(temporary, { force: true });
  }
}
