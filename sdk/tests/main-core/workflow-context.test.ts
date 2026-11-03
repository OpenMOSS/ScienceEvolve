import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { cloneAgentOrchestrationTemplate } from "../../src/core/agent-orchestration.js";
import { mergeAgentConfigs } from "../../src/core/validation.js";
import { publishAuthoritativeWorkflowFiles } from "../../src/core/orchestration-control-bridge.js";
import { prepareWorkflowContext } from "../../src/core/workflow-context.js";
import { compileInvocationPolicy, compileWorkflowPrompt } from "../../src/core/harness-runtime/invocation-policy.js";
import { compileFilesystemAuthority, filesystemAuthorityPrompt, prepareFilesystemAuthorityMcp } from "../../src/core/harness-runtime/filesystem-authority.js";
import type { InvocationInputs } from "../../src/core/harness-runtime/contracts.js";
import type { AgentRunRequest, AuthoritativeWorkflowFiles, ProjectState } from "../../src/core/types.js";

const roots: string[] = [];
afterEach(async () => { await Promise.all(roots.splice(0).map(root => fs.rm(root, { recursive: true, force: true }))); });

async function fixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-workflow-context-")); roots.push(root);
  const projectPath = path.join(root, "prj_workflow_context");
  const workspacePath = path.join(projectPath, "git-worktrees", "agents", "main");
  const runtimePath = path.join(projectPath, "runtime", "inv_context");
  const inputRoot = path.join(workspacePath, ".scienceevolve", "management", "inv_context");
  await Promise.all([inputRoot, runtimePath].map(directory => fs.mkdir(directory, { recursive: true })));
  const inboxPath = path.join(inputRoot, "inv_context-Inbox.md");
  const memoryPath = path.join(inputRoot, "Memory.md");
  await fs.writeFile(inboxPath, "Choose the Agent that can run the experiment.");
  await fs.writeFile(memoryPath, "Original Agent-authored memory.");
  const orchestration = cloneAgentOrchestrationTemplate();
  orchestration.schemaVersion = 3;
  orchestration.allowMainReconfiguration = false;
  orchestration.collaborations = ["G", "H", "Sibling"].map(id => ({ id, displayName: id, memberAgentIds: [], renamePolicy: "editable" }));
  orchestration.routes = { main: [{ kind: "weak", target: "G" }, { kind: "weak", target: "review" }],
    G: [{ kind: "strong", target: "review" }], review: [{ kind: "strong", target: "finish" }] };
  orchestration.scopedWorkflow = { schemaVersion: 1, rootAgentIds: ["main", "review"], groups: [
    { id: "G", leaderAgentId: "main", allowLeaderReconfiguration: false, workflow: {
      nodes: [{ kind: "agent", nodeId: "experiment_node", agentId: "execution" }, { kind: "collaboration", nodeId: "child_node", groupId: "H" }],
      input: { source: "input", edges: [{ kind: "parallel", target: "experiment_node" }] },
      routes: { experiment_node: [{ kind: "weak", target: "child_node" }], child_node: [{ kind: "strong", target: "finish" }] },
      loops: [{ id: "experiment_loop", from: "experiment_node", to: "child_node", maxIterations: 3, exitTo: "finish" }] } },
    { id: "H", parentGroupId: "G", leaderAgentId: "review", allowLeaderReconfiguration: false, workflow: {
      nodes: [{ kind: "agent", nodeId: "child_private_node", agentId: "idea" }],
      input: { source: "input", edges: [{ kind: "parallel", target: "child_private_node" }] },
      routes: { child_private_node: [{ kind: "strong", target: "finish" }] } } },
    { id: "Sibling", leaderAgentId: "main", allowLeaderReconfiguration: false, workflow: {
      nodes: [{ kind: "agent", nodeId: "sibling_private_node", agentId: "writing" }],
      input: { source: "input", edges: [{ kind: "parallel", target: "sibling_private_node" }] },
      routes: { sibling_private_node: [{ kind: "strong", target: "finish" }] } } }
  ] };
  const agents = mergeAgentConfigs(undefined, orchestration);
  for (const [name, config] of Object.entries(agents)) {
    config.skills = []; config.autoSkills = []; config.mcpServers = []; config.instructions = `FULL_INSTRUCTIONS_${name}`;
  }
  agents.execution.skills = ["project:experiment", "builtin:installed-experiment"];
  agents.execution.autoSkills = ["project:figure"];
  agents.execution.mcpServers = [{ name: "experiment-service", project: "experiments" }];
  agents.idea.skills = ["project:child-private-skill"];
  agents.idea.mcpServers = [{ name: "child-private-service", project: "child-private-mcp" }];
  agents.main.gatewaySnapshot = { apiKey: "gateway-credential-must-stay-private" } as AgentRunRequest["project"]["agents"][string]["gatewaySnapshot"];
  const state = { id: "prj_workflow_context", title: "Context", requirement: "Choose experiment capabilities",
    status: "running", phase: "management", eventSeq: 12, workflowRevision: 7, agents, orchestration,
    collaboration: { stateRevision: 12, frozen: false, eventSeq: 12, routeOutbox: [], usage: [] },
    skillDefinitions: Object.fromEntries(["experiment", "figure", "child-private-skill", "unrelated-skill"].map(name => [name, { files: { "SKILL.md": `FULL_SKILL_${name}` } }])),
    mcpDefinitions: Object.fromEntries(["experiments", "child-private-mcp"].map(name => [name, { entrypoint: "service.js", files: { "service.js": `FULL_MCP_IMPLEMENTATION_${name}` } }])),
    scopedGroupRuns: [{ id: "run-G", groupId: "G", leaderAgentId: "main", status: "running" },
      { id: "run-H", groupId: "H", leaderAgentId: "review", status: "running" }],
    scopedArrivals: [{ requestId: "arrival-G", groupRunId: "run-G", targetNodeId: "experiment_node", status: "completed" },
      { requestId: "arrival-H", groupRunId: "run-H", targetNodeId: "child_private_node", status: "running" }],
    scopedExecutions: [{ id: "execution-G", groupRunId: "run-G", agentId: "execution", status: "completed" }],
    agentSessionIds: { main: "original-main-native-session" }, userInputs: [] } as unknown as ProjectState;
  const skillPath = path.join(root, "installed-SKILL.md"); await fs.writeFile(skillPath, "FULL_INSTALLED_SKILL_BODY");
  const inputs: InvocationInputs = { projectPath, workspacePath, inboxPath, memoryPath, runtimePath, inboxSha256: "fixture" };
  const request = { project: state, agent: "main", kind: "main", purpose: "workflow", permission: "workspace",
    invocationId: "inv_context", projectPath, workspacePath, inboxPath, runtimePath, schemaPath: "", skillPaths: [], availableSkillPaths: [skillPath],
    availableSkills: [{ id: "builtin:installed-experiment", name: "Installed experiment", path: skillPath, description: "Experiment procedures", source: "builtin" }],
    workflowContext: { scope: "global", sourceNodeId: "main", purpose: "outer-routing", candidates: ["G", "review"] } } as AgentRunRequest;
  return { root, request, state, inputs, inputRoot };
}

async function json(file: string) { return JSON.parse(await fs.readFile(file, "utf8")); }

describe("management Workflow context", () => {
  // Linux fixture baseline (UTF-16 / UTF-8 / lines): global 18474/18726/167,
  // group 15229/15307/143, group-65 35572/35650/465. Allow 5% for readable
  // wording, rounded up to 128 units / 256 bytes / 8 lines. These are output
  // regression budgets, not token counts or model context-window limits.
  it.each([
    { scene: "global", scope: "global" as const, extraAgents: 0, budget: { utf16: 19456, utf8: 19712, lines: 176 } },
    { scene: "group", scope: "group" as const, extraAgents: 0, budget: { utf16: 16000, utf8: 16128, lines: 152 } },
    { scene: "group-65", scope: "group" as const, extraAgents: 65, budget: { utf16: 37376, utf8: 37632, lines: 496 } }
  ])("bounds assembled workflow output and preserves scope ($scene)", async ({ scene, scope, extraAgents, budget }) => {
    const f = await fixture();
    const group = f.state.orchestration.scopedWorkflow!.groups.find(group => group.id === "G")!;
    for (let index = 0; index < extraAgents; index++) {
      const agentId = `budget_agent_${index}`, nodeId = `budget_node_${index}`;
      f.state.agents[agentId] = structuredClone(f.state.agents.execution!);
      f.state.orchestration.agents.push({ name: agentId, template: "general" });
      group.workflow.nodes.push({ kind: "agent", nodeId, agentId });
      group.workflow.input.edges.push({ kind: "parallel", target: nodeId });
      group.workflow.routes[nodeId] = [{ kind: "strong", target: "finish" }];
    }
    const candidates = scope === "global" ? ["G", "review"] : ["finish"];
    f.request.workflowContext = scope === "global" ? { scope, candidates, purpose: "outer-routing" }
      : { scope, groupId: "G", groupRunId: "run-G", candidates, purpose: "route" };
    const inputs = await prepareWorkflowContext(f.request, f.inputs);
    const context = inputs.workflowContext!;
    const policy = compileInvocationPolicy(f.state.agents.main, f.request);
    const prompt = compileWorkflowPrompt(f.request, inputs, policy);
    const normalized = prompt.replaceAll(f.root, "<fixture-root>")
      .replaceAll(JSON.stringify(f.root).slice(1, -1), "<fixture-root>").replaceAll("\r\n", "\n");
    const metrics = { utf16: normalized.length, codePoints: [...normalized].length,
      utf8: Buffer.byteLength(normalized), lines: normalized.split("\n").length - Number(normalized.endsWith("\n")) };
    const details = await json(context.agentsPath);
    const agentIds = Object.keys(details.agents);
    console.info("workflow-output-budget", JSON.stringify({ scene, ...metrics, visibleAgents: agentIds.length, budget }));
    expect(metrics.utf16).toBeLessThanOrEqual(budget.utf16);
    expect(metrics.utf8).toBeLessThanOrEqual(budget.utf8);
    expect(metrics.lines).toBeLessThanOrEqual(budget.lines);
    for (const agentId of agentIds) {
      expect(prompt).not.toContain(`| ${agentId} |`);
      expect(details.agents[agentId].instructions).toBe(f.state.agents[agentId].instructions);
    }
    expect(prompt).not.toContain(context.preview);
    expect(await fs.readFile(context.definitionPath, "utf8")).toContain("workflowRevision");
    expect(prompt).not.toContain("Configuration revision: 7; state revision: 12;");
    expect(prompt).not.toContain("Current Agent: main; role:");
    expect(context.preview).toContain(`Legal route candidates for this turn (exact node IDs): ${JSON.stringify(candidates)}`);
    expect(prompt).toContain("OpenFARS permission mode:");
    expect(prompt).not.toContain("gateway-credential-must-stay-private");
    if (scope === "group") expect(context.preview).toContain("it does not complete the project");
    else expect(context.preview).toContain("Project completion:");
    if (extraAgents) {
      expect(context.preview).toContain("budget_node_64 => Agent budget_agent_64");
      expect(context.preview).toContain("budget_node_64 --strong--> finish");
      expect(context.preview).toContain("budget_agent_64");
    }
  });

  it("shows the last node and connection when a group has more than 50 graph entries", async () => {
    const f = await fixture();
    const workflow = f.state.orchestration.scopedWorkflow!.groups.find(group => group.id === "G")!.workflow;
    for (let index = 0; index < 65; index++) {
      const nodeId = `extra_node_${index}`;
      workflow.nodes.push({ kind: "agent", nodeId, agentId: "execution" });
      workflow.input.edges.push({ kind: "parallel", target: nodeId });
      workflow.routes[nodeId] = [{ kind: "strong", target: "finish" }];
    }
    f.request.workflowContext = { scope: "group", groupId: "G", groupRunId: "run-G", candidates: ["finish"] };
    const inputs = await prepareWorkflowContext(f.request, f.inputs);
    expect(inputs.workflowContext!.preview).toContain("extra_node_64 => Agent execution");
    expect(inputs.workflowContext!.preview).toContain("input --parallel--> extra_node_64");
    expect(inputs.workflowContext!.preview).toContain("extra_node_64 --strong--> finish");
    expect(inputs.workflowContext!.preview).not.toContain("first 30");
    expect(inputs.workflowContext!.preview).not.toContain("first 50");
  });

  it("shows every Agent, candidate and capability index entry while keeping detail bodies separate", async () => {
    const f = await fixture();
    const candidates = Array.from({ length: 65 }, (_, index) => `agent_${index}`);
    for (const name of candidates) {
      f.state.agents[name] = { ...f.state.agents.main, instructions: `FULL_DETAIL_${name}`.repeat(1000) };
      f.state.orchestration.agents.push({ ...f.state.orchestration.agents[0], name });
    }
    f.state.agents.main.skills = Array.from({ length: 500 }, (_, index) => `builtin:large-skill-${index}`);
    f.request.workflowContext!.candidates = candidates;
    const inputs = await prepareWorkflowContext(f.request, f.inputs);
    expect(inputs.workflowContext!.preview.length).toBeLessThan(JSON.stringify(f.state.agents).length / 4);
    for (const candidate of candidates) expect(inputs.workflowContext!.preview).toContain(`"${candidate}"`);
    expect(inputs.workflowContext!.preview).toContain("builtin:large-skill-499");
    expect(inputs.workflowContext!.preview).not.toContain("FULL_DETAIL_");
    const index = await json(inputs.contextIndex!.indexPath);
    const directory = index.baseDirectory;
    const source = index.entries.find((entry: any) => entry.key === "workflow.route-candidates");
    const first = await json(path.join(directory, source.list.path));
    expect(first.entries).toHaveLength(65); expect(first.entries.at(-1).id).toBe("agent_64");
    expect(first.nextPage).toBeUndefined(); expect(first.lastPage).toBeUndefined();
    const skills = index.entries.find((entry: any) => entry.key === "workflow.skill-definitions");
    const list = await json(path.join(directory, skills.list.path));
    const selected = list.entries.find((entry: any) => entry.name === "experiment");
    expect(await json(path.join(directory, selected.detail.path))).toMatchObject({ definition: { files: { "SKILL.md": "FULL_SKILL_experiment" } } });
  });

  it.each([false, true])("provides global capabilities and readable details without auto-inlining bodies (editing=%s)", async editing => {
    const f = await fixture(); f.state.orchestration.allowMainReconfiguration = editing;
    const prepared = await prepareWorkflowContext(f.request, f.inputs);
    const context = prepared.workflowContext!;
    const details = await json(context.agentsPath);
    expect(context.preview).toContain("Global Workflow overview");
    expect(context.preview).toContain('Legal route candidates for this turn (exact node IDs): ["G","review"]');
    expect(context.preview).toContain("G/experiment_node");
    expect(context.preview).toContain("project:experiment");
    expect(context.preview).toContain("project:figure");
    expect(context.preview).toContain("experiment-service");
    expect(details.agents.execution.instructions).toBe("FULL_INSTRUCTIONS_execution");
    expect(details.skillDefinitions.experiment.files["SKILL.md"]).toBe("FULL_SKILL_experiment");
    expect(details.mcpDefinitions.experiments.files["service.js"]).toBe("FULL_MCP_IMPLEMENTATION_experiments");
    expect(JSON.stringify(details)).not.toContain("FULL_INSTALLED_SKILL_BODY");
    const skillFile = path.join(path.dirname(context.agentsPath), details.installedSkills["builtin:installed-experiment"].path);
    expect(await fs.readFile(skillFile, "utf8")).toBe("FULL_INSTALLED_SKILL_BODY");
    for (const marker of ["FULL_INSTRUCTIONS_", "FULL_SKILL_", "FULL_INSTALLED_SKILL_BODY", "FULL_MCP_IMPLEMENTATION_", "gateway-credential-must-stay-private"]) {
      expect(context.preview).not.toContain(marker);
    }
    expect(JSON.stringify(details)).not.toContain("gateway-credential-must-stay-private");
    expect((await fs.stat(context.agentsPath)).mode & (process.platform === "win32" ? 0o222 : 0o777)).toBe(process.platform === "win32" ? 0 : 0o400);
    const prompt = compileWorkflowPrompt(f.request, prepared, compileInvocationPolicy(f.state.agents.main, f.request), { inlineInbox: "L".repeat(32_001) });
    expect(prompt).not.toContain("Global Workflow overview");
    expect(prompt).toContain("L".repeat(32_001));
    expect(prompt).not.toContain("| Skills | autoSkills | MCP services |");
    expect(prompt).not.toContain("<openfars_inbox>");
    expect(prompt).not.toContain("FULL_INSTRUCTIONS_execution");
  });

  it.each(["main", "review"])("limits a group Leader named %s to its group, keeping child groups as interfaces", async leader => {
    const f = await fixture();
    f.state.orchestration.scopedWorkflow!.groups[0].leaderAgentId = leader;
    f.request.agent = leader; f.request.kind = leader === "main" ? "main" : "worker";
    f.request.executionContext = { role: "leader", nodeRunId: "root-G", groupRunId: "run-G", coordinatorEpoch: 1 };
    f.state.mainCapabilities = { routeCandidates: ["foreign_route_target"] } as ProjectState["mainCapabilities"];
    f.state.pendingMainDecision = { sourceAgent: "foreign_source_node", reason: "foreign_global_wake_reason" } as ProjectState["pendingMainDecision"];
    delete f.request.workflowContext;
    const prepared = await prepareWorkflowContext(f.request, f.inputs);
    const context = prepared.workflowContext!;
    expect(context.scope).toBe("group"); expect(context.groupId).toBe("G");
    expect(context.preview).toContain("experiment_node => Agent execution");
    expect(context.preview).toContain("child_node => Group H");
    expect(context.preview).toContain("input --parallel--> experiment_node");
    expect(context.preview).toContain("experiment_node --weak--> child_node");
    expect(context.preview).toContain("experiment_loop");
    expect(context.preview).not.toContain("Project completion:");
    const definition = await json(context.definitionPath);
    const details = await json(context.agentsPath);
    expect(Object.keys(details.agents).sort()).toEqual([leader, "execution"].sort());
    expect(Object.keys(details.skillDefinitions).sort()).toEqual(["experiment", "figure"]);
    expect(Object.keys(details.mcpDefinitions)).toEqual(["experiments"]);
    expect(definition.childGroups).toMatchObject([{ nodeId: "child_node", groupId: "H", leaderAgentId: "review" }]);
    const received = JSON.stringify([context.preview, definition, details, await json(context.currentStatePath)]);
    for (const excluded of ["Sibling", "sibling_private_node", "child_private_node", "child-private-skill", "child-private-mcp", "unrelated-skill", "arrival-H", "foreign_route_target", "foreign_source_node", "foreign_global_wake_reason"]) {
      expect(received).not.toContain(excluded);
    }
  });

  it("gives a nested group's Leader its own scope and keeps the original session across global/local turns and config updates", async () => {
    const f = await fixture(); const originalSession = structuredClone(f.state.agentSessionIds);
    const global = await prepareWorkflowContext(f.request, f.inputs);
    f.request.workflowContext = { scope: "group", groupId: "H", groupRunId: "run-H", purpose: "route", candidates: ["finish"] };
    f.request.agent = "review"; f.request.kind = "worker";
    const nested = await prepareWorkflowContext(f.request, f.inputs);
    expect(nested.workflowContext!.preview).toContain("child_private_node => Agent idea");
    expect(nested.workflowContext!.preview).not.toContain("experiment_node");
    expect(Object.keys((await json(nested.workflowContext!.agentsPath)).agents).sort()).toEqual(["idea", "review"]);
    f.request.agent = "main"; f.request.kind = "main"; f.request.workflowContext = { scope: "global", candidates: ["review"] };
    f.state.workflowRevision = 8; f.state.collaboration!.stateRevision = 13;
    f.state.agents.execution.autoSkills = [];
    f.state.agents.execution.mcpServers = [{ name: "new-experiment-service", url: "https://example.invalid/mcp" }];
    const changed = await prepareWorkflowContext(f.request, nested);
    expect(changed.workflowContext).toMatchObject({ scope: "global", workflowRevision: 8, stateRevision: 13 });
    expect(changed.workflowContext!.configurationHash).not.toBe(global.workflowContext!.configurationHash);
    expect(changed.workflowContext!.preview).toContain("new-experiment-service");
    expect(changed.workflowContext!.preview).not.toContain("project:figure");
    expect((await json(global.workflowContext!.agentsPath)).agents.execution.autoSkills).toEqual(["project:figure"]);
    expect(f.state.agentSessionIds).toEqual(originalSession);
    expect(await fs.readFile(f.inputs.memoryPath, "utf8")).toBe("Original Agent-authored memory.");
  });

  it("filters existing authoritative integration/provider facts instead of inferring completion from the graph", async () => {
    const f = await fixture();
    const files = { definition: { schemaVersion: 1, projectId: f.state.id, workflowRevision: 7, workflow: f.state.orchestration },
      currentState: { schemaVersion: 1, projectId: f.state.id, workflowRevision: 7, stateRevision: 15, runState: "running", frozen: false, members: [],
        scopedRuntime: { groupRuns: f.state.scopedGroupRuns, arrivals: f.state.scopedArrivals, executions: f.state.scopedExecutions,
          finalIntegrations: [], agentMerges: [{ groupRunId: "run-G", providerProof: "actual experiment merge" }, { groupRunId: "run-H", providerProof: "child proof" }],
          groupFinalMerges: [], managementTurns: [], activities: [], issues: [] } } } as unknown as AuthoritativeWorkflowFiles;
    await publishAuthoritativeWorkflowFiles(f.inputs.projectPath, files);
    f.request.workflowContext = { scope: "group", groupId: "G", groupRunId: "run-G", purpose: "complete" };
    const prepared = await prepareWorkflowContext(f.request, f.inputs);
    const facts = await json(prepared.workflowContext!.currentStatePath);
    expect(facts.stateRevision).toBe(15);
    expect(facts.scopedRuntime.agentMerges).toEqual([{ groupRunId: "run-G", providerProof: "actual experiment merge" }]);
    expect(facts.scopedRuntime.arrivals).toHaveLength(1);
    expect(facts.status).toBe("running");
    expect(prepared.workflowContext!.preview).toContain("accepted complete_group decision");
  });

  it("uses live control candidates and current node identity rather than trusting the global capability index", async () => {
    const f = await fixture();
    f.request.control = { candidates: ["review"], stateVersion: 1 } as AgentRunRequest["control"];
    const prepared = await prepareWorkflowContext(f.request, f.inputs);
    expect(prepared.workflowContext!.preview).toContain('Legal route candidates for this turn (exact node IDs): ["review"]');
    expect(prepared.workflowContext!.preview).toContain("Seeing an Agent in the index does not make it a legal route target");
    expect(f.request.control.candidates).toEqual(["review"]);
    expect(await prepareWorkflowContext({ ...f.request, agent: "execution", kind: "worker", workflowContext: undefined }, f.inputs)).toBe(f.inputs);
  });

  it("does not attribute unscoped runtime records to a group with no active run", async () => {
    const f = await fixture();
    const files = { definition: { workflowRevision: 7 },
      currentState: { stateRevision: 16, members: [{ agentId: "execution", marker: "unscoped-member" }],
        tasks: [{ agentId: "execution", marker: "unscoped-task" }],
        scopedRuntime: { activities: [{ agentId: "execution", marker: "unscoped-activity" }] } }
    } as unknown as AuthoritativeWorkflowFiles;
    f.request.workflowContext = { scope: "group", groupId: "G" };
    const prepared = await prepareWorkflowContext(f.request, f.inputs, files);
    const facts = await json(prepared.workflowContext!.currentStatePath);
    expect(facts.status).toBe("unknown");
    expect(facts.tasks).toEqual([]);
    expect(facts.scopedRuntime.activities).toEqual([]);
    expect(JSON.stringify(facts)).not.toContain("unscoped-");
  });

  it("keeps explicitly configured Skill paths readable even when the Skill is not in the installed catalog", async () => {
    const f = await fixture();
    const directory = path.join(f.root, "configured-custom-skill"); await fs.mkdir(directory);
    await fs.writeFile(path.join(directory, "SKILL.md"), "Explicit custom Skill instructions");
    f.state.agents.execution.skills = [directory];
    f.request.workflowContext = { scope: "group", groupId: "G", groupRunId: "run-G" };
    const prepared = await prepareWorkflowContext(f.request, f.inputs);
    const details = await json(prepared.workflowContext!.agentsPath);
    const reference = details.installedSkills[directory];
    expect(reference.unavailable).toBeUndefined();
    expect(await fs.readFile(path.join(path.dirname(prepared.workflowContext!.agentsPath), reference.path), "utf8"))
      .toBe("Explicit custom Skill instructions");
  });

  it.runIf(process.platform === "linux")("reads scope-filtered details with the actual filesystem MCP rootId/path and refuses writes and the legacy symlink", async () => {
    const f = await fixture();
    f.request.workflowContext = { scope: "group", groupId: "G", groupRunId: "run-G" };
    const prepared = await prepareWorkflowContext(f.request, f.inputs);
    const serviceUserRoot = path.join(f.root, "separate-service-home"); await fs.mkdir(serviceUserRoot);
    await fs.symlink(path.dirname(prepared.workflowContext!.agentsPath), path.join(f.inputs.workspacePath, "workflow"));
    const authority = await compileFilesystemAuthority({ permission: "workspace", role: "leader", gitEnabled: true,
      serviceUserRoot, executionWorktree: f.inputs.workspacePath, protectedRoots: [f.inputs.runtimePath], inputReadRoots: [f.inputRoot] });
    const mcp = await prepareFilesystemAuthorityMcp({ authority, executionRuntimePath: f.inputs.runtimePath });
    const client = new Client({ name: "workflow-context-test", version: "1" });
    const transport = new StdioClientTransport({ command: mcp.row.command, args: mcp.row.args, stderr: "pipe" });
    await client.connect(transport);
    try {
      const references = filesystemAuthorityPrompt({ ...authority, rawTools: "forbidden" }, prepared);
      expect(references).toContain("Read-only Agent / Skills / MCP details: rootId=");
      const root = authority.rootBindings.find(binding => binding.path === f.inputRoot)!;
      const relative = path.relative(root.path, prepared.workflowContext!.agentsPath);
      const result = await client.callTool({ name: "read_file", arguments: { rootId: root.id, path: relative } });
      expect(result.isError).not.toBe(true);
      const payload = JSON.parse((result.content as Array<{ text: string }>)[0].text);
      const details = JSON.parse(payload.content);
      expect(Object.keys(details.agents).sort()).toEqual(["execution", "main"]);
      expect(details.agents.execution.mcpServers).toEqual([{ name: "experiment-service", project: "experiments" }]);
      const skill = details.installedSkills["builtin:installed-experiment"].path;
      const skillResult = await client.callTool({ name: "read_file", arguments: { rootId: root.id, path: path.join(path.dirname(relative), skill) } });
      expect(JSON.parse((skillResult.content as Array<{ text: string }>)[0].text).content).toBe("FULL_INSTALLED_SKILL_BODY");
      const denied = await client.callTool({ name: "write_file", arguments: { rootId: root.id, path: relative, content: "overwrite" } });
      expect(denied.isError).toBe(true);
      const workspaceRoot = authority.rootBindings.find(binding => binding.path === f.inputs.workspacePath)!;
      const linked = await client.callTool({ name: "read_file", arguments: { rootId: workspaceRoot.id, path: "workflow/agents.json" } });
      expect(linked.isError).toBe(true);
    } finally { await client.close(); }
  });
});
