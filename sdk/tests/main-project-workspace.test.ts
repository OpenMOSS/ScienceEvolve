import { afterEach, describe, expect, it, vi } from "vitest";
import { promises as fs } from "node:fs";
import { execFileSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { createMainSdkClient, type MainResearchSdk } from "../src/main-client.js";
import { createMainApplicationRuntime, type MainApplicationRuntimeOptions } from "../src/main-runtime.js";
import { validateMainWorkflowConfig } from "../src/main-config.js";
import type { AgentRunner, AgentRunRequest, ControlActionEnvelope } from "../src/core/types.js";
import { harnessCatalogRegistry, toPublicHarnessDescriptor } from "../src/core/harness-runtime/registry.js";
import { nativeProtocolForHarness } from "../src/core/agent-runtime.js";
import { PROTOCOL_ROUTER_COMPATIBILITY_VERSION } from "../src/core/protocol-router.js";
import { MAIN_AGENT_ORCHESTRATION_CURRENT_FILE, mainWorkflowCurrentReferencePath } from "../src/core/main-workflow-files.js";
import { prepareInvocationInputs } from "../src/core/harness-runtime/invocation-inputs.js";
import { compileInvocationPolicy, compileWorkflowPrompt } from "../src/core/harness-runtime/invocation-policy.js";
import { compileFilesystemAuthority, filesystemAuthorityPrompt } from "../src/core/harness-runtime/filesystem-authority.js";
import { ControlActionService, startControlActionBridge } from "../src/core/orchestration-control-bridge.js";

const roots: string[] = [], sdks: MainResearchSdk[] = [];
afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(sdks.splice(0).map((sdk) => sdk.close()));
  await Promise.all(roots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true, maxRetries: 8, retryDelay: 100 })));
});
async function directory() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-main-in-place-")); roots.push(root); return root;
}
function workflow(git = false) {
  return validateMainWorkflowConfig({ git: { enabled: git }, agents: { main: { model: "fixture", skills: [], autoSkills: [] } },
    orchestration: { schemaVersion: 2, collaborations: [], agents: [{ name: "main", template: "main" }],
      input: { source: "input", target: "main" }, routes: { main: [] }, decisionPlans: {},
      termination: { agent: "main", condition: "Fixture complete", decisionBy: "main", automatic: false },
      resultFormat: { presets: [], custom: "" } } });
}
function actions(request: AgentRunRequest, ...values: ControlActionEnvelope["action"][]) {
  return { handoff: "Workspace evidence", controlActions: values.map((action, index) => ({
    projectId: request.project.id, agent: request.agent, invocationId: request.invocationId,
    callId: `${request.invocationId}-${index}`, stateVersion: request.control!.stateVersion,
    capabilityHash: request.control!.capabilityHash, receivedAt: new Date().toISOString(), action
  })) };
}
const complete = (request: AgentRunRequest) => actions(request, { tool: "complete_project", rationale: "Fixture accepted" });
async function fixture(run: AgentRunner["run"] = async (request) => complete(request), existing?: string,
  execution?: MainApplicationRuntimeOptions["execution"]) {
  const root = existing ?? await directory();
  const identity = { cacheKey: "workspace-fixture", adapterVersion: "fixture", executableFingerprint: "fixture", routerCompatibilityVersion: PROTOCOL_ROUTER_COMPATIBILITY_VERSION };
  const runtime = await createMainApplicationRuntime({ dataDir: root, skillRoots: [], execution, gatewayOptions: {
    fetch: async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      const output = body.tool_choice ? [{ type: "function_call", call_id: "probe", name: "openfars_probe", arguments: '{"value":"ok"}' }]
        : [{ type: "message", content: [{ type: "output_text", text: "ok" }] }];
      return body.stream ? new Response(`data: ${JSON.stringify({ type: "response.completed", response: { status: "completed", output } })}\n\n`, { headers: { "content-type": "text/event-stream" } }) : Response.json({ status: "completed", error: null, output });
    },
    adapterSmokeProbe: { harnessIds: () => ["codex"], nativeProtocol: nativeProtocolForHarness, cacheKey: async () => identity, runSmoke: async () => identity }
  }, internal: {
    runner: { run, harnessCatalog: async () => harnessCatalogRegistry.list().map((descriptor) => toPublicHarnessDescriptor(descriptor, { available: true })) },
    residentLauncher: { open: async () => { throw new Error("Git-off must not launch a resident"); } }
  } });
  const sdk = await createMainSdkClient(runtime); sdks.push(sdk);
  const gateway = (await sdk.gateways.list())[0] ?? await sdk.gateways.add({ name: "Workspace fixture", url: "https://93.184.216.34/v1",
    apiKey: "opaque-workspace-fixture", models: ["fixture"], defaultModel: "fixture", protocol: "responses", autoReasoning: false });
  expect((await sdk.gateways.test(gateway.id, "codex", "fixture")).status).toBe("passed");
  return { root, runtime, sdk, input: { title: "In-place workspace", requirement: "Use original files", workflow: workflow(),
    gatewayBindings: { defaultGatewayId: gateway.id } } };
}

describe("main Git-off external workspace (actual kernel/SQLite, local child process, no model/network)", () => {
  it("preserves Main's unfinished draft across invocations while refreshing its isolated current reference", async () => {
    const workspace = await directory();
    await fs.writeFile(path.join(workspace, "workflow.json"), "user-owned workflow");
    const { sdk, runtime, input } = await fixture();
    const run = await sdk.start({ ...input, workspace });
    await run.wait({ signal: AbortSignal.timeout(10_000) });
    await runtime.orchestrator.waitForIdle(run.id);
    const initial = { revision: 1, agents: { main: { instructions: "initial" } } };
    const current = { revision: 2, agents: { main: { instructions: "published" } } };
    const draftPath = await runtime.storage.writeMainAgentOrchestrationSnapshot(run.id, "workflow.json", initial, undefined, "inv_first_draft");
    const draft = '{ "unfinished Main draft": ';
    await fs.writeFile(draftPath, draft);
    const nextPath = await runtime.storage.writeMainAgentOrchestrationSnapshot(run.id, "workflow.json", current, undefined, "inv_second_draft");
    expect(nextPath).toBe(draftPath);
    expect(await fs.readFile(draftPath, "utf8")).toBe(draft);
    expect((await runtime.storage.readMainAgentOrchestrationSnapshot(run.id, "workflow.json", "inv_third_draft")).toString()).toBe(draft);
    const reference = path.join(path.dirname(draftPath), MAIN_AGENT_ORCHESTRATION_CURRENT_FILE);
    expect(JSON.parse(await fs.readFile(reference, "utf8"))).toEqual(current);
    const published = { ...current, revision: 3 };
    await runtime.storage.writeMainAgentOrchestrationCurrentSnapshot(run.id, published);
    expect(JSON.parse(await fs.readFile(reference, "utf8"))).toEqual(published);
    expect(await fs.readFile(draftPath, "utf8")).toBe(draft);
    expect(await fs.readFile(path.join(workspace, "workflow.json"), "utf8")).toBe("user-owned workflow");
  });

  it("applies an isolated reconfiguration proposal without overwriting the user's workflow.json", async () => {
    const workspace = await directory();
    await fs.writeFile(path.join(workspace, "workflow.json"), "original business workflow");
    let count = 0;
    let authority!: ControlActionService;
    const session = { schemaVersion: 1 as const, harnessId: "codex", adapterVersion: "fixture",
      nativeId: "original-workspace-main", generation: 0, durable: true, createdAt: new Date().toISOString() };
    const { sdk, runtime, input } = await fixture(async (request) => {
      await request.onDurableSessionStarted?.(session, session.nativeId);
      const proposalPath = path.join(await fs.realpath(workspace), ".scienceevolve", "management", request.project.id, "proposal", "workflow.json");
      expect(request.control!.workflowAuthoringPath).toBe(proposalPath);
      const inbox = await fs.readFile(request.inboxPath, "utf8");
      expect(inbox).toContain(proposalPath);
      const staged = await prepareInvocationInputs(request, id => runtime.projectWorkspaces.resolve(id));
      expect(staged.workflowAuthoringPath).toBe(proposalPath);
      const reference = path.join(path.dirname(proposalPath), MAIN_AGENT_ORCHESTRATION_CURRENT_FILE);
      expect(mainWorkflowCurrentReferencePath(staged)).toBe(reference);
      const current = JSON.parse(await fs.readFile(reference, "utf8"));
      const prompt = compileWorkflowPrompt(request, staged,
        compileInvocationPolicy(request.project.agents.main, request), { inlineInbox: inbox });
      expect(prompt).toContain(inbox);
      expect(prompt).not.toContain(JSON.stringify(current));
      const filesystem = await compileFilesystemAuthority({ serviceUserRoot: staged.workspacePath,
        projectWorktreeRoot: staged.workspacePath, projectWorktrees: [staged.workspacePath], protectedRoots: [],
        permission: "workspace", role: "legacy", gitEnabled: false, executionWorktree: staged.workspacePath,
        ownedMemoryPath: staged.memoryPath });
      const descriptor = filesystemAuthorityPrompt(filesystem, staged);
      expect(descriptor).toContain(reference);
      await expect(prepareInvocationInputs({ ...request, control: { ...request.control!,
        workflowAuthoringPath: path.join(workspace, "workflow.json") } }, id => runtime.projectWorkspaces.resolve(id)))
        .rejects.toThrow("Unable to validate or stage invocation inputs");
      // Fixed Git management keeps its existing workspace reference, even
      // though its retained proposal belongs to an earlier logical invocation.
      expect(mainWorkflowCurrentReferencePath({ ...staged, workflowAuthoringInvocationId: "inv_original" }))
        .toBe(path.join(staged.workspacePath, MAIN_AGENT_ORCHESTRATION_CURRENT_FILE));
      const gitManagementPrompt = compileWorkflowPrompt(request,
        { ...staged, workflowAuthoringInvocationId: "inv_original" },
        compileInvocationPolicy(request.project.agents.main, request));
      expect(gitManagementPrompt).toContain(request.project.agents.main.instructions);
      expect(gitManagementPrompt).not.toContain(JSON.stringify(current));
      const proposal = JSON.parse(await fs.readFile(proposalPath, "utf8"));
      if (count > 0) {
        expect(proposal.agents.main.instructions).toBe("isolated proposal accepted");
        expect(current.agents.main.instructions).toBe("isolated proposal accepted");
      }
      if (++count === 1) {
        proposal.agents.main.instructions = "isolated proposal accepted";
        await fs.writeFile(proposalPath, JSON.stringify(proposal));
        const accepted = await authority.stageWithResult(request.control!.capability, "workspace-reconfiguration", {
          tool: "apply_workflow", path: "workflow.json", rationale: "Test isolated reconfiguration" });
        return { threadId: session.nativeId, handoff: "Accepted isolated proposal", controlActions: [accepted.envelope] };
      }
      expect(request.project.agents.main.instructions).toContain("isolated proposal accepted");
      const accepted = await authority.stageWithResult(request.control!.capability, "workspace-completion", {
        tool: "complete_project", rationale: "Fixture accepted" });
      return { threadId: session.nativeId, handoff: "Workspace evidence", controlActions: [accepted.envelope] };
    }, undefined, { controlBridgeFactory: async (service, bridgePath) => {
      authority = service; return startControlActionBridge(service, bridgePath);
    } });
    input.workflow.orchestration.allowMainReconfiguration = true;
    const run = await sdk.start({ ...input, workspace });
    const result = await run.wait({ signal: AbortSignal.timeout(10_000) }).catch(async error => {
      const state = await runtime.storage.loadState(run.id);
      throw new Error(JSON.stringify({ lastError: state.lastError, failures: state.failureSummary }), { cause: error });
    });
    expect(result.status, JSON.stringify({ error: result.lastError, failures: result.failureSummary })).toBe("completed");
    expect(await fs.readFile(path.join(workspace, "workflow.json"), "utf8")).toBe("original business workflow");
    expect(count).toBe(2);
    expect((await runtime.storage.loadState(run.id)).agents.main.instructions).toContain("isolated proposal accepted");
  });

  it.each(["directory", "junction"])("rejects an existing Memory.md %s before binding and can reopen after the workspace moves", async (kind) => {
    const parent = await directory(), workspace = path.join(parent, "workspace"), target = path.join(parent, "target");
    await fs.mkdir(workspace); await fs.mkdir(target);
    if (kind === "directory") await fs.mkdir(path.join(workspace, "Memory.md"));
    else await fs.symlink(target, path.join(workspace, "Memory.md"), process.platform === "win32" ? "junction" : "dir");
    const { sdk, root, input } = await fixture();
    await expect(sdk.start({ ...input, workspace })).rejects.toThrow(/Memory.md.*regular/);
    expect(await sdk.listRuns()).toEqual([]);
    await expect(fs.access(path.join(root, "workspace-bindings.json"))).rejects.toMatchObject({ code: "ENOENT" });
    await sdk.close();
    await fs.rename(workspace, path.join(parent, "moved-workspace"));
    expect(await (await fixture(undefined, root)).sdk.listRuns()).toEqual([]);
  });

  it("releases only private bindings after a failure before state persistence and permits reopening", async () => {
    const parent = await directory(), workspace = path.join(parent, "workspace");
    await fs.mkdir(workspace); await fs.writeFile(path.join(workspace, "keep.txt"), "keep original");
    const { sdk, runtime, root, input } = await fixture();
    let projectId = "";
    vi.spyOn(runtime.storage, "createProject").mockImplementationOnce(async (state) => {
      projectId = state.id;
      expect(runtime.projectWorkspaces.path(projectId)).toBe(await fs.realpath(workspace));
      throw new Error("fixture state persistence failure");
    });
    await expect(sdk.start({ ...input, workspace })).rejects.toThrow("fixture state persistence failure");
    expect(runtime.projectWorkspaces.path(projectId)).toBeUndefined();
    expect(JSON.parse(await fs.readFile(path.join(root, "workspace-bindings.json"), "utf8")).projects).toEqual({});
    await expect(fs.access(path.join(root, "projects", projectId, ".sdk-workspace.json"))).rejects.toMatchObject({ code: "ENOENT" });
    expect((await fs.stat(path.join(root, "projects", projectId))).isDirectory()).toBe(true);
    expect(await fs.readFile(path.join(workspace, "keep.txt"), "utf8")).toBe("keep original");
    await sdk.close(); await fs.rename(workspace, path.join(parent, "moved-workspace"));
    expect(await (await fixture(undefined, root)).sdk.listRuns()).toEqual([]);
  });

  it("retains bindings and project files when creation reports a failure after state persistence", async () => {
    const workspace = await directory();
    const { sdk, runtime, root, input } = await fixture();
    const persist = runtime.storage.createProject.bind(runtime.storage);
    let projectId = "";
    vi.spyOn(runtime.storage, "createProject").mockImplementationOnce(async (state) => {
      projectId = state.id; await persist(state); throw new Error("fixture post-persistence failure");
    });
    await expect(sdk.start({ ...input, workspace })).rejects.toThrow("fixture post-persistence failure");
    expect(runtime.projectWorkspaces.path(projectId)).toBe(await fs.realpath(workspace));
    await expect(fs.access(path.join(root, "projects", projectId, "state.json"))).resolves.toBeUndefined();
    await expect(fs.access(path.join(root, "projects", projectId, ".sdk-workspace.json"))).resolves.toBeUndefined();
  });

  it("runs in the original directory, publishes artifacts and reopens the same files without copying", async () => {
    const workspace = await directory(), canonical = await fs.realpath(workspace);
    await fs.writeFile(path.join(workspace, "input.txt"), "original");
    await fs.writeFile(path.join(workspace, "Memory.md"), "user memory\n");
    const runner = vi.fn(async (request: AgentRunRequest) => {
      expect(request.workspacePath).toBe(canonical);
      const context = await runtime.storage.buildContextIndex(request.project);
      expect(context).toContain(`- Workspace path: \`${canonical}\``);
      expect(context).not.toContain(`- Workspace path: \`${path.join(runtime.storage.projectDir(request.project.id), "workspaces")}\``);
      const cwd = execFileSync(process.execPath, ["-e", "process.stdout.write(process.cwd())"],
        { cwd: request.workspacePath, encoding: "utf8", windowsHide: true, timeout: 10_000 });
      expect(await fs.realpath(cwd)).toBe(canonical);
      expect(await fs.readFile(path.join(request.workspacePath, "input.txt"), "utf8")).toBe("original");
      await fs.writeFile(path.join(request.workspacePath, "input.txt"), "modified in place");
      await fs.writeFile(path.join(request.workspacePath, "result.md"), "verified output\n");
      return actions(request,
        { tool: "publish_artifact", path: "result.md", title: "Result", kind: "report", description: "Local evidence" },
        { tool: "select_display", primary: { agent: "main", path: "result.md", title: "Result" } },
        { tool: "complete_project", rationale: "Evidence accepted" });
    });
    const { sdk, runtime, root, input } = await fixture(runner);
    const run = await sdk.start({ ...input, workspace });
    const result = await run.wait({ signal: AbortSignal.timeout(10_000) });
    expect(result.status, result.lastError).toBe("completed");
    expect(runner).toHaveBeenCalledOnce();
    expect(result.artifacts).toEqual([expect.objectContaining({ path: "result.md", sha256: expect.any(String) })]);
    expect(await fs.readFile(path.join(workspace, "input.txt"), "utf8")).toBe("modified in place");
    expect(await fs.readFile(path.join(workspace, "Memory.md"), "utf8")).toBe("user memory\n");
    expect(runtime.storage.projectDir(run.id).startsWith(root)).toBe(true);
    expect(JSON.stringify(await runtime.storage.listArtifactDirectory(run.id, "main"))).toContain("result.md");
    for (const requested of ["result.md", "workspaces/result.md", path.join(workspace, "result.md")]) {
      expect((await runtime.storage.readWorkspaceArtifact(run.id, "main", requested)).content.toString()).toBe("verified output\n");
    }
    await sdk.close();
    const reopened = await fixture(async () => { throw new Error("Completed run must not restart"); }, root);
    expect((await (await reopened.sdk.getRun(run.id)).snapshot()).status).toBe("completed");
    expect(await reopened.runtime.storage.roleWorkspace(run.id, "main", "inv_reopened")).toBe(canonical);
    expect((await reopened.runtime.storage.readWorkspaceArtifact(run.id, "main", "result.md")).content.toString()).toBe("verified output\n");
    const state = await reopened.runtime.storage.loadState(run.id);
    await fs.writeFile(path.join(workspace, "result.md"), "changed after publication");
    await expect(reopened.runtime.storage.resolvePublishedArtifactRecord(run.id, state.artifacts[0])).rejects.toThrow(/changed|integrity/);
  });

  it("retains the original workspace through pause, close, reopen and resume", async () => {
    const workspace = await directory();
    let entered!: () => void, release!: () => void;
    const entry = new Promise<void>((resolve) => { entered = resolve; });
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const first = await fixture(async (request) => {
      await fs.writeFile(path.join(request.workspacePath, "progress.txt"), "retained progress");
      entered(); await gate; return { handoff: "Paused evidence" };
    });
    const run = await first.sdk.start({ ...first.input, workspace });
    await entry;
    try { await run.pause(); } finally { release(); }
    expect((await run.wait({ signal: AbortSignal.timeout(10_000) })).status).toBe("paused");
    await first.sdk.close();
    const resumedRunner = vi.fn(async (request: AgentRunRequest) => {
      expect(request.workspacePath).toBe(await fs.realpath(workspace));
      expect(await fs.readFile(path.join(request.workspacePath, "progress.txt"), "utf8")).toBe("retained progress");
      return complete(request);
    });
    const reopened = await fixture(resumedRunner, first.root);
    const recovered = await reopened.sdk.getRun(run.id);
    expect((await recovered.snapshot()).status).toBe("paused");
    await recovered.resume();
    expect((await recovered.wait({ signal: AbortSignal.timeout(10_000) })).status).toBe("completed");
    expect(resumedRunner).toHaveBeenCalledOnce();
  });

  it("rejects invalid and conflicting inputs before starting a project or modifying user files", async () => {
    const runner = vi.fn(async (request: AgentRunRequest) => complete(request));
    const { sdk, root, input } = await fixture(runner);
    const workspace = await directory(), file = path.join(workspace, "keep.txt");
    await fs.writeFile(file, "preserve");
    await fs.mkdir(path.join(root, "nested"));
    for (const invalid of ["relative", file, path.join(workspace, "absent"), root, path.join(root, "nested"), path.dirname(root)]) {
      await expect(sdk.start({ ...input, workspace: invalid })).rejects.toThrow();
    }
    await expect(sdk.start({ ...input, workspace, sourceWorkspace: { path: workspace } })).rejects.toThrow(/workspace|Workspace/);
    expect(await sdk.listRuns()).toEqual([]);
    expect(runner).not.toHaveBeenCalled();
    expect(await fs.readdir(workspace)).toEqual(["keep.txt"]);
    expect(await fs.readFile(file, "utf8")).toBe("preserve");
  });

  it("keeps artifact reads and directory listing within the selected root", async () => {
    const workspace = await directory(), outside = await directory();
    await fs.writeFile(path.join(outside, "private.txt"), "private");
    await fs.symlink(outside, path.join(workspace, "escape"), process.platform === "win32" ? "junction" : "dir");
    const { sdk, runtime, input } = await fixture();
    const run = await sdk.start({ ...input, workspace });
    expect((await run.wait({ signal: AbortSignal.timeout(10_000) })).status).toBe("completed");
    for (const requested of ["../private.txt", path.join(outside, "private.txt"), "escape/private.txt"]) {
      await expect(runtime.storage.readWorkspaceArtifact(run.id, "main", requested)).rejects.toThrow();
    }
    await expect(runtime.storage.listArtifactDirectory(run.id, "main", "escape")).rejects.toThrow();
    expect(await fs.readFile(path.join(outside, "private.txt"), "utf8")).toBe("private");
  });

  it("preserves the owned workspace default when workspace is omitted", async () => {
    const { sdk, runtime, input } = await fixture();
    const run = await sdk.start(input);
    expect((await run.wait({ signal: AbortSignal.timeout(10_000) })).status).toBe("completed");
    expect(await runtime.storage.roleWorkspace(run.id, "main", "inv_default")).toBe(path.join(runtime.storage.projectDir(run.id), "workspaces"));
  });

  it.each(["missing registry", "missing directory", "replaced directory"])("refuses silent workspace fallback after reopening with a %s", async (fault) => {
    const parent = await directory(), workspace = path.join(parent, "workspace");
    await fs.mkdir(workspace);
    const { sdk, root, input } = await fixture();
    const run = await sdk.start({ ...input, workspace });
    expect((await run.wait({ signal: AbortSignal.timeout(10_000) })).status).toBe("completed");
    await sdk.close();
    if (fault === "missing registry") await fs.rename(path.join(root, "workspace-bindings.json"), path.join(root, "bindings.saved.json"));
    else {
      await fs.rename(workspace, path.join(parent, "preserved-workspace"));
      if (fault === "replaced directory") await fs.mkdir(workspace);
    }
    await expect(fixture(undefined, root)).rejects.toThrow();
    await expect(fs.access(path.join(root, ".scienceevolve-runtime.lock"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(fs.access(path.join(root, "projects", run.id, "workspaces"))).rejects.toMatchObject({ code: "ENOENT" });
  });
});
