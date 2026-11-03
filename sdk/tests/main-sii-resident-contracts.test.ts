import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SiiExperimentService } from "../src/core/sii-experiments.js";
import { HarnessRuntimeResidentAdapter } from "../src/core/harness-runtime/resident-runtime-adapter.js";
import { CodexRunner } from "../src/core/codex-runner.js";
import { CodexAdapter } from "../src/core/harness-runtime/adapters/codex-adapter.js";
import { openBuiltinResidentAdapter } from "../src/core/harness-runtime/adapters/resident-adapter-factory.js";
import { parse } from "smol-toml";
import { ContextIndexOrganizer } from "../src/core/context-index-organizer.js";

const roots: string[] = [];
afterEach(async () => { await Promise.all(roots.splice(0).map(root => fs.rm(root, { recursive: true, force: true, maxRetries: 8, retryDelay: 100 }))); });
async function fixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "sdk-sii-resident-")); roots.push(root);
  const id = "prj_cccccccccccccccccccccccccccccccc", projectPath = path.join(root, id);
  const workspacePath = path.join(projectPath, "workspace"), runtimePath = path.join(projectPath, "runtime");
  await fs.mkdir(workspacePath, { recursive: true }); await fs.mkdir(runtimePath);
  await fs.writeFile(path.join(workspacePath, "Memory.md"), "Retained scientific memory.");
  const inboxPath = path.join(projectPath, "inbox.md"); await fs.writeFile(inboxPath, "Validate experiment.");
  const session = { schemaVersion: 1, harnessId: "codex", adapterVersion: "fixture", nativeId: "native-sii-session", generation: 3, durable: true, createdAt: new Date().toISOString() };
  const request: any = { project: { id, orchestration: { schemaVersion: 2 }, agents: { writer: {
    harness: "codex", model: "fixture-model", instructions: "", skills: [], autoSkills: [], mcpServers: [], webSearch: false,
    permission: "compute", experimentMcp: true, sessionPersistence: true, proxy: { mode: "inherit" }
  } } }, agent: "writer", kind: "worker", permission: "compute", invocationId: "inv_sii",
    taskSessionId: "task-sii", projectPath, workspacePath, runtimePath, inboxPath, schemaPath: "",
    skillPaths: [], autoSkillPaths: [], availableSkillPaths: [],
    executionContext: { role: "delivery", executionId: "exec-sii", ownershipEpoch: 1, nodeRunId: "node-sii", executionWorktree: workspacePath } };
  return { root, request, session };
}

describe("SII resident lifecycle with simulated process boundary", () => {
  it.each(["complete", "cancel"] as const)("keeps an unfinished submit owned across pause, then %s, preserving native identity", async outcome => {
    const f = await fixture();
    let status = "job_running";
    const service = new SiiExperimentService({ projectsRoot: f.root, workspaceRoot: f.root, knowledgeRoot: f.root,
      inspireBin: "unused", refreshMs: 3_600_000, accountReader: async () => "fixture",
      runJson: async args => ({ success: true, data: args.includes("create") ? { sub_code: 0 } : { job: { status } } }) });
    await service.start(); await service.refreshNow();
    let broker: any, binding: any, nativeRequest: any;
    const lease: any = { executionId: "exec-sii", harnessId: "codex", ownershipEpoch: 1,
      acknowledgedControlSeq: 0, pid: 12345, startTicks: "fixture", state: "waiting", session: f.session };
    const scopes: string[] = [], turns: any[] = [];
    const native: any = {
      nativeProtocol: () => "responses",
      prepareAgentContext: async (_request: unknown, inputs: unknown) => inputs,
      contextIndexes: new ContextIndexOrganizer(),
      openSiiBinding: async (request: any, signal: AbortSignal) => { binding = await service.bind(request, signal); return binding; },
      prepareResidentScope: async (input: any) => {
        broker = input.turnAuthority;
        return { spec: { inputs: { ...f.request, memoryPath: path.join(f.request.workspacePath, "Memory.md") },
          policy: { constraintPrompt: "", skillPaths: [], autoSkillPaths: [], mcpServers: [] } },
          filesystemAuthority: { rootBindings: [] } };
      },
      openResidentScope: async () => ({ lease }),
      createResidentTurnFrameSink: (request: any, scope: string) => { nativeRequest = request; scopes.push(scope); return { accept: async () => {}, drain: async () => {} }; },
      submitResidentTurn: async (_authority: any, turn: any) => {
        turns.push(turn);
        const authority = await broker.activate(turn);
        try {
          if (turns.length === 1) {
            const submission: any = await binding.call("sii_submit_experiment", { request_id: "resident-run",
              args: ["job", "create", "--name", "resident-run", "--workspace", "space", "--project", "具有能动性的科学大模型"] });
            await binding.call("sii_defer_task", { experiment_ids: [submission.experiment.id], context: "Validate retained experiment metrics." });
          } else {
            expect(await binding.call("sii_get_task_context", { field: "context" }))
              .toMatchObject({ content: "Validate retained experiment metrics.", nextPage: null });
          }
          await nativeRequest.onNativeUserInput?.({ eventId: `native-input:${turns.length}`, invocationId: turn.invocationId,
            harnessId: f.session.harnessId, kind: "user.message", phase: "completed", message: turn.prompt });
          return { result: { handoff: turns.length === 1 ? "Pending handoff" : "Validated final result" } };
        } finally { await authority.release("completed"); }
      },
      probeResident: async () => structuredClone(lease),
      pauseResident: async () => { lease.state = "paused"; },
      waitResident: async () => structuredClone(lease),
      resumeResident: async () => { lease.state = "waiting"; },
      closeResident: async () => { lease.state = "closed"; }
    };
    const adapter = new HarnessRuntimeResidentAdapter({ runtime: native,
      routeFactory: async () => ({ baseUrl: "http://127.0.0.1:43199/v1", token: "fixture-route", close: async () => {} }) });
    const handle = await adapter.open({ request: f.request, executionRuntimePath: f.request.runtimePath,
      filesystemAuthorityInput: {} as any, signal: new AbortController().signal, onTrace: () => {} });
    let settled = false;
    const logical = handle.submit({ inputId: "input-sii", invocationId: "inv_sii", prompt: "Run experiment." })
      .then(value => { settled = true; return value; });
    let logicalError: unknown;
    void logical.catch(error => { logicalError = error; });
    try {
      await vi.waitFor(async () => {
        expect(logicalError).toBeUndefined();
        expect((await service.document(f.request.projectPath)).waits[0]?.handoff).toBe("Pending handoff");
      }, { timeout: 10_000 });
      expect(settled).toBe(false); expect(turns).toHaveLength(1);
      await expect(binding.assertTaskComplete()).rejects.toThrow("still needs experiment results");
      await expect(handle.submit({ inputId: "overlap", invocationId: "inv_sii", prompt: "Overlap" })).rejects.toThrow("unfinished native task");
      await handle.pause();
      if (outcome === "cancel") {
        await handle.close();
        await expect(logical).rejects.toThrow();
        expect(turns).toHaveLength(1);
        expect((await service.document(f.request.projectPath)).waits).toHaveLength(1);
        return;
      }
      status = "job_succeeded";
      await service.mutate(f.request.projectPath, doc => { doc.experiments[0]!.nextCheckAt = 0; }); await service.refreshNow();
      await vi.waitFor(async () => expect((await service.document(f.request.projectPath)).waits[0]?.status).toBe("ready"), { timeout: 10_000 });
      expect(turns).toHaveLength(1); expect(settled).toBe(false);
      await handle.resume();
      expect((await logical).handoff).toBe("Validated final result");
      expect(turns.map(turn => turn.inputId)).toEqual(["input-sii", "input-sii:sii:1"]);
      expect(scopes).toEqual(["input-sii", "input-sii:sii:1"]);
      expect(turns[1].prompt).toContain("sii_get_task_context");
      expect(turns[1].prompt).not.toContain("Validate retained experiment metrics.");
      expect(turns[1].prompt).toContain('"status":"succeeded"');
      expect(handle.initialLease.session).toEqual(f.session);
      expect((await service.document(f.request.projectPath)).experiments[0]!.session).toEqual(f.session);
      expect((await service.document(f.request.projectPath)).waits).toEqual([]);
    } finally { await handle.close(); await service.stop(); await logical.catch(() => {}); }
  });
});

describe("SII Codex MCP approval at captured launch boundaries", () => {
  it.each([true, false])("resident launcher trusts only the injected URL (match=%s)", async trusted => {
    const f = await fixture(), url = "http://127.0.0.1:49111/sii/trusted";
    f.request.permission = "yolo";
    f.request.siiMcp = { url: trusted ? url : url + "-other" };
    const signal = new AbortController().signal;
    const launchRoute = { nativeCodexProfileHome: f.root, authorityId: "fixture-profile" };
    const startResident = vi.fn(() => { throw new Error("Captured resident launch"); });
    const launch: any = { adapter: new CodexAdapter(), executable: process.execPath,
      request: f.request, session: f.session, launchRoute, signal, executionRuntimePath: f.request.runtimePath,
      spec: { model: "fixture-model", inputs: { workspacePath: f.request.workspacePath, projectPath: f.request.projectPath },
        policy: { skillPaths: [], autoSkillPaths: [], mcpServers: [{ name: "scienceevolve-sii", url }], webSearch: false } },
      mcpRows: [{ name: "scienceevolve-sii", namespace: "scienceevolve-sii", transport: "streamable-http", url },
        { name: "untrusted-external", namespace: "untrusted-external", transport: "streamable-http", url }],
      filesystemAuthority: { rawTools: "native", gitCapability: "none", serviceUserRoot: f.root },
      processBinding: { scopeId: "exec-sii", role: "delivery", route: launchRoute, workspacePath: f.request.workspacePath,
        session: () => f.session, signal, authorityEnvironment: { SCIENCEEVOLVE_RESIDENT_SCOPE_ID: "exec-sii",
          SCIENCEEVOLVE_RESIDENT_ROLE: "delivery", SCIENCEEVOLVE_EXECUTION_ID: "exec-sii", SCIENCEEVOLVE_OWNERSHIP_EPOCH: "1" } },
      processHost: { startResident }, onTrace: () => {} };
    await expect(openBuiltinResidentAdapter(launch)).rejects.toThrow("Captured resident launch");
    const plan: any = startResident.mock.calls[0]![1];
    const config = parse(plan.args.find((arg: string) => arg.startsWith("mcp_servers="))) as any;
    expect(config.mcp_servers["scienceevolve-sii"].default_tools_approval_mode).toBe(trusted ? "approve" : undefined);
    // yolo authorizes external MCP capabilities; SII still requires its exact injected URL.
    expect(config.mcp_servers["untrusted-external"].default_tools_approval_mode).toBe("approve");
  });

  it.each([true, false])("ordinary runner trusts only the injected URL (match=%s)", async trusted => {
    const f = await fixture(), url = "http://127.0.0.1:49111/sii/trusted";
    f.request.permission = "workspace"; f.request.purpose = "probe"; delete f.request.executionContext;
    f.request.project.agents.writer.mcpServers = [{ name: "scienceevolve-sii", url }];
    f.request.project.agents.writer.gatewaySnapshot = { id: "fixture", name: "fixture", url: "http://127.0.0.1:43199/v1",
      apiKey: "fixture", protocol: "responses", models: ["fixture-model"] };
    f.request.siiMcp = { url: trusted ? url : url + "-other" };
    const executable = path.join(f.root, "catalog.mjs");
    await fs.writeFile(executable, 'console.log(JSON.stringify({models:[{slug:"fixture-model",use_responses_lite:false,tool_mode:null}]}));');
    const startRaw = vi.fn(() => { throw new Error("Captured launch"); });
    const runner = new CodexRunner(executable, { harnessId: "codex", skillsAlreadyStaged: true }, { startRaw } as any, f.session as any);
    await expect(runner.run(f.request, () => {}, new AbortController().signal)).rejects.toThrow("Captured launch");
    const plan: any = startRaw.mock.calls[0]![0];
    const config = parse(plan.args.find((arg: string) => arg.startsWith("mcp_servers="))) as any;
    expect(config.mcp_servers["scienceevolve-sii"].default_tools_approval_mode).toBe(trusted ? "approve" : undefined);
  });
});
