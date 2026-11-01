import { afterEach, describe, expect, it } from "vitest";
import { createServer, type Server } from "node:http";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { HermesAdapter } from "../src/host/hermes/hermes-adapter.js";
import { CommonProcessHost } from "../src/core/harness-runtime/process-host.js";
import { prepareAdapterRuntime } from "../src/core/harness-runtime/adapters/adapter-utils.js";
import type { HarnessAdapterContext, HarnessEvent, SessionRef } from "../src/core/harness-runtime/contracts.js";
import { openBuiltinResidentAdapter } from "../src/core/harness-runtime/adapters/resident-adapter-factory.js";
import { compileFilesystemAuthority } from "../src/core/harness-runtime/filesystem-authority.js";
import { OfficialEventBridge } from "../src/core/harness-runtime/official-event-bridge.js";
import { hermesOfficialEventMapper } from "../src/host/hermes/hermes-acp.js";
import { createSdkHarnessRuntime } from "../src/host/harness-adapters.js";

// Opt-in real installed Hermes + local deterministic model transport. No paid API,
// personal Hermes profile, GitHub writes or test-double Harness implementation.
const binary = process.env.SCIENCEEVOLVE_HERMES_ACCEPTANCE_BIN;
const roots: string[] = [], servers: Server[] = [];
afterEach(async () => {
  await Promise.all(servers.splice(0).map(server => new Promise<void>(resolve => { server.closeAllConnections(); server.close(() => resolve()); })));
  await Promise.all(roots.splice(0).map(root => fs.rm(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })));
});

describe.skipIf(!binary)("real installed Hermes ACP (local deterministic provider, not model-quality acceptance)", () => {
  it.each(["yolo", "workspace", "resident", "probe"] as const)("uses the common ProcessHost, real tools and native resume (%s)", async mode => {
    const permission = mode === "workspace" ? "workspace" : "yolo";
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "sdk-hermes-native-")); roots.push(root);
    const workspace = path.join(root, "workspace"), project = path.join(root, "project");
    await fs.mkdir(workspace); await fs.mkdir(project);
    await fs.writeFile(path.join(workspace, "sentinel.txt"), "hermes-native-sentinel");
    const adapter = new HermesAdapter({ harnessExecutables: { hermes: binary }, residentModelInactivityTimeoutMs: 30_000 });
    const events: HarnessEvent[] = [], requests: any[] = [], diagnostics: string[] = [];
    async function provider() {
      const server = createServer(async (req, res) => {
        if (req.method === "GET") { res.setHeader("content-type", "application/json"); res.end(JSON.stringify({ object: "list", data: [{ id: "sdk-hermes-fixture", object: "model" }] })); return; }
        let body = ""; for await (const chunk of req) body += chunk;
        const input = JSON.parse(body); requests.push(input);
        const tools = input.tools ?? [];
        const read = tools.find((tool: any) => mode === "probe" ? tool.function?.name.endsWith("__scienceevolve_read_smoke_sentinel")
          : permission === "yolo" ? tool.function?.name === "read_file" : tool.function?.name === "mcp__openfars_filesystem_authority__read_file");
        const combinedPrompt = JSON.stringify(input.messages);
        const rootId = /Current workspace: rootId=\\"([^\\]+)\\"/.exec(combinedPrompt)?.[1];
        const hasResult = input.messages?.some((message: any) => message.role === "tool");
        const call = !hasResult && read ? { index: 0, id: "fixture-read", type: "function", function: { name: read.function.name,
          arguments: JSON.stringify(mode === "probe" ? {} : permission === "yolo" ? { path: path.join(workspace, "sentinel.txt") } : { rootId, path: "sentinel.txt" }) } } : undefined;
        const receipt = mode === "probe" ? JSON.stringify(input.messages?.filter((message: any) => message.role === "tool")) : "Verified hermes-native-sentinel.";
        const message = call ? { role: "assistant", content: null, tool_calls: [call] } : { role: "assistant", content: receipt };
        if (input.stream) {
          res.setHeader("content-type", "text/event-stream");
          const chunk = (delta: unknown, finish_reason: string | null = null) => `data: ${JSON.stringify({ id: "fixture", object: "chat.completion.chunk", created: 1, model: "sdk-hermes-fixture", choices: [{ index: 0, delta, finish_reason }] })}\n\n`;
          res.end(chunk(message) + chunk({}, call ? "tool_calls" : "stop") + "data: [DONE]\n\n");
        } else {
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ id: "fixture", object: "chat.completion", created: 1, model: "sdk-hermes-fixture", choices: [{ index: 0, message, finish_reason: call ? "tool_calls" : "stop" }], usage: { prompt_tokens: 20, completion_tokens: 8, total_tokens: 28 } }));
        }
      });
      servers.push(server);
      await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
      return `http://127.0.0.1:${(server.address() as { port: number }).port}/v1`;
    }
    if (mode === "probe") {
      const fixtureUrl = await provider();
      // Trusted internal test hook only: production still requires its normal HTTPS
      // gateway validation. Allow exactly this ephemeral deterministic local server.
      const facade = createSdkHarnessRuntime({ harnessExecutables: { hermes: binary }, residentModelInactivityTimeoutMs: 30_000,
        validateGatewayTarget: async url => { expect(url).toBe(fixtureUrl); } });
      const result = await facade.runSmoke({ harness: "hermes", model: "sdk-hermes-fixture", gateway: {
        id: "fixture", name: "fixture", url: fixtureUrl, apiKey: "fixture-only", models: ["sdk-hermes-fixture"],
        defaultModel: "sdk-hermes-fixture", protocol: "chat-completions", revision: 1,
        test: { status: "untested" }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
      } }, AbortSignal.timeout(90_000));
      expect(result.cacheKey).toBeTruthy();
      const names = requests.flatMap(request => request.tools ?? []).map((tool: any) => tool.function?.name);
      expect(names.some(name => name.endsWith("__scienceevolve_read_smoke_sentinel"))).toBe(true);
      // Reuse the SDK's existing temporary workspace MCP, which also advertises
      // its append tool; do not add native shell, filesystem or delegation tools.
      expect([...new Set(names)].sort()).toEqual([
        "mcp__scienceevolve_workspace__scienceevolve_append_file", "mcp__scienceevolve_workspace__scienceevolve_read_smoke_sentinel"
      ]);
      return;
    }
    let native: SessionRef | undefined;
    async function run(baseUrl: string, number: number) {
      const runtimePath = path.join(project, `turn-${number}`); await fs.mkdir(runtimePath);
      const inboxPath = path.join(workspace, "inbox.md"), memoryPath = path.join(workspace, "memory.md");
      await fs.writeFile(inboxPath, "Read sentinel.txt with the read_file tool; report its contents.");
      await fs.writeFile(memoryPath, "");
      const inputs = { projectPath: project, workspacePath: workspace, runtimePath, inboxPath, memoryPath, inboxSha256: "fixture" };
      const gateway = { id: "fixture", name: "fixture", url: baseUrl, apiKey: "fixture-only", models: ["sdk-hermes-fixture"], defaultModel: "sdk-hermes-fixture", protocol: "chat-completions" };
      const config = { harness: "hermes", model: "sdk-hermes-fixture", gatewaySnapshot: gateway,
        skills: [], autoSkills: [], mcpServers: [], webSearch: false, proxy: { mode: "inherit" }, permission };
      const request: any = { project: { id: "fixture", agents: { execution: config } }, agent: "execution", kind: "worker",
        permission, projectPath: project, workspacePath: workspace, runtimePath, inboxPath, invocationId: `turn-${number}`, purpose: "workflow" };
      let current = native ? { ...native, resumedAt: new Date().toISOString() } : adapter.createSession(request, inputs, 0, true);
      const signal = new AbortController().signal;
      const route = { baseUrl, token: "fixture-only" };
      let attemptsStarted = 0;
      const budget: any = { maxAttempts: 1, get attemptsStarted() { return attemptsStarted; }, startAttempt() { return { attempt: ++attemptsStarted, evidence: { kind: "test" } }; } };
      const context: HarnessAdapterContext = {
        request, signal, route: route as any, recoveryBudget: budget,
        spec: { purpose: "workflow", invocationId: request.invocationId, model: config.model, session: current,
          prompt: await fs.readFile(inboxPath, "utf8"), inputs,
          policy: { permission, constraintPrompt: "", skillPaths: [], autoSkillPaths: [], mcpServers: [], webSearch: false } } as any,
        onSessionStarted: async session => { current = native = session; },
        onEvent: event => { events.push(event); }, onTrace: (_kind, message) => { diagnostics.push(message); },
        processHost: new CommonProcessHost().forInvocation({ invocationId: request.invocationId, harnessId: "hermes",
          runtimePath, workspacePath: workspace, signal, session: () => current, route: route as any, recoveryBudget: budget })
      };
      const prepared = await prepareAdapterRuntime(context, adapter.descriptor, {}, {}, { OPENAI_API_KEY: route.token, OPENAI_BASE_URL: baseUrl });
      context.processHost = new CommonProcessHost().forInvocation({ invocationId: request.invocationId, harnessId: "hermes",
        runtimePath, workspacePath: workspace, signal, session: () => current, route: route as any, recoveryBudget: budget,
        commonEnvironment: prepared.environment, authorityEnvironment: prepared.environment as Record<string, string>, hostHome: os.homedir() });
      try {
        if (mode !== "resident") return await adapter.run(context);
        request.executionContext = { role: "delivery", executionId: "exec-hermes", ownershipEpoch: 1, executionWorktree: workspace };
        const authority = await compileFilesystemAuthority({ permission, role: "delivery", gitEnabled: false,
          serviceUserRoot: os.homedir(), executionWorktree: workspace, ownedMemoryPath: memoryPath, protectedRoots: [runtimePath] });
        const common: Record<string, string> = { ...prepared.environment } as Record<string, string>;
        delete common.SCIENCEEVOLVE_INVOCATION_ID; delete common.SCIENCEEVOLVE_CONTROL_CONTEXT; delete common.SCIENCEEVOLVE_CONTROL_CAPABILITY;
        Object.assign(common, { SCIENCEEVOLVE_EXECUTION_ID: "exec-hermes", SCIENCEEVOLVE_OWNERSHIP_EPOCH: "1",
          SCIENCEEVOLVE_RESIDENT_SCOPE_ID: "exec-hermes", SCIENCEEVOLVE_RESIDENT_ROLE: "delivery", HOME: os.homedir() });
        const bridge = new OfficialEventBridge({ descriptor: adapter.descriptor, invocationId: request.invocationId,
          mapEvent: hermesOfficialEventMapper(), onEvent: event => { events.push(event); } });
        const releases: string[] = [];
        const opened = await openBuiltinResidentAdapter({ adapter, executable: binary!, request, spec: context.spec,
          session: current, launchRoute: route as any, filesystemAuthority: authority, mcpRows: [],
          executionRuntimePath: runtimePath, signal, onTrace: context.onTrace, onFrame: frame => bridge.accept(frame),
          turnAuthority: { activate: async turn => ({ inputId: turn.inputId, invocationId: turn.invocationId, ownershipEpoch: 1,
            release: outcome => { releases.push(outcome); } }) },
          processHost: new CommonProcessHost(), processBinding: { scopeId: "exec-hermes", role: "delivery", harnessId: "hermes",
            runtimePath, workspacePath: workspace, signal, recoveryBudget: budget, session: () => current, route: route as any,
            commonEnvironment: common, authorityEnvironment: common, hostHome: os.homedir() } });
        const driver = opened.driver;
        current = native = driver.session;
        try {
          const turn = { inputId: request.invocationId, invocationId: request.invocationId, prompt: context.spec.prompt,
            route: { ...route, token: "turn-one" } as any };
          const result = await driver.submit(turn);
          await expect(driver.submit(turn)).rejects.toThrow(/duplicate input/);
          await driver.pause(); expect((await driver.probe()).stopped).toBe(true);
          await driver.resume(); expect((await driver.probe()).stopped).toBe(false);
          const next = await driver.submit({ ...turn, inputId: `${turn.inputId}-next`, invocationId: `${turn.invocationId}-next`, route: { ...route, token: "turn-two" } as any });
          expect(next.threadId).toBe(result.threadId);
          expect(releases).toEqual(["completed", "completed"]);
          return next;
        } finally {
          try { await driver.close(); } finally { await driver.forceClose(); }
        }
      }
      catch (error) { throw new Error(`${String(error)}\n${diagnostics.join("").slice(-6000)}`, { cause: error }); }
    }
    const first = await run(await provider(), 1);
    expect(first.handoff).toContain("hermes-native-sentinel");
    const originalId = first.threadId;
    expect(events.some(event => event.kind === "tool.started")).toBe(true);
    expect(events.some(event => event.kind === "tool.completed" && event.tool?.outputPreview?.includes("hermes-native-sentinel"))).toBe(true);
    if (permission === "workspace") expect(requests.flatMap(request => request.tools ?? []).some((tool: any) => ["terminal", "write_file", "read_file", "delegate_task"].includes(tool.function?.name))).toBe(false);
    const requestCount = requests.length, eventCount = events.length;
    const second = await run(await provider(), 2);
    expect(second.threadId).toBe(originalId);
    expect(requests.length).toBeGreaterThan(requestCount);
    expect(events.slice(eventCount).some(event => event.kind === "tool.started")).toBe(false);
    expect(requests.slice(requestCount).some(request => request.messages?.some((message: any) => message.role === "tool")),
      JSON.stringify(requests.slice(requestCount).map(request => ({ model: request.model, roles: request.messages?.map((message: any) => message.role) })))).toBe(true);
    // Title generation is a separate, tools-free request and must not survive
    // the native completion receipt while SDK turn authority is being released.
    expect(requests.every(request => (request.tools?.length ?? 0) > 0)).toBe(true);
  }, 180_000);
});
