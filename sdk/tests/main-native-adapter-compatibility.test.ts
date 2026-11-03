import { afterEach, describe, expect, it, vi } from "vitest";
import { promises as fs } from "node:fs";
import { zstdCompressSync } from "node:zlib";
import os from "node:os";
import path from "node:path";
import { parse } from "yaml";
import { prepareCodexGatewayModelCatalog } from "../src/core/codex-gateway-model-catalog.js";
import { CodexRunner } from "../src/core/codex-runner.js";
import { DshAdapter, dshSessionArtifactPath, resolveDshSessionArtifactPath, assertDshSessionArtifact } from "../src/core/harness-runtime/adapters/dsh-adapter.js";
import type { HarnessAdapterContext } from "../src/core/harness-runtime/contracts.js";
import type { InvocationProcessHost } from "../src/core/harness-runtime/process-host.js";

const roots: string[] = [];
afterEach(async () => { await Promise.all(roots.splice(0).map(root => fs.rm(root, { recursive: true, force: true, maxRetries: 8, retryDelay: 100 }))); });
async function directory() { const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-native-contract-")); roots.push(root); return root; }

describe("installed CLI format regression contracts (scripted native boundary, not model acceptance)", () => {
  it("allows Codex's external workspace only through the trusted host registry", async () => {
    const root = await directory(), project = path.join(root, "fixture"), workspace = path.join(root, "caller-project");
    await fs.mkdir(project); await fs.mkdir(workspace);
    const executable = path.join(root, "catalog.mjs");
    await fs.writeFile(executable, 'process.stdout.write(JSON.stringify({models:[{slug:"ordinary",use_responses_lite:false,tool_mode:null}]}));');
    const start = vi.fn(() => { throw new Error("Captured Codex launch"); });
    const input = {
      purpose: "probe", project: { id: "fixture", agents: { probe: {
        model: "ordinary", harness: "codex", permission: "workspace", proxy: { mode: "inherit" }, skills: [], autoSkills: [], mcpServers: [], webSearch: false, sessionPersistence: false,
        gatewaySnapshot: { id: "fixture", name: "fixture", url: "http://127.0.0.1:12345/v1", apiKey: "fixture-only", protocol: "responses", models: ["ordinary"] }
      } } }, agent: "probe", kind: "worker", permission: "workspace", projectPath: project, workspacePath: workspace,
      runtimePath: path.join(project, "runtime"), inboxPath: path.join(workspace, "inbox.md"), invocationId: "fixture-turn", skillPaths: [], autoSkillPaths: [], availableSkillPaths: []
    } as unknown as Parameters<CodexRunner["run"]>[0];
    await fs.writeFile(input.inboxPath, "Read the sentinel");
    const session = { nativeId: "fixture", durable: false, generation: 0, harnessId: "codex", adapterVersion: "fixture", schemaVersion: 1, createdAt: new Date().toISOString() } as const;
    const processHost = { startRaw: start } as unknown as InvocationProcessHost;
    const unbound = new CodexRunner(executable, { harnessId: "codex", skillsAlreadyStaged: true }, processHost, session);
    await expect(unbound.run(input, () => {}, new AbortController().signal)).rejects.toThrow(/inside the current project/);
    expect(start).not.toHaveBeenCalled();
    const bound = new CodexRunner(executable, { harnessId: "codex", skillsAlreadyStaged: true,
      resolveProjectWorkspace: async () => fs.realpath(workspace) }, processHost, session);
    await expect(bound.run(input, () => {}, new AbortController().signal)).rejects.toThrow("Captured Codex launch");
    expect(start).toHaveBeenCalledOnce();
    await expect(bound.run({ ...input, workspacePath: project }, () => {}, new AbortController().signal)).rejects.toThrow(/trusted host binding/);
    expect(start).toHaveBeenCalledOnce();
  });
  it.each(["gpt-6-luna", "company-model", "gpt-5.6-sol"])("preserves %s and enables the ordinary gateway tool loop", async model => {
    const root = await directory(), executable = path.join(root, "catalog.mjs");
    const catalog = { models: [
      { slug: "gpt-5.6-sol", use_responses_lite: true, tool_mode: "code_mode_only", extra_metadata: "preserved" },
      { slug: "ordinary", use_responses_lite: false, tool_mode: null, context_window: 256000 }
    ] };
    const fixtureSource = `process.stdout.write(${JSON.stringify(JSON.stringify(catalog))});`;
    await fs.writeFile(executable, fixtureSource);
    const file = await prepareCodexGatewayModelCatalog(executable, model, root);
    const selected = JSON.parse(await fs.readFile(file!, "utf8")).models[0];
    expect(selected).toMatchObject({ slug: model, use_responses_lite: false, tool_mode: null });
    if (model === "gpt-5.6-sol") expect(selected.extra_metadata).toBe("preserved");
    else expect(selected).toMatchObject({ display_name: model, supported_reasoning_levels: [], input_modalities: ["text"] });
    expect(await fs.readFile(executable, "utf8")).toBe(fixtureSource);
    expect(await prepareCodexGatewayModelCatalog(executable, "ordinary", root)).toBeUndefined();
  });

  it("mounts DSH's private provider patch before the invocation MCP patch, without embedding credentials", async () => {
    const root = await directory(), workspace = path.join(root, "workspace"), runtime = path.join(root, "turn");
    await fs.mkdir(workspace); await fs.mkdir(runtime);
    const start = vi.fn(() => { throw new Error("Captured launch boundary"); });
    const adapter = new DshAdapter({ harnessExecutables: { dsh: process.execPath } });
    const context = {
      request: { project: { id: "fixture", agents: { probe: {
        model: "selected-model", harness: "dsh", permission: "workspace", proxy: { mode: "inherit" }, skills: [], autoSkills: [], mcpServers: [],
        gatewaySnapshot: { id: "fixture", name: "fixture", url: "https://upstream.example/v1", apiKey: "upstream-private-key", protocol: "chat-completions", models: ["selected-model"], modelContextWindows: { "selected-model": 123456 } }
      } } }, projectPath: root, runtimePath: runtime, workspacePath: workspace, agent: "probe", kind: "worker", permission: "workspace", invocationId: "fixture-turn" },
      spec: { purpose: "probe", model: "selected-model", prompt: "Read sentinel", policy: { webSearch: false, permission: "workspace", skillPaths: [], autoSkillPaths: [], mcpServers: [] },
        inputs: { projectPath: root, runtimePath: runtime, workspacePath: workspace, inboxPath: path.join(root, "inbox.md"), memoryPath: path.join(workspace, "Memory.md") },
        session: { nativeId: "fixture-session", generation: 0, durable: false } },
      route: { baseUrl: "http://127.0.0.1:12345/v1", token: "invocation-private-token" },
      processHost: { start }, signal: new AbortController().signal, onEvent: () => {}, onTrace: () => {}
    } as unknown as HarnessAdapterContext;
    await expect(adapter.run(context)).rejects.toThrow("Captured launch boundary");
    expect(start).toHaveBeenCalledOnce();
    const launch = start.mock.calls[0][0] as unknown as { args: string[]; env: NodeJS.ProcessEnv };
    const args = launch.args;
    const patches = args.flatMap((value, i) => value === "--patch" ? [args[i + 1]] : []);
    expect(patches).toEqual([path.join(launch.env.DSH_HOME!, "gateway.patch.yml"), path.join(runtime, "dsh-openfars.patch.yml")]);
    expect(launch.env.DSH_PERMISSION_MODE).toBe("danger-full-access");
    const text = await fs.readFile(patches[0], "utf8");
    expect(text).not.toContain("upstream-private-key"); expect(text).not.toContain("invocation-private-token");
    const rows = parse(text);
    expect(rows[0]).toMatchObject({ id: "llm-pi-ai", config: { providers: { openfars: {
      apiKeyEnv: "SCIENCEEVOLVE_GATEWAY_API_KEY", baseURL: "http://127.0.0.1:12345/v1", api: "openai-completions",
      models: [{ id: "selected-model", contextWindow: 123456 }]
    } } } });
    expect(rows[1]).toMatchObject({ id: "agent-default-model", config: { provider: "openfars", model: "selected-model" } });
    context.spec.policy.permission = "yolo";
    context.request.permission = "yolo";
    await expect(adapter.run(context)).rejects.toThrow("Captured launch boundary");
    expect((start.mock.calls[1][0] as unknown as { env: NodeJS.ProcessEnv }).env.DSH_PERMISSION_MODE).toBe("danger-full-access");
  });

  it("selects the newest canonical DSH generation, validates its identity and retains v0 support", async () => {
    const root = await directory(), workspace = path.join(root, "workspace"), legacy = dshSessionArtifactPath(root, workspace, "native-session");
    await fs.mkdir(path.dirname(legacy), { recursive: true });
    const header = (version: number, id = "native-session") => zstdCompressSync(Buffer.from(JSON.stringify({ type: "session", version, id, createdAt: 1, cwd: workspace }) + "\n"));
    await fs.writeFile(legacy, header(0));
    expect(await resolveDshSessionArtifactPath(legacy)).toBe(legacy);
    await assertDshSessionArtifact({ artifactPath: legacy, sessionRoot: path.join(root, "sessions"), expectedSessionId: "native-session", expectedWorkspacePath: workspace });
    await fs.writeFile(path.join(path.dirname(legacy), "session.v04.jsonl.zstd"), "noncanonical");
    await fs.writeFile(path.join(path.dirname(legacy), "session.v2.jsonl.zstd"), header(2));
    const current = path.join(path.dirname(legacy), "session.v4.jsonl.zstd");
    await fs.writeFile(current, header(4));
    expect(await resolveDshSessionArtifactPath(legacy)).toBe(current);
    const expectation = { artifactPath: current, sessionRoot: path.join(root, "sessions"), expectedSessionId: "native-session", expectedWorkspacePath: workspace };
    await assertDshSessionArtifact(expectation);
    await fs.writeFile(current, header(3));
    await expect(assertDshSessionArtifact(expectation)).rejects.toThrow(/generation header/);
    await fs.writeFile(current, header(4, "other-session"));
    await expect(assertDshSessionArtifact(expectation)).rejects.toThrow(/different session/);
  });
});
