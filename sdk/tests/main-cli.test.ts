import { afterEach, describe, expect, it, vi } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { EventEmitter } from "node:events";
import { runMainCli, mainHelp } from "../cli/main-cli.mjs";
import * as mainApi from "../src/main.js";
import { createMainSdkClient } from "../src/main-client.js";
import { createMainApplicationRuntime } from "../src/main-runtime.js";
import { harnessCatalogRegistry, toPublicHarnessDescriptor } from "../src/core/harness-runtime/registry.js";
import type { AgentRunner } from "../src/core/types.js";

const roots: string[] = [];
afterEach(async () => {
  delete process.env.SCIENCEEVOLVE_MAIN_CLI_TEST_KEY;
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  await Promise.all(roots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true, maxRetries: 8, retryDelay: 100 })));
});
async function directory() { const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-main-cli-")); roots.push(root); return root; }
function output() {
  let out = "", err = "";
  return { stdout: { write: (value: string) => { out += value; } }, stderr: { write: (value: string) => { err += value; } },
    entries: () => out.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line)), stderrText: () => err };
}
const options = (root: string, extra: Record<string, string> = {}) => new Map(Object.entries({ engine: "main", "data-dir": root, ...extra }));
function workflow() {
  return mainApi.validateMainWorkflowConfig({ git: { enabled: false }, agents: { main: { model: "fixture", skills: [], autoSkills: [] } },
    orchestration: { schemaVersion: 2, collaborations: [], agents: [{ name: "main", template: "main" }],
      input: { source: "input", target: "main" }, routes: { main: [] }, decisionPlans: {},
      termination: { agent: "main", condition: "CLI fixture complete", decisionBy: "main", automatic: false },
      resultFormat: { presets: [], custom: "" } } });
}
function actualKernelApi(onRun?: (request: Parameters<AgentRunner["run"]>[0]) => Promise<void>) {
  const runner: AgentRunner = { harnessCatalog: async () => harnessCatalogRegistry.list().map((descriptor) => toPublicHarnessDescriptor(descriptor, { available: true })),
    run: async (request) => { await onRun?.(request); return { handoff: "CLI fixture completion", controlActions: [{ projectId: request.project.id, agent: request.agent,
      invocationId: request.invocationId, callId: `${request.invocationId}-complete`, stateVersion: request.control!.stateVersion,
      capabilityHash: request.control!.capabilityHash, receivedAt: new Date().toISOString(),
      action: { tool: "complete_project", rationale: "CLI fixture acceptance satisfied" } }] }; } };
  return { ...mainApi, createMainResearchSdk: async ({ dataDir }) => {
    const runtime = await createMainApplicationRuntime({ dataDir, skillRoots: [], internal: { runner,
      residentLauncher: { open: async () => { throw new Error("Git-off fixture must not open resident"); } } } });
    return createMainSdkClient(runtime);
  } };
}

describe("main CLI transport with actual main Git-off kernel/SQLite, simulated Agent (no network)", () => {
  it.each(["inputs", "inputs-file", "workflow"])("copies text and image inputs before the first Agent via %s", async (flag) => {
    const root = await directory(), dataDir = path.join(root, "data"), workspace = path.join(root, "workspace");
    const assets = path.join(root, "assets"), manifests = path.join(root, "manifests");
    await fs.mkdir(path.join(assets, "nested"), { recursive: true });
    await fs.mkdir(workspace); await fs.mkdir(manifests);
    const image = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a2ioAAAAASUVORK5CYII=", "base64");
    await fs.writeFile(path.join(assets, "nested", "diagram.png"), image);
    await fs.writeFile(path.join(assets, "notes.txt"), "reference text");
    const manifest = path.join(manifests, "inputs.json");
    await fs.writeFile(manifest, JSON.stringify([{ path: "../assets/nested", name: "figures" }, "../assets/notes.txt"]));
    const prefix = flag === "inputs-file" ? "" : "assets";
    let calls = 0;
    const api = actualKernelApi(async (request) => {
      calls++;
      const shared = path.join(request.workspacePath, "user_inputs");
      expect(await fs.readFile(path.join(shared, prefix, "notes.txt"), "utf8")).toBe("reference text");
      expect(await fs.readFile(path.join(shared, prefix, flag === "inputs-file" ? "figures" : "nested", "diagram.png"))).toEqual(image);
    });
    const workflowFile = path.join(root, "workflow.json"), requirement = path.join(root, "task.txt");
    await fs.writeFile(workflowFile, JSON.stringify({ ...workflow(), ...(flag === "workflow" ? { inputs: ["./assets"], inputDescription: " Source references " } : {}) })); await fs.writeFile(requirement, "Use shared references");
    process.env.SCIENCEEVOLVE_MAIN_CLI_TEST_KEY = "opaque-cli-input-fixture";
    const added = output();
    await runMainCli(["gateway", "add"], options(dataDir, { name: "fixture", url: "https://93.184.216.34/v1", protocol: "responses",
      models: "fixture", "default-model": "fixture", "key-env": "SCIENCEEVOLVE_MAIN_CLI_TEST_KEY" }), { api, ...added });
    const started = output();
    expect(await runMainCli(["start", workflowFile, requirement], options(dataDir, {
      gateway: added.entries()[0].gateway.id, workspace,
      ...(flag === "workflow" ? {} : { [flag]: path.relative(process.cwd(), flag === "inputs" ? assets : manifest), "input-description": "  Source references  " })
    }), { api, ...started })).toBe(0);
    expect(calls).toBeGreaterThan(0);
    const id = started.entries().find((entry) => entry.type === "run.started").runId;
    const reopened = await api.createMainResearchSdk({ dataDir });
    try {
      expect(await (await reopened.getRun(id)).snapshot()).toMatchObject({ inputDescription: "Source references", userInputsPath: path.join(await fs.realpath(workspace), "user_inputs") });
    } finally { await reopened.close(); }
  });
  it("rejects malformed input flags before opening runtime data", async () => {
    const root = await directory(), file = path.join(root, "inputs.json"), create = vi.fn();
    const services = { api: { ...mainApi, createMainResearchSdk: create }, ...output() };
    const args = ["start", "unread-workflow.json", "unread-research_proposal.txt"];
    await expect(runMainCli(args, options(root, { inputs: root, "inputs-file": file }), services)).rejects.toThrow(/mutually exclusive/);
    await expect(runMainCli(args, options(root, { inputs: " " }), services)).rejects.toThrow(/inputs/);
    await expect(runMainCli(args, options(root, { "input-description": "x".repeat(2001) }), services)).rejects.toThrow(/2000/);
    for (const invalid of [{ path: "a" }, [" "], [null], [{ path: "" }], [{ path: "a", typo: "b" }], [{ path: "a", name: 1 }], [{ path: "a", name: "../escape" }], [{ path: "a", name: "C:/escape" }]]) {
      await fs.writeFile(file, JSON.stringify(invalid));
      await expect(runMainCli(args, options(root, { "inputs-file": file }), services)).rejects.toThrow(/inputs-file/);
    }
    expect(create).not.toHaveBeenCalled();
  });
  it("passes normalized input metadata separately from workflow and retains source binding", async () => {
    const root = await directory(), file = path.join(root, "workflow.json"), text = path.join(root, "task.txt"), manifest = path.join(root, "inputs.json");
    await fs.writeFile(file, JSON.stringify(mainApi.validateMainWorkflowConfig({ ...workflow(), git: { enabled: true } })));
    await fs.writeFile(text, "Source fixture");
    await fs.writeFile(manifest, JSON.stringify(["notes.txt", { path: "image.png", name: "figures/renamed.png" }]));
    const run = { id: "inputs-fixture", wait: async () => ({ status: "completed" }), events: async function* () {} };
    const start = vi.fn(async () => run);
    const services = { api: { ...mainApi, createMainResearchSdk: async () => ({ start, close: async () => {} }) }, ...output() };
    expect(await runMainCli(["start", file, text], options(root, {
      gateway: "g", "source-workspace": root, "inputs-file": manifest, "input-description": "  "
    }), services)).toBe(0);
    expect(start.mock.calls[0][0]).toMatchObject({
      sourceWorkspace: { path: root }, gatewayBindings: { defaultGatewayId: "g" }, inputDescription: "",
      inputs: [path.join(root, "notes.txt"), { path: path.join(root, "image.png"), name: "figures/renamed.png" }]
    });
    expect(start.mock.calls[0][0].workflow).not.toHaveProperty("inputs");
  });
  it("leaves workflow input defaults for the client and forwards only explicit independent overrides", async () => {
    const root = await directory(), file = path.join(root, "workflow.json"), text = path.join(root, "task.txt"), empty = path.join(root, "empty.json");
    await fs.writeFile(file, JSON.stringify({ ...workflow(), inputs: ["./materials"], inputDescription: "workflow description" }));
    await fs.writeFile(text, "Defaults fixture"); await fs.writeFile(empty, "[]");
    const run = { id: "defaults-fixture", wait: async () => ({ status: "completed" }), events: async function* () {} };
    const start = vi.fn(async () => run);
    const services = { api: { ...mainApi, createMainResearchSdk: async () => ({ start, close: async () => {} }) }, ...output() };
    for (const extra of [{}, { "inputs-file": empty }, { "input-description": "" }]) {
      expect(await runMainCli(["start", file, text], options(root, { gateway: "g", ...extra }), services)).toBe(0);
    }
    const [defaults, inputsOnly, descriptionOnly] = start.mock.calls.map(([value]) => value);
    expect(defaults).not.toHaveProperty("inputs"); expect(defaults).not.toHaveProperty("inputDescription");
    expect(defaults.workflow).toMatchObject({ inputs: [path.join(root, "materials")], inputDescription: "workflow description" });
    expect(inputsOnly.inputs).toEqual([]); expect(inputsOnly).not.toHaveProperty("inputDescription");
    expect(descriptionOnly.inputDescription).toBe(""); expect(descriptionOnly).not.toHaveProperty("inputs");
  });
  it("resolves a relative CLI workspace and executes there through the actual kernel", async () => {
    const root = await directory(), dataDir = path.join(root, "data"), workspace = path.join(root, "existing project");
    await fs.mkdir(workspace); await fs.writeFile(path.join(workspace, "input.txt"), "original source");
    const observed: string[] = [];
    const api = actualKernelApi(async (request) => {
      observed.push(request.workspacePath);
      expect(await fs.readFile(path.join(request.workspacePath, "input.txt"), "utf8")).toBe("original source");
      await fs.writeFile(path.join(request.workspacePath, "output.txt"), "actual kernel fixture");
    });
    const workflowFile = path.join(root, "workflow.json"), requirement = path.join(root, "research_proposal.txt");
    await fs.writeFile(workflowFile, JSON.stringify(workflow())); await fs.writeFile(requirement, "Workspace fixture");
    process.env.SCIENCEEVOLVE_MAIN_CLI_TEST_KEY = "opaque-cli-workspace-fixture";
    const added = output();
    await runMainCli(["gateway", "add"], options(dataDir, { name: "fixture", url: "https://93.184.216.34/v1", protocol: "responses",
      models: "fixture", "default-model": "fixture", "key-env": "SCIENCEEVOLVE_MAIN_CLI_TEST_KEY" }), { api, ...added });
    const started = output();
    expect(await runMainCli(["start", workflowFile, requirement], options(dataDir, {
      gateway: added.entries()[0].gateway.id, workspace: path.relative(process.cwd(), workspace)
    }), { api, ...started })).toBe(0);
    expect(observed).toEqual([await fs.realpath(workspace)]);
    expect(await fs.readFile(path.join(workspace, "output.txt"), "utf8")).toBe("actual kernel fixture");
    const id = started.entries().find((entry) => entry.type === "run.started").runId;
    const reopened = await api.createMainResearchSdk({ dataDir });
    try { expect(await reopened.getRun(id).then((run) => run.snapshot())).toMatchObject({ status: "completed" }); }
    finally { await reopened.close(); }
    await expect(fs.access(path.join(workspace, ".scienceevolve-main-runtime.json"))).rejects.toMatchObject({ code: "ENOENT" });
  });
  it("rejects conflicting workspace options before requirement reads or runtime open", async () => {
    const root = await directory(), file = path.join(root, "git.json");
    await fs.writeFile(file, JSON.stringify(mainApi.validateMainWorkflowConfig({ ...workflow(), git: { enabled: true } })));
    const create = vi.fn(), services = { api: { ...mainApi, createMainResearchSdk: create }, ...output() };
    const args = ["start", file, path.join(root, "requirement-must-not-be-read.txt")];
    await expect(runMainCli(args, options(root, { gateway: "g", workspace: root, "source-workspace": root }), services)).rejects.toThrow(/mutually exclusive/);
    expect(create).not.toHaveBeenCalled();
  });
  it.each(["codex", "hermes"])("imports %s API-key env configuration through the main host without testing a model", async (harness) => {
    const root = await directory(); const out = output();
    vi.stubEnv("SDK_CODEX_BASE_URL", "https://93.184.216.34/v1");
    vi.stubEnv("SDK_CODEX_API_KEY", "opaque-main-import-cli");
    vi.stubEnv("OPENAI_BASE_URL", "https://93.184.216.34/v1");
    vi.stubEnv("OPENAI_API_KEY", "opaque-main-import-cli");
    expect(await runMainCli(["gateway", "import"], options(path.join(root, "data"), {
      harness, model: "fixture", source: "env", name: "CLI imported"
    }), { api: actualKernelApi(), ...out })).toBe(0);
    expect(out.entries()[0]).toMatchObject({ type: "gateway.imported", harness, source: "env", gateway: { name: "CLI imported", apiKeyConfigured: true } });
    expect(JSON.stringify(out.entries())).not.toContain("opaque-main-import-cli");
    await expect(fs.access(path.join(root, "data", ".scienceevolve-runtime.lock"))).rejects.toMatchObject({ code: "ENOENT" });
  });
  it("refuses invalid import source/profile options before opening runtime data", async () => {
    const create = vi.fn(), root = await directory();
    const services = { api: { ...mainApi, createMainResearchSdk: create }, ...output() };
    await expect(runMainCli(["gateway", "import"], options(root, { harness: "codex", model: "fixture", source: "auto" }), services)).rejects.toThrow(/source/);
    await expect(runMainCli(["gateway", "import"], options(root, { harness: "codex", model: "fixture", source: "env", "profile-path": root }), services)).rejects.toThrow(/profile-path/);
    await expect(runMainCli(["gateway", "import"], options(root, { harness: "codex", model: "fixture", source: "profile", "profile-path": "relative" }), services)).rejects.toThrow(/absolute/);
    expect(create).not.toHaveBeenCalled();
  });
  it("adds/binds a gateway, starts through the main engine, reopens snapshots and replays events", async () => {
    const root = await directory(); const dataDir = path.join(root, "data"); const api = actualKernelApi();
    const workflowFile = path.join(root, "workflow.json"), requirement = path.join(root, "research_proposal.txt");
    await fs.writeFile(workflowFile, JSON.stringify(workflow())); await fs.writeFile(requirement, "Bounded CLI fixture");
    process.env.SCIENCEEVOLVE_MAIN_CLI_TEST_KEY = "opaque-cli-fixture-key";
    const added = output();
    expect(await runMainCli(["gateway", "add"], options(dataDir, { name: "fixture", url: "https://93.184.216.34/v1", protocol: "responses",
      models: "fixture", "default-model": "fixture", "key-env": "SCIENCEEVOLVE_MAIN_CLI_TEST_KEY" }), { api, ...added })).toBe(0);
    const gateway = added.entries()[0].gateway;
    expect(JSON.stringify(added.entries())).not.toContain("opaque-cli-fixture-key");
    const started = output();
    expect(await runMainCli(["start", workflowFile, requirement], options(dataDir, { gateway: gateway.id }), { api, ...started })).toBe(0);
    const id = started.entries().find((line) => line.type === "run.started").runId;
    expect(started.entries().find((line) => line.type === "run.result").result.status).toBe("completed");
    expect(started.entries().every((line) => line.engine === "main")).toBe(true);
    expect(started.stderrText()).not.toContain("run resume");
    const shown = output(); await runMainCli(["run", "show", id], options(dataDir), { api, ...shown });
    expect(shown.entries()[0].result.status).toBe("completed");
    const replay = output(); await runMainCli(["run", "events", id], options(dataDir, { "after-seq": "0" }), { api, ...replay });
    expect(replay.entries().some((line) => line.event.type === "project.completed")).toBe(true);
    expect(JSON.stringify(replay.entries())).not.toContain("opaque-cli-fixture-key");
    await expect(fs.access(path.join(dataDir, ".scienceevolve-runtime.lock"))).rejects.toMatchObject({ code: "ENOENT" });
  });
  it("validates workflows offline without creating data or opening a host", async () => {
    const root = await directory(); const file = path.join(root, "workflow.json");
    await fs.writeFile(file, JSON.stringify(workflow()));
    const create = vi.fn(); const out = output();
    expect(await runMainCli(["workflow", "validate", file], new Map([["engine", "main"]]), {
      api: { ...mainApi, createMainResearchSdk: create }, ...out
    })).toBe(0);
    expect(out.entries()[0].schemaVersion).toBe(2); expect(create).not.toHaveBeenCalled();
  });
  it("requires explicit absolute dataDir and refuses legacy-only flags before opening data", async () => {
    const root = await directory(); const create = vi.fn(); const services = { api: { ...mainApi, createMainResearchSdk: create }, ...output() };
    await expect(runMainCli(["run", "list"], new Map([["engine", "main"]]), services)).rejects.toThrow(/data-dir/);
    await expect(runMainCli(["run", "list"], options("relative"), services)).rejects.toThrow(/absolute/);
    await expect(runMainCli(["start", "unused.json", "unused.txt"], options(root, { "gateway-source": "profile" }), services)).rejects.toThrow(/Unknown main-engine option/);
    expect(create).not.toHaveBeenCalled(); expect(await fs.readdir(root)).toEqual([]);
  });
  it("creates a main-valid default workflow offline and refuses to overwrite an existing file", async () => {
    const root = await directory(), file = path.join(root, "workflow.json"), create = vi.fn(), out = output();
    const services = { api: { ...mainApi, createMainResearchSdk: create }, ...out };
    expect(await runMainCli(["workflow", "init", file], new Map(), services)).toBe(0);
    expect(out.entries()[0]).toMatchObject({ type: "workflow.created", engine: "main" });
    const contents = await fs.readFile(file, "utf8");
    expect(mainApi.validateMainWorkflowConfig(JSON.parse(contents)).git?.enabled).toBe(false);
    await expect(runMainCli(["workflow", "init", file], new Map(), services)).rejects.toThrow(/EEXIST/);
    expect(await fs.readFile(file, "utf8")).toBe(contents); expect(create).not.toHaveBeenCalled();
  });
  it("rejects conflicting/malformed bindings and incomplete model overrides before opening data", async () => {
    const root = await directory(); const file = path.join(root, "workflow.json"), text = path.join(root, "task.txt"), bindings = path.join(root, "bindings.json");
    await fs.writeFile(file, JSON.stringify(workflow())); await fs.writeFile(text, "Fixture");
    await fs.writeFile(bindings, JSON.stringify({ apiKey: "opaque-fixture" }));
    const create = vi.fn(); const services = { api: { ...mainApi, createMainResearchSdk: create }, ...output() };
    const args = ["run", "start", file, text];
    await expect(runMainCli(args, options(root), services)).rejects.toThrow(/exactly one/);
    await expect(runMainCli(args, options(root, { gateway: "g", "gateway-bindings": bindings }), services)).rejects.toThrow(/exactly one/);
    await expect(runMainCli(args, options(root, { gateway: "g", model: "fixture" }), services)).rejects.toThrow(/together/);
    await expect(runMainCli(args, options(root, { "gateway-bindings": bindings }), services)).rejects.toThrow();
    expect(create).not.toHaveBeenCalled();
  });
  it("validates source flags before opening a host and passes source selection separately from workflow", async () => {
    const root = await directory(), file = path.join(root, "workflow.json"), text = path.join(root, "task.txt"), files = path.join(root, "files.json");
    const config = mainApi.validateMainWorkflowConfig({ ...workflow(), git: { enabled: true } });
    await fs.writeFile(file, JSON.stringify(config)); await fs.writeFile(text, "Source fixture");
    await fs.writeFile(files, JSON.stringify(["code.py", "README.md"]));
    const run = { id: "source-fixture", snapshot: async () => ({ status: "completed", git: { enabled: true } }),
      wait: async () => ({ status: "completed", git: { enabled: true } }),
      events: async function* () {} };
    const start = vi.fn(async () => run), close = vi.fn(async () => {}), create = vi.fn(async () => ({ start, close }));
    const services = { api: { ...mainApi, createMainResearchSdk: create }, ...output() };
    const args = ["run", "start", file, text];
    await expect(runMainCli(args, options(root, { gateway: "g", "source-files": files }), services)).rejects.toThrow(/requires/);
    await expect(runMainCli(args, options(root, { gateway: "g", "source-workspace": "relative" }), services)).rejects.toThrow(/absolute/);
    expect(create).not.toHaveBeenCalled();
    expect(await runMainCli(args, options(root, { gateway: "g", "source-workspace": root, "source-files": files }), services)).toBe(0);
    expect(start.mock.calls[0][0].sourceWorkspace).toEqual({ path: root, files: ["code.py", "README.md"] });
    expect(start.mock.calls[0][0].workflow).not.toHaveProperty("sourceWorkspace");
    expect(close).toHaveBeenCalledOnce();
  });
});

describe("main CLI lifecycle transport contracts (simulated RunHandle; not native acceptance)", () => {
  async function fixture(git = true) {
    const root = await directory(); const signals = new EventEmitter();
    let state = { id: "fixture-id", status: "running", phase: "running", eventSeq: 7, git: { enabled: git } };
    const setState = (value) => { state = { ...state, ...value }; };
    const run = { id: state.id, snapshot: async () => ({ ...state }), wait: async () => ({ ...state }),
      cancel: vi.fn(async () => { setState(git ? { status: "paused", phase: "collaboration:user-cancelled" } : { status: "cancelled", phase: "cancelled" }); return state; }),
      pause: vi.fn(async () => { setState({ status: "paused", phase: "paused" }); return state; }),
      resume: vi.fn(async () => { setState({ status: "completed", phase: "completed" }); return state; }),
      retryGitInitialization: vi.fn(async () => { setState({ status: "completed", phase: "completed" }); return state; }),
      addInput: vi.fn(async () => { setState({ status: "completed" }); return state; }),
      respond: vi.fn(async () => { setState({ status: "completed" }); return state; }),
      events: vi.fn(async function* () { yield { seq: 8, type: "workflow.node.completed", data: { sourceType: "node.completed", coordinatorEpoch: 3 } }; }) };
    const out = output();
    const close = vi.fn(async () => {});
    const services = { ...out, signals, api: { ...mainApi, createMainResearchSdk: async () => ({ getRun: async () => run, close }) } };
    return { root, services, signals, run, out, close, setState };
  }
  it("treats Git-on Stop as a successful resumable operation, not a failed terminal cancellation", async () => {
    const { root, services, run, out, close } = await fixture();
    expect(await runMainCli(["run", "cancel", run.id], options(root), services)).toBe(0);
    expect(out.entries()[0].result.phase).toBe("collaboration:user-cancelled");
    expect(out.stderrText()).toContain(`scievolve run resume ${run.id}`);
    expect(out.stderrText()).toContain("--engine main"); expect(out.stderrText()).toContain(root);
    expect(close).toHaveBeenCalledOnce();
  });
  it("retains Git-off terminal cancel without offering a resume command", async () => {
    const { root, services, run, out } = await fixture(false);
    expect(await runMainCli(["run", "cancel", run.id], options(root), services)).toBe(0);
    expect(out.entries()[0].result.status).toBe("cancelled"); expect(out.stderrText()).toBe("");
  });
  it.each([true, false])("signal stops once, preserves sourceType/epoch and detaches handlers (git=%s)", async (git) => {
    const { root, services, signals, run, out } = await fixture(git);
    run.resume.mockImplementationOnce(async () => undefined);
    run.events.mockImplementationOnce(async function* () {
      signals.emit("SIGINT"); signals.emit("SIGTERM");
      yield { seq: 8, type: "workflow.node.completed", data: { sourceType: "node.completed", coordinatorEpoch: 3 } };
    });
    expect(await runMainCli(["run", "resume", run.id], options(root), services)).toBe(130);
    expect(git ? run.cancel : run.pause).toHaveBeenCalledOnce();
    expect(git ? run.pause : run.cancel).not.toHaveBeenCalled();
    expect(out.entries().filter((line) => line.type === "run.stop.requested")).toHaveLength(1);
    expect(out.entries().find((line) => line.type === "event").event.data).toEqual({ sourceType: "node.completed", coordinatorEpoch: 3 });
    expect(out.stderrText()).toContain(`scievolve run resume ${run.id}`);
    expect(out.stderrText()).toContain("--engine main");
    expect(signals.listenerCount("SIGINT") + signals.listenerCount("SIGTERM")).toBe(0);
  });
  it("does not print a resume command if close cannot confirm Stop", async () => {
    const { root, services, run, out, close } = await fixture();
    close.mockRejectedValueOnce(new Error("Stop not confirmed"));
    await expect(runMainCli(["run", "cancel", run.id], options(root), services)).rejects.toThrow("Stop not confirmed");
    expect(out.stderrText()).not.toContain("run resume");
  });
  it("retries Git via the actual handle method and resumes event consumption at the saved sequence", async () => {
    const { root, services, run, out } = await fixture();
    expect(await runMainCli(["run", "retry-git", run.id], options(root), services)).toBe(0);
    expect(run.retryGitInitialization).toHaveBeenCalledOnce(); expect(run.resume).not.toHaveBeenCalled();
    expect(run.events).toHaveBeenCalledWith({ afterSeq: 7 });
    expect(out.entries().at(-1).result.status).toBe("completed");
  });
  it("replays saved events without requesting follow or a completion rewrite", async () => {
    const { root, services, run, out } = await fixture();
    await runMainCli(["run", "events", run.id], options(root, { "after-seq": "7" }), services);
    expect(run.events).toHaveBeenCalledWith({ afterSeq: 7, follow: false });
    expect(out.entries()[0].event.type).toBe("workflow.node.completed");
  });
  it("exports through the handle, not an implicit workspace checkout, and validates the destination first", async () => {
    const { root, services, run, out } = await fixture();
    const exportWorkspace = vi.fn(async (options) => ({ destination: options.destination, commit: "a".repeat(40), files: 1, bytes: 3 }));
    services.api.createMainResearchSdk = async () => ({ getRun: async () => ({ ...run, exportWorkspace }), close: async () => {} }) as never;
    await expect(runMainCli(["run", "export", run.id], options(root, { output: "relative" }), services)).rejects.toThrow(/absolute/);
    expect(exportWorkspace).not.toHaveBeenCalled();
    const destination = path.join(root, "delivery");
    expect(await runMainCli(["run", "export", run.id], options(root, { output: destination }), services)).toBe(0);
    expect(exportWorkspace).toHaveBeenCalledWith({ destination, signal: expect.any(AbortSignal) });
    expect(out.entries()[0].type).toBe("run.workspace.exported");
    expect(run.resume).not.toHaveBeenCalled(); expect(run.cancel).not.toHaveBeenCalled();
  });
  it("cancels only a workspace export on signal and never cancels the research run", async () => {
    const { root, services, signals, run, out } = await fixture();
    const exportWorkspace = vi.fn(async ({ signal }) => {
      signals.emit("SIGINT"); signal.throwIfAborted();
    });
    services.api.createMainResearchSdk = async () => ({ getRun: async () => ({ ...run, exportWorkspace }), close: async () => {} }) as never;
    expect(await runMainCli(["run", "export", run.id], options(root, { output: path.join(root, "delivery") }), services)).toBe(130);
    expect(out.entries()[0].type).toBe("run.workspace.export.cancelled");
    expect(run.cancel).not.toHaveBeenCalled(); expect(run.pause).not.toHaveBeenCalled();
    expect(signals.listenerCount("SIGINT") + signals.listenerCount("SIGTERM")).toBe(0);
  });
  it("protects initialization from signals, skips the requested command and closes before returning", async () => {
    const { root, services, signals, out, close } = await fixture();
    const list = vi.fn();
    services.api.createMainResearchSdk = async () => {
      signals.emit("SIGINT"); signals.emit("SIGTERM");
      await Promise.resolve();
      return { listRuns: list, close } as never;
    };
    expect(await runMainCli(["run", "list"], options(root), services)).toBe(130);
    expect(list).not.toHaveBeenCalled(); expect(close).toHaveBeenCalledOnce();
    expect(out.entries()).toEqual([{ type: "runtime.open.interrupted", engine: "main" }]);
    expect(signals.listenerCount("SIGINT") + signals.listenerCount("SIGTERM")).toBe(0);
  });
  it("removes signal guards even if host initialization fails", async () => {
    const { root, services, signals, close } = await fixture();
    services.api.createMainResearchSdk = async () => { throw new Error("Failed host fixture"); };
    await expect(runMainCli(["run", "list"], options(root), services)).rejects.toThrow("Failed host fixture");
    expect(close).not.toHaveBeenCalled();
    expect(signals.listenerCount("SIGINT") + signals.listenerCount("SIGTERM")).toBe(0);
  });
  it("latches a signal during resume and performs resumable Stop as soon as a handle is available", async () => {
    const { root, services, signals, run, out } = await fixture();
    run.resume.mockImplementationOnce(async () => { signals.emit("SIGTERM"); });
    expect(await runMainCli(["run", "resume", run.id], options(root), services)).toBe(130);
    expect(run.cancel).toHaveBeenCalledOnce();
    expect(out.entries().at(-1).result.phase).toBe("collaboration:user-cancelled");
  });
  it("passes cancellation and each stage straight through all Harness probes", async () => {
    const { root, services, signals, out } = await fixture();
    const test = vi.fn(async (_id, harness, model, options) => {
      options.onStage({ id: "text", status: "running", harness, model });
      await new Promise<void>((resolve) => {
        if (options.signal.aborted) resolve();
        else options.signal.addEventListener("abort", () => resolve(), { once: true });
      });
      return { status: "cancelled" };
    });
    services.api.createMainResearchSdk = async () => ({ gateways: { test }, close: async () => {} }) as never;
    const running = runMainCli(["gateway", "test", "fixture-id"], options(root, { harness: "all", model: "fixture" }), services);
    const probeIds = harnessCatalogRegistry.list().filter((item) => item.purposes.includes("probe")).map((item) => item.id);
    await vi.waitFor(() => expect(test).toHaveBeenCalledTimes(probeIds.length));
    expect(test.mock.calls.map((call) => call[1]).sort()).toEqual(probeIds.sort());
    expect(out.entries().filter((line) => line.type === "gateway.stage")).toHaveLength(probeIds.length);
    signals.emit("SIGINT");
    expect(await running).toBe(130);
    expect(out.entries().filter((line) => line.type === "gateway.test")).toHaveLength(probeIds.length);
    expect(signals.listenerCount("SIGINT") + signals.listenerCount("SIGTERM")).toBe(0);
  });
  it("explains recovery, credential and workspace boundaries in main-engine help", () => {
    expect(mainHelp).toMatch(/Usage: scievolve /);
    expect(mainHelp).toMatch(/NOT offline read-only/);
    expect(mainHelp).toMatch(/tokenEnv/); expect(mainHelp).toMatch(/--workspace/);
    expect(mainHelp).toMatch(/CREATE\/PUSH/); expect(mainHelp).toMatch(/resumable Stop/);
  });
});
