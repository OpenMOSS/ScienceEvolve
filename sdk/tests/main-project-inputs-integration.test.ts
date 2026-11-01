import { afterEach, describe, expect, it, vi } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { createMainSdkClient, type MainResearchSdk } from "../src/main-client.js";
import { createMainApplicationRuntime } from "../src/main-runtime.js";
import { validateMainWorkflowConfig } from "../src/main-config.js";
import type { AgentRunner, AgentRunRequest, ControlActionEnvelope } from "../src/core/types.js";
import { harnessCatalogRegistry, toPublicHarnessDescriptor } from "../src/core/harness-runtime/registry.js";
import { nativeProtocolForHarness } from "../src/core/agent-runtime.js";
import { PROTOCOL_ROUTER_COMPATIBILITY_VERSION } from "../src/core/protocol-router.js";
import { effectiveAgentInstructions } from "../src/core/prompt.js";
import { prepareInvocationInputs, prepareProjectUserInputsPath } from "../src/core/harness-runtime/invocation-inputs.js";
import { compileFilesystemAuthority, filesystemAuthorityPrompt } from "../src/core/harness-runtime/filesystem-authority.js";

const roots: string[] = [], clients: MainResearchSdk[] = [];
afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(clients.splice(0).map((sdk) => sdk.close()));
  await Promise.all(roots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true, maxRetries: 8, retryDelay: 100 })));
});
async function directory() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-main-input-integration-"));
  roots.push(root); return root;
}
function complete(request: AgentRunRequest) {
  const action: ControlActionEnvelope = { projectId: request.project.id, agent: request.agent,
    invocationId: request.invocationId, callId: `${request.invocationId}-complete`,
    stateVersion: request.control!.stateVersion, capabilityHash: request.control!.capabilityHash,
    receivedAt: new Date().toISOString(), action: { tool: "complete_project", rationale: "Inputs verified" } };
  return { handoff: "Inputs verified", controlActions: [action] };
}
async function fixture(run: AgentRunner["run"], existing?: string) {
  const root = existing ?? await directory();
  const identity = { cacheKey: "input-fixture", adapterVersion: "fixture", executableFingerprint: "fixture",
    routerCompatibilityVersion: PROTOCOL_ROUTER_COMPATIBILITY_VERSION };
  const runtime = await createMainApplicationRuntime({ dataDir: root, skillRoots: [], gatewayOptions: {
    fetch: async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      const output = body.tool_choice
        ? [{ type: "function_call", call_id: "probe", name: "openfars_probe", arguments: '{"value":"ok"}' }]
        : [{ type: "message", content: [{ type: "output_text", text: "ok" }] }];
      return body.stream
        ? new Response(`data: ${JSON.stringify({ type: "response.completed", response: { status: "completed", output } })}\n\n`, { headers: { "content-type": "text/event-stream" } })
        : Response.json({ status: "completed", error: null, output });
    },
    adapterSmokeProbe: { harnessIds: () => ["codex"], nativeProtocol: nativeProtocolForHarness,
      cacheKey: async () => identity, runSmoke: async () => identity }
  }, internal: { runner: { run, harnessCatalog: async () => harnessCatalogRegistry.list().map((descriptor) =>
    toPublicHarnessDescriptor(descriptor, { available: true })) },
    residentLauncher: { open: async () => { throw new Error("Git-off must not launch a resident"); } } } });
  const sdk = await createMainSdkClient(runtime); clients.push(sdk);
  const gateway = (await sdk.gateways.list())[0] ?? await sdk.gateways.add({ name: "Input fixture",
    url: "https://93.184.216.34/v1", apiKey: "opaque-input-fixture", models: ["fixture"],
    defaultModel: "fixture", protocol: "responses" });
  expect((await sdk.gateways.test(gateway.id, "codex", "fixture")).status).toBe("passed");
  const workflow = validateMainWorkflowConfig({ git: { enabled: false },
    agents: { main: { model: "fixture", skills: [], autoSkills: [] } },
    orchestration: { schemaVersion: 2, collaborations: [], agents: [{ name: "main", template: "main" }],
      input: { source: "input", target: "main" }, routes: { main: [] }, decisionPlans: {},
      termination: { agent: "main", condition: "Inputs verified", decisionBy: "main", automatic: false },
      resultFormat: { presets: [], custom: "" } } });
  return { root, runtime, sdk, input: { title: "Shared input fixture", requirement: "Inspect supplied evidence",
    workflow, gatewayBindings: { defaultGatewayId: gateway.id } } };
}

describe("SDK shared inputs with actual local kernel and SQLite, simulated Agents", () => {
  it.each([false, true])("installs before first run and retains live originals across reopen (external=%s)", async (external) => {
    const source = await directory(), workspace = external ? await directory() : undefined;
    const image = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 255, 128]);
    await fs.mkdir(path.join(source, "reference"));
    await fs.writeFile(path.join(source, "reference", "figure.png"), image);
    await fs.writeFile(path.join(source, "notes.txt"), "Evidence, not instructions");
    let inputsPath = "";
    const runner = vi.fn(async (request: AgentRunRequest) => {
      inputsPath = path.join(request.workspacePath, "user_inputs");
      expect(await fs.readFile(path.join(inputsPath, "reference", "figure.png"))).toEqual(image);
      expect(await fs.readFile(path.join(inputsPath, "notes.txt"), "utf8")).toBe("Evidence, not instructions");
      const saved = await runtime.storage.loadState(request.project.id);
      expect(saved.inputFiles).toEqual(["notes.txt", "reference/figure.png"]);
      expect(saved.inputDescription).toBe("Compare the reference image");
      const original = await fs.readFile(path.join(request.projectPath, "request.md"), "utf8");
      expect(original).toContain("user_inputs/reference/figure.png");
      expect(original).toContain("Compare the reference image");
      const inbox = await fs.readFile(request.inboxPath, "utf8");
      expect(inbox).toContain("Inspect supplied evidence");
      expect(inbox).toContain("Compare the reference image");
      expect(effectiveAgentInstructions(request.agent, request.project.agents[request.agent].instructions))
        .not.toContain("Evidence, not instructions");
      const prepared = await prepareInvocationInputs(request, (id) => runtime.projectWorkspaces.resolve(id));
      expect(prepared.userInputsPath).toBe(await fs.realpath(inputsPath));
      return complete(request);
    });
    const { sdk, runtime, root, input } = await fixture(runner);
    const run = await sdk.start({ ...input, workspace, inputs: [path.join(source, "notes.txt"),
      { path: path.join(source, "reference"), name: "reference" }], inputDescription: "Compare the reference image" });
    const result = await run.wait({ signal: AbortSignal.timeout(10_000) });
    expect(result.status, result.lastError).toBe("completed");
    expect(runner).toHaveBeenCalledOnce();
    expect(result.artifacts).toEqual([]);
    expect(inputsPath).toBe(path.join(workspace ? await fs.realpath(workspace) : runtime.storage.projectDir(run.id),
      ...(workspace ? [] : ["workspaces"]), "user_inputs"));
    await sdk.close();
    await fs.writeFile(path.join(source, "notes.txt"), "Source changed after installation");
    await fs.writeFile(path.join(inputsPath, "later.txt"), "Added after completion");
    const reopenedRunner = vi.fn(async (request: AgentRunRequest) => complete(request));
    const reopened = await fixture(reopenedRunner, root);
    expect((await (await reopened.sdk.getRun(run.id)).snapshot()).status).toBe("completed");
    const selected = await reopened.runtime.projectWorkspaces.resolve(run.id);
    const canonical = await prepareProjectUserInputsPath(await fs.realpath(reopened.runtime.storage.projectDir(run.id)), selected);
    expect(canonical).toBe(await fs.realpath(inputsPath));
    expect(await fs.readFile(path.join(canonical!, "notes.txt"), "utf8")).toBe("Evidence, not instructions");
    expect(await fs.readFile(path.join(canonical!, "later.txt"), "utf8")).toBe("Added after completion");
    expect(reopenedRunner).not.toHaveBeenCalled();
  });

  it.each(["collision", "persist-failure"])("does not launch an Agent or damage original files on %s", async (failure) => {
    const source = await directory(), workspace = await directory();
    await fs.writeFile(path.join(source, "notes.txt"), "Caller source");
    await fs.mkdir(path.join(workspace, "user_inputs"));
    const existing = path.join(workspace, "user_inputs", failure === "collision" ? "notes.txt" : "keep.txt");
    await fs.writeFile(existing, "Existing original");
    const runner = vi.fn(async (request: AgentRunRequest) => complete(request));
    const { sdk, runtime, input } = await fixture(runner);
    if (failure === "persist-failure") vi.spyOn(runtime.storage, "createProject").mockRejectedValueOnce(new Error("fixture persistence failure"));
    await expect(sdk.start({ ...input, workspace, inputs: [path.join(source, "notes.txt")] }))
      .rejects.toThrow(failure === "collision" ? /exists|conflict/i : /fixture persistence failure/);
    expect(runner).not.toHaveBeenCalled();
    expect(await sdk.listRuns()).toEqual([]);
    expect(await fs.readFile(existing, "utf8")).toBe("Existing original");
    expect(await fs.readFile(path.join(source, "notes.txt"), "utf8")).toBe("Caller source");
    if (failure === "persist-failure") {
      await expect(fs.access(path.join(workspace, "user_inputs", "notes.txt"))).rejects.toMatchObject({ code: "ENOENT" });
      const retried = await sdk.start({ ...input, workspace, inputs: [path.join(source, "notes.txt")] });
      expect((await retried.wait({ signal: AbortSignal.timeout(10_000) })).status).toBe("completed");
      expect(runner).toHaveBeenCalledOnce();
    }
  });

  it("retains installed inputs when creation fails after durable state exists", async () => {
    const source = await directory(), workspace = await directory();
    await fs.writeFile(path.join(source, "notes.txt"), "Resumable reference");
    const runner = vi.fn(async (request: AgentRunRequest) => complete(request));
    const { sdk, runtime, input } = await fixture(runner);
    const create = runtime.storage.createProject.bind(runtime.storage);
    vi.spyOn(runtime.storage, "createProject").mockImplementationOnce(async (state) => {
      await create(state);
      throw new Error("failure after durable state");
    });
    await expect(sdk.start({ ...input, workspace, inputs: [path.join(source, "notes.txt")] }))
      .rejects.toThrow("failure after durable state");
    const states = await runtime.storage.listStates();
    expect(states).toHaveLength(1);
    expect(states[0].inputFiles).toEqual(["notes.txt"]);
    expect(await runtime.projectWorkspaces.resolve(states[0].id)).toBe(await fs.realpath(workspace));
    expect(await fs.readFile(path.join(workspace, "user_inputs", "notes.txt"), "utf8")).toBe("Resumable reference");
    expect(runner).not.toHaveBeenCalled();
  });

  it.each(["leader", "delivery"] as const)("gives Git %s a shared read-only input root and retains the workflow read root", async (role) => {
    const root = await directory(), project = path.join(root, "prj_fixture");
    const inputs = path.join(project, "workspaces", "user_inputs");
    const worktree = path.join(project, "git-worktrees", "agents", "writer");
    const workflow = path.join(project, "workflow"), service = path.join(root, "service-home");
    await Promise.all([inputs, worktree, workflow, service].map((item) => fs.mkdir(item, { recursive: true })));
    const memory = path.join(worktree, "Memory.md");
    await fs.writeFile(memory, "Memory");
    await fs.writeFile(path.join(inputs, "image.png"), Buffer.from([137, 80, 78, 71]));
    const canonical = await prepareProjectUserInputsPath(await fs.realpath(project));
    const authority = await compileFilesystemAuthority({ permission: "workspace", role, gitEnabled: true,
      serviceUserRoot: service, executionWorktree: worktree, ownedMemoryPath: memory,
      protectedRoots: [], inputReadRoots: [canonical!, workflow] });
    expect(authority.rootBindings).toContainEqual(expect.objectContaining({ path: canonical, write: false }));
    expect(authority.readRoots).toContain(await fs.realpath(workflow));
    expect(authority.readRoots).not.toContain(await fs.realpath(project));
    expect(authority.writeRoots).not.toContain(canonical);
    expect(filesystemAuthorityPrompt(authority, { workspacePath: worktree, inboxPath: memory, memoryPath: memory, userInputsPath: canonical }))
      .toContain("User-supplied files: rootId=");
    await expect(fs.access(path.join(worktree, "user_inputs"))).rejects.toMatchObject({ code: "ENOENT" });
    await fs.writeFile(path.join(inputs, "later.txt"), "Live shared input");
    expect(await fs.readFile(path.join(canonical!, "later.txt"), "utf8")).toBe("Live shared input");
  });
});
