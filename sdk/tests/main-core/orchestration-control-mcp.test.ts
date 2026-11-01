import { pathToFileURL as sdkFixtureFileURL } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import net from "node:net";
import { promises as fs, openSync, closeSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ControlActionService, startControlActionBridge } from "../../src/core/orchestration-control-bridge.js";
import { HarnessRuntimeFacade } from "../../src/core/harness-runtime/runtime.js";
import { CollaborationStateError } from "../../src/core/collaboration-state/errors.js";
import type { AgentRunRequest, ControlAction, ControlActionEnvelope } from "../../src/core/types.js";

const roots: string[] = [];
const source = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../src/core/orchestration-control-mcp.ts"
);
const tsxLoader = sdkFixtureFileURL(createRequire(import.meta.url).resolve("tsx")).href;

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true })));
});

async function runMcp(
  context: Record<string, unknown>,
  requests: Array<Record<string, unknown>>
): Promise<Array<Record<string, unknown>>> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-orch-mcp-"));
  roots.push(root);
  const input = path.join(root, "input.jsonl");
  const output = path.join(root, "output.jsonl");
  const error = path.join(root, "error.log");
  await fs.writeFile(input, `${requests.map((request) => JSON.stringify(request)).join("\n")}\n`, "utf8");
  const descriptors = [openSync(input, "r"), openSync(output, "w"), openSync(error, "w")];
  const child = spawn(process.execPath, ["--import", tsxLoader, source], {
    cwd: root,
    env: {
      ...process.env,
      SCIENCEEVOLVE_CONTROL_CONTEXT: JSON.stringify(context),
      SCIENCEEVOLVE_CONTROL_CAPABILITY: "capability-test-secret"
    },
    stdio: descriptors,
    windowsHide: true
  });
  descriptors.forEach((descriptor) => closeSync(descriptor));
  const result = await new Promise<{ code: number | null }>((resolve, reject) => {
    child.once("error", reject);
    child.once("close", (code) => resolve({ code }));
  });
  const stderrText = await fs.readFile(error, "utf8");
  if (result.code !== 0) throw new Error(stderrText);
  const rawOutput = (await fs.readFile(output, "utf8")).trim();
  if (!rawOutput) throw new Error(`MCP returned no responses (code: ${result.code}, stderr: ${stderrText})`);
  return rawOutput.split("\n").filter(Boolean).map((line) => JSON.parse(line) as Record<string, unknown>);
}

function context(root: string, overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    projectId: "prj_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    agent: "branch",
    invocationId: "inv_aaaaaaaa",
    stateVersion: 4,
    kind: "worker",
    candidates: ["writing", "review"],
    decisionBy: "agent",
    allowUserIntervention: true,
    canComplete: false,
    stagingPath: path.join(root, "actions.json"),
    workspacePath: root,
    ...overrides
  };
}

function expectRecoverableToolError(
  message: Record<string, unknown> | undefined,
  detail?: string
): void {
  expect(message?.error).toBeUndefined();
  expect(message?.result).toMatchObject({ isError: true });
  if (detail) expect(JSON.stringify(message?.result)).toContain(detail);
}

describe("orchestration control MCP", () => {
  it("keeps user requests disabled even when a retained Main capability says they are allowed", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-disabled-user-capability-")); roots.push(root);
    const settings = context(root, { kind: "main", agent: "main", allowUserIntervention: false,
      mainCapabilities: { schemaVersion: 1, controlMode: "autonomous", routeCandidates: ["writing"],
        canReconfigure: false, canComplete: false, canRequestUser: true } });
    const results = await runMcp(settings, [{ id: 1, method: "tools/list" },
      { id: 2, method: "tools/call", params: { name: "request_user", arguments: {
        callId: "ask", message: "Please choose the research topic", rationale: "Topic is missing" } } }]);
    expect((results[0]!.result as { tools: Array<{ name: string }> }).tools.map(tool => tool.name)).not.toContain("request_user");
    expectRecoverableToolError(results[1], "continue research without waiting for clarification");
    await expect(fs.readFile(String(settings.stagingPath))).rejects.toMatchObject({ code: "ENOENT" });
  });
  it("does not expose or accept scoped Main user requests when intervention is disabled", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-no-user-intervention-")); roots.push(root);
    const settings = context(root, { agent: "main", kind: "main", allowUserIntervention: false,
      collaboration: { role: "scoped-main", nodeRunId: "node-G", groupRunId: "run-G", coordinatorEpoch: 7,
        memberNodeIds: [], routeCandidates: [], failedArrivalRequestIds: ["failed"], allowReconfiguration: false } });
    const results = await runMcp(settings, [
      { id: 1, method: "tools/list" },
      { id: 2, method: "tools/call", params: { name: "request_user", arguments: { callId: "ask", message: "Need input", rationale: "Blocked" } } }
    ]);
    expect((results[0]!.result as { tools: Array<{ name: string }> }).tools.map(tool => tool.name)).not.toContain("request_user");
    expectRecoverableToolError(results[1], "disabled");
    await expect(fs.readFile(String(settings.stagingPath), "utf8")).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("plans more than fifty direct Agent nodes through MCP and Harness validation while rejecting outside nodes", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-large-group-mcp-")); roots.push(root);
    const memberNodeIds = Array.from({ length: 60 }, (_, index) => `G_agent_${index}`);
    const settings = context(root, { agent: "main", kind: "main", canComplete: false, allowUserIntervention: false,
      capabilityHash: createHash("sha256").update("capability-test-secret").digest("hex"),
      collaboration: { role: "scoped-leader", nodeRunId: "node-G", groupRunId: "run-G", coordinatorEpoch: 7,
        memberNodeIds, routeCandidates: [], failedArrivalRequestIds: [], allowReconfiguration: false } });
    const tasks = memberNodeIds.map(taskId => ({ taskId, assignment: `Research assigned to ${taskId}` }));
    const call = (id: number, callId: string, entries: typeof tasks) => ({ id, method: "tools/call", params: { name: "assign_group_tasks",
      arguments: { callId, groupRunId: "run-G", coordinatorEpoch: 7, tasks: entries } } });
    const results = await runMcp(settings, [
      { id: 1, method: "tools/list" }, call(2, "outside", [{ taskId: "outside", assignment: "Not in this group" }]),
      call(3, "empty", []), call(4, "large-plan", tasks),
      { id: 5, method: "tools/call", params: { name: "finish_task", arguments: { callId: "own-finish", summary: "All direct nodes planned" } } }
    ]);
    const tools = (results[0]!.result as { tools: Array<{ name: string; inputSchema: { properties: { tasks?: { maxItems?: number } } } }> }).tools;
    expect(tools.find(tool => tool.name === "assign_group_tasks")!.inputSchema.properties.tasks!.maxItems).toBeUndefined();
    expectRecoverableToolError(results.find(result => result.id === 2));
    expectRecoverableToolError(results.find(result => result.id === 3));
    expect(results.find(result => result.id === 4)!.result).not.toMatchObject({ isError: true });
    const actions = JSON.parse(await fs.readFile(String(settings.stagingPath), "utf8")) as ControlActionEnvelope[];
    expect(actions).toHaveLength(2);
    expect(actions.find(envelope => envelope.action.tool === "assign_group_tasks")!.action).toMatchObject({ tasks });
    const request = { project: { id: settings.projectId, agents: { main: { harness: "codex" } } }, agent: "main",
      invocationId: settings.invocationId, control: { ...settings, capability: "capability-test-secret" } } as unknown as AgentRunRequest;
    const facade = new HarnessRuntimeFacade();
    const returned = { handoff: "Sixty direct nodes planned", controlActions: actions };
    expect(facade.validateResidentTurnResult(returned, request)).toEqual(returned);
    const outside = structuredClone(actions);
    const plan = outside.find(envelope => envelope.action.tool === "assign_group_tasks")!.action;
    if (plan.tool === "assign_group_tasks") plan.tasks[0]!.taskId = "outside";
    expect(() => facade.validateResidentTurnResult({ ...returned, controlActions: outside }, request)).toThrow();
  });

  it("exposes necessary closing tools and returns separate actual Git/finish results through real MCP", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "worktree-closing-mcp-")); roots.push(root);
    const worktreeClosing = { kind: "bound-report-memory", reportHeadSha: "a".repeat(40), paths: ["agent-memory/branch/Memory.md"],
      executionId: "original", ownershipEpoch: 2, grantInvocationId: "leader", grantCallId: "close" };
    const settings = context(root, { worktreeClosing, allowAgentGitActions: true, candidates: [], allowUserIntervention: false,
      requireBridge: true, capabilityHash: createHash("sha256").update("capability-test-secret").digest("hex") });
    const actions: ControlActionEnvelope[] = [];
    const service = new ControlActionService({ projectId: String(settings.projectId), agent: String(settings.agent),
      invocationId: String(settings.invocationId), stateVersion: Number(settings.stateVersion), capability: "capability-test-secret",
      capabilityHash: String(settings.capabilityHash),
      stagingPath: String(settings.stagingPath), revalidate: async envelope => { if (envelope.action.tool === "finish_task") actions.push(envelope); },
      execute: async envelope => { actions.push(envelope); return { status: "confirmed", headSha: "b".repeat(40) }; } });
    const bridge = await startControlActionBridge(service, root);
    try {
      const responses = await runMcp({ ...settings, bridgePath: bridge.endpoint.path, bridgeHost: bridge.endpoint.host, bridgePort: bridge.endpoint.port }, [
        { id: 1, method: "tools/list" },
        { id: 2, method: "tools/call", params: { name: "git_push", arguments: { callId: "necessary-B", reason: "Correct only my original authorized Memory" } } },
        { id: 3, method: "tools/call", params: { name: "git_reconcile_push", arguments: { callId: "observe-B", operationId: "my-closing-push", retry: true } } },
        { id: 4, method: "tools/call", params: { name: "finish_task", arguments: { callId: "closing-finish", summary: "My separate closing result", memory: "My supplemental memory" } } }
      ]);
      const tools = (responses[0].result as { tools: Array<{ name: string; inputSchema: Record<string, unknown> }> }).tools;
      expect(tools.map(tool => tool.name)).toEqual(["finish_task", "git_get_operation", "git_reconcile_push", "git_push", "github_create_pr", "github_get_pr", "github_merge_pr", "github_close_pr"]);
      expect(tools.find(tool => tool.name === "git_push")?.inputSchema).toMatchObject({ required: ["callId", "reason"] });
      expect(tools.find(tool => tool.name === "git_reconcile_push")?.inputSchema).toMatchObject({ properties: { historical: { const: false } } });
      for (const response of responses.slice(1)) expect(response.result).not.toMatchObject({ isError: true });
      expect(JSON.stringify(responses[1].result)).toContain("b".repeat(40));
      expect(actions.map(envelope => envelope.action.tool)).toEqual(["git_push", "git_reconcile_push", "finish_task"]);
      const request = { project: { id: settings.projectId, agents: { branch: { harness: "codex" } } }, agent: settings.agent,
        invocationId: settings.invocationId, worktreeClosing, control: { ...settings, capability: "capability-test-secret" } } as unknown as AgentRunRequest;
      expect(new HarnessRuntimeFacade().validateResidentTurnResult({ handoff: "My closing handoff", controlActions: actions }, request).controlActions).toEqual(actions);
      for (const action of [{ tool: "git_push" }, { tool: "git_push", reason: " " }, { tool: "git_prepare_conflict" },
        { tool: "git_reconcile_push", operationId: "old", historical: true }]) {
        expect(() => new HarnessRuntimeFacade().validateResidentTurnResult({ handoff: "Forged scope", controlActions: [{ ...actions[0], action }] } as never, request))
          .toThrow(/invalid orchestration control envelope/);
      }
      expect(() => new HarnessRuntimeFacade().validateResidentTurnResult({ controlActions: actions },
        { ...request, worktreeClosing: { ...request.worktreeClosing!, paths: ["new-business.txt"] } })).toThrow(/exact assigned manifest/);
    } finally { await bridge.close(); }
  });

  it("denies hidden business/management calls, historical pushes and missing closing reasons before staging", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "worktree-closing-mcp-deny-")); roots.push(root);
    const settings = context(root, { worktreeClosing: { kind: "completed-leftovers", reportHeadSha: "a".repeat(40), paths: ["leftover.txt"],
      executionId: "old", ownershipEpoch: 2, grantInvocationId: "leader", grantCallId: "close" },
      allowAgentGitActions: true, candidates: [], allowUserIntervention: false, requireBridge: true });
    const forbidden = [{ tool: "git_prepare_conflict" }, { tool: "publish_artifact", path: "new.txt" }, { tool: "route_to_agent", target: "worker" },
      { tool: "apply_workflow", path: "workflow.json" }, { tool: "complete_project" }, { tool: "complete_group" }, { tool: "request_user" },
      { tool: "git_push" }, { tool: "git_push", reason: " " }, { tool: "git_push", reason: "x".repeat(8193) },
      { tool: "git_reconcile_push", operationId: "old-business", historical: true }];
    const responses = await runMcp(settings, forbidden.map(({ tool, ...args }, index) => ({ id: index + 1, method: "tools/call",
      params: { name: tool, arguments: { callId: `forbidden-${index}`, ...args } } })));
    for (const response of responses) expectRecoverableToolError(response, "This closing turn permits only");
    await expect(fs.readFile(String(settings.stagingPath))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it.each([{ candidates: ["next"] }, { kind: "main", agent: "main" }, { canComplete: true }, { requireBridge: false },
    { terminalPushObservation: { operationId: "old-push" } }, { allowAgentGitActions: false }, { allowWorkflowReconfiguration: true },
    { worktreeClosing: { kind: "completed-leftovers", reportHeadSha: "a".repeat(40), paths: ["../outside"], executionId: "old",
      ownershipEpoch: 2, grantInvocationId: "leader", grantCallId: "close" } }
  ])("rejects contradictory closing capability %j at actual MCP startup", async override => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "worktree-closing-mcp-invalid-")); roots.push(root);
    const settings = context(root, { worktreeClosing: { kind: "completed-leftovers", reportHeadSha: "a".repeat(40), paths: ["leftover.txt"],
      executionId: "old", ownershipEpoch: 2, grantInvocationId: "leader", grantCallId: "close" },
      allowAgentGitActions: true, candidates: [], allowUserIntervention: false, requireBridge: true, ...override });
    await expect(runMcp(settings, [{ id: 1, method: "tools/list" }])).rejects.toThrow(/closing requires|receipt-only Worker control scope/);
  });
  it("retains a pinned proposal across repair invocations while staging under the fresh authority", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "retained-proposal-mcp-")); roots.push(root);
    const directory = path.join(root, ".scienceevolve", "management", "inv_original", "proposal");
    await fs.mkdir(directory, { recursive: true });
    const proposal = path.join(directory, "workflow.json");
    const content = "{\"agentOwnedProposal\":true}\n";
    await fs.writeFile(proposal, content);
    const settings = context(root, { kind: "main", agent: "main", invocationId: "inv_repair",
      allowWorkflowReconfiguration: true, workflowAuthoringPath: proposal });
    const responses = await runMcp(settings, [
      { id: 1, method: "tools/call", params: { name: "apply_workflow", arguments: {
        callId: "retained-proposal", path: "workflow.json", rationale: "Apply my existing proposal after the retained-session repair" } } }
    ]);
    expect(responses[0]?.error).toBeUndefined();
    expect(responses[0]?.result).not.toHaveProperty("isError", true);
    expect(JSON.parse(await fs.readFile(settings.stagingPath as string, "utf8"))).toMatchObject([
      { invocationId: "inv_repair", action: { tool: "apply_workflow", path: "workflow.json" } }
    ]);
    expect(await fs.readFile(proposal, "utf8")).toBe(content);
  });

  it.for(["outside", "symlink", "hardlink"] as const)("rejects a %s proposal before staging on a repair invocation", async (mode, testContext) => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "pinned-proposal-rejection-")); roots.push(root);
    const directory = path.join(root, ".scienceevolve", "management", "inv_original", "proposal");
    await fs.mkdir(directory, { recursive: true });
    const source = path.join(root, "outside.json"); await fs.writeFile(source, "{}");
    const proposal = path.join(directory, "workflow.json");
    if (mode === "symlink") {
      try { await fs.symlink(source, proposal); } catch (error) {
        if (process.platform === "win32" && (error as NodeJS.ErrnoException).code === "EPERM") { testContext.skip(); return; }
        throw error;
      }
    }
    if (mode === "hardlink") await fs.link(source, proposal);
    const settings = context(root, { kind: "main", agent: "main", invocationId: "inv_repair",
      allowWorkflowReconfiguration: true, workflowAuthoringPath: mode === "outside" ? source : proposal });
    const responses = await runMcp(settings, [
      { id: 1, method: "tools/call", params: { name: "apply_workflow", arguments: {
        callId: "invalid-proposal", path: "workflow.json", rationale: "Attempt the untrusted path" } } }
    ]);
    expectRecoverableToolError(responses[0], "invocation authoring authority");
    await expect(fs.access(settings.stagingPath as string)).rejects.toThrow();
  });
  it("rejects internal memory and carries an explicit Git publication correction through real MCP", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "publication-correction-mcp-")); roots.push(root);
    await fs.mkdir(path.join(root, "agent-memory", "branch"), { recursive: true });
    await fs.writeFile(path.join(root, "agent-memory", "branch", "Memory.md"), "Private task memory");
    await fs.writeFile(path.join(root, "Memory.md"), "Project memory");
    await fs.writeFile(path.join(root, "VERIFICATION.md"), "Formal verification report");
    const publish = { path: "VERIFICATION.md", title: "Verification", kind: "report", description: "Chosen report" };
    const responses = await runMcp(context(root, { allowAgentGitActions: true, candidates: [] }), [
      { id: 1, method: "tools/list" },
      { id: 2, method: "tools/call", params: { name: "publish_artifact", arguments: { callId: "memory", ...publish, path: "agent-memory/branch/Memory.md" } } },
      { id: 3, method: "tools/call", params: { name: "publish_artifact", arguments: { callId: "root-memory", ...publish, path: "Memory.md" } } },
      { id: 4, method: "tools/call", params: { name: "publish_artifact", arguments: { callId: "report", ...publish } } },
      { id: 5, method: "tools/call", params: { name: "publish_artifact", arguments: { callId: "correct", ...publish, replacesPath: "agent-memory/branch/Memory.md" } } },
      { id: 6, method: "tools/call", params: { name: "publish_artifact", arguments: { callId: "correct", ...publish, replacesPath: "agent-memory/branch/Memory.md" } } }
    ]);
    const byId = new Map(responses.map((response) => [response.id, response]));
    expectRecoverableToolError(byId.get(2), "Internal Agent memory");
    expectRecoverableToolError(byId.get(3), "Internal Agent memory");
    const tools = (byId.get(1)!.result as { tools: Array<{ name: string; inputSchema: { properties: Record<string, unknown> } }> }).tools;
    expect(tools.find((tool) => tool.name === "publish_artifact")!.inputSchema.properties.replacesPath).toBeDefined();
    const actions = JSON.parse(await fs.readFile(path.join(root, "actions.json"), "utf8")) as ControlActionEnvelope[];
    expect(actions.map((envelope) => envelope.callId)).toEqual(["report", "correct"]);
    expect(actions[1].action).toMatchObject({ replacesPath: "agent-memory/branch/Memory.md" });
    for (const overrides of [{}, { allowAgentGitActions: true, scopedAgentRouting: true }]) {
      const rejected = await runMcp(context(root, { ...overrides, stagingPath: path.join(root, "unavailable.json") }), [
        { id: 7, method: "tools/call", params: { name: "publish_artifact", arguments: { callId: "unavailable", ...publish, replacesPath: "old.md" } } }
      ]);
      expectRecoverableToolError(rejected[0], "only available");
    }
  });

  it.each(["confirmed", "missing", "moved", "error"] as const)("terminal push receipt returns the original Agent's actual %s result and separate finish receipt through real MCP", async (mode) => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "terminal-push-receipt-mcp-")); roots.push(root);
    const observation = { operationId: "completed-task-original-push" };
    const secret = "capability-test-secret";
    const settings = context(root, { terminalPushObservation: observation, allowAgentGitActions: true,
      candidates: [], allowUserIntervention: false, requireBridge: true, capabilityHash: createHash("sha256").update(secret).digest("hex") });
    const actions: ControlActionEnvelope[] = [];
    const outcome = { status: mode === "confirmed" ? "confirmed" : "unconfirmed",
      operation: { id: observation.operationId, status: mode === "confirmed" ? "finalized" : "uncertain" },
      remote: { status: mode === "confirmed" ? "present" : mode, headSha: "a".repeat(40) } };
    const service = new ControlActionService({ projectId: settings.projectId as string, agent: settings.agent as string,
      invocationId: settings.invocationId as string, stateVersion: settings.stateVersion as number, capability: secret,
      capabilityHash: settings.capabilityHash as string, stagingPath: settings.stagingPath as string,
      revalidate: async (envelope) => { if (envelope.action.tool === "finish_task") actions.push(envelope); }, execute: async (envelope) => {
        actions.push(envelope);
        expect(envelope.action).toEqual({ tool: "git_reconcile_push", operationId: observation.operationId, historical: true });
        if (mode === "error") throw new Error("Actual provider could not observe this ref");
        return outcome;
      } });
    const bridge = await startControlActionBridge(service, root);
    try {
      const responses = await runMcp({ ...settings, bridgePath: bridge.endpoint.path, bridgeHost: bridge.endpoint.host, bridgePort: bridge.endpoint.port }, [
        { id: 1, method: "tools/list" },
        { id: 2, method: "tools/call", params: { name: "git_reconcile_push", arguments: { callId: "observe", operationId: observation.operationId, historical: true } } },
        { id: 3, method: "tools/call", params: { name: "finish_task", arguments: { callId: "receipt-finish", summary: `Observed ${mode}`, memory: `My retained observation was ${mode}` } } }
      ]);
      const tools = (responses[0].result as { tools: Array<{ name: string; inputSchema: Record<string, unknown> }> }).tools;
      expect(tools.map((tool) => tool.name)).toEqual(["finish_task", "git_reconcile_push"]);
      expect(tools[0]).toMatchObject({ annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false } });
      expect(tools[1].inputSchema).toMatchObject({ required: ["callId", "operationId", "historical"], properties: {
        operationId: { enum: [observation.operationId] }, historical: { const: true }, retry: { const: false } } });
      if (mode === "error") expectRecoverableToolError(responses[1], "Actual provider could not observe this ref");
      else expect(JSON.stringify(responses[1].result)).toContain(JSON.stringify(outcome).replaceAll('"', '\\"'));
      expect(responses[2].result).not.toMatchObject({ isError: true });
      expect(actions.map((envelope) => envelope.action.tool)).toEqual(["git_reconcile_push", "finish_task"]);
      expect(actions[1].action).toMatchObject({ memory: `My retained observation was ${mode}` });
      // A returned native result is subject to the same scope, including errors.
      const request = { project: { id: settings.projectId, agents: { branch: { harness: "codex" } } }, agent: settings.agent,
        invocationId: settings.invocationId, control: { ...settings, capability: secret } } as unknown as AgentRunRequest;
      const accepted = mode === "error" ? [actions[1]] : actions;
      expect(new HarnessRuntimeFacade().validateResidentTurnResult({ handoff: `Observed ${mode}`, controlActions: accepted }, request).controlActions).toEqual(accepted);
      for (const action of [{ tool: "git_push" }, { tool: "publish_artifact", path: "x", title: "x", kind: "code", description: "x" },
        { tool: "git_reconcile_push", operationId: "other-operation", historical: true },
        { tool: "git_reconcile_push", operationId: observation.operationId, historical: true, retry: true }]) {
        const forged = { ...actions[0], action };
        expect(() => new HarnessRuntimeFacade().validateResidentTurnResult({ handoff: "forged", controlActions: [forged] }, request))
          .toThrow(/invalid orchestration control envelope/);
      }
    } finally { await bridge.close(); }
  });

  it("terminal push receipt rejects all business/management tools and wrong historical requests before contacting a provider or staging", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "terminal-push-receipt-deny-")); roots.push(root);
    const settings = context(root, { terminalPushObservation: { operationId: "original-push" }, allowAgentGitActions: true,
      candidates: [], allowUserIntervention: false, requireBridge: true });
    const forbidden = ["git_push", "github_create_pr", "github_get_pr", "github_merge_pr", "github_close_pr", "git_prepare_conflict",
      "route_to_agent", "publish_artifact", "select_display", "request_user", "apply_workflow", "coordinate_group_task",
      "assign_group_tasks", "claim_group_task", "request_group_integration", "complete_group", "complete_project"];
    const attempts = [
      ...forbidden.map((name) => ({ name, arguments: { callId: name } })),
      ...[{ operationId: "other-push", historical: true }, { operationId: "original-push" },
        { operationId: "original-push", historical: false }, { operationId: "original-push", historical: true, retry: true },
        { operationId: "original-push", historical: true, retry: "false" }]
        .map((args, index) => ({ name: "git_reconcile_push", arguments: { callId: `invalid-${index}`, ...args } }))
    ];
    const responses = await runMcp(settings, attempts.map((params, index) => ({ id: index, method: "tools/call", params })));
    expect(responses).toHaveLength(attempts.length);
    for (const response of responses) expectRecoverableToolError(response, "receipt turn permits only");
    await expect(fs.access(String(settings.stagingPath))).rejects.toThrow();
  });

  it.each([
    { terminalPushObservation: { operationId: "" } }, { terminalPushObservation: { operationId: "original-push", extra: true } },
    { kind: "main" }, { candidates: ["next"] }, { allowUserIntervention: true }, { canComplete: true },
    { allowAgentGitActions: false }, { requireBridge: false }, { canonicalFinalIntegration: true },
    { allowWorkflowReconfiguration: true }, { scopedAgentRouting: true }, { allowFinishRoute: true },
    { workflowAuthoringPath: "/proposal/workflow.json" }
  ])("terminal push receipt rejects contradictory or malformed capability %j at actual MCP startup", async (override) => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "terminal-push-receipt-context-")); roots.push(root);
    const settings = context(root, { terminalPushObservation: { operationId: "original-push" }, allowAgentGitActions: true,
      candidates: [], allowUserIntervention: false, requireBridge: true, ...override });
    await expect(runMcp(settings, [{ id: 1, method: "tools/list" }])).rejects.toThrow(/receipt-only Worker control scope/);
    await expect(fs.access(String(settings.stagingPath))).rejects.toThrow();
  });

  it.each(["scoped-leader", "scoped-main"] as const)
    ("stages independent failed-arrival decisions for %s through the actual standalone MCP", async (role) => {
      const root = await fs.mkdtemp(path.join(os.tmpdir(), "scoped-independent-mcp-")); roots.push(root);
      const runContext = context(root, { agent: "main", kind: "main", capabilityHash: createHash("sha256").update("capability-test-secret").digest("hex"),
        collaboration: { role, nodeRunId: "node-G", groupRunId: "run-G", coordinatorEpoch: 7,
          memberNodeIds: ["business"], routeCandidates: [], failedArrivalRequestIds: ["failed-a", "failed-b"], allowReconfiguration: false } });
      const call = (id: number, callId: string, arrivalRequestId: string, operation = "retry") => ({ id, method: "tools/call",
        params: { name: "coordinate_group_task", arguments: { callId, groupRunId: "run-G", coordinatorEpoch: 7,
          arrivalRequestId, operation, rationale: `Original Agent repairs ${arrivalRequestId}` } } });
      const results = await runMcp(runContext, [call(1, "a", "failed-a"), call(2, "b", "failed-b"), call(3, "repeat-a", "failed-a"),
        call(4, "conflict-b", "failed-b", role === "scoped-main" ? "skip" : "escalate"), call(5, "outside", "outside"),
        { id: 6, method: "tools/call", params: { name: "finish_task", arguments: { callId: "own-finish", summary: "Both independent choices are retained" } } }]);
      for (const result of results.filter((entry) => [1, 2, 3, 6].includes(Number(entry.id)))) expect(result.result).not.toMatchObject({ isError: true });
      expectRecoverableToolError(results.find((entry) => entry.id === 4), "decision is already locked");
      expectRecoverableToolError(results.find((entry) => entry.id === 5));
      const actions = JSON.parse(await fs.readFile(String(runContext.stagingPath), "utf8")) as ControlActionEnvelope[];
      expect(actions.map((entry) => entry.callId)).toEqual(["own-finish", "a", "b"]);
      const returned = { handoff: "Original manager owns both choices", controlActions: actions };
      expect(new HarnessRuntimeFacade().validateResidentTurnResult(returned, { project: { id: runContext.projectId,
        agents: { main: { harness: "codex" } } }, agent: "main", invocationId: runContext.invocationId,
        control: { ...runContext, capability: "capability-test-secret" } } as unknown as AgentRunRequest)).toEqual(returned);
    });

  it.each(["scoped-leader", "scoped-main"] as const)
    ("stages independent failed-arrival decisions for %s through the actual MCP bridge", async (role) => {
      const root = await fs.mkdtemp(path.join(os.tmpdir(), "scoped-independent-bridge-mcp-")); roots.push(root);
      const secret = "capability-test-secret";
      const hash = createHash("sha256").update(secret).digest("hex");
      const runContext = context(root, { agent: "main", kind: "main", capabilityHash: hash, requireBridge: true,
        collaboration: { role, nodeRunId: "node-G", groupRunId: "run-G", coordinatorEpoch: 7, memberNodeIds: ["business"],
          routeCandidates: [], failedArrivalRequestIds: ["failed-a", "failed-b"], allowReconfiguration: false } });
      const liveAccepted: ControlActionEnvelope[] = [];
      const service = new ControlActionService({ projectId: String(runContext.projectId), agent: "main", invocationId: String(runContext.invocationId),
        stateVersion: 4, capability: secret, capabilityHash: hash, stagingPath: String(runContext.stagingPath),
        revalidate: async (envelope) => { liveAccepted.push(envelope); } });
      const bridge = await startControlActionBridge(service, root);
      try {
        const choice = (id: number, arrivalRequestId: string) => ({ id, method: "tools/call", params: { name: "coordinate_group_task",
          arguments: { callId: `choice-${id}`, groupRunId: "run-G", coordinatorEpoch: 7, arrivalRequestId, operation: "retry", rationale: `Repair ${arrivalRequestId}` } } });
        const results = await runMcp({ ...runContext, bridgePath: bridge.endpoint.path, bridgeHost: bridge.endpoint.host, bridgePort: bridge.endpoint.port },
          [choice(1, "failed-a"), choice(2, "failed-b"), { id: 3, method: "tools/call", params: { name: "finish_task",
            arguments: { callId: "own-finish", memory: "Original Agent controls the repairs" } } }]);
        for (const result of results) expect(result.result).not.toMatchObject({ isError: true });
        const actions = JSON.parse(await fs.readFile(String(runContext.stagingPath), "utf8")) as ControlActionEnvelope[];
        expect(actions).toEqual(liveAccepted);
        expect(actions.map((entry) => entry.callId)).toEqual(["choice-1", "choice-2", "own-finish"]);
        const returned = { handoff: "Two independent repair choices", controlActions: actions };
        expect(new HarnessRuntimeFacade().validateResidentTurnResult(returned, { project: { id: runContext.projectId,
          agents: { main: { harness: "codex" } } }, agent: "main", invocationId: runContext.invocationId,
          control: { ...runContext, capability: secret } } as unknown as AgentRunRequest)).toEqual(returned);
      } finally { await bridge.close(); }
    });

  it.each(["scoped-leader", "scoped-main"] as const)
    ("returns an actual %s MCP finish and repair choice that the shared Harness result validator accepts", async (role) => {
      const root = await fs.mkdtemp(path.join(os.tmpdir(), "scoped-mcp-result-contract-")); roots.push(root);
      const secret = "capability-test-secret";
      const hash = createHash("sha256").update(secret).digest("hex");
      const runContext = context(root, { agent: "main", kind: "main", capabilityHash: hash,
        allowUserIntervention: role === "scoped-main", requireBridge: true,
        collaboration: { role, nodeRunId: "node-G", groupRunId: "run-G", coordinatorEpoch: 7,
          memberNodeIds: role === "scoped-main" ? [] : ["business"], routeCandidates: [],
          failedArrivalRequestIds: ["failed"], allowReconfiguration: false } });
      const liveAccepted: ControlActionEnvelope[] = [];
      const service = new ControlActionService({ projectId: String(runContext.projectId), agent: "main",
        invocationId: String(runContext.invocationId), stateVersion: 4, capability: secret, capabilityHash: hash,
        stagingPath: String(runContext.stagingPath), revalidate: async (envelope) => { liveAccepted.push(envelope); } });
      const bridge = await startControlActionBridge(service, root);
      try {
        const result = await runMcp({ ...runContext, bridgePath: bridge.endpoint.path, bridgeHost: bridge.endpoint.host, bridgePort: bridge.endpoint.port }, [
          { id: 1, method: "tools/list" },
          { id: 2, method: "tools/call", params: { name: "coordinate_group_task", arguments: {
            callId: "repair", groupRunId: "run-G", coordinatorEpoch: 7, arrivalRequestId: "failed", operation: "retry",
            repairNodeId: "business", rationale: "Original group's business Agent must resolve its final PR conflict" } } },
          { id: 3, method: "tools/call", params: { name: "finish_task", arguments: {
            callId: "own-finish", summary: "My management task is complete", memory: "My explicit repair choice remains retained" } } }
        ]);
        expect(JSON.stringify(result.slice(1))).not.toContain('"isError":true');
        const tools = (result[0]!.result as { tools: Array<{ name: string; inputSchema: { properties: Record<string, unknown> } }> }).tools;
        expect(tools.find((tool) => tool.name === "coordinate_group_task")?.inputSchema.properties.repairNodeId)
          .toMatchObject({ minLength: 1, maxLength: 256 });
        const actions = JSON.parse(await fs.readFile(String(runContext.stagingPath), "utf8")) as ControlActionEnvelope[];
        expect(actions).toEqual(liveAccepted);
        expect(actions.map((envelope) => envelope.action.tool)).toEqual(["coordinate_group_task", "finish_task"]);
        const request = { project: { id: runContext.projectId, agents: { main: { harness: "codex" } } }, agent: "main", kind: "main",
          invocationId: runContext.invocationId, control: { ...runContext, capability: secret } } as unknown as AgentRunRequest;
        const returned = { handoff: "Original management handoff", controlActions: actions };
        expect(new HarnessRuntimeFacade().validateResidentTurnResult(returned, request)).toEqual(returned);
      } finally { await bridge.close(); }
    });

  it("treats empty optional repair placeholders as omission without changing a retained decision", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scoped-mcp-empty-repair-")); roots.push(root);
    const runContext = context(root, { collaboration: { role: "scoped-leader", nodeRunId: "node-G", groupRunId: "run-G", coordinatorEpoch: 7,
      memberNodeIds: ["business"], routeCandidates: [], failedArrivalRequestIds: ["failed"], allowReconfiguration: false } });
    const args = { callId: "retry", groupRunId: "run-G", coordinatorEpoch: 7, arrivalRequestId: "failed",
      operation: "retry", rationale: "Retained original Agent should continue; this is not a final PR conflict" };
    const result = await runMcp(runContext, [
      { id: 1, method: "tools/call", params: { name: "coordinate_group_task", arguments: { ...args, repairNodeId: "" } } },
      { id: 2, method: "tools/call", params: { name: "coordinate_group_task", arguments: args } },
      { id: 3, method: "tools/call", params: { name: "coordinate_group_task", arguments: { ...args, repairNodeId: null } } }
    ]);
    for (const entry of result) expect(entry.result).not.toMatchObject({ isError: true });
    const actions = JSON.parse(await fs.readFile(String(runContext.stagingPath), "utf8")) as ControlActionEnvelope[];
    expect(actions).toHaveLength(1);
    expect(actions[0]!.callId).toBe("retry");
    expect(actions[0]!.action).toEqual({ tool: "coordinate_group_task", groupRunId: "run-G", coordinatorEpoch: 7,
      arrivalRequestId: "failed", operation: "retry", rationale: args.rationale });
  });

  it("advertises exact per-failure recovery choices and rejects unavailable actions with actionable facts", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scoped-mcp-recovery-options-")); roots.push(root);
    const runContext = context(root, { agent: "main", kind: "main", collaboration: {
      role: "scoped-main", nodeRunId: "node-G", groupRunId: "run-G", coordinatorEpoch: 7, memberNodeIds: [], routeCandidates: [],
      failedArrivalRequestIds: ["incident", "unsettled", "worker"], allowReconfiguration: false,
      recoveryOptions: [
        { arrivalRequestId: "incident", allowedOperations: ["retry"], blockedOperations: { skip: "A final-PR incident cannot be fabricated as successful" }, repairNodeIds: ["repair-node"] },
        { arrivalRequestId: "unsettled", allowedOperations: ["retry"], blockedOperations: { skip: "Retry its original Worker to reconcile unsettled Git operations" }, repairNodeIds: [] },
        { arrivalRequestId: "worker", allowedOperations: ["retry", "skip"], blockedOperations: {}, repairNodeIds: [] }
      ] } });
    const call = (id: number, arrivalRequestId: string, operation: string, extra: Record<string, unknown> = {}) => ({ id, method: "tools/call",
      params: { name: "coordinate_group_task", arguments: { callId: `decision-${arrivalRequestId}`, groupRunId: "run-G", coordinatorEpoch: 7,
        arrivalRequestId, operation, rationale: "Use the retained original task and actual Git state", ...extra } } });
    const results = await runMcp(runContext, [{ id: 0, method: "tools/list" }, call(1, "incident", "skip"), call(2, "unsettled", "skip"),
      call(3, "incident", "retry", { repairNodeId: "repair-node" }), call(4, "unsettled", "retry", { repairNodeId: "invented-node" }),
      call(5, "unsettled", "retry", { repairNodeId: "" }), call(6, "worker", "skip"), call(7, "not-an-arrival", "retry")]);
    const tool = (results[0].result as any).tools.find((item: any) => item.name === "coordinate_group_task");
    expect(tool.description).toContain('"allowedOperations":["retry"]');
    expect(tool.description).toContain("unsettled Git operations");
    expect(tool.inputSchema.properties.operation.enum).toEqual(["retry", "skip"]);
    for (const index of [1, 2]) expect((results[index].result as any).structuredContent.error).toMatchObject({ invalidField: "operation",
      stateDetails: { allowedOperations: ["retry"] } });
    expect((results[4].result as any).structuredContent.error).toMatchObject({ invalidField: "repairNodeId", stateDetails: { repairNodeIds: [] } });
    expect((results[7].result as any).structuredContent.error).toMatchObject({ invalidField: "arrivalRequestId" });
    const actions = JSON.parse(await fs.readFile(String(runContext.stagingPath), "utf8")) as ControlActionEnvelope[];
    expect(actions.map(entry => [entry.callId, (entry.action as any).operation])).toEqual([
      ["decision-incident", "retry"], ["decision-unsettled", "retry"], ["decision-worker", "skip"]
    ]);
  });

  it("omits impossible skip and repair parameters when the current failure has no such choices", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scoped-mcp-no-skip-")); roots.push(root);
    const replies = await runMcp(context(root, { agent: "main", kind: "main", collaboration: {
      role: "scoped-main", nodeRunId: "node-G", groupRunId: "run-G", coordinatorEpoch: 7, memberNodeIds: [], routeCandidates: [],
      failedArrivalRequestIds: ["incident"], allowReconfiguration: false,
      recoveryOptions: [{ arrivalRequestId: "incident", allowedOperations: ["retry"], blockedOperations: { skip: "Group management incident requires retry" }, repairNodeIds: [] }]
    } }), [{ id: 0, method: "tools/list" }]);
    const tool = (replies[0].result as any).tools.find((item: any) => item.name === "coordinate_group_task");
    expect(tool.inputSchema.properties.operation.enum).toEqual(["retry"]);
    expect(tool.inputSchema.properties.repairNodeId).toBeUndefined();
  });

  it("lets the live bridge recheck changed prerequisites instead of treating old recovery hints as authority", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scoped-mcp-live-recovery-")); roots.push(root);
    const runContext = context(root, { agent: "main", kind: "main", requireBridge: true, collaboration: {
      role: "scoped-main", nodeRunId: "node-G", groupRunId: "run-G", coordinatorEpoch: 7, memberNodeIds: [], routeCandidates: [],
      failedArrivalRequestIds: ["settled-now", "blocked-now"], allowReconfiguration: false,
      recoveryOptions: [
        { arrivalRequestId: "settled-now", allowedOperations: ["retry"], blockedOperations: { skip: "Git was unsettled at turn start" }, repairNodeIds: [] },
        { arrivalRequestId: "blocked-now", allowedOperations: ["retry", "skip"], blockedOperations: {}, repairNodeIds: [] }
      ] } });
    const accepted: ControlActionEnvelope[] = [];
    const service = new ControlActionService({ projectId: String(runContext.projectId), agent: "main", invocationId: String(runContext.invocationId),
      stateVersion: 4, capability: "capability-test-secret", stagingPath: String(runContext.stagingPath), revalidate: async envelope => {
        if (envelope.action.tool === "coordinate_group_task" && envelope.action.arrivalRequestId === "blocked-now")
          throw new CollaborationStateError("INVALID_STATE_TRANSITION", "Current Git outcome needs its original Worker to reconcile", {
            invalidField: "operation", allowedOperations: ["retry"]
          });
        accepted.push(envelope);
      } });
    const bridge = await startControlActionBridge(service, root);
    const call = (id: number, arrivalRequestId: string) => ({ id, method: "tools/call", params: { name: "coordinate_group_task",
      arguments: { callId: `skip-${arrivalRequestId}`, groupRunId: "run-G", coordinatorEpoch: 7, arrivalRequestId, operation: "skip", rationale: "Check current exact stop and Git facts" } } });
    try {
      const replies = await runMcp({ ...runContext, bridgePath: bridge.endpoint.path, bridgeHost: bridge.endpoint.host, bridgePort: bridge.endpoint.port },
        [call(1, "settled-now"), call(2, "blocked-now")]);
      expect(replies[0].result).not.toMatchObject({ isError: true });
      expect((replies[1].result as any).structuredContent.error).toMatchObject({ code: "INVALID_STATE_TRANSITION", invalidField: "operation",
        stateDetails: { allowedOperations: ["retry"] } });
      expect(accepted).toHaveLength(1);
      expect(accepted[0].action).toMatchObject({ arrivalRequestId: "settled-now", operation: "skip" });
      const returned = { handoff: "Retained decision is backed by fresh live validation", controlActions: accepted };
      expect(new HarnessRuntimeFacade().validateResidentTurnResult(returned, { project: { id: runContext.projectId,
        agents: { main: { harness: "codex" } } }, agent: "main", invocationId: runContext.invocationId,
        control: { ...runContext, capability: "capability-test-secret" } } as unknown as AgentRunRequest)).toEqual(returned);
    } finally { await bridge.close(); }
  });

  it("exposes skip only on a global scoped Main capability, using the actual MCP subprocess parser", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scoped-global-main-mcp-")); roots.push(root);
    const result = await runMcp(context(root, { agent: "main", kind: "main", canComplete: false, allowUserIntervention: true,
      collaboration: { role: "scoped-main", nodeRunId: "node-G", groupRunId: "run-G", coordinatorEpoch: 7,
        memberNodeIds: [], routeCandidates: [], failedArrivalRequestIds: ["failed"], allowReconfiguration: false } }), [
      { id: 1, method: "tools/list" }, { id: 2, method: "tools/call", params: { name: "coordinate_group_task", arguments: {
        callId: "skip", groupRunId: "run-G", coordinatorEpoch: 7, arrivalRequestId: "failed", operation: "skip", rationale: "Main explicitly approves this skip" } } }
    ]);
    expect((result[0].result as { tools: Array<{ name: string }> }).tools.map((tool) => tool.name)).toEqual(["finish_task", "coordinate_group_task", "request_user"]);
    for (const tool of (result[0].result as { tools: Array<{ annotations: unknown }> }).tools) {
      expect(tool.annotations).toEqual({ readOnlyHint: false, destructiveHint: false, openWorldHint: false });
    }
    expect(JSON.parse(await fs.readFile(path.join(root, "actions.json"), "utf8"))).toMatchObject([{ action: { operation: "skip" } }]);
  });
  it("offers scoped Worker Finish routing and scoped Leader tools without granting project control", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scoped-control-mcp-")); roots.push(root);
    const worker = await runMcp(context(root, { candidates: ["finish"], scopedAgentRouting: true, allowFinishRoute: true }), [
      { id: 1, method: "tools/list" }, { id: 2, method: "tools/call", params: { name: "route_to_agent", arguments: {
        callId: "finish", target: "finish", rationale: "This group path is complete" } } },
      { id: 3, method: "tools/call", params: { name: "complete_project", arguments: { callId: "global", rationale: "forged" } } }
    ]);
    expect((worker[0]!.result as { tools: Array<{ name: string }> }).tools.map((tool) => tool.name)).toContain("route_to_agent");
    expectRecoverableToolError(worker.find((item) => item.id === 3));
    expect(JSON.parse(await fs.readFile(path.join(root, "actions.json"), "utf8"))).toMatchObject([{ action: { tool: "route_to_agent", target: "finish" } }]);
    const leaderRoot = await fs.mkdtemp(path.join(os.tmpdir(), "scoped-leader-mcp-")); roots.push(leaderRoot);
    const scope = { role: "scoped-leader", nodeRunId: "node-G", groupRunId: "run-G", coordinatorEpoch: 7,
      memberNodeIds: ["G_one"], routeCandidates: ["finish"], sourceArrivalRequestId: "arrival", failedArrivalRequestIds: ["failed"], allowReconfiguration: true };
    const leader = await runMcp(context(leaderRoot, { collaboration: scope, canComplete: true, allowUserIntervention: true }), [
      { id: 1, method: "tools/list" }, { id: 2, method: "tools/call", params: { name: "coordinate_group_task", arguments: {
        callId: "skip", groupRunId: "run-G", coordinatorEpoch: 7, arrivalRequestId: "failed", operation: "skip", rationale: "forged" } } },
      { id: 3, method: "tools/call", params: { name: "coordinate_group_task", arguments: {
        callId: "retry", groupRunId: "run-G", coordinatorEpoch: 7, arrivalRequestId: "failed", operation: "retry", rationale: "Stop proven" } } }
    ]);
    expect((leader[0]!.result as { tools: Array<{ name: string }> }).tools.map((tool) => tool.name))
      .toEqual(["finish_task", "assign_group_tasks", "route_to_agent", "apply_workflow", "coordinate_group_task", "request_group_integration", "complete_group"]);
    expectRecoverableToolError(leader.find((item) => item.id === 2));
    expect(JSON.parse(await fs.readFile(path.join(leaderRoot, "actions.json"), "utf8")))
      .toMatchObject([{ action: { tool: "coordinate_group_task", operation: "retry" } }]);
  });
  it("stages explicit closing only for identified direct-group arrivals without granting Worker Git authority", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scoped-closing-mcp-")); roots.push(root);
    const settings = context(root, { kind: "main", agent: "main", candidates: [], allowUserIntervention: false,
      capabilityHash: createHash("sha256").update("capability-test-secret").digest("hex"),
      collaboration: { role: "scoped-leader", nodeRunId: "node-G", groupRunId: "run-G", coordinatorEpoch: 7,
        memberNodeIds: ["business"], routeCandidates: [], failedArrivalRequestIds: ["closing", "ordinary"],
        closingArrivalRequestIds: ["closing"], allowReconfiguration: false } });
    const action = { groupRunId: "run-G", coordinatorEpoch: 7, arrivalRequestId: "closing", operation: "close_worktree",
      rationale: "The original stopped Agent must inspect only these retained files", closing: { executionId: "old-owner", ownershipEpoch: 2,
        paths: ["compute/probe.js", "workspace/probe with spaces.js"] } };
    const result = await runMcp(settings, [{ id: 1, method: "tools/list" },
      { id: 2, method: "tools/call", params: { name: "coordinate_group_task", arguments: { callId: "wrong-arrival", ...action, arrivalRequestId: "ordinary" } } },
      { id: 3, method: "tools/call", params: { name: "coordinate_group_task", arguments: { callId: "retry-cannot-grant", ...action, operation: "retry" } } },
      { id: 4, method: "tools/call", params: { name: "coordinate_group_task", arguments: { callId: "close", ...action } } },
      { id: 5, method: "tools/call", params: { name: "coordinate_group_task", arguments: { callId: "repeat", ...action } } },
      { id: 6, method: "tools/call", params: { name: "git_push", arguments: { callId: "no-business" } } }]);
    const tools = (result[0]!.result as { tools: Array<{ name: string; inputSchema: { properties: { operation?: { enum: string[] } } } }> }).tools;
    expect(tools.find(tool => tool.name === "coordinate_group_task")?.inputSchema.properties.operation?.enum).toContain("close_worktree");
    expect(tools.some(tool => tool.name === "git_push")).toBe(false);
    expectRecoverableToolError(result[1]); expectRecoverableToolError(result[2], "cannot carry closing"); expectRecoverableToolError(result[5]);
    expect(result[3]!.result).not.toMatchObject({ isError: true }); expect(result[4]!.result).not.toMatchObject({ isError: true });
    const actions = JSON.parse(await fs.readFile(String(settings.stagingPath), "utf8")) as ControlActionEnvelope[];
    expect(actions).toHaveLength(1); expect(actions[0]!.action).toMatchObject(action);
    const request = { project: { id: settings.projectId, agents: { main: { harness: "codex" } } }, agent: "main",
      invocationId: settings.invocationId, control: { ...settings, capability: "capability-test-secret" } } as unknown as AgentRunRequest;
    expect(new HarnessRuntimeFacade().validateResidentTurnResult({ handoff: "Original Agent closing authorized", controlActions: actions }, request)).toBeTruthy();
    const ordinary = structuredClone(request);
    if (ordinary.control?.collaboration && "closingArrivalRequestIds" in ordinary.control.collaboration) delete ordinary.control.collaboration.closingArrivalRequestIds;
    expect(() => new HarnessRuntimeFacade().validateResidentTurnResult({ handoff: "Forged closing", controlActions: actions }, ordinary)).toThrow();
  });

  it("exposes only closing coordination and own finish for a completed group's retained Leader", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "completed-group-closing-mcp-")); roots.push(root);
    const settings = context(root, { kind: "main", agent: "main", candidates: [], allowUserIntervention: false,
      capabilityHash: createHash("sha256").update("capability-test-secret").digest("hex"),
      collaboration: { role: "scoped-leader", nodeRunId: "node-G", groupRunId: "run-G", coordinatorEpoch: 7,
        memberNodeIds: [], routeCandidates: [], failedArrivalRequestIds: ["closing"], closingArrivalRequestIds: ["closing"],
        worktreeClosingOnly: true, allowReconfiguration: false } });
    const coordination = { groupRunId: "run-G", coordinatorEpoch: 7, arrivalRequestId: "closing", rationale: "Exact retained original owner" };
    const result = await runMcp(settings, [{ id: 1, method: "tools/list" },
      { id: 2, method: "tools/call", params: { name: "coordinate_group_task", arguments: { callId: "retry", ...coordination, operation: "retry" } } },
      { id: 3, method: "tools/call", params: { name: "complete_group", arguments: { callId: "complete", groupRunId: "run-G", coordinatorEpoch: 7, output: "Repeat completed group" } } },
      { id: 4, method: "tools/call", params: { name: "assign_group_tasks", arguments: { callId: "assign", groupRunId: "run-G", coordinatorEpoch: 7, tasks: [{ taskId: "business", assignment: "Repeat business" }] } } },
      { id: 5, method: "tools/call", params: { name: "coordinate_group_task", arguments: { callId: "close", ...coordination, operation: "close_worktree",
        closing: { executionId: "original", ownershipEpoch: 1, paths: ["agent-memory/worker/Memory.md"] } } } },
      { id: 6, method: "tools/call", params: { name: "finish_task", arguments: { callId: "finish", summary: "Only my closing coordination" } } }]);
    const tools = (result[0]!.result as { tools: Array<{ name: string; inputSchema: { properties: Record<string, { enum?: string[] }> } }> }).tools;
    expect(tools.map(tool => tool.name)).toEqual(["finish_task", "coordinate_group_task"]);
    expect(tools[1]!.inputSchema.properties.operation!.enum).toEqual(["escalate", "close_worktree"]);
    expect(tools[1]!.inputSchema.properties.repairNodeId).toBeUndefined();
    for (const index of [1, 2, 3]) expectRecoverableToolError(result[index]);
    for (const index of [4, 5]) expect(result[index]!.result).not.toMatchObject({ isError: true });
    const actions = JSON.parse(await fs.readFile(String(settings.stagingPath), "utf8")) as ControlActionEnvelope[];
    const request = { project: { id: settings.projectId, agents: { main: { harness: "codex" } } }, agent: "main",
      invocationId: settings.invocationId, control: { ...settings, capability: "capability-test-secret" } } as unknown as AgentRunRequest;
    expect(new HarnessRuntimeFacade().validateResidentTurnResult({ handoff: "Original closing coordination", controlActions: actions }, request)).toBeTruthy();
    const forbidden: ControlAction[] = [{ tool: "coordinate_group_task", ...coordination, operation: "retry" },
      { tool: "request_group_integration", groupRunId: "run-G", coordinatorEpoch: 7, integrationOwnerAgentId: "worker" },
      { tool: "complete_group", groupRunId: "run-G", coordinatorEpoch: 7, output: "Repeat completed group" }];
    for (const action of forbidden) expect(() => new HarnessRuntimeFacade().validateResidentTurnResult({ handoff: "Unauthorized business",
      controlActions: [{ ...actions[0]!, action }] }, request)).toThrow();
  });

  it.each(["scoped-leader", "scoped-main"])("does not offer implicit closing to an ordinary %s recovery scope", async role => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "ordinary-recovery-no-closing-")); roots.push(root);
    const result = await runMcp(context(root, { kind: "main", agent: "main", candidates: [], collaboration: { role,
      nodeRunId: "node-G", groupRunId: "run-G", coordinatorEpoch: 7, memberNodeIds: [], routeCandidates: [],
      failedArrivalRequestIds: ["failed"], allowReconfiguration: false } }), [{ id: 1, method: "tools/list" }]);
    const tools = (result[0]!.result as { tools: Array<{ name: string; inputSchema: { properties: { operation?: { enum: string[] } } } }> }).tools;
    expect(tools.find(tool => tool.name === "coordinate_group_task")?.inputSchema.properties.operation?.enum).not.toContain("close_worktree");
  });

  it("exposes Agent-owned Git tools only with the scoped Git capability", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "agent-git-tools-")); roots.push(root);
    const result = await runMcp(context(root, { allowAgentGitActions: true, candidates: [] }), [{ id: 1, method: "tools/list" }]);
    expect((result[0]!.result as { tools: Array<{ name: string }> }).tools.map((tool) => tool.name))
      .toEqual(["finish_task", "git_revert", "git_log", "git_show", "git_diff", "git_get_operation", "git_reconcile_push", "git_push", "github_create_pr", "github_get_pr", "github_merge_pr", "github_close_pr", "git_prepare_conflict", "publish_artifact"]);
    const push = (result[0]!.result as { tools: Array<{ name: string; description: string }> }).tools
      .find(tool => tool.name === "git_push")!;
    expect(push.description).toContain("Ordinary business pushes do not stage files or create a commit");
    expect(push.description).toContain("git_stage and git_commit are provided by the filesystem-authority MCP");
    expect(push.description).toContain("existing tool discovery within current permissions");
    expect(push.description).toContain("already_published only when it exactly matches the local head");
    expect((result[0]!.result as { tools: Array<{ name: string; annotations: unknown }> }).tools
      .find((tool) => tool.name === "git_get_operation")?.annotations)
      .toEqual({ readOnlyHint: true, destructiveHint: false, openWorldHint: false });
  });
  it("rejects forged or incomplete new Git query/revert requests before accepting an action", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "git-request-boundaries-")); roots.push(root);
    const calls = [
      ["git_log", { revision: "HEAD", offset: 0 }],
      ["git_show", { commit: "a".repeat(40), projectId: "forged-project" }],
      ["git_diff", { mode: "revisions", from: "a".repeat(40) }],
      ["git_revert", { mode: "apply", target: "a".repeat(40) }],
      ["git_revert", { mode: "abort", operationId: `git-revert-${"a".repeat(64)}` }],
      ["git_revert", { mode: "status", operationId: `git-revert-${"a".repeat(64)}`, ownerExecutionId: "forged-owner" }],
      ["github_get_pr", { sourceOperationId: "source-merge", projectId: "forged-project" }]
    ] as const;
    const result = await runMcp(context(root, { allowAgentGitActions: true, candidates: [] }), calls.map(([name, arguments_], i) => ({
      id: i + 1, method: "tools/call", params: { name, arguments: { callId: `bad-${i}`, ...arguments_ } }
    })));
    expect(result).toHaveLength(calls.length);
    for (const response of result) expect(response.result).toMatchObject({ isError: true });
    await expect(fs.stat(path.join(root, "actions.json"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("assigns canonical final delivery its PR tools and operation query and rejects business pushes", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "canonical-final-tools-")); roots.push(root);
    const result = await runMcp(context(root, { allowAgentGitActions: true, canonicalFinalIntegration: true, candidates: [] }), [
      { id: 1, method: "tools/list" },
      { id: 2, method: "tools/call", params: { name: "git_push", arguments: { callId: "forged-push" } } },
      { id: 3, method: "tools/call", params: { name: "git_reconcile_push", arguments: { callId: "forged-reconcile", operationId: "old-member-push", retry: true } } }
    ]);
    expect((result[0]!.result as { tools: Array<{ name: string }> }).tools.map((tool) => tool.name))
      .toEqual(["finish_task", "git_get_operation", "github_create_pr", "github_get_pr", "github_merge_pr", "github_close_pr"]);
    expectRecoverableToolError(result.find((item) => item.id === 2));
    expectRecoverableToolError(result.find((item) => item.id === 3));
  });

  it.each(["observe", "retry", "error", "historical"] as const)("transports the owning Agent's retained push %s request and outcome through actual MCP", async (mode) => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "agent-reconcile-push-mcp-")); roots.push(root);
    const settings = context(root, { allowAgentGitActions: true, candidates: [], requireBridge: true });
    const action = { tool: "git_reconcile_push", operationId: "scoped-checkpoint-worker-epoch-1", ...(mode === "retry" ? { retry: true } : {}), ...(mode === "historical" ? { historical: true } : {}) };
    let calls = 0;
    const outcome = { status: "unconfirmed", operation: { id: action.operationId, status: "uncertain" }, remote: { status: "missing" } };
    const service = new ControlActionService({ projectId: settings.projectId as string, agent: settings.agent as string,
      invocationId: settings.invocationId as string, stateVersion: settings.stateVersion as number,
      capability: "capability-test-secret", stagingPath: settings.stagingPath as string,
      revalidate: async () => {}, execute: async (envelope) => {
        expect(envelope.action).toEqual(action); calls += 1;
        if (mode === "error") throw new Error("Retained operation belongs to a different epoch");
        return outcome;
      } });
    const bridge = await startControlActionBridge(service, root);
    try {
      const result = await runMcp({ ...settings, bridgePath: bridge.endpoint.path, bridgeHost: bridge.endpoint.host, bridgePort: bridge.endpoint.port }, [
        { id: 1, method: "tools/call", params: { name: "git_reconcile_push", arguments: { callId: "invalid-retry",
          operationId: action.operationId, retry: "true" } } },
        { id: 2, method: "tools/call", params: { name: "git_reconcile_push", arguments: { callId: "my-retained-push",
          operationId: action.operationId, ...(mode === "retry" ? { retry: true } : {}), ...(mode === "historical" ? { historical: true } : {}) } } }
      ]);
      expectRecoverableToolError(result[0], "retry must be a boolean");
      if (mode === "error") expectRecoverableToolError(result[1], "different epoch");
      else {
        expect(result[1].error).toBeUndefined();
        expect(JSON.stringify(result[1].result)).toContain(JSON.stringify(outcome).replaceAll('"', '\\"'));
      }
      expect(calls).toBe(1);
    } finally { await bridge.close(); }
  });

  it("rejects historical retries and transports a valid historical request through the native result validator", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "agent-historical-push-contract-")); roots.push(root);
    const hash = createHash("sha256").update("capability-test-secret").digest("hex");
    const settings = context(root, { allowAgentGitActions: true, candidates: [], capabilityHash: hash });
    const responses = await runMcp(settings, [
      { id: 1, method: "tools/call", params: { name: "git_reconcile_push", arguments: {
        callId: "invalid-historical-type", operationId: "original-push", historical: "true" } } },
      { id: 2, method: "tools/call", params: { name: "git_reconcile_push", arguments: {
        callId: "invalid-historical-retry", operationId: "original-push", historical: true, retry: true } } },
      { id: 3, method: "tools/call", params: { name: "git_reconcile_push", arguments: {
        callId: "observe-original", operationId: "original-push", historical: true } } }
    ]);
    expectRecoverableToolError(responses[0], "historical must be a boolean");
    expectRecoverableToolError(responses[1], "Historical push observation cannot retry");
    const actions = JSON.parse(await fs.readFile(String(settings.stagingPath), "utf8")) as ControlActionEnvelope[];
    expect(actions).toHaveLength(1);
    const returned = { handoff: "Original Agent decides based on its own retained push", controlActions: actions };
    const request = { project: { id: settings.projectId, agents: { branch: { harness: "codex" } } },
      agent: "branch", invocationId: settings.invocationId, control: { ...settings, capability: "capability-test-secret" } } as unknown as AgentRunRequest;
    expect(new HarnessRuntimeFacade().validateResidentTurnResult(returned, request)).toEqual(returned);
    const forbidden = structuredClone(returned); forbidden.controlActions[0].action = {
      tool: "git_reconcile_push", operationId: "original-push", historical: true, retry: true };
    expect(() => new HarnessRuntimeFacade().validateResidentTurnResult(forbidden, request)).toThrow();
  });

  it("transports an operation query through the native result validator without granting retry fields", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "agent-operation-query-contract-")); roots.push(root);
    const hash = createHash("sha256").update("capability-test-secret").digest("hex");
    const settings = context(root, { allowAgentGitActions: true, candidates: [], capabilityHash: hash });
    const responses = await runMcp(settings, [{ id: 1, method: "tools/call", params: { name: "git_get_operation", arguments: {
      callId: "observe-original", operationId: "original-merge" } } }]);
    expect(responses[0].error).toBeUndefined();
    const actions = JSON.parse(await fs.readFile(String(settings.stagingPath), "utf8")) as ControlActionEnvelope[];
    expect(actions).toHaveLength(1);
    expect(actions[0].action).toEqual({ tool: "git_get_operation", operationId: "original-merge" });
    const returned = { handoff: "Original Agent reads its retained operation before deciding", controlActions: actions };
    const request = { project: { id: settings.projectId, agents: { branch: { harness: "codex" } } },
      agent: "branch", invocationId: settings.invocationId, control: { ...settings, capability: "capability-test-secret" } } as unknown as AgentRunRequest;
    expect(new HarnessRuntimeFacade().validateResidentTurnResult(returned, request)).toEqual(returned);
    const forged = structuredClone(returned); Object.assign(forged.controlActions[0].action, { retry: true });
    expect(() => new HarnessRuntimeFacade().validateResidentTurnResult(forged, request)).toThrow();
    const forbidden = { ...request, control: { ...request.control!, allowAgentGitActions: false } };
    expect(() => new HarnessRuntimeFacade().validateResidentTurnResult(returned, forbidden)).toThrow();
  });

  it.each(["pushed", "unconfirmed", "remote_success_local_pending"])("separates MCP transport from %s delivery through the actual bridge", async status => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "git-result-readiness-")); roots.push(root);
    const settings = context(root, { allowAgentGitActions: true, candidates: [], requireBridge: true });
    const nextAction = { tool: "git_reconcile_push", operationId: "original-push", retry: false };
    const result = { status, operation: { id: "original-push" }, gitDelivery: { ready: false,
      missingActions: ["git_reconcile_push for retained operationId=original-push"],
      unresolvedOperations: [{ operationId: "original-push", kind: "git.push", status: "uncertain", nextAction }] } };
    const service = new ControlActionService({ projectId: settings.projectId as string, agent: settings.agent as string,
      invocationId: settings.invocationId as string, stateVersion: settings.stateVersion as number,
      capability: "capability-test-secret", stagingPath: settings.stagingPath as string,
      revalidate: async () => {}, execute: async () => result });
    const bridge = await startControlActionBridge(service, root);
    try {
      const responses = await runMcp({ ...settings, bridgePath: bridge.endpoint.path,
        bridgeHost: bridge.endpoint.host, bridgePort: bridge.endpoint.port }, [{ id: 1, method: "tools/call", params: {
          name: "git_get_operation", arguments: { callId: "inspect-original", operationId: "original-push" }
        } }]);
      expect(responses[0].error).toBeUndefined();
      expect(responses[0].result).toMatchObject({ structuredContent: { actionAccepted: true, result,
        git: { outcome: status, completesTask: false, gitDeliveryReady: false, observationOnly: true, nextActions: [nextAction] } } });
      expect((responses[0].result as { content: Array<{ text: string }> }).content[0].text)
        .toMatch(/^Git result:.*Git delivery ready at this observation: false/);
    } finally { await bridge.close(); }
  });

  it.each([false, true])("returns the owning Agent's explicit PR close response through actual MCP (provider error=%s)", async (failed) => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "agent-close-mcp-")); roots.push(root);
    const settings = context(root, { allowAgentGitActions: true, candidates: [], requireBridge: true });
    let mutations = 0;
    const result = { status: "closed", providerNumber: 71 };
    const service = new ControlActionService({ projectId: settings.projectId as string, agent: settings.agent as string,
      invocationId: settings.invocationId as string, stateVersion: settings.stateVersion as number,
      capability: "capability-test-secret", stagingPath: settings.stagingPath as string,
      revalidate: async () => {}, execute: async (envelope) => {
        expect(envelope.action).toEqual({ tool: "github_close_pr", providerNumber: 71, reason: "Agent decided to replace this PR" });
        mutations += 1;
        if (failed) throw new Error("GitHub rejected this close");
        return result;
      } });
    const bridge = await startControlActionBridge(service, root);
    try {
      const responses = await runMcp({ ...settings, bridgePath: bridge.endpoint.path,
        bridgeHost: bridge.endpoint.host, bridgePort: bridge.endpoint.port }, [{ id: 1, method: "tools/call", params: {
          name: "github_close_pr", arguments: { callId: "chosen-close", providerNumber: 71, reason: "Agent decided to replace this PR" }
        } }]);
      if (failed) expectRecoverableToolError(responses[0], "GitHub rejected this close");
      else {
        expect(responses[0].error).toBeUndefined();
        const content = (responses[0].result as { content: Array<{ text: string }> }).content;
        expect(content[0].text).toContain(JSON.stringify(result));
      }
      expect(mutations).toBe(1);
    } finally { await bridge.close(); }
  });

  it.each(["main", "worker"] as const)("does not give a %s invocation without business Git authority a PR close action", async (kind) => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "agent-close-forbidden-")); roots.push(root);
    const responses = await runMcp(context(root, { kind, allowAgentGitActions: kind === "main", candidates: [] }), [
      { id: 1, method: "tools/list" }, { id: 2, method: "tools/call", params: { name: "github_close_pr", arguments: {
        callId: "forged-close", providerNumber: 71
      } } }, { id: 3, method: "tools/call", params: { name: "git_reconcile_push", arguments: {
        callId: "forged-reconcile", operationId: "old-push", retry: true
      } } }
    ]);
    expect((responses[0].result as { tools: Array<{ name: string }> }).tools.map((tool) => tool.name)).not.toContain("github_close_pr");
    expect((responses[0].result as { tools: Array<{ name: string }> }).tools.map((tool) => tool.name)).not.toContain("git_reconcile_push");
    expectRecoverableToolError(responses[1]);
    expectRecoverableToolError(responses[2]);
    await expect(fs.stat(path.join(root, "actions.json"))).rejects.toThrow();
  });

  it("exposes display and completion only to an authorized automatic termination Worker", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "automatic-termination-worker-"));
    roots.push(root);
    const authorized = await runMcp(context(root, {
      agent: "review",
      candidates: [],
      decisionBy: "main",
      canComplete: true
    }), [
      { jsonrpc: "2.0", id: 1, method: "tools/list" },
      {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: "select_display",
          arguments: {
            callId: "display",
            primary: { agent: "review", path: "review.md", title: "Review result" }
          }
        }
      },
      {
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: {
          name: "complete_project",
          arguments: { callId: "complete", rationale: "The configured condition is verified." }
        }
      }
    ]);
    expect((authorized[0]?.result as { tools: Array<{ name: string }> }).tools
      .map(({ name }) => name)).toEqual([
        "finish_task",
        "publish_artifact",
        "select_display",
        "complete_project"
      ]);
    expect(authorized.find(({ id }) => id === 2)?.error).toBeUndefined();
    expect(authorized.find(({ id }) => id === 3)?.error).toBeUndefined();
    expect(JSON.parse(await fs.readFile(path.join(root, "actions.json"), "utf8")))
      .toMatchObject([
        { action: { tool: "select_display" } },
        { action: { tool: "complete_project" } }
      ]);

    const restrictedRoot = await fs.mkdtemp(path.join(os.tmpdir(), "ordinary-worker-"));
    roots.push(restrictedRoot);
    const restricted = await runMcp(context(restrictedRoot, {
      agent: "review",
      candidates: [],
      decisionBy: "main",
      canComplete: false
    }), [{ jsonrpc: "2.0", id: 1, method: "tools/list" }]);
    expect((restricted[0]?.result as { tools: Array<{ name: string }> }).tools
      .map(({ name }) => name)).toEqual(["finish_task", "publish_artifact"]);
  });

  it("retains Worker workspace tools while restricting repair routing to configured candidates", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "worker-route-repair-")); roots.push(root);
    const responses = await runMcp(context(root), [
      { jsonrpc: "2.0", id: 1, method: "tools/list" },
      { jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "publish_artifact", arguments: { callId: "publish" } } },
      { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "route_to_agent", arguments: { callId: "route", target: "writing", rationale: "Continue from the saved handoff." } } }
    ]);
    expect((responses.find((message) => message.id === 1)?.result as { tools: Array<{ name: string }> }).tools.map((tool) => tool.name)).toEqual(["finish_task", "route_to_agent", "publish_artifact"]);
    expect((responses.find((message) => message.id === 1)?.result as { tools: Array<{ name: string }> }).tools[0]).toMatchObject({
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false }
    });
    expectRecoverableToolError(responses.find((message) => message.id === 2));
    expect(responses.find((message) => message.id === 3)?.error).toBeUndefined();
    expect(JSON.parse(await fs.readFile(path.join(root, "actions.json"), "utf8"))).toMatchObject([{ action: { tool: "route_to_agent", target: "writing" } }]);
  });

  it("exposes apply_workflow only to an explicitly authorized Main", async () => {
    const disabledRoot = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-orch-mcp-workflow-off-"));
    roots.push(disabledRoot);
    const disabled = await runMcp(context(disabledRoot, {
      agent: "main",
      kind: "main",
      candidates: [],
      decisionBy: "main",
      allowUserIntervention: true,
      canComplete: true
    }), [{ jsonrpc: "2.0", id: 1, method: "tools/list" }]);
    expect(((disabled[0]?.result as { tools: Array<{ name: string }> }).tools)
      .map(({ name }) => name)).not.toContain("apply_workflow");

    const enabledRoot = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-orch-mcp-workflow-on-"));
    roots.push(enabledRoot);
    await fs.writeFile(path.join(enabledRoot, "workflow.json"), "{}\n", "utf8");
    const enabled = await runMcp(context(enabledRoot, {
      agent: "main",
      kind: "main",
      candidates: [],
      decisionBy: "main",
      allowUserIntervention: true,
      allowAgentOrchestrationReconfiguration: true,
      canComplete: true
    }), [
      { jsonrpc: "2.0", id: 1, method: "tools/list" },
      {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: "apply_workflow",
          arguments: {
            callId: "apply-workflow",
            path: "workflow.json",
            rationale: "Adopt the validated configuration."
          }
        }
      }
    ]);
    expect(((enabled[0]?.result as { tools: Array<{ name: string }> }).tools)
      .map(({ name }) => name)).toContain("apply_workflow");
    expect(enabled.find((message) => message.id === 2)?.error).toBeUndefined();
    expect(JSON.parse(await fs.readFile(path.join(enabledRoot, "actions.json"), "utf8")))
      .toMatchObject([{ action: { tool: "apply_workflow", path: "workflow.json" } }]);

    const beforeCompletionRoot = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-orch-mcp-workflow-before-completion-"));
    roots.push(beforeCompletionRoot);
    await fs.writeFile(path.join(beforeCompletionRoot, "workflow.json"), "{}\n", "utf8");
    const beforeCompletion = await runMcp(context(beforeCompletionRoot, {
      agent: "main",
      kind: "main",
      candidates: ["writing"],
      decisionBy: "main",
      allowUserIntervention: true,
      allowAgentOrchestrationReconfiguration: true,
      canComplete: false
    }), [
      { jsonrpc: "2.0", id: 1, method: "tools/list" },
      {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: "apply_workflow",
          arguments: {
            callId: "apply-before-completion",
            path: "workflow.json",
            rationale: "Autonomous reconfiguration is independent of completion authority."
          }
        }
      }
    ]);
    expect(((beforeCompletion[0]?.result as { tools: Array<{ name: string }> }).tools)
      .map(({ name }) => name)).toContain("apply_workflow");
    expect(beforeCompletion.find((message) => message.id === 2)?.error).toBeUndefined();
    expect(JSON.parse(await fs.readFile(path.join(beforeCompletionRoot, "actions.json"), "utf8")))
      .toMatchObject([{ action: { tool: "apply_workflow" } }]);
  });

  it.each(["allowAgentOrchestrationReconfiguration", "allowWorkflowReconfiguration"] as const)(
    "accepts Main workflow MCP receipts through Harness validation with %s",
    async (authority) => {
      const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-main-workflow-receipt-")); roots.push(root);
      const settings = context(root, { agent: "main", kind: "main", candidates: [], decisionBy: "main",
        allowUserIntervention: false, canComplete: false, [authority]: true,
        capabilityHash: createHash("sha256").update("capability-test-secret").digest("hex") });
      await fs.writeFile(path.join(root, "workflow.json"), "{}\n");
      const responses = await runMcp(settings, [
        { id: 1, method: "tools/call", params: { name: "apply_workflow", arguments: {
          callId: "legacy-path", path: "agent-orchestration.json", rationale: "Reject the retired proposal path." } } },
        { id: 2, method: "tools/call", params: { name: "apply_workflow", arguments: {
          callId: "current-path", path: "workflow.json", rationale: "Apply the current Main proposal." } } }
      ]);
      expectRecoverableToolError(responses.find(response => response.id === 1));
      const accepted = responses.find(response => response.id === 2)!;
      expect(accepted.error).toBeUndefined();
      expect(accepted.result).not.toMatchObject({ isError: true });
      const actions = JSON.parse(await fs.readFile(String(settings.stagingPath), "utf8")) as ControlActionEnvelope[];
      expect(actions).toHaveLength(1);
      expect(actions[0]!.action).toEqual({ tool: "apply_workflow", path: "workflow.json", rationale: "Apply the current Main proposal." });
      const request = { project: { id: settings.projectId, agents: { main: { harness: "codex" } } }, agent: "main",
        invocationId: settings.invocationId, control: { ...settings, capability: "capability-test-secret" } } as unknown as AgentRunRequest;
      const facade = new HarnessRuntimeFacade();
      const returned = { handoff: "Main submitted the current workflow proposal.", controlActions: actions };
      expect(facade.validateResidentTurnResult(returned, request)).toEqual(returned);
      expect(() => facade.validateResidentTurnResult(returned, { ...request, control: { ...request.control!,
        allowAgentOrchestrationReconfiguration: false, allowWorkflowReconfiguration: false } }))
        .toThrow(/invalid orchestration control envelope/);
    }
  );

  it("returns workflow validation failures as recoverable Main tool results", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-orch-mcp-workflow-retry-"));
    roots.push(root);
    await fs.writeFile(path.join(root, "workflow.json"), "{}\n", "utf8");
    const bridgePath = process.platform === "win32" ? ["", "", ".", "pipe", path.basename(root)].join(String.fromCharCode(92)) : path.join(root, "control.sock");
    const bridge = net.createServer((socket) => {
      socket.setEncoding("utf8");
      socket.on("data", () => {
        socket.end(`${JSON.stringify({ ok: false, error: "routes are invalid" })}\n`);
      });
    });
    await new Promise<void>((resolve, reject) => {
      bridge.once("error", reject);
      bridge.listen(bridgePath, resolve);
    });
    try {
      const responses = await runMcp(context(root, {
        agent: "main",
        kind: "main",
        candidates: ["finish"],
        decisionBy: "main",
        allowAgentOrchestrationReconfiguration: true,
        canComplete: true,
        bridgePath
      }), [{
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "apply_workflow",
          arguments: {
            callId: "workflow-retry",
            path: "workflow.json",
            rationale: "Retry after repairing the rejected proposal."
          }
        }
      }]);
      const response = responses.find((message) => message.id === 1);
      expect(response?.error).toBeUndefined();
      expect(response?.result).toMatchObject({ isError: true });
      expect(JSON.stringify(response?.result)).toContain("routes are invalid");
    } finally {
      await new Promise<void>((resolve) => bridge.close(() => resolve()));
    }
  });

  it("exposes only the role-appropriate tools and stages an idempotent Worker route", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-orch-mcp-work-"));
    roots.push(root);
    const listed = await runMcp(context(root), [
      { jsonrpc: "2.0", id: 1, method: "tools/list" },
      { jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "route_to_agent", arguments: { callId: "call-1", target: "writing", rationale: "The writing pass is next." } } },
      { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "route_to_agent", arguments: { callId: "call-1", target: "writing", rationale: "The writing pass is next." } } },
      { jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "route_to_agent", arguments: { callId: "call-2", target: "writing", rationale: "Same route with expanded prose." } } },
      { jsonrpc: "2.0", id: 5, method: "tools/call", params: { name: "route_to_agent", arguments: { callId: "call-3", target: "review", rationale: "Conflicting route." } } },
      { jsonrpc: "2.0", id: 6, method: "tools/call", params: { name: "request_user", arguments: { callId: "call-4", message: "No", rationale: "Worker cannot ask." } } }
    ]);
    const byId = new Map(listed.filter((message) => typeof message.id === "number").map((message) => [message.id as number, message]));
    const listedTools = (byId.get(1)?.result as {
      tools: Array<{
        name: string;
        inputSchema: { properties: { callId: { description?: string; maxLength?: number } } };
      }>;
    }).tools;
    expect(listedTools.map((tool) => tool.name)).toEqual(["finish_task", "route_to_agent", "publish_artifact"]);
    for (const tool of listedTools) {
      expect(tool.inputSchema.properties.callId).toMatchObject({ maxLength: 256 });
      expect(tool.inputSchema.properties.callId.description).toContain("every different control-tool action");
    }
    expect(byId.get(2)?.error).toBeUndefined();
    expect(byId.get(3)?.error).toBeUndefined();
    expect(byId.get(4)?.error).toBeUndefined();
    expectRecoverableToolError(byId.get(5), "decision is already locked");
    expectRecoverableToolError(byId.get(6), "request_user is not allowed");
    expect(JSON.parse(await fs.readFile(path.join(root, "actions.json"), "utf8"))).toHaveLength(1);
  });

  it("executes every Main tool success path and rejects invalid arguments for each tool", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-orch-mcp-main-"));
    roots.push(root);
    await fs.writeFile(path.join(root, "report.md"), "verified evidence\n", "utf8");
    const responses = await runMcp(context(root, {
      agent: "main",
      kind: "main",
      candidates: ["writing", "finish"],
      decisionBy: "main",
      allowUserIntervention: true,
      canComplete: true
    }), [
      { jsonrpc: "2.0", id: 1, method: "tools/list" },
      { jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "route_to_agent", arguments: { callId: "bad-route", target: "writing" } } },
      { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "publish_artifact", arguments: { callId: "bad-publish", path: "../escape.md", title: "Escape", kind: "document", description: "invalid" } } },
      { jsonrpc: "2.0", id: 10, method: "tools/call", params: { name: "publish_artifact", arguments: { callId: "bad-control-path", path: "report\r\n.md", title: "Control path", kind: "document", description: "invalid" } } },
      { jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "select_display", arguments: { callId: "bad-display", primary: {} } } },
      { jsonrpc: "2.0", id: 5, method: "tools/call", params: { name: "request_user", arguments: { callId: "bad-user", message: "Need input", rationale: "" } } },
      { jsonrpc: "2.0", id: 6, method: "tools/call", params: { name: "complete_project", arguments: { callId: "bad-complete", rationale: "" } } },
      { jsonrpc: "2.0", id: 7, method: "tools/call", params: { name: "publish_artifact", arguments: { callId: "publish", path: "report.md", title: "Verified report", kind: "document", description: "The final verified report." } } },
      { jsonrpc: "2.0", id: 8, method: "tools/call", params: { name: "select_display", arguments: { callId: "display", primary: { agent: "main", path: "report.md", title: "Verified report" }, items: [] } } },
      { jsonrpc: "2.0", id: 9, method: "tools/call", params: { name: "complete_project", arguments: { callId: "complete", rationale: "All configured acceptance evidence is present." } } }
    ]);
    const byId = new Map(responses.filter((message) => typeof message.id === "number").map((message) => [message.id as number, message]));
    const mainTools = (byId.get(1)?.result as {
      tools: Array<{ name: string; inputSchema: Record<string, unknown> }>;
    }).tools;
    expect(mainTools.map((tool) => tool.name)).toEqual([
      "finish_task",
      "route_to_agent",
      "publish_artifact",
      "select_display",
      "request_user",
      "complete_project"
    ]);
    const displaySchema = mainTools.find((tool) => tool.name === "select_display")
      ?.inputSchema as {
        properties?: {
          primary?: { required?: string[]; properties?: Record<string, unknown> };
          items?: { items?: { required?: string[] } };
        };
      };
    expect(displaySchema.properties?.primary).toMatchObject({
      required: ["agent", "path", "title"],
      properties: {
        agent: { type: "string" },
        path: { type: "string" },
        title: { type: "string" }
      }
    });
    expect(displaySchema.properties?.items?.items?.required).toEqual([
      "agent",
      "path",
      "title"
    ]);
    const routeSchema = mainTools.find((tool) => tool.name === "route_to_agent")
      ?.inputSchema as {
        properties?: { assignment?: { maxLength?: number; description?: string } };
      };
    expect(routeSchema.properties?.assignment).toMatchObject({ maxLength: 20_000 });
    expect(routeSchema.properties?.assignment?.description).toContain(
      "never restate or alter them"
    );
    for (const id of [2, 3, 4, 5, 6, 10]) {
      expectRecoverableToolError(byId.get(id));
    }
    expect(JSON.stringify(byId.get(10)?.result)).toContain("control character");
    for (const id of [7, 8, 9]) expect(byId.get(id)?.error).toBeUndefined();
    expect(JSON.stringify(byId.get(7)?.result)).not.toContain("end the current turn immediately");
    expect(JSON.stringify(byId.get(9)?.result)).toContain("Continue the native Harness turn normally");
    expect(JSON.parse(await fs.readFile(path.join(root, "actions.json"), "utf8"))).toMatchObject([
      { action: { tool: "publish_artifact", path: "report.md" } },
      { action: { tool: "select_display", primary: { agent: "main", path: "report.md" } } },
      { action: { tool: "complete_project" } }
    ]);
  });

  it("retains Main evidence tools during a missing-terminal-action repair", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-orch-mcp-repair-"));
    roots.push(root);
    await fs.writeFile(path.join(root, "report.md"), "verified report\n", "utf8");
    const responses = await runMcp(context(root, {
      agent: "main",
      kind: "main",
      candidates: ["writing"],
      decisionBy: "main",
      allowUserIntervention: true,
      canComplete: true
    }), [
      { jsonrpc: "2.0", id: 1, method: "tools/list" },
      { jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "complete_project", arguments: { callId: "complete", rationale: "The preceding work is complete." } } },
      { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "publish_artifact", arguments: { callId: "publish", path: "report.md", title: "Report", kind: "document", description: "Verified result." } } },
      { jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "select_display", arguments: { callId: "display", primary: { agent: "main", path: "report.md", title: "Report" } } } }
    ]);
    const byId = new Map(
      responses
        .filter((message) => typeof message.id === "number")
        .map((message) => [message.id as number, message])
    );
    const tools = (byId.get(1)?.result as {
      tools: Array<{ name: string }>;
    }).tools;
    expect(tools.map((tool) => tool.name)).toEqual([
      "finish_task",
      "route_to_agent",
      "publish_artifact",
      "select_display",
      "request_user",
      "complete_project"
    ]);
    expect(byId.get(2)?.error).toBeUndefined();
    expect(byId.get(3)?.error).toBeUndefined();
    expect(byId.get(4)?.error).toBeUndefined();
    expect(JSON.parse(await fs.readFile(path.join(root, "actions.json"), "utf8"))).toMatchObject([
      { action: { tool: "publish_artifact", path: "report.md" } },
      { action: { tool: "select_display", primary: { agent: "main", path: "report.md" } } },
      { action: { tool: "complete_project" } }
    ]);
  });

  it("uses the captured weak-branch snapshot for schema and action validation", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-orch-mcp-weak-"));
    roots.push(root);
    const responses = await runMcp(context(root, {
      agent: "main",
      kind: "main",
      candidates: ["writing", "review", "finish"],
      decisionBy: "main",
      allowUserIntervention: true,
      allowAgentOrchestrationReconfiguration: true,
      canComplete: true,
      mainCapabilities: {
        schemaVersion: 1,
        controlMode: "weak-branch",
        routeCandidates: ["writing", "finish"],
        canReconfigure: false,
        canComplete: false,
        canRequestUser: false
      }
    }), [
      { jsonrpc: "2.0", id: 1, method: "tools/list" },
      { jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "route_to_agent", arguments: { callId: "outside", target: "review", assignment: "Review." } } },
      { jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "request_user", arguments: { callId: "ask", message: "Need input", rationale: "Blocked." } } },
      { jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "complete_project", arguments: { callId: "complete", rationale: "Done." } } },
      { jsonrpc: "2.0", id: 5, method: "tools/call", params: { name: "route_to_agent", arguments: { callId: "inside", target: "finish", assignment: "Schedule autonomous termination review." } } }
    ]);
    const byId = new Map(responses.filter((message) => typeof message.id === "number").map((message) => [message.id as number, message]));
    const tools = (byId.get(1)?.result as { tools: Array<{ name: string; inputSchema: { properties?: { target?: { enum?: string[] } } } }> }).tools;
    expect(tools.map(({ name }) => name)).toEqual(["finish_task", "route_to_agent", "publish_artifact", "select_display"]);
    expect(tools.find(({ name }) => name === "route_to_agent")?.inputSchema.properties?.target?.enum)
      .toEqual(["writing", "finish"]);
    for (const id of [2, 3, 4]) expectRecoverableToolError(byId.get(id));
    expect(byId.get(5)?.error).toBeUndefined();
    expect(JSON.parse(await fs.readFile(path.join(root, "actions.json"), "utf8")))
      .toMatchObject([{ action: { tool: "route_to_agent", target: "finish" } }]);
  });

  it("stages request_user only when its required control channel is available", async () => {
    const successfulRoot = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-orch-mcp-user-"));
    roots.push(successfulRoot);
    const mainContext = {
      agent: "main",
      kind: "main",
      candidates: ["writing"],
      decisionBy: "main",
      allowUserIntervention: true,
      canComplete: false
    };
    const successful = await runMcp(context(successfulRoot, mainContext), [
      { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "request_user", arguments: { callId: "ask", message: "Please provide the missing source.", rationale: "The evidence cannot be completed without it." } } }
    ]);
    expect(successful.find((message) => message.id === 1)?.error).toBeUndefined();
    expect(JSON.parse(await fs.readFile(path.join(successfulRoot, "actions.json"), "utf8"))).toMatchObject([
      { action: { tool: "request_user" } }
    ]);

    const unavailableRoot = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-orch-mcp-unavailable-"));
    roots.push(unavailableRoot);
    const unavailable = await runMcp(context(unavailableRoot, {
      ...mainContext,
      requireBridge: true
    }), [
      { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "request_user", arguments: { callId: "ask", message: "Please provide the missing source.", rationale: "The evidence cannot be completed without it." } } }
    ]);
    expectRecoverableToolError(
      unavailable.find((message) => message.id === 1),
      "control bridge is unavailable"
    );
    await expect(fs.access(path.join(unavailableRoot, "actions.json"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("rejects forged candidates and prevents a self-reported capability secret", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-orch-mcp-invalid-"));
    roots.push(root);
    const responses = await runMcp(context(root, { candidates: ["writing"] }), [
      { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "route_to_agent", arguments: { callId: "x", target: "review", rationale: "forged" } } }
    ]);
    expectRecoverableToolError(responses.find((message) => message.id === 1));
    await expect(runMcp({ ...context(root), secret: "forged" }, [{ jsonrpc: "2.0", id: 1, method: "tools/list" }])).rejects.toThrow("self-reported secret");
  });
});
