import { afterEach, describe, expect, it, vi } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { createMainResearchSdk, createMainSdkClient, type MainResearchSdk } from "../src/main-client.js";
import { createMainApplicationRuntime, type MainApplicationRuntime } from "../src/main-runtime.js";
import { validateMainWorkflowConfig } from "../src/main-config.js";
import { mainRedactor } from "../src/main-redaction.js";
import type { AgentRunner, AgentRunRequest, AgentRunResult } from "../src/core/types.js";
import { harnessCatalogRegistry, toPublicHarnessDescriptor } from "../src/core/harness-runtime/registry.js";
import type { GatewayStoreOptions } from "../src/core/agent-runtime.js";

const roots: string[] = [];
const sdks: MainResearchSdk[] = [];
const runtimes: MainApplicationRuntime[] = [];
afterEach(async () => {
  await Promise.all(sdks.splice(0).map((sdk) => sdk.close()));
  await Promise.all(runtimes.splice(0).map((runtime) => runtime.close()));
  vi.restoreAllMocks();
  await Promise.all(roots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true, maxRetries: 8, retryDelay: 100 })));
});
async function directory() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-main-client-")); roots.push(root); return root;
}
function mainOnly(git = false) {
  return validateMainWorkflowConfig({ git: { enabled: git }, agents: { main: { model: "fixture", skills: [], autoSkills: [] } },
    orchestration: { schemaVersion: 2, collaborations: [], agents: [{ name: "main", template: "main" }],
      input: { source: "input", target: "main" }, routes: { main: [] }, decisionPlans: {},
      termination: { agent: "main", condition: "Fixture complete", decisionBy: "main", automatic: false },
      resultFormat: { presets: [], custom: "" } } });
}
async function fixture(run?: AgentRunner["run"], gatewayOptions: GatewayStoreOptions = { autoReasoning: false }) {
  const root = await directory();
  const runner: AgentRunner = {
    harnessCatalog: async () => harnessCatalogRegistry.list().map((descriptor) => toPublicHarnessDescriptor(descriptor, { available: true })),
    run: run ?? (async (request: AgentRunRequest): Promise<AgentRunResult> => ({ handoff: "fixture completion", controlActions: [{
      projectId: request.project.id, agent: request.agent, invocationId: request.invocationId,
      callId: `${request.invocationId}-complete`, stateVersion: request.control!.stateVersion,
      capabilityHash: request.control!.capabilityHash, receivedAt: new Date().toISOString(),
      action: { tool: "complete_project", rationale: "Fixture acceptance satisfied" }
    }] }))
  };
  const runtime = await createMainApplicationRuntime({ dataDir: root, skillRoots: [], gatewayOptions, internal: {
    runner, residentLauncher: { open: async () => { throw new Error("Git-off must not open resident"); } }
  } });
  runtimes.push(runtime);
  const sdk = await createMainSdkClient(runtime); sdks.push(sdk);
  const gateway = await sdk.gateways.add({ name: "fixture", url: "https://93.184.216.34/v1", apiKey: "opaque-fixture-key",
    models: ["fixture"], defaultModel: "fixture", protocol: "responses" });
  return { sdk, runtime, root, gateway };
}
describe("explicit main SDK facade (no real model/GitHub)", () => {
  it("automatically detects model reasoning after saving a gateway through the SDK facade", async () => {
    const modelFetch = vi.fn(async (_url: unknown, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      if (body.reasoning?.effort && !["low", "medium", "high"].includes(body.reasoning.effort))
        return Response.json({ error: { message: "Invalid reasoning.effort, expected 'low', 'medium', 'high'" } }, { status: 400 });
      return Response.json({ output: [] });
    }) as unknown as typeof fetch;
    const { sdk, gateway } = await fixture(undefined, { fetch: modelFetch, resolveHostname: async () => ["93.184.216.34"] });
    await vi.waitFor(async () => expect((await sdk.gateways.list())[0]?.reasoningDetection?.fixture?.status).toBe("verified"));
    expect((await sdk.gateways.list())[0]?.modelReasoning?.fixture).toMatchObject({ parameter: "reasoning.effort", defaultOptionId: "high" });
    expect(gateway.id).toBeDefined();
  });
  it("delegates Git-off start/completion to main and retains terminal replay after reconnect", async () => {
    const { sdk, runtime, gateway } = await fixture();
    const run = await sdk.start({ title: "Main facade", requirement: "Bounded fixture", workflow: mainOnly(),
      gatewayBindings: { defaultGatewayId: gateway.id } });
    expect((await run.wait()).status).toBe("completed");
    const events = [];
    for await (const event of run.events()) events.push(event);
    expect(events.some((event) => event.type === "project.completed")).toBe(true);
    expect(events.map((event) => event.seq)).toEqual([...new Set(events.map((event) => event.seq))].sort((a, b) => a - b));
    const after = events[1].seq;
    const replay = [];
    for await (const event of run.events({ afterSeq: after, follow: false })) replay.push(event);
    expect(replay).toEqual(events.filter((event) => event.seq > after));
    expect(await sdk.listRuns()).toHaveLength(1);
    expect((await (await sdk.getRun(run.id)).snapshot()).git).toEqual({ enabled: false, status: "disabled" });
    await expect(run.resume()).rejects.toThrow(/completed/);
    expect((await runtime.storage.loadState(run.id)).agents.main.gatewaySnapshot?.apiKey).toBe("opaque-fixture-key");
    expect(JSON.stringify(await run.snapshot())).not.toContain("opaque-fixture-key");
  });
  it("does not mutate projects for missing bindings or conflicting workspace inputs", async () => {
    const { sdk, root, gateway } = await fixture();
    const input = { title: "Rejected", requirement: "No project mutation", workflow: mainOnly(), gatewayBindings: {} };
    await expect(sdk.start(input)).rejects.toThrow(/binding required/);
    await expect(sdk.start({ ...input, gatewayBindings: { agents: { unknown: "invalid" } } })).rejects.toThrow(/unknown Agent/);
    await expect(sdk.start({ ...input, workflow: mainOnly(true), gatewayBindings: { defaultGatewayId: gateway.id },
      workspace: await directory(), sourceWorkspace: { path: root } })).rejects.toThrow(/mutually exclusive/);
    expect(await sdk.listRuns()).toEqual([]);
    expect(await fs.readdir(path.join(root, "projects"))).toEqual([]);
  });
  it("replays multiple pages and excludes events appended after the history-only boundary", async () => {
    const { sdk, runtime, gateway } = await fixture();
    const run = await sdk.start({ title: "Paged", requirement: "Replay fixture", workflow: mainOnly(), gatewayBindings: { defaultGatewayId: gateway.id } });
    await run.wait();
    // Terminal state can be visible before the kernel's final event writes
    // settle. This fixture becomes the sole trusted writer before loading
    // its own eventSeq; otherwise two state objects allocate duplicate seqs.
    await runtime.orchestrator.waitForIdle(run.id);
    const state = await runtime.storage.loadState(run.id);
    const view = await runtime.orchestrator.getProject(run.id);
    // Direct append is a trusted test seam; mirror its state into the read model just as the kernel does.
    vi.spyOn(runtime.orchestrator, "getProject").mockImplementation(async () => ({ ...view!, eventSeq: state.eventSeq }));
    for (let i = 0; i < 520; i++) await runtime.storage.appendEvent(state, { type: "agent.trace", message: `page-${i}` });
    const boundary = (await run.snapshot()).eventSeq;
    const iterator = run.events({ follow: false })[Symbol.asyncIterator]();
    const first = await iterator.next();
    await runtime.storage.appendEvent(state, { type: "agent.trace", message: "after-boundary" });
    const events = [first.value];
    for await (const event of { [Symbol.asyncIterator]: () => iterator }) events.push(event);
    expect(events.at(-1).seq).toBe(boundary);
    expect(events.map((event) => event.seq).filter((seq) => seq <= boundary)).toHaveLength(boundary);
    expect(events.some((event) => event.message === "after-boundary")).toBe(false);
  });
  it("wakes wait/event consumers on close and permits a failed Stop to be retried", async () => {
    const { sdk, runtime, gateway } = await fixture(async (request) => {
      await new Promise<void>((resolve) => request.signal.addEventListener("abort", () => resolve(), { once: true }));
      throw new Error("stopped fixture");
    });
    const run = await sdk.start({ title: "Stop", requirement: "Stop fixture", workflow: mainOnly(), gatewayBindings: { defaultGatewayId: gateway.id } });
    const waiting = run.wait().catch((error) => error);
    const following = (async () => { try { for await (const _ of run.events()) { /* Drain */ } } catch (error) { return error; } })();
    const realClose = runtime.close.bind(runtime);
    vi.spyOn(runtime, "close").mockRejectedValueOnce(new Error("Stop not confirmed")).mockImplementation(realClose);
    await expect(sdk.close()).rejects.toThrow(/Stop not confirmed/);
    expect(await waiting).toBeInstanceOf(Error);
    expect(await following).toBeInstanceOf(Error);
    await expect(run.snapshot()).rejects.toThrow(/closed/);
    await sdk.close();
    await sdk.close();
  });
  it("unsubscribes a consumer abandoned at yield when the SDK closes", async () => {
    const { sdk, runtime, gateway } = await fixture();
    const run = await sdk.start({ title: "Abandoned observer", requirement: "No retained event subscription", workflow: mainOnly(),
      gatewayBindings: { defaultGatewayId: gateway.id } });
    await run.wait();
    const realSubscribe = runtime.eventHub.subscribe.bind(runtime.eventHub);
    const released = vi.fn();
    vi.spyOn(runtime.eventHub, "subscribe").mockImplementation((id, listener) => {
      const dispose = realSubscribe(id, listener);
      return () => { released(); dispose(); };
    });
    const iterator = run.events()[Symbol.asyncIterator]();
    await iterator.next();
    await sdk.close();
    expect(released).toHaveBeenCalled();
    await iterator.return?.();
  });
  it("aborting event consumption does not cancel the project, and redacts nested event data/errors", async () => {
    const { sdk, runtime, gateway } = await fixture(async (request) => {
      if (request.signal.aborted) throw new Error("already stopped");
      await new Promise<void>((resolve) => request.signal.addEventListener("abort", () => resolve(), { once: true }));
      throw new Error("stopped fixture");
    });
    const run = await sdk.start({ title: "Abort", requirement: "Abort reader only", workflow: mainOnly(), gatewayBindings: { defaultGatewayId: gateway.id } });
    const abort = new AbortController();
    const iterator = run.events({ signal: abort.signal })[Symbol.asyncIterator]();
    await iterator.next(); abort.abort();
    await expect(iterator.next()).rejects.toThrow();
    expect((await run.snapshot()).status).not.toBe("cancelled");
    expect((await run.cancel()).status).toMatch(/cancel/);
    const state = await runtime.storage.loadState(run.id);
    const view = await runtime.orchestrator.getProject(run.id);
    vi.spyOn(runtime.orchestrator, "getProject").mockImplementation(async () => ({ ...view!, eventSeq: state.eventSeq }));
    const event = await runtime.storage.appendEvent(state, { type: "agent.trace", message: "opaque-fixture-key",
      data: { nested: { apiKey: "opaque-fixture-key", token: "secret", harmless: "opaque-fixture-key" } } });
    const history = [];
    for await (const item of run.events({ afterSeq: event.seq - 1, follow: false })) history.push(item);
    expect(JSON.stringify(history)).not.toContain("opaque-fixture-key");
    expect(history[0].data?.nested).toEqual({ harmless: "[REDACTED]" });
    vi.spyOn(runtime.orchestrator, "pause").mockRejectedValueOnce(new Error("opaque-fixture-key"));
    await expect(run.pause()).rejects.toThrow("[REDACTED]");
  });
  it("retains parallel/Git facts and removes embedded credentials instead of exposing complete internal state", async () => {
    const { sdk, runtime } = await fixture();
    const state = { id: "prj_00000000000000000000000000000001", agents: { main: { gatewaySnapshot: { apiKey: "opaque-fixture-key" } } },
      git: { enabled: true, status: "ready" }, scopedExecutions: [{ id: "a" }, { id: "b" }],
      collaboration: { stateRevision: 9, frozen: false }, runtime: { activeExecutionIds: ["a", "b"] },
      mainInvocationContext: { capability: "private" } };
    vi.spyOn(runtime.orchestrator, "getProject").mockResolvedValue(state as never);
    const view = await (await sdk.getRun(state.id)).snapshot();
    expect(view.scopedExecutions).toHaveLength(2);
    expect(view.collaboration?.stateRevision).toBe(9);
    expect(view).not.toHaveProperty("agents");
    expect(view).not.toHaveProperty("mainInvocationContext");
  });
  it("validates executable overrides before creating data and reports packaged Pi availability", async () => {
    const root = await directory();
    await expect(createMainResearchSdk({ dataDir: root, harnesses: { codex: { executable: process.execPath, args: ["ignored"] } } as never })).rejects.toThrow(/executable\+args/);
    expect(await fs.readdir(root)).toEqual([]);
    await expect(createMainResearchSdk({ dataDir: root, harnesses: { codex: path.join(root, "missing.exe") } })).rejects.toThrow();
    expect(await fs.readdir(root)).toEqual([]);
    const sdk = await createMainResearchSdk({ dataDir: root }); sdks.push(sdk);
    expect((await sdk.harnesses()).find((harness) => harness.id === "pi")?.available).toBe(true);
  });
  it("redacts opaque and URL-encoded rotating Git tokens", () => {
    const redactor = mainRedactor(); redactor.remember("opaque+/=fixture");
    expect(redactor.clean({ message: "opaque+/=fixture " + encodeURIComponent("opaque+/=fixture"), token: "nested" }))
      .toEqual({ message: "[REDACTED] [REDACTED]" });
  });
});
